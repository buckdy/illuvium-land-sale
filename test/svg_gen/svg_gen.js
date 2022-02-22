// Land SVG Generator: Land Descriptor Tests
// Verifies Land SVG generator

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// Zeppelin test helpers
const {
	constants,
} = require("@openzeppelin/test-helpers");
const {
	assert,
	expect,
} = require("chai");

// SVG gen utils
const {
	generate_land_plot_metadata,
	save_svg_to_file,
	print_plot,
	gen_random_plot_sizes,
} = require("./include/svg_gen_utils");

// deployment routines in use
const {
	land_descriptor_deploy,
	land_nft_deploy,
} = require("./include/deployment_routines");

// JS implementation for SVG generator
const {
	LandDescriptor,
} = require("./include/land_svg_lib");

// run LandDescriptor tests
contract("LandDescriptor: Land SVG Generator Tests", function(accounts) {
	// extract accounts to be used:
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	const [a0, H0] = accounts;

	// grid (plot) sizes
	const plot_sizes = [48, 49, 50, 51, 52];

	// randomize plot sizes
	const max_plot_size = 120;
	const rnd_plot_sizes = 5;

	// Define token IDs
	const tokenIDs = new Array(plot_sizes.length + rnd_plot_sizes).fill(0).map((v, i) => i + 1);

	// Custom generate_land_plots with the plot_sizes option
	function generate_land_plots(plot_sizes) {
		const landPlots = [];
		for(const size of plot_sizes) {
			landPlots.push(generate_land_plot_metadata(undefined, undefined, undefined, [size]));
		}
		return landPlots;
	}

	// Extract SVG string from Land Descriptor return data
	function get_svg_string(token_URI) {
		const svg_base64 = JSON.parse(
			new Buffer.from(token_URI.split(" ")[1], "base64").toString("ascii"))["image"]
			.split(",")[1];
		return new Buffer.from(svg_base64, "base64").toString("ascii");
	}

	// Attach `n` random plot sizes to fixed ones
	function attach_random_plot_sizes(to, n, fixed_plot_sizes) {
		return gen_random_plot_sizes(undefined, to, n, fixed_plot_sizes);
	}

	// deploy LandDescriptor
	let land_descriptor;
	// Deploy LandERC721 - Required to test LandDescriptor
	let land_nft;
	beforeEach(async() => {
		// Deploy LandDescriptor
		land_descriptor = await land_descriptor_deploy(a0);
		// Deploy LandERC721
		land_nft = await land_nft_deploy(a0);
		// set the LandDescriptor implementation
		await land_nft.setLandDescriptor(land_descriptor.address, {from: a0});
		// Generate random plot_sizes
		const extended_plot_sizes = attach_random_plot_sizes(max_plot_size, rnd_plot_sizes, plot_sizes);
		// Generate some land plot NFTs
		// set the token URI and base URI,
		// support the tokens Zeppelin is going to mint with some metadata (otherwise it fails)
		let landPlots = generate_land_plots(extended_plot_sizes)
		for(let i = 0; i < tokenIDs.length; i++) {
			await land_nft.mintWithMetadata(H0, tokenIDs[i], landPlots[i], {from: a0});
		}
	});

	function test_token_URI(token_id) {
		it(`gen Land SVG file for ${token_id}}`, async function() {
			// Estimate gas cost
			const gas_eta = await land_nft.tokenURI.estimateGas(token_id, {gas: constants.MAX_UINT256});
			log.info(`Estimated gas amount for ${token_id} SVG generation: ${gas_eta}`);

			// Log Resource sites info
			if(log.getLevel() <= log.levels.DEBUG) {
				const resourceSites = plot.sites;
				log.debug("Site list:");
				for(const site of resourceSites) {
					log.debug(`Resource type: ${site.typeId} (${site.typeId < 4? "element": "fuel"})`);
					log.debug(`Coordinates: (${site.x}, ${site.y})\n`);
				}
			}
			// Get plot for token ID and generate SVG using JS impl
			const plotView = await land_nft.viewMetadata(token_id);
			const returnDataJs = LandDescriptor.tokenURI(plotView);

			// Print sites to make sure the SVG positioning is correct
			log.debug(print_plot(plotView));

			// Get token SVG string from LandERC721
			const returnData = await land_nft.tokenURI(token_id, {gas: constants.MAX_UINT256});

			// Check if it's equal to the one generated directly from Land Descriptor
			expect(returnData).to.be.equal(returnDataJs);

			// Generate Land SVG and write to file
			const path = save_svg_to_file(`land_svg_token_id_${token_id}_gridsize_${plotView.size}`, get_svg_string(returnData));
			log.info("SVG saved to %o", path);
		});
	}

	describe(`Generate Land SVGs for token IDs: ${tokenIDs} through LandERC721 contract`, function() {
		tokenIDs.forEach(test_token_URI);
	});
});
