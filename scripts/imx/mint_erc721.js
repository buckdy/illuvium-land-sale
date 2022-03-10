// Get IMX common functions
const {
	getImmutableXClient,
	getLandSaleContract,
	getBlueprint,
	mint_l2,
} = require("./common");

// config file contains known deployed token addresses, IMX settings
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// Get configuration for the network
	const config = Config(network.name);

	// Get minter/client
	const client = await getImmutableXClient(network.name);

	// Get LandSale contract install
	const landSale = getLandSaleContract(network.name);

	// Require data for the blueprint
	let buyer;
	let tokenId;
	let blueprint;

	// Add event handler to PlotBoughtL2 event
	// Every time a PlotBoughtL2 event is emitted, the logic for `.on('data', logic)` will be executed
	landSale.events.PlotBoughtL2({})
		.on("data", async(event) => {
			buyer = event.returnValues['_by'];
			tokenId = event.returnValues['_tokenId'];
			blueprint = event.returnValues['_plotPacked'].toString();
			log.info(await mint_l2(client, config.landERC721, buyer, tokenId, blueprint));
		})
		.on("connected", () => {
			log.info(`Capturing PlotBoughtL2 event on ${config.landSale}`);
		})
		.on("error", err => {
			log.error(err);
		});
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => {
	} /*process.exit(0)*/)
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
