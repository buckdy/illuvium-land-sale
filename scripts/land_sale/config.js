// deployed smart contract addresses configuration defines which
// smart contracts require deployment and which are already deployed
// empty address means smart contract requires deployment

// parameters for the LandSale `initialize` function
// to keep old values, set the parameter to type(uint32).max (except `start_prices`)
// to keep the former values of `start_prices` set an array with unitary length and value equal to type(uint96).max
// timestamps are in seconds (since EPOCH)
const sale_init_data = {
	sale_start: "1647866007", // sale start timestamp - usually a good idea to initialize to `ownTime()`
	sale_end: "1648128807", // sale end timestamp
	halving_time: "2058", // the time required for the current sequence item to halves the price
	time_flow_quantum: "60", // the minimum interval of time "perceived" by the sale, sale time is round down given this value
	seq_duration: "7200", // the duration of each sequence
	seq_offset: "3600", // the offset of which to start the next sequence's sale 
	start_prices: [
		"0",
		"1000000000000000000",
		"2000000000000000000",
		"5000000000000000000",
		"20000000000000000000",
		"50000000000000000000"
	] // start prices for each sequence, the number of prices should be greater than the number of sequences
}

// a collection of all known addresses (smart contracts and external), deployment settings
const Config = ((network) => {
	switch(network) {
		// Mainnet Configuration
		case "mainnet":
			return {
				provider: "wss://mainnet.infura.io/ws/v3/" + process.env.INFURA_KEY,
				land_sale_addr: "LAND_SALE_ADDR_ON_MAINNET",
				sale_init_data,
				gas_limit: "500000",
				gas_price: "2000000000",
			};
		// Ropsten Configuration
		case "ropsten":
			return {
				provider: "wss://ropsten.infura.io/ws/v3/" + process.env.INFURA_KEY,
				land_sale_addr: "0x8798357E53bDFcE1A21212bAa1Dc938eB84DfC19",
				sale_init_data,
				gas_limit: "500000",
				gas_price: "50000000000",
			};
		case "rinkeby":
			return {
				provider: "wss://rinkeby.infura.io/ws/v3/" + process.env.INFURA_KEY,
				land_sale_addr: "0xDe4FcA44CA441b48C539bB21fC69122fcEdceFAe",
				sale_init_data,
				gas_limit: "500000",
				gas_price: "2000000000",
			}
		// any other network is not supported
		default:
			throw "unknown network " + network;
	}
});

// export the Configuration
module.exports = Config;
