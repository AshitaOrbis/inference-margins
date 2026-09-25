## 0 — THE CARD, IN TWO LINES.

≈92% at list (span 84–94%)  
An inferred $1.36 all-in owned-TPU chip-hour—not Google Cloud’s $5.40 resale tariff—carries the result.

## 1 — PUBLIC FACTS.

**GPT-6 Astra Pro · September 25, 2026.** This estimates unit direct-serving contribution margin for standard paid, short-context text traffic. It is not a verified Google margin or an accounting gross margin. Source dates below are publication/update dates unless explicitly marked “accessed.” All sources were checked on September 25, 2026.

1. **DISCLOSED — Exact model and release.** I price `gemini-3.1-pro-preview`, publicly released **February 19, 2026**. Google still labels the endpoint “Preview”; its documentation gives input/output limits of 1,048,576/65,536 tokens. Sources: **S1**, [Google launch](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-pro/), February 19, 2026; **S2**, [endpoint documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview), updated August 18, 2026. 

2. **DISCLOSED — Variants and reasoning.** Google exposes a separate `gemini-3.1-pro-preview-customtools` endpoint. The ordinary endpoint supports low, medium and high thinking, with high the default. This estimate prices the ordinary endpoint’s default reasoning behavior, not customtools, Deep Think, Priority, Flex or Batch. Sources: **S2**, August 18, 2026; **S5**, [thinking documentation](https://ai.google.dev/gemini-api/docs/thinking), accessed September 25, 2026. 

3. **DISCLOSED — Current Pro status.** Google’s current Gemini landing page still marks **Gemini 3.5 Pro “coming soon.”** I found no newer generally available Pro endpoint in the current provider catalog. An announced successor is not a substitute for an available, priced API model. Source: **S4**, [Google’s Gemini model page](https://deepmind.google/models/gemini/), accessed September 25, 2026. 

4. **DISCLOSED — Verified list tariff.** For prompts **≤200,000 tokens**, standard prices are **$2 input, $0.20 cached input and $12 output per million tokens**. Above that threshold they are **$4, $0.40 and $18**. Output includes thinking tokens. Explicit cache storage costs **$4.50 per million cached tokens per hour**. The project’s quoted token tariff is correct. I found no separate introductory tariff for this Pro endpoint. Source: **S3**, [provider pricing](https://ai.google.dev/gemini-api/docs/pricing), updated **September 24, 2026**, verified September 25. 

5. **DISCLOSED — Caching mechanism, not cache-hit telemetry.** Google supports automatic implicit caching and passes its cache-hit savings to callers; the documented minimum for Gemini 3.1 Pro is 4,096 input tokens. This establishes a mechanism, not a population hit rate. Source: **S6**, [caching documentation](https://ai.google.dev/gemini-api/docs/caching), updated September 2, 2026. 

6. **DISCLOSED — Architectural family.** Gemini 3.1 Pro’s card delegates architecture details to Gemini 3 Pro’s card, which describes a sparse mixture-of-experts transformer. That supports a sparse-model approximation, but not a particular expert count or attention implementation. Sources: **S7**, [3.1 Pro card](https://deepmind.google/models/model-cards/gemini-3-1-pro/), February 19, 2026; **S20**, [Gemini 3 Pro family card](https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-Pro-Model-Card.pdf), updated May 2026, exact day unstated. 

7. **UNKNOWN — Gemini parameter counts.** Neither total nor active parameters are publicly identified in those cards. The memorization paper cited as a lead in the earlier Google dive does not repair this: its latest version explicitly excludes Gemini Pro, and its MoE estimates are lower bounds, not identified sizes. Source: **S9**, [Ivica Nikolic’s paper, version 3](https://arxiv.org/html/2605.29223v3), June 5, 2026. Its method is a **community estimate**, not a Google disclosure. 

8. **DISCLOSED — Usable structural proxy, not a Gemini measurement.** DeepSeek-V3 discloses **671B total / 37B active** and multi-head latent attention, the family behind the `dsr1` donor. Its roughly 5.5% active fraction makes a roughly 5% sparse scenario intelligible; it does not establish Gemini’s scale. Source: **S8**, [DeepSeek-V3 technical report](https://arxiv.org/abs/2412.19437), revised February 18, 2025. 

9. **DISCLOSED — Hardware capabilities and serving family.** Google documents TPU-based Gemini serving. Ironwood supplies **4.614 PFLOP/s FP8, 192 GiB HBM and 7.38 TB/s memory bandwidth per physical chip**. One physical chip contains two chiplets and appears as two logical JAX devices; those are not two separately priced chips. Google’s TPU page still marks TPU 8i “coming soon.” Sources: **S10**, [Ironwood documentation](https://docs.cloud.google.com/tpu/docs/tpu7x), updated September 18, 2026; **S11**, [TPU product page](https://cloud.google.com/tpu), accessed September 25; **S15**, [Google’s production study](https://arxiv.org/html/2508.15734v1), August 21, 2025. 

10. **DISCLOSED — External hardware prices.** Iowa Ironwood prices are **$12/chip-hour on demand, $6 Flex-start, $8.40 with a one-year commitment and $5.40 with three years**. These are customer tariffs, not Google’s internal resource costs. Source: **S12**, [Cloud TPU pricing](https://cloud.google.com/tpu/pricing), accessed September 25, 2026. 

11. **CREDIBLY REPORTED — Capital-cost anchor.** SemiAnalysis reports approximately **400,000 Ironwoods in finished racks worth $10 billion** and estimates an Anthropic strategic rental rate around **$1.60/TPU-hour**. These are analyst estimates, not an executed contract or Google’s internal invoice. Source: **S13**, [SemiAnalysis Ironwood analysis](https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the), November 28, 2025. 

12. **COMMUNITY ESTIMATE — Observable user performance.** Artificial Analysis reports **120.2 streamed output tokens/second** and **26.02 seconds to first token** on its current first-party-API benchmark page. Neither figure measures aggregate tokens per accelerator-second: chip count, concurrency and resource sharing are absent. Source: **S14**, [benchmark page](https://artificialanalysis.ai/models/gemini-3-1-pro-preview), accessed September 25, 2026. 

13. **DISCLOSED — Cost improvement and idle-energy evidence.** Google reports a **78% reduction in Gemini serving unit costs during 2025**, without an absolute endpoint-specific cost. Its earlier production study includes provisioned idle capacity in full-stack prompt energy. An idle-energy share is not a paid-capacity utilization percentage. Sources: **S16**, [Alphabet Q4 2025 earnings call](https://abc.xyz/investor/events/event-details/2026/2025-Q4-Earnings-Call-2026-Dr_C033hS6/default.aspx), February 4, 2026; **S15**, [production study](https://arxiv.org/html/2508.15734v1), August 21, 2025, observing May 2025 traffic. 

14. **UNKNOWN — The decisive production measurements.** I could not establish this endpoint’s TPU-generation shares, physical serving locations, paid occupancy, aggregate throughput, internal chip-hour cost, model-specific revenue or direct-serving margin. Sources examined include **S7, S10–S16**, with URLs and dates above. These negative findings describe the search’s limits, not proof that no disclosure exists anywhere.

15. **INFERENCE — Equivalent owned cost.** S13’s finished-rack observation implies a **$25,000/chip system reference**. Combining that with the explicitly assumed financing, useful lives, facility allocation, power and operations in section 4 yields **$1.36/all-in chip-hour**, or **$1.61** with shorter hardware recovery. Derivation dated September 25, 2026; source URL and original date are S13’s. This is not a quoted Google rate.

16. **ASSUMED — The unmeasured operating vector.** **100B active / 2T total, 70% occupancy, 8:1 input:output and 40% cache hits** are my working judgments, dated September 25, 2026. S7–S9, S6 and S15 motivate the model form and mechanisms, but do not measure these values. No provider self-description by an AI model is used as evidence.

17. **INFERENCE — Calculator reconstruction.** I used the public [cost/billing code](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js) (**S17**), [frozen model/calibration data](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js) (**S18**) and [roofline equations](https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js) (**S19**), all accessed September 25, 2026. They produce policy-scenario economics, not measured provider margins. The supplied contract identifies engine `v3.0.0-2026-08-13`.  

## 2 — CALCULATOR INPUTS.

Parameter magnitudes are **billions**; utilization, cache shares and `cacheReadMult` are **percentages**. The extra permitted cache fields explicitly pin otherwise inherited defaults. Source IDs attached to `ASSUMED` inputs identify contextual evidence, not measurements of their numerical values.

```json
{
  "model_id": "custom",
  "model_name": "Gemini 3.1 Pro",
  "api_model_priced": "gemini-3.1-pro-preview; released 2026-02-19; standard paid API, default high thinking; endpoint as available 2026-09-25",
  "customDonor": "dsr1",
  "basis": "list",
  "context_length_assumed": "Short-context tariff, prompts <=200000 tokens; representative 8000 input and 1000 billed output tokens including thinking; mean decode context 8500, peak 9000; assumed, not measured.",
  "central": {
    "overrides": {
      "customDonor": "dsr1", "active": 100, "total": 2000, "precision": "fp8",
      "priceIn": 2, "priceOut": 12, "cacheReadMult": 10, "billCacheHit": 40,
      "cacheCost": 5, "cacheWriteShare": 0, "cacheWriteMult": 100,
      "batchShare": 0, "discount": 0,
      "blend": {"tpu7": 100}, "rentAbsLeg": {"tpu7": 1.36},
      "util": 70, "stackMult": 1.0, "trendMonths": 0, "interact": "balanced", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 40}
  },
  "low_margin": {
    "overrides": {
      "customDonor": "dsr1", "active": 160, "total": 3000, "precision": "fp8",
      "priceIn": 2, "priceOut": 12, "cacheReadMult": 10, "billCacheHit": 40,
      "cacheCost": 5, "cacheWriteShare": 0, "cacheWriteMult": 100,
      "batchShare": 0, "discount": 0,
      "blend": {"tpu7": 100}, "rentAbsLeg": {"tpu7": 1.61},
      "util": 65, "stackMult": 1.0, "trendMonths": 0, "interact": "balanced", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 40}
  },
  "high_margin": {
    "overrides": {
      "customDonor": "dsr1", "active": 80, "total": 1500, "precision": "fp8",
      "priceIn": 2, "priceOut": 12, "cacheReadMult": 10, "billCacheHit": 40,
      "cacheCost": 5, "cacheWriteShare": 0, "cacheWriteMult": 100,
      "batchShare": 0, "discount": 0,
      "blend": {"tpu7": 100}, "rentAbsLeg": {"tpu7": 1.36},
      "util": 75, "stackMult": 1.0, "trendMonths": 0, "interact": "balanced", "hwMode": "rent"
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 40}
  },
  "stated": {"headline_pct": 91.6, "low_pct": 83.8, "high_pct": 93.9},
  "sources": [
    {"id": "S1", "claim": "Google launch of Gemini 3.1 Pro Preview.", "url": "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-pro/", "date": "2026-02-19", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "Exact preview and customtools endpoints; token limits; documentation update date.", "url": "https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview", "date": "2026-08-18", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "Standard token and cache tariffs; page updated September 24 and checked September 25.", "url": "https://ai.google.dev/gemini-api/docs/pricing", "date": "2026-09-24", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "Current landing page still marks Gemini 3.5 Pro coming soon; date is access date.", "url": "https://deepmind.google/models/gemini/", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S5", "claim": "High is default thinking; low, medium and high supported; date is access date.", "url": "https://ai.google.dev/gemini-api/docs/thinking", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S6", "claim": "Implicit cache behavior and 4096-token minimum for Gemini 3.1 Pro.", "url": "https://ai.google.dev/gemini-api/docs/caching", "date": "2026-09-02", "evidence_class": "DISCLOSED"},
    {"id": "S7", "claim": "Gemini 3.1 Pro refers architecture questions to the Gemini 3 Pro card.", "url": "https://deepmind.google/models/model-cards/gemini-3-1-pro/", "date": "2026-02-19", "evidence_class": "DISCLOSED"},
    {"id": "S8", "claim": "DeepSeek-V3 donor proxy: 671B total, 37B active and MLA; not Gemini sizes.", "url": "https://arxiv.org/abs/2412.19437", "date": "2025-02-18", "evidence_class": "DISCLOSED"},
    {"id": "S9", "claim": "Memorization estimator excludes Gemini Pro and cannot identify exact MoE sizes.", "url": "https://arxiv.org/html/2605.29223v3", "date": "2026-06-05", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S10", "claim": "Ironwood physical-chip specifications and two-logical-device distinction.", "url": "https://docs.cloud.google.com/tpu/docs/tpu7x", "date": "2026-09-18", "evidence_class": "DISCLOSED"},
    {"id": "S11", "claim": "Ironwood available; TPU 8i still coming soon; date is access date.", "url": "https://cloud.google.com/tpu", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S12", "claim": "Iowa Ironwood public chip-hour prices; not internal Google costs; date is access date.", "url": "https://cloud.google.com/tpu/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S13", "claim": "Analyst reports approximately 400000 Ironwoods in finished racks worth $10B and estimates $1.60/hour strategic rental.", "url": "https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the", "date": "2025-11-28", "evidence_class": "CREDIBLY REPORTED"},
    {"id": "S14", "claim": "Independent first-party-API stream-speed benchmark; not per-chip throughput; date is access date.", "url": "https://artificialanalysis.ai/models/gemini-3-1-pro-preview", "date": "2026-09-25", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S15", "claim": "Google full-stack serving-energy study; May 2025 observations do not measure this endpoint occupancy.", "url": "https://arxiv.org/html/2508.15734v1", "date": "2025-08-21", "evidence_class": "DISCLOSED"},
    {"id": "S16", "claim": "Google reports 78% reduction in Gemini serving unit costs during 2025, without absolute model-specific costs.", "url": "https://abc.xyz/investor/events/event-details/2026/2025-Q4-Earnings-Call-2026-Dr_C033hS6/default.aspx", "date": "2026-02-04", "evidence_class": "DISCLOSED"},
    {"id": "S17", "claim": "Cost and billing reconstruction from public calculator code; date is access date.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine.js", "date": "2026-09-25", "evidence_class": "INFERENCE"},
    {"id": "S18", "claim": "Frozen donor, operating-point and calibration inputs used in the reconstruction; date is access date.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-data-v22.js", "date": "2026-09-25", "evidence_class": "INFERENCE"},
    {"id": "S19", "claim": "Decode, prefill and memory-policy equations used in the reconstruction; date is access date.", "url": "https://raw.githubusercontent.com/AshitaOrbis/inference-margins/main/site/engine-roofline-v22.js", "date": "2026-09-25", "evidence_class": "INFERENCE"},
    {"id": "S20", "claim": "Gemini 3 Pro family card describes sparse MoE; updated May 2026, exact day unstated; date is access date.", "url": "https://storage.googleapis.com/deepmind-media/Model-Cards/Gemini-3-Pro-Model-Card.pdf", "date": "2026-09-25", "evidence_class": "DISCLOSED"}
  ],
  "key_inputs": [
    {"input": "active", "central": 100, "low_margin": 160, "high_margin": 80, "source_ids": ["S7", "S8", "S9"], "evidence_class": "ASSUMED"},
    {"input": "total", "central": 2000, "low_margin": 3000, "high_margin": 1500, "source_ids": ["S7", "S8", "S9"], "evidence_class": "ASSUMED"},
    {"input": "customDonor", "central": "dsr1", "low_margin": "dsr1", "high_margin": "dsr1", "source_ids": ["S8", "S18"], "evidence_class": "ASSUMED"},
    {"input": "precision", "central": "fp8", "low_margin": "fp8", "high_margin": "fp8", "source_ids": ["S10", "S15"], "evidence_class": "INFERENCE"},
    {"input": "priceIn", "central": 2, "low_margin": 2, "high_margin": 2, "source_ids": ["S3"], "evidence_class": "DISCLOSED"},
    {"input": "priceOut", "central": 12, "low_margin": 12, "high_margin": 12, "source_ids": ["S3"], "evidence_class": "DISCLOSED"},
    {"input": "cacheReadMult", "central": 10, "low_margin": 10, "high_margin": 10, "source_ids": ["S3"], "evidence_class": "INFERENCE"},
    {"input": "billCacheHit", "central": 40, "low_margin": 40, "high_margin": 40, "source_ids": ["S6"], "evidence_class": "ASSUMED"},
    {"input": "traffic.cache_hit", "central": 40, "low_margin": 40, "high_margin": 40, "source_ids": ["S6"], "evidence_class": "ASSUMED"},
    {"input": "traffic.io_ratio", "central": 8, "low_margin": 8, "high_margin": 8, "source_ids": ["S2", "S5"], "evidence_class": "ASSUMED"},
    {"input": "blend", "central": {"tpu7": 100}, "low_margin": {"tpu7": 100}, "high_margin": {"tpu7": 100}, "source_ids": ["S10", "S11", "S15"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg.tpu7", "central": 1.36, "low_margin": 1.61, "high_margin": 1.36, "source_ids": ["S13"], "evidence_class": "INFERENCE"},
    {"input": "util", "central": 70, "low_margin": 65, "high_margin": 75, "source_ids": ["S15"], "evidence_class": "ASSUMED"},
    {"input": "stackMult", "central": 1.0, "low_margin": 1.0, "high_margin": 1.0, "source_ids": ["S15", "S16", "S18"], "evidence_class": "ASSUMED"},
    {"input": "trendMonths", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": ["S15", "S16"], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "balanced", "low_margin": "balanced", "high_margin": "balanced", "source_ids": ["S14", "S18"], "evidence_class": "ASSUMED"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": ["S17"], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteShare", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": ["S6"], "evidence_class": "ASSUMED"}
  ],
  "confidence": "low: tariffs are verified, but architecture, traffic, occupancy and production throughput are not identified; the span is three conditional judgments, not a probability interval."
}
```

## 3 — YOUR OWN READING.

My central reading is **91.6% at list**, with a **three-scenario judgment span of 83.8–93.9%**—rounded on the card to **92%, span 84–94%**. The decimals identify the arithmetic, not the precision of knowledge about Google.

**Execution status.** I attempted the public [MCP endpoint](https://margins-mcp.ashitaorbis.com/mcp) on September 25, 2026, calling `run_scenario` with `model="custom"`, `perspective="median"`, and exactly the central `overrides` and `traffic` in section 2. The transport failed with **“Temporary failure in name resolution”**; **no MCP result was returned**. The numbers below come from an independent transcription of the public calculator equations, not from a successful connector call or execution of its complete receipt/validation system.

As a consistency check, that transcription reproduces the supplied Opus vector at **82.3265%**, matching attachment 02’s **82.33%** current-engine figure. That is a useful implementation check, not validation of Gemini’s unknown architecture or proof of identical deployed code. The leg’s actual calculator result remains the publication headline; a discrepancy should be preserved, not erased by changing inputs. The supplied contract itself records the current Opus value. 

**Cost calculation.** For each phase, I apply:

\[
C_{\$/M}=\frac{H\times10^6}{3600\times T\times U},
\]

where \(H\) is the all-in physical-chip hourly cost, \(T\) is modeled occupied-chip token throughput, and \(U\) is paid-capacity utilization as a fraction. The equation is the public calculator’s cost identity, evaluated on my assumptions. **S17, S19.** 

The frozen TPU calculation uses 16 outputs per chip per decode step, the `dsr1` geometry and a resident-weight traffic term based on total parameters divided by a declared 16-chip width. Its decode coefficient is 0.519; its transferred prefill coefficient is 0.17581. These are calculator assumptions/calibrations, not Gemini measurements. **S18.** 

At the central point, the reconstructed rates are **471.58 output tokens/second/chip** and **3,687.41 fresh-input tokens/second/chip**. Decode is memory-bound in this representation. Substitution gives:

\[
C_o=\frac{1.36\times10^6}{3600\times471.5764\times0.70}
=\$1.144422/M,
\]

\[
C_i=\frac{1.36\times10^6}{3600\times3687.4083\times0.70}
=\$0.146358/M,
\qquad C_c=0.05C_i=\$0.007318/M.
\]

For every one million billed output tokens, my traffic assumption supplies 4.8 million fresh and 3.2 million cached input tokens. Thus:

\[
R=4.8(2)+3.2(0.20)+12=\$22.24,
\]

\[
C=4.8(0.146358)+3.2(0.007318)+1.144422
=\$1.870359,
\]

\[
m=1-\frac{1.870359}{22.24}=\mathbf{91.5901\%}.
\]

Both numerator and denominator describe the same nine-million-token bundle. Expressed per million total served tokens:

| Reconstructed quantity | Central | Low-margin scenario | High-margin scenario |
|---|---:|---:|---:|
| List billings | $2.471111 | $2.471111 | $2.471111 |
| Direct serving cost | $0.207818 | $0.399109 | $0.151697 |
| Fresh-input cost per million fresh tokens | $0.146358 | $0.288372 | $0.111763 |
| Output cost per million output tokens | $1.144422 | $2.161653 | $0.810928 |
| Serving margin | **91.5901%** | **83.8490%** | **93.8612%** |

The **low-margin scenario** combines a larger sparse model with three-year rather than four-year hardware recovery and modestly lower occupancy. The **high-margin scenario** combines a smaller sparse model with moderately better occupancy, but keeps central procurement cost. Neither scenario assumes a different tariff, FP4, a private efficiency windfall, or an extreme cache mix.

All three are positive. The dimensional checks are explicit: billions become parameters through \(10^9\); dollars per token become dollars per million through \(10^6\); the rent is per **physical chip**, not node, chiplet or logical device; `util: 70` becomes 0.70 exactly once. No input was changed to force the result above zero.

## 4 — WHY THESE INPUTS.

**Owned hardware: $1.36/hour, not a discount applied twice.** The $25,000 system reference comes from S13’s reported finished racks, so I do not apply an additional generic rack/host multiplier. I separately allocate facility infrastructure, electricity and direct operations. The following numerical choices are **ASSUMED**, not disclosed Google costs:

| All-in cost component | Working assumption | Central $/chip-hour |
|---|---|---:|
| Installed IT system recovery | $25,000; four years; 8% annual capital recovery rate | 0.861646 |
| Facility recovery | 1,500 allocated IT watts × $12.50/watt; 15 years; 8% | 0.250063 |
| Electricity and cooling | 1.5 allocated kW including host/network share × 1.12 PUE × $0.08/kWh | 0.134400 |
| Direct maintenance and operations | 4% of IT system reference annually | 0.114155 |
| **Total** | Before the separate occupancy divisor | **1.360265** |

Using \(\operatorname{CRF}(r,n)=r/[1-(1+r)^{-n}]\), the conversion is:

\[
H=\frac{25000\operatorname{CRF}(0.08,4)}{8760}
+\frac{18750\operatorname{CRF}(0.08,15)}{8760}
+1.5(1.12)(0.08)+\frac{0.04(25000)}{8760}.
\]

Changing only IT recovery to three years gives **$1.606020/hour**, entered as **$1.61** in the low-margin scenario. This is an economic rental-equivalent valuation, including capital recovery, not an assertion about Google’s accounting depreciation or internal transfer price. S13 supplies the capital reference; the rest are my stated September 25 assumptions. 

Power, hosting and networking are inside that hourly number. There is **no second energy, hosting or control-plane uplift** in token costs. Customer support and unbilled retries remain outside the commissioned scope. A disclosed lower build cost or longer economic life would raise margin; faster obsolescence or higher system/facility allocation would lower it. Replacing $1.36 with the external $5.40 tariff, with all other inputs unchanged, gives **66.6%**, a **25.0-point** reduction—not evidence that Google actually incurs that rate.

**Architecture: 100B active / 2T total; low 160B/3T; high 80B/1.5T.** The numerical scale is **ASSUMED**. S7 establishes a sparse family; S8 supplies an inspectable low-active-fraction analogue; S9 prevents mistaking a black-box lower-bound method for a Pro measurement. My central 5% activation fraction is analogous, not identified. Nothing public selects 2T rather than 1.5T or 3T. I do not reverse-engineer parameters from list prices, benchmark scores or user stream speed. 

Both magnitudes matter here. Active parameters control compute and much of prefill; total parameters enter this TPU representation’s resident-weight traffic, not just memory feasibility. Holding other central inputs fixed, raising total size to 3T lowers margin to **89.1%**; raising active size to 160B lowers it to **89.8%**. Those are separate diagnostics, not the jointly varied low scenario.

**Precision and geometry: FP8, `dsr1`.** FP8-equivalent economics are an **INFERENCE** from Ironwood capability and Google’s published quantization practice, not a disclosed production dtype. `dsr1` is an **ASSUMED** compressed-KV approximation. I retain it because the public record does not identify a better donor, not because Google has disclosed MLA. No additional speculative-decoding credit is claimed. **S8, S10, S15, S18.** 

**Fleet: 100% `tpu7` as an equivalent serving fleet.** TPU-family serving has public support; the generation allocation does not. I use Ironwood as the available registered proxy rather than inventing shares for older TPUs or pre-release TPU 8i. This is **ASSUMED**, and is not a claim that every real Gemini request runs on Ironwood. A different generation’s cost per delivered token—not its chip count alone—would move the estimate. **S10, S11, S15.** 

**Occupancy: 70%, with 65% and 75% scenarios.** These are **ASSUMED paid-capacity utilization values**, not matrix-multiply utilization and not an interpretation of Google’s idle-energy percentage. I judge a reasonably loaded shared serving pool more plausible than either continuous saturation or very low occupancy, while allowing latency reservations and uneven demand. There is no endpoint-specific measurement behind 70. At otherwise central inputs, 50% occupancy gives **88.2%**. **S15** provides context, not a numerical occupancy estimate. 

**Traffic: 8:1; 40% served and billed cache hits.** This is my **ASSUMED** paid-text mix: coding and document prompts supply substantial input, reasoning supplies billed output, and repeated prefixes allow meaningful—but not universal—reuse. It is not Google telemetry. I assume implicit caching dominates the modeled reuse, so explicit storage revenue is not added. The context assumption is **8,000 input / 1,000 total billed output tokens**, including thinking; section 7 explains its limitation. **S2, S5, S6** support use cases and mechanisms, not these frequencies. 

**Caching cost and writes: 5%, zero write premium.** `cacheCost: 5` is an **ASSUMED** share of fresh-prefill cost, held constant rather than selecting a favorable endpoint. `cacheWriteShare: 0` and the inert `cacheWriteMult: 100` avoid inventing a token-write surcharge. Storage charging is a separate issue, not a write multiplier. **S3, S6, S17.** 

**Efficiency: `stackMult: 1`, `trendMonths: 0`, balanced latency.** I award **no private-stack advantage beyond the calculator’s published-practice calibration**. The choice is a neutral **ASSUMPTION**, not evidence that Google has no advantage. S15 and S16 establish improvement over time, but not a contemporaneous standing gap against the calculator’s baseline. Counting historical gains again would risk double credit. Balanced is also a judgment: a stream-speed observation cannot identify fleet-wide batching. 

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The reference’s **83.1%, span 68–92%** is its author’s retained reading, not today’s replay. Its declared vector includes 65% utilization, two months of efficiency lead, FP8, $5/$25 pricing, the 5/10/25/20/40 NVIDIA/TPU blend and 15:1/60% traffic. I preserve that distinction: the reconstruction starts at the supplied current-engine **82.33%**, rather than treating the older 83.1% as a fresh calculator return.   

The following is a **sequential arithmetic bridge**. Changes are made in the displayed order, retaining previous changes. Accordingly, the point contributions add up, but are order-dependent—not independent causal estimates.

| Change from the reference vector | Margin after change | Incremental points |
|---|---:|---:|
| Current Opus-vector reconstruction | 82.33% | — |
| Input price: $5 → $2; cached rate remains 10% | 72.90% | −9.43 |
| Output price: $25 → $12 | 59.24% | −13.66 |
| Active parameters: 300B → 100B | 81.93% | +22.69 |
| Total parameters: 2.5T → 2T | 82.69% | +0.76 |
| Fleet: reference blend → 100% TPU; retain TPU $2.70/hour | 84.83% | +2.14 |
| TPU hourly cost: $2.70 → $1.36 | 92.36% | +7.53 |
| Paid occupancy: 65% → 70% | 92.91% | +0.55 |
| Efficiency lead: two months → zero | 91.48% | −1.43 |
| Traffic and billed cache: 15:1/60% → 8:1/40% | **91.59%** | **+0.11** |

The starting per-leg rents are $2.28 H100, $3.496 H200, $4.275 GB200, $5.70 GB300 and $2.70 TPU: attachment 02’s procurement factors applied to today’s supplied planning prices. This is a replay of the reference’s assumptions, not a newly sourced Anthropic procurement estimate. The original author explicitly classified procurement and occupancy as judgments. 

FP8, the compressed-KV donor convention, balanced latency, `stackMult: 1`, 10% cache-read billing, 5% cache serving cost, zero write share and list-only billing are unchanged and contribute **zero** in this bridge. The write multiplier differs but is inert at zero write share.

**Two different Reference-traffic companions must not be confused.** A literal rerun changing only `traffic` to 15:1/60% leaves my explicit `billCacheHit: 40` untouched. That yields **92.95%**: $0.137387 cost against $1.95 billings per million total tokens. It grants more physical reuse without granting customers the corresponding additional cache discount.

For an economically like-for-like comparison with Opus’s **served-and-billed 60% cache share**, also set `billCacheHit: 60`. That companion is **91.48%**, with the same cost against **$1.6125/M** billings. It is about **9.15 points above** the current Opus-vector reconstruction. Neither companion replaces the **91.59% native-assumption headline**. The served/billed distinction is explicitly recognized in the original reference. 

**Against the earlier Google dive:** its **95.7%** relied on a peak-FLOPs-derived **1,398 output tokens/second/chip**, $1.28/hour, 75% occupancy and a separate 12% uplift. My reconstruction instead obtains about **472 output tokens/second/chip**, treats resident-weight traffic explicitly, and puts all included infrastructure burdens inside the hourly price. The old report is a lead, not a target; I do not adjust this vector to recover 95.7%. 

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

The most valuable measurement would be **Gemini 3.1 Pro’s billed output and fresh-input tokens per physical accelerator-second at a stated context distribution, cache policy and latency target**, accompanied by occupied versus paid chip-hours. That would replace the most consequential combination of assumed architecture, frozen batching and calibration with a directly comparable operating point.

A few explicit tests show the direction and scale:

| New evidence or diagnostic, holding other central assumptions fixed | Consequence |
|---|---|
| Output throughput is half the modeled 471.6 tokens/second/chip | Margin falls to **86.4%** |
| All included serving costs are twice the reconstruction | Margin falls to **83.2%**, just below the selected low scenario |
| Equivalent all-in resource cost is $5.40 rather than $1.36/hour | Margin falls to **66.6%** |
| The model has 4T total parameters at the same active size and frozen throughput representation | Margin falls to **86.6%** |
| Actual paid occupancy is 50%, not 70% | Margin falls to **88.2%** |

These are falsification diagnostics, not additional endpoints of the published three-scenario span. Better measured throughput, cheaper installed systems, higher occupancy or less resource-intensive attention would move the estimate upward. Longer effective contexts, lower effective batching, costlier hardware recovery or greater non-token work inside the serving boundary would move it downward.

The public calculator itself warns about transferring one prefill calibration across hardware. Applying its **0.5–1.5× prefill-cost sensitivity** to this central case gives **93.2–90.0%** margin. That diagnostic is separate from my parameter/procurement/occupancy scenarios; it is not an additional efficiency credit. **S18.** 

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Independent context length.** The submitted interface has no separate absolute-context control. On this custom traffic path, the public code retains a 1,000-token output-length convention; an 8:1 ratio therefore implies 8,000 input tokens, 8,500 mean decode-context tokens and 9,000 peak tokens. I adopt those lengths explicitly rather than letting “≤200k” imply that a 200k prompt was actually costed. They are not measured Gemini averages. A distribution with substantial 50k–200k prompts or much longer reasoning needs a different cost calculation even before crossing the tariff threshold. **S17, S19.** 

**Actual attention and placement.** `customDonor` is selectable, so the geometry choice is not literally missing. What is missing is the ability to specify Gemini’s real layers, KV compression, local/global attention pattern and component placement. I keep `dsr1`; there is no public basis to claim that `qwen3c` or `llama70` is a closer match. The selected span does **not** bound this architectural uncertainty.

A hand check of the registered FP8 weight-plus-peak-KV policy admits the central, low and high scenarios at **16, 32 and 16 physical TPU chips**, respectively. That is modeled feasibility, not observed deployment. The throughput representation separately freezes its declared width at 16; increasing the capacity width does not automatically award extra bandwidth. Workspace, fragmentation, expert imbalance and the requested latency objective remain unverified. **S18, S19.** 

**Batching and calibration.** The TPU operating point is an analyst-declared extrapolation, not a matched Gemini trace. Its output-only calibration convention also cannot supply a clean, model-matched separation of prefill and decode occupancy. This is a structural limitation, not something I compensate for by inserting a favorable `stackMult`. **S18.** 

**Heterogeneous TPUs and request routing.** The allowed hardware set lacks older TPU generations and TPU 8i. A sole-Ironwood equivalent cannot express generation-by-context routing, regional fragmentation, or differing prefill/decode fleets. Model-specific sites, chip counts and generation shares were not established. Public hardware availability is not allocation evidence. **S10, S11, S15.** 

**Storage, tools, modalities and long-context tiers.** The headline assumes implicit-cached text traffic. It neither earns explicit-cache storage revenue nor assigns a separate storage asset cost. Explicit storage duration, search/tool charges, multimodal encoder work and the share above 200k tokens require additional quantities this input vector does not supply. I do not apply the higher long-context tariff to unchanged short-context costs, or blend other Google surfaces into API revenue. **S2, S3, S6.** 

**Remaining unknowns.** I did not establish an immutable backend weight revision behind the preview alias; actual active/total size or expert routing; production weight, activation and KV dtypes; aggregate SLO-matched throughput; speculative-decoding acceptance and draft costs; occupancy; request-length and billed-thinking distributions; model-specific caching telemetry; internal build cost or transfer price; serving allocation by site; or a disclosed Gemini 3.1 Pro revenue, direct cost or margin. Public tariffs, hardware specifications and relative cost improvements are substantially firmer than those missing inputs. **S2, S7, S9–S16.**

**Attachment receipt and use.** All three uploaded files were readable and reviewed. Their first lines/headings were:

| Uploaded filename | First line or heading, truncated where needed |
|---|---|
| `03-calculator-contract-live-2026-09-25.json` | `{"result":{"content":{"type":"text","text":"The scenario space of the Frontier Inference Margins ca` |
| `04-opus-4x-reference-dive-verbatim-2026-08-08.md` | Opening JSON code fence: ` ```json ` |
| `06-google-gptpro.md` | `# Google (Gemini) — GPT-5.6 Pro deep dive` |

The contract supplied the accepted controls and current reference; the full Opus report supplied its authored vector and scope; the older Google report supplied leads that were checked rather than inherited.   

**Bottom line:** the public evidence supports the tariff and a TPU-based serving hypothesis, but does not identify a provider margin. My declared vector produces a reconstructed **91.6% at list, with 83.8–93.9% across three plausible conditional scenarios**. Live MCP execution and the decisive production measurements were not obtained; neither absence is concealed by the headline.

[Complete report — copy of record (a file in the research run's own workspace, not published)