// §1.7 RELEASE TEST (im4-r2-shipment-plan item 7; memo §0-quinquies): share links
// NEVER encode a loaded-bytes policy scalar; a reloaded link re-evaluates under the
// CURRENT policy registry and shows current-policy output + disclosure.
// Method (the plan's own recipe): encode → structural token audit → mutate the policy
// registry in a SANDBOXED COPY of the site tree → decode there → the recomputed number
// is the copy's own current-policy result (≠ the mint-time number), the disclosure
// carries the copy's current policy value, and the v5 drift channel surfaces the delta.
// Run: node tests/link-policy-invariant.test.mjs
import { createRequire } from "node:module";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "site");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

const E1 = require(join(SITE, "engine.js"));

/* ---------- mint a link from the flagship central state ---------- */
const m1 = E1.MODELS.find(x => x.id === "opus");
const median1 = E1.PERSPECTIVES.find(p => p.id === "median");
const state1 = E1.applyPresetSettings(m1, median1, { mode: "native" });
// Use the labeled 5T replay: its geometry intentionally disengages the
// current-Opus placement row, so the uniform loaded-bytes policy is
// load-bearing. The 2.5T default engages published component placement and
// therefore correctly does not move when CAPACITY_BYTES_POLICY.fp8 changes.
state1.total = E1.TOTAL_CASES["community-central-5.0"].totalB;
state1.blend = E1.fleetBaselineBlend("na-blend", state1,
  { modelId: "opus", customDonor: state1.customDonor });
const tr1 = E1.resolveTraffic(m1, median1, { mode: "native" });
const ctx1 = E1.makeScenarioContext(m1, tr1, state1.customDonor);
const wl1 = E1.workload(state1, undefined, ctx1);
const token = E1.encodeScenario(state1, "opus", "median",
  { mode: tr1.mode, profileId: tr1.profileId ?? null, ioRatio: tr1.ioRatio, cacheHit: tr1.cacheHit }, null,
  { fleet: "na-blend", totalCase: "community-central-5.0" });

/* ---------- 1. structural audit: no policy scalar travels in the token ---------- */
{
  const payload = JSON.parse(Buffer.from(token.slice(3), "base64").toString("utf8"));
  const offending = [];
  (function walk(v, path) {
    if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        if (/policy|loadedweight|bytesperparam|residency|placement/i.test(k)) offending.push(path + "." + k);
        walk(x, path + "." + k);
      }
    }
  })(payload, "$");
  assert("token payload carries NO policy/residency-named field (structural audit)", offending.length === 0, offending.join(", "));
  // The engine's policy constants are not state fields, so their VALUES may only appear
  // coincidentally; the field-name audit above is the load-bearing check. The declared
  // scenario fields are the closed diff-vs-baseline set plus _meta.
  assert("token schema is v6 with _meta provenance", token.startsWith("v6.") && typeof payload._meta === "object"); // b9 M4: live codec is v6
}

/* ---------- 2. sandboxed copy with a MUTATED policy registry ---------- */
const SANDBOX = mkdtempSync(join(tmpdir(), "im-link-policy-"));
try {
  cpSync(SITE, join(SANDBOX, "site"), { recursive: true });
  const enginePath = join(SANDBOX, "site", "engine.js");
  const src = readFileSync(enginePath, "utf8");
  const marker = "fp8: 1.0, fp4: 0.65, bf16: 2.0,";
  const mutated = src.replace(marker, "fp8: 0.55, fp4: 0.65, bf16: 2.0,");
  const count = src.split(marker).length - 1;
  assert("sandbox mutation: CAPACITY_BYTES_POLICY marker found exactly once", count === 1, `count=${count}`);
  writeFileSync(enginePath, mutated);

  const E2 = require(enginePath); // distinct path → fresh module instance
  assert("sandbox engine carries the mutated policy (fp8 → 0.55)", E2.CAPACITY_BYTES_POLICY.fp8 === 0.55);

  /* decode the SAME token in the mutated world and re-render as the loader does:
     clean identity baseline + numeric diff (v5 loader semantics). */
  const d = E2.decodeScenario(token);
  assert("token decodes in the mutated world (schema v5, same identity)", !!d && d._meta && d._meta.model === "opus" && d._meta.persp === "median");
  const m2 = E2.MODELS.find(x => x.id === "opus");
  const median2 = E2.PERSPECTIVES.find(p => p.id === "median");
  const base2 = E2.applyPresetSettings(m2, median2, { mode: "native" });
  for (const [k, v] of Object.entries(d)) if (k !== "_meta") base2[k] = v;
  base2.blend = E2.fleetBaselineBlend(d._meta.fleet.id, base2,
    { modelId: "opus", customDonor: base2.customDonor });
  const tr2 = E2.resolveTraffic(m2, median2, { mode: "native" });
  const wl2 = E2.workload(base2, undefined, E2.makeScenarioContext(m2, tr2, base2.customDonor));

  // The copy's OWN fresh central computation (no token involved) — the authority the
  // reloaded link must agree with (current-policy re-evaluation).
  const freshState2 = E2.applyPresetSettings(m2, median2, { mode: "native" });
  freshState2.total = E2.TOTAL_CASES["community-central-5.0"].totalB;
  freshState2.blend = E2.fleetBaselineBlend("na-blend", freshState2,
    { modelId: "opus", customDonor: freshState2.customDonor });
  const fresh2 = E2.workload(freshState2, undefined,
    E2.makeScenarioContext(m2, tr2, freshState2.customDonor));

  assert("reloaded link re-evaluates under the CURRENT policy registry (matches the copy's fresh computation)",
    wl2.margin === fresh2.margin, `link ${wl2.margin} vs fresh ${fresh2.margin}`);
  assert("the mutated policy actually moved the number (the mint-time scalar is NOT frozen in the link)",
    wl2.margin !== wl1.margin, `both ${wl2.margin}`);
  const disclosure = E2.fleetRenderableDisclosure(wl2.fleetRenderable, false);
  assert("disclosure carries the CURRENT policy value (0.55 B/param)", /0\.55 B\/param/.test(disclosure), disclosure.slice(0, 160));
  const drift = E2.marginDriftNote(d._meta.displayedMargin, Math.round(wl2.margin * 100 * 1000) / 1000);
  assert("v5 drift channel surfaces mint-time vs current-policy delta", !!drift && /originally shared/.test(drift.text));

  /* negative control: the original world reproduces the original margin from the token */
  const dd = E1.decodeScenario(token);
  const base1b = E1.applyPresetSettings(m1, median1, { mode: "native" });
  for (const [k, v] of Object.entries(dd)) if (k !== "_meta") base1b[k] = v;
  base1b.blend = E1.fleetBaselineBlend(dd._meta.fleet.id, base1b,
    { modelId: "opus", customDonor: base1b.customDonor });
  const wl1b = E1.workload(base1b, undefined, E1.makeScenarioContext(m1, tr1, base1b.customDonor));
  /* FA re-anchor (memo J-9): at the revised default size h100 is a member under BOTH
     policies, so the policy-sensitivity demonstration lives at the 5T size case — the
     fp8→0.55 world admits h100 there (the R3 membershipSensitivity wouldEnter fact)
     while the 1.0 world excludes it: same derivation function, policy decides. */
  {
    const s5a = E1.applyPresetSettings(m1, median1, { mode: "native" }); s5a.total = 5000;
    const s5b = E2.applyPresetSettings(m2, median2, { mode: "native" }); s5b.total = 5000;
    const memb1 = E1.deriveDefaultFleetMembership(E1.DEFAULT_FLEET_ID, s5a, { modelId: "opus", customDonor: s5a.customDonor });
    const memb2 = E2.deriveDefaultFleetMembership(E2.DEFAULT_FLEET_ID, s5b, { modelId: "opus", customDonor: s5b.customDonor });
    // b9 M1 re-mint: the demonstration is unchanged in kind and sharper in degree — at 0.55
    // all seven legs enter, at 1.0 only five do (trn2 now joins h100 in exclusion, its
    // declared batch having moved 4 → 32). Same derivation function; policy decides.
    /* im-vet-six-repairs (2026-09-20) re-mint: both counts drop by two, because the Trainium
       legs are now WITHDRAWN on evidence grounds at every size and under every policy — a
       withdrawal is a fact about the row's evidence, not about the loaded-bytes policy, which is
       exactly why it must NOT move with the policy here. So the demonstration this assertion
       exists for is unchanged and is now stated in both directions: the policy-sensitive part
       (h100, and at 0.55 trn2's capacity) still moves with the policy, and the withdrawal does
       not move at all. */
    assert("DERIVED membership re-derives under the current policy (@5T case: h100 enters at 0.55, excluded at 1.0) while the Trainium withdrawal moves under NEITHER",
      !!memb2 && !!memb1 && memb2.memberLegCount === 5 && memb1.memberLegCount === 4
      && [memb1, memb2].every((mb) => mb.excluded.filter((x) => x.ground === "withdrawn").length === 2),
      `mutated ${memb2 && memb2.memberLegCount} vs original ${memb1 && memb1.memberLegCount}`);
  }
  assert("negative control: unmutated world reproduces the mint-time margin", wl1b.margin === wl1.margin,
    `${wl1b.margin} vs ${wl1.margin}`);
} finally {
  rmSync(SANDBOX, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} FAILURES` : "\nALL LINK-POLICY-INVARIANT TESTS PASS");
process.exit(failures ? 1 : 0);
