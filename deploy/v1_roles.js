// script is built for hardhat-deploy plugin:
// A Hardhat Plugin For Replicable Deployments And Easy Testing
// https://www.npmjs.com/package/hardhat-deploy

// BN utils
const {
	toBN,
	print_amt,
} = require("../test/include/bn_utils");

// ACL token features and roles
const {
	ROLE_TOKEN_CREATOR,
	ROLE_METADATA_PROVIDER,
} = require("../test/include/features_roles");

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

	// Land NFT <- Land Sale role injection
	{
		// get the Land NFT v1 implementation and proxy deployments
		const land_nft_proxy_deployment = await deployments.get("LandERC721_Proxy");
		const land_nft_v1_deployment = await deployments.get("LandERC721_v1");

		// print Land NFT proxy info, and determine if Land Sale is allowed to mint it
		const land_sale_v1_address = (await deployments.get("LandSale_v1")).address;
		const {r1} = await print_land_nft_acl_details(A0, land_sale_v1_address, land_nft_v1_deployment.abi, land_nft_proxy_deployment.address);

		// verify if Land Sale is allowed to mint Land NFT and allow if required
		const sale_nft_role = toBN(ROLE_TOKEN_CREATOR | ROLE_METADATA_PROVIDER);
		if(!r1.eq(sale_nft_role)) {
			// prepare the updateRole call bytes for Land NFT proxy call
			const land_nft_proxy = new web3.eth.Contract(land_nft_v1_deployment.abi, land_nft_proxy_deployment.address);
			const update_role_data = land_nft_proxy.methods.updateRole(land_sale_v1_address, sale_nft_role).encodeABI();

			// grant the sale permissions to mint NFTs and set metadata
			const receipt = await deployments.rawTx({
				from: A0,
				to: land_nft_proxy_deployment.address,
				data: update_role_data, // updateRole(land_sale_v1_address, sale_nft_role)
			});
			console.log("LandERC721_Proxy.updateRole(%o, %o): %o", land_sale_v1_address, sale_nft_role.toString(16), receipt.transactionHash);
		}
	}
};

// prints generic NFT info (name, symbol, etc.) + AccessControl (features, deployer role)
async function print_land_nft_acl_details(a0, a1, abi, address) {
	const web3_contract = new web3.eth.Contract(abi, address);
	const name = await web3_contract.methods.name().call();
	const symbol = await web3_contract.methods.symbol().call();
	const totalSupply = parseInt(await web3_contract.methods.totalSupply().call());
	const features = toBN(await web3_contract.methods.features().call());
	const r0 = toBN(await web3_contract.methods.userRoles(a0).call());
	const r1 = toBN(await web3_contract.methods.userRoles(a1).call());
	console.table([
		{"key": "Name", "value": name},
		{"key": "Symbol", "value": symbol},
		{"key": "Total Supply", "value": totalSupply},
		{"key": "Features", "value": features.toString(2)}, // 2
		{"key": "Deployer Role", "value": r0.toString(16)}, // 16
		{"key": "Sale Role", "value": r1.toString(16)}, // 16
	]);
	return {features, r0, r1};
}

// Tags represent what the deployment script acts on. In general, it will be a single string value,
// the name of the contract it deploys or modifies.
// Then if another deploy script has such tag as a dependency, then when the latter deploy script has a specific tag
// and that tag is requested, the dependency will be executed first.
// https://www.npmjs.com/package/hardhat-deploy#deploy-scripts-tags-and-dependencies
module.exports.tags = ["v1_roles", "roles", "v1"];
// module.exports.dependencies = ["v1_deploy"];
