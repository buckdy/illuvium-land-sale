// LandSale: Price Formula Test
// This test verifies the price formula p(t) = p0 * 2 ^ (-t / t0)

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// Chai test helpers
const {
	assert,
	expect,
} = require("chai");

// BN utils
const {
	sum_bn,
	print_amt,
	draw_amounts,
	draw_percent,
	to_percent,
	print_percent,
	print_symbols,
} = require("../include/bn_utils");

// land sale utils
const {
	price_formula,
} = require("./include/land_sale_utils")

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
	it("local price_formula(t) monotonically decreases over time t", async function() {
		let pt = p0.addn(1);
		for(let t = 0; t < t_max; t++) {
			const p = price_formula(p0, t0, t);
			const percent = to_percent(p, p0);

			const log_level = t % t_step === 0 || t === t_max - 1? "info": "debug";
			log[log_level]("%os\t %o", t, draw_percent(percent));

			expect(p, `p(${t}) exceeded p(${t - 1})!`).to.be.bignumber.that.is.lte(pt);
			pt = p;
		}
	});
	it("price(t) monotonically decreases over time t", async function() {
		let pt = p0.addn(1);
		for(let t = 0; t < t_max; t++) {
			const p = await land_sale.price(p0, t0, t);
			const percent = to_percent(p, p0);

			const log_level = t % t_step === 0 || t === t_max - 1? "info": "debug";
			log[log_level]("%os\t %o", t, draw_percent(percent));

			expect(p, `p(${t}) exceeded p(${t - 1})!̉`).to.be.bignumber.that.is.lte(pt);
			pt = p;
		}
	});
	it("maximum local/remote (JS/Solidity) price(t) difference is at most 0.5%", async function() {
		let max_error = 0;
		for(let t = 0; t < t_max; t++) {
			// local price: JS calculated
			const p_local = price_formula(p0, t0, t);
			// remote price: Solidity calculated
			const p_remote = await land_sale.price(p0, t0, t);

			const percent_local = to_percent(p_local, p0);
			const percent_remote = to_percent(p_remote, p0)

			const delta = p_local.sub(p_remote).abs();
			const percent_error = to_percent(delta, p_local);

			const log_level = t % t_step === 0 || t === t_max - 1? "info": "debug";
			log[log_level](
				"%os\t %o remote; local: %o (%o error)",
				t,
				draw_percent(percent_remote),
				print_percent(percent_local),
				print_percent(percent_error)
			);

			expect(percent_error, `error too big for t = ${t}`).to.be.at.most(0.5);
			max_error = Math.max(max_error, percent_error);
		}
		log.info("maximum error: %o", print_percent(max_error));
	});
});
