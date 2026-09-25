## 0 — THE CARD, IN TWO LINES.

≈84% at list (span 74–89%)  
The deciding assumption is 100B active parameters, putting modeled serving cost near $0.23 per million mixed tokens.

## 1 — PUBLIC FACTS.

**GPT-6 Astra Pro — September 25, 2026.** Request `pr-20260925T063700Z-19b839#1`. This is an estimate of unit direct-serving contribution margin, not Anthropic's accounting gross margin or a verified provider margin. Dates below are publication dates where available; undated documentation and live price tables are explicitly dated by access. The six supplied attachments were readable; the two uploaded files were opened, not treated as links.

1. **DISCLOSED — Identity and release.** The priced API ID is **`claude-sonnet-5`**, released **June 30, 2026**. It is a pinned model snapshot, not an evergreen alias; there is no reason to invent a date-suffixed ID. Sources: **S1**, https://www.anthropic.com/news/claude-sonnet-5, published 2026-06-30; **S4**, https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions, accessed 2026-09-25. 

2. **DISCLOSED — Served variant.** Sonnet 5 supports a 1M-token context and adaptive thinking; the API's default effort is `high`. I price that high-effort setting on the standard global first-party API, not a separate premium fast service or a region-restricted tariff. Sources: **S3**, https://platform.claude.com/docs/en/models/sonnet-5/overview; **S5**, https://platform.claude.com/docs/en/models/sonnet-5/whats-new-sonnet-5; both accessed 2026-09-25. Different effort settings are not evidence of different disclosed parameter counts. 

3. **DISCLOSED — Current list and cache prices.** The verified USD prices per million tokens are **$2 fresh input, $0.20 cache read, $10 output, $2.50 five-minute cache write, and $4 one-hour cache write**. Source **S2**: https://platform.claude.com/docs/en/about-claude/pricing, accessed 2026-09-25. The launch article's **August 10, 2026 update** makes $2/$10 permanent and cancels the previously scheduled September 1 increase to $3/$15. The project's current-price statement is correct; attachment 06's earlier promotional-price description is superseded. 

4. **UNKNOWN — Sonnet-specific architecture.** I could not establish active parameters, total parameters, expert routing, KV geometry, serving precision, or effort-dependent activation from the public Sonnet materials reviewed. Sources checked: **S3/S5**, the URLs above, accessed 2026-09-25. Neither the old selector's sizes nor a model-generated statement about Anthropic is a measurement. The numerical architecture below is an assumption. 

5. **DISCLOSED — Open-model scale proxies, not Sonnet measurements.** DeepSeek-V3 discloses **671B total / 37B active** and MLA; Qwen3-Coder discloses **480B total / 35B active**. Sources: **S12**, https://github.com/deepseek-ai/DeepSeek-V3, accessed 2026-09-25; **S13**, https://qwenlm.github.io/blog/qwen3-coder/, published 2025-07-22. These establish plausible sparse-model scales, not Sonnet's architecture. 

6. **DISCLOSED — Hardware families and deployment evidence.** Anthropic reported using over one million Trainium2 chips to train and serve Claude. Its Google announcement describes TPU expansion and a strategy using TPUs, Trainium and NVIDIA GPUs. These are company-wide statements, not Sonnet 5's inference allocation; planned capacity is not proof that a particular model currently occupies it. Sources: **S6**, https://www.anthropic.com/news/anthropic-amazon-compute, 2026-04-20, updated 2026-04-21; **S7**, https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services, 2025-10-23. I could not establish Sonnet-specific sites or geographic token shares. 

7. **DISCLOSED — Public TPU price anchor.** Google's Iowa Ironwood prices are **$12 on demand, $8.40 with a one-year commitment, and $5.40 with a three-year commitment, per chip-hour**. Source **S8**: https://cloud.google.com/tpu/pricing, accessed 2026-09-25. These are retail contractual options, not Anthropic's price. 

8. **COMMUNITY ESTIMATE — Strategic TPU procurement.** SemiAnalysis estimates **$1.60 per rented TPU-hour** for Anthropic, including Google's margin. It is an analyst estimate, not a disclosed invoice, and its performance discussion is not a measurement of Sonnet inference occupancy. Source **S9**: https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the, 2025-11-28. 

9. **DISCLOSED — Public NVIDIA price anchors.** CoreWeave lists North American eight-GPU H100 and H200 nodes at **$49.24/hour and $50.44/hour**, respectively, and a four-GPU GB200 slice at **$42/hour**. Its GB300 NVL72 price requires contacting sales. Source **S10**: https://www.coreweave.com/pricing, accessed 2026-09-25. Node prices must not be mistaken for per-GPU prices. 

10. **COMMUNITY ESTIMATE — User-facing performance.** The retrieved Artificial Analysis high-effort page reports **66.5 output tokens/second** and **9.80 seconds to first answer token**, with its default 10,000-input-token workload. Source **S11**: https://artificialanalysis.ai/models/claude-sonnet-5-high/providers, accessed 2026-09-25. This is a changing benchmark snapshot, not aggregate tokens per accelerator-second; I do not divide chip rent by that streaming speed. 

11. **UNKNOWN — Paid-capacity utilization and model-specific margin.** I found no representative Sonnet 5 occupancy telemetry, all-in invoice, or disclosed direct-serving margin. Sources checked include **S6/S9**, dated above. Demand pressure, chip counts, and an analyst's FLOP-utilization assumption do not identify the paid-capacity utilization divisor used here. 

12. **DISCLOSED — Revenue, with the wrong perimeter for this estimate.** Anthropic's April 20 announcement said its revenue run rate had exceeded **$30 billion**. This is a historical company disclosure, not a current September revenue estimate and not evidence of Sonnet's serving margin. Source **S6**, https://www.anthropic.com/news/anthropic-amazon-compute, 2026-04-20. 

13. **DISCLOSED — Calculator implementation, not provider economics.** The public implementation supplies billing mechanics, roofline equations, donor geometry and operating-point calibrations. Sources, all accessed 2026-09-25: **S14**, https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js; **S15**, https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js; **S16**, https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js. The supplied live contract is the authority for permitted inputs. Its Trainium calibration warnings materially limit the fleet representation below.  

## 2 — CALCULATOR INPUTS.

The architecture, fleet allocation and utilization entries are authored judgments. A source ID attached to an `ASSUMED` input supplies context, not a measurement of that input. `cacheWriteShare: 20` uses the executable implementation's **share of fresh input** convention; at 75% cache hits it represents 5% of all input.

```json
{
  "model_id": "custom",
  "model_name": "Claude Sonnet 5",
  "api_model_priced": "claude-sonnet-5; pinned release 2026-06-30; standard global Claude API; adaptive thinking, high effort",
  "customDonor": "dsr1",
  "basis": "list",
  "context_length_assumed": "Standard 1M-capable model, not a separate short-context tier. Representative 12000 input and 1000 total generated tokens; decode context 12500, peak 13000.",
  "central": {
    "overrides": {
      "customDonor": "dsr1", "active": 100, "total": 1000, "precision": "fp8",
      "priceIn": 2, "priceOut": 10, "cacheReadMult": 10, "billCacheHit": 75,
      "cacheCost": 5, "cacheWriteShare": 20, "cacheWriteMult": 125,
      "batchShare": 0, "discount": 0,
      "blend": {"h100": 5, "h200": 15, "gb200": 25, "gb300": 5, "tpu7": 50},
      "rentAbsLeg": {"h100": 2.5, "h200": 3.8, "gb200": 5.0, "gb300": 6.5, "tpu7": 2.7},
      "util": 70, "stackMult": 1.0, "trendMonths": 0,
      "interact": "balanced", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 12, "cache_hit": 75}
  },
  "low_margin": {
    "overrides": {
      "customDonor": "dsr1", "active": 160, "total": 1400, "precision": "fp8",
      "priceIn": 2, "priceOut": 10, "cacheReadMult": 10, "billCacheHit": 75,
      "cacheCost": 5, "cacheWriteShare": 20, "cacheWriteMult": 125,
      "batchShare": 0, "discount": 0,
      "blend": {"h100": 5, "h200": 15, "gb200": 25, "gb300": 5, "tpu7": 50},
      "rentAbsLeg": {"h100": 2.5, "h200": 3.8, "gb200": 5.0, "gb300": 6.5, "tpu7": 2.7},
      "util": 65, "stackMult": 1.0, "trendMonths": 0,
      "interact": "balanced", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 12, "cache_hit": 75}
  },
  "high_margin": {
    "overrides": {
      "customDonor": "dsr1", "active": 70, "total": 1000, "precision": "fp8",
      "priceIn": 2, "priceOut": 10, "cacheReadMult": 10, "billCacheHit": 75,
      "cacheCost": 5, "cacheWriteShare": 20, "cacheWriteMult": 125,
      "batchShare": 0, "discount": 0,
      "blend": {"h100": 5, "h200": 15, "gb200": 25, "gb300": 5, "tpu7": 50},
      "rentAbsLeg": {"h100": 2.5, "h200": 3.8, "gb200": 5.0, "gb300": 6.5, "tpu7": 2.7},
      "util": 75, "stackMult": 1.1, "trendMonths": 0,
      "interact": "balanced", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 12, "cache_hit": 75}
  },
  "stated": {"headline_pct": 83.5232, "low_pct": 73.9941, "high_pct": 88.7614},
  "sources": [
    {"id": "S1", "claim": "Release June 30; August 10 update makes $2/$10 permanent.", "url": "https://www.anthropic.com/news/claude-sonnet-5", "date": "2026-06-30", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "Current list and cache tariffs; undated page, date is access date.", "url": "https://platform.claude.com/docs/en/about-claude/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "API ID, release date, default high effort and availability; accessed.", "url": "https://platform.claude.com/docs/en/models/sonnet-5/overview", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "Dateless IDs are pinned model snapshots; accessed.", "url": "https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S5", "claim": "1M-context model, adaptive thinking and changed tokenizer; accessed.", "url": "https://platform.claude.com/docs/en/models/sonnet-5/whats-new-sonnet-5", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S6", "claim": "Anthropic reports over 1M Trainium2 chips for training and serving, and historical revenue run rate.", "url": "https://www.anthropic.com/news/anthropic-amazon-compute", "date": "2026-04-20", "evidence_class": "DISCLOSED"},
    {"id": "S7", "claim": "TPU expansion commitment and three-family hardware strategy, not Sonnet-specific allocations.", "url": "https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services", "date": "2025-10-23", "evidence_class": "DISCLOSED"},
    {"id": "S8", "claim": "Iowa Ironwood public prices per chip-hour; accessed.", "url": "https://cloud.google.com/tpu/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S9", "claim": "SemiAnalysis estimates rented Anthropic TPU cost at $1.60/chip-hour; not a disclosed contract.", "url": "https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the", "date": "2025-11-28", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S10", "claim": "Public NVIDIA node and slice prices, not Anthropic procurement; accessed.", "url": "https://www.coreweave.com/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S11", "claim": "Retrieved high-effort benchmark: 66.5 output tokens/s, 9.80 seconds to first answer, 10k input; accessed.", "url": "https://artificialanalysis.ai/models/claude-sonnet-5-high/providers", "date": "2026-09-25", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S12", "claim": "DeepSeek-V3: 671B total, 37B active, MLA; scale proxy only; accessed.", "url": "https://github.com/deepseek-ai/DeepSeek-V3", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S13", "claim": "Qwen3-Coder: 480B total, 35B active; scale proxy only.", "url": "https://qwenlm.github.io/blog/qwen3-coder/", "date": "2025-07-22", "evidence_class": "DISCLOSED"},
    {"id": "S14", "claim": "Calculator billing and cost implementation; disclosure by calculator publisher, not Anthropic; accessed.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S15", "claim": "Calculator roofline and fixed-output-length context mapping; accessed.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S16", "claim": "Calculator geometry, operating points and calibration constants; accessed.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"}
  ],
  "key_inputs": [
    {"input": "active", "central": 100, "low_margin": 160, "high_margin": 70, "source_ids": ["S12", "S13"], "evidence_class": "ASSUMED"},
    {"input": "total", "central": 1000, "low_margin": 1400, "high_margin": 1000, "source_ids": ["S12", "S13"], "evidence_class": "ASSUMED"},
    {"input": "customDonor", "central": "dsr1", "low_margin": "dsr1", "high_margin": "dsr1", "source_ids": ["S12", "S16"], "evidence_class": "ASSUMED"},
    {"input": "precision", "central": "fp8", "low_margin": "fp8", "high_margin": "fp8", "source_ids": ["S12", "S16"], "evidence_class": "ASSUMED"},
    {"input": "priceIn", "central": 2, "low_margin": 2, "high_margin": 2, "source_ids": ["S1", "S2"], "evidence_class": "DISCLOSED"},
    {"input": "priceOut", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S1", "S2"], "evidence_class": "DISCLOSED"},
    {"input": "cacheReadMult", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "blend", "central": {"h100": 5, "h200": 15, "gb200": 25, "gb300": 5, "tpu7": 50}, "low_margin": {"h100": 5, "h200": 15, "gb200": 25, "gb300": 5, "tpu7": 50}, "high_margin": {"h100": 5, "h200": 15, "gb200": 25, "gb300": 5, "tpu7": 50}, "source_ids": ["S6", "S7"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg", "central": {"h100": 2.5, "h200": 3.8, "gb200": 5.0, "gb300": 6.5, "tpu7": 2.7}, "low_margin": {"h100": 2.5, "h200": 3.8, "gb200": 5.0, "gb300": 6.5, "tpu7": 2.7}, "high_margin": {"h100": 2.5, "h200": 3.8, "gb200": 5.0, "gb300": 6.5, "tpu7": 2.7}, "source_ids": ["S8", "S9", "S10"], "evidence_class": "INFERENCE"},
    {"input": "util", "central": 70, "low_margin": 65, "high_margin": 75, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "stackMult", "central": 1.0, "low_margin": 1.0, "high_margin": 1.1, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "trendMonths", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "balanced", "low_margin": "balanced", "high_margin": "balanced", "source_ids": ["S11"], "evidence_class": "ASSUMED"},
    {"input": "billCacheHit", "central": 75, "low_margin": 75, "high_margin": 75, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteShare", "central": 20, "low_margin": 20, "high_margin": 20, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteMult", "central": 125, "low_margin": 125, "high_margin": 125, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "traffic.io_ratio", "central": 12, "low_margin": 12, "high_margin": 12, "source_ids": ["S1", "S11"], "evidence_class": "ASSUMED"},
    {"input": "traffic.cache_hit", "central": 75, "low_margin": 75, "high_margin": 75, "source_ids": [], "evidence_class": "ASSUMED"}
  ],
  "confidence": "low — identity and tariff are verified, but architecture, fleet allocation, all-in procurement, occupancy and workload are unmeasured; the span is three judgment scenarios, not a confidence interval."
}
```

## 3 — YOUR OWN READING.

My central reading is **83.5% at list**, with selected scenarios of **74.0% and 88.8%**—rounded to **84%, span 74–89%**, on the card. These are three coherent judgment scenarios, not a probability interval or an envelope over every unknown.

**Calculation status matters.** I did not obtain a successful live `run_scenario` response. The public MCP access attempt failed, including a DNS-resolution failure from the execution environment. The intended call is `run_scenario(model="custom", perspective="median", overrides=central.overrides, traffic=central.traffic)`, repeated for the other two blocks. No returned MCP margin is being claimed.

Instead, I reconstructed the relevant public-code arithmetic. As a cross-check, it returns **82.3265%** for the supplied Opus reference vector, matching the contract's **82.33%** after rounding. That checks implementation consistency at the reference, not the correctness of the economic assumptions or every branch of the live engine. The publishing leg's rerun remains authoritative for the card. The historical reference itself states 83.1% with a judgment span of 68–92%. 

The commissioned cost scope includes accelerator time, paid-capacity slack through utilization, and all-in power, hosting and network infrastructure. It excludes training, R&D, sales, G&A, free-tier serving, support and unbilled retries. It is not company gross margin.

For each accelerator and phase, I calculate:

\[
c_j\;(\$/\mathrm{Mtok})=
\frac{r_j}{3{,}600\,q_j}\frac{10^6}{u},
\]

where \(r_j\) is all-in dollars per accelerator-hour, \(q_j\) is modeled tokens per second per accelerator, and \(u\) is paid-capacity utilization as a fraction. I blend **costs by served-token shares**, not GPU counts or an arithmetic average of throughputs. The public roofline supplies the phase throughput estimates. 

The central reconstruction produces **$0.497608/M fresh input**, **$0.024880/M cached input**, and **$1.265551/M output**. Consider one million output tokens accompanied by twelve million input tokens. Of those inputs, nine million are cache reads, 2.4 million are ordinary fresh input, and 0.6 million are five-minute cache writes.

\[
\text{Billings}=9(0.20)+2.4(2)+0.6(2.50)+1(10)=\$18.10.
\]

\[
\text{Serving cost}=3(0.497608)+9(0.024880)+1.265551
=\$2.982300.
\]

\[
\text{Margin}=1-\frac{2.982300}{18.10}=83.5232\%.
\]

That is **$1.392308 billings and $0.229408 direct serving cost per million mixed tokens**, counting all thirteen million input-plus-output tokens. Cache-write tokens incur the modeled fresh-prefill cost; the write premium changes billings, not a separate throughput credit.

| Scenario | Fresh-input cost, $/M | Output cost, $/M | Cost per million mixed tokens | Serving margin |
|---|---:|---:|---:|---:|
| Central | 0.497608 | 1.265551 | 0.229408 | 83.5232% |
| Low margin | 0.815499 | 1.893602 | 0.362083 | 73.9941% |
| High margin | 0.312062 | 0.957577 | 0.156476 | 88.7614% |

All three have the same $1.392308/M mixed-token billings. The extra digits allow arithmetic comparison; they do not imply measurement precision.

**Unit sanity check:** sizes are billions; rents are per accelerator, not per node; utilization 70 means 70%, not 0.70%; token prices are per million; cache-read multiplier 10 means 10%, not tenfold. Power and hosting are not added again. All three margins are positive without applying a floor or adjusting inputs to meet the owner's constraint.

The cancelled $3/$15 tariff would produce **89.02%** on these central costs and proportional cache tariffs—about **5.49 percentage points higher**. It is a counterfactual, not the tariff used here.

## 4 — WHY THESE INPUTS.

**Architecture: 100B active / 1,000B total; ASSUMED.** S12/S13 provide scale context only. The active prior is about 2.7 times DeepSeek-V3's disclosed active count, while total weights are about 1.5 times its total. This is a deliberately judgmental allowance for a larger proprietary workhorse, not an inference that benchmark scores require those counts. I do not use price to backsolve model size, or treat the old Sonnet row's 120B active estimate as a Sonnet 5 measurement.

The low scenario represents a heavier **160B/1,400B** model with somewhat worse fleet occupancy, **65%**. The high scenario represents **70B active**, still **1,000B total**, with **75%** occupancy and a modest stack advantage. Total weights, rents, precision, fleet shares and traffic are not all simultaneously pushed to favorable extremes. Actual architecture disclosure would replace these priors, not merely narrow their error bars.

**Precision and donor: FP8 and `dsr1`; ASSUMED.** I choose a common FP8 representation rather than assume universal four-bit serving across a mixed fleet. The MLA donor maintains a transparent compressed-KV approximation and comparability with the reference. It does **not** mean Anthropic disclosed MLA or 61 layers. I found no evidence strong enough to prefer a Qwen- or Llama-class GQA donor. A larger real KV footprint would generally move cost upward; a demonstrated lower-precision deployment could move it downward. The available donor geometries and precision conventions come from S15/S16. 

**Fleet: 5% H100, 15% H200, 25% GB200, 5% GB300, 50% TPU7; ASSUMED.** These are token shares in a **priced proxy fleet**, not an inventory claim. S6/S7 establish heterogeneous deployment but do not identify these percentages. I allow substantial ASIC exposure, retain older NVIDIA capacity, and do not presume that the newest GPU generation serves most inexpensive Sonnet traffic.

There is a serious qualification: **Anthropic uses Trainium, but I exclude the contract's Trainium legs from the numerical blend because of their throughput-unit ambiguity.** The contract identifies a replica-global versus per-chip interpretation problem for Trainium2, with a roughly 15.2-fold throughput consequence; Trainium3 lacks an independent matched foundation. Putting a large share on either could create false precision. The TPU leg is a proxy for ASIC-heavy economics, not a demonstrated Trainium-to-TPU cost equivalence. This weakens confidence in the whole-fleet estimate. 

**Hourly costs: rental-equivalent, all-in; INFERENCE from S8–S10.** My selected rents are not the page's planning rents and not Anthropic invoices:

| Accelerator | Selected all-in $/accelerator-hour | Basis and what would change it |
|---|---:|---|
| H100 | 2.50 | Near the public spot-node equivalent, $19.71/8 = $2.464; a firm high-SLA contract could cost more. |
| H200 | 3.80 | Between the public spot equivalent, $20.93/8 = $2.616, and on-demand $50.44/8 = $6.305. |
| GB200 | 5.00 | Large-commitment procurement judgment below the public $42/4 = $10.50 rate. |
| GB300 | 6.50 | Weakest NVIDIA rent assumption; no matched public GB300 quote was available. It is not an HGX B300 quote relabeled. |
| TPU7 | 2.70 | Half the public three-year $5.40 rate, but above SemiAnalysis's $1.60 strategic estimate. |

These anchors do not prove equivalent contracts or service guarantees. The selected values include accelerator, power, host and network burden; I add **no separate 10% overhead, power charge, hosting charge or second procurement discount**. Public rental anchors and the analyst estimate are S8–S10. 

The model-specific owned-versus-rented split is unknown. I therefore use rental-equivalent economic costs, not an electricity-only cost for any supposedly owned tranche. An owned calculation would require annualized capital plus annual operating infrastructure cost, divided by 8,760 paid hours, before the separate utilization divisor. I could not establish the Sonnet-specific capital schedule needed to claim such a conversion as observed.

**Traffic: 12:1 and 75% cache hits; ASSUMED.** I expect a mid-tier agentic model to receive repeated system prompts, tool descriptions and growing task context, with fewer generated tokens than input tokens. That motivates a prefix-heavy mix; it does not measure one. S1's product positioning and S11's 10k-input benchmark provide context, not population telemetry. I assume 12,000 input and 1,000 total generated tokens per representative call; the latter includes thinking as well as visible output. 

Serving cache hits and billed cache hits are both explicitly 75%. Cache writes occupy 20% of fresh input, hence 5% of all input: fifteen cached-read tokens per cache-write token in aggregate. That is a working reuse assumption. Five-minute writes use the disclosed 125% tariff; the assumed write mix contains no one-hour writes. `cacheCost: 5` is an unmeasured cost assumption, not the 10% billing multiplier.

**Utilization and latency: 70%, balanced; ASSUMED.** High-volume traffic can support batching, but a responsive API still needs reserve capacity. Neither the precise occupancy nor this operating posture is publicly measured. User-stream speed does not reveal batching, replica count or paid idle time. Utilization is applied once to the already all-in hourly cost.

**Private-stack efficiency: central 1.0×, high 1.1×; ASSUMED.** The central and low cases give no residual advantage beyond the calculator's published-open-practice baseline. The high case credits 10% throughput improvement. `trendMonths` is zero everywhere, and there is no separate speculative-decoding credit. Evidence of faster software would need a matched baseline before justifying another improvement; it cannot be counted once as stack quality and again as algorithmic lead.

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The supplied reference uses $5/$25, FP8, a 15:1 workload, balanced latency, zero batch/discount, and the declared 5/10/25/20/40 fleet. Its utilization midpoint is 65% and its residual lead is two months. The reference's central procurement gives rents of $2.28, $3.496, $4.275, $5.70 and $2.70 on the five active legs. Its input vector, rather than its headline, is the comparison basis.   

Here is a **sequential, path-dependent bridge** from its current reconstructed 82.3265% to my central reading. These are not independent one-at-a-time sensitivities that can be added in an arbitrary order.

| Change, in this order | Margin after change | Change in percentage points |
|---|---:|---:|
| Opus reference, current arithmetic | 82.33% | — |
| List tariff $5/$25 → $2/$10 | 55.82% | −26.51 |
| Active parameters 300B → 100B | 80.41% | +24.59 |
| Total parameters 2.5T → 1.0T | 82.88% | +2.47 |
| Fleet 5/10/25/20/40 → 5/15/25/5/50 | 83.76% | +0.87 |
| Rents → my selected all-in rents | 82.51% | −1.25 |
| Utilization 65% → 70% | 83.76% | +1.25 |
| Lead two months → zero; stack remains 1.0 | 80.49% | −3.26 |
| Traffic and billed cache: 15:1/60% → 12:1/75% | 83.25% | +2.75 |
| Cache writes 0% → 20% of fresh input | 83.52% | +0.28 |

FP8, compressed-KV donor convention, balanced latency, cache-read price multiplier, cache-read cost fraction, list billing and rent basis remain unchanged. The traffic step also changes implied representative decode context from 15,500 to 12,500 tokens; it is not solely a billing-mix effect.

The result explains the similar rounded headlines: a much smaller **assumed** active model largely offsets the lower tariff. Similar margins do not establish similar architectures or independently corroborate either estimate.

**Reference-traffic normalization requires care.** With my central cost assumptions, `io_ratio: 15`, `cache_hit: 60` **and `billCacheHit: 60`**, I obtain **80.9730%**. This is about **1.35 points below** the current 82.33% Opus reference. Keeping my write assumption but changing only the traffic object would leave billed cache hits at 75% and produce **76.9313%**, a different billing experiment. The publishing leg should identify which it runs; the headline is unaffected. Setting my cache-write share to zero as well gives **80.4934%**.

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

The most decisive evidence would be a **Sonnet-specific matched serving measurement**: paid accelerator-hours and all-in cost, input/output/cache counts, context distribution, effort setting, and latency target. That would bypass the speculative parameter proxy. Architecture disclosure would be the most valuable narrower disclosure: materially more active computation or a substantially larger KV footprint would lower this estimate; a smaller active model or demonstrably cheaper matched serving would raise it.

These are one-at-a-time changes from my central case, not alternate endpoints selected after seeing results:

| Disclosure or measurement replacing an assumption | Reconstructed margin | Direction from central |
|---|---:|---:|
| 200B active rather than 100B, other inputs unchanged | 72.75% | −10.77 points |
| Paid-capacity utilization 50% rather than 70% | 76.93% | −6.59 points |
| TPU cost $5.40 rather than $2.70/hour | 77.27% | −6.26 points |
| 2T total weights rather than 1T | 80.50% | −3.02 points |
| Cache-read cost 15% rather than 5% of prefill | 81.05% | −2.47 points |
| Matched private-stack throughput advantage of 10% | 85.02% | +1.50 points |

A separate **public-rate procurement stress** uses H100 $49.24/8, H200 $50.44/8, GB200 $10.50 and TPU $5.40, while holding unquoted GB300 at $6.50. It gives **68.92%**. This is not a completely retail-priced fleet, because GB300 is still assumed. It demonstrates why the selected 74–89% span must not be advertised as covering all procurement uncertainty. The underlying quotes are S8/S10. 

None of these checks establishes a negative central margin. No negative result was hidden, truncated to zero, or used to reverse-engineer a favorable parameter count.

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Absolute context and its distribution.** There is no context-length override in this commission's contract. The public mapping uses a representative 1,000-token output and derives lengths from the input:output ratio. I therefore explicitly assume 12,000 input tokens, 12,500 representative decode-context tokens and 13,000 peak tokens. This does not price a workload concentrated near the model's 1M-token maximum. Long agent trajectories, compaction and the joint distribution of context and output length can change attention, KV traffic, batching and cost. Their omission is material, not cured by labeling the model “1M-capable.” 

**Geometry beyond the donor selector.** The selector can choose a donor, but cannot express arbitrary Sonnet layers, heads, latent dimensions, expert placement or context-dependent routing. `dsr1` supplies compressed KV and 61 layers; active and total magnitudes come from my block. I could not establish whether Sonnet uses MLA, GQA, another compressed representation or a hybrid. The geometry is a declared modeling approximation, not a reconstructed proprietary architecture. 

**Actual heterogeneous placement.** I could not identify Sonnet's token shares across TPU generations, Trainium generations, NVIDIA generations, regions or owned and leased tranches. A fixed token-share blend also cannot capture different prefill and decode placement within one request. Excluding unit-ambiguous Trainium calibrations avoids one numerical error but leaves an economic proxy error; the estimate is conditional on the chosen priced fleet, not proof of the actual fleet's composition. The contract itself supplies the warning, rather than a claim that Anthropic does not use Trainium. 

**Imported throughput calibration.** No public Sonnet benchmark I found identifies aggregate tokens per accelerator-second at matched batching and latency. The public engine uses open-model operating points. Its calibrated GB300 cost can exceed GB200 cost in this reconstruction; I have not interpreted that as a measured silicon ordering for Sonnet. Effort-dependent work, speculative drafts, rejected draft tokens, safety-model calls, phase scheduling and queueing are not independently measured or separately fitted here. User-visible streaming speed does not close those gaps.

**Cache billing semantics.** Attachment 01 describes `cacheWriteShare` as a share of input. The executable billing treatment—and the reference author's explicit definition—uses a share of **fresh input**. I use 20% of fresh, not 20% of all input. The reference states that convention directly. I could not establish the real split between five-minute writes, one-hour writes, reads and unbilled internal reuse; the equality between served and billed cache hits is also an assumption.  

**Tokens versus text.** Sonnet 5's tokenizer changes the number of tokens representing the same material. Anthropic's launch note gives roughly 1.0–1.35× depending on content, rather than a universal conversion. I price Sonnet's own tokens and do not claim the Opus comparison is equal dollars per character, task or completed coding job. Source S1, published June 30 and updated August 10, 2026. 

**Remaining evidentiary limits.** Actual parameter counts, precision, model-specific hardware utilization, strategic invoices, owned-capital schedules, fleet shares, traffic mix, residual private-stack advantage and direct-serving margin remain unestablished. Company revenue and earlier model-generated margin estimates do not fill those gaps. I also lack a live MCP application receipt proving the fully resolved state for these three calls. The complete input vector makes the estimate reproducible and falsifiable; it does not turn assumptions into disclosures.

Download the complete copy-of-record report (a file in the research run's own workspace, not published)