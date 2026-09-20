/* dense-tp-prefill-basis — the prefill rate that gets PRICED must be per-accelerator.
 *
 * Mutation control for the im-vet-0919 round-1 fold (Astra pack A P0-1). prefillRoofline's
 * dense-TP branch divides Φ_pre by the shard width to get one device's work for ONE token, so
 * the 1/t_tok it returns is the whole N-wide replica's token rate. costPerMtok and
 * energyPerMtok divide ONE accelerator's hourly cost/power by that rate, so before the fold a
 * dense-TP prefill was charged one accelerator-hour for sixteen accelerators' output — it
 * claimed 281.3% of one H100's peak BF16 FLOPs while paying for one H100.
 *
 * The invariant asserted here is dimensional, not a snapshot: the work a single
 * accelerator-hour is charged for can never exceed what one accelerator can physically do at
 * its own calibrated efficiency. It holds for MoE-EP by construction and held for dense-TP only
 * after the fold, so this file is RED on the pre-fold engine.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const R = require("../site/engine-roofline-v22.js");

let fails = 0, passes = 0;
function check(name, cond, detail = "") {
  if (cond) { passes++; console.log("PASS  " + name); }
  else { fails++; console.log("FAIL  " + name + (detail ? "  — " + detail : "")); }
}

const model = id => E.MODELS.find(m => m.id === id);
const persp = id => E.PERSPECTIVES.find(p => p.id === id);

function scenario(modelId, perspId, extra = {}) {
  const m = model(modelId), p = persp(perspId);
  const s = E.applyPresetSettings(m, p);
  Object.assign(s, extra);
  const ctx = E.makeScenarioContext(m, E.resolveTraffic(m, p), s.customDonor);
  E.registerScenarioContext(s, ctx);
  return { s, ctx, m, p };
}

/* ---------------------------------------------------------------------------
 * 1. THE DIMENSIONAL INVARIANT — one accelerator-hour never buys more than one
 *    accelerator's usable peak, on either architecture branch.
 * ------------------------------------------------------------------------- */
// Instrument prefillRoofline on the live path: the only reliable way to read the exact Φ_pre,
// η_pre_eff, shard width and device peak the engine actually used for this scenario.
function livePrefill({ s, ctx }, hwKey) {
  const hw = hwKey === "rubin" ? E.RUBIN : E.HW[hwKey];
  const original = R.prefillRoofline;
  let first = null;
  R.prefillRoofline = function (opts) {
    const out = original.call(this, opts);
    if (!first) first = out;
    return out;
  };
  let cost, hr;
  try {
    cost = E.costPerMtok(hw, s, "in", undefined, ctx);
    hr = E.hwHourCost(hw, s);
  } finally { R.prefillRoofline = original; }
  if (!first || !Number.isFinite(cost)) return null;
  const tup = R.resolvePrecisionTuple(hwKey, s.precision);
  const ratePriced = (hr / 3600) * 1e6 / (cost * (s.util / 100));
  return {
    ...first, ratePriced, devicePeak: tup.flops,
    // the full per-token work, times the rate one accelerator-hour is charged for
    chargedFlopsPerS: first.phiPre * ratePriced,
    usablePeak: tup.flops * first.etaPreEff,
  };
}

const DENSE = scenario("custom", "median", {
  customDonor: "llama70", active: 70, total: 70,
  precision: "bf16", interact: "balanced", blend: { h100: 100 },
});

const dense = livePrefill(DENSE, "h100");
check("dense-TP scenario actually renders on the dense branch",
  !!dense && dense.mode === "dense-tp", dense ? dense.mode : "no prefill point");
check("dense-TP prefill is solved at a shard width above 1 (otherwise this guard is vacuous)",
  !!dense && dense.nShard > 1, dense ? String(dense.nShard) : "n/a");
check("dense-TP: one accelerator-hour is never charged for more than one accelerator's usable peak",
  !!dense && dense.chargedFlopsPerS <= dense.usablePeak * 1.000001,
  dense ? `${(100 * dense.chargedFlopsPerS / dense.devicePeak).toFixed(3)}% of one device peak, usable ceiling ${(100 * dense.etaPreEff).toFixed(3)}%` : "n/a");
check("dense-TP: the charged rate is the replica rate divided by the shard width",
  !!dense && Math.abs(dense.ratePriced - dense.tokPerS / dense.nShard) / (dense.tokPerS / dense.nShard) < 1e-9,
  dense ? `${dense.ratePriced} vs ${dense.tokPerS / dense.nShard}` : "n/a");

/* MoE-EP is the control: it was already per-accelerator, so the same invariant must hold and
   the fold must not have moved it. */
const MOE = scenario("dsv4", "dive");
const moe = livePrefill(MOE, "h800");
check("MoE-EP control renders on the MoE branch", !!moe && moe.mode === "moe-ep",
  moe ? moe.mode : "no prefill point");
check("MoE-EP: one accelerator-hour is never charged for more than one accelerator's usable peak",
  !!moe && moe.chargedFlopsPerS <= moe.usablePeak * 1.000001,
  moe ? `${(100 * moe.chargedFlopsPerS / moe.devicePeak).toFixed(3)}% of one device peak, usable ceiling ${(100 * moe.etaPreEff).toFixed(3)}%` : "n/a");
check("MoE-EP: the charged rate is the roofline rate itself (no division applied)",
  !!moe && Math.abs(moe.ratePriced - moe.tokPerS) / moe.tokPerS < 1e-9,
  moe ? `${moe.ratePriced} vs ${moe.tokPerS}` : "n/a");

/* ---------------------------------------------------------------------------
 * 2. THE EXPORTED RAW SURFACE IS UNCHANGED — tests/roofline-parallel-diff.mjs
 *    asserts E.tokPerS(...,"in") equals prefillRoofline's own tokPerS, and that
 *    identity must keep meaning exactly what it says.
 * ------------------------------------------------------------------------- */
check("E.tokPerS(..., 'in') still returns the RAW roofline rate for dense-TP",
  !!dense && Math.abs(E.tokPerS(E.HW.h100, DENSE.s, "in", undefined, DENSE.ctx) - dense.tokPerS) / dense.tokPerS < 1e-9,
  dense ? `${E.tokPerS(E.HW.h100, DENSE.s, "in", undefined, DENSE.ctx)} vs ${dense.tokPerS}` : "n/a");

/* ---------------------------------------------------------------------------
 * 3. THE CORRECTED VALUES, pinned. Pre-fold: $0.0764430992518132 and 96.6472…%.
 * ------------------------------------------------------------------------- */
const w = E.workload(DENSE.s);
check("dense-TP custom/llama70 input cost is the per-accelerator figure",
  Math.abs(w.cIn - 1.2230895880290111) < 1e-9, String(w.cIn));
check("dense-TP custom/llama70 margin is 73.0720% (was 96.6473% when prefill was mispriced)",
  Math.abs(w.margin * 100 - 73.07204185) < 1e-6, (w.margin * 100).toFixed(8));
check("the pre-fold input cost is exactly the shard width below the corrected one",
  Math.abs(w.cIn / 0.0764430992518132 - (dense ? dense.nShard : 0)) < 1e-9,
  dense ? String(w.cIn / 0.0764430992518132) : "n/a");

/* ---------------------------------------------------------------------------
 * 4. NO SHIPPED PRESET PAIR RENDERS dense-TP — the claim the fold's provenance
 *    note makes, checked rather than asserted in prose.
 * ------------------------------------------------------------------------- */
let densePairs = 0, pairs = 0;
for (const m of E.MODELS) {
  for (const p of E.PERSPECTIVES) {
    let s, ctx;
    try {
      s = E.applyPresetSettings(m, p);
      ctx = E.makeScenarioContext(m, E.resolveTraffic(m, p), s.customDonor);
    } catch { continue; }
    pairs++;
    try {
      if (R.resolveArch(ctx.modelId, s.customDonor).mode === "dense-tp") densePairs++;
    } catch { /* an unresolvable arch is not a dense-TP render */ }
  }
}
/* NON-VACUITY FIRST (Astra round 2): "0 of N render dense-TP" is trivially true when N is 0,
   and the loop above skips any pair whose preset or context throws. Pin the denominator. */
check("the preset sweep actually enumerated the catalogue (this check is not vacuous)",
  pairs >= E.MODELS.length * E.PERSPECTIVES.length - 2 && pairs >= 200,
  `${pairs} pairs enumerated of ${E.MODELS.length} models x ${E.PERSPECTIVES.length} perspectives`);
check(`no shipped model/perspective pair renders dense-TP (checked ${pairs} pairs)`,
  densePairs === 0, `${densePairs} dense-TP pairs`);

/* The Rubin residual (Astra round 2 P2): a projection row carries no declared operating width,
   so a divisor taken from `widthRendered` fell through uncorrected while the prefill result
   itself said nShard 8. The divisor comes from the prefill result now. */
{
  const R2 = scenario("custom", "median", {
    customDonor: "llama70", active: 70, total: 70, precision: "bf16", interact: "balanced",
  });
  const rubinEnergy = E.energyPerMtok(E.RUBIN, R2.s, "in", undefined, R2.ctx);
  check("a projection row with no declared operating width is still priced per accelerator",
    Math.abs(rubinEnergy - 141.89750298617827) < 1e-9, String(rubinEnergy));
  check("...and that is exactly the shard width above the uncorrected figure",
    Math.abs(rubinEnergy / 17.737187873272283 - 8) < 1e-9,
    String(rubinEnergy / 17.737187873272283));
}

/* The fold must not have bought its correctness with extra work (Astra round 2 P2): resolving
   the roofline point once inside the pricing wrapper, rather than calling tokPerS and resolving
   it again, keeps the capacity solver at its pre-fold call count. */
{
  const solves = (() => {
    const original = R.capacityWidthSolve;
    let n = 0;
    R.capacityWidthSolve = function (opts) { n += 1; return original(opts); };
    try { E.workload(scenario("opus", "gptpro-r3").s); } finally { R.capacityWidthSolve = original; }
    return n;
  })();
  check("pricing a fleet costs no more capacity solves than before the fold (3 per leg, 5 legs)",
    solves === 15, `${solves} solves`);
}

console.log(`\n${passes} passed, ${fails} failed`);
if (fails) { console.log(`\n${fails} DENSE-TP PREFILL BASIS FAILURE(S)`); process.exit(1); }
console.log("\nALL DENSE-TP PREFILL BASIS CHECKS PASS");
