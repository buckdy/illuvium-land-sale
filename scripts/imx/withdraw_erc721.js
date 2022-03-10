// Get IMX common functions
const {
	getImmutableXClient,
	completeWithdraw,
} = require("./common");

// Get IMX configuration
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// Get config for given network
	const config = Config(network.name)

	// Instantiate ImmutableXClient
	const client = await getImmutableXClient(network.name);

	if(process.env.WITHDRAW_STAGE === "prepare") {
		log.info(await prepareWithdraw(client, config.landERC721, process.env.TOKEN_ID_TO_WITHDRAW));
	}
	else if(process.env.WITHDRAW_STAGE === "complete") {
		log.info(await completeWithdraw(client, config.landERC721, process.env.TOKEN_ID_TO_WITHDRAW));
	}
	else {
		throw "Invalid WITHDRAW_STAGE value provided, please choose between 'prepare' and 'complete'";
	}
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});