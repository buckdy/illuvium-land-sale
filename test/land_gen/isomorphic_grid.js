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

// run Land Generator: Isomorphic Grid Tests
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

	// TODO: add JS implementation and increase number of runs (plots)
	async function get_resource_sites(seed, element_sites, fuel_sites, grid_size, site_size = 2) {
		return (await land_lib.getResourceSites(seed, element_sites, fuel_sites, grid_size, site_size))
			.map(site => Object.assign({}, {
				typeId: parseInt(site.typeId),
				x: parseInt(site.x),
				y: parseInt(site.y),
			})).sort((s1, s2) => (s1.y * grid_size + s1.x) - (s2.y * grid_size + s2.x));
	}

	it("it possible to generate site maps of zero length", async function() {
		const resource_sites = await get_resource_sites(0, 0, 0, 4);
		expect(resource_sites.length).to.equal(0);
	});
	it("it possible to generate site maps with one element site only", async function() {
		const resource_sites = await get_resource_sites(0, 1, 0, 8);
		expect(resource_sites.length, "no sites or more than one site").to.equal(1);
		expect(resource_sites[0].typeId).to.be.closeTo(2, 1);
	});
	it("it possible to generate site maps with one fuel site only", async function() {
		const resource_sites = await get_resource_sites(0, 0, 1, 8);
		expect(resource_sites.length, "no sites or more than one site").to.equal(1);
		expect(resource_sites[0].typeId).to.be.closeTo(5, 1);
	});

	/**
	 * Performs an isomorphic grid test
	 *
	 * @param tier_id used to derive amounts of resource sites to generate
	 * @param grid_size size of the grid
	 * @param plots number of iterations, number of plots to generate
	 * @param site_size implied size of the resource site
	 */
	function isomorphic_gen_test(tier_id, grid_size, plots = 100, site_size = 2) {
		// generate the resource sites for `plots` plots
		const site_maps = new Array(plots);
		let all_sites;
		before(async function() {
			log.info("generating %o site maps for tier %o, grid size %o, site size %o", site_maps.length, tier_id, grid_size, site_size);
			write_info("[");
			for(let seed = 0; seed < site_maps.length; seed++) {
				site_maps[seed] = await get_resource_sites(seed, element_sites[tier_id], fuel_sites[tier_id], grid_size, site_size);
				if(!(seed % Math.floor(site_maps.length / 100))) {
					write_info(".");
				}
			}
			write_info("]\n");
			all_sites = site_maps.flat();
			log.info("all sites map:\n" + print_sites(all_sites, grid_size));
			for(let type_id = 1; type_id <= 6; type_id++) {
				const sites = all_sites.filter(site => site.typeId == type_id);
				log.debug("resource type %o sites map:\n" + print_sites(sites, grid_size), type_id);
			}
		});

		// expects there are no coinciding resource sites in the collection
		function expect_no_collision(resource_sites) {
			resource_sites.forEach((s0, i) => {
				// all the colliding sites
				const collided_sites = resource_sites.filter(
					(s1, j) => j > i
						&& Math.abs(s0.x - s1.x) < site_size
						&& Math.abs(s0.y - s1.y) < site_size
				);

				// first collision if any
				const s1 = collided_sites.find(() => true);
				const x1 = s1? s1.x: -1;
				const y1 = s1? s1.y: -1;

				// do chai expect there are no collisions
				expect(
					collided_sites.length,
					`resource sites collision at ${i} (${s0.x}, ${s0.y})/(${x1}, ${y1})`
				).to.equal(0);
			})
		}

		// expects no resource sites are placed outside the isomorphic grid
		function expect_no_corner(resource_sites) {
			// for each coordinate occupied by the resource
			for(let i = 0; i < site_size; i++) {
				for(let j = 0; j < site_size; j++) {
					// find the resource sites outside the isomorphic grid (in the corners)
					const sites_in_corners = resource_sites.filter(site => is_corner(site.x + i, site.y + j, grid_size));
					// do chai expect there are no such sites
					expect(sites_in_corners.length, `corner collision (${i}, ${j})`).to.equal(0);
				}
			}
		}

		// expects resource sites locations (x, y) look random on the isomorphic grid
		function expect_looks_random(resource_sites) {
			// TODO: implement
		}

		// do the tests (no collisions, sites are positioned inside isomorphic grid, randomness, etc.)
		it(`there are no resource site collisions tier ${tier_id}, grid size ${grid_size}`, async function() {
			site_maps.forEach(resource_sites => {
				expect_no_collision(resource_sites);
			});
		});
		it(`resource sites distribution for tier ${tier_id}, grid size ${grid_size} is inside the isomorphic grid`, async function() {
			expect_no_corner(all_sites);
		});
		it(`resource sites distribution for tier ${tier_id}, grid size ${grid_size} looks random`);
		for(let type_id = 1; type_id <= 6; type_id++) {
			it(`resource type ${type_id} distribution for tier ${tier_id}, grid size ${grid_size} is inside the isomorphic grid`, async function() {
				expect_no_corner(all_sites.filter(site => site.typeId == type_id));
			});
			it(`resource type ${type_id} distribution for tier ${tier_id}, grid size ${grid_size} looks random`);
		}
	}

	// grid sizes
	[8, 9, 10, 11].forEach(grid_size => {
		describe(`when grid size is ${grid_size}`, function() {
			// the lowest tier(s)
			[1].forEach(tier_id => {
				isomorphic_gen_test(tier_id, grid_size, 5);
			});
		});
	});

	// grid sizes
	[12, 13, 14, 15, 16].forEach(grid_size => {
		describe(`when grid size is ${grid_size}`, function() {
			// lower tier(s)
			[2].forEach(tier_id => {
				isomorphic_gen_test(tier_id, grid_size, 5);
			});
		});
	});

	// grid sizes
	[32, 33, 34, 35, 36].forEach(grid_size => {
		describe(`when grid size is ${grid_size}`, function() {
			// middle tier(s)
			[3].forEach(tier_id => {
				isomorphic_gen_test(tier_id, grid_size, 30, 3);
			});
		});
	});

	// grid sizes
	[58, 59, 60, 61, 62, 63, 64].forEach(grid_size => {
		describe(`when grid size is ${grid_size}`, function() {
			// all the tiers
			[1, 2, 3, 4, 5].forEach(tier_id => {
				isomorphic_gen_test(tier_id, grid_size, 50, 3);
			});
		});
	});
});
