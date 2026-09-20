/* =====================================================================================
   nvlink-cap-lever.test.mjs — d-im-h800 (owner note aca09d, 2026-08-18): the H800/H100
   differential as a NAMED, ADJUSTABLE assumption with VISIBLE sensitivity.

   What this file enforces:
     A. the DEFAULT is inert — byte-identical headline + trend-0 reference, and every leg's
        factorApplied is 1 at nvlinkCapMinRatio 1.00;
     B. the typed lineage is a CLOSED set declared on ALL calibration rows, and the H800 (the
        F1 anchor) is the ONLY `capped-anchor`; h100 + h200 are the ONLY borrowing rows;
     C. the disposition ladder is total and ordered — lineage outranks the caller's value — and the
        MATCHED-COUNTERFACTUAL FLOOR never double counts (Pro review 2026-08-18: T = max(T_raw,
        r × T_capped-counterfactual) per phase; where the roofline already renders the uncapped
        part faster the control adds nothing until r exceeds it);
     D. the factor applies to the borrowing rows ONLY, per phase against that phase's own capped
        counterfactual (exactly r where the fabric is slack at both fabrics; `already-modeled` where
        the roofline already differentiates — the dense-TP prefill 2.25× case), and NEVER to the H800
        or to any not-applicable row (throughput and margins identical); the composed levers at their
        non-neutral bounds stay finite and factor separately;
     E. the state key rides the closed-domain codec: sanitizer accepts in-domain, rejects
        out-of-domain, encode/decode round-trips a moved lever, encoder refuses out-of-domain;
     F. the readout is COMPUTED and internally consistent: the fabric shares equal t_N ÷ the
        binding decode term from the roofline itself, the bracket ≥ 1 and small at the page
        default, the H800 stand-alone margin is IDENTICAL now vs at the probe, and the borrowing
        rows' at-probe margins equal a direct workloadOnHw evaluation with the lever moved;
     G. the pinned copy: the tip composes from the canonical constants, the reason copy exists for
        every code, the SECTIONS entry's bounds equal NVLINKCAP_BOUNDS, and the control label is
        the SAME bytes on the tip and the section.
   Run: node tests/nvlink-cap-lever.test.mjs
   ===================================================================================== */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const D = require("../site/engine-data-v22.js");
const R = require("../site/engine-roofline-v22.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
const opus = E.MODELS.find(m => m.id === "opus");
const median = E.PERSPECTIVES.find(p => p.id === "median");
const DEFAULT_STATE = () => E.applyPresetSettings(opus, median, { mode: "native" });
const withLever = (s, v) => Object.assign({}, s, { nvlinkCapMinRatio: v });

/* ================= A — the default is inert ================= */
{
  const s = DEFAULT_STATE();
  assert("A-1 DEFAULTS.nvlinkCapMinRatio is exactly 1.0", E.DEFAULTS.nvlinkCapMinRatio === 1.0);
  assert("A-2 the ratified default headline is byte-identical 68.41398315513409",
    E.workload(s).margin * 100 === 68.41398315513409, String(E.workload(s).margin * 100));
  assert("A-3 trend-0 reference blend margin is byte-identical 0.5843046405779231",
    E.workload(E.pinReferenceLevers(DEFAULT_STATE())).margin === 0.5843046405779231);
  const f = E.feasibility(s, E.scenarioContext(s));
  assert("A-4 every default-fleet leg carries the typed DTO with factorApplied 1",
    f.legs.length > 0 && f.legs.every(l => l.nvlinkCap && l.nvlinkCap.decode.factorApplied === 1 && l.nvlinkCap.prefill.factorApplied === 1 && typeof l.nvlinkCap.reasonCode === "string"),
    JSON.stringify(f.legs.map(l => l.nvlinkCap)));
  assert("A-5 REFERENCE_LEVER_PIN pins the lever at 1.0 (the FA carries the page's own assumption)",
    E.REFERENCE_LEVER_PIN.nvlinkCapMinRatio === 1.0);
  assert("A-6 the lever is a SPECIFIED lever (never interlocked)", E.SPECIFIED_LEVER_KEYS.includes("nvlinkCapMinRatio"));
}

/* ================= B — closed lineage set on ALL rows ================= */
{
  const set = D.NVLINK_CAP_LINEAGES;
  assert("B-1 NVLINK_CAP_LINEAGES is the frozen four-member closed set",
    Array.isArray(set) && Object.isFrozen(set) && set.join(",") === "capped-anchor,uncapped-borrows-capped-fit,uncapped-family-borrows-capped-fit,not-applicable");
  const rows = Object.keys(D.CALIBRATION);
  assert("B-2 every CALIBRATION row declares a lineage from the closed set",
    rows.every(k => set.includes(D.CALIBRATION[k].nvlinkCapLineage)),
    rows.map(k => k + ":" + D.CALIBRATION[k].nvlinkCapLineage).join(" "));
  const capped = rows.filter(k => D.CALIBRATION[k].nvlinkCapLineage === "capped-anchor");
  const borrowing = rows.filter(k => E.NVLINKCAP_ELIGIBLE.includes(D.CALIBRATION[k].nvlinkCapLineage));
  assert("B-3 the H800 — the F1 anchor — is the ONLY capped-anchor", capped.join(",") === "h800", capped.join(","));
  assert("B-4 h100 and h200 are the ONLY borrowing rows, and h100 is the exact-constants transfer while h200 is the provenance-distinct family transfer",
    borrowing.sort().join(",") === "h100,h200" && D.CALIBRATION.h100.nvlinkCapLineage === "uncapped-borrows-capped-fit" && D.CALIBRATION.h200.nvlinkCapLineage === "uncapped-family-borrows-capped-fit", borrowing.join(","));
  assert("B-4b h20 (own F2/F3 fit on H20, full NVLink4) and the Blackwell rows are OUT of scope — eligibility follows provenance, not the nominal fabric",
    ["h20", "gb200", "gb300"].every(k => D.CALIBRATION[k].nvlinkCapLineage === "not-applicable"));
  assert("B-5 the borrowing rows really do inherit the H800 fit (η equal, lineage typed on the row)",
    D.CALIBRATION.h100.etaDec === D.CALIBRATION.h800.etaDec && D.CALIBRATION.h200.etaDec === D.CALIBRATION.h800.etaDec
    && /inherit|family-transfer/.test(D.CALIBRATION.h100.etaStatus + D.CALIBRATION.h200.etaStatus));
  assert("B-6 the H800 fabric is the export cap and the borrowing rows are uncapped (registry facts the lever rests on)",
    D.HW_ROOFLINE.h800.fabric === 400e9 && D.HW_ROOFLINE.h100.fabric === 900e9 && D.HW_ROOFLINE.h200.fabric === 900e9);
  assert("B-7 nvlinkCapLineageFor resolves every row and throws on an unregistered one",
    rows.every(k => set.includes(E.nvlinkCapLineageFor(k))) && (() => { try { E.nvlinkCapLineageFor("no-such-row"); return false; } catch (e) { return /nvlinkCapLineage/.test(String(e.message)); } })());
}

/* ================= C — the ladder + the counterfactual floor ================= */
{
  const d = E.nvlinkCapPhaseDisposition;
  const tie = { rooflineRatio: 1 }, already = { rooflineRatio: 2.25 }, partial = { rooflineRatio: 1.05 };
  assert("C-1 capped-anchor outranks any value", d("capped-anchor", 1.25, tie).factorApplied === 1 && d("capped-anchor", 1.25, tie).reasonCode === "capped-anchor");
  assert("C-2 not-applicable outranks any value", d("not-applicable", 1.25, tie).factorApplied === 1 && d("not-applicable", 1.25, tie).reasonCode === "not-applicable");
  assert("C-3 borrowing at 1.00 = eligible-neutral, factor 1", d("uncapped-borrows-capped-fit", 1.00, tie).reasonCode === "eligible-neutral" && d("uncapped-borrows-capped-fit", 1.00, tie).factorApplied === 1);
  assert("C-4 borrowing at 1.10 where the fabric is slack (roofline ratio 1) = floor-applied, factor EXACTLY 1.10", d("uncapped-borrows-capped-fit", 1.10, tie).reasonCode === "floor-applied" && d("uncapped-borrows-capped-fit", 1.10, tie).factorApplied === 1.10);
  assert("C-4b the family-transfer lineage is eligible on the same ladder", d("uncapped-family-borrows-capped-fit", 1.10, tie).factorApplied === 1.10);
  assert("C-5 borrowing at 1.10 where the roofline already renders 2.25× = already-modeled, factor 1 (NO double counting)", d("uncapped-borrows-capped-fit", 1.10, already).reasonCode === "already-modeled" && d("uncapped-borrows-capped-fit", 1.10, already).factorApplied === 1);
  assert("C-6 partial: r 1.10 over an already-rendered 1.05 → factor 1.10/1.05 (the floor, not a stack)", Math.abs(d("uncapped-borrows-capped-fit", 1.10, partial).factorApplied - 1.10 / 1.05) < 1e-12);
  assert("C-7 an unknown lineage is a hard error, never credited", (() => { try { d("garbage", 1.1, tie); return false; } catch (e) { return true; } })());
  assert("C-8 a non-numeric value on a borrowing row is eligible-neutral (fail-safe to 1)", d("uncapped-borrows-capped-fit", undefined, tie).factorApplied === 1 && d("uncapped-borrows-capped-fit", "1.2", tie).factorApplied === 1);
  assert("C-9 a missing counterfactual (null) is treated as a tie — the factor is r, never more", d("uncapped-borrows-capped-fit", 1.20, null).factorApplied === 1.20);
  assert("C-10 the overall leg code: floor-applied if either phase applies; already-modeled if r>1 and neither does",
    E.nvlinkCapLegCode({ reasonCode: "already-modeled" }, { reasonCode: "floor-applied" }) === "floor-applied"
    && E.nvlinkCapLegCode({ reasonCode: "already-modeled" }, { reasonCode: "already-modeled" }) === "already-modeled"
    && E.nvlinkCapLegCode({ reasonCode: "eligible-neutral" }, { reasonCode: "eligible-neutral" }) === "eligible-neutral");
}

/* ================= D — application: borrowing rows only, both phases, exact ================= */
{
  const s = DEFAULT_STATE(), ctx = E.scenarioContext(s);
  const s2 = withLever(s, 1.10);
  const tok = (k, st, kind) => E.tokPerS(E.HW[k], st, kind, undefined, ctx);
  for (const k of ["h100", "h200"]) {
    assert(`D-1 ${k} decode throughput scales EXACTLY ×1.10`, Math.abs(tok(k, s2, "out") / tok(k, s, "out") - 1.10) < 1e-12, String(tok(k, s2, "out") / tok(k, s, "out")));
    assert(`D-2 ${k} prefill throughput scales EXACTLY ×1.10 (both phases)`, Math.abs(tok(k, s2, "in") / tok(k, s, "in") - 1.10) < 1e-12, String(tok(k, s2, "in") / tok(k, s, "in")));
    assert(`D-3 ${k} nvlinkCapFactor is 1.10 in both phases`, E.nvlinkCapFactor(E.HW[k], s2, ctx, undefined, "out") === 1.10 && E.nvlinkCapFactor(E.HW[k], s2, ctx, undefined, "in") === 1.10);
  }
  for (const k of ["h800", "gb200", "gb300", "h20", "tpu7", "trn2", "trn3", "ascend"]) {
    const a = tok(k, s, "out"), b = tok(k, s2, "out"), ai = tok(k, s, "in"), bi = tok(k, s2, "in");
    assert(`D-4 ${k} throughput is IDENTICAL with the lever at 1.10 (both phases)`,
      (Number.isNaN(a) && Number.isNaN(b) || a === b) && (Number.isNaN(ai) && Number.isNaN(bi) || ai === bi), `${a}/${b} ${ai}/${bi}`);
    assert(`D-5 ${k} nvlinkCapFactor is exactly 1`, E.nvlinkCapFactor(E.HW[k], s2, ctx, undefined, "out") === 1 && E.nvlinkCapFactor(E.HW[k], s2, ctx, undefined, "in") === 1);
  }
  const m800 = E.workloadOnHw(E.HW.h800, s, undefined, ctx).margin, m800b = E.workloadOnHw(E.HW.h800, s2, undefined, ctx).margin;
  assert("D-6 the H800 stand-alone margin is byte-identical with the lever moved (the anchor is never haircut or lifted)", m800 === m800b, `${m800} vs ${m800b}`);
  const m100 = E.workloadOnHw(E.HW.h100, s, undefined, ctx).margin, m100b = E.workloadOnHw(E.HW.h100, s2, undefined, ctx).margin;
  assert("D-7 the H100 stand-alone margin RISES with the lever (the sensitivity is real, not cosmetic)", m100b > m100, `${m100} -> ${m100b}`);
  const w = E.workload(s, undefined, ctx).margin, w2 = E.workload(s2, undefined, ctx).margin;
  assert("D-8 the default blend (which carries borrowing legs) moves with the lever", w2 > w, `${w} -> ${w2}`);
  // the DeepSeek disclosure replay is ALL-H800: the lever cannot move it at all
  const dsr1 = E.MODELS.find(m => m.id === "dsr1"), ds = E.PERSPECTIVES.find(p => p.id === "deepseek");
  const r = E.applyPresetSettings(dsr1, ds), rctx = E.scenarioContext(r);
  assert("D-9 the all-H800 DeepSeek replay is byte-identical under any lever value (the measurement is the measurement)",
    E.workload(r, undefined, rctx).margin === E.workload(withLever(r, 1.5), undefined, rctx).margin);
  // per-leg DTO on the moved state
  const f2 = E.feasibility(s2, ctx);
  const codes = Object.fromEntries(f2.legs.map(l => [l.hwKey, l.nvlinkCap.reasonCode + ":" + l.nvlinkCap.decode.factorApplied + ":" + l.nvlinkCap.prefill.factorApplied]));
  assert("D-10 per-leg DTO on the moved state: h100/h200 floor-applied 1.1/1.1, others not-applicable 1/1",
    codes.h100 === "floor-applied:1.1:1.1" && codes.h200 === "floor-applied:1.1:1.1" && Object.entries(codes).filter(([k]) => k !== "h100" && k !== "h200").every(([, v]) => v === "not-applicable:1:1"), JSON.stringify(codes));
  /* the DENSE-TP donor: prefill's fabric term BINDS and the roofline already renders the H100 2.25× its
     capped counterfactual — the control must NOT stack on that (Pro review, blocking finding). */
  const custom = E.MODELS.find(m => m.id === "custom");
  const cs = E.applyPresetSettings(custom, median, { mode: "native" }); cs.customDonor = "llama70";
  const cctx = E.makeScenarioContext(custom, null, "llama70");
  const cs2 = withLever(cs, 1.10);
  const cIn = E.tokPerS(E.HW.h100, cs2, "in", undefined, cctx) / E.tokPerS(E.HW.h100, cs, "in", undefined, cctx);
  const cOut = E.tokPerS(E.HW.h100, cs2, "out", undefined, cctx) / E.tokPerS(E.HW.h100, cs, "out", undefined, cctx);
  assert("D-11 dense-TP donor, H100 at ×1.10: prefill factor is EXACTLY 1 (already 2.25× via the binding fabric term — not counted twice) while decode (slack) is 1.10",
    cIn === 1 && Math.abs(cOut - 1.10) < 1e-12, `${cIn} / ${cOut}`);
  const cf = E.feasibility(Object.assign({}, cs2, { blend: { h100: 100 } }), cctx).legs[0].nvlinkCap;
  assert("D-12 …and the DTO says so: prefill rooflineRatio 2.25, factor 1; decode rooflineRatio 1, factor 1.10; leg code floor-applied",
    Math.abs(cf.prefill.rooflineRatio - 2.25) < 1e-9 && cf.prefill.factorApplied === 1 && cf.decode.rooflineRatio === 1 && cf.decode.factorApplied === 1.10 && cf.reasonCode === "floor-applied", JSON.stringify(cf));
  const cs3 = withLever(cs, 1.25);
  const cIn3 = E.tokPerS(E.HW.h100, cs3, "in", undefined, cctx) / E.tokPerS(E.HW.h100, cs, "in", undefined, cctx);
  assert("D-13 even at the upper bound 1.25 the prefill floor stays met by the roofline (2.25 > 1.25) — factor 1", cIn3 === 1, String(cIn3));
  /* composed levers at their non-neutral bounds: finite, and each factor is separately identifiable */
  const gate = Object.assign(withLever(s, 1.25), { stackMult: 0.7, specDec: 1.60, famNvidia: 1.5, trendMonths: 12, trendRate: 3 });
  const gctx = E.scenarioContext(s);
  const outAll = E.tokPerS(E.HW.h100, gate, "out", undefined, gctx), inAll = E.tokPerS(E.HW.h100, gate, "in", undefined, gctx);
  const base = Object.assign({}, s, { stackMult: 0.7 });   // stackMult enters η, so the base carries the same tick
  const rawOut = E.tokPerS(E.HW.h100, base, "out", undefined, gctx) / (E.familyFactor(E.HW.h100, base) * E.trendFactor(base, gctx));
  const expectOut = rawOut * 1.5 * Math.pow(3, 12 / 12) * 1.60 * 1.25;
  assert("D-14 all levers at their non-neutral bounds compose finitely and multiplicatively in a fixed order (family × trend × specDec[decode] × fit-transfer)",
    isFinite(outAll) && isFinite(inAll) && Math.abs(outAll / expectOut - 1) < 1e-9, `${outAll} vs ${expectOut}`);
  const gf = E.feasibility(gate, gctx).legs.find(l => l.hwKey === "h100");
  assert("D-15 the composed state's leg DTO still reports the fit-transfer factor SEPARATELY (1.25 per phase) beside specDec's own factor",
    gf.nvlinkCap.decode.factorApplied === 1.25 && gf.nvlinkCap.prefill.factorApplied === 1.25 && gf.specDec.factorApplied === 1.60, JSON.stringify([gf.nvlinkCap, gf.specDec]));
}

/* ================= E — codec ================= */
{
  const s = DEFAULT_STATE();
  assert("E-1 SCENARIO_BOUNDS.nvlinkCapMinRatio is NVLINKCAP_BOUNDS = [1.00, 1.25] (Pro review Q3: never below 1.00; residual-scale ceiling)",
    E.SCENARIO_BOUNDS.nvlinkCapMinRatio === E.NVLINKCAP_BOUNDS && E.NVLINKCAP_BOUNDS[0] === 1.00 && E.NVLINKCAP_BOUNDS[1] === 1.25 && Object.isFrozen(E.NVLINKCAP_BOUNDS));
  const ok = E.sanitizeScenarioDiff({ nvlinkCapMinRatio: 1.23 }, null);
  assert("E-2 sanitizer accepts an in-domain value", ok.diff.nvlinkCapMinRatio === 1.23 && ok.rejected.length === 0, JSON.stringify(ok));
  const bad = E.sanitizeScenarioDiff({ nvlinkCapMinRatio: 1.3 }, null), bad2 = E.sanitizeScenarioDiff({ nvlinkCapMinRatio: 0.9 }, null), bad3 = E.sanitizeScenarioDiff({ nvlinkCapMinRatio: "1.1" }, null);
  assert("E-3 sanitizer rejects out-of-domain / non-numeric values (fail closed)",
    bad.diff.nvlinkCapMinRatio === undefined && bad.rejected.length === 1 && bad2.rejected.length === 1 && bad3.rejected.length === 1, JSON.stringify([bad.rejected, bad2.rejected, bad3.rejected]));
  assert("E-4 leverDomainViolation names the field when out of domain and is null in domain",
    /nvlinkCapMinRatio/.test(String(E.leverDomainViolation({ nvlinkCapMinRatio: 2 }))) && E.leverDomainViolation({ nvlinkCapMinRatio: 1.25 }) === null);
  const tr = E.resolveTraffic(opus, median, { mode: "native" });
  const ids = { fleet: E.DEFAULT_FLEET_ID, totalCase: "revised-band-central-2.5" };
  let tok = null, err = null;
  try { tok = E.encodeScenario(withLever(s, 1.12), "opus", "median", tr, null, ids); } catch (e) { err = e; }
  assert("E-5 encode round-trip: a moved lever survives encode → decode", (() => {
    if (!tok) return false; const dec = E.decodeScenario(tok); return !!dec && dec.nvlinkCapMinRatio === 1.12; })(), err ? String(err.message) : (tok ? "decoded state lacks the lever" : "no token"));
  const pre = E.decodeScenario(E.encodeScenario(s, "opus", "median", tr, null, ids));
  assert("E-5b a pre-leg link (no lever key) resolves to the default 1.00", !!pre && (!("nvlinkCapMinRatio" in pre) || pre.nvlinkCapMinRatio === 1.0));
  /* Pro review Q7: numeric identity is not permalink identity. The NEUTRAL key must never be encoded, so
     the default state's token BYTES are those of the pre-leg encoder (the diff carries only what
     differs), and a state carrying the key at 1.00 mints the same bytes as one without the key. */
  const tokDefault = E.encodeScenario(s, "opus", "median", tr, null, ids);
  const sNoKey = Object.assign({}, s); delete sNoKey.nvlinkCapMinRatio;
  const tokNoKey = E.encodeScenario(sNoKey, "opus", "median", tr, null, ids);
  assert("E-7 the neutral key is NEVER encoded: default-state token bytes contain no 'nvlinkCap' and equal the token of a keyless state",
    !/nvlinkCap/.test(tokDefault) && tokDefault === tokNoKey, tokDefault.length + " chars");
  assert("E-8 a moved lever IS encoded (the diff carries what differs)", /nvlinkCap/.test(tok || "") || (() => { const dd = E.decodeScenario(tok); return dd && dd.nvlinkCapMinRatio === 1.12; })());
  let refused = false;
  try { E.encodeScenario(withLever(s, 1.3), "opus", "median", tr, null, ids); } catch (e) { refused = /nvlinkCapMinRatio/.test(String(e.message)); }
  assert("E-6 the encoder REFUSES to mint an out-of-domain lever (fail loud at the mint)", refused);
}

/* ================= F — the readout is computed and consistent ================= */
{
  const s = DEFAULT_STATE(), ctx = E.scenarioContext(s);
  const rd = E.nvlinkCapReadout(s, ctx);
  assert("F-1 readout reports the three Hopper rows with lineage", ["h800", "h100", "h200"].every(k => rd.rows[k] && rd.rows[k].lineage === E.nvlinkCapLineageFor(k)));
  const a = rd.rows.h800, c = rd.rows.h100;
  assert("F-2 both rows render at the page default", a.renderable && c.renderable);
  // recompute the h800 decode terms directly from the roofline module at the same operating point
  const arch = R.resolveArch(ctx.modelId, ctx.customDonor);
  const lengths = R.resolveTrafficLengths({ profileId: ctx.profileId ?? null, ioRatio: s.ioRatio });
  const dd = R.decodeRoofline({ arch, activeB: s.active, totalB: s.total, hwKey: "h800", b: a.b, L: lengths.L, precision: s.precision, stackMult: s.stackMult, declaredOperatingWidth: 144 });
  assert("F-3 the H800 fabric share equals t_N ÷ max(t_C,t_H) from the roofline itself (nothing authored)",
    Math.abs(a.decode.fabricShareOfBinding - dd.tN / Math.max(dd.tC, dd.tH)) < 1e-12 && a.decode.bindingTerm === dd.bindingTerm, `${a.decode.fabricShareOfBinding} vs ${dd.tN / Math.max(dd.tC, dd.tH)}`);
  assert("F-4 the fabric term is SLACK at the page default (t_H binds; share < 10% on both rows) — the smallness is shown, not hidden",
    a.decode.bindingTerm === "t_H" && c.decode.bindingTerm === "t_H" && a.decode.fabricShareOfBinding < 0.10 && c.decode.fabricShareOfBinding < a.decode.fabricShareOfBinding, `${a.decode.fabricShareOfBinding} / ${c.decode.fabricShareOfBinding}`);
  assert("F-5 the H100 fabric term is exactly the H800's × 400/900 (same payload, registered fabrics)",
    Math.abs(c.decode.tN / a.decode.tN - 400 / 900) < 1e-12);
  assert("F-6 the serial-exposure counterfactual is ≥ 1 and < 1.05 at the page default, and equals t_iter,800 ÷ (t_iter,800 − t_N,800 + t_N,100)",
    rd.serialExposureCounterfactualH100OverH800 >= 1 && rd.serialExposureCounterfactualH100OverH800 < 1.05
    && Math.abs(rd.serialExposureCounterfactualH100OverH800 - a.decode.tIter / (a.decode.tIter - a.decode.tN + c.decode.tN)) < 1e-12, String(rd.serialExposureCounterfactualH100OverH800));
  assert("F-7 the H800 stand-alone margin is IDENTICAL at neutral, current and the slope point", rd.alone.h800.neutral === rd.alone.h800.current && rd.alone.h800.current === rd.alone.h800.atSlope && rd.alone.h800.current !== null);
  const s2 = withLever(s, rd.slopeTo);
  assert("F-8 the H100/H200 at-slope margins equal a direct evaluation with the lever moved to the slope point",
    rd.alone.h100.atSlope === E.workloadOnHw(E.HW.h100, s2, undefined, ctx).margin && rd.alone.h200.atSlope === E.workloadOnHw(E.HW.h200, s2, undefined, ctx).margin);
  assert("F-9 the blend at-slope margin equals a direct workload evaluation, and current equals the headline",
    rd.blend.atSlope === E.workload(s2, undefined, ctx).margin && rd.blend.current === E.workload(s, undefined, ctx).margin && rd.blend.neutral === rd.blend.current);
  assert("F-10 the readout names its setting, neutral, and the slope unit (no privileged setting)", rd.setting === 1 && rd.neutral === 1 && rd.slopeStep === E.NVLINKCAP_SLOPE_STEP && rd.slopeTo === 1.05);
  assert("F-10b the borrowing rows' roofline ratio over their capped counterfactual is exactly 1 at the page default (fabric slack at both 400 and 900) — the smallness, computed",
    c.decode.rooflineRatioOverCapped === 1 && c.prefill.rooflineRatioOverCapped === 1 && rd.rows.h200.decode.rooflineRatioOverCapped === 1);
  // dense-TP donor: the fabric term BINDS prefill and the H100 already renders faster with no lever
  const custom = E.MODELS.find(m => m.id === "custom");
  const cs = E.applyPresetSettings(custom, median, { mode: "native" }); cs.customDonor = "llama70";
  const cctx = E.makeScenarioContext(custom, null, "llama70");
  const crd = E.nvlinkCapReadout(cs, cctx);
  assert("F-11 on the dense-TP donor prefill binds on the FABRIC and the H100 prefill throughput exceeds the H800's with the lever at 1.00 — the differential is already live there, and the readout's roofline ratio over the capped counterfactual says 2.25",
    crd.rows.h800.renderable && crd.rows.h800.prefill.bindingTerm === "fabric" && crd.rows.h100.prefill.tokPerS > crd.rows.h800.prefill.tokPerS * 1.5 && Math.abs(crd.rows.h100.prefill.rooflineRatioOverCapped - 2.25) < 1e-9,
    JSON.stringify({ b: crd.rows.h800.prefill.bindingTerm, r: crd.rows.h100.prefill.tokPerS / crd.rows.h800.prefill.tokPerS, rr: crd.rows.h100.prefill.rooflineRatioOverCapped }));
}

/* ================= G — pinned copy ================= */
{
  const t = E.TIPS.nvlinkCapMinRatio;
  assert("G-1 the tip composes from the four canonical constants, in order",
    t && t.t === E.NVLINKCAP_CONTROL_LABEL && t.b === E.NVLINKCAP_TIP_HEAD + " " + E.NVLINKCAP_WHAT_IT_DOES + " " + E.NVLINKCAP_WHAT_THE_ENGINE_SAYS + " " + E.NVLINKCAP_WHAT_IT_IS_NOT);
  const sec = E.SECTIONS.find(x => x.title === E.NVLINKCAP_SECTION_TITLE);
  const param = sec && sec.params.find(q => q.k === "nvlinkCapMinRatio");
  assert("G-2 the SECTIONS entry exists, has no interlockGroup, and its literal bounds equal NVLINKCAP_BOUNDS",
    !!param && sec.interlockGroup === undefined && param.min === E.NVLINKCAP_BOUNDS[0] && param.max === E.NVLINKCAP_BOUNDS[1] && param.step === 0.01 && param.tip === "nvlinkCapMinRatio");
  assert("G-3 the control label is the SAME bytes on the tip and the section", param && param.label === E.NVLINKCAP_CONTROL_LABEL);
  assert("G-4 the 1.00 tick is labeled as the default", param && param.ticks.some(k => k.v === 1.00 && /default/.test(k.l)));
  const dto = { ratio: 1.1, decode: { factorApplied: 1.1, rooflineRatio: 1 }, prefill: { factorApplied: 1, rooflineRatio: 2.25 } };
  for (const code of ["capped-anchor", "not-applicable", "eligible-neutral", "floor-applied", "already-modeled"])
    assert(`G-5 pinned reason copy exists for '${code}' and names the assumption`, /fit-transfer assumption/.test(E.nvlinkCapReasonText(code, dto)));
  assert("G-6 'floor-applied' copy prints BOTH phase factors and the roofline ratios (nothing hidden)", /decode ×1\.100, prefill ×1\.000/.test(E.nvlinkCapReasonText("floor-applied", dto)) && /2\.250×/.test(E.nvlinkCapReasonText("floor-applied", dto)));
  assert("G-6b 'already-modeled' copy says nothing is counted twice", /nothing is counted twice/.test(E.nvlinkCapReasonText("already-modeled", dto)));
  assert("G-7 an unknown reason code is a hard error", (() => { try { E.nvlinkCapReasonText("nope", dto); return false; } catch (e) { return true; } })());
  assert("G-8 the tip discloses that no matched measurement exists (a belief, not a finding), the may-include-cap-effects wording, and the no-double-count rule", /No matched serving observation/.test(t.b) && /not this page's finding/.test(t.b) && /cannot be separately identified/.test(t.b) && /cannot count an advantage twice/.test(t.b));
  assert("G-8b no reader-facing surface calls this an 'uplift' (Pro review Q6)", !/uplift/i.test(t.t + t.b + E.NVLINKCAP_SECTION_TITLE + Object.values(E.NVLINKCAP_REASON_COPY).map(f => f(dto)).join("")));
  assert("G-9 the H800 display note carries the correction and names the lever", /CORRECTION to the 2026-08-16 annotation/.test(E.HW.h800.note) && /nvlinkCapMinRatio/.test(E.HW.h800.note));
}

console.log(failures === 0 ? "\nALL NVLINK-CAP LEVER CHECKS PASS" : `\n${failures} NVLINK-CAP LEVER FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
