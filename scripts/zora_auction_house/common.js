// get ethers utility functions
const {Wallet, providers, Contract} = require("ethers");

// erc20 partial abi (approve function)
const ERC20_APPROVE_PARTIAL_ABI = [
	{
		"inputs": [
			{
			"internalType": "address",
			"name": "spender",
			"type": "address"
			},
			{
			"internalType": "uint256",
			"name": "amount",
			"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
			"internalType": "bool",
			"name": "",
			"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

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

	// approve operator (ERC721)
	const tx_response = await erc721_contract.approve(operator, token_id, overrides);

	// return transaction receipt
	return await tx_response.wait();
}

/**
 * @dev approve `operator` to transfer arbitrary ERC20 tokens
 *
 * @param wallet ethers.Wallet instance
 * @param contract_address LandERC721 contract address
 * @param amount quantity of tokens to transfer
 * @param spender the spender address to approve allowance
 * @param overrides ethers.Contract overrides
 * @return transaction receipt
 */
async function approve_erc20_operator(wallet, contract_address, amount, spender, overrides) {
	// instantiate ERC20 contract
	const erc20_contract = new Contract(
		contract_address,
		ERC20_APPROVE_PARTIAL_ABI,
		wallet
	);

	// approve operator (ERC20)
	const tx_response = await erc20_contract.approve(
		spender, 
		amount, 
		overrides
	);

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
	const create_auction_tx = await auction_house.auctionHouse.createAuction(
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
	const receipt = await create_auction_tx.wait();

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

/**
 * @dev Create a bid on a auction on Zora's Auction House for the given network
 * 
 * @dev Bid must be higher then auction's `reservePrice` and 15% higher than the previous
 * 	highest bid
 * 
 * @param wallet ethers.Wallet instance
 * @param network_id chain ID of the network
 * @param auction_id ID of the auction to cancel
 * @param amount bid amount in the given auction's currency
 * @param overrides ethers.Contract overrides
 * @return tx receipt
 */
async function create_bid(wallet, network_id, auction_id, amount, overrides) {
	// import AuctionHouse class from Zora SDK (ZDK)
	const {AuctionHouse} = require("@zoralabs/zdk");

	// initialize AuctionHouse and Zora objects
	const auction_house = new AuctionHouse(wallet, network_id);

	// create bid
	const create_bid_tx = await auction_house.auctionHouse.createBid(
		auction_id,
		amount,
		overrides
	);

	// wait for transaction and return receipt
	return await create_bid_tx.wait();
}

/**
 * @dev Cancel an auction on Zora's Auction House for the given network
 * 
 * @dev The auction can only be cancelled by the token owner or curator
 * 
 * @dev In order to cancel an auction, it must not've been initiated, i.e.,
 * 	no bids have been validated
 * 
 * @param wallet ethers.Wallet instance
 * @param network_id chain ID of the network
 * @param auction_id ID of the auction to cancel
 * @param overrides ethers.Contract overrides
 * @return tx receipt
 */
async function cancel_auction(wallet, network_id, auction_id, overrides) {
	// import AuctionHouse class from Zora SDK (ZDK)
	const {AuctionHouse} = require("@zoralabs/zdk");

	// initialize AuctionHouse and Zora objects
	const auction_house = new AuctionHouse(wallet, network_id);

	// cancel auction
	const cancel_auction_tx = await auction_house.AuctionHouse.cancelAuction(
		auction_id,
		overrides
	);

	// wait for transaction and return receipt
	return await cancel_auction_tx.wait();
}

/**
 * @dev End an auction on Zora's Auction House for the given network
 * 
 * @dev Trade auctioned ERC721 token for the highest bid amount in the given `auctionCurrency`
 * 
 * @dev Auction time must be over to sucessfully run this function
 * 
 * @param wallet ethers.Wallet instance
 * @param network_id chain ID of the network
 * @param auction_id ID of the auction to cancel
 * @param overrides ethers.Contract overrides
 * @return tx receipt
 */
async function end_auction(wallet, network_id, auction_id, overrides) {
	// import AuctionHouse class from Zora SDK (ZDK)
	const {AuctionHouse} = require("@zoralabs/zdk");

	// initialize AuctionHouse and Zora objects
	const auction_house = new AuctionHouse(wallet, network_id);

	// end auction
	const end_auction_tx = await auction_house.auctionHouse.endAuction(
		auction_id,
		overrides
	);

	// wait for transaction and return receipt
	return await end_auction_tx.wait();
}

/**
 * @dev Fetch an auction's metadata
 * 
 * @param wallet ethers.Wallet instance
 * @param network_id chain ID of the network
 * @param auction_id ID of the auction to fetch
 * @return Auction object
 */
async function fetch_auction(wallet, network_id, auction_id) {
	// import AuctionHouse class from Zora SDK (ZDK)
	const {AuctionHouse} = require("@zoralabs/zdk");

	// initialize AuctionHouse and Zora objects
	const auction_house = new AuctionHouse(wallet, network_id);

	// return Auction instance
	return await auction_house.fetchAuction(auction_id);
}


// export public module API
module.exports = {
	get_provider,
	get_wallet_from_mnemonic,
	approve_land_operator,
	approve_erc20_operator,
	create_auction,
	create_bid,
	cancel_auction,
	end_auction,
	fetch_auction,
};
