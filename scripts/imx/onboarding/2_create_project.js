// Get IMX common functions
const {
	getImmutableXClient,
} = require("../common");

// config file contains known deployed token addresses, IMX settings
const Config = require("../config");

// using logger instead of console to allow output control
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
	}
	catch(error) {
		throw JSON.stringify(error, null, 2);
	}

	log.info(`Created project with ID: ${project.id}`);
}

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	await createProject(
		process.env.PROJECT_NAME,
		process.env.COMPANY_NAME,
		process.env.CONTACT_EMAIL);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
