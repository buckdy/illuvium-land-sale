// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

library LandDescriptor {
	using Base64 for bytes;
	using Strings for uint256;

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

	function _generateLandDescription() private pure returns (string memory) {
		return "Describes the asset to which this NFT represents";
	}

	function _generateSVG() private pure returns (string memory) {}

	function _constructTokenURI() private pure returns (string memory) {}
}
