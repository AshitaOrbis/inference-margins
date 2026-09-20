/* price_token_from_site — DESIGN §5/§6: "the run_scenario envelope with site/pool evidence".
   Not a second envelope. A modeled result carries a `run_scenario` sub-object whose keys and
   nesting ARE the existing tool's structuredContent (headline, costs, traffic, lens span,
   form-correction debt, feasibility with per-leg solver receipts, pairing, provenance), read from
   the same engine over the leg-isolated state of the queried accelerator. The status-fused margin
   string and the existing selection_receipt union are unchanged and travel in both places.

   An insufficient-evidence result is a NORMAL response, not a tool error: it names every missing
   material component, and clients that suppress structuredContent on isError would hide exactly
   the part that is the point of the refusal. */
import { datacenterToolDescription, inputShape, READ_ONLY, runDatacenterTool } from "../dcmap/layer.js";
import type { ToolResult } from "../shape.js";

export const name = "price_token_from_site";

export const config = {
  title: "Price a token from one site's cost pool",
  description: datacenterToolDescription(
    "Prices a modeled cost per million workload-mix tokens from ONE named site/service-boundary cost pool: "
    + "declared economic perspective, phase and coverage, disclosed key-level hardware counts (or explicitly "
    + "hypothetical hardware in scenario mode), a complete electricity bill from a promoted applicable tariff "
    + "version through a declared load shape, PUE applied once, disjoint annualized cost scopes, and the "
    + "rent inclusion/exclusion matrix — then the unchanged model/hardware engine for throughput. Returns the "
    + "run_scenario envelope with site and pool evidence, the annual cost band, the per-component breakdown "
    + "and every receipt (evidence, assumption, calculation, exclusion, unresolved-dependency). When any "
    + "material component is missing, ambiguous or contradicted, the result is a transparent "
    + "insufficient-evidence answer that NAMES the missing components instead of an all-in number — that is "
    + "a normal response, not an error. Unsplit mixed inventory stays unsplit; hypothetical hardware never "
    + "raises factual coverage; financing commitments are never capex."),
  inputSchema: inputShape("price_token_from_site"),
  annotations: READ_ONLY,
};

export function handler(args: unknown): Promise<ToolResult> {
  return runDatacenterTool("price_token_from_site", args);
}
