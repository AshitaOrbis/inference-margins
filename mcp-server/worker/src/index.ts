/* inference-margins MCP — remote streamable-HTTP connector on Cloudflare Workers.
   Canonical stateless path (Cloudflare agents SDK): createMcpHandler + WorkerTransport
   (web-standards streamable HTTP) in a plain Worker — no Durable Object. A FRESH McpServer
   is built per request (buildServer() — the same eight tools, honest-labeling contract intact),
   as required by MCP SDK >=1.26 (cross-client response-leak guard, GHSA-345p-7cg4-v4c7).
   Posture: read-only, no auth, no secrets — the same exposure as the public site. 64 KB body
   cap (matching the Node http.ts); request bodies are NEVER logged — they may contain a
   caller's private negotiated rates.

   Body-cap enforcement (Pro review 2026-07-29 rec 2 / finding C-4, the Worker-side companion
   to the Node http.ts fix — re-found as bq-1014, bq-1251, bq-1196, bq-1252): the cap used to
   be checked only AFTER `request.arrayBuffer()` had already materialised the whole body, so
   an oversized request was fully buffered before being rejected. readBodyCapped (now in
   ./body-cap.ts, a dependency-free module so it can be unit-tested under plain Node) checks
   Content-Length before touching the stream at all, and otherwise cancels the reader the
   instant the cap is crossed. */
import { createMcpHandler } from "agents/mcp";
import { buildServer, SERVER_VERSION } from "./gen/server.js";
import { E, SITE } from "./gen/engine.js";
import { EMBEDDED_RELEASE } from "./gen/dcmap/release.gen.js";
import { readBodyCapped, overLongBatch } from "./body-cap.js";

const BODY_CAP = 64 * 1024;
/* JSON-RPC BATCH CAP (Polaris ruling 2026-09-19, Astra pack C P1-1). The body cap bounds BYTES,
   not WORK, and a JSON-RPC array multiplies one by the other: 128 `adjust_rental_rate` calls fit
   in 18,579 bytes and returned 128 results, ~10.7 s of local CPU and ~6 MB of response, against
   a configured Worker CPU limit of 5,000 ms; 449 such calls fit inside the 64 KB cap with
   consecutive ids. Every tool here is read-only and idempotent, so a legitimate client has no
   reason to need a long batch — the SDK clients that batch at all send a handful. Eight is
   generous against observed usage and two orders of magnitude below the amplification. An
   over-long batch is a 4xx, because it is the caller's request that is wrong. */
const BATCH_CAP = 8;

function deny(status: number, message: string): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message }, id: null }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    /* Review finding 1 (2026-08-21, diff review of the rec-2/rec-6 commit): this handler had NO
       error handling at all, while its Node twin (../../src/http.ts) is deliberately built as
       layered try/catch so nothing escapes. Any throw here — from readBodyCapped on a torn
       request stream, from buildServer(), or from the MCP handler — surfaced as the Workers
       platform's own error page instead of the {jsonrpc, error} shape this endpoint documents.
       Nothing is logged: a thrown error can carry request content, and bodies may contain a
       caller's private negotiated rates. */
    try {
      return await handle(request, env, ctx);
    } catch {
      return deny(500, "Internal error");
    }
  },
} satisfies ExportedHandler;

async function handle(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/" && request.method === "GET") {
    return new Response(
      `inference-margins MCP v${SERVER_VERSION} (streamable HTTP, stateless) — MCP endpoint: ${url.origin}/mcp\n` +
      `Read-only claims registry + pure scenario calculator over ${SITE.calculator} — engine ${E.ENGINE_REVISION}, data as of ${E.DATA_AS_OF}.\n` +
      `Eight margin tools: list_scenario_space, query_margin_claims, run_scenario, adjust_rental_rate, run_fleet_sections, explore_range, get_report, get_dossier.\n` +
      `Seven datacenter tools: list_datacenters, get_datacenter, rank_datacenters, datacenter_schedule, datacenter_impact, datacenter_stakeholders, price_token_from_site.\n` +
      /* The substrate release is baked in at build time and named here, so the binding is visible
         without a tool call — and an absent one says so rather than reading as a healthy empty
         registry. */
      `Datacenter evidence release: ${EMBEDDED_RELEASE.status === "ok" ? EMBEDDED_RELEASE.release_id : `none embedded (${EMBEDDED_RELEASE.reasons.join("; ")})`}.\n`,
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
  if (url.pathname !== "/mcp") return deny(404, "Not found — the MCP endpoint is /mcp");

  // Body cap — enforced while streaming (see file header), not on the buffered body.
  let req = request;
  if (request.method === "POST") {
    const capped = await readBodyCapped(request, BODY_CAP);
    if (!capped.ok) return deny(413, "Request body exceeds the 64KB cap");
    /* Review finding 3, verified on Node v24.14.0: `new Request(request, {body})` INHERITS the
       original Content-Length header rather than recomputing it, so a client that declares a
       length under the cap and then sends fewer bytes (an early close) produces a forwarded
       Request advertising a length its body does not have. Nothing downstream reads that header
       today — Workers' .json()/.text() read the stream — but handing a self-inconsistent Request
       to a handler is a defect on its own terms, and it breaks silently the moment anything
       forwards or re-fetches it. Drop it and let the runtime derive the length from the bytes. */
    /* Read the batch length off the bytes we already have, before a server is built or a single
       tool runs. The predicate lives in ./body-cap.ts so the suite can exercise the PRODUCTION
       function under plain Node rather than a copy of it. Parse failures are NOT decided here:
       a malformed body is the MCP handler's to answer in its own error shape. */
    const batchLength = overLongBatch(capped.bytes, BATCH_CAP);
    if (batchLength) {
      return deny(400, `JSON-RPC batch of ${batchLength} exceeds the ${BATCH_CAP}-request cap — `
        + "send the calls separately or in smaller batches");
    }
    req = new Request(request, { body: capped.bytes });
    req.headers.delete("content-length");
  }

  // Fresh server + transport per request: stateless, no cross-request state to leak.
  const server = buildServer();
  const handler = createMcpHandler(server, { route: "/mcp", enableJsonResponse: true });
  return handler(req, env, ctx);
}
