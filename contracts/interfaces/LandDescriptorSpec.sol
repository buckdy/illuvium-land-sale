// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./LandERC721Spec.sol";

/**
 * @title Land Descriptor interface
 *
 * @dev Defines parameters required to generate the dynamic tokenURI based on
 *      land metadata.
 */

interface LandDescriptor {
		/**
		 * @dev Creates a base64 uri with the land svg image data embedded
		 * 
		 * @param _landContract ERC721 Land NFT contract instance
		 * @param _tokenId ERC721 token id supplied
		 */
		 function tokenURI(LandERC721Metadata _landContract, uint256 _tokenId) external view returns (string memory);
}
