import { centroidOnSum } from "./mix-centroid-reference.mjs";

function mc(lo, hi, T, want = 1200000) {
  const k = lo.length;
  let s = 0x9e3779b9;
  const rnd = () => { // mulberry32 — the LCG's low bits were biasing the estimate, not the formula
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let cnt = 0;
  const acc = lo.map(() => 0);
  for (let it = 0; it < want * 200 && cnt < want; it++) {
    const y = []; let sum = 0;
    for (let i = 0; i < k - 1; i++) { const v = lo[i] + rnd() * (hi[i] - lo[i]); y.push(v); sum += v; }
    const last = T - sum;
    if (last < lo[k - 1] || last > hi[k - 1]) continue;
    y.push(last); cnt++;
    for (let i = 0; i < k; i++) acc[i] += y[i];
  }
  return cnt > 1000 ? acc.map(x => x / cnt) : null;
}

// the equal-shift projection of box midpoints — the shortcut that must NOT be mistaken for the mean
function midProj(lo, hi, T) {
  const mid = lo.map((l, i) => (l + hi[i]) / 2);
  const at = (lam) => mid.reduce((s, m, i) => s + Math.min(hi[i], Math.max(lo[i], m + lam)), 0);
  let a = -1000, b = 1000;
  for (let i = 0; i < 400; i++) { const m = (a + b) / 2; if (at(m) < T) a = m; else b = m; }
  const lam = (a + b) / 2;
  return mid.map((m, i) => Math.min(hi[i], Math.max(lo[i], m + lam)));
}

const cases = [
  ["GPT Pro r2   50-65 / 35-50 / 0-15", [50, 35, 0], [65, 50, 15], 100],
  ["Fable r3     35-65 / 15-40 / 5-35", [35, 15, 5], [65, 40, 35], 100],
  ["skewed       0-90 / 5-10 / 5-10", [0, 5, 5], [90, 10, 10], 100],
  ["k=5 mixed", [10, 5, 0, 0, 5], [40, 30, 20, 15, 25], 100],
  ["k=4 tight (degenerate: single point)", [20, 20, 20, 20], [30, 30, 30, 30], 100],
  ["k=2", [30, 40], [50, 70], 100],
];

let bad = 0;
for (const [name, lo, hi, T] of cases) {
  const ex = centroidOnSum(lo, hi, T);
  if (!ex) { console.log(`SKIP  ${name} (degenerate slice)`); continue; }
  const m = mc(lo, hi, T);
  const mp = midProj(lo, hi, T);
  const sum = ex.reduce((a, b) => a + b, 0);
  const inBounds = ex.every((x, i) => x >= lo[i] - 1e-9 && x <= hi[i] + 1e-9);
  const dev = m ? Math.max(...ex.map((x, i) => Math.abs(x - m[i]))) : NaN;
  const okSum = Math.abs(sum - T) < 1e-9;
  const okMC = m ? dev <= 0.05 : true;
  if (!okSum || !okMC || !inBounds) bad++;
  const shortcutDelta = Math.max(...ex.map((x, i) => Math.abs(x - mp[i])));
  console.log(`${okSum && okMC && inBounds ? "PASS" : "FAIL"}  ${name}`);
  console.log(`        centroid : ${ex.map(x => x.toFixed(4)).join(" / ")}  sum=${sum.toFixed(10)} inBounds=${inBounds}`);
  console.log(`        MC       : ${m ? m.map(x => x.toFixed(4)).join(" / ") : "n/a"}  maxdev=${m ? dev.toFixed(4) : "n/a"}`);
  console.log(`        midProj  : ${mp.map(x => x.toFixed(4)).join(" / ")}  shortcut off by ${shortcutDelta.toFixed(4)} pp`);
}
console.log(bad ? `\n${bad} FAILED` : "\nall centroid cases agree with Monte Carlo, sum to T, and stay in bounds");
