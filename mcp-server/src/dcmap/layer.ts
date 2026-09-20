/* The bridge from this server's transport to the U3 query/calculation layer.

   DESIGN §6: the seven datacenter tools sit on "the same shared query/calculation layer as the
   browser", with "no forked enums, no caller-forged receipts". So this module holds ALL of the
   adaptation, and each tool file is a thin registration: the input schema is U3's own
   (`InputSchemas`), the response is U3's own envelope (`toEnvelope`), and nothing here computes,
   relabels or re-adjudicates anything the economics layer decided.

   Two things are genuinely this layer's to own, and only two:
     1. WHICH release is open (substrate.ts) and which legacy engine context it is paired with.
     2. What a request gets when there is NO release to answer from — the typed
        `release-unavailable` refusal, because U3's `execute` can only exist once a release does. */
import type { ZodRawShape } from "zod";
import { E, DC_REGISTRY } from "../engine.js";
import { openActiveRelease, type ReleaseBinding } from "./substrate.js";
import { createQueryLayer, type QueryLayer } from "./economics/query.js";
import { InputSchemas, type ToolName } from "./economics/dto.js";
import type { EconomicsContext, LegacyEngine, LegacyRegistry } from "./economics/legacy.js";
import type { Release } from "./economics/release.js";
import type { ToolResult } from "../shape.js";

/* The legacy context U3 asks for: the unchanged engine, and the unchanged T4 registry module whose
   `validateDcRegistry` gates a release's adapter rows before they price anything.

   `profiles` is EMPTY, deliberately. A registered comparison profile is producer/ledger state —
   the thing a quotable ranking is pinned to — and minting one here would be exactly the forked
   enum DESIGN §6 forbids. Until the substrate publishes a profile registry, `rank_datacenters`
   takes fully validated parameters and `{profile_id}` refuses with U3's own reason. */
export function economicsContext(): EconomicsContext {
  return {
    engine: E as unknown as LegacyEngine,
    registry: DC_REGISTRY as unknown as LegacyRegistry,
    profiles: {},
  };
}

export interface OpenLayer {
  ok: true; layer: QueryLayer; release: Release; binding: ReleaseBinding;
}
export interface ClosedLayer {
  ok: false; status: "release-unavailable" | "release-mismatch"; sentence: string;
  release_id: string; reasons: string[]; binding: ReleaseBinding;
}
export type LayerState = OpenLayer | ClosedLayer;

let opened: Promise<LayerState> | null = null;

/** One query layer for one exact release, for the life of the process. */
export function datacenterLayer(): Promise<LayerState> {
  if (!opened) {
    opened = openActiveRelease().then((active) => active.ok
      ? { ok: true as const, layer: createQueryLayer(active.release, economicsContext()), release: active.release, binding: active.binding }
      : { ok: false as const, status: active.status, sentence: active.sentence, release_id: active.release_id, reasons: active.reasons, binding: active.binding });
  }
  return opened;
}

/** Test seam only: drop the pinned layer so a suite can open a different release root. */
export function resetDatacenterLayer(): void { opened = null; }

/* The refusal envelope. It mirrors U3's response base field for field with ONE documented
   difference, and the difference is forced: `OutputSchemas` requires a well-formed `rel-…`
   `release_id` on every response, and a request that could not resolve CURRENT at all has no
   exact release to name. Inventing one would be the silent-substitution E9 exists to forbid, so
   the field is null and the reason says why. Recorded as a producer gap in dc-map/U5-STATUS.md. */
export function releaseRefusal(tool: ToolName, closed: ClosedLayer): ToolResult {
  const release_id = /^rel-[a-f0-9]{24}$/.test(closed.release_id) ? closed.release_id : null;
  const sentence = `${closed.sentence} No other release was substituted; ${tool} cannot answer without the exact release it was asked for.`;
  return {
    content: [{ type: "text", text: sentence }],
    structuredContent: {
      tool, status: closed.status, sentence, release_id,
      selection_receipt: { state: "not-applicable", reason: "no release is open, so no margin scenario was selected" },
      receipts: [], reasons: closed.reasons, data: null,
      release_binding: closed.binding,
    },
    isError: true,
  };
}

/** Run one datacenter tool. The envelope's PRODUCER fields are U3's, unmodified; this layer adds
    exactly one field of its own, and adds it on every path.

    bq-2188. `release_binding` says WHERE the bytes were loaded from — filesystem on the Node
    server, embedded at build time in the Worker. It is this layer's fact, not U3's, which is why
    `OutputSchemas` is strict without it, and it was published on the refusal path only.

    BE PRECISE ABOUT WHAT WAS MISSING, because the first version of this comment was not (Astra
    xhigh review, 2026-09-10, finding B4). A successful response ALWAYS named its release: U3's
    `respond` sets `release_id` from `release.manifest.release_id` on every envelope. What the
    success path omitted was LOADING PROVENANCE — not which release, but whether these bytes were
    read off a filesystem or baked into a bundle. That is the axis on which Node and Worker legally
    differ and the only axis on which they may, so it is the one a parity check must compare and a
    caller must be able to see; and `ReleaseBinding` carries exactly that (kind, root, note) and no
    identity of its own.

    The asymmetry was invisible while no dc-map release existed anywhere: every call took the
    refusal path, so every answer carried a binding. `b216807` materialized a release into the tree,
    the success path ran for the first time, and the connector started answering with data while
    saying nothing about where it had loaded it from — and a Worker/Node parity check cannot compare
    a field only one branch emits. Both paths carry it now, and it is pinned on the success path
    against a materialized release in `mcp-server/test/dcmap-success-binding.test.mjs` and on the
    refusal path in `dcmap-release-binding.test.mjs`.

    THE CONSUMER BOUNDARY, stated because adding a field creates one. What comes back here is
    U3's producer payload PLUS this connector's metadata. `OutputSchemas` is strict, so a consumer
    that re-parses the whole `structuredContent` through it will now reject a successful response
    on `unrecognized_keys: ["release_binding"]` — and the fix is never to loosen the producer
    schema. A consumer validating against U3 must project the producer fields first (`tool`,
    `status`, `sentence`, `release_id`, `selection_receipt`, `receipts`, `reasons`, `data`) and
    validate `release_binding` as connector metadata separately, exactly as it must already treat
    the refusal envelope, whose `release_id` is legally null where U3's schema requires a
    well-formed `rel-…`. Nothing in this repository re-parses connector output through
    `OutputSchemas`; the only caller is `toEnvelope` itself, on the way out of the producer. */
export async function runDatacenterTool(tool: ToolName, args: unknown): Promise<ToolResult> {
  const state = await datacenterLayer();
  if (!state.ok) return releaseRefusal(tool, state);
  const envelope = await state.layer.execute(tool, args ?? {});
  return {
    content: envelope.content as Array<{ type: "text"; text: string }>,
    structuredContent: {
      ...(envelope.structuredContent as unknown as Record<string, unknown>),
      release_binding: state.binding as unknown as Record<string, unknown>,
    },
    ...(envelope.isError ? { isError: true } : {}),
  };
}

/** The published input shape for a datacenter tool — U3's schema, never a restatement of it. */
export function inputShape(tool: ToolName): ZodRawShape {
  return (InputSchemas[tool] as unknown as { shape: ZodRawShape }).shape;
}

export const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

/* The one sentence every datacenter tool's description ends with. The honest-labeling contract of
   this server applies unchanged: the lead sentence is the quotable unit, and a datacenter price is
   a MODELED scenario output with receipts even when every input it consumed was disclosed. */
export function datacenterToolDescription(body: string): string {
  return body + " Exact-release pinned: every response names the immutable rel-… release it was "
    + "computed from and refuses rather than fall back to another. Lead-sentence contract: quote or "
    + "closely paraphrase the response's leading sentence. Physical evidence never establishes a "
    + "provider's serving allocation, and every priced result is a "
    + "modeled scenario output with receipts — never an observed site bill.";
}
