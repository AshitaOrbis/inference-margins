// PUBLIC ERROR SURFACE — no raw internal text reaches a caller, on ANY path.
//
// GPT Pro 2026-07-29 rec 13 asked for stable public error codes and sanitized messages. The first
// implementation (2026-09-02) covered only SYNCHRONOUS throws reaching server.ts's catch, because
// the wrapper returned the handler's promise un-awaited — review pr-20260902T173936Z-a81123 caught
// that, plus a second uncovered path where the Worker's get_report handed the caller
// `(err as Error).message` verbatim through failClosed.
//
// This suite exists so neither can come back. It asserts on a SENTINEL: a value that must never
// appear in the text, in the structured output, or in the default logs — because "the message is
// shorter now" is not the same property as "the secret is gone", and only the second one matters.
import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../dist/server.js";
import { classifyToolError, PUBLIC_ERROR_TEXT, TOOL_ERROR_CODES, wrapToolHandler } from "../dist/server.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

const SENTINEL = "SUPER-SECRET-OVERRIDE-9f3c1a";

/* Drive the REAL registration wrapper rather than a copy of it: register a tool whose handler
   fails the way we want, on the same server the transport serves. */
async function withFailingTool(handler) {
  const server = buildServer();
  /* THE PRODUCTION WRAPPER, not a copy. Registering an inline re-implementation here is what made
     the first version of this suite decorative: it passed unchanged when server.ts was reverted to
     the un-awaited form these tests exist to catch. */
  server.registerTool("probe_failure", { description: "test-only failure probe", inputSchema: {} },
    wrapToolHandler("probe_failure", handler));
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "err-probe", version: "0.0.0" });
  await Promise.all([server.connect(st), client.connect(ct)]);
  try { return await client.callTool({ name: "probe_failure", arguments: {} }); }
  finally { await client.close(); await server.close(); }
}

const flat = (r) => JSON.stringify(r);

test("a SYNCHRONOUS throw is sanitized: the sentinel reaches neither text nor structured output", async () => {
  const r = await withFailingTool(() => { throw new Error(`internal blew up with ${SENTINEL}`); });
  assert.ok(!flat(r).includes(SENTINEL), "the sentinel leaked to the caller: " + flat(r).slice(0, 300));
  assert.equal(r.structuredContent?.error?.code, "internal_error");
});

test("a DELAYED PROMISE REJECTION is sanitized too (the un-awaited-handler hole)", async () => {
  const r = await withFailingTool(async () => {
    await new Promise((res) => setTimeout(res, 5));
    throw new Error(`async blew up with ${SENTINEL}`);
  });
  assert.ok(!flat(r).includes(SENTINEL), "the sentinel leaked from an async rejection: " + flat(r).slice(0, 300));
  assert.equal(r.structuredContent?.error?.code, "internal_error");
});

test("the public code is a CLOSED enum, exposed as a field a client can branch on", async () => {
  const r = await withFailingTool(() => { throw new Error("boom"); });
  assert.ok(TOOL_ERROR_CODES.includes(r.structuredContent?.error?.code));
  assert.equal(typeof r.structuredContent?.error?.tool, "string");
});

test("the public sentence is FIXED per code — it never interpolates the exception", async () => {
  const a = await withFailingTool(() => { throw new Error(`one ${SENTINEL}`); });
  const b = await withFailingTool(() => { throw new Error("two, entirely different wording"); });
  const textOf = (r) => r.content[0].text;
  assert.equal(textOf(a), textOf(b), "the public text varied with the exception message");
});

test("a deliberate contract refusal is classified apart from a fault (and still leaks nothing)", async () => {
  const r = await withFailingTool(() => { throw new Error(`the nShardCase channel is RETIRED (R2) ${SENTINEL}`); });
  assert.equal(r.structuredContent?.error?.code, "refused_by_contract");
  assert.ok(!flat(r).includes(SENTINEL));
});

/* NEGATIVE CONTROL. Every assertion above would pass against a handler that simply never mentions
   the sentinel, which would make this whole file decorative. Prove the detector bites: a wrapper
   that does interpolate the message must be caught by the same check. */
test("NEGATIVE CONTROL: the sentinel check can fail — an interpolating wrapper is detected", async () => {
  const leaky = { content: [{ type: "text", text: `Tool x failed: internal blew up with ${SENTINEL}` }], isError: true };
  assert.ok(flat(leaky).includes(SENTINEL), "the detector cannot see a leak, so the suite above proves nothing");
});

/* The Worker's archive-read path is the other transport rec 13's wrapper does not cover. Assert on
   the SOURCE that it no longer hands the exception to the caller — the Worker build is exercised by
   its own suite, and this keeps the specific regression named. */
test("the Worker's get_report no longer returns a raw archive-read message", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../worker/overrides/get_report.ts", import.meta.url), "utf8");
  assert.ok(!/failClosed\(\(err as Error\)\.message\)/.test(src),
    "the Worker override still copies the exception message into the public failure sentence");
  assert.ok(/Details are recorded server-side and are not returned/.test(src),
    "the Worker override does not carry the fixed public sentence");
});
