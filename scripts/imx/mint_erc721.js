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
    const minter = await getImmutableXClient(network.name, config.IMXClientConfig);

    // Get LandSale contract install
    const landSale = getLandSaleContract(network.name, config.landSale);

    // Require data for the blueprint
    let buyer;
    let tokenId;
    let blueprint;

    landSale.events.PlotBought({})
        .on("data", async (event) => {
            buyer = event.returnValues['_by'];
            tokenId = event.returnValues['_tokenId'];
            blueprint = getBlueprint(event.returnValues['_plot']);
            console.log(await mint_l2(config.landERC721, buyer, tokenId, blueprint, minter));
        })
        .on("connected", () => {
            console.log(`Capturing PlotBought event on ${config.landSale}`);
        })
        .on("error", err => {
            console.log(err);
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
