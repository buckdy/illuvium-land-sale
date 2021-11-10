// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title Land Sale Oracle Interface
 *
 * @notice Supports the Land Sale with the ETH/ILV conversion required,
 *       marker interface is required to support ERC165 lookups
 *
 * @author Basil Gorin
 */
interface LandSaleOracle {
	/**
	 * @notice Powers the ETH/ILV Land token price conversion, used when
	 *      selling the land for sILV to determine how much sILV to accept
	 *      instead of the nominated ETH price
	 *
	 * @notice Note that sILV price is considered to be equal to ILV price
	 *
	 * @param ethOut amount of ETH sale contract is expecting to get
	 * @return ilvIn amount of sILV sale contract should accept instead
	 */
	function ethToIlv(uint256 ethOut) external view returns(uint256 ilvIn);
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
	function ethToIlv(uint256 ethOut) public view virtual override returns(uint256 ilvIn) {
		// TODO: implement
		return ethOut * 4;
	}
}
