// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../utils/LandSaleOracle.sol";

/**
 * @title Land Sale Oracle Implementation
 *
 * @notice Supports the Land Sale with the ETH/ILV conversion required
 *
 * @author Basil Gorin
 */
contract LandSaleOracleMock is LandSaleOracle, IERC165 {
	// initial conversion rate is 1 ETH = 4 ILV
	uint256 ethOut = 1;
	uint256 ilvIn = 4;

	/**
	 * @inheritdoc IERC165
	 */
	function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
		// determine and return the interface support
		return interfaceID == type(LandSaleOracle).interfaceId;
	}

	// updates the conversion rate
	function setRate(uint256 _ethOut, uint256 _ilvIn) public {
		ethOut = _ethOut;
		ilvIn = _ilvIn;
	}

	/**
	 * @inheritdoc LandSaleOracle
	 */
	function ethToIlv(uint256 _ethOut) public view virtual override returns(uint256 _ilvIn) {
		return _ethOut * ilvIn / ethOut;
	}
}
