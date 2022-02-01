// Get IMX client and token type
const { ImmutableXClient, MintableERC721TokenType } = require("@imtbl/imx-sdk");

// Get IMX utilities
const { 
    getStarkContractAddress, 
    getPublicApiUrl, 
    getRegistrationContractAddress,
    landSaleAbi,
    getLandSaleContractAddress
} = require("utils");

// Get and instantiate web3 object
const web3 = new require("web3")();

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

async function registerUser(client) {
    log.info("Registering user...");
    try {
        await client.getUser({
            user: client.address.toLowerCase()
        });
        log.info(`User ${client.address.toLowerCase()} already registered`);
    } catch {
        try {
            await client.registerImx({
                etherKey: client.address.toLowerCase(),
                startPublicKey: client.starkPublicKey
            });
            log.info(`User ${client.address.toLowerCase()} registered successfully!`);
        } catch (error) {
            throw JSON.stringify(error, null, 2);
        }
    }
}

async function registerClient(network) {
    const client = await ImmutableXClient.build({
        publicApiUrl: getPublicApiUrl(network),
        signer: process.env.IMX_SIGNER,
        starkContractAddress: getStarkContractAddress(network),
        registrationContractAddress: getRegistrationContractAddress(network), // Contract used to register new clients
    });

    registerUser(client);
    return client;
}

function getLandSaleContract(network) {
    return new web3.eth.Contract(
        landSaleAbi,
        getLandSaleContractAddress(network)
    );
}

async function mint(to, tokenID, blueprint, minter, nonce) {
    const result = await minter.mint({
        mints: [
            {
                etherKey: to.toLowerCase(),
                tokens: [{
                    type: MintableERC721TokenType.MINTABLE_ERC721,
                    data: {
                        tokenAddress: process.env.LANDERC721_ADDRESS, // NFT contract address in L1
                        id: tokenID, // ID of the token for both L1 and L2
                        blueprint, // Will be used to set the token metadata in L1, usually in the CSV format
                    }
                }],
                nonce: nonce.toString(),
                authSignature: "", // Leave empty, will be signed internally by the client signer (must be the NFT contract owner)
            },
        ],
    });
    return result;
}

async function main() {
    // Further will be replaced by an event listener (listen to buy events from land-sale)
    const client = await registerClient(process.env.NETWORK_NAME);
    
    // Get LandSale contract install
    const landSale = getLandSaleContract(process.env.NETWORK_NAME);

    landSale.events.PlotBought({})
        .on("data", async (event) => {
            console.log(event);
            await mint()
        })
        .on("error", console.error);
    // Assert tokenIDs have the same length as blueprints and addresses
    assert(tokenIDs.length === blueprints.length && tokenIDs.length === addresses.length);
    for (const i = 0; i < tokenIDs.length; i++) {
        await mint(addresses[i], tokenIDs[i], client, nonce++);
    }

    console.log("Minting loop terminated!");
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });