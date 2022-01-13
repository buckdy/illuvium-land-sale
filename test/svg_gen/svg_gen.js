// Land SVG Generator: Land Descriptor Tests
// Verifies Land SVG generator

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

const {
	constants
} = require("@openzeppelin/test-helpers");

// Chai test helpers
const {
	expect,
} = require("chai");

// log utils
const {
	write_info,
} = require("../protocol/include/log_utils");

// Get Land SVG test utils
const {
	land_nft_deploy,
	land_descriptor_deploy,
	generate_land_plot,
	plot_to_metadata,
	save_svg_to_file,
	print_sites,
} = require("./include/svg_gen_utils");

// Land ERC721 feature roles
const {
	ROLE_TOKEN_CREATOR,
	ROLE_TOKEN_DESTROYER,
	ROLE_URI_MANAGER,
} = require("../include/features_roles");

// run LandDescriptor tests
contract("LandDescriptor: [Land SVG Gen] Land SVG Generation Tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	const [A0, a0, H0] = accounts;
	const svg_strings = {};

	// Define token IDs
	const tokenIDs = new Array(1).fill(0).map((v, i) => i + 1);

	// Define Grid Sizes
	const plot_sizes = [100]; // 100 - 2 border isomorphic grid | 99 - 1 border isomorphic grid

	// Custom generate_land_plot_metadata with plot_sizes option
	function generate_land_plot_metadata(plot_sizes) {
		return plot_to_metadata(generate_land_plot(undefined, undefined, undefined, plot_sizes));
	}

	// Extract SVG string from Land Descriptor return data
	function get_svg_string(token_URI) {
		console.log("token_URI");
		const svg_base64 = JSON.parse(
			new Buffer.from(token_URI.split(" ")[1], "base64").toString("ascii"))["image"]
			.split(",")[1];
		console.log("svg_base64");
		const ascii = new Buffer.from(svg_base64, "base64").toString("ascii");
		console.log("ascii");
		return ascii;
	}

	// deploy LandDescriptor
	let land_descriptor;
	// Deploy LandERC721 - Required to test LandDescriptor
	let land_nft;
	before(async() => {
		// Deploy LandDescriptor
		land_descriptor = await land_descriptor_deploy(a0);
		// Deploy LandERC721
		land_nft = await land_nft_deploy(a0);
		// set the LandDescriptor implementation
		await land_nft.setLandDescriptor(land_descriptor.address, {from: a0});
		// grant this address a permission to mint
		// TODO: do we need this grant? (a0 is super admin anyway, and A0 is not used)
		// TODO: can we format idents with tabs not whitespaces
		await land_nft.updateRole(A0, ROLE_TOKEN_CREATOR | ROLE_TOKEN_DESTROYER | ROLE_URI_MANAGER, {from: a0});
		// Generate some land plot nfts
		// set the token URI and base URI,
		// support the tokens Zeppelin is going to mint with some metadata (otherwise it fails)
		let metadata;
		for(const token_id of tokenIDs) {
			metadata = generate_land_plot_metadata(plot_sizes);
			log.info(metadata);
			await land_nft.mintWithMetadata(H0, token_id, metadata, {from: a0});
		}
	});

	function test_generate_land_SVG(tokenID) {
		// TODO: file path in "it" may be wrong, file path source in "it" and "save_svg_to_file" must be the same
		it(`Generate Land SVG file at './land_svg/land_svg_token_id_${tokenID}.svg'`, async() => {
			// Get PlotView from LandERC721
			const plot = await land_nft.viewMetadata(tokenID);

			// Estimate gas cost
			const gas_eta = await land_nft.tokenURI.estimateGas(tokenID, {gas: constants.MAX_UINT256});
			log.info(`Estimated gas amount for ${tokenID} SVG generation: ${gas_eta}`);

			// Log Resource sites info
			if(log.getLevel() <= log.levels.DEBUG) {
				const resourceSites = plot.sites;
				log.debug("Site list:");
				for(const site of resourceSites) {
					log.debug(`Resource type: ${site.typeId} (${site.typeId < 4? "element": "fuel"})`);
					log.debug(`Coordinates: (${site.x}, ${site.y})\n`);
				}
			}

			// Get SVG string from LandDescriptor
			const token_URI = await land_nft.tokenURI(tokenID, {gas: constants.MAX_UINT256});
			svg_strings[tokenID] = token_URI;

			// Generate Land SVG and write to file
			const path = save_svg_to_file(`land_svg_token_id_${tokenID}`, get_svg_string(token_URI));
			log.info("SVG saved to %o", path);
		});
	}

	function test_token_URI(tokenID) {
		it(`Generate Land SVG file at './land_svg/land_svg_token_id_${tokenID}.svg'`, async function() {
			// Get token SVG string from LandERC721
			const returnData = await land_nft.tokenURI(tokenID, {gas: constants.MAX_UINT256});

			// Check if it's equal to the one generated directly from Land Descriptor
			//expect(returnData).to.be.equal(svg_strings[tokenID]);

			// Print sites to make sure the SVG positioning is correct
			if(log.getLevel() <= log.levels.DEBUG) {
				const plotView = await land_nft.viewMetadata(tokenID);
				log.debug(print_sites(plotView.sites, plotView.size));
			}

			// Generate Land SVG and write to file
			const path = save_svg_to_file(`land_svg_token_id_${tokenID}`, get_svg_string(returnData));
			log.info("SVG saved to %o", path);
		});
	}

	describe(`Generate Land SVGs for token IDs: ${tokenIDs}`, function() {
		for(let token_id of tokenIDs) {
			test_generate_land_SVG(token_id);
		}
	});
	describe(`Generate Land SVGs for token IDs: ${tokenIDs} through LandERC721 contract`, function() {
		for(const token_id of tokenIDs) {
			test_token_URI(token_id);
		}
	});
});
