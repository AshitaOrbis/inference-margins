import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ReleaseIdSchema } from './release.js';
import { id, finite, nonnegative, BandSchema, ReceiptSchema, ScenarioBundleSchema, AssumptionSchema, ComparisonProfileSchema } from './types.js';
import { ComparisonRequestSchema } from './scenario.js';
import { SiteSchema, EvidenceSchema, ScheduleSchema, BoundsSchema, DateRangeSchema, OverlapSchema, JsonSchema } from './presentation.js';

export const TOOL_NAMES = ['list_datacenters','get_datacenter','rank_datacenters','datacenter_schedule',
  'datacenter_impact','datacenter_stakeholders','price_token_from_site','list_scenario_space'] as const;
export type ToolName = typeof TOOL_NAMES[number];
const requestedRelease = {release_id: ReleaseIdSchema.optional()};
export const ListDatacentersInputSchema = z.object({...requestedRelease,
  country: id.optional(), owner: id.optional(), status: id.optional(), query: z.string().max(500).optional(),
  min_capacity_mw: nonnegative.optional(), unknown_capacity: z.boolean().optional(),
  include_nonphysical: z.boolean().default(false), include_components: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(25), cursor: z.string().max(4000).optional(),
}).strict();
export const GetDatacenterInputSchema = z.object({...requestedRelease,site_id:id}).strict();
export const RankDatacentersInputSchema = ComparisonRequestSchema.extend({...requestedRelease,scenarios:z.array(ScenarioBundleSchema).min(1).max(100)}).strict();
export const DatacenterScheduleInputSchema = GetDatacenterInputSchema.extend({milestone:id.optional(),phase_id:id.optional()}).strict();
export const DatacenterStakeholdersInputSchema = GetDatacenterInputSchema;
export const PriceTokenFromSiteInputSchema = z.object({...requestedRelease,scenario:ScenarioBundleSchema}).strict();
export const DatacenterImpactInputSchema = z.object({...requestedRelease,baseline:ScenarioBundleSchema,replacement:ScenarioBundleSchema,
  allocation:z.object({share:nonnegative.max(1),assumption:AssumptionSchema}).strict().optional()}).strict();
export const ListScenarioSpaceInputSchema = z.object(requestedRelease).strict();
export const InputSchemas = {
  list_datacenters:ListDatacentersInputSchema,get_datacenter:GetDatacenterInputSchema,rank_datacenters:RankDatacentersInputSchema,
  datacenter_schedule:DatacenterScheduleInputSchema,datacenter_impact:DatacenterImpactInputSchema,
  datacenter_stakeholders:DatacenterStakeholdersInputSchema,price_token_from_site:PriceTokenFromSiteInputSchema,
  list_scenario_space:ListScenarioSpaceInputSchema,
} as const;
export type ToolInputs = {[K in ToolName]:z.input<typeof InputSchemas[K]>};

export const NotApplicableSelectionSchema=z.object({state:z.literal('not-applicable'),reason:z.string().min(1)}).strict();
const selectionShared={this_result_pct:finite.nullable(),is_central:z.boolean(),selection_origin:z.string(),changed_from_central:z.array(z.string()),
  five_status:z.record(z.string()).nullable(),renderable_under_policy_all_legs:z.boolean().nullable(),placement_verified:z.boolean().nullable(),
  residency_basis:z.string().nullable(),policy_sensitivity:JsonSchema.nullable(),policy_sensitivity_scope:z.string().nullable(),default_membership:JsonSchema.nullable()};
export const PolicySelectionSchema=z.object({...selectionShared,is_central:z.literal(false),policy_scenario_pct:finite.nullable(),
  policy_scenario_renderable_legs:nonnegative.int(),policy_scenario_total_legs:nonnegative.int(),policy_scenario_renderable_weight_share:nonnegative.max(1),
  policy_scenario_note:z.string(),policy_scenario_scope:z.string(),central_ineligibility_reasons:z.array(z.string())}).strict();
export const CentralSelectionSchema=z.object({...selectionShared,central_estimate_pct:finite,
  central_estimate_renderable_legs:nonnegative.int(),central_estimate_total_legs:nonnegative.int(),central_estimate_renderable_weight_share:nonnegative.max(1),
  central_estimate_note:z.string(),central_estimate_scope:z.string()}).strict();
/** Additive union: existing margin receipts retain their shape; factual requests carry no baseline margin. */
export const SelectionReceiptSchema=z.union([NotApplicableSelectionSchema,PolicySelectionSchema,CentralSelectionSchema]);
export type SelectionReceipt=z.infer<typeof SelectionReceiptSchema>;
/** DESIGN §6: `price_token_from_site` is "the run_scenario envelope with site/pool evidence". The
 * existing run_scenario structuredContent (mcp-server/src/tools/run_scenario.ts) rides along as a
 * named sub-object, so U5 wires one envelope rather than reconciling two. Eight fields diverge from
 * that contract's semantics — the five transport-boundary nulls (central_comparator, share_url,
 * claims, claims_sidecar, site) plus lens_span.span, headline.value and headline.cited_range_context
 * — each named in full on `RunScenarioEnvelope` in src/legacy.ts. */
export const RunScenarioEnvelopeSchema=z.object({
  sentence:z.string().min(1),selection_receipt:SelectionReceiptSchema,
  headline:z.object({kind:z.string(),epistemic_status:z.string(),label:z.string(),value:z.string().nullable(),
    must_carry:z.array(z.string()),cited_range_context:z.string().nullable(),derived_from:z.string().nullable()}).strict(),
  central_comparator:JsonSchema,
  costs:z.object({blended_cost_usd_per_mtok:finite,realized_price_usd_per_mtok:finite,decode_cost_usd_per_mtok:finite,
    fresh_prefill_cost_usd_per_mtok:finite,cache_read_cost_usd_per_mtok:finite,perimeter_note:z.string()}).strict(),
  traffic:z.object({io_ratio:finite,cache_hit_pct:finite,mode:z.string(),locked:z.boolean(),label:z.string(),
    provenance:JsonSchema,selection_note:z.string().nullable()}).strict(),
  lens_span:z.object({span:z.string(),n_lenses:nonnegative.int(),traffic_label:z.string(),note:z.string()}).strict(),
  form_correction_debt:z.record(JsonSchema),feasibility:z.record(JsonSchema),
  pairing:z.object({severity:z.string(),warning:z.string().nullable()}).strict(),
  model_provenance:z.record(JsonSchema),perspective_provenance:z.record(JsonSchema),
  rejected_overrides:z.array(z.string()),corrections:z.array(JsonSchema),
  share_url:z.string().nullable(),share_note:z.string(),
  claims:z.array(JsonSchema).nullable(),claims_sidecar:z.array(JsonSchema).nullable(),
  engine:z.object({revision:z.string(),data_as_of:z.string()}).strict(),site:JsonSchema}).strict();
export const ModeledValueSchema=z.object({band:BandSchema,unit:id,status_fused:z.string().min(1),
  scope:z.object({result:z.literal('modeled'),inputs:z.array(z.enum(['modeled','disclosed','forecast']))}).strict()}).strict();
const ScenarioResultObjectSchema=z.object({status:z.enum(['modeled','insufficient-evidence']),sentence:z.string().min(1),release_id:ReleaseIdSchema,
  scenario_id:id.nullable(),site_id:id.nullable(),pool_id:id.nullable(),profile_hash:z.string().nullable(),value:ModeledValueSchema.nullable(),annual_cost:BandSchema.nullable(),
  cost_breakdown:z.array(z.object({component:id,annual:BandSchema}).strict()),missing:z.array(z.string()),receipts:z.array(ReceiptSchema),margin:z.string().nullable(),
  selection_receipt:SelectionReceiptSchema,engine:z.object({revision:z.string(),data_as_of:z.string()}).strict(),
  coverage:z.object({hardware:z.enum(['disclosed-key-count','hypothetical','unsplit','unresolved']),provider_allocation:z.literal('unresolved'),factual_coverage_increased:z.literal(false)}).strict(),
  throughput:z.object({input_tokens_per_second:nonnegative,output_tokens_per_second:nonnegative}).strict().nullable(),
  run_scenario:RunScenarioEnvelopeSchema.nullable(),
}).strict();
const scenarioInvariants=(v:z.infer<typeof ScenarioResultObjectSchema>,ctx:z.RefinementCtx)=>{
  if(v.status==='modeled'&&(!v.value||!v.annual_cost||v.missing.length))ctx.addIssue({code:'custom',message:'modeled result requires complete value and no missing components'});
  if(v.status==='insufficient-evidence'&&(v.value||v.annual_cost||!v.missing.length))ctx.addIssue({code:'custom',message:'insufficient evidence suppresses complete costs and names missing components'});
};
export const ScenarioResultSchema=ScenarioResultObjectSchema.superRefine((v,ctx)=>{scenarioInvariants(v,ctx);
  if(v.status==='modeled'&&!v.run_scenario)ctx.addIssue({code:'custom',message:'a modeled priced result carries the run_scenario envelope'});});
/** A comparison reads bands and overlap groups, never a per-scenario envelope; carrying one on each
 * entry more than doubles every result in the payload, so the entries state that it is absent. */
export const ComparisonScenarioSchema=ScenarioResultObjectSchema.superRefine((v,ctx)=>{scenarioInvariants(v,ctx);
  if(v.run_scenario)ctx.addIssue({code:'custom',message:'comparison entries carry no per-scenario run_scenario envelope'});});
const ExcludedScenarioSchema=z.object({scenario_id:id.nullable(),site_id:id.nullable(),reasons:z.array(z.string()).min(1)}).strict();
export const ComparisonResultSchema=z.object({status:z.enum(['modeled','insufficient-evidence']),sentence:z.string(),release_id:ReleaseIdSchema,profile_hash:z.string().nullable(),
  metric_definition:z.string(),ordering_basis:z.string(),eligible:z.array(ComparisonScenarioSchema),
  groups:z.array(z.object({group:nonnegative.int(),scenario_ids:z.array(id),bounds:z.object({lo:nonnegative,hi:nonnegative}).strict(),interpretation:z.string()}).strict()),
  excluded:z.array(ExcludedScenarioSchema),receipts:z.array(ReceiptSchema),selection_receipt:SelectionReceiptSchema}).strict();
const capacity=z.object({bounds:BoundsSchema,evidence_ids:z.array(id),observation_date_range:DateRangeSchema.nullable(),exclusions:z.array(OverlapSchema),note:z.string()}).strict();
const coverage=z.object({default_sites:nonnegative.int(),returned_details:nonnegative.int(),total_matching_details:nonnegative.int(),excluded_details:nonnegative.int(),
  nonphysical_entities:nonnegative.int(),unknown_capacity_sites:nonnegative.int(),bounded_capacity_sites:nonnegative.int()}).strict();
export const ListDatacentersDataSchema=z.object({sites:z.array(SiteSchema),coverage,capacity,next_cursor:z.string().nullable()}).strict();
const unavailable=z.object({status:z.literal('not-exported'),reason:z.string()}).strict();
export const GetDatacenterDataSchema=z.object({site:SiteSchema,promoted_evidence:z.array(EvidenceSchema),conflicts:unavailable,
  scenarios:z.array(ScenarioResultSchema),scenario_note:z.string()}).strict();
export const DatacenterScheduleDataSchema=z.object({site_id:id,schedule:z.array(ScheduleSchema),revisions:z.array(EvidenceSchema),assessment_as_of:z.string(),
  revision_history_complete:z.literal(false),note:z.string()}).strict();
export const DatacenterStakeholdersDataSchema=z.object({site_id:id,relationships:z.array(EvidenceSchema),tenants:z.array(EvidenceSchema),contracts:z.array(EvidenceSchema),
  prospective_count:nonnegative.int(),assessment_as_of:z.string()}).strict();
export const ImpactDataSchema=z.object({central:ModeledValueSchema.nullable(),adjusted:ModeledValueSchema.nullable(),
  baseline:ScenarioResultSchema,replacement:ScenarioResultSchema,allocation:nonnegative.max(1).nullable(),
  what_changed:z.array(z.object({component:z.string(),before:JsonSchema,after:JsonSchema}).strict()),
  central_label:z.literal('modeled comparison baseline, not a verified central margin')}).strict();
export const ScenarioSpaceDataSchema=z.object({accepted_ids:z.object({sites:z.array(id),hardware:z.array(id),models:z.array(id),traffic_profiles:z.array(id),
  procurement:z.array(id),comparison_profiles:z.array(id)}).strict(),profiles:z.record(ComparisonProfileSchema),
  schemas:z.object({tools:z.record(JsonSchema),scenario_bundle:JsonSchema,comparison_profile:JsonSchema,legacy_fleet_sections:JsonSchema.nullable(),semantic_validation:z.string()}).strict(),
  metrics:z.array(z.object({id,definition:z.string()}).strict()),compatibility:z.object({economics:z.string(),presentation:z.string(),contract:z.string(),contract_digest:z.string(),
    schema_version:nonnegative.int(),release_id:ReleaseIdSchema,registry_hash:z.string().nullable(),producer_engine_version:z.string().nullable(),legacy_engine_revision:z.string().nullable()}).strict(),
}).strict();
const dataSchemas={list_datacenters:ListDatacentersDataSchema,get_datacenter:GetDatacenterDataSchema,rank_datacenters:ComparisonResultSchema,
  datacenter_schedule:DatacenterScheduleDataSchema,datacenter_stakeholders:DatacenterStakeholdersDataSchema,datacenter_impact:ImpactDataSchema,
  price_token_from_site:ScenarioResultSchema,list_scenario_space:ScenarioSpaceDataSchema} as const;
const base={sentence:z.string().min(1),release_id:ReleaseIdSchema,status:z.enum(['ok','modeled','insufficient-evidence','not-found','release-mismatch','release-unavailable','invalid-request']),
  selection_receipt:SelectionReceiptSchema,receipts:z.array(ReceiptSchema),reasons:z.array(z.string())};
export const OutputSchemas=Object.fromEntries(TOOL_NAMES.map(tool=>[tool,z.object({...base,tool:z.literal(tool),data:dataSchemas[tool].nullable()}).strict()])) as {
  [K in ToolName]:z.ZodObject<typeof base & {tool:z.ZodLiteral<K>;data:z.ZodNullable<typeof dataSchemas[K]>}>
};
export type ToolResponses={[K in ToolName]:z.infer<typeof OutputSchemas[K]>};
export type ToolResponse=ToolResponses[ToolName];
export interface ToolEnvelope {content:Array<{type:'text';text:string}>;structuredContent:ToolResponse;isError?:boolean}
export function toEnvelope(tool:ToolName,payload:unknown):ToolEnvelope{
  const response=OutputSchemas[tool].parse(payload) as ToolResponse;
  // isError means the REQUEST failed. A transparent insufficient-evidence or not-found result is a
  // normal response: clients treat isError as tool failure and commonly suppress structuredContent,
  // which would hide the named missing components that are the point of the refusal.
  return {content:[{type:'text',text:response.sentence}],structuredContent:response,
    ...(['invalid-request','release-mismatch','release-unavailable'].includes(response.status)?{isError:true}:{})};
}
export function publishedSchemas(){
  return {tools:Object.fromEntries(TOOL_NAMES.map(tool=>[tool,zodToJsonSchema(InputSchemas[tool],{name:tool,effectStrategy:'input'})])),
    scenario_bundle:zodToJsonSchema(ScenarioBundleSchema,{name:'ScenarioBundle',effectStrategy:'input'}),
    comparison_profile:zodToJsonSchema(ComparisonProfileSchema,{name:'ComparisonProfile',effectStrategy:'input'})};
}
