// Get IMX client and token type
const {ImmutableXClient, MintableERC721TokenType, ERC721TokenType} = require("@imtbl/imx-sdk");

// Get axios for IMX API requests
const axios = require("axios");

// Get required ABIs
const landSaleAbi = artifacts.require("LandSale").abi;
const landERC721Abi = artifacts.require("LandERC721").abi;

// Get pack from land_lib JS implementations
const {
	pack,
	unpack,
} = require("../../test/land_gen/include/land_lib");

// Get ethersproject utils
const {InfuraProvider} = require("@ethersproject/providers");
const {Wallet} = require("@ethersproject/wallet");

// config file contains known deployed token addresses, IMX settings
const Config = require("./config");

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

/**
 * @dev Configure Infura provider based on the network
 *
 * @param network the network name
 * @return instance of InfuraProvider
 */
function getProvider(network) {
	return new InfuraProvider(network, process.env.INFURA_KEY);
}

/**
 * @dev Get Websocket RPC provider given configuration
 *
 * @param network the network name
 * @return instance of web3 WebsocketProvider
 */
function getProviderWebsocket(network) {
	const config = Config(network);
	return new web3.providers.WebsocketProvider(config.provider);
}
/**
 * @dev Get wallet from mnemonic
 * 
 * @param network name of the network
 * @param mnemonic mnemonic to generate the HDWallet from
 * @param n address index as defined in BIP-44 spec
 * @return ethersproject wallet instance
 */
function getWalletFromMnemonic(network, mnemonic, n = 0) {
	const provider = getProvider(network);

	return Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${n}`).connect(provider);
}

/**
 * @dev Gets wallet from provided mnemonic provided for the network
 *
 * @param network name of the network
 * @param n address index as defined in BIP-44 spec
 * @return ethersproject wallet instance
 */
function getWallet(network, n = 0) {
	const mnemonic = network === "ropsten"? process.env.MNEMONIC3: process.env.MNEMONIC1;

	return getWalletFromMnemonic(network, mnemonic, n);
}

/**
 * @dev Gets an instance of the IMX client given configuration for the network
 *
 * @param wallet ethersproject wallet instance
 * @param IMXClientConfig configuration object for ImmutableXClient
 * @return Instance of IMX client
 */
function getImmutableXClientFromWallet(wallet, IMXClientConfig) {
	return ImmutableXClient.build({
		...IMXClientConfig,
		signer: wallet
	});
}

/**
 * @dev Gets an instance of the IMX client given configuration for the network
 *
 * @param network name of the network ("ropsten" or "mainnet")
 * @return Instance of IMX client
 */
function getImmutableXClient(network) {
	const config = Config(network);

	return getImmutableXClientFromWallet(getWallet(network), config.IMXClientConfig);
}

/**
 * @dev Instantiate the LandSale contract
 *
 * @param network name of the network ("ropsten" or "mainnet")
 * @return LandSale instance
 */
function getLandSaleContract(network) {
	const config = Config(network);

	let landSale = new web3.eth.Contract(
		landSaleAbi,
		config.landSale
	);
	landSale.setProvider(getProviderWebsocket(network));
	return landSale;
}

/**
 * @dev Instantiate the LandERC721 contract
 *
 * @param network name of the network ("ropsten" or "mainnet")
 * @param address the address of the contract in the respective network
 * @return LandERC721 instance
 */
function getLandERC721Contract(network, address) {
	const landERC721 = new web3.eth.Contract(
		landERC721Abi,
		address
	);
	landERC721.setProvider(getProviderWebsocket(network));
	return landERC721;
}

/**
 * @dev Packs plotStore and turn it into a string representation of uint256 in decimal format
 *
 * @param plotStore PlotStore object/structure
 * @return decimal string representation of packed data
 */
function getBlueprint(plotStore) {
	return pack(plotStore).toString(10);
}

/**
 * @dev Unpacks blueprint into a PlotStore object
 * 
 * @param blueprint packed PlotStore object/structure into a string of uint256 in decimal format
 * @return PlotStore object/structure
 */
function getPlotStore(blueprint) {
	return unpack(web3.utils.toBN(blueprint));
}

/**
 * @dev Mints an NFT on L2 (IMX)
 *
 * @param network name of the network ("ropsten" or "mainnet")
 * @param to address to mint to
 * @param tokenId ID of the token
 * @param blueprint token metadata
 * @param minter the owner of the L1 contract and collection on L2
 * @return the mint result metadata or null if minting fails
 */
async function mint_l2(network, to, tokenId, blueprint, minter) {
	const config = Config(network);

	// a token to mint - plotStorePack should be a string representation of uint256 in decimal format
	const token = {
		type: MintableERC721TokenType.MINTABLE_ERC721,
		data: {
			id: tokenId.toString(),
			// note: blueprint cannot be empty
			blueprint, // This will come in the mintingBlob to the contract mintFor function as {tokenId}:{plotStorePack}
			tokenAddress: config.landERC721,
		},
	};

	log.info("Minting on L2...");
	let mintResults;
	try {
		mintResults = await minter.mint({
			mints: [
				{
					etherKey: to.toLowerCase(),
					tokens: [token],
					nonce: "1", // Automatically populated by the lib
					authSignature: "", // Automatically populated by the lib
				},
			],
		});
		log.info(`Minting of tokenId ${tokenId} of collection ${erc721Contract} successful on L2`);
	}
	catch(error) {
		log.error(error);
		throw error;
	}
	return mintResults.results[0]
}

/**
 * @dev Burn token with given ID using and ImmutableXClient (with token owner as signer)
 * 
 * @param tokenId ID the token
 * @param client ImmutableXClient with the token owner as signer
 * @return deleted token metadata
 */
async function burn(tokenId, client) {
	const token = {
		type: ERC721TokenType.ERC721,
		data: {
			tokenId: tokenId.toString(),
			tokenAddress: config.landERC721,
		},
	};

	let deletedToken;
	try {
		deletedToken = await client.burn({
			quantity: "1",
			sender: client.address.toLowerCase(),
			token,
		});
		log.info(`Token ID ${tokenId} of collection contract ${config.landERC721} successfully deleted.`);
		return deletedToken;
	}
	catch(error) {
		log.error(`Token with id ${tokenId.toString()} not found in ERC721 contract address ${config.landERC721}`);
		throw error;
	}
}

/**
 * @dev Get PlotBought events emitted from LandSale contract
 * 
 * @param network name of the network ("ropsten" or "mainnet")
 * @param filter event filters
 * @param fromBlock get events from the given block number
 * @param toBlock get events until the given block number
 * @return events
 */
async function getPlotBoughtEvents(network, filter, fromBlock, toBlock) {
	// Get landSale contract instance
	const landSale = getLandSaleContract(network);

	// Get past PlotBought events
	const plotBoughtObjs = await landSale.getPastEvents("PlotBought", {
		filter,
		fromBlock: fromBlock?? 0,
		toBlock: toBlock?? "latest",
	});

	// Populate return array with formatted event topics
	const eventsMetadata = [];
	plotBoughtObjs.forEach(plotBought => {
		const returnValues = plotBought.returnValues
		eventsMetadata.push({
			blockNumber: plotBought.blockNumber,
			buyer: returnValues._by,
			tokenId: returnValues._tokenId,
			sequenceId: returnValues._sequenceId,
			plot: returnValues._plot
		});
	});

	return eventsMetadata;
}

/**
 * @dev Prepare asset for withdrawal
 *
 * @param tokenId ID of the token
 * @param client ImmutableXClient with token owner as signer
 * @return withdrawal metadata
 */
 async function prepareWithdraw(tokenId, client) {
	const config = Config(network.name);

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
		log.info(`Withdrawal process started for token ID ${tokenId} of collection contract ${config.landERC721}`);

		return withdrawalData;
	}
	catch(error) {
		log.error(error);
		throw error;
	}
}

/**
 * @dev Complete withdrawal, asset status needs to be "withdrawable"
 *
 * @param tokenId ID of the token
 * @param client ImmutableXClient with token owner as signer
 * @returns withdrawal completion metadata
 */
async function completeWithdraw(tokenId, client) {
	const config = Config(network.name);

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

/**
 * @dev Check if an asset of given ID exists for the configured collection
 *
 * @param client ImmutableXClient client instance
 * @param tokenId ID of the token
 * @return token if it exists or undefined
 */
 async function getAsset(client, tokenId) {
	let token = undefined;
	try {
		token = await client.getAsset({
			address: config.landERC721,
			id: tokenId.toString()
		});
		log.info(`Token with ID ${tokenId} found for address ${config.landERC721}`);
	}
	catch(error) {
		log.info(`Token with ID ${tokenId} does not exist for address ${config.landERC721}`);
	}
	return token;
}

/**
 * @dev Gets a number or all the assets for the configured collection
 *
 * @param client ImmutableXClient client instance
 * @param assetAddress address of the asset
 * @param loopNTimes number of times to request for another batch of assets
 * @return assets found in L2
 */
async function getAllAssets(client, assetAddress, loopNTimes) {
	let assets = [];
	let response;
	let cursor;

	do {
		response = await client.getAssets({
			collection: assetAddress,
			cursor
		});
		assets = assets.concat(response.result);
		cursor = response.cursor;
	}
	while(cursor && (!loopNTimes || loopNTimes-- > 1))

	if(assets.length > 0) {
		log.info(`Assets found for address ${config.landERC721}`);
	}
	else {
		log.info(`No assets found for address ${config.landERC721}`);
	}
	return assets;
}

/**
 * @dev Get L2 mint metadata
 * 
 * @param assetAddress address of the asset on L1
 * @param tokenId ID of the token
 * @return object containing `token_id`, `client_token_id` and `blueprint`
 */
async function getMint(assetAddress, tokenId) {
	const response =  await axios.get(
		`https://api.ropsten.x.immutable.com/v1/mintable-token/${assetAddress}/${tokenId}`);

	if (response.status !== 200) return null;
	return response.data;
}

/**
 * @dev Verify event's metadata against the ones on L2
 * 
 * @param network name of the network ("ropsten" or "mainnet")
 * @param client ImmutableXClient client instance
 * @param assetAddress address of the asset
 * @param filter event filters
 * @param fromBlock get events from the given block number
 * @param toBlock get events until the given block number
 * @return differences found between events and L2
 */
async function verify(network, assetAddress, filter, fromBlock, toBlock) {
	// Get PlotBought events to match information in L1/L2
	const plotBoughtEvents = await getPlotBoughtEvents(network, filter, fromBlock, toBlock);

	// Check metadata
	let assetDiff = [];
	let blueprint;
	let tokenId;
	for (const event of plotBoughtEvents) {
		blueprint = getBlueprint(event.plot);
		tokenId = typeof event.tokenId === "string" ? event.tokenId : event.tokenId.toString();
		l2Blueprint = (await getMint(assetAddress, tokenId)).blueprint;
		if (blueprint !== l2Blueprint) {
			assetDiff.push({
				tokenId,
				plotBoughtEventBlueprint: blueprint,
				l2Blueprint: l2Blueprint,				
			});
		}
	}

	if (assetDiff.length !== 0) {
		log.info("Difference found between event and L2 metadata!");
	} else {
		log.info("Metadata on the events and L2 are fully consistent!");
	}

	return assetDiff;
}

// export public module API
module.exports = {
	getImmutableXClientFromWallet,
	getImmutableXClient,
	getWalletFromMnemonic,
	getWallet,
	MintableERC721TokenType,
	ERC721TokenType,
	landSaleAbi,
	landERC721Abi,
	getLandSaleContract,
	getLandERC721Contract,
	getPlotBoughtEvents,
	getBlueprint,
	getPlotStore,
	mint_l2,
	burn,
	prepareWithdraw,
	completeWithdraw,
	getAsset,
	getAllAssets,
	verify,
}
