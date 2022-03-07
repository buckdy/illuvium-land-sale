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
function getProvider(network) {
	const {InfuraProvider} = require("@ethersproject/providers");
	return new InfuraProvider(network, process.env.INFURA_KEY);
}

/**
 * @dev Get Websocket RPC provider given configuration
 *
 * @param network the network name
 * @return instance of web3 WebsocketProvider
 */
function getProviderWebsocket(network) {
	const config = Config(network);
	return new web3.providers.WebsocketProvider(config.provider);
}
/**
 * @dev Get wallet from mnemonic
 * 
 * @param network name of the network
 * @param mnemonic mnemonic to generate the HDWallet from
 * @param n address index as defined in BIP-44 spec
 * @return ethers wallet instance
 */
function getWalletFromMnemonic(network, mnemonic, n = 0) {
	const {Wallet} = require("@ethersproject/wallet");

	const provider = getProvider(network);

	return Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${n}`).connect(provider);
}

/**
 * @dev Gets wallet from provided mnemonic provided for the network
 *
 * @param network name of the network
 * @param n address index as defined in BIP-44 spec
 * @return ethersproject wallet instance
 */
function getWallet(network, n = 0) {
	const mnemonic = network === "ropsten"? process.env.MNEMONIC3: process.env.MNEMONIC1;

	return getWalletFromMnemonic(network, mnemonic, n);
}

/**
 * @dev Gets an instance of the IMX client given configuration for the network
 *
 * @param wallet ethersproject wallet instance
 * @param IMXClientConfig configuration object for ImmutableXClient
 * @return Instance of IMX client
 */
function getImmutableXClientFromWallet(wallet, IMXClientConfig) {
	return ImmutableXClient.build({
		...IMXClientConfig,
		signer: wallet
	});
}

/**
 * @dev Gets an instance of the IMX client given configuration for the network
 *
 * @param network name of the network ("ropsten" or "mainnet")
 * @return Instance of IMX client
 */
function getImmutableXClient(network) {
	const config = Config(network);

	return getImmutableXClientFromWallet(getWallet(network), config.IMXClientConfig);
}

/**
 * @dev Instantiate the LandSale contract
 *
 * @param network name of the network ("ropsten" or "mainnet")
 * @return LandSale instance
 */
function getLandSaleContract(network) {
	const config = Config(network);

// Get required ABIs
	const landSaleAbi = artifacts.require("LandSale").abi;

	let landSale = new web3.eth.Contract(
		landSaleAbi,
		config.landSale
	);
	landSale.setProvider(getProviderWebsocket(network));
	return landSale;
}

/**
 * @dev Instantiate the LandERC721 contract
 *
 * @param network name of the network ("ropsten" or "mainnet")
 * @param address the address of the contract in the respective network
 * @return LandERC721 instance
 */
function getLandERC721Contract(network, address) {
// Get required ABIs
	const landERC721Abi = artifacts.require("LandERC721").abi;

	const landERC721 = new web3.eth.Contract(
		landERC721Abi,
		address
	);
	landERC721.setProvider(getProviderWebsocket(network));
	return landERC721;
}

/**
 * @dev Packs plotStore and turn it into a string representation of uint256 in decimal format
 *
 * @param plotStore PlotStore object/structure
 * @return decimal string representation of packed data
 */
function getBlueprint(plotStore) {
	return pack(plotStore).toString(10);
}

/**
 * @dev Unpacks blueprint into a PlotStore object
 * 
 * @param blueprint packed PlotStore object/structure into a string of uint256 in decimal format
 * @return PlotStore object/structure
 */
function getPlotStore(blueprint) {
	return unpack(web3.utils.toBN(blueprint));
}

/**
 * @dev Mints an NFT on L2 (IMX)
 *
 * @param client ImmutableXClient -- should be the owner of the assetAddress contract
 * @param assetAddress address of the asset to mint
 * @param to address of the owner of the address to be minted
 * @param tokenId ID of the token
 * @param blueprint token metadata
 * @return the mint result metadata or null if minting fails
 */
 async function mint_l2(client, assetAddress, to, tokenId, blueprint) {
	// a token to mint - plotStorePack should be a string representation of uint256 in decimal format
	const token = {
		id: tokenId.toString(),
		// note: blueprint cannot be empty
		blueprint, // This will come in the mintingBlob to the contract mintFor function as {tokenId}:{plotStorePack}
	};

	log.info("Minting on L2...");
	const mintResults = await client.mintV2([
		{
			users: [
				{
					etherKey: to.toLowerCase(),
					tokens: [token]
				}
			],
			contractAddress: assetAddress.toLowerCase()
		}
	]);
	log.info(`Minting of tokenId ${tokenId} of collection ${assetAddress.toLowerCase()} successful on L2`);

	return mintResults.results[0]
}

/**
 * @dev Burn token with given ID using and ImmutableXClient (with token owner as signer)
 * 
 * @param client ImmutableXClient with the token owner as signers
 * @param assetAddress address of the asset to burn the token from
 * @param tokenId ID the token 
 * @return deleted token metadata
 */
async function burn(client, assetAddress, tokenId) {
	const token = {
		type: ERC721TokenType.ERC721,
		data: {
			tokenId: tokenId.toString(),
			tokenAddress: assetAddress.toLowerCase(),
		},
	};

	const deletedToken = await client.burn({
		quantity: "1",
		sender: client.address.toLowerCase(),
		token,
	});
	log.info(`Token ID ${tokenId} of collection contract ${config.landERC721} successfully deleted.`);

	return deletedToken;
}

/**
 * @dev Get PlotBought events emitted from LandSale contract
 * 
 * @param network name of the network ("ropsten" or "mainnet")
 * @param filter event filters
 * @param fromBlock get events from the given block number
 * @param toBlock get events until the given block number
 * @return events
 */
async function getPlotBoughtEvents(network, filter, fromBlock, toBlock) {
	// Get landSale contract instance
	const landSale = getLandSaleContract(network);

	// Get past PlotBought events
	const plotBoughtObjs = await landSale.getPastEvents("PlotBought", {
		filter,
		fromBlock: fromBlock?? 0,
		toBlock: toBlock?? "latest",
	});

	// Populate return array with formatted event topics
	const eventsMetadata = [];
	plotBoughtObjs.forEach(plotBought => {
		const returnValues = plotBought.returnValues
		eventsMetadata.push({
			blockNumber: plotBought.blockNumber,
			buyer: returnValues._by,
			tokenId: returnValues._tokenId,
			sequenceId: returnValues._sequenceId,
			plot: returnValues._plot
		});
	});

	return eventsMetadata;
}

/**
 * @dev Prepare asset for withdrawal
 *
 * @param client ImmutableXClient with token owner as signer
 * @param assetAddress address of the asset to withdraw
 * @param tokenId ID of the token
 * @return withdrawal metadata
 */
 async function prepareWithdraw(client, assetAddress, tokenId) {
	const withdrawalData = await client.prepareWithdrawal({
		user: client.address.toLowerCase(),
		quantity: "1", // Always one
		token: {
			type: ERC721TokenType.ERC721,
			data: {
				tokenId,
				tokenAddress: assetAddress.toLowerCase()
			}
		}
	});

	if (withdrawalData.includes("Error")) {
		throw withdrawalData;
	}

	log.info(`Withdrawal process started for token ID ${tokenId} of collection contract ${assetAddress.toLowerCase()}`);

	return withdrawalData;
}

/**
 * @dev Complete withdrawal, asset status needs to be "withdrawable"
 *
 * @param client ImmutableXClient with token owner as signer
 * @param assetAddress address of the asset to withdraw
 * @param tokenId ID of the token
 * @returns withdrawal completion metadata
 */
async function completeWithdraw(client, assetAddress, tokenId) {
	const completedWithdrawal = await client.completeWithdrawal({
		starkPublicKey: client.starkPublicKey.toLowerCase(),
		token: {
			type: ERC721TokenType.ERC721,
			data: {
				tokenId,
				tokenAddress: assetAddress.toLowerCase()
			}
		}
	});
	log.info(`Token ID ${tokenId} of collection contract ${assetAddress.toLowerCase()} successfully withdrawn.`);

	if (completedWithdrawal.includes("Error")) {
		throw completeWithdraw;
	}

	return completedWithdrawal;
}

/**
 * @dev Check if an asset of given ID exists for the configured collection
 *
 * @param client ImmutableXClient client instance
 * @param assetAddress address of the asset
 * @param tokenId ID of the token
 * @return token if it exists or undefined
 */
 async function getAsset(client, assetAddress, tokenId) {
	let token = null;
	try {
		token = await client.getAsset({
			address: assetAddress.toLowerCase(),
			id: tokenId.toString()
		});
		log.info(`Token with ID ${tokenId} found for address ${assetAddress.toLowerCase()}`);
	}
	catch(error) {
		log.info(`Token with ID ${tokenId} does not exist for address ${assetAddress.toLowerCase()}`);
	}
	return token;
}

/**
 * @dev Gets a number or all the assets for the configured collection
 *
 * @param client ImmutableXClient client instance
 * @param assetAddress address of the asset
 * @param loopNTimes number of times to request for another batch of assets
 * @return assets found in L2
 */
async function getAllAssets(client, assetAddress, loopNTimes) {
	let assets = [];
	let response;
	let cursor;

	do {
		response = await client.getAssets({
			collection: assetAddress,
			cursor
		});
		assets = assets.concat(response.result);
		cursor = response.cursor;
	}
	while(cursor && (!loopNTimes || loopNTimes-- > 1))

	if(assets.length > 0) {
		log.info(`Assets found for address ${config.landERC721}`);
	}
	else {
		log.info(`No assets found for address ${config.landERC721}`);
	}
	return assets;
}

/**
 * @dev Get L2 mint metadata
 * 
 * @param assetAddress address of the asset on L1
 * @param tokenId ID of the token
 * @return object containing `token_id`, `client_token_id` and `blueprint`
 */
async function getMint(assetAddress, tokenId) {
	const response =  await axios.get(
		`https://api.ropsten.x.immutable.com/v1/mintable-token/${assetAddress}/${tokenId}`);

	if (response.status !== 200) return null;
	return response.data;
}

/**
 * @dev Gets a number or all the assets for the configured collection
 *
 * @param client ImmutableXClient client instance
 * @param assetAddress address of the asset
 * @param loopNTimes number of times to request for another batch of assets
 * @return assets found in L2
 */
async function getAllAssets(client, assetAddress, loopNTimes) {
	let assets = [];
	let response;
	let cursor;

	do {
		response = await client.getAssets({
			collection: assetAddress
		});
		assets = assets.concat(response.result);
		cursor = response.cursor;
		console.log(assets);
	}
	while(cursor && (!loopNTimes || loopNTimes-- > 1))

	if(assets.length > 0) {
		console.log(`Assets found for address ${assetAddress}`);
	}
	else {
		console.log(`No assets found for address ${assetAddress}`);
	}
	return assets;
}

/**
 * @dev Get all trades from L2
 * 
 * @param assetAddress address of the asset
 * @param tokenId asset token ID
 * @param loopNTimes number of times to request for another batch of trades
 * @param minTimestamp mininum timestamp to search for trades
 * @param maxTimestamp maximum timestamp to search for trades
 * @param orderBy field to order by
 * @param pageSize page size for each batch (number of trades returned will be min(totalNumberOfTrades, loopNTimes * pageSize))
 * @param direction sort order
 * @return trades for provided asset
 */
async function getAllTrades(
	assetAddress, 
	tokenId, 
	loopNTimes,
	minTimestamp,
	maxTimestamp, 
	orderBy = "timestamps", 
	pageSize = 1, 
	direction = "desc"
) {
	let trades = [];
	let response;
	let cursor;

	do {
		response = await axios.get("https://api.ropsten.x.immutable.com/v1/trades", {
			params: {
				party_a_token_type: ERC721TokenType.ERC721,
				party_a_token_address: assetAddress,
				party_a_token_id: tokenId,
				min_timestamp: minTimestamp,
				max_timestamp: maxTimestamp,
				page_size: pageSize,
				cursor,
				order_by: orderBy,
				direction
			}
		});
		if (response.status !== 200) return null;
		cursor = response.data.cursor;
		trades = trades.concat(response.data.result);
	} while (cursor && (!loopNTimes || loopNTimes-- > 1));

	return trades;	
}

/**
 * @dev Get all trades from L2
 * 
 * @param assetAddress address of the asset
 * @param tokenId asset token ID
 * @param loopNTimes number of times to request for another batch of trades
 * @param minTimestamp mininum timestamp to search for trades
 * @param maxTimestamp maximum timestamp to search for trades
 * @param orderBy field to order by
 * @param pageSize page size for each batch (number of trades returned will be min(totalNumberOfTrades, loopNTimes * pageSize))
 * @param direction sort order
 * @return trades for provided asset
 */
async function getAllTransfers(
	assetAddress, 
	tokenId, 
	loopNTimes,
	minTimestamp,
	maxTimestamp, 
	orderBy = "timestamps", 
	pageSize = 1, 
	direction = "desc"
) {
	let transfers = [];
	let response;
	let cursor;

	do {
		response = await axios.get("https://api.ropsten.x.immutable.com/v1/transfers", {
			token_type: ERC721TokenType.ERC721,
			token_id: tokenId,
			token_address: assetAddress,
			min_timestamp: minTimestamp,
			max_timestamp: maxTimestamp,
			page_size: pageSize,
			cursor,
			order_by: orderBy,
			direction
		});
		cursor = response.data.cursor;
		transfers = transfers.concat(response.data.result);
	} while(cursor && (!loopNTimes || loopNTimes-- > 1));

	return transfers;
}

/**
 * @dev Get PlotBought events emitted from LandSale contract
 * 
 * @param filter event filters
 * @param fromBlock get events from the given block number
 * @param toBlock get events until the given block number
 * @return events
 */
async function getPlotBoughtEvents(filter, fromBlock, toBlock) {
	// Get configuration for given network
	const config = Config(network.name);

	// Get landSale contract instance
	const landSale = getLandSaleContract(config.landSale);

	// Get past PlotBought events
	const plotBoughtObjs = await landSale.getPastEvents("PlotBought", {
		filter,
		fromBlock,
		toBlock,
	});

	// Populate return array with formatted event topics
	const eventsMetadata = [];
	plotBoughtObjs.forEach(plotBought => {
		const returnValues = plotBought.returnValues
		eventsMetadata.push({
			buyer: returnValues._by,
			tokenId: returnValues._tokenId,
			sequenceId: returnValues._sequenceId,
			plot: returnValues._plot,
		});
	})

	return eventsMetadata;
}

/**
 * @dev Verify event's metadata against the ones on L2
 * 
 * @param client ImmutableXClient client instance
 * @param assetAddress address of the asset
 * @param filter event filters
 * @param fromBlock get events from the given block number
 * @param toBlock get events until the given block number
 * @return differences found between events and L2
 */
async function verify(client, assetAddress, filter, fromBlock, toBlock) {
	// Get PlotBought events to match information in L1/L2
	const plotBoughtEvents = await getPlotBoughtEvents(filter, fromBlock, toBlock);

	// Get all assets
	const assetsL2 = await getAllAssets(client, assetAddress);

	// Mapping tokenId => assetL2
	const assetsL2Mapping = {};
	assetsL2.forEach(asset => {
		assetsL2Mapping[asset.token_id] = asset.metadata;
	});

	// Check metadata
	let assetDiff = [];
	let metadata;
	let tokenId;
	for (const event in plotBoughtEvents) {
		metadata = getBlueprint(event.plot);
		tokenId = typeof event.tokenId === "string" ? event.tokenId : event.tokenId.toString();
		if (metadata !== assetsL2Mapping[tokenId]) {
			assetDiff.push({
				tokenId,
				event: metadata,
				l2: assetsL2Mapping[tokenId],				
			});
		}
	}

	if (assetDiff.length !== 0) {
		log.info("Difference found between event and L2 metadata!");
	} else {
		log.info("Metadata on the events and L2 are fully consistent!");
	}

	return assetDiff;
}

/**
 * @dev Get snapshot of latest token owner on L1
 * 
 * @param assetContract L1 address of the asset smmart contract
 * @param tokenId ID of the token
 * @param fromBlock the block from which search for the snapshot
 * @param toBlock the block to which search for the snapshot
 * @return latest owner on L1 for the given interval
 */
 async function getOwnerOfSnapshotL1(assetContract, tokenId, fromBlock, toBlock) {
	// Get past Transfer event from the ERC721 asset contract
	const transferObjs = await assetContract.getPastEvents("Transfer", {
		filter: {tokenId},
		fromBlock,
		toBlock,
	});

	// Return empty array if no past event have been found
	if (transferObjs.length === 0) return null;

	// Sort and get the last event (with biggest blockNumber)
	const lastTransferEvent = transferObjs
		.sort((eventLeft, eventRight) => eventLeft.blockNumber - eventRight.blockNumber)
		.pop();

	// Return owner after last Transfer event
	return lastTransferEvent.returnValues.to;

}

/**
 * @dev Get order given `orderId`
 * 
 * @param orderId ID of the order
 * @return order metadata
 */
async function getOrder(orderId) {
	// Get the order given order ID
	const response = await axios.get(`https://api.ropsten.x.immutable.com/v1/orders/${orderId}`);

	// Return null if some error occurred for the request
	if (response.status !== 200) return null;

	// Return response data
	return response.data;
}

/**
 * @dev Get snapshot of latest token owner on L2
 * 
 * @param assetAddress L1 address of the asset
 * @param tokenId ID of the token
 * @param fromBlock the block from which search for the snapshot
 * @param toBlock the block to which search for the snapshot
 * @return latest owner on L2 for the given interval
 */
async function getOwnerOfSnapshotL2(assetAddress, tokenId, fromBlock, toBlock) {
	// Get timestamp from blocks
	const minTimestamp = fromBlock === undefined 
		? undefined : web3.eth.getBlock(fromBlock).timestamp.toString();
	const maxTimestamp = toBlock === undefined 
		? undefined : web3.eth.getBlock(toBlock).timestamp.toString();

	// Get latest trade
	let latestTrade = (await getAllTrades(assetAddress, tokenId, 1, minTimestamp, maxTimestamp)).pop();
	latestTrade = latestTrade !== undefined 
		? {timestamp: latestTrade.timestamp, receiver: await getOrder(latestTrade.b.order_id).user}: {timestamp: 0};

	// Get latest transfer
	let latestTransfer = (await getAllTransfers(assetAddress, tokenId, 1, minTimestamp, maxTimestamp)).pop();
	latestTransfer = latestTransfer?? {timestamp: 0};

	// Return receiver of latest transfer if it's timestamp is greater or equal to the one of the latest trade
	if (latestTransfer.timestamp >= latestTrade.timestamp) return latestTransfer.receiver?? null;

	// Othewise, return latest trade receiver
	return latestTrade.receiver?? null;
}

/**
 * @dev Rollback and re-mint asset to a new ERC721 collection on L2
 * 
 * @param client ImmutableXClient instance
 * @param fromAssetContract the current ERC721 asset contract
 * @param toAssetContract the asset contract to migrate the tokens
 * @param fromBlock the block from to get the snapshots (PlotBought events)
 * @param toBlock the end block to get the snapshots (PlotBought events)
 */
async function rollback(client, fromAssetContract, toAssetContract, fromBlock, toBlock) {
	// Get past PlotBought events to a certain block
	const pastEvents = await getPlotBoughtEvents(network.name, undefined, fromBlock, toBlock);

	// Loop through past events and remint on L2 for new contract
	let assetL2;
	let owner
	for(const event of pastEvents) {
		// Retrieve asset detail on L2
		assetL2 = await getAsset(client, fromAssetContract, event.tokenId);

		// If assetL2 status is 'imx' take owner from L2, otherwise take from L1 snapshot
		if (assetL2.status === "imx") {
			// Get owner on L2 (IMX) snapshot
			owner = await getOwnerOfSnapshotL2(tokenId, fromBlock, toBlock);

			log.debug(`Taking ownership of token ${tokenId} from L2`);
		} else {
			// get owner on L1 (LandERC721) snapshot
			owner = await getOwnerOfSnapshotL1(fromAssetContract, event.tokenId, fromBlock, toBlock);

			log.debug(`Taking ownership of token ${tokenId} from L1`);
		}

		if (owner === null) {
			log.error(`Failed to retrieve owner for token ID ${event.tokenId}`);
			throw "Failed to retried owner";
		}

		// Re-mint asset with correct ownership (L1 or L2)
		log.info(`Migrated token ${tokenId} from ${fromAssetContract} to ${toAssetContract} successful!`);
		await mint_l2(client, toAssetContract, owner, tokenId, getBlueprint(event.plot));

	log.info(`Migration from ${fromAssetContract} to ${toAssetContract} completed!`);
	}
}

/**
 * @dev Deposit asset from L1 into L2 (IMX)
 *
 * @param client ImmutableXClient client instance
 * @param assetAddress address of the asset
 * @param tokenId token ID to deposit
 * @return deposit operation metadata
 */
async function deposit(client, assetAddress, tokenId) {
	// Check if asset is already on IMX
	const asset = await getAsset(client, assetAddress, tokenId);
	if (asset.status === "imx") throw "Asset already on L2";   
	// Make deposit on L2 and get return data
	return client.deposit({
			quantity: "1",
			user: client.address.toLowerCase(),
			token: {
				type: ERC721TokenType.ERC721,
				data: {
					tokenAddress: assetAddress.toLowerCase(),
					tokenId
				}
			}
		});
}

// export public module API
module.exports = {
	getImmutableXClientFromWallet,
	getImmutableXClient,
	getWalletFromMnemonic,
	getWallet,
	MintableERC721TokenType,
	ERC721TokenType,
	getLandSaleContract,
	getLandERC721Contract,
	getPlotBoughtEvents,
	getBlueprint,
	getPlotStore,
	mint_l2,
	burn,
	prepareWithdraw,
	completeWithdraw,
	getAsset,
	getAllAssets,
	getAllTrades,
	getAllTransfers,
	rollback,
	verify,
	deposit
}
