/* Node runtime bridge for the R2 claim contracts (im4-r2-shipment-plan §1.1).
   Resolved relative to the compiled file (mcp-server/dist/claims.js → ../../site/…) —
   the same bridge pattern as engine.ts; this package NEVER re-implements a contract.
   The Worker build swaps in overrides/claims.ts (bundler import) — interface identical. */
import { createRequire } from "node:module";
import type { EngineContracts } from "./claims-types.js";

export * from "./claims-types.js";

const require = createRequire(import.meta.url);

export const CONTRACTS: EngineContracts = require("../../site/engine-contracts-v22.js") as EngineContracts;
