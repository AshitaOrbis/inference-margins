/* buildServer() — one server, two entrypoints (stdio.ts / http.ts).
   Six read-only tools registered in the site's own order. No tool name contains "margin"
   except query_margin_claims (which returns claims, not computed margins). */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { E, SITE } from "./engine.js";
import * as listScenarioSpace from "./tools/list_scenario_space.js";
import * as queryMarginClaims from "./tools/query_margin_claims.js";
import * as runScenario from "./tools/run_scenario.js";
import * as exploreRange from "./tools/explore_range.js";
import * as getReport from "./tools/get_report.js";
import * as getDossier from "./tools/get_dossier.js";

export const SERVER_VERSION = "1.0.0";

const INSTRUCTIONS = `Frontier Inference Margins — read-only claims registry + pure scenario calculator (the same substrate as ${SITE.calculator}, engine ${E.ENGINE_REVISION}, data as of ${E.DATA_AS_OF}).

Honest-labeling contract (load-bearing):
- Every response leads with a complete honest sentence; quote or closely paraphrase it. A bare number without its welded status is a misquote.
- Margin values are status-fused strings ("≈77% (unit serving, not company GM)", "≥80% (floor)", "≈93% (counterfactual)"); bare scalars exist only inside selection_receipt, whole-point rounded.
- Every response carries selection_receipt with the central estimate alongside — never present a non-central result without it.
- The metric is a modeled unit direct-serving contribution margin — NOT an audited accounting company gross margin (see report-s7 for the bridge).
- run_scenario is the only tool that derives an estimate. explore_range returns page-authored counterfactuals (what would have to be true), never estimates. query_margin_claims returns cited claims; floors are compatible-with relations, never intervals; company-GM figures are different objects from unit-serving claims.`;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function buildServer(): McpServer {
  const server = new McpServer(
    { name: "inference-margins", version: SERVER_VERSION },
    { instructions: INSTRUCTIONS },
  );
  const tools = [listScenarioSpace, queryMarginClaims, runScenario, exploreRange, getReport, getDossier];
  for (const t of tools) {
    server.registerTool(t.name, t.config as any, (async (args: any) => {
      try {
        return (t.handler as any)(args ?? {});
      } catch (err) {
        // Fail closed as an MCP tool error — never crash the transport. No override values are logged.
        return {
          content: [{ type: "text", text: `Tool ${t.name} failed: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }) as any);
  }
  return server;
}
