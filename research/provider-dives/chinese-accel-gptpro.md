# Chinese-market AI accelerators — GPT-5.6 Pro deep dive

> Run 2026-07-09 · 57m45s · model `gpt-5-6-pro` (Pro-verified, `completion_path: api`, Ashitaorbis project) · conversation archived privately
> Headline for the calculator: **910C peak is 1.504 POPS INT8 (the CloudMatrix paper's "1,054" is a typo)**; annual-commit rents H800 ≈ $1.75/hr, H20 ≈ $1.00/hr, 910C ≈ $1.95/hr (Huatai procurement); neutral 910C decode MFU 7% (5–10%); H20 17% (Ant production tiers); and "one China rental rate" is a category error — the same H20 spans ¥5–72/card-hour by rental class.
> Archived verbatim below (citation-marker artifacts from the source renderer preserved).

---

**Evidence snapshot: 2026-07-09.** Dollar conversions use the SAFE midpoint of **¥6.8036/$ [DISCLOSED]**. Monthly prices normalized at **730 hours/month [SPECULATION: calculator convention]**.

### Evidence labels

- **DISCLOSED** — official specification, public rate card, operator disclosure, government document, or public procurement result.
- **CREDIBLY REPORTED** — Reuters, FT, or reporting with a reasonably defined source basis.
- **COMMUNITY ESTIMATE** — reseller listing, copied cloud-calculator output, open-source issue, or an anonymous market memo.
- **SPECULATION** — my modeling recommendation or projection.

## Bottom line

1. **Change the 910C peak from 1.054P to 1.504P INT8.** Huawei says an eight-NPU Atlas 800T A3 has **12.0 POPS INT8 [DISCLOSED]** ⇒ ~1.50P/NPU; the CloudMatrix paper's tables repeatedly use **1,504 TFLOPS [DISCLOSED]**. The paper's isolated "1,054" sentence is internally inconsistent — a typo. Proof: reported prefill efficiency **6,688 ÷ 1,504 = 4.45 tok/s/TFLOP** matches the paper's own table; 1,054 would give 6.35.

2. **Do not use one generic "China rental rate."** In June–July 2026 the same H20 ranges from **¥5–8/card-hour** (long-term bare-metal IDC) to **¥21–30** (committed Tencent) to **¥30–72** (on-demand/bundled public cloud). Different products, not one market.

3. **For marginal-serving presets use annual-commit IDC/private-cloud pricing:** H800 ≈ **$1.75/card-hour**, H20 ≈ **$1.00**, 910C ≈ **$1.95** [all SPECULATION←CR/CE/procurement].

4. **H20's 714 tok/s/GPU is real production evidence but the relaxed <70ms tier.** Neutral production anchor ≈ **675–700** (Ant Pro tier, <50ms); use **423** for <30ms latency-sensitive scenarios.

5. **910C: 7% effective decode MFU central, 5–10% range.** CloudMatrix's optimized 1,943 tok/s = 9.56% MFU supports the upper end; the second-hand "60% of H100" claim implies 5.5–6.4%.

---

## 1. Rental rate cards

### 1.1 Hyperscaler / public cloud (keep as a separate rental class)

| Provider and product | Published rate | Per card-hour | Notes |
|---|---:|---:|---|
| Tencent TI-ONE H800 HCC, 8-card monthly | ¥418,988–424,235/mo [DISCLOSED] | **¥71.74–72.64 / $10.55–10.68** | Doc updated 2026-06-03 |
| Tencent PNV6 H20 monthly (1 card) | ¥15,676/mo [DISCLOSED] | **¥21.47 / $3.16** | Lowest clear Tencent monthly H20 |
| Tencent HCC-PNV6 H20, 8-card monthly | ¥174,579/mo [DISCLOSED] | **¥29.89 / $4.39** | HCC fabric, big host bundle |
| Tencent PNV6 H20 on-demand | ¥30.48/card-hr [DISCLOSED] | **$4.48** | CPU-heavy variant ¥34.25/$5.03 |
| Tencent HCC-PNV6 H20 on-demand | ¥212.63–340/8-card node-hr [DISCLOSED] | **$3.91–6.25** | Bundle spread |
| Alibaba RDS Custom AI H20-96G | ¥50.32/card-hr [DISCLOSED] | **$7.40** | RDS product, not plain ECS |
| Alibaba RDS Custom AI H20-141G | ¥72.24/card-hr [DISCLOSED] | **$10.62** | |
| **Huawei Cloud 910C private-cloud procurement** | **¥8,500–11,200/card-month [CREDIBLY REPORTED public award]** | **¥11.64–15.34 / $1.71–2.25** | Huatai Securities framework award (avg 192 one-card instances, 1 yr); Huawei Cloud won at ¥8,500. Best reproducible 910C price. |
| China Telecom Tianyi 910B monthly | ¥18,454/card-mo [DISCLOSED] | **¥25.28 / $3.72** | 910B public-cloud proxy |
| China Telecom Tianyi 910B on-demand | ¥38.45/card-hr [DISCLOSED] | **$5.65** | |

Alibaba: `gn8v` documented (96GB HBM3, 4TB/s, 900GB/s NVLink [DISCLOSED]) but mainland tariff is sales-gated; copied calculator outputs ≈ ¥22.8–24.1 monthly / ¥34.7–36.7 on-demand per card-hour [COMMUNITY ESTIMATE]; a PAI doc example bid ceiling of ¥33/8-card-node-hour (¥4.125/card) is an example, not a clearing price. No reproducible static Alibaba H800 tariff. Volcano: no reproducible static mid-2026 card; stale Feb 2025 quote ≈ ¥133k/mo per 8-H20 node (¥22.77/$3.35).

### 1.2 IDC / neocloud market

| Hardware | Listing | Per card-hour | Label |
|---|---:|---:|---|
| H800 SXM, Cloud Engine | ¥59,000/8-card node-mo | **¥10.10 / $1.48** | COMMUNITY ESTIMATE |
| H800 SXM, 2026 market interview | ¥63,000–64,000/node-mo | **¥10.79–10.96 / $1.59–1.61** | CREDIBLY REPORTED (also: ~30% rise post-Spring-Festival; annual contracts dominant) |
| H800 SXM, APEtops | ¥82,000/node-mo | **¥14.04 / $2.06** | CE (full CPUs/RAM/9×400G) |
| H800 SXM, Luchen Cloud | from ¥12.70/card-hr | **from $1.87** | CE (hourly retail) |
| H20 96GB, Cloud Engine | ¥30,000/node-mo | **¥5.14 / $0.76** | CE (lowest transparent) |
| H20 141GB, Cloud Engine | ¥40,000/node-mo | **¥6.85 / $1.01** | CE |
| H20 96GB, APEtops | ¥38,000/node-mo | **¥6.51 / $0.96** | CE |
| Ascend 910B2 | ¥15,000–22,000/node-mo | **¥2.57–3.77 / $0.38–0.55** | CE — 910B only, never transfer to 910C |

**Rental values to encode (annual-commit/bare-metal/private-cloud):**

| Accelerator | Central | Range |
|---|---:|---:|
| H800 SXM | **$1.75/h** | $1.47–2.06 |
| H20 96/141GB | **$1.00/h** | $0.76–1.12 |
| Ascend 910C | **$1.95/h** | $1.71–2.25 |
| Ascend 910B | **$0.47/h** | $0.38–0.55 |

DeepSeek's **$2/H800-hour [DISCLOSED]** was a Feb 2025 internal costing assumption, not an invoice — a sanity check near the top of the current IDC range.

---

## 2. Hardware inputs and owned TCO

### 2.1 Specification cross-check

| Accelerator | Dense 8-bit | HBM | BW | Power | Interconnect |
|---|---:|---:|---:|---:|---|
| **H800 SXM** | **1.979 PF dense FP8 [DISCLOSED]** | 80GB | 3.35TB/s | 700W max | 400GB/s NVLink |
| **H20 96GB** | **296 TF dense FP8 [DISCLOSED by operator]** | 96GB | 4.0TB/s | 400W nominal (~460W max CR) | 900GB/s NVLink |
| **Ascend 910C** | **1.504 POPS INT8 [DISCLOSED]**; 752 TF FP16 | 128GB | 3.2TB/s | 600W central (550–690 CE) | 784GB/s D2D; no native FP8 |
| **Ascend 950DT** | **1.0 PF FP8 / 2.0 PF FP4 [DISCLOSED]** | 144GB | 4.0TB/s | ~650W (550–800 SPECULATION) | 2TB/s aggregate |

### 2.2 Accelerator capex (installed per accelerator)

| Accelerator | Evidence | Use |
|---|---|---|
| H800 SXM | Exporter listings ~$29–34k installed; higher domestic quotes ~$44–47k [CE] — banned finite stock, provenance-dominated | **$40k central; $30–48k** |
| H20 | Reuters $10–12k/chip [CR]; full-node quotes imply ~$17.8k (96G) / ~$22k (141G) installed [CE] | **$11k module / $20k installed central; $18–22k** |
| Ascend 910C | CloudMatrix 384 ≈ RMB 60M [CR] ⇒ RMB 156,250 = **$22,965/NPU** at 2026-07-09 FX | **$23k central; $22–29k** (RMB 180–200k figure = older market estimate) |
| Ascend 950DT | No price; 950PR RMB 50k (DDR) / 70k (HBM) [CR] are PR prices | **$18k installed central; $14–25k** for mid-2027 modeling |

### 2.3 Electricity, PUE, facility, depreciation

- Western-zone delivered electricity: Ulanqab ~¥0.35/kWh [CR]; Zhongwei ~¥0.36 [DISCLOSED]; Qingyang ≤¥0.40 [DISCLOSED] → **¥0.38/kWh central**; subsidized domestic-chip projects **¥0.30 (¥0.25–0.36)**; coastal scenario ¥0.70 (0.60–0.85).
- PUE: national caps 1.25 new large / 1.20 hub-cluster [DISCLOSED] → **1.20 central (1.12–1.30)**.
- Facility capex: China 50MW benchmark ≈ **$5.61–8.61/W [CR→derived]**; international ~$11/W → **$7.8/W central ($6.5–9.5)**.
- Depreciation: Alibaba computer equipment **3–5 years [DISCLOSED]** → **4 years central (3–5)**; facility **15 years (14–20)**. Chinese lessors' 5-year "payback model" is pricing practice, not depreciation economics.
- Chip-only electricity at ¥0.38 + PUE 1.2: H800 $0.047/h; H20 $0.027/h; 910C $0.040/h — depreciation and utilization dominate, not power.

---

## 3. Throughput anchors

| Deployment | Condition | Per-chip | Label |
|---|---|---:|---|
| DeepSeek H800 production | V3/R1 real traffic | **1,850 out tok/s/GPU** | DISCLOSED→derived (14.8k/node) |
| DeepSeek H800 production prefill | mixed traffic incl. disk-KV hits | **9,212 in tok/s/GPU** | DISCLOSED→derived |
| H800 optimized profile | R1, batch 128, ~50ms TPOT | **2,325 out tok/s/GPU** | DISCLOSED (CloudMatrix comparison) |
| Ant/SGLang H20 Base | R1, TPOT <70ms, batch 48 + MTP | **714 out tok/s/GPU** | DISCLOSED operator production |
| Ant/SGLang H20 Pro | TPOT <50ms, batch 32 | **675 out tok/s/GPU** | DISCLOSED — best neutral H20 anchor |
| Ant/SGLang H20 Max | TPOT <30ms, batch 12 | **423 out tok/s/GPU** | DISCLOSED — latency-sensitive preset |
| CloudMatrix 910C default prefill | R1 INT8, 4K input | **5,655 in tok/s/NPU** | DISCLOSED (default EPLB) |
| CloudMatrix 910C idealized prefill | "perfect EPLB" | **6,688 in tok/s/NPU** | DISCLOSED (idealized) |
| CloudMatrix 910C decode | R1 INT8, batch 96, 49.4ms TPOT, MTP@70% | **1,943 out tok/s/NPU** | DISCLOSED vendor/operator — upper anchor |
| CloudMatrix 910C strict latency | 24.6ms / 14.9ms TPOT | **974 / 538** | DISCLOSED — latency slope |

**Evidence gap:** no credible hardware-normalized production tok/s/chip for DeepSeek V4 on 950-series, GLM-5 on H20/H800/910C, Kimi K2.x on any of them, or MiniMax — deployability evidence only. Huawei's Atlas 950 SuperPoD "19.6M tokens/s across 8,192 NPUs" (⇒2,393/NPU) is a marketing metric without model/precision/SLO — do not anchor on it.

---

## 4. The Ascend reality check

Effective decode MFU (37B-active convention, dense 8-bit peak denominator):

| Anchor | Derived MFU |
|---|---:|
| H800 DeepSeek production 1,850 | **6.92%** |
| H800 optimized 2,325 | **8.69%** |
| H20 Base 714 | **17.85%** |
| H20 Pro 675 | **16.88%** |
| H20 Max 423 | **10.58%** |
| 910C CloudMatrix 1,943 | **9.56%** |
| 910C ~25ms TPOT 974 | **4.79%** |
| 910C ~15ms TPOT 538 | **2.65%** |

H20's high FLOP-MFU is real: little peak compute, excellent bandwidth — the 4TB/s memory subsystem does the economic work in decode.

**Reconciling 1,943 with "60% of H100":** the 60% claim [CR, unverified, no public benchmark] implies 1,110–1,303 tok/s ⇒ **5.5–6.4% MFU** vs CloudMatrix's 9.56%. Both can be true: CloudMatrix is EP320 across a 384-NPU optical supernode with co-designed INT8 kernels, MTP, ~50ms TPOT, batch 96; a generic 910C cluster, older CANN, or stricter latency won't reproduce it. **Neutral recommendation: 7% central; 10% optimistic; 5% conservative; 2.5–5% strict-latency tail.** At 1.504P INT8, 7% ⇒ ~1,423 tok/s/NPU on 37B-active.

**Power:** CloudMatrix ~559kW total IT [CR] vs NVL72 ~145kW is 3.86× — but 384 vs 72 devices (5.33×). Per-token IT energy: CloudMatrix 0.749 J/token; chip-only 910C 0.309; H800 0.378; H20 0.560. Chip-only excludes CloudMatrix's CPUs/optics/switches. Use **600W chip-only** or **1.45kW attributable IT/NPU** for CloudMatrix-like deployments; never multiply 910C power by 3.9.

**Honest error bars (generic 910C serving):** throughput/MFU ±35–40%; chip power ±15%; whole-system J/token ±40–50%. The uncertainty is software/topology, not the INT8 peak.

---

## 5. Who runs what (SPECULATION priors — no audited fleet percentages exist)

Share of frontier-model inference accelerator-hours in mainland China:

| Operator | H800 | H20 | Ascend 910C/950 | Other domestic | Confidence |
|---|---:|---:|---:|---:|---|
| DeepSeek | 35% (25–40) | 10% (5–15) | **50% (45–65)** | 5% | Medium-low |
| Zhipu / Z.ai | 20% (10–30) | 10% (5–20) | **50% (40–60)** | 20% (10–35) | Low |
| Moonshot / Kimi | **55% (45–65)** | 30% (20–35) | 10% (5–20) | 5% | Low |
| MiniMax | 35% | 25% | 20% | 20% | Very low |
| Alibaba / Qwen | 20% | 15% | 10% | **55% (T-Head PPU)** | Low-medium |

Evidence: DeepSeek V3/R1 disclosed on H800; V4 optimized for Ascend 950 (Reuters); own ASIC early-stage. Zhipu: GLM-5 developed with domestic chips incl. Ascend; broad adaptations. Moonshot: H800-class deployment guidance historically; Ascend K2.5 guide exists but no migration disclosure. Alibaba: sizable internal PPU deployments reported + evaluating 950PR. Countervailing: a May 2026 rental-market interview claims 90–95% Nvidia utilization and low domestic-card use in the commercial rental channel — true of that channel, not of hyperscaler/lab internal fleets.

---

## 6. Forward 12 months (through mid-2027)

- **Ascend 950PR/950DT:** 950DT on Huawei Cloud ~Aug 2026 (CR; likely preview) then Q4 GA. 950PR: ~RMB 50k (DDR) / 70k (HBM) per card; ~750k units planned for 2026, H2-weighted [CR]. Cheaper domestic prefill; 950DT improves decode via native FP8 + interconnect. Risks: yield, HBM supply, software maturity.
- **Ascend 960:** 2P FP8 / 4P FP4, 2× memory/bandwidth, Q4 2027 [DISCLOSED] — outside horizon.
- **H200 to China:** approvals under discussion for <200,000 chips total [CR]; no confirmed deliveries as of Jul 9. Scenario: ~200k delivered ⇒ **5–12% reduction in H800/H20 annual-lease pricing by mid-2027** [SPECULATION].
- **DeepSeek inference ASIC:** early-stage [CR]; base case = no material serving capacity by mid-2027.

---

## 7. Recommended calculator presets (annual-commit / owned-fleet marginal serving)

| Accelerator | Rent central (range) | Installed capex | Effective decode MFU | Power | Justification |
|---|---:|---:|---:|---:|---|
| **H800 SXM** | **$1.75/h** ($1.47–2.06) | **$40k** ($30–48k) | **7.0%** (6–9%) | 700W | IDC quotes surround DeepSeek's $2/h; 7% reproduces 1,850 tok/s production |
| **H20 96GB** | **$1.00/h** ($0.76–1.12) | **$20k installed** ($18–22k; $11k module) | **17%** (11–18%) | 400W (to 460) | 17% ⇒ ~680 tok/s, matching Ant's 675–714 production tiers |
| **Ascend 910C** | **$1.95/h** ($1.71–2.25) | **$23k** ($22–29k) | **7%** (5–10%) | 600W chip-only or 1.45kW CloudMatrix-attributable | Huatai procurement midpoint; MFU between "60% of H100" and Huawei's optimized 1,943 |
| **Ascend 950DT (mid-2027 projection)** | **$1.50/h** ($0.90–2.40) | **$18k** ($14–25k) | **15%** (10–20%) | ~650W | Native FP8, 144GB/4TB/s, decode-oriented; no independent data yet |

**Public-cloud sticker sanity checks (separate mode):** H800 Tencent HCC ~$10.6/h; H20 Tencent $3.16–6.25/h; H20 Alibaba RDS $7.40–10.62/h; 910B Tianyi $3.72–5.65/h; 910C public retail not reproducible.

**Other owned-TCO defaults:** electricity ¥0.38/kWh (0.35–0.45), subsidized ¥0.30 (0.25–0.36); PUE 1.20 (1.12–1.30); facility $7.8/W (6.5–9.5); accelerator depreciation 4 yr (3–5); facility 15 yr (14–20).

**Highest-value calculator improvement: a rental-class selector** — (1) IDC/bare-metal annual, (2) enterprise private-cloud procurement, (3) hyperscaler monthly commit, (4) hyperscaler on-demand/elastic, (5) spot/subsidized. Without it, a "China H20 rate" can differ by **>10×** even though every quoted instance contains an H20.
