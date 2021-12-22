// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../interfaces/LandERC721Spec.sol";
import "../lib/NFTSvg.sol";

contract LandDescriptor {
	 /**
	  * @dev Generates a base64 json metada file based on data supplied by the
		*      land contract.
		* @dev Plot data should be returned from the land contract in order to use
		*      the NFTSvg library which is called
		* 
		* @param _landContract Land ERC721 instance
		* @param _tokenId ERC721 token id
	  */
		function tokenURI(LandERC721Metadata _landContract, uint256 _tokenId) external view returns (string memory) {
			 // calls land erc721 contract to receive metadata
				LandLib.PlotView memory plot = _landContract.viewMetadata(_tokenId);

				NFTSvg.SiteSVGData[] memory sites = new NFTSvg.SiteSVGData[](plot.sites.length);

				for (uint256 i = 0; i < plot.sites.length; i++) {
						sites[i] = NFTSvg.SiteSVGData({
							typeId: plot.sites[i].typeId,
							x: plot.sites[i].x,
							y: plot.sites[i].y
						});
				}

				return NFTSvg.constructTokenURI(plot.regionId, plot.x, plot.y, plot.tierId, sites);
		}

		
}
