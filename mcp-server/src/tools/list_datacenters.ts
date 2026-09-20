/* list_datacenters — DESIGN §6, first of the seven datacenter tools.
   A thin adapter over U3's `execute`: the schema, the filtering, the coverage/exclusion counts and
   the sentence are all the shared query layer's. Programmes and cloud regions are returned only on
   explicit request (`include_nonphysical`), because a cloud region is not a campus and never
   enters the campus count. */
import { datacenterToolDescription, inputShape, READ_ONLY, runDatacenterTool } from "../dcmap/layer.js";
import type { ToolResult } from "../shape.js";

export const name = "list_datacenters";

export const config = {
  title: "List tracked datacenter sites",
  description: datacenterToolDescription(
    "Typed, filtered, paginated listing of the physical sites in the dc-map evidence registry, with "
    + "coverage and exclusion counts and a tracked-evidence capacity total assembled from the producer's "
    + "own aggregation receipts (once per evidence id; a parent and a covered descendant are never both "
    + "added). Filter by country, owner, status, capacity floor, free text, or explicitly by unknown "
    + "capacity. Programmes and cloud regions appear only under include_nonphysical, and contained "
    + "phases only under include_components. A pagination cursor is bound to the exact release, the "
    + "manifest digest and the filter set, so it cannot be replayed against a different release."),
  inputSchema: inputShape("list_datacenters"),
  annotations: READ_ONLY,
};

export function handler(args: unknown): Promise<ToolResult> {
  return runDatacenterTool("list_datacenters", args);
}
