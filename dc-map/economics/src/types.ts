import { z } from 'zod';
import { ReleaseIdSchema } from './release.js';
export const VERSION='dc-map/economics/v1' as const;
export const finite=z.number().finite();
export const nonnegative=finite.nonnegative();
export const positive=finite.positive();
export const id=z.string().min(1).max(200);
export const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;},'invalid civil date');
export const BandSchema=z.object({lo:nonnegative,mid:nonnegative,hi:nonnegative}).strict().refine(v=>v.lo<=v.mid&&v.mid<=v.hi,'ordered finite band required');
export type Band=z.infer<typeof BandSchema>;
export const COMPONENTS=['electricity','hardware','network','facility-recovery','support','cooling','water','taxes'] as const;
export const ComponentSchema=z.enum(COMPONENTS);
export const TrafficSchema=z.discriminatedUnion('mode',[
 z.object({mode:z.literal('native')}).strict(),
 z.object({mode:z.literal('profile'),profile_id:id}).strict(),
 z.object({mode:z.literal('custom'),io_ratio:positive,cache_hit:nonnegative.max(95)}).strict()
]);
export const ComparisonProfileSchema=z.object({
 workload:z.object({model_id:id,traffic:TrafficSchema,engine_perspective_id:id.default('median')}).strict(),
 hardware_key:id,procurement:id,date,currency:z.string().regex(/^[A-Z]{3}$/),term_years:positive.max(100).refine(n=>Math.abs(n*12-Math.round(n*12))<1e-8,"term must be whole calendar months"),
 perspective:z.enum(['owner-operator','tenant-powered-space-or-hosting','customer-buying-compute']),
 metric:z.literal('cost-per-million-tokens')
}).strict();
export type ComparisonProfile=z.infer<typeof ComparisonProfileSchema>;
export const ComparisonPathSchema=z.union([
 z.object({profile_id:id}).strict(),z.object({parameters:ComparisonProfileSchema}).strict()
]);
export const AssumptionSchema=z.object({id,description:z.string().min(10),scope:z.enum(['modeled','forecast']),evidence_ids:z.array(id).default([])}).strict();
export const ProvenanceSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('evidence'),evidence_id:id}).strict(),
 z.object({kind:z.literal('assumption'),assumption_id:id}).strict()
]);
/** field-contract v0.3 closes the atom's `cost_scope` at {land, shell, electrical-cooling-fitout,
 * installed-it, networking, total-project, unresolved}; that whole list is carried here rather than
 * forked. `support`, `water` and `taxes` are the scenario-side extension for recurring operating
 * charges, named as such in the README. An `unresolved` scope can never be charged. */
export const COST_SCOPES=['land','shell','electrical-cooling-fitout','installed-it','networking','total-project','unresolved','support','water','taxes'] as const;
export const CostSchema=z.object({id,kind:z.enum(['capital','recurring','financing']),
 scopes:z.array(z.enum(COST_SCOPES)).min(1),
 amount:BandSchema,currency:z.string().regex(/^[A-Z]{3}$/),price_year:z.number().int().min(1900).max(2200),
 service_boundary_id:id,life_years:positive.max(100),residual_fraction:nonnegative.max(1),capital_rate:nonnegative.max(1),
 provenance:ProvenanceSchema,interpretation_assumption_id:id.optional()
}).strict();
export type Cost=z.infer<typeof CostSchema>;
export const InclusionSchema=z.object({includes:z.array(ComponentSchema).nullable(),excludes:z.array(ComponentSchema).nullable()}).strict();
export const RentSchema=z.object({kind:z.enum(['land-lease','powered-shell','hosting','compute-rental']),
 annual_amount:BandSchema,currency:z.string().regex(/^[A-Z]{3}$/),price_year:z.number().int(),
 state:z.enum(['executed','option','mou','announced']),commencement:date,term_years:positive.max(100).refine(n=>Math.abs(n*12-Math.round(n*12))<1e-8,"term must be whole calendar months"),
 escalation:z.object({annual_fraction:nonnegative.max(1),assumption_id:id}).strict(),
 includes:z.array(ComponentSchema).nullable(),excludes:z.array(ComponentSchema).nullable(),provenance:ProvenanceSchema,
 source_amount:BandSchema.optional(),quote_basis:z.enum(["annual","term-total"]).optional(),pricing_assumption_id:id.optional()
}).strict();
export const HardwareSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('disclosed'),hw_key:id,count:positive.int(),evidence_id:id}).strict(),
 z.object({kind:z.literal('hypothetical'),hw_key:id,count:positive.int(),assumption_id:id}).strict(),
 z.object({kind:z.literal('unsplit'),hw_keys_present:z.array(id).min(2),count:positive.int(),evidence_id:id}).strict()
]);
export const IntervalSchema=z.object({hours:positive,kw:nonnegative,tou:id}).strict();
export const PeriodSchema=z.object({id,start:date,end:date,intervals:z.array(IntervalSchema).min(1),
 billing_demand_kw:nonnegative,historical_peak_kw:nonnegative,capacity_kw:positive,load_factor:positive.max(1)
}).strict();
export const LoadShapeSchema=z.object({boundary:z.enum(['it-input','facility-input','grid-import']),periods:z.array(PeriodSchema).min(1),
 annualization:z.object({annual_hours:positive.max(8784),assumption_id:id}).strict(),assumption_id:id
}).strict();
export type LoadShape=z.infer<typeof LoadShapeSchema>;
export const MissingComponentSchema=z.object({component:id,gap_refs:z.array(id).default([]),period_id:id,amount:BandSchema,assumption_id:id}).strict();
export const ElectricitySchema=z.object({tariff_ref:id.nullable(),applicability_ref:id.nullable(),
 hypothetical_applicability_assumption:id.optional(),bounded_components:z.array(MissingComponentSchema).default([]),
 onsite:z.object({share:nonnegative.max(1),fuel_cost_per_kwh:nonnegative,efficiency:positive.max(1),annual_fixed_cost:BandSchema,assumption_id:id}).strict().optional(),
 certificates:z.object({cost_per_kwh:nonnegative,assumption_id:id}).strict().optional()
}).strict();
export const PoolSchema=z.object({id,site_id:id,phase_ids:z.array(id),service_boundary_id:id,coverage_entity_ids:z.array(id).min(1),
 mode:z.enum(['evidence-grounded','scenario']),hardware_allocation_assumption_id:id.optional(),hardware:z.array(HardwareSchema).min(1),
 pue:z.object({value:positive.min(1).max(5),basis:z.enum(['measured','class']),provenance:ProvenanceSchema,
 numerator:z.literal('facility-input'),denominator:z.literal('it-input')}).strict(),
 utilization:positive.max(1),occupancy:positive.max(1),operating_assumption_id:id,
 load_shape:LoadShapeSchema,electricity:ElectricitySchema,costs:z.array(CostSchema),rent:RentSchema.nullable(),
 verified_zero_components:z.array(z.object({component:ComponentSchema,provenance:ProvenanceSchema}).strict()).default([])
}).strict();
export const ScenarioBundleSchema=z.object({version:z.literal(VERSION),release_id:ReleaseIdSchema,id,
 comparison:ComparisonPathSchema,pool:PoolSchema,assumptions:z.array(AssumptionSchema)
}).strict();
export type ScenarioBundle=z.infer<typeof ScenarioBundleSchema>;
export type Pool=z.infer<typeof PoolSchema>;
export interface Receipt {kind:'evidence'|'assumption'|'calculation'|'exclusion'|'unresolved-dependency';component:string;refs:string[];detail:string;scope:'modeled'|'disclosed'|'forecast'}
export const ReceiptSchema=z.object({kind:z.enum(['evidence','assumption','calculation','exclusion','unresolved-dependency']),component:id,refs:z.array(id),detail:z.string(),scope:z.enum(['modeled','disclosed','forecast'])}).strict();
export type Provenance=z.infer<typeof ProvenanceSchema>;
