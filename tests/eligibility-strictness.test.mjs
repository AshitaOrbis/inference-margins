// ELIGIBILITY STRICTNESS (bq-290) — release test.
//
// The defect had two halves that hid each other:
//
//   1. validateEligibility() never checked `eligible` for presence or type. It
//      tested only `e.eligible === false`, so an ABSENT or MALFORMED flag fell
//      straight through with no error — and the codebase's own downstream idiom
//      is `a.eligibility.eligible !== false`, which then reads "not explicitly
//      denied" as admissible. Admissibility was being inferred from the absence
//      of a denial.
//
//   2. makeEligibility() coerced every flag with `!!` BEFORE validation could see
//      it, destroying the evidence validation needed: `!!undefined` became a
//      confident `false` and `!!"no"` a confident `true`. After coercion you can
//      no longer distinguish absent from malformed from genuinely false.
//
// So the fix must be tested from both directions: the factory must preserve what
// it was given, and the validator must reject what is missing or malformed.
//
// Run: node tests/eligibility-strictness.test.mjs
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
const S = req("../site/evidence-schema.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

const TIER = S.ELIGIBILITY_TIERS[0];
const good = () => ({ tier: TIER, eligible: true, public: true, primarySourced: true });
const errsFor = (e) => S.validateEligibility(e);
const rejects = (e, re) => errsFor(e).some((x) => re.test(x));

/* ---------- the validator now demands a stated boolean ---------- */
assert("a well-formed eligibility block validates clean", errsFor(good()).length === 0);

assert("ABSENT eligible is REJECTED (not silently admissible)",
       rejects({ tier: TIER }, /eligible must be present/));
assert("null eligible is REJECTED", rejects({ tier: TIER, eligible: null }, /strict boolean/));
for (const [label, value] of [
  ['string "false"', "false"],
  ['string "true"', "true"],
  ["number 0", 0],
  ["number 1", 1],
  ["empty string", ""],
]) {
  assert(`malformed eligible (${label}) is REJECTED`,
         rejects({ tier: TIER, eligible: value }, /strict boolean/));
}

// The truthiness trap in miniature: "false" and 0 are the two values whose JS
// truthiness disagrees with their plain reading, and both used to pass.
assert('string "false" would have read as ELIGIBLE under the old coercion',
       Boolean("false") === true);
assert("number 0 would have read as INELIGIBLE under the old coercion",
       Boolean(0) === false);

/* ---------- control flags must be strict booleans when present ---------- */
assert("malformed control flag is REJECTED",
       rejects({ ...good(), public: "yes" }, /public.*strict boolean/));
assert("an ABSENT control flag is still allowed (only `eligible` is mandatory)",
       errsFor({ tier: TIER, eligible: true }).length === 0);

/* ---------- the pre-existing rule must survive the change ---------- */
assert("eligible=false with no exclusionReason is still REJECTED",
       rejects({ tier: TIER, eligible: false }, /exclusionReason/));
assert("eligible=false WITH an exclusionReason is accepted",
       errsFor({ tier: TIER, eligible: false, exclusionReason: "no defined denominator" }).length === 0);
assert("an unknown tier is still REJECTED", rejects({ ...good(), tier: "not-a-tier" }, /tier/));

/* ---------- the factory no longer decides admissibility ---------- */
assert("makeEligibility does NOT invent eligible=false for an absent flag",
       S.makeEligibility({}).eligible === undefined);
assert("makeEligibility preserves a malformed value so validation can see it",
       S.makeEligibility({ eligible: "no" }).eligible === "no");
assert("makeEligibility preserves a genuine false",
       S.makeEligibility({ eligible: false }).eligible === false);
assert("makeEligibility still fills tier with UNKNOWN when omitted",
       S.makeEligibility({}).tier === S.UNKNOWN);
assert("a record built with no eligibility data does NOT validate as eligible",
       errsFor(S.makeEligibility({})).some((x) => /eligible must be present/.test(x)));

console.log();
if (failures) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
console.log("ALL ELIGIBILITY-STRICTNESS TESTS PASS");
