// LandSale: Prototype Test
// This test executes a successful buying scenario

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

// block utils
const {
	extract_gas,
} = require("../include/block_utils");

// number utils
const {random_element} = require("../include/number_utils");

// land data utils
const {
	generate_land,
	plot_to_leaf,
	plot_to_metadata,
} = require("./include/land_data_utils");

// deployment routines in use
const {
	land_sale_deploy,
	land_sale_init,
} = require("./include/deployment_routines");

// run land sale prototype test
contract("LandSale: Prototype Test", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// deploy and initialize the sale
	let land_sale, land_nft, sIlv;
	beforeEach(async function() {
		({land_sale, land_nft, sIlv} = await land_sale_deploy(a0));
	});

	// define constants to generate plots
	const n = 100_000; // number of plots to generate

	// generate the land sale data, and construct the Merkle tree
	log.debug("generating %o land plots", n);
	const {plots, tree, root} = generate_land(n);
	log.info("generated %o land plots", n);

	// verify the tree by picking up some random element and validating its proof
	const plot = random_element(plots.filter(p => p.tierId >= 5));
	const metadata = plot_to_metadata(plot);
	const leaf = plot_to_leaf(plot);
	const proof = tree.getHexProof(leaf);
	assert(
		tree.verify(tree.getProof(leaf), leaf, root),
		"Merkle tree construction failed: unable to verify random leaf " + plot.tokenId
	);
	log.info("successfully constructed the Merkle tree for %o land plots", n);

	describe("after Merkle root is registered", function() {
		// register the Merkle root within the sale
		beforeEach(async function() {
			await land_sale.setInputDataRoot(root, {from: a0});
		});
		// verify if the plot is registered on sale
		it(`random plot ${plot.tokenId} is registered on sale`, async function() {
			expect(await land_sale.isPlotValid(metadata, proof)).to.be.true;
		});

		describe("after sale is initialized", function() {
			let sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices;
			beforeEach(async function() {
				({sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices} =
					await land_sale_init(a0, land_sale));
			});
			describe(`random plot ${plot.tokenId} tier ${plot.tierId} can be bought with ETH`,  function() {
				// buyer is going to buy for the half of the starting price
				const buyer = a1;
				let t, p2;
				beforeEach(async function() {
					p2 = start_prices[plot.tierId].divn(2);
					// therefore buyer is going to wait for a halving time, meaning he buys at
					t = sale_start + plot.sequenceId * seq_offset + halving_time;
				});

				let receipt;
				beforeEach(async function() {
					// adjust the time so that the plot can be bought for a half of price
					await land_sale.setNow32(t);
					// do the buy for a half of the price
					receipt = await land_sale.buy(metadata, proof, {from: buyer, value: p2});
				});

				function consumes_no_more_than(gas, used) {
					// tests marked with @skip-on-coverage will are removed from solidity-coverage,
					// see yield-solcover.js, see https://github.com/sc-forks/solidity-coverage/blob/master/docs/advanced.md
					it(`consumes no more than ${gas} gas  [ @skip-on-coverage ]`, async function() {
						const gasUsed = used? used: extract_gas(receipt);
						expect(gasUsed).to.be.lte(gas);
						if(gas - gasUsed > gas / 20) {
							console.log("only %o gas was used while expected up to %o", gasUsed, gas);
						}
					});
				}

				it(`"PlotBought" event is emitted`, async function() {
					expectEvent(receipt, "PlotBought", {
						_by: buyer,
						_plotData: metadata,
						// _plot: an actual plot contains randomness and cannot be fully guessed
						_eth: "0",
						_sIlv: "0",
					});
				});
				it("LandERC721 token gets minted (ERC721 Transfer event)", async function() {
					await expectEvent.inTransaction(receipt.tx, land_nft,"Transfer", {
						// note: Zeppelin ERC721 impl event args use non-ERC721 names without _
						from: ZERO_ADDRESS,
						to: buyer,
						tokenId: plot.tokenId + "",
					});
				});
				it("minted LandERC721 token metadata is as expected", async function() {
					const metadata = await land_nft.getMetadata(plot.tokenId);
					expect(metadata.regionId, "unexpected regionId").to.be.bignumber.that.equals(plot.regionId + "");
					expect(metadata.x, "unexpected x").to.be.bignumber.that.equals(plot.x + "");
					expect(metadata.y, "unexpected y").to.be.bignumber.that.equals(plot.y + "");
					expect(metadata.tierId, "unexpected tierId").to.be.bignumber.that.equals(plot.tierId + "");
					expect(metadata.size, "unexpected size").to.be.bignumber.that.equals(plot.size + "");
				});
				consumes_no_more_than(554431);
			});
			describe(`random plot ${plot.tokenId} tier ${plot.tierId} can be bought with sILV`,  function() {
				// buyer is going to buy for the half of the starting price
				const buyer = a1;
				let t, p2;
				beforeEach(async function() {
					p2 = start_prices[plot.tierId].divn(2);
					// therefore buyer is going to wait for a halving time, meaning he buys at
					t = sale_start + plot.sequenceId * seq_offset + halving_time;
				});

				let receipt;
				beforeEach(async function() {
					// adjust the time so that the plot can be bought for a half of price
					await land_sale.setNow32(t);
					// mint and approve sILV require
					await sIlv.mint(buyer, p2, {from: a0});
					await sIlv.approve(land_sale.address, p2, {from: buyer});
					// do the buy for a half of the price
					receipt = await land_sale.buy(metadata, proof, {from: buyer});
				});

				function consumes_no_more_than(gas, used) {
					// tests marked with @skip-on-coverage will are removed from solidity-coverage,
					// see yield-solcover.js, see https://github.com/sc-forks/solidity-coverage/blob/master/docs/advanced.md
					it(`consumes no more than ${gas} gas  [ @skip-on-coverage ]`, async function() {
						const gasUsed = used? used: extract_gas(receipt);
						expect(gasUsed).to.be.lte(gas);
						if(gas - gasUsed > gas / 20) {
							console.log("only %o gas was used while expected up to %o", gasUsed, gas);
						}
					});
				}

				it(`"PlotBought" event is emitted`, async function() {
					expectEvent(receipt, "PlotBought", {
						_by: buyer,
						_plotData: metadata,
						// _plot: an actual plot contains randomness and cannot be fully guessed
						_eth: "0",
						_sIlv: "0",
					});
				});
				it("LandERC721 token gets minted (ERC721 Transfer event)", async function() {
					await expectEvent.inTransaction(receipt.tx, land_nft,"Transfer", {
						// note: Zeppelin ERC721 impl event args use non-ERC721 names without _
						from: ZERO_ADDRESS,
						to: buyer,
						tokenId: plot.tokenId + "",
					});
				});
				it("minted LandERC721 token metadata is as expected", async function() {
					const metadata = await land_nft.getMetadata(plot.tokenId);
					expect(metadata.regionId, "unexpected regionId").to.be.bignumber.that.equals(plot.regionId + "");
					expect(metadata.x, "unexpected x").to.be.bignumber.that.equals(plot.x + "");
					expect(metadata.y, "unexpected y").to.be.bignumber.that.equals(plot.y + "");
					expect(metadata.tierId, "unexpected tierId").to.be.bignumber.that.equals(plot.tierId + "");
					expect(metadata.size, "unexpected size").to.be.bignumber.that.equals(plot.size + "");
				});
				consumes_no_more_than(587887);
			});
		});
	});
});
