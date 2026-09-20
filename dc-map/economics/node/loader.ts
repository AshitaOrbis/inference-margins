import { readFile, realpath, lstat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createRequire } from 'node:module';
import { openRelease, ManifestSchema, ReleaseIdSchema, type ReleaseFailure } from '../src/release.js';
import type { EconomicsContext } from '../src/legacy.js';
/** Resolve CURRENT once. No retries, fallback or process-global release pointer. */
export async function loadRelease(root:string, requested?:string, fixture=false){
 let id=requested??'';
 try {
 const base=await realpath(root);
 if(!fixture&&!requested) id=(await readFile(resolve(base,'CURRENT'),'utf8')).trim();
 const directory=await realpath(fixture?base:resolve(base,ReleaseIdSchema.parse(id)));
 if(!fixture&&!directory.startsWith(base+sep))throw new Error('release directory escapes root');
 try {await lstat(resolve(directory,'FAILED.json'));throw new Error('failed release');}
 catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 const readPinned=async(name:string)=>{
   if(!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(name)||name.split('/').some(x=>x==='..'||x==='.'||x===''))throw new Error('unsafe artifact path');
   const path=await realpath(resolve(directory,name));
   if(!path.startsWith(directory+sep))throw new Error('artifact escapes release directory');
   return readFile(path,'utf8');
 };
 const manifest=await readPinned('manifest.json');const m=ManifestSchema.parse(JSON.parse(manifest));
 if(fixture&&!requested)id=m.release_id;
 const artifacts:Record<string,string>={};
 for(const n of Object.keys(m.artifacts))artifacts[n]=await readPinned(n);
 return openRelease({release_id:id,manifest,artifacts,mode:fixture?'fixture':'production'});
 }catch(e){return {ok:false,status:'release-unavailable',sentence:`The requested release ${id||'(unresolved)'} is unavailable.`,release_id:id,reasons:[e instanceof Error?e.message:'read failure']} satisfies ReleaseFailure;}
}
/** Node-only convenience bridge. Supply the repository's unchanged site directory. */
export function loadLegacyContext(siteDirectory:string):EconomicsContext {
 const require=createRequire(import.meta.url);
 return {engine:require(resolve(siteDirectory,'engine.js')),registry:require(resolve(siteDirectory,'engine-data-dc-v1.js')),contracts:require(resolve(siteDirectory,'engine-contracts-v22.js'))};
}
