// prints the plot information, including internal structure, applies
// function f to plot size and each of the coordinates (x, y)
function print_sites(plot_sites, size, f = (x) => x) {
	let s = "";
	// apply H = f(size) transformation
	const H = f(size);
	for(let y = 0; y < H; y++) {
		for(let x = 0; x < H; x++) {
			// apply (x, y) => (f(x), f(y)) transformation to the sites coordinates
			const sites = plot_sites.filter(s => f(s.x) == x && f(s.y) == y);

			// are we in an "invalid" corner of the isomorphic grid
			const corner = is_corner(x, y, H);

			// print number of sites
			if(sites.length > 0) {
				const c = sites.length.toString(36);
				s += c.length > 1? "*": c;
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

// determines if (x, y) is outside an isomorphic grid of size H
function is_corner(x, y, H) {
	return x + y < H / 2 || x + y > 3 * H / 2 || x - y > H / 2 || y - x > H / 2
}

// export public deployment API
module.exports = {
	print_sites,
	is_corner,
};
