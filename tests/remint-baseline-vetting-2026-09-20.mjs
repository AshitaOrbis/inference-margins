/* Re-mint the v2.2 traffic-contract baseline for the 2026-09-20 vetting repairs, IN PLACE and
   KEY-FOR-KEY.
   Run from the repository root: node tests/remint-baseline-vetting-2026-09-20.mjs

   THE EVENT (program bq-2835, leg im-vet-six-repairs; vetting report
   orchestration/backlog-recovery/day-2026-07-28/reports/inference-margins-vetting-2026-09-19.md,
   expert findings E1 and E2):
     (1) the two Trainium legs are WITHDRAWN from the default fleet's membership on evidence
         grounds — the operating-point registry declares batch replica-global while this engine
         consumes it per chip, an open unit question worth about 15.2x, and the project's own
         hardware ledger already said the coefficient cannot support a central Trainium margin;
     (2) the TPU v7 decode coefficient moves 0.55 -> 0.519, because one of its two same-platform
         endpoints was computed on Google's COMBINED input-plus-output rate (677 t/s/chip) as if it
         were an output rate. It passed through 0.521 for part of 2026-09-20, pairing 518.86 with
         the DECODE-STAGE 606; the completion gate refused that as a disclosed inconsistency
         rather than a repair, because the two figures are on different clocks. Both endpoints now
         sit on ONE convention, output tokens per second per chip over total serving wall time at
         1K-in/8K-out: 518.86 and 677 x 8/9 = 601.8.

   Same scope discipline as tests/remint-baseline-tariff-2026-09-19.mjs: only the keys the fixture
   already holds are recomputed, so the fixture's scope is byte-identical and the only thing that
   can differ is a value the engine now returns differently. The SHAPE of the move is asserted in
   tests/traffic-contract.test.mjs against tests/fixtures-baseline-v22-pre-vetting-repairs.json —
   a pair may differ ONLY if its PRE-repair blend carried tpu7, trn2 or trn3. */
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
    fleetRenderable: (() => { const f = { ...w.fleetRenderable }; delete f.sections; return f; })(),
  };
  if (JSON.stringify(next) !== JSON.stringify(fixture.pairs[key])) moved += 1;
  fixture.pairs[key] = next;
}
fixture.engine = E.ENGINE_REVISION;
fixture.note = fixture.note.replace(/ RE-MINTED 2026-09-20[\s\S]*$/, "")
  + " RE-MINTED 2026-09-20 by leg im-vet-six-repairs (program bq-2835, vetting findings E1 + E2):"
  + " the two Trainium legs are withdrawn from the default fleet's membership on evidence grounds,"
  + " and the TPU v7 decode coefficient moves 0.55 -> 0.519 onto ONE stated timing convention."
  + " Key-for-key re-mint against tests/fixtures-baseline-v22-pre-vetting-repairs.json; the SHAPE"
  + " of the move is asserted in tests/traffic-contract.test.mjs — a pair may differ ONLY if its"
  + " pre-repair blend carried tpu7, trn2 or trn3.";
const body = JSON.stringify(fixture, null, 1) + "\n";
for (const rel of ["fixtures-baseline-v22.json", "../site/tests/fixtures-baseline-v22.json"])
  writeFileSync(fileURLToPath(new URL(rel, import.meta.url)), body);
console.log(`re-minted ${Object.keys(fixture.pairs).length} pairs in place; ${moved} moved`);
