// Worker-side body-cap suite (Pro review 2026-07-29 rec 2 / finding C-4, the Worker
// companion to the Node http.ts fix — re-found as bq-1014, bq-1251, bq-1196, bq-1252).
// readBodyCapped() has no "agents/mcp" / Workers-runtime import (see src/body-cap.ts), so it
// is unit-tested here directly, against a REAL Request built from a REAL ReadableStream,
// under plain Node — no wrangler dev / Workers runtime needed.
import test from "node:test";
import assert from "node:assert/strict";
import { readBodyCapped } from "../src/body-cap.ts";

const CAP = 64 * 1024; // matches BODY_CAP in src/index.ts

/** A Request whose body is a ReadableStream that hands out `chunkSize`-byte chunks up to
    `totalBytes`, instrumented so the test can see exactly how many bytes the stream was
    ASKED to produce. highWaterMark: 0 on the underlying stream disables the default
    one-chunk-ahead prefetch that a ReadableStream otherwise performs at construction time
    (verified empirically — with the default hwm=1, `pulled` was already nonzero before
    readBodyCapped ever touched the stream), so `pulled` only grows in response to an actual
    reader.read() call made by the code under test. */
function streamedRequest(totalBytes, chunkSize, headers = {}) {
  let pulled = 0;
  let sent = 0;
  const stream = new ReadableStream(
    {
      pull(controller) {
        if (sent >= totalBytes) {
          controller.close();
          return;
        }
        const size = Math.min(chunkSize, totalBytes - sent);
        sent += size;
        pulled += size;
        controller.enqueue(new Uint8Array(size).fill(7));
      },
    },
    { highWaterMark: 0 },
  );
  const request = new Request("http://worker.test/mcp", {
    method: "POST",
    body: stream,
    duplex: "half",
    headers,
  });
  return { request, getPulled: () => pulled };
}

test("Content-Length over the cap — rejected WITHOUT the stream being read at all", async () => {
  const { request, getPulled } = streamedRequest(70 * 1024, 8 * 1024, {
    "content-length": String(70 * 1024),
  });
  const result = await readBodyCapped(request, CAP);
  assert.equal(result.ok, false);
  assert.equal(getPulled(), 0, "Content-Length precheck must reject before touching the stream");
});

test("no Content-Length, 8 KB chunks to 100 KB — rejected, stream cancelled before all pulled", async () => {
  const { request, getPulled } = streamedRequest(100 * 1024, 8 * 1024);
  assert.equal(request.headers.get("content-length"), null, "test setup: no declared length");
  const result = await readBodyCapped(request, CAP);
  assert.equal(result.ok, false);
  assert.ok(getPulled() <= CAP + 8 * 1024, `expected <= cap + one chunk, got ${getPulled()}`);
  assert.ok(getPulled() < 100 * 1024, "the full 100 KB must never have been pulled from the stream");
});

test("1 KB body — accepted, bytes byte-identical to the input", async () => {
  const input = new Uint8Array(1024);
  for (let i = 0; i < input.length; i++) input[i] = i % 256;
  const request = new Request("http://worker.test/mcp", { method: "POST", body: input });
  const result = await readBodyCapped(request, CAP);
  assert.equal(result.ok, true);
  assert.deepEqual(result.bytes, input);
});

test("null body — accepted, empty bytes", async () => {
  const request = new Request("http://worker.test/mcp", { method: "GET" });
  assert.equal(request.body, null, "test setup: GET carries no body");
  const result = await readBodyCapped(request, CAP);
  assert.equal(result.ok, true);
  assert.equal(result.bytes.byteLength, 0);
});
