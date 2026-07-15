/* inference-margins MCP — remote streamable-HTTP connector on Cloudflare Workers.
   Canonical stateless path (Cloudflare agents SDK): createMcpHandler + WorkerTransport
   (web-standards streamable HTTP) in a plain Worker — no Durable Object. A FRESH McpServer
   is built per request (buildServer() — the same six tools, honest-labeling contract intact),
   as required by MCP SDK >=1.26 (cross-client response-leak guard, GHSA-345p-7cg4-v4c7).
   Posture: read-only, no auth, no secrets — the same exposure as the public site. 64 KB body
   cap (matching the Node http.ts); request bodies are NEVER logged — they may contain a
   caller's private negotiated rates. */
import { createMcpHandler } from "agents/mcp";
import { buildServer, SERVER_VERSION } from "./gen/server.js";
import { E, SITE } from "./gen/engine.js";

const BODY_CAP = 64 * 1024;

function deny(status: number, message: string): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message }, id: null }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        `inference-margins MCP v${SERVER_VERSION} (streamable HTTP, stateless) — MCP endpoint: ${url.origin}/mcp\n` +
        `Read-only claims registry + pure scenario calculator over ${SITE.calculator} — engine ${E.ENGINE_REVISION}, data as of ${E.DATA_AS_OF}.\n` +
        `Six tools: list_scenario_space, query_margin_claims, run_scenario, explore_range, get_report, get_dossier.\n`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
    }
    if (url.pathname !== "/mcp") return deny(404, "Not found — the MCP endpoint is /mcp");

    // Body cap — enforced on the buffered body, not just the Content-Length header.
    let req = request;
    if (request.method === "POST") {
      const raw = await request.arrayBuffer();
      if (raw.byteLength > BODY_CAP) return deny(413, "Request body exceeds the 64KB cap");
      req = new Request(request, { body: raw });
    }

    // Fresh server + transport per request: stateless, no cross-request state to leak.
    const server = buildServer();
    const handler = createMcpHandler(server, { route: "/mcp", enableJsonResponse: true });
    return handler(req, env, ctx);
  },
} satisfies ExportedHandler;
