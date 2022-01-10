const fs = require("fs");
const path = require("path");

// Get other dependencies
const {
    is_corner
} = require("../../land_gen/include/isomorphic_grid_utils");

// Saves SVG string to .svg file
function save_svg_to_file(filename_without_suffix, svg_string) {
    fs.writeFileSync(
        path.resolve(__dirname, `../land_svg/${filename_without_suffix}.svg`), 
        svg_string
    );
}

// prints the isomorphic plot structure with the position of each resource type
// function f to plot size and each of the coordinates (x, y)
function print_sites(plot_sites, grid_size, f = (x) => x) {
	let s = "";
	// apply H = f(grid_size) transformation
	const H = f(grid_size);
	for(let y = 0; y < H; y++) {
		for(let x = 0; x < H; x++) {
			// apply (x, y) => (f(x), f(y)) transformation to the sites coordinates
			const sites = plot_sites.filter(s => f(s.x) == x && f(s.y) == y);

			// are we in an "invalid" corner of the isomorphic grid
			const corner = is_corner(x, y, H);

			// print number of sites
			if(sites.length > 0) {
				s += s.typeId;
			}
			// print an "invalid" corner of the isomorphic grid
			else if(corner) {
				s += " ";
			}
			// print valid area of the isomorphic grid
			else {
				s += ".";
			}
		}
		s += "\n";
	}

	return s;
}

module.exports = {
    save_svg_to_file,
    print_sites
}