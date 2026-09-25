## 0 — THE CARD, IN TWO LINES.

≈81% at list (span 66–89%)  
The decisive assumption is owned Blackwell capacity costing $2.10–$2.50 per accelerator-hour, all-in—not public-cloud rental prices.

## 1 — PUBLIC FACTS.

**GPT-6 Astra Pro · September 25, 2026.** This is a modeled unit direct-serving contribution margin, not an audited xAI margin or a company gross margin. Dates below are publication dates unless explicitly identified as access dates. Source IDs connect the evidence to the input block.

1. **DISCLOSED — Model and version.** I price **`grok-4.6`, released August 12, 2026**, through the standard first-party API, with **high reasoning effort**, the documented default. The endpoint also supports low, medium and xhigh efforts and a 500,000-token context limit. I found no immutable checkpoint identifier beyond this API name. **S1:** [model documentation](https://docs.x.ai/developers/models/grok-4.6), accessed **2026-09-25**; **S3:** [release announcement](https://x.ai/news/grok-4-6), **2026-08-12**. 

2. **DISCLOSED — Verified list tariff.** Below **200,000 prompt tokens**, input/cached-input/output prices are **$2.00/$0.50/$6.00 per million tokens**. At **200,000 or more**, they are **$4.00/$1.00/$12.00**. Thus `cacheReadMult=25`, not the preceding Grok 4.5 row’s 15. The commission’s quoted Grok 4.6 tariff is correct. **S2:** [provider pricing](https://docs.x.ai/developers/pricing), accessed **2026-09-25**. 

3. **DISCLOSED — Scope correction and separate offerings.** Grok 4.6 is no longer the newest release: **Grok 4.7 launched September 21, 2026**. I retain the commissioned 4.6 identity. Its launch announcement also describes a separately priced fast variant and a first-week doubled-usage offer in Cursor/Grok Build. Neither is a discount to the ordinary API tariff used here. **S4:** [Grok 4.7 announcement](https://x.ai/news/grok-4-7), **2026-09-21**; **S3**, **2026-08-12**. 

4. **INFERENCE — Architecture lineage, not a disclosed configuration.** Cursor identifies the preceding **Grok 4.5 as mixture-of-experts**; xAI describes 4.6 as continuing that model’s training lineage. Retaining a MoE carrier is reasonable, but this does not establish 4.6’s attention design, expert count or active parameters. **S5:** [Cursor’s technical announcement](https://cursor.com/blog/grok-4-5), **2026-07-08**, together with **S3**, **2026-08-12**. 

5. **ASSUMED — Parameter magnitudes.** I use **1,500B total and 200B active**, with 300B/120B active in the two alternatives. The 1.5T footprint is a continuity assumption informed by the earlier project dive, **not a newly verified Grok 4.6 weight count**. Its cited executive-size leads were not independently retrievable here. Neither the exact total nor 200B active is established by the public documents I could inspect. Assumption date: **2026-09-25**. Source lead: the [earlier project dive](https://margins.ashitaorbis.com/research/xai-gptpro), run **2026-07-09**, supplied as attachment 06; its size claims are not adopted as verified facts. 

6. **INFERENCE — Precision.** FP8 is my production proxy, not a disclosure for 4.6. xAI’s historical Grok-2 serving recipe explicitly uses FP8; transferring that practice is weaker evidence than inspecting the current deployment. **S6:** [official Grok-2 serving recipe](https://huggingface.co/xai-org/grok-2/commit/04deaba0f06fa44bbe90a46621036e555710691b), **2025-08-23**. 

7. **COMMUNITY ESTIMATE — Observable performance.** Artificial Analysis reports **61.7 output tokens/second** and **42.07 seconds to first token** for Grok 4.6 high on the first-party API. These are request-level observations, not aggregate throughput per GPU or occupancy measurements. I do not multiply a guessed number of simultaneous streams by that speed. **S7:** [benchmark page](https://artificialanalysis.ai/models/grok-4-6), accessed **2026-09-25**. 

8. **DISCLOSED — Hardware inventory, not serving allocation.** A June filing identifies operating Colossus II clusters of approximately **110,000 GB200 and 110,000 GB300 processors**; further expansion is described separately as planned. The company’s Colossus 1 announcement identifies H100/H200/GB200 hardware and Anthropic access. These disclosures establish available hardware families, **not which chips serve `grok-4.6`**. **S8:** [SEC-hosted filing](https://www.sec.gov/Archives/edgar/data/1181412/000162828026041013/japanfwp_06042026.htm), **2026-06-04**; **S9:** [compute partnership](https://x.ai/news/anthropic-compute-partnership), **2026-05-06**. 

9. **INFERENCE — Hourly production cost.** No public xAI per-accelerator serving-cost figure was established. I derive **$2.10/GB200-hour and $2.50/GB300-hour**, including capital recovery, facilities, networking, power and operations, from the explicitly assumed cost construction in §4. Its planning anchors are **S15**, the calculator publisher’s supplied **2026-09-25** contract, not lab invoices. Publisher: [Frontier Inference Margins](https://margins.ashitaorbis.com/). 

10. **UNKNOWN — Utilization and production placement.** I found no model-specific occupancy, loaded-GPU-hour, serving-site or generation-by-generation allocation disclosure. `us-east-1` in **S1**, the [model documentation](https://docs.x.ai/developers/models/grok-4.6), is an API-region label, not evidence locating inference inside a particular building. `util=65` and the 50:50 Blackwell token-share blend are working assumptions, dated **2026-09-25**, not measurements inferred from training utilization. 

11. **DISCLOSED — Financial perimeter and capacity-sale benchmark.** The filing reports Q1 2026 AI-segment revenue of **$818M** and cost of revenue of **$456M**, across a broader business than Grok API serving. It also reports an Anthropic capacity agreement covering approximately **325,000 GPUs plus supporting infrastructure for $1.25B/month**. These are historical financial/contract disclosures, not September Grok 4.6 unit costs. **S8**, **2026-06-04**. 

12. **DISCLOSED — Token accounting.** Reasoning tokens are billed at the completion rate; cached tokens have an explicit usage count. Long-context classification counts cached as well as fresh prompt tokens. My output denominator includes **all billed output, including reasoning**, not just visible answer text. **S10:** [cache usage and pricing documentation](https://docs.x.ai/developers/advanced-api-usage/prompt-caching/usage-and-pricing), updated **2026-05-10**, checked **2026-09-25**. 

13. **DISCLOSED — Calculator assumptions are inspectable, but are not provider measurements.** I inspected the public [data registry](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js) (**S11**), [roofline implementation](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js) (**S12**) and [main engine](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js) (**S13**), accessed **2026-09-25**. The [fresh-prefill reconstruction](https://margins.ashitaorbis.com/research/input-cost-reconstruction), **2026-09-20**, is **S14**. The distinction between their calibration assumptions and xAI production evidence is essential. 

## 2 — CALCULATOR INPUTS.

```json
{
  "model_id": "custom",
  "model_name": "Grok 4.6",
  "api_model_priced": "grok-4.6; released 2026-08-12; standard first-party API, high reasoning effort, short-context tariff; not fast or Grok 4.7",
  "customDonor": "dsr1",
  "basis": "list",
  "context_length_assumed": "All prompts below 200,000 tokens. Representative input/output lengths: central 8,000/1,000, low-margin 6,000/1,000, high-margin 10,000/1,000; output includes billed reasoning. Absolute lengths are assumptions, not a supported override.",
  "central": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 200,
      "total": 1500,
      "precision": "fp8",
      "priceIn": 2.0,
      "priceOut": 6.0,
      "cacheReadMult": 25,
      "billCacheHit": 60,
      "batchShare": 0,
      "discount": 0,
      "blend": {"gb200": 50, "gb300": 50},
      "rentAbsLeg": {"gb200": 2.1, "gb300": 2.5},
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 60}
  },
  "low_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 300,
      "total": 1500,
      "precision": "fp8",
      "priceIn": 2.0,
      "priceOut": 6.0,
      "cacheReadMult": 25,
      "billCacheHit": 50,
      "batchShare": 0,
      "discount": 0,
      "blend": {"gb200": 50, "gb300": 50},
      "rentAbsLeg": {"gb200": 2.1, "gb300": 2.5},
      "util": 55,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
    },
    "traffic": {"mode": "custom", "io_ratio": 6, "cache_hit": 50}
  },
  "high_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 120,
      "total": 1500,
      "precision": "fp8",
      "priceIn": 2.0,
      "priceOut": 6.0,
      "cacheReadMult": 25,
      "billCacheHit": 70,
      "batchShare": 0,
      "discount": 0,
      "blend": {"gb200": 50, "gb300": 50},
      "rentAbsLeg": {"gb200": 2.1, "gb300": 2.5},
      "util": 70,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
    },
    "traffic": {"mode": "custom", "io_ratio": 10, "cache_hit": 70}
  },
  "stated": {"headline_pct": 80.9, "low_pct": 65.9, "high_pct": 89.2},
  "sources": [
    {
      "id": "S1",
      "claim": "API identity, 500k limit, reasoning efforts and default high; accessed on date shown.",
      "url": "https://docs.x.ai/developers/models/grok-4.6",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S2",
      "claim": "Current short/long-context list tariffs; accessed on date shown.",
      "url": "https://docs.x.ai/developers/pricing",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S3",
      "claim": "August 12 release, agentic focus, continuation from 4.5, separate fast offering.",
      "url": "https://x.ai/news/grok-4-6",
      "date": "2026-08-12",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S4",
      "claim": "Grok 4.7 superseded 4.6 as newest release; not the model priced here.",
      "url": "https://x.ai/news/grok-4-7",
      "date": "2026-09-21",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S5",
      "claim": "Preceding Grok 4.5 is MoE; not a Grok 4.6 parameter disclosure.",
      "url": "https://cursor.com/blog/grok-4-5",
      "date": "2026-07-08",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S6",
      "claim": "Historical Grok-2 FP8 serving recipe; production-precision proxy only.",
      "url": "https://huggingface.co/xai-org/grok-2/commit/04deaba0f06fa44bbe90a46621036e555710691b",
      "date": "2025-08-23",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S7",
      "claim": "Grok 4.6 high single-stream speed and latency benchmark; accessed on date shown.",
      "url": "https://artificialanalysis.ai/models/grok-4-6",
      "date": "2026-09-25",
      "evidence_class": "COMMUNITY ESTIMATE"
    },
    {
      "id": "S8",
      "claim": "Installed Blackwell inventory, capacity-sale agreement, and historical AI-segment financials; no Grok 4.6 serving allocation.",
      "url": "https://www.sec.gov/Archives/edgar/data/1181412/000162828026041013/japanfwp_06042026.htm",
      "date": "2026-06-04",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S9",
      "claim": "Colossus 1 GPU families and Anthropic access agreement.",
      "url": "https://x.ai/news/anthropic-compute-partnership",
      "date": "2026-05-06",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S10",
      "claim": "Cached-token accounting and reasoning tokens billed at completion rate; page update date.",
      "url": "https://docs.x.ai/developers/advanced-api-usage/prompt-caching/usage-and-pricing",
      "date": "2026-05-10",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S11",
      "claim": "Public calculator geometry, hardware and calibration definitions, not xAI measurements; accessed on date shown.",
      "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S12",
      "claim": "Public calculator roofline and capacity equations; accessed on date shown.",
      "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S13",
      "claim": "Public calculator cost, traffic and billing implementation; accessed on date shown.",
      "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S14",
      "claim": "Calculator fresh-prefill reconstruction and calibration-transfer limitation.",
      "url": "https://margins.ashitaorbis.com/research/input-cost-reconstruction",
      "date": "2026-09-20",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S15",
      "claim": "Planning capex and asset-life assumptions supplied in attachment 03; calculator site is the publisher, not a lab invoice.",
      "url": "https://margins.ashitaorbis.com/",
      "date": "2026-09-25",
      "evidence_class": "ASSUMED"
    }
  ],
  "key_inputs": [
    {
      "input": "active",
      "central": 200,
      "low_margin": 300,
      "high_margin": 120,
      "source_ids": [],
      "evidence_class": "ASSUMED"
    },
    {
      "input": "total",
      "central": 1500,
      "low_margin": 1500,
      "high_margin": 1500,
      "source_ids": [],
      "evidence_class": "ASSUMED"
    },
    {
      "input": "precision",
      "central": "fp8",
      "low_margin": "fp8",
      "high_margin": "fp8",
      "source_ids": [
        "S6"
      ],
      "evidence_class": "INFERENCE"
    },
    {
      "input": "blend",
      "central": {"gb200": 50, "gb300": 50},
      "low_margin": {"gb200": 50, "gb300": 50},
      "high_margin": {"gb200": 50, "gb300": 50},
      "source_ids": [
        "S8",
        "S9"
      ],
      "evidence_class": "ASSUMED"
    },
    {
      "input": "rentAbsLeg",
      "central": {"gb200": 2.1, "gb300": 2.5},
      "low_margin": {"gb200": 2.1, "gb300": 2.5},
      "high_margin": {"gb200": 2.1, "gb300": 2.5},
      "source_ids": [
        "S15"
      ],
      "evidence_class": "INFERENCE"
    },
    {
      "input": "util",
      "central": 65,
      "low_margin": 55,
      "high_margin": 70,
      "source_ids": [],
      "evidence_class": "ASSUMED"
    },
    {
      "input": "traffic",
      "central": {"io_ratio": 8, "cache_hit": 60},
      "low_margin": {"io_ratio": 6, "cache_hit": 50},
      "high_margin": {"io_ratio": 10, "cache_hit": 70},
      "source_ids": [
        "S3",
        "S10"
      ],
      "evidence_class": "ASSUMED"
    },
    {
      "input": "billCacheHit",
      "central": 60,
      "low_margin": 50,
      "high_margin": 70,
      "source_ids": [
        "S10"
      ],
      "evidence_class": "ASSUMED"
    },
    {
      "input": "customDonor",
      "central": "dsr1",
      "low_margin": "dsr1",
      "high_margin": "dsr1",
      "source_ids": [
        "S11"
      ],
      "evidence_class": "ASSUMED"
    },
    {
      "input": "efficiency",
      "central": {"stackMult": 1.0, "trendMonths": 0},
      "low_margin": {"stackMult": 1.0, "trendMonths": 0},
      "high_margin": {"stackMult": 1.0, "trendMonths": 0},
      "source_ids": [],
      "evidence_class": "ASSUMED"
    }
  ],
  "confidence": "low: this is a conditional engineering estimate, not provider telemetry; stated margins come from a local transcription of public calculator equations, not a successful live MCP run."
}
```

## 3 — YOUR OWN READING.

My reading is **80.9% at list**, with a **65.9–89.2% three-scenario judgment span**, rounded to **≈81% (66–89%)** on the card. This is conditional on the declared short-context, owned-Blackwell serving model. It is neither a probability interval nor a bound on every plausible architecture and workload.

**Execution status:** I did **not** obtain a successful `run_scenario` response. Connector discovery found no available integration; direct access did not establish an MCP session. The figures below come from my **local transcription of the public calculator equations**, not a fabricated connector return. I could not byte-verify the public mirror against deployed release `809cfb27`. The leg’s live replay remains authoritative for publication. As a numerical cross-check, the transcription reproduces the supplied current Opus reference as **82.3265%**, agreeing with its stated **82.33%** after rounding; that is useful consistency evidence, not proof of complete engine equivalence.

The requested replay is `run_scenario`, with `model="custom"`, `perspective="median"`, and each scenario’s complete `overrides` and `traffic` objects from §2. No provider preset or private-stack lead should be substituted.

The unit conversion I use is:

\[
C_j=\sum_g w_g\frac{10^6 r_g}{3600\,T_{j,g}\,u},
\]

where \(r_g\) is **all-in dollars per accelerator-hour**, \(T_{j,g}\) is phase-specific tokens/second/accelerator, \(u=0.65\), and \(w_g\) is served-token share. Cache reads cost \(0.05C_{in}\). This is the supplied method, with million-token and percentage conversions explicit.

The reconstruction gives central fresh-input cost **$0.469608/M**, cache-read cost **$0.023480/M**, and output cost **$1.215428/M**. Its phase throughputs are approximately **2,093 fresh-input tokens/s/accelerator** on either Blackwell leg, and **1,358/604 output tokens/s/accelerator** on GB200/GB300 respectively. These are modeled aggregate rates, not the 61.7-token/s user stream.

For **8M input plus 1M output**, 60% of input cached:

\[
\text{Billings}=3.2(2)+4.8(0.5)+1(6)=\$14.80.
\]

\[
\text{Cost}=3.2(0.469608)+4.8(0.023480)+1.215428
=\$2.830881.
\]

\[
\boxed{M=1-2.830881/14.80=80.8724\%.}
\]

| Local public-formula reconstruction | Input/output ratio | Cache share | Billings per bundle with 1M output | Direct cost, same bundle | Margin |
|---|---:|---:|---:|---:|---:|
| Low-margin scenario | 6:1 | 50% | $13.50 | $4.6014 | **65.92%** |
| Central scenario | 8:1 | 60% | $14.80 | $2.8309 | **80.87%** |
| High-margin scenario | 10:1 | 70% | $15.50 | $1.6757 | **89.19%** |
| Central inputs, Reference traffic | 15:1 | 60% | $22.50 | $4.4778 | **80.10%** |

All three principal cases are positive before any private-efficiency credit. The audit found no per-node/per-GPU, billion/trillion, million/thousand or fraction/percentage slip. Both Blackwell legs fit the selected operating points under the calculator’s capacity policy; none is silently discarded to improve the blend.

## 4 — WHY THESE INPUTS.

**Price and billing — S1, S2, S10.** I hold $2/$6 and 25% cache pricing fixed in every scenario, with both discount controls at zero. There is no verified promotional API price to substitute. The fast offering is excluded: doubling revenue at unchanged cost would mechanically yield **90.44%**, but fast serving need not have unchanged cost, so that is not an estimate for that variant. Likewise, doubling the tariff for long prompts without increasing attention and cache costs would be an invalid long-context estimate.

**Model size — judgment, not a public measurement.** `active=200` is the largest architectural judgment: about 13.3% of the assumed 1,500B footprint. It represents substantial expert sparsity without assuming an extremely small activated model. The prior dive is a lead, not validation; neither benchmark speed nor API price identifies activation. S3/S5 support lineage only. The low-margin world has 300B active and more output-heavy, less-reused traffic; the high-margin world has 120B active and a better-loaded, more reusable agent workload. These are alternative coherent operating worlds, not claims that one checkpoint’s parameter count varies with occupancy. A routing disclosure would replace this judgment immediately.

**Fleet — S8/S9 establish possibilities; the shares are ASSUMED.** I assign **50% of served tokens to GB200 and 50% to GB300**, not 50% of physical inventory to each. Large Blackwell installations make the carrier plausible; C1’s third-party commitments weaken the case for mechanically assigning all of Grok to its older inventory. Neither establishes the actual serving split, and the filing explicitly discusses training on C2. I include no unconfirmed future installation. A disclosed Hopper-heavy inference pool would require repricing, not merely relabeling this vector.

**All-in owned-hour conversion — S15 planning anchors plus explicit assumptions.** I use capital recovery, not cash-only power expense. Let

\[
\operatorname{CRF}(r,n)=\frac{r}{1-(1+r)^{-n}}.
\]

With an **assumed 8.5% capital rate**, five-year IT life and fifteen-year facility life, the annual recovery factors are 0.253766 and 0.120420. The GB200 installed-IT allocation follows the supplied planning construction: $3.1M per rack × 1.26 installation/network factor ÷ 72 = **$54,250/GPU**. It is a planning estimate, not xAI procurement evidence. The **$65,000 GB300 allocation**, facility allocations, power and operating allowances below are my assumptions. The contract itself does not establish a verified GB300 capital price. 

| Cost component per accelerator | GB200 | GB300 |
|---|---:|---:|
| Installed IT, hosts and network capital | $54,250 | $65,000 |
| Allocated facility capital, excluding that IT/network | $20,000 | $22,500 |
| Facility-inclusive operating power allocation | 2.0 kW | 2.2 kW |
| Assumed delivered electricity price | $0.08/kWh | $0.08/kWh |
| Other direct operating allowance | $0.10/hour | $0.12/hour |
| IT capital recovery ÷ 8,760 hours | $1.5716/hour | $1.8830/hour |
| Facility capital recovery ÷ 8,760 hours | $0.2749/hour | $0.3093/hour |
| Power plus other operations | $0.2600/hour | $0.2960/hour |
| **Derived total; entered rounded value** | **$2.1065 → $2.10/hour** | **$2.4883 → $2.50/hour** |

These are **GPU-hours**, not rack-hours or two-GPU superchip-hours. The power allocations already include cooling and hosts: **no extra PUE, hosting or network charge is added downstream**. Installed IT excludes the separately recovered building/electrical/cooling facility capital. Capital recovery replaces, rather than supplements, a second depreciation or financing charge.

I annualize over calendar hours and apply utilization **only through the calculator’s divisor**. I do not also divide capital recovery by the prior dive’s 85% allocatable-hours assumption. The prior construction used such a divisor; combining that convention with an additional fleet-occupancy deduction would need a demonstrated distinction between the two losses. 

**Utilization — ASSUMED, with no measurement behind it.** Central 65%, downside 55%, upside 70% represent capacity available to the scoped serving pool, including its idle paid time. They do not describe training model-FLOP utilization or utilization of every xAI accelerator. Keeping price, rent, precision and stack fixed in the endpoint scenarios avoids piling every favorable or unfavorable assumption together.

**Traffic — ASSUMED, qualitatively informed by S3/S10.** Long-running coding and knowledge-work agents suggest repeated prompt state and substantial tool/context input; high-effort reasoning adds billed output. I choose **8:1 input/output and 60% reuse** rather than either completely uncached 3:1 traffic or automatically importing the Opus 15:1 convention. The 6:1/50% and 10:1/70% alternatives represent less and more reusable traffic. There is no provider traffic sample identifying these values. I equate serving-side hits with billed cached tokens explicitly; this is not an extra discount layered on top.

**Efficiency and cache cost — neutral private-stack posture.** `stackMult=1`, `trendMonths=0`, no `specDec`, and balanced interactivity are fixed throughout. Public open practice already enters the calculator’s calibration. I add no separate gain for kernels, speculative decoding, or presumed proprietary superiority. The **5% cache-read cost** is an assumed calculator convention, not the provider’s measured cache infrastructure cost. `cacheWriteShare=0` prevents an inherited cache-write premium; `cacheWriteMult=100` is inert.

**Geometry — declared approximation.** I retain `dsr1` for comparability with the closed-model reference, not because Grok is known to use MLA. A Qwen-class GQA donor is a legitimate alternative: my central-only diagnostic gives **78.78%**, approximately **2.10 points lower**. At this short operating context, the choice matters but is not the main source of the 81% result. It can matter much more at long context. The permitted donor definitions and attention/KV distinction are those supplied in the commission and public registry. 

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The reference remains its author’s **83.1%, span 68–92%**; the supplied present-engine reading of that vector is **82.33%**. Its central values are 300B active/2,500B total, FP8, $5/$25 with 10% cache pricing, 65% utilization, two lead months, and the declared NVIDIA/TPU blend. I do not revise that estimate or its span.   

The following is a **sequential, local arithmetic bridge**, not an attribution of measured provider differences. Each row changes only the listed input from the preceding row. The point contributions are therefore **order-dependent**; they are not independent sensitivities that can be freely rearranged.

| Sequential change from the reference vector | Reconstructed margin | Change, percentage points |
|---|---:|---:|
| Reference starting vector | 82.33% | — |
| Input tariff: $5 → $2 | 72.90% | −9.43 |
| Output tariff: $25 → $6 | 46.89% | −26.01 |
| Cache-read tariff: 10% → 25% of input | 53.26% | +6.37 |
| Active parameters: 300B → 200B | 66.27% | +13.01 |
| Total parameters: 2,500B → 1,500B | 68.01% | +1.74 |
| Fleet: reference blend → GB200/GB300 50:50, retaining reference rents | 63.86% | −4.16 |
| Those rents: $4.275/$5.70 → $2.10/$2.50 all-in owned equivalents | 83.43% | +19.57 |
| Private lead: 2 months → 0 | **80.10%** | −3.33 |
| Traffic: 15:1 → 8:1, cache remaining 60% | **80.87%** | +0.77 |

Utilization stays 65%; FP8, balanced posture, stack multiplier 1, 5% cache cost, no write premium and list-only billing are unchanged, so they contribute **zero** in this bridge. The two-month efficiency factor removed is \(3^{2/12}=1.200937\).

At the **same Reference traffic**, my Grok vector is therefore about **2.23 points below the current 82.33% Opus reading**, or **3.00 points below the historical 83.1% author headline**. The lower tariff is substantially offset by the assumed smaller activated model and cheaper owned capacity. Replacing the TPU-heavy reference blend is not itself an automatic win.

The previous xAI dive’s roughly 67% result is also not a target: it used **3:1 uncached traffic and a guessed eight-GPU, 25-concurrent-stream deployment**. Those are different cost and workload constructions, not a measurement that this estimate must reproduce. Its uncertainty warning is more portable than its midpoint.  

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

The most valuable evidence would be a **matched production trace for `grok-4.6` high**: aggregate billed fresh/cache/output tokens, accelerator-hours by generation, precision, prompt/output length distribution, and latency targets. That would test throughput and occupancy together without confusing a single user’s stream with a whole replica.

These one-change diagnostics quantify the consequences. They are **not additional endpoints of the selected span**:

| Measurement replacing a central assumption | Reconstructed implication |
|---|---:|
| 300B active rather than 200B, everything else unchanged | **72.01%**, down 8.86 points |
| 500B active rather than 200B | **54.28%**, down 26.59 points |
| All-in owned-hour costs 25% higher | **76.09%**, down 4.78 points |
| Serving-pool utilization 50% rather than 65% | **75.13%**, down 5.74 points |
| Fresh-prefill throughput half the assumed rate, cache cost still proportional | **69.96%**, down 10.92 points |
| Aggregate decode throughput half the assumed rate | **72.66%**, down 8.21 points |

Conversely, a matched measurement doubling both phase throughputs at the same paid-capacity occupancy would yield approximately **90.44%**. That would justify raising the estimate; an unrelated benchmark or a statement about model capability would not.

The historical segment margin is \(1-456/818=44.25\%\), not a model-token margin. The capacity contract implies **$5.27/GPU-hour** at 730 hours/month: an opportunity valuation, **not production COGS**. Substituting it centrally gives approximately **56.8%**. I have not established whether June’s contract terms remained unchanged in September. These calculations derive from S8, not the earlier model’s interpretation. 

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Absolute context length and workload distribution.** There is no accepted override for average prompt length, output length or their joint distribution. My assumed representative calls are **8,000 input/1,000 billed output tokens centrally**, 6,000/1,000 in the downside and 10,000/1,000 in the upside. With the public implementation’s 1,000-token output convention, representative decode contexts become **8,500, 6,500 and 10,500**, while peak KV occupancy uses **9,000, 7,000 and 11,000**. Reference traffic implies a 15,500-token representative context. These are author-selected short-context operating points, **not observed traffic lengths**, and the JSON description does not create an unsupported context override. A materially longer real workload can invalidate this estimate without changing the displayed I/O ratio. 

**Geometry is selectable, but actual Grok geometry is not expressible.** `customDonor` selects a frozen surrogate; it cannot specify Grok-specific layers, attention heads, compression, expert placement or cache layout. The total/active inputs remain mine rather than the donor’s. The public capacity model uses a uniform loaded-weight policy and a fixed reserve, not verified placement. My central fit selects widths of 12 GB200s or 8 GB300s at the registry’s respective operating batches; these are solver results, not asserted xAI replica deployments. All reported principal scenarios retain both legs. 

**Latency and reasoning effort.** The API’s high-effort setting is scope metadata here, not a calculator control. The engine cannot reproduce a measured latency target or distinguish all costs of hidden reasoning, tool waiting, prompt compaction and answer generation. Its balanced batches imply different per-stream speeds from the published benchmark. Thus I have **not demonstrated that these aggregate throughputs and observed service latency are simultaneously achievable**. I neither treat that mismatch as validation nor backsolve a private-stack bonus to remove it.

**Calibration transfer.** The calculator’s Blackwell coefficients and hardware-specific batches produce a lower FP8 rate for its GB300 leg than its GB200 leg. I preserve that consequence instead of imposing an assumed “newer must be faster” correction. The fresh-prefill coefficient is transferred from a reconstructed open-model operating point; there is no Grok-specific validation. This structural model uncertainty is not exhausted by the three selected scenarios. 

**Facts not established.** Exact released parameter counts; attention and expert topology; production precision; replica layout; aggregate serving throughput; representative occupancy; the model’s actual datacenter and accelerator-token shares; invoice or lease-equivalent costs; delivered power costs; cache storage/eviction costs; billed traffic and reasoning distributions; long-context share; and a model-specific revenue/cost disclosure all remain unestablished. In particular, the [executive-size post cited in public leads](https://x.com/elonmusk/status/2082123925283041545) could not be opened directly; I do not promote its relayed 1.5T description into a verified production specification. No immutable weight-snapshot identifier was found for the endpoint.

**Scope exclusions.** I price ordinary short-context text-model token serving, not image preprocessing, hosted search/tool execution, consumer subscriptions, the fast variant, or the ≥200k tariff population. Training, R&D, sales, support, free-tier serving and unbilled retries are outside the commissioned quantity. The owned-hour construction does include the serving pool’s capital and operating burden; its utilization divisor includes that pool’s idle paid capacity. It does not allocate the whole company’s unused training estate to these API tokens.

**Execution and attachment record.** The missing live result is a limitation of this execution, not a claim that the service is unavailable generally. Public source inspection and local arithmetic were completed; a deployed-engine receipt was not. All three required uploads opened and were read: `03-calculator-contract-live-2026-09-25.json` began `{"result":{"content":{"type":"text","text":"The scenario space of the Frontier Inference Margins ca`; `04-opus-4x-reference-dive-verbatim-2026-08-08.md` began with an opening `json` code fence; `06-xai-gptpro.md` began `# xAI (Grok) — GPT-5.6 Pro deep dive`.

**Bottom line:** the public record supports the tariff and a plausible owned-Blackwell cost construction; it does **not** identify Grok 4.6’s serving margin. **≈81%, with a 66–89% selected span**, is my conditional estimate on the declared vector. The unanswered question with the greatest practical value is aggregate production tokens per paid accelerator-hour at the actual workload and latency target.

[Complete copy-of-record report (a file in the research run's own workspace, not published)