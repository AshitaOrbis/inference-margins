/* Re-mint the v2.2 traffic-contract baseline for the 2026-09-19 tariff correction, IN PLACE and
   KEY-FOR-KEY.
   Run from the repository root: node tests/remint-baseline-tariff-2026-09-19.mjs

   Why not tests/generate-baseline-v22.mjs: that script asserts exactly 180 provider/perspective
   pairs and the engine now carries 270 (15 provider rows x 18 live perspectives). Minting from it
   today would silently WIDEN the fixture's scope from 180 pairs to 270 in the same commit as a
   price change, and a widened fixture is not a re-mint — it is a different contract. This script
   recomputes only the keys the fixture already holds, so the scope is byte-identical and the only
   thing that can differ is a value the engine now returns differently. The 180-vs-270 gap is a
   real, separate defect in generate-baseline-v22.mjs and it is reported, not fixed here. */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const fixture = require("./fixtures-baseline-v22.json");
const round = (v, digits) => Number.isFinite(v) ? Number(v.toFixed(digits)) : null;

let moved = 0;
for (const key of Object.keys(fixture.pairs)) {
  const [mid, pid] = key.split("|");
  const m = E.MODELS.find(x => x.id === mid), p = E.PERSPECTIVES.find(x => x.id === pid);
  if (!m || !p) throw new Error(`fixture key ${key} has no live model/perspective`);
  const s = E.applyPresetSettings(m, p, { mode: "native" });
  const w = E.workload(s);
  const next = {
    ioRatio: s.ioRatio, cacheHit: s.cacheHit, util: s.util, precision: s.precision,
    priceIn: s.priceIn, priceOut: s.priceOut, cacheReadMult: s.cacheReadMult,
    blend: s.blend, interact: s.interact, rentMult: s.rentMult,
    margin: round(w.margin * 100, 4), cOut: round(w.cOut, 5),
    /* The frozen projection, exactly as the parity test reads it: `sections` is the im-arc T2
       ADDITIVE receipt and the test strips it from the live value before comparing
       (`const legacyFleet = { ...w.fleetRenderable }; delete legacyFleet.sections;`). Recording it
       here would change the fixture's SHAPE for all 180 pairs and break that comparison on every
       row, including the 120 this correction must leave byte-identical. */
    fleetRenderable: (() => { const f = { ...w.fleetRenderable }; delete f.sections; return f; })(),
  };
  if (JSON.stringify(next) !== JSON.stringify(fixture.pairs[key])) moved += 1;
  fixture.pairs[key] = next;
}
fixture.engine = E.ENGINE_REVISION;
fixture.note = fixture.note.replace(/ RE-MINTED 2026-09-19[\s\S]*$/, "")
  + " RE-MINTED 2026-09-19 by leg im-vet-model-estimates (owner note note-20260919T142116Z-6b5c83,"
  + " 'sanity check those numbers'): five presets carried a price their vendor no longer charges"
  + " (gpt $5/$30 -> $4/$20, terra $2.50/$15 -> $2/$12, luna $1/$6 -> $0.20/$1.20,"
  + " dsv4 $0.435/$0.87 -> $0.66/$1.98 off-peak, dsv4f $0.14/$0.28 -> $0.15/$0.60 off-peak), each"
  + " verified on the vendor's own page that day. Key-for-key re-mint against"
  + " tests/fixtures-baseline-v22-pre-tariff-correction.json; the SHAPE of the move is asserted in"
  + " tests/traffic-contract.test.mjs — a pair may differ ONLY if its model is one of those five.";
const body = JSON.stringify(fixture, null, 1) + "\n";
for (const rel of ["fixtures-baseline-v22.json", "../site/tests/fixtures-baseline-v22.json"])
  writeFileSync(fileURLToPath(new URL(rel, import.meta.url)), body);
console.log(`re-minted ${Object.keys(fixture.pairs).length} pairs in place; ${moved} moved`);
