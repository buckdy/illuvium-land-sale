// Get IMX client and token type
const { ImmutableXClient, MintableERC721TokenType, ERC721TokenType } = require("@imtbl/imx-sdk");

// Get required ABIs
const landSaleAbi = require("../../artifacts/contracts/protocol/LandSale.sol/LandSale.json").abi;
const landERC721Abi = require("../../artifacts/contracts/token/LandERC721.sol/LandERC721.json").abi;

// Get pack from land_lib JS implementations
const {
    pack
} = require("../../test/land_gen/include/land_lib");

// Get ethersproject utils
const { InfuraProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");

// Get configuration
const Config = require("./config");


/**
 * @dev Configure Infura provider based on the network
 * 
 * @param network the network name
 * @return instance of InfuraProvider
 */
function getProvider(network) {
    return new InfuraProvider(network, process.env.INFURA_KEY);
}

/**
 * @dev Get Websocket RPC provider given configuration
 * 
 * @param network the network name
 * @return instance of web3 WebsocketProvider
 */
function getProviderWebsocket(network) {
    const config = Config(network);
    return new web3.providers.WebsocketProvider(config.provider);
}

/**
 * @dev Gets wallet from provided mnemonic provided for the network
 * 
 * @param network name of the network
 * @param n 
 */
function getWallet(network, n = 0) {
    const mnemonic = network === "ropsten"? process.env.MNEMONIC3: process.env.MNEMONIC1;
    const provider = getProvider(network);

    return Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${n}`).connect(provider);;
}

/**
 * @dev Gets an instance of the IMX client given configuration for the network
 * 
 * @param network name of the network
 * @param IMXClientConfig configuration object for ImmutableXClient
 * @return Instance of IMX client
 */
function getImmutableXClient(network, IMXClientConfig) {
    return ImmutableXClient.build({
        ...IMXClientConfig,
        signer: getWallet(network)
    });
}

/**
 * @dev Instantiate the LandSale contract
 * 
 * @param address the address of the contract in the respective network
 * @return LandSale instance
 */
 function getLandSaleContract(network, address) {
    let landSale = new web3.eth.Contract(
                landSaleAbi,
                address
            );
    landSale.setProvider(getProviderWebsocket(network));
    return landSale;
}

/**
 * @dev Instantiate the LandERC721 contract
 * 
 * @param address the address of the contract in the respective network
 * @return LandERC721 instance
 */
function getLandERC721Contract(network, address) {
    const landERC721 =  new web3.eth.Contract(
        landERC721Abi,
        address
    );
    landERC721.setProvider(getProviderWebsocket(network));
    return landERC721;
}

module.exports = {
    getImmutableXClient,
    getWallet,
    MintableERC721TokenType,
    ERC721TokenType,
    landSaleAbi,
    landERC721Abi,
    getLandSaleContract,
    getLandERC721Contract,
    pack,
}