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

		/**
		 * @dev Pure function that returns the main svg array component, used in the
		 *      top level of the generated land SVG.
		 */
		function _mainSvg(uint16 gridSize) private pure returns (string[15] memory mainSvg) {
			// Multiply by 3 to get number of grid squares = dimension of the isomorphic grid size
			uint16 isoSize = (gridSize % 2 == 0) ?  3 * gridSize / 2 : 3 * (gridSize + 1) / 2;

			mainSvg = [
				"<svg height='",
				Strings.toString(isoSize + 8), // Add 8: bottom border + 2 aditional border blocks (1 for each side)
				"' width='",
				Strings.toString(isoSize + 6), // Add 6: 2 aditional border blocks
				"' stroke-width='2' xmlns='http://www.w3.org/2000/svg'>",
				"<rect rx='5%' ry='5%' width='100%' height='99.7%' fill='url(#BOARD_BOTTOM_BORDER_COLOR_TIER_",
				"LAND_TIER_ID",
				")' stroke='none'/>",
				"<svg  height='",
				Strings.toString(isoSize + 6), // without bottom border
				"' width='",
				Strings.toString(isoSize + 6),
				"' stroke-width='2' xmlns='http://www.w3.org/2000/svg'>",
				"FUTURE_BOARD_CONTAINER", // This line should be replaced in the loop
				"</svg>"
			];
		}

		/**
		 * @dev Pure function that returns the site base svg array component, used to represent
		 *      a site inside the land board.
		 */
		function _siteBaseSvg() private pure returns (string[9] memory siteBaseSvg) {
			siteBaseSvg = [
				"<svg x='",
				"SITE_X_POSITION", // This line should be replaced in the loop
				"' y='",
				"SITE_Y_POSITION", // This line should be replaced in the loop
				"' width='6' height='6' xmlns='http://www.w3.org/2000/svg'> ",
				"<use href='#SITE_TYPE_",
				"SITE_TYPE_ID", // This line should be replaced in the loop
				"' />",
				"</svg>"
			];
		}

		function _generateLandmarkSvg(uint16 gridSize, uint8 landmarkTypeId) private pure returns (string memory) {
			uint16 landmarkPos = (gridSize % 2 == 0) ? 3 * gridSize / 4: 3 * (gridSize + 1) / 4;

			string[8] memory landmarkSvgArray = [
				"<svg x='",
				Strings.toString(landmarkPos),
				"' y='",
				Strings.toString(landmarkPos),
				"' width='6' height='6' xmlns='http://www.w3.org/2000/svg'>",
				"<use href='#LANDMARK_TYPE_",
				Strings.toString(landmarkTypeId),
				"'/></svg>"
			];

			bytes memory landmarkSvgBytes;
			for (uint8 i = 0; i < landmarkSvgArray.length; i++) {
				if (i != 0) {
					landmarkSvgBytes = abi.encodePacked(landmarkSvgBytes, landmarkSvgArray[i]);
				} else {
					landmarkSvgBytes = bytes(landmarkSvgArray[i]);
				}
			}

			return string(landmarkSvgBytes);

		}

		/**
		 * @dev Returns the land board base svg array component, which has its color changed
		 *      later in other functions.
		 */
		function _boardSvg() private pure returns (string[122] memory boardSvg) {
			boardSvg = [
				"<defs><symbol id='SITE_TYPE_1' width='6' height='6'>", // Site Carbon
				"<svg width='6' height='6' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>",
				"<rect x='1.12' y='1' width='12' height='12' fill='url(#site-type-1)' stroke='white' stroke-opacity='0.5'/>",
				"<defs><linearGradient id='site-type-1' x1='13.12' y1='1' x2='1.12' y2='13' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
				"<symbol id='SITE_TYPE_2' width='6' height='6'>", // Site Silicon
				"<svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
				"<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_1320_145814)' stroke='white' stroke-opacity='0.5'/>",
				"<defs><linearGradient id='paint0_linear_1320_145814' x1='11.12' y1='1' x2='-0.862058' y2='7.11845' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#8CD4D9'/><stop offset='1' stop-color='#598FA6'/></linearGradient></defs></svg></symbol>",
				"<symbol id='SITE_TYPE_3' width='6' height='6'>", // Site Hydrogen
				"<svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
				"<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_1321_129011)' stroke='white' stroke-opacity='0.5'/>",
				"<defs><linearGradient id='paint0_linear_1321_129011' x1='11.12' y1='1' x2='1.12' y2='11' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#CBE2FF'/><stop offset='1' stop-color='#EFEFEF'/></linearGradient></defs></svg></symbol>",
				"<symbol id='SITE_TYPE_4' width='6' height='6'>", // Site Crypton
				"<svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
				"<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_1321_129013)' stroke='white' stroke-opacity='0.5'/>",
				"<defs><linearGradient id='paint0_linear_1321_129013' x1='11.12' y1='1' x2='1.12' y2='11' gradientUnits='userSpaceOnUse'>",
				"<stop offset='1' stop-color='#52FF00'/></linearGradient></defs></svg></symbol>",
				"<symbol id='SITE_TYPE_5' width='6' height='6'>", // Site Hyperion
				"<svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
				"<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_1321_129017)' stroke='white' stroke-opacity='0.5'/>",
				"<defs><linearGradient id='paint0_linear_1321_129017' x1='11.12' y1='1' x2='1.12' y2='11' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#31F27F'/><stop offset='0.296875' stop-color='#F4BE86'/><stop offset='0.578125' stop-color='#B26FD2'/>",
				"<stop offset='0.734375' stop-color='#7F70D2'/><stop offset='1' stop-color='#8278F2'/></linearGradient></defs></svg></symbol>",
				"<symbol id='SITE_TYPE_6' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>", // Site Solon
				"<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_1321_129015)' stroke='white' stroke-opacity='0.5'/>",
				"<defs><linearGradient id='paint0_linear_1321_129015' x1='11.12' y1='1' x2='1.11999' y2='11' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='white'/><stop offset='0.544585' stop-color='#FFD600'/><stop offset='1' stop-color='#FF9900'/>",
				"</linearGradient></defs></svg></symbol><linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_5' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#BE13AE'/></linearGradient><linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_4' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#1F7460'/></linearGradient><linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_3' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#6124AE'/></linearGradient><linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_2' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#5350AA'/></linearGradient><linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_1' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#2C2B67'/></linearGradient><linearGradient id='GRADIENT_BOARD_TIER_5' x1='100%' y1='0' x2='100%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
				"<stop offset='0.130208' stop-color='#EFD700'/><stop offset='0.6875' stop-color='#FF57EE'/><stop offset='1' stop-color='#9A24EC'/>",
				"</linearGradient><linearGradient id='GRADIENT_BOARD_TIER_4' x1='50%' y1='100%' x2='50%' y2='0' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#239378'/><stop offset='1' stop-color='#41E23E'/></linearGradient>",
				"<linearGradient id='GRADIENT_BOARD_TIER_3' x1='50%' y1='100%' x2='50%' y2='0' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#812DED'/><stop offset='1' stop-color='#F100D9'/></linearGradient>",
				"<linearGradient id='GRADIENT_BOARD_TIER_2' x1='50%' y1='0' x2='50%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#7DD6F2'/><stop offset='1' stop-color='#625EDC'/></linearGradient>",
				"<linearGradient id='GRADIENT_BOARD_TIER_1' x1='50%' y1='0' x2='50%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#4C44A0'/><stop offset='1' stop-color='#2F2C83'/></linearGradient>",
				"<linearGradient id='ROUNDED_BORDER_TIER_5' x1='100%' y1='16.6%' x2='100%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#D2FFD9'/><stop offset='1' stop-color='#F32BE1'/></linearGradient>",
				"<linearGradient id='ROUNDED_BORDER_TIER_4' x1='100%' y1='16.6%' x2='100%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#fff' stop-opacity='0.38'/><stop offset='1' stop-color='#fff' stop-opacity='0.08'/></linearGradient>",
				"<linearGradient id='ROUNDED_BORDER_TIER_3' x1='100%' y1='16.6%' x2='100%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#fff' stop-opacity='0.38'/><stop offset='1' stop-color='#fff' stop-opacity='0.08'/></linearGradient>",
				"<linearGradient id='ROUNDED_BORDER_TIER_2' x1='100%' y1='16.6%' x2='100%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#fff' stop-opacity='0.38'/><stop offset='1' stop-color='#fff' stop-opacity='0.08'/></linearGradient>",
				"<linearGradient id='ROUNDED_BORDER_TIER_1' x1='100%' y1='16.6%' x2='100%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
				"<stop stop-color='#fff' stop-opacity='0.38'/><stop offset='1' stop-color='#fff' stop-opacity='0.08'/></linearGradient>",
				"<pattern id='smallGrid' width='3' height='3' patternUnits='userSpaceOnUse'>",
				"<path d='M 3 0 L 0 0 0 3' fill='none' stroke-width='0.3%' stroke='#130A2A' stroke-opacity='0.2' />",
				"</pattern><symbol id='LANDMARK_TYPE_1' width='6' height='6'><svg width='6' height='6' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>",
				"<rect x='1.12' y='1' width='12' height='12' fill='url(#paint0_linear_2371_558677)' stroke='white' stroke-opacity='0.5'/>",
				"<rect x='4.72' y='4.59998' width='4.8' height='4.8' fill='url(#paint1_linear_2371_558677)'/>",
				"<rect x='4.72' y='4.59998' width='4.8' height='4.8' fill='white'/>",
				"<defs><linearGradient id='paint0_linear_2371_558677' x1='13.12' y1='1' x2='1.12' y2='13' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#565656'/><stop offset='1'/></linearGradient>",
				"<linearGradient id='paint1_linear_2371_558677' x1='9.52' y1='4.59998' x2='4.72' y2='9.39998' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
				"<symbol id='LANDMARK_TYPE_2' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
				"<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_2371_558683)' stroke='white' stroke-opacity='0.5'/>",
				"<rect x='4.12' y='4' width='4' height='4' fill='url(#paint1_linear_2371_558683)'/><rect x='4.12' y='4' width='4' height='4' fill='white'/>",
				"<rect x='3.62' y='3.5' width='5' height='5' stroke='black' stroke-opacity='0.1'/>",
				"<defs><linearGradient id='paint0_linear_2371_558683' x1='11.12' y1='1' x2='-0.862058' y2='7.11845' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#8CD4D9'/><stop offset='1' stop-color='#598FA6'/></linearGradient>",
				"<linearGradient id='paint1_linear_2371_558683' x1='8.12' y1='4' x2='4.12' y2='8' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
				"<symbol id='LANDMARK_TYPE_3' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
				"<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_2371_558686)' stroke='white' stroke-opacity='0.5'/>",
				"<rect x='4.12' y='4' width='4' height='4' fill='url(#paint1_linear_2371_558686)'/><rect x='4.12' y='4' width='4' height='4' fill='white'/>",
				"<rect x='3.62' y='3.5' width='5' height='5' stroke='black' stroke-opacity='0.1'/>",
				"<defs><linearGradient id='paint0_linear_2371_558686' x1='11.12' y1='1' x2='1.12' y2='11' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#CBE2FF'/><stop offset='1' stop-color='#EFEFEF'/></linearGradient>",
				"<linearGradient id='paint1_linear_2371_558686' x1='8.12' y1='4' x2='4.12' y2='8' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
				"<symbol id='LANDMARK_TYPE_4' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
				"<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_2371_558689)' stroke='white' stroke-opacity='0.5'/>",
				"<rect x='4.12' y='4' width='4' height='4' fill='url(#paint1_linear_2371_558689)'/><rect x='4.12' y='4' width='4' height='4' fill='white'/>",
				"<rect x='3.62' y='3.5' width='5' height='5' stroke='black' stroke-opacity='0.1'/>",
				"<defs><linearGradient id='paint0_linear_2371_558689' x1='11.12' y1='1' x2='1.12' y2='11' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#184B00'/><stop offset='1' stop-color='#52FF00'/></linearGradient>",
				"<linearGradient id='paint1_linear_2371_558689' x1='8.12' y1='4' x2='4.12' y2='8' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
				"<symbol id='LANDMARK_TYPE_5' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
				"<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_2371_558695)' stroke='white' stroke-opacity='0.5'/>",
				"<rect x='4.12' y='4' width='4' height='4' fill='url(#paint1_linear_2371_558695)'/>",
				"<rect x='4.12' y='4' width='4' height='4' fill='white'/><rect x='3.62' y='3.5' width='5' height='5' stroke='black' stroke-opacity='0.1'/>",
				"<defs><linearGradient id='paint0_linear_2371_558695' x1='11.12' y1='1' x2='1.12' y2='11' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#31F27F'/><stop offset='0.296875' stop-color='#F4BE86'/><stop offset='0.578125' stop-color='#B26FD2'/>",
				"<stop offset='0.734375' stop-color='#7F70D2'/><stop offset='1' stop-color='#8278F2'/></linearGradient>",
				"<linearGradient id='paint1_linear_2371_558695' x1='8.12' y1='4' x2='4.12' y2='8' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
				"<symbol id='LANDMARK_TYPE_6' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
				"<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_2371_558692)' stroke='white' stroke-opacity='0.5'/>",
				"<rect x='4.12' y='4' width='4' height='4' fill='url(#paint1_linear_2371_558692)'/><rect x='4.12' y='4' width='4' height='4' fill='white'/>",
				"<rect x='3.62' y='3.5' width='5' height='5' stroke='black' stroke-opacity='0.1'/><defs><linearGradient id='paint0_linear_2371_558692' x1='11.12' y1='1' x2='1.11999' y2='11' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='white'/><stop offset='0.544585' stop-color='#FFD600'/><stop offset='1' stop-color='#FF9900'/></linearGradient>",
				"<linearGradient id='paint1_linear_2371_558692' x1='8.12' y1='4' x2='4.12' y2='8' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
				"<symbol id='LANDMARK_TYPE_7' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
				"<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_2373_559424)' stroke='white' stroke-opacity='0.5'/>",
				"<rect x='3.12' y='3' width='6' height='6' fill='url(#paint1_linear_2373_559424)'/><rect x='3.12' y='3' width='6' height='6' fill='white'/>",
				"<rect x='2.62' y='2.5' width='7' height='7' stroke='black' stroke-opacity='0.1'/>",
				"<defs><linearGradient id='paint0_linear_2373_559424' x1='11.12' y1='1' x2='1.11999' y2='11' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color='#08CE01'/><stop offset='0.171875' stop-color='#CEEF00'/><stop offset='0.34375' stop-color='#51F980'/>",
				"<stop offset='0.5' stop-color='#2D51ED'/><stop offset='0.671875' stop-color='#0060F1'/><stop offset='0.833333' stop-color='#F100D9'/>",
				"<stop offset='1' stop-color='#9A24EC'/></linearGradient><linearGradient id='paint1_linear_2373_559424' x1='9.12' y1='3' x2='3.12' y2='9' gradientUnits='userSpaceOnUse'>",
				"<stop stop-color'#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
				"</defs><g fill='none' stroke-width='0'><rect width='100%' height='100%' fill='url(#GRADIENT_BOARD_TIER_",
				"LAND_TIER_ID", // This line should be replaced in the loop
				")' stroke='none' rx='5%' ry='5%'/></g><rect width='100%' height='100%' fill='url(#smallGrid)' stroke='none' rx='7%' ry='7%'/>",
				"LANDMARK", // This line should be replaced by the Landmark in the loop
				"SITES_POSITIONED", // This line should be replaced in the loop
				"<rect xmlns='http://www.w3.org/2000/svg' x='0.5' y='0.4' width='99.5%' height='99.5%' fill='none' stroke='url(#ROUNDED_BORDER_TIER_",
				"LAND_TIER_ID",
				")' stroke-width='1' rx='5%' ry='5%'/></svg>"
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
	function _generateSVG(uint8 landmarkTypeId, uint8 _tierId, uint16 gridSize, SiteSVGData[] memory _sites) private pure returns (string memory) {
		string[15] memory _mainSvgTemplate = _mainSvg(gridSize);
		string[] memory _mainSvgArray = new string[](_mainSvgTemplate.length);

		for(uint256 i = 0; i < _mainSvgTemplate.length; i++) {
				if (keccak256(bytes(_mainSvgTemplate[i])) == keccak256(bytes("LAND_TIER_ID"))) {
						_mainSvgArray[i] = uint256(_tierId).toString();
						continue;
				}
				if(keccak256(bytes(_mainSvgTemplate[i])) == keccak256(bytes("FUTURE_BOARD_CONTAINER"))) {
						_mainSvgArray[i] = _generateLandBoard(landmarkTypeId, _tierId, gridSize, _sites);
						continue;
				}
				_mainSvgArray[i] = _mainSvgTemplate[i];
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
	function _generateLandBoard(uint8 landmarkTypeId, uint8 _tierId, uint16 gridSize, SiteSVGData[] memory _sites) private pure returns (string memory) {
		string[122] memory _boardSvgTemplate = _boardSvg();
		string[] memory _boardSvgArray = new string[](_boardSvgTemplate.length);

		for (uint256 i = 0; i < _boardSvgTemplate.length; i++) {
			if (keccak256(bytes(_boardSvgTemplate[i])) == keccak256(bytes("LAND_TIER_ID"))) {
				_boardSvgArray[i] = uint256(_tierId).toString();
				continue;
			}
			if (keccak256(bytes(_boardSvgTemplate[i])) == keccak256(bytes("SITES_POSITIONED"))) {
				_boardSvgArray[i] = _generateSites(_sites);
				continue;
			}
			if (keccak256(bytes(_boardSvgTemplate[i])) == keccak256(bytes("LANDMARK"))) {
				_boardSvgArray[i] = _generateLandmarkSvg(gridSize, landmarkTypeId);
				continue;
			}
			_boardSvgArray[i] = _boardSvgTemplate[i];
  		}
  		return _joinArray(_boardSvgArray);
	}
 
 /**
  * @dev Generates each site inside the land svg board with is position and color.
	*
	* @param _sites Array of plot sites coming from PlotView struct
  */
	function _generateSites(SiteSVGData[] memory _sites) private pure returns (string memory) {
		string[] memory _siteSvgArray = new string[](_sites.length);
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
		string[] memory _siteSvgArray = new string[](_siteBaseSvg().length);

		for (uint256 i = 0; i < _siteBaseSvg().length; i++) {
			if (keccak256(bytes(_siteBaseSvg()[i])) == keccak256(bytes("SITE_TYPE_ID"))) {
				_siteSvgArray[i] = uint256(_site.typeId).toString();
				continue;
			}
			if (keccak256(bytes(_siteBaseSvg()[i])) == keccak256(bytes("SITE_X_POSITION"))) {
				_siteSvgArray[i] = _convertToSvgPosition(_site.x);
				continue;
			}
			if (keccak256(bytes(_siteBaseSvg()[i])) == keccak256(bytes("SITE_Y_POSITION"))) {
				_siteSvgArray[i] = _convertToSvgPosition(_site.y);
				continue;
			}
			_siteSvgArray[i] = _siteBaseSvg()[i];
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
	function constructTokenURI(uint8 _regionId, uint16 gridSize, uint8 landmarkTypeId, uint16 _x, uint16 _y, uint8 _tierId, SiteSVGData[] memory _sites) internal pure returns (string memory) {
		string memory name = _generateLandName(_regionId, _x, _y, _tierId);
		string memory description = _generateLandDescription();
		string memory image = Base64.encode(bytes(_generateSVG(landmarkTypeId, _tierId, gridSize, _sites)));

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
			)
		);

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
		return (_position * 3 + 3).toString();
	}
}
