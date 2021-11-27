// script is built for hardhat-deploy plugin:
// A Hardhat Plugin For Replicable Deployments And Easy Testing
// https://www.npmjs.com/package/hardhat-deploy

// BN utils
const {
	toBN,
	print_amt,
} = require("../test/include/bn_utils");

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

	// deploy Land ERC721 implementation v2 if required
	await deployments.deploy("LandERC721_v2", {
		// address (or private key) that will perform the transaction.
		// you can use `getNamedAccounts` to retrieve the address you want by name.
		from: A0,
		contract: "LandERC721",
		// the list of argument for the constructor (or the upgrade function in case of proxy)
		// args: [],
		// if set it to true, will not attempt to deploy even if the contract deployed under the same name is different
		skipIfAlreadyDeployed: true,
		// if true, it will log the result of the deployment (tx hash, address and gas used)
		log: true,
	});
	// get Land ERC721 implementation v2 deployment details
	const land_nft_v2_deployment = await deployments.get("LandERC721_v2");
	const land_nft_v2_contract = new web3.eth.Contract(land_nft_v2_deployment.abi, land_nft_v2_deployment.address);
	// get Land ERC721 proxy deployment details
	const land_nft_proxy_deployment = await deployments.get("LandERC721_Proxy");
	// print Land ERC721 proxy deployment details
	await print_land_nft_acl_details(A0, land_nft_v2_deployment.abi, land_nft_proxy_deployment.address);

	// prepare the upgradeTo call bytes
	const land_nft_proxy_upgrade_data = land_nft_v2_contract.methods.upgradeTo(land_nft_v2_deployment.address).encodeABI();

	// update the implementation address in the proxy
	// TODO: do not update if already updated
	const receipt = await deployments.rawTx({
		from: A0,
		to: land_nft_proxy_deployment.address,
		data: land_nft_proxy_upgrade_data, // upgradeTo(land_nft_v2_deployment.address)
	});
	console.log("LandERC721_Proxy.upgradeTo(%o): %o", land_nft_v2_deployment.address, receipt.transactionHash);
};

// prints generic NFT info (name, symbol, etc.) + AccessControl (features, deployer role)
async function print_land_nft_acl_details(a0, abi, address) {
	const web3_contract = new web3.eth.Contract(abi, address);
	const name = await web3_contract.methods.name().call();
	const symbol = await web3_contract.methods.symbol().call();
	const totalSupply = parseInt(await web3_contract.methods.totalSupply().call());
	const features = toBN(await web3_contract.methods.features().call());
	const r0 = toBN(await web3_contract.methods.userRoles(a0).call());
	console.table([
		{"key": "Name", "value": name},
		{"key": "Symbol", "value": symbol},
		{"key": "Total Supply", "value": totalSupply},
		{"key": "Features", "value": features.toString(2)}, // 2
		{"key": "Deployer Role", "value": r0.toString(16)}, // 16
	]);
	return {features, r0};
}

// Tags represent what the deployment script acts on. In general, it will be a single string value,
// the name of the contract it deploys or modifies.
// Then if another deploy script has such tag as a dependency, then when the latter deploy script has a specific tag
// and that tag is requested, the dependency will be executed first.
// https://www.npmjs.com/package/hardhat-deploy#deploy-scripts-tags-and-dependencies
module.exports.tags = ["v2_deploy", "deploy", "v2"];
// module.exports.dependencies = ["v1_deploy"];
