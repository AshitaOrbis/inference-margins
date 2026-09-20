// R2 PRODUCTION CONTRACT SUITE (memo §0-quinquies; council synthesis "Cheapest next
// action" — the Empiricist spec; hardened by harness reviews R1–R9, all findings).
// MIGRATED (im4-r2-shipment-plan §1.1 P2b): every import below is the PRODUCTION
// module site/engine-contracts-v22.js — no reference-only (harness/) module is
// exercised; the migration proof lives in tests/contract-migration-differential
// .test.mjs (byte-equal differential vectors, reference vs production).
// PASS BAR: semantic identity and the pointwise metric tree survive EVERY
// adapter; no test depends on field spelling or forbidden numeric values.
// Run: npm run test:contract
import { createRequire } from "node:module";
import crypto from "node:crypto";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const {
  POLICY_POINTS, metricKey, leaf, stateLeaf, scalar, record, vector,
  policyLensGrid, sampledSummary, discontinuity, applyDiscontinuity, tree,
  treesSemanticallyEqual, treeLeafKeys, canonicalize: canonicalizeProbe,
  mintClaim, isCentral, aggregateClaims, treesCoincide, emptyComparisonSlot,
  CLEAN_SELECTION_BASES,
  EMITTER_CLASSES, WELD_REQUIRED_CLASSES, registerEmitter, emit, coverageReport,
  registeredClasses, resetBoundaryForTest, weldClause, displayValue,
  makeSidecarStore, claimIdOf, resolvePointer, machineDocOf,
  jsonAdapter, mcpTextAdapter, domAdapter, domMutationAudit, recoveredEqualsLive,
  sha256HexJs,
} = require("../site/engine-contracts-v22.js");
/* R2 §4.4: discovery now runs through the PRODUCTION scanner (tests/sink-scanner.mjs)
   — the last harness import is gone (P2d boundary guard); the harness scanner stays
   archived as the reference implementation, imported by nothing in the release chain. */
import { buildRegistry, claimBearingClasses } from "./sink-scanner.mjs";

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
const throws = (fn, re) => { try { fn(); return false; } catch (e) { return re.test(String(e)); } };

/* ================= real engine data (read-only, frozen surface) ================= */
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

/* ================= H-1: independent sink discovery vs the registry =================
   R2 §4.4 (P5): the production scanner runs the COMPLETE release source graph with
   fail-closed classification and occurrence-indexed stable sink IDs. The full multiset
   one-to-one gate + mutation probes live in tests/sink-coverage.test.mjs (the release
   gate this suite's per-class identity check is a subset of — plan §2 P4 disposition:
   the 410-site digest/≥330 floor is SUPERSEDED by the pinned sink registry). */
{
  const reg = buildRegistry(new URL("../", import.meta.url).pathname);
  assert("discovery (production scanner): every discovered site across the COMPLETE source graph is classified (fail-closed on unmatched)",
    reg.unmatched.length === 0 && reg.classifiedCount > 0 && reg.claimSinks.length > 0,
    JSON.stringify(reg.unmatched.slice(0, 3)));
  assert("discovery (production scanner): claim-bearing sink IDs are occurrence-indexed (duplicate-line groups carry distinct occ indices)",
    reg.claimSinks.some((s) => s.occ > 0)
    && reg.claimSinks.every((s, i, a) => a.findIndex((x) => x.id === s.id) === i),
    "no duplicate-line groups or colliding IDs");
  const discoveredClasses = claimBearingClasses(reg.claimSinks.map((s) => ({ disposition: { class: s.class } })));
  assert("discovery: ALL TEN claim-bearing classes are independently discovered (R6 + R3 D-9 + b9 M6 D-6m: the final-answer and executive-summary classes join the closed set; nothing is exempt-by-design)",
    JSON.stringify(discoveredClasses)
    === JSON.stringify(["evidence-board", "executive-summary", "final-answer", "hardware-lens-tile", "hero-tile", "identity-strip", "mcp-json", "mcp-text", "report-dossier", "share-string"]),
    JSON.stringify(discoveredClasses));
  assert("discovery: registry and discovered claim classes are IDENTICAL sets (registry === discovery)",
    JSON.stringify(discoveredClasses) === JSON.stringify([...EMITTER_CLASSES].sort()));
}

/* ================= three policy points over the REAL solver ================= */
const capScope = (p) => ({ model: "opus", hardware: "gb300", policyPoint: p });
const capGrid = policyLensGrid(POLICY_POINTS, ["capacity"], (p) =>
  leaf("capacity.minWidth", capScope(p), solveAt(p).capacityMinimumUnderUniformPolicy));
{
  const s = sampledSummary(capGrid, "capacity");
  assert("three policy points: real solver widths populate the grid; argMin/argMax COMPUTED",
    s.points === 3 && s.argMin === 0.55 && s.argMax === 1.05 && s.min <= s.max && /no continuity implied/.test(s.label),
    JSON.stringify(s));
}

/* ================= H-3: REAL DTOs are losslessly representable ================= */
function feasibilityTree(f, tag) {
  return tree({
    legs: vector(f.legs.map((l) => l.hwKey), Object.fromEntries(f.legs.map((l) => [l.hwKey, record({
      weight: scalar(l.weight), opBasis: scalar(l.opBasis ?? null),
      infeasible: scalar(!!l.infeasible), capped: scalar(!!l.capped),
      b: scalar(l.b ?? null), bDeclared: scalar(l.bDeclared ?? null), bFeas: scalar(l.bFeas ?? null),
    })]))),
    renderableShare: leaf("fleet.renderableWeightShare",
      { model: "opus", perspective: "median", fleet: tag, policyPoint: 0.65 }, f.renderableWeightShare),
    counts: record({ renderableLegs: scalar(f.renderableLegs), totalLegs: scalar(f.totalLegs) }),
  });
}
const workloadScope = (lens) => ({ model: "opus", perspective: "median", policyPoint: 0.65, lens });
function workloadTree(wl) {
  return tree({
    margin: leaf("margin.unit-serving", workloadScope("blend"), wl.margin * 100),
    costMix: leaf("cost.mix", workloadScope("blend"), wl.costMix),
    priceMix: leaf("price.mix", workloadScope("blend"), wl.priceMix),
    io: record({ cIn: scalar(wl.cIn), cOut: scalar(wl.cOut), cCache: scalar(wl.cCache) }),
  });
}
const realFeasTree = feasibilityTree(feas, "na-blend");
const realWorkloadTree = workloadTree(w);
// An MCP-result-shaped record (headline + costs + receipt + nested feasibility),
// mirroring shape.ts's ToolResult nesting — mixed types, nested vectors.
const mcpResultTree = tree({
  result: record({
    headline: record({ marginPct: scalar(Math.round(w.margin * 100)), scenario: scalar("central"),
      isCentral: scalar(false) }),
    costs: record({ cOut: scalar(bc.cOut), cIn: scalar(bc.cIn) }),
    receipt: record({ engineRevision: scalar(String(E.ENGINE_REVISION)), fleetNote: scalar(null) }),
    feasibility: vector(feas.legs.map((l) => l.hwKey),
      Object.fromEntries(feas.legs.map((l) => [l.hwKey, record({ opBasis: scalar(l.opBasis ?? null), weight: scalar(l.weight) })]))),
  }),
});
for (const [name, t] of [["feasibility legs (mixed-type records)", realFeasTree],
    ["workload (record + metric leaves)", realWorkloadTree],
    ["MCP ToolResult nesting", mcpResultTree]]) {
  const art = jsonAdapter.render({ claim: mintClaim({ subject: `real@${name}`, estimand: "dto-fidelity",
    evidenceBasis: { kind: "real-instance" }, role: "result", tree: t }) });
  const rec = jsonAdapter.recover(art);
  assert(`real DTO lossless: ${name} round-trips the JSON adapter with semantic identity intact`,
    recoveredEqualsLive(rec.tree, t));
}
assert("honest empty vector: zero renderable legs is representable",
  vector([], {}).itemIds.length === 0);

/* ================= synthetic policy-equals-central fixture ================= */
const sharedValue = w.margin * 100;
const centralTree = tree({ margin: leaf("margin.unit-serving", workloadScope("blend"), sharedValue) });
const policyTree = tree({ margin: leaf("margin.unit-serving", workloadScope("blend"), sharedValue) });
const verifiedLegs = [
  { id: "leg-a", weight: 0.6, renderableUnderPolicy: true, placementVerified: true },
  { id: "leg-b", weight: 0.4, renderableUnderPolicy: true, placementVerified: true },
];
const verifiedClusters = [{ clusterId: "cluster-1", verified: true }, { clusterId: "cluster-2", verified: true }];
const cleanSpec = {
  subject: "opus@synthetic-verified", estimand: "margin.unit-serving",
  evidenceBasis: { kind: "synthetic-positive-fixture" }, role: "comparison",
  tree: centralTree, requestCentral: true,
  legs: verifiedLegs, clusters: verifiedClusters,
  derivation: { policyTainted: false },
  selectionReceipt: { clean: true, basis: "registry-central" },
};
const centralClaim = mintClaim(cleanSpec);
const policyClaim = mintClaim({ subject: "opus@policy", estimand: "margin.unit-serving",
  evidenceBasis: { kind: "policy-scenario", policyPoint: 0.65 }, role: "result", tree: policyTree });
assert("positive central test: a fully placement-verified comparison fixture CAN mint central",
  isCentral(centralClaim) && centralClaim.identity === "central-verified");
assert("numeric coincidence carries ZERO identity force: identical trees, independent identities",
  treesCoincide(centralClaim, policyClaim) && !isCentral(policyClaim));
assert("identity is an unforgeable capability: a literal claiming central-verified fails isCentral",
  !isCentral({ ...policyClaim, identity: "central-verified" }));
assert("result-role prohibition: the same clean evidence under role=result refuses central",
  !isCentral(mintClaim({ ...cleanSpec, subject: "opus@result-role", role: "result" })));
assert("monotone fail-closed aggregation: one policy input poisons the aggregate",
  !isCentral(aggregateClaims([centralClaim, policyClaim], { ...cleanSpec, subject: "opus@agg" })));
assert("the comparison slot may be honestly EMPTY (owner Q1 default)",
  (() => { const s = emptyComparisonSlot("opus@5T"); return s.empty && /no verified central comparator/.test(s.statement) && !isCentral(s); })());

/* ---- v4.1(ii): precondition ablations, each independently fail-closed ---- */
const ablations = [
  ["renderableUnderPolicy", { legs: [verifiedLegs[0], { ...verifiedLegs[1], renderableUnderPolicy: false }] }],
  ["placementVerified", { legs: [verifiedLegs[0], { ...verifiedLegs[1], placementVerified: false }] }],
  [">=2 clusters", { clusters: [verifiedClusters[0]] }],
  ["zero policy taint", { derivation: { policyTainted: true } }],
  ["clean selection", { selectionReceipt: { clean: true, basis: "exploratory-forced-pairing" } }],
];
for (const [name, patch] of ablations) {
  const c = mintClaim({ ...cleanSpec, subject: `opus@ablate-${name}`, ...patch });
  assert(`ablation '${name}': removing this single precondition fails closed`,
    !isCentral(c) && c.centralRefusals.length > 0, JSON.stringify(c.centralRefusals));
}
/* H-10: the closed selection discriminator has no lexical bypass */
assert("H-10: selection basis 'FORCED EXPLORATORY' (case trick) is refused — closed enum, no prose scanning",
  !isCentral(mintClaim({ ...cleanSpec, subject: "opus@case-trick",
    selectionReceipt: { clean: true, basis: "FORCED EXPLORATORY" } })));
assert("H-10: the clean enum is closed and structural",
  CLEAN_SELECTION_BASES.length === 2 && !isCentral(mintClaim({ ...cleanSpec, subject: "opus@novel-basis",
    selectionReceipt: { clean: true, basis: "novel-unreviewed-basis" } })));

/* ================= H-7: canonical-key injectivity + name independence ================= */
assert("H-7: metric keys are injective (a '|dim=' payload inside a value cannot collide)",
  metricKey("capacity.minWidth", { model: "a|hardware=b", hardware: "c", policyPoint: 1 })
  !== metricKey("capacity.minWidth", { model: "a", hardware: "b|hardware=c", policyPoint: 1 }));
assert("H-7: an undefined dimension value is rejected",
  throws(() => metricKey("capacity.minWidth", { model: "opus", hardware: undefined, policyPoint: 1 }), /must be a scalar/));
assert("H-7: top-level node names carry NO semantic identity (source-field rename leaves trees equal)",
  treesSemanticallyEqual(tree({ margin: leaf("margin.unit-serving", workloadScope("blend"), 5) }),
    tree({ renamedField: leaf("margin.unit-serving", workloadScope("blend"), 5) })));
assert("H-7: record FIELD names ARE semantic (a DTO field rename changes identity)",
  !treesSemanticallyEqual(tree({ r: record({ cOut: scalar(1) }) }), tree({ r: record({ cOutRenamed: scalar(1) }) })));
assert("H-7: duplicate leaf metric identities within one tree are rejected",
  throws(() => tree({ a: leaf("margin.unit-serving", workloadScope("blend"), 1),
    b: leaf("margin.unit-serving", workloadScope("blend"), 2) }), /duplicate leaf metric identities/));

/* ================= H-8: recursive validation kills the zero-coercion channel ================= */
assert("H-8: a spread-forged missing-state node carrying value:0 is REJECTED at tree construction",
  throws(() => tree({ bad: { ...stateLeaf("capacity.minWidth", { model: "opus", hardware: "trn2", policyPoint: 0.65 },
    "infeasible", "honest null"), value: 0 } }), /(zero-coercion channel|lossy side-channel) REJECTED/));
/* R3 NEW-11: closed-shape validation — the reviewer's exact lossy channels. */
assert("NEW-11: a record node smuggling data in an EXTRA property (outside .fields) is REJECTED",
  throws(() => tree({ r: { kind: "record", fields: { a: scalar(1) },
    hidden: { kind: "leaf", key: "x", state: "missing", value: 0, reason: "r" } } }), /lossy side-channel REJECTED/));
assert("NEW-11: string-valued vector itemIds forge is REJECTED (must be an array)",
  throws(() => tree({ v: { kind: "vector", itemIds: "abc", items: {} } }), /must be an ARRAY/));
assert("NEW-11: a grid missing its declared cells is REJECTED (exact policyPoints × lenses)",
  throws(() => tree({ g: { kind: "policy-lens-grid", policyPoints: [0.55, 0.65], lenses: ["a"], cells: {} } }),
    /EXACTLY policyPoints/));
assert("NEW-11: an unregistered leaf key is REJECTED (descriptor-backed keys only)",
  throws(() => tree({ l: { kind: "leaf", key: "made.up|%|model=\"x\"", state: "present", value: 1 } }),
    /not descriptor-backed/));
assert("NEW-10: a negative-zero dimension value is REJECTED (would collapse to '0' in the key)",
  throws(() => metricKey("capacity.minWidth", { model: "opus", hardware: "gb300", policyPoint: -0 }), /must be a scalar/));
/* R4 probes — the reviewer's four residual bypass classes. */
assert("R4 NEW-10: grid policy points reject signed zero; scalar/leaf constructors NORMALIZE -0 to +0 (no distinct accepted values collide)",
  throws(() => policyLensGrid([-0], ["l"], () => scalar(1)), /signed zero rejected/)
  && Object.is(scalar(-0).value, 0) && Object.is(leaf("margin.unit-serving", workloadScope("blend"), -0).value, 0));
assert("R4 NEW-11: a NON-ENUMERABLE extra node property is REJECTED (getOwnPropertyNames shape check)",
  throws(() => { const forged = { kind: "record", fields: { a: scalar(1) } };
    Object.defineProperty(forged, "hidden", { value: 42, enumerable: false });
    return tree({ r: forged }); }, /lossy side-channel REJECTED/));
assert("R4 NEW-11: a discontinuity forged with an extra property is REJECTED at tree()",
  throws(() => tree({ m: leaf("margin.unit-serving", workloadScope("blend"), 1) },
    [{ ...discontinuity("width", { hw: "gb300" }, [metricKey("margin.unit-serving", workloadScope("blend"))]), smuggled: 1 }]),
    /lossy side-channel REJECTED/));
assert("R4 NEW-11: a registered-looking key with a ROGUE trailing segment is REJECTED (descriptor-EXACT full match)",
  throws(() => tree({ l: { kind: "leaf",
    key: 'capacity.minWidth|gpus|model="x"|hardware="y"|policyPoint=1|rogue=1', state: "present", value: 1 } }),
    /not descriptor-EXACT/));
/* R5 probes — the reviewer's four residual variants. */
assert("R5 NEW-9: an evidence array carrying an EXPANDO property is refused at the mint door",
  throws(() => mintClaim({ subject: "s3", estimand: "e3", role: "result",
    evidenceBasis: { detail: Object.assign([], { extra: "provenance" }) },
    tree: tree({ m: leaf("margin.unit-serving", { ...workloadScope("blend"), model: "s3" }, 1) }) }),
    /expando propert/));
assert("R5 NEW-9: symbol-keyed evidence is refused at the mint door",
  throws(() => mintClaim({ subject: "s4", estimand: "e4", role: "result",
    evidenceBasis: { [Symbol("hidden")]: 1, k: 1 },
    tree: tree({ m: leaf("margin.unit-serving", { ...workloadScope("blend"), model: "s4" }, 1) }) }),
    /symbol-keyed/));
assert("R5 NEW-10: raw exact-shaped nodes carrying -0 are REJECTED at validation (leaf, scalar, grid point)",
  throws(() => tree({ l: { kind: "leaf", key: metricKey("margin.unit-serving", workloadScope("blend")), state: "present", value: -0 } }),
    /signed-zero leaf value/)
  && throws(() => tree({ r: record({ x: { kind: "scalar", type: "number", value: -0 } }) }), /signed-zero scalar/)
  && throws(() => tree({ g: { kind: "policy-lens-grid", policyPoints: [-0], lenses: ["l"],
      cells: { "0|l": scalar(1) } } }), /signed-zero grid policy point/));
assert("R5 NEW-11: a record smuggling a SYMBOL-keyed field is REJECTED",
  throws(() => tree({ r: { kind: "record", fields: Object.assign({ a: scalar(1) }, { [Symbol("x")]: scalar(2) }) } }),
    /symbol-keyed properties/));
assert("R5 NEW-11: a NONCANONICALLY encoded key alias (\\u0078 for x) is REJECTED by reconstruction",
  throws(() => tree({ l: { kind: "leaf",
    key: 'margin.unit-serving|%|model="\\u0078"|perspective="m"|policyPoint=1|lens="b"', state: "present", value: 1 } }),
    /not CANONICALLY encoded|not descriptor-EXACT/));
/* R8 probes — by-construction closures. */
assert("R8 NEW-16: a fractional array name ('0.5') is an expando and is refused",
  throws(() => mintClaim({ subject: "r8a", estimand: "e", role: "result",
    evidenceBasis: { detail: Object.assign([1], { "0.5": "x" }) },
    tree: tree({ m: leaf("margin.unit-serving", { ...workloadScope("blend"), model: "r8a" }, 1) }) }), /expando/));
assert("R8 NEW-17: Array(1) and [undefined] evidence keep DISTINCT addresses (holes preserved through the copy)",
  (() => { const mk8 = (basis, subj) => mintClaim({ subject: subj, estimand: "e", role: "result", evidenceBasis: basis,
    tree: tree({ m: leaf("margin.unit-serving", { ...workloadScope("blend"), model: subj }, 1) }) });
    return claimIdOf(mk8({ d: Array(1) }, "r8b")) !== claimIdOf(mk8({ d: [undefined] }, "r8b")); })());
assert("R8 NEW-18: an undefined discontinuity coordinate is refused (JSON-invisible)",
  throws(() => discontinuity("width", { p: undefined }, ["k"]), /undefined value/));
assert("R8 NEW-19: a TOCTOU getter (valid at validation, different at storage) cannot poison the stored tree — the snapshot re-validates",
  (() => { let reads = 0;
    const shifty = { kind: "scalar", type: "number" };
    Object.defineProperty(shifty, "value", { get() { reads++; return reads === 1 ? 1 : 2n; }, enumerable: true });
    // the accessor itself is rejected up front; and even if a Proxy-style shape slipped past,
    // the snapshot is rebuilt from single reads and re-validated
    return throws(() => tree({ r: record({ x: shifty }) }), /accessor node property/); })());
assert("R8 NEW-19: adapters consume SNAPSHOTS — mutating the caller's node object after tree() changes nothing",
  (() => { const raw = { kind: "scalar", type: "number", value: 1 };
    const t = tree({ r: { kind: "record", fields: { x: raw } } });
    raw.value = 999; // stored tree is a frozen copy; the caller's object is irrelevant now
    return t.nodes.r.fields.x.value === 1; })());
/* R7 probes — terminal-form closures. */
assert("R7 NEW-12: a leading-zero array name ('01') is an expando and is refused",
  throws(() => mintClaim({ subject: "r7a", estimand: "e", role: "result",
    evidenceBasis: { detail: Object.assign([1], { "01": "x" }) },
    tree: tree({ m: leaf("margin.unit-serving", { ...workloadScope("blend"), model: "r7a" }, 1) }) }), /expando/));
assert("R7 NEW-14: discontinuity at-payloads are type-preserving copies — [1] vs {'0':1} stay DISTINCT; NaN and BigInt are refused",
  (() => { const d1 = discontinuity("width", { p: [1] }, ["k"]);
    const d2 = discontinuity("width", { p: { "0": 1 } }, ["k"]);
    return Array.isArray(d1.at.p) && !Array.isArray(d2.at.p)
      && JSON.stringify(canonicalizeProbe(d1)) !== JSON.stringify(canonicalizeProbe(d2)); })()
  && throws(() => discontinuity("width", { p: NaN }, ["k"]), /non-finite/)
  && throws(() => discontinuity("width", { p: 1 }, ["k"], 1n), /note must be a string/));
assert("R7 NEW-15: raw nodes with a custom prototype or accessor properties are REJECTED",
  throws(() => tree({ r: Object.assign(Object.create({ smuggled: 1 }), { kind: "record", fields: { a: scalar(1) } }) }),
    /non-plain node prototype/)
  && throws(() => tree({ r: (() => { const n = { kind: "scalar", type: "number" };
      Object.defineProperty(n, "value", { get: () => 1, enumerable: true }); return { kind: "record", fields: { a: n } }; })() }),
    /accessor node property/));
assert("R7 NEW-15: a span with a NON-ENUMERABLE lo is REJECTED; a raw grid with BigInt lenses is REJECTED",
  throws(() => tree({ l: { kind: "leaf", key: metricKey("margin.unit-serving", workloadScope("blend")),
    state: "present", value: (() => { const sp = { hi: 2 }; Object.defineProperty(sp, "lo", { value: 1, enumerable: false }); return sp; })() } }),
    /plain enumerable \{lo,hi\}|finite value/)
  && throws(() => tree({ g: { kind: "policy-lens-grid", policyPoints: [0.5], lenses: [1n], cells: {} } }),
    /lenses must be strings/));
/* R6 probes — the reviewer's four residual variants. */
assert("R6 NEW-9: evidence stored WITHOUT the lossy spread — array [1] and object {\"0\":1} bases get DIFFERENT addresses; primitive bases survive",
  (() => { const mk3 = (basis, subj) => mintClaim({ subject: subj, estimand: "e", role: "result", evidenceBasis: basis,
    tree: tree({ m: leaf("margin.unit-serving", { ...workloadScope("blend"), model: subj }, 1) }) });
    return claimIdOf(mk3([1], "r6a")) !== claimIdOf(mk3({ "0": 1 }, "r6a"))
      && claimIdOf(mk3(1, "r6b")) !== claimIdOf(mk3(2, "r6b"))
      && Array.isArray(mk3([1], "r6c").evidenceBasis); })());
assert("R6 NEW-9: non-enumerable and out-of-range-numeric evidence properties are refused at the door",
  throws(() => mintClaim({ subject: "r6d", estimand: "e", role: "result",
    evidenceBasis: Object.defineProperty({ k: 1 }, "hidden", { value: 2, enumerable: false }),
    tree: tree({ m: leaf("margin.unit-serving", { ...workloadScope("blend"), model: "r6d" }, 1) }) }), /non-enumerable/)
  && throws(() => mintClaim({ subject: "r6e", estimand: "e", role: "result",
    evidenceBasis: { detail: Object.assign([], { 4294967295: "x" }) },
    tree: tree({ m: leaf("margin.unit-serving", { ...workloadScope("blend"), model: "r6e" }, 1) }) }), /expando/));
assert("R6 NEW-10: discontinuity `at` payloads reject signed zero AND BigInt at construction and at raw validation",
  throws(() => discontinuity("width", { point: -0 }, ["k"]), /signed-zero/)
  && throws(() => discontinuity("width", { point: 1n }, ["k"]), /non-data value/)
  && throws(() => tree({ m: leaf("margin.unit-serving", workloadScope("blend"), 1) },
      [{ kind: "discontinuity", type: "width", at: { point: -0 }, invalidatedMetricKeys: ["k"], note: null }]), /signed-zero/));
assert("R6 NEW-11: non-enumerable container entries and prototype-carried container data are REJECTED",
  throws(() => tree({ r: { kind: "record",
    fields: Object.defineProperty({ a: scalar(1) }, "hidden", { value: scalar(2), enumerable: false }) } }),
    /non-enumerable container/)
  && throws(() => tree({ r: { kind: "record", fields: Object.create({ inherited: scalar(9) }, { a: { value: scalar(1), enumerable: true } }) } }),
    /non-plain container prototype/));
assert("R6 NEW-11: leaf span objects are CLOSED — extra/symbol properties on {lo,hi} are REJECTED",
  throws(() => tree({ l: { kind: "leaf", key: metricKey("margin.unit-serving", workloadScope("blend")),
    state: "present", value: { lo: 1, hi: 2, smuggled: 3 } } }), /plain enumerable \{lo,hi\}/));
assert("R4 NEW-9: sparse Array(1) vs [] evidence bases get DIFFERENT addresses (hole token)",
  (() => { const mk2 = (basis) => mintClaim({ subject: "s2", estimand: "e2", evidenceBasis: basis, role: "result",
    tree: tree({ m: leaf("margin.unit-serving", { ...workloadScope("blend"), model: "s2" }, 1) }) });
    return claimIdOf(mk2({ detail: [] })) !== claimIdOf(mk2({ detail: Array(1) })); })());
assert("H-8: an unknown node kind is rejected recursively",
  throws(() => tree({ r: record({ x: { kind: "mystery" } }) }), /unknown node kind/));
assert("H-7 (R2): NaN and Infinity dimension values are REJECTED (they JSON-encode as null and would collapse key identity)",
  throws(() => metricKey("capacity.minWidth", { model: "opus", hardware: "gb300", policyPoint: NaN }), /must be a scalar/)
  && throws(() => metricKey("capacity.minWidth", { model: "opus", hardware: "gb300", policyPoint: Infinity }), /must be a scalar/));
assert("H-8 (R2): a forged vector carrying an UNDECLARED item (hidden zero-valued leaf) is REJECTED",
  throws(() => tree({ v: { kind: "vector", itemIds: [], items: { hidden: { kind: "leaf",
    key: "x", state: "missing", value: 0, reason: "r" } } } }), /UNDECLARED item/));
assert("H-8 (R2): a forged scalar with type 'undefined' is REJECTED (closed type set)",
  throws(() => tree({ r: record({ x: { kind: "scalar", type: "undefined", value: undefined } }) }), /outside the closed set/));

/* ================= forced discontinuities, each constructed AND applied ================= */
{ // width
  const w055 = solveAt(0.55).capacityMinimumUnderUniformPolicy;
  const w105 = solveAt(1.05).capacityMinimumUnderUniformPolicy;
  assert("width premise holds on real data (0.55 vs 1.05 widths differ)", w055 !== w105, `${w055} vs ${w105}`);
  const t0 = tree({
    cap055: leaf("capacity.minWidth", capScope(0.55), w055),
    cap105: leaf("capacity.minWidth", capScope(1.05), w105),
    margin: leaf("margin.unit-serving", workloadScope("blend"), sharedValue),
  });
  const t1 = applyDiscontinuity(t0, discontinuity("width", { hardware: "gb300", between: [0.55, 1.05] },
    [metricKey("capacity.minWidth", capScope(0.55)), metricKey("capacity.minWidth", capScope(1.05))]));
  assert("width discontinuity: scoped invalidation suppresses exactly the named keys; invariant leaves survive",
    t1.nodes.cap055.state === "suppressed" && t1.nodes.cap105.state === "suppressed"
    && t1.nodes.margin.state === "present" && t1.discontinuities[0].type === "width");
}
{ // feasibility — REAL honest null, constructed AND applied (R1 H-4)
  const st = structuredClone(base); st.total = 10000;
  const r = E.solveCapacityWidth("trn2", st, { ctx });
  assert("feasibility premise holds on real data (trn2@10T = honest null)", r.capacityMinimumUnderUniformPolicy === null);
  const trnScope = { model: "opus", hardware: "trn2", policyPoint: 0.65 };
  const t0 = tree({
    trn: leaf("capacity.minWidth", trnScope, 64), // the 5T solve, about to be invalidated by the 10T fixture
    margin: leaf("margin.unit-serving", workloadScope("blend"), sharedValue),
  });
  const t1 = applyDiscontinuity(t0, discontinuity("feasibility", { hardware: "trn2", at: "10T" },
    [metricKey("capacity.minWidth", trnScope)], "domain infeasible at 10T"));
  assert("feasibility discontinuity: constructed + applied; the affected leaf is a typed suppression, margin survives",
    t1.nodes.trn.state === "suppressed" && !("value" in t1.nodes.trn) && t1.nodes.margin.state === "present");
  const honest = stateLeaf("capacity.minWidth", trnScope, "infeasible", "no legal width in the 64-chip domain");
  assert("typed infeasible state carries NO value field", !("value" in honest));
}
{ // membership — ID-compared AND a first-class record (R1 H-4)
  const mkLeg = () => record({ weight: scalar(0.5), opBasis: scalar("anchor-stated") });
  const vA = vector(["h800", "h100"], { h800: mkLeg(), h100: mkLeg() });
  const vB = vector(["h800", "h200"], { h800: mkLeg(), h200: mkLeg() });
  assert("membership: same count, different leg IDs -> detected by ID comparison",
    vA.itemIds.length === vB.itemIds.length && !treesSemanticallyEqual(tree({ f: vA }), tree({ f: vB })));
  const shareScope = { model: "opus", perspective: "median", fleet: "na-blend", policyPoint: 0.65 };
  const t0 = tree({ f: vA, share: leaf("fleet.renderableWeightShare", shareScope, 0.25) });
  const t1 = applyDiscontinuity(t0, discontinuity("membership",
    { from: ["h800", "h100"], to: ["h800", "h200"] },
    [metricKey("fleet.renderableWeightShare", shareScope)], "leg swap invalidates the share"));
  assert("membership discontinuity: constructed + applied; the share leaf suppresses, the vector structure survives",
    t1.nodes.share.state === "suppressed" && t1.nodes.f.itemIds.length === 2);
}

/* ================= emitter fixtures: EVERY class at ALL THREE policy points ================= */
resetBoundaryForTest();
const weld = weldClause(bc.fleetRenderable);
const heroDisplay = displayValue(sharedValue);
const envFields = bc.fleetRenderable;
const mkClaim = (cls, p) => {
  const scope = { ...workloadScope("blend"), policyPoint: p };
  const mc = E.MARGIN_CLAIMS[0];
  const t = cls === "hardware-lens-tile"
    ? tree({ dec: leaf("cost.decode", { model: "opus", perspective: "median", hardware: "gb300", policyPoint: p, lens: "blend" }, bc.cOut) })
    : cls === "identity-strip"
      ? tree({ id: record({ scenario: scalar("central"), modified: scalar(false), policyPoint: scalar(p) }) })
      : cls === "evidence-board"
        ? tree({ row: record({ who: scalar(String(mc.who ?? mc.id ?? "claimant")),
            sourceClass: scalar(String(mc.sourceClass ?? "unknown")), policyPoint: scalar(p) }),
            current: leaf("margin.unit-serving", scope, sharedValue) })
        : tree({ margin: leaf("margin.unit-serving", scope, sharedValue) });
  return mintClaim({ subject: `opus@${cls}@${p}`,
    estimand: cls === "identity-strip" ? "scenario-identity" : cls === "evidence-board" ? "evidence-catalog-row" : "margin.unit-serving",
    evidenceBasis: { kind: "policy-scenario", policyPoint: p }, role: "result", tree: t });
};
const ADAPTER_BY_CLASS = {
  "hero-tile": domAdapter, "hardware-lens-tile": domAdapter, "identity-strip": domAdapter,
  "evidence-board": domAdapter, "share-string": mcpTextAdapter, "mcp-json": jsonAdapter,
  "mcp-text": mcpTextAdapter, "report-dossier": jsonAdapter,
  "final-answer": domAdapter, // R3 D-9: the Row-1 result surface (weld-required; site DOM block + MCP twin)
  /* b9 M6 (FA memo §5.4, D-6u-bis): `executive-summary` mirrors `final-answer` EXACTLY — the same
     adapter, the same harness-only registration, no `shape.ts` call site, no `envelopeFields`
     change. The per-class real instance comes from the mechanical loop below, not bespoke wiring. */
  "executive-summary": domAdapter,
};
for (const cls of EMITTER_CLASSES) registerEmitter(`emitter:${cls}`, cls, ADAPTER_BY_CLASS[cls]);
const stdioStore = makeSidecarStore();
const httpStore = makeSidecarStore();
const artifacts = {}; const sources = {};
const artifactByClaimId = {}; const httpArtifactByClaimId = {};
const allEmittedClaims = {};
for (const cls of EMITTER_CLASSES) {
  for (const p of POLICY_POINTS) {
    const claim = mkClaim(cls, p);
    const envelope = {
      claim, weld,
      display: heroDisplay, envelopeFields: envFields,
      visibleText: WELD_REQUIRED_CLASSES.includes(cls) || cls !== "mcp-text"
        ? `${heroDisplay.displayed}% ${weld}` : undefined,
      leadSentence: `Modeled unit margin ${heroDisplay.displayed}% ${weld}`,
    };
    const art = emit(`emitter:${cls}`, envelope, stdioStore);
    allEmittedClaims[`${cls}@${p}`] = claim;
    artifactByClaimId[claimIdOf(claim)] = art;
    if (/^mcp|report/.test(cls)) {
      // R2 H-6/NEW-7: the second transport RENDERS ITS OWN artifact and records
      // its sidecar from that independent artifact (determinism makes them equal;
      // generation is genuinely separate).
      const httpArt = ADAPTER_BY_CLASS[cls].render(envelope);
      httpArtifactByClaimId[claimIdOf(claim)] = httpArt;
      httpStore.record(`emitter:${cls}`, envelope, httpArt);
      httpStore.record(`emitter:${cls}`, envelope, httpArt); // dedupe probe
    }
    if (p === 0.65) { artifacts[cls] = art; sources[cls] = claim; }
  }
}
assert("coverage: every emitter class exercised with real instances at all three policy points",
  coverageReport().complete && registeredClasses().join(",") === [...EMITTER_CLASSES].sort().join(","));
{ // H-1: unregistered ATTEMPTS are now discoverable
  let threw = false;
  try { emit("emitter:rogue", { claim: policyClaim }); } catch (e) { threw = /UNREGISTERED/.test(String(e)); }
  const rep = coverageReport();
  assert("H-1: an unregistered emission attempt is refused AND appears in the coverage report",
    threw && rep.unregisteredAttempts.includes("emitter:rogue"));
  registerEmitter("emitter:missed", "report-dossier", jsonAdapter);
  assert("coverage dry-run: a registered-but-unexercised emitter surfaces as a report gap (staged, never production-fatal)",
    coverageReport().complete === false && coverageReport().missing.includes("emitter:missed"));
}

/* ---- round-trips: identity + tree + PRESENTATION survive every adapter (H-5) ---- */
for (const cls of EMITTER_CLASSES) {
  const rec = ADAPTER_BY_CLASS[cls].recover(artifacts[cls]);
  assert(`round-trip [${cls}]: identity label + metric tree survive`,
    rec.identityLabel === "policy-scenario" && recoveredEqualsLive(rec.tree, sources[cls].tree));
  assert(`round-trip [${cls}]: canonical value, precision note, weld, and envelope fields survive recovery`,
    rec.presentation.display.canonical === sharedValue
    && rec.presentation.weld === weld
    && rec.presentation.envelopeFields.renderableLegs === envFields.renderableLegs
    && rec.presentation.envelopeFields.renderableWeightShare === envFields.renderableWeightShare
    && (rec.presentation.display.displayed === sharedValue
        ? rec.presentation.display.precisionNote === null
        : /within displayed precision/.test(rec.presentation.display.precisionNote)));
}
{ // H-2: a BRANDED central claim carries presentation via the ENVELOPE — brand intact end-to-end
  const art = emit.length && (() => {
    registerEmitter("emitter:central-comparison", "mcp-text", mcpTextAdapter);
    return emit("emitter:central-comparison", {
      claim: centralClaim, weld, envelopeFields: envFields,
      leadSentence: `Verified central comparator ${heroDisplay.displayed}% ${weld}`,
    });
  })();
  const rec = mcpTextAdapter.recover(art);
  assert("H-2: presentation travels in the envelope — the branded central claim is UNCHANGED and emits as central-verified",
    isCentral(centralClaim) && rec.identityLabel === "central-verified"
    && /Verified central comparator/.test(rec.leadSentence));
}
{ // H-5: the weld is enforced AT THE BOUNDARY — a tooltip-only artifact cannot be emitted
  registerEmitter("emitter:hero-noweld", "hero-tile", domAdapter);
  assert("H-5: hero emission WITHOUT the inline weld is refused at the boundary (tooltip-only cannot ship)",
    throws(() => emit("emitter:hero-noweld", { claim: policyClaim, weld, envelopeFields: envFields,
      visibleText: `${heroDisplay.displayed}%`, tooltip: weld }), /requires the weld INLINE/));
  assert("H-5: hero emission with NO weld token at all is refused",
    throws(() => emit("emitter:hero-noweld", { claim: policyClaim,
      visibleText: `${heroDisplay.displayed}%` }), /requires the shared weld token/));
  // R2 H-5/NEW-2: weld TRUTH — the token must derive from the envelope's own fields.
  assert("H-5 (R2): a FABRICATED weld token is refused at the boundary",
    throws(() => emit("emitter:hero-noweld", { claim: policyClaim, weld: "[weld fabricated]",
      envelopeFields: envFields, visibleText: `x [weld fabricated]` }), /fabricated\/contradictory weld REJECTED/));
  assert("H-5 (R2): a weld CONTRADICTING the envelope fields (0/99) is refused",
    throws(() => emit("emitter:hero-noweld", { claim: policyClaim,
      weld: weldClause({ renderableLegs: 0, totalLegs: 99, renderableWeightShare: 0 }),
      envelopeFields: envFields,
      visibleText: `x ${weldClause({ renderableLegs: 0, totalLegs: 99, renderableWeightShare: 0 })}` }),
      /fabricated\/contradictory weld REJECTED/));
}

/* ---- Risk-Analyst: DOM-mutation audit ---- */
{
  const clean = domMutationAudit(artifacts["hero-tile"], sources["hero-tile"]);
  assert("DOM-mutation audit: clean artifact passes", clean.clean === true, JSON.stringify(clean));
  const tampered = artifacts["hero-tile"].replace("policy-scenario", "central-verified");
  assert("DOM-mutation audit: post-render identity tamper DETECTED",
    domMutationAudit(tampered, sources["hero-tile"]).clean === false);
  assert("DOM-mutation audit: stripped machine payload DETECTED",
    domMutationAudit(artifacts["hero-tile"].replace(/data-claim="[^"]*"/, ""), sources["hero-tile"]).clean === false);
}

/* ================= H-6: sidecar — content-addressed, resolvable, one-to-one ================= */
{
  const mk = (v, basis) => mintClaim({ subject: "s", estimand: "e", evidenceBasis: basis, role: "result",
    tree: tree({ m: leaf("margin.unit-serving", workloadScope("blend"), v) }) });
  assert("H-6: claim IDs are content-addressed — same subject|estimand|role, different trees, DIFFERENT IDs",
    claimIdOf(mk(1, { k: 1 })) !== claimIdOf(mk(2, { k: 1 })));
  // R2 H-6/NEW-3: evidence basis + identity label are part of the address.
  assert("H-6 (R2): same tuple + same tree, DIFFERENT evidence bases -> different IDs",
    claimIdOf(mk(1, { kind: "policy-scenario" })) !== claimIdOf(mk(1, { kind: "measured-anchor" })));
  const centralTwin = mintClaim({ ...cleanSpec, subject: "opus@id-twin" });
  const policyTwin = mintClaim({ subject: "opus@id-twin", estimand: cleanSpec.estimand,
    evidenceBasis: cleanSpec.evidenceBasis, role: "comparison", tree: centralTree });
  assert("H-6 (R2): central vs policy identity over an otherwise identical claim -> different IDs",
    isCentral(centralTwin) && !isCentral(policyTwin) && claimIdOf(centralTwin) !== claimIdOf(policyTwin));
  // R3 NEW-9: the address trusts the BRAND, not the string — a forged label changes nothing.
  const mintedPolicy = mk(1, { kind: "x" });
  assert("NEW-9: a forged central-verified STRING yields the same ID as the equivalent policy claim (label carries no address weight)",
    claimIdOf({ ...mintedPolicy, identity: "central-verified" }) === claimIdOf(mintedPolicy));
  assert("NEW-9: NaN vs null evidence-basis values get DIFFERENT addresses (injective encoding)",
    claimIdOf(mk(1, { detail: NaN })) !== claimIdOf(mk(1, { detail: null }))
    && claimIdOf(mk(1, { detail: -0 })) !== claimIdOf(mk(1, { detail: 0 })));
  assert("NEW-9: emit() REFUSES a claim carrying a forged central-verified label",
    (() => { registerEmitter("emitter:forge-probe", "report-dossier", jsonAdapter);
      return throws(() => emit("emitter:forge-probe", { claim: { ...mintedPolicy, identity: "central-verified" } }),
        /FORGED central-verified label/); })());
}
{
  const mcpEntries = httpStore.entries();
  const stdioMcp = stdioStore.entries().filter((e) => /mcp|report/.test(e.emitterId));
  assert("H-6 (R2): sidecars generated from INDEPENDENTLY RENDERED per-transport artifacts are IDENTICAL (incl. report-dossier; dedupe held under double-record)",
    JSON.stringify(stdioMcp.map((e) => ({ ...e, emitterId: null })))
    === JSON.stringify(mcpEntries.map((e) => ({ ...e, emitterId: null }))) && mcpEntries.length === 9);
  // R2 NEW-7: EVERY entry's pointer resolves in ITS OWN transport artifact to the
  // payload with the MATCHING content-addressed ID.
  let resolvedOk = 0, resolvedTotal = 0;
  for (const [store, artMap] of [[stdioStore, artifactByClaimId], [httpStore, httpArtifactByClaimId]]) {
    for (const entry of store.entries()) {
      resolvedTotal++;
      const art = artMap[entry.claimId];
      const resolved = art && resolvePointer(machineDocOf(art), entry.pointer);
      if (resolved && resolved.claimId === entry.claimId) resolvedOk++;
    }
  }
  assert("H-6 (R2): ALL sidecar pointers (both transports) resolve in their own artifact to the matching claimId",
    resolvedTotal >= 33 && resolvedOk === resolvedTotal, `${resolvedOk}/${resolvedTotal}`);
  const heroEntry = stdioStore.entries().find((e) => e.claimId === claimIdOf(sources["hero-tile"]));
  assert("H-6: sidecar metricKeys are the recursive LEAF keys, not top-level node names",
    heroEntry.metricKeys.every((k) => /^margin\.unit-serving\|%\|/.test(k))
    && JSON.stringify(heroEntry.metricKeys) === JSON.stringify(treeLeafKeys(sources["hero-tile"].tree)));
  // R2 NEW-7: one-to-one BOTH DIRECTIONS over the full stdio emission set.
  const claimIds = [...stdioStore.entries().map((e) => e.claimId)].sort();
  const emittedIds = [...new Set(Object.values(allEmittedClaims).map((c) => claimIdOf(c)))].sort();
  assert("H-6 (R2): bidirectional one-to-one — sidecar entry set EQUALS the emitted claim set exactly",
    JSON.stringify(claimIds) === JSON.stringify(emittedIds), JSON.stringify([claimIds.length, emittedIds.length]));
}

/* ================= browser hash path (R2 migration: content addresses in the browser) ================= */
for (const vec of ["", "abc", "≈57% — ünïcode ✓ [weld 2/7 legs renderable]", "a".repeat(119)]) {
  assert(`sha256 fallback: pure-JS browser digest byte-equal to node:crypto (len ${vec.length})`,
    sha256HexJs(vec) === crypto.createHash("sha256").update(vec, "utf8").digest("hex"));
}

/* ================= pass-bar meta-assertion ================= */
assert("pass bar: metric keys are insertion-order/spelling independent (registry-ordered canonical form)",
  metricKey("cost.decode", { lens: "blend", policyPoint: 0.65, hardware: "gb300", perspective: "median", model: "opus" })
  === metricKey("cost.decode", { model: "opus", perspective: "median", hardware: "gb300", policyPoint: 0.65, lens: "blend" }));

console.log(`\n${failures === 0 ? "ALL CONTRACT-HARNESS TESTS PASS" : failures + " CONTRACT-HARNESS FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
