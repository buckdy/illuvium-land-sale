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

	// deploy Land ERC721 implementation v1 if required
	await deployments.deploy("LandERC721_v1", {
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
		// allows to consider the contract as a proxy
	});
	// get Land ERC721 implementation v1 deployment details
	const land_nft_v1_deployment = await deployments.get("LandERC721_v1");
	const land_nft_v1_address = land_nft_v1_deployment.address;
	const land_nft_v1_contract = new web3.eth.Contract(land_nft_v1_deployment.abi, land_nft_v1_address);
	// print Land ERC721 implementation v1 deployment details (zeros expected)
	await print_land_nft_table(A0, land_nft_v1_contract);

	// prepare the initialization call bytes
	const land_nft_proxy_init_data = land_nft_v1_contract.methods.postConstruct().encodeABI();

	// deploy Land ERC721 Proxy
	await deployments.deploy("LandERC721_Proxy", {
		// address (or private key) that will perform the transaction.
		// you can use `getNamedAccounts` to retrieve the address you want by name.
		from: A0,
		contract: "ERC1967Proxy",
		// the list of argument for the constructor (or the upgrade function in case of proxy)
		args: [land_nft_v1_address, land_nft_proxy_init_data],
		// if set it to true, will not attempt to deploy even if the contract deployed under the same name is different
		skipIfAlreadyDeployed: true,
		// if true, it will log the result of the deployment (tx hash, address and gas used)
		log: true,
		// allows to consider the contract as a proxy
	});
	// get Land ERC721 proxy deployment details
	const land_nft_proxy_deployment = await deployments.get("LandERC721_Proxy");
	const land_nft_proxy_address = land_nft_proxy_deployment.address;
	const land_nft_proxy_contract = new web3.eth.Contract(land_nft_v1_deployment.abi, land_nft_proxy_address);
	// print Land ERC721 proxy deployment details
	await print_land_nft_table(A0, land_nft_proxy_contract);

	// read ILV, sILV, SalePriceOracle addresses from named accounts, deploy mocks if required
	let {ilv: ilv_address, sIlv: sIlv_address, saleOracle: oracle_address} = await getNamedAccounts();
	// for the test networks we deploy mocks for sILV token and price oracle
	// (for mainnet these entities are already maintained separately)
	if(chainId > 1) {
		// deploy sILV Mock (if required)
		if(!sIlv_address) {
			await deployments.deploy("sILV_Mock", {
				from: A0,
				contract: "ERC20Mock",
				args: ["sILV", "Escrowed Illuvium"],
				skipIfAlreadyDeployed: true,
				log: true,
			});
			sIlv_address = (await deployments.get("sILV_Mock")).address;

			// verify TOKEN_UID and set it (if required)
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
		if(!oracle_address) {
			await deployments.deploy("LandSaleOracle_Mock", {
				from: A0,
				contract: "LandSaleOracleMock",
				skipIfAlreadyDeployed: true,
				log: true,
			});
			oracle_address = (await deployments.get("LandSaleOracle_Mock")).address;
		}
	}
	// make sure the addresses we need are defined now
	assert(sIlv_address, "sILV address is not set for " + network.name);
	assert(oracle_address, "LandSaleOracle address is not defined for " + network.name);
	// TODO: connect to these instances and verify them

	// deploy Land Sale v1
	await deployments.deploy("LandSale_v1", {
		// address (or private key) that will perform the transaction.
		// you can use `getNamedAccounts` to retrieve the address you want by name.
		from: A0,
		contract: "LandSale",
		// the list of argument for the constructor (or the upgrade function in case of proxy)
		args: [land_nft_proxy_address, sIlv_address, oracle_address],
		// if set it to true, will not attempt to deploy even if the contract deployed under the same name is different
		skipIfAlreadyDeployed: true,
		// if true, it will log the result of the deployment (tx hash, address and gas used)
		log: true,
		gasLimit: 4500000,
	});
	// get Land Sale v1 deployment details
	const land_sale_v1_deployment = await deployments.get("LandSale_v1");
	const land_sale_v1_address = land_sale_v1_deployment.address;
	const land_sale_v1_contract = new web3.eth.Contract(land_sale_v1_deployment.abi, land_sale_v1_address);
	// print Land Sale v1 deployment details
	await print_land_sale_table(A0, land_sale_v1_contract);
};

async function print_land_nft_table(a0, web3_contract) {
	const name = await web3_contract.methods.name().call();
	const symbol = await web3_contract.methods.symbol().call();
	const totalSupply = await web3_contract.methods.totalSupply().call();
	const features = await web3_contract.methods.features().call();
	const r0 = await web3_contract.methods.userRoles(a0).call();
	console.table([
		{"key": "Name", "value": name},
		{"key": "Symbol", "value": symbol},
		{"key": "Total Supply", "value": totalSupply},
		{"key": "Features", "value": features}, // 2
		{"key": "Deployer Role", "value": r0}, // 16
	]);
}

async function print_land_sale_table(a0, web3_contract) {
	const targetNftContract = await web3_contract.methods.targetNftContract().call();
	const sIlvContract = await web3_contract.methods.sIlvContract().call();
	const priceOracle = await web3_contract.methods.priceOracle().call();
	const root = await web3_contract.methods.root().call();
	const saleStart = await web3_contract.methods.saleStart().call();
	const saleEnd = await web3_contract.methods.saleEnd().call();
	const halvingTime = await web3_contract.methods.halvingTime().call();
	const timeFlowQuantum = await web3_contract.methods.timeFlowQuantum().call();
	const seqDuration = await web3_contract.methods.seqDuration().call();
	const seqOffset = await web3_contract.methods.seqOffset().call();
	const getStartPrices = await web3_contract.methods.getStartPrices().call();
	const beneficiary = await web3_contract.methods.beneficiary().call();
	const isActive = await web3_contract.methods.isActive().call();
	const features = await web3_contract.methods.features().call();
	const r0 = await web3_contract.methods.userRoles(a0).call();
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
		{"key": "Start Prices", "value": getStartPrices},
		{"key": "Beneficiary", "value": beneficiary},
		{"key": "Is Active", "value": isActive},
		{"key": "Features", "value": features}, // 2
		{"key": "Deployer Role", "value": r0}, // 16
	]);
}

// Tags represent what the deployment script acts on. In general, it will be a single string value,
// the name of the contract it deploys or modifies.
// Then if another deploy script has such tag as a dependency, then when the latter deploy script has a specific tag
// and that tag is requested, the dependency will be executed first.
// https://www.npmjs.com/package/hardhat-deploy#deploy-scripts-tags-and-dependencies
module.exports.tags = ["v1_deploy", "deploy", "v1"];
