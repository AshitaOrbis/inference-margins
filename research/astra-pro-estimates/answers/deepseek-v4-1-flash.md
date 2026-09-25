## 0 — THE CARD, IN TWO LINES.

≈59% at list (span 36–67%)  
The decisive input is $1.60 per all-in H800-equivalent hour, not a hyperscaler rental rate.

## 1 — PUBLIC FACTS.

**GPT-6 Astra Pro · September 25, 2026.** This is a modeled **unit direct-serving contribution margin**, not DeepSeek’s company gross margin or a verified provider margin. The headline prices the **off-peak USD list tariff**. The span is three coherent scenarios, not a probability interval or an all-uncertainties bound.

All three uploaded files opened and were reviewed. Their first lines, truncated where necessary, are recorded here:

| Uploaded file | First line |
|---|---|
| `03-calculator-contract-live-2026-09-25.json` | `{"result":{"content":[{"type":"text","text":"The scenario space of the Frontier Inference Margins ca` |
| `04-opus-4x-reference-dive-verbatim-2026-08-08.md` | ` ```json ` |
| `06-deepseek-gptpro.md` | `# DeepSeek — GPT-5.6 Pro deep dive` |

The contract and reference are scenario specifications; the July DeepSeek dive is a source of leads, not evidence that its prices or V4-Pro cost extrapolation still apply.   

For undated live pages, “September 25” below is the **retrieval date**, not an invented publication date.

1. **S1 — DISCLOSED: endpoint and tariff.** The provider’s pricing table maps `deepseek-flash` to **DeepSeek-V4.1-Flash**. The old `deepseek-v4-flash` and vision-experimental aliases route to the new model. Thinking and non-thinking use the same displayed tariff; I price text-only, default-thinking requests, not a separate fast or maximum-reasoning service. Per million tokens, off-peak prices are **$0.15 fresh input, $0.003 cached input, $0.60 output**; peak prices are **$0.30, $0.006, $1.20**. Thus `cacheReadMult=2`, not 10. The normal published peak windows are **01:00–04:00 and 06:00–10:00 UTC, Monday–Friday**. Source: [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing/), checked **2026-09-25**. The quoted project tariff is correct. 

2. **S2 — DISCLOSED: release and architecture change.** DeepSeek announced this release on **2026-09-10**, with the new tariff effective at **04:00 UTC**. Its causal encoder–decoder activates **8B parameters for input and 16B for output**. The endpoint is therefore not the retired 284B/13B Flash checkpoint. Source: [DeepSeek’s release announcement](https://www.deepseek.com/en/news/deepseek-v4-1-flash/), **2026-09-10**. 

3. **S3 — DISCLOSED: configuration fields compared.** The published model configuration has `num_hidden_layers=40`, `hidden_size=5120`, `num_attention_heads=64`, `num_key_value_heads=1`, `head_dim=512`, `qk_rope_head_dim=64`, and `q_lora_rank=1280`. It has **384 routed experts, one shared expert, top-6**, a **128-token sliding window**, and main-KV source layers **[2, 8, 14, 20]**. The architecture is **CED/CSA2**, not ordinary 61-layer R1 MLA. Source: [official configuration](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/raw/main/config.json), read **2026-09-25**. 

4. **S4 — DISCLOSED: distinguish parameter inventories.** DeepSeek states **552B backbone parameters plus 196B Engram conditional-memory parameters**. The repository’s Safetensors metadata displays **763B parameters** for the wider tensor inventory. These are different counting boundaries, not competing estimates of the same backbone. I use **763B as the conservative full-inventory capacity proxy**, while 16B is the disclosed decode-active magnitude. Source: [official weights repository and model card](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash), release **2026-09-10**, inventory read **2026-09-25**. The exact attribution of the remaining approximately 15B beyond backbone plus Engram is not established here. 

5. **S5 — DISCLOSED: mixed precision and memory placement are real distinctions.** Expert weights are FP4 within a mixed-precision checkpoint. Public vLLM support can place Engram tables in host memory and prefetch their deterministic lookups; this is not evidence that DeepSeek uses that exact implementation. Source: [vLLM Engram documentation](https://docs.vllm.ai/en/latest/features/engram/) and [model-specific recipe](https://recipes.vllm.ai/deepseek-ai/DeepSeek-V4.1-Flash), undated, read **2026-09-25**. Host-resident tables must not silently become either free storage or ordinary dense accelerator work. 

6. **S6 — DISCLOSED: the usable production anchor is historical.** For the trace ending **2025-02-28**, DeepSeek disclosed eight-H800 nodes, **226.75 average nodes versus 278 peak**, an **assumed $2/GPU-hour**, and **$87,072/day** of serving cost. It reported **608B input tokens**, including **342B disk-cache hits**, and **168B output tokens**; average per-node phase throughput was approximately **73,700 input tokens/s including hits** and **14,800 output tokens/s**. Average KV length was **4,989 tokens**. Source: [DeepSeek’s original serving disclosure](https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md), measurements **2025-02-27–28**, read **2026-09-25**. These are neither current Flash measurements nor instantaneous full-load hardware ceilings. 

7. **S7–S8 — DISCLOSED: current vendor asks differ from the July leads.** Omni now advertises **CNY75,000 per eight-H800 month**; Apetops advertises **CNY85,000**, with host RAM and network equipment specified. These are asking prices, not executed DeepSeek contracts. Sources: [Omni](https://www.omniyq.com/) and [Apetops](https://apetops.com/), both read **2026-09-25**. The July dive’s lower rental leads should not be carried forward as today’s verified quotes. 

8. **S9 — COMMUNITY ESTIMATE: current serving evidence does not identify production cost.** A named vLLM issue reports a DSpark test on **16 H20 GPUs** with mean acceptance length **2.817** for five-token drafts on GSM8K. Acceptance length is not an end-to-end speedup after draft execution, verification and scheduling. Source: [vLLM issue 56797](https://github.com/vllm-project/vllm/issues/56797), **2026-09-14**, read **2026-09-25**. I award no separate speculative-decoding multiplier from it. 

9. **S10 — CREDIBLY REPORTED: Huawei is relevant, but the generation matters.** Huawei announced Ascend **950** support for the preceding V4 family. Source: [Reuters](https://www.reuters.com/business/media-telecom/huawei-ascend-supernode-support-deepseek-v4-2026-04-24/), **2026-04-24**. That is not a measured V4.1-Flash allocation and does not justify putting its traffic on the calculator’s **910C** row. 

10. **UNKNOWN: current fleet, site allocation and utilization.** I could not establish V4.1-Flash’s actual accelerator mix, named serving sites, owned/rented split, all-in hourly cost, paid reserve fraction, or representative prompt/cache distribution. Neither the [current deployment documentation](https://recipes.vllm.ai/deepseek-ai/DeepSeek-V4.1-Flash) nor the [historical production disclosure](https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md) supplies those current measurements; checked **2026-09-25**. Consequently, the H800-only blend below is an **economic proxy**, not a claim that all current API tokens run on H800s. 

11. **UNKNOWN: current model-specific margin or realized-revenue bridge.** No matched current disclosure of Flash tokens, serving accelerator-hours and billings was established. The old disclosure’s hypothetical **$562,027/day** of all-R1-price revenue against **$87,072/day** of cost implies **84.51%**, not a 545% conventional margin; actual revenue was lower. Source: [original disclosure](https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md), trace ending **2025-02-28**, checked **2026-09-25**. This historical theoretical result is not imported into the estimate. 

12. **S11–S12 — DISCLOSED: calculator conventions, not provider measurements.** The public calculator provides R1 donor geometry, an H800 balanced operating point of **96 output positions per chip**, decode efficiency **0.313491**, prefill efficiency **0.17581**, and an FP4-on-H800 tuple with half-byte weight traffic but **FP8**, not native-FP4, compute. Sources: [data registry](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js), [roofline implementation](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js), and [main engine](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine.js), read **2026-09-25**. These support the reconstruction below; transferring them to this new model remains an assumption. 

13. **S13 — INFERENCE: owned-equivalent cost.** From the calculator’s $40,000 installed-system H800 planning anchor and the explicitly assumed capital and recurring costs in section 4, I derive **$1.60 per accelerator-hour**. Source anchor: [main engine](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine.js), read **2026-09-25**; derivation dated **2026-09-25**. This is my construction, not a published DeepSeek cost.

## 2 — CALCULATOR INPUTS.

The three runs hold identity, geometry proxy, traffic, tariff and serving-efficiency assumptions fixed. The low case represents rental/overflow economics with an additional reserve penalty; the high case represents cheaper, mature owned capacity. **`util=100` means no extra divisor beyond the time-averaged H800 anchor—not measured 100% GPU utilization.** Section 4 explains this accounting boundary.

```json
{
  "model_id": "custom",
  "model_name": "DeepSeek V4.1-Flash",
  "api_model_priced": "deepseek-flash -> DeepSeek-V4.1-Flash, released 2026-09-10; text-only default-thinking service; USD OFF-PEAK list tariff; no immutable served checkpoint hash established",
  "customDonor": "dsr1",
  "basis": "list",
  "context_length_assumed": "Typical 8000-token input plus 1000 billable output tokens; representative decode context 8500, terminal context 9000. This is not the one-million-token maximum-context case.",
  "central": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 16,
      "total": 763,
      "precision": "fp4",
      "priceIn": 0.15,
      "priceOut": 0.6,
      "cacheReadMult": 2,
      "billCacheHit": 60,
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100,
      "batchShare": 0,
      "discount": 0,
      "blend": {
        "h800": 100
      },
      "rentAbsLeg": {
        "h800": 1.6
      },
      "util": 100,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
    },
    "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
    }
  },
  "low_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 16,
      "total": 763,
      "precision": "fp4",
      "priceIn": 0.15,
      "priceOut": 0.6,
      "cacheReadMult": 2,
      "billCacheHit": 60,
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100,
      "batchShare": 0,
      "discount": 0,
      "blend": {
        "h800": 100
      },
      "rentAbsLeg": {
        "h800": 2.0
      },
      "util": 80,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
    },
    "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
    }
  },
  "high_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 16,
      "total": 763,
      "precision": "fp4",
      "priceIn": 0.15,
      "priceOut": 0.6,
      "cacheReadMult": 2,
      "billCacheHit": 60,
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100,
      "batchShare": 0,
      "discount": 0,
      "blend": {
        "h800": 100
      },
      "rentAbsLeg": {
        "h800": 1.3
      },
      "util": 100,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent"
    },
    "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
    }
  },
  "stated": {
    "headline_pct": 58.8,
    "low_pct": 35.6,
    "high_pct": 66.5
  },
  "sources": [
    {"id": "S1", "claim": "Provider pricing identifies deepseek-flash as DeepSeek-V4.1-Flash; off-peak USD list tariff is 0.15 miss, 0.003 hit, 0.60 output per million tokens; peak is twice this. Undated page, checked on the date shown.", "url": "https://api-docs.deepseek.com/quick_start/pricing/", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "Release and API availability on 2026-09-10; new tariff effective at 04:00 UTC; causal encoder-decoder uses 8B active for prefill and 16B for decode.", "url": "https://www.deepseek.com/en/news/deepseek-v4-1-flash/", "date": "2026-09-10", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "Published architecture configuration: 40 layers, hidden 5120, 64 query heads, one KV head, head dimension 512, 384 routed plus one shared expert, top-6, mixed FP4/FP8. Retrieval date shown.", "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/raw/main/config.json", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "Official model card: 552B backbone, 196B Engram, CSA2 and 890-byte global KV footprint; repository metadata displays a rounded 763B tensor inventory. Retrieval date shown.", "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S5", "claim": "Public implementation supports Engram host-memory offload; this is deployment capability, not DeepSeek production allocation. Retrieval date shown.", "url": "https://docs.vllm.ai/en/latest/features/engram/", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S6", "claim": "Historical production trace ending 2025-02-28: H800 nodes, time-averaged throughput, assumed 2 USD/GPU-hour, cache and traffic volumes, theoretical rather than actual revenue. Date denotes the measurement endpoint.", "url": "https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md", "date": "2025-02-28", "evidence_class": "DISCLOSED"},
    {"id": "S7", "claim": "Current vendor asking price: eight-H800 bare-metal node at CNY 75000/month; quote is not a DeepSeek contract. Retrieval date shown.", "url": "https://www.omniyq.com/", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S8", "claim": "Current vendor asking price: eight-H800 node at CNY 85000/month with host memory and network equipment specified. Retrieval date shown.", "url": "https://apetops.com/", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S9", "claim": "Named community DSpark test on sixteen H20 GPUs reports mean acceptance length 2.817, not a measured end-to-end cost multiplier.", "url": "https://github.com/vllm-project/vllm/issues/56797", "date": "2026-09-14", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S10", "claim": "Huawei announced Ascend 950 support for the preceding V4 family; this does not establish a V4.1-Flash API fleet share.", "url": "https://www.reuters.com/business/media-telecom/huawei-ascend-supernode-support-deepseek-v4-2026-04-24/", "date": "2026-04-24", "evidence_class": "CREDIBLY REPORTED"},
    {"id": "S11", "claim": "Calculator-published donor geometry, hardware coefficients, precision tuples and operating-point conventions; these are model assumptions, not DeepSeek V4.1 measurements. Retrieval date shown.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S12", "claim": "Calculator-published roofline equations used for the hand reconstruction; no live run_scenario result was obtained. Retrieval date shown.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S13", "claim": "Author-owned-equivalent cost construction uses the calculator 40000 USD/H800 installed-system planning anchor; asset life, capital charge and recurring allocations are assumptions, not provider costs.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine.js", "date": "2026-09-25", "evidence_class": "INFERENCE"}
  ],
  "key_inputs": [
    {"input": "customDonor", "central": "dsr1", "low_margin": "dsr1", "high_margin": "dsr1", "source_ids": ["S3", "S11"], "evidence_class": "ASSUMED"},
    {"input": "active", "central": 16, "low_margin": 16, "high_margin": 16, "source_ids": ["S2", "S3"], "evidence_class": "INFERENCE"},
    {"input": "total", "central": 763, "low_margin": 763, "high_margin": 763, "source_ids": ["S4", "S5"], "evidence_class": "INFERENCE"},
    {"input": "precision", "central": "fp4", "low_margin": "fp4", "high_margin": "fp4", "source_ids": ["S3", "S11"], "evidence_class": "INFERENCE"},
    {"input": "priceIn / priceOut / cacheReadMult", "central": [0.15, 0.6, 2], "low_margin": [0.15, 0.6, 2], "high_margin": [0.15, 0.6, 2], "source_ids": ["S1"], "evidence_class": "DISCLOSED"},
    {"input": "blend", "central": {"h800": 100}, "low_margin": {"h800": 100}, "high_margin": {"h800": 100}, "source_ids": ["S6", "S10"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg.h800", "central": 1.6, "low_margin": 2.0, "high_margin": 1.3, "source_ids": ["S7", "S8", "S13"], "evidence_class": "INFERENCE"},
    {"input": "util", "central": 100, "low_margin": 80, "high_margin": 100, "source_ids": ["S6", "S11"], "evidence_class": "INFERENCE"},
    {"input": "traffic.io_ratio / traffic.cache_hit / billCacheHit", "central": [8, 60, 60], "low_margin": [8, 60, 60], "high_margin": [8, 60, 60], "source_ids": ["S2", "S6"], "evidence_class": "ASSUMED"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": ["S4", "S11"], "evidence_class": "ASSUMED"},
    {"input": "stackMult / trendMonths", "central": [1.0, 0], "low_margin": [1.0, 0], "high_margin": [1.0, 0], "source_ids": ["S9", "S11"], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "balanced", "low_margin": "balanced", "high_margin": "balanced", "source_ids": ["S6", "S11"], "evidence_class": "ASSUMED"}
  ],
  "confidence": "low: prices and published geometry are identified, but the permitted carrier cannot represent the architecture faithfully and current fleet economics are not publicly measured."
}
```

## 3 — YOUR OWN READING.

My central reading is **58.8% at the off-peak list tariff**, reported as **≈59%, with a 36–67% selected span**. This is a hand reconstruction of the permitted calculator representation. **I did not obtain a live `run_scenario` response and do not represent these decimals as an executed MCP result.** The connector was not available through the installed integrations, and the direct network attempt did not reach a scenario execution.

The rerun instruction is `run_scenario` with `model="custom"`, `perspective="median"`, and the corresponding `overrides` and `traffic` objects in section 2. The carrier’s live result takes precedence for the published card; any discrepancy should be retained, not removed by adjusting an input.

**Billing arithmetic.** Normalize to one million output tokens and eight million input tokens. With 60% of input billed as cache hits:

\[
R=0.60+3.2(0.15)+4.8(0.003)=\$1.0944.
\]

No batch discount, negotiated discount or cache-write premium enters this denominator.

**Serving arithmetic.** Under the R1 donor, the unsharded KV term is \(61\times576=35,136\) bytes per context token at the selected KV precision. At representative context 8,500 and batch 96, the published H800 equations give the following calculation—not a measured Flash benchmark:

| Reconstructed quantity | Value |
|---|---:|
| Decode compute term per iteration | 3.611 milliseconds |
| Decode HBM term per iteration | 10.947 milliseconds |
| Decode fabric term per iteration | 3.193 milliseconds |
| Decode rate after the 0.313491 coefficient | 2,749.3 tokens/s/GPU |
| Prefill compute term per token | 26.257 microseconds |
| Prefill fabric term per token | 33.260 microseconds |
| Fresh-prefill rate after the 0.17581 coefficient | 5,286.0 tokens/s/GPU |

Thus decode is HBM-bound and prefill is fabric-bound **in this donor approximation**. The relevant public equations are maximum-of-compute/memory/fabric rooflines; they do not make those resource times additive. Source: [calculator roofline implementation](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js), read **2026-09-25**.

At $1.60 per accelerator-hour and no additional utilization divisor:

\[
c_{out}=\frac{1.60\times10^6}{3,600\times2,749.278}=\$0.161659/M,
\qquad
c_{fresh}=\frac{1.60\times10^6}{3,600\times5,286.005}=\$0.084079/M.
\]

With cache reads costed at 5% of fresh prefill:

\[
C=0.161659+3.2(0.084079)+4.8(0.05)(0.084079)=\$0.450892,
\]

\[
M=1-\frac{0.450892}{1.0944}=58.8001\%.
\]

Equivalently, the nine-million-token bundle costs **$0.050099 per million blended tokens** and bills **$0.121600 per million blended tokens**. “Per million output tokens plus the associated input” and “per million blended tokens” are different units, but produce the same margin when numerator and denominator match.

| Whole scenario | All-in $/H800-equivalent hour | Additional-capacity utilization | Cost per bundle | List serving margin |
|---|---:|---:|---:|---:|
| Central: owned-equivalent, historical allocation convention | 1.60 | 100% | $0.450892 | **58.8%** |
| Low: rental/overflow with extra paid reserve | 2.00 | 80% | $0.704519 | **35.6%** |
| High: cheaper mature owned capacity | 1.30 | 100% | $0.366350 | **66.5%** |

The high and low are not independent worst/best settings for every input. Most inputs do not change at all.

**Sanity check.** All three reconstructed margins are positive. Prices and costs use millions of tokens; rents are per **GPU**, not per eight-GPU node; utilization uses **100 or 80**, not 1.0 or 0.8; power and hosting are inside the hourly figure. A generic additional 70% divisor would have reduced the central reconstruction to **41.1%**. I rejected that as an unsupported second occupancy penalty on the historical time-averaged basis, not because it was negative—it was not.

**Peak pricing is a separate companion.** Doubling every tariff at unchanged serving cost gives **79.4% central**, with the same scenarios at **67.8–83.3%**. This is not a measured peak-period margin: peak workloads and utilization can differ. No separate active promotional tariff was identified. The off-peak tariff is an advertised time-band list price, not the calculator’s batch or negotiated discount.

## 4 — WHY THESE INPUTS.

**Carrier: `custom`, donor `dsr1` — declared approximation, S3/S11.** No permitted row matches a 40-layer CED/CSA2 model. The old `dsv4f` row has 43 layers, hidden size 4,096 and 256 routed experts; it lacks the new encoder–decoder execution and cross-layer cache sharing. The R1 donor is not a match either: it has 61 layers, hidden size 7,168, 128 query heads, a 576-element MLA KV representation, 58 MoE layers and top-8. I select it because the contract supplies no faithful new-architecture carrier, not because its geometry is secretly correct. The other custom donors substitute less suitable ordinary GQA/dense shapes. 

**Active 16B, total 763B, FP4 — S2–S5/S11.** Sixteen is the disclosed decode-active count; using it for prefill is an acknowledged overstatement of the 8B prefill magnitude. The full tensor inventory is a conservative capacity proxy. It must not be called 763B active work, or 763B of required HBM. The FP4 choice captures expert weight storage without claiming native FP4 H800 tensor compute. Mixed dense weights, scales and non-matmul work are not represented exactly.

**Fleet: H800 100% — judgment, S6/S10.** This is a common economic unit anchored to a DeepSeek serving disclosure, not an inferred 100% physical fleet share. I decline to fabricate a 950-to-910C conversion or claim that deployment recipes establish current API allocations. Public evidence does not identify a more defensible numerical blend.

**Central all-in rent equivalent: $1.60 — inference with explicit assumed components, S7/S8/S13.** The calculator’s $40,000 H800 installed-system planning value is an analyst anchor, not a purchase invoice. Using it, my central conversion is:

| Assumed cost component | Construction | $/accelerator-hour |
|---|---|---:|
| Installed server/accelerator capital, including base host and local network equipment | $40,000, five years, 8% capital recovery | 1.1436 |
| Electricity and cooling | 1.0 kW allocated IT load × 1.2 PUE × $0.07/kWh | 0.0840 |
| Space and recurring facility/network services | Allocated working allowance | 0.0900 |
| Hardware maintenance | 3% of installed capital/year | 0.1370 |
| Incremental cache storage, host-memory and control-plane services | Allocated working allowance | 0.1450 |
| **Total** | Rounded for the input | **1.60** |

Capital recovery uses \(K\,[i(1+i)^n/((1+i)^n-1)]/8,760\), not depreciation plus a second full financing payment. The installed-system scope means there is no extra generic rack multiplier. All component values beyond the calculator’s planning anchor are **author assumptions**, including power price; none is presented as DeepSeek’s measured procurement.

The current vendor quotes provide a separate reasonableness check. At an **assumed conversion of CNY6.80/USD**, not a claimed current exchange-rate fixing, and a 720-hour quotation month, CNY75,000–85,000 per eight-GPU node converts to approximately **$1.91–2.17/GPU-hour**. The $2.00 low-margin case is near that rental class. Contract inclusions and large-cluster services remain uncertain. The $1.30 high case assumes lower installed cost and longer reuse—for example roughly $35,000 capital over six years, plus recurring allocations—not an undisclosed discount promised by a vendor.

**Utilization: 100/80/100 — accounting inference, S6/S11.** The historical anchor divides output by time and average deployed nodes. It already contains within-deployment utilization and scheduling effects; the contract’s own historical DeepSeek replay therefore uses 100. I carry that convention centrally and assume capacity reassigned to research is not simultaneously charged to serving. The low case adds a distinct 20% paid reserve outside that time-averaged deployed cohort. It does **not** claim DeepSeek has 100% arithmetic-unit utilization, and it does not turn the historical average/peak node ratio into utilization telemetry. 

**Traffic: 8:1, 60% served and billed cache hits — judgment, S2/S6.** The historical input/output ratio was approximately 3.62:1 and disk-cache hits 56.3%. I move to a moderately more input-heavy mix for a model explicitly aimed at agentic workloads, without assuming every request is a long coding session. Eight thousand input and one thousand billable output tokens are workload assumptions, not telemetry. Equating served cache hits with billed cache hits is another explicit assumption; a disk-cache statistic alone does not establish billing classification.

**Cache cost 5%; no write premium — judgment.** I keep the calculator’s stated 5% cache-cost convention because cache footprint reductions do not by themselves measure request lookup, transfer and replay cost. A smaller storage footprint is not automatically an equal reduction in dollars per cached token. At these inputs the modeled cached-token cost slightly exceeds its tiny tariff; that does not make the **whole request mix** loss-making. I do not lower `cacheCost` merely to make every token category profitable.

**Efficiency: stack 1.0, lead zero, no separate speculative credit — judgment, S9/S11.** Public architectural improvements belong in an architecture model, not in a fictitious private-stack advantage. I do not compound a DSpark multiplier, a lead prior and an FP4 gain. `interact="balanced"` is likewise a chosen service posture, not a measured latency guarantee.

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The reference states **83.1%, span 68–92%**, on **15:1 / 60%** traffic. Attachment 02 says its unchanged vector returns **82.33%** on the commissioned engine. Its 2.5T/300B size, 65% utilization, two-month lead and strategic fleet are reference assumptions, not measurements established by this report.   

Applying my central inputs to **Reference traffic**, with billed cache share also 60%, gives a hand-reconstructed **45.1%**: revenue **$1.527** and cost **$0.837907** per one-million-output-token bundle. That is approximately **37.2 points below** the reference’s supplied current-engine 82.33%, rather than the 23.5-point difference obtained by comparing unlike headline traffic.

The following are **non-additive, one-change diagnostics around my Flash case**, not an exact attribution of that 37.2-point gap. Counterfactual prices or magnitudes are not additional claims about what DeepSeek serves.

| Input | Opus reference → this estimate | Approximate consequence |
|---|---|---|
| Uncached/output list price | $5/$25 → $0.15/$0.60 | Keeping Flash’s costs and 2% cache multiplier, Opus’s two prices would give 98.9%; the lower Flash prices remove **40.1 points**. |
| Cache-read tariff | 10% → 2% of input | At Flash’s other inputs, changing 10% to 2% removes **2.1 points**. |
| Active parameters | 300B → 16B decode; actual prefill is 8B | The saving is enormous relative to the cheap tariff. A deliberately inconsistent 300B-at-Flash-prices diagnostic gives −220.8%, versus 58.8% at 16B: **279.6 points** in that artificial comparison. This is why size and tariff effects cannot be added as independent provider facts. |
| Total-parameter capacity proxy | 2,500B → 763B | Approximately **zero direct throughput points** on this H800 active-parameter surrogate while the declared batch still fits; required capacity width changes. This is an engine property, not a statement that total size never costs money. |
| Precision | FP8 → selective-FP4 approximation | The H800 tuple’s weight-traffic change contributes approximately **3.2 points**, not a 2× end-to-end gain. |
| Fleet and procurement | H100/H200/GB200/GB300/TPU mix → H800-equivalent proxy | Not separately identified as one point contribution without the full heterogeneous replay. Locally, replacing the $1.75 H800 planning rate with $1.60 adds **3.9 points**. Using the reference’s $2.28 H100 hourly value at unchanged H800 throughput would instead remove **17.5 points**; that isolates rent, not the hardware change. |
| Utilization convention | 65 → 100, with time-averaged anchor retained | Approximately **+22.2 points** relative to imposing 65 on this same averaged-throughput case. This is principally a denominator/convention difference, not demonstrated superior physical utilization. |
| Residual efficiency | Two months → zero; stack remains 1 | Removing the reference’s 3^(2/12) efficiency factor costs approximately **6.9 points** locally. |
| Traffic | 15:1 / 60% → 8:1 / 60% | Approximately **+13.7 points**. The calculator also changes representative context from 15,500 to 8,500, so this is not solely a billing-mix effect. |
| Cache cost, batch, discount, latency posture | 5%, 0, 0, balanced → unchanged | **Zero direct points** from these unchanged controls. |

The important comparison is consequently not “a smaller model must have a higher margin.” Flash’s tariff is much lower; its architecture is more efficient in ways this carrier only partly represents; and the hourly-cost and occupancy conventions differ.

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

**The most valuable evidence would be a V4.1-Flash production disclosure matching the 2025 trace’s perimeter:** billable input/output volumes, cache classification, phase-specific accelerator-hours, hardware identities, actual all-in hourly cost, context distribution and a latency target. A matched measurement would replace both the proxy fleet and the historical calibration transfer.

There are specific thresholds. At the central mix, revenue is $1.0944 per bundle. A matched direct cost of **$0.20** would imply approximately **81.7%**, making the central reconstruction materially too pessimistic. A cost of **$0.70** would imply approximately **36.0%**, near the low scenario. Costs above **$1.0944** would be the evidence required to sustain a negative overall list margin on this exact mix; no such current measurement was found.

An actual effective hourly burden above approximately **$3.88**, with these reconstructed throughputs fixed, would also cross break-even. Here “effective” means the hourly price divided by any **additional**, not already embedded, utilization factor. Around the central case, each extra **$0.10/hour removes about 2.6 margin points**.

The disclosure most likely to move the result upward is a matched measurement of **8B prefill, CSA2 attention traffic and new expert-communication costs** under a production stack. The donor currently makes prefill fabric-bound using an older, larger communication shape. Conversely, substantial unallocated paid reserve, expensive storage-tier misses, or poorly performing mixed-precision kernels would move the estimate downward.

A DSpark acceptance statistic alone would not falsify the cost estimate. It must be accompanied by end-to-end throughput and draft/verification resource use at matched traffic and latency.

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**The architecture is the largest limitation.** CED executes different work in prefill and decode; CSA2 shares cache and indexing work across layers. The old Flash row is not an honest geometry match, but the default R1 donor is also only a placeholder. I did not change `active`, hourly cost or private-stack efficiency to hide that mismatch. The current result should be read as a conservative carrier-based estimate, **not as a demonstrated upper or lower bound on DeepSeek’s production margin**.

The new model’s published **890-byte global KV footprint** is not the same quantity as the donor’s **35,136-byte-per-context-token** KV scan term. One is stored global cache; the other is the calculator’s modeled per-step access accounting. They cannot be substituted mechanically, nor can their ratio be claimed as an end-to-end speedup. The result could lie above the selected 67% scenario if the missing architecture savings are large. Source: [official model card](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash), read **2026-09-25**, and [calculator equations](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js), read **2026-09-25**. 

**Context has no independent input in this commission.** I assume 8,000 prompt tokens plus 1,000 output tokens, giving representative decode context 8,500 and terminal context 9,000. This is a typical-request convention, not the model’s one-million-token maximum or a measurement of its median customer. The engine changes context when I/O ratio changes; an isolated “traffic mix only” comparison cannot hold absolute lengths independently fixed.

**Storage tiers and total size are not separable.** Engram can be offloaded, whereas the calculator uses one `total` scalar and a conservative loaded-bytes capacity policy. At the stated donor, 763B capacity proxy and 9,000-token terminal context, a simple 24-H800 policy check leaves room for batch 96 after the flat 10% reserve. That is a mathematical fit check, **not an observed deployment or verified runtime-memory/SLO result**. The hourly allowance includes host/storage services once; it does not repair the geometry or constitute a measured Engram bill.

**The fleet proxy cannot express heterogeneous phase allocation.** A provider could prefill on one accelerator family, decode on another, and share cache storage across both. A token-share blend of whole-model accelerator legs is not equivalent to that design. No numerical V4.1 allocation, exact site location, or validated 950-to-registered-hardware conversion was established.

**Utilization is incompletely separable from calibration.** Current occupancy was not measured. The central 100 preserves a time-averaged-anchor convention; the 80 low case is an additional reserve scenario. A newer occupied-chip benchmark would require re-estimating utilization on its own denominator rather than keeping these values automatically.

**The tariff has a time dimension the calculator lacks.** The estimate uses the off-peak USD cells, not a guessed average of peak and off-peak volume. I did not establish traffic shares by tariff window, request-boundary billing behavior, or a calendar-weighted annual effective tariff. Likewise, no separate surcharge for ordinary thinking versus non-thinking was identified; maximum-effort and image-heavy workloads are outside the stated operating point. The later pricing-page notice retains V4-Pro service, superseding the launch announcement’s intended Pro rerouting; neither version changes the direct `deepseek-flash` identity priced here. 

**Public-source and execution limits remain explicit.** I could read the official model card, architecture configuration, implementation documentation and the uploaded pack. The full technical-report PDF could not be downloaded/rendered through the available route, so I do not claim to have inspected its figures or tables. No immutable API checkpoint hash, matched current production throughput, end-to-end DSpark cost saving, provider purchase invoice, current paid-utilization series or current model-specific margin/revenue bridge was established. The public engine was inspected and its relevant equations reconstructed; **no live MCP result was obtained**. The filing leg’s rerun remains necessary, and an engine/stated-number gap must remain visible.

The complete copy of record is this Markdown report (a file in the research run's own workspace, not published).