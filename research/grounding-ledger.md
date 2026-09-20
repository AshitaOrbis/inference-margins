# Adopted grounding ledger — machine-generated RECONSTRUCTION

> **What this is:** every parameter the calculator's presets pin, with value, source and evidence label, generated directly from the deployed preset registry (`engine.js` v3.0.0-2026-08-13), the live roofline/data registry (`engine-data-v22.js`), and their dossier annotations — so this page cannot drift from what the calculator actually computes.
> **What this is not:** the original "192-row preset grounding pack" consultation artifact. That pack's full row set lived in conversation-sandbox files that expired; its adopted decisions are summarized in the [consultation page](https://margins.ashitaorbis.com/research/consult-preset-pack.html), and a dated author-model re-emission with delta notes is published as the [preset-pack re-audit](https://margins.ashitaorbis.com/research/consult-preset-pack-reaudit.html). Where any re-emission differs from this ledger, **this ledger (the adopted values) wins.**
> Generated 2026-07-26 · labels: DISCLOSED / CREDIBLY REPORTED / COMMUNITY ESTIMATE / SPECULATION (from the on-page dossiers).


## How to read this page

Every row is one setting the calculator pins, and the name in the first column is the engine's own
field name — the same string the MCP connector returns — so this page can be checked against the
code rather than against prose. The translation:

| you will see | it means |
|---|---|
| `active` / `total` | active and total parameters, in billions. Active is what a token actually touches; total is what has to fit in memory |
| `precision` | the number format weights and activations are served in (FP8, FP4, BF16) — it fixes how many bytes and operations each token costs |
| `priceIn` / `priceOut` | published list price per million input / output tokens |
| `cacheReadMult` / `cacheWriteShare` | what a cached input token bills, as a percentage of the fresh input price / how much traffic pays a cache-write premium |
| `nativeTraffic` | the traffic mix held fixed for this preset: input:output ratio and cache-hit share |
| `ioRatio` / `cacheHit` / `billCacheHit` | that mix, dial by dial. `billCacheHit` is the share of ALL input tokens billed as cached, not the share of cached ones |
| `hwMode` | `rent` values an accelerator-hour at a rental rate; `tco` builds it from purchase price, power, datacenter and operations |
| `rentMult` / `rentMultLeg` / `rentMultFam` | procurement: a multiplier on the registered accelerator-hour price, applied to everything, to one accelerator, or to a hardware family |
| `util` | paid-capacity utilization, in percent. It is a divisor on every cost, so paid idle time lands on the tokens actually served |
| `stackMult` | serving-stack efficiency against published open practice; 1.0 is open-source-level |
| `trendMonths` / `trendRate` | the assumed algorithmic lead in months, and the yearly efficiency rate it converts through. 0 months means no lead assumed |
| `blend` | the fleet: each accelerator's share of served tokens, summing to 100 |
| `specDec` | a speculative-decoding throughput multiplier |
| `effDec` / `effPre` | **retired legacy fields.** They are not what the live model uses. The deployed decode efficiency is `etaDec` in the calibration registry, with a stated calibration class per accelerator, and prefill uses one shared fitted value transferred to every leg. The two are far apart — the H100's retired `effDec` reads 0.07 where its deployed `etaDec` is 0.313491 — so a row quoting the retired field describes nothing the calculator computes |
| `etaDec` / `etaStatus` | the **efficiency factor (η)** for decode and the calibration class that says how it was set: fitted, borrowed, analyst-set or projection. η is the fraction of the accelerator's *active roofline limit* actually reached, and it is not MFU, which is compute-only |
| `rent` / `capex` | the registered accelerator-hour rental rate / purchase price |
| `hbm` / `bw` / `flopsFp8` / `tdp` | accelerator memory in GB, memory bandwidth in TB/s, FP8 compute, thermal design power |

**The labels in the last column grade the SOURCE of the value, not its truth**: DISCLOSED (a
party stated it), CREDIBLY REPORTED (reputable reporting or a measured benchmark), COMMUNITY
ESTIMATE (a public technical estimate with a stated method), SPECULATION (this page's own
assumption). A DISCLOSED price is a fact about a price list; a SPECULATION parameter is this
page's declared guess, and the calculator exists so you can disagree with it.

## Model presets

### Claude Opus 4.x

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 300 | Page-authored 300B scenario value. TeorTaxes's cited corpus supplies only a qualitative Fable observation ('shockingly FEW active') and a relative Opus bound; GPT-5.6 Pro's independent consult also centered on 300B — neither supplies a measured count | SPECULATION |
| `total` | 2500 | Page-adopted 2–3T planning band, scalar 2.5T (adjudicated 2026-07-24), informed by newer community estimates; the Musk Apr 2026 relative post is re-read as the prior flagship, Opus 4.6 — its 5T deduction is preserved as a labeled size case (knowledge-probe methods carry ±3× bars) | COMMUNITY ESTIMATE |
| `precision` | fp8 | Assumed frontier norm; FP8 paths standard on H100+ fleets | SPECULATION |
| `priceIn` | 5 | Anthropic price list | DISCLOSED |
| `priceOut` | 25 | Anthropic price list | DISCLOSED |
| `nativeTraffic` | Reference 15:1 / 60% (15:1 / 60%) | Calculator convention — the held-fixed scenario the normalized table uses. Not any provider's measured operating point. | calculator default |

### Claude Sonnet 5 (speculative sizes)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 120 | 4.x-era estimate; Sonnet 5's architecture is undisclosed | SPECULATION |
| `total` | 1000 | Musk post deduction (Grok = ½ Sonnet 4.x); carried over | SPECULATION |
| `precision` | fp8 | Assumed frontier norm | SPECULATION |
| `priceIn` | 2 | Anthropic pricing page — $2/$10 standing rate, permanent since 2026-08-10 (the Sep-1-2026 step to $3/$15 was cancelled) | DISCLOSED |
| `priceOut` | 10 | Anthropic pricing page — $2/$10 standing rate, permanent since 2026-08-10 (the Sep-1-2026 step to $3/$15 was cancelled) | DISCLOSED |
| `nativeTraffic` | Reference 15:1 / 60% (15:1 / 60%) | Calculator convention — the held-fixed scenario the normalized table uses. Not any provider's measured operating point. | calculator default |

### Claude Haiku 4.5 (speculative sizes)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 40 | Pure scenario value | SPECULATION |
| `total` | 350 | Pure scenario value | SPECULATION |
| `precision` | fp8 | Assumed frontier norm | SPECULATION |
| `priceIn` | 1 | Anthropic price list | DISCLOSED |
| `priceOut` | 5 | Anthropic price list | DISCLOSED |
| `nativeTraffic` | Reference 15:1 / 60% (15:1 / 60%) | Calculator convention — the held-fixed scenario the normalized table uses. Not any provider's measured operating point. | calculator default |

### GPT-5.6 Sol (speculative sizes)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 105 | Zephyr '~100B active range' + Epoch's independent inference-economics estimate (80% range 50–220B) | COMMUNITY ESTIMATE |
| `total` | 5000 | Dive central ~5T; subjective range 1–20T — effective-capacity probes allow 3–29T | SPECULATION |
| `precision` | fp8 | MXFP4 demonstrated in gpt-oss; Sol's production layers undisclosed | SPECULATION |
| `priceIn` | 4 | OpenAI API pricing (Standard short-context), read 2026-09-19: $4 (was $5) | DISCLOSED |
| `priceOut` | 20 | OpenAI API pricing, read 2026-09-19: $20 (was $30) | DISCLOSED |
| `blend` | {"h100":20,"h200":25,"gb200":45,"gb300":10} | Hopper/Blackwell across Microsoft/OCI/CoreWeave (disclosed platforms; shares guessed) | SPECULATION |
| `nativeTraffic` | OpenAI dive mix 9:1 / 78% (9:1 / 78%) | The OpenAI dive's 7 cached : 2 fresh : 1 output convention — a dive assumption, not disclosed telemetry. · ADOPTED ASSUMPTION over a reported benchmark convention: Artificial Analysis runs a 7 cached : 2 fresh : 1 output mix (that convention is CREDIBLY REPORTED). Applying it as OpenAI's SERVED traffic is this page's assumption — no OpenAI traffic telemetry is disclosed, and a benchmark convention is not a measurement of what a provider serves | SPECULATION |
| `dive.rentMult` | 0.85 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.util` | 73 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.stackMult` | 0.75 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.interact` | balanced | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.batchShare` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.discount` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |

### Gemini 3.1 Pro (speculative sizes)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 120 | Scenario midpoint (bracket 60–240B); no credible leak exists | SPECULATION |
| `total` | 3000 | Scenario midpoint (bracket 1–4T) | SPECULATION |
| `precision` | fp8 | Ironwood exposes FP8; Gemini's formats undisclosed | SPECULATION |
| `priceIn` | 2 | Gemini API pricing, ≤200K tier | DISCLOSED |
| `priceOut` | 12 | Gemini API pricing (output incl. thinking) | DISCLOSED |
| `blend` | {"tpu7":100} | TPUs serve Gemini (disclosed); simplified to Ironwood — older TPU fleets unmodeled | SPECULATION |
| `nativeTraffic` | Reference 15:1 / 60% (15:1 / 60%) | Calculator convention — the held-fixed scenario the normalized table uses. Not any provider's measured operating point. | calculator default |
| `dive.rentMult` | 0.3 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.util` | 75 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.stackMult` | 0.55 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.interact` | batch | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.batchShare` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.discount` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |

### Grok 4.5 (1.5T) (speculative sizes)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 200 | Dive central ~200B (13% activation); range 100–500B — Grok-2's lineage ran unusually dense (42.7%) | SPECULATION |
| `total` | 1500 | Musk statement, corroborated by Cursor's MoE description | DISCLOSED |
| `precision` | fp8 | Grok-2 recipe was FP8/TP8 — best public prior | SPECULATION |
| `priceIn` | 2 | xAI API pricing (launched Jul 8, 2026) | DISCLOSED |
| `priceOut` | 6 | xAI API pricing | DISCLOSED |
| `cacheReadMult` | 15 | $0.30 cached / $2.00 input = 15% (docs.x.ai/developers/models/grok-4.5, read 2026-09-02; supersedes the $0.50 = 25% launch rate) | DISCLOSED |
| `blend` | {"h100":45,"h200":5,"gb200":25,"gb300":25} | ADOPTED ASSUMPTION over a disclosure of a different quantity: the SpaceXAI prospectus discloses Colossus I/II ACCELERATOR COUNTS (that disclosure is CREDIBLY REPORTED). This field is a share of SERVED TOKENS, and accelerator counts do not establish model allocation, occupancy or delivered-token share — the 45/5/25/25 split is this page's approximation | SPECULATION |
| `nativeTraffic` | Reference 15:1 / 60% (15:1 / 60%) | Calculator convention — the held-fixed scenario the normalized table uses. Not any provider's measured operating point. | calculator default |
| `dive.rentMult` | 0.62 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.util` | 48 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.stackMult` | 1 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.interact` | batch | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.batchShare` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.discount` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.ioRatio` | 3 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.cacheHit` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |

### Kimi K2.7 Code (1T/32B)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 32 | Open checkpoint config | DISCLOSED |
| `total` | 1000 | Open checkpoint (595GB) | DISCLOSED |
| `precision` | fp8 | Released weights are INT4; hosted path undisclosed — 8-bit modeled | SPECULATION |
| `priceIn` | 0.95 | Moonshot platform pricing | DISCLOSED |
| `priceOut` | 4 | Moonshot platform pricing | DISCLOSED |
| `cacheReadMult` | 20 | $0.19/$0.95 = 20% | DISCLOSED |
| `blend` | {"h800":70,"h20":30} | Historical A800/H800 production (Mooncake); current fleet undisclosed | SPECULATION |
| `nativeTraffic` | Reference 15:1 / 60% (15:1 / 60%) | Calculator convention — the held-fixed scenario the normalized table uses. Not any provider's measured operating point. | calculator default |
| `dive.rentMult` | 1 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.util` | 60 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.stackMult` | 0.83 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.interact` | balanced | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.batchShare` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.discount` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.ioRatio` | 8 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.cacheHit` | 40 | §10 dive replay (see the provider dive in this annex) | dive assumption |

### DeepSeek V3/R1 (671B)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 37 | V3 technical report | DISCLOSED |
| `total` | 671 | V3 technical report | DISCLOSED |
| `precision` | fp8 | FP8 matmuls, BF16 attention (their disclosure) | DISCLOSED |
| `priceIn` | 0.55 | R1 price list (historical) | DISCLOSED |
| `priceOut` | 2.19 | R1 price list (historical) | DISCLOSED |
| `cacheReadMult` | 25 | $0.14 hit / $0.55 miss = 25% | DISCLOSED |
| `blend` | {"h800":100} | All service ran on 8×H800 nodes (disclosed) | DISCLOSED |
| `nativeTraffic` | DeepSeek disclosure (Feb 2025) 4:1 / 56% (4:1 / 56%) | DeepSeek's Feb 2025 production disclosure (measured). Their 56.3% is a DISK-cache-hit share; treating it as billable cached-input share is a labeled assumption. · 608B in / 168B out = 3.6:1 (slider granularity: 4) | DISCLOSED |
| `dive.rentMult` | 1.14 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.util` | 100 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.stackMult` | 1 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.interact` | batch | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.batchShare` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.discount` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |

### DeepSeek V4 Pro (1.6T/49B)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 49 | Official release + technical report | DISCLOSED |
| `total` | 1600 | Official release | DISCLOSED |
| `precision` | fp4 | Selective FP4 (routed experts + indexer; KV BF16/FP8) — modeled as fp4 where hardware supports it | DISCLOSED |
| `priceIn` | 0.66 | api-docs.deepseek.com pricing, read 2026-09-19: $0.66 off-peak / $1.32 peak (was $0.435 from the Jul 9 read) | DISCLOSED |
| `priceOut` | 1.98 | api-docs.deepseek.com pricing, read 2026-09-19: $1.98 off-peak / $3.96 peak (was $0.87) | DISCLOSED |
| `cacheReadMult` | 3.33 | $0.022 hit / $0.66 miss = 3.33% (read 2026-09-19; the prior 0.83% was $0.003625/$0.435 under the superseded tariff) | DISCLOSED |
| `blend` | {"h800":50,"h20":20,"ascend":30} | H800 stock + reported Ascend 950 involvement; split unknown | SPECULATION |
| `nativeTraffic` | DeepSeek disclosure (Feb 2025) 4:1 / 56% (4:1 / 56%) | DeepSeek's Feb 2025 production disclosure (measured). Their 56.3% is a DISK-cache-hit share; treating it as billable cached-input share is a labeled assumption. · 2025 disclosed traffic shape carried forward | SPECULATION |
| `dive.rentMult` | 0.857 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.util` | 100 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.stackMult` | 1.05 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.interact` | batch | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.batchShare` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.discount` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.blend` | {"h800":100} | §10 dive replay (see the provider dive in this annex) | dive assumption |

### DeepSeek V4-Flash (284B/13B)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 13 | Official release | DISCLOSED |
| `total` | 284 | Official release | DISCLOSED |
| `precision` | fp4 | Same selective-FP4 family as V4 Pro | DISCLOSED |
| `priceIn` | 0.15 | api-docs.deepseek.com pricing, read 2026-09-19: $0.15 off-peak / $0.30 peak (was $0.14) | DISCLOSED |
| `priceOut` | 0.6 | api-docs.deepseek.com pricing, read 2026-09-19: $0.60 off-peak / $1.20 peak (was $0.28) | DISCLOSED |
| `cacheReadMult` | 2 | $0.003 hit / $0.15 miss = 2% (read 2026-09-19; unchanged in ratio from the prior $0.0028/$0.14) | DISCLOSED |
| `blend` | {"h800":50,"h20":20,"ascend":30} | Same speculative China mix as V4 Pro | SPECULATION |
| `nativeTraffic` | DeepSeek disclosure (Feb 2025) 4:1 / 56% (4:1 / 56%) | DeepSeek's Feb 2025 production disclosure (measured). Their 56.3% is a DISK-cache-hit share; treating it as billable cached-input share is a labeled assumption. · 2025 traffic shape carried forward | SPECULATION |

### GLM 5.2 (744B/40B)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 40 | Open release | DISCLOSED |
| `total` | 744 | Open release | DISCLOSED |
| `precision` | fp8 | BF16/FP8 checkpoints; first-party serving precision undisclosed (W8A8/W4A8 recipes exist) | SPECULATION |
| `priceIn` | 1.4 | Z.ai international pricing | DISCLOSED |
| `priceOut` | 4.4 | Z.ai international pricing | DISCLOSED |
| `cacheReadMult` | 19 | $0.26/$1.40 = 19% | DISCLOSED |
| `blend` | {"ascend":40,"h800":40,"h20":20} | Nine domestic platforms named, zero shares disclosed | SPECULATION |
| `nativeTraffic` | Reference 15:1 / 60% (15:1 / 60%) | Calculator convention — the held-fixed scenario the normalized table uses. Not any provider's measured operating point. · Reference convention since 2026-09-19 — this row no longer opens on the ncode profile, whose site-authored 8:1 and @_xjdr's 81k average inputs put an 86,062-token decode context on every state; that profile is unchanged and still selectable | SPECULATION |
| `dive.rentMult` | 1.9 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.util` | 75 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.stackMult` | 0.6 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.interact` | balanced | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.batchShare` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |
| `dive.discount` | 0 | §10 dive replay (see the provider dive in this annex) | dive assumption |

### GLM-4.7 (355B/32B)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 32 | Open release | DISCLOSED |
| `total` | 355 | Open release | DISCLOSED |
| `precision` | fp8 | BF16/FP8 checkpoints; first-party serving precision undisclosed | SPECULATION |
| `priceIn` | 0.6 | Z.ai pricing | DISCLOSED |
| `priceOut` | 2.2 | Z.ai pricing | DISCLOSED |
| `cacheReadMult` | 18 | $0.11/$0.60 ≈ 18% | DISCLOSED |
| `blend` | {"ascend":40,"h800":40,"h20":20} | As GLM-5.2 — nine platforms named, shares unknown | SPECULATION |
| `nativeTraffic` | Reference 15:1 / 60% (15:1 / 60%) | Calculator convention — the held-fixed scenario the normalized table uses. Not any provider's measured operating point. · Reference convention since 2026-09-19; the inherited GLM-5.2 8:1 was never supported by GLM-4.7 telemetry and is no longer this row's default | SPECULATION |

### GPT-5.6 Terra (tariff scenario) — TARIFF SCENARIO (speculative sizes)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 50 | Scenario central from dive range 20–110B | SPECULATION |
| `total` | 1000 | Scenario central from dive range 0.25–5T | SPECULATION |
| `precision` | fp8 | Family assumption | SPECULATION |
| `priceIn` | 2 | OpenAI pricing, read 2026-09-19: $2 (was $2.50) | DISCLOSED |
| `priceOut` | 12 | OpenAI pricing, read 2026-09-19: $12 (was $15) | DISCLOSED |
| `cacheReadMult` | 10 | 90% cache discount (OpenAI standard) | DISCLOSED |
| `blend` | {"h100":20,"h200":25,"gb200":45,"gb300":10} | Sol's fleet assumption | SPECULATION |
| `nativeTraffic` | OpenAI dive mix 9:1 / 78% (9:1 / 78%) | The OpenAI dive's 7 cached : 2 fresh : 1 output convention — a dive assumption, not disclosed telemetry. · Same adopted assumption as Sol — a reported benchmark convention applied to served traffic by this page | SPECULATION |

### GPT-5.6 Luna (tariff scenario) — TARIFF SCENARIO (speculative sizes)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 20 | Scenario central from dive range 8–50B | SPECULATION |
| `total` | 250 | Scenario central from dive range 0.05–1.5T | SPECULATION |
| `precision` | fp8 | Family assumption | SPECULATION |
| `priceIn` | 0.2 | OpenAI pricing, read 2026-09-19: $0.20 (was $1 — five times the live tariff) | DISCLOSED |
| `priceOut` | 1.2 | OpenAI pricing, read 2026-09-19: $1.20 (was $6) | DISCLOSED |
| `cacheReadMult` | 10 | 90% cache discount | DISCLOSED |
| `blend` | {"h100":20,"h200":25,"gb200":45,"gb300":10} | Sol's fleet assumption | SPECULATION |
| `nativeTraffic` | OpenAI dive mix 9:1 / 78% (9:1 / 78%) | The OpenAI dive's 7 cached : 2 fresh : 1 output convention — a dive assumption, not disclosed telemetry. · Sol's adopted assumption, carried — a reported benchmark convention applied to served traffic by this page | SPECULATION |

### Gemini 3.5 Flash (tariff scenario) — TARIFF SCENARIO (speculative sizes)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 20 | Speed-based community guesses 10–16B; scenario value | SPECULATION |
| `total` | 600 | Bracketed 0.4–1.2T in the dive; 405B lower-bound applies to the PRIOR generation | SPECULATION |
| `precision` | fp8 | Unknown; FP8-equivalent assumed | SPECULATION |
| `priceIn` | 1.5 | Gemini API pricing | DISCLOSED |
| `priceOut` | 9 | Gemini API pricing (incl. thinking) | DISCLOSED |
| `cacheReadMult` | 10 | $0.15/$1.50 = 10% | DISCLOSED |
| `blend` | {"tpu7":100} | TPU (as 3.1 Pro) | SPECULATION |
| `nativeTraffic` | Reference 15:1 / 60% (15:1 / 60%) | Calculator convention — the held-fixed scenario the normalized table uses. Not any provider's measured operating point. · Default reference mix | SPECULATION |

### Custom (define with sliders)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 100 | User input (slider) | USER-SET |
| `total` | 1000 | User input (slider) | USER-SET |
| `precision` | fp8 | User input (slider) | USER-SET |
| `priceIn` | 3 | User input (slider) | USER-SET |
| `priceOut` | 15 | User input (slider) | USER-SET |
| `nativeTraffic` | Reference 15:1 / 60% (15:1 / 60%) | Calculator convention — the held-fixed scenario the normalized table uses. Not any provider's measured operating point. | calculator default |

## Perspective presets

### [lens] Central scenario (Claude)

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Hourly-rate basis — a page-assembled mixture of public and analyst-set low/committed values | SPECULATION |
| `rentMult` | 1 | Exactly 1.0× the heterogeneous registered planning vector | SPECULATION |
| `util` | 50 | Page-set 30–60% sensitivity band, middle | SPECULATION |
| `stackMult` | 1 | Open-source-best (SGLang-class) = 1.0 by construction | COMMUNITY ESTIMATE |
| `interact` | balanced | Balanced latency — neither batch-farm nor premium-interactive | SPECULATION |
| `batchShare` | 15 | Modest batch-tier adoption | SPECULATION |
| `discount` | 5 | Light enterprise discounting | SPECULATION |

### [replay] §10 dive (this model)

_Sets nothing — replays the model's own §10 dive fields (see each model's `dive.*` rows)._

### [analyst route · SemiAnalysis / Dylan Patel] ≥90% · owned-TCO estate route

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | tco | Page-chosen owned-TCO basis — hourly cost built from capex, power, datacenter and opex | SPECULATION |
| `kwh` | 0.07 | Historical $0.07/kWh pin retained when the generic default moved to the EIA US-industrial midpoint on 2026-08-22 | SPECULATION |
| `dcPerW` | 12 | im-arc T4 fold historical pin: the pre-fold $12/W datacenter capex, retained so this archived reading reproduces after the generic default moved to $12.5/W on 2026-08-24 | SPECULATION |
| `dcLifeYears` | 12 | im-arc T4 fold historical pin: the pre-fold 12-year facility life, retained after that literal became the named default dcLifeYears at 15 years on 2026-08-24 | SPECULATION |
| `capexScopeMode` | legacy-global | im-arc T4 fold historical pin: the pre-fold global cluster-overhead semantics (1.30 on every row), retained after the overhead became capex-scope-derived on 2026-08-24 | SPECULATION |
| `capitalRecovery` | off | im-arc T4 fold historical pin: capital recovery was absent from the engine when this reading was archived; it is stated off so the reading cannot drift if the canonical default ever moves | SPECULATION |
| `capexAbsLeg` | {"h100":25000,"h200":32000,"gb200":45000,"gb300":55000,"h800":40000,"h20":20000,"tpu7":35000,"trn2":15000,"trn3":20000,"ascend":23000} | im-arc T4 fold historical pin: the pre-fold registered capex points for all ten donors, retained after four of them moved onto dated analyst spans on 2026-08-24 | SPECULATION |
| `rentRegistryPin` | {"h100":2.4,"h200":2.9,"gb200":4.5,"gb300":6,"h800":1.75,"h20":1,"tpu7":5.4,"trn2":2.235,"trn3":2.2,"ascend":1.95} | im-arc T4 fold historical pin: the pre-fold REGISTERED planning-rent vector for all ten donors — pinned below the reader controls so this route’s own multipliers still apply — retained after two middles moved and three rows lost their default to the unavailable-rate path on 2026-08-24 | SPECULATION |
| `util` | 55 | Page-set 55% occupancy scenario value | SPECULATION |
| `stackMult` | 1.1 | Page-set 1.1× serving-stack scenario value | SPECULATION |
| `interact` | balanced | Central-scenario balanced latency | SPECULATION |
| `batchShare` | 15 | Central-scenario 15% batch-tier share | SPECULATION |
| `discount` | 5 | Central-scenario 5% blended discount | SPECULATION |

### [analyst route · TeorTaxes] 80–90% · 1.0× planning-rate vector, aggressive stack, throughput

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Page-set hourly-rate basis using the heterogeneous registered vector | SPECULATION |
| `rentMult` | 1 | Page-set 1.0× planning-vector multiplier | SPECULATION |
| `util` | 70 | Page-set 70% fleet-utilization scenario value | SPECULATION |
| `stackMult` | 1.25 | Page-set 1.25× serving-stack scenario value | SPECULATION |
| `interact` | batch | Page-set throughput-first serving | SPECULATION |
| `batchShare` | 10 | Page-set 10% batch-price share | SPECULATION |
| `discount` | 0 | Page-set 0% negotiated discount | SPECULATION |

### [analyst route · Zephyr] 80–90% · 0.9× planning-rate vector, above-baseline stack

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Page-set hourly-rate basis using the heterogeneous registered vector | SPECULATION |
| `rentMult` | 0.9 | Page-set 0.90× planning-vector multiplier | SPECULATION |
| `util` | 65 | Page-set 65% occupancy scenario value | SPECULATION |
| `stackMult` | 1.15 | Page-set 1.15× serving-stack scenario value | SPECULATION |
| `interact` | batch | Page-set throughput-first serving | SPECULATION |
| `batchShare` | 10 | Page-set 10% batch-price share | SPECULATION |
| `discount` | 0 | Page-set 0% negotiated discount | SPECULATION |

### [analyst route · FleetingBits] <60% · reported-margin inverse diagnostic

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Page-chosen hourly-rate stress basis to test the reported figures | SPECULATION |
| `rentMult` | 1.6 | Page-set 1.6× stress multiplier on the heterogeneous registered vector, inspired by public cloud-markup ranges but not a matched market basket | SPECULATION |
| `util` | 35 | Page-set 35% (peak-provisioning story) | SPECULATION |
| `stackMult` | 0.85 | Page-set 0.85× scenario value | SPECULATION |
| `interact` | balanced | Page-set balanced mode | SPECULATION |
| `batchShare` | 25 | Page-set 25% scenario value | SPECULATION |
| `discount` | 20 | Page-set 20% (enterprise discounting is real, the level is page-chosen) | SPECULATION |

### [analyst route · TeorTaxes] 90–95% · the batch mechanism, applied alone

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | tco | Page-chosen owned-TCO basis, inherited unchanged from the ≥90% route | SPECULATION |
| `kwh` | 0.07 | Historical $0.07/kWh pin inherited from the ≥90% route when the generic default moved on 2026-08-22 | SPECULATION |
| `dcPerW` | 12 | im-arc T4 fold historical pin inherited from the ≥90% route: the pre-fold $12/W datacenter capex | SPECULATION |
| `dcLifeYears` | 12 | im-arc T4 fold historical pin inherited from the ≥90% route: the pre-fold 12-year facility life | SPECULATION |
| `capexScopeMode` | legacy-global | im-arc T4 fold historical pin inherited from the ≥90% route: the pre-fold global cluster-overhead semantics (1.30 on every row) | SPECULATION |
| `capitalRecovery` | off | im-arc T4 fold historical pin inherited from the ≥90% route: capital recovery was absent when this reading was archived and is stated off | SPECULATION |
| `capexAbsLeg` | {"h100":25000,"h200":32000,"gb200":45000,"gb300":55000,"h800":40000,"h20":20000,"tpu7":35000,"trn2":15000,"trn3":20000,"ascend":23000} | im-arc T4 fold historical pin inherited from the ≥90% route: the pre-fold registered capex points for all ten donors | SPECULATION |
| `rentRegistryPin` | {"h100":2.4,"h200":2.9,"gb200":4.5,"gb300":6,"h800":1.75,"h20":1,"tpu7":5.4,"trn2":2.235,"trn3":2.2,"ascend":1.95} | im-arc T4 fold historical pin inherited from the ≥90% route: the pre-fold REGISTERED planning-rent vector for all ten donors | SPECULATION |
| `util` | 55 | Page-set 55% occupancy, inherited unchanged — deliberately NOT raised, so the batch lever is measured alone | SPECULATION |
| `stackMult` | 1.1 | Page-set 1.1× serving-stack value, inherited unchanged | SPECULATION |
| `interact` | batch | THE CLAIM'S OWN LEVER: the throughput serving regime — this engine's reading of 'increase the batch size, have the same speed' | SPECULATION |
| `batchShare` | 15 | Central-scenario 15% batch-tier share, inherited unchanged | SPECULATION |
| `discount` | 5 | Central-scenario 5% blended discount, inherited unchanged | SPECULATION |

### [lens] Strategic-partner fleet (GPT-5.6 Pro)

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Rental frame at strategic rates | SPECULATION |
| `rentMult` | 0.7 | Site applies SemiAnalysis's ~$1.60/TPU-hour estimate (Nov 2025 analysis of the 600k GCP-rented TPU tranche, inclusive of Google's margin — an estimate, not a disclosed contract price) as a 0.7x scalar across the modeled heterogeneous fleet | SPECULATION derived from CREDIBLY REPORTED |
| `util` | 70 | Its 75% occupancy central (70 used here) | SPECULATION |
| `stackMult` | 1 | Mature-lab stack ≈ OSS-best | SPECULATION |
| `interact` | batch | Throughput-oriented economic-marginal frame | SPECULATION |
| `batchShare` | 0 | Not separately modeled by the dive | SPECULATION |
| `discount` | 0 | List-price frame | SPECULATION |
| `blend` | {"tpu7":40,"gb300":25,"gb200":15,"trn2":15,"h200":5} | Its stated 40/25/15/15/5 TPU-heavy fleet | SPECULATION |

### [estimate · archived] Strategic/owned expectation (GPT-5.6 Pro, contextual)

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Rental frame at strategic/owned-opportunity rates | SPECULATION |
| `rentMult` | 1 | 1.0 global — this reading carries its posture PER FAMILY instead, so no fleet-wide scalar is asserted | SPECULATION |
| `rentMultLeg` | {"h100":0.95,"h200":0.95,"gb200":0.95,"gb300":0.95,"h800":0.95,"h20":0.95,"tpu7":0.5,"trn2":0.85,"trn3":0.85} | Its own per-family fallback midpoints: NVIDIA 0.95x (declared range 0.90-1.00), TPU 0.50x (0.30-0.70), Trainium 0.85x (0.70-1.00) at zero headline weight. Every one is the midpoint of a range it declined to collapse, labeled by its author as a rendering convenience and explicitly not to be tuned toward a target margin | SPECULATION (range midpoints, NOT pinned values) |
| `util` | 65 | Its stated 65% utilization midpoint over a 50-80% band — its analyst judgment, not a source | SPECULATION |
| `stackMult` | 1 | Open-source-best baseline; no generalized speculative-decoding credit taken | SPECULATION |
| `interact` | balanced | Balanced latency | SPECULATION |
| `batchShare` | 0 | List-only billing — the review's explicit instruction for a published-tariff headline | SPECULATION |
| `discount` | 0 | List-only billing — no negotiated discount | SPECULATION |
| `blend` | {"h100":5,"h200":10,"gb200":25,"gb300":20,"tpu7":40} | Its fallback renderer midpoint (NVIDIA 60 / TPU 40 / Trainium 0) inside declared family constraints of 50-65% NVIDIA, 35-50% TPU, 0-15% Trainium; Trainium EXCLUDED from the point pending the form repair. The author labels the point itself as not publicly identified | SPECULATION (family constraints, midpoint rendering) |
| `dialRanges` | {"util":{"lo":50,"mid":65,"hi":80},"cacheHit":{"lo":40,"mid":60,"hi":80},"rentMultFam.nvidia":{"lo":0.9,"mid":0.95,"hi":1},"rentMultFam.tpu":{"lo":0.3,"mid":0.5,"hi":0.7},"rentMultFam.trainium":{"lo":0.7,"mid":0.85,"hi":1},"blend.fam.nvidia":{"lo":50,"hi":65},"blend.fam.tpu":{"lo":35,"hi":50},"blend.fam.trainium":{"lo":0,"hi":15}} | The five dials this loadable vector declares as RANGES rather than points, in its own numbers: occupancy 50-80 (stated midpoint 65), effective compute-side cache reuse 40-80 (value 60), and procurement per family — NVIDIA 0.90-1.00, TPU 0.30-0.70 ('where the economic-regime disagreement is concentrated'), Trainium 0.70-1.00 at zero headline weight. The middle of each is its stated MEDIAN, not a computed mean, and the ends are the author's, not this page's: it wrote 'this is deliberately range-valued where the public record does not identify a point' and asked that the midpoints not be tuned until the target margin appears. Its other declared ranges are NOT carried, because this engine has no dial that means them: billable cache share (core 40-60), cost of serving a hit (2-15), cache write share (0-10) and the eligible-leg speculative-decode credit (1.00-1.10) each name a control this page either normalizes or gate-blocks, and rendering them on a neighbouring dial would misattribute the claim | DECLARED RANGES (author's own, median-parameterised) |

### [estimate · archived] Per-leg strategic posture (Fable 5, independent)

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Rental frame at per-leg strategic rates | SPECULATION |
| `rentMult` | 1 | 1.0 global — the posture is carried per leg, not by a fleet-wide scalar | SPECULATION |
| `rentMultLeg` | {"h100":1,"h200":1,"gb200":1,"gb300":1,"tpu7":0.3,"trn2":0.7,"trn3":0.7} | Its declared per-leg posture: TPU x0.30 (the strategic TPU rate this page already registers, applied to that leg alone), Trainium x0.70, and every NVIDIA leg left explicitly UNDISCOUNTED at 1.0 — a discount it declined to claim | SPECULATION derived from CREDIBLY REPORTED |
| `util` | 60 | Its declared 60% utilization (band 50-70), held deliberately unmoved rather than raised to preserve altitude where the lead is withdrawn | SPECULATION |
| `stackMult` | 1 | Open-source-best baseline; its declared efficiency credit rides beside the vector, not inside a dial | SPECULATION |
| `interact` | balanced | Balanced latency | SPECULATION |
| `batchShare` | 15 | This page's illustrative billing mix, kept deliberately so its number is comparable to the published reading | SPECULATION |
| `discount` | 5 | This page's illustrative billing mix (5%) | SPECULATION |
| `dialRanges` | {"util":{"lo":50,"mid":60,"hi":70}} | The ONE axis of its band assembly its author stated in numbers: utilization 50-70 around a stated 60. Its other two band axes are deliberately NOT rendered — 'rates half-to-full-strategic' is a qualitative phrase this page will not convert into an adjudicator's numbers on their behalf, and the lead axis ('0-to-+3-not-stacked') is one this author explicitly instructs must not be switched on to reach its headline, because the serving-stack credit it took instead already covers part of the same mechanism. The band a reader sees here is therefore narrower than its author's stated 70-84, and the preset note says so rather than letting the narrower band pass as the whole claim | DECLARED RANGE (one axis; the other two are stated qualitatively and left unrendered) |

### [stress case] Planning baseline — no assumed efficiency lead

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Rental frame on the registered heterogeneous planning vector | SPECULATION |
| `rentMult` | 1 | 1.0x — no procurement judgment applied | SPECULATION |
| `util` | 50 | 50% — the page's unmoved occupancy value | SPECULATION |
| `stackMult` | 1 | Open-source-best = 1.0 by construction | COMMUNITY ESTIMATE |
| `interact` | balanced | Balanced latency | SPECULATION |
| `batchShare` | 15 | The page's illustrative billing mix (15%) — note the only public figure anyone has for batch adoption is a surveyed ~4%, which is a labeled scenario anchor and not a provider disclosure | SPECULATION |
| `discount` | 5 | The page's illustrative billing mix (5%) | SPECULATION |

### [estimate · page-open default] Strategic/owned expectation (GPT-5.6 Pro, contextual)

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Rent — 'a strategic-contract rental lens, not an owned-TCO construction' | DECLARED (author's own) |
| `rentMult` | 1 | 1.0 global, held as a POINT on purpose: 'procurement uncertainty is carried by the leg ranges, so a global range would add a second copy of the same uncertainty' | DECLARED (author's own) |
| `rentMultLeg` | {"h100":0.95,"h200":0.95,"gb200":0.95,"gb300":0.95,"h800":0.95,"h20":0.95,"tpu7":0.5,"trn2":0.85,"trn3":0.85} | The procurement structure: a FAMILY ranges moved onto the legs that actually price, medians unchanged (NVIDIA legs 0.95, TPU v7 0.50, Trainium 0.85), with every family multiplier pinned at 1.0 so a family discount and a leg discount can never multiply into two copies of one claim | DECLARED (author's own) |
| `util` | 65 | 65 % median — 'no representative Anthropic occupancy telemetry identifies a narrower distribution' | DECLARED (author's own) |
| `stackMult` | 1 | 1.0 — the same published-open-practice referent as trendMonths = 0, so the residual private-stack claim is carried by the lead dial ALONE | DECLARED (author's own) |
| `interact` | balanced | Balanced — its author's stated reason for holding it as a point is that throughput-first and low-latency are discrete scenario branches, not ordered quantiles with a defensible median | DECLARED (author's own) |
| `batchShare` | 0 | 0 % — the headline is explicitly AT LIST, so no discounted batch mix is assumed | DECLARED (author's own) |
| `discount` | 0 | 0 % — at list, for the same stated reason as batchShare | DECLARED (author's own) |
| `blend` | {"h100":5,"h200":10,"gb200":25,"gb300":20,"tpu7":40} | h100 5 / h200 10 / gb200 25 / gb300 20 / tpu7 40, held as a POINT and the uncertainty LOGGED rather than faked: its author declines to invent independent scalar bands for a compositional variable whose shares must sum to 100 % | DECLARED (author's own); its uncertainty is a logged calculator gap, not a hidden assumption |
| `dialRanges` | {"trendMonths":{"lo":0,"mid":2,"hi":4},"util":{"lo":50,"mid":65,"hi":80},"cacheHit":{"lo":40,"mid":60,"hi":80},"billCacheHit":{"lo":40,"mid":60,"hi":80},"cacheCost":{"lo":2,"mid":5,"hi":15},"cacheWriteShare":{"lo":0,"mid":0,"hi":10},"rentMultFam.nvidia":{"lo":0.9,"mid":0.95,"hi":1},"rentMultLeg.tpu7":{"lo":0.3,"mid":0.5,"hi":0.7},"rentMultLeg.trn2":{"lo":0.7,"mid":0.85,"hi":1},"rentMultLeg.trn3":{"lo":0.7,"mid":0.85,"hi":1},"blend.fam.nvidia":{"lo":50,"hi":65},"blend.fam.tpu":{"lo":35,"hi":50},"blend.fam.trainium":{"lo":0,"hi":15,"split":{"trn2":1,"trn3":0}}} | FIFTEEN declared three-point ranges, all author-stated. Three of them are dials this page had never carried — billCacheHit (previously left implicitly equal to serving reuse), cacheCost (previously a point with a verbal core range), and a deliberately ONE-SIDED cacheWriteShare 0/0/10. The lead axis moves off zero to 0/2/4. The procurement widths are family widths re-expressed per leg. What is NOT here is as declared as what is: precision, interactivity and hardware basis stay points because they are categorical scenario branches, and the fleet blend stays a point because the calculator has no compositional range that preserves a 100 % simplex — both logged as gaps rather than coerced into false quantiles | DECLARED RANGE (fifteen axes, all author-stated; three of them dials this page had never carried) |

### [estimate] Per-leg strategic posture (Fable 5, independent)

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Rental frame at per-leg strategic rates | DECLARED (author's own) |
| `rentMult` | 1 | 1.0 global — its own words: 'the posture is per leg, never a fleet-wide scalar' | DECLARED (author's own) |
| `rentMultLeg` | {"h100":1,"h200":1,"gb200":1,"gb300":1,"tpu7":0.3,"trn2":0.7,"trn3":0.7} | Its per-leg posture, central values declared by their author: TPU x0.30 (the strategic TPU rate this page already registers, applied to that leg alone), Trainium x0.70, every NVIDIA leg UNDISCOUNTED at 1.0 — the declined NVIDIA discount stands, and it is pinned as a zero-width range rather than left in prose | DECLARED (author's own); the TPU rate itself is CREDIBLY REPORTED and registered by this page |
| `util` | 60 | Its declared 60% utilization — its own words: 'no altitude bought back through occupancy' | DECLARED (author's own) |
| `stackMult` | 1 | Open-source-best baseline, held at 1.0 at EVERY point of the band — the same referent as the lead slider's zero, kept there deliberately so the serving-stack mechanism is counted exactly once now that the credit lives inside the lead dial | DECLARED (author's own) |
| `interact` | balanced | Balanced latency, declared by its author | DECLARED (author's own) |
| `batchShare` | 15 | This page's illustrative billing mix (15%) — not the author's number but its author's explicit CHOICE to adopt it, kept so this reading stays comparable with its author's own published one | DECLARED (author adopted this page's illustrative mix, and said why) |
| `discount` | 5 | This page's illustrative billing mix (5%) — adopted on the same stated ground as batchShare | DECLARED (author adopted this page's illustrative mix, and said why) |
| `dialRanges` | {"util":{"lo":50,"mid":60,"hi":70},"trendMonths":{"lo":0,"mid":1,"hi":2},"rentMultLeg.tpu7":{"lo":0.3,"mid":0.3,"hi":0.65},"rentMultLeg.trn2":{"lo":0.7,"mid":0.7,"hi":0.85},"rentMultLeg.trn3":{"lo":0.7,"mid":0.7,"hi":0.85},"rentMultLeg.h100":{"lo":1,"mid":1,"hi":1},"rentMultLeg.h200":{"lo":1,"mid":1,"hi":1},"rentMultLeg.gb200":{"lo":1,"mid":1,"hi":1},"rentMultLeg.gb300":{"lo":1,"mid":1,"hi":1},"blend.fam.nvidia":{"lo":35,"hi":65},"blend.fam.tpu":{"lo":15,"hi":40},"blend.fam.trainium":{"lo":5,"hi":35}} | NINE declared three-point ranges, and every one of them is its author's own number rather than this page's reading of its prose. The two axes this page previously refused to render — 'rates half-to-full-strategic' and the lead axis '0-to-+3-not-stacked' — were returned as numbers by their author: the rates axis as per-leg ranges (TPU 0.30-0.65 around a degenerate 0.30 low, because 0.30 IS its full-strategic floor and it claims nothing cheaper), and the lead axis as 0/1/2. The lead HI is anchored to the OpenAI 2026-07-29 first-party '-20% end-to-end serving costs' datapoint (2.437 months at the ratified 3x/yr) and then integer-FLOORED to 2 rather than rounded, its author's stated reason being that the evidence is OpenAI's while this page's subject is Anthropic. The four NVIDIA legs carry deliberately zero-width ranges: a pinned claim of no discount, not an absent one | DECLARED RANGE (nine axes, all author-stated; the two formerly-verbal axes are now numbers) |

### [valuation replay] xAI cash-marginal (dive operating point)

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Rental frame carrying the cash rate | SPECULATION |
| `rentMult` | 0.156 | $0.60 ÷ the Colossus blend's $3.85 weighted rate = 0.156 | SPECULATION |
| `util` | 48 | Held at the dive's operating point — only the valuation changes across the three xAI lenses | SPECULATION |
| `stackMult` | 1 | Dive operating point | SPECULATION |
| `interact` | batch | Dive operating point | SPECULATION |
| `batchShare` | 0 | List-price frame | SPECULATION |
| `discount` | 0 | List-price frame | SPECULATION |
| `ioRatio` | 3 | The dive's 3:1 uncached workload — held fixed across all three xAI lenses | SPECULATION |
| `cacheHit` | 0 | Dive workload (uncached) | SPECULATION |

### [valuation replay] xAI opportunity-cost (Anthropic contract)

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Rental frame carrying the contract rate | SPECULATION |
| `rentMult` | 1.37 | $5.27 ÷ $3.85 blend rate = 1.37 | DISCLOSED (rate); SPECULATION (application) |
| `util` | 48 | Held at the dive's operating point | SPECULATION |
| `stackMult` | 1 | Dive operating point | SPECULATION |
| `interact` | batch | Dive operating point | SPECULATION |
| `batchShare` | 0 | List-price frame | SPECULATION |
| `discount` | 0 | List-price frame | SPECULATION |
| `ioRatio` | 3 | The dive's 3:1 uncached workload — held fixed across all three xAI lenses | SPECULATION |
| `cacheHit` | 0 | Dive workload (uncached) | SPECULATION |

### [lens] China public-cloud on-demand (Jul 2026)

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Rental (public rate cards) | DISCLOSED |
| `rentMult` | 6.15 | Grounding-pack computation vs IDC defaults: H20 6.24×, H800 6.07×, 910C-proxy 6.15× (rate cards DISCLOSED; the blend into one multiplier is analytic) | DISCLOSED (rates); SPECULATION (blend) |
| `util` | 35 | Enterprise on-demand occupancy per the grounding pack (~35%) | SPECULATION |
| `stackMult` | 1 | OSS baseline | SPECULATION |
| `interact` | balanced | Balanced | SPECULATION |
| `batchShare` | 0 | None | SPECULATION |
| `discount` | 0 | None | SPECULATION |

### [source-informed scenario] Ant Group H20 (NOT Anthropic — Ant Group)

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Rental at the page's H20 IDC rate | SPECULATION |
| `rentMult` | 1 | 1.0 — Ant's own cost basis is undisclosed | SPECULATION |
| `util` | 100 | 100 = per-occupied-chip convention; Ant's own utilization is undisclosed | SPECULATION (convention) |
| `stackMult` | 1 | 1.0 = the page's source-informed neutral H20 coefficient, not an anchor fit | SPECULATION |
| `interact` | batch | Page-authored throughput-mode batch rule; no TTFT/TPOT constraint is enforced | SPECULATION |
| `batchShare` | 0 | Not applicable | SPECULATION |
| `discount` | 0 | Not applicable | SPECULATION |
| `blend` | {"h20":100} | H20-only, matching the published accelerator family | DISCLOSED (family only) |

### [replay] DeepSeek disclosure (Feb 2025)

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Their stated leasing-cost frame | DISCLOSED |
| `rentMult` | 1.14 | $2/hr ÷ current IDC $1.75 = 1.14× | DISCLOSED (assumption in source) |
| `util` | 100 | 100% — disclosed throughputs are averages over deployed nodes; a divisor would double-count idle time | DISCLOSED (derived) |
| `stackMult` | 1 | Their stack = the calibration baseline | DISCLOSED |
| `interact` | batch | Throughput-first production serving | DISCLOSED |
| `batchShare` | 0 | Not applicable in their billing | DISCLOSED |
| `discount` | 0 | Theoretical list billing (their own caveat: realized was lower) | DISCLOSED |
| `blend` | {"h800":100} | All-H800 (disclosed) | DISCLOSED |

## Traffic-mix profiles (v2.1.2 axis)

| profile | I/O | cache hit | provenance |
|---|---|---|---|
| Reference 15:1 / 60% | 15:1 | 60% | Calculator convention — the held-fixed scenario the normalized table uses. Not any provider's measured operating point. |
| OpenAI dive mix 9:1 / 78% | 9:1 | 78% | The OpenAI dive's 7 cached : 2 fresh : 1 output convention — a dive assumption, not disclosed telemetry. |
| DeepSeek disclosure (Feb 2025) 4:1 / 56% | 4:1 | 56% | DeepSeek's Feb 2025 production disclosure (measured). Their 56.3% is a DISK-cache-hit share; treating it as billable cached-input share is a labeled assumption. |
| ncode-informed scenario 8:1 / 41% | 8:1 | 41% | The 41% cache-hit rate and 81k-token average inputs are @_xjdr's free-week observations; the 8:1 input:output ratio is a site-authored Zhipu-dive assumption (the cited posts report no output-length or I/O split). One event informing a scenario, not a generic 'coding' archetype. |
| Kimi dive mix 8:1 / 40% | 8:1 | 40% | The Moonshot dive's Mooncake-like convention — a dive assumption the dive itself declined to firm up. |
| Uncached 3:1 / 0% | 3:1 | 0% | The xAI dive's operating convention: output-heavy traffic, no billed prefix cache. |

## Hardware table (per-platform adopted values)

The numerical roofline path reads `HW_ROOFLINE`, `CALIBRATION`, and `PREFILL_CAL`; the retired `HW.*.effDec/effPre` compatibility fields are deliberately absent.

| platform | parameter | adopted value | provenance / status |
|---|---|---|---|
| H100 SXM | `flops.bf16` | 990000000000000 FLOP/s | published — 989 TF dense BF16 (NVIDIA datasheet); equals fp8/2, consistent with fallback rule C10 |
| H100 SXM | `flops.fp8` | 1980000000000000 FLOP/s | published — 1,979 TF dense FP8 (NVIDIA datasheet; = engine.js flopsFp8 1.98 carried) |
| H100 SXM | `hbmBytes` | 85520809984 B (85.521 decimal GB) | observed framebuffer — nvidia-smi total 81,559 MiB × 2^20 = 85,520,809,984 B for 'NVIDIA H100 80GB HBM3' (verified 2026-07-18 across 6+ independent pasted outputs: scaleway.com MIG guide, github.com/wilicc/gpu-burn#114, docs.databricks.com H100 starter, support.crusoecloud.com, github.com/ray-project/ray#53266). The '80 GB' label × 1e9 undercounts this by ~6.9% (R5 finding). |
| H100 SXM | `bwHBM` | 3350000000000 B/s | published — H100 SXM HBM3 3.35 TB/s (NVIDIA datasheet; = engine.js bw 3.35 in SI B/s) |
| H100 SXM | `fabric` | 900000000000 B/s | published — NVIDIA H100 datasheet: NVLink (4th gen) 900 GB/s aggregate bidirectional per GPU (nvidia.com/en-us/data-center/h100, verified 2026-07-18). Same convention as the frozen h800 400e9 (the export-capped variant of this same fabric). |
| H100 SXM | `nShard` | 144 | N_shard; analyst-declared strong topology carry — 144, copied from the sourced DeepSeek H800 EP144/DP144 decode deployment unit. H100 and H800 have identical registered compute, HBM bandwidth, and framebuffer capacity; their fabric difference does not enter MoE feasibility, and N_shard does not enter MoE decode throughput. No H100-specific EP144 deployment receipt exists: this is a physically coherent same-capacity deployment scenario, not an observed H100 width. |
| H100 SXM | `etaDec` | 0.313491 | FITTED-inherited (h800 fit; 'H800-class compute', memo §2); evidence=fitted-inherited; inherits h800's deployed η; reproduces h100's current deployed 1,872.9730 tok/s exactly (identical FLOPS/HBM constants; binding t_H unaffected by the h100/h800 fabric difference — shown in the derivations file) |
| H100 SXM | `decodeTrafficBasis` | active-parameter-surrogate | paired eta representation=active-parameter-surrogate; nPhysDeclared=144; sources=inherits CALIBRATION.h800 (FITTED-inherited; memo §2) |
| H100 SXM | `etaPre` | 0.17581 | extrapolated (single-anchor transfer); frozen F7 identity fit: η_pre = 0.17581 (H800 fresh-prefill reconstruction ~4,026 tok/s/GPU at L_in = 4,989, FP8; d2 §3.1-§3.2). EVERY row's prefill leg computes the frozen E2 roofline with this single value (memo §8 universal-transfer rule). Prefill never carries a measured basis (IM5-5 boundary; no two-sided prefill evidence exists — BLOCK-2 item 9). |
| H100 SXM | `rent` | $2.4/hr | price evidence=analyst-set; economic basis note below |
| H100 SXM | `capex` | $23750 | engine.js HW economic input; economic basis note below |
| H100 SXM | `tdp` | 0.7 kW | engine.js HW economic input; economic basis note below |
| H100 SXM | `economicBasisNote` | — | 2022. Anchor: DeepSeek served V3/R1 on H800 (H100-class compute). Prefill MFU is reconstructed FRESH-only (the disclosed 73.7k/node input flow includes the 56.3% disk-cache-hit share). |
| H200 | `flops.bf16` | 990000000000000 FLOP/s | published — 989 TF dense BF16 (H200 datasheet); = fp8/2 (C10-consistent) |
| H200 | `flops.fp8` | 1980000000000000 FLOP/s | published — 1,979 TF dense FP8, same Hopper compute as H100 (= engine.js flopsFp8 1.98) |
| H200 | `hbmBytes` | 150754820096 B (150.755 decimal GB) | observed framebuffer — nvidia-smi total 143,771 MiB × 2^20 = 150,754,820,096 B for 'NVIDIA H200' (verified 2026-07-18, 5+ independent pasted outputs: github.com/NVIDIA/cuda-samples#311, forums.developer.nvidia.com peermem thread, github.com/axolotl-ai-cloud/axolotl#2688, userguide.ncshare.org, github.com/NVIDIA/cccl#1672). Note the '141 GB' label reads as ~GiB: observed FB ≈ 150.75e9 B. |
| H200 | `bwHBM` | 4800000000000 B/s | published — H200 HBM3e 4.8 TB/s (NVIDIA datasheet; = engine.js bw 4.80) |
| H200 | `fabric` | 900000000000 B/s | published — NVIDIA H200 datasheet: NVLink 900 GB/s (4th gen, SXM; PNY-hosted NVIDIA H200 NVL/SXM datasheet, verified 2026-07-18) |
| H200 | `nShard` | 144 | N_shard; analyst-declared weak topology transfer — 144, copied from the sourced DeepSeek H800 EP144/DP144 decode deployment unit. H200 has the same registered compute but 1.76× the framebuffer and higher HBM bandwidth; DeepSeek states large EP is chosen partly to enlarge aggregate/per-expert batch, so EP144 remains plausible, but the added memory also permits a rational narrower deployment. No H200-specific width receipt exists. This topology assumption is independent of, and stacked with, the separate H800-η family transfer; η inheritance is not evidence for N_shard. |
| H200 | `etaDec` | 0.313491 | family-transfer (in-family extrapolation off the H800/H100-class fit — tier-(b), memo §1; NOT in the joint-η bucket); evidence=family-transfer; h800's deployed η applied to h200 hardware constants (memo §1/§2). NOT tuned to reproduce the current hand-set effDec 0.085: at F1-op-point conditions the roofline gives ≈2,683.7 tok/s vs the current 2,274.3 (+18.0%) — an EXPECTED family-transfer movement, deltas tabulated at slice 2/3 (derivations file, finding 4) |
| H200 | `decodeTrafficBasis` | active-parameter-surrogate | paired eta representation=active-parameter-surrogate; nPhysDeclared=144; sources=family-transfer off CALIBRATION.h800 (memo §1; derivations finding 4) |
| H200 | `etaPre` | 0.17581 | extrapolated (single-anchor transfer); frozen F7 identity fit: η_pre = 0.17581 (H800 fresh-prefill reconstruction ~4,026 tok/s/GPU at L_in = 4,989, FP8; d2 §3.1-§3.2). EVERY row's prefill leg computes the frozen E2 roofline with this single value (memo §8 universal-transfer rule). Prefill never carries a measured basis (IM5-5 boundary; no two-sided prefill evidence exists — BLOCK-2 item 9). |
| H200 | `rent` | $3.68/hr | price evidence=analyst-set; economic basis note below |
| H200 | `capex` | $36000 | engine.js HW economic input; economic basis note below |
| H200 | `tdp` | 0.7 kW | engine.js HW economic input; economic basis note below |
| H200 | `economicBasisNote` | — | Same compute as H100, 1.76× HBM capacity/1.4× bandwidth → better batching. |
| GB200 NVL72 | `flops.bf16` | 2500000000000000 FLOP/s | C10 fallback — fp8/2 = 2.5 PF dense; consistent with NVIDIA's published precision ladder |
| GB200 NVL72 | `flops.fp8` | 5000000000000000 FLOP/s | published — 5.0 PF dense FP8 per GPU (engine.js HW note: NVIDIA sparse/dense split verified; the widely-copied 4.5 PF is B200's) |
| GB200 NVL72 | `flops.fp4` | 10000000000000000 FLOP/s | frozen — 10 PF dense NVFP4 (d2 §3.1 F4 recipe FLOPS=10e15 / roofline-diagnostic GB200 case; = 2× dense FP8 per NVIDIA ladder) |
| GB200 NVL72 | `hbmBytes` | 198674743296 B (198.675 decimal GB) | observed framebuffer — nvidia-smi total 189,471 MiB × 2^20 = 198,674,743,296 B for 'NVIDIA GB200' per GPU (verified 2026-07-18: docs.nvidia.com NIM openfold3 arm64 prerequisites, support.crusoecloud.com NVBandwidth-on-GB200 guide, github.com/sgl-project/sglang#8911 and #7504). Distinct from standalone B200 180 GB; ≈185 GiB per GPU, the 186-GB-class B200-in-GB200 part. |
| GB200 NVL72 | `bwHBM` | 8000000000000 B/s | published — 8 TB/s HBM3e per GPU (frozen F4 recipe hbmBps 8.0e12; = engine.js bw 8.00) |
| GB200 NVL72 | `fabric` | 1800000000000 B/s | frozen — NVLink5 1.8 TB/s per GPU (d2 §3.1 F4 recipe / roofline-diagnostic.mjs GB200 case; memo §6 known value) |
| GB200 NVL72 | `nShard` | 8 | N_shard; declared analyst default (unchanged from the pre-existing engine value), precision-conditioned — multiple Class C/D anchors support 8 as a genuinely deployed low-precision replica width, but per the 2026-07-20 GPT Pro evidence consult, the public record does not establish a specific required or minimum replica width for a multi-trillion-parameter closed-weight model at unknown precision (the actual Opus/5T scenario this engine models); see the declared-sensitivity case list on this row and research/gptpro-reports/2026-07-20-replica-width-consult.md. |
| GB200 NVL72 | `etaDec` | 0.315997 | FITTED (deployed; computed per §2 rule — slice-1a derivation; b9 M1: precision double-credit REMOVED); evidence=fitted; 0.315997 IS THE FP4-BASIS COEFFICIENT, and its use in the FP8 default render is a DECLARED CONSERVATIVE TRANSFER, not a bridge (owner ruling q-im-fp4-gb200-eta-basis, 2026-08-02, accepted default; relabel only — no number moves). Executed through this repo's own roofline at F4's operating point, 0.315997 reproduces the 10,108 tok/s anchor to 0.06% ON THE FP4 TUPLE (10,114.4) and yields 6,408.5 on the FP8 tuple; the coefficient that reproduces the anchor in the FP8 basis is 0.498413. So at the FP8 default this row under-predicts its own best Blackwell measurement by ~1.58× — conservative, which is why every overclaim-tuned review passed it. THE RETIRED CLAIM, recorded so it cannot come back: b9 M1 (r4 defect D3, run B §B4/§C1) derived 0.315997 = 0.585795 / 1.8538 to de-embed the retired NVFP4 precision scalar, and called the result 'the FP8 bridge value', defended as equalling F4's own implied η 0.316 'an independent confirmation, not a second fit'. It is not independent: research/im3-slice1a-derivations.md:69-70 records that 0.585795 was CONSTRUCTED as 0.316 × 1.8538, so dividing it back cannot fail to return 0.316. The de-embedding correctly removed a double-counted scalar; it did not convert the basis. Slice-1a authored-decision item h (:204-207) registered the FP4 calibration basis as a choice FOR REVIEW with the FP8 alternative pre-computed (10,135.1 / 8,581.1 tok/s) — REOPENED, and the vLLM source-dtype resolution is a registered evidence task (research/update-queue.md). Three incompatible senses of 'the FP8 basis' are live in the documents (the legacy ladder rung 10,135.1, this de-embedded coefficient, and the live tuple render 6,408.5) and what ships is none of them; that is why this field no longer uses the phrase. Archived NVFP4 replay basis: engine deployed effDec 0.150 × PRECISION_MULT.fp4 1.85 ⇒ 18,750.000 tok/s (5.0e15 × 1.85 × 0.150 / 74e9) at the F4 operating point. |
| GB200 NVL72 | `decodeTrafficBasis` | active-parameter-surrogate | paired eta representation=active-parameter-surrogate; nPhysDeclared=8; sources=research/evidence-instances-v22.json#gb200-vllm-r1; frozen d2 §3.1 F4 (vLLM R1 decode observation); research/reviews/im-adv-r4-runB-internal-raw.md §B4/§C1 (the de-embedding; its 'FP8 bridge value' label is RETIRED per q-im-fp4-gb200-eta-basis — see deployedBasis) |
| GB200 NVL72 | `etaPre` | 0.17581 | extrapolated (single-anchor transfer); frozen F7 identity fit: η_pre = 0.17581 (H800 fresh-prefill reconstruction ~4,026 tok/s/GPU at L_in = 4,989, FP8; d2 §3.1-§3.2). EVERY row's prefill leg computes the frozen E2 roofline with this single value (memo §8 universal-transfer rule). Prefill never carries a measured basis (IM5-5 boundary; no two-sided prefill evidence exists — BLOCK-2 item 9). |
| GB200 NVL72 | `rent` | $4.5/hr | price evidence=analyst-set; economic basis note below |
| GB200 NVL72 | `capex` | $43056 | engine.js HW economic input; economic basis note below |
| GB200 NVL72 | `tdp` | 1.2 kW | engine.js HW economic input; economic basis note below |
| GB200 NVL72 | `economicBasisNote` | — | 72-GPU NVLink domain (~$3-3.5M/rack ⇒ ~$44-49k/GPU). Per-GPU dense FP8 = 5.0 PF (NVIDIA sparse/dense split, verified — the widely-copied 4.5 PF is B200's). The vLLM ~10.1k R1 decode observation anchors F4 at b=128/rank and L=3,000. The live coefficient is η=0.315997, and it is an FP4-BASIS coefficient used in the FP8 default render as a DECLARED CONSERVATIVE TRANSFER (owner ruling q-im-fp4-gb200-eta-basis, 2026-08-02; relabel only — no number moves). This sentence used to call it 'the live FP8-basis coefficient', which contradicted the calibration registry's own words on the same value — '0.315997 IS THE FP4-BASIS COEFFICIENT' — and the vetting round of 2026-09-19 found the two sides of the record disagreeing (finding E2). The registry is right and this note now says what it says: 0.315997 reproduces the 10,108 tok/s anchor on the FP4 tuple and yields 6,408.5 on the FP8 tuple, so at the FP8 default the row under-predicts its own best Blackwell measurement by ~1.58x. The source run's precision basis (possibly NVFP4) is not fully pinned, so treat the anchor as an upper one rather than reapplying an FP4 gain. Neocloud rates $3.50-6/hr (Jul 2026). 2026-07-15 dive: AWS Capacity Block $761.904/rack-hr ($10.582/GPU-hr) is the cleanest explicit full-rack market datum; paired with audited MLPerf v6.0 rack throughput it derives $0.881/$0.630/$0.435 per M output tok (Interactive/Server/Offline) — a rack-scale bridge anchor, not fitted into this row's rent (left at the existing neocloud estimate). |
| GB300 NVL72 | `flops.bf16` | 2500000000000000 FLOP/s | C10 fallback — fp8/2 = 2.5 PF dense |
| GB300 NVL72 | `flops.fp8` | 5000000000000000 FLOP/s | carried — 5.0 PF dense FP8 (engine.js flopsFp8 5.00; Blackwell Ultra FP8 unchanged from GB200 basis in the engine row) |
| GB300 NVL72 | `flops.fp4` | 15000000000000000 FLOP/s | frozen — C2: NVFP4 active path FLOPS = 15e15 (d2 §4.2; Blackwell Ultra 15 PF dense FP4, 1.67× B200) |
| GB300 NVL72 | `hbmBytes` | 298013687808 B (298.014 decimal GB) | vendor-documented framebuffer — 284,208 MiB × 2^20 = 298,013,687,808 B per GPU: NVIDIA DGX GB300 NVL72 release notes (docs.nvidia.com/dgx/dgxgb300nvl72-release-notes, v1.0.0/1.0.1/1.0.6, known-issue 14) state 'NSM Type 3 (0x0C) and nvidia-smi (-q -d MEMORY) return 284,208 MiB, while Redfish TotalMemorySizeMiB returns 285,324 MiB'. The nvidia-smi value adopted (feasibility-conservative of the two); FLAGGED single-source-type — NVIDIA's own docs, no third-party pasted output found (verified 2026-07-18). ≈3.6% below the '288 GB'-as-GiB reading. |
| GB300 NVL72 | `bwHBM` | 8000000000000 B/s | published — 288 GB HBM3e @ 8 TB/s per GPU (frozen §5 recipe 1-2; = engine.js bw 8.00) |
| GB300 NVL72 | `fabric` | 1800000000000 B/s | memo §6 known value — NVLink5 1.8 TB/s per GPU (gb300 1.8e12, same NVLink5 domain as gb200; frozen §5 recipe 1-2) |
| GB300 NVL72 | `nShard` | 8 | N_shard; declared analyst default (unchanged from the pre-existing engine value), precision-conditioned — multiple Class C/D anchors support 8 as a genuinely deployed low-precision replica width, but per the 2026-07-20 GPT Pro evidence consult, the public record does not establish a specific required or minimum replica width for a multi-trillion-parameter closed-weight model at unknown precision (the actual Opus/5T scenario this engine models); see the declared-sensitivity case list on this row and research/gptpro-reports/2026-07-20-replica-width-consult.md. |
| GB300 NVL72 | `etaDec` | 0.258295 | analyst-set at a DECLARED assumed operating point (b9 M1 relabel — the prior FITTED label was FALSE: the calibration observation carries measured:null and an assumed batch; precision double-credit also REMOVED); evidence=analyst-set-assumed-op; 0.258295 IS AN FP4-BASIS COEFFICIENT used in the FP8 render as a DECLARED CONSERVATIVE TRANSFER, exactly as on gb200 and derived identically (owner ruling q-im-fp4-gb200-eta-basis, 2026-08-02; relabel only — no number moves). b9 M1 (r4 defects D3 + D6, run B §B4/§B12-2/§C1): 0.258295 = 0.477845 / 1.85, de-embedding the retired NVFP4 precision scalar from a value built at the NVFP4 tuple (research/im3-slice1a-derivations.md:72-78). The magnitude class matches gb200's: on the V4 Pro geometry this row renders 7,460.3 tok/s at FP4 — matching the site's own validation row — against 4,411.6 at FP8, a 1.69× gap. UNLIKE gb200 there is no measured anchor to under-predict (calObs.measured is null), so 'conservative by 1.69×' is a magnitude statement, not a demonstrated error. The row is ALSO relabelled from 'fitted' to analyst-set: measured:null and an ASSUMED batch, so no fit was ever performed here (run B: 'indefensible as fitted'). Archived NVFP4 replay basis: engine deployed effDec 0.127 × 1.85 ⇒ 15,875.000 tok/s (5.0e15 × 1.85 × 0.127 / 74e9) at the declared operating point L=2,740 (the C5 gb300 value). SCENARIO-ONLY (§C3): both the batch and the η are assumed; upgrading requires a reconstructable non-MTP serving curve — a registered evidence task (research/update-queue.md). |
| GB300 NVL72 | `decodeTrafficBasis` | active-parameter-surrogate | paired eta representation=active-parameter-surrogate; nPhysDeclared=8; sources=research/evidence-instances-v22.json#gb300-analyst-set-dec; research/evidence-instances-v22.json#gb300-sglang-v4 (RETRO observation; excluded from fit set); memo §2 declared assumed operating point (source batch not reconstructable; excluded from fit set); research/reviews/im-adv-r4-runB-internal-raw.md §B1/§B4/§B12-2/§C1 |
| GB300 NVL72 | `etaPre` | 0.17581 | extrapolated (single-anchor transfer); frozen F7 identity fit: η_pre = 0.17581 (H800 fresh-prefill reconstruction ~4,026 tok/s/GPU at L_in = 4,989, FP8; d2 §3.1-§3.2). EVERY row's prefill leg computes the frozen E2 roofline with this single value (memo §8 universal-transfer rule). Prefill never carries a measured basis (IM5-5 boundary; no two-sided prefill evidence exists — BLOCK-2 item 9). |
| GB300 NVL72 | `rent` | $6/hr | price evidence=analyst-set; economic basis note below |
| GB300 NVL72 | `capex` | $55000 | engine.js HW economic input; economic basis note below |
| GB300 NVL72 | `tdp` | 1.4 kW | engine.js HW economic input; economic basis note below |
| GB300 NVL72 | `economicBasisNote` | — | Blackwell Ultra: 15 PF dense FP4 (1.67× B200), 288GB HBM. The SGLang >12k tok/s/GPU V4 Pro observation (FP4+MTP, 49B active) is not a fit: its batch and MTP acceptance are not reconstructable. The live η=0.258295 is analyst-set at a declared b=128/rank, L=2,740 operating point, and it is an FP4-BASIS coefficient used in the FP8 render as a DECLARED CONSERVATIVE TRANSFER, derived identically to gb200's (owner ruling q-im-fp4-gb200-eta-basis, 2026-08-02). This sentence used to call it 'the live FP8-basis η', contradicting the calibration registry's '0.258295 IS AN FP4-BASIS COEFFICIENT' on the same value; the registry is right (vetting finding E2, 2026-09-19). Unlike gb200 there is no measured anchor to under-predict — calObs.measured is null — so the 1.69x FP4-to-FP8 gap on this row is a magnitude statement, not a demonstrated error. InferenceX ~17× H100 FP8. xjdr served GLM 5.2 on these ($4-7/hr early rates). 2026-07-15 dive: audited MLPerf v6.0 single-rack results now confirm generated-throughput at scale (NVIDIA Interactive 250,634 / Server 400,437 / Offline 647,076 gen tok/s; Nebius Server 575,580 / Offline 673,936 gen tok/s) — but NO numeric GB300 rack rental rate is public on any major provider checked (AWS/CoreWeave/Nebius/GCP/Azure/OCI/Crusoe, Jul 2026): model GB300 $/M-output as a function of rack-hour price, not a point estimate. Cleanest current Blackwell-Ultra pair is same-provider B300 (node-scale, not rack): Nebius 8-GPU MLPerf Server 60,413 gen tok/s at $7.85/GPU-hr ⇒ $0.289/M output. |
| H800 (China) | `flops.bf16` | 990000000000000 FLOP/s | published — 989 TF dense BF16 (H100-class datasheet value); = fp8/2 (C10-consistent) |
| H800 (China) | `flops.fp8` | 1980000000000000 FLOP/s | published — 1.98 PF dense FP8, H100-class compute (frozen F1 recipe flops 1.98e15; = engine.js flopsFp8 1.98) |
| H800 (China) | `hbmBytes` | 85520809984 B (85.521 decimal GB) | observed framebuffer (H100-80GB-class carry) — nvidia-smi total 81,559 MiB × 2^20 = 85,520,809,984 B, verified for 'NVIDIA H100 80GB HBM3' (see h100.prov.hbmBytes sources); H800 is the same 80 GB SXM HBM3 die/SKU class and no H800-specific pasted output was found — the carry is labeled, not observed-on-H800 (R5 verification note). |
| H800 (China) | `bwHBM` | 3350000000000 B/s | published — 3.35 TB/s HBM3 (H100-class; frozen F1 recipe hbmBps 3.35e12; = engine.js bw 3.35) |
| H800 (China) | `fabric` | 400000000000 B/s | frozen — NVLink export-capped 400 GB/s aggregate bidirectional per GPU (H800 SKU; roofline-diagnostic.mjs H800 case; d2 receipt pack) |
| H800 (China) | `nShard` | 144 | N_shard; PUBLISHED (R5 AMENDMENT: was analyst-declared 8, STALE — 'F1's 8-GPU node' is the anchor's per-node throughput-normalization basis, not the deployment width) — 144: DeepSeek Day-6 disclosure, verbatim: 'Decoding Phase [Routed Expert EP144, MLA/Shared Expert DP144]: Each deployment unit spans 18 nodes' (×8 GPUs = 144). Prefill unit = EP32/DP32 over 4 nodes (32 GPUs) — prefill width, NOT used by decode feasibility. Source 'deployment unit' adopted as memo §5 'replica width'. Cached: research/primary-sources/deepseek-day6-inference-2026-07-18/ (sha256 3b145f12…). Amends the memo §5 declared cell; adjudication in im3-slice1a-derivations.md §6. |
| H800 (China) | `etaDec` | 0.313491 | FITTED (deployed; computed per §2 rule — slice-1a derivation); evidence=fitted; current engine deployed effDec 0.070 ⇒ 1,872.9730 tok/s (1.98e15 × 0.070 / 74e9) at the F1 operating point — the snapshot-pin ≈1,873 basis, which relates to the 1,850 source anchor through the engine's documented rounding conventions (memo §2) |
| H800 (China) | `decodeTrafficBasis` | active-parameter-surrogate | paired eta representation=active-parameter-surrogate; nPhysDeclared=144; sources=research/evidence-instances-v22.json#h800-deepseek-prod-dec; frozen d2 §3.1 F1 (DeepSeek Feb 2025 production disclosure) |
| H800 (China) | `etaPre` | 0.17581 | FITTED (identity, F7); frozen F7 identity fit: η_pre = 0.17581 (H800 fresh-prefill reconstruction ~4,026 tok/s/GPU at L_in = 4,989, FP8; d2 §3.1-§3.2). EVERY row's prefill leg computes the frozen E2 roofline with this single value (memo §8 universal-transfer rule). Prefill never carries a measured basis (IM5-5 boundary; no two-sided prefill evidence exists — BLOCK-2 item 9). |
| H800 (China) | `rent` | $1.75/hr | price evidence=observed-source-named; economic basis note below |
| H800 (China) | `capex` | $40000 | engine.js HW economic input; economic basis note below |
| H800 (China) | `tdp` | 0.7 kW | engine.js HW economic input; economic basis note below |
| H800 (China) | `economicBasisNote` | — | H100 compute with NVLink capped at 400GB/s (export SKU, finite pre-ban stock — capex carries the scarcity premium). THE H800/H100 DIFFERENTIAL, STATED (d-im-h800, owner note aca09d 2026-08-18; grounded on the NVIDIA H800 datasheet 2631447 vs the H100 SXM datasheet, Lenovo Press LP1814, Tencent Cloud HCCPNV5): the export SKU differs from the H100 SXM in NVLink (400 vs 900 GB/s aggregate bidirectional) and FP64 (1 vs 34 TF) ONLY — FP8/BF16 tensor rate, 80 GB HBM3, 3.35 TB/s and 700 W are identical, so nothing else that reaches a serving number differs. CORRECTION to the 2026-08-16 annotation on this row (owner verbatim: 'H800 numbers are clearly broken'), which said the cap is modelled nowhere and that this engine has no fabric term on these rows: it does — HW_ROOFLINE carries 400e9 here and 900e9 on h100, and the live roofline consumes both (decode t_N = b·D/fabric, prefill t_fabric = D/fabric). What is true is that at every expert-parallel operating point this page ships the fabric term is SLACK under the frozen max() form (≈3% of the binding memory term at the page default, ≈13% on kimi), so this row and h100 render identical throughput, and that h100/h200 INHERIT the efficiency FITTED on this row (F1: DeepSeek's production disclosure ran on H800s). This row is therefore the MEASURED part; the borrowing rows are where the assumption lives, and the page's implicit assumption has been that the cap costs nothing. That assumption is now a NAMED, ADJUSTABLE fit-transfer assumption — nvlinkCapMinRatio, default 1.00 = this historical model — the assumed MINIMUM ratio of a borrowing row over its own capped counterfactual, applied per phase to the borrowing rows only, never here, never stacking on an advantage the roofline already renders, with the engine's own serial-exposure counterfactual (≈1.005× at the page default) and the sensitivity computed beside it. On the dense tensor-parallel donor the fabric term already BINDS prefill and the H100 renders ≈2.25× this row's prefill throughput with no lever at all. Why this row still renders a HIGHER margin than the H100 at the default: identical throughput at $1.75/hr against $2.40/hr — a rent difference the page states, not a finding about export SKUs. Registered evidence task E-2026-08-16-c (a matched capped-vs-uncapped serving observation) stays open; no such observation is public. THE DeepSeek V3/R1 workhorse. Prefill MFU = FRESH-only reconstruction (~4,026 tok/s/GPU net of the 56.3% disk-cache share; the raw 9,212 aggregate includes cache hits). Annual-commit IDC rate $1.47-2.06/hr mid-2026; DeepSeek's 2025 disclosure assumed $2/hr. |
| H20 (China) | `flops.bf16` | 148000000000000 FLOP/s | C10 fallback — fp8/2 = 148 TF dense; matches NVIDIA's published H20 BF16 148 TF |
| H20 (China) | `flops.fp8` | 296000000000000 FLOP/s | published — 296 TF dense FP8 (frozen F2/F3 recipes flops 0.296e15; = engine.js flopsFp8 0.296) |
| H20 (China) | `hbmBytes` | 102625181696 B (102.625 decimal GB) | observed framebuffer — nvidia-smi total 97,871 MiB × 2^20 = 102,625,181,696 B for 'NVIDIA H20' (verified 2026-07-18: github.com/NVIDIA/TensorRT-LLM#8023, forums.developer.nvidia.com cudaLaunchHostFunc thread; same total documented for GH200's 96 GB HBM3 partition, docs.nvidia.com grace-perf-tuning-guide). |
| H20 (China) | `bwHBM` | 4000000000000 B/s | published — 4.0 TB/s HBM3 (frozen F2/F3 recipes hbmBps 4.0e12; = engine.js bw 4.00) |
| H20 (China) | `fabric` | 900000000000 B/s | frozen — 900 GB/s NVLink (H20 keeps full NVLink4; roofline-diagnostic.mjs H20 cases fabricBps 900e9) |
| H20 (China) | `nShard` | 16 | N_shard; PUBLISHED (R5 AMENDMENT: was analyst-declared 8 'deployment-family convention', STALE — the F2/F3 anchor source states the width directly) — 16: LMSYS/Ant Group post (lmsys.org/blog/2025-09-26-sglang-ant-group), verbatim: 'The Decode instance is deployed on a 2-node setup (16× H20 GPUs)' / 'All Decode instances are deployed with a dual-node setup: Attention-DP16 + MoE-EP16'; prefill = single-node TP8 (prefill width, not used by decode feasibility). The repo already carried this at research/consultation-2026-07-10-roofline-verbatim.md:154 without it reaching the normative data. Cached: research/primary-sources/sglang-ant-h20-2026-07-18/ (sha256 53c49762…). Amends the memo §5 declared cell; adjudication in im3-slice1a-derivations.md §6. |
| H20 (China) | `etaDec` | 0.217022 | analyst-set (source-informed neutral adjustment: deployed 680 tok/s differs from the 714 tok/s observation; not a fit); evidence=source-informed-neutral; legacy effDec 0.170 defines the neutral 680.0000 tok/s throughput target (0.296e15 × 0.170 / 74e9) at the F3 operating point; the executable roofline mapping is etaDec 0.217022. This is the hardware dive's neutral recommendation (≈680 basis), NOT the 714 anchor-reproducer (memo §2) |
| H20 (China) | `decodeTrafficBasis` | active-parameter-surrogate | paired eta representation=active-parameter-surrogate; nPhysDeclared=16; sources=research/evidence-instances-v22.json#h20-ant-sglang-pro (F2 input observation); research/evidence-instances-v22.json#h20-ant-sglang (F3 input observation); research/evidence-instances-v22.json#h20-neutral-live-dec (live analyst-set identity); frozen d2 §3.1 F2/F3 |
| H20 (China) | `etaPre` | 0.17581 | extrapolated (single-anchor transfer); frozen F7 identity fit: η_pre = 0.17581 (H800 fresh-prefill reconstruction ~4,026 tok/s/GPU at L_in = 4,989, FP8; d2 §3.1-§3.2). EVERY row's prefill leg computes the frozen E2 roofline with this single value (memo §8 universal-transfer rule). Prefill never carries a measured basis (IM5-5 boundary; no two-sided prefill evidence exists — BLOCK-2 item 9). |
| H20 (China) | `rent` | $0.82/hr | price evidence=observed-source-named; economic basis note below |
| H20 (China) | `capex` | $20000 | engine.js HW economic input; economic basis note below |
| H20 (China) | `tdp` | 0.4 kW | engine.js HW economic input; economic basis note below |
| H20 (China) | `economicBasisNote` | — | The China-legal NVIDIA SKU: only 296 TF dense FP8 but 4.0 TB/s HBM — decode is bandwidth-bound, so it serves far better than its FLOPS suggest (hence the high effective MFU vs a tiny denominator). This row's executable roofline coefficient is the source-informed-neutral η_dec=0.217022; it maps the legacy effDec=0.170 throughput basis to the hardware dive's ~680 tok/s recommendation and does NOT fit Ant Group's relaxed <70ms production observation (714 tok/s at b=48, L=4,096, one-step/two-draft-token MTP with ~1.8-1.9 accepted tokens). Rental class matters: same chip spans ~$0.76 (IDC annual) to $7+ (hyperscaler on-demand). |
| TPU v7 Ironwood | `flops.bf16` | 2307000000000000 FLOP/s | C10 fallback — fp8/2 = 2.307 PF dense (no published Ironwood dense-BF16 figure in the project source base; analyst-set via the C10 rule, labeled) |
| TPU v7 Ironwood | `flops.fp8` | 4614000000000000 FLOP/s | published — 4,614 TF FP8 per Ironwood chip (frozen recipe 5 / C9-adjacent [RP §2b]; = engine.js flopsFp8 4.61) |
| TPU v7 Ironwood | `hbmBytes` | 206158430208 B (206.158 decimal GB) | published, unit EXPLICIT at source — 192 GiB × 2^30 = 206,158,430,208 B: Google Cloud TPU docs table 'HBM capacity per chip (GiB) … 192' (docs.cloud.google.com/tpu/docs/tpu7x, also compute/docs/tpus/tpu-machines), corroborated by the Hot Chips 2025 Ironwood deck ('capacity 192 GiB, 8 stacks HBM3E') and arXiv:2606.15870 (verified 2026-07-18). No reserved-carve-out figure published; raw capacity adopted, labeled. |
| TPU v7 Ironwood | `bwHBM` | 7370000000000 B/s | published — 7.37 TB/s HBM per chip (frozen recipe 5 'HBM 192 GB @ 7.37e12'; = engine.js bw 7.37) |
| TPU v7 Ironwood | `fabric` | 1200000000000 B/s | frozen — ICI 1.2 TB/s per chip (d2 §5 recipe 5; memo §6 known value) |
| TPU v7 Ironwood | `nShard` | 4 | N_shard; frozen — 4 (d2 §1.3: TP8 across 8 tensorcores = the 4-chip host, one replica) |
| TPU v7 Ironwood | `etaDec` | 0.519 | analyst-set (platform-native aggregate-form bridge on ONE DECLARED TIMING CONVENTION — OUTPUT TOKENS PER SECOND PER CHIP OVER TOTAL SERVING WALL TIME at a 1K-in/8K-out workload, to which BOTH observations are NORMALIZED — the rental anchor is published that way, Google's is a COMBINED input-plus-output rate that THIS PAGE converts by × 8/9: two same-platform diagnostics 0.528/0.510, midpoint 0.519, declared band 0.510–0.528 — b9 M1, numerator repaired 2026-09-20 by im-vet-six-repairs and put on a consistent basis the same day, after the completion gate refused a DISCLOSED inconsistency as a repair; VALID ONLY in this row's declared decodeTrafficBasis); evidence=platform-native-aggregate-bridge; b9 M1 (r4 defect D2, run B §A4/§B1/§C1): the joint fleet fit 0.36142 is REJECTED as evidence for this row — it is a geometric mean over six NVIDIA/Ascend observations containing ZERO TPU data, against the project's own LOAO record of 37% average / 59% worst-case cross-platform transfer error. Replaced by the mean of two SAME-PLATFORM aggregate-form diagnostics. BASIS REPAIR, im-vet-six-repairs 2026-09-20 (vetting finding E2, dive E on the served page), REVISED THE SAME DAY after the completion gate refused a disclosed inconsistency as a repair. Both endpoints now sit on ONE STATED TIMING CONVENTION, to which both observations are NORMALIZED: OUTPUT TOKENS PER SECOND PER CHIP OVER TOTAL SERVING WALL TIME, at a 1K-in/8K-out workload. ONLY THE RENTAL ANCHOR IS PUBLISHED THAT WAY. Google publishes a COMBINED input-plus-output rate, and the x 8/9 conversion to output-only is performed HERE, by this page, not by Google — stated because an earlier draft said both sources publish in this convention, which a reader could disprove at the citation. (1) η ≈ 518.86 × 480 GB / (64 × 7.37 TB/s) = 0.528 from the rental anchor, whose source states the figure in exactly that form (“518.86 output tok/s/chip (1K/8K workload)”, tpu-recipes, evidence anchor 16). (2) η ≈ 601.8 × 400 GB / (64 × 7.37 TB/s) = 0.510 from Google's July 2026 Ironwood playbook, where 601.8 = 677 × 8/9: the playbook reports 677 t/s/chip COMBINED input-plus-output under 1K-in/8K-out — this project's own published blinded replication says so in terms, “Google reports combined input-plus-output throughput” — and 8 of every 9 tokens in that workload are output. Midpoint 0.519, declared band 0.510–0.528. WHAT THIS ROW USED TO SAY, AND WHY IT CHANGED TWICE. Before 2026-09-20 it read midpoint 0.55 over band 0.528–0.574, using 677 itself as a decode numerator — a combined rate read as an output rate, overstating that endpoint by 11.7%. The first repair replaced 677 with 606, the DECODE-STAGE rate this project's blinded replication solves out of the two-workload system (8000/T_i + 1000/T_o = 9000/3707 and 1000/T_i + 8000/T_o = 9000/677 give T_i = 10,279, T_o = 606), and explicitly rejected 677 × 8/9 because generated end-to-end throughput still carries the prompt-processing burden. That objection is true of 606's partner as well: 518.86 carries the same burden, so pairing it with 606 put two different clocks in one mean. The Astra xhigh review found that; the completion gate then ruled that DISCLOSING the inconsistency is neither repairing it nor withdrawing the contribution, which the commission required. So the basis is now chosen rather than mixed, and it is chosen the conservative way: 0.519 is LOWER than either the 0.521 mixed midpoint or the 0.525 that a fully decode-stage pair would give, and a lower η raises modeled cost, so every MARGIN this leg feeds falls or stays put — measured, not asserted: across all 288 model/perspective combinations the 0.521 → 0.519 move produced 100 lower margins, 188 unchanged and zero higher. Stated precisely because the looser form was wrong: this is a claim about MARGINS, and other published quantities RISE with it, exactly as a cost increase should — the calibration-debt width 13.69 → 13.74 points, reference serving energy 186.0841 → 186.1590 Wh per million tokens, the rent/TCO ratio 3.5555 → 3.5563, and the direct-serving dollar costs themselves. WHAT THIS BASIS IS NOT: it is not a decode-stage efficiency. Both diagnostics carry prompt-processing time in their denominator, so each understates the decode-phase rate; the coefficient is an END-TO-END PROXY at a declared workload, applied inside a decode term while prefill is charged separately, and that phase attribution is an assumption this row makes rather than a measurement it has. CORRECTED 2026-09-20 after the Astra xhigh review of this very repair: an earlier draft of this note claimed the prefill-time share was “the same on both sides” and that a decode-stage pair had to wait for the rental anchor to publish a second workload row. BOTH CLAIMS WERE FALSE and a reader following the citation would have found that out in one click. The rental recipe already publishes 1K/1K, 1K/8K and 8K/1K rows, and applying the same two-workload decomposition to them gives roughly 526.98 decode t/s/chip against Google's 606.21 — implied prefill-time shares near 1.54% and 0.73%, not equal. Equal TOKEN proportions do not make equal TIME proportions. So the decomposition is available and this row declines it on a different and stateable ground: it is assumption-dependent and it does not predict out of sample — fitted on two of the rental anchor's three rows it predicts about 468 t/s/chip for the third, against a published 499. One normalization both sources can be put on by a single stated conversion beats a decomposition that misses a row either source can check. These are weight-only, representation-specific diagnostics (they ignore KV and recurrent-state traffic), so the coefficient is bound to decodeTrafficBasis 'replica-resident-distinct' and is NOT a universal platform efficiency. The retired ≈0.199 value is NOT the alternative: run B §A4 shows it is the coefficient required to reproduce the old anchor INSIDE the malformed per-device identity, absorbing the batch/weight unit mismatch rather than measuring efficiency. |
| TPU v7 Ironwood | `decodeTrafficBasis` | replica-resident-distinct | paired eta representation=replica-resident-distinct; nPhysDeclared=16; sources=research/reviews/im-adv-r4-runB-internal-raw.md §A2/§A4/§B1/§C1; Google Ironwood Qwen 3.5 serving playbook 2026-07-14 (677 tok/s/chip COMBINED input-plus-output under 1K-in/8K-out — Google's own reporting convention; concurrency 64, 4 chips, 400 GB replica footprint). Its OUTPUT-ONLY equivalent on the same wall clock is 677 × 8/9 = 601.8 t/s/chip, because 8 of every 9 tokens in a 1K-in/8K-out workload are output — this is the form used in the bridge, and it is on the SAME timing convention as the rental anchor beside it. Its DECODE-STAGE equivalent is a different number, 606 output t/s/chip, from this project's own two-workload solve in research/gptpro-reports/dive-replication-blinded-2026-07-15.md ("Google proxy": 8000/T_i + 1000/T_o = 9000/3707 and 1000/T_i + 8000/T_o = 9000/677 give T_i = 10,279, T_o = 606), published as site/research/dive-replication-blinded.html. 606 is NOT used in the bridge, because the rental anchor has no decode-stage equivalent published and pairing one with the other is what put two clocks in one mean; TPU v7 Qwen3-Coder-480B rental anchor (518.86 OUTPUT tok/s/chip, stated concurrency 64 over 4 chips — research/evidence-instances-v22.json anchor 16, verbatim "518.86 output tok/s/chip (1K/8K workload)", https://github.com/AI-Hypercomputer/tpu-recipes/tree/main/inference/ironwood/vLLM/Qwen3-Coder-480B-A35B) |
| TPU v7 Ironwood | `etaPre` | 0.17581 | extrapolated (single-anchor transfer); frozen F7 identity fit: η_pre = 0.17581 (H800 fresh-prefill reconstruction ~4,026 tok/s/GPU at L_in = 4,989, FP8; d2 §3.1-§3.2). EVERY row's prefill leg computes the frozen E2 roofline with this single value (memo §8 universal-transfer rule). Prefill never carries a measured basis (IM5-5 boundary; no two-sided prefill evidence exists — BLOCK-2 item 9). |
| TPU v7 Ironwood | `rent` | $5.4/hr | price evidence=observed-source-named; economic basis note below |
| TPU v7 Ironwood | `capex` | $25000 | engine.js HW economic input; economic basis note below |
| TPU v7 Ironwood | `tdp` | 1 kW | engine.js HW economic input; economic basis note below |
| TPU v7 Ironwood | `economicBasisNote` | — | Google's inference TPU (GA Mar 31, 2026): 4,614 TF FP8 ≈ B200-class, 9,216-chip pods. Anthropic committed up to ~1M TPUs (Oct 2025). Rent = Google's PUBLISHED 3-year committed rate $5.40/chip-hr (b9 M1, r4 defect D4: the retired $4.20 sat BELOW every public comparator — 3-yr $5.40, DWS Flex $6, on-demand $12 — so it was never a purchasable market rate; this is a low/committed PLANNING rate, and it is labeled as one). 2026-07-15 dive: named-model accelerator-rental anchors exist (Qwen3-Coder-480B, 4 chips, 518.86 tok/s/chip ⇒ $6.42/M output on-demand, $2.89/M 3-yr) — barred from calibration as a RETRO evidence annotation (memo §2), though b9 M1 admits its aggregate-form weight-only efficiency reading (0.528) as one endpoint of this row's platform-native η bridge. The live decode path uses η_dec=0.519, the midpoint of that bridge (0.528 rental anchor / 0.510 Google Ironwood playbook). It read 0.55 with a 0.574 Google endpoint until 2026-09-20, when that endpoint was found to be using Google's COMBINED input-plus-output rate as if it were an output rate; both endpoints are now normalized to one output-only, total-wall-time convention, replacing the joint fleet fit that contained ZERO TPU observations. Google-internal fleet cost still unknown: no public Gemini-SKU→TPU mapping exists — estimates. |
| Trainium2 | `flops.bf16` | 650000000000000 FLOP/s | frozen — C10 convention value 0.65e15/chip (d2 §4.2 C10; the dossier-stated 667 TF/chip is within 3% and is reported as sensitivity in the frozen C10 note, convention retained) |
| Trainium2 | `flops.fp8` | 1300000000000000 FLOP/s | published — ~1.3 PF dense FP8 per chip (AWS Trainium2 spec; = engine.js flopsFp8 1.30) |
| Trainium2 | `hbmBytes` | 103079215104 B (103.079 decimal GB) | frozen, unit explicit — the frozen d2 §5 recipe 6-7 states '96 GiB @ 2.9e12 per chip': 96 GiB × 2^30 = 103,079,215,104 B. No AWS framebuffer receipt; the frozen source's own GiB statement adopted. |
| Trainium2 | `bwHBM` | 2900000000000 B/s | published — 96 GiB @ 2.9 TB/s per chip (frozen recipe 6-7; = engine.js bw 2.90) |
| Trainium2 | `fabric` | 1280000000000 B/s | PUBLISHED (b9 M1 AMENDMENT: was frozen 1.024e12, STALE — run B §B1/§C1) — 1.28 TB/s NeuronLink per Trainium2 device (AWS specification). The frozen d2 §5 recipe 6-7 value of 1,024 GB/s materially understated the published hardware. NOTE: this term has NO effect on the displayed FP8/HBM-binding midpoint (the decode path binds on t_H, not t_N, at every default operating point) — it corrects the registry for subsequent communication-modeling scenarios (M2). |
| Trainium2 | `nShard` | 16 | N_shard; frozen — 16 (d2 §1.3: TP16 = the 16-chip trn2.48xlarge instance, one replica) |
| Trainium2 | `etaDec` | 0.36142 | analyst-set (joint fleet fit — out-of-family tier-(c)); SPECULATION on the page's evidence ladder — UNRESOLVED BATCH-FORM AMBIGUITY (the operating-point registry declares batch replica-global while this engine consumes it per chip; the alternative reading is ~15.2x lower throughput). Scenario-only: this coefficient CANNOT support a central Trainium margin, and both Trainium legs are WITHDRAWN from the default fleet's membership on that ground (FLEETS.na-blend.withdrawn, im-vet-six-repairs 2026-09-20). The row, its rent and its scenarios are kept and selectable.; evidence=joint-fit; joint fleet fit (frozen d2 §3.2); dense-TP row — t_cc applies per TCC_CONSTANTS (frozen §1.5), outside η. SCENARIO-ONLY (r4 §C3, b9 M1): no model-, topology- and SLO-matched Trainium serving throughput observation exists in the public record, so this coefficient CANNOT support a central Trainium margin — run B §A4: 'the joint η may remain only as a visibly marked sensitivity parameter'. Upgrading it requires a named model, topology, batch, precision, SLO and achieved output throughput. |
| Trainium2 | `decodeTrafficBasis` | active-parameter-surrogate | paired eta representation=active-parameter-surrogate; nPhysDeclared=16; sources=frozen d2 §3.2 joint fleet fit |
| Trainium2 | `etaPre` | 0.17581 | extrapolated (single-anchor transfer); frozen F7 identity fit: η_pre = 0.17581 (H800 fresh-prefill reconstruction ~4,026 tok/s/GPU at L_in = 4,989, FP8; d2 §3.1-§3.2). EVERY row's prefill leg computes the frozen E2 roofline with this single value (memo §8 universal-transfer rule). Prefill never carries a measured basis (IM5-5 boundary; no two-sided prefill evidence exists — BLOCK-2 item 9). |
| Trainium2 | `rent` | $2.235/hr | price evidence=observed-source-named; economic basis note below |
| Trainium2 | `capex` | $15000 | engine.js HW economic input; economic basis note below |
| Trainium2 | `tdp` | 0.5 kW | engine.js HW economic input; economic basis note below |
| Trainium2 | `economicBasisNote` | — | GA Dec 2024. Project Rainier launched with ~500k Trainium2 for Anthropic (activated ~Nov 2025, confirmed running Claude inference alongside training); Anthropic reported >1M Trainium2 in use across AWS by Apr 2026 — inference/training allocation, utilization and internal rate undisclosed. Rent = AWS Capacity Blocks PUBLISHED $2.235/chip-hr (b9 M1, r4 defect D4: the retired $1.50 sat below the only public comparator). 2026-07-15 dive: a narrow public ENGINEERING anchor exists (AWS Neuron tutorials, batch=1/concurrency=1: Llama 3.3 70B spec-decode $68.90/M output tokens, Llama 3.1 405B $98.65/M) — not a production-TCO measurement, not fitted into this roofline. b9 M1 operating point: the AWS Qwen3-235B recipe on one trn2.48xlarge states replica-global batch 16 online / 64 offline (16 chips, tp_degree 64, attention-DP8, MoE EP32/TP2); the surrogate midpoint 32 replaces the retired b=4, which was an AWS tutorial demo value read as a production point. Throughput remains UNVERIFIED — no matched serving anchor exists — so this leg is scenario-only. |
| Trainium3 | `flops.bf16` | 671000000000000 FLOP/s | PUBLISHED (post-review adjudication 2026-07-27) — the AWS Neuron architecture docs state BF16/FP16/TF32 dense = 671 TFLOPS/chip (the 2,517 figure is SPARSE) (https://awsdocs-neuron.readthedocs-hosted.com/en/latest/general/arch/neuron-hardware/trainium3.html). Replaces the C10 fp8/2 fallback of 1.255 PF, which overstated published dense BF16 by 1.87×. NOTE the same docs state Trainium2 BF16 = 667 TFLOPS; the trn2 row deliberately retains its frozen C10 convention value 0.65e15 (labeled, within 3%) — moving it is a frozen-recipe identity decision, flagged in the adjudication report. |
| Trainium3 | `flops.fp8` | 2510000000000000 FLOP/s | published — 362 PF FP8 per 144-chip UltraServer ⇒ 2.51 PF/chip (engine.js trn3 note, GA Dec 2025); Neuron architecture docs concur: 2,517 MXFP8/MXFP4 TFLOPS/chip |
| Trainium3 | `flops.fp4` | 2510000000000000 FLOP/s | published NATIVE (b9 M1 — run B §B4/§C1) — AWS states 2.517 PF for MXFP8 AND MXFP4 per Trainium3 device, i.e. ONE figure covering both formats. Registered EQUAL to the fp8 basis: native FP4 arithmetic exists, but no FP4 compute doubling is published, so the row takes the capacity/weight-loading benefit (PRECISION_TUPLES.trn3.fp4 sW 0.5) and NO throughput credit. |
| Trainium3 | `hbmBytes` | 154618822656 B (154.619 decimal GB) | PUBLISHED (post-review adjudication 2026-07-27) — the AWS Neuron architecture docs are unit-explicit: 'HBM Capacity (GiB): 96 → 144' and '144 GiB of device memory' (https://awsdocs-neuron.readthedocs-hosted.com/en/latest/general/arch/neuron-hardware/trainium3.html, retrieved 2026-07-27). 144 GiB × 2^30 = 154,618,822,656 B. This REVERSES the external review's SI re-reading (144e9), which took the marketing page's loose '144 GB' label literally against the unit-explicit engineering docs; HBM3e stack capacities are physically binary quantities, and the trn2 row's frozen source states GiB for the same family. |
| Trainium3 | `bwHBM` | 4900000000000 B/s | PUBLISHED — 144 GiB HBM3e at 4.9 TB/s per chip (AWS Neuron architecture docs; SI carry of bw 4.90). |
| Trainium3 | `fabric` | 2560000000000 B/s | PUBLISHED (post-review adjudication 2026-07-27) — the AWS Neuron architecture docs state Inter-chip Interconnect 2,560 GB/sec/chip for Trainium3, in the same table and convention as Trainium2's 1,280 (already registered as 1.28e12) (https://awsdocs-neuron.readthedocs-hosted.com/en/latest/general/arch/neuron-hardware/trainium3.html). CONFLICT NOTED: the marketing page (https://aws.amazon.com/ec2/instance-types/trn3/) says '2TB/s of bandwidth per chip' for NeuronLink-v4 — likely a different direction/aggregation convention; the engineering docs' same-convention family figure is adopted. The displayed FP8/HBM-binding midpoint does not bind on t_N. |
| Trainium3 | `nShard` | 16 | N_shard; analyst-declared — 16 (trn2 carry, memo §5) |
| Trainium3 | `etaDec` | 0.36142 | analyst-set (joint fleet fit — out-of-family tier-(c); trn2-carry platform constants, labeled); SPECULATION on the page's evidence ladder — inherits trn2's unresolved batch-form ambiguity (~15.2x) on trn2-carry platform constants, and adds no matched serving anchor and no public numeric price of its own. Scenario-only; WITHDRAWN from the default fleet's membership with trn2 (FLEETS.na-blend.withdrawn, im-vet-six-repairs 2026-09-20). The row and its scenarios are kept and selectable.; evidence=joint-fit; joint fleet fit; no serving anchor of any kind exists for Trn3 (engine.js note: confirmed negative). SCENARIO-ONLY (r4 §C3, b9 M1): both the coefficient and the operating point are Trn2-derived carries — run B §B1: 'no central Trainium3 throughput should be represented as observed'. The row's rent is separately scenario-only (no public instance/UltraServer rate exists). |
| Trainium3 | `decodeTrafficBasis` | active-parameter-surrogate | paired eta representation=active-parameter-surrogate; nPhysDeclared=16; sources=frozen d2 §3.2 joint fleet fit (trn2-carry platform constants) |
| Trainium3 | `etaPre` | 0.17581 | extrapolated (single-anchor transfer); frozen F7 identity fit: η_pre = 0.17581 (H800 fresh-prefill reconstruction ~4,026 tok/s/GPU at L_in = 4,989, FP8; d2 §3.1-§3.2). EVERY row's prefill leg computes the frozen E2 roofline with this single value (memo §8 universal-transfer rule). Prefill never carries a measured basis (IM5-5 boundary; no two-sided prefill evidence exists — BLOCK-2 item 9). |
| Trainium3 | `rent` | $2.2/hr | price evidence=analyst-set; economic basis note below |
| Trainium3 | `capex` | $20000 | engine.js HW economic input; economic basis note below |
| Trainium3 | `tdp` | 0.8 kW | engine.js HW economic input; economic basis note below |
| Trainium3 | `economicBasisNote` | — | GA Dec 2025: 144-chip UltraServers, 362 PF FP8 ⇒ 2.51 PF/chip, 144GB HBM3e. AWS's aggressive cost-per-token play — pricing estimates. 2026-07-15 dive: AWS has published a GPT-OSS-120B inference recipe but no achieved tok/s and no public Trn3 instance/UltraServer price — neither side of $/token is public; NO public serving anchor of any kind (confirmed negative). |
| Ascend 910C | `flops.bf16` | 752000000000000 FLOP/s | ANALYST-SET, C10-ANALOG (flagged for 1a review) — 1.504e15/2 = 0.752e15. C10 as frozen reads 'bf16 = fp8_dense/2 where unpublished'; ascend has no fp8, so the rule is applied to its INT8 8-bit dense basis. This exactly carries the current engine's PRECISION_MULT.bf16 = 0.5 rendering behavior forward. Declared convention, not a published value. |
| Ascend 910C | `hbmBytes` | 128000000000 B (128.000 decimal GB) | ANALYST CONVENTION (labeled) — 128e9 B, the SI reading of the '128 GB' label. R5 verification (2026-07-18) found NO Huawei datasheet with unit precision and NO pasted npu-smi output; third-party sources state a round '128 GB' (one outlier claims 96 GB) with the HBM generation itself contested (HBM2e vs HBM3). The SI reading is the conservative choice and matches the frozen d2 harness's own hbmCap 128e9 for the cm384 rows. Revisit if an npu-smi receipt surfaces. |
| Ascend 910C | `bwHBM` | 3200000000000 B/s | published — 128 GB @ 3.2 TB/s per NPU (frozen recipe 3-4; = engine.js bw 3.20) |
| Ascend 910C | `fabric` | 784000000000 B/s | frozen — UB (unified bus) 784 GB/s per NPU (d2 §5 recipe 3-4 / roofline-diagnostic.mjs Ascend cases) |
| Ascend 910C | `nShard` | 128 | N_shard; declared — 128, the cm384 CO-LOCATION instance width (memo §5; frozen §1.3 co-loc 128). The 6P2D decode-pool width 144 (frozen §1.3) is an observation-level constant of the cm384-6p2d recipe, NOT this row's replica width. |
| Ascend 910C | `etaDec` | 0.299324 | analyst-set (source-informed neutral adjustment: deployed 1,422.7 tok/s differs from the 1,943 tok/s observation; not a fit); evidence=source-informed-neutral; legacy effDec 0.070 defines the neutral 1,422.7027 tok/s throughput target (1.504e15 × 0.070 / 74e9) at the F5 operating point; the executable roofline mapping is etaDec 0.299324. This is the hardware dive's neutral recommendation, NOT the 1,943 anchor-reproducer (memo §2). 8-bit basis is INT8 (W8A8) |
| Ascend 910C | `decodeTrafficBasis` | active-parameter-surrogate | paired eta representation=active-parameter-surrogate; nPhysDeclared=128; sources=research/evidence-instances-v22.json#ascend-cminfer-decode (F5 input observation); research/evidence-instances-v22.json#ascend-cminfer-15ms (F6 input observation); research/evidence-instances-v22.json#ascend-neutral-live-dec (live analyst-set identity); frozen d2 §3.1 F5/F6 |
| Ascend 910C | `etaPre` | 0.17581 | extrapolated (single-anchor transfer); frozen F7 identity fit: η_pre = 0.17581 (H800 fresh-prefill reconstruction ~4,026 tok/s/GPU at L_in = 4,989, FP8; d2 §3.1-§3.2). EVERY row's prefill leg computes the frozen E2 roofline with this single value (memo §8 universal-transfer rule). Prefill never carries a measured basis (IM5-5 boundary; no two-sided prefill evidence exists — BLOCK-2 item 9). |
| Ascend 910C | `rent` | $1.95/hr | price evidence=observed-source-named; economic basis note below |
| Ascend 910C | `capex` | $23000 | engine.js HW economic input; economic basis note below |
| Ascend 910C | `tdp` | 0.6 kW | engine.js HW economic input; economic basis note below |
| Ascend 910C | `economicBasisNote` | — | Huawei's dual-die flagship (SMIC 7nm). NO native FP8 — 8-bit here means INT8 (1.504 PF per Huawei's Atlas spec; a widely-quoted 1,054 figure is a typo in the CloudMatrix paper). This row's executable roofline coefficient is the source-informed-neutral η_dec=0.299324; it maps the legacy effDec=0.070 throughput basis to the hardware dive's ~1,420 tok/s recommendation on an R1-class workload and does NOT fit Huawei's optimized source observation (1,943 tok/s at b=96, L=4,096, one speculative token at assumed 70% acceptance, q=2/a=1.7). DeepSeek's internal '60% of H100' eval implies a lower independent efficiency estimate (~5.5-6.5% of peak FLOPs). Rent = Huatai procurement award ($1.71-2.25/hr); CloudMatrix 384 ≈ RMB 60M. 2026-07-15 dive: a full 384-card CloudMatrix system (FlexNPU, arXiv:2606.04415) serves DeepSeek-R1 W8A8 at ≈633,000 generated tok/s system-wide under TTFT≤1s/TPOT≤50ms. CLOSED (owner ruling 2026-07-18, memo §9 'CM384 ruling'): these are EVIDENCE-RECORD ANNOTATIONS — never a selectable scenario, an operating point, or a calibration input — delivered full-system SLO point: 1,648 tok/s/card ⇒ 8.1%, mixed prefill+decode, all 384 cards charged; decode-pool standalone ceiling: 2,885 tok/s/decode-card ⇒ 14.2%, capacity ceiling, prefill hardware excluded. The full-system point brackets (corroborates) this row's deployed 7% default; the decode-pool ceiling does not (a different standalone measurand, ~1.49× above the full-system point) — neither is fitted into this row. No public CM384 hourly rental price exists — throughput anchored, cost unanchored. Cross-source proxy for the OLDER 910B chip (not this row): JD xLLM 709 gen tok/s/card × CTyun RMB 38.45/hr ⇒ ≈$2.09/M output (range $1.61-2.80/M), medium-low confidence. Ascend 920 has no official SKU, benchmark, deployment or price (Huawei's roadmap goes 910C→950PR/950DT→960→970, no 920) — excluded from this model. |

_451 parameter rows, regenerated from the registry on every run — `node build-grounding-ledger.mjs`._
