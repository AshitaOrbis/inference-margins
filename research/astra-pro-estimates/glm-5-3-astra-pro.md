# GLM-5.3 — GPT-6 Astra Pro estimate (2026-09-25)

**Provenance.** One GPT-6 Astra Pro research run (ChatGPT, model `gpt-6-pro`), request `pr-20260925T063701Z-31c65b`, answered 2026-09-25T08:09:27Z. It was given this calculator's input contract, the Claude Opus 4.x reference estimate and the live connector's scenario space, and asked to set every input for GLM-5.3 from public evidence. The answer is reproduced below verbatim except for three presentation changes: ChatGPT's interface citation markers are removed, as on every page of this annex; links into the research run's own sandbox (files no reader can open) keep their text and lose the dead target; and equations are set as preformatted text, with a space between a bracket and a parenthesis inside them so the renderer does not read a product as a link; its sources are cited by URL in the text (published text SHA-256 `9a17f873b7287ef94b1e623b10359a8d99bfd1758ab5189ad8b40d474a6918e4`; as received, `7ba7d2471c2602752779bd24d1a044065d72d306e38e23115174f264ad12e799`).

## What the site shows

| reading | value |
|---|---|
| **Card headline** — this calculator on the run's central inputs, at list | **~74%** (74.49%) |
| Span — the run's own low- and high-margin scenarios, same engine | 36%–82% (35.57% – 81.91%) |
| The run's own stated reading | 74.5% (35.6–81.9%) |
| Same central inputs at the page's Reference traffic (15:1, 60% cache) — context, not the headline | ~70% |

The span is the author's judgment span: two scenarios it called plausible as a whole, not a probability interval and not a bound. The headline is a modeled unit direct-serving margin from public information; it is not a disclosure by the provider and not a company gross margin.

## Our reading

This card carries a wide span (36–82%), and the run is candid about why: the single decisive input is the calculator's latency posture. At `balanced` — shared batches, which the run takes as its proxy for a busy flagship API — the model computes about 74%; switching only the posture to `fast` (small, low-latency batches) costs about 39 points, and the low scenario is exactly that switch, nothing else. Nothing public says which posture Z.ai serves at, so the span is honest rather than wide by carelessness. The rest is unusually well anchored: GLM-5.3's weights are open (753B, held on the site's own GLM-5 row geometry, which the run matched field by field), the tariff is the provider's ($1.40/$4.40, cached input at $0.26 — 18.6%, not the rounded 19% the site's GLM row carries), and the fleet is priced entirely on Huawei Ascend at $2.20 per accelerator-hour. The page's own GLM 5.2 card reads about 31% on its July dive replay; the two differ mainly in rent (that replay uses the dive's 1.9× domestic rate multiplier) and in fleet mix, not in the model. For scale against the books: Zhipu's FY2025 results (HKEX filing) report an 18.9% cloud/API gross margin, and a reported H1 2026 figure 24.6% — company-level numbers on a wider perimeter than this unit serving margin. At the page's Reference traffic the same inputs compute ~70%.

## The operating point

Carrier: the stated geometry of the site's `glm` row (GLM 5.2 (744B/40B)), with every magnitude, price, fleet and traffic input from this run. `batchShare` and `discount` are 0 in every run (list basis).

| input | central | low-margin scenario | high-margin scenario |
|---|---|---|---|
| `active` | 40 | 40 | 40 |
| `total` | 753 | 753 | 753 |
| `precision` | fp8 | fp8 | fp8 |
| `priceIn` | 1.4 | 1.4 | 1.4 |
| `priceOut` | 4.4 | 4.4 | 4.4 |
| `cacheReadMult` | 18.571428571428573 | 18.571428571428573 | 18.571428571428573 |
| `billCacheHit` | 60 | 60 | 60 |
| `batchShare` | 0 | 0 | 0 |
| `discount` | 0 | 0 | 0 |
| `blend` | `{"ascend":100}` | `{"ascend":100}` | `{"ascend":100}` |
| `rentAbsLeg` | `{"ascend":2.2}` | `{"ascend":2.2}` | `{"ascend":1.8}` |
| `util` | 65 | 65 | 75 |
| `stackMult` | 1 | 1 | 1 |
| `trendMonths` | 0 | 0 | 0 |
| `interact` | balanced | fast | balanced |
| `hwMode` | rent | rent | rent |
| `cacheCost` | 5 | 5 | 5 |
| `cacheWriteShare` | 0 | 0 | 0 |
| `cacheWriteMult` | 100 | 100 | 100 |
| traffic | 10:1, 60% cache | 10:1, 60% cache | 10:1, 60% cache |

## The answer, verbatim

**File receipt — all three uploaded files opened and read before the estimate.**

| File | First line, truncated where necessary |
|---|---|
| `03-calculator-contract-live-2026-09-25.json` | `{"result":{"content":[{"type":"text","text":"The scenario space of the Frontier Inference Margins ca…` |
| `04-opus-4x-reference-dive-verbatim-2026-08-08.md` | `` ```json `` |
| `06-zhipu-gptpro.md` | `# Zhipu / Z.ai (GLM) — GPT-5.6 Pro deep dive` |

## 0 — THE CARD, IN TWO LINES.

≈74.5% at list (span 36–82%)  
The deciding input is `interact: "balanced"`: the calculator’s shared-batch throughput, rather than its low-batch `fast` posture, carries the headline.

## 1 — PUBLIC FACTS.

**GLM-5.3 · GPT-6 Astra Pro · September 25, 2026.** This is an estimate of **unit direct-serving contribution margin**, not an observed Z.ai margin or company gross margin. Source dates below are publication dates when available; otherwise they are explicitly access dates.

1. **S1–S3 — Identity and dates. `DISCLOSED`.** I price Z.ai’s first-party, metered **`glm-5.3` text API**, with **`reasoning_effort: "max"`**, not GLM-5.3-Flash, FlashX, a reseller endpoint or a Coding Plan subscription. The official release-note entry is dated **August 18, 2026**; that is the API version-date convention used here, not proof of the first moment anyone obtained access. The model always reasons; `low`, `high` and `max` share the model identity, with `max` the default. The initial weight commit’s metadata gives **`release_date: "2026-08-28T15:00:00Z"`**. Thus I do **not** adopt August 25 as the open-weight release date. Sources: [release notes](https://docs.z.ai/release-notes/new-released), **2026-08-18**; [model documentation](https://docs.z.ai/guides/llm/glm-5.3), **accessed 2026-09-25**; [initial weight commit](https://huggingface.co/zai-org/GLM-5.3/commit/7cda81930d6e4cef42f48555de830aa32ecdde28), **release metadata 2026-08-28**. 

2. **S6 — Current tariff. `DISCLOSED`.** The provider confirms **$1.40 fresh input / $0.26 cached input / $4.40 output per million tokens**. The project’s dollar prices are correct. The exact cache multiplier is **18.5714286%**, not the carrier row’s rounded 19%. **Cache storage is temporarily free; cache-token processing is not.** I found no numeric post-promotion storage tariff to price. Source: [Z.ai pricing](https://docs.z.ai/guides/overview/pricing), **undated live page, accessed 2026-09-25**. 

3. **S4, S11 — Magnitudes. `DISCLOSED` for repository size; `COMMUNITY ESTIMATE` for the active proxy.** The official weight page displays **753B parameters**, and Artificial Analysis lists **40B active**. I therefore enter **753B total / 40B active**, rather than mechanically retaining 744B from the predecessor carrier. The total is a rounded repository-level storage proxy, not a separately audited count of the exact tensors resident in Z.ai’s API service. The model card says GLM-5.3 retains GLM-5.2’s base model. Sources: [official weight repository](https://huggingface.co/zai-org/GLM-5.3) and [Artificial Analysis](https://artificialanalysis.ai/models/glm-5-3), **accessed 2026-09-25**. 

4. **S5 — Geometry and carrier. `DISCLOSED`; carrier selection is `INFERENCE`.** The fields compared are `model_type: "glm_moe_dsa"`, `num_hidden_layers: 78`, `hidden_size: 6144`, `num_attention_heads: 64`, `num_key_value_heads: 64`, `kv_lora_rank: 512`, `qk_rope_head_dim: 64`, `q_lora_rank: 2048`, `qk_nope_head_dim: 192`, and `v_head_dim: 256`; routing is `n_routed_experts: 256`, `n_shared_experts: 1`, `num_experts_per_tok: 8`, with `first_k_dense_replace: 3`. The sparse index uses `index_topk: 2048` and `index_topk_freq: 4`; `num_nextn_predict_layers: 1` identifies an MTP layer. This is **MLA plus DSA/IndexShare**, not ordinary 64-head GQA. The compressed KV representation is **512 + 64 = 576 dimensions**. **Choose `model_id: "glm"` and omit `customDonor`**: its 78-layer/6144-hidden/64-query-head geometry matches. Source: [published configuration](https://huggingface.co/zai-org/GLM-5.3/blob/main/config.json), **accessed 2026-09-25**; carrier comparison against attachment 05. 

5. **S4–S5, S14 — Precision. `DISCLOSED` artifacts; production precision `UNKNOWN`.** The repository contains FP8 and higher-precision tensors. That does not establish the provider’s serving precision. I use the calculator’s **`fp8` selection as an 8-bit serving proxy**. On its Ascend row, this explicitly resolves to **INT8 weights/arithmetic with BF16 KV**, not native FP8 execution. Sources: [weights](https://huggingface.co/zai-org/GLM-5.3), [configuration](https://huggingface.co/zai-org/GLM-5.3/blob/main/config.json), and [calculator precision registry](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js), **accessed 2026-09-25**. 

6. **S7–S8 — Fleet and location. `DISCLOSED` predecessor support; `CREDIBLY REPORTED` newer deployment scale; exact allocation `UNKNOWN`.** The June GLM-5.2 release names nine domestic online-inference platforms, including Huawei Ascend. September reporting describes domestic chips as a principal inference resource and reports 100,000-scale domestic-chip inference capability. Neither identifies GLM-5.3’s chip shares or physical serving sites. I use **100% Ascend 910C-equivalent as a declared proxy for the domestic pool**, not a claim that every actual token runs on that SKU. Sources: [Zhipu release](https://www.zhipuai.cn/zh/research/161), **2026-06-16**; [Beijing Daily, carried by Beijing’s government portal](https://www.beijing.gov.cn/fuwu/lqfw/gggs/202609/t20260901_4846055.html), **2026-09-01**. 

7. **S9 — Rental comparable. `CREDIBLY REPORTED`; all-in conversion `INFERENCE`.** SMM reports a **CNY63,000/month asking rent for an eight-card Ascend 910C Atlas 800T A3 server**, with a one-year minimum and both cloud-rental and bare-metal delivery options. It is an asking quote, not Z.ai’s contract, and inclusions are not itemized. Source: [SMM’s own report](https://news.metal.com/id/newscontent/104030369-buletin-daya-komputasi-smm-9-unit-spot-ascend-910c-atlas-800t-a3-memasuki-pasar-beijing-sewa-bulanan-63000), **2026-07-29**. My all-in central is **$2.20 per accelerator-hour**, derived under heading 4. 

8. **S10 — Procurement form and earlier accounting margin. `DISCLOSED`.** FY2025 results report a shift toward purchased computing services, capex of **RMB74.7 million versus RMB462.3 million in 2024**, and **18.9% cloud/API gross margin**. This supports a purchased-service valuation, but does not establish the ownership of the September 2026 serving fleet. Source: [HKEX FY2025 results, pages 9–10 of the PDF](https://www.hkexnews.hk/listedco/listconews/sehk/2026/0331/2026033101549.pdf), **2026-03-31**. 

9. **S8 — More recent financial evidence. `CREDIBLY REPORTED`.** H1 2026 MaaS/API revenue is reported at **RMB825 million**, with **24.6% gross margin**. The same account reports an **80% decline in unit-token inference cost from the beginning of 2026**. Neither is a GLM-5.3 list-price margin or a matched private-stack advantage over contemporary open serving. I do not turn the 80% historical decline into a fivefold efficiency multiplier. Source: [Beijing Daily report](https://www.beijing.gov.cn/fuwu/lqfw/gggs/202609/t20260901_4846055.html), **2026-09-01**, reporting results released August 31. 

10. **S11–S12 — Speed evidence. `COMMUNITY ESTIMATE` for the independent benchmark; `DISCLOSED` for the vendor benchmark.** Artificial Analysis reports **60 output tokens/s and 3.45-second time to first token** for Z.ai’s GLM-5.3 max API. These are **stream-level**, not per-accelerator throughput. Baseten’s **280+ tokens/s** result concerns its **GLM-5.2 Blackwell/NVFP4** service, not Z.ai’s domestic GLM-5.3 deployment. Sources: [Artificial Analysis](https://artificialanalysis.ai/models/glm-5-3), **accessed 2026-09-25**; [Baseten](https://www.baseten.co/blog/how-we-built-the-worlds-fastest-api-for-glm-52/), **2026-06-23**. 

11. **S2, S8, S11 — Utilization and traffic. `UNKNOWN` measurements; `ASSUMED` inputs.** I found no representative GLM-5.3 paid-capacity utilization, input/output split, cache-hit share or context-length distribution. **65% utilization, 10:1 input:output and 60% cache hits are my assumptions**, informed directionally by the coding/reasoning product and reported demand—not measured from those sources. Search basis: [model documentation](https://docs.z.ai/guides/llm/glm-5.3), [results reporting](https://www.beijing.gov.cn/fuwu/lqfw/gggs/202609/t20260901_4846055.html), and [benchmark](https://artificialanalysis.ai/models/glm-5-3), **checked 2026-09-25**.

12. **S13–S15 — Calculation evidence. `DISCLOSED` implementation, not disclosed provider economics.** I examined the calculator’s public [cost/billing implementation](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js), [data registry](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js), and [roofline implementation](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js), **accessed 2026-09-25**. The figures below are a **local arithmetic reconstruction**, not successful MCP returns. Attachment 03 itself labels calculator results as policy scenarios and gives GLM no verified SKU/workload allocation. 

## 2 — CALCULATOR INPUTS.

The `sources` entries labelled `DISCLOSED` for S13–S15 establish what the calculator publishes, **not that its coefficients are measured Z.ai operating points**. Source references on `ASSUMED` inputs identify the background evidence; they do not change those inputs into measurements.

```json
{
  "model_id": "glm",
  "model_name": "GLM-5.3",
  "api_model_priced": "glm-5.3, first-party metered text API, reasoning_effort=max; official release-note date 2026-08-18; open-weight release metadata 2026-08-28; priced as served 2026-09-25, backend checkpoint hash undisclosed",
  "basis": "list",
  "context_length_assumed": "Short-to-medium agent/text calls: representative 10,000 input plus 1,000 billed output tokens, including reasoning; decode context 10,500 and peak KV 11,000. These are assumptions, not production means; 1M is the supported ceiling, not the modeled average.",
  "central": {
    "overrides": {"active": 40, "total": 753, "precision": "fp8", "priceIn": 1.4, "priceOut": 4.4, "cacheReadMult": 18.571428571428573, "billCacheHit": 60, "batchShare": 0, "discount": 0, "blend": {"ascend": 100}, "rentAbsLeg": {"ascend": 2.2}, "util": 65, "stackMult": 1.0, "trendMonths": 0, "interact": "balanced", "hwMode": "rent", "cacheCost": 5, "cacheWriteShare": 0, "cacheWriteMult": 100},
    "traffic": {"mode": "custom", "io_ratio": 10, "cache_hit": 60}
  },
  "low_margin": {
    "overrides": {"active": 40, "total": 753, "precision": "fp8", "priceIn": 1.4, "priceOut": 4.4, "cacheReadMult": 18.571428571428573, "billCacheHit": 60, "batchShare": 0, "discount": 0, "blend": {"ascend": 100}, "rentAbsLeg": {"ascend": 2.2}, "util": 65, "stackMult": 1.0, "trendMonths": 0, "interact": "fast", "hwMode": "rent", "cacheCost": 5, "cacheWriteShare": 0, "cacheWriteMult": 100},
    "traffic": {"mode": "custom", "io_ratio": 10, "cache_hit": 60}
  },
  "high_margin": {
    "overrides": {"active": 40, "total": 753, "precision": "fp8", "priceIn": 1.4, "priceOut": 4.4, "cacheReadMult": 18.571428571428573, "billCacheHit": 60, "batchShare": 0, "discount": 0, "blend": {"ascend": 100}, "rentAbsLeg": {"ascend": 1.8}, "util": 75, "stackMult": 1.0, "trendMonths": 0, "interact": "balanced", "hwMode": "rent", "cacheCost": 5, "cacheWriteShare": 0, "cacheWriteMult": 100},
    "traffic": {"mode": "custom", "io_ratio": 10, "cache_hit": 60}
  },
  "stated": {"headline_pct": 74.4898, "low_pct": 35.5728, "high_pct": 81.911},
  "sources": [
    {"id": "S1", "claim": "Official API release-note entry is dated 2026-08-18; this is the report's API version-date convention.", "url": "https://docs.z.ai/release-notes/new-released", "date": "2026-08-18", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "glm-5.3 is text-only, always reasoning, with low/high/max effort and max default; 1M context and 128K output limits. Undated page, accessed on the date shown.", "url": "https://docs.z.ai/guides/llm/glm-5.3", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "Initial weight commit includes release_date 2026-08-28T15:00:00Z; August 25 is not established as the weight-release date.", "url": "https://huggingface.co/zai-org/GLM-5.3/commit/7cda81930d6e4cef42f48555de830aa32ecdde28", "date": "2026-08-28", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "Official weight repository shows 753B parameters and FP8/BF16 tensors; model card says same base as GLM-5.2. Access date shown.", "url": "https://huggingface.co/zai-org/GLM-5.3", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S5", "claim": "Published GLM-5.3 config supplies the quoted 78-layer MLA/DSA geometry, latent dimensions, routing, and MTP fields. Access date shown.", "url": "https://huggingface.co/zai-org/GLM-5.3/blob/main/config.json", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S6", "claim": "List USD/M tokens: input 1.40, cached input 0.26, output 4.40; cache storage temporarily free. Undated price page, access date shown.", "url": "https://docs.z.ai/guides/overview/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S7", "claim": "GLM-5.2 release names nine domestic online-inference platforms; it does not allocate GLM-5.3 traffic by chip.", "url": "https://www.zhipuai.cn/zh/research/161", "date": "2026-06-16", "evidence_class": "DISCLOSED"},
    {"id": "S8", "claim": "Beijing Daily reports H1 2026 MaaS/API revenue RMB825m and margin 24.6%, plus a company claim of 100,000-scale domestic-chip inference capability; no SKU/model allocation.", "url": "https://www.beijing.gov.cn/fuwu/lqfw/gggs/202609/t20260901_4846055.html", "date": "2026-09-01", "evidence_class": "CREDIBLY REPORTED"},
    {"id": "S9", "claim": "SMM reports an ask of CNY63,000/month for an eight-card Ascend 910C Atlas 800T A3 server, minimum one year; service inclusions are not itemized.", "url": "https://news.metal.com/id/newscontent/104030369-buletin-daya-komputasi-smm-9-unit-spot-ascend-910c-atlas-800t-a3-memasuki-pasar-beijing-sewa-bulanan-63000", "date": "2026-07-29", "evidence_class": "CREDIBLY REPORTED"},
    {"id": "S10", "claim": "FY2025 results report cloud/API margin 18.9%, capex RMB74.7m versus RMB462.3m in 2024, and a shift toward purchased computing services.", "url": "https://www.hkexnews.hk/listedco/listconews/sehk/2026/0331/2026033101549.pdf", "date": "2026-03-31", "evidence_class": "DISCLOSED"},
    {"id": "S11", "claim": "Artificial Analysis lists 40B active and measures Z.ai GLM-5.3 max at 60 output tokens/s per stream and 3.45s TTFT; neither is tokens/s/accelerator. Access date shown.", "url": "https://artificialanalysis.ai/models/glm-5-3", "date": "2026-09-25", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S12", "claim": "Baseten describes its GLM-5.2 Blackwell/NVFP4 deployment at over 280 stream tokens/s; this is not first-party Z.ai GLM-5.3 production.", "url": "https://www.baseten.co/blog/how-we-built-the-worlds-fastest-api-for-glm-52/", "date": "2026-06-23", "evidence_class": "DISCLOSED"},
    {"id": "S13", "claim": "Public calculator cost and billing implementation used for a local arithmetic reconstruction, not a successful MCP execution. Access date shown.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S14", "claim": "Calculator-authored geometry, precision, calibration and operating-point registry; these are model assumptions, not provider measurements. Access date shown.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S15", "claim": "Public roofline, capacity and implicit-length equations used for the reconstruction. Access date shown.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"}
  ],
  "key_inputs": [
    {"input": "active", "central": 40, "low_margin": 40, "high_margin": 40, "source_ids": ["S5", "S11"], "evidence_class": "COMMUNITY ESTIMATE"},
    {"input": "total", "central": 753, "low_margin": 753, "high_margin": 753, "source_ids": ["S4"], "evidence_class": "DISCLOSED"},
    {"input": "precision", "central": "fp8", "low_margin": "fp8", "high_margin": "fp8", "source_ids": ["S4", "S5", "S14"], "evidence_class": "INFERENCE"},
    {"input": "blend", "central": {"ascend": 100}, "low_margin": {"ascend": 100}, "high_margin": {"ascend": 100}, "source_ids": ["S7", "S8"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg.ascend", "central": 2.2, "low_margin": 2.2, "high_margin": 1.8, "source_ids": ["S9", "S10"], "evidence_class": "INFERENCE"},
    {"input": "util", "central": 65, "low_margin": 65, "high_margin": 75, "source_ids": ["S8"], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "balanced", "low_margin": "fast", "high_margin": "balanced", "source_ids": ["S11", "S14"], "evidence_class": "ASSUMED"},
    {"input": "stackMult", "central": 1.0, "low_margin": 1.0, "high_margin": 1.0, "source_ids": ["S8", "S12", "S14"], "evidence_class": "ASSUMED"},
    {"input": "trendMonths", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": ["S8", "S14"], "evidence_class": "ASSUMED"},
    {"input": "traffic.io_ratio", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S2"], "evidence_class": "ASSUMED"},
    {"input": "traffic.cache_hit and billCacheHit", "central": 60, "low_margin": 60, "high_margin": 60, "source_ids": ["S2"], "evidence_class": "ASSUMED"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": ["S13"], "evidence_class": "ASSUMED"},
    {"input": "priceIn / priceOut / cacheReadMult", "central": [1.4, 4.4, 18.571428571428573], "low_margin": [1.4, 4.4, 18.571428571428573], "high_margin": [1.4, 4.4, 18.571428571428573], "source_ids": ["S6"], "evidence_class": "DISCLOSED"}
  ],
  "confidence": "low: identity, tariff and geometry are well grounded, but fleet allocation, all-in procurement, occupancy, representative context and the throughput-versus-latency tradeoff are not measured; the span is three coherent scenarios, not a confidence interval."
}
```

## 3 — YOUR OWN READING.

**My central reading is 74.49% at list, with a selected three-scenario span of 35.57–81.91%.** Rounded for the card: **approximately 74.5%, span 36–82%**. This is a judgment span, not a probability interval or an exhaustive bound.

**Execution receipt.** The public MCP endpoint could not be reached from this runtime: the attempted connection failed at name resolution. I received **no `run_scenario` result**. The intended replay is `run_scenario` with `model: "glm"`, `perspective: "median"`, and each complete scenario’s `overrides` and `traffic` above. I reconstructed the relevant public-code branch in Python; I did **not** execute a byte-identical copy of the entire deployed engine. The publisher’s live-engine rerun should therefore remain authoritative, including any discrepancy.

**Central arithmetic.** Use a bundle containing **one million output tokens and ten million input tokens**. At 60% cache hits, it contains four million fresh and six million cached input tokens. Undiscounted billings are:

```text
B=4.40+4(1.40)+6(0.26)=\$11.56.
```
The reconstructed operating point gives **2,504.93 fresh-prefill tokens/s per occupied accelerator** and **704.21 output tokens/s per occupied accelerator**. These are modeled rates, not observations. With all-in rent `r=\$2.20` and paid-capacity utilization `u=0.65`:

```text
c_{\rm fresh}=\frac{2.20\times10^6}{3600\times2504.93\times0.65}
=\$0.375328/{\rm M},
```
```text
c_{\rm output}=\frac{2.20\times10^6}{3600\times704.21\times0.65}
=\$1.335069/{\rm M}.
```
At `cacheCost: 5`, cached-input cost is **$0.018766/M**. Thus:

```text
C=1.335069+4(0.375328)+6(0.018766)=\$2.948979,
```
```text
m=1-C/B=1-2.948979/11.56=\mathbf{74.4898\%}.
```
The equivalent **per million mixed tokens** figures are **$1.050909 billings**, **$0.268089 serving cost**, and **$0.782820 contribution**.

| Authored scenario | What changes from central | Fresh-input cost, $/M | Output cost, $/M | Mixed-token cost, $/M | Serving margin |
|---|---|---:|---:|---:|---:|
| Central | Balanced; $2.20/hour; 65% utilization | 0.3753 | 1.3351 | 0.2681 | **74.49%** |
| Low margin | **Only** latency posture becomes `fast` | 0.3753 | 5.8339 | 0.6771 | **35.57%** |
| High margin | Balanced; $1.80/hour; 75% utilization | 0.2661 | 0.9467 | 0.1901 | **81.91%** |
| Reference companion | Central inputs, but 15:1/60% traffic | 0.4208 | 1.8837 | 0.2874 | **69.63%** |

The low scenario represents a service that sacrifices batch efficiency for responsiveness; it does not also assume expensive procurement, low utilization and worse precision. The high scenario represents steadier committed demand with lower all-in rates; it does not add FP4, speculative-decoding or private-stack credits. Those are coherent operating cases rather than compounded best/worst corners.

**Negative-margin check.** None of the three authored runs is negative. I checked billions versus raw parameter counts, dollars per million versus per thousand tokens, **one accelerator versus an eight-card server**, percentage utilization versus fractions, and the absolute context implied by custom traffic. No extra power or hosting charge is applied after the all-in rent. The central figure was not moved to clear zero.

## 4 — WHY THESE INPUTS.

**Geometry and size — S4, S5, S11.** The `glm` carrier is the closer match than the default DeepSeek donor: its attention and layer shape match the published configuration. The **753B** total replaces the predecessor’s **744B** storage proxy; in these runs that change does not cross a batch-capacity threshold and therefore changes the reconstructed margin by **0.00 points**. I keep **40B active** as the rounded public proxy. An exact served-checkpoint parameter and MTP accounting disclosure would supersede it.

**Fleet and procurement — S7–S10; judgment remains substantial.** The public evidence favors domestic inference, but gives no defensible numerical vendor split. Assigning invented percentages to nine vendors would not improve it. `{"ascend": 100}` is therefore a **homogeneous cost/performance proxy**, not a measured fleet composition.

For the rental conversion I assume **CNY6.70/USD** and **730 hours/month**, neither represented as a verified September 25 FX fixing:

```text
\frac{\text{CNY }63{,}000}{8\times730\times6.70}
=\$1.6101/\text{accelerator-hour}.
```
I allow **$0.5899/hour** to complete the unspecified service bundle and cover the difference between a server offer and an operable clustered service, yielding **$2.20 all-in**. This allowance is **ASSUMED**, not an itemized power bill. It covers missing hosting, power, networking and serving infrastructure **once**; it must shrink if those are already included in a comparable contract. The upside **$1.80** assumes a largely bundled, efficiently procured service. Neither value is an observed Z.ai rate or an owned-hardware depreciation calculation. The procurement-form evidence supports rental valuation, but current ownership remains unresolved.

**Utilization — S8; `ASSUMED`.** I choose **65%**, not the earlier dive’s 75%, because aggregate demand growth does not establish useful occupancy after peak provisioning, maintenance and load imbalance. **75%** is reserved for the steadier high-margin case. At unchanged other inputs, 55% utilization would lower the central estimate to **69.85%**; 75% raises it to **77.89%**.

**Traffic — S2; `ASSUMED`.** Ten input tokens per output token represents repeated code/context input with a material reasoning-output stream. Sixty percent cache reuse represents recurring system instructions and agent prefixes, without importing a particular free-use event as provider telemetry. I equate **serving cache hits and billed cache hits** because I found no basis for a systematic difference. The representative **10,000-input/1,000-output call includes billed reasoning output**; it is not an estimate of answer-only length or whole-agent-task length.

**Latency posture — S11, S14; `ASSUMED` and decisive.** Balanced is my best proxy for a multiplexed flagship API, but the **38.92-point loss** when changing only to `fast` is the largest controlled uncertainty demonstrated here. Neither posture is verified to reproduce Z.ai’s measured latency. The central point must not be advertised as a matched production deployment.

**Efficiency — S8, S12, S14.** I use **`stackMult: 1.0`, `trendMonths: 0` and no `specDec`** in every run. Improvements already embodied in public serving practice or calibration should not be credited again. Historical cost reductions, a third-party Blackwell implementation, and post-training token efficiency do not establish an additional, portable Z.ai private-stack multiplier. Open practice can already include sophisticated kernels and MTP; zero extra credit does not mean an unoptimized server.

**Caching and billing — S6, S13.** `cacheCost: 5` is a working cost assumption, not a measurement. Cache-write premium share is zero; no discounted batch or negotiated billing is assumed. The “batch” in shared serving has **no relationship to `batchShare`**, which remains zero. Current free cache storage adds no separate customer charge; a future storage price could not be calculated without both its tariff and residence time.

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The comparison target is the reference author’s **83.1% at list, span 68–92%**, on 15:1/60% traffic—not an observed Anthropic margin. The supplied summary says the unchanged vector now computes **82.33%**. Its central vector includes 65% utilization, two months’ lead, FP8, $5/$25 pricing and the specified NVIDIA/TPU blend.  

My **own-traffic headline is 7.84 points below the current-engine Opus reference**, or 8.61 points below its author’s stated 83.1%. The **69.63% Reference-traffic companion** is the cleaner comparison: **12.70 points below 82.33%**, or 13.47 below 83.1%.

The following sensitivities are **deliberately non-additive**. Each states its conditioning; mixing them into a waterfall would double-count interactions.

| Input | GLM-5.3 versus reference | Approximate margin-point significance |
|---|---|---|
| Fresh/output tariff | $1.40/$4.40 versus $5/$25 | Keeping the reference’s $10.51365 cost per Reference bundle, changing only those prices while retaining 10% cache pricing moves 82.33% to **25.22%: −57.11 points**. This is repricing the reference, not estimating GLM cost. |
| Cache tariff | 18.5714% versus 10% of fresh-input price | In that repriced reference bundle, correcting cached input from $0.14 to $0.26 adds **5.33 points**, reaching **30.56%**. |
| Active parameters | 40B versus assumed 300B | Far less compute and active-weight traffic. On my fixed GLM hardware/traffic, replacing 40B with 300B adds **$10.61** cost per bundle, a **91.77-point penalty**. That intentionally hybrid diagnostic is **not an Opus estimate**. |
| Total parameters | 753B versus 2,500B | Storage demand is about 70% lower. On my central point, either total still permits the declared batch at an allowed width: **approximately zero marginal points locally**, not zero real deployment importance. |
| Attention geometry | 78-layer GLM MLA/DSA versus the reference’s DeepSeek-class approximation | Substituting the reference geometry on my otherwise fixed point gives 76.31%: GLM’s registered geometry costs **about 1.82 points**. This does not model its sparse-attention benefit faithfully. |
| Fleet and hourly procurement | Domestic Ascend-equivalent versus h100 5%, h200 10%, gb200 25%, gb300 20%, tpu7 40% | The reference’s share-weighted rent is $3.75235/hour versus $2.20. Applying that rent **alone** to my Ascend proxy costs **18.00 points**. It is a price-level diagnostic, not a performance-equivalent fleet comparison; the separate fleet-performance effect is not identified here. |
| Utilization | 65% versus 65% | **Zero central difference**. The high-margin case’s 75% is not attributed to the reference. |
| Extra efficiency | Zero months versus two; both stack 1 | Giving my point two months at 3×/year would add **4.27 points**. I decline that unsupported extra credit. |
| Traffic | 10:1/60% versus 15:1/60% | Moving my vector to Reference traffic subtracts **4.86 points**, including the engine’s implied context-length and batch-cap changes—not solely a billing-mix change. |
| Precision, cache cost and list basis | Both use the 8-bit selector, 5% cache cost and zero billing discounts | No scalar-setting difference, but the Ascend selector means INT8/BF16-KV. It is **not** identical numerical precision to NVIDIA FP8. No independent precision/fleet effect can be isolated from that label alone. |

The economic explanation is therefore **much cheaper active computation fighting a much lower tariff**, with domestic throughput and latency assumptions deciding how much of that advantage survives. The earlier Zhipu dive’s approximately 60% is neither a target nor a validation: it used different component costs and 8:1/41% traffic, and explicitly left production throughput and chip allocation unresolved.  

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

The most valuable measurement is **billable fresh-input and generated-output throughput per paid accelerator-hour, jointly measured on GLM-5.3 at a disclosed context distribution, cache policy and latency target**. It must state all devices used, including separate prefill capacity. A stream-speed number or a decode-pool-only result is insufficient.

A production operating point resembling the calculator’s **low-batch case** would move the estimate **down toward 36%** even without expensive procurement. Conversely, evidence supporting the balanced throughput at **$1.80 all-in and 75% utilization** would move it **up toward 82%**. These are the two endpoint mechanisms, not claims that either is observed.

At the central point, **each extra $1/accelerator-hour costs about 11.60 margin points**. The rental-only break-even rate is approximately **$8.62/hour** at the assumed throughput and utilization. This is a falsifiable cost threshold, not a reason to assume that any lower rate is Z.ai’s actual contract.

The inherited prefill transfer is also material: multiplying only fresh/cache serving costs by **0.5–1.5** moves the central result to **81.47–67.51%**. That is a diagnostic outside the three authored runs.

Finally, a representative length trace showing substantially longer calls would undermine the headline’s traffic assumption. Evidence of domestic INT4 experts, effective sparse-KV access or stronger batching could move costs the other way. Such evidence should replace the specific affected assumptions, not be piled onto both efficiency knobs.

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Absolute length is missing from the input contract.** Custom traffic completes through an assumed **1,000-token output length**: at 10:1, input is 10,000, representative decode context 10,500 and peak KV 11,000. At Reference 15:1 they become 15,000, 15,500 and 16,000. I state those lengths rather than describing either calculation as “a 1M-context model at full context.” As an **off-contract arithmetic diagnostic**, doubling both lengths at the same ratio/cache share lowers my dense-MLA reconstruction to **60.46%**; that is not an additional MCP run. The observed 81,000-token-input ncode event in the project is not a justified fleet-wide mean. 

**Geometry is selected, not freely specified.** The `glm` carrier matches the core architecture, but its registered dense-MLA traffic does not faithfully implement DSA/IndexShare, MTP verification, expert placement or mixed tensor precision. Its older registered context ceiling also does not express GLM-5.3’s full 1M capability. The dense reading can overstate long-context attention traffic; that does **not** make the whole serving-cost estimate a proven upper bound.

**Capacity fit is conditional, not verified.** My reconstruction retains the calculator’s uniform loaded-weight policy and 10% memory reserve. The central and low/high points use its allowed 128-device worker shape; balanced batch 96 fits that policy. At Reference traffic, batch 96 does not fit either registered Ascend worker width; the numerical path caps it at **76**, using width **144**. Consequently the companion is a **capped policy output**, not evidence that the originally declared operating point is feasible. The 384-device supernode’s total size is not substituted for a worker width.

**The latency mismatch remains unresolved.** My central branch produces roughly **136 ms per modeled decode iteration**, whereas the independent API benchmark’s 60 tokens/s corresponds to about **17 ms per streamed token**. The workloads and batching/speculation conventions are not matched, so their ratio is not an admissible efficiency multiplier. Nevertheless, this is a real failure to establish an SLO-consistent deployment, not a cosmetic caveat. The low `fast` branch is not a successful latency calibration either.

**Domestic hardware coverage is incomplete.** There are no calculator rows for most named domestic platforms, nor a verified GLM-5.3 token allocation, site list, lease/ownership split, executed all-in rate or matched Ascend production benchmark. The SMM server quote does not itself establish CloudMatrix-scale fabric economics. The all-in allowance and homogeneous proxy carry that uncertainty; neither proves deployment.

**Current accounting data do not close the gap.** The reported H1 2026 **24.6%** MaaS/API margin is substantially below this modeled unit margin. I cannot reconcile that difference without realized prices, model/subscription mix and directly attributable cost allocations. I do not assert that discounts, idle capacity or support explain a particular number of points. Nor do I promote the earlier 18.9% result into a current-model constraint.

**Other unresolved facts:** the exact backend checkpoint behind the rolling API alias; the first moment of API availability; production quantization and fallback rates; MTP acceptance and draft costs; representative paid-capacity utilization; billable-versus-served cache differences; cache residence time and its eventual storage tariff; and a byte-identical live-engine execution receipt. These gaps are why confidence is **low**, despite firm tariff and geometry evidence.

**The estimate to publish is therefore 74.5% at list, span 36–82%, explicitly attributed to this assumed operating point—not a verified Z.ai margin.**

Complete copy-of-record report (a file in the research run's own workspace, not published)
