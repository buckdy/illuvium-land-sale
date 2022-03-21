// import necessary function from imx module
const {
} = require("../imx/common");

// get LandSale roles for wallet validation
const {
	ROLE_SALE_MANAGER,
} = require("../include/features_roles");

/**
 * @dev Instantiate the LandSale contract
 *
 * @param land_sale_address L1 address of LandSale
 * @return LandSale instance
 */
 function get_land_sale_contract(land_sale_address) {
	// Get required ABIs
	const land_sale_abi = artifacts.require("LandSale").abi;

	let land_sale = new web3.eth.Contract(
		land_sale_abi,
		land_sale_address
	);
	return land_sale;
}

// export public module API
module.exports = {
	get_land_sale_contract,
	ROLE_SALE_MANAGER,
}