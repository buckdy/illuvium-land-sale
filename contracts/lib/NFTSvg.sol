// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../lib/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

library NFTSvg {
		using Strings for uint256;
		struct SiteSVGData {
			// site type id
			uint8 typeId;
			// x coordinate
			uint16 x;
			// y coordinate
			uint16 y;
		}

		// main land svg component array length
		uint256 internal constant mainSvgLength = 6;
		// site base svg array length
		uint256 internal constant siteBaseSvgLength = 9;
		// land board svg array length
		uint256 internal constant boardSvgLength = 105;

		/**
		 * @dev Pure function that returns the main svg array component, used in the
		 *      top level of the generated land SVG.
		 */
		function _mainSvg() private pure returns (string[mainSvgLength] memory mainSvg) {
				mainSvg = [
					"<svg width='280' height='280' viewBox='0 0 280 283' fill='none' stroke='#000' strokeWidth='2'  xmlns='http://www.w3.org/2000/svg'>",
					"<rect rx='8' ry='8' x='0.5' y='263' width='279' height='20' fill='url(#BOARD_BOTTOM_BORDER_COLOR_TIER_",
					"LAND_TIER_ID",
					")' stroke='none'/>",
					"FUTURE_BOARD_CONTAINER", // This line should be replaced in the loop
					"</svg>"
				];
		}

		/**
		 * @dev Pure function that returns the site base svg array component, used to represent
		 *      a site inside the land board.
		 */
		function _siteBaseSvg() private pure returns (string[siteBaseSvgLength] memory siteBaseSvg) {
				siteBaseSvg = [
					 "<svg viewBox='-1 -1 13.6 13.6' x='",
						"SITE_X_POSITION", // This line should be replaced in the loop
						"' y='",
						"SITE_Y_POSITION", // This line should be replaced in the loop
						"' width='11.2' height='11.2' xmlns='http://www.w3.org/2000/svg'> ",
						"<rect fill='url(#",
						"SITE_TYPE_ID", // This line should be replaced in the loop
						")' width='5.6' height='5.6' stroke='#fff' stroke-opacity='0.5'/>",
						"</svg>"
				];
		}

		/**
		 * @dev Returns the land board base svg array component, which has its color changed
		 *      later in other functions.
		 */
		function _boardSvg() private pure returns (string[boardSvgLength] memory boardSvg) {
				boardSvg = [
				"<svg x='0' y='0' viewBox='0 0 280 280' width='280' height='280' xmlns='http://www.w3.org/2000/svg' >",
					"<defs>",
					"<linearGradient id='Hyperion' gradientTransform='rotate(45)' xmlns='http://www.w3.org/2000/svg'>",
					"<stop offset='0%' stop-color='#31F27F' />",
					"<stop offset='29.69%' stop-color='#F4BE86' />",
					"<stop offset='57.81%' stop-color='#B26FD2' />",
					"<stop offset='73.44%' stop-color='#7F70D2' />",
					"<stop offset='100%' stop-color='#8278F2' />",
					"</linearGradient>",
					"<linearGradient id='Crypton' gradientTransform='rotate(45)' xmlns='http://www.w3.org/2000/svg'>",
					"<stop offset='0%' stop-color='#184B00' />",
					"<stop offset='100%' stop-color='#52FF00' />",
					"</linearGradient>",
					"<linearGradient id='Silicon' gradientTransform='rotate(45)' xmlns='http://www.w3.org/2000/svg'>",
					"<stop offset='0%' stop-color='#CBE2FF' />",
					"<stop offset='100%' stop-color='#EFEFEF' />",
					"</linearGradient>",
					"<linearGradient id='Hydrogen' gradientTransform='rotate(45)' xmlns='http://www.w3.org/2000/svg'>",
					"<stop offset='0%' stop-color='#8CD4D9' />",
					"<stop offset='100%' stop-color='#598FA6' />",
					"</linearGradient>",
					"<linearGradient id='Carbon' gradientTransform='rotate(45)' xmlns='http://www.w3.org/2000/svg'>",
					"<stop offset='0%' stop-color='#565656' />",
					"<stop offset='100%' stop-color='#000000' />",
					"</linearGradient>",
					"<linearGradient id='Solon' gradientTransform='rotate(45)' xmlns='http://www.w3.org/2000/svg'>",
					"<stop offset='0%' stop-color='#FFFFFF' />",
					"<stop offset='54.46%' stop-color='#FFD600' />",
					"<stop offset='100%' stop-color='#FF9900' />",
					"</linearGradient>",
					"<linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_5' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#BE13AE'/>",
					"</linearGradient>",
					"<linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_4' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#1F7460'/>",
					"</linearGradient>",
					"<linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_3' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#6124AE'/>",
					"</linearGradient>",
					"<linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_2' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#5350AA'/>",
					"</linearGradient>",
					"<linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_1' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#2C2B67'/>",
					"</linearGradient>",
					"<linearGradient id='GRADIENT_BOARD_TIER_5' x1='280' y1='0' x2='280' y2='280' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
					"<stop offset='0.130208' stop-color='#EFD700'/>",
					"<stop offset='0.6875' stop-color='#FF57EE'/>",
					"<stop offset='1' stop-color='#9A24EC'/>",
					"</linearGradient>",
					"<linearGradient id='GRADIENT_BOARD_TIER_4' x1='143.59' y1='279.506' x2='143.59' y2='2.74439e-06' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#239378'/>",
					"<stop offset='1' stop-color='#41E23E'/>",
					"</linearGradient>",
					"<linearGradient id='GRADIENT_BOARD_TIER_3' x1='143.59' y1='279.506' x2='143.59' y2='2.74439e-06' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#812DED'/>",
					"<stop offset='1' stop-color='#F100D9'/>",
					"</linearGradient>",
					"<linearGradient id='GRADIENT_BOARD_TIER_2' x1='143.59' y1='1.02541e-05' x2='143.59' y2='280' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#7DD6F2'/>",
					"<stop offset='1' stop-color='#625EDC'/>",
					"</linearGradient>",
					"<linearGradient id='GRADIENT_BOARD_TIER_1' x1='143.59' y1='1.02541e-05' x2='143.59' y2='280' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#4C44A0'/>",
					"<stop offset='1' stop-color='#2F2C83'/>",
					"</linearGradient>",
					"<linearGradient id='ROUNDED_BORDER_TIER_5' x1='280' y1='50' x2='280' y2='280' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#D2FFD9'/>",
					"<stop offset='1' stop-color='#F32BE1'/>",
					"</linearGradient>",
					"<linearGradient id='ROUNDED_BORDER_TIER_4' x1='280' y1='50' x2='280' y2='280' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#fff' stop-opacity='0.38'/>",
					"<stop offset='1' stop-color='#fff' stop-opacity='0.08'/>",
					"</linearGradient>",
					"<linearGradient id='ROUNDED_BORDER_TIER_3' x1='280' y1='50' x2='280' y2='280' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#fff' stop-opacity='0.38'/>",
					"<stop offset='1' stop-color='#fff' stop-opacity='0.08'/>",
					"</linearGradient>",
					"<linearGradient id='ROUNDED_BORDER_TIER_2' x1='280' y1='50' x2='280' y2='280' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#fff' stop-opacity='0.38'/>",
					"<stop offset='1' stop-color='#fff' stop-opacity='0.08'/>",
					"</linearGradient>",
					"<linearGradient id='ROUNDED_BORDER_TIER_1' x1='280' y1='50' x2='280' y2='280' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
					"<stop stop-color='#fff' stop-opacity='0.38'/>",
					"<stop offset='1' stop-color='#fff' stop-opacity='0.08'/>",
					"</linearGradient>",
					"<pattern id='smallGrid' width='2.8' height='2.8' patternUnits='userSpaceOnUse' patternTransform='translate(-69.4 -75.6) rotate(45) scale(1.375)'>",
					"<path d='M 2.8 0 L 0 0 0 2.8' fill='none'  stroke='#130A2A' stroke-opacity='0.2'/>",
					"</pattern>",
					"</defs>",
					"<g fill='none' stroke-width='0'>",
					"<rect width='280' height='280' fill='url(#GRADIENT_BOARD_TIER_",
					"LAND_TIER_ID", // This line should be replaced in the loop
					")' stroke='none' rx='8' ry='8'/>",
					"</g>",
					"<rect x='1' y='1' width='278' height='278' fill='url(#smallGrid)' stroke='none' rx='8' ry='8'/>    ",
					"<g transform='translate(-0.3 -75.6) rotate(45 140 140)'>",
					"<svg viewBox='0 0 280 281' width='386.4' height='386.4'>",
					"SITES_POSITIONED", // This line should be replaced in the loop
					"</svg>",
					"</g>",
					"<rect x='0.5' y='0.4' width='279' height='278.5'  stroke='url(#ROUNDED_BORDER_TIER_",
					"LAND_TIER_ID", // This line should be replaced in the loop
					")' stroke-width='1'  rx='7' ry='7' xmlns='http://www.w3.org/2000/svg'/>",
					"</svg>"
			];

}
 /**
  * @dev Calculates string for the land name based on plot data.
	* 
	* @param _regionId PlotView.regionId
	* @param _x PlotView.x coordinate
	* @param _y PlotView.y coordinate
	* @param _tierId PlotView.tierId land tier id
  */

	function _generateLandName(uint8 _regionId,  uint16 _x,  uint16 _y, uint8 _tierId) private pure returns (string memory) {
		return string(
			abi.encodePacked(
				"Land Tier ",
				uint256(_tierId).toString(),
				" - (",
				uint256(_regionId).toString(),
				", ",
				uint256(_x).toString(),
				", ",
				uint256(_y).toString()
			)
		);
	}
 
  /**
	 * @dev Calculates the string for the land metadata description.
	 */
	function _generateLandDescription() private pure returns (string memory) {
		return "Describes the asset to which this NFT represents";
	}
	/**
	 * @dev Populates the mainSvg array with the land tier id and the svg returned
	 *      by the _generateLandBoard. Expects it to generate the land svg inside 
	 *      the container.
	 * 
	 * @param _tierId PlotView.tierId land tier id
	 * @param _sites Array of plot sites coming from PlotView struct
	 */
	function _generateSVG(uint8 _tierId, SiteSVGData[] memory _sites) private pure returns (string memory) {
			string[] memory _mainSvgArray = new string[](mainSvgLength);

			for(uint256 i = 0; i < mainSvgLength; i++) {
					if (keccak256(bytes(_mainSvg()[i])) == keccak256(bytes("LAND_TIER_ID"))) {
							_mainSvgArray[i] = uint256(_tierId).toString();
					}
					if(keccak256(bytes(_mainSvg()[i])) == keccak256(bytes("FUTURE_BOARD_CONTAINER"))) {
							_mainSvgArray[i] = _generateLandBoard(_tierId, _sites);
					}					
			}
			return _joinArray(_mainSvgArray);
	}

	/**
	 * @dev Generates the plot svg containing all sites inside and color according
	 *      to the tier
	 * 
	 * @param _tierId PlotView.tierId land tier id
	 * @param _sites Array of plot sites coming from PlotView struct
	 */
	function _generateLandBoard(uint8 _tierId, SiteSVGData[] memory _sites) private pure returns (string memory) {
			string[] memory _boardSvgArray = new string[](boardSvgLength);

			for (uint256 i = 0; i < _boardSvgArray.length; i++) {
				if (keccak256(bytes(_boardSvg()[i])) == keccak256(bytes("LAND_TIER_ID"))) {
						_boardSvgArray[i] = uint256(_tierId).toString();
				}
				if (keccak256(bytes(_boardSvg()[i])) == keccak256(bytes("SITES_POSITIONED"))) {
						_boardSvgArray[i] = _generateSites(_sites);
				}
  		}
  		return _joinArray(_boardSvgArray);
	}
 
 /**
  * @dev Generates each site inside the land svg board with is position and color.
	*
	* @param _sites Array of plot sites coming from PlotView struct
  */
	function _generateSites(SiteSVGData[] memory _sites) private pure returns (string memory) {
			string[] memory _siteSvgArray = new string[](siteBaseSvgLength);
			for (uint256 i = 0; i < _sites.length; i++) {
						_siteSvgArray[i] = _generatePositionAndColor(_sites[i]);
			}

			return _joinArray(_siteSvgArray);
	}
 
 /**
  * @dev Called inside `_generateSites()`, expects to receive each site and 
	*      return the individual svg with the correct position inside the board and
	*      color.
  */
	function _generatePositionAndColor(SiteSVGData memory _site) private pure returns (string memory) {
			string[] memory _siteSvgArray;

		  for (uint256 i = 0; i < _siteSvgArray.length; i++) {
					if (keccak256(bytes(_siteBaseSvg()[i])) == keccak256(bytes("SITE_TYPE_ID"))) {
						_siteSvgArray[i] = uint256(_site.typeId).toString();
					}
					if (keccak256(bytes(_siteBaseSvg()[i])) == keccak256(bytes("SITE_X_POSITION"))) {
						_siteSvgArray[i] = _convertToSvgPosition(_site.x);
					}
					if (keccak256(bytes(_siteBaseSvg()[i])) == keccak256(bytes("SITE_Y_POSITION"))) {
						_siteSvgArray[i] = _convertToSvgPosition(_site.y);
					}
		}
		return _joinArray(_siteSvgArray);
	}
  /**
	 * @dev Main function, entry point to generate the complete land svg with all
	 *      populated sites, correct color, and attach to the JSON metadata file
	 *      created using Base64 lib.
	 * @dev Returns the JSON metadata formatted file used by NFT platforms to display
	 *      the land data.
	 * @dev Can be updated in the future to change the way land name, description, image
	 *      and other traits are displayed.
	 *
	 * @param _regionId PlotView.regionId
	 * @param _x PlotView.x coordinate
	 * @param _y PlotView.y coordinate
	 * @param _tierId PlotView.tierId land tier id
	 * @param _sites Array of plot sites coming from PlotView struct
	 */
	function constructTokenURI(uint8 _regionId, uint16 _x, uint16 _y, uint8 _tierId, SiteSVGData[] memory _sites) internal pure returns (string memory) {
			string memory name = _generateLandName(_regionId, _x, _y, _tierId);
			string memory description = _generateLandDescription();
			string memory image = Base64.encode(bytes(_generateSVG(_tierId, _sites)));

			return string(
				abi.encodePacked("data:application/json;base64, ", Base64.encode(
					bytes(
								abi.encodePacked('{"name":"',
								name,
								'", "description":"',
								description,
								'", "image": "',
								'data:image/svg+xml;base64,',
								image,
								'"}')
						)	
					)
				));

	}

	function _joinArray(string[] memory _svgArray) private pure returns (string memory) {
		string memory svg;
		for (uint256 i = 0; i < _svgArray.length; i++) {
				if (i != 0) {
					svg = string(abi.encodePacked(svg, _svgArray[i]));
				} else {
					svg = _svgArray[i];
				}
		}

		return svg;
	}

	function _convertToSvgPosition(uint256 _position) private pure returns (string memory) {
			return (_position * 3 - 6).toString();
	}
}
