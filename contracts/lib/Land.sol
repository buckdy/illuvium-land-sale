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
 *      and due to the specific nature of internal land structure
 *      (landmark and resource sites data is deterministically derived from a pseudo random seed),
 *      it is convenient to separate data structures used to store metadata on-chain (store),
 *      and data structures used to present metadata via smart contract ABI (view)
 *
 * @notice Introduces helper functions to detect and deal with the resource site collisions
 *
 * @author Basil Gorin
 */
library Land {
	/**
	 * @title Resource Site View
	 *
	 * @notice Resource Site, bound to a coordinates (x, y) within the land plot
	 *
	 * @notice Resources can be of two major types, each type having three subtypes:
	 *      - Element (Carbon, Silicon, Hydrogen), or
	 *      - Fuel (Crypton, Hyperion, Solon)
	 *
	 * @dev View only structure, used in public API/ABI, not used in on-chain storage
	 */
	struct Site {
		/**
		 * @dev Site type:
		 *        1) Carbon (element),
		 *        2) Silicon (element),
		 *        3) Hydrogen (element),
		 *        4) Crypton (fuel),
		 *        5) Hyperion (fuel),
		 *        6) Solon (fuel)
		 */
		uint8 typeId;

		/**
		 * @dev x-coordinate within a plot
		 */
		uint8 x;

		/**
		 * @dev y-coordinate within a plot
		 */
		uint8 y;
	}

	/**
	 * @title Land Plot View
	 *
	 * @notice Land Plot, bound to a coordinates (x, y) within the region,
	 *      with a rarity defined by the tier ID, sites, and (optionally)
	 *      a landmark, positioned on the internal coordinate grid of the
	 *      specified size within a plot.
	 *
	 * @notice Land plot coordinates and rarity are predefined (stored off-chain).
	 *      Number of sites (and landmarks - 0/1) is defined by the land rarity.
	 *      Positions of sites, types of sites/landmark are randomized and determined
	 *      upon land plot creation.
	 *
	 * @dev View only structure, used in public API/ABI, not used in on-chain storage
	 */
	struct PlotView {
		/**
		 * @dev Region ID defines the region on the map in IZ:
		 *        1) Abyssal Basin
		 *        2) Brightland Steppes
		 *        3) Shardbluff Labyrinth
		 *        4) Crimson Waste
		 *        5) Halcyon Sea
		 *        6) Taiga Boreal
		 *        7) Crystal Shores
		 */
		uint16 regionId;

		/**
		 * @dev x-coordinate within the region
		 */
		uint16 x;

		/**
		 * @dev y-coordinate within the region
		 */
		uint16 y;

		/**
		 * @dev Tier ID defines land rarity and number of sites within the plot
		 */
		uint16 tierId;

		/**
		 * @dev Plot size, limits the (x, y) coordinates for the sites
		 */
		uint16 size;

		/**
		 * @dev Landmark Type ID:
		 *        0) no Landmark
		 *        1) Carbon Landmark,
		 *        2) Silicon Landmark,
		 *        3) Hydrogen Landmark (Eternal Spring),
		 *        4) Crypton Landmark,
		 *        5) Hyperion Landmark,
		 *        6) Solon Landmark (Fallen Star),
		 *        7) Arena
		 *
		 * @dev Landmark is always positioned in the center of internal grid
		 */
		uint16 landmarkTypeId;

		/**
		 * @dev Element/fuel sites within the plot
		 */
		Site[] sites;
	}

	/**
	 * @title Land Plot Store
	 *
	 * @notice Land Plot data structure as it is stored on-chain
	 *
	 * @notice Contains same data as `Plot` struct does
	 *      - `region | y | x | tierId | size`, concatenated into a single uint96 field
	 *      - array of sites, each site is `typeId | y | x`, concatenated into a single uint24 field
	 *
	 * @dev On-chain only structure, not used in public API/ABI
	 */
	struct PlotStore {
		/**
		 * @dev Region ID defines the region on the map in IZ:
		 *        1) Abyssal Basin
		 *        2) Brightland Steppes
		 *        3) Shardbluff Labyrinth
		 *        4) Crimson Waste
		 *        5) Halcyon Sea
		 *        6) Taiga Boreal
		 *        7) Crystal Shores
		 */
		uint16 regionId;

		/**
		 * @dev x-coordinate within the region
		 */
		uint16 x;

		/**
		 * @dev y-coordinate within the region
		 */
		uint16 y;

		/**
		 * @dev Tier ID defines land rarity and number of sites within the plot
		 */
		uint16 tierId;

		/**
		 * @dev Plot Size, limits the (x, y) coordinates for the sites
		 */
		uint16 size;

		/**
		 * @dev Generator Version, reserved for the future use in order to tweak the
		 *      behavior of the internal land structure algorithm
		 */
		uint16 version;

		/**
		 * @dev Pseudo-random Seed to generate Internal Land Structure
		 */
		uint160 seed;
	}


	/**
	 * @dev Expands `PlotStore` data struct into a `PlotView` view struct
	 *
	 * @dev Derives Internal Land Structure from Tier ID, Plot Size, and Seed,
	 *      Generator Version is not currently used
	 *
	 * @param store internal plot data structure to expand
	 * @return `PlotView` view struct, expanded from the input data
	 */
	function plotView(PlotStore memory store) internal pure returns(PlotView memory) {
		// define landmark and sites array variables
		uint8 landmarkTypeId;
		Site[] memory sites;

		// derive the landmark and sites from Seed, tier ID, and Plot Size
		(landmarkTypeId, sites) = getInternalStructure(store.seed, uint8(store.tierId), uint8(store.size));

		// split the `PlotStore` into pieces using the bitwise arithmetic and
		// return the result as a `Plot` structure
		return PlotView({
			landmarkTypeId: landmarkTypeId,
			tierId:         store.tierId,
			size:           store.size,
			regionId:       store.regionId,
			y:              store.y,
			x:              store.x,
			sites:          sites
		});
	}

	/**
	 * @dev Based on the random seed, tier ID, and plot size, determines the
	 *      internal land structure (landmark type and sites)
	 *
	 * @dev Function works in a deterministic way and derives the same data
	 *      for the same inputs; the term "random" in comments means "pseudo-random"
	 *
	 * @param seed random seed to consume and derive the internal structure
	 * @param tierId tier ID of the land plot to derive internal structure for
	 * @param plotSize size of the land plot to derive internal structure for
	 * @return landmarkTypeId randomized landmark type ID
	 * @return sites randomized array of land sites
	 */
	function getInternalStructure(
		uint256 seed,
		uint8 tierId,
		uint8 plotSize
	) internal pure returns(uint8 landmarkTypeId, Site[] memory sites) {
		// determine the landmark, possibly consuming the rnd256
		landmarkTypeId = getLandmark(seed, tierId);

		// determine number of element sites based on the tier ID
		uint8 elementSites = 3 * tierId;
		// determine number of fuel sites based on the tier ID
		// and immediately derive total number of sites
		uint8 totalSites = elementSites + (tierId < 2? tierId: 3 * (tierId - 1));

		// allocate temporary array to store (and determine) sites' coordinates
		uint16[] memory coords = new uint16[](totalSites);

		// transform coordinate system (1): (x, y) => (x / 2, y / 2)
		uint8 size = plotSize / 2;
		// transform coordinate system (2): reduce grid size to be multiple of 2
		size = size / 2 * 2;

		// define coordinate system: isomorphic grid on a square of size [size, size]
		// transform coordinate system (3): pack isomorphic grid on a rectangle of size [size, 1 + size / 2]
		// transform coordinate system (4): (x, y) -> y * size + x (two-dimensional Cartesian -> one-dimensional segment)
		// generate site coordinates in a transformed coordinate system (on a one-dimensional segment)
		fillCoords(seed, coords, uint16(size) * (1 + size / 2));

		// allocate number of sites required
		sites = new Site[](totalSites);

		// define the variables used inside the loop outside the loop to help compiler optimizations
		// site type ID
		uint8 typeId;
		// site coordinates (x, y)
		uint8 x;
		uint8 y;

		// determine the element and fuel sites one by one
		for(uint8 i = 0; i < totalSites; i++) {
			// determine next random number in the sequence, and random site type from it
			(seed, typeId) = nextRndUint8(seed, i < elementSites? 1:  4, 3);

			// determine x and y
			// reverse transform coordinate system (4): x = size % i, y = size / i
			// (back from one-dimensional segment to two-dimensional Cartesian)
			x = uint8(coords[i] % size);
			y = uint8(coords[i] / size);

			// reverse transform coordinate system (3): unpack isomorphic grid onto a square of size [size, size]
			// fix the "(0, 0) left-bottom corner" of the isomorphic grid
			if(x + y < size / 2) {
				x += size / 2;
				y += 1 + size / 2;
			}
			// fix the "(size, 0) right-bottom corner" of the isomorphic grid
			else if(x >= size / 2 && x >= y + size / 2) {
				x -= size / 2;
				y += 1 + size / 2;
			}

			// based on the determined site type and coordinates, allocate the site
			sites[i] = Site({
			typeId: typeId,
				// reverse transform coordinate system (2): shift (x, y) => (x + 1, y + 1) if grid size was reduced
				// reverse transform coordinate system (1): (x, y) => (2 * x, 2 * y)
				x: x * 2 + plotSize / 2 % 2,
				y: y * 2 + plotSize / 2 % 2
			});
		}
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
	function getLandmark(uint256 seed, uint8 tierId) internal pure returns(uint8 landmarkTypeId) {
		// depending on the tier, land plot can have a landmark
		// tier 3 has an element landmark (1, 2, 3)
		if(tierId == 3) {
			// derive random element landmark
			return uint8(1 + seed % 3);
		}
		// tier 4 has a fuel landmark (4, 5, 6)
		if(tierId == 4) {
			// derive random fuel landmark
			return uint8(4 + seed % 3);
		}
		// tier 5 has an arena landmark
		if(tierId == 5) {
			// 7 - arena landmark
			return 7;
		}

		// lower tiers (0, 1, 2) don't have any landmark
		// tiers greater than 5 are not defined
		return 0;
	}

	/**
	 * @dev Fills in an array of integers with no duplicates from the random seed;
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
	 */
	// TODO: leave the free space in the center for a landmark
	function fillCoords(uint256 seed, uint16[] memory coords, uint16 size) internal pure returns(uint256 nextSeed) {
		// generate site coordinates one by one
		for(uint8 i = 0; i < coords.length; i++) {
			// get next number and update the seed
			(seed, coords[i]) = nextRndUint16(seed, 0, size);
		}

		// sort the coordinates
		sort(coords);

		// find the if there are any duplicates, and while there are any
		for(int256 i = findDup(coords); i >= 0; i = findDup(coords)) {
			// regenerate the element at duplicate position found
			(seed, coords[uint256(i)]) = nextRndUint16(seed, 0, size);
			// sort the coordinates again
			// TODO: check if this doesn't degrade the performance significantly (note the pivot in quick sort)
			sort(coords);
		}

		// return the updated and used seed
		return seed;
	}

	/**
	 * @dev Based on the random seed, generates next random seed, and a random value
	 *      not lower than given `offset` value and able to have `options` different
	 *      possible values
	 *
	 * @dev The input seed is considered to be already used to derive some random value
	 *      from it, therefore the function derives a new one by hashing the previous one
	 *      before generating the random value; the output seed is "used" - output random
	 *      value is derived from it
	 */
	function nextRndUint8(
		uint256 seed,
		uint8 offset,
		uint8 options
	) internal pure returns(
		uint256 nextSeed,
		uint8 rndVal
	) {
		// generate next random seed first
		nextSeed = uint256(keccak256(abi.encodePacked(seed)));

		// derive random value with the desired properties from
		// the newly generated seed
		rndVal = offset + uint8(nextSeed % options);
	}

	/**
	 * @dev Based on the random seed, generates next random seed, and a random value
	 *      not lower than given `offset` value and able to have `options` different
	 *      possible values
	 *
	 * @dev The input seed is considered to be already used to derive some random value
	 *      from it, therefore the function derives a new one by hashing the previous one
	 *      before generating the random value; the output seed is "used" - output random
	 *      value is derived from it
	 */
	function nextRndUint16(
		uint256 seed,
		uint16 offset,
		uint16 options
	) internal pure returns(
		uint256 nextSeed,
		uint16 rndVal
	) {
		// generate next random seed first
		nextSeed = uint256(keccak256(abi.encodePacked(seed)));

		// derive random value with the desired properties from
		// the newly generated seed
		rndVal = offset + uint16(nextSeed % options);
	}

	/**
	 * @dev Plot location is a combination of (regionId, x, y), it's effectively
	 *      a 3-dimensional coordinate, unique for each plot
	 *
	 * @dev The function extracts plot location from the plot and represents it
	 *      in a packed form of 3 integers constituting the location: regionId | x | y
	 *
	 * @param plot `PlotView` view structure to extract location from
	 * @return Plot location (regionId, x, y) as a packed integer
	 */
/*
	function loc(PlotView memory plot) internal pure returns(uint48) {
		// tightly pack the location data and return
		return uint48(plot.regionId) << 32 | uint32(plot.y) << 16 | plot.x;
	}
*/

	/**
	 * @dev Plot location is a combination of (regionId, x, y), it's effectively
	 *      a 3-dimensional coordinate, unique for each plot
	 *
	 * @dev The function extracts plot location from the plot and represents it
	 *      in a packed form of 3 integers constituting the location: regionId | x | y
	 *
	 * @param plot `PlotStore` data store structure to extract location from
	 * @return Plot location (regionId, x, y) as a packed integer
	 */
	function loc(PlotStore memory plot) internal pure returns(uint48) {
		// tightly pack the location data and return
		return uint48(plot.regionId) << 32 | uint32(plot.y) << 16 | plot.x;
	}

	/**
	 * @dev Site location is a combination of (x, y), unique for each site within a plot
	 *
	 * @dev The function extracts site location from the site and represents it
	 *      in a packed form of 2 integers constituting the location: x | y
	 *
	 * @param site `Site` view structure to extract location from
	 * @return Site location (x, y) as a packed integer
	 */
/*
	function loc(Site memory site) internal pure returns(uint16) {
		// tightly pack the location data and return
		return uint16(site.y) << 8 | site.x;
	}
*/

	/**
	 * @dev Finds first pair of repeating elements in the array
	 *
	 * @dev Assumes the array is sorted ascending:
	 *      returns `-1` if array is strictly monotonically increasing,
	 *      index of the first duplicate found otherwise
	 *
	 * @param arr an array of elements to check
	 * @return index found duplicate index, or `-1` if there are no repeating elements
	 */
	function findDup(uint16[] memory arr) internal pure returns (int256 index) {
		// iterate over the array [1, n], leaving the space in the beginning for pair comparison
		for(uint256 i = 1; i < arr.length; i++) {
			// verify if there is a strict monotonically increase violation
			if(arr[i - 1] >= arr[i]) {
				// return false if yes
				return int256(i - 1);
			}
		}

		// return `-1` if no violation was found - array is strictly monotonically increasing
		return -1;
	}

	/**
	 * @dev Sorts an array of integers using quick sort algorithm
	 *
	 * @dev Quick sort recursive implementation
	 *      Source:   https://gist.github.com/subhodi/b3b86cc13ad2636420963e692a4d896f
	 *      See also: https://www.geeksforgeeks.org/quick-sort/
	 *
	 * @param arr an array to sort
	 */
	function sort(uint16[] memory arr) internal pure {
		quickSort(arr, 0, int256(arr.length - 1));
	}

	/**
	 * @dev Quick sort recursive implementation
	 *      Source:   https://gist.github.com/subhodi/b3b86cc13ad2636420963e692a4d896f
	 *      See also: https://www.geeksforgeeks.org/quick-sort/
	 */
	// TODO: review the implementation code
	function quickSort(uint16[] memory arr, int256 left, int256 right) internal pure {
		int256 i = left;
		int256 j = right;
		// TODO: remove?
/*
		if(i == j) {
			return;
		}
*/
		uint16 pivot = arr[uint256(left + (right - left) / 2)];
		while(i <= j) {
			while(arr[uint256(i)] < pivot) {
				i++;
			}
			while(pivot < arr[uint256(j)]) {
				j--;
			}
			if(i <= j) {
				(arr[uint256(i)], arr[uint256(j)]) = (arr[uint256(j)], arr[uint256(i)]);
				i++;
				j--;
			}
		}
		if(left < j) {
			quickSort(arr, left, j);
		}
		if(i < right) {
			quickSort(arr, i, right);
		}
	}
}
