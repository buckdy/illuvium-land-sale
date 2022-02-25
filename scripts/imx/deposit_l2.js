// Get IMX common functions
const {
    getImmutableXClient,
    deposit,
} = require("./common");

// config file contains known deployed token addresses, IMX settings
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
    // Get config for given network
    const config = Config(network.name);

    // Instantiate IMX client
    const client = await getImmutableXClient(network.name);

    log.info(await deposit(
        client,
        config.landERC721,
        process.env.TOKEN_ID_TO_DEPOSIT
        )
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });