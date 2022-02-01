// Get LandSale ABI
const landSaleAbi = require("../../artifacts/contracts/protocol/LandSale.sol/LandSale.json").abi;

function getStarkContractAddress(network) {
    switch (network) {
        case "ropsten":
            return "0x4527be8f31e2ebfbef4fcaddb5a17447b27d2aef";
        case "mainnet":
            return "0x5FDCCA53617f4d2b9134B29090C87D01058e27e9";
    }
    throw Error("Invalid network selected");
}

function getPublicApiUrl(network) {
    switch (network) {
        case "ropsten":
            return "https://api.ropsten.x.immutable.com/v1";
        case "mainnet":
            return "https://api.x.immutable.com/v1";
    }
    throw Error("Invalid network selected");
}

function getRegistrationContractAddress(network) {
    switch (network) {
        case "ropsten":
            return "0x68e6217A0989c5e2CBa95142Ada69bA1cE2cdCA9";
        case "mainnet":
            return "0xB28816338Bcc7Eb4dC1e0c09341076Db0b97f92F";
    }
    throw Error("Invalid network selected");
}

function getLandSaleContractAddress(network) {
    switch (network) {
        case "ropsten":
            return "0x18d96a26889c1E4913Cd5F5Fd210a4b93C99F8f2";
        case "mainnet":
            return "";
    }
    throw Error("Invalid network selected");
}

function getLandERC721ProxyAddress(network) {
    switch (network) {
        case "ropsten":
            return "0xe0994c81afbDdC01acd3805c589A8c284f021039";
        case "mainnet":
            return "";
    }
    throw Error("Invalid network selected");
}

module.exports = {
    getStarkContractAddress,
    getPublicApiUrl,
    getRegistrationContractAddress,
    landSaleAbi,
    getLandSaleContractAddress,
    getLandERC721ProxyAddress
}