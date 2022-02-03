// Get IMX common functions
const {
    getImmutableXClient,
    MintableERC721TokenType,
} = require("./common");

// Get IMX utils
const {
    getLandERC721ProxyAddress,
    getLandSaleContractAddress,
    landSaleAbi,
    getBlueprint,
} = require("./utils");

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

const fs = require("fs");

function getLandSaleContract(network) {
    return new web3.eth.Contract(
        landSaleAbi,
        getLandSaleContractAddress(network)
    );
}

async function mint(l1MintContractAddress, to, tokenId, blueprint, minter) {
    console.log("Minting on L2...");
    const mintResults = await minter.mint({
        mints: [
            {
                etherKey: to.toLowerCase(),
                tokens: [{
                    type: MintableERC721TokenType.MINTABLE_ERC721,
                    data: {
                        tokenAddress: l1MintContractAddress,
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
    // Get minter/client
    const minter = await getImmutableXClient();

    // Get LandSale contract install
    const landSale = getLandSaleContract();

    // Get L1 NFT address
    const l1NFTAddress = getLandERC721ProxyAddress();

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

    await mint(l1NFTAddress, buyer, tokenId, blueprint, minter);

    if (false) {

    landSale.events.PlotBought({})
        .on("data", async (event) => {
            console.log("PlotBought EVENT EMMITED");
            fs.writeFileSync("event.json", JSON.stringify(event));
            process.exit(0);
            buyer = event.returnValues['0'];
            tokenId = event.returnValues['1'];
            blueprint = getBlueprint(event.returnValues['3']).toString();
            await mint(l1NFTAddress, buyer, tokenId, blueprint, minter, nonce++);
        })
        .on("connected", () => {
            console.log(`Capturing PlotBought event on ${getLandSaleContractAddress(process.env.NETWORK_NAME)}`);
        })
        .on("error", console.error);
    }
}

main();