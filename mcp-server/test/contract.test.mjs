// Honest-labeling contract suite (release gate) — written FIRST, implementation follows to green.
// Asserts the DECISIONS of research/mcp-server-design.md: response-level envelope (Variant B),
// status-fused value strings, floors-never-intervals, company-GM segregation, replay locks,
// grep-parity of every app.js-mirrored sentence.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { connectInMemory, engine, sc, text, forbiddenNumericLeaves, walkLeaves } from "./harness.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appJs = readFileSync(path.join(__dirname, "../../site/app.js"), "utf8");

const h = await connectInMemory();
const battery = {};
const calls = [
  ["list", "list_scenario_space", {}],
  ["claims_full", "query_margin_claims", {}],
  ["claims_b8090", "query_margin_claims", { bucket: "b8090" }],
  ["claims_b90", "query_margin_claims", { bucket: "b90plus" }],
  ["claims_b6080", "query_margin_claims", { bucket: "b6080" }],
  ["claims_xai", "query_margin_claims", { subject: "xAI" }],
  ["claims_nonbin", "query_margin_claims", { include_non_binnable: true }],
  ["run_opus", "run_scenario", { model: "opus" }],
  ["run_grok_opp", "run_scenario", { model: "grok", perspective: "xaiopp" }],
  ["run_expl", "run_scenario", { model: "opus", perspective: "x90-v1" }],
  ["run_custom", "run_scenario", { model: "custom" }],
  ["run_tariff", "run_scenario", { model: "terra" }],
  ["run_hard_refused", "run_scenario", { model: "dsr1", perspective: "xaiopp" }],
  ["run_hard_forced", "run_scenario", { model: "dsr1", perspective: "xaiopp", force_exploratory: true }],
  ["run_mli1", "run_scenario", { model: "grok", perspective: "xaiopp", overrides: { ioRatio: 300, cacheHit: 95 } }],
  ["run_modified", "run_scenario", { model: "grok", perspective: "xaiopp", overrides: { util: 60 } }],
  ["run_lens_override", "run_scenario", { model: "opus", overrides: { priceOut: 30 } }],
  /* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): absolute
     rent is a first-class MCP override and must reject, never clamp, outside its bounds. */
  ["run_rent_abs_base", "run_scenario", { model: "opus" }],
  ["run_rent_abs_2", "run_scenario", { model: "opus", overrides: { rentAbsAll: 2 } }],
  ["run_rent_abs_oob", "run_scenario", { model: "opus", overrides: { rentAbsAll: 0.01 } }],
  /* im-arc T1 fix (Sol review 2026-08-22, finding P2-1): map receipts must name
     donors deterministically rather than falling through String(object). */
  ["run_rent_abs_leg", "run_scenario", { model: "opus", overrides: { rentAbsLeg: { h200: 2.5, h100: 1.25 } } }],
  ["explore_90", "explore_range", { range: "b8090" }],
  ["explore_num", "explore_range", { range: 85 }],
  ["explore_6080", "explore_range", { range: "b6080" }],
  ["explore_60", "explore_range", { range: "b60minus" }],
  ["explore_at", "explore_range", { range: "b8090", at_model: "grok" }],
  ["report_s7", "get_report", { id: "report-s7" }],
  ["dossier_opus", "get_dossier", { type: "model", id: "opus" }],
  ["dossier_route", "get_dossier", { type: "perspective", id: "x90-v1" }],
  ["dossier_retired", "get_dossier", { type: "perspective", id: "semi" }],
];
for (const [key, name, args] of calls) battery[key] = await h.call(name, args);

test("tool naming — only query_margin_claims contains 'margin'; all fifteen read-only", async () => {
  const { tools } = await h.client.listTools();
  /* U5 (dc-map DESIGN §6) added seven datacenter tools AFTER the original eight. The property this
     test has always asserted is unchanged and is asserted over the whole surface: read-only
     everywhere, and no tool name says "margin" except the one that returns cited claims. */
  assert.equal(tools.length, 15);
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, [
    "adjust_rental_rate", "datacenter_impact", "datacenter_schedule", "datacenter_stakeholders",
    "explore_range", "get_datacenter", "get_dossier", "get_report",
    "list_datacenters", "list_scenario_space", "price_token_from_site", "query_margin_claims",
    "rank_datacenters", "run_fleet_sections", "run_scenario",
  ]);
  for (const t of tools) {
    if (t.name !== "query_margin_claims") assert.ok(!/margin/i.test(t.name), t.name);
    assert.equal(t.annotations?.readOnlyHint, true, t.name + " readOnlyHint");
  }
  for (const name of ["run_scenario", "adjust_rental_rate", "run_fleet_sections"]) {
    const description = tools.find((tool) => tool.name === name)?.description || "";
    assert.doesNotMatch(description, /\bestimate\b|estimated actual|central estimate/i,
      `T3-B-V5 ${name} policy description rejects estimate vocabulary`);
    assert.match(description, /policy-scenario output/i,
      `T3-B-V6 ${name} policy description uses the registered noun`);
  }
});

/* R2 (§1.4): the receipt baseline is GATED — central_estimate_* only when the claim
   constructor brands centrality (structurally impossible in R2), else policy_scenario_*
   with is_central hard-set false and the constructor's typed refusals attached. */
const basePct = (r) => r.central_estimate_pct ?? r.policy_scenario_pct;

test("envelope totality — no bare numeric leaf keyed /margin|estimate|gm/i outside selection_receipt", () => {
  for (const [key, res] of Object.entries(battery)) {
    if (res.isError) continue;
    const bad = forbiddenNumericLeaves(sc(res));
    assert.deepEqual(bad, [], key + " leaked numeric margin-keyed leaves: " + bad.join(", "));
  }
});

test("Variant B envelope — every result leads with a sentence and carries a receipt with the central estimate", () => {
  for (const [key, res] of Object.entries(battery)) {
    if (res.isError) continue;
    const s = sc(res);
    assert.equal(typeof s.sentence, "string", key + " sentence");
    assert.ok(s.sentence.length > 40, key + " sentence too short to be a complete honest sentence");
    // R2: the text artifact is the boundary-emitted mcp-text envelope — it LEADS with the
    // sentence and carries the machine block (content-addressed claims) after it.
    assert.ok(text(res).startsWith(s.sentence), key + " text content leads with the sentence");
    assert.ok(text(res).includes("---MACHINE---"), key + " machine block present (both-transport sidecar contract)");
    assert.ok(/\[weld \d+\/\d+ legs renderable/.test(s.sentence), key + " shared weld token inline in the lead sentence");
    const r = s.selection_receipt;
    assert.ok(r, key + " selection_receipt");
    assert.ok(Number.isFinite(basePct(r)), key + " gated baseline pct (central_estimate_* | policy_scenario_*)");
    if (r.policy_scenario_pct !== undefined) {
      assert.equal(r.is_central, false, key + " is_central HARD-SET false on a policy-driven receipt");
      assert.ok(Array.isArray(r.central_ineligibility_reasons) && r.central_ineligibility_reasons.length > 0,
        key + " typed constructor refusals attached");
    }
    assert.ok(typeof r.is_central === "boolean", key + " is_central");
    assert.equal(typeof r.selection_origin, "string", key + " selection_origin");
    assert.ok(Array.isArray(r.changed_from_central), key + " changed_from_central");
    assert.ok(s.engine && s.engine.revision === engine.ENGINE_REVISION, key + " engine revision");
    assert.equal(s.engine.data_as_of, engine.DATA_AS_OF, key + " data_as_of");
  }
});

test("run_scenario — one rounded scalar; no value_pct_unrounded anywhere", () => {
  for (const key of ["run_opus", "run_grok_opp", "run_expl", "run_custom", "run_tariff", "run_hard_forced", "run_mli1", "run_modified", "run_lens_override"]) {
    const s = sc(battery[key]);
    const r = s.selection_receipt;
    assert.ok(Number.isInteger(r.this_result_pct), key + " this_result_pct is a whole-point scalar");
    assert.ok(Number.isInteger(basePct(r)), key + " baseline rounded");
    assert.ok(!JSON.stringify(s).includes("unrounded"), key + " no unrounded field");
  }
});

test("run_scenario — status-fused value string, must_carry ≤2, metric-identity rider from TIPS.margin", () => {
  for (const key of ["run_opus", "run_grok_opp", "run_hard_forced", "run_modified", "run_lens_override"]) {
    const s = sc(battery[key]);
    assert.equal(typeof s.headline.value, "string", key + " headline.value is a string");
    assert.ok(/≈-?\d+%/.test(s.headline.value), key + " fused value carries the number");
    assert.ok(s.headline.value.includes("not company GM"), key + " not-company-GM rider fused into the value");
    assert.ok(Array.isArray(s.headline.must_carry) && s.headline.must_carry.length <= 2 && s.headline.must_carry.length >= 1, key + " must_carry ≤2");
    assert.ok(s.headline.must_carry.some((m) => m.includes(engine.TIPS.margin.t)), key + " metric identity from TIPS.margin");
    assert.equal(Object.keys(s.headline)[1], "epistemic_status", key + " status precedes value fields");
    assert.ok(s.sentence.includes("not company GM"), key + " sentence carries the rider");
  }
});

test("run_scenario — status truth table (mirrors app.js state identities)", () => {
  assert.equal(sc(battery.run_opus).headline.epistemic_status, "derived-estimate");
  assert.equal(sc(battery.run_grok_opp).headline.epistemic_status, "replay");
  assert.equal(sc(battery.run_expl).headline.epistemic_status, "range-exploration-counterfactual");
  assert.equal(sc(battery.run_custom).headline.epistemic_status, "custom-scenario");
  assert.equal(sc(battery.run_tariff).headline.epistemic_status, "tariff-scenario");
  assert.equal(sc(battery.run_hard_forced).headline.epistemic_status, "exploratory-forced-pairing");
  assert.equal(sc(battery.run_modified).headline.epistemic_status, "modified-scenario");
  // lens + overrides keeps derived-estimate identity (site behavior) but the shopping is visible
  const lo = sc(battery.run_lens_override);
  assert.equal(lo.headline.epistemic_status, "derived-estimate");
  assert.ok(lo.selection_receipt.changed_from_central.some((c) => c.includes("priceOut")), "override visible in receipt");
  assert.equal(lo.selection_receipt.is_central, false);
  assert.ok(/user-specified|override/i.test(lo.sentence), "sentence declares user-specified assumptions");
});

test("run_scenario — baseline always alongside; is_central HARD-SET false everywhere in R2 (§1.4 negative contract)", () => {
  // R2 FLIP: even the clean central default can no longer claim centrality — the claim
  // constructor refuses (placement unverified, no verified clusters, policy taint) and
  // the receipt emits policy_scenario_* with the typed refusals.
  const central = sc(battery.run_opus).selection_receipt;
  assert.equal(central.is_central, false, "clean default is policy-labeled, never central");
  assert.equal(central.this_result_pct, central.policy_scenario_pct);
  assert.ok(central.central_ineligibility_reasons.some((x) => /renderableUnderPolicy|placement|cluster|taint/i.test(x)),
    "typed constructor refusal recorded (first-failing gate)");
  const cu = sc(battery.run_custom).selection_receipt;
  assert.equal(cu.is_central, false, "custom scratch model likewise policy-labeled");
  for (const key of ["run_grok_opp", "run_expl", "run_modified", "run_lens_override"]) {
    const r = sc(battery[key]).selection_receipt;
    assert.equal(r.is_central, false, key);
    assert.ok(Number.isFinite(basePct(r)), key);
    assert.ok(r.changed_from_central.length > 0, key + " changed_from_central populated");
  }
  // the sentence itself carries the comparator noun — now the policy-labeled baseline
  // (grok's fleet fully renders under solver widths; the old renormalization weld is
  // superseded by the welded policy clause, present via the shared disclosure)
  assert.ok(/the policy-labeled baseline scenario|interim renderable-subset scenario/i.test(sc(battery.run_grok_opp).sentence), "non-central sentence names the gated comparator noun");
  assert.ok(/loaded-bytes planning policy/.test(sc(battery.run_grok_opp).sentence), "the welded policy clause rides the prose");
  // the honestly-empty comparator slot (RATIFIED owner ruling) rides every computed payload
  const slot = sc(battery.run_opus).central_comparator;
  assert.ok(slot && slot.empty === true && /no verified central comparator exists/.test(slot.statement),
    "empty comparison slot present with the ratified statement");
});

test("MLI-1 — replay-locked traffic overrides rejected; forged value never rendered; peak-KV ≈20% stands", () => {
  const s = sc(battery.run_mli1);
  const rejected = s.rejected_overrides.join(" | ");
  assert.ok(/ioRatio \(locked by replay/.test(rejected), "ioRatio rejected");
  assert.ok(/cacheHit \(locked by replay/.test(rejected), "cacheHit rejected");
  /* im-arc T4 fold (2026-08-24, tests/fixtures-t4-declared-delta.json): the xAI opportunity-cost
     replay re-derives 12. The property under test — a replay's locked traffic refuses an override
     and the FORGED value never renders — is untouched and is asserted on either side of this.
     im-release-edit-r3 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
     12 -> 19, re-minted from the executed reading. VERIFIED CAUSE, because the handoff attributed
     it to the wrong input: this replay runs at the dive's Uncached 3:1 / 0% convention (asserted
     directly below as traffic.cache_hit_pct 0), so `cacheReadMult` 25 -> 15 cannot reach it. It
     moved because the three adopted planning rents re-price the declared fleet — flipping the three
     rents off returns this replay to 11.743092, which rounds to the 12 that stood here. */
  assert.equal(s.selection_receipt.this_result_pct, 19);
  assert.equal(s.headline.epistemic_status, "replay", "identity stays the clean replay — nothing was applied");
  assert.ok(!s.sentence.includes("≈-149%") && !s.sentence.includes("≈−149%"), "forged value absent");
});

test("run_scenario — hard pairing refused without force_exploratory (site INCOMPATIBLE PAIR text)", () => {
  const s = sc(battery.run_hard_refused);
  assert.ok(s.sentence.includes("INCOMPATIBLE PAIR — this perspective is scoped to a different provider; no headline is computed."));
  assert.equal(s.headline, undefined, "no headline on a refusal");
  assert.equal(s.selection_receipt.this_result_pct, null);
  assert.ok(/force_exploratory/.test(s.sentence), "tells the caller the explicit escape hatch");
});

test("run_scenario — lens_span non-optional on every computed result; numbers live inside the span string", () => {
  for (const key of ["run_opus", "run_grok_opp", "run_expl", "run_custom", "run_tariff", "run_hard_forced", "run_modified", "run_lens_override"]) {
    const s = sc(battery[key]);
    assert.ok(s.lens_span, key + " lens_span present");
    assert.equal(typeof s.lens_span.span, "string", key + " span is a fused string");
    assert.ok(Number.isInteger(s.lens_span.n_lenses), key + " n_lenses");
  }
  /* row 499 (delta manifest research/b9-delta-manifests/row499-preset-structure-delta-manifest.md):
     2 -> 5. The three adjudicated presets are declared cost lenses and enter the span; BOTH SPAN
     ENDPOINTS are unchanged (the MCP text still reads ~69-87%), so this pin moves on the COUNT of
     declared alternatives only. The engine-side twin of this assertion is T-9's lensSpan.n. */
  /* row 514: 5 -> 7. The two SELF-AUTHORED round-3 adjudicator presets (gptpro-r3, fable-r3) are
     declared cost lenses and enter the span on the same footing. BOTH SPAN ENDPOINTS are again
     unchanged — measured byte-identical at 59.18058739356502 / 83.3330915814653 — so this pin moves
     on the COUNT only, exactly as the row-499 move did. Engine-side twin: T-9's lensSpan.n. */
  assert.ok(sc(battery.run_opus).lens_span.span.includes("across 7 lenses"), "opus spans 7 lenses");
});

test("run_scenario — custom model flagged unsourced-scratch; cited_range_context omitted (authority laundering)", () => {
  const s = sc(battery.run_custom);
  assert.equal(s.model_provenance.unsourced_scratch, true);
  assert.ok(/scratch model — no provider/.test(s.sentence), "sentence declares the scratch model");
  assert.equal(s.headline.cited_range_context, null, "no cited-range context for a scratch model");
});

test("run_scenario — modified replay removes attribution (app.js sentence) and share_url reissues the truthful identity", () => {
  const s = sc(battery.run_modified);
  assert.ok(s.sentence.includes("not the published operating point; replay attribution removed."));
  assert.ok(s.share_url && s.share_url.includes("?s="), "share_url minted");
  const token = decodeURIComponent(s.share_url.split("?s=")[1]);
  const d = engine.decodeScenario(token);
  assert.ok(d, "share token decodes fail-open-free");
  assert.equal(d._meta.persp, null, "modified state travels as an explicit modified identity");
  assert.equal(d._meta.modified.kind, "scenario");
});

test("claims — floors never intervals: hi null, fixed sentence, compatible-with relation", () => {
  for (const key of ["claims_full", "claims_b8090", "claims_b90"]) {
    const s = sc(battery[key]);
    const all = s.groups.flatMap((g) => g.claims);
    const floors = all.filter((c) => c.bound && c.bound.type === "floor");
    assert.ok(floors.length > 0, key + " has floor records in scope");
    for (const f of floors) {
      assert.equal(f.bound.hi, null, f.id + " floor hi must be null");
      assert.ok(f.bound.rendered.startsWith("≥"), f.id + " fused ≥ rendering");
      assert.ok(f.bound.rendered.includes("floor — compatible with this range and every higher one"), f.id);
      assert.ok(f.bound.rendered.includes("NOT an interval and NOT a point"), f.id);
    }
  }
  const b8090 = sc(battery.claims_b8090).groups.flatMap((g) => g.claims);
  const patel = b8090.find((c) => c.id === "patel-80-floor");
  assert.ok(patel, "patel floor relates to b8090");
  assert.equal(patel.relation_to_query, "compatible-with");
});

test("claims — company-GM never grouped with unit-serving; group titles verbatim", () => {
  const unitTitle = "Unit-serving (token-SKU) claim records compatible with this range — relation badged per record (this calculator's metric)";
  for (const [key, res] of Object.entries(battery)) {
    if (!key.startsWith("claims_")) continue;
    const s = sc(res);
    for (const g of s.groups) {
      assert.ok(appJs.includes(g.group_title), key + " group title verbatim from app.js: " + g.group_title);
      if (g.group_title === unitTitle) {
        for (const c of g.claims) {
          assert.notEqual(c.scope_layer, "company-GM", key + " company-GM record in unit group: " + c.id);
          assert.ok(!/company-GM/.test(c.metric_scope || ""), key + " company-GM metric in unit group: " + c.id);
        }
      }
    }
  }
  // Zephyr 70% company-GM specifically must sit in the company-GM group wherever it appears
  const full = sc(battery.claims_full);
  const zephyrGroup = full.groups.find((g) => g.claims.some((c) => c.id === "zephyr-70-company-gm"));
  assert.ok(zephyrGroup && /Company-GM/.test(zephyrGroup.group_title), "zephyr 70% sits under the company-GM group title");
});

test("claims — verbatim discipline: byte-exact quotes or null; reported figures never in the verbatim field", () => {
  const s = sc(battery.claims_nonbin);
  const all = [...s.groups.flatMap((g) => g.claims), ...(s.non_binnable_records || [])];
  assert.ok(all.length >= engine.MARGIN_CLAIMS.length - 1, "registry-wide result");
  for (const c of all) {
    const src = engine.MARGIN_CLAIMS.find((x) => x.id === c.id);
    assert.ok(src, c.id);
    assert.equal(c.quote.verbatim, src.verbatim ?? null, c.id + " verbatim byte-exact or null");
    if (c.quote.reported_figure) assert.equal(c.quote.verbatim, null, c.id + " reported figure never doubles as verbatim");
    assert.equal(c.provenance, engine.provenanceTierLabel(src), c.id + " provenance label verbatim");
  }
});

test("claims — non-binnable excluded from range results; separate array on request; status-fused bounds", () => {
  const ranged = sc(battery.claims_b8090);
  const ids = ranged.groups.flatMap((g) => g.claims).map((c) => c.id);
  for (const nb of ["xjdr-deployment", "ksred-usage", "jukan-no-claim", "musk-sizes", "teortaxes-4usd-ceiling"]) {
    assert.ok(!ids.includes(nb), nb + " must not render as a claimant in a margin range");
  }
  assert.ok(!ranged.non_binnable_records || ranged.non_binnable_records.length === 0, "non-binnable excluded by default");
  const withNb = sc(battery.claims_nonbin);
  assert.ok(withNb.non_binnable_records.length >= 5, "non-binnable records surface only in their own array");
  // status-fused bound rendering examples
  const all = sc(battery.claims_full).groups.flatMap((g) => g.claims);
  const zephyr = all.find((c) => c.id === "zephyr-70-company-gm");
  assert.ok(/~70% company-GM/.test(zephyr.bound.rendered), "company-GM point fuses scope into the token: " + zephyr.bound.rendered);
});

test("claims — empty bucket renders EMPTY_BUCKET_STATEMENT verbatim; negative findings on Google/xAI/Moonshot subjects", () => {
  const b6080 = sc(battery.claims_b6080);
  // 60–80 now has unit records (the ~70–75 cluster) — assert the statement appears exactly when the unit group is empty
  const unitGroup = b6080.groups.find((g) => g.group_id === "unit");
  if (!unitGroup || unitGroup.claims.length === 0) {
    assert.equal(b6080.empty_statement, engine.EMPTY_BUCKET_STATEMENT);
  }
  const xai = sc(battery.claims_xai);
  assert.equal(xai.negative_findings, engine.NEGATIVE_FINDINGS_STATEMENT, "xAI subject query carries the negative-findings statement");
});

test("explore_range — never an estimate: the number lives ONLY inside the IF-conditional string", () => {
  // b9 M1: explore_6080 is dropped from the non-empty-routes loop — on the repaired defaults
  // NO authored route computes into 60–80 (x80-v3/x80-v4 moved up into 80–90). Its emptiness
  // is asserted directly in the bucket test below.
  for (const key of ["explore_90", "explore_num", "explore_60", "explore_at"]) {
    const s = sc(battery[key]);
    assert.ok(s.routes.length >= 1, key + " routes");
    for (const r of s.routes) {
      assert.ok(r.conditional.startsWith("IF "), key + " conditional starts with IF");
      assert.ok(/≈-?\d+%/.test(r.conditional), key + " number inside the conditional");
      walkLeaves(r, (path, k, v) => {
        if (typeof v === "number") assert.ok(["rank", "rank_of", "n_changed"].includes(String(k)), key + " numeric leaf in route outside rank metadata: " + path.join("."));
      });
      assert.ok(!("margin" in r) && !("estimate" in r) && !("value" in r), key + " no margin/estimate/value key on routes");
      assert.ok(r.membership_note.includes("computed, never enforced"), key);
      assert.equal(r.order_basis, engine.EXPLORATION_ORDER_BASIS, key + " sanctioned ordering label only");
      assert.equal(typeof r.route_note, "string", key + " route note verbatim");
      assert.ok(r.share_url.includes("?s="), key + " share_url");
      assert.ok(r.what_would_have_to_be_true.length > 10, key);
    }
    assert.equal(s.selection_receipt.this_result_pct, null, key + " explore returns no result value");
    assert.ok(/not an estimate/.test(s.framing), key + " framing");
  }
  // range given as a number resolves to its computed bucket
  assert.equal(sc(battery.explore_num).bucket.id, "b8090");
});

test("explore_range — route buckets and the live central anchor move with activated pins", async () => {
  const s = sc(battery.explore_6080);
  assert.equal(battery.explore_6080.isError ?? false, false);
  // b9 M1 re-mint: on the repaired defaults x80-v3 (81.68) and x80-v4 (80.70) compute
  // INSIDE the 80–90 band they were authored for, so 60–80 is now EMPTY of routes and the
  // central anchor (≈59) falls in <60. Authored ranges are untouched — only margins moved.
  /* im-arc T4 fold (2026-08-24, declared delta): that move REVERSES. x80-v3 (77.61) and x80-v4
     (76.41) fall back into 60–80 once three rows lose their invented planning rates, so the bucket
     is populated again. The authored ranges are still untouched; only the margins moved.
     im-release-edit-r3 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
     and it reverses BACK. With the three rents adopted, both routes clear 80 again and 60–80 is
     empty, exactly as it was under b9 M1. Re-minted, not loosened — and rather than let this shrink
     to an assertion that nothing is there, the pair is asserted POSITIVELY in the band it moved to,
     so the test still names where they went instead of merely noting their absence. */
  /* im-vet-six-repairs (2026-09-20, vetting findings E1 + E2): and x80-v4 reverses ONE MORE TIME,
     to 79.54, so 60-80 holds it again and 80-90 holds x90-v1 and x80-v3. The authored ranges are
     untouched for the fourth time; only the margins moved, under two coefficient repairs made
     without regard to where any route lands. Asserted POSITIVELY on both sides so the test names
     where the route went rather than noting an absence. */
  assert.deepEqual(s.routes.map((r) => r.id), ["x80-v4"]);
  const up = sc(await h.call("explore_range", { range: "b8090" }));
  assert.deepEqual(up.routes.map((r) => r.id), ["x90-v1", "x80-v3"],
    "x80-v4 left the 80-90 bucket for 60-80; the other two stayed");
  const low = sc(battery.explore_60);
  assert.deepEqual(low.routes.map((r) => r.id), ["x60-v3"]);
  /* im-release-edit-r3 (2026-09-10, same ruling): the central anchor quotes the public-evidence
     reference reading, which moved 51.1786 -> 57.8814 when the declared fleet priced. ≈51% -> ≈58%. */
  assert.ok(low.central_anchor.includes("At the flagship scope the policy-labeled baseline scenario computes to ≈58%"));
  assert.ok(/loaded-bytes planning policy/.test(low.central_anchor), "central_anchor welds the policy clause (the fleet fully renders; the old renormalization weld is superseded)");
  assert.ok(low.sentence.includes(low.central_anchor), "central anchor remains visible even when its bucket has a route");
});

test("explore_range — at_model recompute shows drift inside a string with inside/OUTSIDE verdict", () => {
  const s = sc(battery.explore_at);
  for (const r of s.routes) {
    assert.ok(typeof r.at_model_drift === "string" && /lands at ≈\d+%/.test(r.at_model_drift), "drift line " + r.id);
    assert.ok(/(inside|OUTSIDE) the range it was authored for/.test(r.at_model_drift), r.id);
  }
});

test("get_report — verbatim archive with fail-closed unknown ids", async () => {
  const s = sc(battery.report_s7);
  assert.ok(s.content.length > 200, "section content");
  assert.ok(/reported gross margins/i.test(s.title) || /§7|s7/.test(s.id), "right section");
  assert.equal(typeof s.archive_note, "string");
  const bad = await h.call("get_report", { id: "does-not-exist" });
  assert.equal(bad.isError, true, "unknown id fails closed");
  assert.ok(text(bad).includes("report-s7"), "error lists valid ids");
  assert.ok(text(bad).includes("front-page"), "error lists valid ids incl. front-page");
});

test("get_dossier — verbatim ledger, live values composed at call time, retired ids normalize", () => {
  const dm = sc(battery.dossier_opus);
  assert.equal(dm.attribution, "calculator-synthesis");
  assert.ok(dm.params.some((p) => p.param === "active" && p.evidence_label === "SPECULATION"));
  assert.ok(dm.params.every((p) => p.live_value !== undefined && p.live_value !== null));
  assert.ok(Array.isArray(dm.assumes) && Array.isArray(dm.falsifiers));
  const dp = sc(battery.dossier_route);
  assert.ok(dp.who.includes("PAGE-AUTHORED RECONSTRUCTION"));
  const dr = sc(battery.dossier_retired);
  assert.equal(dr.id, "x90-v1", "retired id 'semi' normalizes to x90-v1");
  // IM4 slice A regression: the registry/engine identity fork is CLOSED — every dossier
  // response must state the reconciled rev-2.2 status, never the old open-fork language.
  for (const d of [dm, dp, dr]) {
    assert.ok(d.evidence_registry_status.includes("schema rev 2.2"), "status names the rev-2.2 migration");
    assert.ok(d.evidence_registry_status.includes("legacyScalar"), "status names the archived scalars");
    assert.ok(!d.evidence_registry_status.includes("not yet implemented"), "open-fork language gone");
    assert.ok(!/still encodes/.test(d.evidence_registry_status), "no 'still encodes retired scalar' claim");
  }
});

test("list_scenario_space — enum source with honest flags; metric definition verbatim from TIPS", () => {
  const s = sc(battery.list);
  assert.equal(s.models.length, engine.MODELS.length);
  const custom = s.models.find((m) => m.id === "custom");
  assert.equal(custom.unsourced_scratch, true);
  for (const id of ["terra", "luna", "gemflash"]) assert.equal(s.models.find((m) => m.id === id).tariff_scenario, true, id);
  assert.equal(s.models.filter((m) => m.unsourced_scratch).length, 1, "unsourced_scratch only on custom");
  assert.equal(s.perspectives.length, engine.PERSPECTIVES.length);
  assert.equal(s.traffic_profiles.length, engine.TRAFFIC_PROFILES.length);
  assert.equal(s.margin_buckets.length, 4);
  assert.equal(s.metric_definition.title, engine.TIPS.margin.t);
  assert.equal(s.metric_definition.body, engine.TIPS.margin.b);
  assert.ok(s.override_bounds.util && s.override_bounds.precision, "override bounds");
  assert.deepEqual(s.override_bounds.rentAbsAll, { min: 0.05, max: 50 }, "rentAbsAll override bounds");
  assert.deepEqual(s.override_bounds.rentAbsLeg, { min: 0.05, max: 50 }, "rentAbsLeg override bounds");
  assert.ok(s.reports.some((r) => r.id === "report-s7") && s.reports.some((r) => r.id === "front-page"), "report ids");
  assert.equal(s.defaults.basic_perspective, "gptpro-r3", "T3-B-L1 basic MCP default follows page-open GPT Pro mode");
  assert.deepEqual(s.sections_schema.section_keys, engine.fleetSectionsSchema().section_keys,
    "T3-B-L2 sections_schema comes from the shared builder validator");
  assert.deepEqual(s.band_schema, engine.bandSchema(), "T3-B-L3 band schema comes from the engine");
  assert.equal(s.dc_registry.length, Object.keys(engine.registryRows()).length, "T3-B-L4 every DC/programme registry id is discoverable");
  assert.deepEqual(s.regions, engine.dcRegions(), "T3-B-L5 region rows are engine-owned");
  /* im-arc T4 fold (2026-08-24) [F3]: coverage percentages are DERIVED by one resolver, never
     stored, so discovery consumes the resolver's output rather than a stored ledger row. */
  assert.deepEqual(s.coverage_ledgers.opus.rendered, engine.coverageSentenceParts(engine.coverageForPreset("opus")),
    "T3-B-L6 MCP discovery consumes preset coverage through the pure engine renderer");
  /* ROUND 4 (2026-08-25), memo :28: discovery must publish the KEY-LEVEL EVIDENCE and its
     evidenceKeys, not only the rendered percentages. A caller that can see 38/33/29 but not WHICH
     hardware keys are named-site versus programme cannot check the claim — and the derived number
     is exactly the thing that must remain checkable, since it is derived. */
  const opusRow = engine.coverageForPreset("opus");
  /* The MCP surface is snake_case throughout, so the comparison is field-by-field against the
     engine's camelCase source rather than a shape-blind deepEqual. */
  assert.deepEqual(s.coverage_ledgers.opus.evidence_keys, {
    named_site: opusRow.evidenceKeys.namedSite, programme: opusRow.evidenceKeys.programme,
    count_backed: opusRow.evidenceKeys.countBacked, physical_inventory: opusRow.evidenceKeys.physicalInventory,
  }, "T4-R4-L1 discovery publishes the preset's evidenceKeys, every set, in the surface's own casing");
  assert.deepEqual(s.coverage_ledgers.opus.evidence_keys.named_site,
    ["h100", "h200", "gb200"], "T4-R4-L1 …and they are the real named-site keys, not a placeholder");
  assert.deepEqual(s.coverage_ledgers.opus.evidence_keys.programme,
    ["tpu7", "trn2"], "T4-R4-L1 …with Rainier and the TPU commitment landing as PROGRAMME evidence");
  assert.equal(s.coverage_ledgers.opus.company, "anthropic", "T4-R4-L1 the row states the company it is keyed under");
  assert.equal(s.coverage_ledgers.opus.as_of, opusRow.asOf, "T4-R4-L1 the row carries its asOf");
  assert.deepEqual(s.coverage_ledgers.opus.notes, opusRow.notes, "T4-R4-L1 the row carries its notes verbatim");
  assert.equal(s.coverage_ledgers.opus.count_backed_is_additive, false,
    "T4-R4-L1 the count-backed share is published as NON-additive");
  assert.deepEqual(s.coverage_ledgers.grok.evidence_keys.physical_inventory,
    ["h100", "h200", "gb200", "gb300"],
    "T4-R4-L1 xAI's physical-inventory keys are published SEPARATELY from serving coverage");
  /* Non-vacuity: the rendered summary alone must not satisfy the requirement. */
  assert.ok(!("evidenceKeys" in s.coverage_ledgers.opus.rendered),
    "T4-R4-L1 the rendered summary is still the summary — evidence lives beside it, not inside it");
  /* im-arc T4 fold (2026-08-24), memo §7: the one closed schema and the quote registry are
     discoverable, and their enum lists ARE the registry's own — no MCP-local copy can drift. */
  assert.deepEqual(s.evidence_schema.basis, [...engine.DC_SCHEMA.BASIS], "T4-L1 basis enum is the registry's");
  assert.deepEqual(s.evidence_schema.observation_kind, [...engine.DC_SCHEMA.OBSERVATION_KINDS], "T4-L1 observationKind enum is the registry's");
  assert.deepEqual(s.evidence_schema.facility_class, [...engine.DC_SCHEMA.FACILITY_CLASSES], "T4-L1 facilityClass enum is the registry's");
  assert.deepEqual(s.evidence_schema.capex_scope, [...engine.DC_SCHEMA.CAPEX_SCOPES], "T4-L1 capexScope enum is the registry's");
  assert.deepEqual(s.evidence_schema.rate_class, [...engine.DC_SCHEMA.RATE_CLASSES], "T4-L1 rateClass enum is the registry's");
  assert.deepEqual(s.evidence_schema.capital_recovery, ["off", "on"], "T4-L1 capitalRecovery is a closed two-value enum");
  assert.equal(s.override_bounds.capitalRecovery.enum.join(","), "off,on", "T4-L1 the scenario bound publishes itself");
  assert.equal(s.planning_policy.policy, "low-committed", "T4-L2 the selection POLICY is published, not a contract class");
  /* im-release-edit-r2 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
     gb200, gb300 and trn3 now carry adopted PROVISIONAL planning quotes, so the unavailable set is
     empty. Both halves of the original claim are kept and are now derived rather than listed: the
     connector still NAMES whatever set has no admissible quote, and whatever is in that set still
     has to say why and offer a declared replay. The moment a row loses its rate again, this binds
     exactly as it did. And the newly-priced rows are checked for the thing that matters about
     them — the basis is `provisional`, not a disclosed tariff. */
  const unavailable = engine.HW_ORDER.filter((k) => !Number.isFinite(engine.HW[k] && engine.HW[k].rent));
  assert.deepEqual(s.planning_policy.unavailable, unavailable,
    "T4-L2 the rows with no admissible public planning quote are named");
  for (const key of unavailable) {
    assert.equal(s.rent_quotes[key].planning_default.available, false, "T4-L2 " + key + " has no planning default");
    assert.ok(String(s.rent_quotes[key].planning_default.reason).length > 40, "T4-L2 " + key + " says WHY");
    assert.ok(s.rent_quotes[key].planning_default.declared_replay, "T4-L2 " + key + " offers a DECLARED replay, never a silent fallback");
  }
  for (const key of ["gb200", "gb300", "trn3"]) {
    assert.equal(s.rent_quotes[key].planning_default.available, true, "T4-L2 " + key + " carries the adopted planning default");
    assert.equal(s.rent_quotes[key].planning_default.basis, "provisional",
      "T4-L2 " + key + " publishes the adopted rate as PROVISIONAL, never as a disclosed tariff");
  }
  assert.equal(s.rent_quotes.h100.planning_default.rate_class, "one-year-low-committed", "T4-L2 the ACTUAL deal class is published");
  assert.equal(s.rent_quotes.tpu7.capex_scope, "installed-system", "T4-L3 capexScope rides the hardware row");
  assert.equal(s.rent_quotes.tpu7.cluster_overhead, 1, "T4-L3 an installed-system scope takes overhead 1.00");
  assert.equal(s.tco_default_bands.dcLifeYears.costCorners.bottom, 20, "T4-L4 the facility-life band declares REVERSED cost corners");
});

test("im-arc T1 — absolute rent changes the result and out-of-bounds input is rejected by name", () => {
  const base = sc(battery.run_rent_abs_base);
  const changed = sc(battery.run_rent_abs_2);
  const rejected = sc(battery.run_rent_abs_oob);
  assert.notEqual(changed.selection_receipt.this_result_pct, base.selection_receipt.this_result_pct);
  assert.ok(changed.selection_receipt.changed_from_central.some(x => x.includes("rentAbsAll")), "rentAbsAll named in changed receipt");
  assert.ok(rejected.rejected_overrides.some(x => x.includes("rentAbsAll")), JSON.stringify(rejected.rejected_overrides));
  assert.equal(rejected.selection_receipt.this_result_pct, base.selection_receipt.this_result_pct, "rejection never clamps or applies");
});

test("im-arc T1 fix — rejected-only overrides use no-change prose", () => {
  /* im-arc T1 fix (Sol review 2026-08-22, finding P2-1). */
  const rejected = sc(battery.run_rent_abs_oob);
  assert.ok(!rejected.sentence.includes("differs via: ."), rejected.sentence);
  /* im-arc T4 fold (2026-08-24), memo §4: the BASELINE NOUN moves with the fleet, and that is the
     gate working. With gb200, gb300 and trn3 carrying no admissible public planning rate, the
     page's default rent-basis state renders a renderable SUBSET (4 of 7 legs), so the honest noun
     is the interim-subset one. What this test is for is unchanged and asserted above and below: a
     rejected-only override produces NO-CHANGE prose, never a "differs via:" clause. */
  assert.ok(/This IS the (policy-labeled baseline|interim renderable-subset) scenario for/.test(rejected.sentence),
    rejected.sentence);
  assert.ok(rejected.rejected_overrides.some(x => x.includes("rentAbsAll")), JSON.stringify(rejected.rejected_overrides));
  assert.ok(!JSON.stringify(rejected).includes("[object Object]"), JSON.stringify(rejected));
});

test("im-arc T1 fix — map-valued receipt changes name sorted donors and values", () => {
  /* im-arc T1 fix (Sol review 2026-08-22, finding P2-1). */
  const mapped = sc(battery.run_rent_abs_leg);
  assert.ok(mapped.selection_receipt.changed_from_central.some(x =>
    x.includes("rentAbsLeg: unset → rentAbsLeg{h100=1.25, h200=2.5}")),
    JSON.stringify(mapped.selection_receipt.changed_from_central));
  assert.ok(!JSON.stringify(mapped).includes("[object Object]"), JSON.stringify(mapped));
});

test("grep-parity — every mirrored app.js sentence exists byte-identical in site/app.js", async () => {
  const labels = await import("../dist/labels.js");
  const mirrored = labels.APPJS_MIRROR;
  assert.ok(Object.keys(mirrored).length >= 20, "mirror manifest present");
  for (const [k, phrase] of Object.entries(mirrored)) {
    assert.ok(appJs.includes(phrase), "app.js drifted from mirrored phrase " + k + ": " + phrase);
  }
  for (const [gid, meta] of Object.entries(labels.BOARD_GROUP_META)) {
    assert.ok(appJs.includes(meta.title), "BOARD_GROUP_META." + gid + " title drifted");
  }
  for (const frag of labels.MIRRORED_LOGIC_FRAGMENTS) {
    assert.ok(appJs.includes(frag), "boardGroupFor/boardFieldVal logic drifted: " + frag);
  }
  for (const [k, v] of Object.entries(labels.BOARD_FIELD_LABEL)) {
    assert.ok(appJs.includes(`${k}: "${v}"`), "BOARD_FIELD_LABEL." + k + " drifted");
  }
});

test.after(async () => { await h.close(); });
