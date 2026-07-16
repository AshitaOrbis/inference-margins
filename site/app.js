/* Frontier Inference Margins — UI layer.
   Pure model/data/engine lives in engine.js (loaded first; also node-importable for tests). */
"use strict";

let S = structuredClone(DEFAULTS);
/* Traffic-mix axis selection (v2.1.2). Modes: native | explicit | custom | legacy-custom.
   Replays override any selection (atomic operating points) — resolveTraffic() is the authority. */
let TRAFFIC = { mode: "native", profileId: null };
const currentModel = () => MODELS.find(x => x.id === $("model-preset").value);
const currentPersp = () => PERSPECTIVES.find(x => x.id === $("persp-preset").value);
const currentTrafficSel = () => TRAFFIC.mode === "custom"
  ? { mode: "custom", ioRatio: S.ioRatio, cacheHit: S.cacheHit }
  : (TRAFFIC.mode === "legacy-custom" ? { mode: "legacy-custom", ioRatio: S.ioRatio, cacheHit: S.cacheHit } : TRAFFIC);
const resolvedTraffic = () => {
  const m = currentModel(), pp = currentPersp();
  if (!m) return null;
  // A synthetic "[modified scenario]" / "[modified range exploration]" state has no PERSPECTIVES
  // entry (currentPersp() is undefined). Resolve through a LENS carrier (a lens never locks) so
  // the traffic axis keeps working in a modified state — native / explicit / custom selections
  // all resolve normally and the resolved IDENTITY matches whatever the selector shows — while
  // the state itself stays a free-form edited scenario. Never null when a model exists: returning
  // null here was what let a modified state's margin use traffic nothing on the page displayed.
  const carrier = pp || PERSPECTIVES.find(x => x.id === "median");
  return resolveTraffic(m, carrier, currentTrafficSel());
};
function switchToCustomTraffic() {
  if (TRAFFIC.mode === "custom") return;
  TRAFFIC = { mode: "custom", profileId: null };
  const ts = $("traffic-preset"); if (ts) ts.value = "__custom";
}

/* ---------- UI construction ---------- */
const $ = id => document.getElementById(id);
const controlsEl = $("controls");
let rebuildTimer = null;

function sliderPos(p, v) { // supports log scale
  if (p.log) { const lmin = Math.log(p.min), lmax = Math.log(p.max); return (Math.log(v) - lmin) / (lmax - lmin); }
  return (v - p.min) / (p.max - p.min);
}
function sliderVal(p, t) {
  if (p.log) { const lmin = Math.log(p.min), lmax = Math.log(p.max); return Math.exp(lmin + t * (lmax - lmin)); }
  return p.min + t * (p.max - p.min);
}

/* Adjustment sections start COLLAPSED (layout restructure 2026-07-11) — the user expands what
   they want to edit. Expansion state is keyed by section title so it survives the rebuilds
   that radio/select changes trigger (buildControls wipes #controls). */
const SECTION_OPEN = Object.create(null);
/* Injected pickers (selector dissolve, 2026-07-12): the Model selector + model dossier/context live
   at the top of the "Model architecture" section; the Traffic-mix selector at the top of "Traffic
   mix (I/O + cache)". They are PARKED in #picker-holder between builds; buildControls rescues them
   there before wiping #controls, then re-injects. #persp-preset stays in the holder (hidden). */
const SECTION_INJECT = {
  "Model architecture": ["model-picker-group", "model-dossier-card", "model-context"],
  "Traffic mix (I/O + cache)": ["traffic-picker-group"],
};
function buildControls() {
  // Rescue the injected pickers back to the hidden holder BEFORE the wipe (they currently live in
  // section bodies), so textContent="" can't destroy them.
  const holder = $("picker-holder");
  if (holder) Object.values(SECTION_INJECT).flat().forEach(id => { const el = $(id); if (el) holder.appendChild(el); });
  controlsEl.textContent = "";
  SECTIONS.forEach(sec => {
    if (sec.showIf && !sec.showIf(S)) return;
    const det = document.createElement("details");
    det.className = "ctl-section"; det.open = !!SECTION_OPEN[sec.title];
    det.addEventListener("toggle", () => { SECTION_OPEN[sec.title] = det.open; });
    const sum = document.createElement("summary");
    // "Model architecture" carries the selected model's name (short label for Custom). Regenerated
    // on every rebuild, so a model switch (which rebuilds controls) updates it automatically.
    if (sec.title === "Model architecture") {
      const cm = currentModel();
      sum.textContent = sec.title + (cm ? " — " + (cm.id === "custom" ? "Custom" : cm.name) : "");
    } else sum.textContent = sec.title;
    det.appendChild(sum);
    const body = document.createElement("div"); body.className = "ctl-body";
    (SECTION_INJECT[sec.title] || []).forEach(id => { const el = $(id); if (el) body.appendChild(el); });
    sec.params.forEach(p => { if (!p.showIf || p.showIf(S)) body.appendChild(buildParam(p)); });
    det.appendChild(body);
    controlsEl.appendChild(det);
  });
}

function infoBtn(tipKey) {
  const b = document.createElement("button");
  b.className = "info"; b.textContent = "ⓘ"; b.type = "button";
  b.dataset.tip = tipKey; b.setAttribute("aria-label", "Explanation");
  return b;
}

function buildParam(p) {
  const wrap = document.createElement("div"); wrap.className = "param";
  if (p.type === "blend") return buildBlend(wrap, p);
  const head = document.createElement("div"); head.className = "param-head";
  const name = document.createElement("span"); name.className = "param-name";
  name.append(p.label, infoBtn(p.tip));
  const val = document.createElement("span"); val.className = "param-val";
  head.append(name, val); wrap.appendChild(head);

  if (p.type === "select") {
    const sel = document.createElement("select");
    p.options.forEach(([v, l]) => { const o = document.createElement("option"); o.value = v; o.textContent = l; sel.appendChild(o); });
    sel.value = S[p.k];
    sel.oninput = () => { S[p.k] = sel.value; if (noteUserEdit()) return; onChange(); };
    wrap.appendChild(sel); val.remove();
    return wrap;
  }
  if (p.type === "radio") {
    const row = document.createElement("div"); row.className = "radio-row";
    p.options.forEach(([v, l]) => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = l;
      b.setAttribute("aria-pressed", String(S[p.k] === v));
      b.onclick = () => { S[p.k] = v; if (noteUserEdit()) return; onChange(true); };
      row.appendChild(b);
    });
    wrap.appendChild(row); val.remove();
    return wrap;
  }

  const input = document.createElement("input");
  input.type = "range"; input.min = 0; input.max = 1000; input.step = 1;
  const effVal = () => S[p.k] ?? (p.nullable !== undefined ? S.cacheHit : p.min); // nullable sliders track their source until pinned
  input.value = Math.round(sliderPos(p, effVal()) * 1000);
  const show = () => {
    const v = effVal();
    const dp = p.step >= 1 ? 0 : p.step >= 0.05 ? 2 : 3;
    val.textContent = (p.unit === "$/Mtok" ? "$" : "") + Number(v).toFixed(dp).replace(/\.0+$/, m => p.step >= 1 ? "" : m) + (p.unit && p.unit !== "$/Mtok" ? " " + p.unit : "")
      + (p.nullable !== undefined && S[p.k] === null ? " (" + p.nullable + ")" : "");
  };
  const isTrafficKey = p.k === "ioRatio" || p.k === "cacheHit";
  const tr = isTrafficKey ? resolvedTraffic() : null;
  const locked = !!(tr && tr.locked);
  input.oninput = () => {
    if (locked) { input.value = Math.round(sliderPos(p, S[p.k]) * 1000); return; }
    let v = sliderVal(p, input.value / 1000);
    v = Math.round(v / p.step) * p.step;
    S[p.k] = Math.min(p.max, Math.max(p.min, v));
    if (isTrafficKey) switchToCustomTraffic();
    if (noteUserEdit()) { show(); return; }
    if (isTrafficKey) { show(); refreshTrafficDisplay(); return; } // a traffic edit on ANY kind (lens OR synthetic modified state) must resync the dossier line + note label with resolveTraffic()/S (M4 round-4 centralization)
    show(); onChange();
  };
  show();
  if (locked) {
    input.disabled = true; wrap.classList.add("locked");
    const lockNote = document.createElement("div"); lockNote.className = "lock-note";
    lockNote.textContent = "🔒 locked by the selected replay — its traffic mix is part of the published operating point. Adjust any other assumption (or reload for the central scenario) to switch to a freely-adjustable state.";
    wrap.appendChild(input); wrap.appendChild(lockNote);
  } else wrap.appendChild(input);
  if (p.ticks) {
    const ticks = document.createElement("div"); ticks.className = "ticks";
    p.ticks.forEach(tk => {
      const b = document.createElement("button"); b.className = "tick" + (tk.alt ? " tk-alt" : ""); b.type = "button";
      const pos = sliderPos(p, tk.v) * 100;
      b.style.left = pos.toFixed(1) + "%";
      if (pos > 88) b.style.transform = "translateX(-88%)";
      else if (pos < 10) b.style.transform = "translateX(-12%)";
      const i = document.createElement("i"); const sp = document.createElement("span");
      sp.textContent = tk.l; b.append(i, sp);
      b.title = tk.l + " = " + tk.v + (p.unit || "");
      b.onclick = () => { if (locked) return; S[p.k] = tk.v; input.value = Math.round(sliderPos(p, tk.v) * 1000); if (isTrafficKey) switchToCustomTraffic(); if (noteUserEdit()) { show(); return; } if (isTrafficKey) { show(); refreshTrafficDisplay(); return; } show(); onChange(); };
      ticks.appendChild(b);
    });
    wrap.appendChild(ticks);
  }
  return wrap;
}

function buildBlend(wrap, p) {
  const head = document.createElement("div"); head.className = "param-head";
  const name = document.createElement("span"); name.className = "param-name";
  name.append("Traffic share by accelerator", infoBtn(p.tip));
  head.appendChild(name); wrap.appendChild(head);
  HW_ORDER.forEach(k => {
    const hw = HW[k];
    const row = document.createElement("div"); row.className = "hw-row";
    const nm = document.createElement("span"); nm.className = "hw-name";
    nm.append(hw.name, infoBtn("hw-" + k));
    TIPS["hw-" + k] = { t: hw.name, b: hw.note, s: `FP8 dense ${hw.flopsFp8} PF · ${hw.hbm} GB HBM @ ${hw.bw} TB/s · ${Math.round(hw.tdp * 1000)} W · default ${fmt$(hw.rent)}/hr` };
    const input = document.createElement("input");
    input.type = "range"; input.min = 0; input.max = 100; input.step = 5;
    input.value = S.blend[k] || 0;
    const pct = document.createElement("span"); pct.className = "hw-pct";
    const w = blendWeights(S);
    pct.textContent = w[k] ? Math.round(w[k] * 100) + "%" : "—";
    input.oninput = () => {
      S.blend[k] = Number(input.value);
      const w2 = blendWeights(S);
      row.parentElement.querySelectorAll(".hw-row").forEach((r, i) => {
        const key = HW_ORDER[i];
        r.querySelector(".hw-pct").textContent = w2[key] ? Math.round(w2[key] * 100) + "%" : "—";
      });
      if (noteUserEdit()) return;
      onChange();
    };
    row.append(nm, input, pct);
    wrap.appendChild(row);
  });
  const meta = document.createElement("div"); meta.className = "hw-meta";
  meta.textContent = "Shares are relative weights (normalized). Hover ⓘ for specs, anchors and default $/hr.";
  wrap.appendChild(meta);
  return wrap;
}

/* ---------- presets UI ---------- */
function fillPresetSelects() {
  const ms = $("model-preset");
  ms.textContent = "";
  MODELS.forEach(m => { const o = document.createElement("option"); o.value = m.id; o.textContent = m.name + (m.spec ? " *" : ""); ms.appendChild(o); });
  const ps = $("persp-preset");
  ps.textContent = "";
  PERSPECTIVES.forEach(m => { const o = document.createElement("option"); o.value = m.id; o.textContent = m.name; ps.appendChild(o); });
  ms.value = "opus"; ps.value = "median";
  buildTrafficSelect();
  // Switching the MODEL re-collapses its assumptions panel (owner directive: "keeps it collapsed"),
  // then applyPreset refills it with the new model's content. Perspective/traffic changes leave it.
  ms.oninput = () => { const c = $("model-dossier-card"); if (c) c.open = false; applyPreset(); };
  ps.oninput = () => applyPreset();
  renderSavedList();
  { // Saved-scenarios dropdown (under the front-door cards): re-read the store on open, so
    // changes made in another tab of this browser show up without a reload.
    const dd = $("saved-scenarios");
    if (dd) dd.addEventListener("toggle", () => { if (dd.open) renderSavedList(); });
  }
  { // Scenario-name field: auto-generated default; user edits stick (cleared field resumes auto).
    const inp = $("scenario-name");
    if (inp) inp.oninput = () => { NAME_DIRTY = inp.value.trim() !== ""; };
  }
  $("save-preset").onclick = () => {
    const inp = $("scenario-name");
    const name = ((inp && inp.value.trim()) || autoScenarioName()).slice(0, 80);
    // Presets carry a TYPED ORIGIN (__persp) alongside the numeric state (identity-integrity):
    // a modified-exploration state stores its origin ROUTE id so the breadcrumb + restore
    // survive the round-trip; otherwise the selector value (a real id, or "__modified").
    const store = loadStore(); store[name] = Object.assign(structuredClone(S), {
      __traffic: structuredClone(TRAFFIC),
      __persp: EXPLORATION_ORIGIN ? EXPLORATION_ORIGIN.id : $("persp-preset").value,
    });
    localStorage.setItem("im_presets_v1", JSON.stringify(store));
    NAME_DIRTY = false; refreshScenarioName();
    renderSavedList();
    const msg = "Saved “" + name + "” (stored in this browser) — listed under “Saved scenarios” in the range explorer above.";
    $("preset-note").textContent = msg; setSaveNote(msg);
  };
}
/* ---------- saved scenarios (im_presets_v1) ----------
   Load / rename / delete live in the "Saved scenarios" dropdown under the front-door cards;
   saving lives at the bottom of the adjustment column. Same store, same fail-closed load
   semantics as the retired top-bar #custom-preset select. */
function setSaveNote(msg) { const sn = $("save-note"); if (sn) sn.textContent = msg; }
let NAME_DIRTY = false; // the user typed a name — stop auto-refreshing it until saved/cleared
function autoScenarioName() {
  const m = currentModel(), tr = resolvedTraffic();
  let h = 5381; const s = JSON.stringify(S);
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return (m ? m.name : "Scenario") + (tr ? " · " + tr.ioRatio + ":1/" + tr.cacheHit : "") + " · " + h.toString(36).slice(-4);
}
function refreshScenarioName() {
  const inp = $("scenario-name");
  if (!inp || NAME_DIRTY || document.activeElement === inp) return;
  inp.value = autoScenarioName();
}
function loadSavedPreset(name) {
  const store = loadStore();
  if (!store[name]) return;
  const saved = structuredClone(store[name]); delete saved.__traffic;
  const savedPersp = saved.__persp; delete saved.__persp;
  S = Object.assign(structuredClone(DEFAULTS), saved);
  /* FAIL-CLOSED saved-preset identity (typed-origin fix): a saved preset is a NUMERIC state —
     it must never render under whatever lens happens to be selected at load time, and never
     as a clean replay/route. Every load lands in an explicit MODIFIED state. The stored
     __persp is a typed ORIGIN breadcrumb only (migrated through the same retired-id map as
     permalinks, P0-6): a route origin restores as [modified range exploration] with one-click
     restore; a replay origin as [modified scenario] derived-from; anything else — lens ids,
     "__modified", and legacy numeric-only stores — as a neutral [modified scenario]. The
     downgrade sets TRAFFIC = Custom, frozen at the saved numbers already in S, so the
     selector, the resolved traffic and the computed margin all use the same values. */
  let presetMigrNote = "";
  const pid = typeof savedPersp === "string" ? normalizePerspId(savedPersp) : null;
  if (pid && pid !== savedPersp) presetMigrNote = " Migrated from a retired preset; numbers unchanged.";
  const sp = pid ? PERSPECTIVES.find(x => x.id === pid) : null;
  if (sp && sp.kind === "exploration") downgradeExplorationToModified(sp);
  else if (sp && sp.kind === "replay") downgradeReplayToModified(sp.name);
  else downgradeReplayToModified("saved scenario “" + name + "”");
  fullRefresh();
  $("preset-note").textContent = "Loaded saved scenario “" + name + "” as a MODIFIED "
    + (sp && sp.kind === "exploration" ? "range exploration (derived from the “" + (sp.subtitle || sp.name) + "” route)" : "scenario")
    + " — saved numeric state at " + S.ioRatio + ":1 / " + S.cacheHit + "% traffic (Custom); it never inherits the currently-selected lens." + presetMigrNote;
}
function deleteSavedPreset(name) {
  const store = loadStore(); delete store[name];
  localStorage.setItem("im_presets_v1", JSON.stringify(store));
  renderSavedList();
  $("preset-note").textContent = "Deleted “" + name + "”.";
}
function renameSavedPreset(oldName, newName) {
  const store = loadStore();
  if (!store[oldName] || !newName || newName === oldName) return false;
  if (store[newName]) {
    $("preset-note").textContent = "Rename failed: a saved scenario named “" + newName + "” already exists.";
    return false;
  }
  store[newName] = store[oldName]; delete store[oldName];
  localStorage.setItem("im_presets_v1", JSON.stringify(store));
  $("preset-note").textContent = "Renamed “" + oldName + "” to “" + newName + "”.";
  return true;
}
function beginRename(row, oldName) {
  row.textContent = "";
  const inp = document.createElement("input");
  inp.type = "text"; inp.className = "saved-rename"; inp.value = oldName; inp.maxLength = 80;
  inp.title = "Enter to save, Esc to cancel";
  let done = false;
  const finish = commit => {
    if (done) return; done = true;
    if (commit) renameSavedPreset(oldName, inp.value.trim());
    renderSavedList();
  };
  inp.onkeydown = e => {
    if (e.key === "Enter") { e.preventDefault(); finish(true); }
    else if (e.key === "Escape") { e.preventDefault(); finish(false); }
  };
  inp.onblur = () => finish(true);
  row.append(inp);
  inp.focus(); inp.select();
}
function renderSavedList() {
  const list = $("saved-list"); if (!list) return;
  list.textContent = "";
  const names = Object.keys(loadStore());
  if (!names.length) {
    list.append(mkEl("p", "saved-empty", "No saved scenarios yet — adjust the assumptions below, then use “Save scenario” after the Pricing & discounts section."));
    return;
  }
  names.forEach(n => {
    const row = mkEl("div", "saved-row");
    const load = mkEl("button", "saved-load", n);
    load.type = "button";
    load.title = "Load “" + n + "” — as a modified state; it never inherits the currently-selected lens";
    load.onclick = () => loadSavedPreset(n);
    const ren = mkEl("button", "saved-act", "rename");
    ren.type = "button"; ren.title = "Rename this saved scenario";
    ren.onclick = () => beginRename(row, n);
    const del = mkEl("button", "saved-act saved-del", "delete");
    del.type = "button"; del.title = "Delete this saved scenario";
    del.onclick = () => deleteSavedPreset(n);
    row.append(load, ren, del);
    list.append(row);
  });
}
function buildTrafficSelect() {
  const ts = $("traffic-preset"); if (!ts) return;
  ts.textContent = "";
  const opt = (v, l) => { const o = document.createElement("option"); o.value = v; o.textContent = l; ts.appendChild(o); return o; };
  opt("__native", "Model default");
  TRAFFIC_PROFILES.forEach(t => opt(t.id, t.name));
  opt("__custom", "Custom (set the sliders)");
  ts.value = "__native";
  ts.oninput = () => {
    const v = ts.value;
    TRAFFIC = v === "__native" ? { mode: "native", profileId: null }
            : v === "__custom" ? { mode: "custom", profileId: null }
            : { mode: "explicit", profileId: v };
    applyPreset(true);
  };
}
function refreshTrafficSelect() {
  const ts = $("traffic-preset"); if (!ts) return;
  const tr = resolvedTraffic(); if (!tr) return;
  // Never a visually-static selector silently changing values: the Model-default option always
  // names the profile it resolved to; replay locks are shown on the control itself.
  const nat = ts.querySelector('option[value="__native"]');
  const m = currentModel();
  const natProf = TRAFFIC_PROFILES.find(t => t.id === (m && m.nativeTraffic));
  if (nat) nat.textContent = "Model default — " + (natProf ? natProf.name : "Reference 15:1 / 60%");
  // Locked state gets its own visible option so the control never displays a stale label.
  let lockOpt = ts.querySelector('option[value="__locked"]');
  if (tr.locked) {
    if (!lockOpt) { lockOpt = document.createElement("option"); lockOpt.value = "__locked"; ts.appendChild(lockOpt); }
    lockOpt.textContent = "Locked by replay — " + tr.ioRatio + ":1 / " + tr.cacheHit + "%";
    ts.value = "__locked";
  } else if (lockOpt) lockOpt.remove();
  ts.disabled = !!tr.locked;
  ts.title = tr.locked ? "Traffic is locked by the selected replay (atomic operating point)." :
    (tr.mode === "native" ? (natProf ? natProf.provenance : "") :
     tr.profileId ? (TRAFFIC_PROFILES.find(t => t.id === tr.profileId) || {}).provenance || "" : "Custom values from the sliders.");
  if (tr.locked) { /* value set to __locked above */ }
  else if (tr.mode === "legacy-custom") { ts.value = "__custom"; }
  else ts.value = TRAFFIC.mode === "native" ? "__native" : TRAFFIC.mode === "custom" ? "__custom" : TRAFFIC.profileId;
}
function loadStore() { try { return JSON.parse(localStorage.getItem("im_presets_v1")) || {}; } catch { return {}; } }
function applyPreset(keepTraffic) {
  const m = currentModel(), p = currentPersp();
  if (!keepTraffic && TRAFFIC.mode === "legacy-custom") TRAFFIC = { mode: "native", profileId: null };
  if (!m) return;
  // Synthetic "[modified …]" state (no PERSPECTIVES entry): there is no preset to apply, but a
  // traffic OR model change made while modified must still keep the invariant — re-resolve traffic
  // from the new selection + model, write it to S, and refresh the label/dossier/note (Residual 2:
  // previously this early-returned, so a traffic/model change updated only the selector, leaving
  // resolveTraffic()/S/the "all agree" note stale and contradictory).
  if (!p) { refreshModifiedState(); return; }
  S = applyPresetSettings(m, p, currentTrafficSel());
  FORCE_EXPLORATORY = false;
  MODIFIED_FROM = null;
  EXPLORATION_ORIGIN = null;
  { const o = $("persp-preset").querySelector('option[value="__modified"]'); if (o && $("persp-preset").value !== "__modified") o.remove(); }
  { const o = $("persp-preset").querySelector('option[value="__modified-exploration"]'); if (o && $("persp-preset").value !== "__modified-exploration") o.remove(); }
  const tr = resolveTraffic(m, p, currentTrafficSel());
  const diveFallback = p.id === "dive" && !m.dive ? " (no §10 card for this model — using this page's central scenario instead)" : "";
  const warn = pairingWarning(m, p);
  const boundary = p.kind === "analyst" ? "PAGE-AUTHORED RECONSTRUCTION — the named source supplied only the quoted claim(s); every parameter this preset sets is this page's translation (expand for the per-parameter ledger). "
    : p.kind === "exploration" ? "RANGE EXPLORATION — page-authored counterfactual; not an estimate: a page-authored reconstruction of one route to a claimed range, not any claimant's model; every parameter it sets is this page's choice (expand for the per-parameter ledger). " : "";
  if (p.kind === "exploration") {
    // D3 (structural separation): the model note (m.note) carries claimant NAMES as size sources
    // (e.g. Musk, TeorTaxes on Opus). While a route is loaded, that provenance never renders in
    // the route's note or dossier — it lives in the structurally separate, separately-collapsed
    // MODEL-SIZING CONTEXT panel (setModelContextPanel via renderDossier), so its names can never
    // read as the route's basis or as claimants endorsing the route.
    const off = explorationOffScope(m, tr);
    $("preset-note").textContent = boundary
      + (off ? "VIEWED OFF AUTHORED SCOPE (" + m.name + " · " + tr.ioRatio + ":1/" + tr.cacheHit + "%; authored at Claude Opus 4.x @ Reference 15:1/60%) — numbers recompute live; range membership is no longer guaranteed. " : "")
      + (warn ? "⚠ pairing note: " + warn + " — " : "")
      + (m.spec ? "⚠ speculative model sizes (see the model-sizing context panel) — " : "")
      + "Route (page-authored): " + p.note + diveFallback + " · Traffic mix: " + tr.label + "."
      + " Model-sizing provenance for " + m.name + " sits in the separate collapsed MODEL-SIZING CONTEXT panel below — it is not part of this route; any names there are cited only as size/price sources, not as claimants and not as endorsing the route.";
  } else {
    // The MODEL note (m.note — sizing/assumptions prose) lives with the Model selector (renderModelDossier),
    // NOT in this top perspective note: it carries only perspective/route + pairing/boundary + traffic.
    $("preset-note").textContent = boundary + (warn ? "⚠ pairing note: " + warn + " — " : "")
      + p.note + diveFallback + " · Traffic mix: " + tr.label + ".";
  }
  renderDossier(m, p);
  fullRefresh();
}

/* ---------- permalinkable scenarios (codec lives in engine.js since v2.1.2) ---------- */
function copyScenarioLink() {
  // A synthetic "[modified …]" state serializes as a MODIFIED identity (engine encodeScenario):
  // the origin breadcrumb rides along so the reloaded link restores the same counterfactual
  // warning — copy-after-mutation must never mint a link that reloads under a clean identity.
  const url = location.origin + location.pathname + "?s=" + encodeURIComponent(
    encodeScenario(S, $("model-preset").value, $("persp-preset").value, resolvedTraffic(),
      EXPLORATION_ORIGIN ? EXPLORATION_ORIGIN.id : MODIFIED_FROM));
  history.replaceState(null, "", url);
  (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(
    () => { const msg = "Scenario link copied. It freezes the full numeric state plus schema, engine revision and data-as-of date - and it CONTAINS any private rates or discounts you typed in; review before sharing."; $("preset-note").textContent = msg; setSaveNote(msg); },
    () => { const msg = "Scenario URL set in the address bar (clipboard unavailable)."; $("preset-note").textContent = msg; setSaveNote(msg); }
  );
}
function loadScenarioFromURL() {
  const diff = decodeScenario(new URLSearchParams(location.search).get("s"));
  if (!diff) return false; // unknown/stale schema or an internally-contradictory v4 identity — the link is disregarded whole; the default state renders
  const meta = diff._meta || {}; delete diff._meta;
  /* MODIFIED-identity links (copy-after-mutation fix): a link minted from a synthetic
     "[modified …]" state carries persp:null plus a decode-validated _meta.modified block. It
     restores as the SAME modified counterfactual state — warning, breadcrumb and Custom traffic
     intact — never as a clean lens/replay/route identity. */
  if (meta.modified) {
    const mm0 = MODELS.find(x => x.id === meta.model);
    if (!mm0 || !meta.traffic) return false; // decode already guarantees both for v4; belt-and-braces
    $("model-preset").value = mm0.id;
    const sane = sanitizeScenarioDiff(diff, null); // a modified state carries no replay lock
    S = Object.assign(structuredClone(DEFAULTS), structuredClone(sane.diff));
    // Declared traffic identity IS the working values (state-consistency invariant): a modified
    // state's traffic is Custom, frozen at the encoded numbers — displayed == resolved == computed.
    TRAFFIC = { mode: "custom", profileId: null };
    S.ioRatio = meta.traffic.ioRatio; S.cacheHit = meta.traffic.cacheHit;
    if (meta.modified.kind === "exploration")
      downgradeExplorationToModified(PERSPECTIVES.find(x => x.id === normalizePerspId(meta.modified.from)));
    else
      downgradeReplayToModified(typeof meta.modified.from === "string" && meta.modified.from ? meta.modified.from : "a shared scenario");
    const rej = sane.rejected.length ? " ⚠ " + sane.rejected.length + " link field(s) failed schema or replay-integrity validation and were ignored (" + sane.rejected.join("; ") + ")." : "";
    const drift = meta.engine && meta.engine !== ENGINE_REVISION ? " ⚠ Link was minted on engine " + meta.engine + "; this page runs " + ENGINE_REVISION + " — defaults may have shifted." : "";
    $("preset-note").textContent = "Loaded a shared scenario (" + (meta.dataAsOf || "undated") + ") — " + identitySummary() + " — in its saved MODIFIED state; "
      + (meta.modified.kind === "exploration"
        ? "a MODIFIED RANGE EXPLORATION derived from a page-authored route but since edited; the route identity and its ranking metadata do not apply to these numbers."
        : "a MODIFIED SCENARIO; no clean lens/replay identity applies to these numbers.")
      + rej + drift + " Use “Return to central scenario” to reset.";
    return true;
  }
  // Retired-preset migration (P0-6): normalize the perspective id BEFORE the PERSPECTIVES.find()
  // lookup, so links minted with a retired analyst-reconstruction id resolve to the
  // numeric-identical successor route — the loaded numbers cannot move. The note below names
  // NO person and does not echo the retired id (P0-4).
  const perspId = normalizePerspId(meta.persp);
  const retiredNote = (meta.persp && perspId !== meta.persp)
    ? " Migrated from a retired preset; numbers unchanged (the parameter vector was always page-authored and is now labeled as such)."
    : "";
  // Restore preset identity FIRST so selectors, dossier, pairing warnings and the lens range
  // all describe the same scenario the numbers describe (identity-corruption fix, v2.1.1).
  const m = MODELS.find(x => x.id === meta.model), p = PERSPECTIVES.find(x => x.id === perspId);
  /* FAIL-CLOSED IDENTITY GATE (unknown-identity fix; covers v3/v2 tokens whose looser metadata
     the pure decoder cannot police without breaking shipped links): if the declared model OR
     perspective does not resolve to a real entry, the link is refused WHOLE before any state
     mutation — the default state renders with no "Loaded" note. The numeric diff is NEVER
     applied under a substituted default identity. */
  if (!m || !p) return false;
  let migrated = "";
  if (m && p) {
    $("model-preset").value = m.id; $("persp-preset").value = p.id;
    if ((meta.schema === "v4" || meta.schema === "v3") && meta.traffic) {
      // v3/v4: traffic identity travels in the link (v4 additionally carries the redundant
      // exploration identity, already cross-checked by decodeScenario).
      TRAFFIC = meta.traffic.mode === "explicit" ? { mode: "explicit", profileId: meta.traffic.profileId }
              : meta.traffic.mode === "native" ? { mode: "native", profileId: null }
              : { mode: meta.traffic.mode === "replay-locked" ? "native" : "custom", profileId: null };
      S = applyPresetSettings(m, p, meta.traffic.mode === "custom" || meta.traffic.mode === "legacy-custom"
        ? { mode: "custom", ioRatio: meta.traffic.ioRatio, cacheHit: meta.traffic.cacheHit } : TRAFFIC);
    } else {
      // v2 migration: reproduce the OLD effective traffic so the link's numbers survive
      // (pair-specific; default-equality ambiguity is irrecoverable and documented — legacy-custom).
      const mig = migrateV2Traffic(m, p, diff);
      TRAFFIC = mig.mode === "explicit" ? { mode: "explicit", profileId: mig.profileId } : { mode: "legacy-custom", profileId: null };
      S = applyPresetSettings(m, p, mig.mode === "explicit" ? TRAFFIC : mig);
      migrated = mig.migratedToProfile
        ? " Migrated from a v2 link: the saved traffic (" + mig.ioRatio + ":1 / " + mig.cacheHit + "%) matches the named profile it came from and keeps that identity."
        : " Migrated from a v2 link: traffic reproduced under v2 semantics (" + mig.ioRatio + ":1 / " + mig.cacheHit + "% — legacy-custom).";
    }
    renderDossier(m, p);
  }
  const tr0 = resolvedTraffic();
  const sane = sanitizeScenarioDiff(diff, tr0);
  const mm = currentModel(), pp = currentPersp();
  const diverges = mm && pp && overlayDivergesFromReplay(mm, pp, sane.diff);
  // P0-5 (URL overlay path): an overlay that moves any non-traffic field off the named
  // exploration route is a divergent edit — exit config identity, keep breadcrumb + restore.
  // (Traffic keys are excluded: the traffic-mix axis travels as identity in _meta.traffic and
  // composes with the route like it does with a lens; drift is displayed, not disguised.)
  const expDiverges = mm && pp && pp.kind === "exploration" && Object.keys(sane.diff).some(k =>
    k !== "subPlan" && k !== "subUsage" && k !== "ioRatio" && k !== "cacheHit" &&
    JSON.stringify(sane.diff[k]) !== JSON.stringify(S[k]));
  Object.assign(S, structuredClone(sane.diff));
  if (tr0 && tr0.locked && !diverges) { S.ioRatio = tr0.ioRatio; S.cacheHit = tr0.cacheHit; } // replay integrity: locked traffic always wins over link overlays
  if (diverges) downgradeReplayToModified(pp.name); // a link that changes a replay's pinned fields is NOT that replay — attribution removed
  if (expDiverges) downgradeExplorationToModified(pp); // a link that changes a route's numbers is NOT that route — vN identity + ranking metadata removed
  /* TRAFFIC STATE-CONSISTENCY INVARIANT (M4, plan P0-B): the traffic identity the selector
     DISPLAYS, the values resolveTraffic() RESOLVES, and the ioRatio/cacheHit the margin
     computation READS from S must ALWAYS be the same numbers. A traffic value that arrived in
     the link's numeric diff and disagrees with the link's DECLARED traffic identity therefore
     flows through the traffic AXIS as an explicit Custom selection — it is never left in S
     behind a still-displayed named profile. Under a live exploration route the same conflict
     also contradicts the route's declared load state, so the scenario additionally exits to
     the existing [modified range exploration] state instead of rendering mismatched. (Locked
     replays are already safe: the sanitizer rejected the keys and the lock re-asserted above.) */
  // Reconcile against the link's DECLARED traffic identity (tr0 — resolved BEFORE the overlay
  // mutated S). A post-mutation resolvedTraffic() read of a CUSTOM-declared link would echo the
  // already-overlaid values and falsely report "consistent" (GAP 1), leaving the pre-overlay
  // label stale. tr0 is the identity the loader restored and displayed.
  let trafficNote = "";
  {
    const recon = reconcileLinkTraffic(tr0, sane.diff);
    if (recon.action === "custom") {
      S.ioRatio = recon.ioRatio; S.cacheHit = recon.cacheHit;
      TRAFFIC = { mode: "custom", profileId: null };
      const ts = $("traffic-preset"); if (ts) ts.value = "__custom";
      trafficNote = " ⚠ The link's traffic values (" + recon.ioRatio + ":1 / " + recon.cacheHit + "%) differ from the traffic identity it declared (" + (tr0 ? tr0.ioRatio + ":1 / " + tr0.cacheHit + "%" : "none") + ") — applied as an explicit Custom selection so the selector, the resolved traffic and the computed margin all use the same numbers.";
      // A conflicting overlay under a live route also contradicts its declared load state → exit.
      if (pp && pp.kind === "exploration" && !expDiverges) { downgradeExplorationToModified(pp); trafficNote += " The route identity was exited (modified range exploration)."; }
    }
  }
  /* STATE-CONSISTENCY ENFORCEMENT (GAP 1 + GAP 2): re-render the displayed traffic identity from
     the FINAL state so the dossier traffic line and the selector ALWAYS equal resolveTraffic()
     and the numbers workload(S) uses. Covers (a) custom-declared links whose label was rendered
     before the overlay, and (b) synthetic modified states (no perspective — resolvedTraffic()
     now resolves S as custom, and the downgrade already appended a matching traffic line). */
  {
    const cpNow = currentPersp();
    if (m && cpNow) renderDossier(m, cpNow); // real perspective: full re-render (traffic line + selector) from final S/TRAFFIC
    else refreshTrafficSelect();             // modified state: traffic line already appended by the downgrade; sync the selector
  }
  const rej = sane.rejected.length ? " ⚠ " + sane.rejected.length + " link field(s) failed schema or replay-integrity validation and were ignored (" + sane.rejected.join("; ") + ")." : "";
  const drift = meta.engine && meta.engine !== ENGINE_REVISION ? " ⚠ Link was minted on engine " + meta.engine + "; this page runs " + ENGINE_REVISION + " — defaults may have shifted." : "";
  const expNote = expDiverges ? " ⚠ The link's numbers diverge from the page-authored route it names — loaded as a MODIFIED RANGE EXPLORATION (route identity and ranking metadata removed; restore from the headline tile)." : "";
  // Preserve lens/state identity in the summary (public-release P0: never collapse to a bare "Loaded a
  // shared scenario"). identitySummary() reads the just-restored state → model · traffic · lens · state.
  $("preset-note").textContent = "Loaded a shared scenario (" + (meta.dataAsOf || "undated") + ") — " + identitySummary() + "." + retiredNote + migrated + trafficNote + rej + drift + expNote + " Use “Return to central scenario” to reset.";
  return true;
}

let FORCE_EXPLORATORY = false;
/* Real atomic-replay semantics (final-gate P0): the FIRST divergent edit — from sliders, ticks,
   radios, blend inputs OR permalink overlays — EXITS replay identity entirely. The perspective
   selector flips to a synthetic "[modified scenario]" entry, replay attribution is removed from
   the note/dossier, and traffic unlocks as Custom. A warning is not an exit; this is the exit. */
let MODIFIED_FROM = null;
/* Modified states replace the dossier body with a plain message and have no perspective, so the
   normal renderDossier() traffic line never runs. This appends the SAME effective-traffic line
   from the (now non-null) resolvedTraffic(), so a modified scenario still visibly displays the
   exact ioRatio/cacheHit its margin uses — displayed == resolved == computed, no exception. */
function appendEffectiveTrafficLine(body) {
  if (!body) return;
  const tr = resolvedTraffic(); if (!tr) return;
  const t = document.createElement("p"); t.className = "dossier-traffic";
  t.textContent = "Effective traffic mix: " + tr.ioRatio + ":1 / " + tr.cacheHit + "% — " + tr.label
    + ". These are the exact numbers the margin uses.";
  body.append(t);
  refreshTrafficSelect(); // keep the selector in sync with the same resolved numbers
}
function downgradeReplayToModified(pName) {
  MODIFIED_FROM = pName;
  EXPLORATION_ORIGIN = null; // the two modified identities are exclusive — never both prefixes/breadcrumbs at once
  const ps = $("persp-preset");
  let o = ps.querySelector('option[value="__modified"]');
  if (!o) { o = document.createElement("option"); o.value = "__modified"; ps.appendChild(o); }
  o.textContent = "[modified scenario] derived from " + pName + " — no longer the published operating point";
  ps.value = "__modified";
  TRAFFIC = { mode: "custom", profileId: null };
  const ts = $("traffic-preset"); if (ts) { ts.disabled = false; ts.value = "__custom"; }
  $("preset-note").textContent = "MODIFIED SCENARIO — derived from " + pName + " but no longer its published operating point; replay attribution removed. Pick any preset to reset.";
  const body = $("dossier-body"); if (body) { body.textContent = "Modified scenario — the replay's position dossier no longer applies to these numbers. "; appendEffectiveTrafficLine(body); }
  renderModelDossier(currentModel(), false); // model cards stay under the Model selector; the route-only #model-context panel clears
}
/* Range-exploration identity exit (v2.1.3 M3, P0-5): a loaded exploration config is an explicit
   page-authored counterfactual with a vN identity and ranking metadata. ANY divergent edit —
   sliders, ticks, radios, selects, blend inputs, URL overlays, saved-preset loads — EXITS that
   identity into "[modified range exploration]": the route id and its ranking metadata no longer
   describe the numbers. An origin breadcrumb is kept with one-click restore (hero + dossier).
   (Axis SELECTIONS — model / traffic-mix / perspective — re-derive state through applyPreset and
   are not divergent edits; the route composes with any model/traffic like a lens, with drift
   displayed. A warning is not an exit; this is the exit — the MLI-8 lesson.) */
/* Authored flagship scope for every route is Claude Opus 4.x @ Reference 15:1/60% (engine
   FLAGSHIP_SCOPE). A route COMPOSES with any model/traffic like a lens (recon §4.3) — changing
   model/traffic must NOT exit config identity — but viewing it anywhere other than that scope is
   made unmistakable: the identity label, the hero prefix and the drift line all say so. */
function explorationOffScope(m, tr) {
  return !(m && m.id === FLAGSHIP_SCOPE.modelId && tr && tr.ioRatio === 15 && tr.cacheHit === 60);
}
let EXPLORATION_ORIGIN = null; // { id, subtitle } breadcrumb; non-null == modified-exploration state
function downgradeExplorationToModified(p) {
  EXPLORATION_ORIGIN = { id: p.id, subtitle: p.subtitle || p.name };
  MODIFIED_FROM = null; // the two modified identities are exclusive — never both prefixes/breadcrumbs at once
  const ps = $("persp-preset");
  let o = ps.querySelector('option[value="__modified-exploration"]');
  if (!o) { o = document.createElement("option"); o.value = "__modified-exploration"; ps.appendChild(o); }
  o.textContent = "[modified range exploration] derived from “" + EXPLORATION_ORIGIN.subtitle + "” — no longer the page-authored route";
  ps.value = "__modified-exploration";
  // Mirror the replay downgrade: a modified route's traffic is now CUSTOM (frozen at its resolved
  // values already in S), so the selector identity == the resolver identity (Residual 1 — the
  // route downgrade previously left TRAFFIC on its stale native/explicit mode, making the selector
  // read "Model default" while resolveTraffic() read "Custom" even though the numbers matched).
  TRAFFIC = { mode: "custom", profileId: null };
  { const ts = $("traffic-preset"); if (ts) { ts.disabled = false; ts.value = "__custom"; } }
  $("preset-note").textContent = "MODIFIED RANGE EXPLORATION — derived from the page-authored route “" + EXPLORATION_ORIGIN.subtitle + "” but since edited; the route identity and its ranking metadata no longer apply to these numbers. Still a page-authored counterfactual space, not an estimate. Restore the route from the headline tile or the dossier, or pick any preset to reset.";
  const body = $("dossier-body");
  if (body) {
    body.textContent = "Modified range exploration — the route's dossier no longer applies to these numbers. ";
    body.append(explorationRestoreBtn());
    appendEffectiveTrafficLine(body);
  }
  renderModelDossier(currentModel(), false); // route identity exited → model cards render plainly under the Model selector; #model-context clears
}
function explorationRestoreBtn() {
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "ghost-btn btn-wrap";
  btn.textContent = "Restore route “" + (EXPLORATION_ORIGIN ? EXPLORATION_ORIGIN.subtitle : "") + "”";
  btn.onclick = () => { if (!EXPLORATION_ORIGIN) return; $("persp-preset").value = EXPLORATION_ORIGIN.id; applyPreset(); };
  return btn;
}
function noteUserEdit() {
  const cp = currentPersp();
  if (cp && cp.kind === "replay") { downgradeReplayToModified(cp.name); onChange(true); return true; }
  if (cp && cp.kind === "exploration") { downgradeExplorationToModified(cp); onChange(true); return true; }
  return false;
}
/* Traffic/model change made WHILE the page is in a synthetic modified state (Residual 2).
   applyPreset() has no perspective to apply, but the invariant must survive: re-resolve traffic
   from the current selection + model (lens-carrier resolution — modified states never lock),
   WRITE it into S so workload(S) uses those exact numbers, rebuild the modified dossier's traffic
   line, and refresh the note so "selector / resolved / computed all agree" stays factually true.
   Model-owned fields stay frozen (a modified scenario is a free-form edited state); only the
   traffic axis re-resolves, which is all the invariant governs. */
function refreshModifiedState() {
  const m = currentModel(); if (!m) return;
  const tr = resolvedTraffic();
  if (tr) { S.ioRatio = tr.ioRatio; S.cacheHit = tr.cacheHit; }
  renderModelDossier(m, false); // a model switch while modified updates the cards under the selector
  const body = $("dossier-body");
  if (body) { body.querySelectorAll(".dossier-traffic").forEach(n => n.remove()); appendEffectiveTrafficLine(body); }
  if (tr) $("preset-note").textContent = (EXPLORATION_ORIGIN ? "MODIFIED RANGE EXPLORATION" : "MODIFIED SCENARIO")
    + " — traffic mix is now " + tr.ioRatio + ":1 / " + tr.cacheHit + "% (" + tr.label + "); the selector, the resolved traffic and the computed margin all use the same numbers. Pick any preset to reset.";
  fullRefresh();
}
/* Centralized traffic-display sync (M4 round 4). After ANY traffic-key change to S (slider drag or
   tick click, on ANY perspective kind), make the DISPLAYED traffic identity match resolveTraffic()
   and the numbers workload(S) uses — the dossier ".dossier-traffic" line AND the preset-note's
   "Traffic mix: {label}" figure. Does NOT reset S (no applyPresetSettings — that would wipe a
   non-traffic edit the user made on this lens) and does NOT rebuild the controls (slider dragging
   stays smooth; charts re-render via the debounced onChange). Fixes a PRE-EXISTING v2.1.2 defect:
   an ordinary-lens traffic slider/tick edit updated the hero but left the dossier line and the note
   showing the old mix. Locked replays never reach here (slider disabled). */
function refreshTrafficDisplay() {
  const tr = resolvedTraffic();
  if (!tr) { onChange(); return; }
  const body = $("dossier-body");
  if (body) { body.querySelectorAll(".dossier-traffic").forEach(n => n.remove()); appendEffectiveTrafficLine(body); }
  const note = $("preset-note");
  if (note) {
    if (!currentPersp()) {
      // Synthetic modified state: its note IS the modified note — refresh only the traffic figures,
      // keeping the "all agree" claim (now true again).
      note.textContent = (EXPLORATION_ORIGIN ? "MODIFIED RANGE EXPLORATION" : "MODIFIED SCENARIO")
        + " — traffic mix is now " + tr.ioRatio + ":1 / " + tr.cacheHit + "% (" + tr.label + "); the selector, the resolved traffic and the computed margin all use the same numbers. Pick any preset to reset.";
    } else if (/Traffic mix: [^.]*\./.test(note.textContent)) {
      // Ordinary lens: keep its full composed note, swap ONLY the "Traffic mix: {label}" figure
      // (a resolved-traffic label never contains a period, so [^.]* captures exactly the stale one).
      note.textContent = note.textContent.replace(/Traffic mix: [^.]*\./, "Traffic mix: " + tr.label + ".");
    }
  }
  onChange();
}
/* pairingSeverity / pairingWarning live in engine.js since v2.1.2 (single source; tests exercise the real logic). */

/* ---------- position dossier panel ---------- */
function fmtDossierVal(k, v) {
  if (k === "blend") return Object.entries(v).filter(([, s]) => s > 0).map(([hw, s]) => `${HW[hw] ? HW[hw].name : hw} ${s}`).join(" / ");
  return String(v);
}
const ATTRIBUTION_TEXT = {
  "quoted-position": "Quoted position — the parameters below come from the source's own disclosure.",
  "reconstruction": "Reconstruction — only the quoted claim is the source's; the parameter translation into this calculator is this page's, and the source never chose these values.",
  "calculator-synthesis": "Calculator synthesis — this page's own analytical position, not attributed to any external party.",
};
function dossierBlock(title, d, values) {
  const frag = document.createDocumentFragment();
  const h = document.createElement("h4"); h.textContent = title; frag.append(h);
  const who = document.createElement("p"); who.className = "dossier-who"; who.textContent = d.who; frag.append(who);
  if (d.attribution && ATTRIBUTION_TEXT[d.attribution]) {
    const at = document.createElement("p"); at.className = "dossier-attr";
    at.textContent = "Attribution: " + ATTRIBUTION_TEXT[d.attribution]; frag.append(at);
  }
  if (d.anchor) {
    const bq = document.createElement("blockquote");
    bq.append(`“${d.anchor.quote}” `);
    const a = document.createElement("a"); a.href = d.anchor.url; a.textContent = "[source]"; bq.append(a);
    frag.append(bq);
  }
  const keys = Object.keys(d.params || {});
  if (keys.length) {
    const tbl = document.createElement("table"); tbl.className = "dossier-params";
    const hd = document.createElement("tr");
    ["Parameter", "Value", "Source", "Evidence"].forEach(c => { const th = document.createElement("th"); th.textContent = c; hd.append(th); });
    tbl.append(hd);
    keys.forEach(k => {
      const tr = document.createElement("tr");
      const ann = d.params[k];
      [k, values[k] !== undefined ? fmtDossierVal(k, values[k]) : "—", ann.src, ann.label].forEach((c, i) => {
        const td = document.createElement("td"); td.textContent = c;
        if (i === 3) td.className = "ev-label ev-" + String(c).toLowerCase().replace(/[^a-z]/g, "").slice(0, 4);
        tr.append(td);
      });
      tbl.append(tr);
    });
    frag.append(tbl);
  }
  const lists = [["Assumes away", d.assumes], ["Would falsify / update this position", d.falsifiers]];
  lists.forEach(([label, items]) => {
    if (!items || !items.length) return;
    const cap = document.createElement("p"); cap.className = "dossier-cap"; cap.textContent = label + ":"; frag.append(cap);
    const ul = document.createElement("ul");
    items.forEach(t => { const li = document.createElement("li"); li.textContent = t; ul.append(li); });
    frag.append(ul);
  });
  return frag;
}
/* Model-sizing provenance panel (D3 structural separation). While a range-exploration route is
   loaded, the selected model's sizing/pricing provenance — the one surface that legitimately
   carries personal names as size/price sources — renders in its OWN separately-collapsed panel
   (#model-context), structurally outside the route dossier, so a loaded route can never read as
   a co-located claimant's own model. Hidden and emptied for every other state. */
function setModelContextPanel(m, md, mVals) {
  const panel = $("model-context"); if (!panel) return;
  const body = $("model-context-body"), note = $("model-context-note");
  if (!m || !md) { panel.hidden = true; panel.open = false; if (body) body.textContent = ""; if (note) note.textContent = ""; return; }
  panel.hidden = false;
  if (note) note.textContent = "MODEL-SIZING CONTEXT — " + m.name + (m.spec ? " (⚠ speculative sizes)" : "")
    + ": provenance for the selected model's sizes and prices, kept structurally outside the loaded route's dossier. Any names here are cited as size/price sources only — not as claimants and not as endorsers of any route.";
  if (body) { body.textContent = ""; body.append(dossierBlock("Model-sizing context — " + m.name, md, mVals)); }
}
/* MODEL dossier (layout feedback 2026-07-11): the selected model's OWN parameter cards render
   in #model-dossier, directly under the Model selector in the controls column — split out of the
   perspective dossier near the hero. Values come live from the model's params (m.set + native
   traffic), so switching models updates the cards there with no drift. While a range-exploration
   ROUTE is loaded, the model block is instead quarantined to the separately-collapsed
   #model-context panel (D3 name-quarantine) which lives right beside this card — never plainly
   co-located with the route. */
function renderModelDossier(m, isExpl) {
  // #model-dossier-card is a <details> (collapsed by default). We only toggle its `hidden` attribute
  // and refill the body — never set `open`, so switching model keeps it collapsed (no auto-open).
  const card = $("model-dossier-card"), box = $("model-dossier"), sumNote = $("model-dossier-note");
  if (box) box.textContent = "";
  if (!m) { if (card) card.hidden = true; setModelContextPanel(null); return; }
  const md = DOSSIERS.models[m.id];
  const natProf = TRAFFIC_PROFILES.find(t => t.id === m.nativeTraffic);
  // Model dossiers may annotate ioRatio/cacheHit (positions that include a traffic mix);
  // those values now live in the named profile — merge them in for live rendering.
  const mVals = Object.assign({}, natProf ? { ioRatio: natProf.ioRatio, cacheHit: natProf.cacheHit } : {}, m.set);
  if (isExpl) {
    // Route loaded: model provenance is quarantined to #model-context; the plain card hides.
    setModelContextPanel(m, md, mVals);
    if (card) card.hidden = true;
  } else if (box) {
    setModelContextPanel(null);
    // Summary header names the selected model (mirrors #model-context-note); body stays collapsed.
    if (sumNote) sumNote.textContent = "Model sizing & assumptions — " + m.name + (m.spec ? " (⚠ speculative sizes)" : "");
    // The MODEL note (sizing/assumptions prose — e.g. Opus's ≈5T / 300B-active / List $5/$25) lives
    // HERE with the cards under the Model selector, not in the top perspective note. Intro line first.
    const note = document.createElement("p"); note.className = "model-note";
    note.textContent = (m.spec ? "⚠ speculative sizes — " : "") + m.note;
    box.append(note);
    if (md) box.append(dossierBlock("Model position — " + m.name, md, mVals));
    if (card) card.hidden = false;
  } else {
    setModelContextPanel(null);
    if (card) card.hidden = true;
  }
}
function renderDossier(m, p) {
  const body = $("dossier-body"); if (!body) return;
  body.textContent = "";
  const pd = DOSSIERS.perspectives[p.id];
  const tr = resolveTraffic(m, p, currentTrafficSel());
  const isExpl = p.kind === "exploration"; // D3: model provenance renders OUTSIDE the route dossier
  // MODEL block goes under the Model selector (or the quarantined #model-context there); the
  // dossier near the hero keeps only the PERSPECTIVE position + identity warnings + traffic line.
  renderModelDossier(m, isExpl);
  if (isExpl) {
    const banner = document.createElement("p"); banner.className = "dossier-attr";
    banner.textContent = "This is a PAGE-AUTHORED RANGE-EXPLORATION ROUTE (see “Page-authored route” below) — a reconstruction of one route to the claimed range, not any claimant's model and endorsed by no named party. The selected model's sizing/pricing provenance renders in the separate, separately-collapsed MODEL-SIZING CONTEXT panel shown with the Model selector below — never among the route's parameters; any personal names there are size/price sources, NOT claimants and NOT endorsers of this route.";
    body.append(banner);
  }
  if (pd) {
    const pv = (p.id === "dive" && m.dive) ? m.dive : p.set;
    body.append(dossierBlock((isExpl ? "Page-authored route — " : "Perspective position — ") + p.name, pd, pv));
  }
  const t = document.createElement("p"); t.className = "dossier-traffic";
  const prov = tr.profileId ? (TRAFFIC_PROFILES.find(x => x.id === tr.profileId) || {}).provenance : (tr.mode === "custom" ? "User-set slider values." : tr.mode === "legacy-custom" ? "Reproduced from a v2 share link (pre-traffic-axis semantics)." : "");
  t.textContent = "Effective traffic mix: " + tr.ioRatio + ":1 / " + tr.cacheHit + "% — " + tr.label + (tr.locked ? " (locked: the replay's operating point)" : "") + (prov ? ". " + prov : "");
  body.append(t);
  refreshTrafficSelect();
}

/* ---------- tooltips ---------- */
const tipEl = $("tooltip");
function showTip(html, x, y) {
  tipEl.textContent = ""; tipEl.append(html); tipEl.hidden = false;
  const r = tipEl.getBoundingClientRect();
  tipEl.style.left = Math.min(window.innerWidth - r.width - 10, Math.max(8, x + 12)) + "px";
  tipEl.style.top = Math.min(window.innerHeight - r.height - 10, Math.max(8, y + 14)) + "px";
}
function hideTip() { tipEl.hidden = true; }
function tipContent(key) {
  const t = TIPS[key]; if (!t) return null;
  const frag = document.createDocumentFragment();
  const ti = document.createElement("div"); ti.className = "tt-title"; ti.textContent = t.t;
  const bo = document.createElement("div"); bo.textContent = t.b;
  frag.append(ti, bo);
  if (t.s) { const s = document.createElement("div"); s.className = "tt-src"; s.textContent = t.s; frag.append(s); }
  return frag;
}
document.addEventListener("pointerover", e => {
  const b = e.target.closest(".info"); if (!b) return;
  const c = tipContent(b.dataset.tip); if (c) showTip(c, e.clientX, e.clientY);
});
document.addEventListener("pointerout", e => { if (e.target.closest(".info")) hideTip(); });
document.addEventListener("focusin", e => {
  const b = e.target.closest(".info"); if (!b) return;
  const r = b.getBoundingClientRect(); const c = tipContent(b.dataset.tip);
  if (c) showTip(c, r.left, r.bottom);
});
document.addEventListener("focusout", e => { if (e.target.closest(".info")) hideTip(); });

/* ---------- SVG chart helpers ---------- */
const SVGNS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
  return el;
}
function chartText(x, y, str, opts = {}) {
  const t = svgEl("text", { x, y, fill: opts.fill || "var(--ink-2)", "font-size": opts.size || 11.5, "text-anchor": opts.anchor || "start", "font-weight": opts.weight || "normal" });
  t.textContent = str;
  return t;
}
function roundedBarPath(x, y, w, h, r, horizontal) {
  // 4px rounded at the data end, square at the baseline
  r = Math.min(r, horizontal ? w : h, horizontal ? h / 2 : w / 2);
  if (r <= 0) return `M${x},${y}h${w}v${h}h${-w}Z`;
  if (horizontal) return `M${x},${y} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(w - r)} Z`;
  return `M${x},${y + r} a${r},${r} 0 0 1 ${r},${-r} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - r} h${-w} Z`;
}
function attachMarkTip(el, buildFrag) {
  el.style.cursor = "default";
  el.setAttribute("tabindex", "0");
  el.addEventListener("pointermove", e => showTip(buildFrag(), e.clientX, e.clientY));
  el.addEventListener("pointerleave", hideTip);
  el.addEventListener("focus", () => { const r = el.getBoundingClientRect(); showTip(buildFrag(), r.right, r.top); });
  el.addEventListener("blur", hideTip);
}
function ttRows(title, rows) {
  const frag = document.createDocumentFragment();
  const t = document.createElement("div"); t.className = "tt-title"; t.textContent = title; frag.append(t);
  rows.forEach(([label, value, color]) => {
    const r = document.createElement("div"); r.className = "tt-row";
    const l = document.createElement("span");
    if (color) { const k = document.createElement("i"); k.className = "tt-key"; k.style.background = color; l.append(k); }
    l.append(label);
    const v = document.createElement("b"); v.textContent = value;
    r.append(l, v); frag.append(r);
  });
  return frag;
}

/* ---------- chart: margin per hardware (horizontal bars, emphasis) ---------- */
function renderHwChart() {
  const el = $("chart-hw"); el.textContent = "";
  const w = blendWeights(S);
  const rows = HW_ORDER.map(k => {
    const r = marginOnHw(k, S);
    return { k, name: HW[k].name, margin: r.margin, cost: r.costMix, inBlend: !!w[k] };
  });
  const blended = workload(S);
  const W = 720, rowH = 34, padL = 150, padR = 90, padT = 8;
  const H = padT + rows.length * rowH + 26;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Margin by accelerator" });
  const x0 = padL, x1 = W - padR;
  const xmin = Math.min(0, ...rows.map(r => r.margin)), xmax = 1;
  const xs = v => x0 + (v - xmin) / (xmax - xmin) * (x1 - x0);
  // gridlines at 0/25/50/75/100%
  [0, 0.25, 0.5, 0.75, 1].forEach(g => {
    if (g < xmin) return;
    svg.append(svgEl("line", { x1: xs(g), y1: padT, x2: xs(g), y2: H - 22, stroke: "var(--grid)", "stroke-width": 1 }));
    svg.append(chartText(xs(g), H - 8, fmtPct(g), { anchor: "middle", fill: "var(--ink-3)", size: 10.5 }));
  });
  rows.forEach((r, i) => {
    const y = padT + i * rowH + 5;
    const bh = 22;
    svg.append(chartText(padL - 8, y + bh / 2 + 4, r.name, { anchor: "end", size: 11.5 }));
    const v = Math.max(xmin, Math.min(1, r.margin));
    const color = r.inBlend ? "var(--series-1)" : "var(--baseline)";
    const path = svgEl("path", { d: roundedBarPath(Math.min(xs(0), xs(v)), y, Math.abs(xs(v) - xs(0)), bh, 4, true), fill: color });
    svg.append(path);
    svg.append(chartText(xs(Math.max(0, v)) + 6, y + bh / 2 + 4, fmtPct(r.margin), { weight: 600, fill: "var(--ink-1)" }));
    attachMarkTip(path, () => ttRows(r.name, [
      ["Margin (alone)", fmtPct(r.margin)],
      ["Blended cost / Mtok", fmt$(r.cost)],
      ["In current blend", r.inBlend ? Math.round(w[r.k] * 100) + "%" : "no"],
    ]));
  });
  // blended reference line
  const bx = xs(Math.max(xmin, Math.min(1, blended.margin)));
  svg.append(svgEl("line", { x1: bx, y1: padT - 2, x2: bx, y2: H - 22, stroke: "var(--ink-1)", "stroke-width": 1.5, "stroke-dasharray": "" }));
  svg.append(chartText(bx, padT + 2, "blend " + fmtPct(blended.margin), { anchor: bx > W - 170 ? "end" : "start", size: 10.5, fill: "var(--ink-1)", weight: 600 }));
  $("chart-hw-sub").textContent = "at current settings; gray bars are accelerators with 0 traffic share; vertical line = your blend";
  el.appendChild(svg);
}

/* ---------- chart: cost stack (TCO decomposition) ---------- */
const STACK_KEYS = [
  { k: "capex", name: "GPU capex (amortized)", color: "var(--series-1)" },
  { k: "power", name: "Electricity × PUE", color: "var(--series-2)" },
  { k: "dc", name: "Datacenter capex", color: "var(--series-3)" },
  { k: "opex", name: "Operations", color: "var(--series-4)" },
];
function renderStackChart() {
  const el = $("chart-stack"); el.textContent = "";
  const s = structuredClone(S); s.hwMode = "tco";
  const rows = HW_ORDER.map(k => {
    const hw = HW[k];
    const parts = hwHourParts(hw, s);
    const totalHr = parts.capex + parts.power + parts.dc + parts.opex;
    const one = structuredClone(s); one.blend = { [k]: 100 };
    const wl = workload(one);
    const scale = wl.costMix / totalHr; // $/Mtok per $/hr
    return { k, name: hw.name, segs: STACK_KEYS.map(sk => ({ ...sk, v: parts[sk.k] * scale })), total: wl.costMix };
  });
  const W = 720, rowH = 34, padL = 150, padR = 70, padT = 26;
  const H = padT + rows.length * rowH + 26;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Cost decomposition per accelerator" });
  const xmax = Math.max(...rows.map(r => r.total)) * 1.08;
  const xs = v => padL + v / xmax * (W - padL - padR);
  // legend
  let lx = padL;
  STACK_KEYS.forEach(sk => {
    svg.append(svgEl("rect", { x: lx, y: 4, width: 10, height: 10, rx: 2, fill: sk.color }));
    const t = chartText(lx + 14, 13, sk.name, { size: 10.5, fill: "var(--ink-2)" });
    svg.append(t); lx += 14 + sk.name.length * 5.4 + 16;
  });
  rows.forEach((r, i) => {
    const y = padT + i * rowH + 5, bh = 22;
    svg.append(chartText(padL - 8, y + bh / 2 + 4, r.name, { anchor: "end", size: 11.5 }));
    let x = padL;
    r.segs.forEach((seg, si) => {
      const wdt = Math.max(0, xs(seg.v) - padL - (si > 0 ? 2 : 0));
      const isLast = si === r.segs.length - 1;
      const rect = isLast
        ? svgEl("path", { d: roundedBarPath(x + (si > 0 ? 2 : 0), y, wdt, bh, 4, true), fill: seg.color })
        : svgEl("rect", { x: x + (si > 0 ? 2 : 0), y, width: wdt, height: bh, fill: seg.color });
      svg.append(rect);
      attachMarkTip(rect, () => ttRows(r.name + " — " + fmt$(r.total) + "/Mtok", r.segs.map(g => [g.name, fmt$(g.v), g.color.startsWith("var") ? getComputedStyle(document.documentElement).getPropertyValue(g.color.slice(4, -1)) : g.color])));
      x += wdt + (si > 0 ? 2 : 0) + 0;
      x = padL + (xs(r.segs.slice(0, si + 1).reduce((a, g) => a + g.v, 0)) - padL);
    });
    svg.append(chartText(x + 6, y + bh / 2 + 4, fmt$(r.total), { weight: 600, fill: "var(--ink-1)" }));
  });
  el.appendChild(svg);
  // table view (values reachable without hover)
  const det = document.createElement("details");
  const sum = document.createElement("summary");
  sum.textContent = "Table view";
  sum.style.cssText = "cursor:pointer;font-size:12px;color:var(--ink-3);padding:2px 4px 6px";
  det.appendChild(sum);
  const tbl = document.createElement("table");
  tbl.style.cssText = "border-collapse:collapse;font-size:12px;width:100%";
  const mkRow = (cells, isHead) => {
    const tr = document.createElement("tr");
    cells.forEach(c => {
      const td = document.createElement(isHead ? "th" : "td");
      td.textContent = c;
      td.style.cssText = "text-align:left;padding:3px 8px;border-bottom:1px solid var(--grid);color:var(--ink-2)";
      tr.appendChild(td);
    });
    return tr;
  };
  tbl.appendChild(mkRow(["Accelerator", ...STACK_KEYS.map(k => k.name), "Total $/Mtok"], true));
  rows.forEach(r => tbl.appendChild(mkRow([r.name, ...r.segs.map(g => fmt$(g.v)), fmt$(r.total)])));
  det.appendChild(tbl);
  el.appendChild(det);
}

/* ---------- chart: sensitivity (margin vs active params) ---------- */
function renderSensChart() {
  const el = $("chart-sens"); el.textContent = "";
  const W = 720, H = 300, padL = 56, padR = 20, padT = 12, padB = 40;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Margin vs active parameters" });
  const xmin = 10, xmax = 800;
  const xs = v => padL + (Math.log(v) - Math.log(xmin)) / (Math.log(xmax) - Math.log(xmin)) * (W - padL - padR);
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const a = Math.exp(Math.log(xmin) + i / 120 * (Math.log(xmax) - Math.log(xmin)));
    pts.push({ a, m: workload(S, a).margin });
  }
  const ymin = Math.min(0, ...pts.map(p => p.m)), ymax = 1;
  const ys = v => padT + (ymax - v) / (ymax - ymin) * (H - padT - padB);
  [0, 0.25, 0.5, 0.75, 1].forEach(g => {
    if (g < ymin) return;
    svg.append(svgEl("line", { x1: padL, y1: ys(g), x2: W - padR, y2: ys(g), stroke: "var(--grid)", "stroke-width": 1 }));
    svg.append(chartText(padL - 8, ys(g) + 4, fmtPct(g), { anchor: "end", fill: "var(--ink-3)", size: 10.5 }));
  });
  [10, 30, 100, 300, 800].forEach(g => {
    svg.append(chartText(xs(g), H - padB + 16, g + "B", { anchor: "middle", fill: "var(--ink-3)", size: 10.5 }));
  });
  svg.append(chartText(W / 2, H - 6, "active parameters (log scale)", { anchor: "middle", fill: "var(--ink-3)", size: 10.5 }));
  const d = pts.map((p, i) => (i ? "L" : "M") + xs(p.a).toFixed(1) + "," + ys(Math.max(ymin, p.m)).toFixed(1)).join("");
  svg.append(svgEl("path", { d, fill: "none", stroke: "var(--series-1)", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));
  // model markers
  const markers = [
    { a: 37, l: "DeepSeek" }, { a: 100, l: "GPT est." }, { a: 120, l: "Sonnet est.", below: true }, { a: 300, l: "Opus est." },
  ];
  markers.forEach(mk => {
    const m = workload(S, mk.a).margin;
    const c = svgEl("circle", { cx: xs(mk.a), cy: ys(Math.max(ymin, m)), r: 4.5, fill: "var(--series-1)", stroke: "var(--surface-1)", "stroke-width": 2 });
    svg.append(c);
    svg.append(chartText(xs(mk.a), ys(Math.max(ymin, m)) + (mk.below ? 18 : -10), mk.l, { anchor: "middle", size: 10, fill: "var(--ink-2)" }));
    attachMarkTip(c, () => ttRows(mk.l + " (" + mk.a + "B active)", [["margin", fmtPct(m)], ["cost / Mtok", fmt$(workload(S, mk.a).costMix)]]));
  });
  // current position marker
  const cur = workload(S).margin;
  svg.append(svgEl("circle", { cx: xs(S.active), cy: ys(Math.max(ymin, cur)), r: 5.5, fill: "var(--ink-1)", stroke: "var(--surface-1)", "stroke-width": 2 }));
  // crosshair
  const cross = svgEl("line", { x1: 0, y1: padT, x2: 0, y2: H - padB, stroke: "var(--baseline)", "stroke-width": 1, visibility: "hidden" });
  svg.append(cross);
  const overlay = svgEl("rect", { x: padL, y: padT, width: W - padL - padR, height: H - padT - padB, fill: "transparent" });
  overlay.addEventListener("pointermove", e => {
    const r = svg.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width * W;
    const a = Math.exp(Math.log(xmin) + (px - padL) / (W - padL - padR) * (Math.log(xmax) - Math.log(xmin)));
    if (a < xmin || a > xmax) return;
    cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.setAttribute("visibility", "visible");
    const wl = workload(S, a);
    showTip(ttRows(Math.round(a) + "B active", [["margin", fmtPct(wl.margin)], ["cost / Mtok", fmt$(wl.costMix)], ["output cost / Mtok", fmt$(wl.cOut)]]), e.clientX, e.clientY);
  });
  overlay.addEventListener("pointerleave", () => { cross.setAttribute("visibility", "hidden"); hideTip(); });
  svg.append(overlay);
  el.appendChild(svg);
}

/* ---------- chart: cost per generation (columns, ordinal ramp) ---------- */
/* Ramp lives in the skin token layer (--ord-1..5) so it re-themes with data-skin/data-theme. */
const ORDINAL = ["var(--ord-1)", "var(--ord-2)", "var(--ord-3)", "var(--ord-4)", "var(--ord-5)"];
function renderGenChart() {
  const el = $("chart-gen"); el.textContent = "";
  const ramp = ORDINAL;
  const gens = [...GEN_TIMELINE.map(k => ({ key: k, hw: HW[k] })), { key: "rubin", hw: RUBIN }];
  const cols = gens.map((g, i) => {
    const wl = workloadOnHw(g.hw, S); // single source of truth — same billing math as the hero
    return { name: g.hw.name.replace(" NVL72", ""), cost: wl.cOut, margin: wl.margin, color: ramp[i], proj: g.key === "rubin" };
  });
  const W = 720, H = 300, padL = 56, padR = 16, padT = 26, padB = 34;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Cost per generation" });
  const ymax = Math.max(...cols.map(c => c.cost)) * 1.15;
  const ys = v => padT + (1 - v / ymax) * (H - padT - padB);
  const ticks = niceTicks(ymax);
  ticks.forEach(g => {
    svg.append(svgEl("line", { x1: padL, y1: ys(g), x2: W - padR, y2: ys(g), stroke: "var(--grid)", "stroke-width": 1 }));
    svg.append(chartText(padL - 8, ys(g) + 4, fmt$(g), { anchor: "end", fill: "var(--ink-3)", size: 10.5 }));
  });
  const slot = (W - padL - padR) / cols.length;
  cols.forEach((c, i) => {
    const bw = Math.min(24 * 2, slot * 0.5);
    const x = padL + i * slot + (slot - bw) / 2;
    const p = svgEl("path", { d: roundedBarPath(x, ys(c.cost), bw, (H - padB) - ys(c.cost), 4, false), fill: c.color, opacity: c.proj ? 0.55 : 1 });
    svg.append(p);
    svg.append(chartText(x + bw / 2, ys(c.cost) - 18, fmt$(c.cost), { anchor: "middle", weight: 600, fill: "var(--ink-1)" }));
    svg.append(chartText(x + bw / 2, ys(c.cost) - 6, fmtPct(c.margin) + " margin", { anchor: "middle", size: 10, fill: "var(--ink-3)" }));
    svg.append(chartText(x + bw / 2, H - padB + 15, c.name, { anchor: "middle", size: 10.5, fill: "var(--ink-2)" }));
    if (c.proj) svg.append(chartText(x + bw / 2, H - padB + 27, "(projection)", { anchor: "middle", size: 9.5, fill: "var(--ink-3)" }));
    attachMarkTip(p, () => ttRows(c.name, [["output cost / Mtok", fmt$(c.cost)], ["margin at current price", fmtPct(c.margin)]]));
  });
  el.appendChild(svg);
}
function niceTicks(max) {
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const s = max / step > 5 ? step * 2 : max / step > 2.5 ? step : step / 2;
  const out = []; for (let v = 0; v <= max; v += s) out.push(v);
  return out;
}

/* ---------- subscription card ---------- */
function buildSubControls() {
  const el = $("sub-controls"); el.textContent = "";
  const defs = [
    { k: "subPlan", label: "Plan price", unit: "$/mo", min: 20, max: 400, step: 5, tip: "subPlan",
      ticks: [{ v: 20, l: "Pro" }, { v: 100, l: "Max 5×" }, { v: 200, l: "Max 20×" }] },
    { k: "subUsage", label: "API-equivalent usage", unit: "$/mo", min: 100, max: 10000, step: 50, log: true, tip: "subUsage",
      ticks: [{ v: 1900, l: "ksred avg" }, { v: 3200, l: "melvynx max", alt: true }, { v: 3000, l: "olofj" }, { v: 8000, l: "Earth_1729" }] },
  ];
  defs.forEach(p => el.appendChild(buildParam(p)));
}
function renderSubChart() {
  const el = $("chart-sub"); el.textContent = "";
  const wl = workload(S);
  // ccusage-style figures report LIST-price value, so tokens are inferred at the undiscounted
  // list mix — deliberately independent of the batch/discount sliders (a person's actual usage
  // cannot depend on an unrelated pricing assumption).
  const tokensM = S.subUsage / wl.priceMixList;
  const cost = tokensM * wl.costMix;
  const subMargin = (S.subPlan - cost) / S.subPlan;
  const rows = [
    { name: "What the user pays", v: S.subPlan, color: "var(--series-1)" },
    { name: "Direct cost to serve", v: cost, color: cost > S.subPlan ? "var(--bad)" : "var(--good)" }, // status tokens: critical / good
    { name: "Value at list API prices", v: S.subUsage, color: "var(--baseline)" },
  ];
  const W = 720, rowH = 36, padL = 210, padR = 90, padT = 8;
  const H = padT + rows.length * rowH + 30;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Subscription economics" });
  const xmax = Math.max(...rows.map(r => r.v)) * 1.1;
  const xs = v => padL + v / xmax * (W - padL - padR);
  rows.forEach((r, i) => {
    const y = padT + i * rowH + 6, bh = 22;
    svg.append(chartText(padL - 8, y + bh / 2 + 4, r.name, { anchor: "end", size: 11.5 }));
    const p = svgEl("path", { d: roundedBarPath(padL, y, Math.max(1, xs(r.v) - padL), bh, 4, true), fill: r.color });
    svg.append(p);
    svg.append(chartText(xs(r.v) + 6, y + bh / 2 + 4, fmt$(r.v), { weight: 600, fill: "var(--ink-1)" }));
    attachMarkTip(p, () => ttRows(r.name, [["per month", fmt$(r.v)]]));
  });
  el.appendChild(svg);
  const verdict = document.createElement("div");
  verdict.style.cssText = "font-size:12.5px;font-weight:600;padding:2px 4px 8px;color:" + (subMargin >= 0 ? "var(--good)" : "var(--series-6)");
  verdict.textContent = subMargin >= 0
    ? `Plan contribution margin ≈ ${fmtPct(subMargin)} — THIS usage level is still profitable at direct serving cost (${fmtNum(tokensM * 1e6)} tokens ≈ ${fmt$(cost)} to serve). Says nothing about the median subscriber — no usage distribution is public.`
    : `THIS usage level is underwater by ${fmt$(cost - S.subPlan)}/mo at direct serving cost. Says nothing about the median subscriber — no usage distribution is public.`;
  el.appendChild(verdict);
}

/* ---------- §10 normalized comparison (static, same lens + same workload) ---------- */
function renderNormalized() {
  const el = document.getElementById("normalized-table"); if (!el) return;
  const median = PERSPECTIVES.find(p => p.id === "median");
  const tbl = document.createElement("table");
  const mkRow = (cells, head) => {
    const tr = document.createElement("tr");
    cells.forEach((c, i) => {
      const td = document.createElement(head ? "th" : "td");
      td.textContent = c;
      if (i > 0) td.style.textAlign = "right";
      tr.appendChild(td);
    });
    return tr;
  };
  tbl.appendChild(mkRow(["Provider preset", "Blended margin", "Serving cost /Mtok", "Realized price /Mtok"], true));
  MODELS.filter(m => !m.scenario && m.id !== "custom").forEach(m => { // custom = user scratch model, not a provider row
    const s = applyPresetSettings(m, median);
    s.ioRatio = 15; s.cacheHit = 60; // common reference workload (tariff scenarios excluded — sizes unidentified)
    const wl = workload(s);
    tbl.appendChild(mkRow([m.name + (m.spec ? " *" : ""), Math.round(wl.margin * 100) + "%", fmt$(wl.costMix), fmt$(wl.priceMix)]));
  });
  el.appendChild(tbl);
}

/* ---------- margin-range evidence board (v2.1.3 preset redesign, M3) ----------
   First-class, causally SECONDARY: renders the typed claims registry (engine.js MARGIN_CLAIMS /
   MARGIN_BUCKETS — bins claims, not people) plus the page-authored exploration routes, and maps
   the CURRENT mechanism-first scenario's derived margin onto the buckets. It never writes the
   hero: loading a route goes through the ordinary perspective-state path (an explicit
   counterfactual with its own hero identity). Names appear ONLY in claim rows (P0-4); relation
   groups are visually segregated (P0-2/P0-3): different-metric / unnamed-subject / anchor /
   model-generated figures never sit among unit-serving claimants. */
const BOARD_BUCKET_ORDER = ["b90plus", "b8090", "b6080", "b60minus"];
/* Group order within a bucket (2026-07-12 evidence pass): scope-LAYER groups — unit-serving
   (token-SKU) vs api-product-line vs paid-user-cohort vs paid+free bundle vs segment-split vs
   analyst-assumption vs company-GM — so a reader never mistakes a product-line, cohort, bundle or
   company figure for a unit-serving claimant. The special provenance groups (unnamed-subject,
   disclosure anchor, model-generated) keep their own segregation and precedence. */
const BOARD_GROUP_META = {
  unit:    { cls: "g-unit",    title: "Unit-serving (token-SKU) claim records compatible with this range — relation badged per record (this calculator's metric)" },
  api:     { cls: "g-api",     title: "API / product-line margins — a product-line perimeter, not the single-token unit metric" },
  cohort:  { cls: "g-cohort",  title: "Paid-user-cohort compute margins — a paying-user perimeter, not the unit metric and not company GM" },
  bundle:  { cls: "g-bundle",  title: "Paid+free bundle margins — all products including free users; not the unit metric" },
  segment: { cls: "g-segment", title: "Segment-split figures — company-GM and API-GM reported side by side; not claimants for the unit metric" },
  assumption: { cls: "g-assume", title: "Analyst modeling assumptions — inputs to models, not measured or disclosed figures" },
  unnamed: { cls: "g-unnamed", title: "Unnamed-subject claim — names no lab" },
  anchor:  { cls: "g-anchor",  title: "Disclosure anchor — a provider's own serving, not a claim about any other lab" },
  diff:    { cls: "g-diff",    title: "Company-GM / reported accounting figures (§7) — different objects; not claimants for the unit metric" },
  model:   { cls: "g-model",   title: "Model-generated scenario analysis — zero claimant weight" },
};
const BOARD_GROUP_ORDER = ["api", "cohort", "bundle", "segment", "assumption", "unnamed", "anchor", "diff", "model"];
const BOARD_REL_LABEL = { "asserts": "asserts", "locates-within": "locates within", "conditional-transition": "conditional transition", "unnamed-subject": "unnamed subject", "different-metric": "different metric", "anchor": "disclosure anchor" };
const BOARD_BOUND_LABEL = { point: "point", interval: "interval", floor: "floor", ceiling: "ceiling", "conditional-range": "conditional range" };
const BOARD_SRC_LABEL = { "primary-post": "primary post", "quoted-secondary": "quoted-secondary", reporting: "reporting", "model-generated": "model-generated", "disclosure-anchor": "provider disclosure", "sweep-non-finding": "sweep non-finding" };
const BOARD_FIELD_LABEL = { hwMode: "cost basis", rentMult: "GPU-hour multiplier", util: "fleet utilization", stackMult: "serving-stack efficiency", interact: "interactivity", batchShare: "batch-API share", discount: "average discount", blend: "hardware blend" };
function mkEl(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function boardBadge(text, cls) { return mkEl("span", "badge " + (cls || "badge-low"), text); }
function boardGroupFor(claim, relation) {
  if (claim.sourceClass === "model-generated") return "model";
  if (relation === "unnamed-subject") return "unnamed";
  if (relation === "anchor") return "anchor";
  switch (claim.scopeLayer) { // 2026-07-12 evidence pass: scope-layer grouping
    case "api-product-line": return "api";
    case "paid-user-cohort": return "cohort";
    case "paid-plus-free-bundle": return "bundle";
    case "segment": return "segment";
    case "analyst-assumption": return "assumption";
    case "company-GM": return "diff";
  }
  if (relation === "different-metric") return "diff";
  return "unit"; // token-SKU: asserts | locates-within | conditional-transition | compatible-with (floor)
}
function boardClaimRow(claim, relation) {
  const row = mkEl("div", "claim-row");
  row.dataset.claim = claim.id;
  row.append(mkEl("div", "claim-who", claim.who));
  const badges = mkEl("div", "claim-badges");
  const isFloor = relation === "compatible-with"; // floors NEVER render as interval membership (P0-2)
  badges.append(isFloor
    ? boardBadge("floor — compatible with this range and every higher one", "badge-high")
    : boardBadge(BOARD_REL_LABEL[relation] || relation, "badge-mixed"));
  if (claim.boundType && !isFloor) badges.append(boardBadge(BOARD_BOUND_LABEL[claim.boundType] || claim.boundType, "badge-low"));
  badges.append(boardBadge(BOARD_SRC_LABEL[claim.sourceClass] || claim.sourceClass, claim.sourceClass === "model-generated" ? "badge-med" : "badge-low"));
  if (claim.scopeLayer) badges.append(boardBadge("scope: " + claim.scopeLayer, "badge-low"));
  row.append(badges);
  if (claim.verbatim) {
    // VERBATIM from the registry — exact string, never paraphrased (P0-3/attribution rules).
    row.append(mkEl("blockquote", null, "“" + claim.verbatim + "”"));
  } else {
    // Reported figure — NEVER labeled "verbatim": no quote is archived in this page's cited corpus.
    row.append(mkEl("p", "claim-reported", "Reported figure (no archived quote in this page's cited corpus — §7): " + (claim.reportedFigure || claim.reason || "")));
  }
  const src = mkEl("p", "claim-src");
  if (claim.date) src.append(claim.date + " · ");
  if (/^https?:\/\//.test(claim.url) || /^(research\/|#)/.test(claim.url)) {
    const a = document.createElement("a"); a.href = claim.url; a.textContent = "[source]";
    src.append(a);
  } else {
    // Fail-closed: a non-URL source descriptor (e.g. a filing or paywalled-article citation)
    // renders as text — never as a dead link.
    src.append("source: " + claim.url);
  }
  row.append(src);
  // Provenance-tier honesty label (2026-07-12 evidence pass) — visible on every row so a
  // relayed/assumed/clip-mediated figure is never mistaken for a measured primary.
  const tier = provenanceTierLabel(claim);
  if (tier) row.append(mkEl("p", "claim-src claim-tier", "Provenance: " + tier));
  if (claim.subjectScope) row.append(mkEl("p", "claim-scope", "Scope: " + claim.subjectScope));
  if (claim.notClaimed) row.append(mkEl("p", "claim-notclaimed", "Did not claim: " + claim.notClaimed));
  return row;
}
function boardFieldVal(k, v) {
  if (k === "hwMode") return v === "tco" ? "Owned TCO" : "Rental $/hr";
  if (k === "interact") return v === "batch" ? "Throughput" : v === "fast" ? "Low-latency" : "Balanced";
  if (k === "rentMult" || k === "stackMult") return v + "×";
  if (k === "util" || k === "batchShare" || k === "discount") return v + "%";
  if (k === "blend") return Object.entries(v).filter(([, s]) => s > 0).map(([hw, s]) => (HW[hw] ? HW[hw].name : hw) + " " + s).join(" / ");
  return String(v);
}
function boardChangedSummary(p) {
  const central = PERSPECTIVES.find(x => x.id === "median").set;
  return PERSPECTIVE_SPACE_KEYS
    .filter(k => JSON.stringify(p.set[k] ?? DEFAULTS[k]) !== JSON.stringify(central[k] ?? DEFAULTS[k]))
    .map(k => BOARD_FIELD_LABEL[k] + " " + boardFieldVal(k, central[k] ?? DEFAULTS[k]) + " → " + boardFieldVal(k, p.set[k] ?? DEFAULTS[k]))
    .join(" · ");
}
function boardConfigRow(p, rank, total) {
  const row = mkEl("div", "config-row");
  row.dataset.config = p.id;
  const head = mkEl("div", "config-head");
  head.append(boardBadge("PAGE-AUTHORED RECONSTRUCTION", "badge-med"), mkEl("strong", "config-name", p.subtitle || p.name));
  const tag = mkEl("span", "config-loaded-tag", "· loaded in the calculator below"); tag.hidden = true;
  head.append(tag);
  row.append(head);
  const n = changedFieldsFromCentral(p);
  const fm = explorationFlagshipMargin(p);
  const meta = mkEl("p", "config-meta", "Route " + rank + " of " + total + " — " + EXPLORATION_ORDER_BASIS + " (" + n + " changed). Lands at ≈" + Math.round(fm) + "% at the flagship scope (Claude Opus 4.x @ Reference 15:1/60%) — membership computed, never enforced.");
  meta.title = "unrounded flagship-scope value: " + fm.toFixed(2) + "% (conditional scenario output; input uncertainty is not propagated)";
  row.append(meta);
  row.append(mkEl("p", "config-changes", "What would have to be true (vs the central scenario): " + boardChangedSummary(p) + "."));
  const det = document.createElement("details");
  const sum = document.createElement("summary");
  sum.textContent = "route note — a reconstruction of a route to the claimed range, not any claimant's model";
  det.append(sum, mkEl("p", "config-note", p.note));
  row.append(det);
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "ghost-btn btn-wrap";
  btn.textContent = "Load into calculator ↓ — an explicit counterfactual, never the estimate";
  btn.onclick = () => loadExploration(p.id);
  row.append(btn);
  return row;
}
function loadExploration(id) {
  $("persp-preset").value = id;
  applyPreset();
  const hero = document.querySelector(".hero-row");
  if (hero && hero.scrollIntoView) hero.scrollIntoView({ behavior: "smooth", block: "start" });
}
/* Central-scenario return row (owner fix, 2026-07-14): the 60–80% bucket authors no counterfactual
   route — the central scenario is its own anchor — so it was the one range with no "load" affordance,
   and after loading any other route the only way back was the identity-strip reset up at the
   calculator. This row closes the round trip. It is NOT a counterfactual load: it re-runs the same
   returnToCentral() reset the identity strip uses, and the label says derived estimate, never route. */
function centralReturnRow() {
  const row = mkEl("div", "config-row central-return-row");
  const head = mkEl("div", "config-head");
  head.append(boardBadge("THIS PAGE’S DERIVED ESTIMATE", "badge-high"), mkEl("strong", "config-name", "The central scenario (§5)"));
  const tag = mkEl("span", "config-loaded-tag", "· currently loaded in the calculator below"); tag.hidden = true;
  head.append(tag);
  row.append(head);
  const median = PERSPECTIVES.find(x => x.id === "median");
  const fm = explorationFlagshipMargin(median);
  const meta = mkEl("p", "config-meta", "The calculator’s clean default — no changed fields. Computes to ≈" + Math.round(fm) + "% at the flagship scope (Claude Opus 4.x @ Reference 15:1/60%).");
  meta.title = "unrounded flagship-scope value: " + fm.toFixed(2) + "% (conditional scenario output; input uncertainty is not propagated)";
  row.append(meta);
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "ghost-btn btn-wrap central-return-btn";
  btn.textContent = "↺ Load the central scenario into the calculator — the derived estimate, not a counterfactual";
  btn.onclick = () => {
    returnToCentral();
    const hero = document.querySelector(".hero-row");
    if (hero && hero.scrollIntoView) hero.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  row.append(btn);
  return row;
}
/* §10 preserve-links (selector dissolve, 2026-07-12): the Perspective dropdown is hidden, so the
   report's "Load this operating point ↑" links reach each §10 replay/lens by setting the model +
   (hidden) perspective select and running the ordinary applyPreset path, then scrolling to the
   output tiles. Same mechanism as loadExploration; fail-closed identity and pairing are unchanged. */
function loadPerspective(modelId, perspId) {
  // Fail-closed: validate ids before mutating any selector, so a bad link leaves state untouched.
  if (modelId && !MODELS.some(x => x.id === modelId)) return;
  if (perspId && !PERSPECTIVES.some(x => x.id === normalizePerspId(perspId))) return;
  if (modelId) { $("model-preset").value = modelId; const c = $("model-dossier-card"); if (c) c.open = false; }
  if (perspId) $("persp-preset").value = perspId;
  applyPreset();
  const hero = document.querySelector(".hero-row");
  if (hero && hero.scrollIntoView) hero.scrollIntoView({ behavior: "smooth", block: "start" });
}
function wireLoadOpLinks() {
  document.querySelectorAll("a.load-op").forEach(a => {
    a.onclick = e => { e.preventDefault(); loadPerspective(a.dataset.model, a.dataset.persp); };
  });
}
function renderBoard() {
  const grid = $("board-grid"); if (!grid) return;
  grid.textContent = "";
  const ranked = rankExplorations(), total = ranked.length;
  BOARD_BUCKET_ORDER.forEach(bid => {
    const b = MARGIN_BUCKETS.find(x => x.id === bid);
    const card = mkEl("article", "bucket");
    card.id = "board-" + bid; card.dataset.bucket = bid;
    const head = mkEl("header", "bucket-head");
    head.append(mkEl("h3", null, b.label));
    const cur = mkEl("div", "bucket-current-note"); cur.hidden = true;
    head.append(cur);
    card.append(head);
    const groups = { unit: [], api: [], cohort: [], bundle: [], segment: [], assumption: [], unnamed: [], anchor: [], diff: [], model: [] };
    claimsForBucket(bid).forEach(r => groups[boardGroupFor(r.claim, r.relation)].push(r));
    // Unit-serving group always renders; empty buckets state the null finding verbatim (P0-8).
    const gu = mkEl("div", "claim-group " + BOARD_GROUP_META.unit.cls);
    gu.append(mkEl("h4", null, BOARD_GROUP_META.unit.title));
    if (groups.unit.length) groups.unit.forEach(r => gu.append(boardClaimRow(r.claim, r.relation)));
    else gu.append(mkEl("p", "bucket-empty", EMPTY_BUCKET_STATEMENT));
    card.append(gu);
    BOARD_GROUP_ORDER.forEach(g => {
      if (!groups[g].length) return;
      const gd = mkEl("div", "claim-group " + BOARD_GROUP_META[g].cls);
      gd.append(mkEl("h4", null, BOARD_GROUP_META[g].title));
      groups[g].forEach(r => gd.append(boardClaimRow(r.claim, r.relation)));
      card.append(gd);
    });
    const cfg = mkEl("div", "bucket-configs");
    cfg.append(mkEl("h4", null, "What would have to be true — page-authored routes"));
    const mine = ranked.filter(p => (explorationComputedBucket(p) || {}).id === bid);
    if (mine.length) mine.forEach(p => cfg.append(boardConfigRow(p, ranked.indexOf(p) + 1, total)));
    else {
      cfg.append(mkEl("p", "bucket-empty", boardNoRouteStatement(bid)));
      if (bid === "b6080") cfg.append(centralReturnRow());
    }
    card.append(cfg);
    grid.append(card);
  });
  // Negative findings (2026-07-12 evidence pass) — a rendered statement, NOT claim rows: absences
  // are stated, never binned. Text from the curated spec (engine.NEGATIVE_FINDINGS_STATEMENT).
  const neg = mkEl("p", "board-note board-negative-findings", "Negative findings — " + NEGATIVE_FINDINGS_STATEMENT);
  neg.style.gridColumn = "1 / -1";
  grid.append(neg);
}
function boardNoRouteStatement(bid) {
  return bid === "b6080"
    ? "No page-authored route is offered for this range: the central scenario itself (§5) lands here and is this range's own anchor — no route needs constructing."
    : "No page-authored route is offered for this range — the registry carries no popular-discourse position that points here.";
}
/* ---------- range-explorer front door (v2.1.3 remediation, owner directive) ----------
   The FIRST surface of the board section: pick a range you've heard claimed → see the
   page-authored route(s) it would take, one "Load into calculator" away. Causally SECONDARY by
   construction — selection renders route cards only; loading goes through the ordinary
   perspective path as an explicit counterfactual and NEVER sets the hero estimate. The full
   evidence catalog (claims, verbatim, relations) sits one expansion below (#board-catalog). */
let FRONT_DOOR_SEL = null;
function renderFrontDoor() {
  const chips = $("range-chips"); if (!chips) return;
  chips.textContent = "";
  const ranked = rankExplorations();
  BOARD_BUCKET_ORDER.forEach(bid => {
    const b = MARGIN_BUCKETS.find(x => x.id === bid);
    const nRec = claimsForBucket(bid).length;
    const nRoutes = ranked.filter(p => (explorationComputedBucket(p) || {}).id === bid).length;
    const chip = mkEl("button", "range-chip");
    chip.type = "button"; chip.dataset.bucket = bid; chip.setAttribute("aria-pressed", "false");
    chip.append(mkEl("span", "chip-range", b.label));
    chip.append(mkEl("span", "chip-meta",
      (nRoutes ? nRoutes + " page-authored route" + (nRoutes === 1 ? "" : "s") : "no authored route — the central scenario is this range's anchor")
      + " · " + nRec + " sourced record" + (nRec === 1 ? "" : "s")));
    const cur = mkEl("span", "chip-current"); cur.hidden = true; chip.append(cur);
    chip.onclick = () => selectFrontDoorRange(bid);
    chips.append(chip);
  });
  renderFrontDoorDetail();
}
function selectFrontDoorRange(bid) {
  FRONT_DOOR_SEL = FRONT_DOOR_SEL === bid ? null : bid;
  document.querySelectorAll("#range-chips .range-chip").forEach(c =>
    c.setAttribute("aria-pressed", String(c.dataset.bucket === FRONT_DOOR_SEL)));
  renderFrontDoorDetail();
}
function renderFrontDoorDetail() {
  const det = $("front-door-detail"); if (!det) return;
  det.textContent = "";
  if (!FRONT_DOOR_SEL) { det.hidden = true; return; }
  det.hidden = false;
  const b = MARGIN_BUCKETS.find(x => x.id === FRONT_DOOR_SEL);
  det.append(mkEl("p", "fd-question", "What would have to be true for a " + b.label + " modeled unit serving margin (at the flagship scope: Claude Opus 4.x @ Reference 15:1/60%)?"));
  const ranked = rankExplorations(), total = ranked.length;
  const mine = ranked.filter(p => (explorationComputedBucket(p) || {}).id === b.id);
  if (mine.length) mine.forEach(p => det.append(boardConfigRow(p, ranked.indexOf(p) + 1, total)));
  else {
    det.append(mkEl("p", "fd-null", boardNoRouteStatement(b.id)));
    if (b.id === "b6080") {
      const median = PERSPECTIVES.find(x => x.id === "median");
      det.append(mkEl("p", "fd-null", "At the flagship scope the central scenario computes to ≈" + Math.round(explorationFlagshipMargin(median)) + "% — it is the default state of the calculator below."));
      det.append(centralReturnRow());
    }
  }
  const pl = mkEl("p", "fd-claims-line");
  pl.append("The sourced claims compatible with this range — and under what relation (verbatim where archived; reported figures labeled as such) — are in the ");
  const a = document.createElement("a"); a.href = "#board-" + b.id; a.textContent = "evidence catalog";
  a.onclick = () => { const c = $("board-catalog"); if (c) c.open = true; };
  pl.append(a, " below.");
  det.append(pl);
  updateBoard(); // sync loaded-route tags + current-scenario marker onto the fresh rows
}
/* Live mapping: highlight the bucket the CURRENT scenario's derived margin lands in — on the
   front-door chips AND the catalog cards — and mark a loaded route (both surfaces render
   .config-row). Read-only over the mechanism-first state — the board never writes it. */
/* Board state label, generated from the ACTUAL state — never a hardcoded "central" over a non-central
   number. Says "central scenario" ONLY for the clean Opus + median + model-default state. */
function boardStateLabel() {
  const id = computeIdentity();
  if (id.isCentral) return "derived from the central scenario (Claude) — the clean Model / Traffic-mix default";
  if (id.isCustom) return "derived from a USER-DEFINED Custom scenario (unsourced), not the central scenario";
  if (id.isCounterfactual) return "loaded from the page-authored “" + id.lensName + "” counterfactual route" + (id.isModified ? " (since edited — MODIFIED)" : "");
  if (id.isModified) return "derived from a MODIFIED scenario (" + id.modelName + " · " + id.stateLabel.replace(/^MODIFIED[^—]*— /, "").replace(/^MODIFIED\s*/, "") + "), not the central scenario";
  return "derived from the “" + id.lensName + "” cost lens on " + id.modelName + ", not the central scenario";
}
function updateBoard() {
  const sec = document.getElementById("evidence-board"); if (!sec) return;
  const curM = currentModel(), curP = currentPersp();
  const suppressed = curM && curP && pairingSeverity(curM, curP) === "hard" && !FORCE_EXPLORATORY;
  const pct = workload(S).margin * 100;
  const b = (!suppressed && isFinite(pct)) ? bucketForMargin(pct) : null;
  sec.querySelectorAll(".bucket").forEach(card => {
    const isCur = !!(b && card.dataset.bucket === b.id);
    card.classList.toggle("bucket-current", isCur);
    const chip = card.querySelector(".bucket-current-note");
    if (chip) {
      chip.hidden = !isCur;
      // Generated from ACTUAL state (public-release P0): never a hardcoded "central cost lens". Names the
      // real lens/replay/route and says "MODIFIED" whenever the config differs from the central defaults.
      if (isCur) chip.textContent = "◉ current scenario lands here: ≈" + Math.round(pct) + "% — " + boardStateLabel() + "; nothing on this board sets it";
    }
  });
  sec.querySelectorAll(".range-chip").forEach(chip => {
    const isCur = !!(b && chip.dataset.bucket === b.id);
    const note = chip.querySelector(".chip-current");
    if (note) {
      note.hidden = !isCur;
      if (isCur) note.textContent = "◉ current scenario lands here (≈" + Math.round(pct) + "% — " + boardStateLabel() + ", never set here)";
    }
  });
  sec.querySelectorAll(".config-row:not(.central-return-row)").forEach(row => {
    const loaded = !!(curP && curP.id === row.dataset.config);
    row.classList.toggle("config-loaded", loaded);
    const tag = row.querySelector(".config-loaded-tag");
    if (tag) tag.hidden = !loaded;
  });
  // Central-return rows sync on isCentralClean(), NOT on persp id — persp "median" with edited
  // fields or a non-Opus model is a MODIFIED state and must not read "currently loaded".
  const centralNow = isCentralClean();
  sec.querySelectorAll(".central-return-row").forEach(row => {
    row.classList.toggle("config-loaded", centralNow);
    const tag = row.querySelector(".config-loaded-tag");
    if (tag) tag.hidden = !centralNow;
    const btn = row.querySelector(".central-return-btn");
    if (btn) btn.hidden = centralNow;
  });
}

/* ---------- refresh ---------- */
function lensRangeForCurrentModel() {
  const m = currentModel();
  if (!m) return null;
  // engine.lensSpan at the EFFECTIVE resolved traffic — under a replay the comparator lenses run
  // at the replay's locked mix, not the hidden model default (final-gate P0: like-for-like only).
  const tr = resolvedTraffic();
  const span = lensSpan(m, tr ? { mode: "custom", ioRatio: tr.ioRatio, cacheHit: tr.cacheHit } : currentTrafficSel());
  // Pin the comparator lenses to byte-identical resolved traffic (anti-shopping), but LABEL the span with
  // the resolved profile's real name — not the synthetic "custom" used only to pin the numbers
  // (final-gate P1: on a default Reference load the span wrongly read "at Custom").
  if (span && tr && tr.label) span.label = tr.label;
  return span;
}
/* ---------- state identity (public-release P0: the result surface must always name its own state) ----------
   The hero can show a valid CONDITIONAL number; a cropped screenshot or crafted permalink turns it into a
   misleading claim unless the state is named ON the result. presetIsClean() catches ANY preset-owned field
   deviation (including permalink overlays and crafted out-of-slider values), so a "central scenario" label
   can never sit over an edited/crafted number. Nothing here rejects out-of-slider permalink values (legit
   replays legitimately publish operating points outside the visible slider bounds) — it LABELS them. */
function presetIsClean() {
  const m = currentModel(), p = currentPersp();
  if (!m || !p) return false; // a synthetic modified state (no perspective) is never "clean"
  const resolved = applyPresetSettings(m, p, currentTrafficSel());
  return Object.keys(resolved).every(k => JSON.stringify(S[k]) === JSON.stringify(resolved[k]));
}
/* Crafted fields = numeric fields sitting OUTSIDE the visible slider range AND DEVIATING from the
   resolved preset. The deviation clause is load-bearing: a legitimate replay/lens legitimately
   publishes operating points outside the sliders (e.g. xAI cash rentMult 0.156 < the 0.5 slider min),
   and a CLEAN replay must never read "crafted". Only an out-of-slider value that also differs from the
   preset default is the crafted-permalink signature. */
function craftedFields() {
  const m = currentModel(), p = currentPersp();
  const resolved = (m && p) ? applyPresetSettings(m, p, currentTrafficSel()) : null;
  const out = [];
  SECTIONS.forEach(sec => sec.params.forEach(pp => {
    if (typeof pp.min !== "number" || typeof pp.max !== "number") return;
    const v = S[pp.k];
    if (typeof v !== "number") return;
    const outside = v < pp.min || v > pp.max;
    const deviates = !resolved || JSON.stringify(v) !== JSON.stringify(resolved[pp.k]);
    if (outside && deviates) out.push(pp.label + " = " + v);
  }));
  return out;
}
function isCentralClean() {
  const m = currentModel(), p = currentPersp();
  return !!(m && p && m.id === "opus" && p.id === "median" && TRAFFIC.mode === "native" && !MODIFIED_FROM && !EXPLORATION_ORIGIN && presetIsClean());
}
function computeIdentity() {
  const m = currentModel(), p = currentPersp(), tr = resolvedTraffic();
  const isCustom = !!(m && m.id === "custom");
  const modelName = m ? m.name.replace(" (define with sliders)", "") : "—";
  const trafficTxt = tr ? tr.ioRatio + ":1 / " + tr.cacheHit + "%" + (tr.locked ? " (locked)" : "") : "—";
  const clean = presetIsClean(), oob = craftedFields();
  const lensBare = pn => (pn || "").replace(/^\[[^\]]*\]\s*/, "");
  let lensName = "—", stateLabel = "—", cls = "id-lens", isModified = false, isCounterfactual = false, isCentral = false;
  if (EXPLORATION_ORIGIN) {
    lensName = "“" + EXPLORATION_ORIGIN.subtitle + "” route"; cls = "id-counterfactual"; isCounterfactual = true; isModified = true;
    stateLabel = "MODIFIED range-exploration counterfactual — not an estimate";
  } else if (MODIFIED_FROM) {
    lensName = MODIFIED_FROM; cls = "id-modified"; isModified = true;
    stateLabel = "MODIFIED scenario (derived from " + MODIFIED_FROM + ") — not the published operating point";
  } else if (p && p.kind === "exploration") {
    lensName = p.subtitle || lensBare(p.name); cls = "id-counterfactual"; isCounterfactual = true;
    stateLabel = "range-exploration counterfactual — page-authored, not an estimate" + (clean ? "" : " · MODIFIED");
    isModified = !clean;
  } else if (p) {
    lensName = lensBare(p.name);
    if (!clean) {
      isModified = true; cls = "id-modified";
      stateLabel = "MODIFIED — fields off the “" + lensBare(p.name) + "” preset default"
        + (oob.length ? "; CRAFTED (values outside the slider range: " + oob.join(", ") + ")" : "");
    } else if (m && m.id === "opus" && p.id === "median" && TRAFFIC.mode === "native") {
      isCentral = true; cls = "id-central"; stateLabel = "central scenario — clean default";
    } else {
      stateLabel = p.kind === "replay" ? "clean replay — published operating point" : "clean cost lens";
    }
  }
  if (isCustom) { cls = isModified ? "id-modified" : "id-custom";
    stateLabel = "USER-DEFINED, UNSOURCED — not a provider estimate" + (isModified ? " · edited" : "; inherits the " + lensName + " lens + model-default hardware"); }
  return { modelName, isCustom, trafficTxt, lensName, stateLabel, cls, isModified, isCounterfactual, isCentral, clean, oob };
}
function identitySummary() { const id = computeIdentity(); return id.modelName + " · " + id.trafficTxt + " · " + id.lensName + " · " + id.stateLabel; }
function renderIdentityStrip() {
  const el = $("identity-strip"); if (!el) return;
  const id = computeIdentity();
  el.className = "identity-strip " + id.cls;
  el.textContent = "";
  const chip = (txt, c) => { const s = document.createElement("span"); s.className = "id-chip" + (c ? " " + c : ""); s.textContent = txt; return s; };
  el.append(chip("This result: ", "id-lead"));
  el.append(chip(id.modelName + (id.isCustom ? " — user-defined, unsourced" : ""), "id-model"));
  el.append(chip("traffic " + id.trafficTxt, "id-traffic"));
  el.append(chip(id.lensName, "id-lensname"));
  el.append(chip(id.stateLabel, "id-state"));
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "id-reset ghost-btn"; btn.textContent = "↺ Return to central scenario";
  btn.onclick = returnToCentral; btn.hidden = id.isCentral;
  el.append(btn);
}
function returnToCentral() {
  $("model-preset").value = "opus"; $("persp-preset").value = "median";
  TRAFFIC = { mode: "native", profileId: null };
  const c = $("model-dossier-card"); if (c) c.open = false;
  FORCE_EXPLORATORY = false;
  ["__modified", "__modified-exploration"].forEach(v => { const o = $("persp-preset").querySelector('option[value="' + v + '"]'); if (o) o.remove(); });
  applyPreset(); // resets MODIFIED_FROM / EXPLORATION_ORIGIN and rebuilds S = clean central
  history.replaceState(null, "", location.origin + location.pathname); // drop any ?s= permalink so the reset truly resets
}
function updateTiles() {
  const wl = workload(S);
  const curM = MODELS.find(x => x.id === $("model-preset").value);
  const curP = PERSPECTIVES.find(x => x.id === $("persp-preset").value);
  const heroLabel = document.querySelector(".tile-hero .tile-label");
  if (heroLabel) heroLabel.childNodes[0].textContent = (curM && curM.scenario) ? "Scenario result (tariff-only preset) " : "Unit serving margin — not company GM ";
  if (curM && curP && pairingSeverity(curM, curP) === "hard" && !FORCE_EXPLORATORY) {
    $("out-margin").textContent = "n/a";
    $("out-margin-note").textContent = "INCOMPATIBLE PAIR — this perspective is scoped to a different provider; no headline is computed. ";
    const btn = document.createElement("button");
    btn.className = "ghost-btn"; btn.textContent = "Compute anyway (exploratory)";
    btn.onclick = () => { FORCE_EXPLORATORY = true; renderAll(); };
    $("out-margin-note").append(btn);
    $("out-cost").textContent = "—"; $("out-price").textContent = "—";
    $("out-cost-out").textContent = "—"; $("out-cost-in").textContent = "";
    return;
  }
  if (curM && curP && pairingSeverity(curM, curP) === "hard" && FORCE_EXPLORATORY) {
    // fall through but tag everything exploratory below
  }
  // Hero shows whole-point ≈ values (conditional scenario outputs manufacture no tenths of
  // epistemic precision); the unrounded diagnostic stays inspectable via the title attribute.
  $("out-margin").textContent = isFinite(wl.margin) ? "≈" + Math.round(wl.margin * 100) + "%" : "—";
  $("out-margin").title = isFinite(wl.margin) ? "unrounded: " + (wl.margin * 100).toFixed(2) + "% (conditional scenario output; input uncertainty is not propagated)" : "";
  // Bands are descriptive of cited ranges, never attributed to a named analyst (reception audits:
  // a page-computed state is not a person's estimate). Interval-aware (P0-5): "within the cited
  // 90–95%" is asserted ONLY when the value actually sits in [90,95]; above 95 the value is
  // OUTSIDE that cited interval and says so (still the open ≥90% bucket).
  { const pct = wl.margin * 100;
    $("out-margin-note").textContent = pct > 95 ? "above the cited 90–95% unit-serving claim interval (≥90% bucket); this value is calculator-generated" : pct >= 90 ? "within the cited 90–95% unit-serving claim range; this value is calculator-generated" : pct >= 80 ? "within the cited >80% unit-serving claim range; this value is calculator-generated" : pct >= 50 ? "between the cited bull and reported-margin ranges; calculator-generated" : "at or below the cited reported-margin range; calculator-generated"; }
  // Custom model: the "within the cited … claim range" framing never applies to a user-defined scratch
  // model — replace it with a persistent unsourced marker naming the inherited lens/fleet.
  if (curM && curM.id === "custom") {
    const idc = computeIdentity();
    $("out-margin-note").textContent = "USER-DEFINED SCENARIO — Custom is a scratch model with no provider and no sourced parameters; this ≈" + Math.round(wl.margin * 100) + "% is not a provider estimate and is not compared to any cited claim range. It " + (idc.isModified ? "is edited" : "inherits the " + idc.lensName + " cost lens + the model-default hardware blend") + ".";
  }
  // Preset-owned field deviation (crafted permalink or an edited clean lens): flag MODIFIED even when the
  // PERSPECTIVE identity is clean (median/gptpro/replay) but the FIELDS were overridden — closes the
  // ≈99%-under-"Central-scenario" crafted-permalink vector. (Synthetic modified/exploration states already
  // carry their own MODIFIED prefix below; Custom carries its own marker above.)
  if (curM && curM.id !== "custom" && curP && !MODIFIED_FROM && !EXPLORATION_ORIGIN && curP.kind !== "exploration" && !presetIsClean()) {
    const oob = craftedFields();
    $("out-margin-note").textContent = "MODIFIED — fields deviate from the “" + curP.name.replace(/^\[[^\]]*\]\s*/, "") + "” preset default"
      + (oob.length ? "; CRAFTED (values outside the visible slider range: " + oob.join(", ") + ")" : "")
      + ", NOT the clean central scenario. " + $("out-margin-note").textContent;
  }
  if (curP && curP.kind === "analyst") $("out-margin-note").textContent = "SITE-AUTHORED RECONSTRUCTION SCENARIO — not a source estimate. " + $("out-margin-note").textContent;
  if (MODIFIED_FROM) $("out-margin-note").textContent = "MODIFIED SCENARIO (derived from " + MODIFIED_FROM + ") — not the published operating point; replay attribution removed. " + $("out-margin-note").textContent;
  if (curM && curM.scenario) $("out-margin-note").textContent = "TARIFF SCENARIO — architecture unidentified; this borrows the selected serving assumptions and is NOT a provider estimate. " + $("out-margin-note").textContent;
  if (curM && curP && pairingSeverity(curM, curP) === "hard" && FORCE_EXPLORATORY) $("out-margin-note").textContent = "⚠ EXPLORATORY (forced incompatible pairing) — " + $("out-margin-note").textContent;
  // Range-exploration hero identity (v2.1.3 M3): a loaded route is an explicit counterfactual,
  // never an estimate — the prefix is persistent while the config is active, plus a live drift
  // line whenever the current model/traffic selection moves the result off the authored range.
  // FIX 2: route identity reflects off-authored-scope viewing on THREE surfaces — the selector
  // identity label (below), the hero prefix and the drift line — while keeping compose+drift
  // (changing model/traffic never exits config identity; only a perspective switch does).
  {
    const ps = $("persp-preset");
    const trNow = resolvedTraffic();
    PERSPECTIVES.filter(x => x.kind === "exploration").forEach(x => { // reset every route label to base (idempotent)
      const o = ps.querySelector('option[value="' + x.id + '"]'); if (o) o.textContent = x.name;
    });
    if (curP && curP.kind === "exploration" && explorationOffScope(curM, trNow)) {
      const o = ps.querySelector('option[value="' + curP.id + '"]');
      if (o) o.textContent = curP.name.replace("[range exploration]",
        "[range exploration · viewed at " + curM.name + " · " + trNow.ioRatio + ":1/" + trNow.cacheHit + "% — outside authored scope]");
    }
  }
  if (curP && curP.kind === "exploration") {
    const rb = explorationComputedBucket(curP);
    const curPct = wl.margin * 100;
    const inR = rb && isFinite(curPct) && curPct >= rb.lo && curPct < rb.hi;
    const trNow = resolvedTraffic();
    const off = explorationOffScope(curM, trNow);
    $("out-margin-note").textContent = "RANGE EXPLORATION — page-authored counterfactual; not an estimate. A page-authored reconstruction of one route to the " + (rb ? rb.label : "claimed") + " range (authored at the flagship scope: Claude Opus 4.x @ Reference 15:1/60%), not any claimant's model."
      + (off ? " VIEWED OFF AUTHORED SCOPE — currently " + curM.name + " · " + (trNow ? trNow.ioRatio + ":1/" + trNow.cacheHit + "%" : "?") + "; range membership was defined at the flagship scope and is recomputed live here." : "")
      + (isFinite(curPct) ? " At the current selection it lands at ≈" + Math.round(curPct) + "% — " + (inR ? "inside" : "OUTSIDE") + " the range it was authored for." : "")
      + " " + $("out-margin-note").textContent;
  }
  if (EXPLORATION_ORIGIN) $("out-margin-note").textContent = "MODIFIED RANGE EXPLORATION — derived from the page-authored route “" + EXPLORATION_ORIGIN.subtitle + "” but since edited; route identity and ranking metadata removed; not an estimate. " + $("out-margin-note").textContent;
  {
    const m = curM;
    const p = curP;
    if (m && p && p.id === "dive" && m.diveMetric === "output")
      $("out-margin-note").textContent += ` · OUTPUT-TOKEN margin (the §10 metric): ${fmtPct(1 - wl.cOut / S.priceOut)}`;
  }
  const lr = lensRangeForCurrentModel();
  if (lr && !lr.single) $("out-margin-note").textContent += ` · cost-lens span at ${lr.label}: ${lr.lo < -1 ? "<−100%" : fmtPct(lr.lo)}–${fmtPct(lr.hi)} across ${lr.n} lenses (traffic held fixed; excludes traffic-mix uncertainty; analysts, replays and out-of-scope lenses excluded)`;
  else if (lr && lr.single) $("out-margin-note").textContent += ` · only one cost lens is compatible at this scope (${fmtPct(lr.lo)}) — see the valuation replays for the invoice question`;
  if (EXPLORATION_ORIGIN) $("out-margin-note").append(" ", explorationRestoreBtn()); // one-click restore (P0-5 breadcrumb)
  $("out-cost").textContent = fmt$(wl.costMix);
  $("out-price").textContent = fmt$(wl.priceMix);
  { const pn = document.getElementById("out-price-note");
    if (pn) pn.textContent = (S.cacheHit > 0 && (S.cacheWriteShare || 0) === 0) ? "cache reads are modeled, but cache-write billing is 0% — realized price may be incomplete" : ""; }
  $("out-cost-out").textContent = fmt$(wl.cOut);
  $("out-cost-in").textContent = "fresh input: " + fmt$(wl.cIn) + " · cache read: " + fmt$(wl.cCache);
  { const w = blendWeights(S);
    const unanchored = ["tpu7", "trn2", "trn3"].reduce((a, k) => a + (w[k] || 0), 0);
    const un = document.getElementById("out-margin-unanchored");
    if (un) un.textContent = unanchored > 0 ? "Unanchored-MFU traffic share: " + Math.round(unanchored * 100) + "% (TPU/Trainium have no public serving anchors — analyst-estimated MFUs)" : ""; }
  const f = feasibility(S);
  $("out-feas").textContent = f.gpus + " GPUs min";
  $("out-feas-note").textContent = `${Math.round(f.gb).toLocaleString()} GB weights (${S.precision}) on ${HW[f.domKey].name} ⇒ ≥${f.racks} × 72-rack${f.racks > 1 ? "s" : ""}`;
}
function renderAll() {
  updateTiles(); renderIdentityStrip(); renderHwChart(); renderStackChart(); renderSensChart(); renderGenChart(); renderSubChart(); updateBoard();
  refreshScenarioName(); // keep the save card's auto-name tracking the state (user-typed names stick)
}
function onChange(rebuild) {
  if (rebuild) { buildControls(); buildSubControls(); }
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(renderAll, 30);
}
function fullRefresh() { buildControls(); buildSubControls(); renderAll(); }

/* ---------- skin + theme ----------
   The pre-paint head script (index.html) resolves and stamps data-skin/data-theme before
   first render; these toggles just flip the attributes and persist. Presentation only —
   no engine state is touched. */
function refreshSkinToggle() {
  const b = $("skin-toggle");
  if (b) b.textContent = "Skin: " + (document.documentElement.dataset.skin === "editorial" ? "Editorial" : "App");
}
function syncTurnstileTheme(theme) {
  const ts = document.querySelector(".cf-turnstile");
  if (!ts || !window.turnstile) return;
  ts.dataset.theme = theme;
  try { window.turnstile.remove(ts); window.turnstile.render(ts, { sitekey: ts.dataset.sitekey, action: ts.dataset.action, theme }); } catch {}
}
$("theme-toggle").onclick = () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem("im_theme", root.dataset.theme); }
  catch (e) { console.warn("Theme preference not persisted (storage unavailable):", e); }
  syncTurnstileTheme(root.dataset.theme);
  renderAll();
};
{ const b = $("skin-toggle");
  if (b) b.onclick = () => {
    const root = document.documentElement;
    root.dataset.skin = root.dataset.skin === "editorial" ? "app" : "editorial";
    try { localStorage.setItem("im_skin", root.dataset.skin); }
    catch (e) { console.warn("Skin preference not persisted (storage unavailable):", e); }
    refreshSkinToggle();
    renderAll();
  }; }
refreshSkinToggle();

/* ---------- init ---------- */
fillPresetSelects();
renderBoard(); // static registry render (M3); per-state highlight rides renderAll → updateBoard
renderFrontDoor(); // range-explorer entry point above the catalog; renders route cards only — never writes the hero state
if (loadScenarioFromURL()) { fullRefresh(); } else { applyPreset(); }
renderNormalized();
{ const b = document.getElementById("share-scenario"); if (b) b.onclick = copyScenarioLink; }
wireLoadOpLinks(); // §10/§6 "Load this operating point ↑" links (selector dissolve)
