// LandSale: Business Logic Tests

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// Zeppelin test helpers
const {
	BN,
	balance,
	constants,
	expectEvent,
	expectRevert,
} = require("@openzeppelin/test-helpers");
const {
	ZERO_ADDRESS,
	ZERO_BYTES32,
	MAX_UINT256,
} = constants;

// Chai test helpers
const {
	assert,
	expect,
} = require("chai");

// number utils
const {random_element} = require("../include/number_utils");

// land data utils
const {
	generate_land,
	plot_to_leaf,
} = require("./include/land_data_utils");

// deployment routines in use
const {
	land_nft_deploy_restricted,
	zeppelin_erc721_deploy_restricted,
	DEFAULT_LAND_SALE_PARAMS,
	land_sale_init,
	land_sale_deploy,
	land_sale_deploy_pure,
} = require("./include/deployment_routines");

// run land sale tests
contract("LandSale: Business Logic Tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	describe("deployment", function() {
		it("fails if target NFT contract is not set", async function() {
			await expectRevert(land_sale_deploy_pure(a0, ZERO_ADDRESS), "target contract is not set");
		});
		it("fails if target NFT contract doesn't have ERC721 interface");
		it("fails if target NFT contract doesn't have MintableERC721 interface");
		it("fails if target NFT contract doesn't have LandERC721Metadata interface", async function() {
			const targetContract = await zeppelin_erc721_deploy_restricted(a0);
			await expectRevert(land_sale_deploy_pure(a0, targetContract.address), "unexpected target type");
		});
		describe("succeeds otherwise", function() {
			let land_sale, land_nft;
			beforeEach(async function() {
				land_nft = await land_nft_deploy_restricted(a0);
				land_sale = await land_sale_deploy_pure(a0, land_nft.address);
			});
			it("target NFT contract gets set as expected", async function() {
				expect(await land_sale.targetContract()).to.be.equal(land_nft.address);
			});
			it("input data Merkle root is not set", async function() {
				expect(await land_sale.root()).to.equal(ZERO_BYTES32);
			});
			it("saleStart is not set", async function() {
				expect(await land_sale.saleStart()).to.be.bignumber.that.equals("0");
			});
			it("saleEnd is not set", async function() {
				expect(await land_sale.saleEnd()).to.be.bignumber.that.equals("0");
			});
			it("halvingTime is not set", async function() {
				expect(await land_sale.halvingTime()).to.be.bignumber.that.equals("0");
			});
			it("seqDuration is not set", async function() {
				expect(await land_sale.seqDuration()).to.be.bignumber.that.equals("0");
			});
			it("seqOffset is not set", async function() {
				expect(await land_sale.seqOffset()).to.be.bignumber.that.equals("0");
			});
			it("startPrices are not set", async function() {
				expect(await land_sale.getStartPrices()).to.be.deep.equal([]);
			});
			it("beneficiary is not set", async function() {
				expect(await land_sale.beneficiary()).to.equal(ZERO_ADDRESS);
			});
			it("sale is not active", async function() {
				expect(await land_sale.isActive()).to.be.false;
			});
		})
	});

	describe("when sale is deployed", function() {
		let land_sale, land_nft;
		beforeEach(async function() {
			({land_sale, land_nft} = await land_sale_deploy(a0));
		});

		describe("setting the input data root: setInputDataRoot()", function() {
			const {plots, leaves, tree, root} = generate_land(10);
			beforeEach(async function() {
				await land_sale.setInputDataRoot(root, {from: a0});
			});
			it("allows validating random plot data entry from the Merkle tree set: isPlotValid", async function() {
				const i = 3;
				expect(await land_sale.isPlotValid(plots[i], tree.getHexProof(leaves[i]))).to.be.true;
			});
		});
		{
			const initialize = async (
				sale_start = 0xFFFF_FFFF,
				sale_end = 0xFFFF_FFFF,
				halving_time = 0xFFFF_FFFF,
				seq_duration = 0xFFFF_FFFF,
				seq_offset = 0xFFFF_FFFF,
				start_prices = [(new BN(2).pow(new BN(96))).subn(1)] // 0xFFFFFFFF_FFFFFFFF_FFFFFFFF
			) => await land_sale.initialize(sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices, {from: a0});

			const flatten = (array) => array.map(e => e + "");

			const {sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices} = DEFAULT_LAND_SALE_PARAMS
			describe("initialization: initialize()", function() {
				let receipt;
				beforeEach(async function() {
					receipt = await initialize(sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices);
				});
				it("sets saleStart as expected", async function() {
					expect(await land_sale.saleStart()).to.be.bignumber.that.equals(sale_start + "");
				});
				it("sets saleEnd as expected", async function() {
					expect(await land_sale.saleEnd()).to.be.bignumber.that.equals(sale_end + "");
				});
				it("sets halvingTime as expected", async function() {
					expect(await land_sale.halvingTime()).to.be.bignumber.that.equals(halving_time + "");
				});
				it("sets seqDuration as expected", async function() {
					expect(await land_sale.seqDuration()).to.be.bignumber.that.equals(seq_duration + "");
				});
				it("sets seqOffset as expected", async function() {
					expect(await land_sale.seqOffset()).to.be.bignumber.that.equals(seq_offset + "");
				});
				it("sets startPrices as expected", async function() {
					expect(flatten(await land_sale.getStartPrices())).to.deep.equal(flatten(start_prices));
				});
				it('emits "Initialized" event', async function() {
					expectEvent(receipt, "Initialized", {
						_by: a0,
						_saleStart: sale_start + "",
						_saleEnd: sale_end + "",
						_halvingTime: halving_time + "",
						_seqDuration: seq_duration + "",
						_seqOffset: seq_offset + "",
						// _startPrices: start_prices, // this doesn't work: use the next line instead
					});
					expect(flatten(receipt.logs[0].args["_startPrices"])).to.deep.equal(flatten(start_prices));
				});
			});
			describe("partial initialization: initialize()", function() {
				it(`when saleStart is "unset" (0xFFFFFFFF) it remains unchanged`, async function() {
					await initialize(undefined, sale_end, halving_time, seq_duration, seq_offset, start_prices);
					expect(await land_sale.saleStart()).to.be.bignumber.that.equals("0");
					expect(await land_sale.saleEnd(), "saleEnd didn't change").to.be.bignumber.that.equals(sale_end + "");
				});
				it(`when saleEnd is "unset" (0xFFFFFFFF) it remains unchanged`, async function() {
					await initialize(sale_start, undefined, halving_time, seq_duration, seq_offset, start_prices);
					expect(await land_sale.saleEnd()).to.be.bignumber.that.equals("0");
					expect(await land_sale.halvingTime(), "halvingTime didn't change").to.be.bignumber.that.equals(halving_time + "");
				});
				it(`when halvingTime is "unset" (0xFFFFFFFF) it remains unchanged`, async function() {
					await initialize(sale_start, sale_end, undefined, seq_duration, seq_offset, start_prices);
					expect(await land_sale.halvingTime()).to.be.bignumber.that.equals("0");
					expect(await land_sale.seqDuration(), "seqDuration didn't change").to.be.bignumber.that.equals(seq_duration + "");
				});
				it(`when seqDuration is "unset" (0xFFFFFFFF) it remains unchanged`, async function() {
					await initialize(sale_start, sale_end, halving_time, undefined, seq_offset, start_prices);
					expect(await land_sale.seqDuration()).to.be.bignumber.that.equals("0");
					expect(await land_sale.seqOffset(), "seqOffset didn't change").to.be.bignumber.that.equals(seq_offset + "");
				});
				it(`when seqOffset is "unset" (0xFFFFFFFF) it remains unchanged`, async function() {
					await initialize(sale_start, sale_end, halving_time, seq_duration, undefined, start_prices);
					expect(await land_sale.seqOffset()).to.be.bignumber.that.equals("0");
					expect(flatten(await land_sale.getStartPrices()), "startPrices didn't change").to.deep.equal(flatten(start_prices));
				});
				it(`when startPrices is "unset" ([0xFFFFFFFFFFFFFFFFFFFFFFFF]) it remains unchanged`, async function() {
					await initialize(sale_start, sale_end, halving_time, seq_duration, seq_offset, undefined);
					expect(await land_sale.getStartPrices()).to.deep.equal([]);
					expect(await land_sale.saleStart(), "saleStart didn't change").to.be.bignumber.that.equals(sale_start + "");
				});
			});
		}
		describe("setting the beneficiary: setBeneficiary()", function() {
			function set_and_check(beneficiary) {
				let receipt
				beforeEach(async function() {
					receipt = await land_sale.setBeneficiary(beneficiary, {from: a0});
				});
				it('"BeneficiaryUpdated" event is emitted', async function() {
					expectEvent(receipt, "BeneficiaryUpdated", {
						_by: a0,
						_beneficiary: beneficiary,
					});
				});
				it("beneficiary set as expected", async function() {
					expect(await land_sale.beneficiary()).to.equal(beneficiary);
				});
			}
			describe("setting the beneficiary", function() {
				set_and_check(a1);
				describe("updating the beneficiary", function() {
					set_and_check(a2);
				});
				describe("removing the beneficiary", function() {
					set_and_check(ZERO_ADDRESS);
				});
			});
		});

		describe("when sale is initialized and input data root is set", function() {
			// TODO: implement the tests
		});
	});
});
