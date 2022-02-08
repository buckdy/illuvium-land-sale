// Get IMX common functions
const {
    getImmutableXClient,
    ERC721TokenType,
    getWallet,
} = require("./common");

// Get configuration
const Config = require("./config");

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

async function burn(tokenId, sender) {
    const config = Config(network.name);
    const client = await getImmutableXClient(network.name, config.IMXClientConfig);

    const token = {
		type: ERC721TokenType.ERC721,
		data: {
			tokenId: tokenId.toString(),
			tokenAddress: config.landERC721,
		},
	};

    let deletedToken;
    try {
        deletedToken = await client.burn({
            quantity: "1",
            sender,
            token,
        });
        console.log(deletedToken);
    } catch (error) {
        console.log(`Token with id ${tokenId.toString()} not found in ERC721 contract address ${config.landERC721}`);
    }
}

async function main() {
    await burn(process.env.TOKEN_ID_TO_BURN);
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });