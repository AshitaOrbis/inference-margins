// R2 MIGRATION PROOF — DIFFERENTIAL VECTORS (im4-r2-shipment-plan §1.1 P2a).
// Every harness fixture family is evaluated against the REFERENCE implementation
// (harness/, the 9-round-reviewed pre-R2 contract harness) AND the PRODUCTION
// implementation (site/engine-contracts-v22.js) with BYTE-EQUAL canonical outputs:
// canonical trees, claim IDs, refusal lists, weld tokens, rendered artifacts,
// sidecar entries, and rejection messages. This file is the migration evidence —
// it intentionally imports harness/ (the reference) and therefore lives OUTSIDE the
// release `npm test` chain (run: `npm run test:migration-differential`); the release
// guards separately assert no PRODUCTION source imports harness/.
// Run: node tests/contract-migration-differential.test.mjs
import { createRequire } from "node:module";
import crypto from "node:crypto";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const C = require("../site/engine-contracts-v22.js"); // PRODUCTION
import * as HA from "../harness/contract-algebra.mjs";  // REFERENCE algebra
import * as HC from "../harness/claim-identity.mjs";    // REFERENCE claim identity
import * as HB from "../harness/emission-boundary.mjs"; // REFERENCE boundary

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
const J = JSON.stringify;
const thrownMsg = (fn) => { try { fn(); return null; } catch (e) { return String(e && e.message || e); } };

/* ================= real engine data (the same frozen fixture surface the harness used) ================= */
const med = E.PERSPECTIVES.find((p) => p.id === "median");
const opus = E.MODELS.find((m) => m.id === "opus");
const base = E.applyPresetSettings(opus, med, { mode: "native" });
const ctx = E.scenarioContext(base);
const w = E.workload(base, undefined, ctx);
const feas = E.feasibility(base, ctx);
const bc = E.blendedCosts(base, undefined, ctx);
const solveAt = (policy, totalB = 5000, hw = "gb300") => {
  const st = structuredClone(base); st.total = totalB;
  return E.solveCapacityWidth(hw, st, { ctx, loadedWeightBytesPerParam: policy });
};

/* ================= sha256 fallback correctness (production browser path) ================= */
for (const vec of ["", "abc", "the quick brown fox", "≈57% — non-ASCII → ünïcode ✓ [weld 2/7]",
    "a".repeat(55), "b".repeat(64), "c".repeat(119), J({ nested: [1, 2, { k: "≈" }] })]) {
  const nodeHex = crypto.createHash("sha256").update(vec, "utf8").digest("hex");
  assert(`sha256 fallback: pure-JS digest byte-equal to node:crypto for ${J(vec.slice(0, 24))}… (len ${vec.length})`,
    C.sha256HexJs(vec) === nodeHex, C.sha256HexJs(vec));
}

/* ================= P2a-1: metric keys byte-equal (incl. injectivity probes) ================= */
const keyFixtures = [
  ["margin.unit-serving", { model: "opus", perspective: "median", policyPoint: 0.65, lens: "blend" }],
  ["cost.decode", { model: "opus", perspective: "median", hardware: "gb300", policyPoint: 0.55, lens: "blend" }],
  ["capacity.minWidth", { model: "a|hardware=b", hardware: "c", policyPoint: 1 }],
  ["capacity.minWidth", { model: "a", hardware: "b|hardware=c", policyPoint: 1 }],
  ["capacity.declaredOpWidth", { model: "opus", hardware: "tpu7", policyPoint: 1.05, regime: "balanced" }],
  ["fleet.renderableWeightShare", { model: "opus", perspective: "median", fleet: "na-blend", policyPoint: 0.65 }],
  ["cost.mix", { lens: "blend", policyPoint: 0.65, perspective: "median", model: "opus" }], // insertion-order independence
];
assert("metric keys: every fixture scope produces BYTE-EQUAL keys (reference vs production)",
  keyFixtures.every(([mid, scope]) => HA.metricKey(mid, structuredClone(scope)) === C.metricKey(mid, structuredClone(scope))));
assert("metric keys: rejection messages IDENTICAL for undefined / NaN / -0 dimension values",
  ["hardware", "policyPoint"].every(() => true)
  && thrownMsg(() => HA.metricKey("capacity.minWidth", { model: "opus", hardware: undefined, policyPoint: 1 }))
    === thrownMsg(() => C.metricKey("capacity.minWidth", { model: "opus", hardware: undefined, policyPoint: 1 }))
  && thrownMsg(() => HA.metricKey("capacity.minWidth", { model: "opus", hardware: "gb300", policyPoint: NaN }))
    === thrownMsg(() => C.metricKey("capacity.minWidth", { model: "opus", hardware: "gb300", policyPoint: NaN }))
  && thrownMsg(() => HA.metricKey("capacity.minWidth", { model: "opus", hardware: "gb300", policyPoint: -0 }))
    === thrownMsg(() => C.metricKey("capacity.minWidth", { model: "opus", hardware: "gb300", policyPoint: -0 })));

/* ================= P2a-2: real-DTO trees canonicalize byte-equal ================= */
function feasibilityTree(M, f, tag) {
  return M.tree({
    legs: M.vector(f.legs.map((l) => l.hwKey), Object.fromEntries(f.legs.map((l) => [l.hwKey, M.record({
      weight: M.scalar(l.weight), opBasis: M.scalar(l.opBasis ?? null),
      infeasible: M.scalar(!!l.infeasible), capped: M.scalar(!!l.capped),
      b: M.scalar(l.b ?? null), bDeclared: M.scalar(l.bDeclared ?? null), bFeas: M.scalar(l.bFeas ?? null),
    })]))),
    renderableShare: M.leaf("fleet.renderableWeightShare",
      { model: "opus", perspective: "median", fleet: tag, policyPoint: 0.65 }, f.renderableWeightShare),
    counts: M.record({ renderableLegs: M.scalar(f.renderableLegs), totalLegs: M.scalar(f.totalLegs) }),
  });
}
const workloadScope = (lens) => ({ model: "opus", perspective: "median", policyPoint: 0.65, lens });
function workloadTree(M, wl) {
  return M.tree({
    margin: M.leaf("margin.unit-serving", workloadScope("blend"), wl.margin * 100),
    costMix: M.leaf("cost.mix", workloadScope("blend"), wl.costMix),
    priceMix: M.leaf("price.mix", workloadScope("blend"), wl.priceMix),
    io: M.record({ cIn: M.scalar(wl.cIn), cOut: M.scalar(wl.cOut), cCache: M.scalar(wl.cCache) }),
  });
}
function mcpResultTree(M) {
  return M.tree({
    result: M.record({
      headline: M.record({ marginPct: M.scalar(Math.round(w.margin * 100)), scenario: M.scalar("central"),
        isCentral: M.scalar(false) }),
      costs: M.record({ cOut: M.scalar(bc.cOut), cIn: M.scalar(bc.cIn) }),
      receipt: M.record({ engineRevision: M.scalar(String(E.ENGINE_REVISION)), fleetNote: M.scalar(null) }),
      feasibility: M.vector(feas.legs.map((l) => l.hwKey),
        Object.fromEntries(feas.legs.map((l) => [l.hwKey, M.record({ opBasis: M.scalar(l.opBasis ?? null), weight: M.scalar(l.weight) })]))),
    }),
  });
}
const HAlg = { tree: HA.tree, vector: HA.vector, record: HA.record, scalar: HA.scalar, leaf: HA.leaf };
for (const [name, mk] of [
  ["feasibility legs (mixed-type records)", (M) => feasibilityTree(M, feas, "na-blend")],
  ["workload (record + metric leaves)", (M) => workloadTree(M, w)],
  ["MCP ToolResult nesting", (M) => mcpResultTree(M)],
]) {
  const ref = HA.canonicalTree(mk(HAlg));
  const prod = C.canonicalTree(mk(C));
  assert(`differential [${name}]: canonical tree BYTE-EQUAL (reference vs production)`, J(ref) === J(prod));
}

/* ================= P2a-3: three policy points over the REAL solver ================= */
{
  const capScope = (p) => ({ model: "opus", hardware: "gb300", policyPoint: p });
  const mkGrid = (M) => M.policyLensGrid(M.POLICY_POINTS, ["capacity"], (p) =>
    M.leaf("capacity.minWidth", capScope(p), solveAt(p).capacityMinimumUnderUniformPolicy));
  const hs = HA.sampledSummary(mkGrid({ ...HAlg, policyLensGrid: HA.policyLensGrid, sampledSummary: HA.sampledSummary, POLICY_POINTS: HA.POLICY_POINTS, leaf: HA.leaf }), "capacity");
  const cs = C.sampledSummary(mkGrid(C), "capacity");
  assert("differential [solver grid]: three-point sampled summary BYTE-EQUAL (argMin/argMax computed identically)",
    J(hs) === J(cs), J([hs, cs]));
}

/* ================= P2a-4: claim identity — mint, ablate, aggregate, address ================= */
const mkCentralTree = (M, v) => M.tree({ margin: M.leaf("margin.unit-serving", workloadScope("blend"), v) });
const sharedValue = w.margin * 100;
const verifiedLegs = [
  { id: "leg-a", weight: 0.6, renderableUnderPolicy: true, placementVerified: true },
  { id: "leg-b", weight: 0.4, renderableUnderPolicy: true, placementVerified: true },
];
const verifiedClusters = [{ clusterId: "cluster-1", verified: true }, { clusterId: "cluster-2", verified: true }];
const cleanSpecFor = (M) => ({
  subject: "opus@synthetic-verified", estimand: "margin.unit-serving",
  evidenceBasis: { kind: "synthetic-positive-fixture" }, role: "comparison",
  tree: mkCentralTree(M, sharedValue), requestCentral: true,
  legs: structuredClone(verifiedLegs), clusters: structuredClone(verifiedClusters),
  derivation: { policyTainted: false },
  selectionReceipt: { clean: true, basis: "registry-central" },
});
const hCentral = HC.mintClaim(cleanSpecFor(HAlg));
const cCentral = C.mintClaim(cleanSpecFor(C));
assert("differential [central mint]: both implementations mint central; identities + claim IDs byte-equal",
  HC.isCentral(hCentral) && C.isCentral(cCentral)
  && hCentral.identity === cCentral.identity
  && HB.claimIdOf(hCentral) === C.claimIdOf(cCentral), J([HB.claimIdOf(hCentral), C.claimIdOf(cCentral)]));
const ablations = [
  ["renderableUnderPolicy", { legs: [verifiedLegs[0], { ...verifiedLegs[1], renderableUnderPolicy: false }] }],
  ["placementVerified", { legs: [verifiedLegs[0], { ...verifiedLegs[1], placementVerified: false }] }],
  [">=2 clusters", { clusters: [verifiedClusters[0]] }],
  ["zero policy taint", { derivation: { policyTainted: true } }],
  ["clean selection", { selectionReceipt: { clean: true, basis: "exploratory-forced-pairing" } }],
  ["case-trick selection", { selectionReceipt: { clean: true, basis: "FORCED EXPLORATORY" } }],
  ["result-role prohibition", { role: "result" }],
];
for (const [name, patch] of ablations) {
  const hc = HC.mintClaim({ ...cleanSpecFor(HAlg), subject: `opus@ablate`, ...structuredClone(patch) });
  const cc = C.mintClaim({ ...cleanSpecFor(C), subject: `opus@ablate`, ...structuredClone(patch) });
  assert(`differential [ablation '${name}']: both refuse central with BYTE-EQUAL refusal lists`,
    !HC.isCentral(hc) && !C.isCentral(cc) && J(hc.centralRefusals) === J(cc.centralRefusals),
    J([hc.centralRefusals, cc.centralRefusals]));
}
{
  const hPolicy = HC.mintClaim({ subject: "opus@policy", estimand: "margin.unit-serving",
    evidenceBasis: { kind: "policy-scenario", policyPoint: 0.65 }, role: "result", tree: mkCentralTree(HAlg, sharedValue) });
  const cPolicy = C.mintClaim({ subject: "opus@policy", estimand: "margin.unit-serving",
    evidenceBasis: { kind: "policy-scenario", policyPoint: 0.65 }, role: "result", tree: mkCentralTree(C, sharedValue) });
  assert("differential [coincidence]: numeric coincidence carries zero identity force in BOTH implementations",
    HC.treesCoincide(hCentral, hPolicy) && C.treesCoincide(cCentral, cPolicy)
    && !HC.isCentral(hPolicy) && !C.isCentral(cPolicy)
    && HB.claimIdOf(hPolicy) === C.claimIdOf(cPolicy));
  assert("differential [aggregation]: one policy input poisons the aggregate in BOTH implementations",
    !HC.isCentral(HC.aggregateClaims([hCentral, hPolicy], { ...cleanSpecFor(HAlg), subject: "opus@agg" }))
    && !C.isCentral(C.aggregateClaims([cCentral, cPolicy], { ...cleanSpecFor(C), subject: "opus@agg" })));
  assert("differential [empty slot]: the honest empty comparison slot is BYTE-EQUAL",
    J(HC.emptyComparisonSlot("opus@5T")) === J(C.emptyComparisonSlot("opus@5T")));
}
/* Evidence-basis addressing fixtures: holes, expandos rejected, -0/NaN injective. */
{
  const mkH = (basis, subj) => HC.mintClaim({ subject: subj, estimand: "e", role: "result", evidenceBasis: basis,
    tree: HA.tree({ m: HA.leaf("margin.unit-serving", { ...workloadScope("blend"), model: subj }, 1) }) });
  const mkC = (basis, subj) => C.mintClaim({ subject: subj, estimand: "e", role: "result", evidenceBasis: basis,
    tree: C.tree({ m: C.leaf("margin.unit-serving", { ...workloadScope("blend"), model: subj }, 1) }) });
  for (const [name, basis] of [
    ["object", { k: 1 }], ["array", [1]], ["object-as-array-alias", { "0": 1 }], ["primitive", 1],
    ["sparse Array(1)", { d: Array(1) }], ["dense [undefined]", { d: [undefined] }],
    ["NaN detail", { detail: NaN }], ["-0 detail", { detail: -0 }], ["null detail", { detail: null }],
  ]) {
    assert(`differential [address '${name}']: claimIdOf BYTE-EQUAL across implementations`,
      HB.claimIdOf(mkH(structuredClone(basis) === null ? basis : basis, "s")) === C.claimIdOf(mkC(basis, "s")));
  }
  assert("differential [address]: distinct bases stay distinct in BOTH (holes/alias/injective encodings)",
    HB.claimIdOf(mkH({ d: Array(1) }, "s")) !== HB.claimIdOf(mkH({ d: [undefined] }, "s"))
    && C.claimIdOf(mkC({ d: Array(1) }, "s")) !== C.claimIdOf(mkC({ d: [undefined] }, "s"))
    && HB.claimIdOf(mkH([1], "s")) !== HB.claimIdOf(mkH({ "0": 1 }, "s"))
    && C.claimIdOf(mkC([1], "s")) !== C.claimIdOf(mkC({ "0": 1 }, "s")));
}

/* ================= P2a-5: validation rejections — IDENTICAL error messages ================= */
const rejectionFixtures = [
  ["spread-forged missing-state value", (M) => M.tree({ bad: { ...M.stateLeaf("capacity.minWidth", { model: "opus", hardware: "trn2", policyPoint: 0.65 }, "infeasible", "honest null"), value: 0 } })],
  ["record extra-property smuggle", (M) => M.tree({ r: { kind: "record", fields: { a: M.scalar(1) }, hidden: 1 } })],
  ["string-valued vector itemIds", (M) => M.tree({ v: { kind: "vector", itemIds: "abc", items: {} } })],
  ["grid missing declared cells", (M) => M.tree({ g: { kind: "policy-lens-grid", policyPoints: [0.55, 0.65], lenses: ["a"], cells: {} } })],
  ["unregistered leaf key", (M) => M.tree({ l: { kind: "leaf", key: 'made.up|%|model="x"', state: "present", value: 1 } })],
  ["rogue trailing key segment", (M) => M.tree({ l: { kind: "leaf", key: 'capacity.minWidth|gpus|model="x"|hardware="y"|policyPoint=1|rogue=1', state: "present", value: 1 } })],
  ["noncanonical key alias", (M) => M.tree({ l: { kind: "leaf", key: 'margin.unit-serving|%|model="\\u0078"|perspective="m"|policyPoint=1|lens="b"', state: "present", value: 1 } })],
  ["raw -0 leaf", (M) => M.tree({ l: { kind: "leaf", key: M.metricKey("margin.unit-serving", workloadScope("blend")), state: "present", value: -0 } })],
  ["raw -0 scalar", (M) => M.tree({ r: M.record({ x: { kind: "scalar", type: "number", value: -0 } }) })],
  ["undeclared vector item", (M) => M.tree({ v: { kind: "vector", itemIds: [], items: { hidden: { kind: "leaf", key: "x", state: "missing", value: 0, reason: "r" } } } })],
  ["forged scalar type undefined", (M) => M.tree({ r: M.record({ x: { kind: "scalar", type: "undefined", value: undefined } }) })],
  ["unknown node kind", (M) => M.tree({ r: M.record({ x: { kind: "mystery" } }) })],
  ["span with smuggled property", (M) => M.tree({ l: { kind: "leaf", key: M.metricKey("margin.unit-serving", workloadScope("blend")), state: "present", value: { lo: 1, hi: 2, smuggled: 3 } } })],
  ["non-plain node prototype", (M) => M.tree({ r: Object.assign(Object.create({ smuggled: 1 }), { kind: "record", fields: { a: M.scalar(1) } }) })],
  ["duplicate leaf identities", (M) => M.tree({ a: M.leaf("margin.unit-serving", workloadScope("blend"), 1), b: M.leaf("margin.unit-serving", workloadScope("blend"), 2) })],
  ["undefined discontinuity coordinate", (M) => M.discontinuity("width", { p: undefined }, ["k"])],
  ["-0 discontinuity coordinate", (M) => M.discontinuity("width", { point: -0 }, ["k"])],
  ["BigInt discontinuity coordinate", (M) => M.discontinuity("width", { point: 1n }, ["k"])],
  ["NaN discontinuity coordinate", (M) => M.discontinuity("width", { p: NaN }, ["k"])],
  ["BigInt discontinuity note", (M) => M.discontinuity("width", { p: 1 }, ["k"], 1n)],
  ["expando evidence array", (M) => M.mintClaim({ subject: "s3", estimand: "e3", role: "result",
    evidenceBasis: { detail: Object.assign([], { extra: "provenance" }) },
    tree: M.tree({ m: M.leaf("margin.unit-serving", { ...workloadScope("blend"), model: "s3" }, 1) }) })],
  ["symbol-keyed evidence", (M) => M.mintClaim({ subject: "s4", estimand: "e4", role: "result",
    evidenceBasis: { [Symbol("hidden")]: 1, k: 1 },
    tree: M.tree({ m: M.leaf("margin.unit-serving", { ...workloadScope("blend"), model: "s4" }, 1) }) })],
  ["leading-zero array name", (M) => M.mintClaim({ subject: "r7a", estimand: "e", role: "result",
    evidenceBasis: { detail: Object.assign([1], { "01": "x" }) },
    tree: M.tree({ m: M.leaf("margin.unit-serving", { ...workloadScope("blend"), model: "r7a" }, 1) }) })],
  ["fractional array name", (M) => M.mintClaim({ subject: "r8a", estimand: "e", role: "result",
    evidenceBasis: { detail: Object.assign([1], { "0.5": "x" }) },
    tree: M.tree({ m: M.leaf("margin.unit-serving", { ...workloadScope("blend"), model: "r8a" }, 1) }) })],
  ["signed-zero grid point", (M) => M.policyLensGrid([-0], ["l"], () => M.scalar(1))],
];
const HFull = { ...HAlg, metricKey: HA.metricKey, policyLensGrid: HA.policyLensGrid,
  stateLeaf: HA.stateLeaf, discontinuity: HA.discontinuity, mintClaim: HC.mintClaim };
for (const [name, probe] of rejectionFixtures) {
  const hm = thrownMsg(() => probe(HFull));
  const cm = thrownMsg(() => probe(C));
  assert(`differential [reject '${name}']: BOTH reject with IDENTICAL messages`,
    hm !== null && hm === cm, J([hm, cm]));
}

/* ================= P2a-6: discontinuities constructed AND applied — canonical equality ================= */
{
  const capScope = (p) => ({ model: "opus", hardware: "gb300", policyPoint: p });
  const w055 = solveAt(0.55).capacityMinimumUnderUniformPolicy;
  const w105 = solveAt(1.05).capacityMinimumUnderUniformPolicy;
  const build = (M) => {
    const t0 = M.tree({
      cap055: M.leaf("capacity.minWidth", capScope(0.55), w055),
      cap105: M.leaf("capacity.minWidth", capScope(1.05), w105),
      margin: M.leaf("margin.unit-serving", workloadScope("blend"), sharedValue),
    });
    return M.applyDiscontinuity(t0, M.discontinuity("width", { hardware: "gb300", between: [0.55, 1.05] },
      [M.metricKey("capacity.minWidth", capScope(0.55)), M.metricKey("capacity.minWidth", capScope(1.05))]));
  };
  const ht = build({ ...HFull, applyDiscontinuity: HA.applyDiscontinuity });
  const ct = build(C);
  assert("differential [width discontinuity]: constructed + applied trees canonicalize BYTE-EQUAL",
    J(HA.canonicalTree(ht)) === J(C.canonicalTree(ct)));
}

/* ================= P2a-7: emission boundary — artifacts + sidecars byte-equal ================= */
{
  HB.resetBoundaryForTest(); C.resetBoundaryForTest();
  const weldH = HB.weldClause(bc.fleetRenderable);
  const weldC = C.weldClause(bc.fleetRenderable);
  assert("differential [weld]: the shared weld formatter output is BYTE-EQUAL", weldH === weldC, J([weldH, weldC]));
  assert("differential [display]: displayValue projection is BYTE-EQUAL",
    J(HB.displayValue(sharedValue)) === J(C.displayValue(sharedValue)));
  const ADAPTERS = [["json", HB.jsonAdapter, C.jsonAdapter], ["mcp-text", HB.mcpTextAdapter, C.mcpTextAdapter], ["dom", HB.domAdapter, C.domAdapter]];
  const CLASS_FOR = { json: "mcp-json", "mcp-text": "mcp-text", dom: "hardware-lens-tile" };
  const hStore = HB.makeSidecarStore(); const cStore = C.makeSidecarStore();
  for (const [name, hAd, cAd] of ADAPTERS) {
    HB.registerEmitter(`emitter:${name}`, CLASS_FOR[name], hAd);
    C.registerEmitter(`emitter:${name}`, CLASS_FOR[name], cAd);
    const mkEnv = (M, mint) => {
      const claim = mint({ subject: `opus@${name}`, estimand: "margin.unit-serving",
        evidenceBasis: { kind: "policy-scenario", policyPoint: 0.65 }, role: "result",
        tree: mkCentralTree(M, sharedValue) });
      return { claim, weld: weldC, display: C.displayValue(sharedValue), envelopeFields: bc.fleetRenderable,
        visibleText: `${C.displayValue(sharedValue).displayed}% ${weldC}`,
        leadSentence: `Modeled unit margin ${C.displayValue(sharedValue).displayed}% ${weldC}` };
    };
    const hArt = HB.emit(`emitter:${name}`, mkEnv(HAlg, HC.mintClaim), hStore);
    const cArt = C.emit(`emitter:${name}`, mkEnv(C, C.mintClaim), cStore);
    assert(`differential [adapter '${name}']: rendered artifact BYTE-EQUAL (reference vs production)`,
      hArt === cArt);
    assert(`differential [adapter '${name}']: recovery round-trips BYTE-EQUAL`,
      J(hAd.recover(hArt)) === J(cAd.recover(cArt)));
  }
  assert("differential [sidecar]: entry sets BYTE-EQUAL across implementations",
    J(hStore.entries()) === J(cStore.entries()));
  assert("differential [coverage]: coverage reports BYTE-EQUAL",
    J(HB.coverageReport()) === J(C.coverageReport()));
  /* Boundary rejections: forged label, missing/fabricated/contradictory weld. */
  const policyH = HC.mintClaim({ subject: "p", estimand: "e", role: "result",
    evidenceBasis: { k: 1 }, tree: mkCentralTree(HAlg, 1) });
  const policyC = C.mintClaim({ subject: "p", estimand: "e", role: "result",
    evidenceBasis: { k: 1 }, tree: mkCentralTree(C, 1) });
  HB.registerEmitter("emitter:hero-probe", "hero-tile", HB.domAdapter);
  C.registerEmitter("emitter:hero-probe", "hero-tile", C.domAdapter);
  const boundaryRejects = [
    ["unregistered emitter", (M, cl) => M.emit("emitter:rogue", { claim: cl })],
    ["forged central label", (M, cl) => M.emit("emitter:hero-probe", { claim: { ...cl, identity: "central-verified" } })],
    ["missing weld", (M, cl) => M.emit("emitter:hero-probe", { claim: cl, visibleText: "x" })],
    ["fabricated weld", (M, cl) => M.emit("emitter:hero-probe", { claim: cl, weld: "[weld fabricated]", envelopeFields: bc.fleetRenderable, visibleText: "x [weld fabricated]" })],
    ["weld not inline", (M, cl) => M.emit("emitter:hero-probe", { claim: cl, weld: M.weldClause(bc.fleetRenderable), envelopeFields: bc.fleetRenderable, visibleText: "x", tooltip: M.weldClause(bc.fleetRenderable) })],
  ];
  for (const [name, probe] of boundaryRejects) {
    const hm = thrownMsg(() => probe(HB, policyH));
    const cm = thrownMsg(() => probe(C, policyC));
    assert(`differential [boundary reject '${name}']: BOTH refuse with IDENTICAL messages`, hm !== null && hm === cm, J([hm, cm]));
  }
  /* DOM-mutation audit parity. */
  const hArt = HB.emit("emitter:hero-probe", { claim: policyH, weld: weldH, envelopeFields: bc.fleetRenderable, visibleText: `1% ${weldH}` });
  const cArt = C.emit("emitter:hero-probe", { claim: policyC, weld: weldC, envelopeFields: bc.fleetRenderable, visibleText: `1% ${weldC}` });
  assert("differential [mutation audit]: clean + tampered verdicts BYTE-EQUAL",
    J(HB.domMutationAudit(hArt, policyH)) === J(C.domMutationAudit(cArt, policyC))
    && J(HB.domMutationAudit(hArt.replace("policy-scenario", "central-verified"), policyH))
      === J(C.domMutationAudit(cArt.replace("policy-scenario", "central-verified"), policyC)));
  HB.resetBoundaryForTest(); C.resetBoundaryForTest();
}

/* ================= P2a-8: contract constants byte-equal ================= */
assert("differential [constants]: descriptors, missing states, policy points, roles, identities, clean bases, emitter classes, weld-required classes, discontinuity types ALL BYTE-EQUAL",
  J(HA.METRIC_DESCRIPTORS) === J(C.METRIC_DESCRIPTORS)
  && J(HA.TYPED_MISSING_STATES) === J(C.TYPED_MISSING_STATES)
  && J(HA.POLICY_POINTS) === J(C.POLICY_POINTS)
  && J(HC.CLAIM_ROLES) === J(C.CLAIM_ROLES)
  && J(HC.CLEAN_SELECTION_BASES) === J(C.CLEAN_SELECTION_BASES)
  /* R3 (design memo D-9): production carries the ONE deliberate closed-set amendment —
     the `final-answer` emitter class (weld-required). The frozen reference harness stays
     byte-untouched (must-not-move); the differential asserts the EXACT delta, never a
     loosened comparison. */
  && J([...HB.EMITTER_CLASSES, "final-answer", "executive-summary"]) === J(C.EMITTER_CLASSES)
  && J([...HB.WELD_REQUIRED_CLASSES, "final-answer", "executive-summary"]) === J(C.WELD_REQUIRED_CLASSES)
  && J(HA.DISCONTINUITY_TYPES) === J(C.DISCONTINUITY_TYPES));

console.log(`\n${failures === 0 ? "ALL MIGRATION-DIFFERENTIAL TESTS PASS" : failures + " MIGRATION-DIFFERENTIAL FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
