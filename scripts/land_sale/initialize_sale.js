// get zora common functions
const {
	get_land_sale_contract,
	ROLE_SALE_MANAGER,
} = require("./common");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// config file contains required token addresses for zora
	const Config = require("./config");

	// get configuration for network
	const config = Config(network.name);

	// get account to sign transactions
	const [A0] = await web3.eth.getAccounts();

	// instantiate LandSale contract
	const land_sale_contract = get_land_sale_contract(config.land_sale_addr);

	// check if wallet address has the necessary permissions
	if (!(await land_sale_contract.methods.isSenderInRole(ROLE_SALE_MANAGER).call({ from: A0 }))) {
		throw "Specified wallet address don't possess the ROLE_SALE_MANAGER role.";
	};

	// initialize sale
	log.info(`Initializing sale with account ${A0} parameters:`);
	log.info(config.sale_init_data);
	console.log(await land_sale_contract.methods.initialize(
		config.sale_init_data.sale_start,
		config.sale_init_data.sale_end,
		config.sale_init_data.halving_time,
		config.sale_init_data.time_flow_quantum,
		config.sale_init_data.seq_duration,
		config.sale_init_data.seq_offset,
		config.sale_init_data.start_prices
	).send({ from: A0, gasPrice: config.gas_price, gas: config.gas_limit }));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});