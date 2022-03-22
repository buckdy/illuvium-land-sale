// import necessary function from imx module
const {
} = require("../imx/common");

// get LandSale roles for wallet validation
const {
	ROLE_SALE_MANAGER,
	ROLE_DATA_MANAGER,
	ROLE_PAUSE_MANAGER,
} = require("../include/features_roles");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev Instantiate the LandSale contract
 *
 * @param land_sale_address L1 address of LandSale
 * @return LandSale instance
 */
 function get_land_sale_contract(land_sale_address) {
	// Get required ABIs
	const land_sale_abi = artifacts.require("LandSale").abi;

	let land_sale = new web3.eth.Contract(
		land_sale_abi,
		land_sale_address
	);
	return land_sale;
}

async function initialize_sale(land_sale, sender, sale_init_data, gas_price, gas_limit) {
	// check if wallet address has the necessary permissions
	if (!(await land_sale.methods.isSenderInRole(ROLE_SALE_MANAGER).call({ from: sender }))) {
		throw `Address ${sender} does not possess the ROLE_SALE_MANAGER role.`;
	};

	// initialize sale
	log.info(`Initializing sale with account ${sender} parameters:`);
	log.info(sale_init_data);
	return await land_sale.methods.initialize(
		sale_init_data.sale_start,
		sale_init_data.sale_end,
		sale_init_data.halving_time,
		sale_init_data.time_flow_quantum,
		sale_init_data.seq_duration,
		sale_init_data.seq_offset,
		sale_init_data.start_prices
	).send({ from: sender, gasPrice: gas_price, gas: gas_limit });
}

async function setup_merkle_root(land_sale, sender, merkle_root, gas_price, gas_limit) {
	// check if wallet address has the necessary permissions
	if (!(await land_sale.methods.isSenderInRole(ROLE_DATA_MANAGER).call({ from: sender }))) {
		throw `Address ${sender} does not possess the ROLE_DATA_MANAGER role.`;
	};

	// setup merkle root
	log.info(`Setting up land merkle root ${merkle_root} with account ${sender}:`);
	return await land_sale.methods.setInputDataRoot(merkle_root)
		.send({ from: sender, gasPrice: gas_price, gas: gas_limit });
}

async function pause_sale(land_sale, sender, gas_price, gas_limit) {
	// check if wallet address has the necessary permissions
	if (!(await land_sale.methods.isSenderInRole(ROLE_PAUSE_MANAGER).call({ from: sender }))) {
		throw `Address ${sender} does not possess the ROLE_PAUSE_MANAGER role.`;
	};

	// pause LandSale
	log.info(`Pausing LandSale with account ${sender}:`);
	const pause_return_data = await land_sale.methods.pause().send({ from: sender, gasPrice: gas_price, gas: gas_limit });
	const own_time = await land_sale.methods.ownTime().call({ from: sender });
	log.info(`Sale paused at (ownTime): ${own_time.toString()}`);
	return pause_return_data;
}

async function resume_sale(land_sale, sender, gas_price, gas_limit) {
	// check if wallet address has the necessary permissions
	if (!(await land_sale.methods.isSenderInRole(ROLE_PAUSE_MANAGER).call({ from: sender }))) {
		throw `Address ${sender} does not possess the ROLE_PAUSE_MANAGER role.`;
	};

	// resume LandSale
	log.info(`Resume LandSale with account ${sender}:`);
	const resume_return_data = await land_sale.methods.resume().send({ from: sender });
	const own_time = await land_sale.methods.ownTime().call({ from: sender, gasPrice: gas_price, gas: gas_limit });
	log.info(`Sale resumed at (ownTime): ${own_time.toString()}`);
	return resume_return_data;
}

async function get_sale_info(land_sale, sender) {
	// set defaultAccount (sender) for the contract instance
	if (sender) land_sale.options.defaultAccount = sender;
	
	// return LandSale related info
	return {
		sale_start: await land_sale.methods.saleStart().call(),
		sale_end: await land_sale.methods.saleEnd().call(),
		halving_time: await land_sale.methods.halvingTime().call(),
		time_flow_quantum: await land_sale.methods.timeFlowQuantum().call(),
		seq_duration: await land_sale.methods.seqDuration().call(),
		seq_offset: await land_sale.methods.seqOffset().call(),
		start_prices: await land_sale.methods.getStartPrices().call(),
		merkle_root: await land_sale.methods.root().call(),
		own_time: await land_sale.methods.ownTime().call(),
		pause_duration: await land_sale.methods.pauseDuration().call(),
		paused_at: await land_sale.methods.pausedAt().call()
	}
}

async function get_land_price(land_sale, sender, sequence_id, tier_id, gas_price, gas_limit) {
	// return price for land category
	return {
		sequence_id,
		tier_id,
		price_now: await land_sale.methods.tokenPriceNow(sequence_id, tier_id)
			.call({ from: sender, gasPrice: gas_price, gas: gas_limit}),
	}
}

// export public module API
module.exports = {
	get_land_sale_contract,
	initialize_sale,
	setup_merkle_root,
	pause_sale,
	resume_sale,
	get_sale_info,
	get_land_price,
	ROLE_SALE_MANAGER,
	ROLE_DATA_MANAGER,
	ROLE_PAUSE_MANAGER,
}