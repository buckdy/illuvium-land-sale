// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../lib/Land.sol";

/**
 * @title Land ERC721 Metadata
 *
 * @notice Defines metadata-related capabilities for LandERC721 token.
 *      This interface should be treated as a definition of what metadata is for LandERC721,
 *      and what operations are defined/allowed for it.
 *
 * @author Basil Gorin
 */
interface LandERC721Metadata {
	/**
	 * @notice Presents token metadata in a well readable form, as `Land.Plot` struct;
	 *      metadata is stored on-chain tightly packed, in the format easily readable
	 *      only for machines, this function converts it to a more human-readable form
	 *
	 * @param _tokenId token ID to query and convert metadata for
	 * @return token metadata as a `Land.Plot` struct
	 */
	function getMetadata(uint256 _tokenId) external view returns(Land.Plot memory);

	/**
	 * @notice Verifies if token has its metadata set on-chain; for the tokens
	 *      in existence metadata is immutable, it can be set once, and not updated
	 *
	 * @dev If `exists(_tokenId) && hasMetadata(_tokenId)` is true, `setMetadata`
	 *      for such a `_tokenId` will always throw
	 *
	 * @param _tokenId token ID to check metadata existence for
	 * @return true if token ID specified has metadata associated with it
	 */
	function hasMetadata(uint256 _tokenId) external view returns(bool);

	/**
	 * @dev Sets/updates token on-chain metadata;
	 *      metadata is presented as Land.Plot struct, and is stored on-chain
	 *      as Land.PlotStore struct
	 *
	 * @dev The metadata supplied is validated to satisfy several constraints:
	 *      - (regionId, x, y) uniqueness
	 *      - non-intersection of the sites coordinates within a plot
	 *
	 * @dev Metadata for non-existing tokens can be set and updated unlimited
	 *      amount of times without any restrictions (except the constraints above)
	 * @dev Metadata for an existing token can only be set, it cannot be updated
	 *      (`setMetadata` will throw if metadata already exists)
	 *
	 * @param _tokenId token ID to set/updated the metadata for
	 * @param _plot token metadata to be set for the token ID
	 */
	function setMetadata(uint256 _tokenId, Land.Plot memory _plot) external;

	/**
	 * @dev Removes token metadata
	 *
	 * @param _tokenId token ID to remove metadata for
	 */
	function removeMetadata(uint256 _tokenId) external;

	/**
	 * @dev Mints the token and assigns the metadata supplied
	 *
	 * @dev Creates new token with the token ID specified
	 *      and assigns an ownership `_to` for this token
	 *
	 * @dev Unsafe: doesn't execute `onERC721Received` on the receiver.
	 *      Consider minting with `safeMint` (and setting metadata before),
	 *      for the "safe mint" like behavior
	 *
	 * @param _to an address to mint token to
	 * @param _tokenId token ID to mint and set metadata for
	 * @param _plot token metadata to be set for the token ID
	 */
	function mintWithMetadata(address _to, uint256 _tokenId, Land.Plot memory _plot) external;
}
