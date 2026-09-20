/* get_datacenter — DESIGN §6. The promoted detail record for one site.
   Scenarios are named separately and never computed here: factual retrieval selects no margin
   scenario, so the response carries the typed not-applicable selection state rather than a
   number nobody asked for. */
import { datacenterToolDescription, inputShape, READ_ONLY, runDatacenterTool } from "../dcmap/layer.js";
import type { ToolResult } from "../shape.js";

export const name = "get_datacenter";

export const config = {
  title: "Get one datacenter's promoted evidence",
  description: datacenterToolDescription(
    "The promoted evidence atoms, relationships, dated capacity, schedule, gaps and publication "
    + "eligibility for one site in the pinned release. Every atom keeps its claim_nature, scope, "
    + "measurement boundary, capacity state, as-of date and sources, so a caller can tell a literal "
    + "disclosure from a declared plan from a model output rather than trusting a label. Conflict "
    + "adjudication records are reported as not-exported by the producer contract — an empty conflict "
    + "set is never inferred. Calculator scenarios are named separately: use price_token_from_site."),
  inputSchema: inputShape("get_datacenter"),
  annotations: READ_ONLY,
};

export function handler(args: unknown): Promise<ToolResult> {
  return runDatacenterTool("get_datacenter", args);
}
