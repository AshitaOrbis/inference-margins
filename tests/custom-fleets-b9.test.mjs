/* =====================================================================================
   custom-fleets-b9.test.mjs — b9 M4 (memo research/b9-m45-ui-memo.md v2.1 §16 T-1..T-12)
   Schema, resolver equivalence, duplicates, basis, overrides, welds, codec v6, storage,
   state purity, size guard. Node-only; the browser flows live in run-app-tests.sh.
   ===================================================================================== */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const CF = require("../site/custom-fleets.js");

let failures = 0;
function assert(name, cond, detail) {
  if (cond) console.log("PASS  " + name);
  else { console.log("FAIL  " + name + (detail ? " — " + detail : "")); failures++; }
}

/* ---------- shared fixtures ---------- */
const REF = 0.5843046405779231; // the byte-identity bar (plan §6.1; memo §0)
const opus = E.MODELS.find(m => m.id === "opus");
const median = E.PERSPECTIVES.find(p => p.id === "median");
/* b9 M5 fixture scope (M5 delta manifest): M4's governing invariant — "M4 moves NO shipped
   number", certified by REF above — is a statement about the REFERENCE state. M5 adds a
   post-roofline scenario-prior multiplier defaulting to +3 months for Anthropic, so this shared
   fixture is pinned to the trend-0 / family-1.0 reference (the same constructor the FA uses).
   Every pinned value in this suite is byte-unchanged. Family-multiplier flow through custom-fleet
   legs (incl. the "unclassified" exemption) is asserted in tests/trendline-interlock-b9.test.mjs. */
function freshState() { return E.pinReferenceLevers(E.applyPresetSettings(opus, median, { mode: "native" })); }
function ctxFor(s) { return E.makeScenarioContext(opus, E.resolveTraffic(opus, median, { mode: "native" }), s.customDonor); }
const leg = (donorKey, sharePct, overrides = {}, extra = {}) => ({
  donorKey, label: extra.label || (donorKey + " leg"), sharePct, overrides,
  basisDeclared: extra.basisDeclared || "inherit",
  family: extra.family || CF.donorFamily(donorKey),
});
const FLEET_OK = () => ({ id: "cf:test01", name: "Test fleet", epoch: E.DEFAULTS_EPOCH,
  clonedFrom: null, legs: [leg("h800", 60), leg("h800", 40, { kwhPerKwh: 0.25 }, { label: "h800 — constrained grid" })] });
/* A test-injected source (memo §3.1: tests register their own store). */
function withFleet(def, fn) {
  const store = { [def.id]: def };
  E.registerCustomFleetSource({
    saved: store, ephemeral: null,
    resolve(id) { return Object.prototype.hasOwnProperty.call(store, id) ? store[id] : null; },
    ids() { return Object.keys(store); },
  });
  try { return fn(); } finally { E.registerCustomFleetSource(require("../site/custom-fleets.js").CF_RUNTIME); }
}

/* ================= T-1 schema: bounds table accept/reject edges ================= */
{
  const v = CF.validateCustomFleet(FLEET_OK());
  assert("T-1 baseline fleet validates", v.ok, v.ok ? "" : v.errors.join("; "));
  const cases = [
    ["unknown fleet key", { ...FLEET_OK(), extra: 1 }],
    ["bad id prefix", { ...FLEET_OK(), id: "fleet:abc123" }],
    ["name too long", { ...FLEET_OK(), name: "x".repeat(61) }],
    ["clonedFrom forged", { ...FLEET_OK(), clonedFrom: "no-such-fleet" }],
    ["clonedFrom prototype", { ...FLEET_OK(), clonedFrom: "__proto__" }],
    ["legs empty", { ...FLEET_OK(), legs: [] }],
    ["legs 13", { ...FLEET_OK(), legs: Array.from({ length: 13 }, () => leg("h100", 1)) }],
    ["share sum 0", { ...FLEET_OK(), legs: [leg("h100", 0)] }],
    ["unknown leg key", { ...FLEET_OK(), legs: [{ ...leg("h100", 100), zz: 1 }] }],
    ["unknown override key", { ...FLEET_OK(), legs: [leg("h100", 100, { turbo: 2 })] }],
    ["donor not registered", { ...FLEET_OK(), legs: [leg("h100", 100)].map(l => ({ ...l, donorKey: "b200" })) }],
    ["donor prototype", { ...FLEET_OK(), legs: [{ ...leg("h100", 100), donorKey: "constructor" }] }],
    ["rent below floor", { ...FLEET_OK(), legs: [leg("h100", 100, { rentPerHr: 0.01 })] }],
    ["rent NaN", { ...FLEET_OK(), legs: [leg("h100", 100, { rentPerHr: NaN })] }],
    ["kwh above cap", { ...FLEET_OK(), legs: [leg("h100", 100, { kwhPerKwh: 0.31 })] }],
    ["hbm above cap (1e12 B core ceiling)", { ...FLEET_OK(), legs: [leg("h100", 100, { hbmBytes: 1.001e12 })] }],
    /* T5 rec 4: the deprecated alias is bounds-checked as the quantity it MEANS — 1001 GB folds
       to 1.001e12 B and is refused by the same ceiling, so an old link cannot smuggle a value
       past a bound the typed key enforces. */
    ["hbm above cap via the legacy hbmGB alias", { ...FLEET_OK(), legs: [leg("h100", 100, { hbmGB: 1001 })] }],
    ["hbm carries BOTH keys (ambiguous capacity)", { ...FLEET_OK(), legs: [leg("h100", 100, { hbmGB: 144, hbmBytes: 154618822656 })] }],
    ["boardPowerW Infinity", { ...FLEET_OK(), legs: [leg("h100", 100, { boardPowerW: Infinity })] }],
    ["basis forged", { ...FLEET_OK(), legs: [{ ...leg("h100", 100), basisDeclared: "vibes" }] }],
    ["family cross-assign", { ...FLEET_OK(), legs: [{ ...leg("trn2", 100), family: "nvidia" }] }],
    ["sharePct string", { ...FLEET_OK(), legs: [{ ...leg("h100", 100), sharePct: "100" }] }],
  ];
  for (const [name, bad] of cases) {
    if ("extra" in bad) { const b = FLEET_OK(); b.extra = 1; assert("T-1 reject: " + name, !CF.validateCustomFleet(b).ok); }
    else assert("T-1 reject: " + name, !CF.validateCustomFleet(bad).ok);
  }
  assert("T-1 family unclassified allowed", CF.validateCustomFleet(
    { ...FLEET_OK(), legs: [{ ...leg("h100", 100), family: "unclassified" }] }).ok);
}

/* ================= T-2 resolver equivalence (byte-identity bar) =================
   impl-gate P1-7 fix: the grid is the memo's models × lenses × hwModes — every
   registered MODEL crossed with three basis-diverse lenses and BOTH cost bases, with
   the honest executed count in the assertion name. */
{
  let identical = true, count = 0;
  const gridLenses = ["median", "chinacloud", "xaiopp"]; // basis-diverse: planning-rent lens, public-capacity lens, owned-strategic replay
  const expected = E.MODELS.length * gridLenses.filter(id => E.PERSPECTIVES.some(p => p.id === id)).length * 2;
  for (const m of E.MODELS) for (const pId of gridLenses) {
    const p = E.PERSPECTIVES.find(x => x.id === pId);
    if (!p) continue;
    for (const hwMode of ["rent", "tco"]) {
      const s = Object.assign(E.applyPresetSettings(m, p, { mode: "native" }), { hwMode });
      const legs = E.resolveFleetLegs(s, undefined);
      const w = E.blendWeights(s);
      const wKeys = Object.keys(w);
      if (legs.length !== wKeys.length) { identical = false; continue; }
      for (let i = 0; i < wKeys.length; i++) {
        if (legs[i].k !== wKeys[i] || legs[i].wt !== w[wKeys[i]] || legs[i].hw !== E.HW[wKeys[i]] || legs[i].cfLeg !== null) { identical = false; }
      }
      count++;
    }
  }
  assert("T-2 resolveFleetLegs is the identity refactor on the full models×lenses×hwModes grid (" + count + "/" + expected + " states executed)", identical && count === expected && count >= 90, count + "/" + expected);
  const s = freshState();
  const wl = E.workload(s, undefined, ctxFor(s));
  assert("T-2 reference blend margin byte-identical", wl.margin === REF, String(wl.margin));
}

/* ================= T-3 duplicates at different electricity ================= */
{
  const def = FLEET_OK();
  const s = freshState();
  const sTco = Object.assign(freshState(), { hwMode: "tco" });
  const rentCosts = E.blendedCosts(s, undefined, ctxFor(s), { customFleet: def });
  const tcoCosts = E.blendedCosts(sTco, undefined, ctxFor(sTco), { customFleet: def });
  assert("T-3 two duplicate legs resolve (rent)", rentCosts.fleetRenderable.totalLegs === 2);
  // Under TCO the 0.25 override leg must cost MORE than its twin at s.kwh (0.07 default).
  const tl = tcoCosts && tcoCosts.fleetRenderable;
  assert("T-3 duplicate legs render under TCO", tl && tl.totalLegs === 2 && isFinite(tcoCosts.cOut));
  // Same donor, same share split, override inert under rent: rent mix equals the single-leg h800 mix.
  const sMono = freshState(); sMono.blend = Object.fromEntries(E.HW_ORDER.map(k => [k, k === "h800" ? 100 : 0]));
  const mono = E.blendedCosts(sMono, undefined, ctxFor(sMono));
  assert("T-3 kwh override INERT under rent (mix equals mono-h800)", Math.abs(rentCosts.cOut - mono.cOut) < 1e-12,
    rentCosts.cOut + " vs " + mono.cOut);
  const blend = CF.aggregateLegsToBlend(def);
  assert("T-3 blend mirror aggregates duplicates to one h800 share", blend.h800 === 100
    && E.HW_ORDER.every(k => k === "h800" || blend[k] === 0));
}

/* ================= T-4 basis: section basis IS computation; legacy label is not ================= */
{
  const s = freshState();
  const owned = { id: "cf:t4owned", name: "Owned section", epoch: E.DEFAULTS_EPOCH, clonedFrom: null,
    sections: [{ id: "s1", label: "Owned", sharePct: 100, basis: "owned-strategic-tco",
      rent: null, electricity: { usdPerKwh: 0.12 }, pue: null, tco: null, dcRef: null,
      provenance: null, legs: [(({ basisDeclared, ...rest }) => rest)(leg("h800", 100))] }] };
  const rented = structuredClone(owned);
  rented.id = "cf:t4rent1"; rented.sections[0].basis = "committed-planning-rent";
  rented.sections[0].rent = { mode: "flat", usdPerHr: 2.4 };
  const cOwned = E.blendedCosts(s, undefined, ctxFor(s), { customFleet: owned });
  const cRent = E.blendedCosts(s, undefined, ctxFor(s), { customFleet: rented });
  assert("T-4 explicit section basis forks the computation (inverted M-C contract)",
    cOwned.cOut !== cRent.cOut && cOwned.procurementBasis === "owned-strategic-tco"
      && cRent.procurementBasis === "committed-planning-rent");
  /* Negative control: v1's leg label is migration-only and is dropped by the one
     validator. It must still never fork the legacy one-section computation. */
  const legacy = FLEET_OK(); legacy.legs[0].basisDeclared = "owned-strategic-tco";
  const normalized = CF.validateCustomFleet(legacy).fleet;
  const cLegacy = E.blendedCosts(s, undefined, ctxFor(s), { customFleet: normalized });
  const cPlain = E.blendedCosts(s, undefined, ctxFor(s), { customFleet: CF.validateCustomFleet(FLEET_OK()).fleet });
  assert("T-4 legacy v1 basisDeclared is dropped and does not move the migrated one-section mix",
    cLegacy.cOut === cPlain.cOut && cLegacy.cIn === cPlain.cIn
      && !JSON.stringify(normalized).includes("basisDeclared"));
  // impl-gate P1-7 fix: the trap must be shown to FIRE, executed — not merely exist.
  // The mixing branch is structurally unreachable through public paths while the row
  // vector is uniform (M3 design), but the fail-closed UNKNOWN-basis branch is the same
  // guard and IS reachable: a leg keyed outside the registry resolves to a null basis.
  let uniformOk = false, trapFired = false;
  try {
    const b = E.assertUniformProcurementBasis([{ k: "h100", wt: 0.5 }, { k: "h800", wt: 0.5 }],
      Object.assign(freshState(), { hwMode: "rent" }));
    uniformOk = b === "committed-planning-rent";
  } catch { /* must not throw on the uniform vector */ }
  try {
    E.assertUniformProcurementBasis([{ k: "h100", wt: 0.5 }, { k: "not-a-row", wt: 0.5 }],
      Object.assign(freshState(), { hwMode: "rent" }));
  } catch (e) { trapFired = /procurement.basis/.test(String(e && e.message)); } // fires via the MIXING branch: committed-planning-rent vs null
  assert("T-4 trap passes the uniform vector AND fires (executed) on an unresolvable basis", uniformOk && trapFired);
}

/* ================= T-5 overrides move exactly their own outputs ================= */
{
  const base = FLEET_OK(); base.legs = [leg("h100", 100)];
  const sT = Object.assign(freshState(), { hwMode: "tco" });
  const ctxT = () => ctxFor(sT);
  const c0 = E.blendedCosts(sT, undefined, ctxT(), { customFleet: base });
  const rent = structuredClone(base); rent.legs[0].overrides = { rentPerHr: 10 };
  const sR = freshState();
  const cRent0 = E.blendedCosts(sR, undefined, ctxFor(sR), { customFleet: base });
  const cRent1 = E.blendedCosts(sR, undefined, ctxFor(sR), { customFleet: rent });
  assert("T-5 rent override moves rent-basis cost", cRent1.cOut > cRent0.cOut * 2);
  const pow = structuredClone(base); pow.legs[0].overrides = { boardPowerW: 1400 }; // 2× the h100 0.70kW proxy
  const cPow = E.blendedCosts(sT, undefined, ctxT(), { customFleet: pow });
  assert("T-5 boardPowerW override raises TCO cost", cPow.cOut > c0.cOut);
  const kwh = structuredClone(base); kwh.legs[0].overrides = { kwhPerKwh: 0.30 };
  const cKwh = E.blendedCosts(sT, undefined, ctxT(), { customFleet: kwh });
  assert("T-5 kwh override raises TCO cost", cKwh.cOut > c0.cOut);
  const capex = structuredClone(base); capex.legs[0].overrides = { capexUsd: 100000 };
  const cCap = E.blendedCosts(sT, undefined, ctxT(), { customFleet: capex });
  assert("T-5 capex override raises TCO cost", cCap.cOut > c0.cOut);
  assert("T-5 non-overridden outputs untouched (rent override inert under TCO)",
    E.blendedCosts(sT, undefined, ctxT(), { customFleet: rent }).cOut === c0.cOut);
}

/* ================= T-6 welds/policy: hbm shrink → welded fail-closed shape ================= */
{
  const tiny = FLEET_OK(); tiny.legs = [leg("h800", 100, { hbmBytes: 1.6e10 })]; // 16 GB cannot hold the 2.5T flagship
  const s = freshState();
  const c = E.blendedCosts(s, undefined, ctxFor(s), { customFleet: tiny });
  assert("T-6 infeasible custom leg → NaN mix + typed fleetRenderable (never a silent number)",
    Number.isNaN(c.cOut) && c.fleetRenderable && c.fleetRenderable.renderableLegs === 0
    && c.fleetRenderable.totalLegs === 1);
  const big = FLEET_OK(); big.legs = [leg("h800", 100, { hbmBytes: 1e12 })];
  const cBig = E.blendedCosts(s, undefined, ctxFor(s), { customFleet: big });
  assert("T-6 hbm growth binds too (1e12 B leg renders)", isFinite(cBig.cOut));
  assert("T-6 user-custom never central-eligible: class registered",
    require("../site/engine-data-v22.js").FLEET_CLASSES.includes("user-custom"));
  assert("T-6 DEFAULT_FLEET_ID is never a cf: id", !String(E.DEFAULT_FLEET_ID).startsWith("cf:"));
}

/* ================= T-7 codec round-trip ================= */
{
  const def = FLEET_OK();
  withFleet(def, () => {
    const s = freshState();
    s.blend = CF.aggregateLegsToBlend(def); // the mirror invariant the app maintains
    const tr = E.resolveTraffic(opus, median, { mode: "native" });
    const tok = E.encodeScenario(s, "opus", "median", tr, null, { fleet: def.id, totalCase: "custom" });
    assert("T-7 cf: token mints v6", tok.startsWith("v6."));
    const d = E.decodeScenario(tok);
    assert("T-7 cf: token decodes", !!d && d._meta.fleet.id === def.id && !!d._meta.fleet.custom);
    assert("T-7 by-value block round-trips byte-identical (legs)",
      JSON.stringify(d._meta.fleet.custom.legs) === JSON.stringify(def.legs.map(l => ({
        donorKey: l.donorKey, label: l.label, sharePct: l.sharePct, overrides: { ...l.overrides },
        basisDeclared: l.basisDeclared, family: l.family }))));
    assert("T-7 id/epoch single authority (block carries neither)",
      !("id" in d._meta.fleet.custom) && !("epoch" in d._meta.fleet.custom));
    /* b9 M5: the stamp is no longer trivially "free" — it is DERIVED from the state when the
       caller has no machine state of its own, and every mint must be consistent with the values
       it carries (the encoder refuses otherwise). This fixture's state is the trend-0 REFERENCE
       under a clean opus identity whose ratified prior is +3, so the honest stamp is
       "locked-family". A genuinely default state still stamps "free" — asserted right below. */
    assert("T-7 interlock stamp is consistent with the levers the token carries",
      E.INTERLOCK_STATES.includes(d._meta.interlock)
      && E.interlockTokenConsistent(d._meta.interlock, s, opus, median, false), String(d._meta.interlock));
    assert("T-7 the reference-pinned fixture state stamps locked-family", d._meta.interlock === "locked-family");
    { const clean = E.applyPresetSettings(opus, median, { mode: "native" });
      clean.blend = CF.aggregateLegsToBlend(def);
      const cleanTok = E.encodeScenario(clean, "opus", "median", tr, null, { fleet: def.id, totalCase: "custom" });
      assert("T-7 a state at the full ratified baseline stamps free",
        E.decodeScenario(cleanTok)._meta.interlock === "free"); }
    assert("T-7 no blend key rode the diff (mirror == derivable)", !("blend" in d));
    // margin identity: the encoder computed displayedMargin THROUGH the leg list.
    const wl = E.workload(s, undefined, ctxFor(s), { customFleet: def });
    assert("T-7 displayedMargin is the leg-list margin", Math.abs(d._meta.displayedMargin - wl.margin * 100) < 1e-3);
  });
}

/* ================= T-8 adversarial tokens ================= */
{
  const def = FLEET_OK();
  const mkTok = (mut) => withFleet(def, () => {
    const s = freshState(); s.blend = CF.aggregateLegsToBlend(def);
    const tr = E.resolveTraffic(opus, median, { mode: "native" });
    const tok = E.encodeScenario(s, "opus", "median", tr, null, { fleet: def.id, totalCase: "custom" });
    const raw = JSON.parse(Buffer.from(tok.slice(3), "base64").toString("utf8"));
    mut(raw);
    return "v6." + Buffer.from(JSON.stringify(raw), "utf8").toString("base64");
  });
  const rejects = [
    ["custom block under a named id", r => { r._meta.fleet.id = "na-blend"; }],
    ["cf id without custom block", r => { delete r._meta.fleet.custom; }],
    ["unknown key at fleet level", r => { r._meta.fleet.zz = 1; }],
    ["unknown key at custom level", r => { r._meta.fleet.custom.id = "cf:test01"; }],
    ["unknown key at leg level", r => { r._meta.fleet.custom.legs[0].zz = 1; }],
    ["unknown key at overrides level", r => { r._meta.fleet.custom.legs[1].overrides.turbo = 9; }],
    ["forged clonedFrom", r => { r._meta.fleet.custom.clonedFrom = "no-such"; }],
    ["NaN share", r => { r._meta.fleet.custom.legs[0].sharePct = "NaN"; }],
    ["13 legs", r => { const l = r._meta.fleet.custom.legs; while (l.length < 13) l.push({ ...l[0] }); }],
    ["share sum 0", r => { r._meta.fleet.custom.legs.forEach(l => { l.sharePct = 0; }); }],
    ["oversize name", r => { r._meta.fleet.custom.name = "x".repeat(61); }],
    ["blend + cf contradiction", r => { r.blend = { h800: 100 }; }],
    ["interlock forged", r => { r._meta.interlock = "half-open"; }],
    ["interlock absent", r => { delete r._meta.interlock; }],
    ["inner schema mismatch", r => { r._meta.schema = "v5"; }],
    ["kwh out of bounds", r => { r._meta.fleet.custom.legs[1].overrides.kwhPerKwh = 0.5; }],
    ["donor injection", r => { r._meta.fleet.custom.legs[0].donorKey = "__proto__"; }],
  ];
  for (const [name, mut] of rejects) {
    assert("T-8 reject: " + name, E.decodeScenario(mkTok(mut)) === null);
  }
  // v5 token carrying v6-only keys: the sanitizer path (loader-level) — assert decode
  // does NOT reject at the schema layer (the overlay sanitizer owns unknown STATE keys).
  {
    const tr = E.resolveTraffic(opus, median, { mode: "native" });
    /* b9 M5 fixture correction (M5 delta manifest): the probe key was `trendMonths`, which M5
       promoted to a REAL state key — the row under test is "an UNKNOWN state key on a v5 token is
       the overlay sanitizer's business", so the probe moves to a key that is still unknown. The
       M5 lever keys arriving on a v5 token are covered instead by the bounds/enum rows in
       tests/trendline-interlock-b9.test.mjs (out-of-range and non-integer values drop with notice)
       and by deriveInterlockFor(), which reconstructs the machine state a pre-machine token
       implies rather than assuming FREE. */
    const v5diff = { v6OnlyProbeKey: 3, _meta: { dataAsOf: E.DATA_AS_OF, schema: "v5", engine: E.ENGINE_REVISION,
      epoch: E.DEFAULTS_EPOCH, displayedMargin: 59.2, model: "opus", persp: "median",
      fleet: { id: "custom" }, totalCase: "custom",
      traffic: { mode: tr.mode, profileId: tr.profileId ?? null, ioRatio: tr.ioRatio, cacheHit: tr.cacheHit } } };
    const tok = "v5." + Buffer.from(JSON.stringify(v5diff), "utf8").toString("base64");
    const d = E.decodeScenario(tok);
    assert("T-8 v5 token with a v6-only state key still decodes (sanitizer owns unknown keys)", !!d);
    const sane = E.sanitizeScenarioDiff(d, null);
    assert("T-8 …and the sanitizer drops it with notice", !("v6OnlyProbeKey" in sane.diff) && sane.rejected.length >= 1);
  }
  {
    const cfTok = mkTok(() => {});
    assert("T-8 cf: shape on a v5 PREFIX rejects", E.decodeScenario("v5." + cfTok.slice(3)) === null);
  }
}

/* ================= T-9 per-leg energy identity ================= */
{
  const def = FLEET_OK(); // h800 ×2, one at 0.25 $/kWh
  const sT = Object.assign(freshState(), { hwMode: "tco" });
  const legs = E.resolveFleetLegs(sT, { customFleet: def });
  let maxDelta = 0;
  for (const { hw, cfLeg } of legs) {
    const legOpts = { customFleet: def, cfLeg };
    const eOut = E.energyPerMtok(hw, sT, "out", undefined, ctxFor(sT), legOpts);
    const kwh = cfLeg && cfLeg.kwhPerKwh != null ? cfLeg.kwhPerKwh : sT.kwh;
    // electricity-$/Mtok = Wh/Mtok × $/kWh ÷ util  (per-leg, with the LEG's price)
    const elec$ = eOut / 1000 * kwh / (sT.util / 100);
    const hr = E.hwHourCost(hw, sT, cfLeg);
    const parts = E.hwHourParts(hw, sT, cfLeg);
    const tok = E.tokPerS(hw, sT, "out", undefined, ctxFor(sT), legOpts);
    const elecFromCost = parts.power / 3600 / tok * 1e6 / (sT.util / 100);
    maxDelta = Math.max(maxDelta, Math.abs(elec$ - elecFromCost));
    if (!(hr > 0)) { maxDelta = Infinity; }
  }
  assert("T-9 per-leg $↔Wh identity ≤1e-12 with overrides in play", maxDelta <= 1e-12, String(maxDelta));
}

/* ================= T-10 storage: fail-closed, non-destructive (EXECUTED) =================
   impl-gate P1-1/P1-7 fix: real localStorage semantics in a subprocess with a shim
   installed BEFORE the module loads — an invalid stored row must survive an unrelated
   Save byte-for-byte, and never be offered. */
{
  const shape = CF.loadCustomFleetStore();
  assert("T-10 storeless environment loads the empty {valid, raw} shape",
    Object.keys(shape.valid).length === 0 && Object.keys(shape.raw).length === 0);
  const bad = FLEET_OK(); bad.legs[0].sharePct = 200;
  assert("T-10 invalid row rejected by the loader's validator", !CF.validateCustomFleet(bad).ok);
  const { execFileSync } = require("node:child_process");
  const probe = execFileSync(process.execPath, ["-e", `
    const store = {};
    globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
    const E = require("./site/engine.js");
    const CF = require("./site/custom-fleets.js");
    const invalidRow = { id: "cf:badrow1", name: "Broken", epoch: E.DEFAULTS_EPOCH, clonedFrom: null,
      legs: [{ donorKey: "h100", label: "x", sharePct: 200, overrides: {}, basisDeclared: "inherit", family: "nvidia" }] };
    const protoRow = { note: "adversarial __proto__-keyed junk that must round-trip untouched" };
    /* NB: a literal {"__proto__": x} sets the prototype, not an own key — build the
       seed through a null-proto map so the stored JSON really carries the key. */
    const seedFleets = Object.create(null);
    seedFleets["cf:badrow1"] = invalidRow; seedFleets["__proto__"] = protoRow;
    store["im_custom_fleets_v1"] = JSON.stringify({ v: 1, fleets: seedFleets });
    const loaded = CF.loadCustomFleetStore();
    CF.CF_RUNTIME.saved = loaded.valid; CF.CF_RUNTIME.rawStore = loaded.raw;
    const r = {};
    r.invalidNotOffered = !CF.CF_RUNTIME.ids().includes("cf:badrow1");
    const good = { id: "cf:goodrow", name: "Good", epoch: E.DEFAULTS_EPOCH, clonedFrom: null,
      legs: [{ donorKey: "h800", label: "h800", sharePct: 100, overrides: {}, basisDeclared: "inherit", family: "nvidia" }] };
    const v = CF.validateCustomFleet(good, { requireId: true });
    CF.CF_RUNTIME.save(v.fleet);
    const after = JSON.parse(store["im_custom_fleets_v1"]);
    r.invalidPreservedByteForByte = JSON.stringify(after.fleets["cf:badrow1"]) === JSON.stringify(invalidRow);
    r.goodSaved = !!after.fleets["cf:goodrow"];
    CF.CF_RUNTIME.remove("cf:goodrow");
    const afterDel = JSON.parse(store["im_custom_fleets_v1"]);
    r.invalidSurvivesDelete = JSON.stringify(afterDel.fleets["cf:badrow1"]) === JSON.stringify(invalidRow) && !afterDel.fleets["cf:goodrow"];
    /* fix-verify P1-1 residual: a __proto__-keyed row survives too (null-prototype maps —
       JSON.parse creates it as an own property; a plain {} assignment would swallow it). */
    r.protoRowSurvives = JSON.stringify(Object.getOwnPropertyDescriptor(afterDel.fleets, "__proto__")?.value) === JSON.stringify(protoRow)
      && !CF.CF_RUNTIME.ids().includes("__proto__");
    process.stdout.write(JSON.stringify(r));
  `], { cwd: process.cwd() }).toString();
  const r = JSON.parse(probe);
  assert("T-10 invalid stored row is never offered", r.invalidNotOffered);
  assert("T-10 invalid row survives an unrelated Save byte-for-byte (P1-1, executed)", r.invalidPreservedByteForByte && r.goodSaved);
  assert("T-10 invalid row survives an unrelated Delete byte-for-byte", r.invalidSurvivesDelete);
  assert("T-10 a __proto__-keyed row survives writes and is never offered (null-proto maps)", r.protoRowSurvives);
}

/* ================= T-11 state purity: no cf key ever enters S ================= */
{
  let leaked = [];
  for (const m of E.MODELS) for (const p of E.PERSPECTIVES) {
    const s = E.applyPresetSettings(m, p, { mode: "native" });
    for (const k of Object.keys(s)) {
      if (/^cf|custom[A-Z]|fleetDef|legs$/.test(k) && k !== "customDonor") leaked.push(m.id + "/" + p.id + ":" + k);
    }
  }
  assert("T-11 state purity across " + (E.MODELS.length * E.PERSPECTIVES.length) + " preset states (no custom-fleet key in S)",
    leaked.length === 0, leaked.slice(0, 3).join(", "));
}

/* ================= T-12 size guard: realistic fits, adversarial trips =================
   MEASUREMENT NOTE (implementation-gate disclosure): the memo §6.4 pre-registered that a
   maximal 12-leg fleet encodes "well under" 4,000 chars — FALSIFIED by execution for the
   adversarial maximum (12 legs × 60-char labels × all five overrides ⇒ 4,555). The
   budget deliberately STANDS: the guard's explicit refusal is the designed outcome for
   that shape (D-8 — refusal, never truncation), and a realistic maximal fleet fits. */
{
  const mkFleet = (labelFor, overrides) => ({ id: "cf:maxifleet", name: "Maximal fleet",
    epoch: E.DEFAULTS_EPOCH, clonedFrom: "na-blend",
    legs: Array.from({ length: 12 }, (_, i) => leg(E.HW_ORDER[i % E.HW_ORDER.length], 8.3,
      overrides, { label: labelFor(i) })) });
  const realistic = mkFleet(i => "Leg " + i + " — Ohio DC", { rentPerHr: 12.34, kwhPerKwh: 0.123 });
  const vR = CF.validateCustomFleet(realistic);
  assert("T-12 realistic maximal fleet validates", vR.ok, vR.ok ? "" : vR.errors.join("; "));
  withFleet(vR.fleet, () => {
    const s = freshState(); s.blend = CF.aggregateLegsToBlend(vR.fleet);
    const tr = E.resolveTraffic(opus, median, { mode: "native" });
    const tok = E.encodeScenario(s, "opus", "median", tr, null, { fleet: vR.fleet.id, totalCase: "custom" });
    assert("T-12 realistic 12-leg fleet encodes under the 4000-char budget", tok.length < 4000, String(tok.length));
  });
  const adversarial = mkFleet(i => ("Leg " + i + " ").padEnd(60, "x").slice(0, 60),
    /* im-arc T4 fold round 4 (2026-08-25): a stated capex now REQUIRES its input scope, so the
       adversarial case carries one. This does not soften the test — it makes the fixture strictly
       larger, which is the direction the case exists to probe: size is a SHARING limit, not a
       schema limit. */
    { rentPerHr: 12.34, capexUsd: 123456, capexScope: "installed-system", boardPowerW: 1234,
      kwhPerKwh: 0.123, hbmBytes: 5.12e11 });
  const vA = CF.validateCustomFleet(adversarial);
  assert("T-12 adversarial maximal fleet still validates (size is a SHARING limit, not a schema limit)", vA.ok);
  withFleet(vA.fleet, () => {
    const s = freshState(); s.blend = CF.aggregateLegsToBlend(vA.fleet);
    const tr = E.resolveTraffic(opus, median, { mode: "native" });
    const tok = E.encodeScenario(s, "opus", "median", tr, null, { fleet: vA.fleet.id, totalCase: "custom" });
    assert("T-12 adversarial maximum EXCEEDS the budget — the guard's refusal branch is reachable and required", tok.length > 4000, String(tok.length));
  });
}

/* ================= T5 rec 4 — THE INVARIANT THE RECOMMENDATION ACTUALLY DEMANDED =================
   GPT Pro 2026-07-29 §6 rank 4, verbatim: "Add an invariant: cloning a donor with no semantic
   change must reproduce exactly the donor's feasibility and byte capacity."

   The first cut of this leg ARGUED that the invariant holds (a no-semantic-change clone carries
   no override, so it inherits the donor row) and did not install it. An independent review
   called that defining the problem away rather than testing it. It is installed here, over
   EVERY donor rather than a sample, in both halves the rec names — byte capacity AND
   feasibility — because a clone could in principle reproduce one and not the other.

   The second block is the part that would have caught the original defect: it walks a reader
   who reads the donor's own displayed capacity off the UI and types it back. Under the retired
   `hbmGB` scalar that bought 93.13% of a Trainium3; the assertion is that whatever the control
   now shows, entering it does not silently shrink the leg. ============================== */
{
  const donors = E.HW_ORDER.slice();
  assert("T5 rec 4: the invariant runs over EVERY registered donor, not a sample",
    donors.length >= 8, JSON.stringify(donors));

  const cloneOf = (donorKey) => {
    const f = FLEET_OK();
    f.legs = [leg(donorKey, 100, {})];          // "no semantic change" = no override at all
    const v = CF.validateCustomFleet(f);
    if (!v.ok) throw new Error(donorKey + ": " + v.errors.join("; "));
    return v.fleet;
  };
  const R = require("../site/engine-roofline-v22.js");
  const cloneWith = (donorKey, ov) => {
    const f = FLEET_OK(); f.legs = [leg(donorKey, 100, ov)];
    const v = CF.validateCustomFleet(f);
    if (!v.ok) throw new Error(donorKey + ": " + v.errors.join("; "));
    return v.fleet;
  };
  /* THE FEASIBILITY PROBE, at the level where capacity actually acts.
     A first cut compared whole-fleet `blendedCosts` records for a one-leg clone. Its own negative
     control then showed that probe was VACUOUS: at the default operating point a Trainium3 at
     154,618,822,656 B and the same leg at 144e9 B produce an identical fleet record — the 6.9%
     shortfall does not flip renderability there. A probe that cannot see the defect cannot
     witness the invariant either. The capacity SOLVE can see it (it differs for 9 of the 10
     donors), and "feasibility and byte capacity" is exactly what it computes, so that is what
     this compares. The fleet-level record is kept as a second, coarser assertion. */
  const solveFor = (hwKey, override) => {
    const s = freshState();
    const opts = { ctx: ctxFor(s) };
    if (override != null) opts.hbmBytesOverride = override;
    return JSON.stringify(E.solveCapacityWidth(hwKey, s, opts));
  };
  const feasOf = (fleet) => {
    const s = freshState();
    const c = E.blendedCosts(s, undefined, ctxFor(s), { customFleet: fleet });
    return JSON.stringify({ renderable: c.fleetRenderable, nan: Number.isNaN(c.cOut),
      cOut: Number.isFinite(c.cOut) ? c.cOut : null });
  };
  let capacityFails = [], feasFails = [], solveFails = [], sensitive = [], cloneChannelFails = [];
  for (const k of donors) {
    const donorBytes = R.resolveHwRoofline(k).hbmBytes;
    const clone = cloneOf(k);
    const legOut = clone.sections[0].legs[0];
    /* (a) BYTE CAPACITY. The clone must carry no capacity override at all — which is what makes
       it resolve to the donor's own normative bytes rather than to any re-expression of them. */
    if ("hbmBytes" in legOut.overrides || "hbmGB" in legOut.overrides) capacityFails.push(k);

    /* (b) FEASIBILITY, as a ROUND TRIP at the solver — but routed THROUGH THE CLONE.
       A second review broke the previous version of this in one line: it compared the standalone
       solver's registry path against an explicit override and never passed the cloned fleet, so
       changing the clone's own no-override fallback (engine.js cfLegChannel) to `HW[key].hbm*1e9`
       would have silently given every clone the wrong capacity while every assertion here still
       passed. The clone's capacity now travels the SAME channel the renderer uses:
       resolveFleetSections() -> legs[].cfLeg -> hbmBytesOverride. */
    const resolved = E.resolveFleetSections(freshState(), { customFleet: clone });
    const chan = resolved && resolved[0] && resolved[0].legs && resolved[0].legs[0]
      && resolved[0].legs[0].cfLeg;
    if (!chan) { cloneChannelFails.push({ k, why: "no cfLeg channel resolved" }); }
    else {
      /* The byte-capacity half: a no-semantic-change clone must send NOTHING down the channel,
         which is what makes the leg resolve to the donor's normative row. */
      if (chan.hbmBytes != null) cloneChannelFails.push({ k, sent: chan.hbmBytes, donorBytes });
      /* The feasibility half: the solve the renderer would perform with THIS channel must be
         byte-identical to the donor's own. */
      const viaClone = solveFor(k, chan.hbmBytes == null ? null : chan.hbmBytes);
      if (viaClone !== solveFor(k, null)) solveFails.push({ k, via: "clone channel" });
    }
    /* ...and the typed path still agrees with the inherited one. */
    if (solveFor(k, null) !== solveFor(k, donorBytes)) solveFails.push({ k, via: "explicit donor bytes" });

    /* (b-bis) and the same identity at the whole-fleet level. */
    if (feasOf(clone) !== feasOf(cloneWith(k, { hbmBytes: donorBytes }))) feasFails.push(k);

    /* Record which donors the OLD scalar path would have changed — the label x 1e9 reading.
       These are the donors on which the negative control below is meaningful. */
    const legacyReading = E.HW[k].hbm * 1e9;
    if (legacyReading !== donorBytes && solveFor(k, legacyReading) !== solveFor(k, donorBytes)) sensitive.push(k);
  }
  assert("T5 rec 4 INVARIANT (b) negative: the solve probe CAN distinguish capacities, on most donors",
    sensitive.length >= 8,
    "only " + sensitive.length + " donor(s) are capacity-sensitive: " + JSON.stringify(sensitive)
    + " — if this collapses, the invariant below is vacuous");
  assert("T5 rec 4: ascend is the ONE donor whose label x 1e9 equals its normative bytes, so it is correctly insensitive",
    !sensitive.includes("ascend") && E.HW.ascend.hbm * 1e9 === R.resolveHwRoofline("ascend").hbmBytes,
    JSON.stringify({ label: E.HW.ascend.hbm * 1e9, normative: R.resolveHwRoofline("ascend").hbmBytes }));
  assert("T5 rec 4 INVARIANT (a): a no-semantic-change clone carries NO capacity override, for every donor",
    capacityFails.length === 0, JSON.stringify(capacityFails));
  assert("T5 rec 4 INVARIANT (a-bis): ...and its RENDER CHANNEL sends no capacity either, so the leg resolves to the donor row",
    cloneChannelFails.length === 0, JSON.stringify(cloneChannelFails).slice(0, 400));
  assert("T5 rec 4 INVARIANT (b): the inherited and typed paths give a byte-identical capacity SOLVE, for every donor",
    solveFails.length === 0, JSON.stringify(solveFails));
  assert("T5 rec 4 INVARIANT (b-bis): ...and an identical whole-fleet feasibility record too",
    feasFails.length === 0, JSON.stringify(feasFails).slice(0, 400));

  /* The invariant must be able to FAIL. A clone that DOES carry a semantic change — one byte
     less than the donor's normative capacity — must not reproduce the donor. */
  {
    const k = "trn3";
    const donorBytes = R.resolveHwRoofline(k).hbmBytes;
    const f = FLEET_OK(); f.legs = [leg(k, 100, { hbmBytes: donorBytes })];
    const vExact = CF.validateCustomFleet(f);
    assert("T5 rec 4 negative: an override AT the donor's exact normative bytes still validates",
      vExact.ok, vExact.ok ? "" : JSON.stringify(vExact.errors));
    assert("T5 rec 4 negative: ...and it is stored as the donor's exact byte count, not a re-rounding",
      vExact.ok && vExact.fleet.sections[0].legs[0].overrides.hbmBytes === donorBytes,
      String(vExact.ok && vExact.fleet.sections[0].legs[0].overrides.hbmBytes));
    /* THE ORIGINAL DEFECT, as a standing regression: the legacy scalar path bought 1.44e11 B for
       a donor holding 1.546e11 B. It still decodes to what it always meant (that is the
       compatibility promise), and the point of this assertion is that it is now VISIBLY a
       different quantity from the donor rather than silently passing as the donor's own value. */
    const fLegacy = FLEET_OK(); fLegacy.legs = [leg(k, 100, { hbmGB: 144 })];
    const vLegacy = CF.validateCustomFleet(fLegacy);
    const legacyBytes = vLegacy.ok && vLegacy.fleet.sections[0].legs[0].overrides.hbmBytes;
    assert("T5 rec 4: a pre-T5 hbmGB:144 link still decodes to exactly what it always meant (144e9 B)",
      legacyBytes === 144e9, String(legacyBytes));
    assert("T5 rec 4: ...and that is demonstrably NOT the donor's capacity — the defect the rec named",
      legacyBytes !== donorBytes && Math.abs(legacyBytes / donorBytes - 0.9313) < 0.0005,
      JSON.stringify({ legacyBytes, donorBytes, ratio: legacyBytes / donorBytes }));
  }
}

/* ===== T5 rec 4 — an ALREADY-SHARED pre-T5 permalink still means the same capacity =====
   The compatibility promise this migration rests on is that `hbmGB` survives as a read-side
   alias, so a link somebody shared before 2026-08-27 keeps its exact meaning. The validator-level
   fold is asserted above; this is the end-to-end form, through the real wire: mint a token,
   rewrite its payload back to the PRE-T5 shape (the literal `hbmGB` key at the old scale), and
   decode it. A key-named JSON wire is what makes this safe — had the codec been positional, the
   key change would have been a silent wire break, and this is the assertion that would catch it. */
{
  const k = "trn3", GB = 144;
  const f = FLEET_OK(); f.legs = [leg(k, 100, { hbmBytes: GB * 1e9 })];
  const v = CF.validateCustomFleet(f);
  withFleet(v.fleet, () => {
    const s = freshState(); s.blend = CF.aggregateLegsToBlend(v.fleet);
    const tr = E.resolveTraffic(opus, median, { mode: "native" });
    const tok = E.encodeScenario(s, "opus", "median", tr, null, { fleet: v.fleet.id, totalCase: "custom" });
    const prefix = tok.slice(0, tok.indexOf(".") + 1);
    const b64 = tok.slice(prefix.length);
    const raw = Buffer.from(decodeURIComponent(b64).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    assert("T5 rec 4 wire: the custom-fleet payload is key-named JSON, not positional",
      raw.includes('"hbmBytes":' + (GB * 1e9)), raw.slice(0, 120));
    const preT5 = raw.replace('"hbmBytes":' + (GB * 1e9), '"hbmGB":' + GB);
    assert("T5 rec 4 wire: the pre-T5 payload was actually reconstructed", preT5 !== raw);
    const oldTok = prefix + Buffer.from(preT5, "utf8").toString("base64")
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const dec = E.decodeScenario(oldTok);
    const legs = (dec._meta.fleet.custom.sections || []).flatMap(x => x.legs || []);
    assert("T5 rec 4 wire: a pre-T5 share link decodes to the SAME capacity it always meant",
      legs.length === 1 && legs[0].overrides.hbmBytes === GB * 1e9,
      JSON.stringify(legs.map(l => l.overrides)));
    assert("T5 rec 4 wire: ...and the deprecated key does not survive the decode",
      legs.length === 1 && !("hbmGB" in legs[0].overrides),
      JSON.stringify(legs.map(l => l.overrides)));
  });
}

console.log(`\n${failures === 0 ? "ALL CUSTOM-FLEETS TESTS PASS" : failures + " CUSTOM-FLEETS FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
