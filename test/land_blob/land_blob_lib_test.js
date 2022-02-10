// LandBlobLib: minting blob parsing tests

// using logger instead of console to allow output control
const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

// Chai test helpers
const {
	assert,
	expect,
} = require("chai");
// enable chai-bn plugin
require('chai').use(require('chai-bn')(web3.utils.BN));

// number utils
const {
	random_int,
	random_element,
} = require("../include/number_utils");

// BN utils
const {
	random_bn256,
	random_bits,
} = require("../include/bn_utils");

// deployment routines in use
const {
	land_blob_lib_deploy,
} = require("./include/deployment_routines");

// run LandBlobLib minting blob parsing tests
contract("LandBlobLib: minting blob parsing tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// deploy the LandBlobLib
	let land_blob_lib;
	before(async function() {
		land_blob_lib = await land_blob_lib_deploy(a0);
	});

	// depth of the tests performed
	const ROUNDS = 100;

	async function atoi_sol(a) {
		return await land_blob_lib.atoi(web3.utils.asciiToHex(a));
	}

	async function parse_minting_blob_sol(imx_blob) {
		return await land_blob_lib.parseMintingBlob(web3.utils.asciiToHex(imx_blob));
	}

	async function test_atoi_no_break(rounds = ROUNDS) {
		for(let i = 0; i < rounds; i++) {
			const n = random_bn256();
			const a = n.toString(10);
			const i_sol = await atoi_sol(a);
			log.debug("input: %o", a);
			log.debug("i_js: %o", n.toString(10));
			log.debug("i_sol: %o", {i: i_sol.i.toString(10), p: i_sol.p.toNumber()});
			expect(i_sol.i, "bad result").to.be.bignumber.that.equals(n);
			expect(i_sol.p, "bad stop index").to.be.bignumber.that.equals(a.length + "");
		}
	}

	async function test_atoi_with_break(rounds = ROUNDS) {
		for(let i = 0; i < rounds; i++) {
			const bit_len = random_int(8, 200);
			const n = random_bits(bit_len);
			const a = n.toString(10) + random_element(["/", ":"], true) + random_int(1, 1_000_000_000);
			const i_sol = await atoi_sol(a);
			log.debug("input: %o", a);
			log.debug("i_js: %o", n.toString(10));
			log.debug("i_sol: %o", {i: i_sol.i.toString(10), p: i_sol.p.toNumber()});
			expect(i_sol.i, "bad result").to.be.bignumber.that.equals(n);
			expect(i_sol.p, "bad stop index").to.be.bignumber.that.equals(n.toString(10).length + "");
		}
	}

	async function test_parse_minting_blob(rounds = ROUNDS) {
		for(let i = 0; i < rounds; i++) {
			const token_id = random_int(1, 1_000_000_000);
			const metadata = random_bn256();
			const minting_blob = `{${token_id}}:{${metadata.toString(10)}}`;

			log.debug("input: %o", minting_blob);
			log.debug("blob_js: %o", {token_id, metadata: metadata.toString(16)});
			const parsed_blob = await parse_minting_blob_sol(minting_blob);
			log.debug("blob_sol: %o", {token_id: parsed_blob.tokenId.toNumber(), metadata: parsed_blob.metadata.toString(16)});
			expect(parsed_blob.tokenId, "bad tokenId").to.be.bignumber.that.equals(token_id + "");
			expect(parsed_blob.metadata, "bad metadata").to.be.bignumber.that.equals(metadata);
		}
	}

	it("atoi: no break [ @skip-on-coverage ]", async function() {
		await test_atoi_no_break();
	});
	it("atoi: no break (low complexity)", async function() {
		await test_atoi_no_break(ROUNDS / 10);
	});
	it("atoi: with break [ @skip-on-coverage ]", async function() {
		await test_atoi_with_break();
	});
	it("atoi: with break (low complexity)", async function() {
		await test_atoi_with_break(ROUNDS / 10);
	});
	it("parseMintingBlob [ @skip-on-coverage ]", async function() {
		await test_parse_minting_blob();
	});
	it("parseMintingBlob (low complexity)", async function() {
		await test_parse_minting_blob(ROUNDS / 10);
	});
});
