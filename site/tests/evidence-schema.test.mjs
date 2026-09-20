// EVIDENCE-SCHEMA contract (IM2 / v2.2) — governing plan
// `orchestration/plans/im-reengineer-defaults-2026-07-16.md` §3 WS-B/WS-C, IM2 row, council P0-3.
// Run: node site/tests/evidence-schema.test.mjs
// Twin rule: the ONLY sanctioned differences between this file and its twin are the `// Run:`
// comment line and require(...) path strings; all other bytes must remain identical.
//
// Acceptance property (plan §6 / IM2): the WS-B phase-evidence schema + WS-C uncertainty contract
// ACCEPT every populated instance and REJECT structurally deficient records — missing phase, a
// total-throughput figure without a prefill/decode decomposition, an uncertainty component without a
// basis, and (explicit assertion) coverage/confidence vocabulary in any of our own label fields.
// All local; no network.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const S = require("../evidence-schema.js");
const U = require("../uncertainty-contract.js");
const ED = require("../engine-data-v22.js");
const DATA = require("./evidence-instances-v22.json");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
const clone = (x) => structuredClone(x);
const byId = (id) => clone(DATA.anchors.find((a) => a.id === id));
const errs = (rec) => S.validateAnchorRecord(rec);

// ============================ 1. ACCEPT: every populated instance ============================
const { ok, results, errorCount } = S.validateInstances(DATA.anchors);
assert(`all ${DATA.anchors.length} populated instances validate (0 errors)`, ok && errorCount === 0,
  JSON.stringify(results.filter((r) => r.errors.length).map((r) => ({ id: r.id, e: r.errors }))));
assert("instance count is 27 (all F1-F7 fit inputs plus split H20, Ascend, and GB300 live identities)",
  DATA.anchors.length === 27, String(DATA.anchors.length));

// status coverage — the schema represents every status without loss (ledger rows incl. 22-23).
// IM3 backfill added 3 RETRO score-set observations (2 Trn2 no-spec + cm384 6P2D) and 3 ANALYST_SET
// rows (tpu7/trn2/trn3) so every analyst-estimate default-fleet engine row is represented.
const byStatus = {};
for (const a of DATA.anchors) byStatus[a.status] = (byStatus[a.status] || 0) + 1;
assert("status split: 7 FITTED / 12 RETRO / 7 ANALYST_SET / 1 PROJECTION",
  byStatus.FITTED === 7 && byStatus.RETRO === 12
  && byStatus.ANALYST_SET === 7 && byStatus.PROJECTION === 1,
  JSON.stringify(byStatus));
assert("FITTED registry exactly enumerates the frozen F1-F7 inputs",
  JSON.stringify(DATA.anchors.filter(a => a.status === "FITTED").map(a => a.id).sort())
    === JSON.stringify([
      "ascend-cminfer-15ms", "ascend-cminfer-decode", "gb200-vllm-r1",
      "h20-ant-sglang", "h20-ant-sglang-pro",
      "h800-deepseek-prod-dec", "h800-deepseek-prod-pre",
    ].sort()));

// Every record separates phase (WS-B) and every eligible core-status row carries a real throughput.
let phaseOk = 0, thruOk = 0, measurements = 0;
for (const a of DATA.anchors) {
  if (S.PHASES.includes(a.phase)) phaseOk++;
  const isMeas = S.MEASUREMENT_STATUSES.includes(a.status) && a.eligibility.eligible !== false;
  if (isMeas) { measurements++; if (typeof a.throughput.value === "number" && a.throughput.unit !== S.UNKNOWN) thruOk++; }
}
assert("every record carries a valid phase (decode/prefill/total)", phaseOk === DATA.anchors.length, `${phaseOk}/${DATA.anchors.length}`);
assert("every eligible measurement row carries a numeric throughput + unit", thruOk === measurements, `${thruOk}/${measurements}`);

// The four RETRO anchor families are all present and phase-separated (decode-oriented, per cold-review #2).
const retroIds = DATA.anchors.filter((a) => a.status === "RETRO").map((a) => a.id);
for (const fam of ["gb300-mlperf-v6-interactive", "cm384-flexnpu", "tpu7-ironwood-qwen3", "trn2-neuron-llama70b"])
  assert(`RETRO family present: ${fam}`, retroIds.includes(fam));

// GB300 MLPerf: three audited scenarios, each VERIFIED with a direct primary-source url + date + verifier.
const mlperf = DATA.anchors.filter((a) => a.id.startsWith("gb300-mlperf-v6-"));
assert("GB300 MLPerf has 3 scenario records", mlperf.length === 3, String(mlperf.length));
assert("every GB300 MLPerf record is audited + verified with url/date/verifier",
  mlperf.every((a) => a.eligibility.tier === "audited" && a.verification.state === "verified"
    && a.verification.url && a.verification.retrievedDate && a.verification.verifier));

/* GPT Pro 2026-07-29 rec 8 — REWORKED 2026-09-02 after review pr-20260902T173936Z-a81123 called the
   first attempt a rationalisation, correctly. That attempt asserted only that an `inherited` row
   cannot wear the label `audited`, which was never the chokepoint: the three rows still carried
   status FITTED, eligible:true, a respectable quality tier AND engineFit.deployed:true, so they
   could influence a published result and read as sourced to any consumer without ever requesting
   `audited`. It also pinned technical debt open — `inherited.length > 0` meant the suite would FAIL
   once the provenance was repaired, which is precisely backwards.
   What replaced it: (a) two of the three rows were RECOVERED to `verified` — the source was never
   missing, the project already carried the primary @deepseek_ai post verbatim with its date, so it
   was transcribed rather than guessed; (b) the rule itself moved into validateAnchorRecord, where
   every consumer must pass it, requiring a FITTED row with non-verified provenance to carry a typed
   provenanceDebt naming what is missing and admitting it is deployed; (c) the count of such rows is
   pinned as a CEILING, so repairing debt is always allowed and adding it is not. */
{ const inherited = DATA.anchors.filter(a => (a.verification || {}).state === "inherited");
  const fittedDebt = DATA.anchors.filter(a => a.status === "FITTED" && (a.verification || {}).state !== "verified"
    && (a.verification || {}).state !== "confirmed-at-primaries");
  assert("rec 8: FITTED rows on unverified provenance are CAPPED at 1 and may only shrink (a ceiling, never a floor — repairing debt must not fail the suite)",
    fittedDebt.length <= 1, JSON.stringify(fittedDebt.map(a => a.id)));
  assert("rec 8: every such row carries a typed, actionable provenanceDebt (enforced at schema load, not just here)",
    fittedDebt.every(a => a.provenanceDebt && Array.isArray(a.provenanceDebt.missing)
      && a.provenanceDebt.missing.length > 0 && typeof a.provenanceDebt.recoveryPath === "string"
      && a.provenanceDebt.deployedOnInheritedProvenance === ((a.engineFit || {}).deployed === true)),
    JSON.stringify(fittedDebt.map(a => [a.id, !!a.provenanceDebt])));
  assert("rec 8: no inherited-provenance record holds audited tier",
    inherited.every(a => a.eligibility.tier !== "audited"),
    JSON.stringify(inherited.map(a => [a.id, a.eligibility.tier])));
  assert("rec 8: every audited-tier record carries first-party provenance (url + retrieval date + verifier)",
    DATA.anchors.filter(a => a.eligibility.tier === "audited")
      .every(a => a.verification.state === "verified" && a.verification.url && a.verification.retrievedDate && a.verification.verifier));
  /* MUTATION PROBE — the schema must REFUSE a FITTED row that drops its debt record, so this rule
     cannot be satisfied by deleting the field it depends on. */
  { const mut = clone(DATA.anchors.find(a => a.id === "gb200-vllm-r1"));
    delete mut.provenanceDebt;
    assert("rec 8 MUTATION PROBE: the schema REFUSES a FITTED unverified row with no provenanceDebt",
      S.validateAnchorRecord(mut, "probe").some(e => /provenanceDebt/.test(e))); } }

// Trn2 citation nuance preserved (the 405B table's per-request P50 102.41 vs the 100.70 aggregate).
const trn405 = DATA.anchors.find((a) => a.id === "trn2-neuron-llama405b");
assert("Trn2 405B record preserves the 102.41-vs-aggregate citation nuance",
  /102\.41/.test(trn405.verification.verbatimValue) && /cite the aggregate/i.test(trn405.notes));

// The honesty/unknown marker (plan build item 5): GB200's precision basis is "unknown" (possibly
// NVFP4), never guessed — and the record still validates.
const gb200 = DATA.anchors.find((a) => a.id === "gb200-vllm-r1");
assert("GB200 precision weights marked 'unknown' (not guessed) and record valid",
  gb200.receipt.precisionPath.weights === S.UNKNOWN && errs(gb200).length === 0);

// No coverage/confidence vocabulary anywhere across the whole instance set (our own label fields).
let vocabHits = 0;
for (const a of DATA.anchors) vocabHits += U.scanForbiddenVocabulary(a).length;
assert("no forbidden coverage/confidence vocabulary across all instances", vocabHits === 0, `${vocabHits} hit(s)`);

// ============================ 2. REJECT: structurally deficient records ============================
{ const r = byId("gb300-mlperf-v6-interactive"); delete r.phase;
  assert("REJECT: missing phase", errs(r).some((e) => /phase separation is required/.test(e))); }

{ const r = byId("gb300-mlperf-v6-interactive"); r.phase = "total"; r.phaseSplit = null;
  assert("REJECT: total throughput without a prefill/decode decomposition",
    errs(r).some((e) => /requires a phaseSplit/.test(e))); }

{ const r = byId("gb300-mlperf-v6-interactive"); r.phase = "total";
  r.phaseSplit = { prefill: { share: 0.577 }, decode: { share: 0.423 }, basis: "analyst-set", note: "illustrative split" };
  assert("ACCEPT: total throughput WITH a phaseSplit", errs(r).length === 0, JSON.stringify(errs(r))); }

{ const r = byId("h800-deepseek-prod-dec"); delete r.receipt.stackVersion;
  assert("REJECT: decomposition receipt missing a required field (#6)",
    errs(r).some((e) => /stackVersion absent/.test(e))); }

{ const r = byId("h800-deepseek-prod-dec"); r.throughput.unit = S.UNKNOWN;
  assert("REJECT: measurement throughput with no defined denominator/unit (§2)",
    errs(r).some((e) => /unit required/.test(e))); }

// Adversarial-review hardening (2026-07-27): a numeric type check is not enough.
// NaN/Infinity and non-positive rates previously certified as valid measurements.
for (const bad of [NaN, Infinity, -5, 0]) {
  const r = byId("h800-deepseek-prod-dec"); r.throughput.value = bad;
  assert(`REJECT: measurement throughput must be finite and positive (${String(bad)})`,
    errs(r).some((e) => /finite positive/.test(e)), JSON.stringify(errs(r)));
}
{ const r = byId("h800-deepseek-prod-dec"); r.throughput.denominator = S.UNKNOWN;
  assert("REJECT: measurement throughput with an unknown denominator",
    errs(r).some((e) => /denominator required/.test(e)), JSON.stringify(errs(r))); }
{ const r = byId("h800-deepseek-prod-dec"); r.eligibility.definedDenominator = false;
  assert("REJECT: eligible measurement whose eligibility receipt denies a defined denominator",
    errs(r).some((e) => /definedDenominator must be true/.test(e)), JSON.stringify(errs(r))); }

// Receipt numerics must describe a physically possible observation.
{ const r = byId("h800-deepseek-prod-dec"); r.receipt.activeParamsB = -1;
  assert("REJECT: negative active parameter count",
    errs(r).some((e) => /activeParamsB must be a finite positive/.test(e)), JSON.stringify(errs(r))); }
{ const r = byId("h800-deepseek-prod-dec"); r.receipt.activeParamsB = 700; r.receipt.totalParamsB = 671;
  assert("REJECT: total parameters smaller than active parameters",
    errs(r).some((e) => /totalParamsB must be >= .*activeParamsB/.test(e)), JSON.stringify(errs(r))); }
{ const r = byId("trn2-neuron-llama70b"); r.receipt.batch = -1;
  assert("REJECT: negative batch",
    errs(r).some((e) => /batch must be a finite positive/.test(e)), JSON.stringify(errs(r))); }
{ const r = byId("trn2-neuron-llama70b-nospec"); r.receipt.tpotMs = Infinity;
  assert("REJECT: non-finite latency",
    errs(r).some((e) => /tpotMs must be a finite positive/.test(e)), JSON.stringify(errs(r))); }

// A total-phase split is a decomposition, not merely two objects with numbers.
{ const r = byId("gb300-mlperf-v6-interactive"); r.phase = "total";
  r.phaseSplit = { prefill: { share: 0.9 }, decode: { share: 0.9 }, basis: "analyst-set", note: "invalid" };
  assert("REJECT: phase shares that do not sum to one",
    errs(r).some((e) => /shares must sum to 1/.test(e)), JSON.stringify(errs(r))); }
{ const r = byId("gb300-mlperf-v6-interactive"); r.phase = "total";
  r.phaseSplit = { prefill: { share: -0.1 }, decode: { share: 1.1 }, basis: "analyst-set", note: "invalid" };
  assert("REJECT: phase shares outside [0,1]",
    errs(r).some((e) => /share must be finite and within \[0,1\]/.test(e)), JSON.stringify(errs(r))); }

// Verification metadata is called machine-checkable; malformed URLs and dates must not pass.
{ const r = byId("gb300-mlperf-v6-interactive"); r.verification.url = "not a url";
  assert("REJECT: malformed verified primary-source URL",
    errs(r).some((e) => /valid http\(s\) URL/.test(e)), JSON.stringify(errs(r))); }
{ const r = byId("gb300-mlperf-v6-interactive"); r.verification.retrievedDate = "tomorrow";
  assert("REJECT: malformed verification retrieval date",
    errs(r).some((e) => /valid YYYY-MM-DD date/.test(e)), JSON.stringify(errs(r))); }
{ const r = byId("tpu7-ironwood-qwen3"); r.verification.urls[0].url = "javascript:alert(1)";
  assert("REJECT: malformed URL inside verification.urls",
    errs(r).some((e) => /urls\[0\]\.url must be a valid http\(s\) URL/.test(e)), JSON.stringify(errs(r))); }

{ const r = byId("h200-analyst-extrap-dec"); delete r.uncertainty.components[0].basis;
  assert("REJECT: uncertainty component with no basis (council P0-1)",
    errs(r).some((e) => /basis .* missing\/invalid/.test(e) || /MUST carry a basis/.test(e))); }

{ const r = byId("h800-deepseek-prod-dec"); r.eligibility.eligible = false; r.eligibility.exclusionReason = null;
  assert("REJECT: ineligible row with no exclusionReason (§2)",
    errs(r).some((e) => /exclusionReason/.test(e))); }

{ const r = byId("h200-analyst-extrap-dec"); r.uncertainty = null;
  assert("REJECT: ANALYST_SET row without an uncertainty object (§2 principle 2)",
    errs(r).some((e) => /must carry an uncertainty object/.test(e))); }

{ const r = byId("gb200-vllm-r1"); r.receipt.precisionPath.weights = "FP2.5";
  assert("REJECT: unknown precision value (must be a named path or 'unknown')",
    errs(r).some((e) => /not a known precision value/.test(e))); }

// EXPLICIT forbidden-vocabulary rejection (task requirement): coverage/confidence language in a label.
{ const r = byId("h800-deepseek-prod-dec"); r.notes = "widened to a 95% confidence interval over the fleet";
  const e = errs(r);
  assert("REJECT (explicit): coverage/confidence vocabulary in a label field",
    e.some((x) => /forbidden vocabulary "confidence"/.test(x))); }
{ const r = byId("h800-deepseek-prod-dec"); r.engineFit.note = "gives 95% coverage of the deployment population";
  assert("REJECT (explicit): 'coverage' in a label field", errs(r).some((x) => /forbidden vocabulary "coverage"/.test(x))); }

// Attributed verbatim quote fields are EXEMPT — a source quote that used a hedge word is attribution,
// not our claim (VOCAB_SKIP_KEYS: provenance / verbatimValue / url).
{ const r = byId("h800-deepseek-prod-dec"); r.provenance = "the vendor stated medium-low confidence in this figure";
  assert("ACCEPT: forbidden word inside an attributed 'provenance' quote (exempt)",
    !errs(r).some((x) => /forbidden vocabulary/.test(x))); }

// ============================ 3. WS-C uncertainty contract (algebra + naming) ============================
assert("exactly ten uncertainty components (council P0-1)", U.UNCERTAINTY_COMPONENTS.length === 10);
assert("the ten components are the named set",
  ["measurement", "price", "hardware-family", "model-scale", "topology-SLO", "phase", "precision", "fleet", "traffic", "billing"]
    .every((c) => U.UNCERTAINTY_COMPONENTS.includes(c)));
assert("exactly four bases (measured / analyst-set / stress-envelope / structural-assumption)",
  U.BASES.length === 4 && ["measured", "analyst-set", "stress-envelope", "structural-assumption"].every((b) => U.BASES.includes(b)));

// composeBand — linear-worst-case multiplies factors around the central value.
{ const u = U.makeUncertaintyObject({ central: { value: 100, unit: "x" },
    components: [U.makeUncertaintyComponent({ component: "phase", range: { lowMult: 0.5, highMult: 2.0 }, basis: "stress-envelope", sourceRef: "cold-review #2 (+-2x prefill)" })],
    composition: "linear-worst-case" });
  const b = U.composeBand(u);
  assert("composeBand linear-worst-case: 100 x [0.5,2.0] => [50,200]", b.low === 50 && b.high === 200 && b.derived === true, JSON.stringify(b)); }

// composeBand — two independent factors multiply at the worst-case corners.
{ const u = U.makeUncertaintyObject({ central: { value: 10, unit: "x" },
    components: [
      U.makeUncertaintyComponent({ component: "hardware-family", range: { lowMult: 0.5, highMult: 1.5 }, basis: "stress-envelope", sourceRef: "loao" }),
      U.makeUncertaintyComponent({ component: "price", range: { lowMult: 0.8, highMult: 2.0 }, basis: "analyst-set", sourceRef: "engine" }),
    ], composition: "linear-worst-case" });
  const b = U.composeBand(u);
  assert("composeBand worst-case two factors: 10 x (0.5*0.8, 1.5*2.0) => [4,30]", Math.abs(b.low - 4) < 1e-9 && Math.abs(b.high - 30) < 1e-9, JSON.stringify(b)); }

// composeBand — quadrature recovers a single component's own multiplier.
{ const u = U.makeUncertaintyObject({ central: { value: 100, unit: "x" },
    components: [U.makeUncertaintyComponent({ component: "measurement", range: { lowMult: 0.5, highMult: 2.0 }, basis: "measured", sourceRef: "src" })],
    composition: "quadrature" });
  const b = U.composeBand(u);
  assert("composeBand quadrature single factor recovers [50,200]", Math.abs(b.low - 50) < 1e-6 && Math.abs(b.high - 200) < 1e-6, JSON.stringify(b)); }

// composeBand — dominant-component picks the widest single component.
{ const u = U.makeUncertaintyObject({ central: { value: 100, unit: "x" },
    components: [
      U.makeUncertaintyComponent({ component: "precision", range: { lowMult: 0.9, highMult: 1.1 }, basis: "analyst-set", sourceRef: "s" }),
      U.makeUncertaintyComponent({ component: "hardware-family", range: { lowMult: 0.41, highMult: 1.59 }, basis: "stress-envelope", sourceRef: "loao" }),
    ], composition: "dominant-component" });
  const b = U.composeBand(u);
  assert("composeBand dominant-component: widest (0.41,1.59) => [41,159]", Math.abs(b.low - 41) < 1e-9 && Math.abs(b.high - 159) < 1e-9, JSON.stringify(b)); }

// band label follows the component bases; a stress-envelope component ⇒ "stress envelope".
assert("bandLabelFor stress-envelope => 'stress envelope'",
  U.bandLabelFor([{ basis: "stress-envelope" }]) === "stress envelope");
assert("bandLabelFor analyst-set only => 'selected span'",
  U.bandLabelFor([{ basis: "analyst-set" }, { basis: "measured" }]) === "selected span");

// The band label may NEVER be coverage/confidence language.
{ const u = U.makeUncertaintyObject({ central: { value: 1, unit: "x" },
    components: [U.makeUncertaintyComponent({ component: "price", range: { lowMult: 0.9, highMult: 1.1 }, basis: "analyst-set", sourceRef: "s" })] });
  u.band.label = "95% confidence interval";
  assert("REJECT: band label with coverage/confidence language",
    U.validateUncertaintyObject(u).some((e) => /forbidden|band\.label/.test(e))); }

// scanForbiddenVocabulary catches the abbreviation and exempts url/verbatimValue.
assert("scanForbiddenVocabulary catches standalone 'CI'",
  U.scanForbiddenVocabulary({ label: "the CI is wide" }).some((h) => h.term === "CI"));
assert("scanForbiddenVocabulary does NOT flag 'precision'/'specific' (word-boundary)",
  U.scanForbiddenVocabulary({ note: "precision path is specific to this run" }).length === 0);
assert("scanForbiddenVocabulary exempts url + verbatimValue fields",
  U.scanForbiddenVocabulary({ url: "http://x/confidence", verbatimValue: "vendor reported coverage of 90%" }).length === 0);

// ============================ 4. factories fill UNKNOWN, never guess ============================
{ const r = S.makeAnchorRecord({ id: "x", status: "FITTED", platform: "P", phase: "decode" });
  assert("makeReceipt fills every field with UNKNOWN when omitted (never guess)",
    r.receipt.model === S.UNKNOWN && r.receipt.stackVersion === S.UNKNOWN
    && r.receipt.precisionPath.weights === S.UNKNOWN && r.receipt.mtpAcceptance === S.UNKNOWN); }
{ const t = S.makeThroughput({ value: 100 });
  assert("makeThroughput defaults unit to UNKNOWN and derivation to 'measured'",
    t.unit === S.UNKNOWN && t.derivation === "measured"); }

// ============================ 5. IM2 gate fixes ============================
// A component scoped to a quantity; helper to attach a valid uncertainty object to a cloned record.
const mkUnc = (appliesTo, basis = "analyst-set") => ({
  central: { value: 100, unit: "x", label: "central" },
  components: [{ component: "price", appliesTo, range: { lowMult: 0.8, highMult: 1.5 }, basis, sourceRef: "test-ref" }],
  composition: "linear-worst-case",
  band: { low: null, high: null, unit: "x", label: basis === "stress-envelope" ? "stress envelope" : "selected span", derived: false },
});

// P0-1 (now structural): a component may not carry an appliesTo scope outside the allowed set.
assert("APPLIES_TO has the four scopes", U.APPLIES_TO.length === 4 && ["throughput", "price", "margin", "fleet-share"].every(s => U.APPLIES_TO.includes(s)));
{ const r = byId("h200-analyst-extrap-dec"); delete r.uncertainty.components[0].appliesTo;
  assert("REJECT: uncertainty component with no appliesTo scope", errs(r).some(e => /appliesTo .* not one of/.test(e))); }

// P0-1 structural: on a measured (FITTED/RETRO/PROSPECTIVE) row, a component scoped to the measured
// quantity itself (throughput) is REJECTED; a component scoped to a non-fitted leg (price) is fine.
{ const r = byId("h800-deepseek-prod-dec"); r.uncertainty = mkUnc("throughput");
  assert("REJECT: throughput-scoped uncertainty on a FITTED row (fit-residual-as-uncertainty, P0-1)",
    errs(r).some(e => /appliesTo "throughput"\) is not admissible on a FITTED row/.test(e))); }
{ const r = byId("h800-deepseek-prod-dec"); r.uncertainty = mkUnc("price");
  assert("ACCEPT: price-scoped uncertainty on a FITTED row (non-fitted leg permitted)", errs(r).length === 0, JSON.stringify(errs(r))); }

// B3 (analyst-set legs): the separate GB300 scenario row carries the live fit identity;
// the SGLang observation remains a RETRO record with no engineFit.
{ const r = byId("gb300-analyst-set-dec");
  assert("gb300 has analystSetLegs ['rent'] + uncertaintyDeferred 'IM5' and validates",
    r.engineFit.analystSetLegs.join() === "rent" && r.uncertaintyDeferred === "IM5" && errs(r).length === 0, JSON.stringify(errs(r))); }
{ const r = byId("gb300-analyst-set-dec"); r.uncertaintyDeferred = null;
  r.uncertainty.components = r.uncertainty.components.filter(c => c.appliesTo !== "price");
  assert("REJECT: analyst-set leg with neither a scoped component nor an IM5 deferral (B3, #7)",
    errs(r).some(e => /analyst-set leg "rent" needs a scoped uncertainty component/.test(e))); }
{ const r = byId("gb300-analyst-set-dec"); r.uncertaintyDeferred = null; r.uncertainty = mkUnc("price");
  assert("ACCEPT: analyst-set leg covered by a price-scoped uncertainty component instead of deferral",
    errs(r).length === 0, JSON.stringify(errs(r))); }
{ const r = byId("gb300-analyst-set-dec"); r.uncertaintyDeferred = "IM6";
  assert("REJECT: invalid deferral marker (only 'IM5')", errs(r).some(e => /uncertaintyDeferred "IM6" invalid/.test(e))); }

// P1-1: RETRO/PROSPECTIVE rows must not carry an engineFit.
{ const r = byId("gb300-mlperf-v6-interactive"); r.engineFit = { effDec: 0.13, deployed: false };
  assert("REJECT: RETRO row carrying an engineFit (never fitted, P1-1)",
    errs(r).some(e => /must not carry an engineFit/.test(e))); }

// P2: sourceRef must be non-whitespace; lowMult must be > 0; composeBand rejects an empty set.
{ const r = byId("h200-analyst-extrap-dec"); r.uncertainty.components[0].sourceRef = "   ";
  assert("REJECT: blank sourceRef", errs(r).some(e => /sourceRef missing\/blank/.test(e))); }
{ const r = byId("h200-analyst-extrap-dec"); r.uncertainty.components[0].range.lowMult = 0;
  assert("REJECT: lowMult <= 0 (multiplier floor)", errs(r).some(e => /must be > 0/.test(e))); }
{ const b = U.composeBand({ central: { value: 100, unit: "x" }, components: [], composition: "linear-worst-case" });
  assert("composeBand REJECTS an empty component set (error, not a zero-width [100,100] band)",
    b.low === null && !!b.error, JSON.stringify(b)); }

// P1-2 (hardened vocab): the six probes that slipped the original scanner now reject.
for (const probe of ["conf.", "C.I.", "stat. sig.", "std err", "err. margin", "95%-confident"]) {
  assert(`REJECT vocab probe: "${probe}"`, U.scanForbiddenVocabulary({ note: `the band is a ${probe} thing` }).length > 0, probe);
}

// P1-3 / gate deviation (b): Trn2 rows carry BOTH primary sources; TPU upgraded to strict "verified".
for (const id of ["trn2-neuron-llama70b", "trn2-neuron-llama405b"]) {
  const a = DATA.anchors.find(x => x.id === id);
  assert(`${id}: verified with 2 primary-source urls (throughput + price)`,
    a.verification.state === "verified" && Array.isArray(a.verification.urls) && a.verification.urls.length === 2
    && a.verification.urls.some(u => u.role === "throughput") && a.verification.urls.some(u => u.role === "price"));
}
{ const t70 = DATA.anchors.find(x => x.id === "trn2-neuron-llama70b");
  assert("Trn2 70B carries the full-precision verbatim throughput (144.17136914316023)",
    t70.verification.urls.some(u => /144\.17136914316023/.test(u.verbatimValue))); }
{ const tpu = DATA.anchors.find(x => x.id === "tpu7-ironwood-qwen3");
  assert("TPU v7 upgraded to 'verified' with recipe + pricing primary urls",
    tpu.verification.state === "verified" && tpu.verification.urls.length === 2
    && /tpu-recipes/.test(tpu.verification.url)); }

// ============================ 6. IM3 backfill wave (score-set + E1 eligibility + ANALYST_SET coverage) ============================
// --- new RETRO score-set observations validate and carry their full-precision values ---
const trn70ns = DATA.anchors.find(a => a.id === "trn2-neuron-llama70b-nospec");
const trn405ns = DATA.anchors.find(a => a.id === "trn2-neuron-llama405b-nospec");
const cm6p2d = DATA.anchors.find(a => a.id === "cm384-flexnpu-6p2d-decode");
assert("IM3: trn2 70B/405B no-spec baselines + cm384 6P2D decode present and valid",
  !!(trn70ns && trn405ns && cm6p2d) && errs(trn70ns).length === 0 && errs(trn405ns).length === 0 && errs(cm6p2d).length === 0,
  JSON.stringify([trn70ns && errs(trn70ns), trn405ns && errs(trn405ns), cm6p2d && errs(cm6p2d)]));
assert("IM3: trn2 no-spec baselines carry the full-precision verbatim throughputs (36.55567822866449 / 24.421011092151268)",
  trn70ns.throughput.value === 36.55567822866449 && trn405ns.throughput.value === 24.421011092151268
  && /36\.55567822866449/.test(trn70ns.verification.verbatimValue) && /24\.421011092151268/.test(trn405ns.verification.verbatimValue));
assert("IM3: cm384 6P2D decode-pool observation is 2,885.4 tok/s/decode-card, RETRO decode, engineFit null (P1-1)",
  cm6p2d.throughput.value === 2885.4 && cm6p2d.status === "RETRO" && cm6p2d.phase === "decode" && cm6p2d.engineFit === null
  && cm6p2d.throughput.derivation === "derived-from-aggregate");

// --- E1-scoring eligibility (a SEPARATE axis from §2 anchor eligibility) ---
const gb300Int = DATA.anchors.find(a => a.id === "gb300-mlperf-v6-interactive");
assert("IM3: GB300 Interactive is E1-INELIGIBLE (mandated MTP-3, acceptance unpublished) with a reason, yet still a valid §2 anchor",
  gb300Int.e1Eligible === false && !!gb300Int.e1IneligibleReason && gb300Int.eligibility.eligible === true && errs(gb300Int).length === 0);
for (const id of ["trn2-neuron-llama70b", "trn2-neuron-llama405b"]) {
  const a = DATA.anchors.find(x => x.id === id);
  assert(`IM3: Trn2 fused-spec row ${id} is E1-ineligible (draft-acceptance unknown) with a reason, still valid`,
    a.e1Eligible === false && !!a.e1IneligibleReason && errs(a).length === 0);
}
// the E1 score set: the 7 scoreable RETRO observations are e1Eligible:true; the 3 mandated/known-spec rows are false.
const e1True = DATA.anchors.filter(a => a.e1Eligible === true).map(a => a.id).sort();
const e1False = DATA.anchors.filter(a => a.e1Eligible === false).map(a => a.id).sort();
assert("IM3: exactly 3 E1-ineligible rows (gb300 Interactive + 2 Trn2 fused-spec)",
  e1False.length === 3 && e1False.join() === ["gb300-mlperf-v6-interactive", "trn2-neuron-llama405b", "trn2-neuron-llama70b"].sort().join(),
  JSON.stringify(e1False));
assert("IM3: 7 E1-eligible score-set observations explicitly marked",
  e1True.length === 7, JSON.stringify(e1True));
// REJECT: an E1-ineligible row must state a reason (validator enforces the new axis).
{ const r = byId("gb300-mlperf-v6-interactive"); r.e1IneligibleReason = null;
  assert("REJECT: e1Eligible=false with no e1IneligibleReason", errs(r).some(e => /must state an e1IneligibleReason/.test(e))); }
{ const r = S.makeAnchorRecord({ id: "x", status: "FITTED", platform: "P", phase: "decode" });
  assert("makeAnchorRecord defaults e1Eligible=true, e1IneligibleReason=null", r.e1Eligible === true && r.e1IneligibleReason === null); }

// --- ANALYST_SET coverage of every analyst-estimate default-fleet engine row (IM4 entry pre-req) ---
const analystSet = DATA.anchors.filter(a => a.status === "ANALYST_SET");
assert("review split: 7 ANALYST_SET rows cover h20 + ascend + gb300 + h200 + tpu7 + trn2 + trn3", analystSet.length === 7
  && ["h20", "ascend", "gb300", "h200", "tpu7", "trn2", "trn3"].every(k => analystSet.some(a => a.platformKey === k)),
  JSON.stringify(analystSet.map(a => a.platformKey)));
assert("IM3: every ANALYST_SET row carries a non-empty decomposed uncertainty object + a numeric central scenario, and validates",
  analystSet.every(a => a.uncertainty && typeof a.uncertainty.central.value === "number"
    && Array.isArray(a.uncertainty.components) && a.uncertainty.components.length > 0
    && errs(a).length === 0));
// IM4 slice A (council exit-gate fix 9): centrals retargeted at the LIVE registry — the
// evidence records now describe the deployed roofline identity, never the retired scalars.
assert("IM4 slice A: ANALYST_SET central values equal the live CALIBRATION etaDec",
  DATA.anchors.find(a => a.id === "h20-neutral-live-dec").uncertainty.central.value === ED.CALIBRATION.h20.etaDec
  && DATA.anchors.find(a => a.id === "ascend-neutral-live-dec").uncertainty.central.value === ED.CALIBRATION.ascend.etaDec
  && DATA.anchors.find(a => a.id === "gb300-analyst-set-dec").uncertainty.central.value === ED.CALIBRATION.gb300.etaDec
  && DATA.anchors.find(a => a.id === "tpu7-analyst-set-dec").uncertainty.central.value === ED.CALIBRATION.tpu7.etaDec
  && DATA.anchors.find(a => a.id === "trn2-analyst-set-dec").uncertainty.central.value === ED.CALIBRATION.trn2.etaDec
  && DATA.anchors.find(a => a.id === "trn3-analyst-set-dec").uncertainty.central.value === ED.CALIBRATION.trn3.etaDec
  && DATA.anchors.find(a => a.id === "h200-analyst-extrap-dec").uncertainty.central.value === ED.CALIBRATION.h200.etaDec);
assert("IM4 slice A: no ANALYST_SET central carries a retired scalar value anymore",
  ![0.130, 0.055, 0.080, 0.085].some(v =>
    analystSet.some(a => a.uncertainty.central.value === v)));
{ const h20 = DATA.anchors.find(a => a.id === "h20-neutral-live-dec").uncertainty.components[0].range;
  const ascend = DATA.anchors.find(a => a.id === "ascend-neutral-live-dec").uncertainty.components[0].range;
  assert("review: H20 and Ascend source-tier uncertainty includes adverse latency points",
    h20.lowMult === 0.622 && h20.highMult === 1.05
      && ascend.lowMult === 0.378 && ascend.highMult === 1.366,
    JSON.stringify({ h20, ascend })); }

// --- TPU7 provenance/operating-point correction: concurrency IS stated (64), no SLO ---
{ const tpu = DATA.anchors.find(a => a.id === "tpu7-ironwood-qwen3");
  assert("IM3: TPU7 receipt corrected — concurrency=64 (stated), statedBatchConcurrency=true, no-SLO; verification still 'verified' with 2 urls",
    tpu.receipt.concurrency === 64 && tpu.eligibility.statedBatchConcurrency === true
    && /no SLO/i.test(tpu.receipt.sloClass) && tpu.verification.state === "verified"
    && tpu.verification.urls.length === 2 && errs(tpu).length === 0); }

// ============================ 7. IM3 slice-2 roofline calibration extension ============================
assert("IM3 slice 2: engineFit factory/validator are exported",
  typeof S.makeEngineFit === "function" && typeof S.validateEngineFit === "function");
if (typeof S.makeEngineFit === "function" && typeof S.validateEngineFit === "function") {
  const roofFit = S.makeEngineFit({
    effDec: null, effPre: null, deployed: true, analystSetLegs: [], note: "rev-2.2 deployed shape",
    etaDec: 0.313491, etaPre: 0.17581,
    fitClass: "fitted", prefillProvenance: "universal-transfer", calibrationRef: "CALIBRATION.h800",
    legacyScalar: { effDec: 0.070, effPre: null },
    calibration: { b: 96, L: 4989, precision: "fp8", sourceObservationId: "F1 h800-prod-dec" },
    calibrationBasis: "deployed η re-parameterizes the current engine basis at F1",
  });
  assert("engineFit accepts optional deployed η + complete calibration operating point",
    roofFit.effDec === null && roofFit.etaDec === 0.313491 && roofFit.etaPre === 0.17581
    && roofFit.fitClass === "fitted" && roofFit.calibrationRef === "CALIBRATION.h800"
    && roofFit.legacyScalar.effDec === 0.070
    && roofFit.calibration.b === 96 && roofFit.calibration.L === 4989
    && roofFit.calibration.precision === "fp8" && roofFit.calibration.sourceObservationId === "F1 h800-prod-dec"
    && typeof roofFit.calibrationBasis === "string" && S.validateEngineFit(roofFit).length === 0,
    JSON.stringify(S.validateEngineFit(roofFit)));
  const legacyFit = S.makeEngineFit({ effDec: 0.07, effPre: null, deployed: false, analystSetLegs: [], note: "legacy" });
  assert("engineFit extension is optional: legacy scalar-only shape still validates on a NON-deployed record (rev 2.2 requires the discriminated identity only when deployed)",
    legacyFit.effDec === 0.07 && legacyFit.etaDec === null && legacyFit.etaPre === null
    && legacyFit.calibration === null && legacyFit.calibrationBasis === null
    && S.validateEngineFit(legacyFit).length === 0, JSON.stringify(S.validateEngineFit(legacyFit)));
  // rev 2.2: the same scalar-only shape on a DEPLOYED record now rejects on all four axes.
  { const e = S.validateEngineFit(S.makeEngineFit({ effDec: 0.07, deployed: true }));
    assert("REJECT: deployed scalar-only engineFit (rev 2.2 fork migration — needs fitClass + live η + calibrationRef + legacyScalar)",
      e.some(x => /fitClass required/.test(x)) && e.some(x => /live etaDec and\/or etaPre/.test(x))
      && e.some(x => /calibrationRef required/.test(x)) && e.some(x => /legacyScalar required/.test(x)), JSON.stringify(e)); }
  for (const etaField of ["etaDec", "etaPre"]) {
    const allOrNothingErrors = S.validateEngineFit({
      etaDec: etaField === "etaDec" ? 0.313491 : null,
      etaPre: etaField === "etaPre" ? 0.17581 : null,
      calibration: null,
      calibrationBasis: "valid deployed-eta calibration basis",
    });
    assert(`REJECT: ${etaField} with calibration absent (roofline calibration is all-or-nothing)`,
      allOrNothingErrors.some(e => /calibration required/.test(e)), JSON.stringify(allOrNothingErrors));
  }
  const malformedFit = { ...roofFit, etaDec: -1,
    calibration: { b: 96, L: 4989, precision: "fp8" }, calibrationBasis: "" };
  const fitErrors = S.validateEngineFit(malformedFit);
  assert("REJECT: malformed optional roofline calibration fields",
    fitErrors.some(e => /etaDec/.test(e)) && fitErrors.some(e => /sourceObservationId/.test(e))
    && fitErrors.some(e => /calibrationBasis/.test(e)), JSON.stringify(fitErrors));
}

// P0-1 MUST-NOT-CHANGE: retain the named negative after extending engineFit.
{ const r = byId("h800-deepseek-prod-dec"); r.uncertainty = mkUnc("throughput");
  assert("IM3 slice 2 P0-1 RETAINED: FITTED throughput-scoped uncertainty still rejected",
    errs(r).some(e => /appliesTo "throughput"\) is not admissible on a FITTED row/.test(e))); }
// P1-1 MUST-NOT-CHANGE across both forbidden statuses.
for (const status of ["RETRO", "PROSPECTIVE"]) {
  const r = byId("gb300-mlperf-v6-interactive");
  r.status = status;
  r.engineFit = { etaDec: 0.313491, deployed: false };
  assert(`IM3 slice 2 P1-1 RETAINED: ${status} row carrying engineFit rejected`,
    errs(r).some(e => new RegExp(`a ${status} row must not carry an engineFit`).test(e)));
}

// ============================ 8. IM4 slice A — evidence-identity fork migration (rev 2.2) ============================
// Council exit-gate fix 9: every deployed engineFit carries the discriminated LIVE identity,
// value-bound to the live registries; the retired v2.1 scalars are archived, never live.

const FIT_RECORDS = DATA.anchors.filter(a => a.engineFit != null);
assert("IM4 slice A: exactly 11 engineFit records, all discriminated (fitClass + calibrationRef + legacyScalar), top-level scalars null",
  FIT_RECORDS.length === 11 && FIT_RECORDS.every(a =>
    a.engineFit.fitClass != null && a.engineFit.calibrationRef != null
    && a.engineFit.legacyScalar != null
    && a.engineFit.effDec === null && a.engineFit.effPre === null), JSON.stringify(FIT_RECORDS.map(a => a.id)));
assert("IM4 slice A: every migrated record still validates", FIT_RECORDS.every(a => errs(a).length === 0),
  JSON.stringify(FIT_RECORDS.map(a => ({ id: a.id, e: errs(a) })).filter(x => x.e.length)));
assert("FITTED evidence rows attach only fitted engine identities",
  DATA.anchors.filter(a => a.status === "FITTED" && a.engineFit != null)
    .every(a => ["fitted", "fitted-inherited"].includes(a.engineFit.fitClass)),
  JSON.stringify(DATA.anchors.filter(a => a.status === "FITTED").map(a => [a.id, a.engineFit?.fitClass])));
{ const r = byId("gb300-analyst-set-dec"); r.status = "FITTED";
  assert("REJECT: an analyst-set assumed-op identity relabeled as a FITTED evidence row",
    errs(r).some(e => /FITTED evidence row must attach a fitted identity/.test(e)), JSON.stringify(errs(r))); }
{ const r = byId("h20-ant-sglang"); r.engineFit = structuredClone(byId("h20-neutral-live-dec").engineFit);
  assert("REJECT: a FITTED input observation cannot carry the separate live neutral identity",
    errs(r).some(e => /FITTED evidence row must attach a fitted identity/.test(e)), JSON.stringify(errs(r))); }
assert("every ANALYST_SET identity has null throughput and a non-measured derivation",
  DATA.anchors.filter(a => a.status === "ANALYST_SET")
    .every(a => a.throughput.value === null && a.throughput.derivation !== "measured"));
{ const r = byId("h20-neutral-live-dec"); r.throughput.derivation = "measured";
  assert("REJECT: an ANALYST_SET identity cannot claim measured derivation",
    errs(r).some(e => /ANALYST_SET row must carry null throughput and a non-measured derivation/.test(e)),
    JSON.stringify(errs(r))); }

// Value equality against the LIVE registries — the anti-fork guarantee (no duplicated op
// points; calibrationRef + these assertions bind record to registry).
{ const cls2status = { fitted: /^FITTED \(/, "fitted-inherited": /^FITTED-inherited/, "family-transfer": /^family-transfer/, "joint-fit": /^analyst-set \(joint fleet fit(?!.*PROJECTION)/, "source-informed-neutral": /^analyst-set \(source-informed neutral adjustment/, projection: /^analyst-set \(joint fleet fit — PROJECTION/,
  // b9 M1 closed-set amendment (memo §5): two typed classes added, each with its own prose anchor.
  "platform-native-aggregate-bridge": /^analyst-set \(platform-native aggregate-form bridge/, "analyst-set-assumed-op": /^analyst-set at a DECLARED assumed operating point/ };
  for (const a of FIT_RECORDS) {
    const ref = a.engineFit.calibrationRef;
    if (/^CALIBRATION\./.test(ref)) {
      const key = ref.split(".")[1]; const row = ED.CALIBRATION[key];
      assert(`IM4 slice A: ${a.id} etaDec equals live ${ref}.etaDec`, row && a.engineFit.etaDec === row.etaDec,
        JSON.stringify({ rec: a.engineFit.etaDec, live: row && row.etaDec }));
      assert(`IM4 slice A: ${a.id} fitClass "${a.engineFit.fitClass}" consistent with live etaStatus prose`,
        row && cls2status[a.engineFit.fitClass] && cls2status[a.engineFit.fitClass].test(row.etaStatus), row && row.etaStatus);
    } else if (ref === "PREFILL_CAL") {
      assert(`IM4 slice A: ${a.id} etaPre equals live PREFILL_CAL.etaPre`, a.engineFit.etaPre === ED.PREFILL_CAL.etaPre);
    }
    if (a.engineFit.etaPre != null)
      assert(`IM4 slice A: ${a.id} etaPre carries the universal prefill value`, a.engineFit.etaPre === ED.PREFILL_CAL.etaPre);
  }
}

// Typed selector inputs (memo §2.1/§2.5): prose is display-only; the typed fields are the rule.
{ for (const [k, row] of Object.entries(ED.CALIBRATION)) {
    assert(`IM4 slice A: CALIBRATION.${k} carries typed throughputEvidenceClass consistent with its etaStatus prose`,
      (row.throughputEvidenceClass === "fitted" && /^FITTED \(/.test(row.etaStatus))
      || (row.throughputEvidenceClass === "fitted-inherited" && /^FITTED-inherited/.test(row.etaStatus))
      || (row.throughputEvidenceClass === "family-transfer" && /^family-transfer/.test(row.etaStatus))
      || (row.throughputEvidenceClass === "joint-fit" && /^analyst-set \(joint fleet fit/.test(row.etaStatus) && !/PROJECTION/.test(row.etaStatus))
      || (row.throughputEvidenceClass === "source-informed-neutral" && /^analyst-set \(source-informed neutral adjustment/.test(row.etaStatus))
      // b9 M1 closed-set amendment (memo §5)
      || (row.throughputEvidenceClass === "platform-native-aggregate-bridge" && /^analyst-set \(platform-native aggregate-form bridge/.test(row.etaStatus))
      || (row.throughputEvidenceClass === "analyst-set-assumed-op" && /^analyst-set at a DECLARED assumed operating point/.test(row.etaStatus))
      || (row.throughputEvidenceClass === "projection" && /PROJECTION/.test(row.etaStatus)),
      `${k}: ${row.throughputEvidenceClass} vs ${row.etaStatus}`);
    assert(`IM4 slice A: PRICE_EVIDENCE covers CALIBRATION.${k}`,
      ED.PRICE_EVIDENCE[k] === "observed-source-named"
      || ED.PRICE_EVIDENCE[k] === "analyst-set"
      || ED.PRICE_EVIDENCE[k] === "unpriced");
  }
  // Cluster policy (memo v3 §2.1): only independent measured observations carry clusterIds.
  assert("IM4 slice A: gb300 has ZERO cluster credit (measured:null — excluded from the fit set)",
    ED.CALIBRATION.gb300.clusterId === null);
  assert("IM4 slice A: neutral, joint-fit, bridge and projection rows carry no clusterId",
    ["h20", "ascend", "tpu7", "trn2", "trn3", "rubin"].every(k => ED.CALIBRATION[k].clusterId === null));
  assert("IM4 slice A: h100/h200 share h800's cluster (inherited/family-transfer, not independent)",
    ED.CALIBRATION.h100.clusterId === ED.CALIBRATION.h800.clusterId
    && ED.CALIBRATION.h200.clusterId === ED.CALIBRATION.h800.clusterId
    && ED.CALIBRATION.h800.clusterId != null);
  assert("IM4 slice A: exactly 2 fitted independent measured clusters exist (h800 and gb200)",
    new Set(Object.values(ED.CALIBRATION).map(r => r.clusterId).filter(Boolean)).size === 2);
}

// Validator negatives for the new fields.
{ const bad = S.validateEngineFit(S.makeEngineFit({ deployed: true, fitClass: "vibes", etaDec: 0.3, calibrationRef: "CALIBRATION.h800", legacyScalar: { effDec: 0.07 } }));
  assert("REJECT: unknown fitClass value", bad.some(e => /not a known fit class/.test(e)), JSON.stringify(bad)); }
{ const bad = S.validateEngineFit(S.makeEngineFit({ deployed: true, fitClass: "fitted", etaDec: 0.3, calibrationRef: "HW.h800", legacyScalar: { effDec: 0.07 } }));
  assert("REJECT: calibrationRef outside the live registries", bad.some(e => /calibrationRef must match/.test(e)), JSON.stringify(bad)); }
{ const bad = S.validateEngineFit(S.makeEngineFit({ deployed: true, fitClass: "fitted", etaDec: 0.3, effDec: 0.07, calibrationRef: "CALIBRATION.h800", legacyScalar: { effDec: 0.07 } }));
  assert("REJECT: live top-level scalar coexisting with legacyScalar (single live identity)", bad.some(e => /single live identity/.test(e)), JSON.stringify(bad)); }
{ const bad = S.validateEngineFit(S.makeEngineFit({ deployed: true, fitClass: "fitted", etaDec: 0.3, calibrationRef: "CALIBRATION.h800", legacyScalar: { effDec: null, effPre: null } }));
  assert("REJECT: legacyScalar archiving nothing", bad.some(e => /archive at least one retired scalar/.test(e)), JSON.stringify(bad)); }
{ const ok = S.validateEngineFit(S.makeEngineFit({ deployed: true, fitClass: "joint-fit", prefillProvenance: "universal-transfer", etaDec: 0.36142, etaPre: 0.17581, calibrationRef: "CALIBRATION.tpu7", legacyScalar: { effDec: 0.130, effPre: 0.40 } }));
  assert("ACCEPT: full discriminated shape without a local calibration block (calibrationRef substitutes — rev 2.2 relaxation)", ok.length === 0, JSON.stringify(ok)); }
{ const bad = S.validateEngineFit(S.makeEngineFit({ deployed: false, etaDec: 0.3 }));
  assert("RETAINED: etaDec without calibration AND without calibrationRef still rejects (rev 2.1 all-or-nothing survives where no ref exists)",
    bad.some(e => /calibration required when roofline calibration fields are present without a calibrationRef/.test(e)), JSON.stringify(bad)); }

// ---- slice-A fix-round (review FAIL findings 1-3): evasion negatives + exact pins ----
// F1a: string "true" does not deploy.
{ const bad = S.validateEngineFit({ effDec: 0.07, deployed: "true" });
  assert("REJECT: deployed as a 'true' STRING (strict boolean required)", bad.some(e => /strict boolean/.test(e)), JSON.stringify(bad)); }
// F1b: a fitted record cannot hide behind deployed:false.
{ const bad = S.validateEngineFit(S.makeEngineFit({ deployed: false, fitClass: "fitted", etaDec: 0.3135, calibrationRef: "CALIBRATION.h800", legacyScalar: { effDec: 0.07 } }));
  assert("REJECT: non-projection fitClass with deployed:false (deployed:false is not an escape hatch)", bad.some(e => /cannot be un-deployed/.test(e)), JSON.stringify(bad)); }
{ const bad = S.validateEngineFit(S.makeEngineFit({ deployed: true, fitClass: "projection", etaDec: 0.36142, calibrationRef: "CALIBRATION.rubin", legacyScalar: { effDec: 0.13 } }));
  assert("REJECT: projection fitClass marked deployed", bad.some(e => /must not be deployed/.test(e)), JSON.stringify(bad)); }
// F1c: etaPre without prefillProvenance.
{ const bad = S.validateEngineFit(S.makeEngineFit({ deployed: true, fitClass: "joint-fit", etaDec: 0.36142, etaPre: 0.17581, calibrationRef: "CALIBRATION.tpu7", legacyScalar: { effDec: 0.13, effPre: 0.4 } }));
  assert("REJECT: etaPre without prefillProvenance (separate prefill axis)", bad.some(e => /prefillProvenance required whenever etaPre/.test(e)), JSON.stringify(bad)); }
// F1d: deployment-state + archive EXACT pins for all 11 records (data-level; a bogus
// legacyScalar or a flipped deployed flag fails here even though the shape validates).
{ const EXPECT = {
    "h800-deepseek-prod-dec":  { dep: true,  ls: { effDec: 0.070, effPre: null } },
    "h800-deepseek-prod-pre":  { dep: true,  ls: { effDec: null,  effPre: 0.15 } },
    "gb200-vllm-r1":           { dep: true,  ls: { effDec: 0.150, effPre: null } },
    "gb300-analyst-set-dec":    { dep: true,  ls: { effDec: 0.127, effPre: null } },
    "h20-neutral-live-dec":    { dep: true,  ls: { effDec: 0.170, effPre: null } },
    "ascend-neutral-live-dec": { dep: true,  ls: { effDec: 0.070, effPre: null } },
    "h200-analyst-extrap-dec": { dep: true,  ls: { effDec: 0.085, effPre: 0.36 } },
    "tpu7-analyst-set-dec":    { dep: true,  ls: { effDec: 0.130, effPre: 0.40 } },
    "trn2-analyst-set-dec":    { dep: true,  ls: { effDec: 0.055, effPre: 0.30 } },
    "trn3-analyst-set-dec":    { dep: true,  ls: { effDec: 0.080, effPre: 0.34 } },
    "rubin-projection":        { dep: false, ls: { effDec: 0.13,  effPre: 0.45 } },
  };
  for (const [id, exp] of Object.entries(EXPECT)) {
    const f = DATA.anchors.find(a => a.id === id).engineFit;
    assert(`IM4 slice A pins: ${id} deployed=${exp.dep}, legacyScalar archives the exact retired pair`,
      f.deployed === exp.dep && f.legacyScalar.effDec === exp.ls.effDec && f.legacyScalar.effPre === exp.ls.effPre,
      JSON.stringify({ dep: f.deployed, ls: f.legacyScalar }));
  }
}
// F1e (fix-verify residual): the ORIGINAL evasion — scalar-only engineFit hiding behind
// deployed:false on a FITTED record — must reject at the record level (status drives it).
{ const r = byId("h800-deepseek-prod-dec"); r.engineFit = { effDec: 0.07, effPre: null, deployed: false, analystSetLegs: [], note: "reverted" };
  assert("REJECT: FITTED record with scalar-only engineFit and deployed:false (status-derived deployment)",
    errs(r).some(e => /must be deployed:true/.test(e))); }
{ const r = byId("tpu7-analyst-set-dec"); r.engineFit.deployed = false; r.engineFit.fitClass = null;
  assert("REJECT: ANALYST_SET record un-deploying its engineFit",
    errs(r).some(e => /must be deployed:true/.test(e))); }
{ const r = byId("rubin-projection"); r.engineFit.deployed = true;
  assert("REJECT: PROJECTION record deploying its engineFit (record-level rule, full identity retained — non-vacuous per R3)",
    errs(r).some(e => /a PROJECTION record's engineFit must not be deployed/.test(e))); }
// R3 confirm-round closure: the PROJECTION relabel escape.
{ const r = byId("rubin-projection"); r.engineFit = { effDec: 0.13, effPre: null, deployed: false, note: "scalar-only relabel escape" };
  assert("REJECT: PROJECTION record with a scalar-only engineFit (fitClass required on EVERY record-attached fit)",
    errs(r).some(e => /fitClass required on every record-attached engineFit/.test(e))); }
{ const r = byId("h800-deepseek-prod-dec"); r.status = "PROJECTION"; // relabel attack on a full identity
  assert("REJECT: full fitted identity relabeled PROJECTION (class mismatch caught)",
    errs(r).some(e => /must be class "projection"/.test(e))); }
{ const duplicated = structuredClone(DATA.anchors);
  duplicated.push(structuredClone(duplicated.find(r => r.id === "h800-deepseek-prod-dec")));
  const result = S.validateInstances(duplicated);
  assert("REJECT: duplicate record ids cannot shadow an earlier evidence row",
    !result.ok && result.errorCount === 1
      && result.results.at(-1).errors.some(e => /duplicate id "h800-deepseek-prod-dec"/.test(e)),
    JSON.stringify(result.results.at(-1))); }
{ for (const malformed of [null, {}, "bad", 42, []]) {
    const result = S.validateInstances(malformed);
    assert("REJECT: whole-registry validator fails closed for " + JSON.stringify(malformed),
      !result.ok && result.errorCount === 1 && /must (?:be a non-empty array|not be empty)/.test(result.results[0].errors[0]),
      JSON.stringify(result));
  } }
// F2: calibrationRef identity binding — a same-valued key swap (tpu7→trn2 share 0.36142)
// must be caught structurally, not by value equality.
{ const r = byId("tpu7-analyst-set-dec"); r.engineFit.calibrationRef = "CALIBRATION.trn2";
  assert("REJECT: calibrationRef swapped to a same-valued sibling row (identity-bound, not value-bound)",
    errs(r).some(e => /does not name this record's own platform row/.test(e))); }
{ const r = byId("h800-deepseek-prod-pre"); r.engineFit.calibrationRef = "CALIBRATION.h800";
  assert("REJECT: prefill record referencing a CALIBRATION row instead of PREFILL_CAL",
    errs(r).some(e => /prefill record must reference PREFILL_CAL/.test(e))); }
{ for (const a of FIT_RECORDS) if (a.platformKey != null && a.phase === "decode")
    assert(`IM4 slice A binding: ${a.id} ref names its own row`, a.engineFit.calibrationRef === "CALIBRATION." + a.platformKey);
  const rub = DATA.anchors.find(a => a.id === "rubin-projection");
  assert("IM4 slice A binding: rubin (platformKey null) pinned to CALIBRATION.rubin", rub.engineFit.calibrationRef === "CALIBRATION.rubin");
  for (const a of FIT_RECORDS) if (/^CALIBRATION\./.test(a.engineFit.calibrationRef))
    assert(`IM4 slice A binding: ${a.id} ref names an EXISTING registry key`, ED.CALIBRATION[a.engineFit.calibrationRef.split(".")[1]] != null); }
// F3: typed receipt completeness — sourceRefs everywhere; price map pinned ROW BY ROW
// (the enum-membership check alone cannot catch a silent reclassification).
{ for (const [k, row] of Object.entries(ED.CALIBRATION))
    assert(`IM4 slice A: CALIBRATION.${k} carries non-empty string sourceRefs`,
      Array.isArray(row.sourceRefs) && row.sourceRefs.length > 0 && row.sourceRefs.every(x => typeof x === "string" && x.length > 0));
  /* im-vet-six-repairs (2026-09-20), vetting finding E5a: gb200 moves observed-source-named ->
     analyst-set. The rent this engine actually prices with is the provisional $4.50 its own quote
     record calls "NOT a rate that became public", and research/im-arc-t4-fold-memo.md:77 calls it
     "an analyst-set middle over a dated Jul-2026 neocloud range note". The named neocloud RANGE
     stays in the row's rentQuotes with its own provenance; what is downgraded is the ADOPTED
     value's label, which is what this map grades. No number moves. */
  const PRICE_EXPECT = { h100: "analyst-set", h200: "analyst-set", gb200: "analyst-set",
    gb300: "analyst-set", h800: "observed-source-named", h20: "observed-source-named",
    // b9 M1 (r4 defect D4): tpu7/trn2 now name published rates — Google 3-yr commit $5.40/chip-hr,
    // AWS Capacity Blocks $2.235/chip-hr. Re-derived by the harness, not hand-set here.
    tpu7: "observed-source-named", trn2: "observed-source-named", trn3: "analyst-set", ascend: "observed-source-named", rubin: "unpriced" };
  assert("IM4 slice A: PRICE_EVIDENCE matches the diagnostic-derived map EXACTLY (row by row, same keyset)",
    JSON.stringify(Object.fromEntries(Object.entries(ED.PRICE_EVIDENCE).sort())) === JSON.stringify(Object.fromEntries(Object.entries(PRICE_EXPECT).sort())),
    JSON.stringify(ED.PRICE_EVIDENCE));
  assert("IM4 slice A: PRICE_EVIDENCE keyset === CALIBRATION keyset",
    JSON.stringify(Object.keys(ED.PRICE_EVIDENCE).sort()) === JSON.stringify(Object.keys(ED.CALIBRATION).sort())); }

console.log(`\n${failures === 0 ? "ALL EVIDENCE-SCHEMA TESTS PASS" : failures + " EVIDENCE-SCHEMA FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
