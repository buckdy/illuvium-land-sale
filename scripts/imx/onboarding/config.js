// Configuration for the onboarding scripts

// General config file for IMX scripts
const IMXConfig = require("../config");

// Import collection metadata
const collectionMetadata = require("./metadata.json");

// General configuration object
// Configuration for all the scripts and the only one necessary for -- 1_register_user.js
const generalConfig = {
    mnemonic: process.env.ONBOARDING_MNEMONIC, // User wallet mnemonic for onboarding
    address_index: 0 // Address index of the wallet to register on IMX, as defined in BIP-44
}

// Relative configuration object
// Configuration for new IMX project -- 2_create_project.js
const projectConfig = {
    project_name: "PROJECT_NAME", // Name of the project
    company_name: "COMPANY_NAME", // Name of the company in charge of the project
    contact_email: "CONTACT_EMAIL" // Contact email of the project "owner"
}

// Relative configuration object
// Configuration for new IMX collection -- 3_create_collection.js
const collectionConfig = {
    project_id: "PROJECT_ID", // Project ID where the collection will be created
    name: "COLLECTION_NAME", // Name of the collection
    contract_address: "CONTRACT_ADDRESS", // Address of the ERC721 contract on L1
    icon_url: "", // URL or base64 encoded SVG image for the collection icon -- optional
    metadata_api_url: "", // The metadata API base URL (used to feed each token with unique metadata) -- optional
    collection_image_url: "", // URL or base64 encoded SVG image for the collection banner/tile -- optional
}

// Relative configuration object
// Metadata schema for the IMX collection -- 4_add_metadata_schema.js
const collectionMetadataSchema = {
    contract_address: "0x3A1D519f6B9537322a8C4d0Ecccb0C0d0e2af061",
    metadata: collectionMetadata
}

// a collection of all configurations necessary for the onboarding scripts
const Config = ((network) => {
    return {
        ...generalConfig,
        IMXClientConfig: IMXConfig(network).IMXClientConfig,
        project: projectConfig,
        collection: collectionConfig,
        collectionMetadata: collectionMetadataSchema
    }
});

// export the Configuration
module.exports = Config;
