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
 * @dev creates new project on IMX
 * 
 * @param projectName name of the project
 * @param companyName name of the company
 * @param contactEmail email to contact for the project
 */
async function createProject(projectName, companyName, contactEmail) {
    const config = Config(network.name);
    const user = await getImmutableXClient(network.name, config.IMXClientConfig);
    
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