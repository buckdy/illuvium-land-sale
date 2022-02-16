// Get IMX common functions
const {
	getImmutableXClient,
	getBlueprint,
	getLandERC721Contract,
	getPlotBoughtEvents,
	getAsset,
	mint_l2,
} = require("./common");

// Get configuration
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

async function getOwnerOfSnapshotL1(erc721Contract, tokenId, fromBlock, toBlock) {
	const transferObjs = await erc721Contract.getPastEvents("PlotBought", {
		filter: {tokenId},
		fromBlock,
		toBlock,
	});

	// Sort and get the last event (with biggest blockNumber)
	const lastTransferEvent = transferObjs.sort((eventLeft, eventRight) => eventLeft.blockNumber - eventRight.blockNumber).at(-1);

	return lastTransferEvent.returnValues.to;

}

async function getOwnerOfSnapshotL2(assetAddress, tokenId, fromBlock, toBlock) {

}

async function rollback(client, fromAssetContract, toAssetContract, fromBlock, toBlock) {
	// Get config for network
	const config = Config(network.name);

	// Get past PlotBought events to a certain block
	const pastEvents = await getPlotBoughtEvents(network.name, undefined, fromBlock, toBlock);

	// Get current LandERC721 contract
	//const currentLandERC721 = getLandERC721Contract(network.name, config.landERC721);

	// Get new LandERC721 contract
	//const newLandERC721 = getLandERC721Contract(network.name, config.newLandERC721);

	// Get minter/client
	//const client = await getImmutableXClient(network.name, config.IMXClientConfig);

	// Loop through past events and remint on L2 for new contract
	let assetL2;
	let ownerL1;
	let ownerL2;
	for(const event of pastEvents) {
		// Retrieve asset detail on L2
		assetL2 = await getAsset(client, fromAssetContract, event.tokenId);

		// If assetL2 status is 'imx' take owner from L2, otherwise take from L1 snapshot
		if (assetL2.status === "imx") {
			// Get owner on L2 (IMX) snapshot
			ownerL2 = await getOwnerOfSnapshotL2(tokenId, fromBlock, toBlock);

		} else {
			// get owner on L1 (LandERC721) snapshot
			ownerL1 = await getOwnerOfSnapshotL1(toAssetContract, event.tokenId, fromBlock, toBlock);
			
			// Re-mint asset using L1 ownership
			await mint_l2(client, toAssetContract, ownerL1, tokenId, getBlueprint(event.plot));
		}

		// If owner is ZERO_ADDRESS it reverts -- owner haven't withdrawn
		try {
			// Check if it has an owner on L1, if not, throw an error on revert
			await currentLandERC721.methods.ownerOf(event.tokenId).call();

			// get owner on L1 (LandERC721) snapshot
			ownerL1 = await getOwnerOfSnapshotL1(currentLandERC721, event.tokenId, fromBlock, toBlock);

			// If the owner is IMX it means that the user withdrawn the token but deposited again on L2
			if(ownerL1 === config.IMXClientConfig.starkContractAddress) {
				// Get owner on L2 (IMX) snapshot
				ownerL2 = await getOwnerOfSnapshotL2(tokenId, fromBlock, toBlock);

				// Re-mint on L2 with L2 owner snapshot
				await mint_l2(newLandERC721, ownerL2, tokenId, getBlueprint(event.plot), minter) == null
				&& (() => {
					throw "Minting failed!";
				})();

				// Continue with the event loop
				continue;
			}
			// Re-mint on L2 with L1 owner snapshot
			await mint_l2(newLandERC721, ownerL1, tokenId, getBlueprint(event.plot), minter) == null
			&& (() => {
				throw "Minting failed!";
			})();

		}
		catch(err) { // If it's not on L1
			if(err === "Minting failed!") {
				console.error(`Minting failed for token ID ${event.tokenId} at block ${event.blockNumber}`);
				process.exit(1);
			}
			// Get owner on L2 (IMX) snapshot
			ownerL2 = await getOwnerOfSnapshotL2(tokenId, fromBlock, toBlock);

			// Re-mint on L2 with L2 owner snapshot
			await mint_l2(newLandERC721, ownerL2, tokenId, getBlueprint(event.plot), minter) == null
			&& (() => {
				console.error(`Minting failed for token ID ${event.tokenId} at block ${event.blockNumber}`);
				process.exit(1);
			});
		}
	}

	log.info(`Migration from ${config.landERC721} to ${config.newLandERC721} completed!`);
}

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	//await rollback(process.env.MIGRATION_FROM_BLOCK, process.env.MIGRATION_TO_BLOCK);
	
	// Retrieve IMX client
	const client = await getImmutableXClient(network.name);

	console.log(client);
	process.exit(0);

	const assetL2 = await getAsset(client, "0xc6185055ea9891d5d9020c927ff65229baebdef2", "1678863");
	console.log(assetL2);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
