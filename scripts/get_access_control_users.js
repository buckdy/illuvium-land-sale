/**
 * @dev instantiate an arbitrary contract which contains the AccessControl ABI
 * 
 * @param contract_address address of the contract
 * @param proxy flag indicating if contract is a proxy or not
 * @return Web3's contract instance
 */
function get_access_control_contract(contract_address, proxy=true) {
	// instantiate AccessControl inherited contract
	return new web3.eth.Contract(
		artifacts.require(proxy ? "UpgradeableAccessControl" : "AccessControl").abi,
		contract_address
	);
}

/**
 * @dev get all past events given a contract's web3 instance and filters
 * 
 * @param web3_contract Web3's contract instance
 * @param event_name name of the event
 * @param filter topic filters
 * @param from_block the block from to start fetching the events
 * @param to_block the last block to fetch for events
 * @return array of past Event(s)
 */
function get_contract_events(web3_contract, event_name, filter, from_block, to_block) {
	return web3_contract.getPastEvents(event_name, {
		filter,
		fromBlock: from_block,
		toBlock: to_block,
	});
}

/**
 * @dev get the user to roles mapping for a given AccessControl inherited contract
 * 
 * @param web3_contract Web3's contract instance
 * @return object containing the mapping (user => role)
 */
async function get_user_roles(web3_contract) {
	// get all RoleUpdated events
	const role_updated_events = await get_contract_events(web3_contract, "RoleUpdated");
	
	// get latest role change for each address
	const user_to_role_mapping = {};
	const user_to_role_updated_mapping = {};
	let user;
	for (const event of role_updated_events) {
		user = event.returnValues._to;
		if (event.blockNumber < user_to_role_updated_mapping[user]) continue;
		user_to_role_mapping[user] = event.returnValues._actual;
		user_to_role_updated_mapping[user] = event.blockNumber;
	}
	return user_to_role_mapping;
}

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// get AccessControl inherited contract
	const contract = await get_access_control_contract(process.env.ACCESS_CONTROL_ADDR);

	// print the latest roles for each user
	console.log(await get_user_roles(contract));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});