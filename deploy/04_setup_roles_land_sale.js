// script is built for hardhat-deploy plugin:
// A Hardhat Plugin For Replicable Deployments And Easy Testing
// https://www.npmjs.com/package/hardhat-deploy

// BN utils
const {
	print_amt,
} = require("../scripts/include/big_number_utils");

// to be picked up and executed by hardhat-deploy plugin
module.exports = async function({deployments, getChainId, getNamedAccounts, getUnnamedAccounts}) {
	// print some useful info on the account we're using for the deployment
	const chainId = await getChainId();
	const [A0] = await web3.eth.getAccounts();
	let nonce = await web3.eth.getTransactionCount(A0);
	let balance = await web3.eth.getBalance(A0);

	// print initial debug information
	console.log("network %o %o", chainId, network.name);
	console.log("service account %o, nonce: %o, balance: %o ETH", A0, nonce, print_amt(balance));


	// determine NFT and sale addresses from the previous deployment(s)
	const land_nft_deployment = await deployments.get("LandERC721_Proxy");
	const land_nft_address = land_nft_deployment.address;
	const land_sale_address = (await deployments.get("LandSale_v1")).address;

	// get v1 implementation contract and its address
	const v1_deployment = await deployments.get("LandERC721_v1");
	const v1_contract = new web3.eth.Contract(v1_deployment.abi);

	// prepare the updateRole call bytes
	const update_role_data = v1_contract.methods.updateRole(land_sale_address, 0x0041_0000).encodeABI();

	// grant the sale permissions to mint NFTs and set metadata
	// TODO: do not grant the role if already granted
	const receipt = await deployments.rawTx({
		from: A0,
		to: land_nft_address,
		data: update_role_data, // updateRole(land_sale_address, 0x0041_0000)
	});
	console.log("LandERC721_Proxy.updateRole(%o, %o): %o", land_sale_address, 0x0041_0000, receipt.transactionHash);
};

// Tags represent what the deployment script acts on. In general, it will be a single string value,
// the name of the contract it deploys or modifies.
// Then if another deploy script has such tag as a dependency, then when the latter deploy script has a specific tag
// and that tag is requested, the dependency will be executed first.
// https://www.npmjs.com/package/hardhat-deploy#deploy-scripts-tags-and-dependencies
module.exports.tags = ["LandSale_v1_roles", "roles", "v1"];
module.exports.dependencies = ["LandERC721_v1", "LandERC721_Proxy", "LandSale_v1"];
