# GPT-5.6 Pro deep-dive: Huawei Ascend LLM serving economics

# Huawei Ascend frontier-LLM inference economics: public-anchor audit

**Research cutoff: July 15, 2026.**

## Bottom line

The public record now supports a meaningful **throughput anchor** for Huawei’s CloudMatrix 384, but it still does **not** support a fully matched, production-grade **cost-per-token anchor**.

The strongest full-system result is approximately **633,000 generated tokens/second across 384 Ascend 910C cards/packages**, or **1,645–1,648 generated tokens/s per package**, for DeepSeek-R1 W8A8 under stated service-level constraints of TTFT ≤1 second and TPOT ≤50 milliseconds. This is generated/output throughput, not total input-plus-output throughput. It is nevertheless a vendor-affiliated preprint, and no public CloudMatrix hourly rental price accompanies it. [arXiv+4](https://arxiv.org/abs/2606.04415)

A usable but cross-source **910B economics proxy** does exist. JD’s xLLM paper reports **709.5 generated tokens/s per Ascend 910B** on DeepSeek-R1, while China Telecom publishes an on-demand rate of **RMB 38.45/hour** for an instance containing one 64 GB Ascend 910B. Combining those gives approximately **RMB 15.05, or $2.09, per million generated tokens**, using an explicit modeling assumption of RMB 7.20 per dollar. This is not a same-provider measurement, and JD does not disclose precision or the prefill/decode card split. [CTYun+5](https://arxiv.org/abs/2510.14686)

The widely repeated CloudMatrix **6,688 tokens/s per NPU** number is **prefill/input throughput**, not generated throughput, and is an idealized projection assuming perfect expert-load balancing. The directly measured default result in the same paper is **5,655 prefill tokens/s per NPU**. The **1,943 tokens/s** number is generated/decode throughput at batch 96 and 49.4 ms TPOT. Those numbers must not be blended as though they were simultaneous end-to-end service throughput. [arXiv+2](https://arxiv.org/pdf/2506.12708)

For the purported **Ascend 920**, the rigorous finding is negative: no official product page, deployment, benchmark, price, or supported serving SKU was found. Huawei’s official September 2025 roadmap moves from 910C to 950PR/950DT, 960, and 970, with no 920. “Ascend 920” specifications remain traceable to unconfirmed press reports and should not enter a quantitative model. [Huawei+2](https://www.huawei.com/en/news/2025/9/hc-xu-keynote-speech)

## A denominator correction: CloudMatrix 384 is not 384 dies

The CloudMatrix paper describes **384 package-level NPUs/cards in 48 nodes**, with each Ascend NPU implemented as a **dual-die package**. Thus the system contains 384 accelerator packages/cards but 768 compute dies. Huawei’s “tokens/s per NPU” denominator in these papers is the package/card, not a single compute die. [arXiv+1](https://arxiv.org/pdf/2506.12708)

All per-NPU figures below are therefore normalized as:

- **Per package/card:** the economically relevant unit for system count and public instance pricing.

- **Per die:** divide the package-level throughput by two, but only when comparing against a genuinely per-die cost basis.

- **Per-system:** multiply package throughput by the actual active package count; some CloudMatrix experiments use only 256 of the system’s 384 packages.

## Most defensible model inputs

| Platform | Best public quantitative anchor | Exact meaning | Price pairing | Model status |
| --- | --- | --- | --- | --- |
| **Ascend 910B** | 709.47 generated tok/s/card with xLLM; 529.78 with MindIE | DeepSeek-R1, 2,048 input/2,048 output, 16 cards, TPOT ceiling 100 ms; precision and P/D split undisclosed | CTyun: RMB 38.45/hour for one 64 GB 910B | **Cross-source cost anchor; medium-low confidence** [CTYun+3](https://arxiv.org/html/2510.14686v1) |
| **CM384 / 910C** | 1,648.48 generated tok/s/card at 1K/1K; 1,644.59 at 1K/4K | Full 384-card system, DeepSeek-R1 W8A8, TTFT ≤1 s, TPOT ≤50 ms; per-card value derived from aggregate | No public official hourly rate | **Best throughput anchor; cost unanchored** [arXiv+2](https://arxiv.org/pdf/2606.04415) |
| **CM384 isolated decode** | 538, 974, or 1,943 generated tok/s/card | DeepSeek-R1 INT8, 4,096 input/256 output; batch 8/24/96; TPOT 14.9/24.6/49.4 ms | No public rate | **Useful latency-throughput curve; not end-to-end** [arXiv+2](https://arxiv.org/pdf/2506.12708) |
| **CM384 prefill** | 5,655 measured; 6,688 projected tok/s/card | Input/prefill only, 4,096-token prompts and 16,384 batched input tokens per NPU; 6,688 assumes perfect expert balancing | No public rate | **Input-cost input only; never use as output throughput** [arXiv+1](https://arxiv.org/pdf/2506.12708) |
| **Atlas A3** | 172.61–179.03 generated tok/s/card | Qwen3-235B-A22B W8A8, 3,584 input/1,536 output; high concurrency, TTFT roughly 3.7–4.7 seconds | No public A3 rate | **Supplementary open-stack anchor; not premium-interactive** [vLLM](https://docs.vllm.ai/projects/ascend/en/v0.18.0/tutorials/models/Qwen3-235B-A22B.html) |
| **Ascend 920** | None | No official SKU or benchmark found | None | **Exclude from model** [Huawei+1](https://www.huawei.com/en/news/2025/9/hc-xu-keynote-speech) |

---

## Dated quantitative claims

### 1. June 3, 2026 — FlexNPU: the strongest full-system CM384 generated-throughput anchor

**Claim.** A complete 384-card Ascend 910C CloudMatrix system served DeepSeek-R1 W8A8 at about **633,000 generated tokens/s**, while keeping TTFT within 1 second and TPOT within 50 ms.

**Primary source:**

`https://arxiv.org/abs/2606.04415` — submitted June 3, 2026.

**Conditions.**

- Hardware: 384 Ascend 910C NPU cards.

- Software: standard Huawei CANN plus the FlexNPU runtime.

- Model: DeepSeek-R1, W8A8.

- Workloads: 1,024-input/1,024-output and 1,024-input/4,096-output requests.

- SLO: all reported experiments constrained to TTFT ≤1 second and TPOT ≤50 ms.

- Static baseline: 96 prefill cards and 288 decode cards.

- Flex configuration: three 128-card instances capable of dynamically reallocating prefill and decode resources. [arXiv+1](https://arxiv.org/pdf/2606.04415)

| Configuration | Input/output | End-to-end requests/s | Generated tokens/s, system | Generated tokens/s/card |
| --- | --- | --- | --- | --- |
| Static P/D | 1,024/1,024 | 489.84 | 501,596 | 1,306.24 |
| **FlexNPU** | **1,024/1,024** | **618.18** | **633,016** | **1,648.48** |
| Static P/D | 1,024/4,096 | 146.63 | 600,596 | 1,564.05 |
| **FlexNPU** | **1,024/4,096** | **154.18** | **631,521** | **1,644.59** |

The conversion is requests/s × fixed output length. Consequently, these are **generated/output tokens**, not total input-plus-output tokens. The per-card figures are derived by dividing the full-system result by 384; they were not measured on a standalone card. [arXiv+2](https://arxiv.org/pdf/2606.04415)

**Source quality:** Vendor-affiliated academic preprint. It is much better specified than a product-launch claim, but it is not independent.

**Anchor assessment:** This is the best available base-case throughput input for full-scale 910C/CM384 serving:

> **Recommended CM384 base:** 1,646 generated tokens/s per package/card.

A reasonable public-evidence sensitivity band is **1,306–1,648 generated tokens/s/card**, using the static and flex configurations. Important missing fields are arrival distribution, request concurrency, actual TTFT/TPOT percentile tables, power during the run, utilization over time, and independently reproduced results.

---

### 2. June 15–19, 2025 — CloudMatrix-Infer: detailed prefill and isolated-decode curves

**Claim.** Huawei and SiliconFlow reported separately optimized prefill and decode results for DeepSeek-R1 INT8 on a 256-NPU subset of CloudMatrix: 96 packages for prefill and 160 for decode.

**Primary source:**

`https://arxiv.org/abs/2506.12708` — submitted June 15 and revised June 19, 2025.

**Source quality:** Huawei/SiliconFlow vendor-partner paper. Highly useful for its tables and topology disclosure, but not an independent benchmark. [arXiv+2](https://arxiv.org/abs/2506.12708)

#### Prefill: input tokens only

For 4,096-token prompts and 16,384 input tokens batched per NPU:

- **5,655 input/prefill tokens/s/NPU:** directly measured default result.

- **6,688 input/prefill tokens/s/NPU:** projected result under “perfect” expert-load balancing.

Neither figure represents generated output. The 6,688 figure should be treated as an optimization ceiling, not the default observed rate. [arXiv+1](https://arxiv.org/pdf/2506.12708)

#### Decode: generated tokens only

| Input/output length | Reported batch per NPU | TPOT | Generated tokens/s/NPU | Approx. generated tok/s per active sequence |
| --- | --- | --- | --- | --- |
| 1,024/1,024 | 128 | 46.8 ms | 2,733 | 21.4 |
| 2,048/256 | 112 | 47.4 ms | 2,360 | 21.1 |
| 4,096/256 | 96 | 49.4 ms | 1,943 | 20.2 |
| 4,096/256 | 24 | 24.6 ms | 974 | 40.6 |
| 4,096/256 | 8 | 14.9 ms | 538 | 67.3 |

These are **aggregate generated/decode rates at each batch point**. The 1,943-token figure is therefore a high-concurrency throughput point whose per-request output rate is about 20 tokens/s, not an interactive stream running at 1,943 tokens/s. The 538-token point has much better per-sequence interactivity, roughly 67 tokens/s, but much lower aggregate card throughput. [arXiv+4](https://arxiv.org/pdf/2506.12708)

The paper’s decode path also employs one-token multi-token prediction and states a 70% effective acceptance assumption, adding another implementation-specific dependency to the headline throughput. [arXiv](https://arxiv.org/pdf/2506.12708)

**Anchor assessment.**

These numbers are useful as a **latency-throughput curve**, not as an end-to-end server throughput:

- Low-TPOT scenario: **538 generated tok/s/package at 14.9 ms TPOT**.

- Intermediate: **974 at 24.6 ms**.

- Batch-throughput scenario: **1,943 at 49.4 ms**.

- Very high-batch 1K/1K scenario: **2,733 at 46.8 ms**.

The prefill and decode maxima cannot simply be added or combined. With the paper’s reported 96/160 card split:

- Prefill capacity: 96 × 5,655 = **542,880 input tok/s**.

- Decode capacity at the 4K/256 point: 160 × 1,943 = **310,880 output tok/s**.

- Capacity ratio: only **1.75 input tokens per output token**.

- The benchmark request itself requires 4,096/256 = **16 input tokens per output token**.

That arithmetic demonstrates that the separately reported maxima are not a balanced steady-state operating point for the stated 4K/256 workload.

---

### 3. October 16, 2025 — JD xLLM: the strongest public 910B generated-throughput disclosure

**Claim.** On 16 Ascend 910B accelerators serving DeepSeek-R1 with 2,048-input/2,048-output ShareGPT requests and a TPOT ceiling of 100 ms:

- xLLM delivered **11,351.58 generated tok/s**, or **709.47 tok/s/card**.

- Huawei MindIE delivered **8,476.44 generated tok/s**, or **529.78 tok/s/card**.

**Primary source:**

`https://arxiv.org/abs/2510.14686` — submitted October 16, 2025.

The output semantics can be checked from the paper’s request rate: 5.54 requests/s × 2,048 output tokens is approximately 11,346 generated tokens/s, closely matching the reported 11,351.58. This is not a total-token figure. [arXiv+5](https://arxiv.org/abs/2510.14686)

**Source quality:** Industrial/academic paper from JD and collaborators. xLLM is the authors’ system, so the comparison is not neutral, but the paper states that xLLM is deployed in JD business scenarios. It has substantially better production linkage than a generic vendor lab result. [arXiv](https://arxiv.org/html/2510.14686v1)

**Missing conditions.**

- Numerical precision is not disclosed.

- The number of cards assigned to prefill versus decode is not disclosed.

- The exact interconnect and instance topology are not disclosed.

- The 100 ms TPOT ceiling allows a relatively throughput-oriented service point; at the boundary it corresponds to only 10 output tokens/s per active request.

- Per-card values are aggregate-system throughput divided by 16, not single-card benchmarks. [arXiv+1](https://arxiv.org/html/2510.14686v1)

**Anchor assessment:** Strong enough for a 910B scenario, but not for a precision-controlled silicon comparison.

> **Recommended 910B base:** 709 generated tok/s/card.
>
> **Conservative stack sensitivity:** 530 generated tok/s/card.

---

### 4. April 30, 2026 — vLLM-Ascend Qwen3-235B: an open-stack A3 benchmark

**Claim.** The official vLLM-Ascend Qwen3-235B-A22B guide reports:

#### Single-node configuration

- 16 Atlas A3 NPUs.

- Qwen3-235B-A22B W8A8.

- TP4 × DP4 with expert parallelism.

- 3,584 input and 1,536 output tokens.

- Maximum concurrency 160; observed concurrency 144.

- **2,761.72 output tok/s aggregate**, or **172.61/card**.

- Mean TTFT: 4.72 seconds.

- Mean TPOT: 48.69 ms.

#### Three-node prefill/decode configuration

- 48 A3 NPUs.

- Same 3,584/1,536 workload.

- Observed concurrency 576.

- **8,593.44 output tok/s aggregate**, or **179.03/card**.

- Mean TTFT: 3.74 seconds.

- Mean TPOT: 52.07 ms. [vLLM](https://docs.vllm.ai/projects/ascend/en/v0.18.0/tutorials/models/Qwen3-235B-A22B.html)

**Primary source:**

`https://docs.vllm.ai/projects/ascend/en/v0.18.0/tutorials/models/Qwen3-235B-A22B.html` — version 0.18.0, released April 30, 2026. [vLLM](https://docs.vllm.ai/projects/ascend/en/latest/user_guide/release_notes.html)

**Source quality:** Official open-source project benchmark in the Huawei Ascend ecosystem. It is not an independent hardware review.

**Anchor assessment:** Useful evidence that a near-frontier MoE can run through the open vLLM path, but the multi-second TTFT makes it a poor premium-interactive benchmark. The public source labels the hardware as Atlas A3 rather than exposing a separately priced “910C” SKU, so it should not be silently paired with a hypothetical 910C hourly rate.

---

## TOTAL versus generated-throughput audit

| Public number | Correct classification | Safe interpretation |
| --- | --- | --- |
| **6,688 tok/s/NPU** | **PREFILL / INPUT** | Idealized perfect-expert-balancing projection; not measured default and not output throughput. [arXiv+1](https://arxiv.org/pdf/2506.12708) |
| **5,655 tok/s/NPU** | **PREFILL / INPUT** | Default measured prefill result. |
| **2,733 / 2,360 / 1,943 / 974 / 538 tok/s/NPU** | **GENERATED / DECODE** | Isolated decode-cluster points at different lengths, batches, and TPOTs; not end-to-end service throughput. [arXiv+4](https://arxiv.org/pdf/2506.12708) |
| **≈633,000 tok/s/system; ≈1,646/card** | **GENERATED / END-TO-END** | Full 384-card FlexNPU result, derived from completed requests/s × fixed output length. [arXiv+1](https://arxiv.org/pdf/2606.04415) |
| **11,351.58 tok/s; 709.47/card** | **GENERATED / END-TO-END P/D SERVICE** | JD xLLM result; confirmed by requests/s × 2,048 outputs. [arXiv+1](https://arxiv.org/html/2510.14686v1) |
| **2,761.72 tok/s; 172.61/card** | **GENERATED / OUTPUT** | Qwen3-235B A3 benchmark; not total throughput. [vLLM](https://docs.vllm.ai/projects/ascend/en/v0.18.0/tutorials/models/Qwen3-235B-A22B.html) |
| **“>1,920 decode tok/s/card”** | Claimed **GENERATED / DECODE**, but conditions absent | Huawei/SiliconFlow launch claim without disclosed precision, lengths, batch, or TTFT; not independently usable. [Huawei+2](https://www.huawei.com/cn/huaweitech/publication/202503/full-stack-service-architecture-ecology-huaweicloud) |

The importance of this distinction is visible even in vLLM-Ascend’s own smaller-model documentation. One Qwen3-8B benchmark reports **133.67 output tok/s** but **202.64 total tok/s** for the same run—a 52% headline uplift if total tokens are substituted for generated output. An offline case reports approximately 350 output versus 700 total tok/s. [vLLM](https://docs.vllm.ai/projects/ascend/en/latest/developer_guide/performance_and_debug/performance_benchmark.html)

---

## Public hourly pricing and a 910B cost-per-token estimate

### June 5, 2026 — China Telecom CTyun

**Primary source:**

`https://www.ctyun.cn/document/10029787/10047957` — updated June 5, 2026.

The `pak3.4xlarge.8` instance lists:

- One Ascend 910B accelerator.

- 64 GB accelerator memory.

- 16 vCPUs and 128 GB host RAM.

- **RMB 38.45/hour on demand.** [CTYun+1](https://www.ctyun.cn/document/10029787/10047957)

**Source quality:** Official cloud tariff. This is the strongest exact public 910B hourly rate found.

**Caveat:** It is an instance-hour, not a bare accelerator transfer price. It includes host resources but may not include or guarantee the multi-card fabric topology needed to reproduce JD’s 16-card DeepSeek-R1 result.

### May 15, 2026 — Huawei Cloud Snt9b3

**Primary source:**

`https://bbs.huaweicloud.com/forum/thread-0212721421799001051-1-1.html` — published May 15, 2026.

A Huawei Cloud-hosted ModelArts tutorial lists an online-inference resource with:

- One `Snt9b3` accelerator.

- 24 Arm vCPUs and 192 GiB RAM.

- SKU `modelarts.bm.arm.24u.npu.1snt9b`.

- **RMB 29.55/hour.** [Huawei Cloud Community+1](https://bbs.huaweicloud.com/forum/thread-0212721421799001051-1-1.html)

**Source quality:** Public Huawei-hosted material, but not as strong as a canonical tariff or price-calculator output. The SKU says Snt9b3, not explicitly “Ascend 910B”; it should therefore be used only as a lower-price 910B-family sensitivity.

### Derived 910B cost

Formula: RMB per million generated tokens = (RMB/hour) / (generated tok/s/card × 3,600) × 1,000,000

Using an explicit conversion assumption of **RMB 7.20 per US dollar**:

| Hourly rate | Serving throughput | RMB/M generated tokens | USD/M generated tokens |
| --- | --- | --- | --- |
| CTyun 910B: RMB 38.45/h | xLLM: 709.47 tok/s | **15.05** | **$2.09** |
| CTyun 910B: RMB 38.45/h | MindIE: 529.78 tok/s | **20.16** | **$2.80** |
| Huawei Snt9b3: RMB 29.55/h | xLLM: 709.47 tok/s | **11.57** | **$1.61** |
| Huawei Snt9b3: RMB 29.55/h | MindIE: 529.78 tok/s | **15.49** | **$2.15** |

Therefore:

> **Preferred exact-SKU cross-source point:** RMB 15.05, or $2.09, per million generated tokens.
>
> **Broader public-evidence range:** RMB 11.57–20.16, or $1.61–$2.80, per million generated tokens.

This range excludes cluster interconnect charges, storage and network traffic, idle or underfilled periods, failed requests, spares, staffing, software engineering, and any additional prefill/decode imbalance. It also pairs a JD benchmark with unrelated public cloud rates and therefore should be tagged as **cross-source reconstructed accelerator/instance cost**, not audited provider COGS.

---

## CloudMatrix system-cost reconstruction

### April 29–30, 2025 — reported system price

**Primary source:**

`https://www.ft.com/content/cac568a2-5fd1-455c-b985-f3a8ce31c097`

The Financial Times reported an estimated CloudMatrix price of approximately **RMB 60 million, or $8.2 million, per system**, depending on the contract and based on industry sources. This was not a Huawei list price or disclosed invoice. [Financial Times+1](https://www.ft.com/content/cac568a2-5fd1-455c-b985-f3a8ce31c097)

**Source quality:** Reputable press, but an anonymous-source analyst/industry estimate.

### April 15–16, 2025 — estimated power

**Primary source:**

`https://newsletter.semianalysis.com/p/huawei-ai-cloudmatrix-384-chinas-answer-to-nvidia-gb200-nvl72`

SemiAnalysis reconstructed a 16-rack system—12 compute and four switching racks—and estimated approximately **559 kW** of system power. This is an engineering estimate, not a Huawei measured-power disclosure. [newsletter.semianalysis.com+2](https://newsletter.semianalysis.com/p/huawei-ai-cloudmatrix-384-chinas-answer-to-nvidia-gb200-nvl72)

### Illustrative hardware-only cost floor

Assumptions:

- Purchase price: $8.2 million.

- Straight-line life: four years.

- No residual value or financing cost.

- System power: 559 kW.

- PUE: 1.20.

- Electricity: $0.08/kWh.

- Throughput: 633,016 generated tok/s from FlexNPU.

- All system cost assigned to generated output at the measured workload mix.

Hourly costs:

- Capex amortization: **$234.02/hour**.

- Facility-adjusted electricity: **$53.66/hour**.

- Combined: **$287.68/hour**.

| Productive utilization of the measured throughput | Hardware-plus-power $/M generated tokens |
| --- | --- |
| 100% | **$0.126** |
| 80% | **$0.158** |
| 60% | **$0.210** |
| 40% | **$0.316** |
| 20% | **$0.631** |
| 10% | **$1.262** |
| 5% | **$2.525** |

This is a **hardware-floor sensitivity**, not a defensible production COGS anchor. The three essential inputs come from different dates and sources: a press-estimated purchase price, an analyst-estimated power level, and a later vendor-affiliated throughput preprint. It excludes financing, maintenance, optical and network replacement, spares, site construction, operations, software, failed capacity, idle-power behavior, and the cost of maintaining low-tail-latency headroom.

It also allocates the full system cost to generated tokens. It does not produce a separate input-token cost, because FlexNPU’s system dynamically shares prefill and decode resources.

---

## Margin at a public list price: only a proxy is possible

### May 29, 2025 — SiliconFlow DeepSeek-R1-0528 pricing

**Primary source:**

`https://www.siliconflow.com/blog/deepseek-r1-0528-on-siliconflow`

SiliconFlow listed DeepSeek-R1-0528 at:

- **$0.58 per million input tokens.**

- **$2.29 per million output tokens.** [SiliconFlow+1](https://www.siliconflow.com/blog/deepseek-r1-0528-on-siliconflow)

SiliconFlow separately states that it launched DeepSeek-V3 and R1 inference through Huawei Cloud’s Ascend service in January 2025. However, there is no public route attestation proving that the R1-0528 API requests priced above were served on CM384, on 910B, or exclusively on Ascend. [SiliconFlow](https://docs.siliconflow.cn/en/userguide/introduction)

Using $2.29/M output as a **historical output-list-price proxy**:

- At the low 910B reconstructed cost of $1.61/M, output-side hardware/instance contribution margin is approximately **29.8%**.

- At the exact CTyun-plus-xLLM point of $2.09/M, it is approximately **8.7%**.

- At the conservative $2.80/M point, it is approximately **–22.3%**.

- At the CM384 hardware-only floor of $0.126–$0.210/M at 60–100% utilization, the apparent output-side hardware margin is **90.8–94.5%**.

None of those is a true gross-margin estimate. The comparison omits input revenue and input-processing cost, overhead, utilization volatility, model and version mismatch, discounts, cache pricing, customer mix, and the absence of proof that the historical SiliconFlow route used the hardware configuration being costed.

The very large difference between the 910B instance reconstruction and the CM384 hardware-floor reconstruction is itself a warning: **retail cloud instance rates, system purchase estimates, and highly optimized full-supernode throughput are not economically interchangeable denominators.**

---

## Named deployment and production evidence

| Entity/model | Public disclosure | Quantitative usefulness |
| --- | --- | --- |
| **SiliconFlow / DeepSeek V3 and R1** | SiliconFlow says it launched the models on Huawei Cloud Ascend in January 2025. An April 11 launch claim cited more than 1,920 decode tok/s/card and approximately 20 tok/s/user. | Confirms a real service path, but the launch number omits precision, lengths, batch, TTFT and fleet size. It is not independently anchorable. [QQ News+3](https://docs.siliconflow.cn/en/userguide/introduction) |
| **JD / DeepSeek-R1** | xLLM is described as deployed in JD business scenarios; the paper provides the 16-card 910B throughput result. | Strongest production-linked 910B anchor. [arXiv+1](https://arxiv.org/html/2510.14686v1) |
| **Huawei ModelArts / DeepSeek-V3.1** | A Huawei deployment guide specifies two eight-card Snt9b3 nodes—16 accelerators total. | Useful fleet-size/configuration evidence, but no absolute generated throughput or cost. [Huawei Cloud Support](https://support.huaweicloud.com/bestpractice-modelarts/modelarts_06_0009.html) |
| **Huawei ModelArts / Qwen3-8B** | The same documentation describes a one-Snt9b3 deployment and a relative “2.5× concurrent throughput” statement. | Relative vendor claim only; no absolute token rate. [Huawei Cloud Support](https://support.huaweicloud.com/bestpractice-modelarts/modelarts_06_0009.html) |
| **Qwen3-235B** | Official vLLM-Ascend benchmark on 16 and 48 Atlas A3 NPUs. | Exact output throughput and latency, but not an Alibaba operator disclosure and no public A3 price. [vLLM](https://docs.vllm.ai/projects/ascend/en/v0.18.0/tutorials/models/Qwen3-235B-A22B.html) |
| **Kimi K2 Thinking** | Current vLLM-Ascend documentation benchmarks BF16 on 16 A3 NPUs. At concurrency eight it reports 90.28 output tok/s aggregate, mean TTFT 1.36 s and TPOT 87.37 ms; at concurrency 16, TTFT and TPOT deteriorate sharply. | Useful evidence of a functioning port and difficult latency scaling; not a competitive economics anchor. [vLLM](https://docs.vllm.ai/projects/ascend/en/latest/tutorials/models/Kimi-K2-Thinking.html) |
| **Kimi K2 / GLM-5** | Huawei Ascend announcements document adaptation or support. | Model-compatibility evidence only; no operator fleet, throughput, lengths or price. [Hiascend+1](https://www.hiascend.com/activities/dynamic-news/590) |
| **Zhipu, Tencent, Kuaishou, China Telecom** | Huawei’s MindIE material names these organizations as customers/users and references JD deployments involving hundreds of cards and more than 15 models. | Vendor deployment corroboration, but card generation, model, precision, traffic conditions and measured throughput are absent. |
| **ByteDance** | Public reporting concerns large 910B orders and short deliveries, rather than an inference-serving benchmark. | Supply-demand evidence only; not proof of a particular production inference deployment or cost. [Reuters](https://www.reuters.com/technology/artificial-intelligence/huawei-aims-mass-produce-newest-ai-chip-early-2025-despite-us-curbs-2024-11-21/) |

No public operator disclosure from DeepSeek itself, Alibaba, Moonshot, Zhipu, Tencent, or ByteDance was found that simultaneously supplies:

1. named model and version;

2. numerical precision;

3. input and output lengths;

4. concurrency or arrival-rate conditions;

5. TTFT and TPOT;

6. accelerator count and prefill/decode allocation;

7. generated-token throughput; and

8. actual hourly or system cost.

CloudMatrix papers benchmark DeepSeek models, and SiliconFlow serves DeepSeek models on Ascend, but neither fact establishes that DeepSeek’s own principal production fleet runs on Ascend at the reported economics.

---

## Serving-stack maturity

### A production-grade vendor path exists

CANN supplies the low-level runtime, drivers and libraries, while MindIE and Huawei/SiliconFlow’s custom CloudMatrix stack provide continuous batching, paged attention, prefix caching, speculative decoding and OpenAI-compatible service interfaces. JD’s deployment and SiliconFlow’s public service are credible evidence that Ascend inference is not merely a laboratory demonstration. [arXiv+4](https://arxiv.org/pdf/2506.12708)

### The open-source path is real but version- and model-specific

vLLM-Ascend is an official community-maintained hardware plugin with a stable release line, support for Atlas A2/910B and A3-class hardware, and published support paths for DeepSeek, Qwen, GLM and Kimi model families. Its documentation now contains credible output-throughput and latency tables rather than only installation recipes. [vLLM+3](https://github.com/vllm-project/vllm-ascend)

However, release notes still disclose model-specific issues, including incorrect or garbled output on some prefill/decode paths and accuracy gaps on particular model/configuration combinations. [vLLM](https://docs.vllm.ai/projects/ascend/en/latest/user_guide/release_notes.html)

SGLang also has native Ascend support, including prefill/decode disaggregation, multi-node DeepSeek serving and expert-parallel/DeepEP paths. Its feature and quantization coverage is not uniform across models and devices. [SGLang Documentation+3](https://docs.sglang.ai/)

A July 9, 2026 field report using 16 Ascend 910 devices, CANN and vLLM-Ascend for DeepSeek-V4-Flash described needing 12 patches and, in some cases, disabling sequence parallelism, fused communication, speculative decoding or graph execution to restore correctness and stability. The report omits adequate request-length detail for a throughput anchor, but it is a useful counterweight to best-case benchmark claims. [arXiv+3](https://arxiv.org/abs/2607.08215)

MindSpore Serving exists, but the public documentation most readily available is older and focused on basic Ascend 910 serving. The strongest frontier-model evidence now comes from CANN plus MindIE, custom CloudMatrix-Infer, xLLM, vLLM-Ascend and SGLang rather than from MindSpore Serving itself. [MindSpore](https://www.mindspore.cn/tutorial/inference/en/r1.0/serving.html)

**Stack conclusion:** Production-grade serving exists, especially through Huawei’s vertically integrated path. It does not follow that an arbitrary vLLM/SGLang model can achieve the CloudMatrix headline rate without model-specific kernels, topology-aware expert placement, disaggregated serving, speculative decoding and substantial tuning. This limits how readily the best public numbers generalize.

---

## Supply constraints and the scale-generalization problem

### December 2, 2024 — US export controls

The US Bureau of Industry and Security expanded controls covering advanced semiconductor-manufacturing equipment, software and high-bandwidth memory, and added 140 entities to the Entity List. These restrictions directly target inputs needed to manufacture and package advanced AI accelerators. [Bureau of Industry and Security](https://www.bis.gov/press-release/commerce-strengthens-export-controls-restrict-chinas-capability-produce-advanced-semiconductors-military)

### November 21, 2024 — reported SMIC yield and deliveries

Reuters reported an approximately **20% yield for the 910C on SMIC’s N+2 process**, versus roughly 50% for the 910B, and reported that ByteDance had ordered more than 100,000 910Bs but had received fewer than 30,000 by July 2024. These were historical snapshots, not current yields, but they show how early production economics and delivery volume could differ sharply from nominal wafer capacity. [Reuters](https://www.reuters.com/technology/artificial-intelligence/huawei-aims-mass-produce-newest-ai-chip-early-2025-despite-us-curbs-2024-11-21/)

### June 12, 2025 — US government production estimate

Reuters reported a US Commerce Department estimate that Huawei might be able to produce no more than approximately **200,000 advanced AI chips during 2025**. [Reuters](https://www.reuters.com/world/china/us-says-chinas-huawei-cant-make-more-than-200000-ai-chips-2025-2025-06-12/)

### Later 2025 estimates are materially more optimistic

SemiAnalysis subsequently modeled much larger potential logic-die production but identified HBM and advanced packaging as binding constraints. It estimated that available HBM inventories might support around 1.6 million 910C packages under some assumptions, while domestic CXMT HBM output could support only a few hundred thousand additional 910Cs in 2026. Bloomberg reported plans for approximately 600,000 910Cs in 2026 and about 1.6 million Ascend dies, while also emphasizing HBM stockpiles and dual-die packaging difficulty. These are analyst and press estimates, not audited production disclosures. [Default+3](https://newsletter.semianalysis.com/p/huawei-ascend-production-ramp)

Physical analysis of 910C samples has also identified older Samsung and SK Hynix HBM2E, supporting the view that stockpiled imported HBM has been important to the ramp. [The Business Times](https://www.businesstimes.com.sg/companies-markets/huawei-used-tsmc-samsung-sk-hynix-components-top-ai-chips-techinsights)

The correct bottleneck description is therefore **logic yield plus HBM plus advanced packaging and interconnect supply**. “CoWoS shortage” is too specific: CoWoS is a TSMC packaging platform, while Huawei’s domestic package flow is not necessarily CoWoS.

### Economic implication

The public scale estimates vary by multiples. This prevents assuming that:

- an individual public-cloud instance rate represents Huawei’s internal marginal cost;

- an $8.2 million system estimate is available at arbitrary volume;

- best-case full-supernode throughput can be replicated across the installed fleet;

- strategic or contract pricing reflects an unconstrained competitive market; or

- 910B, 910C and later Ascend packages have comparable availability and acquisition economics.

Supply constraints do not invalidate the throughput measurements, but they materially weaken their use as a scalable fleet-wide cost anchor.

---

## Ascend 920: precisely scoped negative result

**Official source:**

`https://www.huawei.com/en/news/2025/9/hc-xu-keynote-speech` — September 18, 2025.

Huawei’s published roadmap identifies:

- Ascend 910C;

- Ascend 950PR, planned for the first quarter of 2026;

- Ascend 950DT, planned for the fourth quarter of 2026;

- Ascend 960, planned for the fourth quarter of 2027; and

- Ascend 970, planned for the fourth quarter of 2028.

It does not identify an Ascend 920. [Huawei](https://www.huawei.com/en/news/2025/9/hc-xu-keynote-speech)

An April 22, 2025 Data Center Dynamics article repeated second-hand claims of more than 900 BF16 TFLOPS, 4 TB/s memory bandwidth and possible second-half-2025 availability for a “920,” but noted the lack of Huawei confirmation. [DatacenterDynamics](https://www.datacenterdynamics.com/en/news/huawei-unveils-ascend-920-ai-chip-will-start-shipping-910c-to-chinese-customers-from-may-report/)

By March 2026, contemporary reporting described the 950PR—not a 920—as Huawei’s new inference-oriented successor. [Reuters](https://www.reuters.com/world/china/huaweis-new-ai-chip-find-favour-with-bytedance-alibaba-which-plan-place-orders-2026-03-27/)

**Finding:** As of July 15, 2026, Ascend 920 has no sufficiently authoritative public existence for modeling. There is no official specification, benchmark, deployment, cloud SKU or price. Any cost-per-token row for “920” would be fabricated from rumor and should remain blank.

---

## Recommended treatment in a quantitative model

| Model variable | Recommended default | Sensitivity or caveat | Confidence |
| --- | --- | --- | --- |
| **CM384 generated throughput/card** | **1,646 tok/s** | 1,306–1,648 full-system E2E range | Medium |
| **CM384 generated throughput/system** | **≈632,000 tok/s** | Workload-specific; 1K/1K or 1K/4K, W8A8 | Medium |
| **CM384 low-TPOT isolated decode** | **538 tok/s/card** | 4K/256, batch 8, 14.9 ms TPOT; requires separate prefill capacity | Medium |
| **CM384 batch-throughput isolated decode** | **1,943 tok/s/card** | 4K/256, batch 96, 49.4 ms TPOT; about 20 tok/s per active sequence | Medium |
| **CM384 measured prefill** | **5,655 input tok/s/card** | Do not use 6,688 as base; it is an idealized projection | Medium |
| **910B generated throughput/card** | **709 tok/s** | 530 conservative; precision and P/D split unknown | Medium-low |
| **910B public hourly rate** | **RMB 38.45/hour** | Exact CTyun 910B SKU; topology mismatch with JD benchmark | Medium |
| **910B generated-token cost** | **RMB 15.05/M, or $2.09/M** | Public-evidence range RMB 11.57–20.16, or $1.61–$2.80 | Low-to-medium |
| **CM384 purchase price** | **$8.2M** | Press/industry estimate, not list price | Low |
| **CM384 system power** | **559 kW** | Analyst estimate, not measured disclosure | Low |
| **CM384 hardware-only cost** | **$0.126/M at 100%; $0.210/M at 60%** | Extremely assumption-sensitive; not provider COGS | Low |
| **Ascend 920** | **N/A** | No official product anchor | High confidence in exclusion |

## Precisely scoped final finding

A strict cost-per-token anchor would require a matched disclosure containing:

- the exact accelerator and package count;

- model and model version;

- precision;

- input/output distribution;

- concurrency and arrival process;

- TTFT and TPOT percentiles;

- generated-token throughput;

- utilization and power;

- and a public hourly or acquisition cost for the same configuration.

**No public source meeting that standard exists for Ascend 910C or CloudMatrix 384.**

What does exist is:

1. a credible but vendor-affiliated **full-system CM384 generated-throughput anchor**;

2. a detailed **isolated prefill/decode latency-throughput curve**;

3. a production-linked **910B generated-throughput disclosure**;

4. an official public **910B instance rate**, enabling a cross-source cost estimate;

5. analyst estimates supporting only a highly assumption-sensitive **CM384 hardware-floor reconstruction**; and

6. sufficient deployment and software evidence to conclude that Ascend serving is production-real, though not plug-and-play or independently benchmarked at CloudMatrix scale.

### Five most load-bearing sources

1. **FlexNPU — June 3, 2026.** Full 384-card DeepSeek-R1 W8A8 end-to-end throughput under explicit TTFT and TPOT constraints; the strongest CM384 generated-throughput anchor. `https://arxiv.org/abs/2606.04415`

2. **Serving Large Language Models on Huawei CloudMatrix384 — June 15–19, 2025.** Exact DeepSeek-R1 INT8 prefill/decode topology, sequence lengths, batches, TPOT and per-NPU throughput; establishes that 6,688 is projected prefill rather than generated throughput. `https://arxiv.org/abs/2506.12708`

3. **xLLM industrial report — October 16, 2025.** Production-linked DeepSeek-R1 result on 16 Ascend 910Bs, enabling a generated-throughput-per-card estimate and comparison against MindIE. `https://arxiv.org/abs/2510.14686`

4. **China Telecom CTyun Ascend instance tariff — updated June 5, 2026.** Official RMB 38.45/hour rate for an instance explicitly containing one 64 GB Ascend 910B; the strongest public hourly-price anchor. `https://www.ctyun.cn/document/10029787/10047957`

5. **Financial Times CloudMatrix pricing report — April 29–30, 2025.** Source of the widely cited approximately RMB 60 million/$8.2 million system-price estimate; indispensable for a hardware-floor reconstruction but explicitly an industry-source estimate rather than an official price. `https://www.ft.com/content/cac568a2-5fd1-455c-b985-f3a8ce31c097`


---

## How this artifact was collected

*Moved here from above the answer by the 2026-09-09 release edit: GPT Pro session 3 reported that these pages put collection metadata before the finding, so a reader met request ids and dispatcher notes before the result. Nothing below is changed — it is the same block, at the foot.*


| Field | Value |
|---|---|
| **Model** | `gpt-5-6-pro` (confirmed via check() `model_slug`, `is_pro: true`) |
| **Date** | 2026-07-15 |
| **Dive title** | Huawei Ascend serving economics (Round 2 — dive 6) |
| **Conversation ID** | `6a58178c-5b88-83e8-a3cc-03d91a90d86a` |
| **Conversation URL** | archived privately |
| **Request ID** | `req_1784158091135_t995vc` |
| **Completion** | `complete` at elapsed `45m43s`; `completion_path: dom_fallback`; project `Ashitaorbis` confirmed |
| **Commissioned** | by owner 2026-07-15, round 2 (follow-on to the "Targeted 4") |

## Provenance

- Full structured report emitted well inside the 120-minute cap (completed at ~46 min). No timeout;
  this is the complete requested report, not a reasoning-summary.
- **Citation normalization:** the response was read from ChatGPT's backend/DOM and citation anchors
  are already rendered as readable markdown links (`[source+N](url)`) — there were **no**
  private-use-unicode (`U+E200/E201/E202`) anchors to normalize. Report text is otherwise verbatim.
- **Provenance routing:** any site change this dive justifies enters through `research/update-queue.md`
  (Q-AUTO items), never via direct edits to the site/engine/annex/tracked numbers.

<details><summary>Dispatched prompt (verbatim)</summary>

```
You are conducting a rigorous source-hunting deep dive for a quantitative model of frontier-LLM inference serving economics (cost per token, and margin at list prices). I need the strongest available PUBLIC quantitative anchors for Huawei Ascend LLM inference/serving economics — the China / alt-silicon serving story — or a rigorous, well-documented finding that no such public anchor exists. This is currently an unanchored platform in the model.

SCOPE:
- Huawei Ascend accelerators used for LLM *inference/serving*, not training: Ascend 910B, 910C, and the newer 920; and the rack-scale CloudMatrix 384 (CM384) supernode (384 Ascend 910C dies interconnected). Prefer figures on frontier-class or near-frontier models (DeepSeek V3/R1/V4, Qwen, Kimi, GLM, etc.).
- Deployment reports: DeepSeek and other Chinese labs (Alibaba/Qwen, Moonshot/Kimi, Zhipu/GLM, Tencent, ByteDance) running inference on Ascend or CloudMatrix; SiliconFlow, Huawei Cloud, and other Chinese inference providers serving named models on Ascend. Any disclosure of tokens/sec, batch/concurrency conditions, precision, or fleet size.
- Throughput claims and their EXACT benchmark conditions: Huawei's own CloudMatrix 384 / Ascend serving claims (e.g. the CloudMatrix-Infer / "6,688 tokens/s per NPU prefill, 1,943 tokens/s decode" style figures reported for DeepSeek-R1), any SemiAnalysis or third-party analysis of CloudMatrix economics, and academic/preprint benchmarks. For every tok/s figure, pin down the model, precision, input/output lengths, concurrency, and whether it is prefill/total vs decode.
- Huawei Cloud pricing: published on-demand or contract $/NPU-hour or $/instance-hour for Ascend inference instances (ModelArts, Ascend cloud), if any is public; and any CloudMatrix 384 system price or $/rack figure (widely-cited ~$8M system cost / per-token cost analyses count as analyst estimates — treat as such).
- Export-control supply constraints: SMIC 7nm yield, HBM availability (CoWoS/HBM sanctions), and how these bound Ascend deployment scale — relevant to whether any anchor generalizes.
- Serving-stack maturity: MindSpore, CANN, and the state of vLLM / SGLang ports to Ascend (vllm-ascend, mindspore-serving) — does a production-grade serving stack exist, and does that affect the credibility of throughput claims?

GOAL: candidate quantitative anchors for cost-per-token on Ascend 910C/920 and CloudMatrix 384 — ideally (tokens/sec/NPU on a named model at a named precision) paired with ($/NPU-hour) so a $/token can be derived — OR a rigorous, precisely-scoped negative result. The China/alt-silicon serving story is one of the model's biggest blind spots, so precision about what is genuinely publicly disclosed vs vendor claim vs analyst reconstruction matters enormously.

CRITICAL METHODOLOGICAL REQUIREMENT: Be especially skeptical of TOTAL-vs-GENERATED throughput conflation. A common trap (found in an AMD serving claim earlier today) is a headline tokens/sec that is TOTAL throughput (prefill + decode, prefill-dominated at long input lengths and high concurrency), presented as if it were interactive decode throughput. For CloudMatrix/Ascend figures especially, separate PREFILL throughput from DECODE / GENERATED throughput, and note concurrency and interactivity (TTFT / per-token latency) conditions. Many CloudMatrix headline numbers are aggregate supernode throughput at very high concurrency — flag when a per-NPU figure is a supernode figure divided by 384, and whether the operating point is usable for interactive serving.

Structure your findings as dated claims. For each: the claim, primary source (URL + date), your assessment of source quality (vendor claim / third-party benchmark / production disclosure / analyst estimate), and whether it could serve as a quantitative anchor (tokens/sec/chip, $/hr, $/token). Distinguish TOTAL vs GENERATED (decode) throughput wherever a tok/s figure appears. If no public anchor exists, say so explicitly as a finding — a rigorous negative result is wanted. End with a numbered list of your 5 most load-bearing sources.
```
</details>

---
