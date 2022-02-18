// Get IMX client and token type
const {ImmutableXClient, MintableERC721TokenType, ERC721TokenType} = require("@imtbl/imx-sdk");

// Get required ABIs
const landSaleAbi = require("../../artifacts/contracts/protocol/LandSale.sol/LandSale.json").abi;
const landERC721Abi = require("../../artifacts/contracts/token/LandERC721.sol/LandERC721.json").abi;

// Get pack from land_lib JS implementations
const {
	pack,
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
 * @param plotStore PlotStore object
 * @return decimal string representation of packed data
 */
function getBlueprint(plotStore) {
	return pack(plotStore).toString(10);
}

/**
 * @dev Mints an NFT on L2 (IMX)
 *
 * @param client ImmutableXClient -- should be the owner of the assetAddress contract
 * @param assetAddress address of the asset to mint
 * @param to address of the owner of the address to be minted
 * @param tokenId ID of the token
 * @param blueprint token metadata
 * @return the mint result metadata or null if minting fails
 */
 async function mint_l2(client, assetAddress, to, tokenId, blueprint) {
	// a token to mint - plotStorePack should be a string representation of uint256 in decimal format
	const token = {
		id: tokenId.toString(),
		// note: blueprint cannot be empty
		blueprint, // This will come in the mintingBlob to the contract mintFor function as {tokenId}:{plotStorePack}
	};

	log.info("Minting on L2...");
	const mintResults = await client.mintV2([
		{
			users: [
				{
					etherKey: to.toLowerCase(),
					tokens: [token]
				}
			],
			contractAddress: assetAddress.toLowerCase()
		}
	]);
	log.info(`Minting of tokenId ${tokenId} of collection ${assetAddress.toLowerCase()} successful on L2`);

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

	const deletedToken = await client.burn({
		quantity: "1",
		sender: client.address.toLowerCase(),
		token,
	});
	log.info(`Token ID ${tokenId} of collection contract ${config.landERC721} successfully deleted.`);

	return deletedToken;
}

async function getPlotBoughtEvents(network, filter, fromBlock, toBlock) {
	// Get configuration for given network
	const config = Config(network);

	// Get landSale contract instance
	const landSale = getLandSaleContract(config.landSale);

	// Get past PlotBought events
	const plotBoughtObjs = await landSale.getPastEvents("PlotBought", {
		filter,
		fromBlock,
		toBlock,
	});

	// Populate return array with formatted event topics
	const eventsMetadata = new Array();
	plotBoughtObjs.forEach(plotBought => {
		const returnValues = plotBought.returnValues
		eventsMetadata.push({
			blockNumber: plotBought.blockNumber,
			buyer: returnValues._by,
			tokenId: returnValues._tokenId,
			sequenceId: returnValues._sequenceId,
			plot: returnValues._plot
		});
	})

	return eventsMetadata;
}

/**
 * @dev Prepare asset for withdrawal
 *
 * @param client ImmutableXClient with token owner as signer
 * @param assetAddress address of the asset to withdraw
 * @param tokenId ID of the token
 * @return withdrawal metadata
 */
 async function prepareWithdraw(client, assetAddress, tokenId) {
	const withdrawalData = await client.prepareWithdrawal({
		user: client.address.toLowerCase(),
		quantity: "1", // Always one
		token: {
			type: ERC721TokenType.ERC721,
			data: {
				tokenId,
				tokenAddress: assetAddress.toLowerCase()
			}
		}
	});

	if (withdrawalData.includes("Error")) {
		throw withdrawalData;
	}

	log.info(`Withdrawal process started for token ID ${tokenId} of collection contract ${assetAddress.toLowerCase()}`);

	return withdrawalData;
}

/**
 * @dev Complete withdrawal, asset status needs to be "withdrawable"
 *
 * @param client ImmutableXClient with token owner as signer
 * @param assetAddress address of the asset to withdraw
 * @param tokenId ID of the token
 * @returns withdrawal completion metadata
 */
async function completeWithdraw(client, assetAddress, tokenId) {
	const completedWithdrawal = client.completeWithdrawal({
		starkPublicKey: client.starkPublicKey.toLowerCase(),
		token: {
			type: ERC721TokenType.ERC721,
			data: {
				tokenId,
				tokenAddress: assetAddress.toLowerCase()
			}
		}
	});
	log.info(`Token ID ${tokenId} of collection contract ${assetAddress.toLowerCase()} successfully withdrawn.`);

	if (completeWithdraw.includes("Error")) {
		throw completeWithdraw;
	}

	return completedWithdrawal;
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
	mint_l2,
	burn,
	prepareWithdraw,
	completeWithdraw,
}
