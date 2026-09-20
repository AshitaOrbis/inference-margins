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

/* im-vet-six-repairs re-mint (2026-09-20, vetting findings E1 + E2): the Trainium withdrawal and
   the TPU numerator repair move both readings; the 1e-9 tie between the MCP and the engine is what
   this test exists for and is unchanged. */
test("opus + median @ native Reference — costs to 1e-9, margin ≈68.4 → rounded 68 (vetting-repairs re-mint, 2026-09-20; the trend-0 reference is ≈58.43)", async () => {
  const res = sc(await h.call("run_scenario", { model: "opus" }));
  const wl = E.workload(engineState("opus", "median"));
  assert.ok(Math.abs(wl.margin * 100 - 68.41398315513409) < 1e-9, "engine ground truth is ≈68.4: " + wl.margin * 100);
  /* b9 M5: the move is CHARACTERIZED, not merely re-minted — the default is exactly the reference
     with cost divided by E(+3 @ 3×/yr), and that RELATIONSHIP is what is asserted rather than the
     digits. im-release-edit-r2 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
     the reference moves 51.1786 -> 57.8814 with the adopted planning rents, and the ÷E relationship
     below is byte-unchanged — which is the evidence the ruling touched procurement and not the
     algorithmic-lead prior that couples these two readings. */
  const ref = E.workload(E.pinReferenceLevers(E.applyPresetSettings(
    E.MODELS.find((m) => m.id === "opus"), E.PERSPECTIVES.find((p) => p.id === "median"), { mode: "native" })));
  assert.ok(Math.abs(ref.margin - 0.5843046405779231) < 1e-15, "the trend-0 reference is the post-vetting-repairs value: " + ref.margin);
  assert.ok(Math.abs(ref.costMix / wl.costMix - Math.pow(3, 0.25)) < 1e-12, "the default is the reference ÷E on the cost side");
  assert.ok(Math.abs(res.costs.blended_cost_usd_per_mtok - wl.costMix) < EPS, "costMix");
  assert.ok(Math.abs(res.costs.realized_price_usd_per_mtok - wl.priceMix) < EPS, "priceMix");
  assert.ok(Math.abs(res.costs.decode_cost_usd_per_mtok - wl.cOut) < EPS, "cOut");
  assert.ok(Math.abs(res.costs.fresh_prefill_cost_usd_per_mtok - wl.cIn) < EPS, "cIn");
  assert.ok(Math.abs(res.costs.cache_read_cost_usd_per_mtok - wl.cCache) < EPS, "cCache");
  assert.equal(res.selection_receipt.this_result_pct, Math.round(wl.margin * 100));
  assert.equal(res.selection_receipt.this_result_pct, 68);
  // R2 re-mint: 7/7 legs render (feasibility semantics = renders numbers); the note is
  // the shared disclosure — now the renormalization clause + the WELDED POLICY CLAUSE
  // (the retired N_shard sensitivity clause is gone with its channel).
  assert.deepEqual(
    { renderable_legs: res.feasibility.renderable_legs, total_legs: res.feasibility.total_legs },
    { renderable_legs: 5, total_legs: 5 }, // im-vet-six-repairs (2026-09-20): the five MEMBER legs, both Trainium legs withdrawn
  );
  assert.ok(Math.abs(res.feasibility.renderable_weight_share - 1) < 1e-9);
  const membHere = E.deriveDefaultFleetMembership(E.DEFAULT_FLEET_ID, engineState("opus", "median"));
  assert.equal(res.feasibility.note, E.fleetRenderableDisclosure(wl.fleetRenderable, false, membHere));
  assert.match(res.feasibility.note, /loaded-bytes planning policy \(1 B\/param/,
    "MCP carries the welded policy clause from the one shared disclosure function");
  // FA (memo J-9): at the revised flagship size NOTHING is excluded — the note leads
  // with the honest renormalization head; the exclusion weld now lives on the 5T size case.
  /* im-arc T4 fold (2026-08-24), memo §4: three declared legs now carry NO admissible public
     planning rate, so under the default rent basis the note leads with the renormalization head
     instead. The property is unchanged — the note states the true membership, whatever it is.
     im-release-edit-r2 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
     and the three legs are priced again, so the note leads with the full-fleet head instead. The
     property is unchanged for the second time, and that is exactly why this assertion is worth
     keeping through both moves: it never asserted a membership, it asserted that the note states
     the true one. */
  /* im-vet-six-repairs (2026-09-20): the true membership is five of seven, the two Trainium legs
     withdrawn on evidence grounds — and this assertion has never asserted a membership, only that
     the note states the true one, which is why it survives a third move unchanged in kind. */
  assert.match(res.feasibility.note, /default membership: 5 of 7 declared legs/,
    "the note states the true membership at the revised default");
  assert.match(res.feasibility.note, /all 5 of 5 default member legs renderable/,
    "…and the member legs all render");
  assert.doesNotMatch(res.feasibility.note, /blend renormalized/,
    "nothing is renormalized away once every declared leg carries a planning rate");
  assert.doesNotMatch(res.feasibility.note, /excluded from the default/,
    "no exclusion clause at the revised default");
  assert.doesNotMatch(res.feasibility.note, /N_shard=8|N_shard=32/,
    "the retired width-sensitivity clause never resurfaces");
  // lens-span parity against the engine at byte-identical traffic
  const span = E.lensSpan(E.MODELS.find((x) => x.id === "opus"), { mode: "custom", ioRatio: 15, cacheHit: 60 });
  assert.equal(res.lens_span.n_lenses, span.n);
  assert.ok(res.lens_span.span.includes(`≈${Math.round(span.lo * 100)}%`), "span lo inside string");
  assert.ok(res.lens_span.span.includes(`≈${Math.round(span.hi * 100)}%`), "span hi inside string");
  assert.equal(res.form_correction_debt.not_a_result, E.FORM_DEBT_NOT_A_RESULT);
  // Amendment-3 (distinct-selection) coverage form, engine-computed at the flagship baseline;
  // probe8 re-derives these independently (old with-replacement figures: 53.2909/64.1688/10.88).
  /* im-release-edit-r3 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
     38.2601/55.9382/17.68 -> 47.6064/61.2982/13.69, re-minted from the executed reading. The debt
     is the span between the identified form-correction corners AT the flagship baseline, and the
     baseline moved when the declared fleet priced, so the span moves with it. Note what the move
     itself says: the span NARROWS by 6.75 points, because three legs that had been renormalized
     out of the blend now carry rates and dilute the two legs whose form correction is largest.
     The debt did not get smaller as evidence — the blend it is measured across got wider. */
  assert.deepEqual(res.form_correction_debt.identified_span_pct,
    { lo: 47.6064, hi: 61.2982, span_pp: 13.69 });
  assert.equal(res.form_correction_debt.identified_span_scope, "flagship-opus-baseline-at-public-evidence-reference");
  /* im-vet-six-repairs (2026-09-20), vetting finding E1: the two Trainium legs are WITHDRAWN from
     the default fleet, so they are not in this scenario's affected_legs at all — the ~15.2x
     exposure that used to ride the debt as a caveat is now the stated REASON the legs are outside
     the reading. Both halves are asserted so neither can go quiet: the legs are absent here, and
     the exposure statement is still executed on the state that still renders them
     (tests/form-equivalence-b9.test.mjs, on the declared topology). */
  assert.equal(res.form_correction_debt.affected_legs.find((leg) => leg.hardware_key === "trn2"), undefined,
    "a withdrawn leg carries no form-correction debt in the default reading");
  assert.equal(res.form_correction_debt.affected_legs.find((leg) => leg.hardware_key === "trn3"), undefined);
  // Memo §5: the topology-aware leg's replication residual reaches the MCP surface too.
  const tpu7Debt = res.form_correction_debt.affected_legs.find((leg) => leg.hardware_key === "tpu7");
  assert.ok(tpu7Debt, "tpu7 present in affected_legs via its replication residual");
  assert.match(tpu7Debt.replication_residual, /replicated components are charged at the replica's shared rate/);
  assert.equal(tpu7Debt.eta_held_throughput_ratio, null);
});

test("non-Opus form debt labels the fixed span as the flagship baseline", async () => {
  for (const model of ["kimi", "dsv4"]) {
    const res = sc(await h.call("run_scenario", { model }));
    assert.equal(res.form_correction_debt.identified_span_scope, "flagship-opus-baseline-at-public-evidence-reference", model);
  }
});

test("batch-rule capacity receipts distinguish the internal base from the declared batch", async () => {
  const res = sc(await h.call("run_scenario", {
    model: "dsv4", overrides: { interact: "batch" },
  }));
  for (const leg of res.feasibility.legs) {
    const receipt = leg.solver_receipt;
    assert.ok(receipt, leg.hardware);
    assert.ok(receipt.capacity_target_batch > 0, leg.hardware);
    assert.notEqual(receipt.capacity_target_batch, leg.declared_batch, leg.hardware);
    assert.equal(receipt.capacity_target_objective, "batch-rule base fit", leg.hardware);
    assert.match(receipt.capacity_target_batch_source,
      /^OPERATING_POINTS\.[^.]+\.balanced \(base batch used to select the batch-rule capacity width\)$/,
      leg.hardware);
    assert.equal(receipt.declared_operating_point_objective, receipt.capacity_target_objective, leg.hardware);
    assert.equal(receipt.b_declared, receipt.capacity_target_batch, leg.hardware);
    assert.equal(receipt.b_declared_source, receipt.capacity_target_batch_source, leg.hardware);
    assert.match(receipt.deprecated_alias_note, /alias the capacity_target_\* fields/, leg.hardware);
  }
});

test("grok + xaiopp — ≈19 (the activated valuation-replay ground truth; rent-adoption re-mint)", async () => {
  const res = sc(await h.call("run_scenario", { model: "grok", perspective: "xaiopp" }));
  const wl = E.workload(engineState("grok", "xaiopp"));
  /* im-release-edit-r3 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
     BOTH numbers on this test were stale, in different ways, and they are re-minted from the
     executed reading rather than from the handoff note that described them.
     (a) the ground truth read 18.670421032669247 and the engine computes 18.670415478957526 — a
         gap of 5.5537e-6, outside this test's own 1e-9 tolerance by more than three orders of
         magnitude. That literal was written from a tree that is not the one shipping. (The
         magnitude here read "5.5e-9" until a fallback review executed the subtraction — a wrong
         number inside a note whose whole subject is numeric precision, which is worth the
         embarrassment of recording rather than quietly correcting.);
     (b) the pin read 12 and the receipt now reports 19.
     The CAUSE is the adopted fleet rents, not the Grok cache correction, and this test is the place
     that proves it: traffic.cache_hit_pct is asserted 0 four lines down, so `cacheReadMult` 25 -> 15
     cannot reach this reading at all. Flipping the three adopted rents off returns it to 11.743092
     -> 12. That matches the corrected bq-2180 row, which says every published Grok point runs
     uncached, and contradicts the handoff table that attributed this row to the cache multiplier. */
  assert.ok(Math.abs(wl.margin * 100 - 18.670415478957526) < 1e-9, "engine ground truth is ≈19: " + wl.margin * 100);
  assert.equal(res.selection_receipt.this_result_pct, Math.round(wl.margin * 100));
  assert.equal(res.selection_receipt.this_result_pct, 19);
  for (const leg of res.feasibility.legs) {
    assert.equal(leg.solver_receipt.decode_representative_tokens, 3500, leg.hardware);
    assert.equal(leg.solver_receipt.peak_kv_tokens, 4000, leg.hardware);
    assert.match(leg.solver_receipt.peak_kv_definition, /ISL \+ OSL/, leg.hardware);
  }
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
  /* b9 M5: run_scenario reports what the calculator's DEFAULT state computes (the ratified prior
     included), while explorationFlagshipMargin is the route's reference-anchored MEMBERSHIP number.
     They are different questions and the conditional string now names its basis, so the assertion
     compares like with like: the receipt against the live flagship computation, the membership
     number against the reference, and the gap against E. */
  const run = sc(await h.call("run_scenario", { model: "opus", perspective: "x90-v1", traffic: { mode: "profile", profile_id: "reference" } }));
  const x90 = E.PERSPECTIVES.find((p) => p.id === "x90-v1");
  const liveX90 = E.workload(E.applyPresetSettings(
    E.MODELS.find((m) => m.id === "opus"), x90, E.FLAGSHIP_SCOPE.traffic)).margin * 100;
  assert.equal(run.selection_receipt.this_result_pct, Math.round(liveX90));
  const refX90 = E.explorationFlagshipMargin(x90);
  assert.ok(Math.abs((100 - liveX90) * Math.pow(3, 0.25) - (100 - refX90)) < 1e-9,
    "membership number is the live reading with the prior removed: " + refX90 + " vs " + liveX90);
});

test("MLI-1 forged-payload replay — grok+xaiopp+{ioRatio:300,cacheHit:95}: both rejected before the registered context bound", async () => {
  const res = sc(await h.call("run_scenario", { model: "grok", perspective: "xaiopp", overrides: { ioRatio: 300, cacheHit: 95 } }));
  assert.equal(res.rejected_overrides.length, 2);
  assert.ok(res.rejected_overrides.every((r) => /locked by replay — overlay rejected/.test(r)));
  const clean = E.workload(engineState("grok", "xaiopp"));
  assert.ok(Math.abs(res.costs.blended_cost_usd_per_mtok - clean.costMix) < EPS, "costs identical to the clean replay");
  assert.ok(Math.abs(res.costs.realized_price_usd_per_mtok - clean.priceMix) < EPS);
  /* im-release-edit-r3 (2026-09-10, d-20260910-im-adopt-fleet-rents-and-correct-grok): 12 -> 19,
     the same clean-replay reading as the test above and for the same reason — the adopted fleet
     rents, not the cache correction, which this replay's locked 0% cache-hit cannot see. The
     property under test is that a forged overlay is REJECTED and the clean replay is what renders;
     that is asserted directly above against the engine, and this pin is the absolute witness that
     server and engine did not both move together in the wrong direction. */
  assert.equal(res.selection_receipt.this_result_pct, 19);
  const m = E.MODELS.find((x) => x.id === "grok");
  const p = E.PERSPECTIVES.find((x) => x.id === "xaiopp");
  const forged = engineState("grok", "xaiopp");
  forged.ioRatio = 300; forged.cacheHit = 95;
  const forgedTraffic = { ...E.resolveTraffic(m, p, { mode: "native" }), ioRatio: 300, cacheHit: 95, profileId: null };
  const forgedWl = E.workload(forged, undefined, E.makeScenarioContext(m, forgedTraffic));
  assert.equal(Number.isFinite(forgedWl.margin), false,
    "the forgery also exceeds Grok's registered maxPos and cannot synthesize the old ≈−115 result");
  assert.ok(forgedWl.fleetRenderable.legStatuses.every((leg) =>
    leg.contextWindow?.state === "exceeded-registered-limit"));
  assert.notEqual(res.selection_receipt.this_result_pct, -115);
});

test("registered maxPos — one-token-over custom traffic fails closed with a typed context receipt", async () => {
  const res = sc(await h.call("run_scenario", {
    model: "dsr1",
    traffic: { mode: "custom", io_ratio: 162.841, cache_hit: 60 },
  }));
  assert.equal(Object.hasOwn(res, "costs"), false, "no numeric cost block");
  assert.equal(res.selection_receipt.this_result_pct, null, "no synthesized margin");
  assert.equal(res.feasibility.renderable_legs, 0);
  assert.ok(res.feasibility.legs.every((leg) =>
    leg.op_basis === "context-window-exceeded"
      && leg.reason.includes("163,841")
      && leg.context_window.state === "exceeded-registered-limit"
      && leg.solver_receipt === null));
  assert.match(res.sentence, /context window/i);
});

test("gemini dive — the R2-fixed false negative stays fixed: 1/1 legs render at the solver width, ≈84 (b9 M1 re-mint — tpu7 rent repaired)", async () => {
  // R2 re-mint (manifest row; the owner-cited FALSE NEGATIVE): tpu7 solves at a legal
  // width — the dive replay renders instead of a spurious typed-infeasible.
  const res = sc(await h.call("run_scenario", { model: "gemini", perspective: "dive" }));
  assert.equal(res.selection_receipt.this_result_pct, 84);
  assert.equal(res.feasibility.renderable_legs, 1);
  assert.equal(res.feasibility.total_legs, 1);
  assert.equal(res.feasibility.renderable_weight_share, 1);
  assert.ok(res.feasibility.legs[0].solved_width != null, "solver width surfaced on the leg");
  assert.doesNotMatch(res.sentence, /NaN/);
  assert.equal(Object.hasOwn(res, "costs"), true, "a rendering replay carries its cost block (R2: the fixed false negative computes)");
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

test("customDonor — MCP run_scenario computes donor-distinct outputs, not a silent dsr1 default (R7b P1 fix)", async () => {
  const m = E.MODELS.find((x) => x.id === "custom"), p = E.PERSPECTIVES.find((x) => x.id === "median");
  const tr = E.resolveTraffic(m, p, { mode: "native" });
  const results = {}, exact = {}, served = {};
  for (const donor of ["dsr1", "qwen3c", "llama70"]) {
    const res = sc(await h.call("run_scenario", { model: "custom", overrides: { customDonor: donor } }));
    // Ground truth: independently build state + context exactly as the server should, and compare.
    const base = E.applyPresetSettings(m, p, { mode: "native" });
    const { diff } = E.sanitizeScenarioDiff({ customDonor: donor }, tr);
    const state = Object.assign(base, diff);
    const ctx = E.makeScenarioContext(m, tr, state.customDonor);
    const wl = E.workload(state, undefined, ctx);
    const expectedPct = Math.round(wl.margin * 100);
    assert.equal(res.selection_receipt.this_result_pct, expectedPct,
      `donor ${donor}: server ${res.selection_receipt.this_result_pct} vs engine ground truth ${expectedPct}`);
    results[donor] = res.selection_receipt.this_result_pct;
    /* The SERVER's own unrounded numbers, not the engine's. The 2026-09-19 fold first compared
       `wl.margin` here — the independently computed ground truth — which made the distinctness
       claim vacuous on the side that matters: a server that silently fell back to dsr1 would
       still have three distinct ENGINE values. Astra round 2 demonstrated it by transpiling
       run_scenario with llama70 mapped to dsr1 and watching this file stay green. The response's
       cost record is unrounded (fresh prefill $0.8592271117 for llama70 against $0.9100278143
       for the default), so it separates the three computations whatever they round to. */
    served[donor] = [res.costs.blended_cost_usd_per_mtok, res.costs.decode_cost_usd_per_mtok,
      res.costs.fresh_prefill_cost_usd_per_mtok].join("|");
    exact[donor] = wl.margin;
    assert.ok(Number.isFinite(res.costs.fresh_prefill_cost_usd_per_mtok)
      && res.costs.fresh_prefill_cost_usd_per_mtok > 0,
      `donor ${donor}: the response must carry an unrounded prefill cost for this check to mean anything`);
  }
  /* DISTINCTNESS IS CHECKED AT FULL PRECISION (vetting round 2026-09-19). This used to compare
     `this_result_pct`, the WHOLE-PERCENT figure, and require three distinct integers — which
     made the guard hostage to a rounding coincidence rather than to the defect it is for. The
     im-vet-0919 fold corrected dense-TP prefill pricing (llama70 is the dense donor), and its
     margin landed on 73% beside dsr1's 73%: two different computations, one rounded integer,
     and a guard against "the server silently computed dsr1" went red for no reason related to
     silent defaults. Full-precision margins separate the three computations whatever they
     round to, and the per-donor ground-truth equality above still pins each one to the engine,
     so this is strictly stronger than what it replaces. */
  assert.equal(new Set(Object.values(exact)).size, 3,
    `all three donors must compute DISTINCT margins at full precision, got ${JSON.stringify(exact)}`);
  /* The load-bearing one: THE SERVER's unrounded cost records must differ per donor. This is
     what goes red when the handler computes the default donor under another donor's name. */
  assert.equal(new Set(Object.values(served)).size, 3,
    `the SERVER must return distinct unrounded cost records per donor, got ${JSON.stringify(served)}`);
  assert.notEqual(served.llama70, served.dsr1,
    `the dense donor must not silently fall back to the default one (${served.llama70} vs ${served.dsr1})`);
});

test("customDonor — MCP response margin agrees with its own share_url embedded margin (R7b P1 fix)", async () => {
  for (const donor of ["dsr1", "qwen3c", "llama70"]) {
    const res = sc(await h.call("run_scenario", { model: "custom", overrides: { customDonor: donor } }));
    const tokenMatch = res.share_url.match(/[?&]s=([^&]+)/);
    assert.ok(tokenMatch, `donor ${donor}: share_url carries an s= token`);
    const token = decodeURIComponent(tokenMatch[1]);
    const decoded = E.decodeScenario(token);
    assert.ok(decoded && decoded._meta && typeof decoded._meta.displayedMargin === "number",
      `donor ${donor}: share_url token decodes with a numeric displayedMargin`);
    assert.equal(Math.round(decoded._meta.displayedMargin), res.selection_receipt.this_result_pct,
      `donor ${donor}: share_url embedded margin ${decoded._meta.displayedMargin} must round to the same value as the response's this_result_pct ${res.selection_receipt.this_result_pct} — the exact R7b defect (MCP accepted/echoed customDonor but computed dsr1, so its own share link disagreed with its own response)`);
    // customDonor itself must round-trip through the token for non-default donors.
    if (donor !== "dsr1") assert.equal(decoded.customDonor, donor, `donor ${donor}: encoded in the share token`);
    else assert.ok(!("customDonor" in decoded), "dsr1 (default) is never encoded");
  }
});

test("IM3 exit-gate fix 1/3 + R2 §1.4 — the GATED receipt welds the baseline condition (policy_scenario_* branch)", async () => {
  const res = sc(await h.call("run_scenario", { model: "opus" }));
  const r = res.selection_receipt;
  const wl = E.explorationFlagshipWorkload(E.PERSPECTIVES.find((p) => p.id === "median"));
  // FA re-mint (memo J-9): the revised-size FILTERED default — 7/7 member legs render;
  // no exclusion exists, so the weld carries the honest renormalization head.
  /* im-arc T4 fold (2026-08-24), memo §4: 4 of 7 priced under the default rent basis.
     im-release-edit-r3 (2026-09-10, d-20260910-im-adopt-fleet-rents-and-correct-grok): 7 of 7, at
     the full declared weight. Asserting the share EXACTLY, rather than within 5e-3 of 1, is what
     caught the engine returning 1.0000000000000002 — a published share above 100% that a tolerance
     would have waved through.
     CORRECTED 2026-09-10 after a fallback-review finding (F1/F2), and both halves of the correction
     matter. The comment used to end "Fixed at source (site/engine.js), not by widening this." THAT
     WAS FALSE: the engine fix was written, measured, and REVERTED — the correction lives at the
     connector's publication boundary (mcp-server/src/shape.ts) and the engine-internal identity is
     open as bq-2194. Asserting a repair that does not exist, in the file a maintainer would consult
     to decide whether bq-2194 is still open, is the same class of defect as a wrong number.
     AND THE ASSERTION ITSELF HAD GONE HOLLOW. Once the connector normalizes the share, the published
     `=== 1` is ENTAILED by the two leg-count assertions above it — it cannot fail while they pass,
     so it stopped witnessing anything about the engine. It is kept as what it honestly is, a
     schema-conformance check on the published field, and the engine value it used to stand for is
     asserted separately below, where a regression can actually reach it. */
  // im-vet-six-repairs (2026-09-20): the default is five legs; the two Trainium ones are withdrawn.
  assert.equal(r.policy_scenario_renderable_legs, 5);
  assert.equal(r.policy_scenario_total_legs, 5);
  assert.equal(r.policy_scenario_renderable_weight_share, 1,
    "the PUBLISHED share conforms to the connector's own max(1) schema");
  assert.ok(Math.abs(wl.fleetRenderable.renderableWeightShare - 1) <= 1e-9,
    "the ENGINE's own share is 1 to within one ulp — this is the half the published assertion "
    + "can no longer witness, and it is what fails if the engine regresses while the legs still "
    + "count 7 of 7: " + wl.fleetRenderable.renderableWeightShare);
  const memb = E.deriveDefaultFleetMembership(E.DEFAULT_FLEET_ID, E.applyPresetSettings(
    E.MODELS.find((m) => m.id === "opus"), E.PERSPECTIVES.find((p) => p.id === "median"), { mode: "native" }));
  assert.equal(r.policy_scenario_note, E.fleetRenderableDisclosure(wl.fleetRenderable, false, memb));
  /* im-release-edit-r3 (2026-09-10, same ruling): nothing is renormalized away and nothing is
     excluded, so the note leads with the full-fleet head. Both halves are still asserted — the
     absence of an exclusion clause AND the presence of the true membership statement — so this
     cannot pass on a note that has simply gone quiet. */
  /* im-vet-six-repairs (2026-09-20), vetting finding E1: TWO legs ARE excluded now, on evidence
     grounds, so the note leads with the withdrawal clause. Both halves are still asserted and the
     test still cannot pass on a note that has gone quiet — what it demands changed from "no
     exclusion, and say so" to "this exact exclusion, named, with the renormalization stated". */
  assert.ok(/Trainium2 withdrawn from the default on evidence grounds/.test(r.policy_scenario_note)
    && /Trainium3 withdrawn from the default on evidence grounds/.test(r.policy_scenario_note)
    && /renormalized over the remaining 5/.test(r.policy_scenario_note)
    && /all 5 of 5 default member legs renderable/.test(r.policy_scenario_note),
    "the receipt note states the true membership: " + r.policy_scenario_note.slice(0, 160));
  /* R3 D-1/D-3c: the structured membership record rides the receipt. im-vet-six-repairs
     (2026-09-20): 5 members and TWO exclusions, both typed `withdrawn` — the structured record
     carries the withdrawal, not only the prose. */
  assert.equal(r.default_membership.member_leg_count, 5);
  assert.equal(r.default_membership.excluded.length, 2);
  assert.deepEqual(r.default_membership.excluded.map((x) => x.hw_key ?? x.hwKey).sort(), ["trn2", "trn3"]);
  assert.equal(r.default_membership.derived_at.traffic_profile_id, "reference");
  // R3 D-6 / FA J-9: the typed membership-sensitivity record rides policy_sensitivity —
  // at the revised size the membership is policy-STABLE across all sampled points
  // (every would_enter/would_leave empty; the h100 would-enter story lives on the 5T case).
  assert.equal(r.policy_sensitivity.membership_sensitivity.points.length, 3);
  assert.ok(r.policy_sensitivity.membership_sensitivity.points.every((x) => x.would_enter.length === 0 && x.would_leave.length === 0));
  assert.equal(r.policy_scenario_scope, "Claude Opus 4.x's own central lens (median perspective @ model-default native traffic)");
  assert.equal(r.central_estimate_pct, undefined, "no central_estimate_* fields while ineligible (hard gate)");
  // R2 additions: five-status + two booleans + policy sensitivity ride the receipt
  assert.equal(r.five_status.economics, "evidence-quality: analyst-set-assumed-op throughput · analyst-set price"); // b9 M1: gb300 relabelled fitted → analyst-set-assumed-op, the worst class on this blend
  assert.equal(r.renderable_under_policy_all_legs, true); // R3: policy-clean by construction
  assert.equal(r.placement_verified, false);
  assert.equal(r.policy_sensitivity.points.length, 3);
  // ground truth: matches the engine directly, not just an internally-consistent server value.
  assert.deepEqual(
    { legs: r.policy_scenario_renderable_legs, total: r.policy_scenario_total_legs, share: r.policy_scenario_renderable_weight_share },
    { legs: wl.fleetRenderable.renderableLegs, total: wl.fleetRenderable.totalLegs, share: wl.fleetRenderable.renderableWeightShare },
  );
});

test("B5 (final re-verification, P1) — the receipt's baseline fields describe THIS QUERY's own model, not a hardcoded flagship fallback (R2: policy_scenario_*)", async () => {
  // R2 re-mint (manifest rows): every fleet fully renders under solver widths.
  /* im-arc T4 fold (2026-08-24): each fleet's PRICED membership, per model, under the default
     rent basis. What this asserts is unchanged — the receipt describes THIS query's own model —
     and the numbers differing per model is exactly what proves it.
     im-release-edit-r3 (2026-09-10, d-20260910-im-adopt-fleet-rents-and-correct-grok): re-minted to
     7/7, 4/4, 4/4 — every fleet now prices in full. AND ONE WITNESS GOT WEAKER, which is worth
     saying rather than quietly re-minting past: while three legs were unpriced, sonnet read 4 of 7
     and Opus read 4 of 7 too but at a different weight share, so the leg counts themselves
     discriminated. They no longer do — sonnet is 7/7 and so is Opus. If this test still rested on
     leg counts it would now pass against exactly the hardcoded flagship fallback it was written to
     catch. So the discriminating assertion is made explicit below: the queried model's own margin,
     which differs from Opus's, and a fleet whose TOTAL differs from the flagship's. */
  const opusRef = sc(await h.call("run_scenario", { model: "opus" })).selection_receipt;
  let sawDifferentTotal = false;
  for (const [model, legs, total] of [["sonnet", 7, 7], ["gpt", 4, 4], ["grok", 4, 4]]) {
    const res = sc(await h.call("run_scenario", { model }));
    const r = res.selection_receipt;
    assert.equal(r.this_result_pct, r.policy_scenario_pct, model + ": queried its own central-default state");
    assert.equal(r.policy_scenario_renderable_legs, legs, model + ": renderable legs must be its OWN fleet, not Opus's");
    assert.equal(r.policy_scenario_total_legs, total, model);
    assert.ok(r.policy_scenario_renderable_weight_share > 0 && r.policy_scenario_renderable_weight_share <= 1, model
      + ": share is a proportion of declared weight — " + r.policy_scenario_renderable_weight_share);
    assert.ok(r.policy_scenario_scope.includes("own central lens"), model + ": scope field present — " + r.policy_scenario_scope);
    assert.ok(!r.policy_scenario_scope.toLowerCase().includes("opus") || model === "opus", model + ": scope must not silently claim Opus's flagship scope");
    // the load-bearing discriminator now that leg counts agree: this model's OWN number.
    assert.notEqual(r.policy_scenario_pct, opusRef.policy_scenario_pct,
      model + ": the receipt reports this model's own central reading, not the flagship's "
      + opusRef.policy_scenario_pct);
    if (r.policy_scenario_total_legs !== opusRef.policy_scenario_total_legs) sawDifferentTotal = true;
  }
  assert.ok(sawDifferentTotal,
    "at least one queried fleet differs from the flagship's in size — otherwise a hardcoded "
    + "flagship fallback would satisfy every membership assertion in this loop");
});

test("IM3 exit-gate fix 1/3 — SelectionReceipt welds the central-estimate condition on registry-only tools too (registryReceipt path)", async () => {
  // list_scenario_space / query_margin_claims / get_report / get_dossier / explore_range compute
  // no estimate of their own, but every response still carries the flagship central estimate's
  // condition -- this was the sharpest R7 finding: these tools had NO feasibility payload at all
  // to fall back on before this fix.
  for (const [tool, args] of [["list_scenario_space", {}], ["query_margin_claims", {}], ["get_report", { id: "report-s1" }]]) {
    const res = sc(await h.call(tool, args));
    const r = res.selection_receipt;
    /* im-arc T4 fold (2026-08-24): the registry-only tools still weld the FLAGSHIP condition, and
       that condition is now 4 of 7 priced legs. The property — a tool that computes nothing still
       carries the condition — is exactly what this asserts, unchanged.
       im-release-edit-r3 (2026-09-10, d-20260910-im-adopt-fleet-rents-and-correct-grok): the
       flagship condition is 7 of 7 at full declared weight, so the note leads with the full-fleet
       head rather than the renormalization head. The property is unchanged for the second time. */
    /* im-vet-six-repairs (2026-09-20): the flagship condition is 5 of 5 MEMBER legs at full member
       weight, the two Trainium ones having been withdrawn before pricing. The property — a tool that
       computes nothing still carries the condition — is unchanged for the third time. */
    assert.equal(r.policy_scenario_renderable_legs, 5, tool);
    assert.equal(r.policy_scenario_total_legs, 5, tool);
    /* schema conformance on the published field (see the note on the gated receipt above: since the
       connector normalizes, this is entailed by the leg counts and no longer witnesses the engine).
       The engine-side witness lives on the gated-receipt test, which is where a regression reaches. */
    assert.equal(r.policy_scenario_renderable_weight_share, 1, tool);
    // FA (memo J-9): the note leads via the SAME one-formatter weld, whatever the membership is.
    /* im-vet-six-repairs (2026-09-20): the note leads with the EXCLUSION head, via the same one
       formatter, because the default now has one. The weld is what this asserts and it is intact. */
    assert.ok(r.policy_scenario_note.startsWith("default membership: 5 of 7 declared legs"), tool + ": " + r.policy_scenario_note);
    assert.ok(!/blend renormalized/.test(r.policy_scenario_note), tool + ": nothing is renormalized away by CAPACITY");
    assert.ok(/withdrawn from the default on evidence grounds/.test(r.policy_scenario_note), tool + ": " + r.policy_scenario_note);
    assert.ok(/loaded-bytes planning policy/.test(r.policy_scenario_note), tool + ": the welded policy clause rides the note");
  }
});

test("IM3 exit-gate fix 1 — list_scenario_space's own prose sentence welds the condition (not just the receipt)", async () => {
  const res = sc(await h.call("list_scenario_space", {}));
  assert.match(res.sentence, /the (policy-labeled baseline|interim renderable-subset) scenario at the flagship scope/);
  assert.match(res.sentence, /loaded-bytes planning policy/);
});

test.after(async () => { await h.close(); });
