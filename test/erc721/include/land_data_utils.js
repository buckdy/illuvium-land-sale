// Utility functions to create testing land plot data

// number utils
const {random_int} = require("../../include/number_utils");

/**
 * Generates the Land plots data, and its Merkle tree related structures
 *
 * @param regions number of regions
 * @param region_size (x, y) limit
 * @param tiers number of tiers
 * @param plot_size width, height for each plot
 * @return Array<PlotData>, an array of PlotData structures, their hashes (Merkle leaves), Merkle tree, and root
 */
function generate_land_plot(
	regions = 7,
	region_size = 500,
	tiers = 5,
	plot_size = 50
) {
	return {
		regionId: random_int(1, regions),
		x: random_int(1, 10_000),
		y: random_int(1, 10_000),
		tierId: random_int(1, tiers),
		width: plot_size,
		height: plot_size,
		landmarkTypeId: 0,
		sites: []
	};
}

// export public utils API
module.exports = {
	generate_land_plot,
}
