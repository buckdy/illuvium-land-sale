// deploys AwesomeToken(s)
//   - ZeppelinERC20Mock
//   - ZeppelinERC721Mock

// Run: npx hardhat run --network rinkeby ./scripts/deploy_awesome.js

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

// BN utils
const {print_amt} = require("./include/big_number_utils");

// features and roles in use
const {
	ROLE_TOKEN_CREATOR,
	FULL_PRIVILEGES_MASK: MAX_UINT256,
} = require("./include/features_roles");

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// Hardhat always runs the compile task when running scripts with its command
	// line interface.
	//
	// If this script is run directly using `node` you may want to call compile
	// manually to make sure everything is compiled
	// await hre.run('compile');

	// check if we're on the local hardhat test network
	if (network.name === "hardhat") {
		console.warn(
			"You are trying to deploy a contract to the Hardhat Network, which" +
			"gets automatically created and destroyed every time. Use the Hardhat" +
			" option '--network localhost'"
		);
	}

	// print some useful info on the account we're using for the deployment
	const [A0] = await web3.eth.getAccounts();
	let nonce = await web3.eth.getTransactionCount(A0);
	let balance = await web3.eth.getBalance(A0);
	// print initial debug information
	console.log("network %o", network.name);
	console.log("service account %o, nonce: %o, balance: %o ETH", A0, nonce, print_amt(balance));

	// config file contains known deployed addresses, deployment settings
	const Config = require('./config');

	// a collection of all known addresses (smart contracts and external)
	const conf = Config(network.name);

	// an object to contain all ABI linked instances to the addresses above
	const instances = {};

	// link/deploy the LandERC721 token
	const LandERC721 = await hre.ethers.getContractFactory("LandERC721");
	if(conf.LandERC721) {
		console.log("Connecting to LandERC721 at %o", conf.LandERC721);
		instances.LandERC721 = await LandERC721.attach(conf.LandERC721);
		const name = await instances.LandERC721.name();
		const symbol = await instances.LandERC721.symbol();
		const totalSupply = await instances.LandERC721.totalSupply();
		const userRoles = await instances.LandERC721.userRoles(A0);
		console.log("Connected to LandERC721 at %o:", conf.LandERC721);
		console.table([
			{"key": "Name", "value": name},
			{"key": "Symbol", "value": symbol},
			{"key": "Total Supply", "value": totalSupply.toString()},
			{"key": "A0 Role", "value": userRoles.toHexString().toUpperCase()},
		]);
	}
	else {
		console.log("deploying LandERC721");
		const token = await LandERC721.deploy();
		instances.LandERC721 = await token.deployed();
		conf.LandERC721 = instances.LandERC721.address;
		console.log("LandERC721 deployed to %o", conf.LandERC721);
	}

	// link/deploy the LandSale
	const LandSale = await hre.ethers.getContractFactory("LandSale");
	if(conf.LandSale) {
		console.log("Connecting to LandSale at %o", conf.LandSale);
		instances.LandSale = await LandSale.attach(conf.LandSale);
		const tokenAddress = await instances.LandSale.tokenAddress();
		console.log("Connected to LandSale at %o:", conf.LandSale);
		console.table([
			{"key": "tokenAddress", "value": tokenAddress},
		]);

		assert.equal(tokenAddress, conf.LandERC721, "conf error: LandERC721 mismatch with LandSale.tokenAddress");
	}
	else {
		console.log("deploying LandSale");
		const sale = await LandSale.deploy(conf.LandERC721, 0, 4_000_000_000, 1_000, 1);
		instances.LandSale = await sale.deployed();
		conf.LandSale = instances.LandSale.address;
		console.log("LandSale deployed to %o", conf.LandSale);
	}

	console.log("execution complete");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});
