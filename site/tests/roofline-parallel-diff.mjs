// IM3 slice-3 identity harness — switched live engine vs reviewed roofline path.
// Run: node site/tests/roofline-parallel-diff.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../engine.js");
/* b9 M5 fixture scope (M5 delta manifest) — REFERENCE-CLASS harness. This is the 496-point
   PARALLEL-ROOFLINE identity check: it asserts the engine's live throughput path reproduces the
   reviewed roofline core point-for-point. M5 multiplies the engine's RETURNED throughput by the
   ratified per-lab scenario prior (E = 1.3161 for Anthropic at +3 months), which is deliberately
   absent from the core — so every state here is pinned to the trend-0 / family-1.0 REFERENCE
   through the same constructor the final-answer surface uses. Every compared value is
   BYTE-UNCHANGED; the lever's own exactness against a trend-0 twin is asserted in
   tests/trendline-interlock-b9.test.mjs T-1. */
const preset = (m, p, sel) => E.pinReferenceLevers(E.applyPresetSettings(m, p, sel));
const R = require("../engine-roofline-v22.js");
const D = require("../engine-data-v22.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
const close = (a, b, tol = 1e-12) => Math.abs(a / b - 1) <= tol;

// Reviewed deployed targets remain identities after activation. These are replay targets,
// not all source measurements: h20/ascend deliberately deploy neutral values, while GB200
// is compared to the underlying measured anchor at a tolerance that covers source rounding.
const arch = R.resolveArch("dsr1");
const calibration = [
  ["h800", 96, 4989, "fp8", 1873.0, 1e-4],
  ["h20", 48, 4096, "fp8", 680.0, 1e-4],
  ["gb200", 128, 3000, "fp4", 10108.0, 1e-3],
  ["ascend", 96, 4096, "fp8", 1422.7, 1e-4],
];
for (const [hwKey, b, L, precision, expected, tolerance] of calibration) {
  const got = R.decodeRoofline({ arch, activeB: 37, totalB: 671, hwKey, b, L, precision }).tokPerS;
  assert(`deployed target ${hwKey} within ${(tolerance * 100).toFixed(2)}%`, Math.abs(got / expected - 1) <= tolerance,
    `${got.toFixed(6)} vs ${expected}`);
}

// Reconstruct the public engine's width-selection composition through the reviewed module.
// The old harness called renderPoint() without the capacity solver width, comparing two
// different states after R2 activated width solving and producing >100 false mismatches.
function parallelRenderPoint(s, ctx, modelArch, hwKey, loadedWeightBytesPerParam) {
  const reg = D.OPERATING_POINTS[hwKey];
  const cell = reg && reg[s.interact];
  const ruleCell = !!(cell && cell.rule);
  const solved = E.solveCapacityWidth(hwKey, s, ruleCell
    ? { ctx, bDeclared: reg.balanced.b, loadedWeightBytesPerParam }
    : { ctx, loadedWeightBytesPerParam });
  const args = {
    arch: modelArch,
    activeB: s.active,
    totalB: s.total,
    hwKey,
    regime: s.interact,
    precision: s.precision,
    stackMult: s.stackMult,
    profileId: ctx.profileId,
    ioRatio: s.ioRatio,
  };
  if (!solved) return { point: R.renderPoint(args), widthRendered: null, solved }; // Rubin: no registered width domain.
  if (!solved.renderableUnderPolicy) {
    const widest = solved.perWidth.at(-1);
    const bDeclared = solved.receipt.capacityTargetBatch;
    if (solved.capacityMinimumUnderUniformPolicy == null || bDeclared == null || !widest || widest.bFeas < 1)
      return { point: { infeasible: true }, widthRendered: null, solved };
    const widthRendered = Math.max(...solved.receipt.legalShapeSet);
    return { point: R.renderPoint({
      ...args, declaredOperatingWidth: widthRendered, capacitySolve: solved,
    }), widthRendered, solved };
  }
  const widthRendered = ruleCell
    ? Math.max(...solved.receipt.legalShapeSet)
    : solved.declaredOperatingPointWidth;
  return {
    point: R.renderPoint({
      ...args, declaredOperatingWidth: widthRendered, capacitySolve: solved,
    }),
    widthRendered,
    solved,
  };
}

const median = E.PERSPECTIVES.find(p => p.id === "median");
const hwKeys = [...E.HW_ORDER, "rubin"];
const regimes = ["batch", "balanced", "fast"];
const stateCounts = { finite: 0, capped: 0, infeasible: 0 };
const samples = [];
let rows = 0, numericMatches = 0, infeasibleMatches = 0, prefillMatches = 0;
const handoffMismatches = [];
let defaultHandoffRows = 0;

for (const m of E.MODELS) {
  const base = preset(m, median, { mode: "native" });
  // Use one dense-TP donor so the resolved-width prefill channel is non-vacuous.
  if (m.id === "custom") base.customDonor = "llama70";
  const ctx = { ...E.scenarioContext(base), customDonor: base.customDonor };
  const modelArch = R.resolveArch(ctx.modelId, ctx.customDonor);
  for (const hwKey of hwKeys) {
    const hw = hwKey === "rubin" ? E.RUBIN : E.HW[hwKey];
    const rowRegimes = hwKey === "rubin" ? ["balanced"] : regimes;
    for (const regime of rowRegimes) {
      const s = structuredClone(base); s.interact = regime;
      const { point: parallel, widthRendered, solved } = parallelRenderPoint(s, ctx, modelArch, hwKey);
      if (solved) {
        defaultHandoffRows++;
        const selected = widthRendered == null
          ? null : solved.perWidth.find(row => row.width === widthRendered);
        const ok = widthRendered == null
          ? parallel.infeasible === true
          : !!(selected && parallel.op && parallel.op.bFeas === selected.bFeas
            && parallel.op.b === Math.min(parallel.op.bDeclared, selected.bFeas));
        if (!ok) handoffMismatches.push({
          model: m.id, hwKey, regime, policyPoint: null, widthRendered,
          selected, op: parallel.op ?? null,
        });
      }
      const liveOut = E.tokPerS(hw, s, "out", undefined, ctx);
      const state = parallel.infeasible ? "infeasible" : parallel.op.capped ? "capped" : "finite";
      stateCounts[state]++; rows++;
      let matched;
      if (parallel.infeasible) {
        matched = !isFinite(liveOut); if (matched) infeasibleMatches++;
      } else {
        matched = close(liveOut, parallel.tokPerS); if (matched) numericMatches++;
        const liveIn = E.tokPerS(hw, s, "in", undefined, ctx);
        const expectedIn = R.prefillRoofline({ arch: modelArch, activeB: s.active, hwKey,
          precision: s.precision, stackMult: s.stackMult, LIn: parallel.lengths.LIn,
          declaredOperatingWidth: widthRendered ?? undefined }).tokPerS;
        const prefillOk = close(liveIn, expectedIn); if (prefillOk) prefillMatches++;
        assert(`prefill identity ${m.id}|${hwKey}|${regime}`, prefillOk, `${liveIn} vs ${expectedIn}`);
      }
      assert(`decode/state identity ${m.id}|${hwKey}|${regime}`, matched,
        `${liveOut} vs ${parallel.infeasible ? "infeasible" : parallel.tokPerS}`);
      if (samples.length < 12) samples.push(`${m.id}|${hwKey}|${regime}: ${state}${parallel.infeasible ? "" : ` ${liveOut.toFixed(4)} tok/s`}`);
    }
  }
}

// Direct anti-regression for the bug this review found: across every sampled loaded-bytes
// policy point, the renderer must consume the selected trusted solver row. Comparing live
// and parallel composition alone cannot catch both paths dropping the same residency result.
let policyHandoffRows = 0;
for (const m of E.MODELS) {
  const base = preset(m, median, { mode: "native" });
  if (m.id === "custom") base.customDonor = "llama70";
  const ctx = { ...E.scenarioContext(base), customDonor: base.customDonor };
  const modelArch = R.resolveArch(ctx.modelId, ctx.customDonor);
  for (const hwKey of E.HW_ORDER) {
    for (const regime of regimes) {
      for (const policyPoint of E.CAPACITY_POLICY_BAND) {
        const s = structuredClone(base); s.interact = regime;
        const { point, widthRendered, solved } =
          parallelRenderPoint(s, ctx, modelArch, hwKey, policyPoint);
        policyHandoffRows++;
        const selected = widthRendered == null
          ? null : solved.perWidth.find(row => row.width === widthRendered);
        const ok = widthRendered == null
          ? point.infeasible === true
          : !!(selected && point.op && point.op.bFeas === selected.bFeas
            && point.op.b === Math.min(point.op.bDeclared, selected.bFeas));
        if (!ok) handoffMismatches.push({
          model: m.id, hwKey, regime, policyPoint, widthRendered,
          selected, op: point.op ?? null,
        });
      }
    }
  }
}

// Fixed coverage oracle: do not derive these from the live registries being tested. A deleted
// model/hardware row or a broad feasibility-state shift must fail even when both implementations
// change together. Update only with an explicit reviewed delta manifest.
const expectedRows = 496;
// Post-review adjudication 2026-07-27: Trainium3 capacity reverts to the Neuron docs'
// unit-explicit 144 GiB (review's SI re-read overturned); exactly one row returns
// capped→finite (the Kimi/trn3 declared b=128 now fits at bFeas 140). 398/95/3 → 399/94/3.
/* im-vet-model-estimates (2026-09-19), with the "explicit reviewed delta manifest" the comment
   above requires — 399/94/3 → 419/74/3, twenty rows capped → finite, and the manifest is that
   EVERY ONE of the twenty is a Zhipu row:
     glm47 (9): ascend|fast, gb300|balanced, h100|fast, h200|fast, h20|fast, h800|fast,
                tpu7|balanced, tpu7|batch, trn3|balanced
     glm  (11): gb200|balanced, gb300|balanced, gb300|batch, h100|balanced, h200|balanced,
                h20|balanced, h20|batch, h800|balanced, rubin|balanced, trn2|balanced, trn3|batch
   Zero rows outside those two models moved, in either direction, and no row changed to or from
   infeasible. The cause is the traffic default those two rows carry: `ncode` put an 86,062-token
   decode context (LPeak 91,125) on every state, which capped the declared batch on almost every
   accelerator; at the page's Reference convention the context is 15,500 (LPeak 16,000) and the
   declared batch fits. So this is the capacity solver correctly reporting that the two rows were
   batch-capped BY the 81,000-token profile, and it is measured row-by-row rather than asserted —
   the before/after grids were dumped and diffed at landing. */
const expectedStateCounts = { finite: 419, capped: 74, infeasible: 3 };
assert(`full matrix contains all ${expectedRows} rows`, rows === expectedRows, String(rows));
assert("full matrix preserves the reviewed finite/capped/infeasible distribution",
  JSON.stringify(stateCounts) === JSON.stringify(expectedStateCounts), JSON.stringify(stateCounts));
assert("every feasible decode value matches", numericMatches === stateCounts.finite + stateCounts.capped,
  `${numericMatches}/${stateCounts.finite + stateCounts.capped}`);
assert("every infeasible state matches", infeasibleMatches === stateCounts.infeasible,
  `${infeasibleMatches}/${stateCounts.infeasible}`);
assert("every feasible prefill value matches", prefillMatches === stateCounts.finite + stateCounts.capped,
  `${prefillMatches}/${stateCounts.finite + stateCounts.capped}`);
assert("trusted capacity handoff covers all 1,920 default + sampled-policy domain rows",
  defaultHandoffRows === 480 && policyHandoffRows === 1440,
  JSON.stringify({ defaultHandoffRows, policyHandoffRows }));
assert("every rendered batch and bFeas comes from its selected trusted capacity row",
  handoffMismatches.length === 0, JSON.stringify(handoffMismatches.slice(0, 10)));
console.log("SAMPLED ROWS\n" + samples.join("\n"));
console.log(`SUMMARY rows=${rows} finite/capped numeric matches=${numericMatches} infeasible matches=${infeasibleMatches} prefill matches=${prefillMatches} states=${JSON.stringify(stateCounts)}`);
console.log(failures === 0 ? "\nSWITCHED VS PARALLEL: ALL ASSERTIONS PASS" : `\n${failures} SWITCH/PARALLEL FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
