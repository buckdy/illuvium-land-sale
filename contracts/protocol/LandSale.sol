// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../token/LandERC721.sol";

/**
 * @title Land Sale
 *
 * @notice Enables Land NFT sale via dutch auction mechanism
 *
 * @notice The proposed volume of land is approximately 100k plots, split amongst the 7 regions.
 *      This would be released over a series of staggered sales with the first sale featuring about
 *      10% of the total land. These plots would be geographically linked in their region,
 *      but each region would be isolated from the others due to the nature of the planet where they exist.
 *
 * @notice Land plots that are nearby each other would become more valuable to the owners of such plots
 *      because expansion may require plots to be merged into giant cities that allow players extra
 *      functionality in future Illuvium games.
 *
 * @author Basil Gorin
 */
// TODO: add implementation details soldoc
contract LandSale {
	/**
	 * @notice Deployed LandERC721 token address, used to mint the tokens
	 *      when they are bought via the sale
	 */
	address public immutable tokenAddress;

	// TODO: sale params will be changed and documented
	uint32 t0;
	uint32 t1;
	uint96 p0;
	uint96 p1;

	// TODO: store (and use) metadata merkle tree root

	// TODO: add a funds withdrawal mechanism (or just send to the wallet)

	// TODO: soldoc after init params are defined properly
	constructor(address _token, uint32 _t0, uint32 _t1, uint96 _p0, uint96 _p1) {
		// TODO: input validation

		// init smart contract state: set the parameters required
		tokenAddress = _token;
		t0 = _t0;
		t1 = _t1;
		p0 = _p0;
		p1 = _p1;
	}

	// TODO: add soldoc
	function tokenPrice(uint32 tokenId, uint32 t) public view returns(uint96) {
		// TODO: obtain auction bounds and price for the token ID provided
		// calculate the price based on the params - delegate to `price`
		return price(t0, t1, t, p0, p1);
	}

	/**
	 * @dev Calculates auction price in the given moment for the sale parameters given.
	 * @dev Doesn't check the `_t0 < _t1` and `_p0 > _p1` constraints.
	 *      It is in caller responsibility to ensure them otherwise result may not be as expected.
	 *
	 * @param _t0 auction start time
	 * @param _t1 auction end time
	 * @param _t time of interest / time to query the price for
	 * @param _p0 initial price
	 * @param _p1 final price
	 * @return price in time `t` according to formula `p = p0 - (t - t0) * (p0 - p1) / (t1 - t0)`
	 */
	function price(uint32 _t0, uint32 _t1, uint32 _t, uint96 _p0, uint96 _p1) public pure returns(uint96) {
		// if current time `t` is lower then start time `t0`
		// TODO: should this throw instead?
		if(_t < _t0) {
			// return initial price `p0`
			return _p0;
		}
		// if current time `t` is greater then end time `t1`
		// TODO: should this throw instead?
		if(_t > _t1) {
			// return the final price `p0`
			return _p1;
		}

		// otherwise calculate the price

		// convert all numbers into uint256 to get rid of possible arithmetic overflows
		uint256 t0 = uint256(_t0);
		uint256 t1 = uint256(_t1);
		uint256 t  = uint256(_t);
		uint256 p0 = uint256(_p0);
		uint256 p1 = uint256(_p1);

		// apply formula and return TODO: round down to be multiple of 1 Gwei?
		return uint96(p0 - (t - t0) * (p0 - p1) / (t1 - t0));
	}


	// TODO: do we need to pass all the params as bytes32 and parse them accordingly?
	// TODO: add merkle proof to the list of the params
	function buy(uint32 tokenId, uint8 x, uint8 y, uint8 tier) public payable {
		// determine current token price
		uint96 p = tokenPrice(tokenId, now32());

		// ensure amount of ETH send
		// TODO: handle the payment and change
		require(msg.value == p, "incorrect  value");

		// TODO: validate x, y, tier, and other metadata fields via merkle proof

		// mint the token - delegate to `mintWithMetadata`
		LandERC721(tokenAddress).mintWithMetadata(msg.sender, tokenId, x, y, tier);

		// TODO: emit an event
	}

	/**
	 * @dev Testing time-dependent functionality may be difficult;
	 *      we override time in the helper test smart contract (mock)
	 *
	 * @return `block.timestamp` in mainnet, custom values in testnets (if overridden)
	 */
	function now32() public view virtual returns (uint32) {
		// return current block timestamp
		return uint32(block.timestamp);
	}
}
