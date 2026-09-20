/* Frontier Inference Margins — WS-C uncertainty & provenance contract (IM2, v2.2 re-engineer).
   Pure data-contract module: no DOM, no engine, node-importable for tests. Follows the engine.js
   idiom (plain functions; module.exports guard + browser-global fallback at the bottom).

   Governing plan: orchestration/plans/im-reengineer-defaults-2026-07-16.md — §3 WS-C ("contract
   first"), §2 design principle 2 (uncertainty decomposed by component, each basis labeled; NO
   fit-residual-as-uncertainty). Council packet P0-1 (the ten components, each with a basis label).
   Owner ruling 1 (2026-07-16): the displayed output is a BAND + a labeled central SCENARIO.

   THIS MODULE DEFINES THE ALGEBRA; IT DOES NOT PROPAGATE.
   composeBand() combines the STATED component ranges (multiplicative factors on the central value)
   into a displayed band — the composition algebra the contract must specify precisely. It does NOT
   push named input ranges through the engine cost function; that grid / published-seed Monte-Carlo
   propagation is D2 / IM5 work and is deliberately absent here (plan §3 WS-C "propagation after D2").

   NO COVERAGE / CONFIDENCE LANGUAGE. Enforced two ways: (a) the band label is drawn from a closed
   set {"stress envelope", "selected span"} — never "confidence interval" / "CI"; (b)
   scanForbiddenVocabulary() rejects coverage/confidence statistics vocabulary in any of our own
   label / note / basis fields (attributed verbatim source quotes are exempted — see SKIP_KEYS). */

"use strict";

/* ---------- the ten uncertainty components (council P0-1), fixed canonical order ---------- */
const UNCERTAINTY_COMPONENTS = [
  "measurement",      // reading/measurement error in the source figure itself
  "price",            // $/device-hr: market rate, contract base, procurement scalar
  "hardware-family",  // transferring a fit across accelerator families (the LOAO stress envelope)
  "model-scale",      // <=50B-active open benchmark -> 120-300B closed-MoE extrapolation
  "topology-SLO",     // replica width / inter-rack penalty / minimum batch / latency tier
  "phase",            // prefill-vs-decode allocation (prefill largely analyst-set; #2's +-2x swing)
  "precision",        // FP4 / NVFP4 / INT4 / FP8 path not fully identified (#6, #11)
  "fleet",            // fleet-share attribution is not a provider disclosure (#7 / B3)
  "traffic",          // I/O ratio + cache-hit mix is a chosen scenario, not telemetry
  "billing",          // serving-cache vs billed-cache share; batch-API discount (#10)
];

/* ---------- the four bases a component range may rest on ---------- */
// council P0-1: "each with a basis label". A component's range is only as trustworthy as its basis.
const BASES = [
  "measured",               // the range is read from a primary-source measurement
  "analyst-set",            // the range is an analyst's stated scenario span, not measured
  "stress-envelope",        // widened from the failed transfer test's residuals (37% mean / 59% worst)
  "structural-assumption",  // a modeling assumption (e.g. fleet-share attribution) with no evidence leg
];

/* ---------- composition rules: the ALGEBRA by which component ranges combine into a band ----------
   Named + specified here so the contract is concrete and testable. The engine-side propagation that
   would evaluate the real cost function at grid corners is IM5 and is intentionally NOT implemented. */
const COMPOSITION_RULES = [
  "linear-worst-case",   // all downside factors multiply; all upside factors multiply
  "grid-envelope",       // min/max over a discrete corner grid (== worst-case for independent factors;
                         //   the IM5 engine version evaluates the real cost fn at the corners)
  "quadrature",          // combine log-space deviations in quadrature (uncorrelated-factor assumption)
  "dominant-component",  // the single widest component sets the band (the others are folded in)
];

/* ---------- band-display contract: the ONLY permitted band labels ---------- */
// Owner ruling 1: band + central scenario. No coverage/confidence vocabulary anywhere.
const BAND_LABELS = ["stress envelope", "selected span"];

/* ---------- appliesTo: which quantity a component's range decorates (IM2 gate P0-1/P1-4) ----------
   A component must name the quantity it applies to. This is what makes council P0-1 structurally
   enforceable in the schema: on a FITTED/RETRO/PROSPECTIVE (measured) row, a component scoped to the
   measured quantity itself (`throughput`) is REJECTED there (evidence-schema.js) — you cannot dress a
   fit residual up as model uncertainty on the very quantity that was fitted. Components scoped to a
   non-fitted leg (`price`, `margin`, `fleet-share`) are permitted on measured rows. */
const APPLIES_TO = ["throughput", "price", "margin", "fleet-share"];

/* ---------- forbidden vocabulary (WS-C naming rule; imported by evidence-schema.js) ----------
   Coverage/confidence statistics language that would imply a calibrated interval the evidence does
   not support (council P0-1; cold-review #3's "80%-confidence interval"). No coverage/confidence
   language until prospective post-freeze coverage exists (plan §6; protocol §8: not before >=5
   PROSPECTIVE scores AND a published coverage analysis). */
// Hardened after the IM2 gate (P1-2): stems + abbreviations + dotted forms, not just whole words.
const FORBIDDEN_VOCAB = [
  /\bconfiden\w*/i,                     // confidence / confident / "95%-confident" (stem)
  /\bconf\./i,                          // "conf." abbreviation
  /\bcredible interval\b/i,
  /\bcoverage\b/i,
  /(?<![A-Za-z])C\.?I\.?(?![A-Za-z])/,  // CI / C.I. / CI. (dotted, word-boundary-proof; not "specific")
  /\bp-?values?\b/i,
  /\bstatistically significant\b/i,
  /\bstat\.?\s?sig\w*/i,                // "stat sig" / "stat. sig."
  /\bsignificance level\b/i,
  /\bstandard error\b/i,
  /\bstd\.?\s?err\w*/i,                 // "std err" / "std. err."
  /\bmargins? of error\b/i,             // "margin of error" (the product metric "contribution margin" is fine)
  /\berr(or)?\.?\s?margin\b/i,          // "error margin" / "err. margin"
];
// Keys whose string values are attributed verbatim source text, not our own labeling — exempt from
// the vocabulary rule (a source may have used a hedge word; quoting it faithfully is attribution).
const VOCAB_SKIP_KEYS = new Set(["url", "verbatimValue", "provenance"]);

/* ---------- factories ---------- */
function makeUncertaintyComponent(f = {}) {
  return {
    component: f.component,
    appliesTo: f.appliesTo,         // which quantity the range decorates (APPLIES_TO)
    range: f.range,                 // { lowMult, highMult, note } — multipliers relative to central
    basis: f.basis,
    sourceRef: f.sourceRef,
    note: f.note != null ? f.note : "",
  };
}

// central: { value, unit, label } — the labeled central SCENARIO always shown inside the band.
function makeUncertaintyObject(f = {}) {
  const components = Array.isArray(f.components) ? f.components : [];
  const composition = f.composition || "linear-worst-case";
  const band = f.band || {
    low: null, high: null,           // null in IM2: the band is filled by composeBand()/IM5 propagation
    unit: f.central ? f.central.unit : undefined,
    label: bandLabelFor(components),
    derived: false,
  };
  return { central: f.central, components, composition, band };
}

/* ---------- band label selection ---------- */
// A stress-envelope component anywhere ⇒ the whole band is a "stress envelope" (out-of-domain,
// transfer-error-derived). Otherwise it is a "selected span" (a chosen scenario span). Never a
// coverage/confidence interval — that language is reserved for prospective coverage that does not
// yet exist.
function bandLabelFor(components) {
  return (components || []).some(c => c && c.basis === "stress-envelope")
    ? "stress envelope"
    : "selected span";
}

/* ---------- the composition algebra (NOT propagation) ---------- */
// Combine the STATED component multiplicative ranges into a band around the central value.
// Returns { low, high, unit, label, derived:true }. This is the algebra the contract specifies;
// it does not run the engine cost function.
function composeBand(u) {
  // bq-291: refuse to DERIVE unless every input is finite.
  //
  // The old guard was `typeof u.central.value !== "number"`, which admits NaN and
  // Infinity. A NaN central produced band.low/high = NaN while still returning
  // derived: true — and JSON.stringify renders NaN as `null`, so a serialized band
  // showed {"low":null,"high":null,"derived":true}: a band asserting it was derived,
  // carrying no numbers, with the corruption invisible downstream. Infinity
  // multipliers likewise yielded an Infinity..Infinity band marked derived.
  //
  // derived:false with an explicit error is the honest outcome; a band this module
  // cannot compute must not claim it computed one.
  if (!u || !u.central || !Number.isFinite(u.central.value)) {
    return { low: null, high: null, unit: u && u.central && u.central.unit, label: "selected span", derived: false,
      error: "cannot compose a band from a non-finite central value" };
  }
  const c = u.central.value;
  const comps = (u.components || []).filter(x => x && x.range);
  const nonFinite = comps.filter(x => !Number.isFinite(x.range.lowMult) || !Number.isFinite(x.range.highMult));
  if (nonFinite.length) {
    return { low: null, high: null, unit: u.central.unit, label: bandLabelFor(comps), derived: false,
      error: "cannot compose a band from non-finite component multipliers (" + nonFinite.length + " component(s))" };
  }
  if (comps.length === 0) {
    // An empty component set is a rejection, not a zero-width band (IM2 gate P2): a band with no
    // decomposed source is exactly the unpropagated point the contract exists to forbid.
    return { low: null, high: null, unit: u.central.unit, label: bandLabelFor(comps), derived: false,
      error: "cannot compose a band from an empty component set" };
  }
  const lows = comps.map(x => x.range.lowMult);
  const highs = comps.map(x => x.range.highMult);
  let low, high;
  switch (u.composition) {
    case "linear-worst-case":
    case "grid-envelope":
      low = c * lows.reduce((a, b) => a * b, 1);
      high = c * highs.reduce((a, b) => a * b, 1);
      break;
    case "quadrature": {
      const dl = Math.sqrt(lows.reduce((a, b) => a + Math.log(b) ** 2, 0));
      const dh = Math.sqrt(highs.reduce((a, b) => a + Math.log(b) ** 2, 0));
      low = c * Math.exp(-dl);
      high = c * Math.exp(dh);
      break;
    }
    case "dominant-component": {
      let wl = 1, wh = 1, span = -Infinity;
      for (const x of comps) {
        const s = x.range.highMult / x.range.lowMult;
        if (s > span) { span = s; wl = x.range.lowMult; wh = x.range.highMult; }
      }
      low = c * wl; high = c * wh;
      break;
    }
    default:
      return { low: null, high: null, unit: u.central.unit, label: bandLabelFor(comps), derived: false };
  }
  /* ORDER AND FINITENESS OF THE COMPOSED ENDPOINTS (vetting round 2026-09-19, Astra pack A
     P1-1). The guard above checks the INPUT multipliers; nothing checked the OUTPUT. Two ways
     out of the switch were wrong. (1) A negative central value flips the multiplication:
     c = -0.2 with lowMult 0.5 / highMult 2 composed to low -0.1, high -0.4 — an INVERTED band,
     and margins are routinely negative on this page, so the case is ordinary rather than
     exotic. Sort the two signed endpoints instead of assuming low·c ≤ high·c. (2) A finite
     central and finite multipliers can still overflow: c = 1e308 with highMult 2 composed to
     high = Infinity, which JSON.stringify writes as `null` — a band endpoint that silently
     disappears downstream. An endpoint that is not finite is a composition failure, reported
     the same way a non-finite input is. */
  if (!Number.isFinite(low) || !Number.isFinite(high)) {
    return { low: null, high: null, unit: u.central.unit, label: bandLabelFor(comps), derived: false,
      error: "composed band endpoint is not finite (" + String(low) + ", " + String(high) + ")" };
  }
  if (low > high) { const swap = low; low = high; high = swap; }
  return { low, high, unit: u.central.unit, label: bandLabelFor(comps), derived: true };
}

/* ---------- forbidden-vocabulary scanner ---------- */
// Recursively walk an object; return every coverage/confidence vocabulary match in a non-exempt
// string field, as { path, term, snippet }.
function scanForbiddenVocabulary(node, path, out) {
  path = path || "";
  out = out || [];
  if (typeof node === "string") {
    for (const re of FORBIDDEN_VOCAB) {
      const m = node.match(re);
      if (m) out.push({ path, term: m[0], snippet: node.slice(0, 90) });
    }
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => scanForbiddenVocabulary(v, path + "[" + i + "]", out));
  } else if (node && typeof node === "object") {
    for (const k of Object.keys(node)) {
      if (VOCAB_SKIP_KEYS.has(k) || /url$/i.test(k)) continue;
      scanForbiddenVocabulary(node[k], path ? path + "." + k : k, out);
    }
  }
  return out;
}

/* ---------- validators ---------- */
function validateUncertaintyComponent(c, path) {
  path = path || "component";
  const errors = [];
  if (!c || typeof c !== "object") return [path + " missing"];
  if (!UNCERTAINTY_COMPONENTS.includes(c.component))
    errors.push(path + '.component "' + c.component + '" not one of the ten (council P0-1)');
  if (!APPLIES_TO.includes(c.appliesTo))
    errors.push(path + '.appliesTo "' + c.appliesTo + '" not one of ' + APPLIES_TO.join("/") + " (which quantity the range decorates — IM2 gate P0-1)");
  if (!c.basis || !BASES.includes(c.basis))
    errors.push(path + '.basis "' + c.basis + '" missing/invalid — every component MUST carry a basis (P0-1)');
  // bq-291: Number.isFinite, not typeof. `typeof NaN === "number"` and
  // `typeof Infinity === "number"`, so a typeof gate admits both — and every
  // comparison that follows is then vacuously false (NaN <= 0 is false, and
  // NaN > NaN is false), so a NaN multiplier passed the floor AND the ordering
  // check and reached composeBand untouched.
  if (!c.range || !Number.isFinite(c.range.lowMult) || !Number.isFinite(c.range.highMult))
    errors.push(path + ".range must carry FINITE numeric lowMult & highMult (multipliers relative to central; NaN/Infinity rejected)");
  else if (c.range.lowMult <= 0)
    errors.push(path + ".range.lowMult " + c.range.lowMult + " must be > 0 (a multiplier floor; a leg cannot go to/through zero)");
  else if (c.range.lowMult > c.range.highMult)
    errors.push(path + ".range.lowMult " + c.range.lowMult + " > highMult " + c.range.highMult);
  if (!c.sourceRef || !String(c.sourceRef).trim())
    errors.push(path + ".sourceRef missing/blank — a range with no stated source is not admissible");
  return errors;
}

function validateUncertaintyObject(u, path) {
  path = path || "uncertainty";
  const errors = [];
  if (!u || typeof u !== "object") return [path + " missing"];
  // bq-291: finite, not merely "a number" — see the note in the component validator.
  if (!u.central || !Number.isFinite(u.central.value))
    errors.push(path + ".central.value required and must be FINITE — the display is always a band + a labeled central scenario (owner ruling 1); NaN/Infinity rejected");
  if (!Array.isArray(u.components) || u.components.length === 0)
    errors.push(path + ".components must be a non-empty array (uncertainty is decomposed by component — P0-1)");
  else u.components.forEach((c, i) => errors.push(...validateUncertaintyComponent(c, path + ".components[" + i + "]")));
  if (!COMPOSITION_RULES.includes(u.composition))
    errors.push(path + '.composition "' + u.composition + '" not a defined rule');
  if (!u.band || typeof u.band !== "object") {
    errors.push(path + ".band missing (band + central is the display contract)");
  } else {
    if (!BAND_LABELS.includes(u.band.label))
      errors.push(path + '.band.label "' + u.band.label + '" forbidden — use "stress envelope" or "selected span", never coverage/confidence language');
    const expected = bandLabelFor(u.components);
    if (BAND_LABELS.includes(u.band.label) && u.band.label !== expected)
      errors.push(path + '.band.label should be "' + expected + '" given the component bases (a stress-envelope component ⇒ "stress envelope")');
    /* The band's NUMBERS, not just its wording (vetting round 2026-09-19, Astra pack A P1-1).
       This validator checked the label and stopped, so an inverted band, a non-finite endpoint
       and a central scenario sitting outside its own band all validated with zero errors —
       which is the one thing a contract whose entire subject is "a band plus a labeled central
       scenario" must never do. A band still composing (derived false, error set) is left to the
       composition error; these rules bind a band that claims to be derived. */
    if (typeof u.band.error === "string" && u.band.error)
      errors.push(path + ".band failed to compose: " + u.band.error + " — a band that did not compose is not a display-ready band");
    if (u.band.derived === true) {
      const lo = u.band.low, hi = u.band.high;
      if (!Number.isFinite(lo) || !Number.isFinite(hi))
        errors.push(path + ".band.low/.high must both be FINITE on a derived band (got " + String(lo) + ", " + String(hi) + ")");
      else {
        if (lo > hi)
          errors.push(path + ".band is inverted: low " + lo + " > high " + hi);
        const c = u.central && u.central.value;
        if (Number.isFinite(c) && (c < Math.min(lo, hi) || c > Math.max(lo, hi)))
          errors.push(path + ".central.value " + c + " lies outside its own band [" + Math.min(lo, hi) + ", " + Math.max(lo, hi) + "]");
      }
    }
  }
  for (const v of scanForbiddenVocabulary(u, path))
    errors.push(path + ' forbidden vocabulary "' + v.term + '" at ' + v.path + " (no coverage/confidence language)");
  return errors;
}

/* ---------- exports (engine.js idiom) ---------- */
const API = {
  UNCERTAINTY_COMPONENTS, BASES, COMPOSITION_RULES, BAND_LABELS, APPLIES_TO, FORBIDDEN_VOCAB, VOCAB_SKIP_KEYS,
  makeUncertaintyComponent, makeUncertaintyObject, bandLabelFor, composeBand,
  scanForbiddenVocabulary, validateUncertaintyComponent, validateUncertaintyObject,
};
if (typeof module !== "undefined" && module.exports) Object.assign(module.exports, API);
if (typeof window !== "undefined") window.IMUncertaintyContract = API;
