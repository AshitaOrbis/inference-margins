// Deterministic release tests (methodology v2, 2026-07-10).
// Run: node tests/snapshots.test.mjs — exits non-zero on any failure.
import { createRequire } from "node:module";
import { assertNoOrphanRegistrations, provenance } from "./provenance-inputs.mjs";
const require = createRequire(import.meta.url);
const E = require("../site/engine.js");
const DC = require("../site/engine-data-dc-v1.js");
/* b9 M5 fixture scope (M5 delta manifest) — REFERENCE-CLASS suite. M5 seeds every clean state
   with the ratified per-lab algorithmic-lead prior (+3 months for Anthropic), which multiplies
   achieved throughput by E = 1.3161 and therefore every cost/margin this suite pins. This suite
   certifies reviewed calibration points, chart parity and published-report bridges — statements about the PUBLIC-EVIDENCE
   REFERENCE, not about the calculator's default scenario prior. Every state it derives is
   therefore pinned to trend 0 / family 1.0 through the SAME constructor the final-answer surface
   uses (engine §15 / decision D-10), and every pinned digit below is BYTE-UNCHANGED. The default
   state's movement is carried, in full, by tests/fixtures-baseline-v22.json (regenerated) and the
   render-parity WIDE hash — see the M5 delta manifest. */
const preset = (m, p, sel) => E.pinReferenceLevers(E.applyPresetSettings(m, p, sel));

const R = require("../site/engine-roofline-v22.js");
const D = require("../site/engine-data-v22.js");

let failures = 0;
const assert = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  — " + detail}`);
  if (!cond) failures++;
};
/* The release-entrypoint and publisher gates below read deploy.sh and scripts/publish.sh, which
   are private by design and absent from a reconstructed public stage. They self-skip there, by
   count and under a labeled banner; in the private tree the hard guard makes them mandatory.
   See provenance-inputs.mjs. */
const P = provenance("snapshots", assert);
const settings = (mid, pid) => preset(E.MODELS.find(m => m.id === mid), E.PERSPECTIVES.find(p => p.id === pid));
const marginPct = s => E.workload(s).margin * 100;

// IM3 slice 3 — the live display path consumes the reviewed roofline core. Mixed fleets
// renormalize over finite+capped legs and disclose that structural fact; an all-infeasible
// fleet remains explicitly non-numeric.
{
  const m = E.MODELS.find(x => x.id === "opus"), p = E.PERSPECTIVES.find(x => x.id === "median");
  const s = preset(m, p, { mode: "native" });
  const live = E.tokPerS(E.HW.h200, s, "out");
  const parallel = R.renderPoint({ arch: R.resolveArch("opus"), activeB: s.active, totalB: s.total,
    hwKey: "h200", regime: s.interact, precision: s.precision, stackMult: s.stackMult,
    profileId: m.nativeTraffic, ioRatio: s.ioRatio });
  assert("IM3 switch: live h200 decode equals the reviewed parallel point",
    Math.abs(live - parallel.tokPerS) < 1e-9, `${live} vs ${parallel.tokPerS}`);
  const wl = E.workload(s);
  // FA re-mint (memo J-9): at the revised flagship size (2.5T) EVERY declared leg
  // serves its declared operating point — the chokepoint seeds all 7 members and the
  // 5T exclusion story lives on the labeled size case (see the fleets suite). The
  // D-10 statuses populate (fullMemory covers weights + peak KV + the flat 10%-HBM
  // reserve, while runtime-specific workspace demand and fragmentation stay
  // unverified; economics = the worst evidence-quality pair on the blend).
  /* im-arc T4 fold (2026-08-24), memo §4: the default fleet still has SEVEN member legs — what
     changed is that three of them (gb200, gb300, trn3) have no admissible public planning rate,
     so under the page's default rent basis only four are PRICED and the weld clause says so. The
     membership property this assertion was written for is unchanged and is asserted below; the
     renderable count is the honest consequence of refusing to invent three rates. */
  /* im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok:
     and the three legs are priced again, so the honest consequence reverses — 7 of 7 at 100% weight.
     The MEMBERSHIP property this assertion was written for has been unchanged throughout both moves,
     which is the point of asserting it separately from the priced count. */
  /* im-vet-six-repairs (2026-09-10 -> 2026-09-20): the MEMBERSHIP property this assertion was
     written for is what moves this time, and deliberately: the two Trainium legs are withdrawn
     from the default on evidence grounds, so the default is FIVE member legs and all five render.
     "all member legs render, policy-clean" is unchanged and is still what is asserted. */
  assert("IM3 mixed fleet (FA): the filtered default renders 5 of 5 member legs, policy-clean, statuses populated",
    isFinite(wl.margin) && wl.fleetRenderable && wl.fleetRenderable.renderableLegs === 5
    && wl.fleetRenderable.totalLegs === 5
    && Math.abs(wl.fleetRenderable.renderableWeightShare - 1) < 5e-3
    && wl.fleetRenderable.allLegsRenderableUnderPolicy === true
    && wl.fleetRenderable.placementVerified === false
    && wl.fleetRenderable.statusVector.fullMemory === "weights+peak-KV+flat-10%-HBM-reserve fit at the declared operating point under the policy (runtime-specific workspace demand and fragmentation unmodeled)"
    && wl.fleetRenderable.statusVector.economics === "evidence-quality: analyst-set-assumed-op throughput · analyst-set price", // b9 M1: gb300 relabelled fitted → analyst-set-assumed-op, which is the worst class on this blend
    JSON.stringify(wl.fleetRenderable));
  // R2 re-mint: gb200-only@5T now RENDERS at the solver width (the redesign's whole point);
  // the honest-null fixture moves to trn2@10T (the solver's own counterexample pin — no
  // legal width fits, typed infeasible, NO numbers).
  const zero = preset(m, p, { mode: "native" }); zero.blend = { trn2: 100 }; zero.total = 10000;
  const zw = E.workload(zero);
  assert("IM3 mixed fleet (R2): honest-null blend (trn2@10T) returns no numeric margin",
    !isFinite(zw.margin) && zw.fleetRenderable && zw.fleetRenderable.renderableLegs === 0
    && zw.fleetRenderable.totalLegs === 1 && zw.fleetRenderable.renderableWeightShare === 0,
    JSON.stringify(zw));
}

// IM3 slice-3 review R7 P1 fix (restructured per review R7b — the original version below was
// found VACUOUS: it called E.registerScenarioContext() directly inside the test, so all three
// still passed even with the a17cc99 production fix fully reverted, because the test re-did the
// registration itself). These tests now call the exact PRODUCTION functions app.js's three call
// sites delegate to (engine.js: restoreSavedPresetState, restoreModifiedLinkState,
// applyModelSwitchWhileModified) — the test performs NO registration of its own. A reversion of
// those functions' internal registerScenarioContext() call is proven, not asserted, to fail these
// tests (see the R7b section of research/im3-slice3-packet.md for the revert-run-restore record).
{
  const opus = E.MODELS.find(x => x.id === "opus"), grok = E.MODELS.find(x => x.id === "grok");
  const median = E.PERSPECTIVES.find(x => x.id === "median");

  // Sanity: a state cloned with NO registered context still fails closed on a bare call — the
  // fix is that encodeScenario never depends on this path, not that it silently succeeds.
  const bare = structuredClone(preset(opus, median, { mode: "native" }));
  let threw = false;
  try { E.workload(bare); } catch { threw = true; }
  assert("context fix: bare workload() on an unregistered clone still fails closed", threw);

  // 1. Saved-state sharing — drives engine.js's restoreSavedPresetState, the exact function
  // app.js's loadSavedPreset (app.js:~317) delegates to. S is built under one model, "saved" (a
  // numeric snapshot), then "loaded" while a DIFFERENT model is selected — restoreSavedPresetState
  // interprets saved numbers under whatever model is passed as current.
  {
    const original = preset(opus, median, { mode: "native" });
    const saved = structuredClone(original); // what localStorage would hold
    const loadTraffic = E.resolveTraffic(grok, median, { mode: "native" });
    /* b9 spec-decode LEVER ([N-CORRECTION-LIFETIME] rule 1): the return contract is now
       {state, corrections} — the function used to compute a sanitize result and discard it, so a
       forced correction had nowhere to go. Every field of the old return is `.state`. */
    const restored = E.restoreSavedPresetState(saved, grok, loadTraffic); // the production call, no test-side registration
    const S = restored.state;
    assert("saved-state sharing: the restore contract carries a corrections channel, empty on a clean state",
      Array.isArray(restored.corrections) && restored.corrections.length === 0,
      JSON.stringify(restored.corrections));
    const uiMargin = E.workload(S, undefined, E.makeScenarioContext(grok, loadTraffic, S.customDonor)).margin * 100;
    // Bare-call check (the part sensitive to restoreSavedPresetState's own registerScenarioContext
    // call, NOT to encodeScenario's independent context derivation): no supplied context at all —
    // this can only succeed via the WeakMap restoreSavedPresetState just populated.
    let bareResult;
    try { bareResult = E.workload(S).margin * 100; } catch (e) { bareResult = "THREW: " + e.message; }
    assert("saved-state sharing: bare workload(S) (WeakMap-only) matches the grok context, not a throw or stale mapping",
      typeof bareResult === "number" && Math.abs(bareResult - uiMargin) < 0.001,
      `bare call gave ${bareResult}, expected ${uiMargin}`);
    let tok;
    assert("saved-state sharing: encodeScenario on the restored (production-registered) state does not throw",
      (() => { try { tok = E.encodeScenario(S, "grok", "__modified", loadTraffic, "saved scenario", { fleet: "custom", totalCase: "custom" }); return true; }
               catch (e) { return e.message; } })() === true);
    const decoded = JSON.parse(Buffer.from(tok.slice(3).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    assert("saved-state sharing: encoded displayedMargin === UI margin (grok context, not stale opus)",
      Math.abs(decoded._meta.displayedMargin - uiMargin) < 0.001,
      `encoded ${decoded._meta.displayedMargin} vs UI ${uiMargin}`);
    let invalidSavedThrew = false;
    try {
      E.restoreSavedPresetState({ ...saved, active: 500, total: 200 }, grok, loadTraffic);
    } catch {
      invalidSavedThrew = true;
    }
    assert("saved-state sharing: a current-epoch-shaped state with active > total is rejected before registration",
      invalidSavedThrew);
  }

  // 2. Modified-link sharing — drives restoreModifiedLinkState, the exact function
  // loadScenarioFromURL's modified branch (app.js:~567) delegates to.
  {
    const modelBTraffic = E.resolveTraffic(grok, median, { mode: "native" });
    const diff = { active: grok.set.active, total: grok.set.total, precision: grok.set.precision };
    const S = E.restoreModifiedLinkState(diff, modelBTraffic, grok); // the production call
    const uiMargin = E.workload(S, undefined, E.makeScenarioContext(grok, modelBTraffic, S.customDonor)).margin * 100;
    let bareResult;
    try { bareResult = E.workload(S).margin * 100; } catch (e) { bareResult = "THREW: " + e.message; }
    assert("modified-link sharing: bare workload(S) (WeakMap-only) matches the grok context, not a throw or stale mapping",
      typeof bareResult === "number" && Math.abs(bareResult - uiMargin) < 0.001,
      `bare call gave ${bareResult}, expected ${uiMargin}`);
    let tok;
    assert("modified-link sharing: encodeScenario on the restored (production-registered) state does not throw",
      (() => { try { tok = E.encodeScenario(S, "grok", "__modified", modelBTraffic, "a shared scenario", { fleet: "custom", totalCase: "custom" }); return true; }
               catch (e) { return e.message; } })() === true);
    const decoded = JSON.parse(Buffer.from(tok.slice(3).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    assert("modified-link sharing: encoded displayedMargin === UI margin",
      Math.abs(decoded._meta.displayedMargin - uiMargin) < 0.001,
      `encoded ${decoded._meta.displayedMargin} vs UI ${uiMargin}`);
  }

  // 3. Model-switch-while-modified — drives applyModelSwitchWhileModified, the exact function
  // refreshModifiedState (app.js:~770) delegates to. S keeps its IDENTITY (no clone) but its
  // intended model changes underneath it — the exact reproduction from the original review (an
  // Opus numeric state displayed/shared under Grok context). Without the fix this embeds the
  // STALE opus margin (57.29%); with the fix it embeds the live grok margin (40.71%) and the two
  // are asserted DIFFERENT, so this test fails loudly if the production re-registration regresses.
  {
    const S = preset(opus, median, { mode: "native" }); // registers opus context (unrelated to the fix under test)
    const switchedTraffic = E.resolveTraffic(grok, median, { mode: "native" });
    E.applyModelSwitchWhileModified(S, grok, switchedTraffic); // the production call — mutates S.ioRatio/cacheHit AND re-registers
    const uiMargin = E.workload(S, undefined, E.makeScenarioContext(grok, switchedTraffic, S.customDonor)).margin * 100;
    const staleOpusMargin = E.workload(S, undefined, E.makeScenarioContext(opus, switchedTraffic, S.customDonor)).margin * 100;
    // Bare-call check: S kept its IDENTITY (no clone) — before the fix the WeakMap entry from
    // applyPresetSettings(opus,...) would still be there, STALE, pointing at opus. A bare call
    // silently returning staleOpusMargin (rather than throwing) is exactly how this variant of the
    // bug hid in production: no error, just a wrong number.
    let bareResult;
    try { bareResult = E.workload(S).margin * 100; } catch (e) { bareResult = "THREW: " + e.message; }
    assert("model-switch-while-modified: bare workload(S) (WeakMap-only) uses the NEW grok mapping, not the stale opus one",
      typeof bareResult === "number" && Math.abs(bareResult - uiMargin) < 0.001 && Math.abs(bareResult - staleOpusMargin) > 1,
      `bare call gave ${bareResult}, expected grok ${uiMargin} (stale opus would have been ${staleOpusMargin})`);
    let tok;
    assert("model-switch-while-modified: encodeScenario on the same-identity state does not throw",
      (() => { try { tok = E.encodeScenario(S, "grok", "__modified", switchedTraffic, "opus, switched to grok", { fleet: "custom", totalCase: "custom" }); return true; }
               catch (e) { return e.message; } })() === true);
    const decoded = JSON.parse(Buffer.from(tok.slice(3).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    assert("model-switch-while-modified: encoded displayedMargin === UI (grok) margin, not the stale opus one",
      Math.abs(decoded._meta.displayedMargin - uiMargin) < 0.001 && Math.abs(uiMargin - staleOpusMargin) > 1,
      `encoded ${decoded._meta.displayedMargin}, UI(grok) ${uiMargin}, stale UI(opus) ${staleOpusMargin}`);
  }
}

// IM3 slice-3 review R7 P1 fix — customDonor codec contract activated live (memo §3 R2). Slice 1b
// left standalone helpers (engine-roofline-v22.js: encodeCustomDonor/decodeCustomDonor/CUSTOM_DONOR_BOUNDS)
// for slice 3 to wire through DEFAULTS, SCENARIO_BOUNDS, the sanitizer, the live codec and
// makeScenarioContext — the switch never did. These are END-TO-END live-engine round-trip tests
// (not the slice-1b helper-only tests), proving every live Custom scenario no longer silently
// uses the default dsr1 donor.
{
  const custom = E.MODELS.find(x => x.id === "custom"), opus = E.MODELS.find(x => x.id === "opus");
  const median = E.PERSPECTIVES.find(x => x.id === "median");
  const traffic = { mode: "native", profileId: null, ioRatio: 15, cacheHit: 60 };

  // Cross-file consistency: SCENARIO_BOUNDS.customDonor is hardcoded (engine.js's own SCENARIO_BOUNDS
  // evaluates before engine-roofline-v22.js loads in the browser) — guard against silent drift from
  // the roofline core's CUSTOM_DONOR_BOUNDS, the actual enum resolveArch() enforces.
  assert("customDonor: SCENARIO_BOUNDS enum matches the roofline core's CUSTOM_DONOR_BOUNDS",
    JSON.stringify(E.SCENARIO_BOUNDS.customDonor) === JSON.stringify(R.CUSTOM_DONOR_BOUNDS),
    `${JSON.stringify(E.SCENARIO_BOUNDS.customDonor)} vs ${JSON.stringify(R.CUSTOM_DONOR_BOUNDS)}`);
  assert("customDonor: DEFAULTS default is the enum default", E.DEFAULTS.customDonor === "dsr1");

  // LIVE effect: the three donors must compute DIFFERENT throughput for the same custom sizing —
  // this is the exact defect the review found ("every live Custom scenario silently uses dsr1").
  const tokFor = donor => {
    const s = preset(custom, median, { mode: "native" });
    s.customDonor = donor;
    const ctx = E.makeScenarioContext(custom, { mode: "native", profileId: null, ioRatio: s.ioRatio, cacheHit: s.cacheHit }, donor);
    E.registerScenarioContext(s, ctx);
    return E.tokPerS(E.HW.h200, s, "out");
  };
  const tDsr1 = tokFor("dsr1"), tQwen = tokFor("qwen3c"), tLlama = tokFor("llama70");
  assert("customDonor: dsr1/qwen3c/llama70 compute three DIFFERENT live throughputs",
    new Set([tDsr1, tQwen, tLlama]).size === 3, `${tDsr1}, ${tQwen}, ${tLlama}`);

  // Codec — encode: custom + non-default donor MUST be encoded.
  {
    const s = preset(custom, median, { mode: "native" }); s.customDonor = "qwen3c";
    const tok = E.encodeScenario(s, "custom", "median", traffic, null, { fleet: "preset", totalCase: "preset" });
    const decoded = JSON.parse(Buffer.from(tok.slice(3).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    assert("customDonor codec: custom+non-default donor is encoded", decoded.customDonor === "qwen3c", JSON.stringify(decoded));
  }
  // Codec — encode: custom + DEFAULT donor must NOT be encoded (memo §3: default is never encoded).
  {
    const s = preset(custom, median, { mode: "native" }); s.customDonor = "dsr1";
    const tok = E.encodeScenario(s, "custom", "median", traffic, null, { fleet: "preset", totalCase: "preset" });
    const decoded = JSON.parse(Buffer.from(tok.slice(3).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    assert("customDonor codec: custom+default donor is NOT encoded", !("customDonor" in decoded), JSON.stringify(decoded));
  }
  // Codec — encode: a non-custom model must NEVER encode customDonor, even if S carries a stray
  // non-default value (memo §3: "encoded ONLY when model=custom").
  {
    const s = preset(opus, median, { mode: "native" }); s.customDonor = "qwen3c";
    const tok = E.encodeScenario(s, "opus", "median", traffic, null, { fleet: "custom", totalCase: "custom" });
    const decoded = JSON.parse(Buffer.from(tok.slice(3).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    assert("customDonor codec: non-custom model never encodes customDonor", !("customDonor" in decoded), JSON.stringify(decoded));
  }
  // Codec — decode: absent field decodes to the default (every legacy custom link resolves unchanged).
  {
    const sane = E.sanitizeScenarioDiff({ active: 300 }, null);
    const restored = Object.assign(structuredClone(E.DEFAULTS), sane.diff);
    assert("customDonor codec: a diff lacking the field decodes to dsr1 (legacy links unaffected)",
      restored.customDonor === "dsr1", restored.customDonor);
  }
  // Codec — decode: a present, valid value round-trips.
  {
    const sane = E.sanitizeScenarioDiff({ customDonor: "llama70" }, null);
    assert("customDonor codec: a valid present value survives the sanitizer",
      sane.rejected.length === 0 && sane.diff.customDonor === "llama70", JSON.stringify(sane));
  }
  // Codec — decode: an invalid value is rejected fail-closed, never clamped/guessed.
  {
    const sane = E.sanitizeScenarioDiff({ customDonor: "made-up-donor" }, null);
    assert("customDonor codec: an invalid value is rejected fail-closed",
      sane.rejected.some(r => r.startsWith("customDonor")) && !("customDonor" in sane.diff), JSON.stringify(sane));
  }

  // Full end-to-end round-trip: build a custom+llama70 state, encode it, decode+sanitize+restore it
  // exactly as loadScenarioFromURL/app.js would, and confirm the RESTORED state computes the SAME
  // live margin as the ORIGINAL — not the dsr1-silently-substituted one.
  {
    const s = preset(custom, median, { mode: "native" }); s.customDonor = "llama70";
    E.registerScenarioContext(s, E.makeScenarioContext(custom, traffic, "llama70"));
    const originalMargin = E.workload(s, undefined, E.makeScenarioContext(custom, traffic, "llama70")).margin;
    const tok = E.encodeScenario(s, "custom", "median", traffic, null, { fleet: "preset", totalCase: "preset" });
    const decoded = JSON.parse(Buffer.from(tok.slice(3).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    delete decoded._meta;
    const sane = E.sanitizeScenarioDiff(decoded, null);
    // Clean (non-modified) restore baseline, matching app.js's actual loadScenarioFromURL path
    // (applyPresetSettings(model, persp, traffic) + Object.assign(diff) — NOT raw DEFAULTS, which
    // would lose custom's own active=100/total=1000/etc. preset values; see encodeScenario's own
    // "Round-trip baseline" comment for why encode diffs against this exact same baseline).
    const restored = preset(custom, median, { mode: "native" });
    Object.assign(restored, sane.diff);
    const restoredMargin = E.workload(restored, undefined, E.makeScenarioContext(custom, traffic, restored.customDonor)).margin;
    assert("customDonor end-to-end: full encode->decode->sanitize->restore round-trip reproduces the SAME margin",
      Math.abs(originalMargin - restoredMargin) < 1e-9, `${originalMargin} vs ${restoredMargin}, restored donor=${restored.customDonor}`);
  }
}

// IM3 slice 4 — CM384 evidence-record annotations (memo im3-integration-design.md §9, owner ruling
// 2026-07-18: NO fit change, NO WS-E upgrade). The two FlexNPU bases (delivered full-system SLO
// point ~1,648 tok/s/card => 8.1%; decode-pool standalone ceiling ~2,885 tok/s/decode-card => 14.2%)
// are EVIDENCE-RECORD ANNOTATIONS ONLY -- research/evidence-instances-v22.json entries
// (cm384-flexnpu, cm384-flexnpu-6p2d-decode) plus site/engine.js's ascend row-note display copy.
// They are NOT selectable scenarios, NOT operating points in the §4 registry, NOT calibration
// inputs. These tests assert the deployed η and every ascend render value are byte-identical to
// their pre-annotation pins, and that neither CM384 number is reachable from any compute path --
// the ruling's whole point is that adding the annotation must be a display/documentation-only
// change.
{
  const D = require("../site/engine-data-v22.js");

  // 1. Deployed η is exactly the pre-ruling source-informed neutral value -- untouched by the annotation.
  assert("CM384 §9: ascend deployed η is the source-informed neutral value, unaffected by the evidence annotation",
    Math.abs(D.CALIBRATION.ascend.etaDec - 0.299324) < 1e-9, D.CALIBRATION.ascend.etaDec);

  // 2. A spread of ascend render values across regimes/models reproduces exact pins -- a
  // display-copy-only change cannot move a single computed number.
  const opus = E.MODELS.find(x => x.id === "opus"), dsv4 = E.MODELS.find(x => x.id === "dsv4");
  const median = E.PERSPECTIVES.find(x => x.id === "median");
  const ascendPins = [
    // R2 re-mint (manifest row): ascend renders at the solver's widest legal width (144,
    // the frozen 6P2D decode observation) instead of the fixed co-loc 128 — b moves with
    // bFeas at the rendered width; the evidence annotation itself is unchanged.
    // FA re-mint (memo J-9 delta manifest): capacity widths re-solve at the revised
    // flagship size — the ascend decode operating point moves with per-chip residency.
    ["opus", "batch", 211.09388823526263],
    ["opus", "balanced", 211.09388823526263],
    ["opus", "fast", 24.821359418133813],
    ["dsv4", "balanced", 1689.5004297659616],
  ];
  for (const [mid, regime, expected] of ascendPins) {
    const m = mid === "opus" ? opus : dsv4;
    const s = preset(m, median, { mode: "native" });
    s.interact = regime;
    const got = E.tokPerS(E.HW.ascend, s, "out");
    assert(`CM384 §9: ascend ${mid}/${regime} decode tokPerS pin unaffected by the evidence annotation`,
      Math.abs(got - expected) < 1e-9, `got ${got}, expected ${expected}`);
  }

  // 3. Structural non-reachability: neither CM384 closure number (the memo's rounded 1,648/2,885,
  // nor the underlying evidence-record 1,646/2,885.4) appears anywhere in the compute-consumed
  // roofline registries (CALIBRATION.etaDec/calObs/impliedEta, OPERATING_POINTS) -- only in the
  // known-inert CALIBRATION.ascend.additionalObs documentation field, the engine.js display-copy
  // note, and the evidence-instances-v22.json record. A grep-based structural guard on the JSON
  // shape of just the compute-relevant sub-objects, not the whole file (additionalObs is expected
  // to carry them, by design, exactly as memo §9 requires).
  const calNoObs = { ...D.CALIBRATION.ascend }; delete calNoObs.additionalObs;
  const calStr = JSON.stringify(calNoObs);
  const opStr = JSON.stringify(D.OPERATING_POINTS.ascend);
  for (const n of ["1648", "1646", "2885"]) {
    assert(`CM384 §9: '${n}' does not appear in CALIBRATION.ascend outside additionalObs`,
      !calStr.includes(n), calStr);
    assert(`CM384 §9: '${n}' does not appear in OPERATING_POINTS.ascend`,
      !opStr.includes(n), opStr);
  }
  assert("CM384 §9: CALIBRATION.ascend.additionalObs DOES carry both closure figures (documentation, not calibration)",
    /1,646/.test(D.CALIBRATION.ascend.additionalObs) && /2,885\.4/.test(D.CALIBRATION.ascend.additionalObs),
    D.CALIBRATION.ascend.additionalObs);
}

// 1. Every §10 card headline reproduces from its named dive-replay preset within 1pp.
// R2 re-mint (manifest rows; assembly-notes R-6): gpt 92.9→94.5 (4/4 legs render), grok
// Peak-KV correction re-mint: GLM −163.0→−165.6; DSV4 74.3→73.8; Grok remains
// within its rounded 64-point card while the exact replay moves to 63.7153.
/* im-arc T4 fold (2026-08-24, declared delta): every replay moves. The dominant term is not a
   default nudge — it is that gb200, gb300 and trn3 now have NO admissible public planning rate, so
   under a rent basis those legs drop out of the priced blend and the remainder is a different,
   more expensive mix. dsv4's blend carries none of the three and is byte-stable, which is the
   control that shows the movement is the unavailable-rate path and not a global scalar. */
/* im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok:
   the two NVIDIA-heavy dive replays move because GB200 and GB300 now price — gpt 91.8 -> 93.2,
   grok 60.1 -> 63.2. dsv4 and glm are byte-unchanged because their declared fleets carry neither
   leg, which is the cleanest available evidence that this ruling touched procurement and nothing
   else. Grok's cacheReadMult correction 25 -> 15 moves NONE of these: every Grok replay runs at the
   dive's Uncached 3:1 / 0% convention, so a cache-read price has nothing to multiply. */
/* im-vet-model-estimates (2026-09-19), owner note note-20260919T142116Z-6b5c83 "sanity check those
   numbers (I strongly doubt anyone is negative serving margin on API costs)": five presets carried a
   price their vendor no longer charges, verified live on the vendors' own pages. Two dive replays move
   with the corrected tariff and nothing else does — gpt 93.2 -> 90.4 (list $5/$30 -> $4/$20) and
   dsv4 73.8 -> 86.5 (list $0.435/$0.87 -> $0.66/$1.98 off-peak). grok and glm are byte-unchanged
   because neither row's tariff moved, which is the control that shows this is the price path and not
   a global scalar. The same correction is what clears dsv4 (-9.1% -> +43.8%) and dsv4f (-11.5% ->
   +31.8%, and its dive replay -22.2% -> +25.3%) off the negative side of zero. */
/* im-vet-model-estimates (2026-09-19), second change, owner ruling relayed by Polaris gen60: no
   negative margin ships. glm moves -153.2 -> 31.3 because its DEFAULT TRAFFIC changed from the
   ncode-informed profile to the page's Reference convention. The replay's traffic is locked to the
   model's native profile, so changing the default moves the replay with it; nothing about the
   replay's own vector (rentMult, util, stack, regime) was touched. */
const DIVE_TARGETS = { gpt: 90.4, grok: 63.2, dsv4: 86.5, glm: 31.3 };
for (const [mid, target] of Object.entries(DIVE_TARGETS)) {
  const got = marginPct(settings(mid, "dive"));
  assert(`dive replay ${mid} = ${target}±1pp`, Math.abs(got - target) <= 1, `got ${got.toFixed(1)}`);
}
{
  const wl = E.workload(settings("gemini", "dive"));
  // R2 re-mint (manifest row; the owner's cited FALSE NEGATIVE fixed): tpu7 solves at a
  // legal width — the dive replay now renders ≈87.4 instead of a spurious infeasible.
  // b9 M1 re-mint: still 1/1 rendering (the false negative stays fixed); the value moves
  // 87.4 → 84.0 because this is a tpu7-only fleet and tpu7 now carries the repaired rent
  // ($4.20 → $5.40) against the platform-native η bridge.
  // im-vet-six-repairs re-mint (2026-09-20): a tpu7-only fleet, so it carries the TPU numerator
  // repair (η 0.55 -> 0.519, the live value; 0.521 was a retired same-day intermediate) in full — 84.0 -> 83.6. The false negative stays fixed.
  assert("dive replay gemini (R2): the false negative is FIXED — 1/1 legs render, margin ≈83.6",
    isFinite(wl.margin) && Math.abs(wl.margin * 100 - 83.6) <= 0.1
    && wl.fleetRenderable.renderableLegs === 1 && wl.fleetRenderable.totalLegs === 1,
    JSON.stringify(wl.fleetRenderable));
}
// Moonshot's §10 figure is OUTPUT-ONLY: the dive replay reproduces the dive's $0.75/M output cost.
{
  const wl = E.workload(settings("kimi", "dive"));
  assert("dive replay kimi cOut = $0.593±0.002/M (output-only §10 metric)", Math.abs(wl.cOut - 0.59297) <= 0.002, `got ${wl.cOut.toFixed(3)}`);
  const outMargin = (1 - wl.cOut / 4.00) * 100;
  assert("kimi output-token margin ≈ 85.2±0.1", Math.abs(outMargin - 85.2) <= 0.1, `got ${outMargin.toFixed(1)}`);
}
// The external 84.5% disclosure remains a cited figure; the activated roofline replay is a
// distinct computed result and is pinned rather than forced back onto that external number.
assert("dsr1 disclosure replay = 87.1±0.1pp (external disclosed figure remains 84.5%)",
  Math.abs(marginPct(settings("dsr1", "deepseek")) - 87.1) <= 0.1,
  `got ${marginPct(settings("dsr1", "deepseek")).toFixed(1)}`);

// 1b. xAI lens replays land on the dive's stated lens values (same operating point, different valuation).
// R2 re-mint (manifest rows): grok fleet 3/4→4/4 legs under solver widths.
assert("grok + xAI cash-marginal ≈ 90.7±0.1", Math.abs(marginPct(settings("grok", "xaicash")) - 90.7) <= 0.1, marginPct(settings("grok", "xaicash")).toFixed(1));
assert("grok + xAI opportunity-cost ≈ 18.7±0.1", Math.abs(marginPct(settings("grok", "xaiopp")) - 18.7) <= 0.1, marginPct(settings("grok", "xaiopp")).toFixed(1));

// 2. Provider-true billing fields survive every perspective (the v1 shallow-merge bug).
// (v2.1.3: the four retired analyst ids are exercised via their numeric-identical successor
// exploration routes — teortaxes→x80-v3, zephyr→x80-v4, semi→x90-v1, skeptic→x60-v3.)
for (const pid of ["median", "x80-v3", "x80-v4", "x90-v1", "x60-v3"]) {
  /* Still 25, and that is now a DISCLOSED staleness rather than an unexamined pin: xAI's
     first-party page has moved to $0.30/$2.00 = 15% (verified 2026-09-02), and the engine says so
     via tariff.activeValueIsStale / cacheReadMultVerified. Correcting the computed value cascades
     into historical reproduction receipts (T4-REPRO-R1/R2) and is gated as its own data milestone —
     see the record in render-parity-r1.test.mjs and BACKLOG §2. This guard's own purpose is
     unchanged: the provider-true billing field must survive every perspective's merge. */
  /* im-release-edit-r2 (2026-09-10): CLOSED by owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok.
     These assertions existed to pin a KNOWN-STALE input in place so it could not drift silently while
     it waited for a decision — 25% was the 2026-07-08 launch rate, superseded by a published 15%. The
     decision came; the adopted value is the verified one. The assertion is kept rather than deleted,
     inverted to pin the corrected value, because the thing worth guarding is unchanged: this input
     must be what the source says, and must not drift. */
    assert(`grok cacheReadMult=15 under ${pid} (the verified rate, adopted 2026-09-10)`, settings("grok", pid).cacheReadMult === 15);
  /* im-vet-model-estimates (2026-09-19): same inversion as the grok assertion above, same reason.
     This pinned 1 (the 0.83%-of-input cache read under the $0.435 tariff). DeepSeek's page now prices
     v4-pro cache reads at $0.022 against a $0.66 input — 3.33% — so the assertion is re-pointed at the
     verified value rather than deleted. What is guarded is unchanged: this input must be what the
     source says, and must not drift. */
  assert(`dsv4 cacheReadMult=3.33 under ${pid} (the verified rate, adopted 2026-09-19)`, settings("dsv4", pid).cacheReadMult === 3.33);
}

// 3. Provider fleets: models with their own blend keep it; perspective blends fill only silent models.
assert("gpt keeps its Hopper/Blackwell fleet under median", settings("gpt", "median").blend.gb200 === 45 && !settings("gpt", "median").blend.tpu7);
assert("gemini keeps TPU fleet under median", settings("gemini", "median").blend.tpu7 === 100);
assert("opus inherits replay's H800 fleet (model silent)", settings("opus", "deepseek").blend.h800 === 100);
assert("dsv4's own blend beats replay's under 'deepseek'", settings("dsv4", "deepseek").blend.ascend === 30);

// 4. Subscription inference is invariant to the discount/batch sliders (list-price basis).
{
  const a = settings("opus", "median"); a.discount = 0; a.batchShare = 0;
  const b = settings("opus", "median"); b.discount = 40; b.batchShare = 50;
  const tokA = E.workload(a).priceMixList, tokB = E.workload(b).priceMixList;
  assert("priceMixList invariant to discount/batch sliders", Math.abs(tokA - tokB) < 1e-12, `${tokA} vs ${tokB}`);
}

// 5. The five reviewed deployed reference points reproduce the live basis (≤0.01%).
// H20 and Ascend are source-informed neutral identities, not fits to their observations.
// These are exact operating-point identities, so they call the roofline core directly rather than
// mutating a provider scenario whose traffic/regime would resolve a different point.
{
  const arch = R.resolveArch("dsr1");
  const points = [
    ["h800", 96, 4989, "fp8", 1873.0], ["h20", 48, 4096, "fp8", 680.0],
    // b9 M1 (r4 defect D3): the Blackwell reproduction targets divide out the retired
    // precision scalars — 18750.0 / 1.8538 = 10114.36 and 15875.0 / 1.85 = 8581.08.
    // gb200's new target lands within 0.06% of its own MEASURED F4 anchor (10,108
    // tok/s/GPU), which the double-credited value overshot by 85%.
    ["gb200", 128, 3000, "fp4", 10114.36], ["gb300", 128, 2740, "fp4", 8581.09],
    ["ascend", 96, 4096, "fp8", 1422.7],
  ];
  for (const [hwKey, b, L, precision, expected] of points) {
    const got = R.decodeRoofline({ arch, activeB: 37, totalB: 671, hwKey, b, L, precision }).tokPerS;
    assert(`live reference ${hwKey} reproduces ${expected.toFixed(1)} tok/s within 0.01%`,
      Math.abs(got / expected - 1) <= 1e-4, got.toFixed(4));
  }
}

// 6. Cache accounting is single-counted: at 100% cache hits the input leg costs exactly cCache.
{
  const s = settings("opus", "median"); s.cacheHit = 100;
  const wl = E.workload(s);
  const expected = (wl.cOut + s.ioRatio * wl.cCache) / (s.ioRatio + 1);
  assert("cache benefit applied once (h=1 identity)", Math.abs(wl.costMix - expected) < 1e-12);
}

// 6b. Cache-write billing: revenue-side only, default-off preserves all baselines.
{
  const s0 = settings("gpt", "median");
  const s1 = settings("gpt", "median"); s1.cacheWriteShare = 100; s1.cacheWriteMult = 125;
  const w0 = E.workload(s0), w1 = E.workload(s1);
  assert("cache writes raise revenue, never cost", w1.priceMix > w0.priceMix && Math.abs(w1.costMix - w0.costMix) < 1e-12);
  assert("default write share is 0 (baselines unchanged)", s0.cacheWriteShare === 0);
}

// 6c. chart-gen billing-mix parity (2026-07-15 cold-review MAJOR, code-confirmed): the
// "Cost per 1M output tokens across hardware generations" chart used to reimplement the
// billed price mix locally in site/app.js, using serving-side cacheHit as the billable
// share and ignoring billCacheHit/cacheWriteShare/cacheWriteMult entirely. The fix routes
// both the hero (workload) and the per-generation chart (workloadOnHw) through the same
// engine.js computeMix() — so under non-default billCacheHit + cacheWriteShare, a
// single-hardware blend's hero price mix must be BIT-IDENTICAL to that hardware's
// workloadOnHw price mix. This assertion is a tautology against the fixed engine.js (both
// paths share one function) — its purpose is to lock the contract in place; the second half
// of this test (source-guard below) is what actually fails against the pre-fix code, since
// the bug lived in app.js's now-deleted local formula, not in engine.js.
{
  const m = E.MODELS.find(x => x.id === "opus"), p = E.PERSPECTIVES.find(x => x.id === "median");
  const s = preset(m, p, { mode: "native", profileId: "reference", ioRatio: 15, cacheHit: 60 });
  s.billCacheHit = 20; s.cacheWriteShare = 30; s.cacheWriteMult = 150; // non-default on both axes
  s.blend = { h200: 100 };
  const hero = E.workload(s);
  const chart = E.workloadOnHw(E.HW.h200, s);
  assert("hero.priceMix === chart(h200).priceMix under non-default billCacheHit+cacheWriteShare",
    hero.priceMix === chart.priceMix, `${hero.priceMix} vs ${chart.priceMix}`);
  assert("hero.margin === chart(h200).margin under non-default billCacheHit+cacheWriteShare",
    hero.margin === chart.margin, `${hero.margin} vs ${chart.margin}`);
  // Concrete regression fixture (matches the reproduction in the 2026-07-15 expedited run
  // The billing-parity fixture is re-derived on the activated roofline path.
  /* im-arc T4 fold (2026-08-24, declared delta): re-minted for the H200 capex and planning-rent
     moves. The PROPERTY is unchanged and is what the assertion above proves — the hero and the
     chart compute the same number through the same engine function. */
  assert("chart(h200).margin matches the activated billing-parity fixture (≈65.28%)",
    Math.abs(chart.margin * 100 - 65.28) < 0.05, (chart.margin * 100).toFixed(2));
}
// 6d. Source guard: site/app.js's renderGenChart must call the shared engine function, not
// reimplement the billing formula. This is the assertion that actually fails on the OLD
// code — the pre-fix function body contained a literal "s.priceOut +" / "cacheReadMult"
// arithmetic reimplementation and never called workloadOnHw. Reverting the app.js fix
// (restoring the local priceMix formula) makes this fail immediately, without needing a
// browser to render the SVG.
{
  const fs = require("node:fs");
  const appSrc = fs.readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
  const fnMatch = appSrc.match(/function renderGenChart\(\)\s*{[\s\S]*?\n}\n/);
  assert("renderGenChart() found in site/app.js", !!fnMatch);
  const body = fnMatch ? fnMatch[0] : "";
  assert("renderGenChart calls the shared workloadOnHw() wrapper (single source of truth)", /appWorkloadOnHw\(/.test(body));
  assert("renderGenChart no longer reimplements cache-read billing locally", !/cacheReadMult/.test(body));
  assert("renderGenChart no longer reimplements the price-mix formula locally", !/s\.priceOut\s*\+/.test(body));
}
// 6e. Content-contract: v2.1.10 cold-review epistemics/labeling pass. These guard the P0/P1
// wording fixes against silent regression — the exact overclaim strings the 2026-07-15 cold
// review + council flagged must stay gone, and the honest replacements must stay present.
{
  const fs = require("node:fs");
  const html = fs.readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
  const eng = fs.readFileSync(new URL("../site/engine.js", import.meta.url), "utf8");
  const roofline = fs.readFileSync(new URL("../site/engine-roofline-v22.js", import.meta.url), "utf8");
  const engineData = fs.readFileSync(new URL("../site/engine-data-v22.js", import.meta.url), "utf8");
  const capacityTest = fs.readFileSync(new URL("./capacity-solver-r1.test.mjs", import.meta.url), "utf8");
  const rooflineTest = fs.readFileSync(new URL("./roofline-core.test.mjs", import.meta.url), "utf8");
  const model = id => E.MODELS.find(x => x.id === id);
  const perspective = id => E.PERSPECTIVES.find(x => x.id === id);
  const citedPct = n => (n < 0 ? "\u2212" + Math.abs(n).toFixed(1) : n.toFixed(1)) + "%";
  // P0-1 blinded run: relabeled as a cross-check, never an "independent ... replication/corroboration"
  assert("P0-1: §5 no longer calls the blinded run an 'independent blinded replication'", !/independent blinded replication/i.test(html));
  assert("P0-1: §5 no longer calls it an 'independent, blinded corroboration'", !/independent, blinded corroboration/i.test(html));
  assert("P0-1: §5 frames it as a blinded model-generated cross-check", /blinded model-generated cross-check/i.test(html));
  assert("P0-1: registry who-string relabeled (no 'independent BLINDED replication')", !/independent BLINDED replication/.test(eng) && /blinded model-generated cross-check/.test(eng));
  // External-review regression: visible prose must cite the currently executed results,
  // not values left behind by earlier engines or one-off research dives.
  {
    const kimiW = E.workload(settings("kimi", "dive"));
    const kimiOut = (1 - kimiW.cOut / model("kimi").set.priceOut) * 100;
    assert("published Kimi note cites live output cost and output-token margin",
      model("kimi").note.includes(`$${kimiW.cOut.toFixed(3)}/M`)
      && model("kimi").note.includes(citedPct(kimiOut))
      && E.DOSSIERS.models.kimi.assumes.join(" ").includes(`$${kimiW.cOut.toFixed(3)}/M`)
      && E.DOSSIERS.models.kimi.assumes.join(" ").includes(citedPct(kimiOut)));

    const dsLive = marginPct(settings("dsr1", "deepseek"));
    assert("published DeepSeek replay copy cites live mismatch, not an exact validation",
      model("dsr1").note.includes(citedPct(dsLive))
      && perspective("deepseek").note.includes(citedPct(dsLive))
      && /mismatch, not (a )?validation/.test(model("dsr1").note + " " + perspective("deepseek").note));

    const dsv4Live = marginPct(settings("dsv4", "dive"));
    const doubled = settings("dsv4", "dive");
    doubled.priceIn *= 2; doubled.priceOut *= 2;
    const dsv4Peak = E.workload(doubled).margin * 100;
    assert("published DSV4 note cites live base and doubled-tariff margins",
      model("dsv4").note.includes(citedPct(dsv4Live))
      && model("dsv4").note.includes(citedPct(dsv4Peak))
      && E.DOSSIERS.models.dsv4.falsifiers.join(" ").includes(citedPct(dsv4Peak)));

    const glmCentral = marginPct(settings("glm", "median"));
    const glmDive = marginPct(settings("glm", "dive"));
    assert("published GLM note cites the live negative central and dive outputs",
      model("glm").note.includes(citedPct(glmCentral)) && model("glm").note.includes(citedPct(glmDive)));

    const x60 = E.explorationFlagshipMargin(perspective("x60-v3"));
    assert("published low-margin diagnostic cites its live flagship result",
      perspective("x60-v3").note.includes(citedPct(x60))
      && E.DOSSIERS.perspectives["x60-v3"].who.includes(citedPct(x60))
      && !/hyperscaler list rates \(1\.6\u00d7\)/.test(perspective("x60-v3").note));

    const grokCash = marginPct(settings("grok", "xaicash"));
    const grokOpp = marginPct(settings("grok", "xaiopp"));
    assert("published xAI lens copy cites both live Grok results",
      perspective("xaicash").note.includes(citedPct(grokCash))
      && perspective("xaiopp").note.includes(citedPct(grokOpp))
      && E.DOSSIERS.models.grok.assumes.join(" ").includes(citedPct(grokCash))
      && E.DOSSIERS.models.grok.assumes.join(" ").includes(citedPct(grokOpp)));

    const partner = settings("opus", "gptpro");
    const partnerW = E.workload(partner);
    const partnerIn = (1 - partnerW.cIn / partner.priceIn) * 100;
    const partnerOut = (1 - partnerW.cOut / partner.priceOut) * 100;
    assert("strategic-partner lens copy distinguishes its live result from the external consult",
      perspective("gptpro").note.includes(citedPct(partnerIn))
      && perspective("gptpro").note.includes(citedPct(partnerOut))
      && perspective("gptpro").note.includes(citedPct(partnerW.margin * 100))
      && /external scenario outputs, not reproduced/.test(perspective("gptpro").note));

    const antState = settings("dsr1", "anth20");
    const antLive = E.tokPerS(E.HW.h20, antState, "out");
    assert("Ant H20 preset copy cites its live throughput and disclaims SLO reproduction",
      perspective("anth20").note.includes(antLive.toFixed(1) + " tok/s/GPU")
      && E.DOSSIERS.perspectives.anth20.who.includes(antLive.toFixed(1) + " tok/s/GPU")
      && /not an SLO replay/.test(perspective("anth20").note)
      && /neither models nor enforces TTFT\/TPOT/.test(perspective("anth20").note));

    assert("calibration table labels values as live outputs rather than reproductions",
      html.includes("<th>Live engine at listed point</th>") && !html.includes("<th>Reproduces at</th>"));
  }
  // Provider-card cross-surface parity: static summaries must match the exact dive state
  // loaded by each card's "Reproduce" link, including current fleet membership.
  const card = id => html.match(new RegExp(`<details class="prov" id="${id}">[\\s\\S]*?</details>`))?.[0] || "";
  const dive = mid => {
    const m = E.MODELS.find(x => x.id === mid), p = E.PERSPECTIVES.find(x => x.id === "dive");
    const s = preset(m, p, { mode: "native" });
    const ctx = E.scenarioContext(s);
    return { w: E.workload(s, undefined, ctx), f: E.feasibility(s, ctx) };
  };
  for (const [id, mid] of [["prov-openai", "gpt"], ["prov-google", "gemini"], ["prov-xai", "grok"],
    ["prov-deepseek", "dsv4"], ["prov-zhipu", "glm"]]) {
    const c = card(id), { w, f } = dive(mid), pct = Math.round(w.margin * 100);
    assert(`provider card ${id}: live dive margin ${pct}%`,
      c.includes(`serving margin ~${pct < 0 ? "−" + Math.abs(pct) : pct}%`), c.slice(0, 260));
    assert(`provider card ${id}: live ${f.renderableLegs}/${f.totalLegs} fleet membership`,
      c.includes(`all ${f.renderableLegs} of ${f.totalLegs} declared fleet legs renderable at declared serving topology`),
      c.slice(0, 360));
  }
  {
    const c = card("prov-moonshot"), { w, f } = dive("kimi");
    const outputPct = Math.round((1 - w.cOut / E.MODELS.find(x => x.id === "kimi").set.priceOut) * 100);
    assert("provider card Moonshot: live output-token margin", c.includes(`output-token margin ~${outputPct}%`));
    assert("provider card Moonshot: live fleet membership",
      c.includes(`all ${f.renderableLegs} of ${f.totalLegs} declared fleet legs renderable at declared serving topology`));
  }
  assert("provider-card introduction no longer claims Gemini is infeasible",
    !/Gemini's declared topology has zero renderable fleet legs/.test(html));
  // P1-1 hero unanchored-share warning: no longer claims TPU/Trainium have NO anchors; names GB300 price
  assert("P1-1: hero warning drops the false 'no public serving anchors' claim", !/have no public serving anchors/.test(app));
  assert("P1-1: hero warning names the GB300 analyst-price leg (state-aware)", /on GB300, priced from/.test(app) && /analyst-estimated \$6\/GPU-hr base/.test(app));
  // IM4 slice A: the registry/engine identity fork is CLOSED (schema rev 2.2) — the §3
  // notice must state the reconciled status; the open-fork language must stay gone.
  assert("IM4 slice A: §3 notice states the reconciled rev-2.2 identity", /Registry\/engine identity — reconciled \(schema rev 2\.2/.test(html));
  assert("IM4 slice A: open-fork 'not yet implemented' language is gone", !/planned next-phase gate, not yet implemented/.test(html));
  // P1-6 persistent scenario-not-estimate identity chip
  assert("P1-6: identity strip carries the 'selected scenario output — not an identified estimate' chip", /selected scenario output — not an identified estimate or probability interval/.test(app));
  // P1-4 press-reported (not company-reported) DeepSeek 70-80%
  assert("P1-4: DeepSeek 70-80% labeled press-reported, not company-reported", !/first company-reported post-V4/.test(html) && /first press-reported \(The Information/.test(html));
  // #28 realized -> effective on the hero price tile
  /* im-vet-six-repairs (2026-09-20), the vocabulary release edit (reader's reading, finding N1):
     the tile loses the "Blended" qualifier, because style/VOCABULARY.md §1.2 makes **effective
     price** the one name for this idea and retires "blended effective price" as a variant of it.
     What #28 was written to protect is the word REALIZED never returning to a modeled denominator,
     and that is what is asserted — now against the whole page rather than one tile label, which is
     strictly more than it checked before. */
  assert("#28: the hero price tile reads 'Effective price', and no price on the page is called 'realized'",
    /<div class="tile-label">Effective price /.test(html)
    && !/Blended realized price/.test(html) && !/realized price/i.test(html));
  // #17 Rubin fully de-dollared: excluded from the $ scale (ymax) AND drawn as an unpriced
  // placeholder, not a cost-scaled bar — so no $ figure is inferable from its height.
  {
    const gen = app.match(/function renderGenChart\(\)\s*{[\s\S]*?\n}\n/);
    const gbody = gen ? gen[0] : "";
    assert("#17: renderGenChart marks the projection 'unpriced' instead of a $ figure", /"unpriced"/.test(gbody));
    assert("#17: renderGenChart excludes the Rubin projection and infeasible rows from the $ scale (ymax)", /filter\(c => !c\.proj && c\.renderable\)/.test(gbody));
    const rubinState = settings("opus", "median");
    const rubinContext = E.scenarioContext(rubinState);
    const rubinParts = E.hwHourParts(E.RUBIN, rubinState);
    const rubinWorkload = E.workloadOnHw(E.RUBIN, rubinState, undefined, rubinContext);
    assert("#17: Rubin is structurally unpriced at every economics API, not only hidden by app.js",
      D.PRICE_EVIDENCE.rubin === "unpriced"
      && Number.isNaN(E.hwHourCost(E.RUBIN, rubinState))
      && Object.values(rubinParts).every(Number.isNaN)
      && Number.isNaN(E.costPerMtok(E.RUBIN, rubinState, "out", undefined, rubinContext))
      && Number.isNaN(rubinWorkload.costMix) && Number.isNaN(rubinWorkload.margin)
      && rubinWorkload.fleetRenderable.renderableLegs === 0,
      JSON.stringify({ price: D.PRICE_EVIDENCE.rubin, rubinParts,
        costMix: rubinWorkload.costMix, margin: rubinWorkload.margin }));
    /* im-arc T4 fold (2026-08-24), memo §4: this invariant is SPLIT, because the fold introduced a
       distinction that did not exist before it. Rubin is STRUCTURALLY unpriced — no economics at
       all. gb200, gb300 and trn3 are fully priced as OWNED capacity (their capex is registered)
       but have no admissible public planning RENT: no dive resolves a rate of the low/committed
       class for them, so they take the T2 fix-2 unavailable path under a rent basis rather than
       keeping a retired number. Asserting the pre-fold "everything is priced under rent" would now
       assert that the page invents rates it does not have. */
    const noPlanningQuote = E.HW_ORDER.filter(k => DC.RENT_POLICY.defaultRateId[k] === null);
    assert("#17: every non-Rubin registered hardware row remains priced as OWNED capacity",
      E.HW_ORDER.every(k => D.PRICE_EVIDENCE[k] !== "unpriced"
        && Number.isFinite(E.hwHourCost(E.HW[k], Object.assign(structuredClone(rubinState), { hwMode: "tco" })))),
      JSON.stringify(E.HW_ORDER.map(k => [k, E.hwHourCost(E.HW[k],
        Object.assign(structuredClone(rubinState), { hwMode: "tco" }))])));
    /* im-release-edit-r2 (2026-09-10): the INVARIANT is unchanged and is the whole value of this
       assertion — a row is unpriced under RENT if and only if its policy selects no quote. What
       changed is the membership of that set: the owner's ruling gives gb200, gb300 and trn3 a
       selected quote, so the set is now EMPTY on both sides. The equality still binds, and the
       moment any row loses its selection this fires again. The literal expectation moves with it
       rather than being deleted, so an accidental un-selection cannot pass as "empty is fine". */
    assert("#17: exactly the rows with no admissible public planning quote are unpriced under RENT",
      JSON.stringify(E.HW_ORDER.filter(k => !Number.isFinite(E.hwHourCost(E.HW[k], rubinState))))
        === JSON.stringify(noPlanningQuote)
      && JSON.stringify(noPlanningQuote) === JSON.stringify([]),
      JSON.stringify({ unpriced: E.HW_ORDER.filter(k => !Number.isFinite(E.hwHourCost(E.HW[k], rubinState))),
        noPlanningQuote }));
    assert("#17: each of those rows states WHY, and offers a declared replay instead of a fallback",
      noPlanningQuote.every(k => {
        const receipt = E.registryPlanningRentReceipt(k, rubinState);
        return receipt.unavailable === true && receipt.reason.length > 40
          && DC.RENT_POLICY.provisionalReplays[k].basis === "provisional";
      }));
  }
  // Reviewer follow-ups (sol-reviewer 2026-07-15): "realized"→"effective" completed across the
  // live result surfaces (hero tooltip, normalized column), and the annex GENERATOR no longer
  // reasserts the P0 overclaims it regenerates into site/research/ on every deploy.
  {
    const build = fs.readFileSync(new URL("../build-research-html.mjs", import.meta.url), "utf8");
    assert("realized→effective: no 'Blended realized price' tooltip in engine.js", !/Blended realized price/.test(eng));
    assert("realized→effective: no 'Realized price /Mtok' column in app.js", !/Realized price \/Mtok/.test(app));
    /* im-vet-six-repairs (2026-09-20), the vocabulary release edit (reader's reading, finding N1):
       style/VOCABULARY.md §1.2 makes **effective price** the one name for this denominator and
       retires "effective billings" as a variant of it, so the tooltip now says "the modeled
       effective price". The property this line protects is that the denominator is named as
       MODELED, never as realized — which is asserted here and enforced page-wide by
       tests/vocabulary-consistency.test.mjs. */
    assert("realized→effective: the margin tooltip names a MODELED denominator, not a realized one",
      /the modeled effective price/.test(eng) && !/modeled effective billings/.test(eng));
    assert("annex generator: dive title is a cross-check, not an 'independent ... replication'", !/blinded unit-margin replication/i.test(build) && /Blinded unit-margin cross-check/.test(build));
    assert("annex generator: index intro is 'full public', not 'full, unedited'", !/full, unedited/.test(build) && /full public research artifacts/.test(build));
  }
  // #27 version identity: footer engine string aligned to ENGINE_REVISION
  assert("#27: footer engine version string is current", /engine v3\.0\.0-2026-08-13/.test(html)); // v3.0 badge ruled at M8 (D-10, esc-1df204c8)
  assert("#27: ENGINE_REVISION is current", /ENGINE_REVISION = "v3\.0\.0-2026-08-13"/.test(eng));
  assert("capacity documentation names terminal peak-KV residency and the live solver",
    /b·LPeak·kvTok_basis/.test(roofline)
      && /LIVE since R2: the render path calls this solver/.test(roofline)
      && !/NON-SHIPPING in R1: no live render path calls this/.test(roofline)
      && /LIVE since R2: render\/capacity consume these domains/.test(engineData)
      && !/PARALLEL structures — nothing on a rendered path consumes these until R2/.test(engineData)
      && /LIVE since R2: claim-bearing wrappers consume[\s\S]{0,20}the capacity solve/.test(eng)
      && !/PARALLEL\/non-shipping — no render path consumes these until R2/.test(eng)
      && /LIVE R2 capacity-width solver contract/.test(capacityTest)
      && !/render-parity guard separately proves no rendered surface consumes it/.test(capacityTest)
      && !/free of solver identifiers until R2's shipment|false negative is dead in the PARALLEL solver/.test(capacityTest)
      && !/feasibility-redesign memo v4\.1; PARALLEL/.test(roofline)
      && /live roofline path/.test(rooflineTest)
      && !/roofline PARALLEL PATH/.test(rooflineTest));
  assert("renormalization documentation carries no stale numeric crossing fixture",
    !/2\.0T -> 4\/7 legs\/50%/.test(eng)
      && !/2\.5T -> 2\/7 legs\/25%/.test(eng));
  assert("claim-bearing capacity receipts carry no obsolete milestone promises",
    !/exact catalog = R2|role split = R3|not-evaluated-in-R1|gain placement verification via the R2|declared but unsearched in R1/.test(eng)
      && !/exact catalog = R2|unsearched in R1/.test(engineData));
  // cold-review-v2110 follow-up superseded by the capacity-solver repair: Gemini is now
  // finite, so a stale "no numeric result" statement is itself a regression.
  assert("Gemini card reports the current finite replay", !/Why there is no numeric result/.test(card("prov-google"))
    && /Why the scenario range/.test(card("prov-google")));
  assert("final-answer invitation exposes the rationale annex as a real local link",
    /id="fa-annex-link"[^>]+href="research\/final-answer-rationale\.html"/.test(html)
      && /fa\.evidenceAnnexId/.test(app));
  {
    const build = fs.readFileSync(new URL("../build-research-html.mjs", import.meta.url), "utf8");
    assert("v2110#22: annex footer no longer claims 'archived as produced'", !/archived as produced/.test(build) && /selected public artifacts/i.test(build));
  }
}

// Published final-answer annex + README examples must follow live engine values rather
// than preserve an obsolete but internally green snapshot.
{
  const fs = require("node:fs");
  const rationale = fs.readFileSync(new URL("../research/final-answer-rationale.md", import.meta.url), "utf8");
  const readme = fs.readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const pkg = require("../package.json");
  const fa = E.finalAnswer();
  const rounded = Math.round(fa.planningPoint.marginPct);
  /* im-release-edit-r2 (2026-09-10): the `!/≈37%/` clause was a sound shortcut while 37 was ONLY ever
     the retired pre-repair headline. The owner's rent adoption moved the TRAFFIC SPAN to ≈37%–≈66%,
     so a legitimately computed 37 now appears in this annex. Narrowed to the retired CLAIM — 37 as a
     planning-point reading — rather than the digit, which is the same correction T-7(d) needed in
     fa-m6-b9 for the same reason on the same day. */
  assert("final-answer rationale carries the live planning point",
    rationale.includes(`≈${rounded}%`)
      && !/(planning|reference|headline)[^.]{0,40}≈37%/i.test(rationale)
      && !/≈37%[^.]{0,40}(planning baseline|public-evidence reference)/i.test(rationale));
  const points = fa.policyBand.points.map(p => `≈${Math.round(p.value)}%`).join(" / ");
  assert("final-answer rationale carries the live policy-point order", rationale.includes(points), points);
  assert("final-answer rationale carries the live lens span",
    rationale.includes(`≈${Math.round(fa.lensSpan.loPct)}% to ≈${Math.round(fa.lensSpan.hiPct)}%`));
  assert("final-answer rationale carries the live traffic span",
    rationale.includes(`≈${Math.round(fa.trafficSpan.loPct)}% to ≈${Math.round(fa.trafficSpan.hiPct)}%`));
  /* b9 M5 (gate round 6): this pin used to hardcode "53.29% to 64.17%" — the SUPERSEDED
     with-replacement span — which is precisely what kept the wrong number alive in a published,
     MCP-cataloged annex through five review rounds. It now DERIVES the endpoints from the engine
     (at the public-evidence reference, where the span is computed), so the annex can never again
     disagree with what the engine returns. */
  {
    const sp = E.formCorrectionDebt(E.pinReferenceLevers(preset(
      E.MODELS.find(x => x.id === "opus"), E.PERSPECTIVES.find(x => x.id === "median"),
      { mode: "native" })), undefined, undefined).identifiedSpan;
    const want = sp.lo.toFixed(2) + "% to " + sp.hi.toFixed(2) + "%";
    assert("final-answer rationale discloses the open form-correction debt at the engine's own endpoints",
      rationale.includes(want) && /open calibration debt/.test(rationale), want);
    assert("…and states the debt in points as the engine computes it",
      rationale.includes(sp.spanPp.toFixed(2) + "-point"), sp.spanPp.toFixed(2));
  }
  const dsv4 = preset(E.MODELS.find(x => x.id === "dsv4"),
    E.PERSPECTIVES.find(x => x.id === "dive"), { mode: "native" });
  const dsv4Margin = E.workload(dsv4).margin * 100;
  const dsv4Pct = dsv4Margin.toFixed(1);
  /* im-vet-model-estimates (2026-09-19) — a DOUBLE-ROUNDING defect this assertion had, surfaced by
     the tariff correction and fixed rather than worked around. The second clause used to read
     `Math.round(Number(dsv4Pct))`: it rounded the engine result to one decimal and THEN to an
     integer. The §10 provider-card assertion above rounds the raw margin once
     (`Math.round(w.margin * 100)`). The two agreed by luck while dsv4 sat at 73.7556 (73.8 -> 74,
     and 73.7556 -> 74). At 86.4671 they diverge: the card says ~86% and the old expression demanded
     the README claim ~87%, so the README could only pass this test by misquoting the card it is
     describing. The guard's intent — the README's stated card figure must be the card's figure — is
     unchanged; it now reads from the same single rounding the card does. */
  assert("README example is executable and current", readme.includes(`// → ${dsv4Pct}%`)
    && readme.includes(`~${Math.round(dsv4Margin)}%`));
  assert("root runtime contract covers the browser tests' built-in WebSocket dependency",
    pkg.engines?.node === ">=22" && /Node ≥ 22/.test(readme), JSON.stringify(pkg.engines));

  const index = fs.readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
  const feedbackForm = fs.readFileSync(new URL("../feedback/form.html", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../site/app.js", import.meta.url), "utf8");
  const styles = fs.readFileSync(new URL("../site/styles.css", import.meta.url), "utf8");
  const headers = fs.readFileSync(new URL("../site/_headers", import.meta.url), "utf8");
  assert("feedback challenge is disclosed and lazy-loaded only after form engagement",
    !/<script[^>]+src=["']https:\/\/challenges\.cloudflare\.com\/turnstile/i.test(index)
      && /createElement\("script"\)/.test(index)
      && /form\.addEventListener\("focusin", requestChallenge/.test(index)
      && /form\.addEventListener\("pointerdown", requestChallenge/.test(index)
      && /loads only after you interact with this form/.test(index));
  assert("both feedback forms fail closed until Turnstile has supplied a token",
    [index, feedbackForm].every(src =>
      /new FormData\(form\)\.get\("cf-turnstile-response"\)/.test(src)
      && /Complete the anti-abuse challenge before submitting/.test(src)
      && !/<script[^>]+src=["']https:\/\/challenges\.cloudflare\.com\/turnstile/i.test(src))
      && !/plain form POST still works/.test(feedbackForm));
  /* im-release-edit 2026-09-10 (session 1 round 2, H3): the share check is unchanged and still
     reads the live registry, but the sentence around it was saying the calculator "prices GB300
     from" that $6 scenario — and GB300 carries no registered accelerator-hour price, so the engine
     renormalizes it out of the blended cost rather than pricing it at $6. The assertion now also
     requires that disclosure to be present, so the share can never again be published beside a
     claim that the leg is priced. */
  /* im-release-edit-r2 2026-09-10, owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok:
     the disclosure this assertion demands INVERTS, and demanding the old one would now require the
     page to say something false. GB300 is priced. What must not be lost is the reason the assertion
     exists: the share must never be published beside a claim that overstates what the price IS. So
     the requirement becomes the honest form of the same guard — the page must say the price was
     ADOPTED, that it is PROVISIONAL, and that no rate is published for the leg. */
  assert("GB300 scenario-price disclosure uses the live NA-blend share AND says the adopted price is provisional, not observed",
    D.FLEETS["na-blend"].legs.gb300 === 12
      && new RegExp("GB300 is " + D.FLEETS["na-blend"].legs.gb300 + "% of the activated NA-blend default fleet").test(index)
      && /ADOPTED \$6\.00 as GB300's planning rent/.test(index)
      && /provisional<\/em> row, not as an observed market rate/.test(index)
      && /no GB300 NVL72 rack rental is published/.test(index));
  assert("asset manifest is labeled as deployment-input integrity and discloses the non-fetchable _headers row",
    /Deployment-input integrity:[\s\S]*_headers[\s\S]*not fetchable as a static asset/.test(index)
      && !/Served-asset integrity:/.test(index));
  assert("theme and skin toggles expose pressed state and refresh it after changes",
    /id="skin-toggle"[^>]+aria-pressed=/.test(index)
      && /id="theme-toggle"[^>]+aria-pressed=/.test(index)
      && /refreshSkinToggle[\s\S]*setAttribute\("aria-pressed"/.test(app)
      && /refreshThemeToggle[\s\S]*setAttribute\("aria-pressed"/.test(app));
  assert("interactive chart marks have keyboard names and every chart exposes a table view",
    /function attachMarkTip[\s\S]*setAttribute\("role", "img"\)[\s\S]*setAttribute\("aria-label", ariaLabel\)/.test(app)
      && /function appendChartTable/.test(app)
      && (app.match(/appendChartTable\(/g) || []).length >= 6
      && /createElement\("caption"\)[\s\S]*caption\.textContent = summary/.test(app)
      && /if \(head\) cell\.scope = "col"/.test(app)
      && /Normalized provider scenario outputs under one shared lens/.test(app)
      && /if \(head\) td\.scope = "col"/.test(app));
  assert("generated sliders expose domain labels and values instead of internal range coordinates",
    /input\.setAttribute\("aria-label", p\.label\)/.test(app)
      && /input\.setAttribute\("aria-valuetext", rendered\)/.test(app)
      && /input\.setAttribute\("aria-label", hw\.name \+ " traffic share"\)/.test(app)
      && /normalized share/.test(app));
  assert("radio controls expose a labeled group to assistive technology",
    /row\.setAttribute\("role", "group"\)[\s\S]*row\.setAttribute\("aria-label", p\.label\)/.test(app));
  assert("central return affordance labels the full unverified default as a policy baseline, not a partial fleet",
    /boardBadge\("POLICY-LABELED BASELINE SCENARIO"/.test(app)
      && !/INTERIM RENDERABLE-SUBSET SCENARIO/.test(app));
  {
    const state = preset(E.MODELS.find(m => m.id === "opus"),
      E.PERSPECTIVES.find(p => p.id === "median"), { mode: "native" });
    const live = E.workload(state);
    const lowUtil = structuredClone(state);
    lowUtil.util = 35;
    const lowUtilLive = E.workload(lowUtil, undefined, E.scenarioContext(state));
    assert("published §5–§7 bridge is re-derived from the current 7-leg default",
      !/interim renderable-subset|2-of-7|activated ~57%|Open-market neocloud rental/.test(index)
        && !/5T-total\/~300B-active MoE is the shape our defaults assume|open-market rental, 50% utilization/.test(index)
        && index.includes("$" + live.costMix.toFixed(5))
        && index.includes((live.margin * 100).toFixed(2) + "%")
        && index.includes((lowUtilLive.margin * 100).toFixed(2) + "%")
        /* im-release-edit 2026-09-09: this used to require the literal "all 7 declared fleet legs",
           and the page said it about a DOLLAR COST that is not computed over all seven — GB200,
           GB300 and Trainium3 carry no registered price, so the engine renormalizes them out and
           the figure covers about 52% of declared fleet weight. The guard's actual job is to prove
           the bridge is re-derived from the SEVEN-LEG DEFAULT rather than from the retired 2-of-7
           interim subset, and the negations above already do that. So it now requires the seven-leg
           default to be named AND the priced coverage to be disclosed beside it — which is strictly
           more than it asked for before, and true. */
        && /7 of 7|all 7 of 7|all seven/.test(index)
        && /51\.96% of declared fleet weight|about 52% of declared fleet weight/.test(index)
        && /carry no registered|carries no registered|carry a registered/.test(index),
      `${live.costMix} / ${live.margin * 100} / ${lowUtilLive.margin * 100}`);
  }
  /* DERIVED RELATIONSHIPS, pinned to the engine (im-release-edit 2026-09-09, declared exceptions
     8–11). Four printed statements ABOUT the engine's output had gone stale and nothing caught
     them: a point drop that did not equal its own endpoints, an output-token margin computed on a
     different billing basis from the price beside it, a cost numerator that implied 68.98% where
     the page said 63%, and a percentage conversion of two dollar figures printed in the same
     sentence. GPT Pro session 1 found them by doing the arithmetic by hand, which is what a reader
     can also do. The readings themselves were pinned; the sentences deriving from them were not.
     Each assertion below recomputes the relationship rather than pinning a literal, so a future
     engine move fails here instead of quietly re-rotting the prose. */
  {
    const opus = E.MODELS.find(m => m.id === "opus");
    const med = E.PERSPECTIVES.find(p => p.id === "median");
    /* `preset` wraps pinReferenceLevers, which FORCES the reference basis (lead 0) — correct for
       the reference states below, and wrong for the lead-adjusted one, which has to keep the
       median preset's own three months. Build that one from applyPresetSettings directly. */
    const st = (over) => Object.assign(preset(opus, med, { mode: "native" }), over || {});
    const stLead = () => E.applyPresetSettings(opus, med, { mode: "native" });
    const wl = (x) => E.workload(x, undefined, E.scenarioContext(x));
    const ref = st({ trendMonths: 0 }), refLow = st({ trendMonths: 0, util: 35 });
    const lead = stLead();
    const W = wl(ref), WL = wl(refLow), L = wl(lead);
    const p2 = (x) => x.toFixed(2);

    assert("§5 utilization drop equals its own printed endpoints",
      index.includes(p2(W.margin * 100 - WL.margin * 100) + "-point drop"),
      `${p2(W.margin * 100)} - ${p2(WL.margin * 100)} = ${p2(W.margin * 100 - WL.margin * 100)}`);

    assert("§5 output-token margin is computed on the list denominator it names",
      index.includes("(≈" + Math.round((1 - W.cOut / ref.priceOut) * 100) + "% output-token margin at that list denominator"),
      `1 - ${W.cOut.toFixed(5)}/${ref.priceOut} = ${((1 - W.cOut / ref.priceOut) * 100).toFixed(3)}%`);

    assert("§7 lead-adjusted cost reproduces the lead-adjusted margin the page publishes",
      index.includes("$" + L.costMix.toFixed(5) + " under the lead-adjusted baseline")
        && Math.abs((1 - L.costMix / L.priceMix) * 100 - L.margin * 100) < 0.01,
      `${L.costMix.toFixed(5)} against ${L.priceMix.toFixed(5)} = ${((1 - L.costMix / L.priceMix) * 100).toFixed(3)}%`);

    assert("§7 dollar conversion is that dollar range over that printed cost",
      index.includes("about " + (10 * W.priceMix / 100 / W.costMix * 100).toFixed(1) + "–"
        + (20 * W.priceMix / 100 / W.costMix * 100).toFixed(1) + "% of that modeled direct-serving cost"),
      `${(10 * W.priceMix / 100).toFixed(5)}/${W.costMix.toFixed(5)} = ${(10 * W.priceMix / 100 / W.costMix * 100).toFixed(2)}%`);
  }
  {
    const gb200 = R.decodeRoofline({ arch: R.resolveArch("dsr1"), activeB: 37, totalB: 671,
      hwKey: "gb200", b: 128, L: 3000, precision: "fp4" }).tokPerS;
    const gb300 = R.decodeRoofline({ arch: R.resolveArch("dsv4"), activeB: 49, totalB: 1600,
      hwKey: "gb300", b: 128, L: 2740, precision: "fp4" }).tokPerS;
    assert("published §3 Blackwell table re-derives its live model-specific operating points",
      Math.abs(gb200 - 10114.361789914949) < 1e-9
        && Math.abs(gb300 - 7460.2700616607) < 1e-9
        && index.includes("10,114 at b=128, L=3,000")
        && index.includes("7,460 at declared b=128, L=2,740")
        && /GB300[\s\S]*analyst-set scenario-only row/.test(index)
        && !/18,750 at b=128|15,875 at declared b=128/.test(index),
      `${gb200} / ${gb300}`);
  }
  assert("active-parameter chart never evaluates a point above the selected model total",
    /xmax = Math\.min\(800, S\.total\)/.test(app)
      && /xmin = Math\.min\(10, Math\.max\(1, xmax \/ 10\)\)/.test(app)
      && /i === 120 \? xmax[\s\S]*Math\.min\(xmax, Math\.exp/.test(app)
      && /markers\.filter\(mk => mk\.a <= xmax\)/.test(app)
      && /\.filter\(a => a >= xmin && a <= xmax\)\.sort/.test(app)
      && /S\[p\.k\] = clampModelSizeAxis\(p\.k, v\)/.test(app));
  for (const model of E.MODELS.filter(model => model.id !== "custom")) {
    for (const perspective of E.PERSPECTIVES) {
      const state = preset(model, perspective);
      if (state.total >= 800) continue;
      const xmax = Math.min(800, state.total);
      const xmin = Math.min(10, Math.max(1, xmax / 10));
      const legalPoints = Array.from({ length: 121 }, (_, i) => i === 120 ? xmax
        : Math.min(xmax, Math.exp(Math.log(xmin) + i / 120 * (Math.log(xmax) - Math.log(xmin)))));
      assert(`active-parameter chart's exact 121-point sweep is executable for ${model.id}/${perspective.id}`,
        legalPoints.every(a => a <= state.total && (() => {
          try { E.workload(state, a); return true; } catch { return false; }
        })()), `total=${state.total}, max=${Math.max(...legalPoints)}`);
    }
  }
  {
    const model = E.MODELS.find(model => model.id === "opus");
    const state = preset(model, E.PERSPECTIVES.find(p => p.id === "median"));
    state.active = 1; state.total = 10;
    assert("active-parameter chart domain is executable at the accepted active=1,total=10 edge",
      [1, 10].every(a => {
        try { E.workload(state, a); return true; } catch { return false; }
      }));
  }
  assert("masthead controls wrap on narrow viewports",
    /\.masthead-actions\s*\{[^}]*flex-wrap:\s*wrap/.test(styles)
      && /@media \(max-width: 700px\)[\s\S]*\.masthead-actions/.test(styles));
  assert("served static-header policy blocks framing and passive capability access",
    /frame-ancestors 'none'/.test(headers)
      && /X-Frame-Options: DENY/.test(headers)
      && /X-Content-Type-Options: nosniff/.test(headers)
      && /Permissions-Policy: camera=\(\), geolocation=\(\), microphone=\(\), payment=\(\)/.test(headers));
  {
    const crypto = require("node:crypto");
    const siteDir = [
      new URL("../site/", import.meta.url),
      new URL("../", import.meta.url),
    ].find(candidate => fs.existsSync(new URL("index.html", candidate)));
    const htmlSources = [
      fs.readFileSync(new URL("index.html", siteDir), "utf8"),
      fs.readFileSync(new URL("404.html", siteDir), "utf8"),
      ...fs.readdirSync(new URL("research/", siteDir))
        .filter(name => name.endsWith(".html"))
        .map(name => fs.readFileSync(new URL(`research/${name}`, siteDir), "utf8")),
    ];
    const inlineHashes = tag => new Set(htmlSources.flatMap(source =>
      [...source.matchAll(new RegExp(`<${tag}(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"))]
        .map(match => `sha256-${crypto.createHash("sha256").update(match[1]).digest("base64")}`)));
    const scriptHashes = inlineHashes("script");
    const styleHashes = inlineHashes("style");
    const expectedScriptHashes = new Set([
      "sha256-w2Cf7l3VXuSHM/egSfa+rwViFlX92oxucarggJ7RF9o=",
      "sha256-uAFjbX1MiN68RJqKCDippd+1Xpz0Armd4aSMZSwM5Z4=",
    ]);
    const expectedStyleHashes = new Set([
      "sha256-5EP55QxCCERsCRddWDR8ZCz7UB70i3bTmFgpm/GeulM=",
      "sha256-bTXKiV1l0FgQPGB4M31VKDNuiIBs1IehEMwAerC4RQk=",
    ]);
    const sameSet = (actual, expected) =>
      actual.size === expected.size && [...expected].every(value => actual.has(value));
    assert("CSP inventory pins every inline script and style body exactly",
      sameSet(scriptHashes, expectedScriptHashes) && sameSet(styleHashes, expectedStyleHashes),
      JSON.stringify({ scriptHashes: [...scriptHashes], styleHashes: [...styleHashes] }));
    assert("published HTML has no inline style attributes outside the hashed style blocks",
      htmlSources.every(source => !/\sstyle=/.test(source)));
    const csp = headers.match(/Content-Security-Policy:\s*([^\n]+)/)?.[1] || "";
    /* GPT Pro review pr-20260902T153840Z-bce1bb finding 5: this assertion said "only reviewed"
       while merely checking that each expected hash appears SOMEWHERE in the policy string. It
       never parsed the directives and never rejected EXTRAS, so re-adding a retired inline-script
       hash alongside the current one would have passed a test whose name promises the opposite —
       a live-looking strictness guard that cannot fail on a stale allowance. Parse the directives
       and compare the hash-token sets exactly. */
    const directiveHashes = (name) => {
      const body = csp.split(";").map(s => s.trim()).find(s => s.startsWith(name + " "));
      return new Set([...(body || "").matchAll(/'(sha256-[A-Za-z0-9+/=]+)'/g)].map(m => m[1]));
    };
    const cspScriptHashes = directiveHashes("script-src");
    const cspStyleHashes = directiveHashes("style-src");
    assert("served CSP script-src allows EXACTLY the reviewed inline-script hashes (no stale extras)",
      sameSet(cspScriptHashes, expectedScriptHashes), JSON.stringify([...cspScriptHashes]));
    assert("served CSP style-src allows EXACTLY the reviewed inline-style hashes (no stale extras)",
      sameSet(cspStyleHashes, expectedStyleHashes), JSON.stringify([...cspStyleHashes]));
    assert("served CSP defaults closed and permits only reviewed script/style bodies",
      /default-src 'self'/.test(csp)
        && !/'unsafe-inline'|'unsafe-eval'/.test(csp)
        && [...expectedScriptHashes, ...expectedStyleHashes].every(hash => csp.includes(`'${hash}'`))
        && /script-src [^;]*https:\/\/challenges\.cloudflare\.com/.test(csp)
        && /style-src 'self'/.test(csp));
    assert("served CSP limits feedback, Turnstile, images, fonts, and form targets",
      /connect-src 'self' https:\/\/feedback\.ashitaorbis\.com/.test(csp)
        && /frame-src https:\/\/challenges\.cloudflare\.com/.test(csp)
        && /form-action 'self' https:\/\/feedback\.ashitaorbis\.com/.test(csp)
        && /img-src 'self' data:/.test(csp)
        && /font-src 'self'/.test(csp));
  }
}

// Release entrypoints must test the generated bytes they ship, include the MCP
// package they publish, and preserve failing-test output for diagnosis.
{
  const fs = require("node:fs");
  const browserHarness = fs.readFileSync(new URL("./run-app-tests.sh", import.meta.url), "utf8");
  const replayModel = E.MODELS.find(model => model.id === "grok");
  const replayPerspective = E.PERSPECTIVES.find(perspective => perspective.id === "xaiopp");
  const replayState = preset(replayModel, replayPerspective,
    { mode: "replay-locked", ioRatio: 3, cacheHit: 0 });
  const replayRoundedMargin = Math.round(
    E.workload(replayState, undefined, E.scenarioContext(replayState)).margin * 100);
  const replayBrowserAssertion =
    `check "MLI-1 payload: locked margin ≈${replayRoundedMargin}%" "$TMP/t1.html" must "≈${replayRoundedMargin}%"`;
  assert("browser MLI replay assertion is derived from the current engine result",
    browserHarness.includes(replayBrowserAssertion),
    JSON.stringify({ replayRoundedMargin, expected: replayBrowserAssertion }));
  // deploy.sh is the master-only deployment entrypoint and scripts/publish.sh carries mutation
  // policy and privacy-pattern bytes; both are private by design and absent from a reconstructed
  // public stage. Their assertions self-skip there, by count and under a labeled banner, and run
  // unconditionally in the private tree, where the hard guard requires the files to be present.
  for (const scriptName of ["deploy.sh", "scripts/publish.sh"]) {
    P.gate(scriptName, 3, (src) => {
      /* These pin GUARANTEES, not literals. Until 2026-09-02 they matched the literal strings
         `npm test` and `npm --prefix mcp-server test` in the script — and when rec 9's canonical
         gate replaced that enumerated chain with `npm run gate`, they failed. The guarantees they
         exist for are unchanged and still hold, so the assertions follow the composition rather
         than being deleted: the build must still precede whatever runs the suites (so the suites
         see the bytes that ship), and the MCP package must still be gated — now via gate:mcp,
         whose membership tests/gate-composition.test.mjs asserts separately. Matching either the
         old chain or the canonical gate keeps this honest for scripts/publish.sh, which has not
         been migrated. */
      const buildAt = src.indexOf("npm run build");
      const gateAt = src.search(/npm run gate\b/);
      const legacyTestAt = src.indexOf("npm test");
      const suitesAt = gateAt >= 0 ? (legacyTestAt >= 0 ? Math.min(gateAt, legacyTestAt) : gateAt) : legacyTestAt;
      P.assert(`${scriptName}: build precedes release tests`, buildAt >= 0 && suitesAt >= 0 && buildAt < suitesAt);
      P.assert(`${scriptName}: published MCP package has a release gate`,
        /npm --prefix mcp-server test/.test(src) || /npm run gate\b/.test(src));
      P.assert(`${scriptName}: test failures retain their stdout`, !/npm (?:--prefix mcp-server )?(?:run )?(?:test|gate)[^\n]*> \/dev\/null/.test(src));
    });
  }
  P.gate("deploy.sh", 2, (deploy) => {
    /* Same guarantee-not-literal correction as above: `npm test` moved inside `npm run gate` when
       rec 9's canonical gate landed. What must still hold is that the stamp and the final manifest
       generation both precede whatever RUNS the suites. */
    const deployGateAt = deploy.search(/npm run gate\b/);
    const deployLegacyAt = deploy.indexOf("npm test");
    const deployTestAt = deployGateAt >= 0
      ? (deployLegacyAt >= 0 ? Math.min(deployGateAt, deployLegacyAt) : deployGateAt)
      : deployLegacyAt;
    const stampAt = deploy.indexOf('sed -i "s#<span id=\\"release-commit\\"');
    const manifestAt = deploy.lastIndexOf("npm run manifest:update");
    P.assert("deploy.sh: release footer is stamped before testing the bytes that ship",
      stampAt >= 0 && stampAt < deployTestAt, `${stampAt} vs ${deployTestAt}`);
    P.assert("deploy.sh: final manifest generation precedes the release tests",
      manifestAt >= 0 && manifestAt < deployTestAt, `${manifestAt} vs ${deployTestAt}`);
  });
  const receptionSource = fs.readFileSync(
    new URL("../research/reception-2026-07-11-synthesis.md", import.meta.url), "utf8");
  const receptionHtml = fs.readFileSync(
    new URL("../site/research/reception-synthesis.html", import.meta.url), "utf8");
  assert("published reception prose names the served SHA-256 manifest path",
    !/asset-manifest\.json/.test(receptionSource)
      && !/asset-manifest\.json/.test(receptionHtml)
      && /asset-manifest\.sha256/.test(receptionSource)
      && /asset-manifest\.sha256/.test(receptionHtml));
  const pkg = require("../package.json");
  const servedNode = pkg.scripts["test:served-node"] || "";
  assert("served-node gate executes the published roofline differential",
    /roofline-parallel-diff/.test(servedNode), servedNode);
  assert("served-node gate fails on the first failing twin",
    /\|\|\s*exit\s+1/.test(servedNode) || /\bset\s+-e\b/.test(servedNode), servedNode);
  assert("test:all builds and tests MCP before its dist-dependent surface checks",
    /npm --prefix mcp-server test/.test(pkg.scripts["test:all"] || ""),
    pkg.scripts["test:all"] || "");
  const ciUrl = [
    new URL("../.github/workflows/ci.yml", import.meta.url),
    new URL("../../.github/workflows/ci.yml", import.meta.url),
  ].find(candidate => fs.existsSync(candidate));
  const ci = fs.readFileSync(ciUrl, "utf8");
  const actionRefs = [...ci.matchAll(/^\s*-\s+uses:\s+([^#\s]+)/gm)].map(match => match[1]);
  assert("CI third-party actions are all pinned to immutable full commit SHAs",
    actionRefs.length === 7
      && actionRefs.every(ref => /@[0-9a-f]{40}$/.test(ref)),
    JSON.stringify(actionRefs));
  assert("CI pins the reviewed v4 action implementations without a major-version upgrade",
    actionRefs.filter(ref => ref === "actions/checkout@11d5960a326750d5838078e36cf38b85af677262").length === 3
      && actionRefs.filter(ref => ref === "actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020").length === 3
      && actionRefs.filter(ref => ref === "pnpm/action-setup@a15d269cd4658e1107c09f1fabf4cbd7bd1f308a").length === 1,
    JSON.stringify(actionRefs));
  const pnpmInstalls = ci.match(/pnpm install[^\n]*/g) || [];
  const npmInstalls = ci.match(/npm ci[^\n]*/g) || [];
  assert("CI dependency installs disable package lifecycle scripts",
    pnpmInstalls.length === 1 && /--frozen-lockfile\b/.test(pnpmInstalls[0])
      && /--ignore-scripts\b/.test(pnpmInstalls[0])
      && npmInstalls.length === 3
      && npmInstalls.every(line => /--ignore-scripts\b/.test(line)
        && /--no-audit\b/.test(line) && /--no-fund\b/.test(line)),
    JSON.stringify({ pnpmInstalls, npmInstalls }));
  const servedSnapshots = fs.readFileSync(new URL("../site/tests/snapshots.test.mjs", import.meta.url), "utf8");
  assert("served snapshots resolve repository-only dependencies from the repository root",
    /new URL\("\.\.\/\.\.\/research\/final-answer-rationale\.md"/.test(servedSnapshots)
      && /new URL\("\.\.\/\.\.\/README\.md"/.test(servedSnapshots)
      && /require\("\.\.\/\.\.\/package\.json"\)/.test(servedSnapshots)
      && /new URL\("\.\.\/\.\.\/scripts\/publish\.sh"/.test(servedSnapshots)
      // The private-input gates resolve through the provenance module's own walk to the
      // repository root, so the twin must carry the SIBLING import — a rewritten relative
      // path here would mean sync-site-tests had mangled the one module that decides which
      // tree this is.
      && /from "\.\/provenance-inputs\.mjs"/.test(servedSnapshots));

  // A public snapshot must verify itself. Source-tree gates cannot catch an omitted
  // build/test input because that input is still present in the private workspace.
  // Parse the real allow-list and annex manifest so additions cannot silently reopen
  // that hole.
  const publishUrl = new URL("../scripts/publish.sh", import.meta.url);
  // The annex manifest is a PUBLIC input (build-research-html.mjs ships), so the publisher gate's
  // assertion count is computable in both modes — which is what lets the skip be counted honestly
  // rather than declared as a round number.
  const annexBuild = fs.readFileSync(new URL("../build-research-html.mjs", import.meta.url), "utf8");
  const annexInputs = [...annexBuild.matchAll(/\{\s*md:\s*"([^"]+)"/g)].map(m => m[1]);
  // 2 fixed staged inputs + the annex manifest + the 20 publisher-structure assertions below.
  // The literal 20 is not taken on trust: in the private tree, where this body always runs,
  // P.gate compares it against the assertions that actually ran and fails if it has gone stale.
  const PUBLISHER_STRUCTURE_ASSERTIONS = 27; // +2: the staged-inventory guard and the two-phase privacy scan (2026-09-19)
                                             // +4 (2026-09-20, im-repo-replacement, after an Astra xhigh review): the
                                             // any-tag refusal, the scanner-could-not-run refusal, the credential-filename
                                             // rule with .npmrc judged by content, and the UTC commit-date stamp + read-back.
  P.gate("scripts/publish.sh", 2 + annexInputs.length + PUBLISHER_STRUCTURE_ASSERTIONS, (publish) => {
    const allowBody = publish.match(/^ALLOW=\(\n([\s\S]*?)^\)$/m)?.[1] || "";
    const allowed = new Set(allowBody.split("\n")
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#"))
      .map(line => line.replace(/^['"]|['"]$/g, "")));
    const isAllowed = path => allowed.has(path)
      || [...allowed].some(parent => path.startsWith(`${parent}/`));
    for (const path of [
      "research/final-answer-rationale.md",
      "research/evidence-instances-v22.json",
      ...annexInputs,
    ]) {
      P.assert(`publish allow-list covers staged build/test input ${path}`, isAllowed(path), path);
    }
    P.assert("publish keeps the private mutation script out of the public snapshot",
      !isAllowed("scripts/publish.sh"));
    P.assert("publish keeps the private master-only deployment entrypoint out of the public snapshot",
      !isAllowed("deploy.sh"));
    /* STRENGTHENED 2026-09-20 (im-repo-replacement, after an Astra xhigh review): this used to
       pin `ls-remote --heads origin`, and that is exactly the defect. `--heads` does NOT list
       tags, so "origin is empty" meant "origin has no BRANCHES" — an origin carrying the exposed
       annotated tag and no branch satisfied every check, got a "verified an empty origin"
       announcement, and had main published beside it while the tag stayed reachable. That is the
       precise shape of the exposure the 2026-09-20 repository replacement exists to remedy. The
       assertion now requires the PRESENT behaviour: a genuinely empty origin (zero refs of any
       kind) on the first-publish path, and a refusal of ANY tag ref on either side — this
       publisher creates no tags, and a tag is a clone-by-default ref. Removing either refusal
       from publish.sh makes this assertion FAIL; verified by deleting each one in turn. */
    P.assert("publish documents IM_PUBLIC_DIR and handles only a verified empty-origin first publish",
      /export IM_PUBLIC_DIR=/.test(publish)
        && /ls-remote --heads origin/.test(publish)
        && /public origin has branches but no main/.test(publish)
        && /public origin is empty but the local public clone already has a commit/.test(publish)
        && /public origin advertises refs but no main branch/.test(publish)
        && /first publish: verified a genuinely empty origin \(zero refs of any kind\) and unborn local main/.test(publish));
    P.assert("publish refuses ANY tag ref on the public remote or in the local public clone",
      /the public remote carries \$REMOTE_TAGS tag ref\(s\)/.test(publish)
        && /the local public clone holds \$LOCAL_REFS tag ref\(s\)/.test(publish));
    /* Each of the FOUR scans gets its own refusal, named: a single generic check would stay green
       while three of the four silently lost their error branch. */
    P.assert("publish's privacy scan refuses when the scanner itself could not run",
      /grep_status\(\) \{/.test(publish)
        && /COULD NOT COMPLETE the real-name scan/.test(publish)
        && /COULD NOT COMPLETE the email scan/.test(publish)
        && /COULD NOT COMPLETE the home-path scan/.test(publish)
        && /COULD NOT COMPLETE the pathname scan/.test(publish));
    P.assert("publish refuses credential-shaped filenames and judges .npmrc by content",
      /staged credential-shaped file/.test(publish)
        && /staged \.npmrc carries an auth directive/.test(publish));
    /* THE INVOCATION, NOT THE FILENAME (Astra xhigh round 2, finding 6 — the third surviving
       mutation, and it found one I had missed twice). The first cut of this assertion checked the
       two date assignments, the guard's FILENAME and a diagnostic string. Astra replaced the guard
       CALL with `true || {` and all 1,405 snapshot assertions still passed, because the filename
       survives in the `UTC_GUARD=` assignment and the diagnostic survives in the error branch — so
       the test claimed the committed object was verified while nothing verified it. It now requires
       the actual call, with its argument, AND that a non-zero exit aborts before the push. */
    P.assert("publish stamps the public commit's date headers in UTC and reads the object back",
      /GIT_AUTHOR_DATE="\$UTC_EPOCH \+0000"/.test(publish)
        && /GIT_COMMITTER_DATE="\$UTC_EPOCH \+0000"/.test(publish)
        && /psyche-utc-commit-guard\.py/.test(publish)
        && /the UTC commit-date guard is missing at/.test(publish));
    /* FOURTH MUTATION (Astra xhigh round 3): the version above checked that the call exists, that
       it is followed by `|| {`, and that it precedes the push — and stayed green when `exit 1` in
       that block's body was replaced with `:`, which would let a REJECTED commit fall through to
       the push. The rejection branch has to be shown to LEAVE, so its body is read too. The
       behavioural twin lives in im-repo-replacement-work/exercise-publish-guards.sh, which runs
       the extracted block against a stub guard that rejects and asserts the push is never
       reached; this is the structural half that travels with the repository. */
    const utcCall = publish.indexOf('python3 "$UTC_GUARD"');
    const utcBlockEnd = publish.indexOf("\nfi", utcCall);
    const utcBlock = utcCall < 0 ? "" : publish.slice(utcCall, utcBlockEnd);
    P.assert("the UTC guard is CALLED on the created object, and a rejection aborts before the push",
      /python3 "\$UTC_GUARD" "\$PUBLIC_REAL" --commits "\$\(git rev-parse HEAD\)"/.test(publish)
        && /--commits "\$\(git rev-parse HEAD\)" \|\| \{/.test(publish)
        && utcCall >= 0 && utcCall < publish.indexOf("git push origin HEAD:main")
        && /refusing to push[\s\S]*exit 1; \}/.test(utcBlock),
      utcBlock.slice(0, 160));
    P.assert("publish includes the pinned feedback Wrangler wrapper",
      isAllowed("feedback/wrangler.sh"));
    for (const path of [".gitignore", "mcp-server/.gitignore",
      "mcp-server/worker/.gitignore", "feedback/.gitignore"]) {
      P.assert(`publish preserves ${path} in the reconstructed public snapshot`,
        allowed.has(path), path);
    }

    const stageAt = publish.indexOf('STAGE="$(mktemp -d)"');
    const validateAt = publish.indexOf('validate_stage "$STAGE"');
    const dryAt = publish.indexOf('if [ "$DRY" = "1" ]');
    P.assert("publish validates the reconstructed public stage, not the private source tree",
      stageAt >= 0 && validateAt > stageAt && dryAt > validateAt);
    P.assert("publish reconstructs the stage from the immutable source commit, never untracked worktree bytes",
      /git archive --format=tar "\$SOURCE_COMMIT" -- "\$\{ALLOW\[@\]\}"/.test(publish)
        && !/cp -r "\$p" "\$STAGE\/\$p"/.test(publish));
    P.assert("publish cleanup failures are fatal and followed by an explicit deny inventory",
      /assert_stage_hygiene\(\)/.test(publish)
        && (publish.match(/assert_stage_hygiene "\$STAGE"/g) || []).length === 2
        && !/find "\$STAGE"[^\n]*\|\| true/.test(publish)
        && !/sed -i [^\n]*\|\| true/.test(publish)
        && /FATAL: staged ephemeral artifact survived cleanup/.test(publish)
        && /FATAL: staged Cloudflare account_id survived cleanup/.test(publish));
    /* Added 2026-09-19 (Astra pack D P1-3, proven live): validation installs into and BUILDS in
       the stage, and the first run of the inventory guard found EIGHTY-TWO files it had added —
       the vendored economics copies, the synthetic dc-map test releases and a preset-pairs
       artifact — every one of which `git add -A` would have committed to the public repo. The
       allow-list decides what ships, so the stage's file list is recorded before validation and
       anything else is removed afterwards; a REMOVAL is what stays fatal. */
    P.assert("the staged inventory is recorded before validation and enforced after it",
      /STAGE_INVENTORY="\$\(mktemp\)"/.test(publish)
        && /comm -z -13 "\$STAGE_INVENTORY" "\$POST_INVENTORY"/.test(publish)
        && /FATAL: validation removed an allow-listed path from the stage/.test(publish)
        && publish.indexOf('STAGE_INVENTORY="$(mktemp)"') < publish.indexOf('validate_stage "$STAGE"')
        && publish.indexOf('comm -z -13') > publish.indexOf('validate_stage "$STAGE"'));
    P.assert("the privacy scan runs BOTH before validation and over the bytes that ship",
      (publish.match(/^deny_scan "\$STAGE"/gm) || []).length === 2
        && publish.indexOf('deny_scan "$STAGE" "post-validate"') > publish.indexOf('comm -z -13'));
    const validateBody = publish.match(/^validate_stage\(\) \{\n([\s\S]*?)^\}$/m)?.[1] || "";
    P.assert("publish stage gate installs and reproduces root artifacts",
      /cd "\$stage"/.test(validateBody)
        && /pnpm install --frozen-lockfile/.test(validateBody)
        && /npm run build/.test(validateBody)
        && /diff -ru/.test(validateBody));
    P.assert("publish stage gate runs root source and served suites",
      /\bnpm test\b/.test(validateBody)
        && /npm run test:served-node/.test(validateBody)
        && /npm run test:browser/.test(validateBody)
        && /npm run test:served-browser/.test(validateBody));
    P.assert("publish stage gate installs and tests MCP plus typechecks its worker",
      /npm --prefix mcp-server ci/.test(validateBody)
        && /npm --prefix mcp-server test/.test(validateBody)
        && /npm --prefix mcp-server\/worker ci/.test(validateBody)
        && /npm --prefix mcp-server\/worker run typecheck/.test(validateBody));
    P.assert("publish stage gate bundles feedback with the pinned worker Wrangler and never deploys it",
      /npm --prefix mcp-server\/worker exec -- wrangler deploy --dry-run/.test(validateBody)
        && !/npm --prefix mcp-server\/worker exec -- wrangler deploy(?! --dry-run)/.test(validateBody));
    const { spawnSync } = require("node:child_process");
    const { fileURLToPath } = require("node:url");
    const argProbe = args => spawnSync(fileURLToPath(publishUrl), args, { encoding: "utf8" });
    const badArgResults = [
      argProbe(["--help"]),
      argProbe(["--dry-rnu"]),
      argProbe(["--dry-run", "extra"]),
    ];
    P.assert("publish rejects unknown arguments instead of treating typos as a real publish",
      /case "\$#" in/.test(publish)
        && badArgResults.every(result => result.status === 2
          && /Usage: scripts\/publish\.sh \[--dry-run\]/.test(result.stderr)),
      badArgResults.map(result => `${result.status}:${result.stderr.trim()}`).join(" | "));
    P.assert("publish entrypoint is executable as documented",
      (fs.statSync(publishUrl).mode & 0o111) !== 0);
    const replaceAt = publish.indexOf('find "$PUBLIC_REAL" -mindepth 1');
    const fetchOriginAt = publish.indexOf('remote get-url --all origin');
    const pushOriginAt = publish.indexOf('remote get-url --push --all origin');
    // The expected-origin set is parsed, not merely detected: every entry must be a canonical
    // URL of the ONE public repository, and membership must be exact string equality. A second
    // accepted transport for the same repo is not a loosening; a second REPO would be.
    const originSet = (publish.match(/^EXPECTED_PUBLIC_ORIGINS=\(\n([\s\S]*?)^\)$/m)?.[1] || "")
      .split("\n").map(line => line.trim().replace(/^"|"$/g, "")).filter(Boolean);
    P.assert("publish pins its destructive target to canonical URLs of exactly one public repository",
      originSet.length > 0
        && originSet.every(url =>
          /^(?:git@github\.com:|https:\/\/github\.com\/)AshitaOrbis\/inference-margins\.git$/.test(url))
        && /origin_is_expected\(\) \{/.test(publish)
        && /\[ "\$url" = "\$candidate" \] && return 0/.test(publish),
      JSON.stringify(originSet));
    P.assert("publish validates the destructive public-clone target and exact origin before replacement",
      /PUBLIC_REAL="\$\(realpath -e/.test(publish)
        && /EXPECTED_PUBLIC_ORIGINS=\(/.test(publish)
        && /FETCH_ORIGINS\[@\]/.test(publish)
        && /PUSH_ORIGINS\[@\]/.test(publish)
        && /#FETCH_ORIGINS\[@\].*-eq 1/.test(publish)
        && /#PUSH_ORIGINS\[@\].*-eq 1/.test(publish)
        && /origin_is_expected "\$\{FETCH_ORIGINS\[0\]\}"/.test(publish)
        && /origin_is_expected "\$\{PUSH_ORIGINS\[0\]\}"/.test(publish)
        && /public clone has uncommitted changes/.test(publish)
        && /PUBLIC_BRANCH=.*symbolic-ref/.test(publish)
        && /PUBLIC_BRANCH" = "main"/.test(publish)
        && /fetch --quiet origin main/.test(publish)
        && /PUBLIC_HEAD" = "\$ORIGIN_MAIN"/.test(publish)
        && /git push origin HEAD:main/.test(publish)
        && fetchOriginAt >= 0 && fetchOriginAt < replaceAt
        && pushOriginAt >= 0 && pushOriginAt < replaceAt);
    const versionAt = publish.indexOf('SOURCE_VERSION="$(node -');
    P.assert("publish resolves and validates the engine version before destructive replacement",
      versionAt >= 0
        && /ENGINE_REVISION/.test(publish.slice(versionAt, replaceAt))
        && /\\d\+\\\.\\d\+\\\.\\d\+/.test(publish.slice(versionAt, replaceAt))
        && versionAt < replaceAt
        && !/VERSION="\$\(grep/.test(publish));
  });

  // Lifted OUT of the publisher gate: both of its inputs ship, so it has no business being
  // skipped with the publisher. It was nested there only by where it was written.
  const feedbackWrapperUrl = new URL("../feedback/wrangler.sh", import.meta.url);
  const feedbackRunbook = fs.readFileSync(new URL("../feedback/RUNBOOK.md", import.meta.url), "utf8");
  const feedbackWrapper = fs.readFileSync(feedbackWrapperUrl, "utf8");
  assert("feedback operations use only the lockfile-pinned local Wrangler",
    !/npx wrangler/.test(feedbackRunbook)
      && /\.\/wrangler\.sh/.test(feedbackRunbook)
      && /node_modules\/\.bin\/wrangler/.test(feedbackWrapper)
      && !/\bnpx\b|\bnpm exec\b/.test(feedbackWrapper)
      && (fs.statSync(feedbackWrapperUrl).mode & 0o111) !== 0);

  assertNoOrphanRegistrations(assert);
}

// 7. Dossier coverage + drift prevention: every preset has a dossier; every dossier
// param annotation refers to a key the preset actually sets (values render live, so
// they cannot drift — key mismatches are the only failure mode).
for (const m of E.MODELS) {
  const d = E.DOSSIERS.models[m.id];
  assert(`dossier exists for model ${m.id}`, !!d);
  if (!d) continue;
  // Traffic keys moved to the TRAFFIC MIX axis (v2.1.2): models whose POSITION includes a
  // traffic mix carry nativeTrafficWasExplicit and their dossiers annotate ioRatio/cacheHit,
  // whose values now render from the named profile rather than the model set.
  const legal = new Set([...Object.keys(m.set), ...(m.dive ? Object.keys(m.dive) : []),
                         ...(m.nativeTrafficWasExplicit ? ["ioRatio", "cacheHit"] : [])]);
  for (const k of Object.keys(d.params || {})) assert(`dossier(${m.id}).${k} matches a set key`, legal.has(k), k);
  for (const k of Object.keys(m.set)) assert(`model ${m.id} set.${k} is annotated in dossier`, !!(d.params && d.params[k]), k);
}
for (const p of E.PERSPECTIVES) {
  const d = E.DOSSIERS.perspectives[p.id];
  assert(`dossier exists for perspective ${p.id}`, !!d);
  if (!d) continue;
  for (const k of Object.keys(d.params || {})) assert(`dossier(persp ${p.id}).${k} matches a set key`, k in p.set, k);
  for (const k of Object.keys(p.set)) assert(`perspective ${p.id} set.${k} is annotated in dossier`, !!(d.params && d.params[k]), k);
}

// 8. v2.1.1 semantic release gates (council final-review fixtures).
{
  // 8a. Lens-range membership: no pairing-warned or non-lens perspective may contribute.
  // Pairing logic lives in the engine since v2.1.2 (the app.js duplicate was a drift surface).
  const pairingWarning = E.pairingWarning;
  for (const m of E.MODELS) {
    const compat = E.PERSPECTIVES.filter(p => p.kind === "lens" && pairingWarning(m, p) === "");
    // Structural membership assertions (magnitude is NOT the test — deeply negative endpoints
    // are honest for China tariffs under on-demand rents; the display clamps below −100%).
    const ids = new Set(compat.map(p => p.id));
    assert(`lens set for ${m.id} contains no analyst/replay entries`, compat.every(p => p.kind === "lens"));
    // v2.1.2: the xAI valuation presets are atomic REPLAYS (traffic-locked); they are excluded
    // from the lens span for every model, grok included — the span now compares only pure cost
    // lenses at byte-identical traffic (see tests/traffic-contract.test.mjs).
    assert(`xAI valuation replays excluded from lens span for ${m.id}`, !ids.has("xaicash") && !ids.has("xaiopp"));
    if (["opus", "sonnet", "haiku", "gpt", "gemini", "terra", "luna", "gemflash", "grok"].includes(m.id))
      assert(`chinacloud excluded for ${m.id}`, !ids.has("chinacloud"));
    const margins = compat.map(p => E.workload(preset(m, p)).margin).filter(isFinite);
    if (margins.length >= 2) {
      const lo = Math.min(...margins), hi = Math.max(...margins);
      assert(`lens range for ${m.id} within gross bounds: ${(lo*100).toFixed(0)}..${(hi*100).toFixed(0)}`, lo > -100 && hi < 1.0);
    }
  }
  // 8b. xAI valuation replays hold the dive operating point and land on their stated values.
  assert("xaicash/xaiopp are replays (atomic)", E.PERSPECTIVES.find(p=>p.id==="xaicash").kind === "replay" && E.PERSPECTIVES.find(p=>p.id==="xaiopp").kind === "replay");
  const cash = settings("grok", "xaicash"), opp = settings("grok", "xaiopp");
  assert("xAI lenses inherit the dive workload (3:1, 0% cache)", cash.ioRatio === 3 && cash.cacheHit === 0 && opp.ioRatio === 3 && opp.cacheHit === 0);
  assert("grok + xAI cash ≈ 90.7±0.1 at the dive workload", Math.abs(marginPct(cash) - 90.7) <= 0.1, marginPct(cash).toFixed(1));
  assert("grok + xAI opportunity ≈ 18.7±0.1 at the dive workload", Math.abs(marginPct(opp) - 18.7) <= 0.1, marginPct(opp).toFixed(1));
  // 8c. Attribution honesty: any quoted-position dossier must have zero SPECULATION-labeled params.
  const all = [["models", E.MODELS], ["perspectives", E.PERSPECTIVES]];
  for (const [section, list] of all) for (const item of list) {
    const d = E.DOSSIERS[section][item.id];
    if (!d || d.attribution !== "quoted-position") continue;
    const spec = Object.values(d.params || {}).filter(a => /SPECULATION/.test(a.label)).length;
    assert(`quoted-position ${item.id} has no SPECULATION params`, spec === 0, `${spec} speculative`);
  }
}

// 9. Preset redesign (v2.1.3 M4): exploration configs, claims registry, interval algebra, ranking.
{
  const EXPL = E.PERSPECTIVES.filter(p => p.kind === "exploration");
  // 2026-08-16 (owner notes aa315c + c72950): FIVE. x90-v2 ships the mechanism named in the
  // 90→95% claim — the batch lever applied alone to the ≥90% route — which v2.1.3 dropped for
  // landing short of its authored range. The four originals keep their ids (permalink anchors).
  assert("exactly the 5 discourse-tied exploration routes ship",
    EXPL.length === 5
      && ["x60-v3", "x80-v3", "x80-v4", "x90-v1", "x90-v2"].every(id => EXPL.some(p => p.id === id)),
    EXPL.map(p => p.id).join(","));

  // 9a. Flagship-scope margin pins (±0.1pp): Claude Opus 4.x @ explicit Reference 15:1/60%.
  // R3 re-mint (D-2e broad inheritance, manifest family 27): route margins re-derive on
  // the FILTERED na-blend seed; the computed bucket keeps its board-grouping role and
  // the AUTHORED-range integrity discloses separately (typed authoredRange — after the b9
  // M1 repair x90-v1 still lands OUTSIDE its authored range while x80-v3, x80-v4 and
  // x60-v3 land INSIDE theirs; asserted below).
  // b9 M1 re-mint: every route re-derives on the REPAIRED default seed. Two routes now
  // land INSIDE the band they were authored for (see AUTHORED below) — the repair moved
  // them, not a re-authoring; no route definition changed in this milestone.
  /* im-arc T4 fold (2026-08-24, tests/fixtures-t4-declared-delta.json): every route re-derives on
     the folded defaults. NO route definition changed — the authored ranges and the reader-set
     vectors are untouched; what moved is the arithmetic beneath them, dominated by three planning
     rents resolving as unavailable so each rent-basis route prices a different, more expensive
     remainder. The disposition consequences are disclosed under AUTHORED below, and they are a
     FINDING of the fold, not a re-authoring. */
  /* im-arc T4 fold: x90-v1 and x90-v2 are ARCHIVED readings and carry the memo §6 pin bundle, so
     they are UNMOVED. The three routes without an archived reading move with the folded
     arithmetic, and their disposition consequences are disclosed under AUTHORED below. */
  /* im-release-edit-r2 (2026-09-10): x90-v1 is byte-unchanged (owned-TCO basis prices from capex,
   which the rent adoption does not touch); the three rent-basis routes move with it. */
/* im-vet-six-repairs (2026-09-20, program bq-2835; vetting findings E1 + E2): every route rides
   the default fleet seed, so all four move with the two registry repairs — the two Trainium legs
   WITHDRAWN from the default's membership on evidence grounds, and the TPU v7 decode coefficient
   corrected from 0.55 to 0.519 after one of its two endpoints was found to be computed on Google's
   COMBINED input-plus-output rate as if it were a decode rate. NO route definition changed; the
   authored ranges and the reader-set vectors are untouched. */
const FLAGSHIP_PINS = { "x90-v1": 89.3, "x80-v3": 80.6, "x80-v4": 79.5, "x60-v3": -40.3 };
  for (const [id, pin] of Object.entries(FLAGSHIP_PINS)) {
    const got = E.explorationFlagshipMargin(E.PERSPECTIVES.find(p => p.id === id));
    assert(`exploration ${id} flagship margin = ${pin}±0.1pp`, Math.abs(got - pin) <= 0.1, got.toFixed(3));
  }
  // ...and each route's COMPUTED bucket matches the range its name declares (membership is
  // derived via explorationComputedBucket, never hand-set).
  // b9 M1: x80-v3/x80-v4 computed buckets move b6080 → b8090 (they now compute inside the
  // 80–90 band their names declare); x90-v1 stays b8090 (89.1 is still short of 90).
  /* im-arc T4 fold (2026-08-24): two of those moves REVERSE and one completes. x90-v1 crosses 90
     (89.1 → 90.0) and enters b90plus; x80-v3 and x80-v4 fall back to b6080 (81.7 → 77.6,
     80.7 → 76.4); x60-v3 stays b60minus. The bucket is DERIVED from the computed margin, so this
     table records where the routes now land — it never sets where they land. */
  /* im-release-edit-r2 (2026-09-10): and they move BACK. Adopting planning rents for the three
     unpriced legs lifts x80-v3 to 81.0 and x80-v4 to 80.0, so both re-enter b8090 — the band they
     were authored for — and x60-v3 rises from −64.8 to −42.2 while staying in b60minus. The bucket
     is DERIVED from the computed margin; this table records where the routes land and never sets it. */
  /* im-vet-six-repairs (2026-09-20): x80-v4 falls out of b8090 at 79.54 and lands in b6080. The
     bucket is DERIVED from the computed margin; this table records where the routes land and never
     sets it — which is the whole reason it can record a route leaving the band its name declares. */
  const DECLARED = { "x90-v1": "b8090", "x80-v3": "b8090", "x80-v4": "b6080", "x60-v3": "b60minus" };
  for (const [id, bid] of Object.entries(DECLARED))
    assert(`exploration ${id} computed bucket = ${bid}`,
      (E.explorationComputedBucket(E.PERSPECTIVES.find(p => p.id === id)) || {}).id === bid);
  // R3 (D-2e, family 35): AUTHORED-range integrity — the typed authoredRange field on
  // every route, the SHARED half-open algebra, and the four flagship dispositions
  // (execution-pinned). The computed-bucket label NEVER stands in for the authored noun.
  // b9 M1 disposition flip (a load-bearing honesty change, manifested): x80-v3 and x80-v4
  // were disclosed as landing OUTSIDE their authored 80–90 band at 79.6/78.5; on the
  // repaired defaults they compute 81.7/80.7 and land INSIDE it. The authored ranges are
  // untouched — only the computed margins moved. x90-v1 remains OUTSIDE its ≥90 band.
  /* im-arc T4 fold (2026-08-24) — THREE dispositions move, and this is the most consequential
     single line in the fold's disclosure. The authored ranges are again untouched; only the
     computed margins moved, under the folded evidence:
       x90-v1  89.1 UNMOVED, OUTSIDE  (an archived reading; it carries the §6 pin bundle)
       x80-v3  81.7 → 77.6  INSIDE  → OUTSIDE
       x80-v4  80.7 → 76.4  INSIDE  → OUTSIDE
       x60-v3  −37.8 → −64.8  INSIDE, unchanged in disposition
     Two page-authored reconstructions of named analysts' 80–90% claims no longer compute inside
     the band they reconstruct once three rows lose their invented planning rates. That is a
     finding about the evidence, and it is disclosed here rather than tuned away. */
  /* im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok
     — and the two dispositions move BACK, worth stating as plainly as the fold stated their loss:
       x90-v1  89.1 UNMOVED, OUTSIDE  (an owned-TCO route; capex prices it, so rents do not move it)
       x80-v3  77.6 -> 81.0  OUTSIDE -> INSIDE
       x80-v4  76.4 -> 80.0  OUTSIDE -> INSIDE
       x60-v3  -64.8 -> -42.2  INSIDE, unchanged in disposition
     The authored ranges are untouched for the third time; only the computed margins moved. And the
     honest reading of the round trip is NOT that these reconstructions were vindicated: they left
     the band when three legs lost their planning rates and re-entered it when the owner adopted
     rates for those legs. What carries them across is an adopted assumption, not new evidence. */
  /* im-vet-six-repairs (2026-09-20) — ONE disposition moves, and it moves the honest way:
       x90-v1  89.1 -> 89.3   OUTSIDE, unchanged in disposition
       x80-v3  81.0 -> 80.6   INSIDE, unchanged in disposition (it survives the repair by 0.6pp)
       x80-v4  80.0 -> 79.5   INSIDE -> OUTSIDE
       x60-v3  -42.2 -> -40.3 INSIDE, unchanged in disposition
     The authored ranges are untouched for the fourth time; only the computed margins moved, and
     they moved because two coefficients were repaired against their own sources, not because any
     vector was re-authored. A page-authored reconstruction of a named analyst's 80-90% claim no
     longer computes inside the band it reconstructs, and that is disclosed here rather than tuned
     away — which is exactly what "membership is computed, never enforced" has to mean when the
     computation goes the unwelcome way. */
  const AUTHORED = { "x90-v1": [90, Infinity, false], "x80-v3": [80, 90, true],
    "x80-v4": [80, 90, false], "x60-v3": [-Infinity, 60, true] };
  for (const [id, [lo, hi, inside]] of Object.entries(AUTHORED)) {
    const p2 = E.PERSPECTIVES.find(p => p.id === id);
    assert(`authoredRange ${id}: typed field {${lo},${hi}} + disposition ${inside ? "INSIDE" : "OUTSIDE"} at flagship scope`,
      p2.authoredRange && p2.authoredRange.lo === lo && p2.authoredRange.hi === hi
      && E.withinAuthoredRange(p2, E.explorationFlagshipMargin(p2)) === inside);
  }
  assert("authoredRange: the membership predicate IS the shared half-open algebra (bucketForMargin routes through inHalfOpenRange; open ends are ±Infinity, never null)",
    /inHalfOpenRange/.test(E.bucketForMargin.toString())
    && /inHalfOpenRange/.test(E.withinAuthoredRange.toString())
    && E.inHalfOpenRange(-Infinity, 60, -118.95) === true
    && E.inHalfOpenRange(90, Infinity, 80.71) === false);
  assert("authoredRange: labels derive from the matching MARGIN_BUCKETS row (no name parsing)",
    E.authoredRangeLabel(E.PERSPECTIVES.find(p => p.id === "x90-v1")) === "≥90%"
    && E.authoredRangeLabel(E.PERSPECTIVES.find(p => p.id === "x60-v3")) === "<60%");

  // 9b. Interval algebra: buckets are half-open [lo, hi) derived from ONE representation.
  // Edge behavior at 60 / 80 / 90 (lower edge inclusive, upper edge exclusive):
  const bid = v => (E.bucketForMargin(v) || {}).id;
  assert("edge 60: 59.999 → <60", bid(59.999) === "b60minus");
  assert("edge 60: 60 → 60–80 (lower-inclusive)", bid(60) === "b6080");
  assert("edge 80: 79.999 → 60–80", bid(79.999) === "b6080");
  assert("edge 80: 80 → 80–90 (lower-inclusive)", bid(80) === "b8090");
  assert("edge 90: 89.999 → 80–90", bid(89.999) === "b8090");
  assert("edge 90: 90 → ≥90 (lower-inclusive)", bid(90) === "b90plus");
  assert("open top: 95 → ≥90", bid(95) === "b90plus");
  assert("open bottom: −94 → <60", bid(-94) === "b60minus");
  // Claim membership at the edges: a point claim ON an edge belongs to the bucket the edge
  // OPENS, never the bucket it closes; floors relate compatible-with at/above their lo only.
  const rels = id => E.claimBucketRelations(E.MARGIN_CLAIMS.find(c => c.id === id));
  assert("point-60 claim sits in 60–80 only (semianalysis-60-blend)",
    JSON.stringify(rels("semianalysis-60-blend").map(r => r.bucketId)) === JSON.stringify(["b6080"]));
  assert("point-80 claim sits in 80–90 only (teortaxes-80-inference-2025)",
    JSON.stringify(rels("teortaxes-80-inference-2025").map(r => r.bucketId)) === JSON.stringify(["b8090"]));
  assert("interval 90–95 sits in ≥90 only (zephyr-9095-unnamed)",
    JSON.stringify(rels("zephyr-9095-unnamed").map(r => r.bucketId)) === JSON.stringify(["b90plus"]));
  assert("floor >80 relates compatible-with to 80–90 AND ≥90, never as interval membership (patel-80-floor)",
    JSON.stringify(rels("patel-80-floor")) === JSON.stringify([
      { bucketId: "b8090", relation: "compatible-with" }, { bucketId: "b90plus", relation: "compatible-with" }]));
  assert("floor 90+ relates compatible-with to ≥90 only (teortaxes-90plus-floor)",
    JSON.stringify(rels("teortaxes-90plus-floor")) === JSON.stringify([{ bucketId: "b90plus", relation: "compatible-with" }]));
  // Registry-wide: membership == the computed numeric intersection for every binnable claim.
  for (const c of E.MARGIN_CLAIMS) {
    const got = E.claimBucketRelations(c);
    if (!c.binnable || !c.numeric) { assert(`claim ${c.id}: non-binnable ⇒ zero bucket relations`, got.length === 0); continue; }
    const isFloor = c.boundType === "floor" || c.numeric.hi === null || c.numeric.hi === undefined;
    const expect = E.MARGIN_BUCKETS
      .filter(b => isFloor ? b.hi > c.numeric.lo : (c.numeric.lo < b.hi && c.numeric.hi >= b.lo)).map(b => b.id);
    assert(`claim ${c.id}: bucket set == computed intersection`,
      JSON.stringify(got.map(r => r.bucketId)) === JSON.stringify(expect), JSON.stringify(got));
    assert(`claim ${c.id}: relations honest (${isFloor ? "floor ⇒ compatible-with only" : "typed relation carried"})`,
      got.every(r => r.relation === (isFloor ? "compatible-with" : c.relation)), JSON.stringify(got));
  }

  // 9c. Ranking = the computed fewest-changed-registry-fields order (stable id tie-break),
  // recomputed independently here — the displayed order may never drift from the basis.
  const central = E.PERSPECTIVES.find(p => p.id === "median").set;
  const changed = p => E.PERSPECTIVE_SPACE_KEYS.filter(k =>
    /* im-arc T2 (memo §6, 2026-08-22): the explicit historical kwh pin is
       migration metadata that preserves the route, not a new authored lever.
       im-arc T4 fold (2026-08-24, memo §6 [F10]): the T4 pin bundle is larger, and WHICH keys are
       migration metadata is now DECLARED by the route in `migrationPins` rather than hard-coded
       here — so this independent recomputation reads that declaration instead of a key list it
       would have to be kept in sync with by hand. */
    !(p.migrationPins || ["kwh"]).includes(k)
    && JSON.stringify(p.set[k] ?? E.DEFAULTS[k]) !== JSON.stringify(central[k] ?? E.DEFAULTS[k])).length;
  const expectedOrder = [...EXPL].sort((a, b) =>
    (changed(a) - changed(b)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).map(p => p.id);
  assert("rankExplorations == recomputed fewest-changed order",
    JSON.stringify(E.rankExplorations().map(p => p.id)) === JSON.stringify(expectedOrder),
    E.rankExplorations().map(p => p.id).join(","));
  // x90-v2 is x90-v1 plus ONE changed field (interact), so it sorts at 4 — immediately after its
  // parent and ahead of the 5s. The order is recomputed above from the basis; this pin states
  // what that recomputation must produce, so a silent reordering is still a failure.
  assert("order is x90-v1(3), x90-v2(4), x60-v3(5), x80-v3(5), x80-v4(6) — stable id tie-break at 5",
    JSON.stringify(expectedOrder) === JSON.stringify(["x90-v1", "x90-v2", "x60-v3", "x80-v3", "x80-v4"]), expectedOrder.join(","));
  assert("only sanctioned ordering label", E.EXPLORATION_ORDER_BASIS === "fewest changed registry fields from the central configuration");

  // 9d. Registry integrity: every claim record is complete and typed; binnable:false records
  // exist precisely so this suite can assert they are never returned as claimants.
  const SRC_CLASSES = ["primary-post", "quoted-secondary", "reporting", "model-generated", "disclosure-anchor", "sweep-non-finding"];
  const BOUND_TYPES = ["point", "interval", "floor", "ceiling", "conditional-range"];
  for (const c of E.MARGIN_CLAIMS) {
    assert(`claim ${c.id}: verbatim is exact-string-or-null`, typeof c.verbatim === "string" || c.verbatim === null);
    assert(`claim ${c.id}: has url`, typeof c.url === "string" && c.url.length > 0);
    assert(`claim ${c.id}: has date (or explicit null)`, typeof c.date === "string" || c.date === null);
    assert(`claim ${c.id}: valid sourceClass`, SRC_CLASSES.includes(c.sourceClass), String(c.sourceClass));
    assert(`claim ${c.id}: valid boundType`, c.binnable ? BOUND_TYPES.includes(c.boundType)
      : (c.boundType === null || BOUND_TYPES.includes(c.boundType)), String(c.boundType));
    if (c.binnable && c.numeric) assert(`claim ${c.id}: numeric.lo is a number`, typeof c.numeric.lo === "number");
    if (c.verbatim === null) assert(`claim ${c.id}: null verbatim carries reportedFigure or reason (no paraphrase posing as a quote)`, !!(c.reportedFigure || c.reason));
    if (!c.binnable) assert(`claim ${c.id}: binnable:false carries its reason`, typeof c.reason === "string" && c.reason.length > 0);
  }
  for (const b of E.MARGIN_BUCKETS) {
    const ids = E.claimsForBucket(b.id).map(x => x.claim.id);
    for (const c of E.MARGIN_CLAIMS.filter(c => !c.binnable))
      assert(`binnable:false ${c.id} never returned by claimsForBucket(${b.id})`, !ids.includes(c.id));
  }

  // 9e. Lint (P0-7): no likelihood/probability/explicitness/assumption(s)/assumed/assuming
  // language on any exploration surface — the only sanctioned basis is the fewest-changed-fields
  // label. ("assumes" as the dossier field NAME is sanctioned structure, not surface prose.)
  const FORBIDDEN = /likelihood|probabilit|explicitness|assumptions?|assumed|assuming/i;
  assert("ordering-basis label passes its own lint", !FORBIDDEN.test(E.EXPLORATION_ORDER_BASIS));
  for (const p of EXPL) {
    const surfaces = [["name", p.name], ["subtitle", p.subtitle || ""], ["note", p.note || ""],
      ["dossier", JSON.stringify(E.DOSSIERS.perspectives[p.id] || {})]];
    for (const [what, text] of surfaces)
      assert(`lint: exploration ${p.id} ${what} carries no likelihood/probability/explicitness/assumption language`,
        !FORBIDDEN.test(text), (text.match(FORBIDDEN) || [])[0]);
  }
}

// Permalink round-trip baseline (P0 fix 2026-07-15): a field the user sets TO a global-default
// value that differs from the preset's own value must survive an encode→decode→load round-trip.
// The encoder diffs against the loader's baseline (applyPresetSettings of the declared identity),
// never against global DEFAULTS — the old DEFAULTS diff omitted such fields and the link silently
// reverted them to the preset value (GPT median active 300→105: margin 77.9%→92.3%).
{
  const roundTrip = (m, p, S) => {
    const tok = E.encodeScenario(S, m.id, p.id, { mode: "native", ioRatio: S.ioRatio, cacheHit: S.cacheHit }, null, { fleet: "custom", totalCase: "custom" });
    const diff = E.decodeScenario(tok);
    const S2 = preset(m, p, { mode: "native", profileId: null });
    for (const [k, v] of Object.entries(diff)) if (k !== "_meta") S2[k] = v;
    return S2;
  };
  const SWEEP_KEYS = Object.keys(E.DEFAULTS).filter(k =>
    typeof E.DEFAULTS[k] === "number" && k !== "ioRatio" && k !== "cacheHit"); // traffic travels as identity in _meta.traffic
  const p = E.PERSPECTIVES.find(x => x.id === "median");
  let cases = 0, preserved = 0;
  for (const m of E.MODELS) {
    for (const k of SWEEP_KEYS) {
      const S = preset(m, p, { mode: "native", profileId: null });
      if (JSON.stringify(S[k]) === JSON.stringify(E.DEFAULTS[k])) continue; // only cases where baseline ≠ global default
      if ((k === "active" && E.DEFAULTS[k] > S.total)
        || (k === "total" && E.DEFAULTS[k] < S.active)) continue; // an impossible model-size pair is not an encodable scenario
      S[k] = E.DEFAULTS[k];
      const S2 = roundTrip(m, p, S);
      cases++;
      if (JSON.stringify(S2[k]) === JSON.stringify(S[k])) preserved++;
      else assert(`round-trip preserves ${m.id}.${k} set to the global default`, false,
        `restored ${JSON.stringify(S2[k])}, expected ${JSON.stringify(S[k])}`);
    }
  }
  assert(`permalink round-trip: every global-default-valued field survives (${preserved}/${cases} cases)`,
    cases > 0 && preserved === cases);
  // The concrete reproduction from the 2026-07-15 Sol inspection: GPT median, active := 300B.
  const m = E.MODELS.find(x => x.id === "gpt");
  const S = preset(m, p, { mode: "native", profileId: null });
  S.active = E.DEFAULTS.active;
  const S2 = roundTrip(m, p, S);
  assert("round-trip gpt/median active=300B: margin identical",
    Math.abs(E.workload(S2).margin - E.workload(S).margin) < 1e-12,
    `${(100 * E.workload(S).margin).toFixed(3)} → ${(100 * E.workload(S2).margin).toFixed(3)}`);
}

/* R2 RETIREMENT + REPLACEMENT (shipment plan §2 "snapshots — workloadAtNShard block +
   value pins"; §4.3 core retirements): the legacy replica-width sensitivity channel
   (workloadAtNShard / replicaWidthSensitivity + clause) is GONE — the render path
   consumes SOLVER capacity widths, and the width story is the solver receipt + the
   shared welded policy clause. The old block's load-bearing physics assertion
   ("gb200-only 5T non-numeric at fixed width 8") was exactly the owner-cited
   calculator error; its R2 replacement asserts the solved rendering + receipts. */
{
  const m = E.MODELS.find(x => x.id === "opus"), p = E.PERSPECTIVES.find(x => x.id === "median");
  const s = preset(m, p, { mode: "explicit", profileId: "reference" });
  s.blend = { gb200: 100 };
  const baseline = E.workload(s);
  /* im-arc T4 fold (2026-08-24), memo §4: the property this assertion exists to protect is a
     CAPACITY one — the retired fixed-width-8 infeasibility that the owner cited as a calculator
     error is gone, and a gb200-only fleet solves and renders at the solver capacity width. That
     property is unchanged and is asserted here under the OWNED basis, where gb200 is fully priced.
     Under the page's default RENT basis the same fleet now renders nothing, for an entirely
     different and honest reason: no admissible public planning rate exists for gb200. Conflating
     the two would let a pricing gap masquerade as the physics bug this assertion was written to
     catch, so both are asserted, separately and by name. */
  /* The clone loses the SCENARIO_CONTEXT registration, so the context is supplied explicitly —
     the same idiom the T2/T3 audit states use. */
  const ownedBaseline = E.workload(Object.assign(structuredClone(s), { hwMode: "tco" }),
    undefined, E.scenarioContext(s));
  assert("R2 replacement: gb200-only (revised default size) RENDERS at the solver capacity width (the retired fixed-8 infeasibility was the cited artifact)",
    isFinite(ownedBaseline.margin) && ownedBaseline.fleetRenderable.renderableLegs === 1
    && ownedBaseline.fleetRenderable.renderableWeightShare === 1, JSON.stringify(ownedBaseline.fleetRenderable));
  /* im-release-edit-r2 (2026-09-10): gb200 now carries an adopted planning rent, so this fleet
     prices under RENT as well as under TCO. The distinction the assertion exists to draw — UNPRICED
     is not INFEASIBLE — is still asserted, on the half that still carries it: the leg was never
     infeasible, and it is now also not unpriced. */
  assert("R2 replacement: under a RENT basis the same fleet is now priced, and was never infeasible",
    baseline.fleetRenderable.renderableLegs === 1
    && E.feasibility(s).legs.find(l => l.hwKey === "gb200").infeasible !== true
    && E.registryPlanningRentReceipt("gb200", s).unavailable !== true,
    JSON.stringify(baseline.fleetRenderable));
  const feas = E.feasibility(s);
  const leg = feas.legs.find(l => l.hwKey === "gb200");
  assert("R2 replacement: the gb200 leg carries the solved width + receipt (declared-op width 24 at Opus/2.5T fp8 — FA re-mint)",
    leg && leg.widthRendered === 24 && leg.capacityReceipt
    && leg.capacityReceipt.declaredOperatingPointWidth === 24
    && leg.renderableUnderPolicy === true, JSON.stringify(leg && [leg.widthRendered, leg.capacityReceipt && leg.capacityReceipt.declaredOperatingPointWidth]));
  assert("R2 replacement: the fleet DTO no longer carries the retired sensitivity channel",
    !("replicaWidthSensitivity" in baseline.fleetRenderable) && !("workloadAtNShard" in E)
    && !("replicaWidthSensitivityClause" in E));
  const clause = E.policyCapacityClause(baseline.fleetRenderable);
  assert("R2 replacement: the welded policy clause tells the width story on the solved fleet",
    /loaded-bytes planning policy/.test(clause) && /solver output — never an observed deployment/.test(clause), clause.slice(0, 140));
  // The B′1 topology registry SURVIVES as typed evidence annotation on the hw row
  // (provenance, never a live width input — the N_domain/N_role separation is now
  // structural: no live channel accepts a width case at all).
  const topologyCases = D.HW_ROOFLINE.gb200.topologySensitivity.cases;
  assert("R2: the topology-sensitivity registry survives as evidence annotation (per-source split + archived aggregate intact)",
    topologyCases.some(c => c.id === "kimi-k2-fp8-minimum-16")
    && topologyCases.some(c => c.id === "analyst-default-8" && c.superseded === "analyst-transfer-default-8")
    && topologyCases.some(c => c.id === "kimi-k3-domain-64-plus" && c.topologyDimension === "N_domain"));
}

P.summary();
console.log(failures === 0 ? "\nALL TESTS PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
