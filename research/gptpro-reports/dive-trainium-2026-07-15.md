# RECOVERED — GPT-5.6 Pro dive: AWS Trainium Inference Economics

# AWS Trainium inference-serving economics: public-anchor audit

**Cutoff: July 15, 2026**

## Bottom line

**Trainium2 has a usable but narrow public engineering anchor.** AWS publishes two reproducible, named-model Neuron benchmarks on a complete `trn2.48xlarge`—16 Trainium2 chips—with exact aggregate output throughput. AWS also publishes a current Ohio Capacity Block rate of **$35.7608 per instance-hour**, or approximately **$2.235 per Trainium2 chip-hour**. Pairing them produces an infrastructure-only estimate of:

- **Llama 3.3 70B, optimized speculative-decoding configuration:** **$68.90 per million output tokens**
- **Llama 3.1 405B, FP8-rescaled weights plus speculative decoding:** **$98.65 per million output tokens**

These are the strongest public Trainium2 cost-per-token candidates I found. They are **not production-serving TCO measurements**: both use batch size 1, `max-num-seqs=1`, request concurrency 1, a fixed 10,000-token prompt, and roughly 1,500 generated tokens. The normalized tokens/sec/chip figures are accounting divisions of a 16-chip model deployment, not single-chip benchmarks.

**No equivalent public anchor exists for Trainium3.** Trn3 is generally available and AWS has published relative serving claims and a GPT-OSS-120B inference recipe. However, that recipe publishes no achieved tokens/sec, and I found no public numeric Trn3 instance or UltraServer hourly price. Thus neither side of the $/token equation is presently public.

**Project Rainier is confirmed to run Claude inference, but it supplies no serving-economics anchor.** AWS has disclosed roughly 500,000 Trainium2 chips and explicitly said Anthropic was training and running Claude inference on Rainier. It has not disclosed the training/inference allocation, tokens served, utilization, model mix, precision, replication level, or internal charge rate.

**I found no Trainium submission in the public MLPerf Inference results through v6.0, and no credible public apples-to-apples Trn2-versus-H100/H200 named-model serving benchmark.** AWS’s 30–40% price-performance claim and customer testimonials remain unaccompanied by the workload details needed to reproduce or normalize them.

---

## 1. Candidate quantitative Trainium2 anchor

For a benchmark reporting aggregate output throughput \(T\) on a complete instance:

\[
\text{Infrastructure cost per output token}
=\frac{\text{instance price per hour}}{3{,}600 \times T}
\]

\[
\text{Normalized output tokens/sec/chip}
=\frac{T}{16}
\]

Using the current Ohio Capacity Block price:

\[
P_{\text{Trn2}}=\$35.7608/\text{instance-hour}
=\$2.23505/\text{chip-hour}
\]

AWS labels the per-accelerator price as $2.235 after rounding. Capacity Block prices are dynamic; AWS says the current schedule is next due to update in October 2026.

| Model and AWS configuration | Aggregate output t/s, 16-chip instance | Normalized output t/s/chip | Infrastructure $/M output tokens | Anchor assessment |
|---|---:|---:|---:|---|
| Llama 3.3 70B baseline, BF16, TP64 | 36.5557 | 2.2847 | **$271.74** | Valid latency-oriented baseline; poor production-throughput proxy |
| Llama 3.3 70B, BF16 target + BF16 1B draft, fused speculation, TP64 | 144.1714 | 9.0107 | **$68.90** | **Best public Trn2 candidate** |
| Llama 3.1 405B baseline, BF16 weights, TP64 | 24.4210 | 1.5263 | **$406.76** | Valid latency-oriented baseline |
| Llama 3.1 405B, FP8-rescaled target weights, BF16 execution setting, 1B draft, fused speculation, TP64 | 100.6999 | 6.2937 | **$98.65** | **Second-best public Trn2 candidate** |

The exact logged “Overall Output Throughput” numbers are used rather than the rounded conclusion-table values. AWS reports 36.5557 and 144.1714 output tokens/sec for the 70B configurations, and 24.4210 and 100.6999 for the 405B configurations.

### What these numbers do and do not mean

For the optimized 70B test, the implied infrastructure spend is approximately **$0.1034 per benchmark request**. For the optimized 405B test, it is approximately **$0.1481 per request**. Each request includes a 10,000-token input and approximately 1,501 generated tokens. If one mechanically divides by all input-plus-output tokens, the resulting workload-specific blended figures are approximately **$8.99/M total processed tokens** for 70B and **$12.87/M** for 405B. Those blended numbers should not be generalized: prefill and decode consume materially different resources, and the 10,000:1,500 token mix is unusually input-heavy.

The derived $/M output figures include the prompt-prefill time because AWS’s aggregate throughput is based on total benchmark wall time. They exclude, among other things:

- idle and fragmentation losses;
- queueing and admission control;
- replicas for availability;
- scheduler, gateway, observability, and control-plane costs;
- model compilation and artifact management;
- network and storage charges;
- failed or cancelled requests;
- spare capacity and Capacity Block commitment risk;
- engineering, support, and commercial overhead.

Accordingly, I would use **$68.90/M output tokens for Llama 3.3 70B** and **$98.65/M for Llama 3.1 405B** as *engineering reference points*, not as expected production COGS.

---

# 2. Dated findings

## 2024-12-03 — Trn2 launch established the hardware unit and access model

**Claim.** AWS launched `trn2.48xlarge` with **16 Trainium2 chips**, 1.5 TiB aggregate HBM, and 46 TB/s aggregate memory bandwidth. At launch, production access in Ohio was through EC2 Capacity Blocks. AWS also claimed 30–40% better price-performance than P5e and P5en, but published no benchmark definition or named-model result supporting that percentage.

**Source, December 3, 2024.**
https://aws.amazon.com/blogs/aws/amazon-ec2-trn2-instances-and-trn2-ultraservers-for-aiml-training-and-inference-is-now-available/

**Quality.** Official vendor product disclosure. Hardware count and availability are high-quality; the price-performance comparison is an unsupported vendor claim.

**Quantitative-anchor utility.**

- **$ / hour:** Partial; it established Capacity Blocks as the launch access mechanism, but the blog did not itself publish the price.
- **Tokens/sec/chip:** No.
- **$ / token:** No.

---

## 2024 re:Invent — Historical Trn2 Capacity Block and 3-year RI prices

**Claim.** An AWS re:Invent slide lists `trn2.48xlarge` at:

- **Capacity Block:** $44.70/hour, or **$2.79375/chip-hour**
- **3-year Reserved Instance:** $34.39/hour, or **$2.149375/chip-hour**

The slide does not clearly identify the region or the RI payment option, so the $34.39 number should be treated as a historical illustrative rate rather than a current contract-comparable price.

**Source, ©2024 AWS presentation.**
https://d1.awsstatic.com/onedam/marketing-channels/website/aws/en_US/events/approved/reinvent-2025/reinvent/2024/slides/cmp/CMP333-NEW_AWS-Trainium2-for-breakthrough-AI-training-and-inference-performance.pdf

**Quality.** Official vendor presentation; strong historical evidence, but incomplete commercial terms.

**Quantitative-anchor utility.**

- **$ / hour:** Yes, historically.
- **Tokens/sec/chip:** No.
- **$ / token:** Only if deliberately constructing a historical-price scenario.

Using the later AWS Neuron throughput results, the historical rates would imply:

| Configuration | At historical $34.39/h 3-year RI | At launch $44.70/h Capacity Block |
|---|---:|---:|
| Llama 3.3 70B optimized | $66.26/M output tokens | $86.12/M |
| Llama 3.1 405B optimized | $94.86/M output tokens | $123.30/M |

---

## 2026-02-26 repository snapshot — Llama 3.3 70B absolute throughput

**Claim.** AWS’s Neuron tutorial deploys Llama 3.3 70B on one `trn2.48xlarge`, with tensor parallelism 64, BF16, `max-num-seqs=1`, batch size 1, 10,000 input tokens, approximately 1,501 output tokens, and one concurrent request. It reports:

- baseline: **36.555678 aggregate output tokens/sec**;
- fused speculative decoding with Llama 3.2 1B draft: **144.171369 aggregate output tokens/sec**.

The tutorial states that batch size 1 is used for the reported metrics, though the configuration can support up to batch size 4.

**Source, GitHub file last modified February 26, 2026.**
Documentation:
https://awsdocs-neuron.readthedocs-hosted.com/en/latest/libraries/nxd-inference/tutorials/trn2-llama3.3-70b-tutorial.html

Repository source:
https://github.com/aws-neuron/aws-neuron-sdk/blob/7a9740cd128d56d9f1dc9e70d06dd7b31c357ae9/libraries/nxd-inference/tutorials/trn2-llama3.3-70b-tutorial.rst

**Quality.** Official vendor benchmark with runnable configuration and raw sample output. Stronger than a marketing claim, but not independently validated or production-shaped. The repository file’s modification date is February 26, 2026.

**Quantitative-anchor utility.**

- **Tokens/sec/chip:** Yes, after explicitly dividing the 16-chip deployment: 9.0107 normalized output t/s/chip.
- **$ / hour:** No; must be paired with EC2 pricing.
- **$ / token:** **Yes, conditionally:** $68.90/M output tokens at the July 15, 2026 Capacity Block rate.

---

## 2026-02-26 repository snapshot — Llama 3.1 405B absolute throughput

**Claim.** A second AWS Neuron tutorial runs Llama 3.1 405B on one `trn2.48xlarge`, also with TP64, `max-num-seqs=1`, batch size 1, a 10,000-token input, and one concurrent request. It reports:

- BF16 baseline: **24.421011 aggregate output tokens/sec**;
- optimized configuration: **100.699865 aggregate output tokens/sec**.

The optimized configuration uses FP8-rescaled target weights, a BF16 execution setting, a Llama 3.2 1B draft model, fused speculation, and quantized kernels. AWS’s conclusion table labels the scenarios as using BF16, so describing it simply as “FP8 inference” would overstate what is disclosed.

**Source, GitHub file last modified February 26, 2026.**
Documentation:
https://awsdocs-neuron.readthedocs-hosted.com/en/latest/libraries/nxd-inference/tutorials/trn2-llama3.1-405b-speculative-tutorial.html

Repository source:
https://github.com/aws-neuron/aws-neuron-sdk/blob/7a9740cd128d56d9f1dc9e70d06dd7b31c357ae9/libraries/nxd-inference/tutorials/trn2-llama3.1-405b-speculative-tutorial.rst

**Quality.** Official, reproducible vendor benchmark. Strong engineering evidence, not an independent or saturation-throughput measurement. The repository file’s modification date is February 26, 2026.

**Quantitative-anchor utility.**

- **Tokens/sec/chip:** Yes, normalized to 6.2937 output t/s/chip.
- **$ / hour:** No.
- **$ / token:** **Yes, conditionally:** $98.65/M output tokens at the current Capacity Block price.

---

## 2026-07-15 — Current public Trn2 Capacity Block price

**Claim.** AWS’s current Capacity Block pricing page lists:

- `trn2.48xlarge`, Ohio: **$35.7608/hour**
- 16 Trainium2 chips
- displayed per-accelerator rate: **$2.235/hour**
- `trn2.3xlarge` in Melbourne and São Paulo: **$2.235/hour** for one chip.

AWS says Capacity Block prices are updated according to supply and demand and that the current rates are scheduled for their next update in October 2026.

**Source, accessed July 15, 2026.**
https://aws.amazon.com/ec2/capacityblocks/pricing/

**Quality.** Authoritative current AWS commercial price.

**Quantitative-anchor utility.**

- **$ / hour:** **Yes.**
- **$ / chip-hour:** **Yes.**
- **$ / token:** Yes when paired with a compatible throughput measurement.

---

## 2026-07-15 — Ordinary On-Demand, RI, and Savings Plan pricing remains inadequately anchored

**Claim.** I did **not** locate and independently verify a current authoritative numeric rate for `trn2.48xlarge` under:

- ordinary On-Demand EC2 pricing;
- one-year Reserved Instances;
- a current three-year RI;
- Compute Savings Plans or EC2 Instance Savings Plans.

The current official numeric rate I could verify is the Capacity Block price. The only verified RI figure is the historical $34.39/hour three-year RI shown on the 2024 AWS presentation.

AWS does maintain public machine-readable service and Savings Plan price catalogs. I was not able to validate the exact current Trn2 SKU entries and commercial dimensions from those bulk files in this research pass. Therefore, this finding means **“no current rate located and independently verified,” not “the SKU is categorically absent from every AWS price file.”**

**Source documentation, accessed July 15, 2026.**
https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/using-the-aws-price-list-bulk-api-fetching-price-list-files-manually.html

**Quality.** Rigorous search negative, with an explicit scope limitation.

**Quantitative-anchor utility.**

- **Capacity Block $ / hour:** Yes.
- **Current OD/RI/SP $ / hour:** No verified anchor.
- **$ / token under OD/RI/SP:** No.

---

## 2024-12-03 — First Trainium2-backed Claude serving price, but no underlying cost

**Claim.** Anthropic said latency-optimized Claude 3.5 Haiku on Trainium2 could deliver up to 60% faster inference and listed the Bedrock service at:

- **$1/M input tokens**
- **$5/M output tokens**

The ordinary version was listed at $0.80/M input and $4/M output. Anthropic did not disclose model parameter count, precision, chips per replica, tokens/sec, concurrency, utilization, or cost allocation.

The same announcement described Rainier as hundreds of thousands of Trainium2 chips delivering over five times the compute used to train Anthropic’s then-current generation, clearly framing Rainier primarily as a training project at that date.

**Source, December 3, 2024.**
https://claude.com/blog/trainium2-and-distillation

**Quality.** First-party model-provider production and list-price disclosure; performance is an “up to” claim without benchmark details.

**Quantitative-anchor utility.**

- **Serving list price:** Yes.
- **Infrastructure cost:** No.
- **Gross margin:** **No.** It is not valid to subtract the Llama 70B or 405B engineering costs above from the Haiku list price because the model, serving stack, hardware allocation, request mix, and performance target differ.

---

## 2025-11-03 — Project Rainier explicitly confirmed as mixed training and inference infrastructure

**Claim.** AWS said Project Rainier had brought nearly **500,000 Trainium2 chips** online and that Anthropic was already both **training and running inference for Claude** on it. AWS also said the deployment was expected to scale beyond one million Trainium2 chips across direct usage and Bedrock by the end of 2025.

**Source, November 3, 2025.**
https://aws.amazon.com/blogs/aws/aws-weekly-roundup-project-rainier-online-amazon-nova-amazon-bedrock-and-more-november-3-2025/

**Quality.** Official production disclosure. This is the strongest public evidence that Rainier itself—not merely the broader AWS Trainium fleet—has served Claude inference.

**Quantitative-anchor utility.**

- **Chip count:** Yes, approximately.
- **Inference chip count:** No; training/inference allocation absent.
- **Tokens/sec or tokens served:** No.
- **$ / token:** No.

---

## 2026-02-05 — Broader Trainium2 production scale became clearer, but not Rainier economics

**Claim.** Amazon reported:

- **1.4 million Trainium2 chips landed**;
- Trainium2 powered the **majority of inference on Bedrock**;
- Project Rainier contained **500,000+ Trainium2 chips**;
- Anthropic was using Rainier to train Claude;
- Trainium3 was already delivering production workloads.

This wording is important. The broader 1.4-million-chip fleet is explicitly tied to Bedrock inference, while the Rainier sentence specifically emphasizes training. That does not contradict AWS’s November 2025 statement that Rainier also runs inference, but it underscores that no current workload split is disclosed.

**Source, February 5, 2026.**
https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Fourth-Quarter-Results/

**Quality.** Public-company production disclosure; high confidence for aggregate fleet counts and broad use, but no operational detail.

**Quantitative-anchor utility.**

- **Fleet-capacity context:** Yes.
- **Rainier inference allocation:** No.
- **Utilization or tokens/sec:** No.
- **$ / token:** No.

### Precise Rainier conclusion

The public record now supports all three of the following:

1. Rainier was conceived and initially described primarily as a frontier-model **training** cluster.
2. By November 2025, AWS explicitly stated that Rainier was also running Claude **inference**.
3. No source discloses how many of its roughly 500,000 chips are devoted to inference, how continuously they are used, or how many Claude tokens they generate.

Consequently, **Rainier is a production validation signal, not a quantitative serving-cost anchor.**

---

## 2025-12-02 — Trainium3 became generally available, with relative rather than absolute serving metrics

**Claim.** AWS announced general availability of Trn3 UltraServers. It disclosed 2.52 PFLOP FP8 per chip, 144 GB HBM3e and 4.9 TB/s memory bandwidth, and systems scaling to 144 chips. AWS claimed:

- up to 4.4× Trn2 UltraServer performance;
- up to 4× better performance/watt;
- up to 3× faster performance on Bedrock;
- over 5× output tokens per megawatt at similar user latency.

No named model, absolute output tokens/sec, workload shape, precision-specific result, or price was given for those serving claims.

**Source, December 2, 2025.**
https://aws.amazon.com/about-aws/whats-new/2025/12/amazon-ec2-trn3-ultraservers/

**Quality.** Official launch disclosure; architectural specifications are useful, serving-performance figures are unbenchmarked relative vendor claims.

**Quantitative-anchor utility.**

- **Tokens/sec/chip:** No.
- **$ / hour:** No.
- **$ / token:** No.

---

## 2026 Neuron 2.31.0 documentation — Trn3 has a benchmark recipe but no published result

**Claim.** AWS’s GPT-OSS-120B-on-Trn3 tutorial documents:

- eight independent vLLM endpoints per Trn3 instance;
- TP degree 8 and LNC 2 per endpoint;
- EAGLE3 speculative decoding;
- MXFP4 MoE compute;
- a benchmark recipe with 10,000 input tokens, 3,000 output tokens, and concurrency 1.

The tutorial requires a private-beta Deep Learning AMI and publishes the benchmark command but **no achieved throughput, latency, or cost result**. A text search of the page finds no “Overall Output Throughput” result.

**Source, Neuron 2.31.0 documentation, accessed July 15, 2026.**
https://awsdocs-neuron.readthedocs-hosted.com/en/v2.31.0/libraries/nxd-inference/tutorials/trn3-gpt-oss-120b-tutorial.html

**Quality.** Official runnable recipe, but not a benchmark disclosure.

**Quantitative-anchor utility.**

- **Configuration:** Yes.
- **Tokens/sec/chip:** **No.**
- **$ / hour:** No public Trn3 rate located.
- **$ / token:** **No public anchor exists as of July 15, 2026.**

---

## Public MLPerf results through v6.0 — no Trainium inference submission located

**Claim.** I searched the public MLCommons `inference_results` repositories from early releases through v6.0 for Trainium, Trainium2, Trainium3, Neuron, Inferentia, AWS, and Amazon system identifiers. I found **no Trainium MLPerf Inference submission**.

I did locate a historical MLPerf Inference v2.0 submission for an AWS `inf1.6xlarge`/Inferentia1 system running BERT:

- Server: 129.99 samples/sec
- Offline: 250.817 samples/sec

That result is Inferentia1, BERT, and samples/sec—not Trainium or LLM output tokens/sec—so it is outside the requested scope.

**Sources.**

Current public results repository:
https://github.com/mlcommons/inference_results_v6.0

Historical Inferentia1 system metadata:
https://github.com/mlcommons/inference_results_v2.0/blob/36d324b502175621063a478fcbf6d2cb9421ca34/closed/NVIDIA/systems/Triton_Inferentia_INF1_6XLARGEx1.json

MLPerf methodology:
https://mlcommons.org/benchmarks/inference-datacenter/

**Quality.** MLPerf is an independent benchmark registry with compliance rules and closed-division comparability. The Trainium finding is a documented repository-search negative, not a claim about unpublished submissions or future rounds.

**Quantitative-anchor utility.**

- **Trainium tokens/sec/chip:** No.
- **Inferentia historical context:** Yes, but irrelevant to Trn2/Trn3 frontier-LLM serving.
- **$ / token:** No.

---

## Third-party evidence — architecture detail, but no independent serving anchor

**Claim.** SemiAnalysis published extensive Trn2 system and network analysis, including estimates of:

- 48 kW for a 64-chip Trn2 UltraServer;
- 27 kW for a rack containing two normal 16-chip Trn2 servers;
- approximately 400,000 Trainium2 chips for the then-planned Rainier deployment.

These were explicit analyst estimates. The article did not publish measured LLM tokens/sec, cost per token, or a named-model Trn2-versus-H100/H200 serving benchmark.

**Source, December 2024.**
https://newsletter.semianalysis.com/p/amazons-ai-self-sufficiency-trainium2-architecture-networking

**Quality.** High-quality specialist architectural analysis, but estimates rather than production disclosures or measured serving benchmarks.

**Quantitative-anchor utility.**

- **Power modeling:** Potentially useful as a secondary sanity check.
- **Tokens/sec/chip:** No.
- **$ / token:** No.

Other public repositories I found were near misses rather than anchors: deployment recipes without results, biological-sequence models with nonstandard tokenization, or screenshots without independently auditable run metadata. A GitHub search for the exact Trn2 phrase “Overall Output Throughput” surfaced only the two AWS Neuron tutorials above.

---

# 3. Trn2 versus H100/H200 pricing and TCO

The same current AWS Capacity Block page gives the following Ohio prices:

| Instance | Accelerators | Instance $/h | Accelerator $/h |
|---|---:|---:|---:|
| `trn2.48xlarge` | 16 Trainium2 | **$35.7608** | **$2.235** |
| `p5.48xlarge` | 8 H100 | $41.528 | $5.191 |
| `p5e.48xlarge` | 8 H200 | $47.760 | $5.970 |
| `p5en.48xlarge` | 8 H200 | $54.920 | $6.865 |

Purely on price:

- Trn2 is **13.9% cheaper per instance-hour** than P5;
- **25.1% cheaper** than P5e;
- **34.9% cheaper** than P5en.

On a mechanically normalized accelerator-hour basis, Trainium2 is 56.9% below H100/P5, 62.6% below H200/P5e, and 67.4% below H200/P5en.

Those percentages are **not performance or TCO comparisons**. A Trainium2 chip and an H100/H200 are not equivalent units; the instances contain different accelerator counts, memory capacities, networking, host resources, software stacks, and model-placement constraints.

AWS says Trn2 offers 30–40% better price-performance than P5e/P5en. Its product page also includes customer statements such as lower TCO or higher throughput. I found no supporting public benchmark specifying the same model, weights, precision, prompt/output distribution, batch/concurrency, latency SLO, and software revision on both Trn2 and P5-class systems. Thus:

> **No auditable, public apples-to-apples inference TCO anchor for Trn2 versus P5, P5e, or P5en was found.**

The raw EC2 prices are useful denominators; the comparative performance numerators are missing.

---

# 4. Trn2 UltraServer-specific conclusion

AWS discloses that a Trn2 UltraServer contains **64 Trainium2 chips**, formed from four 16-chip Trn2 instances, and makes qualitative or relative claims about inference response time and performance. I found **no public absolute output-tokens/sec result for a named LLM on a 64-chip Trn2 UltraServer**.

The two usable absolute throughput anchors are both on a single 16-chip `trn2.48xlarge`, not an UltraServer. Therefore, scaling the 16-chip numbers by four would be an unsupported assumption: the UltraServer may change model partitioning, communication, batching, replica count, and attainable utilization.

---

# 5. Margin at model list prices

The public record does not support a defensible Trainium serving-margin calculation.

The closest list-price signal is Trainium2-backed, latency-optimized Claude 3.5 Haiku at **$5/M output tokens** and **$1/M input tokens**. But Anthropic and AWS do not disclose:

- the model’s parameter count or active parameter count;
- precision and quantization;
- chips per serving replica;
- aggregate throughput per replica;
- concurrency and batching;
- utilization and idle reserve;
- cache-hit behavior;
- Rainier versus broader Bedrock fleet allocation;
- internal AWS-to-Anthropic pricing.

The public Llama 70B and 405B benchmarks cannot be substituted for those missing Haiku quantities. Consequently:

> **No rigorous public estimate of Anthropic’s or AWS’s Trainium-backed gross margin at model list prices exists.**

The only defensible output of the public data is the open-model, infrastructure-only scenario cost above—not commercial model margin.

---

# 6. Recommended use in a frontier-LLM economics model

For a quantitative model, I would encode the evidence as follows:

### Trainium2

**Central public engineering anchor**

- Hardware: one `trn2.48xlarge`, 16 Trainium2 chips
- Price: $35.7608/hour Capacity Block, Ohio, accessed July 15, 2026
- Model: Llama 3.3 70B Instruct
- Precision/configuration: BF16 target and 1B draft, fused speculative decoding, TP64
- Request shape: 10,000 input / approximately 1,501 output
- Batch and concurrency: 1
- Throughput: 144.171 aggregate output tokens/sec
- Normalized throughput: 9.011 output tokens/sec/chip
- Derived infrastructure cost: **$68.90/M output tokens**
- Confidence: **medium for this exact test; low for production generalization**

**Large-model cross-check**

- Model: Llama 3.1 405B
- Optimized mixed configuration: FP8-rescaled target weights, BF16 setting, fused speculation
- Throughput: 100.700 output tokens/sec
- Derived infrastructure cost: **$98.65/M output tokens**
- Confidence: **medium for this exact test; low for production generalization**

A production model should apply explicit factors for occupancy/utilization, redundancy, batching gains, request mix, compilation, and non-accelerator overhead rather than treating either figure as final COGS.

### Trainium3

- Public absolute named-model throughput: **missing**
- Public numeric instance/UltraServer price: **missing**
- Derived $/token: **not available**
- Recommended model treatment: **unanchored or scenario-only**, based on AWS’s relative Trn2 claims with a very wide uncertainty interval—not a point estimate.

### Project Rainier

- Total chip count: approximately 500,000+
- Inference use: confirmed
- Inference allocation, utilization and token volume: missing
- Recommended model treatment: **production-validation evidence only; no economics calibration**

---

# 7. Five most load-bearing sources

1. **AWS Neuron: Llama 3.3 70B on Trn2 with speculative decoding** — the strongest public absolute Trainium2 LLM-output-throughput source.
   https://awsdocs-neuron.readthedocs-hosted.com/en/latest/libraries/nxd-inference/tutorials/trn2-llama3.3-70b-tutorial.html
   Repository snapshot modified February 26, 2026.

2. **AWS Neuron: Llama 3.1 405B on Trn2 with quantization and speculative decoding** — second named-model throughput anchor and large-model cross-check.
   https://awsdocs-neuron.readthedocs-hosted.com/en/latest/libraries/nxd-inference/tutorials/trn2-llama3.1-405b-speculative-tutorial.html
   Repository snapshot modified February 26, 2026.

3. **AWS EC2 Capacity Blocks pricing** — current authoritative Trn2, P5, P5e and P5en hourly-price denominator.
   https://aws.amazon.com/ec2/capacityblocks/pricing/
   Accessed July 15, 2026.

4. **AWS Weekly Roundup: Project Rainier online** — strongest explicit disclosure that Rainier runs both Claude training and inference, with nearly 500,000 Trainium2 chips.
   https://aws.amazon.com/blogs/aws/aws-weekly-roundup-project-rainier-online-amazon-nova-amazon-bedrock-and-more-november-3-2025/
   November 3, 2025.

5. **AWS Neuron: GPT-OSS 120B on Trn3** — documents a real Trn3 inference configuration while demonstrating the crucial public-data gap: benchmark command, but no achieved result.
   https://awsdocs-neuron.readthedocs-hosted.com/en/v2.31.0/libraries/nxd-inference/tutorials/trn3-gpt-oss-120b-tutorial.html
   Neuron 2.31.0 documentation, accessed July 15, 2026.


---

## How this artifact was collected

*Moved here from above the answer by the 2026-09-09 release edit: GPT Pro session 3 reported that these pages put collection metadata before the finding, so a reader met request ids and dispatcher notes before the result. Nothing below is changed — it is the same block, at the foot.*


> **RECOVERED from ChatGPT history — dispatcher timer died before filing (commissioned 2026-07-15, Targeted 4).**
> Recovered from the ChatGPT conversation history after the dispatching session failed. No new
> prompt was sent; this is the verbatim assistant report as it already existed in-account. The
> dispatching (pro-dive-fleet) session's in-session MCP request registry expired unread, but the
> ChatGPT conversation itself survived.

| Field | Value |
|---|---|
| **Model** | `gpt-5-6-pro` (from message `metadata.model_slug`) |
| **Date** | 2026-07-15 |
| **Dive title** | AWS Trainium Inference Economics |
| **Created / final answer (UTC)** | 2026-07-15T20:34:36.714Z / 2026-07-15T21:39:58.041Z |

**Citation anchors removed:** citation anchors from the original interface were removed for
publication; original preserved in the archive copy.

**Provenance routing:** any site change this dive justifies must enter through the update queue
(`research/update-queue.md`), not via direct edits.

<details><summary>Dispatched prompt (verbatim)</summary>

```
You are conducting a rigorous source-hunting deep dive for a quantitative model of frontier-LLM inference serving economics (cost per token, and margin at list prices). I need the strongest available PUBLIC anchors for AWS Trainium inference/serving economics — or a rigorous, well-documented finding that no such public anchor exists.

SCOPE:
- Trainium2 (Trn2) and Trainium3 (Trn3, if announced/available) for LLM *inference/serving*, not training.
- Published inference throughput: AWS published claims (Trn2 UltraServer, Neuron SDK benchmarks); MLPerf Inference submissions on Trainium/Inferentia; third-party benchmarks. Prefer tokens/sec/chip on a named model at a named precision.
- Anthropic's Project Rainier (the Trainium cluster associated with Claude) — any usage reports, capacity disclosures, chip-count figures, or serving-cost signals. Carefully distinguish training use from inference use; flag where the public record is ambiguous.
- trn2 / trn3 EC2 instance pricing: on-demand $/hr, 1-yr/3-yr reserved and savings-plan rates, capacity-block pricing; normalize to $/chip-hour where possible.
- TCO vs H100/H200-class instances (p5 / p5e / p5en) — AWS or third-party perf-per-dollar comparisons.

GOAL: a candidate quantitative anchor for cost-per-token on Trainium — ideally (tokens/sec/chip on a named model) paired with ($/chip-hour) so a $/token can be derived. If no such public serving anchor exists, say so explicitly and precisely — a rigorous negative result is exactly as valuable here. Trainium is one of the weakest-anchored platforms in the model, so be precise about what is and is not publicly disclosed.

Structure your findings as dated claims. For each: the claim, primary source (URL + date), your assessment of source quality (vendor claim / third-party benchmark / production disclosure / analyst estimate), and whether it could serve as a quantitative anchor (tokens/sec/chip, $/hr, $/token). If no public anchor exists for a platform, say so explicitly as a finding — a rigorous negative result is wanted. End with a numbered list of your 5 most load-bearing sources.
```
</details>

---
