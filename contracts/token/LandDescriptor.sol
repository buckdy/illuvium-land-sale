// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../interfaces/LandERC721Spec.sol";
import "../interfaces/LandDescriptorSpec.sol";
import "../lib/NFTSvg.sol";

contract LandDescriptorImpl {
	 /**
	  * @dev Generates a base64 json metada file based on data supplied by the
		*      land contract.
		* @dev Plot data should be returned from the land contract in order to use
		*      the NFTSvg library which is called
		* 
		* @param _plot Plot view data containing Sites array
	  */
		function tokenURI(LandLib.PlotView calldata _plot) external view returns (string memory) {
			NFTSvg.SiteSVGData[] memory sites = new NFTSvg.SiteSVGData[](_plot.sites.length);

			for (uint256 i = 0; i < _plot.sites.length; i++) {
				sites[i] = NFTSvg.SiteSVGData({
					typeId: _plot.sites[i].typeId,
					x: _plot.sites[i].x,
					y: _plot.sites[i].y
				});
			}

			return NFTSvg.constructTokenURI(_plot.regionId, _plot.size, _plot.landmarkTypeId, _plot.x, _plot.y, _plot.tierId, sites);
		}

		
}
