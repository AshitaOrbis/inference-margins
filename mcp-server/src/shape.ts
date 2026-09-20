/* Response shaping — the DECISIONS made concrete:
   - Variant B response-level envelope: every result leads with a complete honest sentence
     (plain-text content), then a MANDATORY selection_receipt; a non-central result is never
     returned without the central estimate alongside.
   - Values are STATUS-FUSED STRINGS ("≈93% (counterfactual)", "≥80% (floor)",
     "~70% company-GM", "≈77% (unit serving, not company GM)"): the epistemic status is welded
     into the same token as the number, because the fixture experiment showed the welded token
     is the only qualifier that survives maximal LLM compression.
   - Bare margin scalars live ONLY inside selection_receipt, whole-point rounded
     (no manufactured tenths; value_pct_unrounded is deliberately absent from all outputs). */
import { E, SITE, engineStamp } from "./engine.js";
import type { FleetRenderable, MarginClaim, ModelPreset, TrafficSel } from "./engine-types.js";
import { CONTRACTS } from "./claims.js";
import type { Claim, EmptyComparisonSlot, FleetRenderableFields, SidecarEntry } from "./claims.js";

/* ================================================================================
   R2 (im4-r2-shipment-plan §1.1/§1.4/§1.6/§1.9) — the migrated claim contracts on
   the MCP surfaces. ONE runtime (site/engine-contracts-v22.js via claims.ts); the
   closed emission boundary wraps BOTH transports (stdio + streamable HTTP share
   buildServer → envelope below); every response carries content-addressed
   one-to-one sidecars; central identity is decided by the engine's PRIVATE
   constructor (capability brand), never by a string this package writes.
   ================================================================================ */

/* The closed emitter registry: every MCP tool emits through exactly two registered
   emitters (its text envelope + its structured envelope). Registered once at module
   load; emit() on an unregistered id throws — the boundary is closed. */
export const MCP_TOOL_IDS = Object.freeze([
  "list_scenario_space", "query_margin_claims", "run_scenario", "adjust_rental_rate", "run_fleet_sections",
  "explore_range", "get_report", "get_dossier",
] as const);
for (const t of MCP_TOOL_IDS) {
  CONTRACTS.registerEmitter(`mcp-text:${t}`, "mcp-text", CONTRACTS.mcpTextAdapter);
  CONTRACTS.registerEmitter(`mcp-json:${t}`, "mcp-json", CONTRACTS.jsonAdapter);
}

export type ToolId = (typeof MCP_TOOL_IDS)[number];

/* ---------- the central-comparison mint (§1.4; memo §0-bis/§0-ter) ----------
   The receipt's baseline ("the central estimate for {model}") is a COMPARISON-role
   claim minted with requestCentral: true. The engine's private constructor either
   brands it central-verified (placement-verified legs, ≥2 verified clusters, zero
   policy taint, clean selection) or refuses with TYPED reasons — those refusals ARE
   the receipt's central-ineligibility record. Trust never lives in the string:
   is_central below narrows via the runtime brand. */
export interface CentralComparison {
  claim: Claim;
  eligible: boolean;
  refusals: readonly string[];
  emptySlot: EmptyComparisonSlot | null; // the RATIFIED honestly-empty comparator slot (owner ruling 2026-07-22 21:15Z)
}

/* The policyPoint metric-scope value: the uniform-policy scalar that drove the solve,
   or the string marker when the placement registry (no scalar) drove it. */
function policyPointScope(fr: FleetRenderable): string | number {
  if (fr.policy && fr.policy.residencyBasis === "placement-registry") return "placement-registry";
  return fr.policy && fr.policy.value != null ? fr.policy.value : "none";
}

export function mintCentralComparison(
  m: ModelPreset,
  centralState: Record<string, any>,
  centralPct: number,
  fr: FleetRenderable,
): CentralComparison {
  const subject = `${m.id}@central-lens`;
  const blend: Record<string, number> = centralState.blend || {};
  const legs = (fr.legStatuses || []).map((l: any) => ({
    id: String(l.hwKey), weight: blend[l.hwKey] ?? 0,
    renderableUnderPolicy: l.renderableUnderPolicy === true,
    placementVerified: l.placementVerified === true,
  }));
  // Cluster support counts only from legs that are BOTH renderable-under-policy and
  // placement-verified (fail-closed: an unverified leg contributes no verified cluster).
  const sel = E.selectDefaultFleet(centralState);
  const landingProfile = sel.landing ? sel.profiles.find((p: any) => p.id === sel.landing) : null;
  const verifiedLegIds = new Set(legs.filter((l) => l.renderableUnderPolicy && l.placementVerified).map((l) => l.id));
  const clusters = landingProfile
    ? landingProfile.legs.map((l: any) => ({ clusterId: l.clusterId ?? `no-cluster:${l.hw}`, verified: verifiedLegIds.has(l.hw) && l.clusterId != null }))
    : [];
  const scope = { model: m.id, perspective: "median", lens: "central", policyPoint: policyPointScope(fr) };
  const tree = CONTRACTS.tree({
    headline: Number.isFinite(centralPct)
      ? CONTRACTS.leaf("margin.unit-serving", scope, centralPct)
      : CONTRACTS.stateLeaf("margin.unit-serving", scope, "infeasible", "declared fleet infeasible at the declared serving topology — no numeric result"),
  });
  const claim = CONTRACTS.mintClaim({
    subject, estimand: "modeled unit direct-serving contribution margin (central-lens baseline)",
    evidenceBasis: {
      engine: E.ENGINE_REVISION, dataAsOf: E.DATA_AS_OF, model: m.id,
      residencyBasis: fr.policy ? (fr.policy.residencyBasis ?? "uniform-policy") : "uniform-policy",
    },
    role: "comparison", tree,
    requestCentral: true,
    legs, clusters,
    derivation: { policyTainted: !(fr.policy && fr.policy.residencyBasis === "placement-registry") },
    selectionReceipt: { clean: true, basis: "preset-default" },
  });
  const eligible = CONTRACTS.isCentral(claim);
  const refusals = eligible ? [] : ((claim as { centralRefusals?: readonly string[] }).centralRefusals ?? ["central identity refused by the claim constructor"]);
  return { claim, eligible, refusals, emptySlot: eligible ? null : CONTRACTS.emptyComparisonSlot(subject) };
}

/* This response's own three-point policy-sensitivity receipt (§1.6; memo §0-ter):
   recomputed in THIS surface's units (margin %), SAMPLED, argMin/argMax computed,
   no continuity implied, never encoded into links. */
export function policySensitivityFor(state: Record<string, any>, engineContext?: unknown) {
  const band = E.evaluateAtPolicyBand((p: number) =>
    E.workload(state, undefined, engineContext, { loadedWeightBytesPerParam: p }).margin * 100);
  // R3 (design memo D-6): the band re-evaluates VALUES on the FIXED central-policy
  // membership (the state's blend is the seeded default and is never re-derived per
  // point); THIS typed record separately discloses at which sampled points the
  // membership itself would differ. It never alters the band's points or
  // argMin/argMax; counterfactual re-derived margins are NOT the band points.
  const memb = E.membershipSensitivity(E.DEFAULT_FLEET_ID, state, engineContext);
  return {
    label: band.label + " — solver output, never an observed deployment; the policy value is an engine constant and is never encoded into share links",
    points: band.points.map((x: { policyPoint: number; value: number }) => ({
      policy_point: x.policyPoint,
      margin_pct: Number.isFinite(x.value) ? Math.round(x.value) : null,
    })),
    sampled_min_at: band.argMin ?? null,
    sampled_max_at: band.argMax ?? null,
    membership_sensitivity: memb
      ? { note: "values above are evaluated on the default membership FIXED at the planning-policy point; this record discloses where the membership itself would differ at the sampled points (counterfactual re-derived margins are not the band points)",
          points: memb.map(x => ({ policy_point: x.policyPoint, would_enter: x.wouldEnter, would_leave: x.wouldLeave })) }
      : null,
  };
}

/* ---------- status-fused value strings ---------- */
/* im-release-edit-r3 (2026-09-10), corrected after a fallback review finding (F3).
   THE FIRST VERSION OF THIS CLAMPED TOO MUCH, in both branches, and the review was right about both.
   It read `renderableLegs === totalLegs ? 1 : Math.min(1, share)`, which (a) published a LITERAL
   rather than a corrected measurement — an engine regression to 0.52 while all seven legs rendered
   would still have published 100% — and (b) silently clamped ANY out-of-range value on the
   partial-fleet branch, where nothing else would have caught it.

   What is actually wrong is one unit in the last place: a sum of normalized weights that should be
   exactly 1 and lands a single ulp above it. So correct exactly that, and let anything genuinely
   above 1 fail the schema, which is what `nonnegative.max(1)` in dcmap/economics/dto.ts is for. A
   share of 1.02 is not a rounding artifact and must not be published as 1.

   The engine-internal identity — the same overshoot at its source, where the value is also the
   divisor of the blend renormalization and an input to byte-frozen historical receipt
   reproductions — remains open as bq-2194. */
export const publishedShare = (share: number): number =>
  Number.isFinite(share) && Math.abs(share - 1) <= 1e-9 ? 1 : share;

export const round = (pct: number): number => Math.round(pct);

export function fuseUnit(pct: number): string {
  return `≈${round(pct)}% (unit serving, not company GM)`;
}
export function fuseCounterfactual(pct: number): string {
  return `≈${round(pct)}% (counterfactual)`;
}

export function fusedHeadlineValue(pct: number, status: string, centralEligible = false): string {
  const n = round(pct);
  switch (status) {
    case "derived-estimate":
      // R2 (§1.3 hero flip): a policy-driven derived estimate carries the policy-labeled
      // identity WELDED into the value token — never a bare unit-serving claim that could
      // be quoted as verified/central.
      return centralEligible
        ? `≈${n}% (unit serving, not company GM)`
        : `≈${n}% (policy-labeled scenario output — unit serving, not company GM; not a verified or central estimate)`;
    case "replay":
      return `≈${n}% (replay of a published operating point — unit serving, not company GM)`;
    case "range-exploration-counterfactual":
      return `≈${n}% (counterfactual — page-authored route, not an estimate; unit serving metric, not company GM)`;
    case "modified-range-exploration":
      return `≈${n}% (counterfactual, since edited — not an estimate; unit serving metric, not company GM)`;
    case "modified-scenario":
      return `≈${n}% (modified scenario — user-specified assumptions, attribution removed; unit serving, not company GM)`;
    case "custom-scenario":
      return `≈${n}% (user-defined scratch model, nothing sourced; unit serving metric, not company GM)`;
    case "tariff-scenario":
      return `≈${n}% (tariff scenario — architecture unidentified, not a provider estimate; unit serving metric, not company GM)`;
    case "lens-scenario":
      return `≈${n}% (LENS SCENARIO — rented-capacity lens on an owned or domestic fleet; NOT a provider claim; unit serving metric, not company GM)`;
    case "exploratory-forced-pairing":
      return `≈${n}% (forced exploratory pairing — out-of-scope lens; unit serving metric, not company GM)`;
    default:
      return `≈${n}% (unit serving, not company GM)`;
  }
}

/* Status-fused rendering of a claim's cited bound. Floors are NEVER intervals (P0-2). */
export function renderClaimBound(c: MarginClaim): { type: string | null; lo: number | null; hi: number | null; rendered: string } | null {
  if (!c.numeric || typeof c.numeric.lo !== "number") return c.boundType ? { type: c.boundType, lo: null, hi: null, rendered: "(no numeric bound — see the record's reason)" } : null;
  const { lo, hi } = c.numeric;
  const companyish = /company-GM/.test(c.metricScope || "") || c.scopeLayer === "company-GM";
  if (c.boundType === "floor" || hi === null || hi === undefined) {
    return { type: "floor", lo, hi: null, rendered: `≥${lo}% (floor — compatible with this range and every higher one; NOT an interval and NOT a point)${companyish ? " — company/product-line perimeter, not the unit metric" : ""}` };
  }
  if (c.boundType === "conditional-range") {
    return { type: c.boundType, lo, hi, rendered: `${lo}%→${hi}% (conditional transition — the stated mechanism's endpoint claim, not a point estimate)` };
  }
  if (lo === hi) {
    const scopeTag = companyish ? "company-GM" : c.scopeLayer === "api-product-line" ? "API/product-line GM, not the unit metric" : c.scopeLayer === "paid-user-cohort" ? "paid-user-cohort compute margin, not the unit metric" : c.scopeLayer === "analyst-assumption" ? "analyst modeling assumption, not a measurement" : "point, " + (c.metricScope || "unspecified scope");
    return { type: "point", lo, hi, rendered: `~${lo}% ${scopeTag}` };
  }
  const scopeTag = companyish ? "company-GM interval, not the unit metric" : `interval, ${c.metricScope || "unspecified scope"}`;
  return { type: c.boundType || "interval", lo, hi, rendered: `${lo}–${hi}% (${scopeTag})` };
}

/* ---------- selection receipt ---------- */
/* R2 (§1.4; memo §0-ter): the receipt's baseline fields GATE on placement-verified
   central eligibility, decided by the claim constructor (mintCentralComparison above).
   - ELIGIBLE (structurally impossible for closed models in R2, and for every current
     open-model fleet — Chinese silicon / no verified clusters): central_estimate_*.
   - INELIGIBLE: the SAME quantities emit as policy_scenario_* with is_central
     HARD-SET false and the constructor's typed refusals in
     central_ineligibility_reasons. A consumer keying on central_estimate_pct never
     silently reads a policy-driven number as central.
   Scope note (B5 survives the rename): on run_scenario these fields describe THAT
   QUERY's own model under its own central lens; *_scope always states the scope.
   §1.9/§1.6 additions: the baseline fleet's five-status vector + two-boolean
   contract + residency basis, and the three-point policy sensitivity
   (policy_sensitivity_scope states whose scope it samples). */
interface SelectionReceiptShared {
  this_result_pct: number | null;
  is_central: boolean;
  selection_origin: string;
  changed_from_central: string[];
  five_status: Record<string, string> | null;               // baseline-scope fleet status vector (UNVERIFIED is first-class)
  renderable_under_policy_all_legs: boolean | null;         // baseline scope, two-boolean contract (memo §0-bis)
  placement_verified: boolean | null;                       // baseline scope
  residency_basis: string | null;                           // "placement-registry" | "uniform-policy" (baseline solve)
  policy_sensitivity: ReturnType<typeof policySensitivityFor> | null;
  policy_sensitivity_scope: string | null;
  /* R3 (D-1/D-3c): the default-membership derivation as DATA — exclusions, canonical
     anchor, renormalization — for the baseline/central scope; null off fleet scope. */
  default_membership: {
    derived_at: { traffic_profile_id: string; io_ratio: number; cache_hit: number; basis: string };
    members: Array<{ hw_key: string; declared_weight: number; default_weight: number }>;
    excluded: Array<{ hw_key: string; declared_weight: number; reason: string }>;
    declared_leg_count: number;
    member_leg_count: number;
  } | null;
}
export interface CentralSelectionReceipt extends SelectionReceiptShared {
  central_estimate_pct: number;
  central_estimate_renderable_legs: number;
  central_estimate_total_legs: number;
  central_estimate_renderable_weight_share: number;
  central_estimate_note: string;
  central_estimate_scope: string;
}
export interface PolicyScenarioSelectionReceipt extends SelectionReceiptShared {
  policy_scenario_pct: number;
  policy_scenario_renderable_legs: number;
  policy_scenario_total_legs: number;
  policy_scenario_renderable_weight_share: number;
  policy_scenario_note: string;
  policy_scenario_scope: string;
  central_ineligibility_reasons: readonly string[];
  is_central: false;
}
export type SelectionReceipt = CentralSelectionReceipt | PolicyScenarioSelectionReceipt;

let flagshipWorkloadCache: ReturnType<typeof E.explorationFlagshipWorkload> | null = null;
function flagshipWorkload() {
  if (flagshipWorkloadCache === null) {
    const median = E.PERSPECTIVES.find((p) => p.id === "median")!;
    flagshipWorkloadCache = E.explorationFlagshipWorkload(median);
  }
  return flagshipWorkloadCache;
}
export function flagshipCentralPct(): number {
  return flagshipWorkload().margin * 100;
}
/* IM3 exit-gate fix 1/3: the flagship central estimate's own renormalization condition, welded
   onto every SelectionReceipt below (primary=true -- this is always the flagship-scope Opus @
   Reference / default-blend computation, so the fix-3 Hopper-family correlation caveat applies;
   see fleetRenderableClause's own doc comment in engine.js for the verified-not-guaranteed
   caveat). */
export function flagshipCentralFleetRenderable() {
  return flagshipWorkload().fleetRenderable;
}
/* im-vet-six-repairs (2026-09-20), Astra xhigh finding 1 — BLOCKING. The disclosure above was
   emitted with NO membership, so after the E1 withdrawal the connector's central_anchor told a
   reader the flagship fleet was whole while its margin had moved with two legs removed. The
   membership now travels with the workload it describes. */
export function flagshipCentralMembership() {
  return (flagshipWorkload() as any).membership ?? null;
}

/* The central estimate FOR A MODEL: that model under the central lens at its native traffic. */
export function centralForModel(m: ModelPreset): { pct: number; state: Record<string, any>; fleetRenderable: ReturnType<typeof E.workload>["fleetRenderable"] } {
  const median = E.PERSPECTIVES.find((p) => p.id === "median")!;
  const state = E.applyPresetSettings(m, median, { mode: "native" });
  const wl = E.workload(state);
  return { pct: wl.margin * 100, state, fleetRenderable: wl.fleetRenderable };
}

/* IM3 exit-gate fix 1, verification round 2 (P1): the noun AND the weld for every sentence that
   names "the central estimate for {model}" -- renamed to "the interim renderable-subset scenario"
   and welded with the K-of-M-legs/percent-of-weight condition directly in the returned phrase
   whenever THAT MODEL's own central-lens fleet is renormalized (renderableWeightShare < 1), so a
   consumer who only reads/quotes the prose sentence -- never the sibling structured fields --
   still gets the true picture. Applies equally to the per-model blended "central estimates"
   (e.g. Grok/Sonnet/GPT) whose fleets are partial: the generic "central estimate" label over a
   partial fleet contradicts the recorded IM4 100%/80% renderability gate, so those get the
   interim-subset language too, not just the flagship Opus case. */
/* R3 (design memo D-3c): the flagship default's membership derivation, cached like
   the sibling flagship caches — rides the SAME shared clause on MCP so the exclusion
   weld can never drift from the site's. Null for models outside the fleet scope. */
let flagshipMembershipCache: ReturnType<typeof E.deriveDefaultFleetMembership> | null | undefined;
export function flagshipMembership() {
  if (flagshipMembershipCache === undefined) {
    const m = E.MODELS.find((x: ModelPreset) => x.id === "opus")!;
    flagshipMembershipCache = E.deriveDefaultFleetMembership(E.DEFAULT_FLEET_ID, centralForModel(m).state);
  }
  return flagshipMembershipCache;
}
export function centralNounAndWeld(
  fleetRenderable: { renderableLegs: number; totalLegs: number; renderableWeightShare: number },
  centralEligible = false,
  membership: ReturnType<typeof E.deriveDefaultFleetMembership> = null,
): { nounLower: string; nounCap: string; weld: string } {
  const full = fleetRenderable.renderableWeightShare >= 1;
  // R2 (§1.4): the noun itself gates on placement-verified central eligibility —
  // "the central estimate" may only ever name a constructor-branded central claim.
  const nounLower = !full
    ? "the interim renderable-subset scenario"
    : centralEligible ? "the central estimate" : "the policy-labeled baseline scenario";
  // R2: the weld attaches whenever the shared disclosure is non-empty (the welded
  // policy clause now rides every fleet, not only renormalized ones).
  // R3 (D-3c): the membership story (exclusions, canonical anchor) rides the SAME
  // shared clause — one formatter, both transports, can never drift from the site.
  const disclosure = E.fleetRenderableDisclosure(fleetRenderable, false, membership);
  return {
    nounLower,
    nounCap: nounLower.charAt(0).toUpperCase() + nounLower.slice(1),
    weld: disclosure ? ` (${disclosure})` : "",
  };
}

export function computationReceipt(opts: {
  centralPct: number;
  centralFleetRenderable: { renderableLegs: number; totalLegs: number; renderableWeightShare: number };
  centralScope: string;
  thisPct: number | null;
  origin: string;
  changed: string[];
  comparison: CentralComparison;
  policySensitivity?: ReturnType<typeof policySensitivityFor> | null;
  policySensitivityScope?: string | null;
  primaryDisclosure?: boolean;
  membership?: ReturnType<typeof E.deriveDefaultFleetMembership>;
}): SelectionReceipt {
  const central = round(opts.centralPct);
  const thisPct = opts.thisPct === null || !isFinite(opts.thisPct) ? null : round(opts.thisPct);
  const cf = opts.centralFleetRenderable as FleetRenderable;
  /* im-release-edit-r3 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok.
     THE CONNECTOR'S OWN SCHEMA SAYS max(1) — see dcmap/economics/dto.ts, which types both
     *_renderable_weight_share as `nonnegative.max(1)`. The engine's value is a float accumulation
     over the declared weights, and once the owner's ruling made all seven legs render it started
     returning 1.0000000000000002: a proportion above 1, published against a schema that forbids it.
     It could not be reached before this release, because while three legs carried no admissible
     planning rate the sum was ~0.52 and never approached its own upper bound.

     Normalized HERE, at the publication boundary, and deliberately not in the engine. The engine's
     sum is the divisor of its own blend renormalization and the input to byte-frozen historical
     receipt reproductions; correcting it there moves five WIDE parity constants, two source
     freezes, an 180-pair baseline fixture and three historical-receipt reproductions — measured,
     not guessed — for a field that both publication surfaces already round to "100%" when they show
     it. Destroying a reproduction proof of what the engine used to compute, in order to remove one
     ulp from a number nobody reads at full precision, is the wrong trade. What is actually wrong is
     the PUBLISHED claim, and this is where the claim is made. The engine-internal identity is filed
     as bq-2194 for a release that is not already carrying a number move. */
  const publishedWeightShare = (f: FleetRenderable): number => publishedShare(f.renderableWeightShare);
  // primary=false default: the Hopper-family correlation caveat is verified only for the
  // flagship scope (Opus @ Reference); not asserted about an arbitrary queried model's fleet.
  // R3 (D-3c): the central computation's membership derivation rides the same clause.
  const note = E.fleetRenderableDisclosure(cf, opts.primaryDisclosure === true, opts.membership ?? null);
  const shared: SelectionReceiptShared = {
    this_result_pct: thisPct,
    is_central: false, // overwritten below only on the eligible branch
    selection_origin: opts.origin,
    changed_from_central: opts.changed,
    five_status: cf.statusVector ?? null,
    renderable_under_policy_all_legs: cf.allLegsRenderableUnderPolicy ?? null,
    placement_verified: cf.placementVerified ?? null,
    residency_basis: cf.policy ? (cf.policy.residencyBasis ?? "uniform-policy") : null,
    policy_sensitivity: opts.policySensitivity ?? null,
    policy_sensitivity_scope: opts.policySensitivity ? (opts.policySensitivityScope ?? null) : null,
    default_membership: opts.membership
      ? { derived_at: { traffic_profile_id: opts.membership.derivedAt.trafficProfileId,
            io_ratio: opts.membership.derivedAt.ioRatio, cache_hit: opts.membership.derivedAt.cacheHit,
            basis: opts.membership.derivedAt.basis },
          members: opts.membership.members.map(l => ({ hw_key: l.hwKey, declared_weight: l.declaredWeight, default_weight: l.defaultWeight })),
          excluded: opts.membership.excluded.map(x => ({ hw_key: x.hwKey, declared_weight: x.declaredWeight, reason: x.reason })),
          declared_leg_count: opts.membership.declaredLegCount,
          member_leg_count: opts.membership.memberLegCount }
      : null,
  };
  if (opts.comparison.eligible) {
    return {
      ...shared,
      central_estimate_pct: central,
      central_estimate_renderable_legs: cf.renderableLegs,
      central_estimate_total_legs: cf.totalLegs,
      central_estimate_renderable_weight_share: publishedWeightShare(cf),
      central_estimate_note: note,
      central_estimate_scope: opts.centralScope,
      is_central: thisPct !== null && thisPct === central && opts.changed.length === 0,
    };
  }
  return {
    ...shared,
    policy_scenario_pct: central,
    policy_scenario_renderable_legs: cf.renderableLegs,
    policy_scenario_total_legs: cf.totalLegs,
    policy_scenario_renderable_weight_share: publishedWeightShare(cf),
    policy_scenario_note: note,
    policy_scenario_scope: opts.centralScope,
    central_ineligibility_reasons: opts.comparison.refusals,
    is_central: false, // HARD-SET (§1.4): a policy-driven surface can never claim centrality
  };
}

/* The flagship comparison + sensitivity, cached (module lifetime — engine data is
   immutable per process, same pattern as flagshipWorkloadCache above). */
let flagshipComparisonCache: CentralComparison | null = null;
export function flagshipComparison(): CentralComparison {
  if (!flagshipComparisonCache) {
    const m = E.MODELS.find((x: ModelPreset) => x.id === "opus")!;
    const { state } = centralForModel(m);
    flagshipComparisonCache = mintCentralComparison(m, state, flagshipCentralPct(), flagshipCentralFleetRenderable() as FleetRenderable);
  }
  return flagshipComparisonCache;
}
let flagshipSensitivityCache: ReturnType<typeof policySensitivityFor> | null = null;
function flagshipSensitivity() {
  if (!flagshipSensitivityCache) {
    const m = E.MODELS.find((x: ModelPreset) => x.id === "opus")!;
    flagshipSensitivityCache = policySensitivityFor(centralForModel(m).state);
  }
  return flagshipSensitivityCache;
}

/* The R2-correct flagship-baseline sentence fragment shared by the registry tools'
   own emitters (noun + fused token + weld all gate on the SAME eligibility decision
   the receipt uses — the two can never disagree). */
export function flagshipBaselineFragment(): string {
  const cf = flagshipCentralFleetRenderable();
  const comparison = flagshipComparison();
  const { nounLower, weld } = centralNounAndWeld(cf, comparison.eligible, flagshipMembership());
  return `${nounLower} at the flagship scope (Claude Opus 4.x @ Reference 15:1/60%) is ${fusedHeadlineValue(flagshipCentralPct(), "derived-estimate", comparison.eligible)}${weld}`;
}

/* Registry-style receipt for tools that compute nothing (claims/report/dossier/list):
   still mandatory — the flagship baseline rides along so no response exists without it,
   under the SAME eligibility gate as every computing tool. */
export function registryReceipt(origin: string): SelectionReceipt {
  return computationReceipt({
    centralPct: flagshipCentralPct(),
    centralFleetRenderable: flagshipCentralFleetRenderable(),
    centralScope: "flagship (Claude Opus 4.x @ Reference 15:1/60%, default blend) — the fixed cross-tool anchor this non-computing tool carries alongside its own registry data",
    thisPct: null,
    origin,
    changed: [],
    comparison: flagshipComparison(),
    policySensitivity: flagshipSensitivity(),
    policySensitivityScope: "flagship baseline (Claude Opus 4.x @ Reference, default blend)",
    primaryDisclosure: true,
    membership: flagshipMembership(),
  });
}

/* Fields changed vs the model's central state, formatted "key: central → this".
   Values the caller supplied come back to the caller only — they are never logged. */
export function changedFromCentralState(centralState: Record<string, any>, state: Record<string, any>): string[] {
  const out: string[] = [];
  for (const k of Object.keys(E.DEFAULTS)) {
    if (JSON.stringify(centralState[k]) === JSON.stringify(state[k])) continue;
    /* im-arc T1 fix (Sol review 2026-08-22, finding P2-1): closed map-valued
       overrides get stable donor/value receipts; absent values are stated as unset. */
    const mapKeys = new Set(["rentAbsLeg", "rentMultLeg", "rentMultFam"]);
    const fmt = (v: unknown) =>
      k === "blend" ? Object.entries((v as Record<string, number>) || {}).filter(([, s]) => s > 0).map(([hw, s]) => `${hw} ${s}`).join("/")
      : v === null ? "unset"
      : mapKeys.has(k) && typeof v === "object"
        ? `${k}{${Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([donor, value]) => `${donor}=${String(value)}`).join(", ")}}`
        : String(v);
    out.push(`${k}: ${fmt(centralState[k])} → ${fmt(state[k])}`);
  }
  return out;
}

/* ---------- envelope ---------- */
export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: Record<string, unknown>;
  isError?: boolean;
}

/* R2 (§1.1): what a tool passes to the closed emission boundary. The claim is the
   response's minted headline claim (result role — policy-scenario by construction;
   central is impossible for a result claim). fleetRenderable feeds the ONE shared
   weld formatter; registry tools pass the flagship baseline's fields so the
   weld-required mcp-text class always has a true weld to enforce. */
export interface EmitMeta {
  tool: ToolId;
  claim: Claim;
  fleetRenderable: FleetRenderableFields;
  display?: { displayed: number; canonical: number; precisionNote: string | null } | null;
}

export function envelope(sentence: string, receipt: SelectionReceipt, payload: Record<string, unknown>, emitMeta: EmitMeta): ToolResult {
  // The shared weld token (v4.1(i)) — derived by the ONE formatter from THIS
  // envelope's own fields; the boundary rejects a fabricated or contradictory weld.
  const weld = CONTRACTS.weldClause(emitMeta.fleetRenderable);
  const lead = weld && !sentence.includes(weld) ? `${sentence} ${weld}` : sentence;
  const store = CONTRACTS.makeSidecarStore();
  const contractsEnvelope = {
    claim: emitMeta.claim,
    leadSentence: lead,
    visibleText: lead,
    weld,
    display: emitMeta.display ?? undefined,
    envelopeFields: emitMeta.fleetRenderable,
  };
  // BOTH transport classes emit through the closed boundary and share one sidecar
  // store — content-addressed, one-to-one, pointers resolving into each artifact.
  const textArtifact = CONTRACTS.emit(`mcp-text:${emitMeta.tool}`, contractsEnvelope, store);
  const jsonArtifact = CONTRACTS.emit(`mcp-json:${emitMeta.tool}`, contractsEnvelope, store);
  const claimsDoc = JSON.parse(jsonArtifact) as { claims: Array<Record<string, unknown>> };
  const sidecar: SidecarEntry[] = store.entries();
  return {
    content: [{ type: "text", text: textArtifact }],
    structuredContent: {
      sentence: lead,
      selection_receipt: receipt,
      ...payload,
      claims: claimsDoc.claims,
      claims_sidecar: sidecar,
      engine: engineStamp(),
      site: { calculator: SITE.calculator, annex: SITE.annex },
    },
  };
}

export function failClosed(message: string): ToolResult {
  return {
    content: [{ type: "text", text: message }],
    structuredContent: { sentence: message, error: true },
    isError: true,
  };
}

/* R2 (§1.1): mint the response's headline RESULT claim. Result-role claims are
   policy-scenario by construction (the constructor's role prohibition) — central
   identity can only ever attach to the separately-minted comparison claim. */
export function mintHeadlineResultClaim(opts: {
  subject: string;
  estimand: string;
  scope: Record<string, string | number | boolean>;
  pct: number | null;
  missing?: { state: "missing" | "infeasible" | "suppressed" | "unverified"; reason: string };
  evidence: Record<string, unknown>;
}): Claim {
  const headline = opts.pct != null && Number.isFinite(opts.pct)
    ? CONTRACTS.leaf("margin.unit-serving", opts.scope, opts.pct)
    : CONTRACTS.stateLeaf("margin.unit-serving", opts.scope,
        opts.missing?.state ?? "missing", opts.missing?.reason ?? "no numeric result");
  return CONTRACTS.mintClaim({
    subject: opts.subject, estimand: opts.estimand,
    evidenceBasis: { engine: E.ENGINE_REVISION, dataAsOf: E.DATA_AS_OF, ...opts.evidence },
    role: "result",
    tree: CONTRACTS.tree({ headline }),
  });
}

/* Emission metadata for non-computing registry tools: the claim mirrors the ONLY
   number such a response asserts — the flagship baseline riding its receipt. */
export function registryEmitMeta(tool: ToolId, responseKind: string): EmitMeta {
  const cf = flagshipCentralFleetRenderable() as FleetRenderable;
  const pct = flagshipCentralPct();
  const claim = mintHeadlineResultClaim({
    subject: `${tool}:flagship-baseline`,
    estimand: `modeled unit direct-serving contribution margin (flagship baseline carried by a ${responseKind} response)`,
    scope: { model: "opus", perspective: "median", policyPoint: policyPointScope(cf), lens: "central" },
    pct: Number.isFinite(pct) ? pct : null,
    missing: Number.isFinite(pct) ? undefined : { state: "infeasible", reason: "flagship central lens infeasible at the declared serving topology" },
    evidence: { responseKind },
  });
  return {
    tool, claim,
    fleetRenderable: {
      renderableLegs: cf.renderableLegs, totalLegs: cf.totalLegs, renderableWeightShare: cf.renderableWeightShare,
    },
    display: Number.isFinite(pct) ? CONTRACTS.displayValue(pct, 0) : null,
  };
}

/* Metric identity rider — derived from the engine's TIPS.margin, never hardcoded (HL-3). */
export function metricIdentityRider(): string {
  return `${E.TIPS.margin.t} — not an audited accounting company gross margin (unit serving, not company GM)`;
}

/* mint a share link under a truthful identity.
   Slice C (memo C-7/C-8/C-11): the wire identities are REQUIRED call-site inputs —
   the encoder never derives an identity, and neither does this wrapper. */
export function shareUrl(state: Record<string, any>, modelId: string, perspId: string, traffic: { mode: string; profileId?: string | null; ioRatio: number; cacheHit: number }, modifiedFrom: string | null, identities: { fleet: string; totalCase: string }, opts?: { customFleet?: Record<string, any>; title?: string | null }): string {
  const token = E.encodeScenario(state, modelId, perspId, traffic, modifiedFrom ?? null, identities, opts);
  return SITE.calculator + "?s=" + encodeURIComponent(token);
}

/* Slice C (memo C-11): the MCP-side wire-identity derivation for a CLEAN-identity
   query — mirrors the app's stored-enum initialization exactly (chokepoint predicate
   for the fleet; scope + value-match for the totalCase; explicit caller choices win).
   A blend override is a custom blend; a total override is a custom total (the C-8
   stored-enum rule: a typed coincidence never borrows a case citation). */
export function wireIdentitiesFor(m: Record<string, any>, p: Record<string, any>, state: Record<string, any>,
    opts: { fleetParam: string | null; blendOverridden: boolean; totalOverridden: boolean }): { fleet: string; totalCase: string } {
  const pset: Record<string, any> = p.id === "dive" ? ((m as any).dive || (E.PERSPECTIVES.find((x) => x.id === "median") as any).set) : (p as any).set;
  const owns = ("blend" in (((m as any).set as Record<string, any>) || {})) || ("blend" in (pset || {}))
    || (p.id === "dive" && (m as any).dive && "blend" in (m as any).dive);
  const inFleetScope = ((E as any).FLEETS[(E as any).DEFAULT_FLEET_ID].models as string[]).includes(m.id);
  const fleet = opts.fleetParam ?? (opts.blendOverridden ? "custom" : (inFleetScope && !owns ? (E as any).DEFAULT_FLEET_ID : "preset"));
  const inTotalScope = ((E as any).TOTAL_CASE_SCOPE as string[]).includes(m.id);
  const totalCase = opts.totalOverridden ? "custom"
    : inTotalScope
      ? (Object.entries((E as any).TOTAL_CASES as Record<string, any>).find(([, c]) => (c as any).totalB === state.total)?.[0] ?? "custom")
      : "preset";
  return { fleet, totalCase };
}

export function toTrafficSel(input:
  | undefined
  | { mode: "native" }
  | { mode: "profile"; profile_id: string }
  | { mode: "custom"; io_ratio: number; cache_hit: number }): TrafficSel {
  if (!input || input.mode === "native") return { mode: "native" };
  if (input.mode === "profile") return { mode: "explicit", profileId: input.profile_id };
  return { mode: "custom", ioRatio: input.io_ratio, cacheHit: input.cache_hit };
}
