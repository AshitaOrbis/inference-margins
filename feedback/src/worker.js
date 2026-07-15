/**
 * Quarantined feedback intake — Cloudflare Worker.
 *
 * SECURITY MODEL (the whole point — do not weaken):
 *  - Every submission is FULLY ADVERSARIAL untrusted content. It is stored as
 *    inert data in D1 (out of the repo → structurally unreachable by any
 *    workspace-reading agent) and is never interpreted, executed, echoed back,
 *    or fed to any automated pipeline.
 *  - Public ingress is WRITE-ONLY: POST /submit. There is NO public read
 *    endpoint. The only read path is /admin*, which fail-closes (403) until
 *    Cloudflare Access is configured AND its JWT verifies (see RUNBOOK).
 *    There is NO development bypass: no env var can open /admin (P1-2).
 *  - Raw IPs and raw bodies are NEVER logged. The stored ip_hash is a salted
 *    SHA-256 (salt = IP_HASH_SALT secret), not the IP.
 *  - NEVER wire this Worker or its bindings into any agent/cron/event-bus.
 *    (The scheduled() retention purge below is Cloudflare-native and runs
 *    entirely inside the Worker — it is not a workspace coupling.)
 *
 * Bindings (wrangler.toml): FEEDBACK_DB (D1), RATE_LIMITER (Durable Object).
 * Secrets (wrangler secret put): TURNSTILE_SECRET, IP_HASH_SALT.
 */

import ADMIN_HTML from "../admin.html";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// The Turnstile widget in form.html sets data-action="feedback_submit". The
// verify step asserts the token was minted for exactly this action on this
// site's hostname (P1-3) — a valid token minted on another site or for
// another widget/action is rejected.
const TURNSTILE_ACTION = "feedback_submit";

// Transport-level cap on the raw request body. Larger than MAX_BODY_BYTES
// because the urlencoded payload also carries the Turnstile token (~2 KB) and
// percent-encoding overhead (up to 3x for non-ASCII). The ~4 KB content cap
// is enforced on the DECODED feedback text below.
const MAX_REQUEST_BYTES = 16 * 1024;
const DEFAULT_MAX_BODY_BYTES = 4096;
const MAX_CONTACT_CHARS = 256;
const MAX_UA_CHARS = 256;
const ADMIN_LIST_LIMIT = 200;
const DEFAULT_RETENTION_DAYS = 90;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    try {
      // ---- Public write-only ingress -------------------------------------
      if (path === "/submit") {
        if (request.method === "OPTIONS") return corsPreflight(env, request);
        if (request.method === "POST") return handleSubmit(request, env);
        return respond(request, env, 405, "Method not allowed.");
      }

      // ---- Owner-only review (fail-closed behind Cloudflare Access) ------
      // NOTE: these routes MUST also be covered by a Cloudflare Access
      // application (RUNBOOK step 7). The JWT check below is defense in
      // depth and the fail-closed default, not a replacement for Access.
      if (path === "/admin" || path.startsWith("/admin/")) {
        const authorized = await verifyAccessJwt(request, env);
        if (!authorized) {
          return respond(
            request,
            env,
            403,
            "Admin is disabled until Cloudflare Access is configured " +
              "(ACCESS_TEAM_DOMAIN + ACCESS_AUD) and presents a valid JWT."
          );
        }
        if (path === "/admin" && request.method === "GET") {
          return new Response(ADMIN_HTML, {
            status: 200,
            headers: baseHeaders({
              "Content-Type": "text/html; charset=utf-8",
              // Strict CSP: page renders adversarial text; even if rendering
              // were somehow broken, nothing can be exfiltrated off-origin.
              "Content-Security-Policy":
                "default-src 'none'; script-src 'unsafe-inline'; " +
                "style-src 'unsafe-inline'; connect-src 'self'; " +
                "img-src 'none'; base-uri 'none'; form-action 'none'; " +
                "frame-ancestors 'none'",
              "X-Frame-Options": "DENY",
            }),
          });
        }
        if (path === "/admin/api/list" && request.method === "GET") {
          return adminList(env);
        }
        if (path === "/admin/api/review" && request.method === "POST") {
          return adminMarkReviewed(request, env);
        }
        return respond(request, env, 404, "Not found.");
      }

      // Everything else — including any GET of submissions — does not exist.
      return respond(request, env, 404, "Feedback intake. POST /submit only.");
    } catch (err) {
      // Generic failure; never echo internals, bodies, or IPs.
      return respond(request, env, 500, "Internal error.");
    }
  },

  /**
   * Retention purge (P2-10) — Cloudflare-native cron ([triggers] in
   * wrangler.toml, daily). Deletes REVIEWED rows older than RETENTION_DAYS
   * (default 90). Parameterized; deliberately logs NOTHING — no row counts,
   * no contents. This runs entirely inside the Worker: no workspace agent,
   * cron, or event-bus may ever touch the store (standing rule, RUNBOOK).
   */
  async scheduled(event, env, ctx) {
    const days = intVar(env.RETENTION_DAYS, DEFAULT_RETENTION_DAYS);
    await env.FEEDBACK_DB
      .prepare(
        "DELETE FROM feedback " +
          "WHERE reviewed = 1 AND ts < datetime('now', '-' || ?1 || ' days')"
      )
      .bind(String(days))
      .run();
  },
};

// ===========================================================================
// Ingress
// ===========================================================================

/**
 * ACCEPTED RESIDUALS (owner decision — deliberate, do NOT "fix"):
 *  - Duplicate-existence oracle: step 9 answers a resubmission with 409 vs
 *    200, so a sender can probe whether an exact (whitespace-normalized)
 *    body text already exists in the store. Accepted: it reveals only
 *    exact-match existence of text the prober already holds; no stored
 *    content ever leaves.
 *  - Per-IP charge on invalid Turnstile: the per-IP counter (step 7) is
 *    incremented BEFORE the Turnstile round-trip (step 8), so a submission
 *    with a bad/missing token still burns that IP's hourly budget. Accepted:
 *    cheap local gate before the outbound verify call, and it only throttles
 *    the sender causing the failures.
 */
async function handleSubmit(request, env) {
  // (1) Required secrets present — BEFORE any body read or hashing (P1-7).
  // With IP_HASH_SALT unset, ip_hash would degrade to an unsalted hash of
  // the IP; with TURNSTILE_SECRET unset, verification cannot succeed.
  // Generic 503; no configuration details leak.
  if (!env.IP_HASH_SALT || !env.TURNSTILE_SECRET) {
    return respond(request, env, 503, "Service temporarily unavailable.");
  }

  // (2) Origin check (defense in depth; Turnstile is the real gate).
  // Browsers send Origin on cross-origin POSTs; if present it must match.
  const origin = request.headers.get("Origin");
  if (origin && !allowedOrigins(env).includes(origin)) {
    return respond(request, env, 403, "Bad origin.");
  }

  // (3) Content-Type.
  const contentType = (request.headers.get("Content-Type") || "").toLowerCase();
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return respond(
      request, env, 415,
      "Unsupported content type (application/x-www-form-urlencoded only)."
    );
  }

  // (4) Size cap — enforced while streaming, so an oversize body is cut off
  // rather than buffered.
  const raw = await readBodyCapped(request, MAX_REQUEST_BYTES);
  if (!raw.ok) return respond(request, env, 413, "Submission too large.");

  // (5) Parse + validate the decoded fields.
  let fields;
  try {
    fields = new URLSearchParams(new TextDecoder().decode(raw.bytes));
  } catch {
    return respond(request, env, 400, "Malformed submission.");
  }

  const token = (fields.get("cf-turnstile-response") || "").trim();
  const body = (fields.get("body") || "").trim();
  const contact = (fields.get("contact") || "").trim();

  if (!body) return respond(request, env, 400, "Feedback text is empty.");

  // Content-size cap on the decoded feedback text (~4 KB).
  const maxBodyBytes = intVar(env.MAX_BODY_BYTES, DEFAULT_MAX_BODY_BYTES);
  const bodyBytes = new TextEncoder().encode(body).length;
  if (bodyBytes > maxBodyBytes) {
    return respond(request, env, 413, "Feedback text too long (4 KB max).");
  }
  if (contact.length > MAX_CONTACT_CHARS) {
    return respond(request, env, 413, "Contact field too long.");
  }

  // (6) Salted IP hash — the raw IP is used transiently here (hash input +
  // Turnstile remoteip) and is never stored or logged.
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const ipHash = await sha256Hex(`${env.IP_HASH_SALT}:${ip}`);

  // (7) Per-IP rate limit — atomic Durable Object counter (P1-5), before the
  // Turnstile round-trip (cheap gate first; see ACCEPTED RESIDUALS above).
  const hourWindow = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
  const perIpLimit = intVar(env.RATE_PER_IP_PER_HOUR, 5);
  const ipOk = await rateLimitAllow(
    env, `ip:${ipHash}`, hourWindow, perIpLimit, 2 * 3600_000
  );
  if (!ipOk) {
    return respond(request, env, 429, "Rate limit exceeded — try again later.");
  }

  // (8) Turnstile verification (bot/abuse gate) + strict claim binding
  // (P1-3): success alone is not enough — the token must have been minted
  // for THIS widget action on THIS site's hostname. Absent/mismatched
  // action or hostname claims are rejected.
  if (!token) return respond(request, env, 403, "Missing Turnstile token.");
  const outcome = await verifyTurnstile(env, token, ip);
  if (!outcome || outcome.success !== true) {
    return respond(request, env, 403, "Turnstile verification failed.");
  }
  const expectedHostnames = allowedHostnames(env);
  if (
    !expectedHostnames.length ||
    outcome.action !== TURNSTILE_ACTION ||
    !expectedHostnames.includes(outcome.hostname)
  ) {
    return respond(request, env, 403, "Turnstile verification failed.");
  }

  // (9) Reject exact duplicates (whitespace-normalized) — BEFORE the global
  // increment (P1-6), so replayed duplicates cannot burn the global daily
  // budget and lock out legitimate submitters. The UNIQUE index on body_hash
  // in schema.sql is the backstop for the read-then-write race.
  const bodyHash = await sha256Hex(body.replace(/\s+/g, " "));
  const dup = await env.FEEDBACK_DB
    .prepare("SELECT 1 FROM feedback WHERE body_hash = ?1 LIMIT 1")
    .bind(bodyHash)
    .first();
  if (dup) {
    return respond(request, env, 409, "This feedback was already received.");
  }

  // (10) Global rate limit — atomic Durable Object counter (P1-5), after
  // Turnstile so unverified junk cannot burn the global budget.
  const dayWindow = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const globalLimit = intVar(env.RATE_GLOBAL_PER_DAY, 200);
  const globalOk = await rateLimitAllow(
    env, "global", dayWindow, globalLimit, 2 * 86_400_000
  );
  if (!globalOk) {
    return respond(
      request, env, 429, "Submission volume cap reached — try again tomorrow."
    );
  }

  // (11) Store — parameterized bindings only. The body is stored verbatim as
  // inert TEXT with provenance columns; nothing downstream consumes it.
  const ua = (request.headers.get("User-Agent") || "").slice(0, MAX_UA_CHARS);
  try {
    await env.FEEDBACK_DB
      .prepare(
        "INSERT INTO feedback " +
          "(id, ts, ip_hash, ua, turnstile_ok, body, body_hash, contact, reviewed) " +
          "VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6, ?7, 0)"
      )
      .bind(
        crypto.randomUUID(),
        new Date().toISOString(),
        ipHash,
        ua,
        body,
        bodyHash,
        contact
      )
      .run();
  } catch (err) {
    if (/unique/i.test(String(err && err.message))) {
      return respond(request, env, 409, "This feedback was already received.");
    }
    throw err;
  }

  return respond(
    request, env, 200, "Thank you — your feedback was recorded.", true
  );
}

/**
 * Calls Turnstile siteverify and returns the full outcome object (or null on
 * any failure) so the caller can assert success AND the action/hostname
 * claims (P1-3). Network / parse failures return null → fail closed (403).
 */
async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return null; // fail closed (also gated at entry)
  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: token,
      remoteip: ip,
    }),
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return res.json().catch(() => null);
}

/** Exact allowed origins from env.ALLOWED_ORIGINS (comma-separated; canonical
 *  first). `new URL(s).origin === s` enforces exact scheme+host with no path,
 *  trailing slash, or default-port games. Malformed entries drop; an empty
 *  result makes every caller fail closed. */
function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => {
      try {
        return new URL(s).origin === s;
      } catch {
        return false;
      }
    });
}

/** Hostnames of the allowed origins (Turnstile hostname assert); empty → fail closed. */
function allowedHostnames(env) {
  return allowedOrigins(env).map((o) => new URL(o).hostname);
}

/** Stream-read the request body, aborting as soon as it exceeds maxBytes. */
async function readBodyCapped(request, maxBytes) {
  if (!request.body) return { ok: true, bytes: new Uint8Array(0) };
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
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

// ===========================================================================
// Rate limiting — atomic Durable Object counters (P1-5)
//
// Replaces the former KV read-modify-write counters, which raced under
// concurrency (KV is eventually consistent; parallel bursts could blow past
// the limit). Each counter lives in its own Durable Object instance — one
// per hashed IP plus one "global" singleton — where increment-and-check is
// serialized by the DO runtime, so the limit is enforced exactly.
// ===========================================================================

/**
 * Returns true iff this request is within the limit for the given counter.
 * Any limiter error fails CLOSED (submission rejected with 429) — consistent
 * with the rest of this Worker; availability of the feedback form is not
 * worth an unbounded-ingress window.
 */
async function rateLimitAllow(env, name, window, limit, ttlMs) {
  try {
    const stub = env.RATE_LIMITER.get(env.RATE_LIMITER.idFromName(name));
    const res = await stub.fetch("https://rate-limiter/increment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ window, limit, ttlMs }),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return Boolean(data && data.ok === true);
  } catch {
    return false;
  }
}

/**
 * Fixed-window atomic counter. One counter per object, keyed to the caller's
 * current window string; a request from a newer window resets it. Storage
 * input gates serialize event delivery around the get→put below, so two
 * concurrent requests to the same object cannot both read the same count —
 * the increment-and-check is atomic (the property KV could not provide).
 * Stores ONLY {window, n}: never any submission content (quarantine rule).
 */
export class RateLimiterDO {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    let body;
    try {
      body = await request.json();
    } catch {
      body = null;
    }
    const window = body && typeof body.window === "string" ? body.window : "";
    const limit = body && Number.isInteger(body.limit) ? body.limit : 0;
    const ttlMs =
      body && Number.isFinite(body.ttlMs) && body.ttlMs > 0
        ? body.ttlMs
        : 2 * 86_400_000;
    if (!window || limit <= 0) {
      return Response.json({ ok: false }, { status: 400 });
    }

    let rec = await this.state.storage.get("counter");
    if (!rec || rec.window !== window) rec = { window, n: 0 };
    if (rec.n >= limit) return Response.json({ ok: false });
    rec.n += 1;
    await this.state.storage.put("counter", rec);
    // Self-clean: wipe this object's storage well after the window closes,
    // so idle per-IP objects don't accumulate state.
    await this.state.storage.setAlarm(Date.now() + ttlMs);
    return Response.json({ ok: true });
  }

  async alarm() {
    await this.state.storage.deleteAll();
  }
}

// ===========================================================================
// Admin (owner-only; every route here sits behind verifyAccessJwt)
// ===========================================================================

async function adminList(env) {
  const { results } = await env.FEEDBACK_DB
    .prepare(
      "SELECT id, ts, ip_hash, ua, turnstile_ok, body, contact, reviewed " +
        "FROM feedback ORDER BY reviewed ASC, ts DESC LIMIT ?1"
    )
    .bind(ADMIN_LIST_LIMIT)
    .all();
  return new Response(JSON.stringify({ ok: true, items: results || [] }), {
    status: 200,
    headers: baseHeaders({ "Content-Type": "application/json" }),
  });
}

async function adminMarkReviewed(request, env) {
  let id;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(
      (await readBodyCapped(request, 1024)).bytes
    ));
    id = parsed && parsed.id;
  } catch {
    id = null;
  }
  if (typeof id !== "string" || !id) {
    return new Response(JSON.stringify({ ok: false, error: "Bad id." }), {
      status: 400,
      headers: baseHeaders({ "Content-Type": "application/json" }),
    });
  }
  await env.FEEDBACK_DB
    .prepare("UPDATE feedback SET reviewed = 1 WHERE id = ?1")
    .bind(id)
    .run();
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: baseHeaders({ "Content-Type": "application/json" }),
  });
}

// ===========================================================================
// Cloudflare Access JWT verification (fail-closed)
//
// Verifies the Cf-Access-Jwt-Assertion header against the team's public
// signing keys (RS256) and the application AUD tag. While ACCESS_TEAM_DOMAIN
// or ACCESS_AUD is unset, this always returns false → /admin is 403.
// There is deliberately NO bypass of any kind (P1-2): no env var, header, or
// mode may open /admin without a verified Access JWT.
// A bare header-presence check would be spoofable by any client when no
// Access app covers the route, which is why the signature is verified.
// ===========================================================================

// Floor between outbound JWKS fetch attempts (P2-9). Without it, a flood of
// admin requests bearing bogus `kid`s would turn every request into an
// outbound JWKS fetch (amplification). Within the window an unknown kid
// fails closed (null → 403); genuine key rotations resolve on the next
// window. Cached keys stay valid for JWKS_TTL_MS.
const JWKS_REFETCH_MIN_INTERVAL_MS = 60_000; // ~60s between fetch attempts
const JWKS_TTL_MS = 3_600_000; // 1h

let jwksCache = { keys: null, issuer: null, fetchedAt: 0, lastAttemptAt: 0 };

async function verifyAccessJwt(request, env) {
  const team = (env.ACCESS_TEAM_DOMAIN || "").trim();
  const aud = (env.ACCESS_AUD || "").trim();
  // Fail closed until Cloudflare Access is configured. No development
  // escape hatch exists (P1-2) — /admin cannot be opened by configuration
  // short of a valid, verified Access JWT.
  if (!team || !aud) return false;

  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [rawHeader, rawPayload, rawSig] = parts;

  let header, payload;
  try {
    header = JSON.parse(b64uToString(rawHeader));
    payload = JSON.parse(b64uToString(rawPayload));
  } catch {
    return false;
  }
  if (!header || header.alg !== "RS256" || !header.kid) return false;

  const teamHost = team.includes(".") ? team : `${team}.cloudflareaccess.com`;
  const issuer = `https://${teamHost}`;
  if (payload.iss !== issuer) return false;

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(aud)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) return false;
  if (typeof payload.nbf === "number" && payload.nbf > now + 60) return false;

  const jwk = await getAccessSigningKey(issuer, header.kid);
  if (!jwk) return false;

  let key;
  try {
    key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
  } catch {
    return false;
  }
  // P2-8: a malformed base64url signature (b64uToBytes/atob throws) or a
  // rejecting verify() must be an auth FAILURE (false → 403), not an
  // uncaught exception surfacing as a 500.
  try {
    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64uToBytes(rawSig),
      new TextEncoder().encode(`${rawHeader}.${rawPayload}`)
    );
  } catch {
    return false;
  }
}

async function getAccessSigningKey(issuer, kid) {
  const now = Date.now();
  const cacheValid =
    jwksCache.issuer === issuer &&
    jwksCache.keys &&
    now - jwksCache.fetchedAt < JWKS_TTL_MS;
  if (cacheValid) {
    const hit = jwksCache.keys.find((k) => k.kid === kid);
    if (hit) return hit;
  }
  // Stale cache or unknown kid (key rotation): refetch — but at most once
  // per JWKS_REFETCH_MIN_INTERVAL_MS (~60s), even on a cache miss (P2-9).
  // Inside the interval, fail closed: an unverifiable kid gets null → 403
  // rather than triggering another outbound fetch.
  if (now - jwksCache.lastAttemptAt < JWKS_REFETCH_MIN_INTERVAL_MS) {
    return null;
  }
  jwksCache.lastAttemptAt = now;
  const res = await fetch(`${issuer}/cdn-cgi/access/certs`).catch(() => null);
  if (!res || !res.ok) return null;
  const jwks = await res.json().catch(() => null);
  jwksCache = {
    keys: (jwks && jwks.keys) || [],
    issuer,
    fetchedAt: now,
    lastAttemptAt: now,
  };
  return jwksCache.keys.find((k) => k.kid === kid) || null;
}

// ===========================================================================
// Helpers
// ===========================================================================

function intVar(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function sha256Hex(input) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function b64uToBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64uToString(s) {
  return new TextDecoder().decode(b64uToBytes(s));
}

function baseHeaders(extra = {}) {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
    ...extra,
  };
}

function corsHeaders(env, request) {
  const origins = allowedOrigins(env);
  const origin = request ? request.headers.get("Origin") : null;
  return {
    // Echo the request origin only when allowlisted; otherwise the canonical
    // (first) origin. Never "*" — the allowlist is the contract.
    "Access-Control-Allow-Origin":
      origin && origins.includes(origin) ? origin : origins[0] || "null",
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
  };
}

function corsPreflight(env, request) {
  return new Response(null, {
    status: 204,
    headers: baseHeaders(corsHeaders(env, request)),
  });
}

/**
 * Uniform response. JSON for the fetch()-based form; a tiny static HTML page
 * for no-JS form posts (Accept: text/html). Static strings only — submitted
 * content is NEVER reflected back.
 */
function respond(request, env, status, message, ok = false) {
  const wantsHtml = (request.headers.get("Accept") || "").includes("text/html");
  if (wantsHtml) {
    const title = ok ? "Thank you" : "Submission not accepted";
    const html =
      "<!doctype html><meta charset=\"utf-8\">" +
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
      `<title>${title}</title>` +
      "<body style=\"font: 15px/1.55 system-ui, sans-serif; max-width: 40em; " +
      "margin: 4em auto; padding: 0 1em;\">" +
      `<h1 style="font-size:20px">${title}</h1><p>${escapeHtml(message)}</p>` +
      "<p><a href=\"javascript:history.back()\">Back</a></p></body>";
    return new Response(html, {
      status,
      headers: baseHeaders({
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
        ...corsHeaders(env, request),
      }),
    });
  }
  return new Response(JSON.stringify(ok ? { ok, message } : { ok, error: message }), {
    status,
    headers: baseHeaders({
      "Content-Type": "application/json",
      ...corsHeaders(env, request),
    }),
  });
}

/** Escapes our own static status messages (defense in depth; they contain no user input). */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
