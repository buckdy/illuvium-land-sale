// TODO: document the file

// import Merkle tree related stuff
const {MerkleTree} = require("merkletreejs");
const keccak256 = require("keccak256");

// number utils
const {random_int} = require("../../include/number_utils");

/**
 * Generates the Land plots data
 *
 * @param plots number of plots to generate, fn will generate an array of this size
 * @param sequences number of sequences to sell plots in
 * @param regions number of regions
 * @param region_size (x, y) limit
 * @param tiers number of tiers
 * @param plot_size width, height for each plot
 * @return an array of PlotData structures
 */
function generate_land(
	plots = 100_000,
	sequences = 120,
	regions = 7,
	region_size = 500,
	tiers = 5,
	plot_size = 50
) {
	// allocate the array of `plots` size
	const land_plots = new Array(plots);

	// generate the array contents
	for(let i = 0; i < plots; i++) {
		land_plots[i] = {
			tokenId: i + 1,
			sequenceId: Math.floor(i / Math.ceil(plots / sequences)),
			regionId: random_int(1, regions),
			x: i % region_size,
			y: Math.floor(i / region_size),
			tierId: random_int(1, tiers),
			width: plot_size,
			height: plot_size,
		};
	}

	// generate an array of the leaves for a Merkle tree, the tree itself, and its root
	const leaves = land_plots.map(plot => plot_to_leaf(plot));
	const tree = new MerkleTree(leaves, keccak256, {hashLeaves: false, sortPairs: true});
	const root = tree.getHexRoot();

	// return all the cool stuff
	return {plots: land_plots, leaves, tree, root};
}

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

// export public utils API
module.exports = {
	generate_land,
	plot_to_leaf,
}