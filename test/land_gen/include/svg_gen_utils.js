const fs = require("fs");
const path = require("path");

// Saves SVG string to .svg file
function save_svg_to_file(filename_without_suffix, svg_string) {
    fs.writeFileSync(
        path.resolve(__dirname, `../land_svg/${filename_without_suffix}.svg`), 
        svg_string
    );
}

module.exports = {
    save_svg_to_file
}