// ACL token features and roles
const {FEATURE_ALL} = require("../../include/features_roles");

// token constants
const {
	NAME,
	SYMBOL,
} = require("./erc721_constants");

// reimport some deployment routines from erc721 deployment pack
const {
	erc721_deploy_restricted,
	erc721_receiver_deploy,
} = require("../../erc721/include/deployment_routines");

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

	// deploy ERC721 without a proxy
	const instance = await ERC721Contract.new({from: a0});

	// initialize ERC721 (upgradeable compatibility)
	await instance.initialize({from: a0});

	// and return the reference
	return instance;
}

// export public deployment API
module.exports = {
	land_nft_deploy,
	land_nft_deploy_restricted,
	erc721_deploy_restricted,
	erc721_receiver_deploy,
	NAME,
	SYMBOL,
};
