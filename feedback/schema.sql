-- Quarantined feedback store — Cloudflare D1 schema.
--
-- This database lives OUTSIDE the repo/workspace: it is the structural
-- quarantine for fully adversarial submissions. Never export it into the
-- workspace wholesale, and never wire it into any agent/cron/event-bus.
--
-- Apply (after `wrangler d1 create inference-margins-feedback`):
--   wrangler d1 execute inference-margins-feedback --remote --file=schema.sql
--
-- `body` and `contact` are UNTRUSTED USER INPUT stored as inert text.
-- `ip_hash` is a salted SHA-256 of the client IP (never the raw IP).

CREATE TABLE IF NOT EXISTS feedback (
  id           TEXT PRIMARY KEY,              -- crypto.randomUUID()
  ts           TEXT NOT NULL,                 -- ISO 8601 UTC
  ip_hash      TEXT NOT NULL,                 -- salted SHA-256 hex, NOT raw IP
  ua           TEXT NOT NULL DEFAULT '',      -- User-Agent, truncated (untrusted)
  turnstile_ok INTEGER NOT NULL DEFAULT 0,    -- 1 = passed siteverify at intake
  body         TEXT NOT NULL,                 -- UNTRUSTED USER INPUT (inert data)
  body_hash    TEXT NOT NULL,                 -- SHA-256 of normalized body (dedup)
  contact      TEXT NOT NULL DEFAULT '',      -- optional contact field (untrusted)
  reviewed     INTEGER NOT NULL DEFAULT 0     -- 0 = pending owner review
);

-- Duplicate rejection backstop (the Worker also pre-checks before insert).
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_body_hash ON feedback (body_hash);

-- Admin listing: unreviewed first, newest first.
CREATE INDEX IF NOT EXISTS idx_feedback_reviewed_ts ON feedback (reviewed, ts);
