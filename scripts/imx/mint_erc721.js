// Get IMX common functions
const {
    getImmutableXClient,
    MintableERC721TokenType,
    landSaleAbi,
    pack,
} = require("./common");

// Get configuration
const Config = require("./config");

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

const fs = require("fs");

function getBlueprint(plotStore) {
    return web3.utils.padLeft(web3.utils.toHex(pack(plotStore)), 0x40); //64 chars, since each byte is composed by 2 chars
}

function getLandSaleContract(address) {
    return new web3.eth.Contract(
                landSaleAbi,
                address
            );
}

async function mint(erc721Contract, to, tokenId, blueprint, minter) {
    // a token to mint
	const token = {
		type: MintableERC721TokenType.MINTABLE_ERC721,
		data: {
			id: tokenId.toString(),
			// note: blueprint cannot be empty
			blueprint, // This will come in the mintingBlob to the contract mintFor function as {tokenId}:{any metadata}
			tokenAddress: erc721Contract,
		},
	};

    log.info("Minting on L2...");
    let mintResults;
    try {    
        mintResults = await minter.mint({
            mints: [
                {
                    etherKey: to.toLowerCase(),
                    tokens: [token],
                    nonce: "1", // Automatically populated by the lib
                    authSignature: "", // Automatically populated by the lib
                },
            ],
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
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
    blueprint = getBlueprint(plotStore);

    await mint(config.landERC721, buyer, tokenId, blueprint, minter);

    if (false) {

    landSale.events.PlotBought({})
        .on("data", async (event) => {
            console.log("PlotBought EVENT EMMITED");
            fs.writeFileSync("event.json", JSON.stringify(event));
            process.exit(0);
            buyer = event.returnValues['0'];
            tokenId = event.returnValues['1'];
            blueprint = getBlueprint(event.returnValues['3'])
            await mint(config.landERC721, buyer, tokenId, blueprint, minter);
        })
        .on("connected", () => {
            console.log(`Capturing PlotBought event on ${config.landSale}`);
        })
        .on("error", console.error);
    }
}

main();