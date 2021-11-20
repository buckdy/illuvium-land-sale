// Both Truffle anf Hardhat with Truffle make an instance of web3 available in the global scope
// BN constants, functions to work with BN
const BN = web3.utils.BN;
const toWei = web3.utils.toWei;

// ACL token features and roles
const {
	FEATURE_ALL,
	ROLE_TOKEN_CREATOR,
	ROLE_METADATA_PROVIDER,
} = require("../../include/features_roles");

// reimport some deployment routines from erc20/erc721 deployment packs
const {
	erc20_deploy,
} = require("../../erc20/include/deployment_routines");
const {
	land_nft_deploy,
	land_nft_deploy_restricted,
	erc721_deploy_restricted,
} = require("../../land_nft/include/deployment_routines");

/**
 * Deploys Escrowed Illuvium Mock used for payments in Land Sale
 *
 * @param a0 smart contract owner, super admin
 * @return ERC20Mock instance with sILV UID
 */
async function sIlv_mock_deploy(a0) {
	// smart contracts required
	const ERC20Contract = artifacts.require("./ERC20Mock");

	// deploy the ERC20
	const token = await ERC20Contract.new("sILV", "Escrowed Illuvium", {from: a0});

	// set the correct sILV UID
	await token.setUid("0xac3051b8d4f50966afb632468a4f61483ae6a953b74e387a01ef94316d6b7d62", {from: a0});

	// enable all the features
	await token.updateFeatures(FEATURE_ALL, {from: a0});

	// return the deployed instance reference
	return token;
}

/**
 * Default Land Sale initialization parameters:
 * Start:
 * End:
 * Halving Time: 1 hour
 * Sequence Duration: 6 hours
 * Sequence Offset: 1 hour
 * Start Prices:
 *    Tier 0: 0
 *    Tier 1: 10,000 Gwei
 *    Tier 2: 100,000 Gwei
 *    Tier 3: 1,000,000 Gwei (0.001 Eth)
 *    Tier 4: 10,000,000 Gwei (0.01 Eth)
 *    Tier 5: 100,000,000 Gwei (0.1 Eth)
 *
 * @type {{seq_duration: number, sale_end: number, seq_offset: number, halving_time: number, sale_start: number, start_prices: BN[]}}
 */
const DEFAULT_LAND_SALE_PARAMS = {
	sale_start: 1_000_000_000,
	sale_end: 1_000_435_600, // 1_000_450_000,
	get sale_duration() {return this.sale_end - this.sale_start;},
	halving_time: 2_058, // 3_600,
	seq_duration: 7_200, // 21_600,
	seq_offset: 3_600,
	get open_sequences() {return Math.ceil(this.sale_duration / this.seq_offset)},
	get full_sequences() {return Math.floor(1 + (this.sale_duration - this.seq_duration) / this.seq_offset);},
	start_prices: new Array(6).fill(0)
		.map((_, i) => new BN(i === 0? 0: Math.pow(10, 3 + i)))
		.map(v => toWei(new BN(v), "shannon")), // 10 ^ 9
}

/**
 * Initialized the already deployed sale, if the any of the initialization params are not set,
 * the defaults are used, see DEFAULT_LAND_SALE_PARAMS
 *
 * @param a0 account executing the initialization
 * @param land_sale Land Sale smart contract instance
 * @param sale_start Sale Start
 * @param sale_end Sale End
 * @param halving_time Halving Time
 * @param seq_duration Sequence Duration
 * @param seq_offset Sequence Offset
 * @param start_prices Start Prices by Tier
 * @return sale initialization params
 */
async function land_sale_init(
	a0,
	land_sale,
	sale_start = DEFAULT_LAND_SALE_PARAMS.sale_start,
	sale_end = DEFAULT_LAND_SALE_PARAMS.sale_end,
	halving_time = DEFAULT_LAND_SALE_PARAMS.halving_time,
	seq_duration = DEFAULT_LAND_SALE_PARAMS.seq_duration,
	seq_offset = DEFAULT_LAND_SALE_PARAMS.seq_offset,
	start_prices = DEFAULT_LAND_SALE_PARAMS.start_prices
) {
	// init the sale
	await land_sale.initialize(sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices, {from: a0});

	// calculate some additional auxiliary params
	const sale_duration = sale_end - sale_start;
	const open_sequences = Math.ceil(sale_duration / seq_offset);
	const full_sequences = Math.floor(1 + (sale_duration - seq_duration) / seq_offset);

	// and return its initialization params
	return {
		sale_start,
		sale_end,
		sale_duration,
		halving_time,
		seq_duration,
		seq_offset,
		open_sequences,
		full_sequences,
		start_prices
	};
}

/**
 * Deploys Land Sale with all the features enabled, and all the required roles set up
 *
 * Deploys Land NFT instance if it's address is not specified
 * Deploys sILV token mock if sILV address is not specified
 * Deploys LandSaleOracle mock if Land Sale Oracle address is not specified
 *
 * @param a0 smart contract owner, super admin
 * @param land_nft_addr LandERC721 token address
 * @param sIlv_addr sILV token address
 * @param oracle_addr Land Sale Oracle address, required
 * @returns LandSale, LandERC721 instances
 */
async function land_sale_deploy(a0, land_nft_addr, sIlv_addr, oracle_addr) {
	// deploy the restricted version
	const {land_sale, land_nft, sIlv, oracle} = await land_sale_deploy_restricted(a0, land_nft_addr, sIlv_addr, oracle_addr);

	// enabled all the features
	await land_sale.updateFeatures(FEATURE_ALL, {from: a0});

	// return all the linked/deployed instances
	return {land_sale, land_nft, sIlv, oracle};
}

/**
 * Deploys Land Sale with no features enabled, but all the required roles set up
 *
 * Deploys Land NFT instance if it's address is not specified
 * Deploys sILV token mock if sILV address is not specified
 * Deploys LandSaleOracle mock if Land Sale Oracle address is not specified
 *
 * @param a0 smart contract owner, super admin
 * @param land_nft_addr LandERC721 token address
 * @param sIlv_addr sILV token address
 * @param oracle_addr Land Sale Oracle address, required
 * @returns LandSale, LandERC721 instances
 */
async function land_sale_deploy_restricted(a0, land_nft_addr, sIlv_addr, oracle_addr) {
	// smart contracts required
	const LandERC721 = artifacts.require("./LandERC721");
	const ERC20 = artifacts.require("contracts/interfaces/ERC20Spec.sol:ERC20");
	const LandSaleOracle = artifacts.require("./LandSaleOracle");

	// link/deploy the contracts
	const land_nft = land_nft_addr? await LandERC721.at(land_nft_addr): await land_nft_deploy(a0);
	const sIlv = sIlv_addr? await ERC20.at(sIlv_addr): await sIlv_mock_deploy(a0);
	const oracle = oracle_addr? await LandSaleOracle.at(oracle_addr): await oracle_mock_deploy(a0);
	const land_sale = await land_sale_deploy_pure(a0, land_nft.address, sIlv.address, oracle.address);

	// grant sale the permission to mint tokens
	await land_nft.updateRole(land_sale.address, ROLE_TOKEN_CREATOR | ROLE_METADATA_PROVIDER, {from: a0});

	// return all the linked/deployed instances
	return {land_sale, land_nft, sIlv, oracle};
}

/**
 * Deploys Land Sale with no features enabled, and no roles set up
 *
 * Requires a valid Land NFT instance address to be specified
 *
 * @param a0 smart contract owner, super admin
 * @param land_nft_addr LandERC721 token address, required
 * @param sIlv_addr sILV token address, required
 * @param oracle_addr Land Sale Oracle address, required
 * @returns LandSale instance
 */
async function land_sale_deploy_pure(a0, land_nft_addr, sIlv_addr, oracle_addr) {
	// smart contracts required
	const LandSale = artifacts.require("./LandSaleMock");

	// deploy and return the reference to instance
	return await LandSale.new(land_nft_addr, sIlv_addr, oracle_addr, {from: a0});
}

/**
 * Deploys Land Sale Oracle Mock
 *
 * @param a0 smart contract owner, super admin
 * @return LandSaleOracle instance (mocked)
 */
async function oracle_mock_deploy(a0) {
	// smart contracts required
	const LandSaleOracle = artifacts.require("./LandSaleOracleMock");

	// deploy and return the reference to instance
	return await LandSaleOracle.new({from: a0});
}


// export public deployment API
module.exports = {
	erc20_deploy,
	sIlv_mock_deploy,
	land_nft_deploy,
	land_nft_deploy_restricted,
	erc721_deploy_restricted,
	DEFAULT_LAND_SALE_PARAMS,
	land_sale_init,
	land_sale_deploy,
	land_sale_deploy_restricted,
	land_sale_deploy_pure,
	oracle_mock_deploy,
};
