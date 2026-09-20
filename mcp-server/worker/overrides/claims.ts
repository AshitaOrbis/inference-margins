/* Worker runtime bridge for the R2 claim contracts — the SAME interface as
   ../src/claims.ts, resolved via the bundler (workerd has no Node loader), exactly
   the engine.ts bridge pattern. site/engine-contracts-v22.js is dependency-free
   dual-mode CommonJS (pure-JS sha256 fallback, no window/document access), so the
   module.exports branch is taken under wrangler/esbuild CJS interop.
   Single source of truth: this package NEVER re-implements a contract. */
// @ts-expect-error — plain dual-mode CJS with no .d.ts; typed via claims-types below.
import contractsModule from "../../../../site/engine-contracts-v22.js";
import type { EngineContracts } from "./claims-types.js";

export * from "./claims-types.js";

export const CONTRACTS: EngineContracts = contractsModule as EngineContracts;
