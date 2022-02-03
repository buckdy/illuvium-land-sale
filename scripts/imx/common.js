// Get IMX client and token type
const { ImmutableXClient, MintableERC721TokenType } = require("@imtbl/imx-sdk");

// Get ethersproject utils
const { InfuraProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");


// Get IMX utilities
const { 
    getStarkContractAddress, 
    getPublicApiUrl, 
    getRegistrationContractAddress,
} = require("./utils");

function getWallet(n = 0) {
    const mnemonic = network.name === "ropsten"? process.env.MNEMONIC3: process.env.MNEMONIC1;
    const provider = new InfuraProvider(network.name, process.env.INFURA_KEY);

    return Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${n}`).connect(provider);;
}

function getImmutableXClient() {
    return ImmutableXClient.build({
        publicApiUrl: getPublicApiUrl(),
        signer: getWallet(),
        starkContractAddress: getStarkContractAddress(),
        registrationContractAddress: getRegistrationContractAddress(), // Contract used to register new users
    });
}

module.exports = {
    getImmutableXClient,
    getWallet,
    MintableERC721TokenType,
}