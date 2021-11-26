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

	// config file contains known deployed addresses, deployment settings
	const Config = require("../scripts/config");
	// a collection of all known addresses (smart contracts and external)
	const conf = Config(network.name);

	// for the test networks we deploy mocks for sILV token and price oracle
	// (for mainnet these entities are already maintained separately)
	if(chainId > 1) {
		// deploy sILV Mock (if required)
		if(!conf.EscrowedIlluviumERC20) {
			await deployments.deploy("sILV_Mock", {
				from: A0,
				contract: "ERC20Mock",
				args: ["sILV", "Escrowed Illuvium"],
				skipIfAlreadyDeployed: true,
				log: true,
			});
			conf.EscrowedIlluviumERC20 = (await deployments.get("sILV_Mock")).address;

			const expectedUid = "0xac3051b8d4f50966afb632468a4f61483ae6a953b74e387a01ef94316d6b7d62";
			const actualUid = await deployments.read("sILV_Mock", "TOKEN_UID");
			console.log("sILV_Mock.TOKEN_UID: %o", actualUid.toHexString())
			if(expectedUid !== actualUid.toHexString()) {
				const receipt = await deployments.execute(
					"sILV_Mock", // deployment name maps to smart contract name
					{from: A0}, // TxOptions, includes from, to, nonce, value, etc.
					"setUid", // function name to execute
					expectedUid, // function params
				);
				console.log("sILV_Mock.setUid(%o): %o", expectedUid, receipt.transactionHash);
			}
		}
		// deploy LandSaleOracle Mock (if required)
		if(!conf.LandSaleOracle) {
			await deployments.deploy("LandSaleOracle_Mock", {
				from: A0,
				contract: "LandSaleOracleMock",
				skipIfAlreadyDeployed: true,
				log: true,
			});
			conf.LandSaleOracle = (await deployments.get("LandSaleOracle_Mock")).address;
		}
	}

	// make sure the addresses we need are defined
	assert(conf.EscrowedIlluviumERC20, "sILV address is not set for " + network.name);
	assert(conf.LandSaleOracle, "LandSaleOracle address is not defined for " + network.name);
	// TODO: connect to these instances and verify them

	// determine Land ERC721 address from the previous deployment(s)
	const land_nft_address = (await deployments.get("LandERC721_Proxy")).address;
	assert(land_nft_address, "Land ERC721 proxy address is not defined for " + network.name);

	// deploy contract
	await deployments.deploy("LandSale_v1", {
		// address (or private key) that will perform the transaction.
		// you can use `getNamedAccounts` to retrieve the address you want by name.
		from: A0,
		contract: "LandSale",
		// the list of argument for the constructor (or the upgrade function in case of proxy)
		args: [land_nft_address, conf.EscrowedIlluviumERC20, conf.LandSaleOracle],
		// if set it to true, will not attempt to deploy even if the contract deployed under the same name is different
		skipIfAlreadyDeployed: true,
		// if true, it will log the result of the deployment (tx hash, address and gas used)
		log: true,
		gasLimit: 4500000,
	});
};

// Tags represent what the deployment script acts on. In general, it will be a single string value,
// the name of the contract it deploys or modifies.
// Then if another deploy script has such tag as a dependency, then when the latter deploy script has a specific tag
// and that tag is requested, the dependency will be executed first.
// https://www.npmjs.com/package/hardhat-deploy#deploy-scripts-tags-and-dependencies
module.exports.tags = ["LandSale_v1", "deploy", "v1"];
module.exports.dependencies = ["LandERC721_Proxy"];
