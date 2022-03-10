// run: npx hardhat deploy --network rinkeby --tags v1_roles

// script is built for hardhat-deploy plugin:
// A Hardhat Plugin For Replicable Deployments And Easy Testing
// https://www.npmjs.com/package/hardhat-deploy

// BN utils
const {
	toBN,
	print_amt,
} = require("../scripts/include/bn_utils");

// ACL token features and roles
const {
	ROLE_TOKEN_CREATOR,
	ROLE_METADATA_PROVIDER,
} = require("../scripts/include/features_roles");

// deployment utils (contract state printers)
const {
	print_nft_acl_details,
} = require("../scripts/deployment_utils");

// IMX Scripts Config file to get StarkContract address for role injection
// note: we could use named accounts instead but since IMX configuration is already stored
// in IMX config, we stick to using it
const Config = require("../scripts/imx/config");

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

	// Land NFT <- IMX Stark Contract role injection
	if (network.name === "mainnet" || network.name === "ropsten") {
		// get the Land NFT v1 implementation and proxy deployments
		const land_nft_proxy_deployment = await deployments.get("LandERC721_Proxy");
		const land_nft_v1_deployment = await deployments.get("LandERC721_v1");

		// print Land NFT proxy info, and determine if IMX Stark Contract is allowed to mint it
		const imx_stark_contract_address = Config(network.name).IMXClientConfig.starkContractAddress;
		const {r1} = await print_nft_acl_details(
			A0, 
			land_nft_v1_deployment.abi, 
			land_nft_proxy_deployment.address, 
			imx_stark_contract_address
		);

		// verify if IMX Stark Contract is allowed to mint Land NFT and allow if required
		const imx_nft_role = toBN(ROLE_TOKEN_CREATOR | ROLE_METADATA_PROVIDER);
		if(!r1.eq(imx_nft_role)) {
			// prepare the updateRole call bytes for Land NFT proxy call
			const land_nft_proxy = new web3.eth.Contract(land_nft_v1_deployment.abi, land_nft_proxy_deployment.address);
			const update_role_data = land_nft_proxy.methods.updateRole(imx_stark_contract_address, imx_nft_role).encodeABI();

			// grant the imx permissions to mint NFTs and set metadata
			const receipt = await deployments.rawTx({
				from: A0,
				to: land_nft_proxy_deployment.address,
				data: update_role_data, // updateRole(imx_stark_contract_address, imx_nft_role)
			});
			console.log("LandERC721_Proxy.updateRole(%o, %o): %o", imx_stark_contract_address, imx_nft_role.toString(16), receipt.transactionHash);
		}
	}
};

// Tags represent what the deployment script acts on. In general, it will be a single string value,
// the name of the contract it deploys or modifies.
// Then if another deploy script has such tag as a dependency, then when the latter deploy script has a specific tag
// and that tag is requested, the dependency will be executed first.
// https://www.npmjs.com/package/hardhat-deploy#deploy-scripts-tags-and-dependencies
module.exports.tags = ["v1_l2_roles", "v1_roles", "roles", "v1", "l2"];
// module.exports.dependencies = ["v1_deploy"];