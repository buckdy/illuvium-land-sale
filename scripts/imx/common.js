// using IMX client and token type
const {ImmutableXClient, MintableERC721TokenType, ERC721TokenType} = require("@imtbl/imx-sdk");

// using axios for IMX API requests
const axios = require("axios");

// LandLib.sol: JS implementation
const {
	pack,
	unpack,
} = require("../../test/land_gen/include/land_lib");

// config file contains known deployed token addresses, IMX settings
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev Configure Infura provider based on the network
 *
 * @param network the network name
 * @return instance of InfuraProvider
 */
function get_provider(network) {
	const {InfuraProvider} = require("@ethersproject/providers");
	return new InfuraProvider(network, process.env.INFURA_KEY);
}

/**
 * @dev Get Websocket RPC provider given configuration
 *
 * @param endpoint the provider endpoint to connect
 * @return instance of web3 WebsocketProvider
 */
function get_provider_websocket(endpoint) {
	return new web3.providers.WebsocketProvider(endpoint);
}

/**
 * @dev Get wallet from mnemonic
 *
 * @param network name of the network
 * @param mnemonic mnemonic to generate the HDWallet from
 * @param n address index as defined in BIP-44 spec
 * @return ethers wallet instance
 */
function get_wallet_from_mnemonic(network, mnemonic, n = 0) {
	const {Wallet} = require("@ethersproject/wallet");

	const provider = get_provider(network);

	return Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${n}`).connect(provider);
}

/**
 * @dev Gets wallet from provided mnemonic provided for the network
 *
 * @param network name of the network
 * @param n address index as defined in BIP-44 spec
 * @return ethersproject wallet instance
 */
function get_wallet(network, n = 0) {
	const mnemonic = network === "ropsten"? process.env.MNEMONIC3: process.env.MNEMONIC1;

	return get_wallet_from_mnemonic(network, mnemonic, n);
}

/**
 * @dev Gets an instance of the IMX client given configuration for the network
 *
 * @param wallet ethersproject wallet instance
 * @param imx_client_config configuration object for ImmutableXClient
 * @return Instance of IMX client
 */
function get_imx_client_from_wallet(wallet, imx_client_config) {
	return ImmutableXClient.build({
		...imx_client_config,
		signer: wallet
	});
}

/**
 * @dev Gets an instance of the IMX client given configuration for the network
 *
 * @param network name of the network ("ropsten" or "mainnet")
 * @return Instance of IMX client
 */
function get_imx_client(network) {
	const config = Config(network);

	return get_imx_client_from_wallet(get_wallet(network), config.imx_client_config);
}

/**
 * @dev Instantiate the LandSale contract
 *
 * @param land_sale_address L1 address of LandSale
 * @param provider_endpoint endpoint to connect to web3 provider
 * @return LandSale instance
 */
function get_land_sale_contract(land_sale_address, provider_endpoint) {
	// Get required ABIs
	const land_sale_abi = artifacts.require("LandSale").abi;

	let land_sale = new web3.eth.Contract(
		land_sale_abi,
		land_sale_address
	);
	land_sale.setProvider(get_provider_websocket(provider_endpoint));
	return land_sale;
}

/**
 * @dev Instantiate the LandERC721 contract
 *
 * @param land_erc721_address L1 address of LandERC721
 * @param provider_endpoint endpoint to connect to web3 provider
 * @return LandERC721 instance
 */
function get_land_erc721_contract(land_erc721_address, provider_endpoint) {
	// Get required ABIs
	const land_erc721_abi = artifacts.require("LandERC721").abi;

	const land_erc721 = new web3.eth.Contract(
		land_erc721_abi,
		land_erc721_address
	);
	land_erc721.setProvider(get_provider_websocket(provider_endpoint));
	return land_erc721;
}

/**
 * @dev Packs plotStore and turn it into a string representation of uint256 in decimal format
 *
 * @param plot_store PlotStore object/structure
 * @return decimal string representation of packed data
 */
function get_blueprint(plot_store) {
	return pack(plot_store).toString(10);
}

/**
 * @dev Unpacks blueprint into a PlotStore object
 *
 * @param blueprint packed PlotStore object/structure into a string of uint256 in decimal format
 * @return PlotStore object/structure
 */
function get_plot_store(blueprint) {
	return unpack(web3.utils.toBN(blueprint));
}

/**
 * @dev Mints an NFT on L2 (IMX)
 *
 * @param client ImmutableXClient -- should be the owner of the assetAddress contract
 * @param asset_address address of the asset to mint
 * @param to address of the owner of the address to be minted
 * @param token_id ID of the token
 * @param blueprint token metadata
 * @return the mint result metadata or null if minting fails
 */
async function mint_l2(client, asset_address, to, token_id, blueprint) {
	// a token to mint - plotStorePack should be a string representation of uint256 in decimal format
	const token = {
		id: token_id.toString(),
		// note: blueprint cannot be empty
		blueprint, // This will come in the mintingBlob to the contract mintFor function as {tokenId}:{plotStorePack}
	};

	log.info("Minting on L2...");
	const mint_results = await client.mintV2([
		{
			users: [
				{
					etherKey: to.toLowerCase(),
					tokens: [token]
				}
			],
			contractAddress: asset_address.toLowerCase()
		}
	]);
	log.info(`Minting of tokenId ${token_id} of collection ${asset_address.toLowerCase()} successful on L2`);

	return mint_results.results[0]
}

/**
 * @dev Burn token with given ID using and ImmutableXClient (with token owner as signer)
 *
 * @param client ImmutableXClient with the token owner as signers
 * @param asset_address address of the asset to burn the token from
 * @param token_id ID the token
 * @return deleted token metadata
 */
async function burn(client, asset_address, token_id) {
	const token = {
		type: ERC721TokenType.ERC721,
		data: {
			tokenId: token_id.toString(),
			tokenAddress: asset_address.toLowerCase(),
		},
	};

	const deleted_token = await client.burn({
		quantity: "1",
		sender: client.address.toLowerCase(),
		token,
	});
	log.info(`Token ID ${token_id} of collection contract ${asset_address} successfully deleted.`);

	return deleted_token;
}

/**
 * @dev Get PlotBoughtL2 events emitted from LandSale contract
 *
 * @param land_sale_address L1 address of LandSale
 * @param provider_endpoint endpoint to connect to web3 provider
 * @param filter event filters
 * @param from_block get events from the given block number
 * @param to_block get events until the given block number
 * @return events
 */
async function get_plot_bought_l2_events(land_sale_address, provider_endpoint, filter, from_block, to_block) {
	// Get landSale contract instance
	const land_sale = get_land_sale_contract(land_sale_address, provider_endpoint);

	// Get past PlotBoughtL2 events
	const plot_bought_l2_objs = await land_sale.getPastEvents("PlotBoughtL2", {
		filter,
		fromBlock: from_block ?? 0,
		toBlock: to_block ?? "latest",
	});

	// Populate return array with formatted event topics
	const events_metadata = [];
	plot_bought_l2_objs.forEach(plot_bought_l2 => {
		const return_values = plot_bought_l2.returnValues
		events_metadata.push({
			block_number: plot_bought_l2.blockNumber,
			buyer: return_values._by,
			token_id: returnValues._tokenId,
			sequenceId: return_values._sequenceId,
			plot_packed: return_values._plotPacked.toString(),
			plot: return_values._plot
		});
	});

	return events_metadata;
}

/**
 * @dev Prepare asset for withdrawal
 *
 * @param client ImmutableXClient with token owner as signer
 * @param asset_address address of the asset to withdraw
 * @param token_id ID of the token
 * @return withdrawal metadata
 */
async function prepare_withdraw(client, asset_address, token_id) {
	const withdrawal_data = await client.prepareWithdrawal({
		user: client.address.toLowerCase(),
		quantity: "1", // Always one
		token: {
			type: ERC721TokenType.ERC721,
			data: {
				token_id,
				tokenAddress: asset_address.toLowerCase()
			}
		}
	});

	if(withdrawal_data.includes("Error")) {
		throw withdrawal_data;
	}

	log.info(`Withdrawal process started for token ID ${token_id} of collection contract ${asset_address.toLowerCase()}`);

	return withdrawal_data;
}

/**
 * @dev Complete withdrawal, asset status needs to be "withdrawable"
 *
 * @param client ImmutableXClient with token owner as signer
 * @param asset_address address of the asset to withdraw
 * @param token_id ID of the token
 * @returns withdrawal completion metadata
 */
async function complete_withdraw(client, asset_address, token_id) {
	const completed_withdrawal = await client.completeWithdrawal({
		starkPublicKey: client.starkPublicKey.toLowerCase(),
		token: {
			type: ERC721TokenType.ERC721,
			data: {
				tokenId: token_id,
				tokenAddress: asset_address.toLowerCase()
			}
		}
	});
	log.info(`Token ID ${token_id} of collection contract ${asset_address.toLowerCase()} successfully withdrawn.`);

	if(completed_withdrawal.includes("Error")) {
		throw completed_withdrawal;
	}

	return completed_withdrawal;
}

/**
 * @dev Check if an asset of given ID exists for the configured collection
 *
 * @param client ImmutableXClient client instance
 * @param asset_address address of the asset
 * @param token_id ID of the token
 * @return token if it exists or undefined
 */
async function get_asset(client, asset_address, token_id) {
	let token = null;
	try {
		token = await client.getAsset({
			address: asset_address.toLowerCase(),
			id: token_id.toString()
		});
		log.info(`Token with ID ${token_id} found for address ${asset_address.toLowerCase()}`);
	}
	catch(error) {
		log.info(`Token with ID ${token_id} does not exist for address ${asset_address.toLowerCase()}`);
	}
	return token;
}

/**
 * @dev Get L2 mint metadata
 *
 * @param asset_address address of the asset on L1
 * @param token_id ID of the token
 * @return object containing `token_id`, `client_token_id` and `blueprint`
 */
async function get_mint(asset_address, token_id) {
	const response = await axios.get(
		`https://api.ropsten.x.immutable.com/v1/mintable-token/${asset_address}/${token_id}`);

	if(response.status !== 200) {
		return null;
	}
	return response.data;
}

/**
 * @dev Gets a number or all the assets for the configured collection
 *
 * @param client ImmutableXClient client instance
 * @param asset_address address of the asset
 * @param loop_n_times number of times to request for another batch of assets
 * @return assets found in L2
 */
async function get_all_assets(client, asset_address, loop_n_times) {
	let assets = [];
	let response;
	let cursor;

	do {
		response = await client.getAssets({
			collection: asset_address
		});
		assets = assets.concat(response.result);
		cursor = response.cursor;
		console.log(assets);
	}
	while(cursor && (!loop_n_times || loop_n_times-- > 1))

	if(assets.length > 0) {
		console.log(`Assets found for address ${asset_address}`);
	}
	else {
		console.log(`No assets found for address ${asset_address}`);
	}
	return assets;
}

/**
 * @dev Get all trades from L2
 *
 * @param asset_address address of the asset
 * @param token_id asset token ID
 * @param loop_n_times number of times to request for another batch of trades
 * @param min_timestamp minimum timestamp to search for trades
 * @param max_timestamp maximum timestamp to search for trades
 * @param order_by field to order by
 * @param page_size page size for each batch (number of trades returned will be min(totalNumberOfTrades, loopNTimes * pageSize))
 * @param direction sort order
 * @return trades for provided asset
 */
async function get_all_trades(
	asset_address,
	token_id,
	loop_n_times,
	min_timestamp,
	max_timestamp,
	order_by = "timestamps",
	page_size = 1,
	direction = "desc"
) {
	let trades = [];
	let response;
	let cursor;

	do {
		response = await axios.get("https://api.ropsten.x.immutable.com/v1/trades", {
			params: {
				party_a_token_type: ERC721TokenType.ERC721,
				party_a_token_address: asset_address,
				party_a_token_id: token_id,
				min_timestamp,
				max_timestamp,
				page_size,
				cursor,
				order_by,
				direction
			}
		});
		if(response.status !== 200) {
			return null;
		}
		cursor = response.data.cursor;
		trades = trades.concat(response.data.result);
	}
	while(cursor && (!loop_n_times || loop_n_times-- > 1));

	return trades;
}

/**
 * @dev Get all trades from L2
 *
 * @param asset_address address of the asset
 * @param token_id asset token ID
 * @param loop_n_times number of times to request for another batch of trades
 * @param min_timestamp minimum timestamp to search for trades
 * @param max_timestamp maximum timestamp to search for trades
 * @param order_by field to order by
 * @param page_size page size for each batch (number of trades returned will be min(totalNumberOfTrades, loopNTimes * pageSize))
 * @param direction sort order
 * @return trades for provided asset
 */
async function get_all_transfers(
	asset_address,
	token_id,
	loop_n_times,
	min_timestamp,
	max_timestamp,
	order_by = "timestamps",
	page_size = 1,
	direction = "desc"
) {
	let transfers = [];
	let response;
	let cursor;

	do {
		response = await axios.get("https://api.ropsten.x.immutable.com/v1/transfers", {
			token_type: ERC721TokenType.ERC721,
			token_id: token_id,
			token_address: asset_address,
			min_timestamp,
			max_timestamp,
			page_size,
			cursor,
			order_by,
			direction
		});
		cursor = response.data.cursor;
		transfers = transfers.concat(response.data.result);
	}
	while(cursor && (!loop_n_times || loop_n_times-- > 1));

	return transfers;
}

/**
 * @dev Verify event's metadata against the ones on L2
 *
 * @param land_sale_address L1 address of LandSale
 * @param provider_endpoint endpoint to connect to web3 provider)
 * @param client ImmutableXClient client instance
 * @param asset_address address of the asset
 * @param filter event filters
 * @param from_block get events from the given block number
 * @param to_block get events until the given block number
 * @return differences found between events and L2
 */
async function verify(land_sale_address, provider_endpoint, client, asset_address, filter, from_block, to_block) {
	// Get PlotBoughtL2 events to match information in L1/L2
	const plot_bought_l2_events = await get_plot_bought_l2_events(
		land_sale_address, provider_endpoint, filter, from_block, to_block);

	// Get all assets
	const assets_l2 = await get_all_assets(client, asset_address);

	// Mapping tokenId => assetL2
	const assets_l2_mapping = {};
	assets_l2.forEach(asset => {
		assets_l2_mapping[asset.token_id] = asset.metadata;
	});

	// Check metadata
	let asset_diff = [];
	let token_id;
	for(const event of plot_bought_l2_events) {
		token_id = typeof event.token_id === "string"? event.token_id: event.token_id.toString();
		if(event.plot_packed !== assets_l2_mapping[token_id]) {
			asset_diff.push({
				token_id,
				event: metadata,
				l2: assets_l2_mapping[token_id]?? null,
			});
		}
	}

	if(asset_diff.length !== 0) {
		log.info("Difference found between event and L2 metadata!");
	}
	else {
		log.info("Metadata on the events and L2 are fully consistent!");
	}

	return asset_diff;
}

/**
 * @dev Get snapshot of latest land owner on L1
 *
 * @param land_erc721_address L1 address of LandERC721
 * @param provider_endpoint endpoint to connect to web3 provider
 * @param token_id ID of the token
 * @param from_block the block from which search for the snapshot
 * @param to_block the block to which search for the snapshot
 * @return latest owner on L1 for the given interval
 */
async function get_owner_of_snapshot_l1(land_erc721_address, provider_endpoint, token_id, from_block, to_block) {
	// Get landERC721 contract instance
	const land_erc721 = get_land_erc721_contract(land_erc721_address, provider_endpoint);

	// Get past Transfer event from the ERC721 asset contract
	const transfer_events = await land_erc721.getPastEvents("Transfer", {
		filter: {token_id},
		fromBlock: from_block,
		toBlock: to_block,
	});

	// Return empty array if no past event have been found
	if(transfer_events.length === 0) {
		return null;
	}

	// Sort and get the last event (with biggest blockNumber)
	const last_transfer_event = transfer_events
		.sort((event_left, event_right) => event_left.blockNumber - event_right.blockNumber)
		.pop();

	// Return owner after last Transfer event
	return last_transfer_event.returnValues.to;

}

/**
 * @dev Get order given `orderId`
 *
 * @param order_id ID of the order
 * @return order metadata
 */
async function get_order(order_id) {
	// Get the order given order ID
	const response = await axios.get(`https://api.ropsten.x.immutable.com/v1/orders/${order_id}`);

	// Return null if some error occurred for the request
	if(response.status !== 200) {
		return null;
	}

	// Return response data
	return response.data;
}

/**
 * @dev Get snapshot of latest token owner on L2
 *
 * @param asset_address L1 address of the asset
 * @param token_id ID of the token
 * @param from_block the block from which search for the snapshot
 * @param to_block the block to which search for the snapshot
 * @return latest owner on L2 for the given interval
 */
async function get_owner_of_snapshot_l2(asset_address, token_id, from_block, to_block) {
	// Get timestamp from blocks
	const min_timestamp = from_block === undefined
		? undefined: web3.eth.getBlock(from_block).timestamp.toString();
	const max_timestamp = to_block === undefined
		? undefined: web3.eth.getBlock(to_block).timestamp.toString();

	// Get latest trade
	let latest_trade = (await get_all_trades(asset_address, token_id, 1, min_timestamp, max_timestamp)).pop();
	latest_trade = latest_trade !== undefined
		? {timestamp: latest_trade.timestamp, receiver: await get_order(latest_trade.b.order_id).user}: {timestamp: 0};

	// Get latest transfer
	let latest_transfer = (await get_all_transfers(asset_address, token_id, 1, min_timestamp, max_timestamp)).pop();
	latest_transfer = latest_transfer ?? {timestamp: 0};

	// Return receiver of latest transfer if it's timestamp is greater or equal to the one of the latest trade
	if(latest_transfer.timestamp >= latest_trade.timestamp) {
		return latest_transfer.receiver ?? null;
	}

	// Othewise, return latest trade receiver
	return latest_trade.receiver ?? null;
}

/**
 * @dev Rollback and re-mint asset to a new ERC721 collection on L2
 *
 * @param land_sale_address L1 address of LandSale
 * @param provider_endpoint endpoint to connect to web3 provider)
 * @param client ImmutableXClient instance
 * @param from_asset_address the current LandERC721 address
 * @param to_asset_address the LandERC721 address to migrate the tokens
 * @param from_block the block from to get the snapshots (PlotBought events)
 * @param to_block the end block to get the snapshots (PlotBought events)
 */
async function rollback(land_sale_address, provider_endpoint, client, from_asset_address, to_asset_address, from_block, to_block) {
	// Get past PlotBoughtL2 events to a certain block
	const past_events = await get_plot_bought_l2_events(land_sale_address, provider_endpoint, from_block, to_block);

	// Loop through past events and remint on L2 for new contract
	let asset_l2;
	let owner
	for(const event of past_events) {
		// Retrieve asset detail on L2
		asset_l2 = await get_asset(client, from_asset_address, event.token_id);

		// If assetL2 status is 'imx' take owner from L2, otherwise take from L1 snapshot
		if(asset_l2.status === "imx") {
			// Get owner on L2 (IMX) snapshot
			owner = await get_owner_of_snapshot_l2(asset_address, token_id, from_block, to_block);

			log.debug(`Taking ownership of token ${token_id} from L2`);
		}
		else {
			// get owner on L1 (LandERC721) snapshot
			owner = await get_owner_of_snapshot_l1(from_asset_address, provider_endpoint, event.token_id, from_block, to_block);

			log.debug(`Taking ownership of token ${token_id} from L1`);
		}

		if(owner === null) {
			log.error(`Failed to retrieve owner for token ID ${event.token_id}`);
			throw "Failed to retried owner";
		}

		// Re-mint asset with correct ownership (L1 or L2)
		log.info(`Migrated token ${token_id} from ${from_asset_address} to ${to_asset_address} successful!`);
		await mint_l2(client, to_asset_address, owner, token_id, event.plot_packed);

		log.info(`Migration from ${from_asset_address} to ${to_asset_address} completed!`);
	}
}

/**
 * @dev Deposit asset from L1 into L2 (IMX)
 *
 * @param client ImmutableXClient client instance
 * @param asset_address address of the asset
 * @param token_id token ID to deposit
 * @return deposit operation metadata
 */
async function deposit(client, asset_address, token_id) {
	// Check if asset is already on IMX
	const asset = await get_asset(client, asset_address, token_id);
	if(asset.status === "imx") {
		throw "Asset already on L2";
	}
	// Make deposit on L2 and get return data
	return client.deposit({
		quantity: "1",
		user: client.address.toLowerCase(),
		token: {
			type: ERC721TokenType.ERC721,
			data: {
				tokenAddress: asset_address.toLowerCase(),
				tokenId: token_id,
			}
		}
	});
}

/**
 * @dev update an existing collection's metadata
 * 
 * @dev needs to be executed by the collection's owner
 * 
 * @dev if a new ERC721 address is provided, the owner of the contract needs to be the collection's owner
 * 
 * @param client ImmutableXClient client instance
 * @param asset_address address of the asset
 * @param new_collection_metadata object containing the fields to be updated, leave undefined to keep the former metadata
 * @return update collection's API response
 */
async function update_collection_metadata(client, asset_address, new_collection_metadata) {
	// Update collection metadata
	const update_collection_result = await client.updateCollection(
		asset_address.toLowerCase(),
		{
			address: new_collection_metadata.new_asset_address?.toLowerCase(),
			description: new_collection_metadata.description,
			icon_url: new_collection_metadata.icon_url,
			metadata_api_url: new_collection_metadata.metadata_api_url,
			collection_image_url: new_collection_metadata.collection_image_url
		}
	);

	log.info("Collection metadata successfully updated to:");
	log.info(JSON.stringify(new_collection_metadata));

	return update_collection_result;
}

// export public module API
module.exports = {
	get_imx_client_from_wallet,
	get_imx_client,
	get_wallet_from_mnemonic,
	get_wallet,
	get_land_sale_contract,
	get_land_erc721_contract,
	get_plot_bought_l2_events,
	get_blueprint,
	get_plot_store,
	mint_l2,
	burn,
	prepare_withdraw,
	complete_withdraw,
	get_asset,
	get_all_assets,
	get_all_trades,
	get_all_transfers,
	get_mint,
	rollback,
	verify,
	deposit,
	update_collection_metadata,
}
