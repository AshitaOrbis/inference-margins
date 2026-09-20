/* im-arc T4 fold (2026-08-24) — the registry SCHEMA gate.
   Spec: research/im-arc-t4-fold-memo.md §0.1 (closed `basis` enum + orthogonal
   `observationKind`), §1.1 (the mixed-aggregate non-allocation invariants), §7.

   This file is the enforcement receipt for the one schema shared by UI, engine and MCP
   (T2 memo §1.1). It does NOT re-assert the T2 registry content gate (tests/dc-registry-t2.test.mjs
   owns that); it asserts that the validator BITES — every negative control below is a mutation of
   the live registry that the validator must refuse. A validator that has never been made to fail
   is not evidence (redaction-gate doctrine).
   Run: node tests/dc-registry-schema-t4.test.mjs */
import { existsSync, readFileSync } from "node:fs";
import { provenance, CITED_PRIVATE_SOURCES } from "./provenance-inputs.mjs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const D = require("../site/engine-data-dc-v1.js");

let failures = 0;
function assert(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : " — " + detail}`);
  if (!cond) failures++;
}
/* Every mutation runs against a deep, unfrozen copy: the live registry is deep-frozen, so a
   negative control that silently failed to mutate would make this whole file vacuous. */
const thaw = value => JSON.parse(JSON.stringify(value));
const liveCopy = () => thaw({ REGIONS: D.REGIONS, DATACENTERS: D.DATACENTERS,
  PROGRAMMES: D.PROGRAMMES, RENT_QUOTES: D.RENT_QUOTES, RENT_POLICY: D.RENT_POLICY,
  COVERAGE_LEDGER: D.COVERAGE_LEDGER });

const refuses = (name, mutate, needle) => {
  const registry = liveCopy();
  const before = JSON.stringify(registry);
  mutate(registry);
  const mutated = JSON.stringify(registry) !== before;
  const result = D.validateDcRegistry(registry);
  assert(`T4-SCHEMA ${name}`, mutated && result.ok === false
    && result.errors.some(error => error.includes(needle)),
    JSON.stringify({ mutated, ok: result.ok, errors: result.errors.slice(0, 4) }));
};

/* ---------- 0. the enums are closed, exported, and frozen ---------- */
assert("T4-SCHEMA-0 the schema module exports a validator and the closed enums",
  typeof D.validateDcRegistry === "function" && D.DC_SCHEMA && Object.isFrozen(D.DC_SCHEMA));
assert("T4-SCHEMA-0 `basis` is exactly the five closed values (memo §0.1)",
  D.DC_SCHEMA && JSON.stringify(D.DC_SCHEMA.BASIS) === JSON.stringify([
    "disclosed tariff", "disclosed installed count", "measured/credibly-reported",
    "analyst-set", "provisional"]),
  JSON.stringify(D.DC_SCHEMA && D.DC_SCHEMA.BASIS));
assert("T4-SCHEMA-0 `observationKind` is exactly the nine closed values (memo §0.1)",
  D.DC_SCHEMA && JSON.stringify(D.DC_SCHEMA.OBSERVATION_KINDS) === JSON.stringify([
    "point", "selected-span", "floor", "ceiling", "milestone",
    "load-state-average-peak", "mixed-installed-aggregate", "region-fill",
    "tariff-derived-delivered"]),
  JSON.stringify(D.DC_SCHEMA && D.DC_SCHEMA.OBSERVATION_KINDS));
assert("T4-SCHEMA-0 point-kinds and span-kinds partition the observation kinds",
  D.DC_SCHEMA && D.DC_SCHEMA.POINT_OBSERVATION_KINDS.every(kind => D.DC_SCHEMA.OBSERVATION_KINDS.includes(kind))
    && D.DC_SCHEMA.SPAN_OBSERVATION_KINDS.every(kind => D.DC_SCHEMA.OBSERVATION_KINDS.includes(kind))
    && D.DC_SCHEMA.POINT_OBSERVATION_KINDS.every(kind => !D.DC_SCHEMA.SPAN_OBSERVATION_KINDS.includes(kind))
    && JSON.stringify(D.DC_SCHEMA.SPAN_OBSERVATION_KINDS)
      === JSON.stringify(["selected-span", "load-state-average-peak", "tariff-derived-delivered"]));
assert("T4-SCHEMA-0 the four facility classes and three capex scopes are closed (memo §2)",
  D.DC_SCHEMA && JSON.stringify(D.DC_SCHEMA.FACILITY_CLASSES)
      === JSON.stringify(["hyperscaler-owned", "purpose-built-ai", "neocloud", "legacy"])
    && JSON.stringify(D.DC_SCHEMA.CAPEX_SCOPES)
      === JSON.stringify(["bare-card", "base-rack", "installed-system"]));

/* ---------- 1. the live registry validates ---------- */
{
  const result = D.validateDcRegistry(liveCopy());
  assert("T4-SCHEMA-1 the shipped registry passes its own validator", result.ok === true,
    JSON.stringify(result.errors));
}
assert("T4-SCHEMA-1 no ad-hoc `basis` string survives the migration (memo §0.1)",
  JSON.stringify({ D: D.DATACENTERS, P: D.PROGRAMMES, R: D.REGIONS, Q: D.RENT_QUOTES, L: D.RENT_POLICY })
    .match(/"basis":"[^"]+"/g)
    .every(hit => D.DC_SCHEMA.BASIS.includes(hit.slice(9, -1))),
  JSON.stringify([...new Set((JSON.stringify({ D: D.DATACENTERS, P: D.PROGRAMMES, R: D.REGIONS,
    Q: D.RENT_QUOTES, L: D.RENT_POLICY }).match(/"basis":"[^"]+"/g) || []))]));

/* ---------- 2. negative controls — the validator must BITE ---------- */
refuses("refuses a basis outside the closed enum",
  registry => { registry.REGIONS["us-industrial"].basis = "disclosed system topology"; },
  "basis");
refuses("refuses a facility accelerator basis outside the closed enum",
  registry => { registry.DATACENTERS["xai-colossus-ii"].accelerators[0].basis = "DERIVED"; },
  "basis");
refuses("refuses a triple with no observationKind",
  registry => { delete registry.REGIONS["cn-coastal"].observationKind; },
  "observationKind");
refuses("refuses an observationKind outside the closed enum",
  registry => { registry.REGIONS["cn-coastal"].observationKind = "energy-component comparator"; },
  "observationKind");
refuses("refuses a point-kind triple with lo !== hi (the pseudo-range ban)",
  registry => { registry.DATACENTERS["xai-colossus-c1"].electricity.usdPerKwh.hi = 0.09; },
  "point");
refuses("refuses a programme milestone encoded as a pseudo-range",
  registry => {
    const row = registry.PROGRAMMES["anthropic-rainier-trainium"];
    row.accelerators[0].count = { lo: 500000, mid: 500000, hi: 1000000 };
  },
  "point");
refuses("refuses a selected span with lo > hi",
  registry => { registry.REGIONS["us-industrial"].usdPerKwh = { lo: 0.2, mid: 0.0871, hi: 0.1053 }; },
  "ordered");
refuses("refuses a mixedAggregate that also carries per-SKU accelerator counts",
  registry => {
    registry.DATACENTERS["xai-colossus-c1"].accelerators = [{ hwKey: "h100",
      count: { lo: 150000, mid: 150000, hi: 150000 }, basis: "analyst-set",
      observationKind: "point", source: "fabricated split", asOf: "2026-05-08" }];
  },
  "mixedAggregate");
refuses("refuses a mixedAggregate whose allocation claims a per-SKU split",
  registry => { registry.DATACENTERS["xai-colossus-c1"].mixedAggregate.allocation = "per-sku"; },
  "allocation");
refuses("refuses a mixedAggregate that names a hardware key (per-SKU arithmetic hook)",
  registry => { registry.DATACENTERS["xai-colossus-c1"].mixedAggregate.hwKey = "h100"; },
  "mixedAggregate");
refuses("refuses a mixedAggregate with an empty hwKeysPresent list",
  registry => { registry.DATACENTERS["xai-colossus-c1"].mixedAggregate.hwKeysPresent = []; },
  "hwKeysPresent");
refuses("refuses a mixed-installed-aggregate kind used outside a mixedAggregate object",
  registry => { registry.DATACENTERS["xai-colossus-ii"].accelerators[0].observationKind = "mixed-installed-aggregate"; },
  "mixed-installed-aggregate");
refuses("refuses a load-state-average-peak whose middle is not the average load state",
  registry => {
    const row = registry.PROGRAMMES["deepseek-h800-serving-2025"];
    row.accelerators[0].count = { lo: 1814, mid: 2000, hi: 2224 };
  },
  "load-state-average-peak");
refuses("refuses a facilityClass outside the four closed classes",
  registry => { registry.DATACENTERS["xai-colossus-c1"].facilityClass = "colocation"; },
  "facilityClass");
refuses("refuses a PUE class band written into a facility row as though measured (memo §2)",
  registry => { registry.DATACENTERS["xai-colossus-c1"].pue = { lo: 1.10, mid: 1.20, hi: 1.30 }; },
  "pue");
refuses("refuses a rent quote whose rateClass is outside the closed class list",
  registry => { Object.values(registry.RENT_QUOTES)[0].rateClass = "spot"; },
  "rateClass");
refuses("refuses a rent quote whose capexScope-free hardware default names an unknown quote id",
  registry => { registry.RENT_POLICY.defaultRateId.h100 = "no-such-quote"; },
  "defaultRateId");
refuses("refuses a planningPolicy outside the closed policy list",
  registry => { registry.RENT_POLICY.planningPolicy = "cheapest"; },
  "planningPolicy");

/* ---------- 3. the reader-entered capex scope is REQUIRED, not assumed ---------- */
assert("T4-SCHEMA-3 the capex-scope overhead table covers exactly the three scopes and is closed",
  D.DC_SCHEMA && JSON.stringify(Object.keys(D.DC_SCHEMA.CLUSTER_OH_BY_CAPEX_SCOPE).sort())
    === JSON.stringify([...D.DC_SCHEMA.CAPEX_SCOPES].sort())
    && D.DC_SCHEMA.CLUSTER_OH_BY_CAPEX_SCOPE["installed-system"].lo === 1
    && D.DC_SCHEMA.CLUSTER_OH_BY_CAPEX_SCOPE["installed-system"].hi === 1,
  JSON.stringify(D.DC_SCHEMA && D.DC_SCHEMA.CLUSTER_OH_BY_CAPEX_SCOPE));
assert("T4-SCHEMA-3 the four PUE class bands exist and include the purpose-built-AI class [F4]",
  D.DC_SCHEMA && JSON.stringify(Object.keys(D.DC_SCHEMA.PUE_CLASS_BANDS).sort())
    === JSON.stringify([...D.DC_SCHEMA.FACILITY_CLASSES].sort())
    && D.DC_SCHEMA.PUE_CLASS_BANDS["purpose-built-ai"].mid === 1.20
    && D.DC_SCHEMA.PUE_CLASS_BANDS.neocloud.mid === 1.25,
  JSON.stringify(D.DC_SCHEMA && D.DC_SCHEMA.PUE_CLASS_BANDS));

/* ---------------------------------------------------------------------------------------
   im-arc T4 fold, relaunch r2 (2026-08-25) — NEEDLE COMPLETENESS OVER NESTED SOURCED OBJECTS.

   T2-DC-5 in tests/dc-registry-t2.test.mjs resolves the needle on every REGION, DATACENTER and
   PROGRAMME **row**, and rows were the whole registry when it was written. The fold then added
   sourced objects one level down — mixedAggregate, servingEvidence[], milestones[],
   provisionalObservations[], impliedAllInRate, the per-row electricity object — and the gate did
   not grow with them, so a fold-added figure could enter a row behind a needle that resolves
   nowhere. One had: REGIONS["cn-western"].provisionalObservations[0] carried the needle "0.30"
   against a file whose text writes that price as "0.3" and never as "0.30". It was invisible
   because the only check that looks at needles never descended into the array.

   The doctrine is "a figure without a sourceFile + sourceNeedle that resolves does not enter a
   row" (primer; memo §1), and it says nothing about nesting depth. So this walks the WHOLE
   registry and resolves every needle it finds, wherever it sits. */
{
  const seen = [];
  const walk = (node, path) => {
    if (!node || typeof node !== "object") return;
    if (typeof node.sourceFile === "string" && typeof node.sourceNeedle === "string")
      seen.push({ path, file: node.sourceFile, needle: node.sourceNeedle });
    for (const [key, value] of Object.entries(node))
      if (value && typeof value === "object") walk(value, path + "." + key);
  };
  for (const [name, branch] of Object.entries(D)) walk(branch, name);

  const resolves = ({ file, needle }) => {
    const url = new URL("../" + file, import.meta.url);
    return existsSync(url) && readFileSync(url, "utf8").includes(needle);
  };
  /* Ten of the cited sources are im-arc working dives that publish.sh deliberately does not
     ship, so on the reconstructed public stage 35 of these 40 needles could not resolve and
     the suite failed — blocking validate_stage and therefore every refresh of the public
     mirror (vetting round 2026-09-19, Astra pack E). Those ten are registered private inputs:
     binding here, skipped by count where the file is absent by design. A needle whose source
     IS published must still resolve in either tree, which is where the non-vacuity checks
     below get their teeth. */
  const provNeedles = provenance("dc-registry-schema-t4", assert);
  const checkable = seen.filter((row) => !CITED_PRIVATE_SOURCES.has(row.file) || provNeedles.has(row.file));
  provNeedles.skip(seen.length - checkable.length, "research/dives/im-arc (registered private sources)");
  const unresolved = checkable.filter((row) => !resolves(row));
  provNeedles.assert("T4-SCHEMA-NEEDLE every sourced object in the registry — at ANY depth — resolves its needle",
    unresolved.length === 0,
    JSON.stringify(unresolved.map((row) => row.path + " :: " + row.file + " :: " + row.needle)));
  provNeedles.summary();
  /* Non-vacuity twice over: the walk must actually reach past the row level, and it must reject
     a needle that is not there. A depth-blind or always-true version of this check would have let
     the defect above through exactly as T2-DC-5 did. */
  assert("T4-SCHEMA-NEEDLE the walk descends past the row level (nested sourced objects are reached)",
    seen.some((row) => row.path.split(".").length > 3), seen.length + " needles, all shallow");
  assert("T4-SCHEMA-NEEDLE the check is non-vacuous: a needle absent from its file IS caught",
    /* The control must use a source THIS TREE CAN OPEN (Astra pack D round 3). It used
       `seen[0]`, whose file is one of the private im-arc dives — absent from the public
       snapshot, where `resolves()` then returns false for the trivial reason that the file is
       missing, and the control passed while proving nothing. `checkable[0]` is a source the
       running tree actually has, in either tree. */
    !resolves({ file: checkable[0].file, needle: checkable[0].needle + "\u0000not-in-any-file" }),
    "the resolver accepts a needle that cannot be present");
  assert("T4-SCHEMA-NEEDLE ...and the control's own source IS readable here (so it is not vacuous)",
    resolves(checkable[0]), checkable[0] && checkable[0].file);
  console.log("NEEDLE INVENTORY: " + seen.length + " sourced objects, " + checkable.length
    + " checkable here, " + unresolved.length + " unresolved");
}

console.log(failures ? `\n${failures} DC-REGISTRY SCHEMA T4 FAILURE(S)` : "\nALL DC-REGISTRY SCHEMA T4 TESTS PASS");
process.exit(failures ? 1 : 0);
