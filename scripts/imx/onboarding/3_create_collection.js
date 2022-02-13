// Get IMX common functions
const {
	getImmutableXClient,
	getWallet
} = require("../common");

// config file contains known deployed token addresses, IMX settings
const Config = require("../config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev creates a collection for the project
 *
 * @param projectId ID of the project which will own the collection
 * @param collectionName name of the collection
 */
async function createCollection(projectId, collectionName) {
	const config = Config(network.name);
	const user = await getImmutableXClient(network.name, config.IMXClientConfig);

	// Check if project exists
	try {
		await user.getProject({project_id: projectId});
	}
	catch(error) {
		throw JSON.stringify(error, null, 2);
	}

	let collection;
	try {
		collection = await user.createCollection({
			name: collectionName,
			contract_address: config.landERC721,
			owner_public_key: getWallet(network.name).publicKey,
			// icon_url: '',
			// metadata_api_url: '',
			// collection_image_url: '',
			project_id: parseInt(projectId, 10),
		});
	}
	catch(error) {
		throw JSON.stringify(error, null, 2);
	}

	log.info("Created collection:");
	log.info(JSON.stringify(collection, null, 2));
}

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	await createCollection(
		process.env.IMX_PROJECT_ID,
		process.env.COLLECTION_NAME
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
