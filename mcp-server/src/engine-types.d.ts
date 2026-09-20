/* Type shim for the exports of ../../site/engine.js that this server uses.
   TYPES ONLY — the values come from the live engine via createRequire (src/engine.ts).
   This file re-declares no data; it names the shapes so TypeScript can check call sites. */

export interface TrafficProfile {
  id: string;
  name: string;
  ioRatio: number;
  cacheHit: number;
  provenance: string;
}

export interface ModelPreset {
  id: string;
  name: string;
  spec: boolean;
  scenario?: boolean;
  nativeTraffic: string;
  nativeTrafficWasExplicit?: boolean;
  diveMetric?: string;
  set: Record<string, unknown>;
  dive?: Record<string, unknown>;
  tariff?: unknown;
  note: string;
}

export interface Perspective {
  id: string;
  kind: "lens" | "replay" | "exploration";
  name: string;
  subtitle?: string;
  set: Record<string, unknown>;
  note: string;
}

export interface TrafficSel {
  mode: "native" | "explicit" | "custom" | "legacy-custom";
  profileId?: string;
  ioRatio?: number;
  cacheHit?: number;
}

export interface ResolvedTraffic {
  ioRatio: number;
  cacheHit: number;
  profileId: string | null;
  mode: string;
  locked: boolean;
  label: string;
  origin: string;
}

export interface Workload {
  cIn: number;
  cOut: number;
  cCache: number;
  costMix: number;
  priceMix: number;
  priceMixList: number;
  margin: number;
  fleetRenderable: FleetRenderable;
  composition: Array<Record<string, any>>;
  coverage?: Record<string, any> | null;
  procurementBasis?: string | null;
  bases?: Array<Record<string, any>>;
}

export type TopologyDimension = "N_world" | "N_shard" | "N_domain" | "N_role" | "N_replicas";
export type TopologyEvidenceClass = "A" | "B" | "C" | "D" | "E" | "F";

export interface NShardTopologyCase {
  id: string;
  value: number;
  topologyDimension: "N_shard";
  evidenceClasses: TopologyEvidenceClass[];
  label: string;
  precisionCondition: string;
  citation: string;
}

export interface EvaluatedNShardTopologyCase extends NShardTopologyCase {
  isDefault: boolean;
  infeasible: boolean;
  bFeas: number;
  changesFeasibility: boolean;
}

export interface ReplicaWidthSensitivity {
  rows: Array<{
    hwKey: string;
    kind: "declared-analyst-sensitivity";
    governingSource: string;
    modelingCaveat: string;
    defaultCaseId: string;
    cases: EvaluatedNShardTopologyCase[];
  }>;
}

/* R2 (§1.9): per-leg solver status riding the fleet DTO. */
export interface FleetLegStatus {
  hwKey: string;
  renderableUnderPolicy: boolean;
  placementVerified: boolean;
  note: string | null;
  legalSetProvenanceNote: string | null;
  conservativeSubsetNote: string | null;
}
export interface FleetRenderable {
  renderableLegs: number;
  totalLegs: number;
  renderableWeightShare: number;
  replicaWidthSensitivity?: ReplicaWidthSensitivity | null;
  /* R2 (§1.9; memo §0-bis/§0-ter): the two-boolean contract + EMITTED five-status
     vector + policy identity + per-leg statuses, aggregated FAIL-CLOSED. */
  allLegsRenderableUnderPolicy?: boolean;
  placementVerified?: boolean;
  statusVector?: { weightCapacity: string; fullMemory: string; topologyLegal: string; slo: string; economics: string };
  policy?: { value: number | null; source: string; residencyBasis?: string; placementComponentSource?: string | null } | null;
  legStatuses?: FleetLegStatus[];
}

/* R2 (§1.6): evaluateAtPolicyBand output — SAMPLED three-point band, no continuity. */
export interface PolicyBandResult {
  sampled: true;
  points: Array<{ policyPoint: number; value: number }>;
  argMin: number | null;
  min?: number;
  argMax: number | null;
  max?: number;
  label: string;
}

/* R3 (design memo D-1): the typed membership-derivation DTO — the exclusion is DATA. */
export interface MembershipDerivation {
  fleetId: string;
  derivedAt: { trafficProfileId: string; ioRatio: number; cacheHit: number; basis: string };
  members: Array<{ hwKey: string; declaredWeight: number; defaultWeight: number; placementVerified: boolean }>;
  excluded: Array<{ hwKey: string; declaredWeight: number; reason: string }>;
  declaredLegCount: number;
  memberLegCount: number;
  renormalizationBasis: number;
}
/* R2 (gate-6/7): selectDefaultFleet output over the typed evidence profiles. */
export interface FleetEvidenceProfileLeg {
  hw: string; declaredWeight: number; clusterId: string | null;
  throughputEvidenceClass: string | null; priceClass: string | null; evidenced: boolean;
}
export interface FleetEvidenceProfile {
  id: string; name: string; class: string; models: string[];
  attribution: string; representativeness: string;
  legs: FleetEvidenceProfileLeg[];
  evidencedWeightShare: number;
  independentEvidenceClusters: number;
  containsChineseSilicon: boolean;
  renderableWeightShare: number | null;
  allLegsRenderableUnderPolicy: boolean | null;
  placementVerified: boolean | null;
  renderableIndependentEvidenceClusters: number | null;
}
export interface DefaultFleetSelection {
  landing: string | null;
  modelId: string | null;
  centralEligible: string[];
  profiles: FleetEvidenceProfile[];
}

export interface LensSpanResult {
  lo: number;
  hi: number;
  n: number;
  single: boolean;
  contributors: Array<{ id: string; ioRatio: number; cacheHit: number; margin: number; fleetRenderable: { renderableLegs: number; totalLegs: number; renderableWeightShare: number } }>;
  ioRatio: number;
  cacheHit: number;
  label: string;
  /* B3 (final re-verification, P1): each endpoint's own fleetRenderable, since lo/hi can come
     from different lens perspectives and therefore different renormalized fleet subsets. */
  loFleetRenderable: { renderableLegs: number; totalLegs: number; renderableWeightShare: number };
  hiFleetRenderable: { renderableLegs: number; totalLegs: number; renderableWeightShare: number };
}

export interface Feasibility {
  domKey: string;
  renderableLegs: number;
  totalLegs: number;
  renderableWeightShare: number;
  dominant: FeasibilityLeg;
  legs: FeasibilityLeg[];
}

export interface FeasibilityLeg {
  hwKey: string;
  weight: number;
  opBasis: string;
  infeasible: boolean;
  capped: boolean;
  b: number | null;
  bDeclared: number | null;
  bFeas: number | null;
  reason?: string | null;
  contextWindow?: {
    state: "unregistered" | "within-registered-limit" | "exceeded-registered-limit";
    maxPos: number | null;
    islTokens: number;
    oslTokens: number;
    representativeDecodeTokens: number;
    prefillTokens: number;
    peakKvTokens: number;
    combinedTokens: number;
    definition: string;
    source: string;
    reason: string | null;
  } | null;
}

export interface MarginBucket {
  id: string;
  label: string;
  lo: number;
  hi: number;
}

export interface MarginClaim {
  id: string;
  who: string;
  verbatim: string | null;
  reportedFigure?: string;
  url: string;
  date: string | null;
  sourceClass: string;
  scopeLayer: string | null;
  provenanceTier: string | null;
  tierSource?: string;
  tierNote?: string;
  sweep?: string;
  metricScope: string | null;
  boundType: string | null;
  numeric: { lo: number; hi: number | null } | null;
  subjectScope: string;
  notClaimed: string;
  binnable: boolean;
  relation: string | null;
  reason?: string;
}

export interface DossierEntry {
  attribution: string;
  who: string;
  anchor: { quote: string; url: string } | null;
  params: Record<string, { src: string; label: string }>;
  assumes: string[];
  falsifiers: string[];
}

export interface Tip { t: string; b: string; s: string }

export interface Engine {
  HW: Record<string, { name: string; [k: string]: unknown }>;
  MODELS: ModelPreset[];
  PERSPECTIVES: Perspective[];
  TRAFFIC_PROFILES: TrafficProfile[];
  TIPS: Record<string, Tip>;
  DEFAULTS: Record<string, unknown>;
  SCENARIO_BOUNDS: Record<string, [number, number] | string[]>;
  TRAFFIC_MODES: string[];
  ENGINE_REVISION: string;
  DATA_AS_OF: string;
  DEFAULTS_EPOCH: string;
  MODEL_OWNED_KEYS: string[];
  PERSPECTIVE_SPACE_KEYS: string[];
  MARGIN_BUCKETS: MarginBucket[];
  MARGIN_CLAIMS: MarginClaim[];
  EMPTY_BUCKET_STATEMENT: string;
  SWEEP_DISCLAIMER: string;
  NEGATIVE_FINDINGS_STATEMENT: string;
  EXPLORATION_ORDER_BASIS: string;
  FLAGSHIP_SCOPE: { modelId: string; traffic: TrafficSel };
  DOSSIERS: { models: Record<string, DossierEntry>; perspectives: Record<string, DossierEntry> };
  RETIRED_PERSPECTIVES: Record<string, string>;
  FORM_DEBT_NOT_A_RESULT: string;

  applyPresetSettings(m: ModelPreset, p: Perspective, sel?: TrafficSel): Record<string, any>;
  /* b9 M5 (memo §15 / decision D-10): pin a derived state to the public-evidence reference —
     algorithmic lead 0 months, family multipliers 1.0×. Mutates and returns the state. */
  pinReferenceLevers(s: Record<string, any>): Record<string, any>;
  resolveTraffic(m: ModelPreset, p: Perspective | null, sel?: TrafficSel): ResolvedTraffic;
  lensSpan(m: ModelPreset, sel?: TrafficSel): LensSpanResult | null;
  pairingWarning(m: ModelPreset, p: Perspective): string;
  pairingSeverity(m: ModelPreset, p: Perspective): "hard" | "soft" | "ok";
  encodeScenario(S: Record<string, any>, modelId: string, perspId: string, traffic: { mode: string; profileId?: string | null; ioRatio: number; cacheHit: number }, modifiedFrom: string | null, identities: { fleet: string; totalCase: string }, opts?: { customFleet?: Record<string, any>; title?: string | null }): string;
  decodeScenario(str: string): Record<string, any> | null;
  /* b9 spec-decode LEVER: the THIRD return field is the correction channel — an accepted value that
     the D-SD-7 gate FORCED to another one. Distinct from `rejected`, which means refused. */
  sanitizeScenarioDiff(diff: Record<string, unknown> | undefined, traffic: { locked: boolean } | null, base?: Record<string, any>): { diff: Record<string, any>; rejected: string[]; corrections: Array<{ key: "specDec"; from: number; to: number; reasonCode: string }> };
  overlayDivergesFromReplay(m: ModelPreset, p: Perspective, cleanDiff: Record<string, unknown>): boolean;
  normalizePerspId(id: string): string;
  makeScenarioContext(m: ModelPreset, tr: ResolvedTraffic, customDonor?: string,
    perspKind?: string, perspId?: string): { modelId: string; profileId: string | null;
      customDonor?: string; perspKind?: string | null; perspId?: string | null };
  workload(s: Record<string, any>, activeOverride?: number, context?: { modelId: string; profileId: string | null; customDonor?: string } | unknown, renderOpts?: { loadedWeightBytesPerParam?: number; customFleet?: Record<string, any> }): Workload;
  formCorrectionDebt(s: Record<string, any>, supplied?: unknown, renderOpts?: { loadedWeightBytesPerParam?: number }): Record<string, any>;
  /* R2 additions (§1.2/§1.6; gate-6/7 surfaces) */
  evaluateAtPolicyBand(fn: (policyPoint: number) => number): PolicyBandResult;
  selectDefaultFleet(s: Record<string, any>, supplied?: unknown): DefaultFleetSelection;
  /* R3 (design memo D-1/D-2): the ONE default-membership derivation + its typed
     sensitivity record + the ONE exclusion formatter. */
  DEFAULT_FLEET_ID: string;
  /* Slice C (memo C-7/C-8/C-11): the fleet registry + wire-identity surface. */
  FLEETS: Record<string, { name: string; class: string; models: string[]; legs: Record<string, number>; attribution: string; representativeness: string }>;
  TOTAL_CASES: Record<string, { totalB: number; label: string; citation: string; isDefault?: boolean; derived?: boolean }>;
  TOTAL_CASE_SCOPE: string[];
  fleetBaselineBlend(fleetId: string, s: Record<string, any>, supplied?: unknown): Record<string, number> | null;
  HW_ORDER: string[];
  COMPANY_MODELS: Record<string, readonly string[]>;
  companyForModel(modelId: string): string | null;
  registryRows(): Record<string, any>;
  registryRowClass(id: string): "facility" | "programme" | null;
  coverageLedgerForModel(modelId: string): Record<string, any> | null;
  coverageSentenceParts(row: Record<string, any>): Record<string, any> | null;
  coverageClassForDonor(modelId: string | null | undefined, rowId: string, donorKey: string): Record<string, any>;
  coverageForFleetSections(sections: Array<Record<string, any>>, modelId?: string | null): Record<string, any>;
  validateFleetSections(fleet: Record<string, any>, opts?: { requireId?: boolean }): { ok: boolean; fleet?: Record<string, any>; errors: string[] };
  fleetSectionsSchema(): Record<string, any>;
  bandSchema(): Record<string, any>;
  dcRegions(): Record<string, any>;
  composeFleetFromDcRows(s: Record<string, any>, opts: { modelId: string; dcRows: string[]; fill: "generic-us" | "generic-cn"; id?: string; name?: string }): Record<string, any>;
  resolveFleetSections(s: Record<string, any>, renderOpts?: { customFleet?: Record<string, any> }): Array<Record<string, any>>;
  sectionBand(s: Record<string, any>, renderOpts?: { customFleet?: Record<string, any> }, opts?: { cornerEval?: (s: Record<string, any>, renderOpts: Record<string, any>) => number }): Record<string, any>;
  dialsFromRanges(ranges: Record<string, any>): Array<Record<string, any>>;
  mixRangesFromRanges(ranges: Record<string, any>): Record<string, any> | null;
  marginBand(m: ModelPreset, p: Perspective, sel: TrafficSel, dials: Array<Record<string, any>>,
    opts?: { base?: Record<string, any>; cornerEval?: (s: Record<string, any>, renderOpts?: Record<string, any>) => number; renderOpts?: Record<string, any> }): Record<string, any>;
  marginBandsPerDial(m: ModelPreset, p: Perspective, sel: TrafficSel, dials: Array<Record<string, any>>,
    opts?: { base?: Record<string, any>; cornerEval?: (s: Record<string, any>, renderOpts?: Record<string, any>) => number; renderOpts?: Record<string, any> }): Array<Record<string, any>>;
  mixBand(m: ModelPreset, p: Perspective, sel: TrafficSel, ranges: Record<string, any>,
    opts?: { base?: Record<string, any>; cornerEval?: (s: Record<string, any>, renderOpts?: Record<string, any>) => number; renderOpts?: Record<string, any> }): Record<string, any> | null;
  blendWeights(s: Record<string, any>): Record<string, number>;
  /* im-arc T4 fold (2026-08-24): the receipt now carries the SELECTED QUOTE, or says the row is
     unavailable and offers its declared replay. */
  registryPlanningRentReceipt(hwKey: string, s: Record<string, any>): {
    donorKey: string; value: number | null; basis: string; source: string;
    quoteId: string | null; rateClass: string | null; usdPerHr: any; term?: string; region?: string;
    configuration?: string; bundleScope?: string; asOf: string | null;
    unavailable: boolean; reason: string | null; replay?: any; planningPolicy?: string };
  coverageForPreset(modelId: string, override?: Record<string, any>): any;
  rentQuotesFor(hwKey: string): any[];
  rentQuoteByClass(hwKey: string, rateClass: string): any;
  hardwareRow(hwKey: string): any;
  registeredCapexFor(hw: any, s?: Record<string, any>): number;
  clusterOverheadFor(hwKey: string, s?: Record<string, any>): number;
  capexProvenanceFor(hwKey: string): string;
  pueBandForClass(facilityClass: string): any;
  tcoDefaultBands(): any;
  capitalRecoveryFactor(rate: number, lifeYears: number): number;
  capitalRecoveryIncrementHr(rate: number, lifeYears: number, financedCapital: number): number;
  capitalRecoveryDisclosure(s?: Record<string, any>, hwKey?: string): any;
  tierRenderOptions(tier: string): any;
  execSummaryRowState(rowId: string, m?: any, median?: any): any;
  DC_SCHEMA: any;
  RENT_POLICY: any;
  lessorSpread(hwKey: string, s: Record<string, any>, cfLeg?: Record<string, any>): { rentHr: number; tcoHr: number; ratio: number; impliedShare: number };
  /* `opts.shareOnly` returns the same four fields without the two discarded marginOnBasis
     workloads that only fill rentCostPerMtok / tcoCostPerMtok (im-t5, 2026-08-28). */
  blendedLessorSpread(s: Record<string, any>, renderOpts?: { customFleet?: Record<string, any> }, opts?: { shareOnly?: boolean }): { rentHr: number; tcoHr: number; ratio: number; impliedShare: number };
  procurementBasisFor(perspective: Perspective, model: ModelPreset): string | null;
  finalAnswer(): { subject: string; identity: string; planningPoint: Record<string, any>;
    membership: MembershipDerivation | null; policyBand: Record<string, any>;
    membershipSensitivity: Array<Record<string, any>> | null;
    lensSpan: Record<string, any> | null; trafficSpan: Record<string, any> | null;
    whatWouldChangeIt: string; evidenceAnnexId: string;
    /* FA higher-justifications (memo im4-fa-justifications v7 J-2) */
    higherJustifications: Array<{ groupId: string;
      claims: Array<{ id: string; source: string; verbatim: string | null; claimedFigures: string | null }>;
      whatItClaims: string; whatItDoesNotClaim: string; bridge: string; wouldFlip: string; links: string[] }>;
    decompositionLine: string; mostPlausible: Record<string, any>;
    tokens: Record<string, string | string[] | null> };
  deriveDefaultFleetMembership(fleetId: string, s: Record<string, any>, supplied?: unknown): MembershipDerivation | null;
  membershipSensitivity(fleetId: string, s: Record<string, any>, supplied?: unknown): Array<{ policyPoint: number; wouldEnter: string[]; wouldLeave: string[] }> | null;
  membershipExclusionClause(membership: MembershipDerivation | null | undefined): string;
  centralEligibilityDecision(profile: FleetEvidenceProfile | null): boolean;
  heroSuppressionDecision(profile: FleetEvidenceProfile | null): boolean;
  landingHeroSuppressed(s: Record<string, any>, supplied?: unknown, mode?: "policy-labeled" | "suppress"): boolean;
  workloadAtNShard(s: Record<string, any>, nShardCasesByHw: Record<string, NShardTopologyCase>, activeOverride?: number, context?: { modelId: string; profileId: string | null; customDonor?: string }): Workload;
  fleetRenderableClause(fleetRenderable: FleetRenderable | null | undefined, primary: boolean): string;
  replicaWidthSensitivityClause(fleetRenderable: FleetRenderable | null | undefined): string;
  fleetRenderableDisclosure(fleetRenderable: FleetRenderable | null | undefined, primary: boolean, membership?: MembershipDerivation | null): string;
  lensSpanMembershipNote(spanRes: LensSpanResult | null | undefined): string;
  feasibility(s: Record<string, any>, context?: { modelId: string; profileId: string | null; customDonor?: string }): Feasibility;
  feasibilityAtNShard(s: Record<string, any>, nShardCasesByHw: Record<string, NShardTopologyCase>, context?: { modelId: string; profileId: string | null; customDonor?: string }): Feasibility;
  bucketForMargin(marginPct: number): MarginBucket | null;
  claimBucketRelations(claim: MarginClaim): Array<{ bucketId: string; relation: string }>;
  claimsForBucket(bucketId: string): Array<{ claim: MarginClaim; relation: string }>;
  provenanceTierLabel(c: MarginClaim): string;
  changedFieldsFromCentral(p: Perspective): number;
  rankExplorations(list?: Perspective[]): Perspective[];
  explorationFlagshipMargin(p: Perspective): number;
  explorationFlagshipWorkload(p: Perspective): Workload;
  explorationComputedBucket(p: Perspective): MarginBucket | null;
}
