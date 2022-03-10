# Immutable X (IMX) scripts usage

## Onboarding
[These scripts](./) are used to set up an environment on [IMX](https://www.immutable.com/).
In order to use IMX L2 capabilities,
- a user needs to be registered,
- a project must be created,
- and an NFT collection must be added.

The latter is an abstraction of an ERC721 contract on Layer 1 Ethereum (L1);
it is required to enable the withdrawal operation from Layer 2 (IMX) into Layer 1 (Ethereum).

## Scripts:
- [1_register_user.js](./onboarding/1_register_user.js) used to register new user on IMX
   (necessary for the next steps and to use ImmutableXClient functionalities)
- [2_create_project.js](./onboarding/2_create_project.js) used to create new project on IMX
   (a project is a set of collections that's owner by the project owner – who created the project)
- [3_create_collection.js](./onboarding/3_create_collection.js) used to create a new collection
   (collections are abstractions of the L1 ERC721 contract – It contains the tokens)
- [4_add_metadata_schema.js](./onboarding/4_add_metadata_schema.js) used to add or update the collection metadata
   (name, description, images, animation and youtube videos' URLs)

## Configuration:
In order to take advantage of the scripts, all the configurations, for each script, should be set in the
[./onboarding/config.js](./onboarding/config.js) file.
Except for the [4_add_metadata_schema.js](./onboarding/4_add_metadata_schema.js) where `metadata` parameters
can be omitted (commented in [config.js](./onboarding/config.js)).

## Collection operations scripts
Those scripts in the current folder are used to perform operations on an already setup environment,
using the [onboarding](./onboarding) scripts.
Some of these operations are
- minting ERC721 on L2,
- burn ERC721 on L2,
- withdraw ERC721 from L2 to L1,
- rollback minting to a snapshot on L2,
- and verify token metadata integrity on L2.