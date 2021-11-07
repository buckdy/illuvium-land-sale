// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../utils/LandSaleOracle.sol";

/**
 * @title Land Sale Oracle Implementation
 *
 * @notice Supports the Land Sale with the USD/ETH and USD/ILV conversion required
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
	function usdToEth(uint256 usdOut) public view virtual override returns(uint256 ethIn) {
		// TODO: implement via exchange rate setter
		return usdOut;
	}

	/**
	 * @inheritdoc LandSaleOracle
	 */
	function usdToIlv(uint256 usdOut) public view virtual override returns(uint256 ilvIn) {
		// TODO: implement via exchange rate setter
		return usdOut;
	}
}
