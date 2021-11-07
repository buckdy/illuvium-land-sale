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

// BN utils
const {
	random_bn,
} = require("../include/bn_utils");

// land data utils
const {
	generate_land,
	plot_to_leaf,
} = require("./include/land_data_utils");

// deployment routines in use
const {
	erc20_deploy,
	sIlv_mock_deploy,
	land_nft_deploy_restricted,
	zeppelin_erc721_deploy_restricted,
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
	const [A0, a0, H0, a1, a2] = accounts;

	describe("deployment", function() {
		it("fails if target NFT contract is not set", async function() {
			const sIlvContract = await sIlv_mock_deploy(a0);
			const oracleMock = await oracle_mock_deploy(a0);
			await expectRevert(land_sale_deploy_pure(a0, ZERO_ADDRESS, sIlvContract.address, oracleMock.address), "target contract is not set");
		});
		it("fails if sILV contract is not set", async function() {
			const targetContract = await zeppelin_erc721_deploy_restricted(a0);
			const oracleMock = await oracle_mock_deploy(a0);
			await expectRevert(land_sale_deploy_pure(a0, targetContract.address, ZERO_ADDRESS, oracleMock.address), "sILV contract is not set");
		});
		it("fails if price oracle contract is not set", async function() {
			const targetContract = await zeppelin_erc721_deploy_restricted(a0);
			const sIlvContract = await sIlv_mock_deploy(a0);
			await expectRevert(land_sale_deploy_pure(a0, targetContract.address, sIlvContract.address, ZERO_ADDRESS), "oracle address is not set");
		});
		it("fails if target NFT contract doesn't have ERC721 interface");
		it("fails if target NFT contract doesn't have MintableERC721 interface");
		it("fails if target NFT contract doesn't have LandERC721Metadata interface", async function() {
			const targetContract = await zeppelin_erc721_deploy_restricted(a0); // mess up the LandNFT
			const sIlvContract = await sIlv_mock_deploy(a0);
			const oracleMock = await oracle_mock_deploy(a0);
			await expectRevert(land_sale_deploy_pure(a0, targetContract.address, sIlvContract.address, oracleMock.address), "unexpected target type");
		});
		it("fails if sILV contract has wrong UUID");
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
		})
	});

	describe("when sale is deployed", function() {
		let land_sale, land_nft, sIlv;
		beforeEach(async function() {
			({land_sale, land_nft, sIlv} = await land_sale_deploy(a0));
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
						receipt = await land_sale.rescueTokens(token.address, a1, rescue_value, {from: a0});
					});
					it('ERC20 "Transfer" event is emitted', async function() {
						await expectEvent.inTransaction(receipt.tx, token, "Transfer", {
							from: land_sale.address,
							to: a1,
							value: rescue_value,
						});
					});
					it("ERC721 balance decreases as expected", async function() {
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
						land_sale.rescueTokens(token.address, a1, value.addn(1), {from: a0}),
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
					await expectRevert(land_sale.rescueTokens(token.address, a1, value, {from: a0}), "sILV access denied");
				});
				it("can't rescue some tokens", async function() {
					await expectRevert(land_sale.rescueTokens(token.address, a1, value.subn(1), {from: a0}), "sILV access denied");
				});
				it("can't' rescue more than all the tokens", async function() {
					await expectRevert(land_sale.rescueTokens(token.address, a1, value.addn(1), {from: a0}), "sILV access denied");
				});
			});
		});
	});
});
