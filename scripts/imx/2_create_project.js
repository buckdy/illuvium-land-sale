// Get IMX common functions
const {
    getImmutableXClient
} = require("./common");

// Get log level
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

async function createProject(network, userPrivateKey, projectName, companyName, contactEmail) {
    const user = await getImmutableXClient(network, userPrivateKey);
    
    let project;
    log.info("Creating project...");
    try {
        project = await user.createProject({
            name: projectName,
            company_name: companyName,
            contact_email: contactEmail
        });
    } catch (error) {
        throw JSON.stringify(error, null, 2);
    }

    log.info(`Created project with ID: ${project.id}`);
}

async function main() {
    await createProject(
        process.env.NETWORK_NAME, 
        process.env.USER_PRIVATE_KEY,
        process.env.PROJECT_NAME,
        process.env.COMPANY_NAME,
        process.env.CONTACT_EMAIL);
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });