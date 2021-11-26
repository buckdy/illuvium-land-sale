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

	// get v1 implementation contract and its address
	const v1_deployment = await deployments.get("LandERC721_v1");
	const v1_contract = new web3.eth.Contract(v1_deployment.abi);
	const v1_address = v1_deployment.address;

	// prepare the initialization call bytes
	const init_data = v1_contract.methods.postConstruct().encodeABI();

	// deploy contract
	await deployments.deploy("LandERC721_Proxy", {
		// address (or private key) that will perform the transaction.
		// you can use `getNamedAccounts` to retrieve the address you want by name.
		from: A0,
		contract: "ERC1967Proxy",
		// the list of argument for the constructor (or the upgrade function in case of proxy)
		args: [v1_address, init_data],
		// if set it to true, will not attempt to deploy even if the contract deployed under the same name is different
		skipIfAlreadyDeployed: true,
		// if true, it will log the result of the deployment (tx hash, address and gas used)
		log: true,
		// allows to consider the contract as a proxy
	});
};

// Tags represent what the deployment script acts on. In general, it will be a single string value,
// the name of the contract it deploys or modifies.
// Then if another deploy script has such tag as a dependency, then when the latter deploy script has a specific tag
// and that tag is requested, the dependency will be executed first.
// https://www.npmjs.com/package/hardhat-deploy#deploy-scripts-tags-and-dependencies
module.exports.tags = ["LandERC721_Proxy", "deploy", "v1"];
module.exports.dependencies = ["LandERC721_v1"];
