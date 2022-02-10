// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title Land Blob Library
 *
 * @dev A library to support `mintingBlob` parsing supplied into `mintFor`
 *      NFT minting function executed when withdrawing an NFT from L2 into L1
 *
 * @dev The blob supplied is a bytes string having the `{tokenId}:{metadata}`
 *      format which needs to be parsed more effectively than imtbl/imx-contracts
 *      suggests.
 *      This library implements the `parseMintingBlob` function which
 *      iterates over the blob only once
 *
 * @author Basil Gorin
 */
library LandBlobLib {
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
	 * @return p an index where the conversion stopped
	 */
	function atoi(bytes calldata a) internal pure returns (uint256 i, uint256 p) {
		// iterate over the string (bytes buffer)
		for(p = 0; p < a.length; p++) {
			// check if digit is valid and meets the base 10
			if(uint8(a[p]) < 0x30 || uint8(a[p]) >= 0x3A) {
				// we're done, parsing stops
				break;
			}

			// move to the next digit slot
			i *= 10;

			// extract the digit and add digit to the result
			i += uint8(a[p]) - 0x30;
		}

		// return the result
		return (i, p);
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
	function parseMintingBlob(bytes calldata mintingBlob) internal pure returns (uint256 tokenId, uint256 metadata) {
		// indexes where the string parsing stops (when `atoi` reaches the "}")
		uint256 p1;
		uint256 p2;

		// TODO: first character is expected to be an opening curly bracket "{"
		//require(uint8(mintingBlob[0]) == 0x7B, "{ expected");

		// read the `tokenId` value, note that p1 index is within the sliced blob (1)
		(tokenId, p1) = atoi(mintingBlob[1:]);

		// TODO: break character is expected to be a closing curly bracket
		//require(uint8(mintingBlob[p1 + 1]) == 0x7D, "} expected");
		// TODO: next character is expected to be a column
		//require(uint8(mintingBlob[p1 + 2]) == 0x3A, ": expected");
		// TODO: next character is expected to be a column
		//require(uint8(mintingBlob[p1 + 3]) == 0x7B, "{ expected");

		// read the `metadata` value, note that p2 index is within the sliced blob (p1 + 4)
		(metadata, p2) = atoi(mintingBlob[p1 + 4:]);

		// TODO: break character is expected to be a closing curly bracket
		//require(uint8(mintingBlob[p1 + p2 + 4]) == 0x7D, "} expected");

		// return the result
		return (tokenId, metadata);
	}


}
