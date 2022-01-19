const fs = require('fs');
const path = require('path');

// reimport some utilities for SVG generation test
const {
	generate_land_plot,
	plot_to_metadata,
} = require("../../land_nft/include/land_data_utils.js");
const {
	print_plot,
} = require("../../protocol/include/land_data_utils");
const {
	random_int,
} = require("../../include/number_utils");
const { assert } = require('console');

// Some constants
const MIN_GRID_SIZE = 32;

// Saves SVG string to .svg file
function save_svg_to_file(svg_name, svg_data) {
	const file_path = path.resolve(__dirname, `../land_svg/${svg_name}.svg`);
	if (!fs.existsSync(path.dirname(file_path))) {
		fs.mkdirSync(path.dirname(file_path));
	}
	fs.writeFileSync(file_path, svg_data);
	return file_path;
}

// Generate `n` random integers for randomized plot_sizes
function gen_random_plot_sizes(from = undefined, to, n, fixed_plot_sizes = undefined) {
	from = from?? MIN_GRID_SIZE;
	assert(from >= MIN_GRID_SIZE, `Minimum grid size is ${MIN_GRID_SIZE}`);
	const plot_sizes = fixed_plot_sizes?? [];
	let random_number;
	for (let i = 0; i < n; i++) {
		random_number = random_int(from, to)
		if (plot_sizes.includes(random_number)) {
			i--;
			continue;
		}
		plot_sizes.push(random_number);
	}
	return plot_sizes.sort();
}


// export public utils API
module.exports = {
	generate_land_plot,
	plot_to_metadata,
	save_svg_to_file,
	print_plot,
	gen_random_plot_sizes,
	MIN_GRID_SIZE,
}
