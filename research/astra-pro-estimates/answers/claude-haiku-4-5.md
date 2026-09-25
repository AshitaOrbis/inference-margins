## 0 — THE CARD, IN TWO LINES.

≈73% at list (span 54–85%)  
Latency-oriented serving (`interact: "fast"`) limits batch amortization; balanced serving would add about 16 margin points.

## 1 — PUBLIC FACTS.

**Estimator: GPT-6 Astra Pro. Research date: September 25, 2026.** This is a modeled unit direct-serving contribution margin, not Anthropic’s reported margin. The estimate prices standard synchronous **text traffic with extended thinking disabled**. Dates on undated live documentation and price pages below mean **access dates**, not claimed publication dates. All external sources were consulted on September 25, 2026.

1. **S1 — Identity and variant — DISCLOSED.** The pinned Claude API model is **`claude-haiku-4-5-20251001`**, released **October 15, 2025**. The October 1 suffix is not its public release date. Its alias is `claude-haiku-4-5`; the documented limits are 200,000 context tokens and 64,000 output tokens. Manual extended thinking is an optional runtime mode of this model, not a separately priced model in this estimate. Source: [Anthropic’s model overview](https://platform.claude.com/docs/en/models/haiku-4-5/overview), accessed **2026-09-25**. 

2. **S2 — Current tariff — DISCLOSED.** The project’s price is correct: **$1 input, $0.10 cache-read and $5 output per million tokens**. Five-minute cache creation costs **$1.25/M**, and one-hour creation **$2/M**. I found no separate promotional Haiku tariff on the current pricing page. All three scenarios use the standard tariff, no batch discount and no negotiated token-price discount. Source: [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing), accessed **2026-09-25**. 

3. **S3 — Intended workloads — DISCLOSED.** Anthropic positions Haiku for low-latency interaction, customer service and parallel subagents. That supports a latency-conscious workload assumption, but does not disclose its actual prompt lengths, cache hits, concurrency or task shares. Source: [Haiku 4.5 announcement](https://www.anthropic.com/news/claude-haiku-4-5), published **2025-10-15**. 

4. **S4 — Parameter-scale proxy, not a Haiku measurement — DISCLOSED.** Meta disclosed **17B active/109B total** parameters for Llama 4 Scout and **17B active/400B total** for Maverick. These establish examples of capable sparse models with tens of billions of active parameters and much larger resident weights. They neither identify Haiku’s architecture nor establish equal capability. My **20B active/200B total** central values are **ASSUMED, proxy-informed working values**, not a published Haiku estimate. Source: [Meta’s Llama 4 announcement](https://ai.meta.com/blog/llama-4-multimodal-intelligence/), published **2025-04-05**. 

5. **S5 — User-visible speed — COMMUNITY ESTIMATE.** Artificial Analysis’s non-reasoning Haiku page reports **84.5 output tokens/second through Anthropic’s API** at this reading. This is a user-stream benchmark, not aggregate tokens per accelerator-second, and it supplies no accelerator count or paid-capacity utilization. Its individual measurement timestamp is not supplied in the displayed summary. Source: [Artificial Analysis](https://artificialanalysis.ai/models/claude-4-5-haiku), accessed **2026-09-25**. 

6. **S6 — TPU infrastructure — DISCLOSED.** Anthropic disclosed existing TPU use and an expansion involving up to one million TPUs. This establishes the hardware family’s relevance, not Haiku’s Ironwood share, deployment date or physical serving location. Source: [Anthropic’s Google Cloud announcement](https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services), published **2025-10-23**. 

7. **S7 — NVIDIA infrastructure — DISCLOSED.** Anthropic announced NVIDIA-backed Azure capacity and an initial Grace Blackwell/Vera Rubin commitment; Haiku 4.5 was included in Foundry availability. A capacity commitment is not an observed Haiku deployment allocation. Source: [Anthropic’s Microsoft/NVIDIA announcement](https://www.anthropic.com/news/microsoft-nvidia-anthropic-announce-strategic-partnerships), published **2025-11-18**. 

8. **S8 — Trainium cannot simply be ignored as a real platform — DISCLOSED.** Amazon reported that Trainium2 powered a majority of Bedrock inference and that Anthropic used the 500,000-plus-chip Rainier cluster for training. Neither statement allocates Haiku inference to a particular chip. Source: [Amazon’s fourth-quarter release](https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Fourth-Quarter-Results/), published **2026-02-05**. My exclusion of the calculator’s Trainium legs is a **modeling limitation**, not a claim that Anthropic does not use Trainium. 

9. **S9 — Public NVIDIA hourly anchors — DISCLOSED.** CoreWeave lists an eight-GPU H200 node at **$50.44/hour on demand** and **$20.93/hour spot**, and a four-GPU GB200 slice at **$42/hour**. Dividing by the actual GPU counts gives **$6.305, $2.61625 and $10.50 per GPU-hour**, respectively. These products have different procurement and bundle scopes; none is Anthropic’s disclosed contract. Source: [CoreWeave pricing](https://coreweave.com/pricing), accessed **2026-09-25**. 

10. **S10 — Public TPU hourly anchor — DISCLOSED.** Google lists Ironwood in Iowa at **$12 per chip-hour on demand** and **$5.40 with a three-year commitment**. These are chip-hours, not four-chip VM-hours or rack-hours. Source: [Google Cloud TPU pricing](https://cloud.google.com/tpu/pricing), accessed **2026-09-25**. 

11. **S11 — Strategic TPU procurement — COMMUNITY ESTIMATE.** SemiAnalysis estimates Anthropic’s rented GCP TPU capacity at approximately **$1.60 per TPU-hour**. This is an analyst estimate, not a disclosed executed price. It supports considering costs below retail, but I do not adopt it as the central all-in rate. Source: [SemiAnalysis’s TPUv7 analysis](https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the), published **2025-11-28**. 

12. **S12–S14 — Calculator implementation — DISCLOSED implementation, not measured Haiku performance.** I inspected the public [cost/billing code](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine.js), [roofline equations](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js), and [geometry/calibration registry](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js), accessed **2026-09-25**. The supplied contract warns that Trainium’s batch interpretation has an unresolved approximately **15.2×** unit ambiguity. Those legs receive zero modeled weight here. 

13. **S15 — Cache eligibility — DISCLOSED.** Haiku 4.5 requires at least **4,096 prompt tokens** for caching. A fleet that includes short classification or customer-service requests need not achieve the cache reuse of long-running coding agents. The latter conclusion is **INFERENCE**, not measured traffic. Source: [Anthropic prompt-caching documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), accessed **2026-09-25**. 

14. **Architecture, deployment allocation, utilization and model-level financials — UNKNOWN.** In the reviewed model documentation, launch material, infrastructure disclosures and benchmark evidence, I found no defensible public measurement of Haiku’s active/total parameters, dense-versus-sparse design, attention geometry, serving precision, accelerator-specific token shares, named serving sites, paid-capacity occupancy, or Haiku-specific revenue, direct cost or margin. Sources: **S1, S3, S5–S8**, with dates above. Attachment 06’s earlier AI-generated company analysis is a set of leads, not an Anthropic disclosure. Its strategic-TPU price lead is independently corroborated as an analyst estimate by S11; its margin figures are not inputs here.

## 2 — CALCULATOR INPUTS.

The root donor describes the central case. The low-margin case explicitly changes to the GQA donor. `cacheWriteShare` is **10% of fresh input**, following the public implementation, not 10% of all input. The three fleets and hourly rates are deliberately held fixed: the span varies architecture and occupancy without simultaneously taking every procurement, precision and traffic assumption to an extreme.

```json
{
  "model_id": "custom",
  "model_name": "Claude Haiku 4.5",
  "api_model_priced": "claude-haiku-4-5-20251001; released 2025-10-15; standard Claude API, thinking disabled",
  "customDonor": "dsr1",
  "basis": "list",
  "context_length_assumed": "Text workload: mean 8000 input and 1000 output tokens; representative decode context 8500, terminal context 9000; not a 200000-token workload",
  "central": {
    "overrides": {
      "customDonor": "dsr1", "active": 20, "total": 200, "precision": "fp8",
      "priceIn": 1, "priceOut": 5, "cacheReadMult": 10, "billCacheHit": 50,
      "cacheWriteShare": 10, "cacheWriteMult": 125, "cacheCost": 5,
      "batchShare": 0, "discount": 0,
      "blend": {"h200": 40, "gb200": 20, "tpu7": 40},
      "rentAbsLeg": {"h200": 3.25, "gb200": 5, "tpu7": 2.4},
      "util": 65, "stackMult": 1, "trendMonths": 0, "interact": "fast", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 50}
  },
  "low_margin": {
    "overrides": {
      "customDonor": "qwen3c", "active": 30, "total": 300, "precision": "fp8",
      "priceIn": 1, "priceOut": 5, "cacheReadMult": 10, "billCacheHit": 50,
      "cacheWriteShare": 10, "cacheWriteMult": 125, "cacheCost": 5,
      "batchShare": 0, "discount": 0,
      "blend": {"h200": 40, "gb200": 20, "tpu7": 40},
      "rentAbsLeg": {"h200": 3.25, "gb200": 5, "tpu7": 2.4},
      "util": 60, "stackMult": 1, "trendMonths": 0, "interact": "fast", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 50}
  },
  "high_margin": {
    "overrides": {
      "customDonor": "dsr1", "active": 12, "total": 120, "precision": "fp8",
      "priceIn": 1, "priceOut": 5, "cacheReadMult": 10, "billCacheHit": 50,
      "cacheWriteShare": 10, "cacheWriteMult": 125, "cacheCost": 5,
      "batchShare": 0, "discount": 0,
      "blend": {"h200": 40, "gb200": 20, "tpu7": 40},
      "rentAbsLeg": {"h200": 3.25, "gb200": 5, "tpu7": 2.4},
      "util": 75, "stackMult": 1, "trendMonths": 0, "interact": "fast", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 50}
  },
  "stated": {"headline_pct": 73.4, "low_pct": 54.4, "high_pct": 84.5},
  "sources": [
    {"id": "S1", "claim": "Pinned API identity, release, context limit and manual extended thinking.", "url": "https://platform.claude.com/docs/en/models/haiku-4-5/overview", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "Current USD list tariff: input 1, output 5, cache read 0.10, five-minute write 1.25, one-hour write 2 per million tokens.", "url": "https://platform.claude.com/docs/en/about-claude/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "Launch and low-latency, customer-service and subagent positioning.", "url": "https://www.anthropic.com/news/claude-haiku-4-5", "date": "2025-10-15", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "Open-model scale proxies only: Llama 4 Scout 17B active/109B total; Maverick 17B active/400B total.", "url": "https://ai.meta.com/blog/llama-4-multimodal-intelligence/", "date": "2025-04-05", "evidence_class": "DISCLOSED"},
    {"id": "S5", "claim": "Observed non-reasoning Anthropic API output speed 84.5 tokens/s; not accelerator throughput.", "url": "https://artificialanalysis.ai/models/claude-4-5-haiku", "date": "2026-09-25", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S6", "claim": "Anthropic TPU usage and announced expansion; not a Haiku allocation.", "url": "https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services", "date": "2025-10-23", "evidence_class": "DISCLOSED"},
    {"id": "S7", "claim": "Anthropic NVIDIA/Azure partnership and Grace Blackwell plans; not a Haiku SKU share.", "url": "https://www.anthropic.com/news/microsoft-nvidia-anthropic-announce-strategic-partnerships", "date": "2025-11-18", "evidence_class": "DISCLOSED"},
    {"id": "S8", "claim": "Trainium2 production footprint and Anthropic training use; no Haiku-specific allocation.", "url": "https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Fourth-Quarter-Results/", "date": "2026-02-05", "evidence_class": "DISCLOSED"},
    {"id": "S9", "claim": "Public NVIDIA instance prices: H200 eight-GPU node 50.44/h on demand, 20.93/h spot; four-GPU GB200 slice 42/h.", "url": "https://coreweave.com/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S10", "claim": "Ironwood Iowa list pricing per chip-hour: 12 on demand and 5.40 on a three-year commitment.", "url": "https://cloud.google.com/tpu/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S11", "claim": "Analyst estimate of Anthropic GCP TPU rent around 1.60 per chip-hour, not a disclosed contract.", "url": "https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the", "date": "2025-11-28", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S12", "claim": "Public calculator cost and billing implementation; cacheWriteShare applies to fresh input.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S13", "claim": "Public roofline equations used in the local arithmetic reconstruction, not an MCP execution.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S14", "claim": "Public donor geometries, operating batches and calibration coefficients; these are not Haiku measurements.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S15", "claim": "Haiku 4.5 minimum cacheable prompt length is 4096 tokens.", "url": "https://platform.claude.com/docs/en/build-with-claude/prompt-caching", "date": "2026-09-25", "evidence_class": "DISCLOSED"}
  ],
  "key_inputs": [
    {"input": "active", "central": 20, "low_margin": 30, "high_margin": 12, "source_ids": ["S4"], "evidence_class": "ASSUMED"},
    {"input": "total", "central": 200, "low_margin": 300, "high_margin": 120, "source_ids": ["S4"], "evidence_class": "ASSUMED"},
    {"input": "customDonor", "central": "dsr1", "low_margin": "qwen3c", "high_margin": "dsr1", "source_ids": ["S14"], "evidence_class": "ASSUMED"},
    {"input": "precision", "central": "fp8", "low_margin": "fp8", "high_margin": "fp8", "source_ids": ["S14"], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "fast", "low_margin": "fast", "high_margin": "fast", "source_ids": ["S3", "S5", "S14"], "evidence_class": "INFERENCE"},
    {"input": "blend", "central": {"h200": 40, "gb200": 20, "tpu7": 40}, "low_margin": {"h200": 40, "gb200": 20, "tpu7": 40}, "high_margin": {"h200": 40, "gb200": 20, "tpu7": 40}, "source_ids": ["S6", "S7", "S8"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg", "central": {"h200": 3.25, "gb200": 5, "tpu7": 2.4}, "low_margin": {"h200": 3.25, "gb200": 5, "tpu7": 2.4}, "high_margin": {"h200": 3.25, "gb200": 5, "tpu7": 2.4}, "source_ids": ["S9", "S10", "S11"], "evidence_class": "INFERENCE"},
    {"input": "util", "central": 65, "low_margin": 60, "high_margin": 75, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "stackMult", "central": 1, "low_margin": 1, "high_margin": 1, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "trendMonths", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "traffic", "central": {"mode": "custom", "io_ratio": 8, "cache_hit": 50}, "low_margin": {"mode": "custom", "io_ratio": 8, "cache_hit": 50}, "high_margin": {"mode": "custom", "io_ratio": 8, "cache_hit": 50}, "source_ids": ["S3", "S15"], "evidence_class": "ASSUMED"},
    {"input": "billCacheHit", "central": 50, "low_margin": 50, "high_margin": 50, "source_ids": ["S15"], "evidence_class": "ASSUMED"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": ["S12"], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteShare", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S2", "S12"], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteMult", "central": 125, "low_margin": 125, "high_margin": 125, "source_ids": ["S2"], "evidence_class": "DISCLOSED"}
  ],
  "confidence": "low: tariff and identity are established, but architecture, paid occupancy, procurement, fleet allocation and the latency-to-batch mapping are not measured for Haiku."
}
```

## 3 — YOUR OWN READING.

My central reading is **73.4% at list**, with a selected three-scenario span of **54.4–84.5%**. The rounded card is **≈73%, span 54–85%**. This is my best estimate for the specified ordinary, non-thinking text workload under a rented-equivalent strategic fleet—not a measurement of Anthropic’s blended business.

**Execution status.** I could not invoke the public MCP endpoint from this environment, and plugin discovery found no accessible connector for it. **There is no `run_scenario` response to quote.** The intended call is `run_scenario(model="custom", perspective="median", overrides=central.overrides, traffic=central.traffic)`, with the corresponding substitutions for the two endpoints. The results below are a **local arithmetic reconstruction of S12–S14**, not a falsely attributed MCP execution.

The reconstruction reproduces the supplied current Opus reference at **82.3265%**, rounding to its stated current-engine **82.33%**. That checks the relevant arithmetic and calibration transfer; it does not certify the public mirror against every byte of release `809cfb27`, or test the connector’s override-validation path.

For each occupied accelerator, I calculate:

\[
c_{\rm phase}=\frac{r_{\rm all\text{-}in}}{3600\,T_{\rm phase}}\frac{10^6}{u}.
\]

Here, rent is dollars per **paid accelerator-hour**, throughput is tokens per second per **occupied accelerator**, and utilization is a fraction only inside the arithmetic: the submitted value is **65**, not 0.65. No additional power, hosting, depreciation or network multiplier is added. The reconstructed central intermediates are:

| Accelerator | Token share | All-in $/hour | Fresh-prefill tokens/s | Decode tokens/s | Fresh-input cost $/M | Output cost $/M |
|---|---:|---:|---:|---:|---:|---:|
| H200 | 40% | 3.25 | 5,802.8 | 537.7 | 0.23935 | 2.58316 |
| GB200, per GPU | 20% | 5.00 | 14,653.6 | 903.3 | 0.14582 | 2.36554 |
| TPU v7, per chip | 40% | 2.40 | 13,522.4 | 1,117.2 | 0.07585 | 0.91802 |
| **Token-weighted cost** | **100%** | — | — | — | **0.15524** | **1.87358** |

These throughput figures are **model intermediates, not observed Haiku speeds**. Costs are token-weighted; I do not average hourly rents and divide by a differently weighted throughput.

For a bundle of **one million output tokens and eight million input tokens**, the traffic assumptions imply four million cached inputs and four million fresh inputs. Of the fresh inputs, 0.4 million are five-minute cache writes and 3.6 million are ordinary inputs. Thus:

\[
B=1(5)+4(0.10)+0.4(1.25)+3.6(1)=\$9.50.
\]

At `cacheCost=5`, the cached-input serving cost is $0.007762/M. Therefore:

\[
C=1.873578+4(0.155241)+4(0.007762)=\$2.525590,
\]

\[
M=1-2.525590/9.50=73.4148\%.
\]

| Scenario | Architecture / occupancy | Cost per million mixed tokens | Billings per million mixed tokens | Serving margin |
|---|---|---:|---:|---:|
| Central | 20B/200B, MLA donor, 65% | $0.28062 | $1.05556 | **73.41%** |
| Low margin | 30B/300B, GQA donor, 60% | $0.48178 | $1.05556 | **54.36%** |
| High margin | 12B/120B, MLA donor, 75% | $0.16318 | $1.05556 | **84.54%** |

**Reference-traffic companion: two distinct operations.** Changing only the traffic object to 15:1/60%, while retaining the central `billCacheHit:50`, gives **75.25%**. For a genuinely cache-billing-matched comparison with Opus, also set `billCacheHit:60`; that gives **72.40%**, with cost $0.20785 and billings $0.75313 per million mixed tokens. The latter is my preferred like-for-like comparison. Neither replaces the headline. The separate billed-cache control must not be silently assumed to follow the traffic override. 

**Sanity check.** None of the three submitted scenarios is negative. Parameters are in billions, prices in dollars per million tokens, rents per accelerator rather than node, and utilization in percent. The workload is approximately 8,500 tokens at the representative decode position—not 200,000. Feasible weight/KV placements exist for every included leg at these short contexts; no negative or expensive leg was dropped to manufacture a positive headline. Full runtime placement and latency compliance remain unverified.

## 4 — WHY THESE INPUTS.

**Latency posture: `fast` in all three runs — INFERENCE from S3 and S5, with an unmeasured mapping into S14.** Haiku is purchased partly for responsiveness. In the calculator, `fast` means eight output tokens per chip per iteration on H200/GB200 and four on TPU v7; it does not mean a separate premium API tariff. Under the same central assumptions, `balanced` raises modeled margin from **73.41% to 89.14%**. That **15.72-point** difference is the most consequential categorical choice. I retain `fast` because the product positioning and observed stream speed support an explicit latency penalty rather than inheriting general-purpose batch sizes. This is not a matched production batch-size measurement. 

**Size and donor: 20B active/200B total with `dsr1` — ASSUMED, informed by S4 rather than identified by it.** I use a tens-of-billions-active sparse hypothesis, not a price-to-parameter backsolve. The low case is a somewhat larger 30B/300B model with uncompressed GQA; the high case is 12B/120B with compact KV. `dsr1` preserves the project’s declared closed-model convention. I have no positive evidence that Haiku uses MLA; the low case expressly tests the competing GQA hypothesis. A dense implementation, a different layer count, or a materially different activation ratio would require revisiting this family of scenarios. The exact numeric sizes remain judgments. 

**Precision: FP8 throughout — ASSUMED.** I do not claim to know Haiku’s weight or KV precision. Holding FP8 fixed avoids giving the high case both a smaller model and an unverified FP4 throughput gain. The donor and precision tuples remain approximations, not reverse-engineered Haiku details.

**Fleet: H200 40%, GB200 20%, TPU v7 40% — ASSUMED.** S6–S8 establish relevant platform families, not these shares. This is a tractable serving-cost proxy: substantial mature NVIDIA capacity, some Blackwell, and a large strategic TPU component. Its exact generation split has no public measurement. H100 and GB300 are not asserted absent from the real fleet; they are omitted from this compact representative basket. Trainium and older TPUs may be important in reality. The inability to price them cleanly is a major source of model risk, not evidence that the remaining basket represents 100% of actual Haiku tokens. 

**Hourly procurement: H200 $3.25, GB200 $5.00, TPU v7 $2.40 — INFERENCE, with judgmental numerical discounts.** The H200 rate lies above S9’s interruptible spot anchor and below its on-demand quote. GB200 assumes substantial committed-capacity purchasing power versus S9’s retail slice. TPU v7 sits above S11’s $1.60 strategic estimate and below S10’s $5.40 public commitment. None of these interpolations is a disclosed contract. Each submitted number is an **all-in rental-equivalent valuation**, including hardware recovery, host resources, power, hosting, network and ordinary serving-control burden. The underlying public quotes are anchors with differing scopes, not exact all-in replicas of my assumptions. 

I could not establish which, if any, Haiku-serving assets Anthropic owns. Accordingly, these runs do **not** assert an owned-hardware share or an owned-TCO conversion; they use the cost of all-in leased capacity as their common valuation basis. An owned estimate would require an independently specified installed cost, financing/life convention and operating scope, rather than calling electricity alone the hourly cost. Holding the same performance assumptions but replacing the rents with S9/S10’s public on-demand/committed anchors—$6.305/$10.50/$5.40—gives **45.81%**. That is a procurement stress case outside the selected three-scenario span, not a fourth headline endpoint.

**Paid-capacity utilization: 65%, with 60% and 75% endpoints — ASSUMED, no public measurement.** This is occupancy of paid serving capacity, not achieved FLOPs utilization and not the benchmark’s concurrency. The lower case combines a heavier architecture with more operating slack; the higher case combines a compact model with steadier loading. These are coherent operational stories, not statistical quantiles. Changing utilization alone to 50% or 80% produces **65.44%** or **78.40%** at the central architecture.

**Traffic: 8:1 input/output, 50% serving and billed cache reuse — ASSUMED.** I expect a mixture of short uncached tasks and longer tool-context/subagent tasks, rather than treating the reference’s 15:1/60% convention as measured Haiku traffic. S3 supports those uses; S15 makes very high cache reuse less natural for the short-prompt portion. The assumed mean is 8,000 input and 1,000 output tokens. These are population approximations, not a literal identical request; 50% aggregate cache reuse does not require every request to have an exactly 4,000-token cached prefix. The API’s actual traffic distribution is unknown. 

**Cache cost and creation: 5% of fresh-prefill cost; 10% of fresh inputs written at 1.25× — ASSUMED volumes/cost, DISCLOSED tariff.** The traffic bundle corresponds to ten cached-read tokens per cache-write token. That is a plausible reusable-prefix scenario, not measured cache lifetime telemetry. Omitting write premiums gives **73.13%**; billing the same write volume at the one-hour tariff gives **74.23%**. Cache-write storage and eviction costs are not separately modeled. 

**Private-stack advantage: none credited.** `stackMult=1`, `trendMonths=0`, and speculative decoding is omitted. This is a neutral evidentiary choice, not a claim that Anthropic lacks better kernels. It prevents re-crediting gains already embedded in the calculator’s throughput anchors. Adding the reference’s two-month lead alone would raise the central result to **77.86%**; I found no Haiku-specific measurement justifying that credit.

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The comparison starts at the supplied reference’s **current-engine 82.33%**, not its historical **83.1%** stated number. The latter and its **68–92%** selected span remain the reference author’s claims. Attachment 04 fixes the reference’s fleet, list billing, FP8 precision, balanced posture and two-month lead.  

The following is a **sequential arithmetic bridge**. Each row changes only the named block after the preceding row; therefore the point attribution is order-dependent, but the bridge sums to the central result.

| Change from the reference vector | Approximate margin-point change | Margin after change |
|---|---:|---:|
| Starting Opus vector | — | 82.33% |
| Active parameters: 300B → 20B | +13.77 | 96.10% |
| Total parameters: 2,500B → 200B | +1.52 | 97.62% |
| List prices: $5/$25 → $1/$5 | −9.54 | 88.08% |
| Fleet: 5/10/25/20/40 H100/H200/GB200/GB300/TPU → 0/40/20/0/40 | −1.45 | 86.63% |
| Hourly rents to $3.25 H200 / $5 GB200 / $2.40 TPU | +0.55 | 87.18% |
| Algorithmic lead: two months → zero | −2.58 | 84.61% |
| Latency posture: balanced → fast | −12.55 | 72.05% |
| Traffic and billed cache: 15:1/60% → 8:1/50% | +1.08 | 73.13% |
| Cache writes: zero → 10% of fresh input | +0.28 | **73.41%** |

The active/total changes have different effects because the registered NVIDIA and TPU decode forms do not use the same weight-traffic approximation. They must not be collapsed into a universal “cost is proportional to active parameters” rule. 

**Unchanged, hence zero bridge contribution:** utilization 65%; FP8; central `dsr1` geometry; `stackMult=1`; no speculative-decode credit; cache reads priced at 10% of fresh input; cache serving cost at 5%; `batchShare=discount=0`; and rental-equivalent valuation. The reference uses 0.95× planning rents on NVIDIA and 0.50× on TPU; I instead specify absolute all-in rates once, without multiplying a second family discount into them. 

At matched Reference traffic **and matched 60% billed cache**, Haiku reads **72.40% versus Opus’s 82.33%**, about **9.93 points lower**. The modeled size advantage does not automatically translate into a higher percentage margin: Haiku charges one-fifth of the reference tariff, and my latency posture amortizes weights over much smaller batches.

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

**The most valuable measurement is paid accelerator-hours and billable tokens for a representative Haiku production window, split into fresh input, cached input and output, with latency targets and hourly cost scope stated.** It would bypass much of the parameter-count inference. A public test must distinguish per-request speed from total server throughput and occupied-chip performance from paid-capacity occupancy.

A matched demonstration that Haiku sustains its normal interactive latency at the calculator’s balanced-style batching would move my central estimate **up toward 89%** without any change to architecture, rents or utilization. Conversely, evidence of lower concurrency, expensive routing/verification work, or a heavier attention implementation would move it down. Output generation accounts for approximately **74.2% of modeled central cost**, making this operational evidence especially important.

A credible architecture disclosure would also be decisive. Holding everything else central and changing only the attention donor to GQA lowers the estimate to **69.00%**. The low scenario’s larger 30B/300B GQA model and 60% occupancy produce **54.36%**. A substantially smaller distilled model would support the high case or potentially exceed it; a materially larger dense model could fall outside the selected span.

Procurement is another major falsifier. A **20% increase in every all-in hourly cost** lowers the central estimate to **68.10%**. Evidence that Haiku’s real allocation is dominated by cheaply operated owned TPUs or efficiently served Trainium could move the estimate up; evidence of expensive managed capacity or poor occupancy could move it down. The direction cannot be inferred from chip branding alone.

Finally, a measured fresh-prefill cost is valuable even though decode dominates here. Scaling only prefill and its linked cache cost by **0.5× or 1.5×** moves the result to **76.85% or 69.98%**. These are diagnostics of an unmeasured transfer, not additional probability bounds.

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Absolute lengths and their distribution.** There is no submitted context-length control. The public engine’s default length convention yields 8,000 input/1,000 output tokens for this custom 8:1 mix, approximately 8,500 at the representative decode position and 9,000 at the terminal KV position. I adopt that convention explicitly. It does not model a distribution of short tickets, long documents, burst arrivals and occasionally near-limit prompts. Pricing the 200,000-token maximum as the typical request would answer a different question. The actual mean and tail remain unknown. 

**Geometry is selectable only as a package.** `customDonor` chooses a frozen architecture package; it cannot set Haiku’s actual layers, KV heads, compression, expert placement or recurrent state. The central MLA donor is an approximation, not evidence. The low GQA donor makes one uncertainty visible but does not exhaust plausible architectures. In particular, the three-scenario span is not a bound on every dense or sparse implementation compatible with the public record.

**Latency is not an enforced service-level target.** `fast` is a coarse batch setting, not a control for 84.5 tokens/second, time to first token or a tail-latency percentile. The central NVIDIA calculations are more consistent with fast serving than the balanced calculations, but they do not constitute a matched replay of Artificial Analysis. The TPU donor-derived stream rate also differs markedly from that API benchmark. No serving-speed observation was converted directly into accelerator throughput.

**Fleet and calibration coverage.** Trainium’s unresolved batch-unit defect prevents me from using it as a clean headline leg. Older TPU generations lack selectable rows. The representative three-leg fleet therefore approximates costs beyond the portion of the real estate that can be mapped, and actual Haiku platform shares remain unknown. The public registry also transfers a single prefill-efficiency calibration across platforms and uses different NVIDIA/TPU decode traffic forms. Those structural limitations are not removed by the apparently precise percentages. 

**Billing and cost boundaries.** Actual server-side reuse need not equal billed cache hits; I assume equality at 50%. The Reference companion must state whether it changes one or both. Cache-write volume is a share of **fresh** input in the implementation, and storage/eviction overhead is not separately controllable. The modeled cost includes the chosen all-in capacity valuation and allocated paid-capacity slack, but excludes training, research, sales, support, free-tier serving and unbilled retries as required by this commission. Image-specific preprocessing, tools charged separately, and extended-thinking workload distributions are outside the priced text-only case.

**Evidence and execution gaps.** I could not establish Haiku’s architecture, actual precision, real batching, speculative-decoding acceptance and draft costs, chip/site allocation, ownership split, executed hourly prices, utilization, request-length distribution, cache telemetry, or model-level financials. I also could not obtain a live MCP response. The report’s numeric evidence is the disclosed input vector plus local reconstruction, including the successful Opus arithmetic check—not a provider margin disclosure or a connector receipt. No input was tuned to reproduce the old Opus number or the existing speculative Haiku preset.

**Attachment receipt.** All six supplied materials were readable before analysis. Files 03 and 04 were opened from the uploads; 01, 02, 05 and 06 were supplied inline. Their first lines/headings, truncated where needed, were:

| File | First line or heading |
|---|---|
| `01-method-and-input-contract.md` | `# The calculator: what it computes, and exactly which inputs you may give it` |
| `02-opus-4x-reference-dive-summary.md` | `# The reference: GPT-5.6 Pro's estimate for Claude Opus 4.x — the headline form this dive should match` |
| `03-calculator-contract-live-2026-09-25.json` | `{"result":{"content":{"type":"text","text":"The scenario space of the Frontier Inference Margins ca` |
| `04-opus-4x-reference-dive-verbatim-2026-08-08.md` | `` ```json `` |
| `05-carrier-and-nearest-row\.md` | `# How the calculator will hold Claude Haiku 4.5, and the nearest row the site carries today` |
| `06-anthropic-gptpro.md` | `# GPT-5.6 Pro consult — ADOPTED-FINDINGS SUMMARY (req_1783636621475_l5tccc, 54m21s, 2026-07-09)` |

[Complete copy-of-record report (a file in the research run's own workspace, not published)