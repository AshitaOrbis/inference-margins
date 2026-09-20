/* Frontier Inference Margins — phase-evidence schema (IM2 + IM3 slice 2 + IM4 slice A, v2.2).
   Schema revision 2.2 (2026-07-21, IM4 slice A — council exit-gate fix 9, evidence-identity
   fork migration): a DEPLOYED engineFit must carry the discriminated live identity —
   fitClass (fitted / fitted-inherited / family-transfer / source-informed-neutral /
   joint-fit / projection), live
   etaDec/etaPre, a calibrationRef into the live registry (CALIBRATION.<hw> or PREFILL_CAL),
   and the retired v2.1 scalars archived in legacyScalar with the top-level effDec/effPre
   NULLED (single live identity — no dual authority). The operating point is NOT duplicated
   into the record: calibrationRef + the schema test's value-equality assertions bind the
   record to the live registry row, which is the anti-fork guarantee. prefillProvenance is
   separate from fitClass (universal prefill transfer ≠ decode fit; PREFILL_CAL memo §8).
   Schema revision 2.1 (2026-07-19): engineFit may carry deployed roofline η values plus a
   calibration operating point and calibration basis; legacy scalar-only engineFit records remain
   valid (non-deployed records only, as of rev 2.2). Revision 2.0 was the original WS-B/WS-C
   IM2 contract.
   Pure data-contract module: no DOM, no engine, node-importable for tests. Follows the engine.js
   idiom (plain functions; module.exports guard + browser-global fallback at the bottom).

   Governing plan: orchestration/plans/im-reengineer-defaults-2026-07-16.md — §3 WS-B ("contract
   first"), council P0-3 (contracts before D2 so D2 inherits an evidence ontology instead of
   inventing one). Source findings welded to fields below:
     - cold-review #2  -> REQUIRED phase separation (prefill / decode); undecomposed "total" excluded.
     - cold-review #6  -> the per-anchor decomposition receipt (model, precision-by-component, MTP
                          acceptance, batch/concurrency, prefill/decode allocation, TTFT/TPOT, stack).
     - D2 protocol §2  -> anchor eligibility metadata + hard-exclusion reason.
     - D2 protocol §3  -> the three-status classification (only PROSPECTIVE can validate).
     - D2 protocol §8  -> per-figure primary-source verification record (url, date, verbatim, verifier).
     - validation-ledger rows 22-23 -> ANALYST_SET / PROJECTION rows the schema represents WITHOUT
                          loss (they carry no measurement, only a stress envelope / projection).

   UNKNOWN is a first-class value (plan build item 5): an unknowable field is explicitly marked
   "unknown" — never omitted, never guessed. Validators require the field to be PRESENT; "unknown"
   is an accepted value where the field permits it. */

"use strict";

// WS-C contract: uncertainty-object validation + the forbidden-vocabulary scanner (single source of
// truth for the coverage/confidence naming rule). Guarded require so the module also works as a
// browser <script> (loaded after uncertainty-contract.js).
const UC = (typeof require !== "undefined")
  ? require("./uncertainty-contract.js")
  : (typeof window !== "undefined" ? window.IMUncertaintyContract : null);

const UNKNOWN = "unknown";

/* ---------- phase separation (WS-B / cold-review #2) ---------- */
// "total" is admissible ONLY with a phaseSplit (total-with-decomposition-required). An undecomposed
// total-throughput figure is excluded (protocol §2 hard exclusion; the Q-007 "3.5K total at low
// interactivity" correction is the precedent).
const PHASES = ["decode", "prefill", "total"];

/* ---------- status classification (protocol §3 / council P0-2) ---------- */
// FITTED       — calibrates parameters; reproduction is an identity, not evidence.
// RETRO        — retrospective pseudo-holdout: post-fit arrival, known to designers; retrospective-only.
// PROSPECTIVE  — post-freeze arrival; the ONLY status that can validate the estimator.
const CORE_STATUSES = ["FITTED", "RETRO", "PROSPECTIVE"];
// Non-anchor rows the schema must also represent (ledger rows 22-23):
// ANALYST_SET  — engine effDec/effPre are analyst estimates, no fit; carries the stress envelope.
// PROJECTION   — chart-only (Rubin); all parameters projections; ineligible for any fit.
const MEASUREMENT_STATUSES = [...CORE_STATUSES];
const STATUSES = [...CORE_STATUSES, "ANALYST_SET", "PROJECTION"];

/* ---------- eligibility tiers (protocol §2 ordering) ---------- */
// audited > vendor-published-with-methodology > vendor-marketing-with-workload; reconstruction and
// analyst-estimate sit below the eligibility bar (kept as tiers so ineligible rows are representable).
const ELIGIBILITY_TIERS = [
  "audited",
  "vendor-published-with-methodology",
  "vendor-marketing-with-workload",
  "reconstruction",
  "analyst-estimate",
];

/* ---------- how a throughput number was obtained ---------- */
// Honesty: a reconstruction (H800 fresh-prefill net of disk-cache) is not a direct measurement, and
// a figure derived from an undecomposed aggregate is weaker still.
const THROUGHPUT_DERIVATIONS = ["measured", "reconstruction", "derived-from-aggregate", "projection"];

/* ---------- precision-path components (cold-review #6 & #11) ---------- */
// "precision by component": some FP4 gain may already be absorbed in a fitted MFU, so the path must
// be pinned per component (weights / activations / kv), not as one global multiplier. "unknown" is
// the honest value where the source precision is not fully pinned (e.g. GB200 "possibly NVFP4").
const PRECISION_VALUES = ["FP4", "NVFP4", "INT4", "FP8", "INT8", "BF16", "FP16", "W8A8", "mixed", UNKNOWN];

/* ---------- discriminated fit provenance (rev 2.2; council fix 9) ---------- */
// Mirrors the informal etaStatus vocabulary in engine-data-v22.js CALIBRATION, formalized:
// fitted            — deployed fit computed from a measured observation (per-row op point).
// fitted-inherited  — inherits another row's fit verbatim (h100 ← h800).
// family-transfer   — in-family extrapolation off a fitted row (h200 ← h800/h100-class).
// platform-native-aggregate-bridge
//                   — b9 M1 CLOSED-SET AMENDMENT (tpu7). Same-platform aggregate-form
//                     efficiency diagnostics only, no cross-platform transfer: better
//                     evidence than the joint fit (which holds ZERO observations of this
//                     platform), but representation-bound and not a fitted calibration,
//                     so it ranks BELOW family-transfer. Carries no clusterId: a bridge
//                     is not a measured cluster and earns no gate-7 cluster credit.
// joint-fit         — analyst-set joint fleet fit (trn2/trn3; out-of-family tier-(c)).
// source-informed-neutral
//                   — a same-platform measurement exists, but the deployed coefficient
//                     intentionally selects a different neutral point rather than
//                     reproducing that observation (h20 / ascend). It is not a fit and
//                     earns no measured-cluster credit. Ranked below joint-fit
//                     conservatively: the direct source informs the choice, but the
//                     adjustment rule is neither identified nor validated.
// analyst-set-assumed-op
//                   — b9 M1 CLOSED-SET AMENDMENT (gb300). η assigned at a DECLARED
//                     assumed operating point whose source batch is not reconstructable;
//                     the row was previously mislabelled "fitted" against measured:null
//                     (r4 §B12-2). Ranked BELOW joint-fit: the joint fit at least rests on
//                     six observations, and where the ranking is arguable the fail-closed
//                     rule takes the worse position.
// projection        — chart-only projection row (rubin); never feeds a fit.
const FIT_CLASSES = ["fitted", "fitted-inherited", "family-transfer",
  "platform-native-aggregate-bridge", "joint-fit", "source-informed-neutral",
  "analyst-set-assumed-op", "projection"];
// Prefill provenance is a SEPARATE axis (memo §8 universal-transfer rule; no two-sided
// prefill evidence exists): "fitted" only for the F7 identity-fit source row (h800 fresh-
// prefill reconstruction); "universal-transfer" for every other row's prefill leg.
const PREFILL_PROVENANCES = ["fitted", "universal-transfer"];
const CALIBRATION_REF_RE = /^(CALIBRATION\.[a-z0-9]+|PREFILL_CAL)$/;

/* ---------- per-figure primary-source verification states (protocol §8; ledger column) ---------- */
// verified / confirmed-at-primaries = checked this pass (must carry url(s) + date + verifier);
// inherited = carried from the grounding ledger; unverified = flagged, not yet checked;
// n/a = no external figure to verify (e.g. a pure projection).
const VERIFICATION_STATES = ["verified", "confirmed-at-primaries", "inherited", "unverified", "n/a"];

/* ---------- analyst-set legs (B3 / cold-review #7) ---------- */
// engineFit.analystSetLegs lists legs of a default-fleet row that rest on an analyst-set value with
// NO observed market rate (gb300 rent is the flagged B3 case). A measured row with such legs must
// EITHER carry a matching scoped uncertainty component (appliesTo the leg's quantity) OR explicitly
// defer the band with uncertaintyDeferred = "IM5" (populating a numeric band now would be a new
// analytical claim, which IM2 must not make). Leg -> the quantity its uncertainty decorates:
const ANALYST_LEG_SCOPE = { rent: "price", price: "price" };
const UNCERTAINTY_DEFERRAL = "IM5"; // the only permitted deferral marker

/* ---------- E1-scoring eligibility (protocol §5) — a SEPARATE axis from §2 anchor eligibility ----------
   An anchor can be a valid, audited §2 measurement yet be ineligible for E1 (decode-throughput)
   SCORING when a dominant throughput determinant is unpublished — a MANDATED speculative-decode config
   with an unstated draft-acceptance rate (GB300 MLPerf-v6 Interactive's EAGLE MTP-3; the two Trn2
   fused-spec rows). Those rows stay admissible anchors (and the Trn2 spec rows remain the $-leg
   carriers), but their measured throughput cannot be cleanly predicted, so they are excluded from E1
   scoring. Represented as a top-level marker mirroring the §2 eligible/exclusionReason idiom:
   e1Eligible (default true; absent === not-marked) + e1IneligibleReason (REQUIRED when e1Eligible ===
   false). Distinct from eligibility.eligible so an E1-ineligible row is NOT wrongly demoted below the
   §2 anchor bar. The E1-eligibility ruling itself lives in the validation ledger (gb300-mlperf-v6 and
   trn2-neuron-llama rows). */

/* ================= factories ================= */
function makeThroughput(f) {
  f = f || {};
  return {
    value: f.value != null ? f.value : null,
    unit: f.unit != null ? f.unit : UNKNOWN,
    denominator: f.denominator != null ? f.denominator : UNKNOWN,
    deviceCount: f.deviceCount != null ? f.deviceCount : null,
    derivation: f.derivation != null ? f.derivation : "measured",
  };
}

// The decomposition receipt (cold-review #6). Every field is present; "unknown" where unknowable.
function makeReceipt(f) {
  f = f || {};
  const pp = f.precisionPath || {};
  return {
    model: f.model != null ? f.model : UNKNOWN,
    activeParamsB: f.activeParamsB != null ? f.activeParamsB : UNKNOWN,
    totalParamsB: f.totalParamsB != null ? f.totalParamsB : UNKNOWN,
    precisionPath: {
      weights: pp.weights != null ? pp.weights : UNKNOWN,
      activations: pp.activations != null ? pp.activations : UNKNOWN,
      kvCache: pp.kvCache != null ? pp.kvCache : UNKNOWN,
      note: pp.note != null ? pp.note : "",
    },
    mtpAcceptance: f.mtpAcceptance != null ? f.mtpAcceptance : UNKNOWN, // number | "none" | "unknown"
    batch: f.batch != null ? f.batch : UNKNOWN,
    concurrency: f.concurrency != null ? f.concurrency : UNKNOWN,
    prefillDecodeAllocation: f.prefillDecodeAllocation != null ? f.prefillDecodeAllocation : UNKNOWN,
    ttftMs: f.ttftMs != null ? f.ttftMs : UNKNOWN,
    tpotMs: f.tpotMs != null ? f.tpotMs : UNKNOWN,
    sloClass: f.sloClass != null ? f.sloClass : UNKNOWN,
    stackVersion: f.stackVersion != null ? f.stackVersion : UNKNOWN,
    topology: f.topology != null ? f.topology : UNKNOWN,
  };
}

// bq-290: PRESERVE the supplied value; do not coerce.
//
// Every control flag used to be `!!f.x`, which runs BEFORE validation and destroys
// exactly the information validation needs: after coercion you can no longer tell
// an absent flag from a malformed one from a genuine false. `!!undefined` became a
// confident `false`, and `!!"no"` became a confident `true`. A factory whose stated
// contract is "fill UNKNOWN, never guess" must not quietly decide admissibility.
//
// Absent stays undefined so validateEligibility() can reject it; a supplied value
// keeps its type so a non-boolean can be reported as malformed rather than silently
// becoming a boolean.
const ELIGIBILITY_FLAGS = [
  "public", "primarySourced", "namedModel", "namedPrecision",
  "statedBatchConcurrency", "statedSLO", "definedDenominator", "eligible",
];

function makeEligibility(f) {
  f = f || {};
  const out = {
    tier: f.tier != null ? f.tier : UNKNOWN,
    exclusionReason: f.exclusionReason != null ? f.exclusionReason : null,
  };
  for (const k of ELIGIBILITY_FLAGS) out[k] = f[k];
  return out;
}

function makeVerification(f) {
  f = f || {};
  return {
    state: f.state != null ? f.state : "unverified",
    url: f.url != null ? f.url : null,               // the primary source (single-source shorthand)
    urls: Array.isArray(f.urls) ? f.urls : [],       // multi-source: [{ url, role, verbatimValue }]
    retrievedDate: f.retrievedDate != null ? f.retrievedDate : null,
    verbatimValue: f.verbatimValue != null ? f.verbatimValue : null,
    verifier: f.verifier != null ? f.verifier : null, // who checked it
    verifierRef: f.verifierRef != null ? f.verifierRef : null, // where the check is documented
    note: f.note != null ? f.note : "",
  };
}

// engineFit retains the IM2 scalar fields and optionally carries IM3 roofline calibration data.
// calibration is all-or-nothing when present: b/L/precision/sourceObservationId identify the
// operating point whose deployed η basis is described by calibrationBasis.
function makeEngineFit(f) {
  f = f || {};
  const c = f.calibration;
  return {
    effDec: f.effDec != null ? f.effDec : null,
    effPre: f.effPre != null ? f.effPre : null,
    deployed: f.deployed != null ? !!f.deployed : false,
    analystSetLegs: Array.isArray(f.analystSetLegs) ? f.analystSetLegs : [],
    note: f.note != null ? f.note : "",
    etaDec: f.etaDec != null ? f.etaDec : null,
    etaPre: f.etaPre != null ? f.etaPre : null,
    // rev 2.2 discriminated live identity (required when deployed === true):
    fitClass: f.fitClass != null ? f.fitClass : null,
    prefillProvenance: f.prefillProvenance != null ? f.prefillProvenance : null,
    calibrationRef: f.calibrationRef != null ? f.calibrationRef : null,
    legacyScalar: f.legacyScalar != null ? {
      effDec: f.legacyScalar.effDec != null ? f.legacyScalar.effDec : null,
      effPre: f.legacyScalar.effPre != null ? f.legacyScalar.effPre : null,
    } : null,
    calibration: c != null ? {
      b: c.b != null ? c.b : null,
      L: c.L != null ? c.L : null,
      precision: c.precision != null ? c.precision : null,
      sourceObservationId: c.sourceObservationId != null ? c.sourceObservationId : null,
    } : null,
    calibrationBasis: f.calibrationBasis != null ? f.calibrationBasis : null,
  };
}

// phaseSplit is required iff phase === "total"; it decomposes the total into prefill + decode legs.
function makePhaseSplit(f) {
  f = f || {};
  return {
    prefill: f.prefill != null ? f.prefill : null, // { share?, value?, unit? }
    decode: f.decode != null ? f.decode : null,
    basis: f.basis != null ? f.basis : UNKNOWN,
    note: f.note != null ? f.note : "",
  };
}

function makeAnchorRecord(f) {
  f = f || {};
  return {
    id: f.id,
    status: f.status,
    platform: f.platform,
    platformKey: f.platformKey != null ? f.platformKey : null, // engine HW key, or null (chart-only)
    phase: f.phase,
    throughput: makeThroughput(f.throughput),
    phaseSplit: f.phaseSplit != null ? makePhaseSplit(f.phaseSplit) : null,
    receipt: makeReceipt(f.receipt),
    eligibility: makeEligibility(f.eligibility),
    verification: makeVerification(f.verification),
    engineFit: f.engineFit != null ? makeEngineFit(f.engineFit) : null,
    uncertainty: f.uncertainty != null ? f.uncertainty : null, // WS-C object, validated when present
    uncertaintyDeferred: f.uncertaintyDeferred != null ? f.uncertaintyDeferred : null, // "IM5" or null
    e1Eligible: f.e1Eligible != null ? f.e1Eligible : true,    // E1 (decode-throughput) scoring eligibility (protocol §5) — distinct from §2 anchor eligibility
    e1IneligibleReason: f.e1IneligibleReason != null ? f.e1IneligibleReason : null, // required when e1Eligible === false
    provenance: f.provenance != null ? f.provenance : "",      // verbatim ledger prose
    notes: f.notes != null ? f.notes : "",
  };
}

/* ================= validators ================= */
function isFinitePositive(v) {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

function isHttpUrl(v) {
  if (typeof v !== "string" || !v.trim()) return false;
  try {
    const u = new URL(v);
    return (u.protocol === "http:" || u.protocol === "https:") && !!u.hostname;
  } catch (_) {
    return false;
  }
}

function isIsoDate(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T00:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

function validateThroughput(t, opts, path) {
  path = path || "throughput";
  const required = !!(opts && opts.required);
  const errors = [];
  if (!t || typeof t !== "object") return required ? [path + " missing (measurement anchor)"] : [];
  if (t.derivation != null && !THROUGHPUT_DERIVATIONS.includes(t.derivation))
    errors.push(path + '.derivation "' + t.derivation + '" invalid');
  if (required) {
    if (!isFinitePositive(t.value))
      errors.push(path + ".value required as a finite positive number for a measurement anchor");
    if (!t.unit || t.unit === UNKNOWN)
      errors.push(path + ".unit required — a throughput needs a defined denominator (protocol §2)");
    if (!t.denominator || t.denominator === UNKNOWN)
      errors.push(path + ".denominator required for a measurement anchor (protocol §2)");
  }
  if (t.deviceCount != null && (!Number.isInteger(t.deviceCount) || t.deviceCount <= 0))
    errors.push(path + ".deviceCount must be a finite positive integer when present");
  return errors;
}

function validateReceipt(r, path) {
  path = path || "receipt";
  if (!r || typeof r !== "object")
    return [path + " missing — every anchor needs a decomposition receipt (cold-review #6)"];
  const errors = [];
  const REQ = ["model", "activeParamsB", "totalParamsB", "precisionPath", "mtpAcceptance", "batch",
    "concurrency", "prefillDecodeAllocation", "ttftMs", "tpotMs", "sloClass", "stackVersion", "topology"];
  for (const k of REQ)
    if (r[k] === undefined)
      errors.push(path + "." + k + ' absent — must be present (mark "' + UNKNOWN + '" if unknowable, never omit) (#6)');
  for (const k of ["activeParamsB", "totalParamsB", "batch", "concurrency", "ttftMs", "tpotMs"]) {
    const v = r[k];
    if (v !== undefined && v !== UNKNOWN && !isFinitePositive(v))
      errors.push(path + "." + k + ' must be a finite positive number or "' + UNKNOWN + '"');
  }
  if (isFinitePositive(r.activeParamsB) && isFinitePositive(r.totalParamsB)
      && r.totalParamsB < r.activeParamsB)
    errors.push(path + ".totalParamsB must be >= " + path + ".activeParamsB");
  if (!r.precisionPath || typeof r.precisionPath !== "object") {
    errors.push(path + ".precisionPath must be an object");
  } else {
    for (const k of ["weights", "activations", "kvCache"]) {
      if (r.precisionPath[k] === undefined) errors.push(path + ".precisionPath." + k + " absent");
      else if (!PRECISION_VALUES.includes(r.precisionPath[k]))
        errors.push(path + ".precisionPath." + k + ' "' + r.precisionPath[k] + '" not a known precision value');
    }
  }
  return errors;
}

function validateEligibility(e, path) {
  path = path || "eligibility";
  if (!e || typeof e !== "object") return [path + " missing (protocol §2)"];
  const errors = [];
  if (!ELIGIBILITY_TIERS.includes(e.tier)) errors.push(path + '.tier "' + e.tier + '" not a known tier');
  // bq-290: `eligible` was never checked for presence or type — only `=== false`
  // was tested, so an ABSENT or MALFORMED flag fell straight through and the row
  // was then read as admissible by the codebase's own `eligible !== false` idiom.
  // Admissibility must be stated, not inferred from the absence of a denial.
  if (typeof e.eligible !== "boolean")
    errors.push(path + ".eligible must be present and a strict boolean (absent/malformed is NOT eligible — protocol §2)");
  for (const k of ELIGIBILITY_FLAGS) {
    if (k === "eligible") continue;
    if (e[k] !== undefined && typeof e[k] !== "boolean")
      errors.push(path + "." + k + ' "' + e[k] + '" must be a strict boolean when present');
  }
  if (e.eligible === false && !e.exclusionReason)
    errors.push(path + ": an ineligible row must state an exclusionReason (protocol §2 hard exclusions)");
  return errors;
}

function validateVerification(v, path) {
  path = path || "verification";
  if (!v || typeof v !== "object") return [path + " missing (protocol §8)"];
  const errors = [];
  if (!VERIFICATION_STATES.includes(v.state)) errors.push(path + '.state "' + v.state + '" invalid');
  const hasUrl = !!v.url || (Array.isArray(v.urls) && v.urls.length > 0);
  // "verified" is the strongest, machine-checkable state: at least one direct primary-source url
  // (single `url` or one in `urls`) is mandatory, plus a retrieval date + verifier.
  if (v.state === "verified") {
    if (!hasUrl) errors.push(path + ': state "verified" requires a direct primary-source url (url or urls[])');
    if (!v.retrievedDate) errors.push(path + ': state "verified" requires a retrievedDate');
    if (!v.verifier) errors.push(path + ': state "verified" requires a verifier');
    if (typeof v.verbatimValue !== "string" || !v.verbatimValue.trim())
      errors.push(path + ': state "verified" requires a non-blank verbatimValue');
  }
  // "confirmed-at-primaries" (e.g. the council empiricist checked the source): a verifier + date and
  // EITHER a primary url OR a verifierRef documenting the check are required.
  if (v.state === "confirmed-at-primaries") {
    if (!v.retrievedDate) errors.push(path + ': state "confirmed-at-primaries" requires a retrievedDate');
    if (!v.verifier) errors.push(path + ': state "confirmed-at-primaries" requires a verifier');
    if (!hasUrl && !v.verifierRef)
      errors.push(path + ': state "confirmed-at-primaries" requires a primary-source url OR a verifierRef documenting the check');
  }
  if (v.url != null && !isHttpUrl(v.url))
    errors.push(path + ".url must be a valid http(s) URL");
  if (v.retrievedDate != null && !isIsoDate(v.retrievedDate))
    errors.push(path + ".retrievedDate must be a valid YYYY-MM-DD date");
  if (v.verifier != null && (typeof v.verifier !== "string" || !v.verifier.trim()))
    errors.push(path + ".verifier must be non-blank when present");
  if (v.verifierRef != null && (typeof v.verifierRef !== "string" || !v.verifierRef.trim()))
    errors.push(path + ".verifierRef must be non-blank when present");
  // Each urls[] entry must carry a url.
  if (Array.isArray(v.urls)) v.urls.forEach((u, i) => {
    if (!u || !u.url) errors.push(path + ".urls[" + i + "] missing url");
    else if (!isHttpUrl(u.url)) errors.push(path + ".urls[" + i + "].url must be a valid http(s) URL");
  });
  return errors;
}

function validateEngineFit(f, path) {
  path = path || "engineFit";
  if (!f || typeof f !== "object") return [path + " missing"];
  const errors = [];
  for (const field of ["etaDec", "etaPre"]) {
    if (f[field] != null && (typeof f[field] !== "number" || !isFinite(f[field]) || f[field] <= 0))
      errors.push(path + "." + field + " must be a finite positive number when present");
  }
  // rev 2.2 discriminated-provenance fields
  if (f.deployed !== undefined && typeof f.deployed !== "boolean")
    errors.push(path + '.deployed must be a strict boolean (got ' + typeof f.deployed + ') — "true" strings do not deploy (slice-A fix-round)');
  if (f.fitClass != null && !FIT_CLASSES.includes(f.fitClass))
    errors.push(path + '.fitClass "' + f.fitClass + '" not a known fit class');
  // fitClass ⇔ deployment-state consistency (slice-A fix-round: deployed:false is not an
  // escape hatch — a non-projection fit class IS a deployed identity, and vice versa).
  if (f.fitClass != null && f.fitClass !== "projection" && f.deployed !== true)
    errors.push(path + ': fitClass "' + f.fitClass + '" requires deployed === true (a live fit identity cannot be un-deployed)');
  if (f.fitClass === "projection" && f.deployed === true)
    errors.push(path + ': fitClass "projection" must not be deployed (chart-only row)');
  if (f.prefillProvenance != null && !PREFILL_PROVENANCES.includes(f.prefillProvenance))
    errors.push(path + '.prefillProvenance "' + f.prefillProvenance + '" invalid');
  if (f.etaPre != null && f.prefillProvenance == null)
    errors.push(path + ".prefillProvenance required whenever etaPre is present (prefill provenance is a separate axis — memo §8)");
  if (f.calibrationRef != null && (typeof f.calibrationRef !== "string" || !CALIBRATION_REF_RE.test(f.calibrationRef)))
    errors.push(path + '.calibrationRef must match CALIBRATION.<hw> or PREFILL_CAL');
  if (f.legacyScalar != null) {
    const ls = f.legacyScalar;
    if (typeof ls !== "object") errors.push(path + ".legacyScalar must be an object");
    else {
      for (const field of ["effDec", "effPre"]) {
        if (ls[field] != null && (typeof ls[field] !== "number" || !isFinite(ls[field]) || ls[field] <= 0))
          errors.push(path + ".legacyScalar." + field + " must be a finite positive number or null");
      }
      if (ls.effDec == null && ls.effPre == null)
        errors.push(path + ".legacyScalar must archive at least one retired scalar");
    }
    // single live identity: archived scalars and live top-level scalars cannot coexist
    if (f.effDec != null || f.effPre != null)
      errors.push(path + ": top-level effDec/effPre must be null when legacyScalar archives them (single live identity, rev 2.2)");
  }
  // rev 2.2: a DEPLOYED fit must carry the full discriminated live identity.
  if (f.deployed === true) {
    if (f.fitClass == null)
      errors.push(path + ".fitClass required on a deployed engineFit (rev 2.2 discriminated provenance)");
    if (f.etaDec == null && f.etaPre == null)
      errors.push(path + ": a deployed engineFit must carry live etaDec and/or etaPre (rev 2.2 — retired scalars are not a live identity)");
    if (f.calibrationRef == null)
      errors.push(path + ".calibrationRef required on a deployed engineFit (binds the record to the live registry row)");
    if (f.legacyScalar == null)
      errors.push(path + ".legacyScalar required on a deployed engineFit (the retired v2.1 scalars are archived, not deleted)");
  }
  const hasRoofline = f.etaDec != null || f.etaPre != null || f.calibration != null || f.calibrationBasis != null;
  if (f.calibration != null) {
    if (!f.calibration || typeof f.calibration !== "object") errors.push(path + ".calibration must be an object");
    else {
      for (const field of ["b", "L"]) {
        const v = f.calibration[field];
        if (typeof v !== "number" || !isFinite(v) || v <= 0)
          errors.push(path + ".calibration." + field + " must be a finite positive number");
      }
      if (typeof f.calibration.precision !== "string" || !f.calibration.precision.trim())
        errors.push(path + ".calibration.precision required");
      if (typeof f.calibration.sourceObservationId !== "string" || !f.calibration.sourceObservationId.trim())
        errors.push(path + ".calibration.sourceObservationId required");
    }
  } else if (hasRoofline && f.calibrationRef == null) {
    // rev 2.2 relaxation: a calibrationRef into the live registry substitutes for a local
    // operating point (the registry row carries it; duplication would recreate the fork).
    errors.push(path + ".calibration required when roofline calibration fields are present without a calibrationRef");
  }
  if (f.calibration != null && (typeof f.calibrationBasis !== "string" || !f.calibrationBasis.trim()))
    errors.push(path + ".calibrationBasis required when a local calibration operating point is present");
  return errors;
}

function validatePhaseSplit(s, path) {
  path = path || "phaseSplit";
  if (!s || typeof s !== "object") return [path + " missing"];
  const errors = [];
  const shares = [];
  for (const k of ["prefill", "decode"]) {
    if (!s[k] || typeof s[k] !== "object")
      errors.push(path + "." + k + " required (a prefill AND a decode leg)");
    else {
      const hasShare = s[k].share != null;
      const hasValue = s[k].value != null;
      if (!hasShare && !hasValue)
        errors.push(path + "." + k + " needs a numeric share or value");
      if (hasShare) {
        if (typeof s[k].share !== "number" || !Number.isFinite(s[k].share)
            || s[k].share < 0 || s[k].share > 1)
          errors.push(path + "." + k + ".share must be finite and within [0,1]");
        else shares.push(s[k].share);
      }
      if (hasValue && !isFinitePositive(s[k].value))
        errors.push(path + "." + k + ".value must be a finite positive number");
    }
  }
  if (shares.length === 2 && Math.abs(shares[0] + shares[1] - 1) > 1e-9)
    errors.push(path + " shares must sum to 1");
  return errors;
}

function validateAnchorRecord(rec, path) {
  path = path || (rec && rec.id ? "anchor(" + rec.id + ")" : "anchor");
  if (!rec || typeof rec !== "object") return [path + " missing"];
  const errors = [];
  if (!rec.id) errors.push(path + ".id required");
  if (!STATUSES.includes(rec.status)) errors.push(path + '.status "' + rec.status + '" not one of ' + STATUSES.join("/"));
  if (!rec.platform) errors.push(path + ".platform required");

  // Phase separation is REQUIRED (WS-B / #2).
  if (!PHASES.includes(rec.phase))
    errors.push(path + '.phase "' + rec.phase + '" missing/invalid — phase separation is required (WS-B, cold-review #2)');
  // total-with-decomposition-required.
  if (rec.phase === "total") {
    if (!rec.phaseSplit)
      errors.push(path + ': phase "total" requires a phaseSplit (prefill+decode) — an undecomposed total is excluded (#2; protocol §2 Q-007 precedent)');
    else errors.push(...validatePhaseSplit(rec.phaseSplit, path + ".phaseSplit"));
  }

  // An eligible measurement row must carry a real measured/reconstructed throughput;
  // ANALYST_SET / PROJECTION / ineligible rows need not (they carry no measurement).
  const eligibleFlag = !(rec.eligibility && rec.eligibility.eligible === false);
  const isMeasurement = MEASUREMENT_STATUSES.includes(rec.status) && eligibleFlag;
  errors.push(...validateThroughput(rec.throughput, { required: isMeasurement }, path + ".throughput"));
  if (isMeasurement && (!rec.eligibility || rec.eligibility.definedDenominator !== true))
    errors.push(path + ".eligibility.definedDenominator must be true for an eligible measurement");

  // An ANALYST_SET row exists precisely to carry the stress envelope — no unpropagated analyst point
  // (§2 principle 2). It MUST carry an uncertainty object. (A PROJECTION row may not: Rubin is
  // relative-only with no anchor, and inventing a band there would be a fabricated number.)
  if (rec.status === "ANALYST_SET" && !rec.uncertainty)
    errors.push(path + ": an ANALYST_SET row must carry an uncertainty object (its purpose is the stress envelope; §2 principle 2)");
  if (rec.status === "ANALYST_SET" && rec.throughput
      && (rec.throughput.value !== null || rec.throughput.derivation === "measured"))
    errors.push(path + ": an ANALYST_SET row must carry null throughput and a non-measured derivation (the row represents an analyst identity, not an observation)");

  // P1-1: observational/RETRO/PROSPECTIVE rows are never fitted — they must not carry an engineFit.
  if ((rec.status === "RETRO" || rec.status === "PROSPECTIVE") && rec.engineFit != null)
    errors.push(path + ": a " + rec.status + " row must not carry an engineFit (RETRO/PROSPECTIVE anchors are never fitted; protocol §3)");
  if (rec.engineFit != null)
    errors.push(...validateEngineFit(rec.engineFit, path + ".engineFit"));
  // slice-A fix-verify round: deployment state derives from RECORD STATUS, so a scalar-only
  // engineFit cannot hide behind deployed:false (the last R1-1 evasion). A FITTED or
  // ANALYST_SET record's fit IS the deployed identity; a PROJECTION record's never is.
  if (rec.engineFit != null && (rec.status === "FITTED" || rec.status === "ANALYST_SET") && rec.engineFit.deployed !== true)
    errors.push(path + ".engineFit: a " + rec.status + " record's engineFit must be deployed:true (deployed:false cannot exempt it from the rev-2.2 discriminated identity)");
  if (rec.engineFit != null && rec.status === "PROJECTION" && rec.engineFit.deployed === true)
    errors.push(path + ".engineFit: a PROJECTION record's engineFit must not be deployed");
  if (rec.engineFit != null && rec.status === "FITTED"
      && !["fitted", "fitted-inherited"].includes(rec.engineFit.fitClass))
    errors.push(path + '.engineFit.fitClass: a FITTED evidence row must attach a fitted identity, not "' + String(rec.engineFit.fitClass) + '"');
  // Confirm-round closure (R3): fitClass is REQUIRED on every record-attached engineFit,
  // any status — a scalar-only fit relabeled PROJECTION was the last remaining escape.
  // (The scalar-only legacy shape stays valid ONLY for standalone factory/validator use.)
  if (rec.engineFit != null && rec.engineFit.fitClass == null)
    errors.push(path + ".engineFit.fitClass required on every record-attached engineFit (rev 2.2 — scalar-only shapes cannot attach to records under any status)");
  if (rec.engineFit != null && rec.status === "PROJECTION" && rec.engineFit.fitClass != null && rec.engineFit.fitClass !== "projection")
    errors.push(path + '.engineFit.fitClass: a PROJECTION record\'s fit must be class "projection" (got "' + rec.engineFit.fitClass + '")');
  // slice-A fix-round: calibrationRef is IDENTITY-bound, not just format-bound. A decode
  // record's ref must name ITS OWN platform row (same-valued key swaps — e.g. tpu7→trn2,
  // both 0.36142 joint-fit — are undetectable by value equality alone); a prefill record's
  // ref must be PREFILL_CAL. platformKey-null rows (chart-only) are pinned by tests instead.
  if (rec.engineFit != null && rec.engineFit.calibrationRef != null) {
    const ref = rec.engineFit.calibrationRef;
    if (rec.phase === "prefill" && ref !== "PREFILL_CAL")
      errors.push(path + '.engineFit.calibrationRef: a prefill record must reference PREFILL_CAL (got "' + ref + '")');
    if (rec.phase === "decode" && rec.platformKey != null && /^CALIBRATION\./.test(ref) && ref !== "CALIBRATION." + rec.platformKey)
      errors.push(path + '.engineFit.calibrationRef "' + ref + '" does not name this record\'s own platform row (CALIBRATION.' + rec.platformKey + ")");
    if (rec.phase === "decode" && rec.platformKey != null && ref === "PREFILL_CAL" && rec.engineFit.etaDec != null)
      errors.push(path + ".engineFit.calibrationRef: a decode record carrying etaDec must reference its CALIBRATION row, not PREFILL_CAL");
  }

  // P0-1 made structural: on a measured (FITTED/RETRO/PROSPECTIVE) row, an uncertainty component may
  // NOT be scoped to the measured quantity itself (`throughput`) — that is fit-residual-as-model-
  // uncertainty, the exact move council P0-1 forbids. Components scoped to a non-fitted leg are fine.
  if (MEASUREMENT_STATUSES.includes(rec.status) && rec.uncertainty && Array.isArray(rec.uncertainty.components)) {
    rec.uncertainty.components.forEach((c, i) => {
      if (c && c.appliesTo === "throughput")
        errors.push(path + ".uncertainty.components[" + i + "]: a component scoped to the measured quantity (appliesTo \"throughput\") is not admissible on a " + rec.status + " row — no fit-residual-as-uncertainty (council P0-1)");
    });
  }

  // uncertaintyDeferred, if present, must be the sanctioned marker.
  if (rec.uncertaintyDeferred != null && rec.uncertaintyDeferred !== UNCERTAINTY_DEFERRAL)
    errors.push(path + '.uncertaintyDeferred "' + rec.uncertaintyDeferred + '" invalid — the only deferral marker is "' + UNCERTAINTY_DEFERRAL + '"');

  // E1-scoring eligibility (protocol §5) is a distinct axis from §2 anchor eligibility: an E1-ineligible
  // row must state why (mirrors the §2 eligible/exclusionReason rule). A row can be §2-eligible yet
  // E1-ineligible (GB300 Interactive is audited-VALID but carries mandated MTP-3 with an unstated
  // acceptance rate) — so this is enforced separately from eligibility.eligible.
  if (rec.e1Eligible === false && !rec.e1IneligibleReason)
    errors.push(path + ": an E1-ineligible row (e1Eligible=false) must state an e1IneligibleReason (E1-scoring eligibility is distinct from §2 anchor eligibility; protocol §5)");

  // B3 (cold-review #7): a measured row with analyst-set legs must EITHER defer the band or carry a
  // scoped uncertainty component per leg — an analyst-set price leg cannot sit silent in the default.
  const analystLegs = (rec.engineFit && Array.isArray(rec.engineFit.analystSetLegs)) ? rec.engineFit.analystSetLegs : [];
  if (analystLegs.length > 0 && rec.uncertaintyDeferred !== UNCERTAINTY_DEFERRAL) {
    for (const leg of analystLegs) {
      const scope = ANALYST_LEG_SCOPE[leg] || leg;
      const covered = rec.uncertainty && Array.isArray(rec.uncertainty.components)
        && rec.uncertainty.components.some(c => c && c.appliesTo === scope);
      if (!covered)
        errors.push(path + ': analyst-set leg "' + leg + '" needs a scoped uncertainty component (appliesTo "' + scope + '") or uncertaintyDeferred="' + UNCERTAINTY_DEFERRAL + '" (B3, cold-review #7)');
    }
  }

  /* PROVENANCE-DEBT INVARIANT (GPT Pro 2026-07-29 rec 8; enforced here 2026-09-02 after review
     pr-20260902T173936Z-a81123 showed the first attempt guarded the wrong chokepoint). The original
     finding: a FITTED row carrying verification.state="inherited" with a null URL still presented
     eligible:true, a respectable quality tier, and a DEPLOYED engine fit — so it could influence a
     published result and look sourced to any consumer, without ever requesting `audited`. Asserting
     "inherited cannot be audited" in one test file did not close that; the rule belongs where every
     consumer must pass it, which is here.
     What this enforces: a FITTED row whose verification is not `verified` must SAY SO in typed form
     — an explicit provenanceDebt naming what is missing and acknowledging that it is deployed on
     inherited provenance. It cannot be silently promoted, and it cannot be read as sourced by
     anything that walks this schema. It deliberately does NOT force eligibility:false: that would
     drop the row's deployed fit and move the model, which is an owner-court change, not a
     provenance repair — recorded in BACKLOG.md rather than smuggled in here. */
  if (rec.status === "FITTED" && rec.verification && rec.verification.state !== "verified"
      && rec.verification.state !== "confirmed-at-primaries") {
    const debt = rec.provenanceDebt;
    if (!debt || typeof debt !== "object")
      errors.push(path + ": a FITTED row whose verification is \"" + rec.verification.state
        + "\" must carry a typed provenanceDebt {missing[], deployedOnInheritedProvenance, recoveryPath} — it is otherwise indistinguishable from a sourced row to every consumer of this schema (rec 8)");
    else {
      if (!Array.isArray(debt.missing) || debt.missing.length === 0)
        errors.push(path + ".provenanceDebt.missing must list what is absent (e.g. [\"url\",\"retrievedDate\"])");
      if (debt.deployedOnInheritedProvenance !== ((rec.engineFit && rec.engineFit.deployed) === true))
        errors.push(path + ".provenanceDebt.deployedOnInheritedProvenance must state the truth about engineFit.deployed (this is the field that makes the debt material)");
      if (typeof debt.recoveryPath !== "string" || !debt.recoveryPath)
        errors.push(path + ".provenanceDebt.recoveryPath must name what would close it, so the debt is actionable rather than decorative");
    }
  }

  errors.push(...validateReceipt(rec.receipt, path + ".receipt"));
  errors.push(...validateEligibility(rec.eligibility, path + ".eligibility"));
  errors.push(...validateVerification(rec.verification, path + ".verification"));

  if (rec.uncertainty) {
    if (UC && UC.validateUncertaintyObject)
      errors.push(...UC.validateUncertaintyObject(rec.uncertainty, path + ".uncertainty"));
    else
      errors.push(path + ".uncertainty present but the WS-C contract is not loaded to validate it");
  }

  // No coverage/confidence vocabulary anywhere in our own labels/notes (WS-C naming rule; attributed
  // verbatim quote fields are exempt — VOCAB_SKIP_KEYS).
  if (UC && UC.scanForbiddenVocabulary) {
    for (const v of UC.scanForbiddenVocabulary(rec))
      errors.push(path + ': forbidden vocabulary "' + v.term + '" at ' + v.path + " (no coverage/confidence language)");
  }
  return errors;
}

// Validate a whole instance list; returns { ok, results:[{id, errors}], errorCount }.
// Record-level validation alone is insufficient: downstream consumers construct maps
// by id, so a duplicate could silently shadow a contradictory earlier record.
function validateInstances(list) {
  if (!Array.isArray(list) || list.length === 0) {
    const message = !Array.isArray(list)
      ? "anchors: evidence registry must be a non-empty array"
      : "anchors: evidence registry must not be empty";
    return { ok: false, results: [{ id: null, errors: [message] }], errorCount: 1 };
  }
  const rows = list;
  const results = rows.map(rec => ({ id: rec && rec.id, errors: validateAnchorRecord(rec) }));
  const firstIndexById = new Map();
  rows.forEach((rec, i) => {
    if (!rec || typeof rec.id !== "string") return;
    if (firstIndexById.has(rec.id)) {
      results[i].errors.push("anchors[" + i + '].id: duplicate id "' + rec.id
        + '" (first declared at anchors[' + firstIndexById.get(rec.id) + "])");
    } else {
      firstIndexById.set(rec.id, i);
    }
  });
  const errorCount = results.reduce((a, r) => a + r.errors.length, 0);
  return { ok: errorCount === 0, results, errorCount };
}

/* ================= exports (engine.js idiom) ================= */
const API = {
  UNKNOWN, PHASES, CORE_STATUSES, MEASUREMENT_STATUSES, STATUSES, ELIGIBILITY_TIERS, THROUGHPUT_DERIVATIONS,
  PRECISION_VALUES, VERIFICATION_STATES, ANALYST_LEG_SCOPE, UNCERTAINTY_DEFERRAL,
  FIT_CLASSES, PREFILL_PROVENANCES,
  makeThroughput, makeReceipt, makeEligibility, makeVerification, makeEngineFit, makePhaseSplit, makeAnchorRecord,
  validateThroughput, validateReceipt, validateEligibility, validateVerification, validateEngineFit, validatePhaseSplit,
  validateAnchorRecord, validateInstances,
  uncertainty: UC, // re-export the WS-C contract for consumers that want both from one import
};
if (typeof module !== "undefined" && module.exports) Object.assign(module.exports, API);
if (typeof window !== "undefined") window.IMEvidenceSchema = API;
