// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../protocol/LandSale.sol";

/// @dev Allows to override now32() function and test time-dependent logic
contract LandSaleMock is LandSale {
	/// @dev overridden value to use as now32()
	uint32 private _now32;

	/// @dev deploys/creates a mock
	constructor(address _nft, address _sIlv) LandSale(_nft, _sIlv) {}

	/// @dev overrides now32()
	function setNow32(uint32 value) public {
		_now32 = value;
	}

	/// @inheritdoc LandSale
	function now32() public view override returns(uint32) {
		return _now32;
	}
}
