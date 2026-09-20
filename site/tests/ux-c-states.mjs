/* UX-C U-C0 shared state-drive vocabulary (§18.1 / §18.7 as amended by §18.10-11).
//
   ONE module used by BOTH the fixture mint (research/b9-ux-survey/ux-c-fixture-mint.mjs)
   and the acceptance suite (tests/ux-c-cdp.test.mjs), so a captured state and a replayed
   state are driven by the SAME expression — a divergent copy of a drive is a parity bug
   factory. Every drive goes through the page's REAL controls and handlers (selects,
   sliders, buttons), never a direct store write; the two exceptions are the two
   `force*` drives, which are declared INJECTED states: renderSuppressedHero and the
   infeasible branch are data-dependent (whether the live defaults suppress, and whether
   any reachable control state yields a non-finite margin, are facts about the shipped
   dataset, not the code) — when unreachable through controls they are exercised by a
   declared, replayed-identically monkey-patch so their byte parity is still pinned.
//
   Drives are BUILDERS returning in-page async-IIFE expression strings; the fixture rows
   store {driveKind, params}, so the suite reconstructs the exact expression. */

export const SETTLE_MS = 300; // > the 30ms render debounce, with margin for chart work

const J = (v) => JSON.stringify(v);

export const DRIVES = {
  /* the untouched landing state (startup path already ran applyPreset/loadScenarioFromURL) */
  none: () => `(async () => {})()`,

  /* select a perspective through the real select + applyPreset */
  persp: (perspId) => `(async () => {
    document.getElementById("persp-preset").value = ${J(perspId)};
    applyPreset();
  })()`,

  /* select a model through the real select + applyPreset */
  model: (modelId) => `(async () => {
    document.getElementById("model-preset").value = ${J(modelId)};
    applyPreset();
  })()`,

  /* a model × perspective pair (one applyPreset — it reads both selects).
     TOLERANT of a render-chain throw: on hard-incompatible pairs the tiles branch writes
     its note and returns, but chart renderers LATER in renderAll() can hard-error on
     roofline rows with no declared regime (pre-existing page condition, outside UX-C's
     surfaces — e.g. "row 'rubin' declares no 'batch' regime"). The error is RECORDED
     (window.__uxcDriveError, surfaced by CAPTURE) so nothing is swallowed silently, and
     the capture's own note-text check decides whether the state actually landed. */
  pair: (modelId, perspId) => `(async () => {
    window.__uxcDriveError = null;
    document.getElementById("model-preset").value = ${J(modelId)};
    document.getElementById("persp-preset").value = ${J(perspId)};
    try { applyPreset(); } catch (e) { window.__uxcDriveError = String(e).slice(0, 200); }
  })()`,

  /* incompatible pair, then the real "Compute anyway (exploratory)" button (same
     tolerance, same recording, for the click's own renderAll) */
  pairForced: (modelId, perspId) => `(async () => {
    window.__uxcDriveError = null;
    document.getElementById("model-preset").value = ${J(modelId)};
    document.getElementById("persp-preset").value = ${J(perspId)};
    try { applyPreset(); } catch (e) { window.__uxcDriveError = String(e).slice(0, 200); }
    await new Promise(r => setTimeout(r, 80));
    const btn = [...document.querySelectorAll("#out-margin-note button")]
      .find(b => /Compute anyway/.test(b.textContent));
    if (!btn) throw new Error("no Compute-anyway button in #out-margin-note");
    try { btn.click(); } catch (e) { window.__uxcDriveError = (window.__uxcDriveError || "") + " | click: " + String(e).slice(0, 200); }
  })()`,

  /* named-fleet selection through the real .fleet-select control */
  fleet: (fleetId) => `(async () => {
    const sel = document.querySelector(".fleet-select");
    if (!sel) throw new Error("no .fleet-select control");
    sel.value = ${J(fleetId)};
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  })()`,

  /* a perspective, then ONE deterministic slider edit through the real input handler
     (drives crafted-MODIFIED on clean lenses, MODIFIED_FROM on replays, and
     modified-exploration on routes — the state machine decides, the capture records).
     im-arc T3 FIX-4 (2026-08-24): the slider is addressed by its PARAM KEY, not by a global
     range-input index. T3 assigns every SECTIONS param a tier and renders the basic ones
     before the advanced <details>, so the DOM position that resolved to `active` when this
     fixture was minted now resolves to `total` — a different scenario replayed against a
     capture of the first. The key is the identity the mint actually used: on the pre-T3 tree
     querySelectorAll('input[type="range"]')[0] IS querySelector('[data-param-key="active"]
     input[type="range"]') — the same node (probed in both trees). The Advanced expander is
     deliberately NOT opened: a closed <details> input still accepts .value plus dispatched
     input/change (probed), so the drive stays the mint's drive. `dir` pins the direction so
     the drive replays byte-identically. */
  perspThenNudge: (perspId, paramKey, dir = "min") => `(async () => {
    document.getElementById("persp-preset").value = ${J(perspId)};
    applyPreset();
    await new Promise(r => setTimeout(r, 80));
    const el = document.querySelector('[data-param-key="' + ${J(paramKey)} + '"] input[type="range"]');
    if (!el) throw new Error("no range input for param key " + ${J(paramKey)});
    const min = parseFloat(el.min), max = parseFloat(el.max), v = parseFloat(el.value);
    const target = ${J(dir)} === "min" ? min : max;
    el.value = String(Math.abs(v - target) > 1e-9 ? target : (${J(dir)} === "min" ? max : min));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  })()`,

  /* an exploration route viewed at an explicit model (in scope = the flagship model) */
  explorationAt: (routeId, modelId) => `(async () => {
    document.getElementById("model-preset").value = ${J(modelId)};
    document.getElementById("persp-preset").value = ${J(routeId)};
    applyPreset();
  })()`,

  /* INJECTED: force the suppression predicate, then re-render. Declared, not hidden:
     kind "injected" rides in the fixture row. Replayed byte-identically by the suite.
     The patch stays ACTIVE for the state's whole lifetime (capture + the idempotence
     re-render both see the same branch); the next fresh navigation resets it. */
  forceSuppressed: () => `(async () => {
    appLandingHeroSuppressed = () => true;
    renderAll(); await new Promise(r => setTimeout(r, 80));
  })()`,

  /* INJECTED: force a non-finite margin through the same seam updateTiles reads.
     Patch stays active for the state's lifetime, same rationale as forceSuppressed. */
  forceInfeasible: () => `(async () => {
    const orig = appWorkload;
    appWorkload = (s) => Object.assign(orig(s), { margin: NaN });
    renderAll(); await new Promise(r => setTimeout(r, 80));
  })()`,
};

/* the one capture used everywhere: raw textContent (byte-parity target) + state flags */
export const CAPTURE = `(() => {
  const t = (s) => { const el = document.querySelector(s); return el ? el.textContent : null; };
  return JSON.stringify({
    outMarginNote:       t("#out-margin-note"),
    outMarginUnanchored: t("#out-margin-unanchored"),
    outFeasNote:         t("#out-feas-note"),
    outFeas:             t("#out-feas"),
    outMargin:           t("#out-margin"),
    idEpistemic:         t(".identity-strip .id-epistemic"),
    noteButtons:         [...document.querySelectorAll("#out-margin-note button")].map(b => b.textContent),
    marginPct:           (() => { try { const m = appWorkload(S).margin; return isFinite(m) ? m * 100 : null; } catch { return null; } })(),
    heroSuppressed:      (() => { try { return !!appLandingHeroSuppressed(); } catch { return null; } })(),
    fleetId:             typeof FLEET_ID === "undefined" ? null : FLEET_ID,
    modifiedFrom:        typeof MODIFIED_FROM === "undefined" ? null : MODIFIED_FROM,
    explorationOrigin:   (typeof EXPLORATION_ORIGIN === "undefined" || !EXPLORATION_ORIGIN) ? null : EXPLORATION_ORIGIN.id,
    persp:               document.getElementById("persp-preset")?.value ?? null,
    model:               document.getElementById("model-preset")?.value ?? null,
    driveError:          typeof window.__uxcDriveError === "undefined" ? null : window.__uxcDriveError,
  });
})()`;

/* mint a permalink token exactly the way copyScenarioLink does (site/app.js:1513-1516) */
export const MINT_TOKEN = `(() => encodeScenario(S, document.getElementById("model-preset").value,
  document.getElementById("persp-preset").value, resolvedTraffic(),
  EXPLORATION_ORIGIN ? EXPLORATION_ORIGIN.id : MODIFIED_FROM,
  { fleet: FLEET_ID, totalCase: TOTAL_CASE_ID, interlock: INTERLOCK }))()`;

/* the in-page discovery pass: everything the mint needs to choose concrete params */
export const DISCOVER = `(() => {
  const out = {};
  out.persps = PERSPECTIVES.map(p => ({ id: p.id, kind: p.kind }));
  out.models = MODELS.map(m => ({ id: m.id, scenario: !!m.scenario, diveMetric: m.diveMetric || null, lab: m.lab || null, spec: !!m.spec }));
  out.flagshipModel = (typeof FLAGSHIP_SCOPE !== "undefined" && FLAGSHIP_SCOPE.modelId) || null;
  out.defaultFleet = typeof DEFAULT_FLEET_ID === "undefined" ? null : DEFAULT_FLEET_ID;
  out.namedFleets = Object.keys(FLEETS || {}).filter(id => { try { return isNamedFleetId(id); } catch { return false; } });
  out.landing = { model: document.getElementById("model-preset").value, persp: document.getElementById("persp-preset").value };
  const curM = () => MODELS.find(x => x.id === document.getElementById("model-preset").value);
  /* per-lens margin bucket + per-pair hard severity + per-model lens-span class, measured
     by DRIVING each state (applyPreset), then restoring the landing selection */
  const drive = (mid, pid) => {
    if (mid) document.getElementById("model-preset").value = mid;
    if (pid) document.getElementById("persp-preset").value = pid;
    applyPreset();
  };
  out.kinds = [...new Set(PERSPECTIVES.map(p => p.kind))];
  out.lensBuckets = [];
  for (const p of PERSPECTIVES.filter(p => p.kind === "lens")) {
    try {
      drive(out.landing.model, p.id);
      const sev = pairingSeverity(curM(), p);
      if (sev === "hard") { out.lensBuckets.push({ id: p.id, hard: true }); continue; }
      const m = appWorkload(S).margin;
      out.lensBuckets.push({ id: p.id, pct: isFinite(m) ? m * 100 : null });
    } catch (e) { out.lensBuckets.push({ id: p.id, err: String(e).slice(0, 120) }); }
  }
  /* model-driven comparator buckets too — a model change moves the margin with the base
     ternary intact, so these states are bucket-eligible as well */
  out.modelBuckets = [];
  for (const m of MODELS.filter(m => !m.scenario && m.id !== "custom")) {
    try {
      drive(m.id, out.landing.persp);
      const mg = appWorkload(S).margin;
      out.modelBuckets.push({ id: m.id, pct: isFinite(mg) ? mg * 100 : null });
    } catch (e) { out.modelBuckets.push({ id: m.id, err: String(e).slice(0, 120) }); }
  }
  /* hard pairs are only useful if the pair actually DRIVES (some pairs hard-error inside
     the engine before the tiles' incompatible branch — e.g. a roofline row with no
     declared regime); test-drive each candidate and keep the ones that render the
     INCOMPATIBLE note */
  out.hardPairs = [];
  outer:
  for (const p of PERSPECTIVES) {
    for (const m of MODELS) {
      let sev = null; try { sev = pairingSeverity(m, p); } catch {}
      if (sev !== "hard") continue;
      /* a chart renderer may throw AFTER the tiles branch wrote its note (pre-existing
         roofline condition) — so catch, then judge by the note the tiles actually wrote */
      let err = null;
      try { drive(m.id, p.id); } catch (e) { err = String(e).slice(0, 80); }
      if (/INCOMPATIBLE PAIR/.test(document.getElementById("out-margin-note").textContent))
        out.hardPairs.push({ model: m.id, persp: p.id, chartError: err });
      else out.hardPairsRejected = (out.hardPairsRejected || []).concat({ model: m.id, persp: p.id, err });
      if (out.hardPairs.length >= 2) break outer;
    }
  }
  out.lensSpan = [];
  for (const m of MODELS) {
    try {
      drive(m.id, out.landing.persp);
      const lr = lensRangeForCurrentModel();
      out.lensSpan.push({ id: m.id, cls: !lr ? "none" : lr.single ? "single" : "multi" });
    } catch (e) { out.lensSpan.push({ id: m.id, err: String(e).slice(0, 120) }); }
  }
  out.diveOutputModels = MODELS.filter(m => m.diveMetric === "output").map(m => m.id);
  drive(out.landing.model, out.landing.persp); // restore BEFORE counting sliders (custom fleets swap them out)
  out.rangeInputCount = document.querySelectorAll('input[type="range"]').length;
  return JSON.stringify(out);
})()`;
