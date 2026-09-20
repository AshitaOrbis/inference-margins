import { z } from 'zod';
import { assertRelease, sha256, ReleaseIdSchema, type Release } from './release.js';
import { canonical, validateComparison, addBands, mapBand } from './validate.js';
import { evidenceIndex, objectValue } from './evidence.js';
import { VERSION, ComparisonProfileSchema, type Receipt } from './types.js';
import { priceTokenHere, compareScenarios, notApplicable, type ModeledValue } from './scenario.js';
import { InputSchemas, TOOL_NAMES, toEnvelope, publishedSchemas, type ToolName, type ToolEnvelope, type ToolInputs } from './dto.js';
import type { EconomicsContext } from './legacy.js';
import type { Site, Evidence, Bounds, Json } from './presentation.js';

const CursorSchema=z.object({version:z.literal(1),release_id:ReleaseIdSchema,manifest_hash:z.string(),query_hash:z.string(),offset:z.number().int().nonnegative()}).strict();
const lex=(a:string,b:string)=>a<b?-1:a>b?1:0;
const defaultSite=(s:Site)=>s.identity_resolved&&s.presentation_campus_id===s.slug;
const evidenceArrays=(release:Release,siteId:string)=>[...evidenceIndex(release).values()].filter(x=>x.entity_id===siteId);

/** One instance is one immutable release. execute never resolves CURRENT or reads files. */
export function createQueryLayer(release:Release,context?:EconomicsContext){
  assertRelease(release);
  const manifestHash=sha256(canonical(release.manifest));
  const exportedSchemas=publishedSchemas();
  const respond=(tool:ToolName,status:string,sentence:string,data:unknown=null,reasons:string[]=[],receipts:Receipt[]=[],selection:unknown=notApplicable('factual query; no margin scenario selected'))=>
    toEnvelope(tool,{tool,status,sentence,release_id:release.manifest.release_id,selection_receipt:selection,receipts,reasons,data});
  async function execute(tool:ToolName,input:unknown):Promise<ToolEnvelope>{
    if(!TOOL_NAMES.includes(tool))throw new TypeError('unknown datacenter tool');
    const parsed=InputSchemas[tool].safeParse(input);
    if(!parsed.success)return respond(tool,'invalid-request','The datacenter request is invalid.',null,parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`));
    const args=parsed.data;
    if(args.release_id&&args.release_id!==release.manifest.release_id)return respond(tool,'release-mismatch','The requested release differs from this pinned query session; no fallback was used.',null,['exact release mismatch']);
    if(tool==='list_scenario_space'){
      const profiles=Object.fromEntries(Object.entries(context?.profiles??{}).flatMap(([key,value])=>{const p=ComparisonProfileSchema.safeParse(value);return p.success?[[key,p.data]]:[];}));
      return respond(tool,'ok',`Scenario discovery is pinned to ${release.manifest.release_id}; all datacenter prices require explicit validated assumptions.`,{
        accepted_ids:{sites:release.siteData.sites.map(s=>s.slug),hardware:context?.engine.HW_ORDER??[],models:context?.engine.MODELS.map(m=>m.id)??[],
          traffic_profiles:context?.engine.TRAFFIC_PROFILES.map(t=>t.id)??[],procurement:context?.engine.PROCUREMENT_BASES??[],comparison_profiles:Object.keys(profiles)},profiles,
        schemas:{...exportedSchemas,legacy_fleet_sections:context?.engine.fleetSectionsSchema()??null,
          semantic_validation:'Zod runtime and shared semantic validators are authoritative. JSON Schema describes structure; canonical hashing, ordered bands, exact-release provenance, service inclusions and tariff dependencies are validated at execution.'},
        metrics:[{id:'cost-per-million-tokens',definition:'Modeled native-currency cost per million workload-mix tokens under fixed hardware, workload, procurement, date, currency and term; no default all-in H100e-hour metric.'}],
        compatibility:{economics:VERSION,presentation:release.siteData.presentation_version,contract:release.manifest.contract_version,contract_digest:release.manifest.contract_digest,
          schema_version:release.manifest.schema_version,release_id:release.manifest.release_id,registry_hash:release.manifest.registry_hash??null,
          producer_engine_version:release.manifest.engine_version??null,legacy_engine_revision:context?.engine.ENGINE_REVISION??null}});
    }
    if(tool==='list_datacenters'){
      const r=InputSchemas.list_datacenters.parse(args);
      const {cursor,release_id,limit,...filters}=r;
      const queryHash=await sha256(canonical(filters));let offset=0;
      if(cursor){
        let c;
        try{if(!cursor.startsWith('dcmap-v1:'))throw new Error('cursor prefix');c=CursorSchema.parse(JSON.parse(decodeURIComponent(cursor.slice(9))));}
        catch{return respond(tool,'invalid-request','The pagination cursor is invalid.',null,['invalid cursor']);}
        if(c.release_id!==release.manifest.release_id||c.manifest_hash!==await manifestHash)return respond(tool,'release-mismatch','The pagination cursor belongs to a different exact release.',null,['cursor release mismatch']);
        if(c.query_hash!==queryHash)return respond(tool,'invalid-request','The pagination cursor uses different filters.',null,['cursor filter mismatch']);
        offset=c.offset;
      }
      const matching=release.siteData.sites.filter(s=>{
        if(!r.include_nonphysical&&!s.identity_resolved)return false;
        if(s.identity_resolved&&!r.include_components&&!defaultSite(s))return false;
        if(r.country&&s.country!==r.country||r.owner&&s.owner!==r.owner||r.status&&s.status_value!==r.status)return false;
        const known=s.campus_capacity!==null||s.capacity_contributions.length>0;
        if(r.unknown_capacity!==undefined&&r.unknown_capacity===known)return false;
        const bounds=s.campus_capacity?.bounds??s.headline_mw?.bounds;
        if(r.min_capacity_mw!==undefined&&(bounds?.lo==null||bounds.lo<r.min_capacity_mw))return false;
        if(r.query){const haystack=[s.slug,s.name,s.country,s.owner,...s.relationships.map(x=>JSON.stringify(x.value)),...s.tenants.map(x=>JSON.stringify(x.value))].filter(Boolean).join(' ').toLowerCase();if(!haystack.includes(r.query.toLowerCase()))return false;}
        return true;
      }).sort((a,b)=>lex(a.slug,b.slug));
      if(offset>matching.length)return respond(tool,'invalid-request','The pagination offset is outside this result set.',null,['cursor offset outside result']);
      const page=matching.slice(offset,offset+limit),defaults=matching.filter(defaultSite);
      const campusIds=new Set(defaults.map(s=>s.slug));
      const selectedEvidence=new Set(matching.flatMap(s=>s.capacity_contributions.map(c=>c.evidence_id)));
      const contributions=release.summary.aggregation_receipts.filter(r=>campusIds.has(r.presentation_campus_id)||selectedEvidence.has(r.evidence_id));
      const unique=new Map(contributions.map(r=>[r.evidence_id,r]));
      const bounds:Bounds={lo:0,mid:0,hi:0};const dates:string[]=[];
      for(const r of unique.values()){
        for(const k of ['lo','mid','hi'] as const)bounds[k]=bounds[k]===null||r.bounds[k]===null?null:bounds[k]!+r.bounds[k]!;
        if(r.observation_date_range)dates.push(r.observation_date_range.start,r.observation_date_range.end);
      }
      dates.sort();const nextOffset=offset+page.length;
      const next=nextOffset<matching.length?'dcmap-v1:'+encodeURIComponent(JSON.stringify({version:1,release_id:release.manifest.release_id,manifest_hash:await manifestHash,query_hash:queryHash,offset:nextOffset})):null;
      return respond(tool,'ok',`${defaults.length} tracked physical sites match the dated evidence filters; ${matching.length} matching detail records and ${release.siteData.sites.length-matching.length} excluded records in ${release.manifest.release_id}.`,{
        sites:page,coverage:{default_sites:defaults.length,returned_details:page.length,total_matching_details:matching.length,excluded_details:release.siteData.sites.length-matching.length,
          nonphysical_entities:matching.filter(s=>!s.identity_resolved&&s.entity_type!==null).length,unknown_capacity_sites:defaults.filter(s=>s.campus_capacity===null).length,
          bounded_capacity_sites:defaults.filter(s=>s.campus_capacity!==null&&s.campus_capacity.bounds.mid===null).length},
        capacity:{bounds,evidence_ids:[...unique.keys()].sort(),observation_date_range:dates.length?{start:dates[0],end:dates.at(-1)!}:null,
          exclusions:release.summary.coverage_overlaps,note:'Tracked-evidence capacity from producer aggregation receipts, once per evidence ID; parent and child are never independently added. Zero is the sum of no included quantities, not evidence of zero installed capacity.'},next_cursor:next});
    }
    if(tool==='price_token_from_site'||tool==='rank_datacenters'||tool==='datacenter_impact'){
      if(!context)return respond(tool,'insufficient-evidence','The legacy engine context is unavailable for this economic calculation.',null,['legacy engine context unavailable']);
      if(tool==='price_token_from_site'){
        const r=InputSchemas.price_token_from_site.parse(args);const result=await priceTokenHere(release,r.scenario,context);
        return respond(tool,result.status,result.sentence,result,result.missing,result.receipts,result.selection_receipt);
      }
      if(tool==='rank_datacenters'){
        const {release_id,...r}=InputSchemas.rank_datacenters.parse(args);const result=await compareScenarios(release,r,context);
        return respond(tool,result.status,result.sentence,result,[],result.receipts,result.selection_receipt);
      }
      const r=InputSchemas.datacenter_impact.parse(args);
      const baseline=await priceTokenHere(release,r.baseline,context),replacement=await priceTokenHere(release,r.replacement,context);
      const receipts=[...baseline.receipts,...replacement.receipts];
      const reasons=[...baseline.missing,...replacement.missing];
      if(baseline.profile_hash!==replacement.profile_hash)reasons.push('replacement requires the same comparison profile');
      if(!r.allocation){reasons.push('provider allocation is unresolved; supply a named allocation assumption');receipts.push({kind:'unresolved-dependency',component:'allocation',refs:[],detail:reasons.at(-1)!,scope:'modeled'});}
      const whatChanged=[...new Set([...Object.keys(r.baseline.pool),...Object.keys(r.replacement.pool)])].sort().filter(k=>canonical((r.baseline.pool as any)[k]??null)!==canonical((r.replacement.pool as any)[k]??null)).map(k=>({component:k,before:(r.baseline.pool as any)[k]??null,after:(r.replacement.pool as any)[k]??null}));
      let adjusted:ModeledValue|null=null;
      if(!reasons.length&&baseline.value&&replacement.value&&r.allocation){
        const share=r.allocation.share;
        const band=addBands(mapBand(baseline.value.band,x=>x*(1-share)),mapBand(replacement.value.band,x=>x*share));
        adjusted={band,unit:baseline.value.unit,status_fused:`Modeled replacement-adjusted ${band.lo.toFixed(4)}–${band.hi.toFixed(4)} ${baseline.value.unit}`,
          scope:{result:'modeled',inputs:[...new Set([...baseline.value.scope.inputs,...replacement.value.scope.inputs,r.allocation.assumption.scope])]}};
        receipts.push({kind:'assumption',component:'allocation',refs:[r.allocation.assumption.id,...r.allocation.assumption.evidence_ids],detail:`Replacement share ${share}: ${r.allocation.assumption.description}`,scope:r.allocation.assumption.scope});
      }
      return respond(tool,adjusted?'modeled':'insufficient-evidence',adjusted?`Modeled replacement affects ${(100*r.allocation!.share).toFixed(1)}% of the declared workload under a named allocation assumption; the comparator is a modeled baseline.`:`Insufficient evidence for a replacement impact: ${reasons.join('; ')}.`,
        {central:baseline.value,adjusted,baseline,replacement,allocation:r.allocation?.share??null,what_changed:whatChanged,central_label:'modeled comparison baseline, not a verified central margin'},reasons,receipts,notApplicable('replacement cost comparison; no single margin scenario'));
    }
    const siteId=(args as {site_id:string}).site_id;const site=release.siteData.sites.find(s=>s.slug===siteId);
    if(!site)return respond(tool,'not-found',`No promoted detail record for ${siteId} exists in ${release.manifest.release_id}.`,null,['site unavailable in requested release']);
    if(tool==='get_datacenter'){
      // Remove presentation-only adornments from each atom to keep the producer Evidence DTO exact.
      const fields=new Set(['unit','scope','as_of','observation_kind','measurement_boundary','capacity_state','phase_id','service_boundary_id','valid_from','valid_to','quantity_kind','quantity_basis','central_estimate','field','entity_id','evidence_id','basis','label','claim_nature','record_kind','source_kind','value','coverage_entity_ids','as_of_window','sources']);
      const evidence=evidenceArrays(release,siteId).filter(e=>e.record_kind==='adjudicated').map(e=>Object.fromEntries(Object.entries(e).filter(([k])=>fields.has(k))));
      return respond(tool,'ok',`${site.name} has ${evidence.length} promoted exported evidence atoms in this dated release; calculator scenarios remain separately named.`,{site,promoted_evidence:evidence,
        conflicts:{status:'not-exported',reason:'The producer presentation contract does not export conflict adjudication records; an empty conflict set cannot be inferred.'},scenarios:[],
        scenario_note:'No scenario is selected by factual detail retrieval. Use price_token_from_site with a named bundle.'});
    }
    if(tool==='datacenter_schedule'){
      const r=InputSchemas.datacenter_schedule.parse(args);const schedule=site.schedule.filter(s=>(!r.milestone||s.milestone===r.milestone)&&(!r.phase_id||s.phase===r.phase_id));
      const revisions=schedule.flatMap(s=>s.latest_target&&s.latest_target.evidence_id!==s.baseline?.evidence_id?[s.latest_target]:[]);
      const states=[...new Set(schedule.map(s=>s.baseline_assessment.assessment))];
      // `no-baseline` is a producer decision-table token; nothing exported is not that decision.
      return respond(tool,'ok',`${site.name} has ${schedule.length} exported schedule comparisons as of ${release.manifest.assessment_as_of}: ${states.join(', ')||'no exported schedule comparison'}.`,
        {site_id:siteId,schedule,revisions,assessment_as_of:release.manifest.assessment_as_of,revision_history_complete:false,
          note:'Baseline and latest-target atoms retain original date precision and deterministic decision-table receipts. Intermediate revisions are not guaranteed by the presentation contract.'});
    }
    const prospective=new Set<string>();
    for(const row of [...site.tenants,...site.contracts,...site.relationships]){
      const v=objectValue(row.value);
      if(v?.role==='prospective'||(typeof v?.state==='string'&&v.state!=='executed')||(typeof v?.from==='string'&&v.from>release.manifest.assessment_as_of))prospective.add(row.evidence_id);
    }
    return respond(tool,'ok',`${site.name} has ${site.relationships.length+site.tenants.length+site.contracts.length} dated stakeholder and contract records, including ${prospective.size} prospective or non-executed records; these do not establish serving allocation.`,
      {site_id:siteId,relationships:site.relationships,tenants:site.tenants,contracts:site.contracts,prospective_count:prospective.size,assessment_as_of:release.manifest.assessment_as_of});
  }
  return {release_id:release.manifest.release_id,execute};
}
export type QueryLayer=ReturnType<typeof createQueryLayer>;
