# Qwen3.8-Max — GPT-6 Astra Pro estimate (2026-09-25)

**Provenance.** One GPT-6 Astra Pro research run (ChatGPT, model `gpt-6-pro`), request `pr-20260925T070105Z-4d5c81`, answered 2026-09-25T09:36:13Z. It was given this calculator's input contract, the Claude Opus 4.x reference estimate and the live connector's scenario space, and asked to set every input for Qwen3.8-Max from public evidence. The answer is reproduced below verbatim except for three presentation changes: ChatGPT's interface citation markers are removed, as on every page of this annex; links into the research run's own sandbox (files no reader can open) keep their text and lose the dead target; and equations are set as preformatted text, with a space between a bracket and a parenthesis inside them so the renderer does not read a product as a link; its sources are cited by URL in the text (published text SHA-256 `a616239e57e33d07fc038c0eb78cc503293536e295f906c0fb9769634950a17e`; as received, `d457269f80893aace6aa8f5acac680a5d5487e034c1ef4cb9b5da3d612ce372c`).

## What the site shows

| reading | value |
|---|---|
| **Card headline** — this calculator on the run's central inputs, at list | **~79%** (79.19%) |
| Span — the run's own low- and high-margin scenarios, same engine | 72%–88% (71.85% – 88.27%) |
| The run's own stated reading | 79.2% (71.8–88.3%) |
| Same central inputs at the page's Reference traffic (15:1, 60% cache) — context, not the headline | ~78% |

The span is the author's judgment span: two scenarios it called plausible as a whole, not a probability interval and not a bound. The headline is a modeled unit direct-serving margin from public information; it is not a disclosure by the provider and not a company gross margin.

## Our reading

No Qwen model has had an estimate on this site before (the calculator's Qwen3-class donor geometry was the only Qwen trace). The run priced Alibaba's API model, qwen3.8-max (the 2026-09-02 snapshot, Singapore international tier, $2/$6, cached input at 12.5% of the input price), and established from Qwen's own model card that it is built on the open Qwen3.8-2.4T-A95B weights — "based on", which the run is careful to say is a backbone relationship and not byte identity. So the size (2.4T total, 95B active) is disclosed for the backbone and inferred for the served snapshot. The geometry is not a match for anything the calculator carries: 92 layers, of which 69 use linear attention and 23 full attention with 4 KV heads, 512 experts with 10 active. The run held it on the Qwen3-class GQA donor, a declared approximation whose direction of error it declined to call — three quarters of the layers keep no growing KV cache, which the donor does not represent. The input the run calls decisive is the hour: all of the traffic on GB300-class capacity at an assumed $3.26 all-in, about half the page's $6.00 planning rent, built up as an owned-equivalent cost (hardware, lives, electricity, operating allowance — each an assumption) rather than taken from any rental quote; no Alibaba cost figure is public. NVIDIA has published FP8 serving of this model on GB300 NVL72, which supports the hardware choice but not the share. The span (72–88%) moves the hour, utilization and, in the high case, FP4 weights. At the page's Reference traffic the same inputs compute ~78%. The run's figures match this engine to two decimals.

## The operating point

Carrier: the calculator's blank `custom` row on the `qwen3c` attention geometry (a declared approximation — this model's architecture is published but matches no stated row). `batchShare` and `discount` are 0 in every run (list basis).

| input | central | low-margin scenario | high-margin scenario |
|---|---|---|---|
| `customDonor` | qwen3c | qwen3c | qwen3c |
| `active` | 95 | 95 | 95 |
| `total` | 2400 | 2400 | 2400 |
| `precision` | fp8 | fp8 | fp4 |
| `priceIn` | 2 | 2 | 2 |
| `priceOut` | 6 | 6 | 6 |
| `cacheReadMult` | 12.5 | 12.5 | 12.5 |
| `billCacheHit` | 60 | 60 | 60 |
| `batchShare` | 0 | 0 | 0 |
| `discount` | 0 | 0 | 0 |
| `blend` | `{"gb300":100}` | `{"gb300":100}` | `{"gb300":100}` |
| `rentAbsLeg` | `{"gb300":3.26}` | `{"gb300":3.73}` | `{"gb300":3.26}` |
| `util` | 65 | 55 | 65 |
| `stackMult` | 1 | 1 | 1 |
| `trendMonths` | 0 | 0 | 0 |
| `interact` | balanced | balanced | balanced |
| `hwMode` | rent | rent | rent |
| `cacheCost` | 5 | 5 | 5 |
| `cacheWriteShare` | 0 | 0 | 0 |
| `cacheWriteMult` | 125 | 125 | 125 |
| traffic | 8:1, 60% cache | 8:1, 60% cache | 8:1, 60% cache |

## The answer, verbatim

Estimator: **GPT-6 Astra Pro** · **September 25, 2026** · Commission `pr-20260925T070105Z-4d5c81#1`.

File receipt: both uploaded files opened and were read. `03-calculator-contract-live-2026-09-25.json` begins `{"result":{"content":[{"type":"text","text":"The scenario space of the Frontier Inference Margins ca` (truncated). `04-opus-4x-reference-dive-verbatim-2026-08-08.md` begins with the line ` ```json `.

## 0 — THE CARD, IN TWO LINES.

≈79% at list (span 72–88%)  
An assumed $3.26 all-in GB300-equivalent GPU-hour is the decisive input.

## 1 — PUBLIC FACTS.

**Scope:** standard Singapore/International paid text-token serving for `qwen3.8-max-0902`, including billed reasoning tokens—not Prime, free quota, tool-service charges, or the entire multimodal service. This is modeled **unit direct-serving contribution margin**, not Alibaba’s reported gross margin. All public pages below were checked on **2026-09-25**; an access date is not represented as a publication date.

1. **S1 — Exact version: DISCLOSED.** Alibaba’s notice dated **2026-09-02** introduces `qwen3.8-max-0902`; the unpinned `qwen3.8-max` switched to that snapshot on **2026-09-05**, with pricing unchanged. The snapshot is also identified as `qwen3.8-max-2026-09-02`. I price this version, not an unspecified August checkpoint. URL: https://www.alibabacloud.com/en/notice/model_studio_update_notice_for_qwen38max_models_863?_p_lc=1 . 

2. **S2 — Standard list tariff: DISCLOSED.** Alibaba’s pricing page, last updated **2026-09-24**, lists Singapore International `qwen3.8-max` and `qwen3.8-max-0902` at **$2/M input and $6/M output**, for both Thinking and Non-Thinking modes, through the stated 1M-input tier. Output includes reasoning plus answer. Prime and other regions are separate tariff choices. The page directs account promotions to its console; I establish the public standard tariff, not undisclosed account offers. URL: https://www.alibabacloud.com/help/en/model-studio/model-pricing . 

3. **S3/S13 — Cache tariff: DISCLOSED.** The official Qwen API snapshot page lists **$0.25/M implicit-cache input**, **$2.50/M explicit-cache creation**, and **$0.17/M explicit-cache reads**. Access date: **2026-09-25**; no publication date displayed. Qwen’s own model card identifies Qwen Cloud as its official API service. Alibaba’s generic 20%-of-input implicit-cache rule explicitly excludes this model. I use implicit caching: `cacheReadMult = 100 × 0.25/2 = 12.5`, not 20 or 10. Thus the commission’s previously unverified **$2/$0.25/$6 is confirmed** for the selected service. URLs: https://www.qwencloud.com/models/qwen3.8-max-0902 and https://www.alibabacloud.com/help/en/model-studio/context-cache . 

4. **S4 — Open-weight release date: DISCLOSED.** Qwen’s release log announces availability of `Qwen3.8-2.4T-A95B` on **2026-08-12**. I use that public-release date rather than the brief’s **2026-08-08**. A repository-creation or preparatory-upload date would not by itself establish public availability. URL: https://github.com/QwenLM/Qwen3.8/blob/main/README.md . 

5. **S5 — API/open-weight relationship: DISCLOSED; snapshot-size transfer: INFERENCE.** The model card says Max is **based on** the open 2.4T-total/95B-active model, with additional features including vision, non-thinking support, expanded default context, and built-in tools. That establishes the backbone relationship, **not byte identity**. The September snapshot’s complete served architecture is not separately disclosed in the material found. My `total:2400` and `active:95` are therefore disclosed open-backbone magnitudes **transferred by inference to the priced API snapshot**. URL: https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B . Date: accessed **2026-09-25**. 

6. **S6 — Published geometry: DISCLOSED.** Selected fields are `num_hidden_layers:92`, `hidden_size:8192`, `num_attention_heads:64`, `num_key_value_heads:4`, `head_dim:256`, `full_attention_interval:4`, `num_experts:512`, and `num_experts_per_tok:10`. The layer sequence has **69 linear-attention and 23 full-attention layers**. Shared-expert and routed-expert intermediate sizes are both 2048; one MTP layer is specified. This is not ordinary all-layer GQA or DeepSeek MLA. URL: https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B/blob/main/config.json . Date: accessed **2026-09-25**, displayed revision `b15b863`. 

7. **S7 — Hardware-specific performance exists: DISCLOSED.** NVIDIA’s **2026-08-12** Qwen article demonstrates FP8 serving on **GB300 NVL72**, reporting peak throughput above 4,000 tokens/s/GPU and user output speed above 350 tokens/s. These are different performance objectives, not permission to assume both simultaneously or to identify Alibaba’s fleet. URL: https://developer.nvidia.com/blog/serve-qwen3-8-2-4t-a95b-a-2-4t-parameter-model-with-configurable-reasoning-on-nvidia-gb300-nvl72/ . 

8. **S8 — Open-stack precision and latency evidence: DISCLOSED.** The vLLM recipe, updated **2026-09-14**, supports FP8 and NVFP4 layouts. Its low-latency FP8 TP16 results are **130 output tokens/s/user without MTP and 307 with MTP-3**. Its throughput figures—up to **3,200 FP8 and 4,300 NVFP4 tokens/s/GPU**—explicitly count **input plus output**. They must not be inserted as decode-only rates. URL: https://recipes.vllm.ai/Qwen/Qwen3.8-2.4T-A95B . 

9. **S2/S7/S8 — Actual deployment and occupancy: UNKNOWN.** Singapore is the selected commercial deployment scope. I found no model-specific disclosure assigning this snapshot to particular facilities, GPU generations, token-weighted fleet shares, or paid-capacity utilization. Compatibility and benchmark deployment do not establish production allocation. Accordingly, **100% GB300 means a representative cost/performance-equivalent estate in this estimate, not a discovered inventory**. Search basis: S2/S7/S8, including https://www.alibabacloud.com/help/en/model-studio/model-pricing ; checked **2026-09-25**.

10. **S9–S11 — Calculator calibration: ASSUMED, not measured Qwen performance.** The public calculator registers GB300’s balanced batch at 64 and its decode coefficient at 0.258295; the latter is explicitly analyst-set. The donor and universal prefill calibration are likewise not a matched Qwen production measurement. Sources, accessed **2026-09-25**: https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js ; https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js ; https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js . The supplied contract also labels outputs as policy scenarios.  

11. **Hourly procurement: UNKNOWN; working cost: ASSUMED.** No Alibaba all-in GPU-hour cost was established. My **$3.26/hour** is the rounded result of the explicit owned-equivalent construction in heading 4, not a vendor quote or a discount inferred from API prices. Its component prices, lives, electricity rate and operating allowance are assumptions. S10 supplies the costing method only; it is **not evidence for my component values**. Method URL: https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js . Assumption date: **2026-09-25**. 

12. **S12 — Financial disclosure: DISCLOSED, different perimeter.** Alibaba’s **2026-08-20** report gives **$7.1B AI Cloud and Compute Services revenue**, **$830M adjusted segment EBITA**, and approximately **12% EBITA margin**. None is Qwen3.8 API revenue, direct-serving cost, or unit margin. I found no model-specific financial disclosure to substitute for the engineering estimate. URL: https://www.alibabagroup.com/en-US/document-2027233133950140416 . 

## 2 — CALCULATOR INPUTS.

Empty `source_ids` deliberately identify unsupported judgment rather than attributing invented measurements to a citation. Sources attached to inferred fleet or traffic choices motivate the scenario; they do not measure those quantities.

```json
{
  "model_id": "custom",
  "model_name": "Qwen3.8 flagship (Qwen3.8-Max / Qwen3.8-2.4T-A95B)",
  "api_model_priced": "qwen3.8-max-0902 (alias qwen3.8-max-2026-09-02), released 2026-09-02; Singapore International standard text traffic; qwen3.8-max points here from 2026-09-05",
  "customDonor": "qwen3c",
  "basis": "list",
  "context_length_assumed": "Standard <=1M tariff, but typical modeled request is 8000 input plus 1000 billed output tokens, including reasoning; representative decode context 8500, peak 9000. Reference replay: 15000 input plus 1000 output, representative 15500.",
  "central": {
    "overrides": {
      "customDonor": "qwen3c",
      "active": 95,
      "total": 2400,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 6,
      "cacheReadMult": 12.5,
      "billCacheHit": 60,
      "batchShare": 0,
      "discount": 0,
      "blend": {
        "gb300": 100
      },
      "rentAbsLeg": {
        "gb300": 3.26
      },
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 125
    },
    "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
    }
  },
  "low_margin": {
    "overrides": {
      "customDonor": "qwen3c",
      "active": 95,
      "total": 2400,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 6,
      "cacheReadMult": 12.5,
      "billCacheHit": 60,
      "batchShare": 0,
      "discount": 0,
      "blend": {
        "gb300": 100
      },
      "rentAbsLeg": {
        "gb300": 3.73
      },
      "util": 55,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 125
    },
    "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
    }
  },
  "high_margin": {
    "overrides": {
      "customDonor": "qwen3c",
      "active": 95,
      "total": 2400,
      "precision": "fp4",
      "priceIn": 2,
      "priceOut": 6,
      "cacheReadMult": 12.5,
      "billCacheHit": 60,
      "batchShare": 0,
      "discount": 0,
      "blend": {
        "gb300": 100
      },
      "rentAbsLeg": {
        "gb300": 3.26
      },
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 125
    },
    "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
    }
  },
  "stated": {"headline_pct": 79.19, "low_pct": 71.85, "high_pct": 88.27},
  "sources": [
    {"id": "S1", "claim": "The 0902 snapshot was released September 2; qwen3.8-max switched to it September 5 with pricing unchanged.", "url": "https://www.alibabacloud.com/en/notice/model_studio_update_notice_for_qwen38max_models_863?_p_lc=1", "date": "2026-09-02", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "Singapore International standard text tariff: $2 input and $6 output per million; both thinking modes; output includes reasoning and answer.", "url": "https://www.alibabacloud.com/help/en/model-studio/model-pricing", "date": "2026-09-24", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "Official Qwen API snapshot page: implicit cache $0.25/M, explicit creation $2.50/M, explicit read $0.17/M; date is access date.", "url": "https://www.qwencloud.com/models/qwen3.8-max-0902", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "Qwen release log announces the open flagship weights on August 12, rather than the August 8 date in the commission.", "url": "https://github.com/QwenLM/Qwen3.8/blob/main/README.md", "date": "2026-08-12", "evidence_class": "DISCLOSED"},
    {"id": "S5", "claim": "The open backbone has 2.4T total and 95B active parameters; Max is based on it with additional features, not asserted byte-identical; date is access date.", "url": "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S6", "claim": "Open geometry: 92 layers, hidden 8192, hybrid linear/full attention, 64 query heads, 4 KV heads, head dimension 256, 512 routed experts with top-10 and a shared expert; date is access date.", "url": "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B/blob/main/config.json", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S7", "claim": "NVIDIA demonstrates FP8 Qwen3.8-2.4T-A95B on GB300 NVL72; this is not evidence of Alibaba production allocation.", "url": "https://developer.nvidia.com/blog/serve-qwen3-8-2-4t-a95b-a-2-4t-parameter-model-with-configurable-reasoning-on-nvidia-gb300-nvl72/", "date": "2026-08-12", "evidence_class": "DISCLOSED"},
    {"id": "S8", "claim": "vLLM provides FP8 and NVFP4 serving recipes and distinguishes user output speed from aggregate input-plus-output throughput.", "url": "https://recipes.vllm.ai/Qwen/Qwen3.8-2.4T-A95B", "date": "2026-09-14", "evidence_class": "DISCLOSED"},
    {"id": "S9", "claim": "Calculator donor geometry, GB300 precision tuples and assumed operating-point calibration; date is access date, not a provider measurement.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js", "date": "2026-09-25", "evidence_class": "ASSUMED"},
    {"id": "S10", "claim": "Published calculator cost and billing implementation used for local arithmetic reconstruction; date is access date.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S11", "claim": "Published roofline equations and capacity-policy implementation; date is access date.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S12", "claim": "Alibaba reports $7.1B AI Cloud and Compute Services revenue and approximately 12% segment adjusted EBITA margin; neither is a Qwen unit serving margin.", "url": "https://www.alibabagroup.com/en-US/document-2027233133950140416", "date": "2026-08-20", "evidence_class": "DISCLOSED"},
    {"id": "S13", "claim": "Generic 20% implicit-cache pricing explicitly excludes Qwen3.8-Max; use its model-specific tariff; date is access date.", "url": "https://www.alibabacloud.com/help/en/model-studio/context-cache", "date": "2026-09-25", "evidence_class": "DISCLOSED"}
  ],
  "key_inputs": [
    {"input": "active", "central": 95, "low_margin": 95, "high_margin": 95, "source_ids": ["S1", "S5"], "evidence_class": "INFERENCE"},
    {"input": "total", "central": 2400, "low_margin": 2400, "high_margin": 2400, "source_ids": ["S1", "S5"], "evidence_class": "INFERENCE"},
    {"input": "customDonor", "central": "qwen3c", "low_margin": "qwen3c", "high_margin": "qwen3c", "source_ids": ["S6", "S9"], "evidence_class": "INFERENCE"},
    {"input": "precision", "central": "fp8", "low_margin": "fp8", "high_margin": "fp4", "source_ids": ["S7", "S8"], "evidence_class": "INFERENCE"},
    {"input": "priceIn", "central": 2, "low_margin": 2, "high_margin": 2, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "priceOut", "central": 6, "low_margin": 6, "high_margin": 6, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "cacheReadMult", "central": 12.5, "low_margin": 12.5, "high_margin": 12.5, "source_ids": ["S3"], "evidence_class": "INFERENCE"},
    {"input": "blend", "central": {"gb300": 100}, "low_margin": {"gb300": 100}, "high_margin": {"gb300": 100}, "source_ids": ["S7", "S8"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg.gb300", "central": 3.26, "low_margin": 3.73, "high_margin": 3.26, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "util", "central": 65, "low_margin": 55, "high_margin": 65, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "stackMult", "central": 1.0, "low_margin": 1.0, "high_margin": 1.0, "source_ids": ["S9"], "evidence_class": "ASSUMED"},
    {"input": "trendMonths", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "balanced", "low_margin": "balanced", "high_margin": "balanced", "source_ids": ["S9"], "evidence_class": "ASSUMED"},
    {"input": "traffic.io_ratio", "central": 8, "low_margin": 8, "high_margin": 8, "source_ids": ["S1", "S8"], "evidence_class": "ASSUMED"},
    {"input": "traffic.cache_hit", "central": 60, "low_margin": 60, "high_margin": 60, "source_ids": ["S13"], "evidence_class": "ASSUMED"},
    {"input": "billCacheHit", "central": 60, "low_margin": 60, "high_margin": 60, "source_ids": ["S13"], "evidence_class": "ASSUMED"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": [], "evidence_class": "ASSUMED"}
  ],
  "confidence": "low; tariff and open backbone are well supported, but actual fleet, all-in hourly cost, utilization and hybrid-architecture transfer are unmeasured, so this is a conditional three-scenario judgment span."
}
```

## 3 — YOUR OWN READING.

My central reading is **79.2% at list**, with a **71.9–88.3% three-scenario judgment span**. These are conditional estimates of the selected text-serving workload, not verified provider margins or a probability interval. Cost includes allocated paid idle capacity and direct host/network/serving operations, but excludes training, R&D, sales, G&A, free-tier service, customer support and unbilled retries, following the commission’s perimeter.

**Execution status matters.** I could not obtain a live MCP response: the direct connection attempt failed during name resolution, and connector discovery did not expose this service. **No `run_scenario` call returned a result.** Instead, I reconstructed the relevant published equations locally. As an arithmetic cross-check, the same reconstruction produces **82.3265%** for the supplied Opus reference vector, matching the attachment’s **82.33%** live reading. This checks the implementation and units, not either provider’s economics. The public source was read on September 25; I did not establish a byte-for-byte release binding to `809cfb27`.

The intended call is `run_scenario(model="custom", perspective="median", overrides=<central.overrides>, traffic=<central.traffic>)`; the other two calls substitute the complete corresponding objects above. The commissioning leg’s actual engine outputs should remain authoritative for the card.

**Arithmetic.** Let `r` be all-in dollars per GPU-hour, `u` paid-capacity utilization as a fraction, and `T` phase-specific tokens/s/GPU. Each phase’s cost is:

```text
c_{\rm phase}=\frac{r\times10^6}{3600\,T_{\rm phase}\,u}.
```
The central reconstruction gives **4,347.65 fresh-prefill tokens/s/GPU** and **806.02 decode tokens/s/GPU**, before occupancy. At $3.26/hour and 65% utilization:

```text
c_{\rm in}=\$0.320440/M,\qquad
c_{\rm out}=\$1.728455/M,\qquad
c_{\rm cache}=0.05c_{\rm in}.
```
Consider one million output tokens accompanied by eight million input tokens. With 60% cached, revenue and cost are:

```text
B=6+8(0.40\times2+0.60\times0.25)=\$13.60,
```
```text
C=1.728455+8(0.40+0.60\times0.05)\times0.320440
 =\$2.830770,
```
```text
M=1-C/B=79.1855\%.
```
| Local reconstruction | Fresh input cost, $/M | Output cost, $/M | Cost per workload bundle | Billings per bundle | Margin |
|---|---:|---:|---:|---:|---:|
| Central: FP8, $3.26/hour, 65% utilization | 0.32044 | 1.72845 | $2.83077 | $13.60 | **79.19%** |
| Low: FP8, $3.73/hour, 55% utilization | 0.43330 | 2.33722 | $3.82778 | $13.60 | **71.85%** |
| High: FP4, $3.26/hour, 65% utilization | 0.10681 | 1.22806 | $1.59550 | $13.60 | **88.27%** |
| Central at Reference 15:1/60% | 0.33734 | 2.32772 | $4.50359 | $20.25 | **77.76%** |

The low case combines shorter economic hardware life with additional paid slack; it does not also worsen architecture, tariff, cache rate, or stack. The high case changes **precision alone**: no cheaper procurement, higher occupancy or private efficiency bonus is stacked on top.

**Sanity checks.** Parameters are in billions, tariffs per million tokens, and rents per **GPU**, not per NVL72 rack or Grace package. `util:65` means 65%, not 0.65%. Power and hosting are already inside the hourly cost. No central negative arose. In the local capacity check, the GB300 leg remains renderable at both traffic mixes; the policy selects widths of 14 GPUs centrally and 18 at Reference. Those are calculator-selected widths, **not verified Qwen tensor-parallel layouts**. No expensive leg disappeared to manufacture the positive margin.

An independent scale check is useful but limited: the central phase rates imply approximately **2,921 total tokens/s/GPU** for an uncached 8K-input/1K-output workload. That is of the same order as the published FP8 throughput evidence, without treating a mixed-token benchmark as decode speed. The FP4 reconstruction implies roughly **6,021 total tokens/s/GPU**, above the cited vLLM figure. Different workloads and layouts prevent a matched validation; **the high endpoint is especially exposed to optimistic FP4 transfer**, not an observed achievement. 

## 4 — WHY THESE INPUTS.

**Architecture and carrier — S5, S6, S9.** The open backbone is the best identified size proxy, so I keep 95B active and 2.4T total in all three runs. I do not invent a size range for published weights merely to widen the margin span. The uncertainty is whether the September API snapshot’s text-serving path preserves those magnitudes.

The additional configuration fields compared were `linear_num_key_heads:16`, `linear_num_value_heads:128`, `linear_key_head_dim:128`, `linear_value_head_dim:128`, `linear_conv_kernel_dim:4`, `mamba_ssm_dtype:"float32"`, and `mtp_num_hidden_layers:1`. The configuration exposes recurrent linear-attention state, not an MLA latent-KV dimension. 

| Geometry comparison | Published open backbone | Chosen calculator donor |
|---|---|---|
| Layers / hidden size | 92 / 8192 | 62 / 6144 |
| Attention | 69 linear-attention + 23 full GQA | GQA throughout |
| Full-attention query / KV heads | 64 / 4 | 96 / 8 |
| Full-attention head dimension | 256 | 128 |
| Routed experts / selected | 512 / 10, plus one shared expert | Qwen3-class MoE; calculator dispatch uses top-8 |
| Recurrent attention and MTP | Present | Not represented |

**No existing open row honestly matches.** `glm47` shares the layer count but not hidden size, head geometry, expert structure or hybrid attention. `dsr1`, `kimi` and `glm` use MLA-family representations; `dsv4` and `dsv4f` use a different compressed-attention approximation. The dense `llama70` donor is less appropriate. I therefore choose **`custom` with `qwen3c`**, explicitly as an approximation—not a claim that published Qwen3.8 is a 62-layer GQA model. The permitted model/donor choices come from the supplied contract. 

The approximation is consequential. At FP8, the open model’s full-attention component alone needs `23 × 2 × 4 × 256 = 47,104` KV bytes per context token, versus `62 × 2 × 8 × 128 = 126,976` in the donor. But the real model also has recurrent state and linear-attention computation. **The 2.70× KV-component ratio is not a 2.70× total-cost penalty, nor proof that this donor supplies a one-sided cost bound.**

**Fleet and precision — S7/S8; production allocation is judgment.** I use one Blackwell-equivalent leg because GB300 has a model-specific serving demonstration and enough registered memory for the carrier at the selected operating points. The 100% weight avoids suggesting that unsupported fractional allocations are measured. It does **not** establish that Alibaba owns or exclusively uses GB300s. Older accelerators, a mixed-generation estate, or different domestic/international infrastructure would require a different estimate. FP8 is the central precision, grounded in the official benchmark; FP4 is a technically supported but unverified-production upside case. 

**All-in hourly cost — unsupported component values, explicit accounting.** My central owned-equivalent calculation assumes $80,000 per GPU of installed compute, host and network capital; five-year economic life; zero residual value; 8% capital recovery rate; $20,000 of separately allocated facility capital over 15 years; 1.75 kW IT draw including host allocation; PUE 1.15; electricity at $0.15/kWh; and $0.40/hour for maintenance and serving operations. **These are working assumptions, not Alibaba disclosures.**

For capital-recovery factor `a(i,n)=i(1+i)^n/[(1+i)^n-1]`:

```text
r=\frac{80{,}000a(0.08,5)}{8760}
 +\frac{20{,}000a(0.08,15)}{8760}
 +(1.75\times1.15\times0.15)+0.40.
```
The components are **$2.2873 + $0.2667 + $0.3019 + $0.4000 = $3.2559/hour**, rounded to **$3.26**. The low-margin case changes compute life from five to four years, giving **$3.7259**, rounded to **$3.73**. Facility recovery is not included in compute capital; network capital is not added again; electricity appears once. Utilization is applied **after** this hourly conversion, once. This method includes capital cost, rather than treating sunk hardware as free. The calculator’s rental branch consumes the resulting absolute hourly figure without adding another power bill. 

The principal procurement sensitivity is large: substituting **$6/hour** for $3.26, with everything else fixed, lowers the local central reading from **79.19% to 61.69%**. That is why the card identifies hourly cost as decisive. The $6 figure is the supplied calculator’s planning observation, not a matched all-in market quote. 

**Utilization — judgment without telemetry.** Central 65% represents a reasonably loaded shared estate with paid reserve; 55% represents additional peak provisioning and launch slack. The high case retains 65%. Holding other inputs fixed, 50% utilization gives **72.94%**, while 80% gives **83.09%**. Neither chip arithmetic efficiency nor a benchmark’s busy-period utilization is substituted for paid-capacity occupancy.

**Traffic and cache — S1/S8/S13 motivate, but do not measure, the choices.** I assume **8 input tokens per billed output token**, with **60% physical and billable cache hits**. Repeated code, documents and tool prefixes motivate reuse; reasoning tokens increase the output denominator. The public 8K/1K verification workload is a useful scale reference, not representative Alibaba telemetry. Equality of physical and billable hits is an explicit assumption. Cache reads cost 5% of fresh prefill; there is no explicit-cache writing in these scenarios. 

**Efficiency — no extra credit.** `stackMult:1`, `trendMonths:0`, and omission of `specDec` preserve the calculator’s published-practice baseline. I do not add NVIDIA’s optimized-kernel results, vLLM’s MTP benefit, and a private lead as three multipliers. The high case’s FP4 benefit enters through precision only. The default balanced latency posture remains an unmeasured production assumption.

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The supplied reference’s own statement is **83.1%, span 68–92%**, with 65% utilization, a five-leg fleet and a two-month efficiency lead. Its author explicitly declined to tune inputs to a target. The source’s selected span is not an engine confidence interval.   

On the common Reference workload, my Qwen vector gives **77.76%**, versus the supplied current-engine Opus value of **82.33%**: approximately **4.57 percentage points lower**. My own-traffic headline is **79.19%**. Comparing that directly with the old authored 83.1% mixes both traffic and engine vintages.

The following is an **ordered, local-arithmetic bridge**, not independent additive causal effects. Fleet changes first so later geometry changes are evaluated on one feasible GB300 leg. Each row changes only the stated input group from the preceding row; reversing the order changes the allocation of points.

| Change from preceding state | Margin after change | Change, percentage points |
|---|---:|---:|
| Supplied Opus reference, locally reconstructed | 82.33% | — |
| Fleet to 100% GB300, retaining Opus’s $5.70 GB300 rate | 75.42% | −6.90 |
| GB300 hourly cost to my $3.26 all-in equivalent | 85.94% | +10.52 |
| Two-month lead to zero | 83.12% | −2.82 |
| Active parameters 300B → 95B | 93.79% | +10.67 |
| Total parameters 2,500B → 2,400B | 93.79% | 0.00 |
| MLA donor → `qwen3c` GQA approximation | 92.43% | −1.36 |
| Input/output tariff $5/$25 → $2/$6 | 77.25% | −15.18 |
| Cached-input multiplier 10% → 12.5% | 77.76% | +0.51 |
| Reference 15:1 → chosen 8:1 traffic | 79.19% | +1.43 |

Utilization, central FP8 precision, stack multiplier, balanced posture, 60% physical/billed cache share, cache-cost fraction and list-only billing are unchanged and therefore contribute **zero** in this bridge. Total size still affects residency, but it does not change the active-parameter-surrogate throughput here. The fleet penalty is partly the calculator’s conservative GB300 calibration—not a general conclusion that newer hardware is worse.

The economic reading is that **lower active compute and assumed owned-equivalent procurement largely offset Qwen’s much lower tariff**. Its remaining disadvantage at Reference is not evidence of a worse company business model. The reference’s procurement and efficiency assumptions are themselves judgments; this comparison preserves them rather than silently replacing them. 

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

**The most valuable measurement is an occupied-GPU-hour accounting trace for the exact September API snapshot**, separating fresh input, cache hits, billed reasoning and answer tokens, alongside all-in paid GPU-hours. That would jointly test the representative fleet, context distribution, phase calibration and occupancy assumptions.

A higher actual hourly cost moves margin down linearly at fixed throughput. **$6/hour gives 61.69%**, already outside my three-scenario span. Conversely, cheaper owned recovery or better achieved throughput moves it up. The span is therefore not a claim that all plausible procurement arrangements lie inside it.

A faithful hybrid-architecture benchmark could move either endpoint materially. Full-attention KV is smaller than the donor’s, which could improve economics; recurrent-state traffic, larger hidden width and different expert communication can offset that. A measured fresh-prefill cost 50% above my reconstruction lowers the central margin to **75.13%**; 50% below raises it to **83.24%**, before other changes.

For the high endpoint, the decisive falsifier is **quality-preserving FP4 production throughput**. The reconstruction’s particularly large prefill gain is not established by the public aggregate throughput figures. A matched result showing only a modest end-to-end gain would bring the 88.27% endpoint down. A verified, efficient FP4 deployment could instead justify moving the central precision away from FP8.

Finally, a disclosed change in the API snapshot’s backbone, a different tariff, or telemetry dominated by very long contexts would require re-estimation, not a cosmetic confidence adjustment.

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Context length is not an independent input in this contract.** Custom traffic uses an implicit 1,000-output-token scale. At 8:1, this means 8,000 input tokens, representative decode context 8,500, and peak context 9,000. The Reference replay becomes 15,000 input, 15,500 representative and 16,000 peak. I am **not pricing average million-token requests** merely because the same list tariff extends to that tier. A real distribution with long tails cannot be represented by these averages.

**The exact hybrid geometry is outside the permitted carrier set.** The configuration is available, but the overrides cannot encode 69 recurrent layers plus 23 full-attention layers, their separate state dtypes, exact shared-expert behavior, MTP head, or snapshot-specific additions. I did not disguise this gap by shrinking active parameters or inserting a compensating private-stack multiplier. The carrier also cannot certify that a solver-selected even GPU count is a valid model-parallel deployment.

**Quantization is too coarse.** The high run selects the calculator’s FP4 tuple, including its compute and dispatch conventions. It cannot express every component that remains at higher precision, quantization metadata, quality constraints or backend-specific bottlenecks. This is a major reason to treat 88.27% as an optimistic scenario rather than a measured ceiling.

**The fleet is a surrogate, not a finding.** Neither the exact inference locations nor the actual GB300/Hopper/domestic-accelerator mix was established. Prefill and decode could use different hardware and reservation policies. The representative one-leg estate does not express those correlations, and no public evidence establishes my $80,000 compute allocation, facility allocation, power bill, asset life, cost of capital or 65% occupancy.

**Commercial and workload details remain unidentified.** I could not establish the served snapshot’s complete parameter count, production precision, paid traffic distribution, true physical-versus-billed cache relationship, explicit-cache share, reasoning intensity, unbilled work, request-length tails, latency objective or model-level financial results. No public model-wide promotional tariff superseding the standard rate was found; console-specific promotions were not inspected. Consequently no numerical promotional-price sensitivity is presented as if its tariff were known.

The explicit-cache tariff is known, but it is a **different scenario**: changing cached reads from $0.25 to $0.17 without accounting for $2.50 creation would be incomplete. As a read-price-only diagnostic, keeping costs and all other billing fixed gives **78.58%**, about 0.60 points below central. That is not an estimate of actual explicit-cache economics.

**Execution remains unverified by the live connector.** The local calculation reproduces the supplied Opus anchor and the public equations, but I have no returned MCP receipt for the three Qwen runs. The commissioning leg must rerun the declared JSON; any discrepancy should be preserved, not resolved by tuning my inputs.

The central conclusion is therefore **about 79% direct-serving contribution margin at the verified Singapore list tariff, conditional on the declared representative estate**, with **72–88% across these three coherent scenarios**. The unresolved facts are concentrated in production economics and architecture transfer—not in the identified standard token tariff.

Complete copy-of-record report (a file in the research run's own workspace, not published)
