/* Streamable-HTTP entrypoint — STATELESS (sessionIdGenerator: undefined): a fresh server +
   transport per POST, so requests never share state and horizontal scaling is trivial.
   Single endpoint /mcp; GET → 405 (no SSE notification stream in stateless mode); body capped
   at 64 KB. Request bodies are NEVER logged — they may contain a caller's private rates.

   Robustness (Pro review 2026-07-29 rec 2 / findings C-4, C-5 — independently re-found as
   bq-1014, bq-1251, bq-1196, bq-1252): a malformed Host header used to crash the process
   (C-5), and the oversized-body path tore the socket down before the documented 413 could
   be written (C-4). Every guard below traces back to one of those two findings; see the
   inline comments at each site. */
import http from "node:http";
import type { Socket } from "node:net";
import { buildServer } from "./server.js";
import { E } from "./engine.js";

const StreamableHTTPServerTransport = (await import("@modelcontextprotocol/sdk/server/streamableHttp.js")).StreamableHTTPServerTransport;

const PORT = Number(process.env.PORT ?? 8977);
const HOST = process.env.HOST ?? "127.0.0.1";
const BODY_CAP = 64 * 1024;

/** Logs only the error's name/message/stack — NEVER the request, a header value, or the
    body (see file header: they may carry a caller's private negotiated rates). */
function logSafely(where: string, err: unknown): void {
  const shape = err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : { message: String(err) };
  console.error(`[inference-margins-mcp/http] ${where}:`, shape);
}

function deny(res: http.ServerResponse, status: number, message: string): void {
  // C-4: guard against writing to a response that already went out (e.g. the body-cap path
  // hitting the limit right as the client also finished sending) — a duplicate completion
  // must not throw ERR_STREAM_WRITE_AFTER_END.
  if (res.headersSent || res.writableEnded) return;
  try {
    res.writeHead(status, { "Content-Type": "application/json" }).end(
      JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message }, id: null }),
    );
  } catch (err) {
    // The socket may already be tearing down underneath us; nothing more to do.
    logSafely("deny() write", err);
  }
}

const httpServer = http.createServer(async (req, res) => {
  // C-5: the whole body below is one try/catch so any throw — synchronous, or from an
  // awaited rejection — produces a 400 instead of escaping as an uncaught exception. The
  // req.on("end", async () => {...}) listener further down runs on its OWN call stack (a
  // separate async event-listener invocation), so this try/catch does not reach into it —
  // it has its own guard.
  try {
    // Stream-level guards: an early client disconnect or a torn body must surface as a
    // handled no-op, not an unhandled 'error'/'aborted' event (both are otherwise fatal).
    req.on("error", (err) => logSafely("request stream", err));
    req.on("aborted", () => { /* client disconnected mid-request; nothing to respond to */ });
    res.on("error", (err) => logSafely("response stream", err));

    // C-5: never interpolate the client-controlled Host into the URL base — a raw
    // `Host: a b` (or `Host: [`, `Host: [::1`) makes `new URL()` throw synchronously, which
    // used to kill the whole process from inside this listener. req.url is parsed against a
    // FIXED base; only the request path is ever needed here.
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname !== "/mcp") return deny(res, 404, "Not found — the MCP endpoint is /mcp");
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return deny(res, 405, "Method not allowed — this server runs stateless streamable HTTP; POST /mcp only");
    }

    // C-4: reject by a valid, parseable Content-Length BEFORE reading any body at all.
    const declaredLength = req.headers["content-length"];
    if (declaredLength !== undefined) {
      const n = Number(declaredLength);
      if (Number.isFinite(n) && n > BODY_CAP) return deny(res, 413, "Request body exceeds the 64KB cap");
    }

    let size = 0;
    const chunks: Buffer[] = [];
    let capped = false;
    req.on("data", (c: Buffer) => {
      if (capped) return;
      size += c.length;
      if (size > BODY_CAP) {
        capped = true;
        chunks.length = 0; // reject — never hold bytes past the cap (never logged either way)
        // C-4: the previous code called req.destroy() HERE, before deny() had written
        // anything, tearing the socket down mid-response — the client saw a connection
        // reset instead of the documented JSON 413. Stop pulling more body in, write the
        // response, and only destroy once it has actually flushed (res "finish").
        req.pause();
        deny(res, 413, "Request body exceeds the 64KB cap");
        res.once("finish", () => { if (!req.destroyed) req.destroy(); });
        return;
      }
      chunks.push(c);
    });
    req.on("end", async () => {
      // Own call stack (async event-listener invocation) — the outer try/catch above does
      // not cover this; it needs its own guard (C-5).
      try {
        if (capped) return; // 413 already sent — see the "data" handler above
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
          /* Review finding 2 (2026-08-21): if handleRequest ever writes headers and THEN throws,
             deny() correctly declines to write — but nothing finished the response, so a
             keep-alive client would wait forever. Traced and NOT currently reachable: the SDK
             delegates to @hono/node-server, whose listener already destroys a headers-sent
             response on error. This branch is insurance against that internal guard regressing in
             a future SDK/hono version, which nothing in this file otherwise pins. */
          else if (!res.writableEnded) res.destroy();
        }
      } catch (err) {
        logSafely("request end handler", err);
        deny(res, 400, "Bad request");
      }
    });
  } catch (err) {
    logSafely("request handler", err);
    deny(res, 400, "Bad request");
  }
});

// C-5 (rec 2): malformed request lines or header syntax can trip Node's own HTTP parser
// before a `req` object ever reaches the handler above — this is the only place that catches
// that class. Canonical Node pattern: skip ECONNRESET / an already-non-writable socket (the
// write would throw), otherwise hand back a bare 400 and close. No caller data to log.
httpServer.on("clientError", (err: NodeJS.ErrnoException, socket: Socket) => {
  logSafely("clientError", err);
  if (err.code === "ECONNRESET" || !socket.writable) return;
  socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
});

// Last-resort guards (rec 2, same review): a throw that somehow still escapes every
// per-request guard above must not take the whole server down. Log the error's shape only —
// NEVER the request, a header value, or the body (see file header) — and keep serving.
process.on("unhandledRejection", (reason) => logSafely("unhandledRejection", reason));
process.on("uncaughtException", (err) => logSafely("uncaughtException", err));

httpServer.listen(PORT, HOST, () => {
  const addr = httpServer.address();
  const port = typeof addr === "object" && addr ? addr.port : PORT;
  console.log(`inference-margins MCP (streamable HTTP, stateless) listening on http://${HOST}:${port}/mcp — engine ${E.ENGINE_REVISION}, data as of ${E.DATA_AS_OF}`);
});
