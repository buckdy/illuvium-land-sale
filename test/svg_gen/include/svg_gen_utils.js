const fs = require('fs');
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
	print_plot
} = require("../../protocol/include/land_data_utils");

// Saves SVG string to .svg file
function save_svg_to_file(svg_name, svg_data) {
	const file_path = path.resolve(__dirname, `../land_svg/${svg_name}.svg`);
	if (!fs.existsSync(path.dirname(file_path))) {
		fs.mkdirSync(path.dirname(file_path));
	}
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
	print_plot,
}
