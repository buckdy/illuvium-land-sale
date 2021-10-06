// deployed smart contract addresses configuration defines which
// smart contracts require deployment and which are already deployed
// empty address means smart contract requires deployment

// a collection of all known addresses (smart contracts and external), deployment settings
const Config = ((network) => {
	switch(network) {
		// Mainnet Configuration
		case "mainnet":
			return {
				LandERC721: "",
				LandSale: "",
			};
		// Ropsten Configuration
		case "ropsten":
			return {
				LandERC721: "",
				LandSale: "",
			};
		// Rinkeby Configuration
		case "rinkeby":
			return {
				LandERC721: "0x6A2196A039ab2A69cab10068b61c968d3Cec7311",
				LandSale: "0xF304C82AB4fF976585c41Fc7f9dE9c4dc63c4823",
			};
		// any other network is not supported
		default:
			throw "unknown network " + network;
	}
});

module.exports = Config;
