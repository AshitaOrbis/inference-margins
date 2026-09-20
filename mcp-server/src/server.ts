/* buildServer() — one server, two entrypoints (stdio.ts / http.ts).
   Eight read-only tools registered in the site's own order, then U5's seven datacenter tools
   (dc-map DESIGN §6) AFTER them — the existing eight keep their names, their order and their
   TOOL_ERROR_CODES unchanged. No tool name contains "margin" except query_margin_claims (which
   returns claims, not computed margins). */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { E, SITE } from "./engine.js";
import * as listScenarioSpace from "./tools/list_scenario_space.js";
import * as queryMarginClaims from "./tools/query_margin_claims.js";
import * as runScenario from "./tools/run_scenario.js";
import * as adjustRentalRate from "./tools/adjust_rental_rate.js";
import * as runFleetSections from "./tools/run_fleet_sections.js";
import * as exploreRange from "./tools/explore_range.js";
import * as getReport from "./tools/get_report.js";
import * as getDossier from "./tools/get_dossier.js";
import * as listDatacenters from "./tools/list_datacenters.js";
import * as getDatacenter from "./tools/get_datacenter.js";
import * as rankDatacenters from "./tools/rank_datacenters.js";
import * as datacenterSchedule from "./tools/datacenter_schedule.js";
import * as datacenterImpact from "./tools/datacenter_impact.js";
import * as datacenterStakeholders from "./tools/datacenter_stakeholders.js";
import * as priceTokenFromSite from "./tools/price_token_from_site.js";

export const SERVER_VERSION = "1.0.0";

const INSTRUCTIONS = `Frontier Inference Margins — read-only claims registry + pure scenario calculator (the same substrate as ${SITE.calculator}, engine ${E.ENGINE_REVISION}, data as of ${E.DATA_AS_OF}).

Honest-labeling contract (load-bearing):
- Every response leads with a complete honest sentence; quote or closely paraphrase it. A bare number without its welded status is a misquote.
- Margin values are status-fused strings ("≈77% (unit serving, not company GM)", "≥80% (floor)", "≈93% (counterfactual)"); bare scalars exist only inside selection_receipt, whole-point rounded.
- Every response carries selection_receipt with the comparison baseline alongside — never present a non-baseline result without it.
- The metric is a modeled unit direct-serving contribution margin — NOT an audited accounting company gross margin (see report-s7 for the bridge).
- run_scenario, adjust_rental_rate and run_fleet_sections return policy-scenario outputs. explore_range returns page-authored counterfactuals (what would have to be true), not measured results. query_margin_claims returns cited claims; floors are compatible-with relations, never intervals; company-GM figures are different objects from unit-serving claims.

Datacenter tools (dc-map evidence registry — list_datacenters, get_datacenter, rank_datacenters, datacenter_schedule, datacenter_impact, datacenter_stakeholders, price_token_from_site):
- They answer from ONE exact immutable substrate release, named in every response's release_id, and refuse with a typed release-mismatch / release-unavailable rather than fall back to another release.
- The factual layer shows evidence, never model output: a marker, a capacity cell and a total are literal disclosures, declared plans or dated observations. A satellite-derived IT-MW figure, a cost-per-watt model and a tariff-derived delivered price are model outputs — attributed, labelled modeled, allowed to feed the calculator, and never sizing a marker or entering a total.
- Physical capacity, serving attribution and modeled fleet weights are three separate things. No response converts one into another, and no physical evidence establishes a provider's serving allocation.
- Every priced result is modeled with receipts, even when every input was disclosed. An insufficient-evidence answer NAMES the missing components and is a normal response, not a tool error; only invalid-request, release-mismatch and release-unavailable set isError.
- A ranking sentence says "modeled … among these eligible scenarios", never "the cheapest datacenter"; overlapping bands are a group, not a proven tie. Schedule tokens are the producer's: overdue-unverified means silence, not delay.`;

/* eslint-disable @typescript-eslint/no-explicit-any */
/* ---------- public error surface (GPT Pro 2026-07-29 rec 13, applied 2026-09-02) ----------
   A read-only connector still should not hand callers raw internal text: it can carry
   implementation detail, registry identifiers, or unexpected source content. Two rules — the CODE
   is a closed enum a client can branch on, and the SENTENCE is FIXED per code rather than
   interpolated, so nothing from the engine, the registry or an unexpected input can reach a caller
   through it. `refused_by_contract` keeps its own code because those refusals are this surface's
   honest-labeling contract doing its job: a client should be able to tell "you asked for something
   this surface deliberately will not do" apart from "something broke". */
export const TOOL_ERROR_CODES = ["invalid_request", "refused_by_contract", "internal_error"] as const;
export type ToolErrorCode = (typeof TOOL_ERROR_CODES)[number];
export const PUBLIC_ERROR_TEXT: Record<ToolErrorCode, string> = {
  invalid_request: "The request was rejected as malformed or out of range. Check the tool's input schema and bounds.",
  refused_by_contract: "This surface deliberately refuses that request under its honest-labeling contract.",
  internal_error: "The request could not be completed. Details are recorded server-side and are not returned.",
};
export function classifyToolError(err: unknown): ToolErrorCode {
  const m = err instanceof Error ? err.message : String(err ?? "");
  if (/\bRETIRED\b|refus|never |not permitted|contract/i.test(m)) return "refused_by_contract";
  if (/invalid|malformed|out of range|must be|expected |unknown /i.test(m)) return "invalid_request";
  return "internal_error";
}
/* Bounded internal diagnostic: name + truncated message only. No stack, no argument values, no
   override values — the same discipline the HTTP entrypoint's clientError handler already keeps. */
function logToolErrorSafely(where: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err ?? ""));
  console.error(`[inference-margins-mcp/${where}]`, JSON.stringify({ name: e.name, message: e.message.slice(0, 300) }));
}

/* THE PRODUCTION FAILURE WRAPPER, exported so tests can drive THIS function rather than a copy of
   it. That distinction is not pedantry: the first version of the error-surface suite defined its own
   inline wrapper, so it passed unchanged when the real one was reverted to the un-awaited form it
   was written to catch — a test of a copy is a test of nothing. */
export function wrapToolHandler(name: string, handler: (args: any) => any) {
  return async (args: any) => {
    try {
      /* AWAITED (GPT Pro pr-20260902T173936Z-a81123, finding 2). Returning the handler's promise
         un-awaited meant a REJECTION after the synchronous return escaped this try/catch entirely —
         so the sanitizer below covered only synchronous throws, while the Worker deliberately
         substitutes an ASYNC get_report. Awaiting is what makes the guarantee real rather than
         shaped like one. */
      return await Promise.resolve(handler(args ?? {}));
    } catch (err) {
      // Fail closed as an MCP tool error — never crash the transport. No override values are
      // logged, and since rec 13 the CALLER no longer receives raw internal text either.
      const code = classifyToolError(err);
      logToolErrorSafely(`tool:${name}`, err);
      return {
        content: [{ type: "text", text: `Tool ${name} failed (${code}). ${PUBLIC_ERROR_TEXT[code]}` }],
        /* MACHINE-READABLE (same finding, sub-point 2). A client should branch on a field, not by
           regex over an English sentence promising to be a "closed enum". */
        structuredContent: { error: { code, tool: name } },
        isError: true,
      };
    }
  };
}

export function buildServer(): McpServer {
  const server = new McpServer(
    { name: "inference-margins", version: SERVER_VERSION },
    { instructions: INSTRUCTIONS },
  );
  /* U5 (dc-map DESIGN §6): the seven datacenter tools are appended after the original eight.
     Never interleaved — the eight keep their names and their registration order. */
  const tools = [listScenarioSpace, queryMarginClaims, runScenario, adjustRentalRate,
    runFleetSections, exploreRange, getReport, getDossier,
    listDatacenters, getDatacenter, rankDatacenters, datacenterSchedule,
    datacenterImpact, datacenterStakeholders, priceTokenFromSite];
  for (const t of tools) {
    server.registerTool(t.name, t.config as any, wrapToolHandler(t.name, t.handler as any) as any);
  }
  return server;
}
