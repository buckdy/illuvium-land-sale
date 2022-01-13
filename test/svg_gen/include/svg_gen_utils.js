const fs = require('fs');
const os = require('os');
const path = require('path');

// reimport some deployment routines from land NFT deployment and aux packs
const {
	land_nft_deploy,
	land_descriptor_deploy,
} = require("../../land_nft/include/deployment_routines");
const {
	generate_land_plot,
	plot_to_metadata,
} = require("../../land_nft/include/land_data_utils.js");
const {
	print_sites,
} = require("../../land_gen/include/isomorphic_grid_utils");

// Saves SVG string to .svg file
function save_svg_to_file(svg_name, svg_data) {
	const tmp_dir = fs.mkdtempSync(path.join(os.tmpdir(), "land-sale"));
	const file_path = path.resolve(tmp_dir, `./${svg_name}.svg`);
	fs.writeFileSync(file_path, svg_data);
	return file_path;
}

// export public utils API
module.exports = {
	land_nft_deploy,
	land_descriptor_deploy,
	generate_land_plot,
	plot_to_metadata,
	save_svg_to_file,
	print_sites,
}
