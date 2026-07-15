/* Streamable-HTTP entrypoint — STATELESS (sessionIdGenerator: undefined): a fresh server +
   transport per POST, so requests never share state and horizontal scaling is trivial.
   Single endpoint /mcp; GET → 405 (no SSE notification stream in stateless mode); body capped
   at 64 KB. Request bodies are NEVER logged — they may contain a caller's private rates. */
import http from "node:http";
import { buildServer } from "./server.js";
import { E } from "./engine.js";

const StreamableHTTPServerTransport = (await import("@modelcontextprotocol/sdk/server/streamableHttp.js")).StreamableHTTPServerTransport;

const PORT = Number(process.env.PORT ?? 8977);
const HOST = process.env.HOST ?? "127.0.0.1";
const BODY_CAP = 64 * 1024;

function deny(res: http.ServerResponse, status: number, message: string): void {
  res.writeHead(status, { "Content-Type": "application/json" }).end(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message }, id: null }),
  );
}

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (url.pathname !== "/mcp") return deny(res, 404, "Not found — the MCP endpoint is /mcp");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return deny(res, 405, "Method not allowed — this server runs stateless streamable HTTP; POST /mcp only");
  }

  let size = 0;
  const chunks: Buffer[] = [];
  let capped = false;
  req.on("data", (c: Buffer) => {
    size += c.length;
    if (size > BODY_CAP) {
      capped = true;
      req.destroy();
      deny(res, 413, "Request body exceeds the 64KB cap");
      return;
    }
    chunks.push(c);
  });
  req.on("end", async () => {
    if (capped) return;
    let body: unknown;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return deny(res, 400, "Parse error: invalid JSON");
    }
    try {
      const server = buildServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless — no session ids, no server-held state
        enableJsonResponse: true,
      });
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch {
      // no request contents in logs — they may contain private rates
      if (!res.headersSent) deny(res, 500, "Internal error");
    }
  });
});

httpServer.listen(PORT, HOST, () => {
  const addr = httpServer.address();
  const port = typeof addr === "object" && addr ? addr.port : PORT;
  console.log(`inference-margins MCP (streamable HTTP, stateless) listening on http://${HOST}:${port}/mcp — engine ${E.ENGINE_REVISION}, data as of ${E.DATA_AS_OF}`);
});
