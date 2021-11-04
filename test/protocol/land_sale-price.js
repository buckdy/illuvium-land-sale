// LandSale: Price Formula Test
// This test verifies the price formula p(t) = p0 * 2 ^ (-t / t0)

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// Zeppelin test helpers
const {
	BN,
	balance,
	constants,
	expectEvent,
	expectRevert,
} = require("@openzeppelin/test-helpers");
const {
	ZERO_ADDRESS,
	ZERO_BYTES32,
	MAX_UINT256,
} = constants;

// Chai test helpers
const {
	assert,
	expect,
} = require("chai");

// block utils
const {
	extract_gas,
} = require("../include/block_utils");

// number utils
const {random_element} = require("../include/number_utils");

// BN utils
const {
	sum_bn,
	print_amt,
	draw_amounts,
	draw_percent,
	print_symbols,
} = require("../include/bn_utils");

// land data utils
const {
	generate_land,
	plot_to_leaf,
	plot_to_metadata,
} = require("./include/land_data_utils");

// deployment routines in use
const {
	DEFAULT_LAND_SALE_PARAMS,
	land_sale_deploy,
} = require("./include/deployment_routines");

// run land sale price formula test
contract("LandSale: Price Formula Test", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// deploy and initialize the sale
	let land_sale;
	beforeEach(async function() {
		({land_sale} = await land_sale_deploy(a0));
	});

	const p0 = DEFAULT_LAND_SALE_PARAMS.start_prices[5];
	const t0 = DEFAULT_LAND_SALE_PARAMS.halving_time;
	const t_max = DEFAULT_LAND_SALE_PARAMS.seq_duration;
	const t_step = 14;
	it("price monotonically decreases over time", async function() {
		let p_old = p0.addn(1);
		for(let t = 0; t < t_max; t++) {
			const p = await land_sale.price(p0, t0, t);
			const percent = p.muln(10_000).div(p0).toNumber() / 100;
			const level = t % t_step === 0 || t === t_max - 1? "info": "debug";
			log[level]("%os\t %o", t, draw_percent(percent));
			expect(p, "p exceeded p_old!̉").to.be.bignumber.that.is.lte(p_old);
			p_old = p;
		}
	});
});
