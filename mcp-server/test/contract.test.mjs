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
  ["explore_90", "explore_range", { range: "b90plus" }],
  ["explore_num", "explore_range", { range: 85 }],
  ["explore_6080", "explore_range", { range: "b6080" }],
  ["explore_at", "explore_range", { range: "b90plus", at_model: "grok" }],
  ["report_s7", "get_report", { id: "report-s7" }],
  ["dossier_opus", "get_dossier", { type: "model", id: "opus" }],
  ["dossier_route", "get_dossier", { type: "perspective", id: "x90-v1" }],
  ["dossier_retired", "get_dossier", { type: "perspective", id: "semi" }],
];
for (const [key, name, args] of calls) battery[key] = await h.call(name, args);

test("tool naming — only query_margin_claims contains 'margin'; all six read-only", async () => {
  const { tools } = await h.client.listTools();
  assert.equal(tools.length, 6);
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, [
    "explore_range", "get_dossier", "get_report",
    "list_scenario_space", "query_margin_claims", "run_scenario",
  ]);
  for (const t of tools) {
    if (t.name !== "query_margin_claims") assert.ok(!/margin/i.test(t.name), t.name);
    assert.equal(t.annotations?.readOnlyHint, true, t.name + " readOnlyHint");
  }
});

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
    assert.equal(text(res), s.sentence, key + " text content mirrors sentence");
    const r = s.selection_receipt;
    assert.ok(r, key + " selection_receipt");
    assert.ok(Number.isFinite(r.central_estimate_pct), key + " central_estimate_pct");
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
    assert.ok(Number.isInteger(r.central_estimate_pct), key + " central rounded");
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

test("run_scenario — central always alongside; is_central true only on the clean central state", () => {
  const central = sc(battery.run_opus).selection_receipt;
  assert.equal(central.is_central, true);
  assert.equal(central.this_result_pct, central.central_estimate_pct);
  // custom's clean default state IS its own central-lens estimate — but of an unsourced scratch model
  const cu = sc(battery.run_custom).selection_receipt;
  assert.equal(cu.is_central, true);
  for (const key of ["run_grok_opp", "run_expl", "run_modified", "run_lens_override"]) {
    const r = sc(battery[key]).selection_receipt;
    assert.equal(r.is_central, false, key);
    assert.ok(Number.isFinite(r.central_estimate_pct), key);
    assert.ok(r.changed_from_central.length > 0, key + " changed_from_central populated");
  }
  // the sentence itself must carry the central estimate on non-central results
  assert.ok(/central estimate/i.test(sc(battery.run_grok_opp).sentence), "non-central sentence names the central estimate");
});

test("MLI-1 — replay-locked traffic overrides rejected; forged ≈72% never rendered; ≈27% stands", () => {
  const s = sc(battery.run_mli1);
  const rejected = s.rejected_overrides.join(" | ");
  assert.ok(/ioRatio \(locked by replay/.test(rejected), "ioRatio rejected");
  assert.ok(/cacheHit \(locked by replay/.test(rejected), "cacheHit rejected");
  assert.equal(s.selection_receipt.this_result_pct, 27);
  assert.equal(s.headline.epistemic_status, "replay", "identity stays the clean replay — nothing was applied");
  assert.ok(!s.sentence.includes("≈72%"), "forged value absent");
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
  assert.ok(sc(battery.run_opus).lens_span.span.includes("across 2 lenses"), "opus spans 2 lenses");
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
  for (const key of ["explore_90", "explore_num", "explore_at"]) {
    const s = sc(battery[key]);
    assert.ok(s.routes.length >= 1, key + " routes");
    for (const r of s.routes) {
      assert.ok(r.conditional.startsWith("IF "), key + " conditional starts with IF");
      assert.ok(/≈\d+%/.test(r.conditional), key + " number inside the conditional");
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

test("explore_range — b6080 is the central anchor, not an error; empty routes + statements", () => {
  const s = sc(battery.explore_6080);
  assert.equal(battery.explore_6080.isError ?? false, false);
  assert.deepEqual(s.routes, []);
  assert.ok(s.no_route_statement.includes("the central scenario itself (§5) lands here and is this range's own anchor"));
  assert.ok(s.central_anchor.includes("At the flagship scope the central scenario computes to ≈"));
  assert.ok(/≈\d+%/.test(s.central_anchor), "central anchor number inside the sentence");
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
  assert.ok(s.reports.some((r) => r.id === "report-s7") && s.reports.some((r) => r.id === "front-page"), "report ids");
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
