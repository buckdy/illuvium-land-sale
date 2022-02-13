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
 * @dev Gets wallet from provided mnemonic provided for the network
 *
 * @param network name of the network
 * @param n
 */
function getWallet(network, n = 0) {
	const mnemonic = network === "ropsten"? process.env.MNEMONIC3: process.env.MNEMONIC1;
	const provider = getProvider(network);

	return Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${n}`).connect(provider);
	;
}

/**
 * @dev Gets an instance of the IMX client given configuration for the network
 *
 * @param network name of the network
 * @param IMXClientConfig configuration object for ImmutableXClient
 * @return Instance of IMX client
 */
function getImmutableXClient(network, IMXClientConfig) {
	return ImmutableXClient.build({
		...IMXClientConfig,
		signer: getWallet(network)
	});
}

/**
 * @dev Instantiate the LandSale contract
 *
 * @param address the address of the contract in the respective network
 * @return LandSale instance
 */
function getLandSaleContract(network, address) {
	let landSale = new web3.eth.Contract(
		landSaleAbi,
		address
	);
	landSale.setProvider(getProviderWebsocket(network));
	return landSale;
}

/**
 * @dev Instantiate the LandERC721 contract
 *
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
 * @param erc721Contract the address of the collection contract on L1 in the respective network
 * @param to address to mint to
 * @param tokenId ID of the token
 * @param blueprint token metadata
 * @param minter the owner of the L1 contract and collection on L2
 * @return the mint result metadata or null if minting fails
 */
async function mint_l2(erc721Contract, to, tokenId, blueprint, minter) {
	// a token to mint - plotStorePack should be a string representation of uint256 in decimal format
	const token = {
		type: MintableERC721TokenType.MINTABLE_ERC721,
		data: {
			id: tokenId.toString(),
			// note: blueprint cannot be empty
			blueprint, // This will come in the mintingBlob to the contract mintFor function as {tokenId}:{plotStorePack}
			tokenAddress: erc721Contract,
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
		console.log(`Minting of tokenId ${tokenId} of collection ${erc721Contract} successful on L2`);
	}
	catch(error) {
		console.error(error);
		return null;
	}
	return mintResults.results[0]
}

async function getPlotBoughtEvents(network, filter = undefined, fromBlock = undefined, toBlock = undefined) {
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

// export public module API
module.exports = {
	getImmutableXClient,
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
}
