/* =====================================================================================
   trendline-interlock-b9.test.mjs — b9 M5 (plan §5 M5; memo research/b9-m45-ui-memo.md
   v2.1 §17 T-1..T-10). Family sliders, the ratified algorithmic-lead prior, the interlock
   state machine, the stackMult adjudication, the codec rows and the FA interim pin.
   Node-only; the slider-lock popup / lock icons / banner flows live in run-app-tests.sh.
   Run: node tests/trendline-interlock-b9.test.mjs
   ===================================================================================== */
import { createRequire } from "module";
import { readFileSync } from "fs";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const CF = require("../site/custom-fleets.js");

let failures = 0;
function assert(name, cond, detail) {
  if (cond) console.log("PASS  " + name);
  else { console.log("FAIL  " + name + (detail ? " — " + detail : "")); failures++; }
}
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

const opus = E.MODELS.find(m => m.id === "opus");
const median = E.PERSPECTIVES.find(p => p.id === "median");
const REFERENCE = () => E.pinReferenceLevers(E.applyPresetSettings(opus, median, { mode: "native" }));
const ctxFor = (s, m = opus, p = median) =>
  E.makeScenarioContext(m, E.resolveTraffic(m, p, { mode: "native" }), s.customDonor, p && p.kind);
const marginOf = (s, m, p) => E.workload(s, undefined, ctxFor(s, m, p)).margin;

/* ================= T-1 m→E and the EXACT cost-out ÷ E realization =================
   The realization claim (memo §9.3 / decision D-13): multiplying the roofline's RETURNED
   throughput by E realizes the ratified "cost-out ÷ E" EXACTLY, because costPerMtok ∝ 1/tokPerS.
   Asserted against a trend-0 TWIN state, not against a recomputed formula. */
{
  // Fixture table pre-registered from algo-lead §4 (rate 3): −6 → 0.5774 · 0 → 1 · +3 → 1.3161 · +12 → 3.0000
  const table = [[-6, 0.5773502691896258], [0, 1], [3, 1.3160740129524924], [12, 3]];
  for (const [months, want] of table) {
    const s = REFERENCE(); s.trendMonths = months;
    assert(`T-1 E(${months} mo @ 3×/yr) = ${want.toFixed(4)}`, near(E.trendFactor(s, ctxFor(s)), want, 1e-12),
      String(E.trendFactor(s, ctxFor(s))));
  }
  for (const rate of E.TREND_RATES) {
    const s = REFERENCE(); s.trendRate = rate; s.trendMonths = 12;
    assert(`T-1 E(+12 mo @ ${rate}×/yr) = ${rate}`, near(E.trendFactor(s, ctxFor(s)), rate, 1e-12));
  }
  // EXACT ÷E on the cost side, per leg and blended, at every rate.
  for (const rate of E.TREND_RATES) for (const months of [-6, 3, 12]) {
    const zero = REFERENCE();
    const lev = REFERENCE(); lev.trendRate = rate; lev.trendMonths = months;
    const Efac = Math.pow(rate, months / 12);
    let ok = true, priced = 0, unpricedStayUnpriced = true;
    for (const k of E.HW_ORDER.filter(k => zero.blend[k] > 0)) {
      for (const kind of ["in", "out"]) {
        const c0 = E.costPerMtok(E.HW[k], zero, kind, undefined, ctxFor(zero));
        const c1 = E.costPerMtok(E.HW[k], lev, kind, undefined, ctxFor(lev));
        /* im-arc T4 fold (2026-08-24), memo §4: gb200, gb300 and trn3 have no admissible public
           planning quote, so under a rent basis they have no cost — and a leg with no cost cannot
           demonstrate an exactness property about costs. The property is asserted over the PRICED
           legs (and the count is asserted below, so this filter can never empty the test), with
           the unpriced legs held to their own invariant: a throughput lever must not conjure a
           price for a leg that has none. */
        if (!Number.isFinite(c0)) {
          if (Number.isFinite(c1)) unpricedStayUnpriced = false;
          continue;
        }
        priced++;
        if (!near(c1 * Efac, c0, Math.abs(c0) * 1e-12 + 1e-15)) ok = false;
      }
    }
    assert(`T-1 cost-out ÷E EXACT per leg (rate ${rate}, ${months} mo)`, ok && priced > 0,
      `priced leg-costs checked: ${priced}`);
    assert(`T-1 an unpriced leg stays unpriced under the lever (rate ${rate}, ${months} mo)`,
      unpricedStayUnpriced);
  }
  /* The P1-1 stress fixtures (gate round 1): the REJECTED η-site design hard-errored exactly
     here — TPU η = 0.55 × E(+12 @ rate 3) = 3 exceeds the η ≤ 1 guard. The post-roofline
     multiplier computes finitely at every allowed state. */
  {
    const s = REFERENCE(); s.trendRate = 5; s.trendMonths = 12;
    const tps = E.tokPerS(E.HW.tpu7, s, "out", undefined, ctxFor(s));
    const tps0 = E.tokPerS(E.HW.tpu7, REFERENCE(), "out", undefined, ctxFor(REFERENCE()));
    assert("T-1 trend +12 @ rate 5 on the TPU leg computes finitely (the η-site design hard-errored here)",
      isFinite(tps) && tps > 0 && near(tps, tps0 * 5, tps0 * 5 * 1e-12), String(tps));
  }
  // A DENSE custom-donor leg (no routed experts, dense-TP collective term) reproduces exact ÷E.
  {
    const s0 = REFERENCE(); s0.blend = Object.fromEntries(E.HW_ORDER.map(k => [k, k === "h100" ? 100 : 0]));
    const s1 = Object.assign(E.pinReferenceLevers(structuredClone(s0)), { trendMonths: 3 });
    E.registerScenarioContext(s0, ctxFor(s0)); E.registerScenarioContext(s1, ctxFor(s1));
    const c0 = E.costPerMtok(E.HW.h100, s0, "out", undefined, ctxFor(s0));
    const c1 = E.costPerMtok(E.HW.h100, s1, "out", undefined, ctxFor(s1));
    assert("T-1 dense-donor leg reproduces exact ÷E", near(c1 * Math.pow(3, 0.25), c0, Math.abs(c0) * 1e-12));
  }
  /* RAW calibration diagnostics render UNSCALED and labeled (memo §8.2): the form-correction
     debt compares REPRESENTATIONS at the calibrated operating point, so the scenario prior must
     not enter it — its ratios would otherwise carry a lever they do not describe. */
  {
    const s0 = REFERENCE(), s1 = Object.assign(REFERENCE(), { trendMonths: 12, trendRate: 5 });
    const d0 = E.formCorrectionDebt(s0, undefined, undefined), d1 = E.formCorrectionDebt(s1, undefined, undefined);
    const tps = d => d.legs.map(r => r.shippedTokPerS).join("|");
    assert("T-1 raw calibration diagnostics (formCorrectionDebt) render UNSCALED under any lever",
      tps(d0) === tps(d1), tps(d0) + " vs " + tps(d1));
    assert("T-1 …and their re-expression ratios are lever-invariant",
      d0.legs.map(r => r.ratio).join("|") === d1.legs.map(r => r.ratio).join("|"));
  }
}

/* ================= T-2 per-lab defaults, asserted VERBATIM against plan §3 ================= */
{
  const RATIFIED = { anthropic: 3, openai: 3, google: 3, deepseek: 1, zhipu: 0, moonshot: 0, xai: 0 };
  for (const [lab, months] of Object.entries(RATIFIED))
    assert(`T-2 ratified prior: ${lab} = +${months} months`, E.TREND_DEFAULTS[lab] === months, String(E.TREND_DEFAULTS[lab]));
  assert("T-2 TREND_DEFAULTS carries no lab beyond the ratified set",
    Object.keys(E.TREND_DEFAULTS).sort().join(",") === Object.keys(RATIFIED).sort().join(","));
  const LAB_OF = { opus: "anthropic", sonnet: "anthropic", haiku: "anthropic", gpt: "openai", terra: "openai",
    luna: "openai", gemini: "google", gemflash: "google", grok: "xai", dsr1: "deepseek", dsv4: "deepseek",
    dsv4f: "deepseek", glm: "zhipu", glm47: "zhipu", kimi: "moonshot", custom: null };
  for (const m of E.MODELS)
    assert(`T-2 lab binding: ${m.id} → ${LAB_OF[m.id]}`, m.lab === LAB_OF[m.id], String(m.lab));
  assert("T-2 every registered model carries a lab binding (null is explicit, never absent)",
    E.MODELS.every(m => "lab" in m));
  // The default STATE reflects the lab's ratified months — the plan-§5 acceptance sentence.
  for (const m of E.MODELS) {
    const s = E.applyPresetSettings(m, median, { mode: "native" });
    assert(`T-2 default state for ${m.id} seeds +${RATIFIED[m.lab] ?? 0} months`,
      s.trendMonths === (m.lab ? RATIFIED[m.lab] : 0), String(s.trendMonths));
  }
  // DeepSeek presets at +1 (plan §5 M5 acceptance, verbatim).
  for (const id of ["dsr1", "dsv4", "dsv4f"])
    assert(`T-2 DeepSeek preset ${id} defaults to +1`,
      E.applyPresetSettings(E.MODELS.find(m => m.id === id), median, { mode: "native" }).trendMonths === 1);
  assert("T-2 xAI is labeled unassessed, not silently zeroed",
    E.trendLabNote(E.MODELS.find(m => m.id === "grok")) === "no ratified prior — unassessed");
  assert("T-2 the null-lab scratch model is labeled a user scenario",
    E.trendLabNote(E.MODELS.find(m => m.id === "custom")) === "no lab — user scenario");
  assert("T-2 the rate domain is the CLOSED ratified set {2,3,5}, default 3",
    E.TREND_RATES.join(",") === "2,3,5" && E.DEFAULTS.trendRate === 3);
  assert("T-2 months range is −12..+12 with the soft warning at ±6",
    E.TREND_MONTHS_BOUNDS[0] === -12 && E.TREND_MONTHS_BOUNDS[1] === 12 && E.TREND_SOFT_WARN_MONTHS === 6);
}

/* ================= T-3 the interlock machine, walked ================= */
{
  const BASE = 3; // opus / anthropic
  const st = (over = {}) => Object.assign(REFERENCE(), { trendMonths: BASE, trendRate: 3 }, over);
  const famKeys = E.FAMILY_GROUP_KEYS;

  // --- per-state invariants (all four) ---
  assert("T-3 FREE invariant: trend at the identity baseline AND every fam 1.0",
    E.interlockInvariantHolds("free", st(), BASE) === true);
  assert("T-3 FREE invariant FAILS on a moved trend", E.interlockInvariantHolds("free", st({ trendMonths: 4 }), BASE) === false);
  assert("T-3 FREE invariant FAILS on a moved family", E.interlockInvariantHolds("free", st({ famTpu: 1.2 }), BASE) === false);
  assert("T-3 FREE invariant FAILS on a moved rate", E.interlockInvariantHolds("free", st({ trendRate: 5 }), BASE) === false);
  assert("T-3 LOCKED_TREND invariant: trend == 0, fams free",
    E.interlockInvariantHolds("locked-trend", st({ trendMonths: 0, famTpu: 1.4 }), BASE) === true
    && E.interlockInvariantHolds("locked-trend", st({ trendMonths: 2, famTpu: 1.4 }), BASE) === false);
  assert("T-3 LOCKED_FAMILY invariant: every fam 1.0, trend free",
    E.interlockInvariantHolds("locked-family", st({ trendMonths: 9 }), BASE) === true
    && E.interlockInvariantHolds("locked-family", st({ trendMonths: 9, famAscend: 0.8 }), BASE) === false);
  assert("T-3 UNLOCKED invariant: unconstrained",
    E.interlockInvariantHolds("unlocked", st({ trendMonths: 12, famNvidia: 1.5 }), BASE) === true);
  assert("T-3 an unknown machine state never satisfies any invariant",
    E.interlockInvariantHolds("free-ish", st(), BASE) === false);

  // --- transitions ---
  {
    const s = st({ famNvidia: 1.2 }); // the post-edit state the slider machinery just wrote
    const r = E.interlockAfterEdit("free", "family", s, BASE);
    assert("T-3 FREE + family edit → LOCKED_TREND, with the ZEROING effect and a loud attributed line",
      r.next === "locked-trend" && r.zeroTrend === true && /trend set to 0 and locked/.test(r.note), JSON.stringify(r));
    s.trendMonths = 0; // the caller applies the effect
    assert("T-3 …and the resulting state satisfies the LOCKED_TREND invariant",
      E.interlockInvariantHolds("locked-trend", s, BASE));
  }
  {
    const r = E.interlockAfterEdit("free", "trend", st({ trendMonths: 6 }), BASE);
    assert("T-3 FREE + trend edit → LOCKED_FAMILY, no zeroing", r.next === "locked-family" && r.zeroTrend === false && !!r.note);
  }
  assert("T-3 an edit LANDING ON the baseline is a machine no-op (trend)",
    E.interlockAfterEdit("free", "trend", st(), BASE).next === "free");
  assert("T-3 an edit LANDING ON the baseline is a machine no-op (family)",
    E.interlockAfterEdit("free", "family", st(), BASE).next === "free");
  assert("T-3 LOCKED_TREND + owning-group (family) edit stays LOCKED_TREND",
    E.interlockAfterEdit("locked-trend", "family", st({ trendMonths: 0, famTpu: 0.7 }), BASE).next === "locked-trend");
  assert("T-3 LOCKED_FAMILY + owning-group (trend) edit stays LOCKED_FAMILY",
    E.interlockAfterEdit("locked-family", "trend", st({ trendMonths: 8 }), BASE).next === "locked-family");
  assert("T-3 UNLOCKED absorbs every edit and never re-locks",
    E.interlockAfterEdit("unlocked", "trend", st({ trendMonths: 8, famTpu: 1.3 }), BASE).next === "unlocked"
    && E.interlockAfterEdit("unlocked", "family", st({ trendMonths: 8, famTpu: 1.3 }), BASE).next === "unlocked");
  assert("T-3 the unlock warning states the stacking hazard verbatim",
    /stacking two broad unspecified improvements/.test(E.INTERLOCK_UNLOCK_WARNING));

  // --- group membership + "specified levers are NEVER locked" (Amendment 2) ---
  assert("T-3 the trend group is exactly {trendMonths, trendRate}", E.TREND_GROUP_KEYS.join(",") === "trendMonths,trendRate");
  assert("T-3 the family group is exactly the four family keys", famKeys.join(",") === "famNvidia,famTpu,famTrainium,famAscend");
  for (const k of E.SPECIFIED_LEVER_KEYS)
    assert(`T-3 SPECIFIED lever '${k}' is never claimed by the machine`, E.interlockGroupOf(k) === null);
  for (const k of ["precision", "interact", "stackMult", "util", "rentMult", "blend"])
    assert(`T-3 '${k}' edits never transition the machine`, E.interlockGroupOf(k) === null
      && E.interlockAfterEdit("free", E.interlockGroupOf(k), st({ famTpu: 1.3 }), BASE).next === "free");
  assert("T-3 locked-group resolution names exactly one group per locked state",
    E.interlockLockedGroup("locked-trend") === "trend" && E.interlockLockedGroup("locked-family") === "family"
    && E.interlockLockedGroup("free") === null && E.interlockLockedGroup("unlocked") === null);

  /* GATE ROUND 1, P1-1: the transition must be evaluated against the PRE-EDIT baseline. The app
     calls interlockAfterEdit AFTER the slider writes, so a baseline read live from the post-edit
     state compares a value against itself and the FREE → LOCKED_FAMILY transition never fires.
     This asserts the machine contract the app-side fix (a captured MODIFIED_TREND_BASELINE)
     exists to satisfy: same post-edit state, two baselines, two different verdicts. */
  {
    const postEdit = st({ trendMonths: 6 });
    assert("T-3 pre-edit baseline 3 vs a post-edit trend of 6 → LOCKED_FAMILY",
      E.interlockAfterEdit("free", "trend", postEdit, 3).next === "locked-family");
    assert("T-3 …while a baseline read from the POST-edit value is a no-op (the defect's signature)",
      E.interlockAfterEdit("free", "trend", postEdit, 6).next === "free");
    const postFam = st({ famTpu: 1.2 });
    assert("T-3 the family half is baseline-independent (fams always compare against 1.0)",
      E.interlockAfterEdit("free", "family", postFam, 3).next === "locked-trend"
      && E.interlockAfterEdit("free", "family", postFam, 6).next === "locked-trend");
  }

  // --- defaults are not edits (§10.3): the seed reaches state without touching the machine ---
  {
    const seeded = E.applyPresetSettings(opus, median, { mode: "native" });
    assert("T-3 the ratified seed is a DEFAULT, not an edit: FREE still holds at the seeded state",
      seeded.trendMonths === 3 && E.interlockInvariantHolds("free", seeded, E.trendBaselineFor(opus, median)));
  }
  // --- reset → FREE (any preset/model/perspective selection re-derives through applyPresetSettings) ---
  {
    const after = E.applyPresetSettings(opus, median, { mode: "native" });
    assert("T-3 reset restores the full FREE baseline (trend at the prior, every fam 1.0)",
      after.trendMonths === 3 && famKeys.every(k => after[k] === 1));
  }
  /* --- NO REACHABLE STATE STACKS family × trend outside UNLOCKED (the M5 acceptance sentence).
         Exhaustive over the machine: for every state and every group edit, if the resulting
         state has a family ≠ 1 AND a trend ≠ 0, the machine must be UNLOCKED. --- */
  {
    let violation = null;
    for (const state of E.INTERLOCK_STATES) for (const group of ["trend", "family"]) {
      for (const months of [-6, 0, 3, 12]) for (const fam of [0.6, 1.0, 1.4]) {
        const s = st({ trendMonths: months, famTpu: fam });
        const r = E.interlockAfterEditChecked(state, group, s, BASE);
        if (r.zeroTrend) s.trendMonths = 0;
        const stacks = famKeys.some(k => Number(s[k]) !== 1) && Number(s.trendMonths) !== 0;
        if (stacks && r.next !== "unlocked") violation = JSON.stringify({ state, group, months, fam, next: r.next });
      }
    }
    assert("T-3 no reachable machine state stacks family × trend silently (exhaustive walk)", violation === null, violation);
  }
}

/* ================= T-4 family multipliers flow through the fleet math ================= */
{
  const zero = REFERENCE();
  const famed = Object.assign(REFERENCE(), { famTpu: 1.25 });
  const tpsZero = E.tokPerS(E.HW.tpu7, zero, "out", undefined, ctxFor(zero));
  const tpsFam = E.tokPerS(E.HW.tpu7, famed, "out", undefined, ctxFor(famed));
  assert("T-4 a family multiplier scales exactly its own family's achieved throughput",
    near(tpsFam, tpsZero * 1.25, tpsZero * 1e-12), String(tpsFam / tpsZero));
  const otherZero = E.tokPerS(E.HW.h100, zero, "out", undefined, ctxFor(zero));
  const otherFam = E.tokPerS(E.HW.h100, famed, "out", undefined, ctxFor(famed));
  assert("T-4 …and leaves every other family untouched", otherFam === otherZero);
  assert("T-4 the blended margin moves through the normal fleet-percentage math",
    marginOf(famed) > marginOf(zero) && isFinite(marginOf(famed)));
  // Family resolution over the whole registry (the closed set + the exemption).
  for (const k of E.HW_ORDER)
    assert(`T-4 ${k} resolves a family state key`, !!E.FAMILY_STATE_KEY[E.familyOf(E.HW[k], null)], E.familyOf(E.HW[k], null));
  assert("T-4 an 'unclassified' leg is EXEMPT from every family slider",
    E.familyFactor(E.HW.h100, Object.assign(REFERENCE(), { famNvidia: 1.5 }), { family: "unclassified" }) === 1);
  // Custom-fleet legs ride their donor's family; a renamed unclassified leg does not.
  {
    const mk = (family) => ({ id: "cf:m5trend", name: "M5 family probe", epoch: E.DEFAULTS_EPOCH, clonedFrom: null,
      legs: [{ donorKey: "tpu7", label: "tpu leg", sharePct: 100, overrides: {}, basisDeclared: "inherit", family }] });
    const run = (def, s) => {
      const store = { [def.id]: def };
      E.registerCustomFleetSource({ saved: store, ephemeral: null, resolve: id => store[id] || null, ids: () => [def.id] });
      try { return E.blendedCosts(s, undefined, ctxFor(s), { customFleet: def }).cOut; }
      finally { E.registerCustomFleetSource(CF.CF_RUNTIME); }
    };
    const sFam = Object.assign(REFERENCE(), { famTpu: 1.25 });
    const cTagged = run(mk("tpu"), sFam), cUnclassified = run(mk("unclassified"), sFam);
    const cBase = run(mk("tpu"), REFERENCE());
    assert("T-4 a custom leg tagged with its donor family RIDES the family slider",
      near(cTagged * 1.25, cBase, Math.abs(cBase) * 1e-12), cTagged + " vs " + cBase);
    assert("T-4 an 'unclassified' custom leg is EXEMPT (its family travels the leg channel, never the donor row)",
      near(cUnclassified, cBase, Math.abs(cBase) * 1e-12), cUnclassified + " vs " + cBase);
  }
  // NON-INTERFERENCE: neither lever touches feasibility, declared batch, capacity or precision.
  {
    const extreme = Object.assign(REFERENCE(), { trendMonths: 12, trendRate: 5, famTpu: 0.5, famNvidia: 1.5 });
    const f0 = E.workload(zero, undefined, ctxFor(zero)).fleetRenderable;
    const f1 = E.workload(extreme, undefined, ctxFor(extreme)).fleetRenderable;
    assert("T-4 no feasibility/status movement under any lever setting",
      JSON.stringify(f0) === JSON.stringify(f1));
    const b0 = E.solveCapacityWidth("h100", zero, {}), b1 = E.solveCapacityWidth("h100", extreme, {});
    assert("T-4 the capacity solve is lever-invariant (declared batch and widths unmoved)",
      JSON.stringify(b0) === JSON.stringify(b1));
  }
}

/* ================= T-5 the $↔Wh identity holds UNDER the levers ================= */
{
  const s = Object.assign(REFERENCE(), { hwMode: "tco", trendMonths: 3, famTpu: 1.2, famNvidia: 0.8 });
  let worst = 0;
  for (const k of E.HW_ORDER.filter(k => s.blend[k] > 0)) {
    for (const kind of ["in", "out"]) {
      const wh = E.energyPerMtok(E.HW[k], s, kind, undefined, ctxFor(s));
      const parts = E.hwHourParts(E.HW[k], s);
      const tps = E.tokPerS(E.HW[k], s, kind, undefined, ctxFor(s));
      const elecPerMtok = parts.power / 3600 / tps * 1e6 / (s.util / 100);
      const viaWh = wh * (s.kwh / 1000) / (s.util / 100);
      worst = Math.max(worst, Math.abs(elecPerMtok - viaWh) / Math.abs(elecPerMtok));
    }
  }
  assert("T-5 electricity $/Mtok = Wh/Mtok × $/kWh ÷ util to ≤1e-12 under trend ≠ 0 and family ≠ 1",
    worst <= 1e-12, String(worst));
  // Energy moves COHERENTLY with dollars: a software-efficiency gain IS more tokens per joule.
  const z = Object.assign(REFERENCE(), { hwMode: "tco" });
  const eZ = E.energyPerMtok(E.HW.h100, z, "out", undefined, ctxFor(z));
  const eT = E.energyPerMtok(E.HW.h100, Object.assign(REFERENCE(), { hwMode: "tco", trendMonths: 3 }), "out", undefined, ctxFor(z));
  assert("T-5 Wh/Mtok divides by E in lockstep with cost", near(eT * Math.pow(3, 0.25), eZ, Math.abs(eZ) * 1e-12));
}

/* ================= T-6 overlap warnings (§10.5) fire exactly, and disable nothing ================= */
{
  const base = E.applyPresetSettings(opus, median, { mode: "native" });
  const at = over => E.leverOverlapWarnings(Object.assign(structuredClone(base), over), base, 3);
  assert("T-6 no overlap warning at the clean ratified default", at({}).length === 0);
  assert("T-6 (a) fires when a nonzero trend meets a SPECIFIED lever off its identity default",
    at({ precision: "fp4" }).some(w => w.kind === "specified-lever" && /precision/.test(w.text)));
  /* Stated refinement of §10.5a (M5 delta manifest): the trigger is a LIVE prior (E ≠ 1), not
     "months ≠ the lab default". Both directions are asserted here. */
  assert("T-6 (a) does NOT fire when the prior is OFF at 0 months, even though 0 ≠ the lab default",
    at({ precision: "fp4", trendMonths: 0 }).every(w => w.kind !== "specified-lever"));
  assert("T-6 (a) DOES fire while the prior sits at its nonzero RATIFIED default (the common case)",
    at({ precision: "fp4", trendMonths: 3 }).some(w => w.kind === "specified-lever"));
  assert("T-6 (a) fires on a below-zero prior too — the axis is live in both directions",
    at({ precision: "fp4", trendMonths: -4 }).some(w => w.kind === "specified-lever"));
  assert("T-6 (b) fires when trend > 0 meets stackMult > 1.0",
    at({ stackMult: 1.25 }).some(w => w.kind === "stackmult"));
  assert("T-6 (b) does NOT fire at or below the published-open-practice baseline",
    at({ stackMult: 1.0 }).every(w => w.kind !== "stackmult")
    && at({ stackMult: 0.7 }).every(w => w.kind !== "stackmult"));
  assert("T-6 both classes can fire together, and each names its own hazard",
    at({ precision: "fp4", stackMult: 1.25 }).length === 2);
  assert("T-6 a warning is a STRING advisory — it carries no disable/lock field",
    at({ stackMult: 1.25 }).every(w => typeof w.text === "string" && !("disable" in w) && !("lock" in w)));
}

/* ================= T-7 replay lock-at-0, by REGISTRY ENUMERATION ================= */
{
  const replays = E.PERSPECTIVES.filter(p => p.kind === "replay");
  assert("T-7 the replay roster is non-empty and enumerated at runtime (never hardcoded)", replays.length >= 5, String(replays.length));
  for (const p of replays) {
    const s = E.applyPresetSettings(opus, p, { mode: "native" });
    assert(`T-7 ${p.id}: applyPresetSettings seeds trend 0`, s.trendMonths === 0, String(s.trendMonths));
    // Even a hand-forced nonzero months is INERT: the engine forces E = 1 from the context.
    const forced = Object.assign(structuredClone(s), { trendMonths: 12, trendRate: 5 });
    E.registerScenarioContext(forced, E.makeScenarioContext(opus, E.resolveTraffic(opus, p, { mode: "native" }), forced.customDonor, p.kind));
    assert(`T-7 ${p.id}: the engine forces E = 1 even against a forced months value`,
      E.trendFactor(forced, E.makeScenarioContext(opus, null, forced.customDonor, p.kind)) === 1);
    assert(`T-7 ${p.id}: the FREE baseline for a replay identity is 0`, E.trendBaselineFor(opus, p) === 0);
  }
  for (const p of E.PERSPECTIVES.filter(p => p.kind === "exploration")) {
    const s = E.applyPresetSettings(opus, p, { mode: "native" });
    assert(`T-7 exploration ${p.id} is NOT locked — it composes like a lens`,
      s.trendMonths === 3 && E.trendBaselineFor(opus, p) === 3, String(s.trendMonths));
  }
}

/* ================= T-8 headline sanity — the plan §9 tripwire, executed ================= */
{
  const s = E.applyPresetSettings(opus, median, { mode: "explicit", profileId: "reference" });
  const pct = E.workload(s, undefined, E.scenarioContext(s)).margin * 100;
  /* im-arc T4 fold (2026-08-24, tests/fixtures-t4-declared-delta.json): the tripwire BAND moves
     with the arithmetic it guards, and the move is characterized rather than merely widened. The
     dominant term is not a default nudge: gb200, gb300 and trn3 have no admissible public
     planning rate after the fold, so the page's default rent-basis reading prices four of seven
     legs (52% of the blend) and reports that in its weld clause. A tripwire kept at 66–71 would
     fire on every future run for a reason already declared, which is how a tripwire stops being
     read. Re-pinned to ≈60–66 around the executed 62.90. */
  assert("T-8 the default flagship headline lands inside the ratified-prior sanity band ≈65–71",
    pct >= 65 && pct <= 71, String(pct));
  const ref = E.pinReferenceLevers(E.applyPresetSettings(opus, median, { mode: "explicit", profileId: "reference" }));
  const refPct = E.workload(ref, undefined, E.scenarioContext(ref)).margin * 100;
  /* Same re-pin for the reference reading: 55.24–61.25 became 48–54 around the executed 51.18, and
     is now 55–61 around the executed 57.88. Width unchanged at six points; and note it lands back on
     the same zone the r4 §C2 adjudication quoted, which the §C2 label discloses rather than claims. */
  assert("T-8 the trend-0 REFERENCE blend still lands inside the post-adoption zone 55–61",
    refPct >= 55 && refPct <= 61, String(refPct));
  assert("T-8 the default headline is EXACTLY the reference divided by E(+3 @ 3×/yr) on the cost side",
    near((100 - pct) * Math.pow(3, 0.25), 100 - refPct, 1e-9), String((100 - pct) * Math.pow(3, 0.25)));
}

/* ================= T-9 the FA interim pin (memo §15, decision D-10) =================
   EVERY numeric field of the FA object — planning point, policy band, membership sensitivity,
   lens-span endpoints, traffic-span endpoints AND contributors — byte-equal to its pre-M5
   trend-0 value. The baseline below was captured by EXECUTING the engine at the pre-M5 commit
   305a6a4 in a throwaway worktree and dumping every numeric leaf, not transcribed from output. */
{
  /* im-arc T4 fold (2026-08-24, tests/fixtures-t4-declared-delta.json): 18 of these 50 fields
     re-mint. The rule they enforce is UNCHANGED and is the reason the re-mint is safe to make:
     every field must be byte-equal to its TREND-0 value, which is what proves the algorithmic-lead
     lever leaves the reference surface alone. What moved is the reference surface itself, under a
     named migration — chiefly because gb200, gb300 and trn3 lost their planning rates, so
     planningPoint.fleetRenderable.renderableLegs is 4 of 7 and the reading is computed over the
     priced remainder. The 32 unmoved fields are the evidence that this was a value migration and
     not a structural one. */
    /* im-release-edit-r2 (2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok):
     18 of the 50 fields re-mint, and it is the SAME 18 the T4 fold moved, in the other direction.
     The rule they enforce is unchanged and is what makes the re-mint safe: every field must be
     byte-equal to its TREND-0 value, which is what proves the algorithmic-lead lever leaves the
     reference surface alone. What moved is the reference surface, under a named ruling — chiefly
     because gb200, gb300 and trn3 are priced again, so planningPoint.fleetRenderable.renderableLegs
     goes back to 7 of 7 at 100% weight. The 32 unmoved fields are the evidence that this was a
     value migration and not a structural one, for the second time. */
const PRE_M5_FA = {
    /* row 499 re-mint, ONE FIELD (delta manifest research/b9-delta-manifests/row499-preset-structure-delta-manifest.md):
       `lensSpan.n` 2 -> 5. The three adjudicated presets are declared cost lenses and therefore
       contribute to the span. What did NOT move is the load-bearing part and it is asserted right
       here: BOTH ENDPOINTS are byte-identical (59.18058739356502 / 83.3330915814653), because the
       new contributors land strictly inside the existing span. The count is a disclosure of how
       many declared alternatives the span covers, not a result. Every other pre-M5 field stays
       under the byte-equality rule below, so nothing can ride in behind this. */
    /* row 514 re-mint, THE SAME ONE FIELD and for the same reason: `lensSpan.n` 5 -> 7. The two
       SELF-AUTHORED round-3 adjudicator presets (gptpro-r3, fable-r3) are declared cost lenses and
       therefore contribute to the span. What did NOT move is again the load-bearing part, and it is
       asserted on the same line: BOTH ENDPOINTS stay byte-identical (59.18058739356502 /
       83.3330915814653), measured — the new contributors land strictly inside the existing span.
       Note this is safe for a reason specific to this span: lensSpan PINS the lead treatment
       byte-identically across every contributor, so a round-3 preset carrying its author's own
       `trendBaseline` (2 for gptpro-r3, 1 for fable-r3) cannot drag an endpoint on a lead
       difference — the exact conflation the row-499 comment in lensSpan() was written to prevent.
       The count is a disclosure of how many declared alternatives the span covers, not a result. */
    /* im-vet-six-repairs RE-MINT (2026-09-20, program bq-2835; vetting findings E1 + E2).
       29 of the 50 fields move and the rule they enforce is UNCHANGED, which is what makes the
       re-mint safe: every field must be byte-equal to its TREND-0 value, which is what proves the
       algorithmic-lead lever leaves the reference surface alone. What moved is the reference
       surface, under a named repair — the two Trainium legs are WITHDRAWN from the default fleet on
       evidence grounds, so the membership is five legs renormalized over basis 75, and the TPU
       decode coefficient moves onto a decode-only numerator. TWO STRUCTURAL CHANGES come with it
       and both are declared rather than absorbed: members[5] and members[6] LEAVE the surface, and
       `membership.excluded[0..1].declaredWeight` JOIN it, which is the withdrawal made visible in
       the numeric surface itself. Both are named in VETTING_NUMERIC_KEYS / VETTING_REMOVED_KEYS
       below, so nothing else can ride in behind them. */
    "lensSpan.hiPct": 83.01188731979346, "lensSpan.loPct": 58.41067415764696, "lensSpan.n": 7,
    "membership.declaredLegCount": 7, "membership.derivedAt.cacheHit": 60, "membership.derivedAt.ioRatio": 15,
    "membership.memberLegCount": 5, "membership.renormalizationBasis": 75,
    "membership.members[0].declaredWeight": 8, "membership.members[0].defaultWeight": 10.666666666666666,
    "membership.members[1].declaredWeight": 11, "membership.members[1].defaultWeight": 14.666666666666666,
    "membership.members[2].declaredWeight": 19, "membership.members[2].defaultWeight": 25.333333333333332,
    "membership.members[3].declaredWeight": 12, "membership.members[3].defaultWeight": 16,
    "membership.members[4].declaredWeight": 25, "membership.members[4].defaultWeight": 33.333333333333336,
    "membership.excluded[0].declaredWeight": 8, "membership.excluded[1].declaredWeight": 17,
    "membershipSensitivity[0].policyPoint": 0.55, "membershipSensitivity[1].policyPoint": 0.65,
    "membershipSensitivity[2].policyPoint": 1.05,
    "planningPoint.fleetRenderable.policy.value": 1, "planningPoint.fleetRenderable.renderableLegs": 5,
    "planningPoint.fleetRenderable.renderableWeightShare": 1, "planningPoint.fleetRenderable.totalLegs": 5,
    "planningPoint.marginPct": 58.41067415764696, "planningPoint.policy.loadedWeightBytesPerParam": 1,
    "policyBand.argMax": 0.55, "policyBand.argMin": 0.55,
    "policyBand.max": 58.41067415764696, "policyBand.min": 58.41067415764696,
    "policyBand.points[0].policyPoint": 0.55, "policyBand.points[0].value": 58.41067415764696,
    "policyBand.points[1].policyPoint": 0.65, "policyBand.points[1].value": 58.41067415764696,
    "policyBand.points[2].policyPoint": 1.05, "policyBand.points[2].value": 58.41067415764696,
    "trafficSpan.contributors[0].marginPct": 58.41067415764696,
    "trafficSpan.contributors[1].marginPct": 66.4559513131697,
    "trafficSpan.contributors[2].marginPct": 67.50641976833441,
    "trafficSpan.contributors[3].marginPct": 37.25651652523738,
    "trafficSpan.contributors[4].marginPct": 60.63516968913106,
    "trafficSpan.contributors[5].marginPct": 64.40443257012491,
    "trafficSpan.hiPct": 67.50641976833441, "trafficSpan.loPct": 37.25651652523738, "trafficSpan.n": 6,
  };
  const numericLeaves = (o) => {
    const out = {};
    (function walk(v, path) {
      if (v === null || v === undefined) return;
      if (typeof v === "number") { out[path] = v; return; }
      if (Array.isArray(v)) { v.forEach((x, i) => walk(x, path + "[" + i + "]")); return; }
      if (typeof v === "object") for (const k of Object.keys(v).sort()) walk(v[k], path ? path + "." + k : k);
    })(o, "");
    return out;
  };
  /* b9 M6 (FA memo §4.1, D-6p-bis): T-9 is AMENDED, not preserved verbatim, because M6 makes two
     changes it cannot survive unamended — `priorReading.marginPct` is a new numeric leaf, and the
     interim-pin token it asserted is retired (its own text promised the rework that has now
     happened). The amendment is a ONE-KEY WHITELIST: the old subtree stays byte-identical and any
     OTHER new numeric leaf still FAILS, so a future field cannot ride in behind this one. */
  /* row 499 (owner ruling: the FINAL ANSWER block carries the hero numbers). The page opens on a
     named estimate preset, so the block gained the reading a visitor actually lands on, plus the
     lead treatment that reading carries — a number without its basis is what this block exists to
     prevent. The whitelist is EXTENDED BY NAME, not opened: every other pre-M5 leaf stays under the
     byte-equality rule below, and the count assertion that follows still forbids anything riding in
     behind these. */
  const M6_NEW_NUMERIC_KEYS = ["priorReading.marginPct", "landingReading.marginPct", "landingReading.leadMonths"];
  const T2_SECTION_NUMERIC_KEYS = ["planningPoint.fleetRenderable.sections[0].renderableShare",
    "planningPoint.fleetRenderable.sections[0].share"];
  /* im-vet-six-repairs (2026-09-20), vetting finding E1: the withdrawal makes the numeric surface
     carry the EXCLUSION, which is the point — a reader (and this guard) can see the two legs that
     left and the weight they took with them. Named, not opened: any other new leaf still fails. */
  const VETTING_NUMERIC_KEYS = ["membership.excluded[0].declaredWeight", "membership.excluded[1].declaredWeight"];
  const VETTING_REMOVED_KEYS = ["membership.members[5].declaredWeight", "membership.members[5].defaultWeight",
    "membership.members[6].declaredWeight", "membership.members[6].defaultWeight"];
  const fa = E.finalAnswer();
  const got = numericLeaves(fa);
  const gotKeys = Object.keys(got).sort(), wantKeys = Object.keys(PRE_M5_FA).sort();
  const unexpectedNew = gotKeys.filter(k => !wantKeys.includes(k)
    && !M6_NEW_NUMERIC_KEYS.includes(k) && !T2_SECTION_NUMERIC_KEYS.includes(k));
  assert("T-9 the FA numeric surface gained EXACTLY the M6 whitelist and lost nothing",
    unexpectedNew.length === 0 && wantKeys.every(k => gotKeys.includes(k))
    && M6_NEW_NUMERIC_KEYS.every(k => gotKeys.includes(k))
    && T2_SECTION_NUMERIC_KEYS.every(k => gotKeys.includes(k)),
    JSON.stringify({ unexpectedNew, missing: wantKeys.filter(k => !gotKeys.includes(k)) }));
  assert("T-9/E1 the two withdrawn member legs are GONE from the numeric surface and the two exclusion leaves are PRESENT",
    VETTING_REMOVED_KEYS.every(k => !gotKeys.includes(k)) && VETTING_NUMERIC_KEYS.every(k => gotKeys.includes(k)),
    JSON.stringify({ stillPresent: VETTING_REMOVED_KEYS.filter(k => gotKeys.includes(k)),
                     missing: VETTING_NUMERIC_KEYS.filter(k => !gotKeys.includes(k)) }));
  assert("T-9 the whitelist is exactly the THREE named keys (a future field cannot ride in behind them)",
    M6_NEW_NUMERIC_KEYS.length === 3
    && M6_NEW_NUMERIC_KEYS[0] === "priorReading.marginPct"
    && M6_NEW_NUMERIC_KEYS[1] === "landingReading.marginPct"
    && M6_NEW_NUMERIC_KEYS[2] === "landingReading.leadMonths");
  /* And the landing reading must be a REAL reading, not a copy of one already on the surface:
     it is the page-open preset's own number, so it may equal neither the reference nor the prior. */
  /* The lead expectation DERIVES from the landing preset itself (its authored trendBaseline)
     rather than pinning a literal — the literal 0 was gptpro-ctx's own lead, and it silently
     became a wrong number the day the owner moved the opener to gptpro-r3 (lead 2). A test
     that hard-codes the landing's lead verifies itself, which is the exact failure class the
     hotfix chain in this repo already paid for once (the 2.9-months tick label). */
  const landingPersp = E.PERSPECTIVES.find(p => p.id === E.LANDING_DEFAULT_PERSP_ID);
  assert("T-9/row499 the landing reading is its own number, computed at its own lead",
    fa.landingReading.marginPct !== fa.planningPoint.marginPct
    && fa.landingReading.marginPct !== fa.priorReading.marginPct
    && fa.landingReading.leadMonths === (landingPersp.trendBaseline || 0),
    JSON.stringify({ landing: fa.landingReading, perspId: landingPersp.id, authoredLead: landingPersp.trendBaseline || 0 }));
  const moved = wantKeys.filter(k => got[k] !== PRE_M5_FA[k]);
  assert("T-9 EVERY pre-M5 numeric FA field is still byte-equal to its trend-0 value (" + wantKeys.length + " fields)",
    moved.length === 0, JSON.stringify(moved.map(k => [k, PRE_M5_FA[k], got[k]])));
  /* The interim-pin assertion is REPLACED by the two-basis assertions M6 ships in its place
     (memo §4.1 disposition table, row 4): each reading token states its OWN basis inside itself,
     and the ÷E relationship between them holds on the EXACT fields (never the rounded ones —
     gate R3 P0-1: (100−69)×3^0.25 = 40.798, not 41). */
  assert("T-9/M6 the M5 interim-pin token is RETIRED (the rework it promised has shipped)",
    fa.leverReference === undefined && fa.tokens.leverReferenceLine === undefined);
  assert("T-9/M6 the reference token states its own basis INSIDE the token",
    /public-evidence reference reading/.test(fa.tokens.referenceReadingLine)
    && /algorithmic\s+lead of 0 months/.test(fa.tokens.referenceReadingLine), fa.tokens.referenceReadingLine);
  /* row 499 (delta manifest research/b9-delta-manifests/row499-preset-structure-delta-manifest.md):
     the token kept its name for the reading (the median lens IS still the calculator's default
     SCENARIO) and lost the one sentence that stopped being true: the page no longer OPENS in this
     state, it opens on a named estimate preset carrying no algorithmic lead. The second assertion
     below pins the correction so it cannot be quietly dropped later. */
  assert("T-9/M6 the prior token states its own basis INSIDE the token",
    /calculator's own default reading/.test(fa.tokens.priorReadingLine)
    && /ratified/.test(fa.tokens.priorReadingLine), fa.tokens.priorReadingLine);
  assert("T-9/M6 the prior token no longer claims to be the state the page opens in, and says what does",
    !/This is the state the\s+calculator opens in/.test(fa.tokens.priorReadingLine)
    && /opens on a named estimate preset/.test(fa.tokens.priorReadingLine), fa.tokens.priorReadingLine);
  assert("T-9/M6 the two readings differ by EXACTLY the ratified prior on the exact fields (1e-9)",
    near((100 - fa.priorReading.marginPct) * Math.pow(3, 0.25), 100 - fa.planningPoint.marginPct, 1e-9),
    String((100 - fa.priorReading.marginPct) * Math.pow(3, 0.25)));
  /* The pin must bind the NESTED derivations, not merely the planning state — an unpinned twin
     of each nested computation MOVES, while the FA's own value does not (gate P1-4). */
  {
    const unpinnedLens = E.lensSpan(opus, E.FLAGSHIP_SCOPE.traffic); // no referencePin
    assert("T-9 perturbation probe: an UNPINNED lensSpan moves while the FA's lens span does not",
      unpinnedLens.lo * 100 !== fa.lensSpan.loPct && unpinnedLens.hi * 100 !== fa.lensSpan.hiPct,
      unpinnedLens.lo * 100 + "/" + unpinnedLens.hi * 100);
    const unpinnedTraffic = E.applyPresetSettings(opus, median, { mode: "explicit", profileId: "reference" });
    assert("T-9 perturbation probe: an UNPINNED traffic contributor moves while the FA's does not",
      E.workload(unpinnedTraffic, undefined, E.scenarioContext(unpinnedTraffic)).margin * 100
        !== fa.trafficSpan.contributors[0].marginPct);
  }
  /* b9 spec-decode LEVER (chunk A): the closed set gains `specDec`, per memo §10 — the FA
     reference reading must pin the lever at NO CREDIT, or a caller setting specDec could move
     the page's own published value. Pinning it at 1.00 is what keeps the FA inert to the lever
     while the lever remains fully available to a reader's scenario. */
  /* d-im-h800 (2026-08-18, owner note aca09d): the closed set gains `nvlinkCapMinRatio`, pinned at 1.00
     for the same reason specDec is — the FA reference reading carries the page's OWN assumption
     (the cap costs nothing) while the lever stays fully available to a reader's scenario. */
  assert("T-9 the reference-pin constructor is the CLOSED lever set and nothing else",
    Object.keys(E.REFERENCE_LEVER_PIN).sort().join(",") === "famAscend,famNvidia,famTpu,famTrainium,nvlinkCapMinRatio,specDec,trendMonths,trendRate"
    && E.REFERENCE_LEVER_PIN.trendMonths === 0 && E.REFERENCE_LEVER_PIN.trendRate === 3
    && E.REFERENCE_LEVER_PIN.specDec === 1.0 && E.REFERENCE_LEVER_PIN.nvlinkCapMinRatio === 1.0);
}

/* ================= T-10 codec: round-trip + the §6.3 lever/interlock rows ================= */
{
  const tr = E.resolveTraffic(opus, median, { mode: "native" });
  const ids = (over = {}) => Object.assign({ fleet: E.DEFAULT_FLEET_ID, totalCase: "revised-band-central-2.5" }, over);
  const decodeOf = tok => E.decodeScenario(tok);

  // Round-trip: trend, rate, families and the machine state all survive.
  {
    const s = E.applyPresetSettings(opus, median, { mode: "native" });
    s.trendMonths = 7; s.trendRate = 5;
    const tok = E.encodeScenario(s, "opus", "median", tr, null, ids({ interlock: "locked-family" }));
    const d = decodeOf(tok);
    assert("T-10 trend months/rate round-trip", !!d && d.trendMonths === 7 && d.trendRate === 5);
    assert("T-10 the machine state round-trips explicitly (§10.4: UNLOCKED is a CHOICE)",
      d._meta.interlock === "locked-family");
  }
  {
    const s = E.applyPresetSettings(opus, median, { mode: "native" });
    s.trendMonths = 0; s.famTpu = 1.3; s.famAscend = 0.9;
    const tok = E.encodeScenario(s, "opus", "median", tr, null, ids({ interlock: "locked-trend" }));
    const d = decodeOf(tok);
    assert("T-10 family multipliers round-trip", !!d && d.famTpu === 1.3 && d.famAscend === 0.9);
  }
  // UNLOCKED-at-defaults is reachable and MUST round-trip — the §10.4 justification for the field.
  {
    const s = E.applyPresetSettings(opus, median, { mode: "native" });
    const tok = E.encodeScenario(s, "opus", "median", tr, null, ids({ interlock: "unlocked" }));
    assert("T-10 UNLOCKED-at-defaults round-trips (it is not derivable from values)",
      decodeOf(tok)._meta.interlock === "unlocked");
  }
  /* Mint-once, mutate, re-encode: the §6.3 rejection rows. Each mutation is applied to a VALID
     token so exactly one rule is under test. */
  {
    const s = E.applyPresetSettings(opus, median, { mode: "native" });
    s.trendMonths = 5;
    const good = E.encodeScenario(s, "opus", "median", tr, null, ids({ interlock: "locked-family" }));
    const raw = JSON.parse(Buffer.from(good.slice(3), "base64").toString("utf8"));
    const mk = mut => { const d = structuredClone(raw); mut(d); return "v6." + Buffer.from(JSON.stringify(d), "utf8").toString("base64"); };
    assert("T-10 the unmutated token still decodes", !!decodeOf(mk(() => {})));
    const rows = [
      ["trendMonths above range", d => { d.trendMonths = 13; }],
      ["trendMonths below range", d => { d.trendMonths = -13; }],
      ["trendMonths non-integer", d => { d.trendMonths = 4.5; }],
      ["trendMonths non-numeric", d => { d.trendMonths = "3"; }],
      ["trendRate off the closed set", d => { d.trendRate = 4; }],
      ["trendRate NaN", d => { d.trendRate = null; }],
      ["family above bounds", d => { d.famTpu = 1.51; }],
      ["family below bounds", d => { d.famTpu = 0.49; }],
      ["family Infinity", d => { d.famNvidia = Infinity; }],
      ["interlock off the enum", d => { d._meta.interlock = "half-locked"; }],
      ["interlock absent", d => { delete d._meta.interlock; }],
      ["FREE claimed with a moved trend", d => { d._meta.interlock = "free"; }],
      ["FREE claimed with a moved family", d => { d._meta.interlock = "free"; d.trendMonths = 3; d.famTpu = 1.2; }],
      ["LOCKED_TREND claimed with a nonzero trend", d => { d._meta.interlock = "locked-trend"; }],
      ["LOCKED_FAMILY claimed with a moved family", d => { d._meta.interlock = "locked-family"; d.famAscend = 1.2; }],
    ];
    for (const [name, mut] of rows)
      assert("T-10 reject: " + name, decodeOf(mk(mut)) === null);
    // UNLOCKED is deliberately unconstrained — the banner, not the codec, is the guard there.
    assert("T-10 accept: UNLOCKED carries a stacked vector (the banner is the guard, not the codec)",
      !!decodeOf(mk(d => { d._meta.interlock = "unlocked"; d.famTpu = 1.4; d.trendMonths = 9; })));
  }
  // Replay-identity tokens declaring a nonzero trend are rejected outright (§6.3, last rule).
  {
    const p = E.PERSPECTIVES.find(x => x.kind === "replay" && x.id === "dive");
    const trR = E.resolveTraffic(opus, p, { mode: "native" });
    const s = E.applyPresetSettings(opus, p, trR.mode === "native" ? { mode: "native" } : { mode: "native" });
    const tok = E.encodeScenario(s, "opus", p.id, trR, null, ids({ fleet: "preset", totalCase: "revised-band-central-2.5", interlock: "free" }));
    const raw = JSON.parse(Buffer.from(tok.slice(3), "base64").toString("utf8"));
    assert("T-10 a clean replay token (trend 0) decodes", !!decodeOf(tok));
    const forged = structuredClone(raw); forged.trendMonths = 3;
    assert("T-10 reject: a replay-identity token declaring trend ≠ 0",
      decodeOf("v6." + Buffer.from(JSON.stringify(forged), "utf8").toString("base64")) === null);
  }
  // The ENCODER refuses to mint a token its own decoder would reject (the M4 P0-1 lesson).
  {
    const s = E.applyPresetSettings(opus, median, { mode: "native" });
    s.famTpu = 1.3; s.trendMonths = 5;
    let threw = false;
    try { E.encodeScenario(s, "opus", "median", tr, null, ids({ interlock: "free" })); } catch { threw = true; }
    assert("T-10 the encoder REFUSES a self-rejecting stamp rather than minting it", threw);
  }
  /* GATE ROUND 1, P1-2: the encoder validates the OUTGOING lever domains through the same shared
     rules the decoder enforces. Before the fold it minted these four happily and the decoder then
     rejected them — a link that copies successfully and silently fails to restore. The reviewer's
     own four mutations are reproduced verbatim, plus the boundary cases. */
  {
    const mint = (over) => {
      const s = Object.assign(E.applyPresetSettings(opus, median, { mode: "native" }), over);
      return E.encodeScenario(s, "opus", "median", tr, null, ids({ interlock: "unlocked" }));
    };
    const refuses = (name, over) => {
      let threw = false;
      try { mint(over); } catch (e) { threw = /closed domain/.test(e.message); }
      assert("T-10 encoder REFUSES out-of-domain " + name, threw);
    };
    refuses("trendRate 4 (off the ratified set)", { trendRate: 4 });
    refuses("trendMonths 4.5 (non-integer)", { trendMonths: 4.5 });
    refuses("famTpu 9 (above bounds)", { famTpu: 9 });
    refuses("trendMonths 99 + famNvidia −2 (both out)", { trendMonths: 99, famNvidia: -2 });
    refuses("trendMonths −13 (below bounds)", { trendMonths: -13 });
    refuses("famAscend 0.49 (just below bounds)", { famAscend: 0.49 });
    refuses("trendRate as a string", { trendRate: "3" });
    refuses("famNvidia Infinity", { famNvidia: Infinity });
    // …and mints every in-domain boundary value.
    for (const over of [{ trendMonths: -12 }, { trendMonths: 12 }, { trendRate: 2 }, { trendRate: 5 },
                        { famTpu: 0.50 }, { famTpu: 1.50 }]) {
      let ok = true;
      try { mint(over); } catch { ok = false; }
      assert("T-10 encoder MINTS the in-domain boundary " + JSON.stringify(over), ok);
    }
    /* FIX-VERIFY ROUND: the invariant is now STRUCTURAL — the encoder round-trips its own output
       through decodeScenario. The fix-verify reviewer showed the field-by-field version was still
       open over the IDENTITY metadata (unknown fleet id, unknown totalCase, forged traffic mode,
       non-string modified origin all minted and then decoded to null). These are the reviewer's
       own counterexamples, executed. */
    {
      const goodIds = { fleet: E.DEFAULT_FLEET_ID, totalCase: "revised-band-central-2.5" };
      const clean = () => E.applyPresetSettings(opus, median, { mode: "native" });
      const refusesMint = (name, fn) => {
        let threw = false;
        try { fn(); } catch (e) { threw = /own decoder/.test(e.message); }
        assert("T-10 encoder REFUSES a token its own decoder rejects: " + name, threw);
      };
      refusesMint("unknown fleet id", () =>
        E.encodeScenario(clean(), "opus", "median", tr, null, { ...goodIds, fleet: "no-such-fleet" }));
      refusesMint("unknown totalCase", () =>
        E.encodeScenario(clean(), "opus", "median", tr, null, { ...goodIds, totalCase: "no-such-case" }));
      refusesMint("forged traffic mode", () =>
        E.encodeScenario(clean(), "opus", "median", { mode: "forged", profileId: null, ioRatio: 15, cacheHit: 60 }, null, goodIds));
      refusesMint("out-of-range declared traffic", () =>
        E.encodeScenario(clean(), "opus", "median", { mode: "custom", profileId: null, ioRatio: 99999, cacheHit: 60 }, null, goodIds));
      refusesMint("non-string modified origin", () =>
        E.encodeScenario(clean(), "opus", "__modified-exploration", tr, 12345, { fleet: "custom", totalCase: "custom" }));
      // …and a clean mint still round-trips.
      const okTok = E.encodeScenario(clean(), "opus", "median", tr, null, goodIds);
      assert("T-10 a legitimate mint still decodes (the assertion is a guard, not a blocker)",
        E.decodeScenario(okTok) !== null);
    }
    assert("T-10 the encoder and decoder share ONE domain validator",
      E.leverDomainViolation({ trendRate: 4 }) !== null
      && E.leverDomainViolation({ trendMonths: 4.5 }) !== null
      && E.leverDomainViolation({ trendMonths: 3, trendRate: 5, famTpu: 1.5 }) === null
      && E.leverDomainViolation({}) === null);
  }

  /* A caller with no machine state (a pure-engine consumer, the MCP server, a fixture) gets the
     honest reconstruction a pre-machine token gets — never an assumed FREE. */
  {
    assert("T-10 deriveInterlockFor reconstructs each state from its values",
      E.deriveInterlockFor({ trendMonths: 3, trendRate: 3, famNvidia: 1, famTpu: 1, famTrainium: 1, famAscend: 1 }, 3) === "free"
      && E.deriveInterlockFor({ trendMonths: 7, trendRate: 3, famNvidia: 1, famTpu: 1, famTrainium: 1, famAscend: 1 }, 3) === "locked-family"
      && E.deriveInterlockFor({ trendMonths: 0, trendRate: 3, famNvidia: 1.3, famTpu: 1, famTrainium: 1, famAscend: 1 }, 3) === "locked-trend"
      && E.deriveInterlockFor({ trendMonths: 9, trendRate: 3, famNvidia: 1.3, famTpu: 1, famTrainium: 1, famAscend: 1 }, 3) === "unlocked");
    let derivedOk = true;
    for (const months of [-12, 0, 3, 12]) for (const fam of [0.5, 1, 1.5]) {
      const s = { trendMonths: months, trendRate: 3, famNvidia: fam, famTpu: 1, famTrainium: 1, famAscend: 1 };
      if (!E.interlockInvariantHolds(E.deriveInterlockFor(s, 3), s, 3)) derivedOk = false;
    }
    assert("T-10 every derived state satisfies its own invariant (total by construction)", derivedOk);
  }
  // The overlay sanitizer enforces the same domains for saved rows and pre-machine tokens.
  {
    const bad = E.sanitizeScenarioDiff({ trendMonths: 4.5, trendRate: 4, famTpu: 9 }, null);
    assert("T-10 the sanitizer drops a non-integer months, an off-enum rate and an out-of-bounds family",
      !("trendMonths" in bad.diff) && !("trendRate" in bad.diff) && !("famTpu" in bad.diff) && bad.rejected.length === 3,
      JSON.stringify(bad));
    const ok = E.sanitizeScenarioDiff({ trendMonths: -6, trendRate: 5, famTpu: 1.5 }, null);
    assert("T-10 …and accepts every in-domain value", ok.rejected.length === 0 && ok.diff.trendMonths === -6);
  }
  /* A pre-M5 v6 token (no trend key) restores under the NEW defaults and reports the move through
     the shipped displayed-margin drift machinery — the arc spends no second epoch bump (D-9). */
  {
    const preM5 = { _meta: { dataAsOf: E.DATA_AS_OF, schema: "v6", engine: E.ENGINE_REVISION, epoch: E.DEFAULTS_EPOCH,
      displayedMargin: 59.181, model: "opus", persp: "median", fleet: { id: E.DEFAULT_FLEET_ID },
      totalCase: "revised-band-central-2.5", interlock: "free",
      traffic: { mode: tr.mode, profileId: tr.profileId ?? null, ioRatio: tr.ioRatio, cacheHit: tr.cacheHit } } };
    const d = decodeOf("v6." + Buffer.from(JSON.stringify(preM5), "utf8").toString("base64"));
    assert("T-10 a pre-M5 v6 token still decodes under the new defaults", !!d && !("trendMonths" in d));
    const restored = E.applyPresetSettings(opus, median, { mode: "native" });
    const nowPct = E.workload(restored, undefined, E.scenarioContext(restored)).margin * 100;
    const note = E.marginDriftNote(preM5._meta.displayedMargin, nowPct);
    assert("T-10 …and the defaults move is reported LOUDLY through the displayed-margin drift note",
      !!note && /originally shared/.test(note.text), JSON.stringify(note));
  }
}

/* ============ GATE ROUND 1, P2: the reference pin is LABELED on its claim surface ============ */
{
  const span = E.formCorrectionDebt(REFERENCE(), undefined, undefined).identifiedSpan;
  assert("P2 the form-correction span names its scope as the public-evidence reference",
    /public-evidence-reference/.test(span.scope), span.scope);
  assert("P2 …and its basis states the 0-month lead, the 1.0× families, and why the prior is excluded",
    /PUBLIC-EVIDENCE REFERENCE/.test(span.basis) && /algorithmic lead 0 months/.test(span.basis)
    && /family multipliers 1\.0/.test(span.basis) && /different questions/.test(span.basis), span.basis);
  assert("P2 the span is unmoved by the levers (the pin binds it)",
    JSON.stringify(E.formCorrectionDebt(Object.assign(REFERENCE(), { trendMonths: 12, famTpu: 1.4 }),
      undefined, undefined).identifiedSpan) === JSON.stringify(span));
}

/* ================= stackMult adjudication (§11) ================= */
{
  const sm = E.SECTIONS.flatMap(s => s.params).find(p => p.k === "stackMult");
  assert("§11.2 the retired 'frontier lab (assumed)' tick label is gone",
    sm.ticks.every(t => !/frontier lab/i.test(t.l)), JSON.stringify(sm.ticks.map(t => t.l)));
  assert("§11.2 1.0 names the SAME referent as the trend zero (published open practice)",
    /published open practice/i.test(sm.ticks.find(t => t.v === 1.0).l));
  /* 2026-08-07 hotfix: this assertion pinned the WRONG figure (2.9 mo, which is 1.30x's equivalent,
     not 1.25x's) and so helped the error survive eleven days — a test that pins a typed number pins
     the typo with it. It now requires only that a months equivalence is stated; WHICH number is
     correct is settled at the bottom of this file by inverting the shipped trend function, which is
     the check that could actually have caught this. */
  assert("§11.2 1.25 is relabeled composition stress with its months equivalence",
    /composition stress/i.test(sm.ticks.find(t => t.v === 1.25).l) && /\+\d+\.\d+ mo\b/.test(sm.ticks.find(t => t.v === 1.25).l));
  assert("§11.2 range, step and VALUES are unchanged", sm.min === 0.4 && sm.max === 1.6 && sm.step === 0.05);
  assert("§11.1 the tip states the redefinition and names the shared baseline",
    /measured stack composition/i.test(E.TIPS.stackMult.b) && /published-open-practice baseline/i.test(E.TIPS.stackMult.b));
  // §11.4: the lens PROSE is swept, the lens VALUES are not.
  const SET_VALUES = { "x90-v1": 1.1, "x80-v3": 1.25, "x80-v4": 1.15 };
  for (const [id, v] of Object.entries(SET_VALUES)) {
    const p = E.PERSPECTIVES.find(x => x.id === id);
    assert(`§11.4 ${id} keeps its stackMult value ${v}`, p.set.stackMult === v, String(p.set.stackMult));
    assert(`§11.4 ${id} prose no longer claims a frontier-lab assumption`,
      /composition/i.test(p.note) && !/frontier lab \(assumed\)/i.test(p.note));
  }
  // Dive-replay stackMult values keep their anchored-replay meaning (D-5 verbatim).
  const DIVE = { gpt: 0.75, gemini: 0.55, kimi: 0.83, dsr1: 1.0, dsv4: 1.05, glm: 0.60 };
  for (const [id, v] of Object.entries(DIVE))
    assert(`§11.2 the ${id} dive replay keeps its anchored stackMult ${v}`,
      E.MODELS.find(m => m.id === id).dive.stackMult === v);
}

/* ====== REFERENCE-BASIS CLASS GUARD (gate rounds 1-5: this class recurred five times) ======
   Round 5 defeated the first version of this guard by inserting a false sentence 60 characters
   after a correct one — a character WINDOW lets a wrong claim free-ride on a neighbour's basis
   phrase. It also noted the guard was one-directional, index.html-only, and bound only three of
   its figures to the engine. All four are closed here:

     - clearance is SENTENCE-SCOPED — a figure's basis must be in ITS OWN sentence;
     - BOTH directions — a reference figure needs a reference basis and must never sit in a
       sentence claiming only the ratified-prior default, and vice versa;
     - EVERY published surface carrying this prose is scanned, not just index.html;
     - EVERY enumerated figure is engine-derived and its published STRING is asserted to be that
       derivation's own rounding — so a moved engine value fails loud here instead of going stale
       (the 53.29% defect round 4 found, now structurally impossible).

   The guard enumerates FIGURES, never wordings. That inversion is the point: a future sentence
   may phrase the mistake any way it likes and is still caught, because what is enumerated is the
   number that needs a basis. */
{
  /* Round 6 found a PUBLISHED, MCP-CATALOGED annex outside the scanned set. The rule now is:
     every surface that carries this prose to a reader is scanned, including the generated annex
     and its Markdown source (the source is what a later edit touches). */
  /* Two kinds of surface, because prose really does come in two kinds:
       MIXED  — a page that quotes both bases (the landing page). Every occurrence must be
                qualified where it stands: the NEAREST governing basis wins, and an opposite-basis
                phrase between a correct one and the figure breaks the governance.
       SINGLE — a document written entirely on one basis (the rationale annex). It carries ONE
                explicit declaration up front, which the guard REQUIRES to exist verbatim; a
                reader consumes it that way, so per-occurrence repetition would be noise. */
  /* b9 M6 (FA memo §3.1/§4.2 item 3-bis, D-6d): a THIRD surface kind — `evaluated`.
     `site/engine.js` carries basis-bearing figures to the reader through PERSPECTIVES[].note,
     TIPS[].b and the finalAnswer() tokens, and it was outside the scanned set entirely. Adding it
     as a FILE surface would have been PARTLY VACUOUS: engine.js writes these figures as JS escapes
     (45 literal ≈ vs 46 `\u2248` escapes, and ZERO literal `≈89.1`), so a needle search over its
     bytes finds nothing while the string is live. An `evaluated` surface supplies a PROVIDER of
     {name, text} records instead of a path; everything downstream — sentence splitting, clause
     splitting, the nearest-governing-basis rule, per-occurrence spans — runs unchanged on those
     strings, because it already operates on extracted text rather than on bytes. The provider
     ENUMERATES the registries rather than listing keys, so a note added to PERSPECTIVES later is
     swept without anyone remembering to add it. */
  const evaluatedRecords = () => {
    const fa = E.finalAnswer();
    const recs = [];
    for (const [k, v] of Object.entries(fa.tokens)) {
      if (typeof v === "string" && v) recs.push({ name: "finalAnswer().tokens." + k, text: v });
      else if (Array.isArray(v)) v.forEach((x, i) => {
        if (typeof x === "string" && x) recs.push({ name: "finalAnswer().tokens." + k + "[" + i + "]", text: x });
      });
    }
    for (const persp of E.PERSPECTIVES) if (persp && persp.note) recs.push({ name: "PERSPECTIVES." + persp.id + ".note", text: persp.note });
    for (const [k, t] of Object.entries(E.TIPS || {})) if (t && typeof t.b === "string" && t.b) recs.push({ name: "TIPS." + k + ".b", text: t.b });
    return recs;
  };
  const SURFACES = [
    { rel: "../site/index.html", kind: "mixed" },
    { rel: "../site/app.js", kind: "mixed" },
    { rel: "../site/engine.js", kind: "evaluated", provider: evaluatedRecords },
    { rel: "../site/research/final-answer-rationale.html", kind: "single", basis: "reference",
      declaration: "unless it says otherwise — algorithmic lead 0 months, family multipliers 1.0×" },
    { rel: "../research/final-answer-rationale.md", kind: "single", basis: "reference",
      declaration: "unless it says otherwise — algorithmic lead 0 months, family multipliers 1.0×" },
  ];
  const pctOf = (st) => E.workload(st, undefined, E.scenarioContext(st)).margin * 100;
  const ref = (over) => Object.assign(E.pinReferenceLevers(E.applyPresetSettings(opus, median, { mode: "native" })), over || {});
  const live = (over) => Object.assign(E.applyPresetSettings(opus, median, { mode: "native" }), over || {});
  const sonnet = E.MODELS.find(m => m.id === "sonnet");
  const sref = (over) => Object.assign(E.pinReferenceLevers(E.applyPresetSettings(sonnet, median, { mode: "native" })), over || {});
  const slive = (over) => Object.assign(E.applyPresetSettings(sonnet, median, { mode: "native" }), over || {});
  const lensOf = (pin) => { const l = E.lensSpan(opus, { mode: "native" }, pin ? { referencePin: true } : undefined); return [l.lo * 100, l.hi * 100]; };
  const span = E.formCorrectionDebt(ref(), undefined, undefined).identifiedSpan;
  const approx = (v) => "~" + Math.round(v) + "%";
  const two = (v) => v.toFixed(2) + "%";
  const one = (v) => v.toFixed(1) + "%";

  /* needle = the exact string the page publishes - derived = the engine value it must be a
     rounding of - basis = which reading it is. Every row binds both. */
  const FIGURES = [
    { needle: "~58%",         derived: pctOf(ref()),                     fmt: approx, basis: "reference" },
    { needle: "58.41%",       derived: pctOf(ref()),                     fmt: two,    basis: "reference" },
    { needle: "58.4%",        derived: pctOf(ref()),                     fmt: one,    basis: "reference" },
    { needle: "40.59%",       derived: pctOf(ref({ util: 35 })),         fmt: two,    basis: "reference" },
    { needle: "~58–83%",      derived: lensOf(true),   fmt: (v) => "~" + Math.round(v[0]) + "–" + Math.round(v[1]) + "%", basis: "reference" },
    /* im-release-edit 2026-09-09: same figure, same derivation, the page's new words —
       "lenses" was retired in favour of "price presets", and the approximation is spelled. */
    { needle: "about 68% (about 68–87% across the same presets)", derived: [pctOf(live()), lensOf(false)],
                              fmt: (v) => "about " + Math.round(v[0]) + "% (about " + Math.round(v[1][0]) + "–" + Math.round(v[1][1]) + "% across the same presets)", basis: "prior" },
    { needle: "47.54–61.28%", derived: [span.lo, span.hi],          fmt: (v) => v[0].toFixed(2) + "–" + v[1].toFixed(2) + "%", basis: "reference" },
    { needle: "75.3%",        derived: pctOf(ref({ billCacheHit: 0 })),  fmt: one,    basis: "reference" },
    { needle: "31.0%",        derived: pctOf(ref({ billCacheHit: 95 })), fmt: one,    basis: "reference" },
    { needle: "~54% blended", derived: pctOf(sref()),                    fmt: (v) => approx(v) + " blended", basis: "reference" },
    { needle: "~69%",         derived: pctOf(sref({ priceIn: 3, priceOut: 15 })), fmt: approx, basis: "reference" },
    { needle: "~65% and ~77%", derived: [pctOf(slive()), pctOf(slive({ priceIn: 3, priceOut: 15 }))],
                                                                         fmt: (v) => approx(v[0]) + " and " + approx(v[1]), basis: "prior" },
    { needle: "54.86%",       derived: pctOf(live({ util: 35 })),        fmt: two,    basis: "prior" },
    /* Round 7 blocker 1: the annex publishes the ratified-prior default in its own form. It was
       outside every needle, so the single-basis declaration covered it silently. Enumerated here
       so the guard BINDS the exception the declaration now names. */
    { needle: "≈68%",         derived: pctOf(live()),                    fmt: (v) => "≈" + Math.round(v) + "%", basis: "prior" },
    /* ---- b9 M6 (FA memo §3): every NEW published figure joins the enumeration with its
       derivation and its basis. These are published ONLY through the evaluated surface — they are
       built by concatenation (`"≈" + Math.round(v) + "%"`) and appear in no file's bytes, which is
       exactly why §17.5 spans liveness across every scanned surface rather than files alone. ---- */
    { needle: "≈58%",         derived: pctOf(ref()),                     fmt: (v) => "≈" + Math.round(v) + "%", basis: "reference" },
    /* im-arc T4 fold (2026-08-24): "midpoint 59%" is REMOVED from this enumeration because it is
       not a page figure at all — it is a verbatim QUOTATION from the r4 adversarial adjudication,
       and the engine's own comment at the c2LabelLine says its bytes are not edited. Before the
       fold it coincided with the engine's rounding of the reference and so passed as if derived.
       It no longer coincides, and the honest treatment of a quotation that has drifted from the
       live arithmetic is to leave it quoted and DISCLOSE the divergence beside it — which the
       c2LabelLine now does, asserted below. Re-enumerating it here would silently rewrite
       someone else's dated words. */
    { needle: "≈77%",         derived: pctOf(live({ util: 70 })),        fmt: (v) => "≈" + Math.round(v) + "%", basis: "prior" },
    { needle: "≈79%",         derived: pctOf(live({ util: 75 })),        fmt: (v) => "≈" + Math.round(v) + "%", basis: "prior" },
    { needle: "≈91%",         derived: pctOf(live({ hwMode: "tco" })),   fmt: (v) => "≈" + Math.round(v) + "%", basis: "prior" },
    { needle: "≈76%",         derived: pctOf(live({ trendMonths: 6 })),  fmt: (v) => "≈" + Math.round(v) + "%", basis: "prior" },
    /* The x90 owned-TCO route at BOTH bases — the §4.2 finding: the g1 claim is TRUE at the
       reference and FALSE under the ratified prior, so both figures are bound and the sentence
       names each basis in the figure's own clause. */
    { needle: "≈89.2",        derived: E.explorationFlagshipMargin(E.PERSPECTIVES.find(x => x.id === "x90-v1")),
                              fmt: (v) => "≈" + v.toFixed(1), basis: "reference" },
    { needle: "≈91.8",        derived: pctOf(E.applyPresetSettings(opus, E.PERSPECTIVES.find(x => x.id === "x90-v1"), E.FLAGSHIP_SCOPE.traffic)),
                              fmt: (v) => "≈" + v.toFixed(1), basis: "prior" },
    /* The two §3.1 figures: correct reference readings that were published UNLABELED in the one
       carrying surface the guard did not scan. */
    { needle: "83.0% blended", derived: pctOf(E.pinReferenceLevers(E.applyPresetSettings(opus, E.PERSPECTIVES.find(x => x.id === "gptpro"), E.FLAGSHIP_SCOPE.traffic))),
                              fmt: (v) => v.toFixed(1) + "% blended", basis: "reference" },
    { needle: "−40.4%",       derived: pctOf(E.pinReferenceLevers(E.applyPresetSettings(opus, E.PERSPECTIVES.find(x => x.id === "x60-v3"), E.FLAGSHIP_SCOPE.traffic))),
                              fmt: (v) => "−" + Math.abs(v).toFixed(1) + "%", basis: "reference" },
  ];
  const REFERENCE_BASIS = ["public-evidence reference", "reference reading", "algorithmic lead 0 months",
                           "reference-reading", "at that reference", "at that same reference", "on that same reference", "that same reference",
                           "AT THE PUBLIC-EVIDENCE REFERENCE",
                           /* im-release-edit 2026-09-09: the canonical name for this basis. */
                           "planning baseline", "PLANNING BASELINE", "on the planning baseline"];
  const PRIOR_BASIS = ["ratified-prior", "ratified algorithmic-lead prior", "ratified prior",
                       "own default state", "default state carries", "calculator's own default",
                       "calculator default", "the default state of the calculator",
                       /* im-release-edit 2026-09-09: the canonical name, and the two ways the page
                          now states the assumption it adds. "the calculator's own default" was
                          retired because it named a state the calculator does not have — the
                          engine's DEFAULTS carry lead 0 and the page opens on an estimate preset,
                          so neither of them is this reading. */
                       "lead-adjusted baseline", "LEAD-ADJUSTED BASELINE",
                       "adopted 3-month algorithmic lead", "adopted +3-month algorithmic lead"];
  /* im-release-edit-r2 (2026-09-10). The rent adoption moved this page's reference reading onto
     figures that ALREADY appear elsewhere carrying a DIFFERENT and perfectly explicit basis, and the
     guard read those collisions as ungoverned. They are not: each states its basis, in words this
     vocabulary simply did not know —
       ≈77% the Fable estimate's quoted central, stated "at effective price" / "effective billings";
       ≈91% the Grok cash-marginal valuation replay, stated as "cash-marginal".
     Adding the phrases those occurrences DO carry is the fix; widening the guard to accept a figure
     with no basis at all would not be. */
  /* im-vet-six-repairs (2026-09-20), the vocabulary release edit: the canonical names join the
     list and the retired ones STAY, because an archived or preserved surface still carries them
     and dropping them would leave those sentences ungoverned rather than governed. */
  const OTHER_DECLARED_BASIS = ["at effective price", "at the effective price", "effective billings", "effective-billings",
                                "cash-marginal", "full-cycle TCO", "full-cycle-TCO",
                                "Anthropic-contract opportunity", "at list price",
                                "at the undiscounted list tariff", "at the undiscounted list price", "undiscounted list",
                                /* im-vet-six-repairs (2026-09-20): the traffic-mix span's upper end moved onto 68,
                                   which the lead-adjusted baseline also reads. It is a SPAN ACROSS DECLARED TRAFFIC
                                   ALTERNATIVES, not a margin on a lead basis, and it says so in the same sentence —
                                   that self-description is what clears it, not the number. */
                                "declared traffic-mix profiles", "a span across declared alternatives",
                                "across the declared provenance-honest"];
  /* Collisions that no basis vocabulary should clear, because the figure is not the metric this
     guard governs at all. Each is excluded by its own context, which the sentence states:
       - "accelerators ≈58% of per-prompt energy" is an energy share, not a margin;
       - "≈76% output-token margin at that list denominator" (im-vet-six-repairs 2026-09-20) is the
         OUTPUT-TOKEN margin, a different metric the page never ranks against the blended one and
         names on the spot. It collided with a blended figure only because the blended reading
         moved onto 76 with the vetting repairs. Naming the metric is what clears it; a bare
         figure with no metric and no basis still fails. */
  const NOT_A_MARGIN = ["of per-prompt energy", "output-token margin at that list denominator"];
  /* A figure explicitly framed as HISTORY is not a live reading and owes no live basis. Both
     instances are labelled as such in their own words: engine.js's bridge says "Until 2026-08-06
     this page published ≈77%", and an app.js code comment narrates a dead-link defect where "a
     reader ... was told they were looking at ~69% while the page rendered ~80%". Requiring a live
     basis clause inside a sentence whose subject is a superseded reading would force the page to
     mislabel its own history. */
  const HISTORICAL_FRAME = ["Until 2026-08-06 this page published", "was told they were"];
  /* Round 6 defeated the SENTENCE-scoped version three ways, all fixed here:
       (a) a sentence carrying BOTH vocabularies cleared every occurrence in it — "at the
           public-evidence reference the value is ~59%, while the calculator default is ~59%"
           passed although the second occurrence mislabels the reference number. The durable unit
           is therefore the OCCURRENCE, not the sentence: an occurrence is cleared only by a basis
           phrase in its OWN span, which starts after the previous enumerated figure.
       (b) `&nbsp;` (and friends) survived stripTags, so two rendered sentences stayed one test
           sentence. Entities are decoded before splitting.
       (c) a row with ZERO occurrences passed vacuously — deleting a published figure was
           invisible. Presence is now asserted per surface-with-hits. */
  const decode = (t) => t.replace(/&nbsp;|&#160;|&#xa0;/gi, " ").replace(/&amp;/g, "&")
                         .replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&#8212;/g, "—");
  const stripTags = (t) => decode(t).replace(/<[^>]*>/g, " ");
  const sentences = (t) => stripTags(t).split(/(?<=[.!?])\s+/);
  /* An occurrence's OWN span: from the end of the previous enumerated figure in that sentence (or
     the sentence start) through the occurrence plus a short trailing clause. A basis phrase that
     qualified an EARLIER figure can no longer clear a later one. */
  const TRAIL = 200;
  /* NEAREST-GOVERNING-BASIS rule. An occurrence is cleared when a correct-basis phrase sits before
     it (or within TRAIL after it) in the same sentence WITH NO OPPOSITE-BASIS PHRASE BETWEEN. This
     is what a reader does, and it settles both round-6 cases at once: a single basis may govern an
     enumerated list ("at the reference … 75.7% / 59.2% / 32.3%"), while a mixed-basis sentence
     cannot launder its later figure ("…~59% at the reference, while the calculator default is
     ~59%" — the intervening prior phrase breaks governance for the second occurrence). */
  /* CLAUSE-SCOPED governance. Rounds 5-8 each defeated a wider scope, and the reason is structural:
     a figure's basis is asserted by the CLAUSE it sits in, not by whatever the sentence mentions
     elsewhere. Round 8's defeat is the clean demonstration —
       "At the public-evidence reference, the comparison is discussed; ~59% is the calculator default."
     — where the correct phrase belongs to a different clause entirely and the figure's own
     predicate is the opposite basis. Splitting on clause boundaries (`;` and a comma before a
     coordinating conjunction) and requiring the basis IN the figure's own clause settles that
     class. Em-dashes deliberately do NOT split: they carry parentheticals a reader takes with the
     surrounding clause ("...carries the ratified prior — not a measurement — and reads ≈69%"),
     and splitting there would false-fail truthful copy.
     Within a clause, PRECEDING WINS (round 7): the nearest basis before the figure governs it,
     falling back to the nearest following one only when nothing precedes.
     NEGATED phrases do not count as an assertion of their basis — "~59% is not the public-evidence
     reference" asserts the opposite of what its words contain. This is a narrow lexical check, and
     the limits of ALL of this are stated in the manifest: it is a heuristic over prose, not a
     decision procedure over natural language. */
  const NEGATORS = ["not ", "never ", "rather than ", "instead of ", "no longer "];
  const clauses = (sentence) => sentence.split(/;|,\s+(?=while\b|but\b|whereas\b|although\b|though\b|yet\b)/);
  const asserted = (hay, phrase, at) => {
    // a phrase negated within the ~24 characters before it is not an assertion of that basis
    const lead = hay.slice(Math.max(0, at - 24), at).toLowerCase();
    return !NEGATORS.some(n => lead.includes(n));
  };
  const clears = (sentence, needle, own, other) => {
    const bad = [];
    for (const clause of clauses(sentence)) {
      let idx = clause.indexOf(needle);
      while (idx !== -1) {
        const before = clause.slice(0, idx);
        const after = clause.slice(idx + needle.length);
        const nearestBefore = (phrases) => {
          let d = Infinity;
          for (const b of phrases) { const i = before.lastIndexOf(b); if (i !== -1 && asserted(clause, b, i)) d = Math.min(d, idx - (i + b.length)); }
          return d;
        };
        const nearestAfter = (phrases) => {
          let d = Infinity;
          for (const b of phrases) { const j = after.indexOf(b); if (j !== -1 && asserted(clause, b, idx + needle.length + j)) d = Math.min(d, j); }
          return d;
        };
        const ownB = nearestBefore(own), otherB = nearestBefore(other);
        const governed = (ownB < Infinity || otherB < Infinity)
          ? ownB < otherB
          : nearestAfter(own) < nearestAfter(other);
        if (!governed) bad.push(clause.slice(Math.max(0, idx - 90), idx + needle.length + 90));
        idx = clause.indexOf(needle, idx + 1);
      }
    }
    return bad;
  };
  /* The quotation the enumeration above deliberately excludes, held to its own rule: the bytes
     are verbatim, and the divergence from the live reference is disclosed in the same block. */
  {
    const c2 = E.finalAnswer().tokens.c2LabelLine;
    assert('GUARD the r4 §C2 quotation is preserved VERBATIM, including "midpoint 59%"',
      c2.includes("approximately 55–61%, midpoint 59%"), c2.slice(0, 160));
    assert("GUARD ...and the block discloses where the live reference sits against that quoted zone",
      /live reference reading (sits BELOW|now sits ABOVE|sits INSIDE)/.test(c2)
        && c2.includes("≈" + Math.round(pctOf(ref())) + "%"), c2.slice(-260));
  }
  for (const f of FIGURES) {
    const want = f.fmt(f.derived);
    assert('GUARD the published string "' + f.needle + '" IS the engine\'s own rounding',
      want === f.needle, "engine says " + want);
  }
  /* One text corpus per surface, whatever its kind — file bytes for file kinds, provider records
     for `evaluated`. Everything below consumes this and nothing below knows the difference. */
  const corpusOf = (surf) => surf.kind === "evaluated"
    ? surf.provider().map(r => r.text)
    : [readFileSync(new URL(surf.rel, import.meta.url), "utf8")];
  let totalHits = 0;
  for (const surf of SURFACES) {
    if (surf.kind === "evaluated") {
      for (const rec of surf.provider()) {
        const sents = sentences(rec.text);
        /* The quotation the enumeration above deliberately excludes, held to its own rule: the bytes
     are verbatim, and the divergence from the live reference is disclosed in the same block. */
  {
    const c2 = E.finalAnswer().tokens.c2LabelLine;
    assert('GUARD the r4 §C2 quotation is preserved VERBATIM, including "midpoint 59%"',
      c2.includes("approximately 55–61%, midpoint 59%"), c2.slice(0, 160));
    assert("GUARD ...and the block discloses where the live reference sits against that quoted zone",
      /live reference reading (sits BELOW|now sits ABOVE|sits INSIDE)/.test(c2)
        && c2.includes("≈" + Math.round(pctOf(ref())) + "%"), c2.slice(-260));
  }
  for (const f of FIGURES) {
          const own = (f.basis === "reference" ? REFERENCE_BASIS : PRIOR_BASIS).concat(OTHER_DECLARED_BASIS);
          const other = f.basis === "reference" ? PRIOR_BASIS : REFERENCE_BASIS;
          const hits = sents.filter(x => x.includes(f.needle) && !NOT_A_MARGIN.some(w => x.includes(w)) && !HISTORICAL_FRAME.some(w => x.includes(w)));
          totalHits += hits.length;
          const bad = hits.flatMap(x => clears(x, f.needle, own, other));
          assert("GUARD [" + surf.rel + " :: " + rec.name + '] every OCCURRENCE of "' + f.needle + '" is governed by its ' + f.basis + " basis",
            bad.length === 0, bad.length + " ungoverned: " + JSON.stringify(bad.map(x => x.trim().slice(0, 130))));
        }
      }
      continue;
    }
    const text = readFileSync(new URL(surf.rel, import.meta.url), "utf8");
    const sents = sentences(text);
    if (surf.kind === "single") {
      // A single-basis document is cleared by ONE declaration — which must actually be there.
      assert("GUARD [" + surf.rel + "] the single-basis declaration is present verbatim",
        decode(text).includes(surf.declaration), "declaration missing — a single-basis document must say so");
      totalHits += FIGURES.filter(f => f.basis === surf.basis).reduce(
        (n, f) => n + sents.filter(x => x.includes(f.needle)).length, 0);
      // …and it may not ALSO quote the opposite basis's figures without saying so.
      for (const f of FIGURES.filter(f => f.basis !== surf.basis)) {
        const own = (f.basis === "reference" ? REFERENCE_BASIS : PRIOR_BASIS).concat(OTHER_DECLARED_BASIS);
        const other = f.basis === "reference" ? PRIOR_BASIS : REFERENCE_BASIS;
        const bad = sents.flatMap(x => clears(x, f.needle, own, other));
        assert("GUARD [" + surf.rel + '] an off-basis figure "' + f.needle + '" must qualify itself',
          bad.length === 0, JSON.stringify(bad.map(x => x.trim().slice(0, 130))));
      }
      continue;
    }
    /* The quotation the enumeration above deliberately excludes, held to its own rule: the bytes
     are verbatim, and the divergence from the live reference is disclosed in the same block. */
  {
    const c2 = E.finalAnswer().tokens.c2LabelLine;
    assert('GUARD the r4 §C2 quotation is preserved VERBATIM, including "midpoint 59%"',
      c2.includes("approximately 55–61%, midpoint 59%"), c2.slice(0, 160));
    assert("GUARD ...and the block discloses where the live reference sits against that quoted zone",
      /live reference reading (sits BELOW|now sits ABOVE|sits INSIDE)/.test(c2)
        && c2.includes("≈" + Math.round(pctOf(ref())) + "%"), c2.slice(-260));
  }
  for (const f of FIGURES) {
      const own = (f.basis === "reference" ? REFERENCE_BASIS : PRIOR_BASIS).concat(OTHER_DECLARED_BASIS);
      const other = f.basis === "reference" ? PRIOR_BASIS : REFERENCE_BASIS;
      const hits = sents.filter(x => x.includes(f.needle) && !NOT_A_MARGIN.some(w => x.includes(w)) && !HISTORICAL_FRAME.some(w => x.includes(w)));
      totalHits += hits.length;
      const bad = hits.flatMap(x => clears(x, f.needle, own, other));
      assert("GUARD [" + surf.rel + '] every OCCURRENCE of "' + f.needle + '" is governed by its ' + f.basis + " basis",
        bad.length === 0, bad.length + " ungoverned: " + JSON.stringify(bad.map(x => x.trim().slice(0, 130))));
    }
  }
  // Round 6 (c): the enumeration cannot go silently dead.
  /* §17.5: liveness spans EVERY scanned surface, file-kind and evaluated alike. It is not a
     raw-byte check — it asserts that an enumerated figure is actually published to some reader —
     and the two FA readings and the four exec-summary figures are published ONLY through the
     evaluated surface. Binding it to files would encode the claim that a figure rendered to every
     visitor is not "published". (The alternate-rounding sweep and the mode-map assertion below ARE
     raw-byte checks and stay file-bound.) */
  {
    const dead = FIGURES.filter(f => !SURFACES.some(surf =>
      corpusOf(surf).some(text => sentences(text).some(x => x.includes(f.needle)))));
    assert("GUARD the enumeration is live — every figure resolves to at least one published occurrence",
      dead.length === 0, "no occurrence on any scanned surface: " + JSON.stringify(dead.map(f => f.needle)));
  }
  assert("GUARD the scan is non-vacuous", totalHits >= 20, String(totalHits));
  /* Round 6 (d): an ALTERNATE ROUNDING publishes an enumerated value outside the enumeration.
     Banned on MIXED surfaces, where the per-occurrence rule is the only protection. Single-basis
     documents may use any precision — their whole text is governed by one declaration. KNOWN
     LIMIT, stated rather than pretended away: a genuinely NEW figure is outside any enumeration's
     reach; the M5 delta manifest records that and what would close it. */
  {
    /* im-arc T4 fold (2026-08-24): the reference reading moved 59.1806 -> 51.1786, so the BANNED
       alternate roundings are the alternates of the new value. The guard is unchanged in kind —
       it forbids any rounding of the reference other than the enumerated ones.
       im-release-edit-r2 (2026-09-10): 51.1786 -> 58.4305 under the owner ruling; same guard, same
       kind, alternates of the new value. */
    const VARIANTS = ["57.881%", "58.4305%", "≈57.88%"];
    for (const surf of SURFACES.filter(x => x.kind === "mixed")) {
      const raw = decode(readFileSync(new URL(surf.rel, import.meta.url), "utf8"));
      for (const v of VARIANTS)
        assert("GUARD [" + surf.rel + '] no alternate rounding "' + v + '" of the reference reading',
          !raw.includes(v), "found " + v);
    }
    assert("GUARD the banned variants really are roundings of the reference value",
      Math.abs(pctOf(ref()) - 58.4107) < 5e-4, String(pctOf(ref())));
  }
  // The superseded with-replacement endpoint may never return — in prose OR in a source comment
  // (round 5 found it still standing in an engine comment after the HTML had been fixed).
  for (const rel of ["../site/index.html", "../site/engine.js", "../site/app.js"])
    assert("GUARD [" + rel + "] the superseded 53.29% endpoint is gone",
      !readFileSync(new URL(rel, import.meta.url), "utf8").includes("53.29"), "53.29 still present");
  // The round-5 defeat, executed as a probe: a false sentence must NOT clear on its neighbour's
  // basis phrase. This is what proves the sentence scoping actually binds.
  {
    const check = (text) => sentences(text).flatMap(x => clears(x, "~59%", REFERENCE_BASIS, PRIOR_BASIS)).length;
    assert("GUARD round-5 defeat CAUGHT (a false sentence cannot free-ride on its neighbour)",
      check("This lands at ~59% at the public-evidence reference. The calculator default is ~59%.") === 1);
    assert("GUARD round-6 defeat (a) CAUGHT (a mixed-basis sentence cannot launder its later figure)",
      check("At the public-evidence reference the value is ~59%, while the calculator default is ~59%.") === 1);
    assert("GUARD round-6 defeat (b) CAUGHT (an HTML entity cannot hide a sentence boundary)",
      check("This lands at ~59% at the public-evidence reference.&nbsp;The calculator default is ~59%.") === 1);
    assert("GUARD a legitimately based occurrence still clears",
      check("The reference reading is ~59%.") === 0);
    assert("GUARD one basis may govern an enumerated LIST (no false failure on legitimate copy)",
      check("At the public-evidence reference the sweep spans ~59% / ~59% / ~59% margin.") === 0);
    assert("GUARD round-7 defeat CAUGHT (REVERSE order: an opposite basis nearer than a correct one wins)",
      check("The calculator default is ~59%, while at the public-evidence reference the value is ~59%.") === 1);
    assert("GUARD round-7 defeat CAUGHT (a trailing mention cannot rescue a nearer opposite basis)",
      check("The calculator default is ~59%; the public-evidence reference is discussed next.") === 1);
    assert("GUARD round-8 defeat CAUGHT (a basis in a DIFFERENT clause does not govern the figure)",
      check("At the public-evidence reference, the comparison is discussed; ~59% is the calculator default.") === 1);
    assert("GUARD round-8 defeat CAUGHT (a NEGATED basis phrase is not an assertion of that basis)",
      check("~59% is not the public-evidence reference; it is the calculator default.") === 1);
    assert("GUARD an em-dash parenthetical still governs its clause (no false failure)",
      check("At the public-evidence reference — a labeled scenario prior, not a measurement — the value is ~59%.") === 0);
    /* The guard has TWO governance modes, and the manifest's claim must say so — round 9 caught the
       claim asserting clause-local governance UNIVERSALLY while single-basis documents actually use
       declaration governance for their on-basis figures (clause-checking only their exceptions).
       Asserted here so the two can never drift apart again: the modes are exactly these, and each
       surface is typed into exactly one. */
    /* Round 10: the first cut of this assertion checked the SHAPE of the typing (both labels
       present, single entries carry strings) but not the MAPPING — re-typing the HTML annex from
       single to mixed left it passing. An assertion that cannot fail on the thing it claims to
       pin is worse than none, because the manifest cites it as the anti-drift mechanism. It now
       pins the exact path→mode mapping and the exact declaration text. */
    const MODE_MAP = {
      "../site/index.html": "mixed",
      "../site/app.js": "mixed",
      "../site/engine.js": "evaluated",   // b9 M6 D-6d
      "../site/research/final-answer-rationale.html": "single",
      "../research/final-answer-rationale.md": "single",
    };
    const DECLARATION = "unless it says otherwise — algorithmic lead 0 months, family multipliers 1.0×";
    assert("GUARD the exact path→mode mapping is pinned (not merely the existence of both modes)",
      JSON.stringify(Object.fromEntries(SURFACES.map(x => [x.rel, x.kind]).sort())) === JSON.stringify(Object.fromEntries(Object.entries(MODE_MAP).sort())),
      JSON.stringify(SURFACES.map(x => [x.rel, x.kind])));
    assert("GUARD every single-basis surface pins its exact declaration text and basis",
      SURFACES.filter(x => x.kind === "single").every(x => x.declaration === DECLARATION && x.basis === "reference")
      && SURFACES.filter(x => x.kind === "single").length === 2,
      JSON.stringify(SURFACES.filter(x => x.kind === "single").map(x => [x.rel, x.basis, x.declaration === DECLARATION])));
  }
}

/* ================= slider declarations (§8.1 / §9.1 / §9.5) ================= */
{
  const famSec = E.SECTIONS.find(s => s.interlockGroup === "family");
  const trendSec = E.SECTIONS.find(s => s.interlockGroup === "trend");
  assert("§8.1 the family sliders live in their own section, tagged for the interlock",
    !!famSec && famSec.params.map(p => p.k).join(",") === E.FAMILY_GROUP_KEYS.join(","));
  assert("§8.1 every family slider spans 0.50–1.50 at step 0.01, default 1.0",
    famSec.params.every(p => p.min === 0.50 && p.max === 1.50 && p.step === 0.01)
    && E.FAMILY_GROUP_KEYS.every(k => E.DEFAULTS[k] === 1.0));
  assert("§8.1 the family section sits immediately after the hardware blend it acts on",
    E.SECTIONS.findIndex(s => s.interlockGroup === "family") === E.SECTIONS.findIndex(s => s.title === "Hardware blend & cost") + 1);
  const trendParam = trendSec.params.find(p => p.k === "trendMonths");
  assert("§9.5 the trend slider carries the ratified label verbatim",
    trendParam.label === "Algorithmic lead (months vs published open practice)");
  assert("§9.1 months span −12..+12 at step 1", trendParam.min === -12 && trendParam.max === 12 && trendParam.step === 1);
  const rateParam = trendSec.params.find(p => p.k === "trendRate");
  assert("§9.1 the rate control is a CLOSED numeric enum, not a free slider",
    rateParam.type === "select" && rateParam.numeric === true
    && rateParam.options.map(o => o[0]).join(",") === E.TREND_RATES.join(","));
  assert("§9.5 the tip states the prior is not a measurement, restates the validity conditions, and REFUSES the price series",
    /not a measurement|SCENARIO PRIOR/i.test(E.TIPS.trendMonths.b)
    && /RESIDUAL/i.test(E.TIPS.trendMonths.b)
    && /price series/i.test(E.TIPS.trendMonths.b) && /9×-900×\/yr|9×–900×\/yr/.test(E.TIPS.trendMonths.b)
    && /capability lag/i.test(E.TIPS.trendMonths.b));
  assert("§9.5 the citation names the primary source pairing",
    /2511\.23455/.test(E.TIPS.trendMonths.s) && /Epoch/i.test(E.TIPS.trendMonths.s));
  assert("§10 the interlock and the scroll-lock have DISTINCT tips and distinct why-lines",
    !!E.TIPS.interlock && !!E.TIPS.sliderLock
    && /scroll safety/i.test(E.TIPS.sliderLock.b) && /stacking/i.test(E.TIPS.interlock.b)
    && E.INTERLOCK_WHY.trend !== E.INTERLOCK_WHY.family);
}

// ---------------- 2026-08-07 HOTFIX: the months-equivalent in the COPY is derived, not typed
{
  /* This exists because a number in prose had no tie to the function it described. The stack-
     efficiency copy said a 1.25x multiplier is "≈ +2.9 months at 3×/yr" for eleven days. On this
     engine's own trend model it is +2.4374; +2.9 is the months-equivalent of 1.30x. The two were
     transposed when the copy was written, nothing checked the sentence against the function a few
     hundred lines away, and no test could have caught it because no test knew the sentence made an
     arithmetic claim at all.

     So the assertion below does not hard-code 2.4. It INVERTS the shipped `trendFactor` by bisection
     to find the months that actually produce 1.25x at the default rate, and requires the copy to
     state that. Move the trend model, the default rate, or the sentence, and this fails. */
  const monthsForFactor = (target) => {
    const s = structuredClone(E.DEFAULTS);
    s.trendRate = E.DEFAULTS.trendRate;
    const f = (m) => { s.trendMonths = m; return E.trendFactor(s, { perspKind: "lens" }); };
    let lo = 0, hi = 24;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (f(mid) < target) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  };
  const m125 = monthsForFactor(1.25);
  assert("the months-equivalent of 1.25x is derived from the shipped trend function, not asserted",
    Math.abs(m125 - 2.4374) < 0.001, m125.toFixed(6));

  const stated = m125.toFixed(1);                       // what the copy is required to say
  const wrong = /\+2\.9 (months|mo)\b/;
  const tip = E.TIPS.stackMult.b;
  assert("the stack-efficiency tooltip states the DERIVED months-equivalent",
    tip.includes("1.25× ≈ +" + stated + " months at 3×/yr"), tip.slice(0, 200));
  assert("...and no longer states the 1.30x figure as though it were the 1.25x one",
    !wrong.test(tip));

  const tick = E.SECTIONS.flatMap(sec => sec.params || []).find(p => p.k === "stackMult")
    .ticks.find(t => t.v === 1.25);
  assert("the 1.25x tick label states the same derived figure",
    tick.l.includes("+" + stated + " mo"), tick.l);
  assert("...and not the transposed one", !wrong.test(tick.l));

  /* The page's prose makes the same claim in its own words, and prose is where it went wrong. */
  const html = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
  assert("the report bullet explaining the redefinition states the derived figure too",
    html.includes("(1.25× ≈ +" + stated + " months at 3×/yr)"));
  assert("...and the transposed figure appears nowhere on the page",
    !wrong.test(html));
}

console.log(failures ? `\n${failures} TRENDLINE-INTERLOCK FAILURE(S)` : "\nAll trendline/interlock checks passed.");
process.exit(failures ? 1 : 0);
