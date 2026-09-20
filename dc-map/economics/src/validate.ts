import { ComparisonPathSchema,ComparisonProfileSchema,InclusionSchema,BandSchema,type ComparisonProfile,type Band,type Cost, COMPONENTS } from './types.js';
import { sha256 } from './release.js';
/** Object order is immaterial; arrays retain order unless their schema defines a set. */
export function canonical(value:unknown):string {
 if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
 if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(Object.is(value,-0)?0:value);
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';
 throw new TypeError('canonical JSON requires finite, fully specified values');
}
export async function validateComparison(input:unknown,profiles:Record<string,unknown>={}):Promise<{ok:true;profile:ComparisonProfile;profile_hash:string}|{ok:false;reasons:string[]}>{
 const path=ComparisonPathSchema.safeParse(input);if(!path.success)return {ok:false,reasons:path.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`)};
 const parsed=ComparisonProfileSchema.safeParse('profile_id' in path.data?Object.prototype.hasOwnProperty.call(profiles,path.data.profile_id)?profiles[path.data.profile_id]:undefined:path.data.parameters);
 if(!parsed.success)return {ok:false,reasons:parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`)};
 return {ok:true,profile:parsed.data,profile_hash:await sha256(canonical(parsed.data))};
}
export function inclusionMatrix(input:unknown,material:readonly string[]=["electricity","hardware","facility-recovery"]){
 const parsed=InclusionSchema.safeParse(input);const core=COMPONENTS;
 if(!parsed.success)return {ok:false,suppressed:[],required:[],reasons:['invalid inclusion/exclusion matrix']};
 const {includes,excludes}=parsed.data;const reasons:string[]=[];
 if(includes===null||excludes===null)reasons.push('ambiguous contract inclusions');
 if(includes?.some(x=>excludes?.includes(x)))reasons.push('contract includes and excludes overlap');
 for(const c of material)if(!includes?.some(x=>x===c)&&!excludes?.some(x=>x===c))reasons.push(`unknown inclusion: ${c}`);
 return {ok:reasons.length===0,suppressed:core.filter(x=>includes?.includes(x)),required:core.filter(x=>excludes?.includes(x)),reasons};
}
export function mapBand(b:Band,f:(n:number)=>number):Band{return BandSchema.parse({lo:f(b.lo),mid:f(b.mid),hi:f(b.hi)});}
export function addBands(...bands:Band[]):Band {return BandSchema.parse(bands.reduce((a,b)=>({lo:a.lo+b.lo,mid:a.mid+b.mid,hi:a.hi+b.hi}),{lo:0,mid:0,hi:0}));}
export function annualize(cost:Pick<Cost,'amount'|'life_years'|'residual_fraction'|'capital_rate'>):Band {
 const {life_years:n,residual_fraction:residual,capital_rate:r}=cost;
 if(!(n>0)||!Number.isFinite(n)||r<0||r>1||residual<0||residual>1)throw new TypeError('invalid capital recovery assumptions');
 const factor=r===0?(1-residual)/n:(1-residual/((1+r)**n))*r/(1-(1+r)**(-n));
 return mapBand(cost.amount,x=>x*factor);
}
