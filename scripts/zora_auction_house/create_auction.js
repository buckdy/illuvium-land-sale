// get zora common functions
const {
    get_wallet_from_mnemonic,
    approve_land_operator,
    create_auction,
} = require("./common");

// config file contains required token addresses for zora
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// used to get the chain id for the AuctionHouse constructor
const { getChainId } = require("hardhat");


async function main() {
    // get configuration for network
    const config = Config(network.name);

    // instantiate wallet
    const wallet = get_wallet_from_mnemonic(
        network.name,
        process.env.INFURA_KEY,
        network.name === "mainnet" ? 
        process.env.MNEMONIC1 : 
        process.env.MNEMONIC4,
    );

    // approve token transfer to auction house contract
    log.debug(await approve_land_operator(
        wallet,
        config.create_auction.token_address,
        config.create_auction.token_id,
        config.auction_house,
        config.overrides
    ));

    // create zora auction
    log.info(await create_auction(
        wallet,
        parseInt(await getChainId()),
        config.create_auction,
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

