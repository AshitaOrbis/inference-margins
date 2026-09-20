# Minted permalink-token corpus — v2.1.11 baseline

`fixtures-minted-tokens-v211.json` is a corpus of **real permalink tokens minted by the shipped
v2.1.11 encoder** (`site/engine.js`), captured for the IM1 permalink-epoch work
(`research/im1-permalink-epoch-memo.md`, governing plan
`orchestration/plans/im-reengineer-defaults-2026-07-16.md` §4 risk 1 / §5 row IM1).

Until now there was **no minted-token corpus** — every codec test builds tokens on the fly
(`tests/traffic-contract.test.mjs`, `tests/snapshots.test.mjs`) and `fixtures-baseline-v211.json`
is a resolution-parity table, not tokens. The permalink codec is *relative* (it stores a diff
against a live baseline and re-resolves that baseline through the current engine), so before v2.2
moves any engine number we need a frozen set of tokens minted by the **current** encoder to diff
against. That is what this file is.

> **VALIDITY — read first.** This corpus is a valid baseline **only while
> `ENGINE_REVISION === "v2.1.11-2026-07-16"`** (`site/engine.js`). The recorded input vectors and
> margins are what *this* engine produces. Any change to the preset / perspective / traffic tables,
> `DEFAULTS`, `SCENARIO_BOUNDS`, `MARGIN_BUCKETS`, or the codec itself invalidates them. When the
> engine changes, that is the point: an IM1 suite will diff *new* engine behaviour against these
> frozen tokens to detect silent drift and hard rejections. Do **not** re-mint against a changed
> engine and overwrite this file — mint a new epoch file. Minting commit and engine revision are
> stamped in `_meta`.

This corpus is **not** wired into any test suite yet — that is IM1 implementation, later. It
modifies nothing under `site/` or any existing test.

## File shape

```
_meta        { mintingCommit, engineRevision, dataAsOf, date, validityWarning, counts, roundTrip, maxTokenLengthChars }
v4[]         68 tokens minted by the CURRENT (v4) encoder — each fully round-trip-verified
historical[] 16 tokens minted by RESURRECTED period encoders (8 v2 + 8 v3), decoded under the current engine
```

Per **v4** record: `token`, `encoderVersion:"v4"`, `identityKind`
(`clean` | `exploration` | `modified` | `modified-exploration`), `model`, `persp`, `trafficMode`,
`trafficProfileId`, `ioRatio`, `cacheHit`, `displayedMarginPct` (3 dp), `inputVector` (the full
resolved state **at decode time**), `roundTrip {vectorOk, marginOk, detail}`, `mintingCommit`,
`engineRevision`, `dataAsOf`, `date`, `note`.

Per **historical** record: `token`, `encoderVersion` (`v2`|`v3`), `mintEngineRevision`,
`mintMarginPct` (what the sharer saw then), and `resolvedUnderCurrent { decodes, engineRevision,
inputVector, displayedMarginPct, marginDriftPp, migratedFrom, rejectedFields, failReason }` — the
compatibility baseline (what today's engine resolves the legacy token to).

## Round-trip verification (the acceptance property)

The minting script (`mint.mjs`, see below) contains a faithful pure-state **port of
`site/app.js loadScenarioFromURL()`** — the same identity-restore → `applyPresetSettings` →
`sanitizeScenarioDiff` → locked-wins → `reconcileLinkTraffic` sequence, minus DOM. Every v4 token
is decoded and reconstructed through that port and asserted to recover **both**:

1. the exact mint-time input vector (`vectorOk`, numeric tolerance 1e-9), and
2. the displayed headline margin (`marginOk`).

**Result: 68 / 68 v4 tokens pass on both vector and margin. 16 / 16 historical tokens decode under
the current engine.** No failures — nothing hidden. (If a token had failed round-trip, that would be
a finding recorded in `roundTrip.detail`, not suppressed.)

## What v4 covers (68 tokens)

| Category | n | What it exercises |
|---|---|---|
| `A-clean-native` | 16 | Every model preset × `median` × its native traffic profile. Native spans reference / openai-dive / deepseek-disclosure / ncode across the model set. |
| `A-clean-explicit` | 12 | Each of the 6 traffic profiles as an explicit selection (opus across all six) + a distinct natural model pairing per profile (guarantees kimi-dive & uncached appear). |
| `A-clean-custom` | 1 | Custom traffic mode on a clean identity (opus 300:1 / 95%). |
| `A-clean-dive` | 6 | `dive` replays (replay-locked traffic) for the §10-card models (gpt/gemini/grok/dsv4/glm/kimi). |
| `A-clean-persp` | 6 | Other perspective kinds: `deepseek`/`xaicash`/`xaiopp`/`anth20` replays, `chinacloud` & `gptpro` lenses. |
| `C-exploration-flagship` | 4 | Each range-exploration route at the flagship scope (opus × explicit Reference) — where the computed bucket is defined: x90-v1→≥90, x80-v3→80–90, x80-v4→80–90, x60-v3→<60. |
| `C-exploration-native` | 4 | Same 4 routes at opus native. |
| `C-exploration-drift` | 4 | Same 4 routes on a different model (gpt) — valid clean exploration links that drift off the flagship bucket (the token still stamps the flagship-computed `rangeId`, which is correct: membership is defined at the flagship scope). |
| `C-exploration-custom` | 1 | Exploration on a custom traffic selection. |
| `B-modified-p0-globaldefault` | 4 | **The 2026-07-15 P0 class**: a field explicitly set **to its global-default value** that differs from the preset's own (gpt active→300, grok priceIn→5, kimi cacheReadMult→10, dsr1 priceOut→25). These are *clean* identities (editing a lens never downgrades to `__modified`); they survive only because the encoder diffs against the **preset** baseline, not global `DEFAULTS`. gpt active→300 reproduces the documented margin flip (92.257% at preset 105 vs 77.878% at 300). |
| `B-modified` | 6 | Genuine `__modified` / `__modified-exploration` links (reached in-app only by editing a replay or exploration), each perturbing a distinct field class: architecture, pricing, serving, TCO (`hwMode=tco`), blend, subscription. |
| `D-edge-billCacheHit` | 3 | `billCacheHit` crossing its `null` default, at both bounds and a mid value (0 / 20 / 95) — shows the field's large margin sensitivity (dsv4 median swings 21.0% → −111.8%). |
| `D-edge-maxlen` | 1 | Max-length token (1035 chars): a kitchen-sink modified scenario with (nearly) every field non-default + a full 10-way hardware blend. |

Traffic **modes** covered across the set: `native`, `explicit`, `custom`, and `replay-locked`
(via the dive/replay clean links). `legacy-custom` is a v2-migration-only mode and is exercised on
the historical v2 side (below).

## What v4 deliberately does NOT cover

- **No 60–80% exploration route.** By design there is no exploration config in the `b6080` bucket —
  the central `median` lens is that bucket's own anchor (`site/engine.js` PERSPECTIVES comment). The
  `median` clean links sit in `b6080` (opus/median = 76.778%) and stand in as that bucket's
  representative. So `C-*` covers three of the four buckets; `b6080` is covered by `A-clean-native`.
- **No minted v4 token carrying a retired-perspective id.** The current encoder only emits *live*
  perspective ids, so a *real* v4 retired-id token cannot exist — only a hand-forged one could, and
  hand-built tokens are worthless as a baseline. Retired-id coverage is therefore provided by the
  **real historical v2/v3 tokens** below (which carry `teortaxes`/`zephyr`/`semi`/`skeptic`
  authentically, because those were live ids at mint time) decoded through today's
  `normalizePerspId` migration. The v4 decoder's retired-id normalization path is already asserted by
  `tests/traffic-contract.test.mjs` via forged tokens.
- **Wild (out-of-corpus) vectors.** A finite corpus cannot cover every input vector a shared link
  could carry; it asserts faithfulness on the enumerated cases only (this is the stated limitation of
  input-preservation in the memo §6).

## Historical v2 / v3 (16 tokens) — the compatibility baseline

Real tokens minted by the **actual period encoders resurrected from git**, then decoded through the
**current** engine to record what v2.1.11 resolves them to:

- **v2** — encoder from `cf373b3` (`site/app.js`, engine `v2.1.1-2026-07-10`): a bare diff against
  the v2-era `DEFAULTS`, no traffic block. 8 tokens: clean, the four retired analyst ids, two
  replays, and one edited (`gpt active→105`).
- **v3** — encoder from `9851d50^` (`site/engine.js`, engine `v2.1.2b-2026-07-11`): diff + a traffic
  identity block. 8 tokens: clean native, retired ids (native + explicit), an explicit-profile link,
  and two locked replays.

**Findings recorded in the baseline:**

- All 16 legacy tokens still **decode** under v2.1.11, and every one resolves with **0.0 pp margin
  drift** — today's engine reproduces the exact number each token encoded. That is expected: the
  only preset vector that changed between these eras and v2.1.11 is the `teortaxes` remediation, and
  that change is captured *in the diff*, so it is preserved rather than silently re-resolved. When
  v2.2 moves engine numbers, re-running the same decode will show **non-zero** `marginDriftPp` — that
  delta is the silent-drift signal IM1 must catch.
- **Retired ids migrate as designed.** `teortaxes`/`zephyr`/`semi`/`skeptic` normalize to
  `x80-v3`/`x80-v4`/`x90-v1`/`x60-v3` (`migratedFrom` records the original spelling). The
  remediation shows through faithfully: the **v2** `teortaxes` token (pre-remediation `rentMult`
  0.85) resolves to **90.89%**, while the **v3** `teortaxes` token (remediated `rentMult` 1.0)
  resolves to **89.283%** (matching the live `x80-v3` flagship pin of 89.3%). The link's numbers are
  its identity — each preserves its own era's value.
- The two v3 **replay** tokens report `rejectedFields: [ioRatio, cacheHit]` — the current
  sanitizer strips the diff's traffic keys under the replay lock and re-asserts the locked operating
  point (the forged-permalink hardening). Benign: the rejected values equalled the locked values, so
  the margin is unchanged (0 pp drift).

## How this corpus was produced (exact commands)

Everything runs against **local files only** — no network, no deploys, no production URLs.

```bash
cd <repo-root>   # the checkout root of this repository

# 1. Stage the two historical engines the resurrected encoders run over:
mkdir -p <scratch>/hist
git show cf373b3:site/engine.js      > <scratch>/hist/engine-v2-cf373b3.js   # v2 era (v2.1.1)
git show '9851d50^:site/engine.js'   > <scratch>/hist/engine-v3-9851d50p.js  # v3 era (v2.1.2b)

# 2. Mint + verify (drives site/engine.js encodeScenario exactly as site/app.js does;
#    round-trips every v4 token through a pure port of site/app.js loadScenarioFromURL):
OUT=tests/fixtures-minted-tokens-v211.json node <scratch>/mint.mjs
```

`mint.mjs` (kept in the session scratchpad, not committed — it hard-codes the historical-engine
scratch paths) prints the per-token round-trip results and the historical decode/drift table. The v2
and v3 encoders it uses are ~6-line exact ports of the originals:

- v2 (`cf373b3` `site/app.js`): `diff = {k: S[k] where S[k] !== DEFAULTS[k]}`, `_meta =
  {dataAsOf, schema:"v2", engine, model, persp}`, token = `"v2." + base64(json)`.
- v3 (`9851d50^` `site/engine.js`): same diff, plus `_meta.traffic = {mode, profileId, ioRatio,
  cacheHit}`, token = `"v3." + base64(json)`.

To re-derive the historical encoders yourself: `git show cf373b3:site/app.js` (v2, around the
`/* permalinkable scenarios (versioned) */` block) and `git show 9851d50^:site/engine.js`
(v3, `function encodeScenario`). The v4 codec bump landed in `9851d50` (preset redesign M1–M4).

## Provenance

- Minting commit: `657ab96e7a2a8579225623a1d983eb8ae7c964ba` (master, engine
  `v2.1.11-2026-07-16`, data-as-of `2026-07-15`).
- Date minted: 2026-07-16.
