// Utility functions to create testing land plot data collection,
// and to work with the Merkle tree of this data collection

// import Merkle tree related stuff
const {MerkleTree} = require("merkletreejs");
const keccak256 = require("keccak256");

// number utils
const {random_int} = require("../../include/number_utils");

/**
 * Generates the Land plots data, and its Merkle tree related structures
 *
 * @param plots number of plots to generate, fn will generate an array of this size
 * @param sequences number of sequences to sell plots in
 * @param regions number of regions
 * @param region_size (x, y) limit
 * @param tiers number of tiers
 * @param plot_size square size for each plot
 * @return Array<PlotData>, an array of PlotData structures, their hashes (Merkle leaves), Merkle tree, and root
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
			sequenceId: Math.floor(sequences * i / plots),
			regionId: random_int(1, regions),
			x: i % region_size,
			y: Math.floor(i / region_size),
			tierId: random_int(1, tiers),
			size: plot_size,
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
	const params = values.map((v, i) => Object.assign({t: i < 2? "uint32": "uint16", v}));

	// feed the soliditySha3 to get a hex-encoded keccak256
	const hash = web3.utils.soliditySha3(...params);
	// return as Buffer
	return MerkleTree.bufferify(hash);
}

/**
 * Converts Plot data struct into an array
 *
 * @param plot Plot data struct
 * @return ABI compatible array representing the Plot data struct
 */
function plot_to_metadata(plot) {
	return Object.values(plot).map(v => stringify(v));
}

// converts all primitives inside the array to string
function stringify(arr) {
	if(Array.isArray(arr)) {
		return arr.map(v => stringify(v));
	}

	return arr + "";
}

// export public utils API
module.exports = {
	generate_land,
	plot_to_leaf,
	plot_to_metadata,
}
