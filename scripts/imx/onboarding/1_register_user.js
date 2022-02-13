// Get IMX common functions
const {
	getImmutableXClient,
} = require("../common");

// config file contains known deployed token addresses, IMX settings
const Config = require("../config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev Registers new IMX Client for a user
 */
async function registerUser() {
	const config = Config(network.name);
	const client = await getImmutableXClient(network.name, config.IMXClientConfig);

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
	await registerUser();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
