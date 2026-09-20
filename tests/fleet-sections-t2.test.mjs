/* im-arc T2 — executable section-composition contract.
   Spec: research/im-arc-t2-sections-memo.md §§1–3, §8 (2026-08-22). */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const ED = require("../site/engine-data-v22.js");
const CF = require("../site/custom-fleets.js");

let failures = 0;
function assert(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : " — " + detail}`);
  if (!cond) failures++;
}
function close(a, b, eps = 1e-12) { return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= eps; }
function containsNaN(value, seen = new Set()) {
  if (typeof value === "number") return Number.isNaN(value);
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  return Object.values(value).some(item => containsNaN(item, seen));
}
function throws(name, fn, pattern) {
  let error = null;
  try { fn(); } catch (caught) { error = caught; }
  assert(name, !!error && (!pattern || pattern.test(String(error.message))), String(error && error.message));
}

const opus = E.MODELS.find((m) => m.id === "opus");
const median = E.PERSPECTIVES.find((p) => p.id === "median");
function state() { return E.pinReferenceLevers(E.applyPresetSettings(opus, median, { mode: "native" })); }
function context(s) { return E.makeScenarioContext(opus, E.resolveTraffic(opus, median, { mode: "native" }), s.customDonor); }
function leg(donorKey = "h800", sharePct = 100, overrides = {}) {
  return { donorKey, label: `${donorKey} leg`, sharePct, overrides, family: CF.donorFamily(donorKey) };
}
function section(id, sharePct, basis, extra = {}) {
  return {
    id, label: extra.label || id, sharePct, basis,
    rent: extra.rent ?? null,
    electricity: extra.electricity ?? null,
    pue: extra.pue ?? null,
    tco: extra.tco ?? null,
    dcRef: extra.dcRef ?? null,
    provenance: extra.provenance ?? null,
    legs: extra.legs || [leg()],
  };
}
function fleet(sections, id = "cf:t2fleet") {
  return { id, name: "T2 sections", epoch: E.DEFAULTS_EPOCH, clonedFrom: null, sections };
}
function costs(def, s = state()) {
  return E.blendedCosts(s, undefined, context(s), { customFleet: def });
}

/* FIRST by design (Pro fold H): same accelerator, two owned sections, different
   electricity. This is the architectural claim M-D must prove before the row field can close. */
{
  const low = section("s1", 40, "owned-strategic-tco", { electricity: { usdPerKwh: 0.04 } });
  const high = section("s2", 60, "owned-strategic-tco", { electricity: { usdPerKwh: 0.20 } });
  let mixed, lowOnly, highOnly, error;
  try {
    mixed = costs(fleet([low, high]));
    lowOnly = costs(fleet([{ ...low, sharePct: 100 }], "cf:t2low01"));
    highOnly = costs(fleet([{ ...high, sharePct: 100 }], "cf:t2high1"));
  } catch (caught) { error = caught; }
  assert("T2-1 FIRST: same accelerator at two section electricity prices composes exactly",
    !error && highOnly.cOut > lowOnly.cOut
      && close(mixed.cIn, 0.4 * lowOnly.cIn + 0.6 * highOnly.cIn)
      && close(mixed.cOut, 0.4 * lowOnly.cOut + 0.6 * highOnly.cOut),
    error ? String(error.message) : JSON.stringify({ mixed, lowOnly, highOnly }));
  assert("T2-1 composition is typed mixed-section metadata, never a collapsed label",
    mixed && mixed.procurementBasis === "owned-strategic-tco"
      && Array.isArray(mixed.composition) && mixed.composition.length === 2
      && mixed.composition.every((row) => row.basis === "owned-strategic-tco"
        && row.costBasisUsed === "tco" && row.hourlyCostFrom === "tco"
        && row.electricitySource === "override"), JSON.stringify(mixed && mixed.composition));
}

/* I-4: row hook is provenance compatibility only; it prices nothing. */
{
  const def = fleet([section("s1", 100, "owned-strategic-tco", { electricity: { usdPerKwh: 0.11 } })]);
  const before = costs(def);
  const prior = ED.HW_ROOFLINE.h800.kwhPerKwh;
  ED.HW_ROOFLINE.h800.kwhPerKwh = 0.30;
  const after = costs(def);
  ED.HW_ROOFLINE.h800.kwhPerKwh = prior;
  assert("T2-2 synthetic non-null hardware-row kwhPerKwh prices nothing",
    before.cIn === after.cIn && before.cOut === after.cOut);
}

/* The same electricity variation is inert under rent. */
{
  const a = section("s1", 50, "committed-planning-rent", {
    rent: { mode: "flat", usdPerHr: 2 }, electricity: { usdPerKwh: 0.04 },
  });
  const b = section("s2", 50, "committed-planning-rent", {
    rent: { mode: "flat", usdPerHr: 2 }, electricity: { usdPerKwh: 0.20 },
  });
  const split = costs(fleet([a, b]));
  const one = costs(fleet([{ ...a, sharePct: 100 }], "cf:t2rent1"));
  assert("T2-3 section electricity leaves rent-basis prices byte-identical",
    split.cIn === one.cIn && split.cOut === one.cOut
      && split.composition.every((row) => row.electricitySource === "embedded-in-rent"));
}

/* A physical leg override is the most local assertion and wins inside its section. */
{
  const overridden = section("s1", 100, "owned-strategic-tco", {
    electricity: { usdPerKwh: 0.04 },
    legs: [leg("h800", 100, { kwhPerKwh: 0.20 })],
  });
  const sectionPoint = section("s1", 100, "owned-strategic-tco", {
    electricity: { usdPerKwh: 0.20 },
  });
  const local = costs(fleet([overridden], "cf:t2local"));
  const expected = costs(fleet([sectionPoint], "cf:t2point"));
  assert("T2-3 leg electricity override wins within its section",
    local.cIn === expected.cIn && local.cOut === expected.cOut
      && local.composition[0].electricitySource === "override",
    JSON.stringify({ local, expected }));
}

/* im-arc T2 fix (Sol review 2026-08-23, finding P1-5): electricity
   receipts distinguish a registry value, an explicit override, and mixed legs. */
{
  const regionOnly = fleet([section("s1", 100, "owned-strategic-tco", {
    electricity: { regionRef: "us-industrial" },
    provenance: "Registry region selected for this test.",
  })], "cf:t2reg01");
  const explicit = fleet([section("s1", 100, "owned-strategic-tco", {
    electricity: { usdPerKwh: 0.02, regionRef: "us-industrial" },
    provenance: "Explicit override with region as informational context.",
  })], "cf:t2ovr01");
  const mixedLegs = fleet([section("s1", 100, "owned-strategic-tco", {
    electricity: { regionRef: "us-industrial" },
    provenance: "Per-leg electricity override receipt probe.",
    legs: [leg("h800", 50, { kwhPerKwh: 0.08 }), leg("h100", 50, { kwhPerKwh: 0.20 })],
  })], "cf:t2mixel");
  const regionValidation = CF.validateCustomFleet(regionOnly);
  const overrideValidation = CF.validateCustomFleet(explicit);
  const regionCost = costs(regionOnly);
  const overrideCost = costs(explicit);
  const mixedReceipt = costs(mixedLegs).composition[0];
  assert("T2-FIX-P1-5 electricitySource is honest for regions, overrides, and per-leg mixes",
    regionValidation.ok && overrideValidation.ok
      && regionCost.composition[0].electricitySource === "region:us-industrial"
      && overrideCost.composition[0].electricitySource === "override"
      && overrideCost.cOut < regionCost.cOut
      && mixedReceipt.electricitySource === "mixed",
    JSON.stringify({ regionValidation, overrideValidation, region: regionCost.composition,
      override: overrideCost.composition, mixedReceipt }));
}

/* M-C: one explicit rented section + one explicit owned section. */
{
  const rented = section("s1", 60, "committed-planning-rent", { rent: { mode: "flat", usdPerHr: 2.4 } });
  const owned = section("s2", 40, "owned-strategic-tco", { electricity: { usdPerKwh: 0.10 } });
  const mixed = costs(fleet([rented, owned]));
  const rentOnly = costs(fleet([{ ...rented, sharePct: 100 }], "cf:t2ro001"));
  const ownOnly = costs(fleet([{ ...owned, sharePct: 100 }], "cf:t2oo001"));
  assert("T2-4 a 60/40 rented/owned fleet equals its two independent section runs",
    close(mixed.cIn, 0.6 * rentOnly.cIn + 0.4 * ownOnly.cIn)
      && close(mixed.cOut, 0.6 * rentOnly.cOut + 0.4 * ownOnly.cOut));
  assert("T2-4 cross-section basis is explicitly typed mixed",
    mixed.procurementBasis === "mixed"
      && mixed.bases.length === 2
      && mixed.composition.map((x) => x.costBasisUsed).join(",") === "rent,tco",
    JSON.stringify({ basis: mixed.procurementBasis, bases: mixed.bases, composition: mixed.composition }));
  const wl = E.workload(state(), undefined, context(state()), { customFleet: fleet([rented, owned]) });
  assert("T2-4 workload carries the complete composition contract", wl.procurementBasis === "mixed"
    && wl.composition.length === 2 && wl.bases.length === 2);
}

/* im-arc T2 fix (Sol review 2026-08-23, finding P1-1): every T1
   counterfactual consumer must reprice the complete section composition. */
{
  const rented = section("s1", 60, "committed-planning-rent", {
    rent: { mode: "flat", usdPerHr: 2.4 },
  });
  const owned = section("s2", 40, "owned-strategic-tco", {
    electricity: { usdPerKwh: 0.10 },
  });
  const def = fleet([rented, owned], "cf:t2all1");
  const s = state();
  const mixed = E.workload(s, undefined, context(s), { customFleet: def });
  const allTcoExpectedDef = fleet([rented, owned].map(row => ({
    ...structuredClone(row), basis: "owned-strategic-tco",
  })), "cf:t2atco");
  const allRentExpectedDef = fleet([rented, owned].map(row => ({
    ...structuredClone(row), basis: row.rent && row.rent.mode === "registered"
      ? E.legProcurementBasis(row.legs[0].donorKey, s)
      : "committed-planning-rent",
  })), "cf:t2arent");
  const expectedTco = E.workload(s, undefined, context(s), { customFleet: allTcoExpectedDef });
  const expectedRent = E.workload(s, undefined, context(s), { customFleet: allRentExpectedDef });
  const actualTco = E.marginOnBasis(s, "tco", { customFleet: def });
  const actualRent = E.marginOnBasis(s, "rent", { customFleet: def });
  const spread = E.blendedLessorSpread(s, { customFleet: def });
  const stack = E.stackRowsFor(s, true, context(s), { customFleet: def });
  const h800 = stack.find(row => row.k === "h800");
  assert("T2-FIX-P1-1 all-owned/all-rented reprices every section and every T1 receipt",
    !close(actualTco.margin, mixed.margin) && !close(actualRent.margin, mixed.margin)
      && !close(actualTco.margin, actualRent.margin)
      && close(actualTco.margin, expectedTco.margin) && close(actualRent.margin, expectedRent.margin)
      && close(spread.tcoCostPerMtok, expectedTco.costMix)
      && close(spread.rentCostPerMtok, expectedRent.costMix)
      && Number.isFinite(spread.ratio) && !close(spread.ratio, 1)
      && h800 && close(h800.total, expectedRent.costMix)
      && close(h800.rentResult.margin, expectedRent.margin)
      && close(h800.tcoResult.margin, expectedTco.margin)
      && Number.isFinite(h800.rentHr) && Number.isFinite(h800.tcoHr)
      && close(Object.values(h800.tcoComponents).reduce((sum, value) => sum + value, 0), expectedTco.costMix),
    JSON.stringify({ mixed: mixed.margin, actualTco: actualTco.margin, expectedTco: expectedTco.margin,
      actualRent: actualRent.margin, expectedRent: expectedRent.margin, spread, h800 }));
}

/* im-arc T2 fix-2 R1: hypothetical donors absent from a by-hardware
   section map use the generic registry-planning resolution path, while a
   section-stated donor price remains more specific. */
{
  const def = fleet([section("s1", 100, "committed-planning-rent", {
    rent: { mode: "byHw", usdPerHrByHw: { h800: 1.75 } },
    legs: [leg("h800", 100)],
  })], "cf:t2fx2r1");
  const s = state();
  s.rentMult = 1.25;
  s.rentMultLeg = { h100: 0.8 };
  s.rentMultFam = { nvidia: 1.1 };
  const rows = E.stackRowsFor(s, true, context(s), { customFleet: def });
  const h800 = rows.find(row => row.k === "h800");
  const h100 = rows.find(row => row.k === "h100");
  const h200 = rows.find(row => row.k === "h200");
  const fallbackSource = donor => "registry-planning-rate (hypothetical donor; section price map does not carry "
    + donor + ")";
  /* im-arc T4 fold (2026-08-24), memo §4: the hypothetical-donor FALLBACK PATH is unchanged and
     is still what this asserts — an absent donor falls through to the generic registry-planning
     resolution and says so on its receipt. What changed is that three donors (gb200, gb300,
     trn3) have no admissible public planning rate to fall through TO, so for them the shared
     resolver returns the honest unavailable answer instead of a number. Those rows are held to
     their own invariant below: unavailable, with a stated reason, never a silent NaN and never a
     fabricated rate. */
  /* im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok:
     the three donors now carry adopted planning quotes, so the unpriced set is EMPTY. The check
     below keeps both halves — priced rows are finite and carry receipts, unpriced rows refuse with
     a reason — because the second half is what makes the first mean anything, and it must still
     hold the day a donor loses its rate again. Derived from the policy rather than listed, so it
     cannot go stale a third time. */
  const unpricedDonors = E.HW_ORDER.filter(k => !Number.isFinite(E.HW[k] && E.HW[k].rent));
  const pricedRows = rows.filter(row => !unpricedDonors.includes(row.k));
  const unpricedRows = rows.filter(row => unpricedDonors.includes(row.k));
  assert("T2-FIX2-R1 byHw hypothetical donors with a registered rate are finite and carry fallback receipts",
    rows.length === E.HW_ORDER.length && unpricedRows.length === unpricedDonors.length
      && pricedRows.every(row => row.renderable && !containsNaN(row)
        && [row.total, row.rentMinusTco, row.rentHr, row.tcoHr,
          row.rentResult.margin, row.tcoResult.margin].every(Number.isFinite))
      && pricedRows.filter(row => row.k !== "h800").every(row => row.rent
        && row.rent.source === fallbackSource(row.k))
      && h800 && h800.rent && h800.rent.source !== fallbackSource("h800")
      && close(h100.rentHr, E.HW.h100.rent * 1.25 * 0.8)
      && close(h200.rentHr, E.HW.h200.rent * 1.25 * 1.1),
    JSON.stringify(rows.map(row => ({ k: row.k, renderable: row.renderable,
      total: row.total, rentHr: row.rentHr, rent: row.rent }))));
  assert("T2-FIX2-R1 a hypothetical donor with NO admissible planning quote is unavailable, with a reason",
    unpricedRows.every(row => row.renderable === false && row.rent && row.rent.unavailable === true
      && typeof row.rent.reason === "string" && row.rent.reason.length > 20
      && row.rent.value === null),
    JSON.stringify(unpricedRows.map(row => ({ k: row.k, renderable: row.renderable, rent: row.rent }))));

  const absolute = state();
  absolute.rentAbsAll = 9;
  const absoluteRows = E.stackRowsFor(absolute, true, context(absolute), { customFleet: def });
  const mapRow = absoluteRows.find(row => row.k === "h800");
  const fallbackRow = absoluteRows.find(row => row.k === "h100");
  assert("T2-FIX2-R1 section byHw map wins over the hypothetical planning fallback",
    mapRow && close(mapRow.rentHr, 1.75)
      && mapRow.rent && mapRow.rent.source !== fallbackSource("h800")
      && fallbackRow && close(fallbackRow.rentHr, 9)
      && fallbackRow.rent && fallbackRow.rent.source === fallbackSource("h100"),
    JSON.stringify({ map: mapRow && { k: mapRow.k, renderable: mapRow.renderable,
      rentHr: mapRow.rentHr, rent: mapRow.rent }, fallback: fallbackRow && {
      k: fallbackRow.k, renderable: fallbackRow.renderable,
      rentHr: fallbackRow.rentHr, rent: fallbackRow.rent } }));

  const priorRent = E.HW.h100.rent;
  let unavailable;
  try {
    E.HW.h100.rent = NaN;
    unavailable = E.stackRowsFor(state(), true, context(state()), { customFleet: def })
      .find(row => row.k === "h100");
  } finally {
    E.HW.h100.rent = priorRent;
  }
  assert("T2-FIX2-R1 missing hypothetical planning rate returns an honest unavailable row without NaN",
    unavailable && unavailable.renderable === false && !containsNaN(unavailable)
      && unavailable.total === null && unavailable.rentMinusTco === null
      && unavailable.rentHr === null && unavailable.rentResult === null
      && unavailable.rent && unavailable.rent.source === fallbackSource("h100")
      && typeof unavailable.reason === "string"
      && /planning rent|planning rate/i.test(unavailable.reason) && /h100/i.test(unavailable.reason),
    JSON.stringify(unavailable && { k: unavailable.k, renderable: unavailable.renderable,
      total: unavailable.total, rentMinusTco: unavailable.rentMinusTco,
      rentHr: unavailable.rentHr, rentResult: unavailable.rentResult,
      rent: unavailable.rent, reason: unavailable.reason,
      containsNaN: containsNaN(unavailable) }));

  const app = readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
  const mcpEngine = readFileSync(new URL("../mcp-server/src/engine.ts", import.meta.url), "utf8");
  assert("T2-FIX2-R1 UI and MCP consume the engine-owned rent receipt and unavailable reason",
    app.includes("row.rent && row.rent.source")
      && app.includes("row.reason || appNoNumberReason(row.result)")
      && app.includes('return /planning rent|planning rate/i.test(reason)')
      && mcpEngine.includes('require("../../site/engine.js")'),
    JSON.stringify({ appConsumesRentSource: app.includes("row.rent && row.rent.source"),
      appConsumesReason: app.includes("row.reason || appNoNumberReason(row.result)"),
      appLabelsPlanningUnavailable: app.includes('return /planning rent|planning rate/i.test(reason)'),
      mcpImportsEngine: mcpEngine.includes('require("../../site/engine.js")') }));
}

/* I-1: the named/non-custom path is exactly one effective section and keeps the reference. */
{
  const s = state();
  let sections, wl, error;
  try { sections = E.resolveFleetSections(s); wl = E.workload(s, undefined, context(s)); } catch (caught) { error = caught; }
  assert("T2-5 named fleets resolve as one effective section", !error && sections.length === 1
    && sections[0].section.basis === "committed-planning-rent" && sections[0].section.basis !== "inherit",
    error ? error.message : JSON.stringify(sections));
  assert("T2-5 reference one-section identity remains bit-exact", wl && wl.margin === 0.5843046405779231, String(wl && wl.margin));
  assert("T2-5 every ordinary mix carries one typed composition entry",
    wl && wl.composition.length === 1 && !JSON.stringify(wl.composition).includes("inherit"));
}

/* Legacy v1 flat fleets normalize to one migration-only inherit section, while runtime is effective. */
{
  const legacy = { id: "cf:legacy1", name: "Legacy", epoch: E.DEFAULTS_EPOCH, clonedFrom: null,
    legs: [{ donorKey: "h800", label: "old", sharePct: 100, overrides: { kwhPerKwh: 0.12 },
      basisDeclared: "owned-strategic-tco", family: "nvidia" }] };
  const v = CF.validateCustomFleet(legacy, { requireId: true });
  assert("T2-6 legacy v1 validates through a one-section loader shim", v.ok && v.fleet.sections.length === 1
    && v.fleet.sections[0].basis === "inherit" && !("basisDeclared" in v.fleet.sections[0].legs[0]),
    JSON.stringify(v));
  const resolved = v.ok ? E.resolveFleetSections(state(), { customFleet: v.fleet }) : [];
  assert("T2-6 inherit never escapes runtime resolution", resolved.length === 1
    && resolved[0].section.basis === "committed-planning-rent"
    && !JSON.stringify(resolved).includes("inherit"), JSON.stringify(resolved));
}

/* Closed schema and promoted guards. */
{
  const good = fleet([section("s1", 100, "owned-strategic-tco", { electricity: { usdPerKwh: { lo: 0.06, mid: 0.09, hi: 0.12 } } })]);
  assert("T2-7 section schema accepts bounded triples", CF.validateCustomFleet(good).ok);
  const badOrder = structuredClone(good); badOrder.sections[0].electricity.usdPerKwh = { lo: 0.10, mid: 0.09, hi: 0.12 };
  assert("T2-7 section schema rejects unordered triples", !CF.validateCustomFleet(badOrder).ok);
  const badKey = structuredClone(good); badKey.sections[0].electricity.sneaky = 1;
  assert("T2-7 section schema rejects unknown nested keys", !CF.validateCustomFleet(badKey).ok);
  const badDc = structuredClone(good); badDc.sections[0].dcRef = "not-a-dc";
  assert("T2-7 section schema rejects unknown dcRef", !CF.validateCustomFleet(badDc).ok);
  throws("T2-7 promoted guard rejects an unresolved inherit section",
    () => E.assertSectionsTyped([{ id: "s1", basis: "inherit" }]), /inherit|effective basis/i);
  throws("T2-7 promoted guard rejects a leg declaration contradicting its section",
    () => E.assertUniformProcurementBasis([{ k: "h800", leg: { basisDeclared: "owned-strategic-tco" } }], state(),
      { id: "s1", basis: "committed-planning-rent" }), /contradict|basis/i);
  /* im-arc T2 fix (Sol review 2026-08-23, finding P2-1): exercise the
     production resolver, which must guard before migration metadata deletion. */
  const contradictory = fleet([section("s1", 100, "committed-planning-rent", {
    rent: { mode: "flat", usdPerHr: 2 },
    legs: [{ ...leg("h800"), basisDeclared: "owned-strategic-tco" }],
  })], "cf:t2guard");
  throws("T2-FIX-P2-1 resolveFleetSections rejects legacy basisDeclared contradiction",
    () => E.resolveFleetSections(state(), { customFleet: contradictory }), /contradict|basis/i);

  const zeroShareContradiction = fleet([section("s1", 100, "committed-planning-rent", {
    rent: { mode: "flat", usdPerHr: 2 },
    legs: [leg("h800", 100), { ...leg("h100", 0), basisDeclared: "owned-strategic-tco" }],
  })], "cf:t2fx2z0");
  let zeroShareError = null;
  try { E.resolveFleetSections(state(), { customFleet: zeroShareContradiction }); }
  catch (caught) { zeroShareError = caught; }
  const zeroShareMessage = String(zeroShareError && zeroShareError.message);
  assert("T2-FIX2-R2 zero-share contradictory leg is rejected loudly with leg and both bases",
    !!zeroShareError && /contradict|basis/i.test(zeroShareMessage)
      && /h100/i.test(zeroShareMessage)
      && zeroShareMessage.includes("owned-strategic-tco")
      && zeroShareMessage.includes("committed-planning-rent"),
    zeroShareMessage);

  const zeroShareConsistent = structuredClone(zeroShareContradiction);
  zeroShareConsistent.id = "cf:t2fx2ok";
  zeroShareConsistent.sections[0].legs[1].basisDeclared = "committed-planning-rent";
  let consistentResolved, consistentError;
  try { consistentResolved = E.resolveFleetSections(state(), { customFleet: zeroShareConsistent }); }
  catch (caught) { consistentError = caught; }
  assert("T2-FIX2-R2 zero-share non-contradictory leg is accepted and migration metadata is removed",
    !consistentError && consistentResolved && consistentResolved.length === 1
      && consistentResolved[0].section.legs.length === 2
      && consistentResolved[0].section.legs.every(candidate => !("basisDeclared" in candidate))
      && consistentResolved[0].legs.length === 1
      && !("basisDeclared" in consistentResolved[0].legs[0].leg),
    consistentError ? String(consistentError.message) : JSON.stringify(consistentResolved));
}

/* im-arc T2 fix (Sol review 2026-08-23, finding P1-7): by-hardware
   rent maps are total over every donor actually used by the section. */
{
  const empty = fleet([section("s1", 100, "committed-planning-rent", {
    rent: { mode: "byHw", usdPerHrByHw: {} },
    legs: [leg("h800", 100)],
  })], "cf:t2byh00");
  const partial = fleet([section("s1", 100, "committed-planning-rent", {
    rent: { mode: "byHw", usdPerHrByHw: { h800: 1.75 } },
    legs: [leg("h800", 50), leg("h100", 50)],
  })], "cf:t2byh01");
  const emptyResult = CF.validateCustomFleet(empty);
  const partialResult = CF.validateCustomFleet(partial);
  const app = readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
  assert("T2-FIX-P1-7 byHw validation and donor-change UI fail closed on missing prices",
    !emptyResult.ok && !partialResult.ok
      && emptyResult.errors.some(error => /h800.*price|price.*h800|usdPerHrByHw\.h800/i.test(error))
      && partialResult.errors.some(error => /h100.*price|price.*h100|usdPerHrByHw\.h100/i.test(error))
      && app.includes("cfRebuildByHwRentMap(opts.section)")
      && /selD\.oninput[\s\S]{0,240}revalidate\(\)/.test(app),
    JSON.stringify({ emptyResult, partialResult }));
}

/* Codec v7: explicit sections by value; decode returns effective bases. */
{
  const def = fleet([
    section("s1", 60, "committed-planning-rent", { rent: { mode: "flat", usdPerHr: 2.4 } }),
    section("s2", 40, "owned-strategic-tco", { electricity: { usdPerKwh: 0.10 } }),
  ], "cf:t2codec");
  const previous = CF.CF_RUNTIME.saved;
  CF.CF_RUNTIME.saved = { ...previous, [def.id]: def };
  try {
    const s = state(); s.blend = CF.aggregateLegsToBlend(def);
    const tr = E.resolveTraffic(opus, median, { mode: "native" });
    const token = E.encodeScenario(s, "opus", "median", tr, null, { fleet: def.id, totalCase: "custom" });
    const decoded = E.decodeScenario(token);
    assert("T2-8 explicit section fleets mint codec v7", token.startsWith("v7."), token.slice(0, 3));
    assert("T2-8 codec v7 round-trips sections by value", decoded && decoded._meta.fleet.custom.sections.length === 2);
    assert("T2-8 codec output exposes effective bases, never inherit",
      decoded && !JSON.stringify(decoded._meta.fleet.custom.sections).includes("inherit"));
  } catch (error) {
    assert("T2-8 codec v7 round-trip completes", false, String(error && error.stack || error));
  } finally { CF.CF_RUNTIME.saved = previous; }
}

/* im-arc T2 fix (Sol review 2026-08-23, finding P1-4): the decoded
   wire version survives normalization, so an unchanged v6 fleet re-mints v6 bytes. */
{
  const legacy = { id: "cf:t2v6001", name: "Legacy wire", epoch: E.DEFAULTS_EPOCH, clonedFrom: null,
    legs: [
      { ...leg("h800", 60, { kwhPerKwh: 0.12 }), basisDeclared: "inherit" },
      { ...leg("h100", 40, { rentPerHr: 2.75 }), basisDeclared: "inherit" },
    ] };
  const previous = CF.CF_RUNTIME.saved;
  try {
    CF.CF_RUNTIME.saved = { ...previous, [legacy.id]: legacy };
    const s = state(); s.blend = CF.aggregateLegsToBlend(legacy);
    const tr = E.resolveTraffic(opus, median, { mode: "native" });
    const token = E.encodeScenario(s, "opus", "median", tr, null,
      { fleet: legacy.id, totalCase: "custom" });
    const decoded = E.decodeScenario(token);
    const normalized = CF.validateCustomFleet({ id: decoded._meta.fleet.id,
      name: decoded._meta.fleet.custom.name, epoch: decoded._meta.epoch,
      clonedFrom: decoded._meta.fleet.custom.clonedFrom,
      legs: decoded._meta.fleet.custom.legs },
      { requireId: true, wireVersion: decoded._meta.schema });
    CF.CF_RUNTIME.saved = { ...previous, [legacy.id]: normalized.fleet };
    const reencoded = E.encodeScenario(s, "opus", "median", tr, null,
      { fleet: legacy.id, totalCase: "custom" });
    const redecode = E.decodeScenario(reencoded);
    const before = E.workload(s, undefined, context(s), { customFleet: legacy });
    const after = E.workload(s, undefined, context(s), { customFleet: normalized.fleet });
    const resolved = E.resolveFleetSections(s, { customFleet: normalized.fleet });
    assert("T2-FIX-P1-4 unchanged normalized v6 fleets preserve wire bytes, outputs, and effective labels",
      token.startsWith("v6.") && normalized.ok && normalized.fleet.wireVersion === "v6"
        && reencoded === token && redecode && redecode._meta.schema === "v6"
        && before.margin === after.margin
        && JSON.stringify(before.composition) === JSON.stringify(after.composition)
        && !JSON.stringify(resolved).includes("inherit"),
      JSON.stringify({ normalized, prefixes: [token.slice(0, 3), reencoded.slice(0, 3)],
        byteEqual: token === reencoded, before: before.margin, after: after.margin, resolved }));
  } catch (error) {
    assert("T2-FIX-P1-4 unchanged normalized v6 fleets preserve wire bytes, outputs, and effective labels",
      false, String(error && error.stack || error));
  } finally { CF.CF_RUNTIME.saved = previous; }
}

/* im-arc T2 fix (Sol review 2026-08-23, finding P1-2): ranged section
   shares are a sum-to-100 polytope whose feasible vertices set the band. */
{
  const rangedShares = fleet([
    section("s1", { lo: 10, mid: 50, hi: 90 }, "committed-planning-rent", {
      rent: { mode: "flat", usdPerHr: 1 },
    }),
    section("s2", { lo: 10, mid: 50, hi: 90 }, "committed-planning-rent", {
      rent: { mode: "flat", usdPerHr: 10 },
    }),
  ], "cf:t2poly1");
  const at = (a, b) => {
    const concrete = structuredClone(rangedShares);
    concrete.sections[0].sharePct = a; concrete.sections[1].sharePct = b;
    return E.workload(state(), undefined, context(state()), { customFleet: concrete }).margin;
  };
  const endpoints = [at(90, 10), at(10, 90)];
  const band = E.sectionBand(state(), { customFleet: rangedShares });
  assert("T2-FIX-P1-2 sectionBand evaluates the actual feasible share-polytope endpoints",
    close(endpoints[0], 0.6909980453448752) && close(endpoints[1], -0.479956730190334)
      && close(band.compounded.lo, Math.min(...endpoints))
      && close(band.compounded.hi, Math.max(...endpoints))
      && band.exact === true && band.evaluatedShareVertices === 2,
    JSON.stringify({ endpoints, band }));
}

/* Commit B: every point-or-triple section assumption is evaluated at the
   exact corners, with the compounded range equal to an independent oracle. */
{
  const ranged = fleet([
    section("s1", 60, "committed-planning-rent", {
      rent: { mode: "flat", usdPerHr: { lo: 1.8, mid: 2.4, hi: 3.0 } },
    }),
    section("s2", 40, "owned-strategic-tco", {
      electricity: { usdPerKwh: { lo: 0.06, mid: 0.10, hi: 0.14 } },
      pue: { lo: 1.1, mid: 1.2, hi: 1.3 },
    }),
  ], "cf:t2band1");
  ranged.sections[0].sharePct = { lo: 50, mid: 60, hi: 70 };
  ranged.sections[1].sharePct = { lo: 30, mid: 40, hi: 50 };
  const brute = [];
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-2): the oracle
     crosses all ordinary box corners with both feasible share vertices. */
  for (const shares of [[50, 50], [70, 30]])
    for (const rent of [1.8, 3.0]) for (const kwh of [0.06, 0.14]) for (const pue of [1.1, 1.3]) {
      const d = structuredClone(ranged);
      d.sections[0].sharePct = shares[0]; d.sections[1].sharePct = shares[1];
      d.sections[0].rent.usdPerHr = rent;
      d.sections[1].electricity.usdPerKwh = kwh;
      d.sections[1].pue = pue;
      brute.push(E.workload(state(), undefined, context(state()), { customFleet: d }).margin);
    }
  let band = null, error = null;
  try { band = E.sectionBand(state(), { customFleet: ranged }); } catch (caught) { error = caught; }
  assert("T2-B1 sectionBand evaluates all 2^3 exact corners",
    !error && band.exact === true && band.evaluatedCorners === 16,
    error ? String(error.message) : JSON.stringify(band));
  assert("T2-B1 sectionBand compounded endpoints equal independent corner evaluation",
    band && band.compounded.lo === Math.min(...brute) && band.compounded.hi === Math.max(...brute)
      && band.dials.length === 3 && band.dials.every((dial) => Number.isFinite(dial.loMargin)
        && Number.isFinite(dial.midMargin) && Number.isFinite(dial.hiMargin)), JSON.stringify(band));
  assert("T2-B1 sectionBand exposes the memo's exact typed presentation contract",
    band && band.mechanism === "share-polytope-vertices" && band.label === "selected span"
      && band.midLabel === "middle assumption" && band.perDial.length === 3
      && band.perDial.every((dial) => Object.keys(dial).sort().join(",") === "hi,id,lo,width"
        && dial.width === dial.hi - dial.lo), JSON.stringify(band));
  assert("T2-B1 ranged shares are delegated to the compositional polytope, never box-cornered",
    band && band.compositionalRanges.length === 2 && band.evaluatedCorners === 16
      && band.evaluatedShareVertices === 2,
    JSON.stringify(band));
}

/* im-arc T2 fix (Sol review 2026-08-23, finding P1-3): a required
   non-finite corner refuses the whole band; it is never called exact. */
{
  const nonFinite = fleet([section("s1", 100, "owned-strategic-tco", {
    electricity: { usdPerKwh: 0.10 },
    legs: [leg("h800", 100, { hbmBytes: { lo: 1.6e10, mid: 8e10, hi: 1e11 } })],
  })], "cf:t2nan01");
  const band = E.sectionBand(state(), { customFleet: nonFinite });
  assert("T2-FIX-P1-3 sectionBand refuses NaN/non-finite required corners",
    band && band.refused === true && band.exact === false
      && typeof band.reason === "string" && /non-finite|corner|refus/i.test(band.reason)
      && !Number.isFinite(band.compounded.lo) && !Number.isFinite(band.compounded.hi),
    JSON.stringify(band));
}

/* Pro fold I: one runtime schema. The UI and engine consume the validator; the MCP
   package imports that engine instead of declaring a second section key set. */
{
  const custom = readFileSync(new URL("../site/custom-fleets.js", import.meta.url), "utf8");
  const engine = readFileSync(new URL("../site/engine.js", import.meta.url), "utf8");
  const app = readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
  const mcp = readFileSync(new URL("../mcp-server/src/engine.ts", import.meta.url), "utf8");
  const declarations = [custom, engine, app, mcp]
    .reduce((count, source) => count + (source.match(/const CF_SECTION_KEYS\s*=/g) || []).length, 0);
  assert("T2-I one section schema is declared across UI, engine, and MCP consumers", declarations === 1,
    String(declarations));
  assert("T2-I UI, engine, and MCP all consume the canonical validation/engine path",
    app.includes("validateCustomFleet(") && engine.includes("require(\"./custom-fleets.js\").validateCustomFleet")
      && mcp.includes('require("../../site/engine.js")'), JSON.stringify({ app: app.length, engine: engine.length, mcp: mcp.length }));
}

/* im-arc T2 fix (Sol review 2026-08-23, finding P1-8): every UI point
   read of a point-or-triple goes through cfPointValue, and declared triples are
   middle assumptions rather than statistical medians. */
{
  const app = readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
  const index = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
  const custom = readFileSync(new URL("../site/custom-fleets.js", import.meta.url), "utf8");
  const t2Sources = [app, index, custom].join("\n");
  assert("T2-FIX-P1-8 triple UI arithmetic/rendering uses point values and middle-assumption labels",
    app.includes('cfPointValue(leg.sharePct, 0) + "%"')
      && app.includes("cfPointValue(x.sec.sharePct, 0)")
      && app.includes("cfPointValue(x.leg.sharePct, 0)")
      && app.includes("cfPointValue(x.leg.overrides.kwhPerKwh, cfElectricityPoint(x.sec))")
      && app.includes("return section ? cfElectricityPoint(section) : S.kwh")
      && app.includes(" (middle assumption)")
      && app.includes(" bottom / middle assumption / top")
      && !t2Sources.includes(" (median)")
      && !t2Sources.includes(" bottom / median / top"),
    "T2 triple rendering still contains a raw object/arithmetic path or forbidden median label");
}

console.log(failures ? `\n${failures} FLEET-SECTIONS T2 FAILURE(S)` : "\nALL FLEET-SECTIONS T2 TESTS PASS");
process.exit(failures ? 1 : 0);
