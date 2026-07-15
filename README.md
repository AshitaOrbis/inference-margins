# Frontier Inference Margins

[![ci](https://github.com/AshitaOrbis/inference-margins/actions/workflows/ci.yml/badge.svg)](https://github.com/AshitaOrbis/inference-margins/actions/workflows/ci.yml)

An interactive model of what it costs to serve one token of a frontier LLM — and the
**modeled unit direct-serving contribution margin** that implies. Live at
**[margins.ashitaorbis.com](https://margins.ashitaorbis.com)**.

This is an open scenario model built from public sources, not financial disclosure.
Adopted model and perspective parameters carry a source and an evidence label (DISCLOSED /
CREDIBLY REPORTED / COMMUNITY ESTIMATE / SPECULATION) recorded in the
[grounding ledger](research/grounding-ledger.md); provider-dive settings are page-authored
assumptions and are labeled as such. Nothing here is any provider's actual ledger.

## Reproduce one result

Every §10 provider headline reproduces from a named preset within 1pp, enforced by the test
suite in this repo — run by CI on this exact public tree, and by the release gate before
every deploy. The DeepSeek V4 Pro card, traced end to end:

```bash
node -e '
const E = require("./site/engine.js");
const S = E.applyPresetSettings(
  E.MODELS.find(m => m.id === "dsv4"),        // 49B active / 1.6T total, $0.435/$0.87
  E.PERSPECTIVES.find(p => p.id === "dive")); // the dive replay: H800 fleet, 100% util
console.log((E.workload(S).margin * 100).toFixed(1) + "%");  // → 68.1%
'
```

The live card says **~69%** ("Reproduce this card" loads the same preset), and
`tests/snapshots.test.mjs` asserts the computed value stays within 1pp of it. Requires
Node ≥ 20; the browser suite additionally needs `chromium`/`google-chrome` on PATH.

```bash
npm test              # engine suite + traffic-mix state contract (dependency-free)
npm run test:browser  # headless-Chrome application suite (forged-permalink replays etc.)
npm run build         # regenerate the grounding ledger + research annex from sources
```

The one sentence of method you should carry into the numbers: all published serving anchors
are ≤~50B-active models, while the flagship scenarios assume 120–300B active — that size
axis is the model's largest unanchored extrapolation, stated in the
[methods note](research/methods-loao.md).

## What's in the model

- **Pure engine** (`site/engine.js`, node-importable): cost identity over architecture
  (active/total params, precision), hardware (per-platform anchored effective-MFU fits,
  GPU-hour costs), traffic mix (I/O ratio + cache hit as a first-class axis), and billing
  (list prices, cache tariffs, batch/discount) → per-token cost and margin. It is the single
  source of truth for numerical model inputs, equations, and the claims registry; UI state,
  permalink encoding, and rendered wording live in `site/app.js`.
- **Model presets** own billing/architecture; **perspectives** (cost lenses, dive replays,
  range explorations) own procurement; a typed **margin-claims registry** bins sourced
  public claims — claims, not people — with typed relations (a floor is never an interval).
- **Provider dives**: Anthropic (report §§5–6) plus six §10 comparison providers — OpenAI,
  Google, xAI, Moonshot, DeepSeek, Zhipu — each §10 card backed by a dive-replay preset
  reproducing its headline within 1pp.
- **Research annex** (`site/research/`, built from `research/*.md`): the published review
  record — model-run adversarial reviews, consultations, the anchor-transfer negative
  result, reception audits, the machine-generated grounding ledger, and the full changelog.
- **MCP connector**: the same engine and claims registry, read-only, at
  `https://margins-mcp.ashitaorbis.com/mcp` — responses carry the same honest-labeling
  contract (status-fused margins with selection receipts, never a bare number).

## Method, briefly

Anchor fits, not vibes — and not a validated predictive model. Each accelerator's
effective-MFU reproduces that platform's best public measurement (DeepSeek's production
serving disclosure, Ant Group's H20 deployment, GB200/GB300 benchmarks). The obvious
falsification test was run and published: one effective MFU fitted on the DeepSeek anchor
mispredicts the other platforms by ~37% mean error, so per-platform fits stay, as a
documented decision with documented consequences (reproducing an anchor is an identity, not
out-of-sample validation). Where no anchor exists (TPU v7, Trainium, Rubin), the page says
so and carries lower confidence.

## Repo shape

This public repo receives release snapshots from a private working copy via an allow-listed
publish script; one commit per release, mirroring [the changelog](research/changelog.md).
Commit messages name the private source hash for the maintainer's provenance; the public
identity of a release is its engine version + changelog entry. Generated files
(`site/research/*.html`, `research/grounding-ledger.md`, `site/tests/*`) are committed so
the served bytes are inspectable — see [CONTRIBUTING.md](CONTRIBUTING.md) for what to edit
instead, and for the issue categories that help most.

## Development and audit history

Every version since v2 shipped through staged review gates: multi-persona adversarial
review passes and separately-run GPT-5.6 Pro reviews (details and full transcripts in the
annex), plus a release script that refuses to deploy unless the engine suite, the
traffic-mix state contract, and the browser application suite all pass. These are
model-based adversarial reviews run in separate sessions — useful for catching errors,
overclaims and inconsistencies, and the annex records several release-blocking verdicts
that were remediated before shipping. They are **not** independent human validation, and
the annex says so explicitly. The published annex is the adopted record plus selected raw
artifacts, not a complete transcript of every working document.

## License

Original code and prose: MIT (see [LICENSE](LICENSE)). Vendored fonts are SIL OFL 1.1 and
quoted source material remains its authors' — see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Disclaimer

All figures are estimates unless linked to a primary source. Prices carry as-of dates. The
headline metric is the **modeled unit direct-serving contribution margin** — a list-price
metric only when the batch and discount sliders are 0% (the default perspective applies a
15% batch share and 5% discount, so its denominator is realized modeled billings) — and it
is not a company gross margin. The report is explicit about which claims live at which
layer.
