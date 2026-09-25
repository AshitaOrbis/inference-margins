# Gemini 3.8 Flash — GPT-6 Astra Pro estimate (2026-09-25)

**Provenance.** One GPT-6 Astra Pro research run (ChatGPT, model `gpt-6-pro`), request `pr-20260925T110805Z-8276b2`, answered 2026-09-25T11:33:14Z. It was given this calculator's input contract, the Claude Opus 4.x reference estimate and the live connector's scenario space, and asked to set every input for Gemini 3.8 Flash from public evidence. The answer is reproduced below verbatim except for three presentation changes: ChatGPT's interface citation markers are removed, as on every page of this annex; links into the research run's own sandbox (files no reader can open) keep their text and lose the dead target; and equations are set as preformatted text, with a space between a bracket and a parenthesis inside them so the renderer does not read a product as a link; its sources are cited by URL in the text (published text SHA-256 `98b64256d91e54832886be79ad74a662faaa010bebb7b4fb0b0339805ac4036c`; as received, `57899124523a5957ca7b81ed19d3e3aa6719f10142a733ad7f7aa431ee92dfe6`).

## What the site shows

| reading | value |
|---|---|
| **Card headline** — this calculator on the run's central inputs, at list | **~92%** (92.21%) |
| Span — the run's own low- and high-margin scenarios, same engine | 72%–94% (72.44% – 94.29%) |
| The run's own stated reading | 92.2% (72.4–94.3%) |
| Same central inputs at the page's Reference traffic (15:1, 60% cache) — context, not the headline | ~91% |

The span is the author's judgment span: two scenarios it called plausible as a whole, not a probability interval and not a bound. The headline is a modeled unit direct-serving margin from public information; it is not a disclosure by the provider and not a company gross margin.

## Our reading

Gemini 3.8 Flash is priced on a published promotion — $0.75/$3.75 until the end of 2026, doubling to $1.50/$7.50 on 1 January 2027 — and the run prices the tariff in force today, as the brief asked; its own price-only sensitivity is that the 2027 tariff would lift the central to about 96%. Like the Gemini 3.1 Pro run, it treats Google's TPUs as owned: the whole fleet is TPU v7 at $1.20 per chip-hour all-in (its words: "rather than Google Cloud's retail rental rate"), which is the input that carries the number. The size is an assumption the run labels as such — 30B active, 600B total, FP8 — because Google's model card discloses none of it, and it holds the model on the calculator's GQA (Qwen3-class) donor geometry. The span is wider on the downside (72–94%) than on the upside because the low case changes more than the size: it adds the `fast` latency posture, and the run names latency — how much concurrent decode fits the required response time — as the most consequential downside. Google says 3.8 Flash is now the default in its own agent tooling while 3.7 Flash stays supported at the identical price; neither page says which carries more production traffic, so this card stands for both only as far as their serving is alike. At the page's Reference traffic the same inputs compute ~91%, close to the headline. This is the project's second research run for this model; the first stalled without finishing and is not used. The run reconstructed the calculator's equations after failing to reach the connector; the engine reproduces its figures to a tenth of a point.

## The operating point

Carrier: the calculator's blank `custom` row on the `qwen3c` attention geometry (a declared approximation — this model's architecture is not published). `batchShare` and `discount` are 0 in every run (list basis).

| input | central | low-margin scenario | high-margin scenario |
|---|---|---|---|
| `customDonor` | qwen3c | qwen3c | qwen3c |
| `active` | 30 | 45 | 30 |
| `total` | 600 | 900 | 600 |
| `precision` | fp8 | fp8 | fp8 |
| `priceIn` | 0.75 | 0.75 | 0.75 |
| `priceOut` | 3.75 | 3.75 | 3.75 |
| `cacheReadMult` | 10 | 10 | 10 |
| `billCacheHit` | 50 | 50 | 50 |
| `batchShare` | 0 | 0 | 0 |
| `discount` | 0 | 0 | 0 |
| `blend` | `{"tpu7":100}` | `{"tpu7":100}` | `{"tpu7":100}` |
| `rentAbsLeg` | `{"tpu7":1.2}` | `{"tpu7":1.2}` | `{"tpu7":1.05}` |
| `util` | 70 | 70 | 80 |
| `stackMult` | 1.1 | 1.1 | 1.15 |
| `trendMonths` | 0 | 0 | 0 |
| `interact` | balanced | fast | balanced |
| `hwMode` | rent | rent | rent |
| `cacheCost` | 5 | 5 | 5 |
| `cacheWriteShare` | 0 | 0 | 0 |
| `cacheWriteMult` | 100 | 100 | 100 |
| traffic | 8:1, 50% cache | 8:1, 50% cache | 8:1, 50% cache |

## The answer, verbatim

## 0 — THE CARD, IN TWO LINES.

≈92% at list (span 72–94%)  
The decisive cost assumption is $1.20 per all-in owned-TPU-equivalent chip-hour, rather than Google Cloud’s retail rental rate.

## 1 — PUBLIC FACTS.

**GPT-6 Astra Pro · September 25, 2026.** This is a modeled **unit direct-serving contribution margin**, not a verified Google margin or a company gross margin. The span comprises three selected scenarios, not a probability interval. Dates below distinguish publication/update dates from verification dates.

1. **S1 — Exact product and release: DISCLOSED.** I price the stable **`gemini-3.8-flash`**, released **September 2, 2026**, using the Standard paid text API. Google lists a 1,048,576-token input limit and 65,536-token output limit. This is not a Live, speech-generation, Batch, Flex or Priority endpoint. Sources: [model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), updated **2026-09-02**, and [release changelog](https://ai.google.dev/gemini-api/docs/changelog), entry **2026-09-02**; verified **2026-09-25**. 

2. **S2 — Current tariff: DISCLOSED.** The brief is correct: through **December 31, 2026**, Standard paid prices are **$0.75/M input, $0.075/M cached input and $3.75/M output, including thinking**. From **January 1, 2027**, the published schedule doubles these to **$1.50/$0.15/$7.50**. Explicit cache storage is separately priced at **$0.50/M token-hour**, subsequently $1.00. These promotional Standard prices—not Batch prices—are the list basis used here. Source: [Google pricing](https://ai.google.dev/gemini-api/docs/pricing), **verified 2026-09-25**. 

3. **S3 — Reasoning and served variants: DISCLOSED.** Google specifies **medium as the default reasoning level**, with low and high also supported. It identifies 3.8 Flash as the default for its Antigravity agent and SDK, while saying **3.7 Flash remains supported**. I price medium reasoning; I do not assume each effort level is a different set of weights. The pricing page lists the same Standard tariff for 3.7 and 3.8; neither page establishes which version carries most production tokens. Source: [latest-model guide](https://ai.google.dev/gemini-api/docs/latest-model), **accessed 2026-09-25**; tariff comparison from S2. 

4. **S4 — Target architecture: UNKNOWN.** The reviewed 3.8 model card does not identify total/active parameter counts, production weight precision, attention geometry or deployment width. Accordingly, **600B total / 30B active / FP8 are my assumptions**, not a disclosure or a black-box measurement. Source checked: [Gemini 3.8 Flash model card](https://deepmind.google/models/model-cards/gemini-3-8-flash/), **accessed 2026-09-25**. 

5. **S5 — Best quantitative size lead: COMMUNITY ESTIMATE.** Ivica Nikolić’s memorization study assigns the **preceding `gemini-3-flash-preview` a 405B estimated lower bound**. I checked the newer **v3, dated June 5, 2026**, rather than stopping at the v2 cited in the attachment. This is not a measured parameter count, a hard bound for 3.8, or evidence about active parameters. The method explicitly warns against precise MoE size inference. Source: [paper, Table III and §IV-C](https://arxiv.org/html/2605.29223v3), **2026-06-05**. 

6. **S6 — Physical accelerator: DISCLOSED.** Ironwood provides **4.614 PFLOP/s FP8, 192 GiB HBM and approximately 7.38 TB/s memory bandwidth per physical chip**. A four-chip VM is not four logical devices: frameworks expose two devices per physical chip. My hourly denominator is the **physical chip**, not a chiplet, VM or pod. Source: [TPU7x documentation](https://docs.cloud.google.com/tpu/docs/tpu7x), updated **2026-09-18**. 

7. **S7 — Public rental comparator: DISCLOSED.** Google’s Iowa Ironwood prices are **$12/chip-hour on demand, $6 Flex-start, $8.40 one-year committed and $5.40 three-year committed**. These are customer tariffs, not Google’s own resource cost. Source: [Cloud TPU pricing](https://cloud.google.com/tpu/pricing), **verified 2026-09-25**. 

8. **S8 — Capital-cost lead: CREDIBLY REPORTED.** SemiAnalysis reports approximately **400,000 Ironwood chips in $10 billion of finished racks** for an external transaction. Division gives a **$25,000 finished-system allocation per chip**. That is a useful public capital proxy, not Google’s purchase invoice and not an all-in hourly operating cost. Source: [Patel, Xie, Nishball and colleagues](https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the), **2025-11-28**. 

9. **S9 — Utilization evidence and its limit: DISCLOSED.** Google’s historical Gemini Apps energy study reports **0.24 Wh for the median text prompt**, including hosts, idle provisioned capacity and facility overhead. Its idle-energy share does **not** identify paid-capacity occupancy. In particular, it does not justify reading 10% idle energy as 90% utilization. Source: [Elsworth et al.](https://arxiv.org/html/2508.15734v1), submitted **2025-08-21**, measuring **May 2025** traffic. 

10. **S10 — Serving fleet, scale and cost disclosure: DISCLOSED.** Google says TPUs power Gemini training and serving across APIs and Search; it reported approximately **19 billion API tokens/minute** and a **78% reduction in Gemini serving costs during 2025**. These statements establish a substantial TPU-serving operation, not 3.8’s generation mix, location, occupancy or absolute dollars/token. Source: [Alphabet investor presentation](https://blog.google/alphabet/investor-presentation-june-2026/), **2026-06-03**. 

11. **S11 — Inspectable throughput proxy: DISCLOSED, for another model.** Google’s Qwen3-Coder-480B-A35B FP8 Ironwood recipe reports **518.86 output tokens/s/chip for 1K-input/8K-output** and **263.27 for 8K-input/1K-output**, on four chips at maximum concurrency 64. These are whole-benchmark output rates, not Gemini measurements or pure-decode rates. Its example latency fields do not provide numerical production latency guarantees. Source: [Google’s benchmark README](https://github.com/AI-Hypercomputer/tpu-recipes/blob/main/inference/ironwood/vLLM/Qwen3-Coder-480B-A35B/README.md), **accessed 2026-09-25**; the result table does not supply an independent measurement date. 

12. **S12 — Cache mechanism: DISCLOSED.** Implicit caching is enabled for current Gemini models and cache-hit savings are passed through. The documented minimum for 3.8 Flash is **4,096 input tokens**. This supports modeling discounted cache hits, but establishes no population hit rate. Source: [context-caching documentation](https://ai.google.dev/gemini-api/docs/caching), updated **2026-09-02**. 

13. **Model-specific commercial measurements: UNKNOWN.** I found no public 3.8 Flash revenue, direct-serving margin, absolute cost/token, internal TPU transfer price, representative occupancy or tokens/chip-second at a specified latency. The reviewed model material and Alphabet disclosure do not identify them. Sources checked: **S4 and S10**, on **2026-09-25**. None of my numerical priors should be mistaken for such a measurement. 

14. **S13–S15 — Calculator implementation: DISCLOSED by the calculator publisher, not by Google.** I inspected the public [cost/billing engine](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js), [geometry/calibration registry](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js) and [roofline implementation](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js), **accessed 2026-09-25**. Their operating points are modeling policies; using them does not turn the result into observed provider economics. 

## 2 — CALCULATOR INPUTS.

Parameters are in **billions**, utilization and cache shares in **percent**, prices in **USD per million tokens**, and rent in **USD per physical chip-hour**. Source IDs attached to an `ASSUMED` input identify its motivation, not a measurement of its value. The hourly-cost derivation contains additional explicit assumptions in heading 4.

```json
{
  "model_id": "custom",
  "model_name": "Gemini 3.8 Flash",
  "api_model_priced": "gemini-3.8-flash; stable, released 2026-09-02; Standard paid text API, medium reasoning",
  "customDonor": "qwen3c",
  "basis": "list",
  "context_length_assumed": "Representative 8000 input tokens and 1000 billed output tokens including thinking; mean decode context 8500, terminal 9000. Same lengths in all three scenarios; not a 1M-context estimate.",
  "central": {
    "overrides": {
      "customDonor": "qwen3c", "active": 30, "total": 600, "precision": "fp8",
      "priceIn": 0.75, "priceOut": 3.75, "cacheReadMult": 10, "billCacheHit": 50,
      "batchShare": 0, "discount": 0,
      "blend": {"tpu7": 100}, "rentAbsLeg": {"tpu7": 1.2},
      "util": 70, "stackMult": 1.1, "trendMonths": 0, "interact": "balanced", "hwMode": "rent",
      "cacheCost": 5, "cacheWriteShare": 0, "cacheWriteMult": 100
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 50}
  },
  "low_margin": {
    "overrides": {
      "customDonor": "qwen3c", "active": 45, "total": 900, "precision": "fp8",
      "priceIn": 0.75, "priceOut": 3.75, "cacheReadMult": 10, "billCacheHit": 50,
      "batchShare": 0, "discount": 0,
      "blend": {"tpu7": 100}, "rentAbsLeg": {"tpu7": 1.2},
      "util": 70, "stackMult": 1.1, "trendMonths": 0, "interact": "fast", "hwMode": "rent",
      "cacheCost": 5, "cacheWriteShare": 0, "cacheWriteMult": 100
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 50}
  },
  "high_margin": {
    "overrides": {
      "customDonor": "qwen3c", "active": 30, "total": 600, "precision": "fp8",
      "priceIn": 0.75, "priceOut": 3.75, "cacheReadMult": 10, "billCacheHit": 50,
      "batchShare": 0, "discount": 0,
      "blend": {"tpu7": 100}, "rentAbsLeg": {"tpu7": 1.05},
      "util": 80, "stackMult": 1.15, "trendMonths": 0, "interact": "balanced", "hwMode": "rent",
      "cacheCost": 5, "cacheWriteShare": 0, "cacheWriteMult": 100
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 50}
  },
  "stated": {"headline_pct": 92.2, "low_pct": 72.4, "high_pct": 94.3},
  "sources": [
    {"id": "S1", "claim": "Stable gemini-3.8-flash model identity; September 2026 release, corroborated by the September 2 changelog.", "url": "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash", "date": "2026-09-02", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "Standard paid input, output including thinking, cache-read and storage tariffs; date is verification date.", "url": "https://ai.google.dev/gemini-api/docs/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "Medium default reasoning, agentic positioning, and continued support for Gemini 3.7 Flash; accessed on the stated date.", "url": "https://ai.google.dev/gemini-api/docs/latest-model", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "Reviewed target model card does not identify parameter counts, production precision or serving topology; date is access date.", "url": "https://deepmind.google/models/model-cards/gemini-3-8-flash/", "date": "2026-09-25", "evidence_class": "UNKNOWN"},
    {"id": "S5", "claim": "Nikolic v3: 405B estimated lower bound for predecessor Gemini 3 Flash Preview, not a measurement or bound for 3.8.", "url": "https://arxiv.org/html/2605.29223v3", "date": "2026-06-05", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S6", "claim": "Ironwood physical-chip specifications and dual-chiplet distinction; documentation update date.", "url": "https://docs.cloud.google.com/tpu/docs/tpu7x", "date": "2026-09-18", "evidence_class": "DISCLOSED"},
    {"id": "S7", "claim": "Public Ironwood Iowa chip-hour prices, not Google internal resource cost; verification date.", "url": "https://cloud.google.com/tpu/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S8", "claim": "SemiAnalysis reports about 400000 Ironwood chips in about USD10B of finished racks.", "url": "https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the", "date": "2025-11-28", "evidence_class": "CREDIBLY REPORTED"},
    {"id": "S9", "claim": "Google historical full-stack energy measurement includes hosts and idle provisioned capacity, but does not identify current Flash occupancy.", "url": "https://arxiv.org/html/2508.15734v1", "date": "2025-08-21", "evidence_class": "DISCLOSED"},
    {"id": "S10", "claim": "TPUs power Gemini serving; approximately 19B API tokens/minute and 78% lower Gemini serving costs during 2025; no model-specific absolute cost.", "url": "https://blog.google/alphabet/investor-presentation-june-2026/", "date": "2026-06-03", "evidence_class": "DISCLOSED"},
    {"id": "S11", "claim": "Google Qwen3-Coder-480B-A35B FP8 Ironwood serving recipe and output-throughput table; accessed on the stated date.", "url": "https://github.com/AI-Hypercomputer/tpu-recipes/blob/main/inference/ironwood/vLLM/Qwen3-Coder-480B-A35B/README.md", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S12", "claim": "Implicit caching, passed-through savings and 4096-token minimum for Gemini 3.8 Flash.", "url": "https://ai.google.dev/gemini-api/docs/caching", "date": "2026-09-02", "evidence_class": "DISCLOSED"},
    {"id": "S13", "claim": "Calculator billing and cost implementation, not Google economics; public source accessed on the stated date.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S14", "claim": "Calculator donor geometry, calibrations and operating-point policy; public source accessed on the stated date.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S15", "claim": "Calculator roofline and traffic-length formulas; public source accessed on the stated date.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"}
  ],
  "key_inputs": [
    {"input": "active", "central": 30, "low_margin": 45, "high_margin": 30, "source_ids": ["S5", "S11"], "evidence_class": "ASSUMED"},
    {"input": "total", "central": 600, "low_margin": 900, "high_margin": 600, "source_ids": ["S5", "S11"], "evidence_class": "ASSUMED"},
    {"input": "customDonor", "central": "qwen3c", "low_margin": "qwen3c", "high_margin": "qwen3c", "source_ids": ["S4", "S14"], "evidence_class": "ASSUMED"},
    {"input": "precision", "central": "fp8", "low_margin": "fp8", "high_margin": "fp8", "source_ids": ["S6", "S9", "S11"], "evidence_class": "ASSUMED"},
    {"input": "priceIn", "central": 0.75, "low_margin": 0.75, "high_margin": 0.75, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "priceOut", "central": 3.75, "low_margin": 3.75, "high_margin": 3.75, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "cacheReadMult", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S2"], "evidence_class": "INFERENCE"},
    {"input": "blend", "central": {"tpu7": 100}, "low_margin": {"tpu7": 100}, "high_margin": {"tpu7": 100}, "source_ids": ["S6", "S10"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg.tpu7", "central": 1.2, "low_margin": 1.2, "high_margin": 1.05, "source_ids": ["S8"], "evidence_class": "INFERENCE"},
    {"input": "util", "central": 70, "low_margin": 70, "high_margin": 80, "source_ids": ["S9", "S10"], "evidence_class": "ASSUMED"},
    {"input": "stackMult", "central": 1.1, "low_margin": 1.1, "high_margin": 1.15, "source_ids": ["S9", "S10", "S11"], "evidence_class": "ASSUMED"},
    {"input": "trendMonths", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "balanced", "low_margin": "fast", "high_margin": "balanced", "source_ids": ["S3", "S11", "S14"], "evidence_class": "ASSUMED"},
    {"input": "traffic.io_ratio", "central": 8, "low_margin": 8, "high_margin": 8, "source_ids": ["S3"], "evidence_class": "ASSUMED"},
    {"input": "traffic.cache_hit", "central": 50, "low_margin": 50, "high_margin": 50, "source_ids": ["S3", "S12"], "evidence_class": "ASSUMED"},
    {"input": "billCacheHit", "central": 50, "low_margin": 50, "high_margin": 50, "source_ids": ["S12"], "evidence_class": "ASSUMED"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": ["S13"], "evidence_class": "ASSUMED"}
  ],
  "confidence": "low; prices and conditional arithmetic are well identified, but architecture, paid-capacity occupancy, actual request mix and production concurrency are not measured."
}
```

## 3 — YOUR OWN READING.

My central reading is **92.2% at the current Standard list tariff**, with selected low/high scenarios of **72.4% and 94.3%**. The most consequential favorable assumption is valuing a Google-owned serving estate at its economic resource cost rather than a retail cloud price. The most consequential downside is **how much concurrent decode work fits the required latency**, not a hypothetical enterprise discount.

**Execution status.** I could not obtain a live `run_scenario` response from [the supplied MCP endpoint](https://margins-mcp.ashitaorbis.com/mcp); the connection attempts failed. Therefore, these are **independently reconstructed predictions of the calculator results**, not quoted MCP returns. The intended invocation is `run_scenario(model="custom", perspective="median", overrides=central.overrides, traffic=central.traffic)`, repeated for the other two blocks. The commissioned runner’s output remains authoritative for the card.

I reconstructed the relevant public FP8 MoE cost and billing formulas, including attention traffic and the TPU weight-traffic convention. As a cross-check—not a live execution—the same reconstruction gives **82.3265%** for the supplied current Opus reference vector, matching attachment 02’s **82.33%** after rounding. The attachment’s original **83.1%** is a separate historical authored result.  

**Central arithmetic.** The occupied-chip throughput calculation gives approximately **1,229 output tokens/s/chip** and **12,361 fresh-input tokens/s/chip**. These are model outputs, not observations. With $1.20/hour and 70% paid-capacity utilization:

```text
C_{out}=\frac{1.20\times10^6}{3600\times1229.178\times0.70}
=\$0.387406/\mathrm{Mtok},
```
```text
C_{in}=\frac{1.20\times10^6}{3600\times12360.574\times0.70}
=\$0.038525/\mathrm{Mtok}.
```
At `cacheCost=5`, a cache read costs **$0.001926/M tokens**. Normalize traffic to one million billed output tokens, four million fresh input tokens and four million cached input tokens:

```text
R=3.75+4(0.75)+4(0.075)=\$7.05,
```
```text
C=0.387406+4(0.038525)+4(0.001926)=\$0.549210,
```
```text
m=1-C/R=\mathbf{92.2098\%}.
```
Equivalently, revenue is **$0.783333/M total tokens**, serving cost is **$0.061023/M total tokens**, and contribution is approximately **$0.722310/M total tokens**. These are arithmetic consequences of the declared inputs, not revenue or cost disclosures.

| Joint scenario | Interpretation | Cost per 1M output plus 8M input | Serving margin |
|---|---|---:|---:|
| Central | 600B/30B, balanced latency, $1.20/hour, 70% utilization | $0.5492 | **92.2%** |
| Low margin | 900B/45B and stricter latency; same rent, occupancy, efficiency and traffic | $1.9427 | **72.4%** |
| High margin | Same central architecture; $1.05/hour, 80% occupancy, 1.15× stack | $0.4022 | **94.3%** |

The low scenario combines a larger network with latency-limited batching. It does **not** also assume expensive rental procurement, weak utilization, no caching and a worse software stack. The high scenario describes a more mature serving estate; it does **not** simultaneously shrink the model, assume FP4, switch to compressed attention and select throughput-first service.

**Tariff step.** Holding the central workload and cost fixed, the published January 2027 tariff would give **96.1%**, approximately **3.9 margin points higher**. That is a price-only sensitivity, not a forecast that either costs or the tariff will remain unchanged until then. 

**Negative-margin audit.** None of the three selected scenarios is negative. I checked billion-parameter versus raw-parameter units, per-million token pricing, physical-chip versus chiplet/VM hours, and `util=70` rather than `0.70` in the submitted block. Idle paid capacity is charged once through utilization; power, facilities and hosts are charged once inside rent. No input was changed to force a positive answer.

## 4 — WHY THESE INPUTS.

**Architecture: 600B total, 30B active; 900B/45B in the low case — ASSUMED, motivated by S4/S5/S11.** I place the model in the several-hundred-billion-total, tens-of-billions-active regime suggested by the predecessor size study and the open 480B/35B comparator. Those sources do not identify these particular numbers. The low case preserves the same 5% active fraction at 1.5× scale. A disclosed count or FLOPs/token would supersede both. I do not infer size from price or equate a faster user stream with fewer parameters. 

**Donor and precision: `qwen3c`, FP8 — ASSUMED, S4/S6/S11/S14.** GQA is a transparent default when Google’s actual attention scheme is unknown. I have no evidence warranting the more favorable MLA donor. FP8 is a supported hardware regime with a relevant public serving example, not a claim about every production tensor. There is no FP4 credit. Changing only the central donor to `dsr1` gives **93.2%**, about one point higher; that sensitivity does not establish which donor is correct. 

**Fleet: 100% `tpu7` — ASSUMED economic surrogate, S6/S10.** TPU-family serving is public; the 100% Ironwood allocation is not. I use the only relevant TPU generation in the permitted registry rather than invent a measured generation split. Older TPUs and any newer internal deployment would require a different effective cost/performance mapping. Specific sites and regional routing remain unknown. 

**All-in equivalent rent: $1.20/hour central and low; $1.05 high — INFERENCE from S8 plus the following ASSUMED accounting/economic choices.** Starting capital is $25,000 per chip in finished systems. Because the observation already covers finished racks, I do **not** add another generic rack/host multiplier. Facilities remain separate. 

Using annual capital recovery `\mathrm{CRF}(r,n)=r/[1-(1+r)^{-n}]`:

| Cost component | Central assumptions | $/available chip-hour |
|---|---|---:|
| Installed IT capital recovery | $25,000; five years; 8% annual capital cost | 0.7148 |
| Facility capital recovery | $14,000 allocation/chip; 15 years; 8% | 0.1867 |
| Electricity and cooling | 1.4 kW allocated IT load including hosts/network; PUE 1.10; $0.08/kWh | 0.1232 |
| Maintenance and serving/site operations | 6% of IT capital annually | 0.1712 |
| **Total, then rounded for entry** | **8,760 hours/year** | **1.1959 → 1.20** |

Apart from the reported finished-rack capital anchor, **none of these component values is a measured Google figure**. The facility allocation covers building and electrical/cooling infrastructure, not a second set of servers. The operations allowance covers maintenance and serving operations, not customer support or corporate overhead. Capital recovery is an economic carrying-cost convention, not a claim about Google’s accounting depreciation.

The high case extends IT recovery to six years and lowers annual maintenance/operations to 4%, leaving the other components unchanged: **$1.0414/hour**, rounded to **$1.05**. Its 80% occupancy represents a better-loaded estate. Both constructions include power and hosts already. No additional 12% host uplift or 1.72× energy uplift is added.

At central settings, substituting the **$5.40 retail committed tariff** as Google’s cost gives **64.9%**. That 27.3-point difference demonstrates the importance of the cost basis; it is not evidence that the inferred $1.20 is exact. The retail quote is verified, while the internal equivalent is not. 

**Utilization: 70%, or 80% in the high case — ASSUMED, S9/S10.** The scale of demand motivates a reasonably well-loaded fleet, while regional fragmentation, headroom and latency prevent assuming 100%. There is no occupancy measurement behind either value. Holding everything else fixed, 50% utilization gives **89.1%**. Energy shares and training MFU cannot substitute for this divisor. 

**Efficiency: 1.10× stack, 1.15× high; zero lead months — ASSUMED, S9/S10/S11.** I allow a modest model-specific production advantage over the public baseline. Google’s historical cost improvement motivates considering an advantage but does not measure a standing gap. The central credit adds only **0.8 margin points** versus `stackMult=1`. `trendMonths=0` and omission of `specDec` ensure the advantage is counted once. 

**Traffic: 8:1, 50% served and billed cache hits — ASSUMED, S3/S12.** My best working mix is repeated-prefix coding and enterprise-agent traffic, with billed thinking increasing output relative to visible answer text. It is not a measured traffic census. The assumed representative request has 8,000 input tokens and 1,000 billed output tokens. A 50% token-weighted hit rate need not mean a 4,000-token cached prefix on every request: for example, 80% of such requests hitting a 5,000-token prefix produces that average and respects the documented cache threshold. 

**Latency and batching: balanced central, fast low — ASSUMED, S11/S14.** The engine’s TPU policy uses 16 output tokens per chip per step in balanced mode and four in fast mode. At its declared 16-chip throughput width, balanced implies 256 concurrent sequences; the public four-chip benchmark cited only 64 globally. That width-scaled concurrency is a modeling choice, not a production observation. It is the main reason the lower scenario is far below the central one. Here `fast` changes the calculator’s latency posture, not the API’s medium reasoning setting. 

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The reference author states **83.1%, span 68–92%**. Its vector uses 300B active/2.5T total, FP8, $5/$25, 15:1 traffic with 60% caching, 65% occupancy, a mixed fleet, and two months of residual efficiency lead. I retain its declared inputs rather than reinterpret that estimate as Google evidence.  

The following is a **path-ordered arithmetic bridge**, starting from the reconstructed current-engine **82.3265%**. It changes one input group at a time and holds Reference traffic until the final row. Contributions depend on order; they are not independent effects to transplant into another scenario.

| Change from the reference, in this order | Margin-point change | Running margin |
|---|---:|---:|
| Starting current-engine reference | — | 82.33% |
| Active parameters: 300B → 30B | +13.28 | 95.61% |
| Total parameters: 2,500B → 600B | +1.25 | 96.86% |
| Fleet: mixed → 100% TPU7, retaining $2.70 TPU rent | +0.67 | 97.53% |
| TPU hourly valuation: $2.70 → $1.20 | +1.37 | 98.90% |
| Paid-capacity utilization: 65% → 70% | +0.08 | 98.98% |
| Residual efficiency: 2 months, or 1.20094×, → 1.10× stack/zero months | −0.09 | 98.89% |
| Attention donor: MLA → Qwen-class GQA | −0.19 | 98.70% |
| Input/output/cache tariffs: all reduced to 15% of Opus tariffs | −7.36 | **91.34%** |
| Traffic: 15:1/60% → 8:1/50%, including billed cache share | +0.87 | **92.21%** |

The reference fleet is H100 5%, H200 10%, GB200 25%, GB300 20%, TPU7 40%. Its procurement factors translate into **$2.28, $3.496, $4.275, $5.70 and $2.70/hour**, respectively, using the supplied current planning rents. FP8, balanced central latency, 10% cache-read pricing, 5% cache serving cost, zero write premium, zero Batch share and zero discount create no separate differences.   

**Like-for-like companion:** central Gemini inputs at **15:1/60%**, with **`billCacheHit=60`**, predict **91.34%**. That is about **9.01 points above the current 82.33% Opus calculation**, or **8.24 points above its author’s 83.1%**. The companion is not the headline. Changing serving cache hits without changing the billed share would be a different comparison.

The small hourly-cost step in this particular bridge is evaluated while Opus’s much higher tariffs still apply. At Gemini’s own central prices, changing only $1.20 to the reference TPU valuation of $2.70 costs approximately **9.7 margin points**. This illustrates why waterfall ordering must be disclosed.

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

**The most valuable measurement is a matched production serving trace:** physical chip count, completed fresh/cached/output tokens, wall-clock time including idle capacity, reasoning level, context distribution, and a stated latency target. Coupled with an all-in hourly resource cost, it would replace most of this report’s uncertain inputs at once.

| New finding or one-at-a-time test | Implication under the other central assumptions |
|---|---|
| Only four concurrent output tokens/chip meet the latency target | Margin falls to **80.9%**; adding the low case’s larger architecture gives **72.4%**. |
| All-in economic cost is $2.40/hour rather than $1.20 | Margin falls to **84.4%**. |
| Active parameters are 60B rather than 30B | Margin falls to **90.3%**. |
| Total parameters are 1.2T rather than 600B | Margin falls to **88.4%**. |
| Paid-capacity utilization is 50% rather than 70% | Margin falls to **89.1%**. |
| There is no residual private-stack advantage | Margin falls to **91.4%**. |
| Actual geometry permits MLA-like compressed KV | The donor-only sensitivity rises to **93.2%**. |

These are tests of the model, not additional endpoint scenarios.

**A public cross-check already argues for caution.** Taking Google’s open Qwen recipe’s **263.27 output tokens/s/chip at 8K/1K** literally as a whole-request throughput proxy, applying $1.20/hour and 70% paid utilization, and retaining this report’s $7.05 billing bundle gives approximately **74.3%**. I do **not** charge prefill again in that calculation. Nor do I call it a Gemini estimate: the model, cached-work share, concurrency and deployment width differ. But it shows that the public serving anchor does not independently validate 92.2%. 

The central reconstruction instead implies approximately **867 equivalent completed output tokens/s per occupied chip after accounting for input work**, around 3.3 times that open 8K/1K point. Wider concurrent serving and cached input contribute to the gap; the explicit private-stack multiplier is only 1.10. A matched Google measurement near the lower benchmark throughput would move my center down sharply, not be dismissed as a benchmark inconvenience.

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Context distribution.** There is no independent context-length input. I therefore match the engine’s 1,000-output-token convention with an 8:1 ratio: 8,000 prompt tokens, mean decode context **8,500**, terminal context **9,000**. The Reference companion becomes approximately 15,500 during decode. This is not an estimate for requests near the model’s advertised million-token limit. A mean also cannot express a costly long-context tail or correlation between context length and cache reuse. The length conversion comes from the public roofline; the chosen workload is my assumption. 

**Geometry and placement.** The custom row now exposes `customDonor`, so donor choice is expressible; Google’s actual geometry is not. Qwen-class GQA supplies a proxy for layers, heads and KV traffic while my block supplies parameter magnitudes. The reconstruction includes **126,976 FP8 KV bytes per context token** and the TPU convention of reading total resident weights divided by a declared 16-chip width. Omitting these terms and using active-parameter FLOPs alone would overstate the margin. 

Under the registered capacity policy, the central case’s minimum four-chip placement uses approximately **188.9 GB/chip**, including peak KV and a 10% reserve, within **192 GiB ≈206.2 GB**. The low case fits on eight. These are capacity-policy checks, not observed layouts. The capacity minimum and the throughput calculation’s declared 16-chip width are different constructs; neither proves Google uses that topology or meets a service-level objective. The supplied contract itself distinguishes policy feasibility from verified placement and latency. 

**Calibration transfer.** The public TPU decode coefficient is **0.519**, whereas prefill uses the calculator’s transferred **0.17581** coefficient. They are not a matched Gemini calibration. The decode evidence uses output over whole-benchmark time; interpreting it as a pure phase coefficient while pricing prefill separately introduces a timing-basis approximation. I neither hide that limitation nor add a compensating efficiency credit. A ±50% change in central prefill cost alone moves the result approximately **±1.15 points**. 

**Cache storage and ancillary services.** The headline models token serving with implicit reuse. It includes cache-read work and live KV pressure, but no separately sold persistent-cache storage service: neither storage revenue nor that service’s separate expense is added. The calculator cannot express cache lifetime or billable token-hours. Likewise, grounding, execution and other tool-service charges are not treated as token revenue. An explicit-cache-heavy or tool-heavy invoice requires an expanded cost-and-billing model. This is a perimeter limit, not an assertion that storage is free. 

**Unresolved production facts.** I could not establish an immutable dated snapshot behind the stable name, 3.7 versus 3.8 traffic shares, internal variants by reasoning level, exact total/active size, precision, attention scheme, generation/site allocation, latency-qualified throughput, occupancy, internal transfer price, actual input/output/cache mix, or model-specific revenue and margin. Billed thinking is included in output; unbilled retries are excluded by the commissioned cost perimeter. No claim is made about free Search/app traffic, subscription economics, training, research, support, sales or corporate profit.

**Treatment of the earlier Google dive.** Its **95.7%** was an independently modeled **Gemini 3.1 Pro** result with a different throughput construction, not a measured Google margin. I used its leads, rechecked public sources—including the newer size-paper revision—and did not inherit its old Flash tariff or add its host uplift to an already all-in rent. 

**File receipt.** All three uploads were readable and reviewed before proceeding. Their supplied names and first readable lines were:

| Supplied file | First line, truncated where necessary |
|---|---|
| `03-calculator-contract-live-2026-09-25.json` | `{"result":{"content":{"type":"text","text":"The scenario space of the Frontier Inference Margins ca` |
| `04-opus-4x-reference-dive-verbatim-2026-08-08.md` | `` ```json `` |
| `06-google-gptpro.md` | `# Google (Gemini) — GPT-5.6 Pro deep dive` |

**Bottom line:** 92.2% is my conditional best reading of the declared vector. The 72.4–94.3% span expresses selected uncertainty, not a guarantee that the true margin lies inside it. The evidence is strongest on identity and tariff, weakest on production concurrency and internal cost; the calculator can price those assumptions but cannot establish them.

[Complete copy-of-record report (a file in the research run's own workspace, not published)
