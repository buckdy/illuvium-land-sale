// Get IMX common functions
const {
	getImmutableXClient,
	prepareWithdraw,
	completeWithdraw,
} = require("./common");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	const client = await getImmutableXClient(network.name);
	//console.log(await prepareWithdraw(network.name, process.env.TOKEN_ID_TO_WITHDRAW, client));
	console.log(await completeWithdraw(network.name, process.env.TOKEN_ID_TO_WITHDRAW, client));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
