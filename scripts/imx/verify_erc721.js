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

async function verify(tokenId) {
    const config = Config(network.name);
    const client = await getImmutableXClient(network.name, config.IMXClientConfig);

    let token;
    try {
        token = await client.getAsset({
            address: config.landERC721,
            id: tokenId.toString()
        });
        console.log(`Token with ID ${tokenId} found for address ${config.landERC721}`);
        console.log("TOKEN METADATA:");
        console.log(token);
    } catch (error) {
        console.log(`Token with ID ${tokenId} does not exist for address ${config.landERC721}`);
    }
}

async function getAllAssets(loopNTimes = undefined) {
    const config = Config(network.name);
    const client = await getImmutableXClient(network.name, config.IMXClientConfig);

    let assets = new Array();
    let response;
    let cursor;

    loopNTimes = loopNTimes && loopNTimes > 0 ? loopNTimes : 1;
    do {
        response = await client.getAssets({
            collection: config.landERC721
        });
        assets = assets.concat(response.result);
        cursor = response.cursor;
        loopNTimes--;
    } while (cursor && loopNTimes > 0)

    if (assets.length > 0) {
        console.log(`Assets found for address ${config.landERC721}`);
        console.log(assets);
    } else {
        console.log(`No assets found for address ${config.landERC721}`);
    }
}

async function main() {
    if(process.env.TOKEN_ID) {
        await verify(process.env.TOKEN_ID);
    } else {
        await getAllAssets();
    }
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });