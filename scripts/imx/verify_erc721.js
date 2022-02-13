// Get IMX common functions
const {
	getImmutableXClient,
	MintableERC721TokenType,
	getLandSaleContract,
	getLandERC721Contract,
} = require("./common");

// config file contains known deployed token addresses, IMX settings
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev Check if an asset of given ID exists for the configured collection
 *
 * @param tokenId ID of the token
 * @return token if it exists or undefined
 */
async function getAsset(tokenId) {
	const config = Config(network.name);
	const client = await getImmutableXClient(network.name, config.IMXClientConfig);

	let token = undefined;
	try {
		token = await client.getAsset({
			address: config.landERC721,
			id: tokenId.toString()
		});
		console.log(`Token with ID ${tokenId} found for address ${config.landERC721}`);
	}
	catch(error) {
		console.log(`Token with ID ${tokenId} does not exist for address ${config.landERC721}`);
	}
	return token;
}

/**
 * @dev Gets a number or all the assets for the configured collection
 *
 * @param loopNTimes number of times to request for another batch of assets
 * @return assets found in L2
 */
async function getAllAssets(loopNTimes = undefined) {
	const config = Config(network.name);
	const client = await getImmutableXClient(network.name, config.IMXClientConfig);

	let assets = new Array();
	let response;
	let cursor;

	do {
		response = await client.getAssets({
			collection: config.landERC721
		});
		assets = assets.concat(response.result);
		cursor = response.cursor;
	}
	while(cursor && (!loopNTimes || loopNTimes-- > 1))

	if(assets.length > 0) {
		console.log(`Assets found for address ${config.landERC721}`);
	}
	else {
		console.log(`No assets found for address ${config.landERC721}`);
	}
	return assets;
}

async function getPlotBoughtEvents(filter = undefined, fromBlock = undefined, toBlock = undefined) {
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
	const eventsMetadata = new Array();
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

async function verify(filter = undefined, fromBlock = undefined, toBlock = undefined) {
	// Get PlotBought events to match information in L1/L2
	const plotBoughtEvents = await getPlotBoughtEvents(filter, fromBlock, toBlock);


}

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	const config = Config(network.name);
	const client = await getImmutableXClient(network.name, config.IMXClientConfig);
	const assetsL2 = await getAllAssets()
	console.log(assetsL2);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
