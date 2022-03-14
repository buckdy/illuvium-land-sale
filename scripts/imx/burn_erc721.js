// Get IMX common functions
const {
	get_immutablex_client,
	burn,
} = require("./common");

// Get IMX configuration file
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// Get configuration for given network
	const config = Config(network.name);

	// Retrieve IMX client for the provided network
	const client = get_immutablex_client(network.name);

	// Burn token with given ID and client -- The client signer should be the token owner
	await burn(client, config.land_erc721, process.env.TOKEN_ID_TO_BURN);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
