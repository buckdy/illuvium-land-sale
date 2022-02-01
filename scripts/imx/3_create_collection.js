// Get IMX common functions
const {
    getImmutableXClient,
    getWallet
} = require("./common");

// Get IMX utils
const {
    getLandERC721ProxyAddress
} = require("./utils");

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

async function createCollection(network, userPrivateKey, projectId, collectionName) {
    const user = await getImmutableXClient(network, userPrivateKey);

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
            contract_address: getLandERC721ProxyAddress(network),
            owner_public_key: getWallet(process.env.USER_PRIVATE_KEY).publicKey,
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
        process.env.NETWORK_NAME, 
        process.env.USER_PRIVATE_KEY, 
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