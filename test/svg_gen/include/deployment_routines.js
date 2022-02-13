// reimport deployment scripts for SVG generation test
const {
	land_nft_deploy,
} = require("../../land_nft/include/deployment_routines");

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
	land_descriptor_deploy,
	land_nft_deploy,
};
