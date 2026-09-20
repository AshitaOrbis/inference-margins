// EXPERIMENTAL DIAGNOSTIC — not wired into the engine (see research/consultation-2026-07-10-roofline.md).
// The commissioned decode roofline: compute/HBM/fabric terms, 1/batch weight amortization, MTP handling,
// ONE shared roof-utilization residual (η=0.30965, fit on the H800 production anchor alone).
// Verdict adopted: fails the whole-platform gate (Ascend@15ms −39.8%); preregistered test unrunnable
// on public data (p=1 vs n_train=1; no untouched platform). Anchor fits remain primary.
const ARCH = Object.freeze({ active: 37e9, layers: 61, heads: 128, qkDim: 192, vDim: 128, kvDim: 576, moeLayers: 58, topK: 8, hidden: 7168 });

function decodeRoof(hw, op, etaRoof, t0 = 0) {
  const attnFlops = 2 * ARCH.layers * ARCH.heads * (ARCH.qkDim + ARCH.vDim) * op.context;
  const flopsPerPos = 2 * ARCH.active + attnFlops;
  const kvPerScan = ARCH.layers * ARCH.kvDim * op.kvBytes * op.context;
  const fabricPerPos = 2 * ARCH.moeLayers * ARCH.topK * ARCH.hidden * op.activationBytes * (op.dispatchScale ?? 1);
  const tCompute = op.batch * op.targetPositions * (flopsPerPos / hw.flops);
  const tHbm = (op.weightBytesIter + op.batch * op.targetPositions * kvPerScan) / hw.hbmBps;
  const tFabric = op.batch * op.targetPositions * fabricPerPos / hw.fabricBps;
  const tRoof = Math.max(tCompute, tHbm, tFabric);
  const tIter = t0 + tRoof / etaRoof;
  return { tps: op.batch * op.acceptedTokens / tIter, roof: tRoof === tHbm ? "HBM" : tRoof === tCompute ? "compute" : "fabric" };
}

const ETA = 0.30965; // fit: H800 production (1,850 tok/s at b=96, L=4,989, FP8 KV)
const CASES = [
  { name: "H800 (calibration)", hw: { flops: 1.98e15, hbmBps: 3.35e12, fabricBps: 400e9 }, op: { batch: 96, context: 4989, targetPositions: 1, acceptedTokens: 1, weightBytesIter: 37e9, kvBytes: 1, activationBytes: 2 }, measured: 1850 },
  { name: "H20 Pro (<50ms)", hw: { flops: 0.296e15, hbmBps: 4.0e12, fabricBps: 900e9 }, op: { batch: 32, context: 4096, targetPositions: 3, acceptedTokens: 1.85, weightBytesIter: 37e9, kvBytes: 1, activationBytes: 2 }, measured: 675 },
  { name: "H20 Base (<70ms)", hw: { flops: 0.296e15, hbmBps: 4.0e12, fabricBps: 900e9 }, op: { batch: 48, context: 4096, targetPositions: 3, acceptedTokens: 1.85, weightBytesIter: 37e9, kvBytes: 1, activationBytes: 2 }, measured: 714 },
  { name: "GB200 (optimistic FP4 bound)", hw: { flops: 10e15, hbmBps: 8.0e12, fabricBps: 1.8e12 }, op: { batch: 128, context: 3000, targetPositions: 1, acceptedTokens: 1, weightBytesIter: 18.5e9, kvBytes: 1, activationBytes: 2, dispatchScale: 0.25 }, measured: 10108 },
  { name: "Ascend 910C @50ms", hw: { flops: 1.504e15, hbmBps: 3.2e12, fabricBps: 784e9 }, op: { batch: 96, context: 4096, targetPositions: 2, acceptedTokens: 1.7, weightBytesIter: 37e9, kvBytes: 2, activationBytes: 2 }, measured: 1943 },
  { name: "Ascend 910C @15ms (the failure)", hw: { flops: 1.504e15, hbmBps: 3.2e12, fabricBps: 784e9 }, op: { batch: 8, context: 4096, targetPositions: 2, acceptedTokens: 1.7, weightBytesIter: 37e9, kvBytes: 2, activationBytes: 2 }, measured: 538 },
];

console.log("Experimental roofline diagnostic (η = 30.97%, fit on H800 alone)\n");
console.log("Case                              | roof    | predicted | measured | error");
let worst = 0;
for (const c of CASES) {
  const r = decodeRoof(c.hw, c.op, ETA);
  const err = (r.tps / c.measured - 1) * 100;
  if (c.name !== "H800 (calibration)") worst = Math.max(worst, Math.abs(err));
  console.log(`${c.name.padEnd(33)} | ${r.roof.padEnd(7)} | ${r.tps.toFixed(0).padStart(9)} | ${String(c.measured).padStart(8)} | ${err.toFixed(1).padStart(6)}%`);
}
console.log(`\nWorst held-out error: ${worst.toFixed(1)}% — fails the ≤25% whole-platform gate. Anchor fits remain primary.`);
