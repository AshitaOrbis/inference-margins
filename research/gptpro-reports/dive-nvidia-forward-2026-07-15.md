# GPT-5.6 Pro deep-dive: NVIDIA forward LLM serving economics (GB300 / Rubin)

# Public anchors for frontier NVIDIA LLM-serving economics

**Research cutoff: July 15, 2026.** All derived dollar-per-token figures below are my calculations from the cited throughput and hourly-price inputs.

## Executive finding

**GB300 NVL72 is now strongly throughput-anchored but remains market-price-unanchored.** MLPerf Inference v6.0 contains valid, reproducible, named-model GB300 results for DeepSeek-R1 at FP4, including a full-rack latency-constrained Interactive result, multiple Server results, and Offline saturation results. The strongest single-rack observations range from **250,634 generated tokens/s under the tight Interactive SLO** to **673,936 generated tokens/s Offline**. These are generated-output tokens, not input-plus-output totals. [cite: turn578695view0 turn578695view1]

**No numeric official public GB300 rental rate was found** on the public pricing pages checked for AWS, CoreWeave, Nebius, GCP, Azure, OCI, or Crusoe as of July 15, 2026. The providers either list the system without a rate, require contact with sales, or omit the price field. Thus, a direct public `GB300 rack throughput × actual GB300 rack rental price` anchor still does not exist. [cite: turn341554view0 turn341554view4 turn320368view2 turn320368view5 turn812928view0 turn812928view4]

**B300 does have a usable paired public anchor.** A Nebius eight-GPU B300 node submitted **60,413 generated tokens/s** on DeepSeek-R1 FP4 in MLPerf Server, while Nebius publicly lists B300 at **$7.85/GPU-hour on demand**. Pairing those yields approximately **$0.289 per million generated output tokens** before non-GPU serving costs. [cite: file turn57file0L6-L19] [cite: turn341554view5]

**Rubin remains absolute-economics-unanchored.** There are credible production-ramp signals and a named-workload relative claim, but no public absolute tokens/s, no public rack or GPU rental price, no MLPerf result, and no InferenceX result. NVIDIA's current claim is a relative one—up to **10× tokens/s/MW** and **one-tenth the cost per million tokens** versus GB200 NVL72 on Kimi-K2-Thinking at 32K input/8K output—not an absolute throughput or dollar anchor. [cite: turn204192view0 turn204192view2 turn199113view1 turn812928view6]

---

## 1. Throughput accounting: what the numbers actually mean

### MLPerf's token numerator is GENERATED output

For the DeepSeek-R1 benchmark, the reference SUT passes the number of generated tokens as `n_tokens` to MLPerf LoadGen. LoadGen then sums those output-token counts to calculate "Completed tokens per second." [cite: file turn10file0L215-L241] [cite: file turn6file0L88-L106]

Therefore:

- **MLPerf "tokens/s" = generated-output tokens/s.**
- Prompt prefill is still performed and consumes time and compute, so the result is an **end-to-end cost per generated token**, including the prompt-processing burden.
- It is **not** a decode-kernel-only measurement.
- It is **not** input tokens plus output tokens.

I use **GENERATED** below for this metric. I reserve **TOTAL** for input plus output.

### MLPerf scenarios are not interchangeable

- **Interactive:** aggregate high-concurrency serving under the tightest latency constraints: 1.5-second TTFT and 15-ms TPOT for DeepSeek-R1.
- **Server:** Poisson arrivals with looser 2-second TTFT and 80-ms TPOT constraints.
- **Offline:** saturation throughput with no interactive-serving latency SLO.

Server and Interactive are still aggregate batched-system results. They do not mean a single user receives hundreds of thousands of tokens per second. [cite: turn578695view1]

### InferenceX's headline throughput is TOTAL

InferenceX separately records total, input, and output throughput. Its headline `tput_per_gpu` is input-plus-output tokens divided by all participating GPUs. Its output-throughput metric is separate and, for disaggregated serving, is divided over the decode GPUs rather than the whole prefill-plus-decode allocation. [cite: file turn39file0L53-L69] [cite: file turn48file0L132-L165]

For a fixed 8K-input/1K-output workload: TOTAL tokens = 9 × output tokens.

Consequently, a reported cost of $0.07 per million **total** tokens corresponds mechanically to approximately $0.63 per million **output** tokens, assuming the exact 8:1 input/output ratio.

---

# 2. Dated performance claims

## 2026-04-01 — GB300 NVL72 has real MLPerf anchors

All of the following use **DeepSeek-R1 at FP4** on one 72-GPU GB300 NVL72 rack unless otherwise stated.

| Submitter and scenario | GENERATED output tok/s/rack | Arithmetic tok/s/GPU | Latency interpretation |
|---|---:|---:|---|
| NVIDIA Interactive | **250,633.67** | 3,481 | Tight latency-constrained serving |
| NVIDIA Server | **400,436.77** | 5,562 | Standard Server SLO |
| Nebius Server | **575,579.74** | 7,994 | Standard Server SLO; strongest submitted one-rack Server result found |
| NVIDIA Offline | **647,076** | 8,987 | Saturation; no latency SLO |
| Nebius Offline | **673,936** | 9,360 | Saturation; strongest submitted one-rack Offline result found |

The per-GPU column is simply rack throughput divided by 72. It is **not** a measurement of an isolated GB300 GPU.

Primary raw logs:

- [NVIDIA Interactive raw result](https://github.com/mlcommons/inference_results_v6.0/blob/main/closed/NVIDIA/results/GB300-NVL72_GB300-288GB_aarch64x72_TRT/deepseek-r1/Interactive/performance/run_1/mlperf_log_summary.txt)
- [NVIDIA Server raw result](https://github.com/mlcommons/inference_results_v6.0/blob/main/closed/NVIDIA/results/GB300-NVL72_GB300-288GB_aarch64x72_TRT/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt)
- [NVIDIA Offline raw result](https://github.com/mlcommons/inference_results_v6.0/blob/main/closed/NVIDIA/results/GB300-NVL72_GB300-288GB_aarch64x72_TRT/deepseek-r1/Offline/performance/run_1/mlperf_log_summary.txt)
- [Nebius Server raw result](https://github.com/mlcommons/inference_results_v6.0/blob/main/closed/Nebius/results/GB300-NVL72_GB300-288GB_aarch64x72_TRT/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt)
- [Nebius Offline raw result](https://github.com/mlcommons/inference_results_v6.0/blob/main/closed/Nebius/results/GB300-NVL72_GB300-288GB_aarch64x72_TRT/deepseek-r1/Offline/performance/run_1/mlperf_log_summary.txt)

The NVIDIA Interactive result met its 1.5-second TTFT and 15-ms TPOT thresholds; its measured 99th-percentile TTFT was about **492 ms** and 99th-percentile TPOT about **13.87 ms**. The submitted topology used **eight prefill GPUs and 64 decode GPUs**, FP4 model weights, disaggregated serving, and a configured maximum concurrency of 5,120. [cite: file turn19file0L6-L19] [cite: file turn19file0L35-L63] [cite: file turn52file0L3-L9] [cite: file turn52file0L23-L39]

The Nebius Server result met the 2-second/80-ms constraints with approximately **1.015 seconds 99th-percentile TTFT** and **77.88 ms 99th-percentile TPOT**. [cite: file turn12file0L6-L19] [cite: file turn12file0L35-L62]

**Source quality:** MLPerf Closed Division, valid result logs, public configurations and reproducible harness. This is the strongest public throughput evidence available.

**Anchor utility:** Excellent for `generated tok/s/rack`; insufficient by itself for `$ / token` because no public GB300 rental rate exists.

### The 2.49-million-tok/s headline is four racks, not one

NVIDIA's v6.0 headline of roughly **2,494,310 generated tokens/s Offline** and **1,555,110 generated tokens/s Server** used **four GB300 NVL72 racks, 288 GPUs total**. It is a scale-out result, not one-rack throughput. Any "per GPU" value from it is again an arithmetic division by 288. [cite: turn839898view0 turn839898view1 turn839898view3]

**Anchor utility:** Useful for scale-out efficiency and system scaling; inappropriate as a one-rack or isolated-GPU anchor.

### Benchmark vintage materially changes the result

In MLPerf v5.1, the same NVIDIA one-rack GB300 submission reported approximately **209,328 generated tokens/s Server** and **420,659 Offline**. In v6.0, NVIDIA reported 400,437 Server and 647,076 Offline—approximately **1.91×** and **1.54×** higher, respectively. [cite: file turn23file0L6-L19] [cite: file turn24file0L6-L14]

That makes "GB300 throughput" inseparable from benchmark date, serving stack, quantization recipe, and scheduling configuration. A forward model should retain the benchmark vintage rather than treating tokens/s as a fixed property of the silicon.

---

## 2026-04-01 benchmark + 2026-07-15 public price — B300 is the cleanest paired Blackwell Ultra anchor

Nebius submitted a valid eight-GPU B300 DeepSeek-R1 Server result of **60,413.44 generated tokens/s**. The configuration specifies FP4 model precision, FP8 KV cache, TP8, and the standard 2-second/80-ms Server constraints. [cite: file turn57file0L6-L19] [cite: file turn61file0L20-L38] [cite: file turn61file0L59-L77]

Nebius's public on-demand rate is **$7.85 per B300 GPU-hour**, making the eight-GPU node **$62.80/hour**. [cite: turn341554view5]

$62.80 × 10^6 / (60,413.44 × 3,600) = **$0.289 / M generated output tokens**

**Source quality:** Valid MLPerf result plus official provider list price. The benchmark and price come from the same provider, although this is not a production billing disclosure tying that exact benchmark run to an invoice.

**Anchor utility:** **Strongest presently available public standalone B300 cost-per-generated-token candidate.**

For comparison, the same construction for Nebius B200 gives:

- 51,692.89 generated tok/s on eight B200s.
- $7.15/GPU-hour, or $57.20/node-hour.
- **$0.307/M generated output tokens.**

Thus, in this one provider/benchmark pairing, B300 reduces the rental-derived hardware cost by only about **6%** relative to B200, despite a roughly 17% throughput improvement, because B300's hourly price is higher. [cite: file turn60file0L6-L19] [cite: file turn62file0L5-L23] [cite: turn341554view6]

---

## 2026-01-22 — Google publishes an unusually clean TOTAL-versus-GENERATED GB200 disclosure

Google Cloud reported a full 72-GPU A4X/GB200 NVL72 run of **DeepSeek-R1 at FP8**, 8K input/1K output, using SGLang and NVIDIA Dynamo:

- More than **6,000 TOTAL tokens/s/GPU**.
- **1,500 GENERATED output tokens/s/GPU**.
- Therefore approximately **108,000 generated output tokens/s per rack**.
- The throughput-oriented configuration did not publish an interactive latency SLO.
- A separate eight-GPU latency-oriented configuration achieved median 10-ms inter-token latency at concurrency four, but Google did not publish aggregate throughput for that configuration. [cite: turn752102view0]

**Source quality:** Hyperscaler production-oriented validated recipe, with model, precision, sequence lengths, topology, framework, and separate total/output figures disclosed.

**Anchor utility:** Strong operational cross-check on GB200. It lacks a public GCP A4X price and should not be mixed directly with MLPerf because its precision, fixed sequence lengths, software, and latency target differ.

The disclosure is also a useful warning: the **6,000 tok/s/GPU headline is TOTAL**, while the interactive-serving-relevant generated-output figure is only one quarter as large.

---

## 2025-10-24 — Azure's "1.2 million tok/s" GB200 claim is not an economic anchor

Azure reported **1.2 million tokens/s** for GPT-OSS 120B on ND GB200-v6 infrastructure. However, the post does not disclose whether that is total or generated throughput, the exact number of GPUs/racks, precision, input/output lengths, concurrency, or latency constraints. [cite: turn195724view0 turn195724view1]

**Source quality:** Production-oriented hyperscaler disclosure, but insufficiently specified.

**Anchor utility:** **Reject for cost-per-token modeling.** It can be retained only as a directional scale claim.

---

## 2026-05-27 — InferenceX provides a strong GB300 performance curve but an assumed price

SemiAnalysis/InferenceX measured **DeepSeek-V4-Pro 1.6T**, FP4, 8K input/1K output, Dynamo plus vLLM, disaggregated prefill/decode, and no speculative decoding on GB300 NVL72.

Its GB300 curve reached:

- **11,055.6 TOTAL tok/s/GPU** at 13.12 output tok/s/user and 77.83-ms TPOT.
- At a matched 27 output tok/s/user, **6,182 TOTAL tok/s/GPU** on GB300 versus 2,189 on GB200.
- The benchmark's published cost calculation uses **TOTAL input-plus-output tokens**, not generated tokens. [cite: file turn42file0L22-L35] [cite: file turn43file0L18-L29]

Primary source:

- [InferenceX: GB300 NVL72 versus GB200 NVL72 on DeepSeek-V4-Pro](https://inferencex.semianalysis.com/blog/gb300-nvl72-vs-gb200-nvl72-dsv4-pro-vllm-fp4), published May 27, 2026; measurements dated May 22, 2026.

The reported economics use approximately **$2.65/GB300 GPU-hour**. Critically, InferenceX's public source code labels the GB300 number as **temporary**, constructed as 1.2× the GB200 estimate until official pricing becomes available. The same registry assumes 2.12 kW of chip-plus-host/NIC power per GB300 GPU. [cite: file turn47file0L72-L94]

For a 72-GPU rack, those model assumptions imply:

- **$190.94/rack-hour**
- **152.6 kW** of modeled chip-plus-host/NIC power
- Neither is an observed rental rate or measured facility-level rack draw.

InferenceX publishes roughly **$0.07/M total tokens** near peak GB300 throughput. At the nominal 8K/1K mix, that translates mechanically to approximately **$0.60–$0.63/M generated output tokens**, not $0.07/M generated output.

**Source quality:** Strong third-party, open-source, reproducible performance evidence. Weak-to-medium pricing evidence because the price is explicitly provisional analyst TCO, not market rental.

**Anchor utility:** Good for the GB300 performance/latency Pareto frontier and scenario analysis. Do not treat its $/M figure as an observed cloud cost.

---

## NVIDIA's own GB300 serving claims

NVIDIA's current GB300 materials advertise projected DeepSeek-R1 performance for a 32K-input/8K-output workload, including approximately:

- 10× tokens/s/user versus Hopper.
- 5× tokens/s/MW.
- A combined "AI factory output" multiple of up to 50×.

These are explicitly vendor projections and relative multipliers; no absolute tokens/s, rack power, or hourly price is supplied. [cite: turn191680view0 turn191680view1 turn191680view2 turn191680view3]

**Source quality:** Vendor "up to" marketing claim.

**Anchor utility:** Not suitable for an absolute cost-per-token model. It may be used only as a relative upside scenario with a large uncertainty band.

---

# 3. Public Blackwell rental market

Prices below are the values displayed on providers' public pages as accessed **July 15, 2026**. They are not apples-to-apples: some are on-demand, some preemptible/spot, and AWS uses upfront Capacity Blocks.

| Provider | Public Blackwell rates | GB300 status |
|---|---|---|
| **AWS Capacity Blocks** | B200: **$12.355/GPU-h**; B300: **$14.04/GPU-h**; GB200 NVL72: **$761.904/rack-h**, or $10.582/GPU-h | No GB300 rate shown. Capacity Blocks are reserved/upfront, not ordinary on-demand. [cite: turn370942view0] |
| **CoreWeave** | B200: **$8.60/GPU-h on demand**; GB200: **$42/h per four-GPU instance**, or $10.50/GPU-h | GB300 four-GPU instance is quote-only. B300 on-demand is quote-only; B300 spot shown at **$4.48/GPU-h**. [cite: turn341554view0 turn341554view1 turn341554view2 turn341554view3] |
| **Nebius** | B200: **$7.15/GPU-h on demand**, $3.95 preemptible; B300: **$7.85 on demand**, $4.30 preemptible | GB200 and GB300 require contact with sales. [cite: turn341554view4 turn341554view5 turn341554view6] |
| **Lambda** | B200: approximately **$6.69–$6.99/GPU-h**, depending on allocation size | No public B300 or GB300 numeric rate. Large clusters are negotiated. [cite: turn341554view7] |
| **RunPod** | B200 Pod: **$5.89/GPU-h**; B300 Pod: **$7.39/GPU-h**; higher serverless worker rates also listed | No GB300 NVL72 rack rate. [cite: turn160105view0] |
| **Hyperstack** | B200: **$6.00/GPU-h on demand**, **$5.10 reserved** | No numeric B300 or GB300 rate. The page's B200 memory description appears inconsistent with standard B200 specifications, reducing source quality. [cite: turn320368view0] |
| **Crusoe** | B200 and GB200 capacity exposed as contact-sales products | No numeric GB300 rate on the checked price page. [cite: turn320368view2 turn320368view3 turn320368view4] |
| **GCP** | A4X Max documentation identifies a four-GPU GB300 bare-metal instance and 18-instance/72-GPU NVL72 domain | No numeric A4X Max/GB300 rate on the public compute-price page; capacity reservation required. [cite: turn812928view0 turn812928view1 turn812928view2 turn812928view3] |
| **Azure** | GB300/B300 infrastructure announcements and product references exist | No numeric GB300/B300 rate found on the public Linux VM pricing page. [cite: turn812928view4 turn812928view5] |
| **OCI** | Public price list names B200, B300, GB200 and `BM.GPU.GB300.4` shapes | Retrieved public table did not populate numeric prices for those entries. [cite: turn320368view5 turn320368view6 turn320368view7] |

### Rack-level interpretation

CoreWeave's $42/hour GB200 product is a **four-GPU NVL72 node**, not a quoted whole rack. Multiplying by the 18 nodes in an NVL72 domain gives **$756/rack-hour**, but that is my arithmetic, not an explicit rack contract quote.

AWS is the cleanest explicit full-rack market datum: **$761.904/GB200 NVL72 rack-hour**.

There is no corresponding public GB300 figure.

---

# 4. Derived public cost-per-token anchors

The calculation is: C_output = (system dollars/hour × 10^6) / (generated output tokens/second × 3,600)

## Fully or mostly market-priced candidates

| Platform | Model/scenario | Price basis | GENERATED throughput | Derived $/M output | Assessment |
|---|---|---:|---:|---:|---|
| B200, eight GPUs | DeepSeek-R1 FP4, Nebius MLPerf Server | $57.20/node-h | 51,692.89 tok/s | **$0.307** | Strong node anchor |
| B300, eight GPUs | DeepSeek-R1 FP4, Nebius MLPerf Server | $62.80/node-h | 60,413.44 tok/s | **$0.289** | Strongest B300 anchor |
| GB200 NVL72 | DeepSeek-R1 FP4, MLPerf Interactive | $761.904/rack-h, AWS | 240,318 tok/s | **$0.881** | Latency-constrained rack bridge |
| GB200 NVL72 | DeepSeek-R1 FP4, MLPerf Server | $761.904/rack-h, AWS | 336,106 tok/s | **$0.630** | High-concurrency Server |
| GB200 NVL72 | DeepSeek-R1 FP4, MLPerf Offline | $761.904/rack-h, AWS | 486,141 tok/s | **$0.435** | Saturation lower bound |

The GB200 throughputs are the NVIDIA MLPerf v6.0 full-rack results. [cite: file turn18file0L11-L17] The AWS price is an official Capacity Block rate rather than ordinary on-demand pricing. [cite: turn370942view0]

These are **rental-derived compute costs**, not bare-metal owner TCO. They include the infrastructure provider's capex, energy, operations, and margin to whatever extent those are embedded in its rate, but exclude the model server's own storage, networking, orchestration, engineering, failover reserve, idle capacity, and other operating costs.

## GB300 price sensitivity: the most defensible current representation

Because there is no public rack price, the cleanest GB300 model is to expose cost as a function of rack-hour price.

| GB300 scenario | GENERATED tok/s/rack | $/M output for each $100/rack-h | Rack-hour price consistent with $0.10/M output |
|---|---:|---:|---:|
| NVIDIA Interactive | 250,633.67 | **$0.1108** | **$90.23/h** |
| Nebius Server | 575,579.74 | **$0.0483** | **$207.21/h** |
| Nebius Offline | 673,936 | **$0.0412** | **$242.62/h** |

Equivalently (C = dollars per million generated output tokens, P = GB300 rack-hour price):

- C_GB300, Interactive = 0.0011083 × P_rack-hour
- C_GB300, Server = 0.0004826 × P_rack-hour
- C_GB300, Offline = 0.0004122 × P_rack-hour

This is the recommended GB300 implementation until an actual rate becomes public.

### Analyst-TCO scenario, not a market anchor

Applying SemiAnalysis's temporary **$190.944/rack-hour** model assumption to the MLPerf results gives:

- Interactive: approximately **$0.212/M generated output**.
- Nebius Server: approximately **$0.092/M generated output**.
- Nebius Offline: approximately **$0.079/M generated output**.

These are useful scenarios, but they should be tagged in the model as:

> **Analyst estimated TCO; temporary 1.2× GB200 pricing assumption; not public rental price.**

---

## Margin-at-list-price formulation

For a service charging separate input and output prices, the relevant hardware-only margin is:

margin = 1 − C_output / (P_output + r·P_input)

where C_output is the infrastructure cost per million generated tokens from the tables above; P_output is the output list price per million tokens; P_input is the input list price per million tokens; and r is input tokens divided by generated output tokens.

Because MLPerf's output-token cost already includes the work of processing its prompts, ignoring input-token revenue gives a conservative output-only margin: 1 − C_output / P_output.

For the B300/Nebius anchor of $0.289/M:

| Output list price | Hardware/rental-only output margin |
|---:|---:|
| $1/M | 71.1% |
| $2/M | 85.6% |
| $5/M | 94.2% |

These are not full gross margins: serving software, networking, idle reserve, reliability overhead, storage, orchestration, and company operating costs remain excluded.

---

# 5. GB300 power evidence

The submitted NVIDIA MLPerf system identifies **1,400 W GPU TGP per GB300**, implying 72 × 1.4 kW = **100.8 kW**.

That is an **accelerator-only nameplate sum**, not the electrical draw of a complete NVL72 rack. It excludes Grace CPUs, NVLink switches, networking, storage, power-conversion losses, and cooling. [cite: file turn50file0L3-L19] [cite: file turn50file0L33-L50]

SemiAnalysis's public TCO registry instead uses **2.12 kW per GPU** including a modeled per-GPU share of host and NIC power, or approximately **152.6 kW per rack**. That is an analyst model input, not a measured rack-power disclosure, and may still differ from facility draw after PUE. [cite: file turn47file0L83-L94]

**Negative finding:** I found no public, measured GB300 NVL72 wall-power trace paired with an LLM inference run. Thus there is no audited public `generated tokens / joule` anchor for the entire rack.

---

# 6. Rubin: exactly what is public

## 2026-03-16 — production-ramp signal

NVIDIA states that the seven-chip Vera Rubin platform is **in full production** and that partner systems from hyperscalers and neoclouds are expected in the **second half of 2026**. The current primary rack-scale product is **Vera Rubin NVL72**, consisting of 72 Rubin GPUs and 36 Vera CPUs. [cite: turn204192view0 turn204192view1 turn204192view2]

**Source quality:** Vendor production and availability statement. Stronger than an analyst roadmap, but still forward-looking for customer availability.

**Anchor utility:** Useful for ramp timing and probability-of-availability, not for economics.

## Named-model relative claim

NVIDIA's current Vera Rubin product page provides more detail than the original press-release headline. Its relative inference claim is based on:

- **Kimi-K2-Thinking**
- 32K input tokens
- 8K output tokens
- Vera Rubin NVL72 versus GB200 NVL72
- Up to **10× tokens/s/MW**
- Approximately **one-tenth cost per million tokens**

However, NVIDIA publishes no absolute tokens/s, no measured or modeled power number, no hourly cost input, no concurrency, no TTFT/TPOT target, and no reproducible benchmark recipe. The page also characterizes specifications and performance as subject to change. [cite: turn199113view1 turn199113view2 turn812928view6 turn812928view7]

**Source quality:** Named-workload vendor projection.

**Anchor utility:** Relative scenario only. It cannot determine absolute Rubin $/token.

## Preliminary peak specifications

NVIDIA lists preliminary "up to" system specifications such as approximately:

- 3,600 PFLOPS NVFP4 per rack.
- 20.7 TB aggregate HBM4.
- 1,580 TB/s aggregate memory bandwidth.

These are peak specifications, not serving throughput. Converting them to tokens/s would require assumptions about active parameters, sparsity, KV-cache behavior, batch size, utilization, communication overhead, and prefill/decode allocation. [cite: turn199113view2]

**Anchor utility:** Capacity constraints and theoretical ceiling only; reject for direct cost-per-token estimation.

## MLPerf and independent benchmarking status

- No Rubin, Vera Rubin, `VR200`, or Rubin GPU submission was found in the public MLPerf Inference v6.0 results.
- InferenceX's public hardware list labels **Vera Rubin NVL72** and **Rubin NVL8** as "Coming Soon," rather than supported hardware with results. [cite: file turn33file0L51-L71]
- No public Rubin hourly rental, preorder rate, Capacity Block rate, or reservation price was found.
- No public production disclosure pairs Rubin absolute output throughput with a workload price.

**Finding:** Rubin has credible ramp evidence but **zero public absolute economic anchors**.

## NVL144, Rubin CPX, Rubin Ultra, R100 and VR200

NVIDIA's older September 2025 Rubin CPX announcement referred to a future **Vera Rubin NVL144 CPX** configuration. That should not be treated as the same product as the current regular Vera Rubin NVL72 platform. It was a roadmap configuration for massive-context workloads and did not disclose absolute named-model tokens/s or a price.

As of the research cutoff:

- **Vera Rubin NVL72** is the current official rack-scale name.
- **Rubin NVL8** appears in third-party forward hardware lists but has no public result.
- **R100** and **VR200** appear primarily as analyst shorthand; I found no current NVIDIA product page establishing them as the official commercial SKU names.
- **Rubin Ultra** remains roadmap-level nomenclature for this economic model: no absolute named-model throughput, MLPerf result, rental rate, or public rack TCO was found.

The model should therefore avoid mapping NVL144, NVL72, Rubin CPX, Rubin NVL8, R100/VR200, and Rubin Ultra into one generic "Rubin" performance number.

---

# 7. Precisely scoped negative results

1. **GB300 throughput is public.** Any statement that GB300 has no public serving benchmark is now incorrect: MLPerf v5.1 and v6.0 and InferenceX all contain named-model results.

2. **GB300 market pricing is not public among the major official providers checked.** No numeric full-rack or per-GPU GB300 rental rate was found on AWS, CoreWeave, Nebius, GCP, Azure, OCI, or Crusoe public pricing pages as of July 15, 2026.

3. **GB300 full-rack measured power is not public.** The 100.8-kW figure is merely 72 times the submitted GPU TGP; the 152.6-kW figure is an analyst model.

4. **Rubin has no public absolute named-model throughput.** NVIDIA provides relative named-workload projections, but no tokens/s value that can be multiplied by a price.

5. **Rubin has no public rental or purchase-rate anchor.** Availability forecasts and "full production" statements do not provide `$ / GPU-hour` or `$ / rack-hour`.

6. **Rubin Ultra is economically unanchored.** No public MLPerf result, independent benchmark, price, or measured power/performance record was found.

7. **Peak FLOPS must not be used as a substitute.** Without realized utilization and workload-specific prefill/decode behavior, a FLOPS-to-tokens conversion would create false precision.

---

# Recommended model treatment

For a quantitative forward model, I would encode the platforms as follows:

- **B200:** use the Nebius same-provider MLPerf-plus-price anchor, with public-cloud price sensitivity around it.
- **B300:** use **$0.289/M generated output tokens** as the primary current node-scale public anchor, with explicit utilization and non-GPU cost adjustments.
- **GB200 NVL72:** use the AWS-rack/MLPerf combinations as rack-scale bridge cases: **$0.881 Interactive, $0.630 Server, $0.435 Offline per million generated tokens**.
- **GB300 NVL72:** use the three audited throughput observations and keep `rack $/hour` as an explicit model variable. Do not promote SemiAnalysis's temporary $190.94/rack-hour assumption to observed pricing.
- **Vera Rubin:** keep absolute $/token unset. Model only relative scenarios versus GB200 or GB300, with a low-confidence flag and a wide range.
- **Rubin Ultra:** leave unanchored rather than extrapolating from preliminary PFLOPS.

---

# Five most load-bearing sources

1. **MLPerf Inference v6.0 GB300 raw results and release, April 1, 2026.** [MLCommons v6.0 release](https://mlcommons.org/2026/04/mlperf-inference-v6-0-results/); [NVIDIA GB300 Interactive log](https://github.com/mlcommons/inference_results_v6.0/blob/main/closed/NVIDIA/results/GB300-NVL72_GB300-288GB_aarch64x72_TRT/deepseek-r1/Interactive/performance/run_1/mlperf_log_summary.txt); [Nebius GB300 Server log](https://github.com/mlcommons/inference_results_v6.0/blob/main/closed/Nebius/results/GB300-NVL72_GB300-288GB_aarch64x72_TRT/deepseek-r1/Server/performance/run_1/mlperf_log_summary.txt). These establish the strongest public GB300 generated-throughput anchors. [cite: turn578695view0 turn578695view1]

2. **MLPerf DeepSeek SUT and LoadGen source code.** [DeepSeek-R1 SUT](https://github.com/mlcommons/inference/blob/master/language/deepseek-r1/mlperf/offline_sut.py); [LoadGen results implementation](https://github.com/mlcommons/inference/blob/master/loadgen/results.cc). These prove that the published token numerator is generated output rather than total input-plus-output. [cite: file turn10file0L215-L241] [cite: file turn6file0L88-L106]

3. **Official AWS and Nebius public pricing.** [AWS EC2 Capacity Blocks pricing](https://aws.amazon.com/ec2/capacityblocks/pricing/); [Nebius pricing](https://nebius.com/prices). These supply the strongest public B200/B300/GB200 dollar-per-hour inputs. [cite: turn370942view0 turn341554view5 turn341554view6]

4. **SemiAnalysis InferenceX GB300 NVL72 benchmark and public economic-model code, May 2026.** [GB300 versus GB200 on DeepSeek-V4-Pro](https://inferencex.semianalysis.com/blog/gb300-nvl72-vs-gb200-nvl72-dsv4-pro-vllm-fp4). This is the strongest independent GB300 performance/latency curve, while its code reveals that the GB300 price is explicitly temporary. [cite: file turn43file0L3-L29] [cite: file turn47file0L72-L94]

5. **NVIDIA Vera Rubin announcement and current product page, March–July 2026.** [Vera Rubin platform announcement](https://nvidianews.nvidia.com/news/nvidia-vera-rubin-platform); [Vera Rubin NVL72 product page](https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/). These establish what is genuinely public for Rubin: production/ramp claims, current NVL72 topology, preliminary specifications, and relative Kimi-K2-Thinking efficiency claims—but no absolute economic anchor. [cite: turn204192view0 turn204192view2 turn199113view1 turn199113view2]


---

## How this artifact was collected

*Moved here from above the answer by the 2026-09-09 release edit: GPT Pro session 3 reported that these pages put collection metadata before the finding, so a reader met request ids and dispatcher notes before the result. Nothing below is changed — it is the same block, at the foot.*


| Field | Value |
|---|---|
| **Model** | `gpt-5-6-pro` (confirmed via check() `model_slug`, `is_pro: true`) |
| **Date** | 2026-07-15 |
| **Dive title** | NVIDIA forward serving economics — Blackwell-Ultra (GB300) + Rubin (Round 2 — dive 5) |
| **Conversation ID** | `6a581784-0498-83e8-8b33-0f2976e71ba5` |
| **Conversation URL** | archived privately |
| **Request ID** | `req_1784158082704_k7uqxx` |
| **Completion** | `complete` at elapsed `53m11s`; `completion_path: api`; project `Ashitaorbis` confirmed |
| **Commissioned** | by owner 2026-07-15, round 2 (follow-on to the "Targeted 4"). NVIDIA's HISTORICAL/Hopper side is already the site's best-anchored platform (DeepSeek H800 disclosure); this dive targets the FORWARD side only. |

## Provenance

- Full structured report emitted well inside the 120-minute cap (completed at ~53 min). No timeout;
  this is the complete requested report, not a reasoning-summary.
- The raw `check()` API response was prefixed by the model's own 829-char reasoning synopsis (the same
  text seen live during polling: "I'll separate audited benchmarks... SemiAnalysis's GB300 economics use
  a provisional 1.2× GB200 cost uplift..."). That preamble is preserved verbatim in the collapsed note
  below; the full report proper begins at the "# Public anchors..." heading.
- **Citation normalization:** the API read returned ChatGPT's internal web.run/file reference tokens with
  their private-use-unicode delimiters stripped, leaving bare concatenated strings (`citeturn…view…`,
  `fileciteturn…file…L…`). These are normalized here to readable `[cite: …]` markers with the raw token
  ids **preserved** (not re-split beyond the `cite`/`filecite` prefix, to avoid mis-parsing concatenated
  runs). Resolve them via the conversation URL above or the inline markdown source links — most claims
  also carry a direct URL in-text and in the "Five most load-bearing sources" list. Report text is
  otherwise verbatim; numeric figures untouched.
- **Provenance routing:** any site change this dive justifies enters through `research/update-queue.md`
  (Q-AUTO items), never via direct edits to the site/engine/annex/tracked numbers.

<details><summary>Dispatched prompt (verbatim)</summary>

```
You are conducting a rigorous source-hunting deep dive for a quantitative model of frontier-LLM inference serving economics (cost per token, and margin at list prices). I need the strongest available PUBLIC quantitative anchors for the FORWARD side of NVIDIA's LLM inference/serving economics — Blackwell-class and Rubin-class silicon — or a rigorous, well-documented finding that no such public anchor exists. NVIDIA's HISTORICAL side (H100/H800/H200/Hopper, e.g. via the DeepSeek H800 fleet disclosure) is already well-anchored in the model; DO NOT re-derive Hopper economics. Target the current and next generation.

SCOPE:
- Blackwell-class inference silicon used for LLM *inference/serving*, not training: B200, B300 (Blackwell Ultra), GB200 NVL72, GB300 NVL72. Then Rubin-class: R100/Rubin, VR200/Vera Rubin, Rubin NVL144, and any Rubin Ultra signals.
- Published inference throughput on frontier-class models, expressed wherever possible as tokens/sec/chip (or per GPU / per NVL72 rack / per node) on a NAMED model at a NAMED precision (FP8/FP4/NVFP4): MLPerf Inference v5.x and (critically) v6.0+ submissions on Blackwell/Blackwell-Ultra; NVIDIA's own published serving claims (GB200/GB300 NVL72 on DeepSeek-R1, Llama 3.1 405B, Llama 2 70B, etc.; TensorRT-LLM / Dynamo disaggregated-serving benchmarks); and third-party or production reports (SemiAnalysis, InferenceX, Baseten, Fireworks, Together, hyperscaler blogs). Distinguish clearly between marketing "up to" figures and audited/reproducible ones.
- The rental / TCO market for these chips: hyperscaler on-demand + committed list prices for B200/B300/GB200/GB300 instances (AWS, Azure, GCP, OCI) where published; and neocloud pricing — CoreWeave, Lambda, Crusoe, TensorWave, Nebius, and comparable — for Blackwell-class capacity ($/GPU-hour on-demand and reserved). Note where a rack-scale unit (GB200/GB300 NVL72) is priced only as a whole system.
- GB300 NVL72 economics specifically: per-rack throughput claims, per-rack price or $/GPU-hour, power draw, and any derived $/token or $/M-token figures — from NVIDIA, hyperscalers, neoclouds, or analysts (SemiAnalysis rack-economics models especially).
- Rubin ramp signals: production/availability timelines (tape-out, sampling, volume), any early pricing signals or pre-order/reservation rates, MLPerf or vendor throughput previews, and TCO/perf-per-watt claims vs Blackwell. Rubin is currently a LOW-CONFIDENCE, effectively unanchored platform in the model — precision about what is genuinely public vs vendor roadmap vs analyst speculation matters more than breadth.

GOAL: candidate quantitative anchors for cost-per-token on GB300 (Blackwell Ultra rack-scale) and on Rubin — ideally (tokens/sec/chip or per-rack on a named model at a named precision) paired with ($/GPU-hour or $/rack-hour) so a $/token can be derived — OR rigorous, precisely-scoped negative results where only peak FLOPS, marketing "up to" numbers, or roadmap dates exist. For GB300, I especially want to know whether any audited (MLPerf) or reproducible named-model serving throughput exists yet, and whether any real rental price is public. For Rubin, I want to know exactly how much is real public data vs roadmap.

CRITICAL METHODOLOGICAL REQUIREMENT: Wherever a tokens/sec figure appears, distinguish TOTAL throughput (prefill + decode, often prefill-dominated at long input lengths and high concurrency) from GENERATED / DECODE throughput (the interactive-serving-relevant number). Vendors routinely headline total or maximum-concurrency throughput that is not usable for interactive serving; call this out explicitly for every throughput claim. Also flag when a per-GPU figure is actually a per-rack figure divided by 72, and whether the workload is a saturation/offline run vs a latency-constrained one.

Structure your findings as dated claims. For each: the claim, primary source (URL + date), your assessment of source quality (vendor claim / third-party benchmark / production disclosure / analyst estimate), and whether it could serve as a quantitative anchor (tokens/sec/chip, $/hr, $/token). Distinguish TOTAL vs GENERATED (decode) throughput wherever a tok/s figure appears. If no public anchor exists, say so explicitly as a finding — a rigorous negative result is wanted. End with a numbered list of your 5 most load-bearing sources.
```
</details>

<details><summary>Model reasoning synopsis (verbatim preamble, preserved)</summary>

> I'll separate audited benchmarks, reproducible vendor results, production disclosures, pricing, and roadmap signals, pairing compatible anchors while testing explicit negative cases for GB300 and Rubin.
>
> MLPerf v6.0 provides audited single-rack GB300 anchors: 575,580 generated tok/s under Server latency limits and 673,936 offline. I'm reconciling repository results with NVIDIA's differing headline figures.
>
> Public pricing brackets B200 at $5.9–$8.6/GPU-hour and B300 at $7.4–$7.9, but GB300 remains quote-only. Rubin is reportedly in production yet lacks public benchmarks or pricing.
>
> MLPerf's metric is end-to-end generated-output throughput, including prefill cost, on a long-output 800/3,880-token workload. SemiAnalysis's GB300 economics use a provisional 1.2× GB200 cost uplift and input-plus-output token denominators.

</details>

---
