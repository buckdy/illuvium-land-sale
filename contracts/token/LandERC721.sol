// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

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
 * @notice Land plot metadata is immutable and includes:
 *      - region ID (1 - 7), determines which tileset to use in game,
 *      - coordinates (x, y) on the overall world map, indicating which grid position the land sits in,
 *      - tier ID (1 - 5), the rarity of the land, tier is used to create the list of sites,
 *      - size (w, h), defines an internal coordinate system within a plot,
 *      - enumeration of sites, each site metadata including:
 *        - type ID (1 -6), defining the type of the site (Carbon, Silicon, Hydrogen, Crypton, Hyperion, Solon)
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
// TODO: consider NFT impl optimizations, including short token ID space, metadata store in the token ID, etc.
contract LandERC721 is ERC721Impl {
	/**
	 * @notice Element (Carbon, Silicon, Hydrogen) or Fuel (Crypton, Hyperion, Solon) Site,
	 *      bound to a coordinates (x, y) within the land plot
	 */
	struct Site {
		/// @dev Site type (1 - Carbon, 2 - Silicon, 3 - Hydrogen, 4 - Crypton, 5 - Hyperion, 6 - Solon)
		// TODO: consider using enums: does it make usage more convenient?
		uint8 typeId;
		/// @dev x-coordinate within a plot
		uint8 x;
		/// @dev y-coordinate within a plot
		uint8 y;
	}

	/**
	 * @notice Land Plot, bound to a coordinates (x, y) within the region,
	 *      with a rarity defined by the tier ID, sites, and (optionally)
	 *      a landmark, positioned on the internal coordinate grid of the
	 *      specified width (x) and length (y) within a plot.
	 *
	 // TODO: this is not part of NFT, move this soldoc out of here:
	 * @notice Land plot coordinates and rarity are predefined (stored off-chain).
	 *      Number of sites (and landmarks - 0/1) is defined by the land rarity.
	 *      Positions of sites, types of sites/landmark are randomized and determined
	 *      upon land plot creation.
	 */
	struct LandPlot {
		/// @dev Region ID defines the region on the map in IZ
		uint8 regionId;
		/// @dev x-coordinate within the region plot
		uint16 x;
		/// @dev y-coordinate within the region plot
		uint16 y;
		/// @dev Tier ID defines land rarity and number of sites within the plot
		uint8 tierId;
		/// @dev Landmark Type ID (1 - Element, 2 - Fuel, 3 - Arena), zero - no landmark
		uint8 landmarkTypeId;
		/// @dev Element/fuel sites within the plot represented as uint24
		// TODO: consider splitting into 2 arrays
		uint24[] sites;
	}

	/**
	 * @notice Metadata storage for tokens (land plots)
	 *
	 * @dev Maps token ID => token Metadata (LandPlot struct)
	 */
	// TODO: decide if metadata exists only for existing tokens
	mapping(uint256 => LandPlot) public plots;

	/**
	 * @dev Creates/deploys Land NFT instance
	 *      with the predefined name and symbol
	 */
	// TODO: finalize token name and symbol with Illuvium
	constructor() ERC721Impl("Land", "LND") {}

	// TODO: disable minting functions without metadata or allow setting metadata separately from minting

	// TODO: add soldoc
	// TODO: add more metadata fields
	function mintWithMetadata(
		address _to,
		uint256 _tokenId,
		uint8 _regionId,
		uint16 _x,
		uint16 _y,
		uint8 _tierId
		// TODO: decide if site and landmark data is supplied from outside or not
	) public {
		// mint token safely - delegate to `_safeMint`
		_safeMint(_to, _tokenId);

		// write metadata
		plots[_tokenId] = LandPlot({
			regionId: _regionId,
			x: _x,
			y: _y,
			tierId: _tierId,
			landmarkTypeId: 0, // TODO: init
			sites: new uint24[](0) // TODO: init
		});
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
