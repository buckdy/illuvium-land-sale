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
 *
 * @dev Merkle proof verification is based on OpenZeppelin implementation, see
 *      https://docs.openzeppelin.com/contracts/4.x/api/utils#MerkleProof
 *
 // TODO: document dutch auction params and sequences
 *
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
	uint32 public saleStart;

	/**
	 * @dev Sale end unix timestamp, this is the time when sale deactivates,
	 *      and tokens of the last sequence become unavailable
	 * @dev The sale is active before the end (exclusive)
	 */
	uint32 public saleEnd;

	/**
	 * @dev Price halving time, the time required for a token price to reduce to the
	 *      half of its initial value
	 * @dev Defined in seconds
	 */
	uint32 public halvingTime;

	/**
	 * @dev Sequence duration, time limit of how long a token / sequence can be available
	 *      for sale, first sequence stops selling at `saleStart + seqDuration`, second
	 *      sequence stops selling at `saleStart + seqOffset + seqDuration`, and so on
	 * @dev Defined in seconds
	 */
	uint32 public seqDuration;

	/**
	 * @dev Sequence start offset, first sequence starts selling at `saleStart`,
	 *      second sequence starts at `saleStart + seqOffset`, third at
	 *      `saleStart + 2 * seqOffset` and so on at `saleStart + n * seqOffset`,
	 *      where `n` is zero-based sequence ID
	 * @dev Defined in seconds
	 */
	uint32 public seqOffset;

	/**
	 * @dev Tier start prices, starting token price for each (zero based) Tier ID
	 */
	uint96[] public startPrices;

	/**
	 * @dev Sale beneficiary address, if set - used to send funds obtained from the sale;
	 *      If not set - contract accumulates the funds on its own deployed address
	 */
	address payable public beneficiary;

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
	 * @notice Sale manager is responsible for sale initialization:
	 *      setting up sale start/end, halving time, sequence params, and starting prices
	 *
	 * @dev  Role ROLE_SALE_MANAGER allows sale initialization via initialize()
	 */
	uint32 public constant ROLE_SALE_MANAGER = 0x0002_0000;

	/**
	 * @notice Withdrawal manager is responsible for withdrawing funds obtained in sale
	 *      from the sale smart contract via pull/push mechanisms:
	 *      1) Pull: no pre-setup is required, withdrawal manager executes the
	 *         withdraw function periodically to withdraw funds
	 *      2) Push: withdrawal manager sets the `beneficiary` address which is used
	 *         by the smart contract to send funds to when users purchase land NFTs
	 *
	 * @dev Role ROLE_WITHDRAWAL_MANAGER allows to set the `beneficiary` address via
	 *      - setBeneficiary()
	 * @dev Role ROLE_WITHDRAWAL_MANAGER allows pull withdrawals of funds:
	 *      - withdraw()
	 *      - withdrawTo()
	 */
	uint32 public constant ROLE_WITHDRAWAL_MANAGER = 0x0002_0000;

	/**
	 * @dev Fired in setInputDataRoot()
	 *
	 * @param _by an address which executed the operation
	 * @param _root new Merkle root value
	 */
	event RootChanged(address indexed _by, bytes32 _root);

	/**
	 * @dev Fired in initialize()
	 *
	 * @param _by an address which executed the operation
	 * @param _saleStart sale start time, and first sequence start time
	 * @param _saleEnd sale end time, should match with the last sequence end time
	 * @param _halvingTime price halving time, the time required for a token price
	 *      to reduce to the half of its initial value
	 * @param _seqDuration sequence duration, time limit of how long a token / sequence
	 *      can be available for sale
	 * @param _seqOffset sequence start offset, each sequence starts `_seqOffset`
	 *      later after the previous one
	 * @param _startPrices tier start prices, starting token price for each (zero based) Tier ID
	 */
	event Initialized(
		address indexed _by,
		uint32 _saleStart,
		uint32 _saleEnd,
		uint32 _halvingTime,
		uint32 _seqDuration,
		uint32 _seqOffset,
		uint96[] _startPrices
	);

	/**
	 * @dev Fired in setBeneficiary
	 *
	 * @param _by an address which executed the operation
	 * @param _beneficiary new beneficiary address or zero-address
	 */
	event BeneficiaryUpdated(address indexed _by, address indexed _beneficiary);

	/**
	 * @dev Fired in withdraw() and withdrawTo()
	 *
	 * @param _by an address which executed the operation
	 * @param _to an address which received the funds withdrawn
	 * @param _value amount withdrawn
	 */
	event Withdrawn(address indexed _by, address indexed _to, uint256 _value);

	/**
	 * @dev Fired in buy()
	 *
	 * @param _by an address which had bought the plot
	 * @param _plotData plot data supplied
	 * @param _plot an actual plot (with an internal structure) bought
	 */
	event PlotBought(address indexed _by, PlotData _plotData, Land.Plot _plot);

	/**
	 * @dev Creates/deploys sale smart contract instance and binds it to the target
	 *      NFT smart contract address to be used to mint tokens (Land ERC721 tokens)
	 *
	 * @param _target target NFT smart contract address
	 */
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
	 * @dev `startPrices` getter; the getters solidity creates for arrays
	 *      may be inconvenient to use if we need an entire array to be read
	 *
	 * @return `startPrices` as is - as an array of uint96
	 */
	function getStartPrices() public view returns(uint96[] memory) {
		// read `startPrices` array into memory and return
		return startPrices;
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
	 * @dev See also: https://docs.openzeppelin.com/contracts/4.x/api/utils#MerkleProof
	 *
	 * @param plotData plot data to verify
	 * @param proof Merkle proof for the plot data supplied
	 * @return true if plot is valid (belongs to registered collection), false otherwise
	 */
	function isPlotValid(PlotData memory plotData, bytes32[] memory proof) public view returns(bool) {
		// construct Merkle tree leaf from the inputs supplied
		// TODO: security question: should we use standard abi.encode instead of non-standard abi.encodePacked?
		bytes32 leaf = keccak256(abi.encodePacked(
				plotData.tokenId,
				plotData.sequenceId,
				plotData.regionId,
				plotData.x,
				plotData.y,
				plotData.tierId,
				plotData.width,
				plotData.height
			));

		// verify the proof supplied, and return the verification result
		return proof.verify(root, leaf);
	}

	/**
	 * @dev Restricted access function to set up sale parameters, all at once,
	 *      or any subset of them
	 *
	 * @dev To skip parameter initialization, set it to `-1`,
	 *      that is a maximum value for unsigned integer of the corresponding type;
	 *      for `_startPrices` use a single array element with the `-1` value to skip
	 *
	 * @dev Example: following initialization will update only `_seqDuration` and `_seqOffset`,
	 *      leaving the rest of the fields unchanged
	 *      initialize(
	 *          0xFFFFFFFF, // `_saleStart` unchanged
	 *          0xFFFFFFFF, // `_saleEnd` unchanged
	 *          0xFFFFFFFF, // `_halvingTime` unchanged
	 *          21600,      // `_seqDuration` updated to 6 hours
	 *          3600,       // `_seqOffset` updated to 1 hour
	 *          [0xFFFFFFFFFFFFFFFFFFFFFFFF] // `_startPrices` unchanged
	 *      )
	 *
	 * @dev Sale start and end times should match with the number of sequences,
	 *      sequence duration and offset, if `n` is number of sequences, then
	 *      the following equation must hold:
	 *         `saleStart + (n - 1) * seqOffset + seqDuration = saleEnd`
	 *      Note: `n` is unknown to the sale contract and there is no way for it
	 *      to accurately validate other parameters of the equation above
	 *
	 * @dev Input params are not validated; to get an idea if these params look valid,
	 *      refer to `isActive() `function, and it's logic
	 *
	 * @dev Requires transaction sender to have `ROLE_SALE_MANAGER` role
	 *
	 * @param _saleStart sale start time, and first sequence start time
	 * @param _saleEnd sale end time, should match with the last sequence end time
	 * @param _halvingTime price halving time, the time required for a token price
	 *      to reduce to the half of its initial value
	 * @param _seqDuration sequence duration, time limit of how long a token / sequence
	 *      can be available for sale
	 * @param _seqOffset sequence start offset, each sequence starts `_seqOffset`
	 *      later after the previous one
	 * @param _startPrices tier start prices, starting token price for each (zero based) Tier ID
	 */
	function initialize(
		uint32 _saleStart,           // <<<--- keep type in sync with the body type(uint32).max !!!
		uint32 _saleEnd,             // <<<--- keep type in sync with the body type(uint32).max !!!
		uint32 _halvingTime,         // <<<--- keep type in sync with the body type(uint32).max !!!
		uint32 _seqDuration,         // <<<--- keep type in sync with the body type(uint32).max !!!
		uint32 _seqOffset,           // <<<--- keep type in sync with the body type(uint32).max !!!
		uint96[] memory _startPrices // <<<--- keep type in sync with the body type(uint96).max !!!
	) public {
		// verify the access permission
		require(isSenderInRole(ROLE_SALE_MANAGER), "access denied");

		// Note: no input validation at this stage, initial params state is invalid anyway,
		//       and we're not limiting sale manager to set these params back to this state

		// set/update sale parameters (allowing partial update)
		// 0xFFFFFFFF, 32 bits
		if(_saleStart != type(uint32).max) {
			saleStart = _saleStart;
		}
		// 0xFFFFFFFF, 32 bits
		if(_saleEnd != type(uint32).max) {
			saleEnd = _saleEnd;
		}
		// 0xFFFFFFFF, 32 bits
		if(_halvingTime != type(uint32).max) {
			halvingTime = _halvingTime;
		}
		// 0xFFFFFFFF, 32 bits
		if(_seqDuration != type(uint32).max) {
			seqDuration = _seqDuration;
		}
		// 0xFFFFFFFF, 32 bits
		if(_seqOffset != type(uint32).max) {
			seqOffset = _seqOffset;
		}
		// 0xFFFFFFFFFFFFFFFFFFFFFFFF, 96 bits
		if(_startPrices.length != 1 || _startPrices[0] != type(uint96).max) {
			startPrices = _startPrices;
		}

		// emit an event
		emit Initialized(msg.sender, saleStart, saleEnd, halvingTime, seqDuration, seqOffset, startPrices);
	}

	/**
	 * @notice Verifies if sale is in the active state, meaning that it is properly
	 *      initialized with the sale start/end times, sequence params, etc., and
	 *      that the current time is within the sale start/end bounds
	 *
	 * @notice Doesn't check if the plot data Merkle root `root` is set or not;
	 *      active sale state doesn't guarantee that an item can be actually bought
	 *
	 * @dev The sale is defined as active if all of the below conditions hold:
	 *      - sale start is now or in the past
	 *      - sale end is in the future
	 *      - halving time is not zero
	 *      - sequence duration is not zero
	 *      - there is at least one starting price set (zero price is valid)
	 *
	 * @return true if sale is active, false otherwise
	 */
	function isActive() public view returns(bool) {
		// calculate sale state based on the internal sale params state and return
		return saleStart <= now32() && now32() < saleEnd && halvingTime > 0 && seqDuration > 0 && startPrices.length > 0;
	}

	/**
	 * @dev Restricted access function to update the sale beneficiary address, the address
	 *      can be set, updated, or "unset" (deleted, set to zero)
	 *
	 * @dev Setting the address to non-zero value effectively activates funds withdrawal
	 *      mechanism via the push pattern
	 *
	 * @dev Setting the address to zero value effectively deactivates funds withdrawal
	 *      mechanism via the push pattern (pull mechanism can be used instead)
	 */
	function setBeneficiary(address payable _beneficiary) public {
		// check the access permission
		require(isSenderInRole(ROLE_WITHDRAWAL_MANAGER), "access denied");

		// update the beneficiary address
		beneficiary = _beneficiary;

		// emit an event
		emit BeneficiaryUpdated(msg.sender, _beneficiary);
	}

	/**
	 * @dev Restricted access function to withdraw funds on the contract balance,
	 *      sends funds back to transaction sender
	 */
	function withdraw() public {
		// delegate to `withdrawTo`
		withdrawTo(payable(msg.sender));
	}

	/**
	 * @dev Restricted access function to withdraw funds on the contract balance,
	 *      sends funds to the address specified
	 *
	 * @param _to an address to send funds to
	 */
	function withdrawTo(address payable _to) public {
		// check the access permission
		require(isSenderInRole(ROLE_WITHDRAWAL_MANAGER), "access denied");

		// verify withdrawal address is set
		require(_to != address(0), "address not set");

		// ETH value to send
		uint256 _value = address(this).balance;

		// verify sale balance is positive (non-zero)
		require(_value > 0, "zero balance");

		// send the entire balance to the transaction sender
		_to.transfer(_value);

		// emit en event
		emit Withdrawn(msg.sender, _to, _value);
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

	// TODO: consider adding buyTo() function

	/**
	 * @notice Sells a plot of land (Land ERC721 token) from the sale to executor.
	 *      Executor must supply the metadata for the land plot and a Merkle tree proof
	 *      for the metadata supplied.
	 *
	 * @notice Metadata for all the plots is stored off-chain and is publicly available
	 *      to buy plots and to generate Merkle proofs
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
	 * @dev Requires FEATURE_SALE_ACTIVE feature to be enabled
	 *
	 * @dev Throws if current time is outside the [saleStart, saleEnd) bounds,
	 *      or if it is outside the sequence bounds (sequence lasts for `seqDuration`),
	 *      or if the tier specified is invalid (no starting price is defined for it)
	 *
	 * @dev See also: https://docs.openzeppelin.com/contracts/4.x/api/utils#MerkleProof
	 *
	 * @param plotData plot data to buy
	 * @param proof Merkle proof for the plot data supplied
	 */
	function buy(PlotData memory plotData, bytes32[] memory proof) public payable {
		// verify sale is in active state
		require(isFeatureEnabled(FEATURE_SALE_ACTIVE), "sale disabled");

		// check if sale is active (and initialized)
		require(isActive(), "inactive sale");

		// make sure plot data Merkle root was set (sale has something on sale)
		require(root != 0x00, "empty sale");

		// verify the plot supplied is a valid/registered plot
		require(isPlotValid(plotData, proof), "invalid plot");

		// determine current token price
		uint96 p = tokenPriceNow(plotData.sequenceId, plotData.tierId);

		// ensure amount of ETH send
		require(msg.value >= p, "incorrect value");

		// if beneficiary address is set
		if(beneficiary != address(0)) {
			// process the payment immediately:
			// transfer the funds to the beneficiary
			beneficiary.transfer(p);
		}
		// if beneficiary address is not set, funds remain on
		// the sale contract address for the future pull withdrawal

		// if there is any change sent in the transaction
		// (most of the cases there will be a change since this is a dutch auction)
		if(msg.value > p) {
			// transfer the change back to the transaction executor (buyer)
			payable(msg.sender).transfer(msg.value - p);
		}

		// generate plot internals: landmark and sites
		uint8 landmarkTypeId;
		Land.Site[] memory sites;
		(landmarkTypeId, sites) = genSites(plotData.tierId);

		// allocate the land plot metadata in memory (it will be used several times)
		Land.Plot memory plot = Land.Plot({
			regionId: plotData.regionId,
			x: plotData.x,
			y: plotData.y,
			tierId: plotData.tierId,
			width: plotData.width,
			height: plotData.height,
			landmarkTypeId: landmarkTypeId,
			sites: sites
		});

		// set token metadata - delegate to `setMetadata`
		LandERC721(targetContract).setMetadata(plotData.tokenId, plot);
		// mint the token - delegate to `mint`
		MintableERC721(targetContract).mint(msg.sender, plotData.tokenId);

		// emit an event
		emit PlotBought(msg.sender, plotData, plot);
	}

	/**
	 * @dev Given a tier ID, generates internal land structure (landmark and sites)
	 *
	 * // TODO: document the details
	 *
	 * @param tierId tier ID of the land plot to generate internal structure for
	 * @return landmarkTypeId randomized landmark type ID
	 * @return sites randomized array of land sites
	 */
	function genSites(uint8 tierId) public view returns(uint8 landmarkTypeId, Land.Site[] memory sites) {
		if(tierId == 0) {
			landmarkTypeId = 0;
			sites = new Land.Site[](0);
		}
		else if(tierId == 1) {
			landmarkTypeId = 0;
			sites = new Land.Site[](4);
			// TODO: generate 3 Element sites
			// TODO: generate 1 Fuel site
		}
		else if(tierId == 2) {
			landmarkTypeId = 0;
			sites = new Land.Site[](9);
			// TODO: generate 6 Element sites
			// TODO: generate 3 Fuel sites
		}
		else if(tierId == 3) {
			landmarkTypeId = 0; // TODO: generate 1-3
			sites = new Land.Site[](15);
			// TODO: generate 9 Element sites
			// TODO: generate 6 Fuel sites
		}
		else if(tierId == 4) {
			landmarkTypeId = 0; // TODO: generate 4-6
			sites = new Land.Site[](21);
			// TODO: generate 12 Element sites
			// TODO: generate 9 Fuel sites
		}
		else if(tierId == 5) {
			landmarkTypeId = 7;
			sites = new Land.Site[](27);
			// TODO: generate 15 Element sites
			// TODO: generate 12 Fuel sites
		}
		else {
			revert("invalid tier");
		}

		// TODO: remove dummy generator
		for(uint8 i = 0; i < sites.length; i++) {
			sites[i] = Land.Site({
				typeId: 1,
				x: i,
				y: 0
			});
		}
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
