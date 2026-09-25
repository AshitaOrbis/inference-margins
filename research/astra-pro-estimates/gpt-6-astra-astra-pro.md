# GPT-6 Astra — GPT-6 Astra Pro estimate (2026-09-25)

**Provenance.** One GPT-6 Astra Pro research run (ChatGPT, model `gpt-6-pro`), request `pr-20260925T060752Z-64acdf`, answered 2026-09-25T06:35:33Z. It was given this calculator's input contract, the Claude Opus 4.x reference estimate and the live connector's scenario space, and asked to set every input for GPT-6 Astra from public evidence. The answer is reproduced below verbatim except for three presentation changes: ChatGPT's interface citation markers are removed, as on every page of this annex; links into the research run's own sandbox (files no reader can open) keep their text and lose the dead target; and equations are set as preformatted text, with a space between a bracket and a parenthesis inside them so the renderer does not read a product as a link; its sources are cited by URL in the text (published text SHA-256 `5af87989ce2a24c927f726c6ff0e199f4617063164f401d003432d72b5afd753`; as received, `0417a9e76550125df8a4c5cb09d70ea5d75f2f8eecf7ec4ecfb77e8bf7f1b4cd`).

## What the site shows

| reading | value |
|---|---|
| **Card headline** — this calculator on the run's central inputs, at list | **~95%** (94.58%) |
| Span — the run's own low- and high-margin scenarios, same engine | 89%–97% (89.45% – 96.74%) |
| The run's own stated reading | 94.6% (89.5–96.7%) |
| Same central inputs at the page's Reference traffic (15:1, 60% cache) — context, not the headline | ~93% |

The span is the author's judgment span: two scenarios it called plausible as a whole, not a probability interval and not a bound. The headline is a modeled unit direct-serving margin from public information; it is not a disclosure by the provider and not a company gross margin.

## Our reading

The run's own arithmetic and this calculator agree to within 0.05 points on all three scenarios, which says the inputs were transcribed faithfully — not that they are right. What carries the number is the price: at $50 per million output tokens, even the run's low case (350B active, 8T total, 60% occupancy) keeps the margin near 89%. The input with no public measurement behind it is the active-parameter count (200B central), and the run shows the direction plainly: 400B active alone gives about 90%, 100B about 97%. Two further choices lift the billed side and are worth noticing: half of the fresh (uncached) input is billed as cache writes at 125% of the input price, and 80% of input is billed at the cache-read rate — an agentic, prefix-heavy traffic assumption rather than a measured OpenAI mix. The run could not reach the calculator's connector itself and worked the equations locally; its replay of the Opus 4.x reference matched the page's 82.33%. A separate, earlier Astra Pro run for this project (2026-09-19, different brief) put GPT-6 Astra at 93% on this calculator; the two land two points apart. The run also re-checked OpenAI's pricing page and found no API tariff for GPT-6 Astra Pro itself, which is why that model has no card.

## The operating point

Carrier: the calculator's blank `custom` row on the `dsr1` attention geometry (a declared approximation — this model's architecture is not published). `batchShare` and `discount` are 0 in every run (list basis).

| input | central | low-margin scenario | high-margin scenario |
|---|---|---|---|
| `customDonor` | dsr1 | dsr1 | dsr1 |
| `active` | 200 | 350 | 120 |
| `total` | 6000 | 8000 | 4000 |
| `precision` | fp8 | fp8 | fp8 |
| `priceIn` | 10 | 10 | 10 |
| `priceOut` | 50 | 50 | 50 |
| `cacheReadMult` | 10 | 10 | 10 |
| `billCacheHit` | 80 | 80 | 80 |
| `cacheWriteShare` | 50 | 50 | 50 |
| `cacheWriteMult` | 125 | 125 | 125 |
| `cacheCost` | 5 | 5 | 5 |
| `batchShare` | 0 | 0 | 0 |
| `discount` | 0 | 0 | 0 |
| `blend` | `{"h200":30,"gb200":50,"gb300":20}` | `{"h200":30,"gb200":50,"gb300":20}` | `{"h200":30,"gb200":50,"gb300":20}` |
| `rentAbsLeg` | `{"h200":3.5,"gb200":4.5,"gb300":6}` | `{"h200":3.5,"gb200":4.5,"gb300":6}` | `{"h200":3.5,"gb200":4.5,"gb300":6}` |
| `util` | 70 | 60 | 75 |
| `stackMult` | 1 | 1 | 1 |
| `trendMonths` | 2 | 2 | 2 |
| `interact` | balanced | balanced | balanced |
| `hwMode` | rent | rent | rent |
| traffic | 12:1, 80% cache | 12:1, 80% cache | 12:1, 80% cache |

## The answer, verbatim

## 0 — THE CARD, IN TWO LINES.

≈94.6% at list (span 89.5–96.7%)  
The deciding assumption is 200B active parameters, which puts modeled output serving cost near $1.85/M against the $50/M output tariff.

## 1 — PUBLIC FACTS.

Prepared by **GPT-6 Astra Pro**. Verification cutoff: **2026-09-25 UTC**. Currency: USD. Dates identified as “read” are retrieval dates for living pages, not claimed publication dates.

File receipt—all three uploaded files were readable: `03-calculator-contract-live-2026-09-25.json` began `{"result":{"content":[{"type":"text","text":"The scenario space of the Frontier Inference Margins ca…`; `04-opus-4x-reference-dive-verbatim-2026-08-08.md` began `` ```json ``; `06-openai-gptpro.md` began `# OpenAI — GPT-5.6 Pro deep dive`. The inline attachments 01, 02 and 05 were also read.

1. **Exact model and version boundary — DISCLOSED; immutable version UNKNOWN.** I price **`gpt-6-astra`**, released to the API on **September 3, 2026**, as served under its current alias. The model page lists the alias, but I could not establish a date-suffixed immutable snapshot. I do not invent one. Sources **S1**, https://developers.openai.com/api/docs/changelog — release entry **2026-09-03**; **S2**, https://developers.openai.com/api/docs/models/gpt-6-astra — read **2026-09-25**. 

2. **Tariff verified — DISCLOSED.** Standard short-context Astra is **$10 fresh input / $1 cached input / $12.50 cache-write input / $50 output per million tokens**. The project's three quoted prices are correct but omit the write category. Long-context Standard is **$20 / $2 / $25 / $75**; short-context Fast is **$20 / $2 / $25 / $100**. This estimate uses neither. I found no Astra introductory discount; the promotional notice concerns **GPT-5.6 Sol**, not Astra. Source **S3**, https://developers.openai.com/api/docs/pricing — read **2026-09-25**. 

3. **Variants and Pro — DISCLOSED for Astra options; Pro API tariff UNKNOWN.** Astra supports several reasoning-effort settings, a 1,050,000-token context window and up to 128,000 output tokens; the short-context tariff boundary is 272,000 input tokens. I price Standard single-model text-token traffic across reasoning settings, with billed reasoning included in output—not ChatGPT subscriptions, Fast mode, tools or a separate Pro execution. **I found no `gpt-6-pro` API tariff on the current pricing page.** Sources **S2/S3**, https://developers.openai.com/api/docs/models/gpt-6-astra and https://developers.openai.com/api/docs/pricing — read **2026-09-25**. 

4. **Astra architecture — UNKNOWN; predecessor proxy COMMUNITY ESTIMATE.** No public Astra parameter count, expert routing density, production precision or attention geometry was established. Epoch's **50–300B active-parameter estimate concerns GPT-5**, not Astra. It is an order-of-magnitude prior only. My **200B active / 6T total / FP8** is **ASSUMED**, not a new community finding or a deduction from the price. Source **S6**, https://epoch.ai/gradient-updates/how-many-digital-workers-could-openai-deploy — **2025-10-03**; Astra documentation **S2**, read **2026-09-25**. 

5. **Cache mechanics and evidence — DISCLOSED.** OpenAI distinguishes uncached input, cache reads and cache writes; these are billing categories, not three charges on the same token. Its September 22 update reports improved caching and selected customers with high cache-hit rates, including Manus above 90%. **Those examples do not disclose Astra's population mix.** Sources **S4**, https://developers.openai.com/api/docs/guides/prompt-caching — read **2026-09-25**; **S5**, https://openai.com/index/better-prompt-caching-for-gpt-6/ — **2026-09-22**. 

6. **Hardware families and location — DISCLOSED at provider level; Astra allocation UNKNOWN.** OpenAI identifies operating Hopper/Blackwell systems across Microsoft, OCI and CoreWeave. Its infrastructure account describes a partner-centric buildout and GPT-5.5 training at Abilene on OCI GB200s. Neither disclosure identifies Astra's inference sites or its GPU-generation shares. I use a US partner-capacity approximation, not an asserted Astra-to-Abilene assignment. Sources **S7**, https://openai.com/index/scaling-ai-for-everyone/ — **2026-02-27**; **S8**, https://openai.com/index/building-the-compute-infrastructure-for-the-intelligence-age/ — **2026-04-29**. 

7. **Announced capacity is not a deployed serving fleet — DISCLOSED.** The 3 GW inference figure in S7 concerns the Rubin collaboration; I do not repeat attachment 06's treatment of it as already-operating inference capacity. OpenAI's Jalapeño results likewise describe deployment beginning by year-end, not a measured Astra production share today. Source **S9**, https://openai.com/index/jalapeno-first-results/ — **2026-08-25**, alongside **S7** above. 

8. **Public rental comparators — DISCLOSED.** CoreWeave lists an eight-GPU H200 system at **$50.44/hour**, equivalent to **$6.305/GPU-hour**, and a four-GPU GB200 slice at **$42/hour**, equivalent to **$10.50/GPU-hour**, with host resources. Its GB300 listing directs buyers to sales rather than giving a numeric on-demand price. These are public product quotes, **not OpenAI's contracts**. Source **S10**, https://www.coreweave.com/pricing — read **2026-09-25**. 

9. **Procurement used here — INFERENCE, with a weak GB300 assumption.** I use all-in reserved-capacity equivalents of **H200 $3.50, GB200 $4.50 and GB300 $6.00 per GPU-hour**. The first two interpolate below S10's on-demand offers using S8's dedicated, long-term procurement posture and attachment 03's planning comparators. The GB300 premium is an assumption, not a located quote. These rates include accelerator, power, hosting and networking. Sources **S8/S10** above, and the supplied contract dated **2026-09-25**. 

10. **Speed evidence — COMMUNITY ESTIMATE, specifically an independent measurement.** Artificial Analysis's current max-effort OpenAI endpoint measurement reports approximately **53.7 output tokens/second** and **367.59 seconds to first answer token**. The latter includes reasoning. Neither number is aggregate throughput per GPU, and I do not divide a GPU rent by 53.7. Source **S11**, https://artificialanalysis.ai/models/gpt-6-astra/providers — read **2026-09-25**. 

11. **Utilization and actual traffic — UNKNOWN.** I found no representative Astra paid-capacity occupancy, aggregate tokens/GPU-second, cache/write distribution or input:output census in the provider and benchmark sources above. **70% occupancy, 12:1 input:output and 80% cache hits are ASSUMED.** Epoch's FLOP-utilization discussion is not paid-capacity occupancy and is not used as this calculator's divisor. Search boundary: **S2, S5–S8, S11**, checked **2026-09-25**; relevant proxy URL https://epoch.ai/gradient-updates/how-many-digital-workers-could-openai-deploy — **2025-10-03**. 

12. **Serving improvements — DISCLOSED; standing advantage INFERENCE.** OpenAI reports a **20% serving-cost reduction from kernel work** and **over 15% generation-efficiency improvement from draft-model work** for GPT-5.6. These are improvement flows, not a measured Astra advantage over today's open stack. They motivate a modest residual prior, counted once, rather than multiplied together. Source **S12**, https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency/ — **2026-07-29**. 

13. **Financial perimeter — CREDIBLY REPORTED; model margin UNKNOWN.** Reuters relayed a **33% adjusted OpenAI company gross margin for 2025**. That is not Astra's model-specific direct-serving contribution margin and does not calibrate this estimate. I found no public Astra cost-per-million or serving-margin disclosure. Source **S13**, https://www.reuters.com/technology/openai-sees-compute-spend-around-600-billion-by-2030-cnbc-reports-2026-02-20/ — **2026-02-20**. 

14. **Calculator evidence — DISCLOSED by its author, not measured provider economics.** I read its published roofline implementation and registries and independently transcribed the relevant equations. Sources **S14**, https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js; **S15**, https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js; **S16**, https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine.js — retrieved **2026-09-25**, together with attachments 01–04. The local calculation is **not an executed MCP result**.  

## 2 — CALCULATOR INPUTS.

`cacheWriteShare` below is the implementation's percentage of **non-cache-read input**, consistent with the reference's “fresh input” wording. At 80% cache reads, a value of 50 produces **80% read / 10% ordinary fresh / 10% write** across all input tokens. Source IDs on assumed inputs indicate context, not evidence that measures the chosen value. The `stated` values are rounded local-replay expectations. 

```json
{
  "model_id": "custom",
  "model_name": "GPT-6 Astra",
  "api_model_priced": "gpt-6-astra, current alias read 2026-09-25 UTC; API release 2026-09-03; Standard processing, short-context text-token traffic, mixed reasoning effort; no dated immutable snapshot established",
  "customDonor": "dsr1",
  "basis": "list",
  "context_length_assumed": "Short-context tariff: input <=272,000 tokens. Representative calculator request: 12,000 input and 1,000 billed output tokens including reasoning; decode context 12,500, peak KV 13,000. These lengths are assumed, not measured.",
  "central": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 200,
      "total": 6000,
      "precision": "fp8",
      "priceIn": 10,
      "priceOut": 50,
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
        "gb300": 6.0
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
      "active": 350,
      "total": 8000,
      "precision": "fp8",
      "priceIn": 10,
      "priceOut": 50,
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
        "gb300": 6.0
      },
      "util": 60,
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
      "active": 120,
      "total": 4000,
      "precision": "fp8",
      "priceIn": 10,
      "priceOut": 50,
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
        "gb300": 6.0
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
    "headline_pct": 94.6,
    "low_pct": 89.5,
    "high_pct": 96.7
  },
  "sources": [
    {"id": "S1", "claim": "API release of gpt-6-astra on September 3, 2026.", "url": "https://developers.openai.com/api/docs/changelog", "date": "2026-09-03", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "Current Astra alias, reasoning settings, context limits and available snapshot listing; read date, not a publication date.", "url": "https://developers.openai.com/api/docs/models/gpt-6-astra", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "Standard Astra prices: input 10, cache read 1, cache write 12.50, output 50 USD/M; read date.", "url": "https://developers.openai.com/api/docs/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "Cache billing categories and prompt-cache mechanics; read date.", "url": "https://developers.openai.com/api/docs/guides/prompt-caching", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S5", "claim": "Improved GPT-6 caching and selected customer results, not an Astra-wide traffic census.", "url": "https://openai.com/index/better-prompt-caching-for-gpt-6/", "date": "2026-09-22", "evidence_class": "DISCLOSED"},
    {"id": "S6", "claim": "Epoch estimated 50-300B active parameters for GPT-5; a predecessor proxy, not an Astra measurement.", "url": "https://epoch.ai/gradient-updates/how-many-digital-workers-could-openai-deploy", "date": "2025-10-03", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S7", "claim": "Hopper and Blackwell systems operating across Microsoft, OCI and CoreWeave; Rubin capacity is separately forward-looking.", "url": "https://openai.com/index/scaling-ai-for-everyone/", "date": "2026-02-27", "evidence_class": "DISCLOSED"},
    {"id": "S8", "claim": "Partner-centric infrastructure; Abilene/OCI GB200 training evidence does not identify Astra serving allocation.", "url": "https://openai.com/index/building-the-compute-infrastructure-for-the-intelligence-age/", "date": "2026-04-29", "evidence_class": "DISCLOSED"},
    {"id": "S9", "claim": "Jalapeno benchmark results and a deployment plan for year-end, not a disclosed Astra serving share.", "url": "https://openai.com/index/jalapeno-first-results/", "date": "2026-08-25", "evidence_class": "DISCLOSED"},
    {"id": "S10", "claim": "Public CoreWeave H200 and GB200 system-hour prices; no numeric GB300 on-demand quote; read date.", "url": "https://www.coreweave.com/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S11", "claim": "Artificial Analysis Astra max-effort endpoint speed and latency measurements; read date.", "url": "https://artificialanalysis.ai/models/gpt-6-astra/providers", "date": "2026-09-25", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S12", "claim": "OpenAI reports 20% lower serving costs from kernel work and over 15% generation-efficiency improvement from draft-model work.", "url": "https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency/", "date": "2026-07-29", "evidence_class": "DISCLOSED"},
    {"id": "S13", "claim": "Reuters relays a 33% adjusted company gross margin for 2025; not an Astra serving margin.", "url": "https://www.reuters.com/technology/openai-sees-compute-spend-around-600-billion-by-2030-cnbc-reports-2026-02-20/", "date": "2026-02-20", "evidence_class": "CREDIBLY REPORTED"},
    {"id": "S14", "claim": "Calculator-author-published roofline equations, retrieved for independent arithmetic; not OpenAI measurements.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S15", "claim": "Calculator-author-published donor, precision, calibration, batch and legal-domain registries; not OpenAI measurements.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S16", "claim": "Calculator-author-published billing and cost composition, used with the supplied contract; retrieval date.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"}
  ],
  "key_inputs": [
    {"input": "active", "central": 200, "low_margin": 350, "high_margin": 120, "source_ids": ["S6"], "evidence_class": "ASSUMED"},
    {"input": "total", "central": 6000, "low_margin": 8000, "high_margin": 4000, "source_ids": ["S6"], "evidence_class": "ASSUMED"},
    {"input": "customDonor", "central": "dsr1", "low_margin": "dsr1", "high_margin": "dsr1", "source_ids": ["S15"], "evidence_class": "ASSUMED"},
    {"input": "precision", "central": "fp8", "low_margin": "fp8", "high_margin": "fp8", "source_ids": ["S15"], "evidence_class": "ASSUMED"},
    {"input": "priceIn", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S3"], "evidence_class": "DISCLOSED"},
    {"input": "priceOut", "central": 50, "low_margin": 50, "high_margin": 50, "source_ids": ["S3"], "evidence_class": "DISCLOSED"},
    {"input": "cacheReadMult", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S3"], "evidence_class": "DISCLOSED"},
    {"input": "cacheWriteMult", "central": 125, "low_margin": 125, "high_margin": 125, "source_ids": ["S3"], "evidence_class": "DISCLOSED"},
    {"input": "cacheWriteShare", "central": 50, "low_margin": 50, "high_margin": 50, "source_ids": ["S4", "S5"], "evidence_class": "ASSUMED"},
    {"input": "billCacheHit", "central": 80, "low_margin": 80, "high_margin": 80, "source_ids": ["S5"], "evidence_class": "ASSUMED"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": ["S14", "S15"], "evidence_class": "ASSUMED"},
    {"input": "blend", "central": {"h200": 30, "gb200": 50, "gb300": 20}, "low_margin": {"h200": 30, "gb200": 50, "gb300": 20}, "high_margin": {"h200": 30, "gb200": 50, "gb300": 20}, "source_ids": ["S7", "S8", "S9", "S15"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg", "central": {"h200": 3.5, "gb200": 4.5, "gb300": 6.0}, "low_margin": {"h200": 3.5, "gb200": 4.5, "gb300": 6.0}, "high_margin": {"h200": 3.5, "gb200": 4.5, "gb300": 6.0}, "source_ids": ["S8", "S10"], "evidence_class": "INFERENCE"},
    {"input": "util", "central": 70, "low_margin": 60, "high_margin": 75, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "stackMult", "central": 1.0, "low_margin": 1.0, "high_margin": 1.0, "source_ids": ["S12"], "evidence_class": "ASSUMED"},
    {"input": "trendMonths", "central": 2, "low_margin": 2, "high_margin": 2, "source_ids": ["S12"], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "balanced", "low_margin": "balanced", "high_margin": "balanced", "source_ids": ["S2", "S11", "S15"], "evidence_class": "ASSUMED"},
    {"input": "hwMode", "central": "rent", "low_margin": "rent", "high_margin": "rent", "source_ids": ["S8"], "evidence_class": "INFERENCE"},
    {"input": "traffic.io_ratio", "central": 12, "low_margin": 12, "high_margin": 12, "source_ids": ["S5", "S11"], "evidence_class": "ASSUMED"},
    {"input": "traffic.cache_hit", "central": 80, "low_margin": 80, "high_margin": 80, "source_ids": ["S5"], "evidence_class": "ASSUMED"},
    {"input": "batchShare", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "discount", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"}
  ],
  "confidence": "low: tariffs are verified and the local equation replay reproduces the supplied Opus check, but Astra architecture, fleet allocation, procurement, utilization and traffic are unmeasured; the span is three conditional scenarios, not a probability interval."
}
```

## 3 — YOUR OWN READING.

**My reading is 94.6% at list, with a selected three-scenario span of 89.5–96.7%.** It is a modeled unit direct-serving contribution margin, not verified OpenAI economics and not company gross margin.

The calculation is unusually sensitive to an unmeasured architecture, but the tariff is not ambiguous. My central case assumes a sparse 200B-active model, rented high-memory NVIDIA capacity, 70% paid-capacity occupancy, and repeated agent work with substantial prefix reuse. The low case is a **350B-active, 8T-total model at 60% occupancy**; the high case is a **120B-active, 4T-total model at 75% occupancy**. Both retain the central rents, fleet, precision, latency posture, efficiency credit and traffic. Thus neither endpoint stacks every possible unfavorable or favorable assumption.

**Execution status.** I did not obtain a working connection to `run_scenario` at https://margins-mcp.ashitaorbis.com/mcp. The HTTP access and connector-discovery attempts produced no scenario result. Accordingly, there is **no successful MCP call or returned margin to quote**. The intended invocation for each block is `run_scenario(model="custom", perspective="median", overrides=<that block's overrides>, traffic=<that block's traffic>)`.

Instead I performed an **independent local equation replay** of the retrieved source. As a check—not as a target—it produces **82.3264848%** for the supplied current Opus reference, matching attachment 02's **82.33%**. That checks the arithmetic path at that operating point; it does not validate Astra's assumptions or certify every live-connector wrapper. The project's actual rerun should be published as the calculator result even if it differs.

**The arithmetic.** For this FP8, MLA-donor, NVIDIA scenario, the retrieved equations reduce to the following. Let active parameters be `A` in actual parameters; input length `I = 12,000`; representative decode length `L = 12,500`; donor attention coefficient `a = 4,997,120 FLOP/context-position`; donor KV footprint `k = 35,136 bytes/context-token`; and per-output fabric payload `d = 13,303,808 bytes`. For each GPU type with FLOP rate `F`, HBM bandwidth `B`, fabric bandwidth `N`, declared per-chip batch `b`, and decode coefficient `η`:

```text
T_{\rm pre}=\frac{0.17581\,E}{\max\{(2A+aI/2)/F,\ d/N\}},
\qquad
T_{\rm out}=\frac{b\eta E}{\max\{b(2A+aL)/F,\ (A+bkL)/B,\ bd/N\}}.
```
Here **`E = 3^(2/12) = 1.200936955`** is the only residual private-stack credit. The underlying batch values are H200 **96**, GB200 **128**, GB300 **64**, and decode coefficients **0.313491 / 0.315997 / 0.258295**. These are the calculator's transferred or assumed coefficients, not measured Astra efficiencies. Sources: **S14–S15**.  

For each phase and GPU:

```text
C_{\rm phase}=\frac{\text{all-in dollars/GPU-hour}\times10^6}
{3600\times T_{\rm phase}\times0.70}.
```
I then weight **costs** by served-token shares, rather than averaging throughput and applying an average rent:

| Central leg | Token share | All-in $/GPU-hour | Fresh prefill tokens/s/GPU | Decode tokens/s/GPU | Fresh cost $/M | Output cost $/M |
|---|---:|---:|---:|---:|---:|---:|
| H200 | 30% | 3.50 | 972 | 716 | 1.42853 | 1.93873 |
| GB200 | 50% | 4.50 | 2,455 | 1,517 | 0.72733 | 1.17738 |
| GB300 | 20% | 6.00 | 2,455 | 696 | 0.96977 | 3.41969 |
| **Token-weighted cost** | **100%** | — | — | — | **0.986176** | **1.854249** |

The GB300 ordering is inherited from its smaller assumed batch and lower coefficient. I neither interpret it as an observed GB300 disadvantage nor change its coefficient to improve the headline.

For **one million billed output tokens plus twelve million input tokens**, billings are:

```text
R=50+12[0.10(10)+0.10(12.50)+0.80(1)]=\$86.60.
```
Cache reads cost `0.05 × 0.986175862 = $0.049308793/M`. Ordinary fresh and cache-write tokens both incur modeled fresh-prefill cost. Thus:

```text
C=1.854249067+12[0.20(0.986175862)+0.80(0.049308793)]
=\$4.694435550,
```
```text
M=1-\frac{4.694435550}{86.60}=\mathbf{94.5791737\%}.
```
| Scenario | Fresh cost $/M | Output cost $/M | Direct cost per 13M-token bundle | Billings per bundle | Local-replay margin |
|---|---:|---:|---:|---:|---:|
| Central | 0.986176 | 1.854249 | 4.694436 | 86.60 | **94.5792%** |
| Low margin | 1.953272 | 3.510386 | 9.135809 | 86.60 | **89.4506%** |
| High margin | 0.577931 | 1.155872 | 2.820314 | 86.60 | **96.7433%** |

The central blended quantities are **$0.361110 cost and $6.661538 billings per million aggregate tokens**. All three scenarios are positive. The unit audit uses **billions**, not raw parameter counts, in the JSON; **per GPU**, not per rack or Grace-Blackwell package, for rents; **percent 70**, not fraction 0.70, for `util`; and the explicit million-token conversion above. No separate power, host or networking markup is added.

**Reference traffic companion.** At 15:1 and 60% cache reuse **with `billCacheHit` also changed to 60**, the central cost assumptions give **93.3585%**. Keeping the central 50% write share of non-read input is appropriate to the same assumed cache lifecycle. For an additional zero-write normalization, the result is **92.9399%**.

There is an important replay distinction: changing **only** the separate traffic object to 15:1/60%, while leaving the explicit central `billCacheHit: 80`, gives **91.2256%**. That is a legitimate serving/billing-cache mismatch scenario, but not the coherent 60%-billed-cache comparison. The external leg should disclose which companion it runs; the headline block itself requires no change.

## 4 — WHY THESE INPUTS.

**Active and total parameters: 200B / 6T; judgments without an Astra measurement.** S6 supports a broad predecessor scale, not these numbers. I choose 200B as a larger-frontier-model working prior rather than simply inherit the earlier Sol estimate near 100B. Six trillion total represents a sparse, multi-trillion footprint; it is not a literal estimate derived from memorization capacity, tariff or single-stream speed. The activation ratio is about 3.3%, but I assert no expert count. The 350B/8T and 120B/4T alternatives carry most of the selected scenario spread. An actual checkpoint description or matched aggregate serving measurement would replace these assumptions.

**Donor and precision: `dsr1`, FP8; judgments.** There is no public reason to declare Astra to be DeepSeek-shaped, but neither GQA alternative is established as a better match. I retain the project's compressed-KV donor for comparability, with its geometry explicitly frozen. FP8 is a neutral working serving precision rather than crediting an unverified all-FP4 production graph. No assumption of literal MLA or 61 Astra layers is made. **S2, S14–S15** distinguish unknown provider architecture from known carrier mechanics.

**Fleet: H200 30%, GB200 50%, GB300 20%; judgment informed by S7–S9.** The family evidence supports NVIDIA partner capacity; the exact shares do not have public telemetry. Concentrating a new frontier deployment on higher-memory hardware is my inference. I do not import TPU procurement economics from Anthropic, treat future Jalapeño capacity as installed, or disguise an unsupported accelerator as an allowed ID.

A preliminary H100-containing vector failed the carrier's capacity check: at **6T total**, 13,000-token peak KV and its 96-sequence batch, H100 requires more than the registered 144-device domain. I rejected that vector rather than let the engine discard an expensive leg and renormalize silently. The final three-leg assumption is explicit. This is **not evidence that OpenAI cannot serve Astra on a larger H100 deployment**; that topology is outside this calculator's registered domain. 

Under the retrieved uniform one-byte-per-parameter capacity policy and 10% HBM reserve, the final scenarios admit the following registered widths:

| Scenario | H200 GPUs | GB200 GPUs | GB300 GPUs |
|---|---:|---:|---:|
| Central | 72 | 50 | 26 |
| Low margin | 88 | 68 | 34 |
| High margin | 48 | 34 | 18 |

These are **local capacity-solver-equivalent results, not observed replicas**. Every declared leg fits the carrier's policy in each case. Real workspace, replication and latency feasibility remain unverified.

**All-in rents: $3.50 / $4.50 / $6.00; inference, not contract discovery.** S8 supplies the procurement-class rationale, S10 the public product comparison, and attachment 03 the planning context. H200's assumed rate is approximately 56% of the cited public offer; GB200's approximately 43%. Those fractions are judgments about committed capacity, not disclosed discounts. GB300 is weaker still: $6 is an assumed premium over GB200. I keep all three rates unchanged at the endpoints rather than make the small-model case also enjoy the cheapest procurement.

I use a **rented-capacity lens** because the disclosed infrastructure is partner-centric. I have not established an OpenAI-owned accelerator allocation, so I do not manufacture an owned-fleet depreciation calculation. Provider capital recovery and operating costs are inside the assumed rental equivalents, and occupancy is applied once afterward.

**Utilization: 70%, with 60% and 75% in the endpoints; judgment without public measurement.** This is the share of paid serving capacity productively occupied, not peak FLOP utilization and not an already-realized production throughput divisor. A smaller implementation may be easier to fill; a larger newly deployed one may carry more scheduling slack. That is the scenario correlation being represented. There is no claimed probability attached to these occupancy values.

**Efficiency: `stackMult: 1`, `trendMonths: 2`; judgment motivated by S12.** Two months at 3×/year means about **20.1% more effective throughput**, or **16.7% lower modeled cost**. I do not add the reported 20% and 15% improvements, infer a one-for-one standing lead, or add `specDec`. Cache reuse is already explicit; occupancy is already explicit. The lead is a discounted residual allowance for model-specific kernel and serving work beyond the published baseline, not a second cache or utilization credit. All three scenarios retain it. Setting it to zero independently lowers the central margin to **93.4899%**.

**Traffic: 12:1, 80% cache reads, 50% writes among non-read inputs; judgments.** I expect repeated agent/tool turns to create more prompt reuse than isolated questions. S5 supports that mechanism but does not measure the mix; S11's benchmark convention is not a population census. I choose 80%, below the strongest selected-customer examples. The write-share assumption divides the remaining 20% of input equally between ordinary fresh input and cache establishment. Both billing and serving cache fractions are explicitly 80%.

**Cache cost and latency: 5% and `balanced`; judgments.** The cache factor is inherited openly as a working cost approximation, not a physical-law claim that every hit costs 5%. Balanced is the carrier's concurrency posture for Standard service, not proof that its batches satisfy Astra's production latency objectives. A model-specific SLO benchmark or cache movement measurement would change these inputs. No discounted Batch traffic is implied by batching requests internally.

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The supplied Opus reference states **83.1% at list, span 68–92%**; its unchanged vector now computes **82.33%**, according to attachment 02. I compare against the current arithmetic, not by retuning either estimate toward the older headline. The reference's tariff, fleet, utilization and efficiency choices are preserved in the starting point.  

The following is an **ordered local-replay waterfall**. Each change is applied after the preceding one; these are not order-independent attributions or live MCP measurements.

| Input change from Opus toward Astra | Margin after change | Incremental margin points |
|---|---:|---:|
| Current Opus reference reproduced locally | 82.3265% | — |
| List input/output $5/$25 → $10/$50; read multiplier still 10% | 91.1632% | **+8.8368** |
| Active parameters 300B → 200B | 93.6225% | **+2.4593** |
| Fleet 5/10/25/20/40 H100/H200/GB200/GB300/TPU → 0/30/50/20/0, retaining reference rents on surviving legs | 92.6259% | **−0.9967** |
| Total parameters 2.5T → 6T, after removing TPU/H100 | 92.6259% | **0.0000**, conditional on policy fit |
| Surviving-leg rents $3.496/$4.275/$5.70 → $3.50/$4.50/$6.00 | 92.3968% | **−0.2290** |
| Utilization 65% → 70% | 92.9399% | **+0.5431** |
| Cache-write share 0 → 50% of non-read input, at 125% of input tariff | 93.3585% | **+0.4186** |
| Traffic 15:1/60% → 12:1/80%, with billed cache share aligned | **94.5792%** | **+1.2207** |

**Unchanged inputs contribute zero in this path:** FP8, compressed-KV donor, balanced latency, `stackMult = 1`, `trendMonths = 2`, `cacheCost = 5`, list-only billing and no separate speculative-decode credit. The reference's inactive write multiplier of 125% becomes economically active; it is not itself raised.

The zero direct effect of total size deserves emphasis. On these NVIDIA carrier rows, active parameters drive the surrogate decode weight traffic, while total parameters constrain capacity. Once the three legs fit, larger total size does not independently raise their phase cost. That is a **model limitation**, not a finding that expert footprint, wider placement or communication are free. The order above changes the fleet first so that it does not attribute a hidden membership change to total size.

The comparison says most of the difference comes from **twice the tariff**, followed by the lower assumed active size. It does not establish superior OpenAI engineering or access to Anthropic-like TPU discounts. Against the old stated 83.1%, my central reading is about **11.5 points higher**; against the current reproduced vector it is about **12.3 points higher**.

Attachment 06's earlier Sol figure near 94% is not independent validation. It used a different model, older tariff and a different cost construction with additional overhead terms. I did not import those overheads into already-all-in rents or tune Astra to that headline. 

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

**The most valuable measurement is aggregate Astra serving cost at a specified workload—not single-user streaming speed.** A matched disclosure of fresh-prefill throughput, decode throughput, GPU type/count, billed reasoning tokens, cache reuse, concurrent sequences, paid occupancy and latency target would replace both the active-parameter proxy and much of the calibration transfer. An actual all-in procurement receipt would complete the conversion to dollars.

The strongest downward falsifier would be evidence that Astra performs substantially more work per billed token than a 200B-active carrier represents—for example a large recurrent or multi-pass execution whose extra work is not fully billed. In the same local equations, **400B active alone gives 89.75%**, and **500B gives 87.34%**, with all other central inputs unchanged. Conversely, **100B active gives 96.99%**. Those are sensitivities, not newly added endpoints.

Procurement and occupancy matter in predictable directions. **Doubling every all-in rent gives 89.16%**. Replacing H200 and GB200 rents with the cited CoreWeave on-demand comparators, while leaving unquoted GB300 at $6, gives **90.38%**. **50% occupancy gives 92.41%**. A cache-read cost of **15% rather than 5%** gives **93.49%**. These results show how a disclosure can move the estimate without any list-price change.

Evidence for a material non-NVIDIA Astra allocation, a much longer context distribution, substantially different KV geometry, or systematic unbilled internal execution would invalidate the present carrier approximation even if the final margin happened to remain near 95%. A tariff change would instead change the denominator directly. A changed alias without a pinned snapshot would also require a fresh model-identity check.

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Context distribution and reasoning length.** The JSON's context text is documentation, not an engine control. Under this custom traffic path, the calculator supplies a 1,000-token output length, so 12:1 produces 12,000 input, 12,500 representative decode and 13,000 terminal-KV tokens. I adopt those as a compact-agent-turn approximation. I could not establish actual Astra averages or the expensive long-context tail. Being below the 272K tariff boundary does **not** make every request below that boundary equally cheap. The report does not price the million-token tier. Sources **S2, S14–S15**. 

**Architecture beyond the three donors.** The carrier can select `dsr1`, but it cannot express an arbitrary Astra layer count, hybrid or recurrent attention, sparse-attention schedule, per-layer precision, actual expert distribution, independent prefill/decode placement or multi-pass computation. `dsr1` is a declared stand-in, not a discovered architecture. I could establish neither an Astra parameter count nor a serving-precision/geometry disclosure.

**Hardware coverage and feasibility.** No Astra-specific site, GPU-generation share or owned/rented allocation was established. The model cannot price Cerebras, AMD or Jalapeño directly through the allowed IDs; I did not convert them into fictitious NVIDIA counts. The H100 exclusion resolves a carrier-domain mismatch, not a real-world hardware impossibility. The reported width checks cover the calculator's uniform memory policy only. They do not verify actual expert replication, workspace, multi-rack communication or production service levels.

**Calibration transfer.** The prefill coefficient is transferred from one reconstructed open-model anchor; GB200's decode coefficient is carried from an FP4 basis into this FP8 scenario, and GB300's coefficient and concurrency are assumed. I could not establish a matched Astra benchmark that validates those transfers. The local Opus cross-check confirms formula consistency, not their empirical accuracy. The specific source files retrieved identify themselves with blobs `c516ca01b34ee3eb492c35ae854487e78ea28796` for the roofline and `e2f4f1edb550045726e3f1d195f16992d4eb855e` for the data registry; a later deployment may change the replay.  

**Cache lifecycle and costs outside the estimand.** The calculator applies a scalar cache-read cost and a write-billing share; it does not reconstruct prefix eviction, retention, lookup, inter-host KV movement or write-specific overhead from production traces. It also does not identify model-specific revenue sharing, tools, safety reruns or unbilled internal calls. Those were not silently inserted into the cost stack. Training, R&D, sales, G&A, free-tier serving and support remain outside the commissioned serving-margin perimeter. Idle paid serving capacity is included through `util`; it is not added a second time as a corporate reservation charge.

**What remains unestablished.** A dated immutable Astra snapshot; a `gpt-6-pro` API tariff; literal active/total parameters; production precision and attention; Astra-to-site/SKU allocation; all-in contract rates; paid-capacity occupancy; aggregate phase throughput; real input/output/reasoning lengths; billing-cache and serving-cache populations; cache-write frequency; a standing residual stack advantage; and Astra-specific financial margin. None is supplied by this model's statements about its own provider.

**Publication status.** The report supplies three complete, positive, capacity-checked input scenarios and the margins from a transparent local equation replay. **No live MCP scenario result was obtained.** The external calculator run—not an undocumented adjustment to these assumptions—should determine the card's engine headline. The stated span is conditional and selected; it does not bound every plausible architecture, tariff, procurement or workload outcome.

Download the complete copy-of-record report (a file in the research run's own workspace, not published)
