/* IM2.5 scoring harness — a LITERAL implementation of the frozen pre-registration.
   Governing frozen artifacts (verified below before ANY computation; runs without the check are
   void — protocol §7 technical enforcement):
     research/d2-validation-protocol.md   (gates, decision rule, E3 estimand)
     research/d2-equation-set.md          (equations §1-§2, fit set §3, conventions §4, recipes §5)
     research/e3-evaluator-v2111/engine-v2111-frozen.js (the ONLY engine E3 may touch)
   Run: node tests/d2-spike-harness.mjs [--baseline-only]
   Output: markdown report on stdout (ledger rows are transcribed from it, never hand-edited). */

import { createRequire } from "module";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

/* ---------- 0. Three-hash enforcement (hard-fail) ---------- */
const FROZEN = {
  "research/d2-validation-protocol.md":
    "2ec72aa70a3b16ef2faa71f715a917b4ec49f72ecb4f7eadbf3c9da8232b5f64",
  "research/d2-equation-set.md":
    "77ddeccc1bf4fa3fa476e096023c3be9de100939dac64e73cc5cb06678fb1aad",
  "research/e3-evaluator-v2111/engine-v2111-frozen.js":
    "71ab5752f7a9d6977bf72e13d6b6ef1fef9ce3c66cf1ac7f924c509aa86cf202",
};
for (const [rel, want] of Object.entries(FROZEN)) {
  const got = createHash("sha256").update(readFileSync(join(ROOT, rel))).digest("hex");
  if (got !== want) {
    console.error(`HASH MISMATCH: ${rel}\n  want ${want}\n  got  ${got}\nRun is VOID (protocol §7).`);
    process.exit(3);
  }
}
console.log("Three-hash enforcement: ALL VERIFIED (protocol §7).\n");

const E = require(join(ROOT, "research/e3-evaluator-v2111/engine-v2111-frozen.js"));

/* ---------- 1. Model architectures (receipt pack §1; R1 = published ARCH block) ---------- */
const MODELS = {
  r1:   { kind: "mla", active: 37e9, total: 671e9, layers: 61, qHeads: 128, qkDim: 192, vDim: 128,
          kvDim: 576, moeLayers: 58, topK: 8, hidden: 7168 },
  qwen3:{ kind: "gqa-moe", active: 35e9, total: 480e9, layers: 62, qHeads: 96, kvHeads: 8,
          headDim: 128, moeLayers: 62, topK: 8, hidden: 6144 },
  l70:  { kind: "gqa-dense", active: 70e9, total: 70e9, layers: 80, qHeads: 64, kvHeads: 8,
          headDim: 128, hidden: 8192 },
  l405: { kind: "gqa-dense", active: 405e9, total: 405e9, layers: 126, qHeads: 128, kvHeads: 8,
          headDim: 128, hidden: 16384 },
};

/* ---------- 2. Frozen equations (equation set §1-§2, literal) ---------- */
function attnFlops(m, L) {
  return m.kind === "mla"
    ? 2 * m.layers * m.qHeads * (m.qkDim + m.vDim) * L
    : 2 * m.layers * m.qHeads * 2 * m.headDim * L;
}
function kvBytesPerTok(m, sKV) {
  return m.kind === "mla"
    ? m.layers * m.kvDim * sKV
    : 2 * m.layers * m.kvHeads * m.headDim * sKV;
}
/* op = { model, L, b, q, a, kvScans, sKV, sAct, sW, wIter, flops, hbmBps, fabricBps,
         mode: "moe"|"tp", N, dispatchScale, hbmCap, nShard } */
function decodeTps(op, eta) {
  const m = op.model;
  const phi = 2 * m.active + attnFlops(m, op.L);
  const K = kvBytesPerTok(m, op.sKV) * op.L;              // KV scan bytes per sequence
  const phiDev = op.mode === "tp" ? phi / op.N : phi;      // §1: dense-TP shards compute
  const KDev   = op.mode === "tp" ? K / op.N : K;          // §1: dense-TP shards KV scan
  const D = op.mode === "tp"
    ? 4 * m.layers * m.hidden * op.sAct * (op.N - 1) / op.N // dense-TP allreduce, per device
    : 2 * m.moeLayers * m.topK * m.hidden * op.sAct * (op.dispatchScale ?? 1); // MoE dispatch
  const tC = op.b * op.q * phiDev / op.flops;
  const tH = (op.wIter + op.b * (op.kvScans ?? op.q) * KDev) / op.hbmBps;
  const tN = op.b * op.q * D / op.fabricBps;
  const tIter = Math.max(tC, tH, tN) / eta;                // t_0 = 0, frozen
  return { tps: op.b * op.a / tIter, tpot: tIter / op.a, roof: tH >= tC && tH >= tN ? "HBM" : tC >= tN ? "compute" : "fabric" };
}
function feasibleB(op) { // feasibility: W_resident + b·L·kv_dev + 10% HBM ≤ HBM (equation set §1)
  const wRes = op.model.total * op.sW / op.nShard;
  const kvDev = kvBytesPerTok(op.model, op.sKV) / op.nShard;
  const room = op.hbmCap * 0.9 - wRes;
  return Math.max(1, Math.floor(room / (op.L * kvDev)));
}
function invertBatch(op, eta, tpotMsBound) { // SLO-batch inversion: argmax tps s.t. TPOT ≤ τ + feasibility
  const bMax = feasibleB(op);
  let best = null;
  for (let b = 1; b <= bMax; b++) {
    const r = decodeTps({ ...op, b }, eta);
    if (tpotMsBound !== null && r.tpot * 1000 > tpotMsBound) continue;
    if (!best || r.tps > best.tps) best = { ...r, b };
  }
  return best; // null ⇒ no feasible batch meets the SLO
}
function prefillTps(op, etaPre) { // §2 exact form
  const m = op.model;
  const phiPre = 2 * m.active + attnFlops(m, op.L / 2);
  const phiDev = op.mode === "tp" ? phiPre / op.N : phiPre;
  const D = op.mode === "tp"
    ? 4 * m.layers * m.hidden * op.sAct * (op.N - 1) / op.N
    : 2 * m.moeLayers * m.topK * m.hidden * op.sAct * (op.dispatchScale ?? 1);
  const tTok = Math.max(phiDev / op.flops, D / op.fabricBps) / etaPre;
  return 1 / tTok;
}

/* ---------- 3. Fit set F1-F7 (equation set §3, operating points literal) ---------- */
const R1 = MODELS.r1;
const F = [
  { id: "F1 h800",  meas: 1850,  op: { model: R1, L: 4989, b: 96,  q: 1, a: 1,    sKV: 1, sAct: 2, sW: 1, wIter: 37e9,   flops: 1.98e15,  hbmBps: 3.35e12, fabricBps: 400e9,  mode: "moe", nShard: 8,   hbmCap: 80e9 } },
  { id: "F2 h20-pro", meas: 675, op: { model: R1, L: 4096, b: 32,  q: 3, a: 1.85, sKV: 1, sAct: 2, sW: 1, wIter: 37e9,   flops: 0.296e15, hbmBps: 4.0e12,  fabricBps: 900e9,  mode: "moe", nShard: 16,  hbmCap: 96e9 } },
  { id: "F3 h20-base", meas: 714,op: { model: R1, L: 4096, b: 48,  q: 3, a: 1.85, sKV: 1, sAct: 2, sW: 1, wIter: 37e9,   flops: 0.296e15, hbmBps: 4.0e12,  fabricBps: 900e9,  mode: "moe", nShard: 16,  hbmCap: 96e9 } },
  { id: "F4 gb200", meas: 10108, op: { model: R1, L: 3000, b: 128, q: 1, a: 1,    sKV: 1, sAct: 2, sW: 0.5, wIter: 18.5e9, flops: 10e15,  hbmBps: 8.0e12,  fabricBps: 1.8e12, mode: "moe", dispatchScale: 0.25, nShard: 72, hbmCap: 186e9 } },
  { id: "F5 ascend-50ms", meas: 1943, op: { model: R1, L: 4096, b: 96, q: 2, a: 1.7, sKV: 2, sAct: 2, sW: 1, wIter: 37e9, flops: 1.504e15, hbmBps: 3.2e12, fabricBps: 784e9, mode: "moe", nShard: 384, hbmCap: 128e9 } },
  { id: "F6 ascend-15ms", meas: 538,  op: { model: R1, L: 4096, b: 8,  q: 2, a: 1.7, sKV: 2, sAct: 2, sW: 1, wIter: 37e9, flops: 1.504e15, hbmBps: 3.2e12, fabricBps: 784e9, mode: "moe", nShard: 384, hbmCap: 128e9 } },
];
const F7 = { id: "F7 h800-prefill", meas: 4026, op: { model: R1, L: 4989, sAct: 2, flops: 1.98e15, fabricBps: 400e9, mode: "moe" } };

/* ---------- 4. η fits (closed-form geometric mean; recorded BEFORE any RETRO number) ---------- */
const logResid = F.map(f => Math.log(f.meas) - Math.log(decodeTps(f.op, 1).tps));
const etaDec = Math.exp(logResid.reduce((a, x) => a + x, 0) / logResid.length);
const etaPre = F7.meas / prefillTps(F7.op, 1);
console.log("## η calibration (FITTED only, closed-form — equation set §3)\n");
console.log(`η_dec = ${etaDec.toFixed(5)} (geometric-mean over F1–F6)`);
F.forEach((f, i) => {
  const pred = decodeTps(f.op, etaDec);
  console.log(`  ${f.id}: meas ${f.meas} | pred@η ${pred.tps.toFixed(0)} (${((pred.tps / f.meas - 1) * 100).toFixed(1)}% resid, roof ${pred.roof}) | implied-η ${Math.exp(logResid[i]).toFixed(4)}`);
});
console.log(`η_pre = ${etaPre.toFixed(5)} (identity fit on F7)\n`);

/* ---------- 5. Score set — 7 observations (equation set §5 recipes, literal) ---------- */
const GB300 = { model: R1, L: 2740, q: 1, a: 1, sKV: 1, sAct: 0.5, sW: 0.5, wIter: 18.5e9,
  flops: 15e15, hbmBps: 8.0e12, fabricBps: 1.8e12, mode: "moe", dispatchScale: 0.25, nShard: 72, hbmCap: 288e9 };
const CM384 = { model: R1, L: 1536, q: 2, a: 1.7, sKV: 2, sAct: 2, sW: 1, wIter: 37e9,
  flops: 1.504e15, hbmBps: 3.2e12, fabricBps: 784e9, mode: "moe", nShard: 384, hbmCap: 128e9 };
const TPU7 = { model: MODELS.qwen3, L: 5000, q: 1, a: 1, sKV: 1, sAct: 1, sW: 1, wIter: 35e9,
  flops: 4.614e15, hbmBps: 7.37e12, fabricBps: 1.2e12, mode: "moe", nShard: 4, hbmCap: 192e9 };
const TRN2_70 = { model: MODELS.l70, L: 10750, b: 1, q: 1, a: 1, sKV: 2, sAct: 2, sW: 2,
  wIter: 70e9 * 2 / 16, flops: 0.65e15, hbmBps: 2.9e12, fabricBps: 1.024e12, mode: "tp", N: 16, nShard: 16, hbmCap: 96e9 };
const TRN2_405 = { model: MODELS.l405, L: 10750, b: 1, q: 1, a: 1, sKV: 2, sAct: 2, sW: 2,
  wIter: 405e9 * 2 / 16, flops: 0.65e15, hbmBps: 2.9e12, fabricBps: 1.024e12, mode: "tp", N: 16, nShard: 16, hbmCap: 96e9 };

const SCORE = [ // obs: per-device measured values; deviceMult converts per-device pred → observation unit
  { id: "gb300-mlperf-server",  row: "gb300", obs: 400436.77, unit: "tok/s/rack", devMult: 72, op: GB300, slo: 80 },
  { id: "gb300-mlperf-offline", row: "gb300", obs: 647076,    unit: "tok/s/rack", devMult: 72, op: GB300, slo: null },
  { id: "cm384-colocation",     row: "ascend", obs: 1646,     unit: "tok/s/card", devMult: 1,  op: CM384, slo: 50 },
  { id: "cm384-6p2d-pool",      row: "ascend", obs: 2885.4,   unit: "tok/s/decode-card", devMult: 1, op: { ...CM384, nShard: 288 }, slo: 50 },
  { id: "tpu7-qwen3",           row: "tpu7",  obs: 518.86,    unit: "tok/s/chip", devMult: 1,  op: TPU7, slo: 50 },
  { id: "trn2-70b-nospec",      row: "trn2",  obs: 36.556,    unit: "tok/s/instance", devMult: 1, op: TRN2_70, slo: "stated-b" },
  { id: "trn2-405b-nospec",     row: "trn2",  obs: 24.421,    unit: "tok/s/instance", devMult: 1, op: TRN2_405, slo: "stated-b" },
];

function predictObs(s, eta) {
  if (s.slo === "stated-b") {           // Trn2: batch stated; TP16 instance is the device-group
    const r = decodeTps(s.op, eta);     // per-GROUP throughput (per-chip shares, group tIter)
    return { pred: r.tps * s.devMult, b: s.op.b, tpot: r.tpot, roof: r.roof };
  }
  const r = invertBatch(s.op, eta, s.slo); // SLO inversion (Offline: slo=null ⇒ throughput-max)
  return r ? { pred: r.tps * s.devMult, b: r.b, tpot: r.tpot, roof: r.roof } : { pred: NaN, b: null, infeasible: true };
}

/* single-scalar G4 baseline (equation set §5 G4 recipes): FLOPS_FP8eq · precMult · 0.0691 / (2·A) */
function baselinePred(s) {
  const op = s.op;
  const fp8eq = { "gb300-mlperf-server": 5e15, "gb300-mlperf-offline": 5e15, "cm384-colocation": 1.504e15,
    "cm384-6p2d-pool": 1.504e15, "tpu7-qwen3": 4.614e15, "trn2-70b-nospec": 1.3e15 / 2, "trn2-405b-nospec": 1.3e15 / 2 }[s.id];
  const precMult = s.id.startsWith("gb300") ? 1.85 : 1.0; // FP4 path per C2; others FP8/INT8/BF16-handled in fp8eq
  const perDev = fp8eq * precMult * 0.0691 / (2 * op.model.active);
  const devs = s.id.startsWith("trn2") ? 16 : s.devMult;   // baseline has no group concept: per-chip ×16
  return perDev * devs;
}

/* ---------- 6. E3 machinery (frozen evaluator; protocol §1/§5) ---------- */
const mOpus = E.MODELS.find(x => x.id === "opus");
const pMed = E.PERSPECTIVES.find(x => x.id === "median");
const sBase = E.applyPresetSettings(mOpus, pMed, { mode: "native" });
const baseMargin = E.workload(sBase).margin;
function e3ForRatios(rowRatios) { // { hwKey: rDec } → joint E3 pp (decode-only at IM2.5)
  const origs = Object.entries(rowRatios).map(([k]) => [k, E.HW[k].effDec]);
  try {
    for (const [k, r] of Object.entries(rowRatios)) E.HW[k].effDec *= r;
    return (E.workload(sBase).margin - baseMargin) * 100;
  } finally { origs.forEach(([k, v]) => { E.HW[k].effDec = v; }); }
}

/* ---------- 7. Score, report, gate ---------- */
const baselineOnly = process.argv.includes("--baseline-only");
const passStats = {}; // pass → { med, worst } for the programmatic G4 comparison
for (const pass of (baselineOnly ? ["baseline"] : ["baseline", "d2"])) {
  console.log(`## ${pass === "baseline" ? "G4 BASELINE — frozen single-scalar (6.91% H800 fit)" : "D2 CANDIDATE — zero tuning"} score rows\n`);
  console.log(`| observation | measured | predicted | rel.err | batch | roof |`);
  console.log(`|---|---|---|---|---|---|`);
  const errs = [];
  for (const s of SCORE) {
    const p = pass === "baseline" ? { pred: baselinePred(s) } : predictObs(s, etaDec);
    const rel = (p.pred - s.obs) / s.obs;
    errs.push({ id: s.id, row: s.row, rel, ratio: p.pred / s.obs });
    console.log(`| ${s.id} | ${s.obs.toLocaleString()} ${s.unit} | ${isNaN(p.pred) ? "INFEASIBLE" : Math.round(p.pred).toLocaleString()} | ${(rel * 100).toFixed(1)}% | ${p.b ?? "—"} | ${p.roof ?? "—"} |`);
  }
  const absErrs = errs.map(e => Math.abs(e.rel)).sort((a, b) => a - b);
  const med = absErrs.length % 2 ? absErrs[(absErrs.length - 1) / 2]
    : (absErrs[absErrs.length / 2 - 1] + absErrs[absErrs.length / 2]) / 2;
  const worst = absErrs[absErrs.length - 1];
  passStats[pass] = { med, worst };
  console.log(`\nG1 population (n=${absErrs.length}): median |err| = ${(med * 100).toFixed(1)}%, worst = ${(worst * 100).toFixed(1)}%`);

  // per-anchor E3 (reporting) + joint exhaustive-corner G3
  const byRow = {};
  errs.forEach(e => { (byRow[e.row] ??= []).push(e.ratio); });
  console.log(`\nPer-anchor E3 (reporting, pp at the pinned default workload):`);
  errs.forEach(e => console.log(`  ${e.id}: ${e3ForRatios({ [e.row]: e.ratio }).toFixed(3)} pp`));
  let worstJoint = 0;
  const rows = Object.keys(byRow);
  const combos = rows.reduce((acc, r) => acc.flatMap(c => byRow[r].map(x => ({ ...c, [r]: x }))), [{}]);
  for (const c of combos) { const v = e3ForRatios(c); if (Math.abs(v) > Math.abs(worstJoint)) worstJoint = v; }
  console.log(`G3 joint (exhaustive over ${combos.length} per-row candidate combos): E3_joint = ${worstJoint.toFixed(3)} pp`);

  if (pass === "d2") {
    console.log(`\n## Gate evaluation (protocol §5, three-state)\n`);
    const g1 = med <= 0.25 && worst <= 0.40;
    console.log(`- G1 decode: median ${(med * 100).toFixed(1)}% (≤25) ${med <= 0.25 ? "OK" : "MISS"}, worst ${(worst * 100).toFixed(1)}% (≤40) ${worst <= 0.40 ? "OK" : "MISS"} → **${g1 ? "PASS" : "FAIL"}**`);
    console.log(`- G2 prefill: **UNSCOREABLE** (no eligible prefill observation — protocol §5 stated)`);
    const g3 = Math.abs(worstJoint) <= 5;
    console.log(`- G3 joint: |${worstJoint.toFixed(2)}| pp (≤5) → **${g3 ? "PASS" : "FAIL"}**${g1 ? " (decode-only; carries no weight beyond G1 while G1 passes — protocol §5(4))" : " (decode-only; does not rescue a G1 FAIL — protocol §5(4))"}`);
    const b = passStats.baseline;
    const g4 = med < b.med && worst < b.worst; // strictly better on median AND worst
    console.log(`- G4 baseline beat: median ${(med * 100).toFixed(1)}% vs baseline ${(b.med * 100).toFixed(1)}% ${med < b.med ? "OK" : "MISS"}; worst ${(worst * 100).toFixed(1)}% vs baseline ${(b.worst * 100).toFixed(1)}% ${worst < b.worst ? "OK" : "MISS"} → **${g4 ? "PASS" : "FAIL"}**`);
    console.log(`- G5 identifiability: 7 obs / 2 params = 3.5 ≥ 1.0 → **PASS**`);
    const anyFail = !g1 || !g3 || !g4;
    console.log(`\n**VERDICT (§5 decision rule): ${anyFail ? "FAIL → KILL/redesign" : "PASS (decode-scope; G2 unscoreable)"}**`);
  }
  console.log("");
}
