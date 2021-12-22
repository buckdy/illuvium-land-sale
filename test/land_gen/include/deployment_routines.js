// Both Truffle anf Hardhat with Truffle make an instance of web3 available in the global scope

const { artifacts } = require("hardhat");

/**
 * Deploys the Land Library (Mock)
 *
 * @param a0 deployer address, optional
 * @return LandLib instance delivered as LandLibMock
 */
async function land_lib_deploy(a0) {
	// smart contracts required
	const LandLib = artifacts.require("./LandLibMock");

	// deploy and return the reference to instance
	return a0? await LandLib.new({from: a0}): await LandLib.new();
}

async function land_descriptor_deploy(a0) {
	// smart contracts required
	const LandDescriptor = artifacts.require("./LandDescriptor");

	// deploy and return reference to instance
	return a0? await LandDescriptor.new({from: a0}): await LandDescriptor.new();
}

async function land_nft_deploy(landDescriptor, a0) {
	// smart contracts required
	const LandERC721 = artifacts.require("./LandERC721");
	const Proxy = artifacts.require("./ERC1967Proxy");

	// deploy LandERC721
	const landERC721 = await LandERC721.new({from: a0});

	// prepare the initialization call bytes to initialize landERC721 (upgradeable compatibility)
	const init_data = landERC721.contract.methods.postConstruct(landDescriptor.address).encodeABI();

	// deploy proxy, and initialize the implementation (inline)
	const proxy = await Proxy.new(landERC721.address, init_data, {from: a0});

	// wrap the proxy into the implementation ABI and return
	return LandERC721.at(proxy.address);
}

// export public deployment API
module.exports = {
	land_lib_deploy,
	land_descriptor_deploy,
	land_nft_deploy
};
