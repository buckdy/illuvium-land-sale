// Get IMX common functions
const {
	getImmutableXClientFromWallet,
	getWalletFromMnemonic,
} = require("../common");

// Onboarding config file
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev adds metadata schema for the collection
 *
 * @param collectionMetadata metadata to add to the collection
 * @return collection metadata
 */
async function addMetadataSchema(client, contractAddress, collectionMetadata) {
	// Check if collection exists
	try {
		await client.getCollection({
			address: contractAddress
		});
	}
	catch(error) {
		throw JSON.stringify(error, null, 2);
	}

	// If collection exist, modify it's metadata schema
	const collection = await client.addMetadataSchemaToCollection(
		config.landERC721,
		{
			metadata: [collectionMetadata]
		}
	);

	log.info(`Added metadata schema to collection: ${contractAddress}`);
	log.info(JSON.stringify(collection, null, 2));
	return collection;
}

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// Get configuration for network
	const config = Config(network.name);

	// Get IMX client instance
	const client = await getImmutableXClientFromWallet(
		getWalletFromMnemonic(network.name, config.registerUser.mnemonic),
		config.IMXClientConfig
	);

	// Add metadata for the collection with the given contract address
	log.info(await addMetadataSchema(
		client,
		config.collectionMetadata.contract_address,
		config.collectionMetadata.metadata
	));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
