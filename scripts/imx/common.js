// Get IMX client and token type
const { ImmutableXClient, MintableERC721TokenType } = require("@imtbl/imx-sdk");

// Get ethersproject utils
const { InfuraProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");
const provider = new InfuraProvider(process.env.NETWORK_NAME, process.env.INFURA_KEY);

// Get IMX utilities
const { 
    getStarkContractAddress, 
    getPublicApiUrl, 
    getRegistrationContractAddress,
} = require("./utils");

function getWallet(privateKey, provider) {
    return new Wallet(privateKey).connect(provider);
}

function getImmutableXClient(network, userPrivateKey) {
    return ImmutableXClient.build({
        publicApiUrl: getPublicApiUrl(network),
        signer: getWallet(userPrivateKey, provider),
        starkContractAddress: getStarkContractAddress(network),
        registrationContractAddress: getRegistrationContractAddress(network), // Contract used to register new users
    });
}

module.exports = {
    getImmutableXClient,
    getWallet,
    provider,
    MintableERC721TokenType,
}