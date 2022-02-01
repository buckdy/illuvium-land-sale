// Get IMX client and token type
const { ImmutableXClient, MintableERC721TokenType } = require("@imtbl/imx-sdk");

// Get IMX utilities
const { 
    getStarkContractAddress, 
    getPublicApiUrl, 
    getRegistrationContractAddress 
} = require("utils");

// Get network name
const { network } = require("hardhat");

// Get and instantiate web3 object
const web3 = new require("web3")();

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

async function registerClient(network) {
    const client = await ImmutableXClient.build({
        publicApiUrl: getPublicApiUrl(network),
        signer: process.env.IMX_SIGNER,
        starkContractAddress: getStarkContractAddress(network),
        registrationContractAddress: getRegistrationContractAddress(network), // Contract used to register new clients
    });

    log.info("Registering client...");
    const registerImxResult = await client.registerImx({
        etherKey: minter.address.toLowerCase(),
        startPublicKey: minter.starkPublicKey
    });

    if (!registerImxResult.tx_hash) {
        log.info("Client registered successfully!");
    } else {
        log.info("Waiting for client registration to finish...");
        await web3.eth.wait_for_transaction_receipt(registerImxResult.tx_hash);
        log.info("Client registered successfully!");
    }
    return client;
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
    const client = await registerClient(network.name);
    const tokenIDs = [1];
    const blueprints = ["test,metadata"];
    const addresses = ["0x..."]
    let nonce = 1;

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