// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

/**
 * @title Pair Price Oracle, a.k.a. Pair Oracle
 *
 * @notice Generic interface used to consult on the Uniswap-like token pairs conversion prices;
 *      one pair oracle is used to consult on the exchange rate within a single token pair
 *
 * @author Basil Gorin
 */
interface PairOracle {
	/**
	 * @notice For a pair of tokens A/B (sell/buy), consults on the amount of token B to be
	 *      bought if the specified amount of token A to be sold
	 *
	 * @param token token A (token to sell) address
	 * @param amountIn amount of token A to sell
	 * @return amountOut amount of token B to be bought
	 */
	function consult(address token, uint256 amountIn) external view returns (uint256 amountOut);
}

/**
 * @title Oracle Registry
 *
 * @notice To make pair oracles more convenient to use, a more generic Oracle Registry
 *        interface is introduced: it stores the addresses of pair price oracles and allows
 *        searching/querying for them
 *
 * @author Basil Gorin
 */
interface OracleRegistry {
	/**
	 * @notice Searches for the Pair Price Oracle for A/B (sell/buy) token pair
	 *
	 * @param tokenA token A (token to sell) address
	 * @param tokenB token B (token to buy) address
	 * @return pairOracle pair price oracle address for A/B token pair
	 */
	function getOracle(address tokenA, address tokenB) external view returns(address pairOracle);
}