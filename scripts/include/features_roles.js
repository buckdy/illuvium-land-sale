// copy and export all the features and roles constants from different contracts

// Auxiliary BigNumber constants
const {BigNumber} = require("@ethersproject/bignumber");
const TWO = BigNumber.from(2);

// Access manager is responsible for assigning the roles to users,
// enabling/disabling global features of the smart contract
const ROLE_ACCESS_MANAGER = TWO.pow(255);

// Bitmask representing all the possible permissions (super admin role)
const FULL_PRIVILEGES_MASK = TWO.pow(256).sub(1);

// All 16 features enabled
const FEATURE_ALL = BigNumber.from(0x0000_FFFF);

// Start: ===== ERC20/ERC721 =====

// [ERC20/ERC721] Enables transfers of the tokens (transfer by the token owner himself)
const FEATURE_TRANSFERS = BigNumber.from(0x0000_0001);

// [ERC20/ERC721] Enables transfers on behalf (transfer by someone else on behalf of token owner)
const FEATURE_TRANSFERS_ON_BEHALF = BigNumber.from(0x0000_0002);

// [ERC20/ERC721] Enables token owners to burn their own tokens
const FEATURE_OWN_BURNS = BigNumber.from(0x0000_0008);

// [ERC20/ERC721] Enables approved operators to burn tokens on behalf of their owners
const FEATURE_BURNS_ON_BEHALF = BigNumber.from(0x0000_0010);

// [ERC20/ERC721] Token creator is responsible for creating (minting) tokens to an arbitrary address
const ROLE_TOKEN_CREATOR = BigNumber.from(0x0001_0000);

// [ERC20/ERC721] Token destroyer is responsible for destroying (burning) tokens owned by an arbitrary address
const ROLE_TOKEN_DESTROYER = BigNumber.from(0x0002_0000);

// [ERC721] URI manager is responsible for managing base URI part of the token URI ERC721Metadata interface
const ROLE_URI_MANAGER = BigNumber.from(0x0004_0000);

// [ERC20/ERC721] Rescue manager is responsible for "rescuing" ERC20 tokens
const ROLE_RESCUE_MANAGER = BigNumber.from(0x0008_0000);

// [EIP2981] Royalty manager is responsible for managing the EIP2981 royalty info
const ROLE_ROYALTY_MANAGER = BigNumber.from(0x0010_0000);

// [EIP2981] Owner manager is responsible for setting/updating an "owner" field
const ROLE_OWNER_MANAGER = BigNumber.from(0x0020_0000);

// [Land ERC721] Metadata provider is responsible for writing tokens' metadata
const ROLE_METADATA_PROVIDER = BigNumber.from(0x0040_0000);

// End: ===== ERC20/ERC721 =====

// Start: ===== Land Sale =====

// Enables the sale, buying tokens public function
const FEATURE_SALE_ACTIVE = BigNumber.from(0x0000_0001);

// Data manager is responsible for supplying the valid input plot data collection
const ROLE_DATA_MANAGER = BigNumber.from(0x0001_0000);

// Sale manager is responsible for sale initialization
const ROLE_SALE_MANAGER = BigNumber.from(0x0002_0000);

// Withdrawal manager is responsible for withdrawing funds obtained in sale
const ROLE_WITHDRAWAL_MANAGER = BigNumber.from(0x0004_0000);

// Rescue manager is responsible for "rescuing" ERC20 tokens (already defined)
// const ROLE_RESCUE_MANAGER = BigNumber.from(0x0008_0000);
// End: ===== Land Sale =====

// export all the copied constants
module.exports = {
	ROLE_ACCESS_MANAGER,
	FULL_PRIVILEGES_MASK,
	FEATURE_ALL,
	FEATURE_TRANSFERS,
	FEATURE_TRANSFERS_ON_BEHALF,
	FEATURE_OWN_BURNS,
	FEATURE_BURNS_ON_BEHALF,
	FEATURE_SALE_ACTIVE,
	ROLE_TOKEN_CREATOR,
	ROLE_TOKEN_DESTROYER,
	ROLE_URI_MANAGER,
	ROLE_RESCUE_MANAGER,
	ROLE_ROYALTY_MANAGER,
	ROLE_OWNER_MANAGER,
	ROLE_METADATA_PROVIDER,
	ROLE_DATA_MANAGER,
	ROLE_SALE_MANAGER,
	ROLE_WITHDRAWAL_MANAGER,
};
