// Leave-one-anchor-out validation (empiricist design, external review 2026-07-10).
// Question: does a SINGLE effective-MFU coefficient, fit only on the DeepSeek H800
// production anchor, predict the other platforms' published decode measurements?
// Pass bar proposed by the review: central error below ~25%.
// Predictions are computed from spec sheets + the one fitted coefficient — nothing else.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");

const ACTIVE = 37e9; // all anchors are DeepSeek R1-class (37B active)
const FLOP_PER_TOK = 2 * ACTIVE;

// Fit: single global decode MFU from the H800 production anchor (1,850 tok/s/GPU, 1.98 PF dense FP8).
const globalMFU = 1850 * FLOP_PER_TOK / 1.98e15; // ≈ 6.91%

const HELD_OUT = [
  { name: "H20 (Ant/SGLang production, <50ms tier)", flops: 0.296e15, mult: 1.0, measured: 675 },
  { name: "GB200 (vLLM published)", flops: 5.00e15, mult: 1.0, measured: 10100 },
  { name: "Ascend 910C INT8 (CloudMatrix-Infer, optimized)", flops: 1.504e15, mult: 1.0, measured: 1943 },
  { name: "Ascend 910C INT8 (neutral read: DeepSeek '60% of H100')", flops: 1.504e15, mult: 1.0, measured: 1303 },
];

console.log(`Fitted single global decode MFU (H800 anchor only): ${(globalMFU * 100).toFixed(2)}%\n`);
console.log("Held-out platform                                        | predicted | measured | error");
let worst = 0, sumAbs = 0;
for (const h of HELD_OUT) {
  const pred = h.flops * h.mult * globalMFU / FLOP_PER_TOK;
  const err = (pred - h.measured) / h.measured * 100;
  sumAbs += Math.abs(err); worst = Math.max(worst, Math.abs(err));
  console.log(`${h.name.padEnd(56)} | ${pred.toFixed(0).padStart(9)} | ${String(h.measured).padStart(8)} | ${err.toFixed(0).padStart(4)}%`);
}
console.log(`\nMean |error|: ${(sumAbs / HELD_OUT.length).toFixed(0)}%  ·  Worst: ${worst.toFixed(0)}%  ·  Pass bar: ≤25% central error`);
console.log(`VERDICT: ${sumAbs / HELD_OUT.length <= 25 ? "PASSES — scalar MFU transfers" : "FAILS — a single scalar MFU does NOT transfer across platforms"}.`);
console.log("Implication: the calculator's per-platform MFU values are ANCHOR FITS (interpolation),");
console.log("not a predictive first-principles model. Platforms without a published anchor (TPU v7,");
console.log("Trainium, Rubin projection) therefore carry materially lower confidence than anchored rows.");
