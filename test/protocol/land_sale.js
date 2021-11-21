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

// block utils
const {
	extract_gas,
	extract_gas_cost,
} = require("../include/block_utils");

// number utils
const {
	random_int,
	random_element,
} = require("../include/number_utils");

// BN utils
const {
	random_hex,
	random_bn,
} = require("../include/bn_utils");

// land data utils
const {
	generate_land,
	print_plot,
	plot_to_leaf,
	plot_to_metadata,
} = require("./include/land_data_utils");

// land sale utils
const {
	price_formula_sol,
} = require("./include/land_sale_utils");

// deployment routines in use
const {
	erc20_deploy,
	sIlv_mock_deploy,
	land_nft_deploy_restricted,
	erc721_deploy_restricted,
	DEFAULT_LAND_SALE_PARAMS,
	land_sale_init,
	land_sale_deploy,
	land_sale_deploy_pure,
	oracle_mock_deploy,
} = require("./include/deployment_routines");

// run land sale tests
contract("LandSale: Business Logic Tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3, a4, a5] = accounts;

	describe("deployment", function() {
		it("fails if target NFT contract is not set", async function() {
			const sIlvContract = await sIlv_mock_deploy(a0);
			const oracleMock = await oracle_mock_deploy(a0);
			await expectRevert(land_sale_deploy_pure(a0, ZERO_ADDRESS, sIlvContract.address, oracleMock.address), "target contract is not set");
		});
		it("fails if sILV contract is not set", async function() {
			const targetContract = await land_nft_deploy_restricted(a0);
			const oracleMock = await oracle_mock_deploy(a0);
			await expectRevert(land_sale_deploy_pure(a0, targetContract.address, ZERO_ADDRESS, oracleMock.address), "sILV contract is not set");
		});
		it("fails if price oracle contract is not set", async function() {
			const targetContract = await land_nft_deploy_restricted(a0);
			const sIlvContract = await sIlv_mock_deploy(a0);
			await expectRevert(land_sale_deploy_pure(a0, targetContract.address, sIlvContract.address, ZERO_ADDRESS), "oracle address is not set");
		});
		it("fails if target NFT contract doesn't have ERC721 interface", async function() {
			const targetContract = await erc20_deploy(a0); // mess up the ERC721 interface
			const sIlvContract = await sIlv_mock_deploy(a0);
			const oracleMock = await oracle_mock_deploy(a0);
			await expectRevert(land_sale_deploy_pure(a0, targetContract.address, sIlvContract.address, oracleMock.address), "unexpected target type");
		});
		it("fails if target NFT contract doesn't have MintableERC721 interface");
		it("fails if target NFT contract doesn't have LandERC721Metadata interface", async function() {
			const targetContract = await erc721_deploy_restricted(a0); // mess up the LandNFT
			const sIlvContract = await sIlv_mock_deploy(a0);
			const oracleMock = await oracle_mock_deploy(a0);
			await expectRevert(land_sale_deploy_pure(a0, targetContract.address, sIlvContract.address, oracleMock.address), "unexpected target type");
		});
		it("fails if sILV contract has wrong UUID", async function() {
			const targetContract = await land_nft_deploy_restricted(a0);
			const erc20Contract = await erc20_deploy(a0); // mess up the sILV UID
			const oracleMock = await oracle_mock_deploy(a0);
			await expectRevert(land_sale_deploy_pure(a0, targetContract.address, erc20Contract.address, oracleMock.address), "unexpected sILV UID");
		});
		it("fails if price oracle contract doesn't have LandSaleOracle interface", async function() {
			const targetContract = await land_nft_deploy_restricted(a0);
			const sIlvContract = await sIlv_mock_deploy(a0);
			const oracleMock = await sIlv_mock_deploy(a0); // mess up the oracle
			await expectRevert(land_sale_deploy_pure(a0, targetContract.address, sIlvContract.address, oracleMock.address), "unexpected oracle type");
		});
		describe("succeeds otherwise", function() {
			let land_sale, land_nft, sIlv, oracle;
			beforeEach(async function() {
				land_nft = await land_nft_deploy_restricted(a0);
				sIlv = await sIlv_mock_deploy(a0);
				oracle = await oracle_mock_deploy(a0);
				land_sale = await land_sale_deploy_pure(a0, land_nft.address, sIlv.address, oracle.address);
			});
			it("target NFT contract gets set as expected", async function() {
				expect(await land_sale.targetNftContract()).to.be.equal(land_nft.address);
			});
			it("sILV contract gets set as expected", async function() {
				expect(await land_sale.sIlvContract()).to.be.equal(sIlv.address);
			});
			it("oracle contract gets set as expected", async function() {
				expect(await land_sale.priceOracle()).to.be.equal(oracle.address);
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
			it("current time func now32() behaves correctly", async function() {
				const latest_block = await web3.eth.getBlock("latest");
				expect(await land_sale.now32()).to.be.bignumber.that.equals(latest_block.timestamp + "");
			});
		})
	});

	describe("when sale is deployed", function() {
		// deploy the sale
		let land_sale, land_nft, sIlv, oracle;
		beforeEach(async function() {
			({land_sale, land_nft, sIlv, oracle} = await land_sale_deploy(a0));
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
			it("doesn't allow to buy a plot (inactive sale)", async function() {
				await expectRevert(land_sale.buy(
					plots[0],
					tree.getHexProof(leaves[0]),
					{from: a1, value: DEFAULT_LAND_SALE_PARAMS.start_prices[5]}
				), "inactive sale");
			});
		});

		describe("initialization and partial initialization: initialize()", function() {
			const sale_initialize = async (
				sale_start = 0xFFFF_FFFF,
				sale_end = 0xFFFF_FFFF,
				halving_time = 0xFFFF_FFFF,
				seq_duration = 0xFFFF_FFFF,
				seq_offset = 0xFFFF_FFFF,
				start_prices = [(new BN(2).pow(new BN(96))).subn(1)] // 0xFFFFFFFF_FFFFFFFF_FFFFFFFF
			) => await land_sale.initialize(sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices, {from: a0});

			const flatten = (array) => array.map(e => e + "");

			const {sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices} = DEFAULT_LAND_SALE_PARAMS;
			describe("initialization: initialize()", function() {
				let receipt;
				beforeEach(async function() {
					receipt = await sale_initialize(sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices);
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
					await sale_initialize(undefined, sale_end, halving_time, seq_duration, seq_offset, start_prices);
					expect(await land_sale.saleStart()).to.be.bignumber.that.equals("0");
					expect(await land_sale.saleEnd(), "saleEnd didn't change").to.be.bignumber.that.equals(sale_end + "");
				});
				it(`when saleEnd is "unset" (0xFFFFFFFF) it remains unchanged`, async function() {
					await sale_initialize(sale_start, undefined, halving_time, seq_duration, seq_offset, start_prices);
					expect(await land_sale.saleEnd()).to.be.bignumber.that.equals("0");
					expect(await land_sale.halvingTime(), "halvingTime didn't change").to.be.bignumber.that.equals(halving_time + "");
				});
				it(`when halvingTime is "unset" (0xFFFFFFFF) it remains unchanged`, async function() {
					await sale_initialize(sale_start, sale_end, undefined, seq_duration, seq_offset, start_prices);
					expect(await land_sale.halvingTime()).to.be.bignumber.that.equals("0");
					expect(await land_sale.seqDuration(), "seqDuration didn't change").to.be.bignumber.that.equals(seq_duration + "");
				});
				it(`when seqDuration is "unset" (0xFFFFFFFF) it remains unchanged`, async function() {
					await sale_initialize(sale_start, sale_end, halving_time, undefined, seq_offset, start_prices);
					expect(await land_sale.seqDuration()).to.be.bignumber.that.equals("0");
					expect(await land_sale.seqOffset(), "seqOffset didn't change").to.be.bignumber.that.equals(seq_offset + "");
				});
				it(`when seqOffset is "unset" (0xFFFFFFFF) it remains unchanged`, async function() {
					await sale_initialize(sale_start, sale_end, halving_time, seq_duration, undefined, start_prices);
					expect(await land_sale.seqOffset()).to.be.bignumber.that.equals("0");
					expect(flatten(await land_sale.getStartPrices()), "startPrices didn't change").to.deep.equal(flatten(start_prices));
				});
				it(`when startPrices is "unset" ([0xFFFFFFFFFFFFFFFFFFFFFFFF]) it remains unchanged`, async function() {
					await sale_initialize(sale_start, sale_end, halving_time, seq_duration, seq_offset, undefined);
					expect(await land_sale.getStartPrices()).to.deep.equal([]);
					expect(await land_sale.saleStart(), "saleStart didn't change").to.be.bignumber.that.equals(sale_start + "");
				});
			});
		});

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

		describe("rescuing ERC20 tokens lost in the sale smart contract", function() {
			describe("once non-sILV ERC20 tokens are lost in the sale contract", function() {
				// deploy the ERC20 token (not an sILV)
				let token;
				beforeEach(async function() {
					token = await erc20_deploy(a0, H0);
				});

				const value = random_bn(2, 1_000_000_000);
				let receipt;
				beforeEach(async function() {
					receipt = await token.transfer(land_sale.address, value, {from: H0});
				});
				it('ERC20 "Transfer" event is emitted', async function() {
					expectEvent(receipt, "Transfer", {
						from: H0,
						to: land_sale.address,
						value: value,
					});
				});
				it("land sale contract balance increases as expected", async function() {
					expect(await token.balanceOf(land_sale.address)).to.be.bignumber.that.equals(value);
				});

				function rescue(total_value, rescue_value = total_value) {
					total_value = new BN(total_value);
					rescue_value = new BN(rescue_value);
					let receipt;
					beforeEach(async function() {
						receipt = await land_sale.rescueErc20(token.address, a1, rescue_value, {from: a0});
					});
					it('ERC20 "Transfer" event is emitted', async function() {
						await expectEvent.inTransaction(receipt.tx, token, "Transfer", {
							from: land_sale.address,
							to: a1,
							value: rescue_value,
						});
					});
					it("land sale contract balance decreases as expected", async function() {
						expect(await token.balanceOf(land_sale.address)).to.be.bignumber.that.equals(total_value.sub(rescue_value));
					});
					it("token recipient balance increases as expected", async function() {
						expect(await token.balanceOf(a1)).to.be.bignumber.that.equals(rescue_value);
					});
				}

				describe("can rescue all the tokens", function() {
					rescue(value);
				});
				describe("can rescue some tokens", function() {
					rescue(value, value.subn(1));
				});

				it("cannot rescue more than all the tokens", async function() {
					await expectRevert(
						land_sale.rescueErc20(token.address, a1, value.addn(1), {from: a0}),
						"ERC20: transfer amount exceeds balance"
					);
				});
			});
			describe("once sILV ERC20 tokens are lost in the sale contract", function() {
				// link the sILV token
				let token;
				beforeEach(async function() {
					token = sIlv;
				});

				const value = random_bn(2, 1_000_000_000);
				let receipt;
				beforeEach(async function() {
					receipt = await token.mint(land_sale.address, value, {from: a0});
				});
				it('ERC20 "Transfer" event is emitted', async function() {
					expectEvent(receipt, "Transfer", {
						from: ZERO_ADDRESS,
						to: land_sale.address,
						value: value,
					});
				});
				it("land sale contract balance increases as expected", async function() {
					expect(await token.balanceOf(land_sale.address)).to.be.bignumber.that.equals(value);
				});

				it("can't rescue all the tokens", async function() {
					await expectRevert(land_sale.rescueErc20(token.address, a1, value, {from: a0}), "sILV access denied");
				});
				it("can't rescue some tokens", async function() {
					await expectRevert(land_sale.rescueErc20(token.address, a1, value.subn(1), {from: a0}), "sILV access denied");
				});
				it("can't rescue more than all the tokens", async function() {
					await expectRevert(land_sale.rescueErc20(token.address, a1, value.addn(1), {from: a0}), "sILV access denied");
				});
			});
		});

		describe("when sale is initialized, and input data root is set", function() {
			// initialize the sale
			let sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices;
			beforeEach(async function() {
				({sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices} = await land_sale_init(a0, land_sale));
			});
			// generate land plots and setup the merkle tree
			const {plots, tree, root, sequences, tiers} = generate_land(100_000);
			beforeEach(async function() {
				await land_sale.setInputDataRoot(root, {from: a0});
			});
			// setup the pricing oracle
			const eth_out = new BN(1);
			const ilv_in = new BN(4);
			beforeEach(async function() {
				await oracle.setRate(eth_out, ilv_in, {from: a0});
			});
			// define a buyer and supply him with sILV tokens
			const buyer = a1;
			beforeEach(async function() {
				const eth_balance = await balance.current(buyer);
				await sIlv.mint(buyer, eth_balance.mul(ilv_in).div(eth_out), {from: a0});
				await sIlv.approve(land_sale.address, MAX_UINT256, {from: buyer});
			});
			// sale beneficiary (push withdraw)
			const beneficiary = a2;
			// treasury to withdraw to (pull withdraw)
			const treasury = a3;

			/**
			 * Adjusts sale time to the one required to buy a plot
			 * @param plot plot to buy
			 * @param t_seq when we'd like to buy (within a sequence)
			 */
			async function prepare(plot, t_seq = random_int(0, seq_duration)) {
				// if plot is not set – pick random plot
				if(!plot) {
					plot = random_element(plots);
				}

				// calculate the supporting data to pass to buy()
				const metadata = plot_to_metadata(plot);
				const leaf = plot_to_leaf(plot);
				const proof = tree.getHexProof(leaf);

				// determine timings:
				// when this sequence starts and ends
				const seq_start = sale_start + seq_offset * plot.sequenceId
				const seq_end = seq_start + seq_duration;
				// when we'd like to buy (absolute unix timestamp)
				const t = seq_start + t_seq;

				// determine pricing:
				// starting price for the selected tier
				const p0 = start_prices[plot.tierId];
				// p = p(t) - price at the moment `t`
				const p = price_formula_sol(p0, halving_time, t_seq);
				// price in ETH and in sILV based on the oracle data
				const price_eth = p;
				const price_sIlv = p.mul(ilv_in).div(eth_out);

				// set the time to `t`
				await land_sale.setNow32(t, {from: a0});

				// return all the calculations
				return {plot, metadata, proof, seq_start, seq_end, t, price_eth, price_sIlv};
			}

			/**
			 * Runs buy test suite
			 * @param tier_id tier ID to test in
			 * @param cc corner case: -1 for first second buy, 0 somewhere in the middle, 1 for last second buy
			 */
			function buy_test_suite(tier_id, cc = 0) {
				const corner = cc < 0? "left": cc > 0? "right": "middle";

				describe(`buying a random plot in tier ${tier_id} (corner case: ${corner})`, function() {
					const plot = random_element(plots.filter(p => p.tierId === tier_id));
					let metadata, proof, seq_start, seq_end, t, price_eth, price_sIlv;
					beforeEach(async function() {
						const t_seq = cc < 0? 0: cc > 0? seq_duration - 1: random_int(60, seq_duration - 60);
						({metadata, proof, seq_start, seq_end, t, price_eth, price_sIlv} = await prepare(plot, t_seq));
					});

					async function buy(use_sIlv = false, dust_amt = price_eth.divn(10)) {
						// in a Dutch auction model dust ETH will be usually present
						const value = use_sIlv? 0: cc < 0? price_eth: price_eth.add(dust_amt);
						return land_sale.buy(plot, proof, {from: buyer, value});
					}

					it("reverts if merkle root is unset", async function() {
						await land_sale.setInputDataRoot(ZERO_BYTES32, {from: a0});
						await expectRevert(buy(), "empty sale");
					});
					it("reverts if merkle proof is invalid", async function() {
						proof[0] = random_hex();
						await expectRevert(buy(), "invalid plot");
					});
					it("reverts if current time is before sale starts", async function() {
						await land_sale.setNow32(sale_start - 1, {from: a0});
						await expectRevert(buy(), "inactive sale");
					});
					it("reverts if current time is after sale ends", async function() {
						await land_sale.setNow32(sale_end, {from: a0});
						await expectRevert(buy(), "inactive sale");
					});
					it("reverts if current time is before sequence starts", async function() {
						await land_sale.setNow32(seq_start - 1, {from: a0});
						await expectRevert(buy(), plot.sequenceId > 0? "invalid sequence": "inactive sale");
					});
					it("reverts if current time is after sequence ends", async function() {
						await land_sale.setNow32(seq_end, {from: a0});
						await expectRevert(buy(), plot.sequenceId < sequences - 1? "invalid sequence": "inactive sale");
					});
					it("reverts if price for the tier is undefined", async function() {
						await land_sale.initialize(sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices.slice(0, tier_id), {from: a0});
						await expectRevert(buy(), "invalid tier");
					});
					it("reverts if ETH value supplied is lower than the price", async function() {
						price_eth = price_eth.subn(1);
						await expectRevert(buy(false, new BN(0)), "not enough ETH");
					});
					it("reverts if sILV value supplied is lower than the price", async function() {
						await sIlv.approve(land_sale.address, price_sIlv.subn(1), {from: buyer});
						await expectRevert(buy(true), "not enough funds");
					});

					function succeeds(use_sIlv = false, beneficiary = false) {
						before(function() {
							log.debug(
								"buying with %o, beneficiary: %o",
								use_sIlv? "sILV": "ETH",
								beneficiary? beneficiary: "not set"
							);
						});
						// save initial balances for the future comparison:
						// eb: ETH balance; sb: sILV balance
						let buyer_eb0, buyer_sb0, sale_eb0, sale_sb0, beneficiary_eb0, beneficiary_sb0;
						beforeEach(async function() {
							buyer_eb0 = await balance.current(buyer);
							buyer_sb0 = await sIlv.balanceOf(buyer);
							sale_eb0 = await balance.current(land_sale.address);
							sale_sb0 = await sIlv.balanceOf(land_sale.address);

							if(beneficiary) {
								beneficiary_eb0 = await balance.current(beneficiary);
								beneficiary_sb0 = await sIlv.balanceOf(beneficiary);
								await land_sale.setBeneficiary(beneficiary, {from: a0});
							}
						});

						let receipt, gas_cost;
						beforeEach(async function() {
							receipt = await buy(use_sIlv);
							gas_cost = await extract_gas_cost(receipt);
						});
						it('"PlotBought" event is emitted ', async function() {
							const _plot = await land_nft.getMetadata(plot.tokenId);
							expectEvent(receipt, "PlotBought", {
								_by: buyer,
								_plotData: metadata,
								_plot, // an actual plot contains randomness and cannot be fully guessed
								_eth: price_eth,
								_sIlv: use_sIlv? price_sIlv: "0",
							});
						});
						describe("the plot bought is minted as expected", function() {
							it("ERC721::exists: true", async function() {
								expect(await land_nft.exists(plot.tokenId)).to.be.true;
							});
							it("ERC721::ownerOf: buyer", async function() {
								expect(await land_nft.ownerOf(plot.tokenId)).to.equal(buyer);
							});
							it("ERC721::totalSupply: +1", async function() {
								expect(await land_nft.totalSupply()).to.be.bignumber.that.equals("1");
							});
							it("bough plot has metadata", async function() {
								expect(await land_nft.hasMetadata(plot.tokenId)).to.be.true;
							});
							describe("bough plot metadata is set as expected", function() {
								let plot_metadata;
								before(async function() {
									plot_metadata = await land_nft.getMetadata(plot.tokenId);
									log.debug(print_plot(plot_metadata));
								});
								it("regionId matches", async function() {
									expect(plot_metadata.regionId).to.be.bignumber.that.equals(plot.regionId + "");
								});
								it("x-coordinate matches", async function() {
									expect(plot_metadata.x).to.be.bignumber.that.equals(plot.x + "");
								});
								it("y-coordinate matches", async function() {
									expect(plot_metadata.y).to.be.bignumber.that.equals(plot.y + "");
								});
								it("plot size matches", async function() {
									expect(plot_metadata.size).to.be.bignumber.that.equals(plot.size + "");
								});
								it("generator version is 1", async function() {
									expect(plot_metadata.version).to.be.bignumber.that.equals("1");
								});
								it("seed is set", async function() {
									expect(plot_metadata.version).to.be.bignumber.that.is.not.zero;
								});
							});
							describe("bough plot metadata view looks as expected", function() {
								let metadata_view;
								before(async function() {
									metadata_view = await land_nft.viewMetadata(plot.tokenId);
									log.debug(print_plot(metadata_view));
								});
								it("regionId matches", async function() {
									expect(metadata_view.regionId).to.be.bignumber.that.equals(plot.regionId + "");
								});
								it("x-coordinate matches", async function() {
									expect(metadata_view.x).to.be.bignumber.that.equals(plot.x + "");
								});
								it("y-coordinate matches", async function() {
									expect(metadata_view.y).to.be.bignumber.that.equals(plot.y + "");
								});
								it("plot size matches", async function() {
									expect(metadata_view.size).to.be.bignumber.that.equals(plot.size + "");
								});
								describe(`landmark type matches the tier ${tier_id}`,  function() {
									if(tier_id < 3) {
										it("no landmark (ID 0) for the tier less than 3", async function() {
											expect(metadata_view.landmarkTypeId).to.be.bignumber.that.equals("0");
										});
									}
									else if(tier_id < 4) {
										it("element landmark (ID 1-3) for the tier 3", async function() {
											expect(metadata_view.landmarkTypeId).to.be.bignumber.that.is.closeTo("2", "1");
										});
									}
									else if(tier_id < 5) {
										it("fuel landmark (ID 4-6) for the tier 4", async function() {
											expect(metadata_view.landmarkTypeId).to.be.bignumber.that.is.closeTo("5", "1");
										});
									}
									else if(tier_id < 6) {
										it("Arena landmark (ID 7) for the tier 5", async function() {
											expect(metadata_view.landmarkTypeId).to.be.bignumber.that.equals("7");
										});
									}
									else {
										it(`unexpected tier ${tier_id}`, async function() {
											expect(false);
										});
									}
								});
								{
									const num_sites = [0, 3, 6, 9, 12, 15];
									it(`number of element sites (${num_sites[tier_id]}) matches the tier (${tier_id})`, async function() {
										const sites = metadata_view.sites.filter(s => s.typeId >= 1 && s.typeId <= 3);
										expect(sites.length).to.equal(num_sites[tier_id]);
									});
								}
								{
									const num_sites = [0, 1, 3, 6, 9, 12];
									it(`number of fuel sites (${num_sites[tier_id]}) matches the tier (${tier_id})`, async function() {
										const sites = metadata_view.sites.filter(s => s.typeId >= 4 && s.typeId <= 6);
										expect(sites.length).to.equal(num_sites[tier_id]);
									});
								}
							});
						});
						describe("funds move as expected", function() {
							if(use_sIlv) {
								it("buyer sILV balance decreases as expected", async function() {
									expect(await sIlv.balanceOf(buyer)).to.be.bignumber.that.equals(buyer_sb0.sub(price_sIlv));
								});
								if(beneficiary) {
									it("beneficiary sILV balance increases as expected", async function() {
										expect(await sIlv.balanceOf(beneficiary)).to.be.bignumber.that.equals(beneficiary_sb0.add(price_sIlv));
									});
								}
								else {
									it("sale sILV balance increases as expected", async function() {
										expect(await sIlv.balanceOf(land_sale.address)).to.be.bignumber.that.equals(sale_sb0.add(price_sIlv));
									});
								}
								it("buyer ETH balance remains", async function() {
									expect(await balance.current(buyer)).to.be.bignumber.that.equals(buyer_eb0.sub(gas_cost));
								});
							}
							else {
								it("buyer ETH balance decreases as expected", async function() {
									expect(await balance.current(buyer)).to.be.bignumber.that.equals(buyer_eb0.sub(price_eth).sub(gas_cost));
								});
								if(beneficiary) {
									it("beneficiary ETH balance increases as expected", async function() {
										expect(await balance.current(beneficiary)).to.be.bignumber.that.equals(beneficiary_eb0.add(price_eth));
									});
								}
								else {
									it("sale ETH balance increases as expected", async function() {
										expect(await balance.current(land_sale.address)).to.be.bignumber.that.equals(sale_eb0.add(price_eth));
									});
								}
								it("buyer sILV balance remains", async function() {
									expect(await sIlv.balanceOf(buyer)).to.be.bignumber.that.equals(buyer_sb0);
								});
							}
						});
					}

					describe("succeeds otherwise", function() {
						describe("when buying with ETH, without beneficiary set (default)", succeeds);
						describe("when buying with ETH, with beneficiary set", function() {
							succeeds(false, beneficiary);
						});
						describe("when buying with sILV, without beneficiary set", function() {
							succeeds(true);
						});
						describe("when buying with sILV, with beneficiary set", function() {
							succeeds(true, beneficiary);
						});
					});
				});
			}

			// run three tests for each of the tiers
			for(let tier_id = 1; tier_id <= tiers; tier_id++) {
				buy_test_suite(tier_id, -1);
				buy_test_suite(tier_id, 0);
				buy_test_suite(tier_id, 1);
			}

			// run a separate test for free tier (0)
			describe("buying a plot in free tier (0)", function() {
				const plot = {
					tokenId: 1,
					sequenceId: 0,
					regionId: 1,
					x: 1,
					y: 1,
					tierId: 0,
					size: 90,
				};
				const leaf = plot_to_leaf(plot);
				beforeEach(async function() {
					await land_sale.setInputDataRoot(leaf, {from: a0});
					await land_sale.setNow32(sale_start + seq_offset * plot.sequenceId);
				});
				it("reverts (not supported in this sale version)", async function() {
					const value = start_prices[plot.tierId];
					await expectRevert(land_sale.buy(plot, [], {from: buyer, value}), "unsupported tier");
				});
			});

			describe("withdrawing", function() {
				async function buy(use_sIlv = false, plot = random_element(plots)) {
					const {proof, price_eth, price_sIlv} = await prepare(plot);
					await land_sale.buy(plot, proof, {from: buyer, value: use_sIlv? 0: price_eth});
					return {price_eth, price_sIlv};
				}

				async function withdraw(eth_only = true, to = treasury) {
					if(to === a0) {
						return await land_sale.withdraw(eth_only, {from: a0});
					}
					return await land_sale.withdrawTo(to, eth_only, {from: a0});
				}

				function succeeds(use_eth, use_sIlv, eth_only, to_self = false) {
					const to = to_self? a0: treasury;

					// create the required ETH/sILV balances by buying
					let price_eth, price_sIlv;
					beforeEach(async function() {
						if(use_eth) {
							const plot = plots[2 * random_int(0, plots.length >> 1)];
							({price_eth} = await buy(false, plot));
						}
						if(use_sIlv) {
							const plot = plots[1 + 2 * random_int(0, (plots.length >> 1) - 1)];
							({price_sIlv} = await buy(true, plot));
						}
					});

					// save initial balances for the future comparison:
					// eb: ETH balance; sb: sILV balance
					let sale_sb0, treasury_eb0, treasury_sb0;
					beforeEach(async function() {
						sale_sb0 = await sIlv.balanceOf(land_sale.address);
						treasury_eb0 = await balance.current(to);
						treasury_sb0 = await sIlv.balanceOf(to);
					});

					// now do the withdrawal and test
					let receipt, gas_cost;
					beforeEach(async function() {
						receipt = await withdraw(eth_only, to);
						gas_cost = to_self? await extract_gas_cost(receipt): new BN(0);
					});

					it('"Withdrawn" event is emitted', async function() {
						expectEvent(receipt, "Withdrawn", {
							_by: a0,
							_to: to,
							_eth: use_eth? price_eth: "0",
							_sIlv: use_sIlv && !eth_only? price_sIlv: "0",
						});
					});
					if(use_eth) {
						it("treasury ETH balance increases as expected", async function() {
							expect(await balance.current(to)).to.be.bignumber.that.equals(treasury_eb0.add(price_eth).sub(gas_cost));
						});
						it("sale contract ETH balance decreases to zero", async function() {
							expect(await balance.current(land_sale.address)).to.be.bignumber.that.equals("0");
						});
					}
					else {
						it("treasury ETH balance doesn't change", async function() {
							expect(await balance.current(to)).to.be.bignumber.that.equals(treasury_eb0.sub(gas_cost));
						});
						it("sale contract ETH balance remains zero", async function() {
							expect(await balance.current(land_sale.address)).to.be.bignumber.that.equals("0");
						});
					}
					if(use_sIlv && !eth_only) {
						it("treasury sILV balance increases as expected", async function() {
							expect(await sIlv.balanceOf(to)).to.be.bignumber.that.equals(treasury_sb0.add(price_sIlv));
						});
						it("sale contract sILV balance decreases to zero", async function() {
							expect(await sIlv.balanceOf(land_sale.address)).to.be.bignumber.that.equals("0");
						});
					}
					else {
						it("treasury sILV balance doesn't change", async function() {
							expect(await sIlv.balanceOf(to)).to.be.bignumber.that.equals(treasury_sb0);
						});
						it("sale contract sILV balance doesn't change", async function() {
							expect(await sIlv.balanceOf(land_sale.address)).to.be.bignumber.that.equals(sale_sb0);
						});
					}
				}

				it("throws if `to` address is not set", async function() {
					await buy();
					await expectRevert(withdraw(true, ZERO_ADDRESS), "recipient not set");
				});
				describe("withdrawing ETH only", function() {
					it("throws if there is no ETH, and no sILV on the balance", async function() {
						await expectRevert(withdraw(), "zero balance");
					});
					it("throws if there is no ETH, and some sILV on the balance", async function() {
						await buy(true);
						await expectRevert(withdraw(), "zero balance");
					});
					describe("succeeds if there is some ETH, and no sILV on the balance", function() {
						succeeds(true, false, true);
					});
					describe("succeeds if there is some ETH, and some sILV on the balance", function() {
						succeeds(true, true, true);
					});
					describe("self withdraw succeeds", function() {
						succeeds(true, false, true, true);
					});
				});
				describe("withdrawing ETH and sILV", function() {
					it("throws if there is no ETH, and no sILV on the balance", async function() {
						await expectRevert(withdraw(false), "zero balance");
					});
					describe("succeeds if there is no ETH, and some sILV on the balance", function() {
						succeeds(false, true, false);
					});
					describe("succeeds if there is some ETH, and no sILV on the balance", function() {
						succeeds(true, false, false);
					});
					describe("succeeds if there is some ETH, and some sILV on the balance", function() {
						succeeds(true, true, false);
					});
					describe("self withdraw succeeds", function() {
						succeeds(true, false, true, true);
					});
				});
			});
		});
	});
});
