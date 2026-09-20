/* datacenter_stakeholders — DESIGN §1.4/§6. Dated, typed relationships and contract records with
   their contractual state. Prospective and non-executed roles are FUSED INTO THE SENTENCE rather
   than left for a reader to notice in a field: an announced tenancy, an option and an MOU are not
   a serving tenancy, and a GPU vendor is not a tenant. Tenant lists are non-additive. */
import { datacenterToolDescription, inputShape, READ_ONLY, runDatacenterTool } from "../dcmap/layer.js";
import type { ToolResult } from "../shape.js";

export const name = "datacenter_stakeholders";

export const config = {
  title: "Get one datacenter's stakeholders and contracts",
  description: datacenterToolDescription(
    "The dated typed relationships, tenant records and contract records for one site, each with its "
    + "contractual state (executed, option, MOU, announced), commencement, term and included/excluded "
    + "components where the producer promoted them. The leading sentence states how many of those records "
    + "are prospective or not yet executed, and says explicitly that none of them establish a provider's "
    + "serving allocation. Roles are distinct — owner-operator, lessee, serving-tenant, training-tenant, "
    + "colocation, developer, prospective — and tenant lists are never additive."),
  inputSchema: inputShape("datacenter_stakeholders"),
  annotations: READ_ONLY,
};

export function handler(args: unknown): Promise<ToolResult> {
  return runDatacenterTool("datacenter_stakeholders", args);
}
