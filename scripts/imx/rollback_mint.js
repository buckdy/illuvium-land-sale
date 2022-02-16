// Get IMX common functions
const {
	getImmutableXClient,
	getBlueprint,
	getPlotBoughtEvents,
	getAsset,
	getAllTrades,
	getAllTransfers,
	mint_l2,
} = require("./common");

// Get configuration
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

async function getOwnerOfSnapshotL1(assetContract, tokenId, fromBlock, toBlock) {
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
		.unshift();

	// Return owner after last Transfer event
	return lastTransferEvent.returnValues.to;

}

async function getOwnerOfSnapshotL2(assetAddress, tokenId, fromBlock, toBlock) {
	// Get timestamp from blocks
	const minTimestamp = fromBlock === undefined 
		? undefined : web3.eth.getBlock(fromBlock).timestamp.toString();
	const maxTimestamp = toBlock === undefined 
		? undefined : web3.eth.getBlock(toBlock).timestamp.toString();

	// Get latest trade
	let latestTrade = (await getAllTrades(assetAddress, tokenId, 1, minTimestamp, maxTimestamp)).unshift();
	latestTrade = latestTrade !== 0 ? latestTrade : {timestamp: 0};

	// Get latest transfer
	let latestTransfer = (await getAllTransfers(assetAddress, tokenId, 1, minTimestamp, maxTimestamp)).unshift();
	latestTransfer = latestTransfer !== 0 ? latestTransfer : {timestamp: 0};

	// Return receiver of latest transfer if it's timestamp is greater or equal to the one of the latest trade
	if (latestTransfer.timestamp >= latestTrade.timestamp) return latestTransfer.receiver?? null;

	// TODO: Return asset receiver of latest trade
}

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
			owner = await getOwnerOfSnapshotL1(toAssetContract, event.tokenId, fromBlock, toBlock);

			log.debug(`Taking ownership of token ${tokenId} from L1`);
		}

		// Re-mint asset with correct ownership (L1 or L2)
		await mint_l2(client, toAssetContract, owner, tokenId, getBlueprint(event.plot));

	log.info(`Migration from ${fromAssetContract} to ${toAssetContract} completed!`);
}

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// Get network config
	const config = Config(network.name);

	// Retrieve IMX client
	const client = await getImmutableXClient(network.name);

	// Execute migration
	await rollback(client, config.migration.fromLandERC721, config.toLandERC721);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
