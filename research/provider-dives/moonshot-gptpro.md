# Moonshot AI (Kimi) — GPT-5.6 Pro deep dive

> Run 2026-07-09 · 46m58s · model `gpt-5-6-pro` (Pro-verified, Ashitaorbis project) · conversation archived privately
> Verdict: **Kimi K2.7 Code output-token marginal serving gross margin ≈ 81% central, 80% CI ≈ 55–91%** at the $4/M list price (central COGS $0.75/M output).
> Note: the first Moonshot dive completed but its response expired from the MCP retention window before collection; this is the re-run.
> Archived verbatim below (DOM-extracted; math notation may render with minor duplication artifacts).

---

## 1. MODELS

**Evidence labels:** **DISCLOSED** = first-party model/configuration/pricing documents, regulatory filings, or Moonshot-authored systems work; **CREDIBLY REPORTED** = reputable reporting but not audited disclosure; **COMMUNITY ESTIMATE** = reproducible external benchmark or public market proxy; **SPECULATION** = my modeled inference.

Moonshot's lineup as of **July 9, 2026** is unusual: the newest model is a coding-specialist flagship, while the preceding model remains the recommended general-purpose workhorse.

| Role | Model | Architecture | Precision & acceleration | Serving-cost implication |
| --- | --- | --- | --- | --- |
| Coding flagship | **Kimi K2.7 Code** | **DISCLOSED — 1.0T total; 32B active; 61 layers; 384 routed experts; 8 selected + 1 shared; 256K context; 400M MoonViT encoder.** Thinking-only; Moonshot recommends K2.6 for general use. [K2.7 page](https://www.kimi.com/resources/kimi-k2-7-code) · [model list](https://platform.kimi.ai/docs/models) | **DISCLOSED — native selective, weight-only INT4** (4-bit groupwise, group 32; attention/shared-expert/several MLP/head/vision modules excluded). **`num_nextn_predict_layers: 0` — no native MTP.** [config](https://huggingface.co/moonshotai/Kimi-K2.7-Code/blob/main/config.json) | **DISCLOSED — 595GB checkpoint. COMMUNITY ESTIMATE — vLLM verified minimum 8×H200.** INT4 cuts weight residency/bandwidth; the 1T expert pool still has to live somewhere. [vLLM recipe](https://recipes.vllm.ai/moonshotai/Kimi-K2.7-Code) |
| Workhorse | **Kimi K2.6** | **DISCLOSED — same 1.0T/32B backbone**, text+image+video, thinking and non-thinking. [K2.6 card](https://huggingface.co/moonshotai/Kimi-K2.6) | **DISCLOSED — native INT4, ~595GB.** | Economically close enough to K2.7 that K2.5/K2.6 benchmarks inform K2.7. |

Qualifications: **hosted precision is not disclosed** (released-weights precision ≠ Moonshot's production path — any exact hosted-precision claim is SPECULATION). **DISCLOSED — K2.7 uses ~30% fewer thinking tokens than K2.6** on reported evals — reduces cost per completed task, not cost per token.

**Bottom line on INT4:** economically significant because it makes a single high-memory 8-GPU replica feasible and reduces decode weight traffic; it does not remove the 1T fixed-memory footprint, routing communication, or long-context KV requirements.

---

## 2. FLEET & PROCUREMENT

### What Moonshot actually disclosed

Strongest evidence: [Mooncake paper, USENIX FAST '25](https://www.usenix.org/system/files/fast25-qin.pdf):

- **DISCLOSED — thousands of serving-system nodes, >100B tokens/day** (not necessarily all GPU nodes; predates K2.7).
- **DISCLOSED — historical production on NVIDIA A800 and H800 clusters** (Mooncake: +115% requests on A800, +107% on H800 vs prior vLLM-based systems — capacity comparison, not utilization).
- **DISCLOSED — prefill/decode disaggregation, continuous batching, distributed KV-cache over GPU/CPU/DRAM/SSD/RDMA.** No production MFU/occupancy/tok/s/GPU published.

### Alibaba Cloud, Volcengine, H20, Ascend

- **DISCLOSED — Oct 2023: Volcengine was Moonshot's exclusive training/inference acceleration provider** (historical; predates K2.x). [Volcengine](https://www.volcengine.com/docs/6359/1158257)
- **DISCLOSED — Alibaba Model Studio distributes a Moonshot "direct-supplied" service** (Moonshot supplies the model service; doesn't establish Alibaba owns the GPUs). [Aliyun](https://help.aliyun.com/zh/model-studio/kimi-api-by-moonshot-ai)
- **DISCLOSED — Kimi Agent's CPU/tool sandboxes run on Alibaba Cloud** (agent runtime, not LLM backend). [Alibaba blog](https://www.alibabacloud.com/blog/deep-dive-how-kimis-ai-agent-runs-on-alibaba-cloud_602942)
- **No credible public evidence** of H20 in the current endpoint.
- **DISCLOSED by Huawei, not Moonshot — K2.5 deployed on Atlas 800 A2/A3 with W4A8** (595→500GiB, <1% degradation on selected evals) — compatibility proof, not production adoption. [Huawei](https://www.hiascend.com/activities/dynamic-news/20260214-1)

**Owned vs rented:** undisclosed; historical Volcengine relationship proves at least some rented capacity.

### Public China rental proxy (730 h/mo, USD/CNY 6.8036)

| GPU | 8-GPU monthly quote | Per chip-hour |
| --- | --- | --- |
| H20 141GB | **¥40,000 — DISCLOSED vendor quote** | **¥6.85 / $1.01 — COMMUNITY ESTIMATE** |
| H800 | **¥59,000** | **¥10.10 / $1.48** |
| H100 | **¥68,000** | **¥11.64 / $1.71** |
| H200 | **¥80,000** | **¥13.70 / $2.01** |

[Vendor quote](https://www.omniyq.com/) — retail proxies, not Moonshot's basis. Cloud credits should still be valued at opportunity cost.

---

## 3. PRICING & REALIZATION

### API list prices ($/Mtok, ex-tax)

| Model/tier | Cached input | Uncached input | Output | Other |
| --- | --- | --- | --- | --- |
| **K2.7 Code standard** | **$0.19** | **$0.95** | **$4.00** | 262,144 context — all DISCLOSED |
| K2.7 Code HighSpeed | $0.38 | $1.90 | $8.00 | ~180 tok/s (to 260 short-context); "5–6× standard speed" — DISCLOSED |
| K2.7 standard Batch | $0.114 | $0.57 | $2.40 | Batch = 60% of standard — DISCLOSED, derived |
| K2.6 | $0.16 | $0.95 | $4.00 | 262,144 context — DISCLOSED |

[K2.7 pricing](https://www.kimi.com/resources/kimi-k2-7-code-pricing) · [Batch](https://platform.kimi.ai/docs/pricing/batch) · [K2.6 pricing](https://www.kimi.com/resources/kimi-k2-6-pricing). Cache discount is **80%** ($0.19 vs $0.95). Old `kimi-k2-turbo-preview`/`thinking-turbo` SKUs **discontinued May 25, 2026 — DISCLOSED**; the current speed tier is HighSpeed.

### Subscriptions

| Plan | Monthly | Annual-equivalent monthly |
| --- | --- | --- |
| Moderato | **$19** | **$15** |
| Allegretto | **$39** | **$31** |
| Allegro | **$99** | **$79** |
| Vivace | **$199** | **$159** |

(All DISCLOSED.) Free Adagio + tiers include ~6/60/150/360/720 agent-credit equivalents + Kimi Code multipliers; Moonshot warns equivalents are approximate. Documentation is internally inconsistent on credit pools — subscription revenue cannot be cleanly divided into a realized token price. **OK Computer is an Agent mode (Sep 26, 2025), not a model/API SKU.** [Membership pricing](https://www.kimi.com/help/membership/membership-pricing)

### Reasoning-token realization

K2.7 is thinking-only; the Alibaba channel states reasoning/CoT tokens bill as output — **$4/M applies to reasoning tokens**. The 30% thinking-token reduction improves price-per-task, not per-token margin.

---

## 4. COST/MARGIN EVIDENCE

### Direct Moonshot evidence

Sophisticated serving-systems evidence, but **no serving COGS/token, no inference gross margin, no GPU-hour basis, no audited product margin**. Mooncake's real trace: ~**12K-token average conversation inputs, ~40% prefix-cache ratio — DISCLOSED** (predates K2.7).

### Reproducible 128×H200 benchmark ([LMSYS/SGLang K2 deployment](https://www.lmsys.org/blog/2025-07-20-k2-large-scale-ep/))

128×H200 (32 prefill + 96 decode GPUs), 2,000-in/100-out requests, decode batch 480, **224K prefill / 288K decode tok/s aggregate**, $2.30/H200-hr — all COMMUNITY ESTIMATE:

- Decode accelerator cost = 96×$2.30 / (288,000×3600/10⁶) = **$0.213/M output** (the "$0.21" figure — verified).
- Prefill accelerator cost (same arithmetic) = **$0.091/M input** (derived, not author-reported).

Limitations: decode-GPUs-only, original K2 not K2.7, short-context run, excludes reserves/CPU/network/storage/KV-infrastructure/ops, NVIDIA DGX Cloud infrastructure. **An excellent decode accelerator floor, not a Moonshot COGS estimate.**

### Same-lineage K2.5/K2.6 benchmark ([SemiAnalysis InferenceX, May 2026](https://inferencex.semianalysis.com/blog/b200-nvfp4-vs-h200-int4-kimi-k2-vllm-perf-per-dollar))

8K-in/1K-out on single 8-GPU nodes; TCO $1.41/H200-hr, $1.95/B200-hr:

| Per-user speed | H200 INT4 | B200 NVFP4 |
| --- | --- | --- |
| 32 tok/s | $0.413/M out | $0.140/M |
| 40 tok/s | $0.453/M | $0.154/M |
| 50 tok/s | $0.511/M | $0.177/M |
| 70 tok/s | $0.660/M | $0.244/M |
| 90 tok/s | $0.996/M | $0.347/M |

Facts demonstrated: per-user speed/batching moves cost >2× on identical hardware; hardware+precision moves it ~2.7–3.0× at matched interactivity; a Western B200/NVFP4 deployment can be far cheaper than a China H800/H20-style one on the identical model.

### Third-party K2.7 prices (all DISCLOSED)

| Provider | Uncached in | Cached in | Output |
| --- | --- | --- | --- |
| Together | $0.95 | $0.19 | $4.00 |
| Fireworks | $0.95 | $0.19 | $4.00 |
| Novita | $0.95 | $0.19 | $4.00 |
| Baseten | $0.95 | $0.16 | $4.00 |
| **DeepInfra** | **$0.74** | **$0.15** | **$3.50** (priority $1.11/$0.225/$5.25) |
| Groq | — | — | (only old K2-instruct at $1.00/$0.50/$3.00; not comparable) |

**Reseller-ceiling interpretation (SPECULATION):** DeepInfra's $3.50/M output is a weak long-run market-price ceiling, not a cost floor. The identical $4 pricing across four providers may reflect reference pricing/wholesale pass-through rather than four independent profitable-cost observations.

### Financial evidence

- **DISCLOSED — Alibaba invested ~$0.8B (RMB 5.9B) for ~36% of Moonshot** (FY to Mar 2024). [Alibaba filing](https://www1.hkexnews.hk/listedco/listconews/sehk/2025/0626/2025062601784.pdf)
- **CREDIBLY REPORTED — ~$2B raise at ~$20B valuation, May 2026.** [TechCrunch](https://techcrunch.com/2026/05/07/chinas-moonshot-ai-raises-2b-at-20b-valuation-as-demand-for-open-source-ai-skyrockets/)
- **CREDIBLY REPORTED — ARR >$300M by mid-June 2026, API >70% of revenue; new round discussed at $31.5B pre-money.** [Cailian Press](https://finance.sina.com.cn/roll/2026-06-30/doc-inifehke3518487.shtml) · [SSN](https://wallstreetcn.com/articles/3775860)

No public inference spend, gross profit, credit balances, depreciation, or contribution margin.

---

## 5. VERDICT

**K2.7 Code standard output tokens:**

- **DISCLOSED — list price $4.00/M output**
- **SPECULATION — central marginal serving COGS: $0.75/M output**
- **SPECULATION — central marginal serving gross margin: 81%**
- **SPECULATION — 80% CI: COGS $0.35–$1.80/M ⇒ margin 55%–91%**

### Why $0.75/M central

Start from the most transferable benchmark: **$0.45–0.51/M accelerator cost** for H200 INT4 at 40–50 tok/s/user on the same architecture (COMMUNITY ESTIMATE) + **~$0.20–0.30/M** for lower fleet utilization, online headroom, redundancy, CPU/network/storage/KV infrastructure and possibly less favorable hardware (SPECULATION) → **$0.65–0.80/M**, rounded to $0.75. Lower endpoint $0.35 stays above the $0.213 short-context decode floor; upper endpoint $1.80 allows an older/fragmented A800/H800/H20 fleet, low utilization, latency reserves, long-context and multimodal overhead — still materially below DeepInfra's $3.50 selling price.

### Scope

Unit serving economics (accelerators, power, hosts, network/storage/KV, headroom, control plane, direct ops); excludes training/R&D/sales/corporate. **Output-token estimate, not blended** — a blended margin needs Moonshot's I/O ratio, cache-hit ratio, tier mix, batch share, subscription utilization, and discounts. Do **not** apply 81% to HighSpeed: 2× price for 5–6× user speed likely costs substantially more than 2× per token.

### Unknowns ranked by impact

1. **Production tok/s/GPU at the actual latency SLO** ($0.413→$0.996/M from 32→90 tok/s/user on H200 INT4 alone).
2. **Accelerator and hosted precision path** (H200 INT4 vs B200 NVFP4 ≈ 2.7–3.0×; A800/H800/H20/Ascend mix undisclosed).
3. **Batching, headroom, utilization** (no production MFU published).
4. **Economic GPU-hour basis** (China retail proxies $1.01–2.01/hr before strategic terms).
5. **P/D allocation and cache economics.**
6. **Price realization** (batch at 60%, negotiated enterprise, quota subscriptions, undercutting resellers).

---

## 6. KNOWN KNOWNS

- **DISCLOSED — flagship K2.7 Code + workhorse K2.6, both 1T-total/32B-active, 256K context.**
- **DISCLOSED — K2.7 checkpoint is selective weight-only INT4, ~595GB, zero native MTP layers; COMMUNITY ESTIMATE — vLLM 8×H200 floor.**
- **DISCLOSED — K2.7 standard $0.95/$0.19/$4.00; HighSpeed exactly 2×; Batch 60% of standard.**
- **DISCLOSED — historical production on A800/H800, thousands of nodes, >100B tokens/day (Mooncake, USENIX FAST '25).**
- **COMMUNITY ESTIMATE — reproducible K2 H200 decode floor ~$0.213/M output; same-lineage benchmarks $0.14–$1.02/M by hardware/precision/speed.**
- **CREDIBLY REPORTED — ARR >$300M (mid-June 2026), API >70% of revenue; no audited serving margin exists.**

## 7. KNOWN UNKNOWNS

- **Current accelerator mix and physical host** (A800/H800 historical; H20/Ascend unproven; Alibaba distributes but GPU residency unknown).
- **Owned-vs-rented split and effective $/GPU-hour** (leases, credits, minimums, scarcity premiums).
- **Hosted precision and speculative decoding** (open checkpoint ≠ production path).
- **Production throughput, batching, reserve capacity.**
- **Traffic and realization mix** (I/O ratio, cache ratio, batch/HighSpeed share, discounts, subscription utilization).
- **Non-accelerator COGS and audited margin.**
