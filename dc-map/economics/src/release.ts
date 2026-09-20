import { z } from 'zod';
import { SiteDataSchema, SummarySchema, GeoJSONSchema, type SiteData, type Summary, type GeoJSON } from './presentation.js';
export const ReleaseIdSchema=z.string().regex(/^rel-[a-f0-9]{24}$/);
const digest=z.string().regex(/^sha256:[a-f0-9]{64}$/);
export const ManifestSchema=z.object({release_id:ReleaseIdSchema,schema_version:z.literal(1),contract_version:z.literal('dc-map/v0.3'),contract_digest:digest,assessment_as_of:z.string(),artifacts:z.record(digest),registry_hash:digest.optional(),engine_version:z.string().optional(),batch_id:z.string().optional(),fixture_only:z.literal(true).optional(),fixture_format:z.literal('dc-map/site-fixture/v1').optional(),fixture_name:z.string().optional(),presentation_version:z.literal('dc-map/site-data/v2').optional()}).strict();
export type Manifest=z.infer<typeof ManifestSchema>;
export interface Release { manifest:Manifest; siteData:SiteData; summary:Summary; geojson:GeoJSON; adapter:Record<string,unknown>|null; mode:'production'|'fixture' }
export interface ReleaseFailure {ok:false;status:'release-unavailable'|'release-mismatch';sentence:string;release_id:string;reasons:string[]}
const verified=new WeakSet<object>();
export function assertRelease(r:Release):void {if(!verified.has(r)) throw new TypeError('Unverified release handle; call openRelease with exact manifest bytes');}
export async function sha256(bytes:string|Uint8Array):Promise<string>{const input=typeof bytes==='string'?new TextEncoder().encode(bytes):new Uint8Array(bytes); const d=await globalThis.crypto.subtle.digest('SHA-256',input);return 'sha256:'+Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,'0')).join('');}
function freeze<T>(v:T):T {if(v&&typeof v==='object'){Object.freeze(v);for(const child of Object.values(v))freeze(child);}return v;}
export async function openRelease(input:{release_id:string;manifest?:string;artifacts:Record<string,string>;mode?:'production'|'fixture'}):Promise<{ok:true;release:Release}|ReleaseFailure>{
 const fail=(status:ReleaseFailure['status'],reason:string):ReleaseFailure=>({ok:false,status,sentence:`The requested release ${input.release_id} is ${status}.`,release_id:input.release_id,reasons:[reason]});
 if(!input.manifest)return fail('release-unavailable','manifest.json unavailable');
 try {
 const m=ManifestSchema.parse(JSON.parse(input.manifest));const mode=input.mode??'production';
 if(m.release_id!==input.release_id)return fail('release-mismatch','requested and manifest release IDs differ');
 if((mode==='fixture')!==Boolean(m.fixture_only))return fail('release-mismatch','fixture/production mode mismatch');
 if(mode==='production'&&(!m.registry_hash||!m.engine_version||!m.batch_id))return fail('release-mismatch','production manifest lacks immutable identity');
 for(const n of Object.keys(input.artifacts))if(!m.artifacts[n])return fail('release-mismatch',`unlisted artifact ${n}`);
 const required=['site-data.json','summary.json','sites.geojson',...(mode==='production'?['t4-adapter.json']:[])];
 for(const n of required)if(!m.artifacts[n])return fail('release-mismatch',`manifest omits ${n}`);
 for(const [n,hash] of Object.entries(m.artifacts)){
 if(!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(n)||n.split('/').some(x=>x==='..'||x==='.'||x===''))return fail('release-mismatch','unsafe artifact path');
 if(input.artifacts[n]===undefined)return fail('release-unavailable',`${n} unavailable`);
 if(await sha256(input.artifacts[n])!==hash)return fail('release-mismatch',`${n} digest mismatch`);
 }
 const siteData=SiteDataSchema.parse(JSON.parse(input.artifacts['site-data.json']));const summary=SummarySchema.parse(JSON.parse(input.artifacts['summary.json']));const geojson=GeoJSONSchema.parse(JSON.parse(input.artifacts['sites.geojson']));
 const adapter=input.artifacts['t4-adapter.json']?JSON.parse(input.artifacts['t4-adapter.json']) as Record<string,unknown>:null;
 for(const a of [siteData,summary,geojson])for(const key of ['release_id','schema_version','contract_version','contract_digest','assessment_as_of'] as const)if(a[key]!==m[key])return fail('release-mismatch',`embedded ${key} mismatch`);
 for(const a of [siteData,summary,geojson])if(a.presentation_version!=='dc-map/site-data/v2')return fail('release-mismatch','unsupported presentation version');
 if(mode==='production'&&(!adapter||Array.isArray(adapter)||typeof adapter!=='object'))return fail('release-mismatch','invalid production adapter');
 if(adapter){for(const key of ['release_id','schema_version','contract_version','assessment_as_of'] as const)if(adapter[key]!==m[key])return fail('release-mismatch',`adapter ${key} mismatch`);if(!adapter.DATACENTERS||typeof adapter.DATACENTERS!=='object'||Array.isArray(adapter.DATACENTERS))return fail('release-mismatch','invalid adapter rows');}
 for(const site of siteData.sites)for(const report of site.reports)if(!m.artifacts[report.path]||m.artifacts[report.path]!==report.content_hash)return fail('release-mismatch','report is not manifest pinned');
 const r=freeze({manifest:m,siteData,summary,geojson,adapter,mode});verified.add(r);return {ok:true,release:r};
 }catch(e){return fail('release-mismatch',e instanceof Error?e.message:'invalid JSON');}
}
