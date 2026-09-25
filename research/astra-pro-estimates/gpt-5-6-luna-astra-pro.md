# GPT-5.6 Luna — GPT-6 Astra Pro estimate (2026-09-25)

**Provenance.** One GPT-6 Astra Pro research run (ChatGPT, model `gpt-6-pro`), request `pr-20260925T070104Z-7304c2`, answered 2026-09-25T09:03:13Z. It was given this calculator's input contract, the Claude Opus 4.x reference estimate and the live connector's scenario space, and asked to set every input for GPT-5.6 Luna from public evidence. The answer is reproduced below verbatim except for three presentation changes: ChatGPT's interface citation markers are removed, as on every page of this annex; links into the research run's own sandbox (files no reader can open) keep their text and lose the dead target; and equations are set as preformatted text, with a space between a bracket and a parenthesis inside them so the renderer does not read a product as a link; its sources are cited by URL in the text (published text SHA-256 `749264b2599012e49a29334b236e10c198c8a07cc51d9f61180a65a3cc25c5f4`; as received, `ae4035466f64609be6482681fdd829cd74a53016fda3166ba766cb00200ca820`).

## What the site shows

| reading | value |
|---|---|
| **Card headline** — this calculator on the run's central inputs, at list | **~66%** (65.71%) |
| Span — the run's own low- and high-margin scenarios, same engine | 36%–76% (36.08% – 76.49%) |
| The run's own stated reading | 65.7% (36.1–76.5%) |
| Same central inputs at the page's Reference traffic (15:1, 60% cache) — context, not the headline | ~45% |

The span is the author's judgment span: two scenarios it called plausible as a whole, not a probability interval and not a bound. The headline is a modeled unit direct-serving margin from public information; it is not a disclosure by the provider and not a company gross margin.

## Our reading

Luna is priced at $0.20/$1.20, and the calculator has carried it only as a tariff scenario. The run makes it an estimate by assuming a small model — 12B active, 160B total, with 6B–24B active as the alternatives — and says plainly that no Luna measurement stands behind those numbers and that it did not back-infer size from the price or from streaming speed. Its card line points at the input that limits the result: the DeepSeek-R1 attention geometry the calculator uses for every undisclosed model sets a floor on decode cost that a small active count does not remove, so a different real attention design could move this number more than the parameter count does. The run also applies a small stack penalty (10% worse than open practice) and prices the fleet as ordinary rented NVIDIA capacity. The run's own perspective check is the clearest statement of what drives Luna: at the $1/$6 price this site carried until 2026-09-19, the same costs give about 93%; the fivefold price cut, not any change in serving cost, is what brings it to the mid 60s. The span is wide (36–77%) because the low case combines the 24B-active size with a more input-heavy, more cached traffic mix. At the page's Reference traffic the same inputs compute ~45%, below the headline — the Reference mix carries more input per output token, and Luna's input price is very thin. The run reconstructed the equations; the engine reproduces them to a tenth of a point.

## The operating point

Carrier: the calculator's blank `custom` row on the `dsr1` attention geometry (a declared approximation — this model's architecture is not published). `batchShare` and `discount` are 0 in every run (list basis).

| input | central | low-margin scenario | high-margin scenario |
|---|---|---|---|
| `customDonor` | dsr1 | dsr1 | dsr1 |
| `active` | 12 | 24 | 6 |
| `total` | 160 | 320 | 120 |
| `precision` | fp8 | fp8 | fp8 |
| `priceIn` | 0.2 | 0.2 | 0.2 |
| `priceOut` | 1.2 | 1.2 | 1.2 |
| `cacheReadMult` | 10 | 10 | 10 |
| `billCacheHit` | 60 | 70 | 60 |
| `cacheCost` | 5 | 5 | 5 |
| `cacheWriteShare` | 20 | 20 | 20 |
| `cacheWriteMult` | 125 | 125 | 125 |
| `batchShare` | 0 | 0 | 0 |
| `discount` | 0 | 0 | 0 |
| `blend` | `{"h100":20,"h200":30,"gb200":50}` | `{"h100":20,"h200":30,"gb200":50}` | `{"h200":20,"gb200":80}` |
| `rentAbsLeg` | `{"h100":2.6,"h200":3.25,"gb200":4.5}` | `{"h100":2.6,"h200":3.25,"gb200":4.5}` | `{"h200":3.25,"gb200":4.5}` |
| `util` | 70 | 65 | 75 |
| `stackMult` | 1.1 | 1.1 | 1.1 |
| `trendMonths` | 0 | 0 | 0 |
| `interact` | balanced | balanced | balanced |
| `hwMode` | rent | rent | rent |
| traffic | 8:1, 60% cache | 12:1, 70% cache | 8:1, 60% cache |

## The answer, verbatim

## 0 — THE CARD, IN TWO LINES.

≈66% at list (span 36–77%)  
The assumed `dsr1` attention/KV geometry sets a substantial decode-cost floor, even at 12B active parameters.

## 1 — PUBLIC FACTS.

**Estimator: GPT-6 Astra Pro. Date: September 25, 2026.** This is a modeled **unit direct-serving contribution margin**, not OpenAI’s verified margin or accounting gross margin. The headline is conditional on the architecture and operating assumptions below. My numerical results are a reconstruction of the calculator’s published equations, **not successful live-MCP returns**.

**File receipt.** All three uploads opened and were read: `03-calculator-contract-live-2026-09-25.json` begins `{"result":{"content":[{"type":"text","text":"The scenario space of the Frontier Inference Margins ca`; `04-opus-4x-reference-dive-verbatim-2026-08-08.md` begins with a JSON code fence; `06-openai-gptpro.md` begins `# OpenAI — GPT-5.6 Pro deep dive`. The inline attachments 01, 02 and 05 were also reviewed.

In the source records, a date on an undated documentation, benchmark or pricing page means **checked on that date**, not a claimed publication date. Source IDs are reused in the input block. They identify the evidence informing a judgment, not proof of an assumed numerical value.

1. **Identity and release — DISCLOSED.** The priced API alias is **`gpt-5.6-luna`**, from the GPT-5.6 family generally released on **July 9, 2026**. I price **Standard text service, medium reasoning**, without regional-processing surcharges. The alias supports multiple reasoning settings; this is not a Fast-mode, Batch, Flex or long-context estimate. Sources: **S1**, [launch](https://openai.com/index/gpt-5-6/), July 9, 2026; **S2**, [model page](https://developers.openai.com/api/docs/models/gpt-5.6-luna), checked September 25, 2026. 

2. **Current list tariff — DISCLOSED.** The project’s **$0.20 ordinary input / $0.02 cached input / $1.20 output per million tokens is correct**. Cache writes are **$0.25/M**. I checked the [English pricing hub](https://developers.openai.com/api/docs/pricing), **S3**, whose default display now foregrounds GPT-6; the [Luna model page](https://developers.openai.com/api/docs/models/gpt-5.6-luna), **S2**, confirms Luna’s rates. OpenAI’s indexed [French pricing table](https://developers.openai.com/fr-FR/api/docs/pricing), **S4**, independently shows all four Standard rates. Checked September 25, 2026; the localized search snapshot was crawled the preceding week, and its direct reopening failed. 

3. **Price history — DISCLOSED.** OpenAI cut Luna’s prices by **80% on July 30, 2026**. The July attachment’s $1/$6 tariff therefore does not describe today’s billings. Source **S17**: [price-performance announcement](https://openai.com/index/advancing-the-price-performance-frontier-with-gpt-5-6/), July 30, 2026. I found no Luna-specific scheduled reversion price; the old tariff is a historical sensitivity, not an alternative current list price.  

4. **Cache and long-context rules — DISCLOSED.** Cache writes replace ordinary input billing at 1.25 times its rate; they are not an additional $0.25 on top of $0.20. Prompts above **272,000 input tokens** reprice the entire request at twice the input rate and 1.5 times the output rate. Sources **S5**, [prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching), and **S2**, [model page](https://developers.openai.com/api/docs/models/gpt-5.6-luna), checked September 25, 2026. 

5. **“OpenAI’s cheapest tier” is no longer the current identity — DISCLOSED.** OpenAI now advertises **GPT-6 Luna** at $0.10 input and $0.50 output. This report deliberately retains the requested **GPT-5.6 Luna** rather than substituting its successor. Source **S6**: [GPT-6 Sol and Luna](https://openai.com/index/introducing-gpt-6-sol-and-luna/), checked September 25, 2026. 

6. **Literal architecture and immutable served version — UNKNOWN.** I did not establish Luna’s active or total parameter counts, layer geometry, routing, production precision, or a dated immutable backend snapshot behind its public alias. The inspected model page lists the alias, not an independently identified weight version. Source checked: **S2**, [model page](https://developers.openai.com/api/docs/models/gpt-5.6-luna), September 25, 2026. 

7. **A public architecture proxy — DISCLOSED.** OpenAI’s separate open-weight **gpt-oss-120b** has **117B total / 5.1B active parameters** and MXFP4 expert weights. This establishes that a useful OpenAI reasoning model can activate relatively few parameters; it does **not** identify Luna’s size or topology. Source **S7**: [OpenAI’s model card](https://huggingface.co/openai/gpt-oss-120b), checked September 25, 2026. 

8. **Available infrastructure — DISCLOSED.** OpenAI describes operating Hopper and Blackwell systems across **Microsoft, Oracle Cloud Infrastructure and CoreWeave**. Its same announcement describes 3 GW of dedicated inference on **future Vera Rubin systems**, not 3 GW of already-operating Luna capacity. Source **S8**: [Scaling AI for everyone](https://openai.com/index/scaling-ai-for-everyone/), February 27, 2026. The July dive’s broader infrastructure interpretation is not carried forward.  

9. **Luna-specific deployment and occupancy — UNKNOWN.** The inspected infrastructure and model sources do not allocate Luna traffic to sites, accelerator generations, owners or regions, and do not disclose paid-capacity utilization or an all-in transfer price. Sources checked: **S8**, [infrastructure announcement](https://openai.com/index/scaling-ai-for-everyone/), February 27, 2026, and **S2**, [model page](https://developers.openai.com/api/docs/models/gpt-5.6-luna), checked September 25, 2026. The fleet fractions and occupancy below are therefore judgments, not observations. 

10. **Public rental comparables — DISCLOSED.** CoreWeave lists bundled H100 eight-GPU instances at **$49.24/hour**, H200 eight-GPU instances at **$50.44/hour**, and four-GPU GB200 slices at **$42/hour**. It advertises committed-use discounts of **up to 60%**, without promising that discount for every configuration or customer. Source **S9**: [CoreWeave pricing](https://www.coreweave.com/pricing), checked September 25, 2026. These are public comparables, not OpenAI invoices. 

11. **Endpoint speed — COMMUNITY ESTIMATE.** Artificial Analysis’s inspected **10,000-input-token, max-reasoning** benchmark reports the direct OpenAI endpoint at **126.4 output tokens/second**, with **141.57 seconds to first answer token**. This is a user-stream measurement, not aggregate tokens per GPU-second, and not a matched measurement of my medium-reasoning workload. Source **S10**: [Luna providers benchmark](https://artificialanalysis.ai/models/gpt-5-6-luna/providers), checked September 25, 2026. The attachment’s earlier 205–229 tokens/second cannot be substituted for accelerator capacity or treated as a matched historical comparison.  

12. **Private serving improvements — DISCLOSED.** OpenAI reports production-kernel work cutting end-to-end serving costs by **20%**, and speculative-draft improvements raising token-generation efficiency by **more than 15%**. These are improvement observations, not a measured standing advantage for Luna over a contemporaneous open implementation. Source **S11**: [frontier intelligence and efficiency](https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency/), July 29, 2026. 

13. **Output-token accounting — DISCLOSED.** Hidden reasoning tokens are billed as output. My input:output ratio uses **all billed output**, not merely the visible answer. Source **S12**: [reasoning guide](https://developers.openai.com/api/docs/guides/reasoning), checked September 25, 2026. 

14. **Company economics — CREDIBLY REPORTED.** Reuters reported **33% adjusted company gross margin for 2025**. That is not a Luna list-price serving margin and supplies no numerical calibration for this estimate. Source **S13**: [Reuters](https://www.reuters.com/technology/openai-sees-compute-spend-around-600-billion-by-2030-cnbc-reports-2026-02-20/), February 20, 2026. 

15. **Calculator reconstruction — INFERENCE.** The calculations below derive from the published [cost and billing functions](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js), **S14**; [geometry and calibration registry](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js), **S15**; and [roofline equations](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js), **S16**, all inspected September 25, 2026. Their coefficients are calculator assumptions, not Luna measurements. The supplied contract declares engine `v3.0.0-2026-08-13`; public-source inspection does not prove byte identity with its deployed worker.  

## 2 — CALCULATOR INPUTS.

The three vectors are complete. `cacheWriteShare` is explicitly **20% of fresh input** under the inspected engine’s implementation—8% of all input in the central case—not 20% of all input. No speculative-decoding override is used. All rents are **all-in dollars per individual GPU-hour**.

```json
{
  "model_id": "custom",
  "model_name": "GPT-5.6 Luna",
  "api_model_priced": "gpt-5.6-luna; public unversioned API alias, general availability 2026-07-09; Standard text service, medium reasoning, priced 2026-09-25; immutable backend snapshot unknown",
  "customDonor": "dsr1",
  "basis": "list",
  "context_length_assumed": "Standard <=272000-input-token tariff. Central/high: 8000 input + 1000 billed output, mean decode context 8500. Low: 12000 input + 1000 billed output, mean decode context 12500.",
  "central": {
    "overrides": {
      "customDonor": "dsr1", "active": 12, "total": 160, "precision": "fp8",
      "priceIn": 0.2, "priceOut": 1.2, "cacheReadMult": 10, "billCacheHit": 60,
      "cacheCost": 5, "cacheWriteShare": 20, "cacheWriteMult": 125,
      "batchShare": 0, "discount": 0,
      "blend": {"h100": 20, "h200": 30, "gb200": 50},
      "rentAbsLeg": {"h100": 2.6, "h200": 3.25, "gb200": 4.5},
      "util": 70, "stackMult": 1.1, "trendMonths": 0, "interact": "balanced", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 60}
  },
  "low_margin": {
    "overrides": {
      "customDonor": "dsr1", "active": 24, "total": 320, "precision": "fp8",
      "priceIn": 0.2, "priceOut": 1.2, "cacheReadMult": 10, "billCacheHit": 70,
      "cacheCost": 5, "cacheWriteShare": 20, "cacheWriteMult": 125,
      "batchShare": 0, "discount": 0,
      "blend": {"h100": 20, "h200": 30, "gb200": 50},
      "rentAbsLeg": {"h100": 2.6, "h200": 3.25, "gb200": 4.5},
      "util": 65, "stackMult": 1.1, "trendMonths": 0, "interact": "balanced", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 12, "cache_hit": 70}
  },
  "high_margin": {
    "overrides": {
      "customDonor": "dsr1", "active": 6, "total": 120, "precision": "fp8",
      "priceIn": 0.2, "priceOut": 1.2, "cacheReadMult": 10, "billCacheHit": 60,
      "cacheCost": 5, "cacheWriteShare": 20, "cacheWriteMult": 125,
      "batchShare": 0, "discount": 0,
      "blend": {"h200": 20, "gb200": 80},
      "rentAbsLeg": {"h200": 3.25, "gb200": 4.5},
      "util": 75, "stackMult": 1.1, "trendMonths": 0, "interact": "balanced", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 60}
  },
  "stated": {"headline_pct": 65.7, "low_pct": 36.1, "high_pct": 76.5},
  "sources": [
    {"id": "S1", "claim": "GPT-5.6 family general availability, including Luna.", "url": "https://openai.com/index/gpt-5-6/", "date": "2026-07-09", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "Public Luna alias, reasoning settings, context tiers and current token tariffs; undated page inspected on the stated date.", "url": "https://developers.openai.com/api/docs/models/gpt-5.6-luna", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "English provider pricing hub inspected; its default display now foregrounds GPT-6.", "url": "https://developers.openai.com/api/docs/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "Provider pricing table independently retains Luna Standard 0.20/0.02/0.25/1.20; indexed French page inspected on the stated date.", "url": "https://developers.openai.com/fr-FR/api/docs/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S5", "claim": "Cache-write rate replaces ordinary input billing rather than adding to it; undated documentation inspected.", "url": "https://developers.openai.com/api/docs/guides/prompt-caching", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S6", "claim": "Newer GPT-6 Luna has a lower input/output tariff; page inspected on the stated date.", "url": "https://openai.com/index/introducing-gpt-6-sol-and-luna/", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S7", "claim": "OpenAI gpt-oss-120b model card: 117B total, 5.1B active; a proxy, not Luna architecture. Undated card inspected.", "url": "https://huggingface.co/openai/gpt-oss-120b", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S8", "claim": "Operating Hopper/Blackwell systems across Microsoft, OCI and CoreWeave; not a Luna allocation.", "url": "https://openai.com/index/scaling-ai-for-everyone/", "date": "2026-02-27", "evidence_class": "DISCLOSED"},
    {"id": "S9", "claim": "Bundled public instance prices and up-to-60% committed-use discounts; undated rate card inspected.", "url": "https://www.coreweave.com/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S10", "claim": "Independent 10k-input, max-reasoning Luna endpoint benchmark; not aggregate GPU throughput.", "url": "https://artificialanalysis.ai/models/gpt-5-6-luna/providers", "date": "2026-09-25", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S11", "claim": "Production-kernel and speculative-draft efficiency improvements, not a measured Luna-versus-open-stack advantage.", "url": "https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency/", "date": "2026-07-29", "evidence_class": "DISCLOSED"},
    {"id": "S12", "claim": "Hidden reasoning tokens are billed as output; undated guide inspected.", "url": "https://developers.openai.com/api/docs/guides/reasoning", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S13", "claim": "Reported 2025 adjusted company gross margin of 33%, not Luna unit serving margin.", "url": "https://www.reuters.com/technology/openai-sees-compute-spend-around-600-billion-by-2030-cnbc-reports-2026-02-20/", "date": "2026-02-20", "evidence_class": "CREDIBLY REPORTED"},
    {"id": "S14", "claim": "Public cost/billing equations used for my reconstruction; inspected source, not a successful MCP result.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js", "date": "2026-09-25", "evidence_class": "INFERENCE"},
    {"id": "S15", "claim": "Published donor geometry and hardware calibrations adopted as calculator assumptions; inspected source.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js", "date": "2026-09-25", "evidence_class": "ASSUMED"},
    {"id": "S16", "claim": "Public roofline and implicit-context equations used for my reconstruction; inspected source.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js", "date": "2026-09-25", "evidence_class": "INFERENCE"},
    {"id": "S17", "claim": "Luna price reduction of 80% and examples of background-automation use.", "url": "https://openai.com/index/advancing-the-price-performance-frontier-with-gpt-5-6/", "date": "2026-07-30", "evidence_class": "DISCLOSED"}
  ],
  "key_inputs": [
    {"input": "customDonor", "central": "dsr1", "low_margin": "dsr1", "high_margin": "dsr1", "source_ids": ["S7", "S15"], "evidence_class": "ASSUMED"},
    {"input": "active", "central": 12, "low_margin": 24, "high_margin": 6, "source_ids": ["S2", "S7"], "evidence_class": "ASSUMED"},
    {"input": "total", "central": 160, "low_margin": 320, "high_margin": 120, "source_ids": ["S2", "S7"], "evidence_class": "ASSUMED"},
    {"input": "precision", "central": "fp8", "low_margin": "fp8", "high_margin": "fp8", "source_ids": ["S7", "S15"], "evidence_class": "ASSUMED"},
    {"input": "priceIn", "central": 0.2, "low_margin": 0.2, "high_margin": 0.2, "source_ids": ["S2", "S4"], "evidence_class": "DISCLOSED"},
    {"input": "priceOut", "central": 1.2, "low_margin": 1.2, "high_margin": 1.2, "source_ids": ["S2", "S4"], "evidence_class": "DISCLOSED"},
    {"input": "cacheReadMult", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S2", "S4"], "evidence_class": "DISCLOSED"},
    {"input": "cacheWriteMult", "central": 125, "low_margin": 125, "high_margin": 125, "source_ids": ["S2", "S4", "S5"], "evidence_class": "DISCLOSED"},
    {"input": "blend", "central": {"h100": 20, "h200": 30, "gb200": 50}, "low_margin": {"h100": 20, "h200": 30, "gb200": 50}, "high_margin": {"h200": 20, "gb200": 80}, "source_ids": ["S8"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg", "central": {"h100": 2.6, "h200": 3.25, "gb200": 4.5}, "low_margin": {"h100": 2.6, "h200": 3.25, "gb200": 4.5}, "high_margin": {"h200": 3.25, "gb200": 4.5}, "source_ids": ["S8", "S9"], "evidence_class": "INFERENCE"},
    {"input": "util", "central": 70, "low_margin": 65, "high_margin": 75, "source_ids": ["S8"], "evidence_class": "ASSUMED"},
    {"input": "stackMult", "central": 1.1, "low_margin": 1.1, "high_margin": 1.1, "source_ids": ["S11"], "evidence_class": "ASSUMED"},
    {"input": "trendMonths", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": ["S11"], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "balanced", "low_margin": "balanced", "high_margin": "balanced", "source_ids": ["S2", "S10"], "evidence_class": "ASSUMED"},
    {"input": "billCacheHit", "central": 60, "low_margin": 70, "high_margin": 60, "source_ids": ["S5", "S17"], "evidence_class": "ASSUMED"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": ["S14"], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteShare", "central": 20, "low_margin": 20, "high_margin": 20, "source_ids": ["S5"], "evidence_class": "ASSUMED"},
    {"input": "io_ratio", "central": 8, "low_margin": 12, "high_margin": 8, "source_ids": ["S2", "S12", "S17"], "evidence_class": "ASSUMED"},
    {"input": "cache_hit", "central": 60, "low_margin": 70, "high_margin": 60, "source_ids": ["S5", "S17"], "evidence_class": "ASSUMED"}
  ],
  "confidence": "low — architecture, fleet allocation, occupancy and model-specific cost are unmeasured; the three-scenario span is conditional on the declared donor geometry and the results are reconstructed, not MCP-returned."
}
```

## 3 — YOUR OWN READING.

My reading is **65.7% at list**, with a selected three-scenario span of **36.1–76.5%**. The card rounds the point to 66% and rounds the endpoints outward to 36–77%. This is a judgment span conditional on the stated donor—not a probability interval, a full uncertainty bound, or a measurement of OpenAI’s business.

**Execution status matters.** I attempted `run_scenario(model="custom", perspective="median", overrides=central.overrides, traffic=central.traffic)` through the public [MCP endpoint](https://margins-mcp.ashitaorbis.com/mcp), using the exact central values above. The request failed at DNS resolution with “Temporary failure in name resolution”; **there was no calculator result to quote**. The `stated` fields are my predictions from a Python reconstruction of the inspected public equations. They are not presented as a successful execution of the complete engine, its placement solver, or its deployed revision.

The resulting economics are:

| Scenario | List billings, $/M total tokens | Direct serving cost, $/M total tokens | Reconstructed margin |
|---|---:|---:|---:|
| Low margin | 0.163385 | 0.104428 | 36.1% |
| Central | 0.218667 | 0.074985 | 65.7% |
| High margin | 0.218667 | 0.051409 | 76.5% |

“Total tokens” includes input, cached input and all billed output. These are **ratios of combined dollars**, not averages of input and output margin percentages.

For the central case, the reconstruction produces the following occupied-capacity rates before applying the separate 70% paid-capacity occupancy divisor:

| Accelerator | Prefill tokens/s/GPU | Aggregate decode tokens/s/GPU | Resulting fresh-input cost, $/M | Resulting output cost, $/M |
|---|---:|---:|---:|---:|
| H100 | 8,705 | 2,727 | 0.11853 | 0.37838 |
| H200 | 8,705 | 3,907 | 0.14816 | 0.33009 |
| GB200 | 21,982 | 7,086 | 0.08124 | 0.25199 |

These are **modeled batched rates**, not the endpoint benchmark in fact 11. Costs in the last two columns already include occupancy. The hardware-weighted values are **$0.1087696/M fresh input**, **$0.0054385/M cached input** and **$0.3006979/M output**.

The accelerator-hour conversion is:

```text
C_j=\frac{r_j\times10^6}{3600\times T_j\times u},
```
where `r_j` is all-in dollars per GPU-hour, `T_j` is tokens per second **per GPU**, and `u=0.70`. The million-token multiplier is explicit. Fleet costs are weighted by token share, not by averaging hardware throughput and then dividing an average rent.

Per one million output tokens, central traffic contains **4.8 million cache reads**, **3.2 million fresh inputs**, and one million outputs. Of the fresh input, 0.64 million are billed as writes and 2.56 million at ordinary input rates. Thus:

```text
R=1.20+4.8(0.02)+2.56(0.20)+0.64(0.25)=\$1.968.
```
```text
C=0.3006979+3.2(0.1087696)+4.8(0.0054385)
  =\$0.6748652.
```
```text
m=1-C/R=65.7081\%.
```
Dividing both dollars by nine yields the central per-million-total-token entries above. The billing construction follows the inspected engine’s fresh-input write-share convention. 

**The sanity check passes without changing the inputs.** All three primary scenarios are positive. Parameters are entered in billions, utilization as 70 rather than 0.70, and rentals per GPU rather than per node or GB200 package. Power, hosting and networking are inside the hourly figures and are not added again. Simple uniform-placement checks find feasible weight-plus-KV allocations for these three vectors under the planning memory policy; they do not establish production placement or latency compliance.

For perspective, keeping costs fixed but restoring the historical five-times-higher tariff gives **93.1%**, not 65.7%. That difference is denominator arithmetic, not evidence of an efficiency collapse. Removing cache-write premiums entirely gives **65.1%**; billing every fresh input as a write gives **67.8%**. Neither uncertainty drives the headline.

## 4 — WHY THESE INPUTS.

**Architecture: 12B active / 160B total; FP8; `dsr1`.** These numerical sizes are **ASSUMED, with no Luna measurement behind them**. S7 provides a qualitative sparse-model precedent. I use a model somewhat larger in active computation and total storage than that precedent, with 6B/120B and 24B/320B alternatives. Neither Luna’s price nor a single user’s streaming rate is inverted into a parameter count. The former is a commercial decision; the latter lacks concurrency, hardware and speculation information.

The donor retains the project’s comparable compressed-KV approximation. There is no evidence that Luna literally uses DeepSeek’s architecture. A smaller hybrid-attention model could have a lower memory footprint, while full-context grouped-query attention could have a higher one. FP8 is a deliberately common serving assumption across the chosen fleet; the open model’s MXFP4 disclosure does not establish Luna’s production precision. **All three size, geometry and precision choices are judgments.** S2, S7 and S15 are context, not identification. 

**Fleet: 20% H100, 30% H200, 50% GB200 by served tokens.** S8 supports the hardware families and supplier relationships, not these percentages. I assume a mixed North American partner-operated serving estate rather than all-new Blackwell hardware. The high case shifts to 20% H200 / 80% GB200; the low case retains the central fleet. These are **unmeasured allocation judgments**. I assign no share to GB300, Rubin, Trainium, AMD or Cerebras merely because capacity exists or has been announced. 

**Procurement: $2.60 / $3.25 / $4.50 all-in per GPU-hour.** The public S9 instance prices normalize as follows:

| Accelerator | Public bundled on-demand conversion | My all-in committed-rate assumption | Reduction from public comparator |
|---|---:|---:|---:|
| H100 | $49.24 ÷ 8 = $6.155/GPU-hour | $2.60 | 57.8% |
| H200 | $50.44 ÷ 8 = $6.305/GPU-hour | $3.25 | 48.5% |
| GB200 | $42 ÷ 4 = $10.50/GPU-hour | $4.50 | 57.1% |

Those reductions are compatible with the advertised committed-use discount class, but are **inferred purchasing assumptions, not disclosed OpenAI rates**. The assumed bundle includes accelerator, power, facility, host and network/control-plane costs. No second hosting or power factor is applied. This is a partner-rental estimate, not a claim of OpenAI ownership, so no depreciation-to-hour conversion is used. 

Rent values do not fall in the high-margin scenario or rise in the low-margin scenario. Changing all central rents by ±20% moves the result by approximately **∓6.9 percentage points**. Using the public on-demand comparators instead gives **24.7%** in the same reconstruction, demonstrating the importance of procurement class without treating that class as OpenAI’s actual contract.

**Paid-capacity utilization: 70%, with 65% low and 75% high.** This is **ASSUMED**, not measured utilization, and not hardware FLOP utilization. It allocates the unused part of the modeled paid serving fleet. I allow moderately better packing for a mature high-volume service, but do not assume 90–100% occupancy. At the central vector, changing only occupancy to 65% produces **63.1%**; 50% produces **52.0%**. There is no public Luna occupancy evidence narrowing this judgment.

**Private efficiency: `stackMult=1.10`; `trendMonths=0`.** S11 supports the existence of economically meaningful private improvements, not their residual size for Luna. I allow only a **10% throughput advantage**, an **ASSUMED** transfer after published open practice, and hold it constant in all scenarios. I do not multiply the reported 20% cost reduction by the reported speculative improvement, and then add a lead prior. `specDec` is absent. Removing this single advantage gives **62.3%**, a 3.4-point reduction. 

**Traffic: 8:1 input to all billed output, 60% serving and billing cache hits.** This is **ASSUMED population traffic**, informed only qualitatively by Luna’s high-volume role and disclosed background-automation examples, S2/S17. I expect substantial retrieval, extraction and agent subtask traffic, but less extreme prefix reuse than the earlier company dive’s 78% convention. The typical modeled call has **8,000 input and 1,000 billed output tokens**. That output includes reasoning, so it is not a 1,000-token visible-answer assumption. 

**Caching: `cacheCost=5`; write share 20% of fresh input.** Both cost and write-share values are **ASSUMED**. Serving hits and billed hits are explicitly equal here, but they are conceptually separate inputs. The write fraction lets persistent prefixes coexist with fresh suffixes rather than silently billing all fresh input at a premium. S5 establishes the tariff, not the traffic fraction. Raising cache-read cost alone from 5% to 15% of fresh prefill lowers the headline to **63.1%**. 

**Why the endpoints belong together.** The low case represents a larger routed model on longer agent contexts, with somewhat less full capacity; its higher 70% cache reuse offsets part of the added work. It does not also assume higher rents, weaker kernels, BF16 and an older fleet. The high case represents a smaller implementation concentrated on Blackwell with modestly better occupancy; it retains FP8, the central rents, cache policy and private-stack credit. These are three coherent operating hypotheses, not independently compounded knob extremes.

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

**The like-for-like traffic companion is approximately 44.6%, not the 65.7% headline.** It uses the central Luna overrides with **15:1 input:output and 60% cache hits**. The frozen reference author states **83.1%**, span **68–92%**; attachment 02 and the live contract say that reference vector now computes **82.33%**. The historical-versus-current 0.77-point difference is not attributed to Luna. The original reference explicitly distinguished its selected span from a live-engine corner interval.  

There is an important qualification: the calculator’s 1,000-output-token fallback also increases implied average decode context from **8,500 to 15,500 tokens** when the ratio rises from eight to fifteen. Thus the companion changes the workload’s physical cost as well as its revenue mix. It is the requested calculator comparison, not a pure fixed-context revenue normalization. 

The following **order-specific arithmetic bridge** compares the native headlines input by input. It starts from the supplied 82.33% reference rather than re-estimating Opus. Subsequent NVIDIA-only values are my reconstruction. The first row’s difference therefore also carries any source-reconstruction mismatch with the supplied anchor. Price changes are deliberately last; the point contributions are path-dependent, not separable causal effects.

| Change from the reference, in this order | Approximate margin after change | Incremental percentage points |
|---|---:|---:|
| Supplied current-engine Opus reference | 82.33% | — |
| Fleet: 5/10/25/20/40 H100/H200/GB200/GB300/TPU7 → 20/30/50 H100/H200/GB200 | 79.45% | −2.88 |
| Remaining-leg rents: 2.28/3.496/4.275 → 2.60/3.25/4.50 | 79.10% | −0.35 |
| Active parameters: 300B → 12B | 97.58% | +18.48 |
| Total parameters: 2,500B → 160B, with feasible placement retained | 97.58% | ≈0.00 |
| Occupancy: 65% → 70% | 97.75% | +0.17 |
| Algorithmic lead: two months → zero | 97.30% | −0.45 |
| Stack: 1.0 → 1.1 | 97.54% | +0.25 |
| Traffic: 15:1 → 8:1; cache remains 60%; implicit context also changes | 98.45% | +0.90 |
| Cache-write share: zero → 20% of fresh input | 98.47% | +0.03 |
| List input/output prices: $5/$25 → $0.20/$1.20 | **65.71%** | **−32.77** |

The reference’s fleet, precision, list-price and efficiency settings are documented in attachment 04. Its procurement multipliers give the rental figures above and **$5.70/GB300-hour, $2.70/TPU7-hour** on the removed legs.  

FP8 precision, the `dsr1` carrier, balanced serving posture, 10% cache-read price, 60% cache shares, 5% cache cost, and zero Batch/discount remain unchanged and therefore contribute zero in this bridge. Total parameters mainly affect capacity in the selected NVIDIA active-parameter-surrogate branch; their near-zero point contribution is **a property of this model implementation**, not a claim that storing or distributing additional weights is free. 

Economically, Luna’s much smaller assumed active computation helps greatly, but its list tariff falls more than its modeled total cost. The cheap input tariff and residual KV traffic prevent transferring an Opus-like margin to Luna simply by shrinking active parameters.

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

The most valuable disclosure would be a **matched Luna production measurement of paid accelerator-hours, hardware, context lengths, cache classes, all billed output and latency targets**. It would identify aggregate serving cost without requiring a parameter-count guess. A parameter count alone would not resolve batching, KV traffic, utilization or speculative verification overhead.

The largest structural uncertainty is **attention/KV geometry at the actual context distribution**. Under the adopted donor, KV reads account for approximately **70–76% of modeled central decode HBM traffic**. A disclosure showing much smaller resident KV or predominantly local attention would move the estimate upward, potentially beyond this conditional span. Larger full-context KV, or more expensive internal work per billed token, would move it downward.

Useful one-at-a-time tests, retaining central prices, are:

| New information represented by one changed assumption | Reconstructed margin | Direction versus central |
|---|---:|---:|
| Typical input/output lengths both halve, retaining 8:1 | 75.1% | +9.4 points |
| Typical input/output lengths both double, retaining 8:1 | 45.9% | −19.8 points |
| Active parameters are 24B rather than 12B | 51.2% | −14.5 points |
| All-in rents are 20% higher | 58.8% | −6.9 points |
| No residual private-stack advantage | 62.3% | −3.4 points |

These are diagnostic calculations, not additional endpoints or new telemetry. A measured cost above the central **$0.218667/M total-token billings** would falsify its positive serving margin at this exact mix. It would not be legitimate to restore positivity by choosing a smaller model, changing units or inventing a discount without supporting evidence.

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Context is implicit, not an exposed input.** The public equations use an output-length fallback and derive input length from the ratio. I aligned the central scenario with that convention: 8,000 input, 1,000 billed output and mean decode context 8,500; the low scenario uses 12,000, 1,000 and 12,500. The tariff ceiling is not the representative context. A population mean also cannot express a long right tail or the covariance of length, caching and output. The absolute-length diagnostics above are outside the submitted override API. 

**The geometry choice is expressible; the desired geometry is not.** `customDonor` lets me choose among three frozen proxies, but cannot set Luna’s actual layer count, attention windows, compressed states or hybrid architecture. `dsr1` leaves a 61-layer geometry in place while `active` and `total` change independently. This is not a physically complete claim about a literal 12B-active network. Changing to GQA can also change memory feasibility and which legs render, so a throughput-only donor substitution is not a valid full-engine sensitivity. 

**Serving details remain unresolved.** The block cannot independently describe per-phase fleets, per-layer precision, draft-model costs and acceptance, actual concurrency, quality-preserving quantization, expert imbalance, retry behavior, or an enforced latency objective. I use the published balanced calibration and one modest stack multiplier rather than claiming the observed user-stream rate verifies those choices. Feasible memory arithmetic is not a service-level or production-deployment receipt.

**Scope is deliberately narrow.** All-in rents cover the selected serving capacity, and `util` allocates its paid slack once. Unused commitments outside that modeled fleet are not additionally allocated. This distinguishes the brief’s occupancy divisor from attachment 03’s exclusion of broader idle reservations. Training, research, sales, free-tier demand, support, unbilled retries, tools, subscriptions and revenue sharing are outside this unit token-serving estimate. The July report’s extra platform and non-GPU add-ons are not imported on top of all-in rents.  

**Facts not established:** the immutable served snapshot; literal active/total size; real attention or numerical precision; Luna’s site, supplier and accelerator allocation; its occupied versus reserved capacity; actual all-in contracts; representative context, reasoning and cache distributions; aggregate GPU throughput at an identified latency target; cache-write incidence; a Luna-specific revenue, cost or margin disclosure; and a Luna-specific future tariff-reversion schedule. Artificial Analysis’s “deprecated” label is not treated as proof that OpenAI has retired this API. 

**Execution remains a limitation, not a hidden substitution.** I inspected the public source and reconstructed its relevant equations, but did not obtain a live `run_scenario` response, an exact worker/source hash match, or the deployed engine’s complete feasibility receipt. The publishing leg’s rerun should remain authoritative for the card’s engine number, with my **65.7 / 36.1 / 76.5** predictions retained beside it. A difference should first be traced to applied state, geometry, calibration, feasibility or source revision—not eliminated by retuning assumptions.

**Bottom line:** 66% is my conditional list-price reading for the explicitly defined GPT-5.6 Luna workload. The evidence establishes the tariff much more securely than the cost. The 36–77% span describes three declared hypotheses within the chosen carrier, not everything an undisclosed Luna architecture could plausibly do.

Complete report — copy of record (a file in the research run's own workspace, not published)
