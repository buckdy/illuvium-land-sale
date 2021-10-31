// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../interfaces/LandERC721Spec.sol";
import "../lib/Land.sol";
import "./ERC721Impl.sol";

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
 * @notice Land plot metadata is immutable and includes (see Land Library):
 *      - region ID (1 - 7), determines which tileset to use in game,
 *      - coordinates (x, y) on the overall world map, indicating which grid position the land sits in,
 *      - tier ID (1 - 5), the rarity of the land, tier is used to create the list of sites,
 *      - size (w, h), defines an internal coordinate system within a plot,
 *      - enumeration of sites, each site metadata including:
 *        - type ID (1 - 6), defining the type of the site:
 *          1) Carbon,
 *          2) Silicon,
 *          3) Hydrogen,
 *          4) Crypton,
 *          5) Hyperion,
 *          6) Solon
 *        - coordinates (x, y) on the land plot
 *      - landmark type ID:
 *          0) no Landmark,
 *          1) Carbon Landmark,
 *          2) Silicon Landmark,
 *          3) Hydrogen Landmark (Eternal Spring),
 *          4) Crypton Landmark,
 *          5) Hyperion Landmark,
 *          6) Solon Landmark (Fallen Star),
 *          7) Arena
 *
 * @notice A note on region, tier, site type, and landmark type IDs.
 *      Land Plot smart contract stores region, tier, site type, and landmark type IDs as part of the
 *      land metadata on-chain, however these values are not bound to any business logic within the contract.
 *      Effectively that means that helper smart contracts, backend, or frontend applications are free to
 *      treat these value at their own decision, and may redefine the meaning.
 *
 * @notice Land NFTs are minted by the trusted helper smart contract(s) (see LandSale), which are responsible
 *      for supplying the correct metadata.
 *      Land NFT contract itself doesn't store the Merkle root of the valid land metadata, and
 *      has a limited constraint validation for NFTs it mints/tracks, it guarantees:
 *         - (regionId, x, y) uniqueness
 *         - non-intersection of the sites coordinates within a plot
 *
 * @dev Minting a token requires its metadata to be supplied before or during the minting process;
 *      Burning the token destroys its metadata;
 *      Metadata can be pre-allocated: it can be set/updated/removed for non-existing tokens, and
 *      once the token is minted, its metadata becomes "frozen" - immutable, it cannot be changed or removed.
 *
 * @notice Refer to Illuvium: Zero design documents for additional information
 *
 * @author Basil Gorin
 */
// TODO: consider NFT impl optimizations, including short token ID space, metadata store in the token ID, etc.
contract LandERC721 is ERC721Impl, LandERC721Metadata {
	// Use Land Library for conversion between internal and external representations,
	using Land for Land.Plot;
	using Land for Land.PlotStore;
	// and to simplify sites data validation (non-coincidence)
	using Land for Land.Site[];

	/**
	 * @notice Metadata storage for tokens (land plots)
	 *
	 * @dev Maps token ID => token Metadata (PlotData struct)
	 */
	mapping(uint256 => Land.PlotStore) public plots;

	/**
	 * @notice Auxiliary data structure tracking all the occupied land plot
	 *      locations, and used to guarantee the (regionId, x, y) uniqueness
	 *
	 * @dev Maps packed plot location (regionId, x, y) => token ID
	 */
	mapping(uint256 => uint256) public plotLocations;

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
	uint32 public constant ROLE_METADATA_PROVIDER = 0x0004_0000;

	/**
	 * @dev Fired in `setMetadata()` when token metadata is set/updated
	 *
	 * @param _tokenId token ID which metadata was updated/set
	 * @param _plot new token metadata as a Land.Plot struct
	 */
	event MetadataUpdated(uint256 indexed _tokenId, Land.Plot _plot);

	/**
	 * @dev Fired in `removeMetadata()` when token metadata is removed
	 *
	 * @param _tokenId token ID which metadata was removed
	 * @param _plot old token metadata (which was removed) as a Land.Plot struct
	 */
	event MetadataRemoved(uint256 indexed _tokenId, Land.Plot _plot);

	/**
	 * @dev Creates/deploys Land NFT instance
	 *      with the predefined name and symbol
	 */
	// TODO: finalize token name and symbol with Illuvium
	constructor() ERC721Impl("Land", "LND") {}

	/**
	 * @inheritdoc IERC165
	 */
	function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
		// calculate based on own and inherited interfaces
		return super.supportsInterface(interfaceId)
			|| interfaceId == type(LandERC721Metadata).interfaceId;
	}

	/**
	 * @notice Presents token metadata in a well readable form, as `Land.Plot` struct;
	 *      metadata is stored on-chain tightly packed, in the format easily readable
	 *      only for machines, this function converts it to a more human-readable form
	 *
	 * @param _tokenId token ID to query and convert metadata for
	 * @return token metadata as a `Land.Plot` struct
	 */
	function getMetadata(uint256 _tokenId) public view override returns(Land.Plot memory) {
		// use Land Library to convert internal representation into the Plot view
		return plots[_tokenId].plotView();
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
	function hasMetadata(uint256 _tokenId) public view override returns(bool) {
		// determine plot existence based on its metadata stored
		return plots[_tokenId].dataPacked != 0;
	}

	/**
	 * @dev Restricted access function to set/update token on-chain metadata;
	 *      metadata is presented as Land.Plot struct, and is stored on-chain
	 *      as Land.PlotStore struct
	 *
	 * @dev Requires executor to have ROLE_METADATA_PROVIDER permission
	 *
	 * @dev The metadata supplied is validated to satisfy several constraints:
	 *      - (regionId, x, y) plot coordinates uniqueness
	 *      - (x, y) sites coordinates uniqueness within a plot
	 *
	 * @dev Expects the sites array to be sorted ascending using `Land.loc(Site)` as a comparator,
	 *      throws if the array is not sorted or if there are sites with the same locations (x, y)
	 *
	 * @dev Metadata for non-existing tokens can be set and updated unlimited
	 *      amount of times without any restrictions (except the constraints above)
	 * @dev Metadata for an existing token can only be set, it cannot be updated
	 *      (`setMetadata` will throw if metadata already exists)
	 *
	 * @param _tokenId token ID to set/updated the metadata for
	 * @param _plot token metadata to be set for the token ID
	 */
	function setMetadata(uint256 _tokenId, Land.Plot memory _plot) public override {
		// verify the access permission
		require(isSenderInRole(ROLE_METADATA_PROVIDER), "access denied");

		// verify sites do not coincide (assumes sites are sorted (x, y))
		require(_plot.sites.unique(), "sites coincide");

		// for existing tokens metadata can be created, but not updated
		require(!exists(_tokenId) || !hasMetadata(_tokenId), "forbidden");

		// ensure the location of the plot is not yet taken
		require(plotLocations[_plot.loc()] == 0, "spot taken");

		// register the plot location
		plotLocations[_plot.loc()] = _tokenId;

		// write metadata into the storage
		plots[_tokenId] = _plot.plotPacked();

		// emit an event
		emit MetadataUpdated(_tokenId, _plot);
	}

	/**
	 * @dev Restricted access function to remove token metadata
	 *
	 * @dev Requires executor to have ROLE_METADATA_PROVIDER permission
	 *
	 * @param _tokenId token ID to remove metadata for
	 */
	function removeMetadata(uint256 _tokenId) public override {
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

		// emit an event first - to log the data which will be deleted
		emit MetadataRemoved(_tokenId, plots[_tokenId].plotView());

		// erase token metadata
		delete plots[_tokenId];
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
	function mintWithMetadata(address _to, uint256 _tokenId, Land.Plot memory _plot) public override {
		// simply create token metadata and mint it in the correct order:

		// 1. set the token metadata via `setMetadata`
		setMetadata(_tokenId, _plot);

		// 2. mint the token via `mint`
		mint(_to, _tokenId);
	}

	/**
	 * @inheritdoc ERC721Impl
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
	 * @inheritdoc ERC721Impl
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
