# inference-margins MCP server

Read-only MCP server over the **Frontier Inference Margins** site — the same substrate the
site itself runs on. `../site/engine.js` is consumed at runtime via `createRequire` and is the
**single source of truth**: this package re-declares no engine constant, and the state-identity
sentences it mirrors from `../site/app.js` are grep-parity-tested against the live source on
every test run (the build fails on silent drift).

Built to the DECISIONS block of `../research/mcp-server-design.md` (2026-07-12):
response-level envelope (Variant B), status-fused value strings, honest-but-lossy threat model.

Since U5 it also carries the **dc-map datacenter surface** — seven additional tools over the
dated evidence registry of physical AI sites and its scenario calculator (`../dc-map/DESIGN.md`
§5/§6). They are registered *after* the original eight, whose names, order and `TOOL_ERROR_CODES`
are unchanged, and they are thin adapters over the shared U3 query/calculation layer rather than a
second implementation of it. See **[Datacenter tools (U5)](#datacenter-tools-u5)**.

## Tools (eight, all `readOnlyHint: true`)

| Tool | What it returns |
|------|-----------------|
| `list_scenario_space` | Every model / perspective / traffic-profile / bucket / override-bound / report id the other tools accept, plus DC/programme rows, regions, the shared section/band schemas, coverage ledgers, defaults and the exact metric definition. |
| `query_margin_claims` | The 34-record typed claims registry, filtered — cited claims with byte-exact quotes and provenance tiers, never a derived estimate. Floors are `compatible-with`, never intervals; company-GM figures never sit among unit-serving claimants. |
| `run_scenario` | Policy-scenario output through the engine pipeline in the site's order; replay traffic locks enforced (MLI-1); divergent replay edits remove attribution; `lens_span` always present; `share_url` minted under the truthful identity. |
| `adjust_rental_rate` | Basic provider tool: apply one absolute rent to every active accelerator or a donor-keyed map, defaulting to the provider flagship under `gptpro-r3`; returns the standard envelope plus `what_changed`. |
| `run_fleet_sections` | Advanced provider tool: run explicit sections in the shared builder schema, or compose DC/programme registry ids plus generic US/China fill; returns section/blended bands, coverage and a v7 by-value link. |
| `explore_range` | Page-authored counterfactual route(s) into a claimed margin range — *what would have to be true*, never an estimate; the number appears only inside each route's `IF …` conditional sentence. |
| `get_report` | Research-annex documents, `report-s1…report-s10` front-page sections, `front-page` — verbatim, never summarized; unknown ids fail closed. |
| `get_dossier` | Per-preset provenance ledger (attribution, anchor quote, per-parameter evidence labels); values composed live from the registry. |

`run_scenario.overrides` accepts `rentAbsAll` as one absolute $/accelerator-hour value and
`rentAbsLeg` as a map keyed by registered accelerator donor id. Both use the closed $0.05–$50
bounds returned by `list_scenario_space`; an out-of-bounds or unknown-key claim is rejected rather
than clamped. A donor-specific value wins over the fleet-wide value, and an absolute price replaces
the registered or custom-fleet rent without any rental multiplier. No lab publishes what it pays,
so these are caller-stated policy-scenario inputs, not observed contract prices.

### `adjust_rental_rate` and `what_changed`

Supply `company`; optional `model` defaults to that company's flagship. Supply exactly one of
`rent_usd_per_hr` or `rent_usd_per_hr_by_hw`. `perspective` defaults to `gptpro-r3`; the accepted
alternatives are `fable-r3`, `stress-public-rate` and `median`. Optional traffic uses the same
native/profile/custom shape and validation as `run_scenario`.

Every successful response adds this provenance-rich object to the standard honest envelope:

```text
what_changed = {
  variable: "rental $/accelerator-hour",
  scope: { company, model, perspective, fleet, affected_basis },
  from: { by_hw, source, basis_label },
  to: { by_hw, kind: "policy-scenario override" },
  outputs: {
    margin_pct: { baseline, adjusted, delta_pp },
    cost_per_mtok: { baseline, adjusted, delta },
    lessor_spread_implied: { baseline, adjusted, delta_pp }
  },
  metric, uncertainty_basis, warning, sentence
}
```

Every output member is `{low, mid, high, basis, label}`. The rent edit itself is point-valued,
but the triples propagate the selected perspective's declared dial ranges through the engine's
one-axis-at-a-time corner evaluation and coupled composition polytope. Their midpoint is labeled
`middle assumption`; only a perspective with no ranged axis emits an equal `point` triple and says
why. Each `from.by_hw[donor]` contains the effective old value plus that donor's verbatim registered
`rentBasis` source; each replacement contains the new value plus `source: "reader-stated"`.
The fleet-wide input receipts every active donor. A donor-keyed input receipts exactly the keys the
caller supplied, including a currently inactive registered donor whose numeric delta is therefore
zero; untouched donors are never mislabeled reader-stated. Under `stress-public-rate`, margin, cost,
lessor spread, and `scope.fleet` all use the same registry-evidenced sections plus generic remainder.
`affected_basis` states the fleet basis that changed, and the
sentence names old and new assumptions, delta/range, basis, and the full rider: policy scenario,
not a measured margin and not a company gross margin. Override values are returned only to the
caller and are never logged.

### `run_fleet_sections`

Supply `model` plus exactly one composition path:

- `sections: [...]` uses `list_scenario_space.sections_schema`, the exact closed schema consumed by
  the browser builder and engine validator.
- `dc_rows: [ids]` requires `fill: "generic-us" | "generic-cn"`; accelerator counts propose row
  shares and the un-attributed modeled share becomes an editable generic-fill section.

Optional `perspective` defaults to `gptpro-r3`; optional `overrides` pass through the standard
scenario-bound validator. The response carries per-section `{basis, share, cost_per_mtok, margin}`
triples, blended cost/margin triples, the composed-fleet coverage ledger, the preset coverage twin,
the standard receipt/claim envelope and a `share_url` whose v7 token carries sections by value.
The same section DTO also exposes `fallback_receipts`, `share_rounding`, `share_normalization`, and
the engine-owned `receipt_sentence` consumed by the browser composition line.
`fallback_receipts` is output metadata, not caller authority: the engine re-derives it from the
operative section and referenced registry row after every browser/MCP edit, ignoring an omitted,
stale, or fabricated incoming receipt array.
Section shares are triples too: scalar shares are labeled `point`, while ranged shares name the
coupled sum-to-100 share-polytope basis. Because the live browser builder accepts intermediate
totals while a reader types, a scalar total outside 100 ±0.05 is normalized and disclosed in both
the share basis and sentence (declared share, declared total, and normalized share); it is never
silently presented as a plain point.
A `dc_rows` caller can name a registry row whose accelerators appear nowhere in the selected
model+perspective blend. Accelerator counts then propose nothing for it, so it composes to no
section. That drop is disclosed, never silent: `composition_receipts` carries one
`{rowId, classification: "not-composed", hwKeys, reason}` entry per dropped row, the same receipt
rides the `Composition receipts:` clause of the spoken sentence and the coverage ledger's
`Coverage fallbacks:` clause, and the browser's prominent coverage line renders the identical text.
Like `fallback_receipts`, it is derived output, not caller authority — it never travels in the v7
by-value section wire and cannot be supplied, suppressed or forged by a caller.
Coverage percentages are display numbers rounded to one decimal by the single engine function that
computes them; a whole number prints bare (`40%`), a fractional one to one decimal (`33.3%`). The
three parts are rounded independently and are never nudged to force an exact 100, so a rounded
total of 99.9 or 100.1 is the honest display.
Coverage is always a share of the modeled blend, never a claim about how much of the real fleet is
known. Section validation is reject-whole and never clamps or repairs caller data.

## Datacenter tools (U5)

Seven read-only tools over the **dc-map** evidence registry, on the same shared query/calculation
layer the browser calculator runs (`dc-map/economics`, U3). No forked enums and no caller-forged
receipts: the published input schemas ARE `dc-map/economics/src/dto.ts`'s `InputSchemas`, and every
response body is that layer's own envelope, unmodified by this server.

**The release-id field.** Every datacenter response carries `release_id` — the one exact immutable
substrate release it was computed from (`rel-` + 24 hex). A request naming a different release gets
a typed `release-mismatch` and nothing else; a server that cannot open a release at all answers
`release-unavailable` with `release_id: null` and the reasons. Nothing ever falls back to "latest",
and a pagination cursor is bound to the release, the manifest digest and the filter set, so it
cannot be replayed across releases either. The Node server resolves `dc-map/releases/CURRENT` once
per process (override the directory with `DCMAP_RELEASES`, a specific release with
`DCMAP_RELEASE_ID`); the Worker answers from a release embedded at build time. Both re-verify every
artifact digest against the manifest before serving anything from it.

**The quotable-sentence rule** is the same one the original eight keep, and it applies to the
`sentence` field of every datacenter response: it is the complete honest claim, and the plain-text
content of the reply is exactly that string. A ranking sentence says *modeled … among these
eligible scenarios*; it never says "the cheapest datacenter". A schedule sentence relays the
producer's assessment tokens; `overdue-unverified` means silence, not delay. `isError` is set only
for `invalid-request`, `release-mismatch` and `release-unavailable` — a transparent
`insufficient-evidence` or `not-found` answer is a normal response, because clients commonly
suppress `structuredContent` on `isError` and that would hide the named missing components which
are the entire point of the refusal.

| Tool | What it returns |
|------|-----------------|
| `list_datacenters` | Typed, filtered, paginated listing with coverage/exclusion counts and a tracked-evidence capacity total. |
| `get_datacenter` | One site's promoted evidence atoms, relationships, dated capacity, schedule and gaps. |
| `rank_datacenters` | A ranking on one fixed comparison profile: bands, overlap groups, exclusions with reasons. |
| `datacenter_schedule` | Baseline and revised targets, observed events and the producer's deterministic assessments. |
| `datacenter_impact` | A replacement scenario: central vs allocation-adjusted, with `what_changed` receipts. |
| `datacenter_stakeholders` | Dated typed relationships and contracts with their contractual state. |
| `price_token_from_site` | The `run_scenario` envelope with site/pool evidence — a modeled cost per million tokens. |

**`list_datacenters`** returns the physical sites that pass the whole identity predicate, filtered
by country, owner, status, capacity floor, free text or explicitly by *unknown capacity*, and
paginated behind a release-bound cursor. Programmes and cloud regions are returned only under
`include_nonphysical` and contained phases only under `include_components`, because a cloud region
is not a campus and a phase is not a second campus. The capacity total is assembled from the
producer's own aggregation receipts, once per evidence id, so a parent and a covered descendant are
never both added; the response states that rule rather than leaving it to be assumed, and says
plainly that a zero sum is the sum of no included quantities, not evidence of zero capacity.

**`get_datacenter`** returns one site's promoted record: the presentation site object, and every
adjudicated evidence atom for it with its `claim_nature`, scope, measurement boundary, capacity
state, as-of date and sources intact — so a caller can tell a literal disclosure from a declared
plan from a model output instead of trusting a label. Conflict adjudication records are reported
as `not-exported` by the producer contract rather than as an empty set: an absent export is not
evidence that no conflicts exist. No scenario is computed; the response says which tool to use.

**`rank_datacenters`** recomputes every scenario from its validated bundle — caller-supplied values
and receipts are never ranked — holding one comparison profile fixed across all of them, and
returns the canonical profile hash, the metric definition, the ordering basis, the eligible
scenarios' bands, the connected overlap groups and every excluded scenario with its reasons. An
overlap group is not a proven tie and carries no internal rank; a midpoint sort is available and is
labelled as a sort of modeled middle assumptions, and it never dissolves a group. There is no
default all-in $/H100e-hour across dissimilar accelerators, so a scenario whose hardware differs
from the profile is excluded with that reason rather than converted. A registered
`comparison.profile_id` is accepted, but the substrate publishes no profile registry yet, so today
a ranking supplies `comparison.parameters` in full.

**`datacenter_schedule`** returns the milestone comparisons for one site: the immutable baseline
target, the latest revised target, the observed event, and the producer's derived assessment for
each with its formula and the release's `assessment_as_of`. Baseline and latest-target timing are
kept apart and a revision erases neither. The assessment tokens are relayed exactly as promoted —
`completed-within-window`, `completed-early`, `completed-late`, `completed-by-deadline`,
`timing-indeterminate`, `target-window-open`, `future-target`, `overdue-unverified`, `no-baseline`
— and none is derived here, so no clock on any server moves one. `no-baseline` appears only where
the producer recorded that decision; a site with nothing exported says it has no exported schedule
comparison instead. Intermediate revision history is not guaranteed by the presentation contract
and the response states that.

**`datacenter_impact`** prices a baseline pool and a replacement pool on one profile and returns
the central value, the allocation-adjusted value, both full scenario results, and a `what_changed`
receipt naming every pool component that differs. The share of the declared workload the
replacement serves is a **named assumption** with its own evidence ids; without one the answer is
`insufficient-evidence` carrying an unresolved-dependency receipt, because physical evidence never
establishes a provider's serving allocation. The comparator is labelled a modeled comparison
baseline, not a verified central margin, and mismatched profile hashes refuse the comparison.

**`datacenter_stakeholders`** returns the dated typed relationships, tenant records and contract
records for one site with their contractual state — executed, option, MOU, announced — and fuses
the count of prospective or not-yet-executed records into the leading sentence rather than leaving
it in a field. The sentence also says, every time, that none of these records establish a serving
allocation. Tenant lists are non-additive and a GPU vendor is not a tenant.

**`price_token_from_site`** is *the `run_scenario` envelope with site and pool evidence*, not a
second envelope: a modeled result carries a `run_scenario` sub-object whose keys and nesting are
that tool's own `structuredContent`, read from the same engine over the leg-isolated state of the
queried accelerator. It prices one named site/service-boundary cost pool — perspective, phase and
coverage, disclosed key-level hardware counts, a complete bill from a promoted applicable tariff
version through a declared load shape, PUE applied once, disjoint annualized cost scopes, the rent
inclusion/exclusion matrix — and returns the band, the annual cost, the per-component breakdown and
every receipt. When a material component is missing, ambiguous or contradicted it returns a
transparent `insufficient-evidence` result that names the missing components instead of an all-in
number. Unsplit mixed inventory stays unsplit; hypothetical hardware never raises factual coverage;
financing commitments are never capex. Every priced result is **modeled**, even when every input it
consumed was disclosed.

**Discovery.** `list_scenario_space` gained one additive key, `datacenters`, carrying the accepted
ids (sites, hardware, models, traffic profiles, procurement bases, comparison profiles), the
published JSON Schemas for all seven tools, the metric definitions, the compatibility versions
(economics, presentation, contract + digest, schema version, release id, registry hash, producer
engine version, legacy engine revision) and the release binding. Its existing keys are untouched.
When no release is open the block says so with the typed status and reasons rather than publishing
an empty registry that would read as *there are no datacenters*.

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
npm run build     # vendors dc-map/economics/src → src/dcmap/economics, then tsc → dist/
npm test          # builds, then node --test (contract + parity + transports + dc-map; 117 tests)
```

Node ≥ 20. The server must live next to the site checkout — it resolves
`../../site/engine.js`, `../../site/engine-data-dc-v1.js` and `../../site/research/*.html`
relative to `dist/` at runtime, and `../dc-map/releases` for the substrate release.

`npm run build` first runs `scripts/sync-economics.mjs`, which copies `dc-map/economics/src`
verbatim into `src/dcmap/economics/` (git-ignored, regenerated every build, byte-identity asserted
by `test/dcmap-contract.test.mjs`). That package publishes `dist/src/index.js` under pnpm; copying
its sources keeps `rootDir: "src"` intact here — a relative import would move the compiler's root
to the repository and relocate the `bin` entry — and it is the same verbatim-copy pattern
`worker/scripts/build.mjs` already uses, so both transports bundle the same U3 bytes.

The dc-map suites mint their own synthetic substrate releases under `.dcmap-test-releases/`
(git-ignored). The committed cross-suite answer both calculator paths must reproduce is
`test/dcmap-parity-vector.json`; re-mint it deliberately, and say why, with:

```bash
node scripts/mint-dcmap-parity-vector.mjs
```

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

The worker REUSES these sources: `worker/scripts/build.mjs` copies
`src/{server,shape,labels,engine-types,claims-types}.ts` and seven of the eight tools **verbatim** into `worker/src/gen/` on every
build (parity-gated — the build fails on drift), swapping in exactly four worker-native
modules from `worker/overrides/`: `engine.ts` (bundler import of `../site/engine.js` instead of
`createRequire`), `claims.ts` (bundler bridge to the shared claim contracts), `reports.ts`
(fail-closed id catalog **and** the document bytes themselves baked from `../site` at build time —
see below), and an async `get_report.ts`.
Deploy with `cd worker && npm run deploy` (builds, typechecks, runs the worker's own suite, then
`wrangler deploy`; the engine ground-truth gate must pass first).

**Reports are release-bound.** The worker used to bake only the id catalog and fetch document
CONTENT from the live site at call time, so a worker built at one release could return that
release's engine numbers beside a *different* release's prose, under the words "archived
verbatim" (GPT Pro review 2026-07-29, finding C-6). It now bundles the raw markup of every
catalogued document, each with its `sha256`, plus a `RELEASE` record; `get_report` reports both
in `structuredContent.release` and there is no runtime fetch on that path. A worker therefore
serves the release it was built from, and says which one — so redeploying it after a `site/`
release is what makes the *archive* current, not what keeps it *correct*.

Self-hosted alternative — run the Node HTTP entrypoint behind TLS:

```bash
PORT=8977 HOST=0.0.0.0 node dist/http.js   # announces: … listening on http://0.0.0.0:8977/mcp
```

Transport details: **stateless** streamable HTTP (`sessionIdGenerator: undefined`) — a fresh
server per POST, single `/mcp` endpoint, `GET`/`DELETE` → 405, 64 KB body cap enforced on
`Content-Length` *before* the body is read (and while streaming when none is declared), JSON
responses. Malformed request metadata — including a syntactically invalid `Host` — returns 400
and the process keeps serving; before 2026-08-21 a `Host: a b` terminated it (same review,
finding C-5), which mattered because the line below tells you to bind `0.0.0.0`.
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
src/engine.ts          createRequire bridge (single source of truth) + site URLs + T4 registry
src/engine-types.d.ts  type shim for the engine exports used here
src/labels.ts          app.js-mirrored sentences + evidence-board taxonomy (grep-parity-tested)
src/shape.ts           Variant B envelope, selection_receipt, status-fused string helpers
src/reports.ts         startup catalog of site/research/*.html + report sections (fail-closed)
src/tools/*.ts         the eight margin tools then U5's seven datacenter tools, in registration order
src/dcmap/substrate.ts resolves ONE exact dc-map release per process (Node; the Worker overrides it)
src/dcmap/layer.ts     the query-layer bridge: legacy context, release refusals, tool adaptation
src/dcmap/space.ts     the additive `datacenters` block of list_scenario_space
src/dcmap/economics/   GENERATED verbatim copy of dc-map/economics/src (scripts/sync-economics.mjs)
src/server.ts          buildServer()
src/stdio.ts           stdio entrypoint (bin)
src/http.ts            stateless streamable-HTTP entrypoint (/mcp)
scripts/               sync-economics.mjs (vendoring) + mint-dcmap-parity-vector.mjs (parity vector)
test/*.test.mjs        contract (release gate) + parity (engine ground truth) + transports
                       + dcmap-{contract,schedule,release-binding,worker-release}
worker/                Cloudflare Workers deployment (remote connector) — reuses src/ via
                       worker/scripts/build.mjs (verbatim copy + parity gates); worker-native
                       overrides in worker/overrides/{engine,reports,get_report,dcmap-substrate}.ts,
                       and the active dc-map release embedded at build time (src/gen/dcmap/release.gen.ts)
```

### Worker release binding and the release gate

The Worker has no filesystem, so `worker/scripts/build.mjs` resolves `dc-map/releases/CURRENT`,
reads every artifact the manifest names, verifies each sha256 against it, checks each artifact's own
embedded `release_id`, and bakes the bytes into `src/gen/dcmap/release.gen.ts`. Any disagreement —
a digest mismatch, a foreign release id inside an artifact, a `FAILED.json`, a presentation fixture,
a malformed `CURRENT` — **fails the build**, because a Worker that shipped a release whose bytes are
not the release it names would stamp modeled prices with an id that does not describe them. An
*absent* release is a different fact from a *wrong* one and is embedded as a typed unavailable
record so the connector refuses honestly instead of taking the other eight tools down with it; set
`DCMAP_REQUIRE_RELEASE=1` to make absence a build failure too. `openRelease` re-verifies every
digest again at runtime: embedding is where the bytes came from, not a reason to trust them.

**Deploying that absence is a separate decision, and it fails closed.** `npm run deploy` runs
`node scripts/dcmap-deploy-gate.mjs` (also `npm run release:dcmap-gate`) after `--check` and before
`wrangler deploy`: it reads the identity out of the generated module the bundle carries and
**refuses the deploy** when no substrate release is embedded. `--readback` cannot catch this — it
checks that the live Worker and this tree *agree* about the absence, and they do. An operator who
means to ship the connector without a release sets `DCMAP_ALLOW_NO_RELEASE=1`, and the gate prints
the waiver, because a waiver nobody can see is not a waiver.

`node scripts/release-gate.mjs --readback` now also requires the live Worker to report the substrate
release this tree embedded (and to report *none* when this tree embedded none), and
`--dcmap-parity` compares the connector's substrate release against the one the evidence atlas at
`datacenters.ashitaorbis.com` is serving — `ALIGNED` / `SKEWED` / `UNKNOWN`, where an unanswerable
parity question is not a passing one. It is a separate verb from `--parity` because the atlas is a
separate Pages project on its own gate, and a margins Worker deploy must not be blocked by whether
the atlas has shipped yet.
