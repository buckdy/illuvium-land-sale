// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../lib/Land.sol";
import "./ERC721Impl.sol";

/**
 * @title Land ERC721
 *
 * @notice Land ERC721 (a.k.a Land Plot, Land, or Land NFT) represents land plots in Illuvium: Zero (IZ).
 *      Each token is a piece of land (land plot) on the overall world map in IZ.
 *
 * @notice Land plot is uniquely identified by its region and coordinates (x, y) within the region.
 *      There can be only one plot with the given coordinates (x, y) in a given region.
 *
 * @notice Land plot has internal coordinate system used to place the structures (off-chain).
 *      Land plot may contain "sites" with the resources,
 *      a Landmark, increasing the resource production / decreasing resource losses,
 *      or a special type of Landmark - Arena, used to host tournaments.
 *      Sites are positioned on the plot and have their own coordinates (x, y) within a plot.
 *      Number of sites depends on the land plot rarity (tier).
 *      Landmark may exist only in the rare land plots (tier 3 or higher) and resides in the center of the plot.
 *
 * @notice Land plot does not contain details on the structures, these details are stored off-chain.
 *      The fundamental value of the Land is always drawn from the underlying Land NFT,
 *      which produces Fuel in the form of an ERC20 tokens.
 *
 * @notice Land plot metadata is immutable and includes (see Land Library):
 *      - region ID (1 - 7), determines which tileset to use in game,
 *      - coordinates (x, y) on the overall world map, indicating which grid position the land sits in,
 *      - tier ID (1 - 5), the rarity of the land, tier is used to create the list of sites,
 *      - size (w, h), defines an internal coordinate system within a plot,
 *      - enumeration of sites, each site metadata including:
 *        - type ID (1 -6), defining the type of the site (Carbon, Silicon, Hydrogen, Crypton, Hyperion, Solon),
 *        - coordinates (x, y) on the land plot
 *      - landmark type ID (0 - no Landmark, 1 - Element Landmark, 2 - Fuel Landmark, 3 - Arena)
 *
 * @notice A note on region, tier, site type, and landmark type IDs.
 *      Land Plot smart contract stores region, tier, site type, and landmark type IDs as part of the
 *      land metadata on-chain, however these values are not bound to any business logic within the contract.
 *      Effectively that means that helper smart contracts, backend, or frontend applications are free to
 *      treat these value at their own decision, and may redefine the meaning.
 *
 * @notice Refer to Illuvium: Zero design documents for additional information
 *
 * @author Basil Gorin
 */
// TODO: decide if NFT contract contains the Merkle root of the valid metadata
// TODO: consider NFT impl optimizations, including short token ID space, metadata store in the token ID, etc.
contract LandERC721 is ERC721Impl {
	// Use Land Library for conversion between internal and external representations
	using Land for Land.Plot;
	using Land for Land.PlotStore;

	/**
	 * @notice Metadata storage for tokens (land plots)
	 *
	 * @dev Maps token ID => token Metadata (PlotData struct)
	 */
	mapping(uint256 => Land.PlotStore) public plots;

	/**
	 * @dev Creates/deploys Land NFT instance
	 *      with the predefined name and symbol
	 */
	// TODO: finalize token name and symbol with Illuvium
	constructor() ERC721Impl("Land", "LND") {}

	// TODO: soldoc
	function getMetadata(uint256 _tokenId) public view returns(Land.Plot memory) {
		// use Land Library to convert internal representation into the Plot view
		return plots[_tokenId].plotView();
	}

	// TODO: soldoc
	function hasMetadata(uint256 _tokenId) public view returns(bool) {
		// determine plot existence based on it's metadata stored
		return plots[_tokenId].dataPacked != 0;
	}

	// TODO: soldoc
	// TODO: decide if site and landmark data is supplied from outside or not
	function setMetadata(uint256 _tokenId, Land.Plot memory plot) public {
		// TODO: verify the access permission

		// TODO: add (regionId, x, y) uniqueness constraint
		// TODO: consider verifying internal land structure
		// TODO: consider verifying tierId matches landmark and sites
		// TODO: consider verifying sites are positioned properly

		// for existing tokens metadata can be created, but not updated
		require(!exists(_tokenId) || !hasMetadata(_tokenId), "");

		// write metadata into the storage
		plots[_tokenId] = plot.plotPacked();

		// TODO: emit an event
	}

	/**
	 * @inheritdoc ERC721
	 *
	 * @dev Overridden function is required to erase token Metadata when burning
	 */
	function _burn(uint256 _tokenId) internal virtual override {
		// burn the token itself - delegate to `super._burn`
		super._burn(_tokenId);

		// erase token metadata
		delete plots[_tokenId];
	}
}
