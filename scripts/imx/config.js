// deployed smart contract addresses configuration defines which
// smart contracts require deployment and which are already deployed
// empty address means smart contract requires deployment

// a collection of all known addresses (smart contracts and external), deployment settings
const Config = ((network) => {
	switch(network) {
		// Mainnet Configuration
		case "mainnet":
			return {
				IMXClientConfig: {
					publicApiUrl: "https://api.x.immutable.com/v1",
					starkContractAddress: "0x5FDCCA53617f4d2b9134B29090C87D01058e27e9",
					registrationContractAddress: "0xB28816338Bcc7Eb4dC1e0c09341076Db0b97f92F",
					gasLimit: "200000",
					gasPrice: "200000000000",
				},
			};
		// Ropsten Configuration
		case "ropsten":
			return {
				landSale: "0xdd72Ae849b549BbF1935bB679f370933ecAA2B10",
				landERC721: "0xbc1062f59D4B9e5d3630A085432f902595d73760",
				IMXClientConfig: {
					publicApiUrl: "https://api.uat.x.immutable.com/v1",
					starkContractAddress: "0x4527BE8f31E2ebFbEF4fCADDb5a17447B27d2aef",
					registrationContractAddress: "0x68e6217A0989c5e2CBa95142Ada69bA1cE2cdCA9",
					gasLimit: "200000",
					gasPrice: "2000000000",
				},
			};
		// any other network is not supported
		default:
			throw "unknown network " + network;
	}
});

module.exports = Config;
