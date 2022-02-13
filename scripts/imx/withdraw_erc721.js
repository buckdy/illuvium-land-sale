// Get IMX common functions
const {
	getImmutableXClient,
	ERC721TokenType,
} = require("./common");

// config file contains known deployed token addresses, IMX settings
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev Prepare asset for withdrawal
 *
 * @param tokenId ID of the token
 * @param tokenOwner owner of the token
 * @return operation response or null if it fails
 */
async function prepareWithdraw(tokenId, tokenOwner) {
	const config = Config(network.name);
	const client = await getImmutableXClient(network.name, config.IMXClientConfig);

	let withdrawalData;
	try {
		withdrawalData = await client.prepareWithdrawal({
			user: tokenOwner.toLowerCase(),
			quantity: "1", // Always one
			token: {
				type: ERC721TokenType.ERC721,
				data: {
					tokenId,
					tokenAddress: config.landERC721
				}
			}
		});
	}
	catch(err) {
		console.error(err);
		return null;
	}
	return withdrawalData;
}

/**
 * @dev Complete withdrawal, withdrawal status must be 'success' and rollup_status must be 'confirmed'
 *
 * @param tokenId ID of the token
 * @returns operation metadata or null if it fails
 */
async function completeWithdraw(tokenId) {
	const config = Config(network.name);
	const client = await getImmutableXClient(network.name, config.IMXClientConfig);
	let completedWithdrawal;
	try {
		completedWithdrawal = client.completeWithdrawal({
			starkPublicKey: client.starkPublicKey.toLowerCase(),
			token: {
				type: ERC721TokenType.ERC721,
				data: {
					tokenId,
					tokenAddress: config.landERC721
				}
			}
		});
	}
	catch(err) {
		console.error(err);
		return null;
	}
	return completedWithdrawal;
}

// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	//console.log(await prepareWithdraw(process.env.TOKEN_ID_TO_WITHDRAW, process.env.TOKEN_USER));
	console.log(await completeWithdraw(process.env.TOKEN_ID_TO_WITHDRAW));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	})
