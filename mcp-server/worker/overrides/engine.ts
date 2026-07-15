/* Worker engine bridge — the ONLY place the live site engine enters this Worker.
   site/engine.js is dependency-free dual-mode CommonJS; it never references window/document,
   so under the bundler (wrangler/esbuild CJS interop provides `module`) the module.exports
   branch is taken. Imported via the bundler, NOT createRequire (workerd has no Node loader).
   Single source of truth: this package NEVER re-declares an engine constant.
   Exports the exact same interface as ../src/engine.ts (E, SITE, engineStamp). */
// @ts-expect-error — plain dual-mode CJS with no .d.ts; typed via engine-types below.
import engineModule from "../../../../site/engine.js";
import type { Engine } from "./engine-types.js";

export const E: Engine = engineModule as Engine;

export const SITE = {
  calculator: "https://margins.ashitaorbis.com/",
  annex: "https://margins.ashitaorbis.com/research/",
} as const;

export function engineStamp() {
  return { revision: E.ENGINE_REVISION, data_as_of: E.DATA_AS_OF };
}
