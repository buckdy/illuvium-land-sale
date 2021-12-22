// Land SVG Generator: Land Descriptor Tests
// Verifies Land SVG generator

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

const {
	constants,
} = require("@openzeppelin/test-helpers");

// Chai test helpers
const {
	assert,
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
    generate_land_plot_metadata
} = require("../land_nft/include/land_data_utils.js");

// Get Land SVG test utils
const {
    save_svg_to_file
} = require("./include/svg_gen_utils");

// Land ERC721 feature roles
const {
	ROLE_TOKEN_CREATOR,
	ROLE_TOKEN_DESTROYER,
	ROLE_URI_MANAGER,
} = require("../include/features_roles");

contract("LandDescriptor: [Land SVG Gen] Land SVG Generation Tests", function(accounts) {
    // Get necessary accounts
    // A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
    const [A0, a0] = accounts;

    // Define token IDs
    const numberOfIDs = 1;
    const tokenIDs = [...Array(numberOfIDs).keys()].map(id => id+1);

    // Deploy LandDescriptor
    let landDescriptor;
    // Deploy LandERC721 - Required to test LandDescriptor
    let landNft;
    before(async () => {
        // Deploy LandDescriptor
        landDescriptor = await land_descriptor_deploy(a0);
        // Deploy LandERC721
        landNft = await land_nft_deploy(landDescriptor, a0);
        // grant this address a permission to mint
        await landNft.updateRole(A0, ROLE_TOKEN_CREATOR | ROLE_TOKEN_DESTROYER | ROLE_URI_MANAGER, {from: a0});
    });
    beforeEach(async () => {
        // Generate some land plot nfts
        // set the token URI and base URI,
        // support the tokens Zeppelin is going to mint with some metadata (otherwise it fails)
        for (const tokenID of tokenIDs) {
            await landNft.setMetadata(tokenID, generate_land_plot_metadata(), {from: a0});
        }
    });

    function generateLandSVG(tokenID) {
        it(`Generate Land SVG file at './land_svg/land_svg_token_id_${tokenID}.svg'`, async () => {
            // Get SVG string from LandDescriptor
            console.log("####### BEGIN GENERATION OF SVG STRING FROM THE CONTRACT #######");
            const returnData = await landDescriptor.tokenURI(landNft.address, tokenID, {gas: constants.MAX_UINT256});
            console.log("####### FINISH GENERATION OF SVG STRING FROM THE CONTRACT #######");
            // Generate Land SVG and write to file
            const svgStringBase64 = JSON.parse(new Buffer.from(returnData.split(" ")[1], "base64").toString("ascii"))["image"].split(",")[1];
            const svgStringAscii = new Buffer.from(svgStringBase64, "base64").toString("ascii")
            save_svg_to_file(`land_svg_token_id_${tokenID}`, svgStringAscii);
        });
    }
    describe(`Generate Land SVGs for token IDs: ${tokenIDs}`, function() {
        tokenIDs.forEach(tokenID => generateLandSVG(tokenID));
    });
});