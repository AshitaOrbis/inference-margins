// DISCONTINUITY KEY MATCHING (bq-292) — release test.
//
// The defect: applyDiscontinuity() appended the discontinuity to t.discontinuities
// UNCONDITIONALLY, while only suppressing leaves whose key happened to match. A
// discontinuity naming keys that exist nowhere in the tree — a typo, a renamed
// metric, a key copied from a different tree — therefore recorded "a boundary
// invalidated metrics X and Y" while X and Y stayed displayed as valid.
//
// The record and the tree disagreed, and the record is what a reader believes. That
// is the same shape as a green CI check that never ran (bq-293) and a liveness row
// watching the wrong artifact (bq-307): an attestation with nothing behind it.
//
// Guarding belongs in applyDiscontinuity, not discontinuity(): only here is the tree
// in scope, so only here can a key be checked against treeLeafKeys().
//
// Run: node tests/discontinuity-key-match.test.mjs
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
const M = req("../site/engine-contracts-v22.js");
const { tree, leaf, discontinuity, applyDiscontinuity, metricKey, discontinuityMatchCount } = M;

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
const throws = (fn, re) => {
  try { fn(); return false; } catch (e) { return re.test(e.message); }
};

const scope = (policyPoint) => ({ model: "opus", hardware: "gb300", policyPoint });
const KEY_055 = metricKey("capacity.minWidth", scope(0.55));
const KEY_105 = metricKey("capacity.minWidth", scope(1.05));

const makeTree = () => tree({
  cap055: leaf("capacity.minWidth", scope(0.55), 100),
  cap105: leaf("capacity.minWidth", scope(1.05), 200),
});

const disc = (keys) => discontinuity("width", { hardware: "gb300", between: [0.55, 1.05] }, keys);

/* ---------- the healthy path is untouched ---------- */
{
  const t1 = applyDiscontinuity(makeTree(), disc([KEY_055, KEY_105]));
  assert("healthy: both named leaves are suppressed",
         t1.nodes.cap055.state === "suppressed" && t1.nodes.cap105.state === "suppressed");
  assert("healthy: the discontinuity is recorded", t1.discontinuities.length === 1);
}
{
  const t1 = applyDiscontinuity(makeTree(), disc([KEY_055]));
  assert("partial match is allowed: named leaf suppressed, unnamed leaf survives",
         t1.nodes.cap055.state === "suppressed" && t1.nodes.cap105.state === "present");
}

/* ---------- the regression: unknown keys must be REJECTED ---------- */
assert("a wholly unknown key is REJECTED (not recorded as a no-op)",
       throws(() => applyDiscontinuity(makeTree(), disc(["capacity.minWidth|model=opus|typo=1"])),
              /match no leaf/));
assert("a MIX of known and unknown keys is REJECTED",
       throws(() => applyDiscontinuity(makeTree(), disc([KEY_055, "not-a-real-key"])),
              /match no leaf/));
assert("the rejection names the offending key",
       throws(() => applyDiscontinuity(makeTree(), disc(["not-a-real-key"])), /not-a-real-key/));

/* ---------- duplicates are a key set, not a list ---------- */
assert("duplicate keys are REJECTED",
       throws(() => applyDiscontinuity(makeTree(), disc([KEY_055, KEY_055])), /duplicate/));

/* ---------- and the tree is never mutated by a rejected apply ---------- */
{
  const t0 = makeTree();
  try { applyDiscontinuity(t0, disc(["not-a-real-key"])); } catch { /* expected */ }
  assert("a rejected apply leaves the original tree untouched",
         t0.nodes.cap055.state === "present" && (t0.discontinuities || []).length === 0);
}

/* ---------- the match count is observable for tests ---------- */
{
  const t0 = makeTree();
  assert("discontinuityMatchCount reports 2 for two known keys",
         discontinuityMatchCount(t0, disc([KEY_055, KEY_105])) === 2);
  assert("discontinuityMatchCount reports 1 for one known key",
         discontinuityMatchCount(t0, disc([KEY_055])) === 1);
  assert("discontinuityMatchCount reports 0 for an unknown key — the case that used to pass silently",
         discontinuityMatchCount(t0, disc(["not-a-real-key"])) === 0);
}

console.log();
if (failures) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
console.log("ALL DISCONTINUITY KEY-MATCH TESTS PASS");
