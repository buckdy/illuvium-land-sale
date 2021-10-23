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
	const plots_on_sale = 3; // 100_000;
	const sequences = 120;
	const regions = 7;
	const region_size = 500;
	const plot_size = 50;

	// generate the land sale data
	const plots = new Array(plots_on_sale);
	log.debug("generating %o land plots", plots_on_sale);
	for(let i = 0; i < plots_on_sale; i++) {
		plots[i] = {
			tokenId: i + 1,
			sequenceId: 0, // TODO: impl
			regionId: 1, // TODO: impl
			x: i % region_size,
			y: Math.floor(i / region_size),
			tierId: 1, // TODO: impl
			width: plot_size,
			height: plot_size,
		};
	}
	log.info("generated %o land plots", plots_on_sale);

	// construct the Merkle tree
	log.debug("constructing the Merkle tree for %o land plots", plots_on_sale);
	const leaves = plots.map(plot => keccak256(soliditySha3(...Object.values(plot))));
	const tree = new MerkleTree(leaves, keccak256/*, {hashLeaves: false, sortPairs: true}*/);
	const root = tree.getHexRoot();

	// verify the tree by picking up some random element and validating its proof
	const plot = random_element(plots);
	const leaf = keccak256(soliditySha3(...Object.values(plot)));
	const proof = tree.getProof(leaf);
	const hexProof = tree.getHexProof(leaf);
	assert(tree.verify(proof, leaf, root), "Merkle tree construction failed: unable to verify random leaf " + plot.tokenId);
	log.info("successfully constructed the Merkle tree for %o land plots", plots_on_sale);

	// register the Merkle root within the sale
	beforeEach(async function() {
		await land_sale.setInputDataRoot(root, {from: a0});
	});

	// verify if the plot is registered on sale
	it(`verify random plot ${plot.tokenId} is registered on sale`, async function() {
		log.debug("isPlotValid(%o, %o, %o, %o)", plot.tokenId, plot.sequenceId, plot, hexProof);
		expect(await land_sale.isPlotValid(Object.values(plot), hexProof)).to.be.true;
	});
});

