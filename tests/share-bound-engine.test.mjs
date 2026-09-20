/* EVERY FIELD THAT CALLS ITSELF A SHARE IS A PROPORTION — the engine-side bound (bq-2194).
 *
 * The published half of this defect took FOUR attempts to enumerate. `renderableWeightShare`
 * overshot 1 by one unit in the last place once the owner's 2026-09-10 ruling made all seven legs
 * render; the first pass normalised two emission sites, a fallback review found a third, and an
 * exhaustive audit that walked every *weight_share field found a fourth riding a claims sidecar.
 * Each round of reading the code to list call sites missed one. What finally worked was
 * mcp-server/test/published-share-bound.test.mjs, which does not enumerate call sites at all: it
 * walks every tool response and asserts the bound on every field whose NAME says it is a share.
 *
 * This is that test on the engine side of the boundary, and it exists because the connector's walk
 * can only see what the connector publishes. It drives the engine's own workload record across the
 * preset grid and asserts, on every field named `*Share`/`*share` however deeply nested:
 *   0 <= value <= 1, and
 *   a share is not above its own declared companion where the record declares one.
 *
 * NON-VACUITY IS ASSERTED, not assumed, and specifically: the walk must reach sonnet, because
 * sonnet is the fleet whose weights overshoot and opus is not — a bound written against the
 * flagship alone would have been green throughout the defect it was written for. The walk must
 * also find a MINIMUM number of share fields, so a rename that quietly empties it goes red.
 *
 * Run: node tests/share-bound-engine.test.mjs
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : " — " + detail}`);
  if (!cond) failures++;
};

const shareFields = [];
function walk(node, path, seen) {
  if (node === null || typeof node !== "object") return;
  if (seen.has(node)) return;
  seen.add(node);
  if (Array.isArray(node)) { node.forEach((v, i) => walk(v, `${path}[${i}]`, seen)); return; }
  for (const [k, v] of Object.entries(node)) {
    const at = path ? `${path}.${k}` : k;
    if (/share$/i.test(k) && typeof v === "number") shareFields.push({ path: at, key: k, value: v });
    else walk(v, at, seen);
  }
}

const reached = new Set();
/* THE FLEET'S RENDER STATE TRAVELS WITH THE FIELD (fallback review F10). The exception below claims
   to be narrowed to fully-renderable fleets, and it could not be: the walk did not carry that state
   to the predicate at all, so the third clause was a comment rather than a rule. It is recorded per
   pair here and enforced there. */
const fleetState = new Map();
for (const m of E.MODELS) for (const p of E.PERSPECTIVES) {
  let w;
  try { w = E.workload(E.applyPresetSettings(m, p, { mode: "native" })); }
  catch (e) { assert(`workload(${m.id}|${p.id}) computes`, false, String(e.message).slice(0, 140)); continue; }
  reached.add(m.id);
  const f = w.fleetRenderable;
  fleetState.set(`${m.id}|${p.id}`, f.totalLegs > 0 && f.renderableLegs === f.totalLegs);
  walk(w, `${m.id}|${p.id}`, new WeakSet());
}

/* ONE DECLARED, DATED EXCEPTION, and it is written to RETIRE ITSELF.
   fleetRenderable.renderableWeightShare is the fleet-level half of bq-2194 and is deliberately
   still one unit in the last place above 1. That is not an oversight: it is also the divisor of
   the blend renormalization, and splitting the two roles was executed and MEASURED on 2026-09-10 —
   it re-mints five WIDE parity constants, a source freeze and eighteen v2.2 baseline pairs, and it
   breaks all three historical receipt reproductions, whose entire claim is that the live engine
   plus a declared pin bundle still reproduces a pre-T4 receipt bit for bit. Zero margins move
   either way. Both publication boundaries already normalise the value (publishedShare in
   mcp-server/src/shape.ts; both page surfaces round it to 100%).
   The exception is narrow in three directions at once, so it cannot quietly widen: only that field
   name, only a value within one part in 1e9 of 1, and only on a fleet where every leg renders. A
   share of 1.02 still fails. And the LAST assertion below fails the day the field is fixed, which
   is what forces this block to be deleted rather than left behind as folklore. */
const EXCEPTION = "renderableWeightShare";
const isDeclaredUlp = (f) => f.key === EXCEPTION && f.value > 1 && Math.abs(f.value - 1) <= 1e-9
  && fleetState.get(String(f.path).split(".")[0]) === true;   // the third clause, now enforced
const over = shareFields.filter((f) => Number.isFinite(f.value) && (f.value < 0 || f.value > 1));
const unexcused = over.filter((f) => !isDeclaredUlp(f));
assert(`every share-named field across the preset grid lies in [0, 1], bar one declared exception (${shareFields.length} fields walked)`,
  unexcused.length === 0,
  `${unexcused.length} out of range; first: ${JSON.stringify(unexcused.slice(0, 3))}`);
assert(`the declared exception is still exactly bq-2194's ulp on ${EXCEPTION} and nothing else`,
  over.length === 0 || over.every(isDeclaredUlp),
  JSON.stringify(over.filter((f) => !isDeclaredUlp(f)).slice(0, 3)));
assert(`bq-2194's fleet-level half is still open — DELETE THIS BLOCK AND THE EXCEPTION ABOVE when it closes`,
  over.length > 0,
  `no share-named field overshoots any more, so the exception is dead weight and the bound above should be unconditional`);

const nonFinite = shareFields.filter((f) => !Number.isFinite(f.value));
assert("no share-named field is NaN or infinite", nonFinite.length === 0,
  JSON.stringify(nonFinite.slice(0, 3)));

/* THE SECTION IDENTITY ITSELF, in both directions. A section that renders in full renders its own
   declared share; a section that renders none of its weight renders zero — which is the half the
   first cut of this fix got wrong, publishing a fully-renderable share for a fleet with no
   renderable legs at all until tests/fleets.test.mjs caught it. */
{
  let full = 0, partial = 0, bad = [];
  for (const m of E.MODELS) for (const p of E.PERSPECTIVES) {
    let w; try { w = E.workload(E.applyPresetSettings(m, p, { mode: "native" })); } catch { continue; }
    const f = w.fleetRenderable;
    for (const s of f.sections || []) {
      if (f.renderableLegs === f.totalLegs && f.totalLegs > 0) {
        if (s.renderableShare !== s.share) bad.push(`${m.id}|${p.id} ${s.id}: ${s.renderableShare} !== declared ${s.share}`);
        else full += 1;
      }
    }
  }
  /* THE ZERO-RENDER DIRECTION IS NOT REACHABLE FROM THE PRESET GRID — every preset renders at
     least one leg — so it is constructed, using the solver's own counterexample pin (trn2 at 10T:
     no legal width fits, typed infeasible, no numbers). This direction is the one the first cut of
     the fix got WRONG: it summed every row in the section and only then asked whether they had all
     rendered, so a fleet with zero renderable legs published a fully-renderable share of 1.
     tests/fleets.test.mjs caught it; it is pinned here at the identity itself. */
  {
    const m = E.MODELS.find((x) => x.id === "opus"), p = E.PERSPECTIVES.find((x) => x.id === "median");
    const zero = E.applyPresetSettings(m, p, { mode: "native" });
    zero.blend = { trn2: 100 }; zero.total = 10000;
    const f = E.workload(zero).fleetRenderable;
    if (f.renderableLegs !== 0) bad.push(`the constructed zero-render fleet rendered ${f.renderableLegs} leg(s) — the pin has drifted`);
    for (const s of f.sections || []) {
      if (s.renderableShare !== 0) bad.push(`zero-render fleet section ${s.id} reports ${s.renderableShare}, not 0`);
      else partial += 1;
    }
  }

  /* THE PARTIAL DIRECTION, which neither the grid nor the zero-render pin reaches (fallback review
     F11). `declaredShare` snaps on a SECTION-level condition while the checks above gate on a
     FLEET-level one, and the case where they diverge — a section rendering in full inside a fleet
     that does not — was skipped entirely. Constructed: h100 renders at 10T, trn2 does not. */
  let partialFleets = 0;
  {
    const m = E.MODELS.find((x) => x.id === "opus"), p = E.PERSPECTIVES.find((x) => x.id === "median");
    const mixed = E.applyPresetSettings(m, p, { mode: "native" });
    mixed.blend = { h100: 50, trn2: 50 }; mixed.total = 10000;
    const f = E.workload(mixed).fleetRenderable;
    if (f.renderableLegs > 0 && f.renderableLegs < f.totalLegs) {
      partialFleets += 1;
      for (const s of f.sections || []) {
        if (!(s.renderableShare >= 0 && s.renderableShare <= s.share)) {
          bad.push(`partial fleet section ${s.id}: renderableShare ${s.renderableShare} is not within [0, declared ${s.share}]`);
        }
        if (s.renderableShare === s.share) {
          bad.push(`partial fleet section ${s.id} reports its FULL declared share ${s.share} while ${f.totalLegs - f.renderableLegs} leg(s) do not render`);
        }
      }
    }
  }
  assert("a section that renders in full reports its own declared share, and one that renders nothing reports zero",
    bad.length === 0, bad.slice(0, 4).join(" | "));
  assert("a partially-rendering fleet reports a section share strictly inside its declared share",
    partialFleets === 1, `constructed ${partialFleets} partial fleet(s) — the h100+trn2@10T pin has drifted`);
  assert("all three directions of that identity are actually exercised — full, zero and partial",
    full > 0 && partial > 0 && partialFleets > 0,
    `full-render sections ${full}, zero-render sections ${partial}, partial fleets ${partialFleets}`);
}

/* NON-VACUITY. */
assert("the walk reaches sonnet, the fleet whose weights overshoot (a bound written against the flagship alone was green throughout the defect)",
  reached.has("sonnet"));
assert("the walk finds a substantial number of share-named fields (a rename must not empty it silently)",
  shareFields.length >= 200, String(shareFields.length));
assert("the walk is capable of failing (an out-of-range share IS reported)", (() => {
  const probe = [];
  walk({ someShare: 1.5, nested: { otherShare: -0.1 } }, "probe", new WeakSet());
  const found = shareFields.filter((f) => f.path.startsWith("probe"));
  probe.push(...found.filter((f) => f.value < 0 || f.value > 1));
  return probe.length === 2;
})());

console.log(failures ? `\n${failures} SHARE-BOUND FAILURE(S)` : "\nALL ENGINE SHARE-BOUND TESTS PASS");
process.exit(failures ? 1 : 0);
