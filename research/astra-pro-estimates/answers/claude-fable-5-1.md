## 0 — THE CARD, IN TWO LINES.

≈84% at list (span 68–90%)  
The decisive assumption is 400B active parameters; Anthropic has not published that number.

## 1 — PUBLIC FACTS.

**Estimator: GPT-6 Astra Pro. Research cutoff: September 24, 2026, America/Dawson_Creek; commission/file identifier dated September 25, 2026.** Dates below are publication dates unless identified as retrieval dates. “Unknown” means not established by this research, not proof that no disclosure exists anywhere.

**File receipt.** Both uploaded files opened and were read: `03-calculator-contract-live-2026-09-25.json`, first-line prefix `{"result":{"content":[{"type":"text","text":"The scenario space of the Frontier Inference Margins ca`; and `04-opus-4x-reference-dive-verbatim-2026-08-08.md`, first line ` ```json `. Inline attachments 01, 02, 05 and 06 were also readable. The uploaded contract is calculator evidence, not independent evidence of Anthropic’s economics.  

1. **S1 — DISCLOSED: identity and variant.** The exact Claude API identifier is **`claude-fable-5-1`**, released **September 1, 2026**. Its published limits are 1M context and 128K output tokens; adaptive thinking is always on and default effort is `high`. I price standard, synchronous Claude API text-dominant traffic at that effort, not Batch, a subscription, or a separately priced fast service. Source: https://platform.claude.com/docs/en/models/fable-5-1/overview — release dated 2026-09-01; retrieved 2026-09-24. 

2. **S2 — DISCLOSED: current tariff, verified on the provider’s pricing page.** Per million tokens: **$10 fresh input, $50 output, $0.25 cache read, $12.50 five-minute cache write, $20 one-hour cache write**. Batch input/output are 50% lower, but no batch discount enters this estimate. No Fable 5.1 promotional tariff was identified. The brief’s prices are correct; its “every other model 0.1×” footnote is now overbroad because Opus 5.5 uses 0.05×. Fable 5.1 still uses **0.025×**, therefore **`cacheReadMult: 2.5`**. Source: https://platform.claude.com/docs/en/about-claude/pricing — undated live table, retrieved 2026-09-24. 

3. **S3 — DISCLOSED: the most useful model-specific traffic clue.** Anthropic describes Fable 5.1 and restricted-access Mythos 5.1 as the same underlying model with different safeguards. It estimates typical token-billed workloads will cost 25% less than Fable 5, because cache reads became cheaper. This supports substantial prefix reuse; it does **not** disclose an input/output ratio or cache-hit percentage. Source: https://www.anthropic.com/claude-fable-and-mythos-5-1 — launch 2026-09-01; retrieved 2026-09-24. 

4. **S4 — DISCLOSED: version naming.** Anthropic’s post-4.6 dateless identifiers denote pinned model versions, not rolling aliases. I therefore do not invent a `-20260901` suffix. Source: https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions — undated, retrieved 2026-09-24. 

5. **S5 — COMMUNITY ESTIMATE: predecessor-size leads, not Fable 5.1 measurements.** Reuters relays FT industry estimates of roughly 8T parameters for Mythos 5 and 5T for Fable 5, while noting the absence of company disclosures. These are weak priors for the new shared model, not verified counts. Source: https://www.reuters.com/technology/bytedance-targets-mega-ai-model-nearing-anthropics-mythos-ft-reports-2026-08-07/ — 2026-08-07. Original report: https://www.ft.com/content/9b8383b1-a28d-4940-8c4e-2f0cd21556ef — full text was paywalled in this session. 

6. **S6 — DISCLOSED: an open architectural analogy.** DeepSeek-V3 reports 671B total and 37B active parameters and uses multi-head latent attention. Its 5.5% activation fraction makes a sparse-model prior plausible; it does not establish Fable’s architecture. Source: https://arxiv.org/abs/2412.19437 — first submitted 2024-12-27, revised 2025-02-18. 

7. **S7 — DISCLOSED: hardware families, not token shares.** Anthropic identifies TPU, Trainium and NVIDIA as its three-platform strategy, and announced an expansion involving up to one million TPUs. A procurement plan cannot identify Fable 5.1’s serving allocation or physical deployment sites. Source: https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services — 2025-10-23. 

8. **S8 — DISCLOSED: Trainium use and company-level context.** Anthropic reported using over one million Trainium2 chips to train **and** serve Claude. The same announcement reported revenue run rate above $30B and peak-demand infrastructure strain. Those are historical April disclosures, not current Fable revenue, paid-capacity utilization, or serving margin. Source: https://www.anthropic.com/news/anthropic-amazon-compute — published 2026-04-20, updated 2026-04-21. 

9. **S9 — DISCLOSED: a real NVIDIA serving deployment.** NVIDIA says Claude-family models run on GB300 NVL72 in Microsoft Azure/Foundry. This establishes a serving platform, not a Fable 5.1-specific GPU count, region, or share. Source: https://blogs.nvidia.com/blog/anthropic-nvidia-gb300-blackwell-ultra-microsoft-azure/ — 2026-06-29. 

10. **S10 — DISCLOSED: public TPU rental benchmark.** Google lists Ironwood in Iowa at $12 on demand, $8.40 on a one-year commitment, and $5.40 on a three-year commitment, **per chip-hour**. None is Anthropic’s disclosed contract price. Source: https://cloud.google.com/tpu/pricing — undated live table, retrieved 2026-09-24. 

11. **S11 — COMMUNITY ESTIMATE: strategic TPU economics.** SemiAnalysis estimates 400,000 purchased Ironwoods at approximately $10B in finished racks and 600,000 rented units, with the rented tranche around $1.60/chip-hour. These are analyst estimates of a program, not verified Fable-serving assets. Source: https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the — Dylan Patel, Myron Xie, Daniel Nishball and colleagues, 2025-11-28. 

12. **S12 — DISCLOSED: a public NVIDIA price comparison.** CoreWeave lists a four-GPU GB200 slice at $42/hour, or $10.50/GPU-hour, with host CPU, RAM and local storage. Its GB300 NVL72 price is “contact sales.” This supports a retail comparison, not my lower committed-cost assumption. Source: https://www.coreweave.com/pricing — undated live table, retrieved 2026-09-24. 

13. **S13 — COMMUNITY ESTIMATE: observable API speed.** Artificial Analysis’s English release page shows approximately 49 streamed output tokens/second for its high-effort, default-fallback Fable 5.1 benchmark. This is a user-facing stream rate, **not aggregate tokens/second per accelerator**. Source: https://artificialanalysis.ai/models/releases/claude-fable-5-1 — undated measurement page, retrieved 2026-09-24. 

14. **S14–S17 — INFERENCE: calculator arithmetic, inspected rather than assumed.** I reconstructed the relevant cost, billing, geometry and capacity calculations from the calculator’s public source mirror. Sources, inspected 2026-09-24: https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine.js ; https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js ; https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js . Its explanatory reconstruction, dated 2026-09-20, explicitly identifies universal-transfer prefill and assumed cache work: https://margins.ashitaorbis.com/research/input-cost-reconstruction . These describe the calculator, not measured Fable performance.   

15. **S18 — UNKNOWN: the actual production cost identity.** I could not establish Fable 5.1’s parameter counts, attention design, serving precision, model-to-site allocation, per-chip throughput at a matched latency target, paid utilization, or direct serving cost/margin. The public model specification does not supply those quantities. Source checked: https://platform.claude.com/docs/en/models/fable-5-1/overview — 2026-09-24. The assumptions below fill these gaps explicitly, rather than treating another model’s self-description or an earlier consultant’s answer as provider evidence. 

## 2 — CALCULATOR INPUTS.

The three scenarios hold the workload and procurement thesis fixed while varying architecture scale and operating maturity. They are **selected joint scenarios, not a probability interval or exhaustive bounds**. In `sources`, dates on undated pages are retrieval dates. Empty `source_ids` identify unsupported working judgments.

**Implementation detail:** the inspected engine applies `cacheWriteShare` to **fresh/non-cache-read input**, not all input. Thus `50` below means 50% of the remaining 8%: **4% of all input tokens** are billed as five-minute writes. This differs from the abbreviated wording in attachment 01; the arithmetic below makes the interpretation auditable. 

```json
{
  "model_id": "custom",
  "model_name": "Claude Fable 5.1",
  "api_model_priced": "claude-fable-5-1; released 2026-09-01; standard Claude API, high effort, default safeguards",
  "customDonor": "dsr1",
  "basis": "list",
  "context_length_assumed": "Text-dominant agentic traffic: 50,000 input and 1,000 billed output tokens per representative request, including billed thinking; 50,500 mean decode context, 51,000 peak. Not the 1M maximum-context workload.",
  "central": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 400,
      "total": 8000,
      "precision": "fp8",
      "priceIn": 10,
      "priceOut": 50,
      "cacheReadMult": 2.5,
      "billCacheHit": 92,
      "batchShare": 0,
      "discount": 0,
      "blend": {"gb200": 30, "gb300": 20, "tpu7": 50},
      "rentAbsLeg": {"gb200": 5, "gb300": 6.5, "tpu7": 1.5},
      "util": 65,
      "stackMult": 1.1,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
    },
    "traffic": {"mode": "custom", "io_ratio": 50, "cache_hit": 92}
  },
  "low_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 600,
      "total": 10000,
      "precision": "fp8",
      "priceIn": 10,
      "priceOut": 50,
      "cacheReadMult": 2.5,
      "billCacheHit": 92,
      "batchShare": 0,
      "discount": 0,
      "blend": {"gb200": 30, "gb300": 20, "tpu7": 50},
      "rentAbsLeg": {"gb200": 5, "gb300": 6.5, "tpu7": 1.5},
      "util": 55,
      "stackMult": 1,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
    },
    "traffic": {"mode": "custom", "io_ratio": 50, "cache_hit": 92}
  },
  "high_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 250,
      "total": 6000,
      "precision": "fp8",
      "priceIn": 10,
      "priceOut": 50,
      "cacheReadMult": 2.5,
      "billCacheHit": 92,
      "batchShare": 0,
      "discount": 0,
      "blend": {"gb200": 30, "gb300": 20, "tpu7": 50},
      "rentAbsLeg": {"gb200": 5, "gb300": 6.5, "tpu7": 1.5},
      "util": 70,
      "stackMult": 1.1,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
    },
    "traffic": {"mode": "custom", "io_ratio": 50, "cache_hit": 92}
  },
  "stated": {"headline_pct": 84.3362, "low_pct": 68.4347, "high_pct": 90.3293},
  "sources": [
    {"id": "S1", "claim": "API identity, release date, limits and default effort", "url": "https://platform.claude.com/docs/en/models/fable-5-1/overview", "date": "2026-09-01", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "Current standard list and prompt-cache tariffs; date is retrieval", "url": "https://platform.claude.com/docs/en/about-claude/pricing", "date": "2026-09-24", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "Fable/Mythos 5.1 share an underlying model; estimated typical billing reduction", "url": "https://www.anthropic.com/claude-fable-and-mythos-5-1", "date": "2026-09-01", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "Dateless model identifiers denote pinned versions; date is retrieval", "url": "https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions", "date": "2026-09-24", "evidence_class": "DISCLOSED"},
    {"id": "S5", "claim": "Reuters relays FT industry estimates for PREDECESSORS, not measured 5.1 counts", "url": "https://www.reuters.com/technology/bytedance-targets-mega-ai-model-nearing-anthropics-mythos-ft-reports-2026-08-07/", "date": "2026-08-07", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S6", "claim": "DeepSeek-V3 discloses 671B total, 37B active and MLA; analogy only", "url": "https://arxiv.org/abs/2412.19437", "date": "2024-12-27", "evidence_class": "DISCLOSED"},
    {"id": "S7", "claim": "Anthropic describes three accelerator families and a TPU expansion plan", "url": "https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services", "date": "2025-10-23", "evidence_class": "DISCLOSED"},
    {"id": "S8", "claim": "Trainium training/serving use and historical April revenue disclosure", "url": "https://www.anthropic.com/news/anthropic-amazon-compute", "date": "2026-04-21", "evidence_class": "DISCLOSED"},
    {"id": "S9", "claim": "Claude-family GB300 serving on Azure; not a Fable 5.1 allocation", "url": "https://blogs.nvidia.com/blog/anthropic-nvidia-gb300-blackwell-ultra-microsoft-azure/", "date": "2026-06-29", "evidence_class": "DISCLOSED"},
    {"id": "S10", "claim": "Public Ironwood chip-hour prices; date is retrieval", "url": "https://cloud.google.com/tpu/pricing", "date": "2026-09-24", "evidence_class": "DISCLOSED"},
    {"id": "S11", "claim": "SemiAnalysis estimated TPU purchase/rental split, finished-rack cost and strategic rent", "url": "https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the", "date": "2025-11-28", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S12", "claim": "GB200 public four-GPU slice price and bundle; date is retrieval", "url": "https://www.coreweave.com/pricing", "date": "2026-09-24", "evidence_class": "DISCLOSED"},
    {"id": "S13", "claim": "Artificial Analysis observed streamed-output speed, not per-chip throughput; date is retrieval", "url": "https://artificialanalysis.ai/models/releases/claude-fable-5-1", "date": "2026-09-24", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S14", "claim": "Independent reconstruction of billing and cost aggregation from public source; date is inspection", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine.js", "date": "2026-09-24", "evidence_class": "INFERENCE"},
    {"id": "S15", "claim": "Independent reconstruction of roofline and capacity arithmetic; date is inspection", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js", "date": "2026-09-24", "evidence_class": "INFERENCE"},
    {"id": "S16", "claim": "Public calculator geometry and calibration constants, not provider measurements; date is inspection", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js", "date": "2026-09-24", "evidence_class": "INFERENCE"},
    {"id": "S17", "claim": "Calculator documents universal-transfer prefill and assumed cache work", "url": "https://margins.ashitaorbis.com/research/input-cost-reconstruction", "date": "2026-09-20", "evidence_class": "INFERENCE"},
    {"id": "S18", "claim": "Exact Fable 5.1 sizes, deployment allocation, utilization and direct cost not established in inspected disclosure", "url": "https://platform.claude.com/docs/en/models/fable-5-1/overview", "date": "2026-09-24", "evidence_class": "UNKNOWN"}
  ],
  "key_inputs": [
    {"input": "active", "central": 400, "low_margin": 600, "high_margin": 250, "source_ids": ["S3", "S5", "S6"], "evidence_class": "INFERENCE"},
    {"input": "total", "central": 8000, "low_margin": 10000, "high_margin": 6000, "source_ids": ["S3", "S5"], "evidence_class": "INFERENCE"},
    {"input": "customDonor", "central": "dsr1", "low_margin": "dsr1", "high_margin": "dsr1", "source_ids": ["S6", "S16"], "evidence_class": "ASSUMED"},
    {"input": "precision", "central": "fp8", "low_margin": "fp8", "high_margin": "fp8", "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "priceIn", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "priceOut", "central": 50, "low_margin": 50, "high_margin": 50, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "cacheReadMult", "central": 2.5, "low_margin": 2.5, "high_margin": 2.5, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "billCacheHit", "central": 92, "low_margin": 92, "high_margin": 92, "source_ids": ["S3"], "evidence_class": "INFERENCE"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": ["S17"], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteShare", "central": 50, "low_margin": 50, "high_margin": 50, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteMult", "central": 125, "low_margin": 125, "high_margin": 125, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "blend", "central": {"gb200": 30, "gb300": 20, "tpu7": 50}, "low_margin": {"gb200": 30, "gb300": 20, "tpu7": 50}, "high_margin": {"gb200": 30, "gb300": 20, "tpu7": 50}, "source_ids": ["S7", "S8", "S9"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg", "central": {"gb200": 5, "gb300": 6.5, "tpu7": 1.5}, "low_margin": {"gb200": 5, "gb300": 6.5, "tpu7": 1.5}, "high_margin": {"gb200": 5, "gb300": 6.5, "tpu7": 1.5}, "source_ids": ["S10", "S11", "S12"], "evidence_class": "INFERENCE"},
    {"input": "util", "central": 65, "low_margin": 55, "high_margin": 70, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "stackMult", "central": 1.1, "low_margin": 1, "high_margin": 1.1, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "trendMonths", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "balanced", "low_margin": "balanced", "high_margin": "balanced", "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "batchShare", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "discount", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "hwMode", "central": "rent", "low_margin": "rent", "high_margin": "rent", "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "traffic.io_ratio", "central": 50, "low_margin": 50, "high_margin": 50, "source_ids": ["S3"], "evidence_class": "ASSUMED"},
    {"input": "traffic.cache_hit", "central": 92, "low_margin": 92, "high_margin": 92, "source_ids": ["S3"], "evidence_class": "INFERENCE"}
  ],
  "confidence": "low: identity and tariffs are verified, but architecture, fleet, paid utilization and workload-matched throughput are not; this is a conditional serving-margin estimate, not a measured provider margin."
}
```

## 3 — YOUR OWN READING.

My reading is **84.34% at list**, with selected scenarios of **68.43% and 90.33%**. The card rounds those to **84%, 68–90%**. This is the requested unit direct-serving contribution margin: hardware time, paid-capacity utilization and direct infrastructure/serving burden, excluding training, R&D, sales, G&A, free-tier subsidy, support and unbilled retries. It is not Anthropic’s accounting gross margin.

**Execution status.** I attempted `tools/call` → `run_scenario` at https://margins-mcp.ashitaorbis.com/mcp with `model: "custom"`, `perspective: "median"`, and exactly the `central.overrides` and `central.traffic` objects above. The transport returned **“Temporary failure in name resolution.” No JSON-RPC scenario result was received.** The figures here are an independent reconstruction from S14–S16, not a claimed successful MCP execution. The submitting leg’s engine rerun remains authoritative for the card.

As an arithmetic check, the same reconstruction produces **82.3265%** for attachment 02’s current Opus reference vector, matching its stated current-engine **82.33%**. This is a useful implementation check, not validation of either model’s inferred costs. The reference author’s preserved headline remains 83.1%.  

**Central arithmetic.** Consider one million billed output tokens accompanied by fifty million input tokens. With 92% cache hits, these are 46M cache reads and 4M fresh tokens. Half the fresh tokens are billed as five-minute cache writes:

\[
R=46(0.25)+2(10)+2(12.50)+1(50)=\$106.50.
\]

The reconstructed fleet-weighted costs, including the utilization divisor and all-in hourly rates, are **$1.476804/M fresh input**, **$0.073840/M cache read**, and **$7.378086/M output**. Therefore:

\[
C=4(1.476804)+46(0.073840)+7.378086=\$16.681954,
\]

\[
m=1-16.681954/106.50=84.3362\%.
\]

Equivalently, this is **$0.32710 cost against $2.08824 billing per million total traffic tokens**. The normalization is optional; it leaves the margin unchanged.

| Scenario | Fresh input cost, $/M | Output cost, $/M | Cost of 50M input + 1M output | List billing | Margin |
|---|---:|---:|---:|---:|---:|
| Central | 1.4768 | 7.3781 | $16.6820 | $106.50 | **84.34%** |
| Low margin | 2.7501 | 16.2914 | $33.6171 | $106.50 | **68.43%** |
| High margin | 0.9265 | 4.4621 | $10.2993 | $106.50 | **90.33%** |

These are calculated outputs from the submitted inputs. Every scenario uses the verified tariff, not a separately chosen margin target.

For dimensional checking, with hourly cost \(p\), occupied-accelerator throughput \(T\), and utilization fraction \(u\):

\[
C_{\$/M}=\frac{p\times10^6}{3600\,T\,u}.
\]

At the central point, the reconstructed prefill/decode throughputs are approximately **1,045/221 tokens/s per GB200 GPU**, **1,045/283 per GB300 GPU**, and **965/127 per TPU chip**, before the separate paid-utilization divisor. These are **calculator throughputs**, not production observations. The GB200 decode batch is memory-capped, as explained in section 7.

**Sanity checks.** Parameters are entered in billions; prices are per million tokens; rents are per GPU/chip-hour, not node-hour; utilization is entered as `65`, not `0.65`; and a 2.5% cache-read multiplier is entered as `2.5`, not `25`. Power and hosting are already inside the hourly figures. All three margins are positive. No negative result was “repaired” by choosing more favorable inputs.

## 4 — WHY THESE INPUTS.

**Architecture: 400B active / 8T total, FP8, `dsr1`.** The total-size prior comes from S5’s predecessor estimates together with S3’s shared-model disclosure. The active-size prior is approximately 5% activation, loosely informed by S6’s open MoE example. Neither step identifies Fable’s size: these are weak architectural inferences, not a parameter-count discovery. The low-margin case is a 10T/600B model; the high-margin case is 6T/250B. FP8 is a working serving assumption. I do not import attachment 06’s unverified low-precision claims as proof that this model runs in FP4. The MLA donor is a declared approximation retained for comparability; no public evidence selects it over `qwen3c` or `llama70` for Fable. **Judgment with no Fable-specific measurement.** A disclosed smaller active network or proven lower-precision deployment raises the margin; a larger network or more expensive attention lowers it.

**Traffic: 50:1 input/output, 92% physical and billed cache hits.** S3 motivates a reuse-heavy, long-running agentic mix. I assume a representative 50K-token input and 1K-token billed output, including billed thinking. At the old $1 cache-read tariff, this exact bundle would bill $141; at $0.25 it bills $106.50, a **24.47% reduction**, close to the provider’s estimated typical reduction. This is an externally informed consistency check, not unique identification: many traffic mixes fit that claim. The 50:1 ratio, five-minute-write mix and representative lengths remain judgment. Larger thinking outputs, shorter sessions or more cache invalidation would change the appropriate traffic vector. 

**Cache work and writes: 5% of prefill; half of fresh input written at 1.25×.** The 5% work assumption is S17’s modeling convention, not a measured Fable cache-restoration cost. Five-minute writes are plausible for repeatedly updated agent contexts; the write share is assumed. The one-hour tariff is verified but receives zero share. Removing the write premium alone gives **83.56%**, while making every fresh token a five-minute write gives **85.04%**. Raising cache-read work to 15% of prefill gives **77.96%**. Cheap billed cache reads do not imply costless KV storage or movement. 

**Fleet: 30% GB200, 20% GB300, 50% TPU7 by served-token share.** S7–S9 support the platform families, not these fractions. A very large frontier model plausibly favors newer high-memory equipment; the precise split is **assumed**. Trainium is deliberately excluded because attachment 03 flags an unresolved per-chip versus replica-global throughput ambiguity of about 15.2×. That exclusion does **not** mean Anthropic serves no Fable requests on Trainium. It means the headline prices a declared NVIDIA/TPU proxy fleet rather than claiming a verified whole-provider inventory. This is a material coverage limitation. 

**NVIDIA all-in hourly cost: $5.00/GB200 GPU and $6.50/GB300 GPU.** I use attachment 03’s provisional $4.50/$6.00 planning anchors plus a **$0.50/GPU-hour assumed allowance** to complete the direct host/network/control-plane cost scope. Those are committed-capacity judgments, not prices disclosed by Anthropic or vendor offers. S12’s $10.50 public GB200 slice is a different procurement class; substituting that rate on the GB200 leg alone lowers the central margin to **77.35%**. No second electricity, hosting or networking charge is added after the all-in rates enter `rentAbsLeg`.

**TPU all-in equivalent: $1.50/chip-hour.** This is an inference with an explicit ownership conversion, not a claimed invoice. S11’s finished-rack estimate implies $25,000 per chip. For the owned portion, assume five-year compute life, 8% capital recovery, $12,500/chip allocated facility capital over fifteen years, 1 kW operating draw, PUE 1.15, electricity $0.08/kWh, and $0.20/chip-hour for continuing operations and direct host/network/control-plane burden. These financing, facility, power and operating inputs are **working assumptions**.

With \(\operatorname{CRF}(r,n)=r/[1-(1+r)^{-n}]\):

\[
\begin{aligned}
p_{owned}={}&\frac{25{,}000\operatorname{CRF}(0.08,5)}{8760}
+\frac{12{,}500\operatorname{CRF}(0.08,15)}{8760}\\
&+1(1.15)(0.08)+0.20\\
={}&0.71477+0.16671+0.092+0.20=\$1.17348/h.
\end{aligned}
\]

For the rented portion, use S11’s estimated $1.60 plus $0.10/h assumed API-side burden: **$1.70/h**. Applying the analyst’s 40:60 purchase/rental program split as an **assumed proxy for this TPU serving tranche** gives:

\[
0.4(1.17348)+0.6(1.70)=\$1.48939/h\approx\$1.50/h.
\]

The conversion includes capital recovery rather than treating sunk hardware as free. It counts power and the facility exactly once, inside the owned hourly figure. It does not establish that the announced purchases have all been commissioned or assigned to Fable. A $2.70 TPU rate instead gives **80.87%**; using $5.40 as an alternative hourly cost gives **73.08%**. Those are procurement sensitivities outside the selected three-scenario span. 

**Utilization: 65%, versus 55%/70% in the low/high scenarios.** This is paid-capacity utilization, not training FLOP utilization and not GPU activity during an occupied request. S8’s demand statement does not measure it. The lower case combines a larger deployment with more paid slack; the higher case combines a smaller model with a mature, better-loaded deployment. **No public measurement supports these exact values.**

**Efficiency: `stackMult: 1.10`, `trendMonths: 0`; low case 1.00/0.** The central point assumes 10% more throughput than the calculator’s published-open-practice baseline, equivalent to about 9.1% less cost, not a measured Anthropic lead. This single modest credit is judgment; there is no extra speculative-decoding multiplier or algorithmic-lead credit. Removing it lowers the central result to **82.77%**. `interact: "balanced"` is likewise a declared posture, not a verified latency guarantee.

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The reference is the **declared vector in attachment 02**, not today’s tariff for every historical model called Opus 4. Its author preserved **83.1%, span 68–92%**; the supplied current engine evaluates the vector at **82.33%**. I compare input changes against that current-engine value, so engine drift is not misattributed to Fable.   

The following is an **ordered waterfall from my reconstruction**, first at common Reference traffic with both physical and billed cache shares at 60%. Contributions depend on order because the model is nonlinear.

| Change, in this order | Margin-point change | Resulting margin |
|---|---:|---:|
| Current-engine Opus reference | — | 82.33% |
| Input/output tariff $5/$25 → $10/$50 | +8.84 | 91.16% |
| Cache-read multiplier 10% → 2.5% | −0.53 | 90.63% |
| Active parameters 300B → 400B | −2.61 | 88.02% |
| Total parameters 2.5T → 8T | −2.17 | 85.85% |
| Fleet 5/10/25/20/40 H100/H200/GB200/GB300/TPU → 0/0/30/20/50 | +1.21 | 87.06% |
| Remaining-leg rents $4.275/$5.70/$2.70 → $5/$6.50/$1.50 | +1.84 | 88.90% |
| Replace two-month lead, 1.201×, with 1.10× stack and zero lead | −1.02 | 87.88% |
| Five-minute writes: 0 → 50% of fresh input | +0.76 | **88.64%** |
| Move to own 50:1 / 92% physical-and-billed-cache traffic | −4.31 | **84.34%** |

**Unchanged inputs:** 65% utilization, FP8, balanced posture, 5% cache-read work, list billing, zero batch share and zero discount. Donor geometry remains the same approximation. Their contribution in this comparison is zero.

**Reference companion and an important ambiguity.** With central hardware/architecture settings, Reference traffic, and **`billCacheHit: 60`**, I calculate **88.64%**: $13.6014 cost against $119.75 billing per 15M-input/1M-output bundle. This is the clean like-for-like billing comparison.

A literal rerun that changes **only** `traffic` to 15:1/60% while retaining the submitted **`billCacheHit: 92`** instead calculates **79.68%**, because billing falls to $66.95 while physical cost stays $13.6014. Both results are coherent calculations of different billing assumptions. The rerun receipt should state which it used; neither replaces the own-traffic headline. Physical cache reuse and billed cache share must not be silently conflated. 

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

**The highest-value disclosure is Fable-tagged billed-token throughput per paid accelerator-hour, accompanied by the hardware invoice or equivalent ownership cost, context distribution, cache behavior and latency target.** That directly tests the numerator instead of relying on parameter counts as a cost proxy.

A matched measurement showing twice my throughput at the same paid capacity and workload would raise the central margin to approximately **92.17%**, above my selected high scenario. Half the throughput would lower it to approximately **68.67%**. These are algebraic sensitivities, not predictions.

An actual active count near 600B, with everything else held at central, produces **78.67%** rather than 84.34%; 250B produces **88.59%**. A different total size can additionally change memory residency and feasible batching, so total and active counts must both be disclosed.

A TPU cost near the public three-year rate instead of my owned/strategic equivalent pushes the result materially downward, as section 4 shows. Conversely, a proven lower-cost, latency-matched Trainium deployment could raise the estimate and repair the fleet-coverage gap. Its direction cannot be inferred from the presently ambiguous Trainium coefficient.

Finally, representative billing telemetry could reject the 50:1/92% traffic choice. A measured cache-restoration cost or matched platform-specific prefill result could also move the estimate outside the span without any price change. The headline is not insulated from those measurements by the owner’s positive-margin sanity rule.

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Context and geometry.** The submitted interface has no independent mean-context or output-length input. Its custom/reference path uses a 1,000-token output convention; my 50:1 ratio consequently represents 50,000 input tokens, about 50,500 tokens at average decode and 51,000 at peak. It does not represent serving every request at the model’s 1M maximum. I cannot separately set the context-length distribution, prefix residence time, per-effort output distribution or long-context tail. Physical cache hits avoid repeated prefill; they do not remove the prefix from decoder attention. `customDonor` selects one frozen geometry, but cannot express Fable’s unknown layer count, expert placement, hybrid attention or KV design. The TPU throughput formula also retains a fixed 16-chip weight-traffic normalization independently of the capacity solver’s larger feasible width. S14–S16 supply these calculator conventions, not evidence that they match Fable.

**Memory-capped NVIDIA leg.** Under the inspected 1-byte-per-parameter capacity policy and 10% memory reserve, the central 8T FP8 model at the assumed peak context cannot sustain the GB200 row’s declared batch of 128 within a 72-GPU domain. The source’s fallback renders it at **37**, versus **22** in the low-margin case and **53** in the high-margin case. I retained that leg’s complete 30% weight and charged its capped cost; I did not drop the expensive leg and renormalize the survivors. This is a **capped, not policy-clean, operating point**, and no production placement was verified. The GB300 and TPU central batches remain 64 and 16 in the reconstruction. The live rerun must preserve and report these status distinctions. 

**Latency is not validated.** The raw reconstructed decode rate divided by the row’s batch implies only roughly 4–8 tokens/s per sequence under a literal one-token-per-step interpretation, versus S13’s approximately 49 streamed tokens/s. Those observations have unmatched context, thinking/fallback behavior and serving topology, so they do not yield a valid replacement aggregate rate. Nevertheless, this mismatch is a warning, not a validation: the calculator does not establish that my operating point meets the observed API latency. A matched measurement could overturn the architecture or throughput-transfer assumptions. I have not converted a single-user stream rate into per-GPU throughput. 

**Calibration uncertainty is larger than the displayed decimals.** The engine transfers a single reconstructed prefill coefficient across platforms. GB300 decode uses an assumed operating point; TPU decode uses a platform-specific aggregate-throughput bridge, not a Fable measurement. Changing all input-side cost by ±50% around my central point gives **79.97–88.70%**. That diagnostic is separate from the three submitted scenarios. There is no exposed input for a clean platform-specific prefill recalibration, and changing `stackMult` to imitate one would also move decode. I did not do that. 

**Billing and service composition.** The engine’s fresh-input interpretation of `cacheWriteShare` should be checked on the live rerun. A mixed five-minute/one-hour cache policy, safeguards and fallback-model compute, auxiliary classifiers, draft-model cost, heterogeneous precision and separate prefill/decode fleets are not individually identified by this input vector. The direct-infrastructure allowances are approximations, not measurements of these services. The requested exclusion of unbilled retries and support is maintained; those costs must not be used to compare this result directly with company gross margin.

**Unestablished facts and access limits.** I did not establish exact Fable parameters, accelerator assignments or physical serving sites; the operating status and Fable allocation of the estimated owned TPU tranche; actual negotiated rates; paid utilization; representative input/output/cache telemetry; production precision; or matched throughput and service-level performance. I could not retrieve the complete linked system card, and the full FT report was paywalled. The July company-level consult’s margin figures were not promoted into new provider facts. The live MCP remained unreachable; the public-source reconstruction matches the supplied reference but is not proof of byte-identical execution of release `809cfb27`.

**Bottom line:** the submitted vector expresses a defensible but low-confidence **approximately 84% list-price serving-margin estimate**, with **68–90% selected scenarios**. The verified tariff is firm; the conversion from an undisclosed production system to calculator cost is not.

Complete copy-of-record report (a file in the research run's own workspace, not published)