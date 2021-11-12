// Utility functions to create testing land plot data collection,
// and to work with the Merkle tree of this data collection

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// import Merkle tree related stuff
const {MerkleTree} = require("merkletreejs");
const keccak256 = require("keccak256");

// number utils
const {
	random_int,
	random_element,
} = require("../../include/number_utils");

/**
 * Generates the Land plots data, and its Merkle tree related structures
 *
 * @param plots number of plots to generate, fn will generate an array of this size
 * @param sequences number of sequences to sell plots in
 * @param regions number of regions
 * @param region_size (x, y) limit
 * @param tiers number of tiers
 * @param plot_sizes possible square sizes to randomly pick from to generate a plot
 * @return Array<PlotData>, an array of PlotData structures, their hashes (Merkle leaves), Merkle tree, and root
 */
function generate_land(
	plots = 100_000,
	sequences = 120,
	regions = 7,
	region_size = 500,
	tiers = 5,
	plot_sizes = [90, 120]
) {
	if(plots > 20_000) {
		log.debug("generating %o land plots, this may take a while", plots);
	}

	// allocate the array of `plots` size
	const land_plots = new Array(plots);

	// generate the array contents
	for(let i = 0; i < plots; i++) {
		land_plots[i] = {
			tokenId: i + 1,
			sequenceId: Math.floor(sequences * i / plots),
			regionId: random_int(1, 1 + regions),
			x: i % region_size,
			y: Math.floor(i / region_size),
			tierId: random_int(1, 1 + tiers),
			size: random_element(plot_sizes),
		};
	}

	// generate an array of the leaves for a Merkle tree, the tree itself, and its root
	const leaves = land_plots.map(plot => plot_to_leaf(plot));
	const tree = new MerkleTree(leaves, keccak256, {hashLeaves: false, sortPairs: true});
	const root = tree.getHexRoot();

	// return all the cool stuff
	return {plots: land_plots, leaves, tree, root, sequences, regions, tiers, plot_sizes};
}

// prints the plot information, including internal structure
function print_plot(plot, print_sites = false) {
	// short header
	let s = `(${plot.x}, ${plot.y}, ${plot.regionId}) ${plot.size}x${plot.size} Tier ${plot.tierId}`;
	if(!plot.sites) {
		return s;
	}

	// expand header
	const types = new Array(8);
	for(let i = 0; i < types.length; i++) {
		types[i] = plot.sites.filter(s => s.typeId == i).length;
	}
	const element_sites = types[1] + types[2] + types[3];
	const fuel_sites = types[4] + types[5] + types[6];
	s += `: ${element_sites}/${fuel_sites} (${types[1]}/${types[2]}/${types[3]}/${types[4]}/${types[5]}/${types[6]})`;

	if(!print_sites) {
		s += `// ${plot.landmarkTypeId}`;
		return s;
	}

	// print the internal land plot structure
	s += "\n";
	s += print_site_type(plot.landmarkTypeId) + "\n";
	// TODO: apply isomorphic grid
	const plot_size = plot.size >> 1;
	for(let y = 0; y < plot_size; y++) {
		for(let x = 0; x < plot_size; x++) {
			const sites = plot.sites.filter(s => s.x >> 1 == x && s.y >> 1 == y);
			if(sites.length > 1) {
				s += "*";
			}
			else if(sites.length > 0) {
				const site = sites[0];
				s += print_site_type(site.typeId)
			}
			else {
				s += ".";
			}
		}
		s += "\n";
	}

	return s;
}

function print_site_type(typeId) {
	typeId = parseInt(typeId);
	switch(typeId) {
		case 0: return ".";  // No landmark/site
		case 1: return "C";  // Carbon
		case 2: return "S";  // Silicon
		case 3: return "H";  // Hydrogen
		case 4: return "c";  // Crypton
		case 5: return "h";  // Hyperion
		case 6: return "s";  // Solon
		case 7: return "A";  // Arena (Landmark only)
		default: return "U"; // Unknown
	}
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
	print_plot,
	plot_to_leaf,
	plot_to_metadata,
}
