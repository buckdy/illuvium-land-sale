// deployed smart contract addresses configuration defines which
// smart contracts require deployment and which are already deployed
// empty address means smart contract requires deployment

// a collection of all known addresses (smart contracts and external), deployment settings
const Config = ((network) => {
	switch(network) {
		// Mainnet Configuration
		case "mainnet":
			return {
				// deployed ILV token instance
				IlluviumERC20: "0x767FE9EDC9E0dF98E07454847909b5E959D7ca0E",
				// deployed sILV token instance
				EscrowedIlluviumERC20: "0x398AeA1c9ceb7dE800284bb399A15e0Efe5A9EC2",
				// deployed LandSaleOracle implementation
				LandSaleOracle: "",
			};
		// Ropsten Configuration
		case "ropsten":
			return {
				// deployed ILV token instance
				IlluviumERC20: "",
				// deployed sILV token instance
				EscrowedIlluviumERC20: "",
				// deployed LandSaleOracle implementation
				LandSaleOracle: "",
			};
		// Rinkeby Configuration
		case "rinkeby":
			return {
				// deployed ILV token instance
				IlluviumERC20: "0xb671194b2e9fB884f65B92a1DBaB875E5F76ec5C",
				// deployed sILV token instance
				EscrowedIlluviumERC20: "0x5051c7f88bCC6c9c4882A3A342a90ace4f90446A",
				// deployed LandSaleOracle implementation
				LandSaleOracle: "",
			};
		// any other network is not supported
		default:
			throw "unknown network " + network;
	}
});

module.exports = Config;
