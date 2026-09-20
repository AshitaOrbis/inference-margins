/* async-error-containment — a rejected handler must become a controlled 500, not a rejected fetch.
 *
 * Mutation control for the im-vet-0919 fold (Astra pack C P1-4). The dispatcher returned its
 * handlers' promises from inside `try`, which resolves them OUTSIDE the try — so a D1 write that
 * throws, or a request body that errors mid-read, escaped the catch and `worker.fetch()` itself
 * rejected. The controlled 500, the CORS headers and the no-store headers were all bypassed.
 * Red on the pre-fold worker: both cases reject instead of returning a Response.
 */
import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/worker.js";

const ENV = {
  TURNSTILE_SECRET: "test-secret",
  IP_HASH_SALT: "test-salt",
  CANONICAL_ORIGIN: "https://example.test",
  ALLOWED_ORIGINS: "https://example.test",
  FEEDBACK_DB: {
    prepare() { throw new Error("simulated D1 failure"); },
  },
  RATE_LIMITER: {
    idFromName() { return "id"; },
    get() { return { fetch: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }) }; },
  },
};

const post = (body, init = {}) => new Request("https://feedback.test/submit", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Origin: "https://example.test",
    "CF-Connecting-IP": "203.0.113.7",
    ...(init.headers || {}),
  },
  body,
  ...(init.rest || {}),
});

/* Turnstile is the real gate and it runs BEFORE any D1 write, so reaching the storage failure
   means standing in for the siteverify call. Nothing else is stubbed. */
const withVerifiedTurnstile = async (fn) => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input && input.url ? input.url : input);
    if (url.includes("challenges.cloudflare.com")) {
      return new Response(JSON.stringify({
        success: true, action: "feedback_submit", hostname: "example.test",
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    throw new Error("unexpected outbound request: " + url);
  };
  try { return await fn(); } finally { globalThis.fetch = original; }
};

test("a handler that throws becomes a controlled response, not a rejected fetch", async () => {
  let result, threw = null;
  try {
    result = await withVerifiedTurnstile(() =>
      worker.fetch(post("body=a+reproducible+correction&cf-turnstile-response=x"), ENV));
  } catch (err) { threw = err; }
  assert.equal(threw, null, `worker.fetch() rejected instead of responding: ${threw && threw.message}`);
  assert.ok(result instanceof Response, "a Response must come back");
  assert.ok(result.status >= 400, `expected an error status, got ${result.status}`);
});

test("a request body that errors mid-read becomes a controlled response too", async () => {
  const erroring = new ReadableStream({
    start(controller) { controller.error(new Error("simulated request read failure")); },
  });
  const request = new Request("https://feedback.test/submit", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: "https://example.test" },
    body: erroring,
    duplex: "half",
  });
  let result, threw = null;
  try { result = await worker.fetch(request, ENV); } catch (err) { threw = err; }
  assert.equal(threw, null, `worker.fetch() rejected instead of responding: ${threw && threw.message}`);
  assert.ok(result instanceof Response, "a Response must come back");
  assert.ok(result.status >= 400, `expected an error status, got ${result.status}`);
});

test("an unknown route is still a plain 404 (the guard is not blanket-500ing)", async () => {
  const result = await worker.fetch(new Request("https://feedback.test/nope"), ENV);
  assert.equal(result.status, 404);
});
