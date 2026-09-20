// im-arc T2 — generic electricity-default migration (memo §6).
// Run: node tests/electricity-default-t2.test.mjs
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
/* im-arc T4 fold (2026-08-24), memo §6 [F10]: this file measures the T2 ELECTRICITY move, so it
   must measure it in isolation. The T4 fold moved capex, the cluster-overhead semantics, the
   facility life and three planning rents underneath it; every reading below is therefore taken
   through the GENERATED pre-T4 bundle, which restores exactly those sinks and nothing else. */
import { asPreT4, preT4HistoryAvailable, PRE_T4_BASE_COMMIT, withPreVettingRegistry } from "./t4-historical-pins.mjs";
import { MODE as PROVENANCE_MODE } from "./provenance-inputs.mjs";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const DC = require("../site/engine-data-dc-v1.js");
const pins = JSON.parse(readFileSync(new URL("./fixtures-historical-kwh-pins.json", import.meta.url), "utf8"));
const before = JSON.parse(readFileSync(new URL("./fixtures-pre-t2-kwh-move.json", import.meta.url), "utf8"));
const baseline = JSON.parse(readFileSync(new URL("./fixtures-baseline-v22.json", import.meta.url), "utf8"));
const minted = JSON.parse(readFileSync(new URL("./fixtures-minted-tokens-v211.json", import.meta.url), "utf8"));

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
const native = { mode: "native", profileId: null };
const opus = E.MODELS.find(model => model.id === "opus");
const p = id => E.PERSPECTIVES.find(row => row.id === id);
const margin = state => E.workload(state, undefined, E.scenarioContext(state)).margin * 100;

/* im-arc T2 fix (Sol review 2026-08-23, finding P2-2): discover historical
   pins by resolving effective computation basis, then cross-walk authored routes,
   snapshot/provenance fixtures, and the final-answer registry. */
const resolvedBasis = state => E.resolveFleetSections(state)[0].section.basis;
const candidates = [];
for (const row of E.PERSPECTIVES) {
  const effective = E.applyPresetSettings(opus, row, native);
  if (resolvedBasis(effective) === "owned-strategic-tco")
    candidates.push(`perspective:${row.id}`);
}
for (const row of E.EXEC_SUMMARY_ROWS) {
  if (!row.override) continue;
  const effective = Object.assign(E.applyPresetSettings(opus, p("median"), native), row.override);
  if (resolvedBasis(effective) === "owned-strategic-tco") candidates.push(`exec-summary:${row.id}`);
}
candidates.sort();
const listed = pins.entries.map(row => row.id).sort();
assert("T2-E1 historical candidate inventory equals the enumerated pin fixture",
  JSON.stringify(candidates) === JSON.stringify(listed), JSON.stringify({ candidates, listed }));

/* im-arc T2 fix (Sol review 2026-08-23, finding P2-2): these are actual
   traversals, not names standing in for fixture coverage. Every snapshot pair
   and provenance vector is materialized, then its effective basis is resolved. */
const fixtureCandidates = [];
for (const key of Object.keys(baseline.pairs)) {
  const [modelId, perspectiveId] = key.split("|");
  const model = E.MODELS.find(row => row.id === modelId);
  const perspective = E.PERSPECTIVES.find(row => row.id === perspectiveId);
  if (model && perspective
      && resolvedBasis(E.applyPresetSettings(model, perspective, native)) === "owned-strategic-tco")
    fixtureCandidates.push(`fixture:baseline-v22:${key}`);
}
for (const group of ["v4", "historical"]) for (const row of minted[group]) {
  const vector = group === "v4" ? row.inputVector
    : row.resolvedUnderCurrent && row.resolvedUnderCurrent.inputVector;
  if (!vector) continue;
  const state = { ...structuredClone(E.DEFAULTS), ...structuredClone(vector) };
  if (resolvedBasis(state) === "owned-strategic-tco")
    fixtureCandidates.push(`fixture:minted-v211:${row.id}`);
}
const preMoveStates = [
  ["generic", { ...structuredClone(E.DEFAULTS), hwMode: "tco", kwh: before.generic.kwh }],
  ...Object.entries(before.forcedTco).map(([id, row]) => [
    `forced-tco:${id}`, { ...structuredClone(E.DEFAULTS), hwMode: "tco", kwh: row.kwh },
  ]),
  ...Object.entries(before.perspectives).map(([id, row]) => [
    `perspective:${id}`, { ...structuredClone(E.DEFAULTS), ...structuredClone(row) },
  ]),
];
for (const [id, state] of preMoveStates)
  if (resolvedBasis(state) === "owned-strategic-tco")
    fixtureCandidates.push(`fixture:pre-t2-kwh-move:${id}`);
fixtureCandidates.sort();

const walkedSources = [
  "site/engine.js:PERSPECTIVES-page-authored-routes",
  "site/engine.js:EXEC_SUMMARY_ROWS-final-answer",
  "tests/fixtures-baseline-v22.json",
  "tests/fixtures-minted-tokens-v211.json",
  "tests/fixtures-pre-t2-kwh-move.json",
];
const discovered = [...candidates, ...fixtureCandidates].sort();
const recorded = [...pins.entries.map(row => row.id), ...pins.fixturePins].sort();
const inventoryEqual = inventory => JSON.stringify(inventory.slice().sort()) === JSON.stringify(discovered);
const negativeControl = structuredClone(recorded); negativeControl.splice(0, 1);
assert("T2-FIX-P2-2 exhaustive effective-basis pin inventory covers all registries and fails closed on omission",
  JSON.stringify(pins.inventorySources) === JSON.stringify(walkedSources)
    && inventoryEqual(recorded) && !inventoryEqual(negativeControl),
  JSON.stringify({ inventorySources: pins.inventorySources, walkedSources,
    candidates, fixtureCandidates, recorded, negativeControlDetected: !inventoryEqual(negativeControl) }));

assert("T2-E2 DEFAULTS.kwh is read from the US-industrial registry median",
  E.DEFAULTS.kwh === DC.REGIONS["us-industrial"].usdPerKwh.mid && E.DEFAULTS.kwh === 0.0871,
  String(E.DEFAULTS.kwh));
assert("T2-E2 slider copy names the EIA point, page span, and provisional status",
  E.TIPS.kwh.b.includes("$0.087") && E.TIPS.kwh.b.includes("0.06–0.12")
    && /provisional/i.test(E.TIPS.kwh.b), E.TIPS.kwh.b);
/* im-arc T4 fold (2026-08-24): the epoch names the CURRENT defaults migration, which is now the
   T4 fold. The T2 electricity move is not lost by that — it stays recorded in the enumerated pin
   fixture this file reads, and that is what is asserted here instead of a stale stamp. */
assert("T2-E2 DEFAULTS_EPOCH names the current defaults migration",
  /im-arc-t4-fold/.test(E.DEFAULTS_EPOCH), E.DEFAULTS_EPOCH);
assert("T2-E2 the T2 electricity migration is still recorded in the enumerated pin fixture",
  /im-arc T2 generic electricity default move/.test(pins.migration) && pins.preMoveUsdPerKwh === 0.07,
  JSON.stringify({ migration: pins.migration, preMove: pins.preMoveUsdPerKwh }));

for (const entry of pins.entries) {
  const row = entry.registry === "PERSPECTIVES"
    ? E.PERSPECTIVES.find(item => item.id === entry.key)
    : E.EXEC_SUMMARY_ROWS.find(item => item.id === entry.key);
  const value = entry.pinPath.split(".").reduce((at, key) => at && at[key], row);
  /* im-arc T4 fold (2026-08-24), memo §2 [F8]: one entry changed pin KIND. The exec-summary
     owned-TCO reading no longer pins a literal $0.07 — it INHERITS the registered region by id, so
     the reading and the registry it cites cannot drift apart. Its pre-move value is preserved in
     the declared-delta manifest and reproduces through the generated pre-T4 bundle. Both kinds are
     asserted by name; neither is allowed to be silently absent. */
  if (entry.pinKind === "region-inheritance")
    assert(`T2-E3 ${entry.id} inherits its electricity region by id, and records its pre-move value`,
      value === "us-industrial" && entry.preT4Value === 0.07
      && DC.REGIONS[value] && typeof DC.REGIONS[value].usdPerKwh.mid === "number",
      JSON.stringify({ value, preT4Value: entry.preT4Value }));
  else
    assert(`T2-E3 ${entry.id} explicitly pins the pre-move $0.07 assumption`, value === 0.07, String(value));
}
/* im-vet-six-repairs (2026-09-20) — THE ASSERTION IS STRENGTHENED, not re-minted.
   It used to compare the LIVE reading to a pinned absolute from the pre-move fixture, which
   holds only while nothing ELSE moves the reading. Two things did: the Trainium legs left the
   default fleet on evidence grounds and the TPU decode coefficient was corrected, so both routes
   now read 91.8320 / 92.7234 against a fixture that records 91.6949 / 92.8942.
   Re-minting a fixture whose whole job is to be the BEFORE would have destroyed the record, so
   the property these lines exist for is asserted DIRECTLY instead: an electricity-pinned route's
   reading does not depend on the generic electricity default, executed by moving that default
   and requiring byte-equality. That is what "pinned at $0.07" means, it cannot go stale when an
   unrelated input moves, and it fails loudly if the pin is ever dropped. The pre-move absolutes
   stay in the fixture as the historical record they are, and are reported here rather than
   silently ignored. */
for (const id of ["x90-v1", "x90-v2"]) {
  const live = margin(E.applyPresetSettings(opus, p(id), native));
  const wasDefault = E.DEFAULTS.kwh;
  let moved;
  try {
    E.DEFAULTS.kwh = wasDefault * 3 + 0.011;   // any value the pin must survive
    moved = margin(E.applyPresetSettings(opus, p(id), native));
  } finally { E.DEFAULTS.kwh = wasDefault; }
  assert(`T2-E3 ${id} is INVARIANT to the generic electricity default (the $0.07 pin holds, executed)`,
    live === moved, `${live} vs ${moved}`);
  console.log(`      ${id}: live ${live}; pre-move record ${before.perspectives[id].marginPct}`
    + " (moved by the 2026-09-20 fleet/coefficient repairs, not by electricity)");
}
{ /* The pin is load-bearing: a route WITHOUT it must move when the default moves, or the check
     above would pass vacuously on any route at all. */
  const unpinned = "median";
  const base = margin(E.applyPresetSettings(opus, p(unpinned), native));
  const wasDefault = E.DEFAULTS.kwh;
  let moved;
  try {
    E.DEFAULTS.kwh = wasDefault * 3 + 0.011;
    const st = E.applyPresetSettings(opus, p(unpinned), native); st.hwMode = "tco";
    moved = margin(st);
  } finally { E.DEFAULTS.kwh = wasDefault; }
  const stBase = E.applyPresetSettings(opus, p(unpinned), native); stBase.hwMode = "tco";
  assert("T2-E3 NEGATIVE CONTROL: an UNPINNED owned-TCO reading DOES move when the generic default moves",
    moved !== margin(stBase), `${moved} vs ${margin(stBase)} (base rent reading ${base})`);
}

/* FROM HERE ON THE HISTORICAL BUNDLE IS READ FROM PRIVATE GIT HISTORY (vetting round
   2026-09-19, Astra pack E P1-1, found a second time in the publish dry-run). `asPreT4` loads
   the pre-fold engine bytes at private commit ad7a214 with `git show`. A squashed
   one-commit-per-release mirror does not carry that object and the reconstructed publish stage
   is not a git repository at all, so every assertion below died there and took the stage's
   `npm test` — and therefore validate_stage, and therefore the whole publish — with it. The
   T2-E1..E3 assertions above need no history and stay binding in every tree.
   Same rule as everywhere else: unreachable in a PRIVATE tree is a FAILURE, because that means
   the history really did break; unreachable with no registered private input present is the
   public snapshot, and the rest of this file skips under a named banner. */
if (!preT4HistoryAvailable()) {
  if (PROVENANCE_MODE === "private") {
    console.log(`FAIL  T2-E4/E5 historical reproduction: base commit ${PRE_T4_BASE_COMMIT} is `
      + "UNREACHABLE in a PRIVATE tree — the pinned history is missing, which is a regression, never a skip");
    process.exit(1);
  }
  const rule = "=".repeat(78);
  console.log(rule);
  console.log("REDUCED MODE: private history absent, T2-E4/E5 historical reproduction skipped");
  console.log(`  The pre-move grid is pinned to private commit ${PRE_T4_BASE_COMMIT}, which a squashed`);
  console.log("  public snapshot does not carry. The T2-E1..E3 assertions above DID run and passed.");
  console.log(rule);
  console.log(failures ? `\n${failures} ELECTRICITY-DEFAULT T2 FAILURE(S)`
    : "\nELECTRICITY-DEFAULT T2: T2-E1..E3 PASS, T2-E4/E5 SKIPPED (private history absent)");
  process.exit(failures ? 1 : 0);
}

/* Every actual rent state stays byte-identical even though its inert state.kwh field changes.
   im-vet-six-repairs (2026-09-20): the historical blocks from here on run INSIDE the 2026-09-20 REGISTRY pin only
   (withPreVettingRegistry, NOT the full pre-T4 bundle — `asPreT4` already restores the pre-fold
   STATE below, and applying the state bundle twice would move the pinned traffic profiles again). `asPreT4` restores pre-fold STATE fields, which was enough while the registry itself had
   not moved; the 2026-09-20 repairs move three registry values (the TPU decode coefficient,
   gb200's price-evidence class and the declared Trainium withdrawal), so without the pin these
   "historical" grids would silently be computed on today's registry and stop being historical —
   the same defect the 2026-09-10 comment below records for Grok's tariff, one level up. */
const rentStates = withPreVettingRegistry(() => {
const rentStates = [];
for (const model of E.MODELS.filter(row => row.id !== "custom")) for (const persp of E.PERSPECTIVES) {
  const state = E.applyPresetSettings(model, persp, native);
  if (state.hwMode !== "rent") continue;
  // P1-4 intentionally rebases this one perspective onto registry sections. Keep the
  // historical electricity-move pin scoped to its original generic computation; live
  // stress composition and coverage are asserted in fleet-mode-t3.test.mjs.
  const context = E.scenarioContext(state);
  const historicalState = persp.id === "stress-public-rate" ? structuredClone(state) : state;
  /* im-release-edit-r2 (2026-09-10): the model id is passed so the pin bundle can restore a
     pre-change model TARIFF as well as the pre-fold defaults. Grok's cacheReadMult moved 25 -> 15
     under owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok, and without this the
     "historical" grid would silently be computed at today's price and stop being historical. */
  rentStates.push([model.id, persp.id,
    E.workload(asPreT4(historicalState, model.id), undefined, context).margin]);
}
return rentStates;
});
const rentHash = createHash("sha256").update(JSON.stringify(rentStates)).digest("hex");
assert("T2-E4 historical rent-basis grid is byte-identical while the commissioned stress move is tested live",
  rentStates.length === before.rentStateCount && rentHash === before.rentStatesSha256,
  JSON.stringify({ count: rentStates.length, hash: rentHash }));

const moved = [];
withPreVettingRegistry(() => {
const forcedTco = id => {
  const state = E.applyPresetSettings(opus, p(id), native); state.hwMode = "tco";
  return margin(asPreT4(state));
};
for (const id of ["median", "gptpro-r3"]) {
  const now = forcedTco(id), old = before.forcedTco[id].marginPct;
  if (now !== old) moved.push({ id: `forced-tco:${id}`, deltaPp: now - old });
  assert(`T2-E5 ${id} moved when evaluated on the generic owned-TCO default`, now < old, `${old} -> ${now}`);
  const rentState = asPreT4(E.applyPresetSettings(opus, p(id), native));
  assert(`T2-E5 ${id} primary rent reading remains byte-identical`, margin(rentState) === before.perspectives[id].marginPct);
}
{
  const traffic = E.resolveTraffic(opus, null, native);
  const state = asPreT4(structuredClone(E.DEFAULTS)); Object.assign(state, { ioRatio: traffic.ioRatio, cacheHit: traffic.cacheHit, hwMode: "tco" });
  const now = E.workload(state, undefined, E.makeScenarioContext(opus, traffic, state.customDonor)).margin * 100;
  moved.push({ id: "generic-default:opus", deltaPp: now - before.generic.marginPct });
  assert("T2-E5 generic owned-TCO default moves downward", now < before.generic.marginPct, `${before.generic.marginPct} -> ${now}`);
}
});
const maxAbsDeltaPp = Math.max(...moved.map(row => Math.abs(row.deltaPp)));
assert("T2-E5 movement characterization is bounded and non-vacuous",
  moved.length === 3 && maxAbsDeltaPp > 0 && maxAbsDeltaPp < 1,
  JSON.stringify({ moved, maxAbsDeltaPp }));

// A forged pre-move modified permalink omits kwh, resolves against the new default, and reports drift.
{
  const state = E.applyPresetSettings(opus, p("median"), native); state.hwMode = "tco";
  const traffic = E.resolveTraffic(opus, p("median"), native);
  let token = E.encodeScenario(state, opus.id, "__modified", traffic, "pre-move TCO",
    { fleet: "custom", totalCase: "custom" });
  const [schema, payload] = token.split(".");
  const raw = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
  delete raw.kwh; raw._meta.epoch = "v23r499"; raw._meta.displayedMargin = before.forcedTco.median.marginPct;
  token = schema + "." + Buffer.from(JSON.stringify(raw), "utf8").toString("base64");
  const decoded = E.decodeScenario(token); const meta = decoded._meta; delete decoded._meta;
  const restored = E.restoreModifiedLinkState(decoded, traffic, opus);
  const note = E.marginDriftNote(meta.displayedMargin, margin(restored));
  assert("T2-E6 a pre-move TCO permalink produces a real, non-silent drift note",
    meta.epoch !== E.DEFAULTS_EPOCH && note && note.text.includes("originally shared"), JSON.stringify({ meta, note }));
}

console.log("T2-E CHARACTERIZATION " + JSON.stringify({ moved, maxAbsDeltaPp }));
console.log(failures ? `\n${failures} ELECTRICITY-DEFAULT T2 FAILURE(S)` : "\nALL ELECTRICITY-DEFAULT T2 TESTS PASS");
process.exit(failures ? 1 : 0);
