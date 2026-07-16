// Deterministic release tests (methodology v2, 2026-07-10).
// Run: node tests/snapshots.test.mjs — exits non-zero on any failure.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
const settings = (mid, pid) => E.applyPresetSettings(E.MODELS.find(m => m.id === mid), E.PERSPECTIVES.find(p => p.id === pid));
const marginPct = s => E.workload(s).margin * 100;

// 1. Every §10 card headline reproduces from its named dive-replay preset within 1pp.
const DIVE_TARGETS = { gpt: 94, gemini: 95.7, grok: 67, dsv4: 69, glm: 60 };
for (const [mid, target] of Object.entries(DIVE_TARGETS)) {
  const got = marginPct(settings(mid, "dive"));
  assert(`dive replay ${mid} = ${target}±1pp`, Math.abs(got - target) <= 1, `got ${got.toFixed(1)}`);
}
// Moonshot's §10 figure is OUTPUT-ONLY: the dive replay reproduces the dive's $0.75/M output cost.
{
  const wl = E.workload(settings("kimi", "dive"));
  assert("dive replay kimi cOut = $0.75±0.05/M (output-only §10 metric)", Math.abs(wl.cOut - 0.75) <= 0.05, `got ${wl.cOut.toFixed(3)}`);
  const outMargin = (1 - wl.cOut / 4.00) * 100;
  assert("kimi output-token margin ≈ 81±1.5", Math.abs(outMargin - 81) <= 1.5, `got ${outMargin.toFixed(1)}`);
}
// DeepSeek disclosure replay reproduces the disclosed 84.5% within 1pp — honestly (fresh prefill, no util double-count).
assert("dsr1 disclosure replay = 84.5±1pp", Math.abs(marginPct(settings("dsr1", "deepseek")) - 84.5) <= 1, `got ${marginPct(settings("dsr1", "deepseek")).toFixed(1)}`);

// 1b. xAI lens replays land on the dive's stated lens values (same operating point, different valuation).
assert("grok + xAI cash-marginal ≈ 92±2", Math.abs(marginPct(settings("grok", "xaicash")) - 92) <= 2, marginPct(settings("grok", "xaicash")).toFixed(1));
assert("grok + xAI opportunity-cost ≈ 27±3 (controlled at the dive workload; dive replica said ~29)", Math.abs(marginPct(settings("grok", "xaiopp")) - 27) <= 3, marginPct(settings("grok", "xaiopp")).toFixed(1));

// 2. Provider-true billing fields survive every perspective (the v1 shallow-merge bug).
// (v2.1.3: the four retired analyst ids are exercised via their numeric-identical successor
// exploration routes — teortaxes→x80-v3, zephyr→x80-v4, semi→x90-v1, skeptic→x60-v3.)
for (const pid of ["median", "x80-v3", "x80-v4", "x90-v1", "x60-v3"]) {
  assert(`grok cacheReadMult=25 under ${pid}`, settings("grok", pid).cacheReadMult === 25);
  assert(`dsv4 cacheReadMult=1 under ${pid}`, settings("dsv4", pid).cacheReadMult === 1);
}

// 3. Provider fleets: models with their own blend keep it; perspective blends fill only silent models.
assert("gpt keeps its Hopper/Blackwell fleet under median", settings("gpt", "median").blend.gb200 === 45 && !settings("gpt", "median").blend.tpu7);
assert("gemini keeps TPU fleet under median", settings("gemini", "median").blend.tpu7 === 100);
assert("opus inherits replay's H800 fleet (model silent)", settings("opus", "deepseek").blend.h800 === 100);
assert("dsv4's own blend beats replay's under 'deepseek'", settings("dsv4", "deepseek").blend.ascend === 30);

// 4. Subscription inference is invariant to the discount/batch sliders (list-price basis).
{
  const a = settings("opus", "median"); a.discount = 0; a.batchShare = 0;
  const b = settings("opus", "median"); b.discount = 40; b.batchShare = 50;
  const tokA = E.workload(a).priceMixList, tokB = E.workload(b).priceMixList;
  assert("priceMixList invariant to discount/batch sliders", Math.abs(tokA - tokB) < 1e-12, `${tokA} vs ${tokB}`);
}

// 5. Calibration anchors reproduce as the §3 table claims (37B-active R1-class reference).
{
  const ref = Object.assign(settings("dsr1", "deepseek"), { stackMult: 1, interact: "batch" });
  const t = (hw, kind) => E.tokPerS(E.HW[hw], ref, kind);
  assert("H800 decode ≈1,873 (anchor 1,850, +1%)", Math.abs(t("h800", "out") - 1873) < 20, t("h800", "out").toFixed(0));
  assert("H800 fresh prefill ≈4,013 (reconstruction 4,026)", Math.abs(t("h800", "in") - 4013) < 40, t("h800", "in").toFixed(0));
  assert("H20 decode ≈680 at neutral 17% (Ant Pro tier 675)", Math.abs(t("h20", "out") - 680) < 15, t("h20", "out").toFixed(0));
  assert("Ascend decode ≈1,422 at neutral 7% (CloudMatrix 1,943 needs stack≈1.37)", Math.abs(t("ascend", "out") - 1422) < 20, t("ascend", "out").toFixed(0));
  assert("GB200 decode ≈10,135 at 15% (verified 5.0 PF dense/GPU; anchor ~10.1k)", Math.abs(t("gb200", "out") - 10135) < 40, t("gb200", "out").toFixed(0));
  // Published-anchor reproductions the §3 table claims (reception audit: previously untested).
  {
    const fp4 = Object.assign(structuredClone(ref), { precision: "fp4" });
    assert("GB300 published anchor >12,000 at 12.7% × 1.85", E.tokPerS(E.HW.gb300, fp4, "out") > 12000, E.tokPerS(E.HW.gb300, fp4, "out").toFixed(0));
    const h20a = Object.assign(structuredClone(ref), { stackMult: 18 / 17 });
    assert("H20 published anchor ≈714 at 18%", Math.abs(E.tokPerS(E.HW.h20, h20a, "out") - 714) < 15, E.tokPerS(E.HW.h20, h20a, "out").toFixed(0));
    const asc = Object.assign(structuredClone(ref), { stackMult: 9.5 / 7 });
    assert("Ascend published anchor ≈1,943 at 9.5%", Math.abs(E.tokPerS(E.HW.ascend, asc, "out") - 1943) < 35, E.tokPerS(E.HW.ascend, asc, "out").toFixed(0));
  }
}

// 6. Cache accounting is single-counted: at 100% cache hits the input leg costs exactly cCache.
{
  const s = settings("opus", "median"); s.cacheHit = 100;
  const wl = E.workload(s);
  const expected = (wl.cOut + s.ioRatio * wl.cCache) / (s.ioRatio + 1);
  assert("cache benefit applied once (h=1 identity)", Math.abs(wl.costMix - expected) < 1e-12);
}

// 6b. Cache-write billing: revenue-side only, default-off preserves all baselines.
{
  const s0 = settings("gpt", "median");
  const s1 = settings("gpt", "median"); s1.cacheWriteShare = 100; s1.cacheWriteMult = 125;
  const w0 = E.workload(s0), w1 = E.workload(s1);
  assert("cache writes raise revenue, never cost", w1.priceMix > w0.priceMix && Math.abs(w1.costMix - w0.costMix) < 1e-12);
  assert("default write share is 0 (baselines unchanged)", s0.cacheWriteShare === 0);
}

// 6c. chart-gen billing-mix parity (2026-07-15 cold-review MAJOR, code-confirmed): the
// "Cost per 1M output tokens across hardware generations" chart used to reimplement the
// billed price mix locally in site/app.js, using serving-side cacheHit as the billable
// share and ignoring billCacheHit/cacheWriteShare/cacheWriteMult entirely. The fix routes
// both the hero (workload) and the per-generation chart (workloadOnHw) through the same
// engine.js computeMix() — so under non-default billCacheHit + cacheWriteShare, a
// single-hardware blend's hero price mix must be BIT-IDENTICAL to that hardware's
// workloadOnHw price mix. This assertion is a tautology against the fixed engine.js (both
// paths share one function) — its purpose is to lock the contract in place; the second half
// of this test (source-guard below) is what actually fails against the pre-fix code, since
// the bug lived in app.js's now-deleted local formula, not in engine.js.
{
  const m = E.MODELS.find(x => x.id === "opus"), p = E.PERSPECTIVES.find(x => x.id === "median");
  const s = E.applyPresetSettings(m, p, { mode: "native", profileId: "reference", ioRatio: 15, cacheHit: 60 });
  s.billCacheHit = 20; s.cacheWriteShare = 30; s.cacheWriteMult = 150; // non-default on both axes
  s.blend = { h200: 100 };
  const hero = E.workload(s);
  const chart = E.workloadOnHw(E.HW.h200, s);
  assert("hero.priceMix === chart(h200).priceMix under non-default billCacheHit+cacheWriteShare",
    hero.priceMix === chart.priceMix, `${hero.priceMix} vs ${chart.priceMix}`);
  assert("hero.margin === chart(h200).margin under non-default billCacheHit+cacheWriteShare",
    hero.margin === chart.margin, `${hero.margin} vs ${chart.margin}`);
  // Concrete regression fixture (matches the reproduction in the 2026-07-15 expedited run
  // report): the pre-fix chart formula computed 67.58% margin here; the correct figure is 79.80%.
  assert("chart(h200).margin matches the documented pre-fix-vs-post-fix reproduction (≈79.8%)",
    Math.abs(chart.margin * 100 - 79.80) < 0.05, (chart.margin * 100).toFixed(2));
}
// 6d. Source guard: site/app.js's renderGenChart must call the shared engine function, not
// reimplement the billing formula. This is the assertion that actually fails on the OLD
// code — the pre-fix function body contained a literal "s.priceOut +" / "cacheReadMult"
// arithmetic reimplementation and never called workloadOnHw. Reverting the app.js fix
// (restoring the local priceMix formula) makes this fail immediately, without needing a
// browser to render the SVG.
{
  const fs = require("node:fs");
  const appSrc = fs.readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
  const fnMatch = appSrc.match(/function renderGenChart\(\)\s*{[\s\S]*?\n}\n/);
  assert("renderGenChart() found in site/app.js", !!fnMatch);
  const body = fnMatch ? fnMatch[0] : "";
  assert("renderGenChart calls the shared workloadOnHw() (single source of truth)", /workloadOnHw\(/.test(body));
  assert("renderGenChart no longer reimplements cache-read billing locally", !/cacheReadMult/.test(body));
  assert("renderGenChart no longer reimplements the price-mix formula locally", !/s\.priceOut\s*\+/.test(body));
}

// 7. Dossier coverage + drift prevention: every preset has a dossier; every dossier
// param annotation refers to a key the preset actually sets (values render live, so
// they cannot drift — key mismatches are the only failure mode).
for (const m of E.MODELS) {
  const d = E.DOSSIERS.models[m.id];
  assert(`dossier exists for model ${m.id}`, !!d);
  if (!d) continue;
  // Traffic keys moved to the TRAFFIC MIX axis (v2.1.2): models whose POSITION includes a
  // traffic mix carry nativeTrafficWasExplicit and their dossiers annotate ioRatio/cacheHit,
  // whose values now render from the named profile rather than the model set.
  const legal = new Set([...Object.keys(m.set), ...(m.dive ? Object.keys(m.dive) : []),
                         ...(m.nativeTrafficWasExplicit ? ["ioRatio", "cacheHit"] : [])]);
  for (const k of Object.keys(d.params || {})) assert(`dossier(${m.id}).${k} matches a set key`, legal.has(k), k);
  for (const k of Object.keys(m.set)) assert(`model ${m.id} set.${k} is annotated in dossier`, !!(d.params && d.params[k]), k);
}
for (const p of E.PERSPECTIVES) {
  const d = E.DOSSIERS.perspectives[p.id];
  assert(`dossier exists for perspective ${p.id}`, !!d);
  if (!d) continue;
  for (const k of Object.keys(d.params || {})) assert(`dossier(persp ${p.id}).${k} matches a set key`, k in p.set, k);
  for (const k of Object.keys(p.set)) assert(`perspective ${p.id} set.${k} is annotated in dossier`, !!(d.params && d.params[k]), k);
}

// 8. v2.1.1 semantic release gates (council final-review fixtures).
{
  // 8a. Lens-range membership: no pairing-warned or non-lens perspective may contribute.
  // Pairing logic lives in the engine since v2.1.2 (the app.js duplicate was a drift surface).
  const pairingWarning = E.pairingWarning;
  for (const m of E.MODELS) {
    const compat = E.PERSPECTIVES.filter(p => p.kind === "lens" && pairingWarning(m, p) === "");
    // Structural membership assertions (magnitude is NOT the test — deeply negative endpoints
    // are honest for China tariffs under on-demand rents; the display clamps below −100%).
    const ids = new Set(compat.map(p => p.id));
    assert(`lens set for ${m.id} contains no analyst/replay entries`, compat.every(p => p.kind === "lens"));
    // v2.1.2: the xAI valuation presets are atomic REPLAYS (traffic-locked); they are excluded
    // from the lens span for every model, grok included — the span now compares only pure cost
    // lenses at byte-identical traffic (see tests/traffic-contract.test.mjs).
    assert(`xAI valuation replays excluded from lens span for ${m.id}`, !ids.has("xaicash") && !ids.has("xaiopp"));
    if (["opus", "sonnet", "haiku", "gpt", "gemini", "terra", "luna", "gemflash", "grok"].includes(m.id))
      assert(`chinacloud excluded for ${m.id}`, !ids.has("chinacloud"));
    const margins = compat.map(p => E.workload(E.applyPresetSettings(m, p)).margin).filter(isFinite);
    if (margins.length >= 2) {
      const lo = Math.min(...margins), hi = Math.max(...margins);
      assert(`lens range for ${m.id} within gross bounds: ${(lo*100).toFixed(0)}..${(hi*100).toFixed(0)}`, lo > -20 && hi < 1.0);
    }
  }
  // 8b. xAI valuation replays hold the dive operating point and land on their stated values.
  assert("xaicash/xaiopp are replays (atomic)", E.PERSPECTIVES.find(p=>p.id==="xaicash").kind === "replay" && E.PERSPECTIVES.find(p=>p.id==="xaiopp").kind === "replay");
  const cash = settings("grok", "xaicash"), opp = settings("grok", "xaiopp");
  assert("xAI lenses inherit the dive workload (3:1, 0% cache)", cash.ioRatio === 3 && cash.cacheHit === 0 && opp.ioRatio === 3 && opp.cacheHit === 0);
  assert("grok + xAI cash ≈ 92±2 at the dive workload", Math.abs(marginPct(cash) - 92) <= 2, marginPct(cash).toFixed(1));
  assert("grok + xAI opportunity ≈ 27±3 at the dive workload (controlled recompute)", Math.abs(marginPct(opp) - 27) <= 3, marginPct(opp).toFixed(1));
  // 8c. Attribution honesty: any quoted-position dossier must have zero SPECULATION-labeled params.
  const all = [["models", E.MODELS], ["perspectives", E.PERSPECTIVES]];
  for (const [section, list] of all) for (const item of list) {
    const d = E.DOSSIERS[section][item.id];
    if (!d || d.attribution !== "quoted-position") continue;
    const spec = Object.values(d.params || {}).filter(a => /SPECULATION/.test(a.label)).length;
    assert(`quoted-position ${item.id} has no SPECULATION params`, spec === 0, `${spec} speculative`);
  }
}

// 9. Preset redesign (v2.1.3 M4): exploration configs, claims registry, interval algebra, ranking.
{
  const EXPL = E.PERSPECTIVES.filter(p => p.kind === "exploration");
  assert("exactly the 4 discourse-tied exploration routes ship",
    EXPL.length === 4 && ["x60-v3", "x80-v3", "x80-v4", "x90-v1"].every(id => EXPL.some(p => p.id === id)),
    EXPL.map(p => p.id).join(","));

  // 9a. Flagship-scope margin pins (±0.1pp): Claude Opus 4.x @ explicit Reference 15:1/60%.
  const FLAGSHIP_PINS = { "x90-v1": 92.9, "x80-v3": 89.3, "x80-v4": 88.7, "x60-v3": 21.6 };
  for (const [id, pin] of Object.entries(FLAGSHIP_PINS)) {
    const got = E.explorationFlagshipMargin(E.PERSPECTIVES.find(p => p.id === id));
    assert(`exploration ${id} flagship margin = ${pin}±0.1pp`, Math.abs(got - pin) <= 0.1, got.toFixed(3));
  }
  // ...and each route's COMPUTED bucket matches the range its name declares (membership is
  // derived via explorationComputedBucket, never hand-set).
  const DECLARED = { "x90-v1": "b90plus", "x80-v3": "b8090", "x80-v4": "b8090", "x60-v3": "b60minus" };
  for (const [id, bid] of Object.entries(DECLARED))
    assert(`exploration ${id} computed bucket = ${bid}`,
      (E.explorationComputedBucket(E.PERSPECTIVES.find(p => p.id === id)) || {}).id === bid);

  // 9b. Interval algebra: buckets are half-open [lo, hi) derived from ONE representation.
  // Edge behavior at 60 / 80 / 90 (lower edge inclusive, upper edge exclusive):
  const bid = v => (E.bucketForMargin(v) || {}).id;
  assert("edge 60: 59.999 → <60", bid(59.999) === "b60minus");
  assert("edge 60: 60 → 60–80 (lower-inclusive)", bid(60) === "b6080");
  assert("edge 80: 79.999 → 60–80", bid(79.999) === "b6080");
  assert("edge 80: 80 → 80–90 (lower-inclusive)", bid(80) === "b8090");
  assert("edge 90: 89.999 → 80–90", bid(89.999) === "b8090");
  assert("edge 90: 90 → ≥90 (lower-inclusive)", bid(90) === "b90plus");
  assert("open top: 95 → ≥90", bid(95) === "b90plus");
  assert("open bottom: −94 → <60", bid(-94) === "b60minus");
  // Claim membership at the edges: a point claim ON an edge belongs to the bucket the edge
  // OPENS, never the bucket it closes; floors relate compatible-with at/above their lo only.
  const rels = id => E.claimBucketRelations(E.MARGIN_CLAIMS.find(c => c.id === id));
  assert("point-60 claim sits in 60–80 only (semianalysis-60-blend)",
    JSON.stringify(rels("semianalysis-60-blend").map(r => r.bucketId)) === JSON.stringify(["b6080"]));
  assert("point-80 claim sits in 80–90 only (teortaxes-80-inference-2025)",
    JSON.stringify(rels("teortaxes-80-inference-2025").map(r => r.bucketId)) === JSON.stringify(["b8090"]));
  assert("interval 90–95 sits in ≥90 only (zephyr-9095-unnamed)",
    JSON.stringify(rels("zephyr-9095-unnamed").map(r => r.bucketId)) === JSON.stringify(["b90plus"]));
  assert("floor >80 relates compatible-with to 80–90 AND ≥90, never as interval membership (patel-80-floor)",
    JSON.stringify(rels("patel-80-floor")) === JSON.stringify([
      { bucketId: "b8090", relation: "compatible-with" }, { bucketId: "b90plus", relation: "compatible-with" }]));
  assert("floor 90+ relates compatible-with to ≥90 only (teortaxes-90plus-floor)",
    JSON.stringify(rels("teortaxes-90plus-floor")) === JSON.stringify([{ bucketId: "b90plus", relation: "compatible-with" }]));
  // Registry-wide: membership == the computed numeric intersection for every binnable claim.
  for (const c of E.MARGIN_CLAIMS) {
    const got = E.claimBucketRelations(c);
    if (!c.binnable || !c.numeric) { assert(`claim ${c.id}: non-binnable ⇒ zero bucket relations`, got.length === 0); continue; }
    const isFloor = c.boundType === "floor" || c.numeric.hi === null || c.numeric.hi === undefined;
    const expect = E.MARGIN_BUCKETS
      .filter(b => isFloor ? b.hi > c.numeric.lo : (c.numeric.lo < b.hi && c.numeric.hi >= b.lo)).map(b => b.id);
    assert(`claim ${c.id}: bucket set == computed intersection`,
      JSON.stringify(got.map(r => r.bucketId)) === JSON.stringify(expect), JSON.stringify(got));
    assert(`claim ${c.id}: relations honest (${isFloor ? "floor ⇒ compatible-with only" : "typed relation carried"})`,
      got.every(r => r.relation === (isFloor ? "compatible-with" : c.relation)), JSON.stringify(got));
  }

  // 9c. Ranking = the computed fewest-changed-registry-fields order (stable id tie-break),
  // recomputed independently here — the displayed order may never drift from the basis.
  const central = E.PERSPECTIVES.find(p => p.id === "median").set;
  const changed = p => E.PERSPECTIVE_SPACE_KEYS.filter(k =>
    JSON.stringify(p.set[k] ?? E.DEFAULTS[k]) !== JSON.stringify(central[k] ?? E.DEFAULTS[k])).length;
  const expectedOrder = [...EXPL].sort((a, b) =>
    (changed(a) - changed(b)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).map(p => p.id);
  assert("rankExplorations == recomputed fewest-changed order",
    JSON.stringify(E.rankExplorations().map(p => p.id)) === JSON.stringify(expectedOrder),
    E.rankExplorations().map(p => p.id).join(","));
  assert("order is x90-v1(3), x60-v3(5), x80-v3(5), x80-v4(6) — stable id tie-break at 5",
    JSON.stringify(expectedOrder) === JSON.stringify(["x90-v1", "x60-v3", "x80-v3", "x80-v4"]), expectedOrder.join(","));
  assert("only sanctioned ordering label", E.EXPLORATION_ORDER_BASIS === "fewest changed registry fields from the central configuration");

  // 9d. Registry integrity: every claim record is complete and typed; binnable:false records
  // exist precisely so this suite can assert they are never returned as claimants.
  const SRC_CLASSES = ["primary-post", "quoted-secondary", "reporting", "model-generated", "disclosure-anchor", "sweep-non-finding"];
  const BOUND_TYPES = ["point", "interval", "floor", "ceiling", "conditional-range"];
  for (const c of E.MARGIN_CLAIMS) {
    assert(`claim ${c.id}: verbatim is exact-string-or-null`, typeof c.verbatim === "string" || c.verbatim === null);
    assert(`claim ${c.id}: has url`, typeof c.url === "string" && c.url.length > 0);
    assert(`claim ${c.id}: has date (or explicit null)`, typeof c.date === "string" || c.date === null);
    assert(`claim ${c.id}: valid sourceClass`, SRC_CLASSES.includes(c.sourceClass), String(c.sourceClass));
    assert(`claim ${c.id}: valid boundType`, c.binnable ? BOUND_TYPES.includes(c.boundType)
      : (c.boundType === null || BOUND_TYPES.includes(c.boundType)), String(c.boundType));
    if (c.binnable && c.numeric) assert(`claim ${c.id}: numeric.lo is a number`, typeof c.numeric.lo === "number");
    if (c.verbatim === null) assert(`claim ${c.id}: null verbatim carries reportedFigure or reason (no paraphrase posing as a quote)`, !!(c.reportedFigure || c.reason));
    if (!c.binnable) assert(`claim ${c.id}: binnable:false carries its reason`, typeof c.reason === "string" && c.reason.length > 0);
  }
  for (const b of E.MARGIN_BUCKETS) {
    const ids = E.claimsForBucket(b.id).map(x => x.claim.id);
    for (const c of E.MARGIN_CLAIMS.filter(c => !c.binnable))
      assert(`binnable:false ${c.id} never returned by claimsForBucket(${b.id})`, !ids.includes(c.id));
  }

  // 9e. Lint (P0-7): no likelihood/probability/explicitness/assumption(s)/assumed/assuming
  // language on any exploration surface — the only sanctioned basis is the fewest-changed-fields
  // label. ("assumes" as the dossier field NAME is sanctioned structure, not surface prose.)
  const FORBIDDEN = /likelihood|probabilit|explicitness|assumptions?|assumed|assuming/i;
  assert("ordering-basis label passes its own lint", !FORBIDDEN.test(E.EXPLORATION_ORDER_BASIS));
  for (const p of EXPL) {
    const surfaces = [["name", p.name], ["subtitle", p.subtitle || ""], ["note", p.note || ""],
      ["dossier", JSON.stringify(E.DOSSIERS.perspectives[p.id] || {})]];
    for (const [what, text] of surfaces)
      assert(`lint: exploration ${p.id} ${what} carries no likelihood/probability/explicitness/assumption language`,
        !FORBIDDEN.test(text), (text.match(FORBIDDEN) || [])[0]);
  }
}

// Permalink round-trip baseline (P0 fix 2026-07-15): a field the user sets TO a global-default
// value that differs from the preset's own value must survive an encode→decode→load round-trip.
// The encoder diffs against the loader's baseline (applyPresetSettings of the declared identity),
// never against global DEFAULTS — the old DEFAULTS diff omitted such fields and the link silently
// reverted them to the preset value (GPT median active 300→105: margin 77.9%→92.3%).
{
  const roundTrip = (m, p, S) => {
    const tok = E.encodeScenario(S, m.id, p.id, { mode: "native", ioRatio: S.ioRatio, cacheHit: S.cacheHit }, null);
    const diff = E.decodeScenario(tok);
    const S2 = E.applyPresetSettings(m, p, { mode: "native", profileId: null });
    for (const [k, v] of Object.entries(diff)) if (k !== "_meta") S2[k] = v;
    return S2;
  };
  const SWEEP_KEYS = Object.keys(E.DEFAULTS).filter(k =>
    typeof E.DEFAULTS[k] === "number" && k !== "ioRatio" && k !== "cacheHit"); // traffic travels as identity in _meta.traffic
  const p = E.PERSPECTIVES.find(x => x.id === "median");
  let cases = 0, preserved = 0;
  for (const m of E.MODELS) {
    for (const k of SWEEP_KEYS) {
      const S = E.applyPresetSettings(m, p, { mode: "native", profileId: null });
      if (JSON.stringify(S[k]) === JSON.stringify(E.DEFAULTS[k])) continue; // only cases where baseline ≠ global default
      S[k] = E.DEFAULTS[k];
      const S2 = roundTrip(m, p, S);
      cases++;
      if (JSON.stringify(S2[k]) === JSON.stringify(S[k])) preserved++;
      else assert(`round-trip preserves ${m.id}.${k} set to the global default`, false,
        `restored ${JSON.stringify(S2[k])}, expected ${JSON.stringify(S[k])}`);
    }
  }
  assert(`permalink round-trip: every global-default-valued field survives (${preserved}/${cases} cases)`,
    cases > 0 && preserved === cases);
  // The concrete reproduction from the 2026-07-15 Sol inspection: GPT median, active := 300B.
  const m = E.MODELS.find(x => x.id === "gpt");
  const S = E.applyPresetSettings(m, p, { mode: "native", profileId: null });
  S.active = E.DEFAULTS.active;
  const S2 = roundTrip(m, p, S);
  assert("round-trip gpt/median active=300B: margin identical",
    Math.abs(E.workload(S2).margin - E.workload(S).margin) < 1e-12,
    `${(100 * E.workload(S).margin).toFixed(3)} → ${(100 * E.workload(S2).margin).toFixed(3)}`);
}

console.log(failures === 0 ? "\nALL TESTS PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
