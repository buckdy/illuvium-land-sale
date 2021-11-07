// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title Land Sale Oracle Interface
 *
 * @notice Supports the Land Sale with the USD/ETH and USD/ILV conversion required,
 *       marker interface is required to support ERC165 lookups
 *
 * @author Basil Gorin
 */
interface LandSaleOracle {
	/**
	 * @notice Powers the USD/ETH Land token price conversion, used when
	 *      selling the land for ETH to determine how much ETH to accept
	 *      instead of the nominated USD price
	 *
	 * @param usdOut amount of USD sale contract is expecting to get
	 * @return ethIn amount of ETH sale contract should accept instead
	 */
	function usdToEth(uint256 usdOut) external view returns(uint256 ethIn);

	/**
	 * @notice Powers the USD/ILV Land token price conversion, used when
	 *      selling the land for sILV to determine how much sILV to accept
	 *      instead of the nominated USD price
	 *
	 * @notice Note that sILV price is considered to be equal to ILV price
	 *
	 * @param usdOut amount of USD sale contract is expecting to get
	 * @return ilvIn amount of sILV sale contract should accept instead
	 */
	function usdToIlv(uint256 usdOut) external view returns(uint256 ilvIn);
}

/**
 * @title Land Sale Oracle Implementation
 *
 * @notice Supports the Land Sale with the USD/ETH and USD/ILV conversion required
 *
 * @author Basil Gorin
 */
contract LandSaleOracleImpl is LandSaleOracle, IERC165 {
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
		// TODO: implement
		return usdOut;
	}

	/**
	 * @inheritdoc LandSaleOracle
	 */
	function usdToIlv(uint256 usdOut) public view virtual override returns(uint256 ilvIn) {
		// TODO: implement
		return usdOut;
	}
}
