// Get IMX common functions
const {
    getImmutableXClient
} = require("./common");

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

async function registerUser(network, userPrivateKey) {
    const user = await getImmutableXClient(network, userPrivateKey);

    log.info("Registering user...");
    try {
        await user.getUser({
            user: user.address.toLowerCase()
        });
        log.info(`User ${user.address.toLowerCase()} already registered`);
    } catch {
        try {
            await user.registerImx({
                etherKey: user.address.toLowerCase(),
                startPublicKey: user.starkPublicKey
            });
            log.info(`User ${user.address.toLowerCase()} registered successfully!`);
        } catch (error) {
            throw JSON.stringify(error, null, 2);
        }
    }
}

async function main() {
    await registerUser(process.env.NETWORK_NAME, process.env.USER_PRIVATE_KEY);
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    })