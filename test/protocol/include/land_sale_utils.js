// Both Truffle anf Hardhat with Truffle make an instance of web3 available in the global scope
// BN constants, functions to work with BN
const BN = web3.utils.BN;

/**
 * Calculates dutch auction price after the time of interest has passed since
 * the auction has started
 *
 * The price is assumed to drop exponentially, according to formula:
 * p(t) = p0 * 2^(-t/t0)
 * The price halves every t0 seconds passed from the start of the auction
 *
 * @param p0 initial price
 * @param t0 price halving time
 * @param t elapsed time
 * @return {BN}
 */
function price_formula(p0, t0, t) {
	// make sure p0 is BN, t0 and t  are expected to be numbers
	p0 = new BN(p0);

	// precision multiplier
	const pm = 2_000000000000000;

	// apply the exponentiation and return
	return  p0.mul(new BN(pm * Math.pow(2, -t/t0))).div(new BN(pm));
}

// export public utils API
module.exports = {
	price_formula,
}
