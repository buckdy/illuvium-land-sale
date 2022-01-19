// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./LandLib.sol";
import "base64-sol/base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "prb-math/contracts/PRBMathUD60x18.sol";

/**
 * @title NFT Svg
 *
 * @notice Provide functions to generate SVG image representation of the LandERC721, and other
 *      auxiliary functions to construct token metadata JSON, and encode it into base64 format.
 *
 * @notice base64 is the OpenSea standard for NFT SVG images. The SVG JSON generated by the
 *      `constructTokenURI` is meant to be used in the marketplace.
 *
 * @notice `_mainSvg(uint16,uint8)` function holds the main structure with the dimensions for
 *      the image, the retuning array contains flags that are to be replaced by another SVG component,
 *      FUTURE_BOARD_CONTAINER.
 *
 * @notice `_siteBaseSvg(uint16,uint16,uint8)` will generate a site's component string,
 *      given it's coordinates and typeId.
 *
 * @notice `_boardSvg(uint16,uint8)` returns the template for the the board component, depending on the
 *      size of the grid and tier ID, LANDMARK and SITES_POSITIONED will need to be replaced in a loop.
 * @notice `_generateLandmarkSvg(uint16,uint8)` will generate the landmark SVG string given grid size
 *      and landmark type ID.
 *
 * @notice Replacement schema:
 *      - LANDMARK -> `_generateLandmarkSvg(uint16,uint8)`
 *      - SITES_POSITIONED -> `_generateSites(LandLib.Site[] memory)`
 *      - FUTURE_BOARD_CONTAINER -> _generateLandBoard(uint8,uint16,uint8,LandLib.Site[] memory)`
 *
 * @notice Loop flag replacement is chosen instead of using function parameters when the replacement
 *      involves a complex component with considerable string length.
 *
 * @notice The coordinates for the SVG are transformed in a way that there'll be `gridSize/2` grid squares
 *      in the isomorphic grid, given that a square has a size of 3.
 *
 * @author Pedro Bergamini, Yuri Fernandes, Estevan Wisoczynski
 */
library NFTSvg {
	using Strings for uint256;
	using PRBMathUD60x18 for uint256;

	/**
	* @dev Returns the main svg array component, used in the top level of the generated land SVG.
	*
	* @param _gridSize The size of the grid
	* @param _tierId PlotView.tierId land tier id
	* @return The base for the land SVG, need to substitute LAND_TIER_ID and FUTURE_BOARD_CONTAINER
	*/
	function _mainSvg(uint16 _gridSize, uint8 _tierId) private pure returns (string[11] memory) {
		// Multiply by 3 to get number of grid squares = dimension of the isomorphic grid size

		return [
			"<svg height='",
			uint256(_gridSize * 3 + 6).toString(), 
			"' width='",
			uint256(_gridSize * 3).toString(), 
			"' stroke-width='2' xmlns='http://www.w3.org/2000/svg'>",
			"<rect rx='5%' ry='5%' width='100%' height='99%' fill='url(#BOARD_BOTTOM_BORDER_COLOR_TIER_",
			uint256(_tierId).toString(),
			")' stroke='none'/>",
			"<svg height='97.6%' width='100%' stroke-width='2' xmlns='http://www.w3.org/2000/svg'>",
			"FUTURE_BOARD_CONTAINER", // This line should be replaced in the loop
			"</svg>"
		];
	}

	/**
	* @dev Returns the site base svg array component, used to represent
	*      a site inside the land board.
	*
	* @param _x Sites.x position
	* @param _y Sites.y position
	* @param _typeId Sites.typeId
	* @return The base SVG element for the sites
	*/
	function _siteBaseSvg(uint16 _x, uint16 _y, uint8 _typeId) private pure returns (string memory) {
		string[] memory siteBaseSvgArray = new string[](7);
		siteBaseSvgArray[0] = "<svg x='";
		siteBaseSvgArray[1] = uint256(_x).toString();
		siteBaseSvgArray[2] = "' y='";
		siteBaseSvgArray[3] = uint256(_y).toString();
		siteBaseSvgArray[4] = "' width='6' height='6' xmlns='http://www.w3.org/2000/svg'><use href='#SITE_TYPE_";
		siteBaseSvgArray[5] = uint256(_typeId).toString();
		siteBaseSvgArray[6] = "' /></svg>";

		return _joinArray(siteBaseSvgArray);
	}

	/**
	* @dev Returns the site base svg array component, used to represent
	*      a landmark inside the land board.
	*
	* @param _gridSize The size of the grid
	* @param _landmarkTypeId landmark type defined by its ID
	* @return Concatenation of the landmark SVG component to be added the board SVG
	*/
	function _generateLandmarkSvg(uint16 _gridSize, uint8 _landmarkTypeId) private pure returns (string memory) {
		uint256 landmarkPos = uint256(_gridSize - 2).fromUint().div(uint256(2).fromUint()).mul(uint256(3).fromUint());
		string memory landmarkFloatX;
		string memory landmarkFloatY;
		if (_gridSize % 2 == 0) {
			landmarkFloatX = landmarkPos.toUint().toString();
			landmarkFloatY = (landmarkPos.toUint() - 3).toString();
		} else {
			landmarkFloatX = (landmarkPos.ceil().toUint() + 1).toString();
			landmarkFloatY = (landmarkPos.floor().toUint() - 1).toString();
		}

		string[] memory landmarkSvgArray = new string[](7);
		landmarkSvgArray[0] = "<svg x='";
		landmarkSvgArray[1] = landmarkFloatX;
		landmarkSvgArray[2] = "' y='";
		landmarkSvgArray[3] = landmarkFloatY;
		landmarkSvgArray[4] = "' width='6' height='6' xmlns='http://www.w3.org/2000/svg'><use href='#LANDMARK_TYPE_";
		landmarkSvgArray[5] = uint256(_landmarkTypeId).toString();
		landmarkSvgArray[6] = "'/></svg>";

		return _joinArray(landmarkSvgArray);
	}

	/**
	* @dev Returns the land board base svg array component, which has its color changed
	*      later in other functions.
	*
	* @param _gridSize The size of the grid
	* @param _tierId PlotView.tierId land tier id
	* @return Array of board SVG component parts
	*/
	function _boardSvg(uint16 _gridSize, uint8 _tierId) private pure returns (string[141] memory) {
		uint256 scaledGridSize = uint256(_gridSize).fromUint().div(uint256(2).fromUint()).mul(uint256(3).fromUint());
		string memory scaledGridSizeString = string(
			abi.encodePacked(
				scaledGridSize.toUint().toString(),
				".",
				truncateString(scaledGridSize.frac().toString(), 0, 2)
			)
		);
		return [
		"<defs><symbol id='SITE_TYPE_1' width='6' height='6'>", // Site Carbon
		"<svg width='6' height='6' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>",
		"<rect x='1.12' y='1' width='12' height='12' fill='url(#site-type-1)' stroke='white' stroke-opacity='0.5'/>",
		"<defs><linearGradient id='site-type-1' x1='13.12' y1='1' x2='1.12' y2='13' gradientUnits='userSpaceOnUse'>",
		"<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
		"<symbol id='SITE_TYPE_2' width='6' height='6'>", // Site Silicon
		"<svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
		"<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_1321_129011)' stroke='white' stroke-opacity='0.5'/>",
		"<defs><linearGradient id='paint0_linear_1321_129011' x1='11.12' y1='1' x2='1.12' y2='11' gradientUnits='userSpaceOnUse'>",
		"<stop stop-color='#CBE2FF'/><stop offset='1' stop-color='#EFEFEF'/></linearGradient></defs></svg></symbol>",
		"<symbol id='SITE_TYPE_3' width='6' height='6'>", // Site Hydrogen
		"<svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
		"<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_1320_145814)' stroke='white' stroke-opacity='0.5'/>",
		"<defs><linearGradient id='paint0_linear_1320_145814' x1='11.12' y1='1' x2='-0.862058' y2='7.11845' gradientUnits='userSpaceOnUse'>",
		"<stop stop-color='#8CD4D9'/><stop offset='1' stop-color='#598FA6'/></linearGradient></defs></svg></symbol>",
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
		"<pattern id='smallGrid' width='3' height='3' patternUnits='userSpaceOnUse' patternTransform='rotate(45 ",
		string(abi.encodePacked(scaledGridSizeString, " ", scaledGridSizeString)),
		")'><path d='M 3 0 L 0 0 0 3' fill='none' stroke-width='0.3%' stroke='#130A2A' stroke-opacity='0.2' />",
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
		"</defs><rect width='100%' height='100%' fill='url(#GRADIENT_BOARD_TIER_",
		uint256(_tierId).toString(), // This line should be replaced in the loop
		")' stroke='none' rx='5%' ry='5%'/><svg x='",
		_gridSize % 2 == 0 ? "-17%" : "-18%",
		"' y='",
		_gridSize % 2 == 0 ? "-17%" : "-18%",
		"' width='",
		_gridSize % 2 == 0 ? "117%" : "117.8%",
		"' height='",
		_gridSize % 2 == 0 ? "116.4%" : "117.8%",
		"' ><g transform='scale(1.34)' rx='5%' ry='5%' ><rect x='",
		_gridSize % 2 == 0 ? "11%" : "11.6%",
		"' y='",
		_gridSize % 2 == 0 ? "11.2%" : "11.6%",
		"' width='",
		_gridSize % 2 == 0 ? "63.6%" : "63.0%",
		"' height='",
		_gridSize % 2 == 0 ? "63.8%" : "63.2%",
		"' fill='url(#smallGrid)' stroke='none'  rx='3%' ry='3%' /><g transform='rotate(45 ",
		string(abi.encodePacked(scaledGridSizeString, " ", scaledGridSizeString, ")'>")),
		"LANDMARK", // This line should be replaced by the Landmark in the loop
		"SITES_POSITIONED", // This line should be replaced in the loop
		"</g></g></svg>",
		"<rect xmlns='http://www.w3.org/2000/svg' x='0.3' y='0.3' width='99.7%' height='99.7%' fill='none' stroke='url(#ROUNDED_BORDER_TIER_",
		uint256(_tierId).toString(),
		")' stroke-width='1' rx='4.5%' ry='4.5%'/></svg>"
		];

	}

	/**
	* @dev Calculates string for the land name based on plot data.
	*
	* @param _regionId PlotView.regionId
	* @param _x PlotView.x coordinate
	* @param _y PlotView.y coordinate
	* @param _tierId PlotView.tierId land tier id
	* @return SVG name attribute
	*/
	function _generateLandName(uint8 _regionId, uint16 _x, uint16 _y, uint8 _tierId) private pure returns (string memory) {
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
	* @param _landmarkTypeId landmark type defined by its ID
	* @param _tierId PlotView.tierId land tier id
	* @param _gridSize The size of the grid
	* @param _sites Array of plot sites coming from PlotView struct
	* @return The SVG image component
	*/
	function _generateSVG(
		uint8 _landmarkTypeId,
		uint8 _tierId,
		uint16 _gridSize,
		LandLib.Site[] memory _sites
	) private pure returns (string memory) {
		string[11] memory _mainSvgTemplate = _mainSvg(_gridSize, _tierId);
		string[] memory _mainSvgArray = new string[](_mainSvgTemplate.length);

		for(uint256 i = 0; i < _mainSvgTemplate.length; i++) {
				if(keccak256(bytes(_mainSvgTemplate[i])) == keccak256(bytes("FUTURE_BOARD_CONTAINER"))) {
						_mainSvgArray[i] = _generateLandBoard(_tierId, _gridSize, _landmarkTypeId, _sites);
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
	* @param _gridSize The size of the grid
	* @param _landmarkTypeId landmark type defined by its ID
	* @param _sites Array of plot sites coming from PlotView struct
	* @return The board component for the land SVG
	*/
	function _generateLandBoard(
		uint8 _tierId,
		uint16 _gridSize,
		uint8 _landmarkTypeId,
		LandLib.Site[] memory _sites
	) private pure returns (string memory) {
		string[141] memory _boardSvgTemplate = _boardSvg(_gridSize, _tierId);
		string[] memory _boardSvgArray = new string[](_boardSvgTemplate.length);

		for (uint256 i = 0; i < _boardSvgTemplate.length; i++) {
			if (keccak256(bytes(_boardSvgTemplate[i])) == keccak256(bytes("SITES_POSITIONED"))) {
				_boardSvgArray[i] = _generateSites(_sites);
				continue;
			}
			if (keccak256(bytes(_boardSvgTemplate[i])) == keccak256(bytes("LANDMARK"))) {
				_boardSvgArray[i] = _generateLandmarkSvg(_gridSize, _landmarkTypeId);
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
	* @return The sites components for the land SVG
	*/
	function _generateSites(LandLib.Site[] memory _sites) private pure returns (string memory) {
		string[] memory _siteSvgArray = new string[](_sites.length);
		for (uint256 i = 0; i < _sites.length; i++) {
			_siteSvgArray[i] = _siteBaseSvg(
				_convertToSvgPositionX(_sites[i].x), 
				_convertToSvgPositionY(_sites[i].y), 
				_sites[i].typeId
			);
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
	* @param _gridSize The size of the grid
	* @param _landmarkTypeId landmark type defined by its ID
	* @param _sites Array of plot sites coming from PlotView struct
	*/
	function constructTokenURI(
		uint8 _regionId,
		uint16 _x,
		uint16 _y,
		uint8 _tierId,
		uint16 _gridSize,
		uint8 _landmarkTypeId,
		LandLib.Site[] memory _sites
	) internal pure returns (string memory) {
		string memory name = _generateLandName(_regionId, _x, _y, _tierId);
		string memory description = _generateLandDescription();
		string memory image = Base64.encode(bytes(_generateSVG(_landmarkTypeId, _tierId, _gridSize, _sites)));

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

	/**
	* @dev Concatenate string array into one string.
	*
	* @param _svgArray Array containing SVG strings/elements
	* @return Concatenated SVG string
	*/
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

	/**
	* @dev Convert site X position to fit into the board.
	*
	* @param _positionX X coordinate of the site
	* @return Transformed X coordinate
	*/
	function _convertToSvgPositionX(uint16 _positionX) private pure returns (uint16) {
		return _positionX * 3;
	}

	/**
	* @dev Convert site Y position to fit into the board.
	*
	* @param _positionY Y coordinate of the site
	* @return Transformed Y coordinate
	*/
	function _convertToSvgPositionY(uint16 _positionY) private pure returns (uint16) {
		return _positionY * 3;
	}

	/**
	* @dev Truncate string at a certain position and size.
	*
	* @param _str String to be truncated
	* @param _from The initial position to start slicing
	* @param _size The size of the resulting substring
	* @return Truncated string
	*/
	function truncateString(string memory _str, uint256 _from, uint256 _size) internal pure returns (string memory) {
		bytes memory stringBytes = bytes(_str);
		if (_from + _size >= stringBytes.length) {
			return _str;
		}

		bytes memory truncatedBytes = new bytes(_size);
		uint256 j;
		for (uint256 i = _from; i < _from + _size; i++) {
			truncatedBytes[j] = stringBytes[i];
			j++;
		}

		return string(truncatedBytes);
	}
}
