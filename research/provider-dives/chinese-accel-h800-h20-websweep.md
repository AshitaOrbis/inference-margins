# Chinese-market NVIDIA accelerators (H800 / H20 / export status) — web sweep 2026-07-09

Agent: h20-researcher (Claude web-research subagent, Exa+Brave). Cross-check source for the calculator's Chinese-accelerator entries; pairs with the GPT Pro Chinese-accelerator dive and the Ascend sweep.

## 1. H800 vs H100

**H800 SXM** (the variant DeepSeek used): compute DISCLOSED-identical to H100 SXM — same GH100 die, 80GB HBM3, 3.35 TB/s, dense FP8 ≈1,979 TFLOPS. The one deliberate cut: **NVLink capped at 400 GB/s vs 900 GB/s** (REPORTED, concordant). Training/multi-GPU penalty, not per-chip inference penalty.
- https://www.philisun.com/technical-analysis/nvidia-h800-vs-h100-a-technical-deep-dive-into-politically-defined-ai-chips/
- https://electronics.alibaba.com/buyingguides/nvidia-h800-vs-h100-ai-gpu-choice-guide

**H800 PCIe** (separate weaker SKU): 80GB, 2.0 TB/s, dense FP8 1,513 TFLOPS, 350W. DISCLOSED (vendor sheet): https://flopper.io/gpu/nvidia-h800-pcie-80gb/spec-sheet.pdf

**China rental**: no clean current H800 $/hr. DeepSeek's own $2/hr assumption is DISCLOSED (V3 tech report, https://arxiv.org/pdf/2412.19437). Trend proxy: TrendForce Apr 2026 — H100 one-year leases in China up 20–30% in ~6 months (RMB 50–60k → 80–90k rack-inclusive) on >1,000× token-volume growth (100B→140T tokens/day, early-2024→Mar-2026, National Data Administration). https://www.trendforce.com/news/2026/04/17/news-nvidia-h100-rentals-in-china-reportedly-up-20-30-as-token-demand-surges-h-series-also-rises/

## 2. H20

DISCLOSED specs (concordant: inferencebench.io, willitrunai): 96 GB HBM3, **4.0 TB/s**, dense FP8/INT8 **296 TFLOPS**, BF16 148 TFLOPS, TDP 400W (one outlier source says 500W), NVLink retained ~900GB/s.
- https://inferencebench.io/gpus/nvidia-h20/
- https://willitrunai.com/gpus/h20-96gb

Inference-friendly because decode is bandwidth-gated: 4.0 TB/s > H100's 3.35 TB/s. futunn/PETA 2024 analysis: H20 ~20% higher peak tok/s than H100 at low batch (REPORTED, dated): https://news.futunn.com/en/post/34012455/compared-to-the-h100-how-are-nvidia-s-h20-l20

**Price**: launch $12–15k (REPORTED); mid-2026 ~$10–12k (TechPowerUp citing Reuters, Jun 2026): https://www.techpowerup.com/340664/nvidias-export-compliant-b30a-for-china-priced-at-roughly-twice-the-h20

**Rental China**: fragmentary. 191idc aggregator: ~RMB 4.82/hr (~$0.67/hr) on-demand floor, subsidized/oversupply listing — ESTIMATE floor, not market-representative: http://www.191idc.com/jiageinfo/402.html. GAP: no official Aliyun/Tencent/Volcano H20 rate card found.

## 3. Export-control timeline 2025–2026

| Date | Event | Confidence |
|---|---|---|
| 2025-04-15 | BIS license requirement on H20 → China; Nvidia $5.5B charge | DISCLOSED (SEC) |
| 2025-07-15 | Reversal: H20 licenses to be approved | DISCLOSED |
| 2025-08-11 | Nvidia/AMD pay 15% of China chip revenue to US govt | DISCLOSED |
| 2025-08 | CAC discourages H20 purchases (Tencent/ByteDance/Alibaba/Baidu); suspension orders reported | REPORTED |
| 2025-08-22 | Nvidia halts H20 production amid crackdown | REPORTED |
| 2025-10 | B30A (~half B300: ~3.75 PF dense FP8) sampled to China | REPORTED |
| 2025-11-07 | White House blocks B30A export | DISCLOSED |
| 2025-12-08 | H200 allowed to "approved customers" at 25% revenue share | DISCLOSED |
| 2026-01-13/15 | BIS final rule: H200/MI325X case-by-case; ≤50% of US-bound volume, testing + KYC conditions | DISCLOSED |
| 2026-05-14 | US clears H200 for 10 named Chinese firms (Alibaba, Tencent, ByteDance, JD…) | DISCLOSED |
| 2026-05-05 | Huang: Blackwell/Rubin still no-go; ~zero H200 actually shipped | DISCLOSED |
| 2026-05-31 | BIS closes non-China-subsidiary loophole for Blackwell/Rubin/MI350x | DISCLOSED |
| 2026-07-07/08 | Beijing reportedly to LET its top AI firms buy the approved H200s (reversal of domestic discouragement; acute compute shortage) | REPORTED (The Information via Bloomberg/SCMP) |

B30A as of Jul 2026: treat as still blocked (one contradictory TechPowerUp/Reuters pricing piece ~$20–24k, discount vs Huang's May statement).

**Legal-to-buy today (Jul 2026)**: H20 (case-by-case, main legal SKU); H200 (10 cleared firms, deliveries just now plausible); everything else (H100/B200/B300/Rubin) banned — smuggling only.

Key sources: https://www.bis.gov/press-release/department-commerce-revises-license-review-policy-semiconductors-exported-china · https://www.nbcnews.com/world/asia/us-approves-nvidia-h200-chip-exports-china-conditions-rcna253948 · https://www.reuters.com/business/retail-consumer/us-clears-h200-chip-sales-10-china-firms-nvidia-ceo-looks-breakthrough-2026-05-14/ · https://www.bloomberg.com/news/articles/2026-07-08/china-to-let-ai-firms-buy-nvidia-h200-chips-information-says

## 4. Fleet reality (mid-2026)

- **DeepSeek**: V3/R1 trained on H800 (DISCLOSED). V4-class: US officials believe smuggled Blackwell in Inner Mongolia (REPORTED, Reuters Feb 2026). Tried Ascend for training → failed run → back to Nvidia for training, **Ascend for inference** (REPORTED, CAISI via peterwildeford/Grunewald: https://blog.peterwildeford.com/p/how-banned-ai-chips-end-up-in-china). Jul 2026: developing own inference ASIC (~1 yr in): https://www.businesstimes.com.sg/companies-markets/telcos-media-tech/chinas-deepseek-developing-its-own-ai-chip-sources
- **Zhipu**: GLM-Image trained fully on Ascend Atlas 800T A2 (Jan 2026, company-DISCLOSED): https://www.theregister.com/software/2026/01/15/chinas-zai-trained-a-model-using-only-huawei-hardware/4198774 ; The Information Jul 7 2026: weighing custom chip.
- **Alibaba/ByteDance/Tencent**: Aug 2025 ordered to suspend Nvidia purchases (REPORTED); Alibaba PPU "Zhenwu 810E" ~H20-class + 10k-chip self-built DC (Apr 2026, DISCLOSED); all among the 10 firms cleared for H200.
- **Moonshot**: GAP — no chip-specific sourcing found.
- **Smuggling aggregate**: Epoch AI ~660k H100-equivalents through end-2025 (90% CI 290k–1.6M) ≈ ⅓ of China's compute: https://epochai.substack.com/p/diversion-and-resale-estimating-compute · Substrate ~20k B300-equivalents in 2026 (CI 2k–100k): https://www.the-substrate.net/p/where-will-china-get-its-compute
- **Huawei self-claims**: 910C ~800 TFLOPS FP16 (~80% H100); Ascend 950 1.56 PF + 112GB, "3× H20 inference at ¼ cost" (self-reported, skepticism warranted): https://www.tomshardware.com/tech-industry/semiconductors/chinas-huawei-to-enter-south-korean-ai-chip-market-with-new-atlas-superpods-clusters-pack-8-192-ascend-950-accelerators-per-deployment-reportedly-challenges-nvidia-dominance-with-tripled-inference-performance-of-h20-at-one-quarter-the-cost

## 5. H20 MoE throughput anchors (MFU calibration)

- **LMSYS/SGLang + Ant Group (Sep 2025, production, DISCLOSED)**: DeepSeek-R1 on H20-96G — 16.5k prefill / 5.7k decode tok/s per 8-GPU node; ≈714 tok/s/GPU decode at BS=48 (423 at latency-traded spec-decode config). https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/
- **Alibaba InferSim (Apr 2026, validated ±10-15%)**: measured Qwen3-30B-A3B on H20: prefill 16,594 / decode 2,749 tok/s/GPU. Measured DeepSeek-V3 on H800: prefill 7,839 / decode 2,324 tok/s/GPU. https://pyshine.com/InferSim/
- **StepFun Step3 on 8×H20** (AMD-sponsored framing; StepFun-attributed baselines): decode 3,147 tok/s aggregate (~393 tok/s/GPU, high-concurrency short-output operating point). https://moreh.io/customer-case/step3-inference-optimization-on-amd-instinct-mi308x-1-30x-higher-decode-throughput-vs-nvidia-h20-251229/

Recommendation: anchor H20 on InferSim (validated, error-bounded); LMSYS 714 tok/s/GPU as the large-model production lower bound.

## Gaps
1. No official hyperscaler H20 rate card. 2. No Moonshot hardware sourcing. 3. B30A status has one contradictory source (discounted). 4. H20 TDP 400W vs 500W discrepancy (400W primary).
