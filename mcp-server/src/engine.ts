/* Engine bridge — the ONLY place the live site engine enters this server.
   Same pattern as site/tests/*.mjs: createRequire against the dual-mode CommonJS engine.
   Single source of truth: this package NEVER re-declares an engine constant. */
import { createRequire } from "node:module";
import type { Engine } from "./engine-types.js";

const require = createRequire(import.meta.url);

// Resolved relative to the compiled file (mcp-server/dist/engine.js → ../../site/engine.js).
export const E: Engine = require("../../site/engine.js") as Engine;

export const SITE = {
  calculator: "https://margins.ashitaorbis.com/",
  annex: "https://margins.ashitaorbis.com/research/",
} as const;

export function engineStamp() {
  return { revision: E.ENGINE_REVISION, data_as_of: E.DATA_AS_OF };
}
