// IM4 entry harness — read-only fleet-policy diagnostic against the live v2.2 engine.
// Run: node site/tests/im4-fleet-policy-harness.mjs
// Twin rule: the ONLY sanctioned differences between this file and its twin are the `// Run:`
// comment line and require(...) path strings; all other bytes must remain identical.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../engine.js");
const R = require("../engine-roofline-v22.js");
const D = require("../engine-data-v22.js");

let diagnosticMismatches = 0;
let assertionFailures = 0;
let disclosureFailures = 0;
let topologyGuardFailures = 0;
const emittedFleetLines = [];

const diagnosticCheck = (name, cond, detail = "") => {
  console.log(`${cond ? "OBSERVED" : "DIAGNOSTIC MISMATCH"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) diagnosticMismatches++;
};
const assertionCheck = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) assertionFailures++;
};
const topologyGuardCheck = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) topologyGuardFailures++;
};
const section = title => console.log(`\n${"=".repeat(88)}\n${title}\n${"=".repeat(88)}`);
const pct = value => Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : "NA";
const money = value => Number.isFinite(value) ? `$${value.toFixed(4)}` : "NA";
const totalLabel = totalB => `${(totalB / 1000).toFixed(2)}T`;
const weightsText = entries => entries.length
  ? `{${entries.map(([key, weight]) => `${key}:${(weight * 100).toFixed(2)}%`).join(",")}}`
  : "{}";

const allHwKeys = [...E.HW_ORDER, "rubin"];
const hwRecord = key => key === "rubin" ? E.RUBIN : E.HW[key];
const calibrationTier = key => D.CALIBRATION[key].throughputEvidenceClass || "unclassified";

// Throughput eligibility consumes the LIVE typed calibration registry, never display prose.
const THROUGHPUT_ELIGIBLE_CLASSES = new Set(["fitted", "fitted-inherited", "family-transfer"]);
const throughputEligible = key =>
  THROUGHPUT_ELIGIBLE_CLASSES.has(D.CALIBRATION[key].throughputEvidenceClass);

// Price eligibility is deliberately conservative. The positive source phrases are mechanically
// recognizable provenance classes in HW[*].note, and the numeric test requires a dollar rate tied
// to /hr or explicitly parenthesized IDC/hyperscaler rental context. A bare `rent` scalar, a
// $/M-token engineering result, "estimates", or an explicit no-public-rate statement does not pass.
// b9 M1: two published-rate provenance phrases added (r4 defect D4 repair) — Google's
// published 3-year committed TPU rate and AWS Capacity Blocks for Trainium2. Both name a
// public rate, which is exactly what this class means; the rate pattern gains "chip-hr"
// because non-GPU accelerators are priced per chip-hour.
const PRICE_SOURCE_PATTERN = /(?:Neocloud rates|Annual-commit IDC rate|Rental class matters|Rent = Huatai procurement award|Rent = Google's PUBLISHED \d+-year committed rate|Rent = AWS Capacity Blocks PUBLISHED)/i;
const PRICE_RATE_PATTERN = /\$\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?(?:\+)?(?:\/(?:GPU-|chip-)?hr|\s*\([^)]*(?:IDC|hyperscaler)[^)]*\))/i;
const priceEligible = key => {
  const note = hwRecord(key).note;
  return PRICE_SOURCE_PATTERN.test(note) && PRICE_RATE_PATTERN.test(note);
};
const priceBasis = key => priceEligible(key) ? "observed/source-named rent" : "analyst-set rent";

const opus = E.MODELS.find(model => model.id === "opus");
const median = E.PERSPECTIVES.find(perspective => perspective.id === "median");
/* b9 M5 fixture scope (M5 delta manifest) — REFERENCE-CLASS harness: it certifies fleet
   MEMBERSHIP, policy and disclosure behaviour across model sizes (leg counts and weight
   shares are the property under test; the margins are incidental pins). Those are
   lever-invariant, so the base state is pinned to the trend-0 / family-1.0 reference and
   every pinned figure stays byte-unchanged. */
const base = E.pinReferenceLevers(E.applyPresetSettings(opus, median, { mode: "native" }));
const baseContext = E.scenarioContext(base);
const arch = R.resolveArch("opus");
const minValidTotalB = Math.ceil(base.active / 50) * 50;

const throughputKeys = allHwKeys.filter(throughputEligible);
const priceKeys = allHwKeys.filter(priceEligible);
const eligibleKeys = allHwKeys.filter(key => throughputEligible(key) || priceEligible(key));
const anchoredKeys = allHwKeys.filter(key => throughputEligible(key) && priceEligible(key));
const defaultDeclaredKeys = E.HW_ORDER.filter(key => (base.blend[key] || 0) > 0);
const currentTopologyAnchoredKeys = defaultDeclaredKeys.filter(key => throughputEligible(key) && priceEligible(key));

const stateForBlend = blend => {
  const state = structuredClone(base);
  state.blend = Object.fromEntries(E.HW_ORDER.map(key => [key, blend[key] || 0]));
  return state;
};
const equalBlend = keys => Object.fromEntries(keys.map(key => [key, 1]));

const fleetReceipt = (state, supplied = baseContext) => {
  const feasibility = E.feasibility(state, supplied);
  const renderable = feasibility.legs.filter(leg => !leg.infeasible);
  const share = renderable.reduce((sum, leg) => sum + leg.weight, 0);
  return {
    renderableLegs: renderable.length,
    totalLegs: feasibility.legs.length,
    renderableWeightShare: share,
    declared: feasibility.legs.map(leg => [leg.hwKey, leg.weight]),
    renderable: renderable.map(leg => [leg.hwKey, leg.weight]),
    rendered: share > 0 ? renderable.map(leg => [leg.hwKey, leg.weight / share]) : [],
  };
};
/* R2: the fleetReceiptAtNShard helper is RETIRED with its channel (memo §0 P1-7) —
   section (g) below reports the SOLVER width receipts instead. */

const emitFleetLine = ({ label, margin, receipt, extra = "", numeric = Number.isFinite(margin) }) => {
  const line = `${label} margin=${pct(margin)} renderableLegs=${receipt.renderableLegs}/${receipt.totalLegs} ` +
    `renderableWeightShare=${pct(receipt.renderableWeightShare)} ` +
    `membership=${weightsText(receipt.renderable)} renderedWeights=${weightsText(receipt.rendered)}` +
    (extra ? ` ${extra}` : "");
  console.log(line);
  emittedFleetLines.push({ line, numeric, receipts: [receipt] });
  return line;
};
const emitFleetTransitionLine = (line, receipts) => {
  console.log(line);
  emittedFleetLines.push({ line, numeric: true, receipts });
};

section("(a) IM4 EVIDENCE ELIGIBILITY — LIVE CALIBRATION + HW NOTE RULES");
console.log("THROUGHPUT RULE: eligible iff CALIBRATION[row].throughputEvidenceClass is fitted, fitted-inherited, or family-transfer; source-informed neutral, bridge, joint-fit, assumed-op, and projection rows are excluded.");
console.log("PRICE RULE: eligible iff HW[row].note contains a named observed-rent provenance phrase matched by /Neocloud rates|Annual-commit IDC rate|Rental class matters|Rent = Huatai procurement award|Rent = Google's PUBLISHED N-year committed rate|Rent = AWS Capacity Blocks PUBLISHED/ AND a numeric dollar rental rate matched as /hr, /GPU-hr, /chip-hr or explicit IDC/hyperscaler context; bare rent scalars, $/M-token engineering anchors, estimates, and no-public-rate statements are excluded.");
console.log(`THROUGHPUT PASS: ${throughputKeys.join(",")}`);
console.log(`THROUGHPUT FAIL: ${allHwKeys.filter(key => !throughputEligible(key)).join(",")}`);
console.log(`PRICE PASS: ${priceKeys.join(",")}`);
console.log(`PRICE FAIL: ${allHwKeys.filter(key => !priceEligible(key)).join(",")}`);
console.log(`ELIGIBLE VERTEX UNION (throughput OR price): ${eligibleKeys.join(",")}`);
console.log(`STRICT ANCHORED INTERSECTION (throughput AND price): ${anchoredKeys.join(",")}`);
console.log(`OPUS CURRENT DECLARED LEGS: ${defaultDeclaredKeys.join(",")}`);
console.log(`CURRENT-TOPOLOGY STRICT INTERSECTION: ${currentTopologyAnchoredKeys.join(",") || "EMPTY"}`);
for (const key of allHwKeys) {
  console.log(`ELIGIBILITY row=${key} throughput=${throughputEligible(key) ? "PASS" : "FAIL"} price=${priceEligible(key) ? "PASS" : "FAIL"} ` +
    `calibrationTier=${calibrationTier(key)} etaStatus=${JSON.stringify(D.CALIBRATION[key].etaStatus)} priceBasis=${priceBasis(key)}`);
}

section("(b) ELIGIBLE OPUS LEGS — 300B ACTIVE / 2.5T TOTAL / FP8 / BALANCED");
console.log("Cost per Mtok is the real workloadOnHw().costMix for the Opus reference traffic mix; decode/prefill component costs are also printed. State and b values come from the real roofline renderPoint().");
for (const key of eligibleKeys) {
  const point = R.renderPoint({ arch, activeB: base.active, totalB: base.total, hwKey: key,
    regime: base.interact, precision: base.precision, stackMult: base.stackMult,
    profileId: opus.nativeTraffic, ioRatio: base.ioRatio });
  const hwWorkload = E.workloadOnHw(hwRecord(key), base, undefined, baseContext);
  const state = point.infeasible ? "infeasible" : point.op.capped ? "capped" : "finite";
  console.log(`LEG hw=${key} state=${state} bFeas=${point.op.bFeas} bDeclared=${point.op.bDeclared} ` +
    `bRendered=${point.infeasible ? "NA" : point.op.b} opBasis=${point.opBasis} ` +
    `costPerMtok=${money(hwWorkload.costMix)} cIn=${money(hwWorkload.cIn)} cOut=${money(hwWorkload.cOut)} ` +
    `calibrationTier=${calibrationTier(key)} priceBasis=${priceBasis(key)} throughputEligible=${throughputEligible(key)} priceEligible=${priceEligible(key)}`);
}

const candidates = [
  ...eligibleKeys.map(key => ({ name: `vertex:${key}`, blend: { [key]: 1 }, rule: `100% ${key}` })),
  { name: "current-landing-default", blend: base.blend, rule: "activated Opus NA-blend landing fleet unchanged" },
  { name: "anchored-only-equal", blend: equalBlend(anchoredKeys), rule: `equal declared weight over strict intersection: ${anchoredKeys.join(",")}` },
  { name: "current-topology-anchored-only", blend: equalBlend(currentTopologyAnchoredKeys), rule: currentTopologyAnchoredKeys.length
    ? `equal declared weight over strict intersection restricted to current Opus declared legs: ${currentTopologyAnchoredKeys.join(",")}`
    : "strict intersection restricted to current Opus declared legs is empty" },
];

section("(c) CANDIDATE FLEETS — SIMPLEX VERTICES + DEFAULT + ANCHORED-ONLY");
console.log("VERTEX RULE: enumerate the union of throughput-eligible OR price-eligible hardware. ANCHORED-ONLY RULE: equal declared weights over throughput-eligible AND price-eligible hardware. The current-topology diagnostic applies the same intersection after restricting membership to DEFAULTS.blend's non-zero legs.");
const candidateResults = [];
for (const candidate of candidates) {
  const state = stateForBlend(candidate.blend);
  const workload = E.workload(state, undefined, baseContext);
  const receipt = fleetReceipt(state, baseContext);
  candidateResults.push({ candidate, state, workload, receipt });
  emitFleetLine({ label: `CANDIDATE name=${candidate.name}`, margin: workload.margin, receipt,
    extra: `rule=${JSON.stringify(candidate.rule)} declaredWeights=${weightsText(receipt.declared)}` });
}
const numericCandidateResults = candidateResults.filter(result => Number.isFinite(result.workload.margin));
const candidateLow = numericCandidateResults.reduce((best, result) => result.workload.margin < best.workload.margin ? result : best);
const candidateHigh = numericCandidateResults.reduce((best, result) => result.workload.margin > best.workload.margin ? result : best);
emitFleetTransitionLine(`VISION FINDING — CANDIDATE NUMERIC MARGIN SPAN: low=${pct(candidateLow.workload.margin)} high=${pct(candidateHigh.workload.margin)} ` +
  `width=${((candidateHigh.workload.margin - candidateLow.workload.margin) * 100).toFixed(2)}pp ` +
  `renderableWeightShare=${pct(candidateLow.receipt.renderableWeightShare)}->${pct(candidateHigh.receipt.renderableWeightShare)} ` +
  `endpoints=${candidateLow.candidate.name}->${candidateHigh.candidate.name}`,
  [candidateLow.receipt, candidateHigh.receipt]);

section("(d) SURVIVORSHIP SWEEP — TOTAL PARAMETERS, VALID OPUS DOMAIN 0.30T..6.00T BY 0.05T");
console.log("MONOTONICITY CONTRACT UNDER TEST: increasing total parameters (harder feasibility, all other Opus defaults fixed) must not increase the default-fleet headline margin. This assertion is diagnostic-only by specification.");
const sweep = [];
for (let totalB = minValidTotalB; totalB <= 6000; totalB += 50) {
  const state = structuredClone(base);
  state.total = totalB;
  const workload = E.workload(state, undefined, baseContext);
  const receipt = fleetReceipt(state, baseContext);
  sweep.push({ totalB, state, workload, receipt });
  emitFleetLine({ label: `SWEEP total=${totalLabel(totalB)}`, margin: workload.margin, receipt });
}

const membershipKey = receipt => receipt.renderable.map(([key]) => key).join(",");
const crossings = [];
const violations = [];
for (let index = 1; index < sweep.length; index++) {
  const previous = sweep[index - 1];
  const current = sweep[index];
  const before = new Set(previous.receipt.renderable.map(([key]) => key));
  const after = new Set(current.receipt.renderable.map(([key]) => key));
  const left = [...before].filter(key => !after.has(key));
  const entered = [...after].filter(key => !before.has(key));
  if (membershipKey(previous.receipt) !== membershipKey(current.receipt))
    crossings.push({ previous, current, left, entered });
  if (Number.isFinite(previous.workload.margin) && Number.isFinite(current.workload.margin) &&
      current.workload.margin > previous.workload.margin + 1e-12)
    violations.push({ previous, current, left, entered });
}
console.log("\nMEMBERSHIP CROSSINGS");
for (const crossing of crossings) {
  emitFleetTransitionLine(`CROSSING ${totalLabel(crossing.previous.totalB)}->${totalLabel(crossing.current.totalB)} ` +
    `margin=${pct(crossing.previous.workload.margin)}->${pct(crossing.current.workload.margin)} ` +
    `left=${crossing.left.join(",") || "none"} entered=${crossing.entered.join(",") || "none"} ` +
    `membership=${membershipKey(crossing.previous.receipt) || "none"}->${membershipKey(crossing.current.receipt) || "none"} ` +
    `renderableWeightShare=${pct(crossing.previous.receipt.renderableWeightShare)}->${pct(crossing.current.receipt.renderableWeightShare)}`,
    [crossing.previous.receipt, crossing.current.receipt]);
}
console.log("\nVIOLATIONS");
for (const violation of violations) {
  emitFleetTransitionLine(`VIOLATION adjacent=${totalLabel(violation.previous.totalB)}->${totalLabel(violation.current.totalB)} ` +
    `margin=${pct(violation.previous.workload.margin)}->${pct(violation.current.workload.margin)} ` +
    `left=${violation.left.join(",") || "none"} entered=${violation.entered.join(",") || "none"} ` +
    `membership=${membershipKey(violation.previous.receipt) || "none"}->${membershipKey(violation.current.receipt) || "none"} ` +
    `renderableWeightShare=${pct(violation.previous.receipt.renderableWeightShare)}->${pct(violation.current.receipt.renderableWeightShare)}`,
    [violation.previous.receipt, violation.current.receipt]);
}
/* External-review re-derivation: the activated landing fleet is the NA blend, not the
   legacy DEFAULTS.blend. At 5.90T→5.95T Trainium2 drops and the displayed margin jumps. */
const fixture2000 = sweep.find(point => point.totalB === 5900);
const fixture2500 = sweep.find(point => point.totalB === 5950);
emitFleetTransitionLine(`LANDING-FLEET FIXTURE SPAN 5.90T->5.95T margin=${pct(fixture2000.workload.margin)}->${pct(fixture2500.workload.margin)} ` +
  `legs=${fixture2000.receipt.renderableLegs}/${fixture2000.receipt.totalLegs}->${fixture2500.receipt.renderableLegs}/${fixture2500.receipt.totalLegs} ` +
  `renderableWeightShare=${pct(fixture2000.receipt.renderableWeightShare)}->${pct(fixture2500.receipt.renderableWeightShare)} ` +
  `membership=${membershipKey(fixture2000.receipt)}->${membershipKey(fixture2500.receipt)}`,
  [fixture2000.receipt, fixture2500.receipt]);
/* im-vet-six-repairs (2026-09-20), vetting finding E1 — A REAL CONSEQUENCE, recorded rather than
   re-pinned away: the 5.90T -> 5.95T upward jump is GONE, because the leg that dropped out there
   was trn2, and both Trainium legs are now withdrawn from the default on evidence grounds before
   any size sweep reaches them. The non-monotonicity this diagnostic exists to surface is a
   property of the fleet, not of the sweep, so with a five-leg default there is nothing to surface
   at that boundary. The gate-6 suppression it motivates is UNCHANGED and still unconditional —
   see tests/fleets.test.mjs, where the strict branch now suppresses at the baseline itself. */
/* PROMOTED FROM DIAGNOSTIC TO ASSERTION 2026-09-20 (im-vet-six-repairs, bq-2895), after the Astra
   xhigh review showed that an injected 10-point jump here logged a mismatch and still exited ZERO,
   and the completion gate ruled that gap inside the frozen "no guard was edited to pass" criterion.
   The promotion is not a mechanical tightening: this line used to OBSERVE a discontinuity the page
   could not help, which is the right register for something nobody has decided about. It now
   ASSERTS a fact this leg created — that withdrawing the Trainium legs removes the 5.90T->5.95T
   upward jump — and a fact a leg creates is a fact a guard should defend. If a future data move
   brings a discontinuity back, that is a finding, and it will now stop the harness instead of
   printing into a log nobody reads. */
assertionCheck("the 5.90T->5.95T survivorship discontinuity is GONE with the Trainium legs withdrawn",
  violations.length === 0,
  `${violations.length} upward jump(s): ${violations.map(v => `${totalLabel(v.previous.totalB)}->${totalLabel(v.current.totalB)}`).join(",") || "none"}`);
/* im-arc T4 fold (2026-08-24, tests/fixtures-t4-declared-delta.json): the two landing-fleet
   fixtures re-mint on the folded defaults. The MEMBERSHIP behaviour they exist to pin — 7/7 at
   5.90T, 6/7 at 5.95T with the weight share dropping to 92% — is byte-unchanged; only the
   margins moved.
   im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok:
   re-minted again, and again ONLY the margins move. The membership behaviour these fixtures exist
   to pin is byte-identical — still 7/7 at 100% weight at 5.90T, still 6/7 at 92% at 5.95T, still
   exactly one upward discontinuity at that boundary. Adopting planning rents for GB200, GB300 and
   trn3 changes what each surviving leg COSTS, not which legs survive, which is why the margins move
   (-59.75% -> 0.20%, 42.59% -> 54.36%) and every membership number does not. */
/* im-vet-six-repairs (2026-09-20): both fixtures re-mint, and this time the MEMBERSHIP moves as
   well as the margins — the default is five legs, and at both sizes all five render, which is why
   the discontinuity above disappeared. Declared, not absorbed. */
assertionCheck("landing-fleet fixture 5.90T = 51.37%, 5/5 legs, renderableWeightShare=100%",
  Math.abs(fixture2000.workload.margin * 100 - 51.37) <= 0.01 && fixture2000.receipt.renderableLegs === 5 &&
  fixture2000.receipt.totalLegs === 5 && Math.abs(fixture2000.receipt.renderableWeightShare - 1) <= 1e-9,
  `${pct(fixture2000.workload.margin)}, ${fixture2000.receipt.renderableLegs}/${fixture2000.receipt.totalLegs}, ${pct(fixture2000.receipt.renderableWeightShare)}`);
assertionCheck("landing-fleet fixture 5.95T = 51.25%, 5/5 legs, renderableWeightShare=100%",
  Math.abs(fixture2500.workload.margin * 100 - 51.25) <= 0.01 && fixture2500.receipt.renderableLegs === 5 &&
  fixture2500.receipt.totalLegs === 5 && Math.abs(fixture2500.receipt.renderableWeightShare - 1) <= 1e-9,
  `${pct(fixture2500.workload.margin)}, ${fixture2500.receipt.renderableLegs}/${fixture2500.receipt.totalLegs}, ${pct(fixture2500.receipt.renderableWeightShare)}`);

section("(e) DISCLOSURE SELF-CHECK — HARNESS OUTPUT");
for (const emission of emittedFleetLines) {
  const renormalized = emission.receipts.some(receipt => receipt.renderableLegs < receipt.totalLegs);
  if (emission.numeric && renormalized && !/\brenderableWeightShare=/.test(emission.line)) {
    disclosureFailures++;
    emission.disclosureCounted = true;
    console.log(`FAIL  renormalized numeric line omitted renderableWeightShare — ${emission.line}`);
  }
}
console.log(`${disclosureFailures === 0 ? "PASS" : "FAIL"}  every renormalized numeric fleet line emitted by this harness includes renderableWeightShare`);

const BAND_TIERS = {
  fitted: { id: "(a) FITTED", low: 0.86, high: 1.42, basis: "reproduction-scatter" },
  "fitted-inherited": { id: "(b) anchored-family", low: 0.41, high: 1.59, basis: "stress-envelope" },
  "family-transfer": { id: "(b) anchored-family", low: 0.41, high: 1.59, basis: "stress-envelope" },
  "joint-fit": { id: "(c) out-of-domain MoE decode", low: 0.55, high: 1.00, basis: "holdout-error" },
  // b9 M1: the two new tiers keep the (c) out-of-domain stress band. Neither is a
  // measured same-platform reproduction, so neither earns the tighter (a)/(b) envelopes;
  // fail-closed, the wider band applies.
  "platform-native-aggregate-bridge": { id: "(c) platform-native aggregate-form bridge", low: 0.55, high: 1.00, basis: "holdout-error (representation-bound diagnostics, not a reproduction)" },
  "source-informed-neutral": { id: "(c) source-informed neutral", low: 0.55, high: 1.00, basis: "generic holdout-error fallback (analyst-selected neutral, not a reproduction)" },
  "analyst-set-assumed-op": { id: "(c) analyst-set at an assumed operating point", low: 0.55, high: 1.00, basis: "holdout-error (assumed operating point, source batch not reconstructable)" },
  projection: { id: "(c) projection treated as out-of-domain decode", low: 0.55, high: 1.00, basis: "analyst-set projection + holdout-error stress" },
};
const SOURCE_NEUTRAL_TIERS = {
  h20: { id: "(c) source-informed neutral", low: 0.622, high: 1.05,
    basis: "published H20 latency tiers: 423/680 through 714/680" },
  ascend: { id: "(c) source-informed neutral", low: 0.378, high: 1.366,
    basis: "published Ascend latency tiers: 538/1422.7 through 1943/1422.7" },
};
const tierFor = key => SOURCE_NEUTRAL_TIERS[key] || BAND_TIERS[calibrationTier(key)];

const exploratoryBand = result => {
  const weights = E.blendWeights(result.state);
  const legs = Object.entries(weights).map(([key, weight]) => {
    const workload = E.workloadOnHw(E.HW[key], result.state, undefined, baseContext);
    const tier = tierFor(key);
    return { key, weight, workload, tier, renderable: Number.isFinite(workload.cIn) && Number.isFinite(workload.cOut) };
  });
  const renderable = legs.filter(leg => leg.renderable);
  const share = renderable.reduce((sum, leg) => sum + leg.weight, 0);
  if (share <= 0) return { lowMargin: NaN, highMargin: NaN, classes: [], legs, share };
  const cIn = renderable.reduce((sum, leg) => sum + leg.weight / share * leg.workload.cIn, 0);
  const lowCOut = renderable.reduce((sum, leg) => sum + leg.weight / share * (leg.workload.cOut / leg.tier.low), 0);
  const highCOut = renderable.reduce((sum, leg) => sum + leg.weight / share * (leg.workload.cOut / leg.tier.high), 0);
  const lowMargin = E.computeMix(cIn, lowCOut, result.state).margin;
  const highMargin = E.computeMix(cIn, highCOut, result.state).margin;
  const classes = Object.values(renderable.reduce((groups, leg) => {
    const groupKey = [leg.tier.id, leg.tier.low, leg.tier.high, leg.tier.basis].join("|");
    (groups[groupKey] ||= { id: leg.tier.id, low: leg.tier.low, high: leg.tier.high,
      basis: leg.tier.basis, keys: [] }).keys.push(leg.key);
    return groups;
  }, {}));
  return { lowMargin, highMargin, classes, legs, share };
};

section("(f) EXPLORATORY ARITHMETIC FOR REVIEW — NOT A SHIPPED IM5 BAND");
console.log("DECODE MULTIPLIERS: tier (a) FITTED x0.86/x1.42; tier (b) anchored-family x0.41/x1.59; tier (c) generic out-of-domain MoE x0.55/x1.00, H20 source tiers x0.622/x1.05, Ascend source tiers x0.378/x1.366; tier (d) capacity-style x0.17/x1.37.");
console.log("PREFILL BOUNDARY: cIn/prefill is held explicitly ANALYST-SET and unchanged. Only each renderable leg's decode throughput is multiplied; equivalently cOut is divided by its low/high multiplier before computeMix(). This is exploratory arithmetic, not an official IM5 result.");
console.log("TIER (d) NOTE: the live v2.2 render path has no capacity-style/argmax closure, so tier (d) is documented but not instantiated by any candidate fleet.");
for (const tier of [
  ["(a) FITTED", 0.86, 1.42], ["(b) anchored-family", 0.41, 1.59],
  ["(c) out-of-domain MoE", 0.55, 1.00], ["(d) capacity-style", 0.17, 1.37],
  ["(c) H20 source tiers", 0.622, 1.05], ["(c) Ascend source tiers", 0.378, 1.366],
]) console.log(`MULTIPLIER WIDTH tier=${tier[0]} low=${tier[1].toFixed(2)} high=${tier[2].toFixed(2)} width=${(tier[2] - tier[1]).toFixed(2)}x`);

for (const result of candidateResults) {
  const band = exploratoryBand(result);
  const classText = band.classes.length
    ? band.classes.map(group => `${group.id}[${group.keys.join(",")}]:x${group.low.toFixed(2)}/x${group.high.toFixed(2)} basis=${group.basis}`).join("; ")
    : "none (no renderable legs)";
  emitFleetLine({ label: `EXPLORATORY-BAND name=${result.candidate.name}`, margin: band.lowMargin,
    receipt: result.receipt, numeric: Number.isFinite(band.lowMargin) || Number.isFinite(band.highMargin),
    extra: `lowMargin=${pct(band.lowMargin)} highMargin=${pct(band.highMargin)} width=${Number.isFinite(band.lowMargin) ? ((band.highMargin - band.lowMargin) * 100).toFixed(2) + "pp" : "NA"} prefillBasis=analyst-set classes=${JSON.stringify(classText)}` });
  if (Number.isFinite(result.workload.margin)) {
    const reconstructed = exploratoryBand({ ...result, state: result.state });
    assertionCheck(`exploratory band ordered for ${result.candidate.name}`,
      reconstructed.lowMargin <= reconstructed.highMargin,
      `${pct(reconstructed.lowMargin)} > ${pct(reconstructed.highMargin)}`);
  }
}

section("(g) NVL72 SOLVER CAPACITY WIDTHS + RETIRED-CHANNEL GUARD — DIAGNOSTIC ONLY");
/* R2 REWRITE (memo §0 P1-7; shipment plan §1.2): the declared N_shard-case sweep is
   RETIRED with its channel — widths come from the capacity solver's declared-operating-
   point output; topology cases survive as EVIDENCE ANNOTATIONS on the hw rows. This
   section now reports the live solver receipts and proves the retirement is loud. */
const nvl72Keys = ["gb200", "gb300"];
const topologySensitivity = D.HW_ROOFLINE.gb200.topologySensitivity;
const nShardCases = topologySensitivity.cases.filter(candidate => candidate.topologyDimension === "N_shard" && !candidate.superseded);
const nonShardCases = topologySensitivity.cases.filter(candidate => candidate.topologyDimension !== "N_shard");
const currentTopologyState = stateForBlend(equalBlend(currentTopologyAnchoredKeys));
console.log("WIDTH RULE (R2): capacity-min / declared-operating-point widths SOLVED per leg over the registered domain enumeration; the topology-case registry is provenance annotation only.");
console.log(`GOVERNING SOURCE (annotation registry): ${topologySensitivity.governingSource}`);
console.log(`ANNOTATION CASE SET: ${nShardCases.map(candidate => `${candidate.value}[${candidate.id};class=${candidate.evidenceClasses.join("/")}]`).join(",")}`);
console.log(`NON-SHARD DOCUMENTATION SET: ${nonShardCases.map(candidate => `${candidate.value}[${candidate.id};dimension=${candidate.topologyDimension};class=${candidate.evidenceClasses.join("/")}]`).join(",")}`);

for (const hwKey of nvl72Keys) {
  const solved = E.solveCapacityWidth(hwKey, currentTopologyState, { ctx: baseContext });
  console.log(`SOLVER-RECEIPT hw=${hwKey} capacityMin=${solved.receipt.capacityMinimumUnderUniformPolicy} ` +
    `declaredOpWidth=${solved.receipt.declaredOperatingPointWidth} bFeasAtMin=${solved.receipt.bFeasAtCapacityMin} ` +
    `renderableUnderPolicy=${solved.renderableUnderPolicy} placementVerified=${solved.placementVerified} ` +
    `legalSet=${JSON.stringify(solved.receipt.legalShapeSet)} basis=${solved.receipt.residencyBasis}`);
  assertionCheck(`solver width for ${hwKey} is inside the registered legal set`,
    solved.receipt.capacityMinimumUnderUniformPolicy === null
    || solved.receipt.legalShapeSet.includes(solved.receipt.capacityMinimumUnderUniformPolicy));
}

const maxFeasibleTotalAtSolverWidths = (hwKey) => {
  let maximum = null;
  for (let totalB = minValidTotalB; totalB <= 25000; totalB += 50) {
    const state = stateForBlend({ [hwKey]: 1 });
    state.total = totalB;
    const feasibility = E.feasibility(state, baseContext);
    if (feasibility.legs.filter(leg => !leg.infeasible).length === 1) maximum = totalB;
  }
  return maximum;
};
for (const hwKey of nvl72Keys) {
  const maximum = maxFeasibleTotalAtSolverWidths(hwKey);
  console.log(`SOLVER-SURVIVORSHIP hw=${hwKey} maxFeasibleTotal=${maximum === null ? "NONE" : totalLabel(maximum)} sweep=0.30T..25.00T/0.05T (solver widths)`);
}

console.log("RETIRED-CHANNEL GUARD (LOAD-BEARING)");
topologyGuardCheck("the workloadAtNShard/feasibilityAtNShard channel is gone from the engine surface",
  !("workloadAtNShard" in E) && !("feasibilityAtNShard" in E));
topologyGuardCheck("the fleet DTO no longer carries replicaWidthSensitivity",
  !("replicaWidthSensitivity" in E.workload(currentTopologyState, undefined, baseContext).fleetRenderable));
const R2roofline = await import("../engine-roofline-v22.js").then(m => m.default ?? m);
const k3DomainCase = nonShardCases.find(candidate => candidate.id === "kimi-k3-domain-64-plus");
let caseRejected = false; let caseError = "NO ERROR";
try {
  R2roofline.feasibilityRoofline({ arch: R2roofline.resolveArch("dsr1"), totalB: 5000, hwKey: "gb200",
    precision: "fp8", L: 15500, nShardCase: k3DomainCase });
} catch (error) { caseError = error.message; caseRejected = error.name === "RooflineDataError"; }
console.log(`RETIRED-CHANNEL id=${k3DomainCase.id} result=${caseRejected ? "REJECTED-LOUDLY" : "FAIL"} error=${JSON.stringify(caseError)}`);
topologyGuardCheck("an explicit topology case at the roofline door is rejected LOUDLY (never silently ignored)", caseRejected, caseError);

// Step (e) is checked again after section (f), because those band lines can also be renormalized.
for (const emission of emittedFleetLines) {
  const renormalized = emission.receipts.some(receipt => receipt.renderableLegs < receipt.totalLegs);
  if (emission.numeric && renormalized && !/\brenderableWeightShare=/.test(emission.line) && !emission.disclosureCounted) {
    emission.disclosureCounted = true;
    disclosureFailures++;
  }
}
console.log(`\nHARNESS SUMMARY diagnosticMismatches=${diagnosticMismatches} assertionFailures=${assertionFailures} disclosureFailures=${disclosureFailures} topologyGuardFailures=${topologyGuardFailures} ` +
  `membershipCrossings=${crossings.length} monotonicityViolations=${violations.length}`);
console.log(assertionFailures === 0
  ? "PASS  IM4 numeric and ordering assertions"
  : `FAIL  IM4 numeric and ordering assertions — ${assertionFailures} failure(s)`);
console.log(disclosureFailures === 0
  ? "PASS  IM4 fleet-policy harness disclosure gate"
  : `FAIL  IM4 fleet-policy harness disclosure gate — ${disclosureFailures} omission(s)`);
console.log(topologyGuardFailures === 0
  ? "PASS  IM4 N_shard-only topology guard"
  : `FAIL  IM4 N_shard-only topology guard — ${topologyGuardFailures} failure(s)`);
/* CHANGED 2026-09-20 (im-vet-six-repairs, bq-2895). The line that used to sit here said diagnostic
   mismatches "remain review observations" and the exit code excluded them — so a mismatch printed
   and the harness passed. That is a defensible design only while every diagnostic is genuinely
   undecided, and it stopped being true: the one diagnostic in this file now asserts a property
   this release created. Mismatches reach the exit status from here on. The counter is reported
   separately from assertion failures so a reader can still tell the two registers apart. */
console.log(diagnosticMismatches === 0
  ? "PASS  IM4 diagnostic observations (mismatches now reach the exit code, bq-2895)"
  : `FAIL  IM4 diagnostic observations — ${diagnosticMismatches} mismatch(es), and they are no longer excused`);
process.exit(assertionFailures === 0 && disclosureFailures === 0 && topologyGuardFailures === 0
  && diagnosticMismatches === 0 ? 0 : 1);
