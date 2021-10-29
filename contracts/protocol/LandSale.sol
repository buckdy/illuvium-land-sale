// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../lib/Land.sol";
import "../token/LandERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title Land Sale
 *
 * @notice Enables the Land NFT sale via dutch auction mechanism
 *
 * @notice The proposed volume of land is approximately 100,000 plots, split amongst the 7 regions.
 *      The volume is released over a series of staggered sales with the first sale featuring
 *      about 10% of the total land.
 *      These plots are geographically linked in their region, but each region is isolated from
 *      the others due to the nature of the planet where they exist.
 *
 * @notice The data required to mint a plot includes (see `PlotData` struct):
 *      - token ID, defines a unique ID for the land plot used as ERC721 token ID
 *      - sequence ID, defines the time frame when the plot is available for sale
 *      - region ID (1 - 7), determines which tileset to use in game,
 *      - coordinates (x, y) on the overall world map, indicating which grid position the land sits in,
 *      - tier ID (1 - 5), the rarity of the land, tier is used to create the list of sites,
 *      - size (w, h), defines an internal coordinate system within a plot,
 *
 * @notice Since minting a plot requires at least 32 bytes of data and due to significant
 *      amount of plots to be minted (about 100,000), pre-storing this data on-chain
 *      is not a viable option (2,000,000,000 of gas only to pay for the storage).
 *      Instead, we represent the whole land plot data collection, sale smart contract is responsible for as
 *      a Merkle tree structure and store the root of the merkle tree on-chain.
 *
 * @notice The input data is a collection of `PlotData` structures; Merkle tree is built out
 *      from this collection, and the tree root is stored on the contract by its data manager.
 *      When buying a plot, the buyer specifies also the Merkle proof for a plot data to mint.
 // TODO: document dutch auction params and sequences
 * @author Basil Gorin
 */
// TODO: add implementation details soldoc
contract LandSale is AccessControl {
	// Use Zeppelin MerkleProof Library to verify Merkle proofs
	using MerkleProof for bytes32[];

	/**
	 * @notice Data structure modeling the data entry required to mint a single plot.
	 *      The contract is initialized with the Merkle root of the plots collection Merkle tree.
	 * @dev When buying a plot this data structure must be supplied together with the
	 *      Merkle proof allowing to verify the plot data belongs to the original collection.
	 */
	struct PlotData {
		/// @dev Token ID, defines a unique ID for the land plot used as ERC721 token ID
		uint32 tokenId;
		/// @dev Sequence ID, defines the time frame when the plot is available for sale
		uint32 sequenceId;
		/// @dev Region ID defines the region on the map in IZ
		uint16 regionId;
		/// @dev x-coordinate within the region plot
		uint16 x;
		/// @dev y-coordinate within the region plot
		uint16 y;
		/// @dev Tier ID defines land rarity and number of sites within the plot
		uint8 tierId;
		/// @dev Plot width, limits the x-coordinate for the sites
		uint16 width;
		/// @dev Plot height, limits the y-coordinate for the sites
		uint16 height;
	}

	/**
	 * @notice Input data root, Merkle tree root for the collection of plot data elements,
	 *      available on sale
	 *
	 * @notice Merkle root effectively "compresses" the (potentially) huge collection of elements
	 *      and allows to store it in a single 256-bits storage slot on-chain
	 */
	bytes32 public root;

	/**
	 * @notice Deployed LandERC721 token address to mint tokens of
	 *      (when they are bought via the sale)
	 */
	address public immutable targetContract;

	/**
	 * @dev Sale start unix timestamp, this is the time when sale activates,
	 *      the time when the first sequence sale starts, that is
	 *      when tokens of the first sequence become available on sale
	 * @dev The sale is active after the start (inclusive)
	 */
	uint32 saleStart;

	/**
	 * @dev Sale end unix timestamp, this is the time when sale deactivates,
	 *      and tokens of the last sequence become unavailable
	 * @dev The sale is active before the end (exclusive)
	 */
	uint32 saleEnd;

	/**
	 * @dev Price halving time, the time required for a token price to reduce to the
	 *      half of its initial value
	 * @dev Defined in seconds
	 */
	uint32 halvingTime;

	/**
	 * @dev Sequence sale start offset, first sequence starts selling at `saleStart`,
	 *      second sequence starts at `saleStart + seqOffset`, third at
	 *      `saleStart + 2 * seqOffset` and so on
	 * @dev Defined in seconds
	 */
	uint32 seqOffset;

	/**
	 * @dev Time limit of how long a token / sequence can be available for sale,
	 *      first sequence stops selling at `saleStart + seqDuration`, second sequence
	 *      stops selling at `saleStart + seqOffset + seqDuration`, and so on
	 * @dev Defined in seconds
	 */
	uint32 seqDuration;

	/**
	 * @dev Starting token price for each Tier ID, zero based
	 */
	uint96[] startPrices;

	/**
	 * @notice Enables the sale, buying tokens public function
	 *
	 * @dev Feature FEATURE_SALE_ACTIVE must be enabled in order for
	 *      `buy()` function to be able to succeed
	 */
	uint32 public constant FEATURE_SALE_ACTIVE = 0x0000_0001;

	/**
	 * @notice Data manager is responsible for supplying the valid input plot data collection
	 *      Merkle root which then can be used to mint tokens, meaning effectively,
	 *      that data manager may act as a minter on the target NFT contract
	 *
	 * @dev Role ROLE_DATA_MANAGER allows setting the Merkle tree root via setInputDataRoot()
	 */
	uint32 public constant ROLE_DATA_MANAGER = 0x0001_0000;

	/**
	 * @dev Fired in setInputDataRoot()
	 *
	 * @param _by an address which executed the operation
	 * @param _root new Merkle root value
	 */
	event RootChanged(address indexed _by, bytes32 _root);

	/**
	 * @dev Fired in buy()
	 *
	 * @param _by an address which had bought the plot
	 * @param _plotData plot data supplied
	 * @param _plot an actual plot (with an internal structure) bought
	 */
	event PlotBought(address indexed _by, PlotData _plotData, Land.Plot _plot);

	// TODO: add a funds withdrawal mechanism (or just send to the wallet)

	// TODO: soldoc after init params are defined properly
	constructor(address _target) {
		// verify the input is set
		require(_target != address(0), "target contract is not set");

		// verify the input is valid smart contract of the expected interfaces
		require(
			ERC165(_target).supportsInterface(type(IERC721).interfaceId)
			&& ERC165(_target).supportsInterface(type(MintableERC721).interfaceId)
			&& ERC165(_target).supportsInterface(type(LandERC721Metadata).interfaceId),
			"unexpected target type"
		);

		// assign the address
		targetContract = _target;
	}

	/**
	 * @notice Restricted access function to update input data root (Merkle tree root),
	 *       and to define, effectively, the tokens to be created by this smart contract
	 *
	 * @dev Requires executor to have `ROLE_DATA_MANAGER` permission
	 *
	 * @param _root Merkle tree root for the input plot data collection
	 */
	function setInputDataRoot(bytes32 _root) public {
		// verify the access permission
		require(isSenderInRole(ROLE_DATA_MANAGER), "access denied");

		// update input data Merkle tree root
		root = _root;

		// emit an event
		emit RootChanged(msg.sender, _root);
	}

	// TODO: add soldoc
	function initialize(uint32 _t0, uint32 _t1, uint32 _t2, uint32 _t3, uint32 _t4, uint96[] memory _p0) public {
		// TODO: verify the access permission
		// TODO: input validation

		// set/update sale parameters
		// TODO: allow partial update
		saleStart = _t0;
		saleEnd = _t1;
		halvingTime = _t2;
		seqDuration = _t3;
		seqOffset = _t4;
		startPrices = _p0;

		// emit an event
	}

	/**
	 * @notice Determines the dutch auction price value for a token in a given
	 *      sequence `sequenceId`, given tier `tierId`, now (block.timestamp)
	 *
	 * @dev Throws if `now` is outside the [saleStart, saleEnd) bounds,
	 *      or if it is outside the sequence bounds (sequence lasts for `seqDuration`),
	 *      or if the tier specified is invalid (no starting price is defined for it)
	 *
	 * @param sequenceId ID of the sequence token is sold in
	 * @param tierId ID of the tier token belongs to (defines token rarity)
	 */
	function tokenPriceNow(uint32 sequenceId, uint8 tierId) public view returns(uint96) {
		// delegate to `tokenPriceAt` using current time as `t`
		return tokenPriceAt(sequenceId, tierId, now32());
	}

	/**
	 * @notice Determines the dutch auction price value for a token in a given
	 *      sequence `sequenceId`, given tier `tierId`, at a given time `t`
	 *
	 * @dev Throws if `t` is outside the [saleStart, saleEnd) bounds,
	 *      or if it is outside the sequence bounds (sequence lasts for `seqDuration`),
	 *      or if the tier specified is invalid (no starting price is defined for it)
	 *
	 * @param sequenceId ID of the sequence token is sold in
	 * @param tierId ID of the tier token belongs to (defines token rarity)
	 * @param t the time of interest, time to evaluate the price at
	 */
	function tokenPriceAt(uint32 sequenceId, uint8 tierId, uint32 t) public view returns(uint96) {
		// calculate sequence sale start
		uint32 seqStart = saleStart + sequenceId * seqOffset;
		// calculate sequence sale end
		uint32 seqEnd = seqStart + seqDuration;

		// verify `t` is in a reasonable bounds [saleStart, saleEnd)
		require(saleStart <= t && t < saleEnd, "invalid time");

		// ensure `t` is in `[seqStart, seqEnd)` bounds; no price exists outside the bounds
		require(seqStart <= t && t < seqEnd, "invalid sequence");

		// verify the initial price is set (initialized) for the tier specified
		require(startPrices.length > tierId, "invalid tier");

		// calculate the price based on the derived params - delegate to `price`
		return price(startPrices[tierId], halvingTime, t - seqStart);
	}

	/**
	 * @dev Calculates dutch auction price after the time of interest has passed since
	 *      the auction has started
	 *
	 * @dev The price is assumed to drop exponentially, according to formula:
	 *      p(t) = p0 * 2^(-t/t0)
	 *      The price halves every t0 seconds passed from the start of the auction
	 *
	 * @param _p0 initial price
	 * @param _t0 price halving time
	 * @param _t elapsed time
	 * @return price after `t` seconds passed, `p = p0 * 2^(-t/t0)`
	 */
	function price(uint96 _p0, uint32 _t0, uint32 _t) public pure returns(uint96) {
		// convert all numbers into uint256 to get rid of possible arithmetic overflows
		uint256 p0 = uint256(_p0);
		uint256 t0 = uint256(_t0);
		uint256 t = uint256(_t);

		// apply the formula and return
		// TODO: increase the precision to update at least once per minute
		return uint96(p0 >> (t / t0));
	}

	/**
	 * @notice Verifies the validity of a plot supplied (namely, if it's registered for the sale)
	 *      based on the Merkle root of the plot data collection (already defined on the contract),
	 *      and the Merkle proof supplied to validate the particular plot data
	 *
	 * @dev Merkle tree and proof can be constructed using the `web3-utils`, `merkletreejs`,
	 *      and `keccak256` npm packages:
	 *      1. Hash the plot data collection elements via `web3.utils.soliditySha3`, making sure
	 *         the packing order and types are exactly as defined in `PlotData` struct
	 *      2. Create a sorted MerkleTree (`merkletreejs`) from the hashed collection, use `keccak256`
	 *         from the `keccak256` npm package as a hashing function, do not hash leaves
	 *         (already hashed in step 1); Ex. MerkleTree options: {hashLeaves: false, sortPairs: true}
	 *      3. For any given plot data element the proof is constructed by hashing it (as in step 1),
	 *         and querying the MerkleTree for a proof, providing the hashed plot data element as a leaf
	 *
	 * @param plot plot data to verify
	 * @param proof Merkle proof for the plot data supplied
	 * @return true if plot is valid (belongs to registered collection), false otherwise
	 */
	function isPlotValid(PlotData memory plot, bytes32[] memory proof) public view returns(bool) {
		// construct Merkle tree leaf from the inputs supplied
		// TODO: security question: should we use standard abi.encode instead of non-standard abi.encodePacked?
		bytes32 leaf = keccak256(abi.encodePacked(
				plot.tokenId,
				plot.sequenceId,
				plot.regionId,
				plot.x,
				plot.y,
				plot.tierId,
				plot.width,
				plot.height
			));

		// verify the proof supplied, and return the verification result
		return proof.verify(root, leaf);
	}

	// TODO: do we need to pass all the params as bytes32 and parse them accordingly?
	// TODO: add Merkle proof to the list of the params
	// TODO: add soldoc
	function buy(PlotData memory plotData, bytes32[] memory proof) public payable {
		// verify sale is in active state
		require(isFeatureEnabled(FEATURE_SALE_ACTIVE), "sale disabled");

		// verify the plot supplied is a valid/registered plot
		require(isPlotValid(plotData, proof), "invalid plot");

		// determine current token price
		uint96 p = tokenPriceNow(plotData.sequenceId, plotData.tierId);

		// ensure amount of ETH send
		// TODO: handle the payment and change
		require(msg.value == p, "incorrect value");

		// allocate the land plot metadata in memory (it will be used several times)
		Land.Plot memory plot = Land.Plot({
			regionId: plotData.regionId,
			x: plotData.x,
			y: plotData.y,
			tierId: plotData.tierId,
			width: plotData.width,
			height: plotData.height,
			landmarkTypeId: 0, // TODO: generate internal plot data (landmark and sites)
			sites: new Land.Site[](0) // TODO: generate internal plot data (landmark and sites)
		});

		// set token metadata - delegate to `setMetadata`
		LandERC721(targetContract).setMetadata(plotData.tokenId, plot);
		// mint the token - delegate to `mint`
		MintableERC721(targetContract).mint(msg.sender, plotData.tokenId);

		// emit an event
		emit PlotBought(msg.sender, plotData, plot);
	}

	/**
	 * @dev Testing time-dependent functionality may be difficult;
	 *      we override time in the helper test smart contract (mock)
	 *
	 * @return `block.timestamp` in mainnet, custom values in testnets (if overridden)
	 */
	function now32() public view virtual returns (uint32) {
		// return current block timestamp
		return uint32(block.timestamp);
	}
}
