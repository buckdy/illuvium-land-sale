// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../protocol/LandSale.sol";

/**
 * @title Land Sale Mock
 *
 * @dev Allows to override now32() function and test time-dependent logic
 *
 * @author Basil Gorin
 */
contract LandSaleMock is LandSale {
	/// @dev overridden value to use as now32()
	uint32 private _now32;

	/// @dev deploys/creates a mock
	constructor(address _nft, address _sIlv, address _oracle) LandSale(_nft, _sIlv, _oracle) {}

	/// @dev overrides now32()
	function setNow32(uint32 value) public {
		_now32 = value;
	}

	/// @inheritdoc LandSale
	function now32() public view override returns(uint32) {
		return _now32 > 0? _now32: super.now32();
	}
}
