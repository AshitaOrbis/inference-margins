# OpenAI — GPT-5.6 Pro deep dive

> Run 2026-07-09 · 52m06s · model `gpt-5-6-pro` (Pro-verified) · [conversation](https://chatgpt.com/c/6a508366-a9f0-83e8-ac84-e84bc2bad3e1)
> Verdict: **GPT-5.6 Sol marginal serving gross margin ≈ 94% central, 80% CI ≈ 86–97%** at standard short-context list price (7 cached : 2 fresh : 1 output mix).
> Archived verbatim below (DOM-extracted; math notation may render with minor duplication artifacts).

---

# 1. MODELS: flagship + workhorse

**Evidence cutoff: July 9, 2026.** Labels mean: **DISCLOSED** = OpenAI or a counterparty said it directly; **CREDIBLY REPORTED** = reputable reporting or measured benchmark data; **COMMUNITY ESTIMATE** = public technical estimate with a stated methodology; **SPECULATION** = my synthesis or model assumption.

OpenAI's current general-purpose family is officially divided into **GPT‑5.6 Sol** as the flagship, **GPT‑5.6 Terra** as the balanced workhorse, and **GPT‑5.6 Luna** as the fast, lower-cost tier. OpenAI has not disclosed architecture, parameter counts, number of experts, routing density, or production weight precision for any of the three. [OpenAI](https://openai.com/index/previewing-gpt-5-6-sol/)

### Best parameter estimates

| Model | Role and status | Total parameters | Active parameters per token | Basis |
| --- | --- | --- | --- | --- |
| **GPT‑5.6 Sol** | Flagship **(DISCLOSED)** | **~5T central; subjective 80% range 1–20T (SPECULATION)** | **~100B central (COMMUNITY ESTIMATE); subjective 80% range 50–220B (SPECULATION)** | Zephyr's claim is approximately **100B active (COMMUNITY ESTIMATE)**. Independently, Epoch estimated GPT‑5 at **~100B active (COMMUNITY ESTIMATE)** and elsewhere used a **50–300B 90% range (COMMUNITY ESTIMATE)**. A newer black-box knowledge-capacity paper put GPT‑5.5 in an **effective 3.2–28.7T total-parameter-equivalent range (COMMUNITY ESTIMATE)**, but that is not a literal weight count. |
| **GPT‑5.6 Terra** | Balanced/workhorse **(DISCLOSED)** | **~1T central; 0.25–5T 80% range (SPECULATION)** | **~50B central; 20–110B 80% range (SPECULATION)** | Inferred from its **50% lower input and output price than Sol (DISCLOSED)**, its measured higher throughput, and likely family-level sharing of OpenAI's sparse architecture. It need not be a simple half-sized Sol. |
| **GPT‑5.6 Luna** | Fast/low-cost tier **(DISCLOSED)** | **~0.25T central; 0.05–1.5T 80% range (SPECULATION)** | **~20B central; 8–50B 80% range (SPECULATION)** | Inferred from its **80% lower price than Sol (DISCLOSED)** and measured **~205–229 output tokens/s (CREDIBLY REPORTED)**. It could instead be a much larger model with more aggressive distillation, routing, or speculative decoding. |
| **o3 / o3‑pro** | Legacy reasoning family still listed in the API **(DISCLOSED)** | **~3T effective capacity; published 90% band 1.0–8.9T (COMMUNITY ESTIMATE)**; literal deployed weight count unknown | **~70B central; 30–180B 80% range (SPECULATION)** | A 2026 black-box factual-capacity study placed o3 in the **1.0–8.9T effective-total range (COMMUNITY ESTIMATE)**. OpenAI says o3‑pro is a version of o3 that receives more inference compute, so it should not be assigned a separate base parameter count **(DISCLOSED)**. |
| **o4‑mini** | Legacy efficient reasoning model still listed **(DISCLOSED)** | **~0.4T effective capacity; roughly 0.14–1.3T 90% range (COMMUNITY ESTIMATE)** | **~20B central; 8–50B 80% range (SPECULATION)** | Its black-box knowledge score is close to the GPT‑5 Mini band in the same 2026 study. OpenAI's **117B-total, 5.1B-active gpt‑oss‑120b (DISCLOSED)** also shows that o4‑mini-level reasoning performance does not require tens of billions of active weights in every implementation. |

Sources: [OpenAI GPT‑5.6 launch](https://openai.com/index/gpt-5-6/), [Sol preview](https://openai.com/index/previewing-gpt-5-6-sol/), [Zephyr post as preserved by Digg](https://digg.com/tech/u7vja9ni), [Epoch's GPT‑5 compute estimate](https://epochai.substack.com/p/notes-on-gpt-5-training-compute), [Epoch's broader fleet/active-parameter model](https://epoch.ai/gradient-updates/how-many-digital-workers-could-openai-deploy), [Incompressible Knowledge Probes paper](https://arxiv.org/abs/2604.24827), and [OpenAI's gpt‑oss disclosure](https://openai.com/index/introducing-gpt-oss/).

### Assessment of Zephyr's "~100B active" claim

**Verdict: directionally corroborated, not confirmed.**

The strongest corroboration is Epoch's pre‑5.6 inference-economics estimate that GPT‑5 was probably around **100B active parameters (COMMUNITY ESTIMATE)**, based on price, speed, and industry architecture trends. Epoch's wider analysis allowed **50–300B active parameters (COMMUNITY ESTIMATE)**. That makes Zephyr's number a defensible central prior rather than an isolated rumor.

OpenAI's own open-weight models establish that the company is comfortable with aggressive MoE sparsity: gpt‑oss‑120b has **117B total and 5.1B active parameters (DISCLOSED)**, a roughly **23:1 total-to-active ratio (SPECULATION; arithmetic from DISCLOSED figures)**. That does not prove GPT‑5.6 uses the same topology, but it makes a multi-trillion-total, roughly 100B-active Sol technically plausible. [OpenAI](https://openai.com/index/introducing-gpt-oss/)

The important counterweight is the new knowledge-capacity work. It estimates GPT‑5.5's effective total capacity at **3.2–28.7T (COMMUNITY ESTIMATE)**. Even if that method overstates literal weights because OpenAI has denser data or more efficient factual storage, it argues against treating "100B active" as "approximately a 100B model." A plausible reconciliation is a **very sparse, multi-trillion-total model with roughly 100B active weights (SPECULATION)**. [arXiv](https://arxiv.org/html/2604.24827v1)

### Serving precision

The exact serving precision is **not disclosed**. My operational assumption is:

- On **H100/H200**, FP8-heavy weight and matrix-multiplication paths with BF16/FP16 in attention, accumulation, or sensitive kernels **(COMMUNITY ESTIMATE)**.

- On **B200/GB200**, FP4/NVFP4 or MXFP4 weight paths with higher-precision accumulation and FP8-or-higher KV-cache components **(COMMUNITY ESTIMATE)**.

- I would **not** model the entire serving graph as FP4. Attention, routing, normalization, KV cache, and some expert layers can retain higher precision **(SPECULATION)**.

The evidence is indirect but strong: OpenAI disclosed native **MXFP4 (DISCLOSED)** for gpt‑oss; NVIDIA's published Blackwell DeepSeek implementation uses **NVFP4 weights and FP8 KV cache (DISCLOSED by NVIDIA)**; and a DeepSeek production H800 system uses **FP8 matrix multiplications with BF16 attention (DISCLOSED by DeepSeek)**. [OpenAI](https://openai.com/index/introducing-gpt-oss/)

Measured single-stream rates also matter, but they do not reveal parameter count directly. Artificial Analysis measured approximately **78 output tokens/s for Sol at maximum reasoning, 153 tokens/s for Terra at medium reasoning, and 205–229 tokens/s for Luna depending on mode (CREDIBLY REPORTED)**. OpenAI separately advertises **up to 750 tokens/s for Sol on Cerebras (DISCLOSED)**. Those are endpoint or user-stream speeds, not total batched hardware throughput. [Artificial Analysis](https://artificialanalysis.ai/models/gpt-5-6-sol/providers)

# 2. FLEET & PROCUREMENT

### What appears to serve inference in July 2026

OpenAI says it has **3 GW of dedicated inference capacity (DISCLOSED)** and that Hopper- and Blackwell-generation NVIDIA systems are already operating across **Microsoft, Oracle Cloud Infrastructure, and CoreWeave (DISCLOSED)**. That makes NVIDIA H100/H200 and B200/GB200 the defensible central fleet assumption. [OpenAI](https://openai.com/index/scaling-ai-for-everyone/)

OpenAI's Abilene Stargate site is operating through OCI and uses **NVIDIA GB200 systems (DISCLOSED)**. More broadly, OpenAI said by April 2026 that it had secured more than **10 GW of capacity (DISCLOSED)**, while still describing its infrastructure strategy as **partner-centric (DISCLOSED)**. "Secured" includes contracted and planned capacity; it does not mean all 10 GW was commissioned by July 9. [OpenAI](https://openai.com/index/building-the-compute-infrastructure-for-the-intelligence-age/)

Cerebras is now a real, though probably selective, inference supplier. Reuters reported a **$20B multi-year agreement and 750 MW deployment (CREDIBLY REPORTED)** and that GPT‑5.4 was already running on Cerebras. OpenAI's Sol material advertises a Cerebras path at **up to 750 tokens/s (DISCLOSED)**. I exclude Cerebras from the central NVIDIA-equivalent cost calculation because no defensible wafer-scale-system-hour transfer price is public. [Reuters](https://www.reuters.com/business/cerebras-sinks-14-full-year-margin-forecast-disappoints-2026-06-24/)

Other announced capacity is more important for the forward curve than for the July 9 marginal-cost estimate:

- AWS/OpenAI announced an additional **$100B over eight years and roughly 2 GW of Trainium capacity (DISCLOSED)**, spanning Trainium3 and later Trainium4. [OpenAI](https://openai.com/index/amazon-partnership/)

- OpenAI and Broadcom said Jalapeño engineering samples had reached target frequency and power and that gigawatt deployment would begin in **2026 (DISCLOSED)**. Public evidence does not show material production share by the cutoff. [OpenAI](https://openai.com/index/openai-broadcom-jalapeno-inference-chip/)

- AMD MI450 and NVIDIA Vera Rubin capacity is principally an **H2 2026 or later ramp (DISCLOSED)** and should not be treated as the July fleet's median chip. [OpenAI](https://openai.com/index/openai-amd-strategic-partnership/)

### Owned versus rented

The best characterization is **dedicated and contractually controlled, but predominantly partner-owned and partner-operated (SPECULATION)**.

OpenAI's public descriptions emphasize partner financing, cloud operation, leases, and long-term capacity commitments. Abilene operates through OCI; the Oracle arrangement has Oracle purchasing or financing systems and providing the compute to OpenAI; and OpenAI explicitly describes the broader buildout as partner-centric. I found no public evidence that OpenAI owns a material fraction of the production accelerators outright.

There has nevertheless been a meaningful economic shift in **2026**:

- Microsoft remains OpenAI's primary cloud, but OpenAI can now serve its products from any cloud when appropriate **(DISCLOSED)**.

- Microsoft's previous right of first refusal was removed, while OpenAI made an incremental **$250B Azure commitment (DISCLOSED)**.

- Microsoft's OpenAI revenue share continues through **2030 (DISCLOSED)**, at an undisclosed percentage and subject to an undisclosed cap. [Microsoft blog](https://blogs.microsoft.com/blog/2026/04/27/the-next-phase-of-the-microsoft-openai-partnership/)

Thus Stargate is moving OpenAI from ordinary cloud tenancy toward **quasi-owned economics**: dedicated sites, longer offtakes, more direct control over design and scheduling, and a lower scarcity premium. It is not yet a conventional owned-fleet model. The trade-off is that long-term take-or-pay commitments turn utilization into a major determinant of fully allocated cost.

### Estimated procurement basis

All figures below are normalized to a **single NVIDIA GPU-hour**, not a GB200 superchip-hour or rack-hour.

| Price reference | $/GPU-hour |
| --- | --- |
| Lambda H100 on-demand | **$3.99 (DISCLOSED)** |
| Lambda B200 on-demand | **$6.69 (DISCLOSED)** |
| One-year H100 rental market, March 2026 | **$2.35 (CREDIBLY REPORTED)** |
| OpenAI strategic Hopper basis | **$2.0–$3.2 (SPECULATION)** |
| OpenAI strategic Blackwell basis | **$2.5–$4.2 (SPECULATION)** |
| **Fleet-weighted OpenAI central assumption** | **$3.25; subjective 80% range $2.2–$4.8 (SPECULATION)** |

Sources: [Lambda GPU pricing](https://lambda.ai/instances) and [SemiAnalysis's GPU rental index](https://newsletter.semianalysis.com/p/the-great-gpu-shortage-rental-capacity).

The Oracle Stargate contract provides a useful cross-check. OpenAI disclosed more than **$300B over five years for up to 4.5 GW (DISCLOSED)**. At constant full nameplate usage that is approximately **$1,522 per MW-hour (SPECULATION; arithmetic)**. At an assumed **1.2–1.5 kW of all-in site load per Blackwell GPU (SPECULATION)**, that corresponds to approximately **$1.83–$2.28 per GPU-hour (SPECULATION)** before allowing for ramp periods, CPUs, storage, network fabric, redundancy, operations, and the fact that "up to 4.5 GW" may not be delivered for all five years. An all-in **$2.0–$3.5/GPU-hour (SPECULATION)** interpretation is therefore plausible, but it is not a quoted Oracle or OpenAI price. [OpenAI](https://openai.com/index/five-new-stargate-sites/)

The **$250B Azure commitment (DISCLOSED)** does not provide enough information to derive an Azure chip-hour rate: there is no disclosed power envelope, ramp schedule, hardware mix, service bundle, or minimum utilization. My **$3.25/GPU-hour central estimate (SPECULATION)** therefore comes from term-market comparables, the Oracle offtake arithmetic, and OpenAI's enormous purchasing volume—not from a leaked Microsoft transfer price.

### Utilization and aggregate throughput

Actual OpenAI fleet utilization is not disclosed. Three external anchors are useful:

1. Epoch estimated OpenAI's total stock at **1.1M H100-equivalents, with a 0.8–1.4M 90% interval (COMMUNITY ESTIMATE)**, and estimated that **44% (COMMUNITY ESTIMATE)** was assigned to inference. It assumed only **5–30% realized FLOP utilization (COMMUNITY ESTIMATE)**, which is different from the share of provisioned servers that are occupied. [Epoch AI](https://epoch.ai/gradient-updates/how-many-digital-workers-could-openai-deploy)

2. DeepSeek's published production H800 system delivered **14,800 output tokens/s per eight-GPU node, or about 1,850 tokens/s/GPU (DISCLOSED)**, and its reported active-node occupancy averaged approximately **82% (SPECULATION; arithmetic from DISCLOSED node counts)**. [GitHub](https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md)

3. NVIDIA's MLPerf-class results for a **37B-active MoE (DISCLOSED)** span approximately **556–1,253 output tokens/s per H200** and **2,327–4,024 per GB200**, depending on server-latency versus offline-throughput mode **(DISCLOSED by NVIDIA)**. [NVIDIA Developer](https://developer.nvidia.com/blog/nvidia-blackwell-ultra-sets-new-inference-records-in-mlperf-debut/)

For Sol, I use:

- **1,225 aggregate output tokens/s per NVIDIA GPU-equivalent central; 600–2,500 80% range (SPECULATION)**.

- **5,800 uncached-prefill tokens/s/GPU-equivalent central; 2,000–15,000 80% range (SPECULATION)**.

- **73% provisioned occupancy central; 58–85% 80% range (SPECULATION)**.

These rates are deliberately far above Sol's **78-token/s single-stream rate (CREDIBLY REPORTED)**. A production server concurrently decodes many sequences; single-user streaming speed is governed by service-level latency, reasoning behavior, and throttling rather than total rack throughput.

# 3. PRICING & REALIZATION

### GPT‑5.6 API list prices

All figures in the next two tables are **DISCLOSED**, in **US dollars per 1M tokens**, from [OpenAI's API pricing page](https://developers.openai.com/api/docs/pricing).

`I` = fresh input, `CR` = cached read, `CW` = cache write, `O` = output.

| Model | Standard short-context: I / CR / CW / O | Standard long-context: I / CR / CW / O |
| --- | --- | --- |
| **GPT‑5.6 Sol** | **$5 / $0.50 / $6.25 / $30** | **$10 / $1 / $12.50 / $45** |
| **GPT‑5.6 Terra** | **$2.50 / $0.25 / $3.125 / $15** | **$5 / $0.50 / $6.25 / $22.50** |
| **GPT‑5.6 Luna** | **$1 / $0.10 / $1.25 / $6** | **$2 / $0.20 / $2.50 / $9** |

| Model | Batch/Flex short: I / CR / CW / O | Batch/Flex long: I / CR / CW / O | Priority short: I / CR / CW / O |
| --- | --- | --- | --- |
| **Sol** | **$2.50 / $0.25 / $3.125 / $15** | **$5 / $0.50 / $6.25 / $22.50** | **$10 / $1 / $12.50 / $60** |
| **Terra** | **$1.25 / $0.125 / $1.5625 / $7.50** | **$2.50 / $0.25 / $3.125 / $11.25** | **$5 / $0.50 / $6.25 / $30** |
| **Luna** | **$0.50 / $0.05 / $0.625 / $3** | **$1 / $0.10 / $1.25 / $4.50** | **$2 / $0.20 / $2.50 / $12** |

Important realization rules:

- Batch and Flex are exactly **50% below Standard (DISCLOSED)**.

- Cache reads receive a **90% discount to fresh input (DISCLOSED)**; cache writes cost **1.25× fresh input (DISCLOSED)**.

- Once input exceeds **272K tokens (DISCLOSED)**, OpenAI reprices the **entire request**, not merely the excess, at the long-context tariff.

- Regional processing adds **10% (DISCLOSED)**.

- Hidden reasoning tokens are billed as output and consume context. OpenAI says they can range from **hundreds to tens of thousands per request (DISCLOSED)**.

- Sol's `ultra` mode can invoke subagents and multiple internal model runs. It should be modeled as an agentic workload, not as a single pass through Sol. [OpenAI Developers](https://developers.openai.com/api/docs/models/gpt-5.6-terra)

### Remaining o-series API prices

| Model | Current standard API price |
| --- | --- |
| **o3** | **$2 fresh input / $0.50 cached input / $8 output per 1M (DISCLOSED)** |
| **o3 Batch** | **$1 / $0.25 / $4 per 1M (DISCLOSED)** |
| **o3‑pro** | **$20 input / $80 output per 1M (DISCLOSED)** |
| **o4‑mini** | **$1.10 input / $0.275 cached input / $4.40 output per 1M (DISCLOSED)** |

o3‑pro's much higher tariff is primarily a charge for longer inference-time reasoning, not evidence of a proportionally larger base model. OpenAI calls it a version of o3 designed to think longer **(DISCLOSED)**. [OpenAI](https://openai.com/index/introducing-o3-and-o4-mini/)

### Subscription plans

| Plan | Price and allowance |
| --- | --- |
| **ChatGPT Plus** | **$20/month (DISCLOSED)**; API usage is separate and limits vary. |
| **ChatGPT Pro 5×** | **$100/month (DISCLOSED)**; approximately **5× Plus allowance (DISCLOSED)**. |
| **ChatGPT Pro 20×** | **$200/month (DISCLOSED)**; approximately **20× Plus allowance (DISCLOSED)**. |
| **ChatGPT Business** | **$25/user/month monthly or $20/user/month annual, minimum two users (DISCLOSED)**; flexible credits can supplement included use. |

Sources: [ChatGPT Plus help page](https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus), [Pro tiers](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers), and [Business pricing](https://help.openai.com/en/articles/8792828-what-is-chatgpt-business).

Sam Altman wrote in January 2025 that OpenAI was "currently losing money on OpenAI Pro subscriptions" because people used it more than expected **(DISCLOSED executive statement)**. That referred to the earlier Pro product, but the economic lesson remains relevant: fixed-price access exposes OpenAI to a heavy right tail of reasoning and agent usage. [X post](https://x.com/sama/status/1876104315296968813)

OpenAI has since made at least some of this leakage measurable and monetizable. Codex moved to token-linked credits in April 2026. OpenAI's rate card charges Sol **125 input, 12.5 cached-input, and 750 output credits per 1M tokens (DISCLOSED)**. Student-credit terms establish **2,500 credits = $100, or $0.04/credit (DISCLOSED)**, so those rates map exactly to Sol's **$5/$0.50/$30 API tariff (SPECULATION; arithmetic from DISCLOSED values)**. OpenAI says average Codex usage is approximately **$100–$200 per developer per month, with wide variance (DISCLOSED)**. [Codex rate card](https://help.openai.com/en/articles/20001106-codex-rate-card)

There is public evidence of the heavy tail, but not a representative distribution. Examples include a GitHub user reporting exhaustion of a **$200 Pro allowance within hours (COMMUNITY ESTIMATE; anecdotal and possibly a metering bug)** and another reporting nearly exhausting a weekly allowance in approximately **two days (COMMUNITY ESTIMATE; anecdotal)**. Local tools such as CodexBar can inspect individual usage, but I found no public aggregate comparable in rigor or sample size to the Claude Max `ccusage` investigations. These anecdotes establish the possibility of severe over-usage; they do not establish the mean subscriber margin. [GitHub](https://github.com/openai/codex/issues/27142)

### Realized revenue versus list revenue

For a representative **7 cached-input : 2 fresh-input : 1 output token mix (CREDIBLY REPORTED benchmark convention)**, Sol Standard realizes (7×0.50 + 2×5 + 1×30)/10 = **$4.35 per 1M aggregate tokens** — matching Artificial Analysis's blended-price convention. Batch or Flex reduces that to **$2.175/M (SPECULATION)** for the same token mix. [Artificial Analysis](https://artificialanalysis.ai/models/gpt-5-6-sol/providers)

Actual realization can be lower because of Batch/Flex traffic, enterprise discounts, subscription bundles, prepaid credits, and Microsoft's undisclosed revenue share. Conversely, output-heavy reasoning traffic realizes more dollars per aggregate token because output is priced at **6× fresh input and 60× a cache read for Sol Standard (SPECULATION; arithmetic from DISCLOSED prices)**.

# 4. COST/MARGIN EVIDENCE

There is no official OpenAI disclosure of "cost per million GPT‑5.6 Sol tokens," accelerator utilization, or API-model gross margin. The following are the closest external anchors.

| Evidence | Metric | Relevance to marginal serving economics |
| --- | --- | --- |
| The Information, December 2025 | **70% compute margin for paying users in October 2025 (CREDIBLY REPORTED)** | Best reported external anchor. It reportedly measures revenue remaining after the cost of running models for paying users, but blends API, subscriptions, models, tools, discounts, occupancy, and likely infrastructure allocations. |
| The Information, February 2026 | **33% adjusted gross margin for 2025, down from 40% in 2024 and below a 46% forecast (CREDIBLY REPORTED)** | Company-level gross margin, not marginal token margin. It includes free-user burden and broader cost-of-revenue effects. |
| Reuters, February 2026 | Inference costs **quadrupled during 2025 (CREDIBLY REPORTED)**; expected compute spending through 2030 around **$600B (CREDIBLY REPORTED)** | Confirms that rapid usage and capacity growth overwhelmed some efficiency gains, but does not yield a per-token cost. |
| The Information reporting summarized in June 2026 | A software optimization reportedly cut inference cost by **more than 50% (CREDIBLY REPORTED)** for some existing workloads and reduced the logged-out ChatGPT segment to roughly **200 GPUs at one point (CREDIBLY REPORTED)** | Important upside evidence, but the technique and workload are undisclosed. It may involve a small routed model, better batching, speculative decoding, or scheduling and may not generalize to Sol. |
| Leaked financial statements published by Where's Your Ed At | **$13.07B 2025 revenue and $7.5B cost of revenue (CREDIBLY REPORTED leaked documents)**, implying **42.6% accounting gross margin (SPECULATION; arithmetic)** | A useful cross-check, but it conflicts with the reported **33% adjusted margin** because the documents and reporting may use different definitions, adjustments, or periods. It is not model-specific. |

Sources: [The Information on paid-user compute margin](https://www.theinformation.com/articles/openai-getting-efficient-running-ai-internal-financials-show), [The Information on missed gross-margin forecasts](https://www.theinformation.com/newsletters/dealmaker/openai-anthropic-missed-gross-margin-forecasts), [Reuters on compute spending and 2025 margins](https://www.reuters.com/technology/openai-sees-compute-spend-around-600-billion-by-2030-cnbc-reports-2026-02-20/), [June 2026 cost-optimization summary](https://aiweekly.co/alerts/openai-engineers-say-theyve-more-than-halved-inference-costs), and [published leaked financials](https://www.wheresyoured.at/exclusive-openai-financials/).

The apparent contradiction between a **70% paid-user compute margin (CREDIBLY REPORTED)** and a **33% company adjusted gross margin (CREDIBLY REPORTED)** is economically plausible:

- The former excludes non-paying users but still blends subscriptions and API traffic.

- Company gross margin can include free-tier inference, image/video/voice tools, search, safety passes, customer-support infrastructure, idle reserved capacity, hosting, revenue sharing, and accounting allocations.

- A list-price API request has no subscription heavy tail and can be scheduled more efficiently than an interactive free or fixed-price request.

- Training and frontier R&D are generally below gross profit or otherwise treated separately; they should not be inserted into marginal token cost.

The **70% reported compute margin** is therefore the strongest empirical reason not to confuse OpenAI's list-price marginal margin with its realized, blended economics. My estimate below is deliberately higher because it prices the opportunity cost of accelerator time for a well-batched marginal request, rather than allocating the full corporate serving estate.

# 5. VERDICT

## Central estimate

For **GPT‑5.6 Sol, Standard short-context list price**, using a representative **7 cached : 2 fresh : 1 output** mix:

> **Marginal serving gross margin: 94% central (SPECULATION)**
>
> **Subjective 80%-confidence interval: 86–97% (SPECULATION)**

This is an **economic marginal cost** estimate: it assigns an opportunity cost to accelerator time and allocates some reserved-capacity slack. It is not the near-zero cash cost of adding a token to an already-paid, otherwise-idle server. It also is not OpenAI's accounting gross margin.

### Cost model

accelerator cost/token = ($/GPU-hour) / (3600 × aggregate tokens/s/GPU × occupied fraction) × serving overhead — then add non-GPU serving cost, with a lower compute ratio for cache hits.

| Input | Central | Subjective 80% range | Label |
| --- | --- | --- | --- |
| Sol active parameters | **105B** | **50–220B** | Central anchored to **COMMUNITY ESTIMATE**; range **SPECULATION** |
| Strategic all-in GPU-hour | **$3.25** | **$2.2–$4.8** | **SPECULATION** |
| Aggregate output throughput | **1,225 tokens/s/GPU-eq** | **600–2,500** | **SPECULATION**, benchmark-anchored |
| Uncached-prefill throughput | **5,800 tokens/s/GPU-eq** | **2,000–15,000** | **SPECULATION**, benchmark-anchored |
| Provisioned occupancy | **73%** | **58–85%** | **SPECULATION** |
| Replication/routing/platform overhead | **1.33×** | **1.10–1.60×** | **SPECULATION** |
| Cache-hit compute versus fresh prefill | **15%** | **8–30%** | **SPECULATION** |
| Non-GPU serving cost | **$0.081/M tokens** | **$0.03–$0.22/M** | **SPECULATION** |

Active parameters are used to inform the throughput range; I do not multiply by active parameters again, which would double-count model size.

### Result by token class

| Token class | Sol list revenue | Estimated marginal serving cost | Central margin |
| --- | --- | --- | --- |
| Fresh input | **$5/M (DISCLOSED)** | **$0.37/M; 80% range $0.17–$0.83 (SPECULATION)** | **92.6% (SPECULATION)** |
| Cached input read | **$0.50/M (DISCLOSED)** | **$0.073/M; 80% range $0.032–$0.178 (SPECULATION)** | **85.4% (SPECULATION)** |
| Output, including billed reasoning tokens | **$30/M (DISCLOSED)** | **$1.48/M; 80% range $0.68–$3.35 (SPECULATION)** | **95.1% (SPECULATION)** |
| **Blended 7:2:1 workload** | **$4.35/M aggregate tokens (SPECULATION)** | **$0.279/M; 80% range $0.134–$0.613 (SPECULATION)** | **93.6%; 80% range 85.9–96.9% (SPECULATION)** |

Rounded for the calculator, that is **94% central and 86–97% at 80% confidence (SPECULATION)**.

The cache-read leg has the lowest margin because OpenAI discounts cache reads by **90% (DISCLOSED)** while a cache hit still incurs lookup, KV movement, scheduling, memory, and some model-side work. Output has the highest central margin because OpenAI charges **$30/M (DISCLOSED)** against a modeled cost of approximately **$1.48/M (SPECULATION)**.

### Discount and procurement sensitivities

For the same token mix:

- **Batch/Flex:** revenue falls to **$2.175/M (SPECULATION)**, producing approximately **87% central margin and 72–94% 80% range (SPECULATION)**.

- **One-year H100 market basis of $2.35/GPU-hour (CREDIBLY REPORTED):** approximately **96% margin (SPECULATION)**, though H100 throughput is below Blackwell and the comparison is not perfectly like-for-like.

- **Public B200 rental basis of $6.69/GPU-hour (DISCLOSED):** approximately **89% margin (SPECULATION)**.

- If the reported **>50% inference-cost optimization (CREDIBLY REPORTED)** generalized fully to Sol, the same list-price workload could approach approximately **97% margin (SPECULATION)**. I do not put that in the central case because the reported deployment was the logged-out tier, not the frontier API.

### What the verdict excludes

The **94%** is before: Microsoft's undisclosed revenue share; enterprise and committed-spend discounts; free-tier inference; training, RL experiments, and research; tools such as search, code execution, images, video, and voice; unbilled retries, safety reruns, failed generations, and multi-agent subcalls beyond the modeled overhead; Sol `ultra`, where multiple agents make the single-pass token model inapplicable; long-context requests above **272K input tokens (DISCLOSED)**.

If Microsoft receives an effective fraction *s* of revenue, post-share contribution margin is approximately 1 − (serving cost / gross billings) − s. Because *s* is undisclosed, it is not legitimate to fold an assumed Microsoft percentage into the central serving-cost result.

### Why the 80% interval is wide, ranked by impact

1. **Actual aggregate throughput and active architecture.** Sol could be a relatively conventional **~100B-active MoE (COMMUNITY ESTIMATE)** or a model whose routing, communication, speculative decoding, and multi-token prediction make "active parameters" a poor proxy. The assumed **600–2,500 output tokens/s/GPU-eq range (SPECULATION)** is a greater than **4× cost span (SPECULATION)**.

2. **Reserved-capacity occupancy.** OpenAI has multi-year, multi-GW commitments. At high load these resemble cheap owned capacity; during slack periods, take-or-pay servers can make allocated cost per token several times the engineering marginal cost **(SPECULATION)**. This is the main bridge between a modeled **94% list-price margin** and the reported **70% paid-user compute margin**.

3. **OpenAI's true transfer price.** The **$2.2–$4.8/GPU-hour range (SPECULATION)** is constrained by public rental prices and offtake arithmetic, but Azure's actual price, service bundling, financing, and Microsoft revenue-share arrangement remain unknown.

4. **Token and reasoning mix.** Cache-heavy traffic realizes much less revenue per token; output-heavy reasoning realizes much more. Long-context attention and KV costs are nonlinear, while OpenAI reprices the entire request above **272K input tokens (DISCLOSED)**.

5. **Serving-stack overhead.** Redundancy, expert imbalance, model routing, speculative draft models, safety passes, KV-cache misses, memory fragmentation, and failed calls can add meaningful cost. The modeled **1.10–1.60× overhead range (SPECULATION)** is not based on OpenAI telemetry.

6. **Revenue realization rather than physical serving cost.** Batch/Flex pricing, enterprise discounts, subscription leakage, prepaid credits, and Microsoft's revenue share can lower realized margin substantially without changing FLOPs per token.

# 6. KNOWN KNOWNS

- OpenAI's current GPT‑5.6 lineup is **Sol, Terra, and Luna (DISCLOSED)**, priced at **$5/$30, $2.50/$15, and $1/$6 per 1M fresh-input/output tokens respectively for short-context Standard traffic (DISCLOSED)**. [Pricing](https://developers.openai.com/api/docs/pricing)

- OpenAI reports **3 GW of dedicated inference capacity (DISCLOSED)**, with Hopper and Blackwell systems already operating across Microsoft, OCI, and CoreWeave. [Source](https://openai.com/index/scaling-ai-for-everyone/)

- Stargate remains **partner-centric (DISCLOSED)**; Abilene operates through OCI and uses **GB200 systems (DISCLOSED)**. "Dedicated" should not be read as "OpenAI-owned." [Source](https://openai.com/index/building-the-compute-infrastructure-for-the-intelligence-age/)

- Microsoft remains the primary cloud, but OpenAI can serve products from other clouds; Microsoft's revenue share continues through **2030 (DISCLOSED)** at an undisclosed rate. [Source](https://blogs.microsoft.com/blog/2026/04/27/the-next-phase-of-the-microsoft-openai-partnership/)

- Hidden reasoning tokens are billed as output, while requests above **272K input tokens (DISCLOSED)** are wholly repriced under the long-context tariff. [Reasoning guide](https://developers.openai.com/api/docs/guides/reasoning)

- The best reported external serving-economics anchor is a **70% paid-user compute margin in October 2025 (CREDIBLY REPORTED)**; OpenAI's broader **2025 adjusted gross margin was 33% and missed a 46% forecast (CREDIBLY REPORTED)**. [The Information](https://www.theinformation.com/articles/openai-getting-efficient-running-ai-internal-financials-show)

# 7. KNOWN UNKNOWNS

- **Literal total and active parameters.** No GPT‑5.6 parameter count or routing topology is disclosed. The **~100B-active central estimate** is independently plausible but remains a **COMMUNITY ESTIMATE**, while total-capacity methods permit a multi-trillion model.

- **Production numerical precision.** OpenAI has demonstrated MXFP4 in gpt‑oss, but it has not said which GPT‑5.6 layers run in FP4, FP8, BF16, or higher precision, nor whether precision changes by cloud or request type.

- **Azure and Stargate transfer pricing.** The **$250B Azure commitment (DISCLOSED)** and Oracle's multi-GW offtake reveal scale, not the per-chip-hour price, ramp penalties, network charges, or minimum-utilization terms.

- **Actual occupancy, batching, and aggregate tokens per accelerator.** OpenAI publishes user-visible speeds but not concurrent sequence counts, scheduler efficiency, expert imbalance, cache-hit rates, fleet utilization, or cost-weighted hardware mix.

- **How broadly the reported >50% optimization applies.** It could be a general serving breakthrough or a logged-out-tier-specific combination of routing, batching, and smaller models. The technique was not disclosed and is therefore excluded from the central estimate.

- **Realized revenue leakage.** Enterprise discounts, Microsoft's revenue share, subscription usage distributions, unbilled retries, and internal agent calls are undisclosed. These variables can reduce realized contribution margin much more than they change the physical cost of one well-batched API token.
