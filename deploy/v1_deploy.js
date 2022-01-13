// deploy: npx hardhat deploy --network rinkeby --tags v1_deploy
// verify: npx hardhat etherscan-verify --network rinkeby

// script is built for hardhat-deploy plugin:
// A Hardhat Plugin For Replicable Deployments And Easy Testing
// https://www.npmjs.com/package/hardhat-deploy

// BN utils
const {
	toBN,
	print_amt,
} = require("../test/include/bn_utils");

// ERC721 token name and symbol
const {
	NAME,
	SYMBOL,
} = require("../test/land_nft/include/erc721_constants");

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
	});
	// get Land ERC721 implementation v1 deployment details
	const land_nft_v1_deployment = await deployments.get("LandERC721_v1");
	const land_nft_v1_contract = new web3.eth.Contract(land_nft_v1_deployment.abi, land_nft_v1_deployment.address);

	// prepare the initialization call bytes
	const land_nft_proxy_init_data = land_nft_v1_contract.methods.postConstruct(NAME, SYMBOL).encodeABI();

	// deploy Land ERC721 Proxy
	await deployments.deploy("LandERC721_Proxy", {
		// address (or private key) that will perform the transaction.
		// you can use `getNamedAccounts` to retrieve the address you want by name.
		from: A0,
		contract: "ERC1967Proxy",
		// the list of argument for the constructor (or the upgrade function in case of proxy)
		args: [land_nft_v1_deployment.address, land_nft_proxy_init_data],
		// if set it to true, will not attempt to deploy even if the contract deployed under the same name is different
		skipIfAlreadyDeployed: true,
		// if true, it will log the result of the deployment (tx hash, address and gas used)
		log: true,
	});
	// get Land ERC721 proxy deployment details
	const land_nft_proxy_deployment = await deployments.get("LandERC721_Proxy");
	// print Land ERC721 proxy deployment details
	await print_land_nft_acl_details(A0, land_nft_v1_deployment.abi, land_nft_proxy_deployment.address);

	// deploy Land Descriptor
	await deployments.deploy("LandDescriptor", {
		// address (or private key) that will perform the transaction.
		// you can use `getNamedAccounts` to retrieve the address you want by name.
		from: A0,
		contract: "LandDescriptorImpl",
		// the list of argument for the constructor (or the upgrade function in case of proxy)
		// args: [],
		// if set it to true, will not attempt to deploy even if the contract deployed under the same name is different
		skipIfAlreadyDeployed: true,
		// if true, it will log the result of the deployment (tx hash, address and gas used)
		log: true,
	});
	// get Land Descriptor implementation deployment details
	const land_descriptor_deployment = await deployments.get("LandDescriptor");
	// TODO: set the descriptor via setLandDescriptor

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

	// print some debugging info about the connected instances
	const sIlv_erc20_artifact = await deployments.getArtifact("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");
	await print_sIlv_erc20_details(A0, sIlv_erc20_artifact.abi, sIlv_address);
	const oracle_artifact = await deployments.getArtifact("LandSaleOracle");
	await print_oracle_details(A0, oracle_artifact.abi, oracle_address);

	// deploy Land Sale v1
	await deployments.deploy("LandSale_v1", {
		// address (or private key) that will perform the transaction.
		// you can use `getNamedAccounts` to retrieve the address you want by name.
		from: A0,
		contract: "LandSale",
		// the list of argument for the constructor (or the upgrade function in case of proxy)
		args: [land_nft_proxy_deployment.address, sIlv_address, oracle_address],
		// if set it to true, will not attempt to deploy even if the contract deployed under the same name is different
		skipIfAlreadyDeployed: true,
		// if true, it will log the result of the deployment (tx hash, address and gas used)
		log: true,
	});
	// get Land Sale v1 deployment details
	const land_sale_v1_deployment = await deployments.get("LandSale_v1");
	// print Land Sale v1 deployment details
	await print_land_sale_acl_details(A0, land_sale_v1_deployment.abi, land_sale_v1_deployment.address);
};

// prints generic NFT info (name, symbol, etc.) + AccessControl (features, deployer role)
async function print_land_nft_acl_details(a0, abi, address) {
	const web3_contract = new web3.eth.Contract(abi, address);
	const name = await web3_contract.methods.name().call();
	const symbol = await web3_contract.methods.symbol().call();
	const totalSupply = parseInt(await web3_contract.methods.totalSupply().call());
	const features = toBN(await web3_contract.methods.features().call());
	const r0 = toBN(await web3_contract.methods.userRoles(a0).call());
	console.log("successfully connected to LandERC721 at %o", address);
	console.table([
		{"key": "Name", "value": name},
		{"key": "Symbol", "value": symbol},
		{"key": "Total Supply", "value": totalSupply},
		{"key": "Features", "value": features.toString(2)}, // 2
		{"key": "Deployer Role", "value": r0.toString(16)}, // 16
	]);
	return {features, r0};
}

// prints generic ERC20 info (name, symbol, etc.)
async function print_sIlv_erc20_details(a0, abi, address) {
	const web3_contract = new web3.eth.Contract(abi, address);
	const name = await web3_contract.methods.name().call();
	const symbol = await web3_contract.methods.symbol().call();
	const totalSupply = await web3_contract.methods.totalSupply().call();
	console.log("successfully connected to sILV ERC20 at %o", address);
	console.table([
		{"key": "Name", "value": name},
		{"key": "Symbol", "value": symbol},
		{"key": "Total Supply", "value": print_amt(totalSupply)},
	]);
}

// prints few conversion rates extracted from LandSaleOracle
async function print_oracle_details(a0, abi, address) {
	const web3_contract = new web3.eth.Contract(abi, address);
	const one = await web3_contract.methods.ethToIlv(web3.utils.toWei("1", "ether")).call();
	const five = await web3_contract.methods.ethToIlv(web3.utils.toWei("5", "ether")).call();
	const ten = await web3_contract.methods.ethToIlv(web3.utils.toWei("10", "ether")).call();
	const fifty = await web3_contract.methods.ethToIlv(web3.utils.toWei("50", "ether")).call();
	console.log("successfully connected to Land Sale Oracle at %o", address);
	console.table([
		{"key": "1 ETH to sILV", "value": print_amt(one)},
		{"key": "5 ETH to sILV", "value": print_amt(five)},
		{"key": "10 ETH to sILV", "value": print_amt(ten)},
		{"key": "50 ETH to sILV", "value": print_amt(fifty)},
	]);
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
module.exports.tags = ["v1_deploy", "deploy", "v1"];
