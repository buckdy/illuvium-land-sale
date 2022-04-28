/**
 * Imports land plot data from the JSON files, saves it in CSV format,
 * builds land plot data Merkle tree from the land data imported, saves the tree
 *
 * Run: npx hardhat run ./import_sale_data.js
 * Inputs:
 * ./data/land_coordinates_base.json
 * ./data/land_sale_1.json
 * Outputs:
 * ./data/land_sale_1.csv
 * ./data/sale_data_1_proofs.txt
 */

// built in node.js libraries in use
const fs = require('fs')
const path = require('path')

// import CSV import/export
const {
	save_sale_data_csv,
	load_sale_data_csv,
	save_sale_data_proofs,
} = require("./include/sale_data_utils");

// define file names
const global_metadata_path = path.join(__dirname, "data/land_coordinates_base.json");
const sale_metadata_path = path.join(__dirname, "data/land_sale_1.json");
const csv_out_path = path.join(__dirname, "data/land_sale_1.csv");
const merkle_tree_out_path = path.join(__dirname, "data/land_sale_1_proofs.txt");

// JSON files containing land plots metadata
console.log("reading JSON data from %o and %o", global_metadata_path, sale_metadata_path);
const global_metadata = JSON.parse(fs.readFileSync(global_metadata_path));
const sale_metadata = JSON.parse(fs.readFileSync(sale_metadata_path));
console.log("%o entries read (global metadata)", Object.keys(global_metadata).length);

// derive an array of land plots from the JSON files
const plots = sale_metadata["1"].map(land => {
	const land_data = global_metadata[land.LandID]
	return {
		tokenId: land.LandID,
		sequenceId: land.SequenceID,
		regionId: land_data.Region,
		x: land_data.X,
		y: land_data.Y,
		tierId: land_data.Tier,
		size: land_data.Size,
	};
}).filter(plot => plot.sequenceId);
console.log("%o land plots read (sale metadata)", plots.length);

// save land data in CSV format
console.log("exporting CSV into %o", csv_out_path);
save_sale_data_csv(plots, csv_out_path);
// save the Merkle tree root and proofs
console.log("generating Merkle tree and saving into %o", merkle_tree_out_path);
save_sale_data_proofs(plots, merkle_tree_out_path);

console.log("CSV and Merkle tree data successfully saved");

/*
token_id,sequence_id,region_id,x,y,tier_id,size
1,0,7,0,0,4,59
2,60,1,1,0,3,79
*/
