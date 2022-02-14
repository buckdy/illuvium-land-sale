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
    const minter = await getImmutableXClient(network.name);

    // Get LandSale contract install
    const landSale = getLandSaleContract(network.name);

    // Require data for the blueprint
    let buyer;
    let tokenId;
    let blueprint;

    // Add event handler to PlotBought event
    // Every time a PlotBought event is emmited, the logic for `.on('data', logic)` will be executed
    landSale.events.PlotBought({})
        .on("data", async (event) => {
            buyer = event.returnValues['_by'];
            tokenId = event.returnValues['_tokenId'];
            blueprint = getBlueprint(event.returnValues['_plot']);
            log.info(await mint_l2(network.name, buyer, tokenId, blueprint, minter));
        })
        .on("connected", () => {
            log.info(`Capturing PlotBought event on ${config.landSale}`);
        })
        .on("error", err => {
            log.error(err);
        });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => {} /*process.exit(0)*/)
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
