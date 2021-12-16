// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

library LandDescriptor {
	using Base64 for bytes;
	using Strings for uint256;

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

	function _generateSVG() private pure returns (string memory) {}

	function _generateLandBoard() private pure returns (string memory) {}

	function _constructTokenURI() private pure returns (string memory) {}
}
