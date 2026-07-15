# Huawei Ascend for LLM inference — web sweep 2026-07-09

> **CORRECTION (2026-07-10):** this sweep's "INT8 1,054 TFLOPS" figure for the 910C reproduces a typo in the CloudMatrix paper. Huawei's Atlas 800T A3 spec (12.0 POPS INT8 per 8-NPU server) and the paper's own tables give **1.504 POPS INT8 per NPU**, which the paper's prefill-efficiency arithmetic confirms. Superseded by the [GPT Pro Chinese-accelerator dive](chinese-accel-gptpro.html); the calculator uses 1.504.

Agent: ascend-researcher (Claude web-research subagent, Exa+Brave). Cross-check source for the calculator's Ascend entry; pairs with the H800/H20 sweep and the GPT Pro Chinese-accelerator dive.

## Headline facts for the calculator
1. **No native FP8 on 910B/910C** — FP16/BF16/INT8 only; 8-bit = INT8 (Huawei claims near-FP8 quality, arXiv 2506.12708). Native FP8/MXFP4 arrives with Ascend 950 series (950PR launched Mar 2026 as Atlas 350; 950DT live on Huawei Cloud Aug 2026: 144GB HiZQ 2.0, 4 TB/s, 1 PF FP8 / 2 PF MXFP4).
2. **910C**: dense FP16 752 TFLOPS (The Register per-die decomposition); INT8 1,054 TFLOPS (Huawei CloudMatrix paper); 128 GB HBM @ 3.2 TB/s package; TDP ~550–600W (no clean datasheet); SMIC 7nm N+2; UB scale-up 2.8 Tbit/s.
3. **910B** (low confidence, noisy): ~376–400 TF FP16, 64GB HBM2e, ~310–400W.
4. **CloudMatrix 384**: 384×910C + 192 Kunpeng, ~300 PF BF16 (checks arithmetically), 49.2 TB HBM (3.6× NVL72 ✓), 1,228.8 TB/s aggregate BW (2.1× NVL72 ✓), **~559 kW** (≈3.9× NVL72), **~$8.2M/unit (RMB 60M)** — FT-reported, widely corroborated ⇒ ~$21.4k/chip bundled.
5. **Chip price**: 910C RMB 180–200k (~$25–28k, Chinese-media consensus); Western estimates $12–18k (unsourced). Working range **$22–28k**. 910B ~RMB 110k (~$15.5k).
6. **Rental**: genuinely not publicly disclosed. One low-provenance listing $2.60/hr (MyAIHardware). SiliconFlow sells per-token (R1 $0.50/$2.18 as of mid-2026) and reserved groups (¥486–594k/mo). Surface as ESTIMATE, low confidence.

## Throughput anchors (MFU calibration)
- **Huawei CloudMatrix-Infer paper (arXiv 2506.12708, vendor-measured)**: DeepSeek-R1, INT8, EP320 across 384 NPUs — **prefill 6,688 tok/s/NPU** (4K prompts), **decode 1,943 tok/s/NPU** (TPOT<50ms); 538 tok/s/NPU under 15ms TPOT. Paper claims efficiency above SGLang-on-H100 — vendor-self-measured, skepticism warranted.
- **DeepSeek internal eval (Feb 2025, widely cited through 2026)**: 910C ≈ **60% of H100** inference performance (Tom's Hardware/TrendForce). Best single MFU-discount anchor; suggested range 50–65%.
- **Framework spread is huge on Ascend**: xLLM beats MindIE by ~34% (11,352 vs 8,476 tok/s on 8×910C R1 @TPOT=100ms) and beats vLLM-Ascend ~12× on 910B (arXiv 2510.14686) — framework choice matters far more than on CUDA.
- Training MFU context: 910B clusters 30–42% vs 39–58% CUDA-equivalents; Pangu Ultra MoE >52% with heavy engineering.

## Who serves on Ascend (mid-2026)
- SiliconFlow: DeepSeek R1/V3 on Huawei Cloud Ascend since Feb 2025, still running.
- Zhipu: GLM-5/5.2 support Ascend inference (also Moore Threads/Cambricon); GLM-5.1 reportedly trained on 100k×910B zero-CUDA (single-source); GLM-Image on Atlas 800T A2 (company-disclosed); weighing custom chip (The Information, Jul 2026).
- Huawei claims 1,000×910C post-trained DeepSeek V4 1.6T (Tom's Hardware).
- Moonshot/iFlytek: no strong Ascend-inference sourcing; iFlytek reported 3-month training delay after 910B switch (single mention).

## Calculator recommendations (from researcher)
1. Precision flag: 910-series 8-bit = INT8, no FP8 selection without caveat.
2. Ascend MFU discount ~60% of comparable NVIDIA (range 50–65%) if not using the CloudMatrix-Infer anchors directly.
3. 910C capex $22–28k (system math corroborates ~$21k bundled).
4. Rental: present as low-confidence estimate ($2.60/hr listing) or derive from SiliconFlow token pricing.
5. CloudMatrix aggregate numbers (300 PF / 49.2TB / 1,228.8 TB/s / 559kW / $8.2M) are the highest-confidence set — cross-validated against SemiAnalysis NVL72 ratios.

Key sources: arXiv 2506.12708 (CloudMatrix-Infer) · SemiAnalysis CloudMatrix 384 analysis · The Register 2025-07-29 rack-scale analysis · TrendForce 2026-03-23 (Atlas 350/950PR) · Huawei Central (950DT Aug 2026) · Tom's Hardware (DeepSeek 60%-of-H100; V4 post-training) · arXiv 2510.14686 (xLLM) · FT/Capacity/Igor's Lab ($8.2M CloudMatrix)
