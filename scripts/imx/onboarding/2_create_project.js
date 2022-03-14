// Get IMX common functions
const {
	get_wallet_from_mnemonic,
	get_immutablex_client_from_wallet,
} = require("../common");

// Onboarding config file
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev creates new project on IMX
 *
 * @param project_name name of the project
 * @param company_name name of the company
 * @param contact_email email to contact for the project
 * @return Metadata from newly created project
 */
async function create_project(client, project_name, company_name, contact_email) {
	let project;
	log.info("Creating project...");
	try {
		project = await client.createProject({
			name: project_name,
			company_name: company_name,
			contact_email: contact_email
		});
	}
	catch(error) {
		throw JSON.stringify(error, null, 2);
	}

	log.info(`Created project with ID: ${project.id}`);
	return project;
}

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// Get configuration for network
	const config = Config(network.name);

	// Get IMX client instance
	const client = await get_immutablex_client_from_wallet(
		get_wallet_from_mnemonic(
			network.name, 
			config.mnemonic, 
			config.address_index
		),
		config.imx_client_config
	);

	// Create project given client, project name, company name and contact email
	await create_project(
		client,
		config.project.project_name,
		config.project.company_name,
		config.project.contact_email
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
