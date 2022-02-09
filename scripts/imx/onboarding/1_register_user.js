// Get IMX common functions
const {
    getImmutableXClient
} = require("../common");

// Get configuration
const Config = require("../config");

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev Registers new client user on IMX 
 */
async function registerUser() {
    const config = Config(network.name);
    const client = await getImmutableXClient(network.name, config.IMXClientConfig);

    log.info("Registering user...");
    try {
        await client.getUser({
            client: client.address.toLowerCase()
        });
        log.info(`User ${user.address.toLowerCase()} already registered`);
    } catch {
        try {
            await client.registerImx({
                etherKey: client.address.toLowerCase(),
                startPublicKey: client.starkPublicKey
            });
            log.info(`User ${user.address.toLowerCase()} registered successfully!`);
        } catch (error) {
            throw JSON.stringify(error, null, 2);
        }
    }
}

async function main() {
    await registerUser();
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    })