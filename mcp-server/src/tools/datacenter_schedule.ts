/* datacenter_schedule — DESIGN §1.3/§6. Baselines, revisions, observed events and the producer's
   deterministic comparison receipts, at the release's immutable `assessment_as_of`.
   The decision-table tokens are RELAYED, never derived here and never softened: an
   `overdue-unverified` is not "delayed", a `timing-indeterminate` is not resolved by guessing,
   `target-window-open` is not lateness, and `no-baseline` means the producer recorded no target —
   not that nothing was exported. No browser clock and no server clock moves an assessment. */
import { datacenterToolDescription, inputShape, READ_ONLY, runDatacenterTool } from "../dcmap/layer.js";
import type { ToolResult } from "../shape.js";

export const name = "datacenter_schedule";

export const config = {
  title: "Get one datacenter's schedule assessment",
  description: datacenterToolDescription(
    "The milestone schedule for one site: the immutable baseline target, the latest revised target, the "
    + "observed event and the producer's deterministic assessment for each, with the formula and the "
    + "release's assessment_as_of date. Baseline and latest-target timing are kept separately and a "
    + "revision erases neither. Date precision is preserved: a year-precision target is a window, not a "
    + "day. The assessment tokens — completed-within-window, completed-early, completed-late, "
    + "completed-by-deadline, timing-indeterminate, target-window-open, future-target, overdue-unverified "
    + "and no-baseline — are the producer's and are relayed verbatim; overdue-unverified means silence, "
    + "not delay. Intermediate revision history is not guaranteed by the presentation contract, and the "
    + "response says so rather than implying completeness. Optionally filter by milestone or phase."),
  inputSchema: inputShape("datacenter_schedule"),
  annotations: READ_ONLY,
};

export function handler(args: unknown): Promise<ToolResult> {
  return runDatacenterTool("datacenter_schedule", args);
}
