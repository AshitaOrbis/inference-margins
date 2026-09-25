## 0 — THE CARD, IN TWO LINES.

≈88% at list (span 77–92%)  
The decisive assumption is $2.20 per all-in H800-equivalent accelerator-hour, not a disclosed Moonshot procurement rate.

## 1 — PUBLIC FACTS.

**Author: GPT-6 Astra Pro. Research date: September 25, 2026 UTC, September 24 in America/Dawson_Creek.** This estimates unit direct-serving contribution margin, not company gross margin. Dates below distinguish publication or event dates from retrieval dates; an access date does not establish when a tariff changed.

**File receipt.** All three uploaded files opened and were read: `03-calculator-contract-live-2026-09-25.json` — first line, truncated: `{"result":{"content":[{"type":"text","text":"The scenario space of the Frontier Inference Margins ca`; `04-opus-4x-reference-dive-verbatim-2026-08-08.md` — first line: `` ```json ``; `06-moonshot-gptpro.md` — first heading: `# Moonshot AI (Kimi) — GPT-5.6 Pro deep dive`. The first is the supplied calculator contract, not empirical evidence of Moonshot’s economics. The other two are attributed prior estimates, not provider disclosures.   

1. **S1 — DISCLOSED: identity and release.** I price Moonshot’s first-party API identifier **`kimi-k3`**, with **`reasoning_effort="max"`**, the default reasoning setting. Moonshot’s official timeline dates API availability to **July 16, 2026** and full weight release to **July 27, 2026**. The API offers low/high/max reasoning effort under the same identifier; I did not establish an immutable, dated endpoint alias or its currently deployed checkpoint hash. This is not the consumer Agent Swarm product. Sources: [official product timeline](https://www.kimi.ai/help/agent/agent-overview) and [model card, S2](https://huggingface.co/moonshotai/Kimi-K3); pages undated, retrieved **2026-09-25**. 

2. **S4–S6 — DISCLOSED: the quoted token prices are correct, with a cache-write qualification.** The current standard tariff is **$3.00 fresh input / $0.30 cache hit / $15.00 output per million tokens**, before applicable taxes. Five-minute cache writes cost **$3.00/M**, and one-hour writes **$6.00/M**. A five-minute write replaces ordinary input billing for those tokens; it is not another $3 layered on top. Sources: [pricing page, S4](https://platform.kimi.ai/docs/pricing/chat), [platform’s numeric tariff, S5](https://platform.kimi.ai/), and [cache guide, S6](https://platform.kimi.ai/docs/guide/context-caching); undated, retrieved **2026-09-25**. I use default five-minute caching, no one-hour-write premium, no discounted batch traffic, and no negotiated discount. I found no separate current promotional per-token K3 tariff in these pages. 

3. **S2–S3 — DISCLOSED: size and architecture.** The released model has **2.8 trillion total parameters and 104 billion active parameters**, with **69 KDA and 24 gated-MLA attention layers**. The context ceiling is **1,048,576 tokens**; that is not a measurement of average served context. Sources: [model card, S2](https://huggingface.co/moonshotai/Kimi-K3) and [published config, S3](https://huggingface.co/moonshotai/Kimi-K3/blob/main/config.json), whose displayed initial revision is `c5d1dd4`; retrieved **2026-09-25**. The fields compared for carrier selection are:

   | Public K3 field or configuration | K3 value | Supplied `dsr1` donor |
   |---|---:|---:|
   | `num_hidden_layers` / `hidden_size` | 93 / 7168 | 61 / 7168 |
   | `num_attention_heads` | 96 | 128 |
   | Attention form | KDA plus gated MLA | MLA throughout |
   | `num_key_value_heads` / `kv_lora_rank` | 96 / 512 | MLA compressed latent |
   | `qk_nope_head_dim` / `qk_rope_head_dim` / `v_head_dim` | 128 / 64 / 128 | 128 / 64 / 128 |
   | Routed experts / selected per token / shared | 896 / 16 / 2 | 256 / 8 / 1 |
   | Dense-first layers / MoE layers | 1 / 92 | 3 / 58 |
   | `num_nextn_predict_layers` | 0 | No K3-specific acceleration implied |

   The config’s KV-head count must **not** be read as ordinary 96-head GQA. None of the offered rows matches this hybrid. I choose **`custom` with `customDonor:"dsr1"`**, retaining the compressed-attention family but explicitly approximating depth, heads, routing and recurrent state. The `kimi` row is K2 geometry, not K3 geometry.  

4. **S2–S3 — DISCLOSED, with a production UNKNOWN: quantization.** Moonshot describes native **MXFP4 weights and MXFP8 activations** with quantization-aware training. The released quantization is selective, not proof that every parameter or runtime tensor occupies four bits. **The first-party API’s actual kernel/precision path is not established.** Sources: the [model card](https://huggingface.co/moonshotai/Kimi-K3) and [config](https://huggingface.co/moonshotai/Kimi-K3/blob/main/config.json), retrieved **2026-09-25**. My `fp4` input represents the published low-bit weight regime, subject to the material Hopper fallback caveat in heading 7. 

5. **S7 — DISCLOSED: historical serving, not today’s K3 deployment.** The Mooncake authors report production on A800/H800 clusters, thousands of nodes and more than 100 billion tokens daily. This establishes a real serving lineage, not present utilization or K3 throughput. Source: [Mooncake, USENIX FAST ’25](https://www.usenix.org/conference/fast25/presentation/qin), published **February 2025**, retrieved **2026-09-25**. 

6. **S8 — CREDIBLY REPORTED: Hopper access; exact serving location UNKNOWN.** Reuters, relaying Bloomberg on **2026-07-31**, reported access to roughly 20,000 Hopper-generation chips through Alibaba. Reuters could not independently confirm the report; Alibaba specifically denied supplying H200s. That supports a Hopper-class proxy, not a precise SKU, campus, ownership split or K3 allocation. Source: [Reuters report](https://www.reuters.com/business/retail-consumer/moonshot-has-nvidia-chip-cluster-alibaba-computing-deal-bloomberg-news-reports-2026-07-31/). 

7. **S9 — COMMUNITY ESTIMATE: useful K3 serving measurements, but no matched first-party cost observation.** SGLang reports **4,550 prefill tokens/s/GPU on GB200** at 8,192 input tokens, concurrency 32, PP16×TP1. This is a prefill-stage measurement, not output throughput or an end-to-end API cost. Its documentation distinguishes verified configurations from configurations still being verified, and describes a **Marlin W4A16** path outside native Blackwell execution. A forced speculative-acceptance benchmark setting is not measured production acceptance. Source: [SGLang’s K3 cookbook](https://docs.sglang.io/cookbook/autoregressive/Moonshotai/Kimi-K3), undated, retrieved **2026-09-25**. I found no matched K3/H800 measurement with complete topology, latency, cache and paid-time denominators. 

8. **S10–S11 — DISCLOSED observations; INFERENCE for the all-in rent.** The vendor advertises **CNY75,000/month for eight H800s**. At the **2026-09-24** CFETS central parity of **CNY6.7489/USD**, and an assumed 730 hours/month, this is **$1.9029 per accelerator-hour**. I round upward to **$2.20 all-in**, allowing approximately $0.30/hour for the gap between an advertised rental bundle and a serving allocation including network/cache/control-plane resources. That allowance and the bundle interpretation are judgments, not quoted components. Sources: [vendor, S10](https://www.omniyq.com/), undated offer retrieved **2026-09-25**; [CFETS statement republished by Sina, S11](https://finance.sina.com.cn/jjxw/2026-09-24/doc-iniswvxc5391561.shtml), dated **2026-09-24**. No Moonshot contract rate is disclosed. 

9. **UNKNOWN: actual utilization and traffic. ASSUMED: this report’s working values.** I found no representative first-party K3 telemetry for paid-capacity utilization, input/output ratio, cache-hit share, average context or latency distribution. The central choices—**65% utilization, 12:1 input/output and 70% cache hits**—are authored judgments, not inferred measurements. Repeated coding/tool histories motivate the traffic direction, but do not identify its magnitude. Relevant public descriptions: [model card, S2](https://huggingface.co/moonshotai/Kimi-K3), [platform, S5](https://platform.kimi.ai/) and [cache guide, S6](https://platform.kimi.ai/docs/guide/context-caching), retrieved **2026-09-25**.

10. **S12 — CREDIBLY REPORTED: company revenue; product margin UNKNOWN.** Cailian Press reported on **2026-06-30** that ARR exceeded **$300 million in mid-June**, with API revenue exceeding **70%** of the total. This predates K3 and is not audited K3 revenue, inference expenditure or contribution margin. Source: [Cailian report republished by Sina](https://finance.sina.com.cn/roll/2026-06-30/doc-inifehke3518487.shtml). I found no public K3 serving-cost or serving-margin disclosure. 

11. **S13–S15 — DISCLOSED calculator implementation, not disclosed provider economics.** The public code supplies the equations and hardware calibration used for my hand reconstruction. Sources: [roofline implementation, S13](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js) and [registries, S14](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js), retrieved **2026-09-25**; [prefill reconstruction, S15](https://margins.ashitaorbis.com/research/input-cost-reconstruction), dated **2026-09-20**. The universal prefill coefficient is a transferred calibration, not a K3 measurement.   

## 2 — CALCULATOR INPUTS.

The three scenarios are conditional judgments on one declared Hopper-equivalent carrier. `sources[].date` is the publication date where specified, otherwise the explicitly identified retrieval date. Empty `source_ids` denotes an assumption without a public measurement behind it.

```json
{
  "model_id": "custom",
  "model_name": "Kimi K3",
  "api_model_priced": "kimi-k3; reasoning_effort=max; API release 2026-07-16; weights released 2026-07-27; no immutable dated API alias established",
  "customDonor": "dsr1",
  "basis": "list",
  "context_length_assumed": "Text-dominant standard API; 1000 billed output tokens/request assumed, with 12000/16000/8000 input tokens in central/low/high; representative decode contexts 12500/16500/8500. Not average 1M-token requests.",
  "central": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 104,
      "total": 2800,
      "precision": "fp4",
      "priceIn": 3,
      "priceOut": 15,
      "cacheReadMult": 10,
      "billCacheHit": 70,
      "batchShare": 0,
      "discount": 0,
      "blend": {
        "h800": 100
      },
      "rentAbsLeg": {
        "h800": 2.2
      },
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
    },
    "traffic": {
      "mode": "custom",
      "io_ratio": 12,
      "cache_hit": 70
    }
  },
  "low_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 104,
      "total": 2800,
      "precision": "fp4",
      "priceIn": 3,
      "priceOut": 15,
      "cacheReadMult": 10,
      "billCacheHit": 65,
      "batchShare": 0,
      "discount": 0,
      "blend": {
        "h800": 100
      },
      "rentAbsLeg": {
        "h800": 2.6
      },
      "util": 50,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 8,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
    },
    "traffic": {
      "mode": "custom",
      "io_ratio": 16,
      "cache_hit": 65
    }
  },
  "high_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 104,
      "total": 2800,
      "precision": "fp4",
      "priceIn": 3,
      "priceOut": 15,
      "cacheReadMult": 10,
      "billCacheHit": 60,
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
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 0,
      "cacheWriteMult": 100
    },
    "traffic": {
      "mode": "custom",
      "io_ratio": 8,
      "cache_hit": 60
    }
  },
  "stated": {
    "headline_pct": 87.8,
    "low_pct": 76.6,
    "high_pct": 91.9
  },
  "sources": [
    {
      "id": "S1",
      "claim": "Official timeline: K3 API launch July 16, 2026; weights July 27. Undated page; date is retrieval.",
      "url": "https://www.kimi.ai/help/agent/agent-overview",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S2",
      "claim": "K3 model card: 2800B total, 104B active, native quantization, API identity and reasoning modes. Date is retrieval.",
      "url": "https://huggingface.co/moonshotai/Kimi-K3",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S3",
      "claim": "Published K3 architecture fields, initial config revision c5d1dd4. Date is retrieval.",
      "url": "https://huggingface.co/moonshotai/Kimi-K3/blob/main/config.json",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S4",
      "claim": "First-party inference-pricing page: list basis, tax exclusion, cache-write rules. Date is retrieval.",
      "url": "https://platform.kimi.ai/docs/pricing/chat",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S5",
      "claim": "First-party numeric tariff: input 3, output 15, default cache write 3, cache hit 0.30 dollars/M tokens. Date is retrieval.",
      "url": "https://platform.kimi.ai/",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S6",
      "claim": "Five-minute writes cost 3, one-hour writes 6, hits 0.30; input categories do not overlap. Date is retrieval.",
      "url": "https://platform.kimi.ai/docs/guide/context-caching",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S7",
      "claim": "Mooncake, FAST 2025: historical A800/H800 production and over 100B tokens/day. Publication February 2025; date is retrieval.",
      "url": "https://www.usenix.org/conference/fast25/presentation/qin",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S8",
      "claim": "Reuters relays Bloomberg report of roughly 20000 Hopper chips via Alibaba; exact K3 serving allocation unestablished.",
      "url": "https://www.reuters.com/business/retail-consumer/moonshot-has-nvidia-chip-cluster-alibaba-computing-deal-bloomberg-news-reports-2026-07-31/",
      "date": "2026-07-31",
      "evidence_class": "CREDIBLY REPORTED"
    },
    {
      "id": "S9",
      "claim": "SGLang K3 recipes and measurements; Hopper W4A16 fallback, hybrid state, GB200 prefill observation. Date is retrieval.",
      "url": "https://docs.sglang.io/cookbook/autoregressive/Moonshotai/Kimi-K3",
      "date": "2026-09-25",
      "evidence_class": "COMMUNITY ESTIMATE"
    },
    {
      "id": "S10",
      "claim": "Vendor advertised eight-H800 monthly quote CNY75000; not Moonshot procurement. Date is retrieval.",
      "url": "https://www.omniyq.com/",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S11",
      "claim": "CFETS official statement republished by Sina: September 24 central parity CNY6.7489/USD.",
      "url": "https://finance.sina.com.cn/jjxw/2026-09-24/doc-iniswvxc5391561.shtml",
      "date": "2026-09-24",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S12",
      "claim": "Cailian Press report: mid-June ARR above USD300M and API revenue above 70%; not audited K3 margin.",
      "url": "https://finance.sina.com.cn/roll/2026-06-30/doc-inifehke3518487.shtml",
      "date": "2026-06-30",
      "evidence_class": "CREDIBLY REPORTED"
    },
    {
      "id": "S13",
      "claim": "Calculator's published roofline equations; implementation disclosure, not measured Moonshot economics. Date is retrieval.",
      "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S14",
      "claim": "Calculator registries: donor geometry, precision tuples, operating points, calibration and legal widths. Date is retrieval.",
      "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js",
      "date": "2026-09-25",
      "evidence_class": "DISCLOSED"
    },
    {
      "id": "S15",
      "claim": "Calculator documents universal-transfer prefill limitations and sensitivity.",
      "url": "https://margins.ashitaorbis.com/research/input-cost-reconstruction",
      "date": "2026-09-20",
      "evidence_class": "DISCLOSED"
    }
  ],
  "key_inputs": [
    {
      "input": "active / total",
      "central": [
        104,
        2800
      ],
      "low_margin": [
        104,
        2800
      ],
      "high_margin": [
        104,
        2800
      ],
      "source_ids": [
        "S2",
        "S3"
      ],
      "evidence_class": "DISCLOSED"
    },
    {
      "input": "customDonor",
      "central": "dsr1",
      "low_margin": "dsr1",
      "high_margin": "dsr1",
      "source_ids": [
        "S3",
        "S14"
      ],
      "evidence_class": "INFERENCE"
    },
    {
      "input": "precision",
      "central": "fp4",
      "low_margin": "fp4",
      "high_margin": "fp4",
      "source_ids": [
        "S2",
        "S3",
        "S9",
        "S14"
      ],
      "evidence_class": "INFERENCE"
    },
    {
      "input": "priceIn / priceOut / cacheReadMult",
      "central": [
        3,
        15,
        10
      ],
      "low_margin": [
        3,
        15,
        10
      ],
      "high_margin": [
        3,
        15,
        10
      ],
      "source_ids": [
        "S4",
        "S5",
        "S6"
      ],
      "evidence_class": "DISCLOSED"
    },
    {
      "input": "blend",
      "central": {
        "h800": 100
      },
      "low_margin": {
        "h800": 100
      },
      "high_margin": {
        "h800": 100
      },
      "source_ids": [
        "S7",
        "S8"
      ],
      "evidence_class": "INFERENCE"
    },
    {
      "input": "rentAbsLeg.h800",
      "central": 2.2,
      "low_margin": 2.6,
      "high_margin": 2.0,
      "source_ids": [
        "S10",
        "S11"
      ],
      "evidence_class": "INFERENCE"
    },
    {
      "input": "util",
      "central": 65,
      "low_margin": 50,
      "high_margin": 80,
      "source_ids": [],
      "evidence_class": "ASSUMED"
    },
    {
      "input": "traffic.io_ratio",
      "central": 12,
      "low_margin": 16,
      "high_margin": 8,
      "source_ids": [
        "S2",
        "S5"
      ],
      "evidence_class": "ASSUMED"
    },
    {
      "input": "traffic.cache_hit / billCacheHit",
      "central": [
        70,
        70
      ],
      "low_margin": [
        65,
        65
      ],
      "high_margin": [
        60,
        60
      ],
      "source_ids": [
        "S6"
      ],
      "evidence_class": "ASSUMED"
    },
    {
      "input": "cacheCost",
      "central": 5,
      "low_margin": 8,
      "high_margin": 5,
      "source_ids": [],
      "evidence_class": "ASSUMED"
    },
    {
      "input": "cacheWriteShare / cacheWriteMult",
      "central": [
        0,
        100
      ],
      "low_margin": [
        0,
        100
      ],
      "high_margin": [
        0,
        100
      ],
      "source_ids": [
        "S6"
      ],
      "evidence_class": "INFERENCE"
    },
    {
      "input": "stackMult / trendMonths",
      "central": [
        1.0,
        0
      ],
      "low_margin": [
        1.0,
        0
      ],
      "high_margin": [
        1.0,
        0
      ],
      "source_ids": [],
      "evidence_class": "ASSUMED"
    },
    {
      "input": "interact",
      "central": "balanced",
      "low_margin": "balanced",
      "high_margin": "balanced",
      "source_ids": [],
      "evidence_class": "ASSUMED"
    },
    {
      "input": "context_length_assumed.input_tokens / output_tokens",
      "central": [
        12000,
        1000
      ],
      "low_margin": [
        16000,
        1000
      ],
      "high_margin": [
        8000,
        1000
      ],
      "source_ids": [],
      "evidence_class": "ASSUMED"
    }
  ],
  "confidence": "low: the tariff and released architecture are identified, but actual serving hardware, precision, paid-capacity utilization, traffic and K3-specific throughput are not; margins are hand reconstructions, not returned MCP results."
}
```

## 3 — YOUR OWN READING.

**My reading is 87.8% at list, with a three-scenario judgment span of 76.6–91.9%, rounded on the card to 88% and 77–92%.** These are hand reconstructions of the published calculator branches, **not returned MCP results**. The span is neither a probability interval nor a bound on all possible architectures, contexts or deployments.

I could not obtain a numeric `run_scenario` response from the MCP endpoint. Connector discovery found no available integration, and direct access did not succeed. The intended replay is `run_scenario`, with `model="custom"`, `perspective="median"` and each complete `overrides`/`traffic` pair in heading 2. I therefore do not invent a call receipt or claim that the deployed release reproduced these numbers.

**Revenue.** Normalize the central traffic to one million output tokens and twelve million input tokens. Of the input, 3.6 million are fresh/default-write tokens and 8.4 million are hits:

\[
R = 3.6(3.00)+8.4(0.30)+1(15.00)=\$28.32.
\]

That is **$2.17846 per million mixed input-plus-output tokens**. Default writes are already in the $3 category.

**Cost.** My reconstruction uses the donor’s 61-layer MLA geometry, the registered H800 balanced batch of 96, and the H800 low-bit-weight fallback: 0.5 byte/weight, one byte/KV element, FP8 compute basis. The relevant public coefficients are decode efficiency 0.313491 and prefill efficiency 0.17581. These are calculator assumptions/calibrations, not Moonshot measurements. Sources S13–S14, retrieved 2026-09-25.   

At the assumed 12,000-token input and 1,000-token output, the representative decode context is 12,500. The reconstructed rates are approximately **1,463 fresh-prefill tokens/s/GPU** and **1,071 output tokens/s/GPU**. These are aggregate per-accelerator service rates, not a user stream’s speed.

For either phase:

\[
C_{\$/M}=
\frac{r_{\$/GPUh}\,10^6}
{3600\,T_{\mathrm{tokens/s/GPU}}\,(u/100)}.
\]

Thus, at $2.20/hour and 65% paid-capacity utilization:

\[
C_{\rm fresh}= \$0.642752/M,\qquad
C_{\rm output}= \$0.878106/M.
\]

Cache-read work is assumed to cost 5% of fresh prefill. The central traffic bundle therefore costs:

\[
C=12[0.30+0.70(0.05)] (0.642752)+0.878106
=\$3.461969,
\]

\[
m=1-\frac{3.461969}{28.32}
=87.7755\%.
\]

The mixed-token cost is **$0.26631/M**. Input and cache processing contribute **74.6% of modeled direct cost**; this is not an output-only margin disguised as a blended one.

| Scenario | Input/output; cache hits | All-in $/GPU-hour; utilization | Fresh input cost $/M | Output cost $/M | Bundle revenue | Bundle cost | Margin |
|---|---|---|---:|---:|---:|---:|---:|
| Central | 12:1; 70% | $2.20; 65% | 0.6428 | 0.8781 | $28.32 | $3.4620 | **87.78%** |
| Low margin | 16:1; 65% | $2.60; 50% | 1.0290 | 1.5424 | $34.92 | $8.1607 | **76.63%** |
| High margin | 8:1; 60% | $2.00; 80% | 0.4548 | 0.5557 | $26.04 | $2.1203 | **91.86%** |
| Central at Reference traffic | 15:1; 60% | $2.20; 65% | 0.6630 | 0.9725 | $35.70 | $5.2488 | **85.30%** |

Each bundle contains one million output tokens plus the stated multiple of input tokens.

**Sanity checks.** Parameters are entered in billions; tariffs are per million tokens; the vendor’s eight-GPU node quote is divided by eight; utilization is 65, not 0.65; and the maximum context window is not substituted for average context. The public capacity policy admits the declared batch at minimum H800 widths of approximately **88/144/64 GPUs** for central/low/high, respectively, and **128** for Reference traffic. Those are solver-policy calculations, not observed deployment widths. All three modeled margins are positive; no negative result was turned positive by changing units or inventing revenue. The low scenario is close to the registered memory boundary, discussed below. Sources S13–S14.  

## 4 — WHY THESE INPUTS.

**Size and carrier — 104B active, 2,800B total; S2–S3, S14.** I retain the released magnitudes in every run. I neither charge 2.8T parameters as if they were all active nor infer active size by multiplying total size by the expert-selection fraction. Shared, attention and other parameters make that shortcut inappropriate. The donor is a necessary approximation, not a declaration that K3 is DeepSeek R1. Actual hybrid-attention measurements could move cost in either direction. 

**Fleet — H800-equivalent 100%; S7–S8.** This is a one-leg economic proxy for a Hopper-centered serving estate, not a literal inventory assertion. I do not assign unsupported percentages to H20, H200, Ascend or Blackwell. Holding the proxy fixed also avoids making the upper scenario depend simultaneously on cheaper procurement and a wholly different, unverified fleet. A disclosed production allocation would replace the proxy rather than merely tighten its error bars.

**Procurement — $2.20 central, $2.60 low-margin, $2.00 high-margin; S10–S11.** The conversion is:

\[
75{,}000/(8\times730\times6.7489)=\$1.9029/GPUh.
\]

The central uplift is an inferred all-in allowance, not a second power bill. **Accelerator, power, hosting, networking and allocated serving infrastructure are all contained in `rentAbsLeg`; none is added elsewhere.** The endpoint rents represent a less favorable capacity bundle versus a well-procured commitment near the vendor proxy. They do not assert that Moonshot receives either contract. This is a rental-equivalent calculation; I do not claim owned hardware and consequently do not invent an owned-capex amortization schedule. The earlier attachment’s CNY59,000 H800 quote is not the current vendor quote.  

**Utilization — 65/50/80%; ASSUMED, no public measurement.** These mean productive use of paid serving capacity, not tensor-core utilization. The low scenario represents uneven load or fragmented reserved capacity; the upper one represents better scheduling and sustained demand. None is implied by a queue, subscription pause or benchmark run. At otherwise central settings, 50% gives approximately **84.1%**, and 80% gives **90.1%**. That sensitivity shows why utilization needs a real denominator.

**Traffic — 12:1 and 70% cache centrally; ASSUMED, motivated by S2/S5/S6 rather than measured by them.** My working picture is text-dominant coding and tool use with repeated histories. Low-margin traffic has longer contexts, somewhat less reuse and more expensive cache work. High-margin traffic has shorter contexts and better capacity use, but **lower**, not higher, cache hits than the central case. It does not take every favorable setting simultaneously. The 1,000-token average billed output length is an additional unmeasured convention, not a claim that max-effort answers are always short.

**Precision — `fp4`; INFERENCE from S2/S3, constrained by S9/S14.** The released low-bit regime is a better weight-traffic proxy than BF16 throughout. Nevertheless, an H800 cannot be treated as native Blackwell MXFP4 hardware. The calculator’s fallback and the public Hopper recipe are not identical. I leave that discrepancy visible instead of mislabeling a compensating multiplier as a measured private-stack advantage. 

**Efficiency — `stackMult=1`, `trendMonths=0`, no `specDec`; ASSUMED neutral residual.** Published serving techniques belong in the public baseline. I award no additional private advantage for the same techniques, no capability-lag-to-cost conversion, and no speculative-decoding credit without measured acceptance and draft cost. Zero is not proof that Moonshot has no private advantage; it is the point at which I decline to claim one.

**Cache and billing — `cacheCost=5/8/5`, `billCacheHit=70/65/60`; ASSUMED cost and traffic.** Billing and serving cache shares are explicitly equal here, not silently inherited. `cacheWriteShare=0` with `cacheWriteMult=100` is the economic encoding of **no premium-bearing writes**, not a claim that no cache entries are created. Under default writes, this produces the correct denominator. A hypothetical 10% of all input billed as one-hour writes, with everything else unchanged, would raise the central margin to approximately **89.2%** through the extra premium; that is a tariff sensitivity, not assumed traffic. S6. 

**Latency — `balanced` in all runs; ASSUMED.** I do not equate the internal batching posture with discounted Batch API billing. `batchShare=0` and `discount=0` remain fixed even though ordinary online serving batches concurrent requests.

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The supplied reference states **83.1% at list, span 68–92%**, with 300B active/2.5T total, FP8, 65% utilization and two months of efficiency lead. Its tariff is $5/$25, and its traffic is 15:1 with 60% cache hits. The supplied current-engine replay is **82.33%**, not 83.1%; I preserve that distinction rather than calibrating K3 to either number.   

My K3 central vector at that same traffic reconstructs to **85.30%**, about **3.0 percentage points above 82.33%**. Own-traffic K3 is another **2.48 points higher**. Thus, the card-to-card difference is partly workload, not simply model efficiency.

The following effects are **one-change diagnostics on the K3 Reference-traffic reconstruction**, not an additive waterfall from the real Opus architecture:

| Input | K3 versus supplied Opus reference | Approximate margin-point significance |
|---|---|---|
| Active parameters | 104B versus 300B | Substituting 300B into the K3 carrier lowers its result from 85.30% to 63.61%: **21.7 points**. This isolates size, not a claim about actual Opus throughput. |
| Total parameters | 2.8T versus 2.5T | **0 direct points in this binding branch** while batch and membership stay fixed; resident-memory width changes. Near a feasibility boundary this ceases to be a small or continuous effect. |
| Weight precision | FP4 proxy versus FP8 | Switching K3’s weight path to FP8 gives 83.94%: **1.36 points lower**. No native FP4 compute doubling is credited on H800. |
| List tariff | $3/$15 versus $5/$25; both cache reads 10% | Giving K3 Opus’s tariff produces 91.18%: the lower K3 tariff costs **5.88 points** at this operating point. |
| Hardware mix | H800-equivalent 100% versus H100 5%, H200 10%, GB200 25%, GB300 20%, TPU7 40% | **No independently defensible fleet-only point attribution established.** Hardware, precision, topology and transferred coefficients change together; a token-share-weighted average rent is not a throughput-adjusted cost. |
| Procurement | K3 $2.20 all-in; reference rates implied by its factors are $2.28/$3.496/$4.275/$5.70/$2.70 in the above order | As a procurement-only scale check, replacing $2.20 with the page’s $1.75 H800 planning rent raises K3 by **3.01 points**. This is not an actual fleet substitution or evidence that the cheaper quote has the same scope. |
| Utilization | 65% versus 65% | **0 central points.** At 50%, K3’s Reference result loses **4.41 points**. |
| Efficiency | Stack 1 in both; K3 lead 0 versus Opus lead 2 | Giving K3 the same two-month lead raises its result by **2.46 points**. I do not award it. |
| Traffic | Own K3 12:1/70% versus Reference 15:1/60% | **+2.48 points** for own traffic; this also changes the calculator’s implied absolute context. |
| Cache cost, writes, discounts and posture | Both central cache cost 5%, no write premium, no batch discount, no negotiated discount, balanced posture | **0 direct difference** on these central settings. |
| Architecture carrier | Declared K3 hybrid approximation versus the reference’s own model representation | **Not identified separately.** A zero-point assignment would falsely imply a validated architectural transfer. |

The reference’s procurement factors are judgments, not disclosed contracts; its own text explicitly prevents family and per-leg discounts from being multiplied twice. I likewise use one absolute rent, with no additional family discount.  

The earlier Moonshot report is a different comparison again: its approximately **81%** reading was **K2.7 output-only** at $4/M. It explicitly declined to turn that into a blended provider margin. I have not carried that percentage forward or multiplied it by the tariff increase. 

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

**The most valuable measurement is K3’s fresh-prefill and decode throughput per paid accelerator-hour, at its real precision, traffic and latency targets.** It would test both the transferred calibration and the utilization divisor without confusing per-user speed with aggregate throughput.

The central reconstruction spends $2.584 of its $3.462 bundle cost on input/cache processing. Consequently, with decode unchanged, **50% higher prefill cost lowers margin to 83.2%; twice the prefill cost lowers it to 78.7%**. Half the prefill cost raises it to **92.3%**. These are explicit arithmetic sensitivities, not extra scenarios added to the card span.

A disclosed all-in effective rent of **$2.60 rather than $2.20**, with the other central assumptions unchanged, lowers the result to **85.6%**. A measured 50% utilization instead of 65% lowers it to **84.1%**. Better procurement or higher paid-capacity utilization moves it upward. If production throughput is already averaged over paid capacity, applying the utilization divisor again would be double-counting and must be removed.

A verified W4A16-dominated Hopper prefill path, with roughly half the assumed effective compute throughput, would favor the **78.7%** diagnostic rather than the central reading. Conversely, a matched K3 hybrid-attention deployment demonstrating materially lower total service work could support a higher result. Neither direction follows merely from the architecture’s marketing name.

Finally, a representative context/output-length distribution dominated by very long sessions would falsify the chosen traffic proxy, even if the price, parameters and rental rate were exactly right. **The 77–92% span does not insure the estimate against an entirely different production workload.**

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Hybrid geometry is the largest representation gap.** The donor charges a full MLA attention stack where K3 combines recurrent and compressed-attention layers, and substitutes different expert-routing geometry. K3’s state-management costs do not disappear just because fewer layers scan a growing KV history. I therefore do **not** call the donor a conservative cost bound. Correct treatment needs KDA recurrent state, gated-MLA history, attention-residual behavior, actual routing and physical placement, not just the total and active parameter sliders. Sources S3, S9, S13–S14.  

**Precision is not one scalar.** The engine’s H800 `fp4` tuple means four-bit weight traffic with an FP8 compute basis; SGLang’s documented non-Blackwell path can instead use W4A16. The interface cannot separately set weight, activation and KV formats or the share of operations executed by each kernel. Choosing BF16 would wrongly double the modeled weight footprint too. I do not hide this mismatch in `stackMult` or `trendMonths`. The central assumes the more efficient low-bit-weight/eight-bit-compute representation; production evidence for that exact K3/H800 path remains missing. S9, S14.  

**Context is not an independent input.** I assume 1,000 billed output tokens per request, including any billed reasoning, and 12,000/16,000/8,000 input tokens. The resulting representative decode lengths are 12,500/16,500/8,500; peak lengths are 13,000/17,000/9,000. These are conditioning assumptions, not observed averages. A maximum-effort workload could have much longer outputs. The calculator cannot express that distribution, multimodal encoder work or long tails through the supplied traffic object. It also cannot vary the I/O ratio while independently holding both absolute token lengths fixed.

**Feasibility is policy, not deployment verification.** The hand check uses the engine’s loaded-weight planning policy and flat 10% memory reserve. At the low scenario’s 144-H800 boundary, only about **0.18 GB per device** remains beyond that policy allocation at the declared batch. Unmodeled state, workspace or fragmentation could require a lower batch or different topology. I did not establish real placement, service-level compliance, or the deployed wrapper’s exact feasibility receipt. Any replay that drops a leg or changes the effective batch must report that change rather than silently compare a different fleet. S13–S14.  

**Prefill calibration remains transferred.** The published calculator carries one prefill-efficiency anchor across platforms and models. A bespoke K3 prefill coefficient is unavailable through this contract, as is an independently specified prefill/decode fleet. The sensitivity in heading 6 makes the resulting exposure visible; a private efficiency credit would not repair an architectural or calibration mismatch. The historical production anchor may also embed its original occupancy; I cannot separate that effect from implementation efficiency. The 65% forward utilization divisor is therefore another unmeasured transfer, not an independently verified correction. S15. 

**Facts not established:** the immutable served K3 checkpoint; the exact production GPU types and shares; named physical serving sites; owned-versus-rented allocation; contract costs and bundle inclusions; actual hosted quantization; measured K3/Hopper prefill and decode economics; paid-capacity utilization; per-user and tail-latency targets; absolute context/output distributions; billed versus physical cache reuse; one-hour-write share; multimodal traffic share; private-stack advantage; speculative acceptance and draft overhead; and K3-specific direct cost, gross profit or margin.

**Execution limitation.** I read the public implementation but did not execute the deployed MCP engine or verify public-source/deployed-release byte identity. The figure beside the card is therefore explicitly a hand reconstruction. The project’s rerun should retain the declared vector and publish any numerical gap, rather than adjust a dial to recover 87.8%.

**Publication judgment:** use **≈88% at list, span 77–92%, low confidence**, accompanied by the **custom-MLA geometry approximation and unverified production operating point**. This is a positive, reproducible conditional estimate—not a verified Moonshot margin.

Download the complete copy-of-record report (a file in the research run's own workspace, not published)