// Get IMX common functions
const {
	getImmutableXClient,
} = require("../common");

// config file contains known deployed token addresses, IMX settings
const Config = require("../config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev adds metadata schema for the collection
 *
 * @param collectionMetadata metadata to add to the collection
 */
async function addMetadataSchema(collectionMetadata) {
	const config = Config(network.name);
	const user = await getImmutableXClient(network.name, config.IMXClientConfig);

	// Check if collection exists
	try {
		await user.getCollection({
			address: getLandERC721ProxyAddress()
		});
	}
	catch(error) {
		throw JSON.stringify(error, null, 2);
	}

	const collection = await user.addMetadataSchemaToCollection(
		config.landERC721,
		{
			metadata: [collectionMetadata]
		}
	);

	log.info(`Added metadata schema to collection: ${getLandERC721ProxyAddress()}`);
	log.info(JSON.stringify(collection, null, 2));
}

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// For more details, please refer to https://docs.x.immutable.com/docs/asset-metadata
	const collectionMetadata = {
		//name: "ASSET_DISPLAY_NAME",
		//description: "ASSET_DESCRIPTION",
		//image_url: "ASSET_DISPLAY_IMAGE",
		//image: "ALTERNATIVE_DISPLAY_IMAGE",
		//animation_url: "ANIMATION_URL",
		//animation_url_mime_type: "MIME_TYPE_ANIMATION_URL",
		//youtube_url: "URL_FOR_YOUTUBE_VIDEO"
	}
	await addMetadataSchema(
		collectionMetadata
	)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
