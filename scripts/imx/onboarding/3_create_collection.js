// Get IMX common functions
const {
    getImmutableXClient,
    getWallet
} = require("../common");

// Get configuration
const Config = require("../config");

// Get log level
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
        await user.getProject({ project_id: projectId });
    } catch (error) {
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
    } catch (error) {
        throw JSON.stringify(error, null, 2);
    }

    log.info("Created collection:");
    log.info(JSON.stringify(collection, null, 2));
}

async function main() {
    await createCollection(
        process.env.IMX_PROJECT_ID, 
        process.env.COLLECTION_NAME
    );
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });