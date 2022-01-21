// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../protocol/LandSale.sol";

/**
 * @title Land Sale Mock
 *
 * @dev Allows to override now32() function and test time-dependent logic
 * @dev Allows to override isActive() and test how it affects the sale
 *
 * @author Basil Gorin
 */
contract LandSaleMock is LandSale {
	/// @dev overridden value to use as now32()
	uint32 private _now32;

	/// @dev Defines if isActive() should be overridden
	bool private _activeStateOverride;

	/// @dev Overrides isActive() if `_activeStateOverride` is true
	bool private _activeStateValue;

	/// @dev deploys/creates a mock
	constructor(address _nft, address _sIlv, address _oracle) LandSale(_nft, _sIlv, _oracle) {}

	/// @dev overrides now32()
	function setNow32(uint32 value) public {
		_now32 = value;
	}

	/// @inheritdoc LandSale
	function now32() public view override returns (uint32) {
		return _now32 > 0? _now32: super.now32();
	}

	/// @inheritdoc LandSale
	function isActive() public view override returns (bool) {
		// override state if required, delegate to super otherwise
		return _activeStateOverride ? _activeStateValue : super.isActive();
	}

	/// @dev Sets isActive() override
	function setStateOverride(bool _value) public {
		_activeStateOverride = true;
		_activeStateValue = _value;
	}

	/// @dev Removes isActive() override
	function removeStateOverride() public {
		_activeStateOverride = false;
	}

}
