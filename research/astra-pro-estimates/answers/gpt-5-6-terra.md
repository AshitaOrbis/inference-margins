## 0 — THE CARD, IN TWO LINES.

≈90.8% at list (span 80.6–94.5%)  
The decisive assumption is 60B active parameters: a moderately sparse workhorse, not a price-derived fraction of Sol.

## 1 — PUBLIC FACTS.

**GPT-6 Astra Pro · September 25, 2026 · PRO-BROKER-ID pr-20260925T070104Z-bfdf05#1.**

This is a modeled **unit direct-serving contribution margin**, not OpenAI’s accounting gross margin or a verified provider margin. Dates below are publication dates where available; otherwise they are explicitly access dates. Source IDs also identify the evidence behind the input block.

The three uploaded files opened and were read in full. Their receipt is preserved here:

| Requested filename | First line, truncated to about 100 characters |
|---|---|
| `03-calculator-contract-live-2026-09-25.json` | `{"result":{"content":[{"type":"text","text":"The scenario space of the Frontier Inference Margins ca` |
| `04-opus-4x-reference-dive-verbatim-2026-08-08.md` | `` ```json `` |
| `06-openai-gptpro.md` | `# OpenAI — GPT-5.6 Pro deep dive` |

1. **Identity and release — DISCLOSED [S1, S2].** The priced API alias is **`gpt-5.6-terra`**, from the family’s **July 9, 2026 general-availability release**. I price Standard processing, standard reasoning mode, **medium effort**, and the short-context tariff. The alias supports multiple reasoning efforts; I did not establish an immutable dated snapshot or the internal routing behind it. Sources: [family launch](https://openai.com/index/gpt-5-6/), published **2026-07-09**, and [Terra model page](https://developers.openai.com/api/docs/models/gpt-5.6-terra), accessed **2026-09-25**. 

2. **Current tariff — DISCLOSED [S2, S3].** Standard text-token rates are **$2.00 fresh input, $0.20 cached input, $2.50 cache write, and $12.00 output per million tokens**. The project’s three quoted rates are correct, but cache writes also matter. I checked the [canonical pricing page](https://developers.openai.com/api/docs/pricing), the provider’s [indexed German pricing table](https://developers.openai.com/de-DE/api/docs/pricing), and the model page on **2026-09-25**. The English page’s extracted view did not expose Terra’s row; the localized table did, independently matching the live model page. These are access dates, not asserted pricing-page revision dates. 

3. **Price history and other tiers — DISCLOSED [S3, S4].** OpenAI reduced Terra’s price **20% on July 30, 2026**. I found no announced expiration for that reduction; the separately labeled Sol promotion is not Terra’s tariff. Batch/Flex and Fast are different processing tiers and are excluded here. Source: [price-performance announcement](https://openai.com/index/advancing-the-price-performance-frontier-with-gpt-5-6/), published **2026-07-30**; [pricing table](https://developers.openai.com/de-DE/api/docs/pricing), accessed **2026-09-25**. 

4. **Cache and reasoning billing — DISCLOSED [S5, S14].** A cache write is billed at **1.25 times** fresh input, not fresh input plus another 1.25 times. Cache reads, writes, and ordinary uncached input must not be counted twice. Hidden reasoning tokens are billed as output and therefore belong in this report’s output-token denominator. Sources: [prompt-caching guide](https://developers.openai.com/api/docs/guides/prompt-caching) and [reasoning guide](https://developers.openai.com/api/docs/guides/reasoning), both accessed **2026-09-25**. 

5. **Architecture proxies — DISCLOSED [S2, S6, S7].** No public Terra parameter count or attention geometry was established. OpenAI’s **gpt-oss-120b has 117B total/5.1B active parameters**; DeepSeek-V3 has **671B/37B** and uses MLA. Those establish plausible sparsity patterns, not Terra’s size. Sources: [OpenAI gpt-oss release](https://openai.com/index/introducing-gpt-oss/), **2025-08-05**; [DeepSeek-V3 README](https://github.com/deepseek-ai/DeepSeek-V3/blob/main/README.md), accessed **2026-09-25**. My 60B-active choice remains judgment.  

6. **Infrastructure — DISCLOSED at company level [S8, S9].** OpenAI identifies operating Hopper/Blackwell systems across **Microsoft, OCI and CoreWeave**. Its Abilene announcement identifies OCI operation and GB200 training/inference. Neither establishes Terra’s fleet shares or serving location. Sources: [Scaling AI for everyone](https://openai.com/index/scaling-ai-for-everyone/), **2026-02-27**; [Stargate sites announcement](https://openai.com/index/five-new-stargate-sites/), **2025-09-23**. I use a partner-supplied rental-equivalent cost basis, not an assertion that OpenAI owns the accelerators. 

7. **Hourly-price anchors — DISCLOSED public offers, not OpenAI’s prices [S10, S11].** Lambda lists **$3.99/H100-SXM GPU-hour** and **$6.69/B200 GPU-hour**. CoreWeave lists a **four-GPU GB200 slice at $42/hour**, or **$10.50/GPU-hour**, with host resources. These are different products and contract classes; B200 is not automatically an NVL72-equivalent deployment. Sources: [Lambda instances](https://lambda.ai/instances), [CoreWeave pricing](https://www.coreweave.com/pricing), accessed **2026-09-25**. My lower long-term, all-in rates are inferred estimates, not a disclosed OpenAI discount. 

8. **Endpoint performance — COMMUNITY ESTIMATE [S12].** Artificial Analysis shows Terra medium at **79.9 output tokens/second** and **2.14 seconds to first answer token** in its rolling benchmark. Source: [Terra medium provider benchmark](https://artificialanalysis.ai/models/gpt-5-6-terra-medium/providers), accessed **2026-09-25**. These are user-stream measurements, not aggregate tokens per GPU or paid-capacity occupancy. The July attachment’s approximately 153-token/second observation is not reused as today’s measurement.  

9. **Serving-cost improvements — DISCLOSED [S13].** OpenAI reports a **20% end-to-end serving-cost reduction** from kernel work and a separate **greater-than-15% generation-efficiency improvement** from draft-model work. Source: [frontier-efficiency article](https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency/), **2026-07-29**. This is not a Terra-specific cost-per-token or measured standing advantage over current open practice. I found no Terra revenue, serving-margin, paid-occupancy, or aggregate-throughput disclosure. 

10. **Terra’s absolute economics and architecture — UNKNOWN [S2, S8, S13].** The [model documentation](https://developers.openai.com/api/docs/models/gpt-5.6-terra), accessed **2026-09-25**, the **2026-02-27** [infrastructure announcement](https://openai.com/index/scaling-ai-for-everyone/), and the **2026-07-29** [efficiency disclosure](https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency/) do not establish Terra’s parameter count, paid utilization, model-specific hardware allocation, revenue, absolute serving cost or margin. These gaps remain unknown, not zero. 

11. **Calculator evidence — DISCLOSED as a calculator contract [S15], not as provider economics.** The supplied September 25 contract identifies the custom carrier, permissible inputs, and policy-dependent serving model. The public [engine source](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine.js), read **2026-09-25**, supports the arithmetic reconstruction below. An engine assumption does not become an observed deployment merely because it is executable. 

## 2 — CALCULATOR INPUTS.

`cacheWriteShare` is explicitly **50% of fresh input**, equivalent to 17.5% of all input at a 65% cache-read share. The exact operating assumptions are mine; source IDs for an assumed input identify contextual evidence, not a measurement of that value. All three scenarios retain the same tariff, traffic, fleet and rents.

```json
{
  "model_id": "custom",
  "model_name": "GPT-5.6 Terra",
  "api_model_priced": "gpt-5.6-terra API alias as served 2026-09-25; family GA 2026-07-09; Standard processing, standard reasoning mode, medium effort; no immutable dated snapshot established",
  "customDonor": "dsr1",
  "basis": "list",
  "context_length_assumed": "Text-only, <=272000 input-token tariff tier; representative 8000 input + 1000 billed output tokens, mean decode context 8500 and peak live context 9000; not a claim that the whole tier costs the same",
  "central": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 60,
      "total": 1200,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 12,
      "cacheReadMult": 10,
      "billCacheHit": 65,
      "batchShare": 0,
      "discount": 0,
      "blend": {"h100": 5, "h200": 25, "gb200": 50, "gb300": 20},
      "rentAbsLeg": {"h100": 2.6, "h200": 3.4, "gb200": 4.5, "gb300": 6},
      "util": 70,
      "stackMult": 1.1,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 65}
  },
  "low_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 120,
      "total": 2400,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 12,
      "cacheReadMult": 10,
      "billCacheHit": 65,
      "batchShare": 0,
      "discount": 0,
      "blend": {"h100": 5, "h200": 25, "gb200": 50, "gb300": 20},
      "rentAbsLeg": {"h100": 2.6, "h200": 3.4, "gb200": 4.5, "gb300": 6},
      "util": 65,
      "stackMult": 1.0,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 65}
  },
  "high_margin": {
    "overrides": {
      "customDonor": "dsr1",
      "active": 35,
      "total": 700,
      "precision": "fp8",
      "priceIn": 2,
      "priceOut": 12,
      "cacheReadMult": 10,
      "billCacheHit": 65,
      "batchShare": 0,
      "discount": 0,
      "blend": {"h100": 5, "h200": 25, "gb200": 50, "gb300": 20},
      "rentAbsLeg": {"h100": 2.6, "h200": 3.4, "gb200": 4.5, "gb300": 6},
      "util": 75,
      "stackMult": 1.15,
      "trendMonths": 0,
      "interact": "balanced",
      "hwMode": "rent",
      "cacheCost": 5,
      "cacheWriteShare": 50,
      "cacheWriteMult": 125
    },
    "traffic": {"mode": "custom", "io_ratio": 8, "cache_hit": 65}
  },
  "stated": {"headline_pct": 90.8, "low_pct": 80.6, "high_pct": 94.5},
  "sources": [
    {"id": "S1", "claim": "GPT-5.6 family general availability, including Terra.", "url": "https://openai.com/index/gpt-5-6/", "date": "2026-07-09", "evidence_class": "DISCLOSED"},
    {"id": "S2", "claim": "Terra API alias, reasoning choices, context limits and model-specific tariff; date is access date.", "url": "https://developers.openai.com/api/docs/models/gpt-5.6-terra", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S3", "claim": "Official pricing-table Terra Standard row: input 2, cached input 0.20, cache write 2.50, output 12 USD/M; indexed localized page checked on this date.", "url": "https://developers.openai.com/de-DE/api/docs/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S4", "claim": "Terra price reduced 20%; customer examples establish use cases, not traffic shares.", "url": "https://openai.com/index/advancing-the-price-performance-frontier-with-gpt-5-6/", "date": "2026-07-30", "evidence_class": "DISCLOSED"},
    {"id": "S5", "claim": "Cache-read, cache-write and uncached billing treatment; date is access date.", "url": "https://developers.openai.com/api/docs/guides/prompt-caching", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S6", "claim": "gpt-oss-120b has 117B total and 5.1B active parameters; this is a proxy, not Terra.", "url": "https://openai.com/index/introducing-gpt-oss/", "date": "2025-08-05", "evidence_class": "DISCLOSED"},
    {"id": "S7", "claim": "DeepSeek-V3 has 671B total and 37B active parameters and MLA; README accessed on this date.", "url": "https://github.com/deepseek-ai/DeepSeek-V3/blob/main/README.md", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S8", "claim": "Hopper and Blackwell systems operating across Microsoft, OCI and CoreWeave; not Terra allocation.", "url": "https://openai.com/index/scaling-ai-for-everyone/", "date": "2026-02-27", "evidence_class": "DISCLOSED"},
    {"id": "S9", "claim": "Abilene operates through OCI; GB200 systems used for training and inference.", "url": "https://openai.com/index/five-new-stargate-sites/", "date": "2025-09-23", "evidence_class": "DISCLOSED"},
    {"id": "S10", "claim": "Public H100 SXM 3.99 and B200 6.69 USD/GPU-hour comparables; date is access date.", "url": "https://lambda.ai/instances", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S11", "claim": "GB200 four-GPU slice costs 42 USD/hour, or 10.50 per GPU-hour; date is access date.", "url": "https://www.coreweave.com/pricing", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S12", "claim": "Terra medium user-stream benchmark: 79.9 output tokens/s and 2.14 seconds to first answer; rolling observation accessed on this date.", "url": "https://artificialanalysis.ai/models/gpt-5-6-terra-medium/providers", "date": "2026-09-25", "evidence_class": "COMMUNITY ESTIMATE"},
    {"id": "S13", "claim": "OpenAI reports 20% lower serving cost from kernel work and over 15% generation-efficiency improvement from draft-model work; not a Terra standing-gap measurement.", "url": "https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency/", "date": "2026-07-29", "evidence_class": "DISCLOSED"},
    {"id": "S14", "claim": "Reasoning tokens consume context and are billed as output; date is access date.", "url": "https://developers.openai.com/api/docs/guides/reasoning", "date": "2026-09-25", "evidence_class": "DISCLOSED"},
    {"id": "S15", "claim": "Calculator source and its authored assumptions, not provider measurements; read alongside supplied live contract on this date.", "url": "https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine.js", "date": "2026-09-25", "evidence_class": "DISCLOSED"}
  ],
  "key_inputs": [
    {"input": "active", "central": 60, "low_margin": 120, "high_margin": 35, "source_ids": ["S2", "S6", "S7"], "evidence_class": "ASSUMED"},
    {"input": "total", "central": 1200, "low_margin": 2400, "high_margin": 700, "source_ids": ["S6", "S7"], "evidence_class": "INFERENCE"},
    {"input": "customDonor", "central": "dsr1", "low_margin": "dsr1", "high_margin": "dsr1", "source_ids": ["S6", "S7", "S15"], "evidence_class": "ASSUMED"},
    {"input": "precision", "central": "fp8", "low_margin": "fp8", "high_margin": "fp8", "source_ids": ["S6", "S15"], "evidence_class": "ASSUMED"},
    {"input": "priceIn / priceOut / cacheReadMult", "central": [2, 12, 10], "low_margin": [2, 12, 10], "high_margin": [2, 12, 10], "source_ids": ["S2", "S3", "S4"], "evidence_class": "DISCLOSED"},
    {"input": "blend", "central": {"h100": 5, "h200": 25, "gb200": 50, "gb300": 20}, "low_margin": {"h100": 5, "h200": 25, "gb200": 50, "gb300": 20}, "high_margin": {"h100": 5, "h200": 25, "gb200": 50, "gb300": 20}, "source_ids": ["S8", "S9"], "evidence_class": "ASSUMED"},
    {"input": "rentAbsLeg", "central": {"h100": 2.6, "h200": 3.4, "gb200": 4.5, "gb300": 6}, "low_margin": {"h100": 2.6, "h200": 3.4, "gb200": 4.5, "gb300": 6}, "high_margin": {"h100": 2.6, "h200": 3.4, "gb200": 4.5, "gb300": 6}, "source_ids": ["S8", "S9", "S10", "S11", "S15"], "evidence_class": "INFERENCE"},
    {"input": "util", "central": 70, "low_margin": 65, "high_margin": 75, "source_ids": ["S8"], "evidence_class": "ASSUMED"},
    {"input": "stackMult", "central": 1.1, "low_margin": 1.0, "high_margin": 1.15, "source_ids": ["S13"], "evidence_class": "ASSUMED"},
    {"input": "trendMonths", "central": 0, "low_margin": 0, "high_margin": 0, "source_ids": ["S13"], "evidence_class": "ASSUMED"},
    {"input": "interact", "central": "balanced", "low_margin": "balanced", "high_margin": "balanced", "source_ids": ["S12", "S15"], "evidence_class": "ASSUMED"},
    {"input": "traffic.io_ratio", "central": 8, "low_margin": 8, "high_margin": 8, "source_ids": ["S4", "S12", "S14"], "evidence_class": "ASSUMED"},
    {"input": "traffic.cache_hit / billCacheHit", "central": [65, 65], "low_margin": [65, 65], "high_margin": [65, 65], "source_ids": ["S5", "S12"], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteShare", "central": 50, "low_margin": 50, "high_margin": 50, "source_ids": ["S5"], "evidence_class": "ASSUMED"},
    {"input": "cacheWriteMult", "central": 125, "low_margin": 125, "high_margin": 125, "source_ids": ["S2", "S3", "S5"], "evidence_class": "DISCLOSED"},
    {"input": "cacheCost", "central": 5, "low_margin": 5, "high_margin": 5, "source_ids": ["S15"], "evidence_class": "ASSUMED"}
  ],
  "confidence": "low; this is a scenario-conditioned estimate with verified tariffs but unmeasured Terra architecture, hardware allocation, occupancy and traffic."
}
```

## 3 — YOUR OWN READING.

My reading is **90.8% at list, with a selected three-scenario span of 80.6–94.5%**. This is conditional on a compressed-KV, moderately sparse workhorse served on the declared fleet. It is neither a probability interval nor a bound on every possible Terra architecture.

**Computation status.** I attempted an unauthenticated `run_scenario` call to `https://margins-mcp.ashitaorbis.com/mcp`, using `model="custom"`, `perspective="median"`, `overrides=central.overrides`, and `traffic=central.traffic` from heading 2. The host failed to resolve in the execution environment; there was **no returned scenario result**. I therefore transcribed the published cost/billing equations and relevant roofline constants into a separate arithmetic reconstruction. It reproduces the supplied current Opus reference to its **82.33% rounding**. That is an implementation cross-check, not a live-connector receipt or validation of the underlying economics. The publishing leg’s engine rerun remains authoritative for its card. 

The accelerator-hour identity, with its million-token conversion explicit, is:

\[
 c_j\;[\$/\mathrm{Mtok}]
 =\frac{10^6 r_j}{3600\,q_j\,(u/100)},
\]

where \(r_j\) is **all-in dollars per GPU-hour**, \(q_j\) is phase-specific aggregate tokens per occupied GPU-second, and \(u\) is paid-capacity utilization in percent. I compute each leg separately and then token-weight the costs. Dividing an average rent by an average throughput would not reproduce that calculation.

For central inputs, the reconstructed aggregate rates are approximately:

| Accelerator | Fresh-prefill tokens/s/GPU | Output tokens/s/GPU | All-in $/GPU-hour |
|---|---:|---:|---:|
| H100 | 2,735 | 1,251 | 2.60 |
| H200 | 2,735 | 1,792 | 3.40 |
| GB200 | 6,907 | 3,624 | 4.50 |
| GB300 | 6,907 | 1,839 | 6.00 |

**These are model outputs, not measured Terra throughput.** The unfavorable GB300-versus-GB200 ordering comes from the calculator’s different assumed operating batches and efficiency coefficients; I neither interpret it as a hardware verdict nor change the fleet to conceal it. The governing public files are [roofline equations](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js) and [hardware/calibration data](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-data-v22.js), both read **2026-09-25**. 

After the 70% utilization divisor, the token-weighted costs are **$0.34037/M fresh input**, **$0.017019/M cached input**, and **$0.73484/M output**. Cache writes retain fresh-prefill serving cost; their separate billing surcharge is not a second prefill operation.

Take a bundle of **one million billed output tokens and eight million input tokens**. The input contains 5.2 million cache reads, 1.4 million ordinary fresh tokens, and 1.4 million cache-written tokens. Billings are:

\[
 R=12+5.2(0.20)+1.4(2.00)+1.4(2.50)=\$19.34.
\]

Serving cost is:

\[
 C=0.73484+2.8(0.34037)+5.2(0.017019)
 \approx\$1.77638.
\]

Thus:

\[
 m=1-C/R\approx1-1.77638/19.34=90.815\%.
\]

| Joint scenario | Fresh-input cost, $/M | Cached-input cost, $/M | Output cost, $/M | Cost per million aggregate tokens | Serving margin |
|---|---:|---:|---:|---:|---:|
| Low margin | 0.74885 | 0.03744 | 1.46540 | 0.41743 | **80.6%** |
| Central | 0.34037 | 0.01702 | 0.73484 | 0.19738 | **90.8%** |
| High margin | 0.19534 | 0.00977 | 0.46923 | 0.11855 | **94.5%** |

All three have **$2.14889 billings per million aggregate tokens**. The low case is a larger model with less mature scheduling and no residual stack credit; the high case is a smaller model with somewhat better occupancy and kernels. Neither combines every conceivable adverse or favorable input.

**Sanity audit:** parameters are in billions, token costs in millions, GB200/GB300 rents per GPU rather than superchip or rack, and utilization is entered as **70**, not **0.70**. Power and hosting are already in the hourly rent. All three margins are positive; no input was adjusted to clear zero. A manual capacity check finds legal-width fits under the calculator’s stated policy for the selected NVIDIA legs, but does not establish production placement or latency compliance.

## 4 — WHY THESE INPUTS.

**Active parameters: 60B central, 120B low-margin, 35B high-margin [S2, S6, S7] — ASSUMED.** No public measurement identifies a narrow Terra size prior. I treat it as a more substantial active model than the older open sparse proxies, but not as a several-hundred-billion-active flagship. The magnitude is judgment; the public evidence establishes that sparse workhorse architectures are plausible, not that 60B is correct. I do **not** derive size from the $2/$12 tariff or divide Sol’s estimated parameters by a pricing ratio.

**Total parameters: 1.2T, 2.4T, 0.7T [S6, S7] — conditional INFERENCE.** I apply a declared 20:1 total-to-active ratio, between the roughly 18:1 and 23:1 open-model examples. This is not an independent Terra measurement. On the NVIDIA active-parameter surrogate, total size primarily affects capacity feasibility rather than smoothly multiplying decode cost. A disclosed total count could force different parallelism without producing a proportional cost change.  

**Geometry and precision: `dsr1`, FP8 throughout [S6, S7, S15] — ASSUMED.** The donor is an effective compressed-KV approximation, not a claim that OpenAI copied DeepSeek’s architecture. OpenAI’s own gpt-oss uses a different attention pattern, so it does not prove MLA. Neither alternative frozen donor clearly matches Terra better on the available evidence. I retain the commission’s declared donor, keep FP8 rather than presume fleet-wide four-bit serving, and treat geometry risk as structural uncertainty outside the numeric span. 

**Fleet: H100 5%, H200 25%, GB200 50%, GB300 20% [S8, S9] — ASSUMED token shares.** The company-level evidence motivates a Hopper/Blackwell proxy. The generation split is judgment: existing Hopper capacity remains useful while Blackwell carries most modeled tokens. These are not installed-GPU shares. No public source assigns these percentages, or GB300 specifically, to Terra. Unmodeled suppliers are not being asserted absent from OpenAI’s actual fleet. 

**Hourly cost: $2.60/$3.40/$4.50/$6.00 respectively [S8–S11, S15] — INFERENCE.** I select a long-term, dedicated-capacity regime from the public cloud relationships, the attachment’s committed/planning observations, and the higher on-demand comparables. The exact strategic discount is unmeasured. In particular, $4.50 GB200 and $6.00 GB300 are judgmental rates, not independently confirmed offers. Each includes accelerator, power, cooling, hosting, ordinary networking and host/control-plane allocation. There is no second power charge or separate 1.33-times infrastructure multiplier. Because I am pricing purchased capacity rather than claiming accelerator ownership, no owned-capex depreciation conversion is invoked. Raising all these rents 25%, alone, lowers central margin to **88.5%**.  

**Utilization: 70%, 65%, 75% [S8] — ASSUMED, without public measurement.** This is the fraction of paid capacity used productively for the modeled service after headroom, maintenance and scheduling slack—not matrix-FLOP utilization. Company scale makes substantial pooling plausible but does not prove occupancy. A standalone move to 55% gives **88.3%**; 85% gives **92.4%**.

**Efficiency: stack 1.10, 1.00, 1.15; lead zero [S13] — ASSUMED.** The central credit is a modest residual kernel/implementation advantage after the public baseline, not the full disclosed historical cost reduction. A 20% cost reduction corresponds to 1.25-times efficiency, but transferring that one-for-one from OpenAI’s report to Terra against a contemporary open baseline would be unjustified. I grant only 1.10 centrally. `trendMonths=0` and omitted `specDec` prevent duplicate credit. Removing the stack credit alone gives **89.9%**. 

**Traffic: 8:1 input/output, 65% physical and billable cache hits [S4, S5, S12, S14] — ASSUMED.** My working mix is text-heavy workspace assistance, coding/tool loops and retrieval, together with less reusable one-shot work. Repeated context plausibly makes input and prefix reuse substantial, but a specialized benchmark’s cached-token convention is not production telemetry. I choose less reuse than the older dive’s approximately 78% convention. Output includes billed reasoning; I do not add a second hidden-reasoning compute multiplier. 

**Cache writes and cache cost: 50% of fresh input; 5% of fresh-prefill cost for reads [S5, S15] — ASSUMED shares/costs.** Read and write tariffs are disclosed; the workload’s billed-write incidence is not. A fresh prefix can be written while other fresh tokens remain ordinary input, so neither zero nor 100% writes should be silently inherited. With no writes, central margin is **90.47%**; with all fresh tokens billed as writes, **91.14%**. Raising cache-read serving cost to 15% of fresh prefill gives **89.90%**. 

**Latency posture: balanced [S12, S15] — ASSUMED.** This denotes ordinary interactive serving, not purchased Fast processing or throughput-only Batch billing. The calculator does not enforce a latency service level, and the user-stream benchmark does not identify the actual scheduler batch.

## 5 — AGAINST THE CLAUDE OPUS 4.X REFERENCE.

The historical reference is **83.1% at list, selected span 68–92%**. Its current-engine counterpart is **82.33%**. I compare against that current number without revising the reference author’s earlier figure. Its fleet, prices, lead and occupancy are the supplied declared vector, not newly verified Anthropic measurements.   

The following is an **ordered arithmetic bridge**. Each row changes only the stated input or coupled input pair after the preceding row. Effects are order-dependent, not independent causal contributions.

| Change from the reference toward Terra | Approximate margin-point effect | Running margin |
|---|---:|---:|
| Current Opus reference | — | 82.33% |
| Tariff: $5/$25 to $2/$12; cache ratio stays 10% | −23.09 | 59.24% |
| Active parameters: 300B to 60B | +27.22 | 86.47% |
| Total parameters: 2.5T to 1.2T | +1.98 | 88.44% |
| Fleet: remove 40% TPU; increase H200 and GB200 shares | −1.06 | 87.38% |
| NVIDIA all-in rents: reference vector to my vector | −0.36 | 87.02% |
| Paid utilization: 65% to 70% | +0.93 | 87.94% |
| Efficiency: two-month lead/stack 1 to zero lead/stack 1.10 | −1.11 | 86.84% |
| Billed writes: zero to 50% of fresh input | +0.72 | **87.56%** |
| Input/output ratio: 15:1 to 8:1 | +2.99 | 90.55% |
| Physical and billed cache hits: 60% to 65% | +0.27 | **90.81%** |

The total-parameter effect appears while the bridge still contains the reference TPU leg; it should not be interpreted as a smooth 1.98-point total-size benefit on Terra’s final NVIDIA fleet. Precision, donor, cache-cost percentage, balanced posture and list-only billing otherwise remain unchanged.

**Reference traffic requires an explicit billing convention.** Re-running my central case at **15:1 and 60% cache hits**, with `billCacheHit` also set to **60**, gives approximately **87.56%**: about **5.23 points above** the current Opus reference. A literal traffic-only edit that retains central `billCacheHit=65` instead gives **86.82%**. Both are well-defined; the latter serves 60% from cache while discount-billing 65%, so it is not the same matched-cache comparison. The publishing leg should identify which it reports. Neither replaces the own-traffic headline.

The economics are therefore not simply “Terra is cheaper than Opus.” Its lower tariff is a large disadvantage, offset here by the **much smaller assumed active model**. It does not receive the reference’s deeply discounted TPU leg or its two-month efficiency prior.

## 6 — WHAT WOULD FALSIFY THIS ESTIMATE.

**The most valuable measurement is matched Terra aggregate throughput and paid GPU-hours at a stated context, cache policy and latency target.** It would jointly test the active-size proxy, geometry and scheduling assumptions. At the declared workload, central cost is approximately **$0.1974 per million aggregate tokens**. Demonstrated comparable all-in costs above **$0.4174/M** would push below this selected low-margin endpoint; below **$0.1186/M** would exceed its high-margin endpoint. These thresholds are arithmetic consequences of the $2.14889/M modeled billings, not public cost observations.

A disclosed **120B active** model, with all other central inputs unchanged, lowers the reading to approximately **83.6%**. A **35B active** disclosure raises it to **93.8%**. Thus active size remains the largest expressly varied architectural input, even though the scenario endpoints also change occupancy and residual efficiency.

A disclosure of substantially larger uncompressed attention/KV traffic would generally lower margin or force different batching and deployment width. Conversely, demonstrated selective low-bit serving, more effective KV compression, or larger latency-compliant batches could increase it. The direction of a calculator discontinuity caused by dropping an infeasible hardware leg must not be mistaken for economic improvement.

Actual strategic rents and paid occupancy would be the next most informative disclosures. The rent/utilization sensitivities in heading 4 show their isolated effects without imposing a particular company margin as a target.

Finally, the public-prefill calibration is a transfer assumption. A standalone **0.5–1.5-times prefill-cost sensitivity**, scaling cached-read cost with it, yields approximately **93.51–88.12%**, holding decode cost fixed. This diagnostic is not added to the selected span as an independent confidence interval.

## 7 — WHAT THE CALCULATOR COULD NOT EXPRESS, AND WHAT YOU COULD NOT ESTABLISH.

**Absolute context and its distribution.** The API’s short-price tier is not an 8,000-token workload. The model page supports a 1,050,000-token window and reprices requests above 272,000 input tokens; I am not estimating that whole context range. My assumed representative request has **8,000 input and 1,000 billed output tokens**. The calculator has no independent absolute-context control: its custom-traffic fallback uses a 1,000-token output length, deriving **8,500 mean decode context** and **9,000 peak live context** from 8:1. At Reference traffic these become 15,500 and 16,000. Cache reuse avoids repeated prefill; it does not make already-cached attention history disappear from decode. The relevant public [traffic-length implementation](https://github.com/AshitaOrbis/inference-margins/blob/main/site/engine-roofline-v22.js) was read **2026-09-25**.  

**Attention geometry and numerical formats.** `customDonor` does allow a categorical choice; what it cannot express is Terra’s unknown exact layer count, attention variants, sliding windows, expert routing, KV compression, or mixed precision by operation and accelerator. `dsr1` supplies frozen geometry only. The active/total values are mine. The span does not bound this structural uncertainty. Nor can a single global FP8 setting represent a fleet mixing FP8 and selective FP4 paths.

**Latency and deployment validity.** I could not establish concurrent requests per device, time-per-output-token under production load, accepted speculative tokens per verification step, or Terra’s actual expert-parallel layout. The reconstructed aggregate rates do not reproduce or validate the 79.9-token/second user stream. A policy-level memory fit is weaker than demonstrated end-to-end serving at that speed. Runtime workspace, fragmentation, cache-residency duration and heterogeneous context tails are also not measured here. The model’s unusual GB300 cost ordering remains a visible calibration limitation, not an adjusted input. 

**Allocation and cost scope.** No Terra-specific cloud, data-center, accelerator-generation or alternative-silicon allocation was established. The permitted hardware registry cannot represent every possible supplier. I also could not establish OpenAI’s realized transfer prices, paid-capacity occupancy, physical versus billable cache shares, or exact cache-write incidence. The hourly estimates include the defined infrastructure burden once. There is no company-level charge for training, research, sales, free users, support, or unbilled retries. Unallocated corporate reservations outside this modeled paid pool are not silently converted into a second utilization penalty.

**Earlier-file audit.** Attachment 06 supplies leads, not independently established facts. Its Terra **$2.50/$0.25/$15** tariff is superseded by the verified July 30 reduction. Holding this report’s costs and traffic fixed, the old tariff would produce **92.65%**, roughly **1.84 points too high** for today’s prices. Its price-based Terra size derivation is not adopted. Its 94% Sol verdict has a different model, tariff and cost construction and is not a target for this report.    

The same audit matters for infrastructure: the cited **3 GW inference** figure in OpenAI’s February announcement belongs to its **Vera Rubin expansion**, not proof of a commissioned 3 GW Terra-serving estate. I used the separate, explicit statement that Hopper and Blackwell systems were already operating. 

**Verification limits.** I found an API alias, not a verifiable immutable serving snapshot; current model-specific tariffs, but no Terra-specific absolute cost or margin disclosure; company infrastructure statements, but no model-specific fleet telemetry. The canonical English pricing extraction was incomplete for Terra, and the localized pricing row was available through the search index rather than a successful direct localized-page fetch. The live model page and dated price-cut announcement independently corroborated its tariff. MCP access failed, so all stated results are explicitly reconstructed and await the publishing leg’s exact-engine comparison—not concealed connector outputs.

**Bottom line:** publish **90.8% at list, span 80.6–94.5%**, as a low-confidence, declared-input serving-margin estimate. The verified tariff is strong evidence; the assumed active architecture is what makes the headline high.

Download the complete copy-of-record report (a file in the research run's own workspace, not published)