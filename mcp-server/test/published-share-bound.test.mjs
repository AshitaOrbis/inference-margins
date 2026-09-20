/* EVERY published renderable-weight-share is a proportion, everywhere a caller can read one.
 *
 * WHY THIS EXISTS (im-release-edit-r3, 2026-09-10, bq-2194). The owner's ruling made all seven
 * declared fleet legs price, and the engine's sum of normalized weights started landing one unit in
 * the last place above 1 — a share of declared fleet weight of 1.0000000000000002, which is not a
 * proportion. The connector's own schema types the field `nonnegative.max(1)`.
 *
 * The correction was applied at the publication boundary rather than in the engine, for reasons
 * recorded in bq-2194. What matters here is HOW MANY boundaries there turned out to be:
 *
 *   the first pass fixed        2 sites (the two on the selection receipt)
 *   a fallback review found     1 more (run_scenario's feasibility block)
 *   an exhaustive audit found   1 more (the claims sidecar's envelopeFields)
 *
 * Three rounds of reading the code to enumerate call sites, and each round missed one. That is the
 * defect this file exists to make impossible: it does not enumerate call sites at all. It WALKS
 * EVERY TOOL RESPONSE and asserts the bound on every numeric field whose name says it is a share,
 * wherever it appears and however deeply it is nested. A fifth surface added tomorrow fails here
 * without anyone remembering this file exists.
 *
 * Run: node --test mcp-server/test/published-share-bound.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { connectInMemory, sc } from "./harness.mjs";

const h = await connectInMemory();
const SHARE_KEY = /weight_share$|renderableWeightShare$/;

function offendingShares(node, path, out = []) {
  if (!node || typeof node !== "object") return out;
  for (const [k, v] of Object.entries(node)) {
    const here = `${path}.${k}`;
    if (typeof v === "number" && SHARE_KEY.test(k)) {
      if (!(v >= 0 && v <= 1)) out.push(`${here} = ${v}`);
    } else if (v && typeof v === "object") offendingShares(v, here, out);
  }
  return out;
}

test("every published renderable-weight-share is within [0, 1], on every tool response", async () => {
  const bad = [];
  /* sonnet, haiku and custom are the fleets whose normalized weights overshoot; opus does not, which
     is exactly why a check written against the flagship alone would have passed throughout. */
  for (const model of ["opus", "sonnet", "haiku", "gpt", "grok", "kimi", "dsr1", "custom", "terra", "gemini"]) {
    const res = sc(await h.call("run_scenario", { model }));
    bad.push(...offendingShares(res, `run_scenario(${model})`));
  }
  for (const [tool, args] of [["list_scenario_space", {}], ["query_margin_claims", {}],
                              ["get_report", { id: "report-s1" }], ["explore_range", { range: "b8090" }]]) {
    const res = sc(await h.call(tool, args));
    bad.push(...offendingShares(res, tool));
  }
  const fs = sc(await h.call("run_fleet_sections", { model: "grok", perspective: "gptpro-r3",
    dc_rows: ["xai-colossus-c1", "xai-colossus-ii"], fill: "generic-us" }));
  bad.push(...offendingShares(fs, "run_fleet_sections"));

  assert.deepEqual(bad, [],
    "a share of declared fleet weight outside [0,1] is published somewhere. This walks responses "
    + "rather than enumerating call sites precisely because enumeration missed a surface three "
    + "times running — see bq-2194:\n  " + bad.join("\n  "));
});

test("the walk is not vacuous — it finds the shares it is meant to be checking", async () => {
  const res = sc(await h.call("run_scenario", { model: "sonnet" }));
  let seen = 0;
  (function count(node) {
    if (!node || typeof node !== "object") return;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === "number" && SHARE_KEY.test(k)) seen += 1;
      else if (v && typeof v === "object") count(v);
    }
  })(res);
  /* sonnet is the fleet that overshot. If the walk stops finding its shares, the assertion above
     goes quietly green while publishing whatever it likes. */
  assert.ok(seen >= 3, `the walk found only ${seen} share fields on a sonnet response; it should see `
    + "the selection receipt's two and the feasibility block's one at minimum");
});

test("the bound is real: a value one ulp above 1 would be caught", () => {
  const bad = offendingShares({ a: { renderable_weight_share: 1.0000000000000002 } }, "probe");
  assert.equal(bad.length, 1, "the checker cannot see the exact value this file was written for");
});

test.after(async () => { await h.close(); });
