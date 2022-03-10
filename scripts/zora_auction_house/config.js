// deployed smart contract addresses configuration defines which
// smart contracts require deployment and which are already deployed
// empty address means smart contract requires deployment

// a collection of all known addresses (smart contracts and external), deployment settings
const Config = ((network) => {
    switch(network) {
        // Mainnet Configuration
        case "mainnet":
            return {
                provider: "wss://mainnet.infura.io/ws/v3/" + process.env.INFURA_KEY,
                auction_house: "0xE468cE99444174Bd3bBBEd09209577d25D1ad673", // auction house address
                create_auction: {
                    token_id: "TOKEN_ID", // id of the token to be auctioned
                    duration: "DURATION", // auction duration in seconds
                    reserve_price: "RESERVE_PRICE", // minimum bid price
                    curator: undefined, // curator to wait for approval and pay fees -- leave undefined for no curator
                    curator_fee_percentage: undefined, // curator fee -- leave undefined for ZERO curator fee
                    auction_currency: undefined, //  currency to accept as payment for the auction -- leave undefined for ETH
                    token_address: undefined // address of the ERC721 token contract to be auctioned -- leave undefined for Zora's
                },  
            };
        // Rinkeby Configuration
        case "rinkeby":
            return {
                provider: "wss://ropsten.infura.io/ws/v3/" + process.env.INFURA_KEY,
                auction_house: "0xE7dd1252f50B3d845590Da0c5eADd985049a03ce", // auction house address
                overrides: {
                    gasPrice: 2000000000,
                    gasLimit: 500000
                },
                create_auction: {
                    token_id: "78", // id of the token to be auctioned
                    duration: "86400", // auction duration in seconds
                    reserve_price: "10000000000000000000", // minimum bid price
                    curator: undefined, // curator to wait for approval and pay fees -- leave undefined for no curator
                    curator_fee_percentage: undefined, // curator fee -- leave undefined for ZERO curator fee
                    auction_currency: "0x5051c7f88bCC6c9c4882A3A342a90ace4f90446A", //  currency to accept as payment for the auction -- leave undefined for ETH
                    token_address: "0x826d2284566D5533E26Cdc3F8568117CB75b09BF" // address of the ERC721 token contract to be auctioned -- leave undefined for Zora's
                },   
            };
        // any other network is not supported
        default:
            throw "unknown network " + network;
    }
});

// export the Configuration
module.exports = Config;
