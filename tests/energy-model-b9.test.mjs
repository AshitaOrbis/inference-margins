// b9 M3 energy/electricity dimension (plan §5 M3; memo research/b9-m3-energy-memo.md §6) —
// the permanent gate for the energy surface + procurement-basis machinery.
// T1 rent-lens invariance · T2 $↔Wh identity · T3 mix-identity mirror + NaN propagation ·
// T4 boardPowerW override discipline · T5 basis typing + mixing trap · T6 magnitude window ·
// T7 no-number-moves tripwire + family completeness.
// Run: node tests/energy-model-b9.test.mjs
// Twin rule: the ONLY sanctioned differences between this file and its twin are the `// Run:`
// comment line and require(...) path strings; all other bytes must remain identical.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const ED = require("../site/engine-data-v22.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};

const opus = E.MODELS.find(m => m.id === "opus");
const median = E.PERSPECTIVES.find(p => p.id === "median");
/* b9 M5 fixture scope (M5 delta manifest): M3's governing invariant — "M3 moves no shipped
   number", certified by the byte-identical reference margin below — is a statement about the
   REFERENCE state. M5 adds a scenario-prior multiplier whose default is +3 months for Anthropic,
   so the flagship state here is pinned to the trend-0 / family-1.0 reference (the same
   constructor the FA uses). Every pin in this suite is byte-unchanged. The $↔Wh identity is
   re-asserted UNDER a nonzero trend and family in tests/trendline-interlock-b9.test.mjs T-5. */
const flagship = E.pinReferenceLevers(E.applyPresetSettings(opus, median, { mode: "native" }));
const flagCtx = E.scenarioContext(flagship);

/* ---------- T7 first (cheapest, most load-bearing): the no-number-moves tripwire ---------- */
{ const wl = E.workload(flagship);
  /* im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok.
     This is the "no number moves" tripwire, and a number moved — by owner ruling, which is the one
     thing it was always going to have to admit. Re-minted to the post-adoption reference. What the
     tripwire still does is exactly what it did: any change to this energy model that moves the
     flagship reading by a single bit fails here, and nothing in THIS suite is permitted to move it. */
  assert("T7: flagship reference margin byte-identical 0.5843046405779231",
    wl.margin === 0.5843046405779231, String(wl.margin));
  const fams = ["nvidia", "tpu", "trainium", "ascend"];
  const rows = [...E.HW_ORDER, "rubin"];
  assert("T7: family present and in the closed set on every HW_ROOFLINE row + rubin",
    rows.every(k => fams.includes(ED.HW_ROOFLINE[k].family)),
    JSON.stringify(rows.map(k => [k, ED.HW_ROOFLINE[k].family])));
  assert("T7: family map matches the memo §3.1 assignment",
    ED.HW_ROOFLINE.tpu7.family === "tpu" && ED.HW_ROOFLINE.trn2.family === "trainium"
    && ED.HW_ROOFLINE.trn3.family === "trainium" && ED.HW_ROOFLINE.ascend.family === "ascend"
    && ["h100", "h200", "gb200", "gb300", "h800", "h20", "rubin"].every(k => ED.HW_ROOFLINE[k].family === "nvidia")); }

/* ---------- T1: rent-lens invariance under kwh/pue movement ---------- */
{ const rentPersps = E.PERSPECTIVES.filter(p => (p.set.hwMode ?? "rent") === "rent" && p.id !== "dive");
  let allInvariant = true, detail = "";
  for (const p of rentPersps) {
    const s = E.applyPresetSettings(opus, p, { mode: "native" });
    const ctx = E.scenarioContext(s);
    const before = E.workload(s);
    for (const [kwh, pue] of [[0.03, 1.05], [0.15, 1.5]]) {
      const s2 = structuredClone(s); s2.kwh = kwh; s2.pue = pue;
      E.registerScenarioContext(s2, ctx);
      const after = E.workload(s2);
      const same = (Object.is(after.costMix, before.costMix)) && (Object.is(after.margin, before.margin))
        && (Object.is(after.cIn, before.cIn)) && (Object.is(after.cOut, before.cOut));
      if (!same) { allInvariant = false; detail += ` ${p.id}@${kwh}/${pue}`; }
    }
  }
  assert("T1: every rent-basis lens is BYTE-invariant under kwh/pue sweeps (costMix, margin, cIn, cOut)",
    allInvariant, detail);
  // and the TCO lens MUST move (the sweep is not vacuous):
  const st = E.applyPresetSettings(opus, E.PERSPECTIVES.find(p => p.id === "x90-v1"), { mode: "native" });
  const ctxT = E.scenarioContext(st);
  const beforeT = E.workload(st);
  const st2 = structuredClone(st); st2.kwh = 0.15; E.registerScenarioContext(st2, ctxT);
  assert("T1: the owned/strategic-TCO lens moves on the same sweep (non-vacuous)",
    E.workload(st2).costMix !== beforeT.costMix); }

/* ---------- T2: the exact $↔Wh identity under owned/strategic TCO ---------- */
{ const st = E.applyPresetSettings(opus, E.PERSPECTIVES.find(p => p.id === "x90-v1"), { mode: "native" });
  const ctx = E.scenarioContext(st);
  const fe = E.fleetEnergy(st, undefined, ctx);
  let worst = 0, legsChecked = 0;
  for (const l of fe.legs.filter(x => x.renderable)) {
    for (const kind of ["in", "out"]) {
      const hw = E.HW[l.k];
      const tps = E.tokPerS(hw, st, kind, undefined, ctx);
      const powerDollars = E.hwHourParts(hw, st).power / 3600 / tps * 1e6 / (st.util / 100);
      const eWh = kind === "in" ? l.eIn : l.eOut;
      const fromEnergy = eWh * (st.kwh / 1000) / (st.util / 100);
      worst = Math.max(worst, Math.abs(powerDollars - fromEnergy) / powerDollars);
      legsChecked++;
    }
  }
  assert(`T2: electricity $/Mtok == Wh/Mtok × $/kWh ÷ util on every renderable leg×kind (${legsChecked} checked)`,
    legsChecked > 0 && worst <= 1e-12, "worst rel err " + worst); }

/* ---------- T3: mix-identity mirror + NaN propagation ---------- */
{ const fe = E.fleetEnergy(flagship, undefined, flagCtx);
  const R = flagship.ioRatio, h = flagship.cacheHit / 100, cc = flagship.cacheCost / 100;
  const b = fe.blended;
  const expected = (b.eOut + R * ((1 - h) * b.eIn + h * (b.eIn * cc))) / (R + 1);
  assert("T3: blended eMix mirrors the computeMix cost identity byte-for-byte",
    Object.is(b.eMix, expected), `${b.eMix} vs ${expected}`);
  assert("T3: per-leg eCache = eIn × cacheCost (the disclosed proxy)",
    fe.legs.filter(l => l.renderable).every(l => Object.is(l.eCache, l.eIn * cc)));
  // renderability parity with the cost surface at the flagship default (memo §2.1: energy
  // renders wherever THROUGHPUT renders; every HW_ORDER row is priced, so the sets coincide):
  const costs = E.blendedCosts(flagship, undefined, flagCtx);
  const costLegs = Object.fromEntries(costs.fleetRenderable.legStatuses.map(l => [l.hwKey, l.renderableUnderPolicy]));
  assert("T3: energy legs and cost legs cover the same keys",
    fe.legs.length === costs.fleetRenderable.totalLegs
    && fe.legs.every(l => l.k in costLegs));
  // an infeasible leg propagates NaN, fail-closed like cost. The probe must be TYPED
  // infeasible, not capped (capped legs legitimately render): 6T total at BF16 on a
  // trn2-only blend — 12 TB of weights cannot fit any legal width of the 64-chip
  // UltraServer domain, so no legal width exists (verified 0/1 cost legs on the same state).
  const sBad = structuredClone(flagship); sBad.total = 6000; sBad.precision = "bf16"; sBad.blend = { trn2: 100 };
  E.registerScenarioContext(sBad, flagCtx);
  const feBad = E.fleetEnergy(sBad, undefined, flagCtx);
  const cBad = E.blendedCosts(sBad, undefined, flagCtx);
  assert("T3: typed-infeasible leg → NaN energy and NaN blended (fail-closed), in parity with cost",
    feBad.legs.every(l => !l.renderable) && Number.isNaN(feBad.blended.eMix)
    && cBad.fleetRenderable.renderableLegs === 0); }

/* ---------- T4: boardPowerW override discipline ---------- */
{ const rows = [...E.HW_ORDER, "rubin"];
  assert("T4: every registered boardPowerW is null (a silently populated value is a FINDING)",
    rows.every(k => ED.HW_ROOFLINE[k].boardPowerW === null),
    JSON.stringify(rows.map(k => [k, ED.HW_ROOFLINE[k].boardPowerW])));
  // synthetic override through the live resolver: opPowerKw must scale energy AND the TCO
  // power term together, and leave rent-basis numbers untouched (memo §7 decision 3).
  const st = E.applyPresetSettings(opus, E.PERSPECTIVES.find(p => p.id === "x90-v1"), { mode: "native" });
  const ctx = E.scenarioContext(st);
  const hw = E.HW.h200;
  const tdpKw = hw.tdp;
  const before = { e: E.energyPerMtok(hw, st, "out", undefined, ctx), p: E.hwHourParts(hw, st).power };
  const rentBefore = E.workload(flagship).costMix;
  ED.HW_ROOFLINE.h200.boardPowerW = 500; // 0.5 kW operating override
  try {
    const after = { e: E.energyPerMtok(hw, st, "out", undefined, ctx), p: E.hwHourParts(hw, st).power };
    const scale = 0.5 / tdpKw;
    assert("T4: a populated boardPowerW scales energy by exactly boardPowerW/tdp",
      Math.abs(after.e / before.e - scale) < 1e-12, `${after.e / before.e} vs ${scale}`);
    assert("T4: the same override scales the TCO power term identically (one resolver, two surfaces)",
      Math.abs(after.p / before.p - scale) < 1e-12, `${after.p / before.p} vs ${scale}`);
    assert("T4: rent-basis numbers are untouched by the override",
      Object.is(E.workload(flagship).costMix, rentBefore));
  } finally { ED.HW_ROOFLINE.h200.boardPowerW = null; }
  assert("T4: registry restored after the synthetic override", ED.HW_ROOFLINE.h200.boardPowerW === null); }

/* ---------- T5: procurement-basis typing + the mixing trap ---------- */
{ const rows = [...E.HW_ORDER, "rubin"];
  assert("T5: every rent cell (HW_ROOFLINE row + rubin) carries rentBasis in the closed enum",
    rows.every(k => E.PROCUREMENT_BASES.includes(ED.HW_ROOFLINE[k].rentBasis)));
  assert("T5: every row's rentBasis is committed-planning-rent (the M1-repaired planning vector)",
    rows.every(k => ED.HW_ROOFLINE[k].rentBasis === "committed-planning-rent"));
  // memo §3.2 classification table, asserted verbatim:
  const expectedPersp = {
    median: "committed-planning-rent", dive: "model-dive", "x90-v1": "owned-strategic-tco",
    "x80-v3": "committed-planning-rent", "x80-v4": "committed-planning-rent", "x60-v3": "committed-planning-rent",
    gptpro: "committed-planning-rent",
    /* row 499 (delta manifest research/b9-delta-manifests/row499-preset-structure-delta-manifest.md):
       the three adjudicated presets are all RENT-basis on this page's registered planning vector —
       the two estimates apply a strategic-contract class to it (globally and per leg), and the
       stress case applies nothing at all. None is an owned-TCO build-up, so none may claim that
       basis; the per-leg multiplier scales the SAME committed-planning-rent rows. */
    "gptpro-ctx": "committed-planning-rent", "fable-ctx": "committed-planning-rent",
    "stress-public-rate": "committed-planning-rent",
    /* row 514 round 3: the adjudicators' SELF-AUTHORED presets. Same classification as their
       round-2 parents and for the same reason — both apply a strategic-contract class to this
       page's registered planning vector (per leg), neither is an owned-TCO build-up, so neither
       may claim that basis. Re-authoring the ranges does not re-classify the procurement. */
    "gptpro-r3": "committed-planning-rent", "fable-r3": "committed-planning-rent",
    /* a-im-legibility 2026-08-16: x90-v2 is x90-v1 with ONE field changed (the serving regime),
       so it inherits its parent's owned-TCO procurement basis unchanged. Applying the batch
       lever is not a procurement decision, and classifying it otherwise would let a serving
       control silently re-state where the fleet's money comes from. */
    "x90-v2": "owned-strategic-tco",
    xaicash: "owned-strategic-tco", xaiopp: "committed-planning-rent",
    chinacloud: "public-capacity-rent", anth20: "committed-planning-rent", deepseek: "committed-planning-rent",
  };
  assert("T5: PERSPECTIVES basis table matches the memo §3.2 classification verbatim",
    E.PERSPECTIVES.length === Object.keys(expectedPersp).length
    && E.PERSPECTIVES.every(p => p.procurementBasis === expectedPersp[p.id]),
    JSON.stringify(E.PERSPECTIVES.map(p => [p.id, p.procurementBasis])));
  const expectedDive = { gpt: "committed-planning-rent", gemini: "owned-strategic-tco", grok: "owned-strategic-tco",
    kimi: "committed-planning-rent", dsr1: "committed-planning-rent", dsv4: "committed-planning-rent",
    glm: "committed-planning-rent" };
  assert("T5: DIVE_PROCUREMENT_BASES matches the memo table (every §10-dive model classified)",
    JSON.stringify(Object.entries(E.DIVE_PROCUREMENT_BASES).sort()) === JSON.stringify(Object.entries(expectedDive).sort()));
  assert("T5: every model carrying a dive object has a classified basis",
    E.MODELS.filter(m => m.dive).every(m => E.PROCUREMENT_BASES.includes(E.DIVE_PROCUREMENT_BASES[m.id])));
  assert("T5: dive basis lives OUTSIDE model dive objects (never a scenario-state key)",
    E.MODELS.every(m => !m.dive || !("procurementBasis" in m.dive)) && !("procurementBasis" in flagship));
  const dive = E.PERSPECTIVES.find(p => p.id === "dive");
  assert("T5: procurementBasisFor resolves dive×gemini → owned-strategic-tco",
    E.procurementBasisFor(dive, E.MODELS.find(m => m.id === "gemini")) === "owned-strategic-tco");
  assert("T5: procurementBasisFor falls back to committed-planning-rent for a card-less model (documented median fallback)",
    E.procurementBasisFor(dive, opus) === "committed-planning-rent");
  assert("T5: basis display names are the D-3 verbatim triple",
    E.PROCUREMENT_BASIS_NAMES["public-capacity-rent"] === "public-capacity rent"
    && E.PROCUREMENT_BASIS_NAMES["committed-planning-rent"] === "low/committed planning rent"
    && E.PROCUREMENT_BASIS_NAMES["owned-strategic-tco"] === "owned/strategic TCO");
  // the mixing trap fires on a synthetic mixed input and stays quiet on every live lens:
  let threw = false;
  ED.HW_ROOFLINE.h200.rentBasis = "public-capacity-rent";
  try { E.assertUniformProcurementBasis([{ k: "h100" }, { k: "h200" }], flagship); }
  catch (e) { threw = /mixing/.test(String(e)); }
  finally { ED.HW_ROOFLINE.h200.rentBasis = "committed-planning-rent"; }
  assert("T5: assertUniformProcurementBasis THROWS on a synthetic mixed-basis mix (fail-closed)", threw);
  let unknownThrew = false;
  ED.HW_ROOFLINE.h200.rentBasis = "bogus-basis";
  try { E.assertUniformProcurementBasis([{ k: "h200" }], flagship); }
  catch (e) { unknownThrew = /unknown procurement basis/.test(String(e)); }
  finally { ED.HW_ROOFLINE.h200.rentBasis = "committed-planning-rent"; }
  assert("T5: assertUniformProcurementBasis THROWS on an unknown basis (fail-closed)", unknownThrew);
  let live = true;
  for (const p of E.PERSPECTIVES.filter(x => x.id !== "dive")) {
    const s = E.applyPresetSettings(opus, p, { mode: "native" });
    const got = E.blendedCosts(s, undefined, E.scenarioContext(s)).procurementBasis;
    const want = p.set.hwMode === "tco" ? "owned-strategic-tco" : "committed-planning-rent";
    if (got !== want) { live = false; break; }
  }
  assert("T5: every live lens computes one uniform effective basis (rows under rent; owned-strategic-tco under tco)", live);
  // gate P1 fold: the DISPLAYED label is the LENS basis, never the mix's row basis.
  const china = E.PERSPECTIVES.find(p => p.id === "chinacloud");
  const sChina = E.applyPresetSettings(opus, china, { mode: "native" });
  const effChina = E.blendedCosts(sChina, undefined, E.scenarioContext(sChina)).procurementBasis;
  assert("T5: chinacloud's effective row basis is committed-planning (the mechanism, kept for mixing enforcement)",
    effChina === "committed-planning-rent");
  const dbChina = E.displayedProcurementBasis(china, opus, effChina);
  assert("T5: displayedProcurementBasis labels chinacloud public-capacity rent (lens declaration wins) and marks the divergence",
    dbChina.name === "public-capacity rent" && dbChina.declaredDivergesFromMechanism === true);
  assert("T5: displayedProcurementBasis resolves xaicash to owned-strategic-tco (declared; rent-scalar mechanism)",
    E.displayedProcurementBasis(E.PERSPECTIVES.find(p => p.id === "xaicash"), E.MODELS.find(m => m.id === "grok"),
      "committed-planning-rent").basis === "owned-strategic-tco");
  assert("T5: displayedProcurementBasis resolves dive×gemini to owned-strategic-tco",
    E.displayedProcurementBasis(dive, E.MODELS.find(m => m.id === "gemini"), "committed-planning-rent").basis === "owned-strategic-tco");
  const dbNull = E.displayedProcurementBasis(null, opus, "committed-planning-rent");
  assert("T5: displayedProcurementBasis falls back to the effective basis when no lens declaration is in play",
    dbNull.basis === "committed-planning-rent" && dbNull.declaredDivergesFromMechanism === false);
  const dbMed = E.displayedProcurementBasis(median, opus, "committed-planning-rent");
  assert("T5: median's display label matches both its declaration and its mechanism (no divergence)",
    dbMed.name === "low/committed planning rent" && !dbMed.declaredDivergesFromMechanism); }

/* ---------- im-arc T2: the energy chip's mixed-section input is executable ---------- */
{ const mkLeg = () => ({ donorKey: "h800", label: "H800", sharePct: 100, overrides: {}, family: "nvidia" });
  const def = { id: "cf:energy2", name: "Mixed energy", epoch: E.DEFAULTS_EPOCH, clonedFrom: null,
    sections: [
      { id: "s1", label: "Rented", sharePct: 60, basis: "committed-planning-rent",
        rent: { mode: "flat", usdPerHr: 2.4 }, electricity: null, pue: null, tco: null,
        dcRef: null, provenance: null, legs: [mkLeg()] },
      { id: "s2", label: "Owned", sharePct: 40, basis: "owned-strategic-tco",
        rent: null, electricity: { usdPerKwh: 0.10 }, pue: null, tco: null,
        dcRef: null, provenance: null, legs: [mkLeg()] },
    ] };
  const wl = E.workload(flagship, undefined, flagCtx, { customFleet: def });
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-5): an explicit
     section $/kWh is honestly classified as an override receipt. */
  assert("T2 sections: energy composition chip receives explicit-owned and embedded-in-rent shares",
    wl.procurementBasis === "mixed" && wl.composition.length === 2
      && wl.composition[0].electricitySource === "embedded-in-rent"
      && wl.composition[1].electricitySource === "override",
    JSON.stringify(wl.composition)); }

/* ---------- T6: magnitude window (units tripwire — memo §2.4 derivations) ---------- */
{ const fe = E.fleetEnergy(flagship, undefined, flagCtx);
  const legsOut = fe.legs.filter(l => l.renderable).map(l => l.eOut);
  assert("T6: per-leg output energy within [10, 20000] Wh/Mtok at the flagship default",
    legsOut.length > 0 && legsOut.every(e => e >= 10 && e <= 20000), JSON.stringify(legsOut));
  assert("T6: blended mix energy within [5, 5000] Wh/Mtok at the flagship default",
    fe.blended.eMix >= 5 && fe.blended.eMix <= 5000, String(fe.blended.eMix)); }

console.log(`\n${failures === 0 ? "ALL ENERGY-MODEL TESTS PASS" : failures + " ENERGY-MODEL FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
