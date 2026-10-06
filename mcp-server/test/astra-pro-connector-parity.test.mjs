/* Astra Pro estimates — connector parity (2026-10-06, the §10 provider hubs, review r1 P1).
   The site states that the MCP connector reproduces every Astra Pro reading from the same recorded
   operating point (run_scenario with model = the record's carrier, perspective "median", the recorded
   custom traffic and overrides). The §10 hubs and the category chart print canonicalReplay() of each
   record (site/astra-pro-estimates.js). This suite makes the claim executable: for EVERY registry
   record and ALL THREE of its scenarios it calls the COMPILED connector through the in-memory
   transport and compares the margin derived from the connector's own cost and price fields,
   1 − blended_cost / realized_price, UNROUNDED, with canonicalReplay's reading. The connector never
   emits a bare unrounded margin (envelope-totality contract), which is why the margin is derived
   from its cost fields rather than read.

   Why it lives here and not in tests/astra-pro-estimates.test.mjs: `npm test` runs before this
   package is built (in the gate and in CI), and mcp-server/dist is ignored generated output that can
   be stale; this package's own `test` script builds first, then runs test/*.test.mjs, so this file
   always exercises fresh compiled code. tests/astra-pro-estimates.test.mjs fails if it disappears.

   The comparison is one function, so the NEGATIVE FIXTURE at the end feeds it a connector result for
   a record with one mutated override and requires it to report the mismatch.
   Run: npm --prefix mcp-server test   (or, after a build: node --test mcp-server/test/astra-pro-connector-parity.test.mjs) */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { connectInMemory, engine as E, sc } from "./harness.mjs";

const A = createRequire(import.meta.url)("../../site/astra-pro-estimates.js");
const h = await connectInMemory();
const EPS = 1e-9; // percentage points; the observed difference is 0
const READING = { central: "central", low_margin: "low", high_margin: "high" };

function callArgs(rec, scenarioKey) {
  const s = rec.scenarios[scenarioKey];
  return { model: rec.carrier, perspective: "median",
    traffic: { mode: "custom", io_ratio: s.traffic.io_ratio, cache_hit: s.traffic.cache_hit }, overrides: s.overrides };
}
/* Problems with one connector response against the canonical reading it must reproduce. */
function connectorProblems(res, rec, scenarioKey, canonical) {
  const out = [];
  const s = rec.scenarios[scenarioKey];
  const cost = res.costs && res.costs.blended_cost_usd_per_mtok, price = res.costs && res.costs.realized_price_usd_per_mtok;
  if (!(Number.isFinite(cost) && Number.isFinite(price) && price > 0)) { out.push("no finite cost/price fields"); return out; }
  const derived = (1 - cost / price) * 100, want = canonical[READING[scenarioKey]];
  if (!(Math.abs(derived - want) <= EPS)) out.push(`margin ${derived} != canonicalReplay ${want}`);
  if (!Array.isArray(res.rejected_overrides) || res.rejected_overrides.length) out.push("rejected overrides " + JSON.stringify(res.rejected_overrides));
  if (!res.model_provenance || res.model_provenance.id !== rec.carrier) out.push("model " + (res.model_provenance && res.model_provenance.id));
  if (!res.perspective_provenance || res.perspective_provenance.id !== "median") out.push("perspective " + (res.perspective_provenance && res.perspective_provenance.id));
  if (!res.traffic || res.traffic.mode !== "custom" || res.traffic.io_ratio !== s.traffic.io_ratio || res.traffic.cache_hit_pct !== s.traffic.cache_hit)
    out.push("traffic " + JSON.stringify(res.traffic && { mode: res.traffic.mode, io: res.traffic.io_ratio, cache: res.traffic.cache_hit_pct }));
  return out;
}

const recs = A.ASTRA_PRO_REGISTRY.estimates;

test("the registry is non-empty and every record carries all three scenarios (the parity below is not vacuous)", () => {
  assert.ok(recs.length > 0);
  for (const rec of recs) for (const k of A.ASTRA_PRO_SCENARIOS) assert.ok(rec.scenarios[k], `${rec.key} lacks ${k}`);
});

for (const rec of recs) {
  test(`run_scenario reproduces canonicalReplay for ${rec.key} — central, low and high, unrounded (1e-9 points)`, async () => {
    const canonical = A.canonicalReplay(rec, E);
    for (const k of A.ASTRA_PRO_SCENARIOS) {
      const res = sc(await h.call("run_scenario", callArgs(rec, k)));
      assert.deepEqual(connectorProblems(res, rec, k, canonical), [], `${rec.key}/${k}`);
    }
  });
}

test("negative fixture: a connector answer for a record with one mutated override is reported as a mismatch", async () => {
  const rec = recs[0];
  const canonical = A.canonicalReplay(rec, E);
  const mutated = JSON.parse(JSON.stringify(rec));
  mutated.scenarios.central.overrides.util += 5;
  const res = sc(await h.call("run_scenario", callArgs(mutated, "central")));
  const problems = connectorProblems(res, rec, "central", canonical);
  assert.ok(problems.some(p => /^margin /.test(p)), "the margin comparison must fire: " + JSON.stringify(problems));
});

test.after(async () => { await h.close(); });
