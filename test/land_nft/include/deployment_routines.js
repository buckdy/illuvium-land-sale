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
 * Deploys LandERC721 token wrapped into ERC1967Proxy with no features enabled
 *
 * @param a0 smart contract owner, super admin
 * @returns LandERC721 instance
 */
async function land_nft_deploy_restricted(a0) {
	// smart contracts required
	const ERC721Contract = artifacts.require("./LandERC721");
	const Proxy = artifacts.require("./ERC1967Proxy");

	// deploy ERC721 without a proxy
	const instance = await ERC721Contract.new({from: a0});

	// prepare the initialization call bytes to initialize ERC721 (upgradeable compatibility)
	const init_data = instance.contract.methods.postConstruct().encodeABI();

	// deploy proxy, and initialize the implementation (inline)
	const proxy = await Proxy.new(instance.address, init_data, {from: a0});

	// wrap the proxy into the implementation ABI and return
	return ERC721Contract.at(proxy.address);
}

/**
 * Deploys LandDescriptor implementation
 * @param a0 smart contract deployer, owner, super admin
 * @return LandDescriptorImpl instance
 */
async function land_descriptor_deploy(a0) {
	// smart contracts required
	const LandDescriptor = artifacts.require("./LandDescriptorImpl");

	// deploy and return reference to instance
	return await LandDescriptor.new({from: a0})
}


// export public deployment API
module.exports = {
	land_nft_deploy,
	land_nft_deploy_restricted,
	land_descriptor_deploy,
	erc721_deploy_restricted,
	erc721_receiver_deploy,
	NAME,
	SYMBOL,
};
