// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../interfaces/LandERC721Spec.sol";
import "../interfaces/LandDescriptorSpec.sol";
import "../lib/LandLib.sol";
import "./RoyalERC721.sol";

/**
 * @title Land ERC721
 *
 * @notice Land ERC721 (a.k.a Land Plot, Land, or Land NFT) represents land plots in Illuvium: Zero (IZ).
 *      Each token is a piece of land (land plot) on the overall world map in IZ.
 *
 * @notice Land plot is uniquely identified by its region and coordinates (x, y) within the region.
 *      There can be only one plot with the given coordinates (x, y) in a given region.
 *
 * @notice Land plot has internal coordinate system used to place the structures (off-chain).
 *      Land plot may contain "sites" with the resources,
 *      a Landmark, increasing the resource production / decreasing resource losses,
 *      or a special type of Landmark - Arena, used to host tournaments.
 *      Sites are positioned on the plot and have their own coordinates (x, y) within a plot.
 *      Number of sites depends on the land plot rarity (tier).
 *      Landmark may exist only in the rare land plots (tier 3 or higher) and resides in the center of the plot.
 *
 * @notice Land plot does not contain details on the structures, these details are stored off-chain.
 *      The fundamental value of the Land is always drawn from the underlying Land NFT,
 *      which produces Fuel in the form of an ERC20 tokens.
 *
 * @notice Land plot metadata is immutable and includes (see `LandView` structure):
 *      - Region ID (1 - 7), determines which tileset to use in game,
 *      - Coordinates (x, y) on the overall world map, indicating which grid position the land sits in,
 *      - Tier ID (1 - 5), the rarity of the land, tier is used to create the list of sites,
 *      - Plot Size, defines an internal coordinate system within a plot,
 *      - Internal Land Structure
 *        - enumeration of sites, each site metadata including:
 *          - Type ID (1 - 6), defining the type of the site:
 *            1) Carbon,
 *            2) Silicon,
 *            3) Hydrogen,
 *            4) Crypton,
 *            5) Hyperion,
 *            6) Solon
 *          - Coordinates (x, y) on the land plot
 *        - Landmark Type ID:
 *            0) no Landmark,
 *            1) Carbon Landmark,
 *            2) Silicon Landmark,
 *            3) Hydrogen Landmark (Eternal Spring),
 *            4) Crypton Landmark,
 *            5) Hyperion Landmark,
 *            6) Solon Landmark (Fallen Star),
 *            7) Arena
 *
 * @notice Region ID, Coordinates (x, y), Tier ID, and Plot Size are stored as is, while Internal Land Structure
 *      is derived from Tier ID, Plot Size, and a Seed (see `LandStore` structure)
 *
 * @notice A note on Region, Coordinates (x, y), Tier, Plot Size, and Internal Land Structure.
 *      Land Plot smart contract stores Region, Coordinates (x, y), Tier, Plot Size, and Internal Land Structure
 *      as part of the land metadata on-chain, however the use of these values within the smart contract is limited.
 *      Effectively that means that helper smart contracts, backend, or frontend applications can, to some extent,
 *      treat these values at their own decision, may redefine, enrich, or ignore their meaning.
 *
 * @notice Land NFTs are minted by the trusted helper smart contract(s) (see `LandSale`), which are responsible
 *      for supplying the correct metadata.
 *      Land NFT contract itself doesn't store the Merkle root of the valid land metadata, and
 *      has a limited constraint validation for NFTs it mints/tracks, it guarantees:
 *         - (regionId, x, y) uniqueness
 *         - non-intersection of the sites coordinates within a plot
 *         - correspondence of the number of resource sites and their types to the land tier
 *         - correspondence of the landmark type to the land tier
 *
 * @dev Minting a token requires its metadata to be supplied before or during the minting process;
 *      Burning the token destroys its metadata;
 *      Metadata can be pre-allocated: it can be set/updated/removed for non-existing tokens, and
 *      once the token is minted, its metadata becomes "frozen" - immutable, it cannot be changed or removed.
 *
 * @notice Refer to "Illuvium: Zero" design documents for additional information about the game.
 *      Refer to "Illuvium Land Sale On-chain Architecture" for additional information about
 *      the technical design of the Land ERC721 token and Land Sale smart contracts and their interaction.
 *
 * @author Basil Gorin
 */
contract LandERC721 is RoyalERC721, LandERC721Metadata {
	// Use Land Library to generate Internal Land Structure, extract plot coordinates, etc.
	using LandLib for LandLib.PlotView;
	using LandLib for LandLib.PlotStore;

	/**
	 * @inheritdoc IdentifiableToken
	 */
	uint256 public constant override TOKEN_UID = 0x805d1eb685f9eaad4306ed05ef803361e9c0b3aef93774c4b118255ab3f9c7d1;
	/**
	 * @dev Land Descriptor contract address. 
	 * @notice Can be updated by the eDAO in the future to new versions through
	 *         `setLandDescriptor()`.
	 */
	address public landDescriptor;

	/**
	 * @notice Metadata storage for tokens (land plots)
	 * @notice Accessible via `getMetadata(uint256)`
	 *
	 * @dev Maps token ID => token Metadata (PlotData struct)
	 */
	mapping(uint256 => LandLib.PlotStore) internal plots;

	/**
	 * @notice Auxiliary data structure tracking all the occupied land plot
	 *      locations, and used to guarantee the (regionId, x, y) uniqueness
	 *
	 * @dev Maps packed plot location (regionId, x, y) => token ID
	 */
	mapping(uint256 => uint256) public plotLocations;

	/**
	 * @dev Empty reserved space in storage. The size of the __gap array is calculated so that
	 *      the amount of storage used by a contract always adds up to the 50.
	 *      See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
	 */
	uint256[47] private __gap;

	/**
	 * @notice Metadata provider is responsible for writing tokens' metadata
	 *      (for an arbitrary token - be it an existing token or non-existing one)
	 * @notice The limitation is that for an existing token its metadata can
	 *      be written only once, it is impossible to modify existing
	 *      token's metadata, its effectively immutable
	 *
	 * @dev Role ROLE_METADATA_PROVIDER allows writing tokens' metadata
	 *      (calling `setMetadata` function)
	 * @dev ROLE_TOKEN_CREATOR and ROLE_METADATA_PROVIDER roles are usually
	 *      used together, since the token should always be created with the
	 *      metadata supplied
	 */
	uint32 public constant ROLE_METADATA_PROVIDER = 0x0040_0000;

	/**
	 * @dev Fired in `setMetadata()` when token metadata is set/updated
	 *
	 * @param _tokenId token ID which metadata was updated/set
	 * @param _plot new token metadata
	 */
	event MetadataUpdated(uint256 indexed _tokenId, LandLib.PlotStore _plot);

	/**
	 * @dev Fired in `removeMetadata()` when token metadata is removed
	 *
	 * @param _tokenId token ID which metadata was removed
	 * @param _plot old token metadata (which was removed)
	 */
	event MetadataRemoved(uint256 indexed _tokenId, LandLib.PlotStore _plot);

	/**
	 * @dev "Constructor replacement" for upgradeable, must be execute immediately after deployment
	 *      see https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#initializers
	 *
	 * param _name token name (ERC721Metadata)
	 * param _symbol token symbol (ERC721Metadata)
	 * param _owner smart contract owner having full privileges
	 */
	function postConstruct() public virtual initializer {
		// execute all parent initializers in cascade
		RoyalERC721._postConstruct("Land", "LND", msg.sender);
	}

	/**
	 * @inheritdoc IERC165
	 */
	function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
		// calculate based on own and inherited interfaces
		return super.supportsInterface(interfaceId)
			|| interfaceId == type(LandERC721Metadata).interfaceId;
	}

	/**
	 * @notice Presents token metadata in a well readable form,
	 *      with the Internal Land Structure included, as a `PlotView` struct
	 *
	 * @notice Reconstructs the internal land structure of the plot based on the stored
	 *      Tier ID, Plot Size, Generator Version, and Seed
	 *
	 * @param _tokenId token ID to query metadata view for
	 * @return token metadata as a `PlotView` struct
	 */
	function viewMetadata(uint256 _tokenId) public view virtual override returns(LandLib.PlotView memory) {
		// use Land Library to convert internal representation into the Plot view
		return plots[_tokenId].plotView();
	}

	/**
	 * @notice Presents token metadata "as is", without the Internal Land Structure included,
	 *      as a `PlotStore` struct;
	 *
	 * @notice Doesn't reconstruct the internal land structure of the plot, allowing to
	 *      access Generator Version, and Seed fields "as is"
	 *
	 * @param _tokenId token ID to query on-chain metadata for
	 * @return token metadata as a `PlotStore` struct
	 */
	function getMetadata(uint256 _tokenId) public view override returns(LandLib.PlotStore memory) {
		// simply return the plot metadata as it is stored
		return plots[_tokenId];
	}

	/**
	 * @notice Verifies if token has its metadata set on-chain; for the tokens
	 *      in existence metadata is immutable, it can be set once, and not updated
	 *
	 * @dev If `exists(_tokenId) && hasMetadata(_tokenId)` is true, `setMetadata`
	 *      for such a `_tokenId` will always throw
	 *
	 * @param _tokenId token ID to check metadata existence for
	 * @return true if token ID specified has metadata associated with it
	 */
	function hasMetadata(uint256 _tokenId) public view virtual override returns(bool) {
		// determine plot existence based on its metadata stored
		return plots[_tokenId].seed != 0;
	}

	/**
	 * @dev Standard ERC721 tokenURI function.
	 * @dev Checks if a custom tokenURI was given to _tokenId in storage. Standard/expected
	 *      behavior is to call Land Descriptor contract to generate the JSON metadata
	 *      based on _tokenId plot data.
	 */
	function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
			string memory storedTokenURI = super.tokenURI(_tokenId);

			if (bytes(storedTokenURI).length != 0) {
					return storedTokenURI;
			} else {
					return LandDescriptor(landDescriptor).tokenURI(this, _tokenId);
			}
	}

	/**
	 * @dev Sets/updates token metadata on-chain; same metadata struct can be then
	 *      read back using `getMetadata()` function, or it can be converted to
	 *      `PlotView` using `viewMetadata()` function
	 *
	 * @dev The metadata supplied is validated to satisfy (regionId, x, y) uniqueness;
	 *      non-intersection of the sites coordinates within a plot is guaranteed by the
	 *      internal land structure generator algorithm embedded into the `viewMetadata()`
	 *
	 * @dev Metadata for non-existing tokens can be set and updated unlimited
	 *      amount of times without any restrictions (except the constraints above)
	 * @dev Metadata for an existing token can only be set, it cannot be updated
	 *      (`setMetadata` will throw if metadata already exists)
	 *
	 * @dev Requires executor to have ROLE_METADATA_PROVIDER permission
	 *
	 * @param _tokenId token ID to set/updated the metadata for
	 * @param _plot token metadata to be set for the token ID
	 */
	function setMetadata(uint256 _tokenId, LandLib.PlotStore memory _plot) public virtual override {
		// verify the access permission
		require(isSenderInRole(ROLE_METADATA_PROVIDER), "access denied");

		// validate the metadata
		require(_plot.size >= 32, "too small");

		// metadata cannot be updated for existing token
		require(!exists(_tokenId), "token exists");

		// ensure the location of the plot is not yet taken
		require(plotLocations[_plot.loc()] == 0, "spot taken");

		// register the plot location
		plotLocations[_plot.loc()] = _tokenId;

		// write metadata into the storage
		plots[_tokenId] = _plot;

		// emit an event
		emit MetadataUpdated(_tokenId, _plot);
	}

	/**
	 * @dev Land Descriptor contract setter.
	 * @dev Expected to be called by the eDAO in future updates if needed.
	 */
	function setLandDescriptor(address _landDescriptor) external virtual {
		// verifies access
		// we use the same role as TOKEN_CREATOR, which should be the eDAO in this case
		require(isSenderInRole(ROLE_TOKEN_CREATOR), "access denied");
		// just updates previous address with new contract
		landDescriptor = _landDescriptor
	}

	/**
	 * @dev Restricted access function to remove token metadata
	 *
	 * @dev Requires executor to have ROLE_METADATA_PROVIDER permission
	 *
	 * @param _tokenId token ID to remove metadata for
	 */
	function removeMetadata(uint256 _tokenId) public virtual override {
		// verify the access permission
		require(isSenderInRole(ROLE_METADATA_PROVIDER), "access denied");

		// remove token metadata - delegate to `_removeMetadata`
		_removeMetadata(_tokenId);
	}

	/**
	 * @dev Internal helper function to remove token metadata
	 *
	 * @param _tokenId token ID to remove metadata for
	 */
	function _removeMetadata(uint256 _tokenId) private {
		// verify token doesn't exist
		require(!exists(_tokenId), "token exists");

		// read the plot - it will be logged into event anyway
		LandLib.PlotStore memory _plot = plots[_tokenId];

		// erase token metadata
		delete plots[_tokenId];

		// unregister the plot location
		delete plotLocations[_plot.loc()];

		// emit an event first - to log the data which will be deleted
		emit MetadataRemoved(_tokenId, _plot);
	}

	/**
	 * @dev Restricted access function to mint the token
	 *      and assign the metadata supplied
	 *
	 * @dev Creates new token with the token ID specified
	 *      and assigns an ownership `_to` for this token
	 *
	 * @dev Unsafe: doesn't execute `onERC721Received` on the receiver.
	 *      Consider minting with `safeMint` (and setting metadata before),
	 *      for the "safe mint" like behavior
	 *
	 * @dev Requires executor to have ROLE_METADATA_PROVIDER
	 *      and ROLE_TOKEN_CREATOR permissions
	 *
	 * @param _to an address to mint token to
	 * @param _tokenId token ID to mint and set metadata for
	 * @param _plot token metadata to be set for the token ID
	 */
	function mintWithMetadata(address _to, uint256 _tokenId, LandLib.PlotStore memory _plot) public virtual override {
		// simply create token metadata and mint it in the correct order:

		// 1. set the token metadata via `setMetadata`
		setMetadata(_tokenId, _plot);

		// 2. mint the token via `mint`
		mint(_to, _tokenId);
	}

	/**
	 * @inheritdoc UpgradeableERC721
	 *
	 * @dev Overridden function is required to ensure
	 *      - zero token ID is not minted
	 *      - token Metadata exists when minting
	 */
	function _mint(address _to, uint256 _tokenId) internal virtual override {
		// zero token ID is invalid (see `plotLocations` mapping)
		require(_tokenId != 0, "zero ID");

		// verify the metadata for the token already exists
		require(hasMetadata(_tokenId), "no metadata");

		// mint the token - delegate to `super._mint`
		super._mint(_to, _tokenId);
	}

	/**
	 * @inheritdoc UpgradeableERC721
	 *
	 * @dev Overridden function is required to erase token Metadata when burning
	 */
	function _burn(uint256 _tokenId) internal virtual override {
		// burn the token itself - delegate to `super._burn`
		super._burn(_tokenId);

		// remove token metadata - delegate to `_removeMetadata`
		_removeMetadata(_tokenId);
	}
}
