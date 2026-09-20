// Regression for bq-1015 / inference.feedback_dedupe_quota_race_01: concurrent
// duplicate feedback submissions must not consume more than one global-quota
// slot. Exercises the REAL worker.js (default fetch handler + exported
// RateLimiterDO) against fake D1 / Durable-Object bindings; no network I/O.
//
// The fakes below deliberately model the two properties the vulnerability
// depends on:
//  - Fake D1's duplicate-check SELECT is gated on a two-party barrier, so
//    BOTH racing requests are forced to observe "no row yet" before either
//    one inserts — the worst-case interleaving the finding describes.
//  - The fake Durable Object namespace serializes fetch() calls per object
//    id (a per-id queue), matching real Cloudflare DO semantics (input-gate
//    serialization) instead of relying on incidental JS microtask ordering.
import test from "node:test";
import assert from "node:assert/strict";
import worker, { RateLimiterDO } from "../src/worker.js";

const TURNSTILE_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function twoPartyBarrier() {
  let arrivals = 0;
  let release;
  const gate = new Promise((res) => { release = res; });
  return async function arrive() {
    arrivals += 1;
    if (arrivals >= 2) release();
    await gate;
  };
}

function makeFakeD1({ onDupSelect } = {}) {
  const rows = new Map(); // body_hash -> stored row
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.startsWith("SELECT 1 FROM feedback WHERE body_hash")) {
                const bodyHash = args[0];
                if (onDupSelect) await onDupSelect();
                return rows.has(bodyHash) ? { 1: 1 } : null;
              }
              throw new Error("unexpected first(): " + sql);
            },
            async run() {
              if (sql.startsWith("INSERT INTO feedback")) {
                const [, , , , bodyText, bodyHash] = args; // matches worker.js's bind() order
                if (rows.has(bodyHash)) {
                  throw new Error("UNIQUE constraint failed: feedback.body_hash");
                }
                rows.set(bodyHash, { bodyText });
                return { success: true };
              }
              throw new Error("unexpected run(): " + sql);
            },
          };
        },
      };
    },
    _rowCount: () => rows.size,
  };
}

function makeMemoryStorage() {
  const store = new Map();
  return {
    async get(key) { return store.get(key); },
    async put(key, val) { store.set(key, val); },
    async setAlarm() {},
    async deleteAll() { store.clear(); },
  };
}

function makeFakeDONamespace() {
  const instances = new Map(); // id -> { obj, queue }
  return {
    idFromName(name) { return name; },
    get(id) {
      if (!instances.has(id)) {
        instances.set(id, { obj: new RateLimiterDO({ storage: makeMemoryStorage() }), queue: Promise.resolve() });
      }
      const entry = instances.get(id);
      return {
        fetch(url, init) {
          // A second call into the SAME DO id must not start until the first has fully
          // completed — this is what makes the check-and-increment atomic in production,
          // and it is exactly the property the fix in worker.js relies on.
          const run = entry.queue.then(() => entry.obj.fetch(new Request(url, init)));
          entry.queue = run.then(() => {}, () => {});
          return run;
        },
      };
    },
  };
}

function makeEnv({ onDupSelect, globalLimit = 2 } = {}) {
  return {
    IP_HASH_SALT: "test-salt",
    TURNSTILE_SECRET: "test-secret",
    ALLOWED_ORIGINS: "https://example.test",
    RATE_PER_IP_PER_HOUR: 100, // high enough that only the GLOBAL limiter is under test
    RATE_GLOBAL_PER_DAY: globalLimit,
    FEEDBACK_DB: makeFakeD1({ onDupSelect }),
    RATE_LIMITER: makeFakeDONamespace(),
  };
}

function submitRequest(body) {
  const form = new URLSearchParams({ body, "cf-turnstile-response": "tok" });
  return new Request("https://example.test/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://example.test",
      "CF-Connecting-IP": "203.0.113.7",
    },
    body: form.toString(),
  });
}

async function withFakeTurnstile(run) {
  const real = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url) === TURNSTILE_URL) {
      return Response.json({ success: true, action: "feedback_submit", hostname: "example.test" });
    }
    throw new Error("unexpected network fetch in test: " + url);
  };
  try {
    return await run();
  } finally {
    globalThis.fetch = real;
  }
}

test("concurrent identical submissions: one stored row, one global quota charge", async () => {
  await withFakeTurnstile(async () => {
    const barrier = twoPartyBarrier();
    const env = makeEnv({ onDupSelect: barrier, globalLimit: 2 });

    const sameBody = "the exact same feedback text, racing itself";
    const [resA, resB] = await Promise.all([
      worker.fetch(submitRequest(sameBody), env),
      worker.fetch(submitRequest(sameBody), env),
    ]);

    const statuses = [resA.status, resB.status].sort();
    assert.deepEqual(statuses, [200, 409], "exactly one racing submission is accepted, the other rejected as a duplicate");
    assert.equal(env.FEEDBACK_DB._rowCount(), 1, "exactly one row is stored");

    // The observable consequence the finding describes: with a global limit of 2, a
    // race between two copies of ONE duplicate submission must leave at least one slot
    // free for a genuinely distinct submission afterward. Pre-fix, both racing requests
    // each burned a slot (2/2 consumed for 1 stored row), so this next distinct
    // submission got 429 even though the service had only ever stored one real item.
    const distinctBody = "a completely different piece of feedback, not part of the race";
    const resC = await worker.fetch(submitRequest(distinctBody), env);
    assert.equal(resC.status, 200, "a distinct submission after the race must still be admitted (quota was not double-charged)");
    assert.equal(env.FEEDBACK_DB._rowCount(), 2, "the distinct submission is stored as a second row");
  });
});

test("sanity: a genuinely oversubscribed global quota still rejects with 429", async () => {
  await withFakeTurnstile(async () => {
    const env = makeEnv({ globalLimit: 1 });
    const first = await worker.fetch(submitRequest("first distinct body"), env);
    assert.equal(first.status, 200);
    const second = await worker.fetch(submitRequest("second, different, distinct body"), env);
    assert.equal(second.status, 429, "the global cap still bites for genuinely distinct submissions");
  });
});
