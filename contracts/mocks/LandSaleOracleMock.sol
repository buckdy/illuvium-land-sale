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
	/**
	 * @inheritdoc IERC165
	 */
	function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
		// determine and return the interface support
		return interfaceID == type(LandSaleOracle).interfaceId;
	}

	/**
	 * @inheritdoc LandSaleOracle
	 */
	function ethToIlv(uint256 ethOut) public view virtual override returns(uint256 ilvIn) {
		// TODO: implement
		return ethOut * 4;
	}
}
