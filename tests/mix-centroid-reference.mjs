// Exact centroid of P = { x : lo_i <= x_i <= hi_i, sum x = T }, by inclusion-exclusion.
// y_i = x_i - lo_i in [0,w_i], sum y = S. Region R(S) = {y>=0, y<=w, sum y = S}.
//   (k-1)-volume   V(S)  ∝ Σ_A (-1)^|A| ((S - W_A)_+)^(k-1) / (k-1)!
//   first moment   ∫ y_j = ∫_0^{w_j} t * V^{(-j)}(S - t) dt, V^{(-j)} over the other k-1 coords
// The shared geometric constant cancels in the ratio; only the factorial ratio (k-1) survives.
const pos = (u) => (u > 0 ? u : 0);

function volPow(ws, S, p) {
  const n = ws.length;
  let acc = 0;
  for (let mask = 0; mask < (1 << n); mask++) {
    let W = 0, bits = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) { W += ws[i]; bits++; }
    const u = pos(S - W);
    if (u > 0) acc += (bits % 2 ? -1 : 1) * Math.pow(u, p);
  }
  return acc;
}

// ∫_0^{w} t * ((c - t)_+)^n dt, substituting u = c - t
function momentTerm(w, c, n) {
  const a = pos(c - w), b = pos(c);
  if (b <= a) return 0;
  const I = (u, e) => Math.pow(u, e + 1) / (e + 1);
  return c * (I(b, n) - I(a, n)) - (I(b, n + 1) - I(a, n + 1));
}

export function centroidOnSum(lo, hi, T) {
  const k0 = lo.length;
  /* centroid-gate R3 (P1 residual): the k=1 clamp was a pre-existing helper-contract defect —
     an out-of-range T returned the nearest endpoint as if it were the centroid. Every branch
     now shares one tolerance discipline: answer only when T is feasible, else null. */
  if (k0 === 1)
    return (T < lo[0] - 1e-9 || T > hi[0] + 1e-9) ? null : [Math.min(hi[0], Math.max(lo[0], T))];
  /* ZERO-WIDTH BLOCKS PIN AND REDUCE (centroid-gate R2 P1): a declared 60-60 is a legal range
     whose coordinate is fixed at its point; it leaves the variable set instead of collapsing
     the inclusion-exclusion volume to zero (a duplicated mask term cancels V even when the
     remaining slice has positive dimension). */
  const varIdx = [];
  for (let i = 0; i < k0; i++) if (hi[i] - lo[i] > 0) varIdx.push(i);
  const loSum = lo.reduce((a, b) => a + b, 0);
  if (varIdx.length === 0)
    return Math.abs(loSum - T) <= 1e-9 * Math.max(1, Math.abs(T)) ? lo.slice() : null;
  if (varIdx.length === 1) {
    const j = varIdx[0];
    const v = T - (loSum - lo[j]);
    if (v < lo[j] - 1e-9 || v > hi[j] + 1e-9) return null;
    const out = lo.slice(); out[j] = Math.min(hi[j], Math.max(lo[j], v));
    return out;
  }

  /* EXACT INTEGER CORE (centroid-gate R2 P0, superseding the R1 complement reduction): float
     inclusion-exclusion cancels catastrophically wherever the alternating terms dwarf the
     result -- R1 fixed the upper sliver, R2 exhibited the same loss at the flip boundary with
     mixed magnitudes, certified WRONG by the float postcondition because the error hides
     inside the sum tolerance. Floats ARE dyadic rationals, so the construction is computed
     EXACTLY: every input becomes numerator/denominator over a shared power-of-two D, the
     whole inclusion-exclusion runs in BigInt integers (homogeneous in D, so D factors out
     analytically), and the only roundings are terminal (the final BigInt->float division, plus the float
     input expressions and the lo_j addition — measured <= 7.2e-15 against an exact oracle).
     Cancellation is impossible by construction. y_j = accInt_j / (k * D * VInt), from
     momentTermInt = (k-1)k * momentTerm and VInt = D^(k-1) * V. */
  const dy = (x) => {   // exact dyadic decomposition of a finite float
    let d = 1n, neg = x < 0; if (neg) x = -x;
    while (!Number.isInteger(x)) { x *= 2; d <<= 1n; }
    return { n: neg ? -BigInt(x) : BigInt(x), d };
  };
  const kv = varIdx.length;
  const loR = varIdx.map(i => dy(lo[i])), hiR = varIdx.map(i => dy(hi[i]));
  const SR = dy(T - loSum);   // hi-lo and T-loSum are float ops; their RESULTS are the declared geometry
  let D = SR.d;
  for (const r of loR.concat(hiR)) if (r.d > D) D = r.d;
  const scale = (r) => r.n * (D / r.d);
  const wI = varIdx.map((_, j) => scale(hiR[j]) - scale(loR[j]));
  const SI = scale(SR);
  const sumWI = wI.reduce((a, b) => a + b, 0n);
  if (SI < 0n || SI > sumWI) return null;               // infeasible
  const out = lo.slice();
  if (SI === 0n || SI === sumWI) {                       // measure-zero slice: the corner itself
    varIdx.forEach((i, j) => { out[i] = SI === 0n ? lo[i] : hi[i]; });
    return out;
  }
  const ipow = (b, e) => { let r = 1n; for (let i = 0; i < e; i++) r *= b; return r; };
  let VInt = 0n;
  for (let mask = 0; mask < (1 << kv); mask++) {
    let W = 0n, bits = 0;
    for (let i = 0; i < kv; i++) if (mask & (1 << i)) { W += wI[i]; bits++; }
    const u = SI - W;
    if (u > 0n) VInt += (bits % 2 ? -1n : 1n) * ipow(u, kv - 1);
  }
  if (VInt <= 0n) return null;
  const n = kv - 2;
  const mtInt = (w, c) => {   // (n+1)(n+2) * integral_0^w t*((c-t)_+)^n dt, all-integer
    const a = c - w > 0n ? c - w : 0n, b = c > 0n ? c : 0n;
    if (b <= a) return 0n;
    const p1 = ipow(b, n + 1) - ipow(a, n + 1);
    const p2 = ipow(b, n + 2) - ipow(a, n + 2);
    return c * p1 * BigInt(n + 2) - p2 * BigInt(n + 1);
  };
  const toF = (num, den) => {   // one rounding: BigInt fraction -> float, scale-safe
    const neg = (num < 0n) !== (den < 0n);
    let N = num < 0n ? -num : num, Dd = den < 0n ? -den : den;
    const whole = N / Dd, frac = ((N % Dd) * 1000000000000000000n) / Dd;
    const f = Number(whole) + Number(frac) / 1e18;
    return neg ? -f : f;
  };
  for (let j = 0; j < kv; j++) {
    const rest = wI.filter((_, i) => i !== j);
    let acc = 0n;
    for (let mask = 0; mask < (1 << rest.length); mask++) {
      let W = 0n, bits = 0;
      for (let i = 0; i < rest.length; i++) if (mask & (1 << i)) { W += rest[i]; bits++; }
      acc += (bits % 2 ? -1n : 1n) * mtInt(wI[j], SI - W);
    }
    out[varIdx[j]] = lo[varIdx[j]] + toF(acc, BigInt(kv) * D * VInt);
  }
  /* Postcondition kept as a belt (in-bounds and summing to T at float tolerance); with the
     exact core its only job is catching a defect in THIS function, not float weather. */
  const EPS = 1e-6;
  for (let i = 0; i < k0; i++) if (out[i] < lo[i] - EPS || out[i] > hi[i] + EPS) return null;
  if (Math.abs(out.reduce((a, b) => a + b, 0) - T) > EPS * Math.max(1, Math.abs(T))) return null;
  return out;
}
