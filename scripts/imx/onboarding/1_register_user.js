// Get IMX common functions
const {
	getImmutableXClientFromWallet,
	getWalletFromMnemonic,
} = require("../common");

// Onboarding config file
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev Registers new IMX Client for a user
 * 
 * @param network Network name to register user ("ropsten" or "mainnet")
 * @param wallet Wallet instance of "@ethersproject/wallet" for the registering user
 */
async function registerUser(wallet, IMXClientConfig) {
	// Instantiate IMX client for given configuration and wallet
	const client = getImmutableXClientFromWallet(wallet, IMXClientConfig);

	log.info("Registering user...");
	try {
		await client.getUser({
			client: client.address.toLowerCase()
		});
		log.info(`User ${user.address.toLowerCase()} already registered`);
	}
	catch {
		try {
			await client.registerImx({
				etherKey: client.address.toLowerCase(),
				startPublicKey: client.starkPublicKey
			});
			log.info(`User ${user.address.toLowerCase()} registered successfully!`);
		}
		catch(error) {
			throw JSON.stringify(error, null, 2);
		}
	}
}

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// Get configuration for network
	const config = Config(network.name);

	// Get configuration for user registration
	const registerUserConfig = config.registerUser;

	// Get wallet from mnemonic provided in MNEMONIC3 (ropsten) or MNEMONIC1 (mainnet) env variables
	const wallet = getWalletFromMnemonic(network.name, registerUserConfig.mnemonic, registerUserConfig.address_index);

	// Register user for given `wallet` and `IMXClientConfig`
	await registerUser(
		wallet,
		config.IMXClientConfig
	);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
