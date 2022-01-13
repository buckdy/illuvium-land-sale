// Land SVG Generator: Land Descriptor Tests
// Verifies Land SVG generator

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "silent");

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

// deployment routines in use
const {
	land_descriptor_deploy,
    land_nft_deploy
} = require("./include/deployment_routines");

// Get land generation metadata utils
const {
    plot_to_metadata,
    generate_land_plot
} = require("./include/land_data_utils.js");

// Get Land SVG test utils
const {
    save_svg_to_file,
    print_sites
} = require("./include/svg_gen_utils");

// Land ERC721 feature roles
const {
	ROLE_TOKEN_CREATOR,
	ROLE_TOKEN_DESTROYER,
	ROLE_URI_MANAGER,
} = require("../include/features_roles");

// Func utils
const {
    asyncForEach
} = require("../include/func_utils");

contract("LandDescriptor: [Land SVG Gen] Land SVG Generation Tests", function(accounts) {
    // Get necessary accounts
    // A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
    // H0 – initial token holder account
    const [A0, a0, H0] = accounts;
    const SVGStrings = new Object();

    // Define token IDs
    const numberOfIDs = 1;
    const tokenIDs = [...Array(numberOfIDs).keys()].map(id => id+1);

    // Define Grid Sizes
    const plot_sizes = [100]; // 100 - 2 border isomorphic grid | 99 - 1 border isomorphic grid

    // Custom generate_land_plot_metadata with plot_sizes option
    function generate_land_plot_metadata(plot_sizes) {
        return plot_to_metadata(generate_land_plot(undefined, undefined, undefined, plot_sizes));
    }

    // Extract SVG string from Land Descriptor return data
    function get_svg_string(land_descriptor_return_data) {
        const svgStringBase64 = JSON.parse(
            new Buffer.from(land_descriptor_return_data.split(" ")[1], "base64")
            .toString("ascii"))["image"]
            .split(",")[1];
        return new Buffer.from(svgStringBase64, "base64").toString("ascii");
    }

    // Deploy LandDescriptor
    let landDescriptor;
    // Deploy LandERC721 - Required to test LandDescriptor
    let landNft;
    before(async () => {
        // Deploy LandDescriptor
        landDescriptor = await land_descriptor_deploy(a0);
        // Deploy LandERC721
        landNft = await land_nft_deploy(a0);
        // set the LandDescriptor implementation
        await landNft.setLandDescriptor({from: a0});
        // grant this address a permission to mint
        // TODO: do we need this grant? (a0 is super admin anyway, and A0 is not used)
        // TODO: can we format idents with tabs not whitespaces
        await landNft.updateRole(A0, ROLE_TOKEN_CREATOR | ROLE_TOKEN_DESTROYER | ROLE_URI_MANAGER, {from: a0});
        // Generate some land plot nfts
        // set the token URI and base URI,
        // support the tokens Zeppelin is going to mint with some metadata (otherwise it fails)
        let landPlotMetadata;
        for (const tokenID of tokenIDs) {
            landPlotMetadata = generate_land_plot_metadata(plot_sizes);
            if (log.getLevel() <= log.levels.INFO) console.log(landPlotMetadata);
            await landNft.mintWithMetadata(H0, tokenID, landPlotMetadata, {from: a0});
        }
    });

    async function generateLandSVGForTokenIDs(tokenIDs) {
        write_info("[");
        await asyncForEach(tokenIDs, async tokenID => {
            await generateLandSVG(tokenID);
            write_info(".");
        })
        write_info("]");
    }

    async function generateLandSVG(tokenID) {
        it(`Generate Land SVG file at './land_svg/land_svg_token_id_${tokenID}.svg'`, async () => {
            // Get PlotView from LandERC721
            const plot = await landNft.viewMetadata(tokenID);

            // Estimate gas cost
            if (log.getLevel() <= log.levels.DEBUG) {
                const estimatedGas = await landDescriptor.tokenURI.estimateGas(
                    plot, {gas: constants.MAX_UINT256});
                console.log(`Estimated gas amount for ${tokenID} SVG generation: ${estimatedGas}`);
            }

            // Log Resource sites info
            if (log.getLevel() <= log.levels.INFO) {
                const resourceSites = plot.sites;
                console.log("Site list:");
                for (const site of resourceSites) {
                    console.log(`Resource type: ${site.typeId} (${site.typeId < 4 ? "element" : "fuel"})`);
                    console.log(`Coordinates: (${site.x}, ${site.y})\n`);
                }
            }

            // Get SVG string from LandDescriptor
            const returnData = await landNft.tokenURI(tokenID, {gas: constants.MAX_UINT256});
            SVGStrings[tokenID] = returnData;

            // Generate Land SVG and write to file
            save_svg_to_file(`land_svg_token_id_${tokenID}`, get_svg_string(returnData));
        });
    }

    async function tokenURI(tokenID) {
        it(`Generate Land SVG file at './land_svg/land_svg_token_id_${tokenID}.svg'`, async function() {
        // Get token SVG string from LandERC721
        const returnData = await landNft.tokenURI(tokenID, {gas: constants.MAX_UINT256});

        // Check if it's equal to the one generated directly from Land Descriptor
        //expect(returnData).to.be.equal(SVGStrings[tokenID]);

        // Print sites to make sure the SVG positioning is correct
        if (log.getLevel() <= log.levels.DEBUG) {
            const plotView = await landNft.viewMetadata(tokenID);
            console.log(print_sites(plotView.sites, plotView.size));
        }
        
        // Generate Land SVG and write to file
        save_svg_to_file(`land_svg_token_id_${tokenID}`, get_svg_string(returnData));
        });
    }

    describe(`Generate Land SVGs for token IDs: ${tokenIDs}`, async function() {
        await generateLandSVGForTokenIDs(tokenIDs);
    });
    describe(`Generate Land SVGs for token IDs: ${tokenIDs} through LandERC721 contract`, async function() {
        await asyncForEach(tokenIDs, tokenID => tokenURI(tokenID));
    });
});
