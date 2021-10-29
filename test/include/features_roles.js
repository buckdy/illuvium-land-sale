// copy and export all the features and roles constants from different contracts

// Auxiliary BN stuff
const BN = web3.utils.BN;
const TWO = new BN(2);

// Access manager is responsible for assigning the roles to users,
// enabling/disabling global features of the smart contract
const ROLE_ACCESS_MANAGER = TWO.pow(new BN(255));

// Bitmask representing all the possible permissions (super admin role)
const FULL_PRIVILEGES_MASK = TWO.pow(new BN(256)).subn(1);

// All 16 features enabled
const FEATURE_ALL = 0x0000_FFFF;

// negates the role (permission set) provided
function not(...roles) {
	let roles_sum = new BN(0);
	for(let role of roles) {
		roles_sum = roles_sum.or(new BN(role));
	}
	return FULL_PRIVILEGES_MASK.xor(roles_sum);
}

// Start: ===== ERC20/ERC721 =====

// [ERC20/ERC721] Enables transfers of the tokens (transfer by the token owner himself)
const FEATURE_TRANSFERS = 0x0000_0001;

// [ERC20/ERC721] Enables transfers on behalf (transfer by someone else on behalf of token owner)
const FEATURE_TRANSFERS_ON_BEHALF = 0x0000_0002;

// [ERC20/ERC721] Enables token owners to burn their own tokens
const FEATURE_OWN_BURNS = 0x0000_0008;

// [ERC20/ERC721] Enables approved operators to burn tokens on behalf of their owners
const FEATURE_BURNS_ON_BEHALF = 0x0000_0010;

// [ERC20/ERC721] Token creator is responsible for creating (minting) tokens to an arbitrary address
const ROLE_TOKEN_CREATOR = 0x0001_0000;

// [ERC20/ERC721] Token destroyer is responsible for destroying (burning) tokens owned by an arbitrary address
const ROLE_TOKEN_DESTROYER = 0x0002_0000;

// [Land ERC721] Metadata provider is responsible for writing tokens' metadata
const ROLE_METADATA_PROVIDER = 0x0004_0000;

// [ERC721] URI manager is responsible for managing base URI part of the token URI ERC721Metadata interface
const ROLE_URI_MANAGER = 0x0010_0000;

// End: ===== ERC20/ERC721 =====

// Start: ===== Land Sale =====

// Enables the sale, buying tokens public function
const FEATURE_SALE_ACTIVE = 0x0000_0001;

// Data manager is responsible for supplying the valid input plot data collection
const ROLE_DATA_MANAGER = 0x0001_0000;

// End: ===== Land Sale =====

// export all the copied constants
module.exports = {
	ROLE_ACCESS_MANAGER,
	FULL_PRIVILEGES_MASK,
	FEATURE_ALL,
	not,
	FEATURE_TRANSFERS,
	FEATURE_TRANSFERS_ON_BEHALF,
	FEATURE_OWN_BURNS,
	FEATURE_BURNS_ON_BEHALF,
	ROLE_TOKEN_CREATOR,
	ROLE_TOKEN_DESTROYER,
	ROLE_METADATA_PROVIDER,
	ROLE_URI_MANAGER,
};
