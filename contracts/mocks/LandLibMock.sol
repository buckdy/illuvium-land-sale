// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../lib/LandLib.sol";

/**
 * @title Land Library Mock
 *
 * @notice Used to test Land Library, by exposing its internal functions
 *
 * @author Basil Gorin
 */
contract LandLibMock {
	/**
	 * @dev Expands `PlotStore` data struct into a `PlotView` view struct
	 *
	 * @dev Derives internal land structure (resource sites the plot has)
	 *      from Number of Element/Fuel Sites, Plot Size, and Seed;
	 *      Generator Version is not currently used
	 *
	 * @param store on-chain `PlotStore` data structure to expand
	 * @return `PlotView` view struct, expanded from the on-chain data
	 */
	function plotView(LandLib.PlotStore memory store) public pure returns (LandLib.PlotView memory) {
		// delegate to internal impl
		return LandLib.plotView(store);
	}

	/**
	 * @dev Based on the random seed, tier ID, and plot size, determines the
	 *      internal land structure (resource sites the plot has)
	 *
	 * @dev Function works in a deterministic way and derives the same data
	 *      for the same inputs; the term "random" in comments means "pseudo-random"
	 *
	 * @param seed random seed to consume and derive the internal structure
	 * @param elementSites number of element sites plot has
	 * @param fuelSites number of fuel sites plot has
	 * @param plotSize size of the land plot to derive internal structure for
	 * @param siteSize implied size of the resource sites
	 * @return sites randomized array of resource sites
	 */
	function getResourceSites(
		uint256 seed,
		uint8 elementSites,
		uint8 fuelSites,
		uint16 plotSize,
		uint8 siteSize
	) public pure returns (LandLib.Site[] memory sites) {
		// delegate to internal impl
		return LandLib.getResourceSites(seed, elementSites, fuelSites, plotSize, siteSize);
	}

	/**
	 * @dev Based on the random seed and tier ID determines the landmark type of the plot.
	 *      Random seed is consumed for tiers 3 and 4 to randomly determine one of three
	 *      possible landmark types.
	 *      Tier 5 has its landmark type predefined (arena), lower tiers don't have a landmark.
	 *
	 * @dev Function works in a deterministic way and derives the same data
	 *      for the same inputs; the term "random" in comments means "pseudo-random"
	 *
	 * @param seed random seed to consume and derive the landmark type based on
	 * @param tierId tier ID of the land plot
	 * @return landmarkTypeId landmark type defined by its ID
	 */
	function getLandmark(uint256 seed, uint8 tierId) public pure returns (uint8 landmarkTypeId) {
		// delegate to internal impl
		return LandLib.getLandmark(seed, tierId);
	}

	/**
	 * @dev Derives an array of integers with no duplicates from the random seed;
	 *      each element in the array is within [0, size) bounds and represents
	 *      a two-dimensional Cartesian coordinate point (x, y) presented as one-dimensional
	 *
	 * @dev Function works in a deterministic way and derives the same data
	 *      for the same inputs; the term "random" in comments means "pseudo-random"
	 *
	 * @dev The input seed is considered to be already used to derive some random value
	 *      from it, therefore the function derives a new one by hashing the previous one
	 *      before generating the random value; the output seed is "used" - output random
	 *      value is derived from it
	 *
	 * @param seed random seed to consume and derive coordinates from
	 * @param length number of elements to generate
	 * @param size defines array element bounds [0, size)
	 * @return nextSeed next pseudo-random "used" seed
	 * @return coords the resulting array of length `n` with random non-repeating elements
	 *      in [0, size) range
	 */
	function getCoords(
		uint256 seed,
		uint8 length,
		uint16 size
	) public pure returns (uint256 nextSeed, uint16[] memory coords) {
		// delegate to internal impl
		return LandLib.getCoords(seed, length, size);
	}
}
