// Get IMX common functions
const {
    getImmutableXClient,
    MintableERC721TokenType,
    getLandSaleContract,
    pack,
} = require("./common");

// Get configuration
const Config = require("./config");

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev Packs plotStore and turn it into a string representation of uint256 in decimal format
 * 
 * @param plotStore PlotStore object
 * @return decimal string representation of packed data
 */
function getBlueprint(plotStore) {
    return pack(plotStore).toString(10);
}

/**
 * @dev Mints an NFT on L2 (IMX)
 * 
 * @param erc721Contract the address of the collection contract on L1 in the respective network
 * @param to address to mint to
 * @param tokenId ID of the token
 * @param blueprint token metadata
 * @param minter the owner of the L1 contract and collection on L2
 * @return the mint result metadata or null if minting fails
 */
async function mint(erc721Contract, to, tokenId, blueprint, minter) {
    // a token to mint - plotStorePack should be a string representation of uint256 in decimal format
	const token = {
		type: MintableERC721TokenType.MINTABLE_ERC721,
		data: {
			id: tokenId.toString(),
			// note: blueprint cannot be empty
			blueprint, // This will come in the mintingBlob to the contract mintFor function as {tokenId}:{plotStorePack}
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
        console.log(`Minting of tokenId ${tokenId} of collection ${erc721Contract} successful on L2`);
    } catch (error) {
        console.error(error);
        return null;
    }
    return mintResults.results[0]
}

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
            console.log(await mint(config.landERC721, buyer, tokenId, blueprint, minter));
        })
        .on("connected", () => {
            console.log(`Capturing PlotBought event on ${config.landSale}`);
        })
        .on("error", err => {
            console.log(err);
        });
}

main();