// Mint the IM3 slice-3 traffic-contract baseline from the switched v2.2 engine.
// Run from the repository root: node tests/generate-baseline-v22.mjs
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const round = (v, digits) => Number.isFinite(v) ? Number(v.toFixed(digits)) : null;
const pairs = {};

// Preserve the archived fixture's provider-row scope: Custom is a user scratch row, not a
// provider baseline. All 15 provider rows × all 12 live perspectives = 180 pairs.
for (const m of E.MODELS.filter(x => x.id !== "custom")) {
  for (const p of E.PERSPECTIVES) {
    const s = E.applyPresetSettings(m, p, { mode: "native" });
    const w = E.workload(s);
    pairs[`${m.id}|${p.id}`] = {
      ioRatio: s.ioRatio, cacheHit: s.cacheHit, util: s.util, precision: s.precision,
      priceIn: s.priceIn, priceOut: s.priceOut, cacheReadMult: s.cacheReadMult,
      blend: s.blend, interact: s.interact, rentMult: s.rentMult,
      margin: round(w.margin * 100, 4), cOut: round(w.cOut, 5),
      fleetRenderable: w.fleetRenderable,
    };
  }
}

if (Object.keys(pairs).length !== 180) throw new Error(`expected 180 provider/perspective pairs, got ${Object.keys(pairs).length}`);
const fixture = {
  frozenAt: "2026-07-27",
  engine: E.ENGINE_REVISION,
  note: "Fresh IM3 slice-3 baseline minted from the activated v2.2 roofline display path. Finite/capped legs render; mixed blends renormalize over renderable legs with fleetRenderable disclosure; zero-renderable blends store null numeric fields.",
  pairs,
};
const body = JSON.stringify(fixture, null, 1) + "\n";
for (const rel of ["fixtures-baseline-v22.json", "../site/tests/fixtures-baseline-v22.json"])
  writeFileSync(fileURLToPath(new URL(rel, import.meta.url)), body);
console.log(`wrote 180 pairs to both v2.2 baseline copies (${body.length} bytes each)`);
