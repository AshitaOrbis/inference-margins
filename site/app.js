/* Frontier Inference Margins — UI layer.
   Pure model/data/engine lives in engine.js (loaded first; also node-importable for tests). */
"use strict";

let S = structuredClone(DEFAULTS);
/* b9 spec-decode LEVER ([N-CORRECTION-LIFETIME]). EXACTLY ONE browser-owned correction record. Its
   producers are every browser call site of sanitizeScenarioDiff — the saved-scenario restore and
   the two URL paths — enumerated rather than described, because naming a function instead of its
   call sites is how two of the three were missed once already.

   MCP and the Worker never own this: they are separate processes and return corrections[] as a
   response-local envelope field, so the browser adopts no remote envelope. That is a statement
   about the CURRENT design, not a permanent firewall — any future remote response that can set S
   must extend this block, with its own producer and transaction, BEFORE it lands. */
let activeCorrection = null;
/* b9 spec-decode LEVER: the D-SD-7 reset announcement. A separate record from `activeCorrection`
   because they are separate events with separate ratified bytes — a correction reports a value a
   LINK or a SAVED SCENARIO carried and this page overrode; a reset reports a value THIS USER set
   and this page zeroed when they moved the gate. Conflating them would print the wrong sentence. */
let specDecResetAnnounced = false;
/* Clearing the FLAG is not clearing the NOTICE. An ordinary slider edit calls onChange() without
   rebuilding controls, so nulling the variable alone leaves the rendered line on screen — the
   announcement gone from the state and the reader still being told their value was reset. This is
   the same failure clearActiveCorrection exists to prevent, and it was reproduced here once before
   the CDP probe caught it. */
function clearSpecDecResetNotice() {
  specDecResetAnnounced = false;
  for (const el of document.querySelectorAll(".specdec-reset")) el.remove();
}
function clearActiveCorrection() {
  activeCorrection = null;
  /* Removes the RENDERED notice as well as the state. An ordinary slider edit calls onChange()
     without rebuilding controls, so clearing only the variable would leave a stale notice on
     screen — the record would be gone and the reader would still be told their value was reset. */
  for (const el of document.querySelectorAll(".specdec-correction")) el.remove();
}
/* The ONLY way any browser path writes S from a sanitize result. The assignment is an APP-side act,
   not a property of the engine call: an implementer who changed only restoreSavedPresetState would
   still silent-force on both URL paths, so every browser CONSUMER of a sanitize result that writes
   S runs this. Order is pinned — the old record and its DOM notice die FIRST, the new one is created
   from the produce result, and the refresh that follows MUST NOT clear (or the record dies in the
   tick that created it). The record is cleared at the START of the NEXT user edit, preset
   application or scenario load — a subsequent action, never the one that produced it. */
function commitScenario(produce) {
  clearActiveCorrection();
  const { state, corrections } = produce();
  S = state;
  activeCorrection = (Array.isArray(corrections) && corrections.length === 1) ? corrections[0] : null;
  return activeCorrection;
}
/* Traffic-mix axis selection (v2.1.2). Modes: native | explicit | custom | legacy-custom.
   Replays override any selection (atomic operating points) — resolveTraffic() is the authority. */
let TRAFFIC = { mode: "native", profileId: null };
/* ---------- Slice C (design memo im4-sliceC-design-memo v9, C-3/C-8): the STORED
   identity enums. NEVER inferred from weights at display time; initialization runs
   ONLY on IDENTITY-RESETTING preset applications (first paint + model switch —
   tracked via LAST_APPLIED_MODEL; reset gestures null the tracker explicitly);
   every other event follows the C-3/C-8 transition tables. ---------- */
let FLEET_ID = "preset";      // a FLEETS id | "custom" | "preset"
let GENERIC_FLEET_ID = null;   // im-arc T3: UI return point; the numeric advanced state lives in v7 sections
let TOTAL_CASE_ID = "preset"; // a TOTAL_CASES id | "custom" | "preset"
let LAST_APPLIED_MODEL = null; // null => next preset application is IDENTITY-RESETTING
function isNamedFleetId(id) { return Object.prototype.hasOwnProperty.call(FLEETS, id); }
// Mirror of the D-2 chokepoint's blendExplicit predicate (applyPresetSettings) — the
// initialization condition is the CHOKEPOINT PREDICATE, not blend equality (memo C-3).
function presetStackOwnsBlend(m, p) {
  const pset = (p.id === "dive") ? (m.dive || PERSPECTIVES.find(x => x.id === "median").set) : p.set;
  return ("blend" in (m.set || {})) || ("blend" in (pset || {}))
    || (p.id === "dive" && m.dive && "blend" in m.dive);
}
function initTotalCaseFor(m, total) {
  if (!TOTAL_CASE_SCOPE.includes(m.id)) return "preset";
  const hit = Object.entries(TOTAL_CASES).find(([, c]) => c.totalB === total);
  return hit ? hit[0] : "custom";
}
/* The C-3/C-8 machines at a preset application. RESETTING (first paint, model
   switch, explicit reset gestures): prior named selection discarded; chokepoint
   rule assigns DEFAULT_FLEET_ID or "preset"; totalCase value-match init.
   NON-RESETTING (perspective switch, traffic-profile switch — CA-2: the traffic
   axis never owns a blend, so it takes the same row as a no-blend perspective
   switch): identity-agnostic UNCHANGED; an ACTIVE named selection RE-APPLIES
   through the C-1 seed (R1-6(b) mechanism — without it the chokepoint rebuild
   would silently turn a declared-topology identity into a lie); named totalCase
   forced to "custom" when the re-applied total breaks its totalB equality;
   custom/preset labels pass through. */
function applyIdentitiesAfterPresetApplication(m, p) {
  const resetting = (m.id !== LAST_APPLIED_MODEL);
  LAST_APPLIED_MODEL = m.id;
  const owns = presetStackOwnsBlend(m, p);
  if (resetting) {
    FLEET_ID = (!owns && FLEETS[DEFAULT_FLEET_ID].models.includes(m.id)) ? DEFAULT_FLEET_ID : "preset";
    TOTAL_CASE_ID = initTotalCaseFor(m, S.total);
  } else {
    if (owns) FLEET_ID = "preset";
    else if (isNamedFleetId(FLEET_ID) || isCustomFleetId(FLEET_ID)) {
      // b9 M4 impl-gate P0-1: a cf: identity survives a non-resetting preset/lens
      // application and its aggregate MIRROR must re-seed exactly like a named fleet's
      // baseline — v1 left the mirror to zero out, and the encoder then emitted a blend
      // key beside the cf: identity, minting a token its own decoder rejected.
      const fb = fleetBaselineBlend(FLEET_ID, S, { modelId: m.id, customDonor: S.customDonor });
      if (fb) S.blend = fb; // default: chokepoint already seeded it (equal); non-default/cf: declared re-seed
    }
    if (Object.prototype.hasOwnProperty.call(TOTAL_CASES, TOTAL_CASE_ID)
        && TOTAL_CASES[TOTAL_CASE_ID].totalB !== S.total) TOTAL_CASE_ID = "custom";
  }
}
/* Scenario-axis edit hook (memo C-3/C-8 rows): a total edit clears the bookmark to
   "custom" (one direction); a total/precision edit while the DEFAULT fleet is
   selected re-derives the seeded members SYNCHRONOUSLY (a SYSTEM re-seed — never a
   user blend edit, never forks identity; the blend state is never stale relative
   to the D-1 inputs, so the encoder's CURRENT-state baseline equality holds). */
/* b9 spec-decode LEVER (§6.1 UI staleness). Lock/disabled state is captured during buildParam, and a
   stackMult edit calls onChange() WITHOUT rebuilding controls — so once the gate moves, the specDec
   row is stale: a disabled control beside an open gate, or a live one beside a shut gate.

   Reconcile ONLY the dependent row. The obvious fix — rebuild the controls — would replace the
   `stackMult` input the user is DRAGGING, losing pointer capture after the first movement of the
   drag, and "rebuilt or locally refreshed" wording that permits it is what T-19's negative assertion
   forbids. Replacing one sibling row leaves the dragged input untouched, node identity included. */
/* ---------- SHARED REVEAL (owner annotations 2026-08-17: ndadaca, n12b450, n45cb3d) ----------
   Three of his annotations are the same complaint in three places — the control that answers the
   question exists, and the page will not take you to it ("the edits are in sections collapsed to
   the left but that's not ergonomic"). This is that move, factored once: open every collapsed
   ancestor, scroll the row into view, hand focus to a caller-chosen control.

   Deliberately NOT a rewire of lowEvidenceAffordance, which does the same three things. That one's
   focus policy is pinned by the b9 CDP suite (T-14 asserts the two utilization rows still focus
   their enabled `util` control exactly as before, and the `.info`/range-handle exclusions exist
   because two earlier fixes failed against that code). Its behaviour is evidence, not convention,
   so it keeps its own copy rather than inheriting a generalization written for other callers. */
function revealParamRow(key, pickFocus) {
  const row = document.querySelector('[data-param-key="' + key + '"]');
  if (!row) return false;                                    // no row = no jump; never a dead link
  /* A control inside a closed <details> is not focusable — Chrome treats the subtree as
     content-visibility: hidden and focus() is a silent no-op — so the ancestors open FIRST. */
  for (let n = row.parentElement; n; n = n.parentElement)
    if (n.tagName === "DETAILS" && !n.open) n.open = true;
  row.scrollIntoView({ block: "center", behavior: "instant" });
  const target = (pickFocus && pickFocus(row)) || null;
  if (target && !target.disabled) { target.focus(); return true; }
  if (!row.hasAttribute("tabindex")) row.setAttribute("tabindex", "-1");
  row.focus();                                               // landed, announced, never focus-on-body
  return true;
}
/* ---------- CHART BAR → THE CONTROLS FOR THAT ACCELERATOR ----------
   Owner annotations n12b450 ("If I click these accelerators I should be able to edit their
   details, the edits are in sections collapsed to the left but that's not ergonomic") and n45cb3d
   ("Same as above, should be able to edit costs by clicking on accelerators to expand them").

   What it does NOT do is build a second editor inside the chart. There is already exactly one
   control per accelerator per question, and a duplicate would be a second place to set the same
   number — the shape this page refuses everywhere else. His complaint is reachability, so the fix
   is reachability: the bar takes you to the control that already exists, opening the section on
   the way. No value is written, so nothing here can move a rendered number.

   Kind is chosen by which chart was clicked, because the two charts ask different questions about
   the same row of pixels: the hardware chart is the accelerator's own reading ("details" — its
   share of the blend), the cost stack is its cost build-up ("costs" — its procurement dial).

   A leg carrying 0% traffic has NO per-leg cost row (disc-legs renders only legs in the mix, and
   inventing one would answer a question the reader did not ask). Rather than a dead click, that
   case falls back to the share row — the control that would put the leg into the mix, which is
   what has to happen first anyway. */
function revealHwRow(hwKey, kind) {
  const pick = k => document.querySelector('[data-hw-key="' + k + '"][data-hw-kind="' + kind + '"]');
  const row = pick(hwKey)
    || document.querySelector('[data-hw-key="' + hwKey + '"][data-hw-kind="share"]')
    || document.querySelector('[data-hw-key="' + hwKey + '"]');
  if (!row) return false;
  for (let n = row.parentElement; n; n = n.parentElement)
    if (n.tagName === "DETAILS" && !n.open) n.open = true;
  row.scrollIntoView({ block: "center", behavior: "instant" });
  const inp = row.querySelector("input[type=range]");
  if (inp && !inp.disabled) { inp.focus(); return true; }
  if (!row.hasAttribute("tabindex")) row.setAttribute("tabindex", "-1");
  row.focus();
  return true;
}
/* Makes one rendered bar a control surface. SVG shapes are not focusable and take no keyboard
   events on their own, so the bar is given the button role, a tab stop and Enter/Space — the
   annotation asks for a click, and a click-only affordance would be one more thing a keyboard
   reader can see and cannot use. */
function makeHwMarkNavigable(node, hwKey, kind, label) {
  node.style.cursor = "pointer";
  node.setAttribute("role", "button");
  node.setAttribute("tabindex", "0");
  node.setAttribute("aria-label", label);
  node.dataset.hwJump = hwKey;
  const go = ev => { ev.preventDefault(); ev.stopPropagation(); revealHwRow(hwKey, kind); };
  node.addEventListener("click", go);
  node.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") go(ev); });
}
/* The spec-decode gate's unlock affordance (owner annotation ndadaca). Rendered only under the
   D-SD-7 gate; see the call site for why the replay lock is excluded. */
function specDecGateJump() {
  const b = document.createElement("button");
  b.type = "button"; b.className = "low-evidence-jump specdec-gate-jump";
  b.dataset.jumpTo = "stackMult";
  b.textContent = "Take me to the stack setting →";
  b.onclick = () => {
    revealParamRow("stackMult", row => {
      /* The tick that OPENS the gate, compared through the engine's own epsilon predicate rather
         than a literal — app.js snaps slider writes with Math.round(v/step)*step, which yields
         0.7000000000000001, and `=== 0.7` is false on every drag that lands there. */
      const tick = [...row.querySelectorAll("[data-tick-value]")]
        .find(el => stackAtMtpFreeTick(Number(el.dataset.tickValue)));
      return tick && !tick.disabled ? tick : row.querySelector("input[type=range]");
    });
  };
  return b;
}
function reconcileSpecDecRow() {
  const row = document.querySelector('[data-param-key="specDec"]');
  if (!row || !row.parentNode) return;                       // the section is collapsed or not built
  const sec = SECTIONS.find(x => x.params && x.params.some(q => q.k === "specDec"));
  const param = sec && sec.params.find(q => q.k === "specDec");
  if (!param) return;
  row.replaceWith(buildParam(param));                        // value, ticks, disabled, why-line, reset
}
function afterScenarioAxisEdit(k) {
  /* b9 M5 (§10.3): the interlock transitions ONLY here — i.e. only on slider-machinery writes.
     applyPresetSettings seeding the ratified trend prior never routes through this hook, which is
     what makes "ratified DEFAULTS do not count as user edits" structural. */
  applyInterlockAfterEdit(k);
  /* b9 spec-decode LEVER (D-SD-7, the reverse direction) — a one-directional gate is not a gate.
     Moving stackMult OFF the tick while credit is selected resets specDec to 1.00 LOUDLY and with
     attribution, mirroring the M5 D-12 zeroing rule so a headline move is never silent.

     The announcement is cleared at the START of this hook and set by it, never by the generic
     edit-clear: noteUserEdit() runs AFTER this in the same oninput tick, so sharing that clear
     would kill the record in the tick that created it. */
  clearSpecDecResetNotice();
  if (k === "stackMult" && typeof S.specDec === "number" && S.specDec > 1 && !specDecGateAllows(S)) {
    S.specDec = 1.00;
    specDecResetAnnounced = true;
  }
  if (k === "stackMult") reconcileSpecDecRow();
  if (k === "total" && TOTAL_CASE_ID !== "custom") TOTAL_CASE_ID = "custom";
  if ((k === "total" || k === "precision") && FLEET_ID === DEFAULT_FLEET_ID) {
    const m = currentModel(); if (!m) return;
    const fb = fleetBaselineBlend(DEFAULT_FLEET_ID, S, { modelId: m.id, customDonor: S.customDonor });
    if (fb) S.blend = fb; // RA-4 null: the seeded blend stands; gate-6 owns the empty case
  }
}
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
function appEngineContext(m = currentModel(), tr = resolvedTraffic(), state = S) {
  if (!m) throw new Error("current model identity is required for the v2.2 roofline path");
  // customDonor (slice-3 review R7 P1 fix): threaded from the STATE being rendered, not the
  // global S default, so appEngineContext(m, tr, someOtherState) stays correct for callers that
  // pass an explicit state (e.g. a per-generation chart computing on a structuredClone of S).
  const perspective = state === S ? currentPersp() : null;
  return makeScenarioContext(m, tr, state && state.customDonor,
    perspective && perspective.kind, perspective && perspective.id);
}
/* b9 M4 (memo §3.1): the live custom-fleet selection rides the EXPLICIT
   renderOpts.customFleet channel. Scoped by OBJECT IDENTITY to the live S — chart
   callers that compute on structuredClones (per-accelerator counterfactuals, spans)
   deliberately fall back to the aggregated per-donor blend mirror; leg-level detail
   renders on the per-leg panel, never silently inside a counterfactual chart. */
function appActiveCustomFleet(state) {
  if (state !== S || !isCustomFleetId(FLEET_ID)) return null;
  return customFleetSource().resolve(FLEET_ID);
}
function appWorkload(state = S, activeOverride, m = currentModel(), tr = resolvedTraffic(), renderOpts) {
  const cf = appActiveCustomFleet(state);
  if (cf) renderOpts = { ...(renderOpts || {}), customFleet: cf };
  return workload(state, activeOverride, appEngineContext(m, tr, state), renderOpts);
}
function appWorkloadOnHw(hw, state = S, activeOverride, m = currentModel(), tr = resolvedTraffic(), renderOpts) {
  return workloadOnHw(hw, state, activeOverride, appEngineContext(m, tr, state), renderOpts);
}
// b9 M3 (memo §3.4): the energy surface's app-side wrapper — same context threading as
// appWorkload so energy always describes the same operating point as the rendered costs.
function appFleetEnergy(state = S, activeOverride, m = currentModel(), tr = resolvedTraffic(), renderOpts) {
  // b9 M4 impl-gate P0-3: the energy surface must describe the SAME fleet as the cost
  // mix — the active custom fleet (section procurement/electricity plus leg physical
  // overrides) rides the identical merge appWorkload uses.
  const cf = appActiveCustomFleet(state);
  if (cf) renderOpts = { ...(renderOpts || {}), customFleet: cf };
  return fleetEnergy(state, activeOverride, appEngineContext(m, tr, state), renderOpts);
}
/* R2 (im4-r2-shipment-plan §1.2/§1.3; assembly-notes R-4b) — the landing-hero
   decision point. ONE constant, consulted at exactly ONE site (updateTiles); both
   branches implemented and tested so a mode change is a bounded constant-flip +
   pin re-mint, never a redesign.
   OWNER PICK 2026-07-23 (q-im-landing-hero-pick): **Option B — "policy-labeled"**:
   the landing hero displays the full-fleet number as an explicitly policy-labeled
   scenario output with every policy-unclean (capped) leg welded INLINE; a leg with
   NO achievable operating point still suppresses (gate-6 IFF clause ii is
   amended ONLY for the capped-not-infeasible case). The "suppress" branch
   (Option A) remains implemented and release-tested via the window hook.
   NOTE (same ruling, R3-shaping): the owner further ruled default fleet
   MEMBERSHIP should be serve-feasibility-filtered (an unservable leg belongs at
   weight 0 in the default, not rendered capped) — that is the top R3 design row
   in BACKLOG.md, not a change to this shipped R2 contract. */
const LANDING_HERO_MODE = (typeof window !== "undefined" && window.__LANDING_HERO_MODE_TEST__ === "suppress")
  ? "suppress" : "policy-labeled"; // window hook = the R-4b BOTH-BRANCHES test channel (console/tests only — never link-encoded, never persisted; flipping the shipped mode means editing THIS constant)
/* R2 (§1.6; memo §0-ter): the hero's three-point loaded-bytes policy-sensitivity
   receipt — evaluateAtPolicyBand recomputes THIS SURFACE's own metric (blend margin,
   %) at the three SAMPLED points. argMin/argMax computed, no continuity implied,
   never encoded into links. */
function heroPolicyBand(m = currentModel(), tr = resolvedTraffic()) {
  return evaluateAtPolicyBand(p => appWorkload(S, undefined, m, tr, { loadedWeightBytesPerParam: p }).margin * 100);
}
function policyBandReceiptText(band, unit) {
  const fv = v => (typeof v === "number" && isFinite(v)) ? "≈" + Math.round(v) + unit : "no numeric result";
  const pts = band.points.map(x => x.policyPoint + " B/param → " + fv(x.value)).join(" · ");
  return "sampled 3-point loaded-bytes policy sensitivity (no continuity implied): " + pts
    + (band.argMin != null ? " · sampled min at " + band.argMin + ", max at " + band.argMax : "")
    + " — solver output, never an observed deployment; the policy value is an engine constant and is never encoded into share links";
}
// Landing-surface predicate + the gate-6 decision (engine-owned): suppression can
// only ever apply to the clean central default — any user edit is a scenario
// surface and shows the disclosed, welded number instead.
// R3 (memo D-3a/D-4): the decision is mode-aware over the DERIVED membership —
// "policy-labeled" suppresses only on EMPTY derived membership (honest null);
// "suppress" (the strict tested branch) suppresses on ANY exclusion.
function appLandingHeroSuppressed() {
  return isCentralClean() && landingHeroSuppressed(S, appEngineContext(), LANDING_HERO_MODE);
}
// R3 (D-3c/D-3d): the derivation object, ONLY when the rendered blend IS the derived
// default (any user blend edit → null → the standard renormalization machinery).
function appDefaultMembership() {
  const d = deriveDefaultFleetMembership(DEFAULT_FLEET_ID, S, appEngineContext());
  if (!d || !d.memberLegCount) return null;
  const implied = Object.fromEntries(HW_ORDER.map(k => [k, 0]));
  d.members.forEach(l => { implied[l.hwKey] = l.declaredWeight; });
  return HW_ORDER.every(k => (S.blend[k] || 0) === implied[k]) ? d : null;
}
// Gate-7 central eligibility for the CURRENT state's landing fleet (identity-strip
// + hero-identity gate; memo §0-ter: any central label requires placement-verified
// eligibility — structurally impossible for closed models in R2).
function appLandingCentralEligible() {
  const sel = selectDefaultFleet(S, appEngineContext());
  return !!(sel.landing && sel.centralEligible.includes(sel.landing));
}
function appMarginOnHw(hwKey, state = S, activeOverride, m = currentModel(), tr = resolvedTraffic(), renderOpts) {
  return marginOnHw(hwKey, state, activeOverride, appEngineContext(m, tr, state), renderOpts);
}
/* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): the paired
   cards use the engine's basis switch. The active custom fleet remains an explicit render option. */
function appMarginOnBasis(state = S, basis, renderOpts) {
  const cf = appActiveCustomFleet(state);
  if (cf) renderOpts = { ...(renderOpts || {}), customFleet: cf };
  return marginOnBasis(state, basis, renderOpts);
}
function appBlendedLessorSpread(state = S, renderOpts) {
  const cf = appActiveCustomFleet(state);
  if (cf) renderOpts = { ...(renderOpts || {}), customFleet: cf };
  return blendedLessorSpread(state, renderOpts);
}
function appFeasibility(state = S, m = currentModel(), tr = resolvedTraffic()) {
  // b9 M4 impl-gate P0-2: the feasibility tile must see the SAME fleet the mix
  // computes — the active custom fleet rides the identical merge appWorkload uses.
  const cf = appActiveCustomFleet(state);
  return feasibility(state, appEngineContext(m, tr, state), cf ? { customFleet: cf } : undefined);
}
function appNoNumberReason(wl = null, f = null) {
  const status = wl && wl.fleetRenderable && (wl.fleetRenderable.legStatuses || [])
    .find(leg => leg.reason);
  const leg = f && (f.legs || []).find(row => row.reason);
  return (status && status.reason) || (leg && leg.reason)
    || "declared fleet infeasible at declared serving topology — no numeric result";
}
function appNoNumberLabel(reason) {
  return /planning rent|planning rate/i.test(reason)
    ? "planning rent unavailable"
    : /context window/i.test(reason)
    ? "context exceeds registered maxPos"
    : "infeasible at declared topology";
}
// IM3 exit-gate fix 1 + 2026-07-20 GPT Pro topology correction: delegates to engine.js's shared
// fleetRenderableDisclosure (primary=false), including any N_shard-only sensitivity clause. This
// chip is generic/dynamic, so it must not hardcode a family-correlation claim that is only true for
// the flagship default.
function fleetRenderableText(wl) {
  // R3 (D-3c): the membership story rides the SAME shared clause when the rendered
  // blend is the derived default (exclusions welded inline, canonical anchor named).
  return readerClause(fleetRenderableDisclosure(wl && wl.fleetRenderable, false, appDefaultMembership()));
}
/* bq-1141 M11 (GPT Pro 09-12 finding 4a, 09-25 finding 10): the shared engine clause is the MCP's and
   the historical receipts' text, so it is not reworded at the source — the T4 receipts reproduce it
   byte for byte. What a READER sees in captions, chips and the comparison table says the same thing in
   words: the solver's term "renderable at declared serving topology" and the policy's code identifier
   are translated here, at the one display funnel, and nowhere else. */
const READER_CLAUSE_WORDS = [
  [/ renderable at declared serving topology/g, " fit their declared serving setup"],
  [/\b[A-Z]+(?:_[A-Z]+)+ \(analyst planning default, dive §B; capacity-only, never sW\)/g, // the policy's code identifier
    "the analyst's capacity planning default, dive §B, which sizes memory capacity only and never enters the speed (throughput) calculation"],
];
function readerClause(text) {
  return READER_CLAUSE_WORDS.reduce((t, [re, words]) => t.replace(re, words), text || "");
}
function renderFleetRenderableChip(wl) {
  const el = $("out-fleet-renderable"); if (!el) return;
  const text = fleetRenderableText(wl);
  el.hidden = !text; el.textContent = "";
  if (text) {
    const chip = document.createElement("span"); chip.className = "id-chip id-state"; chip.textContent = text;
    el.append(chip);
  }
  // R2 (§1.9): the EMITTED five-status vector + two-boolean contract — the site's
  // fleet-status emission point (one per result surface; the MCP transports carry the
  // same fields structurally). UNVERIFIED is a first-class value, never hidden.
  const f = wl && wl.fleetRenderable;
  if (f && f.statusVector) {
    const sv = f.statusVector;
    const status = document.createElement("span");
    status.className = "id-chip id-status-vector";
    status.textContent = "fleet status — weightCapacity: " + sv.weightCapacity
      + " · fullMemory: " + sv.fullMemory + " · topologyLegal: " + sv.topologyLegal
      + " · slo: " + sv.slo + " · economics: " + sv.economics
      + " · renderableUnderPolicy(all legs): " + (f.allLegsRenderableUnderPolicy === true)
      + " · placementVerified: " + (f.placementVerified === true)
      + (f.placementVerified === true ? "" : " (central identity ineligible)");
    el.append(status);
    el.hidden = false;
  }
}
function renderFormCorrectionDebt() {
  const el = $("form-debt-disclosure"); if (!el) return;
  const debt = formCorrectionDebt(S, appEngineContext());
  const span = debt.identifiedSpan;
  el.textContent = "";
  if (!span) return;
  const cross = debt.legs.filter(leg => leg.crossQuantityExposure);
  const worst = cross.reduce((mx, leg) => Math.max(mx, leg.crossQuantityExposure.ratio), 0);
  const perLeg = debt.legs.filter(leg => leg.ratio !== null);
  const resid = debt.legs.filter(leg => leg.replicationResidual);
  const lead = document.createElement("strong");
  lead.textContent = "OPEN CALIBRATION DEBT — " + debt.notAResult + ". ";
  el.append(lead, document.createTextNode(
    "At the flagship baseline computed at the public-evidence reference (algorithmic lead 0 months; the calculator's ratified-prior default reads higher), holding η fixed while re-expressing the legacy traffic form spans "
    + span.lo.toFixed(2) + "%–" + span.hi.toFixed(2) + "% (" + span.spanPp.toFixed(2)
    + " pp) from the declared replica width alone. "
    + (perLeg.length
      ? "Per-leg at the declared N_phys (η held): "
        + perLeg.map(leg => leg.hwKey + " " + leg.ratio.toFixed(2) + "×").join(", ")
        + " — open-debt sizes, not repaired estimates. "
      : "")
    + (worst > 0
      ? "Trainium's registry batch is replica-global while the engine consumes it per chip; the alternate reading makes the affected leg about "
        + worst.toFixed(1) + "× lower-throughput (it may be ~" + Math.round(worst) + "× wrong). "
      : "")
    + (resid.length
      ? resid.map(leg => leg.hwKey + "'s topology-aware charge carries the §C4 replication residual: "
          + leg.replicationResidual + ". ").join("")
      : "")
    /* q-im-fp4-gb300-batch-disclosure: an ASSUMED operating point states itself here, on the leg,
       alongside the other open debts — the ruling's named mechanism. Engine-computed from the
       cell's registered sensitivity band; no counterfactual is authored in this file. */
    + debt.legs.filter(leg => leg.declaredBatchExposure)
        .map(leg => leg.hwKey + "'s declared batch is an ASSUMPTION carrying a measurement's weight: "
          + leg.declaredBatchExposure.declaredB + " per chip, one point inside a registered "
          + leg.declaredBatchExposure.band.lo + "–" + leg.declaredBatchExposure.band.hi
          + " sensitivity across which this leg's throughput moves "
          + (leg.declaredBatchExposure.spanRatio
              ? leg.declaredBatchExposure.spanRatio.toFixed(2) + "×"
              : "by an unrenderable factor")
          + " — it sets this leg's position on the per-generation cost chart. ").join("")
    + "Public evidence does not identify the corrected form, so the displayed margin is conditional on the shipped representation."
  ));
}
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
function clampModelSizeAxis(key, value) {
  if (key === "active") return Math.min(value, S.total);
  if (key === "total") return Math.max(value, S.active);
  return value;
}

/* Adjustment sections start COLLAPSED (layout restructure 2026-07-11) — the user expands what
   they want to edit. Expansion state is keyed by section title so it survives the rebuilds
   that radio/select changes trigger (buildControls wipes #controls). */
const SECTION_OPEN = Object.create(null);
const ADVANCED_OPEN = Object.create(null);
/* Injected pickers (selector dissolve, 2026-07-12): the Model selector + model dossier/context live
   at the top of the "Model architecture" section; the Traffic-mix selector at the top of "Traffic
   mix (I/O + cache)". They are PARKED in #picker-holder between builds; buildControls rescues them
   there before wiping #controls, then re-injects. #persp-preset stays in the holder (hidden). */
const SECTION_INJECT = {
  "Model architecture": ["model-picker-group", "model-dossier-card", "model-context"],
  "Traffic mix (I/O + cache)": ["traffic-picker-group"],
};
function buildControls() {
  if (!explainGuardBeforeMutation()) { escalatePending("full"); return; }   /* §18.11 P0-a: an aborted builder is a FULL-level pending (a bare render cannot rebuild controls) */
  // Rescue the injected pickers back to the hidden holder BEFORE the wipe (they currently live in
  // section bodies), so textContent="" can't destroy them.
  const holder = $("picker-holder");
  if (holder) Object.values(SECTION_INJECT).flat().forEach(id => { const el = $(id); if (el) holder.appendChild(el); });
  controlsEl.textContent = "";
  // b9 M5 (§12.4): while the scroll-lock is live, the adjustments column carries the lock icon and
  // tapping it reopens the choice. Distinct icon+copy from the interlock's lock (§10) by design.
  if (slidersLocked()) controlsEl.appendChild(sliderLockChip());
  controlsEl.appendChild(pointModeControl());   // row 499: the 1/2/3-point toggle, above every slider
  SECTIONS.forEach(sec => {
    if (sec.showIf && !sec.showIf(S)) return;
    const det = document.createElement("details");
    det.className = "ctl-section"; det.open = !!SECTION_OPEN[sec.title];
    det.dataset.sectionTitle = sec.title;
    if (sec.interlockGroup) det.dataset.leverGroup = sec.interlockGroup;
    det.addEventListener("toggle", () => { SECTION_OPEN[sec.title] = det.open; });
    const sum = document.createElement("summary");
    // "Model architecture" carries the selected model's name (short label for Custom). Regenerated
    // on every rebuild, so a model switch (which rebuilds controls) updates it automatically.
    if (sec.title === "Model architecture") {
      const cm = currentModel();
      sum.textContent = sec.title + (cm ? " — " + (cm.id === "custom" ? "Custom" : cm.name) : "");
    } else sum.textContent = sec.title;
    if (slidersLocked()) sum.append(" 🔒");
    if (sec.interlockGroup && leverLockState(sec.interlockGroup)) sum.append(" 🔒");
    det.appendChild(sum);
    const body = document.createElement("div"); body.className = "ctl-body";
    (SECTION_INJECT[sec.title] || []).forEach(id => { const el = $(id); if (el) body.appendChild(el); });
    const visible = sec.params.filter(p => !p.showIf || p.showIf(S));
    visible.filter(p => p.tier === "basic").forEach(p => body.appendChild(buildParam(p)));
    const advanced = visible.filter(p => p.tier === "advanced");
    /* im-arc T3 (plan §1 T3 / §4, owner answer d-20260822-4c26 2026-08-22):
       every box exposes the same Basic → Advanced grammar. Open state is UI-only;
       singleton boxes say that their complete control set is already basic. */
    const adv = document.createElement("details"); adv.className = "ctl-advanced";
    adv.open = !!ADVANCED_OPEN[sec.title];
    adv.addEventListener("toggle", () => { ADVANCED_OPEN[sec.title] = adv.open; });
    const advSum = document.createElement("summary"); advSum.textContent = "Advanced";
    const advBody = document.createElement("div"); advBody.className = "ctl-advanced-body";
    advanced.forEach(p => advBody.appendChild(buildParam(p)));
    if (!advanced.length) advBody.appendChild(mkEl("p", "hw-meta", "No additional controls — this box's complete control set is basic."));
    adv.append(advSum, advBody); body.appendChild(adv);
    // b9 M5 (§10): the lever group's lock state, transition line, unlock affordance, trend
    // readout/citations/refusal note and the non-blocking overlap warnings.
    if (sec.interlockGroup) body.appendChild(interlockGroupPanel(sec.interlockGroup));
    det.appendChild(body);
    controlsEl.appendChild(det);
  });
}

/* b9 UX-A: every .info is a dialog trigger, and its accessible name is CONTEXTUAL. Forty-eight
   controls all named "Explanation" are indistinguishable in an assistive-technology control list,
   which is the same defect the visible short label has and the reason the payload title is folded
   into the name rather than the visible text. */
function infoBtn(tipKey) {
  const b = document.createElement("button");
  b.className = "info"; b.textContent = "ⓘ"; b.type = "button";
  b.dataset.tip = tipKey;
  b.setAttribute("aria-haspopup", "dialog");
  const t = TIPS[tipKey];
  b.setAttribute("aria-label", t && t.t ? "Explanation: " + t.t : "Explanation");
  return b;
}

function buildParam(p) {
  const wrap = document.createElement("div"); wrap.className = "param";
  /* b9 M6 (§16.2 A-3 / memo §17.4): a stable per-parameter hook so the low-evidence affordance can
     JUMP to a named control and focus it. Presentation-inert; it carries no claim and no value. */
  wrap.dataset.paramKey = p.k;
  if (p.type === "blend") return buildBlend(wrap, p);
  if (p.type === "rent-discounts") return buildRentDiscounts(wrap, p);
  if (p.type === "rent-absolute") return buildRentAbsolute(wrap, p);
  if (p.type === "nullable-number") return buildNullableNumber(wrap, p);
  /* b9 spec-decode LEVER (§6.2, round-12 Sol): focusing the row is the right mechanical resolution
     for a jump onto a gated control, but this wrapper is a generic <div> with no role and no
     accessible name — so DOM adjacency does not make assistive technology announce the disabled
     control or the why-line, and a screen-reader user is jumped to an unnamed container and told
     nothing about why the thing they came for is unusable. That is the same failure the affordance
     exists to prevent, for a subset of readers. */
  const gatedRow = p.k === "specDec";
  if (gatedRow) wrap.setAttribute("role", "group");
  const head = document.createElement("div"); head.className = "param-head";
  const name = document.createElement("span"); name.className = "param-name";
  if (gatedRow) { name.id = "specdec-label"; wrap.setAttribute("aria-labelledby", "specdec-label"); }
  name.append(p.label, infoBtn(p.tip));
  const val = document.createElement("span"); val.className = "param-val";
  head.append(name, val); wrap.appendChild(head);

  /* b9 M5: a lever-group control is disabled while its group is locked — by the interlock (§10)
     or, for the trend group, by a replay's lock-at-0 (§9.4). Each renders its own why-line. */
  const leverLock = leverLockState(interlockGroupOf(p.k));
  if (p.type === "select") {
    const sel = document.createElement("select");
    sel.setAttribute("aria-label", p.label);
    // b9 M5: `numeric: true` keeps a numeric enum (trendRate) numeric — a DOM select value is a
    // string, and a string 3 would fail the codec's closed numeric domain and the bounds table.
    p.options.forEach(([v, l]) => { const o = document.createElement("option"); o.value = String(v); o.textContent = l; sel.appendChild(o); });
    sel.value = String(S[p.k]);
    sel.oninput = () => { S[p.k] = p.numeric ? Number(sel.value) : sel.value; afterScenarioAxisEdit(p.k); if (noteUserEdit()) return; onChange(); };
    if (leverLock) { sel.disabled = true; wrap.classList.add("locked"); }
    wrap.appendChild(sel); val.remove();
    if (leverLock) { const ln = document.createElement("div"); ln.className = "lock-note"; ln.textContent = leverLock.why; wrap.appendChild(ln); }
    return wrap;
  }
  if (p.type === "radio") {
    const row = document.createElement("div"); row.className = "radio-row";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", p.label);
    p.options.forEach(([v, l]) => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = l;
      b.setAttribute("aria-pressed", String(S[p.k] === v));
      b.onclick = () => { S[p.k] = v; afterScenarioAxisEdit(p.k); if (noteUserEdit()) return; onChange(true); };
      row.appendChild(b);
    });
    wrap.appendChild(row); val.remove();
    return wrap;
  }

  const input = document.createElement("input");
  input.type = "range"; input.min = 0; input.max = 1000; input.step = 1;
  input.setAttribute("aria-label", p.label);
  const effVal = () => S[p.k] ?? (p.nullable !== undefined ? S.cacheHit : p.min); // nullable sliders track their source until pinned
  input.value = Math.round(sliderPos(p, effVal()) * 1000);
  const show = () => {
    const v = effVal();
    const dp = p.step >= 1 ? 0 : p.step >= 0.05 ? 2 : 3;
    const rendered = (p.unit === "$/Mtok" ? "$" : "") + Number(v).toFixed(dp).replace(/\.0+$/, m => p.step >= 1 ? "" : m) + (p.unit && p.unit !== "$/Mtok" ? " " + p.unit : "")
      + (p.nullable !== undefined && S[p.k] === null ? " (" + p.nullable + ")" : "")
      + presetDefaultMark(p.k);   // row 499 null convention: an inherited default is marked, never silent
    val.textContent = rendered;
    // The DOM range is normalized to 0..1000 for log/linear mapping. Expose the
    // domain value a user sees, not that implementation coordinate.
    input.setAttribute("aria-valuetext", rendered);
  };
  const isTrafficKey = p.k === "ioRatio" || p.k === "cacheHit";
  const tr = isTrafficKey ? resolvedTraffic() : null;
  /* Three independent lock sources, each with its own why-line: the replay traffic lock (shipped),
     the b9 M5 lever locks (interlock / replay lock-at-0), and the b9 M5 touch scroll-lock. */
  /* b9 spec-decode LEVER (D-SD-7 / D-SD-5). The gate contributes to the SAME `locked` boolean the
     range AND its ticks consult — a disabled range alone leaves ticks clickable and able to write
     specDec > 1 behind the engine's back, because tick onclick is `if (locked) return`. The engine
     backstop would still refuse the credit, so this is an affordance defect rather than a numbers
     one: it ships a control that appears to do something and does not.

     Replay outranks the gate, mirroring the disposition ladder's rule 3 for the same reason: under a
     replay, moving stackMult to the tick would NOT enable credit, so naming the stack setting would
     be actively misleading. Its why-line therefore does not mention the setting at all. */
  const specDecLock = p.k !== "specDec" ? null
    : (currentPersp() && currentPersp().kind === "replay") ? { why: SPECDEC_REPLAY_WHY_LINE, gate: false }
    : !specDecGateAllows(S) ? { why: SPECDEC_WHY_LINE, gate: true }
    : null;
  const locked = !!(tr && tr.locked) || !!leverLock || !!specDecLock || slidersLocked();
  const lockWhy = (tr && tr.locked)
    ? "🔒 locked by the selected replay — its traffic mix is part of the published operating point. Adjust any other assumption (or reload for the central scenario) to switch to a freely-adjustable state."
    : leverLock ? leverLock.why
    : specDecLock ? specDecLock.why
    : "🔒 sliders are locked for scroll safety on this device — tap the lock above the adjustments to change it.";
  input.oninput = () => {
    if (locked) { input.value = Math.round(sliderPos(p, S[p.k]) * 1000); return; }
    // b9 M5 (§12.1): first slider interaction on a coarse pointer offers the scroll-lock choice
    // and SUPPRESSES this edit; fine pointers and keyboard/AT are never asked.
    if (offerSliderLock()) { input.value = Math.round(sliderPos(p, effVal()) * 1000); return; }
    let v = sliderVal(p, input.value / 1000);
    v = Math.round(v / p.step) * p.step;
    // Apply the control's own bounds first, then the cross-field invariant
    // last. Valid shared states may sit below a slider's editorial minimum
    // (for example active=1,total=10); reapplying p.min after the relational
    // clamp would manufacture active>total and crash the render.
    v = Math.min(p.max, Math.max(p.min, v));
    S[p.k] = clampModelSizeAxis(p.k, v);
    input.value = Math.round(sliderPos(p, S[p.k]) * 1000);
    afterScenarioAxisEdit(p.k);
    if (isTrafficKey) switchToCustomTraffic();
    if (noteUserEdit()) { show(); return; }
    if (isTrafficKey) { show(); refreshTrafficDisplay(); return; } // a traffic edit on ANY kind (lens OR synthetic modified state) must resync the dossier line + note label with resolveTraffic()/S (M4 round-4 centralization)
    show(); onChange();
  };
  show();
  if (locked) {
    input.disabled = true; wrap.classList.add("locked");
    const lockNote = document.createElement("div"); lockNote.className = "lock-note";
    if (specDecLock) { lockNote.id = "specdec-why"; wrap.setAttribute("aria-describedby", "specdec-why"); }
    lockNote.textContent = lockWhy;
    wrap.appendChild(input); wrap.appendChild(lockNote);
    /* OWNER ANNOTATION ndadaca (2026-08-16, verbatim: "This needs to jump you to the setting to
       allow it, or include a toggle for it, as it is I'd have no idea how to activate it").

       The why-line already NAMES the stack setting; what it could not do is take him there, so a
       reader who accepted the explanation still had nowhere to click. This is the affordance, and
       it is scoped to `specDecLock.gate` — the D-SD-7 gate — and NOT to the replay lock, because
       under a replay moving stackMult would not enable credit and the replay why-line deliberately
       does not name the setting at all (D-SD-5). A jump rendered there would be the actively-false
       instruction that string exists to avoid.

       Jump, not toggle: the two options he offered are not equivalent here. A toggle would write
       stackMult itself, and 0.7 also removes disaggregation (SPECDEC_CONSERVATISM) — flipping that
       silently from a control labelled for speculative decoding would move a rendered number as a
       side effect the reader did not ask for. Taking him to the setting, with its tick focused, is
       the same fix without the hidden write. */
    if (specDecLock && specDecLock.gate) wrap.appendChild(specDecGateJump());
  } else wrap.appendChild(input);
  if (p.ticks) {
    const ticks = document.createElement("div"); ticks.className = "ticks";
    p.ticks.forEach(tk => {
      const b = document.createElement("button"); b.className = "tick" + (tk.alt ? " tk-alt" : ""); b.type = "button";
      /* b9 spec-decode LEVER: a GATED tick is `disabled`, not merely inert. `tabindex="-1"` does not
         set `disabled`, and the low-evidence jump picks the first descendant matching `!el.disabled`
         — so an inert-but-enabled tick can still take programmatic focus, which is the failure the
         jump narrowing below exists to prevent. Scoped to this lever deliberately: making every
         locked tick `disabled` is the right general behaviour but would change three surfaces this
         leg does not own, and the browser app suites could not be run here. Logged in BACKLOG.md. */
      if (specDecLock) b.disabled = true;
      /* Owner annotation ndadaca: the gate jump lands on the tick that OPENS the gate, so the tick
         needs an identity a querySelector can name. Value-typed, not label-typed — the predicate
         that owns the gate is numeric (stackAtMtpFreeTick), and matching on copy would let a label
         edit silently break the jump. */
      b.dataset.tickValue = String(tk.v);
      const pos = sliderPos(p, tk.v) * 100;
      b.style.left = pos.toFixed(1) + "%";
      if (pos > 88) b.style.transform = "translateX(-88%)";
      else if (pos < 10) b.style.transform = "translateX(-12%)";
      const i = document.createElement("i"); const sp = document.createElement("span");
      sp.textContent = tk.l; b.append(i, sp);
      b.title = tk.l + " = " + tk.v + (p.unit || "");
      b.onclick = () => { if (locked) return; const bounded = Math.min(p.max, Math.max(p.min, tk.v)); const next = clampModelSizeAxis(p.k, bounded); S[p.k] = next; input.value = Math.round(sliderPos(p, next) * 1000); afterScenarioAxisEdit(p.k); if (isTrafficKey) switchToCustomTraffic(); if (noteUserEdit()) { show(); return; } if (isTrafficKey) { show(); refreshTrafficDisplay(); return; } show(); onChange(); };
      ticks.appendChild(b);
    });
    wrap.appendChild(ticks);
  }
  /* row 499: 2/3-point handles — but NEVER on a control the reader cannot move. Declaring a range
     on a gated or locked dial is incoherent: it invites a claim about a value the page has just told
     the reader is unavailable, and it would compute a band through a lever the gate exists to keep
     out of the arithmetic. Found by the spec-decode CDP suite, whose jump-focus contract broke the
     moment handles started rendering under a shut gate. */
  { const rh = locked ? null : rangeHandles(p); if (rh) wrap.appendChild(rh); }
  if (p.k === "total") { const bk = buildTotalCaseBookmarks(); if (bk) wrap.appendChild(bk); }
  /* b9 spec-decode LEVER, manifest row 15 ([N-CORRECTION-LIFETIME] rule 4): ONE state-level notice,
     adjacent to the spec-decode control — NOT beside each leg, because the force is a property of
     the state and a per-leg echo would print N copies of one event. The bytes come from the ONE
     engine-owned formatter, so page, MCP and Worker cannot disagree about them. */
  if (p.k === "specDec" && specDecResetAnnounced) {
    const rn = document.createElement("div");
    rn.className = "lock-note specdec-reset";
    rn.textContent = SPECDEC_RESET_LINE;
    wrap.appendChild(rn);
  }
  if (p.k === "specDec" && activeCorrection && activeCorrection.key === "specDec") {
    const note = document.createElement("div");
    note.className = "lock-note specdec-correction";
    note.textContent = specDecCorrectionNotice(activeCorrection.from);
    wrap.appendChild(note);
  }
  /* d-im-h800 (owner note aca09d): the lever's LIVE readout, adjacent to the control — what the
     engine's own fabric term says at the current operating point and what moving the lever does.
     COMPUTED by nvlinkCapReadout (one engine computation also feeding the hardware-chart note); the
     renderer only formats. A slider whose consequence a reader has to go looking for hides the
     parameter, which is exactly what this leg exists to stop. */
  if (p.k === "nvlinkCapMinRatio") {
    const rd = document.createElement("div");
    rd.className = "lock-note nvlinkcap-readout"; rd.id = "nvlinkcap-readout";
    rd.textContent = nvlinkCapReadoutText(nvlinkCapReadoutSafe(), "control");
    wrap.appendChild(rd);
  }
  return wrap;
}
/* d-im-h800 — the ONE formatter for the readout on both surfaces (`control` = beside the lever;
   `chart` = under the hardware chart). Nothing numeric is authored here: every figure is a field of
   the engine's readout. */
function nvlinkCapReadoutSafe() {
  try { return nvlinkCapReadout(S, appEngineContext()); } catch (e) { return null; }
}
function nvlinkCapReadoutText(rd, surface) {
  if (!rd) return "Fit-transfer readout unavailable for this state.";
  const pct = x => (x * 100).toFixed(1) + "%";
  const share = x => (x * 100).toFixed(1) + "%";
  const pp = (a, b) => (a == null || b == null) ? "—" : ((b - a) * 100 >= 0 ? "+" : "") + ((b - a) * 100).toFixed(2) + " pp";
  const a = rd.rows.h800, c = rd.rows.h100;
  const parts = [];
  if (surface === "chart") {
    parts.push("READ THE H800 AND H100 BARS WITH THIS: the H800 is the H100 with its NVLink cut from 900 to 400 GB/s; "
      + "nothing else that reaches a serving number differs. This page's H800 row is the MEASURED part (DeepSeek's "
      + "production disclosure ran on H800s) and the H100/H200 rows borrow its fitted efficiency — a fit obtained on the "
      + "capped system that may include cap-related effects which cannot be separately identified — so at the neutral "
      + "setting the two parts tie on throughput and the bars differ only by rent.");
  }
  if (a && a.renderable && c && c.renderable) {
    parts.push("At this operating point the roofline's interconnect term is "
      + share(a.decode.fabricShareOfBinding) + " of the binding decode term on the H800 (" + share(c.decode.fabricShareOfBinding)
      + " on the H100; decode binds on " + a.decode.bindingTerm + ") and prefill "
      + (a.prefill && a.prefill.bindingTerm === "fabric"
          ? "BINDS on the fabric — the H100 already renders " + (c.prefill.tokPerS / a.prefill.tokPerS).toFixed(2) + "× the H800's prefill throughput with this control untouched, and that advantage counts toward the ratio"
          : "binds on compute (fabric ÷ compute " + (a.prefill ? a.prefill.fabricOverCompute.toFixed(2) : "—") + " on the H800, " + (c.prefill ? c.prefill.fabricOverCompute.toFixed(2) : "—") + " on the H100)")
      + ". Serial-exposure counterfactual: if the H800's calibrated iteration hid none of its fabric time, an H100 at the same operating point would be "
      + (rd.serialExposureCounterfactualH100OverH800 != null ? rd.serialExposureCounterfactualH100OverH800.toFixed(3) + "×" : "—")
      + " faster — a bracket on this model's overlap formulation, not an empirical bound.");
  } else {
    parts.push("The H800/H100 pair does not render at this operating point, so the roofline counterfactual is not available.");
  }
  parts.push("Setting: ×" + rd.setting.toFixed(2)
    + (rd.setting === 1 ? " (neutral — this page's default; the borrowed fit is taken as-is)." : " (your scenario, not this page's finding)."));
  if (rd.blend && rd.blend.current != null) {
    parts.push("Sensitivity, computed"
      + (rd.setting !== 1 && rd.blend.neutral != null ? " — versus neutral: this blend " + pct(rd.blend.neutral) + " → " + pct(rd.blend.current)
          + ", the H100 stand-alone " + (rd.alone.h100.neutral != null ? pct(rd.alone.h100.neutral) : "—") + " → " + (rd.alone.h100.current != null ? pct(rd.alone.h100.current) : "—")
          + ", the H800 unchanged" : "")
      + (rd.blend.atSlope != null && rd.slopeTo > rd.setting ? (rd.setting !== 1 ? "; " : ": ") + "each further +" + rd.slopeStep.toFixed(2) + " on this control (to ×" + rd.slopeTo.toFixed(2) + ") moves the H100 stand-alone margin "
          + pp(rd.alone.h100.current, rd.alone.h100.atSlope) + ", the H200 " + pp(rd.alone.h200.current, rd.alone.h200.atSlope)
          + ", the H800 " + pp(rd.alone.h800.current, rd.alone.h800.atSlope) + ", and this blend " + pp(rd.blend.current, rd.blend.atSlope)
          + " (" + share(rd.blend.borrowingShare) + " of it rides the borrowing rows)." : "."));
  }
  parts.push("No matched capped-versus-uncapped serving measurement is public — a registered evidence task; the setting is a declared belief about a fit-transfer effect, not a measurement.");
  return parts.join(" ");
}

/* ---------- Slice C (memo C-8/C-10): totalCase bookmarks on the total axis.
   Rendered ONLY for in-scope models (presentation on top of the MACHINE guard —
   the state machine refuses out-of-scope bookmark selection regardless). A
   bookmark is a labeled citation of the CHOICE; a hand-typed coincidence stays
   "custom" (the stored enum is the single authority). ---------- */
/* Model resolution that survives buildControls' rebuild window: while the
   Model-architecture section body is under construction, the injected
   model-picker-group (and #model-preset with it) sits in a DETACHED subtree, so
   getElementById fails EXACTLY while that section's params build (found live by
   the bk=0 probe during assembly). The stored LAST_APPLIED_MODEL tracker is the
   authority for that window; the early pre-init pass has a null tracker and
   correctly yields null. */
function buildTimeModel() {
  const el = $("model-preset");
  if (el) return currentModel();
  return LAST_APPLIED_MODEL ? MODELS.find(x => x.id === LAST_APPLIED_MODEL) : null;
}
function buildTotalCaseBookmarks() {
  const m = buildTimeModel();
  if (!m || !TOTAL_CASE_SCOPE.includes(m.id)) return null; // machine guard mirror: no dead controls
  const row = document.createElement("div"); row.className = "total-case-row";
  Object.entries(TOTAL_CASES).forEach(([id, c]) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "tick tk-case";
    b.textContent = (c.totalB / 1000) + "T";
    b.title = c.label + " — " + c.citation;
    b.setAttribute("aria-pressed", String(TOTAL_CASE_ID === id && S.total === c.totalB));
    b.onclick = () => {
      const mm = currentModel();
      if (!mm || !TOTAL_CASE_SCOPE.includes(mm.id)) return; // the MACHINE guard (memo C-8, R7 P2-1)
      S.total = c.totalB;
      TOTAL_CASE_ID = id; // bookmark selection: the one event that assigns a case id
      afterScenarioAxisEdit("__total-case-bookmark"); // NOT "total": the bookmark sets the id itself…
      if (FLEET_ID === DEFAULT_FLEET_ID) afterScenarioAxisEdit("precision"); // …but the D-1 re-seed still applies (total moved)
      if (noteUserEdit()) { fullRefresh(); return; }
      fullRefresh();
    };
    row.appendChild(b);
  });
  const meta = document.createElement("div"); meta.className = "hw-meta";
  meta.textContent = "Labeled total-parameter cases (each cites its source; selecting one is a bookmarked choice — editing the slider afterwards is a custom total).";
  row.appendChild(meta);
  return row;
}

/* ---------- Slice C (memo C-1/C-2/C-5/C-6): the fleet switcher ---------- */
let FLEET_SPAN_CACHE = null; // flagship-baseline presented values; derivation, never a pinned string (C-6)
function fleetPresentedSpan() {
  if (FLEET_SPAN_CACHE) return FLEET_SPAN_CACHE;
  const opus = MODELS.find(x => x.id === "opus"), median = PERSPECTIVES.find(x => x.id === "median");
  const base = applyPresetSettings(opus, median, { mode: "native" });
  const ctx = { modelId: "opus", customDonor: base.customDonor };
  const vals = Object.keys(FLEETS).map(id => {
    const st = structuredClone(base);
    const fb = fleetBaselineBlend(id, st, ctx); // default → filtered seed; others → declared (C-1 presented values)
    st.blend = fb || Object.fromEntries(HW_ORDER.map(k => [k, FLEETS[id].legs[k] || 0]));
    const wl = workload(st, undefined, makeScenarioContext(opus, resolveTraffic(opus, median, { mode: "native" }), st.customDonor));
    return { id, pct: wl.margin * 100 };
  }).filter(v => isFinite(v.pct));
  const lo = vals.reduce((a, b) => (b.pct < a.pct ? b : a)), hi = vals.reduce((a, b) => (b.pct > a.pct ? b : a));
  FLEET_SPAN_CACHE = { lo, hi, span: hi.pct - lo.pct };
  return FLEET_SPAN_CACHE;
}
function fleetSwitcherLabel(id) {
  if (id === "custom") return "Custom";
  if (id === "preset") return "Model preset (analyst)";
  return FLEETS[id] ? FLEETS[id].name : id;
}
function advancedFleetModeActive() { return isCustomFleetId(FLEET_ID); }
function restoreGenericFleetMode() {
  const m = currentModel();
  const remembered = GENERIC_FLEET_ID;
  let target = remembered && remembered.id;
  if (isNamedFleetId(target) && (!m || !FLEETS[target].models.includes(m.id))) target = null;
  if (!target || isCustomFleetId(target))
    target = m && FLEETS[DEFAULT_FLEET_ID].models.includes(m.id) ? DEFAULT_FLEET_ID : "preset";
  FLEET_ID = target;
  if (remembered && remembered.id === target && remembered.blend) S.blend = structuredClone(remembered.blend);
  else if (isNamedFleetId(target)) {
    const blend = fleetBaselineBlend(target, S, appEngineContext()); if (blend) S.blend = blend;
  }
  if (noteUserEdit()) { fullRefresh(); return; }
  fullRefresh();
}
function cfOpenDcComposer() {
  const model = currentModel(); if (!model) return;
  if (!advancedFleetModeActive()) GENERIC_FLEET_ID = { id: FLEET_ID, blend: structuredClone(S.blend) };
  const company = companyForModel(model.id), allRows = registryRows();
  const rows = Object.entries(allRows).filter(([, row]) => row.company === company);
  const dlg = cfDialogShell("Advanced — data center by data center");
  dlg.el.id = "fleet-dc-composer";
  dlg.body.appendChild(mkEl("p", "hw-meta",
    "Choose public registry rows. Counts propose shares where they exist; the rest stays a generic fill. Every resulting section remains editable."));
  const list = document.createElement("div"); list.className = "cf-dc-row-list";
  rows.forEach(([id, row]) => {
    const label = document.createElement("label"); label.className = "cf-dc-row";
    const check = document.createElement("input"); check.type = "checkbox"; check.value = id;
    const kind = registryRowClass(id), coverage = row.coverage || kind;
    label.append(check, document.createTextNode(" " + (row.site || row.programme || row.operator)
      + " — " + kind + " / " + coverage));
    list.appendChild(label);
  });
  if (!rows.length) list.appendChild(mkEl("p", "hw-meta",
    "No provider-matched public registry row carries a usable allocation; this advanced fleet will begin as generic fill."));
  dlg.body.appendChild(list);
  const fillLabel = document.createElement("label"); fillLabel.className = "cf-field";
  fillLabel.appendChild(mkEl("span", "cf-field-label", "Generic remainder"));
  const fill = document.createElement("select"); fill.className = "cf-dc-fill";
  [["generic-us", "US industrial"], ["generic-cn", "Coastal China"]].forEach(([value, label]) => {
    const option = document.createElement("option"); option.value = value; option.textContent = label; fill.appendChild(option);
  });
  fill.value = ["deepseek", "zhipu", "moonshot"].includes(company) ? "generic-cn" : "generic-us";
  fillLabel.appendChild(fill); dlg.body.appendChild(fillLabel);
  const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "cf-chip";
  cancel.textContent = "Cancel"; cancel.onclick = () => dlg.close();
  const compose = document.createElement("button"); compose.type = "button"; compose.className = "cf-chip cf-primary cf-compose-dc";
  compose.textContent = "Compose sections";
  compose.onclick = () => {
    try {
      const selected = [...list.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
      const src = customFleetSource(), id = newCustomFleetId(src.ids());
      const fleet = composeFleetFromDcRows(S, { modelId: model.id, dcRows: selected,
        fill: fill.value, id, name: model.name + " data-center scenario" });
      src.setEphemeral(fleet); FLEET_ID = fleet.id; S.blend = aggregateLegsToBlend(fleet);
      dlg.close();
      if (noteUserEdit()) { fullRefresh(); return; }
      fullRefresh();
    } catch (error) {
      let line = dlg.body.querySelector(".cf-errors");
      if (!line) { line = mkEl("p", "cf-errors"); dlg.body.appendChild(line); }
      line.textContent = "Not composed — " + error.message;
    }
  };
  dlg.bar.append(cancel, compose); dlg.show();
}
function fleetModeControl() {
  const row = document.createElement("div"); row.className = "fleet-mode-toggle"; row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Fleet modeling mode");
  const generic = document.createElement("button"); generic.type = "button"; generic.className = "fleet-mode-button";
  generic.textContent = "Generic fleet"; generic.setAttribute("aria-pressed", String(!advancedFleetModeActive()));
  generic.onclick = () => { if (advancedFleetModeActive()) restoreGenericFleetMode(); };
  const advanced = document.createElement("button"); advanced.type = "button"; advanced.className = "fleet-mode-button";
  advanced.textContent = "Advanced — data center by data center";
  advanced.setAttribute("aria-pressed", String(advancedFleetModeActive())); advanced.onclick = () => cfOpenDcComposer();
  row.append(generic, advanced);
  row.appendChild(mkEl("p", "fleet-mode-note",
    "Generic fleet — “everyone pays the US cost” shorthand: one regional electricity band and one rental $/accelerator-hour per fleet item. Chinese-provider presets use the coastal-China band. Advanced composes editable registry-backed sections."));
  return row;
}
function renderFleetCoverageLine() {
  const line = document.createElement("p"); line.id = "fleet-coverage-line"; line.className = "fleet-coverage-line";
  let row = null;
  const fleet = appActiveCustomFleet(S);
  if (currentPersp() && currentPersp().id === "stress-public-rate") {
    const workload = appWorkload(S);
    row = workload.coverage;
  } else if (fleet && Array.isArray(fleet.sections)) {
    const model = currentModel();
    row = coverageForFleetSections(fleet.sections, model ? model.id : null);
  }
  /* im-arc T4 fold (2026-08-24) [F3]: the generic path now asks the ONE resolver for the derived
     partition instead of reading stored percentages off the ledger row. The stored ledger holds
     evidence, not numbers. */
  else { const model = currentModel(); row = model ? coverageForPreset(model.id) : null; }
  const rendered = coverageSentenceParts(row);
  line.textContent = rendered ? rendered.sentence : "Coverage: no provider ledger row is registered for this model.";
  /* memo §1.5 (review question 3): the prominent bar stays THREE-part. The SKU/workload
     count-backed share is a SUBORDINATE line, and it says in words that it is not part of the
     partition above it — a reader must never add it to the other three. */
  if (rendered && rendered.subordinate) {
    const sub = document.createElement("span");
    sub.className = "fleet-coverage-subordinate";
    sub.id = "fleet-coverage-count-backed";
    sub.textContent = rendered.subordinate.sentence;
    line.appendChild(document.createElement("br"));
    line.appendChild(sub);
  }
  return line;
}
function buildFleetSwitcher() {
  const m = buildTimeModel(); // same detached-window-safe resolution as the bookmarks
  const offered = m ? Object.keys(FLEETS).filter(id => FLEETS[id].models.includes(m.id)) : [];
  /* b9 M4 custom fleets are model-agnostic. im-arc T3 extends the box itself to
     every model: even without a named-fleet row, readers need the generic/advanced
     toggle, provider coverage ledger and registry composer. */
  const cfSrc = typeof customFleetSource === "function" ? customFleetSource() : null;
  const cfIds = cfSrc ? cfSrc.ids() : [];
  const cfEphemeralId = cfSrc && cfSrc.ephemeral ? cfSrc.ephemeral.id : null;
  const box = document.createElement("div"); box.className = "fleet-switcher";
  TIPS["fleet-switcher"] = { t: "Named fleet scenarios", b: "A registry of named, source-attributed fleets. Selecting one SEEDS the blend sliders (they stay live — any slider edit is a Custom fork). The default presents its serve-feasibility-filtered derivation; every other fleet presents its declared construction; counterfactual fleets are explicitly labeled and are never a default. No per-fleet margin preview is shown here — select a fleet to see its labeled, welded value.", s: "Design: research/im4-sliceC-design-memo.md (gate closed 2026-07-23)." };
  const head = document.createElement("div"); head.className = "param-head";
  const name = document.createElement("span"); name.className = "param-name";
  name.append("Named fleet", infoBtn("fleet-switcher"));
  head.appendChild(name); box.appendChild(head);
  box.appendChild(fleetModeControl());
  if (offered.length) { const sp = fleetPresentedSpan();
    const spanLine = document.createElement("div"); spanLine.className = "fleet-span-line";
    spanLine.textContent = "Selecting a different named fleet moves the presented value across a \u2248" + sp.span.toFixed(1)
      + "pp span (" + sp.lo.pct.toFixed(1) + "\u2013" + sp.hi.pct.toFixed(1) + "%): each fleet presents its own construction \u2014 the default presents its serve-feasibility-filtered derivation, every other fleet its declared construction, counterfactual endpoints labeled \u2014 a span across presented alternatives, not a confidence interval and not same-construction variants.";
    box.appendChild(spanLine); }
  const sel = document.createElement("select"); sel.className = "fleet-select";
  offered.forEach(id => { const o = document.createElement("option"); o.value = id;
    o.textContent = FLEETS[id].name + (FLEETS[id].class === "counterfactual" ? " \u2014 COUNTERFACTUAL" : "");
    sel.appendChild(o); });
  /* b9 M4 (memo §5.1): saved custom fleets in their own optgroup, after the named
     entries; an ephemeral (link-restored, unsaved) fleet lists too, labeled. */
  if (cfIds.length || cfEphemeralId) {
    const og = document.createElement("optgroup"); og.label = "Your custom fleets";
    cfIds.forEach(id => { const o = document.createElement("option"); o.value = id;
      o.textContent = cfSrc.resolve(id).name + " — user-custom"; og.appendChild(o); });
    if (cfEphemeralId && !cfIds.includes(cfEphemeralId)) {
      const o = document.createElement("option"); o.value = cfEphemeralId;
      o.textContent = cfSrc.ephemeral.name + " — user-custom (from link, unsaved)"; og.appendChild(o);
    }
    sel.appendChild(og);
  }
  { const o = document.createElement("option"); o.value = "__custom"; o.textContent = "Custom (set the sliders)"; sel.appendChild(o); }
  if (FLEET_ID === "preset") { const o = document.createElement("option"); o.value = "__preset"; o.textContent = "Model preset (analyst)"; o.disabled = true; sel.appendChild(o); }
  sel.value = isNamedFleetId(FLEET_ID) ? FLEET_ID
    : isCustomFleetId(FLEET_ID) ? FLEET_ID
    : FLEET_ID === "custom" ? "__custom" : "__preset";
  /* C-2 (mutate-then-notify, the shipped control pattern): apply the C-1 seed and
     store the identity FIRST, then the post-mutation noteUserEdit()/refresh path
     (divergence/downgrade machinery first-class — a fleet selection under a
     replay/route exits exactly as a slider edit would). */
  sel.oninput = () => {
    const v = sel.value;
    if (v === "__preset") return;
    if (v === "__custom") { FLEET_ID = "custom"; if (noteUserEdit()) { fullRefresh(); return; } fullRefresh(); return; }
    /* b9 M4 (memo §1.4): a cf: selection follows the SAME C-2 mutate-then-notify
       pattern — identity, blend-mirror seed, then noteUserEdit/refresh. Model-agnostic:
       no models-scope check (memo D-3). */
    if (isCustomFleetId(v)) {
      FLEET_ID = v;
      const fb = fleetBaselineBlend(v, S, { modelId: currentModel() ? currentModel().id : null, customDonor: S.customDonor });
      if (fb) S.blend = fb; // §1.3 mirror invariant: aggregate(legs) == S.blend
      if (noteUserEdit()) { fullRefresh(); return; }
      fullRefresh(); return;
    }
    const mm = currentModel(); if (!mm || !FLEETS[v] || !FLEETS[v].models.includes(mm.id)) return; // fail-closed scope
    FLEET_ID = v;
    const fb = fleetBaselineBlend(v, S, { modelId: mm.id, customDonor: S.customDonor });
    if (fb) S.blend = fb; // C-1: default → derivation at the CURRENT scenario; non-default → DECLARED weights AS-IS
    if (noteUserEdit()) { fullRefresh(); return; }
    fullRefresh();
  };
  box.appendChild(sel);
  box.appendChild(renderFleetCoverageLine());
  box.appendChild(renderFleetCompositionLine());
  box.appendChild(cfManagementRow());
  box.appendChild(renderFleetDisclosure());
  return box;
}
function renderFleetCompositionLine() {
  const line = document.createElement("p"); line.className = "fleet-composition-line";
  let composition = [];
  try { composition = (appWorkload(S).composition || []); } catch (e) { composition = []; }
  line.textContent = composition.length
    ? "Composition: " + composition.map(row => Math.round(row.share * 100) + "% "
      + cfBasisName(row.basis) + (row.basis === "owned-strategic-tco"
        ? " (section electricity)" : " (electricity embedded in rent)")
      + (row.receiptSentence ? " — " + row.receiptSentence : "")).join(" · ")
    : "Composition: unavailable — no typed section receipt.";
  return line;
}
/* b9 M4 (memo §5.2): the management row — the builder's entry point plus per-saved-fleet
   Edit/Delete chips, the Edit affordance visible EVEN WHEN NOT SELECTED (D-4 verbatim). */
function cfManagementRow() {
  const row = document.createElement("div"); row.className = "cf-manage-row";
  const add = document.createElement("button"); add.type = "button"; add.className = "cf-chip cf-add";
  add.textContent = "＋ Custom fleet…";
  add.onclick = () => cfOpenChooser();
  row.appendChild(add);
  const src = customFleetSource();
  (src ? src.ids() : []).forEach(id => {
    const def = src.resolve(id);
    const grp = document.createElement("span"); grp.className = "cf-manage-item";
    const nm = document.createElement("span"); nm.className = "cf-manage-name"; nm.textContent = def.name;
    const ed = document.createElement("button"); ed.type = "button"; ed.className = "cf-chip";
    ed.textContent = "Edit"; ed.setAttribute("aria-label", "Edit " + def.name);
    ed.onclick = () => cfOpenBuilder("edit", id);
    const del = document.createElement("button"); del.type = "button"; del.className = "cf-chip cf-danger";
    del.textContent = "Delete"; del.setAttribute("aria-label", "Delete " + def.name);
    del.onclick = () => {
      if (!confirm("Delete custom fleet “" + def.name + "”? This cannot be undone.")) return;
      src.remove(id);
      if (FLEET_ID === id) { // reselect the default through the NORMAL selection path (memo §4.4)
        FLEET_ID = DEFAULT_FLEET_ID;
        const fb = fleetBaselineBlend(DEFAULT_FLEET_ID, S, appEngineContext());
        if (fb) S.blend = fb;
      }
      fullRefresh();
    };
    grp.append(nm, ed, del);
    row.appendChild(grp);
  });
  if (src && src.ephemeral) {
    const idTaken = src.ids().includes(src.ephemeral.id);
    const save = document.createElement("button"); save.type = "button"; save.className = "cf-chip";
    /* impl-gate P1-3: the differs case gets a copy under a NEW id — the same-id slot
       belongs to the user's saved fleet; the link version must still be keepable. */
    save.textContent = idTaken
      ? "Save the link version of “" + src.ephemeral.name + "” as a copy"
      : "Save a copy of “" + src.ephemeral.name + "”";
    save.onclick = () => { // the ONLY storage write paths for link fleets (memo §6.5)
      if (!idTaken) { src.save(src.ephemeral); fullRefresh(); return; }
      const copy = { ...structuredClone(src.ephemeral), id: newCustomFleetId(src.ids()),
        name: (src.ephemeral.name + " (link copy)").slice(0, 60) };
      const v = validateCustomFleet(copy, { requireId: true });
      if (v.ok) { src.save(v.fleet); FLEET_ID = v.fleet.id; src.setEphemeral(null); fullRefresh(); }
    };
    row.appendChild(save);
  }
  return row;
}
/* ============================ b9 M4: the custom fleet builder ============================
   Memo §4 — one <dialog>, JS-built (all textContent, never innerHTML), editing a WORKING
   CLONE: the saved object and the live page mutate ONLY on Save (§4.3). Read-only mode is
   the D-9.2 drill-down for named fleets. */
/* im-arc T2 (memo research/im-arc-t2-sections-memo.md §§1,7): app-side readers
   consume the one normalized section shape. The legacy fallback is display-only for
   a pre-migration value that has not yet passed through validateCustomFleet. */
function cfSectionsOf(def) {
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-4): every readout
     consumes resolver output. `inherit` remains accepted at the migration
     boundary but can never become visible text or arithmetic state. */
  if (!def) return [];
  try { return resolveFleetSections(S, { customFleet: def }).map(row => row.section); }
  catch { return []; }
}
function cfPointValue(value, fallback) {
  if (value && typeof value === "object" && Number.isFinite(value.mid)) return value.mid;
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}
/* im-arc T2 fix (Sol review 2026-08-23, findings P1-5/P1-8): visible
   electricity uses the same resolved registry/override receipt as pricing.
   Region-only sections therefore display the registry triple's middle point. */
function cfElectricityPoint(section) {
  try {
    const receipt = sectionElectricity(section, S);
    return cfPointValue(receipt && receipt.value, S.kwh);
  } catch { return S.kwh; }
}
function cfBasisName(basis) { return PROCUREMENT_BASIS_NAMES[basis] || basis; }
function cfPerLegPanel() {
  const def = customFleetSource().resolve(FLEET_ID);
  const panel = document.createElement("div"); panel.className = "cf-leg-panel";
  if (!def) { panel.textContent = "—"; return panel; }
  /* impl-gate P0-2: per-leg feasibility status chips from the SAME feasibility the tile
     renders (the resolver orders feas legs exactly as the positive-share legs). */
  const feas = appFeasibility();
  let feasIdx = 0;
  cfSectionsOf(def).forEach(section => {
    const sectionHead = document.createElement("div"); sectionHead.className = "cf-section-readout";
    sectionHead.appendChild(mkEl("strong", "", section.label + " — "
      + cfPointValue(section.sharePct, 0) + "% of fleet"));
    sectionHead.appendChild(mkEl("span", "cf-section-basis", "Procurement basis: "
      + cfBasisName(section.basis) + " — this section is priced on it."));
    panel.appendChild(sectionHead);
    section.legs.forEach(leg => {
    const row = document.createElement("div"); row.className = "cf-leg-row";
    const ident = mkEl("span", "cf-leg-ident", leg.label + " — donor " + HW[leg.donorKey].name
      + (leg.family === "unclassified" ? " · family: unclassified (exempt from family adjustments)" : ""));
    const share = mkEl("span", "cf-leg-share", cfPointValue(leg.sharePct, 0) + "%");
    const ovKeys = Object.keys(leg.overrides || {});
    const ov = mkEl("span", "cf-leg-ov", ovKeys.length ? "overrides: " + ovKeys.join(", ") : "no overrides");
    row.append(ident, share, ov);
    if (cfPointValue(leg.sharePct, 0) > 0) {
      const fl = feas.legs[feasIdx++];
      const status = !fl ? "—" : fl.infeasible ? "INFEASIBLE — no numeric result"
        : fl.capped ? "capped (declared batch reduced to feasible)" : "renders";
      row.appendChild(mkEl("span", "cf-leg-status" + (fl && fl.infeasible ? " cf-leg-status-bad" : ""),
        "status: " + status));
      /* b9 spec-decode LEVER (§9.5): the per-leg disclosure. A custom leg is typed by its
         calibration DONOR — the row whose performance identity it borrows — so the DTO the engine
         attached already resolved through hwKeyFor and this render site needs no donor logic of
         its own. Copy comes from the ONE engine-owned formatter; the DTO carries codes only. */
      if (fl && fl.specDec)
        row.appendChild(mkEl("span", "cf-leg-specdec",
          specDecReasonText(fl.specDec.reasonCode, fl.specDec.factorApplied)));
      /* d-im-h800: the NVLink-cap lineage/disposition, same contract — the DTO already resolved
         through the calibration DONOR, codes only, copy from the ONE engine-owned formatter. */
      if (fl && fl.nvlinkCap)
        row.appendChild(mkEl("span", "cf-leg-nvlinkcap",
          nvlinkCapReasonText(fl.nvlinkCap.reasonCode, fl.nvlinkCap)));
    } else {
      row.appendChild(mkEl("span", "cf-leg-status", "status: 0% — not in the mix"));
    }
    const cal = mkEl("p", "cf-leg-cal", "Performance identity: " + HW[leg.donorKey].name
      + " (analyst transfer — this leg's edits change cost/power/capacity inputs, not the calibrated operating point).");
    panel.append(row, cal);
    });
  });
  const edit = document.createElement("button"); edit.type = "button"; edit.className = "cf-chip";
  edit.textContent = "Edit fleet…";
  edit.onclick = () => cfOpenBuilder("edit", FLEET_ID);
  panel.appendChild(edit);
  const meta = document.createElement("div"); meta.className = "hw-meta";
  meta.textContent = "Composition and shares are edited only in the builder — the share sliders do not apply to a custom fleet.";
  panel.appendChild(meta);
  return panel;
}
function cfOpenChooser() {
  const dlg = cfDialogShell("New custom fleet");
  const blank = document.createElement("button"); blank.type = "button"; blank.className = "cf-chip";
  blank.textContent = "Start blank";
  blank.onclick = () => { dlg.close(); cfOpenBuilder("new", null, makeBlankFleet()); };
  dlg.body.appendChild(blank);
  const label = mkEl("p", "hw-meta", "…or clone a named fleet:");
  dlg.body.appendChild(label);
  Object.keys(FLEETS).forEach(fid => {
    const b = document.createElement("button"); b.type = "button"; b.className = "cf-chip";
    b.textContent = "Clone: " + FLEETS[fid].name;
    b.onclick = () => { dlg.close(); cfOpenBuilder("new", null, cloneFromNamedFleet(fid)); };
    dlg.body.appendChild(b);
  });
  dlg.show();
}
function cfDialogShell(title) {
  let dlg = document.getElementById("fleet-builder");
  if (dlg) dlg.remove();
  dlg = document.createElement("dialog"); dlg.id = "fleet-builder"; dlg.className = "cf-dialog";
  const h = mkEl("h3", "cf-dialog-title", title);
  const body = document.createElement("div"); body.className = "cf-dialog-body";
  const bar = document.createElement("div"); bar.className = "cf-dialog-bar";
  dlg.append(h, body, bar);
  document.body.appendChild(dlg);
  return { el: dlg, body, bar,
    show() { dlg.showModal(); },
    close() { dlg.close(); dlg.remove(); } };
}
/* im-arc T2 fix (Sol review 2026-08-23, finding P1-7): donor edits
   atomically rebuild a by-hardware rent receipt. Stale donor keys disappear and
   every live donor receives either its retained price or the registry default. */
/* ===================== T5 rec 4 — the typed HBM capacity control =====================
   GPT Pro 2026-07-29 §6 rec 4, verbatim: "Make HBM capacity a typed quantity … Derive donor
   display values from normative `hbmBytes`, displaying both decimal GB and GiB where useful."

   What was wrong: this control showed `HW[key].hbm` — a legacy round label, 144 for Trainium3 —
   under the caption "HBM capacity GB", and multiplied whatever was typed by 1e9. The registry's
   normative capacity for that row is 154,618,822,656 B (144 GiB, from unit-explicit AWS Neuron
   docs). So a reader who read the donor value off this very field and typed it back declared
   93.13% of the donor's capacity, and seven of the ten donors lost 3.4–6.9% the same way.

   What it does now: the donor figure is derived from the normative byte record and shown in
   BOTH conventions plus its exact byte count, and the entry carries an explicit unit that is
   applied at read time — the stored quantity is always bytes.

   Note what this does NOT try to do. No round number in either unit reproduces most donors
   exactly, because the normative values are observed framebuffer readings (81,559 MiB × 2^20),
   not label arithmetic. So the invariant "a clone with no semantic change reproduces the donor
   exactly" is met the only way it can be — by such a clone carrying NO override at all — and
   this control's job is to stop inviting a lossy retype, which is what "Same as donor" is for. */
function donorHbmBytes(donorKey) {
  /* The ONE normative source, the same accessor the roofline solver reads. Never HW[k].hbm:
     that field is display metadata the R5 fix already demoted, and duplicating numeric
     authority here is precisely what rec 12 names this bug as the forcing case for. */
  return resolveHwRoofline(donorKey).hbmBytes;
}
function fmtHbmBoth(bytes) {
  const gb = bytes / 1e9, gib = bytes / 1073741824;
  return gb.toFixed(2) + " GB / " + gib.toFixed(2) + " GiB (" + bytes.toLocaleString("en-US") + " B)";
}
function cfHbmField(leg, readOnly, revalidate, field) {
  const donorBytes = donorHbmBytes(leg.donorKey);
  const wrap = document.createElement("span"); wrap.className = "cf-hbm-entry";
  const num = document.createElement("input");
  num.type = "number"; num.inputMode = "decimal"; num.step = "0.01";
  num.disabled = !!readOnly;
  const unit = document.createElement("select");
  unit.disabled = !!readOnly;
  Object.keys(CF_HBM_UNITS).forEach(u => {
    const o = document.createElement("option"); o.value = u; o.textContent = u; unit.appendChild(o);
  });
  /* GiB is the default ENTRY convention because that is what the unit-explicit vendor sources
     for these parts state (AWS Neuron "144 GiB", Google TPU "192 GiB") and what the framebuffer
     readings are minted from. It is a default for the box, not a property of the stored value. */
  unit.value = "GiB";
  const bounds = CF_BOUNDS.hbmBytes;
  /* A capacity override may be a POINT or a {lo,mid,hi} TRIPLE — the section-band machinery
     accepts both, and a legacy `hbmGB` triple folds into a byte triple. A single number box
     cannot represent a triple, and the first cut of this control divided the object by the unit
     scale: NaN, rendered as an EMPTY field, which reads as "no override" while a live override
     is silently in force — and typing anything would then replace the whole triple. So a triple
     is shown read-only, in its own words, and edited by the caller that created it. */
  const isTriple = v => v !== null && typeof v === "object"
    && ["lo", "mid", "hi"].every(k => typeof v[k] === "number");
  const fmtInUnit = (bytes, u) => String(Number((bytes / CF_HBM_UNITS[u]).toFixed(4)));
  const tripleNote = mkEl("span", "cf-field-hint tile-delta", "");
  const showStored = () => {
    const cur = leg.overrides.hbmBytes;
    const triple = isTriple(cur);
    num.hidden = triple; unit.hidden = triple;
    tripleNote.hidden = !triple;
    if (triple) {
      const u = unit.value;
      tripleNote.textContent = "This leg carries a RANGE-valued capacity override: "
        + fmtInUnit(cur.lo, u) + " / " + fmtInUnit(cur.mid, u) + " / " + fmtInUnit(cur.hi, u)
        + " " + u + " (lo / mid / hi) = " + cur.lo.toLocaleString("en-US") + " / "
        + cur.mid.toLocaleString("en-US") + " / " + cur.hi.toLocaleString("en-US") + " B. "
        + "It is shown read-only here because a single value cannot express it, and replacing it "
        + "with one number would silently discard the band the fleet was built with.";
      return;
    }
    num.value = cur == null ? "" : fmtInUnit(cur, unit.value);
    num.min = String(bounds[0] / CF_HBM_UNITS[unit.value]);
    num.max = String(bounds[1] / CF_HBM_UNITS[unit.value]);
  };
  const commit = () => {
    if (isTriple(leg.overrides.hbmBytes)) return;   /* never reachable: the box is hidden */
    const n = num.value === "" ? null : Number(num.value);
    if (n === null || !isFinite(n)) delete leg.overrides.hbmBytes;
    else leg.overrides.hbmBytes = n * CF_HBM_UNITS[unit.value];
    if (revalidate) revalidate();
  };
  num.oninput = commit;
  /* Changing the unit RE-EXPRESSES the stored bytes; it never reinterprets the typed digits as
     a new capacity. Flipping GB↔GiB with 144 in the box must not silently move the quantity. */
  unit.oninput = () => { showStored(); };
  wrap.append(num, unit, tripleNote);
  showStored();
  const w = field("HBM capacity (user-declared; stored as bytes) — donor: " + fmtHbmBoth(donorBytes), wrap);
  /* PER-DONOR, because the true answer differs per donor and a blanket sentence was WRONG.
     An earlier version said leaving the field empty was "the only entry that reproduces the
     donor's capacity exactly … no rounded number in either unit reproduces it". A review
     checked it: four of the ten donors ARE exact round quantities — Trainium3 is exactly
     144 GiB, Trainium2 exactly 96 GiB, TPU v7 exactly 192 GiB, Ascend exactly 128 GB — because
     those rows come from unit-explicit vendor documentation rather than an observed framebuffer
     reading. Telling a reader that an entry is impossible when it is one keystroke away is the
     same class of error as the capacity bug this control exists to fix, so the hint now derives
     the answer from the donor's own bytes instead of asserting a generalisation. */
  const exact = Object.entries(CF_HBM_UNITS)
    .map(([u, scale]) => ({ u, v: donorBytes / scale }))
    .find(x => Number.isInteger(x.v));
  const hint = mkEl("span", "cf-field-hint tile-delta",
    exact
      ? "Leave empty for “same as donor”. This donor's capacity is also an exact round quantity — "
        + "entering " + exact.v + " " + exact.u + " reproduces it byte for byte."
      : "Leave empty for “same as donor”, which is the only entry that reproduces this donor's "
        + "capacity exactly: its figure is an observed framebuffer reading, so no round number in "
        + "either unit lands on it.");
  w.appendChild(hint);
  return w;
}
function cfRebuildByHwRentMap(section) {
  if (!section || !section.rent || section.rent.mode !== "byHw") return;
  const prior = section.rent.usdPerHrByHw || {};
  section.rent.usdPerHrByHw = Object.fromEntries(
    [...new Set((section.legs || []).map(leg => leg.donorKey))]
      .map(key => [key, Number.isFinite(cfPointValue(prior[key], NaN)) ? prior[key] : HW[key].rent]));
}
/* The leg editor (memo §4.5): identity → editable cost/power/capacity fields (each with
   donor default + delta) → read-only spec table with the LOAO lock reason. */
function cfLegEditor(leg, idx, readOnly, opts) {
  opts = opts || {};
  const revalidate = opts.revalidate;
  const box = document.createElement("fieldset"); box.className = "cf-leg-editor";
  const lg = mkEl("legend", "", "Leg " + (idx + 1));
  box.appendChild(lg);
  const field = (labelText, input) => {
    const w = document.createElement("label"); w.className = "cf-field";
    const t = mkEl("span", "cf-field-label", labelText);
    w.append(t, input); return w;
  };
  /* T5 rec 4 — see cfHbmField/donorHbmBytes below. This control is deliberately NOT built by
     ovField: an unqualified number box is exactly what the recommendation retired. */
  /* impl-gate P1-5: numeric inputs carry their CF_BOUNDS min/max (browser clamping on
     steppers) and every edit re-validates the whole working copy live — inline errors +
     Save disabled while invalid, not click-time-only validation. */
  const txt = (val, onIn, attrs) => {
    const i = document.createElement("input"); i.type = attrs && attrs.type || "text";
    if (attrs && attrs.type === "number") {
      i.inputMode = "decimal"; if (attrs.step) i.step = attrs.step;
      if (attrs.bounds) { i.min = String(attrs.bounds[0]); i.max = String(attrs.bounds[1]); }
    }
    i.value = val == null ? "" : String(val);
    i.disabled = !!readOnly;
    i.oninput = onIn ? () => { onIn(i.value); if (revalidate) revalidate(); } : null;
    return i;
  };
  const numOrNull = v => { const n = Number(v); return v === "" ? null : (isFinite(n) ? n : null); };
  box.appendChild(field("Label", txt(leg.label, v => { leg.label = v.slice(0, 60); })));
  { const selD = document.createElement("select"); selD.disabled = !!readOnly;
    HW_ORDER.forEach(k => { const o = document.createElement("option"); o.value = k; o.textContent = HW[k].name; selD.appendChild(o); });
    selD.value = leg.donorKey;
    selD.oninput = () => {
      leg.donorKey = selD.value; leg.family = donorFamily(selD.value);
      cfRebuildByHwRentMap(opts.section);
      if (opts.rerender) opts.rerender();
      if (revalidate) revalidate();
    };
    box.appendChild(field("Donor accelerator (calibration identity)", selD)); }
  box.appendChild(field("Share %", txt(cfPointValue(leg.sharePct, 0), v => { leg.sharePct = numOrNull(v) ?? 0; }, { type: "number", step: "0.1", bounds: CF_BOUNDS.sharePct })));
  const donor = HW[leg.donorKey];
  const ovField = (key, labelText, donorVal, step) => {
    const cur = leg.overrides[key];
    const i = txt(cur, v => { const n = numOrNull(v); if (n === null) delete leg.overrides[key]; else leg.overrides[key] = n; }, { type: "number", step, bounds: CF_BOUNDS[key] });
    return field(labelText + " (donor: " + donorVal + ")", i);
  };
  /* im-arc T2 (memo §7.2): procurement, rent, electricity and TCO are section
     properties. Advanced leg controls retain only physical/capacity overrides. */
  if (opts.advanced || readOnly) {
    box.appendChild(ovField("boardPowerW", "Operating power W", Math.round(donor.tdp * 1000) + " W (TDP proxy)", "10"));
    box.appendChild(cfHbmField(leg, readOnly, revalidate, field));
  }
  { const selF = document.createElement("select"); selF.disabled = !!readOnly;
    [donorFamily(leg.donorKey), "unclassified"].forEach(f => { const o = document.createElement("option"); o.value = f; o.textContent = f; selF.appendChild(o); });
    selF.value = leg.family;
    selF.oninput = () => { leg.family = selF.value; };
    box.appendChild(field("Family (donor's, or unclassified = exempt from family adjustments, disclosed)", selF)); }
  { /* impl-gate P1-6 (memo §4.5): the COMPLETE donor-derived locked specification —
       peak rates, bandwidth, HBM, the η calibration identity, and the row's provenance
       note — not just three headline numbers. */
    const spec = document.createElement("div"); spec.className = "cf-spec-table";
    const specRow = (k, v) => spec.appendChild(mkEl("div", "cf-spec-row", k + ": " + v));
    specRow("FP8 dense", donor.flopsFp8 + " PF (read-only)");
    specRow("FP4 capable", donor.fp4 ? "yes" : "no");
    /* T5 rec 4: the locked specification quotes the NORMATIVE byte record, in both conventions,
       so the spec table and the override field can never disagree about what the donor holds. */
    specRow("HBM capacity (donor registry, normative)", fmtHbmBoth(donorHbmBytes(leg.donorKey))
      + " — overridable above as a user-declared capacity");
    specRow("HBM bandwidth", donor.bw + " TB/s (read-only)");
    { /* impl-gate fix-verify P1-6/NEW-P1: the LIVE calibration identity — engine-data's
         CALIBRATION etaDec + the universal PREFILL_CAL etaPre — never the retired
         HW.effDec/effPre descriptive metadata (h800: live 0.313491 vs legacy 0.070). */
      const cal = typeof CALIBRATION !== "undefined" ? CALIBRATION[leg.donorKey] : null;
      const etaDec = cal && typeof cal.etaDec === "number" ? cal.etaDec : null;
      const etaPre = typeof PREFILL_CAL !== "undefined" && typeof PREFILL_CAL.etaPre === "number" ? PREFILL_CAL.etaPre : null;
      specRow("η calibration identity (live)", (etaDec != null ? "decode η " + etaDec
          + (cal && cal.etaStatus ? " (" + cal.etaStatus.split(" ")[0] + ")" : "") : "decode η — no registered calibration row")
        + " / prefill η " + (etaPre != null ? etaPre + " (universal frozen identity)" : "—")
        + " — the donor's LIVE calibrated identity, carried unmodified (read-only)"); }
    { const prov = mkEl("div", "cf-spec-row cf-spec-prov", "Row provenance: " + donor.note);
      prov.title = donor.note; spec.appendChild(prov); }
    spec.appendChild(mkEl("p", "cf-spec-lock", "Performance identity carried from " + donor.name
      + " — the page's own cross-platform test (LOAO) refuses MFU transfer; editing the peak under a carried η would fabricate throughput. Peak-rate and η fields are therefore read-only (memo D-6, gate-adjudicated amendment to plan D-9.2)."));
    box.appendChild(spec); }
  if (!readOnly && opts.sectionCount > 1) {
    const move = document.createElement("select"); move.className = "cf-move-leg";
    const stay = document.createElement("option"); stay.value = ""; stay.textContent = "Move to section…"; move.appendChild(stay);
    (opts.sections || []).forEach((section, sectionIndex) => {
      if (sectionIndex === opts.sectionIndex) return;
      const o = document.createElement("option"); o.value = String(sectionIndex); o.textContent = section.label; move.appendChild(o);
    });
    move.oninput = () => { if (move.value !== "" && opts.onMove) opts.onMove(Number(move.value)); };
    box.appendChild(field("Move this leg", move));
  }
  if (!readOnly && opts.canRemove) {
    const rm = document.createElement("button"); rm.type = "button"; rm.className = "cf-chip cf-danger";
    rm.textContent = "Remove leg"; rm.onclick = opts.onRemove;
    box.appendChild(rm);
  }
  return box;
}
function cfValueField(labelText, owner, key, opts) {
  const wrap = document.createElement("div"); wrap.className = "cf-field cf-value-field";
  const raw = owner[key];
  const isRange = !!(raw && typeof raw === "object" && Number.isFinite(raw.mid));
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-8): these triples
     declare assumptions, not samples from a statistical distribution. */
  wrap.appendChild(mkEl("span", "cf-field-label", labelText + (isRange && !opts.advanced ? " (middle assumption)" : "")));
  const numberInput = (value, member) => {
    const input = document.createElement("input"); input.type = "number"; input.inputMode = "decimal";
    input.min = String(opts.bounds[0]); input.max = String(opts.bounds[1]); input.step = String(opts.step || "0.01");
    input.value = value == null ? "" : String(value); input.placeholder = opts.placeholder == null ? "" : String(opts.placeholder);
    input.disabled = !!opts.readOnly;
    input.oninput = () => {
      const next = input.value === "" ? null : Number(input.value);
      if (member) owner[key][member] = next; else owner[key] = next;
      opts.revalidate();
    };
    return input;
  };
  if (isRange && opts.advanced) {
    const row = document.createElement("div"); row.className = "cf-range-row";
    [["lo", "bottom"], ["mid", "middle assumption"], ["hi", "top"]].forEach(([member, label]) => {
      const lab = document.createElement("label"); lab.append(mkEl("span", "cf-range-label", label), numberInput(raw[member], member)); row.appendChild(lab);
    });
    wrap.appendChild(row);
  } else {
    wrap.appendChild(numberInput(cfPointValue(raw, raw), null));
  }
  if (opts.advanced && !opts.readOnly) {
    const range = document.createElement("label"); range.className = "cf-range-toggle";
    const check = document.createElement("input"); check.type = "checkbox"; check.checked = isRange;
    check.oninput = () => {
      if (check.checked) {
        const point = cfPointValue(owner[key], opts.placeholder);
        owner[key] = { lo: point, mid: point, hi: point };
      } else owner[key] = cfPointValue(owner[key], opts.placeholder);
      opts.rerender(); opts.revalidate();
    };
    range.append(check, document.createTextNode(" bottom / middle assumption / top")); wrap.appendChild(range);
  }
  return wrap;
}
function cfSectionEditor(section, sectionIndex, working, readOnly, advanced, rerender, revalidate) {
  const box = document.createElement("fieldset"); box.className = "cf-section-editor";
  box.appendChild(mkEl("legend", "", "Section " + (sectionIndex + 1)));
  const field = (labelText, input) => { const w = document.createElement("label"); w.className = "cf-field";
    w.append(mkEl("span", "cf-field-label", labelText), input); return w; };
  const text = (value, onInput) => { const input = document.createElement("input"); input.type = "text"; input.value = value || "";
    input.maxLength = 60; input.disabled = !!readOnly; input.oninput = () => { onInput(input.value); revalidate(); }; return input; };
  const numeric = (value, bounds, step, onInput) => { const input = document.createElement("input"); input.type = "number";
    input.inputMode = "decimal"; input.min = String(bounds[0]); input.max = String(bounds[1]); input.step = String(step);
    input.value = String(cfPointValue(value, 0)); input.disabled = !!readOnly;
    input.oninput = () => { onInput(input.value === "" ? null : Number(input.value)); revalidate(); }; return input; };
  box.appendChild(field("Section label", text(section.label, value => { section.label = value.slice(0, 60); })));
  box.appendChild(field("Section share %", numeric(section.sharePct, CF_BOUNDS.sharePct, 0.1, value => { section.sharePct = value; })));
  { const select = document.createElement("select"); select.className = "cf-section-basis-select"; select.disabled = !!readOnly;
    PROCUREMENT_BASES.forEach(basis => { const option = document.createElement("option"); option.value = basis;
      option.textContent = cfBasisName(basis); select.appendChild(option); });
    select.value = section.basis;
    select.oninput = () => {
      section.basis = select.value;
      if (section.basis === "owned-strategic-tco") {
        section.electricity = section.electricity || { usdPerKwh: S.kwh };
        section.pue = section.pue == null ? S.pue : section.pue;
        section.tco = section.tco || {};
      } else section.rent = section.rent || { mode: "registered", mult: 1 };
      rerender(); revalidate();
    };
    box.appendChild(field("Procurement basis — this section is priced on it", select)); }
  { /* im-arc T3 (plan §1 T3 / §4, owner answer d-20260822-4c26 2026-08-22):
       the section editor consumes the same registry-row resolver as the composer
       and MCP. Programme rows keep their coverage label; selecting one never
       promotes it into facility evidence. */
    const select = document.createElement("select"); select.disabled = !!readOnly; select.className = "cf-dc-ref";
    const none = document.createElement("option"); none.value = ""; none.textContent = "Generic / no registry row"; select.appendChild(none);
    const company = currentModel() ? companyForModel(currentModel().id) : null;
    Object.entries(registryRows()).filter(([, row]) => !company || row.company === company).forEach(([id, row]) => {
      const option = document.createElement("option"); option.value = id;
      option.textContent = (row.site || row.programme || row.operator) + " — "
        + registryRowClass(id) + " / " + (row.coverage || registryRowClass(id));
      select.appendChild(option);
    });
    select.value = section.dcRef || "";
    select.oninput = () => {
      if (!select.value) { section.dcRef = null; if (section.provenance === "generic-fill") section.provenance = null; revalidate(); return; }
      const row = registryRows()[select.value], share = cfPointValue(section.sharePct, 0);
      const allocation = Object.fromEntries((row.accelerators || []).map(accelerator => [accelerator.hwKey,
        cfPointValue(accelerator.count, 0)]));
      const replacement = registrySectionFromRow(select.value, S, allocation, sectionIndex + 1);
      if (replacement) Object.assign(section, replacement, { id: section.id, sharePct: share });
      else {
        section.dcRef = select.value; section.provenance = row.provenance;
        section.label = String(row.site || row.programme || row.operator).slice(0, 60);
        if (row.regionRef) section.electricity = { regionRef: row.regionRef };
      }
      rerender(); revalidate();
    };
    box.appendChild(field("Facility / programme registry row (coverage class shown)", select)); }
  if (section.basis === "owned-strategic-tco") {
    section.electricity = section.electricity || { usdPerKwh: S.kwh };
    section.pue = section.pue == null ? S.pue : section.pue;
    section.tco = section.tco || {};
    box.appendChild(cfValueField("Electricity $/kWh", section.electricity, "usdPerKwh", {
      bounds: CF_BOUNDS.kwhPerKwh, step: 0.001, placeholder: S.kwh, readOnly, advanced, rerender, revalidate }));
    box.appendChild(cfValueField("PUE", section, "pue", {
      bounds: [1, 3], step: 0.01, placeholder: S.pue, readOnly, advanced, rerender, revalidate }));
    if (advanced) {
      const uniqueDonors = [...new Set(section.legs.map(leg => leg.donorKey))];
      section.tco.capexUsdByHw = section.tco.capexUsdByHw || {};
      /* im-arc T4 fold round 4 (2026-08-25), memo :41: a capex the READER states is meaningless
         without the input scope of the observation, and the validator now refuses the pair without
         it. The control is therefore not optional decoration — it is seeded to the scope the
         registry rows for these donors already agree on (so the box opens on the truth rather than
         a guess), and the reader is shown the EFFECTIVE clustered capex the scope implies. */
      if (section.tco.capexScope == null) {
        const scopes = [...new Set(uniqueDonors.map(key => (hardwareRow(key) || {}).capexScope).filter(Boolean))];
        section.tco.capexScope = scopes.length === 1 ? scopes[0] : "bare-card";
      }
      { const wrap = document.createElement("label"); wrap.className = "cf-field";
        const span = document.createElement("span"); span.textContent = "Capex input scope";
        const select = document.createElement("select"); select.className = "cf-capex-scope";
        select.disabled = !!readOnly;
        for (const scope of DC_SCHEMA.CAPEX_SCOPES) {
          const option = document.createElement("option");
          option.value = scope; option.textContent = scope;
          if (section.tco.capexScope === scope) option.selected = true;
          select.appendChild(option);
        }
        select.addEventListener("change", () => {
          section.tco.capexScope = select.value; revalidate(); rerender();
        });
        wrap.appendChild(span); wrap.appendChild(select); box.appendChild(wrap);
        const note = document.createElement("p"); note.className = "cf-note";
        note.textContent = "What the stated capex per accelerator MEASURES. It selects the cluster "
          + "overhead and is never assumed: an installed-system price already contains its clustering.";
        box.appendChild(note); }
      uniqueDonors.forEach(key => {
        if (section.tco.capexUsdByHw[key] == null) section.tco.capexUsdByHw[key] = HW[key].capex;
        box.appendChild(cfValueField("Capex for " + HW[key].name + " ($/accelerator)", section.tco.capexUsdByHw, key, {
          bounds: CF_BOUNDS.capexUsd, step: 500, placeholder: HW[key].capex, readOnly, advanced, rerender, revalidate }));
        const band = DC_SCHEMA.CLUSTER_OH_BY_CAPEX_SCOPE[section.tco.capexScope];
        if (band) {
          const preview = document.createElement("p"); preview.className = "cf-note cf-capex-preview";
          preview.textContent = "→ " + Math.round(section.tco.capexUsdByHw[key] * band.mid).toLocaleString("en-US")
            + " effective clustered $/accelerator (" + section.tco.capexScope + " × " + band.mid + ")";
          box.appendChild(preview);
        }
      });
      for (const spec of [
        ["lifeYears", "Useful life (years)", [1, 15], 0.1, S.lifeYears],
        ["dcPerW", "Datacenter capex ($/W)", [1, 50], 0.1, S.dcPerW],
        ["clusterOh", "Cluster overhead multiplier", [1, 3], 0.01, S.clusterOh],
        ["opexPct", "Annual operations (% capex)", [0, 50], 0.1, S.opexPct],
      ]) {
        if (section.tco[spec[0]] == null) section.tco[spec[0]] = spec[4];
        box.appendChild(cfValueField(spec[1], section.tco, spec[0], {
          bounds: spec[2], step: spec[3], placeholder: spec[4], readOnly, advanced, rerender, revalidate }));
      }
    }
  } else {
    section.rent = section.rent || { mode: "registered", mult: 1 };
    { const select = document.createElement("select"); select.className = "cf-rent-mode"; select.disabled = !!readOnly;
      [["flat", "Flat $/accelerator-hour"], ["registered", "Registered row rate × multiplier"], ["byHw", "Per accelerator"]]
        .forEach(([value, label]) => { const option = document.createElement("option"); option.value = value; option.textContent = label; select.appendChild(option); });
      select.value = section.rent.mode;
      select.oninput = () => {
        if (select.value === "flat") section.rent = { mode: "flat", usdPerHr: HW[section.legs[0].donorKey].rent };
        if (select.value === "registered") section.rent = { mode: "registered", mult: 1 };
        if (select.value === "byHw") section.rent = { mode: "byHw", usdPerHrByHw: Object.fromEntries(
          [...new Set(section.legs.map(leg => leg.donorKey))].map(key => [key, HW[key].rent])) };
        rerender(); revalidate();
      };
      box.appendChild(field("Rent mode", select)); }
    if (section.rent.mode === "flat") box.appendChild(cfValueField("Flat rent ($/accelerator-hour)", section.rent, "usdPerHr", {
      bounds: CF_BOUNDS.rentPerHr, step: 0.01, placeholder: HW[section.legs[0].donorKey].rent, readOnly, advanced, rerender, revalidate }));
    if (section.rent.mode === "registered") box.appendChild(cfValueField("Registered rent multiplier", section.rent, "mult", {
      bounds: [0.02, 20], step: 0.01, placeholder: 1, readOnly, advanced, rerender, revalidate }));
    if (section.rent.mode === "byHw") {
      section.rent.usdPerHrByHw = section.rent.usdPerHrByHw || {};
      [...new Set(section.legs.map(leg => leg.donorKey))].forEach(key => {
        if (section.rent.usdPerHrByHw[key] == null) section.rent.usdPerHrByHw[key] = HW[key].rent;
        box.appendChild(cfValueField("Rent for " + HW[key].name + " ($/accelerator-hour)", section.rent.usdPerHrByHw, key, {
          bounds: CF_BOUNDS.rentPerHr, step: 0.01, placeholder: HW[key].rent, readOnly, advanced, rerender, revalidate }));
      });
    }
  }
  if (advanced) box.appendChild(field("Section provenance note", text(section.provenance, value => { section.provenance = value || null; })));
  const legs = document.createElement("div"); legs.className = "cf-section-legs";
  section.legs.forEach((leg, legIndex) => legs.appendChild(cfLegEditor(leg, legIndex, readOnly, {
    advanced, sections: working.sections, sectionIndex, sectionCount: working.sections.length,
    section, rerender,
    canRemove: section.legs.length > 1,
    onRemove: () => { section.legs.splice(legIndex, 1); cfRebuildByHwRentMap(section); rerender(); revalidate(); },
    onMove: target => { const moved = section.legs.splice(legIndex, 1)[0]; working.sections[target].legs.push(moved);
      cfRebuildByHwRentMap(section); cfRebuildByHwRentMap(working.sections[target]); rerender(); revalidate(); },
    revalidate,
  })));
  box.appendChild(legs);
  if (!readOnly) {
    const controls = document.createElement("div"); controls.className = "cf-manage-row";
    const totalLegs = () => working.sections.reduce((sum, row) => sum + row.legs.length, 0);
    const add = document.createElement("button"); add.type = "button"; add.className = "cf-chip cf-add-leg"; add.textContent = "＋ Add leg";
    add.onclick = () => { if (totalLegs() >= CF_MAX_LEGS) return; section.legs.push(makeLegFromDonor("h100", 0));
      cfRebuildByHwRentMap(section); rerender(); revalidate(); };
    const norm = document.createElement("button"); norm.type = "button"; norm.className = "cf-chip"; norm.textContent = "Normalize leg shares";
    norm.onclick = () => { section.legs = normalizeShares(section.legs); rerender(); revalidate(); };
    controls.append(add, norm);
    if (working.sections.length > 1) {
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "cf-chip cf-danger cf-remove-section"; remove.textContent = "Remove section";
      remove.onclick = () => { working.sections.splice(sectionIndex, 1); rerender(); revalidate(); }; controls.appendChild(remove);
    }
    box.appendChild(controls);
  }
  return box;
}
function cfOpenBuilder(mode, fleetId, seed) {
  const src = customFleetSource();
  const readOnly = mode === "view";
  let working;
  if (mode === "edit") {
    const def = src.resolve(fleetId); if (!def) return; working = structuredClone(def);
  } else working = structuredClone(seed || makeBlankFleet());
  /* A v1 fleet reaches the builder as one migration section. Before it can be edited
     or saved as v7, promote `inherit` to the effective basis; it never escapes anew. */
  { const normalized = validateCustomFleet(working, { requireId: false });
    if (normalized.ok) working = normalized.fleet;
    working.sections.forEach(section => {
      if (section.basis !== "inherit") return;
      if (S.hwMode === "tco") section.basis = "owned-strategic-tco";
      else {
        const bases = [...new Set(section.legs.map(leg => legProcurementBasis(leg.donorKey, S)))];
        section.basis = bases.length === 1 ? bases[0] : "committed-planning-rent";
      }
      if (section.basis !== "owned-strategic-tco") section.rent = section.rent || { mode: "registered", mult: 1 };
    }); }
  const dlg = cfDialogShell(readOnly ? "Named fleet — read-only drill-down" : (mode === "edit" ? "Edit custom fleet" : "New custom fleet"));
  if (readOnly) dlg.body.appendChild(mkEl("p", "cf-banner", "Named fleet — composition is fixed (registry-attributed). Clone to edit."));
  const nameI = document.createElement("input"); nameI.type = "text"; nameI.value = working.name; nameI.disabled = readOnly; nameI.maxLength = 60;
  { const w = document.createElement("label"); w.className = "cf-field"; w.append(mkEl("span", "cf-field-label", "Fleet name"), nameI); dlg.body.appendChild(w); }
  let advanced = false, saveBtn = null;
  const errBox = mkEl("p", "cf-errors", ""); errBox.setAttribute("aria-live", "polite");
  const sectionsBox = document.createElement("div"); sectionsBox.className = "cf-sections";
  const revalidate = () => {
    if (readOnly) return true;
    const v = validateCustomFleet(working, { requireId: false });
    errBox.textContent = v.ok ? "" : v.errors.join("; ");
    if (saveBtn) saveBtn.disabled = !v.ok;
    return v.ok;
  };
  const renderSections = () => {
    sectionsBox.textContent = "";
    working.sections.forEach((section, index) => sectionsBox.appendChild(
      cfSectionEditor(section, index, working, readOnly, advanced, renderSections, revalidate)));
  };
  nameI.oninput = () => { working.name = nameI.value; revalidate(); };
  if (!readOnly) {
    const modeToggle = document.createElement("button"); modeToggle.type = "button"; modeToggle.className = "cf-chip cf-mode-toggle";
    const updateModeText = () => { modeToggle.textContent = advanced ? "Basic section inputs" : "Advanced section inputs"; };
    updateModeText(); modeToggle.onclick = () => { advanced = !advanced; updateModeText(); renderSections(); revalidate(); };
    dlg.body.appendChild(modeToggle);
  }
  renderSections(); dlg.body.append(sectionsBox);
  if (!readOnly) {
    const controls = document.createElement("div"); controls.className = "cf-manage-row cf-section-controls";
    const add = document.createElement("button"); add.type = "button"; add.className = "cf-chip cf-add-section"; add.textContent = "＋ Section";
    add.onclick = () => {
      if (working.sections.length >= CF_MAX_SECTIONS) return;
      const used = new Set(working.sections.map(section => section.id)); let n = 1; while (used.has("s" + n)) n++;
      working.sections.push(makeBlankSection("s" + n, 0)); renderSections(); revalidate();
    };
    const norm = document.createElement("button"); norm.type = "button"; norm.className = "cf-chip"; norm.textContent = "Normalize section shares";
    norm.onclick = () => { working.sections = normalizeShares(working.sections); renderSections(); revalidate(); };
    controls.append(add, norm); dlg.body.appendChild(controls);
  }
  dlg.body.appendChild(errBox);
  const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "cf-chip";
  cancel.textContent = readOnly ? "Close" : "Cancel (discard changes)"; cancel.onclick = () => dlg.close(); dlg.bar.appendChild(cancel);
  if (!readOnly) {
    const save = document.createElement("button"); save.type = "button"; save.className = "cf-chip cf-primary"; save.textContent = "Save fleet";
    saveBtn = save; revalidate();
    save.onclick = () => {
      const candidate = { ...working, epoch: DEFAULTS_EPOCH, id: working.id || newCustomFleetId(src.ids()) };
      const v = validateCustomFleet(candidate, { requireId: true });
      if (!v.ok) { errBox.textContent = "Not saved — " + v.errors.join("; "); return; }
      src.save(v.fleet); dlg.close(); FLEET_ID = v.fleet.id;
      const fb = fleetBaselineBlend(v.fleet.id, S, appEngineContext()); if (fb) S.blend = fb;
      if (noteUserEdit()) { fullRefresh(); return; } fullRefresh();
    };
    dlg.bar.appendChild(save);
  }
  dlg.show();
}
/* Per-fleet disclosure (memo C-5; fleet memo §2.4 ruling c): typed DTO fields only.
   Deliberately NO per-fleet margin preview (anti-shopping; the span line gives the
   honest range). */
function renderFleetDisclosure() {
  const d = document.createElement("div"); d.className = "fleet-disclosure";
  const m = currentModel();
  /* b9 M4 (memo §5.3): the user-custom disclosure — class chip, fixed attribution, the
     live two-boolean feasibility readout, and the derived electricity chip. NO evidence
     numbers: the typed profile carries them as null-with-reason and nothing here may
     invent one. */
  if (m && isCustomFleetId(FLEET_ID)) {
    const prof = fleetEvidenceProfile(FLEET_ID, S, appEngineContext());
    if (!prof) { d.textContent = "—"; return d; }
    const chip = mkEl("span", "fleet-class-chip fleet-class-user-custom",
      "user-custom — never a default; user composition");
    d.appendChild(chip);
    d.appendChild(mkEl("p", "fleet-attribution", "Attribution: " + prof.attribution));
    { // impl-gate P1-2 (memo §7.3): a stale-epoch fleet still loads, LOUDLY.
      const defSel = customFleetSource().resolve(FLEET_ID);
      if (defSel && defSel.epoch !== DEFAULTS_EPOCH) {
        d.appendChild(mkEl("p", "fleet-attribution", "⚠ This fleet was saved under an older defaults epoch ("
          + defSel.epoch + "; the page now runs " + DEFAULTS_EPOCH + ") — its numbers were minted under "
          + "older defaults and re-evaluate under the current engine."));
      } }
    const wl = appWorkload(S);
    const fr = wl && wl.fleetRenderable;
    if (fr) d.appendChild(mkEl("p", "fleet-live-readout",
      "At the CURRENT scenario: " + fr.renderableLegs + " of " + fr.totalLegs + " legs render ("
      + Math.round((fr.renderableWeightShare || 0) * 100) + "% of weight)."));
    { /* im-arc T2 (memo §7.1): electricity is disclosed by section, never
         weight-averaged across rented and owned sections into a false fleet scalar. */
      const def = customFleetSource().resolve(FLEET_ID);
      const sections = cfSectionsOf(def);
      const composition = wl.composition || [];
      const ownedShare = composition.filter(row => row.basis === "owned-strategic-tco")
        .reduce((sum, row) => sum + row.share, 0);
      const rentedShare = composition.filter(row => row.basis !== "owned-strategic-tco")
        .reduce((sum, row) => sum + row.share, 0);
      const ownedRates = composition.filter(row => row.basis === "owned-strategic-tco").map(row => {
        const section = sections.find(candidate => candidate.id === row.sectionId);
        return section ? cfElectricityPoint(section) : S.kwh;
      });
      let text = "Electricity: "
        + (ownedShare > 0 ? "explicit on " + Math.round(ownedShare * 100) + "% owned share"
          + (ownedRates.length ? " (" + ownedRates.map(rate => "$" + rate.toFixed(3) + "/kWh").join(", ") + ")" : "") : "no owned share")
        + "; " + (rentedShare > 0 ? "embedded in rent on " + Math.round(rentedShare * 100) + "% rented share." : "no rented share.");
      /* im-arc T2 director fix (browser suite B-8, 2026-08-23): the two b9 M4 disclosures stay on
         the chip when legs carry $/kWh overrides — the weight-averaged price, labelled DERIVED, and
         the honesty clause that on rented sections those overrides price nothing (D-2). The section
         composition above does not replace them; a reader who typed an override must be told. */
      const ovLegs = sections.flatMap(sec => (sec.legs || []).map(leg => ({ sec, leg })))
        .filter(x => x.leg.overrides && x.leg.overrides.kwhPerKwh != null);
      if (ovLegs.length) {
        const allLegs = sections.flatMap(sec => (sec.legs || []).map(leg => ({ sec, leg })));
        /* im-arc T2 fix (Sol review 2026-08-23, finding P1-8): every
           point-or-triple enters disclosure arithmetic through its middle point. */
        const sum = allLegs.reduce((a, x) => a
          + (cfPointValue(x.sec.sharePct, 0) / 100) * cfPointValue(x.leg.sharePct, 0), 0) || 1;
        const avg = allLegs.reduce((a, x) => a
          + ((cfPointValue(x.sec.sharePct, 0) / 100) * cfPointValue(x.leg.sharePct, 0) / sum)
          * (x.leg.overrides && x.leg.overrides.kwhPerKwh != null
            ? cfPointValue(x.leg.overrides.kwhPerKwh, cfElectricityPoint(x.sec))
            : cfElectricityPoint(x.sec)), 0);
        text += " Per-leg $/kWh overrides: $" + avg.toFixed(3) + "/kWh weight-averaged — DERIVED from per-leg overrides"
          + (ownedShare > 0 ? " (live on owned sections" + (rentedShare > 0 ? "; on rented sections the overrides price nothing here — electricity is embedded in the rent)." : ").")
            : " (inert under the current rent basis — electricity is embedded in the rent, and the overrides price nothing here).");
      }
      const kwhChip = mkEl("p", "fleet-kwh-chip", text);
      kwhChip.id = "fleet-kwh-chip"; kwhChip.title = TIPS.energy.b;
      d.appendChild(kwhChip);
    }
    return d;
  }
  if (!m || !isNamedFleetId(FLEET_ID)) {
    d.textContent = FLEET_ID === "custom"
      ? "Custom blend \u2014 user-chosen weights; no named-fleet attribution applies."
      : "Model preset (analyst) \u2014 the identity's own blend; no named-fleet attribution applies.";
    return d;
  }
  const prof = fleetEvidenceProfile(FLEET_ID, S, appEngineContext());
  if (!prof) { d.textContent = "\u2014"; return d; }
  const wl = appWorkload(S);
  const fr = wl && wl.fleetRenderable;
  const chip = mkEl("span", "fleet-class-chip fleet-class-" + prof.class,
    prof.class + (prof.class === "counterfactual" ? " \u2014 never a default; comparison only" : ""));
  d.appendChild(chip);
  d.appendChild(mkEl("p", "fleet-attribution", "Attribution: " + prof.attribution));
  d.appendChild(mkEl("p", "fleet-badges",
    "Evidenced weight share: " + Math.round(prof.evidencedWeightShare * 100) + "%"
    + " \u00b7 independent evidence clusters at this scenario: " + prof.renderableIndependentEvidenceClusters
    + " \u00b7 gate-7: " + (appLandingCentralEligible() ? "central-eligible" : "named-scenario-only")));
  if (fr) d.appendChild(mkEl("p", "fleet-live-readout",
    "At the CURRENT scenario: " + fr.renderableLegs + " of " + fr.totalLegs + " legs render ("
    + Math.round((fr.renderableWeightShare || 0) * 100) + "% of weight); policy-clean share "
    + Math.round((prof.renderableWeightShare || 0) * 100) + "% \u2014 the two are different quantities (two-boolean contract)."));
  if (FLEET_ID === DEFAULT_FLEET_ID) {
    const memb = appDefaultMembership();
    if (memb) d.appendChild(mkEl("p", "fleet-membership-head", membershipExclusionClause(memb)));
  }
  /* b9 M4 (memo §4.6/D-9.2): the read-only drill-down entry on named fleets — the same
     builder surface, fully locked, "Clone to edit" banner. */
  { const view = document.createElement("button"); view.type = "button"; view.className = "cf-chip";
    view.textContent = "View legs…";
    const fid = FLEET_ID;
    view.onclick = () => cfOpenBuilder("view", null, cloneFromNamedFleet(fid));
    d.appendChild(view); }
  // b9 M3 (memo §3.4; plan D-2): named/default fleets carry ONE blended electricity price —
  // the owned-TCO input s.kwh, surfaced as a labeled chip so the single-price assumption is
  // visible even under rent lenses (where it prices nothing). im-arc T2 moves custom
  // electricity to the section/data-center channel; hardware rows never price it.
  { const kwhChip = mkEl("p", "fleet-kwh-chip",
      "Blended electricity cost (owned-TCO input): $" + S.kwh.toFixed(3) + "/kWh — one blended price across all legs"
      + (S.hwMode === "tco" ? " (live in the current owned/strategic-TCO lens)." : " (inert under the current rent basis — electricity is embedded in the rent).")
      + " Section-specific electricity arrives with custom fleets.");
    kwhChip.id = "fleet-kwh-chip"; kwhChip.title = TIPS.energy.b;
    d.appendChild(kwhChip); }
  return d;
}

/* ---------- THE 1 / 2 / 3-POINT SLIDER MODE (row 499, owner note 507081) ----------
   One toggle above the sliders. 1 point is what this page always did. 2 points asks for a lower and
   an upper bound. 3 points adds a MEDIAN between them — median, not mode, because the published
   comparison of three-point shapes finds median-characterised distributions fit better than the
   mode-characterised ones the textbook estimate uses.

   What the page then computes is an ATTAINABLE RANGE, never a probability. There is no PERT mean
   here, no triangular mean and no percentile: nothing in this page's evidence base licenses a
   distribution shape, and both adjudicators explicitly declined to supply one. The engine finds the
   range by probing each dial for monotonicity and evaluating corners — see `marginBand`. */
let POINT_MODE = 1;
/* owner ruling q-sliders-fleet-util-point, note 52e1be (2026-08-09): the derived-fleets overlay is a
   TOGGLE, and he allowed it off by default. Off is the honest default too — the envelope's three
   numbers are the answer; the three fleets behind them are the audit. */
let MIX_OVERLAY_OPT_IN = false;
/* SAY WHAT THE RANGE IS, never what it is not (owner ruling, 2026-08-07). The earlier wording
   disclaimed \u2014 "not a probability interval", "no distribution is assumed" \u2014 and a disclaimer is a
   poor instrument here: it puts the words "probability" and "distribution" in front of a reader who
   was not thinking them, and half of them will remember the term and not the negation. The positive
   statement is also the more complete one, because reachability is the entire claim. */
/* AMENDED 2026-09-19 (Polaris ruling on Astra pack A P0-2). The positive-statement rule above is
   unchanged; what changed is which positive statement is true. "No setting reaches outside it"
   asserts exhaustiveness, and the page searches — corners, plus a handful of samples per axis —
   so where the modeled fleet changes shape between samples a legal setting CAN compute outside
   the range. Astra found one: grok/median over ioRatio 1–100 reported −42.396…–36.972… while
   ioRatio = 86 computes −42.585…. The copy now states the method, which is both true and more
   useful than the claim it replaces. */
const POINT_MODE_COPY = "The range found by searching the dials you bounded: every corner of the "
  + "box they describe, plus samples along each axis. Where the modeled fleet changes shape "
  + "between samples a setting can compute outside it, and the range says so when that shows. "
  + "The middle point is the MEDIAN you stated.";

/* The toggle has to REFLECT the scenario, not just drive it: a preset (or a shared link) that
   carries declared ranges is a 2- or 3-point scenario whatever the reader last clicked, and opening
   it on "1 point" would show the toggle contradicting the page beside it.

   Raised only, never lowered, and that asymmetry is the whole design. Lowering on every render would
   snap a reader back to 1 the instant they chose 2 with nothing bounded yet — the state would be
   fighting the gesture. Raising is monotone and predictable: a scenario that declares a range moves
   the toggle up to meet it, and the only way back down is the reader's own click, which clears the
   ranges and says so. */
function syncPointModeToState() {
  const rs = Object.values(S.dialRanges || {});
  if (!rs.length) return;
  POINT_MODE = Math.max(POINT_MODE, rs.some(r => r && r.mid != null) ? 3 : 2);
}

function pointModeControl() {
  syncPointModeToState();
  const box = mkEl("div", "point-mode");
  box.appendChild(mkEl("span", "point-mode-label", "Each assumption is:"));
  const row = mkEl("div", "radio-row");
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "How many points each assumption carries");
  [[1, "1 point"], [2, "2 points (bounds)"], [3, "3 points (median + bounds)"]].forEach(([v, label]) => {
    const b = mkEl("button", null, label);
    b.type = "button";
    b.setAttribute("aria-pressed", String(POINT_MODE === v));
    b.onclick = () => {
      POINT_MODE = v;
      /* Dropping back to 1 point CLEARS declared ranges rather than hiding them: a range you can no
         longer see is a claim you can no longer check, and it would still travel in your share link. */
      if (v === 1 && S.dialRanges) { S.dialRanges = null; }
      if (noteUserEdit()) { fullRefresh(); return; }
      fullRefresh();
    };
    row.appendChild(b);
  });
  box.appendChild(row);
  if (POINT_MODE > 1) box.appendChild(mkEl("p", "hw-note", POINT_MODE_COPY));
  return box;
}

/* The extra handles for ONE dial, by dial id, written straight into `S.dialRanges`.
   Written against an id rather than a slider descriptor because procurement dials are not sliders
   in the generic sense — they live inside the rent-discount control, which returns before the
   generic path is reached. Leaving them out was not a cosmetic gap: the spike measured procurement
   as the widest single axis on the page-open preset, so a range feature that cannot bound it can
   only under-report the disagreement it exists to show. */
function rangeHandlesFor(id, label, min, max, step, point) {
  if (POINT_MODE < 2) return null;
  if (!dialBounds(id)) return null;          // a dial with no declared domain carries no range
  const cur = (S.dialRanges && S.dialRanges[id]) || {};
  /* WHERE THE HANDLES START (owner ruling 2026-08-07 18:55Z): a mode change never moves a handle the
     reader already placed. Second handle stacked on the first; third at the midpoint of the two.
     The arithmetic is the engine's, so it can be checked over every combination rather than eyeballed. */
  const at = bandHandleDefaults(cur, point, min, max, step);
  const box = mkEl("div", "range-handles");
  const put = (which, value) => {
    S.dialRanges = Object.assign({}, S.dialRanges || {});
    const next = Object.assign({}, S.dialRanges[id] || {}, { [which]: value });
    /* Keep the triple ordered as the reader moves it, rather than rejecting the gesture: dragging a
       lower bound past an upper one is a normal thing to do on the way to what you meant. */
    if (next.lo != null && next.hi != null && next.lo > next.hi) {
      if (which === "lo") next.hi = next.lo; else next.lo = next.hi;
    }
    if (next.mid != null && next.lo != null) next.mid = Math.max(next.mid, next.lo);
    if (next.mid != null && next.hi != null) next.mid = Math.min(next.mid, next.hi);
    S.dialRanges[id] = next;
  };
  /* OWNER ANNOTATION n9c61af (2026-08-16, verbatim: "not what I envisioned, 3 stacked dots should
     be on a single line, then have them be able to move on that line, we don't want 4 separate
     lines, that's confusing and clunky").

     ONE track, three dots. The three inputs are still native <input type="range"> — overlaid on a
     single line rather than replaced by hand-rolled drag handles — and that is the load-bearing
     decision here, not a shortcut. The browser's own step snapping (value = min + n·step, its
     rounding, its string→number behaviour) is what has been writing S.dialRanges all along; a
     pointer-math reimplementation would re-derive those values from percentages and could land a
     hair off on a log or fractional-step dial, which is a MOVED NUMBER for something that was
     asked to be a layout fix. Keyboard support, arrow-key stepping, AT announcement and the
     touch target all come free from the same decision. Only the geometry and the readout changed;
     `put` below is untouched.

     The dots sit on the RANGE's own linear axis, labelled at both ends, which is why it reads as
     its own line rather than an overlay on the parameter slider above it — that slider is log on
     the size dials, and a dot that claimed to sit at the tick above it while sitting somewhere
     else would be a worse lie than a separate axis honestly labelled. */
  const pos = v => (v - min) / (max - min) * 100;
  const band = mkEl("div", "range-band");
  band.setAttribute("role", "group");
  band.setAttribute("aria-label", label + " — declared range");
  band.appendChild(mkEl("span", "range-end", fmtRangeEnd(min, step)));
  const line = mkEl("div", "range-line");
  const fill = mkEl("div", "range-fill");
  line.appendChild(fill);
  const readout = mkEl("div", "range-readout");
  const parts = {};
  const syncFill = () => {
    const lo = Number(parts.lo.inp.value), hi = Number(parts.hi.inp.value);
    fill.style.left = pos(Math.min(lo, hi)) + "%";
    fill.style.width = Math.abs(pos(hi) - pos(lo)) + "%";
  };
  const syncReadout = () => {
    readout.textContent = ["lo", "mid", "hi"].filter(w => parts[w])
      .map(w => parts[w].sub + " " + parts[w].inp.value).join(" · ");
  };
  const handle = (which, sub, initial) => {
    const inp = document.createElement("input");
    inp.type = "range"; inp.min = min; inp.max = max; inp.step = step;
    inp.value = initial;
    inp.className = "range-dot range-dot-" + which;
    inp.dataset.rangeWhich = which;
    inp.setAttribute("aria-label", label + " " + sub);
    inp.oninput = () => {
      put(which, Number(inp.value));
      /* `put` re-orders the stored triple when a drag crosses another handle; the DOM has to show
         the same state it stored, or the next drag would start from a value the engine no longer
         holds. Read back rather than assume. */
      const stored = (S.dialRanges && S.dialRanges[id]) || {};
      ["lo", "mid", "hi"].forEach(w => {
        if (parts[w] && stored[w] != null && Number(parts[w].inp.value) !== stored[w])
          parts[w].inp.value = stored[w];
      });
      syncFill(); syncReadout();
      if (noteUserEdit()) return;
      onChange();
    };
    parts[which] = { inp, sub };
    line.appendChild(inp);
  };
  handle("lo", "lower", at.lo);
  if (POINT_MODE === 3) handle("mid", "median", at.mid);
  handle("hi", "upper", at.hi);
  band.appendChild(line);
  band.appendChild(mkEl("span", "range-end", fmtRangeEnd(max, step)));
  box.appendChild(band);
  syncFill(); syncReadout();
  box.appendChild(readout);
  return box;
}
/* Endpoint labels carry the dial's own precision — an 0.05-step dial reading "0" and "2" instead
   of "0.20" and "1.50" would misstate its domain at both ends. */
function fmtRangeEnd(v, step) {
  const dp = (String(step).split(".")[1] || "").length;
  return dp ? Number(v).toFixed(dp) : String(v);
}
function rangeHandles(p) { return rangeHandlesFor(p.k, p.label, p.min, p.max, p.step, S[p.k]); }

/* ---------- PRESET NULL CONVENTION (row 499, owner ruling) ----------
   "When an adjudicator preset doesn't specify a dial, fill with the default value MARKED with an
   asterisk — every dial gets a value with provenance."

   The problem it solves: a reader looking at an estimate preset could not tell which values that
   adjudicator actually chose and which were simply whatever this page already had. Both look like
   settings. One is a claim and the other is an inheritance, and the difference matters most exactly
   where the estimate is most confident.

   Scope is PERSPECTIVE SPACE — the dials a perspective can author. Model-owned values (sizes,
   tariffs) come from the model preset and are a different provenance question, already answered by
   the model dossier. The mark is suppressed once the state is edited or carries no clean
   perspective identity, because then no preset is claiming anything about any dial. */
const PRESET_DEFAULT_MARK = "*";
function presetDefaultMark(key) {
  if (MODIFIED_FROM || EXPLORATION_ORIGIN) return "";
  const p = currentPersp();
  if (!p || !p.set) return "";
  if (!PERSPECTIVE_SPACE_KEYS.includes(key)) return "";
  /* `dive` composes the MODEL's own replay vector, so "what the preset specified" is that vector. */
  const authored = (p.id === "dive")
    ? ((currentModel() && currentModel().dive) || {})
    : p.set;
  return Object.prototype.hasOwnProperty.call(authored, key) ? "" : PRESET_DEFAULT_MARK;
}

/* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): nullable
   absolute prices need a real blank state; a range handle cannot represent "use registered". */
function buildNullableNumber(wrap, p) {
  const head = mkEl("div", "param-head");
  const name = mkEl("span", "param-name"); name.append(p.label, infoBtn(p.tip));
  const val = mkEl("span", "param-val", S[p.k] == null ? p.nullable : "$" + Number(S[p.k]).toFixed(2) + "/hr");
  head.append(name, val); wrap.appendChild(head);
  const row = mkEl("div", "abs-row"); row.appendChild(mkEl("span", "hw-name", "One price for every priced leg"));
  const input = document.createElement("input"); input.type = "number";
  input.min = p.min; input.max = p.max; input.step = p.step; input.placeholder = p.nullable;
  input.value = S[p.k] == null ? "" : String(S[p.k]); input.setAttribute("aria-label", p.label);
  const clear = mkEl("button", "abs-clear", "Use rates"); clear.type = "button";
  /* im-arc T1 fix (Sol review 2026-08-22, finding P2-3). */
  clear.setAttribute("aria-label", "Rental price, all accelerators: use registered rates");
  const apply = () => {
    if (input.value === "") S[p.k] = null;
    else if (input.validity.valid && isFinite(Number(input.value))) S[p.k] = Number(input.value);
    else return;
    val.textContent = S[p.k] == null ? p.nullable : "$" + S[p.k].toFixed(2) + "/hr";
    afterScenarioAxisEdit(p.k); if (noteUserEdit()) return; onChange();
  };
  input.oninput = apply;
  clear.onclick = () => { input.value = ""; apply(); };
  row.append(input, clear); wrap.appendChild(row);
  return wrap;
}

/* im-arc T4 fold (2026-08-24), memo §4: three registered rows now carry NO admissible public
   planning rate, so a control that assumed a number here threw. A row with no rate says so, and
   names the declared replay a reader can state instead — never a fabricated figure and never a
   blank that reads as zero. */
function registeredRentLabel(hwKey) {
  const row = HW[hwKey];
  if (row && typeof row.rent === "number") return " — registered $" + row.rent.toFixed(3) + "/hr";
  return " — no admissible public planning rate; state one below to price this leg";
}
function buildRentAbsolute(wrap, p) {
  const head = mkEl("div", "param-head");
  const name = mkEl("span", "param-name"); name.append("Absolute rental price by accelerator", infoBtn(p.tip));
  head.appendChild(name); wrap.appendChild(head);
  const w = blendWeights(S);
  const legs = HW_ORDER.filter(k => w[k]);
  wrap.appendChild(mkEl("p", "hw-note", "A donor-specific price wins over the fleet-wide price and every multiplier; blank uses the next available rule."));
  legs.forEach(k => {
    const row = mkEl("div", "abs-row"); row.dataset.hwKey = k; row.dataset.hwKind = "absolute-cost";
    row.appendChild(mkEl("span", "hw-name", HW[k].name + registeredRentLabel(k)));
    const input = document.createElement("input"); input.type = "number";
    input.min = 0.05; input.max = 50; input.step = 0.05;
    input.placeholder = "not set";
    input.value = S.rentAbsLeg && S.rentAbsLeg[k] != null ? String(S.rentAbsLeg[k]) : "";
    input.setAttribute("aria-label", HW[k].name + " absolute rental price per accelerator-hour");
    const clear = mkEl("button", "abs-clear", "Use fallback"); clear.type = "button";
    /* im-arc T1 fix (Sol review 2026-08-22, finding P2-3). */
    clear.setAttribute("aria-label", HW[k].name + ": use fallback rental rate");
    const apply = () => {
      const next = { ...(S.rentAbsLeg || {}) };
      if (input.value === "") delete next[k];
      else if (input.validity.valid && isFinite(Number(input.value))) next[k] = Number(input.value);
      else return;
      S.rentAbsLeg = Object.keys(next).length ? next : null;
      afterScenarioAxisEdit("rentAbsLeg"); if (noteUserEdit()) return; onChange();
    };
    input.oninput = apply; clear.onclick = () => { input.value = ""; apply(); };
    row.append(input, clear); wrap.appendChild(row);
  });
  wrap.appendChild(mkEl("p", "hw-note", "No lab publishes what it pays. Each absolute price is the reader's own claim and replaces the registered or custom-fleet rate for every leg of that donor."));
  return wrap;
}

/* ---------- PER-ACCELERATOR PROCUREMENT DISCOUNTS (row 499, completeness doctrine) ----------
   The ruling: anything an adjudicator assumes, this calculator must be able to compute — an
   assumption we can only carry internally is not acceptable. Both round-2 adjudicators priced
   procurement PER ACCELERATOR; one of them, having no such control to point at, wrote its
   procurement posture into the per-family EFFICIENCY keys instead. This panel is the missing
   control, in the shape the ruling asked for: every accelerator individually variable, plus a
   family-wide row "for the less sure".

   Values multiply the SAME registered rent rows the global multiplier scales, so 1.00x is the
   registered rate and nothing here invents a price. Rendered only under a rental basis (the owned-
   TCO path builds cost from capex/power/opex and has no rent row to discount) — and the panel says
   so rather than disappearing without explanation. */
function buildRentDiscounts(wrap, p) {
  /* Rows carry `disc-row`, NOT the `hw-row` class the composition sliders use. Found by the
     custom-fleet suite, which asserts that selecting a custom fleet removes every share slider —
     and would have read these as share sliders. The distinction is real and worth keeping visible:
     composition (how much traffic a leg carries) and procurement (what that leg costs) are separate
     questions, and a reader or a stylesheet should not be able to confuse them either. */
  const head = mkEl("div", "param-head");
  const name = mkEl("span", "param-name");
  name.append("Procurement discount by accelerator", infoBtn(p.tip));
  head.appendChild(name); wrap.appendChild(head);

  if (S.hwMode !== "rent") {
    wrap.appendChild(mkEl("p", "hw-note",
      "Inert under the owned-TCO basis: that path builds an hourly cost from capex, power, "
      + "datacenter and opex, so there is no rental rate to discount. Switch the cost basis to "
      + "rental to price a procurement posture."));
    return wrap;
  }

  const FAMS = [["nvidia", "NVIDIA"], ["tpu", "TPU"], ["trainium", "Trainium"], ["ascend", "Ascend"]];
  const fmt = v => (v == null ? "registered rate (1.00×)*" : v.toFixed(2) + "×");
  /* The asterisk is the row-499 NULL CONVENTION (owner ruling): a dial nobody declared still shows
     a value, and the value is marked as the page's default rather than presented as a choice. */

  const famBox = mkEl("div", "disc-fam");
  famBox.appendChild(mkEl("p", "hw-note",
    "Family-wide — moves every accelerator in the family that carries no value of its own:"));
  FAMS.forEach(([fam, label]) => {
    const row = mkEl("div", "disc-row");
    row.appendChild(mkEl("span", "hw-name", label));
    const input = document.createElement("input");
    input.type = "range"; input.min = 0.2; input.max = 1.5; input.step = 0.05;
    input.value = (S.rentMultFam && S.rentMultFam[fam] != null) ? S.rentMultFam[fam] : 1;
    input.setAttribute("aria-label", label + " family procurement multiplier");
    const val = mkEl("span", "hw-pct", fmt(S.rentMultFam ? S.rentMultFam[fam] : null));
    input.oninput = () => {
      S.rentMultFam = Object.assign({}, S.rentMultFam || {});
      S.rentMultFam[fam] = Number(input.value);
      val.textContent = fmt(S.rentMultFam[fam]);
      if (noteUserEdit()) return;
      onChange();
    };
    row.appendChild(input); row.appendChild(val); famBox.appendChild(row);
    /* A family-scoped range is the unit both round-2 reviews declared procurement in, so it is the
       unit the page lets a reader bound. What it MEANS when the legs carry their own values is the
       subtle part, and it is answered in the engine (`applyDial` group scope) rather than here: the
       range moves the family and its legs together, because a family range that a per-leg value
       silently swallowed would report zero uncertainty on the widest axis this page has. */
    const rh = rangeHandlesFor("rentMultFam." + fam, label + " family procurement", 0.2, 1.5, 0.05,
      (S.rentMultFam && S.rentMultFam[fam] != null) ? S.rentMultFam[fam] : 1);
    if (rh) famBox.appendChild(rh);
  });
  wrap.appendChild(famBox);

  /* Per-accelerator rows for the legs actually in the mix. A 0%-weight leg is not part of this
     reading and a discount on it would answer a question the reader did not ask — the same rule
     the spec-decode per-leg disclosure already follows. */
  const w = blendWeights(S);
  const legs = HW_ORDER.filter(k => w[k]);
  const legBox = mkEl("div", "disc-legs");
  legBox.appendChild(mkEl("p", "hw-note",
    "Per accelerator — a value here overrides its family for that leg alone:"));
  legs.forEach(k => {
    const hw = HW[k];
    const row = mkEl("div", "disc-row");
    /* Owner annotation n45cb3d — the chart-stack bar for this accelerator jumps HERE, so the row
       needs a stable identity. Typed by kind as well as key: "cost" is the procurement dial he
       named ("should be able to edit costs"), and the traffic-share row below is a different
       question about the same accelerator. */
    row.dataset.hwKey = k; row.dataset.hwKind = "cost";
    row.appendChild(mkEl("span", "hw-name", hw.name + registeredRentLabel(k)));
    const input = document.createElement("input");
    input.type = "range"; input.min = 0.2; input.max = 1.5; input.step = 0.05;
    const cur = (S.rentMultLeg && S.rentMultLeg[k] != null) ? S.rentMultLeg[k] : null;
    input.value = cur != null ? cur : 1;
    input.setAttribute("aria-label", hw.name + " procurement multiplier");
    const val = mkEl("span", "hw-pct", cur != null && typeof hw.rent === "number" ? cur.toFixed(2) + "× → $" + (hw.rent * cur).toFixed(3) + "/hr" : cur != null ? cur.toFixed(2) + "× → no registered rate to multiply" : fmt(null));
    input.oninput = () => {
      S.rentMultLeg = Object.assign({}, S.rentMultLeg || {});
      S.rentMultLeg[k] = Number(input.value);
      val.textContent = typeof hw.rent === "number" ? S.rentMultLeg[k].toFixed(2) + "× → $" + (hw.rent * S.rentMultLeg[k]).toFixed(3) + "/hr" : S.rentMultLeg[k].toFixed(2) + "× → no registered rate to multiply";
      if (noteUserEdit()) return;
      onChange();
    };
    row.appendChild(input); row.appendChild(val); legBox.appendChild(row);
    const rh = rangeHandlesFor("rentMultLeg." + k, hw.name + " procurement", 0.2, 1.5, 0.05, cur != null ? cur : 1);
    if (rh) legBox.appendChild(rh);
  });
  wrap.appendChild(legBox);
  wrap.appendChild(mkEl("p", "hw-note",
    "No lab publishes what it pays for compute. Every value here — including 1.00× — is a judgment, "
    + "and the two independent estimates this page carries disagree about it more than about "
    + "anything else."));
  return wrap;
}
function buildBlend(wrap, p) {
  const head = document.createElement("div"); head.className = "param-head";
  const name = document.createElement("span"); name.className = "param-name";
  name.append("Traffic share by accelerator", infoBtn(p.tip));
  head.appendChild(name); wrap.appendChild(head);
  { const sw = buildFleetSwitcher(); if (sw) wrap.appendChild(sw); }
  /* b9 M4 (memo §1.5/§5.4): while a custom fleet is selected the HW_ORDER share
     sliders are NOT rendered — composition changes happen ONLY in the builder (the
     owner's clear mental separation, D-4); in their place, the read-only per-leg panel.
     The slider-edit → "custom" fork is thereby unreachable from a cf: state. */
  if (isCustomFleetId(FLEET_ID)) { wrap.appendChild(cfPerLegPanel()); return wrap; }
  HW_ORDER.forEach(k => {
    const hw = HW[k];
    const row = document.createElement("div"); row.className = "hw-row";
    row.dataset.hwKey = k; row.dataset.hwKind = "share";   // owner annotation n12b450: chart-hw jump target
    const nm = document.createElement("span"); nm.className = "hw-name";
    nm.append(hw.name, infoBtn("hw-" + k));
    TIPS["hw-" + k] = { t: hw.name, b: hw.note, s: `FP8 dense ${hw.flopsFp8} PF · ${hw.hbm} GB HBM @ ${hw.bw} TB/s · ${Math.round(hw.tdp * 1000)} W · default ${fmt$(hw.rent)}/hr` };
    const input = document.createElement("input");
    input.type = "range"; input.min = 0; input.max = 100; input.step = 5;
    input.value = S.blend[k] || 0;
    input.setAttribute("aria-label", hw.name + " traffic share");
    const pct = document.createElement("span"); pct.className = "hw-pct";
    const w = blendWeights(S);
    pct.textContent = w[k] ? Math.round(w[k] * 100) + "%" : "—";
    input.setAttribute("aria-valuetext", input.value + " relative-weight units; "
      + (w[k] ? Math.round(w[k] * 100) + "% normalized share" : "excluded from the normalized blend"));
    /* b9 spec-decode LEVER (§9.5): the per-leg disclosure on DEFAULT and NAMED fleets. Before this,
       the only surface that said anything per leg was cfPerLegPanel, which renders for CUSTOM
       fleets only — so the promise that "every leg it does reach says so" had no surface on two of
       the three fleet kinds. Rendered only for legs that are actually in the mix: a 0%-weight leg
       is not part of this reading, and printing a credit disclosure on it would answer a question
       the reader did not ask. */
    const sdLeg = appFeasibility().legs.find(l => l.hwKey === k);
    const sdNote = (w[k] && sdLeg && sdLeg.specDec)
      ? mkEl("div", "hw-specdec", specDecReasonText(sdLeg.specDec.reasonCode, sdLeg.specDec.factorApplied))
      : null;
    /* d-im-h800 (owner note aca09d): the NVLink-cap disposition on the same per-leg surface. On the
       H800 leg it says the leg IS the measured, export-capped anchor; on H100/H200 it names the
       borrowed-efficiency assumption the page is making (and the factor when one is selected). */
    const nvNote = (w[k] && sdLeg && sdLeg.nvlinkCap)
      ? mkEl("div", "hw-nvlinkcap", nvlinkCapReasonText(sdLeg.nvlinkCap.reasonCode, sdLeg.nvlinkCap))
      : null;
    // R3 (memo D-3d): an excluded leg sits at 0 with the exclusion attached at the
    // slider row — the percentages stay first-class (the user may raise it; doing so
    // is a user-chosen blend and the welds/caps machinery applies).
    { const memb = appDefaultMembership();
      const ex = memb && memb.excluded.find(x => x.hwKey === k);
      if (ex && !(S.blend[k] > 0)) {
        pct.textContent = "0% — excluded from the default";
        pct.title = membershipExclusionClause(memb);
        row.classList.add("hw-excluded");
      } }
    input.oninput = () => {
      S.blend[k] = Number(input.value);
      if (FLEET_ID !== "custom") FLEET_ID = "custom"; // C-2/C-3: any blend edit forks (one gesture)
      const w2 = blendWeights(S);
      row.parentElement.querySelectorAll(".hw-row").forEach((r, i) => {
        const key = HW_ORDER[i];
        r.querySelector(".hw-pct").textContent = w2[key] ? Math.round(w2[key] * 100) + "%" : "—";
        const slider = r.querySelector('input[type="range"]');
        slider.setAttribute("aria-valuetext", slider.value + " relative-weight units; "
          + (w2[key] ? Math.round(w2[key] * 100) + "% normalized share" : "excluded from the normalized blend"));
      });
      if (noteUserEdit()) return;
      onChange();
    };
    row.append(nm, input, pct);
    if (sdNote) row.appendChild(sdNote);
    if (nvNote) row.appendChild(nvNote);
    wrap.appendChild(row);
    /* owner ruling q-sliders-fleet-util-point (2026-08-09): a traffic share carries a RANGE like any
       other assumption, and the combinations inside those ranges that sum to 100 % are what the mix
       band solves over. Same handles, same `dialRanges` map, same share links.

       A leg whose PROVIDER already carries a declared range gets a note instead of handles, and this
       is not tidiness: a provider range and a leg range inside it are one claim written twice, so
       the engine refuses the pair outright. Offering a control that silently kills the band the
       preset is already computing would be the worst kind of trap — the reader would see the readout
       vanish with no idea which gesture did it. */
    const famRangeId = "blend.fam." + familyOf(hw, undefined);
    if (S.dialRanges && S.dialRanges[famRangeId]) {
      if (POINT_MODE > 1) {
        const r = S.dialRanges[famRangeId];
        wrap.appendChild(mkEl("p", "hw-note", "Bounded with the rest of its provider: "
          + r.lo + "–" + r.hi + "% across " + familyOf(hw, undefined).toUpperCase()
          + ". A range on this leg alone would state the same claim twice, so it is not offered here."));
      }
    } else {
      const rh = rangeHandlesFor("blend." + k, hw.name + " traffic share", 0, 100, 5, S.blend[k] || 0);
      if (rh) wrap.appendChild(rh);
    }
  });
  const meta = document.createElement("div"); meta.className = "hw-meta";
  meta.textContent = "Shares are relative weights (normalized). Hover ⓘ for specs, anchors and default $/hr.";
  wrap.appendChild(meta);
  return wrap;
}

/* b9 M5 (fix-verify round): the LIVE central default — what the calculator below actually
   computes. The board's own anchor is reference-pinned (explorationFlagshipWorkload), which is
   right for judging a route's construction but is NOT the default state any more, so every
   surface that shows the pinned value now shows this one beside it. Derived, never pinned. */
function liveCentralDefaultPct() {
  const opus = MODELS.find(x => x.id === FLAGSHIP_SCOPE.modelId);
  const median = PERSPECTIVES.find(x => x.id === "median");
  const st = applyPresetSettings(opus, median, FLAGSHIP_SCOPE.traffic);
  return workload(st, undefined, makeScenarioContext(opus, resolveTraffic(opus, median, FLAGSHIP_SCOPE.traffic), st.customDonor, median.kind)).margin * 100;
}

/* ---------- presets UI ---------- */
function fillPresetSelects() {
  const ms = $("model-preset");
  ms.textContent = "";
  MODELS.forEach(m => { const o = document.createElement("option"); o.value = m.id; o.textContent = m.name + (m.spec ? " *" : ""); ms.appendChild(o); });
  const ps = $("persp-preset");
  ps.textContent = "";
  PERSPECTIVES.forEach(m => { const o = document.createElement("option"); o.value = m.id; o.textContent = m.name; ps.appendChild(o); });
  /* row 499 (owner ruling 0c8102): the page OPENS on the adjudicated estimate preset with no
     algorithmic lead — not on the central scenario. `DEFAULTS` is untouched by design, so no
     previously shared link changes what it renders (see LANDING_DEFAULT_PERSP_ID in engine.js).
     The central scenario keeps its own id and stays one click away in this same selector. */
  /* note-20260912T180812Z-c9eaac: a reader's own default in this browser, else the page's. A shared
     link applied after this still wins — loadScenarioFromURL runs later in init. */
  { const o = openingScenario(); ms.value = o.model; ps.value = o.persp; }
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
    /* Round 8 F6: a typed name is compared by the window's default decision, so the window re-renders when it changes. */
    if (inp) inp.oninput = () => { NAME_DIRTY = inp.value.trim() !== ""; renderScenarioWindow(); };
  }
  $("save-preset").onclick = () => {
    const inp = $("scenario-name");
    const name = ((inp && inp.value.trim()) || autoScenarioName()).slice(0, 80);
    // Presets carry a TYPED ORIGIN (__persp) alongside the numeric state (identity-integrity):
    // a modified-exploration state stores its origin ROUTE id so the breadcrumb + restore
    // survive the round-trip; otherwise the selector value (a real id, or "__modified").
    const store = loadStore(); store[name] = Object.assign(structuredClone(S), {
      __traffic: structuredClone(TRAFFIC),
      /* Astra rounds 8 F5 and 9 F4: an edited state whose base is a lens (loaded from a save, or arriving by a link) keeps that
         lens as its origin when it is saved. */
      __persp: EXPLORATION_ORIGIN ? EXPLORATION_ORIGIN.id : saveOriginId(),
      __interlock: INTERLOCK, // b9 M5 §10.6: the machine state rides saved scenarios alongside the identity
      __epoch: DEFAULTS_EPOCH, // IM1: stamp the defaults epoch so a later engine can deprecate stale presets non-destructively
      /* MODEL AND FLEET IDENTITY RIDE THE RECORD (Polaris ruling 2026-09-19 on Astra pack B
         P0-4). A saved scenario stored its numeric state and its origin LENS, and nothing else:
         restoring it used whatever model happened to be selected at load time and reset the
         fleet to the donor blend. Astra saved Kimi/median at 67.762158%, selected Opus, reloaded
         and got 61.417830%; and saved an Opus custom fleet with a flat $10/hour rent at
         8.460317%, reloaded immediately, and got 79.128952% because the section's rent had
         disappeared. Both said "Loaded saved scenario" and described the result as the saved
         numeric state. The record carries the model id and the fleet BY VALUE now. Records
         written before this — which is all of them — are not migrated and not re-interpreted:
         they load with a visible notice saying what was not recorded (see loadSavedPreset). */
      __model: (currentModel() || {}).id || null,
      __fleet: (() => {
        try {
          const custom = appActiveCustomFleet(S);
          return custom
            ? { id: FLEET_ID, custom: structuredClone(custom) }
            : { id: FLEET_ID };
        } catch { return { id: FLEET_ID }; }
      })(),
    });
    if (!persistStore(store, name)) {
      const failed = "Could not save “" + name + "” — this browser refused the write, or the stored "
        + "scenarios are in a shape this page cannot extend. Nothing was changed, and your current "
        + "scenario is still on screen; a shared link is the way to keep it.";
      $("preset-note").textContent = failed; setSaveNote(failed);
      return;
    }
    NAME_DIRTY = false; refreshScenarioName();
    renderScenarioWindow(); // Astra round 9 F3: the window's default decision reads NAME_DIRTY
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
  clearPendingDowngrade();  /* §18.13 C-1 */
  const store = loadStore();
  if (!store[name]) return;
  if (!presetEpochCurrent(store[name])) {
    // DEPRECATION (IM1 / v2.2): a preset saved before the v2.2 defaults epoch cannot be resolved
    // under the current engine (its numbers were built against retired tables). Non-destructive —
    // the record is KEPT, the central scenario is shown, and a loud notice explains. Never silently
    // apply stale numeric state under the new engine.
    applyPreset();
    showEpochDeprecationNotice(store[name].__epoch || "pre-v22", "preset");
    $("preset-note").textContent = "Saved scenario “" + name + "” predates the v2.2 engine (2026-08-06) and can no longer be resolved — showing the central scenario. The saved data is kept (inert) under “Saved scenarios”; re-save from the current state to refresh it.";
    return;
  }
  hideEpochDeprecationNotice();
  const saved = structuredClone(store[name]); delete saved.__traffic; delete saved.__epoch;
  const savedPersp = saved.__persp; delete saved.__persp;
  /* MODEL AND FLEET IDENTITY (Polaris ruling 2026-09-19 on Astra pack B P0-4). Records written
     before this round carry neither, and they are NOT migrated and NOT re-interpreted: a record
     with no `__model` restored under whatever model was selected at load time, which is how a
     saved Kimi scenario reloaded as Opus with a different number under the words "Loaded saved
     scenario". Where the record says nothing, the load says so; where it says something, it is
     honoured. */
  const savedModelId = typeof saved.__model === "string" ? saved.__model : null; delete saved.__model;
  const savedFleet = saved.__fleet && typeof saved.__fleet === "object" ? saved.__fleet : null; delete saved.__fleet;
  const identityGaps = [];
  if (!savedModelId) identityGaps.push("model");
  if (!savedFleet) identityGaps.push("fleet");
  const savedModel = savedModelId ? MODELS.find(x => x.id === savedModelId) : null;
  if (savedModelId && !savedModel) identityGaps.push("model (“" + savedModelId + "” is no longer in this page)");
  const savedInterlock = saved.__interlock; delete saved.__interlock; // b9 M5 §10.6 (never a state key — stripped before schema validation)
  // Slice-3 review R7b fix: delegates to engine.js's restoreSavedPresetState (the ACTUAL
  // production state-construction + context-registration site — the same function the regression
  // tests exercise, review R7's own tests having been found vacuous for calling
  // registerScenarioContext() themselves instead of driving this call site).
  /* A recorded model is SELECTED before the state is restored, so the numbers are rebuilt on the
     architecture they were saved against rather than on whatever is on screen. */
  if (savedModel && currentModel() && savedModel.id !== currentModel().id) {
    const sel = $("model-preset"); if (sel) { sel.value = savedModel.id; applyPreset(true); }
  }
  try {
    commitScenario(() => restoreSavedPresetState(saved, savedModel || currentModel(), resolvedTraffic()));
  } catch {
    // A matching epoch is necessary, not sufficient: localStorage is editable and an earlier
    // v22 UI could save combinations the current fail-closed engine rejects. Keep the record
    // non-destructively, keep the current rendered state, and make the failed load visible.
    $("preset-note").textContent = "Saved scenario “" + name + "” contains values the current engine rejects and was not loaded. The saved data is kept (inert); re-save a valid current scenario to replace it.";
    return;
  }
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
  FLEET_ID = "custom"; TOTAL_CASE_ID = "custom"; // C-3/C-8 saved-preset rows: named identity is NOT preserved across save/load (no citation rides an unvalidated path)
  { const cm = currentModel(); if (cm) LAST_APPLIED_MODEL = cm.id; }
  const sp = pid ? PERSPECTIVES.find(x => x.id === pid) : null;
  if (sp && sp.kind === "exploration") downgradeExplorationToModified(sp);
  else if (sp && sp.kind === "replay") downgradeReplayToModified(sp.name);
  else downgradeReplayToModified("saved scenario “" + name + "”");
  /* Astra round 7 F7: a lens origin is a scenario of this page, so the window can still offer that scenario's own settings.
     Its id is kept beside the breadcrumb and holds only while MODIFIED_FROM reads that breadcrumb. */
  MODIFIED_BASE = (sp && sp.kind !== "exploration" && sp.kind !== "replay") ? { from: MODIFIED_FROM, id: sp.id } : null;
  /* b9 M5 (§10.6): the machine state rides the saved row. A row saved BEFORE M5 carries none, and
     an editable store can hold a state that no longer fits its values — both resolve through the
     same honest reconstruction a pre-machine link gets, never an assumed FREE. Every saved load
     lands a MODIFIED identity (above), so the baseline is the inherited months. */
  INTERLOCK = (INTERLOCK_STATES.includes(savedInterlock)
    && interlockTokenConsistent(savedInterlock, S, currentModel(), null, true))
    ? savedInterlock : deriveInterlockFor(S, Number(S.trendMonths));
  INTERLOCK_NOTE = ""; UNLOCK_ARMED = false;
  captureModifiedTrendBaseline(); // the restored months ARE this identity's baseline
  fullRefresh();
  /* The notice a pre-v3.x record earns: what was not recorded, named, so the reader is never
     told a number is theirs when part of the state it depends on was reconstructed from the
     page instead (Polaris ruling 2026-09-19). No migration: the record is left exactly as it
     was found. */
  const identityNote = identityGaps.length
    ? " ⚠ Saved before v3.x: " + identityGaps.join(" and ") + " not recorded, so the page's current "
      + (identityGaps.includes("fleet") ? "selection is shown for that part" : "selection is shown for it")
      + " — re-save from this state to record it."
    : "";
  if (identityGaps.length) {
    const el = $("epoch-deprecation-notice");
    if (el) {
      el.textContent = "The saved scenario “" + name + "” was stored before this page recorded "
        + identityGaps.join(" and ") + " with a scenario. Its numbers were restored, but "
        + (identityGaps.length > 1 ? "those parts" : "that part")
        + " comes from what is selected now, not from the save. Re-save from this state to record it.";
      el.hidden = false;
    }
  }
  $("preset-note").textContent = identityNote + "Loaded saved scenario “" + name + "” as a MODIFIED "
    + (sp && sp.kind === "exploration" ? "range exploration (derived from the “" + (sp.subtitle || sp.name) + "” route)" : "scenario")
    + " — saved numeric state at " + S.ioRatio + ":1 / " + S.cacheHit + "% traffic (Custom); it never inherits the currently-selected lens." + presetMigrNote;
}
function deleteSavedPreset(name) {
  const store = loadStore(); delete store[name];
  persistStore(store);
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
  if (!persistStore(store, newName)) {
    $("preset-note").textContent = "Rename failed: this browser refused the write. Nothing was changed.";
    return false;
  }
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
  const store = loadStore();
  names.forEach(n => {
    const stale = !presetEpochCurrent(store[n]); // IM1: pre-v2.2 presets are shown but marked inert
    const row = mkEl("div", "saved-row" + (stale ? " saved-deprecated" : ""));
    const load = mkEl("button", "saved-load", n + (stale ? " · predates v2.2" : ""));
    load.type = "button";
    load.title = stale
      ? "“" + n + "” was saved before the v2.2 engine — it no longer resolves; loading it shows the central scenario and an explanation (the saved data is kept)."
      : "Load “" + n + "” — as a modified state; it never inherits the currently-selected lens";
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
/* A NULL-PROTOTYPE RECORD, AND ONLY A RECORD (vetting round 2026-09-19, Astra pack B P0-5).
   This returned whatever JSON.parse produced. Three ways that went wrong, all reproduced:
   saving a scenario named `__proto__` reported success while the store stayed `{}` (ordinary
   assignment writes the prototype slot, not an own property); with the store holding `[]`,
   saving reported success and storage stayed `[]`; with the store holding `"hello"`, saving
   threw "Cannot create property 'Review' on string 'hello'". Every one of those told the
   reader their scenario was saved when nothing was. The store is now a null-prototype object
   — so a key named `__proto__` is an ordinary own property — and a parsed value that is not a
   plain record is treated as no store at all rather than written into. The malformed value is
   left in localStorage untouched: it is the reader's data and may be recoverable by hand. */
function loadStore() {
  let parsed;
  try { parsed = JSON.parse(localStorage.getItem("im_presets_v1")); } catch { return Object.create(null); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return Object.create(null);
  const store = Object.create(null);
  for (const key of Object.keys(parsed)) store[key] = parsed[key];
  return store;
}
/* Write, then READ BACK. localStorage can be full, disabled or private-mode-restricted, and a
   key can fail to land for reasons the caller cannot see. Announce success only after the
   intended record is verifiably there. Returns true when it is. */
function persistStore(store, expectName) {
  try {
    localStorage.setItem("im_presets_v1", JSON.stringify(store));
  } catch { return false; }
  if (expectName === undefined) return true;
  const back = loadStore();
  return Object.prototype.hasOwnProperty.call(back, expectName);
}
// IM1: a saved preset is resolvable only if it was stamped under the CURRENT defaults epoch. Records
// with a missing epoch (saved before v2.2) or a different epoch are deprecated — kept, but inert.
function presetEpochCurrent(rec) { return !!rec && rec.__epoch === DEFAULTS_EPOCH; }
function applyPreset(keepTraffic) {
  clearPendingDowngrade();  /* §18.13 C-1: an identity transaction invalidates any stored downgrade continuation — the clear IS the invalidation */
  if (NAV_INTENT && NAV_INTENT.kind === "load-scroll") NAV_INTENT = null; /* §18.13 C-2: a preset-only change cancels a stale load-scroll (load affordances enqueue AFTER this call) */
  /* [N-CORRECTION-LIFETIME] rule 5: the record is cleared at the START of the next preset
     application — a SUBSEQUENT action, never the one that produced it. */
  clearActiveCorrection();
  // Moving on from a deprecated-link/preset load (any model/persp/traffic change routes through here)
  // clears the epoch banner — it describes the link that was opened, not the scenario now selected.
  // The deprecation paths call applyPreset() and RAISE the notice immediately AFTER, so this hide
  // never suppresses an intended notice (ordering verified in loadScenarioFromURL/loadSavedPreset).
  hideEpochDeprecationNotice();
  /* row 499: the reader has chosen a scenario of their own, so the shared link no longer describes
     what is on screen. Cleared HERE, at the same chokepoint the epoch notice uses, so every path
     that changes the scenario clears it exactly once. */
  hideSharedLinkBanner();
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
  applyIdentitiesAfterPresetApplication(m, p); // slice C: C-3/C-8 machines (resetting vs non-resetting)
  FORCE_EXPLORATORY = false;
  MODIFIED_FROM = null;
  EXPLORATION_ORIGIN = null;
  resetInterlock(); // b9 M5 (§10.2 last row): any preset/model/perspective selection returns the machine to FREE
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
    /* bq-1141 M1 (2026-09-25; owner standing rule nd94bbc, GPT Pro 09-25 finding 6): the preset's
       ~300-word note stood always-open between the intro and the calculator. The visible line now
       names the scenario and its traffic; the note itself opens first inside the dossier below
       (renderDossier), unshortened. Boundary labels and pairing warnings stay on this line. */
    $("preset-note").textContent = boundary + (warn ? "⚠ pairing note: " + warn + " — " : "")
      + "Scenario: " + (p.name || p.id) + diveFallback   // the bracket tag IS identity ("archived", "valuation replay") — review r1 F2
      + " · Traffic mix: " + tr.label + ".";
  }
  renderDossier(m, p);
  fullRefresh();
}

/* ---------- permalinkable scenarios (codec lives in engine.js since v2.1.2) ---------- */
function copyScenarioLink() {
  // A synthetic "[modified …]" state serializes as a MODIFIED identity (engine encodeScenario):
  // the origin breadcrumb rides along so the reloaded link restores the same counterfactual
  // warning — copy-after-mutation must never mint a link that reloads under a clean identity.
  /* row 499 (titled share links, option B): the name the reader already typed for this scenario
     travels INSIDE the token. No new control and no second concept — the field that names a saved
     scenario names a shared one. Only a name the reader actually typed is sent: the auto-generated
     placeholder is not a title anyone chose, and shipping it would put words in their mouth. */
  const linkTitle = (() => { const i = $("scenario-name"); return NAME_DIRTY && i ? i.value.trim() : ""; })();
  /* council F4 (2026-08-13): the encoder throws BY DESIGN on self-decode/consistency failures
     (fail-loud is right for the engine), but three recently fixed Share paths proved that
     "unreachable" UI states occur. The UI boundary catches, shows a visible refusal, and keeps
     the diagnostic — an uncaught throw here was an unlabeled dead button. */
  let token;
  try {
    token = encodeScenario(S, $("model-preset").value, $("persp-preset").value, resolvedTraffic(),
      EXPLORATION_ORIGIN ? EXPLORATION_ORIGIN.id : shareModifiedOrigin(), // round 8 F5: a saved lens's base travels by its name
      { fleet: FLEET_ID, totalCase: TOTAL_CASE_ID, interlock: INTERLOCK }, // b9 M5 §6.2/§10.4: UNLOCKED is a user CHOICE, so the machine state travels explicitly
      linkTitle ? { title: linkTitle } : undefined);
  } catch (e) {
    const msg = "This exact state cannot be shared as a link — the encoder refused to mint a token its own decoder would reject. The state on screen is unaffected. (" + String(e && e.message).slice(0, 160) + ")";
    $("preset-note").textContent = msg; setSaveNote(msg);
    console.error("copyScenarioLink: encoder invariant failure", e);
    return;
  }
  /* b9 M4 (memo §6.4): the size guard — an oversize token mints NOTHING (no URL, no
     clipboard, no truncation). 4,000 chars leaves headroom under the ~8KB practical
     URL ceiling; only a large custom-fleet-by-value block can reach it. */
  if (token.length > 4000) {
    const msg = "This custom fleet is too large to share as a link — the encoded fleet exceeds the reliable URL budget. Remove legs or shorten names, or share the fleet another way.";
    $("preset-note").textContent = msg; setSaveNote(msg);
    return;
  }
  const url = location.origin + location.pathname + "?s=" + encodeURIComponent(token);
  history.replaceState(null, "", url);
  (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(
    () => { const msg = "Scenario link copied. It freezes the full numeric state plus schema, engine revision and data-as-of date - and it CONTAINS any private rates or discounts you typed in; review before sharing."; $("preset-note").textContent = msg; setSaveNote(msg); },
    () => { const msg = "Scenario URL set in the address bar (clipboard unavailable)."; $("preset-note").textContent = msg; setSaveNote(msg); }
  );
}
/* ---------- epoch deprecation notice (IM1 / v2.2) ---------- */
// A pre-v5 shared link (v2/v3/v4) or a pre-v22 saved preset cannot be resolved under the v2.2 engine.
// This is the LOUD, testable surface (stable #epoch-deprecation-notice). The default/central state is
// already rendered by the caller; this only raises the banner. Content set via textContent (no HTML).
function showEpochDeprecationNotice(schema, kind) {
  const el = $("epoch-deprecation-notice"); if (!el) return;
  const what = kind === "preset"
    ? "A saved scenario you tried to load was stored before the v2.2 engine (2026-08-06)"
    : "This shared link predates the v2.2 engine of 2026-08-06 (" + (schema || "pre-v5") + " format)";
  /* F7 (review): this promised "the current central scenario", which stopped being true the day the
     page began opening on a named estimate preset — a reader on a dead link was told they were
     looking at ~69% while the page rendered ~80%. It now names what the page actually opens on,
     resolved from the same constant the opening selection uses. */
  const openingName = (() => {
    const pp = PERSPECTIVES.find(x => x.id === openingScenario().persp);
    return pp ? (pp.name || pp.id).replace(/^\[[^\]]*\]\s*/, "") : "this page's default scenario";
  })();
  el.textContent = what + " and can no longer be resolved. Showing what this page opens on instead \u2014 "
    + openingName + ". "
    + "Your data was not changed" + (kind === "preset" ? " — the saved scenario is kept, just inert." : ".");
  el.hidden = false;
}
function hideEpochDeprecationNotice() {
  const el = $("epoch-deprecation-notice"); if (el) { el.hidden = true; el.textContent = ""; }
}
/* ---------- SHARED-LINK BANNER (row 499, owner ruling ccb4a1) ----------
   A reader who arrives on a ?s= link is looking at SOMEBODY ELSE'S saved parameters. Until now the
   page said so only inside the scenario note, below the hero — so the headline number could be read,
   screenshotted and quoted without the reader ever learning it was not this page's own answer. This
   banner is raised above everything on EVERY successful link load, whatever identity the link
   carries, and it is written to be legible to someone who has never seen the page before.

   It is deliberately NOT raised on the deprecated-link path: that path renders this page's own
   default and the epoch notice already explains why, so a "these are someone else's assumptions"
   banner would be false there.

   `detail` is the identity summary the scenario note already computes — kept as ONE composition
   rather than a second wording, so the two surfaces cannot drift apart. */
const SHARED_LINK_BANNER_LEAD =
  "You are looking at a SHARED LINK — someone else's saved parameters, not this page's own assumptions.";
/* THE BAND SURFACE. Deliberately absent when nothing is declared: a page that always shows a range
   teaches a reader to ignore the range, and this one is meant to be read.

   The presentation rule is the spike's finding, not a layout preference. Bounding all eight dials
   the two adjudicators declared gives a compounded range 43 points wide \u2014 every input defensible,
   the output useless as a headline, because it reads as "so the answer is anywhere from 52 to 95".
   What a reader actually learns by bounding an assumption is WHICH assumption moves the number. So
   per-dial bands are what renders, widest first; the whole-box band is a separate, opt-in, labelled
   act; and neither is ever the hero. */
/* THE COMPOUNDED VALUE IS BEHIND AN OPT-IN, restored 2026-08-08 on adjudication. I had moved it
   into the header on a relayed ruling; the acceptance it was resting on ("correct as built, leave
   it") was given against MY OWN card, and that card described the compounded range as sitting
   BEHIND AN OPT-IN CONTROL. So the acceptance covers the opt-in, not its removal, and a frozen
   presentation requirement does not get superseded by my reading of a later note.

   The rule it enforces is the spike's, and it has not stopped being true: bounding every dial the
   adjudicators declared gives a range 43 points wide, and a page that leads with that teaches its
   readers that the answer is anywhere from 52 to 95. Per-dial ranges render at open; the whole-box
   number is a deliberate second act. */
let COMPOUNDED_BAND_OPT_IN = false;
const COMPOUNDED_BAND_LABEL = "Show the compounded range";
const COMPOUNDED_BAND_COPY = "COMPOUNDED \u2014 every dial you bounded at its worst and best at once. "
  + "Each edge is one specific setting of all of them together, and it is far wider than any single "
  + "assumption on its own: read the per-assumption ranges above to see which one is doing the work.";

/* A dial's name in the reader's words. `BOARD_FIELD_LABEL` covers the state keys but stops at the
   two procurement MAPS, whose members are the dials that matter most here — so the leg and family
   members resolve through the same registry the controls use, and a bare `rentMultFam.tpu` never
   reaches a reader. Falls back to the slider's own label, then to the id, so an unlabelled dial is
   ugly rather than invisible. */
function dialDisplayName(id) {
  if (id.startsWith("rentMultLeg.")) {
    const hw = HW[id.slice(12)];
    return (hw ? hw.name : id.slice(12)) + " procurement";
  }
  if (id.startsWith("rentMultFam.")) {
    const fam = id.slice(12);
    return ({ nvidia: "NVIDIA", tpu: "TPU", trainium: "Trainium", ascend: "Ascend" }[fam] || fam) + " family procurement";
  }
  if (BOARD_FIELD_LABEL[id]) return BOARD_FIELD_LABEL[id];
  for (const sec of SECTIONS) for (const prm of (sec.params || [])) if (prm.k === id && prm.label) return prm.label;
  return id;
}

/* A DECLARED RANGE ON A LOCKED DIAL IS NOT A BAND INPUT, and both ways of getting that wrong are
   live on the algorithmic-lead axis specifically — the one the owner singled out as the axis readers
   most want three points on (note 74103a).

   Two locks reach the lead dial, and they fail in OPPOSITE directions:

   * THE INTERLOCK. Editing a family multiplier replaces the lead prior — sets it to 0 and locks it,
     loudly — because the two are the same efficiency assumption and composing them double-counts.
     A lead range declared BEFORE that edit stays in state and keeps widening the band, through a
     lever the reader can no longer see or move, re-introducing the exact double-count the interlock
     exists to prevent.
   * A REPLAY PERSPECTIVE. `trendFactor` forces E = 1 there, so a lead range contributes NOTHING and
     the readout would say the lead "moves the margin by nothing at this operating point" — true of
     the arithmetic and false about the reason. That is the family-inertness failure again, wearing
     the other mask: an inert dial reported as an absence of uncertainty.

   So a locked dial is dropped from the band and NAMED, with the lock's own reason. Dropping it
   silently would narrow the band without saying so, which is the worse half of the same sin. */
function lockedBandDials(dials) {
  const out = [];
  for (const d of dials) {
    if (!d.key) continue;                       // leg/family procurement dials carry no lever lock
    const lock = leverLockState(interlockGroupOf(d.key));
    if (lock) out.push({ id: dialId(d), why: lock.why || INTERLOCK_WHY[interlockGroupOf(d.key)] || "locked" });
  }
  return out;
}

/* THE AUTHOR'S OWN STATED READING, directly beneath the headline number (owner ruling 19:02Z, as
   adjudicated 2026-08-08: the QUOTED-adjudicator reading, "displayable the same way they have been
   framing it").

   This is NOT the computed compounded range, and keeping the two apart is the entire point. The
   compounded range is something this page DERIVES from declared dials, and it stays behind its
   opt-in. This is a pair of numbers an adjudicator WROTE — their median over their own stated band,
   on their own basis — quoted the way a source is quoted. Different object, different provenance,
   different element, deliberately different name.

   The page computes a different number from the same author's vector, and the line says so in this
   page's own arithmetic. That gap is the finding rather than a defect: the review declined to
   collapse five dials to points and asked in writing that its vector not be tuned until it
   reproduced its figure. A reader who sees two percentages disagreeing is owed the reason. */
function renderStatedReading() {
  const el = $("out-stated-reading"); if (!el) return;
  const m = currentModel(), p = currentPersp();
  el.textContent = "";
  if (!m || !p || MODIFIED_FROM || EXPLORATION_ORIGIN) { el.hidden = true; return; }
  let computed = NaN;
  try {
    const s = applyPresetSettings(m, p, currentTrafficSel());
    computed = workload(s, undefined, scenarioContext(s)).margin * 100;
  } catch { computed = NaN; }
  /* Astra round 2 F2: `computed` is the preset's UNEDITED settings on the model and traffic mix selected now (not
     the edited result on screen, round 3 F2); the gap to the author's figure is stated at the estimate's own
     settings, and this reading is named as those unedited settings on the selected model and traffic. */
  const c = statedReadingClause(p, computed, { atScope: authoredScopeReading(p) });
  if (!c) { el.hidden = true; return; }        // a preset that states nothing displays nothing
  el.appendChild(mkEl("strong", "stated-headline", c.headline));
  el.appendChild(mkEl("span", "stated-basis", " " + c.basis));
  el.hidden = false;
}

/* THE FEASIBLE-MIX BAND (owner ruling q-sliders-fleet-util-point, 2026-08-09) — min, median and max
   over the provider distributions that sum to 100 %.

   Rendered in its own element rather than folded into the compounded band, and the separation is
   epistemic rather than cosmetic: #out-margin-band compounds INDEPENDENT dials by corner evaluation
   over a box, while this solves a COUPLED axis — the shares must sum to 100 — over a polytope.
   Putting them in one list would invite a reader to carry one method's claim onto the other's
   number. The engine already refuses to hand a blend id to `dialsFromRanges` for the same reason.

   The three-number readout is his: "max, min and medium values based on those ranges". The median
   is labelled by WHERE IT CAME FROM, because his ruling makes that the interesting fact — if the
   declared shares already sum to 100 the median IS the declared mix, and saying "computed" there
   would take credit for arithmetic that did nothing. */
function renderMixBand() {
  const el = $("out-mix-band"); if (!el) return;   /* id FROZEN by the gate check — never rename */
  el.textContent = "";
  const m = currentModel(), p = currentPersp();
  const ranges = mixRangesFromRanges(S.dialRanges);
  if (!m || !p || !ranges) { el.hidden = true; return; }
  /* THE BAND DESCRIBES WHAT IS ON SCREEN. `mixBand` otherwise rebuilds the scenario from
     applyPresetSettings and never reads S, so a reader who drags a share slider would get a readout
     for the PRESET's composition while looking at their own — the subject of this panel is the very
     thing the panel above it edits (review finding, 2026-08-09). Passing the live blend also makes
     the containment guard do useful work: edit outside the declared ranges and it refuses by name
     instead of quietly answering about a different fleet. */
  /* Same ruling: the mix band supplied only the blend, so every other edit the reader had made
     was swept against the preset's value instead of theirs. */
  const band = mixBand(m, p, currentTrafficSel(), ranges, { base: { ...S } });
  if (!band) { el.hidden = true; return; }
  const pct = v => "≈" + Math.round(v) + "%";
  /* centroid-gate R2 (P1 pre-existing, same class as the R1 mean-sentence fix): every sentence
     on this panel speaks in the band's OWN total — a reader whose shares sum to 120 is bounded
     to the 120 they carry, and "100 %" would be false in three places, not one. */
  /* centroid-gate R3 (P1 pre-existing): the sentences describe the BOUNDED blocks' total —
     band.T — not the whole-fleet declaredTotal; with a fixed remainder the two differ and the
     old trigger let "sum to 100 %" describe blocks summing to 90. */
  const sumsNon100 = Math.abs(band.T - 100) > 0.5;
  const sumsClause = sumsNon100   // plural: "…distributions that sum to…"
    ? "sum to the " + Math.round(band.T) + " the bounded providers carry between them"
    : "sum to 100 %";
  const sumsClauseSg = sumsNon100  // singular: "…every distribution that sums to…"
    ? "sums to the " + Math.round(band.T) + " the bounded providers carry between them"
    : "sums to 100 %";

  /* VOCABULARY (owner card q-im-median-vocabulary, default C; both consult arms). The UI says
     REFERENCE and ENVELOPE, never "median" — a median is a statistical term and these sets carry no
     probability. The owner's own phrase "the median system" survives in prose, defined there as an
     adjudicated central scenario, which the GPT Pro arm explicitly permits. */
  el.appendChild(mkEl("p", "band-head", "The declared mix envelope — what the FLEET COMPOSITION alone "
    + "reaches, across the provider distributions that " + sumsClause + " inside the shares you bounded."));

  if (band.refused) {
    el.appendChild(mkEl("p", "band-refused", "No mix envelope computed — " + band.refused + "."));
    el.hidden = false;
    return;
  }

  /* A pinned mix is not a range and must not be drawn as one: "≈80% – ≈80%" reads as a bug to the
     one reader who bounded exactly one provider, which is the likeliest first gesture. */
  if (band.singleBlockPinned || band.hi - band.lo < 0.005) {
    el.appendChild(mkEl("p", "band-flat", "The mix cannot move here — every legal distribution computes "
      + pct(band.point) + ". " + band.claimLabel + "."));
    el.hidden = false;
    return;
  }

  /* END LABELS THAT CANNOT FLIP (Fable arm). The owner describes the bounds as cost-driven fleet
     compositions; on the MARGIN axis the cheap fleet is the HIGH number, so "top of the range" is
     ambiguous and "cheapest declared fleet" is not, whichever axis the reader has in mind. Ordered
     ascending by margin so the line still reads left-to-right as a range. */
  const line = mkEl("p", "band-mix-value", null);
  line.appendChild(mkEl("strong", "band-range", pct(band.lo)));
  line.appendChild(mkEl("span", "band-mix-label", " most expensive declared fleet · "));
  line.appendChild(mkEl("strong", "band-range", pct(band.mid)));
  line.appendChild(mkEl("span", "band-mix-label", " reference · "));
  line.appendChild(mkEl("strong", "band-range", pct(band.hi)));
  line.appendChild(mkEl("span", "band-mix-label", " cheapest declared fleet"));
  line.appendChild(mkEl("span", "band-width", " (" + (band.hi - band.lo).toFixed(1) + " points wide)"));
  el.appendChild(line);

  el.appendChild(mkEl("p", "band-basis", band.medianIsDeclared
    ? "The reference is the declared mix itself — " + mixBlocksText(band)
      + " already " + sumsClause + ", so this is that author's own distribution rather than one this page chose."
    : "The declared shares do not " + sumsClause + ", so the reference is DERIVED — the nearest distribution "
      + "that does, which this page computed rather than any author declaring: "
      + mixBlocksText(band, band.medianBlocks) + "."));

  /* THE MEAN MIX (owner MEAN ruling 2026-08-11; M8 wiring of the 6b1c71c construction). The
     derived-fleets stat is the margin AT the exact mean mix — the centroid of every distribution
     summing to 100 % inside the declared ranges, the one construction that adds no claim beyond
     the bounds the author stated. Kept SEPARATE from the reference above: the reference is an
     author's declared (or transparently repaired) point; the mean is DERIVED by this page. The
     stronger "also the expected margin" sentence renders ONLY when the engine's regime signature
     licenses it (meanIsExpected) — at a varying regime the number is still exact as "margin at
     the mean mix" and claims nothing more (§2 amendment; the trap-guarded exact route, memo §3). */
  if (band.mean !== null && band.meanMix) {
    const mp = mkEl("p", "band-mean", null);
    mp.appendChild(mkEl("span", "band-mix-label", "Derived fleet allocation — the mean mix "));
    mp.appendChild(mkEl("strong", "band-mean-mix", mixFleetText(band.meanMix)));
    mp.appendChild(mkEl("span", "band-mix-label", " computes "));
    mp.appendChild(mkEl("strong", "band-mean-value", pct(band.mean)));
    mp.appendChild(mkEl("span", "band-mix-label", band.meanIsExpected
      ? " — the exact centre of mass of every distribution that " + sumsClauseSg + " inside the declared ranges; with the serving regime constant and every varying share renderable across this envelope it is also the expected margin under a uniform reading of those ranges."
      : " — the exact centre of mass of every distribution that " + sumsClauseSg + " inside the declared ranges. Part of the fleet renormalizes or changes regime across this envelope, so this is the margin AT the mean mix and is not claimed as the expected margin."));
    el.appendChild(mp);
  }

  /* THE DERIVED-POINTS OVERLAY (owner ruling 2026-08-09, note 52e1be). Off by default, which he
     allowed; the toggle is the requirement. It exists so the derivation is VISIBLE — each dot is a
     real fleet the reader can read off, positioned where its margin falls in the envelope, so the
     three numbers above stop being assertions and become three compositions. */
  const overlay = mkEl("div", "mix-overlay-wrap");
  const btn = mkEl("button", "band-toggle", (MIX_OVERLAY_OPT_IN ? "Hide" : "Show") + " the derived fleets");
  btn.type = "button";
  btn.setAttribute("aria-expanded", String(MIX_OVERLAY_OPT_IN));
  btn.onclick = () => { MIX_OVERLAY_OPT_IN = !MIX_OVERLAY_OPT_IN; renderMixBand(); };
  overlay.appendChild(btn);
  if (MIX_OVERLAY_OPT_IN) overlay.appendChild(mixOverlayTrack(band));
  el.appendChild(overlay);

  el.appendChild(mkEl("p", "band-note", band.claimLabel + "."));
  el.hidden = false;
}

/* The three derived fleets, drawn on the envelope they span. Colour follows the owner's own
   assignment — green high margin, yellow the reference, red low margin — and colour is never the
   only channel: each dot carries its percentage, its role in words, and the mix that produces it,
   so the row survives being read by someone who cannot separate the hues. */
function mixOverlayTrack(band) {
  const wrap = mkEl("div", "mix-overlay");
  const span = Math.max(1e-9, band.hi - band.lo);
  const at = v => ((v - band.lo) / span) * 100;
  const track = mkEl("div", "mix-track");
  track.setAttribute("role", "img");
  track.setAttribute("aria-label", "Derived fleets across the declared mix envelope: "
    + Math.round(band.lo) + " percent at the most expensive declared fleet, "
    + Math.round(band.mid) + " percent at the reference, "
    + Math.round(band.hi) + " percent at the cheapest declared fleet.");
  [["low", band.lo, band.loMix], ["mid", band.mid, band.midMix], ["high", band.hi, band.hiMix]]
    .forEach(([role, v, mix]) => {
      const dot = mkEl("span", "mix-dot mix-dot-" + role, null);
      dot.style.left = at(v).toFixed(2) + "%";
      dot.title = mixFleetText(mix) + " → " + v.toFixed(2) + "%";
      track.appendChild(dot);
    });
  wrap.appendChild(track);
  const list = mkEl("ul", "mix-overlay-list");
  [["high", "cheapest declared fleet", band.hi, band.hiMix],
   ["mid", "reference", band.mid, band.midMix],
   ["low", "most expensive declared fleet", band.lo, band.loMix]]
    .forEach(([role, what, v, mix]) => {
      const li = mkEl("li", "mix-overlay-row", null);
      li.appendChild(mkEl("span", "mix-dot mix-dot-" + role + " mix-dot-inline", null));
      li.appendChild(mkEl("strong", "band-range", "≈" + Math.round(v) + "%"));
      li.appendChild(mkEl("span", "band-mix-label", " " + what + " — " + mixFleetText(mix)));
      list.appendChild(li);
    });
  wrap.appendChild(list);
  return wrap;
}

/* A mix named by its providers, in the reader's own units. Families only: the point of the row is
   which fleet, not which chip generation. */
function mixFleetText(mix) {
  return Object.keys(FAMILY_STATE_KEY).map(fam => {
    const tot = legsInFamily(fam).reduce((a, k) => a + (mix[k] || 0), 0);
    return tot > 0.005 ? famDisplayName(fam) + " " + Math.round(tot * 10) / 10 + "%" : null;
  }).filter(Boolean).join(" / ");
}
function famDisplayName(fam) {
  return fam === "nvidia" ? "NVIDIA" : fam === "tpu" ? "TPU" : fam === "trainium" ? "Trainium"
    : fam === "ascend" ? "Ascend" : fam;
}

/* The declared providers named with their numbers, so a reader can check the mix against the sliders
   rather than trusting a percentage. Takes the median's own block values when they differ from the
   declared points. */
function mixBlocksText(band, vals) {
  return band.blocks.map((b, i) => b.name + " " + (vals ? Math.round(vals[i] * 10) / 10 : b.point) + "%").join(", ");
}

function renderMarginBand() {
  renderStatedReading();   // the QUOTED adjudicator pair — a different object from the derived band
  renderMixBand();         // the COUPLED axis — a polytope, not a box; see renderMixBand
  const el = $("out-margin-band"); if (!el) return;
  const declared = dialsFromRanges(S.dialRanges);
  const lockedOut = lockedBandDials(declared);
  const lockedIds = new Set(lockedOut.map(x => x.id));
  const dials = declared.filter(d => !lockedIds.has(dialId(d)));
  const m = currentModel(), p = currentPersp();
  if ((!dials.length && !lockedOut.length) || !m || !p) { el.hidden = true; el.textContent = ""; return; }
  const sel = currentTrafficSel();
  el.textContent = "";
  if (lockedOut.length) {
    el.appendChild(mkEl("p", "band-note band-lead-moved",
      "Not in this range: " + lockedOut.map(x => dialDisplayName(x.id)).join(", ")
      + " \u2014 you bounded it, but it is locked here, so a range on it would move the number through a "
      + "control you cannot see. " + lockedOut[0].why));
  }
  if (!dials.length) { el.hidden = false; return; }
  const pct = v => "\u2248" + Math.round(v) + "%";

  /* PER-DIAL, FIRST-CLASS, widest first \u2014 the ordering is itself the answer to the question a
     reader asked by bounding anything at all. */
  /* THE RANGES ARE COMPUTED ON WHAT IS ON SCREEN (Polaris ruling 2026-09-19 on Astra pack B
     P0-3). These two calls passed no base, so they swept the dials against the PRESET's values
     while the headline above them was computed on the reader's edited state — and the two then
     disagreed in a way that reads as a contradiction rather than an edit. Astra's case: on
     Opus / gptpro-r3, change the output price from $25 to $50 and the point moves to 87.62%
     while the utilization range stays at the preset's 77.15–85.72%, so the point sits ABOVE its
     own displayed range even though its 65% utilization is inside the bounds that range was
     drawn over. With the live base the same range reads 83.91–89.94% and contains it.
     `bandBase()` is one composition, used by both calls and by the compounded band below, so
     they cannot drift apart again. The counterpart tile at the bottom of this file already did
     this — `base: { ...S, hwMode: basis }` — which is where the shape comes from. */
  const bandBase = () => {
    const fleet = appActiveCustomFleet(S);
    return fleet
      ? { base: { ...S }, renderOpts: { customFleet: fleet } }
      : { base: { ...S } };
  };
  const per = marginBandsPerDial(m, p, sel, dials, bandBase()).slice().sort((a, b) => (b.hi - b.lo) - (a.hi - a.lo));
  el.appendChild(mkEl("p", "band-head",
    "What each bounded assumption moves the margin to ON ITS OWN, every other dial held at its stated point. "
    + POINT_MODE_COPY));
  const list = mkEl("ul", "band-per-dial");
  per.forEach(b => {
    const li = mkEl("li", null);
    li.appendChild(mkEl("span", "band-dial-name", dialDisplayName(b.id)));
    if (b.refused) li.appendChild(mkEl("span", "band-refused", " \u2014 no range computed: " + b.refused));
    else if (b.hi - b.lo < 0.005)
      li.appendChild(mkEl("span", "band-flat", " \u2014 moves the margin by nothing at this fleet blend and operating point: its whole declared range computes " + pct(b.point) + "."));
    else {
      li.appendChild(mkEl("strong", "band-range", " " + pct(b.lo) + " \u2013 " + pct(b.hi)));
      li.appendChild(mkEl("span", "band-width", " (" + (b.hi - b.lo).toFixed(1) + " points wide)"));
      /* The basis line renders on EVERY band, not only a non-exact one (Polaris ruling
         2026-09-19 on Astra pack A P0-2). It used to appear only when `exact` was false, which
         meant the one case that made the strongest claim — the retired exhaustiveness wording —
         was also the one case the reader never saw stated. Both labels now say the range was
         SEARCHED, and both are shown. */
      li.appendChild(mkEl("span", "band-basis", " \u2014 " + b.label));
    }
    list.appendChild(li);
  });
  el.appendChild(list);

  const whole = marginBand(m, p, sel, dials, bandBase());
  /* A family-scoped range on a scenario that prices PER LEG has to reach past those per-leg values,
     and the reader is told when it did. Silence here is the failure mode the spike named: the family
     control is inert on exactly the presets a reader is most likely to be looking at, so a band that
     said nothing would be reporting no procurement uncertainty on the widest axis this page has. */
  if (whole.familyGroups && whole.familyGroups.length)
    el.appendChild(mkEl("p", "band-note",
      "Procurement: " + whole.familyGroups.map(g => "the " + g.family.toUpperCase() + " range moves "
        + g.legs.map(k => HW[k] ? HW[k].name : k).join(", ")).join("; ") + " \u2014 legs that carry their own per-accelerator values here, "
      + "which normally override the family control. A declared family range is a claim about the "
      + "whole family, so it is applied to them rather than left inert."));

  /* BAND_LEAD_BASIS — the engine owns the bytes; this renders them. */
  /* THE LEAD DIAL IS DIFFERENT FROM THE OTHERS, and this renderer has to know it rather than only
     the engine that words it. A range that moves `trendMonths` is not a wider reading of one
     scenario \u2014 part of its width is the algorithmic-lead assumption itself changing, which is the
     axis this whole arc exists to keep separate from the cost axis. What it SAYS is the engine's
     (one set of bytes, emittable anywhere); how loudly it is shown is this surface's call, and a
     band carrying a moving prior earns the emphasis. */
  const leadIsBounded = dials.some(d => d.key === "trendMonths");
  el.appendChild(mkEl("p", leadIsBounded ? "band-note band-lead-moved" : "band-note",
    bandLeadBasisClause(S, dials)));

  /* THE COMPOUNDED WHOLE-BOX RANGE, behind its own control. Not a layout preference: bounding every
     dial the two adjudicators declared gives a range 43 points wide, and leading with that teaches a
     reader that the answer is anywhere from 52 to 95 \u2014 the opposite of what they learn by bounding
     an assumption. Per-dial ranges are the reading; this is a deliberate second act, and the label
     travels with the number so the widest figure on the page says what makes it wide. */
  const optIn = mkEl("div", "band-compounded");
  const btn = mkEl("button", "band-toggle", (COMPOUNDED_BAND_OPT_IN ? "Hide" : "Show")
    + " the compounded range across all " + dials.length + " bounded assumption" + (dials.length === 1 ? "" : "s"));
  btn.type = "button";
  btn.setAttribute("aria-expanded", String(COMPOUNDED_BAND_OPT_IN));
  btn.setAttribute("aria-label", COMPOUNDED_BAND_LABEL);
  btn.onclick = () => { COMPOUNDED_BAND_OPT_IN = !COMPOUNDED_BAND_OPT_IN; renderMarginBand(); };
  optIn.appendChild(btn);
  if (COMPOUNDED_BAND_OPT_IN)
    optIn.appendChild(whole.refused
      ? mkEl("p", "band-refused", "No compounded range computed — " + whole.refused)
      : mkEl("p", "band-compounded-value", pct(whole.lo) + " – " + pct(whole.hi) + " — "
          + COMPOUNDED_BAND_COPY + (whole.exact ? "" : " " + whole.label)
          /* BOTH CONSULT ARMS, INDEPENDENTLY (2026-08-10): the fleet mix is NOT folded in here, and
             silence about that would be the misleading part. Composition is cost-driven, so
             procurement and mix are economically coupled — compounding them as independent axes
             would count one uncertainty twice ("TPU is cheap" and "the fleet is TPU-heavy") and
             manufacture combinations that are legal arithmetic and incoherent economics. So the mix
             stays its own object until an author declares the coupling, and this says so. */
          + (mixRangesFromRanges(S.dialRanges) ? " The fleet mix is held at its declared point here:"
            + " composition is cost-driven, so compounding it with procurement as an independent axis"
            + " would count the same uncertainty twice. Its own envelope is shown separately." : "")));
  el.appendChild(optIn);
  el.hidden = false;
}

/* The header range built on 2026-08-07 (headline median over its full range) is REMOVED on the
   2026-08-08 adjudication: that line rendered the compounded whole-box value by default, which is
   the thing the frozen presentation requirement forbids, whatever element it was written into.
   Removed rather than hidden — a hidden renderer is a default-render one flag away, and #out-margin
   -range is now gone from the markup too. The owner's header-framing note is escalated as an
   unresolved conflict rather than half-built. */

function showSharedLinkBanner(detail, title) {
  const el = $("shared-link-banner"); if (!el) return;
  el.textContent = "";
  const lead = mkEl("strong", "slb-lead", SHARED_LINK_BANNER_LEAD);
  el.appendChild(lead);   // F3 (review): the WARNING first — see the note on the title below
  /* row 499: a titled link says what its sharer called it. mkEl sets textContent, so a title
     containing markup renders as the characters the sharer typed and nothing else — the title is
     attacker-controlled by construction (anyone can craft a link) and is never trusted as markup.
     It is rendered as a QUOTATION, attributed to the sharer, so a reader cannot mistake a chosen
     label for a claim this page is making. */
  /* The title is attacker-controlled and 80 characters is enough to write "Anthropic's official
     margin disclosure". Rendered AFTER the warning, never before it: a crafted label sitting above
     the sentence that frames it would let a link author borrow this page's authority inside the very
     banner built to deny them it. Found in review — the append order had put it first. */
  if (title) el.appendChild(mkEl("span", "slb-title", "Shared as: \u201c" + title + "\u201d"));
  const body = mkEl("span", "slb-detail",
    "Every number below was computed from the assumptions frozen into this link by whoever shared it"
    + (detail ? " — " + detail : "")
    + ". " + (readReaderDefault() ? "Your default scenario" : "The page's own default scenario") + " is one click away, and the sliders are yours to move: nothing "
    + "here is this page's published answer until you reset it.");
  el.appendChild(body);
  /* Astra round 2 F9: the reset opens the reader's saved default when there is one, so it says so. */
  const btn = mkEl("button", "ghost-btn slb-reset", readReaderDefault() ? "Show your default scenario instead" : "Show this page's own default instead");
  btn.type = "button";
  btn.onclick = () => {
    /* Same reset the scenario note offers, expressed as one gesture: clear the link from the URL so
       a refresh does not silently restore it, then re-apply the page's own opening state. */
    try { history.replaceState(null, "", location.origin + location.pathname); } catch {}
    MODIFIED_FROM = null; EXPLORATION_ORIGIN = null;
    /* F6 (review): the same nulling returnToCentral does deliberately — an explicit reset gesture is
       IDENTITY-resetting even at the same model. Without it the non-resetting branch runs and
       TOTAL_CASE_ID is never re-derived, so a link carrying a custom total case would reset the
       total while the identity chip went on reporting the custom case. */
    LAST_APPLIED_MODEL = null;
    { const o = openingScenario(); $("model-preset").value = o.model; $("persp-preset").value = o.persp; }
    TRAFFIC = { mode: "native", profileId: null };
    hideSharedLinkBanner();
    applyPreset();
  };
  el.appendChild(btn);
  el.hidden = false;
}
function hideSharedLinkBanner() {
  const el = $("shared-link-banner"); if (el) { el.hidden = true; el.textContent = ""; }
}
// v5 drift (IM1): a v5 token embeds the margin the sharer saw (_meta.displayedMargin). If the current
// engine recomputes a materially different value for the restored vector, surface BOTH rather than
// pretend continuity. Returns a note fragment (or "") for the loaded-scenario line.
function v5DriftNote(meta, state) {
  if (!meta || typeof meta.displayedMargin !== "number") return "";
  const wl = appWorkload(state);
  const dn = marginDriftNote(meta.displayedMargin, isFinite(wl.margin) ? wl.margin * 100 : NaN);
  // Slice C (memo C-7, pinned copy, ADDITIVE): a named-fleet token's drift note
  // additionally states that the selection re-derives — appended, never replacing,
  // so every existing drift fixture passes byte-unchanged.
  const fleetDrift = (meta.fleet && isNamedFleetId(meta.fleet.id))
    ? " The named fleet's membership and weights re-derive under the current engine — what this link selects, not what it froze."
    : "";
  /* J-9 size-move migration (FA memo v7): the decode-side epoch-transition rewrite
     marks the token; the note states the size move. ADDITIVE — appended after the
     existing drift text (which carries the link's own numeric movement dynamically),
     and emitted even when the numeric drift is inside tolerance, so the migration is
     never silent. */
  const sizeMove = meta.sizeMoveMigrated
    ? " ⚠ The page default flagship size moved from the 5 T community deduction to the adopted 2–3 T band central on 2026-07-24; this link followed the page default and now renders at the revised size. The former default is the labeled Legacy 5 T Musk-relative case (read as likely the prior flagship; referent unverified), selectable from the size bookmarks."
    : "";
  return (dn ? " ⚠ Engine drift — " + dn.text + " (minted under defaults epoch " + (meta.epoch || "pre-v22")
    + "; the shared inputs were recomputed under the current engine, not re-displayed as the old number)." + fleetDrift : "") + sizeMove;
}
/* A link that was PRESENT and REJECTED is not the same event as no link at all (vetting round
   2026-09-19, Astra pack B P0-1). This function returned false for both, and init() then
   rendered the page's opening scenario with no notice of any kind — so `?s=v6.bad`, or a
   well-formed token naming a model, perspective, fleet or total-case that does not exist, put
   the page's OWN default number on screen under normal shared-scenario styling. The reader
   believes they are looking at what the sharer sent. This file already states the doctrine one
   branch below, for the deprecated-link path: "NEVER a silent default (the old hard-null-to-
   default behaviour is the forbidden one)". It just was not applied here.
   A rejected link now raises the same visible notice, worded for its own cause, and returns
   true so init() does not re-apply the preset underneath it. */
function showRejectedLinkNotice(reason) {
  const el = $("epoch-deprecation-notice"); if (!el) return;
  const openingName = (() => {
    const pp = PERSPECTIVES.find(x => x.id === openingScenario().persp);
    return pp ? (pp.name || pp.id).replace(/^\[[^\]]*\]\s*/, "") : "this page's default scenario";
  })();
  el.textContent = "The shared link you followed could not be read" + (reason ? " (" + reason + ")" : "")
    + ", so none of the sharer's settings were applied. Showing what this page opens on instead \u2014 "
    + openingName + ". The number below is this page's own, not theirs.";
  el.hidden = false;
}
/* The maximum encoded state this page will even attempt to decode. The SHARING side already
   refuses to emit a link longer than 4,000 characters; the RECEIVING side had no bound at all,
   so a 1.3-million-character token was accepted, produced a million-character note and still
   rendered a margin (Astra pack B P1-1). Generous next to the sharer's own cap, and far below
   anything that makes the main thread work for an attacker-chosen time. */
const MAX_SHARED_TOKEN_CHARS = 16384;
function loadScenarioFromURL() {
  clearPendingDowngrade();  /* §18.13 C-1 */
  const raw = new URLSearchParams(location.search).get("s");
  if (typeof raw === "string" && raw.length > MAX_SHARED_TOKEN_CHARS) {
    applyPreset();
    showRejectedLinkNotice("it is " + raw.length.toLocaleString() + " characters long; the limit is "
      + MAX_SHARED_TOKEN_CHARS.toLocaleString());
    return true;
  }
  const diff = decodeScenario(raw);
  if (!diff) {
    // unknown/unversioned schema, or an internally-contradictory v5 identity, or an id that does
    // not resolve — the link is disregarded whole. Say so; never substitute silently.
    if (typeof raw === "string" && raw.length > 0) {
      applyPreset();
      showRejectedLinkNotice("it is damaged, or was made by a different version of this page");
      return true;
    }
    return false; // no link at all: the ordinary opening state, no notice
  }
  if (diff.__epochDeprecated) {
    // LOUD DEPRECATION (IM1 / v2.2): a pre-v5 link (v2/v3/v4) no longer resolves — the v2.2 engine
    // moved the numbers a relative codec would silently re-interpret. Render the central scenario
    // (exactly the no-link state) and raise an explicit, visible notice — NEVER a silent default
    // (the old hard-null-to-default behaviour is the forbidden one). No field of the old token was
    // read, so nothing leaks into the resolved state.
    applyPreset();
    showEpochDeprecationNotice(diff.schema);
    return true; // handled — init must not re-run applyPreset()
  }
  hideEpochDeprecationNotice(); // a live link supersedes any stale notice
  const meta = diff._meta || {}; delete diff._meta;
  /* THE LINK'S METADATA IS THE SHARER'S TEXT, NOT A TRUSTED VALUE (vetting round 2026-09-19,
     Astra pack B P0-2). `meta.dataAsOf` goes straight into a rendered sentence, and a decoded
     `{"toString": null}` made that concatenation throw "Cannot convert object to primitive
     value" — during initialisation, before the full refresh, so the interactive result never
     rendered at all. A string value was accepted verbatim too, so `"2099-01-01 — DISCLOSED"`
     appeared in the loaded-scenario note as if the page had dated and labelled it. Coerced to
     a bounded plain string here, once, so neither surface below can be surprised by it. */
  meta.dataAsOf = (typeof meta.dataAsOf === "string" && /^\d{4}-\d{2}-\d{2}$/.test(meta.dataAsOf))
    ? meta.dataAsOf
    : null;
  /* AND EVERY OTHER `_meta` FIELD THAT REACHES A SENTENCE, not just the date (completion-gate
     adjudication, 2026-09-19). The first cut of this fix coerced `dataAsOf` alone, and Astra
     had named `engine` in the same finding: `meta.engine` is interpolated into the engine-drift
     warning below, so `{toString: null}` threw there exactly as it had in the date. A field is
     either a bounded string this page will render, or it is dropped. The cap is generous
     against any legitimate value and small enough that no sentence can be flooded. */
  for (const key of ["engine", "epoch", "schema", "model", "persp", "totalCase", "interlock"]) {
    const v = meta[key];
    meta[key] = (typeof v === "string" && v.length > 0 && v.length <= 120) ? v : null;
  }
  if (meta.fleet && typeof meta.fleet === "object" && !Array.isArray(meta.fleet)) {
    const fid = meta.fleet.id;
    meta.fleet.id = (typeof fid === "string" && fid.length > 0 && fid.length <= 120) ? fid : null;
  } else if (meta.fleet !== undefined && typeof meta.fleet !== "object") {
    meta.fleet = null;
  }
  /* b9 M4 (memo §6.5): a cf: token restores its BY-VALUE fleet as an EPHEMERAL
     (unsaved) source entry — loading a link NEVER writes localStorage; "Save a copy"
     is the only write path. Same-id-different-content: the link's value WINS for
     rendering, labeled (numbers-identity — the link reproduces the sharer's numbers). */
  let cfLinkNote = "";
  if (meta.fleet && typeof meta.fleet.id === "string" && meta.fleet.custom) {
    const src = customFleetSource();
    const customShape = Array.isArray(meta.fleet.custom.sections)
      ? { sections: meta.fleet.custom.sections } : { legs: meta.fleet.custom.legs };
    const v = validateCustomFleet({ id: meta.fleet.id, name: meta.fleet.custom.name,
      epoch: meta.epoch, clonedFrom: meta.fleet.custom.clonedFrom, ...customShape },
      { requireId: true, wireVersion: meta.schema });
    if (!v.ok) return false; // decode already validated; belt-and-braces, fail-closed
    const saved = src.saved && Object.prototype.hasOwnProperty.call(src.saved, meta.fleet.id) ? src.saved[meta.fleet.id] : null;
    /* impl-gate P1-3: three collision cases, each labeled truthfully. IDENTICAL content →
       resolve through the SAVED fleet (no ephemeral, no false "unsaved" labeling).
       DIFFERENT content → the link's version wins for rendering (numbers-identity) and
       the management row offers a copy-under-a-NEW-id (the same-id save slot is taken).
       No saved fleet → plain ephemeral with "Save a copy". */
    if (saved && callerAuthoredFleetEqual(saved, v.fleet)) {
      cfLinkNote = " Custom fleet loaded from the link (identical to your saved fleet — using the saved copy).";
    } else {
      src.setEphemeral(v.fleet);
      cfLinkNote = saved
        ? " ⚠ This link carries a custom fleet that DIFFERS from your saved fleet of the same id — the link's version renders (numbers-identity); use “Save the link version as a copy” to keep both."
        : " Custom fleet loaded from the link (unsaved — use “Save a copy” to keep it).";
    }
  }
  /* MODIFIED-identity links (copy-after-mutation fix): a link minted from a synthetic
     "[modified …]" state carries persp:null plus a decode-validated _meta.modified block. It
     restores as the SAME modified counterfactual state — warning, breadcrumb and Custom traffic
     intact — never as a clean lens/replay/route identity. */
  if (meta.modified) {
    const mm0 = MODELS.find(x => x.id === meta.model);
    if (!mm0 || !meta.traffic) return false; // decode already guarantees both for v4; belt-and-braces
    $("model-preset").value = mm0.id;
    const sane = sanitizeScenarioDiff(diff, null); // a modified state carries no replay lock
    /* PRODUCER 2 of 3 ([N-CORRECTION-LIFETIME] rule 1): a shared permalink. The state is built by
       restoreModifiedLinkState below, so this path adapts its own shape to the transaction rather
       than pretending the two producers are alike — clear first, then record what was forced. */
    clearActiveCorrection();
    const saneCorrection = sane.corrections.length === 1 ? sane.corrections[0] : null;
    // Declared traffic identity IS the working values (state-consistency invariant): a modified
    // state's traffic is Custom, frozen at the encoded numbers — displayed == resolved == computed.
    TRAFFIC = { mode: "custom", profileId: null };
    // Slice-3 review R7b fix: delegates to engine.js's restoreModifiedLinkState — the ACTUAL
    // production call site (see the loadSavedPreset comment above for why this shape, not a
    // test-local registerScenarioContext() call, is what makes the regression tests non-vacuous).
    S = restoreModifiedLinkState(sane.diff, meta.traffic, mm0);
    activeCorrection = saneCorrection;
    if (meta.modified.kind === "exploration")
      downgradeExplorationToModified(PERSPECTIVES.find(x => x.id === normalizePerspId(meta.modified.from)));
    else
      downgradeReplayToModified(typeof meta.modified.from === "string" && meta.modified.from ? meta.modified.from : "a shared scenario");
    /* Slice C (memo C-7 normative order, modified branch): identities restore from
       the validated token; a named fleet seeds via fleetBaselineBlend on the
       POST-merge state (decode guarantees no blend rode the diff). */
    FLEET_ID = meta.fleet.id; TOTAL_CASE_ID = meta.totalCase;
    /* b9 M5 (§10.3/§10.4): a v6 link's machine state is the SHARER's choice and restores verbatim
       (decode has already proved it consistent with the restored levers). A v5 link predates the
       machine, so there is no choice to preserve — reconstruct the state its values represent
       rather than assuming FREE, which would render a stacked link with no banner. */
    INTERLOCK = INTERLOCK_STATES.includes(meta.interlock)
      ? meta.interlock : deriveInterlockFor(S, Number(S.trendMonths));
    INTERLOCK_NOTE = ""; UNLOCK_ARMED = false;
    captureModifiedTrendBaseline(); // the link's months ARE this modified identity's baseline
    LAST_APPLIED_MODEL = mm0.id;
    if (isNamedFleetId(FLEET_ID) || isCustomFleetId(FLEET_ID)) { // b9 M4: cf: seeds the same way (mirror invariant)
      const fb = fleetBaselineBlend(FLEET_ID, S, { modelId: mm0.id, customDonor: S.customDonor });
      if (fb) S.blend = fb;
    }
    const rej = sane.rejected.length ? " ⚠ " + sane.rejected.length + " link field(s) failed schema or replay-integrity validation and were ignored (" + sane.rejected.join("; ") + ")." : "";
    const drift = meta.engine && meta.engine !== ENGINE_REVISION ? " ⚠ Link was minted on engine " + meta.engine + "; this page runs " + ENGINE_REVISION + " — defaults may have shifted." : "";
    const epochDrift = v5DriftNote(meta, S);
    $("preset-note").textContent = "Loaded a shared scenario (" + (meta.dataAsOf || "undated") + ") — " + identitySummary() + " — in its saved MODIFIED state; "
      + (meta.modified.kind === "exploration"
        ? "a MODIFIED RANGE EXPLORATION derived from a page-authored route but since edited; the route identity and its ranking metadata do not apply to these numbers."
        : "a MODIFIED SCENARIO; no clean lens/replay identity applies to these numbers.")
      + rej + drift + epochDrift + cfLinkNote + " Use “Return to central scenario” to reset.";
    showSharedLinkBanner(identitySummary(), meta.title);   // row 499: modified-identity links get the banner too
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
  /* FAIL-CLOSED IDENTITY GATE: if the declared model OR perspective does not resolve to a real
     entry, the link is refused WHOLE before any state mutation — the default state renders with no
     "Loaded" note. The numeric diff is NEVER applied under a substituted default identity. (v5 tokens
     also fail-close inside decodeScenario; this is the belt-and-braces gate.) */
  if (!m || !p) return false;
  {
    // v5: the traffic identity travels in the link (exploration links additionally carry the
    // redundant explore block, already cross-checked by decodeScenario). Pre-v5 tokens never reach
    // here — they are deprecated at decode.
    $("model-preset").value = m.id; $("persp-preset").value = p.id;
    TRAFFIC = meta.traffic.mode === "explicit" ? { mode: "explicit", profileId: meta.traffic.profileId }
            : meta.traffic.mode === "native" ? { mode: "native", profileId: null }
            : { mode: meta.traffic.mode === "replay-locked" ? "native" : "custom", profileId: null };
    S = applyPresetSettings(m, p, meta.traffic.mode === "custom" || meta.traffic.mode === "legacy-custom"
      ? { mode: "custom", ioRatio: meta.traffic.ioRatio, cacheHit: meta.traffic.cacheHit } : TRAFFIC);
    renderDossier(m, p);
  }
  const tr0 = resolvedTraffic();
  const sane = sanitizeScenarioDiff(diff, tr0, S);
  const mm = currentModel(), pp = currentPersp();
  const diverges = mm && pp && overlayDivergesFromReplay(mm, pp, sane.diff);
  // P0-5 (URL overlay path): an overlay that moves any non-traffic field off the named
  // exploration route is a divergent edit — exit config identity, keep breadcrumb + restore.
  // (Traffic keys are excluded: the traffic-mix axis travels as identity in _meta.traffic and
  // composes with the route like it does with a lens; drift is displayed, not disguised.)
  const expDiverges = mm && pp && pp.kind === "exploration" && Object.keys(sane.diff).some(k =>
    k !== "subPlan" && k !== "subUsage" && k !== "ioRatio" && k !== "cacheHit" &&
    JSON.stringify(sane.diff[k]) !== JSON.stringify(S[k]));
  /* PRODUCER 3 of 3 ([N-CORRECTION-LIFETIME] rule 1): an overlay on a named route. */
  clearActiveCorrection();
  Object.assign(S, structuredClone(sane.diff));
  activeCorrection = sane.corrections.length === 1 ? sane.corrections[0] : null;
  if (tr0 && tr0.locked && !diverges) { S.ioRatio = tr0.ioRatio; S.cacheHit = tr0.cacheHit; } // replay integrity: locked traffic always wins over link overlays
  /* Slice C (memo C-7 NORMATIVE restore order, clean branch): identity → base →
     NON-blend diff (just applied; decode guarantees no blend key under a named or
     preset identity) → blend = fleetBaselineBlend at the POST-diff state. The
     seed-then-diff order is the R3-round executed hazard (42.2272 vs 33.2652 at
     total:10000) and is structurally unreachable here. */
  FLEET_ID = meta.fleet.id; TOTAL_CASE_ID = meta.totalCase;
  LAST_APPLIED_MODEL = m.id;
  if (isNamedFleetId(FLEET_ID) || isCustomFleetId(FLEET_ID)) { // b9 M4: cf: seeds the same way (mirror invariant; the ephemeral was installed above)
    const fb = fleetBaselineBlend(FLEET_ID, S, { modelId: m.id, customDonor: S.customDonor });
    if (fb) S.blend = fb;
  }
  if (diverges) downgradeReplayToModified(pp.name); // a link that changes a replay's pinned fields is NOT that replay — attribution removed
  if (expDiverges) downgradeExplorationToModified(pp); // a link that changes a route's numbers is NOT that route — vN identity + ranking metadata removed
  /* b9 M5 (§10.3/§10.4): same rule as the modified branch — carry a v6 token's machine state
     verbatim (decode proved it consistent), reconstruct a v5 token's from its values. A divergence
     downgrade above only LOOSENS the FREE rule (a modified identity has no identity default), so a
     state consistent as a clean identity stays consistent after it. */
  INTERLOCK = INTERLOCK_STATES.includes(meta.interlock)
    ? meta.interlock : deriveInterlockFor(S, trendBaselineFor(m, (diverges || expDiverges) ? null : pp));
  INTERLOCK_NOTE = ""; UNLOCK_ARMED = false;
  if (diverges || expDiverges) captureModifiedTrendBaseline(); // a downgraded link's months are its baseline
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
  const epochDrift = v5DriftNote(meta, S);
  // Preserve lens/state identity in the summary (public-release P0: never collapse to a bare "Loaded a
  // shared scenario"). identitySummary() reads the just-restored state → model · traffic · lens · state.
  $("preset-note").textContent = "Loaded a shared scenario (" + (meta.dataAsOf || "undated") + ") — " + identitySummary() + "." + retiredNote + trafficNote + rej + drift + expNote + epochDrift + cfLinkNote + " Use “Return to central scenario” to reset.";
  showSharedLinkBanner(identitySummary(), meta.title);   // row 499: the ruling — above the fold, on every resolved link
  return true;
}

let FORCE_EXPLORATORY = false;
/* Real atomic-replay semantics (final-gate P0): the FIRST divergent edit — from sliders, ticks,
   radios, blend inputs OR permalink overlays — EXITS replay identity entirely. The perspective
   selector flips to a synthetic "[modified scenario]" entry, replay attribution is removed from
   the note/dossier, and traffic unlocks as Custom. A warning is not an exit; this is the exit. */
let MODIFIED_FROM = null;
let MODIFIED_BASE = null; // { from, id }: a saved scenario's page base, valid only while MODIFIED_FROM === from (Astra round 7 F7)
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
  clearPendingDowngrade();        /* §18.13 C-1: every identity-transaction head clears the slot */
  if (!explainGuardBeforeMutation()) {   /* §18.12 B-2: persist the continuation; the replay re-invokes it */
    PENDING_DOWNGRADE = { kind: "replay", name: pName }; escalatePending("full"); return;
  }
  MODIFIED_FROM = pName;
  captureModifiedTrendBaseline(); // b9 M5 gate P1: the inherited months become this identity's FREE baseline
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
  clearPendingDowngrade();        /* §18.13 C-1 */
  if (!explainGuardBeforeMutation()) {
    PENDING_DOWNGRADE = { kind: "exploration", id: p.id, persp: p }; escalatePending("full"); return;
  }
  EXPLORATION_ORIGIN = { id: p.id, subtitle: p.subtitle || p.name };
  captureModifiedTrendBaseline(); // b9 M5 gate P1: same capture on the route-exit path
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
/* ================= b9 M5: the broad-lever interlock (memo §10, D-5 + Amendment 2) =================
   The engine owns the MACHINE (pure, DOM-free: interlockAfterEdit / interlockInvariantHolds /
   interlockTokenConsistent). This layer owns the machine's STATE for the live page, the lock
   affordances, and the loud attribution line the zeroing rule requires. */
let INTERLOCK = "free";
let INTERLOCK_NOTE = ""; // the attributed one-liner for the last machine transition (cleared on reset)
let UNLOCK_ARMED = false; // two-step inline confirm — never a native confirm() (headless-suite safe)
/* The FREE baseline for the live identity. A clean identity DERIVES it (trendBaselineFor). A
   synthetic MODIFIED state has no identity default: the months it carries are INHERITED state
   (possibly from another model's saved scenario), which is exactly the case the engine's token
   rule documents — so the inherited value is CAPTURED when the state enters the modified identity
   and held here.

   Gate round 1, P1: reading S.trendMonths live was wrong. applyInterlockAfterEdit runs AFTER the
   slider has written the new value, so a trend edit inside a modified state compared the new value
   against itself, the FREE → LOCKED_FAMILY transition never fired, and the family group stayed
   enabled with no why-line. The captured baseline is the pre-edit value the transition needs. */
let MODIFIED_TREND_BASELINE = null;
function captureModifiedTrendBaseline() { MODIFIED_TREND_BASELINE = Number(S.trendMonths); }
function interlockBaselineMonths() {
  const m = currentModel();
  if (!m) return 0;
  const p = currentPersp();
  if (p) return trendBaselineFor(m, p);
  return MODIFIED_TREND_BASELINE != null ? MODIFIED_TREND_BASELINE : Number(S.trendMonths);
}
function resetInterlock() { INTERLOCK = "free"; INTERLOCK_NOTE = ""; UNLOCK_ARMED = false; MODIFIED_TREND_BASELINE = null; }
/* Called from afterScenarioAxisEdit — i.e. ONLY from slider-machinery writes. Preset/model/
   perspective application never routes here, which is what makes "defaults are not edits"
   (§10.3) structural rather than a convention. */
function applyInterlockAfterEdit(key) {
  const group = interlockGroupOf(key);
  if (!group) return;
  const r = interlockAfterEditChecked(INTERLOCK, group, S, interlockBaselineMonths());
  if (r.next === INTERLOCK && !r.zeroTrend) return;
  if (r.zeroTrend) S.trendMonths = 0; // D-12: the prior is REPLACED, never ridden on top of
  INTERLOCK = r.next;
  INTERLOCK_NOTE = r.note || "";
  UNLOCK_ARMED = false;
}
/* Is this lever group disabled right now, and why? Two independent reasons, deliberately worded
   apart: the replay lock-at-0 (§9.4) and the interlock (§10). */
function leverLockState(group) {
  const p = currentPersp();
  if (group === "trend" && p && p.kind === "replay")
    return { kind: "replay", why: "🔒 locked at 0 — this is a published operating point; the lab's actual efficiency is already inside it, so applying months on top would double-count." };
  /* LIVE DEFECT, fixed 2026-08-02 (found by the spec-decode leg's T-14/T-16/T-19 CDP probes).
     `group` is null for every parameter that belongs to NO lever group — which is most of the page —
     and `interlockLockedGroup` returns null for the `free` and `unlocked` states. `null === null` is
     TRUE, so in the DEFAULT state (INTERLOCK is `free`) this returned a lock for every ordinary
     slider: EXECUTED at the shipped bytes, 19 of 28 controls rendered `disabled`, each carrying the
     why-line "🔒 undefined Use "Unlock both levers"…" because INTERLOCK_WHY[null] is undefined.
     The calculator's controls were unusable on load.

     A null group is not a lever group and can never BE the locked group; the identity comparison
     needed a guard that the two nulls do not mean the same thing. Pre-existing since the M5
     interlock landed — `leverLockState` is byte-identical at 7a68442, before this leg — and invisible
     to the suites because none of them asserted that a control is ENABLED. */
  if (group !== null && interlockLockedGroup(INTERLOCK) === group)
    return { kind: "interlock", why: "🔒 " + INTERLOCK_WHY[group] + " Use “Unlock both levers” in this section to stack them deliberately." };
  return null;
}
function leverBaseState() {
  const m = currentModel();
  if (!m) return null;
  /* A synthetic MODIFIED state has no perspective, so it has no identity default to compare a
     SPECIFIED lever against. Resolve through the same LENS CARRIER the traffic axis already uses
     for modified states (resolvedTraffic): the model at the central scenario. The comparison is
     then "off the model's central defaults", which is exactly what the warning claims. */
  const p = currentPersp() || PERSPECTIVES.find(x => x.id === "median");
  if (!p) return null;
  try { return applyPresetSettings(m, p, currentTrafficSel()); } catch { return null; }
}
/* The per-section panel: lock state, the loud transition line, the unlock affordance, the trend
   readout/citations/refusal note, and the non-blocking overlap warnings (§10.5). */
function interlockGroupPanel(group) {
  const box = document.createElement("div");
  box.className = "lever-panel"; box.dataset.leverGroup = group;
  const line = (cls, text) => { const el = document.createElement("div"); el.className = cls; el.textContent = text; box.appendChild(el); return el; };
  /* Both lock mechanisms are explained side by side here, deliberately: §12.4 requires the
     scroll-lock's iconography and why-line stay DISTINCT from the interlock's, and adjacency is
     what makes the distinction legible rather than merely asserted. */
  { const head = document.createElement("div"); head.className = "lever-head";
    head.append("Broad-lever interlock", infoBtn("interlock"), " · scroll-lock", infoBtn("sliderLock"));
    box.appendChild(head); }
  const lock = leverLockState(group);
  if (group === "trend") {
    const m = currentModel();
    const p = currentPersp();
    const inert = !!(p && p.kind === "replay");
    const E_ = inert ? 1 : Math.pow(S.trendRate, S.trendMonths / 12);
    const cut = (1 - 1 / E_) * 100;
    line("lever-readout", "E = ×" + E_.toFixed(2) + " → modeled cost-out ÷" + E_.toFixed(2)
      + " (" + (cut >= 0 ? "−" : "+") + Math.abs(cut).toFixed(0) + "%)"
      + (inert ? " — inert under this replay" : ""));
    const labNote = m ? trendLabNote(m) : null;
    line("lever-lab", "Lab: " + ((m && m.lab) || "none") + " — ratified prior "
      + (m ? trendBaselineFor(m, p || null) : 0) + " months"
      + (labNote ? " (" + labNote + ")" : "")
      + ". Owner-ratified SCENARIO PRIOR, not a measurement.");
    if (Math.abs(Number(S.trendMonths)) > TREND_SOFT_WARN_MONTHS)
      line("lever-warn", "⚠ beyond ±" + TREND_SOFT_WARN_MONTHS + " months this leaves the evidence band every algorithmic-lead voice kept the default inside — a stress setting, not a defensible default.");
    line("lever-cite", "Rate basis: Gundlach et al., arXiv:2511.23455 (MIT FutureTech) with Epoch AI data — ≈3×/yr algorithmic efficiency, halving ≈7.57 months.");
    line("lever-refusal", "Price series (9×–900×/yr — Epoch price index, a16z 10×, AI Index 280×) measure TARIFFS, not serving efficiency; this slider never uses them. Capability lag (~4 months, Epoch-measured) is a different axis and is never this slider — on the efficiency axis the open Chinese labs DEFINE the published-practice zero.");
    const base = leverBaseState();
    for (const w of leverOverlapWarnings(S, base, interlockBaselineMonths())) line("lever-overlap", "⚠ overlap: " + w.text + ".");
  }
  if (lock) line("lever-lock", lock.why);
  if (INTERLOCK_NOTE) line("lever-transition", INTERLOCK_NOTE);
  if (INTERLOCK === "unlocked") line("lever-banner", "⚠ STACKED: " + INTERLOCK_UNLOCK_WARNING + " — the family multipliers and the algorithmic-lead prior are both broad, unspecified efficiency assumptions, so part of the improvement may be counted twice. Pick any preset to reset.");
  if (lock && lock.kind === "interlock") {
    const b = document.createElement("button");
    b.type = "button"; b.className = "lever-unlock";
    b.textContent = UNLOCK_ARMED ? "Confirm — stack both broad levers" : "Unlock both levers…";
    b.onclick = () => {
      if (!UNLOCK_ARMED) { UNLOCK_ARMED = true; b.textContent = "Confirm — stack both broad levers"; return; }
      INTERLOCK = "unlocked"; INTERLOCK_NOTE = ""; UNLOCK_ARMED = false;
      fullRefresh();
    };
    box.appendChild(b);
    if (UNLOCK_ARMED) line("lever-warn", "Unlocking lets both broad multipliers apply at once. " + INTERLOCK_UNLOCK_WARNING + ".");
  }
  return box;
}

/* ================= b9 M5: the slider scroll-lock popup (memo §12, D-9.1) =================
   Touch scroll-safety only — a DIFFERENT mechanism from the interlock above, with its own icon
   and its own why-line. Coarse pointers only: a fine pointer or a keyboard/AT interaction cannot
   scroll-hijack, so they are never asked. */
const SLIDER_LOCK_KEY = "im_slider_lock_v1";
let SLIDER_LOCK = null;      // persisted { v:1, choice, ts } | null
let SLIDER_LOCK_VISIT = null; // "static" for this visit only (session-scoped, never persisted)
function loadSliderLock() { // fail-closed parse, non-destructive (the §7.2 store discipline)
  try {
    const raw = localStorage.getItem(SLIDER_LOCK_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object" || o.v !== 1 || !["edit", "static", "locked"].includes(o.choice)) return null;
    return o;
  } catch { return null; }
}
function saveSliderLock(choice) {
  SLIDER_LOCK = { v: 1, choice, ts: Date.now() };
  try { localStorage.setItem(SLIDER_LOCK_KEY, JSON.stringify(SLIDER_LOCK)); } catch { /* storage denied: the choice still holds for this visit */ }
}
const coarsePointer = () => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
function slidersLocked() { return SLIDER_LOCK_VISIT === "static" || !!(SLIDER_LOCK && SLIDER_LOCK.choice === "locked"); }
/* Returns true when the interaction must be SUPPRESSED (the popup just opened). */
function offerSliderLock() {
  if (!coarsePointer()) return false;
  if (SLIDER_LOCK || SLIDER_LOCK_VISIT) return false;
  openSliderLockPopup();
  return true;
}
function openSliderLockPopup() {
  let dlg = $("slider-lock-popup");
  if (!dlg) {
    dlg = document.createElement("dialog"); dlg.id = "slider-lock-popup"; dlg.className = "cf-dialog";
    document.body.appendChild(dlg);
  }
  dlg.textContent = "";
  const h = document.createElement("h3"); h.textContent = "Sliders on a touch screen";
  const p = document.createElement("p");
  p.textContent = "A scrolling gesture can land on a slider and change a number without you meaning to. How should the sliders behave?";
  dlg.append(h, p);
  const row = document.createElement("div"); row.className = "cf-actions";
  const mk = (label, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.onclick = () => { fn(); dlg.close(); buildControls(); }; row.appendChild(b); return b; };
  mk("Edit sliders", () => { SLIDER_LOCK_VISIT = "edit"; });
  mk("Keep static this visit", () => { SLIDER_LOCK_VISIT = "static"; });
  mk("Lock sliders + don’t ask again", () => { saveSliderLock("locked"); });
  dlg.appendChild(row);
  const why = document.createElement("p"); why.className = "cf-note";
  why.textContent = "Locked for scroll safety — a different lock from the broad-lever interlock, which prevents stacking two unspecified efficiency multipliers. Tap the 🔒 above the adjustments to change this.";
  dlg.appendChild(why);
  if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
}
function sliderLockChip() {
  const row = document.createElement("div"); row.className = "slider-lock-row";
  const b = document.createElement("button");
  b.type = "button"; b.className = "slider-lock-chip"; b.id = "slider-lock-chip";
  b.textContent = "🔒 Sliders locked for scroll safety — tap to change";
  b.onclick = () => { SLIDER_LOCK_VISIT = null; SLIDER_LOCK = null; try { localStorage.removeItem(SLIDER_LOCK_KEY); } catch { /* nothing to clear */ } openSliderLockPopup(); };
  row.appendChild(b);
  return row;
}

function noteUserEdit() {
  /* [N-CORRECTION-LIFETIME] rule 5: cleared at the START of the next user edit. This is the path a
     non-rebuilding slider edit takes, which is why clearActiveCorrection removes the DOM notice and
     not merely the variable. */
  clearActiveCorrection();
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
  LAST_APPLIED_MODEL = m.id; // keep the build-time model tracker current on the modified path too
  /* council F3: a scope-crossing model switch leaves stale identity LABELS (the values in S are
     coherent and frozen). Normalize them HERE, on the sender's page, through the same pure rule
     the encoder applies at mint — so the hero tail, the fleet disclosure, and the minted token
     tell one story. The encoder keeps its own normalization as defense-in-depth. */
  { const norm = normalizeModifiedIdentities(FLEET_ID, TOTAL_CASE_ID, m.id);
    if (norm.changed) {
      FLEET_ID = norm.fleet; TOTAL_CASE_ID = norm.totalCase;
      const fsel = document.querySelector(".fleet-select"); if (fsel) fsel.value = FLEET_ID;
    } }
  const tr = resolvedTraffic();
  // Slice-3 review R7b fix: delegates to engine.js's applyModelSwitchWhileModified — the ACTUAL
  // production call site (S keeps its identity here, but a model switch WHILE modified changes
  // what context is correct for it; see the loadSavedPreset comment above).
  applyModelSwitchWhileModified(S, m, tr);
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
  /* im-share-ready-0920 (2026-09-21, browser-QA finding 1): `blend` was the only object-valued key
     this formatter knew, so any other object reached the dossier table as a literal
     "[object Object]" in a <td> — two of them were live. Same defect class as the route-card
     summary above and fixed the same way: render the entries, never the default stringification. */
  if (v && typeof v === "object") {
    if (Array.isArray(v)) return v.length ? v.map(x => (x && typeof x === "object" ? "…" : String(x))).join(", ") : "none";
    const parts = Object.entries(v)
      .filter(([, vv]) => vv !== null && vv !== undefined)
      .map(([kk, vv]) => `${kk} ${vv && typeof vv === "object" ? "…" : String(vv)}`);
    return parts.length ? parts.join(", ") : "none";
  }
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
  if (!explainGuardBeforeMutation()) { escalatePending("full"); return; }   /* §18.11 P0-a: abort BEFORE any DOM write */
  const panel = $("model-context"); if (!panel) return;
  const body = $("model-context-body"), note = $("model-context-note");
  if (!m || !md) { panel.hidden = true; panel.open = false; if (body) body.textContent = ""; if (note) note.textContent = ""; wireExplainTriggers(); return; }
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
  if (!explainGuardBeforeMutation()) { escalatePending("full"); return; }   /* §18.11 P0-a: abort BEFORE any DOM write */
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
  wireExplainTriggers();   // b9 UX-B: re-assert the trigger and mirror the card's `hidden`
}
function renderDossier(m, p) {
  if (!explainGuardBeforeMutation()) { escalatePending("full"); return; }   /* §18.11 P0-a: abort BEFORE any DOM write */
  const body = $("dossier-body"); if (!body) return;
  body.textContent = "";
  const pd = DOSSIERS.perspectives[p.id];
  const tr = resolveTraffic(m, p, currentTrafficSel());
  const isExpl = p.kind === "exploration"; // D3: model provenance renders OUTSIDE the route dossier
  if (!isExpl && p.note) body.append(mkEl("p", "dossier-attr", "About this scenario's assumptions: " + p.note)); // bq-1141 M1
  /* row 499 null convention: the asterisk needs a legend or it is a mystery mark. Rendered FIRST in
     the dossier, listing the dials this preset did not author, so a reader can see the boundary of
     what the preset is actually claiming before reading a word of its position. */
  { /* F12 (review): only dials a reader can SEE carry the mark, so only those belong in the legend —
       naming an engine-only key like dialRanges tells a reader about a control that does not exist,
       in the first dossier they read. Labels, not identifiers, for the same reason. */
    const NO_CONTROL = ["dialRanges"];
    const unauthored = PERSPECTIVE_SPACE_KEYS
      .filter(k => !NO_CONTROL.includes(k))
      .filter(k => p.set && !Object.prototype.hasOwnProperty.call(
        (p.id === "dive" ? (m.dive || {}) : p.set), k))
      .map(k => BOARD_FIELD_LABEL[k] || k);
    if (unauthored.length) {
      const legend = mkEl("p", "dossier-attr",
        "A " + PRESET_DEFAULT_MARK + " beside a control's value means THIS PRESET DID NOT SET IT — "
        + "the value shown is this page's own default, inherited, not something this position claims. "
        + "Unset here: " + unauthored.join(", ") + ".");
      body.append(legend);
    } }
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
/* b9 UX-A (§20 R-1; memo §16.3): the clamp is TWO-SIDED ON BOTH AXES.
   The old form was `Math.min(innerHeight - r.height - 10, Math.max(8, y + 14))`: the outer
   `max(8, …)` guards the POINTER-DERIVED term, not the clamp, so a box taller than the viewport
   produced a NEGATIVE coordinate that nothing rescued. Measured at bedcc23: TIPS.specDec (3,352
   chars) rendered 1,328px tall at top:-494px in an 844px viewport — 494px off the TOP, i.e. the
   BEGINNING of the note, and `pointer-events: none` means it could never be scrolled to. The same
   error existed horizontally: at a 320px viewport `innerWidth - r.width - 10` = -10, and every
   probed tooltip rendered 10px off-screen.
   Written so it holds EVEN IF the CSS max-width/max-height fail: max* is floored at the gutter. */
const TIP_GUTTER = 8;
function showTip(html, x, y) {
  tipEl.textContent = ""; tipEl.append(html); tipEl.hidden = false;
  const r = tipEl.getBoundingClientRect();
  const maxLeft = Math.max(TIP_GUTTER, window.innerWidth - r.width - TIP_GUTTER);
  const maxTop = Math.max(TIP_GUTTER, window.innerHeight - r.height - TIP_GUTTER);
  tipEl.style.left = Math.max(TIP_GUTTER, Math.min(x + 12, maxLeft)) + "px";
  tipEl.style.top = Math.max(TIP_GUTTER, Math.min(y + 14, maxTop)) + "px";
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
/* b9 UX-A (§20 R-2/R-3; memo §16.3): hover PRESENTATION is gated on a hover-capable pointer.
   On coarse pointers there is no hover at all, so the tooltip channel used to depend entirely on a
   16x12 CSS-px tap producing a focus event. Keyboard focus presentation stays available on EVERY
   pointer class — gating it would remove the only non-pointer route. */
const tipHoverCapable = () => typeof window.matchMedia === "function" && window.matchMedia("(hover: hover)").matches;
document.addEventListener("pointerover", e => {
  if (!tipHoverCapable()) return;
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
/* R-2's "replace the inline expansion with a popup", for the tooltip channel. The quick hover
   preview stays a NON-INTERACTIVE preview (`pointer-events: none` is retained deliberately, so
   `overflow-y: auto` does NOT make it user-scrollable) — the dialog is the scrollable full read.
   hideTip() runs FIRST so tooltip and modal are never visible together; the focusout/pointerout
   that follows merely hides it again. */
document.addEventListener("click", e => {
  const b = e.target.closest(".info"); if (!b) return;
  const key = b.dataset.tip; if (!key || !TIPS[key]) return;
  e.preventDefault();
  hideTip();
  openExplain("tip:" + key, b);
});

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
function attachMarkTip(el, buildFrag, ariaLabel) {
  el.style.cursor = "default";
  el.setAttribute("tabindex", "0");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", ariaLabel);
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
function appendChartTable(el, headers, rows, summary = "Table view") {
  const det = document.createElement("details");
  const sum = document.createElement("summary");
  sum.textContent = "Table view";
  sum.style.cssText = "cursor:pointer;font-size:12px;color:var(--ink-3);padding:2px 4px 6px";
  det.appendChild(sum);
  const tbl = document.createElement("table");
  tbl.style.cssText = "border-collapse:collapse;font-size:12px;width:100%";
  const caption = document.createElement("caption");
  caption.textContent = summary;
  caption.style.cssText = "text-align:left;padding:3px 8px;color:var(--ink-3)";
  tbl.appendChild(caption);
  const addRow = (cells, head) => {
    const tr = document.createElement("tr");
    cells.forEach(value => {
      const cell = document.createElement(head ? "th" : "td");
      if (typeof Node !== "undefined" && value instanceof Node) cell.appendChild(value);
      else cell.textContent = value;
      if (head) cell.scope = "col";
      cell.style.cssText = "text-align:left;padding:3px 8px;border-bottom:1px solid var(--grid);color:var(--ink-2)";
      tr.appendChild(cell);
    });
    tbl.appendChild(tr);
  };
  addRow(headers, true);
  rows.forEach(row => addRow(row, false));
  det.appendChild(tbl);
  el.appendChild(det);
}

/* im-arc T3 (plan §1 T3 / §4, owner answer d-20260822-4c26 2026-08-22):
   point inputs stay one number. A section triple renders its middle as the
   primary value and its exact corner/share-polytope bottom–top beneath it. */
function sectionBandHasTriple(band) {
  return !!(band && ((band.dials && band.dials.length) || (band.compositionalRanges && band.compositionalRanges.length)));
}
function sectionBandCell(band, format) {
  if (!band || !band.exact || !sectionBandHasTriple(band)
      || !isFinite(band.mid) || !isFinite(band.lo) || !isFinite(band.hi)) return null;
  const wrap = mkEl("span", "section-band-cell");
  wrap.appendChild(mkEl("strong", "section-band-middle", format(band.mid)));
  wrap.appendChild(mkEl("small", "section-band-range", "middle assumption · bottom – top "
    + format(band.lo) + " – " + format(band.hi)));
  return wrap;
}
function appSectionBand(cornerEval) {
  const fleet = appActiveCustomFleet(S); if (!fleet) return null;
  try { return sectionBand(S, { customFleet: fleet }, cornerEval ? { cornerEval } : undefined); }
  catch { return null; }
}
function renderSectionBandFace() {
  const tile = document.querySelector(".tile-hero"); if (!tile) return;
  let line = document.getElementById("out-section-band");
  const value = document.getElementById("out-margin");
  /* A suppressed/infeasible hero may never leak its withheld number through a
     sibling band. The main value node is the already-adjudicated suppression gate. */
  if (!value || !/^\u2248/.test(value.textContent || "")) {
    if (line) { line.textContent = ""; line.hidden = true; }
    return;
  }
  if (!line) {
    line = mkEl("div", "tile-delta section-band", null); line.id = "out-section-band";
    (document.getElementById("out-margin-status") || value).insertAdjacentElement("afterend", line);
  }
  line.textContent = "";
  const cell = sectionBandCell(appSectionBand(), value => "≈" + Math.round(value * 100) + "%");
  if (!cell) { line.hidden = true; return; }
  line.appendChild(cell); line.hidden = false;
}

/* ---------- chart: margin per hardware (horizontal bars, emphasis) ---------- */
function renderHwChart() {
  const el = $("chart-hw"); el.textContent = "";
  const w = blendWeights(S);
  // b9 M3 (memo §3.4): per-leg physical energy intensity rides the same surface — the leg
  // "alone" framing appMarginOnHw uses (per-leg energy is blend-independent by construction).
  const legEnergy = k => {
    const ctx = appEngineContext();
    const eIn = energyPerMtok(HW[k], S, "in", undefined, ctx);
    const eOut = energyPerMtok(HW[k], S, "out", undefined, ctx);
    return energyMix(eIn, eOut, S).eMix;
  };
  const rows = HW_ORDER.map(k => {
    const r = appMarginOnHw(k, S);
    const reason = appNoNumberReason(r);
    return { k, name: HW[k].name, margin: r.margin, cost: r.costMix, eMix: legEnergy(k),
      renderable: isFinite(r.margin), inBlend: !!w[k], reason };
  });
  const blended = appWorkload(S);
  const W = 720, rowH = 34, padL = 150, padR = 90, padT = 8;
  const H = padT + rows.length * rowH + 26;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "group", "aria-label": "Margin by accelerator. Tab to inspect each renderable bar." });
  const x0 = padL, x1 = W - padR;
  const xmin = Math.min(0, ...rows.filter(r => r.renderable).map(r => r.margin)), xmax = 1;
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
    if (!r.renderable) {
      svg.append(chartText(x0 + 6, y + bh / 2 + 4, appNoNumberLabel(r.reason), { size: 10.5, fill: "var(--ink-3)" }));
      return;
    }
    const v = Math.max(xmin, Math.min(1, r.margin));
    const color = r.inBlend ? "var(--series-1)" : "var(--baseline)";
    const path = svgEl("path", { d: roundedBarPath(Math.min(xs(0), xs(v)), y, Math.abs(xs(v) - xs(0)), bh, 4, true), fill: color });
    svg.append(path);
    svg.append(chartText(xs(Math.max(0, v)) + 6, y + bh / 2 + 4, fmtPct(r.margin), { weight: 600, fill: "var(--ink-1)" }));
    attachMarkTip(path, () => {
      // R2 (§1.6): this hardware-lens surface's OWN three-point policy band (computed
      // lazily at hover — sampled, no continuity implied).
      const band = evaluateAtPolicyBand(p => appMarginOnHw(r.k, S, undefined, currentModel(), resolvedTraffic(), { loadedWeightBytesPerParam: p }).margin * 100);
      // R3 (D-11): published role widths as evidence annotations, from the leg's own
      // solver receipt through the ONE shared formatter (absent where unpublished).
      // Consumed via the REGISTERED render path (feasibility legs carry the receipt) —
      // app.js never opens the solver door directly (R2 positive-boundary contract).
      const feasLeg = appFeasibility(S).legs.find(l => l.hwKey === r.k);
      const roleWidths = feasLeg && feasLeg.capacityReceipt ? roleWidthEvidenceClause(feasLeg.capacityReceipt.roleWidthEvidence) : "";
      return ttRows(r.name, [
        ["Margin (alone)", fmtPct(r.margin)],
        ["Blended cost / Mtok", fmt$(r.cost)],
        ["Energy (Wh/Mtok, mix)", isFinite(r.eMix) ? Math.round(r.eMix) + " Wh" : "—"],
        ["In current blend", r.inBlend ? Math.round(w[r.k] * 100) + "%" : "no"],
        ["Policy band (sampled 3-pt, no continuity)", band.points.map(x => x.policyPoint + "→" + (isFinite(x.value) ? "≈" + Math.round(x.value) + "%" : "—")).join(" · ")],
        ...(roleWidths ? [["Role widths (published)", roleWidths]] : []),
      ]);
    }, `${r.name}: ${fmtPct(r.margin)} margin, ${fmt$(r.cost)} per million tokens${r.inBlend ? `, ${Math.round(w[r.k] * 100)}% of current blend` : ", not in current blend"}`);
    /* Owner annotation n12b450. AFTER attachMarkTip deliberately: that call sets role="img" for the
       tooltip, and the mark is a button now — it does something when you activate it. The tooltip's
       own focus/pointer listeners are untouched, so hovering and focusing still read the numbers;
       only the role, the cursor and the label change, and the label keeps the numbers and adds the
       action rather than replacing one with the other. */
    makeHwMarkNavigable(path, r.k, "share",
      `${r.name}: ${fmtPct(r.margin)} margin, ${fmt$(r.cost)} per million tokens${r.inBlend ? `, ${Math.round(w[r.k] * 100)}% of current blend` : ", not in current blend"} — activate to open this accelerator's controls`);
  });
  // blended reference line
  if (isFinite(blended.margin)) {
    const bx = xs(Math.max(xmin, Math.min(1, blended.margin)));
    svg.append(svgEl("line", { x1: bx, y1: padT - 2, x2: bx, y2: H - 22, stroke: "var(--ink-1)", "stroke-width": 1.5, "stroke-dasharray": "" }));
    svg.append(chartText(bx, padT + 2, "blend " + fmtPct(blended.margin), { anchor: bx > W - 170 ? "end" : "start", size: 10.5, fill: "var(--ink-1)", weight: 600 }));
  }
  /* Owner annotation n12b450: the affordance has to SAY it is there. The same complaint he made
     about the spec-decode slider ("I'd have no idea how to activate it") applies to a bar that is
     clickable and looks exactly like a bar that is not. */
  $("chart-hw-sub").textContent = "click any bar to open that accelerator's controls · at current settings; gray bars are accelerators with 0 traffic share; vertical line = your blend"
    + " · energy = physical Wh per M mixed tokens at the operating point (no idle allocation)"
    + (fleetRenderableText(blended) ? " · " + fleetRenderableText(blended) : "");
  $("chart-hw-sub").title = TIPS.energy.b; // b9 M3: the energy tip rides the subtitle
  el.appendChild(svg);
  renderHwChartNvlinkNote();
  appendChartTable(el, ["Accelerator", "Margin", "Cost / Mtok", "Energy (Wh/Mtok, mix)", "Current blend"],
    rows.map(r => r.renderable
      ? [r.name, fmtPct(r.margin), fmt$(r.cost), isFinite(r.eMix) ? Math.round(r.eMix) + " Wh" : "—", r.inBlend ? Math.round(w[r.k] * 100) + "%" : "0%"]
      : [r.name, "infeasible", "—", isFinite(r.eMix) ? Math.round(r.eMix) + " Wh" : "—", r.inBlend ? Math.round(w[r.k] * 100) + "%" : "0%"]),
    "Margin, cost and serving energy by accelerator");
  renderHwTwoTables();
}

/* BEGIN im-arc T1 pure presentation helpers */
/* im-arc T1 fix (Sol review 2026-08-22, findings P1-1/P1-2/P1-3): these builders
   are DOM-free so the Node T1 suite executes the exact branches the renderer consumes. */
function nonEmpty(value) {
  return !!value && typeof value === "object" && Object.keys(value).length > 0;
}
function readerRentActive(state) {
  return state.rentAbsAll != null || nonEmpty(state.rentAbsLeg) || state.rentMult !== 1
    || nonEmpty(state.rentMultLeg) || nonEmpty(state.rentMultFam);
}
/* im-arc T2 fix (Sol review 2026-08-23, finding P1-1): rent labels are
   receipts over the section composition. Flat/by-hardware section prices are
   reader-stated even when the old global rent controls are untouched. */
function rentSourceLabel(state, receipt) {
  if (!receipt) return readerRentActive(state) ? "Reader-stated rents" : "Inferred rents";
  const parts = [];
  if (receipt.hasSectionRates) parts.push("Section-stated rents");
  if (receipt.hasRegistered) parts.push("registered planning rents");
  return parts.length ? parts.join(" + ") : "Registered planning rents";
}
function rentTableTitle(state, receipt) {
  return rentSourceLabel(state, receipt) + " → margin per accelerator";
}
function rentCounterpartNote(state, ratio, receipt) {
  const rateSource = receipt ? rentSourceLabel(state, receipt).toLowerCase()
    : (readerRentActive(state) ? "reader-stated rates" : "registered planning rates");
  return "Same model, traffic and fleet, rental-inclusive at the " + rateSource
    + " instead of owned/TCO — the gap to the card above is the implied spread over modelled TCO, " + ratio + ".";
}
function rentSegmentText(spread, money) {
  const delta = spread.rentCostPerMtok - spread.tcoCostPerMtok;
  const ratio = isFinite(spread.ratio) ? spread.ratio.toFixed(1) : "—";
  if (delta < 0) {
    return "Rental-inclusive. The stated rent (≈" + money(spread.rentCostPerMtok)
      + "/Mtok) is BELOW this page's modelled TCO (≈" + money(spread.tcoCostPerMtok)
      + "/Mtok) — implied spread " + ratio
      + "×; no lessor's cut is implied above modelled TCO at these rates.";
  }
  const cut = Math.max(0, delta);
  const share = spread.rentCostPerMtok > 0 ? Math.max(0, Math.min(1, cut / spread.rentCostPerMtok)) : 0;
  return "Rental-inclusive. Of the ≈" + money(spread.rentCostPerMtok)
    + "/Mtok cost, ≈" + money(cut) + " is the lessor's cut above this page's modelled TCO "
    + "(implied spread " + ratio + "×, implied share " + Math.round(share * 100)
    + "% — implied over the modelled TCO, not an observed lessor margin).";
}
function counterpartBandText(band) {
  return "middle assumption · selected span (compounded over the declared ranges): ≈"
    + Math.round(band.lo) + "% – ≈" + Math.round(band.hi) + "%";
}
/* im-arc T1 director fix (fix-verify 2026-08-23, rounds 1–2, P1-1 residual): the accessible stack
   table's DISPLAYED cells must add up to the DISPLAYED total, in every locale. When rent is shown,
   every cell of the row is printed at a UNIFORM three decimals with toFixed (which never inserts a
   grouping separator, so "$1234.567" cannot be read as a grouped integer the way a de-DE "$1.234"
   can), and the signed "rent − modelled TCO" column is the residual that closes the printed row
   exactly: total − Σ(rounded components). The header discloses that. The toggle-off branch keeps the
   pre-T1 fmt$ cells byte-for-byte. Tooltips/ARIA keep the raw per-segment values. */
function stackTableCells(tcoValues, total) {
  const r3 = v => Math.round(v * 1000) / 1000;
  const comps = tcoValues.map(r3);
  const totalR = r3(total);
  const residual = r3(totalR - comps.reduce((a, v) => a + v, 0));
  const cell = v => "$" + v.toFixed(3);
  return [...comps.map(cell), cell(residual), cell(totalR)];
}
/* Round-3 fix-verify (2026-08-23): the header points at the bar tooltip for the raw per-row value, so
   every rent-on tooltip carries it — positive and negative rows alike. Pure; node-tested. */
function stackRawDeltaRow(row, money) {
  return ["rent − modelled TCO (raw, signed)", money(row.rentMinusTco)];
}
const STACK_SIGNED_HEADING = "rent − modelled TCO (signed; the residual that closes this row, all cells at 3 decimals — raw per-row value in the bar's tooltip)";
/* END im-arc T1 pure presentation helpers */

/* im-arc T2 fix (Sol review 2026-08-23, finding P1-1): keep the
   presentation helpers pure for Node execution; this app adapter derives the
   section receipt flags. Global rent controls never relabel a section-owned
   registered receipt because the engine gives that receipt precedence. */
function appRentReceipt(state) {
  const fleet = appActiveCustomFleet(state);
  if (!fleet) return null;
  const sections = cfSectionsOf(fleet);
  return {
    hasSectionRates: sections.some(section => section.rent
      && (section.rent.mode === "flat" || section.rent.mode === "byHw")),
    hasRegistered: sections.some(section => !section.rent || section.rent.mode === "registered"),
  };
}

/* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): the two
   procurement bases stay adjacent and use the same single-accelerator engine path. */
function renderHwTwoTables() {
  const host = $("hw-two-tables"); if (!host) return;
  host.textContent = "";
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-1): both adjacent
     tables consume the same all-section, per-accelerator composition as the
     stack toggle. A mixed custom fleet must never collapse to the global lens. */
  const tableFleet = appActiveCustomFleet(S);
  const tableRows = stackRowsFor(S, true, appEngineContext(),
    tableFleet ? { customFleet: tableFleet } : undefined);
  const renderBasis = (basis, heading, hourlyHeading) => {
    const box = mkEl("section", "hw-basis-table");
    box.appendChild(mkEl("h3", null, heading));
    const rows = tableRows.map(row => {
      const result = basis === "rent" ? row.rentResult : row.tcoResult;
      const hourly = basis === "rent" ? row.rentHr : row.tcoHr;
      const rentSource = basis === "rent" && row.rent && row.rent.source;
      const k = row.k;
      if (!result || !isFinite(result.margin)) return [HW[k].name, "—", "—",
        (row.reason || appNoNumberReason(result))
          + (rentSource ? " Rent source: " + rentSource + "." : "")];
      const atCorner = (field) => appSectionBand((state, opts) => {
        const cornerRow = stackRowsFor(state, true, appEngineContext(currentModel(), resolvedTraffic(), state), opts)
          .find(candidate => candidate.k === k);
        if (!cornerRow) return NaN;
        if (field === "hourly") return basis === "rent" ? cornerRow.rentHr : cornerRow.tcoHr;
        const cornerResult = basis === "rent" ? cornerRow.rentResult : cornerRow.tcoResult;
        return cornerResult ? cornerResult[field] : NaN;
      });
      const hourlyCell = sectionBandCell(atCorner("hourly"), value => fmt$(value) + "/hr");
      const costCell = sectionBandCell(atCorner("costMix"), fmt$);
      const marginCell = sectionBandCell(atCorner("margin"), fmtPct);
      return [HW[k].name,
        hourlyCell || (fmt$(hourly) + "/hr" + (rentSource ? " (" + rentSource + ")" : "")),
        costCell || fmt$(result.costMix), marginCell || fmtPct(result.margin)];
    });
    appendChartTable(box, ["Accelerator", hourlyHeading, "Cost $/Mtok", "Serving margin — not a company gross margin"], rows, heading);
    const details = box.querySelector("details"); if (details) details.open = true;
    host.appendChild(box);
  };
  renderBasis("rent", rentTableTitle(S, appRentReceipt(S)), "Rent $/hr");
  renderBasis("tco", "Owned TCO → margin per accelerator", "TCO $/hr");
  host.appendChild(mkEl("p", "hw-two-note",
    "Point assumptions render as one number. Section triples render the middle assumption with the exact bottom–top corner/share-polytope span beneath it."));
}

/* d-im-h800 (owner note aca09d, 2026-08-18): the disclosure under the hardware chart — the surface
   on which the owner saw the H800 bar above the H100 bar. It is COMPUTED, not written: the same
   nvlinkCapReadout feeds it and the control-side readout, so the two can never state different
   exposures. Not a tooltip — a disclosure you have to hover to find reproduces the defect (the
   08-16 GB300 note precedent). */
function renderHwChartNvlinkNote() {
  const note = $("chart-hw-nvlink-note"); if (!note) return;
  note.textContent = "";
  const rd = nvlinkCapReadoutSafe();
  refreshNvlinkCapSurfaces(rd);
  if (!rd) { note.hidden = true; return; }
  const lead = document.createElement("strong");
  lead.textContent = "H800 vs H100: ";
  note.append(lead, document.createTextNode(nvlinkCapReadoutText(rd, "chart")
    + " Move the lever \u201c" + NVLINKCAP_CONTROL_LABEL + "\u201d in the controls to see the consequence."));
  note.hidden = false;
}

/* d-im-h800: an ordinary slider edit calls onChange() WITHOUT rebuilding controls (the standing
   pattern), so the readout beside the control and the per-leg lines on the share rows — both built
   with the controls — would go stale the moment the lever moved. They re-render here on every
   renderAll, from the SAME readout and the SAME canonical legs, so a moved lever is disclosed where
   the reader moved it, not only in the chart. */
function refreshNvlinkCapSurfaces(rd) {
  const ro = $("nvlinkcap-readout");
  if (ro) ro.textContent = nvlinkCapReadoutText(rd, "control");
  let legs = null;
  try { legs = appFeasibility().legs; } catch (e) { legs = null; }
  if (!legs) return;
  document.querySelectorAll(".hw-row[data-hw-key]").forEach(row => {
    const line = row.querySelector(".hw-nvlinkcap"); if (!line) return;
    const leg = legs.find(l => l.hwKey === row.dataset.hwKey);
    if (leg && leg.nvlinkCap) line.textContent = nvlinkCapReasonText(leg.nvlinkCap.reasonCode, leg.nvlinkCap);
  });
}

/* ---------- chart: cost stack (TCO decomposition) ---------- */
const STACK_KEYS = [
  { k: "capex", name: "GPU capex (amortized)", color: "var(--series-1)" },
  { k: "power", name: "Electricity × PUE", color: "var(--series-2)" },
  { k: "dc", name: "Datacenter capex", color: "var(--series-3)" },
  { k: "opex", name: "Operations", color: "var(--series-4)" },
];
const STACK_RENT_KEY = { k: "rent", name: "rent — lessor's cut (implied over modelled TCO)", color: "var(--series-5)" };
const STACK_RENT_BELOW_KEY = { k: "rentBelow", name: "rent (reader-stated, below modelled TCO)", color: "var(--series-6)", className: "stack-rent-below" };
let STACK_RENT_TOUCHED = false, STACK_RENT_MODE = null;
function renderStackChart() {
  const el = $("chart-stack"); el.textContent = "";
  const toggle = $("stack-rent-toggle");
  /* im-arc T1: checkbox state is local presentation state — never scenario state, never encoded
     in a permalink. Before the reader touches it, a basis switch resets to that basis's default. */
  if (toggle) {
    if (STACK_RENT_MODE !== S.hwMode && !STACK_RENT_TOUCHED) toggle.checked = S.hwMode === "rent";
    STACK_RENT_MODE = S.hwMode;
    if (!toggle.dataset.wired) {
      toggle.dataset.wired = "true";
      toggle.addEventListener("change", () => { STACK_RENT_TOUCHED = true; renderStackChart(); });
    }
  }
  const showRent = !!(toggle && toggle.checked);
  /* im-arc T1 fix (Sol review 2026-08-22, finding P1-1): the renderer consumes the
     same signed row model the Node suite sums; negative rows get one rent-total bar. */
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-1): section receipts
     travel into the per-accelerator rows; the chart cannot fall back to the
     global lens when the active custom fleet is mixed. */
  const stackFleet = appActiveCustomFleet(S);
  const rows = stackRowsFor(S, showRent, appEngineContext(),
    stackFleet ? { customFleet: stackFleet } : undefined).map(row => {
    const tcoSegs = STACK_KEYS.map(key => ({ ...key, v: row.tcoComponents[key.k] }));
    const segs = !showRent ? tcoSegs
      : row.rentBelowTco ? [{ ...STACK_RENT_BELOW_KEY, v: row.total }]
        : [...tcoSegs, { ...STACK_RENT_KEY, v: row.rentMinusTco }];
    return {
      ...row, tcoSegs, segs,
      tableValues: showRent
        ? [...tcoSegs.map(seg => seg.v), row.rentMinusTco]
        : tcoSegs.map(seg => seg.v),
      reason: row.reason || appNoNumberReason(row.result),
    };
  });
  const hasRentBelow = rows.some(row => row.renderable && row.rentBelowTco);
  const hasRentAbove = rows.some(row => row.renderable && showRent && !row.rentBelowTco);
  const legendKeys = showRent
    ? [...STACK_KEYS, ...(hasRentAbove ? [STACK_RENT_KEY] : []), ...(hasRentBelow ? [STACK_RENT_BELOW_KEY] : [])]
    : STACK_KEYS;
  // b9 M3 (memo §3.4; plan D-2): under a rent-basis lens, electricity dollars are EMBEDDED in
  // the rent — decomposing rent without TCO assumptions would be fabrication. The chart below
  // is always the owned/strategic-TCO counterfactual build-up; under rent this chip says so
  // and carries the implied physical energy intensity (info-only, no dollars).
  const feForStack = appFleetEnergy(S);
  const rentedSectionShare = (feForStack.composition || [])
    .filter(row => row.basis !== "owned-strategic-tco").reduce((sum, row) => sum + row.share, 0);
  if (S.hwMode !== "tco" || rentedSectionShare > 0) {
    const fe = feForStack;
    // M3 gate P1 fix: the LABEL is the LENS basis (declared), never the mix's row basis —
    // chinacloud must read "public-capacity rent", and the owned-strategic replays expressed
    // as rent scalars (xaicash, gemini/grok dives) must say so rather than be mislabeled.
    const db = displayedProcurementBasis(currentPersp(), currentModel(), fe);
    const chip = document.createElement("p");
    chip.className = "energy-rent-chip"; chip.id = "energy-rent-chip";
    chip.title = TIPS.procBasis.b;
    chip.textContent = (db.basis === "mixed"
      ? "Current fleet mixes section bases (" + db.name + "). Electricity is explicit only on owned sections and embedded in rent on rented sections. "
      : db.basis === "owned-strategic-tco"
      ? "Current lens declares the owned/strategic TCO basis but expresses it as a rent-rate scalar (replay/valuation mechanism) — electricity is embedded in that rate, not separately decomposable. "
      : "Current lens is a rent basis (" + db.name + "): electricity is embedded in the rent, not separately decomposable. ")
      + "The chart below is the owned/strategic-TCO counterfactual build-up, not this lens's cost. Implied serving energy at the current mix: "
      + (isFinite(fe.blended.eMix) ? Math.round(fe.blended.eMix) + " Wh/Mtok (physical, info-only; no idle allocation)" : "no numeric result")
      + (showRent
        ? hasRentBelow
          ? ". A reader-stated rent below modelled TCO is shown as one rental-basis-total segment; the TCO components remain in the accessible table for reference."
          : ". Rent shown as its own segment above the TCO build-up."
        : "");
    el.appendChild(chip);
  } else if (showRent) {
    const chip = document.createElement("p"); chip.className = "energy-rent-chip"; chip.id = "energy-rent-chip";
    chip.textContent = hasRentBelow
      ? "Current lens is owned/TCO. A reader-stated rent below modelled TCO is shown as one rental-basis-total segment; the TCO components remain in the accessible table for reference."
      : "Current lens is owned/TCO. Rent shown as its own segment above the TCO build-up is the implied lessor's cut over modelled TCO; it is not part of the owned/TCO headline cost.";
    el.appendChild(chip);
  }
  { const band = appSectionBand((state, opts) => workload(state, undefined,
      appEngineContext(currentModel(), resolvedTraffic(), state), opts).costMix);
    const cell = sectionBandCell(band, fmt$);
    if (cell) { const line = mkEl("p", "chart-section-band"); line.appendChild(cell); el.appendChild(line); } }
  const W = 720, rowH = 34, padL = 150, padR = 70, padT = 26;
  const H = padT + rows.length * rowH + 26;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "group", "aria-label": "Cost decomposition per accelerator. Tab to inspect each cost segment." });
  /* im-arc T1: preserve the pre-toggle expression exactly when rent is hidden; even a
     floating-point-equivalent segment sum must not perturb today's unchecked SVG geometry. */
  const xmax = Math.max(...rows.filter(r => r.renderable).map(r => showRent
    ? Math.max(r.total, r.segs.reduce((a, g) => a + g.v, 0))
    : r.total)) * 1.08;
  const xs = v => padL + v / xmax * (W - padL - padR);
  // legend
  let lx = padL;
  legendKeys.forEach(sk => {
    svg.append(svgEl("rect", { x: lx, y: 4, width: 10, height: 10, rx: 2, fill: sk.color }));
    const t = chartText(lx + 14, 13, sk.name, { size: 10.5, fill: "var(--ink-2)" });
    svg.append(t); lx += 14 + sk.name.length * 5.4 + 16;
  });
  rows.forEach((r, i) => {
    const y = padT + i * rowH + 5, bh = 22;
    svg.append(chartText(padL - 8, y + bh / 2 + 4, r.name, { anchor: "end", size: 11.5 }));
    if (!r.renderable) {
      svg.append(chartText(padL + 6, y + bh / 2 + 4, appNoNumberLabel(r.reason), { size: 10.5, fill: "var(--ink-3)" }));
      return;
    }
    let x = padL;
    r.segs.forEach((seg, si) => {
      const wdt = Math.max(0, xs(seg.v) - padL - (si > 0 ? 2 : 0));
      const isLast = si === r.segs.length - 1;
      const attrs = { fill: seg.color, ...(seg.className ? { class: seg.className } : {}) };
      const rect = isLast
        ? svgEl("path", { d: roundedBarPath(x + (si > 0 ? 2 : 0), y, wdt, bh, 4, true), ...attrs })
        : svgEl("rect", { x: x + (si > 0 ? 2 : 0), y, width: wdt, height: bh, ...attrs });
      svg.append(rect);
      const tooltipRows = r.rentBelowTco
        ? [
            ...r.tcoSegs.map(g => [g.name, fmt$(g.v), getComputedStyle(document.documentElement).getPropertyValue(g.color.slice(4, -1))]),
            ["Modelled TCO total", fmt$(r.tcoSegs.reduce((a, g) => a + g.v, 0))],
            [STACK_RENT_BELOW_KEY.name, fmt$(r.total), getComputedStyle(document.documentElement).getPropertyValue("--series-6")],
            ["Comparison", "The four modelled TCO components exceed the reader-stated rent."],
            stackRawDeltaRow(r, fmt$),
          ]
        : [
            ...r.segs.map(g => [g.name, fmt$(g.v), g.color.startsWith("var") ? getComputedStyle(document.documentElement).getPropertyValue(g.color.slice(4, -1)) : g.color]),
            ...(showRent ? [stackRawDeltaRow(r, fmt$)] : []),
          ];
      if (showRent && r.rent && r.rent.source)
        tooltipRows.push(["Rent source", r.rent.source]);
      attachMarkTip(rect,
        () => ttRows(r.name + " — " + fmt$(r.total) + "/Mtok", tooltipRows),
        r.rentBelowTco
          ? `${r.name}, ${seg.name}: ${fmt$(seg.v)} per million tokens; the four modelled TCO components exceed this reader-stated rent`
          : `${r.name}, ${seg.name}: ${fmt$(seg.v)} per million tokens; total ${fmt$(r.total)}`);
      /* Owner annotation n45cb3d — "edit costs by clicking on accelerators". Every segment of the
         row jumps to the same place, because the reader clicks the bar, not the arithmetic: this
         chart decomposes ONE accelerator's cost, and the dial that moves that cost is its
         procurement multiplier whichever segment the pointer happened to land on. */
      makeHwMarkNavigable(rect, r.k, "cost",
        r.rentBelowTco
          ? `${r.name}, ${seg.name}: ${fmt$(seg.v)} per million tokens; below modelled TCO — activate to open this accelerator's cost control`
          : `${r.name}, ${seg.name}: ${fmt$(seg.v)} per million tokens; total ${fmt$(r.total)} — activate to open this accelerator's cost control`);
      x += wdt + (si > 0 ? 2 : 0) + 0;
      x = padL + (xs(r.segs.slice(0, si + 1).reduce((a, g) => a + g.v, 0)) - padL);
    });
    svg.append(chartText(x + 6, y + bh / 2 + 4, fmt$(r.total), { weight: 600, fill: "var(--ink-1)" }));
  });
  el.appendChild(svg);
  const tableHeadings = showRent
    ? ["Accelerator", ...STACK_KEYS.map(k => k.name), STACK_SIGNED_HEADING, "Total $/Mtok"]
    : ["Accelerator", ...STACK_KEYS.map(k => k.name), "Total $/Mtok"];
  appendChartTable(el, tableHeadings,
    rows.map(r => r.renderable
      ? [r.name, ...(showRent ? stackTableCells(r.tableValues.slice(0, STACK_KEYS.length), r.total) : [...r.tableValues.map(fmt$), fmt$(r.total)])]
      : [r.name, ...tableHeadings.slice(1, -1).map(() => "—"), r.reason]),
    "Cost decomposition by accelerator");
}

/* ---------- chart: sensitivity (margin vs active params) ---------- */
function renderSensChart() {
  const el = $("chart-sens"); el.textContent = "";
  const W = 720, H = 300, padL = 56, padR = 20, padT = 12, padB = 40;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "group", "aria-label": "Margin versus active parameters. Tab to inspect named model markers." });
  // Active parameters cannot exceed total parameters. Several shipped models
  // are smaller than the chart's historical 800B ceiling, so bound every
  // sweep/marker/table consumer to the current scenario before calling the
  // engine's fail-closed active<=total guard.
  const xmax = Math.min(800, S.total);
  const xmin = Math.min(10, Math.max(1, xmax / 10));
  const xs = v => padL + (Math.log(v) - Math.log(xmin)) / (Math.log(xmax) - Math.log(xmin)) * (W - padL - padR);
  // IM3 exit-gate fix 2 (verification round 2, P1) + B2/B4 correction (final re-verification,
  // 2026-07-20): the council's #11 membership-stability contract arriving early -- this sweep was
  // joining finite points into one continuous path across FLEET-MEMBERSHIP changes (crossing a
  // feasibility boundary deletes/adds legs and can move the margin discontinuously). CORRECTION:
  // this chart sweeps ACTIVE parameters at fixed total; feasibility is TOTAL-parameter-driven in
  // this engine (weight/KV footprint scales with total, not active), so this axis does not
  // reproduce the council's fixture (that was a TOTAL-parameter sweep, 2.0T->2.5T) -- the prior
  // comment's claim that it was "exactly this sweep's own pathology" was false, per the final
  // re-verification's own reproduction (all 121 points of the default sweep share one signature).
  // The segmentation below is therefore future-proofing for an axis this chart does not currently
  // exercise, kept because it is harmless and correct if the axis or defaults ever change to cross
  // a boundary. Signature caveat: `renderableLegs:renderableWeightShare` identifies membership by
  // COUNT+WEIGHT, not by actual hardware keys -- two different leg sets with equal count and equal
  // weight would collide (not reachable in the current registry, unverified in general). Deriving
  // the signature from actual hardware keys is carried to IM5 #11 (the membership-stability
  // contract), not fixed here.
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    // Pin the last sample exactly: exp(log(xmax)) can round above xmax (for example
    // 671.0000000000001), which violates the engine's deliberate active<=total guard.
    const a = i === 120 ? xmax
      : Math.min(xmax, Math.exp(Math.log(xmin) + i / 120 * (Math.log(xmax) - Math.log(xmin))));
    const wl = appWorkload(S, a);
    const f = wl.fleetRenderable;
    pts.push({ a, m: wl.margin, sig: f ? f.renderableLegs + ":" + f.renderableWeightShare.toFixed(6) : "none" });
  }
  const finitePts = pts.filter(p => isFinite(p.m));
  const currentWl = appWorkload(S);
  const sub = $("chart-sens-sub");
  // Count actual boundary CROSSINGS (adjacent-point signature changes), not the number of
  // distinct memberships visited -- N distinct memberships implies at most N-1 crossings on a
  // single sweep, not N (fix B2, final re-verification: "N memberships != N crossings").
  let nBoundaries = 0;
  for (let i = 1; i < finitePts.length; i++) if (finitePts[i].sig !== finitePts[i - 1].sig) nBoundaries++;
  if (sub) sub.textContent = "all settings fixed except active parameters"
    + (fleetRenderableText(currentWl) ? " · " + fleetRenderableText(currentWl) : "")
    + (nBoundaries > 0
      ? ` · this sweep crosses ${nBoundaries} feasibility ${nBoundaries === 1 ? "boundary" : "boundaries"} (fleet membership changes) — the line below is drawn in separate segments, never joined across a boundary: crossing one changes which hardware the number describes, so the margin can move discontinuously and is not monotonic under this perturbation.`
      : "");
  if (!finitePts.length) {
    svg.append(chartText(W / 2, H / 2, appNoNumberReason(currentWl), { anchor: "middle", fill: "var(--ink-2)", size: 12 }));
    el.appendChild(svg);
    return;
  }
  const ymin = Math.min(0, ...finitePts.map(p => p.m)), ymax = 1;
  const ys = v => padT + (ymax - v) / (ymax - ymin) * (H - padT - padB);
  [0, 0.25, 0.5, 0.75, 1].forEach(g => {
    if (g < ymin) return;
    svg.append(svgEl("line", { x1: padL, y1: ys(g), x2: W - padR, y2: ys(g), stroke: "var(--grid)", "stroke-width": 1 }));
    svg.append(chartText(padL - 8, ys(g) + 4, fmtPct(g), { anchor: "end", fill: "var(--ink-3)", size: 10.5 }));
  });
  [...new Set([xmin, 10, 30, 100, 300, 800])].filter(g => g >= xmin && g <= xmax).forEach(g => {
    svg.append(chartText(xs(g), H - padB + 16, g + "B", { anchor: "middle", fill: "var(--ink-3)", size: 10.5 }));
  });
  svg.append(chartText(W / 2, H - 6, "active parameters (log scale)", { anchor: "middle", fill: "var(--ink-3)", size: 10.5 }));
  // Segment the path at every membership (sig) change -- never draw a line SEGMENT connecting
  // two points with different renderable-fleet membership; a gap in the line is the honest
  // representation of a discontinuous estimand, not a rendering artifact.
  let segStart = 0;
  for (let i = 1; i <= finitePts.length; i++) {
    if (i === finitePts.length || finitePts[i].sig !== finitePts[segStart].sig) {
      const seg = finitePts.slice(segStart, i);
      if (seg.length) {
        const d = seg.map((p, j) => (j ? "L" : "M") + xs(p.a).toFixed(1) + "," + ys(Math.max(ymin, p.m)).toFixed(1)).join("");
        svg.append(svgEl("path", { d, fill: "none", stroke: "var(--series-1)", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));
      }
      segStart = i;
    }
  }
  // Mark each internal boundary explicitly (a membership change strictly inside the visible
  // sweep) with a small dashed vertical guide, distinct from the ordinary grid lines.
  for (let i = 1; i < finitePts.length; i++) {
    if (finitePts[i].sig !== finitePts[i - 1].sig) {
      const bx = (xs(finitePts[i - 1].a) + xs(finitePts[i].a)) / 2;
      svg.append(svgEl("line", { x1: bx, y1: padT, x2: bx, y2: H - padB, stroke: "var(--ink-3)", "stroke-width": 1, "stroke-dasharray": "3,3", opacity: 0.6 }));
    }
  }
  // model markers
  const markers = [
    { a: 37, l: "DeepSeek" }, { a: 100, l: "GPT est." }, { a: 120, l: "Sonnet est.", below: true }, { a: 300, l: "Opus est." },
  ];
  markers.filter(mk => mk.a <= xmax).forEach(mk => {
    const m = appWorkload(S, mk.a).margin;
    if (!isFinite(m)) return;
    const c = svgEl("circle", { cx: xs(mk.a), cy: ys(Math.max(ymin, m)), r: 4.5, fill: "var(--series-1)", stroke: "var(--surface-1)", "stroke-width": 2 });
    svg.append(c);
    svg.append(chartText(xs(mk.a), ys(Math.max(ymin, m)) + (mk.below ? 18 : -10), mk.l, { anchor: "middle", size: 10, fill: "var(--ink-2)" }));
    const markerCost = appWorkload(S, mk.a).costMix;
    attachMarkTip(c,
      () => ttRows(mk.l + " (" + mk.a + "B active)", [["margin", fmtPct(m)], ["cost / Mtok", fmt$(markerCost)]]),
      `${mk.l}, ${mk.a} billion active parameters: ${fmtPct(m)} margin, ${fmt$(markerCost)} per million tokens`);
  });
  // current position marker
  const cur = currentWl.margin;
  if (isFinite(cur)) {
    const currentMarker = svgEl("circle", { cx: xs(S.active), cy: ys(Math.max(ymin, cur)), r: 5.5, fill: "var(--ink-1)", stroke: "var(--surface-1)", "stroke-width": 2 });
    svg.append(currentMarker);
    attachMarkTip(currentMarker,
      () => ttRows("Current setting (" + fmtNum(S.active) + "B active)", [["margin", fmtPct(cur)], ["cost / Mtok", fmt$(currentWl.costMix)]]),
      `Current setting, ${fmtNum(S.active)} billion active parameters: ${fmtPct(cur)} margin, ${fmt$(currentWl.costMix)} per million tokens`);
  }
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
    const wl = appWorkload(S, a);
    showTip(ttRows(Math.round(a) + "B active", isFinite(wl.margin)
      ? [["margin", fmtPct(wl.margin)], ["cost / Mtok", fmt$(wl.costMix)], ["output cost / Mtok", fmt$(wl.cOut)]]
      : [["state", appNoNumberReason(wl)]]), e.clientX, e.clientY);
  });
  overlay.addEventListener("pointerleave", () => { cross.setAttribute("visibility", "hidden"); hideTip(); });
  svg.append(overlay);
  el.appendChild(svg);
  const tablePoints = [...new Set([xmin, 10, 30, 100, 300, 800, S.active])]
    .filter(a => a >= xmin && a <= xmax).sort((a, b) => a - b);
  appendChartTable(el, ["Active parameters", "Margin", "Cost / Mtok"],
    tablePoints.map(a => {
      const wl = appWorkload(S, a);
      return isFinite(wl.margin)
        ? [`${fmtNum(a)}B`, fmtPct(wl.margin), fmt$(wl.costMix)]
        : [`${fmtNum(a)}B`, "infeasible", "—"];
    }), "Named sensitivity points");
}

/* ---------- chart: cost per generation (columns, ordinal ramp) ---------- */
/* Ramp lives in the skin token layer (--ord-1..5) so it re-themes with data-skin/data-theme. */
const ORDINAL = ["var(--ord-1)", "var(--ord-2)", "var(--ord-3)", "var(--ord-4)", "var(--ord-5)"];
function renderGenChart() {
  const el = $("chart-gen"); el.textContent = "";
  const ramp = ORDINAL;
  const gens = [...GEN_TIMELINE.map(k => ({ key: k, hw: HW[k] })), { key: "rubin", hw: RUBIN }];
  const cols = gens.map((g, i) => {
    const wl = appWorkloadOnHw(g.hw, S); // single source of truth — same billing math as the hero
    /* q-im-fp4-gb300-batch-disclosure: the declared operating point travels WITH the bar. The
       audit's finding was not that the batch was undocumented — it is documented in the data
       file — but that the chart rendering its consequence said nothing about it. */
    const opCell = (OPERATING_POINTS[g.key] || {})[S.interact] || null;
    return { name: g.hw.name.replace(" NVL72", ""), cost: wl.cOut, margin: wl.margin,
      renderable: isFinite(wl.cOut), color: ramp[i], proj: g.key === "rubin",
      key: g.key, op: opCell,
      reason: appNoNumberReason(wl) };
  });
  const W = 720, H = 300, padL = 56, padR = 16, padT = 26, padB = 34;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "group", "aria-label": "Cost per generation. Tab to inspect each column." });
  const renderedCosts = cols.filter(c => !c.proj && c.renderable).map(c => c.cost);
  const ymax = (renderedCosts.length ? Math.max(...renderedCosts) : 1) * 1.15; // exclude the unpriced Rubin projection and infeasible rows from the $ scale
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
    if (c.proj) {
      // Rubin is unanchored — no public rack rate, serving benchmark or purchase price. Draw NO
      // cost-scaled bar: a $ figure must not be inferable from a bar height read against the $ axis
      // (Rubin is also excluded from ymax above). A faded full-height placeholder holds the
      // generation's slot in the timeline, marked "unpriced projection" (cold-review 2026-07-15 #17).
      const ph = svgEl("rect", { x, y: padT + 2, width: bw, height: (H - padB) - (padT + 2), fill: "var(--grid)", opacity: 0.2, rx: 4 });
      svg.append(ph);
      const midY = padT + (H - padT - padB) * 0.5;
      svg.append(chartText(x + bw / 2, midY - 4, "unpriced", { anchor: "middle", size: 10.5, weight: 600, fill: "var(--ink-3)" }));
      svg.append(chartText(x + bw / 2, midY + 9, "projection", { anchor: "middle", size: 9.5, fill: "var(--ink-3)" }));
      svg.append(chartText(x + bw / 2, H - padB + 15, c.name, { anchor: "middle", size: 10.5, fill: "var(--ink-2)" }));
      attachMarkTip(ph,
        () => ttRows(c.name, [["status", "unpriced projection"], ["basis", "no public rack rate, serving benchmark, or purchase price"]]),
        `${c.name}: unpriced projection; no public rack rate, serving benchmark, or purchase price`);
      return;
    }
    if (!c.renderable) {
      const ph = svgEl("rect", { x, y: padT + 2, width: bw, height: (H - padB) - (padT + 2), fill: "var(--grid)", opacity: 0.15, rx: 4 });
      svg.append(ph);
      svg.append(chartText(x + bw / 2, padT + (H - padT - padB) * 0.5, "infeasible", { anchor: "middle", size: 9.5, fill: "var(--ink-3)" }));
      svg.append(chartText(x + bw / 2, H - padB + 15, c.name, { anchor: "middle", size: 10.5, fill: "var(--ink-2)" }));
      attachMarkTip(ph, () => ttRows(c.name, [["state", c.reason]]),
        `${c.name}: ${c.reason}`);
      return;
    }
    const p = svgEl("path", { d: roundedBarPath(x, ys(c.cost), bw, (H - padB) - ys(c.cost), 4, false), fill: c.color, opacity: 1 });
    svg.append(p);
    svg.append(chartText(x + bw / 2, ys(c.cost) - 18, fmt$(c.cost), { anchor: "middle", weight: 600, fill: "var(--ink-1)" }));
    svg.append(chartText(x + bw / 2, ys(c.cost) - 6, fmtPct(c.margin) + " margin", { anchor: "middle", size: 10, fill: "var(--ink-3)" }));
    svg.append(chartText(x + bw / 2, H - padB + 15, c.name, { anchor: "middle", size: 10.5, fill: "var(--ink-2)" }));
    const tipRows = [["output cost / Mtok", fmt$(c.cost)], ["margin at current price", fmtPct(c.margin)]];
    if (c.op && c.op.b) {
      tipRows.push(["declared batch", c.op.b + " per chip"
        + (c.op.bSensitivity ? " — ASSUMED, one point in a " + c.op.bSensitivity.lo + "–"
          + c.op.bSensitivity.hi + " sensitivity" : "")]);
    }
    attachMarkTip(p, () => ttRows(c.name, tipRows),
      `${c.name}: ${fmt$(c.cost)} output cost per million tokens, ${fmtPct(c.margin)} margin at current price`
      + (c.op && c.op.b ? `, at a declared batch of ${c.op.b} per chip` : ""));
  });
  el.appendChild(svg);
  appendChartTable(el, ["Generation", "Output cost / Mtok", "Margin", "Declared batch"],
    cols.map(c => c.proj
      ? [c.name, "unpriced projection", "—", "—"]
      : [c.name, c.renderable ? fmt$(c.cost) : "infeasible", c.renderable ? fmtPct(c.margin) : "—",
         c.op && c.op.b ? c.op.b + (c.op.bSensitivity ? " (assumed)" : "") : "—"]),
    "Cost and margin by accelerator generation");
  renderGenChartOpNote(cols);
}
/* The disclosure the audit found missing (reports/im-fp4-precision-audit-2026-08-01 §4, owner
   ruling q-im-fp4-gb300-batch-disclosure). It is COMPUTED, not written: the counterfactual comes
   from the cell's own registered sensitivity band, run through the same billing math as the bars,
   so it cannot drift away from what the chart is showing. It prints only when a rendered
   generation actually declares an assumed operating point. */
function renderGenChartOpNote(cols) {
  const note = $("chart-gen-op-note"); if (!note) return;
  note.textContent = "";
  const assumed = cols.filter(c => !c.proj && c.renderable && c.op && c.op.bSensitivity && c.op.b);
  if (!assumed.length) { note.hidden = true; return; }
  /* The throughput span comes from the family-9 debt surface — ONE computation feeding both
     disclosures, so the leg and the chart can never state different exposures. A cost
     counterfactual is deliberately NOT computed here: there is no operating-point override
     channel through the billing math, and inventing one inside a chart renderer to produce a
     dollar figure would be authoring the counterfactual rather than disclosing the assumption.
     The measured cost consequence is recorded, dated and with its method, on the registry cell
     itself (OPERATING_POINTS.gb300.balanced.basis). */
  let exposure = {};
  try {
    for (const leg of formCorrectionDebt(S, appEngineContext()).legs)
      if (leg.declaredBatchExposure) exposure[leg.hwKey] = leg.declaredBatchExposure;
  } catch (e) { exposure = {}; }
  const parts = assumed.map(c => {
    const ex = exposure[c.key];
    return c.name + "'s bar is drawn at a DECLARED batch of " + c.op.b + " per chip — an assumption "
      + "carrying a measurement's weight, and one point inside a registered " + c.op.bSensitivity.lo
      + "–" + c.op.bSensitivity.hi + " sensitivity"
      + (ex && ex.spanRatio
          ? ", across which this leg's throughput — and therefore the height of this bar — moves "
            + ex.spanRatio.toFixed(2) + "×"
          : "")
      + ". Where it sits relative to the older generations is set by that choice, not by a "
      + "measured difference between the parts.";
  });
  const lead = document.createElement("strong");
  lead.textContent = "READ THE BAR HEIGHTS WITH THIS: ";
  note.append(lead, document.createTextNode(parts.join(" ")
    + " No public evidence settles the real operating point; resolving it needs a reconstructable "
    + "serving curve at a stated batch, which is a registered evidence task. The difference "
    + "between generations on this chart is partly a difference between what is measured and "
    + "what is assumed."));
  note.hidden = false;
}
function niceTicks(max) {
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const s = max / step > 5 ? step * 2 : max / step > 2.5 ? step : step / 2;
  const out = []; for (let v = 0; v <= max; v += s) out.push(v);
  return out;
}

/* ---------- subscription card ---------- */
function buildSubControls() {
  if (!explainGuardBeforeMutation()) { escalatePending("full"); return; }   /* §18.11 P0-a: an aborted builder is a FULL-level pending (a bare render cannot rebuild controls) */
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
  const wl = appWorkload(S);
  const sub = $("chart-sub-sub");
  if (sub) sub.textContent = "What heavy users might cost under the selected serving scenario"
    + (fleetRenderableText(wl) ? " · " + fleetRenderableText(wl) : "");
  if (!isFinite(wl.costMix)) {
    const note = document.createElement("div");
    note.className = "chart-empty";
    note.textContent = appNoNumberReason(wl);
    el.appendChild(note);
    return;
  }
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
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "group", "aria-label": "Subscription economics. Tab to inspect each bar." });
  const xmax = Math.max(...rows.map(r => r.v)) * 1.1;
  const xs = v => padL + v / xmax * (W - padL - padR);
  rows.forEach((r, i) => {
    const y = padT + i * rowH + 6, bh = 22;
    svg.append(chartText(padL - 8, y + bh / 2 + 4, r.name, { anchor: "end", size: 11.5 }));
    const p = svgEl("path", { d: roundedBarPath(padL, y, Math.max(1, xs(r.v) - padL), bh, 4, true), fill: r.color });
    svg.append(p);
    svg.append(chartText(xs(r.v) + 6, y + bh / 2 + 4, fmt$(r.v), { weight: 600, fill: "var(--ink-1)" }));
    attachMarkTip(p, () => ttRows(r.name, [["per month", fmt$(r.v)]]),
      `${r.name}: ${fmt$(r.v)} per month`);
  });
  el.appendChild(svg);
  appendChartTable(el, ["Metric", "Per month"], rows.map(r => [r.name, fmt$(r.v)]),
    "Subscription economics");
  const verdict = document.createElement("div");
  verdict.style.cssText = "font-size:12.5px;font-weight:600;padding:2px 4px 8px;color:" + (subMargin >= 0 ? "var(--good)" : "var(--series-6)");
  verdict.textContent = subMargin >= 0
    ? `Plan serving margin ≈ ${fmtPct(subMargin)} — THIS usage level is still profitable at direct serving cost (${fmtNum(tokensM * 1e6)} tokens ≈ ${fmt$(cost)} to serve). Says nothing about the median subscriber — no usage distribution is public.`
    : `THIS usage level is underwater by ${fmt$(cost - S.subPlan)}/mo at direct serving cost. Says nothing about the median subscriber — no usage distribution is public.`;
  if (fleetRenderableText(wl)) verdict.textContent += " " + fleetRenderableText(wl) + ".";
  el.appendChild(verdict);
}

/* ---------- §10 "Astra Pro estimates" chart (bq-3351) ----------
   Replaces the §10 normalized comparison table (renderNormalized), which priced every provider
   through one page-authored lens and read as a ranking; the owner ruled it dropped
   (d-20260925-im-astra-pro-estimates-category-and-drop-same-assumption-section). This chart draws
   the category that took its place: each model's recorded operating points from
   astra-pro-estimates.js, computed HERE by the engine at page load (astraProReplay — the same
   pipeline the build uses for the card faces and the MCP uses for run_scenario). Rows keep the
   registry's fixed provider order; nothing is sorted by value. The series label sits on the chart
   itself so a screenshot of it carries whose estimates these are. */
let ASTRA_PRO_CHART_NARROW = null;
function renderAstraProChart() {
  const el = document.getElementById("astra-pro-chart"); if (!el) return;
  el.textContent = "";
  const recs = (typeof ASTRA_PRO_REGISTRY !== "undefined" && ASTRA_PRO_REGISTRY.estimates) || [];
  if (!recs.length) return;
  const rows = recs.map(rec => {
    try { const r = astraProReadings(rec); return { rec, ok: true, mid: r.central / 100, lo: r.low_margin / 100, hi: r.high_margin / 100 }; }
    catch { return { rec, ok: false }; }
  });
  /* Two layouts: below about 760 px the labels move above their bars and the viewBox narrows, so the
     drawn text stays legible when the SVG scales to the column (a 720-wide viewBox on a 390 px
     screen renders 11 px text at about 4 px). Re-rendered when the width crosses the breakpoint. */
  const narrow = window.innerWidth < 760;
  ASTRA_PRO_CHART_NARROW = narrow;
  const W = narrow ? 300 : 720, rowH = narrow ? 42 : 30, padL = narrow ? 8 : 206, padR = narrow ? 44 : 64, padT = narrow ? 40 : 30;
  const fs = narrow ? 11.5 : 11;
  const H = padT + rows.length * rowH + 26;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "group", "aria-label": "Astra Pro estimates: each model's central reading (dot) and its author's low-to-high scenarios (bar), serving margin at list. Tab to inspect each row." });
  const x0 = padL, x1 = W - padR;
  const xmin = Math.min(0, ...rows.filter(r => r.ok).map(r => Math.floor(r.lo * 4) / 4)), xmax = 1;
  const xs = v => x0 + (v - xmin) / (xmax - xmin) * (x1 - x0);
  svg.append(chartText(narrow ? 4 : 8, 16, "Astra Pro estimates", { weight: 600, fill: "var(--ink-1)", size: narrow ? 13 : 12.5 }));
  svg.append(chartText(narrow ? 4 : W - 8, narrow ? 31 : 16, "serving margin at list · not a ranking", { anchor: narrow ? "start" : "end", fill: "var(--ink-3)", size: 10.5 }));
  for (let g = Math.ceil(xmin * 4) / 4; g <= 1.0001; g += 0.25) {
    svg.append(svgEl("line", { x1: xs(g), y1: padT - 4, x2: xs(g), y2: H - 22, stroke: "var(--grid)", "stroke-width": 1 }));
    svg.append(chartText(xs(g), H - 8, Math.round(g * 100) + "%", { anchor: "middle", fill: "var(--ink-3)", size: 10.5 }));
  }
  rows.forEach((r, i) => {
    const y = padT + i * rowH, cy = narrow ? y + 28 : y + rowH / 2;
    const g = svgEl("g", { "data-ape-mark": r.rec.key });
    const name = r.rec.provider + " · " + r.rec.name;
    g.append(narrow ? chartText(x0, y + 13, name, { size: fs }) : chartText(padL - 8, cy + 4, name, { anchor: "end", size: fs }));
    if (!r.ok) {
      g.append(chartText(x0 + 6, cy + 4, "no finite reading on this engine", { size: 10.5, fill: "var(--ink-3)" }));
      svg.append(g); return;
    }
    const cl = v => Math.max(xmin, Math.min(1, v));
    g.append(svgEl("rect", { x: xs(cl(r.lo)), y: cy - 5, width: Math.max(2, xs(cl(r.hi)) - xs(cl(r.lo))), height: 10, rx: 5, fill: "var(--series-1)", "fill-opacity": 0.28 }));
    g.append(svgEl("circle", { cx: xs(cl(r.mid)), cy, r: 6, fill: "var(--series-1)", stroke: "var(--bg, #fff)", "stroke-width": 1.5 }));
    g.append(chartText(Math.min(xs(cl(r.hi)) + 6, W - 2), cy + 4, "~" + Math.round(r.mid * 100) + "%", { weight: 600, fill: "var(--ink-1)", size: fs, anchor: xs(cl(r.hi)) + 6 > W - 40 ? "end" : "start" }));
    const label = `${r.rec.provider} ${r.rec.name}: ~${Math.round(r.mid * 100)}% serving margin at list on GPT-6 Astra Pro's central inputs; its low and high scenarios ${Math.round(r.lo * 100)}% to ${Math.round(r.hi * 100)}%`;
    attachMarkTip(g, () => ttRows(r.rec.provider + " — " + r.rec.name, [
      ["Central (this calculator)", "~" + Math.round(r.mid * 100) + "%"],
      ["Low – high scenarios", Math.round(r.lo * 100) + "% – " + Math.round(r.hi * 100) + "%"],
      ["Its own stated reading", Number(r.rec.stated.headline_pct).toFixed(1) + "%"],
      ["Estimated by", "GPT-6 Astra Pro, " + r.rec.dive.date],
    ]), label);
    svg.append(g);
  });
  el.appendChild(svg);
  appendChartTable(el, ["Model", "Central (this calculator)", "Low – high scenarios", "Its own stated reading", "Review"],
    rows.map(r => {
      const a = document.createElement("a"); a.href = r.rec.review_page; a.textContent = "GPT-6 Astra Pro review"; a.setAttribute("aria-label", "GPT-6 Astra Pro review of " + r.rec.name);
      return r.ok
        ? [r.rec.provider + " — " + r.rec.name, "~" + Math.round(r.mid * 100) + "%", Math.round(r.lo * 100) + "% – " + Math.round(r.hi * 100) + "%", Number(r.rec.stated.headline_pct).toFixed(1) + "%", a]
        : [r.rec.provider + " — " + r.rec.name, "—", "—", Number(r.rec.stated.headline_pct).toFixed(1) + "%", a];
    }),
    "Astra Pro estimates — serving margin at list, grouped by provider (not a ranking)");
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
function centralFlagshipBucketId() {
  const median = PERSPECTIVES.find(p => p.id === "median");
  const bucket = median ? bucketForMargin(explorationFlagshipMargin(median)) : null;
  return bucket ? bucket.id : null;
}
/* Group order within a bucket (2026-07-12 evidence pass): scope-LAYER groups — unit-serving
   (token-SKU) vs api-product-line vs paid-user-cohort vs paid+free bundle vs segment-split vs
   analyst-assumption vs company-GM — so a reader never mistakes a product-line, cohort, bundle or
   company figure for a unit-serving claimant. The special provenance groups (unnamed-subject,
   disclosure anchor, model-generated) keep their own segregation and precedence. */
const BOARD_GROUP_META = {
  unit:    { cls: "g-unit",    title: "Unit-serving (token-SKU) claim records compatible with this range — relation badged per record (this calculator's metric)" },
  api:     { cls: "g-api",     title: "API / product-line margins — a product-line perimeter, not the single-token unit metric" },
  cohort:  { cls: "g-cohort",  title: "Paid-user-cohort compute margins — a paying-user perimeter, not the unit metric and not a company gross margin" },
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
/* F11 (review): this map MUST cover PERSPECTIVE_SPACE_KEYS — boardChangedSummary maps over that
   list, so a key present there and missing here renders "undefined [object Object]" on a route card.
   The three row-499 keys are here for that reason, not because any config sets them yet. */
const BOARD_FIELD_LABEL = { hwMode: "cost basis", kwh: "electricity price", dcPerW: "datacenter capex per watt", dcLifeYears: "datacenter life", capexScopeMode: "capex scope", capexAbsLeg: "absolute capex by accelerator", rentRegistryPin: "pinned rent registry", capitalRecovery: "capital recovery", rentMult: "GPU-hour multiplier", rentMultLeg: "per-accelerator discount", rentMultFam: "per-family discount", rentAbsAll: "absolute rental price", rentAbsLeg: "absolute rental price by accelerator", dialRanges: "declared ranges", util: "fleet utilization", stackMult: "serving-stack efficiency", interact: "interactivity", batchShare: "batch-API share", discount: "average discount", blend: "hardware blend" };
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
  /* Never let an object reach a reader as "[object Object]" (browser-QA finding 1): the pin keys
     are object-valued, and the pinned-key filter above should already have removed them, so this
     is the second line of defence rather than the fix. */
  if (v && typeof v === "object") {
    const parts = Object.entries(v).map(([kk, vv]) => kk + " " + (vv && typeof vv === "object" ? "…" : String(vv)));
    return parts.length ? parts.join(", ") : "none";
  }
  return String(v);
}
function boardChangedSummary(p) {
  const central = PERSPECTIVES.find(x => x.id === "median").set;
  /* im-share-ready-0920 (2026-09-21, browser-QA finding 1): this summary must exclude the SAME
     migration pins `changedFieldsFromCentral` excludes, and for the same reason — they are
     migration metadata, not authored levers. Omitting the exclusion here did two visible things:
     the enumerated deltas disagreed with the row's own "(N changed)" count, and the pin keys
     reached readers as `undefined null → [object Object]`, because a pin is object-valued and its
     label was missing from BOARD_FIELD_LABEL. Both were live on two of the five route rows. The
     label map above is now complete as its own F11 comment requires, so a key that later stops
     being pinned still renders a name rather than "undefined"; this filter is the primary fix and
     that completeness is the backstop. */
  const pinned = new Set(p.migrationPins || []);
  return PERSPECTIVE_SPACE_KEYS
    .filter(k => !pinned.has(k)
      && JSON.stringify(p.set[k] ?? DEFAULTS[k]) !== JSON.stringify(central[k] ?? DEFAULTS[k]))
    .map(k => (BOARD_FIELD_LABEL[k] || k) + " " + boardFieldVal(k, central[k] ?? DEFAULTS[k]) + " → " + boardFieldVal(k, p.set[k] ?? DEFAULTS[k]))
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
  // IM3 exit-gate fix 1: weld the renderable-weight-share condition (primary=false — a route
  // card is a labeled counterfactual, not the flagship-default surface fix 3's caveat targets).
  const fwl = explorationFlagshipWorkload(p);
  const fm = fwl.margin * 100;
  const meta = mkEl("p", "config-meta", "Route " + rank + " of " + total + " — " + EXPLORATION_ORDER_BASIS + " (" + n + " changed). Lands at ≈" + Math.round(fm) + "% at the flagship scope (Claude Opus 4.x @ Reference 15:1/60%), computed at the public-evidence reference — algorithmic lead 0 months, family multipliers 1.0×, so a route's band is a property of its own construction — membership computed, never enforced. " + fleetRenderableClause(fwl.fleetRenderable, false, fwl.membership) + ".");
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
  /* §18.13 C-2 (R6 refinement): the load intent ENQUEUES AFTER applyPreset — so the head's
     stale-intent cancel can never eat the click that just set it — and executes immediately
     on the normal path (no stranded close, nothing pending: behavior byte-identical). */
  NAV_INTENT = { kind: "load-scroll" };
  if (EXPLAIN.phase === "idle" && !PENDING_LEVEL) runNavIntent();
}
/* Central-scenario return row. The default currently renders all seven declared legs, but placement
   remains unverified, so it is a policy-labeled baseline rather than a central estimate. The shared
   fleetRenderableClause still attaches any future partial-fleet or policy disclosure dynamically.
   This row may share a bucket with a counterfactual route; it remains a distinct load affordance and
   re-runs the same returnToCentral() reset the identity strip uses. */
function centralReturnRow() {
  const row = mkEl("div", "config-row central-return-row");
  const head = mkEl("div", "config-head");
  head.append(boardBadge("POLICY-LABELED BASELINE SCENARIO", "badge-high"), mkEl("strong", "config-name", "The central scenario (§5)"));
  const tag = mkEl("span", "config-loaded-tag", "· currently loaded in the calculator below"); tag.hidden = true;
  head.append(tag);
  row.append(head);
  const median = PERSPECTIVES.find(x => x.id === "median");
  const fwl = explorationFlagshipWorkload(median);
  const fm = fwl.margin * 100;
  const meta = mkEl("p", "config-meta", "The central scenario — no changed fields. Computes to ≈" + Math.round(fm) + "% at the flagship scope (Claude Opus 4.x @ Reference 15:1/60%) at the public-evidence reference (algorithmic lead 0 months); the calculator's own default state carries the ratified algorithmic-lead prior and computes to ≈" + Math.round(liveCentralDefaultPct()) + "%. " + fleetRenderableClause(fwl.fleetRenderable, true) + ".");
  meta.title = "unrounded flagship-scope value: " + fm.toFixed(2) + "% (conditional scenario output; input uncertainty is not propagated)";
  row.append(meta);
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "ghost-btn btn-wrap central-return-btn";
  btn.textContent = "↺ Load the central scenario into the calculator — the policy-labeled baseline scenario, not a counterfactual";
  btn.onclick = () => {
    returnToCentral();
    NAV_INTENT = { kind: "load-scroll" };            // §18.13 C-2: enqueue after the transaction
    if (EXPLAIN.phase === "idle" && !PENDING_LEVEL) runNavIntent();
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
  /* §18.13 C-2 (R6 refinement): the load intent ENQUEUES AFTER applyPreset — so the head's
     stale-intent cancel can never eat the click that just set it — and executes immediately
     on the normal path (no stranded close, nothing pending: behavior byte-identical). */
  NAV_INTENT = { kind: "load-scroll" };
  if (EXPLAIN.phase === "idle" && !PENDING_LEVEL) runNavIntent();
}
/* ---------- LOAD OPS ON THE HIGHER-JUSTIFICATION ENTRIES ----------
   Owner annotation nd4f4c7: "Need to be able to load them into the calculator with clear
   indication of their publicly stated positions vs our inferences about their positions."

   The mechanism the estimate cards already use, extended to these entries — one `loadPerspective`
   call, the same validation, the same scroll intent. What is added here is the LABELLING, because
   this is exactly the surface where the two things he wants distinguished sit side by side: the
   entry's own links go to the STATED position (registry rows carrying the verbatim quote and its
   source), and the button below loads a vector this page authored to probe that position. So the
   button says whose claim it is anchored to and that the vector is ours, rather than reading as
   "load X's numbers" — which is the misreading the annotation is guarding against.

   Entries with no authored route render the null finding instead of a button. The ops come from
   the engine's typed anchor (`hjLoadOps`); app.js chooses no targets of its own. */
function faHigherLoadOps(g) {
  const box = document.createElement("div"); box.className = "fa-higher-loadops tile-delta";
  const ops = (g && g.loadOps) || [];
  if (!ops.length) {
    box.classList.add("fa-higher-loadops-none");
    box.textContent = "No route into this claim is authored here — this page constructs none, and the entry above says why rather than offering a vector it has refused to author.";
    return box;
  }
  box.append(mkEl("span", "loadop-lead", ops.length > 1
    ? "Load a page-authored route anchored to this claim: "
    : "Load the page-authored route anchored to this claim: "));
  ops.forEach((op, i) => {
    const a = document.createElement("a");
    a.href = "#"; a.className = "load-op";
    a.dataset.model = op.model; a.dataset.persp = op.perspId;
    a.textContent = op.label + (op.rangeLabel ? " (" + op.rangeLabel + ")" : "") + " ↑";
    a.title = op.relation + " — the claim is " + op.who + "'s, the dial settings are this page's";
    a.onclick = e => { e.preventDefault(); loadPerspective(op.model, op.perspId); };
    box.append(a);
    if (i < ops.length - 1) box.append(document.createTextNode(" · "));
  });
  box.append(mkEl("div", "loadop-provenance",
    "Stated position vs. ours: the source links above are the claim as published; the route is this page's reconstruction, and its own note says which fields it moved."));
  return box;
}
function wireLoadOpLinks() {
  document.querySelectorAll("a.load-op").forEach(a => {
    a.onclick = e => { e.preventDefault(); loadPerspective(a.dataset.model, a.dataset.persp); };
  });
}
function renderBoard() {
  if (!explainGuardBeforeMutation()) { escalatePending("full"); return; }   /* §18.11 P0-a */
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
    else cfg.append(mkEl("p", "bucket-empty", boardNoRouteStatement(bid)));
    if (bid === centralFlagshipBucketId()) cfg.append(centralReturnRow());
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
  return bid === centralFlagshipBucketId()
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
    const centralHere = bid === centralFlagshipBucketId();
    chip.append(mkEl("span", "chip-meta",
      (nRoutes ? nRoutes + " page-authored route" + (nRoutes === 1 ? "" : "s")
        : centralHere ? "no authored route — the central scenario is this range's anchor" : "no page-authored route")
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
  if (!explainGuardBeforeMutation()) { escalatePending("full"); return; }   /* §18.11 P0-a */
  const det = $("front-door-detail"); if (!det) return;
  det.textContent = "";
  if (!FRONT_DOOR_SEL) { det.hidden = true; return; }
  det.hidden = false;
  const b = MARGIN_BUCKETS.find(x => x.id === FRONT_DOOR_SEL);
  det.append(mkEl("p", "fd-question", "What would have to be true for a " + b.label + " modeled serving margin (at the flagship scope: Claude Opus 4.x @ Reference 15:1/60%)?"));
  const ranked = rankExplorations(), total = ranked.length;
  const mine = ranked.filter(p => (explorationComputedBucket(p) || {}).id === b.id);
  if (mine.length) mine.forEach(p => det.append(boardConfigRow(p, ranked.indexOf(p) + 1, total)));
  else det.append(mkEl("p", "fd-null", boardNoRouteStatement(b.id)));
  if (b.id === centralFlagshipBucketId()) {
    const median = PERSPECTIVES.find(x => x.id === "median");
    // IM3 exit-gate fix 1/3: welds the renderable-weight-share condition + Hopper-family
    // correlation caveat (primary=true — always the flagship-scope computation). Appended AFTER
    // the existing sentence (not restructured into it) so the mirrored prefix/suffix substrings
    // mcp-server/src/labels.ts's APPJS_MIRROR.centralAnchorPrefix/Suffix depend on stay byte-exact
    // (mcp-server/test/contract.test.mjs's grep-parity test).
    {
      const fwl = explorationFlagshipWorkload(median);
      // R2 (§1.4): the flagship board anchor carries the policy-labeled noun + the FULL
      // welded disclosure (renormalization clause + policy clause — the width story).
      det.append(mkEl("p", "fd-null", "At the flagship scope the policy-labeled baseline scenario computes to ≈" + Math.round(fwl.margin * 100) + "% at the public-evidence reference (algorithmic lead 0 months, family multipliers 1.0×); the calculator's own default state carries the ratified algorithmic-lead prior and reads higher. The calculator below computes to ≈" + Math.round(liveCentralDefaultPct()) + "%. " + fleetRenderableDisclosure(fwl.fleetRenderable, true, fwl.membership) + "."));
    }
    det.append(centralReturnRow());
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
  return "derived from the “" + id.lensName + "” scenario preset on " + id.modelName + ", not the central scenario";
}
function updateBoard() {
  const sec = document.getElementById("evidence-board"); if (!sec) return;
  const curM = currentModel(), curP = currentPersp();
  const suppressed = curM && curP && pairingSeverity(curM, curP) === "hard" && !FORCE_EXPLORATORY;
  const currentWl = appWorkload(S);
  const pct = currentWl.margin * 100;
  const fleetText = fleetRenderableText(currentWl);
  const b = (!suppressed && isFinite(pct)) ? bucketForMargin(pct) : null;
  sec.querySelectorAll(".bucket").forEach(card => {
    const isCur = !!(b && card.dataset.bucket === b.id);
    card.classList.toggle("bucket-current", isCur);
    const chip = card.querySelector(".bucket-current-note");
    if (chip) {
      chip.hidden = !isCur;
      // Generated from ACTUAL state (public-release P0): never a hardcoded "central scenario preset". Names the
      // real lens/replay/route and says "MODIFIED" whenever the config differs from the central defaults.
      if (isCur) chip.textContent = "◉ current scenario lands here: ≈" + Math.round(pct) + "% — " + boardStateLabel()
        + "; nothing on this board sets it" + (fleetText ? " · " + fleetText : "");
    }
  });
  sec.querySelectorAll(".range-chip").forEach(chip => {
    const isCur = !!(b && chip.dataset.bucket === b.id);
    const note = chip.querySelector(".chip-current");
    if (note) {
      note.hidden = !isCur;
      if (isCur) note.textContent = "◉ current scenario lands here (≈" + Math.round(pct) + "% — " + boardStateLabel()
        + ", never set here" + (fleetText ? " · " + fleetText : "") + ")";
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
/* row 499: the state the page OPENS in, unedited. Before row 499 that was always the clean central,
   so `isCentralClean()` carried both jobs; the page now opens on a named estimate preset, and the
   two jobs came apart. The one that must follow the OPENING state is the policy-labeled identity
   chip — the owner's picked landing-hero mode. Losing it because the opening preset is no longer
   `median` would silently drop a labeling guarantee from the first thing a visitor reads, which is
   the exact regression class the R3 memo note at its call site warns about. Central-RETURN sync,
   suppression, and gate-7 eligibility keep using `isCentralClean()`: those are about the central
   scenario itself, not about what the page opens on. */
function isLandingClean() {
  const m = currentModel(), p = currentPersp();
  /* note-20260912T180812Z-c9eaac: a reader who made another scenario their default OPENS on it, and the
     opening-state label follows the opening state (the reason this function exists). */
  /* Astra round 2 F10: only on Opus. The mandatory text this predicate switches on states that placement is
     unverified, which is true of the closed flagship and false of a model whose placement IS verified
     (DeepSeek on H800, for one). A reader's default on another model keeps that model's own labels. */
  const o = openingScenario();
  return !!(m && p && ((m.id === "opus" && (p.id === "median" || p.id === LANDING_DEFAULT_PERSP_ID))
      || (m.id === "opus" && o.model === "opus" && p.id === o.persp))
    && TRAFFIC.mode === "native" && !MODIFIED_FROM && !EXPLORATION_ORIGIN && presetIsClean());
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
      // R2 (§1.4; memo §0-ter): the strip's central state GATES on placement-verified
      // central eligibility (gate-7). A closed model can never satisfy it in R2, so the
      // clean default carries a policy-scenario identity, never a bare "central" claim.
      isCentral = true; cls = "id-central";
      stateLabel = appLandingCentralEligible()
        ? "central scenario — clean default"
        : "clean default — policy-labeled scenario baseline (central identity requires placement-verified eligibility; none exists for a closed model)";
    } else {
      stateLabel = p.kind === "replay" ? "clean replay — published operating point" : "clean scenario preset";
    }
  }
  if (isCustom) { cls = isModified ? "id-modified" : "id-custom";
    stateLabel = "USER-DEFINED, UNSOURCED — not a provider estimate" + (isModified ? " · edited" : "; inherits the " + lensName + " lens + model-default hardware"); }
  return { modelName, isCustom, trafficTxt, lensName, stateLabel, cls, isModified, isCounterfactual, isCentral, clean, oob };
}
function identitySummary() { const id = computeIdentity(); return id.modelName + " · " + id.trafficTxt + " · " + id.lensName + " · " + id.stateLabel; }
/* ================= THE ONE WINDOW, AND THE READER'S DEFAULT =================
   Owner voice note note-20260912T180812Z-c9eaac (2026-09-12T18:08Z), verbatim: "if our default
   assumptions are going to be GPT Pro's then we can leave that as the one window and it can be
   highlighted as the default window and they should be able to swap. There should actually be a
   button on every assumption to set as the defaults so that they can set fable as the default or
   they can set the conservative estimate as the default for instance."

   So the headline tile IS the window. It names the scenario it shows, says when that scenario is
   the default, swaps scenario in place, and every scenario carries a "set as default" control. The
   PAGE's default does not move (LANDING_DEFAULT_PERSP_ID in engine.js); a reader's choice lives in
   THIS browser only and changes only what an ordinary visit opens on. A shared link still opens what
   it names: loadScenarioFromURL runs after the opening selection and wins by construction, and
   loading a link never writes this key.

   The same tile carries the calculation (bq-2345): both operands, the division, and the engine's
   own result at one decimal. The decimal is not decoration: the rounded cents land on the other
   side of a whole-percent boundary from the result (1 - 0.65/3.72 = 82.53 % against the engine's
   82.42 % at the page default), so the face says the dollar amounts are rounded. */
const READER_DEFAULT_KEY = "im_default_scenario_v1";
const WINDOW_PRIMARY = Object.freeze(["gptpro-r3", "fable-r3", "stress-public-rate", "median"]);
const WINDOW_SHORT_NAMES = Object.freeze({
  "gptpro-r3": "GPT-5.6 Pro estimate",
  "fable-r3": "Fable 5 estimate",
  "stress-public-rate": "Planning baseline (conservative)",
  "median": "Central scenario",
});
function readReaderDefault() {
  let rec = null;
  try { rec = JSON.parse(localStorage.getItem(READER_DEFAULT_KEY)); } catch { return null; }
  if (!rec || typeof rec !== "object") return null;
  /* A stored id this page no longer carries is IGNORED, never half-applied: the page then opens on
     its own default exactly as it would for a first visit. */
  if (!MODELS.some(m => m.id === rec.model) || !PERSPECTIVES.some(p => p.id === rec.persp)) return null;
  return { model: rec.model, persp: rec.persp };
}
function openingScenario() { return readReaderDefault() || { model: "opus", persp: LANDING_DEFAULT_PERSP_ID }; }
function writeReaderDefault(model, persp) {
  try {
    if (model === "opus" && persp === LANDING_DEFAULT_PERSP_ID) localStorage.removeItem(READER_DEFAULT_KEY);
    else localStorage.setItem(READER_DEFAULT_KEY, JSON.stringify({ model, persp, setAt: new Date().toISOString() }));
    return true;
  } catch { return false; }
}
function scenarioLabel(p) {
  if (!p) return "Modified scenario";
  return WINDOW_SHORT_NAMES[p.id] || (p.name || p.id).replace(/^\[[^\]]*\]\s*/, "");
}
/* Astra round 3 F8: decide on the EFFECTIVE traffic mix, not the raw selection. A replay locks its published mix,
   so a latent explicit selection changes nothing it computes and nothing a default would reopen with. */
function reopenTrafficDiffers(m, p) {
  if (!m || !p) return false;
  let now, reopen;
  try { now = resolveTraffic(m, p, currentTrafficSel()); reopen = resolveTraffic(m, p, { mode: "native" }); } catch { return false; }
  return !!(now && reopen && (now.ioRatio !== reopen.ioRatio || now.cacheHit !== reopen.cacheHit));
}
function reopenTrafficText(m, p) {
  try { const t = resolveTraffic(m, p, { mode: "native" }); return t.ioRatio + ":1 / " + t.cacheHit + "%"; } catch { return "its own mix"; }
}
/* Astra rounds 6 and 7. What a default REOPENS is a scenario's own settings as a fresh visit applies them: the settings
   rebuilt from the model and scenario ids, the identities an identity-resetting application assigns (the preset's own blend
   or the model's default fleet, the parameter-count case its total matches, the trend interlock free, no custom fleet, no
   forced calculation) and the scenario's own traffic mix. The comparison covers every SCENARIO CHOICE a screen can hold that
   changes what a reopened scenario computes, identifies or shares: its settings (presetIsClean; S and a resolved preset
   carry the same key set for every model and scenario), the fleet identity compared exactly ("preset" and the default fleet
   compute alike but show different fleet panels and share-token identities, round 7 F4), the parameter-count case, the
   interlock, a forced incompatible pairing (round 7 F3), the effective traffic mix and the traffic selection that resolves
   to it, and a scenario name the reader typed (round 8 F6). It deliberately EXCLUDES what a
   scenario default is not (round 7 F8): notices about how the screen got here (a corrected link), visit-only interaction
   preferences (this visit's slider lock), view toggles and caches. The window marks a scenario as the default only when no
   compared choice differs; the row's control for the scenario on screen, and every confirmation, name what a default does
   not keep. */
function windowBaseScenario() {
  const p = currentPersp(); if (p) return p;
  if (EXPLORATION_ORIGIN) return PERSPECTIVES.find(x => x.id === EXPLORATION_ORIGIN.id) || null;
  /* Astra round 7 F7: loading a saved scenario records the page scenario it was saved from beside its display breadcrumb. */
  if (MODIFIED_FROM && MODIFIED_BASE && MODIFIED_BASE.from === MODIFIED_FROM) return PERSPECTIVES.find(x => x.id === MODIFIED_BASE.id) || null;
  return (typeof MODIFIED_FROM === "string" && MODIFIED_FROM) ? (PERSPECTIVES.find(x => x.id === MODIFIED_FROM || x.name === MODIFIED_FROM) || null) : null;
}
function reopenDifferences(m, p) {
  if (!m || !p) return ["state"];
  const out = [];
  if (MODIFIED_FROM || EXPLORATION_ORIGIN || currentPersp() !== p || !presetIsClean()) out.push("edits");
  const fleet = (!presetStackOwnsBlend(m, p) && FLEETS[DEFAULT_FLEET_ID].models.includes(m.id)) ? DEFAULT_FLEET_ID : "preset";
  const pageOwnFleet = id => id === "preset" || id === DEFAULT_FLEET_ID;
  /* A reader's own fleet choice (a named non-default fleet, a custom fleet, "custom") is not kept; the page's own identity left
     over from a previous scenario (13 of 1,152 window swaps, all on Opus away from GPT-5.6 Pro's preset) is replaced by the
     one a fresh visit assigns. Both are differences; they are worded differently. */
  if (FLEET_ID !== fleet) out.push(pageOwnFleet(FLEET_ID) && pageOwnFleet(fleet) ? "page-fleet" : "fleet");
  let totalCase = null;
  try { totalCase = initTotalCaseFor(m, applyPresetSettings(m, p, { mode: "native", profileId: null }).total); } catch { /* no reopening total to match */ }
  if (TOTAL_CASE_ID !== totalCase) out.push("total-case");
  if (INTERLOCK !== "free") out.push("interlock");
  if (FORCE_EXPLORATORY && pairingSeverity(m, p) === "hard") out.push("forced");
  if (reopenTrafficDiffers(m, p)) out.push("traffic");
  else {
    /* Astra round 8 F6: an equal-valued traffic SELECTION (Custom at the model's own numbers, an explicit profile its native mix
       resolves to) computes alike but shows a different traffic selector and shares a different traffic identity. A replay's lock
       decides its traffic whatever is selected, so a locked mix has no selection to lose. */
    let nowT = null, natT = null;
    try { nowT = resolveTraffic(m, p, currentTrafficSel()); natT = resolveTraffic(m, p, { mode: "native" }); } catch { /* nothing to compare */ }
    if (nowT && natT && !nowT.locked && !natT.locked && (nowT.mode !== natT.mode || (nowT.profileId ?? null) !== (natT.profileId ?? null))) out.push("traffic-choice");
  }
  /* A scenario name the reader typed rides a save and a shared link; a fresh visit starts without one (round 8 F6). */
  if (NAME_DIRTY) out.push("title");
  return out;
}
/* Astra round 8 F5: a link carries a modified state's origin as text. A state loaded from a saved lens would otherwise carry the
   saver's private breadcrumb ("saved scenario ..."), which no other browser can resolve; it carries the lens's own name
   instead, which the link loader resolves back to that scenario (windowBaseScenario). */
function shareModifiedOrigin() {
  if (MODIFIED_FROM && MODIFIED_BASE && MODIFIED_BASE.from === MODIFIED_FROM) {
    const b = PERSPECTIVES.find(x => x.id === MODIFIED_BASE.id); if (b) return b.name;
  }
  return MODIFIED_FROM;
}
/* Astra round 9 F4: the origin a save records. A synthetic modified state records the scenario the window resolves as its base
   when that base is a lens, however the base became known (a saved load's breadcrumb, or a link's lens name); a replay-derived
   state keeps recording "__modified", exactly as before, so its saved load is unchanged. */
function saveOriginId() {
  const v = $("persp-preset").value;
  if (v !== "__modified") return v;
  const b = windowBaseScenario();
  return b && b.kind === "lens" ? b.id : v;
}
const REOPEN_NOT_KEPT = Object.freeze({ edits: "the edits", fleet: "the fleet selection", "total-case": "the parameter-count case",
  interlock: "the trend-interlock choice", forced: "the forced calculation of this incompatible pairing",
  "traffic-choice": "the traffic selection", title: "the scenario name you typed", state: "the edited state" });
function reopenNotKept(diffs) {
  const n = diffs.filter(d => Object.prototype.hasOwnProperty.call(REOPEN_NOT_KEPT, d)).map(d => REOPEN_NOT_KEPT[d]);
  return n.length <= 1 ? (n[0] || "") : n.slice(0, -1).join(", ") + " and " + n[n.length - 1];
}
function reopenOpensWith(diffs, m, p) {
  const w = [];
  if (diffs.includes("traffic")) w.push("its own traffic mix, " + reopenTrafficText(m, p));
  if (diffs.includes("page-fleet")) w.push("the fleet a fresh visit assigns");
  return w.join(" and ");
}
function windowShowsDefault() {
  const m = currentModel(), p = currentPersp(), o = openingScenario();
  return !!(m && p && m.id === o.model && p.id === o.persp && reopenDifferences(m, p).length === 0);
}
function setReaderDefault(modelId, perspId) {
  const p = PERSPECTIVES.find(x => x.id === perspId);
  if (!p) return;
  /* Every scenario the window offers can be a reader's default on every model the selector offers, the Custom model
     included (note-20260912T180812Z-c9eaac: "a button on every assumption"; gate verdict 20260912T212606Z requeued the
     round-2 refusal that left Custom's scenarios without one). A default is a model id and a scenario id, and the page
     rebuilds that scenario's own settings from them. Custom's starting settings are page code like any named model's
     (MODELS "custom".set), so nothing about an unedited Custom scenario lives only in this visit. What no default carries
     is anything else on screen (round 6 F2/F6: edits, a fleet selection, a parameter-count case, the interlock choice),
     so the confirmation names whatever of that the screen holds (reopenDifferences). Astra round 2 F6: an id the page does not
     carry is refused, never replaced by another model. F8: a default opens with the scenario's own traffic mix (a
     replay's is its published locked mix); when the EFFECTIVE mix now differs from that, the confirmation says so
     instead of letting the next visit silently change the workload (round 3 F8: the resolved mix, never the raw selection). */
  const mm = MODELS.find(x => x.id === modelId);
  let message;
  if (!mm) {
    message = "That model is not one this page carries, so no default was saved.";
  } else {
    const screenM = currentModel(), screenBase = windowBaseScenario();
    const screenDiffs = (screenM && screenBase) ? reopenDifferences(screenM, screenBase) : ["state"];
    const notKept = reopenNotKept(screenDiffs);
    /* The page's own fleet identity belongs to the scenario on screen, so it is named only when that scenario is the one saved. */
    const freshFleet = !!(screenM && screenBase && screenM.id === mm.id && screenBase.id === p.id && screenDiffs.includes("page-fleet"));
    const saved = writeReaderDefault(mm.id, perspId);
    message = saved
      ? "Default set: this browser will open on " + scenarioLabel(p)
        + (mm.id !== "opus" ? " (" + mm.name.replace(" (define with sliders)", "") + ")" : "")
        + (reopenTrafficDiffers(mm, p) ? ", with its own traffic mix (" + reopenTrafficText(mm, p) + ") rather than the mix selected now" : "")
        + "." + (notKept || freshFleet ? " It opens that scenario's own settings" + (freshFleet ? ", with the fleet a fresh visit assigns" : "")
          + (notKept ? ", without " + notKept + " on screen" : "") + "." : "")
        + " Shared links still open what they name."
      : "This browser is blocking storage, so a default cannot be remembered here.";
  }
  renderScenarioWindow();
  const winNote = document.getElementById("win-note");
  if (winNote) { winNote.textContent = message; winNote.focus({ preventScroll: true }); }
}
function swapScenario(perspId) {
  if (!PERSPECTIVES.some(x => x.id === perspId)) return;
  $("persp-preset").value = perspId;
  applyPreset();
}
function clearHeroCalc() {
  const calc = document.getElementById("out-calc"); if (!calc) return;
  /* Astra round 2 F11: .tile-calc declares display:flex, which outranks [hidden], so an empty block kept its
     border on screen. The class is present only while the block has content: without it [hidden] hides the
     box. No inline style (the page has none, by guard) and no new stylesheet hiding rule (that set is audited). */
  calc.textContent = ""; calc.hidden = true; calc.classList.remove("tile-calc");
}
function renderHeroCalc(wl) {
  const calc = document.getElementById("out-calc"); if (!calc) return;
  calc.textContent = "";
  if (!wl || !isFinite(wl.margin) || !isFinite(wl.costMix) || !isFinite(wl.priceMix)) { calc.hidden = true; calc.classList.remove("tile-calc"); return; }
  const cost = fmt$(wl.costMix), bill = fmt$(wl.priceMix);
  const operand = (cls, label, value) => {
    const o = mkEl("span", "calc-op " + cls);
    o.append(mkEl("span", "calc-op-label", label), mkEl("span", "calc-op-value", value));
    return o;
  };
  const operands = mkEl("div", "calc-operands");
  operands.append(operand("calc-cost", "Serving cost", cost), operand("calc-billings", "Modeled billings", bill));
  calc.append(mkEl("div", "calc-unit", "For the same 1 million mixed tokens"), operands,
    mkEl("div", "calc-eq", "1 − " + cost + " cost ÷ " + bill + " billings"),
    mkEl("div", "calc-engine", "Engine result: " + (wl.margin * 100).toFixed(1) + "%. Dollar amounts above are rounded."));
  if (S.cacheHit > 0 && (S.cacheWriteShare || 0) === 0)
    calc.append(mkEl("div", "calc-warn", "Cache-write billing is 0%; modeled billings may be incomplete."));
  calc.hidden = false; calc.classList.add("tile-calc");
}
/* NOT DONE, deliberately: bq-2345 also proposed shrinking the hero's policy-label suffix to a normal-sized
   status label. That needs the suffix in an element of its own, and tests/run-app-tests.sh pins the
   SERIALIZED value token as one run of text (the single-node crop bar, memo D-3b). A standing guard
   outranks a layout preference, so the value token is left exactly as it was. */
function renderScenarioWindow() {
  const box = document.getElementById("win-head"); if (!box) return;
  const m = currentModel(), p = currentPersp();
  const isDefault = windowShowsDefault(), readerDefault = readReaderDefault(), opening = openingScenario();
  const wasOpen = !!(box.querySelector("details.win-all") || {}).open;
  /* The window is rebuilt on every render, which would drop a keyboard user's focus to <body> after a swap.
     Remember which control had it (its win-* class and scenario) and hand focus back to its replacement. */
  const had = box.contains(document.activeElement) ? document.activeElement : null;
  const refocus = had ? { cls: [...had.classList].find(c => c.startsWith("win-")) || "", persp: (had.dataset && had.dataset.persp) || "" } : null;
  const tile = box.closest(".tile-hero"); if (tile) tile.classList.toggle("win-default", isDefault);
  box.textContent = "";
  const kicker = mkEl("div", "win-kicker", "Selected scenario · calculated here");
  if (isDefault) kicker.append(" ", mkEl("span", "win-badge", readerDefault ? "★ Your default" : "★ Default"));
  box.append(kicker);
  const clean = !!p && presetIsClean() && !MODIFIED_FROM && !EXPLORATION_ORIGIN;
  const title = mkEl("div", "win-name");
  title.dataset.persp = p ? p.id : "";
  title.append(mkEl("strong", "win-name-scenario", (clean ? "" : "Modified from ") + (p ? scenarioLabel(p) : (MODIFIED_FROM || "a scenario"))),
    " · " + (m ? m.name.replace(" (define with sliders)", "") : "—"));
  box.append(title);
  if (!clean) box.append(mkEl("div", "win-modified", "These are no longer the scenario's unchanged settings."
    + (p && p.statedReading ? " The quoted estimate has not changed." : "")));
  let basisName = "—";
  try { const db = displayedProcurementBasis(p, m, appFleetEnergy(S)); if (db && db.name) basisName = db.name; } catch { /* a synthetic modified state has no lens basis to name */ }
  const months = S.trendMonths || 0;
  const facts = mkEl("div", "win-facts");
  facts.append(mkEl("span", "win-lead", "Assumed algorithmic lead: " + months + (months === 1 ? " month" : " months")), " · ",
    mkEl("span", "win-basis", "Cost basis: " + basisName.charAt(0).toUpperCase() + basisName.slice(1)), " · ",
    mkEl("span", "win-billing", "Billing: " + ((S.batchShare || 0) === 0 && (S.discount || 0) === 0
      ? "undiscounted list price"
      : "modeled effective price (Batch share " + (S.batchShare || 0) + "% · negotiated discount " + (S.discount || 0) + "%)")));
  box.append(facts);
  const base = windowBaseScenario(), baseDiffs = (base && m) ? reopenDifferences(m, base) : [];
  const defaultRow = mkEl("div", "win-default-row");
  if (isDefault) {
    defaultRow.append(readerDefault ? "This browser opens on this scenario. " : "The page opens on this scenario.");
    if (readerDefault) {
      const back = mkEl("button", "ghost-btn win-restore", "Restore the page's default ("
        + scenarioLabel(PERSPECTIVES.find(x => x.id === LANDING_DEFAULT_PERSP_ID)) + ")");
      back.type = "button";
      back.onclick = () => setReaderDefault("opus", LANDING_DEFAULT_PERSP_ID);
      defaultRow.append(back);
    }
  } else if (base && m && m.id === opening.model && base.id === opening.persp) {
    /* Already the scenario this browser opens on and not marked default, so the screen differs from what it reopens:
       say how, instead of offering to save what is already saved. */
    const how = [];
    if (reopenOpensWith(baseDiffs, m, base)) how.push("with " + reopenOpensWith(baseDiffs, m, base));
    if (reopenNotKept(baseDiffs)) how.push("without " + reopenNotKept(baseDiffs) + " on screen");
    defaultRow.append((readerDefault ? "This browser" : "The page") + " opens on this scenario's own settings"
      + (how.length ? ", " + how.join(" and ") : "") + ".");
  } else if (base && m) {
    /* Every scenario the window names carries the control, on every model, the Custom model included, edited or not
       (round 6 F7). It was once WITHHELD while a non-native traffic mix was selected; round 2 F8's own fix allows a control
       that discloses before success is announced, so the label says what a default opens with and what it does not keep
       (round 6 F2/F6: a fleet selection, a parameter-count case, the interlock choice, edits). */
    const why = [];
    if (reopenOpensWith(baseDiffs, m, base)) why.push("it opens with " + reopenOpensWith(baseDiffs, m, base));
    if (reopenNotKept(baseDiffs)) why.push("without " + reopenNotKept(baseDiffs) + " on screen");
    const onlyTraffic = baseDiffs.length === 1 && baseDiffs[0] === "traffic";
    const setBtn = mkEl("button", "ghost-btn win-set-default", baseDiffs.length === 0 ? "Set this scenario as my default"
      : (onlyTraffic ? "Set this scenario as my default (" : "Set " + scenarioLabel(base) + "'s own settings as my default (") + why.join("; ") + ")");
    setBtn.type = "button"; setBtn.dataset.persp = base.id;
    setBtn.onclick = () => setReaderDefault(m.id, base.id);
    defaultRow.append(setBtn);
  } else {
    defaultRow.append("This edited state names none of this page's scenarios, so it cannot reopen as a default; every scenario in the list below can.");
  }
  box.append(defaultRow);
  const swap = mkEl("div", "win-swap");
  swap.setAttribute("role", "group"); swap.setAttribute("aria-label", "Swap the scenario in this window");
  swap.append(mkEl("span", "win-swap-lead", "Swap scenario:"));
  WINDOW_PRIMARY.forEach(id => {
    const q = PERSPECTIVES.find(x => x.id === id); if (!q) return;
    const swapBtn = mkEl("button", "ghost-btn win-swap-btn", scenarioLabel(q));
    swapBtn.type = "button"; swapBtn.dataset.persp = id;
    swapBtn.setAttribute("aria-pressed", String(!!p && p.id === id));
    swapBtn.onclick = () => swapScenario(id);
    swap.append(swapBtn);
  });
  box.append(swap);
  const all = mkEl("details", "win-all");
  all.open = wasOpen;
  all.append(mkEl("summary", "win-all-summary", "Every scenario (" + PERSPECTIVES.length + "): show one here, or set it as your default"));
  const items = mkEl("ul", "win-all-list");
  PERSPECTIVES.forEach(q => {
    const item = mkEl("li", "win-all-item"); item.dataset.persp = q.id;
    const showBtn = mkEl("button", "ghost-btn win-show", "Show"); showBtn.type = "button"; showBtn.dataset.persp = q.id;
    showBtn.onclick = () => swapScenario(q.id);
    /* Astra round 2 F9: the registry name calls GPT-5.6 Pro's preset the page-open default; beside a reader's own
       default marker that would be two defaults, so this list names it the page's built-in default. */
    item.append(showBtn, " ", mkEl("span", "win-all-name", (q.name || q.id).replace("page-open default", "the page's built-in default")), " ");
    if (q.id === opening.persp && (!m || m.id === opening.model)) item.append(mkEl("span", "win-is-default", readerDefault ? "★ Your default" : "★ Default"));
    else {
      const setBtn = mkEl("button", "ghost-btn win-set-default", "Set as default");
      setBtn.type = "button"; setBtn.dataset.persp = q.id;
      setBtn.onclick = () => setReaderDefault(m && m.id, q.id);
      item.append(setBtn);
    }
    items.append(item);
  });
  all.append(items);
  /* §18.6: the hero tile carries no live region (tests/ux-c-cdp.test.mjs). A confirmation is announced by
     taking focus instead (setReaderDefault), so the note is focusable but not live. */
  const winNote = mkEl("p", "win-note"); winNote.id = "win-note"; winNote.tabIndex = -1;
  box.append(all, winNote);
  if (refocus && refocus.cls) {
    const again = [...box.querySelectorAll("." + refocus.cls)].find(el => ((el.dataset && el.dataset.persp) || "") === refocus.persp);
    if (again) again.focus({ preventScroll: true });
  }
  refreshSetDefaultButtons();
}
function refreshSetDefaultButtons() {
  const opening = openingScenario();
  document.querySelectorAll("button.set-default-btn").forEach(btn => {
    const on = btn.dataset.setDefaultModel === opening.model && btn.dataset.setDefaultPersp === opening.persp;
    btn.textContent = on ? "★ Default" : "Set as default";
    btn.setAttribute("aria-pressed", String(on));
  });
}
function wireSetDefaultButtons() {
  document.querySelectorAll("button.set-default-btn").forEach(btn => {
    btn.onclick = () => setReaderDefault(btn.dataset.setDefaultModel, btn.dataset.setDefaultPersp);
  });
  refreshSetDefaultButtons();
}
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
  // R2 (§1.3 hero flip): the epistemic chip names the POLICY-LABELED identity whenever
  // the landing fleet is not placement-verified central-eligible (always, for closed
  // models in R2) — the number is a policy-labeled scenario output, never central.
  el.append(chip(appLandingCentralEligible()
    ? "selected scenario output — not an identified estimate or probability interval"
    : "policy-labeled scenario output — not a verified or central estimate, not a probability interval", "id-epistemic"));
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "id-reset ghost-btn"; btn.textContent = "↺ Return to central scenario";
  btn.onclick = returnToCentral; btn.hidden = id.isCentral;
  el.append(btn);
}
function renderFeasibilityTile(f) {
  const label = f.renderableLegs === 0
    ? "fleet infeasible"
    : f.renderableLegs + " of " + f.totalLegs + " legs renderable";
  $("out-feas").textContent = label;
  // R2 (§1.10): solver receipts surfaced per leg — the SOLVED width rides every line
  // (capacity-min/declared-operating-point width for clean legs; widest legal for capped).
  $("out-feas-note").textContent = f.legs.map(leg => {
    const name = HW[leg.hwKey].name;
    const w = leg.widthRendered != null ? " @ solved width " + leg.widthRendered : "";
    if (leg.infeasible) return name + ": " + (leg.reason
      ? leg.reason + " (" + leg.opBasis + ")"
      : "infeasible at declared serving topology (" + leg.opBasis + ")");
    if (leg.capped) return name + ": capped from declared b=" + leg.bDeclared + " to b=" + leg.b
      + " (feasible cap " + leg.bFeas + "; " + leg.opBasis + ")" + w;
    return name + ": finite at declared b=" + leg.b + " (" + leg.opBasis + ")" + w;
  }).join(" · ");
}
/* R2 (§1.2 Option A — the gate-6 closed-contract default): the typed landing
   suppression tile. NO headline number and NO derived cost/price values render (they
   are the same fleet computation the gate refused to headline); solver receipts, the
   five-status vector (via the fleet chip), the per-leg feasibility tile and the
   sampled policy band render instead. Every string derives from engine output —
   nothing is hardcoded to today's fixture values. */
function renderSuppressedHero(wl) {
  const f = wl.fleetRenderable || {};
  const failing = (f.legStatuses || []).filter(l => !l.renderableUnderPolicy);
  $("out-margin").textContent = "—"; $("out-margin-status").textContent = "";
  $("out-margin").title = "landing hero suppressed (gate-6): the landing fleet is not fully renderable under the declared loaded-bytes policy; no headline number is shown on the landing default";
  // R3 (D-4): the strict branch fires on ANY membership exclusion — the member set
  // itself renders fully, so the cause is the exclusion (shared formatter), not a
  // failing rendered leg.
  const memb = appDefaultMembership();
  /* §18.10 P0-e: the suppressed clause is MANDATORY; its policy-band unit is a RECEIPT —
     split into the typed regions so it participates in coarse hiding, relocation and
     trigger sync exactly like the main flow's. textContent is byte-identical (U-C0). */
  TAIL.mandatory = "HERO SUPPRESSED — no landing headline under the declared loaded-bytes policy (gate-6): "
    + (failing.length
      ? failing.map(l => (HW[l.hwKey] ? HW[l.hwKey].name : l.hwKey) + " — " + l.note).join("; ")
      : memb && memb.excluded.length
        ? membershipExclusionClause(memb) + " Strict mode shows no landing number unless the declared fleet serves in full, undiminished."
        : "the landing fleet does not fully render under the declared policy")
    + ". A partially policy-clean fleet is not shown as this page's flagship claim; adjust any assumption to see the disclosed, policy-labeled scenario number with its welded clause.";
  TAIL.receipts.push(policyBandReceiptText(heroPolicyBand(), "%"));
  $("out-cost").textContent = "—"; $("out-price").textContent = "—";
  $("out-cost-out").textContent = "—"; $("out-cost-in").textContent = "";
  { const pn = document.getElementById("out-price-note"); if (pn) pn.textContent = ""; }
  { const un = document.getElementById("out-margin-unanchored"); if (un) un.textContent = ""; }
  renderFeasibilityTile(appFeasibility(S));
  commitTail();
}
function returnToCentral() {
  $("model-preset").value = "opus"; $("persp-preset").value = "median";
  TRAFFIC = { mode: "native", profileId: null };
  LAST_APPLIED_MODEL = null; // CA-1: an explicit reset gesture is IDENTITY-RESETTING even same-model
  const c = $("model-dossier-card"); if (c) c.open = false;
  FORCE_EXPLORATORY = false;
  ["__modified", "__modified-exploration"].forEach(v => { const o = $("persp-preset").querySelector('option[value="' + v + '"]'); if (o) o.remove(); });
  applyPreset(); // resets MODIFIED_FROM / EXPLORATION_ORIGIN and rebuilds S = clean central
  history.replaceState(null, "", location.origin + location.pathname); // drop any ?s= permalink so the reset truly resets
}
/* ================= b9 UX-C (memo §18 v6): the TYPED TAIL — three ordered regions =================
   The hero tail stops accumulating one string on #out-margin-note. Every terminal path of
   updateTiles()/renderSuppressedHero() composes a typed TAIL and commits it ATOMICALLY (gate Q4):
   `.tile-mandatory` (every state-identity label, always inline) → `.tile-receipts` (the ` · `
   supplemental units, atomic label/value spans — the ONLY thing that ever relocates) →
   `.tile-actions` (trailing mandatory affordances — never relocated, never hidden). The withdrawn
   §4.7 regex is dead: an honesty invariant never parses prose — composition is typed at the
   WRITE sites. Separators are TEXT NODES (` · `), never CSS ::before, so textContent is
   byte-identical to the pre-refactor flat string (U-C0 pins it against the minted fixture).
   Wrappers are JS-built ONLY — MCP `front-page` reads the whole of index.html (§18.5). */
const TAIL = { mandatory: "", receipts: [], actions: [] };
function tailReset() { TAIL.mandatory = ""; TAIL.receipts = []; TAIL.actions = []; }
function commitTail() {
  const note = $("out-margin-note"); if (!note) return;
  /* §18.4/§18.5: class-keyed typography stamped in JS ONLY (index.html is never edited — MCP
     front-page reads the whole file); idempotent by classList semantics. */
  note.classList.add("tile-explain");
  { const un = document.getElementById("out-margin-unanchored"); if (un) un.classList.add("tile-explain"); }
  { const fn = document.getElementById("out-feas-note"); if (fn) fn.classList.add("tile-explain"); }
  const man = document.createElement("div"); man.className = "tile-mandatory";
  man.textContent = TAIL.mandatory;
  const rec = document.createElement("div"); rec.className = "tile-receipts";
  for (const unit of TAIL.receipts) {
    rec.append(" · "); // the pinned ` · ` separator, textContent-visible by construction
    const u = document.createElement("span"); u.className = "tile-receipt-unit";
    u.textContent = unit;
    rec.append(u);
  }
  const act = document.createElement("div"); act.className = "tile-actions";
  for (const a of TAIL.actions) act.append(a); // strings become text nodes (the breadcrumb's " ")
  note.replaceChildren(man, rec, act);
  syncTailTrigger(); // §18.3: content-dependent trigger visibility lives HERE, not in the rebuild wiring
}
function updateTiles() {
  const wl = appWorkload(S);
  tailReset();
  clearHeroCalc(); // every terminal path starts with no calculation; only the computed path writes one
  const curM = MODELS.find(x => x.id === $("model-preset").value);
  const curP = PERSPECTIVES.find(x => x.id === $("persp-preset").value);
  const heroLabel = document.querySelector(".tile-hero .tile-label");
  if (heroLabel) heroLabel.childNodes[0].textContent = (curM && curM.scenario) ? "Scenario result (tariff-only preset) " : "Serving margin — not a company gross margin ";
  if (curM && curP && pairingSeverity(curM, curP) === "hard" && !FORCE_EXPLORATORY) {
    renderFleetRenderableChip(null);
    $("out-margin").textContent = "n/a"; $("out-margin-status").textContent = "";
    $("out-margin").title = ""; // Astra round 2 F7: no previous scenario's unrounded percentage may survive in the tooltip
    TAIL.mandatory = "INCOMPATIBLE PAIR — this perspective is scoped to a different provider; no headline is computed. ";
    const btn = document.createElement("button");
    btn.className = "ghost-btn"; btn.textContent = "Compute anyway (exploratory)";
    btn.onclick = () => { FORCE_EXPLORATORY = true; renderAll(); };
    TAIL.actions.push(btn);
    $("out-cost").textContent = "—"; $("out-price").textContent = "—";
    $("out-cost-out").textContent = "—"; $("out-cost-in").textContent = "";
    /* §18.1 P0-1 + §18.10 P0-d, the leg's ONE declared behavioral delta: the early return used
       to leave whatever a previous state wrote in the disclosure and the feasibility PAIR —
       stale receipts rendering under an "n/a — no headline is computed" tile. The pair clears
       AS A PAIR: the tile never shows a value whose receipt was removed, or vice versa. */
    { const un = document.getElementById("out-margin-unanchored"); if (un) un.textContent = ""; }
    { const fv = document.getElementById("out-feas"); if (fv) fv.textContent = "—"; }
    { const fn = document.getElementById("out-feas-note"); if (fn) fn.textContent = ""; }
    commitTail();
    return;
  }
  if (curM && curP && pairingSeverity(curM, curP) === "hard" && FORCE_EXPLORATORY) {
    // fall through but tag everything exploratory below
  }
  renderFleetRenderableChip(wl);
  if (!isFinite(wl.margin)) {
    $("out-margin").textContent = "—"; $("out-margin-status").textContent = "";
    $("out-margin").title = "";
    TAIL.mandatory = "DECLARED FLEET INFEASIBLE — zero declared fleet legs are renderable at the declared serving topology; no numeric result is synthesized.";
    $("out-cost").textContent = "—"; $("out-price").textContent = "—";
    $("out-cost-out").textContent = "—"; $("out-cost-in").textContent = "";
    const pn = document.getElementById("out-price-note"); if (pn) pn.textContent = "";
    const un = document.getElementById("out-margin-unanchored"); if (un) un.textContent = "";
    renderFeasibilityTile(appFeasibility(S)); // §18.1: this branch is mandatory + FEASIBILITY receipts — the pair repopulates here
    commitTail();
    return;
  }
  /* R2 (§1.2 gate-6 wiring; assembly-notes R-4b) as amended by R3 (memo D-3a): the
     landing-hero decision — the ONE LANDING_HERO_MODE consultation site (the mode now
     rides INTO the engine predicate via appLandingHeroSuppressed, so BOTH branches
     route through this single suppression check: policy-labeled mode suppresses only
     on empty derived membership; strict mode on any exclusion). Suppression can only
     fire on the clean central default (any edit = a scenario surface). */
  const heroSuppressedNow = appLandingHeroSuppressed();
  if (heroSuppressedNow) {
    renderSuppressedHero(wl);
    return;
  }
  // Hero shows whole-point ≈ values (conditional scenario outputs manufacture no tenths of
  // epistemic precision); the unrounded diagnostic stays inspectable via the title attribute.
  // R3 (D-3b, pinned value-token grammar): the identity is welded INTO the single value
  // node — the shareable unit alone carries the policy-labeled qualifier (screenshot-crop
  // bar); central-eligible states (structurally impossible for closed models) drop it.
  /* bq-1141 M2 (GPT Pro 09-12 finding 1, accepted): the token is still minted as ONE string with the
     identity welded to the number, and split only at the last step — number into the value node, the
     identity into #out-margin-status directly beneath it, a normal-sized status label inside the same
     tile. A crop of the number takes the label with it; a 48 px qualifier over three lines it did not. */
  { const [v, st] = splitToken(isFinite(wl.margin)
    ? "≈" + Math.round(wl.margin * 100) + "%" + (appLandingCentralEligible() ? ""
      : (FLEETS[FLEET_ID] && FLEETS[FLEET_ID].class === "counterfactual")
        ? " — counterfactual, policy-labeled scenario" /* C-4: BOTH load-bearing identities in the ONE token (crop bar) */
        : " — policy-labeled scenario")
    : "—");
    $("out-margin").textContent = v;
    $("out-margin-status").textContent = st; }
  $("out-margin").title = isFinite(wl.margin) ? "unrounded: " + (wl.margin * 100).toFixed(2)
    + "% (conditional scenario output; declared section triples propagate through the band below when present; other input uncertainty is not propagated)" : "";
  // Bands are descriptive of cited ranges, never attributed to a named analyst (reception audits:
  // a page-computed state is not a person's estimate). Interval-aware (P0-5): "within the cited
  // 90–95%" is asserted ONLY when the value actually sits in [90,95]; above 95 the value is
  // OUTSIDE that cited interval and says so (still the open ≥90% bucket).
  { const pct = wl.margin * 100;
    TAIL.mandatory = pct > 95 ? "above the cited 90–95% unit-serving claim interval (≥90% bucket); this value is calculator-generated" : pct >= 90 ? "within the cited 90–95% unit-serving claim range; this value is calculator-generated" : pct >= 80 ? "within the cited >80% unit-serving claim range; this value is calculator-generated" : pct >= 50 ? "between the cited bull and reported-margin ranges; calculator-generated" : "at or below the cited reported-margin range; calculator-generated"; }
  // Custom model: the "within the cited … claim range" framing never applies to a user-defined scratch
  // model — replace it with a persistent unsourced marker naming the inherited lens/fleet.
  if (curM && curM.id === "custom") {
    const idc = computeIdentity();
    TAIL.mandatory = "USER-DEFINED SCENARIO — Custom is a scratch model with no provider and no sourced parameters; this ≈" + Math.round(wl.margin * 100) + "% is not a provider estimate and is not compared to any cited claim range. It " + (idc.isModified ? "is edited" : "inherits the " + idc.lensName + " scenario preset + the model-default hardware blend") + ".";
  }
  // R3 (memo D-3b — replaces the R2 Option-B suppression-coupled block, closing the
  // latent regression: once the filtered default is policy-clean, heroSuppressedNow
  // goes false and a suppression-gated identity would silently vanish): the
  // policy-labeled identity is decided by the constructor's refusals, INDEPENDENT of
  // suppression — UNCONDITIONAL on the clean flagship default. The exclusion clause
  // (ONE shared formatter, membershipExclusionClause) welds inline; capped-leg welds
  // fire only when the CURRENT state has policy-unclean legs (user-chosen blends).
  if (isLandingClean() && !appLandingCentralEligible()) {
    const unclean = ((wl.fleetRenderable && wl.fleetRenderable.legStatuses) || []).filter(l => !l.renderableUnderPolicy);
    const memb = appDefaultMembership();
    TAIL.mandatory = "POLICY-LABELED SCENARIO OUTPUT — a scenario calculation, not a verified or central estimate (actual deployment unverified; this number can never carry a central identity). "
      + (memb ? membershipExclusionClause(memb) + " " : "")
      + (unclean.length ? unclean.map(l => (HW[l.hwKey] ? HW[l.hwKey].name : l.hwKey) + " — " + l.note).join("; ") + ". " : "")
      + TAIL.mandatory;
  }
  // Preset-owned field deviation (crafted permalink or an edited clean lens): flag MODIFIED even when the
  // PERSPECTIVE identity is clean (median/gptpro/replay) but the FIELDS were overridden — closes the
  // ≈99%-under-"Central-scenario" crafted-permalink vector. (Synthetic modified/exploration states already
  // carry their own MODIFIED prefix below; Custom carries its own marker above.)
  if (curM && curM.id !== "custom" && curP && !MODIFIED_FROM && !EXPLORATION_ORIGIN && curP.kind !== "exploration" && !presetIsClean()) {
    const oob = craftedFields();
    TAIL.mandatory = "MODIFIED — fields deviate from the “" + curP.name.replace(/^\[[^\]]*\]\s*/, "") + "” preset default"
      + (oob.length ? "; CRAFTED (values outside the visible slider range: " + oob.join(", ") + ")" : "")
      + ", NOT the clean central scenario. " + TAIL.mandatory;
  }
  if (curP && curP.kind === "analyst") TAIL.mandatory = "SITE-AUTHORED RECONSTRUCTION SCENARIO — not a source estimate. " + TAIL.mandatory;
  // Slice C (memo C-4): a NON-default named-fleet selection leads with its identity +
  // class; the full attribution chain lives in the switcher disclosure + receipts.
  if (isNamedFleetId(FLEET_ID) && FLEET_ID !== DEFAULT_FLEET_ID)
    TAIL.mandatory = "NAMED FLEET SCENARIO — “" + FLEETS[FLEET_ID].name + "” (" + FLEETS[FLEET_ID].class
      + (FLEETS[FLEET_ID].class === "counterfactual" ? "; never a default — comparison only" : "") + "). "
      + TAIL.mandatory;
  if (MODIFIED_FROM) TAIL.mandatory = "MODIFIED SCENARIO (derived from " + MODIFIED_FROM + ") — not the published operating point; replay attribution removed. " + TAIL.mandatory;
  if (curM && curM.scenario) TAIL.mandatory = "TARIFF SCENARIO — architecture unidentified; this borrows the selected serving assumptions and is NOT a provider estimate. " + TAIL.mandatory;
  /* im-vet-model-estimates (2026-09-19), Polaris gen60 ruling under owner note
     note-20260919T142116Z-6b5c83. A row whose architecture IS identified but whose fleet this page
     documents as owned or domestic-Chinese cannot be read as a provider claim through the shared
     rent lens at 50% utilization: that pairing is what drove grok to -0.7% against its own replay's
     +63.2%, and glm47 to -39.3%. The label is only for the LENS view — a replay of the provider's
     own published operating point keeps its own identity and states it above. */
  if (curM && curM.lensScenario && !(curP && curP.kind === "replay"))
    /* The two sentences are written out WHOLE rather than composed from a shared stem: the MCP's
       APPJS_MIRROR grep-parity gate requires each mirrored sentence to exist byte-identical in this
       file, and a concatenation splits the sentence into fragments it cannot find. */
    TAIL.mandatory = (curM.lensScenarioNoReplay
      ? "LENS SCENARIO — a rented-capacity planning lens at this page's utilization, applied to a fleet this page documents as owned or domestic. NOT a provider claim; this row has no published replay, so it has no provider claim at all — scenario only. "
      : "LENS SCENARIO — a rented-capacity planning lens at this page's utilization, applied to a fleet this page documents as owned or domestic. NOT a provider claim; the provider claim for this row is its §10 replay. ") + TAIL.mandatory;
  if (curM && curP && pairingSeverity(curM, curP) === "hard" && FORCE_EXPLORATORY) TAIL.mandatory = "⚠ EXPLORATORY (forced incompatible pairing) — " + TAIL.mandatory;
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
    // R3 (memo D-2e): the FULL integrity surface — the range NOUN and the
    // inside/OUTSIDE boolean — anchors to the typed authoredRange (fixed authorship
    // metadata, the shared half-open algebra), NEVER to the computed bucket (which
    // remains board-grouping truth only). Rebinding only the boolean would
    // self-contradict ("route to the 60–80% range … lands OUTSIDE" at 79.58 —
    // the R3-review executed failure mode).
    const arLabel = authoredRangeLabel(curP);
    const curPct = wl.margin * 100;
    const trNow = resolvedTraffic();
    /* b9 M5: a route's AUTHORED-RANGE verdict is a claim about its own construction — the
       procurement, utilization and stack vector it declares. The algorithmic-lead prior and the
       family multipliers are an orthogonal scenario layer (plan §6.7), and letting them decide
       whether a route "reached" its band would credit the construction for something it did not
       do: at the ratified +3 prior the ≥90 route clears 90 without a single one of its own
       assumptions changing. The verdict therefore evaluates the SAME construction at the
       public-evidence reference — the state the route's board bucket and the final-answer surface
       are pinned to — while the live reading, prior included, is stated alongside it. */
    let refPct = curPct;
    {
      const refState = pinReferenceLevers(structuredClone(S));
      try { refPct = workload(refState, undefined, appEngineContext(curM, trNow, refState)).margin * 100; }
      catch { refPct = curPct; }
    }
    const leversLive = Math.abs(refPct - curPct) > 1e-9;
    const inR = withinAuthoredRange(curP, refPct) === true;
    const off = explorationOffScope(curM, trNow);
    TAIL.mandatory = "RANGE EXPLORATION — page-authored counterfactual; not an estimate. A page-authored reconstruction of one route to the " + (arLabel || "claimed") + " range (authored at the flagship scope: Claude Opus 4.x @ Reference 15:1/60%), not any claimant's model."
      + (off ? " VIEWED OFF AUTHORED SCOPE — currently " + curM.name + " · " + (trNow ? trNow.ioRatio + ":1/" + trNow.cacheHit + "%" : "?") + "; range membership was defined at the flagship scope and is recomputed live here." : "")
      + (isFinite(curPct) ? " At the current selection it lands at ≈" + Math.round(curPct) + "%"
          + (leversLive ? " with the broad levers live (algorithmic-lead prior and family multipliers); the route's own construction at the public-evidence reference computes ≈" + Math.round(refPct) + "%" : "")
          + " — " + (inR ? "inside" : "OUTSIDE") + " the range it was authored for." : "")
      + " " + TAIL.mandatory;
  }
  if (EXPLORATION_ORIGIN) TAIL.mandatory = "MODIFIED RANGE EXPLORATION — derived from the page-authored route “" + EXPLORATION_ORIGIN.subtitle + "” but since edited; route identity and ranking metadata removed; not an estimate. " + TAIL.mandatory;
  {
    const m = curM;
    const p = curP;
    if (m && p && p.id === "dive" && m.diveMetric === "output")
      TAIL.receipts.push(`OUTPUT-TOKEN margin (the §10 metric): ${fmtPct(1 - wl.cOut / S.priceOut)}`);
  }
  const lr = lensRangeForCurrentModel();
  if (lr && !lr.single) {
    const memNote = lensSpanMembershipNote(lr);
    TAIL.receipts.push(`scenario-preset span at ${lr.label}: ${lr.lo < -1 ? "<−100%" : fmtPct(lr.lo)}–${fmtPct(lr.hi)} across ${lr.n} lenses (traffic held fixed; excludes traffic-mix uncertainty; analysts, replays and out-of-scope lenses excluded)` + (memNote ? ` — ${memNote}` : ""));
  }
  else if (lr && lr.single) TAIL.receipts.push(`only one scenario preset is compatible at this scope (${fmtPct(lr.lo)}) — see the valuation replays for the invoice question`);
  // R2 (§1.6): the hero's own three-point policy-sensitivity receipt, in this surface's
  // units (blend margin, %) — SAMPLED, argMin/argMax computed, no continuity implied.
  TAIL.receipts.push(policyBandReceiptText(heroPolicyBand(), "%"));
  if (EXPLORATION_ORIGIN) TAIL.actions.push(" ", explorationRestoreBtn()); // one-click restore (P0-5 breadcrumb) — trailing MANDATORY action, never a receipt
  $("out-cost").textContent = fmt$(wl.costMix);
  $("out-price").textContent = fmt$(wl.priceMix);
  { const pn = document.getElementById("out-price-note");
    if (pn) pn.textContent = (S.cacheHit > 0 && (S.cacheWriteShare || 0) === 0) ? "cache reads are modeled, but cache-write billing is 0% — effective price may be incomplete" : ""; }
  renderHeroCalc(wl); // bq-2345: the operands and the division on the face, from the same state
  $("out-cost-out").textContent = fmt$(wl.cOut);
  $("out-cost-in").textContent = "fresh input: " + fmt$(wl.cIn) + " · cache read: " + fmt$(wl.cCache);
  { const w = blendWeights(S);
    const unfitted = ["tpu7", "trn2", "trn3"].reduce((a, k) => a + (w[k] || 0), 0);
    const gb300 = w.gb300 || 0;
    const un = document.getElementById("out-margin-unanchored");
    if (un) {
      const parts = [];
      if (unfitted > 0) parts.push(Math.round(unfitted * 100) + "% on TPU/Trainium (TPU v7 & Trainium2 have public serving anchors in the operating-point registry; Trainium3 remains analyst-declared)");
      if (gb300 > 0) {
        const basis = (S.hwMode === "tco")
          ? "analyst-estimated capex/TCO (no public GB300 purchase price)"
          : "an analyst-estimated $6/GPU-hr base" + (S.rentMult && S.rentMult !== 1 ? " × the current cost multiplier" : "") + " (no public rack rate)";
        parts.push(Math.round(gb300 * 100) + "% on GB300, priced from " + basis);
      }
      un.textContent = parts.length ? "Analyst-input share of this fleet — " + parts.join("; ") + "." : "";
    } }
  renderFeasibilityTile(appFeasibility(S));
  commitTail(); // gate Q4: ONE atomic write per terminal path — this is the main-flow terminal
}

/* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): rent is a
   visible component of the headline, described as an implied spread over this modelled TCO. */
function renderRentSegment() {
  const el = $("out-rent-segment"); if (!el) return;
  el.textContent = "";
  let current;
  try { current = appWorkload(S); } catch { current = null; }
  if (current && current.procurementBasis === "owned-strategic-tco") {
    el.textContent = "Owned/TCO basis — no rent in this cost.";
    return;
  }
  let spread;
  try { spread = appBlendedLessorSpread(S); } catch { spread = null; }
  if (!spread || !isFinite(spread.rentCostPerMtok) || !isFinite(spread.tcoCostPerMtok)) {
    el.textContent = "Rental-inclusive basis — no numeric rent/TCO comparison is available for this fleet.";
    return;
  }
  const delta = spread.rentCostPerMtok - spread.tcoCostPerMtok;
  /* im-arc T1 fix (Sol review 2026-08-22, finding P1-1): a negative spread is a
     different claim, not a zero lessor cut. Its bar is the one rental-basis total. */
  if (delta < 0) {
    el.append(document.createTextNode(rentSegmentText(spread, fmt$)));
    const bar = mkEl("div", "rent-bar"); bar.setAttribute("role", "img");
    bar.setAttribute("aria-label", "Reader-stated rent is below modelled TCO; the single full-width bar represents the rental-basis total");
    bar.appendChild(mkEl("span", "rent-bar-tco"));
    el.appendChild(bar);
    return;
  }
  const cut = Math.max(0, delta);
  const share = spread.rentCostPerMtok > 0 ? Math.max(0, Math.min(1, cut / spread.rentCostPerMtok)) : 0;
  el.append(document.createTextNode(rentSegmentText(spread, fmt$)));
  const bar = mkEl("div", "rent-bar"); bar.setAttribute("role", "img");
  bar.setAttribute("aria-label", "Owned TCO and implied lessor cut segments; implied rent share " + Math.round(share * 100) + " percent");
  bar.append(mkEl("span", "rent-bar-tco"), mkEl("span", "rent-bar-cut rent-share-" + Math.round(share * 10)));
  el.appendChild(bar);
}

function renderBasisCounterpart() {
  const value = $("out-margin-owned"), label = $("out-owned-label"), note = $("out-owned-note"), bandEl = $("out-owned-band");
  if (!value || !label || !note || !bandEl) return;
  let current;
  try { current = appWorkload(S); } catch { current = null; }
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-1): explicit sections
     outrank the global lens when choosing the actual counterpart direction. */
  const bases = current && Array.isArray(current.composition)
    ? current.composition.map(row => row.basis) : [];
  const allOwned = bases.length > 0 && bases.every(basis => basis === "owned-strategic-tco");
  const allRented = bases.length > 0 && bases.every(basis => basis !== "owned-strategic-tco");
  const basis = allOwned ? "rent" : allRented ? "tco" : (S.hwMode === "rent" ? "tco" : "rent");
  const rentReceipt = appRentReceipt(S);
  label.textContent = basis === "tco"
    ? "If ALL sections were owned (TCO basis)"
    : "If ALL sections were rented (" + rentSourceLabel(S, rentReceipt).toLowerCase() + ")";
  let result, spread;
  try { result = appMarginOnBasis(S, basis); spread = appBlendedLessorSpread(S); }
  catch { result = null; spread = null; }
  value.textContent = result && isFinite(result.margin) ? "≈" + Math.round(result.margin * 100) + "%" : "—";
  const ratio = spread && isFinite(spread.ratio) ? spread.ratio.toFixed(1) + "×" : "not numerically available";
  note.textContent = basis === "tco"
    ? "Same model, traffic and fleet, priced at this page's TCO build-up (electricity $/kWh, PUE, capex, life, DC $/W, opex) instead of rent — the gap to the card above is the implied spread over modelled TCO, " + ratio + "."
    : rentCounterpartNote(S, ratio, rentReceipt);
  bandEl.hidden = true; bandEl.textContent = "";
  let selectedWidth = -1;
  const activeFleet = appActiveCustomFleet(S);
  if (activeFleet) {
    let sectionResult = null;
    try { sectionResult = sectionBand(S, { customFleet: activeFleet }, {
      cornerEval: (state, opts) => marginOnBasis(state, basis, opts).margin,
    }); } catch { sectionResult = null; }
    const cell = sectionBandCell(sectionResult, value => "≈" + Math.round(value * 100) + "%");
    if (cell) {
      bandEl.appendChild(cell); bandEl.hidden = false;
      selectedWidth = sectionResult.hi - sectionResult.lo;
    }
  }
  const m = currentModel(), p = currentPersp();
  const dials = dialsFromRanges(S.dialRanges);
  if (!m || !p || !dials.length) return;
  /* im-arc T1 fix (Sol review 2026-08-22, finding P1-2): this card promises the
     selected span, so it renders the compounded corner box or stays hidden on refusal. */
  let band;
  try {
    const counterpartFleet = activeFleet
      ? counterpartFleetOnBasis(S, basis, { customFleet: activeFleet }) : null;
    band = marginBand(m, p, currentTrafficSel(), dials, {
      base: { ...S, hwMode: basis },
      ...(counterpartFleet ? { renderOpts: { customFleet: counterpartFleet } } : {}),
    });
  }
  catch { band = null; }
  if (!band || band.refused || !isFinite(band.lo) || !isFinite(band.hi)) return;
  /* Section bands are fractions; dial bands are percentage points. The tile
     presents whichever declared mechanism is wider, never a narrower range
     selected for appearance. Full detail remains in the advanced/table surfaces. */
  if ((band.hi - band.lo) / 100 >= selectedWidth) {
    bandEl.textContent = counterpartBandText(band);
    bandEl.hidden = false;
  }
}
/* ================= b9 M6 (FA memo §6.1 D-6h): BYTE-NEUTRAL display segmentation =================
   The justification tokens already carry their own internal separators, so the renderer splits on
   those PINNED boundaries into labeled paragraphs instead of inventing new prose. The split must be
   byte-neutral: rejoining the rendered segments with the same separators reproduces the token
   byte-for-byte, and the suite asserts the STRUCTURE too (exactly four separators, exactly five
   parts, each with its pinned label) — rejoin-equality alone is tautological, since
   split(sep).join(sep) always reconstructs. The token bag the vocabulary sweep and the MCP twin
   byte-inclusion list consume is UNCHANGED: this is display only. */
const FA_SEGMENT_SEPARATORS = [
  { label: "What it claims", seps: [" · What it claims: "] },
  { label: "What it does not claim", seps: [" · What it does not claim: ", " · Not claimed: "] },
  { label: "Why the conservative case differs", seps: [" · Why the conservative case differs: "] },
  { label: "What would flip it", seps: [" · What would flip it: "] },
];
function segmentJustification(txt) {
  const parts = [];
  let rest = txt, usedSeps = [];
  for (const spec of FA_SEGMENT_SEPARATORS) {
    let hit = null, at = -1;
    for (const sep of spec.seps) { const i = rest.indexOf(sep); if (i !== -1 && (at === -1 || i < at)) { at = i; hit = sep; } }
    if (hit === null) return null; // a token that does not carry the pinned shape is a FAILURE, not a fallback
    parts.push({ label: parts.length === 0 ? null : FA_SEGMENT_SEPARATORS[parts.length - 1].label, body: rest.slice(0, at) });
    usedSeps.push(hit);
    rest = rest.slice(at + hit.length);
  }
  parts.push({ label: FA_SEGMENT_SEPARATORS[FA_SEGMENT_SEPARATORS.length - 1].label, body: rest });
  return { parts, seps: usedSeps,
    rejoin() { return parts.map(x => x.body).reduce((acc, b, i) => i === 0 ? b : acc + usedSeps[i - 1] + b, ""); } };
}
function renderSegmentedInto(el, txt) {
  const seg = segmentJustification(txt);
  el.textContent = "";
  if (!seg) { el.textContent = txt; return; }   // byte-intact fallback: never lose the token
  seg.parts.forEach((part, i) => {
    const para = document.createElement("p");
    if (i > 0) { const lab = mkEl("span", "explain-seg-label", FA_SEGMENT_SEPARATORS[i - 1].label); para.appendChild(lab); }
    para.appendChild(document.createTextNode(part.body));
    el.appendChild(para);
  });
}
/* ================= b9 M6 (§20 R-2): the explain popup =================
   Reuses the M4 <dialog> + showModal() PATTERN rather than reinventing it, with ONE deliberate
   difference the owner's ruling requires: an OPAQUE page-coloured ::backdrop, because
   `.cf-dialog::backdrop`'s rgba(0,0,0,0.45) dim is exactly the "grayed-out background" R-2 rules
   out.
   ON "one dialog element": stated precisely, because the loose phrasing was false. Exactly like
   `cfDialogShell`, the shell is BUILT ON OPEN and REMOVED ON CLOSE — a fresh element each time, not
   one long-lived node re-shown. What is guaranteed, and what the CDP suite asserts, is that AT MOST
   ONE explain dialog exists in the document at any moment: opening removes any predecessor, and
   closing removes the current one. The three triggers differ only in the id, title and payload they
   hand that shell. */
const FA_EXPLAIN_SPECS = {
  answer: { id: "fa-deeper-explanation", title: "The answer, in full" },
  higher: { id: "fa-higher-explanation", title: "Why not the higher numbers?" },
  exec:   { id: "fa-exec-explanation",  title: "What would have to be true" },
};
let FA_EXPLAIN_RETURN_FOCUS = null;

/* ================= b9 UX-A: the ONE explanation-dialog coordinator =================
   WHY THIS EXISTS. M6 built a dialog that closes through a PRIVATE closure and removes by its own
   marker (`querySelectorAll("dialog[data-fa-explain]").forEach(d => d.remove())`). That was correct
   while the FA card was the only client. UX-A adds a second client (the tooltip payload), and the
   design gate showed two uncoordinated dialog systems can leave two dialogs open, can strand a
   `returnFocus`, and — once UX-B relocates live nodes — can DELETE a relocated node along with the
   shell. So both entry points route through one owner with one idempotent close.

   `sources` is DELIBERATELY EMPTY in UX-A and the restore loop is vacuous. UX-A has no relocated
   payload: tipContent() CONSTRUCTS a fragment, it does not move a live node. The extension point
   ships now so UX-B adds the first real source plan without redesigning shell ownership — but no
   dormant relocation helper ships, and no test pretends relocation is exercised here. */
const EXPLAIN = { phase: "idle", dialog: null, sources: [], returnFocus: null, scrollY: 0, bodyOverflow: "" };

/* b9 UX-B: the PRODUCER the UX-A skeleton was waiting for. It writes NO content — it changes a
   parent — so it is not a claim sink; every figure the dialog shows was emitted and classified by
   the source surface's own registered emitter. The recovery coordinates are recorded HERE, before
   the move, because they are unrecoverable afterwards. */
function explainRelocate(node, body) {
  if (!node || !node.parentNode || !body) return false;
  const ph = document.createComment("explain-src");
  node.parentNode.insertBefore(ph, node);
  EXPLAIN.sources.push({ node, placeholder: ph, parent: node.parentNode, next: node.nextSibling });
  body.appendChild(node);
  return true;
}

/* Restore every relocated source before ANY dialog removal, in reverse order (so a child registered
   after its ancestor goes back first), best-effort: one throwing restore must not strand the rest.
   THREE routes, because with a real relocated payload "best effort" is not good enough — the first
   time this function is non-vacuous it becomes a data-loss path (design gate P0-4): the old body
   swallowed a failed replaceWith, cleared `sources`, and let closeActiveExplain() remove the dialog
   with the live node still inside it. Returns TRUE only if every source is back in the document. */
function explainRestoreSources() {
  /* b9 UX-C (memo §18.11 A-1): the restore is TRANSACTIONAL over the whole plan. With a
     multi-source payload, independent per-source restoration was a fracture factory — one
     receipt back on the page (where the coarse rule hides it at rest) while the other
     strands in the kept dialog. Three phases:
       1. PREFLIGHT every destination with NO DOM writes — any failure restores NOTHING;
       2. EXECUTE, reverse order (a child registered after its ancestor goes back first);
       3. on an execution throw, ROLL the already-restored nodes BACK into the dialog —
          and only if the rollback itself fails fall through to keep-and-mark.
     On ANY failure the COMPLETE ordered plan stays registered (never only the failures),
     so a later retry restores in the correct order and B-4's containment check has the
     full node-set to test. Returns TRUE only when every source is back in the document. */
  const plan = EXPLAIN.sources.filter(s => s && s.node);
  if (!plan.length) { EXPLAIN.sources = []; return true; }
  const canRestore = (src) => (src.placeholder && src.placeholder.parentNode)
    || (src.parent && src.parent.isConnected);
  if (!plan.every(canRestore)) return false;               // preflight failed — all-or-nothing, nothing moved
  const dlgHomes = plan.map(s => ({ src: s, home: s.node.parentNode, next: s.node.nextSibling }));
  const restored = [];
  let threw = false;
  for (let i = plan.length - 1; i >= 0; i--) {
    const src = plan[i];
    let done = false;
    try { if (src.placeholder && src.placeholder.parentNode) { src.placeholder.replaceWith(src.node); done = true; } }
    catch (err) { console.warn("explain: placeholder restore failed", err); }
    if (!done) {                       // the placeholder was lost — fall back to recorded coordinates
      try {
        if (src.parent && src.parent.isConnected) {
          src.parent.insertBefore(src.node, src.next && src.next.parentNode === src.parent ? src.next : null);
          done = true;
        }
      } catch (err) { console.warn("explain: coordinate restore failed", err); }
    }
    if (done) { try { if (src.placeholder && src.placeholder.parentNode) src.placeholder.remove(); } catch {} restored.push(src); }
    else { threw = true; break; }
  }
  if (!threw) { EXPLAIN.sources = []; return true; }
  /* execution-phase failure after partial restoration: roll successes back into the dialog */
  let rollbackClean = true;
  for (const { src, home, next } of dlgHomes) {
    if (!restored.includes(src)) continue;
    try {
      if (src.placeholder) { src.node.parentNode.insertBefore(src.placeholder, src.node); } // re-seat the marker
      home.insertBefore(src.node, next && next.parentNode === home ? next : null);
    } catch (err) { rollbackClean = false; console.warn("explain: rollback failed", err); }
  }
  if (!rollbackClean) console.error("explain: PARTIAL restoration and the rollback also failed — keep-and-mark terminal", plan);
  return false;                        // full plan stays registered either way
}

/* The single terminal close. IDEMPOTENT — every path funnels here: the X, Esc/cancel, the dialog's
   native `close` event, a direct dialog.close(), a payload-builder throw, a showModal() failure, a
   reentrant open, the pre-mutation hook, hash navigation and pagehide. */
function closeActiveExplain() {
  if (EXPLAIN.phase === "closing") return false;
  const dlg = EXPLAIN.dialog;
  if (!dlg && EXPLAIN.phase === "idle") return true;
  EXPLAIN.phase = "closing";
  const returnFocus = EXPLAIN.returnFocus, scrollY = EXPLAIN.scrollY;
  const restored = explainRestoreSources();       // sources FIRST, removal after — never the reverse
  /* b9 UX-B (design gate P0-4) as redesigned by UX-C (§18.2b/§18.10 P1-a): removal is
     CONDITIONAL on every relocated source being back in the document. On a failed restore the
     close now REPORTS the failure instead of lying about it: phase = "stranded" (not "idle"),
     the dialog and the COMPLETE source plan stay retained, and focus/scroll are NOT restored —
     the kept modal is still the user's context. Every later close attempt retries restoration
     (the plan stays registered), so the route back to idle is the retry, not a declaration. */
  if (!restored) {
    if (dlg) {
      dlg.dataset.explainStranded = "1";
      console.error("explain: a relocated source could not be restored — keeping the dialog rather than deleting page content", EXPLAIN.sources);
    }
    EXPLAIN.phase = "stranded";
    return false;
  }
  try { if (dlg && dlg.open) dlg.close(); } catch {}
  document.body.style.overflow = EXPLAIN.bodyOverflow || "";
  try { if (dlg) dlg.remove(); } catch {}
  /* Focus BEFORE the scroll authority, and with preventScroll — otherwise .focus() scrolls the
     trigger into view and silently overrides the restore (measured: 400 -> 543, a 143px drift).
     Relying on call ORDER for this is luck; preventScroll states the intent.
     Only return focus to a node still IN the document: buildControls()/buildSubControls() can have
     destroyed a generated .info trigger while the dialog was open (design gate P1-2). */
  try { if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true }); } catch {}
  /* The final word on scroll position — UNLESS a sequenced navigation intent is pending
     (§18.13 C-2): the close-path restore is the LOWEST-priority scroll authority. */
  if (!NAV_INTENT) { try { window.scrollTo({ top: scrollY, behavior: "instant" }); } catch {} }
  EXPLAIN.dialog = null; EXPLAIN.returnFocus = null; FA_EXPLAIN_RETURN_FOCUS = null;
  EXPLAIN.phase = "idle";
  /* §18.11 A-2 + §18.13 C-2 convergence tail: a successful close with pending work schedules
     the ONE dispatcher through the ONE coalescing timer — never a synchronous render inside a
     close. With nothing pending, a deferred navigation intent executes now. */
  if (PENDING_LEVEL) { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(replayPending, 30); }
  else runNavIntent();
  return true;
}

/* ============ b9 UX-C (memo §18.11 B-1/§18.12-13): pending work + navigation intents ============
   PENDING_LEVEL is a MONOTONE level (null → "render" → "full"), never downgraded by a lesser
   abort. PENDING_DOWNGRADE is the persisted continuation of an aborted identity downgrade
   ({kind, originId/originName}); every identity-transaction head clears it (the clear IS the
   invalidation — C-1). NAV_INTENT is the ONE sequenced navigation-intent slot (C-2): newest
   explicit navigation wins; a preset-only change cancels a pending load-scroll; the close
   path's scrollY restore runs only when no intent is pending. */
let PENDING_LEVEL = null;            // null | "render" | "full"
let PENDING_DOWNGRADE = null;        // null | { kind: "replay", name } | { kind: "exploration", id }
let NAV_INTENT = null;               // null | { kind: "load-scroll" } | { kind: "hash-reveal", id }
const escalatePending = (level) => {
  if (level === "full" || PENDING_LEVEL === "full") PENDING_LEVEL = "full";
  else PENDING_LEVEL = "render";
};
function clearPendingDowngrade() { PENDING_DOWNGRADE = null; }
/* Executes whatever navigation intent is pending. Runs only when rendering has converged. */
function runNavIntent() {
  const intent = NAV_INTENT; NAV_INTENT = null;
  if (!intent) return;
  if (intent.kind === "load-scroll") {
    /* q-im-tile-position (2026-08-18): the headline tile left .hero-row for the projections block,
       so the target is the TILE. ".hero-row" survives as the fallback rather than as the target —
       scrolling a reader to the supporting cost/price tiles after they asked to load an estimate
       would land them below the number they asked to see. */
    const hero = document.querySelector(".tile-hero") || document.querySelector(".hero-row");
    if (hero && hero.scrollIntoView) hero.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (intent.kind === "hash-reveal") {
    explainRevealHashTarget();
  }
}
/* THE one replay owner (B-1): the debounce timer always schedules this dispatcher. A "full"
   pending replays the aborted transaction's rendering tail — the recorded downgrade
   continuation FIRST (consumed on its own success, before the tail — C-1), then the
   identity-aware dossier dispatch applyPreset itself uses, then fullRefresh(). A "render"
   pending (or none: the ordinary debounced path) is renderAll(). renderAll() clears ONLY
   render-level pending; "full" survives everything short of its own branch completing. */
function replayPending() {
  if (PENDING_LEVEL !== "full") { renderAll(); return; }
  if (EXPLAIN.phase !== "idle" && !closeActiveExplain()) return;   // still blocked — level survives
  if (PENDING_DOWNGRADE) {
    const cont = PENDING_DOWNGRADE;                 // local record survives the downgrade's own head-clear (R6)
    if (cont.kind === "replay") downgradeReplayToModified(cont.name);
    else {
      const p = PERSPECTIVES.find(x => x.id === cont.id) || cont.persp;
      if (p) downgradeExplorationToModified(p);
    }
    if (EXPLAIN.phase !== "idle") return;           // the replayed downgrade aborted again — re-recorded, keep level
    clearPendingDowngrade();                        // consumed on success, BEFORE the tail — one-shot
  }
  const m = currentModel(), p = currentPersp();
  if (p) renderDossier(m, p); else refreshModifiedState();
  if (EXPLAIN.phase !== "idle") return;             // dossier abort re-escalates via its own guard
  PENDING_LEVEL = null;                             // cleared BEFORE fullRefresh so its renderAll can't be misread
  fullRefresh();
  if (EXPLAIN.phase === "idle") runNavIntent();
}

/* The pre-mutation hook. renderAll() is NOT the earliest mutation point: onChange(true) and
   fullRefresh() run buildControls()/buildSubControls() BEFORE it, and those clear and rebuild the
   control containers — so a dialog opened from a generated .info can outlive its own trigger.
   Called first in renderAll() AND before the container resets in both builders. */
function explainGuardBeforeMutation() {
  /* §18.11 A-2/P0-a: returns whether mutation may proceed. EVERY caller aborts on false —
     the surface stays as-is (the kept dialog is still open; the next close retries). */
  if (EXPLAIN.phase !== "idle") return closeActiveExplain();
  return true;
}

/* One guarded transaction: build the shell, build the payload, showModal(). A throw anywhere leaves
   NO orphaned shell — which is exactly what a bare `faExplainShell()` + later `sh.show()` risked. */
function explainOpen(spec, build, returnFocus) {
  if (EXPLAIN.phase !== "idle" && !closeActiveExplain()) return;   // reentrancy: A -> B is close-then-open — and a failed close ABORTS the open (§18.2b)
  EXPLAIN.phase = "opening";
  EXPLAIN.scrollY = window.scrollY;
  EXPLAIN.bodyOverflow = document.body.style.overflow || "";
  EXPLAIN.returnFocus = returnFocus || null;
  if (spec.fa) FA_EXPLAIN_RETURN_FOCUS = returnFocus || null;
  let sh = null;
  try {
    sh = explainShell(spec);
    EXPLAIN.dialog = sh.el;
    build(sh.body);
    document.body.style.overflow = "hidden";
    sh.el.showModal();
    sh.focusClose();
    EXPLAIN.phase = "open";
  } catch (err) {
    EXPLAIN.phase = "open";        // let the idempotent close run its full teardown
    closeActiveExplain();
    console.warn("explain: open failed", err);
  }
}

function explainShell(spec) {
  const dlg = document.createElement("dialog");
  dlg.id = spec.id;
  if (spec.fa) dlg.dataset.faExplain = "1";
  dlg.dataset.explainDialog = "1";
  dlg.className = "fa-explain-dialog";
  const head = document.createElement("div"); head.className = "fa-explain-head";
  const h = mkEl("h2", "fa-explain-title", spec.title);
  h.id = spec.id + "-title";
  const x = document.createElement("button");
  x.type = "button"; x.className = "fa-explain-close"; x.id = "fa-explain-close";
  x.setAttribute("aria-label", "Close"); x.textContent = "\u2715";
  head.append(h, x);
  const body = document.createElement("div"); body.className = "fa-explain-body"; body.id = "fa-explain-body";
  dlg.append(head, body);
  dlg.setAttribute("aria-labelledby", h.id);
  document.body.appendChild(dlg);
  x.onclick = closeActiveExplain;
  dlg.addEventListener("cancel", (e) => { e.preventDefault(); closeActiveExplain(); });  // Esc
  /* The native `close` event is QUEUED, not synchronous. On an A -> B open, closeActiveExplain()
     calls A.close() and B is built and shown before A's `close` task runs — an unguarded listener
     would then tear down B. Each shell therefore only answers for ITSELF. (Found by U-11: the
     cross-open probe returned zero dialogs where it must return exactly one.) */
  dlg.addEventListener("close", () => {
    if (EXPLAIN.dialog !== dlg) return;
    if (closeActiveExplain()) return;
    /* §18.12 B-4: the platform already closed this dialog, and restoration failed. Re-show
       ONLY a complete payload — every node of the registered plan contained by the retained
       dialog (a fully-rolled-back transaction). A fractured payload takes the keep-and-mark
       terminal; an incomplete explanation modal is worse than none. */
    const contained = EXPLAIN.sources.every(s => !s || !s.node || dlg.contains(s.node));
    if (contained) { try { dlg.showModal(); } catch (e) { console.error("explain: re-show failed — keep-and-mark terminal", e); } }
    else console.error("explain: fractured payload after native close — keep-and-mark, no re-show");
  });
  return { el: dlg, body, focusClose() { x.focus(); } };
}

/* Hash navigation and bfcache: a modal owning page scroll must not fight a fragment navigation, and
   a restored page must never come back mid-dialog. */
window.addEventListener("hashchange", () => { if (EXPLAIN.phase !== "idle") closeActiveExplain(); });
window.addEventListener("pagehide", () => { if (EXPLAIN.phase !== "idle") closeActiveExplain(); });
/* §18.11 A-5c: bfcache can bring a page BACK — pagehide is best-effort teardown, pageshow owns
   recovery. A persisted page restored mid-dialog (or stranded) runs a top-level close; success
   replays pending work through the close's own convergence tail, failure strands visibly. */
window.addEventListener("pageshow", (e) => { if (e.persisted && EXPLAIN.phase !== "idle") closeActiveExplain(); });


/* ---------- b9 UX-B: the document/explainer payload registry ---------- */
/* Every payload resolves its nodes LIVE, at open time (memo D-B6). A startup-captured reference
   would go stale the moment buildControls() rebuilds a panel, and hand the dialog a detached node.
   `anchor` is what the trigger is inserted BEFORE — never inside the relocated node, and never
   after the disclosure: after it, a reader who expands §10 finds the affordance 33,472 characters
   below where they started, i.e. they must first take exactly the reading path owner ruling R-2
   rejects in order to reach the thing that replaces it (design gate P0-1). */
/* bq-1141 M10 (GPT Pro 09-12 finding 9, accepted; 09-25 finding 12): fourteen-plus identical "Deeper
   explanation" buttons made a reader relearn every one. Each trigger now names its destination; the
   labels are unique by construction (one payload id, one label). */
const EXPLAIN_PROVIDER_NAMES = { openai: "OpenAI", google: "Google", xai: "xAI", deepseek: "DeepSeek", zhipu: "Zhipu", moonshot: "Moonshot" };
function explainTriggerLabel(p) {
  const m = /^report-s(\d+)$/.exec(p.id);
  if (m) return "Read section " + m[1] + " in a panel";
  if (p.id.startsWith("prov-")) return "Read the " + (EXPLAIN_PROVIDER_NAMES[p.id.slice(5)] || p.id.slice(5)) + " dossier in a panel";
  return ({ methods: "Read the methods in a panel", "board-catalog": "Open the evidence catalog",
    dossier: "Open the scenario dossier", "model-dossier": "Open the model-sizing notes",
    "model-context": "Open the model-sizing context", "front-door": "Open this range's detail",
    "tile-tails": "Open the result receipts" })[p.id] || ("Open " + p.title());
}
const EXPLAIN_PAYLOADS = (() => {
  const q = (sel) => () => document.querySelector(sel);
  const list = [];
  for (let i = 1; i <= 10; i++) {
    const n = i;
    list.push({ id: "report-s" + n, anchor: q("#rs-" + n), src: q("#rs-body-" + n), scope: "report",
      title: () => { const h = document.getElementById("s" + n); return h ? h.textContent.trim() : "Report section " + n; } });
  }
  list.push({ id: "methods", anchor: q("details.scope-note.methods-box"), src: q("details.scope-note.methods-box > ul"),
    scope: "", title: () => "Methods, assumptions and limitations" });
  for (const key of ["openai", "google", "xai", "deepseek", "zhipu", "moonshot"]) {
    list.push({ id: "prov-" + key, anchor: q("#prov-" + key), src: q("#prov-" + key + " > .prov-body"), scope: "report",
      title: () => { const t = document.querySelector("#prov-" + key + " > summary > strong"); return t ? t.textContent.trim() : "Provider dossier"; } });
  }
  /* The board payload is #board-catalog-body, NOT #board-grid: .board-note is a SIBLING of the grid
     and is the catalog's honesty label ("this grouping of claims into ranges is this page's
     organization, not the claimants'"). Relocating the grid alone would separate a label from the
     content it governs (design gate P0-3). */
  list.push({ id: "board-catalog", anchor: q("#board-catalog"), src: q("#board-catalog-body"), scope: "",
    title: () => "Evidence catalog" });
  /* Short, STABLE dialog titles. The #preset-note / model-note prose is body content, never a
     heading: as a title it is also the dialog's accessible name (design gate P1-8 tail). */
  list.push({ id: "dossier", anchor: q("#dossier"), src: q("#dossier-body"), scope: "",
    title: () => "Perspective dossier" });
  list.push({ id: "model-dossier", anchor: q("#model-dossier-card"), src: q("#model-dossier"), scope: "",
    title: () => "Model sizing & assumptions", mirrorHidden: q("#model-dossier-card") });
  list.push({ id: "model-context", anchor: q("#model-context"), src: q("#model-context-body"), scope: "",
    title: () => "Model-sizing context", mirrorHidden: q("#model-context") });
  list.push({ id: "front-door", anchor: q("#front-door-detail"), src: q("#front-door-detail"), scope: "",
    title: () => { const c = document.querySelector("#range-chips .range-chip[aria-pressed='true']"); return c ? c.textContent.trim() : "Range detail"; },
    mirrorHidden: q("#front-door-detail") });
  /* b9 UX-C (memo §18.2): the first MULTI-source payload — the hero's receipt region and the
     feasibility receipt, two nodes in two tiles, POPUP-SPLIT: mandatory labels stay inline and
     visible; ONLY receipts relocate. Anchor #out-margin-note is STABLE and never a source (only
     its .tile-receipts child moves). Title is fixed authored copy (gate Q3, §5 copy table).
     `srcs` order = document order (P0-3). `createdHidden`: the trigger is born hidden and its
     visibility is owned by syncTailTrigger() alone — never mirrorHidden (§18.10 P1-b). */
  list.push({ id: "tile-tails", anchor: q("#out-margin-note"),
    srcs: [q("#out-margin-note > .tile-receipts"), q("#out-feas-note")],
    /* `src` mirrors the FIRST source so the registry keeps UX-B's uniform payload shape —
       shipped probes iterate every entry calling p.src(); the open path checks `srcs` first. */
    src: q("#out-margin-note > .tile-receipts"),
    scope: "tile-scope", title: () => "Result receipts", createdHidden: true });
  return list;
})();

/* §18.3: the tails trigger's hidden-state derives LIVE from both sources at every commit —
   content-dependent visibility cannot live in rebuild-time wiring. Empty means genuinely
   empty (no text, no elements); a deliberately cleared pair therefore hides the trigger. */
/* q-im-tile-position (2026-08-18): the hoisted headline tile's tail collapses behind one summary
   line, and that line's own visibility is content-dependent for the same reason syncTailTrigger()'s
   is — a "there is more here" affordance that opens onto nothing is a promise the page does not
   keep. The three children inside #hero-full each hide themselves when they have nothing to say
   (a preset that states no reading; no dial bounded; no provider share bounded); when all three are
   away the collapse goes with them. Empty means genuinely empty: no text and no elements. NOTHING
   MANDATORY IS IN HERE — the gross-margin caveat, #out-margin-unanchored and #out-margin-note stay
   on the tile face, because a number may never be readable without the sentence qualifying it, and
   no existing gate enforces that here: U-23's vis() reads getClientRects(), which Chrome >=128
   still returns for closed-<details> content. Anything moved inside this element is therefore
   moved on the invariant's authority, not on a green suite's. */
function syncHeroFull() {
  const box = document.getElementById("hero-full");
  if (!box) return;
  const shown = (el) => !!el && !el.hidden && (!!el.textContent.trim() || !!el.firstElementChild);
  box.hidden = !(shown(document.getElementById("out-stated-reading"))
    || shown(document.getElementById("out-margin-band"))
    || shown(document.getElementById("out-mix-band")));
}
function syncTailTrigger() {
  { const fn = document.getElementById("out-feas-note"); if (fn) fn.classList.add("tile-receipts"); }
  const btn = document.getElementById("explain-trigger-tile-tails");
  if (!btn) return;
  const isEmpty = (el) => !el || (!el.textContent.trim() && !el.firstElementChild);
  btn.hidden = isEmpty(document.querySelector("#out-margin-note > .tile-receipts"))
            && isEmpty(document.getElementById("out-feas-note"));
}
const explainPayload = (id) => EXPLAIN_PAYLOADS.find(p => p.id === id) || null;

/* IDEMPOTENT trigger injection, re-run after every rebuild that can destroy a trigger.
   NECESSARY, not defensive: SECTION_INJECT rescues exactly three ids to #picker-holder before
   `controlsEl.textContent = ""`, so a trigger injected beside #model-dossier-card or #model-context
   is NOT rescued and dies on every buildControls() (design gate P0-2).
   Triggers are JS-injected and never static markup, so they can never enter MCP transport text —
   the Worker fetches the static page over HTTP and never runs this. */
function wireExplainTriggers() {
  for (const p of EXPLAIN_PAYLOADS) {
    const anchor = p.anchor();
    if (!anchor || !anchor.parentNode) continue;
    const tid = "explain-trigger-" + p.id;
    let btn = document.getElementById(tid);
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button"; btn.id = tid; btn.className = "explain-trigger";
      btn.dataset.explain = p.id;
      btn.setAttribute("aria-haspopup", "dialog");
      btn.textContent = explainTriggerLabel(p);
      if (p.createdHidden) btn.hidden = true; // §18.10 P1-b: born hidden — syncTailTrigger owns visibility
    }
    /* N triggers all reading "Deeper explanation" are indistinguishable in an assistive-technology
       control list, so each carries its payload's own title in its accessible name. */
    btn.setAttribute("aria-label", explainTriggerLabel(p) + ": " + p.title());
    if (btn.parentNode !== anchor.parentNode || btn.nextSibling !== anchor) anchor.parentNode.insertBefore(btn, anchor);
    if (!p.createdHidden) {
      const host = p.mirrorHidden && p.mirrorHidden();
      btn.hidden = !!(host && host.hidden);
    }
  }
  syncTailTrigger(); // §18.10 P1-b: immediately after EVERY injection, including the terminal startup rewire
  /* The flag the coarse-pointer rule keys off. R-2 replaces inline expansion on mobile by HIDING
     the disclosure control — but only once a trigger demonstrably exists. Keying the CSS on the
     media query alone would, on a JS failure, hide the control while no trigger exists and make the
     entire report body unreachable. */
  document.documentElement.dataset.explainReady = "1";
}
/* Delegated, so a trigger re-created by any rebuild is live immediately and can never be
   double-bound. The three M6 triggers keep their own exclusive wiring (they re-assign onclick on
   every renderFinalAnswer, so a second listener here would double-open). */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-explain]:not([data-fa-explain])");
  if (!b) return;
  e.preventDefault();
  openExplain(b.dataset.explain, b);
});

/* The generic payload registry. UX-A registered ONE family — the tooltips — in BUILT mode: the
   payload is CONSTRUCTED by tipContent(), never relocated. UX-B adds the RELOCATED families. */
function openExplain(payloadId, trigger) {
  if (payloadId.startsWith("tip:")) {
    const key = payloadId.slice(4);
    const t = TIPS[key]; if (!t) return;
    explainOpen({ id: "explain-tip-" + key.replace(/[^a-zA-Z0-9_-]/g, "-"), title: t.t, fa: false },
      (body) => {
        const frag = tipContent(key);
        const wrap = document.createElement("div"); wrap.className = "explain-body"; wrap.id = "explain-tip-body";
        if (frag) wrap.append(frag);
        body.appendChild(wrap);
      }, trigger);
    return;
  }
  const p = explainPayload(payloadId); if (!p) return;
  const isEmptyNode = (el) => !el || (!el.textContent.trim() && !el.firstElementChild);
  /* b9 UX-C (memo §18.2, P1-7): a MULTI-source payload probes-to-open on AT LEAST ONE source
     non-empty; inside the build callback every source is re-resolved after the predecessor
     restored — ABSENT (resolver null: a structural defect) throws and rolls back the whole
     open; DELIBERATELY EMPTY (resolved, no content) relocates anyway, keeping the
     transaction uniform (empty nodes are harmless). */
  if (p.srcs) {
    if (p.srcs.map(f => f()).every(isEmptyNode)) return;   // never open an all-empty dialog
    explainOpen({ id: "explain-" + payloadId, title: p.title(), fa: false }, (body) => {
      const wrap = document.createElement("div");
      wrap.className = "explain-body" + (p.scope ? " " + p.scope : "");
      body.appendChild(wrap);
      for (const f of p.srcs) {
        const src = f();
        if (!src) throw new Error("explain: a registered source of '" + p.id + "' is ABSENT — rolling the open back");
        explainRelocate(src, wrap);
      }
    }, trigger);
    return;
  }
  const probe = p.src();
  if (isEmptyNode(probe)) return;   // never open an empty dialog
  explainOpen({ id: "explain-" + payloadId, title: p.title(), fa: false }, (body) => {
    /* The dialog body re-establishes the payload's ANCESTOR CONTEXT. Measured, not assumed
       (research/b9-ux-survey/ancestor-css-probe.mjs): under a bare .explain-body wrapper 18
       selectors change and the loss is STRUCTURAL, not typographic — `table` renders display:block,
       the two-column .kk grid collapses, provider cards lose border/background/padding, and the
       evidence badges lose their colour. With the payload's own scope class, the round trip is
       byte-identical to in-page. */
    const wrap = document.createElement("div");
    wrap.className = "explain-body" + (p.scope ? " " + p.scope : "");
    body.appendChild(wrap);
    /* RE-RESOLVED here, not before explainOpen(): several sources are named by structural selectors
       (`#prov-openai > .prov-body`, `details.methods-box > ul`) that stop matching while an ancestor
       is relocated. By this point the predecessor has been closed and restored, so the query sees
       the page in its settled state. */
    const src = p.src() || probe;
    /* Relocation happens HERE, inside the build callback — i.e. strictly AFTER explainOpen() has
       closed and restored any predecessor. The provider triggers live inside #rs-body-10, so a
       report -> provider open would otherwise try to pull a source out of an ancestor that is still
       parented inside the old dialog (design gate P1-2). */
    explainRelocate(src, wrap);
  }, trigger);
}

/* M6 compatibility adapter — kept so the sink registry's function-anchored `final-answer` rule and
   the gate-closed CDP suite both still see the names they pin. It builds nothing itself now. */
function faExplainShell(spec) {
  /* Superseded by explainShell() + the coordinator (UX-A). M6's original body removed dialogs
     directly — `querySelectorAll("dialog[data-fa-explain]").forEach(d => d.remove())` — which
     bypassed phase transitions, focus restore, scroll cleanup and the generic dialog entirely, and
     could leave a dangling reference to a removed node. Its own native-`close` listener was also
     incomplete: it unlocked body scroll and restored position but neither returned focus nor
     removed the node, while its private close closure did all four. Both paths are now identical
     because there is only one. */
  return explainShell(spec);
}

function openFaExplain(kind, trigger) {
  const spec = FA_EXPLAIN_SPECS[kind]; if (!spec) return;
  const fa = FINAL_ANSWER_CACHE || (FINAL_ANSWER_CACHE = finalAnswer());
  /* Payload construction is UNCHANGED from M6 — the two-node must-not-be-called inventory, the
     segmentation and the exec payload all render exactly as before. Only WHO owns the shell and
     the close path changed. */
  explainOpen({ ...spec, fa: true }, (dialogBody) => {
  const sh = { body: dialogBody };
  const para = (txt, cls, id) => { const d = mkEl("div", cls || "explain-body", txt); if (id) d.id = id; sh.body.appendChild(d); return d; };
  if (kind === "answer") {
    para(fa.tokens.landingReadingLine);   // row 499: the dialog carries it too, in the same order
    para(fa.tokens.referenceReadingLine);
    para(fa.tokens.c2LabelLine);
    /* The SECOND node of the closed two-node vocabulary inventory. Trigger 1's payload is blocks
       1-5 "in full", so the disclaimer necessarily appears inside the dialog too — and the dialog
       is appended to document.body, i.e. OUTSIDE #final-answer. A single-node exemption would
       either miss this copy or false-fail on it. */
    para(fa.tokens.mustNotBeCalledLine, "explain-body", "fa-must-not-be-called-dlg");
    para(fa.tokens.convergenceLine);
    para(fa.tokens.priorReadingLine);
    /* T5 rec 5: mostPlausibleLine is NOT in this dialog any more. Trigger 1's payload is THE
       ANSWER's own blocks, and the whole point of the rec is that an external analyst hypothesis
       is not one of them. It moves to the "higher" payload below, with the evidence it ranks. */
    para(fa.tokens.identityLine);
    para(fa.tokens.bridgeLine);
    para(fa.tokens.basisDeclarationLine);
  } else if (kind === "higher") {
    para(fa.tokens.mostPlausibleLine);   // T5 rec 5: leads the evidence-ranking payload
    para(fa.tokens.higherJustificationsHeader);
    fa.tokens.higherJustificationEntries.forEach(txt => {
      const d = document.createElement("div"); d.className = "explain-body";
      renderSegmentedInto(d, txt); sh.body.appendChild(d);
    });
  } else {
    faExplainExecPayload(fa, para);
  }
  }, trigger || FA_EXPLAIN_RETURN_FOCUS);
}
/* Trigger 3's payload is the EXEC-SUMMARY surface, so it is its own function and carries its own
   emitter class in the sink registry — folding it into openFaExplain() would have classified an
   executive-summary emission as a final-answer one. */
function faExplainExecPayload(fa, para) {
  para(fa.tokens.execSummaryFrameLine);
  para(FA_EXEC_ORDERING_BASIS);
  fa.tokens.executiveSummaryRows.forEach(txt => para(txt));
}
/* R-2/R-3: the trigger is present on BOTH pointer classes (R-3 invites the duplication and one
   affordance that behaves the same on both is less surprising than two divergent ones). On coarse
   pointers it REPLACES the inline expansion (R-2's own word), so there is exactly one way in. */
function faCoarsePointer() {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
}
const FA_EXEC_ORDERING_BASIS = "Ordering basis: the owner's declared plausibility order. These rows are NOT sorted by result — reading them as a ranking by size would be reading a ranking this page did not make.";
/* R3 Row 1 (design memo D-9): the final-answer block renders from engine
   finalAnswer() ONLY — the thesis baseline (clean derived flagship default), static
   per engine data, cached per page load. Live slider state can never move these
   values; the differs-note is the only live element. Visible under BOTH hero modes. */
/* bq-1141 M2: a value token is "<number> — <identity>". The number goes to the value node; the
   identity to the status node directly under it. Both come from the SAME string, so the label can
   never describe a different number than the one above it. Pure: the writes stay at their surfaces,
   where the sink registry classifies them (hero-tile vs final-answer never alias). */
function splitToken(token) {
  const cut = token.indexOf(" \u2014 ");
  return cut < 0 ? [token, ""] : [token.slice(0, cut), token.slice(cut + 3)];
}
let FINAL_ANSWER_CACHE = null;
function renderFinalAnswer() {
  if (!document.getElementById("final-answer")) return;
  if (!FINAL_ANSWER_CACHE) FINAL_ANSWER_CACHE = finalAnswer();
  const fa = FINAL_ANSWER_CACHE;
  { const [v, st] = splitToken(fa.tokens.planningPoint); // bq-1141 M2: one token, number + status label (D-3b crop unit = the tile)
    $("fa-planning-point").textContent = v;
    $("fa-planning-status").textContent = st; }
  $("fa-subject").textContent = fa.subject;
  /* Owner annotation nbc7fc1: the title-length line above the fold. Both come from the engine and
     are minted side by side there, so the short form can never say something the full declaration
     under it does not. */
  { const el = document.getElementById("fa-subject-short"); if (el) el.textContent = fa.subjectShort; }
  $("fa-identity").textContent = fa.tokens.identityLine;
  /* b9 M6 (§2.1 D-6): the five-part surface. M5's single interim-pin line is retired; each token
     now states its OWN basis inside itself, which is what a second visible reading requires. */
  $("fa-landing-reading").textContent = fa.tokens.landingReadingLine;   // row 499: the hero the page opens on
  $("fa-reference-reading").textContent = fa.tokens.referenceReadingLine;
  $("fa-c2-label").textContent = fa.tokens.c2LabelLine;
  $("fa-must-not-be-called").textContent = fa.tokens.mustNotBeCalledLine;
  $("fa-convergence").textContent = fa.tokens.convergenceLine;
  $("fa-prior-reading").textContent = fa.tokens.priorReadingLine;
  $("fa-bridge").textContent = fa.tokens.bridgeLine;
  $("fa-basis-declaration").textContent = fa.tokens.basisDeclarationLine;
  $("fa-planning-line").textContent = fa.tokens.planningPointLine;
  /* T5 rec 5: same token, same bytes, different home — the node now lives in #fa-higher rather
     than inside #fa-full. Assigning it here (rather than in the higher-justifications block
     below) keeps ONE assignment site for every FA token, which is what the render-parity fixture
     walks; the relocation is expressed in index.html, where placement belongs. */
  $("fa-most-plausible").textContent = fa.tokens.mostPlausibleLine; // Authority-2 token (memo J-5)
  $("fa-band-line").textContent = fa.tokens.bandLine;
  $("fa-lens-span").textContent = fa.tokens.lensSpanLine || "";
  $("fa-traffic-span").textContent = fa.tokens.trafficSpanLine || "";
  $("fa-exclusion").textContent = fa.tokens.exclusionLine || "";
  $("fa-invitation").textContent = fa.tokens.invitationLine;
  $("fa-annex-link").href = "research/" + encodeURIComponent(fa.evidenceAnnexId) + ".html";
  /* FA higher-justifications subsection (memo v7 J-2): tokens render byte-intact —
     the summary shows the entry's own head segment; the body is the FULL token
     string; links come from the typed records (claim URL + registry surfaces). */
  $("fa-decomposition").textContent = fa.tokens.decompositionLine;
  $("fa-higher-header").textContent = fa.tokens.higherJustificationsHeader;
  { const wrap = $("fa-higher-entries"); wrap.textContent = "";
    const coarse = faCoarsePointer();
    fa.tokens.higherJustificationEntries.forEach((txt, i) => {
      const g = fa.higherJustifications[i];
      const head = txt.split(" \u00b7 ")[0];
      const linksP = document.createElement("div"); linksP.className = "fa-higher-links tile-delta";
      (g.links || []).filter(Boolean).forEach(u => {
        const a = document.createElement("a");
        a.href = u; a.rel = "noopener"; a.target = "_blank";
        a.textContent = /^https?:/.test(u) ? new URL(u).hostname : u;
        linksP.append(a, document.createTextNode(" "));
      });
      const loadP = faHigherLoadOps(g);
      if (coarse) {
        /* R-2: on coarse pointers the inline expansion is REPLACED by the trigger — no <details>
           is built at all, so the popup is the only route into the body. */
        const flat = document.createElement("div"); flat.className = "fa-higher-entry fa-higher-entry-flat";
        flat.append(mkEl("div", "fa-higher-entry-head", head), linksP, loadP);
        wrap.append(flat);
        return;
      }
      /* R-3/R-4: desktop KEEPS the collapse, collapsed at first paint (no `open` attribute), and
         its expansion now adopts the .explain-body type scale with the pinned segmentation. */
      const d = document.createElement("details"); d.className = "fa-higher-entry";
      const sum = document.createElement("summary");
      sum.textContent = head;
      const body = document.createElement("div"); body.className = "explain-body";
      renderSegmentedInto(body, txt);
      d.append(sum, body, linksP, loadP); wrap.append(d);
    });
  }
  renderExecSummary(fa);
  wireFaExplainTriggers();
  refreshFinalAnswerDiffers();
}
/* ================= b9 M6 (FA memo §5, D-7): the analyst-gap EXECUTIVE SUMMARY =================
   Emitter class `executive-summary` (weld-required). Four rows move exactly ONE control from the
   calculator's own default state and show what the engine then computes; the fifth names a lever
   this page cannot price on public evidence and says so instead of showing a number. Every string
   rendered here IS an engine token (one formatter, byte-identical across transports); the hrefs and
   the low-evidence affordance states come from the engine's typed row registry, never string-built
   here — which is what makes them resolvable by a node assertion (`site-links` scans literal HTML
   attributes and would never see a runtime-rendered href). */
function renderExecSummary(fa) {
  const wrap = document.getElementById("fa-exec-rows"); if (!wrap) return;
  $("fa-exec-frame").textContent = fa.tokens.execSummaryFrameLine;
  $("fa-exec-ordering-basis").textContent = FA_EXEC_ORDERING_BASIS;
  wrap.textContent = "";
  fa.tokens.executiveSummaryRows.forEach((txt, i) => {
    const row = EXEC_SUMMARY_ROWS[i];
    const box = document.createElement("div"); box.className = "fa-exec-row";
    box.dataset.rowId = row.id;
    const val = mkEl("div", "fa-exec-row-value explain-body", txt);
    box.appendChild(val);
    const a = document.createElement("a");
    a.className = "fa-exec-row-evidence"; a.href = row.href;
    a.textContent = "See the evidence \u2192";
    box.appendChild(a);
    if (row.lowEvidence) box.appendChild(lowEvidenceAffordance(row.lowEvidence));
    wrap.appendChild(box);
  });
}
/* The low-evidence affordance (owner ruling 2026-07-30; memo §16.2 A-3 as scoped by §17.4). TWO
   typed states, because the honest state of the world has two: a parameter that HAS a control
   (jump to it and focus it — spec-decode's sibling case, and the state that proves the pattern
   actually fires), and a lever with NO control yet, which says so rather than rendering a dead
   link. When the spec-decode lever leg lands, its row flips state with no new mechanism. */
function lowEvidenceAffordance(le) {
  const box = document.createElement("div"); box.className = "low-evidence";
  box.dataset.lowEvidenceState = le.state;
  if (le.state === "no-control") {
    box.textContent = LOW_EVIDENCE_COPY["no-control"](le.param);
    return box;
  }
  const b = document.createElement("button");
  b.type = "button"; b.className = "low-evidence-jump";
  b.dataset.jumpTo = le.controlKey;
  b.textContent = LOW_EVIDENCE_COPY.jump(le.param);
  b.onclick = () => {
    const row = document.querySelector('[data-param-key="' + le.controlKey + '"]');
    if (!row) return;
    /* Open every collapsed <details> ancestor FIRST. A control inside a closed section is not
       focusable (Chrome treats the subtree as content-visibility: hidden and focus() is a no-op),
       so a jump that skipped this would scroll to a section the reader still has to open — and
       would silently not focus anything. */
    for (let n = row.parentElement; n; n = n.parentElement)
      if (n.tagName === "DETAILS" && !n.open) n.open = true;
    row.scrollIntoView({ block: "center", behavior: "instant" });
    /* Focus the first control that CAN take focus. The control may legitimately be disabled — the
       scroll-lock disables every slider on touch devices by design — and focus() on a disabled
       element is a silent no-op, which would leave the reader scrolled to a row with focus still on
       <body>. The affordance never releases the lock on the reader's behalf (that is the reader's
       choice, and the lock is a deliberate feature); it takes them to the row and lands focus there
       so the row is announced and keyboard navigation continues from it. */
    /* b9 spec-decode LEVER (§6.2). The A-3 affordance says "Set your own" and jumps to the control —
       but from the default state the spec-decode control is DISABLED by the D-SD-7 gate, so the jump
       would land on something the reader cannot use.

       Two earlier fixes failed against this code. "Focus the row" alone does not work, because the
       search below reached the row's own explanation button first; and "no descendant matches the
       enabled-control predicate" is IMPOSSIBLE to satisfy without wrongly disabling that button,
       which must stay usable — it explains the very thing the reader is blocked on.

       The fix is to the SEARCH, not to the row's contents: it now means "the control this affordance
       is FOR", so it skips `.info` buttons and any disabled tick. If every value control is disabled
       the row itself is focused, and the gate why-line renders inside the same wrap with
       role="group" + aria-describedby so assistive technology announces the reason rather than
       dropping the reader into an unnamed container.

       THIS IS A SHARED AFFORDANCE — the two utilization rows use it too, and T-14's regression guard
       asserts they still focus their enabled `util` control exactly as before. */
    /* row 499: a 2/3-point BOUND handle is not "the control this affordance is for" either — it is a
       second statement about the same dial, and landing a reader on "lower bound" when they asked to
       set the value is the same miss the `.info` exclusion above already names. */
    /* Owner annotation ndadaca (2026-08-17), caught by T-14 rather than by inspection: the gate's
       own unlock button now lives inside the specDec row, and it is a `button`, is not `.info`,
       and is ENABLED under exactly the gate that disables everything else — so this search found
       it and focused it, which is the T-14 failure verbatim. It belongs with `.info` in the
       exclusion for the same reason `.info` is there: a jump affordance ROUTES you somewhere, it
       is never "the control this affordance is for". Excluded by the shared `.low-evidence-jump`
       class, so any future affordance of this shape inherits the rule instead of re-discovering
       it — and T-14's guard on the two utilization rows still asserts they focus `util` as before. */
    const valueControls = [...row.querySelectorAll("input, select, button")]
      .filter(el => !el.classList.contains("info") && !el.closest(".info") && !el.closest(".range-handles")
        && !el.classList.contains("low-evidence-jump"));
    const focusable = valueControls.find(el => !el.disabled);
    if (focusable) { focusable.focus(); return; }
    if (!row.hasAttribute("tabindex")) row.setAttribute("tabindex", "-1");
    row.focus();
  };
  box.appendChild(b);
  return box;
}
function wireFaExplainTriggers() {
  document.querySelectorAll("[data-fa-explain]").forEach(btn => {
    btn.setAttribute("aria-haspopup", "dialog");
    btn.onclick = () => { FA_EXPLAIN_RETURN_FOCUS = btn; openFaExplain(btn.dataset.faExplain, btn); };
  });
}
/* T5 rec 1 (GPT Pro 2026-07-29 §6 rank 1, BLOCKER; SV-1). This function used to read
   `!isCentralClean()`, which the recommendation named explicitly as the wrong comparison. It now
   compares the live canonical state identity against `finalAnswer().referenceState` — the
   fingerprint of the readings the block actually prints.

   Why it had to change, concretely: before row 499 the page opened on `median`, so
   `isCentralClean()` and "the reader has not moved off the opening state" were the same
   predicate. Row 499 moved the opening state to a named preset and split them — and it migrated
   the OTHER callers (central-return sync, hero suppression, gate-7 eligibility keep
   `isCentralClean()`, which is correct: those are about the central scenario itself). This one
   was missed. The visible consequence was a notice reading "The scenario currently selected
   above DIFFERS from this thesis baseline" on a page nobody had touched — an announced edit that
   had not happened, which is the same class of harm as SV-1's suppressed one and just as likely
   to be screenshotted.

   The comparison is against the PRINTED readings, not against a hard-coded pair, so the notice
   cannot drift away from the surface again: add a reading to the block and this follows. */
function faStateMatchesReference(ref) {
  const m = currentModel();
  if (!m || !ref) return false;
  /* A modification marker or an exploration origin means the reader is off every printed reading
     regardless of what the state vector happens to say. */
  if (MODIFIED_FROM || EXPLORATION_ORIGIN) return false;
  if (m.id !== ref.modelId) return false;
  /* FLEET IDENTITY FIRST, because the state vector cannot see it. A custom fleet carries its
     per-leg overrides in a SIDE REGISTRY, never in S ("Definitions live HERE, never inside the
     scenario state S" — custom-fleets.js), so a custom fleet whose blend equals the default
     blend passes every state check while an override quietly makes a leg infeasible and moves
     the margin. That was a real false negative, found by the independent review.

     Two values are accepted, and NOT by string equality on the id: `"preset"` is what a clean
     opus load actually holds — the model preset's own blend, which for this model IS the default
     fleet the readings are computed over — and the explicit default id is the same fleet named
     directly. Any OTHER named fleet, and every `cf:` id, is a fleet the block prints no reading
     for. (Checked live: a clean landing load holds `"preset"`, so comparing the id to
     DEFAULT_FLEET_ID would have fired the notice on every untouched page — the same false alarm
     this function exists to remove, reintroduced one layer down.) */
  if (!(FLEET_ID === "preset" || FLEET_ID === ref.fleetId)) return false;
  /* TOTAL-CASE identity, for the same reason and by the same shape. `TOTAL_CASE_ID` is stored,
     carries the size case's citation, and rides the permalink; any `total` edit sets it to
     "custom" and nothing ever restores it. So a state can compute the printed number while
     having lost the provenance the block's reading is cited at, and a link shared from there
     propagates that loss. "preset" is accepted for the same reason it is on the fleet — it is
     what an unbound state legitimately holds; a named case whose total differs is caught by the
     state comparison below. Only "custom" — the citation-destroyed state — is rejected. */
  if (ref.totalCaseId && !(TOTAL_CASE_ID === "preset" || TOTAL_CASE_ID === ref.totalCaseId)) return false;
  /* Resolved traffic, not the mode token — see the referenceState comment in engine.js. The key
     is rebuilt here in the SAME shape the engine minted it in; if the two ever drift the notice
     fails loud (it fires on every state) rather than silently matching everything. */
  const tr = resolvedTraffic();
  if (!tr) return false;
  if ((tr.profileId + "|" + tr.ioRatio + ":1|" + tr.cacheHit + "%") !== ref.trafficFingerprint) return false;
  /* Then the state vector, in two ways, because the block prints two KINDS of reading.
     (a) A PRESET reading — median (the ratified-prior default) or the landing preset. The live
         state qualifies when it is on one of those presets and unedited. `presetIsClean()` is
         exactly that test and is reused rather than re-implemented, so the two can never
         disagree about what "unedited" means.
     (b) The REFERENCE reading, which is not a preset at all: it is median with the reference
         lever pin applied (trend 0, family multipliers 1.0). A reader who hand-lands on it is
         sitting on a reading the block prints, so the notice has nothing to disclose — but
         `presetIsClean()` calls that state edited, which is why the previous cut fired on it.
         Rebuilt here through the engine's OWN exported pin, never by restating trend-0/family-1
         in this file, so it cannot drift from what finalAnswer() actually computed. */
  const p = currentPersp();
  if (p && ref.perspIds.includes(p.id) && presetIsClean()) return true;
  const median = PERSPECTIVES.find(x => x.id === "median");
  if (!median) return false;
  const pinned = pinReferenceLevers(applyPresetSettings(m, median, currentTrafficSel()));
  return Object.keys(pinned).every(k => JSON.stringify(S[k]) === JSON.stringify(pinned[k]));
}
function refreshFinalAnswerDiffers() {
  const el = document.getElementById("fa-differs"); if (!el) return;
  if (!FINAL_ANSWER_CACHE) FINAL_ANSWER_CACHE = finalAnswer();
  const differs = !faStateMatchesReference(FINAL_ANSWER_CACHE.referenceState);
  el.hidden = !differs;
  el.textContent = differs
    ? "The scenario currently selected above DIFFERS from this thesis baseline — the answer is computed from the clean opening scenario and never follows scenario edits."
    : "";
}
function renderAll() {
  if (!explainGuardBeforeMutation()) { escalatePending("render"); return; }   /* §18.11 P0-b: an aborted render is PENDING, not lost */
  updateTiles(); renderScenarioWindow(); renderSectionBandFace(); renderRentSegment(); renderBasisCounterpart(); renderMarginBand(); syncHeroFull(); renderIdentityStrip(); renderHwChart(); renderStackChart(); renderSensChart(); renderGenChart(); renderSubChart(); updateBoard();
  renderFormCorrectionDebt();
  renderFinalAnswer(); // static values + live differs-note (D-9)
  refreshScenarioName(); // keep the save card's auto-name tracking the state (user-typed names stick)
  if (PENDING_LEVEL === "render") PENDING_LEVEL = null; // §18.12 B-1: a complete render satisfies any pending render — and ONLY that level
}
function onChange(rebuild) {
  if (rebuild) { buildControls(); buildSubControls(); wireExplainTriggers(); }
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(replayPending, 30); // §18.12 B-1: one timer, one level-dispatching owner — never a bare renderAll
}
function fullRefresh() { buildControls(); buildSubControls(); wireExplainTriggers(); renderAll(); }

/* ---------- skin + theme ----------
   The pre-paint head script (index.html) resolves and stamps data-skin/data-theme before
   first render; these toggles just flip the attributes and persist. Presentation only —
   no engine state is touched. */
function refreshSkinToggle() {
  const b = $("skin-toggle");
  if (!b) return;
  const editorial = document.documentElement.dataset.skin === "editorial";
  b.textContent = "Skin: " + (editorial ? "Editorial" : "App");
  b.setAttribute("aria-pressed", String(editorial));
  b.title = `Switch to ${editorial ? "app" : "editorial"} visual identity — presentation only; no number changes`;
}
function refreshThemeToggle() {
  const b = $("theme-toggle");
  if (!b) return;
  const dark = document.documentElement.dataset.theme === "dark";
  b.textContent = "Theme: " + (dark ? "Dark" : "Light");
  b.setAttribute("aria-pressed", String(dark));
  b.title = `Switch to ${dark ? "light" : "dark"} theme`;
}
function syncTurnstileTheme(theme) {
  const ts = document.querySelector(".cf-turnstile");
  if (!ts) return;
  ts.dataset.theme = theme;
  if (!window.turnstile) return;
  try { window.turnstile.remove(ts); window.turnstile.render(ts, { sitekey: ts.dataset.sitekey, action: ts.dataset.action, theme }); } catch {}
}
$("theme-toggle").onclick = () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem("im_theme", root.dataset.theme); }
  catch (e) { console.warn("Theme preference not persisted (storage unavailable):", e); }
  syncTurnstileTheme(root.dataset.theme);
  refreshThemeToggle();
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
refreshThemeToggle();

/* ---------- init ---------- */
SLIDER_LOCK = loadSliderLock(); // b9 M5 §12.3: the persisted scroll-lock choice, fail-closed
fillPresetSelects();
renderBoard(); // static registry render (M3); per-state highlight rides renderAll → updateBoard
renderFrontDoor(); // range-explorer entry point above the catalog; renders route cards only — never writes the hero state
if (loadScenarioFromURL()) { fullRefresh(); } else { applyPreset(); }
renderAstraProChart(); // §10 Astra Pro estimates (bq-3351): static registry render, independent of the calculator state
window.addEventListener("resize", () => { if ((window.innerWidth < 760) !== ASTRA_PRO_CHART_NARROW) renderAstraProChart(); });
{ const b = document.getElementById("share-scenario"); if (b) b.onclick = copyScenarioLink; }
wireLoadOpLinks(); // §10/§6 "Load this operating point ↑" links (selector dissolve)
wireSetDefaultButtons(); // note-20260912T180812Z-c9eaac: "set as default" on the estimate and stress cards
wireExplainTriggers(); // b9 UX-B: the document/explainer popup routes (idempotent; re-run on rebuild)
explainRevealHashTarget(); // b9 UX-B: a deep link arriving on FIRST LOAD, not only on hashchange
/* ---------- b9 UX-B: deep links, and print ---------- */
/* THE DRAFT'S HANDLER WAS BROKEN, and executing it is what showed that
   (research/b9-ux-survey/hash-print-probe.mjs). Every in-repo deep link into the report targets
   `#sN` — site/engine.js:2067 (#s3), :2081 (#s5), the claim anchors at :3819-3856, and the ten TOC
   links — and by the §17.2 contract the <h3 id="sN"> sits OUTSIDE its <details>, precisely so the
   MCP slicers keep working. So "open every ancestor <details> of the target" opens NOTHING: the
   reader following a shipped citation lands on a heading with a collapsed body. Measured: naive
   handler -> {sectionOpen:false, bodyVisible:false}; with the sibling rule -> both true.
   Runs on initial load AND hashchange, and is registered AFTER the coordinator's own hashchange
   listener, so the order is close -> restore -> open -> scroll -> focus. */
function explainRevealHashTarget() {
  const id = decodeURIComponent((location.hash || "").slice(1));
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  for (let p = el.parentElement; p; p = p.parentElement) if (p.tagName === "DETAILS") p.open = true;
  /* NOT `nextElementSibling`: D-B2 injects the popup trigger BETWEEN the <h3> and its <details>,
     so the immediate sibling is a <button>. Two correct decisions collided here and the acceptance
     suite is what caught it — scan forward to the section wrapper, stopping at the next heading so
     one section can never open another's body. */
  for (let sib = el.nextElementSibling; sib && sib.tagName !== "H3"; sib = sib.nextElementSibling) {
    if (sib.tagName === "DETAILS" && sib.classList.contains("report-section")) { sib.open = true; break; }
  }
  /* `html { scroll-behavior: smooth }` (site/styles.css:217) would otherwise animate against us,
     and a plain focus() re-scrolls the target into view — the same silent 143px override UX-A
     already paid for once, which is why preventScroll states the intent instead of trusting order. */
  try { el.scrollIntoView({ block: "start", behavior: "instant" }); } catch { el.scrollIntoView(true); }
  try {
    if (!el.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(el.tagName)) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  } catch {}
}
window.addEventListener("hashchange", () => {
  /* §18.13 C-2: registered AFTER the coordinator's close listener, so a failed close has
     already left phase != idle — the reveal becomes the pending navigation intent (newest
     hash wins by construction: the reveal reads location.hash live at execution). The
     normal path — every close that succeeds — reveals immediately, byte-identical. */
  if (EXPLAIN.phase !== "idle") { NAV_INTENT = { kind: "hash-reveal" }; return; }
  NAV_INTENT = null;              // §18.13 C-2: the reveal executing NOW is the newest navigation — a stale load intent dies here
  explainRevealHashTarget();
});

/* Print. `display: block` does NOT reveal a closed <details>' children — executed, not assumed:
   with `display:block !important` in print media, 0 of 10 bodies render; opening all ten renders
   10 of 10. So the sections are opened for the duration of the print and the reader's own state is
   restored exactly afterwards.
   An OPEN DIALOG IS CLOSED for printing, and that is an accepted DESTRUCTIVE transition, stated
   rather than described as "state untouched": a relocated body must be back in the document before
   it can be printed at all, and suspend/resume machinery for a modal the reader is choosing to
   print past is more failure surface than the case is worth. */
let PRINT_SNAPSHOT = null;
window.addEventListener("beforeprint", () => {
  if (!closeActiveExplain()) return;             // §18.11 P1-a: failed restore — print proceeds on the current state, no snapshot
  if (PRINT_SNAPSHOT) return;                    // a repeat event must not overwrite the first snapshot
  const secs = [...document.querySelectorAll("#report > details.report-section")];
  PRINT_SNAPSHOT = secs.map(d => [d, d.open]);
  secs.forEach(d => { d.open = true; });
});
window.addEventListener("afterprint", () => {
  if (!PRINT_SNAPSHOT) return;
  PRINT_SNAPSHOT.forEach(([d, wasOpen]) => { d.open = wasOpen; });
  PRINT_SNAPSHOT = null;
});
