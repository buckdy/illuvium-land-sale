// get land_sale common functions
const {
	get_land_sale_contract,
	resume_sale,
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

	// resume LandSale
	log.info(await resume_sale(land_sale_contract, A0, config.gas_price, config.gas_limit));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});