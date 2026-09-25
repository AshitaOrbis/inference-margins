## 0 — THE CARD, IN TWO LINES.

≈78.5% at list (span 68–84%)  
The estimate turns on an assumed 200B active parameters—not a disclosed Opus 5.5 size.

## 1 — PUBLIC FACTS.

**GPT-6 Astra Pro · 2026-09-25 UTC.** Dates below are publication dates unless marked “inspected.” Inspection dates on dynamic pages do not establish when a tariff first took effect. This is a conditional estimate for paid, standard-speed, first-party API traffic at list—not subscriptions, company gross margin, or a verified provider margin.

**File receipt.** Both uploaded files opened successfully; the other four materials were supplied inline and were readable. First lines are recorded below, truncated where needed.

| Supplied filename | First line |
|---|---|
| `01-method-and-input-contract.md` | `# The calculator: what it computes, and exactly which inputs you may give it` |
| `02-opus-4x-reference-dive-summary.md` | `# The reference: GPT-5.6 Pro's estimate for Claude Opus 4.x — the headline form this dive should match` |
| `03-calculator-contract-live-2026-09-25.json` | `{"result":{"content":[{"type":"text","text":"The scenario space of the Frontier Inference Margins ca` |
| `04-opus-4x-reference-dive-verbatim-2026-08-08.md` | Opening code fence: three backticks followed by `json` |
| `05-carrier-and-nearest-row.md` | `# How the calculator will hold Claude Opus 5.5, and the nearest row the site carries today` |
| `06-anthropic-gptpro.md` | `# GPT-5.6 Pro consult — ADOPTED-FINDINGS SUMMARY (req_1783636621475_l5tccc, 54m21s, 2026-07-09)` |

1. **S1 — DISCLOSED; inspected 2026-09-25.** The API identifier is **`claude-opus-5-5`**, released **2026-09-22**. Adaptive thinking is always on; default effort is `medium`. I price that standard-speed configuration with default safeguards and global routing. Source: [Anthropic model overview](https://platform.claude.com/docs/en/models/opus-5-5/overview). 

2. **S2 — DISCLOSED; inspected 2026-09-25.** Standard prices are **$4 input / $20 output / $0.20 cache read per million tokens**. Therefore **`cacheReadMult = 5`, not 10**. Five-minute and one-hour cache writes cost $5 and $8 respectively. No promotional standard tariff was identified. Source: [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing). 

3. **S1–S3 — DISCLOSED; launch 2026-09-22, documentation inspected 2026-09-25.** The model supports 1M context without a higher long-context token tariff. Fast mode is separately priced at $8/$40 and is excluded here. The launch compares against **Opus 5**: Opus 4.x is this commission’s economic reference, not the immediate predecessor named by Anthropic. Sources: [model overview](https://platform.claude.com/docs/en/models/opus-5-5/overview), [pricing](https://platform.claude.com/docs/en/about-claude/pricing), [launch](https://www.anthropic.com/claude-opus-5-5). 

4. **S3 — DISCLOSED; 2026-09-22.** The launch’s lower-cost task results concern **customer expenditure to complete tasks**, not Anthropic’s direct cost per token. Its safeguards also involve fallback models. Neither establishes a pure-backbone production cost or the fallback share of billed traffic. Source: [Anthropic launch](https://www.anthropic.com/claude-opus-5-5). 

5. **UNKNOWN; checked 2026-09-25 against S1 and S3.** No defensible Opus 5.5 active-parameter count, total-parameter count, production precision, or attention/KV geometry was established from the accessible primary material. The report’s 200B/2.5T values are working assumptions, not disclosed or independently measured. Sources checked: [model overview](https://platform.claude.com/docs/en/models/opus-5-5/overview) and [launch](https://www.anthropic.com/claude-opus-5-5). 

6. **S4 — DISCLOSED; technical-report version 2025-02-18.** DeepSeek-V3 has 671B total and 37B active parameters and uses MLA. This supplies an open architectural analogy, **not an Opus size estimate**. Source: [DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437). 

7. **S5–S6 — DISCLOSED; 2026-05-06.** Anthropic contracted Colossus 1 capacity; the partnership announcement names H100, H200 and GB200 hardware. This establishes available hardware families, not which site or generation serves an Opus 5.5 token. Sources: [Anthropic](https://www.anthropic.com/news/higher-limits-spacex), [SpaceXAI](https://x.ai/news/anthropic-compute-partnership). 

8. **S7–S8 — DISCLOSED; 2026-04-20 and 2025-10-23.** Anthropic reported using more than one million Trainium2 chips across training and serving, and separately announced expansion to as many as one million TPUs. Neither statement identifies Opus 5.5’s serving allocation or token-weighted fleet. Sources: [Amazon partnership](https://www.anthropic.com/news/anthropic-amazon-compute), [Google Cloud expansion](https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services). 

9. **S9 — DISCLOSED; inspected 2026-09-25.** CoreWeave lists an eight-GPU H200 node at $50.44/hour and a four-GPU GB200 slice at $42/hour: **$6.305 and $10.50 per GPU-hour**, respectively. Its advertised committed discounts are not an Anthropic contract disclosure. Source: [CoreWeave pricing](https://www.coreweave.com/pricing). 

10. **S10 — DISCLOSED; inspected 2026-09-25.** Google’s Iowa three-year committed Ironwood rate is **$5.40/chip-hour**. It is a public retail commitment price, not Anthropic’s disclosed procurement cost. Source: [Google TPU pricing](https://cloud.google.com/tpu/pricing). 

11. **S11 — COMMUNITY ESTIMATE; 2025-11-28.** SemiAnalysis estimates **$1.60/chip-hour** for Anthropic’s rented TPUs. This is analyst work, not a published contract, and has a different procurement basis from Google’s public committed tariff. Source: [SemiAnalysis TPUv7 analysis](https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the). 

12. **S12 — COMMUNITY ESTIMATE; inspected 2026-09-25.** Artificial Analysis reports approximately **79 output tokens/second** for medium effort with default fallback. This measures a client stream, **not aggregate accelerator throughput**, and cannot identify parameter count without concurrency, deployment and kernel information. Source: [Artificial Analysis](https://artificialanalysis.ai/models/claude-opus-5-5-medium). 

13. **S13 — COMMUNITY ESTIMATE; 2026-08-24.** The AgentX coding trace reports median input/output lengths of approximately **142,000/444 tokens**. It motivates testing long, reusable-prefix traffic, but is not Opus 5.5 population telemetry. A ratio of those medians is not the population token ratio. Source: [AgentX/InferenceXv3](https://inferencex.semianalysis.com/blog/agentx-inferencexv3-does-cuda-moat). 

14. **UNKNOWN; checked 2026-09-25 against S1, S5–S8 and S12.** No representative Opus 5.5 paid-capacity utilization, matched-latency accelerator throughput, actual contract rate, precise model-to-site map, or provider-disclosed serving margin was established. Hardware capacity announcements are not occupancy measurements. Sources checked: [model documentation](https://platform.claude.com/docs/en/models/opus-5-5/overview), [Anthropic infrastructure announcement](https://www.anthropic.com/news/anthropic-amazon-compute), [benchmark](https://artificialanalysis.ai/models/claude-opus-5-5-medium). 

15. **S7 — DISCLOSED; 2026-04-20.** Anthropic reported more than $30 billion in company run-rate revenue. That is neither Opus 5.5 revenue nor serving margin. Source: [Anthropic–Amazon announcement](https://www.anthropic.com/news/anthropic-amazon-compute). 

16. **S14 — ASSUMED calculator inputs; inspected 2026-09-25.** The calculator’s hardware coefficients and operating batches mix measured, transferred and assumed quantities. Its Trainium batch convention has an unresolved approximately 15.2× throughput ambiguity; GB300’s batch and coefficient are assumed; TPU’s coefficient uses an end-to-end timing proxy. These are limitations of this estimate, not Anthropic disclosures. Source: [public data registry](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js).   

17. **S15–S16 — INFERENCE; code inspected 2026-09-25, published decomposition dated 2026-09-20.** The public equations and published cost decomposition allow an independent arithmetic reconstruction. Reproducing them checks arithmetic, not the correctness of the provider-cost assumptions. Sources: [roofline implementation](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js), [Where the input-side cost comes from](https://margins.ashitaorbis.com/research/input-cost-reconstruction).  

## 2 — CALCULATOR INPUTS.

All three runs use the same verified tariff and list basis. Only model size and utilization differ across the selected scenarios. In `key_inputs`, source IDs identify the information informing a judgment; **`ASSUMED` means those sources do not measure the chosen value**. `cacheWriteShare` below means the percentage of **fresh input** billed as cache creation.

```json
{
  "model_id": "custom",
  "model_name": "Claude Opus 5.5",
  "api_model_priced": "claude-opus-5-5; released 2026-09-22; first-party global standard speed, adaptive thinking at medium effort, default safeguards",
  "customDonor": "dsr1",
  "basis": "list",
  "context_length_assumed": "Representative 30000 input + 1000 total generated tokens: decode context 30500, terminal KV context 31000. Not a 1M-context cost estimate.",
  "central": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 200,
      "total": 2500,
      "precision": "fp8",
      "priceIn": 4,
      "priceOut": 20,
      "cacheReadMult": 5,
      "billCacheHit": 85,
      "batchShare": 0,
      "discount": 0,
      "blend": {"h200": 10, "gb200": 35, "gb300": 20, "tpu7": 35},
      "rentAbsLeg": {"h200": 3.5, "gb200": 5, "gb300": 6, "tpu7": 2.7},
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
    },
    "traffic": {"mode": "custom", "io_ratio": 30, "cache_hit": 85}
  },
  "low_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 300,
      "total": 3000,
      "precision": "fp8",
      "priceIn": 4,
      "priceOut": 20,
      "cacheReadMult": 5,
      "billCacheHit": 85,
      "batchShare": 0,
      "discount": 0,
      "blend": {"h200": 10, "gb200": 35, "gb300": 20, "tpu7": 35},
      "rentAbsLeg": {"h200": 3.5, "gb200": 5, "gb300": 6, "tpu7": 2.7},
      "util": 60,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
    },
    "traffic": {"mode": "custom", "io_ratio": 30, "cache_hit": 85}
  },
  "high_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 150,
      "total": 2000,
      "precision": "fp8",
      "priceIn": 4,
      "priceOut": 20,
      "cacheReadMult": 5,
      "billCacheHit": 85,
      "batchShare": 0,
      "discount": 0,
      "blend": {"h200": 10, "gb200": 35, "gb300": 20, "tpu7": 35},
      "rentAbsLeg": {"h200": 3.5, "gb200": 5, "gb300": 6, "tpu7": 2.7},
      "util": 70,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
    },
    "traffic": {"mode": "custom", "io_ratio": 30, "cache_hit": 85}
  },
  "stated": {
    "headline_pct": 78.4866,
    "low_pct": 67.9196,
    "high_pct": 83.9777
  },
  "sources": [
    {"id": "S1", "claim": "Exact API identity, release, always-on adaptive thinking and default medium effort. Inspection date.", "url": "https://platform.claude.com/docs/en/models/opus-5-5/overview", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "Standard input/output 4/20; cache read 0.20; five-minute/one-hour writes 5/8 USD per million tokens. Inspection date.", "url": "https://platform.claude.com/docs/en/about-claude/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "Launch compares with Opus 5; customer task-cost reduction is not provider serving-cost disclosure; safeguards include fallback models.", "url": "https://www.anthropic.com/claude-opus-5-5", "date": "2026-09-22", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "DeepSeek-V3 has 671B total and 37B active parameters and MLA; an architectural analogy, not an Opus size estimate.", "url": "https://arxiv.org/abs/2412.19437", "date": "2025-02-18", "evidence_class": "DISCLOSED"},
    {"id": "S5", "claim": "Anthropic contracted Colossus 1 capacity; no Opus 5.5 allocation disclosed.", "url": "https://www.anthropic.com/news/higher-limits-spacex", "date": "2026-05-06", "evidence_class": "DISCLOSED"},
    {"id": "S6", "claim": "Colossus 1 partnership names H100, H200 and GB200 hardware.", "url": "https://x.ai/news/anthropic-compute-partnership", "date": "2026-05-06", "evidence_class": "DISCLOSED"},
    {"id": "S7", "claim": "Over one million Trainium2 chips used across training and serving; over 30 billion USD company run-rate revenue. Neither is Opus-specific telemetry.", "url": "https://www.anthropic.com/news/anthropic-amazon-compute", "date": "2026-04-20", "evidence_class": "DISCLOSED"},
    {"id": "S8", "claim": "Up-to-one-million-TPU capacity expansion, not a served-token allocation.", "url": "https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services", "date": "2025-10-23", "evidence_class": "DISCLOSED"},
    {"id": "S9", "claim": "Public eight-GPU H200 node and four-GPU GB200 slice prices; committed discounts advertised up to 60 percent. Inspection date.", "url": "https://www.coreweave.com/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S10", "claim": "Ironwood Iowa three-year committed list price 5.40 USD per chip-hour. Inspection date.", "url": "https://cloud.google.com/tpu/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S11", "claim": "SemiAnalysis estimates Anthropic rented TPU cost at 1.60 USD per chip-hour; not a disclosed contract.", "url": "https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the", "date": "2025-11-28", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S12", "claim": "Medium/default-fallback client stream approximately 79 output tokens per second; not accelerator throughput. Inspection date.", "url": "https://artificialanalysis.ai/models/claude-opus-5-5-medium", "date": "2026-09-25", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S13", "claim": "AgentX coding trace has median input/output lengths 142000/444; not Opus 5.5 population telemetry.", "url": "https://inferencex.semianalysis.com/blog/agentx-inferencexv3-does-cuda-moat", "date": "2026-08-24", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S14", "claim": "Calculator geometry, operating points and mixed-evidence calibration constants; no measured Anthropic deployment. Inspection date.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js", "date": "2026-09-25", "evidence_class": "ASSUMED"},
    {"id": "S15", "claim": "Independent transcription of public roofline equations, not an MCP execution. Inspection date.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js", "date": "2026-09-25", "evidence_class": "INFERENCE"},
    {"id": "S16", "claim": "Published calculator cost decomposition used as an arithmetic cross-check, not provider ground truth.", "url": "https://margins.ashitaorbis.com/research/input-cost-reconstruction", "date": "2026-09-20", "evidence_class": "INFERENCE"}
  ],
  "key_inputs": [
    {"input": "active", "central": 200, "low_margin": 300, "high_margin": 150, "source_ids": ["S4", "S14"], "evidence_class": "ASSUMED"},
    {"input": "total", "central": 2500, "low_margin": 3000, "high_margin": 2000, "source_ids": ["S14"], "evidence_class": "ASSUMED"},
    {"input": "customDonor", "central": "dsr1", "low_margin": "dsr1", "high_margin": "dsr1", "source_ids": ["S4", "S14"], "evidence_class": "ASSUMED"},
    {"input": "precision", "central": "fp8", "low_margin": "fp8", "high_margin": "fp8", "source_ids": ["S14"], "evidence_class": "ASSUMED"},
    {"input": "priceIn", "central": 4, "low_margin": 4, "high_margin": 4, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "priceOut", "central": 20, "low_margin": 20, "high_margin": 20, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "cacheReadMult", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "blend", "central": {"h200": 10, "gb200": 35, "gb300": 20, "tpu7": 35}, "low_margin": {"h200": 10, "gb200": 35, "gb300": 20, "tpu7": 35}, "high_margin": {"h200": 10, "gb200": 35, "gb300": 20, "tpu7": 35}, "source_ids": ["S5", "S6", "S7", "S8"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg", "central": {"h200": 3.5, "gb200": 5, "gb300": 6, "tpu7": 2.7}, "low_margin": {"h200": 3.5, "gb200": 5, "gb300": 6, "tpu7": 2.7}, "high_margin": {"h200": 3.5, "gb200": 5, "gb300": 6, "tpu7": 2.7}, "source_ids": ["S9", "S10", "S11"], "evidence_class": "INFERENCE"},
    {"input": "util", "central": 65, "low_margin": 60, "high_margin": 70, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "io_ratio", "central": 30, "low_margin": 30, "high_margin": 30, "source_ids": ["S13"], "evidence_class": "ASSUMED"},
    {"input": "cache_hit", "central": 85, "low_margin": 85, "high_margin": 85, "source_ids": ["S13"], "evidence_class": "ASSUMED"},
    {"input": "billCacheHit", "central": 85, "low_margin": 85, "high_margin": 85, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteShare", "central": 50, "low_margin": 50, "high_margin": 50, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteMult", "central": 125, "low_margin": 125, "high_margin": 125, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": ["S14"], "evidence_class": "ASSUMED"},
    {"input": "stackMult", "central": 1.0, "low_margin": 1.0, "high_margin": 1.0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "trendMonths", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "balanced", "low_margin": "balanced", "high_margin": "balanced", "source_ids": ["S14"], "evidence_class": "ASSUMED"}
  ],
  "confidence": "low: the tariff and arithmetic are checkable, but model size, actual fleet, paid utilization and traffic distribution are unmeasured; the span is three scenarios, not a probability interval or an exhaustive bound."
}
```

## 3 — YOUR OWN READING.

My central reading is **78.5% at list**, with selected low/high scenarios of **67.9% and 84.0%**. This is unit direct-serving contribution margin under the declared workload, not company gross margin. Training, R&D, sales, G&A, free-tier serving, support and unbilled retries are outside the commission’s perimeter.

**Execution status.** I attempted the public MCP endpoint `https://margins-mcp.ashitaorbis.com/mcp`, including `tools/call` for `run_scenario` with `model: "custom"`, `perspective: "median"`, and exactly the `central.overrides` and `central.traffic` above. The transport failed with **`NameResolutionError`**; no HTTP calculator response or scenario result was received. This was a connection failure, not rejection of the inputs.

Consequently, the numbers reported here come from **an independent transcription of the public FP8/MLA equations**, not a successful MCP call or execution of an untouched calculator engine. The reconstruction reproduces the supplied reference’s current **82.3265%**, rounding to attachment 02’s **82.33%**, and the site’s published cost components. The publishing leg’s actual engine run remains the authoritative card result. S14–S15 supplied the public equations; S16 supplied a further cross-check.   

**Billing arithmetic.** Use a bundle of **30 million input tokens plus one million output tokens**. At 85% billed cache hits, input consists of 25.5M cached tokens and 4.5M fresh tokens. Half the fresh input is billed as five-minute cache writes. Thus, in dollars:

\[
B=20+2.25(4)+2.25(5)+25.5(0.20)=45.35.
\]

This uses the model-specific 5% cache-read tariff, not the general 10% convention. The cache-write uplift is list billing, not a discount or efficiency credit. S2 supplies the tariffs; the traffic and write shares are assumptions. 

**Cost arithmetic.** After the stated rents and paid utilization, the reconstruction gives $1.121690 per million fresh-input tokens and $3.278582 per million output tokens. Cached-input cost is assumed to be 5% of fresh-input cost, or $0.056085 per million. Therefore:

\[
C=3.278582+4.5(1.121690)+25.5(0.056085)=9.756341,
\]

\[
M=1-\frac{9.756341}{45.35}=78.4866\%.
\]

Equivalently, each million tokens of this **mixed** traffic earns $1.462903 and costs $0.314721. These mixed-token figures must not be confused with the separate input or output rates.

| Scenario | Active / total parameters | Paid utilization | Cost per 30M-in + 1M-out bundle | Billings | Margin |
|---|---:|---:|---:|---:|---:|
| Central | 200B / 2.5T | 65% | $9.7563 | $45.35 | **78.4866%** |
| Low margin | 300B / 3.0T | 60% | $14.5485 | $45.35 | **67.9196%** |
| High margin | 150B / 2.0T | 70% | $7.2661 | $45.35 | **83.9777%** |

The central per-leg costs below are **modeled**, not measured. Each cost already includes the all-in hourly rate and utilization divisor.

| Leg | Token share | Fresh input, $/M | Output, $/M | Modeled decode tokens/s/accelerator before paid-idle adjustment |
|---|---:|---:|---:|---:|
| H200 | 10% | 2.0408 | 3.1360 | 476.95 |
| GB200 | 35% | 1.1545 | 2.2265 | 959.69 |
| GB300 | 20% | 1.3854 | 5.2075 | 492.38 |
| TPU7 | 35% | 0.6756 | 3.2691 | 352.95 |

**Capacity qualification.** All central and high-scenario legs fit their declared operating batches in this reconstruction. In the low scenario, GB200 reaches the legal 72-GPU width and caps the batch at **125 instead of 128**. Its full 35% token weight remains in the calculation; I did not delete or renormalize that leg. The low endpoint therefore carries a capacity warning, not a claim of unchanged service quality. The public code permits finite capped-batch results and distinguishes them from infeasible results; the engine rerun should preserve that distinction. 

**Unit audit.** All three margins are positive. Parameter inputs are billions; cost conversion uses one million tokens and 3,600 seconds/hour; utilization 65 means 65%, not 0.65%. The H200 quote is divided by eight GPUs and the GB200 slice quote by four GPUs—not by two Superchips. Hourly figures already include the serving burden specified below. There is no second power/hosting charge, no extra division of per-chip throughput by node width, and no positive-margin adjustment to the selected inputs.

## 4 — WHY THESE INPUTS.

**Active and total parameters: 200B/2.5T centrally. Sources S4 and S14; ASSUMED.** Total size retains the reference’s 2.5T planning prior, openly rather than presenting a new measurement. An 8% active fraction gives 200B. The open MoE analogy shows that relatively low activation fractions are feasible, but it does not identify Opus’s fraction. Choosing 8%, rather than the reference’s 12%, is my judgment—not a deduction from the lower tariff, benchmark speed, or customer task-cost claim.

The low scenario pairs a larger 300B-active/3T model with 60% utilization, representing a more demanding deployment with some rollout fragmentation. The high scenario pairs 150B-active/2T with 70% utilization, representing a more compact, better-loaded deployment. Rents, tariff, traffic, precision and efficiency credit are not simultaneously pushed to favorable or unfavorable extremes.

**Fleet: H200 10%, GB200 35%, GB300 20%, TPU7 35%. Sources S5–S8; ASSUMED.** This favors large-memory hardware for a new large-model deployment. The shares are percentages of served tokens, not shares of purchased chips. Public partnerships support the hardware families, not these generation weights. H100’s absence is a deployment prior, not an assertion that Anthropic owns or uses no H100s.

Trainium’s absence deserves a stronger warning. Anthropic’s use of Trainium is disclosed, but an Opus 5.5 allocation is not. The calculator itself records a serious unresolved batch-unit ambiguity and withdraws those legs from its preferred default. I therefore use an explicitly **Trainium-free economic surrogate**, not a claim that the actual model’s Trainium share is zero. A substantial real Trainium allocation could move the population margin outside this span. This representativeness limitation cannot be solved by assigning an unsupported coefficient a small weight. 

**All-in hourly costs: $3.50 H200, $5 GB200, $6 GB300, $2.70 TPU7. Sources S9–S11; INFERENCE with assumed discounts and allowances.** My construction, in dollars per accelerator-hour, is:

| Leg | Construction | What is judgment |
|---|---|---|
| H200 | \((50.44/8)\times0.50+0.3475=3.50\) | 50% procurement factor and shared-service allowance |
| GB200 | \((42/4)\times0.45+0.275=5.00\) | 45% procurement factor and shared-service allowance |
| GB300 | \(5.00\times1.20=6.00\) | 20% rental/acquisition premium over the GB200 equivalent |
| TPU7 | \(0.75(1.60)+0.25(5.40)+0.15=2.70\) | Weight placed on strategic versus public committed economics, plus shared-service allowance |

The quoted rental anchors include the infrastructure bundled with those instances. Added allowances represent shared serving/control-plane expense outside the allocated instance, **not another charge for its power or hosting**. The resulting `rentAbsLeg` values are the complete all-in equivalents used in the model; no further power, facility or network multiplier is added.

Neither the discounts nor the allowances are published Anthropic contract terms. These procurement factors affect cost, not the customer-billing `discount` input, which stays zero. No owned fleet is asserted and no depreciation-only cost is substituted for an all-in rental equivalent. S9–S11 establish anchors, not the final numbers. 

**Utilization: 65%, with 60% and 70% in the selected alternatives. ASSUMED; no production measurement.** This is paid-capacity utilization: it prices idle reserved capacity. It is not accelerator FLOP utilization and must not be equated with a reported training utilization figure. A production occupancy series would matter more than another chip-count announcement.

**Traffic: 30:1 input:output, 85% served and billed cache hits. Source S13 motivates the shape; values are ASSUMED.** One internally consistent illustrative mix is 10% of output tokens from very long reusable-prefix sessions at 200:1 and 95% cache hits, with the remaining 90% from shorter interactive requests at approximately 11.11:1 and 65% hits. This yields:

\[
R=0.1(200)+0.9(100/9)=30,
\]

\[
H=\frac{0.1(200)(0.95)+0.9(100/9)(0.65)}{30}=85\%.
\]

The shorter cohort can also include coding. In this construction, the long cohort accounts for two-thirds of input tokens despite only one-tenth of output. **Every cohort weight and rate here is a working assumption**, not an AgentX or Anthropic statistic. The trace motivates a long-context tail; it cannot determine this population mix.

**Cache creation and read cost: 50% of fresh input written at 125% of base price; cache reads cost 5% of fresh prefill.** The 125% tariff is disclosed in S2. The write share, five-minute-TTL choice, equality of physical and billed hits, and 5% serving-cost fraction are unmeasured judgments. Setting write share to zero would reduce this central margin to **77.36%**. Raising cache-read serving cost from 5% to 15% of fresh prefill would reduce it to **72.18%**. Cheap cached billing is not costless traffic.

**Precision and geometry: FP8 and `dsr1`. Sources S4 and S14; ASSUMED.** I retain compressed-KV MoE geometry as a declared approximation. There is no public basis strong enough to claim that Qwen-class GQA is a better match. FP8 is a working serving-path convention, not verified Anthropic quantization.

**Efficiency and latency: `stackMult=1`, `trendMonths=0`, `interact="balanced"`. ASSUMED neutral choices.** I credit no residual private-stack advantage beyond the calculator’s published-open-practice baseline. I omit `specDec`; there is no separate speculative-decoding credit. This does not assert that Anthropic lacks optimized software. It avoids converting a customer-cost or capability result into an unmeasured serving-efficiency multiplier. “Balanced” is a coarse operating posture, not a demonstrated match to the observed client-stream speed.

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The historical reference states **83.1% at list, span 68–92%**. Attachment 02 says the current engine gives **82.33%** on that vector; my reconstruction gives **82.3265%**. I compare current arithmetic with current arithmetic, while preserving 83.1% as the earlier author’s stated reading. The reference’s full text also treats the broad span as judgment rather than an exact engine corner range. 

The following is an **order-dependent sequential waterfall**, not a set of independent additive sensitivities. Each row changes only the named inputs from the preceding row.

| Change from the reference vector | Margin-point change | Resulting margin |
|---|---:|---:|
| Reference: 300B/2.5T, reference fleet/rents, 15:1 and 60% cache | — | 82.33% |
| Remove the two-month private-efficiency lead | −3.55 | 78.78% |
| List prices $5/$25 → $4/$20 | −5.31 | 73.47% |
| Cache-read tariff 10% → 5% of input | −1.04 | 72.43% |
| Active parameters 300B → assumed 200B | +7.67 | 80.10% |
| Fleet to H200 10 / GB200 35 / GB300 20 / TPU7 35 | +0.29 | 80.39% |
| Replace rents with my all-in equivalents | −1.24 | 79.15% |
| Cache writes 0 → 50% of fresh input | +1.28 | **80.43%** |
| Traffic to 30:1, with both cache-hit measures at 85% | −1.95 | **78.49%** |

The rent changes are H200 $3.496→$3.50, GB200 $4.275→$5, GB300 $5.70→$6, and TPU7 unchanged at $2.70. The H100 leg disappears with the fleet change. Central total size remains 2.5T; FP8, 65% paid utilization, `stackMult=1`, balanced posture, 5% cache serving cost, list basis and `dsr1` geometry are unchanged. Their direct differences are zero.

**Like-for-like Reference traffic result: 80.43%.** This uses my central inputs with **15:1 input:output, 60% physical cache hits and 60% billed cache hits**. It is about **1.89 points below** the current reference computation, or **2.67 points below** the historical stated 83.1%. It is comparison context, not my headline.

**Important runner distinction:** changing only `traffic` to 15:1/60 while retaining the central override `billCacheHit:85` produces approximately **70.78%** in the reconstruction. That mixes 60% serving reuse with 85% discounted billing and is not the intended like-for-like workload. The publishing receipt should state whether it resets both cache fields. I have reported both interpretations rather than silently choosing one.

The lower tariff and removal of an unmeasured private lead pull the estimate down. The assumed reduction in active computation offsets much of that. This explains why the headline is below the reference without assuming that the new model is proportionally more expensive to serve.

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

The most decisive evidence would be a **matched production cost-and-throughput disclosure for `claude-opus-5-5`**: billed token categories, context distribution, effort and safeguards, accelerator types and hours, actual hourly cost, paid idle capacity, and latency target. That would supersede the size/roofline proxy rather than merely refine it.

Absent that, **active computational size is the strongest scalar falsifier**. Holding other central inputs fixed, 300B rather than 200B active gives approximately **70.88%**; 400B gives **63.27%**. A genuinely smaller 100B-active model gives **86.09%**. These are local sensitivities, not claims that any of those sizes is known.

Other informative tests, also holding the remaining central inputs fixed:

| Measurement or correction | Modeled result | Direction |
|---|---:|---|
| All-in procurement 25% more expensive | 73.11% | Lower margin |
| All-in procurement 25% cheaper | 83.86% | Higher margin |
| Paid utilization 55%, not 65% | 74.58% | Lower margin |
| Paid utilization 75%, not 65% | 81.36% | Higher margin |
| Cache reads cost 15%, not 5%, of fresh prefill | 72.18% | Lower margin |
| Demonstrated residual throughput efficiency of 1.2×, counted once | 82.07% | Higher margin |

A measured large Trainium allocation with a resolved per-chip throughput basis could move the estimate substantially in either direction. A matched latency requirement that forces materially smaller batches would move it downward. Evidence of effective KV compression beyond the chosen donor would tend to move long-context cost downward; larger live KV or less reusable state would tend to move it upward.

The three selected endpoints do **not** bound all these possibilities. In particular, context-only diagnostics described next fall below the quoted span. That is why confidence is low even though the arithmetic is reproducible.

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Context cannot be independently authored through this call.** For the custom traffic completion used here, the public code fixes output length at 1,000, obtains input length as `io_ratio × 1000`, uses input plus 500 as representative decode context, and reserves terminal KV at input plus 1,000. Thus this vector means **30,000 input / 30,500 representative decode / 31,000 terminal KV tokens**. That is an engine convention, not measured Opus traffic. Source S15, inspected 2026-09-25. 

The illustrative two-cohort workload is therefore reduced to one representative context. Because attention work, memory capacity and batching are nonlinear, pricing a mean context need not equal pricing the actual mixture. Nor does a uniform 1M-context tariff imply uniform cost across the context window.

To expose this limitation, I independently varied context while holding the central billing ratio and cache shares fixed. At 60,000 input tokens the reconstruction gives **73.22%**; at 142,000 it gives **57.81%**. These are **local diagnostic experiments outside the submitted input contract**, not purported `run_scenario` outputs. They show how a context mismatch can dominate the selected scenario span.

**A donor choice exists; actual architecture still cannot be represented.** `dsr1` supplies a frozen 61-layer MLA geometry, not Anthropic’s undisclosed architecture. Changing the local reconstruction to `qwen3c` while keeping the other central assumptions gives approximately **70.99%**. Neither donor has been established as correct. Layer-specific attention, hybrid compression, expert placement and their correlations with total size are not authored by the block. Source S14, inspected 2026-09-25. 

**Calibration and deployment remain material limitations.** GB200’s FP8 calculation carries a coefficient derived on an FP4 basis; GB300’s coefficient and operating batch are assumed. Consequently, the GB300 output cost exceeding GB200’s in my table is partly a calculator operating-point assumption, not a measured hardware ranking. TPU’s coefficient is an end-to-end timing proxy inserted into decode while prefill is charged separately. I did not disguise corrections to these limitations as cheaper rent or an arbitrary private-stack multiplier. Sources S14–S15, inspected 2026-09-25.  

The contract also lacks a measured latency constraint, independent per-leg precision/stack choices, fallback-model traffic and cost, and a joint distribution of context, routing, concurrency and utilization. The low scenario’s capped GB200 batch is disclosed in section 3; its finite margin does not prove the same service quality. The Trainium-free fleet is a declared surrogate rather than a verified model allocation.

**What remains unestablished:** actual active and total parameters; production precision and attention/KV design; exact model-to-site mapping; hardware-generation token shares, including Trainium; actual all-in contract costs and ownership mix; paid utilization; latency-matched accelerator throughput; real traffic and context distributions; equality of billed and physical cache hits; cache-write and TTL mix; fallback-routing frequency and cost; and a measured residual advantage over contemporaneous open serving practice. No provider-disclosed Opus 5.5 serving margin or model-level revenue was established.

The system-card link did not open despite repeated attempts; no claim here is represented as a finding from that unread PDF. Accessible launch and model documentation were used instead. Attachment 06 supplied leads, not verified inputs: its earlier model-authored company-margin figures were not adopted as evidence for this estimate.

**Bottom line:** **78.5% is my conditional list-price serving-margin estimate on the declared vector.** The strongest verified correction is the **5% cache-read tariff**. The strongest unresolved economic assumption is active computational size, with context distribution and actual procurement close behind. The **68–84% span is three authored scenarios—not a measured provider margin, probability interval, or guarantee that other plausible workloads lie inside it.**

**Copy-of-record limitation:** I attempted to write the complete Markdown report to `/mnt/data/pro_broker_20260925t060752z_19c6fb_serving_margi_2026-09-25.md`, but the filesystem tools failed and I could not verify a saved file. I therefore cannot honestly supply a download link. The full report is included above; the separate-file delivery requirement remains unfulfilled.