# DeepSeek — GPT-5.6 Pro deep dive

> Run 2026-07-09 · 50m57s · model `gpt-5-6-pro` (Pro-verified) · conversation archived privately
> Verdict: **DeepSeek V4-Pro marginal serving gross margin ≈ 69% central, 80% CI ≈ 45–83%** at the July 9 list price (post-75%-cut); announced peak-window 2× tariff would restore ≈ 84.5%.
> Archived verbatim below (DOM-extracted; math notation may render with minor duplication artifacts).

---

**Snapshot cutoff:** July 9, 2026. The announced mid-July full-V4 launch and peak-hour tariff are treated as future changes, not as the live tariff on the cutoff date.

**Scope:** marginal/direct serving economics—accelerator capacity, utilization, and directly attributable serving infrastructure. This excludes training, research, sales, general administration, and company-level income-statement costs.

**Evidence labels:** **DISCLOSED** = first-party public disclosure; **CREDIBLY REPORTED** = reputable reporting attributed to the company or knowledgeable sources; **COMMUNITY ESTIMATE** = reproducible arithmetic or a named third-party technical estimate; **SPECULATION** = an assumption or inference without direct confirmation.

## 1. MODELS: V4 / V4 Pro (and R2 if real)

The first nomenclature point is important: **"DeepSeek V4" is a family/architecture**, with two officially released Preview checkpoints, **V4-Flash** and **V4-Pro**. There is not a separately priced generic "V4" endpoint. As of July 9, the current flagship is **DeepSeek-V4-Pro Preview**; the full release was reported for mid-July and therefore falls after this snapshot.

| Model | Status at cutoff | Total parameters | Active parameters/token | Serving precision and relevant architecture |
| --- | --- | --- | --- | --- |
| **V4-Pro Preview** | **DISCLOSED — released April 24, 2026; live API and open weights.** | **DISCLOSED — 1.6T** | **DISCLOSED — 49B** | **DISCLOSED — FP4 routed-expert weights and FP4 lightning-indexer Q/K; other computation is not uniformly FP4. KV cache is BF16 for RoPE dimensions and FP8 otherwise.** 1M context; 384K maximum output on the current API. [DeepSeek release](https://api-docs.deepseek.com/news/news260424) · [V4 technical report](https://arxiv.org/html/2606.19348v1) · [pricing page](https://api-docs.deepseek.com/quick_start/pricing/) |
| **V4-Flash Preview** | **DISCLOSED — released April 24, 2026; live API and open weights.** | **DISCLOSED — 284B** | **DISCLOSED — 13B** | **DISCLOSED — same broad hybrid sparse-attention/MoE family and selective FP4 treatment.** 1M context and 384K maximum output. |
| **Full V4** | **CREDIBLY REPORTED — scheduled for mid-July 2026, after this cutoff.** | No post-Preview change disclosed | No post-Preview change disclosed | **CREDIBLY REPORTED — intended to launch with twice-base pricing during two Beijing peak windows.** [TechNode](https://technode.com/2026/06/30/deepseek-to-launch-v4-in-mid-july-with-new-peak-time-api-pricing/) · [SCMP](https://www.scmp.com/tech/big-tech/article/3358868/after-triggering-price-war-deepseek-reverses-course-surcharge-peak-hour-api-use) |
| **R2** | **CREDIBLY REPORTED — a real internal successor project, but not a released model or API product.** Reportedly targeted for May 2025 and delayed because Liang Wenfeng was dissatisfied with progress. | Not disclosed | Not disclosed | **SPECULATION — claims that R2 was renamed, absorbed into, or became V4 are unverified.** [Reuters](https://www.reuters.com/world/china/deepseek-r2-launch-stalled-ceo-balks-progress-information-reports-2025-06-26/) |

### What "FP4 V4" does—and does not—mean

**DISCLOSED:** V4 applies FP4 QAT chiefly to the routed MoE expert weights and the compressed-sparse-attention indexer's query/key components. The report describes native FP4 weight storage for inference, reducing weight loading and memory consumption; current processors may still convert or consume those values through FP8-oriented computation paths. This is materially different from asserting that every matrix multiplication, activation, KV value, shared expert, embedding, or communication buffer is FP4. [V4 technical report](https://arxiv.org/html/2606.19348v1)

That distinction matters economically. Selective FP4 can make a **1.6T-total-parameter model feasible with roughly the expert-weight traffic of a much smaller FP8 model**, but it does not automatically halve end-to-end serving cost. Communication, active-expert compute, attention, KV traffic, sampling, and host/network overhead remain.

Relative to V3:

- **DISCLOSED — V3 had 671B total and 37B active parameters.** [V3 report](https://arxiv.org/html/2412.19437v1)

- **COMMUNITY ESTIMATE — V4-Pro activates 32.4% more parameters per token than V3:** 49/37 = 1.324.

- **COMMUNITY ESTIMATE — V4-Pro has 2.38× as many total parameters:** 1.6T/671B = 2.38.

- **DISCLOSED — at a full 1M-token sequence, V4-Pro requires about 27% of V3.2's single-token inference FLOPs and 10% of its KV-cache footprint.** V4-Flash is reported at 10% and 7%, respectively.

The last comparison is real but easy to misuse. **DISCLOSED:** DeepSeek's February 2025 production trace had an average KV length of only **4,989 tokens**. The 1M-context advantage therefore cannot be applied as a blanket 73% cost reduction to the historical workload; most ordinary requests spend much less of their cost in quadratic or long-context attention. [DeepSeek inference disclosure](https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md)

## 2. FLEET & PROCUREMENT

### What is actually known about DeepSeek's inference fleet

| Accelerator/fleet claim | Evidence and interpretation |
| --- | --- |
| **H800 in February 2025** | **DISCLOSED — all V3/R1 inference services in the disclosed two-day production trace ran on eight-H800 nodes.** Peak deployment was **278 nodes = 2,224 H800s**; average deployment was **226.75 nodes = 1,814 H800s**. DeepSeek costed these at an **assumed $2 per H800-hour**, or **$16 per node-hour**. This was an accounting assumption described as a leasing cost—not proof that every accelerator was externally rented at that exact rate. |
| **H800 in the current V4 fleet** | **SPECULATION — plausible as part of the fleet, but not confirmed.** The 2025 statement does not establish the July 2026 production mix. |
| **Huawei Ascend 950-series for V4** | **CREDIBLY REPORTED — DeepSeek used Ascend 950 hardware to maximize V4 performance, while Huawei said its Ascend 950-based supernode supported V4.** Reuters also reported that V4 runs on Huawei chips and that V4's launch sharply increased demand for Ascend 950 systems. This is the strongest current evidence for Huawei inference use, but it does not disclose what percentage of API tokens run there. [Reuters Apr 24](https://www.reuters.com/business/media-telecom/huawei-ascend-supernode-support-deepseek-v4-2026-04-24/) · [Reuters Apr 29](https://www.reuters.com/world/china/big-chinese-tech-firms-scramble-secure-huawei-ai-chips-after-deepseek-v4-launch-2026-04-29/) · [Reuters May 23](https://www.reuters.com/world/china/chinas-deepseek-make-permanent-75-price-cut-flagship-v4pro-ai-model-2026-05-23/) |
| **Huawei platform support in the V4 software stack** | **DISCLOSED — DeepSeek says its fine-grained expert-parallel serving design was validated on both Nvidia GPUs and Huawei Ascend NPUs.** Portability evidence, not a production-fleet inventory. [V4 report](https://arxiv.org/html/2606.19348v1) |
| **H20 in DeepSeek's own API fleet** | **Not established.** **CREDIBLY REPORTED:** most third-party Chinese cloud customers hosting R1 reportedly used H20s. **COMMUNITY ESTIMATE:** SemiAnalysis previously estimated large High-Flyer/DeepSeek H20 orders. Neither establishes a confirmed DeepSeek-owned H20 count or API traffic share. [SemiAnalysis](https://newsletter.semianalysis.com/p/deepseek-debates) |
| **Ascend 910C / CloudMatrix 384 in DeepSeek's own fleet** | **Not established.** **DISCLOSED:** Huawei/SiliconFlow demonstrated DeepSeek-R1 inference on CloudMatrix 384 — relevant benchmark evidence, not DeepSeek procurement evidence. [CloudMatrix paper](https://arxiv.org/html/2506.12708) |
| **H200 or DeepSeek-designed silicon** | **CREDIBLY REPORTED — possible future capacity, not current serving supply.** July 8: China considering limited H200 purchases for selected firms including DeepSeek. July 7: DeepSeek's own inference-chip effort reported as early-stage. [Reuters H200](https://www.reuters.com/world/china/china-plans-let-top-ai-firms-buy-limited-amount-nvidia-h200-chips-information-2026-07-08/) · [Reuters custom chip](https://www.reuters.com/world/china/chinas-deepseek-developing-its-own-ai-chip-sources-say-2026-07-07/) |

### Owned versus rented

**DISCLOSED:** High-Flyer's earlier Fire-Flyer 2 infrastructure used **10,000 PCIe A100 GPUs**, demonstrating a history of internally controlled, capitalized compute rather than a purely cloud-rental model. [Fire-Flyer 2 paper](https://arxiv.org/abs/2408.14158)

**COMMUNITY ESTIMATE:** SemiAnalysis estimated access to roughly **50,000 Hopper accelerators**, including about **10,000 H800s and 10,000 H100s**, total server capital expenditure around **$1.6 billion**, and more than **$500 million** of GPU investment. Specialist estimates, not audited inventories. [SemiAnalysis](https://newsletter.semianalysis.com/p/deepseek-debates)

The defensible conclusion: DeepSeek/High-Flyer has substantial internally controlled compute; the only DeepSeek-specific serving cost basis is the **DISCLOSED historical assumption of $2/H800-hour**; the **2026 owned/rented split, depreciation policy, transfer price, and productive accelerator-hour basis are unknown**.

### Ascend 910C and H20 calculator inputs

H20 figures are per GPU. Huawei publishes many 910C figures at the **CloudMatrix/Atlas system level**; per-NPU values below allocate a 384-NPU system across 384 slots.

| Metric | Nvidia H20 | Huawei Ascend 910C / CloudMatrix 384 |
| --- | --- | --- |
| **Dense low-precision compute** | **CREDIBLY REPORTED — 296 TFLOPS FP8/INT8 and 148 TFLOPS BF16/FP16** for the 96GB H20. [Tom's Hardware](https://www.tomshardware.com/pc-components/gpus/the-tale-of-nvidias-hgx-h20-how-an-ai-gpu-became-a-political-lightning-rod) | **DISCLOSED at system level — 307.2 PFLOPS FP16 for one published 384-NPU Atlas 900 A3 configuration; COMMUNITY ESTIMATE — approximately 800 TFLOPS per NPU slot.** Another listed configuration gives 288.7 PFLOPS ⇒ ~752 TFLOPS/slot. [Huawei Atlas 900 A3](https://e.huawei.com/cn/products/computing/ascend/atlas-900-a3-superpod) |
| **HBM capacity** | **CREDIBLY REPORTED — 96GB**; **DISCLOSED — Nvidia also lists a 141GB H20 variant.** | **DISCLOSED — 48TB across 384 NPUs; COMMUNITY ESTIMATE — 128GB per NPU slot.** |
| **HBM bandwidth** | **CREDIBLY REPORTED — 4.0TB/s** for the 96GB H20. | **DISCLOSED — 3.2TB/s per NPU.** |
| **Scale-up interconnect** | **CREDIBLY REPORTED — 900GB/s NVLink per GPU.** | **DISCLOSED — 784GB/s bidirectional fabric figure for Atlas 900 A3.** Not directly comparable with NVLink. |
| **Power** | **CREDIBLY REPORTED — 400W GPU TDP** (96GB version). | **CREDIBLY REPORTED — ~559kW full CM384 system; COMMUNITY ESTIMATE — 1.46kW per NPU slot at the system boundary** (includes networking/infrastructure; not package TDP). [Tom's Hardware](https://www.tomshardware.com/tech-industry/artificial-intelligence/huaweis-new-ai-cloudmatrix-cluster-beats-nvidias-gb200-by-brute-force-uses-4x-the-power) |
| **China purchase price** | **CREDIBLY REPORTED — approximately $10,000–$12,000 per H20 in September 2025.** [Reuters](https://www.reuters.com/world/china/chinese-firms-still-want-nvidia-chips-despite-government-pressure-not-buy-2025-09-04/) | **CREDIBLY REPORTED — approximately RMB60 million / $8.2 million per CM384, contract-dependent. COMMUNITY ESTIMATE — RMB156,250 / $21,400 of system purchase price per NPU slot.** [Financial Times](https://www.ft.com/content/cac568a2-5fd1-455c-b985-f3a8ce31c097) |
| **Capex-only productive hour** | **COMMUNITY ESTIMATE — $0.34–$0.40/GPU-hour** over four years at 85% productive utilization; **$0.54–$0.65** over three years at 70%. | **COMMUNITY ESTIMATE — approximately $0.72/NPU-hour** over four years at 85%, or **$1.16/NPU-hour** over three years at 70%, using $8.2M/384. |
| **Public China rental signal** | **DISCLOSED vendor asking quotes:** 8× H20 96GB for **RMB30,000/month**; 8× H20 141GB ~**RMB40,000/month**. **COMMUNITY ESTIMATE — RMB5.21/GPU-hour ($0.72) and RMB6.94/GPU-hour ($0.96)** at 720 h/mo, RMB7.20/$. [Omni quote](https://www.omniyq.com/) | No transparent 910C spot rental found. **SPECULATION — $0.9–$1.7 per productive NPU-hour** is a reasonable direct-cost calculator band after adding power, maintenance, fabric, and software overhead to the reported CM384 capex. Not a DeepSeek price or observed rental. |
| **Direct R1 serving benchmark** | DeepSeek H800 reference (per CloudMatrix authors): **7,839 prefill / 1,850 decode tok/s per GPU**. | **DISCLOSED-BY-AUTHORS — 5,655 prefill tok/s per NPU (default), 6,688 (idealized), and 1,943 decode tok/s per NPU at KV 4,096 with 49.4ms TPOT.** R1 benchmark results, not V4 production measurements. [CloudMatrix paper](https://arxiv.org/html/2506.12708) |

The CM384 benchmark is economically informative: it trails the compared H800 setup in prefill but slightly exceeds it in memory-bound decode. That supports adding 910C/CM384 to a calculator as a plausible inference platform. It does **not** support treating nominal Huawei FP16 FLOPS as equivalent to Nvidia FLOPS across V4 kernels.

### Current China rental rates and export-control effects

| Accelerator | Public quote | Per-chip-hour conversion |
| --- | --- | --- |
| H800 | **DISCLOSED vendor quotes / CREDIBLY REPORTED market survey — RMB45,000–64,000 per eight-GPU month** | **COMMUNITY ESTIMATE — RMB7.81–11.11, or $1.08–$1.54 per GPU-hour** [Apetops](https://apetops.com/) · [Omni](https://www.omniyq.com/) · [Sina market survey](https://finance.sina.com.cn/roll/2026-05-20/doc-inhypxki6910076.shtml) |
| H20 96GB | **DISCLOSED vendor quote — RMB30,000 per eight-GPU month** | **COMMUNITY ESTIMATE — RMB5.21 / $0.72 per GPU-hour.** |
| H20 141GB | **DISCLOSED vendor quote — ~RMB40,000–41,000 per eight-GPU month** | **COMMUNITY ESTIMATE — RMB6.94–7.12 / $0.96–$0.99 per GPU-hour.** |
| Ascend 910B — not 910C | **DISCLOSED vendor quote — RMB15,000 per eight-NPU month** | **COMMUNITY ESTIMATE — RMB2.60 / $0.36 per NPU-hour.** Must not be silently reused as a 910C rate. |

**CREDIBLY REPORTED:** one May 2026 market survey said China accelerator rental prices rose roughly **30% after the Spring Festival**, with constrained Nvidia supply one contributing factor. [Sina Finance](https://finance.sina.com.cn/roll/2026-05-20/doc-inhypxki6910076.shtml)

But the data do **not** support the simplistic conclusion that export controls raised DeepSeek's productive H800 cost above its old basis:

- The current public H800 asking range of **$1.08–$1.54/GPU-hour** is below DeepSeek's old assumed **$2/GPU-hour**.

- Export controls can still raise marginal cost through reservation requirements, long minimum terms, inventory fragmentation, inability to choose the optimal accelerator, and duplicated Nvidia/Huawei software stacks.

- H20 is cheaper per chip-hour with high HBM bandwidth, but its **296 TFLOPS dense FP8** is far below H100/H800-class nominal tensor throughput; a lower rental rate does not translate one-for-one into lower cost/token.

- Ascend can lower acquisition cost but impose higher systems power and engineering overhead. The FT reported CM384 operations could require **three to five times** the manpower of a mature Nvidia deployment. **CREDIBLY REPORTED**, not a measured DeepSeek expense.

- **CREDIBLY REPORTED:** Ascend 950 supply was still ramping, with broader shipments expected in H2 2026. Reported 950PR prices: about **RMB50,000 with DDR memory and RMB70,000 with HBM**. [Reuters](https://www.reuters.com/world/china/huaweis-new-ai-chip-find-favour-with-bytedance-alibaba-which-plan-place-orders-2026-03-27/)

### Utilization evidence

**DISCLOSED:** the February 2025 deployment averaged **226.75 nodes against a 278-node peak**. **COMMUNITY ESTIMATE:** that is **81.6% average/peak deployed-node ratio** — not GPU utilization, MFU, or paid-traffic utilization. DeepSeek also said it reduced inference nodes during low-load hours and reassigned capacity to research and training.

For V4, the official API lists concurrency limits of **DISCLOSED — 500 for Pro and 2,500 for Flash**. Reuters reported that Pro's original premium reflected constraints in high-end compute capacity. Credible signs of relative capacity scarcity; no utilization percentage.

## 3. PRICING & REALIZATION

### Live official prices on July 9, 2026

All figures **DISCLOSED official list prices per 1M tokens**:

| Model | Cache-hit input | Cache-miss input | Output |
| --- | --- | --- | --- |
| **V4-Flash Preview** | **$0.0028** | **$0.14** | **$0.28** |
| **V4-Pro Preview** | **$0.003625** | **$0.435** | **$0.87** |

Source: [DeepSeek API pricing](https://api-docs.deepseek.com/quick_start/pricing/). The general `deepseek-chat` and `deepseek-reasoner` aliases were still documented as routing to Flash until July 24 — a user paying through an alias was not necessarily buying Pro. **DISCLOSED.**

Using the 2025 production mix (**56.3% of input tokens were cache hits**): **COMMUNITY ESTIMATE — V4-Pro's weighted input list realization is $0.19235/M aggregate input tokens**; V4-Flash's is about **$0.06276/M**.

### Price compression since launch and since R1

**CREDIBLY REPORTED:** on May 23, DeepSeek made a **75% V4-Pro price reduction permanent** (to one quarter of its original level). Current RMB schedule: ~**RMB0.025 cache hit, RMB3 cache miss, RMB6 output** per million tokens, versus original ~**RMB0.1/12/24**. [Reuters](https://www.reuters.com/world/china/chinas-deepseek-make-permanent-75-price-cut-flagship-v4pro-ai-model-2026-05-23/)

- **COMMUNITY ESTIMATE — original V4-Pro dollar-equivalent prices were approximately $0.0145 hit / $1.74 miss / $3.48 output** — exactly 4× today's tariff.

- **COMMUNITY ESTIMATE — current Pro is 3.11× Flash on cache-miss input and output, but only 1.29× on cache hits.**

Against the old R1 tariff (**DISCLOSED — $0.14 hit / $0.55 miss / $2.19 output**): current V4-Pro cache-hit price is **97.4% lower**, cache-miss **20.9% lower**, output **60.3% lower**. The output-price compression is the main reason today's list-price margin cannot simply inherit the old 84.5% theoretical margin.

### Time-of-day price discrimination

There is **no active off-peak discount on the official pricing page as of July 9**.

- **DISCLOSED:** the old overnight discount ended **September 5, 2025**. [DeepSeek notice](https://api-docs.deepseek.com/news/news250821)

- **CREDIBLY REPORTED:** the 2025 program had reduced R1 prices by up to **75%** and V3 by up to **50%** during 00:30–08:30 Beijing time. [Reuters](https://www.reuters.com/technology/chinas-deepseek-cuts-off-peak-pricing-by-up-75-2025-02-26/)

- **CREDIBLY REPORTED, future at cutoff:** with the full V4 launch, DeepSeek planned **2× the base rate during 09:00–12:00 and 14:00–18:00 Beijing time** (Pro output RMB6 → RMB12/M in those windows). [TechNode](https://technode.com/2026/06/30/deepseek-to-launch-v4-in-mid-july-with-new-peak-time-api-pricing/)

Economically, DeepSeek is moving from an explicit off-peak discount to an explicit peak surcharge. Both monetize scarce peak capacity; the 2026 framing preserves the low base tariff as the headline list price.

### Realized versus theoretical revenue

DeepSeek has not published a newer realized-revenue bridge. In the February 2025 note (**DISCLOSED**), theoretical revenue materially overstated actual receipts because: V3 was cheaper than R1; only a subset of usage was monetized; web/app access was free; off-peak discounts reduced paid API rates. "List-price gross margin" and "fleet-wide realized gross margin" are different quantities.

## 4. COST/MARGIN EVIDENCE

### What DeepSeek actually disclosed in 2025 (Feb 27–28)

| Production metric | Value |
| --- | --- |
| Peak nodes | **DISCLOSED — 278 eight-H800 nodes** |
| Average nodes | **DISCLOSED — 226.75 nodes** |
| Accelerator cost basis | **DISCLOSED — assumed $2/H800-hour** |
| Daily serving cost | **DISCLOSED — $87,072** |
| Input volume | **DISCLOSED — 608B tokens/day** |
| Cache hits | **DISCLOSED — 342B tokens/day, 56.3% of input** |
| Output volume | **DISCLOSED — 168B tokens/day** |
| Per-node input throughput | **DISCLOSED — 73,700 tok/s** |
| Per-node output throughput | **DISCLOSED — 14,800 tok/s** |
| Average generation speed | **DISCLOSED — 20–22 tok/s per request** |
| Average KV length | **DISCLOSED — 4,989 tokens** |
| Theoretical all-R1-price revenue | **DISCLOSED — $562,027/day** |
| DeepSeek's stated "cost-profit margin" | **DISCLOSED — 545%** |

### Correct interpretation of "545%"

545% was profit ÷ cost: (562,027 − 87,072)/87,072 = 545.5%. The conventional list-price serving gross margin is 1 − 87,072/562,027 = **84.51%**. Implied revenue/cost multiple: **6.45×**.

Using disclosed node throughput and $16/node-hour: **COMMUNITY ESTIMATE — $0.0603/M aggregate input tokens** (prefill phase) and **$0.3003/M output tokens** (decode phase). These reflect DeepSeek's disaggregated prefill/decode topology on the old H800 configuration — not generic H800 hardware constants.

### Repricing the 2025 workload at current V4 tariffs

Holding token volumes and the old $87,072/day cost constant:

| Tariff applied to old production mix | Theoretical daily revenue | Gross margin at unchanged cost |
| --- | --- | --- |
| Old R1 | **DISCLOSED — $562,027** | **84.5%** |
| Current V4-Pro | **COMMUNITY ESTIMATE — $263,110** | **66.9%** |
| Current V4-Flash | **COMMUNITY ESTIMATE — $85,238** | **−2.2%** |

This is a **tariff translation, not a V4 cost measurement**. Implications: current Pro would earn only **46.8%** of the old all-R1 theoretical revenue on the same traffic; V4 Pro needs only a modest cost reduction versus the old stack to stay near a 70% list margin; Flash cannot be served on an unchanged V3/R1 cost structure and historical mix without losing money — it must benefit from its much smaller 13B-active model, better batching/hardware, strategic subsidy, or a different workload mix.

### Is there newer margin evidence?

No newer first-party source through July 9 supplies all three of: production tokens or accelerator throughput; productive accelerator-hours and fleet composition; realized or list-equivalent API revenue. Any updated margin is necessarily a modeled estimate.

## 5. VERDICT

### Current flagship estimate

For **DeepSeek-V4-Pro Preview at the July 9 list price**:

> **COMMUNITY ESTIMATE — central marginal/direct serving gross margin: approximately 69%.**
>
> **COMMUNITY ESTIMATE — subjective 80%-credible interval: approximately 45%–83%.**

### Calculation

Normalize the 2025 workload to one million output tokens: **2.0357M cache-hit input + 1.5833M cache-miss input + 1M output**.

Current Pro list revenue for that bundle: 2.0357(0.003625) + 1.5833(0.435) + 1(0.87) = **$1.5661**. The disclosed 2025 daily cost normalized by output volume: 87,072/168,000 = **$0.5183** per bundle.

Two unknown factors are then varied:

| Scenario | Hardware-hour factor | Work/token factor | Total cost factor | Cost per bundle | List-price GM |
| --- | --- | --- | --- | --- | --- |
| Efficient/upper-margin | **SPECULATION — 0.50×** | **SPECULATION — 1.05×** | 0.525× | **$0.272** | **82.6%** |
| Central | **SPECULATION — 0.75×** | **SPECULATION — 1.25×** | 0.9375× | **$0.486** | **69.0%** |
| Constrained/lower-margin | **SPECULATION — 1.10×** | **SPECULATION — 1.50×** | 1.65× | **$0.855** | **45.4%** |

Why defensible: the 0.75× central hardware factor ≈ **$1.50 per productive old-H800-equivalent hour**, near the upper end of observed Chinese H800 asking prices with some premium for mixed-fleet/fabric overhead. The 1.25× central work factor sits just below the raw 1.324× active-parameter ratio, allowing selective FP4 and sparse attention to offset part — but not all — of the extra MoE work.

### Calculator-ready direct-cost outputs

| Serving component | Central estimate | 80%-credible range |
| --- | --- | --- |
| Aggregate input/prefill cost | **$0.0565/M input tokens** | **$0.0317–$0.0995/M** |
| Output/decode cost | **$0.2815/M output tokens** | **$0.1577–$0.4955/M** |
| Historical-mix bundle cost per 1M output | **$0.486** | **$0.272–$0.855** |
| Bundle revenue at current Pro list price | **$1.566** | Tariff-fixed |
| Bundle list-price GM | **69.0%** | **45.4%–82.6%** |

The input figure is an aggregate average over the historical hit/miss mix — do not assign it individually to a cache-hit token.

For the announced future **2× peak tariff**, unchanged costs would imply **central peak-window GM of 84.5%** (interval 72.7–91.3%) — strikingly close to the old 84.5% theoretical R1 margin, but not yet live on July 9.

### Unknowns ranked by impact on the interval

1. **V4-Pro accelerator work per token.** A directly measured V4 prefill/decode tok/s figure would collapse much of the interval. Active parameters point upward; FP4 and sparse attention point downward.

2. **Current production fleet mix and productive chip-hour cost.** H800, H20, Ascend 950, and rented versus depreciated internal capacity have very different capital, software, and power profiles.

3. **Batching, occupancy, and reserved-capacity utilization.**

4. **Current prompt length, KV length, cache-hit rate, and latency objective.** V4's largest architectural advantage occurs at long context; the historical average KV length was only 4,989.

5. **Actual FP4 kernel realization.** Native FP4 storage does not guarantee proportional end-to-end throughput, especially across heterogeneous Huawei and Nvidia deployments.

6. **Non-accelerator direct cost allocation.**

## 6. KNOWN KNOWNS

- **DISCLOSED — V4-Pro is officially 1.6T total / 49B active; V4-Flash is 284B / 13B.** The 1.6T figure is not merely community speculation. [DeepSeek release](https://api-docs.deepseek.com/news/news260424) · [technical report](https://arxiv.org/html/2606.19348v1)

- **DISCLOSED — V4's FP4 scope is selective:** routed-expert weights and the sparse-attention indexer; KV remains mixed BF16/FP8.

- **DISCLOSED — July 9 V4-Pro pricing is $0.003625/M cache-hit input, $0.435/M cache-miss input, and $0.87/M output.** [Pricing page](https://api-docs.deepseek.com/quick_start/pricing/)

- **DISCLOSED — DeepSeek's 2025 serving trace used H800s and an assumed $2/H800-hour; COMMUNITY ESTIMATE — its conventional theoretical list-price margin was 84.5%, not 545%.** [Disclosure](https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md)

- **CREDIBLY REPORTED — Huawei Ascend 950 hardware is relevant to the present V4 deployment, but no production fleet split has been published.**

- **CREDIBLY REPORTED — R2 was a real delayed project; not a released or priced serving product as of July 9, 2026.**

## 7. KNOWN UNKNOWNS

- **Current fleet mix:** no public percentage split among H800, H20, Ascend 950, other Ascend systems, or third-party cloud capacity. The largest uncertainty in productive hardware cost.

- **V4 production throughput:** no V4-Pro equivalent of the disclosed 73.7k/14.8k tok/s per H800 node.

- **DeepSeek's actual 2026 chip-hour basis:** owned/rented split, depreciation horizon, reservation commitments, power price, internal transfer pricing.

- **Current workload distribution:** cache-hit rate, mean prompt/KV length, output length, batch distribution, Pro-versus-Flash traffic mix.

- **Hardware-specific FP4 efficiency:** how much V4 traffic uses native FP4-capable paths; relative Nvidia-versus-Ascend kernel efficiency.

- **Realized revenue:** no current bridge from theoretical list-price revenue to paid API receipts after free app/web traffic, aliases routing to Flash, customer credits, negotiated rates, and forthcoming peak-window pricing.
