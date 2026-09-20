/* im-arc T3 — fleet mode, registry composition, coverage and section-tier contracts.
   Spec: PLAN-im-arc-2026-08-22.md §§1 T3, 2, 3.2–3.3, 4 and T2 memo §1.1/§5. */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const CF = require("../site/custom-fleets.js");
const D = require("../site/engine-data-dc-v1.js");

let failures = 0;
function assert(name, condition, detail = "") {
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${condition ? "" : " — " + detail}`);
  if (!condition) failures++;
}
const close = (a, b, eps = 1e-12) => Math.abs(a - b) <= eps;
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const mid = (value) => value && typeof value === "object" ? value.mid : value;
const callerAuthoredSections = sections => (sections || []).map(section => {
  const { fallbackReceipts: _fallbackReceipts, shareRounding: _shareRounding, ...authored } = section;
  return authored;
});

/* Director A1: the browser branch must only name lexical globals established by the
   DC data script. Derive the identifier list from dcRegistry() itself so adding a
   future browser-only registry member cannot silently escape this gate. */
{
  const engineSource = readFileSync(new URL("../site/engine.js", import.meta.url), "utf8");
  const dataSource = readFileSync(new URL("../site/engine-data-dc-v1.js", import.meta.url), "utf8");
  const branch = engineSource.match(/function dcRegistry\(\)\s*\{[\s\S]*?\? require\([^\n]+\)\s*:\s*\{([^}]+)\};\s*\}/);
  const identifiers = branch ? branch[1].split(",").map((name) => name.trim()).filter(Boolean) : [];
  const context = vm.createContext({});
  vm.runInContext(dataSource, context);
  const missing = identifiers.filter((name) => vm.runInContext(`typeof ${name}`, context) === "undefined");
  assert("T3FIX-A1 every dcRegistry browser identifier exists in engine-data-dc-v1 browser scope",
    identifiers.length > 0 && missing.length === 0,
    JSON.stringify({ identifiers, missing }));
}

assert("T3-A1 every box declares explicit basic/advanced tiers and no basic tier exceeds four controls",
  E.SECTIONS.every((section) => section.params.length > 0
    && section.params.every((param) => param.tier === "basic" || param.tier === "advanced")
    /* im-arc T4 fold (2026-08-24), memo §2.1 [F6]: the capital-recovery box is ADVANCED-ONLY by
       construction — it exposes a named basis the page never activates for a reader who has not
       asked for it, so it has no basic control at all. The rule that matters is the CEILING on
       basic controls; a box may legitimately have none. */
    && section.params.filter((param) => param.tier === "basic").length <= 4),
  JSON.stringify(E.SECTIONS.map((section) => ({ title: section.title,
    basic: section.params.filter((param) => param.tier === "basic").map((param) => param.k),
    advanced: section.params.filter((param) => param.tier === "advanced").map((param) => param.k) }))));

/* Generic mode must be a presentation identity over the pre-T3 engine path. This exhaustive
   registered model×perspective grid catches any accidental default move; REF separately protects
   the long-standing reference construction. */
{
  let identical = true, executed = 0;
  for (const model of E.MODELS) for (const perspective of E.PERSPECTIVES) {
    const state = E.applyPresetSettings(model, perspective, { mode: "native" });
    const context = E.makeScenarioContext(model, E.resolveTraffic(model, perspective, { mode: "native" }), state.customDonor);
    const before = E.workload(state, undefined, context);
    const after = E.workload(state, undefined, context, E.fleetModeRenderOptions("generic", null));
    if (JSON.stringify(before) !== JSON.stringify(after)) identical = false;
    executed++;
  }
  assert(`T3-A2 generic mode is byte-identical on every registered model×perspective pair (${executed})`,
    identical && executed === E.MODELS.length * E.PERSPECTIVES.length, String(executed));
  const model = E.MODELS.find((row) => row.id === "opus");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "median");
  const state = E.pinReferenceLevers(E.applyPresetSettings(model, perspective, { mode: "native" }));
  const context = E.makeScenarioContext(model, E.resolveTraffic(model, perspective, { mode: "native" }), state.customDonor);
  assert("T3-A2 REF generic mode remains byte-identical",
    E.workload(state, undefined, context, E.fleetModeRenderOptions("generic", null)).margin === 0.5843046405779231);

  const plain = E.workload(E.applyPresetSettings(model, perspective, { mode: "native" }));
  const legacyCompositionKeys = ["basis", "costBasisUsed", "electricitySource", "hourlyCostFrom", "sectionId", "share"];
  assert("T3FIX-P1-4 non-stress generic workload preserves the pre-T3 DTO surface",
    !Object.prototype.hasOwnProperty.call(plain, "coverage")
      && plain.composition.length === 1
      && JSON.stringify(Object.keys(plain.composition[0]).sort()) === JSON.stringify(legacyCompositionKeys),
    JSON.stringify({ workloadKeys: Object.keys(plain).sort(), composition: plain.composition }));
}

let composed = null;

/* Sol P1-2: a registry row with no DC-specific pricing/facility values must
   compute exactly like the generic path on the same donor blend, while each
   fallback is carried once on the shared section DTO. */
{
  const model = E.MODELS.find((row) => row.id === "opus");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "gptpro-r3");
  const state = E.applyPresetSettings(model, perspective, { mode: "native" });
  state.blend = Object.fromEntries(E.HW_ORDER.map((key) => [key, key === "trn2" ? 100 : 0]));
  const section = E.registrySectionFromRow("anthropic-rainier-trainium", state, { trn2: 100 }, 1);
  const fleet = { id: "cf:t3fb001", name: "fallback equivalence", epoch: E.DEFAULTS_EPOCH,
    clonedFrom: null, sections: [section] };
  const numeric = (workload) => JSON.stringify(Object.fromEntries(
    ["cIn", "cOut", "cCache", "costMix", "priceMix", "priceMixList", "margin"]
      .map((key) => [key, workload[key]])));
  const genericWorkload = E.workload(state);
  const registryWorkload = E.workload(state, undefined, undefined, { customFleet: fleet });
  const generic = numeric(genericWorkload);
  const registry = numeric(registryWorkload);
  assert("T3FIX-P1-2 missing DC values use the byte-identical generic calculation path",
    generic === registry, JSON.stringify({ generic, registry }));
  const receipts = Array.isArray(section.fallbackReceipts) ? section.fallbackReceipts : [];
  const expectedFields = ["electricity", "procurement", "pue", "rent"];
  assert("T3FIX-P1-2 each missing DC field emits exactly one value-and-source fallback receipt",
    expectedFields.every((field) => receipts.filter((receipt) => receipt.field === field
      && receipt.value !== undefined && typeof receipt.source === "string" && receipt.source.length).length === 1)
      && receipts.length === expectedFields.length,
    JSON.stringify(receipts));
  const receiptSentence = registryWorkload.composition?.[0]?.receiptSentence || "";
  assert("T3FIX-P1-2 the engine-owned composition sentence renders every fallback for UI and MCP",
    expectedFields.every((field) => receiptSentence.includes(field + "=")), receiptSentence);
  const appSource = readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
  assert("T3FIX-P1-2 the UI composition line consumes the engine-owned receipt sentence",
    /renderFleetCompositionLine\(\)[\s\S]*?row\.receiptSentence/.test(appSource));

  /* Final review: receipt metadata is an engine result, never trusted caller input.
     Deleting or forging the optional wire field must not suppress real fallbacks, and
     editing a formerly missing value must remove its now-stale fallback. */
  const omitted = structuredClone(section);
  delete omitted.fallbackReceipts;
  const omittedValidation = E.validateFleetSections({ ...fleet, id: "cf:t3fb002", sections: [omitted] });
  const omittedWorkload = omittedValidation.ok
    ? E.workload(state, undefined, undefined, { customFleet: omittedValidation.fleet }) : null;
  assert("T3FIX-REVIEW-P1 fallback receipts are re-derived when caller metadata is omitted",
    omittedValidation.ok && omittedWorkload.composition[0].fallbackReceipts.length === 4
      && expectedFields.every((field) => omittedWorkload.composition[0].receiptSentence.includes(field + "=")),
    JSON.stringify(omittedWorkload && omittedWorkload.composition[0]));

  const edited = structuredClone(section);
  edited.pue = 1.2;
  edited.fallbackReceipts = [{ field: "pue", value: 9, source: "caller", reason: "forged" }];
  const editedValidation = E.validateFleetSections({ ...fleet, id: "cf:t3fb003", sections: [edited] });
  const editedWorkload = editedValidation.ok
    ? E.workload(state, undefined, undefined, { customFleet: editedValidation.fleet }) : null;
  const editedReceipts = editedWorkload?.composition[0]?.fallbackReceipts || [];
  assert("T3FIX-REVIEW-P1 edits recompute fallbacks and fabricated caller receipts never render",
    editedValidation.ok && editedReceipts.length === 3
      && !editedReceipts.some((receipt) => receipt.field === "pue" || receipt.source === "caller"),
    JSON.stringify({ validation: editedValidation, receipts: editedReceipts }));
}

/* Sol P1-1: every company-owned registry row must be independently selectable,
   as must every same-company pair. This is an exhaustive registry matrix rather
   than another hand-picked xAI happy path. */
{
  const rowsByCompany = Object.groupBy(Object.entries(E.registryRows()), ([, row]) => row.company);
  const failures = [];
  let cases = 0;
  for (const [company, entries] of Object.entries(rowsByCompany)) {
    const modelId = E.COMPANY_MODELS[company]?.[0];
    if (!modelId) continue;
    const model = E.MODELS.find((row) => row.id === modelId);
    const perspective = E.PERSPECTIVES.find((row) => row.id === "median");
    const ids = entries.map(([id]) => id);
    const selections = ids.map((id) => [id]);
    for (let left = 0; left < ids.length; left++)
      for (let right = left + 1; right < ids.length; right++) selections.push([ids[left], ids[right]]);
    for (const dcRows of selections) {
      cases++;
      try {
        const state = E.applyPresetSettings(model, perspective, { mode: "native" });
        const fleet = E.composeFleetFromDcRows(state, { modelId, dcRows, fill: "generic-us" });
        const valid = E.validateFleetSections(fleet);
        if (!valid.ok) failures.push({ company, dcRows, errors: valid.errors });
      } catch (error) {
        failures.push({ company, dcRows, error: error.message });
      }
    }
  }
  assert(`T3FIX-P1-1 every single and same-company pair of registry rows composes validly (${cases})`,
    cases > 0 && failures.length === 0, JSON.stringify(failures));

  const model = E.MODELS.find((row) => row.id === "grok");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "median");
  let rounded = null;
  try {
    /* im-arc T4 fold (2026-08-24), memo §1.1: this case used to compose xai-colossus-c1, whose
       live point(200000) H100 count both dive arms contradicted. C1 now states its inventory as
       ONE mixed aggregate with no public per-SKU split, and an aggregate may never feed fleet
       weights — so C1 allocates nothing and no registry composition reaches a >=0.05 rounding
       move any more. The rounding machinery is still live and still load-bearing, so the case is
       re-based on a declared 5:11 gb200/gb300 split at Colossus 2, which lands on 31.25/68.75
       and therefore moves both legs by exactly 0.05. Keeping the old C1 case would have made
       this assertion vacuous rather than green. */
    const roundingState = E.applyPresetSettings(model, perspective, { mode: "native" });
    roundingState.blend = { h100: 0, h200: 0, gb200: 5, gb300: 11, h800: 0, h20: 0,
      tpu7: 0, trn2: 0, trn3: 0, ascend: 0 };
    rounded = E.composeFleetFromDcRows(roundingState,
      { modelId: model.id, dcRows: ["xai-colossus-ii"], fill: "generic-us" });
  } catch { /* the red state is the validator failure under test above */ }
  assert("T3FIX-P1-1 deterministic one-decimal allocation emits shareRounding when a leg moves by at least 0.05",
    rounded && rounded.sections.some((section) => section.shareRounding
      && Array.isArray(section.shareRounding.changes) && section.shareRounding.changes.length),
    JSON.stringify(rounded && rounded.sections));
}

{
  const model = E.MODELS.find((row) => row.id === "grok");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "median");
  const state = E.applyPresetSettings(model, perspective, { mode: "native" });
  composed = E.composeFleetFromDcRows(state, {
    modelId: model.id,
    dcRows: ["xai-colossus-c1", "xai-colossus-ii"],
    fill: "generic-us",
    id: "cf:t3xai01",
    name: "xAI data-center scenario",
  });
  const validation = E.validateFleetSections(composed);
  const shares = composed.sections.map((section) => mid(section.sharePct));
  const fill = composed.sections.find((section) => section.provenance === "generic-fill");
  assert("T3-A3 two registry rows compose through the one section validator", validation.ok,
    validation.errors?.join("; "));
  /* im-arc T4 fold (2026-08-24): the generic remainder moves 5 -> 50. Colossus C1's live
     200,000-H100 count is withdrawn (both arms contradict it) and its replacement mixed
     aggregate may not feed fleet weights, so the composed xAI scenario now rests on Colossus 2
     alone — gb200 25 + gb300 25 of the Grok blend — and h100 45 + h200 5 fall to generic fill.
     A larger honest remainder is the point of the fold, not a regression. */
  assert("T3-A4 proposed registry shares plus generic remainder sum to 100",
    close(shares.reduce((sum, share) => sum + share, 0), 100)
      && fill && mid(fill.sharePct) === 50,
    JSON.stringify(shares));
  assert("T3-A5 count-attributed row shares preserve the modeled fleet and generic remainder",
    E.HW_ORDER.every((key) => close(CF.aggregateLegsToBlend(composed)[key], state.blend[key] || 0)),
    JSON.stringify({ proposed: CF.aggregateLegsToBlend(composed), modeled: state.blend }));

  const context = E.makeScenarioContext(model, E.resolveTraffic(model, perspective, { mode: "native" }), state.customDonor);
  const output = E.workload(state, undefined, context, { customFleet: composed });
  assert("T3-A6 composed per-DC workload receipt equals its normalized section composition",
    output.composition.length === composed.sections.length
      && output.composition.every((row, index) => row.sectionId === composed.sections[index].id
        && close(row.share, mid(composed.sections[index].sharePct) / 100)
        && row.basis === composed.sections[index].basis),
    JSON.stringify(output.composition));
}

{
  /* im-arc T4 fold (2026-08-24) [F3]: coverage percentages are no longer STORED, so this can no
     longer compare a rendered number against a ledger field — the ledger has none. It compares
     the rendered number against the DERIVED one from the one resolver, which is the stronger
     claim the fold makes possible: the sentence a reader sees and the number a machine reads are
     the same computation, not two transcriptions of one figure. Grok's 95% is withdrawn: the
     Colossus rows prove typed accelerators are PRESENT at a site, not that a share of the modeled
     Grok blend is SERVED there, and the physical inventory now has its own sentence. */
  const coverage = E.coverageForPreset("grok");
  const parts = E.coverageSentenceParts(coverage);
  assert("T3-A7 coverage line numbers equal the derived preset coverage",
    parts.values.named_site_serving_evidence_pct === coverage.namedSiteServingEvidencePct
      && parts.values.programme_type_evidence_pct === coverage.programmeTypeEvidencePct
      && parts.values.generic_fill_pct === coverage.genericFillPct
      && parts.sentence.startsWith("0% named-site serving evidence · 0% programme-type evidence · 100% generic fill — share of the MODELED fleet resting on DC-specific public evidence, not how much of the real fleet is known")
      && /physical inventory types present: 100% of the modeled blend/.test(parts.sentence),
    JSON.stringify(parts));
  const composedCoverage = E.coverageForFleetSections(composed.sections, "grok");
  assert("T3-A8 composed coverage is derived from section dcRef classes",
    composedCoverage.namedSiteServingEvidencePct === 0 && composedCoverage.programmeTypeEvidencePct === 0
      && composedCoverage.genericFillPct === 100
      /* and it says WHY each donor fell to generic fill, naming physical presence explicitly */
      && composedCoverage.receipts.some((receipt) => /PHYSICAL INVENTORY/.test(receipt.reason)),
    JSON.stringify(composedCoverage));

  const future = E.coverageSentenceParts({ namedSiteServingEvidencePct: 38,
    programmeTypeEvidencePct: 33, skuWorkloadCountBackedPct: 0, genericFillPct: 29,
    wording: D.COVERAGE_WORDING });
  assert("T3-A9 pure coverage renderer accepts incoming preset-keyed rows and keeps the count-backed line subordinate",
    future.parts.length === 3 && future.subordinate
      && future.sentence.startsWith("38% named-site serving evidence · 33% programme-type evidence · 29% generic fill")
      && /SKU\/workload count-backed: 0% \(non-additive\)/.test(future.sentence),
    JSON.stringify(future));
}

/* Sol P1-3: dcRef is a reference, never evidence by itself. Classification
   is donor-, company-, class-, and current-ledger-aware. */
{
  const forged = [{ id: "s1", label: "forged C1 Trainium", sharePct: 100,
    basis: "committed-planning-rent", rent: { mode: "registered", mult: 1 },
    electricity: null, pue: null, tco: null, dcRef: "xai-colossus-c1",
    provenance: "test forgery", fallbackReceipts: [],
    legs: [{ donorKey: "trn2", label: E.HW.trn2.name, sharePct: 100,
      overrides: {}, family: "trainium" }] }];
  const direct = E.validateFleetSections({ id: "cf:t3cov01", name: "coverage forgery",
    epoch: E.DEFAULTS_EPOCH, clonedFrom: null, sections: forged });
  const coverage = E.coverageForFleetSections(forged, "grok");
  assert("T3FIX-P1-3 a validator-accepted Trainium2/C1 dcRef forgery is generic coverage",
    direct.ok && coverage.namedSiteServingEvidencePct === 0 && coverage.programmeTypeEvidencePct === 0
      && coverage.genericFillPct === 100,
    JSON.stringify({ direct, coverage }));
  assert("T3FIX-P1-3 an inapplicable dcRef emits one disclosed coverage fallback receipt",
    Array.isArray(coverage.receipts) && coverage.receipts.length === 1
      && coverage.receipts[0].donorKey === "trn2" && /generic/i.test(coverage.receipts[0].sentence),
    JSON.stringify(coverage.receipts));

  const model = E.MODELS.find((row) => row.id === "dsv4");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "median");
  const state = E.applyPresetSettings(model, perspective, { mode: "native" });
  const historical = E.composeFleetFromDcRows(state, { modelId: model.id,
    dcRows: ["deepseek-h800-serving-2025"], fill: "generic-cn" });
  const historicalCoverage = E.coverageForFleetSections(historical.sections, model.id);
  assert("T3FIX-P1-3 DeepSeek V4 historical H800 trace remains 0/0/100 current coverage",
    historicalCoverage.namedSiteServingEvidencePct === 0
      && historicalCoverage.programmeTypeEvidencePct === 0
      && historicalCoverage.genericFillPct === 100
      /* and the count-backed line is a subset of the SAME evidence, so a preset with no
         programme evidence cannot show a count-backed share either. */
      && historicalCoverage.skuWorkloadCountBackedPct === 0,
    JSON.stringify(historicalCoverage));
}

/* Sol P1-4: the public-rate stress lens must compute the same evidenced
   sections its adjacent coverage sentence describes. */
{
  const stress = E.PERSPECTIVES.find((row) => row.id === "stress-public-rate");
  const opus = E.MODELS.find((row) => row.id === "opus");
  const opusState = E.applyPresetSettings(opus, stress, { mode: "native" });
  const opusWorkload = E.workload(opusState);
  const refs = opusWorkload.composition.map((row) => row.dcRef).filter(Boolean).sort();
  const rendered = opusWorkload.coverage && E.coverageSentenceParts(opusWorkload.coverage);
  assert("T3FIX-P1-4 stress composition uses current applicable registry rows plus generic remainder",
    /* im-arc T4 fold (2026-08-24) [F3]: the applicable programme rows for Opus now include the
       Anthropic-wide Trainium2 floor alongside Rainier and the TPU commitment — all three carry
       modeled keys in the blend, and the stress composition consumes exactly the rows the coverage
       resolver counts, which is the property this asserts. */
    /* im-vet-six-repairs (2026-09-20), vetting finding E1: the two TRAINIUM programme rows leave
       this composition, because the legs they key on are withdrawn from the default fleet and the
       composition consumes exactly the rows the blend carries — which is the property this
       asserts, unchanged. The rows themselves are untouched in the registry and return the moment
       a sourced coefficient puts the legs back. */
    JSON.stringify(refs) === JSON.stringify(["anthropic-tpu-commitment"])
      && opusWorkload.composition.some((row) => row.dcRef === null),
    JSON.stringify(opusWorkload.composition));
  assert("T3FIX-P1-4 stress coverage sentence is derived from that computed composition",
    rendered && rendered.values.named_site_serving_evidence_pct === 0
      && rendered.values.programme_type_evidence_pct === 33.3
      && rendered.values.generic_fill_pct === 66.7,
    JSON.stringify(rendered));

  const noRowsModel = E.MODELS.find((row) => row.id === E.COMPANY_MODELS.openai[0]);
  const solWorkload = E.workload(E.applyPresetSettings(noRowsModel, stress, { mode: "native" }));
  assert("T3FIX-P1-4 stress with no applicable registry row is 100% generic and says so",
    solWorkload.composition.length === 1 && solWorkload.composition[0].dcRef === null
      && solWorkload.coverage && solWorkload.coverage.genericFillPct === 100,
    JSON.stringify({ composition: solWorkload.composition, coverage: solWorkload.coverage }));
}

{
  const model = E.MODELS.find((row) => row.id === "grok");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "median");
  const state = E.applyPresetSettings(model, perspective, { mode: "native" });
  const token = E.encodeScenario(state, model.id, perspective.id,
    { mode: "native", profileId: null, ioRatio: state.ioRatio, cacheHit: state.cacheHit }, null,
    { fleet: composed.id, totalCase: "preset" }, { customFleet: composed });
  const decoded = E.decodeScenario(token);
  assert("T3-A10 per-DC v7 permalink round-trips sections by value",
    decoded && decoded._meta.schema === "v7" && decoded._meta.fleet.custom
      && JSON.stringify(callerAuthoredSections(decoded._meta.fleet.custom.sections))
        === JSON.stringify(callerAuthoredSections(composed.sections)),
    decoded ? JSON.stringify(decoded._meta?.fleet) : "decode refused");
}

/* Director B1 (2026-08-23): a cf: fleet's sections are the blend authority, so
   source registration must not make the encoder emit the forbidden top-level
   blend mirror. Derived fallback/rounding receipts are runtime results, not
   caller-authored wire fields. Exercise every interlock state with a lever
   vector that legitimately derives it; composition itself changes no lever. */
{
  const model = E.MODELS.find((row) => row.id === "grok");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "gptpro-r3");
  const base = E.applyPresetSettings(model, perspective, { mode: "native" });
  const baselineMonths = E.trendBaselineFor(model, perspective);
  const fleet = E.composeFleetFromDcRows(base, {
    modelId: model.id,
    dcRows: ["xai-colossus-c1", "xai-colossus-ii"],
    fill: "generic-us",
    id: "cf:t3fix201",
    name: "T3 FIX-2 permalink fleet",
  });
  const legitimateStates = [
    ["free", structuredClone(base)],
    ["locked-family", { ...structuredClone(base), trendMonths: baselineMonths + 1 }],
    ["locked-trend", { ...structuredClone(base), trendMonths: 0, famNvidia: 0.9 }],
    ["unlocked", { ...structuredClone(base), famNvidia: 0.9 }],
  ];
  const originalSource = E.customFleetSource();
  const source = { resolve: id => id === fleet.id ? fleet : null, list: () => [fleet] };
  const roundTripFailures = [];
  let cases = 0;
  try {
    E.registerCustomFleetSource(source);
    for (const [expectedInterlock, state] of legitimateStates) {
      const derived = E.deriveInterlockFor(state, baselineMonths);
      if (derived !== expectedInterlock) {
        roundTripFailures.push({ expectedInterlock, derived, phase: "fixture" });
        continue;
      }
      const traffic = { mode: "native", profileId: null,
        ioRatio: state.ioRatio, cacheHit: state.cacheHit };
      for (const [path, opts] of [["source", undefined], ["supplied", { customFleet: fleet }]]) {
        cases++;
        try {
          const token = E.encodeScenario(state, model.id, perspective.id, traffic, null,
            { fleet: fleet.id, totalCase: "preset", interlock: expectedInterlock }, opts);
          const decoded = E.decodeScenario(token);
          const raw = JSON.parse(Buffer.from(token.slice(3), "base64").toString("utf8"));
          const wireSections = raw?._meta?.fleet?.custom?.sections || [];
          if (!decoded
              || JSON.stringify(callerAuthoredSections(decoded._meta.fleet.custom.sections))
                !== JSON.stringify(callerAuthoredSections(fleet.sections))
              || wireSections.some(section => Object.hasOwn(section, "fallbackReceipts")
                || Object.hasOwn(section, "shareRounding"))) {
            roundTripFailures.push({ expectedInterlock, path, decoded: !!decoded,
              decodedSections: decoded?._meta?.fleet?.custom?.sections,
              wireDerivedKeys: wireSections.map(section => Object.keys(section)
                .filter(key => key === "fallbackReceipts" || key === "shareRounding")) });
          }
        } catch (error) {
          roundTripFailures.push({ expectedInterlock, path, error: error.message });
        }
      }
    }
  } finally {
    E.registerCustomFleetSource(originalSource);
  }
  assert(`T3FIX2-B1 source-backed v7 per-DC links round-trip caller-authored sections for every legitimate interlock (${cases})`,
    cases === 8 && roundTripFailures.length === 0, JSON.stringify(roundTripFailures));
  const wireValue = CF.validateCustomFleet({ ...fleet, wireVersion: "v7",
    sections: callerAuthoredSections(fleet.sections) }, { requireId: true });
  const changedCallerField = wireValue.ok ? structuredClone(wireValue.fleet) : null;
  if (changedCallerField) changedCallerField.sections[0].pue = 1.2;
  const appSource = readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
  assert("T3FIX2-B1 saved-fleet collision equality ignores derived receipt and wire-provenance fields",
    wireValue.ok && typeof CF.callerAuthoredFleetEqual === "function"
      && CF.callerAuthoredFleetEqual(fleet, wireValue.fleet)
      && !CF.callerAuthoredFleetEqual(fleet, changedCallerField)
      && /saved && callerAuthoredFleetEqual\(saved, v\.fleet\)/.test(appSource),
    wireValue.ok ? JSON.stringify({ saved: fleet, link: wireValue.fleet }) : wireValue.errors.join("; "));
}

/* Director A3: the live builder intentionally accepts partial totals while a reader
   types, so normalization must travel as an engine-owned receipt rather than refuse. */
{
  const model = E.MODELS.find((row) => row.id === "opus");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "median");
  const state = E.applyPresetSettings(model, perspective, { mode: "native" });
  const makeSection = (id, donorKey, sharePct) => ({ ...CF.makeBlankSection(id, sharePct),
    label: `${donorKey} declared section`,
    legs: [CF.makeLegFromDonor(donorKey, 100)] });
  const run = (sections, id) => {
    const validated = E.validateFleetSections({ id, name: "normalization disclosure",
      epoch: E.DEFAULTS_EPOCH, clonedFrom: null, sections });
    return validated.ok ? E.workload(state, undefined, undefined, { customFleet: validated.fleet }) : validated;
  };
  const lone = run([makeSection("s1", "h100", 70)], "cf:t3norm1");
  const pair = run([makeSection("s1", "h100", 60), makeSection("s2", "h200", 30)], "cf:t3norm2");
  assert("T3FIX-A3 lone declared 70 share discloses its normalization to 100",
    lone.composition?.[0]?.shareNormalization?.declaredSharePct === 70
      && lone.composition[0].shareNormalization.declaredTotalPct === 70
      && lone.composition[0].shareNormalization.normalizedSharePct === 100
      && lone.composition[0].receiptSentence.includes("normalized from a declared 70"),
    JSON.stringify(lone.composition));
  assert("T3FIX-A3 two sections declared 60+30 each disclose the shared 90 total",
    pair.composition?.length === 2
      && pair.composition.every((row) => row.shareNormalization?.declaredTotalPct === 90
        && row.receiptSentence.includes("declared shares summed to 90")),
    JSON.stringify(pair.composition));
}

/* im-arc T3 FIX-3 (2026-08-23), item C1: composed coverage percentages are DISPLAY
   numbers, so the one function that produces them rounds to one decimal and the one
   function that prints them formats a whole number bare. 59.99999999999999% is a
   float-accumulation artifact, never a coverage claim. The three parts are rounded
   INDEPENDENTLY and are never nudged to force an exact 100 — 99.9 or 100.1 is the
   honest display, so the sum is asserted inside a declared +/-0.15 band. */
{
  const model = E.MODELS.find((row) => row.id === "opus");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "gptpro-r3");
  const state = E.applyPresetSettings(model, perspective, { mode: "native" });
  const fleet = E.composeFleetFromDcRows(state, { modelId: model.id,
    dcRows: ["anthropic-rainier-trainium", "anthropic-tpu-commitment"], fill: "generic-us",
    id: "cf:t3f3cov", name: "FIX-3 coverage fixture" });
  const coverage = E.coverageForFleetSections(fleet.sections, model.id);
  const rendered = E.coverageSentenceParts(coverage);
  /* EXACT equality, not a tolerance: 59.99999999999999 sits within 1e-13 of a
     one-decimal value, so a tolerant predicate would pass on the very defect. */
  const atMostOneDecimal = (value) => Number.isFinite(value)
    && value === Math.round(value * 10) / 10;
  /* im-arc T4 fold (2026-08-24) [F3]: the three-part names, plus the subordinate non-additive
     count-backed number, which is rounded by the same one renderer. `modeledFleetShareEvidenced`
     is gone — it was a duplicate of the facility part under a name that invited reading it as a
     total. */
  const numericParts = [coverage.namedSiteServingEvidencePct, coverage.programmeTypeEvidencePct,
    coverage.genericFillPct, coverage.skuWorkloadCountBackedPct,
    ...rendered.parts.map((part) => part.value), ...Object.values(rendered.values),
    rendered.subordinate.value];
  assert("T3FIX3-C1 every composed coverage number carries at most one decimal place",
    numericParts.every(atMostOneDecimal), JSON.stringify(numericParts));
  /* im-arc T4 fold (2026-08-24): FOUR printed percentages now — the three additive parts plus the
     subordinate, explicitly non-additive SKU/workload count-backed line. */
  const printed = [...rendered.sentence.matchAll(/(\d+(?:\.\d+)?)%/g)].map((match) => match[1]);
  assert("T3FIX3-C1 the coverage sentence prints whole numbers bare and fractions to one decimal",
    printed.length === 4 && printed.every((text) => /^\d+(\.\d)?$/.test(text)),
    JSON.stringify({ printed, sentence: rendered.sentence }));
  const sum = rendered.parts.reduce((total, part) => total + part.value, 0);
  /* memo §6.1a: the band is 0.05 x the number of ADDITIVE parts, read off the row being checked —
     never the literal 0.15 this line used to carry, and never counting the non-additive line. */
  assert("T3FIX3-C1 the three rendered parts still sum to 100 inside the declared rounding band",
    Math.abs(sum - 100) <= rendered.roundingBand && rendered.roundingBand === 0.05 * rendered.parts.length,
    JSON.stringify({ sum, band: rendered.roundingBand, parts: rendered.parts.length }));
  /* The prominent page line renders exactly this expression (site/app.js
     renderFleetCoverageLine), so a formatter that lived in a caller instead of in
     coverageSentenceParts would break this identity. */
  assert("T3FIX3-C1 a second evaluation of the same composition renders the identical sentence",
    E.coverageSentenceParts(E.coverageForFleetSections(fleet.sections, model.id)).sentence
      === rendered.sentence, rendered.sentence);
}

/* im-arc T3 FIX-3 (2026-08-23), item C2 — same genus as A3 ("refuse loudly or
   disclose"). composeFleetFromDcRows partitions each blend donor across the selected
   rows by public accelerator count; a selected row whose accelerators intersect NO
   blend donor gets an empty allocation and registrySectionFromRow returns null. The
   partition rule stands (both reviewers accepted it) — the silence does not. */
{
  const model = E.MODELS.find((row) => row.id === "opus");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "gptpro-r3");
  const state = E.applyPresetSettings(model, perspective, { mode: "native" });
  const fleet = E.composeFleetFromDcRows(state, { modelId: model.id,
    dcRows: ["anthropic-rainier-trainium", "anthropic-tpu-commitment"], fill: "generic-us",
    id: "cf:t3f3nc", name: "FIX-3 dropped-row fixture" });
  const dcSections = fleet.sections.filter((section) => section.dcRef);
  assert("T3FIX3-C2 both Anthropic programme rows compose to exactly one dcRef section",
    dcSections.length === 1 && dcSections[0].dcRef === "anthropic-tpu-commitment",
    JSON.stringify(fleet.sections.map((section) => section.dcRef)));
  const coverage = E.coverageForFleetSections(fleet.sections, model.id);
  const notComposed = (coverage.receipts || []).filter((receipt) => receipt.classification === "not-composed");
  assert("T3FIX3-C2 the dropped row is disclosed as one not-composed receipt naming its hardware",
    notComposed.length === 1 && notComposed[0].rowId === "anthropic-rainier-trainium"
      && JSON.stringify(notComposed[0].hwKeys) === JSON.stringify(["trn2"])
      && /trn2/.test(notComposed[0].reason) && /gptpro-r3/.test(notComposed[0].reason)
      && /opus/.test(notComposed[0].reason),
    JSON.stringify(notComposed));
  assert("T3FIX3-C2 the not-composed receipt reaches the rendered coverage sentence",
    /anthropic-rainier-trainium/.test(E.coverageSentenceParts(coverage).sentence),
    E.coverageSentenceParts(coverage).sentence);
  /* Wire discipline (FIX-2 B1): the receipt is DERIVED data. It must never become a
     caller-authored v7 section field, and it must not disturb the validator's closed
     key sets, the codec, or the saved-versus-link collision equality. */
  const revalidated = E.validateFleetSections(structuredClone(fleet));
  assert("T3FIX3-C2 the composed fleet still round-trips the shared validator unchanged",
    revalidated.ok && CF.callerAuthoredFleetEqual(revalidated.fleet, fleet),
    JSON.stringify(revalidated.errors || []));
  const interlock = E.deriveInterlockFor(state, E.trendBaselineFor(model, perspective));
  const token = E.encodeScenario(state, model.id, perspective.id,
    { mode: "native", profileId: null, ioRatio: state.ioRatio, cacheHit: state.cacheHit }, null,
    { fleet: fleet.id, totalCase: "custom", interlock }, { customFleet: fleet });
  const decoded = E.decodeScenario(token);
  const wireSections = decoded && decoded._meta.fleet.custom ? decoded._meta.fleet.custom.sections : [];
  assert("T3FIX3-C2 no not-composed receipt travels in the v7 by-value wire",
    token.startsWith("v7.") && wireSections.length === fleet.sections.length
      && !/not-composed/.test(JSON.stringify(decoded._meta.fleet)),
    decoded ? JSON.stringify(decoded._meta.fleet).slice(0, 400) : "decode refused");
}

console.log(failures ? `\n${failures} FLEET-MODE T3 FAILURE(S)` : "\nALL FLEET-MODE T3 TESTS PASS");
process.exit(failures ? 1 : 0);
