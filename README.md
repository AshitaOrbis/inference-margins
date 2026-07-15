# Frontier Inference Margins

An interactive model of what it costs to serve one token of a frontier LLM — and the
**modeled unit direct-serving contribution margin** that implies. Live at
**[margins.ashitaorbis.com](https://margins.ashitaorbis.com)**.

This is an open scenario model built from public sources, not financial disclosure.
Every preset parameter carries a source and an evidence label (DISCLOSED / CREDIBLY
REPORTED / COMMUNITY ESTIMATE / SPECULATION); every §10 provider headline reproduces
from a named preset through the test suite; nothing here is any provider's actual ledger.

## What's in the model

- **Pure engine** (`site/engine.js`, node-importable): cost identity over architecture
  (active/total params, precision), hardware (per-platform anchored effective-MFU fits,
  GPU-hour costs), traffic mix (I/O ratio + cache hit as a first-class axis), and billing
  (list prices, cache tariffs, batch/discount) → per-token cost and margin.
- **Model presets** own billing/architecture; **perspectives** (cost lenses, dive replays,
  range explorations) own procurement; a typed **margin-claims registry** bins sourced
  public claims — claims, not people — with typed relations (a floor is never an interval).
- **§10 provider dives**: Anthropic, OpenAI, Google, xAI, Moonshot, DeepSeek, Zhipu —
  each with a dive-replay preset that reproduces the card's headline within 1pp, enforced in CI.
- **Research annex** (`site/research/`, built from `research/*.md`): the complete review
  record — council + GPT-5.6 Pro adversarial reviews, consultations, the LOAO negative
  result (a single scalar MFU fails cross-platform transfer), reception audits, the
  machine-generated grounding ledger, and the full changelog.
- **MCP connector**: the same engine and claims registry, read-only, at
  `https://margins-mcp.ashitaorbis.com/mcp` — responses carry the same honest-labeling
  contract (status-fused margins with selection receipts, never a bare number).

## Method, briefly

Anchor fits, not vibes — and not a validated predictive model. Each accelerator's
effective-MFU reproduces that platform's best public measurement (DeepSeek's production
serving disclosure, Ant Group's H20 deployment, GB200/GB300 benchmarks). The obvious
falsification test was run and published: one global MFU fitted on the DeepSeek anchor
mispredicts other platforms by 37% mean error, so per-platform fits stay, as a documented
decision with documented consequences. Where no anchor exists (TPU v7, Trainium, Rubin),
the page says so and carries lower confidence.

Releases are gated: every version since v2 shipped through adversarial external review
(four-persona councils + independent GPT-5.6 Pro passes; five separate NO-SHIP verdicts
were each remediated and re-gated), and `deploy.sh` refuses to ship unless the engine
suite, the traffic-mix state contract, and the browser application suite all pass.

## Running it

```bash
# the whole site is static — open site/index.html, or serve the directory
node tests/snapshots.test.mjs        # engine + semantic gates
node tests/traffic-contract.test.mjs # traffic-mix state contract (fixture-pinned)
bash tests/run-app-tests.sh          # browser application suite
node build-research-html.mjs         # regenerate the annex from research/*.md
```

## Repo shape

This public repo receives release snapshots from a private working copy via an
allow-listed publish script; one commit per release, mirroring
[the changelog](research/changelog.md). The private copy holds working notes and
paywalled-source summaries that don't belong in public.

## License

Not yet granted — all rights reserved until a license file lands (a code/content split is
under consideration). The live site remains freely readable either way.

## Disclaimer

All figures are estimates unless linked to a primary source. Prices carry as-of dates.
The margin metric is a **list-price unit direct-serving contribution margin** — not a
company gross margin, and the report is explicit about which claims live at which layer.
