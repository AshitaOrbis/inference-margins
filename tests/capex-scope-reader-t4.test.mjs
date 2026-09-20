/* im-arc T4 fold — READER-ENTERED CAPEX REQUIRES ITS SCOPE (round 4, 2026-08-25).
   Spec: research/im-arc-t4-fold-memo.md:41 (§2 clusterOh row) and :123 (§7).

     "Reader-entered capex (UI and MCP) REQUIRES `capexScope`, previews the effective clustered
      capex, and never silently assumes bare card; proprietary/finished-system observations are
      never normalised to invented bare-card values."

   Rounds 1-3 landed `capexScope` on the REGISTRY hardware rows and stopped there. The reader's
   own capex — a section `tco.capexUsdByHw`, a leg `overrides.capexUsd`, or the MCP section path —
   still went through with no scope at all, and silently took whatever overhead the registry row
   for that donor happened to carry. That is precisely the "silently assumes" the memo forbids:
   a reader who types an installed-system price for an H100 got it multiplied by the bare-card
   1.30, inventing a 30% cluster overhead on top of an observation that already contained one.

   The doctrine is not "capexScope exists in the schema"; it is that a stated capex without its
   input scope is MEANINGLESS and must be refused. So the negative cases below are the point, and
   the three-way differential is what proves the scope is actually consumed rather than stored.

   Run: node tests/capex-scope-reader-t4.test.mjs */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const CF = require("../site/custom-fleets.js");
const DC = require("../site/engine-data-dc-v1.js");

let pass = 0, fail = 0;
const assert = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name} — ${detail}`); }
};

const opus = E.MODELS.find((m) => m.id === "opus");
const median = E.PERSPECTIVES.find((p) => p.id === "median");
const state = () => E.pinReferenceLevers(E.applyPresetSettings(opus, median, { mode: "native" }));
const context = (s) => E.makeScenarioContext(opus, E.resolveTraffic(opus, median, { mode: "native" }), s.customDonor);
const leg = (donorKey = "h100", sharePct = 100, overrides = {}) =>
  ({ donorKey, label: `${donorKey} leg`, sharePct, overrides, family: CF.donorFamily(donorKey) });
const section = (extra = {}) => ({
  id: "s1", label: "s1", sharePct: 100, basis: "owned-strategic-tco",
  rent: null, electricity: null, pue: null, tco: extra.tco ?? null,
  dcRef: null, provenance: null, legs: extra.legs || [leg()],
});
const fleet = (sections) => ({ id: "cf:t4scope", name: "T4 scope", epoch: E.DEFAULTS_EPOCH, clonedFrom: null, sections });
const validate = (def) => CF.validateCustomFleet(def, { requireId: false });

/* ---------- 1. the negative cases — a stated capex without its scope is REFUSED ---------- */
{
  const noScope = validate(fleet([section({ tco: { capexUsdByHw: { h100: 30000 } } })]));
  assert("T4-CAPEXSCOPE-1 a SECTION capex with no capexScope is REJECTED",
    !noScope.ok && /capexScope/i.test(noScope.errors.join(" ")), JSON.stringify(noScope.errors || []));

  const legNoScope = validate(fleet([section({ legs: [leg("h100", 100, { capexUsd: 30000 })] })]));
  assert("T4-CAPEXSCOPE-1 a LEG override capex with no capexScope is REJECTED",
    !legNoScope.ok && /capexScope/i.test(legNoScope.errors.join(" ")), JSON.stringify(legNoScope.errors || []));

  const scopeNoCapex = validate(fleet([section({ tco: { capexScope: "bare-card" } })]));
  assert("T4-CAPEXSCOPE-1 a capexScope with NO stated capex is REJECTED — it describes a value, not a mood",
    !scopeNoCapex.ok && /capexScope/i.test(scopeNoCapex.errors.join(" ")), JSON.stringify(scopeNoCapex.errors || []));

  const badScope = validate(fleet([section({ tco: { capexUsdByHw: { h100: 30000 }, capexScope: "rack" } })]));
  assert("T4-CAPEXSCOPE-1 a capexScope outside the three closed values is REJECTED",
    !badScope.ok, JSON.stringify(badScope.errors || []));

  const good = validate(fleet([section({ tco: { capexUsdByHw: { h100: 30000 }, capexScope: "installed-system" } })]));
  assert("T4-CAPEXSCOPE-1 …and a stated capex WITH its scope is accepted",
    good.ok, JSON.stringify(good.errors || []));
}

/* ---------- 2. the differential — the scope is CONSUMED, not merely stored ----------
   Same reader capex, three scopes, three different clustered results in the ratio the schema
   declares. If any two of these collapse, the scope is decorative. */
{
  const CAPEX = 30000;
  const cost = (capexScope) => {
    const s = state();
    const def = fleet([section({ tco: { capexUsdByHw: { h100: CAPEX }, capexScope } })]);
    const validated = validate(def);
    if (!validated.ok) return { error: validated.errors.join("; ") };
    return E.blendedCosts(s, undefined, context(s), { customFleet: validated.fleet });
  };
  const results = Object.fromEntries(DC.DC_SCHEMA.CAPEX_SCOPES.map((sc) => [sc, cost(sc)]));
  const errored = Object.entries(results).filter(([, r]) => r.error);
  assert("T4-CAPEXSCOPE-2 all three scopes validate and price",
    errored.length === 0, JSON.stringify(errored));

  const out = Object.fromEntries(Object.entries(results).map(([sc, r]) => [sc, r.cOut]));
  const distinct = new Set(Object.values(out).map((v) => String(v)));
  assert("T4-CAPEXSCOPE-2 the three scopes produce THREE distinct costs — the scope is consumed",
    distinct.size === 3, JSON.stringify(out));
  /* installed-system already contains its clustering overhead, so it must be the CHEAPEST of the
     three; bare-card carries the largest declared overhead and must be the dearest. */
  assert("T4-CAPEXSCOPE-2 installed-system is the cheapest and bare-card the dearest, per the declared bands",
    out["installed-system"] < out["base-rack"] && out["base-rack"] < out["bare-card"],
    JSON.stringify(out));
}

/* ---------- 3. the PREVIEW the memo asks for ---------- */
{
  const s = state();
  const CAPEX = 30000;
  for (const scope of DC.DC_SCHEMA.CAPEX_SCOPES) {
    const validated = validate(fleet([section({ tco: { capexUsdByHw: { h100: CAPEX }, capexScope: scope } })]));
    const preview = E.readerCapexPreview(validated.fleet, s);
    const band = DC.DC_SCHEMA.CLUSTER_OH_BY_CAPEX_SCOPE[scope];
    const row = preview && preview.find((entry) => entry.hwKey === "h100");
    assert(`T4-CAPEXSCOPE-3 the effective CLUSTERED capex is previewed for ${scope}`,
      !!row && row.statedCapexUsd === CAPEX && row.capexScope === scope
        && Math.abs(row.effectiveClusteredCapexUsd - CAPEX * band.mid) < 1e-9
        && Math.abs(row.clusterOverhead - band.mid) < 1e-9,
      JSON.stringify(row));
  }
  /* And it says so in words a reader can check, naming the scope rather than a bare number. */
  const validated = validate(fleet([section({ tco: { capexUsdByHw: { h100: CAPEX }, capexScope: "installed-system" } })]));
  const row = E.readerCapexPreview(validated.fleet, s).find((entry) => entry.hwKey === "h100");
  assert("T4-CAPEXSCOPE-3 the preview carries a sentence that NAMES the scope",
    typeof row.sentence === "string" && row.sentence.includes("installed-system"), row && row.sentence);
}

/* ---------- 4. the wire definition carries the scope (a shared link reproduces the arithmetic) ----
   callerAuthoredFleetDefinition is what a saved fleet and a shared link are built from, and what
   the MCP section path round-trips. If the scope does not survive it, the same link prices
   differently for the next reader — the exact failure the memo's "one schema" rule exists to stop. */
{
  const withScope = validate(fleet([section({ tco: { capexUsdByHw: { h100: 30000 }, capexScope: "base-rack" } })]));
  const wire = CF.callerAuthoredFleetDefinition(withScope.fleet);
  assert("T4-CAPEXSCOPE-4 a SECTION capex and its scope survive the caller-authored wire definition",
    wire.sections[0].tco.capexScope === "base-rack" && wire.sections[0].tco.capexUsdByHw.h100 === 30000,
    JSON.stringify(wire.sections[0].tco));

  const legScope = validate(fleet([section({ legs: [leg("h100", 100, { capexUsd: 30000, capexScope: "installed-system" })] })]));
  const legWire = CF.callerAuthoredFleetDefinition(legScope.fleet);
  assert("T4-CAPEXSCOPE-4 a LEG capex and its scope survive the caller-authored wire definition",
    legWire.sections[0].legs[0].overrides.capexScope === "installed-system"
      && legWire.sections[0].legs[0].overrides.capexUsd === 30000,
    JSON.stringify(legWire.sections[0].legs[0].overrides));

  /* And the round trip re-validates — a wire form the validator would refuse is not a round trip. */
  const back = validate(legWire);
  assert("T4-CAPEXSCOPE-4 the wire form re-validates, so the link is replayable",
    back.ok, JSON.stringify(back.errors || []));

  /* Non-vacuity: strip the scope out of the wire and the replay must FAIL. */
  const stripped = JSON.parse(JSON.stringify(legWire));
  delete stripped.sections[0].legs[0].overrides.capexScope;
  const strippedBack = validate(stripped);
  assert("T4-CAPEXSCOPE-4 a wire form with the scope stripped is REFUSED on replay",
    !strippedBack.ok && /capexScope/i.test(strippedBack.errors.join(" ")),
    JSON.stringify(strippedBack.errors || []));
}

/* ---------- 5. ROUND 6 — the historical escape must be an ASSERTION, never an inference ----------
   Round 4 let a replay skip the scope rule by keying the escape on DC_SCHEMA being absent. That
   made "the schema is missing" and "the caller is deliberately replaying history" the same
   condition, and a plain wiring omission in the browser branch of cfDcData() therefore disabled
   the rule on the whole browser surface without a sound. The escape is now keyed on an explicit
   flag the pin sets. These two cases are what stop it regressing: a registry with no schema and
   no flag must ERROR LOUDLY, and only the declared pin may opt out. */
{
  const registryPath = require.resolve("../site/engine-data-dc-v1.js");
  const entry = require.cache[registryPath];
  const live = entry.exports;
  const withRegistry = (swap, fn) => { entry.exports = swap; try { return fn(); } finally { entry.exports = live; } };
  const noScopeFleet = fleet([section({ tco: { capexUsdByHw: { h100: 30000 } } })]);

  const { DC_SCHEMA, ...schemaless } = live;
  const result = withRegistry(schemaless, () => validate(noScopeFleet));
  assert("T4-CAPEXSCOPE-5 a registry with NO schema and NO pin flag is a loud ERROR, not a silent skip",
    !result.ok && /unreachable/i.test(result.errors.join(" ")), JSON.stringify(result.errors || result.ok));

  const pinned = withRegistry({ ...schemaless, __preT4RegistryPin: true }, () => validate(noScopeFleet));
  assert("T4-CAPEXSCOPE-5 …and ONLY the explicitly declared historical pin may opt out",
    pinned.ok === true, JSON.stringify(pinned.errors || []));

  /* And the live registry, untouched, still enforces — proving the swap above was the variable. */
  assert("T4-CAPEXSCOPE-5 the live registry still refuses a scope-less capex",
    validate(noScopeFleet).ok === false, "the live path stopped enforcing");
}

console.log(fail ? `\n${fail} CAPEX-SCOPE READER T4 FAILURE(S)` : "\nALL CAPEX-SCOPE READER T4 TESTS PASS");
process.exit(fail ? 1 : 0);
