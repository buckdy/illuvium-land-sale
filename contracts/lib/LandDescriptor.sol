// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

library LandDescriptor {
		using Base64 for bytes;
		using Strings for uint256;

		uint256 internal constant siteBaseSvgLength = 9;
		uint256 internal constant baseSvgLength = 105;

		function _siteBaseSvg() private pure returns (string[siteBaseSvgLength] memory siteBaseSvg) {
				siteBaseSvg = [
					"<svg viewBox='-1 -1 33 33' x='",
					"SITE_X_POSITION", // This line should be replaced in the loop
					"' y='",
					"SITE_Y_POSITION", // This line should be replaced in the loop
					"' width='30' height='30' xmlns='http://www.w3.org/2000/svg'> ",
					"<rect fill='url(#",
					"SITE_TYPE_ID", // This line should be replaced in the loop
					")' width='14' height='14' stroke='#fff' stroke-opacity='0.5'/>",
					"</svg>"
				];
		}

		function _baseSvg() private pure returns (string[baseSvgLength] memory baseSvg) {
				baseSvg = [
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
				"<pattern id='smallGrid' width='7' height='7' patternUnits='userSpaceOnUse' patternTransform='translate(7.5 100) rotate(45) scale(1.34)'>",
				"<path d='M 7 0 L 0 0 0 7' fill='none'  stroke='#130A2A' stroke-opacity='0.2'/>",
				"</pattern>",
				"</defs>",
				"<g fill='none' stroke-width='0'>",
				"<rect width='280' height='280' fill='url(#GRADIENT_BOARD_TIER_",
				"LAND_TIER_ID", // This line should be replaced in the loop
				")' stroke='none' rx='8' ry='8'/>",
				"</g>",
				"<rect x='1' y='1' width='278' height='278' fill='url(#smallGrid)' stroke='none' rx='8' ry='8'/>    ",
				"<g transform='translate(0 -68) rotate(45 140 140)'>",
				"<svg viewBox='0 0 280 280.5' width='376' height='376'>",
				"SITES_POSITIONED", // This line should be replaced in the loop
				"</svg>",
				"</g>",
				"<rect x='0.5' y='0.4' width='279' height='278.5'  stroke='url(#ROUNDED_BORDER_TIER_",
				"LAND_TIER_ID", // This line should be replaced in the loop
				")' stroke-width='1'  rx='7' ry='7' xmlns='http://www.w3.org/2000/svg'/>",
				"</svg>"
			];

}


	function _generateLandName(string memory _regionId, string memory _x, string memory _y, string memory _tierId) private pure returns (string memory) {
		return string(
			abi.encodePacked(
				"Land Tier ",
				_tierId,
				" - (",
				_regionId,
				", ",
				_x,
				", ",
				_y
			)
		);
	}

	function _generateLandDescription() private pure returns (string memory) {
		return "Describes the asset to which this NFT represents";
	}

	function _generateSVG() private pure returns (string memory) {
			string[baseSvgLength] memory _baseSvgArray = _baseSvg();

			for(uint256 i = 0; i < baseSvgLength; i++) {
					if (bytes(_baseSvgArray[i]) == bytes("LAND_TIER_ID")) {
						
					}
			}
	}

	function _generateLandBoard() private pure returns (string memory) {}

	function _constructTokenURI() private pure returns (string memory) {}
}
