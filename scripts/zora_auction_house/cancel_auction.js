// get zora common functions
const {
	get_wallet_from_mnemonic,
	cancel_auction,
} = require("./common");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// used to get the chain id for the AuctionHouse constructor
	const {getChainId} = require("hardhat");

	// config file contains required token addresses for zora
	const Config = require("./config");

	// get configuration for network
	const config = Config(network.name);

	// instantiate wallet
	const wallet = get_wallet_from_mnemonic(
		network.name,
		process.env.INFURA_KEY,
		network.name === "mainnet"?
			process.env.MNEMONIC1:
			process.env.MNEMONIC4,
	);

	// cancel auction
	log.info(await cancel_auction(
		wallet,
		parseInt(await getChainId()),
		config.cancel_auction.auction_id,
		config.overrides
	));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});