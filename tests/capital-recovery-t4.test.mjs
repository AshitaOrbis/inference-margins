/* im-arc T4 fold (2026-08-24) — capital recovery as an explicit NAMED BASIS.
   Spec: research/im-arc-t4-fold-memo.md §2.1 [F6], §9 question 1.

   The load-bearing claim: a DISPLAY TIER MAY NEVER MUTATE ARITHMETIC. v1 of the memo would
   have made "advanced" itself an input — opening the advanced panel would have switched the
   cost model. Folded: `capitalRecovery` is a scenario field with ONE canonical default, `off`,
   identical in the basic UI, the advanced UI, the v7 codec and MCP. Advanced EXPOSES the basis
   and its disclosed delta; it does not activate it.

   Formula, specified before coding and with no double-counted principal:
     the straight-line depreciation lines STAY;
     a separate disclosed line adds
       increment ($/hr) = [CRF(r, L) - 1/L] x financed capital / 8760,
       CRF(r, L) = r(1+r)^L / ((1+r)^L - 1),
     so the increment is 0 at r = 0 and the two lines sum to CRF x capital / 8760.
   Two increments, each its own disclosed line: clustered accelerator capex at `lifeYears`,
   and facility shell + MEP at `dcLifeYears`.
   Run: node tests/capital-recovery-t4.test.mjs */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");

let failures = 0;
function assert(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : " — " + detail}`);
  if (!cond) failures++;
}
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
const tco = (over = {}) => Object.assign(structuredClone(E.DEFAULTS), { hwMode: "tco" }, over);
const crf = (r, L) => r === 0 ? 1 / L : (r * Math.pow(1 + r, L)) / (Math.pow(1 + r, L) - 1);

/* ---------- 1. ONE canonical default, off, everywhere ---------- */
assert("T4-CR-1 the canonical default is off",
  E.DEFAULTS.capitalRecovery === "off", String(E.DEFAULTS.capitalRecovery));
assert("T4-CR-1 the field is a closed enum reachable through the shared sanitizer",
  JSON.stringify(E.SCENARIO_BOUNDS.capitalRecovery) === JSON.stringify(["off", "on"])
    && E.sanitizeScenarioDiff({ capitalRecovery: "on" }, { mode: "native" }, tco()).diff.capitalRecovery === "on"
    && E.sanitizeScenarioDiff({ capitalRecovery: "maybe" }, { mode: "native" }, tco()).rejected.length === 1);
assert("T4-CR-1 the cost of capital is a bounded named basis with the adopted middle",
  E.DEFAULTS.costOfCapitalPct === 8.5 && Array.isArray(E.SCENARIO_BOUNDS.costOfCapitalPct));
/* Corner mapping: a HIGHER cost of capital is a HIGHER cost, so the cost-bottom corner is 6%. */
{
  const band = E.tcoDefaultBands().costOfCapitalPct;
  assert("T4-CR-1 corners map cost-bottom 6% / middle 8.5% / cost-top 13%",
    band.lo === 6 && band.mid === 8.5 && band.hi === 13
      && band.costCorners.bottom === 6 && band.costCorners.top === 13,
    JSON.stringify(band));
}

/* ---------- 2. off is INERT — byte-identical to the pre-fold straight line ---------- */
for (const key of ["h100", "gb200", "tpu7"]) {
  const hw = E.hardwareRow(key);
  const off = E.hwHourParts(hw, tco(), null);
  assert(`T4-CR-2 ${key} carries a zero capital-recovery line while off`,
    off.capitalRecoveryAccelerator === 0 && off.capitalRecoveryFacility === 0
      && close(E.hwHourCost(hw, tco(), null), off.capex + off.power + off.dc + off.opex),
    JSON.stringify(off));
}

/* ---------- 3. the formula, checked against its own definition ---------- */
{
  const hw = E.hardwareRow("h100");
  const state = tco({ capitalRecovery: "on", costOfCapitalPct: 8.5 });
  const parts = E.hwHourParts(hw, state, null);
  const financedAccelerator = hw.capex * E.clusterOverheadFor("h100", state);
  const financedFacility = state.dcPerW * hw.tdp * 1000;
  const r = 0.085;
  const expectedAccelerator = (crf(r, state.lifeYears) - 1 / state.lifeYears) * financedAccelerator / 8760;
  const expectedFacility = (crf(r, state.dcLifeYears) - 1 / state.dcLifeYears) * financedFacility / 8760;
  assert("T4-CR-3 the accelerator increment is [CRF(r,L) - 1/L] x clustered capex / 8760",
    close(parts.capitalRecoveryAccelerator, expectedAccelerator),
    JSON.stringify([parts.capitalRecoveryAccelerator, expectedAccelerator]));
  assert("T4-CR-3 the facility increment uses the FACILITY life, not the accelerator life",
    close(parts.capitalRecoveryFacility, expectedFacility)
      && !close(parts.capitalRecoveryFacility,
        (crf(r, state.lifeYears) - 1 / state.lifeYears) * financedFacility / 8760),
    JSON.stringify([parts.capitalRecoveryFacility, expectedFacility]));
  /* No double-counted principal: straight line + increment must equal CRF x capital / 8760. */
  assert("T4-CR-3 straight line plus increment equals CRF x capital / 8760 (no double count)",
    close(parts.capex + parts.capitalRecoveryAccelerator,
      crf(r, state.lifeYears) * financedAccelerator / 8760)
      && close(parts.dc + parts.capitalRecoveryFacility,
        crf(r, state.dcLifeYears) * financedFacility / 8760),
    JSON.stringify(parts));
  assert("T4-CR-3 the hourly cost is the sum of its disclosed lines",
    close(E.hwHourCost(hw, state, null),
      parts.capex + parts.power + parts.dc + parts.opex
        + parts.capitalRecoveryAccelerator + parts.capitalRecoveryFacility),
    JSON.stringify(parts));
}
/* The increment is exactly 0 at r = 0 — the boundary the formula is designed around. */
assert("T4-CR-3 the increment is exactly zero at a zero cost of capital",
  (() => {
    const parts = E.hwHourParts(E.hardwareRow("h100"), tco({ capitalRecovery: "on", costOfCapitalPct: 0 }), null);
    return close(parts.capitalRecoveryAccelerator, 0) && close(parts.capitalRecoveryFacility, 0);
  })());
/* Monotone in r — a higher cost of capital can never lower the hourly cost. */
assert("T4-CR-3 a higher cost of capital never lowers the hourly cost",
  E.hwHourCost(E.hardwareRow("h100"), tco({ capitalRecovery: "on", costOfCapitalPct: 13 }), null)
    > E.hwHourCost(E.hardwareRow("h100"), tco({ capitalRecovery: "on", costOfCapitalPct: 6 }), null));

/* ---------- 4. a DISPLAY TIER MAY NEVER MUTATE ARITHMETIC ---------- */
{
  /* The same declared state rendered through the basic tier and the advanced tier must be
     byte-identical. This is the assertion the whole fold of [F6] exists to make true. */
  const model = E.MODELS.find((row) => row.id === "opus");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "median");
  const render = (tier, capitalRecovery) => {
    const state = E.applyPresetSettings(model, perspective, { mode: "native" });
    state.hwMode = "tco"; state.capitalRecovery = capitalRecovery;
    const ctx = E.scenarioContext(state);
    return JSON.stringify([E.workload(state, undefined, ctx, E.tierRenderOptions(tier)),
      E.blendedCosts(state, undefined, ctx)]);
  };
  assert("T4-CR-4 the same state renders byte-identically from the basic and advanced tiers (off)",
    render("basic", "off") === render("advanced", "off"));
  assert("T4-CR-4 the same state renders byte-identically from the basic and advanced tiers (on)",
    render("basic", "on") === render("advanced", "on"));
  assert("T4-CR-4 opening advanced does NOT activate the basis",
    render("advanced", "off") !== render("advanced", "on"));
}
/* Advanced EXPOSES the named basis and its disclosed delta without activating it. */
{
  const state = tco();
  const disclosure = E.capitalRecoveryDisclosure(state);
  assert("T4-CR-4 advanced exposes the named basis, its state, and its would-be delta",
    disclosure && disclosure.active === false
      && /economic capital recovery \(CRF\)/i.test(disclosure.label)
      && disclosure.deltaUsdPerHrIfOn > 0
      && /straight-line/i.test(disclosure.against),
    JSON.stringify(disclosure));
}

/* ---------- 5. the field travels the codec and reproduces ---------- */
{
  const model = E.MODELS.find((row) => row.id === "opus");
  const perspective = E.PERSPECTIVES.find((row) => row.id === "median");
  const state = E.applyPresetSettings(model, perspective, { mode: "native" });
  state.hwMode = "tco"; state.capitalRecovery = "on"; state.costOfCapitalPct = 13;
  const traffic = E.resolveTraffic(model, perspective, { mode: "native" });
  const ids = { fleet: "custom", totalCase: "custom" };
  const link = E.encodeScenario(state, model.id, perspective.id, traffic, null, ids);
  const back = E.decodeScenario(link);
  /* decodeScenario returns the DIFF against the clean identity baseline, plus `_meta`. */
  assert("T4-CR-5 an on state survives the live codec with its cost of capital",
    back && back.capitalRecovery === "on" && back.costOfCapitalPct === 13
      && back._meta && back._meta.model === "opus",
    JSON.stringify(back));
  /* A legacy link that predates the field decodes to the canonical default, never to `on`. */
  const legacy = E.decodeScenario(E.encodeScenario(
    Object.assign(E.applyPresetSettings(model, perspective, { mode: "native" }), { hwMode: "tco" }),
    model.id, perspective.id, traffic, null, ids));
  /* A link minted with the field at its default carries NO key for it, so a legacy link that
     predates the field decodes identically — and resolves to the canonical default, never `on`. */
  assert("T4-CR-5 a link with the field absent decodes to the canonical default off",
    legacy && !("capitalRecovery" in legacy) && !("costOfCapitalPct" in legacy)
      && E.DEFAULTS.capitalRecovery === "off",
    JSON.stringify(legacy));
  /* And the sanitizer refuses to smuggle an out-of-domain value in through a shared link. */
  assert("T4-CR-5 a forged link value is rejected, never clamped",
    E.sanitizeScenarioDiff({ costOfCapitalPct: 999 }, { mode: "native" }, tco()).rejected.length === 1
      && E.sanitizeScenarioDiff({ capitalRecovery: "ON" }, { mode: "native" }, tco()).rejected.length === 1);
}

console.log(failures ? `\n${failures} CAPITAL-RECOVERY T4 FAILURE(S)` : "\nALL CAPITAL-RECOVERY T4 TESTS PASS");
process.exit(failures ? 1 : 0);
