/* Streaming body-cap helper — pulled out of index.ts (Pro review 2026-07-29 rec 2 /
   finding C-4, Worker-side companion to the Node http.ts fix; re-found as bq-1014, bq-1251,
   bq-1196, bq-1252) so it is a PURE function with no "agents/mcp" / Workers-runtime imports
   and can be unit-tested directly under plain Node (worker/test/body-cap.test.mjs) — the
   rest of this module pulls in `cloudflare:`-scheme imports that only resolve under wrangler.

   Reuses the streaming-reader shape from feedback/src/worker.js's readBodyCapped (same
   repo, same pattern): check Content-Length before touching the stream at all, and
   otherwise cancel the reader the instant the running total crosses the cap — the body is
   never materialised past `cap` bytes, even transiently. */

export type BodyCapResult = { ok: true; bytes: Uint8Array } | { ok: false };

export async function readBodyCapped(request: Request, cap: number): Promise<BodyCapResult> {
  // Reject by a valid, parseable Content-Length BEFORE touching the stream at all — mirrors
  // the same precheck added to the Node entrypoint (http.ts) for the same finding.
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const n = Number(declared);
    if (Number.isFinite(n) && n > cap) return { ok: false };
  }

  // Shape reused from feedback/src/worker.js's readBodyCapped: stream-read and cancel the
  // instant the running total crosses the cap, instead of buffering the whole body first.
  if (!request.body) return { ok: true, bytes: new Uint8Array(0) };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > cap) {
      await reader.cancel();
      return { ok: false };
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes: out };
}

/* JSON-RPC BATCH LENGTH — here rather than in index.ts so it can be unit-tested under plain
   Node, exactly as readBodyCapped is and for the same reason (Astra pack D round 3: the first
   cut of the batch-cap suite re-implemented the predicate, so mutating the production one to
   `return 0` left all eight test bodies green — a test of a copy is a test of nothing).
   Returns the batch length when it exceeds `cap`, and 0 otherwise. A body that does not parse,
   or that is not an array, is NOT this function's to refuse: the MCP handler answers those in
   its own error shape. */
export function overLongBatch(bytes: Uint8Array, cap: number): number {
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder().decode(bytes)); } catch { return 0; }
  return Array.isArray(parsed) && parsed.length > cap ? parsed.length : 0;
}
