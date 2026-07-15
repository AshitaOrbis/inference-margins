# Adopted grounding ledger — machine-generated RECONSTRUCTION

> **What this is:** every parameter the calculator's presets pin, with value, source and evidence label, generated directly from the deployed preset registry (`engine.js` v2.1.7-2026-07-15) and its dossier annotations — so this page cannot drift from what the calculator actually computes.
> **What this is not:** the original "192-row preset grounding pack" consultation artifact. That pack's full row set lived in conversation-sandbox files that expired; its adopted decisions are summarized in the [consultation page](consult-preset-pack.html), and a dated author-model re-emission with delta notes is published as the [preset-pack re-audit](consult-preset-pack-reaudit.html). Where any re-emission differs from this ledger, **this ledger (the adopted values) wins.**
> Generated 2026-07-15 · labels: DISCLOSED / CREDIBLY REPORTED / COMMUNITY ESTIMATE / SPECULATION (from the on-page dossiers).

## Model presets

### Claude Opus 4.x

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 300 | Page-authored 300B scenario value. TeorTaxes's cited corpus supplies only a qualitative Fable observation ('shockingly FEW active') and a relative Opus bound; GPT-5.6 Pro's independent consult also centered on 300B — neither supplies a measured count | SPECULATION |
| `total` | 5000 | Deduction from Musk's Apr 2026 post (Grok 0.5T = 1/10 Opus); knowledge-probe methods carry ±3× bars | COMMUNITY ESTIMATE |
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
| `priceIn` | 2 | Anthropic pricing page (intro through Aug 31, 2026) | DISCLOSED |
| `priceOut` | 10 | Anthropic pricing page (intro through Aug 31, 2026) | DISCLOSED |
| `nativeTraffic` | Reference 15:1 / 60% (15:1 / 60%) | Calculator convention — the held-fixed scenario the normalized table uses. Not any provider's measured operating point. | calculator default |
| `tariff.validUntil` | 2026-08-31 → {"priceIn":3,"priceOut":15} | intro $2/$10 ends Aug 31, 2026; standard $3/$15 from Sep 1 | DISCLOSED |

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
| `priceIn` | 5 | OpenAI API pricing (Standard short-context) | DISCLOSED |
| `priceOut` | 30 | OpenAI API pricing | DISCLOSED |
| `blend` | {"h100":20,"h200":25,"gb200":45,"gb300":10} | Hopper/Blackwell across Microsoft/OCI/CoreWeave (disclosed platforms; shares guessed) | SPECULATION |
| `nativeTraffic` | OpenAI dive mix 9:1 / 78% (9:1 / 78%) | The OpenAI dive's 7 cached : 2 fresh : 1 output convention — a dive assumption, not disclosed telemetry. · 7 cached : 2 fresh : 1 output benchmark convention (Artificial Analysis) | CREDIBLY REPORTED |
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
| `cacheReadMult` | 25 | $0.50 cached / $2.00 input = 25% | DISCLOSED |
| `blend` | {"h100":45,"h200":5,"gb200":25,"gb300":25} | Colossus I/II composition per SpaceXAI prospectus (shares approximated) | CREDIBLY REPORTED |
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
| `priceIn` | 0.435 | api-docs.deepseek.com pricing (Jul 9) | DISCLOSED |
| `priceOut` | 0.87 | api-docs.deepseek.com pricing | DISCLOSED |
| `cacheReadMult` | 1 | $0.003625/$0.435 = 0.83% (slider granularity: 1%) | DISCLOSED |
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
| `priceIn` | 0.14 | api-docs.deepseek.com pricing | DISCLOSED |
| `priceOut` | 0.28 | api-docs.deepseek.com pricing | DISCLOSED |
| `cacheReadMult` | 2 | $0.0028/$0.14 = 2% | DISCLOSED |
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
| `nativeTraffic` | ncode-informed scenario 8:1 / 41% (8:1 / 41%) | The 41% cache-hit rate and 81k-token average inputs are @_xjdr's free-week observations; the 8:1 input:output ratio is a site-authored Zhipu-dive assumption (the cited posts report no output-length or I/O split). One event informing a scenario, not a generic 'coding' archetype. · Site-authored Zhipu-dive assumption; @_xjdr reported 81k average inputs but no output-length or I/O split | SPECULATION |
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
| `nativeTraffic` | ncode-informed scenario 8:1 / 41% (8:1 / 41%) | The 41% cache-hit rate and 81k-token average inputs are @_xjdr's free-week observations; the 8:1 input:output ratio is a site-authored Zhipu-dive assumption (the cited posts report no output-length or I/O split). One event informing a scenario, not a generic 'coding' archetype. · Carries over GLM-5.2's site-assumed 8:1; no GLM-4.7 traffic telemetry supports it | SPECULATION |

### GPT-5.6 Terra (tariff scenario) — TARIFF SCENARIO (speculative sizes)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 50 | Scenario central from dive range 20–110B | SPECULATION |
| `total` | 1000 | Scenario central from dive range 0.25–5T | SPECULATION |
| `precision` | fp8 | Family assumption | SPECULATION |
| `priceIn` | 2.5 | OpenAI pricing | DISCLOSED |
| `priceOut` | 15 | OpenAI pricing | DISCLOSED |
| `cacheReadMult` | 10 | 90% cache discount (OpenAI standard) | DISCLOSED |
| `blend` | {"h100":20,"h200":25,"gb200":45,"gb300":10} | Sol's fleet assumption | SPECULATION |
| `nativeTraffic` | OpenAI dive mix 9:1 / 78% (9:1 / 78%) | The OpenAI dive's 7 cached : 2 fresh : 1 output convention — a dive assumption, not disclosed telemetry. · Same 7:2:1 convention as Sol | CREDIBLY REPORTED |

### GPT-5.6 Luna (tariff scenario) — TARIFF SCENARIO (speculative sizes)

| parameter | adopted value | source | label |
|---|---|---|---|
| `active` | 20 | Scenario central from dive range 8–50B | SPECULATION |
| `total` | 250 | Scenario central from dive range 0.05–1.5T | SPECULATION |
| `precision` | fp8 | Family assumption | SPECULATION |
| `priceIn` | 1 | OpenAI pricing | DISCLOSED |
| `priceOut` | 6 | OpenAI pricing | DISCLOSED |
| `cacheReadMult` | 10 | 90% cache discount | DISCLOSED |
| `blend` | {"h100":20,"h200":25,"gb200":45,"gb300":10} | Sol's fleet assumption | SPECULATION |
| `nativeTraffic` | OpenAI dive mix 9:1 / 78% (9:1 / 78%) | The OpenAI dive's 7 cached : 2 fresh : 1 output convention — a dive assumption, not disclosed telemetry. · Sol convention | CREDIBLY REPORTED |

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
| `hwMode` | rent | Rental basis — market-observable, unlike internal TCO; the basis choice is the page's | SPECULATION |
| `rentMult` | 1 | Neocloud list ≈ 1.0× the HW table's rates | COMMUNITY ESTIMATE |
| `util` | 50 | Page-set 30–60% sensitivity band, middle | SPECULATION |
| `stackMult` | 1 | Open-source-best (SGLang-class) = 1.0 by construction | COMMUNITY ESTIMATE |
| `interact` | balanced | Balanced latency — neither batch-farm nor premium-interactive | SPECULATION |
| `batchShare` | 15 | Modest batch-tier adoption | SPECULATION |
| `discount` | 5 | Light enterprise discounting | SPECULATION |

### [replay] §10 dive (this model)

_Sets nothing — replays the model's own §10 dive fields (see each model's `dive.*` rows)._

### [range exploration] ≥90% · owned-TCO estate route

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | tco | Page-chosen owned-TCO basis — hourly cost built from capex, power, datacenter and opex | SPECULATION |
| `util` | 55 | Page-set 55% occupancy scenario value | SPECULATION |
| `stackMult` | 1.1 | Page-set 1.1× serving-stack scenario value | SPECULATION |
| `interact` | balanced | Central-scenario balanced latency | SPECULATION |
| `batchShare` | 15 | Central-scenario 15% batch-tier share | SPECULATION |
| `discount` | 5 | Central-scenario 5% blended discount | SPECULATION |

### [range exploration] 80–90% · market rents, aggressive stack, throughput

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Page-set market-rental basis | SPECULATION |
| `rentMult` | 1 | Market spot rate = this page's base H100 rate (1.0×) | COMMUNITY ESTIMATE |
| `util` | 70 | Page-set 70% fleet-utilization scenario value | SPECULATION |
| `stackMult` | 1.25 | Page-set 1.25× serving-stack scenario value | SPECULATION |
| `interact` | batch | Page-set throughput-first serving | SPECULATION |
| `batchShare` | 10 | Page-set 10% batch-price share | SPECULATION |
| `discount` | 0 | Page-set 0% negotiated discount | SPECULATION |

### [range exploration] 80–90% · sub-market rents, above-baseline stack

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Page-set market-rental basis | SPECULATION |
| `rentMult` | 0.9 | Page-set 0.90× scenario value | SPECULATION |
| `util` | 65 | Page-set 65% occupancy scenario value | SPECULATION |
| `stackMult` | 1.15 | Page-set 1.15× serving-stack scenario value | SPECULATION |
| `interact` | batch | Page-set throughput-first serving | SPECULATION |
| `batchShare` | 10 | Page-set 10% batch-price share | SPECULATION |
| `discount` | 0 | Page-set 0% negotiated discount | SPECULATION |

### [range exploration] <60% · reported-margin inverse diagnostic

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Page-chosen hyperscaler-rental basis to test the reported figures | SPECULATION |
| `rentMult` | 1.6 | Cloud list ≈1.5-1.8× neocloud (market observation, page-selected) | COMMUNITY ESTIMATE |
| `util` | 35 | Page-set 35% (peak-provisioning story) | SPECULATION |
| `stackMult` | 0.85 | Page-set 0.85× scenario value | SPECULATION |
| `interact` | balanced | Page-set balanced mode | SPECULATION |
| `batchShare` | 25 | Page-set 25% scenario value | SPECULATION |
| `discount` | 20 | Page-set 20% (enterprise discounting is real, the level is page-chosen) | SPECULATION |

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

### [SLO replay] Ant Group production H20 (<50ms)

| parameter | adopted value | source | label |
|---|---|---|---|
| `hwMode` | rent | Rental at the page's H20 IDC rate | SPECULATION |
| `rentMult` | 1 | 1.0 — Ant's own cost basis is undisclosed | SPECULATION |
| `util` | 100 | 100 = measured-operating-point convention (per-occupied-chip); Ant's fleet occupancy is undisclosed | SPECULATION (convention) |
| `stackMult` | 1 | 1.0 = the Pro tier this page's H20 MFU is fit to | DISCLOSED (anchor) |
| `interact` | batch | Their production batching | DISCLOSED |
| `batchShare` | 0 | Not applicable | SPECULATION |
| `discount` | 0 | Not applicable | SPECULATION |
| `blend` | {"h20":100} | H20-only (their published deployment) | DISCLOSED |

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

| platform | dense FP8 PF | HBM GB | BW TB/s | rent $/hr | capex $ | effDec | effPre | note |
|---|---|---|---|---|---|---|---|---|
| H100 SXM | 1.98 | 80 | 3.35 | 2.4 | 25000 | 0.07 | 0.15 | 2022. Anchor: DeepSeek served V3/R1 on H800 (H100-class compute). Prefill MFU is reconstructed FRESH-only (the disclosed 73.7k/node input flow includes the 56.3% disk-cache-hit share). |
| H200 | 1.98 | 141 | 4.8 | 2.9 | 32000 | 0.085 | 0.36 | Same compute as H100, 1.76× HBM capacity/1.4× bandwidth → better batching. |
| GB200 NVL72 | 5 | 186 | 8 | 4.5 | 45000 | 0.15 | 0.42 | 72-GPU NVLink domain (~$3-3.5M/rack ⇒ ~$44-49k/GPU). Per-GPU dense FP8 = 5.0 PF (NVIDIA sparse/dense split, verified — the widely-copied 4.5 PF is B200's). Anchor: vLLM ~10.1k decode tok/s/GPU on R1 reproduces at 15% MFU; the source run's precision basis (possibly NVFP4) is not fully pinned, so treat as an upper anchor. Neocloud rates $3.50-6/hr (Jul 2026). |
| GB300 NVL72 | 5 | 288 | 8 | 6 | 55000 | 0.127 | 0.45 | Blackwell Ultra: 15 PF dense FP4 (1.67× B200), 288GB HBM. Anchor: SGLang >12k tok/s/GPU on V4 Pro (FP4+MTP) reproduces at 12.7% × 1.85 FP4 using the now-DISCLOSED 49B active (v1 fit assumed ~66B); InferenceX ~17× H100 FP8. xjdr served GLM 5.2 on these ($4-7/hr early rates). |
| H800 (China) | 1.98 | 80 | 3.35 | 1.75 | 40000 | 0.07 | 0.15 | H100 compute with NVLink capped at 400GB/s (export SKU, finite pre-ban stock — capex carries the scarcity premium). THE DeepSeek V3/R1 workhorse. Prefill MFU = FRESH-only reconstruction (~4,026 tok/s/GPU net of the 56.3% disk-cache share; the raw 9,212 aggregate includes cache hits). Annual-commit IDC rate $1.47-2.06/hr mid-2026; DeepSeek's 2025 disclosure assumed $2/hr. |
| H20 (China) | 0.296 | 96 | 4 | 1 | 20000 | 0.17 | 0.5 | The China-legal NVIDIA SKU: only 296 TF dense FP8 but 4.0 TB/s HBM — decode is bandwidth-bound, so it serves far better than its FLOPS suggest (hence the high effective MFU vs a tiny denominator). Default 17% = the hardware dive's NEUTRAL recommendation (~680 tok/s at the tighter Ant Pro tier); the relaxed <70ms production anchor (714 tok/s) reproduces at 18%. Rental class matters: same chip spans ~$0.76 (IDC annual) to $7+ (hyperscaler on-demand). |
| TPU v7 Ironwood | 4.61 | 192 | 7.37 | 4.2 | 35000 | 0.13 | 0.4 | Google's inference TPU (GA Mar 31, 2026): 4,614 TF FP8 ≈ B200-class, 9,216-chip pods. Anthropic committed up to ~1M TPUs (Oct 2025). 2026-07-15 dive: named-model accelerator-rental anchors now exist (Qwen3-Coder-480B, 4 chips, 518.86 tok/s/chip ⇒ $6.42/M output on-demand, $2.89/M 3-yr) — not yet fitted into this roofline's MFU (effDec/effPre above stay analyst estimates). Google-internal fleet cost still unknown: no public Gemini-SKU→TPU mapping exists — estimates. |
| Trainium2 | 1.3 | 96 | 2.9 | 1.5 | 15000 | 0.055 | 0.3 | GA Dec 2024. Project Rainier launched with ~500k Trainium2 for Anthropic (activated ~Nov 2025, confirmed running Claude inference alongside training); Anthropic reported >1M Trainium2 in use across AWS by Apr 2026 — inference/training allocation, utilization and internal rate undisclosed. 2026-07-15 dive: a narrow public ENGINEERING anchor exists (AWS Neuron tutorials, batch=1/concurrency=1: Llama 3.3 70B spec-decode $68.90/M output tokens, Llama 3.1 405B $98.65/M) — not a production-TCO measurement, not fitted into this roofline. Cheap per chip, weaker software stack — estimates. |
| Trainium3 | 2.51 | 144 | 4.9 | 2.2 | 20000 | 0.08 | 0.34 | GA Dec 2025: 144-chip UltraServers, 362 PF FP8 ⇒ 2.51 PF/chip, 144GB HBM3e. AWS's aggressive cost-per-token play — pricing estimates. 2026-07-15 dive: AWS has published a GPT-OSS-120B inference recipe but no achieved tok/s and no public Trn3 instance/UltraServer price — neither side of $/token is public; NO public serving anchor of any kind (confirmed negative). |
| Ascend 910C | 1.504 | 128 | 3.2 | 1.95 | 23000 | 0.07 | 0.28 | Huawei's dual-die flagship (SMIC 7nm). NO native FP8 — 8-bit here means INT8 (1.504 PF per Huawei's Atlas spec; a widely-quoted 1,054 figure is a typo in the CloudMatrix paper). Default 7% = the hardware dive's NEUTRAL recommendation (~1,420 tok/s on R1-class; range 5-10%): Huawei's own optimized 384-NPU CloudMatrix anchor (1,943 tok/s) reproduces at 9.5% (stack ≈1.36), while DeepSeek's internal '60% of H100' eval implies ~5.5-6.5%. Rent = Huatai procurement award ($1.71-2.25/hr); CloudMatrix 384 ≈ RMB 60M. |

_265 parameter rows, regenerated from the registry on every run — `node build-grounding-ledger.mjs`._
