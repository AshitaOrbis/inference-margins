# inference-margins MCP server

Read-only MCP server over the **Frontier Inference Margins** site — the same substrate the
site itself runs on. `../site/engine.js` is consumed at runtime via `createRequire` and is the
**single source of truth**: this package re-declares no engine constant, and the state-identity
sentences it mirrors from `../site/app.js` are grep-parity-tested against the live source on
every test run (the build fails on silent drift).

Built to the DECISIONS block of `../research/mcp-server-design.md` (2026-07-12):
response-level envelope (Variant B), status-fused value strings, honest-but-lossy threat model.

## Tools (six, all `readOnlyHint: true`)

| Tool | What it returns |
|------|-----------------|
| `list_scenario_space` | Every model / perspective / traffic-profile / bucket / override-bound / report id the other tools accept, plus the exact metric definition. |
| `query_margin_claims` | The 34-record typed claims registry, filtered — cited claims with byte-exact quotes and provenance tiers, never a derived estimate. Floors are `compatible-with`, never intervals; company-GM figures never sit among unit-serving claimants. |
| `run_scenario` | **The only tool that derives an estimate.** Engine pipeline in the site's order; replay traffic locks enforced (MLI-1); divergent replay edits remove attribution; `lens_span` always present; `share_url` minted under the truthful identity. |
| `explore_range` | Page-authored counterfactual route(s) into a claimed margin range — *what would have to be true*, never an estimate; the number appears only inside each route's `IF …` conditional sentence. |
| `get_report` | Research-annex documents, `report-s1…report-s10` front-page sections, `front-page` — verbatim, never summarized; unknown ids fail closed. |
| `get_dossier` | Per-preset provenance ledger (attribution, anchor quote, per-parameter evidence labels); values composed live from the registry. |

## Honest-labeling contract (what a caller must preserve)

- Every response leads with a **complete honest sentence** (the plain-text content). Quote or
  closely paraphrase it — a bare number without its welded status is a misquote.
- Margin values are **status-fused strings**: `"≈77% (unit serving, not company GM)"`,
  `"≥80% (floor)"`, `"≈93% (counterfactual)"`. Bare scalars exist only in `selection_receipt`,
  whole-point rounded (`value_pct_unrounded` deliberately does not exist).
- Every response carries `selection_receipt` `{central_estimate_pct, this_result_pct,
  is_central, selection_origin, changed_from_central[]}` — a non-central result is never
  returned without the central estimate alongside.
- Residual risk (documented, not hidden): the threat model is an **honest-but-lossy
  intermediary**. A caller that discards all of this can still emit a bare number; the design
  makes misquotation *resistant* and auditable, not impossible.

## Build & test

```bash
cd mcp-server
npm install
npm run build     # tsc → dist/
npm test          # builds, then node --test (contract + parity + transports; 32 tests)
```

Node ≥ 20. The server must live next to the site checkout — it resolves
`../../site/engine.js` and `../../site/research/*.html` relative to `dist/` at runtime.

## Install — Claude Code (stdio)

```bash
claude mcp add inference-margins -- node /path/to/inference-margins/mcp-server/dist/stdio.js
```

(or with the packaged bin: `npm install && npm run build`, then point at
`mcp-server/dist/stdio.js`; the package exposes it as the `inference-margins-mcp` bin.)

## Install — Claude app (remote streamable-HTTP connector)

**Deployed (2026-07-13):** the `worker/` package runs this server as a stateless Cloudflare
Worker (canonical `createMcpHandler` + `WorkerTransport` from the `agents` SDK — no Durable
Object, fresh `McpServer` per request as MCP SDK ≥1.26 requires). Canonical endpoint:

```
https://margins-mcp.ashitaorbis.com/mcp
```

(Custom-domain route on the ashitaorbis.com zone; the account-default
`*.workers.dev` URL still resolves to the same Worker as a fallback but is not the
documented URL — it carries the account subdomain, so prefer the custom host.)

In the Claude app: **Settings → Connectors → Add custom connector** with that URL (no auth).

The worker REUSES these sources: `worker/scripts/build.mjs` copies `src/{server,shape,labels}.ts`,
`src/engine-types.d.ts` and five of the six tools **verbatim** into `worker/src/gen/` on every
build (parity-gated — the build fails on drift), swapping in exactly three worker-native
modules from `worker/overrides/`: `engine.ts` (bundler import of `../site/engine.js` instead of
`createRequire`), `reports.ts` (fail-closed id catalog baked from `../site` at build time;
document content fetched from the live site at runtime), and an async `get_report.ts`.
Deploy with `cd worker && npm run deploy` (builds, typechecks, `wrangler deploy`; engine
ground-truth gate ≈76.8% must pass first). Redeploy the worker whenever `site/` redeploys.

Self-hosted alternative — run the Node HTTP entrypoint behind TLS:

```bash
PORT=8977 HOST=0.0.0.0 node dist/http.js   # announces: … listening on http://0.0.0.0:8977/mcp
```

Transport details: **stateless** streamable HTTP (`sessionIdGenerator: undefined`) — a fresh
server per POST, single `/mcp` endpoint, `GET`/`DELETE` → 405, 64 KB body cap, JSON responses.
No auth in v1 (equivalent to the public site — the data is public and the server is read-only);
bind 127.0.0.1 for local use, put TLS + rate limiting in front for public exposure.
Override values are **never logged** (they may contain private negotiated rates).

## Install — Codex (config.toml)

```toml
[mcp_servers.inference-margins]
command = "node"
args = ["/path/to/inference-margins/mcp-server/dist/stdio.js"]
```

## Version coupling

Every response carries `engine: { revision, data_as_of }` (currently stamped from the live
`site/engine.js`). Because the engine is read at process start, **redeploy this server whenever
`site/engine.js` changes** — the site's deploy procedure is the trigger. The grep-parity tests
(`test/contract.test.mjs`) fail the build if `site/app.js` wording drifts from the mirrored
sentences in `src/labels.ts`; hoisting those sentences into `engine.js` is a deferred site
follow-up (design doc, DECISION 5).

## Layout

```
src/engine.ts          createRequire bridge (single source of truth) + site URLs
src/engine-types.d.ts  type shim for the engine exports used here
src/labels.ts          app.js-mirrored sentences + evidence-board taxonomy (grep-parity-tested)
src/shape.ts           Variant B envelope, selection_receipt, status-fused string helpers
src/reports.ts         startup catalog of site/research/*.html + report sections (fail-closed)
src/tools/*.ts         the six tools, registered in the site's own order
src/server.ts          buildServer()
src/stdio.ts           stdio entrypoint (bin)
src/http.ts            stateless streamable-HTTP entrypoint (/mcp)
test/*.test.mjs        contract (release gate) + parity (engine ground truth) + transports
worker/                Cloudflare Workers deployment (remote connector) — reuses src/ via
                       worker/scripts/build.mjs (verbatim copy + parity gates); worker-native
                       overrides in worker/overrides/{engine,reports,get_report}.ts
```
