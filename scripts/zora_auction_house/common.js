// get ethers utility functions
const {Wallet, providers, Contract} = require("ethers");

/**
 * @dev Get InfuraProvider instance for given `network`
 *
 * @param network name of the network
 * @param infura_key infura api key
 * @return instantiated InfuraProvider object
 */
function get_provider(network, infura_key) {
	return new providers.InfuraProvider(network, infura_key);
}

/**
 * @dev Get wallet from mnemonic
 *
 * @param network name of the network
 * @param infura_key Infura project id
 * @param mnemonic mnemonic to generate the HDWallet from
 * @param n address index as defined in BIP-44 spec
 * @return ethers wallet instance
 */
function get_wallet_from_mnemonic(network, infura_key, mnemonic, n = 0) {
	const provider = get_provider(network, infura_key);
	return Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${n}`).connect(provider);
}

/**
 * @dev approve `operator` to transfer the LandERC721 token (land)
 *
 * @param wallet ethers.Wallet instance
 * @param contract_address LandERC721 contract address
 * @param token_id ID of the land
 * @param operator the operator address to approve allowance
 * @param overrides ethers.Contract overrides
 * @return transaction receipt
 */
async function approve_land_operator(wallet, contract_address, token_id, operator, overrides) {
	// instantiate ERC721 contract
	const erc721_contract = new Contract(
		contract_address,
		artifacts.require("LandERC721").abi,
		wallet
	);

	// approve operator
	const tx_response = await erc721_contract.approve(operator, token_id, overrides);

	// return transaction receipt
	return await tx_response.wait();
}

/**
 * @dev Create an auction on Zora's Auction House for the given network
 *
 * @param wallet ethers.Wallet instance
 * @param network_id chain ID of the network
 * @param auction_params object containing the params specified in
 *  "https://docs.zora.co/docs/developer-tools/zdk/auction-house#create-an-auction"
 * @param overrides ethers.Contract overrides
 * @return auction metadata
 */
async function create_auction(wallet, network_id, auction_params, overrides) {
// import AuctionHouse class from Zora SDK (ZDK)
	const {AuctionHouse} = require("@zoralabs/zdk");

	// initialize AuctionHouse and Zora objects
	const auction_house = new AuctionHouse(wallet, network_id);

	// create auction
	const createAuctionTx = await auction_house.auctionHouse.createAuction(
		auction_params.token_id,
		auction_params.token_address,
		auction_params.duration,
		auction_params.reserve_price,
		auction_params.curator ?? wallet.address,
		auction_params.curator_fee_percentage ?? 0,
		auction_params.auction_currency ?? require("@ethersproject/constants").AddressZero,
		overrides
	);

	// get auction house tx receipt
	const receipt = await createAuctionTx.wait();

	// Get auction info and return (SDK is using a different version of TransactionReceipt)
	for(const log of receipt.logs) {
		const description = auction_house.auctionHouse.interface.parseLog(log);
		if(log.address === auction_house.auctionHouse.address && description.values.auctionId) {
			const auction_info = await auction_house.fetchAuction(description.values.auctionId);
			return {
				auction_id: description.values.auctionId.toString(),
				token_id: auction_info.tokenId.toString(),
				token_contract: auction_info.tokenContract,
				token_owner: auction_info.tokenOwner,
				approved: auction_info.approved,
				amount: auction_info.amount.toString(),
				duration: auction_info.duration.toString(),
				first_bid_time: auction_info.firstBidTime.toString(),
				reserve_price: auction_info.reservePrice.toString(),
				curator: auction_info.curator,
				curator_fee_percentage: auction_info.curatorFeePercentage,
				bidder: auction_info.bidder,
				auction_currency: auction_info.auctionCurrency,
			}
		}
	}
	return null;
}

// export public module API
module.exports = {
	get_provider,
	get_wallet_from_mnemonic,
	approve_land_operator,
	create_auction,
};
