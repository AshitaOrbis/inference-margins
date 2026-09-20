// FINITE-VALUE GUARDS on the WS-C uncertainty contract (bq-291) — release test.
//
// The defect: the validators gated on `typeof x !== "number"`. In JS
// `typeof NaN === "number"` and `typeof Infinity === "number"`, so both passed —
// and every comparison after the gate is then vacuously false (`NaN <= 0` is
// false, `NaN > NaN` is false), so a NaN multiplier cleared the >0 floor AND the
// low<=high ordering check and reached composeBand untouched.
//
// Why it mattered more than an ordinary input-validation gap: composeBand still
// returned `derived: true` while emitting NaN bounds, and `JSON.stringify(NaN)`
// is `null` — so a serialized band read `{"low":null,"high":null,"derived":true}`.
// A band asserting it was derived, carrying no numbers, with the corruption
// invisible to every downstream consumer. Infinity multipliers likewise produced
// an Infinity..Infinity band marked derived.
//
// Run: node tests/uncertainty-finite-guards.test.mjs
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const U = require("../site/uncertainty-contract.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

const goodComponent = () => ({
  component: U.UNCERTAINTY_COMPONENTS[0],
  appliesTo: U.APPLIES_TO[0],
  basis: U.BASES[0],
  range: { lowMult: 0.5, highMult: 2 },
  sourceRef: "test-source",
});
const withRange = (lowMult, highMult) => ({ ...goodComponent(), range: { lowMult, highMult } });
const objWith = (central, comps) => ({
  central: { value: central, unit: "usd" },
  components: comps,
  composition: "linear-worst-case",
  band: { label: U.BAND_LABELS[0] },
});

/* ---------- component validator ---------- */
assert("healthy component validates clean",
       U.validateUncertaintyComponent(goodComponent()).length === 0);

for (const [label, low, high] of [
  ["NaN lowMult", NaN, 2],
  ["NaN highMult", 0.5, NaN],
  ["Infinity highMult", 0.5, Infinity],
  ["-Infinity lowMult", -Infinity, 2],
  ["both NaN", NaN, NaN],
]) {
  const errs = U.validateUncertaintyComponent(withRange(low, high));
  assert(`component REJECTS ${label}`, errs.length > 0);
  assert(`component error for ${label} names finiteness`,
         errs.some((e) => /FINITE|NaN|Infinity/i.test(e)), JSON.stringify(errs));
}

// The ordering and floor checks must still work on finite input — the fix must not
// have replaced one class of miss with another.
assert("component still rejects a non-positive finite lowMult",
       U.validateUncertaintyComponent(withRange(0, 2)).length > 0);
assert("component still rejects low > high on finite input",
       U.validateUncertaintyComponent(withRange(3, 2)).length > 0);

/* ---------- object validator ---------- */
assert("object REJECTS a NaN central value",
       U.validateUncertaintyObject(objWith(NaN, [goodComponent()]))
        .some((e) => /central/.test(e)));
assert("object REJECTS an Infinity central value",
       U.validateUncertaintyObject(objWith(Infinity, [goodComponent()]))
        .some((e) => /central/.test(e)));
assert("object accepts a finite central value (no central-value error)",
       !U.validateUncertaintyObject(objWith(10, [goodComponent()]))
         .some((e) => /central\.value/.test(e)));

/* ---------- composeBand refuses rather than deriving garbage ---------- */
const nanCentral = U.composeBand(objWith(NaN, [goodComponent()]));
assert("composeBand does NOT claim derived on a NaN central", nanCentral.derived === false);
assert("composeBand explains why on a NaN central", /non-finite/i.test(nanCentral.error || ""));
assert("composeBand emits no NaN bounds on a NaN central",
       !Number.isNaN(nanCentral.low) && !Number.isNaN(nanCentral.high));

const infMult = U.composeBand(objWith(10, [withRange(Infinity, Infinity)]));
assert("composeBand does NOT claim derived on Infinity multipliers", infMult.derived === false);
assert("composeBand explains why on Infinity multipliers", /non-finite/i.test(infMult.error || ""));
assert("composeBand emits no Infinity bounds",
       infMult.low !== Infinity && infMult.high !== Infinity);

// The healthy path must be untouched: 10 x (0.5 .. 2) = 5 .. 20.
const healthy = U.composeBand(objWith(10, [goodComponent()]));
assert("composeBand still derives a healthy band", healthy.derived === true);
assert("composeBand healthy bounds are exact", healthy.low === 5 && healthy.high === 20,
       `${healthy.low}..${healthy.high}`);

console.log();
if (failures) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
console.log("ALL UNCERTAINTY FINITE-GUARD TESTS PASS");
