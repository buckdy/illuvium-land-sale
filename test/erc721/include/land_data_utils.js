// Utility functions to create testing land plot data

// number utils
const {random_int} = require("../../include/number_utils");

/**
 * Generates the Land plot data object
 *
 * @param regions number of regions
 * @param region_size (x, y) limit
 * @param tiers number of tiers
 * @param plot_size width, height for each plot
 * @return PlotData object
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
		tierId: 1 + random_int(0, tiers),
		width: plot_size,
		height: plot_size,
		landmarkTypeId: 0,
		// [typeId, x, y]
		sites: [[1, 1, 1], [2, 2, 1], [1, 1, 2]] // TODO: do not flat
	};
}

/**
 * Generates the Land plot data object as an array ready to be passed into the smart contract
 *
 * @return PlotData object values as an array
 */
function generate_land_plot_metadata() {
	return plot_to_metadata(generate_land_plot());
}

function plot_to_metadata(plot) {
	return Object.values(plot).map(v => to_deep_bn(v));
}

function to_deep_bn(obj) {
	if(Array.isArray(obj)) {
		return obj.map(v => to_deep_bn(v));
	}

	return obj + "";
}

// export public utils API
module.exports = {
	generate_land_plot,
	generate_land_plot_metadata,
	plot_to_metadata,
}
