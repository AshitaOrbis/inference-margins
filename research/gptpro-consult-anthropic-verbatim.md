# GPT-5.6 Pro Anthropic consult — VERBATIM (recovered original)

> The complete, unedited response of the original Anthropic margin consultation (req_1783636621475, 54m21s, `gpt-5-6-pro`, Pro-verified, 2026-07-09; conversation archived privately).
> **Provenance:** recovered 2026-07-11 from the session transcript that received it — these are the original bytes as returned by the API, not a regeneration. `citeturn…` tokens are ChatGPT-internal citation markers and are preserved as received.
> **SHA-256 (response body below this header):** `16ea77207011d5c7a65e78bc82b483d187c415ba5e5742befb7d7e3a2ec51f50`
> The [adopted-findings summary](gpt-pro-full-response.html) distills what the site uses; where they differ, the site's §6 states the adopted value.

---

I’ll verify the four source threads, build a transparent token-cost model, benchmark accelerator generations, and reconcile marginal economics with reported margins while distinguishing facts from assumptions.

Early corrections: DeepSeek’s 545% return-on-cost equals 84.5% margin, and Musk suggested ~5T total Opus parameters. GLM-5.2 and the 5× GB300 DeepSeek-V4 result were separate benchmarks.

InferenceMAX is now InferenceX, and headline gains combine silicon with precision, expert parallelism, speculative decoding, and software. I’ll separately bridge busy-chip cost, loaded serving, COGS, and subscription dilution.

Matched-latency calibration gives central Opus serving costs of $0.47/M input and $1.68/M output, implying 90.6% and 93.3% margins; GB300 metal-level output margins approach 98%.

# Marginal economics of serving Claude tokens

**As of July 9, 2026, my central estimate is that Anthropic earns roughly 91% marginal serving margin on uncached Opus input tokens and 93% on Opus output tokens at standard API list prices.** On a well-optimized GB300 deployment, I estimate about **94% on both input and output**. For Sonnet, the central figure is approximately **92% input/94% output at today’s promotional $2/$10 pricing**, or **95%/96% at the normal $3/$15 price**.

Those figures use an **economic marginal cost**: accelerator opportunity cost, realistic utilization, networking/CPU overhead, and production redundancy—but not training, research, sales, or corporate overhead. They are not the instantaneous electricity cost, which would imply margins above 99.8%.

## Executive results

| Model and serving basis | List price, input/output | Modeled cost per M input | Input margin | Modeled cost per M output | Output margin |
|---|---:|---:|---:|---:|---:|
| **Opus 4.x, illustrative Anthropic fleet** | $5 / $25 | **$0.47** | **90.6%** | **$1.68** | **93.3%** |
| **Opus 4.x, GB300 NVL72** | $5 / $25 | **$0.31** | **93.8%** | **$1.44** | **94.2%** |
| **Opus 4.x, TPU v7 at estimated Anthropic contract economics** | $5 / $25 | **$0.24** | **95.1%** | **$0.70** | **97.2%** |
| **Sonnet 5, fleet, promotional price through Aug. 31** | $2 / $10 | **$0.16** | **92.2%** | **$0.56** | **94.4%** |
| **Sonnet, fleet, normal price** | $3 / $15 | **$0.16** | **94.8%** | **$0.56** | **96.3%** |
| **Sonnet 5, GB300, promotional price** | $2 / $10 | **$0.10** | **94.8%** | **$0.48** | **95.2%** |

Current standard pricing is $5/M input and $25/M output for Opus 4.5–4.8. Sonnet 5 is temporarily $2/$10 through August 31, 2026, and becomes $3/$15 on September 1; Sonnet 4.5/4.6 is already $3/$15. Cache hits cost 10% of standard input pricing, while Batch API work is discounted 50%. [Anthropic pricing documentation](https://platform.claude.com/docs/en/about-claude/pricing). citeturn779069view3turn357881view7

My defensible uncertainty ranges are:

| Margin at standard list prices | Point estimate | Plausible range |
|---|---:|---:|
| **Opus uncached input** | **90.6%** | **85–95%** |
| **Opus output** | **93.3%** | **88–97%** |
| **Sonnet input at $2 promotional price** | **92.2%** | **88–97%** |
| **Sonnet output at $10 promotional price** | **94.4%** | **91–98%** |
| **Sonnet input at $3 normal price** | **94.8%** | **92–98%** |
| **Sonnet output at $15 normal price** | **96.3%** | **94–99%** |

The key qualification is procurement: at public hyperscaler on-demand or reservation prices rather than strategic, fleet-scale economics, Opus’s margin can be only **55–85% on input and 63–91% on output**. Thus “90–95%” is reasonable for an optimized, negotiated marginal deployment—not for every token running on every cloud instance.

---

# 1. Verification of the four evidence threads

## 1.1 DeepSeek’s “545%” disclosure

The primary source is DeepSeek’s final Open Source Week post, [“One More Thing: DeepSeek-V3/R1 Inference System Overview”](https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md).

For the 24 hours ending February 28, 2025, DeepSeek reported:

- Average occupancy of **226.75 eight-H800 nodes**, or 1,814 H800s.
- Assumed cost of **$2 per H800-hour**.
- Total daily accelerator cost of **$87,072**.
- **608 billion input tokens**, including 342 billion cache hits.
- **168 billion output tokens**.
- Theoretical revenue of **$562,027** at then-current R1 prices.
- The phrase “cost-profit margin of 545%.”
- A warning that actual revenue was materially lower because of free services, discounted periods, V3 traffic, and other factors. citeturn380934view0turn779069view0

The arithmetic is:

\[
\text{Profit/cost}
  =\frac{562{,}027-87{,}072}{87{,}072}
  =545.5\%
\]

But conventional gross margin is:

\[
\text{Gross margin}
  =\frac{562{,}027-87{,}072}{562{,}027}
  =84.5\%
\]

So **545% was a return-on-cost ratio, not a 545% gross margin**. A 545% markup on cost corresponds to an 84.5% margin.

DeepSeek also disclosed phase-specific throughput of about **73,700 input tokens/s per eight-GPU node** or **14,800 output tokens/s per node**. That gives useful accelerator-time calibrations:

\[
\text{Output throughput per H800}
 = \frac{14{,}800}{8}
 =1{,}850\ \text{tokens/s}
\]

\[
\text{Busy-H800 cost/M output}
 = \frac{\$2}{1{,}850\times3{,}600}\times10^6
 = \$0.30
\]

And, including the reported cache-hit workload:

\[
\text{Busy-H800 cost/M effective input}
 =\frac{\$2}{(73{,}700/8)\times3{,}600}\times10^6
 \approx \$0.06
\]

These are **phase-capacity accelerator costs**, not fully loaded costs. They omit slack capacity, CPUs, networking, storage, reliability replicas, and the fact that DeepSeek’s model architecture, pricing, interactivity, and output lengths differ from Claude. Still, they make sub-$1/M raw token costs entirely credible for an efficient MoE.

DeepSeek-V3 itself has **671B total parameters but only 37B activated per token**, an important reason its inference is inexpensive. [DeepSeek-V3 technical report](https://arxiv.org/abs/2412.19437). citeturn735447view3

### Conclusion on thread 1

The evidence is genuine and highly relevant, but the correct takeaway is:

> DeepSeek demonstrated approximately **84.5% theoretical gross margin** at exceptionally low API prices, under a hypothetical full-revenue assumption—not 545% gross margin.

That is strong circumstantial support for very high margins at Claude’s much higher list prices.

---

## 1.2 Elon Musk’s Claude parameter-count claim

The underlying [X post is here](https://x.com/elonmusk/status/2042123561666855235). A readable transcription is in [36Kr’s report](https://eu.36kr.com/en/p/3760679047267075).

Musk said:

> “The total parameter count is 0.5T … half the parameter count of Sonnet and one-tenth of Opus.”

That implies:

- **Sonnet: approximately 1 trillion total parameters**
- **Opus: approximately 5 trillion total parameters**

It is explicitly a claim about **total**, not active, parameters. Anthropic has not publicly confirmed either number. citeturn779069view1turn374708view0

So the attribution in the question needs reversing: Musk did **not** claim Opus was surprisingly small. He claimed an unusually large total parameter count. The economically relevant possibility is that **only a small fraction of those parameters is active for each token**.

Two pieces of evidence warrant caution:

1. A July 2026 revision of the “incompressible knowledge probes” methodology reports good aggregate parameter-estimation performance across open models but still has a roughly **threefold 90% error range in each direction** for individual estimates. [IKP paper](https://arxiv.org/abs/2604.24827). citeturn735447view1
2. An independent methodological re-analysis argues that exact closed-model parameter estimates are highly sensitive to assumptions and obtains an Opus 4.7 estimate nearer **1.1T total**, again with substantial uncertainty. [Critical re-analysis](https://www.lesswrong.com/posts/veFMEzDDyWaer2Sms/sanity-checking-incompressible-knowledge-probes). citeturn735447view2

### My architectural interpretation

For the cost model I use:

| Model | Total-parameter base case | Active parameters/token | Sensitivity range |
|---|---:|---:|---:|
| **Opus 4.x** | 5T | **300B** | 150–600B active |
| **Sonnet** | 1T | **100B** | 60–200B active |

The 300B Opus assumption means approximately 6% of the 5T total is activated. That activation ratio is similar to two disclosed frontier open MoEs:

- DeepSeek-V3: **37B active / 671B total = 5.5%**
- GLM-5.2: **40B active / 744B total = 5.4%**. [GLM-5.2 architecture and Baseten implementation](https://www.baseten.co/blog/how-we-built-the-worlds-fastest-api-for-glm-52/). citeturn735447view3turn380934view3

This is an assumption, not a claim about Claude’s actual architecture.

A useful sanity check is that a genuinely **dense 5T-active** Opus would cost approximately 16.7 times more to run than my 300B-active base case. Its modeled fleet output cost would exceed $28/M before some additional overhead—above the current $25/M list price. Therefore, if Musk’s 5T total figure is approximately right, Opus almost certainly must be highly sparse, heavily quantized, or otherwise avoid activating anything close to all 5T weights per token.

### Memory implication

A 5T model requires roughly:

- **5 TB of weight storage at FP8**
- **2.5 TB at FP4**

Weights alone therefore require approximately 63 H100s at FP8, 36 H200s at FP8, 14 GB200s at FP4, or nine GB300s at FP4, before KV cache and operating headroom. This is why the 72-GPU NVLink domain matters independently of raw FLOPS.

---

## 1.3 The purported “Numina Code / GLM-5.2 on GB300” result

I could not locate a primary source matching all three elements—**Numina**, **GLM-5.2**, and **GB300**. The recollection appears to combine two separate June 2026 results.

### Result A: DeepSeek-V4 on GB300

The spectacular aggregate-throughput result was published by the **SGLang Team and NVIDIA Team**, not a Numina researcher:

[Serving DeepSeek-V4 on GB300 with SGLang: 5x Higher Throughput](https://pytorch.org/blog/serving-deepseek-v4-on-gb300-with-sglang-5x-higher-throughput-at-the-same-interactivity-since-day-0/)

For DeepSeek-V4 Pro, FP4, 8K input/1K output, disaggregated serving:

- April 2026 day-zero, no MTP: approximately **2,200 output tokens/s/GPU**
- June 2026 with MTP: approximately **11,200 output tokens/s/GPU**
- Both measured at roughly **50 output tokens/s/user**
- Same GB300 hardware, a **5× software/runtime improvement**. citeturn380934view2

The work involved SGLang, NVIDIA Dynamo, improved MoE and attention kernels, better prefill/decode disaggregation, scheduling, multi-token prediction, and numerous correctness and runtime fixes.

This is not evidence that GB300 hardware is 5× faster than GB200. It is evidence that **software maturation on a fixed accelerator can be larger than a chip-generation gain**.

### Result B: GLM-5.2 on Blackwell

The GLM-5.2 result was from a **Baseten team** whose listed authors were Alex Korte, Magdy Saleh, Tri Dao, Anant Desai, Bryce Dubayah, Abu Qader, and Philip Kiely:

[How we built the world’s fastest API for GLM-5.2](https://www.baseten.co/blog/how-we-built-the-worlds-fastest-api-for-glm-52/)

They reported:

- **Over 280 output tokens/s**, as measured by Artificial Analysis
- GLM-5.2 architecture of **744B total / 40B active**
- NVIDIA Blackwell and in-house NVFP4 quantization
- Roughly equivalent FP8 versus NVFP4 results on the cited BFCL benchmark
- **2× higher TPS** for their observed workloads from prefill/decode disaggregation
- Further gains from KV-aware routing and multi-token prediction. citeturn380934view3

The 280 TPS figure is primarily a **per-user generation-speed/API benchmark**, not 280 aggregate tokens/s/GPU. The article says “NVIDIA Blackwell”; it does not identify that result specifically as a GB300 measurement.

### Conclusion on thread 3

The correct attribution is:

- **GB300, ~11,200 aggregate tok/s/GPU:** SGLang + NVIDIA, serving **DeepSeek-V4**
- **GLM-5.2, 280+ tok/s/user:** the **Baseten team**, serving on NVIDIA Blackwell
- No primary “Numina Code optimized GLM-5.2 on GB300” source was found.

---

## 1.4 Claude Pro/Max “API-equivalent” consumption

The strongest public investigations are real, but their dollar figures are often misunderstood.

Peter Steinberger’s June 2025 essay, [“Stop Overthinking AI Subscriptions”](https://steipete.me/posts/2025/stop-overthinking-ai-subscriptions), documented the then-prevailing limits as approximately:

- Pro, $20: around 45 messages per rolling five hours
- Max 5×, $100: around 225
- Max 20×, $200: around 900

He emphasized that actual capacity varies with model, context length, message size, and system load. Those figures are historical rather than guaranteed current allowances. citeturn540453view6

A detailed ccusage-based case study by Product Compass reported, over 30 days:

- 440 sessions
- Approximately 18,000 turns
- **$1,588 of API-list-price-equivalent usage**
- Covered by a Claude Max subscription. [Analysis](https://www.productcompass.pm/p/claude-code-pricing). citeturn540453view7

That implies an 87.4% discount to API list value:

\[
1-\frac{200}{1{,}588}=87.4\%
\]

But it does **not** imply Anthropic spent $1,588 serving the user. ccusage-style tools multiply measured tokens by public API prices. They estimate **foregone list revenue**, not hardware cost.

Anthropic’s current Claude Code cost documentation says enterprise deployments average approximately **$13 per active developer-day and $150–250 per developer-month**, with 90% remaining below $30 per active day. [Claude Code cost documentation](https://code.claude.com/docs/en/costs). citeturn357881view6

### Economic interpretation

Subscription investigations establish that:

1. Anthropic gives heavy users very large discounts relative to API list prices.
2. Plan caps, model routing, rolling windows, and peak throttling are important margin controls.
3. Subscription average revenue per nominal token is much lower than API sticker price.
4. They do **not** by themselves reveal Anthropic’s serving cost.

A $200 subscriber who consumes $1,588 of API-list-equivalent tokens can still be profitable if the underlying serving cost is, for example, $30–100. But extreme consumers can be loss-making even when the average subscriber remains profitable.

---

## 1.5 The X-account claims

The relevant posts I could verify include:

- [@teortaxesTex](https://x.com/teortaxesTex/status/1926656992082337950), whose indexed text includes “They can go for 99% margins …”. citeturn374708view1
- [@Jukanlosreve](https://x.com/Jukanlosreve/status/1941493202873352400), who used assumptions around $1/H100-hour and roughly $3/GB200-hour. That is principally a hardware-cost assumption, rather than an independently demonstrated Claude margin. citeturn876456search0
- [@zephyr_z9](https://x.com/zephyr_z9/status/2069824935967748247), whose indexed post discusses approximately 95% gross margin. X’s public rendering did not expose enough surrounding thread context for me to validate every premise behind the number. citeturn374708view3

One arithmetic caution: **5× cost is an 80% margin**, not 95%. A 95% margin requires price to be 20× cost:

\[
1-\frac{1}{5}=80\%,\qquad
1-\frac{1}{20}=95\%
\]

---

# 2. First-principles Claude serving-cost model

## 2.1 What “marginal” means

I distinguish three levels:

1. **Cash marginal cost:** electricity and immediately variable networking for a machine that is already purchased and otherwise idle.
2. **Economic marginal serving cost:** the opportunity cost of scarce accelerator time, plus production utilization and direct serving overhead.
3. **Company COGS:** actual cloud invoices/depreciation, idle peak capacity, free and subscription use, reliability overhead, internal inference, support infrastructure, and whatever the company’s accounting policy assigns to cost of revenue.

The headline estimates use level 2.

## 2.2 Workload and architecture assumptions

Base workload:

- 8,192 uncached input tokens
- 1,024 generated output tokens
- Approximately 50 output tokens/s/user
- Production continuous batching
- Prefill/decode disaggregation where supported
- No explicit charge for training or model development
- Blackwell uses quality-preserving NVFP4; Hopper, TPU, and Trainium use FP8-class inference

Approximate FLOPs per token:

\[
F_{\text{token}}=\kappa P_{\text{active}}
\]

where:

- \(P_{\text{active}}\) is active parameters
- \(\kappa=2.3\), representing approximately \(2P\) for the forward pass plus 15% for attention, routing, normalization, sampling, and other operations

For Opus:

\[
F_{\text{Opus}}=2.3\times300\text{B}
=690\text{ GFLOP/token}
\]

For Sonnet:

\[
F_{\text{Sonnet}}=2.3\times100\text{B}
=230\text{ GFLOP/token}
\]

The simple formula does not fully capture KV-cache bandwidth, inter-device all-to-all communication, speculative tokens that are rejected, or low-batch latency constraints. I therefore use an **end-to-end effective utilization factor**, \(\eta\), well below peak tensor-core MFU for decode.

## 2.3 Accelerator-price and utilization assumptions

| Accelerator | Dense compute used in model | Effective hourly cost assumption | Prefill \(\eta\) | Decode \(\eta\) |
|---|---:|---:|---:|---:|
| H100 SXM | 1.979 PF FP8 | **$2.80** | 35% | 8% |
| H200 SXM | 1.979 PF FP8 | **$3.40** | 38% | 10% |
| GB200/B200 | 10 PF FP4 | **$4.50** | 30% | 6% |
| GB300/B300 | 15 PF FP4 | **$5.00** | 30% | 6.5% |
| TPU v7 Ironwood | 4.614 PF FP8 | **$1.60** | 40% | 14% |
| Trainium2 | 1.299 PF FP8 | **$1.80** | 35% | 12% |

These are **Anthropic-scale economic costs**, not public on-demand prices.

Public anchors include:

- CoreWeave spot prices around $2.44/H100-hour, $2.58/H200-hour, and $4.48/B300-hour; GB200 inference capacity is advertised at $10.50/GPU-hour. [CoreWeave pricing](https://www.coreweave.com/pricing). citeturn779069view6turn357881view1turn357881view2
- Effective July 1, AWS’s published per-accelerator rates include $5.191 for H100, $5.97 for H200, $12.355 for B200, and $14.04 for B300. [AWS Capacity Blocks](https://aws.amazon.com/ec2/capacityblocks/pricing/). citeturn357881view3
- Google’s public Ironwood pricing in Iowa is $12 on demand, $6 flex-start, $8.40 on a one-year commitment, and $5.40 on a three-year commitment. [Google TPU pricing](https://cloud.google.com/tpu/pricing). citeturn357881view0
- SemiAnalysis estimates Anthropic’s strategic TPU v7 economics near **$1.60/chip-hour**, far below public retail pricing. That is a third-party estimate, not a disclosed contract price. [SemiAnalysis TPU v7 analysis](https://newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the). citeturn527047view0
- AWS publishes $2.235 per Trainium2 accelerator-hour for current Capacity Blocks. [AWS source](https://aws.amazon.com/ec2/capacityblocks/pricing/). citeturn779069view5

Anthropic has publicly described a heterogeneous strategy spanning Google TPUs, AWS Trainium, and NVIDIA accelerators, but has not disclosed the actual serving mix or unit contract prices. [Google expansion](https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services); [AWS compute expansion](https://www.anthropic.com/news/anthropic-amazon-compute). citeturn360411view0turn360411view1

## 2.4 Cost formula

Modeled throughput per accelerator:

\[
T=\frac{Q_{\text{peak}}\eta}{F_{\text{token}}}
\]

Busy-accelerator cost per million tokens:

\[
C_{\text{busy}}
=\frac{r}{3{,}600T}\times10^6
\]

I convert busy cost into a production serving cost with:

- 75% economic fleet utilization
- 10% CPU, host memory, networking, control plane, and direct reliability overhead

\[
C_{\text{serving}}
=C_{\text{busy}}\frac{1.10}{0.75}
=1.4667C_{\text{busy}}
\]

This overhead is deliberately not a full business-level COGS calculation.

## 2.5 Worked GB300 Opus example

For output:

\[
T_{\text{out}}
=\frac{15\times10^{15}\times0.065}
{690\times10^9}
=1{,}413\ \text{tokens/s/GPU}
\]

\[
C_{\text{busy,out}}
=\frac{5}{1{,}413\times3{,}600}\times10^6
=\$0.983/M
\]

\[
C_{\text{full,out}}
=0.983\times1.4667
=\$1.44/M
\]

\[
GM_{\text{out}}
=1-\frac{1.44}{25}
=94.2\%
\]

For input:

\[
T_{\text{in}}
=\frac{15\times10^{15}\times0.30}
{690\times10^9}
=6{,}522\ \text{tokens/s/GPU}
\]

\[
C_{\text{full,in}}
=\frac{5}{6{,}522\times3{,}600}\times10^6\times1.4667
=\$0.31/M
\]

\[
GM_{\text{in}}
=1-\frac{0.31}{5}
=93.8\%
\]

## 2.6 Modeled Opus cost by accelerator

These figures assume 300B active parameters and the rates/utilization above.

| Accelerator | Input tok/s per accelerator | Input cost, busy → full | Output tok/s per accelerator | Output cost, busy → full | Full-cost Opus margins, input/output |
|---|---:|---:|---:|---:|---:|
| **H100** | 1,004 | $0.77 → **$1.14** | 229 | $3.39 → **$4.97** | **77.3% / 80.1%** |
| **H200** | 1,090 | $0.87 → **$1.27** | 287 | $3.29 → **$4.83** | **74.6% / 80.7%** |
| **GB200 NVL72** | 4,348 | $0.29 → **$0.42** | 870 | $1.44 → **$2.11** | **91.6% / 91.6%** |
| **GB300 NVL72** | 6,522 | $0.21 → **$0.31** | 1,413 | $0.98 → **$1.44** | **93.8% / 94.2%** |
| **TPU v7** | 2,675 | $0.17 → **$0.24** | 936 | $0.47 → **$0.70** | **95.1% / 97.2%** |
| **Trainium2** | 659 | $0.76 → **$1.11** | 226 | $2.21 → **$3.25** | **77.7% / 87.0%** |

The H100/H200 figures may be optimistic for a 5T-total MoE because those platforms require much larger cross-node expert-parallel deployments. Conversely, Blackwell and TPU results depend on successful low-precision quantization and excellent distributed software.

If Claude requires FP8 rather than NVFP4 on Blackwell, GB200/GB300 prefill costs could rise by roughly 50–100%, while decode costs might rise by approximately 20–50% because decode is more memory- and communication-bound. Even under that sensitivity, GB300 Opus output margin generally remains around 91–94%.

## 2.7 Illustrative Anthropic fleet blend

Because Anthropic does not disclose the actual mix, I use:

- 40% TPU v7
- 25% GB300
- 15% GB200
- 15% Trainium2
- 5% H200

Then:

\[
C_{\text{Opus,in}}
=.40(.244)+.25(.312)+.15(.422)+.15(1.113)+.05(1.271)
=\$0.469/M
\]

\[
C_{\text{Opus,out}}
=.40(.696)+.25(1.442)+.15(2.108)+.15(3.246)+.05(4.830)
=\$1.684/M
\]

Thus:

\[
GM_{\text{Opus,in}}
=1-\frac{.469}{5}
=90.6\%
\]

\[
GM_{\text{Opus,out}}
=1-\frac{1.684}{25}
=93.3\%
\]

For the 100B-active Sonnet assumption, compute-dominated cost is roughly one-third of Opus:

\[
C_{\text{Sonnet,in}}\approx\$0.156/M
\]

\[
C_{\text{Sonnet,out}}\approx\$0.561/M
\]

At the promotional $2/$10 price this gives 92.2%/94.4%; at $3/$15 it gives 94.8%/96.3%.

## 2.8 Parameter sensitivity

Because Claude’s active parameter count is undisclosed, this is the largest model-specific uncertainty.

### Opus, 150–600B active

| Active parameters | Input cost/M | Input margin at $5 | Output cost/M | Output margin at $25 |
|---:|---:|---:|---:|---:|
| 150B | $0.23 | 95.3% | $0.84 | 96.6% |
| **300B base** | **$0.47** | **90.6%** | **$1.68** | **93.3%** |
| 600B | $0.94 | 81.2% | $3.37 | 86.5% |

### Sonnet, 60–200B active

| Active parameters | Input cost/M | Margin at promotional $2 | Output cost/M | Margin at promotional $10 |
|---:|---:|---:|---:|---:|
| 60B | $0.09 | 95.3% | $0.34 | 96.6% |
| **100B base** | **$0.16** | **92.2%** | **$0.56** | **94.4%** |
| 200B | $0.31 | 84.4% | $1.12 | 88.8% |

Other major uncertainties are average batch size, output interactivity, KV-cache length, speculative acceptance rate, quantization quality, expert load balancing, and the actual hardware invoice.

## 2.9 Public-retail-rate stress test

Using public cloud prices rather than strategic economics materially lowers the answer.

| Accelerator and public-rate proxy | Full Opus input cost/M | Input margin | Full Opus output cost/M | Output margin |
|---|---:|---:|---:|---:|
| H100, $5.191/hour | $2.11 | 57.9% | $9.22 | 63.1% |
| H200, $5.97/hour | $2.23 | 55.4% | $8.48 | 66.1% |
| GB200, $10.50/hour | $0.98 | 80.3% | $4.92 | 80.3% |
| B300/GB300 proxy, $14.04/hour | $0.88 | 82.5% | $4.05 | 83.8% |
| TPU v7, $5.40/hour three-year public price | $0.82 | 83.5% | $2.35 | 90.6% |
| Trainium2, $2.235/hour | $1.38 | 72.4% | $4.03 | 83.9% |

This is why both sides of the online argument can produce superficially plausible calculations. A model using $1–3/GPU-hour concludes 90–99%; one using $6–14 public cloud rates gets 60–85%. Anthropic’s true answer depends on its long-term strategic contracts, committed fleet utilization, and whether it bears or shares infrastructure capital risk.

## 2.10 Literal electricity-only marginal cost

For completeness, take a GB300 at:

- 1.4 kW maximum device power
- 1.15 PUE
- $0.08/kWh electricity
- 1,413 output tokens/s

Hourly device electricity:

\[
1.4\times1.15\times.08=\$0.129/\text{hour}
\]

Power cost per M output tokens:

\[
\frac{.129}{1{,}413\times3{,}600}\times10^6
=\$0.025/M
\]

At a $25 price, that implies 99.90% margin before small incremental host/network power.

But this is not the economically useful cost when accelerator capacity is scarce. The GPU-hour has an opportunity cost even if the physical machine has already been bought.

---

# 3. Chip-generation efficiency

## 3.1 Specifications

Peak specifications below are vendor figures. For NVIDIA parts I show **dense-equivalent** values where the published product table quotes sparse performance.

| Accelerator | Dense low-precision tensor compute | HBM and bandwidth | Scale-up domain/interconnect | Maximum device power |
|---|---|---|---|---:|
| **H100 SXM** | FP8 **1.98 PF**; BF16 **0.99 PF** | 80 GB; 3.35 TB/s | 8 GPUs; 900 GB/s NVLink/GPU | 700 W |
| **H200 SXM** | FP8 **1.98 PF**; BF16 **0.99 PF** | 141 GB; 4.8 TB/s | 8 GPUs; 900 GB/s | 700 W |
| **B200 / GB200** | FP4 **10 PF**; FP8 **5 PF** | ~186–192 GB; 8 TB/s | 72-GPU NVLink domain; 130 TB/s rack aggregate | ~1.2 kW |
| **B300 / GB300** | FP4 **15 PF**; FP8 **5 PF** | 288 GB raw, ~278 usable; 8 TB/s | 72-GPU domain; 130 TB/s rack aggregate | ~1.4 kW |
| **TPU v7 Ironwood** | FP8 **4.614 PF**; BF16 **2.307 PF** | 192 GB; 7.38 TB/s | 1.2 TB/s ICI; up to 9,216-chip pod | Not publicly specified |
| **Trainium2** | FP8 **1.299 PF**; BF16 **0.667 PF** | 96 GB; 2.9 TB/s | 1.28 TB/s NeuronLink; 64-chip UltraServer topology | Not publicly specified |
| **Rubin** | NVFP4 **50 PF**; FP8/FP6 **17.5 PF**; BF16 **4 PF** | 288 GB HBM4; 22 TB/s | 72-GPU domain; 260 TB/s rack aggregate, 3.6 TB/s/GPU | Not publicly specified |

Sources: [NVIDIA H100](https://www.nvidia.com/en-us/data-center/h100/), [H200](https://www.nvidia.com/en-us/data-center/h200/), [Blackwell Ultra architecture](https://developer.nvidia.com/blog/inside-nvidia-blackwell-ultra-the-chip-powering-the-ai-factory-era/), [GB200 NVL72](https://www.nvidia.com/en-eu/data-center/gb200-nvl72/), [GB300 NVL72](https://www.nvidia.com/en-us/data-center/gb300-nvl72/), [Google TPU7x](https://docs.cloud.google.com/tpu/docs/tpu7x), [AWS Trainium2](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/about-neuron/arch/neuron-hardware/trainium2.html), and [Vera Rubin NVL72](https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/). citeturn997456view0turn997456view1turn997456view2turn997456view3turn997456view4turn997456view5turn997456view6turn997456view7

The crucial architectural change from Hopper to rack-scale Blackwell is not merely FLOPS. It is the combination of:

- Much larger HBM
- Larger expert/KV-cache capacity per GPU
- A 72-GPU high-bandwidth domain
- FP4 tensor cores
- More efficient prefill/decode separation
- Far more room for large decode batches

## 3.2 Real-world H100 → H200

H200 has essentially the same tensor-core arithmetic as H100. Its benefit is more and faster HBM.

In Nebius’s MLPerf Inference 5.1 analysis, H200 improved Llama 70B performance by approximately **11%** versus the best comparable H100 result. [Nebius MLPerf analysis](https://nebius.com/blog/posts/bare-metal-class-performance-mlperf-inference). citeturn997456view8

Because H200 hourly rates are generally 5–25% above H100, the resulting cost per token is commonly:

- Roughly flat for compute-bound prefill
- 0–15% lower for memory-constrained decode
- Much better for models or context windows that do not fit efficiently on 80 GB H100s

In my Opus model, H200 output cost is only 3% lower than H100 and input cost is slightly higher because the assumed hourly premium offsets its utilization gain.

## 3.3 H200 → B200/GB200

MLPerf-derived comparisons show much larger real gains:

- B200 versus H200 on Llama 3.1 405B: approximately **3× offline throughput and 4.3× server throughput**
- B200 versus H200 on Llama 70B: approximately **2.9–3×**
- A four-GPU GB200 host delivered about 55% more total throughput than an eight-H200 host in one comparison, implying approximately **3.1× per accelerator**. [Nebius MLPerf analysis](https://nebius.com/blog/posts/bare-metal-class-performance-mlperf-inference). citeturn997456view8

Given a typical 1.3–2× increase in effective hourly cost, that translates to approximately **40–70% lower $/token**, not the full 3–4× throughput gain.

My Opus model gives:

- H200 → GB200 input cost: **−67%**
- H200 → GB200 output cost: **−56%**

Those reductions assume quality-preserving FP4 and good rack-scale model parallelism.

## 3.4 GB200 → GB300

GB300 increases FP4 arithmetic by 50% and HBM capacity by roughly 50%, but FP8 arithmetic and HBM bandwidth remain approximately unchanged. Therefore, the real gain depends heavily on whether the workload benefits from:

- Larger FP4 compute
- More KV-cache capacity
- Larger decode batch size
- Fewer model-parallel shards
- Better expert placement

### MLPerf

CoreWeave’s MLPerf 6.0-derived DeepSeek-R1 figures were approximately:

- Server: 4,868 → 5,574 normalized tokens/s/GPU, **+14.5%**
- Offline: 7,323 → 9,821, **+34.1%**

CoreWeave itself notes that TPS/GPU is its normalization, not an official MLPerf metric. [CoreWeave MLPerf 6.0 analysis](https://www.coreweave.com/blog/coreweaves-innovation-velocity-drives-mlperf-6-0-leadership). citeturn380934view11turn779069view10

### SemiAnalysis InferenceX

At matched user interactivity for DeepSeek-R1 FP4:

- Around 85 tok/s/user: cost fell from approximately $0.079/M to $0.070/M, **13% lower**
- Around 152 tok/s/user: approximately $0.447/M to $0.277/M, **38% lower**
- Around 219 tok/s/user: GB200 slightly outperformed GB300 in the displayed data

The dashboard’s prose appears to overstate the second reduction; the arithmetic from $0.447 to $0.277 is 38%, not 61%. [InferenceX GB200 versus GB300 comparison](https://inferencex.semianalysis.com/compare/deepseek-r1-gb200-vs-gb300). citeturn380934view10turn779069view9

A separate long-context SGLang result found approximately **1.38–1.58×** GB300 throughput versus GB200 at matched latency, with the larger HBM allowing higher decode concurrency. [SGLang long-context GB300 analysis](https://www.lmsys.org/blog/2026-02-19-gb300-longctx/). citeturn912949search16

### Practical conclusion

For a mature production workload I would underwrite:

- **10–25% lower $/token as a normal GB300-over-GB200 gain**
- 30–40% in favorable FP4, high-concurrency, or long-context cases
- Very little improvement—and occasionally regression—at some extreme low-latency operating points

My first-principles model gives 26% lower input cost and 32% lower output cost, near the favorable end.

## 3.5 Software gains can dominate chip gains

SemiAnalysis emphasizes that inference software changes weekly while hardware generations change annually. Its InferenceX v2 work shows large changes in the throughput/interactivity frontier as runtimes mature. [InferenceX v2](https://newsletter.semianalysis.com/p/inferencex-v2-nvidia-blackwell-vs). citeturn997456view10

The SGLang/NVIDIA DeepSeek-V4 result is the clearest example: **5× more throughput on the same GB300 generation** over roughly two months. citeturn380934view2

This means a model based only on NVIDIA’s peak FLOPS can easily be wrong by severalfold. Serving software, speculative decoding, quantization, routing, and batching are first-order economic variables.

## 3.6 Rubin projection

Rubin’s published vendor specifications imply, versus B300:

- FP4: 50 versus 15 PF, **3.33×**
- HBM bandwidth: 22 versus 8 TB/s, **2.75×**
- NVLink per GPU: 3.6 versus 1.8 TB/s, **2×**
- Same nominal 288 GB HBM capacity per GPU, but HBM4 and much higher bandwidth

There are no independent Rubin LLM-serving benchmarks yet. All Rubin estimates are therefore projections based on preliminary NVIDIA specifications. [NVIDIA Rubin page](https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/). citeturn997456view7

My base projection is:

- Real throughput gain: **2.5–4×** over mature B300/GB300, depending on phase
- Hourly economic cost: **1.3–1.8×** GB300
- Implied cost/token reduction: **28–68%**
- Central expectation: approximately **50–60% lower $/token**

## 3.7 Fixed-model cost trajectory, 2026–2028

This projection holds model size, output quality, context length, and user latency constant. It is not a forecast of API prices.

| Deployment vintage | Relative $/token, H100 = 100 | Opus input cost/M | Opus output cost/M |
|---|---:|---:|---:|
| H100 baseline | 100 | $1.0–2.2 | $4–9 |
| H200 mature | 90–105 | $0.9–2.2 | $3.5–8.5 |
| GB200 mature | 30–55 | $0.35–0.75 | $1.5–3.5 |
| **GB300 mature, 2026** | **25–45** | **$0.25–0.55** | **$1.0–2.5** |
| **Rubin ramp, 2027** | **10–22** | **$0.12–0.30** | **$0.45–1.20** |
| **Rubin mature plus software, 2028** | **6–15** | **$0.06–0.18** | **$0.20–0.65** |

In practice, frontier labs are likely to spend part or all of these gains on larger active models, longer contexts, more test-time reasoning, faster “fast mode,” multimodal processing, and higher reliability. Therefore, cost per token can fall rapidly without company-level compute spending falling.

---

# 4. Anthropic’s actual company gross margin

## 4.1 Reported figures

Anthropic is private, so these are press-reported internal projections and analyst estimates rather than audited public filings.

In January 2026, The Information reported that Anthropic had reduced its projected 2025 gross margin to approximately **40%**, ten percentage points below its previous internal estimate, because Google and Amazon third-party inference costs were approximately **23% higher than planned**. [Accessible summary of The Information report](https://www.investing.com/news/stock-market-news/anthropic-trims-profit-margin-outlook-as-ai-operating-costs-rise--the-information-4459316). citeturn380934view12

The latest quantified public estimate I found is PitchBook/Morningstar’s June 2026 estimate of approximately **44% gross margin**. It said Anthropic had spent approximately **$0.71 of compute per revenue dollar in Q1** and projected **$0.56 in Q2**. [PitchBook analysis](https://pitchbook.com/news/articles/anthropics-gross-margin-ipo); [Morningstar version](https://www.morningstar.com/stocks/anthropics-gross-margin-is-most-important-number-tech). citeturn283019search0turn283019search4

These figures should not be treated as audited GAAP disclosures. In particular, “compute spend” and accounting cost of revenue may not be identical.

## 4.2 Why 90%+ marginal token margins can coexist with 40–44% company gross margin

The two numbers use different numerators and denominators.

A 93% token margin says:

\[
\frac{\text{API list price}-\text{incremental optimized serving cost}}
{\text{API list price}}
\approx93\%
\]

Company gross margin says:

\[
\frac{\text{all realized revenue}-\text{all allocated cost of revenue}}
{\text{all realized revenue}}
\]

The gap is large for several reasons.

### A. Realized prices are much lower than list prices

Sources of lower realized price include:

- Enterprise volume discounts
- Cloud-platform revenue shares
- Batch API’s 50% discount
- Prompt-cache hits at 10% of standard input price
- Consumer subscription bundles
- Free-tier traffic
- Promotional pricing
- Model routing toward cheaper tiers

SemiAnalysis estimates that agentic workloads can have input/output ratios around 300:1 and cache-hit rates above 90%, yielding a much lower blended realized price per nominal token than the headline output-token price. [SemiAnalysis value-capture analysis](https://newsletter.semianalysis.com/p/ai-value-capture-the-shift-to-model). citeturn997456view11

Caching is not purely margin-negative: it lowers revenue per counted input token but also avoids almost all repeated prefill computation. In many cases it improves throughput and contribution profit per GPU even while reducing nominal price.

### B. Cloud-provider markup

My central token model uses an economic accelerator cost of $1.60–5/hour. Public cloud rates can be $5–14/hour. If Anthropic is temporarily short of committed capacity and buys expensive incremental Google, AWS, or NVIDIA-based cloud capacity, much of the theoretical token margin transfers to the infrastructure supplier.

This is consistent with the reported 23% third-party inference-cost overrun. citeturn380934view12

### C. Peak provisioning and low utilization

Consumer and coding-agent demand is highly bursty:

- Day/night variation
- Weekday variation
- Model launches and viral events
- Regional fragmentation
- Need to reserve low-latency capacity
- Failover and maintenance capacity

A fleet that is 95% utilized in a benchmark can be only 50–70% economically utilized across a week. DeepSeek itself disclosed that it reduced inference nodes at night and reassigned them to research and training. citeturn779069view0

### D. Subscription over-consumption and free traffic

A power user may consume many times the API-list equivalent of the subscription fee. Anthropic can limit this with rolling windows and dynamic caps, but the heavy-user tail reduces subscription gross margin.

Free users produce no corresponding token revenue. Subscription revenue is also recognized evenly while usage can be highly concentrated around product releases.

### E. Non-accelerator serving costs

Direct serving COGS can include:

- CPU and host memory
- KV-cache storage
- Networking and inter-region transfer
- Request routing and API gateways
- Logging and observability
- Safety classifiers
- Moderation
- Tool-use orchestration
- Retries and failed requests
- Customer-support infrastructure
- Data retention and compliance
- Depreciation or cloud commitment costs

### F. Unbilled model work

The serving system often performs more computation than the customer sees:

- Rejected speculative draft tokens
- Hidden reasoning or routing steps
- Safety-model calls
- Automatic retries
- Context compression
- Agent planning
- Internal evaluations and canary traffic
- Model-development inference

Whether internal inference is COGS or R&D depends on Anthropic’s accounting policy, which is not public.

### G. Older and heterogeneous hardware

Not all traffic immediately migrates to GB300 or TPU v7. Older H100/H200 fleets can remain in service because of capacity constraints, software qualification, regional availability, reliability, and sunk commitments. My model puts Opus output cost near $5/M on economically priced H100/H200, versus $0.70–1.44 on TPU v7/GB300.

## 4.3 Illustrative margin bridge

The following is **not an Anthropic disclosure**. It is one numerically plausible bridge from optimized list-price token economics to a 44% company gross margin:

| Bridge item | Margin after item |
|---|---:|
| Optimized marginal serving margin at list price | **93.5%** |
| Enterprise, subscription, batch, cache and promotional price realization: −12 points | 81.5% |
| Peak provisioning, geographic fragmentation, reliability slack: −8 points | 73.5% |
| Cloud markup, older hardware and unfavorable contract mix: −7.5 points | 66.0% |
| Free traffic and heavy subscription consumers: −9 points | 57.0% |
| CPU/network/storage, retries, safety, internal and unbilled inference: −13 points | **44.0%** |

Reasonable ranges for the individual, partly overlapping buckets are:

| Item | Approximate gross-margin impact |
|---|---:|
| Price realization versus standard API list | −8 to −18 points |
| Cloud markup / older hardware | −5 to −12 |
| Utilization and peak provisioning | −5 to −10 |
| Free and subscription traffic | −5 to −15 |
| CPU/network/retries/safety/internal inference | −7 to −15 |

The purpose of the bridge is not to claim that these are Anthropic’s exact allocations. It shows that no contradiction exists between 90–95% on an incremental list-price token and roughly 40–44% across the whole business.

## 4.4 Batch and cache economics illustrate the distinction

At the modeled fleet cost:

### Opus Batch API

Prices are $2.50 input and $12.50 output:

\[
GM_{\text{batch,in}}
=1-\frac{.469}{2.50}
=81.2\%
\]

\[
GM_{\text{batch,out}}
=1-\frac{1.684}{12.50}
=86.5\%
\]

Actual batch cost should be somewhat lower than my standard serving estimate because Anthropic can tolerate longer queues and fill accelerators more efficiently. Even so, batch traffic is clearly below the 90–95% headline at the same underlying model size.

### Cache hits

Opus cache hits are billed at $0.50/M rather than $5/M. It would be incorrect to compare the $0.50 price against the full $0.47 uncached-input cost, because a hit skips most of prefill. The relevant marginal costs are KV storage, routing, transfer, and any residual attention work. Consequently, cache-hit percentage margin can remain high even though revenue per nominal token is 90% lower.

---

# 5. Verdict

## Is 90–95% correct?

**Yes, as an order-of-magnitude estimate for economically marginal, standard-list-price Claude serving on a well-optimized 2026 fleet. It is not universally correct.**

My conclusions are:

### Opus

- **Uncached input:** point estimate **90.6%**, plausible **85–95%**
- **Output:** point estimate **93.3%**, plausible **88–97%**
- **GB300-only:** approximately **93.8% input / 94.2% output**
- **TPU v7 at the estimated strategic contract rate:** approximately **95.1% / 97.2%**

A blanket 95% Opus claim is therefore slightly aggressive for a heterogeneous, fully loaded fleet, but plausible on the best hardware and contracts.

### Sonnet

At the current temporary $2/$10 price:

- **Input:** point estimate **92.2%**
- **Output:** point estimate **94.4%**

At the normal $3/$15 price:

- **Input:** **94.8%**
- **Output:** **96.3%**

For Sonnet on modern hardware, “95%” is near the center rather than an extreme upper bound.

## How GB300 changes the picture

Relative to H100/H200 in my Opus model, GB300 lowers fully loaded serving cost by approximately:

- **72–75% for input**
- **70–71% for output**

That changes Opus list-price margins from roughly 75–80% on Hopper to approximately 94% on GB300.

Relative to GB200, the gain is less dramatic:

- Model estimate: 26% lower input cost and 32% lower output cost
- Independent/standardized evidence: generally 10–35% lower cost, workload dependent
- Favorable long-context cases: up to roughly 1.5–1.6× throughput

The larger strategic story is that GB300 combines hardware gains with a still-steep software optimization curve. The 5× SGLang improvement on fixed GB300 hardware demonstrates that a mature 2026 stack may be several times cheaper than launch-day benchmarks suggest. citeturn380934view2

## Is 95% an upper bound?

**No.**

It is not an upper bound in at least four senses:

1. Sonnet at normal pricing can exceed 95%.
2. Opus on low-cost TPU contracts can exceed 95%.
3. Power-only instantaneous marginal margin can exceed 99.8%.
4. Future Rubin-class systems may reduce fixed-model cost another 50% or more.

But 95% is **not conservative for every Opus token**. It can be materially too high when:

- The token runs on public-priced H100/H200 capacity
- Active parameters are nearer 600B than 300B
- Low latency forces small batches
- Contexts are very long
- Quantization must remain FP8
- Traffic is discounted, batch, subscription, or free
- Cloud-provider markup is large

The most defensible one-number answer is:

> **Standard-list-price marginal serving margin: approximately 92–94% for Opus and 94–96% for Sonnet on a mature 2026 fleet.**

---

# 6. Best public analyses of LLM inference economics

1. **Epoch AI — [Inference economics of language models](https://epoch.ai/publications/inference-economics-of-language-models)**  
   Best general first-principles treatment of compute, memory, latency, networking, batch size, and the economics of prefill versus decode. citeturn997456view9

2. **SemiAnalysis — [InferenceX public benchmark dashboard](https://inferencex.semianalysis.com/)**  
   The most useful public source for throughput-versus-interactivity frontiers, where a single “tokens/s” number is inadequate. Includes reproducible configurations and cost normalization. citeturn380934view10

3. **SemiAnalysis — [InferenceX v2: NVIDIA Blackwell vs AMD vs Hopper](https://newsletter.semianalysis.com/p/inferencex-v2-nvidia-blackwell-vs)**  
   Comprehensive analysis of the serving software stack, disaggregated inference, latency constraints, and the large difference between peak specifications and real deployment throughput. citeturn997456view10

4. **SemiAnalysis — [AI Value Capture: The Shift to Model Labs](https://newsletter.semianalysis.com/p/ai-value-capture-the-shift-to-model)**  
   Most relevant public treatment of model-provider pricing, cache-heavy agentic workloads, realized blended prices, and model-lab inference margins. citeturn997456view11

5. **MLCommons — [MLPerf Inference: Datacenter](https://mlcommons.org/benchmarks/inference-datacenter/)**  
   The strongest standardized benchmark corpus for cross-generation comparisons, although configuration differences and vendor-tuned submissions still require careful interpretation. citeturn472837view11

DeepSeek’s [Open Source Week inference disclosure](https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md) is the most valuable single primary-source operator disclosure, even though it is a one-day snapshot rather than a general economics framework. citeturn380934view0