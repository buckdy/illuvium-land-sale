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
	land_sale_deploy,
	land_sale_deploy_pure,
};
