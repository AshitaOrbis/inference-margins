# RECOVERED — GPT-5.6 Pro dive: LLM Inference Unit Margin Estimate (blinded model-generated cross-check)

# Estimate as of July 15, 2026

## Bottom line

I estimate that **about $0.73 of each list-price revenue dollar survives the steady-state marginal cost of serving frontier-model tokens**.

That is the result for a synthetic, equal-revenue basket of three representative high-end APIs and a workload of **4 million uncached input tokens plus 1 million output tokens**:

| Representative model | Estimated direct serving cost per $1 of revenue | Unit serving margin |
|---|---:|---:|
| OpenAI GPT‑5.5 | $0.038 | **96.2%** |
| Google Gemini 3.1 Pro Preview | $0.282 | **71.8%** |
| DeepSeek V4 Pro | $0.480 | **52.0%** |
| **Equal-dollar basket** | **$0.267** | **73.3%** |

The cross-model median is **71.8%**. My practical scenario range for the equal-dollar basket is **47%–89%**, or roughly **$0.50–$0.90 surviving per revenue dollar**. This is a modeled range, not a statistical confidence interval.

The large spread is economically intuitive: OpenAI’s premium list price leaves substantial room over compute cost; DeepSeek’s aggressive pricing sits much closer to estimated serving cost; Google is between them.

## 1. Metric definition

I define **unit serving margin**, or USM, as:

\[
\text{USM}
=
\frac{\text{list-price token revenue}-\text{steady-state marginal serving cost}}
{\text{list-price token revenue}}
=
1-\frac{C_{\rm serve}}{R}
\]

“Marginal” here means the cost of the **next sustained block of production traffic**, including the incremental accelerator capacity and associated serving infrastructure it requires. It is not the nearly zero short-run cash cost of putting one extra token through an otherwise idle accelerator.

For \(N_i,N_o\) million input and output tokens:

\[
R=P_iN_i+P_oN_o
\]

\[
C_{\rm serve}
=
\frac{10^6 H K}{3600U}
\left(
\frac{N_i}{T_i}+\frac{N_o}{T_o}
\right)
\]

where:

- \(P_i,P_o\): list prices in dollars per million tokens.
- \(H\): rental-equivalent dollars per accelerator-hour.
- \(T_i,T_o\): effective prefill and decode tokens/sec/accelerator.
- \(U\): production realization factor, incorporating idle time, SLA headroom, imperfect batching and traffic variability.
- \(K\): direct-serving overhead multiplier for host CPUs, networking, KV storage, routing, moderation/safety inference, failed requests and control-plane services.

My central common assumption is **\(K=1.20\)**, with a **1.10–1.35** range. No satisfactory public direct-serving-overhead anchor exists, so this is explicitly an analyst assumption.

This metric excludes training, post-training, research, model development, data acquisition, sales and marketing, general corporate costs, stock compensation and customer support. It is therefore **not company gross margin**.

### Standard workload

I use:

- 4 million uncached input tokens
- 1 million output tokens
- Standard online API pricing
- Short/medium context pricing tier
- No Batch, Flex, Priority or regional-processing premiums
- No tool, search, sandbox or media charges

The 4:1 mix is a transparent comparison workload, not a claim about industry traffic mix. I also report standalone input and output margins so the result can be reweighted.

---

# 2. Dated public-claim ledger

| Date | Claim and primary source | Source-quality assessment | Can it anchor the model? |
|---|---|---|---|
| **2026-07-15** | GPT‑5.5 standard short-context pricing was **$5/M input and $30/M output**. Source: <https://developers.openai.com/api/docs/pricing>, accessed 2026-07-15. | Vendor price disclosure; high quality for current list price. | **Yes — $/token.** |
| **2026-04-23** | OpenAI disclosed that GPT‑5.5 was co-designed for, trained with and served on **NVIDIA GB200 and GB300 NVL72** systems. It also said production partitioning improvements increased token-generation speed by more than 20%. Source: <https://openai.com/index/introducing-gpt-5-5/>. | Production-hardware disclosure, but without model throughput or fleet economics. | Hardware family: **yes**. Tokens/sec/chip or $/hour: **no**. |
| **2026-07-15** | CoreWeave listed four-GB200 configurations at **$42/hour**, or **$10.50/GPU-hour**. Its eight-B200 configuration was $68.80/hour on demand and $34.87/hour spot, or $8.60 and $4.36/GPU-hour. Nebius listed B200 at $7.15 on demand and $3.95 preemptible. Sources: <https://www.coreweave.com/pricing> and <https://nebius.com/prices>, accessed 2026-07-15. | Vendor cloud-price disclosures. These include cloud-provider economics, so they are more likely upper bounds than exact lab costs. | **Yes — $/GPU-hour.** |
| **2026-07-15** | NVIDIA’s TensorRT‑LLM table reported DeepSeek‑R1‑0528 on GB200 at **4,379 output t/s/GPU** for 1,024 input/8,192 output and **1,192 output t/s/GPU** for 8,192 input/1,024 output. Source: <https://github.com/NVIDIA/TensorRT-LLM/blob/main/docs/source/developer-guide/perf-overview.md>, accessed 2026-07-15. | Vendor benchmark; highly quantitative, but optimized benchmark conditions rather than closed-model production. | **Yes — tokens/sec/GPU proxy.** |
| **2025-09-25** | The independent SGLang team reported DeepSeek V3/R1 GB200 throughput of **18,471 input and 9,087 output t/s/GPU** at conventional precision, rising to 26,156 and 13,386 with lower precision. Source: <https://www.lmsys.org/blog/2025-09-25-gb200-part-2/>. | Third-party benchmark with reproduction material; strong cross-check, though sequence shape and precision differ from NVIDIA’s test. | **Yes — tokens/sec/GPU.** |
| **2026-07-09** | Gemini 3.1 Pro Preview standard pricing was **$2/M input and $12/M output**, including thinking tokens, for prompts up to 200,000 tokens. Source: <https://ai.google.dev/gemini-api/docs/pricing>, last updated 2026-07-09. | Vendor price disclosure. | **Yes — $/token.** |
| **2026-07-15** | Google listed Ironwood TPU at **$12/chip-hour on demand, $6 flex-start, $8.40 under a one-year commitment, and $5.40 under a three-year commitment** in Iowa. Source: <https://cloud.google.com/tpu/pricing>, accessed 2026-07-15. | Vendor cloud-price disclosure; likely above Google’s internal cost but directly observable. | **Yes — $/chip-hour.** |
| **2026-07-14** | Google reported Ironwood serving throughput for Qwen 3.5‑397B‑A17B of **3,707 total t/s/chip** under an 8K-input/1K-output workload and **677 total t/s/chip** under 1K-input/8K-output, at concurrency 64. Source: <https://developers.googleblog.com/systems-engineering-playbook-optimizing-qwen-35-397b-moe-on-ironwood-tpu7x/>. | Vendor hardware benchmark, but unusually detailed and empirical. It is not a Gemini benchmark. | **Yes — tokens/sec/chip proxy.** |
| **2026-04-22** | Google described TPU 8i as its serving-specialist TPU and claimed **up to 80% better inference performance per dollar than Ironwood**, particularly for low-latency large-MoE workloads. Source: <https://cloud.google.com/blog/products/compute/tpu-8t-and-tpu-8i-technical-deep-dive>. | Vendor relative-performance claim; “up to” and no workload-normalized raw benchmark. | Useful as an **upside multiplier**, not a direct $/hour or t/s anchor. |
| **2025-02-27–28** | DeepSeek disclosed that V3/R1 production used an average **226.75 eight-H800 nodes**, assumed **$2/H800-hour**, processed 608B input tokens and 168B output tokens, and delivered about **73.7K input t/s/node including cache hits** or **14.8K output t/s/node**. Source: <https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md>. | Actual production disclosure; the strongest single serving-economics anchor in the dataset, although it covers V3/R1 rather than V4. | **Yes — $/GPU-hour, tokens/sec/GPU, utilization-realized traffic.** |
| **2024-12-27 / 2026-04-26** | DeepSeek V3 had **671B total and 37B active parameters/token**; V4 Pro has **1.6T total and 49B active parameters/token**. V4’s report also claims much lower attention cost at one-million-token context. Sources: <https://arxiv.org/html/2412.19437v1> and <https://arxiv.org/html/2606.19348v1>. | Lab technical reports; strong for architecture, not production throughput. | **Scaling input only**; not itself a t/s or $/token anchor. |
| **2026-07-15** | DeepSeek V4 Pro pricing was **$0.435/M cache-miss input, $0.003625/M cache-hit input and $0.87/M output**. Source: <https://api-docs.deepseek.com/quick_start/pricing/>, accessed 2026-07-15. | Vendor price disclosure. | **Yes — $/token.** |

---

# 3. Bottom-up throughput construction

## OpenAI proxy

The NVIDIA table measures output tokens per second. I convert two workload shapes into equivalent prefill and decode rates by solving:

\[
\frac{1024}{T_i}+\frac{8192}{T_o}
=
\frac{8192}{4379}
\]

\[
\frac{8192}{T_i}+\frac{1024}{T_o}
=
\frac{1024}{1192}
\]

This gives:

\[
T_i=12{,}898\text{ input t/s/GPU}
\]

\[
T_o=4{,}573\text{ output t/s/GPU}
\]

These are **two-stage equivalent rates**, not claimed GPT‑5.5 measurements. DeepSeek‑R1 on GB200 is deliberately used as a relatively conservative large frontier-MoE proxy. The SGLang results being roughly twice as fast at traditional precision are the main reason the OpenAI upside case permits a 2× throughput multiplier.

## Google proxy

Google reports combined input-plus-output throughput. The corresponding equations are:

\[
\frac{8000}{T_i}+\frac{1000}{T_o}
=
\frac{9000}{3707}
\]

\[
\frac{1000}{T_i}+\frac{8000}{T_o}
=
\frac{9000}{677}
\]

giving:

\[
T_i=10{,}279\text{ input t/s/chip}
\]

\[
T_o=606\text{ output t/s/chip}
\]

The very low decode-equivalent rate is why Gemini’s estimated output serving cost is substantially higher than its input serving cost. This is a Qwen-on-Ironwood proxy, not a Gemini production measurement.

## DeepSeek production calibration

The raw V3/R1 disclosure gives per-H800 rates of:

\[
73{,}700/8=9{,}212.5\text{ input t/s/GPU including cache hits}
\]

\[
14{,}800/8=1{,}850\text{ output t/s/GPU}
\]

As an internal consistency check:

\[
\frac{608B}{73.7K}
+
\frac{168B}{14.8K}
\]

implies **226.86 average active nodes**, almost exactly the disclosed 226.75. That makes the phase-throughput numbers unusually credible.

Because 56.3% of the disclosed inputs were cache hits, I cannot apply the reported input rate directly to new cache-miss traffic. I assume a hit consumes 10% as much accelerator work as a fresh prefill token:

\[
T_{i,\text{fresh equivalent}}
=
9{,}212.5
\left(
\frac{266+0.10(342)}{608}
\right)
=
4{,}549
\]

I then scale V3/R1 throughput to V4 Pro by the ratio of active parameters:

\[
\frac{37}{49}=0.755
\]

This produces central V4 proxies of:

\[
T_i=3{,}435,\qquad T_o=1{,}397\text{ t/s/H800}
\]

That scaling is intentionally simple. V4’s newer sparse-attention architecture may offset or reverse the extra active-parameter cost, particularly at long context, which is represented in the upside case rather than the central estimate.

---

# 4. Central assumptions

| Model | Accelerator cost \(H\) | Effective \(T_i/T_o\) | Production realization \(U\) | Direct overhead \(K\) |
|---|---:|---:|---:|---:|
| GPT‑5.5 | **$6.50/GPU-h** | 12,898 / 4,573 | **60%** | 1.20 |
| Gemini 3.1 Pro | **$5.40/chip-h** | 10,279 / 606 | **65%** | 1.20 |
| DeepSeek V4 Pro | **$2.00/GPU-h** | 3,435 / 1,397 | **100%*** | 1.20 |

\*DeepSeek’s throughput is already reconstructed from realized production traffic and fleet occupancy; applying an additional utilization haircut would double-count it.

The OpenAI $6.50 value is an analyst synthesis inside the public Blackwell rental range of approximately $3.95–$10.50/GPU-hour. Google’s $5.40 is the directly published three-year Ironwood customer price. Both are conservative relative to what a large owner or long-term purchaser may actually pay.

# 5. Estimated unit economics

| Model | Modeled cost/M input | Modeled cost/M output | Input-only USM | Output-only USM | Revenue on 4M-in/1M-out | Serving cost | **Blended USM** |
|---|---:|---:|---:|---:|---:|---:|---:|
| GPT‑5.5 | $0.280 | $0.790 | 94.4% | 97.4% | $50.00 | $1.91 | **96.2%** |
| Gemini 3.1 Pro | $0.269 | $4.568 | 86.5% | 61.9% | $20.00 | $5.65 | **71.8%** |
| DeepSeek V4 Pro | $0.194 | $0.477 | 55.4% | 45.1% | $2.61 | $1.25 | **52.0%** |

The result is not that OpenAI necessarily operates more efficiently than DeepSeek. Much of the difference is simply **price realization**: GPT‑5.5 charges 11.5 times DeepSeek V4 Pro’s input price and 34.5 times its output price, while modeled serving cost differs by much less.

## Scenario ranges

| Model | Conservative scenario | Central | Efficient scenario |
|---|---:|---:|---:|
| GPT‑5.5 | **79.2%** | **96.2%** | **99.2%** |
| Gemini 3.1 Pro | **41.1%** | **71.8%** | **89.0%** |
| DeepSeek V4 Pro | **21.6%** | **52.0%** | **79.4%** |
| **Equal-dollar basket** | **47.3%** | **73.3%** | **89.2%** |

The scenario assumptions are:

- **GPT‑5.5 conservative:** $10.50/GPU-hour, 40% realization, one-half the proxy throughput and 1.35× supporting overhead. Efficient: $4/GPU-hour, 80% realization, twice the proxy throughput and 1.10× overhead.
- **Gemini conservative:** $6/chip-hour, 50% realization, 75% of proxy throughput and 1.30× overhead. Efficient: Ironwood’s $5.40 effective cost divided by the full claimed 1.8× TPU 8i price-performance gain, 85% realization and 1.10× overhead.
- **DeepSeek conservative:** $2.50/H800-hour, V4 throughput at 65% of the disclosed V3/R1 rate after cache adjustment and 1.30× overhead. Efficient: $1.50/hour, V4 at 110% of V3/R1 throughput and 1.10× overhead.

There are wider stress tails. For example, applying Google’s $12 on-demand Ironwood price, 55% realization, 80% proxy throughput and 1.30× overhead produces approximately **break-even serving economics**. A simultaneous DeepSeek case of $3/H800-hour, no cache-hit work allowance, 60% throughput scaling and 1.35× overhead produces about **−10%** USM. I do not use those stacked worst-corner cases as the main range, but the public record is not strong enough to rule them out.

---

# 6. Ranked sensitivity drivers

## 1. Delivered tokens/sec/chip at the actual workload

This is the largest uncertainty. Halving all central throughput assumptions lowers the equal-dollar basket from **73.3% to 46.6%**. Doubling them raises it to **86.7%**.

The driver includes undisclosed model architecture, active parameter count, quantization, speculative decoding, batching, parallelism, context length and latency target. Public benchmarks visibly move several-fold with sequence shape: DeepSeek‑R1 GB200 output throughput falls from 6,939 t/s/GPU at roughly 1K/1K to 1,192 at roughly 8K/1K; Google’s Qwen proxy falls from 3,707 total t/s/chip in the prefill-heavy test to 677 in the decode-heavy test.

## 2. Rental-equivalent accelerator cost

Cost scales linearly with $/chip-hour. Moving only hardware costs across reasonable model-specific bounds changes the equal-dollar basket to roughly **53%–82%**.

Public Blackwell prices span approximately $3.95–$10.50/GPU-hour, and Ironwood spans $5.40–$12/chip-hour depending on commitment. Actual large-lab contracted or owned cost is undisclosed and may be appreciably lower.

## 3. Input/output/cache mix

At the central assumptions, an equal-dollar basket consisting entirely of uncached input has a modeled margin of **78.8%**; an output-only basket has **68.1%**.

The effect is especially large for Google and DeepSeek. DeepSeek’s cached-input economics are additionally difficult to model: the historical production disclosure says 56.3% of input tokens hit an on-disk KV cache, while current cache-hit list price is less than 1% of cache-miss price. No public source decomposes the actual accelerator and storage cost of those hits.

## 4. Production realization and SLA headroom

Moving OpenAI and Google from their central 60%/65% realization assumptions to 40%/45% lowers the basket to **68.5%**. Moving them to 80%/85% raises it to **75.8%**.

This effect is smaller than throughput and hardware price in the aggregate estimate but can be material for low-latency endpoints, bursty traffic and models that require large minimum deployment groups.

## 5. Non-accelerator direct-serving overhead

Changing \(K\) from 1.10 to 1.35 moves the central basket from **75.5% to 70.0%**. This is less important than accelerator economics but remains a genuine negative-data area: labs do not publicly provide per-token CPU, routing, moderation, retry, storage and network cost.

---

# 7. Explicit negative findings

**As of 2026-07-15, I found no public quantitative anchor for GPT‑5.5 production tokens/sec/GPU, exact parameter or active-parameter count, production realization, or OpenAI’s contracted GB200/GB300 cost.** OpenAI discloses the accelerator family and a relative production optimization, not absolute throughput. GB300 prices on the reviewed CoreWeave and Nebius pages were “contact sales,” not numeric.

**I found no public quantitative anchor tying Gemini 3.1 Pro to a specific serving-TPU generation, per-chip throughput, parameter count, active parameter count or production realization.** The Ironwood figures are therefore a platform benchmark using Qwen 3.5, not Gemini. Google’s public TPU pricing table did not contain a TPU 8i price, so the 80% price-performance statement can only be used as a relative upside case.

**I found no public V4 Pro production tokens/sec/accelerator, deployed hardware mix or fleet utilization.** DeepSeek’s strongest production disclosure is for V3/R1 on H800. V4’s report gives architecture and relative long-context FLOPs, but no production t/s figure.

**No public anchor was found for the direct-serving overhead multiplier \(K\)** on any of the three platforms. The 20% central assumption is therefore lower-confidence than the price and benchmark anchors.

The DeepSeek production page itself includes a historical theoretical margin calculation. I encountered it because it is on the same page as the raw fleet-hours and token statistics, but I did **not** use that stated margin in the estimate; I used only the underlying fleet, throughput and token-volume disclosures.

**Blinding disclosure:** no result from `margins.ashitaorbis.com`, any other `ashitaorbis.com` page, or the `AshitaOrbis/inference-margins` repository appeared in the search results I used. I did not open, inspect or use any such content.

## Five most load-bearing sources

1. **DeepSeek V3/R1 production fleet and throughput disclosure, observation window February 27–28, 2025:** <https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md>
2. **NVIDIA TensorRT‑LLM per-GPU frontier-model throughput table, accessed July 15, 2026:** <https://github.com/NVIDIA/TensorRT-LLM/blob/main/docs/source/developer-guide/perf-overview.md>
3. **Google Ironwood empirical Qwen 3.5 serving benchmark, July 14, 2026:** <https://developers.googleblog.com/systems-engineering-playbook-optimizing-qwen-35-397b-moe-on-ironwood-tpu7x/>
4. **Public accelerator-price anchors—CoreWeave, Nebius and Google Cloud TPU pricing, accessed July 15, 2026:** <https://www.coreweave.com/pricing>, <https://nebius.com/prices>, and <https://cloud.google.com/tpu/pricing>
5. **Official token list-price pages—OpenAI, Google and DeepSeek, accessed July 15, 2026:** <https://developers.openai.com/api/docs/pricing>, <https://ai.google.dev/gemini-api/docs/pricing>, and <https://api-docs.deepseek.com/quick_start/pricing/>


---

## How this artifact was collected

*Moved here from above the answer by the 2026-09-09 release edit: GPT Pro session 3 reported that these pages put collection metadata before the finding, so a reader met request ids and dispatcher notes before the result. Nothing below is changed — it is the same block, at the foot.*


> **RECOVERED from ChatGPT history — dispatcher timer died before filing (commissioned 2026-07-15, Targeted 4).**
> Recovered from the ChatGPT conversation history after the dispatching session failed. No new
> prompt was sent; this is the verbatim assistant report as it already existed in-account. The
> dispatching (pro-dive-fleet) session's in-session MCP request registry expired unread, but the
> ChatGPT conversation itself survived.

| Field | Value |
|---|---|
| **Model** | `gpt-5-6-pro` (from message `metadata.model_slug`) |
| **Date** | 2026-07-15 |
| **Dive title** | LLM Inference Unit Margin Estimate (blinded replication) |
| **Created / final answer (UTC)** | 2026-07-15T20:36:02.038Z / 2026-07-15T21:16:01.383Z |

**Citation anchors removed:** citation anchors from the original interface were removed for
publication; original preserved in the archive copy.

**Provenance routing:** any site change this dive justifies must enter through the update queue
(`research/update-queue.md`), not via direct edits.

<details><summary>Dispatched prompt (verbatim)</summary>

```
Using only public data and your own modeling, independently estimate the unit serving margin on frontier LLM inference at list prices: of every dollar a lab charges for tokens, how much survives the marginal cost of serving them? Define your metric precisely (unit serving margin, NOT company gross margin). Build the estimate bottom-up: pick 2–3 representative frontier models, hardware cost assumptions, throughput assumptions, utilization; show the model structure and every anchor. Give a central estimate and a range, with the sensitivity drivers ranked.

IMPORTANT CONSTRAINT: do NOT consult margins.ashitaorbis.com, its GitHub repository (AshitaOrbis/inference-margins), or any ashitaorbis.com content — this is a blinded replication of an existing model; if search results surface those pages, do not open them, and disclose at the end whether you encountered them.

Structure your findings as dated claims. For each: the claim, primary source (URL + date), your assessment of source quality (vendor claim / third-party benchmark / production disclosure / analyst estimate), and whether it could serve as a quantitative anchor (tokens/sec/chip, $/hr, $/token). If no public anchor exists for a platform, say so explicitly as a finding — a rigorous negative result is wanted. End with a numbered list of your 5 most load-bearing sources.
```
</details>

---
