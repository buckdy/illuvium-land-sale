// Get IMX common functions
const {
	get_imx_client_from_wallet,
	get_wallet_from_mnemonic,
} = require("../common");

// Onboarding config file
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev adds metadata schema for the collection
 *
 * @param contract_address address of the L1 ERC721 collection contract
 * @param collection_metadata metadata to add to the collection
 * @return collection metadata
 */
async function add_metadata_schema(client, contract_address, collection_metadata) {
	// Check if collection exists
	try {
		await client.getCollection({
			address: contract_address.toLowerCase()
		});
	}
	catch(error) {
		throw JSON.stringify(error, null, 2);
	}

	// If collection exist, modify it's metadata schema
	const collection = await client.addMetadataSchemaToCollection(
		contract_address.toLowerCase(),
		{
			metadata: collection_metadata
		}
	);

	log.info(`Added metadata schema to collection: ${contract_address.toLowerCase()}`);
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
	const client = await get_imx_client_from_wallet(
		get_wallet_from_mnemonic(
			network.name, 
			config.mnemonic,
			config.address_index),
		config.imx_client_config
	);

	// Add metadata for the collection with the given contract address
	log.info(await add_metadata_schema(
		client,
		config.collection_metadata.contract_address,
		config.collection_metadata.metadata
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
