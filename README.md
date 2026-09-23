# Frontier Inference Margins

[![ci](https://github.com/AshitaOrbis/inference-margins/actions/workflows/ci.yml/badge.svg)](https://github.com/AshitaOrbis/inference-margins/actions/workflows/ci.yml)

An interactive cost model for one token of a frontier LLM, and the **serving margin** it
implies — of each dollar a provider bills for tokens, how much is left after the direct cost of
serving them. (The full technical name is *unit direct-serving contribution margin*; it is not a
company gross margin.) Live at **[margins.ashitaorbis.com](https://margins.ashitaorbis.com)**,
with a [glossary](https://margins.ashitaorbis.com/glossary) of every term the site uses.

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
  E.MODELS.find(m => m.id === "dsv4"),        // 49B active / 1.6T total, $0.66/$1.98 off-peak
  E.PERSPECTIVES.find(p => p.id === "dive")); // the dive replay: H800 fleet, 100% util
console.log((E.workload(S).margin * 100).toFixed(1) + "%");  // → 86.5%
'
```

The live card says **~86%** ("Reproduce this card" loads the same preset), and
`tests/snapshots.test.mjs` asserts the computed value stays within 1pp of it. Requires
Node ≥ 22 and pnpm 9; the browser suite additionally needs `chromium`/`google-chrome` on PATH.

```bash
pnpm install --frozen-lockfile
pnpm test              # engine suite + traffic-mix state contract
pnpm run test:browser  # headless-Chrome application suite (forged-permalink replays etc.)
pnpm run build         # regenerate the grounding ledger + research annex from pinned tools
```

The one sentence of method you should carry into the numbers: the decode-calibration
observations are all models of ≤~50B active parameters, while the
flagship scenarios assume 105–300B active. The wider evidence catalog includes larger
dense-model benchmarks, but none is a matched validation of those flagship scenarios — that
size axis is the model's largest unanchored extrapolation, stated in the
[methods note](research/methods-loao.md).

## What's in the model

- **Pure engine** (`site/engine.js`, node-importable): cost identity over architecture
  (active/total params, precision), hardware (per-leg compute/HBM/interconnect decode rooflines with
  explicitly classified efficiency factors, a single reconstructed prefill calibration transferred
  across platforms, and accelerator-hour costs), traffic mix (I/O ratio + cache hit as a first-class axis), and billing
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

Calibration points, not a validated predictive model. Every accelerator's throughput carries a
**calibration class** that says how its number was set, and they are not interchangeable:

- **fitted** — the coefficient reproduces a matched public measurement. Few rows are.
- **borrowed** — transferred from another row, and the kind of transfer is always stated:
  within-family, a same-platform bridge that is analyst-set, or an out-of-family joint fit.
- **analyst-set** — chosen at an assumed operating point, with no measured value.
- **projection** — derived from an announced shape only.

H20 and Ascend keep their measured observations as historical inputs to the frozen joint fit, but
their deployed per-row coefficients are separate judgment-set values that reproduce neither source
point, so they are not fitted either. The obvious falsification test was run and published: one
efficiency number fitted on the DeepSeek anchor mispredicts the other platforms by ~47% mean
error across the three benchmark observations, so row-specific coefficients stay and their classes are stated everywhere the numbers are
(reproducing an anchor is an identity, not out-of-sample validation).
Where no anchor is incorporated as a live fit — TPU v7 and Trainium2 now have public named-model
serving anchors that are not yet fitted into the roofline, while Trainium3 and Rubin have none at
all — the page says so and carries a wider stress envelope.

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
annex), plus a private maintainer release workflow that refuses to deploy unless the engine
suite, the traffic-mix state contract, and the browser application suite all pass. That
deployment entrypoint is intentionally not part of this public release-snapshot mirror. These are
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
headline metric is the **serving margin** (full name: *unit direct-serving contribution
margin*) — a list-price figure only when the batch and discount sliders are 0%; the page's own
illustrative mix applies a 15% batch share and 5% discount, which it calls *effective price* —
and it is not a company gross margin. The report is explicit about which claims live at which
layer.
