// Get IMX common functions
const {
    getImmutableXClient,
    MintableERC721TokenType,
    landSaleAbi,
} = require("./common");

// Get configuration
const Config = require("./config");

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

const fs = require("fs");

function getBlueprint(plotStore) {
    return Web3.utils.toBN(plotStore.version).shln(248).maskn(256)
        .or(Web3.utils.toBN(plotStore.regionId).shln(240).maskn(248))
        .or(Web3.utils.toBN(plotStore.x).shln(224).maskn(240))
        .or(Web3.utils.toBN(plotStore.y).shln(208).maskn(224))
        .or(Web3.utils.toBN(plotStore.tierId).shln(200).maskn(208))
        .or(Web3.utils.toBN(plotStore.size).shln(184).maskn(200))
        .or(Web3.utils.toBN(plotStore.landmarkTypeId).shln(176).maskn(184))
        .or(Web3.utils.toBN(plotStore.elementSites).shln(168).maskn(176))
        .or(Web3.utils.toBN(plotStore.fuelSites).shln(160).maskn(168))
        .or(Web3.utils.toBN(plotStore.seed).maskn(160));
}

function getLandSaleContract(address) {
    return new web3.eth.Contract(
                landSaleAbi,
                address
            );
}

async function mint(erc721Contract, to, tokenId, blueprint, minter) {
    console.log("Minting on L2...");
    const mintResults = await minter.mint({
        mints: [
            {
                etherKey: to.toLowerCase(),
                tokens: [{
                    type: MintableERC721TokenType.MINTABLE_ERC721,
                    data: {
                        tokenAddress: erc721Contract,
                        id: tokenId.toString(),
                        blueprint,
                    },
                }],
                nonce: "1", // Automatically populated by the lib
                authSignature: "", // Automatically populated by the lib
            },
        ],
    });
    console.log(mintResults.results[0]);
}

async function main() {
    // Get configuration for the network
    const config = Config(network.name);

    // Get minter/client
    const minter = await getImmutableXClient(network.name, config.IMXClientConfig);

    // Get LandSale contract install
    const landSale = getLandSaleContract(config.landSale);

    // Require data for the blueprint
    let buyer;
    let tokenId;
    let blueprint;

    const event = JSON.parse(fs.readFileSync("event.json"));
    const plotStore = {
        version: event.returnValues['3'][0],
        regionId: event.returnValues['3'][1],
        x: event.returnValues['3'][2],
        y: event.returnValues['3'][3],
        tierId: event.returnValues['3'][4],
        size: event.returnValues['3'][5],
        landmarkTypeId: event.returnValues['3'][6],
        elementSites: event.returnValues['3'][7],
        fuelSites:event.returnValues['3'][8],
        seed: event.returnValues['3'][9]
    }

    buyer = event.returnValues['0'];
    tokenId = event.returnValues['1'];
    blueprint = getBlueprint(plotStore).toString();

    await mint(config.landERC721, buyer, tokenId, blueprint, minter);

    if (false) {

    landSale.events.PlotBought({})
        .on("data", async (event) => {
            console.log("PlotBought EVENT EMMITED");
            fs.writeFileSync("event.json", JSON.stringify(event));
            process.exit(0);
            buyer = event.returnValues['0'];
            tokenId = event.returnValues['1'];
            blueprint = getBlueprint(event.returnValues['3']).toString();
            await mint(config.landERC721, buyer, tokenId, blueprint, minter);
        })
        .on("connected", () => {
            console.log(`Capturing PlotBought event on ${config.landSale}`);
        })
        .on("error", console.error);
    }
}

main();