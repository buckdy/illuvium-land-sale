// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./ERC721Impl.sol";


/**
 * @title Land ERC721
 *
 * @notice Main interface between the blockchain and Illuvium: Zero.
 *       Models and accurately represents land in Illuvium:Zero.
 *       Each token is a piece of land (land plot) in Illuvium: Zero.
 *
 * @notice Contains metadata for the coordinates of the Land, the sub-coordinates for each Site,
 *       as well as which Region it exists in. This data gives a player or investor an informed
 *       understanding of the details of the land.
 *
 * @notice Does not contain details for each Structure on the land as this is dynamic and stored on the server.
 *       When Land is sold, the server acts as the source of truth.
 *       While this does add a modicum of reliance on non-solidity contracts,
 *       the fundamental value of the Land will always be drawn from the underlying Land NFT,
 *       which produces Fuel in the form of an ERC-20 token.
 *       This hybrid method allows for a dynamic ecosystem while still maintaining user custody.
 *
 * @notice Refer to Illuvium: Zero design documents for additional information
 *
 * @author Basil Gorin
 */
// TODO: consider NFT impl optimizations, including short token ID space, metadata store in the token ID, etc.
contract LandERC721 is ERC721Impl {
	/**
	 * @notice Land plot metadata consists of "public" fields known beforehand
	 *      when land plots are listed for sale,
	 *      and "private" randomized fields generated after the plot is bought
	 *      written on-chain during minting process
	 */
	struct Metadata {
		// TODO: add more soldoc descriptions
		// public fields stored in IPFS
		uint8 x; // TODO: uint16?
		uint8 y; // TODO: uint16?
		uint8 tier; // TODO: enum?
		string region; // TODO: map to uint8/enum

		// private fields, generated or supplied
		uint8 typ; // type // TODO: enum?
		uint8 site; // TODO: remove?
		string landMark; // TODO: map to uint8/enum?
	}

	/**
	 * @notice Metadata storage for tokens (land plots)
	 *
	 * @dev Maps token ID => token Metadata structure (see above)
	 */
	// TODO: decide if metadata exists only for existing tokens
	mapping(uint256 => Metadata) public metadata;

	/**
	 * @dev Creates/deploys Land NFT instance
	 *      with the predefined name and symbol
	 */
	// TODO: finalize token name and symbol with Illuvium
	constructor() ERC721Impl("Land", "LND") {}

	// TODO: disable minting functions without metadata or allow setting metadata separately from minting

	// TODO: add soldoc
	// TODO: add more metadata fields
	function mintWithMetadata(address _to, uint256 _tokenId, uint8 _x, uint8 _y, uint8 _tier) public {
		// mint token safely - delegate to `_safeMint`
		_safeMint(_to, _tokenId);

		// write metadata
		metadata[_tokenId] = Metadata({
			x: _x,
			y: _y,
			tier: _tier,
			region: "", // TODO
			typ: 0, // TODO
			site: 0, // TODO
			landMark: "" // TODO
		});
	}

	/**
	 * @inheritdoc ERC721
	 *
	 * @dev Overridden function is required to erase Metadata when burning
	 */
	function _burn(uint256 _tokenId) internal virtual override {
		// burn the token itself - delegate to `super._burn`
		super._burn(_tokenId);

		// erase token metadata
		delete metadata[_tokenId];
	}
}
