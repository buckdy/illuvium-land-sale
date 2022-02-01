// Get IMX common functions
const {
    getImmutableXClient,
    MintableERC721TokenType
} = require("./common");

// Get IMX utils
const {
    getLandERC721ProxyAddress,
    getLandSaleContractAddress,
    landSaleAbi,
} = require("./utils");

// Load Web3
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://mainnet.infura.io/ws/v3/${process.env.INFURA_KEY}`));

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

function getLandSaleContract(network) {
    return new web3.eth.Contract(
        landSaleAbi,
        getLandSaleContractAddress(network)
    );
}

async function mint(l1MintContractAddress, to, tokenId, blueprint, minter, nonce) {
    const result = await minter.mint({
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
                nonce: nonce.toString(),
                autSignature: "", // Leave empty, collection owner will sign the transaction
            },
        ],
    });
    console.log(result);
}

async function main() {
    // Get minter/client
    const minter = getImmutableXClient(process.env.NETWORK_NAME, process.env.USER_PRIVATE_KEY);

    // Get LandSale contract install
    const landSale = getLandSaleContract(process.env.NETWORK_NAME);

    // Get L1 NFT address
    const l1NFTAddress = getLandERC721ProxyAddress(process.env.NETWORK_NAME);

    // Nonce
    let nonce = 0;

    landSale.events.PlotBought({})
        .on("data", async (event) => {
            console.log(event);
            //await mint(l1NFTAddress, mintTo, tokenId, blueprint, minter, nonce++);
        })
        .on("connected", () => console.log("Minting event handler registered..."))
        .on("error", console.error);
}

main();