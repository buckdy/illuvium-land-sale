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
		 * @param _plot Plot view data containing Sites array
		 */
		 function tokenURI(LandLib.PlotView calldata _plot) external pure returns (string memory);
}
