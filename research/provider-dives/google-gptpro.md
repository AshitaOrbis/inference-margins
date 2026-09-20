# Google (Gemini) — GPT-5.6 Pro deep dive

> Run 2026-07-09 · 45m03s · model `gpt-5-6-pro` (Pro-verified) · conversation archived privately
> Verdict: **Gemini 3.1 Pro marginal serving gross margin ≈ 95.7% central, 80% CI ≈ 89–98%** at standard ≤200K list price.
> Archived verbatim below (DOM-extracted; math notation may render with minor duplication artifacts).

---

## 1. MODELS: flagship + workhorse

**Research cutoff: July 9, 2026.** Labels mean:

- **DISCLOSED** — stated by Google or another directly involved party.

- **CREDIBLY REPORTED** — attributed reporting or specialist supply-chain/TCO analysis.

- **COMMUNITY ESTIMATE** — reproducible or at least inspectable outside inference, but not confirmed.

- **SPECULATION** — my modeling assumption or deduction; useful for sensitivity analysis, not a factual claim.

### Public-model status

As of the cutoff, the relevant flagship is **Gemini 3.1 Pro Preview**, not Gemini 3.5 Pro. Google said at I/O that Gemini 3.5 Pro was "coming next month," and a June investor presentation said it was expected during June, but Google's model catalog—updated **July 9, 2026**—still lists only Gemini 3.1 Pro under Pro and Gemini 3.5 Flash as stable. Therefore, **no public Gemini 3.5 Pro endpoint or price existed by the cutoff**. **DISCLOSED.** [Google model catalog](https://ai.google.dev/gemini-api/docs/models) · [I/O 2026 keynote](https://blog.google/innovation-and-ai/sundar-pichai-io-2026/) · [June investor presentation](https://blog.google/alphabet/investor-presentation-june-2026/)

| Claim | Gemini 3.1 Pro Preview — flagship | Gemini 3.5 Flash — workhorse |
| --- | --- | --- |
| Public architecture | **DISCLOSED:** Sparse mixture-of-experts transformer, natively multimodal; only a subset of parameters is activated per token. | **DISCLOSED:** Based on Gemini 3 Flash, which belongs to the same sparse-MoE Gemini 3 family. |
| Context/output limit | **DISCLOSED:** **1M-token** input context and **64K-token** output. | **DISCLOSED:** **1M-token** input context and **64K-token** output. |
| Total parameters | **Unknown.** Google has disclosed no count. **SPECULATION scenario bracket:** approximately **1–4T**, with **3T** as a calculator midpoint—not a measured estimate. | **Unknown.** **SPECULATION scenario bracket:** approximately **0.4–1.2T**, with **0.6T** as a calculator midpoint. |
| Active parameters/token | **Unknown. SPECULATION:** central **120B**; judgmental 80% range **60–240B**. | **Unknown. SPECULATION:** central **20B**; very rough range **10–50B**. |
| Production precision | **Unknown. SPECULATION:** FP8-equivalent weight/matmul economics on Ironwood, with higher precision for sensitive operations and accumulation. | **Unknown. SPECULATION:** FP8 or narrower quantized serving is plausible, particularly for a speed model, but no model-specific dtype is public. |

Architecture and context limits come from the [Gemini 3 family model card](https://deepmind.google/models/model-cards/gemini-3-pro/), the [Gemini 3.1 Pro card](https://deepmind.google/models/model-cards/gemini-3-1-pro/), and the [Gemini 3.5 Flash card](https://deepmind.google/models/model-cards/gemini-3-5-flash/).

### What can actually be inferred about parameter counts?

**The honest answer is that nobody outside Google appears to know.** There is no credible leak tying a total or active parameter count to either public endpoint, and black-box size estimators are particularly unreliable for sparse MoEs because memorization, expert count, routing density, distillation and training-token count all break the dense-model scaling assumptions.

The best structured evidence I found is:

- A 2026 memorization-based preprint assigns the preceding **Gemini 3 Flash Preview** a **405B-parameter lower bound**. **COMMUNITY ESTIMATE.** The authors explicitly say that their dense scaling law cannot provide precise point estimates for MoEs; it can only establish lower bounds relative to dense models. This is not a direct estimate of Gemini 3.5 Flash, and it says nothing reliable about active parameters. [Paper](https://arxiv.org/html/2605.29223v2)

- Public speed-based discussions have put Gemini 3 Flash around **250–300B total** and roughly **10–16B active**. **COMMUNITY ESTIMATE, very low confidence.** These calculations are underdetermined because observers do not know the chip count, batching, speculative-decoding acceptance rate, expert parallelism, hidden-token generation or whether internal pre-release hardware was used.

- One independent industry watcher has placed Gemini 3 Pro around **3T total parameters**. **COMMUNITY ESTIMATE, low confidence.** It is a reasonable scenario point but not evidence strong enough to call a measured estimate.

- Bloomberg reporting, carried by Reuters, described a **custom 1.2T-parameter Gemini model** for Apple's Siri. **CREDIBLY REPORTED.** This establishes that Google has at least built a Gemini-family system at that scale; it does **not** establish that public Gemini 3.1 Pro is the same model, the same architecture, or even served by Google. [Reuters](https://www.reuters.com/business/apple-use-googles-ai-model-run-new-siri-bloomberg-news-reports-2025-11-05/)

Consequently, the **1–4T total / 60–240B active** Pro bracket should be read as an economics scenario envelope. Total parameters principally determine weight memory, shard count and communications; **active parameters drive FLOPs per token and therefore dominate marginal cost**.

### Serving precision

Google says its serving stack uses quantization methods such as **AQT** and narrower numerical types, while Ironwood natively exposes **4.614 PFLOP/s of FP8 compute per chip**. Those facts support an FP8-equivalent cost model, but they do not reveal Gemini 3.1 Pro's actual weight, activation, KV-cache or accumulation formats. **DISCLOSED hardware capability; SPECULATION model mapping.** [Google serving-efficiency paper](https://arxiv.org/html/2508.15734v1) · [Ironwood documentation](https://docs.cloud.google.com/tpu/docs/tpu7x)

---

## 2. FLEET & PROCUREMENT

### Likely inference fleet

Google states that TPUs power Gemini training and serving across APIs and products including Search. **DISCLOSED.** [Google June 2026 investor presentation](https://blog.google/alphabet/investor-presentation-june-2026/)

The defensible fleet picture at the cutoff is:

| Accelerator | July 9 status and likely role | Relevant disclosed economics/capability |
| --- | --- | --- |
| **TPU v7 Ironwood** | **DISCLOSED:** Generally available; designed for dense and MoE training, sampling and decode-heavy inference. **SPECULATION:** principal marginal-cost reference for Gemini 3.1 Pro. | **DISCLOSED:** **4.614 PFLOP/s FP8**, **2.307 PFLOP/s BF16**, **192 GiB HBM**, **7.38 TB/s HBM bandwidth**, up to **9,216 chips/pod**. |
| **TPU v6e Trillium** | **DISCLOSED:** generally available. **SPECULATION:** still material in the installed fleet, especially for smaller, batchable and cost-sensitive inference. | **DISCLOSED public 3-year price:** **$1.22/chip-hour** in the cheapest listed US region. |
| **TPU v5e** | **DISCLOSED:** still offered. **SPECULATION:** legacy/high-volume inference and overflow workloads where capacity is already depreciated. | **DISCLOSED public 3-year price:** **$0.54/chip-hour** in several US regions. |
| **TPU 8i** | **DISCLOSED:** announced April 22, but still marked **"Coming soon"** on July 9. It should not be the central public-fleet assumption. Internal pre-GA use is possible but unknown. | **DISCLOSED:** intended for sampling/serving; Google claims up to **80% better inference performance per dollar than Ironwood**, especially for low-latency large MoEs. |

Sources: [Ironwood documentation](https://docs.cloud.google.com/tpu/docs/tpu7x), [Cloud TPU landing page](https://cloud.google.com/tpu), [TPU 8i technical deep dive](https://cloud.google.com/blog/products/compute/tpu-8t-and-tpu-8i-technical-deep-dive), and [Cloud TPU pricing](https://cloud.google.com/tpu/pricing).

The exact mapping of Gemini model/version, region and request class to TPU generation is **unknown**. Google can route short, latency-sensitive, cached, batch and long-context requests differently, so a single "Gemini chip" assumption is inevitably an average.

### Public price versus Google's internal economic cost

Google's public US-central1 Ironwood rates are:

| Ironwood purchasing mode | Price per chip-hour | Label |
| --- | --- | --- |
| On demand | **$12.00** | **DISCLOSED** |
| DWS Flex-start | **$6.00** | **DISCLOSED** |
| 1-year/calendar commitment | **$8.40** | **DISCLOSED** |
| 3-year commitment | **$5.40** | **DISCLOSED** |

[Google Cloud TPU pricing](https://cloud.google.com/tpu/pricing)

These are unsuitable as Google's own serving cost. They include sales margin, customer capacity optionality, demand risk, support and Cloud overhead.

SemiAnalysis estimates that:

- Google's all-in Ironwood TCO is approximately **44% below GB200**. **CREDIBLY REPORTED.**

- External GCP Ironwood TCO, including Google's margin, can still be approximately **30% below GB200** for a customer such as Anthropic. **CREDIBLY REPORTED.**

- Anthropic's negotiated Ironwood cost is approximately **$1.60 per TPU-hour**. **CREDIBLY REPORTED.**

[SemiAnalysis Ironwood TCO work](https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the)

A simple internal/external ratio from that analysis is (1−44%)/(1−30%) = 0.80. Applying it to the reported Anthropic rate gives **$1.60 × 0.80 = $1.28/Ironwood chip-hour**.

That **$1.28/hour** is **SPECULATION derived from CREDIBLY REPORTED inputs**, not a SemiAnalysis quote. I use a judgmental **80% range of $0.90–$1.60/hour**. The high end is deliberately close to Anthropic's margin-inclusive strategic rate; the low end allows for Google's lower procurement cost, fleet depreciation, power procurement and very large utilization base.

The implication is important: the central internal economic cost is approximately **24% of the public 3-year rate** and approximately **11% of on-demand list price**. **SPECULATION, arithmetic from the figures above.**

### Utilization evidence

Google's most useful production disclosure is not an MFU number but a full-stack energy decomposition for the median Gemini Apps text prompt in May 2025:

- **DISCLOSED:** active accelerator energy **0.14 Wh**, or **58%** of total.

- **DISCLOSED:** host CPU and DRAM **0.06 Wh**, or **25%**.

- **DISCLOSED:** provisioned idle capacity **0.02 Wh**, or **10%**.

- **DISCLOSED:** datacenter overhead **0.02 Wh**, or **8%**.

- **DISCLOSED:** total **0.24 Wh/prompt**.

The percentages differ slightly from 100% because of rounding. Google says that moving from accelerator-only to full-stack energy requires a factor of approximately **1.72×** for this measured workload. [Google production-serving paper](https://arxiv.org/html/2508.15734v1)

That does **not** mean one should multiply SemiAnalysis's all-in chip TCO by 1.72: its TCO already includes much of the power and datacenter stack. It does show that a token calculator based solely on active tensor-core time will miss host service, idle reservation and request-control overhead.

Google also reports that over the year ending May 2025 it achieved:

- **DISCLOSED:** **33×** lower energy per median Gemini prompt.

- **DISCLOSED:** **23×** from model/software improvements.

- **DISCLOSED:** **1.4×** from improved machine utilization.

[Google production-serving paper](https://arxiv.org/html/2508.15734v1)

SemiAnalysis discusses approximately **40% MFU** for Anthropic's TPU workloads, but that passage concerns training economics. I do **not** transplant it into low-latency autoregressive inference. For the margin model below, I use **8% effective FP8 decode MFU**, with a judgmental **4–15% 80% interval**. **SPECULATION.** This folds memory stalls, expert routing, inter-chip collectives, batching and latency constraints into one effective-throughput variable.

---

## 3. PRICING & REALIZATION

All prices below are **DISCLOSED**, in US dollars per **1M tokens**, from Google's July 9 pricing page. "Output" includes billed thinking tokens. Cache figures are cache-read prices; storage is separately billed per million cached tokens per hour. [Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing)

### Gemini 3.1 Pro Preview

| Service class | Context tier | Input | Output incl. thinking | Cache read | Cache storage |
| --- | --- | --- | --- | --- | --- |
| Standard | Prompt ≤200K | **$2.00** | **$12.00** | **$0.20** | **$4.50/hour** |
| Standard | Prompt >200K | **$4.00** | **$18.00** | **$0.40** | **$4.50/hour** |
| Batch | ≤200K | **$1.00** | **$6.00** | **$0.20** | **$4.50/hour** |
| Batch | >200K | **$2.00** | **$9.00** | **$0.40** | **$4.50/hour** |
| Flex | ≤200K | **$1.00** | **$6.00** | **$0.20** | **$4.50/hour** |
| Flex | >200K | **$2.00** | **$9.00** | **$0.40** | **$4.50/hour** |
| Priority | ≤200K | **$3.60** | **$21.60** | **$0.36** | **$8.10/hour** |
| Priority | >200K | **$7.20** | **$32.40** | **$0.72** | **$8.10/hour** |

There is **no free API tier for Gemini 3.1 Pro**. **DISCLOSED.**

### Gemini 3.5 Flash

| Service class | Input | Output incl. thinking | Cache read | Cache storage |
| --- | --- | --- | --- | --- |
| Standard paid | **$1.50** | **$9.00** | **$0.15** | **$1.00/hour** |
| Batch | **$0.75** | **$4.50** | **$0.075** | **$1.00/hour** |
| Flex | **$0.75** | **$4.50** | **$0.08** | **$1.00/hour** |
| Priority | **$2.70** | **$16.20** | **$0.27** | **$1.00/hour** |
| Standard free tier | **$0** within rate limits | **$0** within rate limits | **$0** | subject to free-tier terms |

Google advertises Batch as a **50% price reduction**, and enterprise contracts can include provisioned throughput and usage-based volume discounts, but Google does not disclose the discount schedules. **DISCLOSED.** [Gemini pricing overview](https://ai.google.dev/gemini-api/docs/pricing)

### List-price realization

The API price is only one monetization channel:

1. **Paid API.** Explicit token revenue, but realized price is reduced by Batch/Flex usage and undisclosed enterprise discounts.

2. **Search and AI Overviews.** End users are not charged per token; economics are ad-supported and must be evaluated as incremental query engagement, coverage and ad yield versus incremental serving cost.

3. **Gemini app.** Google said in Q1 2026 that monetization was still centered on free access and subscriptions, rather than ads in the app. **DISCLOSED.** [Alphabet Q1 2026 call](https://abc.xyz/investor/events/event-details/2026/2026-Q1-Earnings-Call-2026-nW8kCrBAKS/)

4. **Workspace.** Gemini functionality is bundled into Business and Enterprise plans, so realized revenue per token depends on seat price, adoption and incremental retention rather than an API meter. **DISCLOSED bundling; realized-token economics unknown.** [Google Workspace announcement](https://workspace.google.com/blog/product-announcements/empowering-businesses-with-AI)

5. **Free API/AI Studio.** Direct serving revenue is zero; the economic rationale is developer acquisition, feedback and conversion to paid production usage.

The scale of this non-list-price surface is enormous:

- **DISCLOSED:** approximately **3.2 quadrillion tokens/month** across Google's surfaces by June 2026.

- **DISCLOSED:** approximately **19B API tokens/minute**.

- **DISCLOSED:** AI Overviews had more than **2.5B monthly users**.

- **DISCLOSED:** AI Mode had more than **1B monthly users**.

- **DISCLOSED:** the Gemini app had more than **900M monthly users**.

[Alphabet June 2026 investor presentation](https://blog.google/alphabet/investor-presentation-june-2026/)

An illustrative Barclays analysis estimated Alphabet's Q1 2025 inference spending at approximately **$750M**, annualizing to roughly **1% of Search revenue**. **CREDIBLY REPORTED analyst estimate**, but it is old, Alphabet-wide, includes far more than Gemini API, and predates Google's subsequent serving-cost reductions. It should not be converted into Gemini cost/token. [Reported Barclays analysis](https://www.investing.com/news/stock-market-news/is-google-really-losing-share-to-chatgpt-barclays-answers-4099355)

**Treatment recommendation:** calculate paid-API list-price margin separately. Do not average free Search, app and Workspace tokens into that denominator. A second "all-surface realization" metric would require assumptions about ad lift, subscription allocation and free-to-paid conversion that Google does not disclose.

---

## 4. COST/MARGIN EVIDENCE

There is **no direct Google disclosure of Gemini API gross margin, Gemini 3.1 Pro cost per token, Google DeepMind inference margin, or the internal transfer price charged for TPU time**. The best evidence is indirect:

### Primary Google disclosures

- Google lowered **Gemini serving unit costs by 78% during 2025** through model optimization, efficiency and utilization improvements. **DISCLOSED.** This is the strongest direct statement about Gemini serving economics, but Google does not provide the starting cost, ending cost or workload-normalization methodology. [Alphabet Q4 2025 call](https://abc.xyz/investor/events/event-details/2026/2025-Q4-Earnings-Call-2026-Dr_C033hS6/default.aspx)

- After moving AI Overviews and AI Mode to Gemini 3, Google reduced the cost of "core AI responses" by **more than 30%**. **DISCLOSED.** Again, no absolute cost is given. [Alphabet Q1 2026 call](https://abc.xyz/investor/events/event-details/2026/2026-Q1-Earnings-Call-2026-nW8kCrBAKS/)

- Direct customer API traffic rose to more than **16B tokens/minute** in Q1 2026 and approximately **19B/minute** by the June investor presentation. **DISCLOSED.** That level of demand improves batching and amortization, although it does not reveal model mix or utilization.

- Google Cloud reported a **33% operating margin** in Q1 2026. **DISCLOSED, but not usable as Gemini inference margin.** It includes infrastructure rental, databases, security, Workspace and other products, while operating margin also includes R&D, sales and depreciation accounting.

### Third-party cost and margin evidence

SemiAnalysis's estimated **$1.60/hour Anthropic Ironwood rate** and its conclusion that Google can earn "superior EBIT margins" on large TPU leases are the most useful external checks on hardware economics. **CREDIBLY REPORTED.** But TPU leasing margin is not Gemini API margin: the API adds model IP, inference software, safety systems, host compute, storage, networking, support and demand-shaping, while also carrying much higher value-based prices. [SemiAnalysis](https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the)

The production energy paper shows that active accelerator power is only **58%** of measured full-stack prompt energy. **DISCLOSED.** It supports adding host/control/idle overhead to a chip-throughput calculation, but prompt energy cannot be translated into dollars without knowing prompt token counts, model routing and the fleet's capital cost. [Google serving paper](https://arxiv.org/html/2508.15734v1)

### Internal transfer pricing

I found no credible report of:

- an internal DeepMind-to-Cloud TPU charge;

- a Search/Gemini-app chargeback rate;

- whether internal consumers are charged average fleet cost, marginal power cost, public-equivalent opportunity cost or a capacity reservation rate;

- how fully depreciated v5e/Trillium capacity is valued internally.

For economic modeling, an all-in **resource cost** is preferable to an accounting transfer price anyway. A transfer price could be deliberately set above or below cost for organizational incentives and would not necessarily represent the marginal cost of serving another token.

---

## 5. VERDICT

### Base-case methodology

This is a **marginal serving gross-margin** model. It includes economic TPU TCO, occupancy and serving-stack overhead. It excludes model training, research, post-training, sales, corporate overhead, free-surface acquisition costs and unused capacity that is not attributable to the serving pool.

For comparability across providers, I use this representative request mix:

| Assumption | Base case | Judgmental 80% range | Label |
| --- | --- | --- | --- |
| Input:output token ratio | **15:1** | workload-dependent | **SPECULATION** |
| Share of input served from cache | **60%** | workload-dependent | **SPECULATION** |
| Gemini 3.1 Pro active parameters | **120B** | **60–240B** | **SPECULATION** |
| FLOPs per output token | **2.2× active parameters** | **2.0–2.6×** | **SPECULATION** |
| Ironwood FP8 peak | **4.614 PFLOP/s** | fixed hardware spec | **DISCLOSED** |
| Effective decode MFU | **8%** | **4–15%** | **SPECULATION** |
| Serving-pool occupancy | **75%** | **55–90%** | **SPECULATION** |
| Internal Ironwood economic cost | **$1.28/chip-hour** | **$0.90–$1.60** | **SPECULATION derived from CREDIBLY REPORTED evidence** |
| Host, control-plane, safety and retry uplift | **12%** | **0–30%** | **SPECULATION** |
| Uncached input cost/output-token cost | **28%** | approximately **18–45%** | **SPECULATION** |
| Cached input/uncached input cost | **10%** | approximately **4–20%** | **SPECULATION** |

The central effective throughput is (4.614×10¹⁵ × 8%) / (120×10⁹ × 2.2) = **1,398 aggregate output tokens/s/chip**. **SPECULATION derived from the disclosed Ironwood peak and modeled architecture/utilization.**

That gives:

| Central modeled result | Value | Label |
| --- | --- | --- |
| Output-token serving cost | **$0.380/M tokens** | **SPECULATION** |
| Uncached-input serving cost | **$0.106/M tokens** | **SPECULATION** |
| Cache-read serving cost | **$0.0106/M tokens** | **SPECULATION** |
| Blended serving cost at 15:1 and 60% cache hit | **$0.0696/M served tokens** | **SPECULATION** |
| Blended standard-list revenue, ≤200K tier | **$1.6125/M served tokens** | **SPECULATION calculation from DISCLOSED prices** |
| Marginal serving gross margin | **95.7%** | **SPECULATION** |

The blended revenue calculation is (6×$2 + 9×$0.20 + 1×$12)/16 = **$1.6125/M**.

The central verdict is therefore **1 − $0.0696/$1.6125 = 95.7% marginal serving gross margin**.

### 80%-confidence interval

**VERDICT — SPECULATION:** **approximately 89–98% marginal serving gross margin** at Gemini 3.1 Pro's standard list price for prompts at or below 200K tokens.

This corresponds to an approximate blended serving-cost interval of **$0.03–$0.18 per million served tokens** under the stated workload. The interval is judgmental rather than a frequentist confidence interval because the dominant inputs are architectural secrets, not noisy public measurements.

For context:

- **SPECULATION:** output-only central margin is approximately **96.8%** against the disclosed **$12/M** output price.

- **SPECULATION:** the same central cost against Batch pricing gives approximately **91.9%** blended margin, before crediting Batch for better scheduling and utilization.

- The >200K list tier produces higher nominal revenue, but I would **not** apply the same serving cost to it. Long contexts increase prefill work, KV-cache footprint, shard pressure and request duration; Google's price step is partly charging for those nonlinear costs.

### Why the interval is wide — ranked by impact

1. **Active parameter count.** Cost scales approximately linearly with active weights/FLOPs. Moving from **60B to 240B active** is a **4× cost swing** before any other change. **SPECULATION.**

2. **Effective production throughput at the target latency.** Decode MFU, continuous batching, expert balance, speculative-decoding acceptance and collectives can readily create another **roughly 3–4×** span. **SPECULATION.**

3. **Request mix and hidden work.** Context length, generated thinking tokens, retries, tool loops and output length determine whether the API meter tracks all internal computation. Long-context/agentic workloads can cost materially more than a simple token ratio suggests.

4. **Fleet occupancy and internal TCO.** Google's vertical integration substantially lowers cost, but reserved low-latency capacity and regional fragmentation can offset part of that advantage.

5. **Chip-generation and precision routing.** Serving on Trillium, Ironwood or internal TPU 8i capacity—and using FP8 versus narrower formats—changes both capital cost and attainable throughput.

6. **Non-accelerator serving overhead.** Host CPU/DRAM, safety filters, networking and idle reservation are visible in Google's energy telemetry, but their dollar allocation is not public.

The principal conclusion is robust to fairly pessimistic assumptions: **Google's vertical integration makes a sub-90% marginal margin at standard Gemini 3.1 Pro list price possible only if the model is much denser, production throughput much lower, or unbilled reasoning much larger than the central case.** Conversely, a **97–98%** result is plausible if active parameters are near the lower end and Google's production stack extracts strong batching and speculative-decoding gains.

---

## 6. KNOWN KNOWNS

- **DISCLOSED:** Gemini 3.1 Pro and Gemini 3.5 Flash belong to a sparse-MoE family that activates only a subset of parameters per token; both expose up to **1M input / 64K output**. [Gemini 3 family card](https://deepmind.google/models/model-cards/gemini-3-pro/)

- **DISCLOSED:** On **July 9, 2026**, Gemini 3.1 Pro was the public Pro preview and Gemini 3.5 Flash was stable; Gemini 3.5 Pro was absent despite earlier expectations of a June release. [Model catalog](https://ai.google.dev/gemini-api/docs/models)

- **DISCLOSED:** TPUs power Gemini serving; Ironwood provides **4.614 PFLOP/s FP8, 192 GiB HBM and 7.38 TB/s bandwidth per chip**. [Ironwood documentation](https://docs.cloud.google.com/tpu/docs/tpu7x)

- **DISCLOSED:** Gemini 3.1 Pro standard prices are **$2/M input, $12/M output and $0.20/M cache read** below the 200K threshold, with a higher >200K tier. [API pricing](https://ai.google.dev/gemini-api/docs/pricing)

- **DISCLOSED:** Google reduced Gemini serving unit costs by **78% during 2025** and subsequently reduced core Search AI-response cost by **more than 30%** after moving to Gemini 3. [Q4 2025 call](https://abc.xyz/investor/events/event-details/2026/2025-Q4-Earnings-Call-2026-Dr_C033hS6/default.aspx) · [Q1 2026 call](https://abc.xyz/investor/events/event-details/2026/2026-Q1-Earnings-Call-2026-nW8kCrBAKS/)

- **DISCLOSED:** Google serves Gemini at massive scale—approximately **3.2 quadrillion tokens/month across surfaces** and approximately **19B API tokens/minute** by June 2026—supporting unusually strong batching and infrastructure amortization. [June investor presentation](https://blog.google/alphabet/investor-presentation-june-2026/)

## 7. KNOWN UNKNOWNS

- **Total and active parameter counts.** This is the dominant uncertainty: total parameters determine memory and sharding, while active parameters approximately scale per-token computation.

- **Exact production precision.** Ironwood supports FP8 and Google uses quantization, but Gemini-specific weight, activation, accumulation and KV-cache formats are undisclosed.

- **Model-to-fleet routing.** The share served on Ironwood, Trillium, v5e or internal pre-GA TPU 8i capacity is unknown, as is the routing by latency class and context length.

- **Production throughput at latency.** Google publishes hardware peaks and optimization techniques, not Gemini 3.1 Pro tokens/chip-second, decode MFU, batch size or speculative-decoding acceptance.

- **Internal economic charge for TPU capacity.** There is no public DeepMind/Search/Cloud transfer rate, depreciation policy or model-specific occupancy figure.

- **Realized revenue per token.** Enterprise discounts, Batch/Flex mix, Search advertising, Workspace bundling, subscriptions and the immense free surface make Alphabet-wide realized $/token fundamentally unobservable from public data.
