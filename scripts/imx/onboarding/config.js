// Configuration for the onboarding scripts

// General config file for IMX scripts
const IMXConfig = require("../config");

// New user registration configuration -- 1_register_user.js
const registerUserConfig = {
    mnemonic: process.env.IMX_MNEMONIC, // User wallet mnemonic to register
    address_index: 0 // Address index of the wallet to register on IMX, as defined in BIP-44
}

// Configuration for new IMX project -- 2_create_project.js
const projectConfig = {
    mnemonic: process.env.ONBOARDING_MNEMONIC, // User wallet mnemonic to register
    address_index: 0, // Address index of the wallet to register on IMX, as defined in BIP-44
    project_name: "PROJECT_NAME", // Name of the project
    company_name: "COMPANY_NAME", // Name of the company in charge of the project
    contact_email: "CONTACT_EMAIL" // Contact email of the project "owner"
}

// Configuration for new IMX collection -- 3_create_collection.js
const collectionConfig = {
    mnemonic: process.env.ONBOARDING_MNEMONIC,
    project_id: "PROJECT_IDs", // Project ID where the collection will be created
    collection_name: "COLLECTION_NAME", // Name of the collection
    contract_address: "CONTRACT_ADDRESS" // Address of the ERC721 contract on L1
}

// Metadata schema for the IMX collection -- 4_add_metadata_schema.js
const collectionMetadataSchema = {
    mnemonic: process.env.ONBOARDING_MNEMONIC,
    contract_address: "CONTRACT_ADDRESS",
    metadata: [
        {
          "name": "name",
          "type": "text"
        },
        {
          "name": "image_url",
          "type": "text"
        },
        {
          "name": "coordinate",
          "type": "text"
        },
        {
          "name": "tier",
          "type": "enum",
          "filterable": true
        },
        {
          "name": "region",
          "type": "enum",
          "filterable": true
        },
        {
          "name": "elements",
          "type": "discrete",
          "filterable": true
        },
        {
          "name": "hydrogen",
          "type": "discrete",
          "filterable": true
        },
        {
          "name": "carbon",
          "type": "discrete",
          "filterable": true
        },
        {
          "name": "silicon",
          "type": "discrete",
          "filterable": true
        },
        {
          "name": "fuels",
          "type": "discrete",
          "filterable": true
        },
        {
          "name": "crypton",
          "type": "discrete",
          "filterable": true
        },
        {
          "name": "hyperion",
          "type": "discrete",
          "filterable": true
        },
        {
          "name": "solon",
          "type": "discrete",
          "filterable": true
        },
        {
          "name": "landmark",
          "type": "enum",
          "filterable": true
        }
    ]
}

// a collection of all configurations necessary for the onboarding scripts
const Config = ((network) => {
    return {
        IMXClientConfig: IMXConfig(network).IMXClientConfig,
        registerUser: registerUserConfig,
        project: projectConfig,
        collection: collectionConfig,
        collectionMetadata: collectionMetadataSchema
    }
});

// export the Configuration
module.exports = Config;
