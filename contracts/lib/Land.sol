// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

/**
 * @title Land Library
 *
 * @notice A library defining data structures related to land plots (used in Land ERC721 token),
 *      and functions transforming these structures between view and internal (packed) representations,
 *      in both directions.
 *
 * @notice Due to some limitations Solidity has (ex.: allocating array of structures in storage),
 *      it is convenient to separate data structures used to store data on-chain, and data structures
 *      used to present data via API/ABI, or to accept such data as an input into public API/ABI
 *
 * @author Basil Gorin
 */
// TODO: soldoc
library Land {
	/**
	 * @notice Element (Carbon, Silicon, Hydrogen) or Fuel (Crypton, Hyperion, Solon) Site,
	 *      bound to a coordinates (x, y) within the land plot
	 *
	 * @dev View only structure, used in public API/ABI, not used in on-chain storage
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
	 * @notice Land plot coordinates and rarity are predefined (stored off-chain).
	 *      Number of sites (and landmarks - 0/1) is defined by the land rarity.
	 *      Positions of sites, types of sites/landmark are randomized and determined
	 *      upon land plot creation.
	 *
	 * @dev View only structure, used in public API/ABI, not used in on-chain storage
	 */
	struct Plot {
		/// @dev Region ID defines the region on the map in IZ
		uint16 regionId;
		/// @dev x-coordinate within the region plot
		uint16 x;
		/// @dev y-coordinate within the region plot
		uint16 y;
		/// @dev Tier ID defines land rarity and number of sites within the plot
		uint8 tierId;
		/// @dev Plot width, limits the x-coordinate for the sites
		uint16 width;
		/// @dev Plot height, limits the y-coordinate for the sites
		uint16 height;
		/// @dev Landmark Type ID (1 - Element, 2 - Fuel, 3 - Arena), zero - no landmark
		uint8 landmarkTypeId;
		/// @dev Element/fuel sites within the plot
		// TODO: consider splitting into 2 arrays
		Site[] sites;
	}

	/**
	 * @notice Land Plot data structure as it is actually stored on-chain
	 *
	 * @notice Contains same data as `Plot` struct does
	 *      - `region | x | y | tierId | width | height`, concatenated into a single uint96 field
	 *      - array of sites, each site is `typeId | x | y`, concatenated into a single uint24 field
	 *
	 * @dev On-chain only structure, not used in public API/ABI
	 */
	struct PlotStore {
		/// @dev Plot data (region, x, y, tierId, width, height) tightly packed into uint96
		uint96 dataPacked;
		/// @dev Element/fuel sites within the plot tightly packed into uint24[]
		// TODO: consider splitting into 2 arrays
		uint24[] sitesPacked;
	}

	/**
	 * @dev Converts packed site data (uint24) into a `Site` view struct
	 *
	 * @dev See `sitePacked` for conversion in an opposite direction
	 *
	 * @param packed site, packed into uint24 as `typeId | x | y`
	 * @return `Site` view struct, equal to the packed site data supplied
	 */
	function siteView(uint24 packed) internal pure returns(Site memory) {
		// split the uint24 into 3 octets using the bitwise arithmetic and
		// return the result as a `Site` structure
		return Site({
			typeId: uint8(packed >> 16),
			x:      uint8(packed >> 8),
			y:      uint8(packed)
		});
	}

	/**
	 * @dev Converts `Site` view struct into packed site data (uint24)
	 *
	 * @dev See `siteView` for conversion in an opposite direction
	 *
	 * @param site `Site` view struct to convert
	 * @return site, packed into uint24 as `typeId | x | y`
	 */
	function sitePacked(Site memory site) internal pure returns(uint24) {
		// pack the `Site` structure into uint24 using the bitwise arithmetic and return
		return uint24(site.typeId) << 16 | uint16(site.x) << 8 | site.y;
	}

	/**
	 * @dev Converts and array of packed site data (uint24) into an array of
	 *      `Site` view structures
	 *
	 * @dev See `sitesPacked` for conversion in an opposite direction
	 *
	 * @param packedArr sites array, each element packed into uint24 as `typeId | x | y`
	 * @return array of `Site` view structures, equal to the packed site data array supplied
	 */
	function sitesView(uint24[] memory packedArr) internal pure returns(Site[] memory) {
		// prepare an in-memory storage for the result
		Site[] memory sites = new Site[](packedArr.length);

		// iterate over the supplied collection of sites
		for(uint256 i = 0; i < packedArr.length; i++) {
			// convert each one individually and write into allocated array
			sites[i] = siteView(packedArr[i]);
		}

		// return the allocated and filled in result array
		return sites;
	}

	/**
	 * @dev Converts an array of the `Site` view structures into an array of
	 *      packed site data items (uint24)
	 *
	 * @dev See `sitesView` for conversion in an opposite direction
	 *
	 * @param sites `Site` view struct array to convert
	 * @return sites array, each element packed into uint24 as `typeId | x | y`
	 */
	function sitesPacked(Site[] memory sites) internal pure returns(uint24[] memory) {
		// prepare an in-memory storage for the result
		uint24[] memory packedArr = new uint24[](sites.length);

		// iterate over the supplied collection of sites
		for(uint256 i = 0; i < sites.length; i++) {
			// convert each one individually and write into allocated array
			packedArr[i] = sitePacked(sites[i]);
		}

		// return the allocated and filled in result array
		return packedArr;
	}

	/**
	 * @dev Converts `PlotStore` packed data struct into a `Plot` view struct
	 *
	 * @dev See `plotPacked` for conversion in an opposite direction
	 *
	 * @param store packed plot structure to convert
	 * @return `Plot` view struct, equal to the packed plot data supplied
	 */
	function plotView(PlotStore memory store) internal pure returns(Plot memory) {
		// split the `PlotStore` into pieces using the bitwise arithmetic and
		// return the result as a `Plot` structure
		return Plot({
			landmarkTypeId: uint8(store.dataPacked >> 88),
			tierId:         uint8(store.dataPacked >> 80),
			width:         uint16(store.dataPacked >> 64),
			height:        uint16(store.dataPacked >> 48),
			regionId:      uint16(store.dataPacked >> 32),
			x:             uint16(store.dataPacked >> 16),
			y:             uint16(store.dataPacked),
			sites:      sitesView(store.sitesPacked)
		});
	}

	/**
	 * @dev Converts `Plot` view struct into a `PlotStore` packed data struct
	 *
	 * @dev See `plotView` for conversion in an opposite direction
	 *
	 * @param plot `Plot` view structure to convert
	 * @return `PlotStore` packed plot struct, equal to the view plot data supplied
	 */
	function plotPacked(Plot memory plot) internal pure returns(PlotStore memory) {
		// pack the `Plot` into `PlotStore` structure using the bitwise arithmetic and return
		return PlotStore({
			dataPacked: uint96(plot.landmarkTypeId) << 88
			          | uint88(plot.tierId) << 80
			          | uint80(plot.width) << 64
			          | uint64(plot.height) << 48
			          | uint48(plot.regionId) << 32
			          | uint32(plot.x) << 16
			          |        plot.y,
			sitesPacked: sitesPacked(plot.sites)
		});
	}
}
