// Projection of the frozen producer catalogue; test pins this catalogue byte-for-byte.
import { z } from "zod";
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
const json: z.ZodType<Json> = z.lazy(() => z.union([z.null(),z.boolean(),z.number().finite(),z.string(),z.array(json),z.record(json)]));
export interface Metadata {
  assessment_as_of: string;
  contract_version: string;
  contract_digest: string;
  presentation_version: string;
  release_id: string | null;
  schema_version: number;
}
export interface SiteData extends Metadata {
  sites: Array<Site>;
}
export interface GeoJSON extends Metadata {
  type: string;
  features: Array<Feature>;
}
export interface Summary extends Metadata {
  sites: number;
  entity_details: number;
  with_coordinates: number;
  campus_pin_eligible: number;
  identity_resolved: number;
  identity_unresolved: number;
  nonphysical_entities: number;
  estimate_only_sites: number;
  estimate_only_entities: number;
  unknown_capacity_sites: number;
  mw_known_sites: number;
  bounded_capacity_sites: number;
  coverage_overlaps: Array<Overlap>;
  by_country: Record<string, Bucket>;
  by_status: Record<string, Bucket>;
  by_owner: Record<string, Bucket>;
  observation_date_range: DateRange | null;
  aggregation_receipts: Array<AggregationReceipt>;
  note: string;
}
export interface Site {
  locality: string | null;
  admin1: string | null;
  address: string | null;
  alias: string | null;
  operator: string | null;
  utility: Evidence | null;
  evidence_by_field: Record<string, PresentedEvidence[]>;
  country: string | null;
  owner: string | null;
  entity_type: string | null;
  presentation_campus_id: string | null;
  status_value: string | null;
  reviewed_at: string | null;
  slug: string;
  name: string;
  identity_resolved: boolean;
  identity_promoted: boolean;
  operational: boolean;
  estimate_only: boolean;
  planned: Array<Evidence>;
  estimates: Array<Evidence>;
  tenants: Array<Evidence>;
  relationships: Array<Evidence>;
  contracts: Array<Evidence>;
  generation: Array<Evidence>;
  financing: Array<Evidence>;
  incentives: Array<Evidence>;
  tariff: Array<Evidence>;
  tariff_applicability: Array<Evidence>;
  contracted_price_observations: Array<Evidence>;
  phase_ids: Array<string>;
  coordinates: Evidence | null;
  lat: number | null;
  lng: number | null;
  publication: Publication;
  headline_mw: Capacity | null;
  capacity_contributions: Array<Capacity>;
  campus_capacity: CampusCapacity | null;
  evidence_mix: Record<string, number>;
  status: Evidence | null;
  phase_statuses: Array<PhaseStatus>;
  expansion: Expansion;
  excluded_observations: Array<ExcludedEvidence>;
  schedule: Array<Schedule>;
  supplies_entity_ids: Array<string>;
  contracted_usd_per_kwh: Evidence | null;
  pue: Evidence | null;
  gaps: Array<Gap>;
  reports: Array<Report>;
  dives: Array<string>;
  reviewed_field_groups: Record<string, string>;
  eligibility_receipts: Array<EligibilityReceipt>;
}
export interface PresentedEvidence extends Evidence { disposition: string; }
export interface Evidence {
  unit: string | null;
  scope: string | null;
  as_of: string | null;
  observation_kind: string | null;
  measurement_boundary: string | null;
  capacity_state: string | null;
  phase_id: string | null;
  service_boundary_id: string | null;
  valid_from: string | null;
  valid_to: string | null;
  quantity_kind: string | null;
  quantity_basis: string | null;
  central_estimate: string | null;
  field: string;
  entity_id: string;
  evidence_id: string;
  basis: string;
  label: string;
  claim_nature: string;
  record_kind: string;
  source_kind: string;
  value: Json;
  coverage_entity_ids: Array<string> | null;
  as_of_window: Json | null;
  sources: Array<Source>;
}
export interface Capacity extends Evidence {
  mw: number | null;
  kind: string;
  bounds: Bounds;
  central_estimate: string;
}
export interface ExcludedEvidence extends Evidence {
  reason: string;
}
export interface Source {
  url: string;
  pub_date: string | null;
  snapshot_status: string | null;
}
export interface Bounds {
  lo: number | null;
  mid: number | null;
  hi: number | null;
}
export interface DateRange {
  start: string;
  end: string;
}
export interface Publication {
  campus_pin: string;
  capacity_marker: string;
}
export interface CampusCapacity {
  mw: number | null;
  bounds: Bounds;
  central_estimate: string;
  evidence_ids: Array<string>;
  observation_date_range: DateRange | null;
}
export interface PhaseStatus {
  phase_id: string;
  status: Evidence;
}
export interface Expansion {
  status: string | null;
  phase_ids: Array<string>;
}
export interface Schedule {
  key: string;
  milestone: string;
  phase: string | null;
  baseline: Evidence | null;
  latest_target: Evidence | null;
  event: Evidence | null;
  baseline_assessment: Assessment;
  latest_assessment: Assessment | null;
}
export interface Assessment {
  assessment: string;
  timing_difference_days: Array<NullableNumber> | null;
  formula: string;
  assessment_as_of: string;
  baseline_target_id: string | null;
  revised: boolean;
}
export type NullableNumber = number | null;
export interface Gap {
  gap_id: string;
  gap_ref: string | null;
  ts: string;
  slug: string;
  entity_id: string;
  field: string;
  scope: string | null;
  status: string;
  resolved_by: string | null;
  search_protocol_ref: string;
  searched_query_ids: Array<string>;
  note: string | null;
  next_trigger: string | null;
  run_id: string;
  schema_version: number;
}
export interface Report {
  report_id: string;
  run_id: string;
  kind: string;
  slug: string;
  content_hash: string;
  path: string;
  evidence_ids: Array<string>;
  reviewer: string;
  reviewed_at: string;
  contract_version: string;
  contract_digest: string;
  record_kind: string;
  schema_version: number;
}
export interface EligibilityReceipt {
  evidence_id: string;
  map?: string;
  aggregate?: string;
  calculator?: string;
}
export interface Overlap {
  evidence_ids: Array<string>;
  coverage_entity_ids: Array<string>;
  reason: string;
}
export interface AggregationReceipt {
  evidence_id: string;
  bounds: Bounds;
  central_estimate: string;
  observation_kind: string;
  presentation_campus_id: string;
  observation_date_range: DateRange | null;
}
export interface Bucket {
  sites: number;
  mw_known_sites: number;
  estimate_only_sites: number;
  unknown_capacity_sites: number;
  bounded_capacity_sites: number;
  mw: number | null;
  mw_bounds: Bounds;
  observation_date_range: DateRange | null;
}
export interface Feature {
  type: string;
  geometry: Geometry;
  properties: FeatureProperties;
}
export interface Geometry {
  type: string;
  coordinates: Array<number>;
}
export interface FeatureProperties {
  slug: string;
  name: string;
  entity_type: string;
  mw: number | null;
  mw_bounds: Bounds | null;
  central_estimate: string | null;
  capacity_evidence_ids: Array<string>;
  observation_date_range: DateRange | null;
  mw_kind: string | null;
  estimate_only: boolean;
  pin: string;
  capacity_marker: string;
  precision: string;
}
export interface FixtureManifest extends Metadata {
  fixture_only: boolean;
  fixture_format: string;
  fixture_name: string;
  artifacts: Record<string, string>;
}
export const catalogue = {"presentation_version":"dc-map/site-data/v2","artifacts":{"site-data.json":"SiteData","sites.geojson":"GeoJSON","summary.json":"Summary","manifest.json":"FixtureManifest"},"types":{"Metadata":{"required":{"assessment_as_of":"string","contract_version":"string","contract_digest":"string","presentation_version":"string","release_id":"string|null","schema_version":"integer"},"optional":{}},"SiteData":{"required":{"sites":"Site[]"},"optional":{},"extends":["Metadata"]},"GeoJSON":{"required":{"type":"string","features":"Feature[]"},"optional":{},"extends":["Metadata"]},"Summary":{"required":{"sites":"integer","entity_details":"integer","with_coordinates":"integer","campus_pin_eligible":"integer","identity_resolved":"integer","identity_unresolved":"integer","nonphysical_entities":"integer","estimate_only_sites":"integer","estimate_only_entities":"integer","unknown_capacity_sites":"integer","mw_known_sites":"integer","bounded_capacity_sites":"integer","coverage_overlaps":"Overlap[]","by_country":"map<Bucket>","by_status":"map<Bucket>","by_owner":"map<Bucket>","observation_date_range":"DateRange|null","aggregation_receipts":"AggregationReceipt[]","note":"string"},"optional":{},"extends":["Metadata"]},"Site":{"required":{"country":"string|null","owner":"string|null","entity_type":"string|null","presentation_campus_id":"string|null","status_value":"string|null","reviewed_at":"string|null","slug":"string","name":"string","identity_resolved":"boolean","identity_promoted":"boolean","operational":"boolean","estimate_only":"boolean","planned":"Evidence[]","estimates":"Evidence[]","tenants":"Evidence[]","relationships":"Evidence[]","contracts":"Evidence[]","generation":"Evidence[]","financing":"Evidence[]","incentives":"Evidence[]","tariff":"Evidence[]","tariff_applicability":"Evidence[]","contracted_price_observations":"Evidence[]","phase_ids":"string[]","coordinates":"Evidence|null","lat":"number|null","lng":"number|null","publication":"Publication","headline_mw":"Capacity|null","capacity_contributions":"Capacity[]","campus_capacity":"CampusCapacity|null","evidence_mix":"map<integer>","status":"Evidence|null","phase_statuses":"PhaseStatus[]","expansion":"Expansion","excluded_observations":"ExcludedEvidence[]","schedule":"Schedule[]","supplies_entity_ids":"string[]","contracted_usd_per_kwh":"Evidence|null","pue":"Evidence|null","gaps":"Gap[]","reports":"Report[]","dives":"string[]","reviewed_field_groups":"map<string>","eligibility_receipts":"EligibilityReceipt[]","locality":"string|null","admin1":"string|null","address":"string|null","alias":"string|null","operator":"string|null","utility":"Evidence|null","evidence_by_field":"map<PresentedEvidence[]>"},"optional":{}},"Evidence":{"required":{"unit":"string|null","scope":"string|null","as_of":"string|null","observation_kind":"string|null","measurement_boundary":"string|null","capacity_state":"string|null","phase_id":"string|null","service_boundary_id":"string|null","valid_from":"string|null","valid_to":"string|null","quantity_kind":"string|null","quantity_basis":"string|null","central_estimate":"string|null","field":"string","entity_id":"string","evidence_id":"string","basis":"string","label":"string","claim_nature":"string","record_kind":"string","source_kind":"string","value":"json","coverage_entity_ids":"string[]|null","as_of_window":"json|null","sources":"Source[]"},"optional":{}},"Capacity":{"required":{"mw":"number|null","kind":"string","bounds":"Bounds","central_estimate":"string"},"optional":{},"extends":["Evidence"]},"ExcludedEvidence":{"required":{"reason":"string"},"optional":{},"extends":["Evidence"]},"Source":{"required":{"url":"string","pub_date":"string|null","snapshot_status":"string|null"},"optional":{}},"Bounds":{"required":{"lo":"number|null","mid":"number|null","hi":"number|null"},"optional":{}},"DateRange":{"required":{"start":"string","end":"string"},"optional":{}},"Publication":{"required":{"campus_pin":"string","capacity_marker":"string"},"optional":{}},"CampusCapacity":{"required":{"mw":"number|null","bounds":"Bounds","central_estimate":"string","evidence_ids":"string[]","observation_date_range":"DateRange|null"},"optional":{}},"PhaseStatus":{"required":{"phase_id":"string","status":"Evidence"},"optional":{}},"Expansion":{"required":{"status":"string|null","phase_ids":"string[]"},"optional":{}},"Schedule":{"required":{"key":"string","milestone":"string","phase":"string|null","baseline":"Evidence|null","latest_target":"Evidence|null","event":"Evidence|null","baseline_assessment":"Assessment","latest_assessment":"Assessment|null"},"optional":{}},"Assessment":{"required":{"assessment":"string","timing_difference_days":"NullableNumber[]|null","formula":"string","assessment_as_of":"string","baseline_target_id":"string|null","revised":"boolean"},"optional":{}},"NullableNumber":"number|null","Gap":{"required":{"gap_id":"string","gap_ref":"string|null","ts":"string","slug":"string","entity_id":"string","field":"string","scope":"string|null","status":"string","resolved_by":"string|null","search_protocol_ref":"string","searched_query_ids":"string[]","note":"string|null","next_trigger":"string|null","run_id":"string","schema_version":"integer"},"optional":{}},"Report":{"required":{"report_id":"string","run_id":"string","kind":"string","slug":"string","content_hash":"string","path":"string","evidence_ids":"string[]","reviewer":"string","reviewed_at":"string","contract_version":"string","contract_digest":"string","record_kind":"string","schema_version":"integer"},"optional":{}},"EligibilityReceipt":{"required":{"evidence_id":"string"},"optional":{"map":"string","aggregate":"string","calculator":"string"}},"Overlap":{"required":{"evidence_ids":"string[]","coverage_entity_ids":"string[]","reason":"string"},"optional":{}},"AggregationReceipt":{"required":{"evidence_id":"string","bounds":"Bounds","central_estimate":"string","observation_kind":"string","presentation_campus_id":"string","observation_date_range":"DateRange|null"},"optional":{}},"Bucket":{"required":{"sites":"integer","mw_known_sites":"integer","estimate_only_sites":"integer","unknown_capacity_sites":"integer","bounded_capacity_sites":"integer","mw":"number|null","mw_bounds":"Bounds","observation_date_range":"DateRange|null"},"optional":{}},"Feature":{"required":{"type":"string","geometry":"Geometry","properties":"FeatureProperties"},"optional":{}},"Geometry":{"required":{"type":"string","coordinates":"number[]"},"optional":{}},"FeatureProperties":{"required":{"slug":"string","name":"string","entity_type":"string","mw":"number|null","mw_bounds":"Bounds|null","central_estimate":"string|null","capacity_evidence_ids":"string[]","observation_date_range":"DateRange|null","mw_kind":"string|null","estimate_only":"boolean","pin":"string","capacity_marker":"string","precision":"string"},"optional":{}},"FixtureManifest":{"required":{"fixture_only":"boolean","fixture_format":"string","fixture_name":"string","artifacts":"map<string>"},"optional":{},"extends":["Metadata"]},"PresentedEvidence":{"required":{"disposition":"string"},"optional":{},"extends":["Evidence"]}}} as const;
const schemas: Record<string,z.ZodTypeAny> = {};
function schemaFor(spec: string): z.ZodTypeAny {
 if (spec.includes('|')) { const parts=spec.split('|').map(schemaFor); return z.union(parts as [z.ZodTypeAny,z.ZodTypeAny,...z.ZodTypeAny[]]); }
 if (spec.endsWith('[]')) return z.array(schemaFor(spec.slice(0,-2)));
 if (spec.startsWith('map<')) return z.record(schemaFor(spec.slice(4,-1)));
 const primitives: Record<string,z.ZodTypeAny> = {string:z.string(),number:z.number().finite(),integer:z.number().int().nonnegative(),boolean:z.boolean(),null:z.null(),json};
 return primitives[spec] ?? z.lazy(()=>schemas[spec]);
}
function fields(name: string): Record<string,z.ZodTypeAny> {
 const d=catalogue.types[name as keyof typeof catalogue.types];
 if(typeof d==='string') return {};
 const result: Record<string,z.ZodTypeAny>={};
 if ('extends' in d) for(const base of d.extends) Object.assign(result,fields(base));
 for(const [k,v] of Object.entries(d.required)) result[k]=schemaFor(v);
 for(const [k,v] of Object.entries(d.optional)) result[k]=schemaFor(v).optional();
 return result;
}
for(const [name,d] of Object.entries(catalogue.types)) schemas[name]=typeof d==='string'?schemaFor(d):z.object(fields(name)).strict();
export const SiteDataSchema = schemas.SiteData as z.ZodType<SiteData>;
export const SummarySchema = schemas.Summary as z.ZodType<Summary>;
export const GeoJSONSchema = schemas.GeoJSON as z.ZodType<GeoJSON>;
export const EvidenceSchema = schemas.Evidence as z.ZodType<Evidence>;
export const SiteSchema = schemas.Site as z.ZodType<Site>;
export const ScheduleSchema = schemas.Schedule as z.ZodType<Schedule>;
export const BoundsSchema = schemas.Bounds as z.ZodType<Bounds>;
export const DateRangeSchema = schemas.DateRange as z.ZodType<DateRange>;
export const OverlapSchema = schemas.Overlap as z.ZodType<Overlap>;
export const JsonSchema = json;
