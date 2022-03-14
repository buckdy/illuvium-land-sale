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
				land_sale: "",
				land_erc721: "",
				migration: {
					from_land_erc721: "",
					to_land_erc721: "",
					from_block: "", // used to restrict snapshot search interval -- reduces computation
					to_block: "" // latest snapshot block
				},
				imx_client_config: {
					public_api_url: "https://api.x.immutable.com/v1",
					stark_contract_address: "0x5FDCCA53617f4d2b9134B29090C87D01058e27e9",
					registration_contract_address: "0xB28816338Bcc7Eb4dC1e0c09341076Db0b97f92F",
					gas_limit: "500000",
					gas_price: "200000000000",
				},
			};
		// Ropsten Configuration
		case "ropsten":
			return {
				provider: "wss://ropsten.infura.io/ws/v3/" + process.env.INFURA_KEY,
				land_sale: "0x2711BFAe351b8cB55792e5708F71ceDEB0cD169f",
				land_erc721: "0x3A1D519f6B9537322a8C4d0Ecccb0C0d0e2af061",
				migration: {
					from_land_erc721: "",
					to_land_erc721: "",
					from_block: "", // used to restrict snapshot search interval -- reduces computation
					to_block: "" // latest snapshot block
				},
				imx_client_config: {
					public_api_url: "https://api.ropsten.x.immutable.com/v1",
					stark_contract_address: "0x4527BE8f31E2ebFbEF4fCADDb5a17447B27d2aef",
					registration_contract_address: "0x6C21EC8DE44AE44D0992ec3e2d9f1aBb6207D864",
					gas_limit: "500000",
					gas_price: "2000000000",
				},
			};
		// any other network is not supported
		default:
			throw "unknown network " + network;
	}
});

// export the Configuration
module.exports = Config;
