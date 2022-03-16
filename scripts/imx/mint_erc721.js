// Get IMX common functions
const {
	get_imx_client,
	get_land_sale_contract,
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
	const client = await get_imx_client(network.name);

	// Get LandSale contract install
	const land_sale = get_land_sale_contract(config.land_sale_addr, config.provider);

	// Require data for the blueprint
	let buyer;
	let token_id;
	let blueprint;

	// Add event handler to PlotBoughtL2 event
	// Every time a PlotBoughtL2 event is emitted, the logic for `.on('data', logic)` will be executed
	land_sale.events.PlotBoughtL2({})
		.on("data", async(event) => {
			buyer = event.returnValues['_by'];
			token_id = event.returnValues['_tokenId'];
			blueprint = event.returnValues['_plotPacked'].toString();
			log.info(await mint_l2(client, config.land_erc721_addr, buyer, token_id, blueprint));
		})
		.on("connected", () => {
			log.info(`Capturing PlotBoughtL2 event on ${config.land_sale_addr}`);
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
