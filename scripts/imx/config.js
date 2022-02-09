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
				provider: "wss://ropsten.infura.io/ws/v3/" + process.env.INFURA_KEY,
				landSale: "0x11f249C4aC7500416B3ED187Cf93e28eb9110eB7",
				landERC721: "0x4AfA742Ab58256E1c42e0184F761EF568754303f",
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
