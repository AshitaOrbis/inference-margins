# Claude Sonnet 5.5 — GPT-6 Astra Pro estimate (2026-09-28)

**Provenance.** one research run on 2026-09-28 by GPT-6 Astra Pro (ChatGPT, model `gpt-6-pro`), answered 2026-09-28T19:17:09Z. It was given this calculator's input contract, the Claude Opus 4.x reference estimate and the live connector's scenario space, and asked to set every input for Claude Sonnet 5.5 from public evidence. The answer is reproduced below verbatim except for four presentation changes: ChatGPT's interface citation markers are removed, as on every page of this annex; links into the research run's own sandbox (files no reader can open) keep their text and lose the dead target; equations are set as preformatted text, with a space between a bracket and a parenthesis inside them so the renderer does not read a product as a link; and where the answer repeats the run's own request identifier, an internal queue entry, it is withheld; its sources are cited by URL in the text (as-received answer SHA-256 `860787de1b3d0d7c6194761711d989d0dee62610c5ad9dc147822a953cc068f8`; published text SHA-256 `b151694ed76a11a1c16368a8dc68b3da5e3876b4fb0ae84f3a21e422cae2ce30`; original capture SHA-256 `a451932ba6e0c0da1bd993cb5e5266a84f0fee3a0c5e7aa58babfc5e16acaf85`).

## What the site shows

| reading | value |
|---|---|
| **Card headline** — this calculator on the run's central inputs, at list | **~84%** (83.87%) |
| Span — the run's own low- and high-margin scenarios, same engine | 62%–90% (62.43% – 89.86%) |
| The run's own stated reading | 83.9% (62.4–89.9%) |
| Same central inputs at the page's Reference traffic (15:1, 60% cache) — context, not the headline | ~81% |

The span is the author's judgment span: two scenarios it called plausible as a whole, not a probability interval and not a bound. The headline is a modeled unit direct-serving margin from public information; it is not a disclosure by the provider and not a company gross margin.

## Our reading

Claude Sonnet 5.5 launched on 2026-09-28, the day this run was made, at Sonnet 5's price: $2 per million input tokens, $10 per million output tokens and $0.20 for a cache read, verified on Anthropic's pricing page that day. Nothing about its architecture or serving is public, so the run starts from the Sonnet 5 estimate made on 2026-09-25 and says, input by input, what it carried and what it changed. Carried: the model size (100B active, 1T total — the input it names as deciding the number), FP8 and the `dsr1` attention geometry, the fleet (half the tokens on TPU v7 at $2.70 per chip-hour, the rest across H100, H200, GB200 and GB300) and the traffic (12 input tokens per output token, 75% from cache); at the page's Reference traffic the same inputs compute ~81%. Changed, both stated as judgments: utilization from 70% to 65%, a launch-period allowance for routing and batching that have not settled; and a 10% private-stack efficiency credit, motivated by — not calculated from — Anthropic's claim of more than 30% faster output. The two changes nearly cancel, which is why the central reading sits close to Sonnet 5's. What moved is the span. The low case is a heavier model (200B active, 1.6T total) at 60% utilization with TPU v7 at $3.50 per chip-hour, a harsher downside than the Sonnet 5 estimate used, so the low end sits well below Sonnet 5's; the high case is a lighter one (60B active) with a 20% efficiency credit. Anthropic's other launch claims — up to 30% lower cost per task through fewer tokens and tool calls, and its benchmark gains — are claims about the product, and the run deliberately does not turn them into cost inputs. Trainium stays out of the fleet for the reason given on the Sonnet 5 page: the calculator's Trainium throughput unit is ambiguous. The run could not reach the calculator's connector and worked the published equations by hand; the engine reproduces all three of its figures to the fourth decimal.

## The operating point

Carrier: the calculator's blank `custom` row on the `dsr1` attention geometry (a declared approximation — this model's architecture is not published). `batchShare` and `discount` are 0 in every run (list basis).

| input | central | low-margin scenario | high-margin scenario |
|---|---|---|---|
| `customDonor` | dsr1 | dsr1 | dsr1 |
| `active` | 100 | 200 | 60 |
| `total` | 1000 | 1600 | 1000 |
| `precision` | fp8 | fp8 | fp8 |
| `priceIn` | 2 | 2 | 2 |
| `priceOut` | 10 | 10 | 10 |
| `cacheReadMult` | 10 | 10 | 10 |
| `billCacheHit` | 75 | 75 | 75 |
| `cacheCost` | 5 | 5 | 5 |
| `cacheWriteShare` | 20 | 20 | 20 |
| `cacheWriteMult` | 125 | 125 | 125 |
| `batchShare` | 0 | 0 | 0 |
| `discount` | 0 | 0 | 0 |
| `blend` | `{"h100":5,"h200":15,"gb200":25,"gb300":5,"tpu7":50}` | `{"h100":5,"h200":15,"gb200":25,"gb300":5,"tpu7":50}` | `{"h100":5,"h200":15,"gb200":25,"gb300":5,"tpu7":50}` |
| `rentAbsLeg` | `{"h100":2.5,"h200":3.8,"gb200":5,"gb300":6.5,"tpu7":2.7}` | `{"h100":2.5,"h200":3.8,"gb200":5,"gb300":6.5,"tpu7":3.5}` | `{"h100":2.5,"h200":3.8,"gb200":5,"gb300":6.5,"tpu7":2.7}` |
| `util` | 65 | 60 | 70 |
| `stackMult` | 1.1 | 1 | 1.2 |
| `trendMonths` | 0 | 0 | 0 |
| `interact` | balanced | balanced | balanced |
| `hwMode` | rent | rent | rent |
| traffic | 12:1, 75% cache | 12:1, 75% cache | 12:1, 75% cache |

## The answer, verbatim

## 0 — THE CARD, IN TWO LINES.

≈84% at list (span 62–90%)  
The deciding assumption is 100B active parameters, giving modeled serving cost of about $0.225 per million mixed tokens.

## 1 — PUBLIC FACTS.

**GPT-6 Astra Pro — September 28, 2026.** Request `[request identifier withheld]`. This is a modeled **unit direct-serving contribution margin**, not Anthropic’s company gross margin or a verified provider margin. Publication dates and access dates are distinguished below. Source IDs carry through to the input block.

1. **DISCLOSED — Identity and release.** The priced model is **`claude-sonnet-5-5`, released September 28, 2026**. Anthropic’s versioning documentation treats this generation’s dateless IDs as pinned snapshots, not evergreen aliases. Sources: **S1**, https://www.anthropic.com/claude-sonnet-5-5, published **2026-09-28**; **S3**, https://platform.claude.com/docs/en/models/sonnet-5-5/overview, and **S5**, https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions, both accessed **2026-09-28**. 

2. **DISCLOSED — Settings and served variants.** The API defaults to adaptive thinking at **high effort**; the documented context limit is **1M tokens**. Other effort settings exist, and optional server-side fallback can send eligible declined requests to Sonnet 5. I price the ordinary Sonnet 5.5 path on the **standard global first-party API at high effort**, not a consumer subscription, fallback mixture, regional premium or separately priced fast service. Sources: **S3**, the overview above, and **S4**, https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5, accessed **2026-09-28**. 

3. **DISCLOSED — Verified list and cache tariff.** Prices per million tokens are **$2 fresh input, $2.50 five-minute cache write, $4 one-hour cache write, $0.20 cache read and $10 output**. Batch input/output prices are $1/$5, unused here. The pricing page states standard pricing through the full 1M context for Claude 4.6 and later. The project’s quoted tariff is correct; I found no separate introductory expiry for Sonnet 5.5. Source **S2**, https://platform.claude.com/docs/en/about-claude/pricing, accessed **2026-09-28**. 

4. **DISCLOSED — Launch performance claims, not serving-cost disclosures.** Anthropic claims **30%+ faster output** and **up to 30% lower customer cost per task**, through fewer tokens. It reports Terminal-Bench 4.0 scores of **70.6% versus Sonnet 5’s 10.3%**. These are product/evaluation claims, not measurements of dollars per accelerator-hour or aggregate tokens per accelerator-second. Source **S1**, https://www.anthropic.com/claude-sonnet-5-5, published **2026-09-28**. 

5. **DISCLOSED — Independent customer testing and tokenizer continuity.** GitHub’s own early tests report fewer steps, tokens and tool calls; Anthropic’s documentation says Sonnet 5.5 uses **the same tokenizer as Sonnet 5**. Consequently, no new tokenizer conversion is needed between those two generations. Sources: **S6**, https://github.blog/changelog/2026-09-28-claude-sonnet-5-5-in-github-copilot/, published **2026-09-28**; **S4**, the documentation above, accessed **2026-09-28**. GitHub is disclosing its testing, not Anthropic’s costs. 

6. **UNKNOWN — Sonnet-specific architecture.** I could not establish active or total parameter counts, expert routing, attention/KV geometry, deployed precision or effort-dependent activation. Sources checked: **S1/S3/S4**, at the URLs and dates above. **100B active / 1T total is an assumption carried from the predecessor estimate, not a newly discovered architecture.** 

7. **DISCLOSED — Open-model proxies only.** DeepSeek-V3 discloses **671B total / 37B active** and MLA; Qwen3-Coder discloses **480B total / 35B active**. They provide sparse-model scale context, not an estimate of Sonnet’s size. Sources: **S12**, https://arxiv.org/abs/2412.19437, initially published **2024-12-27**, revised **2025-02-18**; **S13**, https://qwenlm.github.io/blog/qwen3-coder/, published **2025-07-22**. 

8. **DISCLOSED — Hardware families, not model allocation.** Anthropic reported using over one million Trainium2 chips for training and serving Claude. Its Google announcement describes a strategy spanning **TPUs, Trainium and NVIDIA GPUs**. These company-wide statements do not locate Sonnet 5.5’s inference traffic, identify its accelerator generations or establish token shares. Sources: **S7**, https://www.anthropic.com/news/anthropic-amazon-compute, published **2026-04-20**, updated **2026-04-21**; **S8**, https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services, published **2025-10-23**. 

9. **DISCLOSED — Public hardware price anchors.** Google’s Iowa Ironwood prices are **$12 on demand, $8.40 one-year committed and $5.40 three-year committed per chip-hour**. CoreWeave lists eight-GPU H100/H200 nodes at **$49.24/$50.44 per node-hour**, and a four-GPU GB200 slice at **$42/hour**; GB300 requires a sales quote. These are public products, not Anthropic invoices. Sources: **S9**, https://cloud.google.com/tpu/pricing; **S11**, https://www.coreweave.com/pricing; accessed **2026-09-28**. 

10. **COMMUNITY ESTIMATE — Strategic TPU procurement.** SemiAnalysis estimates Anthropic’s rented TPU cost at **$1.60 per chip-hour**, including Google’s margin. I located the original analysis; this remains an analyst estimate, not a disclosed contract. Source **S10**, https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the, published **2025-11-28**. It supports considering procurement below retail, not treating $1.60 as known. 

11. **UNKNOWN — Production throughput, utilization and model-specific margin.** I found no Sonnet 5.5 disclosure of paid accelerator-hours, aggregate serving throughput at a matched latency target, paid-capacity utilization, all-in procurement cost or direct-serving margin. The launch speed claim does not identify these quantities; hardware counts and FLOP-utilization assumptions do not identify paid-capacity occupancy. Sources checked: **S1/S3/S7/S10**, with dates above. 

12. **DISCLOSED — Revenue with a different perimeter.** Anthropic’s April announcement reported a revenue run rate above **$30 billion**. That is a historical company disclosure, not September revenue or Sonnet 5.5 margin evidence. Source **S7**, https://www.anthropic.com/news/anthropic-amazon-compute, **2026-04-20**. No company-margin figure is used to calibrate this estimate. 

13. **DISCLOSED — Calculator mechanics, not Anthropic economics.** The public implementation defines billing, roofline equations, donor geometry and operating-point calibrations. Sources, accessed **2026-09-28**: **S14**, https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js; **S15**, https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js; **S16**, https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js. Attachment 03 supplies the permitted-input contract and explicitly warns about Trainium’s throughput-unit ambiguity. “Disclosed” here means disclosed by the calculator publisher.  

14. **COMMUNITY ESTIMATE — Predecessor context.** The **2026-09-25** Sonnet 5 estimate states **83.5232%, with scenarios 73.9941–88.7614%**, on 100B active parameters, 70% utilization and no central residual-stack credit. Source **S17**, https://margins.ashitaorbis.com/research/claude-sonnet-5-astra-pro.html, reviewed from the complete supplied attachment 07. Its assumptions are comparison material, not provider disclosures or a target.  

## 2 — CALCULATOR INPUTS.

Every scenario is fully specified. Source IDs on **ASSUMED** entries identify context, not measurements. `cacheWriteShare: 20` means **20% of fresh input** in the executable billing convention: with 75% billed cache hits, that is **5% of all input**. All selected hourly costs are all-in rental equivalents.

```json
{
  "model_id": "custom",
  "model_name": "Claude Sonnet 5.5",
  "api_model_priced": "claude-sonnet-5-5; pinned release 2026-09-28; standard global first-party Claude API; adaptive thinking, high effort; ordinary Sonnet 5.5 path",
  "customDonor": "dsr1",
  "basis": "list",
  "context_length_assumed": "Standard 1M-capable model, not a separate short-context tariff. Representative 12000 input and 1000 total generated tokens; decode context 12500, peak 13000.",
  "central": {
    "overrides": {
      "customDonor": "dsr1", "active": 100, "total": 1000, "precision": "fp8",
      "priceIn": 2, "priceOut": 10, "cacheReadMult": 10, "billCacheHit": 75,
      "cacheCost": 5, "cacheWriteShare": 20, "cacheWriteMult": 125,
      "batchShare": 0, "discount": 0,
      "blend": {"h100": 5, "h200": 15, "gb200": 25, "gb300": 5, "tpu7": 50},
      "rentAbsLeg": {"h100": 2.5, "h200": 3.8, "gb200": 5, "gb300": 6.5, "tpu7": 2.7},
      "util": 65, "stackMult": 1.1, "trendMonths": 0,
      "interact": "balanced", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 12, "cache_hit": 75}
  },
  "low_margin": {
    "overrides": {
      "customDonor": "dsr1", "active": 200, "total": 1600, "precision": "fp8",
      "priceIn": 2, "priceOut": 10, "cacheReadMult": 10, "billCacheHit": 75,
      "cacheCost": 5, "cacheWriteShare": 20, "cacheWriteMult": 125,
      "batchShare": 0, "discount": 0,
      "blend": {"h100": 5, "h200": 15, "gb200": 25, "gb300": 5, "tpu7": 50},
      "rentAbsLeg": {"h100": 2.5, "h200": 3.8, "gb200": 5, "gb300": 6.5, "tpu7": 3.5},
      "util": 60, "stackMult": 1.0, "trendMonths": 0,
      "interact": "balanced", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 12, "cache_hit": 75}
  },
  "high_margin": {
    "overrides": {
      "customDonor": "dsr1", "active": 60, "total": 1000, "precision": "fp8",
      "priceIn": 2, "priceOut": 10, "cacheReadMult": 10, "billCacheHit": 75,
      "cacheCost": 5, "cacheWriteShare": 20, "cacheWriteMult": 125,
      "batchShare": 0, "discount": 0,
      "blend": {"h100": 5, "h200": 15, "gb200": 25, "gb300": 5, "tpu7": 50},
      "rentAbsLeg": {"h100": 2.5, "h200": 3.8, "gb200": 5, "gb300": 6.5, "tpu7": 2.7},
      "util": 70, "stackMult": 1.2, "trendMonths": 0,
      "interact": "balanced", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 12, "cache_hit": 75}
  },
  "stated": {"headline_pct": 83.8689, "low_pct": 62.435, "high_pct": 89.8596},
  "sources": [
    {"id": "S1", "claim": "Sonnet 5.5 launch, release date, output-speed and customer task-cost claims.", "url": "https://www.anthropic.com/claude-sonnet-5-5", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "Current USD list, cache and batch tariffs; standard pricing through 1M context. Undated page, accessed.", "url": "https://platform.claude.com/docs/en/about-claude/pricing", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "Exact API identity, release date, context and default high-effort adaptive thinking. Undated page, accessed.", "url": "https://platform.claude.com/docs/en/models/sonnet-5-5/overview", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "Same tokenizer as Sonnet 5, recalibrated effort and optional fallback behavior. Undated page, accessed.", "url": "https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S5", "claim": "Dateless current-generation model IDs denote pinned snapshots, not evergreen aliases. Undated page, accessed.", "url": "https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S6", "claim": "GitHub reports its own early tests found fewer steps, tokens and tool calls.", "url": "https://github.blog/changelog/2026-09-28-claude-sonnet-5-5-in-github-copilot/", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S7", "claim": "Company-wide Trainium2 training/serving use and historical April revenue run rate; updated April 21.", "url": "https://www.anthropic.com/news/anthropic-amazon-compute", "date": "2026-04-20", "evidence_class": "DISCLOSED"},
    {"id": "S8", "claim": "Company-wide TPU expansion and TPU, Trainium and NVIDIA hardware strategy, not Sonnet allocation.", "url": "https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services", "date": "2025-10-23", "evidence_class": "DISCLOSED"},
    {"id": "S9", "claim": "Iowa Ironwood retail chip-hour tariffs; undated table, accessed.", "url": "https://cloud.google.com/tpu/pricing", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S10", "claim": "SemiAnalysis estimate of Anthropic rented TPU cost at $1.60/chip-hour, not an invoice.", "url": "https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the", "date": "2025-11-28", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S11", "claim": "Public NVIDIA node/slice prices, not Anthropic procurement; GB300 requires a quote. Undated table, accessed.", "url": "https://www.coreweave.com/pricing", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S12", "claim": "DeepSeek-V3: 671B total, 37B active and MLA; public proxy only. Revised preprint date.", "url": "https://arxiv.org/abs/2412.19437", "date": "2025-02-18", "evidence_class": "DISCLOSED"},
    {"id": "S13", "claim": "Qwen3-Coder: 480B total and 35B active; public proxy only.", "url": "https://qwenlm.github.io/blog/qwen3-coder/", "date": "2025-07-22", "evidence_class": "DISCLOSED"},
    {"id": "S14", "claim": "Public calculator cost and billing implementation; accessed, not an Anthropic disclosure.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S15", "claim": "Public calculator roofline, capacity and absolute-length mapping; accessed.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S16", "claim": "Public calculator donor geometry and operating-point calibration; accessed.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js", "date": "2026-09-28", "evidence_class": "DISCLOSED"},
    {"id": "S17", "claim": "Published Sonnet 5 judgment estimate; reviewed from supplied attachment 07, not treated as provider evidence.", "url": "https://margins.ashitaorbis.com/research/claude-sonnet-5-astra-pro.html", "date": "2026-09-25", "evidence_class": "COMMUNITY ESTIMATE"}
  ],
  "key_inputs": [
    {"input": "active", "central": 100, "low_margin": 200, "high_margin": 60, "source_ids": ["S12", "S13", "S17"], "evidence_class": "ASSUMED"},
    {"input": "total", "central": 1000, "low_margin": 1600, "high_margin": 1000, "source_ids": ["S12", "S13", "S17"], "evidence_class": "ASSUMED"},
    {"input": "customDonor", "central": "dsr1", "low_margin": "dsr1", "high_margin": "dsr1", "source_ids": ["S12", "S15", "S16", "S17"], "evidence_class": "ASSUMED"},
    {"input": "precision", "central": "fp8", "low_margin": "fp8", "high_margin": "fp8", "source_ids": ["S16", "S17"], "evidence_class": "ASSUMED"},
    {"input": "priceIn", "central": 2, "low_margin": 2, "high_margin": 2, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "priceOut", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "cacheReadMult", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "billCacheHit", "central": 75, "low_margin": 75, "high_margin": 75, "source_ids": ["S17"], "evidence_class": "ASSUMED"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": ["S14", "S17"], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteShare", "central": 20, "low_margin": 20, "high_margin": 20, "source_ids": ["S14", "S17"], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteMult", "central": 125, "low_margin": 125, "high_margin": 125, "source_ids": ["S2"], "evidence_class": "DISCLOSED"},
    {"input": "batchShare", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "discount", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "blend", "central": {"h100": 5, "h200": 15, "gb200": 25, "gb300": 5, "tpu7": 50}, "low_margin": {"h100": 5, "h200": 15, "gb200": 25, "gb300": 5, "tpu7": 50}, "high_margin": {"h100": 5, "h200": 15, "gb200": 25, "gb300": 5, "tpu7": 50}, "source_ids": ["S7", "S8", "S16", "S17"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg", "central": {"h100": 2.5, "h200": 3.8, "gb200": 5, "gb300": 6.5, "tpu7": 2.7}, "low_margin": {"h100": 2.5, "h200": 3.8, "gb200": 5, "gb300": 6.5, "tpu7": 3.5}, "high_margin": {"h100": 2.5, "h200": 3.8, "gb200": 5, "gb300": 6.5, "tpu7": 2.7}, "source_ids": ["S9", "S10", "S11", "S17"], "evidence_class": "INFERENCE"},
    {"input": "util", "central": 65, "low_margin": 60, "high_margin": 70, "source_ids": ["S17"], "evidence_class": "ASSUMED"},
    {"input": "stackMult", "central": 1.1, "low_margin": 1.0, "high_margin": 1.2, "source_ids": ["S1", "S6", "S17"], "evidence_class": "ASSUMED"},
    {"input": "trendMonths", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "balanced", "low_margin": "balanced", "high_margin": "balanced", "source_ids": ["S3", "S17"], "evidence_class": "ASSUMED"},
    {"input": "hwMode", "central": "rent", "low_margin": "rent", "high_margin": "rent", "source_ids": [], "evidence_class": "ASSUMED"},
    {"input": "traffic.io_ratio", "central": 12, "low_margin": 12, "high_margin": 12, "source_ids": ["S1", "S17"], "evidence_class": "ASSUMED"},
    {"input": "traffic.cache_hit", "central": 75, "low_margin": 75, "high_margin": 75, "source_ids": ["S17"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg.gb300", "central": 6.5, "low_margin": 6.5, "high_margin": 6.5, "source_ids": ["S11", "S17"], "evidence_class": "ASSUMED"}
  ],
  "confidence": "low — identity and tariff are verified, but architecture, fleet allocation, procurement, throughput and occupancy are not; the span is three judgment scenarios, not a confidence interval."
}
```

## 3 — YOUR OWN READING.

My reading is **83.87% at list**, with coherent low- and high-margin scenarios of **62.43% and 89.86%**. The card rounds these to **≈84%, span 62–90%**. This is a judgment span, not a confidence interval, worst-case envelope or assertion that outcomes outside it are impossible.

**Execution status.** I did **not** obtain a successful live MCP result. The connection attempt to https://margins-mcp.ashitaorbis.com/mcp failed with DNS resolution from the execution environment. The intended call is `run_scenario(model="custom", perspective="median", overrides=central.overrides, traffic=central.traffic)`, repeated for the two other blocks. No remote application receipt or returned margin is being claimed.

Instead, I reconstructed the relevant public FP8/MoE arithmetic from **S14–S16**. It reproduces the predecessor’s **83.5232%** and the supplied current Opus reference’s **82.3265%**. Those checks establish consistency at two operating points, not empirical validation or byte-identical execution of the hosted engine. The publishing leg’s rerun remains authoritative for the card. The historical Opus author’s separate stated figure remains 83.1%, not a target to force the reconstruction toward.  

For each accelerator and serving phase:

```text
Cost per million tokens = all-in $/accelerator-hour × 1,000,000
                          ÷ [3,600 × tokens/second/accelerator × utilization_fraction].
```

The roofline supplies modeled throughput; I blend **costs by served-token shares**, not GPU counts or an arithmetic mean of throughput. Cache-read cost is 5% of fresh-prefill cost. No power, hosting or network charge is added after the all-in hourly rate. This follows the public cost and billing implementation. 

The central reconstruction gives **$0.487169/M fresh input**, **$0.024358/M cached input** and **$1.239001/M output**. For one million output tokens accompanied by twelve million input tokens:

```text
Inputs: 9M cache reads + 2.4M ordinary fresh tokens + 0.6M five-minute writes.

Billings = 9×$0.20 + 2.4×$2 + 0.6×$2.50 + 1×$10
         = $18.10.

Serving cost = 3×$0.487168896 + 9×$0.024358445 + $1.239001433
             = $2.919734125.

Serving margin = 1 − $2.919734125 / $18.10
               = 83.868872%.
```

| Scenario | Fresh-input cost, $/M | Output cost, $/M | Cost per million mixed tokens | Modeled serving margin |
|---|---:|---:|---:|---:|
| Central | 0.487169 | 1.239001 | 0.224595 | 83.8689% |
| Low margin | 1.183561 | 2.715986 | 0.523021 | 62.4350% |
| High margin | 0.270428 | 0.902428 | 0.141185 | 89.8596% |

All three have **$1.392308 billings per million mixed tokens**, counting input and output together. Extra digits are for reproducibility, not measurement precision.

**Unit and feasibility checks.** Parameters are billions; rates are per GPU/chip-hour, not per node, rack or two-GPU package; `util: 65` means 65%; and `cacheReadMult: 10` means 10%, not tenfold. All five priced legs accommodate their declared operating batch under the reconstruction’s capacity policy in all three scenarios. No expensive leg is silently removed and renormalized. That is a policy-feasibility check, not evidence of an actual placement or satisfied latency target. All three margins are positive without flooring or changing inputs to satisfy the positivity constraint.

## 4 — WHY THESE INPUTS.

**Architecture — carried centrally; wider alternatives.** My central **100B active / 1,000B total** is **ASSUMED**, carried explicitly from attachment 07/S17. S12/S13 provide only broad sparse-model context. Three days and a product-speed claim are insufficient evidence for replacing that prior with a confidently smaller model. I do not infer parameter count from price or benchmark scores, and I do not reduce active parameters while also crediting the same speed gain through software efficiency. 

The low case is **200B active / 1,600B total**: a heavier architecture paired with somewhat less favorable procurement and launch occupancy. The high case is **60B active / 1,000B total**: fewer active weights, but no reduction in total capacity burden. Neither architecture is measured. A disclosed architecture would replace these assumptions rather than merely refine their decimals.

**Precision and geometry — carried.** **FP8 and `dsr1`** remain assumptions in all three runs, as in the predecessor. I have no model-specific evidence favoring another donor, nor justification for applying FP4 across every hardware family. `dsr1` supplies a compressed-KV, 61-layer approximation; it does not establish that Anthropic uses MLA. The magnitudes come exclusively from `active` and `total`. A materially larger real KV footprint would generally raise cost, while successful lower-precision serving could lower it. Sources: **S12/S15/S16/S17**.  

**Fleet — carried, and explicitly a proxy.** The selected token shares remain **H100 5%, H200 15%, GB200 25%, GB300 5%, TPU7 50%** in every scenario. Company-wide multi-family deployment makes a mixed economic exposure defensible, but no source measures these percentages. I do not invent a three-day Blackwell migration or assert that launch traffic occupies the newest chips. Sources: **S7/S8/S17**.  

**Trainium exclusion is an engine limitation, not a fleet finding.** Attachment 03 flags a replica-global versus per-chip throughput interpretation with approximately **15.2×** consequences for Trainium2; Trainium3 inherits the ambiguity. I therefore carry the predecessor’s omission of both. TPU exposure stands in for part of an ASIC-heavy economic position, **not a verified cost equivalence between TPU and Trainium**. This unresolved representation error materially limits a whole-provider interpretation. 

**Procurement — carried centrally; one downside change.** These values are all-in economic rental equivalents, not negotiated invoices:

| Accelerator | Central $/accelerator-hour | Low | High | Basis and uncertainty |
|---|---:|---:|---:|---|
| H100 | 2.50 | 2.50 | 2.50 | Carried; close to CoreWeave’s public spot-node equivalent, $19.71/8 ≈ $2.464. |
| H200 | 3.80 | 3.80 | 3.80 | Carried committed-procurement judgment, below public on-demand $50.44/8 = $6.305. |
| GB200 | 5.00 | 5.00 | 5.00 | Carried large-commitment judgment, below public $42/4 = $10.50. |
| GB300 | 6.50 | 6.50 | 6.50 | Carried **ASSUMED** point; no matched public NVL72 rental quote established. |
| TPU7 | 2.70 | 3.50 | 2.70 | Central/high carried: half the $5.40 three-year retail tariff, above SemiAnalysis’s $1.60 estimate. Downside assumes less favorable access. |

Sources **S9–S11**, with current price-table access **2026-09-28** and strategic estimate dated **2025-11-28**. Public anchors establish procurement classes, not equivalence of terms, geography or service guarantees. The exact selected rates remain judgments; GB300 is particularly weakly grounded. 

The Sonnet-specific owned/rented split is unknown. I do not claim a measured owned-hardware conversion or price owned capacity at electricity alone. An owned conversion would require annualized hardware, site and network capital plus annual infrastructure operating expense, divided by 8,760 paid hours **before** the separate utilization divisor. Here `hwMode: "rent"` expresses the selected all-in equivalent directly. **No second power charge, hosting charge, overhead percentage or procurement discount is added.**

**Traffic and cache — carried assumptions.** I retain **12 input tokens per output token**, **75% serving cache hits**, **75% billed cache hits**, **5% cache-read cost relative to prefill**, and **20% of fresh input billed as five-minute writes**. This describes prefix-heavy agentic/API work, with ordinary generated and thinking tokens included in output. It is not population telemetry. Product positioning motivates that class of workload but does not identify these numbers. Sources **S1/S14/S17**. 

The same-tokenizer disclosure prevents an unjustified extra token-count adjustment. Fewer tokens and calls per completed task could change the aggregate input/output mix in either direction; the launch evidence does not disclose that joint distribution. I therefore do not mechanically lower input volume, raise cache hits or increase utilization on the strength of lower customer task cost. The assumed write mix contains no one-hour writes, although their tariff was verified. 

**Utilization — central changed from 70% to 65%; ASSUMED.** I allow a modest launch-day penalty for routing, allocation and effective batching that have not yet settled. This is a judgment, not observed launch inefficiency: strong launch demand could instead improve occupancy. The low/high settings are **60%/70%**, not extremes. Balanced latency is carried in every run; higher throughput obtained by relaxing latency is not silently assumed. The predecessor’s utilization was also unmeasured. 

**Private-stack advantage — central changed from 1.0× to 1.10×; ASSUMED.** I allow a modest residual improvement beyond the calculator’s open-practice baseline. The output-speed claim provides directional motivation, **not a measurement of this multiplier**. Streaming speed can improve through different batching, hardware allocation or latency tradeoffs without a proportional reduction in paid accelerator-hours. The selected 10% is not “one third of 30%” calculated from evidence. Source **S1** is product evidence; the numerical credit is mine. 

The calculator applies `stackMult` to prefill as well as decode efficiency. Extending the modest credit across both phases is an additional assumption, because the launch’s numerical speed claim concerns output. The low case gives **no residual credit**; the high case gives **1.20×**, not the full advertised speed change. `trendMonths` stays **zero everywhere**, and `specDec` is omitted, so no private-stack mechanism is credited twice. 

Lower customer task cost is not an extra serving-margin multiplier. In the simple case where the same percentage reduction applies to billed tokens and serving work, both revenue and cost per task fall and unit margin is unchanged. Fewer calls might also save fixed per-request work, but that requires evidence about overhead and task composition that is absent here. Likewise, benchmark improvements do not establish a parameter count, accelerator count or cost reduction.

**Complete predecessor change record.** Relative to attachment 07, all unlisted values are carried exactly. Identity/name/release necessarily change to Sonnet 5.5; the carrier remains `custom`.

| Input | Central: Sonnet 5 → 5.5 | Low-margin scenario: 5 → 5.5 | High-margin scenario: 5 → 5.5 |
|---|---|---|---|
| Active parameters, B | 100 → 100 | 160 → 200 | 70 → 60 |
| Total parameters, B | 1,000 → 1,000 | 1,400 → 1,600 | 1,000 → 1,000 |
| Utilization | 70% → 65% | 65% → 60% | 75% → 70% |
| Stack multiplier | 1.0 → 1.10 | 1.0 → 1.0 | 1.10 → 1.20 |
| TPU7 all-in hourly cost | $2.70 → $2.70 | $2.70 → $3.50 | $2.70 → $2.70 |

The wider architecture alternatives acknowledge a new unrevealed design. The downside combines heavier computation with somewhat less favorable loading and TPU procurement, while keeping NVIDIA rents, precision, geometry, traffic and fleet composition fixed. The upside keeps a 1T capacity burden, ordinary central rents and only 70% utilization while allowing fewer active weights and a stronger stack. **It does not combine the cheapest hardware, lowest precision, maximum utilization and maximum cache reuse.** The predecessor vector is recorded in attachment 07. 

Tariffs and cache multipliers are **reverified for this model**, although numerically unchanged. FP8, donor, fleet shares, NVIDIA rents, context convention, traffic, cache-cost/write assumptions, balanced latency, zero lead, rental basis and zero batch/discount are explicitly carried. The zero batch and discount settings also remain binding conditions of the commission.

The central arithmetic moves **83.5232% → 82.2558%** from utilization alone, then **→ 83.8689%** from the stack credit: a net **+0.35 percentage points**. Both cards round to 84%; that similarity is an arithmetic outcome, not evidence that the real margins are equal or that the launch materially improved unit margin.

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The comparison vector is the supplied **300B active / 2.5T total**, FP8, $5/$25 tariff, **65% utilization**, two months of residual lead and the **5/10/25/20/40** fleet. Its corresponding hourly rents are **$2.28/$3.496/$4.275/$5.70/$2.70**. The historical author stated 83.1% with a 68–92% selected span; my reconstruction of the current supplied reference yields **82.3265%**, without tuning.  

The following is a **sequential, path-dependent bridge**. Its changes add only in the stated order, not as independent universal sensitivities.

| Change, in order | Margin after change | Change in percentage points |
|---|---:|---:|
| Current Opus reference reconstruction | 82.33% | — |
| List tariff $5/$25 → $2/$10 | 55.82% | −26.51 |
| Active parameters 300B → 100B | 80.41% | +24.59 |
| Total parameters 2.5T → 1T | 82.88% | +2.47 |
| Fleet → 5/15/25/5/50 | 83.76% | +0.87 |
| Rents → my selected all-in rents | 82.51% | −1.25 |
| Two-month lead/1.0× stack → zero lead/1.10× stack | 80.90% | −1.61 |
| Traffic and billed cache 15:1/60% → 12:1/75% | 83.60% | +2.69 |
| Cache writes 0 → 20% of fresh input | 83.87% | +0.27 |

Utilization is **65% in both central vectors**, so contributes zero in this comparison. FP8, donor convention, balanced latency, rental basis, cache-read price multiplier, cache-read cost fraction, zero batch share and zero discount are unchanged. The traffic step also reduces representative decode context from 15,500 to 12,500 tokens; it is not exclusively a revenue-mix effect.

The smaller **assumed active model** largely offsets the much lower tariff. That assumption, not a disclosed Sonnet production measurement, explains why the resulting margin is near the Opus reference.

**Reference-traffic companion.** My central cost assumptions at `io_ratio: 15`, `cache_hit: 60` **and `billCacheHit: 60`** give **81.3722%**, about **0.95 points below** the current Opus reconstruction. Keeping my write assumption distinguishes that from a fully matched zero-write reference; also setting `cacheWriteShare: 0` gives **80.9026%**.

Changing **only** the traffic object while leaving `billCacheHit: 75` gives **77.4152%**. That is a different billing experiment, not the ordinary like-for-like comparison. The publishing leg should label which convention it runs. None of these companion runs replaces the headline.

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

The most valuable disclosure would be **Sonnet 5.5 paid accelerator-hours and all-in expenditure matched to input, output, cache, context, effort and latency telemetry**. It would bypass most of the architectural proxy. A parameter-count disclosure alone would help substantially, but would not resolve KV traffic, batching, procurement or occupancy.

These are one-at-a-time replacements of central assumptions, calculated with the same reconstruction—not extra span endpoints chosen after seeing their outputs:

| Replacement evidence or diagnostic | Resulting margin | Movement from central |
|---|---:|---:|
| 200B active rather than 100B | 73.32% | −10.54 points |
| TPU7 all-in rate $5.40 rather than $2.70/hour | 77.74% | −6.13 points |
| Paid-capacity utilization 50% rather than 65% | 79.03% | −4.84 points |
| 2T total weights rather than 1T | 80.91% | −2.96 points |
| Cache reads cost 15% rather than 5% of fresh prefill | 81.45% | −2.42 points |
| No residual stack advantage: 1.0× rather than 1.10× | 82.26% | −1.61 points |
| Matched 1.30× residual stack advantage | 86.35% | +2.48 points |

A separate procurement diagnostic substitutes the public H100/H200 node equivalents, GB200 at $10.50 and TPU7 at $5.40, keeping unquoted GB300 at $6.50. It yields **69.57%**. This is **not a wholly retail-priced fleet**, because GB300 remains assumed. It shows why verifying procurement matters even when list token prices are certain. Public anchors are **S9/S11**, accessed **2026-09-28**. 

There is also material calibration risk beyond the selected input span. Holding decode fixed and multiplying reconstructed fresh-prefill cost—and its proportional cache cost—by **0.5 or 1.5** gives **88.51% or 79.23%**. Those are phase-cost diagnostics, not accepted overrides or revised endpoints. A measured prefill rate would therefore be valuable even without revealing the model’s parameters.

Evidence of GQA-like or otherwise much larger KV traffic at the relevant context could move the estimate downward beyond the current architectural scenarios. Evidence of substantially smaller active computation, cheaper matched procurement or demonstrably more efficient serving would move it upward. An observed increase in customer task productivity, by itself, would not falsify this per-token margin estimate.

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Absolute context and its distribution.** The contract has no independent context-length input. The public mapping uses a representative **1,000-token output**, deriving input length from the ratio. I therefore explicitly assume **12,000 input tokens, 12,500 representative decode-context tokens and 13,000 peak tokens**. This is not an estimate for traffic concentrated near the 1M maximum. Long trajectories, compaction and the distribution of output/thinking lengths can change attention cost and feasible batching. Standard long-context *pricing* does not imply constant long-context *cost*. Sources **S2/S15**, accessed **2026-09-28**. 

**Geometry is selectable but not identifiable.** `customDonor` can choose among three approximations; it cannot express arbitrary Sonnet layer counts, KV heads, compression, expert placement or hybrids. I use `dsr1` for continuity, not because Anthropic disclosed it. All three selected scenarios retain that geometry, so their span does **not** exhaust attention-design risk. Likewise, FP8 is a representation assumption, not a verified description of every serving tensor. 

**Imported throughput, capacity and phase behavior.** The public calculator transfers open-model operating-point calibrations to this closed model. Its capacity widths are policy outputs, not observed Sonnet placements; fitting weights and KV under a planning reserve does not prove a latency service level. The registered TPU throughput convention and the separately solved capacity width must not be mistaken for the same measured deployment quantity. Trainium’s unresolved unit issue remains excluded rather than guessed away. The model also lacks a clean commission-level input for an output-only efficiency improvement, which is why the all-phase stack credit is explicitly an approximation. Sources **S15/S16** and attachment 03.  

**Fleet allocation and ownership.** I could not establish Sonnet 5.5’s sites, regions, accelerator generations, phase-specific placements, actual Trainium share or owned-versus-rented allocation. Provider availability on a cloud is not a chip-allocation disclosure. A fixed token-share proxy cannot capture separate prefill and decode fleets or the relationship between volume, contract terms and utilization. No owned-capital schedule was fabricated to fill this gap.

**Effort, safety and fallbacks.** Effort settings have been recalibrated, so the same label need not entail the predecessor’s amount of thinking. Optional fallback traffic can involve Sonnet 5. I did not establish its incidence or the compute burden of classifiers, rejected drafts and other auxiliary serving work. The estimate prices the declared ordinary high-effort path; it does not separately fit those components or pretend that customer latency reveals them. Source **S4**, accessed **2026-09-28**. 

**Cache semantics and missing telemetry.** The executable convention is a write share of **fresh** input, despite the shorter contract wording “share of input.” I followed that convention, as did the predecessor. The real split among five-minute writes, one-hour writes, billed reads and internal unbilled reuse remains unknown. Equality of serving and billing cache-hit rates is assumed, not guaranteed. Sources **S14/S17**.  

**Research and execution limits.** All three uploaded files were readable and reviewed in full; their first lines were recorded before the analysis. I verified the primary launch and pricing pages, but did not retrieve the linked full Sonnet 5.5 system card. I obtained no live MCP scenario receipt. The public predecessor page is represented here by the supplied complete attachment, not a claim of a successful fresh page retrieval. Architecture, strategic invoices, production throughput, occupancy, traffic distribution and model-specific direct-serving margin remain unestablished.

**Interpretation.** The estimate includes all-in infrastructure time and paid-capacity slack through utilization, but excludes training, R&D, sales, G&A, free-tier serving, support and unbilled retries under the commissioned perimeter. The **62–90% span is wider than the predecessor’s because the new release leaves more architecture and deployment uncertainty—not because every unfavorable assumption was stacked together.** Even that span is conditional on the proxy geometry and calibration. The best public-information reading is approximately 84%; the evidence does not support calling it Anthropic’s measured margin.

Download the complete copy-of-record report (a file in the research run's own workspace, not published)
