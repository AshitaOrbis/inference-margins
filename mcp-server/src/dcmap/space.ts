/* The dc-map half of discovery (DESIGN §6: "`list_scenario_space` extended with the accepted ids,
   schemas, metrics and compatibility versions").

   It is the U3 layer's OWN `list_scenario_space` response, unwrapped — not a second listing
   assembled here. That matters for the same reason the T4 fold's discovery does: a caller must be
   able to read the ids and schemas the validator actually enforces, and a transcription can drift
   from the validator while a projection cannot. When no release is open, the block says so with
   the typed status and reasons instead of publishing an empty registry that reads like "there are
   no sites". */
import { datacenterLayer } from "./layer.js";
import type { Json } from "./economics/presentation.js";

export interface DatacenterSpace {
  status: "ok" | "release-unavailable" | "release-mismatch";
  release_id: string | null;
  release_binding: Json;
  sentence: string;
  reasons: string[];
  tools: string[];
  accepted_ids: Json;
  profiles: Json;
  schemas: Json;
  metrics: Json;
  compatibility: Json;
}

export const DATACENTER_TOOLS = [
  "list_datacenters", "get_datacenter", "rank_datacenters", "datacenter_schedule",
  "datacenter_impact", "datacenter_stakeholders", "price_token_from_site",
] as const;

export async function datacenterSpace(): Promise<DatacenterSpace> {
  const state = await datacenterLayer();
  const base = { tools: [...DATACENTER_TOOLS] };
  if (!state.ok) {
    return {
      ...base, status: state.status, release_id: null,
      release_binding: state.binding as unknown as Json,
      sentence: state.sentence,
      reasons: state.reasons,
      accepted_ids: null, profiles: null, schemas: null, metrics: null, compatibility: null,
    };
  }
  const response = (await state.layer.execute("list_scenario_space", {})).structuredContent as {
    sentence: string; release_id: string; reasons: string[]; data: Record<string, Json> | null;
  };
  const data = response.data ?? {};
  return {
    ...base, status: "ok", release_id: response.release_id,
    release_binding: state.binding as unknown as Json,
    sentence: response.sentence,
    reasons: response.reasons ?? [],
    accepted_ids: data.accepted_ids ?? null,
    profiles: data.profiles ?? null,
    schemas: data.schemas ?? null,
    metrics: data.metrics ?? null,
    compatibility: data.compatibility ?? null,
  };
}
