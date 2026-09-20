/* IM2.5 cycle-2 scoring harness — a LITERAL implementation of the frozen cycle-2 pre-registration.
   Governing frozen artifacts (verified below before ANY computation; runs without the check are
   void — protocol §7 technical enforcement):
     research/d2-validation-protocol.md        (gates §5, E3 estimand §1)
     research/d2-equation-set-v2.md            (v2.2: decode §1 incl. t_cc §1.5, prefill §2, fit §3,
                                                closure hierarchy §4, recipes §5, Trn2 §7, annex §10,
                                                scoring mechanics §11)
     research/e3-evaluator-v2111/engine-v2111-frozen.js (the ONLY engine E3 may touch)
   Run: node tests/d2-spike-harness-v2.mjs
   Output: research/cycle2-scores.json (machine-readable) + a human gate table on stdout.
   Commits nothing. */

import { createRequire } from "module";
import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

/* ============================================================================
   0. THREE-HASH ENFORCEMENT (hard-fail) — cycle-2 FREEZE BLOCK hashes (ledger)
   ============================================================================ */
const FROZEN = {
  "research/d2-validation-protocol.md":
    "2ec72aa70a3b16ef2faa71f715a917b4ec49f72ecb4f7eadbf3c9da8232b5f64",
  "research/d2-equation-set-v2.md":
    "66ed0df09597cc96bea348d495b6e1ed83362aa00ae5a664a38739512c152db1",
  "research/e3-evaluator-v2111/engine-v2111-frozen.js":
    "71ab5752f7a9d6977bf72e13d6b6ef1fef9ce3c66cf1ac7f924c509aa86cf202",
};
const hashResults = {};
for (const [rel, want] of Object.entries(FROZEN)) {
  const got = createHash("sha256").update(readFileSync(join(ROOT, rel))).digest("hex");
  hashResults[rel] = { want, got, ok: got === want };
  if (got !== want) {
    console.error(`HASH MISMATCH: ${rel}\n  want ${want}\n  got  ${got}\nRun is VOID (protocol §7).`);
    process.exit(3);
  }
}
console.log("Three-hash enforcement: ALL VERIFIED (protocol §7 / cycle-2 freeze block).\n");

const E = require(join(ROOT, "research/e3-evaluator-v2111/engine-v2111-frozen.js"));

/* ============================================================================
   1. MODEL ARCHITECTURES (receipt pack §1, verbatim ARCH fields)
   ============================================================================ */
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

/* ============================================================================
   2. FROZEN EQUATIONS (equation set §1 decode, §1.5 t_cc, §2 prefill, literal)
   ============================================================================ */

// §1.5: τ_cc = N_ring_steps · τ_hop = 30 · 600 ns = 18 µs/collective (DECLARED scenario constants).
const N_RING_STEPS = 30;          // 2·(16-1), flat 16-chip bandwidth-optimal ring all-reduce
const TAU_HOP = 600e-9;           // NeuronCore-v3 DGE-DMA instruction latency [EV §B.1], s/ring-step
const TAU_CC = N_RING_STEPS * TAU_HOP;   // = 18e-6 s/collective (the ONLY scored value)

function attnFlops(m, L) {        // §1.1
  return m.kind === "mla"
    ? 2 * m.layers * m.qHeads * (m.qkDim + m.vDim) * L
    : 2 * m.layers * m.qHeads * 2 * m.headDim * L;
}
function kvBytesPerTok(m, sKV) {  // §1.1
  return m.kind === "mla"
    ? m.layers * m.kvDim * sKV
    : 2 * m.layers * m.kvHeads * m.headDim * sKV;
}

/* op = { model, L, b, q, a, kvScans, sKV, sAct, sW, wIter, flops, hbmBps, fabricBps,
         mode: "moe"|"tp", N, dispatchScale, hbmCap, nShard } */
function decodeTps(op, eta) {                                       // §1.2 (+ §1.5 t_cc)
  const m = op.model;
  const phi = 2 * m.active + attnFlops(m, op.L);
  const K = kvBytesPerTok(m, op.sKV) * op.L;                       // KV scan bytes per sequence
  const phiDev = op.mode === "tp" ? phi / op.N : phi;             // dense-TP shards compute; MoE device-equivalent
  const KDev   = op.mode === "tp" ? K / op.N : K;                 // dense-TP shards KV scan; MoE unsharded
  const D = op.mode === "tp"
    ? 4 * m.layers * m.hidden * op.sAct * (op.N - 1) / op.N        // dense-TP allreduce, per device
    : 2 * m.moeLayers * m.topK * m.hidden * op.sAct * (op.dispatchScale ?? 1); // MoE dispatch+combine, §1.1 local=1
  const tC = op.b * op.q * phiDev / op.flops;
  const tH = (op.wIter + op.b * (op.kvScans ?? op.q) * KDev) / op.hbmBps;
  const tN = op.b * op.q * D / op.fabricBps;
  const tRoof = Math.max(tC, tH, tN) / eta;                        // §1.2 t_roof, t_0 = 0
  const tCC = op.mode === "tp" ? 2 * m.layers * TAU_CC : 0;        // §1.5 t_cc = N_coll·τ_cc, dense-TP only
  const tIter = tRoof + tCC;                                       // §1.2 t_iter = t_roof + t_cc
  const roof = tH >= tC && tH >= tN ? "HBM" : tC >= tN ? "compute" : "fabric";
  return { tps: op.b * op.a / tIter, tpot: tIter / op.a, tC, tH, tN, tRoof, tCC, tIter, roof };
}

function feasibleB(op) {                                           // §1.3 + §1.4 (sharding-consistency fix)
  const wRes = op.model.total * op.sW / op.nShard;                // weights EP-sharded (unchanged)
  const kvPerTok = kvBytesPerTok(op.model, op.sKV);
  const kvDev = op.mode === "tp" ? kvPerTok / op.N : kvPerTok;    // §1.4: MoE-EP unsharded; dense-TP ÷N
  const room = op.hbmCap * 0.9 - wRes;                            // W_workspace = 10% HBM (C8)
  if (room <= 0) return 0;                                        // infeasible even at b=0
  return Math.floor(room / (op.L * kvDev));
}

function prefillTps(op, etaPre) {                                  // §2 exact form (no t_cc, §2)
  const m = op.model;
  const phiPre = 2 * m.active + attnFlops(m, op.L / 2);           // causal-average attention
  const phiDev = op.mode === "tp" ? phiPre / op.N : phiPre;
  const D = op.mode === "tp"
    ? 4 * m.layers * m.hidden * op.sAct * (op.N - 1) / op.N
    : 2 * m.moeLayers * m.topK * m.hidden * op.sAct * (op.dispatchScale ?? 1);
  const tTok = Math.max(phiDev / op.flops, D / op.fabricBps) / etaPre;
  return 1 / tTok;
}

/* ============================================================================
   3. FIT SET F1–F7 (equation set §3.1, UNCHANGED from v1 — η reproduction anchor)
   ============================================================================ */
const R1 = MODELS.r1;
const F = [
  { id: "F1 h800",       meas: 1850,  op: { model: R1, L: 4989, b: 96,  q: 1, a: 1,    sKV: 1, sAct: 2, sW: 1,   wIter: 37e9,   flops: 1.98e15,  hbmBps: 3.35e12, fabricBps: 400e9,  mode: "moe", nShard: 8,   hbmCap: 80e9 } },
  { id: "F2 h20-pro",    meas: 675,   op: { model: R1, L: 4096, b: 32,  q: 3, a: 1.85, sKV: 1, sAct: 2, sW: 1,   wIter: 37e9,   flops: 0.296e15, hbmBps: 4.0e12,  fabricBps: 900e9,  mode: "moe", nShard: 16,  hbmCap: 96e9 } },
  { id: "F3 h20-base",   meas: 714,   op: { model: R1, L: 4096, b: 48,  q: 3, a: 1.85, sKV: 1, sAct: 2, sW: 1,   wIter: 37e9,   flops: 0.296e15, hbmBps: 4.0e12,  fabricBps: 900e9,  mode: "moe", nShard: 16,  hbmCap: 96e9 } },
  { id: "F4 gb200",      meas: 10108, op: { model: R1, L: 3000, b: 128, q: 1, a: 1,    sKV: 1, sAct: 2, sW: 0.5, wIter: 18.5e9, flops: 10e15,    hbmBps: 8.0e12,  fabricBps: 1.8e12, mode: "moe", dispatchScale: 0.25, nShard: 72, hbmCap: 186e9 } },
  { id: "F5 ascend-50ms",meas: 1943,  op: { model: R1, L: 4096, b: 96,  q: 2, a: 1.7,  sKV: 2, sAct: 2, sW: 1,   wIter: 37e9,   flops: 1.504e15, hbmBps: 3.2e12,  fabricBps: 784e9,  mode: "moe", nShard: 384, hbmCap: 128e9 } },
  { id: "F6 ascend-15ms",meas: 538,   op: { model: R1, L: 4096, b: 8,   q: 2, a: 1.7,  sKV: 2, sAct: 2, sW: 1,   wIter: 37e9,   flops: 1.504e15, hbmBps: 3.2e12,  fabricBps: 784e9,  mode: "moe", nShard: 384, hbmCap: 128e9 } },
];
const F7 = { id: "F7 h800-prefill", meas: 4026, op: { model: R1, L: 4989, sAct: 2, flops: 1.98e15, fabricBps: 400e9, mode: "moe" } };

/* ---- 3.2 η fits (closed-form; recorded BEFORE any RETRO number). t_cc ≡ 0 on all-MoE fit rows ---- */
const logResid = F.map(f => Math.log(f.meas) - Math.log(decodeTps(f.op, 1).tps));
const etaDec = Math.exp(logResid.reduce((a, x) => a + x, 0) / logResid.length);
const etaPre = F7.meas / prefillTps(F7.op, 1);

// Mandatory sanity anchor (task): must reproduce the cycle-1 published η to 5 decimals.
const ETA_DEC_PUB = 0.36142, ETA_PRE_PUB = 0.17581;
const etaDecOk = Math.abs(etaDec - ETA_DEC_PUB) < 5e-6;
const etaPreOk = Math.abs(etaPre - ETA_PRE_PUB) < 5e-6;
if (!etaDecOk || !etaPreOk) {
  console.error(`η SANITY-ANCHOR FAIL: η_dec=${etaDec.toFixed(5)} (want ${ETA_DEC_PUB}), η_pre=${etaPre.toFixed(5)} (want ${ETA_PRE_PUB}).`);
  process.exit(4);
}

console.log("## η calibration (FITTED only, closed-form — equation set §3; sanity-anchored to cycle-1)\n");
console.log(`η_dec = ${etaDec.toFixed(5)}  (geometric-mean over F1–F6; cycle-1 published ${ETA_DEC_PUB} — MATCH)`);
const fitResid = F.map((f, i) => {
  const pred = decodeTps(f.op, etaDec);
  return { id: f.id, meas: f.meas, pred: pred.tps, residPct: (pred.tps / f.meas - 1) * 100, impliedEta: Math.exp(logResid[i]), roof: pred.roof };
});
fitResid.forEach(r => console.log(`  ${r.id.padEnd(14)}: meas ${r.meas} | pred@η ${r.pred.toFixed(0)} (${r.residPct.toFixed(1)}% resid, ${r.roof}) | implied-η ${r.impliedEta.toFixed(4)}`));
console.log(`η_pre = ${etaPre.toFixed(5)}  (identity fit on F7; cycle-1 published ${ETA_PRE_PUB} — MATCH)\n`);

/* ============================================================================
   4. SCORE-SET OPERATING POINTS (equation set §5 recipes; §1.3 N_shard replica-width)
   ============================================================================ */
// §1.1 local-fraction-1 for all RETRO platforms ⇒ MoE dispatchScale defaults to 1 (F4 keeps 0.25).
const GB300 = { model: R1, L: 2740, q: 1, a: 1, sKV: 1, sAct: 0.5, sW: 0.5, wIter: 18.5e9,
  flops: 15e15, hbmBps: 8.0e12, fabricBps: 1.8e12, mode: "moe", nShard: 8, hbmCap: 288e9 };            // §1.3 replica width 8
const CM384_6P2D = { model: R1, L: 1536, q: 2, a: 1.7, sKV: 2, sAct: 2, sW: 1, wIter: 37e9,
  flops: 1.504e15, hbmBps: 3.2e12, fabricBps: 784e9, mode: "moe", nShard: 144, hbmCap: 128e9 };        // §1.3 replica width 144
const CM384_COLOC = { ...CM384_6P2D, nShard: 128 };                                                    // §1.3 replica width 128
const TPU7 = { model: MODELS.qwen3, L: 5000, q: 1, a: 1, sKV: 1, sAct: 1, sW: 1, wIter: 35e9,
  flops: 4.614e15, hbmBps: 7.37e12, fabricBps: 1.2e12, mode: "moe", nShard: 4, hbmCap: 192e9 };
const TRN2_70 = { model: MODELS.l70, L: 10750, b: 1, q: 1, a: 1, sKV: 2, sAct: 2, sW: 2,
  wIter: 70e9 * 2 / 16, flops: 0.65e15, hbmBps: 2.9e12, fabricBps: 1.024e12, mode: "tp", N: 16, nShard: 16, hbmCap: 96e9 };
const TRN2_405 = { ...TRN2_70, model: MODELS.l405, wIter: 405e9 * 2 / 16 };
// Trn2 prefill ops (§2, dense-TP), L = ISL = 10,000 (Φ_pre uses L/2 causal-average internally)
const TRN2_70_PRE  = { model: MODELS.l70,  L: 10000, sAct: 2, flops: 0.65e15, fabricBps: 1.024e12, mode: "tp", N: 16 };
const TRN2_405_PRE = { model: MODELS.l405, L: 10000, sAct: 2, flops: 0.65e15, fabricBps: 1.024e12, mode: "tp", N: 16 };
// G2 annex prefill op (§10): R1, L_in = 800, NVFP4 (sAct 0.5), MoE-EP, per prefill-GPU
const ANNEX_PRE = { model: R1, L: 800, sAct: 0.5, flops: 15e15, fabricBps: 1.8e12, mode: "moe" };

const TRN2 = { ISL: 10000, OSL: 1500 };  // §5 recipe 6–7, §7

/* ---- closure primitives (§4.1) ---- */
function pinPredict(op, bPin, devMult) {                 // class-1 / class-4-cap-equality: pin b, feasibility-check
  const feas = feasibleB(op);
  if (bPin > feas) return { infeasible: true, feas, bPin };
  const r = decodeTps({ ...op, b: bPin }, etaDec);
  return { pred: r.tps * devMult, perDev: r.tps, b: bPin, feas, work: r };
}
function ceilingInvert(op, tpotBoundMs, devMult) {       // class-4 ceiling-equality: max b s.t. TPOT ≤ bound ∧ feasible
  const feas = feasibleB(op);
  let best = null;
  for (let b = 1; b <= feas; b++) {
    const r = decodeTps({ ...op, b }, etaDec);
    if (r.tpot * 1000 > tpotBoundMs) break;              // TPOT monotonic ↑ in b
    best = { pred: r.tps * devMult, perDev: r.tps, b, feas, work: r };
  }
  if (!best) return { infeasible: true, feas, reason: feas < 1 ? "HBM cannot hold even b=1" : "b=1 TPOT already exceeds bound" };
  return best;
}

/* ============================================================================
   5. SCORE THE ROWS
   ============================================================================ */
const rows = {};   // keyed by row id — full working record for the JSON

// --- CL-2 gb300-offline (class 4, cap-equality hypothesis: pin b=1,536/rank) — TWO-SIDED ---
{
  const p = pinPredict(GB300, 1536, 72);
  rows["gb300-offline"] = { obs: 647076, unit: "tok/s/rack", hw: "gb300", closureClass: 4,
    closure: "cap-equality hypothesis, pin b=1536/attention-rank (CL-2)", twoSided: true, ...p };
}
// --- CL-3 cm384-6p2d (class 4, ceiling-equality: TPOT=50ms, N_shard=144) — TWO-SIDED ---
{
  const p = ceilingInvert(CM384_6P2D, 50, 1);
  rows["cm384-6p2d"] = { obs: 2885.4, unit: "tok/s/decode-card", hw: "ascend", closureClass: 4,
    closure: "ceiling-equality hypothesis, b*=max b s.t. TPOT≤50ms ∧ feasible (CL-3)", twoSided: true, ...p };
}
// --- CL-4 cm384-coloc (class 4, ceiling-equality: TPOT=50ms, N_shard=128) — TWO-SIDED ---
{
  const p = ceilingInvert(CM384_COLOC, 50, 1);
  rows["cm384-coloc"] = { obs: 1646, unit: "tok/s/card", hw: "ascend", closureClass: 4,
    closure: "ceiling-equality hypothesis, b*=max b s.t. TPOT≤50ms ∧ feasible (CL-4)", twoSided: true, ...p };
}
// --- CL-5 tpu7 (class 1, stated concurrency: pin b=16/chip, NO SLO) — TWO-SIDED ---
{
  const p = pinPredict(TPU7, 16, 1);
  rows["tpu7"] = { obs: 518.86, unit: "tok/s/chip", hw: "tpu7", closureClass: 1,
    closure: "stated concurrency 64/4 → pin b=16/chip, no SLO (CL-5)", twoSided: true, ...p };
}
// --- CL-6/CL-7 trn2 {70b,405b} (class 1, b=1, wall-clock §7 mapping) — TWO-SIDED ---
function trn2Row(decOp, preOp, obs, id) {
  const feas = feasibleB(decOp);
  if (decOp.b > feas) { rows[id] = { obs, unit: "tok/s/instance", hw: "trn2", closureClass: 1, twoSided: true, infeasible: true, feas }; return; }
  const dec = decodeTps(decOp, etaDec);                 // b=1 decode + t_cc
  const tPre = prefillTps(preOp, etaPre);               // §2 dense-TP prefill throughput (group per-token)
  const ttft = TRN2.ISL / tPre;                         // TTFT_pred = ISL / T̂_pre (§7.2)
  const tpot = dec.tpot;                                // = t_iter (a=1)
  const overall = TRN2.OSL / (ttft + TRN2.OSL * tpot);  // Overall_pred (§7.2)
  rows[id] = { obs, unit: "tok/s/instance", hw: "trn2", closureClass: 1,
    closure: "b=1, TP16, wall-clock Overall mapping (§7)", twoSided: true,
    pred: overall, ttftPred: ttft, tpotPred: tpot, tPre, tCC: dec.tCC, tRoofDec: dec.tRoof,
    decWork: dec, feas, invTPOT: 1 / tpot };
}
trn2Row(TRN2_70,  TRN2_70_PRE,  36.55567822866449, "trn2-70b");
trn2Row(TRN2_405, TRN2_405_PRE, 24.421011092151268, "trn2-405b");

// --- CL-1 gb300-server (class 3, demand-censored, one-sided) — NOT in G1 ---
let server;
{
  const inv = ceilingInvert(GB300, 80, 72);             // Ĉ_model = per-GPU cap ×72 at max feasible b, TPOT≤80ms
  const offered = 426800;                               // 110 req/s × 3,880 dataset OSL
  if (inv.infeasible) {
    server = { hw: "gb300", closureClass: 3, oneSided: true, offered, unscoreable: true, reason: inv.reason };
  } else {
    const Chat = inv.pred;
    const adverse = Chat < offered;
    server = { hw: "gb300", closureClass: 3, oneSided: true, offered, Chat, bStar: inv.b, perDev: inv.perDev,
      Yhat: Math.min(Chat, offered), adverse, verdict: adverse ? "FAIL" : "PASS (one-sided, feasibility-only)",
      obs: 400436.77, obsFracOfOffered: 400436.77 / offered, work: inv.work };
  }
}

// --- §10 G2 annex gb300-interactive prefill (class 3, demand-censored, one-sided) ---
let annex;
{
  const Cpre = prefillTps(ANNEX_PRE, etaPre);           // per prefill-GPU
  const offered = 6800;                                 // 68 req/s × 800 ISL ÷ 8 GPUs
  if (!isFinite(Cpre) || Cpre <= 0) {
    annex = { hw: "gb300", phase: "prefill", closureClass: 3, oneSided: true, offered, unscoreable: true, reason: "Ĉ_pre non-finite" };
  } else {
    const adverse = Cpre < offered;
    annex = { hw: "gb300", phase: "prefill", closureClass: 3, oneSided: true, offered, Cpre, adverse,
      verdict: adverse ? "FAIL" : "PASS (one-sided, feasibility-only)", Yhat: Math.min(Cpre, offered) };
  }
}

/* ============================================================================
   6. G4 SINGLE-SCALAR BASELINE (equation set §5.1; scored on the 6 two-sided rows)
   ============================================================================ */
// T̂ = FLOPS_p(FP8-equiv) · precMult · 0.0691 / (2·A_m) per device; per-rack/instance × device count.
function baselinePred(id) {
  const cfg = {
    "gb300-offline": { fp8eq: 5e15,     precMult: 1.85, active: 37e9,  devs: 72 },  // NVFP4 path (C2)
    "cm384-6p2d":    { fp8eq: 1.504e15, precMult: 1.0,  active: 37e9,  devs: 1 },   // INT8
    "cm384-coloc":   { fp8eq: 1.504e15, precMult: 1.0,  active: 37e9,  devs: 1 },
    "tpu7":          { fp8eq: 4.614e15, precMult: 1.0,  active: 35e9,  devs: 1 },   // FP8
    "trn2-70b":      { fp8eq: 1.3e15/2, precMult: 1.0,  active: 70e9,  devs: 16 },  // BF16 = FP8/2 (C10)
    "trn2-405b":     { fp8eq: 1.3e15/2, precMult: 1.0,  active: 405e9, devs: 16 },
  }[id];
  return cfg.fp8eq * cfg.precMult * 0.0691 / (2 * cfg.active) * cfg.devs;
}

/* ============================================================================
   7. E3 MACHINERY (frozen evaluator; protocol §1 estimand, §5 joint-corner G3)
   ============================================================================ */
const mOpus = E.MODELS.find(x => x.id === "opus");
const pMed = E.PERSPECTIVES.find(x => x.id === "median");
const sBase = E.applyPresetSettings(mOpus, pMed, { mode: "native" });
const baseMargin = E.workload(sBase).margin;
function e3ForRatios(rowRatios) {                        // { hwKey: rDec } → joint E3 pp (decode)
  const origs = Object.entries(rowRatios).map(([k]) => [k, E.HW[k].effDec]);
  try {
    for (const [k, r] of Object.entries(rowRatios)) E.HW[k].effDec *= r;
    return (E.workload(sBase).margin - baseMargin) * 100;
  } finally { origs.forEach(([k, v]) => { E.HW[k].effDec = v; }); }
}

/* ============================================================================
   8. §11 SCORING MECHANICS (median, thresholds, worst, infeasibility ⇒ +∞)
   ============================================================================ */
function relError(pred, obs) { return (pred - obs) / obs; }         // §11 pinned formula
function scoreTwoSided(order) {                                     // order = list of row ids (G1 gating set)
  const per = order.map(id => {
    const r = rows[id];
    const rel = r.infeasible ? Infinity : relError(r.pred, r.obs);   // §11 infeasibility ⇒ |rel|=+∞ (falsification)
    return { id, rel, abs: Math.abs(rel), infeasible: !!r.infeasible, pred: r.pred, obs: r.obs, hw: r.hw, cls: r.closureClass };
  });
  const absSorted = per.map(p => p.abs).sort((a, b) => a - b);
  const n = absSorted.length;
  const median = n % 2 ? absSorted[(n - 1) / 2] : (absSorted[n / 2 - 1] + absSorted[n / 2]) / 2; // even-n: mean of 3rd&4th
  const worst = absSorted[n - 1];
  const cntLe25 = per.filter(p => p.abs <= 0.25).length;            // inclusive (§11)
  const cntLe40 = per.filter(p => p.abs <= 0.40).length;
  return { per, median, worst, cntLe25, cntLe40, n };
}

// G1 gating population: the 6 two-sided decode rows (§4.1 gating population)
const G1_ORDER = ["gb300-offline", "cm384-6p2d", "cm384-coloc", "tpu7", "trn2-70b", "trn2-405b"];
const d2 = scoreTwoSided(G1_ORDER);

// Baseline on the SAME 6 rows (§5.1 / §11 G4 comparison set)
const baseErrs = G1_ORDER.map(id => ({ id, pred: baselinePred(id), obs: rows[id].obs, abs: Math.abs(relError(baselinePred(id), rows[id].obs)) }));
const baseAbsSorted = baseErrs.map(e => e.abs).sort((a, b) => a - b);
const baseMedian = (baseAbsSorted[2] + baseAbsSorted[3]) / 2;
const baseWorst = baseAbsSorted[5];

// Baseline reproduction sanity vs §5.1 frozen values
const BASE_EXPECT = { "gb300-offline": 0.039, "cm384-coloc": 0.147, "cm384-6p2d": 0.513, "tpu7": 7.778, "trn2-70b": 139.419, "trn2-405b": 35.330 };
const baseReproOk = baseErrs.every(e => Math.abs(e.abs - BASE_EXPECT[e.id]) / BASE_EXPECT[e.id] < 0.01);

/* ---- G3 joint (exhaustive per-row candidate combos; ascend contributes 0; server/annex only if adverse) ---- */
const rowCandidates = {
  gb300: [rows["gb300-offline"].infeasible ? 0 : rows["gb300-offline"].pred / rows["gb300-offline"].obs],
  ascend: [rows["cm384-6p2d"].infeasible ? 0 : rows["cm384-6p2d"].pred / rows["cm384-6p2d"].obs,
           rows["cm384-coloc"].infeasible ? 0 : rows["cm384-coloc"].pred / rows["cm384-coloc"].obs],
  tpu7: [rows["tpu7"].infeasible ? 0 : rows["tpu7"].pred / rows["tpu7"].obs],
  trn2: [rows["trn2-70b"].infeasible ? 0 : rows["trn2-70b"].pred / rows["trn2-70b"].obs,
         rows["trn2-405b"].infeasible ? 0 : rows["trn2-405b"].pred / rows["trn2-405b"].obs],
};
if (server && server.adverse) rowCandidates.gb300.push(server.Chat / server.offered); // §11: server adverse ratio Ĉ/426,800
const hwKeys = Object.keys(rowCandidates);
const combos = hwKeys.reduce((acc, k) => acc.flatMap(c => rowCandidates[k].map(x => ({ ...c, [k]: x }))), [{}]);
let e3Joint = 0, e3JointCombo = null;
for (const c of combos) { const v = e3ForRatios(c); if (Math.abs(v) > Math.abs(e3Joint)) { e3Joint = v; e3JointCombo = c; } }
const perAnchorE3 = {};
for (const id of G1_ORDER) {
  const r = rows[id];
  perAnchorE3[id] = r.infeasible ? 0 : e3ForRatios({ [r.hw]: r.pred / r.obs });
}

/* ---- §7.3 frozen attribution splits for the two Trn2 rows (report-only, §12) ---- */
function attribution(id, boundaryPct) {
  const r = rows[id];
  if (r.infeasible) return { id, E: Infinity, note: "infeasible" };
  const E = relError(r.pred, r.obs);                 // signed error
  const boundary = boundaryPct / 100;
  const wallclock = Math.min(E, boundary);           // "component of E up to the frozen boundary"
  const decode = E - wallclock;                      // residual beyond boundary
  const negAmbiguity = E < 0;                        // §7.3 example only covers E>0
  return { id, E, boundaryPct, wallclockPct: wallclock * 100, decodePct: decode * 100, negAmbiguity,
    altReadingIfNeg: negAmbiguity ? { wallclockPct: 0, decodePct: E * 100 } : null };
}
const attr70 = attribution("trn2-70b", 40.0);
const attr405 = attribution("trn2-405b", 8.0);

/* ============================================================================
   9. GATE VERDICTS (protocol §5, three-state)
   ============================================================================ */
const G1 = { median: d2.median, worst: d2.worst, medianOk: d2.median <= 0.25, worstOk: d2.worst <= 0.40,
  cntLe25: d2.cntLe25, cntLe40: d2.cntLe40 };
G1.verdict = (G1.medianOk && G1.worstOk) ? "PASS" : "FAIL";
const G2 = annex.unscoreable ? { verdict: "UNSCOREABLE", reason: annex.reason }
  : { verdict: annex.verdict.startsWith("PASS") ? "PASS" : "FAIL", oneSided: true, Cpre: annex.Cpre, offered: annex.offered, adverse: annex.adverse };
const G3 = { e3Joint, combo: e3JointCombo, ok: Math.abs(e3Joint) <= 5,
  verdict: Math.abs(e3Joint) <= 5 ? "PASS" : "FAIL", scope: G1.verdict === "PASS" ? "decode-only; carries no weight beyond G1" : "decode-only; does not rescue a G1 FAIL (§5(4))" };
const G4 = { d2Median: d2.median, d2Worst: d2.worst, baseMedian, baseWorst,
  medianBetter: d2.median < baseMedian, worstBetter: d2.worst < baseWorst };
G4.verdict = (G4.medianBetter && G4.worstBetter) ? "PASS" : "FAIL";
const G5 = { gatingRatio: 6 / 3, fullerRatio: 8 / 3, verdict: "PASS" };  // §3.4
const scoreableFail = G1.verdict === "FAIL" || G3.verdict === "FAIL" || G4.verdict === "FAIL" || G2.verdict === "FAIL" || G5.verdict === "FAIL";
const VERDICT = scoreableFail ? "FAIL → KILL/redesign" : "PASS";

/* ============================================================================
   10. OUTPUT — human table + JSON
   ============================================================================ */
const pct = x => (x === Infinity ? "+∞" : (x * 100).toFixed(1) + "%");
console.log("## D2 CANDIDATE — cycle-2 zero-tuning score rows (frozen §5 recipes)\n");
const CLOSURE_LABEL = {
  "gb300-offline": "cap-equality pin", "cm384-6p2d": "ceiling-equality invert",
  "cm384-coloc": "ceiling-equality invert", "tpu7": "stated conc, no SLO",
  "trn2-70b": "b=1 TP16 + wall-clock §7", "trn2-405b": "b=1 TP16 + wall-clock §7",
};
console.log("| # | observation | class | closure | batch | pred | target | rel err | binding |");
console.log("|---|---|---|---|---|---|---|---|---|");
for (const id of G1_ORDER) {
  const r = rows[id];
  const rel = r.infeasible ? "INFEASIBLE ⇒ +∞" : pct(relError(r.pred, r.obs));
  const predStr = r.infeasible ? "—" : Math.round(r.pred).toLocaleString();
  const batch = r.b ?? (r.hw === "trn2" ? "1" : "—");
  const binding = r.work?.roof ?? r.decWork?.roof ?? "—";
  console.log(`| ${id} | ${r.obs.toLocaleString()} ${r.unit} | ${r.closureClass} | ${CLOSURE_LABEL[id]} | ${batch} | ${predStr} | ${r.obs.toLocaleString()} | ${rel} | ${binding} |`);
}
console.log(`\nG1 gating population (n=${d2.n}, the 6 two-sided decode rows):`);
console.log(`  ordered |rel|: ${d2.per.map(p => p.abs).sort((a,b)=>a-b).map(x=>pct(x)).join(", ")}`);
console.log(`  MEDIAN (mean of 3rd&4th ordered) = ${pct(d2.median)}  | WORST = ${pct(d2.worst)}`);
console.log(`  count ≤25% = ${d2.cntLe25}/6 | count ≤40% = ${d2.cntLe40}/6\n`);

console.log("### Per-row workings (t_C / t_H / t_N ms, binding term, TPOT, mapping)\n");
for (const id of ["gb300-offline", "cm384-6p2d", "cm384-coloc", "tpu7"]) {
  const r = rows[id], w = r.work;
  if (!w) continue;
  console.log(`  ${id}: b=${r.b} (feas ${r.feas}) | t_C=${(w.tC*1e3).toFixed(3)} t_H=${(w.tH*1e3).toFixed(3)} t_N=${(w.tN*1e3).toFixed(3)}ms | bind ${w.roof} | t_roof=${(w.tRoof*1e3).toFixed(3)}ms | TPOT=${(w.tpot*1e3).toFixed(3)}ms | perDev ${r.perDev.toFixed(1)} ×${(r.pred/r.perDev).toFixed(0)} = ${r.pred.toFixed(0)} vs ${r.obs}`);
}
for (const id of ["trn2-70b", "trn2-405b"]) {
  const r = rows[id], w = r.decWork;
  console.log(`  ${id}: b=1 | t_H=${(w.tH*1e3).toFixed(3)}ms bind ${w.roof} | t_roof=${(w.tRoof*1e3).toFixed(3)}ms + t_cc=${(w.tCC*1e3).toFixed(3)}ms ⇒ TPOT=${(r.tpotPred*1e3).toFixed(3)}ms | TTFT_pred=${r.ttftPred.toFixed(3)}s (=ISL/T̂_pre, T̂_pre=${r.tPre.toFixed(1)}) | Overall_pred=OSL/(TTFT+OSL·TPOT)=${r.pred.toFixed(2)} vs ${r.obs.toFixed(3)} (1/TPOT diag ${r.invTPOT.toFixed(1)})`);
}

console.log("\n### §7.3 frozen Trn2 attribution splits (report-only, §12)\n");
for (const a of [attr70, attr405]) {
  if (a.negAmbiguity) {
    console.log(`  ${a.id}: E=${a.E>=0?"+":""}${(a.E*100).toFixed(1)}% | boundary +${a.boundaryPct}% | ⚠ AMBIGUOUS (E<0; §7.3 examples only cover E>0):`);
    console.log(`     reading A [wallclock=min(E,boundary)]: wall-clock ${a.wallclockPct.toFixed(1)}%, decode ${a.decodePct.toFixed(1)}%`);
    console.log(`     reading B [wallclock=clamp(E,0..boundary)]: wall-clock ${a.altReadingIfNeg.wallclockPct.toFixed(1)}%, decode ${a.altReadingIfNeg.decodePct.toFixed(1)}%`);
  } else {
    console.log(`  ${a.id}: E=${a.E>=0?"+":""}${(a.E*100).toFixed(1)}% | boundary +${a.boundaryPct}% ⇒ wall-clock ${a.wallclockPct.toFixed(1)}%, decode/​t_cc ${a.decodePct.toFixed(1)}%`);
  }
}

console.log("\n### One-sided class-3 rows (NOT in G1)\n");
if (server.unscoreable) console.log(`  gb300-server: UNSCOREABLE (${server.reason})`);
else console.log(`  gb300-server (CL-1): Ĉ_model=${Math.round(server.Chat).toLocaleString()} (b*=${server.bStar}) vs offered ${server.offered.toLocaleString()} ⇒ Ŷ=min=${Math.round(server.Yhat).toLocaleString()} | ${server.adverse?"ADVERSE ⇒ FAIL":"non-adverse ⇒ "+server.verdict} | (obs 400,437 = ${(server.obsFracOfOffered*100).toFixed(1)}% of offered)`);
if (annex.unscoreable) console.log(`  gb300-interactive prefill annex: UNSCOREABLE (${annex.reason})`);
else console.log(`  gb300-interactive prefill annex (§10): Ĉ_pre(800)=${Math.round(annex.Cpre).toLocaleString()} tok/s/prefill-GPU vs offered ${annex.offered.toLocaleString()} ⇒ ${annex.adverse?"ADVERSE ⇒ G2 FAIL":"non-adverse ⇒ "+annex.verdict}`);

console.log("\n## G4 BASELINE (single-scalar 6.91% H800 fit) on the SAME 6 rows\n");
console.log(`  baseline |rel|: ${baseErrs.map(e=>`${e.id} ${pct(e.abs)}`).join(" | ")}`);
console.log(`  baseline MEDIAN=${pct(baseMedian)} WORST=${pct(baseWorst)} (repro of §5.1 414.55%/13,941.9%: ${baseReproOk?"OK":"MISMATCH"})`);

console.log("\n## Per-anchor E3 (reporting) + joint G3\n");
for (const id of G1_ORDER) console.log(`  ${id}: ${perAnchorE3[id].toFixed(3)} pp`);
console.log(`  E3_joint (exhaustive over ${combos.length} combos; ascend=0-weight, server/annex non-adverse) = ${e3Joint.toFixed(3)} pp  (combo ${JSON.stringify(Object.fromEntries(Object.entries(e3JointCombo).map(([k,v])=>[k,+v.toFixed(3)])))})`);

console.log("\n## GATE VERDICTS (protocol §5, three-state)\n");
console.log(`- G1 decode: median ${pct(G1.median)} (≤25 ${G1.medianOk?"OK":"MISS"}), worst ${pct(G1.worst)} (≤40 ${G1.worstOk?"OK":"MISS"}); counts ≤25%=${G1.cntLe25}/6, ≤40%=${G1.cntLe40}/6 → **${G1.verdict}**`);
console.log(`- G2 prefill (one-sided annex): ${G2.verdict === "PASS" ? `Ĉ_pre ${Math.round(G2.Cpre).toLocaleString()} ≥ offered ${G2.offered.toLocaleString()} (non-adverse)` : G2.reason || "adverse"} → **${G2.verdict}${G2.oneSided?" (one-sided, feasibility-only)":""}**`);
console.log(`- G3 joint: |${e3Joint.toFixed(2)}| pp (≤5) → **${G3.verdict}** (${G3.scope})`);
console.log(`- G4 baseline beat: median ${pct(d2.median)} vs ${pct(baseMedian)} ${G4.medianBetter?"OK":"MISS"}; worst ${pct(d2.worst)} vs ${pct(baseWorst)} ${G4.worstBetter?"OK":"MISS"} → **${G4.verdict}**`);
console.log(`- G5 obs/param ratio: 6/3 = 2.0 (headline gating set) ≥ 1.0; fuller 8/3 = 2.67 → **${G5.verdict}**`);
console.log(`\n**VERDICT (§5 decision rule): ${VERDICT}** — scope: decode-scope; G2 one-sided feasibility-only (no prefill/blended-margin claim).`);

/* ---- JSON artifact ---- */
const out = {
  meta: { harness: "tests/d2-spike-harness-v2.mjs", cycle: 2, generated: new Date().toISOString(),
    hashCheck: hashResults, committed: false },
  eta: { etaDec, etaPre, etaDecPublished: ETA_DEC_PUB, etaPrePublished: ETA_PRE_PUB, etaDecMatch: etaDecOk, etaPreMatch: etaPreOk,
    tauCC: TAU_CC, tauCC_us: TAU_CC * 1e6, N_ring_steps: N_RING_STEPS, tau_hop_ns: TAU_HOP * 1e9,
    fitResiduals: fitResid },
  constants: { tcc_70b_ms: 2 * MODELS.l70.layers * TAU_CC * 1e3, tcc_405b_ms: 2 * MODELS.l405.layers * TAU_CC * 1e3 },
  rows: Object.fromEntries(Object.entries(rows).map(([id, r]) => [id, {
    obs: r.obs, unit: r.unit, hw: r.hw, closureClass: r.closureClass, closure: r.closure, twoSided: r.twoSided,
    infeasible: !!r.infeasible, feas: r.feas, b: r.b ?? (r.hw === "trn2" ? 1 : undefined),
    pred: r.infeasible ? null : r.pred, relError: r.infeasible ? "+Infinity" : relError(r.pred, r.obs),
    absRel: r.infeasible ? "+Infinity" : Math.abs(relError(r.pred, r.obs)),
    binding: r.work?.roof ?? r.decWork?.roof,
    workings: r.work ? { tC_ms: r.work.tC*1e3, tH_ms: r.work.tH*1e3, tN_ms: r.work.tN*1e3, tRoof_ms: r.work.tRoof*1e3, tCC_ms: r.work.tCC*1e3, tpot_ms: r.work.tpot*1e3, perDev: r.perDev }
      : (r.decWork ? { tH_ms: r.decWork.tH*1e3, tRoof_ms: r.decWork.tRoof*1e3, tCC_ms: r.decWork.tCC*1e3, tpotPred_ms: r.tpotPred*1e3, ttftPred_s: r.ttftPred, tPre: r.tPre, invTPOT: r.invTPOT, ISL: TRN2.ISL, OSL: TRN2.OSL } : null),
  }])),
  oneSided: { server, annex },
  attribution: { "trn2-70b": attr70, "trn2-405b": attr405 },
  g1: { order: G1_ORDER, perRow: d2.per.map(p => ({ id: p.id, rel: p.rel === Infinity ? "+Infinity" : p.rel, abs: p.abs === Infinity ? "+Infinity" : p.abs, infeasible: p.infeasible })),
    median: G1.median, worst: G1.worst, cntLe25: G1.cntLe25, cntLe40: G1.cntLe40, verdict: G1.verdict },
  baseline: { perRow: baseErrs.map(e => ({ id: e.id, pred: e.pred, absRel: e.abs })), median: baseMedian, worst: baseWorst, reproOk: baseReproOk },
  g2: G2, g3: { perAnchorE3, e3Joint, combo: e3JointCombo, verdict: G3.verdict, scope: G3.scope },
  g4: G4, g5: G5,
  gates: { G1: G1.verdict, G2: G2.verdict, G3: G3.verdict, G4: G4.verdict, G5: G5.verdict },
  verdict: VERDICT,
};
writeFileSync(join(ROOT, "research/cycle2-scores.json"), JSON.stringify(out, null, 2));
console.log(`\nJSON written: research/cycle2-scores.json (nothing committed).`);
