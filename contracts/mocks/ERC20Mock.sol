// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../token/ERC20Impl.sol";

/**
 * @title ERC20 Mock
 *
 * @notice Zeppelin-based ERC20 Mock simulates an ERC20 token, used for testing purposes;
 *      it still has restricted access to the mint() function
 *
 * @author Basil Gorin
 */
contract ERC20Mock is IdentifiableToken, ERC20Impl {
	/**
	 * @inheritdoc IdentifiableToken
	 */
	uint256 public override TOKEN_UID = 0x9246211c0c1c75405f68424667596bc7067a6af2d90b20a6a844de948a22de33;

	/**
	 * @dev Creates/deploys an ERC20 Mock instance
	 *
	 * @param _name token name (ERC20Metadata)
	 * @param _symbol toke symbol (ERC20Metadata)
	 */
	constructor(string memory _name, string memory _symbol) ERC20Impl(_name, _symbol) {}

	// allows to modify TOKEN_UID
	function setUid(uint256 _uid) public {
		TOKEN_UID = _uid;
	}

	function transferInternal(
		address from,
		address to,
		uint256 value
	) public {
		_transfer(from, to, value);
	}

	function approveInternal(
		address owner,
		address spender,
		uint256 value
	) public {
		_approve(owner, spender, value);
	}
}
