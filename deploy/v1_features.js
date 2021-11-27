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
	FEATURE_TRANSFERS,
	FEATURE_TRANSFERS_ON_BEHALF,
	FEATURE_SALE_ACTIVE,
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

	// Land NFT
	{
		// get the Land NFT v1 implementation and proxy deployments
		const land_nft_proxy_deployment = await deployments.get("LandERC721_Proxy");
		const land_nft_v1_deployment = await deployments.get("LandERC721_v1");

		// print Land NFT proxy info, and determine if transfers are enabled
		const {features} = await print_land_nft_acl_details(A0, land_nft_v1_deployment.abi, land_nft_proxy_deployment.address);

		// verify if transfers are enabled on the Land NFT and enable if required
		const land_nft_features = toBN(FEATURE_TRANSFERS | FEATURE_TRANSFERS_ON_BEHALF);
		if(!features.eq(land_nft_features)) {
			// prepare the updateFeatures call bytes for Land NFT proxy call
			const land_nft_proxy = new web3.eth.Contract(land_nft_v1_deployment.abi, land_nft_proxy_deployment.address);
			const update_features_data = land_nft_proxy.methods.updateFeatures(land_nft_features).encodeABI();

			// grant the sale permissions to mint NFTs and set metadata
			const receipt = await deployments.rawTx({
				from: A0,
				to: land_nft_proxy_deployment.address,
				data: update_features_data, // updateFeatures(land_nft_features)
			});
			console.log("LandERC721_Proxy.updateFeatures(%o): %o", land_nft_features.toString(2), receipt.transactionHash);
		}
	}

	// Land Sale
	{
		// get Land Sale v1 deployment details
		const land_sale_v1_deployment = await deployments.get("LandSale_v1");
		// print Land Sale v1 deployment details, and determine if sale is enabled
		const {features} = await print_land_sale_acl_details(A0, land_sale_v1_deployment.abi, land_sale_v1_deployment.address);

		// verify if sale is enabled on the Land Sale and enable if required
		const land_sale_features = toBN(FEATURE_SALE_ACTIVE);
		if(!features.eq(land_sale_features)) {
			// grant the sale permissions to mint NFTs and set metadata
			const receipt = await deployments.execute(
				"LandSale_v1", // deployment name maps to smart contract name
				{from: A0}, // TxOptions, includes from, to, nonce, value, etc.
				"updateFeatures", // function name to execute
				FEATURE_SALE_ACTIVE, // function params
			);
			console.log("LandSale.updateFeatures(%o): %o", land_sale_features.toString(2), receipt.transactionHash);
		}
	}
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

// prints Land Sale info + AccessControl (features, deployer role)
async function print_land_sale_acl_details(a0, abi, address) {
	const web3_contract = new web3.eth.Contract(abi, address);
	const targetNftContract = await web3_contract.methods.targetNftContract().call();
	const sIlvContract = await web3_contract.methods.sIlvContract().call();
	const priceOracle = await web3_contract.methods.priceOracle().call();
	const root = await web3_contract.methods.root().call();
	const saleStart = parseInt(await web3_contract.methods.saleStart().call());
	const saleEnd = parseInt(await web3_contract.methods.saleEnd().call());
	const halvingTime = parseInt(await web3_contract.methods.halvingTime().call());
	const timeFlowQuantum = parseInt(await web3_contract.methods.timeFlowQuantum().call());
	const seqDuration = parseInt(await web3_contract.methods.seqDuration().call());
	const seqOffset = parseInt(await web3_contract.methods.seqOffset().call());
	const startPrices = (await web3_contract.methods.getStartPrices().call());
	const beneficiary = await web3_contract.methods.beneficiary().call();
	const isActive = await web3_contract.methods.isActive().call();
	const features = toBN(await web3_contract.methods.features().call());
	const r0 = toBN(await web3_contract.methods.userRoles(a0).call());
	console.table([
		{"key": "Target NFT", "value": targetNftContract},
		{"key": "sILV", "value": sIlvContract},
		{"key": "Sale Oracle", "value": priceOracle},
		{"key": "Merkle Root", "value": root},
		{"key": "Sale Start", "value": saleStart},
		{"key": "Sale End", "value": saleEnd},
		{"key": "Halving Time", "value": halvingTime},
		{"key": "Price Update Interval", "value": timeFlowQuantum},
		{"key": "Sequence Duration", "value": seqDuration},
		{"key": "Sequence Offset", "value": seqOffset},
		{"key": "Start Prices", "value": startPrices.map(price => print_amt(price)).join(", ")},
		{"key": "Beneficiary", "value": beneficiary},
		{"key": "Is Active", "value": isActive},
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
module.exports.tags = ["v1_features", "features", "v1"];
// module.exports.dependencies = ["v1_deploy"];
