# GPT-6 Sol — GPT-6 Astra Pro estimate (2026-09-28)

**Provenance.** one research run on 2026-09-28 by GPT-6 Astra Pro (ChatGPT, model `gpt-6-pro`), answered 2026-09-28T19:14:43Z. It was given this calculator's input contract, the Claude Opus 4.x reference estimate and the live connector's scenario space, and asked to set every input for GPT-6 Sol from public evidence. The answer is reproduced below verbatim except for four presentation changes: ChatGPT's interface citation markers are removed, as on every page of this annex; links into the research run's own sandbox (files no reader can open) keep their text and lose the dead target; equations are set as preformatted text, with a space between a bracket and a parenthesis inside them so the renderer does not read a product as a link; and where the answer repeats the run's own request identifier, an internal queue entry, it is withheld; its sources are cited by URL in the text (as-received answer SHA-256 `d5da78e81e6679b4d5c5430b8d5adc77bc936ec0d634171a9057665d52d50ab6`; published text SHA-256 `d5da78e81e6679b4d5c5430b8d5adc77bc936ec0d634171a9057665d52d50ab6`; original capture SHA-256 `3aa1fad50f7cd3c8dbe105efdee37293292aad8560d43f2fdf7cb784b7592708`).

## What the site shows

| reading | value |
|---|---|
| **Card headline** — this calculator on the run's central inputs, at list | **~85%** (84.97%) |
| Span — the run's own low- and high-margin scenarios, same engine | 58%–92% (57.82% – 91.60%) |
| The run's own stated reading | 85.0% (57.8–91.6%) |
| Same central inputs at the page's Reference traffic (15:1, 60% cache) — context, not the headline | ~82% |

The span is the author's judgment span: two scenarios it called plausible as a whole, not a probability interval and not a bound. The headline is a modeled unit direct-serving margin from public information; it is not a disclosure by the provider and not a company gross margin.

## Our reading

GPT-6 Sol is OpenAI's model below GPT-6 Astra, released on 2026-09-22 at $2 per million input tokens and $10 per million output tokens, with cached input at $0.20 — half GPT-5.6 Sol's $4/$20 and a fifth of GPT-6 Astra's $10/$50. The run verified the tariff on OpenAI's own pages the day it ran. The model was six days old, so almost nothing about how it is served is public, and the run says so input by input. The tariff and the model's options are disclosed. The fleet (30% H200, 50% GB200, 20% GB300 at $3.50, $4.50 and $6.00 per GPU-hour, all-in), the 70% occupancy and the `dsr1` attention geometry are carried over from the GPT-6 Astra estimate made three days earlier. The active-parameter count — 100B, the input the run names as deciding the number — is carried from this project's earlier GPT-5.6 Sol working point, not measured. Traffic is an agentic assumption: 12 input tokens per output token, 80% of input read from cache, and half of the fresh input billed as cache writes at 125% of the input price; at the page's Reference traffic the same inputs compute ~82%. The span is much wider than GPT-6 Astra's, and on purpose: the low case is a larger implementation (250B active, 8T total) at 55% occupancy, the high case a smaller one (50B active, 3T total) at 75%. The run also marks the span as conditional on balanced serving — a latency-first posture on the same tariff would land well below it. It could not reach the calculator's connector and worked the published equations by hand; the engine reproduces all three of its figures to the fourth decimal.

## The operating point

Carrier: the calculator's blank `custom` row on the `dsr1` attention geometry (a declared approximation — this model's architecture is not published). `batchShare` and `discount` are 0 in every run (list basis).

| input | central | low-margin scenario | high-margin scenario |
|---|---|---|---|
| `customDonor` | dsr1 | dsr1 | dsr1 |
| `active` | 100 | 250 | 50 |
| `total` | 5000 | 8000 | 3000 |
| `precision` | fp8 | fp8 | fp8 |
| `priceIn` | 2 | 2 | 2 |
| `priceOut` | 10 | 10 | 10 |
| `cacheReadMult` | 10 | 10 | 10 |
| `billCacheHit` | 80 | 80 | 80 |
| `cacheWriteShare` | 50 | 50 | 50 |
| `cacheWriteMult` | 125 | 125 | 125 |
| `cacheCost` | 5 | 5 | 5 |
| `batchShare` | 0 | 0 | 0 |
| `discount` | 0 | 0 | 0 |
| `blend` | `{"h200":30,"gb200":50,"gb300":20}` | `{"h200":30,"gb200":50,"gb300":20}` | `{"h200":30,"gb200":50,"gb300":20}` |
| `rentAbsLeg` | `{"h200":3.5,"gb200":4.5,"gb300":6}` | `{"h200":3.5,"gb200":4.5,"gb300":6}` | `{"h200":3.5,"gb200":4.5,"gb300":6}` |
| `util` | 70 | 55 | 75 |
| `stackMult` | 1 | 1 | 1 |
| `trendMonths` | 2 | 2 | 2 |
| `interact` | balanced | balanced | balanced |
| `hwMode` | rent | rent | rent |
| traffic | 12:1, 80% cache | 12:1, 80% cache | 12:1, 80% cache |

## The answer, verbatim

## 0 — THE CARD, IN TWO LINES.

≈85.0% at list (span 57.8–91.6%)  
The unmeasured 100B-active assumption puts modeled output cost near $1.08/M against the $10/M output tariff.

## 1 — PUBLIC FACTS.

Prepared by **GPT-6 Astra Pro**, **September 28, 2026**. All monetary amounts are USD. “Read” dates identify retrieval of living pages, not their publication dates. The estimate concerns **unit direct-serving contribution margin**, not company gross margin or verified OpenAI economics.

**File receipt.** All four uploaded files opened and were read. Their first lines, truncated where necessary, were:

| File | First line |
|---|---|
| `03-calculator-contract-live-2026-09-28.json` | `{"result":{"content":[{"type":"text","text":"The scenario space of the Frontier Inference Margins ca` |
| `04-opus-4x-reference-dive-verbatim-2026-08-08.md` | `` ```json `` |
| `06-openai-gptpro.md` | `# OpenAI — GPT-5.6 Pro deep dive` |
| `07-gpt-6-astra-astra-pro-2026-09-25.md` | `# GPT-6 Astra — GPT-6 Astra Pro estimate (2026-09-25)` |

Inline attachments 01, 02 and 05 were also read. Attachment 03 governs accepted inputs; attachment 04 supplies the original reference; attachments 06–07 supply earlier **assumptions**, not independent provider evidence.    

1. **Exact identity — DISCLOSED for this model; immutable version UNKNOWN.** I price the OpenAI API alias **`gpt-6-sol`**, released **2026-09-22**, as served on **2026-09-28**. The changelog records an image-encoding fix on **2026-09-25**. The model page supplies no dated immutable snapshot that I could establish; I do not invent one. Sources **S1**, https://developers.openai.com/api/docs/models/gpt-6-sol — read **2026-09-28**; **S2**, https://developers.openai.com/api/docs/changelog — entries **2026-09-22** and **2026-09-25**. 

2. **Current tariff — DISCLOSED for this model.** Standard short-context prices are **$2.00 fresh input / $0.20 cached input / $2.50 cache-write input / $10.00 output per million tokens**. The brief is correct. Above **272,000 input tokens**, the entire request uses **$4.00 / $0.40 / $5.00 / $15.00**. Batch/Flex cost half Standard; Fast costs twice the applicable rate. I price neither those modes nor regional premiums. The promotional-expiry notice concerns **GPT-5.6 Sol**, not GPT-6 Sol; I found no separate expiring GPT-6 Sol tariff. **S3**, https://developers.openai.com/api/docs/pricing — read **2026-09-28**, corroborated by **S1**. 

3. **Options and token boundary — DISCLOSED for this model; traffic weighting ASSUMED.** Sol supports reasoning efforts `none`, `low`, `medium` (default), `high`, `xhigh` and `max`; a **1,050,000-token** context window; **128,000** maximum output tokens; and a stated knowledge cutoff of **2026-04-20**. I price Standard text-token traffic across reasoning efforts, not a subscription, tool execution or separate Fast service. Billed output includes hidden reasoning. **S1**, model URL above, and **S13**, https://developers.openai.com/api/docs/guides/reasoning — both read **2026-09-28**. 

4. **Launch economics — DISCLOSED product claims, not cost-of-serving measurements.** OpenAI attributes lower prices to caching and inference improvements. The Sol tariff is half its predecessor’s current $4/$20 tariff. Its launch table reports **33.2% on AutomationBench at $0.27/task**, versus **26.9%** for Opus 5 at **11.1 times** that task price. These are benchmark results and customer expenditure, not GPU-hour costs. They receive no direct parameter-count or cost multiplier here. **S4**, https://openai.com/index/introducing-gpt-6-sol-and-luna/ — **2026-09-22**. 

5. **Architecture — UNKNOWN for Sol; predecessor proxy COMMUNITY ESTIMATE.** I found no Sol disclosure of active/total parameters, expert routing, attention geometry or production precision. Epoch’s **50–300B active-parameter** estimate concerns **GPT-5**, not GPT-6 Sol. My **100B active / 5T total** is **ASSUMED**, carrying an earlier Sol working prior rather than upgrading it into a measurement. **S7**, https://epoch.ai/gradient-updates/how-many-digital-workers-could-openai-deploy — **2025-10-03**; **A06**, https://margins.ashitaorbis.com/research/openai-gptpro — estimate dated **2026-07-09**; Sol documentation **S1**, checked **2026-09-28**.  

6. **Serving hardware and location — DISCLOSED at provider level; Sol allocation UNKNOWN.** OpenAI identifies operating Hopper/Blackwell systems across Microsoft, OCI and CoreWeave and describes a partner-centric infrastructure strategy. Neither identifies Sol’s inference sites or generation shares. I use a North American partner-capacity approximation, not an asserted Sol-to-Abilene allocation. The often-repeated **3 GW inference** figure in the February announcement concerns the Rubin collaboration, not verified current Sol capacity. **S8**, https://openai.com/index/scaling-ai-for-everyone/ — **2026-02-27**; **S9**, https://openai.com/index/building-the-compute-infrastructure-for-the-intelligence-age/ — **2026-04-29**. 

7. **Public hardware prices — DISCLOSED by the seller.** CoreWeave lists **$50.44/hour for eight H200 GPUs**, or **$6.305/GPU-hour**, and **$42/hour for a four-GPU GB200 slice**, or **$10.50/GPU-hour**, with host resources. GB300 directs buyers to sales rather than giving a numerical quote. These are public offerings, not OpenAI’s contracts. **S10**, https://www.coreweave.com/pricing — read **2026-09-28**. 

8. **Procurement used here — INFERENCE; GB300 price ASSUMED.** I carry **H200 $3.50, GB200 $4.50, GB300 $6.00 per GPU-hour** from the sibling estimate. The first two are assumed committed-capacity equivalents below S10’s public offers, motivated by S9’s procurement posture; GB300’s premium has weaker support. Every rate is expressly **all-in**, including accelerator, power, hosting and networking. **A07**, https://margins.ashitaorbis.com/research/gpt-6-astra-astra-pro — **2026-09-25**; underlying comparison sources **S9/S10**, dated above. No actual Sol transfer price was established. 

9. **Caching — DISCLOSED mechanics and selected examples; population mix UNKNOWN.** OpenAI distinguishes ordinary input, cache reads and cache writes as exclusive billing categories. Its September update reports selected customers with high reuse: Manus rose from about **85% to above 90%**. Such examples support the reuse mechanism, not a Sol-wide census. **S5**, https://developers.openai.com/api/docs/guides/prompt-caching — read **2026-09-28**; **S6**, https://openai.com/index/better-prompt-caching-for-gpt-6/ — **2026-09-22**. My 80% read share and write frequency remain assumptions. 

10. **Endpoint speed — COMMUNITY ESTIMATE, specifically an independent measurement.** Artificial Analysis’s rolling OpenAI endpoint measurement at maximum effort reports **89.8 output tokens/second** and **125.39 seconds to first answer token**, including reasoning latency. These are endpoint measurements, not aggregate tokens per GPU. I do not divide a GPU rent by 89.8. **S11**, https://artificialanalysis.ai/models/gpt-6-sol/providers — read **2026-09-28**. 

11. **Occupancy and traffic — UNKNOWN for Sol.** The provider and benchmark material above does not establish paid-capacity occupancy, aggregate phase throughput, input/output lengths, or serving-versus-billing cache shares. My **70% occupancy, 12:1 input:output and 80% cache reuse are ASSUMED**. Epoch’s realized-FLOP utilization is a different quantity, not this calculator’s occupancy divisor. Search boundary: **S1, S6–S11**, checked **2026-09-28**; relevant proxy **S7**, dated **2025-10-03**. 

12. **Private-stack evidence — DISCLOSED for the predecessor; transfer ASSUMED.** OpenAI reported **20% lower serving cost from kernel work** and **over 15% better token-generation efficiency from draft-model work** for GPT-5.6. These are historical improvements, not a measured Sol advantage over contemporary open practice. I carry a discounted, single residual allowance rather than multiplying these claims. **S12**, https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency/ — **2026-07-29**. 

13. **Financial perimeter — CREDIBLY REPORTED company figure; Sol economics UNKNOWN.** Reuters relayed a **33% adjusted OpenAI company gross margin for 2025**. It does not identify this model’s contribution margin. No Sol-specific revenue, serving cost per million tokens or margin disclosure was established. **S14**, https://www.reuters.com/technology/openai-sees-compute-spend-around-600-billion-by-2030-cnbc-reports-2026-02-20/ — published **2026-02-20**, updated **2026-02-21**. 

14. **Calculator mechanics — DISCLOSED by the calculator author, not OpenAI measurements.** I inspected its public equations and registries and transcribed the relevant arithmetic locally. **S15**, https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js; **S16**, https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js; **S17**, https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine.js — retrieved **2026-09-28**, used alongside the supplied contract. **No successful live MCP scenario result was obtained.** 

## 2 — CALCULATOR INPUTS.

All parameter counts are **billions**. `cacheWriteShare` is the implementation’s percentage of **non-cache-read input**: 80% reads plus a 50% write share produces **80% read / 10% ordinary fresh / 10% write** across all input tokens. Sources on assumed inputs identify context or the origin of a carry, not a measurement of the selected number. The three `stated` values are rounded **local-replay expectations**, not MCP returns. 

```json
{
  "model_id": "custom",
  "model_name": "GPT-6 Sol",
  "api_model_priced": "gpt-6-sol, current alias read 2026-09-28; API release 2026-09-22; Standard short-context text-token traffic, mixed reasoning effort; no dated immutable snapshot established",
  "customDonor": "dsr1",
  "basis": "list",
  "context_length_assumed": "Standard short-context tariff, input <=272000 tokens. Representative request: 12000 input and 1000 billed output tokens including reasoning; average decode context 12500, peak KV context 13000. Assumed compact-agent-turn operating point, not a measured traffic mean; this field is documentation, not an engine control.",
  "central": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 100,
      "total": 5000,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 10,
      "cacheReadMult": 10,
      "billCacheHit": 80,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125,
      "cacheCost": 5,
      "batchShare": 0,
      "discount": 0,
      "blend": {
        "h200": 30,
        "gb200": 50,
        "gb300": 20
      },
      "rentAbsLeg": {
        "h200": 3.5,
        "gb200": 4.5,
        "gb300": 6
      },
      "util": 70,
      "stackMult": 1.0,
      "trendMonths": 2,
      "interact": "balanced",
      "hwMode": "rent"
    },
    "traffic": {
      "mode": "custom",
      "io_ratio": 12,
      "cache_hit": 80
    }
  },
  "low_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 250,
      "total": 8000,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 10,
      "cacheReadMult": 10,
      "billCacheHit": 80,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125,
      "cacheCost": 5,
      "batchShare": 0,
      "discount": 0,
      "blend": {
        "h200": 30,
        "gb200": 50,
        "gb300": 20
      },
      "rentAbsLeg": {
        "h200": 3.5,
        "gb200": 4.5,
        "gb300": 6
      },
      "util": 55,
      "stackMult": 1.0,
      "trendMonths": 2,
      "interact": "balanced",
      "hwMode": "rent"
    },
    "traffic": {
      "mode": "custom",
      "io_ratio": 12,
      "cache_hit": 80
    }
  },
  "high_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 50,
      "total": 3000,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 10,
      "cacheReadMult": 10,
      "billCacheHit": 80,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125,
      "cacheCost": 5,
      "batchShare": 0,
      "discount": 0,
      "blend": {
        "h200": 30,
        "gb200": 50,
        "gb300": 20
      },
      "rentAbsLeg": {
        "h200": 3.5,
        "gb200": 4.5,
        "gb300": 6
      },
      "util": 75,
      "stackMult": 1.0,
      "trendMonths": 2,
      "interact": "balanced",
      "hwMode": "rent"
    },
    "traffic": {
      "mode": "custom",
      "io_ratio": 12,
      "cache_hit": 80
    }
  },
  "stated": {
    "headline_pct": 85.0,
    "low_pct": 57.8,
    "high_pct": 91.6
  },
  "sources": [
    {"id": "S1", "claim": "Sol alias, model options, context limits and token tariff; retrieval date.", "url": "https://developers.openai.com/api/docs/models/gpt-6-sol", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "API release September 22; image-encoding fix September 25, 2026.", "url": "https://developers.openai.com/api/docs/changelog", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "Standard Sol tariff: 2 input, 0.20 read, 2.50 write, 10 output USD/M; retrieval date.", "url": "https://developers.openai.com/api/docs/pricing", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "Launch positioning, benchmark/task-price claims and predecessor price comparison; not serving-cost measurements.", "url": "https://openai.com/index/introducing-gpt-6-sol-and-luna/", "date": "2026-09-22", "evidence_class": "DISCLOSED"},
    {"id": "S5", "claim": "Exclusive fresh/read/write billing categories and cache mechanics; retrieval date.", "url": "https://developers.openai.com/api/docs/guides/prompt-caching", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S6", "claim": "Caching improvements and selected-customer observations, not Sol-wide traffic telemetry.", "url": "https://openai.com/index/better-prompt-caching-for-gpt-6/", "date": "2026-09-22", "evidence_class": "DISCLOSED"},
    {"id": "S7", "claim": "Epoch GPT-5 active-parameter range 50-300B; predecessor proxy only.", "url": "https://epoch.ai/gradient-updates/how-many-digital-workers-could-openai-deploy", "date": "2025-10-03", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S8", "claim": "Operating Hopper/Blackwell partner systems; announced Rubin capacity is a separate statement.", "url": "https://openai.com/index/scaling-ai-for-everyone/", "date": "2026-02-27", "evidence_class": "DISCLOSED"},
    {"id": "S9", "claim": "Partner-centric infrastructure strategy, not a Sol-specific fleet allocation.", "url": "https://openai.com/index/building-the-compute-infrastructure-for-the-intelligence-age/", "date": "2026-04-29", "evidence_class": "DISCLOSED"},
    {"id": "S10", "claim": "CoreWeave public H200 and GB200 system prices; no numeric GB300 quote; retrieval date.", "url": "https://www.coreweave.com/pricing", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S11", "claim": "OpenAI Sol max-effort endpoint measurement: 89.8 output tokens/s, 125.39 s first-answer latency; retrieval date.", "url": "https://artificialanalysis.ai/models/gpt-6-sol/providers", "date": "2026-09-28", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S12", "claim": "GPT-5.6 kernel and draft-model improvement claims; not a measured current Sol/open-stack gap.", "url": "https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency/", "date": "2026-07-29", "evidence_class": "DISCLOSED"},
    {"id": "S13", "claim": "Reasoning tokens are billed as output; retrieval date.", "url": "https://developers.openai.com/api/docs/guides/reasoning", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S14", "claim": "Reuters relays 33% adjusted company gross margin for 2025, not Sol economics.", "url": "https://www.reuters.com/technology/openai-sees-compute-spend-around-600-billion-by-2030-cnbc-reports-2026-02-20/", "date": "2026-02-20", "evidence_class": "CREDIBLY REPORTED"},
    {"id": "S15", "claim": "Calculator-author-published roofline implementation; retrieval date.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S16", "claim": "Calculator donor, hardware, concurrency and calibration registries; retrieval date.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S17", "claim": "Calculator cost/billing composition, including writes as a share of non-read input; retrieval date.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine.js", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "A06", "claim": "Earlier estimator assumptions for GPT-5.6 Sol; not provider disclosures.", "url": "https://margins.ashitaorbis.com/research/openai-gptpro", "date": "2026-07-09", "evidence_class": "ASSUMED"},
    {"id": "A07", "claim": "Sibling Astra estimator operating point supplied as attachment 07; not provider disclosures.", "url": "https://margins.ashitaorbis.com/research/gpt-6-astra-astra-pro", "date": "2026-09-25", "evidence_class": "ASSUMED"}
  ],
  "key_inputs": [
    {"input": "active", "central": 100, "low_margin": 250, "high_margin": 50, "source_ids": ["S7", "A06", "A07"], "evidence_class": "ASSUMED"},
    {"input": "total", "central": 5000, "low_margin": 8000, "high_margin": 3000, "source_ids": ["A06", "A07"], "evidence_class": "ASSUMED"},
    {"input": "customDonor", "central": "dsr1", "low_margin": "dsr1", "high_margin": "dsr1", "source_ids": ["S16", "A07"], "evidence_class": "ASSUMED"},
    {"input": "precision", "central": "fp8", "low_margin": "fp8", "high_margin": "fp8", "source_ids": ["A07"], "evidence_class": "ASSUMED"},
    {"input": "priceIn", "central": 2, "low_margin": 2, "high_margin": 2, "source_ids": ["S1", "S3"], "evidence_class": "DISCLOSED"},
    {"input": "priceOut", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S1", "S3"], "evidence_class": "DISCLOSED"},
    {"input": "cacheReadMult", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S1", "S3"], "evidence_class": "DISCLOSED"},
    {"input": "cacheWriteMult", "central": 125, "low_margin": 125, "high_margin": 125, "source_ids": ["S1", "S3"], "evidence_class": "DISCLOSED"},
    {"input": "billCacheHit", "central": 80, "low_margin": 80, "high_margin": 80, "source_ids": ["S5", "S6", "A07"], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteShare", "central": 50, "low_margin": 50, "high_margin": 50, "source_ids": ["S5", "S6", "A07"], "evidence_class": "ASSUMED"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": ["A07"], "evidence_class": "ASSUMED"},
    {"input": "blend", "central": {"h200": 30, "gb200": 50, "gb300": 20}, "low_margin": {"h200": 30, "gb200": 50, "gb300": 20}, "high_margin": {"h200": 30, "gb200": 50, "gb300": 20}, "source_ids": ["S8", "S9", "A07"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg", "central": {"h200": 3.5, "gb200": 4.5, "gb300": 6}, "low_margin": {"h200": 3.5, "gb200": 4.5, "gb300": 6}, "high_margin": {"h200": 3.5, "gb200": 4.5, "gb300": 6}, "source_ids": ["S9", "S10", "A07"], "evidence_class": "INFERENCE"},
    {"input": "util", "central": 70, "low_margin": 55, "high_margin": 75, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "stackMult", "central": 1.0, "low_margin": 1.0, "high_margin": 1.0, "source_ids": ["A07"], "evidence_class": "ASSUMED"},
    {"input": "trendMonths", "central": 2, "low_margin": 2, "high_margin": 2, "source_ids": ["S12", "A07"], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "balanced", "low_margin": "balanced", "high_margin": "balanced", "source_ids": ["S1", "S11", "A07"], "evidence_class": "ASSUMED"},
    {"input": "hwMode", "central": "rent", "low_margin": "rent", "high_margin": "rent", "source_ids": ["S9", "A07"], "evidence_class": "INFERENCE"},
    {"input": "traffic.io_ratio", "central": 12, "low_margin": 12, "high_margin": 12, "source_ids": ["A07"], "evidence_class": "ASSUMED"},
    {"input": "traffic.cache_hit", "central": 80, "low_margin": 80, "high_margin": 80, "source_ids": ["S6", "A07"], "evidence_class": "ASSUMED"},
    {"input": "context_length_assumed.input_tokens", "central": 12000, "low_margin": 12000, "high_margin": 12000, "source_ids": ["S16", "A07"], "evidence_class": "ASSUMED"},
    {"input": "context_length_assumed.output_tokens_including_reasoning", "central": 1000, "low_margin": 1000, "high_margin": 1000, "source_ids": ["S16", "A07"], "evidence_class": "ASSUMED"},
    {"input": "batchShare", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "discount", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"}
  ],
  "confidence": "low: the tariff is verified, but architecture, fleet allocation, all-in procurement, occupancy and traffic are unmeasured; the span contains three conditional scenarios, not a probability interval or a bound."
}
```

## 3 — YOUR OWN READING.

**My estimate is 85.0% at list, with a selected three-scenario span of 57.8–91.6%.** The central calculation is **84.9677%**. This is a conditional estimate of direct-serving contribution margin; the decimals describe arithmetic, not knowledge of OpenAI’s costs.

The central model is a **100B-active, 5T-total sparse implementation at 70% paid-capacity occupancy**. The low case is **250B active, 8T total and 55% occupancy**: a larger implementation carrying launch-period scheduling slack. The high case is **50B active, 3T total and 75% occupancy**: a smaller implementation that is easier to keep occupied. These are my judgments as of **2026-09-28**. Both endpoints retain the central fleet, rents, precision, cache assumptions, latency posture and efficiency allowance. Neither combines every favorable or unfavorable input extreme.

**Execution and reproducibility.** Connector discovery found no available matching connector; direct access to https://margins-mcp.ashitaorbis.com/mcp failed before a scenario could run. There is therefore no successful `run_scenario` call or returned margin to quote. The intended invocation, once for each complete block, is:

```text
run_scenario(
  model="custom",
  perspective="median",
  overrides=<central, low_margin, or high_margin overrides>,
  traffic=<the same scenario's traffic>
)
```

I instead performed an independent transcription of the published equations. It reproduces **82.3265%** for the supplied current Opus reference and **94.5792%** for attachment 07’s Astra central vector. Those checks establish arithmetic consistency at those points, **not empirical validation or a byte-identical replay of every live wrapper**. The submitting leg’s actual engine results should determine the card, without adjusting these inputs to eliminate a discrepancy. The attachment reports the corresponding reference checks and sibling result.  

**Cost arithmetic.** For these FP8, compressed-KV, NVIDIA scenarios, the retrieved equations use active parameters `A`, input length `I = 12,000`, representative decode context `L = 12,500`, attention coefficient `a = 4,997,120`, KV footprint `k = 35,136 bytes/token`, and fabric payload `d = 13,303,808 bytes/token`. With FLOP rate `F`, HBM bandwidth `B`, fabric bandwidth `N`, declared concurrency `b` and decode coefficient `η`:

```text
E = 3^(2/12) = 1.200936955

Tprefill = 0.17581 × E / max((2A + aI/2)/F, d/N)
Tdecode  = b × η × E / max(b(2A + aL)/F, (A + bkL)/B, bd/N)

Cphase [$/M tokens] = all-in $/GPU-hour × 1,000,000
                     / (3,600 × Tphase × occupancy)
```

The carrier’s balanced concurrency values are **96 / 128 / 64** for H200 / GB200 / GB300; its decode coefficients are **0.313491 / 0.315997 / 0.258295**. These are calculator calibration choices, **not observed Sol efficiencies**. The same equation structure is documented in attachment 07; S15–S17 were checked again for this estimate.  

| Central leg | Served-token share | All-in $/GPU-hour | Fresh tokens/s/GPU | Output tokens/s/GPU | Fresh cost $/M | Output cost $/M |
|---|---:|---:|---:|---:|---:|---:|
| H200 | 30% | 3.50 | 1,818 | 1,220 | 0.764071 | 1.138143 |
| GB200 | 50% | 4.50 | 4,590 | 2,488 | 0.389021 | 0.717858 |
| GB300 | 20% | 6.00 | 4,590 | 1,240 | 0.518695 | 1.920541 |
| **Token-weighted cost** | **100%** | — | — | — | **0.527471** | **1.084480** |

I weight **costs by token share**, rather than averaging throughput and applying an average rent. The GB300 disadvantage comes from the carrier’s lower concurrency/coefficient and higher assumed rent. It is not evidence that real GB300 serving is worse than GB200; I leave that inherited calibration visible.

For a bundle of **one million billed output tokens and twelve million input tokens**:

```text
Revenue = 10 + 12 × [0.80 × 0.20 + 0.10 × 2.00 + 0.10 × 2.50]
        = $17.32

Cache-read cost = 0.05 × 0.527470981 = $0.026373549/M

Direct cost = 1.084480331
            + 12 × [0.20 × 0.527470981 + 0.80 × 0.026373549]
            = $2.603596757

Margin = 1 − 2.603596757 / 17.32 = 84.967686%
```

| Scenario | Fresh cost $/M | Output cost $/M | Cost per 13M-token bundle | Billings per bundle | Local-replay margin |
|---|---:|---:|---:|---:|---:|
| Central | 0.527471 | 1.084480 | 2.603597 | 17.32 | **84.9677%** |
| Low margin | 1.547036 | 2.849806 | 7.305270 | 17.32 | **57.8218%** |
| High margin | 0.278244 | 0.652956 | 1.454299 | 17.32 | **91.6034%** |

The central blended quantities are **$0.200277 direct cost and $1.332308 billings per million aggregate tokens**. Ordinary fresh and cache-write input both incur modeled prefill cost; the calculator does not separately price write-specific overhead.

**Unit audit.** All three scenarios are positive. Inputs use billions of parameters, dollars per **single GPU-hour**, `util: 70` rather than `0.70`, and an explicit million-token conversion. Occupancy is applied once. Power, hosting and networking are already inside the hourly rates; no additional markup is added. No negative result was concealed or repaired by targeting a positive margin.

**Reference-traffic companion.** With input:output **15:1**, serving cache **60%**, and **`billCacheHit` also changed to 60**, the central assumptions give **81.5293%**. Setting cache writes to zero as an additional billing normalization gives **80.3652%**.

Changing **only** the separate traffic object to 15:1/60%, while leaving the explicit `billCacheHit: 80`, instead gives **75.5975%**. That is a serving/billing mismatch scenario, not the coherent 60%-billed-cache comparison. Both are disclosed so the external leg can label its companion precisely; neither replaces the headline.

## 4 — WHY THESE INPUTS.

All judgments in this section are authored **2026-09-28**. “Carried” means carried as an assumption, not verified for the new model.

**Architecture: 100B active / 5T total — carried predecessor prior, with no Sol measurement.** **S7/A06** provide the scale context. I retain the earlier Sol working point near 100B rather than presume that each new generation doubles active compute. The 5T footprint is also a carried planning assumption, not a literal parameter count extracted from a knowledge-capacity paper. I regard a smaller active implementation than Astra’s assumed 200B as plausible for the workhorse role, but do not claim to have established that ordering. The low scenario’s 250B explicitly permits Sol to exceed Astra’s central active assumption. 

The chosen 100B happens to be half the sibling’s central active count. **It was not calculated from Sol’s one-fifth tariff or its predecessor’s price cut.** The low/high alternatives deliberately extend beyond the earlier Sol active-size range, reflecting how little the new release establishes. Actual active compute, routing density or matched throughput would replace this prior, not merely refine a decimal.

**Donor and precision: `dsr1`, FP8 — carried sibling judgments.** **S16/A07** explain the carrier. I have no public basis to identify either available GQA donor as a better Sol match. Retaining `dsr1` provides a consistent compressed-KV approximation, not a claim of literal MLA or 61 Sol layers. FP8 avoids crediting an unverified all-FP4 production graph. A precision or attention disclosure could move costs materially. 

**Fleet and procurement — carried sibling estate assumptions.** The **30% H200 / 50% GB200 / 20% GB300** shares remain judgment. **S8/S9** support the family and partner procurement model; they do not measure these percentages. I see no evidence that three days between the sibling estimate and this estimate require a different provider estate. Equally, common ownership of a service does not prove that Sol and Astra actually share this mix.

The all-in **$3.50/$4.50/$6.00** rates remain fixed across the scenarios. **S9/S10/A07** motivate a committed-capacity interpretation; they do not disclose a contract. In particular, the calculator registry’s planning rates cannot be relabeled as an observed all-in OpenAI bill. GB300’s $6 is an explicit assumption. The public H200/GB200 offers remain useful adverse procurement comparisons. 

I use `hwMode: "rent"` because no Sol-owned accelerator allocation was established. Consequently, I do **not** manufacture an owned-fleet depreciation conversion. These rental equivalents already pay the capacity supplier for capital recovery and operating costs; OpenAI’s occupancy divisor is then applied separately.

**Occupancy: 70%, with 55% and 75% endpoints — judgment without telemetry.** Central and high carry Astra’s values. The low case moves from Astra’s 60% to **55%** to represent a new release with a larger implementation and more scheduling slack. This is not a claim that launch demand is weak: high demand does not itself measure productive use of paid, latency-constrained capacity. I keep rates and stack efficiency unchanged rather than compound every downside.

**Efficiency: `stackMult: 1`, `trendMonths: 2` — carried once.** **S12/A07** motivate a residual allowance for model-specific kernel and serving work. At the calculator’s 3×/year conversion, it gives approximately **20.1% more effective throughput**, equivalent to **16.7% lower cost**. No separate `specDec` credit is applied. Cache reuse, occupancy and hardware gains are already explicit and are excluded from this residual. Removing the allowance alone gives **81.95%**, about **3.02 points** below central. Historical improvement claims do not identify a present standing gap. 

**Traffic: 12:1, 80% serving and billed cache, 50% writes among non-read input — carried sibling judgments.** I expect repeated coding/tool turns to make Sol more prefix-reusing than isolated-question traffic. **S5/S6** support that mechanism, not the selected frequencies. The operating point represents compact agent turns rather than exclusively maximum-effort research sessions. Central occupancy, traffic and write shares have **no representative public measurement behind them**.

The write share allows both reusable-prefix establishment and fresh material that is not written into a reusable prefix. It is not inferred from the existence of the write tariff. Removing all billed writes changes central from **84.97% to 84.43%**; the write assumption is therefore not what makes this an 85% estimate. Internal request batching does not imply discounted Batch API billing.

**Cache cost and latency: 5%, `balanced` — carried approximations.** A cache read still incurs lookup and KV movement; the 5% value is not a measurement of those operations. Cached context still participates in decode—the cache hit does not erase its KV footprint. Balanced retains the sibling’s latency/concurrency convention, not a demonstrated Sol service-level guarantee. Cache-cost measurements or matched latency/throughput results would move these choices.

**What the launch claims change—and do not change.** **S4** establishes product positioning and the tariff change. Benchmark scores affect neither `active` nor `total` directly. Task-price comparisons mix tariff, token usage and completion behavior; they are not serving-cost ratios. Speed claims do not reveal concurrent sequences per GPU. I found no representative numerical tokens-per-task reduction to insert into traffic. The caching announcement supports the direction of the traffic prior, but it receives no second efficiency multiplier. 

**Complete reconciliation with the sibling estimate.** Attachment 07’s values below are its September 25 assumptions, not targets. The changes and carries cover the entire operating vector. 

| Input | Astra estimate | Sol estimate | Treatment |
|---|---|---|---|
| API model | `gpt-6-astra` | `gpt-6-sol` | Different priced service; current identity checked independently. |
| Carrier / donor | `custom` / `dsr1` | Same | Carried approximation. |
| Active B, central / low / high | 200 / 350 / 120 | **100 / 250 / 50** | Earlier Sol scale prior; broader new-release alternatives, not price-derived sizes. |
| Total B, central / low / high | 6000 / 8000 / 4000 | **5000 / 8000 / 3000** | Central predecessor footprint; low carried; smaller high-case footprint. |
| Input / output tariff | $10 / $50 | **$2 / $10** | This model’s verified tariff. |
| Read / write multipliers | 10% / 125% | Same | Verified for Sol, not merely inherited. |
| Occupancy, central / low / high | 70 / 60 / 75 | **70 / 55 / 75** | Central/high carried; greater low-case launch slack. |
| Fleet shares; per-leg rents | H200/GB200/GB300 30/50/20; $3.50/$4.50/$6.00 | Same | Carried estate/procurement judgments. |
| Precision; latency; cost basis | FP8; balanced; rent | Same | Carried. |
| `stackMult`; `trendMonths`; speculative credit | 1; 2; none separately | Same | Carried once. |
| Input:output; serving/billed cache | 12:1; 80%/80% | Same | Carried agent-turn convention. |
| Write share; cache serving-cost factor | 50% of non-read; 5% of prefill | Same | Carried, unmeasured. |
| Representative input / output / decode / peak KV | 12000 / 1000 / 12500 / 13000 | Same | Carried absolute-length approximation. |
| `batchShare`; `discount` | 0; 0 | Same | Required list basis. |

A useful diagnostic separates price from engineering assumptions. Applying Sol’s tariff to Astra’s central cost vector gives **72.90%**, not 95%. Moving active size to 100B gives the **84.97%** central result; the smaller total footprint changes placement but not this carrier’s NVIDIA phase cost once it fits. No parameter was adjusted to preserve the sibling headline.

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The reference states **83.1% at list, span 68–92%**. Its unchanged declared vector now computes **82.33%** in the supplied comparison. I use that current arithmetic as the starting point, not the older headline as a target. The original tariff, fleet, utilization and efficiency choices are preserved in that starting vector.  

This is an **ordered local-replay waterfall**, not order-independent attribution and not a live MCP result. Each change follows the preceding one.

| Change from Opus toward Sol | Margin after change | Incremental margin points |
|---|---:|---:|
| Current Opus reference reproduced | 82.33% | — |
| Input/output tariff $5/$25 → $2/$10 | 55.82% | **−26.51** |
| Active parameters 300B → 100B | 80.41% | **+24.59** |
| Fleet 5/10/25/20/40 H100/H200/GB200/GB300/TPU → 0/30/50/20/0, retaining reference rents on surviving legs | 79.49% | **−0.92** |
| Total parameters 2.5T → 5T, after changing fleet | 79.49% | **0.00**, conditional on fit |
| H200/GB200/GB300 rents $3.496/$4.275/$5.70 → $3.50/$4.50/$6.00 | 78.85% | **−0.64** |
| Utilization 65% → 70% | 80.37% | **+1.51** |
| Cache-write share 0 → 50% of non-read input | 81.53% | **+1.16** |
| Input:output 15:1 → 12:1 | 82.89% | **+1.36** |
| Serving and billed cache 60% → 80% | **84.97%** | **+2.08** |

**Unchanged, hence zero contribution in this path:** FP8; `dsr1`; balanced latency; `stackMult: 1`; two months of residual efficiency; 5% cache serving cost; 10% read-price multiplier; 125% write-price multiplier; rented basis; no separate speculative-decode credit; and zero Batch share/discount. The reference’s inactive write-price multiplier becomes economically active without changing its value.

The zero direct total-size effect is a **limitation of this carrier**, not evidence that a larger expert footprint is free. Total parameters constrain resident memory and legal width; active parameters drive the NVIDIA surrogate weight-traffic term. I change fleet before total size so an infeasible leg cannot disappear and silently improve the comparison.

The dominant tradeoff is clear: **much lower assumed active compute compensates for a much lower tariff**. Sol is about **1.87 points above the original stated 83.1%**, or **2.64 points above the current reproduced reference**, only on its own chosen traffic. With coherent Reference traffic, Sol is **81.53%**, approximately **0.80 points below** the current Opus vector. With cache-write billing also normalized to the reference’s zero, Sol is **80.37%**, about **1.96 points below**. This is not evidence of a superior OpenAI serving stack.

The July company dive’s older Sol margin is not a validation either. It prices a different model and tariff and includes a separate overhead construction that I did not import on top of all-in hourly rates. 

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

**The most valuable measurement is aggregate Sol serving cost at a defined workload and service level.** A usable disclosure would specify model revision, fresh/read/write/reasoning token counts, input/output lengths, accelerator type/count, concurrent sequences, prefill/decode throughput, paid occupancy and all-in procurement. It would replace the architecture surrogate and much of the calibration transfer simultaneously.

The strongest downward falsifier would be evidence that effective work per billed token is substantially above the 100B-active approximation, or that Standard service needs much lower batching than `balanced` represents. Evidence for a smaller implementation, higher aggregate throughput at the same latency, or lower genuine all-in committed rates would move the result upward.

These are **one-variable local sensitivities**, not additional endpoints or new public measurements:

| Change from central | Modeled margin | Direction of evidence |
|---|---:|---|
| Active parameters 200B | **72.90%** | More work per token substantially lowers the estimate. |
| Active parameters 300B | **60.82%** | The current headline would be materially too high. |
| Active parameters 50B, otherwise central | **91.00%** | Smaller active compute supports the upper scenario. |
| Paid occupancy 50% | **78.95%** | More paid slack lowers the estimate. |
| Double all three all-in rents | **69.94%** | Procurement can materially outweigh engineering gains. |
| Public CoreWeave H200/GB200 rates, GB300 retained at $6 | **73.26%** | Public-price procurement is much less favorable. |
| Remove the residual efficiency allowance | **81.95%** | No private standing advantage costs about three points. |
| Cache-read serving cost 15%, rather than 5% of prefill | **82.04%** | More expensive KV reuse lowers the estimate. |

A changed alias, material non-NVIDIA allocation, different attention geometry, or a much longer context distribution could invalidate the carrier even if the resulting margin coincidentally remained near 85%. Likewise, a tariff change alters the denominator without establishing any physical efficiency gain.

The launch price reduction must not be treated as a cost disclosure. At the predecessor’s current $4/$20 tariff but with **this report’s costs unchanged**, the arithmetic would give **92.48%**. The reduction to $2/$10 lowers that to **84.97%**. This is a tariff-only diagnostic, not an estimate of the predecessor’s costs or a forecast of a Sol price increase. The verified predecessor comparison is in S3/S4. 

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Absolute context and reasoning lengths.** `context_length_assumed` is documentation, not a numeric engine input. The custom-traffic path supplies a 1,000-token output-length convention, so 12:1 produces 12,000 input tokens, 12,500 representative decode context and 13,000 peak KV context. I adopt those lengths explicitly as a compact-agent-turn approximation. They are not a measured Sol average. A request below the 272K tariff boundary can still be much more expensive than this operating point; this report does not price the entire short-context distribution or the million-token tier. The fixed-length behavior is also documented in the supplied sibling report. 

**Architecture and donor choice.** The API permits selecting `dsr1`, but not specifying Sol’s actual layer count, hybrid/recurrent computation, sparse-attention schedule, expert replication, per-layer precision, independently placed prefill/decode or arbitrary KV compression. The donor choice is expressible; a faithful closed-model geometry is not. Literal active/total parameters, routing and precision remain unestablished.

**Capacity is a policy check, not a deployment receipt.** Under the carrier’s uniform one-byte-per-parameter resident-memory policy and 10% HBM reserve, all declared legs fit at these calculated widths:

| Scenario | H200 GPUs | GB200 GPUs | GB300 GPUs |
|---|---:|---:|---:|
| Central | 56 | 42 | 22 |
| Low margin | 88 | 68 | 34 |
| High margin | 40 | 26 | 14 |

These are **solver-equivalent local checks**, not observed replicas. Each scenario retains **three of three legs and 100% of its declared token share**. Real workspace, communication and placement remain unverified. The contract itself warns that dropping infeasible legs can create non-monotonic margins; that mechanism is not used to support these headlines. 

Changing to `qwen3c` while holding the other central settings fixed fails the H200 memory check: its larger KV footprint at the declared concurrency exhausts the available memory allowance before weights fit. I do not let H200 disappear and report the renormalized remainder as a better estimate. A GQA hypothesis would need a jointly revised batching/placement scenario, not a donor toggle presented as independent evidence.

**Service levels and calibration transfer.** Endpoint speed does not establish that the carrier’s concurrency meets Sol’s production latency requirements. Its prefill coefficient is transferred from an open-model anchor; the GB200 coefficient is carried across a precision basis; and GB300’s operating point is partly assumed. No matched Sol benchmark validates these transfers. The numerical reference checks validate transcription, not physical representativeness. 

This limitation can exceed the three-scenario span. As a separate structural stress—not a fourth endpoint—changing only the carrier’s latency posture to `fast` while retaining the **Standard tariff** gives about **37.7%** in the local equations. That is **not OpenAI Fast-mode economics**: the provider’s Fast tariff is different. It demonstrates that the span is conditional on balanced serving, not a bound over every plausible service-level regime.

**Fleet and procurement coverage.** I could not establish Sol-specific sites, GPU-generation shares, owned-versus-rented allocation, executed all-in hourly rates or the contribution of Cerebras, AMD or custom accelerators. Those platforms lack usable rows in this commission’s allowed accelerator set. Assigning them fictitious NVIDIA equivalents would obscure rather than resolve the gap. The current partner-centric approximation does not prove that other platforms serve zero Sol traffic.

**Cache lifecycle and cost perimeter.** A scalar read-cost factor and write-billing share cannot express retention, eviction, prefix placement, cache tiering, inter-host movement or write-specific overhead. Billing and serving cache fractions may differ; their equality here is an assumption. I also could not establish model-specific revenue sharing, unbilled internal work, tool-cost allocation or failed-generation rates. Training, R&D, sales, G&A, free-tier serving, support and unbilled retries remain outside the commissioned quantity. Paid serving-capacity slack is already charged through occupancy, not added again as a corporate reservation burden.

**Remaining evidence gaps.** As of **2026-09-28**, I could not establish an immutable Sol snapshot; literal architecture or production precision; representative absolute input/output/reasoning lengths; aggregate tokens/GPU-second; paid occupancy; a serving/billed cache census; write frequency; a numerical population-wide tokens-per-task reduction; a standing residual advantage over open practice; or Sol-specific revenue, direct cost and margin. The retrieved sources establish the product and tariff, plus provider-level context—not those missing measurements. No statement by this model about its own provider is used as evidence.

**Publication status.** The report supplies three complete, positive, locally capacity-checked scenarios and transparent equation-replay expectations. **It does not contain a successful live MCP result.** The submitting leg’s calculator result should be published as the engine headline, with any difference from **85.0% (57.8–91.6%)** preserved rather than tuned away. The principal uncertainty is the unmeasured serving workload and architecture, not the rounding of the calculation.

Download the complete copy-of-record report (a file in the research run's own workspace, not published)
