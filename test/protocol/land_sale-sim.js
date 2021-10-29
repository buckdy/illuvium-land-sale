// LandSale: 10,000 Land plots Sale Simulation
// Following simulation executes 10,000 sale scenario:
// buyers buy a single land plot,
// [TODO] buy multiple land plots in batches,
// try to buy more than allowed, etc

const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// Zeppelin test helpers
const {
	BN,
	balance,
	constants,
	expectEvent,
	expectRevert,
} = require("@openzeppelin/test-helpers");

// Chai test helpers
const {
	assert,
	expect,
} = require("chai");

// web3 utils
const toWei = web3.utils.toWei;

// block utils
const {
	extract_gas,
	extract_gas_cost,
} = require("../include/block_utils");

// number utils
const {
	random_int,
	random_element,
	print_n,
} = require("../include/number_utils");

// BN utils
const {
	sum_bn,
	print_amt,
	draw_amounts,
	print_symbols,
} = require("../include/bn_utils");

// land data utils
const {
	generate_land,
	plot_to_leaf,
} = require("./include/land_data_utils");

// deployment routines in use
const {
	land_sale_deploy,
	land_sale_init,
} = require("./include/deployment_routines");

// run 10k sale simulation
contract("LandSale: 10,000 Sale Simulation", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;
	// participants – rest of the accounts (including a1, a2)
	const participants = accounts.slice(3);

	// define constants to generate plots
	const ITEMS_ON_SALE = 10_000;

	// generate the land sale data
	log.debug("generating %o land plots", ITEMS_ON_SALE);
	const {plots, leaves, tree, root} = generate_land(ITEMS_ON_SALE);
	log.info("generated %o land plots", ITEMS_ON_SALE);

	// deploy and initialize the sale,
	// register the Merkle root within the sale
	let land_sale, land_nft;
	let sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices;
	let num_of_sequences;
	beforeEach(async function() {
		({land_sale, land_nft} = await land_sale_deploy(a0));
		({sale_start, sale_end, halving_time, seq_duration, seq_offset, start_prices} =
			await land_sale_init(a0, land_sale));
		await land_sale.setInputDataRoot(root, {from: a0});
		num_of_sequences = Math.floor((sale_end - sale_start + seq_offset - seq_duration) / seq_offset);
	});

	// simulation executor
	async function sale_sim_test(limit = ITEMS_ON_SALE) {
		// verify limit is in valid bounds
		assert(limit <= ITEMS_ON_SALE, "sale limit exceeds ITEMS_ON_SALE");
		assert(
			plots.reduce((accumulator, currentVal) => Math.max(accumulator, currentVal.sequenceId), 0) < num_of_sequences,
			"generated land has more sequences than sale is capable of selling"
		);

		// for this simulation we will be working with all the available accounts
		// which are going to buy the land at random [in random quantities]
		const len = participants.length;

		// introduce aux vars to track progress for each account
		const tokens_bought = new Array(len).fill(0);
		const value_spent = new Array(len).fill(0).map(_ => new BN(0)); // BN is mutable!
		const gas_costs = new Array(len).fill(0).map(_ => new BN(0));
		const balances0 = new Array(len);
		for(let i = 0;  i < len; i++) {
			balances0[i] = await balance.current(participants[i])
		}

		// verify initial token balances are zero
		for(let i = 0; i < len; i++) {
			expect(
				await land_nft.balanceOf(participants[i]),
				`non-zero initial token balance for account ${i}`
			).to.be.bignumber.that.equals("0");
		}
		expect(
			await land_nft.totalSupply(),
			"non-zero initial total token supply"
		).to.be.bignumber.that.equals("0")

		// execute `limit` steps (up to `ITEMS_ON_SALE`)
		for(let i = 0; i < limit; i++) {
			// pick random buyer for the tx
			const {e: buyer, i: idx} = random_element(participants, false);

			// get the plot and its Merkle proof for the current step `i`
			const plot = plots[i];
			const proof = tree.getHexProof(leaves[i]);

			// calculate the timestamp for the current step `i`
			const t = sale_start + Math.floor((sale_end - sale_start) * i / ITEMS_ON_SALE);
			// timestamp offset within a sequence
			const t_seq = t - sale_start - seq_offset * plot.sequenceId;

			// estimate the price
			const p0 = start_prices[plot.tierId];
			// TODO: formula should be enhanced once it is implemented in the smart contract
			const p = p0.shrn(Math.floor(t_seq / halving_time));

			log.debug("sim_step %o %o", i, {
				to_id: idx,
				token_id: plot.tokenId,
				seq_id: plot.sequenceId,
				tier_id: plot.tierId,
				initial_price: p0.toString(10),
				t_cur: t,
				t_seq,
				current_price: p.toString(10)
			});

			// verify time bounds for the sequence
			assert(t_seq < seq_duration, "time is out of sequence bounds");

			// set the time to `t` and buy
			await land_sale.setNow32(t, {from: a0});
			// TODO: consider sending dust ETH
			const receipt = await land_sale.buy(Object.values(plot), proof, {from: buyer, value: p});

			// update the buyer's and global stats
			tokens_bought[idx]++;
			value_spent[idx].iadd(p); // inline addition!
			gas_costs[idx].iaddn(extract_gas(receipt));

			// log the progress via debug/info log level
			const level = (i + 1) % 20 === 0 || i === limit - 1? "info": "debug";
			log[level](
				"%o\ttokens bought: [%o]; %o\tETH spent: [%o]",
				i + 1,
				print_symbols(tokens_bought, Math.ceil(limit / len)),
				print_amt(sum_bn(value_spent)),
				print_symbols(value_spent),
			);
		}

		// verify final balances are as expected
		for(let i = 0; i < len; i++) {
			// token balances
			expect(
				await land_nft.balanceOf(participants[i]),
				`unexpected final token balance for account ${i}`
			).to.be.bignumber.that.equals(tokens_bought[i] + "");
			// ETH balances
			expect(
				await balance.current(participants[i]),
				`unexpected final ETH balance for account ${i}`
			).to.be.bignumber.that.equals(balances0[i].sub(value_spent[i]).sub(gas_costs[i]));
		}
		// token supply
		expect(
			await land_nft.totalSupply(),
			"unexpected final total token supply"
		).to.be.bignumber.that.equals(limit + "")
		// ETH contract balance
		expect(
			await web3.eth.getBalance(land_sale.address),
			"unexpected sale ETH balance"
		).to.be.bignumber.that.equals(sum_bn(value_spent));

		log.info("Execution complete.")
	}

	// low complexity test executes in coverage
	it("10,000 plots sale simulation (low complexity)", async function() {
		await sale_sim_test(1000);
	});
	// tests marked with @skip-on-coverage will are removed from solidity-coverage,
	// see yield-solcover.js, see https://github.com/sc-forks/solidity-coverage/blob/master/docs/advanced.md
	it("10,000 plots sale simulation [ @skip-on-coverage ]", async function() {
		await sale_sim_test();
	});

});
