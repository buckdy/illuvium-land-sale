// Get IMX client and token type
const { ImmutableXClient, MintableERC721TokenType } = require("@imtbl/imx-sdk");

// Get LandSale ABI
const landSaleAbi = require("../../artifacts/contracts/protocol/LandSale.sol/LandSale.json").abi;

// Get pack from land_lib JS implementations
const {
    pack
} = require("../../test/land_gen/include/land_lib");

// Get ethersproject utils
const { InfuraProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");

function getWallet(network, n = 0) {
    const mnemonic = network === "ropsten"? process.env.MNEMONIC3: process.env.MNEMONIC1;
    const provider = new InfuraProvider(network, process.env.INFURA_KEY);

    return Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${n}`).connect(provider);;
}

function getImmutableXClient(network, IMXClientConfig) {
    return ImmutableXClient.build({
        ...IMXClientConfig,
        signer: getWallet(network)
    });
}

module.exports = {
    getImmutableXClient,
    getWallet,
    MintableERC721TokenType,
    landSaleAbi,
    pack,
}