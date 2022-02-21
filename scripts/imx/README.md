# Immutable X (IMX) scripts usage

## Onboarding
Those scripts are used to setup an evironment on IMX. In order to use IMX functionalities, an user needs to be registered, a project must be created and a collection. The latter is an abstraction of an ERC721 contract on Layer 1 Ethereum (L1) and it's needed for the withdrawal operation from Layer 2 IMX (L2).

### Scripts:
- `1_register_user.js`: Used to register a new user on IMX (necessary for the next steps and to use ImmutableXClient functionalities)
- `2_create_project.js`: Used to create a new project on IMX (a project is a set of collections that's owner by the project owner -- who created the project)
- `3_create_collection.js`: Used to create a new collection (collections are abstractions of the L1 ERC721 contract -- It contains the tokens)
- `4_add_metadata_schema.js`: Used to add or update the collection metadata (name, description, images, animation and youtube videos' urls)

### Configuration:
In order to take advantage of the scripts, all the configurations, for each script, should be set in the `./onboarding/config.js` file. Expect for the `4_add_metadata_schema.js` where `metadata` parameters can be ommited (commented in `config.js`).

## Collection operations scripts
Those scripts in the current folder are used to perform operations on an already setup environment, using the `onboarding` scripts. Some of these operations are minting ERC721 on L2, burn ERC721 on L2, withdraw ERC721 from L2 to L1, rollback minting to a snapshot on L2 and verify token metadata integrity on L2.