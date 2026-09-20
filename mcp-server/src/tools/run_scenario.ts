/* run_scenario — the mechanism-first policy-scenario calculator. Engine pipeline in the site's own order:
   applyPresetSettings → sanitizeScenarioDiff → apply clean diff → overlayDivergesFromReplay →
   workload + feasibility + lensSpan + pairingWarning/Severity.
   Honest-labeling: response-level envelope (Variant B); ONE rounded scalar in the receipt
   (value_pct_unrounded deliberately absent); status-fused value strings; replay locks honored
   (MLI-1); divergent replay edits remove attribution; custom flagged unsourced-scratch;
   lens_span non-optional; share_url minted under the truthful identity.
   Override VALUES are never logged anywhere (they may contain private negotiated rates). */
import { z } from "zod";
import { E } from "../engine.js";
import type { ModelPreset, Perspective } from "../engine-types.js";
import { APPJS_MIRROR, bandSentence, policyScenarioToolDescription } from "../labels.js";
import {
  envelope, failClosed, computationReceipt, centralForModel, centralNounAndWeld, changedFromCentralState,
  fusedHeadlineValue, fuseUnit, metricIdentityRider, mintCentralComparison, mintHeadlineResultClaim,
  policySensitivityFor, publishedShare, round, shareUrl, toTrafficSel, wireIdentitiesFor,
  type EmitMeta, type ToolId, type ToolResult,
} from "../shape.js";

export const name = "run_scenario";

export const config = {
  title: "Run a calculator scenario",
  description: policyScenarioToolDescription(
    "Computes modeled unit direct-serving contribution margin (NOT company gross margin) for a model preset under a perspective, traffic selection and optional validated overrides. Every response carries a comparison receipt; replay traffic locks are enforced, divergent edits remove replay attribution, and hard-incompatible pairings refuse unless force_exploratory is set. Quote or closely paraphrase the leading sentence; a bare number without its welded status is a misquote."),
  inputSchema: {
    model: z.string().describe("Model preset id — see list_scenario_space.models (includes 'custom', a user-defined scratch model)"),
    perspective: z.string().optional().describe("Perspective id (default 'median', the central lens) — see list_scenario_space.perspectives"),
    traffic: z.object({
      mode: z.enum(["native", "profile", "custom"]),
      profile_id: z.string().optional().describe("Required when mode='profile'"),
      io_ratio: z.number().optional().describe("Required when mode='custom'"),
      cache_hit: z.number().optional().describe("Required when mode='custom' (percent, 0–95)"),
    }).optional().describe("Traffic-mix selection; default = the model's native profile. Replays lock their traffic — selections cannot move them."),
    fleet: z.string().optional().describe("Named fleet id (see list_scenario_space.fleets) — seeds that registry fleet's blend exactly as the site switcher does (the default fleet reproduces the serve-feasibility-filtered derivation at the queried scenario; every other fleet seeds its DECLARED weights as a named scenario). Mutually exclusive with overrides.blend. Counterfactual-class fleets are explicitly labeled in the lead sentence and are never a default."),
    overrides: z.record(z.unknown()).optional().describe("State overrides validated against SCENARIO_BOUNDS (see list_scenario_space.override_bounds); invalid values are rejected, never clamped"),
    /* im-arc T4 fold (2026-08-24), memo §2.1 [F6] and §2 [F5]. `capital_recovery` has ONE canonical
       default — off — identical to the basic UI, the advanced UI and the v7 codec, so a shared link
       and an MCP request reproduce the same arithmetic. `capex_scope` is REQUIRED whenever the
       caller states a capex of their own: an observed capex is meaningless without its input scope,
       and assuming bare card silently multiplies a finished-system figure by an overhead it already
       contains. */
    capital_recovery: z.enum(["off", "on"]).optional().describe("Economic capital-recovery basis (CRF). Default 'off' — identical in the UI, the codec and here; a display tier never changes it."),
    capex_scope: z.enum(["bare-card", "base-rack", "installed-system"]).optional().describe("REQUIRED when the caller states capex (overrides.capexAbsLeg or a section capex): the INPUT SCOPE of that observation. It selects the cluster overhead; it is never assumed."),
    cost_of_capital_pct: z.number().optional().describe("Cost of capital in percent, consumed ONLY when capital_recovery is 'on'. Analyst-set 6 / 8.5 / 13."),
    force_exploratory: z.boolean().optional().describe("Required to compute a hard-incompatible model+perspective pairing; the result is labeled exploratory"),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
};

interface Args {
  capital_recovery?: "off" | "on";
  capex_scope?: "bare-card" | "base-rack" | "installed-system";
  cost_of_capital_pct?: number;
  model: string;
  perspective?: string;
  fleet?: string;
  traffic?: { mode: "native" | "profile" | "custom"; profile_id?: string; io_ratio?: number; cache_hit?: number };
  overrides?: Record<string, unknown>;
  force_exploratory?: boolean;
  /* Internal delegation only: a wrapper tool must emit under its own registered id. */
  _emitTool?: ToolId;
}

function serializeFormCorrectionDebt(raw: Record<string, any>) {
  const affected = raw.legs.filter((leg: Record<string, any>) =>
    leg.ratio !== null || leg.crossQuantityExposure || leg.replicationResidual);
  return {
    not_a_result: raw.notAResult,
    // Engine-computed at the flagship baseline (plan §0 Amendment 3 coverage form; plan §6
    // invariant 1 — never a pinned literal). Null only if the flagship state fails to resolve.
    identified_span_pct: raw.identifiedSpan
      ? {
          lo: raw.identifiedSpan.lo,
          hi: raw.identifiedSpan.hi,
          span_pp: raw.identifiedSpan.spanPp,
        }
      : null,
    identified_span_scope: raw.identifiedSpan ? raw.identifiedSpan.scope : null,
    basis: raw.identifiedSpan ? raw.identifiedSpan.basis : null,
    placement_provenance: raw.placementProvenance,
    surrogate_note: raw.surrogateNote,
    affected_legs: affected.map((leg: Record<string, any>) => ({
      hardware_key: leg.hwKey,
      representation: leg.representation,
      batch_quantity: leg.batchQuantity,
      declared_width: leg.nPhysDeclared,
      eta_held_throughput_ratio: leg.ratio,
      cross_quantity_exposure_ratio: leg.crossQuantityExposure?.ratio ?? null,
      replication_residual: leg.replicationResidual ?? null,
      warning: leg.crossQuantityNote ?? leg.note,
    })),
    warning: affected.map((leg: Record<string, any>) => leg.crossQuantityNote).filter(Boolean).join(" "),
  };
}

function provenancePayload(m: ModelPreset, p: Perspective) {
  return {
    model_provenance: {
      id: m.id, name: m.name, note: m.note,
      speculative_sizes: !!m.spec, tariff_scenario: !!m.scenario,
      unsourced_scratch: m.id === "custom", native_traffic: m.nativeTraffic,
    },
    perspective_provenance: { id: p.id, name: p.name, kind: p.kind, note: p.note },
  };
}

export function handler(args: Args): ToolResult {
  const emitTool = args._emitTool ?? "run_scenario";
  const m = E.MODELS.find((x) => x.id === args.model);
  if (!m) return failClosed(`Unknown model "${args.model}". Valid ids: ${E.MODELS.map((x) => x.id).join(", ")}.`);
  const pid = E.normalizePerspId(args.perspective ?? "median");
  const p = E.PERSPECTIVES.find((x) => x.id === pid);
  if (!p) return failClosed(`Unknown perspective "${args.perspective}". Valid ids: ${E.PERSPECTIVES.map((x) => x.id).join(", ")}.`);

  // Slice C (memo C-11): the fleet input — fail-closed, mirroring the site switcher
  // through the SAME engine functions (the chokepoint discipline: site and MCP can
  // never disagree about what a fleet selection means).
  const fleetId: string | null = typeof args.fleet === "string" ? args.fleet : null;
  if (fleetId !== null) {
    if (args.overrides && Object.prototype.hasOwnProperty.call(args.overrides, "blend"))
      return failClosed(`fleet and overrides.blend are mutually exclusive — a named fleet's blend is derivable from the registry (supply one or the other, never both).`);
    if (!Object.prototype.hasOwnProperty.call((E as any).FLEETS, fleetId))
      return failClosed(`Unknown fleet "${fleetId}". Valid ids: ${Object.keys((E as any).FLEETS).join(", ")} — see list_scenario_space.fleets.`);
    if (!((E as any).FLEETS[fleetId].models as string[]).includes(m.id))
      return failClosed(`Fleet "${fleetId}" is not defined for model "${m.id}" (its scope: ${((E as any).FLEETS[fleetId].models as string[]).join(", ")}). Fail-closed model scope — no cross-model fleet claims.`);
  }

  // traffic selection validation — fail closed, never clamp
  const t = args.traffic;
  if (t?.mode === "profile") {
    if (!t.profile_id || !E.TRAFFIC_PROFILES.some((x) => x.id === t.profile_id)) {
      return failClosed(`Unknown traffic profile "${t?.profile_id}". Valid ids: ${E.TRAFFIC_PROFILES.map((x) => x.id).join(", ")}.`);
    }
  }
  if (t?.mode === "custom") {
    const [ioLo, ioHi] = E.SCENARIO_BOUNDS.ioRatio as [number, number];
    const [chLo, chHi] = E.SCENARIO_BOUNDS.cacheHit as [number, number];
    if (typeof t.io_ratio !== "number" || !isFinite(t.io_ratio) || t.io_ratio < ioLo || t.io_ratio > ioHi ||
        typeof t.cache_hit !== "number" || !isFinite(t.cache_hit) || t.cache_hit < chLo || t.cache_hit > chHi) {
      return failClosed(`Custom traffic requires io_ratio in [${ioLo}, ${ioHi}] and cache_hit in [${chLo}, ${chHi}]; values are rejected, never clamped.`);
    }
  }
  // Narrow the validated traffic (checks above guarantee the required fields) into the
  // discriminated union toTrafficSel expects; runtime is already enforced by the validation.
  const sel = toTrafficSel(
    !t ? undefined
      : t.mode === "profile" ? { mode: "profile", profile_id: t.profile_id! }
      : t.mode === "custom" ? { mode: "custom", io_ratio: t.io_ratio!, cache_hit: t.cache_hit! }
      : { mode: "native" }
  );

  const severity = E.pairingSeverity(m, p);
  const warn = E.pairingWarning(m, p);
  const { pct: centralPct, state: centralState, fleetRenderable: centralFleetRenderable } = centralForModel(m);
  // IM3 exit-gate fix 1, verification round 2 (P1): computed once so every baseline sentence
  // below -- hard-pairing refusal, infeasible-fallback, and the closing comparison sentence --
  // carries the SAME noun+weld decision. R2 (§1.4): the baseline is minted as a COMPARISON-role
  // claim with requestCentral -- the constructor's typed refusals drive the receipt's
  // policy_scenario_* gating, the noun, and the honestly-empty comparator slot.
  const comparison = mintCentralComparison(m, centralState, centralPct, centralFleetRenderable);
  // R3 (D-3c): the central state's membership derivation rides the shared clause.
  const centralMembership = E.deriveDefaultFleetMembership(E.DEFAULT_FLEET_ID, centralState);
  const centralFormDebt = serializeFormCorrectionDebt(E.formCorrectionDebt(centralState));
  // R3 (D-3c): the QUERIED state's own membership — attached ONLY when its blend IS the
  // derived default (the same blend-equality rule as the site's appDefaultMembership;
  // an explicit caller blend is a user blend and keeps the standard clause). Invoked
  // AFTER the queried state is built (the refusal branch above never reaches it).
  const computeQueryMembership = (st: Record<string, any>) => {
    const d = E.deriveDefaultFleetMembership(E.DEFAULT_FLEET_ID, st);
    if (!d || !d.memberLegCount) return null;
    const implied: Record<string, number> = Object.fromEntries((E.HW_ORDER as string[]).map((k) => [k, 0]));
    for (const l of d.members) implied[l.hwKey] = l.declaredWeight;
    const blend = (st.blend || {}) as Record<string, number>;
    return (E.HW_ORDER as string[]).every((k) => (blend[k] || 0) === implied[k]) ? d : null;
  };
  const { nounLower: centralNounLower, nounCap: centralNounCap, weld: centralWeld } = centralNounAndWeld(centralFleetRenderable, comparison.eligible, centralMembership);
  const forced = severity === "hard" && !!args.force_exploratory;

  if (severity === "hard" && !forced) {
    const sentence =
      `${APPJS_MIRROR.incompatiblePair} ${m.name} + ${p.name}: ${warn}. ` +
      `${centralNounCap} for ${m.name} (central lens @ model-default traffic) is ${fuseUnit(centralPct)}${centralWeld}. ` +
      `Pass force_exploratory: true to compute anyway as an explicitly labeled exploratory pairing.`;
    return envelope(
      sentence,
      computationReceipt({
        centralPct, centralFleetRenderable,
        centralScope: `${m.name}'s own central lens (median perspective @ model-default native traffic)`,
        thisPct: null,
        origin: `refused: hard-incompatible pairing (${m.id} + ${p.id}); no headline computed`,
        changed: [`perspective: [lens] Central scenario (Claude) → ${p.name}`],
        comparison,
        policySensitivity: policySensitivityFor(centralState),
        policySensitivityScope: `${m.name}'s own central lens (no headline was computed for the refused pairing)`,
        membership: centralMembership,
      }),
      {
        refused: true, pairing: { severity, warning: warn || null }, ...provenancePayload(m, p),
        central_comparator: comparison.emptySlot,
        form_correction_debt: centralFormDebt,
      },
      {
        tool: emitTool,
        claim: mintHeadlineResultClaim({
          subject: `${m.id}+${p.id}@refused`,
          estimand: "modeled unit direct-serving contribution margin (refused hard-incompatible pairing)",
          scope: { model: m.id, perspective: p.id, policyPoint: "none", lens: p.id },
          pct: null,
          missing: { state: "suppressed", reason: "hard-incompatible model+perspective pairing refused without force_exploratory" },
          evidence: { refused: true },
        }),
        fleetRenderable: {
          renderableLegs: centralFleetRenderable.renderableLegs,
          totalLegs: centralFleetRenderable.totalLegs,
          renderableWeightShare: publishedShare(centralFleetRenderable.renderableWeightShare),
        },
      },
    );
  }

  // --- engine pipeline, site order ---
  const diveFallback = p.id === "dive" && !m.dive;
  const tr = E.resolveTraffic(m, p, sel);
  const base = E.applyPresetSettings(m, p, sel);
  /* b9 spec-decode LEVER ([N-CORRECTION-LIFETIME] rule 2): MCP is a SEPARATE PROCESS with no access
     to page module state, so it never owns an `activeCorrection` — it returns `corrections[]` as a
     RESPONSE-LOCAL envelope field, on both finite and infeasible responses, never dropped when
     infeasible. Distinct from `rejected_overrides`: a rejection means a value was refused, a
     correction means an accepted value was FORCED to another one, and reporting a force as a
     rejection (or not at all) would tell the caller its input was ignored when it was overridden. */
  /* im-arc T4 fold (2026-08-24), memo §2 [F5] and §2.1 [F6]: a caller-stated capex without its
     SCOPE is refused, never defaulted — a silent bare-card assumption is exactly the double count
     the fold closed. `capital_recovery` defaults to off here for the same reason it does in the UI
     and the codec: one canonical default, so the same request reproduces wherever it is rendered. */
  const t4Stated: Record<string, unknown> = {};
  {
    const bag = (args.overrides as Record<string, unknown>) ?? {};
    const statedCapex = bag.capexAbsLeg !== undefined;
    if (statedCapex && !args.capex_scope)
      return failClosed("capex_scope is REQUIRED when you state capex: name the input scope of your "
        + "observation (bare-card, base-rack or installed-system). It selects the cluster overhead and is never assumed.");
    if (args.capex_scope && !statedCapex)
      return failClosed("capex_scope was supplied without a stated capex. It describes the scope of a "
        + "capex YOU state; every registry row already carries its own.");
    if (args.capital_recovery) t4Stated.capitalRecovery = args.capital_recovery;
    if (args.cost_of_capital_pct != null) t4Stated.costOfCapitalPct = args.cost_of_capital_pct;
    if (args.capex_scope === "installed-system") t4Stated.capexScopeMode = "legacy-global";
  }
  const { diff: clean, rejected, corrections } = E.sanitizeScenarioDiff(
    Object.assign({}, (args.overrides as Record<string, unknown>) ?? {}, t4Stated), tr, base);
  const overrideKeys = Object.keys(clean).filter((k) => JSON.stringify(clean[k]) !== JSON.stringify(base[k]));
  // `base` is fresh per request and carries the engine's non-serializable roofline identity.
  // Mutating that fresh object preserves the codec's existing workload(S) call unchanged.
  const state: Record<string, any> = Object.assign(base, structuredClone(clean));
  // Slice C (memo C-11, C-1 semantics): seed the named fleet through the ONE shared
  // baseline function — default fleet -> the D-1 derivation at the queried scenario
  // (identical to the chokepoint seed on a clean query; parity-fixtured); non-default
  // -> the DECLARED registry weights AS-IS (no filtering — D-5/D-7 boundary).
  if (fleetId !== null) {
    const fb = (E as any).fleetBaselineBlend(fleetId, state, { modelId: m.id, customDonor: state.customDonor });
    if (fb) state.blend = fb;
  }
  // C-2 discipline, MCP mirror: a fleet selection under a blend-owning replay/route
  // falsifies it exactly as a blend override would — attribution removes, the share
  // link mints a modified identity (never a clean replay label over a foreign blend).
  const replayDiverges = p.kind === "replay" && !diveFallback && (E.overlayDivergesFromReplay(m, p, clean) || fleetId !== null);
  const explDiverges = p.kind === "exploration" && (overrideKeys.length > 0 || fleetId !== null);
  const trafficSelectionIgnored = !!(t && t.mode !== "native" && tr.locked);
  const trafficOverridden = overrideKeys.includes("ioRatio") || overrideKeys.includes("cacheHit");

  // Slice-3 review R7b P1 fix: state may carry a sanitized customDonor override (Object.assign
  // above already applied it for model="custom"); the context passed to workload()/feasibility()
  // must include it too, or the response silently computes with the default dsr1 donor while
  // accepting and echoing back a different one (and shareUrl()'s encodeScenario, which already
  // derives customDonor correctly from state, would then embed a margin the response disagrees with).
  const engineContext = E.makeScenarioContext(m, tr, state.customDonor, p.kind, p.id);
  const wl = E.workload(state, undefined, engineContext);
  const formDebt = serializeFormCorrectionDebt(E.formCorrectionDebt(state, engineContext));
  const pct = wl.margin * 100;
  const feas = E.feasibility(state, engineContext);
  const frQ = wl.fleetRenderable as Record<string, any>;
  const feasibility = {
    renderable_legs: feas.renderableLegs,
    total_legs: feas.totalLegs,
    /* im-release-edit-r3 (2026-09-10), fallback-review finding F3: this is the THIRD surface that
       publishes the renderable weight share, and the first pass at the ulp correction covered only
       the two on the selection receipt. Same schema bound, same one-ulp artifact, same helper. */
    renderable_weight_share: publishedShare(feas.renderableWeightShare),
    dominant_hw: E.HW[feas.domKey].name,
    dominant_op_basis: feas.dominant.opBasis,
    // R2 (§1.9): the queried fleet's EMITTED five-status vector + two-boolean contract
    // + policy identity (fail-closed aggregates; UNVERIFIED is a first-class value).
    five_status: frQ.statusVector ?? null,
    renderable_under_policy_all_legs: frQ.allLegsRenderableUnderPolicy ?? null,
    placement_verified: frQ.placementVerified ?? null,
    policy: frQ.policy ?? null,
    // R2 (§1.10): per-leg solver receipts — solved widths with objectives, declared-b
    // provenance, and the receipt welds where present.
    legs: feas.legs.map((leg: Record<string, any>) => {
      const rc = leg.capacityReceipt as Record<string, any> | null;
      return { hardware: E.HW[leg.hwKey].name, op_basis: leg.opBasis,
        declared_batch: leg.bDeclared, rendered_batch: leg.b, feasible_batch: leg.bFeas,
        renderable_under_policy: leg.renderableUnderPolicy === true,
        placement_verified: leg.placementVerified === true,
        solved_width: leg.widthRendered ?? null,
        ...(leg.reason ? { reason: leg.reason } : {}),
        ...(leg.contextWindow ? { context_window: leg.contextWindow } : {}),
        /* b9 spec-decode LEVER (§8.4/§9.5): the per-leg disclosure, CODES ONLY. A machine caller
           must not receive human copy it might display untranslated, and the codes are the stable
           contract — the browser renders the pinned bytes by calling the engine formatter at its
           own render site. `factor_applied` is the spec-decode factor ALONE, never the composed
           lever product. */
        spec_decode: leg.specDec ? {
          baseline_status: leg.specDec.status,
          factor_applied: leg.specDec.factorApplied,
          reason_code: leg.specDec.reasonCode,
        } : null,
        solver_receipt: rc ? {
          capacity_minimum_under_uniform_policy: rc.capacityMinimumUnderUniformPolicy,
          declared_operating_point_width: rc.declaredOperatingPointWidth,
          decode_representative_tokens: rc.decodeRepresentativeTokens,
          peak_kv_tokens: rc.peakKvTokens,
          peak_kv_definition: rc.peakKvDefinition,
          objective: rc.objective,
          capacity_target_objective: rc.capacityTargetObjective,
          capacity_target_batch: rc.capacityTargetBatch,
          capacity_target_batch_source: rc.capacityTargetBatchSource,
          // Backward-compatible aliases for the v1.0.0 response contract.
          // "Declared" obscured that this is the batch-rule capacity-selection
          // target, not the rendered batch; remove only in a versioned contract.
          declared_operating_point_objective: rc.capacityTargetObjective,
          b_declared: rc.capacityTargetBatch,
          b_declared_source: rc.capacityTargetBatchSource,
          deprecated_alias_note: "declared_operating_point_objective, b_declared, and b_declared_source alias the capacity_target_* fields and will be removed only in a versioned response contract",
          b_feas_at_capacity_min: rc.bFeasAtCapacityMin,
          next_smaller_width_rejection_reason: rc.nextSmallerWidthRejectionReason,
          residency_basis: rc.residencyBasis,
          placement_registry: rc.placementRegistry ? {
            id: rc.placementRegistry.id, engaged: rc.placementRegistry.engaged,
            disengaged_reasons: rc.placementRegistry.disengagedReasons,
          } : null,
          legal_set_provenance_note: rc.legalSetProvenanceNote,
          conservative_subset_note: rc.conservativeSubsetNote,
          observed_vs_analyst: rc.observedVsAnalyst,
        } : null };
    }),
    // IM3 exit-gate fix 1: delegates to engine.js's shared fleetRenderableDisclosure (primary=false --
    // run_scenario computes any model, not always the flagship default, so no hardcoded family
    // claim) so this note never drifts from the browser's own wording.
    note: E.fleetRenderableDisclosure(wl.fleetRenderable, false, computeQueryMembership(state)), // R3 D-3c: exclusion inline on the derived default
  };

  // epistemic status (mirrors the app.js state identities)
  let status: string;
  if (forced) status = "exploratory-forced-pairing";
  else if (m.id === "custom") status = "custom-scenario";
  else if (p.kind === "exploration") status = explDiverges ? "modified-range-exploration" : "range-exploration-counterfactual";
  else if (p.kind === "replay" && !diveFallback) status = replayDiverges ? "modified-scenario" : "replay";
  else if (m.scenario) status = "tariff-scenario";
  /* im-vet-model-estimates (2026-09-19), Polaris gen60 ruling. Sits AFTER the replay branch on
     purpose: a replay of the provider's own published operating point keeps its own identity and
     is the provider claim. Only the shared-lens view of these rows is a scenario. */
  else if ((m as any).lensScenario) status = "lens-scenario";
  else status = "derived-estimate";

  // receipt — the ONLY place bare margin scalars live, whole-point rounded
  const changed: string[] = [];
  if (p.id !== "median") changed.push(`perspective: [lens] Central scenario (Claude) → ${p.name}`);
  changed.push(...changedFromCentralState(centralState, state));
  const originBits = [
    p.id === "median" && !t && overrideKeys.length === 0 ? "central-default" : null,
    p.id !== "median" ? `caller-selected perspective '${p.id}' (${p.kind}${diveFallback ? ", no §10 card — median fallback" : ""})` : null,
    t ? `caller traffic selection (${t.mode}${trafficSelectionIgnored ? " — ignored, locked by replay" : ""})` : null,
    overrideKeys.length ? `caller overrides on ${overrideKeys.join(", ")}` : null,
    rejected.length ? `${rejected.length} override(s) rejected` : null,
    forced ? "force_exploratory" : null,
  ].filter(Boolean).join("; ");
  const receiptFleetSelection = fleetId !== null ? {
    id: fleetId,
    name: (E as any).FLEETS[fleetId].name,
    class: (E as any).FLEETS[fleetId].class,
    representativeness: (E as any).FLEETS[fleetId].representativeness,
    attribution: (E as any).FLEETS[fleetId].attribution,
  } : null;
  const receipt = computationReceipt({
    centralPct,
    centralFleetRenderable,
    centralScope: `${m.name}'s own central lens (median perspective @ model-default native traffic)`,
    thisPct: isFinite(pct) ? pct : null,
    origin: originBits || "central-default",
    changed,
    comparison,
    // §1.6: the QUERIED scenario's own three-point band, in this response's units.
    policySensitivity: policySensitivityFor(state, engineContext),
    policySensitivityScope: `this query (${m.id} · ${p.id} · the computed scenario state)`,
    membership: centralMembership,
  });

  if (!isFinite(pct)) {
    const contextFailure = feas.legs.find((leg: Record<string, any>) =>
      leg.contextWindow && leg.contextWindow.state === "exceeded-registered-limit");
    const noNumberReason = contextFailure && contextFailure.reason
      ? contextFailure.reason
      : "declared fleet infeasible at the selected serving topology — no numeric result";
    const sentence =
      (contextFailure
        ? `Registered context window rejected for ${m.name} under ${p.name}: ${contextFailure.reason}. `
        : `Declared fleet infeasible at the selected serving topology for ${m.name} under ${p.name}; no numeric result is computed. `) +
      (isFinite(centralPct)
        ? `${centralNounCap} for ${m.name} is ${fuseUnit(centralPct)}${centralWeld}.`
        : `The central lens for ${m.name} is also infeasible at its declared serving topology; it has no numeric result.`);
    return envelope(sentence, receipt, {
      refused: false, pairing: { severity, warning: warn || null },
      feasibility, rejected_overrides: rejected, corrections, ...provenancePayload(m, p),
      central_comparator: comparison.emptySlot,
      form_correction_debt: formDebt,
    }, {
      tool: emitTool,
      claim: mintHeadlineResultClaim({
        subject: `${m.id}+${p.id}@infeasible`,
        estimand: "modeled unit direct-serving contribution margin (declared fleet infeasible)",
        scope: { model: m.id, perspective: p.id, policyPoint: "none", lens: p.id },
        pct: null,
        missing: { state: "infeasible", reason: noNumberReason },
        evidence: { refused: false },
      }),
      fleetRenderable: {
        renderableLegs: wl.fleetRenderable.renderableLegs,
        totalLegs: wl.fleetRenderable.totalLegs,
        renderableWeightShare: publishedShare(wl.fleetRenderable.renderableWeightShare),
      },
    });
  }

  // lens span — non-optional; comparator lenses pinned to byte-identical effective traffic
  const spanRes = E.lensSpan(m, { mode: "custom", ioRatio: state.ioRatio, cacheHit: state.cacheHit });
  const trafficLabel = trafficOverridden ? `Custom ${state.ioRatio}:1 / ${state.cacheHit}% (set by overrides)` : tr.label;
  let spanText: string;
  if (!spanRes) spanText = "no compatible scenario preset at this scope";
  else if (spanRes.single) spanText = `${APPJS_MIRROR.lensSpanSinglePrefix}≈${round(spanRes.lo * 100)}%${APPJS_MIRROR.lensSpanSingleSuffix}`;
  else {
    const memNote = E.lensSpanMembershipNote(spanRes);
    spanText = `${APPJS_MIRROR.lensSpanAtPrefix}${trafficLabel}: ${spanRes.lo * 100 < -100 ? "<−100%" : "≈" + round(spanRes.lo * 100) + "%"}–≈${round(spanRes.hi * 100)}% across ${spanRes.n} lenses ${APPJS_MIRROR.lensSpanTail}` + (memNote ? ` — ${memNote}` : "");
  }
  const lens_span = {
    span: spanText,
    n_lenses: spanRes ? spanRes.n : 0,
    traffic_label: trafficLabel,
    note: "quoting the headline without its lens span is lens-shopping; the span holds traffic byte-identical across compatible scenario presets",
  };

  // exploration flagship membership (mirrors app.js hero identity)
  const rb = p.kind === "exploration" ? E.explorationComputedBucket(p) : null;
  const inRange = rb ? pct >= rb.lo && pct < rb.hi : null;
  const offScope = p.kind === "exploration"
    ? !(m.id === E.FLAGSHIP_SCOPE.modelId && state.ioRatio === 15 && state.cacheHit === 60)
    : false;

  // status sentence (label) — mirrored app.js identities
  let label: string;
  switch (status) {
    case "range-exploration-counterfactual":
      label = APPJS_MIRROR.rangeExplorationPrefix + (rb ? rb.label : "claimed") + APPJS_MIRROR.rangeExplorationSuffix
        + (offScope ? APPJS_MIRROR.viewedOffScopePrefix + m.name + " · " + state.ioRatio + ":1/" + state.cacheHit + "%" + APPJS_MIRROR.viewedOffScopeSuffix : "")
        + APPJS_MIRROR.landsAtPrefix + round(pct) + "% — " + (inRange ? "inside" : "OUTSIDE") + APPJS_MIRROR.authoredRangeSuffix;
      break;
    case "modified-range-exploration":
      label = APPJS_MIRROR.modifiedExplorationPrefix + (p.subtitle ?? p.name) + APPJS_MIRROR.modifiedExplorationSuffix;
      break;
    case "modified-scenario":
      label = `MODIFIED SCENARIO (derived from ${p.name}) ${APPJS_MIRROR.modifiedScenarioSuffix}`;
      break;
    case "replay":
      label = `Replay of a published operating point: ${p.name}. Traffic is part of the position and stays locked (${tr.label}).`;
      break;
    case "custom-scenario":
      label = `USER-DEFINED SCRATCH MODEL — ${m.note}`;
      break;
    case "tariff-scenario":
      label = APPJS_MIRROR.tariffScenario;
      break;
    case "lens-scenario":
      label = (m as any).lensScenarioNoReplay ? APPJS_MIRROR.lensScenarioNoReplay : APPJS_MIRROR.lensScenario;
      break;
    case "exploratory-forced-pairing":
      label = `${APPJS_MIRROR.forcedExploratory} ${warn}.`;
      break;
    default:
      label = `${APPJS_MIRROR.heroUnitLabel} — derived estimate under ${p.name} at ${trafficLabel}.`;
  }

  const mustCarry =
    status === "range-exploration-counterfactual" || status === "modified-range-exploration"
      ? ["page-authored counterfactual — what would have to be true; not an estimate", metricIdentityRider()]
      : status === "custom-scenario"
        ? [metricIdentityRider(), "user-defined scratch model — no provider, nothing sourced"]
        : status === "tariff-scenario"
          ? [metricIdentityRider(), "tariff scenario — architecture unidentified; not a provider estimate"]
        : status === "lens-scenario"
          ? [metricIdentityRider(), (m as any).lensScenarioNoReplay
              ? "lens scenario — rented-capacity lens on an owned or domestic fleet; NOT a provider claim, and this row has no published replay, so it has no provider claim at all"
              : "lens scenario — rented-capacity lens on an owned or domestic fleet; NOT a provider claim, the §10 replay is"]
          : status === "modified-scenario"
            ? [metricIdentityRider(), "not the published operating point; replay attribution removed"]
            : status === "replay"
              ? [metricIdentityRider(), `traffic locked by the replay (${tr.ioRatio}:1 / ${tr.cacheHit}%)`]
              : status === "exploratory-forced-pairing"
                ? [metricIdentityRider(), "forced exploratory pairing — perspective scoped to a different provider"]
                : [metricIdentityRider()];

  const headline = {
    kind: "modeled-unit-direct-serving-contribution-margin",
    epistemic_status: status,
    label,
    value: fusedHeadlineValue(pct, status, comparison.eligible),
    must_carry: mustCarry,
    cited_range_context: m.id === "custom" ? null : bandSentence(pct),
    derived_from: status === "modified-scenario" ? p.name : status === "modified-range-exploration" ? (p.subtitle ?? p.name) : null,
  };

  // share_url under the truthful identity
  let share: string;
  if (replayDiverges) {
    share = shareUrl(state, m.id, "__modified", { mode: "custom", profileId: null, ioRatio: state.ioRatio, cacheHit: state.cacheHit }, p.name, { fleet: "custom", totalCase: "custom" });
  } else if (explDiverges) {
    share = shareUrl(state, m.id, "__modified-exploration", { mode: "custom", profileId: null, ioRatio: state.ioRatio, cacheHit: state.cacheHit }, p.id, { fleet: "custom", totalCase: "custom" });
  } else if (trafficOverridden) {
    share = shareUrl(state, m.id, p.id, { mode: "custom", profileId: null, ioRatio: state.ioRatio, cacheHit: state.cacheHit }, null, wireIdentitiesFor(m, p, state, { fleetParam: fleetId, blendOverridden: overrideKeys.includes("blend"), totalOverridden: overrideKeys.includes("total") }));
  } else {
    share = shareUrl(state, m.id, p.id, { mode: tr.mode, profileId: tr.profileId, ioRatio: tr.ioRatio, cacheHit: tr.cacheHit }, null, wireIdentitiesFor(m, p, state, { fleetParam: fleetId, blendOverridden: overrideKeys.includes("blend"), totalOverridden: overrideKeys.includes("total") }));
  }

  // ---- the complete honest sentence ----
  const parts: string[] = [];
  if (status !== "derived-estimate") parts.push(label);
  if (severity === "soft" && warn) parts.push(APPJS_MIRROR.pairingNotePrefix + warn + ".");
  if (diveFallback) parts.push("(no §10 card for this model — using the evidence median instead)");
  // IM3 exit-gate fix 1, verification round 2 (P1): the QUERIED result's own renderability
  // condition, welded directly into the lead "computes to X%" sentence -- not left to a sibling
  // structured field (feasibility.note / selection_receipt) that a prose-only consumer never reads.
  // R3 (D-3c): a membership exclusion is a renormalized-membership condition — the weld
  // rides the LEAD sentence for it exactly as for a renormalized user fleet.
  // Slice C (memo C-11/C-4): the named-fleet identity leads the sentence; a
  // counterfactual-class fleet carries BOTH load-bearing labels inline (the MCP
  // crop bar — the lead-sentence contract makes this the quoted surface).
  if (fleetId !== null) {
    const ff = (E as any).FLEETS[fleetId];
    parts.push(`NAMED FLEET SCENARIO — “${ff.name}” (${ff.class}${ff.class === "counterfactual" ? "; COUNTERFACTUAL — never a default, comparison only" : ""}).`);
  }
  const queryMembership = computeQueryMembership(state);
  const queryWeld = (wl.fleetRenderable && wl.fleetRenderable.renderableWeightShare < 1)
      || (queryMembership && queryMembership.excluded.length)
    ? ` (${E.fleetRenderableDisclosure(wl.fleetRenderable, false, queryMembership)})`
    : "";
  parts.push(
    `${m.name} · ${p.name} · traffic ${trafficLabel}: the modeled unit direct-serving contribution margin computes to ` +
    `${fusedHeadlineValue(pct, status, comparison.eligible)} — ${bandSentence(pct)}${queryWeld}.`,
  );
  if (overrideKeys.length) parts.push(`Under user-specified assumptions — overridden fields vs the preset: ${overrideKeys.join(", ")}.`);
  if (rejected.length) parts.push(`⚠ ${rejected.length} override(s) failed schema or replay-integrity validation and were ignored (${rejected.join("; ")}).`);
  if (trafficSelectionIgnored) parts.push(`Requested traffic selection ignored — the replay's traffic is part of the position and stays locked (${tr.label}).`);
  parts.push(`· ${spanText}.`);
  parts.push(
    `OPEN CALIBRATION DEBT — ${formDebt.not_a_result}: ` +
    (formDebt.identified_span_pct
      ? `at the flagship baseline the legacy-form re-expression spans ` +
        `${formDebt.identified_span_pct.lo}%–${formDebt.identified_span_pct.hi}% ` +
        `(${formDebt.identified_span_pct.span_pp} pp) from declared replica width alone; `
      : `the flagship-baseline span did not resolve; `) +
    `${formDebt.warning || "the public evidence does not identify the corrected form"}.`,
  );
  parts.push(
    /* im-arc T1 fix (Sol review 2026-08-22, finding P2-1): rejected-only calls
       have no applied change and take the same no-change sentence as the clean path. */
    changed.length === 0
      ? `This IS ${centralNounLower} for ${m.name} (central lens @ model-default traffic)${centralWeld}.`
      : `${centralNounCap} for ${m.name} (central lens @ model-default traffic) is ${fuseUnit(centralPct)}${centralWeld}; this result differs via: ${changed.slice(0, 6).join("; ")}${changed.length > 6 ? "; …" : ""}.`,
  );
  const sentence = parts.join(" ");

  (receipt as Record<string, any>).fleet_selection = receiptFleetSelection; // slice C: the selection receipt names the fleet + its attribution class
  const resultClaim = mintHeadlineResultClaim({
    subject: `${m.id}+${p.id}@computed`,
    estimand: "modeled unit direct-serving contribution margin",
    scope: {
      model: m.id, perspective: p.id, lens: p.id,
      policyPoint: frQ.policy && frQ.policy.residencyBasis === "placement-registry"
        ? "placement-registry" : (frQ.policy && frQ.policy.value != null ? frQ.policy.value : "none"),
    },
    pct,
    evidence: { status, origin: originBits || "central-default" },
  });
  return envelope(sentence, receipt, {
    headline,
    central_comparator: comparison.emptySlot,
    costs: {
      blended_cost_usd_per_mtok: wl.costMix,
      realized_price_usd_per_mtok: wl.priceMix,
      decode_cost_usd_per_mtok: wl.cOut,
      fresh_prefill_cost_usd_per_mtok: wl.cIn,
      cache_read_cost_usd_per_mtok: wl.cCache,
      perimeter_note: E.TIPS.margin.b,
    },
    traffic: {
      io_ratio: state.ioRatio,
      cache_hit_pct: state.cacheHit,
      mode: tr.mode,
      locked: tr.locked,
      label: trafficLabel,
      provenance: tr.profileId ? (E.TRAFFIC_PROFILES.find((x) => x.id === tr.profileId)?.provenance ?? null) : null,
      selection_note: trafficSelectionIgnored ? `requested traffic selection ignored — locked by the replay (${tr.label})` : null,
    },
    lens_span,
    form_correction_debt: formDebt,
    feasibility,
    pairing: { severity, warning: warn || null },
    ...provenancePayload(m, p),
    rejected_overrides: rejected,
    corrections,
    share_url: share,
    share_note: APPJS_MIRROR.shareLinkWarning,
  }, {
    tool: emitTool,
    claim: resultClaim,
    fleetRenderable: {
      renderableLegs: wl.fleetRenderable.renderableLegs,
      totalLegs: wl.fleetRenderable.totalLegs,
      renderableWeightShare: publishedShare(wl.fleetRenderable.renderableWeightShare),
    },
    display: { displayed: round(pct), canonical: pct, precisionNote: round(pct) === pct ? null : `changes within displayed precision possible (canonical ${pct})` },
  });
}
