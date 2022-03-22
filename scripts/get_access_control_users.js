// get axios to query etherscan API
const axios = require("axios");

// constants to get the FULL_PRIVILEGE_MASK (MAX_UINT256)
const { constants } = require("@openzeppelin/test-helpers");

// JSON interface for the RoleUpdated event
const ROLE_UPDATED_INPUTS = [
	{
		type: "address",
		name: "_by",
		indexed: true,
	},
	{
		type: "address",
		name: "_to",
		indexed: true,
	},
	{
		type: "uint256",
		name: "_requested"
	},
	{
		type: "uint256",
		name: "_actual"
	}
];

/**
 * @dev get all past RoleUpdated logs of a given contract (AccessControl inherited)
 * 
 * @param access_control_contract_addr address of an AccessControl inherited contract
 * @param from_block the block from to start fetching the events
 * @param to_block the last block to fetch for events
 * @return array of past Event(s)
 */
function get_role_updated_logs(access_control_contract_addr, from_block = 0, to_block = "latest") {
	return web3.eth.getPastLogs({
		fromBlock: from_block,
		toBlock: to_block,
		address: access_control_contract_addr,
		topics: [
			"0x5a10526456f5116c0b7b80582c217d666243fd51b6a2d92c8011e601c2462e5f",
			null,
			null,
			null
		]
	})
}

/**
 * @dev retrieve the transactions of an address
 * 
 * @param eth_address ethereum address
 * @param network name of the network
 * @return `eth_address` transactions for the given network
 */
async function retrieve_transactions(eth_address, network) {
	const network_prefix = network !== "mainnet" ? `-${network}` : "";
	const response = await axios.get(
		`https://api${network_prefix}.etherscan.io/api?module=account&action=txlist&address=${eth_address}` + 
		`&startblock=0&endblock=99999999&sort=asc&apikey=${process.env.ETHERSCAN_KEY}`
	);

	return response.data.result;
}

/**
 * @dev get the user to roles mapping for a given AccessControl inherited contract
 * 
 * @param access_control_contract_addr address of an AccessControl inherited contract
 * @param network name of the network
 * @return object containing the mapping (user => role)
 */
async function get_user_roles(access_control_contract_addr, network) {
	// get all RoleUpdated logs
	const role_updated_logs = await get_role_updated_logs(access_control_contract_addr);

	// get contract creation transaction (to retrieve the deployer -- FULL_PRIVILEGE_MASK)
	const contract_creation_tx = (await retrieve_transactions(access_control_contract_addr, network))[0];
	
	// get latest role change for each address
	const user_to_role_mapping = {};
	const user_to_role_updated_mapping = {};
	let decoded_log;
	for (const log of role_updated_logs) {
		decoded_log = web3.eth.abi.decodeLog(
			ROLE_UPDATED_INPUTS,
			log.data,
			log.topics.slice(1)
		);
		if (log.blockNumber < user_to_role_updated_mapping[decoded_log._to]) continue;
		user_to_role_mapping[decoded_log._to] = decoded_log._actual;
		user_to_role_updated_mapping[decoded_log._to] = log.blockNumber;
	}

	if (!(contract_creation_tx.from in user_to_role_mapping)) {
		user_to_role_mapping[contract_creation_tx.from] = constants.MAX_UINT256.toString();
	}

	return user_to_role_mapping;
}

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// print the latest roles for each user
	console.log(await get_user_roles(process.env.ACCESS_CONTROL_ADDR, network.name));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});