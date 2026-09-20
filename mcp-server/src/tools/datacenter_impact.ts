/* datacenter_impact — DESIGN §6. A replacement scenario: what changes if this pool's workload
   moves to another one. Both sides are priced through the SAME comparison profile, the
   `what_changed` receipts name every differing pool component, and the allocation share is a
   NAMED assumption — a missing one is an explicit unresolved dependency, never a default of 1.0.
   The comparator is labelled a modeled comparison baseline, not a verified central margin. */
import { datacenterToolDescription, inputShape, READ_ONLY, runDatacenterTool } from "../dcmap/layer.js";
import type { ToolResult } from "../shape.js";

export const name = "datacenter_impact";

export const config = {
  title: "Model a datacenter replacement scenario",
  description: datacenterToolDescription(
    "Prices a baseline site cost pool and a replacement pool on one fixed comparison profile and returns "
    + "the central (baseline) value, the allocation-adjusted value, both full scenario results and a "
    + "what_changed receipt naming every pool component that differs. The share of the declared workload "
    + "the replacement serves is supplied as a named allocation assumption with its own evidence ids; "
    + "without one the response is insufficient-evidence carrying an unresolved-dependency receipt, "
    + "because physical evidence never establishes a provider's serving allocation. The baseline is "
    + "labelled a modeled comparison baseline, not a verified central margin, and a profile-hash "
    + "mismatch between the two pools refuses the comparison outright."),
  inputSchema: inputShape("datacenter_impact"),
  annotations: READ_ONLY,
};

export function handler(args: unknown): Promise<ToolResult> {
  return runDatacenterTool("datacenter_impact", args);
}
