// Utility functions to create testing land plot data

// number utils
const {
	random_int,
	random_element,
} = require("../../include/number_utils");

// BN utils
const {
	random_bits,
} = require("../../include/bn_utils");

/**
 * Generates the Land plot data object
 *
 * @param regions number of regions
 * @param region_size (x, y) limit
 * @param tiers number of tiers
 * @param plot_sizes possible square sizes to randomly pick from to generate a plot
 * @return PlotData object
 */
function generate_land_plot(
	regions = 7,
	region_size = 500,
	tiers = 5,
	plot_sizes = [59, 60, 79, 80, 99, 100, 119, 120]
) {
	return {
		regionId: random_int(1, 1 + regions),
		x: random_int(1, 10_000),
		y: random_int(1, 10_000),
		tierId: random_int(1, 1 + tiers),
		size: random_element(plot_sizes),
		landmarkTypeId: random_int(0, 8),
		elementSites: random_int(3, 16),
		fuelSites: random_int(1, 13),
		version: random_int(1, 100),
		seed: random_bits(160).toString(),
	};
}

function generate_land_plot_with_size(
	regions = 7,
	region_size = 500,
	tiers = 5,
	plot_size = 100
) {
	return {
		regionId: random_int(1, 1 + regions),
		x: random_int(1, 10_000),
		y: random_int(1, 10_000),
		tierId: random_int(1, 1 + tiers),
		size: plot_size,
		landmarkTypeId: random_int(0, 8),
		elementSites: random_int(3, 16),
		fuelSites: random_int(1, 13),
		version: random_int(1, 100),
		seed: random_bits(160).toString(),
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
	generate_land_plot,
	generate_land_plot_metadata,
	plot_to_metadata,
	generate_land_plot_with_size,
}
