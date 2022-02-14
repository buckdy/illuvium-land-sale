// Configuration for the onboarding scripts

// General config file for IMX scripts
const Config = require("../config");

// New user registration configuration -- 1_register_user.js
const registerUserConfig = {
    mnemonic: "test test test test test test test test test test test junk", // User wallet mnemonic to register
    address_index: 0 // Address index of the wallet to register on IMX, as defined in BIP-44
}

// Configuration for new IMX project -- 2_create_project.js
const projectConfig = {
    mnemonic: "test test test test test test test test test test test junk", // User wallet mnemonic to register
    address_index: 0, // Address index of the wallet to register on IMX, as defined in BIP-44
    project_name: "PROJECT_NAME", // Name of the project
    company_name: "COMPANY_NAME", // Name of the company in charge of the project
    contact_email: "CONTACT_EMAIL" // Contact email of the project "owner"
}

// Configuration for new IMX collection -- 3_create_collection.js
const collectionConfig = {
    project_ind: "PROJECT_ID", // Project ID where the collection will be created
    collection_name: "COLLECTION_NAME", // Name of the collection
    contract_address: "CONTRACT_ADDRESS" // Address of the ERC721 contract on L1
}

// Metadata schema for the IMX collection -- 4_add_metadata_schema.js
const collectionMetadataSchema = {
    contract_address: "CONTRACT_ADDRESS",
    metadata: { // Metadata schema for collection
        name: "ASSET_DISPLAY_NAME", // Name to display in the asset page
        description: "ASSET_DESCRIPTION", // Description for the asset page
        image_url: "ASSET_DISPLAY_IMAGE", // Image to display in the asset page
        image: "ALTERNATIVE_DISPLAY_IMAGE", // Alternative image to display
        animation_url: "ANIMATION_URL", // Animation URL to display in the asset page
        animation_url_mime_type: "MIME_TYPE_ANIMATION_URL", // Animation mime URL to display in the asset page
        youtube_url: "URL_FOR_YOUTUBE_VIDEO" // Youtube video URL to display
    }
}

// a collection of all configurations necessary for the onboarding scripts
const Config = ((network) => {
    return {
        IMXClientConfig: Config(network).IMXClientConfig,
        registerUser: registerUserConfig,
        project: projectConfig,
        collection: collectionConfig,
        collectionMetadata: collectionMetadataSchema
    }
});

// export the Configuration
module.exports = Config;
