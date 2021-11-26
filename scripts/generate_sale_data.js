// import land generator
const {
	generate_land,
} = require("../test/protocol/include/land_data_utils");

// import CSV import/export
const {
	save_sale_data_csv,
	load_sale_data_csv,
	save_sale_data_proofs,
} = require("./include/sale_data_utils");

// define sale buckets (number of items on sale) to generate
const buckets = [2, 20, 200, 2_000, 20_000];

// generate the data and save it into the files
buckets.forEach((bucket, i) => {
	if(bucket > 8_000) {
		console.log("generating bucket %o of %o (size %o)", i + 1, buckets.length, bucket);
	}

	// generate the data and save it
	const {plots} = generate_land(bucket);
	save_sale_data_csv(plots, `./sale_data_${bucket}.csv`);

	// verify saved correctly
	const saved_plots = load_sale_data_csv(`./sale_data_${bucket}.csv`);
	assert.deepEqual(saved_plots, plots, "saved data doesn't match generated!");

	// save the Merkle tree root and proofs
	save_sale_data_proofs(plots, `./sale_data_${bucket}_proofs.txt`);

	console.log("bucket %o of %o (size %o) generation complete", i + 1, buckets.length, bucket);
});
