// C-1 NEGATIVE CONTROL — token generator, derived from the PRODUCTION filtering path.
//
// GPT Pro review pr-20260902T153840Z-bce1bb finding 1: the C-1 negative's control existed only in
// a comment, so nothing in the gate proved the forbidden hero was reachable. A comment records a
// one-time experiment; it cannot keep the gate non-vacuous across the next engine or data
// revision. This emits a permalink for the serve-feasibility-FILTERED construction of a named
// fleet, built by calling deriveDefaultFleetMembership — the same function fleetBaselineBlend
// uses for the DEFAULT fleet — so the control tracks the engine rather than five weights copied
// out of prose.
//
// Run: node site/tests/derive-c1-control.mjs <totalB> <fleetId>
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
// Location-agnostic by construction: it probes both candidate roots for engine.js, so the same
// bytes work from the private tests directory and from the served twin. No path rewriting needed.
const SITE = [join(HERE, "..", "site"), join(HERE, "..")].find(d => existsSync(join(d, "engine.js")));
if (!SITE) { console.error("derive-c1-control: cannot locate engine.js"); process.exit(2); }
const E = require(join(SITE, "engine.js"));
const ED = require(join(SITE, "engine-data-v22.js"));
const ED_FLEET_CASES = E.TOTAL_CASES || ED.TOTAL_CASES;

const totalB = Number(process.argv[2]);
const fleetId = process.argv[3];
if (!Number.isFinite(totalB) || !fleetId) { console.error("usage: derive-c1-control.mjs <totalB> <fleetId>"); process.exit(2); }

const opus = E.MODELS.find(m => m.id === "opus");
const median = E.PERSPECTIVES.find(p => p.id === "median");
const base = E.applyPresetSettings(opus, median, { mode: "native" });
const ctx = E.scenarioContext(base);
const st = structuredClone(base); st.total = totalB;
E.registerScenarioContext(st, ctx);

const d = E.deriveDefaultFleetMembership(fleetId, st, ctx);
if (!d || !d.memberLegCount) { console.error(`derive-c1-control: no members for ${fleetId} at ${totalB}`); process.exit(3); }
/* If nothing is excluded the filtered construction IS the declared one, so no control exists and
   the caller's fixture cannot discriminate. Fail loudly and say so rather than emitting a token
   that would make the negative pass trivially — the vacuity this whole guard exists to prevent. */
if (!d.excluded || d.excluded.length === 0) {
  console.error(`derive-c1-control: NOTHING IS EXCLUDED for ${fleetId} at ${totalB} — the filtered and declared constructions coincide, so this operating point cannot discriminate. Choose a total where the filter bites.`);
  process.exit(4);
}
const blend = Object.fromEntries(E.HW_ORDER.map(k => [k, 0]));
for (const m of d.members) blend[m.hwKey] = m.declaredWeight;   // the DEFAULT-fleet production path

/* The case id is RESOLVED from the engine's own table, never hardcoded. The codec enforces
   case-id/value consistency (a label may not disagree with its total), so a hardcoded
   "community-central-5.0" silently stopped decoding the moment a caller re-pointed this
   generator at any total but 5 T — and a non-decoding token here reads, at the call site, as
   "the filter does not bite", which is the WRONG diagnosis. Resolve the id; fall back to
   "custom" when no declared case carries that size. (im-vet-six-repairs 2026-09-20, found by
   re-pointing the C-1 fixture after the vetting repairs made 5 T non-discriminating.) */
const caseId = Object.entries(ED_FLEET_CASES).find(([, v]) => v.totalB === totalB)?.[0] || "custom";
const token = {
  total: totalB,
  blend,
  _meta: {
    schema: "v5", epoch: "v22r4", displayedMargin: null,
    model: "opus", persp: "median",
    fleet: { id: "custom" },
    totalCase: caseId,
    traffic: { mode: "native", profileId: "reference", ioRatio: 15, cacheHit: 60 },
  },
};
const encoded = "v5." + Buffer.from(JSON.stringify(token), "utf8").toString("base64");
if (E.decodeScenario(encoded) === null) { console.error("derive-c1-control: the emitted token does not decode"); process.exit(5); }
if (process.argv.includes("--explain")) {
  console.error(`control: ${fleetId}@${totalB} members=${d.memberLegCount}/${d.declaredLegCount} excluded=${d.excluded.map(e => e.hwKey).join(",")}`);
}
process.stdout.write(encoded);
