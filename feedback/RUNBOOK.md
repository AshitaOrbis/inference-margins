# Feedback intake — owner deployment runbook

Manual steps, **in order**. Everything here runs against the owner's Cloudflare
account; nothing in this directory is deployed by agents. Design rationale:
`research/feedback-form-design.md` (quarantined, injection-hardened intake).

All `wrangler` commands run from this directory (`feedback/`), e.g.
`npx wrangler …` with wrangler ≥ 4.

## 1. Create the Turnstile widget

Cloudflare dashboard → **Turnstile** → *Add widget*.

- Hostnames: the site's domain(s) (the Pages host and any custom domain).
- Mode: Managed (default) is fine.
- Copy the **Site key** (public — goes in `form.html` later) and the
  **Secret key** (goes in via `wrangler secret put`, step 4 — never into a file).

## 2. Create the D1 database and apply the schema

```sh
npx wrangler d1 create inference-margins-feedback
```

Paste the printed `database_id` into `wrangler.toml` (replacing
`REPLACE_WITH_D1_DATABASE_ID`), then:

```sh
npx wrangler d1 execute inference-margins-feedback --remote --file=schema.sql
```

## 3. Rate limiting — nothing to provision

Rate limits are enforced by the `RateLimiterDO` Durable Object (atomic
increment-and-check; one instance per hashed IP plus a global singleton).
The `[[migrations]]` entry in `wrangler.toml` creates the class automatically
on first `wrangler deploy` — there is no KV namespace and no owner step. The
objects store only `{window, n}` counters, never submission content.

## 4. Set the secrets

```sh
npx wrangler secret put TURNSTILE_SECRET   # paste the Turnstile SECRET key
openssl rand -hex 32                       # generate a salt, then:
npx wrangler secret put IP_HASH_SALT       # paste the generated salt
```

Neither value ever goes into a file in this repo.

## 5. Set the plain vars

In `wrangler.toml` `[vars]`, set `ALLOWED_ORIGINS` to the site's exact origins (comma-separated, canonical first)
(scheme + host, no trailing slash), e.g. `https://<project>.pages.dev` or the
custom domain. Leave `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` empty for now —
`/admin` stays fail-closed (403) until step 7.

## 6. Deploy the Worker

```sh
npx wrangler deploy
```

Note the Worker URL it prints (e.g.
`https://inference-margins-feedback.<subdomain>.workers.dev`).

Sanity checks (safe — the ingress is write-only):

- `curl -s https://<worker>/` → 404 "POST /submit only".
- `curl -s https://<worker>/admin` → 403 (fail-closed, Access not configured).

## 7. Put /admin behind Cloudflare Access

The `/admin` route **must** sit behind Cloudflare Access. The Worker's own JWT
check is defense in depth, not a substitute.

1. **Recommended:** give the Worker a custom domain in a zone you own (Workers
   → Settings → Domains & Routes → add e.g. `feedback.<your-domain>`), because
   Access applications can then be path-scoped. (The one-click Access toggle
   for `workers.dev` protects the *whole* hostname, which would also block the
   public `POST /submit` — don't use it unless you split admin into its own
   Worker.)
2. Zero Trust dashboard → **Access → Applications → Add** → *Self-hosted*.
   - Application domain: `feedback.<your-domain>`, path `admin` (covers
     `/admin` and `/admin/*`).
   - Policy: Allow → Emails → your email (identity via the login method you
     use for Zero Trust).
3. From the application's overview, copy the **Application Audience (AUD)
   tag**, and note your **team domain** (`<team>.cloudflareaccess.com`).
4. In `wrangler.toml`, set `ACCESS_TEAM_DOMAIN = "<team>"` and
   `ACCESS_AUD = "<aud tag>"`, then redeploy:

   ```sh
   npx wrangler deploy
   ```

5. Verify: open `https://feedback.<your-domain>/admin` in a browser → Access
   login → the review page loads. `curl` without the Access cookie → 403.

## 8. Wire the form into the site

In `form.html`, replace:

- `REPLACE_WITH_WORKER_ORIGIN` → the **full** Worker origin from step 6/7,
  scheme included, pasted once — e.g.
  `https://inference-margins-feedback.<subdomain>.workers.dev`
  (no trailing slash; the form `action` becomes `<origin>/submit`).
- `REPLACE_WITH_TURNSTILE_SITE_KEY` → the Turnstile **site** key from step 1.

Leave the widget's `data-action="feedback_submit"` as is — the Worker rejects
tokens whose `action`/`hostname` claims don't match it and `ALLOWED_ORIGINS`.

Then embed the snippet as a `/feedback` section in the site (e.g. bottom of
`site/index.html`) and deploy the site as usual (`deploy.sh`).

## 9. Test end-to-end

1. Submit real feedback from the live site → "Thank you" status.
2. Submit the same text again → "already received" (duplicate rejection).
3. Submit 6 times quickly from one IP → 429 on the 6th (per-IP limit).
4. Review at `/admin` (behind Access): the body appears inside the red
   "UNTRUSTED USER INPUT" fence; mark it reviewed.
5. Optional CLI check — metadata columns only, so adversarial bodies never
   land in a terminal/transcript an agent might read:

   ```sh
   npx wrangler d1 execute inference-margins-feedback --remote \
     --command "SELECT id, ts, reviewed FROM feedback ORDER BY ts DESC LIMIT 5"
   ```

## Local development (optional)

> **RULE — LOCAL INGRESS PERSISTENCE LOCATION (do not skip).**
> Local ingress persistence must **NEVER** use wrangler's default
> `.wrangler/` state directory — it sits inside `~/claudeworkspace`, where a
> workspace-globbing agent could read locally captured submissions, breaking
> the quarantine. **Every** `wrangler d1 execute --local` and
> `wrangler dev --local` command MUST carry
> `--persist-to /tmp/im-feedback-dev` (outside the workspace). Delete
> `/tmp/im-feedback-dev` when done.
>
> **Also:** `--persist-to` only redirects the D1/DO **state** layer — `wrangler dev`
> unconditionally writes its own build cache to `feedback/.wrangler/cache/` **inside
> the repo** regardless of that flag. It holds Cloudflare edge metadata (not submission
> content), but for a clean quarantine run `rm -rf feedback/.wrangler/` after every
> local session too.

The ingress pipeline runs locally in Miniflare with no credentials, using
Cloudflare's public Turnstile *test* keys:

```sh
cat > .dev.vars <<'EOF'
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
IP_HASH_SALT=local-test-salt-not-a-real-secret
EOF
npx wrangler d1 execute inference-margins-feedback --local \
  --persist-to /tmp/im-feedback-dev --file=schema.sql
npx wrangler dev --local --port 8787 --persist-to /tmp/im-feedback-dev
# exercise the reject path with the dummy token the test secret accepts:
curl -X POST -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'body=test&cf-turnstile-response=XXXX.DUMMY.TOKEN.XXXX' \
  http://localhost:8787/submit
```

Note: because the Worker now asserts the Turnstile `action`/`hostname`
claims, the dummy token is rejected with 403 at that assert — expected and
correct (fail closed). Local runs exercise the config gate (503 until
`.dev.vars` exists), origin/content-type/size checks, rate limits, and the
Turnstile reject path; the full accept path is tested end-to-end on the
deployed Worker (step 9).

`/admin` is fail-closed locally too: the development bypass was removed — no
env var opens admin without a verified Cloudflare Access JWT. `.dev.vars` is
gitignored; delete it and `/tmp/im-feedback-dev` when done.

## Retention

Retention is automated **inside the Worker**: a daily `[triggers]` cron runs
the exported `scheduled()` handler, which deletes REVIEWED submissions older
than `RETENTION_DAYS` (a `[vars]` entry, default `"90"`). This is
Cloudflare-native — the Worker purging its own store is fine and does NOT
violate the standing rule below: no workspace agent, cron, or event-bus
touches the store (that coupling stays forbidden). The purge logs nothing —
no row counts, no contents.

Optional manual purge (same predicate), if you want an off-cadence sweep:

```sh
npx wrangler d1 execute inference-margins-feedback --remote \
  --command "DELETE FROM feedback WHERE reviewed = 1 AND ts < datetime('now', '-90 days')"
```

---

## STANDING RULE — structural quarantine

**NEVER wire the feedback store (D1), the Worker, or its Durable Objects into
any agent, cron, or event-bus pipeline.** (The Worker's own Cloudflare-native
`[triggers]` retention cron is not such a coupling — it runs entirely inside
the Worker.) No notification bots, no auto-summaries,
no "sync feedback to the workspace" scripts. The entire quarantine design
rests on submissions being structurally unreachable by workspace-reading
agents — one convenience integration breaks it.

To let an agent read a submission: open `/admin` yourself, pick **one**
submission, and deliberately copy it into a fresh agent context, prefixed as
untrusted data (the fence label on `/admin` is written to be copy-pasteable).
Never bulk-export, never pipe.
