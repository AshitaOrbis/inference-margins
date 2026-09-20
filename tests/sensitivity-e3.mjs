/* IM2.5 sensitivity derivation (protocol §7 step 1): engine runs mapping G1/G2 relative-error
   magnitudes on each RETRO-anchored platform row to E3 — margin points at the v2.1.11 default
   workload (Opus 4.x preset + [lens] central scenario + native Reference 15:1/60% traffic).

   Operationalization (protocol §1 E3, reading made explicit): for a prediction error ratio
   r = T_pred / T_obs on row p's phase throughput, E3(p, phase, r) =
   margin(base scenario with HW[p].eff{Dec,Pre} scaled by r) − margin(base scenario), in pp.
   tokPerS() is linear in effDec/effPre, so scaling the eff field scales the row's modeled
   throughput by exactly r. Run: node tests/sensitivity-e3.mjs */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
// Frozen E3 evaluator (Sol freeze-review #13): NEVER the live site/engine.js — IM3+ changes it.
const E = require("../research/e3-evaluator-v2111/engine-v2111-frozen.js");

const m = E.MODELS.find(x => x.id === "opus");
const p = E.PERSPECTIVES.find(x => x.id === "median");
const s = E.applyPresetSettings(m, p, { mode: "native" });
const base = E.workload(s).margin;

const pct = v => (v * 100).toFixed(2);
const pp = v => (v >= 0 ? "+" : "") + v.toFixed(3);

function withScaled(hwKey, field, ratio, fn) {
  const hw = E.HW[hwKey];
  const orig = hw[field];
  hw[field] = orig * ratio;
  try { return fn(); } finally { hw[field] = orig; }
}
function e3Single(hwKey, field, delta, scenario = s, baseMargin = base) {
  return withScaled(hwKey, field, 1 + delta,
    () => (E.workload(scenario).margin - baseMargin) * 100);
}
function e3Joint(rows, delta, field) { // same delta on several rows at once
  const origs = rows.map(k => [k, E.HW[k][field]]);
  try {
    rows.forEach(k => { E.HW[k][field] *= (1 + delta); });
    return (E.workload(s).margin - base) * 100;
  } finally {
    origs.forEach(([k, v]) => { E.HW[k][field] = v; });
  }
}
// invert: |delta| (one direction) at which |E3| reaches target pp; null if not reached by |delta|=0.95
function deltaForE3(hwKey, field, targetPp, dir) {
  let lo = 0, hi = 0.95;
  if (Math.abs(e3Single(hwKey, field, dir * hi)) < targetPp) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    (Math.abs(e3Single(hwKey, field, dir * mid)) >= targetPp) ? hi = mid : lo = mid;
  }
  return hi;
}

const w = E.blendWeights(s);
console.log("# E3 sensitivity derivation — engine runs at the v2.1.11 default workload");
console.log(`\nBase scenario: Opus 4.x + central-scenario lens + Reference 15:1/60% (native).`);
console.log(`Base margin: ${pct(base)}%  |  fleet weights: ${JSON.stringify(w)}`);
console.log(`RETRO platform rows and default-fleet shares: gb300=${w.gb300 ?? 0}, tpu7=${w.tpu7 ?? 0}, trn2=${w.trn2 ?? 0}, ascend=${w.ascend ?? 0} (CM384 row NOT in the default fleet)`);

const ROWS = ["gb300", "tpu7", "trn2", "ascend"];
const DEC_GRID = [-0.60, -0.40, -0.25, -0.10, 0.10, 0.25, 0.40, 0.60];
const PRE_GRID = [-0.60, -0.35, -0.10, 0.10, 0.35, 0.60];

console.log("\n## Decode (G1 axis): E3 in margin points, single-row perturbation");
console.log("| row | " + DEC_GRID.map(d => (d > 0 ? "+" : "") + d * 100 + "%").join(" | ") + " |");
console.log("|---|" + DEC_GRID.map(() => "---").join("|") + "|");
for (const k of ROWS)
  console.log(`| ${k} | ` + DEC_GRID.map(d => pp(e3Single(k, "effDec", d))).join(" | ") + " |");

console.log("\n## Prefill (G2 axis): E3 in margin points, single-row perturbation");
console.log("| row | " + PRE_GRID.map(d => (d > 0 ? "+" : "") + d * 100 + "%").join(" | ") + " |");
console.log("|---|" + PRE_GRID.map(() => "---").join("|") + "|");
for (const k of ROWS)
  console.log(`| ${k} | ` + PRE_GRID.map(d => pp(e3Single(k, "effPre", d))).join(" | ") + " |");

console.log("\n## Inversion: single-row error magnitude at which |E3| reaches G3's provisional bounds");
console.log("| row | phase | δ for 5pp (under-pred) | δ for 10pp (under-pred) | δ for 5pp (over-pred) | δ for 10pp (over-pred) |");
console.log("|---|---|---|---|---|---|");
for (const k of ROWS) for (const [field, label] of [["effDec", "decode"], ["effPre", "prefill"]]) {
  const f = (t, dir) => { const d = deltaForE3(k, field, t, dir); return d === null ? ">95%" : (d * 100).toFixed(1) + "%"; };
  console.log(`| ${k} | ${label} | ${f(5, -1)} | ${f(10, -1)} | ${f(5, 1)} | ${f(10, 1)} |`);
}

console.log("\n## Joint corners (all three in-fleet RETRO rows: gb300+tpu7+trn2 simultaneously)");
for (const [d, label] of [[-0.25, "decode −25% (G1 median bound)"], [-0.40, "decode −40% (G1 worst bound)"], [0.25, "decode +25%"], [0.40, "decode +40%"]])
  console.log(`- ${label}: E3 = ${pp(e3Joint(["gb300", "tpu7", "trn2"], d, "effDec"))} pp`);
for (const [d, label] of [[-0.35, "prefill −35% (G2 median bound)"], [-0.60, "prefill −60% (G2 worst bound)"]])
  console.log(`- ${label}: E3 = ${pp(e3Joint(["gb300", "tpu7", "trn2"], d, "effPre"))} pp`);
{ // worst combined corner: decode −40% AND prefill −60% on all three rows
  const origs = ["gb300", "tpu7", "trn2"].map(k => [k, E.HW[k].effDec, E.HW[k].effPre]);
  try {
    origs.forEach(([k]) => { E.HW[k].effDec *= 0.60; E.HW[k].effPre *= 0.40; });
    console.log(`- combined worst corner (dec −40% + pre −60%, all three rows): E3 = ${pp((E.workload(s).margin - base) * 100)} pp`);
  } finally {
    origs.forEach(([k, d, pr]) => { E.HW[k].effDec = d; E.HW[k].effPre = pr; });
  }
}
{ // gate-compliant corner (Sol freeze-review #5): a per-observation error population that PASSES
  // G1/G2 medians AND worsts (multi-operating-point anchors absorb the sub-threshold entries) can
  // still put every in-fleet ROW at its per-row worst via the G3 selection: decode −40% on all
  // three rows; prefill gb300 −35% / tpu7 −60% / trn2 −35%.
  const spec = [["gb300", 0.60, 0.65], ["tpu7", 0.60, 0.40], ["trn2", 0.60, 0.65]];
  const origs = spec.map(([k]) => [k, E.HW[k].effDec, E.HW[k].effPre]);
  try {
    spec.forEach(([k, dm, pm]) => { E.HW[k].effDec *= dm; E.HW[k].effPre *= pm; });
    console.log(`- gate-compliant corner (dec −40% rows; pre −35%/−60%/−35%): E3 = ${pp((E.workload(s).margin - base) * 100)} pp`);
  } finally {
    origs.forEach(([k, d, pr]) => { E.HW[k].effDec = d; E.HW[k].effPre = pr; });
  }
}

console.log("\n## Auxiliary (context only, NOT part of E3): Ascend row sensitivity where it has fleet share");
for (const mid of ["glm", "dsv4"]) {
  const mm = E.MODELS.find(x => x.id === mid);
  const ss = E.applyPresetSettings(mm, p, { mode: "native" });
  const b2 = E.workload(ss).margin;
  const ws = E.blendWeights(ss);
  const at = d => pp(e3Single("ascend", "effDec", d, ss, b2));
  console.log(`- ${mid} (ascend share ${ws.ascend ?? 0}, base ${pct(b2)}%): decode −40% → ${at(-0.40)} pp; −25% → ${at(-0.25)} pp; +25% → ${at(0.25)} pp; +40% → ${at(0.40)} pp`);
}
