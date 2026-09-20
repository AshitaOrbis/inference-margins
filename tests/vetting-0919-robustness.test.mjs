/* vetting-0919-robustness — mutation controls for the im-vet-0919 round-1 fold.
 *
 * Three findings, three guards. Each assertion below fails on the pre-fold sources:
 *   A P1-1  site/uncertainty-contract.js — composeBand returned an INVERTED band for a
 *           negative central scenario and an Infinity endpoint on overflow, and
 *           validateUncertaintyObject checked the band's WORDING while ignoring its numbers,
 *           so both validated with zero errors.
 *   A P1-2  site/custom-fleets.js — validateCustomFleet recorded "not an object" for a null
 *           leg and then dereferenced that same leg, THROWING out of a function whose contract
 *           is to return {ok:false}; one hand-edited localStorage row took the page with it.
 *   A P1-3  site/engine.js — capitalRecoveryFactor used the textbook (1+r)^L − 1 denominator,
 *           which cancels to exactly 0 once 1+r rounds to 1, returning Infinity and a NaN
 *           margin for an in-bounds costOfCapitalPct of 1e-15.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const F = require("../site/custom-fleets.js");
const U = require("../site/uncertainty-contract.js");

let fails = 0, passes = 0;
function check(name, cond, detail = "") {
  if (cond) { passes++; console.log("PASS  " + name); }
  else { fails++; console.log("FAIL  " + name + (detail ? "  — " + detail : "")); }
}

const uobj = (value, lowMult = 0.5, highMult = 2) => {
  const u = U.makeUncertaintyObject({
    central: { value, unit: "margin", label: "central" },
    components: [{ component: "price", appliesTo: "margin", basis: "analyst-set",
      sourceRef: "scenario", range: { lowMult, highMult } }],
  });
  u.band = U.composeBand(u);
  return u;
};

/* ---- A P1-1: composed bands are ordered, finite, and contain their central ---- */
{
  const neg = uobj(-0.2);
  check("a negative central scenario composes an ORDERED band",
    neg.band.derived === true && neg.band.low <= neg.band.high,
    JSON.stringify({ low: neg.band.low, high: neg.band.high }));
  check("that band's endpoints are the two signed products, smallest first",
    neg.band.low === -0.4 && neg.band.high === -0.1,
    JSON.stringify({ low: neg.band.low, high: neg.band.high }));
  check("the negative-central band contains its own central scenario",
    neg.band.low <= -0.2 && -0.2 <= neg.band.high);
  check("a negative-central band validates clean",
    U.validateUncertaintyObject(neg).length === 0,
    JSON.stringify(U.validateUncertaintyObject(neg)));

  const over = uobj(1e308);
  check("an overflowing composition refuses instead of emitting Infinity",
    over.band.derived === false && over.band.low === null && over.band.high === null
      && typeof over.band.error === "string",
    JSON.stringify(over.band));
  check("a band that failed to compose does NOT validate clean",
    U.validateUncertaintyObject(over).length > 0,
    JSON.stringify(U.validateUncertaintyObject(over)));

  // Hand-built violations the validator previously waved through.
  const inverted = uobj(0.8);
  inverted.band = { ...inverted.band, low: 1.6, high: 0.4 };
  check("a hand-inverted derived band is rejected by name",
    U.validateUncertaintyObject(inverted).some(e => /inverted/.test(e)),
    JSON.stringify(U.validateUncertaintyObject(inverted)));

  const infinite = uobj(0.8);
  infinite.band = { ...infinite.band, high: Infinity };
  check("a non-finite derived endpoint is rejected by name",
    U.validateUncertaintyObject(infinite).some(e => /FINITE/.test(e)),
    JSON.stringify(U.validateUncertaintyObject(infinite)));

  const outside = uobj(0.8);
  outside.band = { ...outside.band, low: 0.9, high: 1.6 };
  check("a central scenario outside its own band is rejected by name",
    U.validateUncertaintyObject(outside).some(e => /outside its own band/.test(e)),
    JSON.stringify(U.validateUncertaintyObject(outside)));

  const healthy = uobj(0.8);
  check("a healthy band still validates clean (the guard is not blanket-rejecting)",
    U.validateUncertaintyObject(healthy).length === 0,
    JSON.stringify(U.validateUncertaintyObject(healthy)));
}

/* ---- A P1-2: malformed fleet rows RETURN, they do not throw ---- */
{
  const cases = {
    "a null leg": () => { const f = F.makeBlankFleet(); f.sections[0].legs = [null]; return f; },
    "a string leg": () => { const f = F.makeBlankFleet(); f.sections[0].legs = ["nope"]; return f; },
    "an array leg": () => { const f = F.makeBlankFleet(); f.sections[0].legs = [[]]; return f; },
    "a null leg beside a valid one": () => {
      const f = F.makeBlankFleet();
      f.sections[0].legs = [null, F.makeLegFromDonor("h100", 100)];
      return f;
    },
  };
  for (const [name, build] of Object.entries(cases)) {
    let threw = null, result = null;
    try { result = F.validateCustomFleet(build(), { requireId: false }); }
    catch (err) { threw = err; }
    check(`validateCustomFleet returns {ok:false} for ${name} instead of throwing`,
      threw === null && result !== null && result.ok === false,
      threw ? `${threw.constructor.name}: ${threw.message}` : JSON.stringify(result && result.ok));
  }
  const good = F.makeBlankFleet();
  good.sections[0].legs = [F.makeLegFromDonor("h100", 100)];
  check("a well-formed fleet still validates (the guard is not blanket-rejecting)",
    F.validateCustomFleet(good, { requireId: false }).ok === true);
}

/* ---- A P1-3: the capital-recovery factor is continuous at r → 0 ---- */
{
  const L = 4;
  const straight = 1 / L;
  const tiny = [1e-17, 1e-16, 1e-15, 1e-12, 1e-9];
  for (const r of tiny) {
    const crf = E.capitalRecoveryFactor(r, L);
    check(`capitalRecoveryFactor(${r}, ${L}) is finite and ~1/L`,
      Number.isFinite(crf) && Math.abs(crf - straight) < 1e-6, String(crf));
  }
  check("capitalRecoveryFactor is monotone increasing in the rate",
    [0, 1e-9, 0.001, 0.01, 0.085, 0.4].every((r, i, a) =>
      i === 0 || E.capitalRecoveryFactor(r, L) >= E.capitalRecoveryFactor(a[i - 1], L)));
  check("the textbook value is unchanged at an ordinary rate (8.5%, 4 years)",
    Math.abs(E.capitalRecoveryFactor(0.085, L) - 0.3052878925946728) < 1e-12,
    String(E.capitalRecoveryFactor(0.085, L)));

  // The whole point: an in-bounds shared link must render a number.
  const m = E.MODELS.find(x => x.id === "dsv4"), p = E.PERSPECTIVES.find(x => x.id === "dive");
  const zero = E.applyPresetSettings(m, p);
  Object.assign(zero, { hwMode: "tco", capitalRecovery: "on", costOfCapitalPct: 0 });
  const zeroMargin = E.workload(zero).margin;
  for (const pct of [1e-15, 1e-12, 1e-9]) {
    const s = E.applyPresetSettings(m, p);
    Object.assign(s, { hwMode: "tco", capitalRecovery: "on", costOfCapitalPct: pct });
    const margin = E.workload(s).margin;
    check(`a TCO scenario at costOfCapitalPct=${pct} renders a finite margin`,
      Number.isFinite(margin) && Math.abs(margin - zeroMargin) < 1e-6,
      String(margin));
  }
  check("SCENARIO_BOUNDS really does admit those values (so the case is in-bounds, not exotic)",
    E.SCENARIO_BOUNDS.costOfCapitalPct[0] === 0 && E.SCENARIO_BOUNDS.costOfCapitalPct[1] === 40,
    JSON.stringify(E.SCENARIO_BOUNDS.costOfCapitalPct));
}

console.log(`\n${passes} passed, ${fails} failed`);
if (fails) { console.log(`\n${fails} VETTING-0919 ROBUSTNESS FAILURE(S)`); process.exit(1); }
console.log("\nALL VETTING-0919 ROBUSTNESS CHECKS PASS");
