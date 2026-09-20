// im-arc T2 fix (Sol review 2026-08-23, finding P1-4): codec differential.
// Historical minted tokens retain their visible deprecation contract; every legacy-v6
// custom-fleet case used by the builder/CDP path survives normalize/re-encode byte-for-byte.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const CF = require("../site/custom-fleets.js");
const CORPUS = require("./fixtures-minted-tokens-v211.json");

let failures = 0;
const assert = (name, condition, detail = "") => {
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${condition ? "" : " — " + detail}`);
  if (!condition) failures++;
};
const opus = E.MODELS.find(model => model.id === "opus");
const median = E.PERSPECTIVES.find(row => row.id === "median");
const native = { mode: "native" };
const traffic = E.resolveTraffic(opus, median, native);
const context = state => E.makeScenarioContext(opus, traffic, state.customDonor);
const leg = (donorKey, sharePct, overrides = {}) => ({ donorKey, label: donorKey + " leg",
  sharePct, overrides, basisDeclared: "inherit", family: CF.donorFamily(donorKey) });

const historical = [...CORPUS.v4, ...CORPUS.historical];
const historicalVisible = historical.map(row => E.decodeScenario(row.token));
assert("T2-FIX-P1-4 all 84 minted v2.1.11 tokens preserve the explicit deprecation surface",
  historicalVisible.length === 84 && historicalVisible.every(result => result
    && result.__epochDeprecated === true
    && ["v2", "v3", "v4"].includes(result.schema)
    && Object.keys(result).sort().join(",") === "__epochDeprecated,schema"),
  JSON.stringify({ count: historicalVisible.length,
    schemas: [...new Set(historicalVisible.map(result => result && result.schema))] }));

/* These are the legacy by-value shapes the custom-fleet browser path minted before
   T2 promoted the builder to explicit sections. They exercise duplicate donors,
   a donor change, and visible cost/electricity overrides. */
const cdpV6Cases = [
  { id: "cf:cdpv6001", name: "CDP legacy duplicate", epoch: E.DEFAULTS_EPOCH, clonedFrom: null,
    legs: [leg("h800", 60), leg("h800", 40, { kwhPerKwh: 0.25 })] },
  { id: "cf:cdpv6002", name: "CDP legacy donor edit", epoch: E.DEFAULTS_EPOCH, clonedFrom: null,
    legs: [leg("h100", 55), leg("h100", 45, { boardPowerW: 650 })] },
];

for (const original of cdpV6Cases) {
  const state = E.applyPresetSettings(opus, median, native);
  state.blend = CF.aggregateLegsToBlend(original);
  const source = { [original.id]: original };
  E.registerCustomFleetSource({ resolve: id => source[id] || null, ids: () => Object.keys(source) });
  try {
    const token = E.encodeScenario(state, opus.id, median.id, traffic, null,
      { fleet: original.id, totalCase: "custom" });
    const decoded = E.decodeScenario(token);
    const normalized = CF.validateCustomFleet({ id: decoded._meta.fleet.id,
      name: decoded._meta.fleet.custom.name, epoch: decoded._meta.epoch,
      clonedFrom: decoded._meta.fleet.custom.clonedFrom, legs: decoded._meta.fleet.custom.legs },
      { requireId: true, wireVersion: decoded._meta.schema });
    source[original.id] = normalized.fleet;
    const reencoded = E.encodeScenario(state, opus.id, median.id, traffic, null,
      { fleet: original.id, totalCase: "custom" });
    const redecode = E.decodeScenario(reencoded);
    const before = E.workload(state, undefined, context(state), { customFleet: original });
    const after = E.workload(state, undefined, context(state), { customFleet: normalized.fleet });
    const labels = E.resolveFleetSections(state, { customFleet: normalized.fleet })
      .map(row => row.section.basis);
    assert(`T2-FIX-P1-4 ${original.id} decode-normalize-encode-decode is byte/output/label identical`,
      token.startsWith("v6.") && normalized.ok && normalized.fleet.wireVersion === "v6"
        && reencoded === token && redecode && redecode._meta.schema === "v6"
        && before.margin === after.margin && before.costMix === after.costMix
        && JSON.stringify(before.composition) === JSON.stringify(after.composition)
        && labels.length === 1 && labels[0] !== "inherit",
      JSON.stringify({ prefix: token.slice(0, 3), byteEqual: reencoded === token,
        before: { margin: before.margin, costMix: before.costMix, composition: before.composition },
        after: { margin: after.margin, costMix: after.costMix, composition: after.composition }, labels }));
  } finally {
    E.registerCustomFleetSource(CF.CF_RUNTIME);
  }
}

/* im-arc T2 fix (Sol review 2026-08-23, finding P1-4): a matching explicit
   legacy declaration is wire provenance, not runtime state. Normalization hides
   it from section consumers but must reproduce its bytes when semantics match. */
{
  const x90 = E.PERSPECTIVES.find(row => row.id === "x90-v1");
  const x90Traffic = E.resolveTraffic(opus, x90, native);
  const original = { id: "cf:cdpv6003", name: "CDP matching declaration",
    epoch: E.DEFAULTS_EPOCH, clonedFrom: null,
    legs: [{ ...leg("h800", 100), basisDeclared: "owned-strategic-tco" }] };
  const state = E.applyPresetSettings(opus, x90, native);
  state.blend = CF.aggregateLegsToBlend(original);
  const source = { [original.id]: original };
  E.registerCustomFleetSource({ resolve: id => source[id] || null, ids: () => Object.keys(source) });
  try {
    const token = E.encodeScenario(state, opus.id, x90.id, x90Traffic, null,
      { fleet: original.id, totalCase: "custom" });
    const decoded = E.decodeScenario(token);
    const normalized = CF.validateCustomFleet({ id: decoded._meta.fleet.id,
      name: decoded._meta.fleet.custom.name, epoch: decoded._meta.epoch,
      clonedFrom: decoded._meta.fleet.custom.clonedFrom, legs: decoded._meta.fleet.custom.legs },
      { requireId: true, wireVersion: decoded._meta.schema });
    source[original.id] = normalized.fleet;
    const reencoded = E.encodeScenario(state, opus.id, x90.id, x90Traffic, null,
      { fleet: original.id, totalCase: "custom" });
    const before = E.workload(state, undefined,
      E.makeScenarioContext(opus, x90Traffic, state.customDonor), { customFleet: original });
    const after = E.workload(state, undefined,
      E.makeScenarioContext(opus, x90Traffic, state.customDonor), { customFleet: normalized.fleet });
    assert("T2-FIX-P1-4 matching non-inherit v6 declaration remains byte-identical after normalization",
      token.startsWith("v6.") && normalized.ok
        && JSON.stringify(normalized.fleet.wireLegacyBases) === '["owned-strategic-tco"]'
        && !Object.prototype.hasOwnProperty.call(normalized.fleet.sections[0].legs[0], "basisDeclared")
        && reencoded === token && before.margin === after.margin
        && E.resolveFleetSections(state, { customFleet: normalized.fleet })[0].section.basis
          === "owned-strategic-tco",
      JSON.stringify({ prefix: token.slice(0, 3), byteEqual: reencoded === token,
        wireLegacyBases: normalized.fleet && normalized.fleet.wireLegacyBases,
        margins: [before.margin, after.margin] }));
  } finally {
    E.registerCustomFleetSource(CF.CF_RUNTIME);
  }
}

/* im-arc T2 fix (Sol review 2026-08-23, finding P1-4): wire provenance
   cannot override semantic identity. Once an edit needs section fields, the
   encoder must promote to v7 and carry every section rather than truncating. */
{
  const original = cdpV6Cases[0];
  const state = E.applyPresetSettings(opus, median, native);
  state.blend = CF.aggregateLegsToBlend(original);
  const source = { [original.id]: original };
  E.registerCustomFleetSource({ resolve: id => source[id] || null, ids: () => Object.keys(source) });
  try {
    const token = E.encodeScenario(state, opus.id, median.id, traffic, null,
      { fleet: original.id, totalCase: "custom" });
    const decoded = E.decodeScenario(token);
    const normalized = CF.validateCustomFleet({ id: decoded._meta.fleet.id,
      name: decoded._meta.fleet.custom.name, epoch: decoded._meta.epoch,
      clonedFrom: decoded._meta.fleet.custom.clonedFrom, legs: decoded._meta.fleet.custom.legs },
      { requireId: true, wireVersion: decoded._meta.schema });
    const edited = structuredClone(normalized.fleet);
    edited.sections[0].sharePct = 60;
    edited.sections[0].basis = "owned-strategic-tco";
    edited.sections[0].electricity = { usdPerKwh: 0.11 };
    edited.sections.push({ id: "s2", label: "added section", sharePct: 40,
      basis: "committed-planning-rent", rent: { mode: "flat", usdPerHr: 2.25 },
      electricity: null, pue: null, tco: null, dcRef: null,
      provenance: "Codec semantic-identity promotion probe.",
      legs: [{ donorKey: "h100", label: "h100 added", sharePct: 100,
        overrides: {}, family: CF.donorFamily("h100") }] });
    source[original.id] = edited;
    state.blend = CF.aggregateLegsToBlend(edited);
    const promoted = E.encodeScenario(state, opus.id, median.id, traffic, null,
      { fleet: original.id, totalCase: "custom" });
    const promotedDecoded = E.decodeScenario(promoted);
    const sections = promotedDecoded && promotedDecoded._meta.fleet.custom.sections;
    assert("T2-FIX-P1-4 edited v6 provenance promotes to v7 without dropping section semantics",
      token.startsWith("v6.") && promoted.startsWith("v7.") && Array.isArray(sections)
        && sections.length === 2 && sections[0].basis === "owned-strategic-tco"
        && sections[0].electricity.usdPerKwh === 0.11
        && sections[1].basis === "committed-planning-rent"
        && sections[1].rent.mode === "flat" && sections[1].rent.usdPerHr === 2.25,
      JSON.stringify({ prefixes: [token.slice(0, 3), promoted.slice(0, 3)], sections }));
  } finally {
    E.registerCustomFleetSource(CF.CF_RUNTIME);
  }
}

console.log(failures ? `\n${failures} CODEC-WIRE DIFFERENTIAL T2 FAILURE(S)`
  : "\nALL CODEC-WIRE DIFFERENTIAL T2 TESTS PASS");
process.exit(failures ? 1 : 0);
