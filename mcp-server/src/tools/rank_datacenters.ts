/* rank_datacenters — DESIGN §5/§6, the ranking that refuses to overclaim.
   Every scenario is RECOMPUTED from its validated bundle through the one comparability validator;
   caller-supplied values and receipts are never ranked. Overlapping bands stay a connected GROUP
   with no internal order, a midpoint sort is labelled as one, excluded scenarios are listed with
   their reasons, and the sentence says "modeled … among these eligible scenarios" — never "the
   cheapest datacenter". */
import { datacenterToolDescription, inputShape, READ_ONLY, runDatacenterTool } from "../dcmap/layer.js";
import type { ToolResult } from "../shape.js";

export const name = "rank_datacenters";

export const config = {
  title: "Rank datacenter cost scenarios",
  description: datacenterToolDescription(
    "Compares fully validated site cost scenarios on ONE fixed comparison profile — the same workload, "
    + "hardware key, procurement basis, date, currency and term — and returns the canonical profile hash, "
    + "the metric definition, the ordering basis, each eligible scenario's modeled band, the connected "
    + "overlap groups, and every excluded scenario with its reasons. Overlapping bands are a group, not a "
    + "proven tie and not an internal ranking; a midpoint sort is available and is labelled as a sort of "
    + "modeled middle assumptions. There is no default all-in $/H100e-hour across dissimilar accelerators, "
    + "so a scenario whose hardware differs from the profile is excluded rather than converted. Supply "
    + "`comparison.parameters`; `comparison.profile_id` requires a registered profile and the substrate "
    + "publishes none yet (see list_scenario_space.datacenters.accepted_ids.comparison_profiles)."),
  inputSchema: inputShape("rank_datacenters"),
  annotations: READ_ONLY,
};

export function handler(args: unknown): Promise<ToolResult> {
  return runDatacenterTool("rank_datacenters", args);
}
