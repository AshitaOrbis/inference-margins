# Zhipu / Z.ai (GLM) — GPT-5.6 Pro deep dive

> Run 2026-07-09 · 50m23s · model `gpt-5-6-pro` (Pro-verified) · [conversation](https://chatgpt.com/c/6a5083ce-d2bc-83e8-a922-2e07da15036a)
> Verdict: **GLM-5.2 marginal serving gross margin ≈ 60% central, 80% CI ≈ 35–77%** at direct API list price. Anchored by audited HK filings: FY2025 cloud/API gross margin 18.9% (H1 2025: −0.4%).
> Archived verbatim below (DOM-extracted; math notation may render with minor duplication artifacts).

---

## 1. MODELS

**Evidence cutoff: July 9, 2026.** "Marginal serving cost" below means long-run incremental inference COGS: accelerator service, host/network/KV-cache resources, and directly attributable serving overhead. It excludes training, research, sales, general administration, and financing.

**Confidence labels**

- **DISCLOSED:** first-party model documentation, provider price sheet, or audited/regulatory filing.

- **CREDIBLY REPORTED:** Reuters or an independent/vendor benchmark with an identifiable methodology.

- **COMMUNITY ESTIMATE:** a technically credible but unaudited self-report.

- **SPECULATION:** my assumption, calculation, or inference.

| Model | Architecture | Precision evidence | Serving interpretation |
| --- | --- | --- | --- |
| **GLM-5.2** | **DISCLOSED — 744B total / 40B active** (5.38% activation). Open release supports a **1M-token context window**. | **DISCLOSED — BF16 and FP8 open checkpoints.** **CREDIBLY REPORTED — Baseten created a custom NVFP4 checkpoint from the FP8 release and reported no material BFCL degradation.** Zhipu's own production precision is **not disclosed**. | Frontier model and headline API product. The 40B active count understates memory/network burden because the full 744B MoE weight set must be resident or distributed. |
| **GLM-4.7 — workhorse** | **DISCLOSED — 355B total / 32B active** (9.01% activation). | **DISCLOSED — BF16 and FP8 open checkpoints.** First-party API serving precision **not disclosed**. | Z.ai's Coding Plan documentation recommends GLM-4.7 for routine work and GLM-5.2 for harder tasks — the best public candidate for the economical workhorse/routing tier. |
| **GLM-4.7-Flash** | **DISCLOSED — 30B total / 3B active.** | **DISCLOSED — BF16 checkpoint.** | International API price is free — acquisition/routing/ecosystem role. |

Sources: [official GLM-5 repository](https://github.com/zai-org/GLM-5), [official GLM-4.5/4.7 repository](https://github.com/zai-org/GLM-4.5/blob/main/README.md), [Z.ai Coding Plan overview](https://docs.z.ai/devpack/overview), [Baseten's GLM-5.2 serving write-up](https://www.baseten.co/blog/how-we-built-the-worlds-fastest-api-for-glm-52/).

Two additional architecture claims matter for cost:

- **DISCLOSED, company claim — IndexShare reduces per-token attention FLOPs by 2.9× at a 1M-token context**, compared with the model's non-IndexShare baseline.

- **DISCLOSED, company claim — multi-token prediction increased accepted-token length by up to 20%.**

These are real cost levers, but neither directly states production dollars per token; realized benefit depends on context distribution, speculative-decoding acceptance, batch shape, and serving implementation.

Baseten's result is useful but should not be transferred to Zhipu's domestic fleet without adjustment: **CREDIBLY REPORTED — more than 280 output tokens/s/user on Blackwell using NVFP4**, with prefill/decode disaggregation, MTP, KV-aware routing, and prefix caching (disaggregation approximately doubled throughput on its observed workload mix). Evidence the model can be served economically on Western Blackwell — not evidence that Zhipu uses Blackwell.

---

## 2. FLEET & PROCUREMENT

### First-party inference hardware

**DISCLOSED — Zhipu says GLM-5.2's online inference runs across multiple domestic platforms**, explicitly naming Huawei Ascend, Alibaba T-Head, Moore Threads, Cambricon, Baidu Kunlunxin, MetaX, Hygon, Biren, and Iluvatar CoreX — described as production deployments supporting throughput, latency, and concurrency. Establishes domestic diversification; does **not** reveal traffic share by vendor or model. [Zhipu GLM-5.2 release](https://www.zhipuai.cn/zh/research/161)

For the closely related GLM-5 architecture:

- **DISCLOSED — one Huawei Atlas 800T A3 server (8× Ascend 910-series NPUs) can hold the ~750B model** using **W8A8 for attention/ordinary MLP and W4A8 for MoE experts**.

- **DISCLOSED, company claim — Zhipu/Huawei say one domestic node can approach the throughput of two foreign-GPU nodes and lower long-context deployment cost by 50%.** Vendor claims without disclosed workload/latency/price — not used directly in the central cost calculation. [Zhipu GLM-5 technical report](https://www.zhipuai.cn/zh/research/153) · [Huawei GLM-5 deployment note](https://www.hiascend.com/activities/dynamic-news/648) · [Atlas A3 specifications](https://www.hiascend.com/hardware/ai-server)

### H800/H20 and overseas hardware

**No disclosed evidence** ties Zhipu's first-party production GLM-5.2 service to a particular stock of H800s or H20s. The official repository contains H20-related examples (implementation/training examples, not fleet inventory). Baseten's Blackwell deployment and @_xjdr's GB300 run are independently useful serving benchmarks; neither establishes Zhipu ownership, leasing, or production use.

### Owned versus rented capacity

The audited procurement disclosures point toward a service-heavy cost basis:

- **DISCLOSED — 2025 capital expenditure was RMB74.7 million**, down from **RMB462.3 million in 2024**.

- **DISCLOSED — in 2024 Zhipu primarily used equipment leases to acquire computing resources; in 2025 it primarily procured computing services, supplemented by equipment leases.**

- **DISCLOSED — cloud-computing supplier agreements generally run for one to four years.**

- **DISCLOSED — prepayments for computing services were RMB166.9 million at year-end 2024 and RMB134.0 million at June 30, 2025.**

- **DISCLOSED — purchases from an anonymized "Supplier E," a Beijing cloud/IT subsidiary of a large Chinese internet company, were RMB394.8 million in 2024 and RMB123.5 million in H1 2025.**

A rental/reserved-service model is therefore more appropriate than assuming Zhipu buys GPUs and depreciates them itself. It also makes accounting gross margin somewhat more informative about unit economics than for a provider carrying a large owned fleet — although contracts may still include minimum commitments and idle-capacity risk. [HKEX FY2025 results](https://www.hkexnews.hk/listedco/listconews/sehk/2026/0331/2026033101549.pdf) · [HKEX prospectus](https://www1.hkexnews.hk/listedco/listconews/sehk/2025/1230/2025123000017.pdf)

### Public Chinese cloud-rate comparables

These are **not Zhipu's confidential rates** — public CTyun rates useful for bounding the market. USD conversions use **RMB6.9074/USD** (March 31, 2026 reference).

| Accelerator | Public rate | USD equivalent | Confidence and interpretation |
| --- | --- | --- | --- |
| Ascend 910B, ordinary CTyun pool | **RMB36.36–41.29/card-hour** | **$5.26–$5.98/card-hour** | **DISCLOSED by CTyun**, retail/on-demand, not Zhipu contract pricing. |
| Eight-card Ascend server at the same rate | **RMB290.9–330.3/server-hour** | **$42.1–$47.8/server-hour** | Arithmetic; excludes host/network/storage/discount uncertainty. |
| Ascend 910B, special research pool | **RMB9.60/card-hour** | **$1.39/card-hour** | **DISCLOSED by CTyun**, probably not representative of unrestricted commercial capacity. |
| Nvidia H20 96GB | **RMB17.05/card-hour** | **$2.47/card-hour** | **DISCLOSED by CTyun** public research-pool rate. |
| Nvidia H800 PCIe | **RMB28.56/card-hour** | **$4.13/card-hour** | **DISCLOSED by CTyun** public research-pool rate. |
| Nvidia H800 NVLink | **RMB34.00/card-hour** | **$4.92/card-hour** | **DISCLOSED by CTyun** public research-pool rate. |

Sources: [CTyun ordinary Ascend pricing](https://www.ctyun.cn/document/11060230/11060364) · [CTyun research-pool pricing](https://www.ctyun.cn/document/10097674/10135961)

Best representation of Zhipu's undisclosed basis: **SPECULATION — $2.0–$4.8 per contracted accelerator-card-hour, central prior $3.2/card-hour; 65–85% useful serving occupancy, central 75%.** Not performance-normalized units — used only as a sanity check; the final token-cost model is anchored more heavily to financial margins, reseller prices, and measured serving economics.

Utilization evidence is directional: **DISCLOSED/CREDIBLY REPORTED — Zhipu described a compute shortage beginning February 2026, demand exceeding supply, API requests rising by more than 400%, and paid-token consumption increasing.**

---

## 3. PRICING & REALIZATION

### International Z.ai API list price

All **DISCLOSED — USD per 1M tokens** ([official pricing](https://docs.z.ai/guides/overview/pricing)). Cache-storage charges temporarily free; cached-token processing billed at the cached-input rate.

| Model | Uncached input | Cached input | Output |
| --- | --- | --- | --- |
| GLM-5.2 | **$1.40** | **$0.26** | **$4.40** |
| GLM-5.1 | **$1.40** | **$0.26** | **$4.40** |
| GLM-5 | **$1.00** | **$0.20** | **$3.20** |
| GLM-5-Turbo | **$1.20** | **$0.24** | **$4.00** |
| GLM-4.7 | **$0.60** | **$0.11** | **$2.20** |
| GLM-4.7-FlashX | **$0.07** | **$0.01** | **$0.40** |
| GLM-4.7-Flash | **Free** | **Free** | **Free** |
| GLM-4.6 / GLM-4.5 | **$0.60** | **$0.11** | **$2.20** |
| GLM-4.5-Air | **$0.20** | **$0.03** | **$1.10** |

Two economically important observations: **GLM-5.2 output is priced at 3.14× uncached input and 16.9× cached input** — decode throughput is likely the largest direct determinant of gross margin. **The cached-input discount is 81.4%** — Z.ai passes a large portion of prefix-cache savings to customers.

### Coding Plan

No fixed token allowance; enforceable limits are prompt windows, weekly caps, and model-specific quota multipliers. All **DISCLOSED** ([overview](https://docs.z.ai/devpack/overview) · [transition](https://docs.z.ai/devpack/transition)):

| Plan | Monthly | Prompts per 5 hours | Prompts per week | Quarterly | Annual |
| --- | --- | --- | --- | --- | --- |
| Lite | **$18** | **80** | **400** | **$48.60** | **$172.80** |
| Pro | **$72** | **400** | **2,000** | **$194.40** | **$691.20** |
| Max | **$160** | **1,600** | **8,000** | **$432.00** | **$1,536.00** |

Z.ai estimates **one coding prompt ≈ 15–20 underlying model calls**. GLM-5.2 and GLM-5-Turbo ordinarily consume quota at **3× during the 14:00–18:00 UTC+8 peak and 2× off-peak**; a promotion reduces off-peak consumption to 1× through September 2026 — a powerful tool for controlling realized compute consumption without changing advertised prompt caps.

### Nominal value versus actual realization

Official documentation makes two claims that do not reconcile cleanly:

- **DISCLOSED, company claim — monthly API-equivalent quota is approximately 15–30× the subscription fee.**

- **DISCLOSED, company claim — the plan provides "tens of billions" of tokens at approximately 1% of ordinary API pricing** (implying ~100× list-value leverage).

At the more conservative 15–30× claim, cash realization is **3.3–6.7% of list value** on all three plans. Using **SPECULATION — 8 input tokens per output token** and the **COMMUNITY ESTIMATE — 41% cache-hit rate** (from @_xjdr's event), GLM-5.2 list ≈ **$1.318 per million total tokens**, implying (value-equivalent, NOT allowances): Lite ≈ 205–410M, Pro ≈ 820M–1.64B, Max ≈ 1.82–3.64B total tokens/month.

The plan therefore has obvious potential for usage leakage. Using the central cost model in Section 5, serving cost ≈ **39.8% of API list value**; a user genuinely consuming 15–30× the fee in GLM-5.2 API value would incur **≈6.0–11.9× the subscription fee in serving cost**. That does not mean the plan necessarily loses money overall — its economics must depend on user breakage and weekly caps; the 2×/3× GLM-5.2 quota multipliers; off-peak utilization of otherwise idle capacity; routing ordinary tasks to GLM-4.7 or cheaper variants; shorter actual prompts; and "API-equivalent value" as a marketing construct.

Evidence Zhipu has already tightened realization: **DISCLOSED — legacy plans without weekly caps were phased out; Coding Plan prices rose 30% in February 2026; the introductory discount was removed; ~242,000 paying Coding Plan developers.**

---

## 4. COST/MARGIN EVIDENCE

### IPO and audited financial status

Status correction: **DISCLOSED/CREDIBLY REPORTED — Zhipu listed in Hong Kong on January 8, 2026.** As of July 9 it was pursuing a Shanghai STAR Market dual listing; no accepted STAR prospectus found. The primary financial source is therefore its HKEX prospectus and FY2025 results. [Reuters on the dual-listing plan](https://www.reuters.com/world/asia-pacific/after-anthropic-shutdown-chinas-zai-closes-frontier-gap-it-plans-dual-listing-2026-06-25/)

### Revenue and gross margin (FY2025, audited, DISCLOSED)

| FY2025 item | Amount | Share / margin |
| --- | --- | --- |
| Total revenue | **RMB724.3m** | **100%** |
| Cloud-based model/API services | **RMB190.4m** | **26.3%** |
| On-premise solutions | **RMB534.0m** | **73.7%** |
| Enterprise agents | **RMB165.7m** | **22.9% of revenue** |
| Enterprise models | **RMB365.7m** | **50.5%** |
| Technology services | **RMB2.5m** | **0.35%** |
| Cloud/API gross profit | **RMB36.0m** | **18.9% gross margin** |
| Total cost of revenue | **RMB427.7m** | Company-wide |
| Net loss | **RMB4.718bn** | Not relevant to marginal serving margin |

The most informative sequence:

- **DISCLOSED — H1 2025 cloud/API gross margin was −0.4%.**

- **DISCLOSED — FY2025 cloud/API gross margin recovered to 18.9%.**

- **DISCLOSED — management attributed the improvement to inference-efficiency gains, economies of scale/declining marginal cost, price increases, and programming-subscription growth.** The prospectus says H1 2025 was depressed by price reductions undertaken to gain market share.

This 18.9% is **not** the requested marginal GLM-5.2 margin — it includes reserved/idle capacity, personnel, support, promotions, model mix, subscriptions, older-model traffic. But because Zhipu increasingly purchases compute as a service, it is a more relevant anchor than consolidated company gross margin.

### Repricing counterfactual

Zhipu reported API call prices rose **83% relative to end-2025**, while requests rose more than **400%**. Holding FY2025 unit cost and mix constant: 1 − (1−18.9%)/1.83 = **55.7%**. **SPECULATION — a price-only counterfactual puts cloud/API gross margin at 55.7%** — a valuable independent anchor for a central marginal estimate in the high-50s or low-60s.

### Third-party reseller prices (all DISCLOSED, USD/M tokens)

| Provider | Uncached input | Cached input | Output | Caveat |
| --- | --- | --- | --- | --- |
| Baseten | **$1.40** | **$0.26** | **$4.40** | Same as Z.ai list; optimized Blackwell/NVFP4 stack. |
| Fireworks Standard | **$1.40** | **$0.14** | **$4.40** | Lower cache price. |
| Fireworks Batch | **$0.70** | — | **$2.20** | 50% discount, asynchronous scheduling. |
| Together | **$1.40** | **$0.26** | **$4.40** | FP4 endpoint, 262K context. |
| DeepInfra Standard | **$0.93** | **$0.18** | **$3.00** | Lowest public real-time price found. |

Sources: [Baseten pricing](https://www.baseten.co/pricing/) · [Fireworks pricing](https://docs.fireworks.ai/serverless/pricing) · [Together GLM-5.2](https://docs.together.ai/docs/glm-5.2-quickstart) · [DeepInfra GLM-5.2](https://deepinfra.com/zai-org/GLM-5.2)

These are **conditional cost ceilings**: if DeepInfra's standard endpoint has positive contribution margin, its direct serving cost must be below **$3.00/M output**. Assuming a 10–30% reseller margin: implied output-cost ceiling **$2.10–$2.70/M**; Fireworks Batch implies **$1.54–$1.98/M**. For the Section 5 representative workload, the DeepInfra retail bill is $7.98 vs **$11.86 at Z.ai list** — a conditional lower-bound margin of ~**32.7%** at Z.ai's list price before granting DeepInfra any profit.

### Throughput and modeled serving cost

- **CREDIBLY REPORTED — Baseten exceeded 280 output tokens/s/user on Blackwell/NVFP4.**

- **COMMUNITY ESTIMATE — @_xjdr reported ~232 output tokens/s/GPU and a 41% cache-hit rate during a GB300 NVL72 free-use event.** [Post](https://x.com/_xjdr/status/2071835604095300079)

- **CREDIBLY REPORTED — SemiAnalysis' interpolated GLM-5.1 benchmark produces ~$0.41–$4.14/M output tokens across B200/GB300 configurations and 43–91 tok/s/user latency targets.** [InferenceX comparison](https://inferencex.semianalysis.com/compare/glm-5-1-b200-vs-gb300) — the very wide range shows how interactivity, batch, and hardware generation dominate a single "cost per token."

GLM-5.1 is not GLM-5.2, and a Western FP4 deployment is not Zhipu's domestic service. Still, the benchmark supports an output-cost prior centered around the low-$2 range.

---

## 5. VERDICT

### Headline estimate

**SPECULATION — central marginal serving gross margin at direct GLM-5.2 API list: 60%.**

**SPECULATION — subjective 80%-confidence interval: 35%–77%.**

### Representative workload

**8 billed input tokens per output token (SPECULATION)**; **41% input-cache hit rate (COMMUNITY ESTIMATE)**; long-run incremental serving cost.

| Token class | Z.ai list price | Central serving cost | Wider stress range | Central component margin |
| --- | --- | --- | --- | --- |
| Uncached input | **$1.40/M** | **$0.50/M** | **$0.22–$0.95/M** | **64%** |
| Cached input | **$0.26/M** | **$0.08/M** | **$0.03–$0.18/M** | **69%** |
| Output | **$4.40/M** | **$2.10/M** | **$1.20–$3.20/M** | **52%** |

Revenue = 4.40 + 8(0.59×1.40 + 0.41×0.26) = **$11.8608**. Cost = 2.10 + 8(0.59×0.50 + 0.41×0.08) = **$4.7224**. Gross margin = 1 − 4.7224/11.8608 = **60.2%**.

Equivalently: blended list revenue **$1.318/M total tokens**; blended marginal serving cost **$0.525/M**; blended gross profit **$0.793/M**.

The central output cost of $2.10/M is deliberately close to the low end of the DeepInfra reseller-margin inference and the high end of a profitable Fireworks Batch inference. The overall 60% result is close to — but modestly above — the **55.7% price-only financial counterfactual**, reflecting better utilization and inference optimization after FY2025.

### Sensitivity to token mix

Holding component costs fixed: 2:1 input:output → ~56%; 8:1 → ~60%; 20:1 → ~62%. The wider component stress ranges mechanically generate ~30–80% margin; the stated 80% interval narrows to **35–77%** because the most extreme component assumptions are unlikely to co-occur.

### Why the interval is wide, ranked by impact

1. **Production decode throughput and latency target: ±15–20 margin points.** GLM-5.2 output pricing is high, but decode becomes expensive with highly interactive latency, low MTP acceptance, or poor batching.

2. **Contracted compute price and actual chip mix: ±10–15 points.** Public Ascend/H20/H800 card-hour prices span more than 4× before performance correction; Zhipu's confidential 1–4-year service rates and traffic shares are unknown.

3. **Useful occupancy and treatment of reserved idle capacity: ±7–12 points.**

4. **First-party serving precision and fallback behavior: ±6–10 points.** Clean W4/NVFP4 expert paths are far cheaper than frequent FP8 fallback, quality-based rerouting, dual execution, or low-batch expert imbalance.

5. **Workload distribution: ±5–8 points.**

6. **Non-accelerator serving overhead and reseller-evidence reliability: ±3–6 points.**

**Bottom line:** for direct, undiscounted GLM-5.2 API traffic, **60% marginal serving gross margin is the central estimate**, with **35–77%** as the defensible 80% range. The most likely miss is not parameter count; it is assumed production output throughput or Zhipu's confidential compute-service price. Coding Plan margin can be dramatically lower — and negative for a fully saturating GLM-5.2-heavy user — because realized revenue is only a small fraction of nominal API-list value.

---

## 6. KNOWN KNOWNS

- **DISCLOSED — GLM-5.2 is a 744B-total, 40B-active MoE with BF16 and FP8 open checkpoints and a 1M-token context window.** [Repository](https://github.com/zai-org/GLM-5)

- **DISCLOSED — international GLM-5.2 list price is $1.40/M uncached input, $0.26/M cached input, and $4.40/M output.** [Z.ai pricing](https://docs.z.ai/guides/overview/pricing)

- **DISCLOSED — Zhipu says first-party online inference uses multiple domestic hardware platforms, including Huawei Ascend, Cambricon, Kunlunxin, Moore Threads, MetaX, Hygon, Biren, T-Head, and Iluvatar.** [GLM-5.2 release](https://www.zhipuai.cn/zh/research/161)

- **DISCLOSED — Zhipu moved toward primarily purchasing computing services in 2025; capex fell from RMB462.3m to RMB74.7m.** [FY2025 results](https://www.hkexnews.hk/listedco/listconews/sehk/2026/0331/2026033101549.pdf)

- **DISCLOSED — FY2025 cloud/API revenue was RMB190.4m and cloud/API gross margin was 18.9%, after a −0.4% margin in H1 2025.** [FY2025 results](https://www.hkexnews.hk/listedco/listconews/sehk/2026/0331/2026033101549.pdf) · [prospectus](https://www1.hkexnews.hk/listedco/listconews/sehk/2025/1230/2025123000017.pdf)

- **DISCLOSED — third parties sell GLM-5.2 below Z.ai list: DeepInfra at $0.93/$0.18/$3.00 and Fireworks Batch at $0.70 input/$2.20 output** — conditional ceilings on profitable third-party serving cost.

## 7. KNOWN UNKNOWNS

- **Production chip mix and traffic allocation.** Many supported domestic platforms; no disclosure of what fraction of GLM-5.2 tokens runs on each.

- **Confidential compute-service price.** Filings disclose procurement form, suppliers, prepayments, aggregate spending — no card-hours, node-hours, token throughput, or unit rate.

- **Actual production precision.** Open FP8 checkpoints and domestic W8A8/W4A8 recipes do not establish first-party serving precision.

- **Production throughput at a defined service-level objective.** No output tokens/s/card, TTFT, batch size, context distribution, or MTP acceptance on Zhipu's own fleet.

- **Realized customer mix.** Cache-hit rate, input/output ratio, reasoning length, GLM-4.7 routing, enterprise discounts, API vs Coding Plan division — undisclosed.

- **Subscription breakage and quota enforcement.** The 15–30× API-value claim, "1% of API pricing" claim, prompt caps, and model multipliers do not reveal how much compute the median or top-decile subscriber actually consumes.
