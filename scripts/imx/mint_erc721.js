// Get IMX common functions
const {
    getImmutableXClient,
    getLandSaleContract,
    getBlueprint,
    mint_l2,
} = require("./common");

// Get configuration
const Config = require("./config");

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

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

main();