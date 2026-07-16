# Preset grounding pack — dated re-audit (GPT-5.6 Pro re-emission, 2026-07-11)

> **Provenance class: author-model re-emission, not an independently verified original.** The original pack's full row set lived in conversation-sandbox files that expired. On 2026-07-11 the same GPT-5.6 Pro project was asked to re-emit the pack inline; it reports having located its own retained "22:29 UTC final export" and re-emitting it exactly (run 21m0s, Pro-verified, `completion_path: api`, conversation archived privately). That exactness claim is the model's own and cannot be independently byte-verified — which is why the site's authoritative parameter record is the [adopted grounding ledger](grounding-ledger.html), generated from the deployed preset registry. **Where this page and the ledger differ, the ledger wins.**
> **SHA-256 (response body below the delta section):** `c4a8bc8219d952895f6c73004e6547c3872f46e6930cbdd37e994c2ec5e6d197`

## Delta vs the adopted values (checked 2026-07-11)

Tariff and architecture rows were checked against the deployed presets: **all mappable tariff rows (prices, cached-input ratios, context/output limits) and all disclosed architecture rows match the adopted values.** The differences are where the site's council-gated ship list deliberately departed from the pack's recommendations, plus two modeling-mechanism differences:

| area | this re-audit says | site adopted | why the site differs |
|---|---|---|---|
| DeepSeek V4-Flash fleet blend | Ascend .50 / H800 .35 / H20 .15 | H800 50 / H20 20 / Ascend 30 | Council ship list kept the V4-family blend consistent with the V4 Pro dive scenario; both are labeled assumptions |
| GLM-4.7 fleet blend | Ascend .70 / H800 .20 / H20 .10 | Ascend 40 / H800 40 / H20 20 | Adopted blend mirrors GLM-5.2's (same serving estate); both speculative |
| GPT-5.6 Terra/Luna blends | include a B200 class | H100/H200/GB200/GB300 | The calculator's hardware table does not model B200 separately; GB200 row carries the Blackwell class |
| Gemini 3.5 Flash fleet | TPUv7 .60 / v6e .30 / v5e .10 | TPU v7 100% | Older TPU generations are not modeled; the single-row simplification is stated in the preset note |
| xAI valuation mechanism | GB300-only replica, chip-hour override ($0.60 / $5.27), MFU override 0.02, util = 1 | rentMult 0.156 / 1.37 on the Colossus blend (weighted rent $3.85/hr → $0.60 / $5.27), util 48 | Same $/GPU-hour by construction; the site expresses it through the blend-relative multiplier so the lens composes with the model's fleet |
| Ant H20 SLO mechanism | effective-MFU override 0.16875 (Pro tier) | H20 effDec default 0.17 + stack 1.0 | Same operating point within rounding (the site's neutral default was fit to this anchor) |
| China on-demand multiplier | 6.152857142857143 | 6.15 | Display rounding; the ledger records 6.15 as adopted |

Rows describing candidate presets the council rejected (Anthropic-strategic merge, reported-margin-implied, Kimi K2.6, Grok 4.3) are absent from both the re-audit's final export and the site — consistent.

---

I’m reconstructing the annex from project artifacts and live presets, verifying volatile values against authoritative sources, and explicitly marking any irrecoverable rows rather than inferring them.

The archived consultation confirms 192 rows and preserves adopted tariff scenarios and China procurement multipliers; I’m extracting deployed static definitions to avoid fresh approximations.

I located the exact July 10 final JSON and Markdown exports, plus earlier versions for delta checking, enabling exact recovery of the row set.

# Inference Margins preset grounding pack — durable inline export

According to a document from 2026-07-10, this is the recovered **22:29 UTC final export**. It contains **192 preset parameter rows**: 78 PERSPECTIVE rows and 114 MODEL rows. **OMITTED-UNRECONSTRUCTED: none.** fileciteturn33file8

The recovered evidence labels map to the requested source classes as follows: `DISCLOSED` → **first-party**; `CREDIBLY REPORTED` → **credible-secondary**; `COMMUNITY ESTIMATE` → **community**; `SPECULATION` → **assumption**.

## Schema and implementation semantics — not counted in the 192 preset rows

| parameter | value | unit | source (URL) | source class | as-of date | note |
|---|---:|---|---|---|---|---|
| `meta.presetRowCount` | `192` | rows | https://inference-margins.pages.dev/ | community | 2026-07-10 | 78 PERSPECTIVE rows plus 114 MODEL rows. |
| `meta.outputCostUSDPerToken` | `(chipHourUSD / 3600 / outputTokPerSecPerChip) / utilization` | formula | https://inference-margins.pages.dev/ | community | 2026-07-10 | Calculator output-token cost equation. |
| `meta.outputTokPerSecPerChip` | `dense8bitFLOPS × precisionMult × effectiveMFU × interactivityMult / (2 × activeParams)` | formula | https://inference-margins.pages.dev/ | community | 2026-07-10 | Calculator throughput equation. |
| `meta.tokenPriceUnit` | `USD per 1,000,000 tokens` | convention | https://inference-margins.pages.dev/ | community | 2026-07-10 | Applies to input, cached input, cache write and output tariff fields. |
| `meta.chipHourUnit` | `USD per accelerator-hour` | convention | https://inference-margins.pages.dev/ | community | 2026-07-10 | “Card-hour” and “GPU-hour” rows are normalized to the named accelerator. |
| `meta.throughputUnit` | `aggregate output tokens/s/accelerator` | convention | https://inference-margins.pages.dev/ | community | 2026-07-10 | Unless a row explicitly states another denominator. |
| `meta.parameterCountUnit` | `billions of parameters` | convention | https://inference-margins.pages.dev/ | community | 2026-07-10 | Applies to total and active parameter fields. |
| `meta.nullSemantics` | `unknown / leave unset, never zero` | rule | https://inference-margins.pages.dev/ | assumption | 2026-07-10 | A published zero tariff remains zero; an undisclosed field is null. |
| `meta.effectiveMFUOverrideRule` | `mutually exclusive with fallback interactivity multiplier` | rule | https://inference-margins.pages.dev/ | assumption | 2026-07-10 | Never apply both representations to one calculation. |
| `meta.measuredThroughputUtilizationRule` | `utilization = 1 for measured saturated per-occupied-chip throughput` | rule | https://inference-margins.pages.dev/ | assumption | 2026-07-10 | Fleet occupancy is a separate allocation question. |
| `meta.batchShareSemantics` | `customer-token share receiving a published asynchronous batch tariff` | rule | https://inference-margins.pages.dev/ | assumption | 2026-07-10 | Internal continuous batching is not customer-visible Batch API usage. |
| `meta.chinaPublicCloudFallback` | `rentMult.globalFallback = 6.152857142857143` | multiplier | https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | Prefer supported per-chip multipliers; use this only when one scalar is required. |
| `meta.tariffScenarioSemantics` | `price and endpoint metadata grounded; topology, parameters, precision, workload and fleet remain scenarios` | rule | https://inference-margins.pages.dev/ | assumption | 2026-07-10 | Applies to visibly marked TARIFF SCENARIO presets. |

## Provider tariffs and endpoint limits — 55 rows

| parameter | value | unit | source (URL) | source class | as-of date | note |
|---|---:|---|---|---|---|---|
| `DeepSeek V4-Flash.contextTokens` | `1000000` | tokens | https://api-docs.deepseek.com/quick_start/pricing | first-party | 2026-07-10 | Official standard context. |
| `DeepSeek V4-Flash.maxOutputTokens` | `384000` | tokens | https://api-docs.deepseek.com/quick_start/pricing | first-party | 2026-07-10 | Official maximum output. |
| `DeepSeek V4-Flash.price.inputMiss` | `0.14` | USD/million input tokens | https://api-docs.deepseek.com/quick_start/pricing | first-party | 2026-07-10 | Official rate card checked 2026-07-10. |
| `DeepSeek V4-Flash.price.inputHit` | `0.0028` | USD/million cached-input tokens | https://api-docs.deepseek.com/quick_start/pricing | first-party | 2026-07-10 | Official rate card checked 2026-07-10. |
| `DeepSeek V4-Flash.price.output` | `0.28` | USD/million output tokens | https://api-docs.deepseek.com/quick_start/pricing | first-party | 2026-07-10 | Official rate card checked 2026-07-10. |
| `DeepSeek V4-Flash.price.cacheWrite` | `null (leave unset)` | USD/million cache-write tokens | https://api-docs.deepseek.com/quick_start/pricing | first-party | 2026-07-10 | No separate cache-write tariff shown. |
| `DeepSeek V4-Flash.price.cacheStoragePerMtokHour` | `null (leave unset)` | USD/million cached tokens-hour | https://api-docs.deepseek.com/quick_start/pricing | first-party | 2026-07-10 | No cache-storage tariff shown. |
| `DeepSeek V4-Flash.batchDiscount` | `null (leave unset)` | fraction | https://api-docs.deepseek.com/quick_start/pricing | first-party | 2026-07-10 | No V4-Flash batch tariff shown. |
| `DeepSeek V4-Flash.concurrency` | `2500` | concurrent requests | https://api-docs.deepseek.com/quick_start/pricing | first-party | 2026-07-10 | Official V4-Flash concurrency tier; not sequences per accelerator. |
| `GLM-4.7.contextTokens` | `200000` | tokens | https://docs.z.ai/guides/llm/glm-4.7 | first-party | 2026-07-10 | Official model guide. |
| `GLM-4.7.maxOutputTokens` | `128000` | tokens | https://docs.z.ai/guides/llm/glm-4.7 | first-party | 2026-07-10 | Official model guide. |
| `GLM-4.7.price.inputMiss` | `0.6` | USD/million input tokens | https://docs.z.ai/guides/overview/pricing | first-party | 2026-07-10 | Official rate card checked 2026-07-10. |
| `GLM-4.7.price.inputHit` | `0.11` | USD/million cached-input tokens | https://docs.z.ai/guides/overview/pricing | first-party | 2026-07-10 | Official rate card checked 2026-07-10. |
| `GLM-4.7.price.output` | `2.2` | USD/million output tokens | https://docs.z.ai/guides/overview/pricing | first-party | 2026-07-10 | Official rate card checked 2026-07-10. |
| `GLM-4.7.price.cacheWrite` | `null (leave unset)` | USD/million cache-write tokens | https://docs.z.ai/guides/overview/pricing | first-party | 2026-07-10 | No separate cache-write price shown. |
| `GLM-4.7.price.cacheStoragePerMtokHour` | `0` | USD/million cached tokens-hour | https://docs.z.ai/guides/overview/pricing | first-party | 2026-07-10 | Rate card states “Limited-time Free”; zero is a published temporary tariff, not unknown. |
| `GLM-4.7.batchDiscount` | `null (leave unset)` | fraction | https://docs.z.ai/guides/overview/pricing | first-party | 2026-07-10 | No GLM-4.7 batch tariff shown. |
| `GLM-4.7.concurrency` | `null (leave unset)` | concurrent requests | https://docs.z.ai/guides/llm/glm-4.7<br>https://docs.z.ai/guides/overview/pricing | first-party | 2026-07-10 | No model-specific public concurrency tier identified. |
| `GPT-5.6 Terra.contextTokens` | `1050000` | tokens | https://developers.openai.com/api/docs/models/gpt-5.6-terra | first-party | 2026-07-10 | Official endpoint page. |
| `GPT-5.6 Terra.maxOutputTokens` | `128000` | tokens | https://developers.openai.com/api/docs/models/gpt-5.6-terra | first-party | 2026-07-10 | Official endpoint page. |
| `GPT-5.6 Terra.longContextThresholdInputTokens` | `272000` | input tokens | https://developers.openai.com/api/docs/models/gpt-5.6-terra | first-party | 2026-07-10 | Above 272K input, the entire request reprices at 2× input and 1.5× output. |
| `GPT-5.6 Terra.price.inputMiss.short` | `2.5` | USD/million input tokens | https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official standard short-context rate. |
| `GPT-5.6 Terra.price.inputHit.short` | `0.25` | USD/million cached-input tokens | https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official cached-input short-context rate. |
| `GPT-5.6 Terra.price.cacheWrite.short` | `3.125` | USD/million cache-write tokens | https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official cache-write short-context rate. |
| `GPT-5.6 Terra.price.output.short` | `15` | USD/million output tokens | https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official standard short-context output rate. |
| `GPT-5.6 Terra.price.inputMiss.long` | `5` | USD/million input tokens | https://developers.openai.com/api/docs/models/gpt-5.6-terra<br>https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official >272K whole-request tariff. |
| `GPT-5.6 Terra.price.inputHit.long` | `0.5` | USD/million cached-input tokens | https://developers.openai.com/api/docs/models/gpt-5.6-terra<br>https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official >272K whole-request tariff. |
| `GPT-5.6 Terra.price.cacheWrite.long` | `6.25` | USD/million cache-write tokens | https://developers.openai.com/api/docs/models/gpt-5.6-terra<br>https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official >272K whole-request tariff. |
| `GPT-5.6 Terra.price.output.long` | `22.5` | USD/million output tokens | https://developers.openai.com/api/docs/models/gpt-5.6-terra<br>https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official >272K whole-request tariff. |
| `GPT-5.6 Terra.price.cacheStoragePerMtokHour` | `null (leave unset)` | USD/million cached tokens-hour | https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | No persistent cache-storage tariff shown. |
| `GPT-5.6 Terra.batchDiscount` | `0.5` | fraction | https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Batch and Flex are exactly half Standard rates. |
| `GPT-5.6 Terra.concurrency` | `null (leave unset)` | concurrent requests | https://developers.openai.com/api/docs/models/gpt-5.6-terra | first-party | 2026-07-10 | No model-specific public concurrency tier identified. |
| `GPT-5.6 Luna.contextTokens` | `1050000` | tokens | https://developers.openai.com/api/docs/models/gpt-5.6-luna | first-party | 2026-07-10 | Official endpoint page. |
| `GPT-5.6 Luna.maxOutputTokens` | `128000` | tokens | https://developers.openai.com/api/docs/models/gpt-5.6-luna | first-party | 2026-07-10 | Official endpoint page. |
| `GPT-5.6 Luna.longContextThresholdInputTokens` | `272000` | input tokens | https://developers.openai.com/api/docs/models/gpt-5.6-luna | first-party | 2026-07-10 | Above 272K input, the entire request reprices at 2× input and 1.5× output. |
| `GPT-5.6 Luna.price.inputMiss.short` | `1` | USD/million input tokens | https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official standard short-context rate. |
| `GPT-5.6 Luna.price.inputHit.short` | `0.1` | USD/million cached-input tokens | https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official cached-input short-context rate. |
| `GPT-5.6 Luna.price.cacheWrite.short` | `1.25` | USD/million cache-write tokens | https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official cache-write short-context rate. |
| `GPT-5.6 Luna.price.output.short` | `6` | USD/million output tokens | https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official standard short-context output rate. |
| `GPT-5.6 Luna.price.inputMiss.long` | `2` | USD/million input tokens | https://developers.openai.com/api/docs/models/gpt-5.6-luna<br>https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official >272K whole-request tariff. |
| `GPT-5.6 Luna.price.inputHit.long` | `0.2` | USD/million cached-input tokens | https://developers.openai.com/api/docs/models/gpt-5.6-luna<br>https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official >272K whole-request tariff. |
| `GPT-5.6 Luna.price.cacheWrite.long` | `2.5` | USD/million cache-write tokens | https://developers.openai.com/api/docs/models/gpt-5.6-luna<br>https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official >272K whole-request tariff. |
| `GPT-5.6 Luna.price.output.long` | `9` | USD/million output tokens | https://developers.openai.com/api/docs/models/gpt-5.6-luna<br>https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Official >272K whole-request tariff. |
| `GPT-5.6 Luna.price.cacheStoragePerMtokHour` | `null (leave unset)` | USD/million cached tokens-hour | https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | No persistent cache-storage tariff shown. |
| `GPT-5.6 Luna.batchDiscount` | `0.5` | fraction | https://developers.openai.com/api/docs/pricing | first-party | 2026-07-10 | Batch and Flex are exactly half Standard rates. |
| `GPT-5.6 Luna.concurrency` | `null (leave unset)` | concurrent requests | https://developers.openai.com/api/docs/models/gpt-5.6-luna | first-party | 2026-07-10 | No model-specific public concurrency tier identified. |
| `Gemini 3.5 Flash.contextTokens` | `1048576` | tokens | https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash | first-party | 2026-07-10 | Official model/API limit. |
| `Gemini 3.5 Flash.maxOutputTokens` | `65536` | tokens | https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash<br>https://deepmind.google/models/model-cards/gemini-3-5-flash/ | first-party | 2026-07-10 | Official model/API limit. |
| `Gemini 3.5 Flash.price.inputMiss` | `1.5` | USD/million input tokens | https://ai.google.dev/gemini-api/docs/pricing | first-party | 2026-07-10 | Official rate card checked 2026-07-10. |
| `Gemini 3.5 Flash.price.inputHit` | `0.15` | USD/million cached-input tokens | https://ai.google.dev/gemini-api/docs/pricing | first-party | 2026-07-10 | Official context-caching tariff. |
| `Gemini 3.5 Flash.price.output` | `9` | USD/million output tokens | https://ai.google.dev/gemini-api/docs/pricing | first-party | 2026-07-10 | Official output tariff; output includes thinking tokens. |
| `Gemini 3.5 Flash.price.cacheWrite` | `null (leave unset)` | USD/million cache-write tokens | https://ai.google.dev/gemini-api/docs/pricing | first-party | 2026-07-10 | No separate cache-write tariff; creation is billed through input plus storage. |
| `Gemini 3.5 Flash.price.cacheStoragePerMtokHour` | `1` | USD/million cached tokens-hour | https://ai.google.dev/gemini-api/docs/pricing | first-party | 2026-07-10 | Official explicit-caching storage rate. |
| `Gemini 3.5 Flash.batchDiscount` | `0.5` | fraction | https://ai.google.dev/gemini-api/docs/pricing | first-party | 2026-07-10 | Batch input, cached input and output are half Standard rates. |
| `Gemini 3.5 Flash.concurrency` | `null (leave unset)` | concurrent requests | https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash<br>https://ai.google.dev/gemini-api/docs/pricing | first-party | 2026-07-10 | No model-specific public concurrency tier identified. |

## Model architectures and parameterization — 32 rows

| parameter | value | unit | source (URL) | source class | as-of date | note |
|---|---:|---|---|---|---|---|
| `DeepSeek V4-Flash.architecture` | `MoE + token-wise compression + DSA` | text | https://api-docs.deepseek.com/news/news260424 | first-party | 2026-07-10 | Official V4 release and linked technical report. |
| `DeepSeek V4-Flash.totalParamsB` | `284` | billion parameters | https://api-docs.deepseek.com/news/news260424 | first-party | 2026-07-10 | Official V4-Flash disclosure. |
| `DeepSeek V4-Flash.activeParamsB` | `13` | billion active parameters | https://api-docs.deepseek.com/news/news260424 | first-party | 2026-07-10 | Official V4-Flash disclosure. |
| `DeepSeek V4-Flash.precisionMult` | `1.85` | multiplier | https://api-docs.deepseek.com/news/news260424 | assumption | 2026-07-10 | Selective low-precision calculator scenario; not a disclosed end-to-end production speedup. |
| `GLM-4.7.architecture` | `MoE + MTP; interleaved/preserved thinking` | text | https://github.com/zai-org/GLM-4.5/blob/main/README.md | first-party | 2026-07-10 | Official repository and serving recipes. |
| `GLM-4.7.totalParamsB` | `355` | billion parameters | https://github.com/zai-org/GLM-4.5/blob/main/README.md | first-party | 2026-07-10 | Official GLM-4.7 model download table. |
| `GLM-4.7.activeParamsB` | `32` | billion active parameters | https://github.com/zai-org/GLM-4.5/blob/main/README.md | first-party | 2026-07-10 | Official GLM-4.7 model download table. |
| `GLM-4.7.precisionMult` | `1` | multiplier | https://github.com/zai-org/GLM-4.5/blob/main/README.md | assumption | 2026-07-10 | BF16 and FP8 weights are published, but hosted numerical format is unknown; retain dense-8-bit baseline. |
| `GPT-5.6 Terra.architecture` | `sparse/MoE-family scenario — UNKNOWN` | text | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | OpenAI does not disclose architecture; scenario only. |
| `GPT-5.6 Terra.totalParamsB.central` | `1000` | billion parameters | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Project OpenAI deep-dive scenario. |
| `GPT-5.6 Terra.totalParamsB.min` | `250` | billion parameters | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Subjective scenario range. |
| `GPT-5.6 Terra.totalParamsB.max` | `5000` | billion parameters | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Subjective scenario range. |
| `GPT-5.6 Terra.activeParamsB.central` | `50` | billion active parameters | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Project OpenAI deep-dive scenario. |
| `GPT-5.6 Terra.activeParamsB.min` | `20` | billion active parameters | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Subjective scenario range. |
| `GPT-5.6 Terra.activeParamsB.max` | `110` | billion active parameters | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Subjective scenario range. |
| `GPT-5.6 Terra.precisionMult` | `1.35` | multiplier | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Mixed FP8/MXFP4-equivalent calculator scenario; production numerical format is undisclosed. |
| `GPT-5.6 Luna.architecture` | `sparse/MoE-family scenario — UNKNOWN` | text | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | OpenAI does not disclose architecture; scenario only. |
| `GPT-5.6 Luna.totalParamsB.central` | `250` | billion parameters | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Project OpenAI deep-dive scenario. |
| `GPT-5.6 Luna.totalParamsB.min` | `50` | billion parameters | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Subjective scenario range. |
| `GPT-5.6 Luna.totalParamsB.max` | `1500` | billion parameters | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Subjective scenario range. |
| `GPT-5.6 Luna.activeParamsB.central` | `20` | billion active parameters | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Project OpenAI deep-dive scenario. |
| `GPT-5.6 Luna.activeParamsB.min` | `8` | billion active parameters | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Subjective scenario range. |
| `GPT-5.6 Luna.activeParamsB.max` | `50` | billion active parameters | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Subjective scenario range. |
| `GPT-5.6 Luna.precisionMult` | `1.35` | multiplier | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Mixed FP8/MXFP4-equivalent calculator scenario; production numerical format is undisclosed. |
| `Gemini 3.5 Flash.architecture` | `natively multimodal reasoning; topology undisclosed` | text | https://deepmind.google/models/model-cards/gemini-3-5-flash/ | first-party | 2026-07-10 | Official model card; topology is not disclosed. |
| `Gemini 3.5 Flash.totalParamsB.central` | `600` | billion parameters | https://inference-margins.pages.dev/research/google-gptpro | assumption | 2026-07-10 | Google-dive scenario, not a leak. |
| `Gemini 3.5 Flash.totalParamsB.min` | `400` | billion parameters | https://inference-margins.pages.dev/research/google-gptpro | assumption | 2026-07-10 | Scenario bracket. |
| `Gemini 3.5 Flash.totalParamsB.max` | `1200` | billion parameters | https://inference-margins.pages.dev/research/google-gptpro | assumption | 2026-07-10 | Scenario bracket. |
| `Gemini 3.5 Flash.activeParamsB.central` | `20` | billion active parameters | https://inference-margins.pages.dev/research/google-gptpro | assumption | 2026-07-10 | Google-dive scenario. |
| `Gemini 3.5 Flash.activeParamsB.min` | `10` | billion active parameters | https://inference-margins.pages.dev/research/google-gptpro | assumption | 2026-07-10 | Scenario bracket. |
| `Gemini 3.5 Flash.activeParamsB.max` | `50` | billion active parameters | https://inference-margins.pages.dev/research/google-gptpro | assumption | 2026-07-10 | Scenario bracket. |
| `Gemini 3.5 Flash.precisionMult` | `1` | multiplier | https://inference-margins.pages.dev/research/google-gptpro | assumption | 2026-07-10 | Dense-8-bit calculator baseline; hosted production precision is undisclosed. |

## Hardware rates by procurement class — 23 rows

| parameter | value | unit | source (URL) | source class | as-of date | note |
|---|---:|---|---|---|---|---|
| `xAI cash-marginal.costBasisMode` | `cash-marginal` | mode | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Strict short-run economic lens: sunk hardware; only incremental power, cooling, maintenance and operations are marginal. |
| `xAI cash-marginal.chipHourUSD` | `0.6` | USD/accelerator-hour | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Central strict short-run cash value. |
| `xAI cash-marginal.rentMult` | `1` | multiplier | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Direct chip-hour override; do not apply a second procurement scalar. |
| `xAI cash-marginal.derived.outputCostUSDPerMtok` | `0.6666666666666667` | USD/million output tokens | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | 0.60 ÷ 3600 ÷ 250 × 1,000,000. |
| `xAI opportunity-cost.costBasisMode` | `external-opportunity-value` | mode | https://content.spacex.com/cms-assets/FINAL_Documents%20and%20Updates/SpaceX%20-%20EU%20Prospectus%20%28Approved%20by%20Bafin%29%20-%20June%205%2C%202026.pdf<br>https://inference-margins.pages.dev/research/xai-gptpro | credible-secondary | 2026-07-10 | Allocation lens defined from the Anthropic capacity agreement; this is foregone external revenue, not xAI production cost. |
| `xAI opportunity-cost.chipHourUSD` | `5.27` | USD/accelerator-hour | https://content.spacex.com/cms-assets/FINAL_Documents%20and%20Updates/SpaceX%20-%20EU%20Prospectus%20%28Approved%20by%20Bafin%29%20-%20June%205%2C%202026.pdf | credible-secondary | 2026-07-10 | $1.25B/month ÷ 325,000 named GPUs ÷ 730 h/month = $5.267…; the contract bundle also includes CPUs, storage and networking. |
| `xAI opportunity-cost.rentMult` | `1` | multiplier | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Direct chip-hour override; do not apply a second procurement scalar. |
| `xAI opportunity-cost.derived.outputCostUSDPerMtok` | `5.855555555555555` | USD/million output tokens | https://content.spacex.com/cms-assets/FINAL_Documents%20and%20Updates/SpaceX%20-%20EU%20Prospectus%20%28Approved%20by%20Bafin%29%20-%20June%205%2C%202026.pdf<br>https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | 5.27 ÷ 3600 ÷ 250 × 1,000,000. |
| `China public-cloud on-demand.baseAnnualChipHourUSD.H800` | `1.75` | USD/card-hour | https://inference-margins.pages.dev/research/chinese-accel-gptpro | community | 2026-07-10 | Calculator annual-commit central value used as the H800 denominator. |
| `China public-cloud on-demand.baseAnnualChipHourUSD.H20` | `1` | USD/card-hour | https://inference-margins.pages.dev/research/chinese-accel-gptpro | community | 2026-07-10 | Calculator annual-commit central value used as the H20 denominator. |
| `China public-cloud on-demand.baseAnnualChipHourUSD.Ascend910C` | `1.95` | USD/card-hour | https://inference-margins.pages.dev/research/chinese-accel-gptpro | credible-secondary | 2026-07-10 | Huatai one-year private-cloud procurement midpoint used as the annual 910C baseline. |
| `China public-cloud on-demand.rateCard.Tencent.H800.HCC.monthly` | `10.615` | USD/card-hour | https://inference-margins.pages.dev/research/chinese-accel-gptpro | first-party | 2026-07-10 | Midpoint of $10.55–$10.68 per card-hour for the eight-card monthly HCC product. |
| `China public-cloud on-demand.rateCard.Tencent.H20.PNV6.onDemand` | `4.48` | USD/card-hour | https://inference-margins.pages.dev/research/chinese-accel-gptpro | first-party | 2026-07-10 | Tencent PNV6 posted on-demand normalization. |
| `China public-cloud on-demand.rateCard.Tencent.H20.HCC.onDemandMid` | `5.08` | USD/card-hour | https://inference-margins.pages.dev/research/chinese-accel-gptpro | first-party | 2026-07-10 | Midpoint of the $3.91–$6.25 per-card-hour HCC-PNV6 bundle spread. |
| `China public-cloud on-demand.rateCard.Alibaba.H20.96G.onDemand` | `7.4` | USD/card-hour | https://inference-margins.pages.dev/research/chinese-accel-gptpro | first-party | 2026-07-10 | Alibaba RDS Custom AI H20-96G normalization. |
| `China public-cloud on-demand.rateCard.Alibaba.H20.141G.onDemand` | `10.62` | USD/card-hour | https://inference-margins.pages.dev/research/chinese-accel-gptpro | first-party | 2026-07-10 | Alibaba RDS Custom AI H20-141G normalization. |
| `China public-cloud on-demand.chipHourUSD.H20.representative` | `6.24` | USD/card-hour | https://inference-margins.pages.dev/research/chinese-accel-gptpro | community | 2026-07-10 | Median of [4.48, 5.08, 7.40, 10.62] = (5.08 + 7.40) ÷ 2. |
| `China public-cloud on-demand.rentMult.H20` | `6.24` | multiplier | https://inference-margins.pages.dev/research/chinese-accel-gptpro | community | 2026-07-10 | 6.24 ÷ annual H20 default 1.00. |
| `China public-cloud on-demand.rentMult.H800` | `6.065714285714286` | multiplier | https://inference-margins.pages.dev/research/chinese-accel-gptpro | community | 2026-07-10 | 10.615 ÷ annual H800 default 1.75. |
| `China public-cloud on-demand.rentMult.globalFallback` | `6.152857142857143` | multiplier | https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | Mean of H20 multiplier 6.24 and H800 multiplier 6.065714285714286. |
| `China public-cloud on-demand.rentMult` | `6.152857142857143` | multiplier | https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | Compatibility alias for rentMult.globalFallback when the calculator supports only one procurement multiplier. |
| `China public-cloud on-demand.rentMult.Ascend910CProxy` | `6.152857142857143` | multiplier | https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | Apply the global public-cloud fallback because no reproducible public on-demand 910C tariff was found. |
| `China public-cloud on-demand.chipHourUSD.Ascend910CProxy` | `11.998071428571428` | USD/card-hour | https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | 1.95 × 6.152857142857143; explicit scalar proxy, not a reproduced Huawei public retail price. |

## Hardware fleet routing and blend assumptions — 20 rows

| parameter | value | unit | source (URL) | source class | as-of date | note |
|---|---:|---|---|---|---|---|
| `xAI cash-marginal.hardwareFleetBlend.GB300` | `1` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Central 8×GB300 Grok 4.5 replica scenario. |
| `xAI opportunity-cost.hardwareFleetBlend.GB300` | `1` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Central 8×GB300 Grok 4.5 replica scenario. |
| `Ant Group production H20 (SLO replay).hardwareFleetBlend.H20` | `1` | fraction | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | first-party | 2026-07-10 | Operator benchmark hardware. |
| `DeepSeek V4-Flash.hardwareFleetBlend.Ascend910C_proxy_for_950` | `0.5` | fraction | https://inference-margins.pages.dev/research/deepseek-gptpro<br>https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | DeepSeek 2026 serving prior; 910C is an explicit calculator proxy for newer Ascend hardware. |
| `DeepSeek V4-Flash.hardwareFleetBlend.H800` | `0.35` | fraction | https://inference-margins.pages.dev/research/deepseek-gptpro | assumption | 2026-07-10 | DeepSeek 2026 serving prior; no audited shares. |
| `DeepSeek V4-Flash.hardwareFleetBlend.H20` | `0.15` | fraction | https://inference-margins.pages.dev/research/deepseek-gptpro | assumption | 2026-07-10 | DeepSeek 2026 serving prior; no audited shares. |
| `GLM-4.7.hardwareFleetBlend.Ascend910C_proxy_for_domestic_other` | `0.7` | fraction | https://inference-margins.pages.dev/research/zhipu-gptpro<br>https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | Domestic-accelerator scenario; proxy for a broader domestic pool. |
| `GLM-4.7.hardwareFleetBlend.H800` | `0.2` | fraction | https://inference-margins.pages.dev/research/zhipu-gptpro | assumption | 2026-07-10 | Mixed-fleet scenario. |
| `GLM-4.7.hardwareFleetBlend.H20` | `0.1` | fraction | https://inference-margins.pages.dev/research/zhipu-gptpro | assumption | 2026-07-10 | Mixed-fleet scenario. |
| `GPT-5.6 Terra.hardwareFleetBlend.H100` | `0.25` | fraction | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Partner-hosted Hopper/Blackwell routing scenario. |
| `GPT-5.6 Terra.hardwareFleetBlend.H200` | `0.2` | fraction | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Partner-hosted Hopper/Blackwell routing scenario. |
| `GPT-5.6 Terra.hardwareFleetBlend.B200` | `0.2` | fraction | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Partner-hosted Hopper/Blackwell routing scenario. |
| `GPT-5.6 Terra.hardwareFleetBlend.GB200` | `0.35` | fraction | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Partner-hosted Hopper/Blackwell routing scenario. |
| `GPT-5.6 Luna.hardwareFleetBlend.H100` | `0.35` | fraction | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Partner-hosted Hopper/Blackwell routing scenario. |
| `GPT-5.6 Luna.hardwareFleetBlend.H200` | `0.3` | fraction | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Partner-hosted Hopper/Blackwell routing scenario. |
| `GPT-5.6 Luna.hardwareFleetBlend.B200` | `0.15` | fraction | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Partner-hosted Hopper/Blackwell routing scenario. |
| `GPT-5.6 Luna.hardwareFleetBlend.GB200` | `0.2` | fraction | https://inference-margins.pages.dev/research/openai-gptpro | assumption | 2026-07-10 | Partner-hosted Hopper/Blackwell routing scenario. |
| `Gemini 3.5 Flash.hardwareFleetBlend.TPUv7` | `0.6` | fraction | https://inference-margins.pages.dev/research/google-gptpro | assumption | 2026-07-10 | Google-dive serving-generation scenario. |
| `Gemini 3.5 Flash.hardwareFleetBlend.TPUv6e` | `0.3` | fraction | https://inference-margins.pages.dev/research/google-gptpro | assumption | 2026-07-10 | Google-dive serving-generation scenario. |
| `Gemini 3.5 Flash.hardwareFleetBlend.TPUv5e` | `0.1` | fraction | https://inference-margins.pages.dev/research/google-gptpro | assumption | 2026-07-10 | Google-dive serving-generation scenario. |

## Throughput, MFU and latency constants — 36 rows

| parameter | value | unit | source (URL) | source class | as-of date | note |
|---|---:|---|---|---|---|---|
| `xAI cash-marginal.referenceActiveParamsB` | `200` | billion parameters | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Central calibration point within the dive’s 100–500B active-parameter range. |
| `xAI cash-marginal.aggregateOutputTokPerSecPerGPU` | `250` | output tokens/s/GPU | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | 80 user tok/s × 25 streams ÷ 8 GPUs; only the 80 tok/s user-stream speed is disclosed. |
| `xAI cash-marginal.effectiveMFUOverride` | `0.02` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | 250 × 2 × 200B ÷ 5.0 PFLOP/s = 0.0200; all-in busy-GPU operating point. |
| `xAI cash-marginal.interactivityMult` | `1` | multiplier | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Use with effectiveMFUOverride=0.02; latency and continuous batching are already absorbed. |
| `xAI cash-marginal.fallback.interactivityMultVsGB300Anchor` | `0.15748031496062992` | multiplier | https://inference-margins.pages.dev/research/xai-gptpro | community | 2026-07-10 | 0.0200 ÷ calculator GB300 anchor MFU 0.127; use only when an MFU override is unavailable, never together with it. |
| `xAI cash-marginal.stackEfficiency` | `1` | multiplier | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | The all-in MFU override already absorbs the stack operating point; no second stack haircut. |
| `xAI cash-marginal.latencyRegime` | `80 user tok/s; 25 concurrent streams; 8-GPU replica` | text | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Launch stream speed plus central saturation scenario. |
| `xAI cash-marginal.fallback.assumedGB300AnchorEffectiveMFU` | `0.127` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | community | 2026-07-10 | Calculator GB300 effective-MFU anchor used only to derive the fallback interactivity multiplier. |
| `xAI opportunity-cost.referenceActiveParamsB` | `200` | billion parameters | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Central calibration point within the dive’s 100–500B active-parameter range. |
| `xAI opportunity-cost.aggregateOutputTokPerSecPerGPU` | `250` | output tokens/s/GPU | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | 80 user tok/s × 25 streams ÷ 8 GPUs; only the 80 tok/s user-stream speed is disclosed. |
| `xAI opportunity-cost.effectiveMFUOverride` | `0.02` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | 250 × 2 × 200B ÷ 5.0 PFLOP/s = 0.0200; all-in busy-GPU operating point. |
| `xAI opportunity-cost.interactivityMult` | `1` | multiplier | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Use with effectiveMFUOverride=0.02; latency and continuous batching are already absorbed. |
| `xAI opportunity-cost.fallback.interactivityMultVsGB300Anchor` | `0.15748031496062992` | multiplier | https://inference-margins.pages.dev/research/xai-gptpro | community | 2026-07-10 | 0.0200 ÷ calculator GB300 anchor MFU 0.127; fallback only and never together with the override. |
| `xAI opportunity-cost.stackEfficiency` | `1` | multiplier | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | The all-in MFU override already absorbs the stack operating point. |
| `xAI opportunity-cost.latencyRegime` | `80 user tok/s; 25 concurrent streams; 8-GPU replica` | text | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Launch stream speed plus central saturation scenario. |
| `xAI opportunity-cost.fallback.assumedGB300AnchorEffectiveMFU` | `0.127` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | community | 2026-07-10 | Calculator GB300 effective-MFU anchor used only to derive the fallback multiplier. |
| `China public-cloud on-demand.stackEfficiency` | `1` | multiplier | https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | Preserve the selected model/hardware preset’s stack setting; this lens changes procurement and occupancy only. |
| `China public-cloud on-demand.latencyRegime` | `enterprise-interactive` | text | https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | On-demand rate cards are most relevant to elastic interactive use, not throughput-optimized reserved batch pools. |
| `China public-cloud on-demand.interactivityMult` | `1` | multiplier | https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | No extra latency multiplier; preserve the selected operating point. |
| `Ant Group production H20 (SLO replay).model` | `DeepSeek-R1` | model | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | first-party | 2026-07-10 | Operator benchmark model. |
| `Ant Group production H20 (SLO replay).activeParamsB` | `37` | billion active parameters | https://github.com/deepseek-ai/DeepSeek-V3 | first-party | 2026-07-10 | DeepSeek-R1/V3 activated parameter count. |
| `Ant Group production H20 (SLO replay).precisionMult` | `1` | multiplier | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | assumption | 2026-07-10 | Measured MFU is derived against the H20 dense 8-bit peak; do not apply a second precision multiplier. |
| `Ant Group production H20 (SLO replay).dense8bitFLOPS_PF` | `0.296` | PFLOP/s | https://inference-margins.pages.dev/research/chinese-accel-gptpro | first-party | 2026-07-10 | H20 dense FP8/INT8 peak used by the project hardware table. |
| `Ant Group production H20 (SLO replay).tier.Base.outputTokPerSecPerGPU` | `714` | output tokens/s/GPU | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | first-party | 2026-07-10 | Batch 48, TTFT <2 s, TPOT <70 ms. |
| `Ant Group production H20 (SLO replay).tier.Base.effectiveMFU` | `0.1785` | fraction | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | first-party | 2026-07-10 | Exact arithmetic: 714 × 2 × 37B ÷ 296 TFLOP/s. |
| `Ant Group production H20 (SLO replay).tier.Pro.outputTokPerSecPerGPU` | `675` | output tokens/s/GPU | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | first-party | 2026-07-10 | Batch 32, TTFT <1.5 s, TPOT <50 ms. |
| `Ant Group production H20 (SLO replay).tier.Pro.effectiveMFU` | `0.16875` | fraction | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | first-party | 2026-07-10 | Exact arithmetic: 675 × 2 × 37B ÷ 296 TFLOP/s. |
| `Ant Group production H20 (SLO replay).tier.Max.outputTokPerSecPerGPU` | `423` | output tokens/s/GPU | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | first-party | 2026-07-10 | Batch 12, TTFT <1 s, TPOT <30 ms. |
| `Ant Group production H20 (SLO replay).tier.Max.effectiveMFU` | `0.10575` | fraction | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | first-party | 2026-07-10 | Exact arithmetic: 423 × 2 × 37B ÷ 296 TFLOP/s. |
| `Ant Group production H20 (SLO replay).representativeTier` | `Pro` | tier | https://inference-margins.pages.dev/research/chinese-accel-gptpro | community | 2026-07-10 | The annex identifies 675–700 output tok/s/GPU as the neutral production anchor. |
| `Ant Group production H20 (SLO replay).effectiveMFUOverride` | `0.16875` | fraction | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | first-party | 2026-07-10 | Use the measured Pro-tier equivalent directly. |
| `Ant Group production H20 (SLO replay).interactivityMult` | `1` | multiplier | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | assumption | 2026-07-10 | Use with the MFU override; the measured point already includes SLO, batch, MTP and production software. |
| `Ant Group production H20 (SLO replay).fallback.interactivityMultVsH20Anchor` | `0.9926470588235294` | multiplier | https://inference-margins.pages.dev/research/chinese-accel-gptpro | community | 2026-07-10 | 0.16875 ÷ calculator H20 anchor MFU 0.17; use only when no MFU override exists. |
| `Ant Group production H20 (SLO replay).fallback.assumedH20AnchorEffectiveMFU` | `0.17` | fraction | https://inference-margins.pages.dev/research/chinese-accel-gptpro | community | 2026-07-10 | Calculator H20 effective-MFU anchor used only to derive the fallback multiplier. |
| `Ant Group production H20 (SLO replay).stackEfficiency` | `1` | multiplier | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | assumption | 2026-07-10 | Measured effective MFU already includes the production software and latency/batch regime. |
| `Ant Group production H20 (SLO replay).latencyRegime` | `Pro: TPOT <50 ms` | text | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | first-party | 2026-07-10 | Published middle SLO tier. |

## Workload, utilization and accounting conventions — 26 rows

| parameter | value | unit | source (URL) | source class | as-of date | note |
|---|---:|---|---|---|---|---|
| `xAI cash-marginal.utilization` | `1` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Per-occupied, saturated decode-GPU unit-cost convention; not a whole-fleet occupancy claim. |
| `xAI cash-marginal.batchShare` | `0` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | first-party | 2026-07-10 | No published Grok 4.5 asynchronous API batch discount; internal continuous batching is already in the 25-stream assumption. |
| `xAI cash-marginal.negotiatedDiscount` | `0` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | List-price unit-economics perimeter. |
| `xAI cash-marginal.freeTrafficShare` | `0` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Billed marginal-token perimeter; free and subscription traffic excluded. |
| `xAI opportunity-cost.utilization` | `1` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Per-occupied, saturated decode-GPU allocation convention; not a whole-fleet occupancy claim. |
| `xAI opportunity-cost.batchShare` | `0` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | first-party | 2026-07-10 | No published Grok 4.5 asynchronous API batch discount; internal batching already appears in throughput. |
| `xAI opportunity-cost.negotiatedDiscount` | `0` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | List-price unit-economics perimeter. |
| `xAI opportunity-cost.freeTrafficShare` | `0` | fraction | https://inference-margins.pages.dev/research/xai-gptpro | assumption | 2026-07-10 | Billed marginal-token perimeter; free and subscription traffic excluded. |
| `China public-cloud on-demand.utilization` | `0.35` | fraction | https://inference-margins.pages.dev/ | assumption | 2026-07-10 | Enterprise elastic capacity is peak-provisioned; the report uses 35% versus 70% as a salient occupancy contrast. |
| `China public-cloud on-demand.batchShare` | `0` | fraction | https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | Infrastructure rental does not imply a provider-model asynchronous batch tariff. |
| `China public-cloud on-demand.negotiatedDiscount` | `0` | fraction | https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | Use posted/public rates; negotiated commitments belong in a separate lens. |
| `China public-cloud on-demand.freeTrafficShare` | `0` | fraction | https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | Infrastructure procurement lens only. |
| `Ant Group production H20 (SLO replay).utilization` | `1` | fraction | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | assumption | 2026-07-10 | Per-occupied decode-GPU benchmark convention; do not divide measured throughput by fleet occupancy again. |
| `Ant Group production H20 (SLO replay).batchShare` | `0` | fraction | https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/ | first-party | 2026-07-10 | Published batch size 32 is internal continuous batching, not a discounted asynchronous API tariff. |
| `Ant Group production H20 (SLO replay).negotiatedDiscount` | `0` | fraction | https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | Operating-point preset only. |
| `Ant Group production H20 (SLO replay).freeTrafficShare` | `0` | fraction | https://inference-margins.pages.dev/research/chinese-accel-gptpro | assumption | 2026-07-10 | Operating-point preset only. |
| `DeepSeek V4-Flash.nativeInputOutputRatio` | `3.619047619047619` | input tokens/output token | https://github.com/deepseek-ai/open-infra-index<br>https://inference-margins.pages.dev/ | community | 2026-07-10 | Transfer of DeepSeek’s 2025 production trace: 608 input units ÷ 168 output units. |
| `DeepSeek V4-Flash.nativeCacheHitRate` | `0.5625` | fraction | https://github.com/deepseek-ai/open-infra-index | community | 2026-07-10 | Transfer of the approximately 56.3% V3/R1 production cache-hit rate, represented as the project’s exact trace fraction. |
| `GLM-4.7.nativeInputOutputRatio` | `8` | input tokens/output token | https://inference-margins.pages.dev/research/zhipu-gptpro | assumption | 2026-07-10 | Transferred GLM production-workload scenario; not GLM-4.7 telemetry. |
| `GLM-4.7.nativeCacheHitRate` | `0.41` | fraction | https://inference-margins.pages.dev/research/zhipu-gptpro | assumption | 2026-07-10 | Transferred GLM production-workload scenario; not GLM-4.7 telemetry. |
| `GPT-5.6 Terra.nativeInputOutputRatio` | `9` | input tokens/output token | https://inference-margins.pages.dev/research/openai-gptpro | community | 2026-07-10 | Transfer of Sol-dive workload: 7 cached + 2 fresh input : 1 output. |
| `GPT-5.6 Terra.nativeCacheHitRate` | `0.7777777777777778` | fraction | https://inference-margins.pages.dev/research/openai-gptpro | community | 2026-07-10 | 7 cached ÷ 9 total input, transferred from the Sol dive. |
| `GPT-5.6 Luna.nativeInputOutputRatio` | `9` | input tokens/output token | https://inference-margins.pages.dev/research/openai-gptpro | community | 2026-07-10 | Transfer of Sol-dive workload: 7 cached + 2 fresh input : 1 output. |
| `GPT-5.6 Luna.nativeCacheHitRate` | `0.7777777777777778` | fraction | https://inference-margins.pages.dev/research/openai-gptpro | community | 2026-07-10 | 7 cached ÷ 9 total input, transferred from the Sol dive. |
| `Gemini 3.5 Flash.nativeInputOutputRatio` | `15` | input tokens/output token | https://inference-margins.pages.dev/research/google-gptpro | assumption | 2026-07-10 | Provider-native traffic scenario; not a disclosed Gemini 3.5 traffic trace. |
| `Gemini 3.5 Flash.nativeCacheHitRate` | `0.6` | fraction | https://inference-margins.pages.dev/research/google-gptpro | assumption | 2026-07-10 | Provider-native traffic scenario; not a disclosed Gemini 3.5 traffic trace. |

## Delta notes

- `DeepSeek V4-Flash.architecture` was stated in the superseded 17:53 draft as `MoE + DSA`; the adopted 22:29 final value is `MoE + token-wise compression + DSA`.
- `GLM-4.7.architecture` was stated in the superseded draft as `MoE + MTP; hybrid reasoning`; the adopted final value is `MoE + MTP; interleaved/preserved thinking`.
- `GPT-5.6 Terra.architecture` and `GPT-5.6 Luna.architecture` previously omitted the explicit uncertainty suffix; the adopted final values add `— UNKNOWN`.
- The adopted China public-cloud preset added the `rentMult` compatibility alias and the explicit `rentMult.Ascend910CProxy` row, both equal to `6.152857142857143`.
- The adopted Ant Group preset made the fallback representation explicit with `fallback.interactivityMultVsH20Anchor = 0.9926470588235294` and `fallback.assumedH20AnchorEffectiveMFU = 0.17`.
- The superseded earlier draft contained additional Anthropic, reported-margin, Epoch, Kimi and Grok candidate preset rows. Those were not part of the adopted 192-row final export and are therefore not included here. fileciteturn29file0
- Apart from the textual and structural changes listed above, no numeric value in this response differs from the recovered 22:29 final artifact.