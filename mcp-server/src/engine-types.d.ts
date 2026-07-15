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
}

export interface LensSpanResult {
  lo: number;
  hi: number;
  n: number;
  single: boolean;
  contributors: Array<{ id: string; ioRatio: number; cacheHit: number; margin: number }>;
  ioRatio: number;
  cacheHit: number;
  label: string;
}

export interface Feasibility {
  domKey: string;
  gpus: number;
  gb: number;
  racks: number;
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

  applyPresetSettings(m: ModelPreset, p: Perspective, sel?: TrafficSel): Record<string, any>;
  resolveTraffic(m: ModelPreset, p: Perspective | null, sel?: TrafficSel): ResolvedTraffic;
  lensSpan(m: ModelPreset, sel?: TrafficSel): LensSpanResult | null;
  pairingWarning(m: ModelPreset, p: Perspective): string;
  pairingSeverity(m: ModelPreset, p: Perspective): "hard" | "soft" | "ok";
  encodeScenario(S: Record<string, any>, modelId: string, perspId: string, traffic: { mode: string; profileId?: string | null; ioRatio: number; cacheHit: number }, modifiedFrom?: string | null): string;
  decodeScenario(str: string): Record<string, any> | null;
  sanitizeScenarioDiff(diff: Record<string, unknown> | undefined, traffic: { locked: boolean } | null): { diff: Record<string, any>; rejected: string[] };
  overlayDivergesFromReplay(m: ModelPreset, p: Perspective, cleanDiff: Record<string, unknown>): boolean;
  normalizePerspId(id: string): string;
  workload(s: Record<string, any>, activeOverride?: number): Workload;
  feasibility(s: Record<string, any>): Feasibility;
  bucketForMargin(marginPct: number): MarginBucket | null;
  claimBucketRelations(claim: MarginClaim): Array<{ bucketId: string; relation: string }>;
  claimsForBucket(bucketId: string): Array<{ claim: MarginClaim; relation: string }>;
  provenanceTierLabel(c: MarginClaim): string;
  changedFieldsFromCentral(p: Perspective): number;
  rankExplorations(list?: Perspective[]): Perspective[];
  explorationFlagshipMargin(p: Perspective): number;
  explorationComputedBucket(p: Perspective): MarginBucket | null;
}
