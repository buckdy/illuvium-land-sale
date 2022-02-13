// Get IMX common functions
const {
	getImmutableXClient,
	ERC721TokenType,
	getWallet,
} = require("./common");

// config file contains known deployed token addresses, IMX settings
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// TODO: add @doc
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
	}
	catch(error) {
		console.log(`Token with id ${tokenId.toString()} not found in ERC721 contract address ${config.landERC721}`);
	}
}

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	await burn(process.env.TOKEN_ID_TO_BURN);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
