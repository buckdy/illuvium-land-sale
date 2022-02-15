// functions used in deployment scripts (deploy folder) need to be stored in
// a separate place (folder) otherwise hardhat-deploy plugin tries to pick them up
// and execute as part of the deployment routines

// BN utils
const {
	toBN,
	print_amt,
} = require("../test/include/bn_utils");

// prints generic NFT info (name, symbol, etc.) + AccessControl (features, deployer role)
async function print_land_nft_acl_details(a0, abi, address) {
	const web3_contract = new web3.eth.Contract(abi, address);
	const name = await web3_contract.methods.name().call();
	const symbol = await web3_contract.methods.symbol().call();
	const totalSupply = parseInt(await web3_contract.methods.totalSupply().call());
	const features = toBN(await web3_contract.methods.features().call());
	const r0 = toBN(await web3_contract.methods.userRoles(a0).call());
	console.log("successfully connected to LandERC721 at %o", address);
	console.table([
		{"key": "Name", "value": name},
		{"key": "Symbol", "value": symbol},
		{"key": "Total Supply", "value": totalSupply},
		{"key": "Features", "value": features.toString(2)}, // 2
		{"key": "Deployer Role", "value": r0.toString(16)}, // 16
	]);
	return {features, r0};
}

// prints generic ERC20 info (name, symbol, etc.)
async function print_sIlv_erc20_details(a0, abi, address) {
	const web3_contract = new web3.eth.Contract(abi, address);
	const name = await web3_contract.methods.name().call();
	const symbol = await web3_contract.methods.symbol().call();
	const totalSupply = await web3_contract.methods.totalSupply().call();
	console.log("successfully connected to sILV ERC20 at %o", address);
	console.table([
		{"key": "Name", "value": name},
		{"key": "Symbol", "value": symbol},
		{"key": "Total Supply", "value": print_amt(totalSupply)},
	]);
}

// prints few conversion rates extracted from LandSaleOracle
async function print_oracle_details(a0, abi, address) {
	const web3_contract = new web3.eth.Contract(abi, address);
	const one = await web3_contract.methods.ethToIlv(web3.utils.toWei("1", "ether")).call();
	const five = await web3_contract.methods.ethToIlv(web3.utils.toWei("5", "ether")).call();
	const ten = await web3_contract.methods.ethToIlv(web3.utils.toWei("10", "ether")).call();
	const fifty = await web3_contract.methods.ethToIlv(web3.utils.toWei("50", "ether")).call();
	console.log("successfully connected to Land Sale Oracle at %o", address);
	console.table([
		{"key": "1 ETH to sILV", "value": print_amt(one)},
		{"key": "5 ETH to sILV", "value": print_amt(five)},
		{"key": "10 ETH to sILV", "value": print_amt(ten)},
		{"key": "50 ETH to sILV", "value": print_amt(fifty)},
	]);
}

// prints Land Sale info + AccessControl (features, deployer role)
async function print_land_sale_acl_details(a0, abi, address) {
	const web3_contract = new web3.eth.Contract(abi, address);
	const targetNftContract = await web3_contract.methods.targetNftContract().call();
	const sIlvContract = await web3_contract.methods.sIlvContract().call();
	const priceOracle = await web3_contract.methods.priceOracle().call();
	const root = await web3_contract.methods.root().call();
	const saleStart = parseInt(await web3_contract.methods.saleStart().call());
	const saleEnd = parseInt(await web3_contract.methods.saleEnd().call());
	const halvingTime = parseInt(await web3_contract.methods.halvingTime().call());
	const timeFlowQuantum = parseInt(await web3_contract.methods.timeFlowQuantum().call());
	const seqDuration = parseInt(await web3_contract.methods.seqDuration().call());
	const seqOffset = parseInt(await web3_contract.methods.seqOffset().call());
	const startPrices = (await web3_contract.methods.getStartPrices().call());
	const beneficiary = await web3_contract.methods.beneficiary().call();
	const isActive = await web3_contract.methods.isActive().call();
	const features = toBN(await web3_contract.methods.features().call());
	const r0 = toBN(await web3_contract.methods.userRoles(a0).call());
	console.table([
		{"key": "Target NFT", "value": targetNftContract},
		{"key": "sILV", "value": sIlvContract},
		{"key": "Sale Oracle", "value": priceOracle},
		{"key": "Merkle Root", "value": root},
		{"key": "Sale Start", "value": saleStart},
		{"key": "Sale End", "value": saleEnd},
		{"key": "Halving Time", "value": halvingTime},
		{"key": "Price Update Interval", "value": timeFlowQuantum},
		{"key": "Sequence Duration", "value": seqDuration},
		{"key": "Sequence Offset", "value": seqOffset},
		{"key": "Start Prices", "value": startPrices.map(price => print_amt(price)).join(", ")},
		{"key": "Beneficiary", "value": beneficiary},
		{"key": "Is Active", "value": isActive},
		{"key": "Features", "value": features.toString(2)}, // 2
		{"key": "Deployer Role", "value": r0.toString(16)}, // 16
	]);
	return {features, r0};
}

// export public module API
module.exports = {
	print_land_nft_acl_details,
	print_sIlv_erc20_details,
	print_oracle_details,
	print_land_sale_acl_details,
}
