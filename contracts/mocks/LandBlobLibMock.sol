// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../lib/LandBlobLib.sol";

/**
 * @title Land Blob Library Mock
 *
 * @notice Used to test Land Blob Library, by exposing its internal functions
 *
 * @author Basil Gorin
 */
contract LandBlobLibMock {
	/**
	 * @dev Simplified version of StringUtils.atoi to convert a bytes string
	 *      to unsigned integer using the ten as a base
	 * @dev Stops on invalid input (wrong character for base ten) and returns
	 *      the position within a string where the character was encountered
	 *
	 * @dev Throws if input string contains a number bigger than uint256
	 *
	 * @param a numeric string to convert
	 * @return i a number representing given string
	 * @return p an index when the conversion stopped
	 */
	function atoi(bytes calldata a) public pure returns (uint256 i, uint256 p) {
		// delegate to internal impl
		return LandBlobLib.atoi(a);
	}

	/**
	 * @dev Parses a bytes string formatted as `{tokenId}:{metadata}`, containing `tokenId`
	 *      and `metadata` encoded as decimal strings
	 *
	 * @dev Throws if either `tokenId` or `metadata` strings are numbers bigger than uint256
	 *
	 * @param mintingBlob bytes string input formatted as `{tokenId}:{metadata}`
	 * @return tokenId extracted `tokenId` as an integer
	 * @return metadata extracted `metadata` as an integer
	 */
	function parseMintingBlob(bytes calldata mintingBlob) public pure returns (uint256 tokenId, uint256 metadata) {
		// delegate to internal impl
		return LandBlobLib.parseMintingBlob(mintingBlob);
	}
}
