// Get IMX common functions
const {
    getImmutableXClient,
    MintableERC721TokenType,
    getWallet,
} = require("./common");

// Get IMX utils
const {
    getLandERC721ProxyAddress,
    getLandSaleContractAddress,
    landSaleAbi,
    getBlueprint,
} = require("./utils");

// Load Web3
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://${process.env.NETWORK_NAME}.infura.io/ws/v3/${process.env.INFURA_KEY}`));

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
    const mintBodyPayload = JSON.stringify({
        "ether_key": to.toLowerCase(),
        "tokens": [{
            "type": MintableERC721TokenType.MINTABLE_ERC721,
            "data": {
                "id": tokenId.toString(),
                "blueprint": blueprint,
                "token_address": l1MintContractAddress
            }
        }],
        "auth_signature": "" // Leave empty, collection owner will sign the transaction
    });

    const authSignature = web3.eth.accounts.sign(mintBodyPayload, process.env.USER_PRIVATE_KEY).signature;

    console.log("Minting on L2...");
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
                authSignature
            },
        ],
    });
    console.log(result);
}

async function main() {
    // Get minter/client
    const minter = await getImmutableXClient(process.env.NETWORK_NAME, process.env.USER_PRIVATE_KEY);

    // Get LandSale contract install
    const landSale = getLandSaleContract(process.env.NETWORK_NAME);

    // Get L1 NFT address
    const l1NFTAddress = getLandERC721ProxyAddress(process.env.NETWORK_NAME);

    // Nonce
    let nonce = 1;

    // Require data for the blueprint
    let buyer;
    let tokenId;
    let blueprint;

    landSale.events.PlotBought({})
        .on("data", async (event) => {
            console.log("PlotBought EVENT EMMITED");
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

main();