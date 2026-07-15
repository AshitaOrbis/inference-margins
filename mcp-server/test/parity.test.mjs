// Numeric parity — server outputs == engine ground truth. The server must be a pure wrapper:
// costs to 1e-9 against the identical engine pipeline, margins equal after the server's own
// whole-point rounding (bare unrounded margins deliberately do not exist in outputs), the
// exploration flagship numbers equal to engine.explorationFlagshipMargin, and share links that
// decode back under the same identity (round-trip).
import test from "node:test";
import assert from "node:assert/strict";
import { connectInMemory, engine as E, sc } from "./harness.mjs";

const h = await connectInMemory();
const EPS = 1e-9;

function engineState(mid, pid, sel = { mode: "native" }, overrides = null) {
  const m = E.MODELS.find((x) => x.id === mid);
  const p = E.PERSPECTIVES.find((x) => x.id === pid);
  const tr = E.resolveTraffic(m, p, sel);
  const s = E.applyPresetSettings(m, p, sel);
  if (overrides) {
    const { diff } = E.sanitizeScenarioDiff(overrides, tr);
    Object.assign(s, diff);
  }
  return s;
}

test("opus + median @ native Reference — costs to 1e-9, margin ≈76.8 → rounded 77", async () => {
  const res = sc(await h.call("run_scenario", { model: "opus" }));
  const wl = E.workload(engineState("opus", "median"));
  assert.ok(Math.abs(wl.margin * 100 - 76.8) < 0.1, "engine ground truth still ≈76.8: " + wl.margin * 100);
  assert.ok(Math.abs(res.costs.blended_cost_usd_per_mtok - wl.costMix) < EPS, "costMix");
  assert.ok(Math.abs(res.costs.realized_price_usd_per_mtok - wl.priceMix) < EPS, "priceMix");
  assert.ok(Math.abs(res.costs.decode_cost_usd_per_mtok - wl.cOut) < EPS, "cOut");
  assert.ok(Math.abs(res.costs.fresh_prefill_cost_usd_per_mtok - wl.cIn) < EPS, "cIn");
  assert.ok(Math.abs(res.costs.cache_read_cost_usd_per_mtok - wl.cCache) < EPS, "cCache");
  assert.equal(res.selection_receipt.this_result_pct, Math.round(wl.margin * 100));
  assert.equal(res.selection_receipt.this_result_pct, 77);
  // lens-span parity against the engine at byte-identical traffic
  const span = E.lensSpan(E.MODELS.find((x) => x.id === "opus"), { mode: "custom", ioRatio: 15, cacheHit: 60 });
  assert.equal(res.lens_span.n_lenses, span.n);
  assert.ok(res.lens_span.span.includes(`≈${Math.round(span.lo * 100)}%`), "span lo inside string");
  assert.ok(res.lens_span.span.includes(`≈${Math.round(span.hi * 100)}%`), "span hi inside string");
});

test("grok + xaiopp — ≈27 (the valuation-replay ground truth)", async () => {
  const res = sc(await h.call("run_scenario", { model: "grok", perspective: "xaiopp" }));
  const wl = E.workload(engineState("grok", "xaiopp"));
  assert.ok(Math.abs(wl.margin * 100 - 26.95) < 0.1, "engine ground truth still ≈27: " + wl.margin * 100);
  assert.equal(res.selection_receipt.this_result_pct, Math.round(wl.margin * 100));
  assert.equal(res.selection_receipt.this_result_pct, 27);
  assert.ok(Math.abs(res.costs.blended_cost_usd_per_mtok - wl.costMix) < EPS);
  assert.equal(res.traffic.locked, true);
  assert.equal(res.traffic.io_ratio, 3);
  assert.equal(res.traffic.cache_hit_pct, 0);
});

test("exploration flagship — every route's conditional number == engine.explorationFlagshipMargin", async () => {
  for (const bucketId of ["b90plus", "b8090", "b60minus"]) {
    const res = sc(await h.call("explore_range", { range: bucketId }));
    const expected = E.rankExplorations().filter((p) => (E.explorationComputedBucket(p) || {}).id === bucketId);
    assert.equal(res.routes.length, expected.length, bucketId + " route count");
    for (const p of expected) {
      const route = res.routes.find((r) => r.id === p.id);
      assert.ok(route, bucketId + " missing route " + p.id);
      const fm = E.explorationFlagshipMargin(p);
      const m = route.conditional.match(/would compute to ≈(-?\d+)% \(counterfactual\)/);
      assert.ok(m, p.id + " conditional carries the fused counterfactual number: " + route.conditional);
      assert.equal(Number(m[1]), Math.round(fm), p.id + " flagship parity");
    }
  }
  // and run_scenario on a route at the flagship scope reproduces the same number in the receipt
  const run = sc(await h.call("run_scenario", { model: "opus", perspective: "x90-v1", traffic: { mode: "profile", profile_id: "reference" } }));
  const x90 = E.PERSPECTIVES.find((p) => p.id === "x90-v1");
  assert.equal(run.selection_receipt.this_result_pct, Math.round(E.explorationFlagshipMargin(x90)));
});

test("MLI-1 forged-payload replay — grok+xaiopp+{ioRatio:300,cacheHit:95}: both rejected, ≈27% not ≈72%", async () => {
  const res = sc(await h.call("run_scenario", { model: "grok", perspective: "xaiopp", overrides: { ioRatio: 300, cacheHit: 95 } }));
  assert.equal(res.rejected_overrides.length, 2);
  assert.ok(res.rejected_overrides.every((r) => /locked by replay — overlay rejected/.test(r)));
  const clean = E.workload(engineState("grok", "xaiopp"));
  assert.ok(Math.abs(res.costs.blended_cost_usd_per_mtok - clean.costMix) < EPS, "costs identical to the clean replay");
  assert.ok(Math.abs(res.costs.realized_price_usd_per_mtok - clean.priceMix) < EPS);
  assert.equal(res.selection_receipt.this_result_pct, 27);
  const forged = structuredClone(engineState("grok", "xaiopp"));
  forged.ioRatio = 300; forged.cacheHit = 95;
  assert.ok(Math.abs(E.workload(forged).margin * 100 - 71.6) < 0.5, "the forgery would have been ≈72 — proving the lock mattered");
  assert.notEqual(res.selection_receipt.this_result_pct, 72);
});

test("share_url round-trip — clean states decode under the same identity; margins reproduce", async () => {
  const cases = [
    { args: { model: "opus" }, model: "opus", persp: "median" },
    { args: { model: "grok", perspective: "xaiopp" }, model: "grok", persp: "xaiopp" },
    { args: { model: "opus", perspective: "x90-v1", traffic: { mode: "profile", profile_id: "reference" } }, model: "opus", persp: "x90-v1" },
  ];
  for (const c of cases) {
    const res = sc(await h.call("run_scenario", c.args));
    const token = decodeURIComponent(res.share_url.split("?s=")[1]);
    const d = E.decodeScenario(token);
    assert.ok(d, c.model + "+" + c.persp + " token decodes");
    assert.equal(d._meta.model, c.model);
    assert.equal(d._meta.persp, c.persp);
    // reproduce: identity + diff → same margin as the server reported (after identical rounding)
    const m = E.MODELS.find((x) => x.id === d._meta.model);
    const p = E.PERSPECTIVES.find((x) => x.id === d._meta.persp);
    const sel = d._meta.traffic.mode === "custom" || d._meta.traffic.mode === "legacy-custom"
      ? { mode: "custom", ioRatio: d._meta.traffic.ioRatio, cacheHit: d._meta.traffic.cacheHit }
      : d._meta.traffic.mode === "explicit"
        ? { mode: "explicit", profileId: d._meta.traffic.profileId }
        : { mode: "native" };
    const meta = d._meta; delete d._meta;
    const tr = E.resolveTraffic(m, p, sel);
    const { diff } = E.sanitizeScenarioDiff(d, tr);
    const s = Object.assign(E.applyPresetSettings(m, p, sel), diff);
    assert.equal(Math.round(E.workload(s).margin * 100), res.selection_receipt.this_result_pct,
      c.model + "+" + c.persp + " round-trip margin identity (schema " + meta.schema + ")");
  }
});

test("registry parity — claims count, bucket relations and dossier coverage come from the engine", async () => {
  const res = sc(await h.call("query_margin_claims", { include_non_binnable: true }));
  const served = res.groups.reduce((a, g) => a + g.claims.length, 0) + res.non_binnable_records.length;
  assert.equal(served, E.MARGIN_CLAIMS.length, "all 34 records reachable");
  const b90 = sc(await h.call("query_margin_claims", { bucket: "b90plus" }));
  const engineIds = E.claimsForBucket("b90plus").map((x) => x.claim.id).sort();
  const servedIds = b90.groups.flatMap((g) => g.claims.map((c) => c.id)).sort();
  assert.deepEqual(servedIds, engineIds, "bucket membership computed by the engine, nothing stored");
  const list = sc(await h.call("list_scenario_space", {}));
  assert.equal(list.models.length, E.MODELS.length);
  assert.equal(list.perspectives.length, E.PERSPECTIVES.length);
});

test.after(async () => { await h.close(); });
