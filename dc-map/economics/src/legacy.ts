/** Structural bridge to the unchanged engine. Registries and closed enums come from the
 * supplied engine instance; this module never installs or mutates global registry rows. */
import type { ComparisonProfile, Band } from './types.js';
import type { Json } from './presentation.js';
import type { Release } from './release.js';
import { assertRelease } from './release.js';

type State = Record<string, any>;
type Preset = { id: string; name?: string; lab?: string; [key: string]: unknown };
export interface FleetRenderable {
  renderableLegs: number; totalLegs: number; renderableWeightShare: number;
  allLegsRenderableUnderPolicy?: boolean; placementVerified?: boolean;
  statusVector?: Record<string, string>;
  policy?: { residencyBasis?: string; [key: string]: unknown };
  [key: string]: unknown;
}
export interface Mix { cIn: number; cOut: number; cCache: number; costMix: number; priceMix: number; margin: number }
export interface LegacyEngine {
  ENGINE_REVISION: string; DATA_AS_OF: string; DEFAULTS_EPOCH: number | string;
  HW: Record<string, Record<string, unknown>>; HW_ORDER: string[];
  MODELS: Preset[]; PERSPECTIVES: Preset[]; TRAFFIC_PROFILES: Array<{id: string; provenance?: unknown}>;
  PROCUREMENT_BASES: string[]; SCENARIO_BOUNDS: Record<string, unknown>;
  TIPS: Record<string, Record<string, string>>; FORM_DEBT_NOT_A_RESULT: string;
  applyPresetSettings(m: Preset, p: Preset, traffic: State): State;
  resolveTraffic(m: Preset, p: Preset, selection: State): Record<string, any>;
  makeScenarioContext(m: Preset, tr: Record<string, any>, customDonor: unknown, perspKind: unknown, perspId: unknown): Record<string, any>;
  feasibility(state: State, supplied?: unknown): Record<string, any>;
  formCorrectionDebt(state: State, supplied?: unknown): Record<string, any>;
  lensSpan(m: Preset, selection: State, options?: State): Record<string, any> | null;
  lensSpanMembershipNote(span: Record<string, any>): string;
  pairingWarning(m: Preset, p: Preset): string;
  pairingSeverity(m: Preset, p: Preset): string;
  tokPerS(hw: Record<string, unknown>, state: State, phase: 'in' | 'out'): number;
  computeMix(cIn: number, cOut: number, state: State): Mix;
  workload(state: State): Mix & {fleetRenderable: FleetRenderable};
  workloadOnHw(hw: Record<string, unknown>, state: State): Mix & {fleetRenderable: FleetRenderable};
  fleetRenderableDisclosure(fr: FleetRenderable): string;
  validateFleetSections(fleet: unknown): {ok: boolean; errors?: string[]; fleet?: State};
  fleetSectionsSchema(): Record<string, unknown>;
  resolveFleetSections(state: State, options?: State): State[];
  composeSections(sections: State[]): {composition:unknown;procurementBasis:string|null;bases:unknown};
  registryRows(): Record<string, unknown>;
  composeFleetFromDcRows(state: State, options: State): State;
  blendWeights(state: State): Record<string, number>;
  familyOf(hw: Record<string, unknown>): string;
}
export interface LegacyRegistry extends Record<string, unknown> {
  DATACENTERS: Record<string, unknown>;
  validateDcRegistry(input: Record<string, unknown>): {ok: boolean; errors: string[]};
}
export interface LegacyContracts {
  leaf(metric: string, scope: Record<string, unknown>, value: number): unknown;
  tree(values: Record<string, unknown>): unknown;
  mintClaim(input: Record<string, unknown>): unknown;
}
export interface EconomicsContext {
  engine: LegacyEngine; registry: LegacyRegistry; contracts?: LegacyContracts;
  profiles?: Record<string, unknown>;
}
export function validatedAdapter(release: Release, context: EconomicsContext): Record<string, any> {
  assertRelease(release);
  if (!release.adapter) throw new TypeError('T4 adapter unavailable in this presentation-only fixture');
  const rows = release.adapter.DATACENTERS as Record<string, unknown>;
  const validated = context.registry.validateDcRegistry({ ...context.registry, DATACENTERS: rows });
  if (!validated.ok) throw new TypeError(`T4 adapter rejected by legacy validateDcRegistry: ${validated.errors.join('; ')}`);
  return rows;
}
/** The engine's own traffic-selection shape for a declared comparison profile. */
export function trafficSelection(traffic: ComparisonProfile['workload']['traffic']): State {
  return traffic.mode === 'native' ? {mode: 'native'} : traffic.mode === 'profile'
    ? {mode: 'explicit', profileId: traffic.profile_id} : {mode: 'custom', ioRatio: traffic.io_ratio, cacheHit: traffic.cache_hit};
}
export function legacyState(profile: ComparisonProfile, context: EconomicsContext): State {
  const e = context.engine;
  const m = e.MODELS.find(x => x.id === profile.workload.model_id);
  const p = e.PERSPECTIVES.find(x => x.id === profile.workload.engine_perspective_id);
  if (!m || !p) throw new TypeError('unknown registered model or engine perspective');
  if (!Object.prototype.hasOwnProperty.call(e.HW, profile.hardware_key)) throw new TypeError('unknown registered hardware key');
  if (!e.PROCUREMENT_BASES.includes(profile.procurement)) throw new TypeError('unknown registered procurement basis');
  const t = profile.workload.traffic;
  if (t.mode === 'profile' && !e.TRAFFIC_PROFILES.some(x => x.id === t.profile_id)) throw new TypeError('unknown registered traffic profile');
  if (t.mode === 'custom') {
    const [lo, hi] = e.SCENARIO_BOUNDS.ioRatio as [number, number];
    if (t.io_ratio < lo || t.io_ratio > hi) throw new TypeError('traffic io_ratio outside legacy bounds');
  }
  // applyPresetSettings mints the engine's private workload identity. Keep this object intact.
  return e.applyPresetSettings(m, p, trafficSelection(t));
}
/** The `run_scenario` response contract (mcp-server/src/tools/run_scenario.ts), reproduced from the
 * SAME engine for a site cost-pool scenario: field names and nesting mirror that tool's
 * structuredContent so U5 wires this through instead of reconciling a second envelope.
 *
 * EIGHT fields diverge from that contract's own semantics, and no others:
 *  1-5. `central_comparator`, `share_url`, `claims`, `claims_sidecar` and `site` are minted at the
 *    server's transport boundary (shape.ts `envelope()`) and stay null here rather than be invented.
 *  6. `lens_span.span` is this layer's sentence, not the APPJS_MIRROR one. Here:
 *    `at <traffic>: ≈lo%–≈hi% across N compatible cost lenses — <membership>`. run_scenario (:437):
 *    `cost-lens span at <traffic>: ≈lo%–≈hi% across N lenses (traffic held fixed; excludes
 *    traffic-mix uncertainty; analysts, replays and out-of-scope lenses excluded) — <membership>`.
 *    So the `cost-lens span` prefix and that honest-labeling tail rider are absent; the single-lens
 *    branch reads `a single compatible cost lens at ≈X%` rather than `only one cost lens is
 *    compatible at this scope (≈X%) — see the valuation replays for the invoice question`; and the
 *    `lo * 100 < -100 → "<−100%"` clamp on the low endpoint is not applied. `lens_span.note` does
 *    carry the lens-shopping warning verbatim. Those tokens live in mcp-server/src/labels.ts, which
 *    `src/` cannot import and which this layer will not copy into a third place.
 *  7. `headline.value` is this layer's status-fused margin string — `96% (modeled unit
 *    direct-serving contribution margin; <fleet-renderable disclosure>)` — not shape.ts
 *    `fusedHeadlineValue`'s weld for a non-central derived estimate: `≈96% (policy-labeled scenario
 *    output — unit serving, not company GM; not a verified or central estimate)`. Whole-point
 *    rounding is identical (`Math.round(pct)`); the `≈` and the not-verified-or-central clause are
 *    what the value token drops. That identity travels in the same envelope through
 *    `headline.epistemic_status`, `headline.must_carry[0]` and `selection_receipt.is_central: false`
 *    with its `central_ineligibility_reasons`.
 *  8. `headline.cited_range_context` is unconditionally null where run_scenario (:504) emits
 *    `bandSentence(pct)` for every non-`custom` model: the cited 90–95% interval is a company-level
 *    published claim, and this result is one site cost pool. Separately, `feasibility.note` uses the
 *    one-argument `fleetRenderableDisclosure(fr)` where run_scenario (:348) uses the three-argument
 *    membership-inclusive form. That one is inert here: the note is read off the leg-isolated
 *    single-accelerator clone, whose blend is not the derived default fleet composition (measured:
 *    7 member legs), which is exactly the condition under which run_scenario's own
 *    `computeQueryMembership` returns null. */
export interface RunScenarioEnvelope {
  sentence: string; selection_receipt: Record<string, Json>;
  headline: {kind: string; epistemic_status: string; label: string; value: string | null;
    must_carry: string[]; cited_range_context: string | null; derived_from: string | null};
  central_comparator: Json;
  costs: {blended_cost_usd_per_mtok: number; realized_price_usd_per_mtok: number; decode_cost_usd_per_mtok: number;
    fresh_prefill_cost_usd_per_mtok: number; cache_read_cost_usd_per_mtok: number; perimeter_note: string};
  traffic: {io_ratio: number; cache_hit_pct: number; mode: string; locked: boolean; label: string;
    provenance: Json; selection_note: string | null};
  lens_span: {span: string; n_lenses: number; traffic_label: string; note: string};
  form_correction_debt: Record<string, Json>;
  feasibility: Record<string, Json>;
  pairing: {severity: string; warning: string | null};
  model_provenance: Record<string, Json>; perspective_provenance: Record<string, Json>;
  rejected_overrides: string[]; corrections: Json[];
  share_url: string | null; share_note: string;
  claims: Json[] | null; claims_sidecar: Json[] | null;
  engine: {revision: string; data_as_of: string}; site: Json;
}
export interface EnvelopeFusion {sentence: string; margin: string | null; selection_receipt: Record<string, Json>}
export interface LegacyPrices {
  costs: Band; input: Band; output: Band; margins: {lo: number; mid: number; hi: number};
  throughput: {input_tokens_per_second: number; output_tokens_per_second: number};
  fleetRenderable: FleetRenderable; disclosure: string; selection_receipt: Record<string, Json>;
  envelope(fusion: EnvelopeFusion): RunScenarioEnvelope;
}
const round = (v: number): number => Math.round(v * 10) / 10;
/** Mirrors run_scenario's serializeFormCorrectionDebt field-for-field. */
function formDebt(raw: Record<string, any>): Record<string, Json> {
  const affected = (raw.legs ?? []).filter((leg: Record<string, any>) => leg.ratio !== null || leg.crossQuantityExposure || leg.replicationResidual);
  return {
    not_a_result: raw.notAResult,
    identified_span_pct: raw.identifiedSpan ? {lo: raw.identifiedSpan.lo, hi: raw.identifiedSpan.hi, span_pp: raw.identifiedSpan.spanPp} : null,
    identified_span_scope: raw.identifiedSpan ? raw.identifiedSpan.scope : null,
    basis: raw.identifiedSpan ? raw.identifiedSpan.basis : null,
    placement_provenance: raw.placementProvenance ?? null, surrogate_note: raw.surrogateNote ?? null,
    affected_legs: affected.map((leg: Record<string, any>) => ({
      hardware_key: leg.hwKey, representation: leg.representation ?? null, batch_quantity: leg.batchQuantity ?? null,
      declared_width: leg.nPhysDeclared ?? null, eta_held_throughput_ratio: leg.ratio ?? null,
      cross_quantity_exposure_ratio: leg.crossQuantityExposure?.ratio ?? null,
      replication_residual: leg.replicationResidual ?? null, warning: leg.crossQuantityNote ?? leg.note ?? null})),
    warning: affected.map((leg: Record<string, any>) => leg.crossQuantityNote).filter(Boolean).join(' '),
  };
}
/** Mirrors run_scenario's feasibility block field-for-field, over the queried single-hardware leg. */
function feasibilityBlock(e: LegacyEngine, feas: Record<string, any>, fr: FleetRenderable, note: string): Record<string, Json> {
  return {
    renderable_legs: feas.renderableLegs, total_legs: feas.totalLegs, renderable_weight_share: feas.renderableWeightShare,
    dominant_hw: (e.HW[feas.domKey]?.name as string) ?? feas.domKey, dominant_op_basis: feas.dominant?.opBasis ?? null,
    five_status: (fr.statusVector as Json) ?? null, renderable_under_policy_all_legs: fr.allLegsRenderableUnderPolicy ?? null,
    placement_verified: fr.placementVerified ?? null, policy: (fr.policy as Json) ?? null,
    legs: feas.legs.map((leg: Record<string, any>) => {
      const rc = leg.capacityReceipt as Record<string, any> | null;
      return {hardware: (e.HW[leg.hwKey]?.name as string) ?? leg.hwKey, op_basis: leg.opBasis,
        declared_batch: leg.bDeclared ?? null, rendered_batch: leg.b ?? null, feasible_batch: leg.bFeas ?? null,
        renderable_under_policy: leg.renderableUnderPolicy === true, placement_verified: leg.placementVerified === true,
        solved_width: leg.widthRendered ?? null,
        ...(leg.reason ? {reason: leg.reason} : {}), ...(leg.contextWindow ? {context_window: leg.contextWindow} : {}),
        spec_decode: leg.specDec ? {baseline_status: leg.specDec.status, factor_applied: leg.specDec.factorApplied, reason_code: leg.specDec.reasonCode} : null,
        solver_receipt: rc ? {
          capacity_minimum_under_uniform_policy: rc.capacityMinimumUnderUniformPolicy,
          declared_operating_point_width: rc.declaredOperatingPointWidth, decode_representative_tokens: rc.decodeRepresentativeTokens,
          peak_kv_tokens: rc.peakKvTokens, peak_kv_definition: rc.peakKvDefinition, objective: rc.objective ?? null,
          capacity_target_objective: rc.capacityTargetObjective, capacity_target_batch: rc.capacityTargetBatch,
          capacity_target_batch_source: rc.capacityTargetBatchSource,
          declared_operating_point_objective: rc.capacityTargetObjective, b_declared: rc.capacityTargetBatch,
          b_declared_source: rc.capacityTargetBatchSource,
          deprecated_alias_note: 'declared_operating_point_objective, b_declared, and b_declared_source alias the capacity_target_* fields and will be removed only in a versioned response contract',
          b_feas_at_capacity_min: rc.bFeasAtCapacityMin ?? null, next_smaller_width_rejection_reason: rc.nextSmallerWidthRejectionReason ?? null,
          residency_basis: rc.residencyBasis ?? null,
          placement_registry: rc.placementRegistry ? {id: rc.placementRegistry.id, engaged: rc.placementRegistry.engaged, disengaged_reasons: rc.placementRegistry.disengagedReasons} : null,
          legal_set_provenance_note: rc.legalSetProvenanceNote ?? null, conservative_subset_note: rc.conservativeSubsetNote ?? null,
          observed_vs_analyst: rc.observedVsAnalyst ?? null,
        } : null};
    }),
    note,
  };
}
export function priceWithLegacy(profile: ComparisonProfile, context: EconomicsContext, annualCost: Band,
  count: number, annualHours: number, occupancy: number, utilization: number): LegacyPrices {
  const e = context.engine;
  const state = legacyState(profile, context);
  const [utilLo, utilHi] = e.SCENARIO_BOUNDS.util as [number, number];
  if (utilization * 100 < utilLo || utilization * 100 > utilHi) throw new TypeError('utilization outside legacy supported bounds');
  state.util = utilization * 100;
  const hw = e.HW[profile.hardware_key];
  const ti = e.tokPerS(hw, state, 'in');
  const to = e.tokPerS(hw, state, 'out');
  if (![ti, to].every(x => Number.isFinite(x) && x > 0)) throw new TypeError('legacy throughput is infeasible for this workload and hardware');
  const denominator = count * occupancy * annualHours * 3600 * utilization;
  if (!(denominator > 0) || !Number.isFinite(denominator)) throw new TypeError('invalid productive accelerator time');
  const input = {lo: 0, mid: 0, hi: 0}, output = {lo: 0, mid: 0, hi: 0}, costs = {lo: 0, mid: 0, hi: 0};
  const margins = {lo: 0, mid: 0, hi: 0};
  let central_mix: Mix | null = null;
  for (const key of ['lo', 'mid', 'hi'] as const) {
    input[key] = annualCost[key] * 1e6 / denominator / ti;
    output[key] = annualCost[key] * 1e6 / denominator / to;
    const mix = e.computeMix(input[key], output[key], state);
    if (key === 'mid') central_mix = mix;
    costs[key] = mix.costMix;
    margins[key === 'lo' ? 'hi' : key === 'hi' ? 'lo' : 'mid'] = mix.margin;
  }
  if (![...Object.values(costs), ...Object.values(input), ...Object.values(output)].every(Number.isFinite)) throw new TypeError('nonfinite legacy cost result');
  const fr = e.workloadOnHw(hw, state).fleetRenderable;
  const model = e.MODELS.find(x => x.id === profile.workload.model_id)!;
  const central = e.PERSPECTIVES.find(x => x.id === 'median');
  if (!central) throw new TypeError('legacy baseline perspective unavailable');
  const baseline = e.workload(e.applyPresetSettings(model, central, {mode: 'native'}));
  const b = baseline.fleetRenderable;
  // Existing policy-scenario selection-receipt shape, with a scenario result that cannot
  // claim central status. The baseline remains the engine's own central-lens calculation.
  const selection_receipt: Record<string, Json> = {
    this_result_pct: Number.isFinite(margins.mid) ? Math.round(margins.mid * 100) : null,
    is_central: false, selection_origin: 'modeled site cost pool under explicit economic assumptions',
    changed_from_central: ['cost basis: explicit site/service-boundary pool', 'hardware: ' + profile.hardware_key,
      `utilization: ${utilization}`, `occupancy: ${occupancy}`],
    five_status: b.statusVector ?? null,
    renderable_under_policy_all_legs: b.allLegsRenderableUnderPolicy ?? null,
    placement_verified: b.placementVerified ?? null, residency_basis: b.policy?.residencyBasis ?? null,
    policy_sensitivity: null, policy_sensitivity_scope: null, default_membership: null,
    policy_scenario_pct: Number.isFinite(baseline.margin) ? Math.round(baseline.margin * 100) : null,
    policy_scenario_renderable_legs: b.renderableLegs, policy_scenario_total_legs: b.totalLegs,
    policy_scenario_renderable_weight_share: b.renderableWeightShare,
    policy_scenario_note: e.fleetRenderableDisclosure(b),
    policy_scenario_scope: `${profile.workload.model_id} at the legacy median lens and native traffic`,
    central_ineligibility_reasons: ['site economic scenario is not a placement-verified central comparison'],
  };
  const disclosure = e.fleetRenderableDisclosure(fr);
  const perspective = e.PERSPECTIVES.find(x => x.id === profile.workload.engine_perspective_id)!;
  const traffic = trafficSelection(profile.workload.traffic);
  const tr = e.resolveTraffic(model, perspective, traffic);
  const scenarioContext = e.makeScenarioContext(model, tr, state.customDonor, perspective.kind, perspective.id);
  /* The queried scenario is ONE accelerator key at one site, so its feasibility and calibration
     debt are read off a leg-isolated clone of this state — never off the model preset's declared
     fleet blend, which would describe a different object. The clone carries the supplied scenario
     context because structuredClone drops the engine's identity association. */
  const envelope = (fusion: EnvelopeFusion): RunScenarioEnvelope => {
    const single: State = structuredClone(state);
    single.blend = Object.fromEntries(Object.keys(state.blend as Record<string, number>).map(k => [k, k === profile.hardware_key ? 100 : 0]));
    const feas = e.feasibility(single, scenarioContext);
    const span = e.lensSpan(model, {mode: 'custom', ioRatio: state.ioRatio, cacheHit: state.cacheHit});
    const membership = span && !span.single ? e.lensSpanMembershipNote(span) : '';
    const spanText = !span ? 'no compatible cost lens at this scope'
      : span.single ? `a single compatible cost lens at ≈${round(span.lo * 100)}%`
      : `at ${tr.label}: ≈${round(span.lo * 100)}%–≈${round(span.hi * 100)}% across ${span.n} compatible cost lenses`
        + (membership ? ` — ${membership}` : '');
    const warning = e.pairingWarning(model, perspective);
    return {
      sentence: fusion.sentence, selection_receipt: fusion.selection_receipt,
      headline: {kind: 'modeled-unit-direct-serving-contribution-margin', epistemic_status: 'derived-estimate',
        label: `${e.TIPS.margin.t} — derived estimate under ${perspective.name} at ${tr.label}, priced from a modeled site cost pool.`,
        value: fusion.margin, must_carry: [`${e.TIPS.margin.t} — not an audited accounting company gross margin (unit serving, not company GM)`,
          'modeled site cost-pool scenario under named economic assumptions — not an observed site bill'],
        cited_range_context: null, derived_from: null},
      central_comparator: null,
      costs: {blended_cost_usd_per_mtok: central_mix!.costMix, realized_price_usd_per_mtok: central_mix!.priceMix,
        decode_cost_usd_per_mtok: central_mix!.cOut, fresh_prefill_cost_usd_per_mtok: central_mix!.cIn,
        cache_read_cost_usd_per_mtok: central_mix!.cCache, perimeter_note: e.TIPS.margin.b},
      traffic: {io_ratio: state.ioRatio, cache_hit_pct: state.cacheHit, mode: tr.mode, locked: !!tr.locked, label: tr.label,
        provenance: (tr.profileId ? (e.TRAFFIC_PROFILES.find(x => x.id === tr.profileId)?.provenance as Json ?? null) : null),
        selection_note: traffic.mode !== 'native' && tr.locked ? `requested traffic selection ignored — locked by the replay (${tr.label})` : null},
      lens_span: {span: spanText, n_lenses: span ? span.n : 0, traffic_label: tr.label,
        note: 'quoting the headline without its lens span is lens-shopping; the span holds traffic byte-identical across compatible cost lenses'},
      form_correction_debt: formDebt(e.formCorrectionDebt(single, scenarioContext)),
      feasibility: feasibilityBlock(e, feas, fr, disclosure),
      pairing: {severity: e.pairingSeverity(model, perspective), warning: warning || null},
      model_provenance: {id: model.id, name: model.name ?? null, note: (model.note as Json) ?? null, speculative_sizes: !!model.spec,
        tariff_scenario: !!model.scenario, unsourced_scratch: model.id === 'custom', native_traffic: (model.nativeTraffic as Json) ?? null},
      perspective_provenance: {id: perspective.id, name: perspective.name ?? null, kind: (perspective.kind as Json) ?? null, note: (perspective.note as Json) ?? null},
      rejected_overrides: [], corrections: [],
      share_url: null,
      share_note: 'A site cost-pool scenario is identified by its exact release ID and profile hash; the calculator share codec does not encode it, so no share link is minted here.',
      claims: null, claims_sidecar: null,
      engine: {revision: e.ENGINE_REVISION, data_as_of: e.DATA_AS_OF}, site: null,
    };
  };
  return {costs, input, output, margins, throughput: {input_tokens_per_second: ti, output_tokens_per_second: to},
    fleetRenderable: fr, disclosure, selection_receipt, envelope};
}
