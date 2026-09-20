// LIVE R2 capacity-width solver contract (feasibility-redesign memo v4.1):
// these pins bind the solver and the selected solve consumed by live rendering. Fixture
// values are verified at live Opus/median traffic lengths; the two review-executed
// counterexamples (redesign R1 review finding 4) are permanent pins.
// Run: node site/tests/capacity-solver-r1.test.mjs
// Twin rule: the ONLY sanctioned differences between this file and its twin are the `// Run:`
// comment line and require(...) path strings; all other bytes must remain identical.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../engine.js");
const ED = require("../engine-data-v22.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

const med = E.PERSPECTIVES.find(p => p.id === "median");
const opus = E.MODELS.find(m => m.id === "opus");
const base = E.applyPresetSettings(opus, med, { mode: "native" });
const ctx = E.scenarioContext(base);
const at = (hw, totalB, opts) => {
  const st = structuredClone(base); st.total = totalB;
  return E.solveCapacityWidth(hw, st, Object.assign({ ctx }, opts));
};

// Capacity must size the live KV cache at the terminal sequence length, not the
// representative average decode position used by the performance roofline.
{ const lengths = require("../engine-roofline-v22.js")
    .resolveTrafficLengths({ profileId: ctx.profileId, ioRatio: base.ioRatio });
  const r = E.solveCapacityWidth("h100", base, { ctx });
  assert("peak-KV split: reference traffic retains L=15,500 for decode and exposes LPeak=16,000 for capacity",
    lengths.L === 15500 && lengths.LPeak === 16000
      && r.receipt.decodeRepresentativeTokens === 15500 && r.receipt.peakKvTokens === 16000,
    JSON.stringify({ lengths, receipt: r.receipt }));
  assert("peak-KV split: default Opus/H100 declared operating-point width is 112 (average-L bug produced 104)",
    r.declaredOperatingPointWidth === 112,
    JSON.stringify({ width: r.declaredOperatingPointWidth,
      row104: r.perWidth.find(row => row.width === 104) })); }
{ const glm = E.MODELS.find(m => m.id === "glm");
  /* im-vet-model-estimates (2026-09-19): the profile is now selected EXPLICITLY instead of taken
     from whatever happens to be this row's default. The case exists to falsify peak-KV sizing at a
     LONG context — it asserts L = 86,062.5 on the next line — and it reached that context only
     because `ncode` was GLM's default. That default moved to the page's Reference convention on
     2026-09-19, which silently turned the case into a 15,500-token one where the declared b = 64
     DOES fit, i.e. into a test that passes by not exercising its own condition. Naming the profile
     keeps the guard pointed at the thing it was built to catch and decouples it from a row's
     default, which is a presentation choice. */
  const st = E.applyPresetSettings(glm, med, { mode: "explicit", profileId: "ncode" });
  st.interact = "balanced";
  const supplied = E.scenarioContext(st);
  const lengths = require("../engine-roofline-v22.js")
    .resolveTrafficLengths({ profileId: supplied.profileId, ioRatio: st.ioRatio });
  const r = E.solveCapacityWidth("gb300", st, { ctx: supplied });
  const widest = r.perWidth[r.perWidth.length - 1];
  assert("peak-KV falsification: GLM/GB300 balanced no longer falsely fits declared b=64",
    lengths.L === 86062.5 && lengths.LPeak === 91125
      && widest.width === 72 && widest.bFeas === 62
      && r.declaredOperatingPointSatisfiable === false
      && r.declaredOperatingPointWidth === null,
    JSON.stringify({ lengths, widest, satisfiable: r.declaredOperatingPointSatisfiable })); }

// Registered model context bounds gate the claim-bearing wrapper before any capacity
// solve. The low-level solver remains abstract, but the public scenario API must not
// emit a receipt or number for a request the model registry says cannot exist.
{ const dsr1Model = E.MODELS.find(m => m.id === "dsr1");
  const st = E.applyPresetSettings(dsr1Model, med, { mode: "explicit", profileId: "reference" });
  st.ioRatio = 162.841; // (162.841 + 1) × OSL 1,000 = 163,841 > maxPos 163,840
  const supplied = { modelId: "dsr1", profileId: "reference", customDonor: "dsr1" };
  let solveRejected = false;
  try { E.solveCapacityWidth("h100", st, { ctx: supplied }); }
  catch (err) { solveRejected = err && err.name === "RooflineDataError" && /context window/i.test(err.message); }
  assert("context bound: direct high-level capacity solve rejects a registered over-limit request",
    solveRejected);
  const f = E.feasibility(st, supplied);
  const wl = E.workload(st, undefined, supplied);
  assert("context bound: public feasibility returns typed no-number legs with no contradictory capacity receipts",
    f.renderableLegs === 0 && f.legs.every(leg =>
      leg.infeasible && leg.opBasis === "context-window-exceeded"
      && leg.contextWindow && leg.contextWindow.state === "exceeded-registered-limit"
      && leg.capacityReceipt === null),
    JSON.stringify(f));
  assert("context bound: workload emits no margin beyond a registered maxPos",
    !Number.isFinite(wl.margin) && wl.fleetRenderable.renderableLegs === 0,
    JSON.stringify(wl)); }

// ---- domain registry shape ----
assert("domains: every HW_ROOFLINE family except rubin carries a domain object; rubin excluded (memo §0-bis)",
  ["gb200", "gb300", "tpu7", "trn2", "trn3", "h800", "h100", "h200", "h20", "ascend"].every(k => ED.HW_DOMAINS[k])
  && ED.HW_DOMAINS.rubin === undefined);
assert("domains: legal shapes are explicit specs, never bare integer ranges",
  Object.values(ED.HW_DOMAINS).every(d =>
    ["range-step", "documented-slices", "node-multiple", "explicit-set"].includes(d.scaleUp.hardwareLegalShapes.kind)));
assert("domains: scale-out tiers are declared but unsearched in R1 (gb200/gb300)",
  ED.HW_DOMAINS.gb200.scaleOut.searchedInR1 === false && ED.HW_DOMAINS.gb300.scaleOut.searchedInR1 === false
  && E.enumerateLegalWidths(ED.HW_DOMAINS.gb300.scaleOut.hardwareLegalShapes).length === 0);

// ---- the owner's cases: the false negative is dead in the live solver ----
assert("owner case: 5T on GB300 solves at width 20 within ONE NVL72 rack (fp8 policy 1.0; live C8 workspace equation)",
  at("gb300", 5000).capacityMinimumUnderUniformPolicy === 20);
assert("owner case: 10T on GB300 solves at width 38 within ONE rack (aggregate-capacity plausible — dive §G.1)",
  at("gb300", 10000).capacityMinimumUnderUniformPolicy === 38);
assert("tpu7@5T solves at width 32 (the old fixed-width-4 false infeasibility is a solver-visible artifact)",
  at("tpu7", 5000).capacityMinimumUnderUniformPolicy === 32);
{ const r = at("gb300", 5000, { loadedWeightBytesPerParam: 0.65 });
  assert("fp4-class planning policy (0.65): 5T on GB300 solves at a NARROWER width than fp8",
    r.capacityMinimumUnderUniformPolicy < 20 && r.receipt.loadedByteValue === 0.65
    && /sensitivity point/.test(r.receipt.loadedByteSource), JSON.stringify([r.capacityMinimumUnderUniformPolicy, r.receipt.loadedByteSource])); }

// ---- the review-executed counterexamples (permanent pins; R1 review finding 4) ----
assert("counterexample pin: trn2@10T has NO legal width in its 64-chip UltraServer domain (honest null, never a rendered infeasible)",
  at("trn2", 10000).capacityMinimumUnderUniformPolicy === null);
assert("counterexample pin: trn2@5T solves exactly at the 64-chip domain edge (legal-shape-aware, 16-step grid)",
  at("trn2", 5000).capacityMinimumUnderUniformPolicy === 64);
{ const r = at("h100", 5000, { bDeclared: 96 });
  assert("counterexample pin: h100@5T declared-batch (b=96) is NOT satisfiable within the 144 domain; capacity floor = 72",
    r.capacityMinimumUnderUniformPolicy === 72 && r.declaredOperatingPointWidth === null
    && r.declaredOperatingPointSatisfiable === false, JSON.stringify([r.capacityMinimumUnderUniformPolicy, r.declaredOperatingPointWidth])); }
// The live renderer must consume the selected row from the exact capacity solve. Recomputing
// feasibility from the performance precision tuple silently discards both component placement
// and the sampled loaded-bytes policy, changing batches and shipped throughput.
{ const R = require("../engine-roofline-v22.js");
  const dsv4 = E.MODELS.find(m => m.id === "dsv4");
  const st = E.applyPresetSettings(dsv4, med, { mode: "native" });
  st.interact = "batch";
  const supplied = E.scenarioContext(st);
  const arch = R.resolveArch(supplied.modelId, supplied.customDonor);
  const lengths = R.resolveTrafficLengths({ profileId: supplied.profileId, ioRatio: st.ioRatio });
  const solved = E.solveCapacityWidth("h100", st, {
    ctx: supplied,
    bDeclared: ED.OPERATING_POINTS.h100.balanced.b,
    capacityTargetObjective: "batch-rule base fit",
    capacityTargetBatchSource: "OPERATING_POINTS.h100.balanced (base batch used to select the batch-rule capacity width)",
  });
  const width = Math.max(...solved.receipt.legalShapeSet);
  const selected = solved.perWidth.find(row => row.width === width);
  const rendered = R.renderPoint({
    arch, activeB: st.active, totalB: st.total, hwKey: "h100", regime: st.interact,
    precision: st.precision, stackMult: st.stackMult, profileId: supplied.profileId,
    ioRatio: st.ioRatio, declaredOperatingWidth: width, capacitySolve: solved,
  });
  assert("live placement: DSV4/H100 batch caps at the selected peak-KV placement row (105), not uniform-tuple feasibility",
    selected.bFeas === 105 && rendered.op.bFeas === selected.bFeas && rendered.op.b === 105,
    JSON.stringify({ selected, op: rendered.op }));
  assert("batch-rule receipt: the internal balanced base is a capacity target, not a caller override",
    solved.receipt.capacityTargetBatch === ED.OPERATING_POINTS.h100.balanced.b
      && solved.receipt.capacityTargetObjective === "batch-rule base fit"
      && /OPERATING_POINTS\.h100\.balanced/.test(solved.receipt.capacityTargetBatchSource)
      && !("bDeclared" in solved.receipt) && !("bDeclaredSource" in solved.receipt),
    JSON.stringify(solved.receipt));

  const opusPolicy = E.applyPresetSettings(opus, med, { mode: "native" });
  opusPolicy.interact = "balanced";
  const opusCtx = E.scenarioContext(opusPolicy);
  const opusArch = R.resolveArch(opusCtx.modelId, opusCtx.customDonor);
  const policySolve = E.solveCapacityWidth("h100", opusPolicy, {
    ctx: opusCtx, loadedWeightBytesPerParam: 0.55,
  });
  const policyWidth = policySolve.declaredOperatingPointWidth;
  const policyRow = policySolve.perWidth.find(row => row.width === policyWidth);
  const policyRendered = R.renderPoint({
    arch: opusArch, activeB: opusPolicy.active, totalB: opusPolicy.total, hwKey: "h100",
    regime: opusPolicy.interact, precision: opusPolicy.precision, stackMult: opusPolicy.stackMult,
    profileId: opusCtx.profileId, ioRatio: opusPolicy.ioRatio,
    declaredOperatingWidth: policyWidth, capacitySolve: policySolve,
  });
  assert("live policy sensitivity: Opus/H100 @0.55 uses peak-KV solver bFeas=98, not the performance-tuple recomputation",
    policyRow.bFeas === 98 && policyRendered.op.bFeas === 98 && policyRendered.op.b === 96,
    JSON.stringify({ policyRow, op: policyRendered.op }));

  let forgedRejected = false;
  try {
    R.renderPoint({
      arch, activeB: st.active, totalB: st.total, hwKey: "h100", regime: st.interact,
      precision: st.precision, stackMult: st.stackMult, profileId: supplied.profileId,
      ioRatio: st.ioRatio, declaredOperatingWidth: width,
      capacitySolve: { perWidth: [{ width, bFeas: 999999, wResidentBytes: 1 }] },
    });
  } catch (error) {
    forgedRejected = /trusted capacity solve/.test(String(error));
  }
  assert("sealed handoff: renderPoint rejects a caller-forged capacity feasibility object", forgedRejected);

  let rawResidencyRejected = false;
  try {
    const widths = E.enumerateLegalWidths(ED.HW_DOMAINS.h100.scaleUp.hardwareLegalShapes);
    R.capacityWidthSolve({
      arch, totalB: st.total, hwKey: "h100", precision: st.precision, LPeak: lengths.LPeak,
      widths, bDeclared: 192,
      componentResidency: Object.fromEntries(widths.map(candidate => [candidate, 1])),
    });
  } catch (error) {
    rawResidencyRejected = /raw componentResidency is forbidden/.test(String(error));
  }
  assert("sealed handoff: the public solver rejects raw component-residency maps", rawResidencyRejected);
}
// The explicit supplied context is the authority for model geometry. The width solve and
// render must not silently read different Custom donors from state vs context.
{ const custom = E.MODELS.find(m => m.id === "custom");
  const st = E.applyPresetSettings(custom, med, { mode: "native" });
  st.customDonor = "dsr1";
  const supplied = { ...E.scenarioContext(st), customDonor: "llama70" };
  const r = E.solveCapacityWidth("h100", st, { ctx: supplied });
  assert("supplied Custom donor controls the capacity solve as well as rendering",
    r.declaredOperatingPointWidth === 24, `got width ${r.declaredOperatingPointWidth} (state donor=${st.customDonor}, context donor=${supplied.customDonor})`); }

// ---- contract properties ----
{ const r = at("gb300", 5000);
  assert("receipt: full anti-shopping surface present (objective, policy source, legal set + version, tier, bandwidth class, placement status, rejection reason, observed-vs-analyst)",
    r.receipt.objective === "capacity-min under uniform policy"
    && Array.isArray(r.receipt.legalShapeSet) && r.receipt.legalShapeSetVersion === "r1-domains-v1"
    && r.receipt.bandwidthClass === "nvlink-rack" && /UNVERIFIED/.test(r.receipt.placementModelStatus)
    && typeof r.receipt.nextSmallerWidthRejectionReason === "string"
    && /never an observed deployment/.test(r.receipt.observedVsAnalyst), JSON.stringify(Object.keys(r.receipt))); }
// R1-impl R2 F6 vector, R3 D-10 POPULATED: fullMemory from the solve's declared-point
// satisfiability (weights + peak KV + the flat 10%-HBM reserve, while runtime-specific
// workspace demand and fragmentation stay unverified); economics = the typed evidence-quality pair;
// slo populated ONLY where a published latency-preferred tier exists (gb300: none →
// UNVERIFIED, first-class).
{ const g = at("gb300", 5000);
  assert("statusVector: ALL FIVE components pinned — weightCapacity FEASIBLE-under-policy / topologyLegal within-registered-shapes / fullMemory populated (weights+peak-KV+flat reserve scope-led) / slo UNVERIFIED (no published tier) / economics evidence-quality pair (R3 D-10)",
    g.statusVector.weightCapacity === "FEASIBLE-under-policy"
    && g.statusVector.fullMemory === "weights+peak-KV+flat-10%-HBM-reserve fit at the declared operating point under the policy (runtime-specific workspace demand and fragmentation unmodeled)"
    && g.statusVector.topologyLegal === "within-registered-scale-up-shapes"
    && g.statusVector.slo === "UNVERIFIED"
    // b9 M1: gb300 relabelled fitted → analyst-set-assumed-op (its calibration observation
    // carries measured:null and an assumed batch — the "fitted" label was false).
    && g.statusVector.economics === "evidence-quality: analyst-set-assumed-op throughput · analyst-set price"
    && Object.keys(g.statusVector).length === 5);
  // R3 D-10 slo, both populated branches (tpu7 owns the ONLY published tier, 64):
  const tp = at("tpu7", 5000);
  assert("D-10 slo: tpu7@5T solved width within the published latency-preferred tier (64)",
    tp.statusVector.slo === "within-published-latency-preferred-tier");
  const tpBig = at("tpu7", 20000);
  assert("D-10 slo: tpu7@20T exceeds the published tier — SLO-RISK note, never infeasibility",
    /^SLO-RISK: solved width \d+ exceeds the published latency-preferred tier \(64\)/.test(tpBig.statusVector.slo)
    && tpBig.renderableUnderPolicy === true);
  // R3 D-10: the typed economics channel rides the receipt (aggregation never string-parses)
  assert("D-10 receipt.evidenceQuality carries the TYPED classes",
    g.receipt.evidenceQuality && g.receipt.evidenceQuality.throughputClass === "analyst-set-assumed-op"
    && g.receipt.evidenceQuality.priceClass === "analyst-set");
  // R3 D-11: role-width evidence annotations resolve fail-closed (gb300 has 2 audited
  // MLPerf rows; trn2's absence finding stays absent)
  assert("D-11 roleWidthEvidence: gb300 emits its two audited MLPerf role widths",
    g.receipt.roleWidthEvidence.length === 2
    && g.receipt.roleWidthEvidence.every(r => r.evidenceClass === "A")
    && g.receipt.roleWidthEvidence.map(r => r.role).sort().join(",") === "decode,prefill");
  assert("D-11 roleWidthEvidence: trn2 absence finding — empty, clause empty-string",
    at("trn2", 5000).receipt.roleWidthEvidence.length === 0
    && E.roleWidthEvidenceClause(at("trn2", 5000).receipt.roleWidthEvidence) === "");
  const tpReceipt = at("tpu7", 5000).receipt;
  const ascendReceipt = at("ascend", 5000).receipt;
  const liveReceiptText = JSON.stringify([g.receipt, tpReceipt, ascendReceipt]);
  assert("capacity receipts describe current limitations without obsolete milestone promises",
    !/exact catalog = R2|role split = R3|not-evaluated-in-R1|gain placement verification via the R2/.test(liveReceiptText)
    && /exact per-shape catalog is unregistered/.test(tpReceipt.conservativeSubsetNote || "")
    && /exact legal slice catalog is unregistered/.test(ascendReceipt.legalSetProvenanceNote || "")
    && g.receipt.role === "uniform-width across roles (published role widths are evidence annotations only; role-split solving is deferred)"
    && g.receipt.modelDivisibilityStatus === "not evaluated by the current capacity solver (receipted)",
    liveReceiptText);
  // b9 M1: gb300's declared batch moved 128 → 64 (a declared workload midpoint replacing an
  // assumed anchor), which relaxes its capacity requirement: declared-op width 26 → 22.
  assert("two booleans: gb300@5T renderableUnderPolicy=true (declared-op 22 in-domain), placementVerified=false (closed model)",
    g.renderableUnderPolicy === true && g.placementVerified === false && g.declaredOperatingPointWidth === 22);
  const hh = at("h100", 5000);
  assert("NEW-P1 fix: h100@5T declared-batch unsatisfiable ⇒ renderableUnderPolicy FALSE despite a capacity floor",
    hh.capacityMinimumUnderUniformPolicy === 72 && hh.declaredOperatingPointSatisfiable === false && hh.renderableUnderPolicy === false);
  // R1-impl R3 NEW-P1 residual: null is NOT renderable — an UNREGISTERED operating regime
  // (no derivable bDeclared) must fail closed, never ride the capacity floor to true.
  const nr = (() => { const st = structuredClone(base); st.total = 5000; st.interact = "unregistered-regime";
    return E.solveCapacityWidth("gb300", st, { ctx }); })();
  assert("NEW-P1 fail-closed: unregistered regime ⇒ declaredOperatingPointSatisfiable null ⇒ renderableUnderPolicy FALSE (capacity floor alone never renders)",
    nr.capacityMinimumUnderUniformPolicy === 20 && nr.declaredOperatingPointSatisfiable === null
    && nr.renderableUnderPolicy === false, JSON.stringify([nr.capacityMinimumUnderUniformPolicy, nr.declaredOperatingPointSatisfiable, nr.renderableUnderPolicy]));
  // R4 NEW-P1 residual: non-positive / non-finite declared batches are REJECTED at the
  // solver input (bFeas >= 0 holds at any width, so b<=0 would mint a vacuous
  // declaredOperatingPointSatisfiable=true); wrapper overrides propagate the rejection.
  { const R = require("../engine-roofline-v22.js");
    const full = E.enumerateLegalWidths(ED.HW_DOMAINS.gb300.scaleUp.hardwareLegalShapes);
    for (const bad of [0, -1, 0.5, NaN, Infinity]) {
      let threw = false;
      try { R.capacityWidthSolve({ arch: { mode: "moe" }, totalB: 5000, hwKey: "gb300", precision: "fp8", LPeak: 16000, widths: full, bDeclared: bad }); }
      catch (e) { threw = /finite batch >= 1/.test(String(e)); }
      assert(`fail-closed: bDeclared ${String(bad)} rejected (no vacuous declared-op satisfiability)`, threw);
    }
    let threwWrap = false;
    try { at("gb300", 5000, { bDeclared: 0 }); } catch (e) { threwWrap = /finite batch >= 1/.test(String(e)); }
    assert("fail-closed: wrapper caller-override bDeclared 0 rejected end-to-end", threwWrap); }
  const t10 = at("trn2", 10000);
  assert("two booleans: trn2@10T domain-infeasible ⇒ renderableUnderPolicy=false, weightCapacity INFEASIBLE-in-domain",
    t10.renderableUnderPolicy === false && t10.statusVector.weightCapacity === "INFEASIBLE-in-domain"); }
// R1-impl R2 F7: the conservative-subset weld is a receipt REGRESSION, not a comment.
{ const tp = at("tpu7", 5000);
  assert("tpu7 receipt welds the conservative-subset limitation (intermediate multiples-of-4 may narrow the minimum)",
    /conservative common-shape subset/.test(tp.receipt.conservativeSubsetNote || "")
    && /multiples-of-4/.test(tp.receipt.conservativeSubsetNote || "")); }
// R1-impl R2 F5: candidate schema — 10/10 domains carry typed arrays, distinct from legal shapes.
{ const doms = ED.HW_DOMAINS;
  assert("candidates: all 10 domains carry observedWorkerCandidates arrays (empty = the Trainium absence finding)",
    Object.values(doms).every(d => Array.isArray(d.observedWorkerCandidates)));
  const allCands = Object.values(doms).flatMap(d => d.observedWorkerCandidates);
  assert("candidates: every entry is typed {width, sourceCaseId, evidenceClasses[]}",
    allCands.every(cd =>
      Number.isInteger(cd.width) && ("sourceCaseId" in cd) && Array.isArray(cd.evidenceClasses) && cd.evidenceClasses.length > 0));
  // R1-impl R3 F5: NO bare-null refs — every sourceCaseId resolves into the width-case
  // registries ∪ WORKER_CANDIDATE_SOURCES, and the resolved row agrees with its referrer.
  const wcs = ED.WORKER_CANDIDATE_SOURCES;
  const resolvableIds = new Set([
    ...Object.keys(wcs),
    ...ED.NVL72_TOPOLOGY_SENSITIVITY.cases.map(c => c.id),
    ...ED.TPU7_TOPOLOGY_SENSITIVITY.cases.map(c => c.id),
    ...ED.TRAINIUM_TOPOLOGY_SENSITIVITY.cases.map(c => c.id),
  ]);
  assert("candidates: every sourceCaseId is a non-null string resolving into the registries (no bare nulls)",
    allCands.every(cd => typeof cd.sourceCaseId === "string" && resolvableIds.has(cd.sourceCaseId)),
    JSON.stringify(allCands.filter(cd => typeof cd.sourceCaseId !== "string" || !resolvableIds.has(cd.sourceCaseId))));
  assert("candidate-source registry: rows fully typed {width, role, evidenceClass, label, citation}; class from the closed enum",
    Object.values(wcs).every(row => Number.isInteger(row.width) && typeof row.role === "string"
      && (row.evidenceClass in ED.TOPOLOGY_EVIDENCE_CLASSES)
      && typeof row.label === "string" && row.label.length > 0
      && typeof row.citation === "string" && row.citation.length > 0));
  // R4 F5 residual: agreement is UNIVERSAL — sensitivity-case referrers resolve too,
  // no candidate class escapes the width + evidence-class cross-check.
  // R5 F5 residual: RETIRED (superseded) rows never resolve, and class agreement is
  // EXACT set equality — a single-class candidate cannot ride a retired multi-class row.
  const resolvedRow = (id) => {
    if (id in wcs) return { width: wcs[id].width, classes: [wcs[id].evidenceClass] };
    const c = [...ED.NVL72_TOPOLOGY_SENSITIVITY.cases, ...ED.TPU7_TOPOLOGY_SENSITIVITY.cases,
      ...ED.TRAINIUM_TOPOLOGY_SENSITIVITY.cases].find(cs => cs.id === id && !cs.superseded);
    return c ? { width: c.value, classes: c.evidenceClasses } : null;
  };
  const classesEqual = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  assert("candidate agreement is UNIVERSAL and EXACT: width + full evidence-class set equality with the resolved row; retired rows unresolvable",
    allCands.every(cd => { const row = resolvedRow(cd.sourceCaseId);
      return row && row.width === cd.width && classesEqual(cd.evidenceClasses, row.classes); }),
    JSON.stringify(allCands.filter(cd => { const row = resolvedRow(cd.sourceCaseId);
      return !(row && row.width === cd.width && classesEqual(cd.evidenceClasses, row.classes)); })));
  assert("retired analyst-default-8 does not resolve (supersession honored)", resolvedRow("analyst-default-8") === null);
  assert("candidates: trn2/trn3 empty (the consult's absence finding, structural)",
    doms.trn2.observedWorkerCandidates.length === 0 && doms.trn3.observedWorkerCandidates.length === 0);
  assert("ascend: domainCardinality 384 (N_domain) is structural and distinct from worker candidates 128/144",
    doms.ascend.domainCardinality.value === 384 && doms.ascend.domainCardinality.dimension === "N_domain"
    && JSON.stringify(doms.ascend.observedWorkerCandidates.map(cd => cd.width)) === "[128,144]");
  // R1-impl R3 F5: ascend's legal set EQUALS its candidates — that coincidence must be a
  // DECLARED evidence limitation (provenance-flagged + receipted), never silent construction.
  assert("ascend: legal-set/candidate coincidence carries the observed-only provenance flag",
    doms.ascend.scaleUp.hardwareLegalShapes.provenance === "observed-worker-widths-only"); }
{ const a = at("ascend", 1000);
  assert("ascend receipt welds the observed-only legal-set limitation (coincidence by evidence limitation, not construction)",
    /observed worker widths only/.test(a.receipt.legalSetProvenanceNote || "")
    && /UNVERIFIED/.test(a.receipt.legalSetProvenanceNote || ""), JSON.stringify(a.receipt.legalSetProvenanceNote));
  assert("legalSetProvenanceNote is null where the legal set is NOT candidate-seeded (gb300)",
    at("gb300", 5000).receipt.legalSetProvenanceNote === null); }
// R1-impl R2 F3: both bypass shapes rejected by the sealed roofline.
{ const R = require("../engine-roofline-v22.js");
  for (const bad of [[19], [72]]) {
    let threw = false;
    try { R.capacityWidthSolve({ arch: { mode: "moe" }, totalB: 5000, hwKey: "gb300", precision: "fp8", LPeak: 16000, widths: bad }); }
    catch (e) { threw = /must EQUAL/.test(String(e)); }
    assert(`sealed: width list ${JSON.stringify(bad)} rejected (full-set equality)`, threw);
  } }
assert("naming rule: the solver never emits a field named nShard or 'solved width' semantics (capacityMinimumUnderUniformPolicy only)",
  !("nShard" in at("gb300", 5000)) && !("widthSolved" in at("gb300", 5000)));
assert("fail-closed: rubin (no domain) returns null; unknown hw throws inside the roofline",
  E.solveCapacityWidth("rubin", base, { ctx }) === null);
{ let threw = false; const R = require("../engine-roofline-v22.js");
  try { R.capacityWidthSolve({ arch: {}, totalB: 5000, hwKey: "gb300", precision: "fp8", LPeak: 16000, widths: [] }); }
  catch (e) { threw = /explicit non-empty legal width list/.test(String(e)); }
  assert("fail-closed: the roofline solver rejects an empty/implicit width list (domain enumerator is the only door)", threw); }
// blindness: the solver reads no margins/costs
assert("blindness: solver + enumerator read no cost/margin functions",
  !/costPerMtok|marginOnHw|blendedCost|hwHourCost/.test(E.solveCapacityWidth.toString() + E.enumerateLegalWidths.toString()));
// R1-impl R3 F8: the solver boundary is ALSO sealed at the export surface — full-set
// equality over module export names. A renamed wrapper alias (an innocuous export
// forwarding solver output across the boundary) cannot appear without moving these pins;
// combined with the worker-emitter freeze this closes the lexical-scan evasion.
{ const R = require("../engine-roofline-v22.js");
  /* R2 re-mint (shipment plan §2 "export-name pins ... RE-MINT (new exports enumerated in the
     manifest)"): ADDED CAPACITY_POLICY_BAND, evaluateAtPolicyBand, policyCapacityClause
     (§1.6/§1.10); RETIRED feasibilityAtNShard, workloadAtNShard, replicaWidthSensitivityClause,
     selectWidthCaseDefault, widthCaseApplicable (legacy width-case channel — §4.3 core). */
  /* R3 re-mint (design memo, manifest family 10): ADDED the D-1/D-2 membership API
     (deriveDefaultFleetMembership, membershipSensitivity, membershipExclusionClause),
     the D-10 population API (legStatusSlots, aggregateFleetStatusVector, worstByOrder +
     the three predeclared order constants + FULL_MEMORY_FIT), the D-2e authoredRange
     API (inHalfOpenRange, withinAuthoredRange, authoredRangeLabel), the D-11 formatter
     (roleWidthEvidenceClause), and the D-9 result surface (finalAnswer). */
  /* b9 M3 re-mint (delta manifest, energy/electricity dimension): ADDED the energy
     surface + procurement-basis machinery (memo research/b9-m3-energy-memo.md §3.3) —
     PROCUREMENT_BASES/PROCUREMENT_BASIS_NAMES/DIVE_PROCUREMENT_BASES, procurementBasisFor,
     legProcurementBasis, assertUniformProcurementBasis (the fail-closed mixing trap),
     opPowerKw (the ONE operating-power resolver), energyPerMtok, energyMix, fleetEnergy;
     fix-round: displayedProcurementBasis (gate P1 — the LENS-basis display resolver).
     Consciously edited, per this pin's own rule. */
  // b9 M4 (delta manifest): enginePin +4 — customFleetSource, isCustomFleetId,
  // registerCustomFleetSource, resolveFleetLegs (the custom-fleet leg path + source
  // registration; memo research/b9-m45-ui-memo.md §3.1). Deliberate sealed-set change.
  /* b9 M6: the export surface gains SEVEN names (153 → 160) — the exec-summary row registry, its renderer (exported so T-4 can mutate THROUGH the real formatter rather than beside it) and the pinned copy
     constants the suite pins the same bytes from (one source of bytes for page, MCP and Worker),
     plus the TCO assumption-vector formatter D-6t reads from the live state. The pin stays a
     FULL-SET seal: adding a name is a deliberate, reviewed act, never an alias door. */
  /* b9 spec-decode LEVER (chunk A) re-mint: ADDED 6 names — the gate tick constant and
     domain (SPECDEC_GATE_TICK, SPECDEC_BOUNDS), THE ONE predicate and its state wrapper
     (stackAtMtpFreeTick, specDecGateAllows), the typed baseline-status reader
     (specDecBaselineStatusFor) and the ENGINE BACKSTOP (specDecFactor). The backstop is
     exported so the suite can assert the invariant is TOTAL — that every DOM-less caller
     is covered — rather than inferring it from UI behaviour. Consciously edited, per this
     pin's own rule; ratified design (memo frozen v16, esc-...20c444d8). */
  /* b9 spec-decode LEVER (kernel element 2) re-mint: ADDED 4 names — the ORDERED disposition
     ladder (specDecDisposition), the ratified per-leg reason copy and its formatter
     (SPECDEC_REASON_COPY, specDecReasonText), and the typed per-leg result
     (specDecLegDisclosure). The ladder is exported because T-22 asserts it over the full
     24-combination cross-product against a LITERAL table — a test that re-derived its oracle
     from the function under test would prove only self-consistency. Consciously edited. */
  /* b9 spec-decode LEVER (kernel element 3, manifest rows 6/7/21) re-mint: ADDED 6 names — the
     three CANONICAL CLAIM CONSTANTS (SPECDEC_PORTABLE_TICK, SPECDEC_GATE_SEMANTICS,
     SPECDEC_CONSERVATISM) and the three pinned gate lines composed from them (SPECDEC_WHY_LINE,
     SPECDEC_RESET_LINE, SPECDEC_REPLAY_WHY_LINE). They are exported because the suite must pin
     the SAME bytes the page renders: the claim these carry drifted across two separate review
     rounds while it lived as four independent literals, and a second copy in a test would be a
     fifth place for it to drift. Consciously edited, per this pin's own rule. */
  /* b9 spec-decode LEVER (kernel element 3, manifest rows 8/22-26) re-mint: ADDED 3 names —
     SPECDEC_SECTION_TITLE and SPECDEC_CONTROL_LABEL (the ratified section title and control label,
     named constants so SECTIONS and the tip's own title read ONE definition rather than two
     literals that can drift), and SPECDEC_TIP_HEAD (the head of the ratified tip, pinned as its own
     constant so the tip's composition names its head instead of eliding it — an oracle with an
     ellipsis in it is not an oracle). Consciously edited, per this pin's own rule. */
  /* b9 spec-decode LEVER (codec rows) re-mint: ADDED 1 name — specDecTokenConsistent, THE ONE
     shared cross-field codec rule. It is exported because the encoder and the decoder must run the
     SAME predicate: an encoder that can mint a token its own decoder rejects produces links that
     copy successfully and then silently fail to restore, which is the M4 P0-1 failure mode. The
     per-field domain check stays in leverDomainViolation; this is the cross-field one, and a diff
     carrying only what differs cannot express it. Consciously edited. */
  /* b9 spec-decode LEVER (correction lifetime) re-mint: ADDED 1 name — specDecCorrectionNotice,
     the engine-owned formatter for the ratified state-level notice. Same pattern and same reason as
     SPECDEC_REASON_COPY: the manifest files row 15 under site/app.js because that is where it
     RENDERS, and the bytes live in the engine because that is where the suite can pin them — one
     source of bytes for page, MCP and Worker. Consciously edited. */
  /* row 499 follow-on re-mint (the slider change-set): ADDED marginBandsPerDial (the per-dial band
     derivation the presentation ruling requires), bandLeadBasisClause (the sentence declaring which
     algorithmic-lead basis a band was computed on — engine-side so it is testable without a browser
     and emittable by any surface that emits a band), and legsInFamily / familyGroupOverrides (which
     legs a family-scoped range reaches, and which of them carried their own value). All four are
     DISCLOSURE or DERIVATION surfaces over ranges the reader or an adjudicator declared; none
     changes a computed margin, and 0 of the 180 pre-existing render states move. Consciously
     edited, per this pin's own rule. */
  /* CENTROID WIRING (bq-231 / M8, 2026-08-12-13): + centroidOnSum — the exact mean-mix
     construction (reference parity + trap rows in mix-band.test.mjs).
     COUNCIL F3 (2026-08-13): + normalizeModifiedIdentities — the ONE staleness rule shared by
     encoder and sender UI (pinned in traffic-contract). */
  /* d-im-h800 (2026-08-18, owner note aca09d): +19 — the fit-transfer-assumption surface: NVLINKCAP_BOUNDS,
     NVLINKCAP_SLOPE_STEP, NVLINKCAP_ANCHOR_KEY, NVLINKCAP_ELIGIBLE, NVLINKCAP_SECTION_TITLE,
     NVLINKCAP_CONTROL_LABEL, the four pinned tip constants, NVLINKCAP_REASON_COPY, nvlinkCapLineageFor,
     nvlinkCapCounterfactual, nvlinkCapPhaseDisposition, nvlinkCapLegCode, nvlinkCapReasonText,
     nvlinkCapLegDisclosure, nvlinkCapFactor, nvlinkCapReadout. Consciously edited, per this pin's own
     rule; the WIDE-hash re-mint note in render-parity-r1.test.mjs carries the delta evidence. */
  /* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): +3 read-only
     basis derivations — blendedLessorSpread, lessorSpread and marginOnBasis. */
  /* im-arc T1 fix (Sol review 2026-08-22, finding P1-1): +1 pure renderer-row
     derivation — stackRowsFor; consciously re-minted under this sealed export contract. */
  const enginePin = ["BAND_LEAD_BASIS","BAND_MAX_CORNER_DIALS","CAPACITY_BYTES_POLICY","CAPACITY_POLICY_BAND","DATA_AS_OF","DEFAULTS","DEFAULTS_EPOCH","DEFAULT_FLEET_ID","DIVE_PROCUREMENT_BASES","DOSSIERS","EMPTY_BUCKET_STATEMENT","ENGINE_REVISION","EXEC_SUMMARY_ROWS","EXPLORATION_ORDER_BASIS","FAMILY_BOUNDS","FAMILY_GROUP_KEYS","FAMILY_STATE_KEY","FA_MUST_NOT_BE_CALLED_FRAME","FA_MUST_NOT_BE_CALLED_VERBATIM","FLAGSHIP_SCOPE","FLEETS","FORM_DEBT_NOT_A_RESULT","FULL_MEMORY_FIT","GEN_TIMELINE","HW","HW_ORDER","INTERACT_ENUM_KEYS","INTERLOCK_STATES","INTERLOCK_UNLOCK_WARNING","INTERLOCK_WHY","LANDING_DEFAULT_PERSP_ID","LOW_EVIDENCE_COPY","MARGIN_BUCKETS","MARGIN_CLAIMS","MIN_CLUSTER_SUPPORT_SHARE","MIX_AFFINE_EPS","MIX_MAX_BLOCKS","MIX_SHARE_BOUNDS","MODELS","MODEL_OWNED_KEYS","MTP_ROW_COPY","NEGATIVE_FINDINGS_STATEMENT","NVLINKCAP_ANCHOR_KEY","NVLINKCAP_BOUNDS","NVLINKCAP_CONTROL_LABEL","NVLINKCAP_ELIGIBLE","NVLINKCAP_REASON_COPY","NVLINKCAP_SECTION_TITLE","NVLINKCAP_SLOPE_STEP","NVLINKCAP_TIP_HEAD","NVLINKCAP_WHAT_IT_DOES","NVLINKCAP_WHAT_IT_IS_NOT","NVLINKCAP_WHAT_THE_ENGINE_SAYS","PERSPECTIVES","PERSPECTIVE_SPACE_KEYS","PRECISION_ENUM_KEYS","PRECISION_TIER_MAP","PRICE_EVIDENCE_ORDER","PROCUREMENT_BASES","PROCUREMENT_BASIS_NAMES","REFERENCE_LEVER_PIN","RETIRED_PERSPECTIVES","RUBIN","SCENARIO_BOUNDS","SECTIONS","SLO_STATUS_ORDER","SPECDEC_BOUNDS","SPECDEC_CONSERVATISM","SPECDEC_CONTROL_LABEL","SPECDEC_GATE_SEMANTICS","SPECDEC_GATE_TICK","SPECDEC_PORTABLE_TICK","SPECDEC_REASON_COPY","SPECDEC_REPLAY_WHY_LINE","SPECDEC_RESET_LINE","SPECDEC_SECTION_TITLE","SPECDEC_TIP_HEAD","SPECDEC_WHY_LINE","SPECIFIED_LEVER_KEYS","SWEEP_DISCLAIMER","THROUGHPUT_EVIDENCE_ORDER","TIPS","TITLE_MAX_CHARS","TOTAL_CASES","TOTAL_CASE_SCOPE","TRAFFIC_MODES","TRAFFIC_PROFILES","TREND_DEFAULTS","TREND_GROUP_KEYS","TREND_LAB_NOTES","TREND_MONTHS_BOUNDS","TREND_RATES","TREND_SOFT_WARN_MONTHS","aggregateFleetStatusVector","applyDial","applyModelSwitchWhileModified","applyPresetSettings","assertUniformProcurementBasis","authoredRangeLabel","bandHandleDefaults","bandLeadBasisClause","blendBlocksFromRanges","blendWeights","blendedCost","blendedCosts","blendedLessorSpread","bucketForMargin","centralEligibilityDecision","centroidOnSum","changedFieldsFromCentral","claimBucketRelations","claimsForBucket","computeMix","costPerMtok","customFleetSource","decodeScenario","deriveDefaultFleetMembership","deriveInterlockFor","dialBounds","dialId","dialsFromRanges","displayedProcurementBasis","encodeScenario","energyMix","energyPerMtok","enumerateLegalWidths","evaluateAtPolicyBand","execSummaryRowTokens","explorationComputedBucket","explorationFlagshipMargin","explorationFlagshipWorkload","familyFactor","familyGroupOverrides","familyOf","feasibility","finalAnswer","fleetBaselineBlend","fleetEnergy","fleetEvidenceProfile","fleetRenderableClause","fleetRenderableDisclosure","formCorrectionDebt","heroSuppressionDecision","hardwareRow","hwHourCost","hwHourParts","inHalfOpenRange","interlockAfterEdit","interlockAfterEditChecked","interlockGroupOf","interlockInvariantHolds","interlockLockedGroup","interlockTokenConsistent","isCustomFleetId","landingHeroSuppressed","legProcurementBasis","legStatusSlots","legsInFamily","lensSpan","lensSpanMembershipNote","lessorSpread","leverDomainViolation","leverOverlapWarnings","leverThroughputMult","makeScenarioContext","marginBand","marginBandsPerDial","marginDriftNote","marginOnBasis","marginOnHw","matchTrafficProfile","membershipExclusionClause","membershipSensitivity","migrateV2Traffic","mixBand","mixRangesFromRanges","normalizeLinkTitle","normalizeModifiedIdentities","normalizePerspId","nvlinkCapCounterfactual","nvlinkCapFactor","nvlinkCapLegCode","nvlinkCapLegDisclosure","nvlinkCapLineageFor","nvlinkCapPhaseDisposition","nvlinkCapReadout","nvlinkCapReasonText","opPowerKw","overlayDivergesFromReplay","pairingSeverity","pairingWarning","pinReferenceLevers","policyCapacityClause","procurementBasisFor","projectCentresOntoSum","provenanceTierLabel","rankExplorations","reconcileLinkTraffic","registerCustomFleetSource","registerScenarioContext","resolveFleetLegs","resolveTraffic","restoreModifiedLinkState","restoreSavedPresetState","roleWidthEvidenceClause","sanitizeScenarioDiff","scenarioContext","selectDefaultFleet","solveCapacityWidth","specDecBaselineStatusFor","specDecCorrectionNotice","specDecDisposition","specDecFactor","specDecGateAllows","specDecLegDisclosure","specDecReasonText","specDecTokenConsistent","stackAtMtpFreeTick","stackRowsFor","statedReadingClause","tcoAssumptionVector","tokPerS","trendBaselineFor","trendDefaultMonths","trendFactor","trendLabNote","withinAuthoredRange","workload","workloadOnHw","worstByOrder"];
  /* MIX-BAND re-mint (owner ruling q-sliders-fleet-util-point, 2026-08-09; delta manifest
     research/b9-delta-manifests/mix-band-delta-manifest.md): ADDED the feasible-mix API — `mixBand`
     and its three helpers (`blendBlocksFromRanges`, `projectCentresOntoSum`, `mixRangesFromRanges`)
     plus the constants `MIX_MAX_BLOCKS`, `MIX_AFFINE_EPS`, `MIX_SHARE_BOUNDS`. Like the margin-band
     API above it is a READ-ONLY derivation over states this engine already builds: it computes no
     new quantity, it evaluates the EXISTING margin at the vertices of the polytope a declared set of
     share ranges cuts out of the simplex. `mixRangesFromRanges` is the separator that keeps a
     coupled axis out of `dialsFromRanges`, so its presence here is load-bearing rather than
     convenience. Consciously edited, per this pin's own rule. */
  /* row 499 re-mint, second pass (owner note 507081): ADDED the margin-band API — `marginBand`
     plus the two small helpers that describe a dial (`applyDial`, `dialId`) and the corner budget
     `BAND_MAX_CORNER_DIALS`. It is a READ-ONLY derivation over states this engine already builds:
     it computes no new quantity, it evaluates the existing margin at corners of a declared box.
     Consciously edited, per this pin's own rule. */
  /* row 499 re-mint (delta manifest research/b9-delta-manifests/row499-preset-structure-delta-manifest.md):
     ADDED LANDING_DEFAULT_PERSP_ID — the id of the preset the page OPENS on. It is a selection
     constant, not a result surface: no computed value reads it, and the WIDE render grid proves
     it (0 of the 180 pre-existing model x perspective states moved). Consciously edited, per this
     pin's own rule. */
  /* b9 M2 re-mint (delta manifest family 9): ADDED the form-correction debt API
     (formCorrectionDebt + FORM_DEBT_NOT_A_RESULT). This is a DISCLOSURE surface, not a
     result surface — it sizes what re-expressing a legacy-representation leg in the
     topology-aware representation would be worth WITHOUT re-deriving η, which is exactly
     why it is not a repaired estimate (memo §3.5). Consciously edited, per this pin's own rule. */
  /* im-arc T2 (memo research/im-arc-t2-sections-memo.md §2): consciously add the
     four section-composition entry points. The old sealed list remains literal above;
     sorting these explicit additions retains exact full-set equality. */
  enginePin.push("assertSectionsTyped", "composeSections", "mixProcurementBasis", "resolveFleetSections", "sectionBand");
  /* im-arc T3 (plan §1 T3 / §4, owner answer d-20260822-4c26 2026-08-22):
     consciously add the fleet-composer, coverage-renderer and shared-schema surface.
     These are pure registry/state derivations; the WIDE digest remains separately sealed. */
  enginePin.push("COMPANY_MODELS", "bandSchema", "companyForModel", "composeFleetFromDcRows",
    "coverageClassForDonor", "coverageForFleetSections", "coverageLedgerForModel", "coverageSentenceParts", "dcRegions",
    "fleetModeRenderOptions", "fleetSectionsSchema", "registryRowClass", "registryRows",
    "registryPlanningRentHr","registryPlanningRentReceipt", "registrySectionFromRow", "validateFleetSections");
  /* im-arc T4 fold (2026-08-24), memo §§1.5, 2, 2.1, 4: the fold adds nine pure derivations to the
     sealed surface — the quote registry's two selectors, the capex-scope and PUE-class resolvers,
     the dated default-band table, the capital-recovery factor/increment/disclosure trio, the tier
     helper that exists precisely to prove a display tier carries no arithmetic, the one coverage
     resolver, and the exec-summary state builder that reads its region by id. Every one is a pure
     function over the registries; the WIDE digest stays separately sealed. */
  enginePin.push("DC_SCHEMA", "RENT_POLICY", "RENT_QUOTES", "capexProvenanceFor", "capitalRecoveryDisclosure", "capitalRecoveryFactor",
    "capitalRecoveryIncrementHr", "clusterOverheadFor", "coverageForPreset", "execSummaryRowState",
    "pueBandForClass", "registeredCapexFor", "rentQuoteByClass", "rentQuotesFor", "tcoDefaultBands", "tierRenderOptions");
  /* im-arc T4 fold ROUND 4 (2026-08-25), memo :41/:123: reader-entered capex requires its input
     SCOPE, so two more pure derivations join the sealed surface — the per-leg overhead resolver
     (which is what makes a reader's declared scope win over the registry row's for a capex the
     reader stated) and the effective-clustered-capex preview the memo asks the UI and MCP to
     show. Both are pure functions over a validated fleet; no WIDE digest moved. */
  enginePin.push("clusterOverheadForLeg", "readerCapexPreview");
  enginePin.sort();
  // R2 re-mint: ADDED assertDeclaredOperatingWidth (the sealed declared-width door, §4.3 core).
  const rooflinePin = ["CUSTOM_DONOR_BOUNDS","RooflineDataError","RooflineUnitError","archFormsUsed","assertDeclaredOperatingWidth","assertHwRowUnits","capacityWidthSolve","contextWindowStatus","decodeCustomDonor","decodeRoofline","encodeCustomDonor","fAttnPerPos","fabricBytesPerPos","feasibilityRoofline","kvBytesPerToken","prefillRoofline","rdEnumerateLegalWidths","renderPoint","resolveArch","resolveHwRoofline","resolveOperatingPoint","resolvePrecisionTuple","resolveTrafficLengths"];
  assert("export-surface pin: site/engine.js export names full-set sealed (no alias door)",
    JSON.stringify(Object.keys(E).sort()) === JSON.stringify(enginePin), JSON.stringify(Object.keys(E).sort()));
  assert("export-surface pin: site/engine-roofline-v22.js export names full-set sealed (no alias door)",
    JSON.stringify(Object.keys(R).sort()) === JSON.stringify(rooflinePin), JSON.stringify(Object.keys(R).sort())); }
// R1-impl R4 F8 residual: name pins cannot cover existing export BODIES — scan them ALL.
// Every exported engine function except the solver entry itself must be solver-free; a body
// edit routing solver output through an already-rendered export (e.g. provenanceTierLabel,
// consumed by app.js and both MCP claim paths) now trips this scan regardless of name pins,
// file hashes, or the hand-listed render-path scan.
/* R2 INVERSION (shipment plan §2, capacity-solver row "3 no-co-emission scans ... INVERT in the
   same commit"): the R1 negative scan ("everything is solver-free") becomes the POSITIVE
   boundary — solver output reaches rendered surfaces ONLY via the REGISTERED render-path
   exports below; every other export stays solver-free. The replacement ships WITH the
   inversion (this assertion + the P5 sink-coverage gate), never as a bare deletion. */
{ const RENDER_PATH_EXPORTS = ["workload", "workloadOnHw", "marginOnHw", "feasibility",
    "blendedCosts", "blendedCost", "tokPerS", "costPerMtok", "policyCapacityClause",
    "fleetRenderableDisclosure", "fleetEvidenceProfile", "selectDefaultFleet",
    "landingHeroSuppressed", "evaluateAtPolicyBand", "explorationFlagshipWorkload",
    "explorationFlagshipMargin", "explorationComputedBucket", "rankExplorations",
    "encodeScenario", "lensSpan", "applyModelSwitchWhileModified", "restoreModifiedLinkState",
    "restoreSavedPresetState",
    // R3 (design memo D-1/D-6/D-10; deliberate, reviewed allowlist additions — the
    // gate flagged these on introduction, as designed): the membership derivation +
    // its sensitivity record consume renderableUnderPolicy by definition; the
    // per-leg status population reads the solve's satisfiability; applyPresetSettings
    // is the D-2 seed chokepoint (binds the derived default blend at preset time).
    "deriveDefaultFleetMembership", "membershipSensitivity", "legStatusSlots",
    "applyPresetSettings", "finalAnswer",
    /* mix-band consult enactment (2026-08-10; the gate flagged this on introduction, as designed).
       `mixBand` reads `renderableUnderPolicy` for TWO reasons, and both are disclosure duties rather
       than a new use of the solve. First, the SURVIVOR-SET REGIME check that licenses its exactness
       claim: with the renderable set fixed, renormalizing over survivors makes the objective
       linear-fractional, which still attains extrema at vertices, so the condition to test is
       whether that set is constant across the feasible region. Second, the edge-renormalization
       disclosure — the standing fleet-renderable notice describes the scenario ON SCREEN, i.e. the
       band's centre, so a band EDGE that lands weight on an unservable leg renormalizes where no
       existing surface reaches. It consumes the solve to REPORT on it; it computes no capacity
       itself and derives no width. */
    "mixBand"];
  const offenders = Object.entries(E).filter(([k, v]) => typeof v === "function"
    && k !== "solveCapacityWidth" && !RENDER_PATH_EXPORTS.includes(k)
    && /solveCapacityWidth|capacityWidthSolve|capacityMinimumUnderUniformPolicy|declaredOperatingPoint|renderableUnderPolicy|CAPACITY_BYTES_POLICY|HW_DOMAINS/.test(v.toString())).map(([k]) => k);
  assert("R2 positive boundary (export-body-wide): solver identifiers appear ONLY in the registered render-path exports; every other export is solver-free",
    offenders.length === 0, JSON.stringify(offenders));
  // the registered render path DOES consume the solver (the wiring is live, not vestigial)
  const consuming = RENDER_PATH_EXPORTS.filter((k) => typeof E[k] === "function"
    && /solveCapacityWidth|renderableUnderPolicy|capacityReceipt|policyCapacityClause|evaluateAtPolicyBand|landingHeroSuppressed/.test(E[k].toString()));
  assert("R2 positive boundary: the registered render path actually consumes the solver channel (non-vacuous inversion; workload consumes THROUGH blendedCosts)",
    consuming.includes("workloadOnHw") && consuming.includes("feasibility") && consuming.includes("blendedCosts"),
    JSON.stringify(consuming)); }
// policy firewall at the data level: CAPACITY_BYTES_POLICY is not the performance tuple
assert("firewall: CAPACITY_BYTES_POLICY.fp4 (0.65 planning default) differs from the fp4 performance sW (0.5-class) by design",
  E.CAPACITY_BYTES_POLICY.fp4 === 0.65);

// ---- R1 no-co-emission proof (legacy freeze; memo §0 P1-7) ----
// The solver's outputs are unreachable from every render path in R1: no live emitter
// function's source references the solver, and the legacy width clause still renders
// its pre-R1 text (parity guard covers the values; this covers the wiring).
/* R2 INVERSION (render-path scan): the render path now MUST carry the solver story — the
   shared welded policy clause names the policy identity (or the placement basis) on every
   fleet disclosure (§1.10; replaces the retired legacy width-sensitivity clause). */
{ const clause = E.policyCapacityClause(E.blendedCosts(base, undefined, ctx).fleetRenderable);
  assert("R2 welded policy clause: names the loaded-bytes policy identity + solver provenance on the flagship fleet",
    /loaded-bytes planning policy \(1 B\/param/.test(clause) && /solver output — never an observed deployment/.test(clause), clause.slice(0, 160));
  // R3 (Row 0): the clean DEFAULT is policy-clean by construction (h100 filtered out
  // pre-blend), so the unclean-leg reason now fixtures on a USER-CHOSEN blend that
  // re-includes h100 — the R2 welds are unchanged on scenario surfaces (D-3 contract).
  assert("R3 filtered default: the flagship clean default has ZERO policy-unclean legs (exclusion happens pre-blend, not via capped rendering)",
    !/not renderable under this policy/.test(clause), clause.slice(0, 240));
  const userBlend = structuredClone(base);
  userBlend.total = 5000; // FA re-anchor (memo J-9): h100 is policy-clean at the revised default size; the capped-reason weld fixtures on the 5T size case, where batch-96 is unsatisfiable
  userBlend.blend = { ...userBlend.blend, h100: 8 };
  E.registerScenarioContext(userBlend, ctx);
  const userClause = E.policyCapacityClause(E.blendedCosts(userBlend, undefined, ctx).fleetRenderable);
  assert("R2 welded policy clause: every policy-unclean leg carries its typed reason (h100 capped, USER-chosen blend)",
    /not renderable under this policy: h100/.test(userClause) && /rendered CAPPED at the widest legal width/.test(userClause), userClause.slice(0, 240));
  const dsr1 = E.MODELS.find((m) => m.id === "dsr1");
  const dstate = E.applyPresetSettings(dsr1, med, { mode: "native" });
  const dclause = E.policyCapacityClause(E.blendedCosts(dstate, undefined, E.scenarioContext(dstate)).fleetRenderable);
  assert("R2 welded policy clause (placement branch): a placement-engaged fleet names the component-placement basis, never the policy scalar",
    /component-placement registry/.test(dclause) && /placement verified/.test(dclause) && !/B\/param/.test(dclause), dclause.slice(0, 200)); }
// R1-impl P1-8 retained after shipment: every production emission boundary (site app,
// MCP server sources, build scripts) remains free of the low-level solver door
// identifiers; live consumers must use the reviewed engine wrappers.
{ const { readFileSync, readdirSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const root = new URL("../../", import.meta.url).pathname;
  const files = ["site/app.js", "build-grounding-ledger.mjs", "build-research-html.mjs",
    "mcp-server/worker/package.json"]; // R4 NEW-P2: ship-config scripts are scanned too
  const walk = (dir) => { for (const f of readdirSync(join(root, dir))) {
    const rel = dir + "/" + f; const st = statSync(join(root, rel));
    /* 2026-08-22 Step 0 before im-arc T1: fa4a6da/f53301e added a generated,
       gitignored report archive whose source text legitimately mentions these
       identifiers. Match render-parity's exact generated-dir exclusion; authored
       Worker sources remain inside the boundary scan. */
    if (st.isDirectory()) { if (!/node_modules|dist/.test(rel) && rel !== "mcp-server/worker/src/gen") walk(rel); }
    else if (/\.(ts|js|mjs)$/.test(f)) files.push(rel); } };
  walk("mcp-server/src");
  try { walk("mcp-server/worker"); } catch (e) { /* worker dir optional */ }
  /* R2 INVERSION (boundary-wide): surfaces now legitimately consume the solver's DTO
     FIELDS (renderableUnderPolicy, placementVerified, capacityReceipt, statusVector) —
     but the SOLVER DOOR stays sealed to them: no surface file may reference the door
     identifiers (the roofline solve entry, the domain registry, the policy table).
     Positive boundary: DTO consumption via engine wrappers only; door access is
     engine-internal. Surface COMPLETENESS is the P5 sink-coverage gate's job. */
  const doorHits = files.filter(f => {
    try { return /capacityWidthSolve|CAPACITY_BYTES_POLICY|HW_DOMAINS|WEIGHT_PLACEMENT/.test(readFileSync(join(root, f), "utf8")); }
    catch (e) { return false; }
  });
  assert("R2 positive boundary (boundary-wide): no surface file (app.js, MCP sources, build scripts) touches the solver DOOR identifiers — DTO fields only, via engine wrappers",
    doorHits.length === 0, JSON.stringify(doorHits));
  const appSrc = readFileSync(join(root, "site/app.js"), "utf8");
  assert("R2 positive boundary: app.js consumes the solver via the emitter-layer wrappers (landing gate + policy band), never the door",
    /landingHeroSuppressed|selectDefaultFleet/.test(appSrc) && /evaluateAtPolicyBand/.test(appSrc)
    && !/solveCapacityWidth\(/.test(appSrc));
  /* R2 RETIREMENT (shipment plan §2 "solver-identifier occurrence count (20) | RETIRE —
     replacement = the P5 one-to-one coverage gate; retirement + replacement recorded
     together"): the count tripwire guarded against helper indirection while the solver
     was UNWIRED; with the render path legitimately consuming it, a raw occurrence count
     has no stable meaning. Its replacement — tests/sink-coverage.test.mjs (occurrence-
     indexed multiset one-to-one + mutation probes) — must exist and be release-chained. */
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert("R2 retirement replacement: the P5 sink-coverage gate is in the release chain (occurrence-count pin retired)",
    /sink-coverage\.test\.mjs/.test(pkg.scripts.test)); }
/* R2 (shipment plan §2 "legacy-width-clause freeze | RETIRE — replaced by the welded policy
   clause pin (same commit)"): the legacy clause + its export are GONE; the policy clause is
   pinned above (R2 welded policy clause assertions) and the retirement is structural here. */
{ assert("R2 retirement: replicaWidthSensitivityClause and the legacy width-case channel are no longer exported",
    !("replicaWidthSensitivityClause" in E) && !("workloadAtNShard" in E) && !("feasibilityAtNShard" in E)
    && !("selectWidthCaseDefault" in E) && !("widthCaseApplicable" in E)); }

console.log(`\n${failures === 0 ? "ALL CAPACITY-SOLVER TESTS PASS" : failures + " CAPACITY-SOLVER FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
