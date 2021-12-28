// LandLib.sol vs land_lib.js JS Implementation Tests
// Verifies LandLib.sol: JS implementation versus native LandLib.sol

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

// Chai test helpers
const {
	assert,
	expect,
} = require("chai");

// block utils
const {
	extract_gas,
	extract_gas_cost,
} = require("../include/block_utils");

// number utils
const {
	random_int,
	random_element,
} = require("../include/number_utils");

// BN utils
const {
	random_bn256,
	sum_bn,
	print_amt,
	print_symbols,
} = require("../include/bn_utils");

// land data utils
const {
	element_sites,
	fuel_sites,
	generate_land,
	plot_to_metadata,
} = require("../protocol/include/land_data_utils");

// isomorphic grid utils
const {
	print_sites,
	is_corner,
} = require("./include/isomorphic_grid_utils");

// LandLib.sol: JS implementation
const {
	next_rnd_uint,
	get_coords,
	get_resource_sites,
} = require("./include/land_lib");

// log utils
const {
	write_info,
} = require("../protocol/include/log_utils");

// deployment routines in use
const {
	land_lib_deploy,
} = require("./include/deployment_routines");

// run LandLib.sol vs land_lib.js JS Implementation Tests
contract("LandLib.sol vs land_lib.js: JS Implementation tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// deploy the LandLib
	let land_lib;
	before(async function() {
		land_lib = await land_lib_deploy(a0);
	});

	async function next_rnd_uint_sol(seed, offset, options) {
		const result = await land_lib.nextRndUint16(seed, offset, options);
		return {seed: result.nextSeed, rndVal: result.rndVal.toNumber()};
	}

	async function get_coords_sol(seed, length, size) {
		const result = await land_lib.getCoords(seed, length, size);
		return {seed: result.nextSeed, coords: result.coords.map(v => v.toNumber())};
	}

	async function get_resource_sites_sol(seed, element_sites, fuel_sites, grid_size, site_size = 2) {
		return (await land_lib.getResourceSites(seed, element_sites, fuel_sites, grid_size, site_size))
			.map(site => Object.assign({}, {
				typeId: parseInt(site.typeId),
				x: parseInt(site.x),
				y: parseInt(site.y),
			}));
	}

	it("nextRndUint", async function() {
		for(let i = 0; i < 100; i++) {
			const seed = random_bn256();
			const offset = random_int(0, 10);
			const options = random_int(2, 10_000);
			const rnd_int_js = next_rnd_uint(seed, offset, options);
			const rnd_int_sol = await next_rnd_uint_sol(seed, offset, options);
			log.debug("input: %o", {seed: seed.toString(), offset, options});
			log.debug("rnd_int_js: %o", {seed: rnd_int_js.seed.toString(16), rndVal: rnd_int_js.rndVal});
			log.debug("rnd_int_sol: %o", {seed: rnd_int_sol.seed.toString(16), rndVal: rnd_int_sol.rndVal});
			expect(rnd_int_js).to.deep.equal(rnd_int_sol);
		}
	});

	it("getCoords", async function() {
		for(let i = 0; i < 100; i++) {
			const seed = random_bn256();
			const length = random_int(3, 30);
			const size = random_int(1_000, 20_000);
			const coords_js = get_coords(seed, length, size);
			const coords_sol = await get_coords_sol(seed, length, size);
			log.debug("input: %o", {seed: seed.toString(), length, size});
			log.debug("coords_js: %o", {seed: coords_js.seed.toString(16), coords: coords_js.coords});
			log.debug("coords_sol: %o", {seed: coords_sol.seed.toString(16), coords: coords_sol.coords});
			expect(coords_js).to.deep.equal(coords_sol);
		}
	});

	it("getResourceSites", async function() {
		for(let i = 0; i < 100; i++) {
			const seed = random_bn256();
			const element_sites = random_int(1, 16);
			const resource_sites = random_int(1, 13);
			const grid_size = random_int(32, 129);
			const site_size = random_int(2, 3);
			const sites_js = get_resource_sites(seed, element_sites, resource_sites, grid_size, site_size);
			const sites_sol = await get_resource_sites_sol(seed, element_sites, resource_sites, grid_size, site_size);
			log.debug("input: %o", {seed: seed.toString(16), element_sites, resource_sites, grid_size, site_size});
			log.debug("sites_js: %o", sites_js);
			log.debug("sites_sol: %o", sites_sol);
			expect(sites_js).to.deep.equal(sites_sol);
		}
	});

});
