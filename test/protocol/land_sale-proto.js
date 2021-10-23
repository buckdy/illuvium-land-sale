// LandSale: Prototype Test
// This test executes a successful buying scenario

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// Merkle tree related stuff
const {MerkleTree} = require("merkletreejs");
const keccak256 = require("keccak256");
// equivalent to Solidity keccak256(abi.encodePacked(...))
const soliditySha3 = web3.utils.soliditySha3;

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

// number utils
const {
	random_int,
	random_element,
} = require("../include/number_utils");

// deployment routines in use
const {
	land_sale_deploy,
} = require("./include/deployment_routines");

// run land sale prototype test
contract("LandSale: Prototype Test", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// deploy and initialize the sale
	let land_sale, land_nft;
	beforeEach(async function() {
		({land_sale, land_nft} = await land_sale_deploy(a0));
	});

	// define constants to generate plots
	const plots_on_sale = 100_000;
	const sequences = 120;
	const regions = 7;
	const tiers = 5;
	const region_size = 500;
	const plot_size = 50;

	// generate the land sale data
	const plots = new Array(plots_on_sale);
	log.debug("generating %o land plots", plots_on_sale);
	for(let i = 0; i < plots_on_sale; i++) {
		plots[i] = {
			tokenId: i + 1,
			sequenceId: Math.floor(i / Math.ceil(plots_on_sale / sequences)),
			regionId: random_int(1, regions),
			x: i % region_size,
			y: Math.floor(i / region_size),
			tierId: random_int(1, tiers),
			width: plot_size,
			height: plot_size,
		};
	}
	log.info("generated %o land plots", plots_on_sale);

	// construct the Merkle tree
	log.debug("constructing the Merkle tree for %o land plots", plots_on_sale);
	const leaves = plots.map(plot => plot_to_leaf(plot));
	const tree = new MerkleTree(leaves, keccak256, {hashLeaves: false, sortPairs: true});
	const hexRoot = tree.getHexRoot();

	// verify the tree by picking up some random element and validating its proof
	const plot = random_element(plots);
	const leaf = plot_to_leaf(plot);
	assert(
		tree.verify(tree.getProof(leaf), leaf, hexRoot),
		"Merkle tree construction failed: unable to verify random leaf " + plot.tokenId
	);
	log.info("successfully constructed the Merkle tree for %o land plots", plots_on_sale);

	// register the Merkle root within the sale
	beforeEach(async function() {
		await land_sale.setInputDataRoot(hexRoot, {from: a0});
	});

	// verify if the plot is registered on sale
	it(`verify random plot ${plot.tokenId} is registered on sale`, async function() {
		expect(await land_sale.isPlotValid(Object.values(plot), tree.getHexProof(leaf))).to.be.true;
	});
});

/**
 * Calculates keccak256(abi.encodePacked(...)) for the struct PlotData from LandSale.sol
 *
 * @param plot PlotData object
 * @return {Buffer} keccak256 hash of tightly packed PlotData fields
 */
function plot_to_leaf(plot) {
	// flatten the input land plot object
	const values = Object.values(plot);
	// convert it into the params array to feed the soliditySha3
	// TODO: what can we do with this ugly ABI mapping for PlotData struct?
	const params = values.map((v, i) => Object.assign({t: i < 2? "uint32": i === 5? "uint8": "uint16", v}));

	// feed the soliditySha3 to get a hex-encoded keccak256
	const hash = web3.utils.soliditySha3(...params);
	// return as Buffer
	return MerkleTree.bufferify(hash);
}
