// import contract related utilities from ethers
const { Contract } = require("@ethersproject/contracts");

// import AuctionHouse class from Zora SDK (ZDK)
const { AuctionHouse } = require("@zoralabs/zdk");

// get ethers utility funtions
const { Wallet, providers } = require("ethers");

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
	return Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/${n}`).connect(provider);
}

async function approve_land_operator(wallet, contract_address, token_id, operator) {
    // instantiate ERC721 contract
    const erc721_contract = new Contract(contract_address, artifacts.require("LandERC721").abi, wallet);

    // approve operator
    const tx_response = await erc721_contract.approve(operator, token_id);

    // return transaction receipt
    return  await tx_response.wait();
}

async function create_auction(wallet, network_id, auction_params) {
    // initialize AuctionHouse object
    const auction_house = new AuctionHouse(wallet, network_id);

    // create auction
    const createAuctionTx = await auction_house.createAuction(
        auction_params.token_id,
        auction_params.duration,
        auction_params.reserve_price,
        auction_params.curator?? wallet.address,
        auction_params.curator_fee_percentage?? 0,
        auction_params.auction_currency?? require("@ethersproject/constants").AddressZero,
        auction_params.token_address
    )

    // get auction house tx receipt
    const receipt = await createAuctionTx.wait();

    // return auction info
    return await auction_house.fetchAuctionFromTransactionReceipt(receipt);
}

// export public module API
module.exports = {
    get_provider,
    get_wallet_from_mnemonic,
    approve_land_operator,
    create_auction,
};