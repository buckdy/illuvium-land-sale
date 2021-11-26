// LandERC721: Metadata related Tests

// Zeppelin test helpers
const {
	BN,
	constants,
	expectEvent,
	expectRevert,
} = require("@openzeppelin/test-helpers");
const {
	assert,
	expect,
} = require("chai");
const {
	ZERO_ADDRESS,
	ZERO_BYTES32,
	MAX_UINT256,
} = constants;
// enable chai-subset to allow containSubset, see https://www.chaijs.com/plugins/chai-subset/
//require("chai").use(require("chai-subset"));

// land data utils
const {
	generate_land_plot,
	generate_land_plot_metadata,
	plot_to_metadata,
} = require("./include/land_data_utils");

// deployment routines in use
const {
	land_nft_deploy,
} = require("./include/deployment_routines");

// run Metadata tests
contract("LandERC721: Metadata tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3] = accounts;

	// deploy token
	let token;
	beforeEach(async function() {
		token = await land_nft_deploy(a0);
	});

	// default token owner address and token_id to use
	const to = a1;
	const token_id = 1;

	async function mint(token_id) {
		return await token.mint(to, token_id, {from: a0});
	}

	async function mint_with_meta(token_id) {
		return await token.mintWithMetadata(to, token_id, generate_land_plot_metadata(), {from: a0});
	}

	async function burn(token_id) {
		return await token.burn(token_id, {from: a0});
	}

	async function set_metadata(token_id, metadata = generate_land_plot_metadata()) {
		return await token.setMetadata(token_id, metadata, {from: a0});
	}

	function test_set_metadata(token_id, plot = generate_land_plot()) {
		const metadata = plot_to_metadata(plot);
		let receipt;
		beforeEach(async function() {
			receipt = await set_metadata(token_id, metadata);
		});
		it('"MetadataUpdated" event is emitted', async function() {
			expectEvent(receipt, "MetadataUpdated", {
				_tokenId: token_id + "",
				_plot: metadata,
			});
		});
		it("metadata gets written", async function () {
			expect(await token.hasMetadata(token_id)).to.be.true;
		});
		it("metadata gets written as expected", async function () {
			expect(await token.getMetadata(token_id)).to.be.deep.equal(metadata);
		});
		describe("metadata view looks as expected", function () {
			let metadata_view;
			before(async function() {
				metadata_view = await token.viewMetadata(token_id);
			});
			it("regionId", async function() {
				expect(metadata_view.regionId).to.be.bignumber.that.equals(plot.regionId + "");
			});
			it("x", async function() {
				expect(metadata_view.x).to.be.bignumber.that.equals(plot.x + "");
			});
			it("y", async function() {
				expect(metadata_view.y).to.be.bignumber.that.equals(plot.y + "");
			});
			it("tierId", async function() {
				expect(metadata_view.tierId).to.be.bignumber.that.equals(plot.tierId + "");
			});
			it("size", async function() {
				expect(metadata_view.size).to.be.bignumber.that.equals(plot.size + "");
			});
			describe(`landmarkTypeId matches the tier ${plot.tierId}`,  function() {
				if(plot.tierId < 3) {
					it("no landmark (ID 0) for the tier less than 3", async function() {
						expect(metadata_view.landmarkTypeId).to.be.bignumber.that.equals("0");
					});
				}
				else if(plot.tierId < 4) {
					it("element landmark (ID 1-3) for the tier 3", async function() {
						expect(metadata_view.landmarkTypeId).to.be.bignumber.that.is.closeTo("2", "1");
					});
				}
				else if(plot.tierId < 5) {
					it("fuel landmark (ID 4-6) for the tier 4", async function() {
						expect(metadata_view.landmarkTypeId).to.be.bignumber.that.is.closeTo("5", "1");
					});
				}
				else if(plot.tierId < 6) {
					it("Arena landmark (ID 7) for the tier 5", async function() {
						expect(metadata_view.landmarkTypeId).to.be.bignumber.that.equals("7");
					});
				}
				else {
					it(`unexpected tier ${plot.tierId}`, async function() {
						expect(false);
					});
				}
			});
			{
				const num_sites = [0, 3, 6, 9, 12, 15];
				it(`number of element sites (${num_sites[plot.tierId]}) matches the tier (${plot.tierId})`, async function() {
					const sites = metadata_view.sites.filter(s => s.typeId >= 1 && s.typeId <= 3);
					expect(sites.length).to.equal(num_sites[plot.tierId]);
				});
			}
			{
				const num_sites = [0, 1, 3, 6, 9, 12];
				it(`number of fuel sites (${num_sites[plot.tierId]}) matches the tier (${plot.tierId})`, async function() {
					const sites = metadata_view.sites.filter(s => s.typeId >= 4 && s.typeId <= 6);
					expect(sites.length).to.equal(num_sites[plot.tierId]);
				});
			}
		});
		it("plot location gets occupied as expected", async function() {
			const regionId = new BN(plot.regionId);
			const x = new BN(plot.x);
			const y = new BN(plot.y);
			const loc = regionId.shln(32).or(y.shln(16)).or(x);
			await expect(await token.plotLocations(loc)).to.be.bignumber.that.equals(token_id + "");
		});
	}

	async function remove_metadata(token_id) {
		return token.removeMetadata(token_id, {from: a0})
	}

	function test_remove_metadata(token_id, fn = remove_metadata) {
		let metadata, receipt;
		beforeEach(async function() {
			metadata = await token.getMetadata(token_id);
			receipt = await fn.call(this, token_id);
		});
		it('"MetadataRemoved" event is emitted', async function() {
			expectEvent(receipt, "MetadataRemoved", {
				_tokenId: token_id + "",
				_plot: metadata,
			});
		});
		it("metadata gets removed", async function () {
			expect(await token.hasMetadata(token_id)).to.be.false;
		});
		it("plot location gets erased as expected", async function() {
			const regionId = new BN(metadata.regionId);
			const x = new BN(metadata.x);
			const y = new BN(metadata.y);
			const loc = regionId.shln(32).or(y.shln(16)).or(x);
			await expect(await token.plotLocations(loc)).to.be.bignumber.that.equals("0");
		});
	}

	it("impossible to mint a token with a zero ID (plot location constraint)", async function() {
		await expectRevert(mint_with_meta(0), "zero ID");
		await mint_with_meta(1);
	});

	describe("metadata can be pre-set for non-existing token", function() {
		test_set_metadata(token_id);
	});
	describe("metadata can be updated for non-existing token", function() {
		beforeEach(async function() {
			await set_metadata(token_id);
		});
		test_set_metadata(token_id);
	});
	describe("metadata can be removed for non-existing token", function() {
		beforeEach(async function() {
			await set_metadata(token_id);
		});
		test_remove_metadata(token_id);
	});
	describe("metadata cannot be set/changed for existing token", function() {
		beforeEach(async function() {
			await mint_with_meta(token_id);
		});
		it("setMetadata reverts", async function() {
			await expectRevert(set_metadata(token_id), "token exists");
		});
	});
	describe("metadata cannot be removed for existing token", function() {
		beforeEach(async function() {
			await mint_with_meta(token_id);
		});
		it("removeMetadata reverts", async function() {
			await expectRevert(remove_metadata(token_id), "token exists");
		});
	});
	describe("burning a token removes its metadata", function() {
		beforeEach(async function() {
			await mint_with_meta(token_id);
		});
		test_remove_metadata(token_id, burn);
	});
	describe("impossible to mint a token without metadata", function() {
		it("mint reverts", async function() {
			await expectRevert(mint(token_id), "no metadata");
			await set_metadata(token_id);
			await mint(token_id);
		});
	});
	describe("impossible to register a plot with the size less than 32", function() {
		const plot1 = generate_land_plot();
		const plot2 = generate_land_plot();
		plot1.size = 31;
		plot2.size = 32;
		const metadata1 = plot_to_metadata(plot1);
		const metadata2 = plot_to_metadata(plot2);
		it("setMetadata reverts", async function() {
			await expectRevert(set_metadata(token_id, metadata1), "too small");
			await set_metadata(token_id, metadata2);
		});
	});
	describe("impossible to register two plots in the same location", function() {
		const plot1 = generate_land_plot();
		const plot2 = generate_land_plot();
		plot2.regionId = plot1.regionId;
		plot2.x = plot1.x;
		plot2.y = plot1.y;
		const metadata1 = plot_to_metadata(plot1);
		const metadata2 = plot_to_metadata(plot2);
		beforeEach(async function() {
			await set_metadata(token_id, metadata1);
		});
		it("setMetadata reverts", async function() {
			await expectRevert(set_metadata(token_id, metadata2), "spot taken");
		});
	});
});