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
 * @dev creates a collection for the project
 *
 * @param client ImmutableXClient instance
 * @param projectId ID of the project which will own the collection
 * @param collectionMetadata containing the `contract_address`, `icon_url`,
 * 	`metadata_api_url`, `collection_image_url` and `name` fields
 * @return collection metadata
 */
async function createCollection(client, projectId, collectionMetadata) {
	// Check if project exists
	try {
		await client.getProject({project_id: parseInt(projectId, 10)});
	}
	catch(error) {
		log.error(error);
		throw JSON.stringify(error, null, 2);
	}

	// If project exists, create a collection for it
	log.info("Creating collection...");
	let collection;
	try {
		collection = await client.createCollection({
			name: collectionMetadata.name,
			contract_address: collectionMetadata.contract_address.toLowerCase(),
			owner_public_key: client.address.toLowerCase(),
			icon_url: collectionMetadata.icon_url,
			metadata_api_url: collectionMetadata.metadata_api_url,
			collection_image_url: collectionMetadata.collection_image_url,
			project_id: parseInt(projectId, 10),
		});
	}
	catch(error) {
		throw JSON.stringify(error, null, 2);
	}

	log.info("Created collection:");
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
		getWalletFromMnemonic(
			network.name, 
			config.mnemonic,
			config.address_index),
		config.IMXClientConfig
	);
	
	// Create collection given client, project id, collection name and ERC721 L1 contract address
	await createCollection(
		client,
		config.collection.project_id,
		config.collection
	);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
