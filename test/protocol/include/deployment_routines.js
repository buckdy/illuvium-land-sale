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


/**
 * Deploys LandERC721 token with all the features enabled
 *
 * @param a0 smart contract owner, super admin
 * @returns LandERC721 instance
 */
async function land_nft_deploy(a0) {
	// deploy the token
	const token = await land_nft_deploy_restricted(a0);

	// enable all permissions on the token
	await token.updateFeatures(FEATURE_ALL, {from: a0});

	// return the reference
	return token;
}

/**
 * Deploys LandERC721 token with no features enabled
 *
 * @param a0 smart contract owner, super admin
 * @returns LandERC721 instance
 */
async function land_nft_deploy_restricted(a0) {
	// smart contracts required
	const ERC721Contract = artifacts.require("./LandERC721");

	// deploy ERC721 and return the reference
	return await ERC721Contract.new({from: a0});
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
	sale_end: 1_000_450_000,
	halving_time: 3_600,
	seq_duration: 21_600,
	seq_offset: 3_600,
	start_prices: new Array(6).fill(0)
		.map((_, i) => new BN(i === 0? 0: Math.pow(10, 3 + i)))
		.map(v => toWei(new BN(v), "shannon"))
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

	// and return its initialization params
	return {sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices};
}

/**
 * Deploys Land Sale with all the features enabled, and all the required roles set up
 *
 * Deploys Land NFT instance if it's address is not specified
 *
 * @param a0 smart contract owner, super admin
 * @param land_nft_addr LandERC721 token address, required
 * @returns LandSale, LandERC721 instances
 */
async function land_sale_deploy(a0, land_nft_addr) {
	// smart contracts required
	const LandERC721 = artifacts.require("./LandERC721");

	// link/deploy the contracts
	const land_nft = land_nft_addr? await LandERC721.at(land_nft_addr): await land_nft_deploy(a0);
	const land_sale = await land_sale_deploy_pure(a0, land_nft.address);

	// features setup
	await land_sale.updateFeatures(FEATURE_ALL, {from: a0});

	// grant sale permission to mint tokens
	await land_nft.updateRole(land_sale.address, ROLE_TOKEN_CREATOR | ROLE_METADATA_PROVIDER, {from: a0});

	// return all the linked/deployed instances
	return {land_nft, land_sale};
}

/**
 * Deploys Land Sale with no features enabled, and no roles set up
 *
 * Requires a valid Land NFT instance address to be specified
 *
 * @param a0 smart contract owner, super admin
 * @param land_nft_addr LandERC721 token address, required
 * @returns LandSale instance
 */
async function land_sale_deploy_pure(a0, land_nft_addr) {
	// smart contracts required
	const LandSale = artifacts.require("./LandSaleMock");

	// deploy and return the reference to instance
	return await LandSale.new(land_nft_addr, {from: a0});
}


// export public deployment API
module.exports = {
	land_nft_deploy,
	land_nft_deploy_restricted,
	DEFAULT_LAND_SALE_PARAMS,
	land_sale_init,
	land_sale_deploy,
	land_sale_deploy_pure,
};
