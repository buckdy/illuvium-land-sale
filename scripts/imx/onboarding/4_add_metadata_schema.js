// Get IMX common functions
const {
    getImmutableXClient,
} = require("../common");

// Get configuration
const Config = require("../config");

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

async function addMetadataSchema(collectionMetadata) {
    const config = Config(network.name);
    const user = await getImmutableXClient();

    // Check if collection exists
    try {
        await user.getCollection({
            address: getLandERC721ProxyAddress()
        });
    } catch (error) {
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

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });