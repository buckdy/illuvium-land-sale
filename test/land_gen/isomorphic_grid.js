// Land Generator: Isomorphic Grid Tests
// Verifies Resource Sites positioning on the isomorphic grid

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
	random_element,
} = require("../include/number_utils");

// BN utils
const {
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

// log utils
const {
	write_info,
} = require("../protocol/include/log_utils");

// deployment routines in use
const {
	land_lib_deploy,
} = require("./include/deployment_routines");

// run 10k sale simulation
contract("LandLib: [Land Gen] Isomorphic Grid Tests", function(accounts) {
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

	it("it possible to generate plot sites of zero length", async function() {
		const resource_sites = await land_lib.getResourceSites(0, 0, 0, 4);
		expect(resource_sites.length).to.equal(0);
	});
	it("it possible to generate plot sites with one element site only", async function() {
		const resource_sites = await land_lib.getResourceSites(0, 1, 0, 8);
		expect(resource_sites.length, "no sites or more than one site").to.equal(1);
		expect(resource_sites[0].typeId).to.be.bignumber.that.is.closeTo("2", "1");
	});
	it("it possible to generate plot sites with one fuel site only", async function() {
		const resource_sites = await land_lib.getResourceSites(0, 0, 1, 8);
		expect(resource_sites.length, "no sites or more than one site").to.equal(1);
		expect(resource_sites[0].typeId).to.be.bignumber.that.is.closeTo("5", "1");
	});

	async function get_resource_sites(seed, element_sites, fuel_sites, size) {
		return (await land_lib.getResourceSites(seed, element_sites, fuel_sites, size))
			.map(site => Object.assign({}, {
				typeId: site.typeId/*.toNumber()*/,
				x: site.x/*.toNumber()*/,
				y: site.y/*.toNumber()*/,
			})).sort((s1, s2) => s1.y << 16 | s1.x - s2.y << 16 | s2.x);
	}

	const size = 59;

	// for each tier ID
	for(let tier_id = 1; tier_id <= 5; tier_id++) {
		// generate the resource sites for `n` plots
		const plot_sites = new Array(1_00);
		before(async function() {
			log.info("generating %o plot sites for the tier %o", plot_sites.length, tier_id);
			write_info("[");
			for(let seed = 0; seed < plot_sites.length; seed++) {
				plot_sites[seed] = await get_resource_sites(seed, element_sites[tier_id], fuel_sites[tier_id], size);
				if(!(seed % Math.floor(plot_sites.length / 100))) {
					write_info(".");
				}
			}
			write_info("]\n");
		});

		// do the tests (no collisions, sites are positioned inside isomorphic grid, etc.)
		it(`there are no resource site collisions in ${plot_sites.length} plot sites for tier ${tier_id}`, async function() {
			for(let i = 0; i < plot_sites; i++) {
				const resource_sites = plot_sites[i];
				for(let j = 1; j < resource_sites.length; j++) {
					const s0 = resource_sites[j - 1];
					const s1 = resource_sites[j];
					expect(s0.x != s1.x && s0.y != s1.y, `resource sites collision ${i}/${j}`).to.be.true;
				}
			}
		});
		it(`resource sites distribution for tier ${tier_id} is inside the isomorphic grid`, async function() {
			const sites = plot_sites.flat();
			log.info(print_sites(sites, size));
			expect(sites.filter(site => is_corner(site.x, site.y, size)).length).to.equal(0);
		});
		for(let id = 1; id <= 6; id++) {
			it(`resource type ${id} distribution for tier ${tier_id} is inside the isomorphic grid`, async function() {
				const sites = plot_sites.flat().filter(site => site.typeId == id);
				log.debug(print_sites(sites, size));
				expect(sites.filter(site => is_corner(site.x, site.y, size)).length).to.equal(0);
			});
		}
	}
});
