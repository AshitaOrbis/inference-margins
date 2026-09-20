/* batch-cap — a JSON-RPC array must not multiply the body cap into unbounded work.
 *
 * Polaris ruling 2026-09-19 on Astra pack C P1-1. The 64 KB body cap bounds BYTES, not WORK, and
 * a batch multiplies one by the other: 128 `adjust_rental_rate` calls fit in 18,579 bytes and
 * returned 128 results, ~10.7 s of local CPU and ~6 MB of response, against a configured Worker
 * CPU limit of 5,000 ms; 449 fit inside the cap with consecutive ids. Every tool is read-only
 * and idempotent, so a legitimate client never needs a long batch.
 *
 * Red on the pre-cap worker: the 9- and 128-request batches are accepted.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SRC = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");

/* The cap is enforced in the Worker entry point, which needs the Workers runtime to execute.
   These assertions pin the STRUCTURE — that the check exists, reads the already-capped bytes,
   runs before any server is built, and answers 4xx — and the numeric behaviour is checked by
   running the extracted predicate, which is pure. */

test("the suite is exercising the PRODUCTION predicate, not a local copy", () => {
  /* If this import ever stops resolving to the shipped function, every behavioural assertion
     below becomes a test of a copy — which is the defect this file was rewritten to fix. */
  assert.equal(typeof overLong, "function");
  assert.ok(SRC.includes('import { readBodyCapped, overLongBatch } from "./body-cap.js";'),
    "index.ts must call the same predicate this suite imports");
  assert.ok(/const batchLength = overLongBatch\(capped\.bytes, BATCH_CAP\);/.test(SRC),
    "index.ts must call it on the already-capped bytes");
});

test("the batch cap is declared and is small", () => {
  const m = SRC.match(/const BATCH_CAP = (\d+);/);
  assert.ok(m, "BATCH_CAP is not declared");
  const cap = Number(m[1]);
  assert.ok(cap >= 2 && cap <= 16, `BATCH_CAP ${cap} is outside the range a real client needs`);
});

test("the refusal RETURNS — an over-long batch never reaches the handler", () => {
  /* Astra round 3's second mutation: dropping the `return` from `deny(400, …)` left the old
     suite green, because nothing asserted the early exit. The refusal must be the value of the
     branch, and nothing may run between it and the check. */
  const block = SRC.slice(SRC.indexOf("const batchLength ="), SRC.indexOf("req = new Request"));
  assert.match(block, /if \(batchLength\) \{\s*return deny\(400,/,
    "the over-long branch must RETURN its refusal");
  assert.ok(!/buildServer|createMcpHandler/.test(block),
    "nothing may build a server between the batch check and the refusal");
});

test("the check runs BEFORE a server or transport is built", () => {
  /* Anchored on the CALL SITE, not the first textual occurrence: `buildServer` appears in the
     file header and in an import long before it is invoked, so matching the bare name compared
     the wrong positions and this assertion failed while the code was correct. */
  const checkAt = SRC.indexOf("const batchLength =");
  const buildAt = SRC.indexOf("const server = buildServer();");
  assert.ok(checkAt > 0 && buildAt > 0 && checkAt < buildAt,
    `an over-long batch must be refused before any tool work is possible (check ${checkAt}, build ${buildAt})`);
});

test("an over-long batch is a 4xx, not a 5xx and not a silent truncation", () => {
  const block = SRC.slice(SRC.indexOf("const batchLength ="), SRC.indexOf("req = new Request"));
  assert.match(block, /deny\(4\d\d,/, "the refusal must carry a 4xx status");
  assert.match(block, /exceeds the \$\{BATCH_CAP\}-request cap/);
});

test("a body that does not parse is left to the MCP handler, not refused here", () => {
  /* Asserted on the PRODUCTION predicate's behaviour, not on the shape of its source. */
  assert.equal(overLong(new TextEncoder().encode("{not json"), 1), 0);
  assert.equal(overLong(new TextEncoder().encode('"a string"'), 1), 0);
  assert.equal(overLong(new TextEncoder().encode('{"jsonrpc":"2.0"}'), 1), 0);
});

/* THE PRODUCTION PREDICATE, IMPORTED — not a copy of it. The first cut of this file
   re-implemented `overLong` locally, and Astra round 3 showed what that was worth: replacing
   the production predicate with `return 0` left all eight test bodies green. It now lives in
   src/body-cap.ts for the same reason readBodyCapped does — no Workers-runtime import, so the
   real function runs under plain Node. */
import { overLongBatch as overLong } from "../src/body-cap.ts";
const enc = (v) => new TextEncoder().encode(JSON.stringify(v));
const call = (id) => ({ jsonrpc: "2.0", id, method: "tools/call",
  params: { name: "adjust_rental_rate", arguments: { company: "anthropic", rent_usd_per_hr: 2.4 } } });
const CAP = Number(SRC.match(/const BATCH_CAP = (\d+);/)[1]);

test("the amplifying batch from the finding is refused", () => {
  const body = enc(Array.from({ length: 128 }, (_, i) => call(i)));
  assert.equal(overLong(body, CAP), 128);
  assert.ok(body.length < 64 * 1024, `the finding's body (${body.length} B) is inside the byte cap — `
    + "which is exactly why a byte cap alone does not bound the work");
});

test("a batch one over the cap is refused, and one AT the cap is allowed", () => {
  assert.equal(overLong(enc(Array.from({ length: CAP + 1 }, (_, i) => call(i))), CAP), CAP + 1);
  assert.equal(overLong(enc(Array.from({ length: CAP }, (_, i) => call(i))), CAP), 0);
});

test("an ordinary single request is untouched", () => {
  assert.equal(overLong(enc(call(1)), CAP), 0);
});

test("a malformed body is not refused by this check", () => {
  assert.equal(overLong(new TextEncoder().encode("{not json"), CAP), 0);
  assert.equal(overLong(new TextEncoder().encode("[1,2"), CAP), 0);
});
