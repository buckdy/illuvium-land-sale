// Hardhat configuration which uses account private key instead of mnemonic
// use --config hardhat.config-p_key.js to run hardhat with this configuration
// script expects following environment variables to be set:
//   - P_KEY1 – mainnet private key, should start with 0x
//   - P_KEY3 – ropsten private key, should start with 0x
//   - P_KEY4 – rinkeby private key, should start with 0x
//   - INFURA_KEY – Infura API key (Project ID)
//   - ETHERSCAN_KEY – Etherscan API key

// Loads env variables from .env file
require('dotenv').config()

// Enable Truffle 5 plugin for tests
// https://hardhat.org/guides/truffle-testing.html
require("@nomiclabs/hardhat-truffle5");

// enable etherscan integration
// https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html
require("@nomiclabs/hardhat-etherscan");

// enable Solidity-coverage
// https://hardhat.org/plugins/solidity-coverage.html
require("solidity-coverage");

// enable hardhat-gas-reporter
// https://hardhat.org/plugins/hardhat-gas-reporter.html
require("hardhat-gas-reporter");

// compile Solidity sources directly from NPM dependencies
// https://github.com/ItsNickBarry/hardhat-dependency-compiler
require("hardhat-dependency-compiler");

// adds a mechanism to deploy contracts to any network,
// keeping track of them and replicating the same environment for testing
// https://www.npmjs.com/package/hardhat-deploy
require("hardhat-deploy");

// verify environment setup, display warning if required, replace missing values with fakes
// m/44'/60'/0'/0/0 for "test test test test test test test test test test test junk" mnemonic
const FAKE_P_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
if(!process.env.P_KEY1) {
	console.warn("P_KEY1 is not set. Mainnet deployments won't be available");
	process.env.P_KEY1 = FAKE_P_KEY;
}
else if(!process.env.P_KEY1.startsWith("0x")) {
	console.warn("P_KEY1 doesn't start with 0x. Appended 0x");
	process.env.P_KEY1 = "0x" + process.env.P_KEY1;
}
if(!process.env.P_KEY3) {
	console.warn("P_KEY3 is not set. Rinkeby deployments won't be available");
	process.env.P_KEY3 = FAKE_P_KEY;
}
else if(!process.env.P_KEY3.startsWith("0x")) {
	console.warn("P_KEY3 doesn't start with 0x. Appended 0x");
	process.env.P_KEY3 = "0x" + process.env.P_KEY3;
}
if(!process.env.P_KEY4) {
	console.warn("P_KEY4 is not set. Rinkeby deployments won't be available");
	process.env.P_KEY4 = FAKE_P_KEY;
}
else if(!process.env.P_KEY4.startsWith("0x")) {
	console.warn("P_KEY4 doesn't start with 0x. Appended 0x");
	process.env.P_KEY4 = "0x" + process.env.P_KEY4;
}
if(!process.env.INFURA_KEY) {
	console.warn("INFURA_KEY is not set. Deployments won't be available");
	process.env.INFURA_KEY = "";
}
if(!process.env.ETHERSCAN_KEY) {
	console.warn("ETHERSCAN_KEY is not set. Deployed smart contract code verification won't be available");
	process.env.ETHERSCAN_KEY = "";
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	defaultNetwork: "hardhat",
	networks: {
		// https://hardhat.org/hardhat-network/
		hardhat: {
			// set networkId to 0xeeeb04de as for all local networks
			chainId: 0xeeeb04de,
			// set the gas price to one for convenient tx costs calculations in tests
			gasPrice: 1,
			// London hard fork fix: impossible to set gas price lower than baseFeePerGas (875,000,000)
			initialBaseFeePerGas: 0,
			accounts: {
				count: 35,
			},
/*
			forking: {
				url: "https://mainnet.infura.io/v3/" + process.env.INFURA_KEY, // create a key: https://infura.io/
				enabled: !!(process.env.HARDHAT_FORK),
			},
*/
		},
		// https://etherscan.io/
		mainnet: {
			// url: "https://eth-mainnet.alchemyapi.io/v2/123abc123abc123abc123abc123abcde",
			url: "https://mainnet.infura.io/v3/" + process.env.INFURA_KEY, // create a key: https://infura.io/
			gasPrice: "auto",
			accounts: [
				process.env.P_KEY1, // export private key from mnemonic: https://metamask.io/
			],
		},
		// https://ropsten.etherscan.io/
		ropsten: {
			url: "https://ropsten.infura.io/v3/" + process.env.INFURA_KEY, // create a key: https://infura.io/
			gasPrice: "auto",
			accounts: [
				process.env.P_KEY3, // export private key from mnemonic: https://metamask.io/
			]
		},
		// https://rinkeby.etherscan.io/
		rinkeby: {
			url: "https://rinkeby.infura.io/v3/" + process.env.INFURA_KEY, // create a key: https://infura.io/
			gasPrice: "auto",
			accounts: [
				process.env.P_KEY4, // export private key from mnemonic: https://metamask.io/
			],
		},
	},

	// Configure Solidity compiler
	solidity: {
		// https://hardhat.org/guides/compile-contracts.html
		compilers: [
			{
				version: "0.8.11",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200
					}
				}
			},
		]
	},

	// Set default mocha options here, use special reporters etc.
	mocha: {
		// timeout: 100000,

		// disable mocha timeouts:
		// https://mochajs.org/api/mocha#enableTimeouts
		enableTimeouts: false,
		// https://github.com/mochajs/mocha/issues/3813
		timeout: false,
	},

	// Configure etherscan integration
	// https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html
	etherscan: {
		// Your API key for Etherscan
		// Obtain one at https://etherscan.io/
		apiKey: process.env.ETHERSCAN_KEY
	},

	// hardhat-gas-reporter will be disabled by default, use REPORT_GAS environment variable to enable it
	// https://hardhat.org/plugins/hardhat-gas-reporter.html
	gasReporter: {
		enabled: !!(process.env.REPORT_GAS)
	},

	// compile Solidity sources directly from NPM dependencies
	// https://github.com/ItsNickBarry/hardhat-dependency-compiler
	dependencyCompiler: {
		paths: [
			// ERC1967 is used to deploy upgradeable contracts
			"@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol",
			// Chainlink Price Feed Aggregator interface is used to connect to Chainlink Price Feed Aggregator
			"@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface",
		],
	},

	// namedAccounts allows you to associate names to addresses and have them configured per chain
	// https://github.com/wighawag/hardhat-deploy#1-namedaccounts-ability-to-name-addresses
	namedAccounts: {
		// Illuvium ERC20 (ILV)
		ilv_address: {
			"mainnet": "0x767FE9EDC9E0dF98E07454847909b5E959D7ca0E",
			"rinkeby": "0xb671194b2e9fB884f65B92a1DBaB875E5F76ec5C",
		},
		// Escrowed Illuvium ERC (sILV)
		sIlv_address: {
			"mainnet": "0x398AeA1c9ceb7dE800284bb399A15e0Efe5A9EC2",
			"rinkeby": "0x5051c7f88bCC6c9c4882A3A342a90ace4f90446A",
		},
		// Chainlink Price Feed Aggregator
		chainlink_aggregator: {
			"mainnet": "0xf600984CCa37cd562E74E3EE514289e3613ce8E4",
			"rinkeby": "0x48731cF7e84dc94C5f84577882c14Be11a5B7456",
		},
	},

}