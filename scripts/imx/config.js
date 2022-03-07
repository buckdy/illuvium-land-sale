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
				landSale: "",
				landERC721: "",
				migration: {
					fromLandERC721: "",
					toLandERC721: "",
					fromBlock: "", // used to restrict snapshot search interval -- reduces computation
					toBlock: "" // latest snapshot block
				},
				IMXClientConfig: {
					publicApiUrl: "https://api.x.immutable.com/v1",
					starkContractAddress: "0x5FDCCA53617f4d2b9134B29090C87D01058e27e9",
					registrationContractAddress: "0xB28816338Bcc7Eb4dC1e0c09341076Db0b97f92F",
					gasLimit: "500000",
					gasPrice: "200000000000",
				},
			};
		// Ropsten Configuration
		case "ropsten":
			return {
				provider: "wss://ropsten.infura.io/ws/v3/" + process.env.INFURA_KEY,
				landSale: "0x2711BFAe351b8cB55792e5708F71ceDEB0cD169f",
				landERC721: "0x3A1D519f6B9537322a8C4d0Ecccb0C0d0e2af061",
				migration: {
					fromLandERC721: "",
					toLandERC721: "",
					fromBlock: "", // used to restrict snapshot search interval -- reduces computation
					toBlock: "" // latest snapshot block
				},
				IMXClientConfig: {
					publicApiUrl: "https://api.ropsten.x.immutable.com/v1",
					starkContractAddress: "0x4527BE8f31E2ebFbEF4fCADDb5a17447B27d2aef",
					registrationContractAddress: "0x6C21EC8DE44AE44D0992ec3e2d9f1aBb6207D864",
					gasLimit: "500000",
					gasPrice: "2000000000",
				},
			};
		// any other network is not supported
		default:
			throw "unknown network " + network;
	}
});

// export the Configuration
module.exports = Config;
