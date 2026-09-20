/* im-arc T2 — region/facility/programme registry and M-D row hook.
   Spec: research/im-arc-t2-sections-memo.md §§3–4, §8 (2026-08-22).

   im-arc T4 fold (2026-08-24), spec research/im-arc-t4-fold-memo.md §§0.1, 1, 5, 7:
   the registry came onto the four evidence clusters. This file keeps its T2 job — the
   STRUCTURE and PROVENANCE gate over the shipped rows — and gains the T4 shapes.
   Two things moved OUT of it deliberately:
     * the closed-enum / observation-kind / mixed-aggregate INVARIANTS are enforced by the
       registry's own validator and proved to bite in tests/dc-registry-schema-t4.test.mjs;
     * the coverage PERCENTAGES are no longer stored, so they can no longer be asserted
       against stored numbers here — they are derived by one resolver and gated in
       tests/dc-coverage-resolver-t4.test.mjs. */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { provenance, CITED_PRIVATE_SOURCES } from "./provenance-inputs.mjs";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const ED = require("../site/engine-data-v22.js");
const U = require("../site/uncertainty-contract.js");

let failures = 0;
function assert(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : " — " + detail}`);
  if (!cond) failures++;
}

let D = null;
try { D = require("../site/engine-data-dc-v1.js"); }
catch (error) { assert("T2-DC-0 registry module loads", false, String(error.message)); }

const triple = (value) => value && typeof value === "object"
  && [value.lo, value.mid, value.hi].every((x) => typeof x === "number" && Number.isFinite(x))
  && value.lo <= value.mid && value.mid <= value.hi;
const keysEqual = (value, expected) => value && Object.keys(value).sort().join(",") === expected.slice().sort().join(",");
/* im-arc T4 fold: the folded rows carry OPTIONAL typed fields (a mixed aggregate, serving
   evidence, milestones, structured notes). A closed key set is still enforced — every key must
   be named as required or optional, and every required key must be present — but the exact
   equality of the T2 era would refuse a row for carrying evidence it legitimately has. */
const keysWithin = (value, required, optional = []) => {
  if (!value || typeof value !== "object") return false;
  const present = Object.keys(value);
  return required.every(key => present.includes(key))
    && present.every(key => required.includes(key) || optional.includes(key));
};
const strings = (value, out = []) => {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => strings(item, out));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => strings(item, out));
  return out;
};

if (D) {
  assert("T2-DC-1 four registry classes exported and frozen",
    D.REGIONS && D.DATACENTERS && D.PROGRAMMES && D.COVERAGE_LEDGER
      && [D.REGIONS, D.DATACENTERS, D.PROGRAMMES, D.COVERAGE_LEDGER].every(Object.isFrozen));
  assert("T2-DC-1 exactly the three commissioned regions are seeded",
    Object.keys(D.REGIONS).sort().join(",") === "cn-coastal,cn-western,us-industrial");
  /* im-arc T4 fold (2026-08-24), memo §5: the three region rows are re-based on the
     electricity cluster. us-industrial keeps its MIDDLE (0.0871) and moves its endpoints to a
     declared host-state selection; both China rows become tariff-derived delivered spans. */
  const expectedRegions = {
    "us-industrial": [0.0617, 0.0871, 0.1053, "analyst-set", "selected-span", "2026-07-23"],
    "cn-coastal": [0.089, 0.098, 0.110, "measured/credibly-reported", "tariff-derived-delivered", "2026-08-01"],
    "cn-western": [0.060, 0.071, 0.087, "measured/credibly-reported", "tariff-derived-delivered", "2026-08-01"],
  };
  const regionKeys = ["usdPerKwh", "basis", "observationKind", "source", "sourceFile",
    "sourceNeedle", "asOf", "note"];
  for (const [id, [lo, mid, hi, basis, kind, asOf]] of Object.entries(expectedRegions)) {
    const row = D.REGIONS[id];
    assert(`T2-DC-2 ${id} exact commissioned triple + provenance`,
      keysWithin(row, regionKeys, ["provisionalObservations"])
        && triple(row.usdPerKwh) && row.usdPerKwh.lo === lo && row.usdPerKwh.mid === mid && row.usdPerKwh.hi === hi
        && row.basis === basis && row.observationKind === kind && row.asOf === asOf
        && typeof row.source === "string" && row.source.length > 20,
      JSON.stringify(row));
  }

  const dcKeys = ["operator", "company", "site", "region", "regionRef", "facilityClass",
    "facilityClassBasis", "accelerators", "electricity", "pue", "procurement", "rent", "tco",
    "coverage", "sourceFile", "sourceNeedle", "provenance"];
  const dcOptional = ["mixedAggregate", "servingEvidence", "milestones", "note"];
  assert("T2-DC-3 facility seed is conservative and contains only sourced existing-dive rows",
    Object.keys(D.DATACENTERS).length > 0 && Object.values(D.DATACENTERS).every((row) =>
      keysWithin(row, dcKeys, dcOptional) && ["evidence", "partial", "generic-fill"].includes(row.coverage)
      && ["owned", "rented", "mixed"].includes(row.procurement)
      && Object.prototype.hasOwnProperty.call(D.REGIONS, row.regionRef)
      /* im-arc T4 fold (2026-08-24), memo §1.1: a facility states its inventory EITHER as
         per-SKU counts OR as one mixed aggregate — never both, never neither. */
      && Array.isArray(row.accelerators)
      && (row.accelerators.length > 0) !== (!!row.mixedAggregate)));
  for (const [id, row] of Object.entries(D.DATACENTERS)) {
    assert(`T2-DC-3 ${id} accelerator triples are typed and sourced`, row.accelerators.every((a) =>
      keysEqual(a, ["hwKey", "count", "basis", "observationKind", "source", "asOf"])
        && Object.prototype.hasOwnProperty.call(ED.HW_ROOFLINE, a.hwKey)
        && triple(a.count) && typeof a.basis === "string" && typeof a.source === "string" && /^20\d\d-\d\d-\d\d$/.test(a.asOf)));
    assert(`T2-DC-3 ${id} electricity is an explicit sourced triple or typed region inheritance`,
      (keysWithin(row.electricity, ["usdPerKwh", "tariffClass", "basis", "observationKind", "source", "asOf"], ["note"])
        && triple(row.electricity.usdPerKwh))
      || (keysEqual(row.electricity, ["inherit"]) && Object.prototype.hasOwnProperty.call(D.REGIONS, row.electricity.inherit)),
      JSON.stringify(row.electricity));
    /* Every hardware key a facility says is PRESENT must be a modeled key — presence is what
       the physical-inventory sentence and the named-site coverage channel both read. */
    if (row.mixedAggregate) assert(`T2-DC-3 ${id} mixed aggregate names only modeled hardware keys`,
      row.mixedAggregate.hwKeysPresent.every(key => Object.prototype.hasOwnProperty.call(ED.HW_ROOFLINE, key)));
    for (const milestone of row.milestones || [])
      assert(`T2-DC-3 ${id} milestone ${milestone.hwKey} is a typed dated point`,
        Object.prototype.hasOwnProperty.call(ED.HW_ROOFLINE, milestone.hwKey)
          && milestone.observationKind === "milestone" && triple(milestone.count)
          && milestone.count.lo === milestone.count.hi);
  }

  const programmeKeys = ["operator", "company", "programme", "accelerators", "source", "sourceFile",
    "sourceNeedle", "asOf", "coverage", "provenance"];
  const programmeOptional = ["note", "componentOf", "impliedAllInRate"];
  assert("T2-DC-4 programme evidence stays in PROGRAMMES, never DATACENTERS",
    Object.keys(D.PROGRAMMES).length >= 4
      && Object.values(D.PROGRAMMES).every((row) => keysWithin(row, programmeKeys, programmeOptional)
        && row.coverage === "programme")
      && !Object.keys(D.DATACENTERS).some((id) => /rainier|ironwood|cloudmatrix|ant-h20/i.test(id)));
  for (const [id, row] of Object.entries(D.PROGRAMMES)) {
    assert(`T2-DC-4 ${id} programme accelerators never fabricate a facility`, row.accelerators.every((a) =>
      keysEqual(a, ["hwKey", "count", "basis", "observationKind", "source", "asOf"])
        && Object.prototype.hasOwnProperty.call(ED.HW_ROOFLINE, a.hwKey) && triple(a.count)));
    if (row.componentOf) assert(`T2-DC-4 ${id} component observation names its parent programme`,
      Object.prototype.hasOwnProperty.call(D.PROGRAMMES, row.componentOf));
    /* im-arc T4 fold (2026-08-24), memo §1.3: the two bundled capacity contracts record their
       implied all-in rate HERE and deliberately OUTSIDE the planning-rent vector — reserved
       capacity bundling CPU, storage, network, facility power and operations is not bare rent. */
    if (row.impliedAllInRate) assert(`T2-DC-4 ${id} implied all-in rate stays out of the rent vector`,
      typeof row.impliedAllInRate.usdPerGpuHr === "number" && !row.accelerators.length
        && /outside the planning-rent vector/i.test(row.impliedAllInRate.note));
  }

  /* Every registry row points at a checked-in source and an exact needle found there.
     Five of the seven cited sources are im-arc working dives that publish.sh deliberately does
     not ship, so on the reconstructed public stage this loop failed twenty times and blocked
     validate_stage (vetting round 2026-09-19). Those five are registered private inputs and
     skip there, by count; the two published sources are always checked, in either tree. */
  const provSources = provenance("dc-registry-t2-sources", assert);
  for (const [kind, rows] of [["region", D.REGIONS], ["facility", D.DATACENTERS], ["programme", D.PROGRAMMES]]) {
    for (const [id, row] of Object.entries(rows)) {
      const name = `T2-DC-5 ${kind} ${id} source file + exact needle exist`;
      if (CITED_PRIVATE_SOURCES.has(row.sourceFile)) {
        provSources.gate(row.sourceFile, 1, (text) => {
          provSources.assert(name, text.includes(row.sourceNeedle), `${row.sourceFile} :: ${row.sourceNeedle}`);
        });
        continue;
      }
      const sourcePath = new URL(`../${row.sourceFile}`, import.meta.url);
      const text = existsSync(sourcePath) ? readFileSync(sourcePath, "utf8") : "";
      assert(name, !!text && text.includes(row.sourceNeedle), `${row.sourceFile} :: ${row.sourceNeedle}`);
    }
  }
  provSources.summary();

  const companies = ["anthropic", "openai", "google", "xai", "deepseek", "zhipu", "moonshot"];
  assert("T2-DC-6 coverage ledger has exactly the commissioned companies",
    Object.keys(D.COVERAGE_LEDGER).sort().join(",") === companies.sort().join(","));
  /* im-arc T4 fold (2026-08-24) [F3]: the ledger stores EVIDENCE keyed {company, preset} at the
     hardware-key level and stores NO percentages — a stored percentage drifts the moment a blend
     changes, which is exactly what the T3 fix-3 diagnostic showed. The three-part partition and
     the non-additive count-backed share are derived by ONE resolver, and they are gated where
     the resolver lives: tests/dc-coverage-resolver-t4.test.mjs. What THIS file still owns is the
     stored evidence's structure, its denominator wording, and that every row id it names
     resolves to a real registry row. */
  const ledgerKeys = ["company", "asOf", "wording", "rows", "programmes", "presets"];
  const presetKeys = ["preset", "blendRef", "namedSite", "programme", "countBacked", "notes"];
  const presetOptional = ["physicalInventoryRows", "physicalInventorySentence"];
  for (const company of companies) {
    const row = D.COVERAGE_LEDGER[company];
    assert(`T2-DC-6 ${company} ledger is closed and uses the exact denominator wording`,
      keysEqual(row, ledgerKeys) && row.company === company
        && row.wording === "share of the MODELED fleet resting on DC-specific public evidence — not how much of the real fleet is known"
        && row.rows.every((id) => Object.prototype.hasOwnProperty.call(D.DATACENTERS, id))
        && row.programmes.every((id) => Object.prototype.hasOwnProperty.call(D.PROGRAMMES, id))
        && Object.keys(row.presets).length > 0, JSON.stringify(Object.keys(row)));
    assert(`T2-DC-6 ${company} stores no coverage percentage as primary data`,
      !/Pct"?\s*:/.test(JSON.stringify(row)) && !("modeledFleetShareEvidenced" in row),
      JSON.stringify(row).slice(0, 200));
    for (const [presetId, preset] of Object.entries(row.presets)) {
      assert(`T2-DC-6 ${company}/${presetId} evidence rows are typed and resolve`,
        keysWithin(preset, presetKeys, presetOptional) && preset.preset === presetId
          && [...preset.namedSite, ...preset.programme, ...preset.countBacked].every((entry) =>
            (Object.prototype.hasOwnProperty.call(D.DATACENTERS, entry.rowId)
              || Object.prototype.hasOwnProperty.call(D.PROGRAMMES, entry.rowId))
            && Array.isArray(entry.hwKeys) && entry.hwKeys.length > 0
            && entry.hwKeys.every((key) => Object.prototype.hasOwnProperty.call(ED.HW_ROOFLINE, key))
            && /^20\d\d-\d\d-\d\d$/.test(entry.asOf)), JSON.stringify(preset));
      /* The count-backed subset is NON-ADDITIVE and is a subset of the evidence that backs it:
         a key can only be count-backed if some named-site or programme row carries it. */
      const evidenced = new Set([...preset.namedSite, ...preset.programme]
        .flatMap((entry) => entry.hwKeys));
      assert(`T2-DC-6 ${company}/${presetId} count-backed keys are a subset of the evidenced keys`,
        preset.countBacked.every((entry) => entry.hwKeys.every((key) => evidenced.has(key))),
        JSON.stringify(preset.countBacked));
    }
  }
  /* Named-site evidence must actually exist on the facility row it names — the memo's
     precedence (1) reads servingEvidence, not the row's mere existence (memo §1.5, §3). */
  for (const [company, row] of Object.entries(D.COVERAGE_LEDGER))
    for (const [presetId, preset] of Object.entries(row.presets))
      for (const entry of preset.namedSite) {
        const facility = D.DATACENTERS[entry.rowId];
        assert(`T2-DC-6 ${company}/${presetId} named-site row ${entry.rowId} carries serving evidence for it`,
          !!facility && (facility.servingEvidence || []).some((evidence) =>
            evidence.company === company && evidence.role === "serving-tenant"
            && (evidence.presets || []).includes(presetId)),
          JSON.stringify(facility && facility.servingEvidence));
      }

  const vocabHits = U.scanForbiddenVocabulary({ registry: strings({
    REGIONS: D.REGIONS, DATACENTERS: D.DATACENTERS, PROGRAMMES: D.PROGRAMMES,
  }).join("\n") });
  assert("T2-DC-7 registry prose contains no forbidden probabilistic vocabulary", vocabHits.length === 0,
    JSON.stringify(vocabHits));
}

function close100(value) { return Math.abs(value - 100) < 1e-9; }

/* M-D field: code has 11 rows total including rubin; the older plan's '11 + rubin' count
   is stale, so this test binds the live registry rather than inventing a twelfth row. */
{
  const rows = Object.entries(ED.HW_ROOFLINE);
  assert("T2-DC-8 every live hardware row, including rubin, carries kwhPerKwh:null",
    rows.length === 11 && rows.every(([, row]) => Object.prototype.hasOwnProperty.call(row, "kwhPerKwh") && row.kwhPerKwh === null),
    rows.map(([id, row]) => `${id}:${String(row.kwhPerKwh)}`).join(","));
  assert("T2-DC-8 every row carries the section/DC populate-on-evidence note",
    rows.every(([, row]) => row.prov && /electricity is a property of the SECTION \/ data center/.test(row.prov.kwhPerKwh)
      && /engine-data-dc-v1\.js/.test(row.prov.kwhPerKwh)));
}

{
  const ledgerPath = new URL("../research/dc-registry.md", import.meta.url);
  const ledger = existsSync(ledgerPath) ? readFileSync(ledgerPath, "utf8") : "";
  assert("T2-DC-9 generated ledger exists and states the exact modeled-fleet denominator",
    ledger.includes("share of the MODELED fleet resting on DC-specific public evidence — not how much of the real fleet is known"));
  if (D) assert("T2-DC-9 generated ledger names every registry row",
    [...Object.keys(D.REGIONS), ...Object.keys(D.DATACENTERS), ...Object.keys(D.PROGRAMMES)].every((id) => ledger.includes(`\`${id}\``)));

  const annexBuilder = readFileSync(new URL("../build-research-html.mjs", import.meta.url), "utf8");
  assert("T2-DC-10 generated ledger is wired into the public research-annex manifest",
    annexBuilder.includes('md: "research/dc-registry.md"')
      && annexBuilder.includes('slug: "dc-registry"'));
  /* scripts/publish.sh IS ALREADY a registered private input and is deliberately absent from
     the snapshot it produces, but this block read it directly — so on the reconstructed public
     stage, in the public repo's CI, and inside publish.sh's own validate_stage, `npm test` died
     here on ENOENT. Reproduced 2026-09-19 against a stage built from the live allow-list:
     "ENOENT: no such file or directory, open '<stage>/scripts/publish.sh'". The publisher
     assertion now runs through the provenance gate: binding in the private tree, skipped
     loudly and by count where the file is absent by design. */
  const prov = provenance("dc-registry-t2", assert);
  prov.gate("scripts/publish.sh", 1, (publisher) => {
    prov.assert("T2-DC-10 immutable public-stage build carries and checks the DC generator + ledger",
      /^  build-dc-ledger\.mjs$/m.test(publisher)
        && /^  research\/dc-registry\.md$/m.test(publisher)
        && /cp -p research\/dc-registry\.md "\$generated_before\/dc-registry\.md"/.test(publisher)
        && /diff -ru "\$generated_before\/dc-registry\.md" research\/dc-registry\.md/.test(publisher));
  });
  prov.summary();
}

console.log(failures ? `\n${failures} DC-REGISTRY T2 FAILURE(S)` : "\nALL DC-REGISTRY T2 TESTS PASS");
process.exit(failures ? 1 : 0);
