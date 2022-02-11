# Illuvium Land Sale #
Land Sale features a Land NFT (token), and a Sale (helper) smart contracts, supporting Illuvium Zero.

The project is built using
* [Hardhat](https://hardhat.org/), a popular Ethereum development environment,
* [Web3.js](https://web3js.readthedocs.io/), a collection of libraries that allows interacting with
local or remote Ethereum node using HTTP, IPC or WebSocket, and
* [Truffle](https://www.trufflesuite.com/truffle), a popular development framework for Ethereum.

Smart contracts deployment is configured to use [Infura](https://infura.io/)
and [HD Wallet](https://www.npmjs.com/package/@truffle/hdwallet-provider)

## Repository Description ##
What's inside?

* [Illuvium Land Sale Protocol On-chain Architecture Version 1.0_01/23/22
](docs/Illuvium%20Land%20Sale%20On-chain%20Architecture.pdf), containing
   * Protocol Overview
   * Access Control Technical Design, including
      * Upgradeable Access Control modification
   * Land Plot NFT (ERC721 Token) Technical Design, including
      * functional/non-functional Requirements
      * data structures
      * internal land structure (land gen) description
   * Land Sale (Helper) Technical Design, including
      * functional/non-functional Requirements
      * data structures
      * input data generation and validation process description
* Access Control
   * Smart Contract(s):
      * [AccessControl](contracts/utils/AccessControl.sol)
        – replaces OpenZeppelin AccessControl
      * [UpgradeableAccessControl](contracts/utils/UpgradeableAccessControl.sol)
        – replaces OpenZeppelin AccessControlUpgradeable
   * Test(s):
      * [acl_core.js](test/util/acl_core.js)
      * [acl_upgradeable.js](test/util/acl_upgradeable.js)
* Land Plot NFT (ERC721 Token)
   * Smart Contract(s):
      * Token Implementation
         * [LandERC721](contracts/token/LandERC721.sol)
         * [RoyalERC721](contracts/token/RoyalERC721.sol)
         * [UpgradeableERC721](contracts/token/UpgradeableERC721.sol)
      * Auxiliary Modules
         * [LandDescriptor](contracts/token/LandDescriptorImpl.sol)
      * Auxiliary Libraries
         * [LandLib](contracts/lib/LandLib.sol) – defines token data structures,
           internal land structure generation algorithm
         * [LandBlobLib](contracts/lib/LandBlobLib.sol)
           – string parsing lib to help with IMX `mintFor` `mintingBlob` param parsing
         * [NFTSvg.sol](contracts/lib/NFTSvg.sol) – land plot SVG generator
      * Interfaces
         * [ImmutableMintableERC721](contracts/interfaces/ImmutableSpec.sol)
         * [LandERC721Metadata](contracts/interfaces/LandERC721Spec.sol)
         * [LandDescriptor](contracts/interfaces/LandERC721Spec.sol)
         * [EIP2981](contracts/interfaces/EIP2981Spec.sol)
         * [MintableERC721](contracts/interfaces/ERC721SpecExt.sol)
         * [BurnableERC721](contracts/interfaces/ERC721SpecExt.sol)
         * [ERC721](contracts/interfaces/ERC721Spec.sol)
         * [ERC165](contracts/interfaces/ERC165Spec.sol)
   * Test(s):
      * [erc721_zeppelin.js](test/land_nft/erc721_zeppelin.js) – ERC-721 compliance tests ported from
        [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts/)
        (see [ERC721.behavior.js](test/land_nft/include/zeppelin/ERC721.behavior.js), and
        [ERC721URIStorage.behaviour.js](test/land_nft/include/zeppelin/ERC721URIStorage.behaviour.js))
      * [eip2981_royalties.js](test/land_nft/eip2981_royalties.js)
      * [erc165_support.js](test/land_nft/erc165_support.js)
      * [metadata.js](test/land_nft/metadata.js)
      * [mint_for.js](test/land_nft/mint_for.js) – IMX mintFor tests
      * [rescue_erc20.js](test/land_nft/rescue_erc20.js)
      * [acl.js](test/land_nft/acl.js) – access control related tests
      * [land_lib_test.js](test/land_gen/land_lib_test.js) – land lib tests (land_lib.js/LandLib.sol match)
      * [isomorphic_grid.js](test/land_gen/isomorphic_grid.js) – land gen tests
      * [svg_gen.js](test/svg_gen/svg_gen.js) – SVG generator tests
* Land Sale
   * Smart Contract(s):
      * [LandSale.sol](contracts/protocol/LandSale.sol)
   * Test(s):
      * [land_sale.js](test/protocol/land_sale.js) – exhaustive set of test cases, including corner cases
      * [land_sale_acl.js](test/protocol/land_sale_acl.js) – access control related tests
      * [land_sale_price.js](test/protocol/land_sale_price.js) – price formula, price calculation tests
      * [land_sale-sim.js](test/protocol/land_sale-sim.js) – sale simulation buying big number of land plots
      * [land_sale-proto.js](test/protocol/land_sale-proto.js) – simple success-scenario test
      * [land_sale-gas_usage.js](test/protocol/land_sale-gas_usage.js)

## Installation ##

Following steps were tested to work in macOS Catalina

1. Clone the repository  
   ```git clone git@github.com:IlluviumGame/land-sale.git```
2. Navigate into the cloned repository  
   ```cd land-sale```
3. Install [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm) – latest  
   ```brew install nvm```
4. Install [Node package manager (npm)](https://www.npmjs.com/) and [Node.js](https://nodejs.org/) – version 16.4.0  
   ```nvm install v16.4.0```
5. Activate node version installed  
   ```nvm use v16.4.0```
6. Install project dependencies  
   ```npm install```

### Troubleshooting ###
* After executing ```nvm use v16.4.0``` I get  
   ```
   nvm is not compatible with the npm config "prefix" option: currently set to "/usr/local/Cellar/nvm/0.37.2/versions/node/v16.4.0"
   Run `npm config delete prefix` or `nvm use --delete-prefix v16.4.0` to unset it.
   ```
   Fix:  
   ```
   nvm use --delete-prefix v16.4.0
   npm config delete prefix
   npm config set prefix "/usr/local/Cellar/nvm/0.37.2/versions/node/v16.4.0"
   ```
* After executing ```npm install``` I get
   ```
   npm ERR! code 127
   npm ERR! path ./game-contracts/node_modules/utf-8-validate
   npm ERR! command failed
   npm ERR! command sh -c node-gyp-build
   npm ERR! sh: node-gyp-build: command not found
   
   npm ERR! A complete log of this run can be found in:
   npm ERR!     ~/.npm/_logs/2021-08-30T07_10_23_362Z-debug.log
   ```
   Fix:  
   ```
   npm install -g node-gyp
   npm install -g node-gyp-build
   ```

## Configuration ##
1. Create or import 12-word mnemonics for
   1. Mainnet
   2. Ropsten
   3. Rinkeby
   4. Kovan

   You can use metamask to create mnemonics: https://metamask.io/

   Note: you can use same mnemonic for test networks (ropsten, rinkeby and kovan).
   Always use a separate one for mainnet, keep it secure.

   Note: you can add more configurations to connect to the networks not listed above.
   Check and add configurations required into the [hardhat.config.js](hardhat.config.js).

2. Create an infura access key at https://infura.io/

3. Create etherscan API key at https://etherscan.io/

4. Export mnemonics, infura access key, and etherscan API key as system environment variables
   (they should be available for hardhat):

   | Name         | Value             |
   |--------------|-------------------|
   | MNEMONIC1    | Mainnet mnemonic  |
   | MNEMONIC3    | Ropsten mnemonic  |
   | MNEMONIC4    | Rinkeby mnemonic  |
   | MNEMONIC42   | Kovan mnemonic    |
   | INFURA_KEY   | Infura access key |
   | ETHERSCAN_KEY| Etherscan API key |

Note:  
Read [How do I set an environment variable?](https://www.schrodinger.com/kb/1842) article for more info on how to
set up environment variables in Linux, Windows and macOS.

### Example Script: macOS Catalina ###
```
export MNEMONIC1="witch collapse practice feed shame open despair creek road again ice least"
export MNEMONIC3="someone relief rubber remove donkey jazz segment nose spray century put beach"
export MNEMONIC4="someone relief rubber remove donkey jazz segment nose spray century put beach"
export MNEMONIC42="someone relief rubber remove donkey jazz segment nose spray century put beach"
export INFURA_KEY="000ba27dfb1b3663aadfc74c3ab092ae"
export ETHERSCAN_KEY="9GEEN6VPKUR7O6ZFBJEKCWSK49YGMPUBBG"
```

## Alternative Configuration: Using Private Keys instead of Mnemonics ##
[hardhat.config-p_key.js](hardhat.config-p_key.js) contains an alternative Hardhat configuration using private keys
instead of mnemonics

1. Create or import private keys of the accounts for
   1. Mainnet
   2. Ropsten
   3. Rinkeby
   4. Kovan

   You can use metamask to export private keys: https://metamask.io/

   Note: you can use the same private key for test networks (ropsten, rinkeby and kovan).
   Always use a separate one for mainnet, keep it secure.

2. Create an infura access key at https://infura.io/

3. Create etherscan API key at https://etherscan.io/

4. Export private keys, infura access key, and etherscan API key as system environment variables
   (they should be available for hardhat):

   | Name         | Value               |
   |--------------|---------------------|
   | P_KEY1       | Mainnet private key |
   | P_KEY3       | Ropsten private key |
   | P_KEY4       | Rinkeby private key |
   | P_KEY42      | Kovan private key   |
   | INFURA_KEY   | Infura access key   |
   | ETHERSCAN_KEY| Etherscan API key   |

Notes:
* private keys should start with ```0x```
* use ```--config hardhat.config-p_key.js``` command line option to run hardhat using an alternative configuration

### Example Script: macOS Catalina ###
```
export P_KEY1="0x5ed21858f273023c7fc0683a1e853ec38636553203e531a79d677cb39b3d85ad"
export P_KEY3="0xfb84b845b8ea672939f5f6c9a43b2ae53b3ee5eb8480a4bfc5ceeefa459bf20c"
export P_KEY4="0xfb84b845b8ea672939f5f6c9a43b2ae53b3ee5eb8480a4bfc5ceeefa459bf20c"
export P_KEY42="0xfb84b845b8ea672939f5f6c9a43b2ae53b3ee5eb8480a4bfc5ceeefa459bf20c"
export INFURA_KEY="000ba27dfb1b3663aadfc74c3ab092ae"
export ETHERSCAN_KEY="9GEEN6VPKUR7O6ZFBJEKCWSK49YGMPUBBG"
```

## Compilation ##
Execute ```npx hardhat compile``` command to compile smart contracts.

Compilation settings are defined in [hardhat.config.js](./hardhat.config.js) ```solidity``` section.

Note: Solidity files *.sol use strict compiler version, you need to change all the headers when upgrading the
compiler to another version 

## Testing ##
Smart contract tests are built with Truffle – in JavaScript (ES6) and [web3.js](https://web3js.readthedocs.io/)

The tests are located in [test](./test) folder. 
They can be run with built-in [Hardhat Network](https://hardhat.org/hardhat-network/).

Run ```npx hardhat test``` to run all the tests or ```.npx hardhat test <test_file>``` to run individual test file.
Example: ```npx hardhat test ./test/erc721/erc721_zeppelin.js```

### Troubleshooting ###
* After running any test (executing ```npx hardhat test ./test/erc721/erc721_zeppelin.js``` for example) I get
   ```
   An unexpected error occurred:
   
   Error: This method only supports Buffer but input was: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
   Fix: downgrade @nomiclabs/hardhat-truffle5 plugin to 2.0.0 (see https://issueexplorer.com/issue/nomiclabs/hardhat/1885)
   ```
   npm install -D @nomiclabs/hardhat-truffle5@2.0.0
   ```

## Deployment ##
Deployments are implemented via [hardhat-deploy plugin](https://github.com/wighawag/hardhat-deploy) by Ronan Sandford.

Deployment scripts perform smart contracts deployment itself and their setup configuration.
Executing a script may require several transactions to complete, which may fail. To help troubleshoot
partially finished deployment, the scripts are designed to be rerunnable and execute only the transactions
which were not executed in previous run(s).

Deployment scripts are located under [deploy](./deploy) folder.
Deployment execution state is saved under [deployments](./deployments) folder.

To run fresh deployment (rinkeby):

1. Delete [deployments/rinkeby](./deployments/rinkeby) folder contents.

2. Run the deployment of interest with the ```npx hardhat deploy``` command
   ```
   npx hardhat deploy --network rinkeby --tags v1_deploy
   ```
   where ```v1_deploy``` specifies the deployment script tag to run,
   and ```--network rinkeby``` specifies the network to run script for
   (see [hardhat.config.js](./hardhat.config.js) for network definitions).

3. Verify source code on Etherscan with the ```npx hardhat etherscan-verify``` command
   ```
   npx hardhat etherscan-verify --network rinkeby
   ```

4. Enable the roles (see Access Control) required by the protocol
   ```
   npx hardhat deploy --network rinkeby --tags v1_roles
   ```
   Note: this step can be done via Etherscan UI manually

5. Setup the sale data Merkle root (see ```LandSale.setInputDataRoot()```) via Etherscan UI manually

6. Initialize the sale (see ```LandSale.initialize()```) via Etherscan UI manually

7. Enable the features (see Access Control) required by the protocol
   ```
   npx hardhat deploy --network rinkeby --tags v1_features
   ```
   Note: this step can be done via Etherscan UI manually

To rerun the deployment script and continue partially completed script skip the first step
(do not cleanup the [deployments](./deployments) folder).

## Contributing
// TODO:

(c) 2020–2022 Illuvium [
[WWW](https://illuvium.io/)
| [Medium](https://illuvium.medium.com/)
| [Twitter](https://twitter.com/illuviumio)
| [Discord](https://discord.gg/T5pMyU8QtH)
]
