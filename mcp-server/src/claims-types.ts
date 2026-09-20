/* R2 claim-contract TYPES — shared verbatim by the Node package and the Worker build.
   The runtime bridge lives in claims.ts (Node: createRequire) and
   worker/overrides/claims.ts (Worker: bundler import) — BOTH resolve to the ONE
   runtime source of truth, site/engine-contracts-v22.js; this package never
   re-implements a contract. */
/* R2 claim contracts on the MCP side — TS DISCRIMINATED UNIONS over the migrated
   engine contracts (im4-r2-shipment-plan §1.1; harness-R1 assignment: type-level
   closure lands with R2 on the MCP transports; the WeakSet-brand runtime lives in
   site/engine-contracts-v22.js — ONE runtime source of truth, typed here).

   The unions make illegal states unrepresentable at compile time: a claim is EITHER
   `central-verified` (mintable only by the engine's private constructor — this module
   exposes no way to build one from a literal) OR `policy-scenario` (which alone may
   carry centralRefusals). Trust NEVER lives in the string: `isCentral` narrows via the
   runtime capability brand. */

/* ---------- node algebra (discriminated on `kind`) ---------- */
export type TypedMissingState = "missing" | "infeasible" | "suppressed" | "unverified";
export type LeafValue = number | { readonly lo: number; readonly hi: number };
export interface PresentLeaf { readonly kind: "leaf"; readonly key: string; readonly state: "present"; readonly value: LeafValue }
export interface MissingLeaf { readonly kind: "leaf"; readonly key: string; readonly state: TypedMissingState; readonly reason: string }
export type LeafNode = PresentLeaf | MissingLeaf;
export type ScalarType = "string" | "number" | "boolean" | "null";
export interface ScalarNode { readonly kind: "scalar"; readonly type: ScalarType; readonly value: string | number | boolean | null }
export interface RecordNode { readonly kind: "record"; readonly fields: { readonly [field: string]: ContractNode } }
export interface VectorNode { readonly kind: "vector"; readonly itemIds: readonly string[]; readonly items: { readonly [id: string]: ContractNode } }
export interface PolicyLensGridNode {
  readonly kind: "policy-lens-grid";
  readonly policyPoints: readonly number[];
  readonly lenses: readonly string[];
  readonly cells: { readonly [cell: string]: ContractNode };
}
export type ContractNode = LeafNode | ScalarNode | RecordNode | VectorNode | PolicyLensGridNode;

export type DiscontinuityType = "width" | "feasibility" | "membership";
export type PlainData = null | string | number | boolean | readonly PlainData[] | { readonly [k: string]: PlainData };
export interface DiscontinuityRecord {
  readonly kind: "discontinuity";
  readonly type: DiscontinuityType;
  readonly at: PlainData;
  readonly invalidatedMetricKeys: readonly string[];
  readonly note: string | null;
}
export interface ContractTree {
  readonly nodes: { readonly [name: string]: ContractNode };
  readonly discontinuities: readonly DiscontinuityRecord[];
}

/* ---------- claims (discriminated on `identity`) ---------- */
export type ClaimRole = "result" | "comparison";
export type ClaimIdentity = "central-verified" | "policy-scenario";
export interface CentralVerifiedClaim {
  readonly subject: string;
  readonly estimand: string;
  readonly evidenceBasis: PlainData;
  /* Role scoping (Skeptic, adopted): only a separately-typed comparison claim may be
     central — the type system enforces what the constructor enforces. */
  readonly role: "comparison";
  readonly identity: "central-verified";
  readonly tree: ContractTree;
}
export interface PolicyScenarioClaim {
  readonly subject: string;
  readonly estimand: string;
  readonly evidenceBasis: PlainData;
  readonly role: ClaimRole;
  readonly identity: "policy-scenario";
  readonly centralRefusals?: readonly string[];
  readonly tree: ContractTree;
}
export type Claim = CentralVerifiedClaim | PolicyScenarioClaim;

export interface EmptyComparisonSlot {
  readonly subject: string;
  readonly role: "comparison";
  readonly identity: "policy-scenario";
  readonly empty: true;
  readonly statement: string;
}

export interface MintSpec {
  subject: string;
  estimand: string;
  evidenceBasis: PlainData;
  role: ClaimRole;
  tree: ContractTree;
  requestCentral?: boolean;
  legs?: ReadonlyArray<{ id: string; weight: number; renderableUnderPolicy?: boolean; placementVerified?: boolean }>;
  clusters?: ReadonlyArray<{ clusterId: string; verified: boolean }>;
  derivation?: { policyTainted: boolean };
  selectionReceipt?: { clean: boolean; basis: string };
}

/* ---------- emission boundary ---------- */
/* b9 M6: this union was ALREADY STALE — it lacked `final-answer`, which entered the
   closed set at R3. M6 fixes that pre-existing drift while adding its own class. */
export type EmitterClass =
  | "hero-tile" | "hardware-lens-tile" | "identity-strip" | "evidence-board"
  | "share-string" | "mcp-json" | "mcp-text" | "report-dossier"
  | "final-answer" | "executive-summary";
export interface FleetRenderableFields {
  readonly renderableLegs: number;
  readonly totalLegs: number;
  readonly renderableWeightShare: number;
}
export interface DisplayProjection {
  readonly displayed: number;
  readonly canonical: number;
  readonly precisionNote: string | null;
}
export interface EmissionEnvelope {
  readonly claim: Claim;
  readonly visibleText?: string;
  readonly leadSentence?: string;
  readonly weld?: string;
  readonly display?: DisplayProjection;
  readonly envelopeFields?: FleetRenderableFields;
}
export interface Adapter {
  render(envelope: EmissionEnvelope): string;
  recover(artifact: string): Record<string, unknown>;
}
export interface SidecarEntry {
  readonly claimId: string;
  readonly emitterId: string;
  readonly pointer: string;
  readonly identity: ClaimIdentity;
  readonly metricKeys: readonly string[];
}
export interface SidecarStore {
  record(emitterId: string, envelope: EmissionEnvelope, artifact: string): void;
  entries(): SidecarEntry[];
}
export interface CoverageReport {
  readonly registered: readonly string[];
  readonly emitted: readonly string[];
  readonly attempted: readonly string[];
  readonly complete: boolean;
  readonly missing: readonly string[];
  readonly unregisteredAttempts: readonly string[];
}

/* ---------- the typed runtime surface (ONE runtime: the engine contracts module) ---------- */
export interface EngineContracts {
  readonly POLICY_POINTS: readonly number[];
  readonly TYPED_MISSING_STATES: readonly TypedMissingState[];
  readonly EMITTER_CLASSES: readonly EmitterClass[];
  readonly WELD_REQUIRED_CLASSES: readonly EmitterClass[];
  readonly CLAIM_ROLES: readonly ClaimRole[];
  readonly IDENTITIES: readonly ClaimIdentity[];
  readonly CLEAN_SELECTION_BASES: readonly string[];
  readonly DISCONTINUITY_TYPES: readonly DiscontinuityType[];
  metricKey(metricId: string, scope: Record<string, string | number | boolean>): string;
  leaf(metricId: string, scope: Record<string, string | number | boolean>, value: LeafValue): PresentLeaf;
  stateLeaf(metricId: string, scope: Record<string, string | number | boolean>, state: TypedMissingState, reason: string): MissingLeaf;
  scalar(value: string | number | boolean | null): ScalarNode;
  record(fields: Record<string, ContractNode>): RecordNode;
  vector(itemIds: readonly string[], itemsById: Record<string, ContractNode>): VectorNode;
  policyLensGrid(policyPoints: readonly number[], lenses: readonly string[],
    cellFn: (p: number, l: string) => ContractNode): PolicyLensGridNode;
  sampledSummary(grid: PolicyLensGridNode, lens: string): Record<string, unknown>;
  discontinuity(type: DiscontinuityType, at: PlainData, invalidatedMetricKeys: readonly string[], note?: string | null): DiscontinuityRecord;
  applyDiscontinuity(t: ContractTree, disc: DiscontinuityRecord): ContractTree;
  tree(nodes: Record<string, ContractNode>, discontinuities?: readonly DiscontinuityRecord[]): ContractTree;
  canonicalTree(t: ContractTree): { nodes: unknown[]; discontinuities: unknown[] };
  treesSemanticallyEqual(a: ContractTree, b: ContractTree): boolean;
  treeLeafKeys(t: ContractTree): string[];
  mintClaim(spec: MintSpec): Claim;
  /* Narrowing is by the RUNTIME capability brand — the identity string alone can never
     narrow to CentralVerifiedClaim (a forged literal fails this predicate). */
  isCentral(claim: unknown): claim is CentralVerifiedClaim;
  aggregateClaims(claims: readonly Claim[], spec: MintSpec): Claim;
  emptyComparisonSlot(subject: string): EmptyComparisonSlot;
  registerEmitter(id: string, emitterClass: EmitterClass, adapter: Adapter): void;
  emit(id: string, envelope: EmissionEnvelope, sidecarStore?: SidecarStore): string;
  coverageReport(): CoverageReport;
  registeredClasses(): EmitterClass[];
  resetBoundaryForTest(): void;
  weldClause(fleetRenderable: FleetRenderableFields | null | undefined): string;
  displayValue(canonical: number, decimals?: number): DisplayProjection;
  claimIdOf(claim: Claim): string;
  escapePointerSegment(seg: string | number): string;
  resolvePointer(doc: unknown, pointer: string): unknown;
  machineDocOf(artifact: string): { claims: Array<Record<string, unknown>> } | null;
  makeSidecarStore(): SidecarStore;
  readonly jsonAdapter: Adapter;
  readonly mcpTextAdapter: Adapter;
  readonly domAdapter: Adapter;
  sha256Hex(s: string): string;
}

