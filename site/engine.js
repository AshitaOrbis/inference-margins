/* Frontier Inference Margins — pure model + data (no DOM). Loaded before app.js; node-importable for tests.
   Methodology v2.2 (reviewed 2026-07-27 — see /research/im3-integration-design.md): live decode and
   prefill use the reviewed roofline registries in engine-data-v22.js through
   engine-roofline-v22.js. Operating points resolve per hardware and service regime; traffic fixes
   sequence length; precision resolves through per-row tuples; q=1/a=1; and stackMult composes as
   eta_eff outside the reviewed calibration. Legacy effDec/effPre fields below remain descriptive
   v2.1 metadata for dossiers and compatibility only — the live compute path never reads them.
   All parameters editable; tooltips carry sources. */

"use strict";

/* ---------- hardware data ---------- */
// flopsFp8/bw/hbm remain display metadata. effDec/effPre are retired v2.1 calibration metadata;
// live v2.2 throughput resolves HW_ROOFLINE/CALIBRATION/PREFILL_CAL instead.
const HW = {
  h100:  { name: "H100 SXM",        flopsFp8: 1.98, fp4: false, hbm: 80,  bw: 3.35, tdp: 0.70, rent: 2.40, capex: 25000, effDec: 0.070, effPre: 0.15, note: "2022. Anchor: DeepSeek served V3/R1 on H800 (H100-class compute). Prefill MFU is reconstructed FRESH-only (the disclosed 73.7k/node input flow includes the 56.3% disk-cache-hit share)." },
  h200:  { name: "H200",            flopsFp8: 1.98, fp4: false, hbm: 141, bw: 4.80, tdp: 0.70, rent: 2.90, capex: 32000, effDec: 0.085, effPre: 0.36, note: "Same compute as H100, 1.76× HBM capacity/1.4× bandwidth → better batching." },
  gb200: { name: "GB200 NVL72",     flopsFp8: 5.00, fp4: true,  hbm: 186, bw: 8.00, tdp: 1.20, rent: 4.50, capex: 45000, effDec: 0.150, effPre: 0.42, note: "72-GPU NVLink domain (~$3-3.5M/rack ⇒ ~$44-49k/GPU). Per-GPU dense FP8 = 5.0 PF (NVIDIA sparse/dense split, verified — the widely-copied 4.5 PF is B200's). The vLLM ~10.1k R1 decode observation anchors F4 at b=128/rank and L=3,000. The live coefficient is η=0.315997, and it is an FP4-BASIS coefficient used in the FP8 default render as a DECLARED CONSERVATIVE TRANSFER (owner ruling q-im-fp4-gb200-eta-basis, 2026-08-02; relabel only — no number moves). This sentence used to call it 'the live FP8-basis coefficient', which contradicted the calibration registry's own words on the same value — '0.315997 IS THE FP4-BASIS COEFFICIENT' — and the vetting round of 2026-09-19 found the two sides of the record disagreeing (finding E2). The registry is right and this note now says what it says: 0.315997 reproduces the 10,108 tok/s anchor on the FP4 tuple and yields 6,408.5 on the FP8 tuple, so at the FP8 default the row under-predicts its own best Blackwell measurement by ~1.58x. The source run's precision basis (possibly NVFP4) is not fully pinned, so treat the anchor as an upper one rather than reapplying an FP4 gain. Neocloud rates $3.50-6/hr (Jul 2026). 2026-07-15 dive: AWS Capacity Block $761.904/rack-hr ($10.582/GPU-hr) is the cleanest explicit full-rack market datum; paired with audited MLPerf v6.0 rack throughput it derives $0.881/$0.630/$0.435 per M output tok (Interactive/Server/Offline) — a rack-scale bridge anchor, not fitted into this row's rent (left at the existing neocloud estimate)." },
  gb300: { name: "GB300 NVL72",     flopsFp8: 5.00, fp4: true,  hbm: 288, bw: 8.00, tdp: 1.40, rent: 6.00, capex: 55000, effDec: 0.127, effPre: 0.45, note: "Blackwell Ultra: 15 PF dense FP4 (1.67× B200), 288GB HBM. The SGLang >12k tok/s/GPU V4 Pro observation (FP4+MTP, 49B active) is not a fit: its batch and MTP acceptance are not reconstructable. The live η=0.258295 is analyst-set at a declared b=128/rank, L=2,740 operating point, and it is an FP4-BASIS coefficient used in the FP8 render as a DECLARED CONSERVATIVE TRANSFER, derived identically to gb200's (owner ruling q-im-fp4-gb200-eta-basis, 2026-08-02). This sentence used to call it 'the live FP8-basis η', contradicting the calibration registry's '0.258295 IS AN FP4-BASIS COEFFICIENT' on the same value; the registry is right (vetting finding E2, 2026-09-19). Unlike gb200 there is no measured anchor to under-predict — calObs.measured is null — so the 1.69x FP4-to-FP8 gap on this row is a magnitude statement, not a demonstrated error. InferenceX ~17× H100 FP8. xjdr served GLM 5.2 on these ($4-7/hr early rates). 2026-07-15 dive: audited MLPerf v6.0 single-rack results now confirm generated-throughput at scale (NVIDIA Interactive 250,634 / Server 400,437 / Offline 647,076 gen tok/s; Nebius Server 575,580 / Offline 673,936 gen tok/s) — but NO numeric GB300 rack rental rate is public on any major provider checked (AWS/CoreWeave/Nebius/GCP/Azure/OCI/Crusoe, Jul 2026): model GB300 $/M-output as a function of rack-hour price, not a point estimate. Cleanest current Blackwell-Ultra pair is same-provider B300 (node-scale, not rack): Nebius 8-GPU MLPerf Server 60,413 gen tok/s at $7.85/GPU-hr ⇒ $0.289/M output." },
  tpu7:  { name: "TPU v7 Ironwood", flopsFp8: 4.61, fp4: false, hbm: 192, bw: 7.37, tdp: 1.00, rent: 5.40, capex: 35000, effDec: 0.130, effPre: 0.40, note: "Google's inference TPU (GA Mar 31, 2026): 4,614 TF FP8 ≈ B200-class, 9,216-chip pods. Anthropic committed up to ~1M TPUs (Oct 2025). Rent = Google's PUBLISHED 3-year committed rate $5.40/chip-hr (b9 M1, r4 defect D4: the retired $4.20 sat BELOW every public comparator — 3-yr $5.40, DWS Flex $6, on-demand $12 — so it was never a purchasable market rate; this is a low/committed PLANNING rate, and it is labeled as one). 2026-07-15 dive: named-model accelerator-rental anchors exist (Qwen3-Coder-480B, 4 chips, 518.86 tok/s/chip ⇒ $6.42/M output on-demand, $2.89/M 3-yr) — barred from calibration as a RETRO evidence annotation (memo §2), though b9 M1 admits its aggregate-form weight-only efficiency reading (0.528) as one endpoint of this row's platform-native η bridge. The live decode path uses η_dec=0.55, the midpoint of that bridge (0.528 rental anchor / 0.574 Google Ironwood playbook), replacing the joint fleet fit that contained ZERO TPU observations. Google-internal fleet cost still unknown: no public Gemini-SKU→TPU mapping exists — estimates." },
  trn2:  { name: "Trainium2",       flopsFp8: 1.30, fp4: false, hbm: 96,  bw: 2.90, tdp: 0.50, rent: 2.235, capex: 15000, effDec: 0.055, effPre: 0.30, note: "GA Dec 2024. Project Rainier launched with ~500k Trainium2 for Anthropic (activated ~Nov 2025, confirmed running Claude inference alongside training); Anthropic reported >1M Trainium2 in use across AWS by Apr 2026 — inference/training allocation, utilization and internal rate undisclosed. Rent = AWS Capacity Blocks PUBLISHED $2.235/chip-hr (b9 M1, r4 defect D4: the retired $1.50 sat below the only public comparator). 2026-07-15 dive: a narrow public ENGINEERING anchor exists (AWS Neuron tutorials, batch=1/concurrency=1: Llama 3.3 70B spec-decode $68.90/M output tokens, Llama 3.1 405B $98.65/M) — not a production-TCO measurement, not fitted into this roofline. b9 M1 operating point: the AWS Qwen3-235B recipe on one trn2.48xlarge states replica-global batch 16 online / 64 offline (16 chips, tp_degree 64, attention-DP8, MoE EP32/TP2); the surrogate midpoint 32 replaces the retired b=4, which was an AWS tutorial demo value read as a production point. Throughput remains UNVERIFIED — no matched serving anchor exists — so this leg is scenario-only." },
  trn3:  { name: "Trainium3",       flopsFp8: 2.51, fp4: false, hbm: 144, bw: 4.90, tdp: 0.80, rent: 2.20, capex: 20000, effDec: 0.080, effPre: 0.34, note: "GA Dec 2025: 144-chip UltraServers, 362 PF FP8 ⇒ 2.51 PF/chip, 144GB HBM3e. AWS's aggressive cost-per-token play — pricing estimates. 2026-07-15 dive: AWS has published a GPT-OSS-120B inference recipe but no achieved tok/s and no public Trn3 instance/UltraServer price — neither side of $/token is public; NO public serving anchor of any kind (confirmed negative)." },
  // China-market accelerators — what DeepSeek/GLM/Kimi actually serve on.
  // Rents = annual-commit IDC/private-cloud rates (GPT Pro China-hardware dive, Jul 2026);
  // the same chip can cost 3-10x more on hyperscaler on-demand — use the rent multiplier for that.
  h800:  { name: "H800 (China)",    flopsFp8: 1.98, fp4: false, hbm: 80,  bw: 3.35, tdp: 0.70, rent: 1.75, capex: 40000, effDec: 0.070, effPre: 0.15, note: "H100 compute with NVLink capped at 400GB/s (export SKU, finite pre-ban stock — capex carries the scarcity premium). THE H800/H100 DIFFERENTIAL, STATED (d-im-h800, owner note aca09d 2026-08-18; grounded on the NVIDIA H800 datasheet 2631447 vs the H100 SXM datasheet, Lenovo Press LP1814, Tencent Cloud HCCPNV5): the export SKU differs from the H100 SXM in NVLink (400 vs 900 GB/s aggregate bidirectional) and FP64 (1 vs 34 TF) ONLY — FP8/BF16 tensor rate, 80 GB HBM3, 3.35 TB/s and 700 W are identical, so nothing else that reaches a serving number differs. CORRECTION to the 2026-08-16 annotation on this row (owner verbatim: 'H800 numbers are clearly broken'), which said the cap is modelled nowhere and that this engine has no fabric term on these rows: it does — HW_ROOFLINE carries 400e9 here and 900e9 on h100, and the live roofline consumes both (decode t_N = b·D/fabric, prefill t_fabric = D/fabric). What is true is that at every expert-parallel operating point this page ships the fabric term is SLACK under the frozen max() form (≈3% of the binding memory term at the page default, ≈13% on kimi), so this row and h100 render identical throughput, and that h100/h200 INHERIT the efficiency FITTED on this row (F1: DeepSeek's production disclosure ran on H800s). This row is therefore the MEASURED part; the borrowing rows are where the assumption lives, and the page's implicit assumption has been that the cap costs nothing. That assumption is now a NAMED, ADJUSTABLE fit-transfer assumption — nvlinkCapMinRatio, default 1.00 = this historical model — the assumed MINIMUM ratio of a borrowing row over its own capped counterfactual, applied per phase to the borrowing rows only, never here, never stacking on an advantage the roofline already renders, with the engine\'s own serial-exposure counterfactual (≈1.005× at the page default) and the sensitivity computed beside it. On the dense tensor-parallel donor the fabric term already BINDS prefill and the H100 renders ≈2.25× this row's prefill throughput with no lever at all. Why this row still renders a HIGHER margin than the H100 at the default: identical throughput at $1.75/hr against $2.40/hr — a rent difference the page states, not a finding about export SKUs. Registered evidence task E-2026-08-16-c (a matched capped-vs-uncapped serving observation) stays open; no such observation is public. THE DeepSeek V3/R1 workhorse. Prefill MFU = FRESH-only reconstruction (~4,026 tok/s/GPU net of the 56.3% disk-cache share; the raw 9,212 aggregate includes cache hits). Annual-commit IDC rate $1.47-2.06/hr mid-2026; DeepSeek's 2025 disclosure assumed $2/hr." },
  h20:   { name: "H20 (China)",     flopsFp8: 0.296, fp4: false, hbm: 96, bw: 4.00, tdp: 0.40, rent: 1.00, capex: 20000, effDec: 0.170, effPre: 0.50, note: "The China-legal NVIDIA SKU: only 296 TF dense FP8 but 4.0 TB/s HBM — decode is bandwidth-bound, so it serves far better than its FLOPS suggest (hence the high effective MFU vs a tiny denominator). This row's executable roofline coefficient is the source-informed-neutral η_dec=0.217022; it maps the legacy effDec=0.170 throughput basis to the hardware dive's ~680 tok/s recommendation and does NOT fit Ant Group's relaxed <70ms production observation (714 tok/s at b=48, L=4,096, one-step/two-draft-token MTP with ~1.8-1.9 accepted tokens). Rental class matters: same chip spans ~$0.76 (IDC annual) to $7+ (hyperscaler on-demand)." },
  ascend:{ name: "Ascend 910C",     flopsFp8: 1.504, fp4: false, hbm: 128, bw: 3.20, tdp: 0.60, rent: 1.95, capex: 23000, effDec: 0.070, effPre: 0.28, note: "Huawei's dual-die flagship (SMIC 7nm). NO native FP8 — 8-bit here means INT8 (1.504 PF per Huawei's Atlas spec; a widely-quoted 1,054 figure is a typo in the CloudMatrix paper). This row's executable roofline coefficient is the source-informed-neutral η_dec=0.299324; it maps the legacy effDec=0.070 throughput basis to the hardware dive's ~1,420 tok/s recommendation on an R1-class workload and does NOT fit Huawei's optimized source observation (1,943 tok/s at b=96, L=4,096, one speculative token at assumed 70% acceptance, q=2/a=1.7). DeepSeek's internal '60% of H100' eval implies a lower independent efficiency estimate (~5.5-6.5% of peak FLOPs). Rent = Huatai procurement award ($1.71-2.25/hr); CloudMatrix 384 ≈ RMB 60M. 2026-07-15 dive: a full 384-card CloudMatrix system (FlexNPU, arXiv:2606.04415) serves DeepSeek-R1 W8A8 at ≈633,000 generated tok/s system-wide under TTFT≤1s/TPOT≤50ms. CLOSED (owner ruling 2026-07-18, memo §9 'CM384 ruling'): these are EVIDENCE-RECORD ANNOTATIONS — never a selectable scenario, an operating point, or a calibration input — delivered full-system SLO point: 1,648 tok/s/card ⇒ 8.1%, mixed prefill+decode, all 384 cards charged; decode-pool standalone ceiling: 2,885 tok/s/decode-card ⇒ 14.2%, capacity ceiling, prefill hardware excluded. The full-system point brackets (corroborates) this row's deployed 7% default; the decode-pool ceiling does not (a different standalone measurand, ~1.49× above the full-system point) — neither is fitted into this row. No public CM384 hourly rental price exists — throughput anchored, cost unanchored. Cross-source proxy for the OLDER 910B chip (not this row): JD xLLM 709 gen tok/s/card × CTyun RMB 38.45/hr ⇒ ≈$2.09/M output (range $1.61-2.80/M), medium-low confidence. Ascend 920 has no official SKU, benchmark, deployment or price (Huawei's roadmap goes 910C→950PR/950DT→960→970, no 920) — excluded from this model." },
};
const HW_ORDER = ["h100", "h200", "gb200", "gb300", "h800", "h20", "tpu7", "trn2", "trn3", "ascend"];
// generation timeline for the gen chart (adds a Rubin projection)
const GEN_TIMELINE = ["h100", "h200", "gb200", "gb300"];
const RUBIN = { name: "Vera Rubin NVL72 (proj.)", flopsFp8: 17.5, fp4: true, hbm: 288, bw: 22.0, tdp: 1.80, rent: 8.50, capex: 120000, effDec: 0.13, effPre: 0.45, note: "Published NVIDIA hardware shape (verified Jul 2026): 17.5 PF dense FP8/FP6 and 4 PF dense FP16/BF16 per GPU, 288GB HBM4 @ 22 TB/s; the headline ~50 PF figure is SPARSE NVFP4 inference. No serving anchor exists — MFU, rent and capex are projections. 2026-07-15 dive confirms: no MLPerf submission, no InferenceX result (listed 'Coming Soon'), no public rental/purchase price for Rubin or Rubin Ultra — absolute economics remain fully unanchored. NVIDIA's only public claim is RELATIVE (Kimi-K2-Thinking, 32K-in/8K-out): up to 10× tok/s/MW and ~1/10 cost per M tokens vs GB200 NVL72 — not an absolute anchor. Current rack-scale product is Vera Rubin NVL72; do not collapse NVL144/Rubin CPX/Rubin NVL8/R100/VR200/Rubin Ultra into one generic 'Rubin' figure." };

// Slice-4 cleanup (memo §13 backlog, packet-recorded): the retired scalar multiplier VALUES are
// deleted — they never participated in the v2.2 compute path (precision and service regime
// resolve through the reviewed registries in engine-data-v22.js/engine-roofline-v22.js) and their
// presence was an attractive accidental-reuse point. Only the enum KEY LISTS survive, for codec/
// schema compatibility (SCENARIO_BOUNDS below) and the browser/Node export surface.
const PRECISION_ENUM_KEYS = ["bf16", "fp8", "fp4"];
const INTERACT_ENUM_KEYS = ["batch", "balanced", "fast"];

/* ---------- traffic-mix profiles (v2.1.2) ----------
   MOVED to engine-data-v22.js (slice-4 cleanup, memo §13 backlog): this registry used to live
   here, and engine-roofline-v22.js read it back from this file at its own parse time
   (RD_ENGINE.TRAFFIC_PROFILES) — the one reverse (roofline -> engine) dependency that forced the
   data -> engine -> roofline -> app script order. Moving the data to engine-data-v22.js (which
   already loads first) lets roofline read it the SAME way it reads every other registry
   (RD_DATA.*), removing the reverse dependency and enabling data -> roofline -> engine -> app.
   Node needs an explicit require (isolated module scope); the browser classic-script global
   engine-data-v22.js declares (loaded first, per the new order) is what this file's own traffic
   functions below — and app.js's bare TRAFFIC_PROFILES references — actually resolve against.
   This file must NOT locally redeclare `TRAFFIC_PROFILES` itself (that would be a browser
   SyntaxError: duplicate top-level const across classic scripts sharing one global scope). */
const ED_TRAFFIC_PROFILES = (typeof module !== "undefined" && module.exports)
  ? require("./engine-data-v22.js").TRAFFIC_PROFILES
  : TRAFFIC_PROFILES; // browser: the global engine-data-v22.js already declared (loaded first)

/* IM4 slice B: fleet registries from the data layer (same idiom as ED_TRAFFIC_PROFILES). */
const ED_FLEET = (typeof module !== "undefined" && module.exports)
  ? (() => { const d = require("./engine-data-v22.js");
      return { FLEETS: d.FLEETS, PRICE_EVIDENCE: d.PRICE_EVIDENCE, CALIBRATION: d.CALIBRATION,
               CHINESE_SILICON: d.CHINESE_SILICON, DEFAULT_FLEET_ID: d.DEFAULT_FLEET_ID,
               TOTAL_CASES: d.TOTAL_CASES, PRECISION_TIER_MAP: d.PRECISION_TIER_MAP, TOTAL_CASE_SCOPE: d.TOTAL_CASE_SCOPE,
               NVLINK_CAP_LINEAGES: d.NVLINK_CAP_LINEAGES }; })()
  : { FLEETS, PRICE_EVIDENCE, CALIBRATION, CHINESE_SILICON, DEFAULT_FLEET_ID, TOTAL_CASES, PRECISION_TIER_MAP, TOTAL_CASE_SCOPE,
      NVLINK_CAP_LINEAGES };
/* The same ED_* idiom, for the capacity solver's registries. These were being resolved INSIDE
   solveCapacityWidth and rooflinePoint, which run once per leg per corner: one
   adjust_rental_rate call re-resolved this module specifier 17,734 times (8,867 in
   rooflinePoint plus 8,867 in solveCapacityWidth -- every one a require.cache hit, all of them
   pointless) and, in the browser, rebuilt the five-field object literal 8,867 times. A module object's identity is fixed once it is loaded, so parse time is
   where this belongs. The property VALUES are the registry objects themselves, not copies, so
   a caller or a test that mutates a registry row is seen here exactly as before. */
const ED_CAPACITY = (typeof module !== "undefined" && module.exports)
  ? (() => { const d = require("./engine-data-v22.js");
      return { HW_DOMAINS: d.HW_DOMAINS, OPERATING_POINTS: d.OPERATING_POINTS,
               WEIGHT_PLACEMENT: d.WEIGHT_PLACEMENT, PRECISION_TIER_MAP: d.PRECISION_TIER_MAP,
               WORKER_CANDIDATE_SOURCES: d.WORKER_CANDIDATE_SOURCES }; })()
  : { HW_DOMAINS, OPERATING_POINTS, WEIGHT_PLACEMENT, PRECISION_TIER_MAP, WORKER_CANDIDATE_SOURCES };

/* im-arc T2 (memo research/im-arc-t2-sections-memo.md §6): the generic
   electricity default reads the region registry at module parse, so its adopted
   midpoint and the registry cannot drift into two sources of truth. */
const ED_DC_REGIONS = (typeof module !== "undefined" && module.exports)
  ? require("./engine-data-dc-v1.js").REGIONS : REGIONS;

/* im-arc T4 fold (2026-08-24), memo §4 [F7]: the heterogeneous planning-rent vector is SELECTED
   from the quote registry, never typed into a hardware row. `RENT_POLICY.planningPolicy` states
   what "one" is — the low/committed planning observation for each hardware — and
   `defaultRateId` names the quote that observation lives in. A null selection is the honest
   answer where no admissible public quote of that class exists: the row then resolves through
   the T2 fix-2 unavailable path (registryPlanningRentHr below) instead of silently keeping a
   retired number. Reading the registry at parse time is the same discipline as the electricity
   default above — the vector and its provenance cannot drift into two sources of truth. */
const ED_DC_RENT_QUOTES = (typeof module !== "undefined" && module.exports)
  ? require("./engine-data-dc-v1.js").RENT_QUOTES : RENT_QUOTES;
const ED_DC_RENT_POLICY = (typeof module !== "undefined" && module.exports)
  ? require("./engine-data-dc-v1.js").RENT_POLICY : RENT_POLICY;
/* The ONE closed schema (T2 memo §1.1): UI, engine and MCP read the same enum lists and the
   same class tables. Nothing here re-declares a band the registry already owns. */
const ED_DC_SCHEMA = (typeof module !== "undefined" && module.exports)
  ? require("./engine-data-dc-v1.js").DC_SCHEMA : DC_SCHEMA;
for (const key of HW_ORDER) {
  const quoteId = ED_DC_RENT_POLICY.defaultRateId[key];
  HW[key].rentQuoteId = quoteId;
  HW[key].rent = quoteId === null ? null : ED_DC_RENT_QUOTES[quoteId].usdPerHr.mid;
}
function hardwareRow(hwKey) { return HW[hwKey] || (hwKey === "rubin" ? RUBIN : null); }

/* im-arc T4 fold (2026-08-24), memo §2 [F5]: `capexScope` describes the INPUT SCOPE of the
   observed capex, never the product form. It is the field that closes the double count the TCO
   synthesis named: an installed/all-in observation multiplied by the generic 1.30 rendered the
   $40,000 H800 as $52,000 and the $20,000 H20 as $26,000. A finished-system observation already
   contains its overhead, so its overhead is 1.00. Rows whose scope the arms did NOT establish
   carry `null` and keep the scenario dial — this fold does not invent a scope. */
const T4_HARDWARE_CAPEX = Object.freeze({
  h100: { capex: 23750, capexScope: "bare-card",
    prov: "analyst-set 2026 span {22000, 23750, 28000} per GPU, one eighth of a dated public analyst model's base 8-GPU server; both arms carry the same $190k server / $250k all-in source. Bare-card scope: the clustering overhead is applied on top." },
  h200: { capex: 36000, capexScope: "bare-card",
    prov: "analyst-set 2026 span {32000, 36000, 40000} per GPU, module/base-system allocation over the dated public market range both arms carry. Bare-card scope." },
  gb200: { capex: 43056, capexScope: "base-rack",
    prov: "analyst-set 2026 span {41667, 43056, 47222} per GPU = one seventy-second of a $3.0m/$3.1m/$3.4m NVL72 BASE rack; both arms share the $3.1m base middle. Base-rack scope, so the rack-scale overhead {1.15, 1.26, 1.35} applies — the directly derived middle is $3.9m all-in / $3.1m base = 1.2581." },
  gb300: { capex: 55000, capexScope: null,
    prov: "HELD as a provisional point: the public estimates diverge and the high source is unverified, so no span is admitted and no scope is asserted (2026-08-23 TCO synthesis)." },
  h800: { capex: 40000, capexScope: "installed-system",
    prov: "HELD as a provisional point (the arms mix 2023-24 scarcity transactions with 2026 supplier asks), but its SCOPE is corrected: the registered value is an installed/all-in observation, so its overhead is 1.00 and the page no longer renders it as $52.0k (2026-08-23 TCO synthesis, both arms)." },
  h20: { capex: 20000, capexScope: "installed-system",
    prov: "HELD as a provisional point with its scope corrected to installed/all-in, so its overhead is 1.00 and the page no longer renders it as $26.0k (2026-08-23 TCO synthesis, both arms)." },
  tpu7: { capex: 25000, capexScope: "installed-system",
    prov: "analyst-set dated anchor carried by BOTH arms: SemiAnalysis, 2025-11-28, reports ~400,000 TPU v7 Ironwoods worth ~$10 billion in FINISHED RACKS, i.e. $10bn / 400,000 = $25,000 per chip. That observation is already at installed-system scope, which is exactly what justifies the 1.00 overhead here — and it is registered on THIS capex row and nowhere else (memo §1.3, fold F5.4). It replaces the prior $35,000 point plus a generic 1.30." },
  trn2: { capex: 15000, capexScope: null,
    prov: "HELD as a provisional point: both arms mark their proposed bands as inference (2026-08-23 TCO synthesis)." },
  trn3: { capex: 20000, capexScope: null,
    prov: "HELD as a provisional point: both arms mark their proposed bands as inference (2026-08-23 TCO synthesis)." },
  ascend: { capex: 23000, capexScope: null,
    prov: "HELD as a provisional point: the evidence is paywalled or relayed and the arms diverge (2026-08-23 TCO synthesis)." },
});
for (const key of HW_ORDER) {
  const row = T4_HARDWARE_CAPEX[key];
  HW[key].capex = row ? row.capex : HW[key].capex;
  HW[key].capexScope = row ? row.capexScope : null;
}
RUBIN.capexScope = null;
function capexProvenanceFor(hwKey) {
  const row = T4_HARDWARE_CAPEX[hwKey];
  return row ? row.prov : "no im-arc T4 capex provenance is registered for donor " + hwKey;
}
/* The overhead a row takes follows its SCOPE. A row with no established scope keeps the
   scenario dial, which is also what a section-level `tco.clusterOh` override still overrides. */
function clusterOverheadFor(hwKey, s) {
  const state = s || DEFAULTS;
  /* A historical state may declare the pre-fold semantics explicitly (memo §6 pin bundle). */
  if (state.capexScopeMode === "legacy-global") return state.clusterOh;
  const scope = (hardwareRow(hwKey) || {}).capexScope || null;
  if (!scope) return state.clusterOh;
  return ED_DC_SCHEMA.CLUSTER_OH_BY_CAPEX_SCOPE[scope].mid;
}
/* im-arc T4 fold round 4 (2026-08-25), memo :41: "...previews the effective clustered capex".
   A reader who types a capex is entitled to see what the model will actually spend per chip once
   the scope's overhead is applied — otherwise the scope is a form field whose consequence is
   invisible until it moves a margin. One row per stated capex, with the arithmetic spelled out.
   UI and MCP both consume THIS, so the preview and the priced value cannot disagree. */
function readerCapexPreview(customFleet, s) {
  const state = s || DEFAULTS;
  const out = [];
  const push = (hwKey, statedCapexUsd, capexScope, where) => {
    const band = capexScope ? ED_DC_SCHEMA.CLUSTER_OH_BY_CAPEX_SCOPE[capexScope] : null;
    const clusterOverhead = band ? band.mid : clusterOverheadFor(hwKey, state);
    const effective = statedCapexUsd * clusterOverhead;
    out.push({ where, hwKey, statedCapexUsd, capexScope: capexScope || null, clusterOverhead,
      effectiveClusteredCapexUsd: effective,
      sentence: "stated $" + Math.round(statedCapexUsd).toLocaleString("en-US") + "/chip at "
        + (capexScope || "no declared") + " scope \u00d7 " + clusterOverhead
        + " cluster overhead = $" + Math.round(effective).toLocaleString("en-US")
        + "/chip effective clustered capex" });
  };
  for (const section of (customFleet && customFleet.sections) || []) {
    const tco = section.tco || {};
    for (const leg of section.legs || []) {
      const ov = leg.overrides || {};
      if (ov.capexUsd != null) push(leg.donorKey, sectionPoint(ov.capexUsd), ov.capexScope || null,
        section.id + "." + leg.donorKey + " (leg override)");
      else if (tco.capexUsdByHw && tco.capexUsdByHw[leg.donorKey] != null)
        push(leg.donorKey, sectionPoint(tco.capexUsdByHw[leg.donorKey]), tco.capexScope || null,
          section.id + " (section capex)");
    }
  }
  return out;
}
/* im-arc T4 fold round 4 (2026-08-25), memo :41/:123. The overhead a CLUSTERED capex takes must
   follow the scope of the observation it is clustering. A registry row uses its own registered
   scope; a capex the READER states uses the scope the reader declared with it — never the row's,
   which is the "silently assumes bare card" the memo forbids. An explicit section clusterOh still
   wins over both, because that is a reader stating the overhead directly. */
function clusterOverheadForLeg(hw, s, cfLeg) {
  if (cfLeg && cfLeg.clusterOh != null) return cfLeg.clusterOh;
  if (cfLeg && cfLeg.capexUsd != null && cfLeg.capexScope)
    return ED_DC_SCHEMA.CLUSTER_OH_BY_CAPEX_SCOPE[cfLeg.capexScope].mid;
  return clusterOverheadFor(hwKeyFor(hw), s);
}
/* The registered capex for a donor, after any historical/absolute pin the STATE declares. */
function registeredCapexFor(hw, s) {
  const state = s || DEFAULTS, key = hwKeyFor(hw);
  if (state.capexAbsLeg && state.capexAbsLeg[key] != null) return state.capexAbsLeg[key];
  return hw.capex;
}
function pueBandForClass(facilityClass) {
  const band = ED_DC_SCHEMA.PUE_CLASS_BANDS[facilityClass];
  return band ? structuredClone(band) : null;
}
/* The dated bands behind the moved defaults. The page opens on each band's MIDDLE; the corners
   are what the band machinery evaluates. Both LIVES carry REVERSED cost corners: a longer life
   is a lower hourly cost, so the cost-bottom corner takes the long life, not the short one. */
function tcoDefaultBands() {
  return structuredClone({
    lifeYears: { lo: 4, mid: 5, hi: 6, basis: "analyst-set", observationKind: "selected-span",
      costCorners: { bottom: 6, middle: 5, top: 4 },
      source: "Audited issuer accounting policies: Nebius moved 4 -> 5 years on 2026-01-01; Microsoft, Alphabet, Oracle and CoreWeave carry 6; Amazon shortened an AI subset to 5.",
      asOf: "2026-08-23" },
    dcLifeYears: { lo: 10, mid: 15, hi: 20, basis: "analyst-set", observationKind: "selected-span",
      costCorners: { bottom: 20, middle: 15, top: 10 },
      source: "Analyst-set asset-life blend over dated audited lives, cost-weighted across mechanical/electrical plant and building shell. The prior hard-coded 12 was a short-M&E case, not a defensible universal middle.",
      asOf: "2026-08-23" },
    dcPerW: { lo: 9.5, mid: 12.5, hi: 17, basis: "analyst-set", observationKind: "selected-span",
      scope: "shell + MEP per delivered IT watt, excluding compute and scale-out networking; frontier liquid-ready",
      endpoints: [
        { value: 9.5, sourceYear: "2026", source: "JLL data-centre construction cost reporting, lower delivered-watt anchor" },
        { value: 12.5, sourceYear: "2026", source: "Turner & Townsend and Epoch build-cost anchors, frontier liquid-ready middle" },
        { value: 17, sourceYear: "2026", source: "Abilene: about $15bn over about 1.2 GW, upper delivered-watt anchor" }],
      source: "Dated JLL / Turner & Townsend / Epoch / Abilene anchors carried across both arms. This REPLACES the prior tooltip attribution, which neither arm could attribute to a public statement.",
      asOf: "2026-08-23" },
    costOfCapitalPct: { lo: 6, mid: 8.5, hi: 13, basis: "analyst-set", observationKind: "selected-span",
      costCorners: { bottom: 6, middle: 8.5, top: 13 },
      source: "Both arms converge on the endpoints and bracket the middle. Consumed ONLY when capitalRecovery is on (memo §2.1).",
      asOf: "2026-08-23" },
    clusterOhByCapexScope: structuredClone(ED_DC_SCHEMA.CLUSTER_OH_BY_CAPEX_SCOPE),
    pueByFacilityClass: structuredClone(ED_DC_SCHEMA.PUE_CLASS_BANDS),
  });
}
/* CRF(r, L) = r(1+r)^L / ((1+r)^L - 1); at r = 0 it degenerates to the straight line 1/L.
   Evaluated through log1p/expm1 rather than the textbook form (vetting round 2026-09-19, Astra
   pack A P1-3). `Math.pow(1 + rate, lifeYears) - 1` loses every significant digit once
   `1 + rate` rounds to 1: at rate = 1e-17 the denominator was exactly 0 and the factor came
   back Infinity, which reached the TCO path as a NaN margin — and SCENARIO_BOUNDS admits
   costOfCapitalPct anywhere in [0, 40], so a shared link carrying 1e-15 was an accepted,
   in-bounds state that rendered nothing. -expm1(-L·log1p(r)) is the same quantity divided by
   (1+r)^L and is accurate all the way down to the r → 0 limit, where it tends to 1/L
   continuously. Guard: tests/finance-crf-continuity.test.mjs. */
function capitalRecoveryFactor(rate, lifeYears) {
  if (!(lifeYears > 0)) return 0;
  if (!(rate > 0)) return 1 / lifeYears;
  const denom = -Math.expm1(-lifeYears * Math.log1p(rate));
  if (!(denom > 0) || !Number.isFinite(denom)) return 1 / lifeYears;
  const crf = rate / denom;
  return Number.isFinite(crf) ? crf : 1 / lifeYears;
}
/* The DISCLOSED increment over the straight line. Zero at r = 0, and by construction
   straightLine + increment === CRF x capital / 8760, so principal is never double counted. */
function capitalRecoveryIncrementHr(rate, lifeYears, financedCapital) {
  if (!(rate > 0) || !(lifeYears > 0)) return 0;
  return (capitalRecoveryFactor(rate, lifeYears) - 1 / lifeYears) * financedCapital / 8760;
}
function capitalRecoveryRate(s) {
  const state = s || DEFAULTS;
  if (state.capitalRecovery !== "on") return 0;
  const pct = Number(state.costOfCapitalPct);
  return Number.isFinite(pct) && pct > 0 ? pct / 100 : 0;
}
/* A UI TIER is a display filter. It returns no render options, because arithmetic may not
   depend on which tier rendered it — that is the whole point of fold [F6]. */
function tierRenderOptions(tier) {
  if (tier !== "basic" && tier !== "advanced")
    throw new TypeError("tier must be 'basic' or 'advanced'");
  return undefined;
}
/* Every dated observation registered for one hardware, its default first. The advanced tier and
   MCP select an alternate BY CLASS; the stress / on-demand perspective consumes the on-demand
   alternates. Order is stable so a receipt reproduces. */
function rentQuotesFor(hwKey) {
  const defaultId = ED_DC_RENT_POLICY.defaultRateId[hwKey] || null;
  return Object.entries(ED_DC_RENT_QUOTES)
    .filter(([, quote]) => quote.hwKey === hwKey)
    .map(([quoteId, quote]) => ({ quoteId, ...quote, isDefault: quoteId === defaultId }))
    .sort((left, right) => (right.isDefault - left.isDefault) || left.quoteId.localeCompare(right.quoteId));
}
function rentQuoteByClass(hwKey, rateClass) {
  return rentQuotesFor(hwKey).find(quote => quote.rateClass === rateClass) || null;
}

/* b9 M4 (memo §3.1): the custom-fleet runtime source. Script order is data → roofline →
   engine → custom-fleets → app, so this file NEVER references custom-fleets symbols at
   parse time — custom-fleets.js registers its store here at load (browser), and node
   callers self-register on first use through the lazy require below. Resolution is
   call-time only; definitions live in the side store, never in scenario state (the M3
   side-registry/state-purity rule). */
let CUSTOM_FLEET_SOURCE = null;
function registerCustomFleetSource(src) { CUSTOM_FLEET_SOURCE = src; }
function customFleetSource() {
  if (!CUSTOM_FLEET_SOURCE && typeof module !== "undefined" && module.exports) {
    CUSTOM_FLEET_SOURCE = require("./custom-fleets.js").CF_RUNTIME;
  }
  return CUSTOM_FLEET_SOURCE;
}
function isCustomFleetId(id) {
  if (typeof id !== "string" || !id.startsWith("cf:")) return false;
  const src = customFleetSource();
  return !!(src && src.resolve(id));
}

/* ---------- state ---------- */
const DEFAULTS = {
  active: 300, total: 2500, precision: "fp8",
  customDonor: "dsr1", // codec axis (memo §3 R2 contract): only meaningful for model="custom";
  // resolveArch() ignores it for every other model. Kept in sync by test with
  // CUSTOM_DONOR_ENUM.values (engine-data-v22.js) / CUSTOM_DONOR_BOUNDS (engine-roofline-v22.js) —
  // hardcoded here rather than referenced, because SCENARIO_BOUNDS below evaluates at engine.js's
  // own module-parse time. IM3 exit-gate fix 5 (P2, skeptic + risk-analyst): this comment
  // previously claimed the browser script order was data -> engine -> roofline -> app -- stale
  // since the slice-4 cleanup adopted data -> roofline -> engine -> app (engine.js now loads
  // AFTER engine-data-v22.js, which is what actually matters here: engine-data-v22.js has always
  // loaded first in every order this codebase has used; see index.html's script-tag comment for
  // the current order and why it is safe).
  ioRatio: 15, cacheHit: 60, /* owned by the TRAFFIC MIX axis since v2.1.2 — resolveTraffic() writes these */ billCacheHit: null, /* billable cached-input share; null = assumed equal to serving reuse (labeled assumption — no provider discloses both) */ cacheCost: 5, interact: "balanced",
  hwMode: "rent", rentMult: 1.0,
  /* row 499: PER-LEG rent multipliers, applied on top of the global `rentMult` under `hwMode:"rent"`
     only. null = no per-leg posture, and the multiplication never happens — every pre-row-499 number
     is bit-identical (the `specDec: 1.0` precedent below). It exists because a per-leg procurement
     posture is a real analyst position this engine could not express: row 492 found that the single
     global multiplier reproducing one adjudicator's margin (0.7308) would assert a ~27% NVIDIA
     discount that adjudicator explicitly declined to claim, while under-stating the TPU discount
     that was the whole point of the posture. A fit wearing a posture's clothes is the one thing this
     page refuses, so the engine got the capability instead of the preset getting a fudge. Keys are
     HW_ORDER ids; values share `rentMult`'s bounds. */
  rentMultLeg: null,
  /* row 499 (owner ruling ccb4a1-series, COMPLETENESS DOCTRINE): the FAMILY-WIDE companion to the
     per-accelerator map. Ruling verbatim in effect: each accelerator individually variable, "and a
     family-wide option for the less sure". Resolution order in hwHourCost is per-leg → family →
     global, so a reader who only knows "TPU is discounted, I don't know how it splits across
     generations" moves one control and every TPU leg follows. null = declared nothing. */
  rentMultFam: null,
  /* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): an absolute
     reader-stated rent replaces the registered rate rather than multiplying it. The donor-keyed
     map wins over the fleet-wide value; both null defaults are inert and preserve every shipped
     scenario byte-for-byte. Custom-fleet duplicates inherit their donor key, so one declaration
     applies to every leg of that donor even when a leg carries its own rentPerHr override. */
  rentAbsAll: null,
  rentAbsLeg: null,
  /* im-arc T4 fold (2026-08-24), memo §6 [F10]: the historical PIN BUNDLE needs every arithmetic
     sink a historical state can reach to be expressible IN THAT STATE. Rent already was
     (`rentAbsLeg`); capex and the cluster-overhead SEMANTICS were not, so an archived reading
     could not reproduce once capex points moved and the overhead became scope-derived. These two
     keys close that, and they are inert at their defaults — `null` never enters the arithmetic
     and "scoped" is the live semantics — so no shipped scenario moves because they exist.
     `capexAbsLeg` is the exact mirror of `rentAbsLeg`: a donor-keyed ABSOLUTE capex that replaces
     the registered row value rather than multiplying it. */
  capexAbsLeg: null,
  /* The rent half of the same bundle, and deliberately NOT `rentAbsLeg`. An ABSOLUTE reader price
     sits at the TOP of the precedence ladder and suppresses every multiplier beneath it; a
     HISTORICAL pin must restore the registered vector and leave that ladder intact, or a route
     that declares `rentMult` stops applying it and the pinned reading reproduces the wrong
     number. This key replaces the registry value only, in place, below the reader controls. */
  rentRegistryPin: null,
  /* "scoped" = each hardware row takes the overhead its capex SCOPE implies (the T4 rule).
     "legacy-global" = every row takes the scenario `clusterOh`, which is what the engine did
     before the fold — the semantics an archived reading was computed under, and the only reason
     this key exists. It is never offered as a reader control. */
  capexScopeMode: "scoped",
  /* row 499 step 2 (1/2/3-point sliders): the RANGES a reader or an adjudicator declared, keyed by
     dial id. `null` = every dial is a single point, which is what every scenario before this feature
     was, so the arithmetic is untouched: nothing reads this map except the band derivation.
     Shape: { "<dialId>": { lo, mid, hi } } — `mid` is the reader's stated MEDIAN, not a computed
     mean. That choice is evidence-backed rather than stylistic: Khan, Bickel & Hammond (Decision
     Analysis, 2023) find median-characterised distributions fit better than the mode-characterised
     ones the textbook three-point estimate uses, and this page will not synthesize a weighted mean
     it cannot justify. Two-point ranges simply omit `mid`. */
  dialRanges: null,
  util: 50, stackMult: 1.0,
  specDec: 1.0, /* b9 spec-decode LEVER (memo D-SD-6): 1.00 = NO CREDIT. x * 1.0 === x exactly in
     IEEE-754, so the default path is bit-identical to the pre-leg engine. */
  /* d-im-h800 (owner note aca09d, 2026-08-18; Pro review folded): the H800/H100 differential as a
     NAMED, ADJUSTABLE assumption — the FIT-TRANSFER ASSUMPTION. The H800 row is the MEASURED part
     (F1: DeepSeek's production disclosure ran on H800s) and h100/h200 wear its fitted efficiency; the
     fit was obtained on the capped system and MAY include cap-related effects that cannot be
     separately identified. This value is the assumed MINIMUM ratio of an uncapped borrowing row's
     throughput over the SAME row's capped counterfactual (its own constants with the anchor's
     400 GB/s fabric) at the same operating point: T = max(T_raw, r × T_capped-counterfactual). At
     1.00 (this page's default) the model is the historical one, byte-identical (x * 1.0 === x, and
     the neutral key is never encoded). It applies ONLY to rows typed uncapped-*-borrows-capped-fit,
     NEVER to the H800 (its throughput is the measurement) and never to rows with their own anchor
     or another fabric — and it can never stack on an advantage the roofline already renders
     (where the fabric term binds and the H100 is already faster, the floor is already met and
     the disposition says `already-modeled`). Both phases, one ratio, each phase against its own
     counterfactual; disclosed per phase on the leg. */
  nvlinkCapMinRatio: 1.0,
  /* b9 M5 (memo §8.1/§9.1): the two BROAD-UNSPECIFIED lever groups. `trendMonths`/`trendRate`
     are the algorithmic-lead prior (E = trendRate^(trendMonths/12)); applyPresetSettings seeds
     trendMonths from the selected model's LAB (a default, never a user edit — §10.3), so the
     global 0 here is only the no-identity floor. `fam*` are the per-hardware-family efficiency
     multipliers. Both realize as ONE post-roofline throughput multiplier (§8.2, decision D-13). */
  trendMonths: 0, trendRate: 3,
  famNvidia: 1.0, famTpu: 1.0, famTrainium: 1.0, famAscend: 1.0,
  kwh: ED_DC_REGIONS["us-industrial"].usdPerKwh.mid,
  /* im-arc T4 fold (2026-08-24), memo §2: the generic TCO defaults come onto the dated TCO
     evidence. `dcPerW` moves 12 -> 12.5 (the frontier liquid-ready middle over dated JLL /
     Turner & Townsend / Epoch / Abilene anchors), and the facility life that was a LITERAL 12
     inside the shell term becomes the named default `dcLifeYears` with an audited 10/15/20
     band. `pue` is deliberately HELD at 1.25 — the class bands are analyst-set fallbacks and no
     facility receipt establishes a liquid-AI-hall PUE. `opexPct` is a RELABEL only. */
  pue: 1.25, dcPerW: 12.5, lifeYears: 5, dcLifeYears: 15, clusterOh: 1.30, opexPct: 8,
  /* im-arc T4 fold (2026-08-24), memo §2.1 [F6]: capital recovery is an explicit NAMED BASIS
     with ONE canonical default — off — identical across the basic UI, the advanced UI, the v7
     codec and MCP. The advanced tier EXPOSES the basis and its disclosed delta; opening it does
     not activate it, because a display tier may never mutate arithmetic. `off` is inert: the
     increment is multiplied by a zero rate and every pre-fold state is unaffected by it. */
  capitalRecovery: "off", costOfCapitalPct: 8.5,
  priceIn: 5, priceOut: 25, cacheReadMult: 10, cacheWriteShare: 0, cacheWriteMult: 125, batchShare: 15, discount: 5,
  blend: { h100: 10, h200: 15, gb200: 25, gb300: 15, h800: 0, h20: 0, tpu7: 20, trn2: 5, trn3: 10, ascend: 0 },
  subPlan: 200, subUsage: 3200,
};

/* ---------- presets ---------- */
const MODELS = [
  { id: "opus", lab: "anthropic", name: "Claude Opus 4.x", spec: false, nativeTraffic: "reference",
    set: { active: 300, total: 2500, precision: "fp8", priceIn: 5, priceOut: 25 },
    note: "Total: page-adopted 2–3T planning band, scalar 2.5T (adjudicated 2026-07-24) — newer community size estimates; Musk's \"Grok is 0.5T = 1/10 Opus\" (Apr 2026) is re-read as the prior flagship, Opus 4.6 (≈5T, preserved as a labeled size case). Active is the open question — TeorTaxes reads serving speed as \"shockingly few active params\"; 300B is this page's working estimate, not a measured figure. List $5/$25." },
  { id: "sonnet", lab: "anthropic", name: "Claude Sonnet 5", spec: true, nativeTraffic: "reference",
    /* Sonnet tariff. $2/$10 is the STANDARD rate: Anthropic made the launch price permanent on
       2026-08-10 and cancelled the 2026-09-01 step to $3/$15. The prose that used to live here —
       how a stale-loudness alarm fired on schedule demanding a remedy that had been cancelled three
       weeks earlier — is recorded ONCE, in BACKLOG.md section 2, rather than restated across source,
       two test twins, notes and the dossier where the copies can drift apart
       (GPT Pro pr-20260902T175643Z-034d27 finding 9). The schema below is the durable part: current
       / scheduled / verification / history, validated by tests/tariff-contract.mjs, which binds
       current.priceIn/priceOut to what the engine computes with. */
    tariff: {
      current: { priceIn: 2, priceOut: 10, effectiveFrom: "2026-08-10", status: "standard",
                 sources: [
                   { url: "https://platform.claude.com/docs/en/about-claude/pricing", observedAt: "2026-09-02",
                     quote: "The $2/$10 per million input/output token pricing for Claude Sonnet 5, announced at launch as introductory pricing through August 31, 2026, is now the standard price. The previously scheduled increase to $3/$15 per million input/output tokens on September 1, 2026 will not occur." },
                   { url: "https://www.anthropic.com/news/claude-sonnet-5", observedAt: "2026-09-02",
                     quote: "Edit August 10, 2026: Sonnet 5's introductory pricing of $2 per million input tokens and $10 per million output tokens is now permanent. The standard pricing of $3 input / $15 output previously set to take effect September 1 no longer applies." },
                 ] },
      scheduled: [],
      verification: { verifiedAt: "2026-09-02", reverifyBy: "2026-10-02", owner: "inference-margins",
                      procedure: "research/inference-margins/BACKLOG.md section 2 — tariff verification",
                      queueId: "Q-AUTO-2026-08-12" },
      history: [
        { kind: "cancelled-transition", announcedEffectiveFrom: "2026-09-01", priceIn: 3, priceOut: 15,
          cancelledAt: "2026-08-10",
          note: "The page told readers this increase was coming, and a stale-loudness alarm demanded it be applied, for one day after it had already been cancelled." },
        { kind: "superseded-rate", observedAt: "2026-06-30", supersededAt: "2026-08-10",
          quote: "Introductory pricing: $2/$10 per MTok through August 31, 2026; $3/$15 thereafter." },
      ],
    },
    set: { active: 120, total: 1000, precision: "fp8", priceIn: 2, priceOut: 10 },
    note: "Sonnet 5 list pricing $2/$10 — the STANDARD rate, not an introduction: Anthropic made the launch price permanent on 2026-08-10 and the Sep-1-2026 step to $3/$15 was cancelled and never took effect. Sizes carried over from the 4.x-era analysis (Musk post ⇒ ≈1T total; ~120B active estimated) — Sonnet 5's actual architecture is undisclosed, and its tokenizer emits ~30% more tokens for the same text, so per-text comparisons across generations need re-tokenizing." },
  { id: "haiku", lab: "anthropic", name: "Claude Haiku 4.5", spec: true, nativeTraffic: "reference",
    set: { active: 40, total: 350, precision: "fp8", priceIn: 1, priceOut: 5 },
    note: "No public size data — speculative. List $1/$5." },
  { id: "gpt", lab: "openai", name: "GPT-5.6 Sol", spec: true, nativeTraffic: "openai-dive", nativeTrafficWasExplicit: true,
    set: { active: 105, total: 5000, precision: "fp8", priceIn: 4, priceOut: 20, blend: { h100: 20, h200: 25, gb200: 45, gb300: 10 } },
    dive: { rentMult: 0.85, util: 73, stackMult: 0.75, interact: "balanced", batchShare: 0, discount: 0 },
    note: "OpenAI's flagship. Params undisclosed — ~100B active is the community/Epoch estimate the GPT Pro dive corroborated (80% range 50–220B); ~5T total central (1–20T!). List $4/$20 short-context (cached input $0.40, read from the model's own page 2026-09-19; the $5/$30 this row carried until then was superseded); workload = the dive's 7 cached : 2 fresh : 1 output mix; fleet = Hopper/Blackwell across Microsoft/OCI/CoreWeave (blend speculative). Evidence audit: §10." },
  { id: "gemini", lab: "google", name: "Gemini 3.1 Pro", spec: true, nativeTraffic: "reference",
    set: { active: 120, total: 3000, precision: "fp8", priceIn: 2, priceOut: 12, blend: { tpu7: 100 } },
    dive: { rentMult: 0.30, util: 75, stackMult: 0.55, interact: "batch", batchShare: 0, discount: 0 },
    note: "Nobody outside Google knows the sizes — 120B active / 3T total are scenario midpoints (brackets 60–240B / 1–4T). Serves on its own TPUs (blend set to Ironwood; older TPU fleets not modeled) — the dive's derived internal cost ≈ $1.28/chip-hr is the 'dive replay' procurement. List $2/$12 ≤200K. Evidence audit: §10." },
  { id: "grok", lab: "xai", name: "Grok 4.5 (1.5T)", spec: true, lensScenario: true, nativeTraffic: "reference",
    /* Grok tariff. List prices are current and verified; the cached-read multiplier is NOT —
       knownStaleInputs below carries the discrepancy in typed form. Why it is disclosed rather than
       corrected is recorded once, in BACKLOG.md section 2. */
    tariff: {
      current: { priceIn: 2, priceOut: 6, effectiveFrom: "2026-07-08", status: "standard",
                 sources: [
                   { url: "https://docs.x.ai/developers/models/grok-4.5", observedAt: "2026-09-02",
                     quote: "Input $2.00 / Cached input $0.30 / Output $6.00 per 1M tokens (standard tier; a request reaching 200k prompt tokens is billed at $4.00 / $0.60 / $12.00 for all its tokens)." },
                 ] },
      scheduled: [],
      verification: { verifiedAt: "2026-09-02", reverifyBy: "2026-10-02", owner: "inference-margins",
                      procedure: "research/inference-margins/BACKLOG.md section 2 — tariff verification" },
      knownStaleInputs: [
        /* CLOSED 2026-09-10 by owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok. The
           adopted value IS the verified value now; the row is kept rather than deleted because the
           history is the point — this is what a known-stale input looks like from the moment it is
           found to the moment it is ruled on, and the next one should be findable the same way. */
        { field: "set.cacheReadMult", computedValue: 15, verifiedValue: 15, resolvedAt: "2026-09-10",
          resolution: "adopted the verified 15% (owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok)",
          verifiedAt: "2026-09-02", source: "https://docs.x.ai/developers/models/grok-4.5",
          basis: "$0.30 cached / $2.00 input = 15%; the 25% the engine computes with is the $0.50/$2.00 rate published at the 2026-07-08 launch",
          why: "Correcting it moves this preset's numbers and cascades into the T4 historical-reproduction receipts; gated as its own data milestone (BACKLOG section 2), with the exhaustiveness proof already derived." },
      ],
      history: [
        { kind: "superseded-rate", observedAt: "2026-07-08", supersededAt: "2026-09-02",
          quote: "$0.50 cached / $2.00 input = 25%" },
      ],
    },
    set: { active: 200, total: 1500, precision: "fp8", priceIn: 2, priceOut: 6, cacheReadMult: 15, blend: { h100: 45, h200: 5, gb200: 25, gb300: 25 } },
    dive: { rentMult: 0.62, util: 48, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0, ioRatio: 3, cacheHit: 0 },
    note: "Total 1.5T DISCLOSED (Musk: '1.5T V9 foundation model'); MoE per Cursor; ~200B active is speculation (range 100–500B). List $2/$6. Cache reads: 15% ($0.30/$2.00), xAI's first-party rate as read 2026-09-02. Until 2026-09-10 this page computed at 25% ($0.50/$2.00, the Jul 8 2026 launch rate) and disclosed that as a known-stale input; the owner-ruled correction of 2026-09-10 moved it to 15%, and this model's numbers moved with it. Blend mirrors the Colossus fleet — owned, which cuts both ways: cheap at cash-marginal cost, but Anthropic pays xAI ~$5.27/GPU-hr for reserved capacity, a real opportunity cost. Dive replay = full-cycle TCO lens, 3:1 uncached workload. Evidence audit: §10. LENS SCENARIO from 2026-09-19 (Polaris gen60 under owner note note-20260919T142116Z-6b5c83): under the shared rented-capacity lens at this page's 50% utilization this row computes −0.7%, while its own §10 replay of xAI's published operating point computes +63.2% — and the §10 xAI card states ~63%. A negative there is the pairing, not xAI: a rented planning rent applied to a fleet this row itself describes as owned. The shared-lens number is therefore labelled a scenario and is NOT a provider claim; the provider claim for this row is the replay. No input was tuned to move it — the only model-row inputs that would (active, \"speculation (range 100–500B)\" and already at the low end; a blend the row calls speculative) are exactly the ones that must not be." },
  { id: "kimi", lab: "moonshot", name: "Kimi K2.7 Code (1T/32B)", spec: false, diveMetric: "output", nativeTraffic: "reference",
    set: { active: 32, total: 1000, precision: "fp8", priceIn: 0.95, priceOut: 4.00, cacheReadMult: 20, blend: { h800: 70, h20: 30 } },
    dive: { rentMult: 1.0, util: 60, stackMult: 0.83, interact: "balanced", batchShare: 0, discount: 0, ioRatio: 8, cacheHit: 40 },
    note: "DISCLOSED: 1T total / 32B active, 384 experts, selective INT4 weights (595GB checkpoint), no MTP head. List $0.95/$4.00, cache reads 20% of input, batch tier at 60%. Production historically on A800/H800 (Mooncake: >100B tokens/day); current fleet undisclosed — blend speculative. NOTE: the activated §10 replay computes $0.593/M output cost and an 85.2% OUTPUT-TOKEN margin; its blended 72.4% headline uses a Mooncake-like mix the dive itself declined to estimate. Evidence audit: §10." },
  { id: "dsr1", lab: "deepseek", name: "DeepSeek V3/R1 (671B)", spec: false, nativeTraffic: "deepseek-disclosure", nativeTrafficWasExplicit: true,
    set: { active: 37, total: 671, precision: "fp8", priceIn: 0.55, priceOut: 2.19, cacheReadMult: 25, blend: { h800: 100 } },
    dive: { rentMult: 1.14, util: 100, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0 },
    note: "The calibration anchor: open weights (37B active), official serving disclosure (Feb 2025): 73.7k/14.8k tok/s per H800 node (input flow INCLUDING 56.3% disk-cache hits), 3.6:1 I/O, theoretical 545% cost-profit ratio (=84.5% margin) at R1 prices. Blend set to the H800s it actually ran on; cache reads billed at R1's real 25% of input. Paired with the disclosure replay, the live model computes 87.1%, 2.6 points above the disclosed 84.5% — a mismatch, not a validation; v1's exact match was an artifact of two canceling errors." },
  { id: "dsv4", lab: "deepseek", name: "DeepSeek V4 Pro (1.6T/49B)", spec: false, nativeTraffic: "deepseek-disclosure", nativeTrafficWasExplicit: true,
    set: { active: 49, total: 1600, precision: "fp4", priceIn: 0.66, priceOut: 1.98, cacheReadMult: 3.33, blend: { h800: 50, h20: 20, ascend: 30 } },
    dive: { rentMult: 0.857, util: 100, stackMult: 1.05, interact: "batch", batchShare: 0, discount: 0, blend: { h800: 100 } },
    note: "DISCLOSED: 1.6T total / 49B active, selective FP4 (KV stays BF16/FP8). List $0.66/$1.98 OFF-PEAK, $1.32/$3.96 peak (cache reads at a remarkable 3.33% of input) — read from DeepSeek's own pricing page 2026-09-19. The $0.435/$0.87 this row carried until then was the post-75%-cut tariff and DeepSeek had replaced it; at that stale price this row computed −9.1% under the central lens, and the negative was the stale price and nothing else (leg im-vet-model-estimates, 2026-09-19). The activated dive replay (~$1.50/H800-equivalent-hr, their stack) computes 86.5%; doubling both token tariffs — which is now literally the published peak rate — computes 93.2%. §10." },
  { id: "dsv4f", lab: "deepseek", name: "DeepSeek V4-Flash (284B/13B)", spec: false, nativeTraffic: "deepseek-disclosure", nativeTrafficWasExplicit: true,
    set: { active: 13, total: 284, precision: "fp4", priceIn: 0.15, priceOut: 0.60, cacheReadMult: 2, blend: { h800: 50, h20: 20, ascend: 30 } },
    note: "DISCLOSED: 284B total / 13B active, same V4 family (selective FP4). List $0.15/$0.60 OFF-PEAK, $0.30/$1.20 peak, cache reads 2% of input — read from DeepSeek's own pricing page 2026-09-19. The $0.14/$0.28 this row carried until then was superseded, and at that stale price the row computed −11.5% under the central lens and −22.2% under the dive replay; both are positive at the current tariff (leg im-vet-model-estimates, 2026-09-19). NAME WARNING: DeepSeek's pricing page now states that `deepseek-v4-flash` is RETIRED and that the name is served by the Flash model at Flash pricing — this row's label denotes the retired model while the tariff above is the live one. Whether the row is relabelled is a release decision, recorded in research/update-queue.md. Concurrency tier 2,500 (vs Pro's 500). §10." },
  { id: "glm", lab: "zhipu", name: "GLM 5.2 (744B/40B)", spec: false, nativeTraffic: "reference", nativeTrafficWasExplicit: true,
    set: { active: 40, total: 744, precision: "fp8", priceIn: 1.40, priceOut: 4.40, cacheReadMult: 19, blend: { ascend: 40, h800: 40, h20: 20 } },
    dive: { rentMult: 1.9, util: 75, stackMult: 0.60, interact: "balanced", batchShare: 0, discount: 0 },
    note: "DISCLOSED: 744B total / 40B active, BF16/FP8 open checkpoints (Baseten serves an NVFP4 variant abroad at 280+ tok/s/user). Z.ai list $1.40/$4.40, cache reads 19% of input. TRAFFIC DEFAULT CHANGED 2026-09-19 (leg im-vet-model-estimates, owner note note-20260919T142116Z-6b5c83): this row and GLM-4.7 opened on the ncode-informed profile, whose 81,000-token measured mean INPUT is the only absolute length on the page — every other profile falls back to 1,000 — so those two rows were priced at an 86,062-token decode context while every other row sat near 15,500, and this one rendered −36.5% under the central lens and −153.2% under its replay. Both are a statement about one power user's observed week, not about Zhipu. The default is now the page's Reference 15:1 / 60% convention (+63.0% shared lens, +31.3% replay); the ncode profile is unchanged and still selectable, which is where that week belongs. Zhipu's audited FY2025 cloud/API gross margin: 18.9%. Domestic blend speculative — nine platforms named. The capped replay computes 63.0% under the central lens and 31.3% under the dive at the Reference basis; full-memory fit and SLO remain unverified, so these are policy-unclean scenario outputs. The historical ~35–77% §10 sensitivity is archival external analysis, not reproduced by this engine. §10." },
  { id: "glm47", lab: "zhipu", name: "GLM-4.7 (355B/32B)", spec: false, lensScenario: true, lensScenarioNoReplay: true, nativeTraffic: "reference", nativeTrafficWasExplicit: true,
    set: { active: 32, total: 355, precision: "fp8", priceIn: 0.60, priceOut: 2.20, cacheReadMult: 18, blend: { ascend: 40, h800: 40, h20: 20 } },
    note: "DISCLOSED: 355B total / 32B active, BF16/FP8 open checkpoints — Z.ai's recommended workhorse (Coding Plan routes routine work here). List $0.60/$2.20: a materially different price floor than GLM-5.2's $1.40/$4.40, which is why it ships as its own preset. Blend speculative as with 5.2. TRAFFIC DEFAULT CHANGED 2026-09-19 with GLM 5.2 (see that row): ncode → Reference, which moves this row from −666.5% to −39.3%. IT IS STILL NEGATIVE AND THAT IS NOT A CLAIM ABOUT Z.AI. Two things drive it. First, this is the only lab row on the page with NO dive block, so its §10 \"replay\" silently falls back to the shared central lens and was never a provider estimate. Second, GLM-4.7 is GQA — 92 layers × 8 KV heads × 128 head-dim = 188,416 bytes of KV per context token at FP8, against DeepSeek's MLA 35,136 — so at any long context it is bandwidth-bound where an MLA model is not. That is a fact about attention design, not about whether Z.ai covers its costs; Zhipu's audited FY2025 cloud/API cloud gross margin is 18.9%. No single sourced input clears zero here (published low-end domestic rents give −22%, utilization 70 gives 0.0%, the two together +13%), and stacking favourable ends to reach a positive number is not something this page does. DISPOSITION 2026-09-19 (Polaris gen60): this row's shared-lens number is labelled a LENS SCENARIO and is NOT adopted as a margin estimate. It has no §10 replay, so unlike grok it has no provider claim at all — scenario only. §10." },
  { id: "terra", lab: "openai", name: "GPT-5.6 Terra (tariff scenario)", spec: true, scenario: true, nativeTraffic: "openai-dive", nativeTrafficWasExplicit: true,
    set: { active: 50, total: 1000, precision: "fp8", priceIn: 2, priceOut: 12, cacheReadMult: 10, blend: { h100: 20, h200: 25, gb200: 45, gb300: 10 } },
    note: "TARIFF SCENARIO: the price ($2/$12, read 2026-09-19 — half of Sol's input and 60% of its output; the $2.50/$15 this row carried until then was superseded, and so was the \"exactly half of Sol\" reading of it) is the only identified quantity. Sizes are scenario values from the OpenAI dive's ranges (~1T/50B central; 0.25–5T / 20–110B) — Terra need not be a half-sized Sol, and back-inferring size from price is circular. Excluded from the normalized table. §10." },
  { id: "luna", lab: "openai", name: "GPT-5.6 Luna (tariff scenario)", spec: true, scenario: true, nativeTraffic: "openai-dive", nativeTrafficWasExplicit: true,
    set: { active: 20, total: 250, precision: "fp8", priceIn: 0.20, priceOut: 1.20, cacheReadMult: 10, blend: { h100: 20, h200: 25, gb200: 45, gb300: 10 } },
    note: "TARIFF SCENARIO: $0.20/$1.20 list (95% below Sol; read from the model's own page 2026-09-19) and ~205–229 measured user-stream tok/s are the identified quantities. The $1/$6 this row carried until then was FIVE TIMES the live tariff and it overstated this row's shared-lens headline by 48 points — 88% at the stale price, 40% at the real one (leg im-vet-model-estimates, 2026-09-19). Sizes are scenario values (~0.25T/20B central; 0.05–1.5T / 8–50B) — Luna could equally be a large model with aggressive distillation or speculative decoding. Excluded from the normalized table. §10." },
  { id: "gemflash", lab: "google", name: "Gemini 3.5 Flash (tariff scenario)", spec: true, scenario: true, nativeTraffic: "reference", nativeTrafficWasExplicit: true,
    set: { active: 20, total: 600, precision: "fp8", priceIn: 1.50, priceOut: 9, cacheReadMult: 10, blend: { tpu7: 100 } },
    note: "TARIFF SCENARIO: $1.50/$9 list is the identified quantity; a memorization-based preprint puts the PRECEDING Gemini 3 Flash at a 405B-total LOWER BOUND, and speed-based guesses run 250–300B total / 10–16B active — all very low confidence. A fast-tier comparator, not a frontier estimate; excluded from the normalized table. §10." },
  // Custom (2026-07-12): a blank scratch model — no provider, nothing sourced. The user defines the
  // architecture/hardware/traffic/pricing entirely with the sliders. Neutral Reference traffic.
  { id: "custom", lab: null, name: "Custom (define with sliders)", spec: false, nativeTraffic: "reference",
    set: { active: 100, total: 1000, precision: "fp8", priceIn: 3, priceOut: 15 },
    note: "A blank scratch model — no provider, nothing here is sourced. Define every architecture, hardware, traffic and pricing assumption yourself with the sliders. Starting point: 100B active / 1T total / FP8, list $3/$15, Reference 15:1/60% traffic." },
];

/* ---------- b9 M5: the algorithmic-lead (trend-line) registry (plan §3, RATIFIED) ----------
   These numbers are OWNER-RATIFIED scenario priors (ruling im-algo-lead-defaults 2026-07-25T18:19Z,
   folded into the im-algo-lead REPORT §8/§8a/§8b/§8c). They are never re-derived here and never
   re-litigated in code. Rate: 3×/yr (halving 7.57 mo), E = rate^(months/12), cost-out ÷ E.
   REFUSED rates: the price series (9×–900×/yr — Epoch price index, a16z 10×, AI Index 280×)
   measure TARIFFS, not serving efficiency; the UI carries that refusal permanently (§9.5).
   Axis discipline (plan §6.7): capability lag (~4 months, Epoch-measured) is a DIFFERENT axis —
   on the efficiency axis the open Chinese labs DEFINE the published-SOTA zero. */
const TREND_RATES = Object.freeze([2, 3, 5]);          // ×/yr; 3 is the ratified default
const TREND_MONTHS_BOUNDS = Object.freeze([-12, 12]);  // below zero permitted (ruling + §8c)
const TREND_SOFT_WARN_MONTHS = 6;                      // soft warning past ±6 (§8c)
const TREND_DEFAULTS = Object.freeze({
  anthropic: 3, openai: 3, google: 3, // closed-lab ratified defaults
  deepseek: 1,                        // +1 recommended, +2 documented as a defensible top
  zhipu: 0, moonshot: 0,              // other frontier Chinese: published open SOTA defines zero
  xai: 0,                             // no ratified prior — labeled unassessed
});
const TREND_LAB_NOTES = Object.freeze({
  xai: "no ratified prior — unassessed",
  __null: "no lab — user scenario",
});
const TREND_GROUP_KEYS = Object.freeze(["trendMonths", "trendRate"]);
const FAMILY_GROUP_KEYS = Object.freeze(["famNvidia", "famTpu", "famTrainium", "famAscend"]);
/* Hardware family → state key. A family absent from this map (today only "unclassified", the
   fully-custom leg tag) is EXEMPT from family sliders and discloses the exemption on the leg
   (D-5 verbatim, memo §8.3). */
const FAMILY_STATE_KEY = Object.freeze({ nvidia: "famNvidia", tpu: "famTpu", trainium: "famTrainium", ascend: "famAscend" });
const FAMILY_BOUNDS = Object.freeze([0.50, 1.50]);
const INTERLOCK_STATES = Object.freeze(["free", "locked-trend", "locked-family", "unlocked"]);
/* SPECIFIED levers (Amendment 2): explicitly-modeled controls that the interlock NEVER locks.
   Overlap with a nonzero trend is surfaced as a non-blocking warning, never a disable (§10.5a). */
const SPECIFIED_LEVER_KEYS = Object.freeze(["precision", "interact", "cacheHit", "cacheCost", "billCacheHit", "specDec", "nvlinkCapMinRatio"]);
function trendLabOf(m) { return (m && typeof m.lab === "string") ? m.lab : null; }
/* The RATIFIED default months for a model's lab. An unmapped lab resolves to 0 — the same
   conservative floor as "no ratified prior", never an invented prior. */
function trendDefaultMonths(m) {
  const lab = trendLabOf(m);
  if (!lab) return 0;
  return Object.prototype.hasOwnProperty.call(TREND_DEFAULTS, lab) ? TREND_DEFAULTS[lab] : 0;
}
function trendLabNote(m) {
  const lab = trendLabOf(m);
  if (!lab) return TREND_LAB_NOTES.__null;
  if (Object.prototype.hasOwnProperty.call(TREND_LAB_NOTES, lab)) return TREND_LAB_NOTES[lab];
  return Object.prototype.hasOwnProperty.call(TREND_DEFAULTS, lab) ? null : "no ratified prior — unassessed";
}
/* The FREE-state trend baseline for an identity (memo §10.2). A replay's baseline is 0: the
   lab's actual efficiency is already inside a published operating point, so the prior is inert
   there (§9.4) and applyPresetSettings seeds 0. */
function trendBaselineFor(m, p) {
  if (p && p.kind === "replay") return 0;
  /* row 499 (owner ruling 0c8102): a preset that CARRIES an adjudicator's own lead treatment
     declares it here, typed, instead of inheriting the lab default. This is what lets the page-open
     default sit at zero lead ("Pro doesn't believe there's an algorithmic lead time — that's fine")
     while a preset built from an estimate that DOES endorse the prior seeds its own months. It is a
     DEFAULT, never a user edit — the dial stays free from every preset, which is the point. */
  if (p && typeof p.trendBaseline === "number") return p.trendBaseline;
  return trendDefaultMonths(m);
}
/* ---------- b9 M5: the INTERNAL REFERENCE PIN (memo §15, decision D-10) ----------
   M5 moves the DEFAULT state onto the ratified prior (+3 for the closed labs). Two engine
   derivations build their own reference states internally and would silently re-base onto that
   prior before M6 ships the labeled two-reading FA surface:
     (1) finalAnswer() — its planning state, lensSpan's per-lens states, every trafficContributors
         state, and the policy-band / membership evaluations those feed (§15 verbatim);
     (2) formCorrectionSpanComputed() — the flagship-baseline FORM-swing disclosure, whose own
         prose asserts "BOTH ends fall outside the plan's 55.24-61.25 sanity tripwire". Left
         unpinned it would conflate the equation-FORM axis with the lab-lead axis (plan §6.7).
   ONE constructor pins both, applied immediately after EVERY internal applyPresetSettings those
   computations perform. A pinned reference state carries NO interlock machine state: the §10
   machine governs UI reachability and token validity, and an internal engine derivation is
   neither saved nor shared, so it sits outside the machine by construction (v2.1 §15 fold —
   this is why the §10.2 FREE invariant is never contradicted by a trend-0 pin). */
const REFERENCE_LEVER_PIN = Object.freeze({ trendMonths: 0, trendRate: 3,
  famNvidia: 1.0, famTpu: 1.0, famTrainium: 1.0, famAscend: 1.0, specDec: 1.0,
  nvlinkCapMinRatio: 1.0 /* d-im-h800: pinned like specDec — the reference states carry the page's own assumption */ });
function pinReferenceLevers(s) { Object.assign(s, REFERENCE_LEVER_PIN); return s; }

/* ---------- b9 M5: the INTERLOCK state machine (memo §10, D-5 + Amendment 2) ----------
   Two BROAD-UNSPECIFIED lever groups exist — the family multipliers and the algorithmic-lead
   prior. Both describe "unspecified efficiency we did not otherwise model", so composing them
   silently would double-count the SAME improvement. The machine binds exactly those two groups
   and NEVER the SPECIFIED levers (precision / serving regime / cache controls — Amendment 2):
   an explicitly-modeled lever is never locked, only overlap-warned (§10.5).

   Per-state invariants (enforced here, in the UI, AND in the codec — memo §6.3):
     FREE          trend == the identity's ratified baseline AND every fam == 1.0
     LOCKED_TREND  trend == 0 (the machine ZEROES it on entry); fams free within bounds
     LOCKED_FAMILY every fam == 1.0; trend free within bounds
     UNLOCKED      unconstrained; persistent stacking banner

   The ZEROING rule (decision D-12) is what makes the M5 acceptance sentence — "no reachable UI
   state stacks family × trend silently" — true even though the ratified defaults START nonzero:
   the first family edit REPLACES the broad prior rather than riding on top of it, and says so in
   one attributed line, so every headline move remains attributable. */
function famAtBaseline(s) { return FAMILY_GROUP_KEYS.every(k => Number(s && s[k]) === 1); }
function trendAtBaseline(s, baselineMonths) {
  return Number(s && s.trendMonths) === Number(baselineMonths)
      && Number(s && s.trendRate) === DEFAULTS.trendRate;
}
function interlockInvariantHolds(state, s, baselineMonths) {
  switch (state) {
    case "free": return trendAtBaseline(s, baselineMonths) && famAtBaseline(s);
    case "locked-trend": return Number(s && s.trendMonths) === 0;
    case "locked-family": return famAtBaseline(s);
    case "unlocked": return true;
    default: return false;
  }
}
/* The transition function. `group` is the group the slider machinery just WROTE ("trend" |
   "family"); `s` is the POST-edit state. Returns the next state plus whether the caller must
   apply the zeroing effect (and the attributed line to render for it). Pure: the caller owns
   the mutation, so tests walk the machine with no DOM. */
function interlockAfterEdit(current, group, s, baselineMonths) {
  const noop = { next: current, zeroTrend: false, note: null };
  if (!INTERLOCK_STATES.includes(current)) return { next: "free", zeroTrend: false, note: null };
  if (current === "unlocked") return noop;                       // both groups editable; banner persists
  if (current === "locked-trend" || current === "locked-family") return noop; // owning-group edits hold the invariant
  // FREE: an edit that LANDS ON the baseline changes nothing, so it changes no state (§10.2 row 3).
  if (group === "family") {
    if (famAtBaseline(s)) return noop;
    return { next: "locked-trend", zeroTrend: true,
      note: "Family edit replaces the broad algorithmic-lead prior — trend set to 0 and locked; Unlock to stack both deliberately." };
  }
  if (group === "trend") {
    if (trendAtBaseline(s, baselineMonths)) return noop;
    return { next: "locked-family", zeroTrend: false,
      note: "Algorithmic-lead edit locks the family multipliers — the two are broad, unspecified improvements of the same kind; Unlock to stack both deliberately." };
  }
  return noop;
}
/* Defensive closure over interlockAfterEdit. A locked group's controls are DISABLED, so a value
   in that group cannot move through the UI — but the machine must never leave standing a state
   whose own invariant it violates. If one ever arrives (a hand-edited store, a future call site),
   re-derive the state the values actually represent; that lands UNLOCKED for a genuine stack,
   which renders the persistent banner. Fail loud, never quietly mislabeled. */
function interlockAfterEditChecked(current, group, s, baselineMonths) {
  const r = interlockAfterEdit(current, group, s, baselineMonths);
  const after = Object.assign({}, s, r.zeroTrend ? { trendMonths: 0 } : null);
  if (interlockInvariantHolds(r.next, after, baselineMonths)) return r;
  return { next: deriveInterlockFor(after, baselineMonths), zeroTrend: r.zeroTrend,
    note: r.note || "Lever state re-derived — the previous machine state could not describe these values." };
}
const INTERLOCK_UNLOCK_WARNING = "you are now stacking two broad unspecified improvements";
function interlockGroupOf(key) {
  if (TREND_GROUP_KEYS.includes(key)) return "trend";
  if (FAMILY_GROUP_KEYS.includes(key)) return "family";
  return null;
}
function interlockLockedGroup(state) {
  return state === "locked-trend" ? "trend" : state === "locked-family" ? "family" : null;
}
const INTERLOCK_WHY = Object.freeze({
  trend: "locked to prevent stacking broad multipliers — a family multiplier is already carrying the unspecified-efficiency assumption",
  family: "locked to prevent stacking broad multipliers — the algorithmic-lead prior is already carrying the unspecified-efficiency assumption",
});
/* Overlap warnings (§10.5) — NON-BLOCKING, never disable anything. (a) a nonzero trend beside a
   SPECIFIED lever moved off its identity default; (b) trend > 0 beside stackMult > 1.0 (the
   redefined composition-stress tick, §11.3). `baseState` is applyPresetSettings for the current
   identity — the honest "its identity default" comparator. */
function leverOverlapWarnings(s, baseState, baselineMonths) {
  const out = [];
  if (!s) return out;
  /* The hazard Amendment 2 names is a LIVE prior overlapping an explicitly-modeled lever, so the
     trigger is E ≠ 1 (months ≠ 0), not "months ≠ the lab default". Stated refinement, both ways:
     at 0 months there is no prior to double-count (and 0 is a DELIBERATE reachable state since the
     D-12 zeroing rule, which postdates the memo's phrasing), while a prior sitting at its nonzero
     RATIFIED default is fully live — the literal "≠ default" test would have missed the most
     common case of all. Recorded in the M5 delta manifest. */
  const trendMoved = Number(s.trendMonths) !== 0;
  if (trendMoved && baseState) {
    const moved = SPECIFIED_LEVER_KEYS.filter(k => JSON.stringify(s[k]) !== JSON.stringify(baseState[k]));
    if (moved.length) out.push({ kind: "specified-lever", keys: moved,
      text: "the algorithmic-lead prior is nonzero AND a specified lever (" + moved.join(", ")
        + ") is off its identity default — extreme quantization may be represented through either path, not both silently" });
  }
  if (Number(s.trendMonths) > 0 && Number(s.stackMult) > 1.0) out.push({ kind: "stackmult",
    text: "the algorithmic-lead prior is above 0 AND serving-stack efficiency is above 1.0× — both now measure gains relative to the SAME published-open-practice baseline, so part of the improvement may be counted twice" });
  return out;
}
/* The ONE interlock/token consistency rule (memo §6.3), shared by the ENCODER — which must never
   mint a token its own decoder rejects (the M4 P0-1 lesson) — and the DECODER. `resolved` is the
   post-diff lever vector the token actually restores.

   Baseline note (enactment finding, recorded for the gate). A MODIFIED identity has NO identity
   default to compare a trend value against, and the months it carries are INHERITED state, not a
   derivation: the origin perspective's kind is unrecoverable (`_meta.modified.from` is a display
   NAME, not an id — app.js downgradeReplayToModified), and a saved scenario legitimately restores
   one model's months under a DIFFERENT model (restoreSavedPresetState, snapshots §1). FREE on the
   modified branch therefore constrains what a machine state can actually assert — every fam at
   1.0 and the rate at its default, i.e. NEITHER group has been user-edited — and leaves the
   inherited months free. The anti-stacking guarantee is untouched: FREE still requires EVERY fam
   == 1.0, so no FREE token can carry a family × trend stack. The CLEAN branch keeps the exact
   §10.2 invariant, because a clean identity always re-derives its months from applyPresetSettings. */
/* The ONE closed-domain check for the M5 lever fields (memo §6.3), shared by the DECODER (which
   rejects a forged token whole) and the ENCODER (which must never mint a token its own decoder
   would reject — the M4 P0-1 lesson, extended at gate round 1 P1: the encoder previously validated
   only the interlock stamp, so a pure-engine consumer holding an out-of-domain lever value could
   mint a link that copied successfully and then silently failed to restore). Returns null when the
   object is in domain, else the offending field's reason. Fields absent from `o` are not checked —
   a token diff carries only what differs, and the decoder's resolved base supplies the rest. */
function leverDomainViolation(o) {
  if (!o || typeof o !== "object") return "lever container";
  if ("trendMonths" in o && !(typeof o.trendMonths === "number" && Number.isInteger(o.trendMonths)
      && o.trendMonths >= TREND_MONTHS_BOUNDS[0] && o.trendMonths <= TREND_MONTHS_BOUNDS[1]))
    return "trendMonths (integer " + TREND_MONTHS_BOUNDS[0] + ".." + TREND_MONTHS_BOUNDS[1] + ")";
  if ("trendRate" in o && !(typeof o.trendRate === "number" && TREND_RATES.includes(o.trendRate)))
    return "trendRate (one of " + TREND_RATES.join("/") + ")";
  for (const fk of FAMILY_GROUP_KEYS) {
    if (fk in o && !(typeof o[fk] === "number" && isFinite(o[fk])
        && o[fk] >= FAMILY_BOUNDS[0] && o[fk] <= FAMILY_BOUNDS[1]))
      return fk + " (finite " + FAMILY_BOUNDS[0] + ".." + FAMILY_BOUNDS[1] + ")";
  }
  /* b9 spec-decode LEVER (memo §11). The per-field closed domain only — the D-SD-7 gate is a
     CROSS-FIELD rule between specDec and stackMult and cannot live in a function that sees a diff
     carrying only what differs. It is `specDecTokenConsistent`, which encoder and decoder also
     share. Both checks are needed: this one rejects an out-of-domain value, that one rejects an
     in-domain value the gate forbids. */
  if ("specDec" in o && !(typeof o.specDec === "number" && isFinite(o.specDec)
      && o.specDec >= SPECDEC_BOUNDS[0] && o.specDec <= SPECDEC_BOUNDS[1]))
    return "specDec (finite " + SPECDEC_BOUNDS[0].toFixed(2) + ".." + SPECDEC_BOUNDS[1].toFixed(2) + ")";
  /* d-im-h800: the fit-transfer assumption's closed domain. Per-field only — it has no cross-field gate. */
  if ("nvlinkCapMinRatio" in o && !(typeof o.nvlinkCapMinRatio === "number" && isFinite(o.nvlinkCapMinRatio)
      && o.nvlinkCapMinRatio >= NVLINKCAP_BOUNDS[0] && o.nvlinkCapMinRatio <= NVLINKCAP_BOUNDS[1]))
    return "nvlinkCapMinRatio (finite " + NVLINKCAP_BOUNDS[0].toFixed(2) + ".." + NVLINKCAP_BOUNDS[1].toFixed(2) + ")";
  return null;
}
function interlockTokenConsistent(interlock, resolved, m, p, isModified) {
  if (!INTERLOCK_STATES.includes(interlock)) return false;
  // Replay lock-at-0 is unconditional — it binds in every machine state, including UNLOCKED.
  if (p && p.kind === "replay" && Number(resolved.trendMonths) !== 0) return false;
  if (interlock === "free" && isModified)
    return famAtBaseline(resolved) && Number(resolved.trendRate) === DEFAULTS.trendRate;
  return interlockInvariantHolds(interlock, resolved,
    interlock === "free" ? trendBaselineFor(m, p) : 0); // non-FREE invariants consult no baseline
}
/* A token minted BEFORE the machine existed (any v5 link) carries no `_meta.interlock`, so there
   is no user choice to preserve and the honest move is to RECONSTRUCT the machine state its
   values represent — never to assume FREE, which would let a hand-injected v5 lever vector render
   a stacked state with no banner. Total by construction: every branch yields a state whose §10.2
   invariant holds for the values given. (v6 tokens always carry the field and never come here —
   §10.4: UNLOCKED-at-defaults is reachable and only an explicit field preserves it.) */
function deriveInterlockFor(s, baselineMonths) {
  const famBase = famAtBaseline(s);
  if (trendAtBaseline(s, baselineMonths) && famBase) return "free";
  if (famBase) return "locked-family";                       // trend moved, family untouched
  if (Number(s.trendMonths) === 0) return "locked-trend";     // family moved, trend already at 0
  return "unlocked";                                          // both moved — banner renders
}

const PERSPECTIVES = [
  { id: "median", kind: "lens", name: "[lens] Central scenario (Claude)",
    procurementBasis: "committed-planning-rent",
    set: { hwMode: "rent", rentMult: 1.0, util: 50, stackMult: 1.0, interact: "balanced", batchShare: 15, discount: 5 },
    note: "This page's central scenario (an analyst synthesis, not a distributional median): the registered heterogeneous low/committed planning-rate vector (not a purchasable market-rate basket), 50% fleet utilization, current open-source-level serving stack, balanced latency. Provider-specific pricing comes from the model preset. See report §5." },
  { id: "dive", kind: "replay", name: "[replay] §10 dive (this model)",
    procurementBasis: "model-dive",
    set: {},
    note: "Replays the selected model's §10 provider-dive central assumptions (procurement, utilization, workload) so the calculator reproduces that card's headline within about a point. Models without a §10 card fall back to this page's central scenario." },
  /* ---- range-exploration configs (v2.1.3 preset redesign, M2; PRUNED per owner clarification
     2026-07-11) ----
     Each surviving config REVERSE-ENGINEERS a real popular-discourse position — a page-authored
     reconstruction of ONE route into a margin range the discourse points at. The manufactured
     v1/v2/v3 filler grid was removed (owner: keep only discourse-tied routes). Explicitly NOT the
     claimant's own cost model (owner attribution-hygiene point). The 60–80% bucket carries ZERO
     configs by design: the central "median" lens is that bucket's own anchor. (Wording updated
     2026-07-12: the evidence pass added claim RECORDS that touch 60–80 — the ~70–75% reported/
     modeled cluster and one low-credibility token-SKU interval — but still no exploration config.)
     RE-ATTRIBUTED 2026-08-16 (owner notes aa315c + c72950: "doesn't have the scenarios I wanted
     anymore… no ~95% margins Teortaxes scenario, or any other analyst scenario — which was a
     large part of why we designed this calculator in the first place"). P0-4 de-named these four
     completely — names lived only on MARGIN_CLAIMS records — and the effect was that the routes
     stopped saying WHOSE POSITION they reverse-engineer, which is the thing they exist to do.
     What comes back is the ATTRIBUTION, not the misattribution P0-4 was right to remove:
       · the CLAIM is the named person's, quoted verbatim, with its url and date, in the claims
         registry this `claimAnchor` points at;
       · the VECTOR is still entirely this page's, and every note still says so in terms.
     That distinction is the whole of the fix, and it is why `claimAnchor` is a pointer into
     MARGIN_CLAIMS rather than free text: a route cannot claim an attribution the claims registry
     does not carry. The public-figure exception (owner ruling 2026-07-12) covers naming analysts
     on their published positions, which is exactly and only what these fields do.
     Ids and SUBTITLES are unchanged — permalinks and browser assertions both bind to them.
     kind:"exploration" composes like a lens: no traffic keys, no
     model-owned overrides (blend fills silent models only), excluded from the scenario-preset span.
     Range membership is COMPUTED at the flagship scope (Opus 4.x @ explicit Reference 15:1/60%)
     via explorationComputedBucket() — never hand-set. Ordering basis (P0-7): "fewest changed
     registry fields from the central configuration", stable id tie-break.
     All four surviving vectors are byte-identical to retired analyst-reconstruction presets and
     ARE the permalink migration anchors (RETIRED_PERSPECTIVES at the bottom of this file:
     teortaxes→x80-v3, zephyr→x80-v4, semi→x90-v1, skeptic→x60-v3). Ids are permalink-load-bearing;
     do NOT renumber. The batch/high-occupancy mechanism named in the discourse ("increase the
     batch size … drive margins from 90% to 95%") does NOT reach ≥90% at the page's base
     planning-rate vector in this engine (it tops out ~87–89%); the strategic-rate configs that did
     clear 90% were procurement stories, not the batch mechanism, so they were dropped rather than
     mislabeled as the batch route.
     THAT DROP IS RECONSIDERED, 2026-08-16, and x90-v2 is the answer instead. Dropping the batch
     route because it fell short left the page unable to answer the one question it was built to
     answer — "what would 90→95% take?" — for the most-quoted claim on it. A route that lands
     BELOW the range it was authored for is a supported, disclosed state here (x90-v1 already
     computes ≈89.1 at the flagship scope and says so), so the honest move is to SHOW the
     mechanism and where it actually lands, not to withhold it. x90-v2 applies the claim's own
     lever — and only that lever — to the one route that does reach ≥90%, and the answer is that
     it is worth ≈1.2 points at the ratified default, against the ≈5 the claim asserts. */
  { id: "x90-v1", kind: "exploration", name: "[analyst route · SemiAnalysis / Dylan Patel] ≥90% · owned-TCO estate route", subtitle: "owned-TCO estate route",
    claimAnchor: { who: "SemiAnalysis / Dylan Patel", claimIds: ["patel-80-floor"],
      mechanism: "owned/committed estate — build-cost, not rental markup" },
    loadScope: "opus",
    procurementBasis: "owned-strategic-tco",
    authoredRange: { lo: 90, hi: Infinity }, // R3 D-2e: FIXED authorship metadata (never parsed from the name); integrity discloses against THIS, computed bucket = board grouping only
    /* im-arc T2 (memo §6, 2026-08-22): pinned at the pre-T2 default so the
       archived reading reproduces; the generic default moved 2026-08-22. */
    set: { hwMode: "tco", kwh: 0.07,
      /* im-arc T4 fold (2026-08-24), memo §6 [F10]: the PIN BUNDLE for this ARCHIVED reading. T2
         pinned only the electricity default; T4 moves the facility life, the datacenter capex per
         watt, four capex points and the cluster-overhead SEMANTICS, so an archived reading needs
         all of them stated to reproduce. Every value below is the pre-T4 default on merged master
         ad7a214, and the whole bundle is enumerated in tests/fixtures-t4-declared-delta.json. */
      dcPerW: 12, dcLifeYears: 12, capexScopeMode: "legacy-global", capitalRecovery: "off",
      capexAbsLeg: { h100: 25000, h200: 32000, gb200: 45000, gb300: 55000, h800: 40000,
        h20: 20000, tpu7: 35000, trn2: 15000, trn3: 20000, ascend: 23000 },
      rentRegistryPin: { h100: 2.40, h200: 2.90, gb200: 4.50, gb300: 6.00, h800: 1.75, h20: 1.00,
        tpu7: 5.40, trn2: 2.235, trn3: 2.20, ascend: 1.95 }, util: 55, stackMult: 1.1, interact: "balanced", batchShare: 15, discount: 5 },
    /* im-arc T4 fold (2026-08-24), memo §6 [F10]: which of this route's set keys are the
       historical PIN BUNDLE rather than authored levers. Consumed by the exploration ranking so
       a route that must state six migration values to keep reproducing is not thereby ranked as
       a six-lever route. */
    migrationPins: ["kwh", "dcPerW", "dcLifeYears", "capexScopeMode", "capexAbsLeg", "capitalRecovery", "rentRegistryPin"],
    note: "PAGE-AUTHORED RECONSTRUCTION of one route to a ≥90% modeled unit margin — the ≥90% owned-TCO story in the discourse (a lab that owns/commits its fleet pays build-cost, not rental markup). The fleet is costed as a well-run owned estate (hourly cost from capex, power, datacenter, opex) at 55% occupancy with a 1.1× stack-COMPOSITION stress (b9 M5 §11.4 relabel, value unchanged: measured composition relative to published open practice; what a frontier lab's private stack might add lives on the algorithmic-lead slider, not here). This is this page's own route, NOT any external party's cost model; no external party selected this vector. Range membership is computed at the flagship scope, never enforced." },
  { id: "x80-v3", kind: "exploration", name: "[analyst route · TeorTaxes] 80–90% · 1.0× planning-rate vector, aggressive stack, throughput", subtitle: "1.0× planning-rate vector, aggressive stack, throughput",
    claimAnchor: { who: "TeorTaxes (@teortaxesTex)",
      claimIds: ["teortaxes-80-inference-2025", "patel-80-floor"],
      mechanism: "cheap rented capacity, big batches, top-decile serving software" },
    loadScope: "opus",
    procurementBasis: "committed-planning-rent",
    authoredRange: { lo: 80, hi: 90 }, // R3 D-2e
    set: { hwMode: "rent", rentMult: 1.0, util: 70, stackMult: 1.25, interact: "batch", batchShare: 10, discount: 0 },
    note: "PAGE-AUTHORED RECONSTRUCTION of one route into the 80–90% range the discourse points at (a floor 'north of 80%' for Opus API tokens; an earlier ~80% inference-only read — both verbatim in the claims registry): the page's heterogeneous planning-rate vector at 70% occupancy, an aggressive stack COMPOSITION (a page-set 1.25× on the published-open-practice baseline — a composition stress with no measured distribution behind it, and not a claim about any lab's private stack; b9 M5 §11.4 relabel, value unchanged), throughput-first serving, minimal off-list billing. This is this page's own route, NOT any external party's cost model; no external party selected this vector. Range membership is computed at the flagship scope, never enforced." },
  { id: "x80-v4", kind: "exploration", name: "[analyst route · Zephyr] 80–90% · 0.9× planning-rate vector, above-baseline stack", subtitle: "0.9× planning-rate vector, above-baseline stack",
    claimAnchor: { who: "Zephyr (@zephyr_z9)", claimIds: ["zephyr-9095-unnamed"],
      mechanism: "sub-market committed rates with a near-top serving stack" },
    loadScope: "opus",
    procurementBasis: "committed-planning-rent",
    authoredRange: { lo: 80, hi: 90 }, // R3 D-2e
    set: { hwMode: "rent", rentMult: 0.9, util: 65, stackMult: 1.15, interact: "batch", batchShare: 10, discount: 0 },
    note: "PAGE-AUTHORED RECONSTRUCTION of a second route into the 80–90% discourse range: a page-set 0.9× multiplier on the heterogeneous planning-rate vector, 65% occupancy, an above-baseline stack composition (1.15×, page-set — a composition stress against published open practice, and not a claim about any lab's private stack; b9 M5 §11.4 relabel, value unchanged), throughput-first serving. This is this page's own route, NOT any external party's cost model; no external party selected this vector. Range membership is computed at the flagship scope, never enforced." },
  { id: "x60-v3", kind: "exploration", name: "[analyst route · FleetingBits] <60% · reported-margin inverse diagnostic", subtitle: "reported-margin inverse diagnostic",
    claimAnchor: { who: "FleetingBits", claimIds: ["fleetingbits-4050-reported"],
      mechanism: "hyperscaler-marked-up compute, low occupancy, real discounting" },
    loadScope: "opus",
    procurementBasis: "committed-planning-rent",
    authoredRange: { lo: -Infinity, hi: 60 }, // R3 D-2e (open low end via -Infinity — the shared half-open algebra needs no special case)
    set: { hwMode: "rent", rentMult: 1.6, util: 35, stackMult: 0.85, interact: "balanced", batchShare: 25, discount: 20 },
    note: "PAGE-AUTHORED RECONSTRUCTION tied to the reported/accounting <60% discourse (reported ~40–50% frontier inference margins; a reported ~40% company gross-margin projection — both verbatim/records in the claims registry and §7): it stress-tests whether higher page-set direct-serving cost and a lower effective price can reproduce those figures — a page-set 1.6× multiplier on the heterogeneous planning-rate vector (not hyperscaler list rates), peak-provisioned occupancy (35%), a below-baseline stack (0.85×), a 25% batch mix and 20% discounting. It computes −40.3% at the public-evidence reference (an algorithmic lead of 0 months; the calculator's own default reading carries the ratified prior and reads higher), far below the reported 40–50% band: that distance is a failed unit-margin inversion, not agreement with or falsification of a reported company gross margin. This is this page's own diagnostic, NOT any external party's cost model; no external party selected this vector. Range membership is computed at the flagship scope, never enforced." },
  /* x90-v2 — THE ~95% ROUTE, added 2026-08-16 (owner notes aa315c + c72950: "no ~95% margins
     Teortaxes scenario"). The most-quoted claim on this page names a MECHANISM, not just a
     number: "they'll just increase the batch size, have the same speed, and drive margins from
     90% to 95%" (teortaxes-9095-conditional, 2026-06-27). This calculator has that lever, so it
     can answer the claim on the claim's own terms instead of only cataloguing it.

     Construction, deliberately minimal: take the ONE page-authored route that reaches ≥90%
     (x90-v1, unchanged) and apply the claim's lever AND NOTHING ELSE — the throughput serving
     regime, which is this engine's "bigger declared batch at held speed". Every other field is
     x90-v1's. Adding occupancy or rate changes would reach 95% and would be authoring a result;
     the point of the route is that it is the claim's own move, applied alone.

     What it returns is the finding: the lever moves 91.69% → 92.89% at the ratified default
     (≈1.2 points) and 89.07% → 90.65% at the public-evidence reference (≈1.6) — roughly a
     quarter of the ≈5 points the claim asserts. So the route DOES land inside its authored
     90–95 band, and still does not reproduce the claim: arriving at 92.9 by this move is not
     the same event as being driven from 90 to 95 by it. The gap is the answer the page owes
     the claim, and naming it is the point of shipping the route rather than dropping it. */
  { id: "x90-v2", kind: "exploration", name: "[analyst route · TeorTaxes] 90–95% · the batch mechanism, applied alone", subtitle: "batch mechanism on the owned-TCO route",
    claimAnchor: { who: "TeorTaxes (@teortaxesTex)", claimIds: ["teortaxes-9095-conditional"],
      mechanism: "increase the batch size at held speed" },
    loadScope: "opus",
    procurementBasis: "owned-strategic-tco",
    authoredRange: { lo: 90, hi: 95 }, // FIXED authorship metadata, as on every route: integrity discloses against THIS; the computed bucket is board grouping only
    /* im-arc T2 (memo §6, 2026-08-22): pinned at the pre-T2 default so the
       vintaged route reproduces; the generic default moved 2026-08-22. */
    set: { hwMode: "tco", kwh: 0.07,
      /* im-arc T4 fold (2026-08-24), memo §6 [F10]: the PIN BUNDLE for this ARCHIVED reading. T2
         pinned only the electricity default; T4 moves the facility life, the datacenter capex per
         watt, four capex points and the cluster-overhead SEMANTICS, so an archived reading needs
         all of them stated to reproduce. Every value below is the pre-T4 default on merged master
         ad7a214, and the whole bundle is enumerated in tests/fixtures-t4-declared-delta.json. */
      dcPerW: 12, dcLifeYears: 12, capexScopeMode: "legacy-global", capitalRecovery: "off",
      capexAbsLeg: { h100: 25000, h200: 32000, gb200: 45000, gb300: 55000, h800: 40000,
        h20: 20000, tpu7: 35000, trn2: 15000, trn3: 20000, ascend: 23000 },
      rentRegistryPin: { h100: 2.40, h200: 2.90, gb200: 4.50, gb300: 6.00, h800: 1.75, h20: 1.00,
        tpu7: 5.40, trn2: 2.235, trn3: 2.20, ascend: 1.95 }, util: 55, stackMult: 1.1, interact: "batch", batchShare: 15, discount: 5 },
    /* im-arc T4 fold (2026-08-24), memo §6 [F10]: which of this route's set keys are the
       historical PIN BUNDLE rather than authored levers. Consumed by the exploration ranking so
       a route that must state six migration values to keep reproducing is not thereby ranked as
       a six-lever route. */
    migrationPins: ["kwh", "dcPerW", "dcLifeYears", "capexScopeMode", "capexAbsLeg", "capitalRecovery", "rentRegistryPin"],
    note: "PAGE-AUTHORED RECONSTRUCTION of the mechanism named in the 90\u219295% claim, and of nothing else: it is the \u2265\u200990% owned-TCO route with ONE field changed \u2014 the serving regime moved to throughput, this engine's reading of \"increase the batch size, have the same speed\". The claim is TeorTaxes's, quoted verbatim with its source in the claims registry; this vector is this page's, and no external party selected it. THE RESULT IS THE POINT: the lever moves this route from 91.7% to 92.9% at the ratified default (89.1% \u2192 90.6% at the public-evidence reference) \u2014 roughly a quarter of the five points the claim asserts. Landing at 92.9% is not the same event as being driven from 90% to 95% by this move, so a 90\u219295% story needs something this route does not contain, most plausibly serving-stack efficiency this calculator credits at zero. Range membership is computed at the flagship scope, never enforced; this route is authored for 90\u201395% and discloses where it actually lands." },
  { id: "gptpro", kind: "lens", name: "[lens] Strategic-partner fleet (GPT-5.6 Pro)",
    /* Owner annotation nd4f4c7 (2026-08-16): the higher-justification entries become loadable, and
       the load targets are found by TYPED claim anchor rather than by matching names in prose. This
       lens already declared its relationship to the consult in its own `note` ("Page-authored
       adaptation of GPT-5.6 Pro's independent consult"), and the g3 entry declares the same
       relationship from the other side ("A page-authored strategic-rate adaptation inspired by the
       consult's fleet economics"). Typing it asserts nothing new — it makes an already-published
       relationship machine-readable so the entry can carry a link instead of leaving the reader to
       find the lens in a dropdown. The ADAPTATION direction is why the anchor is here and not a
       claim of faithfulness: the record and the entry both say the 92–94 consult figure is not what
       this vector computes. */
    claimAnchor: { who: "GPT-5.6 Pro (model-generated consult)", claimIds: ["gptpro-9296-model-generated"],
      mechanism: "strategic-contract rates at 70% occupancy on a TPU-heavy blend", relation: "page-authored adaptation" },
    loadScope: "opus",
    procurementBasis: "committed-planning-rent", basisNote: "strategic-contract class rates (0.70x) — committed procurement, not a public rate card",
    set: { hwMode: "rent", rentMult: 0.70, util: 70, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0, blend: { tpu7: 40, gb300: 25, gb200: 15, trn2: 15, h200: 5 } },
    note: "Page-authored adaptation of GPT-5.6 Pro's independent consult (Jul 2026): Anthropic-scale strategic contracts, 70% utilization, and a 40% TPU-heavy blend. The activated lens computes Opus 74.7% input / 92.2% output and 83.0% blended at the public-evidence reference mix (an algorithmic lead of 0 months); the calculator's own default reading carries the ratified prior and reads higher, at 87.1% blended. The consult's own 90.6% / 93.3% category figures are external scenario outputs, not reproduced by this preset. See report §6." },
  /* ---- row 499: THE THREE ADJUDICATED PRESETS (owner ruling, voice note 0c8102, 2026-08-06) ----
     The page-open default is (a); (b) is the second independent estimate; (c) is the reproducible
     stress case. Each carries ITS OWN author's lead treatment as a typed `trendBaseline`, and none
     of them locks the dial: the visitor moves the lead from any preset, which is the ruling.
     The NUMBERS in these vectors follow the adjudicators (round 2, with the recent findings in
     hand); the STRUCTURE is the owner's. This page does not adjudicate between (a) and (b). */
  { id: "gptpro-ctx", kind: "lens", name: "[estimate · archived] Strategic/owned expectation (GPT-5.6 Pro, contextual)",
    procurementBasis: "committed-planning-rent", basisNote: "strategic-contract class rates (0.70x) — the page's own registered strategic class, NOT a rate this review pinned",
    trendBaseline: 0,
    set: { hwMode: "rent", rentMult: 1.0,
           /* row 499 round 2: its OWN per-family fallback midpoints, now expressible per leg —
              NVIDIA 0.95 (it declined to apply a TPU-sized discount to NVIDIA, whose registered
              prices already mix low/committed, neocloud and analyst-set values), TPU 0.50, Trainium
              0.85 at zero weight. Each is the midpoint of a RANGE it declined to collapse
              (NVIDIA 0.90-1.00, TPU 0.30-0.70, Trainium 0.70-1.00); the midpoints are a rendering
              convenience it labeled as such, not pinned values. */
           rentMultLeg: { h100: 0.95, h200: 0.95, gb200: 0.95, gb300: 0.95, h800: 0.95, h20: 0.95, tpu7: 0.50, trn2: 0.85, trn3: 0.85 },
           util: 65, stackMult: 1.0, interact: "balanced", batchShare: 0, discount: 0,
           blend: { h100: 5, h200: 10, gb200: 25, gb300: 20, tpu7: 40 },
           /* THE RANGES ITS AUTHOR ACTUALLY DECLARED, carried as ranges instead of flattened to
              midpoints. This is the whole reproduce-gap fix, and the shape of the fix matters: the
              midpoints above are UNCHANGED, so the preset's point is exactly what it was and
              nothing has been tuned toward the 84 % its author states. What changes is that the
              preset now says the second thing its author said — that these are the middles of
              ranges it declined to collapse, and that "the fallback renderer midpoint is only an
              administrative way to draw a page before a range UI resolves". The range UI now
              resolves, so the administrative convenience retires and the declaration ships.
              `mid` is the author's stated MEDIAN, never a computed mean: the published comparison
              of three-point shapes finds median-characterised distributions fit better than the
              mode-characterised ones the textbook estimate uses, and this page will not synthesize
              a weighted average it cannot justify.
              PROCUREMENT IS DECLARED PER FAMILY because that is the unit its author wrote it in
              (famNvidia / famTpu / famTrainium in its loadable vector) — and a family-scoped range
              on this preset has to reach past the per-leg values above to price anything, which is
              exactly what `applyDial`'s group scope does. */
           dialRanges: {
             "util":                 { lo: 50,   mid: 65,   hi: 80   },  // its stated 65 % midpoint over a 50-80 % core range
             "cacheHit":             { lo: 40,   mid: 60,   hi: 80   },  // effective compute-side reuse: value 60, range 40-80
             "rentMultFam.nvidia":   { lo: 0.90, mid: 0.95, hi: 1.00 },  // it declines to apply a TPU-sized discount to NVIDIA
             "rentMultFam.tpu":      { lo: 0.30, mid: 0.50, hi: 0.70 },  // "where the economic-regime disagreement is concentrated"
             "rentMultFam.trainium": { lo: 0.70, mid: 0.85, hi: 1.00 },  // at zero headline weight, excluded from the point
             /* ITS BLEND DECLARATION, moved out of prose (owner ruling q-sliders-fleet-util-point,
                2026-08-09). These three numbers were already carried verbatim in this preset's
                provenance — "declared family constraints of 50-65% NVIDIA, 35-50% TPU, 0-15%
                Trainium" — and were NOT expressible as ranges, because until this ruling the engine
                had no compositional range that preserves a 100 % simplex. It has one now, so the
                declaration ships where the calculator can read it. NO AUTHORED NUMBER CHANGES: the
                rendered point stays NVIDIA 60 / TPU 40 / Trainium 0.
                NO `mid` IS DECLARED, deliberately. A blend block's centre is the preset's own share
                for those legs, so writing 60/40/0 here a second time would create a copy that can
                drift from the blend above it. Its author's midpoints ARE 60/40/0 and they sum to
                100 — which is the owner's fixed case, so the median comes out as the author's own
                mix rather than anything this page computed. */
             "blend.fam.nvidia":   { lo: 50, hi: 65 },   // its declared NVIDIA share band; point 60
             "blend.fam.tpu":      { lo: 35, hi: 50 },   // its declared TPU share band; point 40
             "blend.fam.trainium": { lo: 0,  hi: 15 },   // declared 0-15 while EXCLUDED from the point pending the form repair
           } },
    /* WHAT ITS AUTHOR SAID, VERBATIM IN NUMBERS — a QUOTED reading, not this engine's output, and
       the distinction is the whole reason this key exists separately from `dialRanges`. The band
       derived from `dialRanges` is a corner evaluation this page performs; THIS is the pair the
       adjudicator stated in its own final-answer sentence, on its own basis. They are different
       objects and they do not agree, which is exactly why the page shows both and labels which is
       which rather than reconciling them.
       Basis chosen to match what the preset itself computes: this vector bills at list
       (batchShare 0 / discount 0), so the list figures are the like-for-like ones. */
    statedReading: {
      central: 84.0, lo: 68, hi: 92,
      basis: "at the undiscounted list price",
      who: "GPT-5.6 Pro's contextual review (archived reading)",
      companion: "81.8 % on this page's illustrative 15 % Batch / 5 % discount mix, range 64–91 %",
      caveat: "its author asks explicitly that the vector NOT be tuned until it reproduces this number",
    },
    note: "AN ARCHIVED READING, kept loadable. Page-authored adaptation of the GPT-5.6 Pro contextual review, re-run 2026-08-06 with the findings that postdated it. Its declared settings, adopted wherever this engine has a control: 65% utilization (its stated midpoint over a 50-80% band, its analyst judgment and not a source), list-only billing (0% batch share, 0% negotiated discount — it asks that the page's illustrative 15/5 mix be shown as a companion denominator rather than baked into a figure described as at list), no generalized speculative-decoding credit (production acceptance evidence now exists, which earns an eligible-leg 1.00-1.10x sensitivity and a 1.15x upside marker, not a fleet-wide multiplier), Trainium EXCLUDED from the point until the per-chip-versus-replica form defect is repaired, and NO ALGORITHMIC-LEAD PRIOR: this reviewer holds a lead is not identifiable from public evidence, an independent public-evidence sweep returned the same negative, and the page-open default takes them at their word rather than spending a prior the visitor did not choose. The lead dial is free from here. PROCUREMENT IS PER LEG AND EVERY VALUE IS A RANGE MIDPOINT IT DECLINED TO PIN: NVIDIA 0.95x (range 0.90-1.00 — it will not apply a TPU-sized discount to NVIDIA, whose registered prices already mix low/committed, neocloud and analyst-set values), TPU 0.50x (range 0.30-0.70, where it says the regime disagreement is concentrated), Trainium 0.85x (range 0.70-1.00) at zero weight. THE HONEST GAP: when this reading was installed this vector computed about 80% at list and about 77% on the illustrative mix; on this engine today it computes about 79% and about 76% (78.89% / 75.98%, after the 2026-09-10 fleet-rent adoption). The vector did not change; the calculator did. The review's own stated figure is 84% at list / 81.8% on the mix, inside a core band of 68-92% / 64-91%. It calls the midpoints an administrative way to draw a page before a range control exists, and asks explicitly that they NOT be tuned until the target number appears — so they are not. Its downside reproduced when this reading was installed: its public-rate stress case (this page's own rents, 50% occupancy, list-only billing, the full declared blend) computed 64.13% here against the 64.1% it states. On this engine today that stress case computes 62.99%. See report §6." },
  { id: "fable-ctx", kind: "lens", name: "[estimate · archived] Per-leg strategic posture (Fable 5, independent)",
    procurementBasis: "committed-planning-rent", basisNote: "PER-LEG strategic rates — TPU x0.30, Trainium x0.70, NVIDIA undiscounted (x1.0), a posture the single global multiplier cannot express",
    trendBaseline: 0,
    set: { hwMode: "rent", rentMult: 1.0, rentMultLeg: { h100: 1.0, h200: 1.0, gb200: 1.0, gb300: 1.0, tpu7: 0.30, trn2: 0.70, trn3: 0.70 },
           util: 60, stackMult: 1.0, interact: "balanced", batchShare: 15, discount: 5,
           /* ONE declared range, and the restraint is the point. Its author's band assembly names
              three axes — "util 50-70 x rates half-to-full-strategic x lead 0-to-+3-not-stacked" —
              and exactly one of them is stated in numbers. Occupancy ships as the range it is.
              The RATE axis does not: "half-to-full-strategic" is a qualitative phrase, and turning
              it into 0.30-0.65 would be this page inventing an adjudicator's number and then
              rendering it in the adjudicator's name — the same manufacture-a-value move both
              round-2 reviews refused, wearing a range's clothes. The LEAD axis does not either,
              and that one is a hard instruction rather than a judgment call: this author is
              explicit that the lead must NOT be switched on to reach its headline, because the
              serving-stack credit it took instead already covers part of the same mechanism.
              Both omissions are stated in the note, so a reader sees a narrower band and is told
              why it is narrower rather than being left to assume the axes do not exist. */
           dialRanges: { "util": { lo: 50, mid: 60, hi: 70 } } },
    /* Its round-2 stated pair, on the basis this preset bills on (15 % batch / 5 % discount). */
    statedReading: {
      central: 77, lo: 70, hi: 84,
      basis: "on this page's illustrative 15 % Batch / 5 % discount billings mix",
      who: "the independent Fable 5 estimate (archived reading)",
      companion: "≈80 % at list, range 74–86 %",
      caveat: "its author is explicit that the algorithmic lead must NOT be switched on to reach it",
    },
    note: "The second independent estimate, produced without sight of the first: a Fable 5 session derived it from this page's own numbers and hash-committed it before any GPT-Pro output was opened (row 494, re-run for row 499 under the same hygiene). Its posture is PER-LEG and that is the point — TPU at roughly a third of the registered analyst rate, Trainium at 0.70x, and NVIDIA at NO discount, a discount it explicitly declined to claim. Before row 499 this engine could only express one global multiplier, and the single value reproducing that margin (0.7308) would have asserted the NVIDIA discount its author refused while under-stating the TPU move that carries the posture; the engine now carries per-leg multipliers, so the estimate ships faithfully or not at all. THE LEAD IS AT ZERO HERE: an independent public-evidence sweep returned that no such lead is identifiable from public evidence, so this estimate carries a smaller, separately declared serving-stack efficiency credit instead. THE HONEST GAP: on this engine today this vector computes about 74% on the illustrative billing mix (it computed about 75% when this estimate was installed; later calculator changes moved it, the vector did not change), while its author's stated headline figure is about 3 points higher — that credit is bounded by two first-party anchors but has no legal control on this engine (the speculative-decode lever is gate-blocked at this stack setting, by design, to prevent double-crediting). The preset therefore carries the vector and states the gap rather than solving a dial to close it, and its author is explicit that the lead must NOT be switched on to reach that headline: the credit already covers part of the same mechanism. Lead-on is a separate sensitivity. See report §6." },
  { id: "stress-public-rate", kind: "lens", name: "[stress case] Planning baseline \u2014 no assumed efficiency lead",
    procurementBasis: "committed-planning-rent", basisNote: "the page's registered planning-rate vector with NO judgment dial moved — the reading a reader can rebuild from this page's fully declared planning assumptions (three of them provisional planning rents since 2026-09-10)",
    trendBaseline: 0,
    set: { hwMode: "rent", rentMult: 1.0, util: 50, stackMult: 1.0, interact: "balanced", batchShare: 15, discount: 5 },
    note: "THE STRESS CASE, selectable in one click: every judgment dial at its unmoved value — the registered heterogeneous planning-rate vector at 1.0x, 50% occupancy, open-source-level stack, balanced latency, and NO algorithmic-lead prior. It computes the page's published public-evidence reference reading (about 58% under this page's illustrative billing mix, about 63% at the undiscounted list price). It is deliberately NOT lead-adjusted: this is the PLANNING BASELINE — what any reader can rebuild from this page's fully declared planning assumptions, every one of them stated — and applying a private prior to it would destroy the one property that makes it useful. Since 2026-09-10 those assumptions include three PROVISIONAL planning rents (GB200, GB300, Trainium3), declared judgments rather than published rate-card prices, so it is no longer rebuildable from public rate cards alone. It is not an estimate of likely actual economics, and the external reviewer that re-derived it independently to the decimal said the same thing about it. It is a floor to reason from, never the page's answer. Keeping it visible matters: it is the reading with every judgment dial left where the registry puts it." },
  /* ROUND 3 (row 514, owner commission 2026-08-07T19:04:23Z). The adjudicators reviewed their OWN
     assumptions with full context and authored them as 1/2/3-point ranges. What separates these from
     the round-2 presets above is not the numbers but the PROVENANCE OF THE RANGES: every three-point
     declaration below is its own author's, returned as numbers, and every value was MEASURED through
     the calculator before it was declared — not a page maintainer's reading of an adjudicator's prose.
     The round-2 presets are kept, unmoved, so the movement is auditable. */
  { id: "gptpro-r3", kind: "lens", name: "[estimate · page-open default] Strategic/owned expectation (GPT-5.6 Pro, contextual)",
    procurementBasis: "committed-planning-rent", basisNote: "strategic-contract rental rates, declared by their author as PER-LEG ranges — the family layer deliberately pinned at 1.0 so the same discount is never counted twice",
    trendBaseline: 2,
    statedReading: { central: 83.1, lo: 68, hi: 92,
      basis: "at the undiscounted list price",
      who: "GPT-5.6 Pro's self-authored review",
      companion: "the lead-only diagnostic across 0-4 months is 78.89-85.37 %",
      caveat: "its author states the full 68-92 % span is its own SELECTED span, deliberately NOT widened to accommodate the lead range, and explicitly NOT a live-engine corner band",
      /* THE MISSING DESIGNATION, recorded (bq-2192, im-guard-fix 2026-09-10). The provisional GPT
         council asked, reviewing the db73816 line audit, whether the lead-only diagnostic was a
         MAINTAINED engine figure or a PRESERVED quotation — the 2026-08-24 sweep moved it and
         nothing said which. The record answers it, and the deciding evidence is what the AUTHOR
         declared rather than the synchronization the council rightly refused:

           * The installing commit c45c2c3 (2026-08-07) records the author's own response: "Its
             author moved the lead off zero to 0/2/4 ... reaching 84.0 from the UNMOVED 79.65 POINT
             would need 2.6269 months, and it has 'no independent reason to select 2.6269 months'."
             The author declared a lead range IN MONTHS — a dial range. It never stated a percentage
             range at all, and 79.65 is described as a point the ENGINE computes.
           * And the percentages track that dial exactly. Executed in throwaway worktrees at both
             epochs: c45c2c3 sweeps 79.6515 / 81.4317 / 83.0561 / 84.5385 / 85.8911 across 0-4
             months against a string reading 79.65-85.89; d1fcaa9 sweeps 80.4794 / 82.1872 /
             83.7456 / 85.1676 / 86.4652 against 80.48-86.47. BOTH endpoints, BOTH epochs, exact. A
             preserved quotation does not track both ends of an engine sweep across two independent
             engine states.
           * The caveat directly above designates the OTHER figures on this row the opposite way:
             the 68-92 span is the author's own selected span and "explicitly NOT a live-engine
             corner band". Neither it nor the central 83.1 moved when the string did.

         CORRECTED before commit (fallback card review C2): an earlier draft of this comment said
         the string "moved TWICE with the engine". It moved ONCE — introduced at c45c2c3, changed at
         d1fcaa9 (the registry twin of the db73816 page sweep), never again. bq-2192's phrase "the
         sweep's twin commit" describes one sweep across two commits, and reading it as two sweeps
         was an assertion about the record made from memory instead of from the record.

         WHICH MADE THE PUBLISHED VALUE STALE — AND THE OWNER HAS NOW RULED ON IT. Card
         q-im-r3-lead-diagnostic-designation, answered 2026-09-10T16:09:47Z, option A:
         d-20260910-im-r3-lead-diagnostic-recompute — "recompute on all three surfaces and keep it
         recomputed". Enacted in this commit. The companion string above, the card face in
         site/index.html and the served changelog line all now read 78.89-85.37, which is this
         preset's own sweep EXECUTED at these defaults rather than quoted from anywhere:

             lead 0/1/2/3/4 months -> 78.8931 / 80.7396 / 82.4246 / 83.9622 / 85.3653
             (applyPresetSettings(opus, gptpro-r3, {mode:"explicit", profileId:"reference"}),
              trendMonths swept, workload().margin * 100; discount 0 / batchShare 0, which is the
              undiscounted list tariff the statedReading declares as its basis)

         Before this commit three surfaces published two values and neither was the engine's:
         face and registry 80.48-86.47, served changelog 79.65-85.89 (false since 2026-08-24).
         THE FIELD IS RECOMPUTED, NOT THE ROW. Option D — moving this out of statedReading into a
         maintained engine field of its own so the "QUOTED, not computed here" clause stops covering
         a computed number — was NOT chosen. That clause is deliberately left as it stands and
         bq-2191 stays open for it. The author's own figures on this row are byte-untouched: the
         83.1 central and the 68-92 span are its author's, and the caveat below still designates
         them the opposite way. What is recomputed is the one field the author never wrote.

         THE CHANGE IS NARRATED where a moved published figure belongs: research/changelog.md
         carries an entry for it. That is not ceremony. The reason this question existed at all is
         that the 2026-08-24 sweep moved this figure and left no record saying it had, so a
         recompute rule that does not record its recomputes would rebuild the same defect.
         Note that the face-vs-registry guard cannot see any of this by construction: the page and
         this registry agree with each other, which is the limit that guard's own header states. */
      companionDesignation: "maintained-engine-diagnostic",
      /* WHAT THE CALCULATOR READ WHEN THIS WAS STATED (owner note note-20260912T180812Z-c9eaac, his
         question: "where is this small discrepancy coming from"). The author worked 83.0549 by hand
         from the 79.65 % no-lead point it was handed; the engine at c45c2c3 computed 83.0561 for these
         settings. Point settings are byte-identical since (only the declared ranges were regrouped,
         2026-08-09), and c45c2c3's whole set on today's engine reads what today's set does. Executed:
         orchestration/backlog-recovery/day-2026-07-28/status/im-default-window-and-mcp-discrepancy.md. */
      authoredAgainst: { date: "2026-08-07", engine: "c45c2c3", computed: 83.0561,
        model: "opus", profileId: "reference", scopeLabel: "Claude Opus 4.x, Reference traffic mix, this estimate's own settings",
        route: "worked by its author from this calculator's 79.65 % no-lead reading, not through the MCP" },
    },
    set: { hwMode: "rent", rentMult: 1.0, rentMultLeg: { h100: 0.95, h200: 0.95, gb200: 0.95, gb300: 0.95, h800: 0.95, h20: 0.95, tpu7: 0.50, trn2: 0.85, trn3: 0.85 },
           util: 65, stackMult: 1.0, interact: "balanced", batchShare: 0, discount: 0,
           blend: { h100: 5, h200: 10, gb200: 25, gb300: 20, tpu7: 40 },
           /* Its author declared FIFTEEN ranges, and the important change is not the count but a
              REFACTOR it made to stop a double-count. Round 2 declared procurement on the FAMILY
              axis (rentMultFam.*) while the preset also carried per-leg strategic discounts — and
              if both layers multiply, that is not a richer prior, it is two copies of the same
              procurement thesis. Round 3 pins every family multiplier at its 1.0 default and moves
              the identical widths onto the legs that actually price. The medians are unchanged, so
              the refactor is margin-NEUTRAL at the centre and only the double-count goes away:
              MEASURED at lead 0 it reproduces the preset's own round-2 point to four decimals: it
              read 80.4794 when this note was written and reads 78.8931 today, matching gptpro-ctx
              at both. The IDENTITY is what this note asserts and it still holds exactly; the
              literal was stale from the owner ruling of 2026-09-10 until im-guard-fix re-measured
              it (bq-2192). A stale literal inside a reproduction claim is how the claim quietly
              stops being checked, so it is stated as a measurement with its date rather than as a
              constant.
              REPRESENTATION NOTE (2026-08-09, adjudicated — esc-20260809T001150Z-18a9186a, gate
              d-opener-enact-20260809): the author's six IDENTICAL 0.90/0.95/1.00 NVIDIA leg ranges
              are CARRIED AS the one family-scoped range the engine already resolves onto exactly
              those legs (`applyDial` group scope — the same representation its round-2 preset uses
              at this width). One posture written once instead of six times: NO authored number
              changes, the anti-double-count intent is preserved (one dial is strictly less
              double-countable than six identical ones), and the declared-range count enters the
              corner budget as 10 live dials, so the compounded band this page derives COMPUTES for
              the landing default instead of refusing — the fail-closed >12-dial engine cap itself
              is untouched. */
           dialRanges: {
             "trendMonths":        { lo: 0,    mid: 2,    hi: 4    },  // round 2 held 0 ONLY; the residual prior now lives here and nowhere else
             "util":               { lo: 50,   mid: 65,   hi: 80   },  // reaffirmed — no occupancy telemetry narrows it
             "cacheHit":           { lo: 40,   mid: 60,   hi: 80   },  // serving-side prefix reuse
             "billCacheHit":       { lo: 40,   mid: 60,   hi: 80   },  // NEW: round 2 left this implicitly equal to serving reuse; now authored
             "cacheCost":          { lo: 2,    mid: 5,    hi: 15   },  // NEW: the round-2 verbal core range, promoted into the preset
             "cacheWriteShare":    { lo: 0,    mid: 0,    hi: 10   },  // NEW, deliberately ONE-SIDED: no write billing stays the base case
             "rentMultFam.nvidia": { lo: 0.90, mid: 0.95, hi: 1.00 },  // the author's identical six NVIDIA leg ranges, carried family-scoped (see the representation note)
             "rentMultLeg.tpu7":   { lo: 0.30, mid: 0.50, hi: 0.70 },  // the widest dial, and its author keeps it wide on purpose
             "rentMultLeg.trn2":   { lo: 0.70, mid: 0.85, hi: 1.00 },  // inactive in this blend
             "rentMultLeg.trn3":   { lo: 0.70, mid: 0.85, hi: 1.00 },  // inactive in this blend
             /* THE BLEND RANGES ITS AUTHOR DECLARED WHEN ASKED AGAIN (dual consult, 2026-08-10).
                Round 3 declined to declare these, and said exactly why: "the calculator has no
                compositional range that preserves a 100 % simplex", logged as a gap rather than
                faked. The owner's 2026-08-09 ruling built that capability, so the gap was put back
                to its author, which answered: it restores its round-2 family bounds unchanged and
                keeps 60/40/0 as its REFERENCE — declining, in terms worth quoting, to let the
                projected 55/40/5 replace it, "because I did supply a feasible point and its zero
                Trainium weight was intentional."
                Its two implementation rules are carried as declared rather than inferred. Within
                NVIDIA the internal proportions hold at 1 : 2 : 5 : 4 as the family share moves —
                which is what the point already encodes (5/10/25/20), so the engine's
                point-proportional split reproduces it without a `split` entry. Trainium is
                different and needs one: any positive share goes to Trainium2 ALONE, with Trainium3
                at zero "until there is a defensible price/throughput and model-form basis". Without
                the declared split this page's own registered default fleet would put a third of it
                on trn3 — a composition its author refused. */
             "blend.fam.nvidia":   { lo: 50, hi: 65 },
             "blend.fam.tpu":      { lo: 35, hi: 50 },
             "blend.fam.trainium": { lo: 0,  hi: 15, split: { trn2: 1, trn3: 0 } },
           } },
    note: "GPT-5.6 Pro's self-authored reading of this page: a headline of 83.06 % on the engine of 2026-08-07, worked by its author from the calculator's own 79.65 % no-lead reading (the connector it could reach did not yet carry this preset, so the figure did not come through the MCP; that day's engine computed 83.0561 % for the same settings). The calculator has changed since (the generic-defaults move of 2026-08-24, then the fleet-rent adoption of 2026-09-10) while these settings have not, and they compute 82.42 % here today; the stated 83.1 % is its author's and is not re-tuned toward the engine. The author declines to pin its headline, letting the median fall where the arithmetic puts it rather than to a chosen figure \u2014 in its own words, it has 'no independent reason to select 2.6269 months; choosing it would be precisely the target tuning this commission prohibits.' THE LEAD IS A RANGE, not a point, because a point would have to assert something the evidence does not: 0 because published open practice may already absorb the portable advantage; 2 as a discounted, not one-for-one, transfer sitting deliberately BELOW the 2.4374 months a 1.25\u00d7 efficiency multiplier implies; 4 as the ratified upper scenario, explicitly WITHOUT importing the rejected anonymous >2\u00d7 claim. PROCUREMENT IS COUNTED ONCE: family-level and leg-level discounts describe one claim and multiplying them would count it twice, so every family multiplier is pinned at 1.0 and the widths live on the legs, margin-neutral at the medians. THE STATED SPAN IS 68\u201392 %, and it is the author's SELECTED span, not a live-engine corner band \u2014 the engine's own compounded band over these ranges is a different object and is derived, never quoted. Method and derivation: reports/im-round3-2026-08-08.md; how this reading arrived at its current form is in the changelog." },
  { id: "fable-r3", kind: "lens", name: "[estimate] Per-leg strategic posture (Fable 5, independent)",
    procurementBasis: "committed-planning-rent", basisNote: "PER-LEG strategic rates, now declared as ranges by their own author — TPU 0.30-0.65, Trainium 0.70-0.85, NVIDIA undiscounted and pinned there",
    trendBaseline: 1,
    statedReading: { central: 77, lo: 65, hi: 82,
      basis: "on this page's illustrative 15 % Batch / 5 % discount billings mix",
      who: "the independent Fable 5 estimate",
      companion: "≈80 % at list",
      caveat: "the serving-stack credit is not a figure beside the vector — it is inside the lead dial, so there is no 'do not switch the lead on' caveat to observe by construction",
      /* What the calculator read when this was stated: fable-r3 at c45c2c3 computes 77.3145; the point
         settings are unchanged since and read 76.3266 on today's engine either way (same status file). */
      authoredAgainst: { date: "2026-08-07", engine: "c45c2c3", computed: 77.3145,
        model: "opus", profileId: "reference", scopeLabel: "Claude Opus 4.x, Reference traffic mix, this estimate's own settings",
        route: "measured by its author through this calculator" },
    },
    set: { hwMode: "rent", rentMult: 1.0, rentMultLeg: { h100: 1.0, h200: 1.0, gb200: 1.0, gb300: 1.0, tpu7: 0.30, trn2: 0.70, trn3: 0.70 },
           util: 60, stackMult: 1.0, interact: "balanced", batchShare: 15, discount: 5,
           /* NINE declared ranges where round 2 rendered ONE. Its author's band assembly always had
              three axes — "util 50-70 x rates half-to-full-strategic x lead 0-to-+3-not-stacked" —
              and the page could only render occupancy, because the other two were prose. Round 3 is
              where its author turned them into numbers itself, which is the whole point of the round:
              the page never had to invent an adjudicator's value, and now it never will here. */
           dialRanges: {
             "util":              { lo: 50,   mid: 60,   hi: 70   },  // reaffirmed unmoved; no altitude bought back through occupancy
             "trendMonths":       { lo: 0,    mid: 1,    hi: 2    },  // the lead axis AND the serving-stack credit, sharing one dial so double-counting is structurally impossible
             "rentMultLeg.tpu7":  { lo: 0.30, mid: 0.30, hi: 0.65 },  // the rates axis, rendered: 0.30 IS the full-strategic floor, so lo==mid is deliberate
             "rentMultLeg.trn2":  { lo: 0.70, mid: 0.70, hi: 0.85 },
             "rentMultLeg.trn3":  { lo: 0.70, mid: 0.70, hi: 0.85 },
             "rentMultLeg.h100":  { lo: 1.00, mid: 1.00, hi: 1.00 },  // the declined NVIDIA discount, pinned rather than left unstated
             "rentMultLeg.h200":  { lo: 1.00, mid: 1.00, hi: 1.00 },
             "rentMultLeg.gb200": { lo: 1.00, mid: 1.00, hi: 1.00 },
             "rentMultLeg.gb300": { lo: 1.00, mid: 1.00, hi: 1.00 },
             /* THE BLEND RANGES ITS AUTHOR DECLARED WHEN ASKED (dual consult, 2026-08-10) — the
                same question put to both arms, answered without sight of the other's answer. Wider
                than the GPT Pro arm's on every family, and its stated reason is a restraint rather
                than a claim: it adopts THIS PAGE'S OWN registered default fleet as its centre —
                NVIDIA 50 / TPU 25 / Trainium 25 — rather than inventing a composition, and widens
                around it to the span it is actually willing to defend. lo/hi only, NO mids, on the
                same ground as its round-3 procurement entries: a blend block's centre is the
                preset's own share, so restating it here would create a second copy that can drift.
                Measured through the calculator before declaring, per the round-3 rule it set
                itself: 75.22-80.10 around an unmoved 77.31. Its stated 65-82 span does NOT widen to
                absorb this — its own correlated-corner reasoning is in the consult answer. */
             "blend.fam.nvidia":   { lo: 35, hi: 65 },
             "blend.fam.tpu":      { lo: 15, hi: 40 },
             "blend.fam.trainium": { lo: 5,  hi: 35 },
           } },
    note: "Fable 5's self-authored reading of this page, measured through the calculator before it was declared: 77.31 % on the engine of 2026-08-07, where every value its author declared reproduced to the decimal. The calculator has changed since (the generic-defaults move of 2026-08-24, then the fleet-rent adoption of 2026-09-10) while this vector has not, and it computes 76.33 % here today; the stated \u224877 % is its author's and is not re-tuned toward the engine. THE HEADLINE WAS COMPUTED rather than computed-and-then-annotated \u2014 the serving-stack credit that supports it is carried IN the calculator rather than riding beside the vector as prose: its exact months-equivalence at the ratified 3\u00d7/yr is 0.9159 months, and because the lead dial is integer-only the preset represents it with a one-month midpoint (the 77.31 % of 2026-08-07 and today's 76.33 % are both computed at one month). WHAT THE DIAL CARRIES, which is the double-count question and the author's own answer to it: at mid it carries the CREDIT re-expressed in months, not a lead prior; at hi it carries the OpenAI-anchored lead bound INSTEAD of the credit, never on top of it \u2014 stackMult stays 1.0 and speculative decoding stays off at every point, so the mechanism is counted exactly once. THE UPPER BOUND is anchored to the strongest first-party quantified datapoint (OpenAI 2026-07-29, agent-written kernels, '-20% end-to-end serving costs' = 2.437 months at 3\u00d7/yr) and then INTEGER-FLOORED to 2 rather than rounded, on the author's stated ground that the evidence is OpenAI's while this page's subject is Anthropic, that it is a rate-of-improvement datapoint rather than a standing gap, and that transfer to the serving layer is well under 1. THE BAND IS 65\u201382, whose floor prices the rates downside explicitly (64.67 measured on the engine of 2026-08-07 at half-strategic, util 50, lead 0). The author's declared common basis for any cross-arm comparison is lead 0. Method and derivation: reports/im-round3-2026-08-08.md; how this reading arrived at its current form is in the changelog." },
  { id: "xaicash", kind: "replay", name: "[valuation replay] xAI cash-marginal (dive operating point)",
    procurementBasis: "owned-strategic-tco", basisNote: "cash-marginal VALUATION of an owned fleet — the owned/strategic side, but a valuation replay, not a full TCO build-up",
    set: { hwMode: "rent", rentMult: 0.156, util: 48, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0, ioRatio: 3, cacheHit: 0 },
    note: "xAI-scoped: values the GPU-hour at ~$0.60 — power, cooling, maintenance and ops AFTER the hardware is sunk. The live answer to 'what does the next token cost on spare capacity': Grok 4.5 ≈90.7% on this lens. Same operating point as the dive; only the valuation changes — an atomic replay: the 3:1 / 0% traffic is part of the position and stays locked." },
  { id: "xaiopp", kind: "replay", name: "[valuation replay] xAI opportunity-cost (Anthropic contract)",
    procurementBasis: "committed-planning-rent", basisNote: "the ~$5.27 bundled CONTRACT rate the capacity actually fetches — a committed price, applied as an opportunity-cost valuation",
    set: { hwMode: "rent", rentMult: 1.37, util: 48, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0, ioRatio: 3, cacheHit: 0 },
    /* OWNER-SOURCED CORRECTION, 2026-08-09 (voice note 7099f9, relayed as the adjudication on
       commission d-im-range-calculator-20260809). The ~325k NVIDIA GPUs named below are a PRICE
       ANCHOR for xAI's own capacity — they are NOT a statement about the composition of Anthropic's
       serving fleet, and this lens must never be read as one. The owner rules explicitly:
       **NVIDIA is ADDITIVE to Anthropic's fleet, not the total of it** — TPUs are documented in
       Anthropic training and serving, and a headline NVIDIA contract sits alongside that capacity
       rather than replacing it. This page's own Anthropic priors already agree and are unchanged by
       the correction: the na-blend family shares are NVIDIA 50 / TPU 25 / Trainium 25, sourced to
       the Morgan Stanley NDR relay in `research/primary-sources/nvidia-anthropic-share-x-2026-07/`,
       whose primary text says a prominent frontier model was "developed mostly on an ASIC" with
       NVIDIA risen "to close to 50%". The note is recorded BESIDE the lens rather than by editing
       it, because the lens itself asserts nothing false — the misreading it invites is what is
       being corrected. */
    note: "xAI-scoped: values the GPU-hour at the ~$5.27 bundled rate Anthropic actually pays xAI ($1.25B/mo for ~325k GPUs + CPUs/storage/network per the SpaceXAI prospectus). NOT production COGS and NOT a bare chip-hour — it is what serving Grok forgoes. The live Grok 4.5 replay computes ≈18.7% on this lens: output-heavy traffic barely beats selling the capacity. The ~325k NVIDIA GPUs price this lens; they are not a claim about Anthropic's fleet composition, which this page models as roughly half NVIDIA alongside TPU and Trainium — that contract is additive capacity, not the whole fleet." },
  { id: "chinacloud", kind: "lens", name: "[lens] China public-cloud on-demand (Jul 2026)",
    procurementBasis: "public-capacity-rent",
    set: { hwMode: "rent", rentMult: 6.15, util: 35, stackMult: 1.0, interact: "balanced", batchShare: 0, discount: 0 },
    note: "The hyperscaler on-demand rate-card class, dated Jul 2026 (grounding pack): ≈6.1–6.2× the IDC annual-commit rates this page defaults to (Tencent H20 on-demand $4.48+, Alibaba RDS $7.40–10.62, H800 HCC ~$10.6 — note the H800 observation is monthly HCC, and bundles differ across products). Enterprise on-demand utilization ~35%. A procurement-class profile for buyers without commitments — not evidence of any lab's actual cost." },
  /* THE ID IS "ANT + H20", NOT "ANTHROPIC 20". Kept because it is permalink-encoded and renaming it
     would break every saved link that carries it — but flagged here, at the definition, because the
     misreading has real consequences: this is the ONE preset in the registry whose fleet is 100 %
     NVIDIA-by-family (h20: 100), so a reader or a model scanning ids and blends can land on
     "anth20 ⇒ Anthropic ⇒ 100 % NVIDIA" and carry that out as a claim about Anthropic's fleet. It
     is an Ant Group scenario, paired with DeepSeek traffic, and `pairingSeverity` already returns
     "hard" for it against every non-China model. Owner correction of 2026-08-09 (note 7099f9)
     applies: NVIDIA is additive to Anthropic's fleet, never the total — see the xaiopp note above. */
  { id: "anth20", kind: "replay", name: "[source-informed scenario] Ant Group H20 (NOT Anthropic — Ant Group)",
    procurementBasis: "committed-planning-rent",
    set: { hwMode: "rent", rentMult: 1.0, util: 100, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0, blend: { h20: 100 } },
    note: "Source-informed H20 scenario, not an SLO replay: paired with the DeepSeek R1 preset's live L≈4,989 traffic, it computes 649.3 tok/s/GPU. Ant's published 423/675/714 tok/s points at <30/<50/<70 ms are evidence annotations at their own operating points; this engine neither models nor enforces TTFT/TPOT, and its throughput-mode batch rule does not make those tiers selectable. Utilization 100 is only a per-occupied-chip convention — Ant's own utilization and cost basis are undisclosed." },
  { id: "deepseek", kind: "replay", name: "[replay] DeepSeek disclosure (Feb 2025)",
    procurementBasis: "committed-planning-rent",
    set: { hwMode: "rent", rentMult: 1.14, util: 100, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0, blend: { h800: 100 } },
    note: "Replays the Feb 2025 disclosure economics: ~$2/hr H800s (1.14× the mid-2026 IDC rate), their stack. Utilization stays at 100% because the disclosed per-node throughputs are AVERAGES over deployed nodes — they already encode idle time, so a second utilization divisor would double-count it. Pair with the DeepSeek V3/R1 preset → 87.1%, 2.6 points above the disclosed 84.5%; this replay mismatch is not validation." },
];

/* row 499 (owner ruling 0c8102): WHICH PRESET THE PAGE OPENS ON. This is the whole mechanism of
   "page-open default = GPT Pro's numbers with no algorithmic lead", and it is deliberately NOT a
   move of the `DEFAULTS` object. Why that distinction is the whole design:

   `encodeScenario` diffs a token against the RESOLVED PRESET STATE for the identity the token
   names, and falls back to raw `DEFAULTS` only for `__modified` identities. So moving `DEFAULTS`
   silently re-interprets every previously shared link that omitted a field — row 492 measured up to
   +21.3 points of that, invisibly. Moving the OPENING SELECTION re-interprets nothing: every
   existing token still names its own perspective and still resolves against that perspective's own
   vector. The visitor gets exactly what the ruling asks for; nobody's saved link moves.

   Consumed ONLY by the page-open selection and the copy that describes it. Every internal
   derivation that anchors on the CENTRAL SCENARIO (finalAnswer, lensSpan, formCorrectionSpan,
   FLAGSHIP_SCOPE) keeps looking `median` up by id, so no published reading changes definition. */
const LANDING_DEFAULT_PERSP_ID = "gptpro-r3"; // owner voice ruling 2026-08-08T23:03Z (notes 73ae79+edad69): the page opens on the round-3 self-authored Pro estimate; enacted under gate d-opener-enact-20260809

/* ---------- tooltip registry ---------- */
/* ---- THE CANONICAL CLAIM CONSTANTS (memo §6.1 SINGLE-SOURCE NORMATIVE BLOCKS) ----
   These three are the SOLE definitions of their claims. Every shipped surface composes FROM them;
   none restates them as its own literal, and T-21c fails on any second literal occurrence.

   Why this exists: the same normative claim shipped on four surfaces (why-line, reset line, tip,
   methods box) and drifted twice — round 6 fixed the why-line and left the tip; round 9 fixed the
   tip and left the why-line; methods was missed both times. The claim now has one definition and
   the surfaces are compositions of it, so a divergence is a test failure rather than a reading. */
const SPECDEC_PORTABLE_TICK =
  "the only point on this scale whose MTP-free meaning is portable to any scenario";

/* CONTAINS SPECDEC_PORTABLE_TICK BY CONSTRUCTION — the long form interpolates the short one, so the
   two tiers cannot drift apart (T-21b asserts the containment; it is a SUBSTRING, not a prefix,
   because this opens with "0.7 is "). Declared by interpolation, so its own source text never
   contains its assembled value — which is why T-21c expects 2 occurrences and not 3. */
/* J-10 run-1 dive A P0-1: OVERRULED as mechanism, SUSTAINED as copy (Polaris gen-24). Dive A, which
   sees only the public surface, concluded the gate conflates MTP-free with speculation-free — and it
   is right that an MTP-free preset cannot by itself prove a speculation-free baseline, since EAGLE,
   n-gram and standalone drafters need no MTP. Dive B, holding the contract, ruled Rule 3 passes:
   the no-double-counting guarantee is carried by the PER-LEG typed `specDecBaselineStatus`, not by
   the preset label. Both are right — the mechanism is sound and the copy did not say what carries
   it. A competent adversarial reader reaching a false conclusion from the public surface is a copy
   failure even when the mechanism holds, so the guarantee now NAMES its carrier. */
const SPECDEC_GATE_SEMANTICS =
  "0.7 is " + SPECDEC_PORTABLE_TICK + ". Other settings carry no portable claim either way — "
  + "a published replay may document its own stack in detail, but that documents that operating "
  + "point, not the scale. Crediting speculative decoding from any other setting could therefore "
  + "count part of the same improvement twice, and this page refuses rather than guess. The stack "
  + "setting is not what proves a leg speculation-free, and an MTP-free setting would not prove it "
  + "— speculative decoding does not require MTP. That work is done per leg: every leg carries a "
  + "typed baseline status, and only legs whose own baseline is documented to exclude speculative "
  + "uplift are creditable at all. The setting gates the scale; the per-leg status gates the leg.";

/* What the gate COSTS, stated once. The tip's and the methods box's wordings of this had already
   diverged before it became a constant (round-10 Grok, the fifth cluster). */
const SPECDEC_CONSERVATISM =
  "the 0.7 setting also removes disaggregation, so this page cannot express \"disaggregation "
  + "without speculative decoding\" — those fleets are under-credited here rather than risk "
  + "double-counting, which is the direction this page prefers to be wrong in";

/* PINNED SHIPPED BYTES, ratified in the manifest (esc-20260801T042349Z-20c444d8, rows 6, 7, 21).

   The why-line claims ONLY what the page types. Two earlier wordings were false: one below the
   tick (the domain runs to 0.4 and sub-tick settings are downside stresses, not MTP-bearing), and
   one above it — "already assume MTP and disaggregation are present" is falsified by the shipped
   `kimi` replay, which sits at stackMult 0.83 with a registry note reading "no MTP head". */
const SPECDEC_WHY_LINE =
  "Speculative-decode credit is available only from the \"no MTP/disagg\" stack setting (0.7) — "
  + SPECDEC_PORTABLE_TICK + ".";

/* The reset notice is TRANSIENT and its one job is loud attribution of a value change, mirroring
   the M5 D-12 zeroing rule. It deliberately carries no portability clause: at the instant it fires
   the gate has just shut, so the persistent why-line renders simultaneously beside the now-disabled
   control and already has the reason in view. */
const SPECDEC_RESET_LINE =
  "Stack setting left \"no MTP/disagg\" — speculative-decode credit reset to none. "
  + "It is available only from that setting (0.7).";

/* D-SD-5's reader-facing reason. This site must NOT name the stack setting, and that is deliberate:
   on a replay, moving stackMult to the tick would still not enable credit, so naming it would be
   actively false. The replay lock is a different rule from the D-SD-7 gate and T-21e does not reach
   this string. */
/* J-10 run-1: PROMOTED TO P0 by Polaris gen-24 on CONVERGENCE — dive A (public-only, P1-8) and dive
   B (everything-in-context, P1-4) reached this independently from opposite sides of an information
   asymmetry, which is the strongest agreement this harness can produce because there was no shared
   context to explain it. Two defects in one clause: "whatever speculative decoding the lab was
   running" PRESUPPOSES speculation was running, contradicting this page's own unknown-deployment
   claim in the same breath; and it borrows `absorbed`'s rationale (the deployed efficiency already
   contains speculation), which is an affirmative finding this page does NOT have for a replay. The
   replay lock follows from replaying a published point AS PUBLISHED — not from knowing what was in
   it. `absorbed` keeps the affirmative reading; this keeps the conditional one. */
const SPECDEC_REPLAY_WHY_LINE =
  "Speculative-decode credit is not available on a published operating point — the point is "
  + "replayed exactly as published, so any speculative-decoding effect it already carries is "
  + "inside it.";

/* Manifest rows 22 and 23 — the section title and the control label, RATIFIED. The phase scope is
   in the LABEL because it is the property most likely to be misread: this credit is decode-only
   (D-P24-1), and a reader who assumes it moves prefill too would misread every number under it. */
const SPECDEC_SECTION_TITLE = "Speculative-decode credit (scenario lever)";
const SPECDEC_CONTROL_LABEL = "Speculative-decode credit (decode phase only)";

/* The head of manifest row 8 — everything before the gate clause. Pinned as its own constant so
   the tip's composition below names its head rather than eliding it: an oracle with an ellipsis in
   it is not an oracle, and T-21a demands byte equality. It carries NO canonical-constant text, so
   T-21c's occurrence counts are unaffected by it.

   AMENDED BY COURT RECORD — Polaris gen-24 `esc-20260802T115802Z-351e891f`, 2026-08-02T12:27:55Z.
   Row 8's ratified bytes are amended to STRIP the `**` emphasis pairs on surfaces that render plain
   text: *"the span pins the RUNTIME STRING A READER RECEIVES … asterisks printed to a reader were
   never the ratified intent — the ** pairs are authoring-layer notation that leaked into pinned
   text."* The ruling requires per-surface verification first, and it was done rather than assumed:
   this surface renders through `textContent` (site/app.js:2071) and parses no markdown, and no
   shipped tip on this page contains a `**` or a tag. Span (8) keeps ITS emphasis as `<strong>`,
   because the methods box genuinely is HTML — the same amendment, resolved per surface. Every word
   is byte-exact to the ratified text; only the markers are gone. */
const SPECDEC_TIP_HEAD =
  "Speculative-decode credit. A scenario lever, not a measurement, and off in this page's "
  + "default. What it does: multiplies modeled decode throughput — output tokens only, never "
  + "prefill, which has no autoregression to speculate on — and therefore lowers modeled output "
  + "cost. What it is not: a simulation. This page models no acceptance rate, no draft-model cost, "
  + "no verification overhead and no batch interaction; you are declaring an outcome, not running "
  + "a mechanism. Where it does not apply: legs whose deployed efficiency already absorbs "
  + "speculation, and legs whose status this page cannot establish — those are exempt and say so "
  + "on the leg. Evidence, in two classes that are never added together: an OpenAI engineering "
  + "post of 2026-07-29 credits an improved draft/speculator model with \"more than 15%\" "
  + "additional token-generation efficiency, and its pricing post of 2026-07-30 says it is "
  + "\"passing those gains on to customers\" — a vendor claim, self-reported, single-source, not "
  + "independently verified, at one lab that is not this page's flagship; separately, published "
  + "measurements on open serving stacks span about 14% at production-like batch to about 60% at "
  + "modest concurrency — reported by the serving stack's own project, not independently "
  + "replicated — and both are the SAME model on the SAME stack (DeepSeek V3 under SGLang), "
  + "differing in cluster scale, concurrency, sequence lengths and draft window, so the spread "
  + "measures deployment conditions rather than two independent results, and neither is "
  + "transferable to this fleet. The larger figure is the MTP-versus-no-MTP delta with overlap "
  + "scheduling absent from both arms: 82.0 versus 51.0 tokens/s/rank (+60.8%). The post separately "
  + "reports 60.4 tokens/s/rank for overlap scheduling without MTP; because that SGLang version did "
  + "not support MTP together with overlap scheduling, it does not report MTP's incremental gain on "
  + "top of overlap. Both figures are cited from that post and are not registered "
  + "evidence rows of this page: they label a scale, and nothing computes from them. The vendor "
  + "reports this mechanism at another lab; that report never becomes a parameter of the fleet "
  + "this page models.";

/* d-im-h800 — the NVLink-cap lever's canonical copy constants. Declared ABOVE TIPS for the same
   reason the SPECDEC_* constants are: TIPS.nvlinkCapMinRatio and the SECTIONS entry compose from them,
   and a const cannot be read before its declaration is evaluated. The lever's mechanism (bounds,
   ladder, factor) lives beside the spec-decode lever further down. */
const NVLINKCAP_SECTION_TITLE = "H800 vs H100: the export-capped interconnect (fit-transfer assumption)";
const NVLINKCAP_CONTROL_LABEL = "H800→H100/H200 fit-transfer assumption: minimum uncapped ÷ capped throughput ratio (both phases)";
const NVLINKCAP_TIP_HEAD =
  "The H800 is the H100 with its NVLink cut from 900 to 400 GB/s (and FP64 cut) — nothing else that "
  + "reaches a serving number differs. This page's H800 row is the MEASURED part: DeepSeek's production "
  + "disclosure ran on H800s and the row's efficiency is fitted to it. The H100 and H200 rows BORROW that "
  + "fitted efficiency; the fit was obtained on the capped system and may include cap-related effects "
  + "that cannot be separately identified, so the page has implicitly assumed that an uncapped part "
  + "gains nothing over the capped one at the same operating point.";
const NVLINKCAP_WHAT_IT_DOES =
  "What this does: states that assumption as a number — the MINIMUM ratio you assume an uncapped "
  + "borrowing row (H100, H200) achieves over the same row with the H800's fabric cap, at the same "
  + "operating point, in each phase. It never touches the H800 (its throughput is the measurement) and "
  + "never rows with their own anchor or another fabric, and it cannot count an advantage twice: where "
  + "the roofline already renders the uncapped part faster (the fabric term binds), that advantage "
  + "counts toward the ratio and the control adds nothing until it is exceeded. 1.00 (the default) is "
  + "the historical model. Raising it moves every surface that renders the borrowing rows, including "
  + "the headline when they are in the blend.";
const NVLINKCAP_WHAT_THE_ENGINE_SAYS =
  "What the engine itself says: the fabric term is already in the roofline (decode t_N = b·D/fabric, "
  + "prefill t_fabric = D/fabric) with 400 versus 900 GB/s registered. On every expert-parallel "
  + "operating point this page ships it is SLACK against the memory term, so the two parts tie — the "
  + "readout beside this control shows the live share and the serial-exposure counterfactual, the "
  + "largest uncapped-over-capped ratio the registered payload and fabrics can produce under the frozen "
  + "form. DeepSeek's own report says the decode all-to-all runs over InfiniBand, identical on both "
  + "parts, which is why the honest default is small. On a dense tensor-parallel leg the fabric term "
  + "BINDS prefill and the H100 already renders faster with this control untouched.";
const NVLINKCAP_WHAT_IT_IS_NOT =
  "What it is not: a measurement. No matched serving observation on capped versus uncapped NVLink "
  + "exists in the public record (a registered evidence task), so this is your belief about a "
  + "fit-transfer effect, not an observed H100 result. It composes multiplicatively with the family "
  + "multiplier, the algorithmic-lead prior and the spec-decode credit, each shown separately on the "
  + "leg; the family multiplier may not be used to claim the same interconnect effect on a row that "
  + "already receives this adjustment. Turning it up declares your scenario, not this page's finding.";

const TIPS = {
  "final-answer": { t: "The final answer (thesis result surface)", b: "This page's conservative planning case at low/committed planning rates, stated beside labeled spans across declared alternatives — never a confidence statement. The strongest external analyst hypothesis this registry carries (above 80%) is NOT part of this surface: it is ranked separately, outside the answer, because ranking someone else's claim is a statement about the evidence record rather than one of this calculator's readings. It is computed ONLY from the clean thesis baseline (the serve-feasibility-filtered evidence-informed default fleet at the Reference traffic anchor); adjusting any control above never moves these values. Every value is a policy-labeled scenario output — placement for closed models is unverified, so no central/verified identity exists, and the comparison slot stays honestly empty. Expert scrutiny is invited: the rationale annex links each number back to its evidence rows.", s: "Owner requirement (2026-07-22): an obvious final answer, rationale linked to evidence, defensible under expert scrutiny." },
  margin: { t: "Modeled unit direct-serving contribution margin", b: "1 − (modeled direct serving cost ÷ the modeled effective price) for the current traffic mix — a list-price metric only when the batch and discount sliders are 0%. Direct serving cost covers accelerator time, occupancy and the modeled serving stack — NOT support, unbilled retries, idle reservations, R&D or sales. This is not an audited accounting gross margin (see report §7 for the bridge), and 'marginal' here is an economic long-run-incremental lens, not the near-zero cash cost of one extra token on an idle server.", s: "Cited ranges (each with its own scope — see §1): TeorTaxes conditional 90→95%; Dylan Patel >80% (Opus, quoted-secondary); fleetingbits reported ~40-50% (accounting observation — the post did not define this calculator's direct-serving metric)." },
  "blended-cost": { t: "Blended serving cost", b: "Cost per 1M tokens across fresh input, cache reads and output on the declared hardware blend, divided by fleet utilization. Finite and capped legs render; infeasible legs produce no numbers. If only part of a blend renders, weights are renormalized over those legs and the result carries a visible blend-renormalized disclosure.", s: "" },
  "blended-price": { t: "Effective price", b: "What 1M tokens of this mix would bill at the selected list prices after cache-read discounts, batch-API share and negotiated discounts — a modeled figure, not observed provider revenue, and not the sticker price.", s: "SemiAnalysis observed Opus effective ~$0.99/Mtok vs $5/$25 sticker on 300:1 agentic traffic with >90% cache hits." },
  "cost-out": { t: "Marginal cost of output tokens", b: "Decode cost per 1M output tokens: GPU-hour cost ÷ (3600 × tokens/s/GPU) ÷ utilization, blended across hardware.", s: "TeorTaxes stated an unclassified \"Serving Opus is at most $4/1Mt\" ceiling; token-class comparability is unresolved." },
  active: { t: "Active parameters", b: "Parameters used per token (MoE routed). Decode FLOPs/token ≈ 2 × active. This is the single most load-bearing unknown for Claude — the total is itself only a page-adopted planning band (2–3T), and active is less known still.", s: "DeepSeek V3: 37B · Kimi K2: 32B · Zephyr on OpenAI: ~100B · TeorTaxes on Fable: \"shockingly FEW active\"" },
  total: { t: "Total parameters", b: "Full weight count — sets HBM needed to hold the model (feasibility tile), not per-token compute.", s: "Musk (Apr 2026): Grok 0.5T = ½ Sonnet = 1/10 Opus — read as the 4.6-era lineup ⇒ Opus 4.6 ≈5T. Current flagship: page-adopted 2–3T band (scalar 2.5T)." },
  precision: { t: "Serving precision", b: "The selection resolves through a reviewed hardware-row tuple: FLOPS basis plus weight, KV and activation bytes. FP4-capable Blackwell rows use their registered dense FP4 basis; non-FP4 rows use an explicit fp4-not-capable fallback tuple, never a global throughput scalar. BF16 likewise resolves per row, including labeled fallback values where the hardware figure is unpublished.", s: "xjdr: GLM 5.2 fp8 experts+KV ≈ zero quality loss; NVFP4 slight regression. InferenceX: GB300 FP4 = 32× H100, FP8 = 17×." },
  ioRatio: { t: "Input : output ratio", b: "Tokens read vs tokens generated. Named observations and conventions vary widely — input pricing and caching dominate real bills at the high end. These are not population ranges for 'chat' or 'agentic coding'.", s: "DeepSeek disclosure ≈4:1 · ncode deployment 8:1 (site-assumed ratio) · calculator Reference convention 15:1 · one Claude Code trace ≈300:1." },
  "kv-state-charge": { t: "KV/state charge per live sequence", b: "Decode performance uses the representative position L = ISL + OSL/2, while capacity reserves the terminal live-cache length LPeak = ISL + OSL. Both derive from the model's architecture registry and traffic profile \u2014 never from a hand-set byte constant. At the Reference mix (representative L = 15,500; peak LPeak = 16,000; FP8 KV), the flagship archetype reserves 0.562176 GB per live sequence for capacity. The earlier 0.5446 GB reconstruction was the representative-position charge and must not size peak residency.", s: "Derived, not assumed: MODEL_ARCH geometry \u00d7 the selected traffic profile's peak live-cache length." },
  cacheHit: { t: "Cache hit rate", b: "Share of input tokens served from prefix cache instead of recomputed. Cached reads bill at ~10% of input price but cost far less than that to serve — caching is a margin machine.", s: "xjdr GLM week: 41% · DeepSeek: 56.3% · SemiAnalysis Claude Code: ~95% (cut their bill 84%)." },
  cacheCost: { t: "Cache-read serving cost", b: "Cost to serve a cached input token, as % of fresh prefill cost (KV storage + bandwidth, near-zero compute). DISCLOSED DEFAULT (b9 M1, r4 action 3): the 5% default is ANALYST-SET, not observed \u2014 no provider publishes a cache-read serving cost. It is separate from, and much smaller than, the published 10% cache-read PRICE. It is load-bearing: with the reference 15:1 mix at 60% cache hits it makes the executed cost identity C = C_out + 15 \u00d7 (0.40 + 0.60 \u00d7 0.05) \u00d7 C_in = C_out + 6.45 \u00d7 C_in, so the input side carries 72.45% of modeled direct cost at the planning baseline; the whole chain is reconstructed component by component, with each source and label and the cache-work boundary it assumes, at research/input-cost-reconstruction.html. Sensitivity 0\u201310% is the honest band.", s: "Analyst-set. The r4 adversarial review recovered this value from the cost arithmetic rather than from the stated defaults \u2014 it is now stated." },
  billCacheHit: { t: "Billable cached-input share", b: "Share of input tokens BILLED at the cache-read tariff. This is a different observable from the serving-side reuse share above it: providers' disk-cache statistics and billing-cache statistics are separate measurements, and no provider publishes both. Default: assumed equal to the serving reuse share (a labeled assumption). Set it separately to test how sensitive the margin is to that assumption — it can move headline provider cases by tens of points.", s: "DeepSeek disclosed a 56.3% disk-cache share; its BILLED cached share is undisclosed." },
  interact: { t: "Serving regime", b: "Selects the reviewed per-hardware declared batch for throughput, balanced or low-latency serving. The declared batch is capped at the topology's feasible batch; a zero feasible batch is explicitly infeasible and produces no throughput or cost. This is an operating-point selector, not a global decode multiplier, and no TTFT/TPOT target is guaranteed.", s: "SGLang GB300: ~11.2k tok/s/GPU at 50 tok/s/user, less at 80. CloudMatrix: 1,943 → 538 tok/s from 50ms → 15ms TPOT." },
  hwMode: { t: "Cost basis", b: "Two of the three named procurement bases are selectable here (b9 M3, D-3). Rental $/hr = the LOW/COMMITTED PLANNING RENT basis: each hardware row's registered rate, a heterogeneous mix of public and analyst-set low/committed planning values that is not one purchasable market basket. Owned TCO = the OWNED/STRATEGIC TCO basis: build the hourly cost from capex, power, datacenter and opex — closer to what a lab with its own fleet pays. The third basis, PUBLIC-CAPACITY RENT (on-demand rate cards), is carried by the China public-cloud lens. Silently substituting one basis for another inside one computed mix is a suite-enforced error; a fleet declared with some legs rented and some owned is allowed, and says so on the leg.", s: "" },
  rentMultLeg: { t: "Procurement discounts by accelerator", b: "What this fleet actually pays per chip-hour, relative to the rate this page registers for each accelerator. 1.00x IS the registered rate — move a leg below it to model a committed or strategic contract, above it to model buying on a market rate card. The FAMILY control moves every accelerator in that family that has no value of its own; a per-accelerator value always wins over its family. These multiply the same registered rows the global multiplier scales, so a posture expressed here is the same kind of claim, just addressed to one leg. Nothing here is a disclosed contract: no lab publishes what it pays, and every value is the reader's or an adjudicator's judgment.", s: "Both round-2 adjudicators priced per accelerator: one at TPU x0.30 / Trainium x0.70 / NVIDIA undiscounted, the other as declared ranges per family (NVIDIA 0.90-1.00, TPU 0.30-0.70, Trainium 0.70-1.00)." },
  rentMult: { t: "GPU-hour cost multiplier", b: "Scales all rental rates. >1 models hyperscaler markup (Anthropic buys via AWS/GCP); <1 models spot/committed pricing. Moving it does not change the lens's declared procurement basis — a 6× stress on the planning vector is still the planning vector, stressed.", s: "TeorTaxes: H100 spot $2.40/hr (Jun 2026) · cloud list ≈ 1.5-1.8× neocloud." },
  /* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): the absolute
     controls carry the same source discipline at fleet and donor granularity. */
  rentAbsAll: { t: "Rental price, all accelerators", b: "Your stated absolute $/accelerator-hour replaces every registered rental rate. It is not multiplied by the global, family or per-accelerator multipliers. Leave it unset to use the registered rates. No lab publishes what it pays, so setting this is the reader's own claim, not this page's observation.", s: "Reader-stated scenario input; no representative lab contract price is public." },
  rentAbsLeg: { t: "Absolute rental price by accelerator", b: "Your stated absolute $/accelerator-hour for a donor replaces both its registered rate and the fleet-wide absolute price. It is not multiplied. On a custom fleet the donor key governs every leg cloned from that accelerator, including a leg with its own rentPerHr override. No lab publishes what it pays, so each value is the reader's own claim.", s: "Reader-stated scenario input; no representative lab contract price is public." },
  util: { t: "Fleet utilization", b: "Share of paid GPU-hours doing revenue work. Fleets are provisioned for peak; nights/weekends and failover idle the rest. All costs divide by this, so paid slack is allocated to served tokens.", s: "DeepSeek avg/peak nodes ⇒ ~81% (one disclosure). No representative industry distribution is public; the 50% default is an analyst central scenario and 30-60% a speculative sensitivity band." },
  energy: { t: "Serving energy (Wh per M tokens)", b: "Physical serving-energy intensity at the achieved operating point: operating power × PUE ÷ achieved throughput. Operating power is the TDP proxy (no per-accelerator operating-power measurement is public — a labeled analyst convention with a typed override hook). Deliberately NO utilization divisor: the dollar path allocates paid idle to served tokens, while the Wh figure deliberately does not. Idle boards DO draw power; this page does not model that draw, so the Wh figure is an operating-point intensity and not a fleet-average one, and charging full-power idle hours as energy would overstate it. Scope is accelerator × PUE only — full-stack telemetry (accelerators ≈58% of per-prompt energy, 1.72× stack overhead) implies a full-stack figure ≈1.4× above this at the default PUE. Cache reads are charged the same analyst-set 5%-of-prefill fraction the cost side uses, as a proxy.", s: "DeepSeek H800 decode disclosure ⇒ ≈131 Wh/Mtok output-side at 700 W × 1.25 PUE; Google telemetry: ≈0.24 Wh median per text prompt, full stack." },
  procBasis: { t: "Procurement basis", b: "Every scenario preset is typed to one of three named procurement bases (b9 M3, D-3): PUBLIC-CAPACITY RENT (on-demand rate cards — the China public-cloud lens), LOW/COMMITTED PLANNING RENT (the registered heterogeneous planning vector — this page's default), and OWNED/STRATEGIC TCO (hourly cost from capex, power, datacenter, opex). Silently substituting one basis for another inside one computed mix is a suite-enforced error; a fleet declared with some legs rented and some owned is allowed, and says so on the leg. Electricity dollars are explicit ONLY under owned/strategic TCO; under rent bases they are embedded in the rent and not separately decomposable — decomposing rent without TCO assumptions would be fabrication.", s: "" },
  stackMult: { t: "Serving-stack efficiency", b: "MEASURED STACK COMPOSITION relative to the published-open-practice baseline (b9 M5, D-5 adjudication): 1.0 is the SAME referent as the algorithmic-lead slider's zero. The old 1.25 \"frontier lab (assumed)\" label is retired — a frontier assumption is exactly what the algorithmic-lead slider now represents defensibly (1.25× ≈ +2.4 months at 3×/yr), and holding the assumption in two places at once double-counts it; setting both above their baselines fires a non-blocking overlap warning. Composes outside the reviewed roofline calibration: eta_eff = per-row eta_dec × this factor for decode, and eta_pre_eff = the universal prefill eta_pre × this factor. It does not change the declared batch, precision tuple or traffic-derived length. Dive-replay values keep their anchored-replay meaning.", s: "InferenceX: software alone took B300 R1 from 1k → 14k tok/s/GPU (14×). Baseline already includes most of that." },
  trendMonths: { t: "Algorithmic lead (months vs published open practice)", b: "A broad, UNSPECIFIED efficiency prior: how many months of algorithmic progress a lab's private serving stack is ahead of published open practice, in RESIDUAL, non-hardware, accelerator-portable gains that this page does not otherwise model. E = rate^(months/12) and modeled cost-out divides by E, in every serving phase. The per-lab defaults are an OWNER-RATIFIED SCENARIO PRIOR, not a measurement: Anthropic/OpenAI/Google +3 · DeepSeek +1 (+2 defensible) · other frontier Chinese labs 0 (their published open work DEFINES the zero) · labs with no ratified prior 0, labeled unassessed. Below zero is permitted. It is inert under a published-operating-point replay — the lab's actual efficiency is already inside one. VALIDITY: only residual gains count; hardware, quantization, batching and caching are modeled elsewhere, and representing them here too double-counts. AXIS DISCIPLINE: capability lag (~4 months, Epoch-measured) is a DIFFERENT axis and is never this slider. REFUSED: the published PRICE series (9×-900×/yr — Epoch price index, a16z 10×, AI Index 280×) measure tariffs, not serving efficiency; this slider never uses them.", s: "Gundlach et al., arXiv:2511.23455 (MIT FutureTech) + Epoch AI data: ~3×/yr algorithmic efficiency, halving ≈7.57 months." },
  trendRate: { t: "Algorithmic-progress rate", b: "The ×/yr rate the months convert through: E = rate^(months/12). 3×/yr is the ratified default (halving ≈7.57 months); 2× and 5× are the pre-registered sensitivity settings. Only these three are selectable — an interpolated rate would be an unratified number wearing a ratified label.", s: "3×/yr central; the 2×/5× brackets are sensitivity, not competing estimates." },
  /* b9 spec-decode LEVER — manifest row 8, RATIFIED (esc-20260801T042349Z-20c444d8). The lever's
     PRIMARY disclosure surface, and the second of the two places the Q-A ruling requires the gate's
     conservatism to appear (the memo is the other). The two claim-bearing stretches are the fully
     expanded canonical constants, byte-for-byte and in this order — T-21a asserts the composition,
     so the tip cannot drift from the why-line or the methods box the way it did in rounds 6 and 9.
     `s` is deliberately EMPTY: the ratified bytes already carry the evidence, in its two classes
     with their dates and their limits, and a source line would be a second unpinned statement of
     the same evidence. */
  specDec: { t: SPECDEC_CONTROL_LABEL, b: SPECDEC_TIP_HEAD
    + " When it is available: only from the \"no MTP/disagg\" stack setting (0.7). "
    + SPECDEC_GATE_SEMANTICS
    + " What that costs you: " + SPECDEC_CONSERVATISM
    + ". Turning this up declares your scenario, not this page's finding.", s: "" },
  /* d-im-h800 (owner note aca09d, 2026-08-18) — the lever's PRIMARY disclosure surface. Composed from
     the canonical constants below so the tip, the section title, the per-leg copy and the chart note
     cannot drift apart. */
  nvlinkCapMinRatio: { t: NVLINKCAP_CONTROL_LABEL, b: NVLINKCAP_TIP_HEAD + " " + NVLINKCAP_WHAT_IT_DOES + " "
    + NVLINKCAP_WHAT_THE_ENGINE_SAYS + " " + NVLINKCAP_WHAT_IT_IS_NOT,
    s: "NVIDIA H800 datasheet (2631447, Feb 2023) vs H100 SXM datasheet: NVLink 400 vs 900 GB/s and FP64 1 vs 34 TF are the ONLY deltas — FP8/BF16 rate, 80 GB HBM3, 3.35 TB/s and 700 W identical. DeepSeek-V3 report §3.2/§3.4: NVLink 160 GB/s vs IB 50 GB/s in their H800 nodes; the decode all-to-all runs 'via direct point-to-point transfers over IB'." },
  familySliders: { t: "Family efficiency multipliers", b: "One broad, UNSPECIFIED efficiency multiplier per hardware family (NVIDIA / TPU / Trainium / Ascend). It multiplies achieved throughput for EVERY card in that family, in every serving phase, in any fleet — named, preset or custom. Nothing here is sourced: it is a stress lever for \"suppose this family's real serving efficiency is N% off our calibration\", not a measurement. Custom-fleet legs ride their donor's family; a renamed leg tagged \"unclassified\" is exempt and says so on the leg. It does not change declared batch, precision tuples, capacity or feasibility. Pair it with the algorithmic-lead prior only deliberately — the interlock guards accidental stacking of two broad unspecified improvements.", s: "Unsourced by construction — a declared stress multiplier, never an anchor." },
  interlock: { t: "Broad-lever interlock", b: "The family multipliers and the algorithmic-lead prior are both broad, UNSPECIFIED efficiency assumptions, so composing them silently would count the same improvement twice. Editing either group therefore locks the other, with the reason stated inline. Because the ratified lead defaults start nonzero, the FIRST family edit REPLACES the prior — the lead is set to 0 and locked, loudly, so every headline move stays attributable. Unlock is always available and always deliberate: it carries a confirmation and leaves a persistent stacking banner. SPECIFIED levers — serving precision, serving regime, the cache controls — are NEVER locked by this machinery; where they overlap the prior you get a non-blocking warning instead. Selecting any preset, model or perspective resets the machine.", s: "" },
  sliderLock: { t: "Slider scroll-lock", b: "On touch devices a scrolling gesture can land on a slider and change a number without you meaning to. On the first slider interaction this page offers three choices: edit sliders normally, keep them static for this visit, or lock them and stop asking. While locked, the scenario section header carries a lock icon — tap it to reopen the choice. This lock is about SCROLL SAFETY only; it is a different mechanism, with a different icon and reason, from the broad-lever interlock.", s: "" },
  kwh: { t: "Electricity price", b: "US industrial ≈ $0.087 (EIA May-2026; page span 0.06–0.12, provisional).",
    s: "EIA Electric Power Monthly Table 5.3, May-2026 industrial average; page-set bottom/top are analyst-provisional pending the T4 evidence dive." },
  pue: { t: "PUE", b: "Power Usage Effectiveness — total facility power ÷ IT power (cooling etc.).", s: "Modern liquid-cooled: 1.1-1.3." },
  dcPerW: { t: "Datacenter capex", b: "$ per watt of IT capacity to build the shell+power+cooling, amortized over ~12 years here.", s: "SemiAnalysis-style estimates: $9-15/W." },
  lifeYears: { t: "GPU depreciation", b: "Years over which accelerator capex is written off. Shorter = more expensive tokens.", s: "Debated 3-6 years across the discourse; hyperscalers' server accounting uses 5-6. The 5-year default is a page-set scenario value." },
  clusterOh: { t: "Cluster overhead", b: "Multiplier on GPU capex for CPUs, networking, storage, integration.", s: "" },
  /* im-arc T4 fold (2026-08-24), memo §2: RELABEL only — the numeric semantics and the band are
     HELD, because the two arms' annual bands ({0.5, 1.5, 2.5} vs {4, 7, 12} %/yr) sit on
     different denominators. What was wrong was presenting 8 as an annual figure: it is 8% of the
     straight-line capex-hour line, whose per-year equivalent DEPENDS ON THE LIFE. */
  opexPct: { t: "Operations overhead", b: "Staff, maintenance and spares as a % of the straight-line hourly capex line — not an annual rate. Per year of original clustered capex that is 2.0 % at a 4-year life, 1.6 % at 5 years, and about 1.33 % at 6.", s: "" },
  dcLifeYears: { t: "Facility economic life", b: "Years the shell and MEP are amortized over. Analyst-set 10 / 15 / 20 blend from dated audited asset lives; the cost corners are REVERSED, because a longer facility life is a lower hourly cost. Replaces a hard-coded 12-year literal.", s: "" },
  capitalRecovery: { t: "Economic capital recovery (CRF)", b: "Off by default everywhere — in the basic view, in the advanced view, in a shared link and over MCP. When on, a disclosed line is added beside straight-line depreciation: [CRF(r, L) - 1/L] x financed capital / 8760, once for clustered accelerator capex at the accelerator life and once for shell and MEP at the facility life. The two lines sum to CRF x capital / 8760, so principal is never counted twice.", s: "" },
  costOfCapitalPct: { t: "Cost of capital", b: "Analyst-set 6 / 8.5 / 13 %. Consumed ONLY when capital recovery is on; a higher rate is a higher cost, so 6 % is the cost-bottom corner and 13 % the cost-top.", s: "" },
  priceIn: { t: "Input price", b: "List $/M input tokens.", s: "Opus $5 (fast $10) · Sonnet 5 $2 intro / $3 std · DeepSeek V4 Pro $0.435." },
  priceOut: { t: "Output price", b: "List $/M output tokens.", s: "Opus $25 (fast $50) · Sonnet 5 $10 intro / $15 std · GPT-5.6 Sol $30 · V4 Pro $0.87." },
  cacheReadMult: { t: "Cache-read price", b: "What cached input tokens bill, as % of the input price.", s: "Anthropic: 10% of base input." },
  cacheWriteShare: { t: "Cache-write share", b: "Share of FRESH input tokens billed as cache writes (at the write premium). Default 0 keeps write billing out of the mix — raise it to model providers that bill writes explicitly. Serving-cost side is unchanged: the KV is produced by prefill either way (storage is unmodeled).", s: "OpenAI bills writes at 1.25× input; Anthropic 1.25× (5-min) / 2× (1-hr) tiers." },
  cacheWriteMult: { t: "Cache-write price", b: "What written tokens bill, as % of the input price.", s: "OpenAI: 125%. Anthropic: 125% (5-min TTL) or 200% (1-hr TTL)." },
  batchShare: { t: "Batch-API share", b: "Share of traffic on the 50%-off batch tier.", s: "" },
  discount: { t: "Average discount", b: "Blended negotiated/enterprise/volume discount off list.", s: "" },
  blend: { t: "Hardware blend", b: "Traffic share by accelerator. Anthropic uniquely runs three platforms: NVIDIA GPUs, Google TPUs (up to ~1M chip deal), AWS Trainium (Rainier launched ~500k; >1M in use by Apr 2026). The China rows (H800 stock, legal H20s, Huawei Ascend 910C) are what DeepSeek/GLM/Kimi realistically serve on under export controls.", s: "" },
  feas: { t: "Serving feasibility", b: "Per declared fleet leg, the roofline checks resident weights plus batch-scaled KV memory plus 10% HBM reserve at the selected topology. It renders the operating-point basis and either finite, capped (declared batch reduced to the feasible batch), or infeasible with no numeric throughput/cost.", s: "" },
  subPlan: { t: "Plan price", b: "Monthly subscription price.", s: "Pro $20 · Max 5× $100 · Max 20× $200." },
  subUsage: { t: "API-equivalent usage", b: "What the user's monthly consumption would cost at list API prices (what ccusage reports).", s: "melvynx: $3.2k/mo capacity on Max 20x · olofj: $3k/mo actual · Earth_1729: $8k/4wk · ksred: ~$1.9k/mo over 8 months." },
};

/* ---------- parameter definitions (sliders) ---------- */
const SECTIONS = [
  { title: "Model architecture", params: [
    { k: "active", label: "Active parameters", unit: "B", min: 15, max: 800, step: 5, log: true, tip: "active", tier: "advanced",
      ticks: [{ v: 37, l: "DeepSeek V3" }, { v: 100, l: "OAI≈100 (Zephyr)", alt: true }, { v: 300, l: "Opus est." }, { v: 800, l: "Mythos ceiling", alt: true }] },
    { k: "total", label: "Total parameters", unit: "B", min: 200, max: 6000, step: 50, log: true, tip: "total", tier: "basic",
      ticks: [{ v: 500, l: "Grok (Musk)" }, { v: 1000, l: "Sonnet≈1T", alt: true }, { v: 1600, l: "DS V4 Pro" }, { v: 2500, l: "Opus 4.8≈2.5T (adopted)" }, { v: 5000, l: "Opus 4.6≈5T (Musk)" }] },
    { k: "precision", label: "Serving precision", type: "select", options: [["fp8", "FP8 (assumed frontier norm)"], ["fp4", "FP4 / NVFP4 (Blackwell+)"], ["bf16", "BF16 (conservative)"]], tip: "precision", tier: "basic" },
  ]},
  { title: "Traffic mix (I/O + cache)", params: [
    { k: "ioRatio", label: "Input : output ratio", unit: ":1", min: 1, max: 300, step: 1, log: true, tip: "ioRatio", tier: "basic",
      ticks: [{ v: 4, l: "DeepSeek 4:1" }, { v: 15, l: "Reference convention" }, { v: 100, l: "agentic scenario", alt: true }, { v: 300, l: "Claude Code 300:1" }] },
    { k: "cacheHit", label: "Cache hit rate", unit: "%", min: 0, max: 95, step: 1, tip: "cacheHit", tier: "basic",
      ticks: [{ v: 41, l: "xjdr 41%" }, { v: 56, l: "DeepSeek 56%", alt: true }, { v: 95, l: "Claude Code 95%" }] },
    { k: "interact", label: "Serving regime (declared decode batch; prefill is resolved separately)", type: "radio", options: [["batch", "Throughput regime (declared batch; may cap)"], ["balanced", "Balanced regime (declared batch; may cap)"], ["fast", "Low-latency regime (declared batch; may cap)"]], tip: "interact", tier: "advanced" },
  ]},
  /* row 499 (COMPLETENESS DOCTRINE, owner ruling): its own section, because the ruling is that a
     reader must be able to compute anything an adjudicator assumes — and both round-2 adjudicators
     assumed PER-ACCELERATOR procurement discounts that this page could only express as one global
     multiplier. One of them wrote its procurement posture into the per-family EFFICIENCY keys for
     want of anywhere else to put it, which is the clearest possible evidence that the control was
     missing rather than merely inconvenient. */
  { title: "Procurement discounts by accelerator", params: [
    { k: "rentMultLeg", type: "rent-discounts", tip: "rentMultLeg", tier: "advanced" },
    { k: "rentAbsLeg", type: "rent-absolute", tip: "rentAbsLeg", tier: "basic", showIf: s => s.hwMode === "rent" },
  ]},
  { title: "Hardware blend & cost", params: [
    { k: "blend", type: "blend", tip: "blend", tier: "basic" },
    { k: "hwMode", label: "Cost basis", type: "radio", options: [["rent", "Rental $/hr"], ["tco", "Owned TCO"]], tip: "hwMode", tier: "basic" },
    { k: "rentAbsAll", label: "Rental price, all accelerators", unit: "$/accelerator-hour", type: "nullable-number", min: 0.05, max: 50, step: 0.05, nullable: "not set — use registered rates", showIf: s => s.hwMode === "rent", tip: "rentAbsAll", tier: "basic" },
    { k: "rentMult", label: "GPU-hour cost multiplier", unit: "×", min: 0.5, max: 2, step: 0.05, showIf: s => s.hwMode === "rent", tip: "rentMult", tier: "advanced",
      ticks: [{ v: 0.8, l: "0.8× vector" }, { v: 1.0, l: "registered vector" }, { v: 1.6, l: "1.6× stress" }] },
    { k: "util", label: "Fleet utilization", unit: "%", min: 15, max: 95, step: 1, tip: "util", tier: "basic",
      ticks: [{ v: 35, l: "peak-provisioned" }, { v: 50, l: "central scenario", alt: true }, { v: 81, l: "DeepSeek ~81%" }] },
    /* b9 M5 §11.2 (D-5 adjudication): ticks RELABELED, values/range/step unchanged. 1.0 names the
       same referent as the algorithmic-lead zero; the retired "frontier lab (assumed)" label moves
       to the trend slider, which represents that assumption defensibly. */
    { k: "stackMult", label: "Serving-stack efficiency", unit: "×", min: 0.4, max: 1.6, step: 0.05, tip: "stackMult", tier: "advanced",
      ticks: [{ v: 0.7, l: "no MTP/disagg" }, { v: 1.0, l: "published open practice (SGLang class)" }, { v: 1.25, l: "measured-composition stress (≈ +2.4 mo equivalent at 3×/yr)", alt: true }] },
  ]},
  /* b9 M5 (memo §8.1): the family multipliers get their OWN section, immediately after the
     hardware blend they act on. `interlockGroup` tells the app which lever group this section
     belongs to — the app renders the lock state, the why-line and the unlock affordance from it;
     the engine stays DOM-free. */
  { title: "Family efficiency multipliers", interlockGroup: "family", params: [
    { k: "famNvidia", label: "NVIDIA family", unit: "×", min: 0.50, max: 1.50, step: 0.01, tip: "familySliders", tier: "basic",
      ticks: [{ v: 0.75, l: "broad stress", alt: true }, { v: 1.0, l: "no family adjustment" }, { v: 1.25, l: "broad stress", alt: true }] },
    { k: "famTpu", label: "Google TPU family", unit: "×", min: 0.50, max: 1.50, step: 0.01, tip: "familySliders", tier: "basic",
      ticks: [{ v: 0.75, l: "broad stress", alt: true }, { v: 1.0, l: "no family adjustment" }, { v: 1.25, l: "broad stress", alt: true }] },
    { k: "famTrainium", label: "AWS Trainium family", unit: "×", min: 0.50, max: 1.50, step: 0.01, tip: "familySliders", tier: "advanced",
      ticks: [{ v: 0.75, l: "broad stress", alt: true }, { v: 1.0, l: "no family adjustment" }, { v: 1.25, l: "broad stress", alt: true }] },
    { k: "famAscend", label: "Huawei Ascend family", unit: "×", min: 0.50, max: 1.50, step: 0.01, tip: "familySliders", tier: "advanced",
      ticks: [{ v: 0.75, l: "broad stress", alt: true }, { v: 1.0, l: "no family adjustment" }, { v: 1.25, l: "broad stress", alt: true }] },
  ]},
  /* b9 M5 (memo §9): the algorithmic-lead prior. Its own section so the interlock's lock state,
     why-line and unlock affordance attach to exactly one group. */
  { title: "Algorithmic lead (scenario prior)", interlockGroup: "trend", params: [
    { k: "trendMonths", label: "Algorithmic lead (months vs published open practice)", unit: "mo", min: -12, max: 12, step: 1, tip: "trendMonths", tier: "basic",
      ticks: [{ v: -6, l: "−6 (behind)", alt: true }, { v: 0, l: "published open practice" }, { v: 3, l: "ratified closed-lab default" }, { v: 12, l: "+12 stress", alt: true }] },
    { k: "trendRate", label: "Algorithmic-progress rate", type: "select", numeric: true, tip: "trendRate", tier: "advanced",
      options: [[2, "2×/yr (conservative sensitivity)"], [3, "3×/yr — ratified default (halving ≈7.57 mo)"], [5, "5×/yr (aggressive sensitivity)"]] },
  ]},
  /* b9 spec-decode LEVER (memo D-SD-6; manifest rows 22-26, RATIFIED) — its OWN section, placed
     immediately after the algorithmic-lead prior, and deliberately carrying NO `interlockGroup`:
     the app renders lock state from that field, and `specDec` is a SPECIFIED lever, which D-5
     Amendment 2 says is never locked by the interlock. A section that named a group would render
     a lockable control for a lever the machine must never write.

     The bounds are written as literals rather than read from SPECDEC_BOUNDS because that constant
     is declared further down the file and a `const` cannot be read before its own declaration is
     evaluated; the suite asserts the two agree, so there is still exactly one authority.

     The vendor ">15%" figure is deliberately NOT a tick: a single-source self-report at a
     non-flagship lab must not carry the same visual authority as the two measurements. It lives in
     the tip, source-classed and quote-dated. */
  { title: SPECDEC_SECTION_TITLE, params: [
    { k: "specDec", label: SPECDEC_CONTROL_LABEL, unit: "×", min: 1.00, max: 1.60, step: 0.01, tip: "specDec", tier: "basic",
      ticks: [{ v: 1.00, l: "no credit — this page's default" },
              { v: 1.14, l: "≈14% — production-like batch (SGLang-reported open-stack measurement)" },
              { v: 1.60, l: "≈60% — modest concurrency (SGLang-reported open-stack measurement)", alt: true }] },
  ]},
  /* d-im-h800 (owner note aca09d): the H800/H100 differential — its OWN section, right after the
     spec-decode lever, no `interlockGroup` (a SPECIFIED lever, never locked). Bounds are literals for
     the same reason as specDec's (NVLINKCAP_BOUNDS is declared further down; the suite asserts the
     two agree). Bounds [1.00, 1.25] (Pro review 2026-08-18 Q3: no value below 1.00 — removing a cap
     cannot itself slow a part; the upper bound is a residual-scale sensitivity, not a 50% unexplained
     gain). The ticks are labeled for what they ARE: 1.00 is neutral and the historical model; 1.10 is
     an EXAMPLE scenario, not an endorsed value; 1.25 an upper stress. The engine's own computed
     serial-exposure counterfactual renders live beside the control and under the hardware chart — a
     static tick cannot carry a state-dependent number honestly. */
  { title: NVLINKCAP_SECTION_TITLE, params: [
    { k: "nvlinkCapMinRatio", label: NVLINKCAP_CONTROL_LABEL, unit: "×", min: 1.00, max: 1.25, step: 0.01, tip: "nvlinkCapMinRatio", tier: "basic",
      ticks: [{ v: 1.00, l: "1.00 — neutral: the borrowed fit is taken as-is (this page's default)" },
              { v: 1.10, l: "1.10 — example scenario: uncapped part at least 10% faster than its capped counterfactual", alt: true },
              { v: 1.25, l: "1.25 — upper stress", alt: true }] },
  ]},
  { title: "Owned-TCO inputs", showIf: s => s.hwMode === "tco", params: [
    { k: "kwh", label: "Electricity", unit: "$/kWh", min: 0.03, max: 0.15, step: 0.0001, tip: "kwh", tier: "basic",
      ticks: [{ v: 0.05, l: "PPA" },
              { v: 0.0871, l: "US industrial ≈ $0.087 (EIA May-2026; page span 0.06–0.12, provisional)" },
              { v: 0.12, l: "constrained grid", alt: true }] },
    { k: "pue", label: "PUE (cooling overhead)", unit: "", min: 1.05, max: 1.5, step: 0.01, tip: "pue", tier: "basic",
      ticks: [{ v: 1.1, l: "liquid-cooled" }, { v: 1.35, l: "legacy air", alt: true }] },
    /* im-arc T4 fold (2026-08-24), memo §2: the ticks now name their DATED anchors. The prior
       "SemiAnalysis-ish" label is withdrawn — neither arm could attribute it to a public
       statement, and the scope (shell + MEP per delivered IT watt, excluding compute and
       scale-out networking) was never stated at all. */
    { k: "dcPerW", label: "Datacenter capex", unit: "$/W", min: 5, max: 20, step: 0.5, tip: "dcPerW", tier: "advanced",
      ticks: [{ v: 9.5, l: "JLL lower delivered-watt anchor (2026)" },
              { v: 12.5, l: "frontier liquid-ready middle — Turner & Townsend / Epoch (2026)" },
              { v: 17, l: "Abilene ≈ $15bn ÷ ≈1.2 GW (2026)", alt: true }] },
    { k: "lifeYears", label: "GPU depreciation", unit: "yr", min: 2, max: 8, step: 0.5, tip: "lifeYears", tier: "basic",
      ticks: [{ v: 4, l: "4 yr — cost TOP corner (Nebius pre-2026)" }, { v: 5, l: "scenario default" },
              { v: 6, l: "6 yr — cost BOTTOM corner (MSFT/GOOG/ORCL/CRWV)", alt: true }] },
    { k: "dcLifeYears", label: "Facility economic life", unit: "yr", min: 5, max: 30, step: 1, tip: "dcLifeYears", tier: "advanced",
      ticks: [{ v: 10, l: "10 yr — cost TOP corner" }, { v: 12, l: "12 yr — the pre-fold hard-coded literal" },
              { v: 15, l: "scenario default" }, { v: 20, l: "20 yr — cost BOTTOM corner", alt: true }] },
    { k: "clusterOh", label: "Cluster overhead", unit: "×", min: 1.1, max: 1.6, step: 0.05, tip: "clusterOh", tier: "advanced" },
    { k: "opexPct", label: "Operations overhead", unit: "%", min: 2, max: 20, step: 1, tip: "opexPct", tier: "advanced" },
  ]},
  /* im-arc T4 fold (2026-08-24), memo §2.1 [F6]: the named basis is EXPOSED in the advanced
     tier and OFF by default there, exactly as it is off in the basic tier, in the codec and over
     MCP. A tier is a display filter; it is never an input. */
  { title: "Economic capital recovery (advanced basis — off by default)", showIf: s => s.hwMode === "tco", params: [
    { k: "capitalRecovery", label: "Capital-recovery basis", unit: "", enum: ["off", "on"], tip: "capitalRecovery", tier: "advanced",
      ticks: [{ v: "off", l: "off — straight-line depreciation (this page's default everywhere)" },
              { v: "on", l: "on — add the disclosed CRF increment", alt: true }] },
    { k: "costOfCapitalPct", label: "Cost of capital", unit: "%", min: 0, max: 40, step: 0.5, tip: "costOfCapitalPct", tier: "advanced",
      ticks: [{ v: 6, l: "6 % — cost BOTTOM corner" }, { v: 8.5, l: "8.5 % — middle assumption" },
              { v: 13, l: "13 % — cost TOP corner", alt: true }] },
  ]},
  { title: "Pricing & discounts", params: [
    { k: "priceIn", label: "Input price", unit: "$/Mtok", min: 0.2, max: 32, step: 0.05, log: true, tip: "priceIn", tier: "basic",
      ticks: [{ v: 0.55, l: "R1" }, { v: 2, l: "Sonnet 5", alt: true }, { v: 5, l: "Opus" }, { v: 10, l: "Opus fast", alt: true }] },
    { k: "priceOut", label: "Output price", unit: "$/Mtok", min: 0.8, max: 160, step: 0.25, log: true, tip: "priceOut", tier: "basic",
      ticks: [{ v: 2.19, l: "R1" }, { v: 10, l: "Sonnet 5", alt: true }, { v: 25, l: "Opus" }, { v: 50, l: "Opus fast", alt: true }] },
    { k: "cacheReadMult", label: "Cache-read price", unit: "% of input", min: 0, max: 100, step: 1, tip: "cacheReadMult", tier: "advanced",
      ticks: [{ v: 10, l: "Anthropic 10%" }] },
    { k: "cacheWriteShare", label: "Cache-write share", unit: "% of fresh input", min: 0, max: 100, step: 5, tip: "cacheWriteShare", tier: "advanced" },
    { k: "cacheWriteMult", label: "Cache-write price", unit: "% of input", min: 100, max: 200, step: 5, tip: "cacheWriteMult", showIf: s => s.cacheWriteShare > 0, tier: "advanced",
      ticks: [{ v: 125, l: "OpenAI/Anthropic 5-min" }, { v: 200, l: "Anthropic 1-hr", alt: true }] },
    { k: "cacheCost", label: "Cache-read serving cost", unit: "% of prefill", min: 0, max: 25, step: 1, tip: "cacheCost", tier: "advanced" },
    { k: "billCacheHit", label: "Billable cached-input share", unit: "%", min: 0, max: 95, step: 1, tip: "billCacheHit", nullable: "= serving reuse", tier: "advanced" },
    { k: "batchShare", label: "Batch-API share", unit: "%", min: 0, max: 60, step: 1, tip: "batchShare", tier: "basic" },
    { k: "discount", label: "Average discount off list", unit: "%", min: 0, max: 60, step: 1, tip: "discount", tier: "basic" },
  ]},
];

/* ---------- engine ---------- */
// Scenario identity is deliberately kept OUTSIDE the serializable numeric state: model id and
// named traffic family select roofline geometry/context, but they remain codec identity, not
// sliders. applyPresetSettings registers that identity for pure-engine callers; browser/MCP
// callers that clone state pass the same context explicitly.
const SCENARIO_CONTEXT = new WeakMap();
function makeScenarioContext(m, tr, customDonor, perspKind, perspId) {
  const matched = tr && tr.profileId == null ? matchTrafficProfile(tr.ioRatio, tr.cacheHit) : null;
  // customDonor (slice-3 review R7 P1 fix): rooflinePoint()/resolveArch() consult ctx.customDonor
  // for model="custom" only; passing it through unconditionally is harmless for every other model
  // (resolveArch ignores the field unless modelId === "custom").
  /* b9 M5: perspKind carries the selected perspective's KIND so trendFactor() can force E = 1
     under a replay (D-5). Optional and absent-safe: a context without it falls back to the state's
     own trendMonths, which applyPresetSettings already seeds to 0 for every replay. A synthetic
     MODIFIED state has no perspective and correctly reports none — it is no longer a replay. */
  return { modelId: m.id, profileId: tr ? (tr.profileId ?? (matched ? matched.id : null)) : m.nativeTraffic,
           customDonor, perspKind: perspKind ?? null, perspId: perspId ?? null };
}
// The WeakMap above is keyed by OBJECT IDENTITY, so it goes stale/absent whenever a caller
// replaces the state object (structuredClone) or changes the intended model/traffic while
// keeping the same object (a live model switch during a "modified" state). Every place S is
// REPLACED or its intended model/traffic TRANSITIONS while identity is kept must call this to
// re-associate the correct context (slice-3 review R7 P1 fix; app.js:314,558/refreshModifiedState
// are exactly those three points). Any caller that instead has explicit modelId/traffic on hand
// (encodeScenario is the prototypical case) should derive its OWN context via makeScenarioContext
// and pass it as `supplied` — never depend on this WeakMap being current.
function registerScenarioContext(s, ctx) {
  SCENARIO_CONTEXT.set(s, ctx);
  return ctx;
}
/* ---------- state-replacement/transition sites (review R7b fix) ----------
   The three exact production call sites app.js uses whenever S is replaced or its intended
   model/traffic transitions (loadSavedPreset, the modified-link restore branch of
   loadScenarioFromURL, refreshModifiedState) are extracted here as pure, DOM-free functions —
   app.js calls THESE, and so do the regression tests. R7 found the first version of those tests
   vacuous: they called registerScenarioContext() directly inside the test, which still passes
   even if these three functions (or their registerScenarioContext call) are reverted, because the
   test re-did the registration itself. Testing THESE functions instead — the actual code app.js
   runs — means a reversion here is what makes the tests fail, not a parallel test-only mechanism. */
// loadSavedPreset: validate a saved numeric diff against the current schema before merging it over
// DEFAULTS, then register under the given model/traffic. Epoch equality alone is not authority:
// localStorage is user-editable, and an older v22 UI could persist active > total.
/* b9 spec-decode LEVER ([N-CORRECTION-LIFETIME] rule 1): the return contract is now
   `{state, corrections}`. This function DISCARDED its own `validated` result before — it computed a
   sanitize outcome and returned a bare state — so a forced correction had nowhere to go and
   localStorage, which is user-editable, was a state-construction path that could silently rewrite a
   setting. Additive: every field of the old return is `.state`. */
function restoreSavedPresetState(saved, m, tr) {
  const validated = sanitizeScenarioDiff(saved, null, DEFAULTS);
  if (validated.rejected.length)
    throw new TypeError("saved scenario failed current schema validation");
  const s = Object.assign(structuredClone(DEFAULTS), validated.diff);
  registerScenarioContext(s, makeScenarioContext(m, tr, s.customDonor));
  return { state: s, corrections: validated.corrections };
}
// loadScenarioFromURL's modified-link branch: merge a sanitized diff over DEFAULTS, pin the
// declared traffic identity into S (a modified state's traffic IS its working values — displayed
// == resolved == computed), then register under the given model at that traffic.
function restoreModifiedLinkState(diff, declaredTraffic, m) {
  const s = Object.assign(structuredClone(DEFAULTS), structuredClone(diff));
  s.ioRatio = declaredTraffic.ioRatio; s.cacheHit = declaredTraffic.cacheHit;
  const tr = { mode: "custom", profileId: null, ioRatio: s.ioRatio, cacheHit: s.cacheHit };
  registerScenarioContext(s, makeScenarioContext(m, tr, s.customDonor));
  return s;
}
// refreshModifiedState: S keeps its identity, but a model switch while modified re-resolves
// traffic onto it and registers context under the NEW model (the WeakMap entry from whenever S
// was created still points at the OLD one).
function applyModelSwitchWhileModified(s, m, tr) {
  if (tr) { s.ioRatio = tr.ioRatio; s.cacheHit = tr.cacheHit; }
  registerScenarioContext(s, makeScenarioContext(m, tr, s.customDonor));
  return s;
}
function scenarioContext(s, supplied) {
  const ctx = supplied || (s && typeof s === "object" ? SCENARIO_CONTEXT.get(s) : null);
  if (!ctx || !ctx.modelId)
    throw new Error("roofline scenario context missing (modelId is required outside applyPresetSettings state)");
  return ctx;
}
/* The roofline module's identity cannot change once it is loaded: in node a cached require()
   returns the same exports object every time, and in the browser these are the top-level consts
   of an already-loaded classic script, none of which is ever rebound. So it is resolved once, on
   first use, and held. The dual-mode branch survives verbatim -- only the repetition is gone,
   and it was not cheap: one adjust_rental_rate call entered here 17,739 times, which in node was
   17,739 CommonJS resolutions and in the browser 17,739 fresh twelve-field objects. */
let ROOFLINE_CORE = null;
function rooflineCore() {
  if (ROOFLINE_CORE) return ROOFLINE_CORE;
  if (typeof module !== "undefined" && module.exports) return (ROOFLINE_CORE = require("./engine-roofline-v22.js"));
  return (ROOFLINE_CORE = { RooflineDataError, resolveArch, resolveHwRoofline, resolveTrafficLengths,
           contextWindowStatus, prefillRoofline, renderPoint,
           capacityWidthSolve, // R2: the live render path solves widths in the browser too
           decodeRoofline, resolvePrecisionTuple, // form-correction debt renders live in the browser too
           encodeCustomDonor, decodeCustomDonor, CUSTOM_DONOR_BOUNDS });
}
function contextLimitSourceFor(ctx) {
  return ctx.modelId === "custom"
    ? "ARCH_DONORS." + (ctx.customDonor || "dsr1") + " (donor-derived custom geometry)"
    : "MODEL_ARCH." + ctx.modelId;
}
function hwKeyFor(hw) {
  if (hw === RUBIN) return "rubin";
  /* b9 M4 (memo §2.5/§3.2): a custom-fleet leg's effective row resolves EVERY by-key
     registry (roofline, operating points, tuples, rentBasis, PRICE_EVIDENCE) through
     its calibration DONOR — the performance identity is the donor's, disclosed on the
     leg. Own-field check, never prototype. */
  if (hw && Object.prototype.hasOwnProperty.call(hw, "__cfLeg")) return hw.__cfLeg.donorKey;
  const key = HW_ORDER.find(k => HW[k] === hw);
  if (!key) throw new Error("hardware row is not registered on the v2.2 roofline path");
  return key;
}
/* R2 (im4-r2-shipment-plan §1.2; memo §0-bis): the live render path consumes the
   capacity solver's declared-operating-point width — the loaded-bytes policy reaches
   ONLY the width solve (throughput terms stay on the performance tuple sW; the
   calibration-invariant twins pin the firewall). Regime composition:
   - DECLARED-b cells (balanced/fast): width = the solver's capacity-min width whose
     bFeas satisfies the declared batch (declaredOperatingPointWidth); b = bDeclared
     exactly (uncapped by construction).
   - RULE cells (batch = "min(mult×balanced, b_feas)"): the registry cell IS an
     adaptive rule, so its only hard base is balanced.b — satisfiability is tested
     against that base, and the leg renders at the WIDEST legal width (the
     throughput-tier reading; preserves the DeepSeek H800 observed 144-wide batch
     replay byte-for-byte) with b = min(mult×balanced, bFeas) per the registry rule.
   - A leg whose declared operating point is NOT satisfiable in-domain under the
     policy renders as a typed infeasible-under-policy state — NO numbers (the
     two-boolean contract; a capacity floor alone never renders).
   - No-domain rows (rubin) keep the registry shape-only path.
   renderOpts.loadedWeightBytesPerParam is the LABELED three-point sensitivity
   channel (§0-ter) — never encoded, never persisted, never a default. */
function rooflinePoint(hw, s, activeOverride, supplied, renderOpts) {
  const R = rooflineCore(), ctx = scenarioContext(s, supplied), hwKey = hwKeyFor(hw);
  const arch = R.resolveArch(ctx.modelId, ctx.customDonor);
  const contextLimitSource = contextLimitSourceFor(ctx);
  const lengths = R.resolveTrafficLengths({ profileId: ctx.profileId ?? null, ioRatio: s.ioRatio });
  const contextWindow = R.contextWindowStatus(arch, lengths, contextLimitSource);
  const base = { R, ctx, hwKey, arch };
  /* b9 M4 (memo §2.9): a custom leg's user-declared HBM capacity rides renderOpts.cfLeg into
     the solver AND every renderPoint below — the solve identity and the render must carry the
     SAME override (the core's trusted-solve check enforces it).
     T5 rec 4: the channel now carries BYTES, the registry's own normative unit, so there is no
     conversion here at all. The retired `hbmGB` scalar was multiplied by 1e9 at this line while
     the registry stored observed framebuffer bytes — which is why retyping a donor's displayed
     "144 GB" bought 144e9 B against a normative 154,618,822,656 B (93.13%). The ×1e9 now lives
     once, in custom-fleets.js's legacy fold, where it can only ever apply to a pre-T5 value. */
  const hbmOv = renderOpts && renderOpts.cfLeg && renderOpts.cfLeg.hbmBytes != null
    ? renderOpts.cfLeg.hbmBytes : undefined;
  // Context validity is upstream of capacity and performance. Returning before the
  // solver prevents an impossible request from carrying a contradictory capacity
  // receipt or from being mislabeled as a topology failure.
  if (contextWindow.state === "exceeded-registered-limit") {
    return { ...base, solved: null, widthRendered: null, point: R.renderPoint({
      arch, activeB: activeOverride ?? s.active, totalB: s.total, hwKey,
      regime: s.interact, precision: s.precision, stackMult: s.stackMult,
      profileId: ctx.profileId ?? null, ioRatio: s.ioRatio, contextLimitSource,
      hbmBytesOverride: hbmOv,
    }) };
  }
  const EDP = ED_CAPACITY.OPERATING_POINTS; // resolved once at module parse (see ED_CAPACITY above)
  const policyOverride = renderOpts && renderOpts.loadedWeightBytesPerParam != null
    ? renderOpts.loadedWeightBytesPerParam : undefined;
  const reg = EDP[hwKey];
  const cell = reg ? reg[s.interact] : undefined;
  const ruleCell = !!(cell && cell.rule);
  const solved = solveCapacityWidth(hwKey, s, ruleCell
    ? { ctx, loadedWeightBytesPerParam: policyOverride, bDeclared: reg.balanced.b,
        hbmBytesOverride: hbmOv,
        capacityTargetObjective: "batch-rule base fit",
        capacityTargetBatchSource: "OPERATING_POINTS." + hwKey +
          ".balanced (base batch used to select the batch-rule capacity width)" }
    : { ctx, loadedWeightBytesPerParam: policyOverride, hbmBytesOverride: hbmOv });
  if (!solved) { // no-domain row (rubin): registry shape-only path, unchanged
    /* A REGIME THE ROW DECLARES NO CELL FOR IS A TYPED NO-RENDER STATE HERE, NOT AN EXCEPTION
       (bq-2196, 2026-09-10). `resolveOperatingPoint` hard-errors on an absent regime and that is
       correct for every row with a domain: memo §4/§6 makes absence a defect precisely so nobody
       silently substitutes a neighbouring cell. But RUBIN is a projection row that declares ONLY
       `balanced` — OPERATING_POINTS.rubin's own basis field says "RUBIN has no batch/fast regimes
       — fields absent by design" — so on this path the hard error fires on the data being exactly
       what it is documented to be, and it fired on 132 of the 288 model × perspective preset pairs.
       The cost was not theoretical: renderGenChart() builds its columns inside a .map(), so the
       throw escaped mid-build and the cost-per-generation chart rendered as NOTHING — no SVG, no
       table — on every one of those pairs, with the previous scenario's operating-point note left
       standing above the hole. Nobody had checked #chart-gen; bq-2196 recorded the DOM as complete
       on the strength of the hero, cost, feasibility and leg rows.
       So the asking side gets the branch the memo's rule always implied: no declared cell on a
       no-domain row means NO NUMBERS, stated as a typed state with its reason, exactly like the
       infeasible and context-window states beside it. The hard error is untouched everywhere it
       belongs — a row WITH a domain that is missing a regime still throws, which is the case memo
       §4/§6 was written for. */
    if (!cell) {
      const reason = "operating point absent by design: OPERATING_POINTS." + hwKey + " declares no '"
        + String(s.interact) + "' regime (memo §4/§6 — this is a projection row with no serving "
        + "anchor, not a missing figure), so no throughput and no cost are computed for it";
      const op = { infeasible: true, b: null, bDeclared: null, bFeas: null, capped: false,
        regime: s.interact, hwKey, opBasis: "regime-absent-by-design", opCitation: null,
        declaredOpBasis: null, declaredOpCitation: null, reason };
      return { ...base, solved: null, widthRendered: null, point: {
        infeasible: true, opBasis: "regime-absent-by-design", opCitation: null,
        reason, op, lengths } };
    }
    return { ...base, solved: null, widthRendered: null, point: R.renderPoint({
      arch, activeB: activeOverride ?? s.active, totalB: s.total, hwKey,
      regime: s.interact, precision: s.precision, stackMult: s.stackMult,
      profileId: ctx.profileId ?? null, ioRatio: s.ioRatio, contextLimitSource,
      hbmBytesOverride: hbmOv,
    }) };
  }
  if (!solved.renderableUnderPolicy) {
    const widest = solved.perWidth.length ? solved.perWidth[solved.perWidth.length - 1] : null;
    const bDecl = solved.receipt.capacityTargetBatch;
    // Honest null: no legal width holds the weights at all (or no declared operating
    // point exists to cap from) — a typed infeasible state, NO numbers.
    if (solved.capacityMinimumUnderUniformPolicy == null || bDecl == null || !widest || widest.bFeas < 1) {
      return { ...base, solved, widthRendered: null, point: {
        infeasible: true, opBasis: "infeasible-under-policy", opCitation: null,
        op: { infeasible: true, b: null, bDeclared: bDecl,
          bFeas: widest ? widest.bFeas : null, capped: false, opBasis: "infeasible-under-policy" },
        lengths: null,
      } };
    }
    // Capacity floor exists but the declared operating point does NOT fit in-domain:
    // the leg renders CAPPED at the widest legal width (the pre-R2 capped semantics,
    // disclosed on the tile and in the policy clause) — renderableUnderPolicy stays
    // FALSE, so gate-6 and central eligibility never see this leg as policy-clean
    // (NEW-P1: a capacity floor never masquerades as a policy-feasible hero leg).
    const cappedWidth = Math.max.apply(null, solved.receipt.legalShapeSet);
    return { ...base, solved, widthRendered: cappedWidth, point: R.renderPoint({
      arch, activeB: activeOverride ?? s.active, totalB: s.total, hwKey,
      regime: s.interact, precision: s.precision, stackMult: s.stackMult,
      profileId: ctx.profileId ?? null, ioRatio: s.ioRatio,
      declaredOperatingWidth: cappedWidth, capacitySolve: solved, contextLimitSource,
      hbmBytesOverride: hbmOv,
    }) };
  }
  const widthRendered = ruleCell
    ? Math.max.apply(null, solved.receipt.legalShapeSet)
    : solved.declaredOperatingPointWidth;
  return { ...base, solved, widthRendered, point: R.renderPoint({
    arch, activeB: activeOverride ?? s.active, totalB: s.total, hwKey,
    regime: s.interact, precision: s.precision, stackMult: s.stackMult,
    profileId: ctx.profileId ?? null, ioRatio: s.ioRatio,
    declaredOperatingWidth: widthRendered, capacitySolve: solved, contextLimitSource,
    hbmBytesOverride: hbmOv,
  }) };
}
/* ================= b9 M3 — energy/electricity dimension (memo research/b9-m3-energy-memo.md) =====
   The three procurement bases (plan D-3; display names verbatim from the owner-spec decision).
   Two typed concepts share the enum and must never conflate (memo §3.2):
   - ROW basis (engine-data rentBasis): the evidence class of a registered rent NUMBER —
     uniformly committed-planning-rent since the b9 M1 repair.
   - LENS basis (procurementBasis on PERSPECTIVES; for the generic §10-dive replay, the
     DIVE_PROCUREMENT_BASES side registry below — never inside the dive objects themselves,
     whose keys applyPresetSettings copies into scenario state): what the scenario is costing
     in. A declaration — user slider edits produce the existing modified-state disclosures and
     never silently re-derive the basis from a multiplier position. Displayed labels come from
     the LENS basis via displayedProcurementBasis (M3 gate P1): the row basis is the
     mixing-uniformity enforcement value, not the user-facing lens name. */
const PROCUREMENT_BASES = Object.freeze(["public-capacity-rent", "committed-planning-rent", "owned-strategic-tco"]);
const PROCUREMENT_BASIS_NAMES = Object.freeze({
  "public-capacity-rent": "public-capacity rent",
  "committed-planning-rent": "low/committed planning rent",
  "owned-strategic-tco": "owned/strategic TCO",
});
/* One shared data-module handle for the energy/basis surface (the formCorrectionDebt per-call
   pattern, hoisted; node's require cache makes repeated calls free). */
function engineData() {
  return (typeof module !== "undefined" && module.exports)
    ? require("./engine-data-v22.js")
    : { CALIBRATION, HW_ROOFLINE, OPERATING_POINTS, WEIGHT_PLACEMENT, PRECISION_TIER_MAP, resolveDecodePlacement };
}
/* ONE operating-power concept feeds both the energy surface and the owned-TCO power term
   (memo §7 decision 3): boardPowerW (measured operating watts, engine-data registry) when
   registered; the analyst TDP proxy otherwise. All registered boardPowerW are null as of M3,
   so this resolver returns hw.tdp verbatim and the cost path stays byte-identical (memo §1;
   suite T4/T7). The DC-shell term below deliberately stays on tdp: the shell is sized for
   PROVISIONED watts, not operating draw. */
function opPowerKw(hw, cfLeg) {
  /* b9 M4 precedence (memo §2.5): leg boardPowerW override > registry boardPowerW >
     analyst TDP proxy. The leg channel rides renderOpts.cfLeg (the
     loadedWeightBytesPerParam options-channel precedent), never the HW row object. */
  if (cfLeg && cfLeg.boardPowerW != null) return cfLeg.boardPowerW / 1000;
  const row = engineData().HW_ROOFLINE[hwKeyFor(hw)];
  return row && row.boardPowerW != null ? row.boardPowerW / 1000 : hw.tdp;
}
function sectionPoint(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    && typeof value.mid === "number" ? value.mid : value;
}
function sectionBasisMode(basis, s) {
  if (basis === "owned-strategic-tco") return "tco";
  if (basis === "public-capacity-rent" || basis === "committed-planning-rent") return "rent";
  return s.hwMode;
}
/* im-arc T2 fix-2 R1 (2026-08-23): one pure resolver owns the generic
   heterogeneous planning-rate vector and every reader dial layered on it.
   Hypothetical section donors call this same function; they may not recreate
   or partially copy the T1 precedence ladder. */
function registryPlanningRentHr(hw, s, cfLeg) {
  const legKey = hwKeyFor(hw);
  if (ED_FLEET.PRICE_EVIDENCE[legKey] === "unpriced") return NaN;
  const perLegAbs = (s.rentAbsLeg && s.rentAbsLeg[legKey] != null) ? s.rentAbsLeg[legKey] : null;
  if (perLegAbs != null) return perLegAbs;
  if (s.rentAbsAll != null) return s.rentAbsAll;
  const perLeg = (s.rentMultLeg && s.rentMultLeg[legKey] != null) ? s.rentMultLeg[legKey] : null;
  const perFam = (s.rentMultFam && s.rentMultFam[familyOf(hw, cfLeg)] != null)
    ? s.rentMultFam[familyOf(hw, cfLeg)] : null;
  const legMult = perLeg != null ? perLeg : (perFam != null ? perFam : 1);
  /* im-arc T4 fold (2026-08-24), memo §6 [F10]: a historical state may pin the REGISTERED rate
     this row carried before the fold. It is applied here — below every reader control, above the
     registry — so the multiplier ladder a route declares still applies to it. */
  const pinned = (s.rentRegistryPin && s.rentRegistryPin[legKey] != null) ? s.rentRegistryPin[legKey] : null;
  if (pinned != null) return pinned * s.rentMult * legMult;
  /* im-arc T4 fold (2026-08-24), memo §4: a null registered rent means NO admissible public
     planning quote exists for this row. It resolves as unavailable — NaN, which the section
     and leg machinery already renders as a dropped leg with a stated reason (T2 fix-2) — and
     it never falls back to the retired point. The reader-stated ladder ABOVE this line is
     deliberately unaffected: a DECLARED provisional replay still prices the leg, which is the
     only way the retired $4.50 / $6.00 / $2.20 can reach an arithmetic surface. */
  if (hw.rent == null) return NaN;
  return hw.rent * s.rentMult * legMult;
}
function registryPlanningRentReceipt(hwKey, s) {
  const hw = HW[hwKey], row = engineData().HW_ROOFLINE[hwKey];
  if (!hw || !row || !row.prov || typeof row.prov.rentBasis !== "string")
    throw new TypeError("registered rent provenance is unavailable for donor " + hwKey);
  /* im-arc T4 fold (2026-08-24), memo §4: the receipt now carries the SELECTED QUOTE — its id,
     its actual deal class, its full triple and its date — so a reader or a caller can see which
     observation the planning number is, and an unavailable row says so in words instead of
     returning a bare NaN with no explanation. */
  const quoteId = ED_DC_RENT_POLICY.defaultRateId[hwKey] ?? null;
  const quote = quoteId ? ED_DC_RENT_QUOTES[quoteId] : null;
  if (!quote) return { donorKey: hwKey, value: null, quoteId: null, rateClass: null,
    usdPerHr: null, asOf: null, unavailable: true,
    reason: ED_DC_RENT_POLICY.unavailableReason[hwKey]
      || ("No admissible public planning quote is registered for donor " + hwKey + "."),
    replay: ED_DC_RENT_POLICY.provisionalReplays[hwKey]
      ? structuredClone(ED_DC_RENT_POLICY.provisionalReplays[hwKey]) : null,
    basis: row.rentBasis, source: row.prov.rentBasis, planningPolicy: ED_DC_RENT_POLICY.planningPolicy };
  return { donorKey: hwKey, value: registryPlanningRentHr(hw, s, null),
    quoteId, rateClass: quote.rateClass, usdPerHr: structuredClone(quote.usdPerHr),
    term: quote.term, region: quote.region, configuration: quote.configuration,
    bundleScope: quote.bundleScope, asOf: quote.asOf, unavailable: false, reason: null,
    /* `source` stays the VERBATIM registry provenance every existing consumer binds to; the dated
       observation the quote itself carries rides beside it as `quoteSource`, so the fold ADDS
       provenance rather than replacing a string other surfaces already pin. */
    basis: row.rentBasis, source: row.prov.rentBasis, quoteSource: quote.source,
    planningPolicy: ED_DC_RENT_POLICY.planningPolicy };
}
function hwHourCost(hw, s, cfLeg) {
  if (ED_FLEET.PRICE_EVIDENCE[hwKeyFor(hw)] === "unpriced") return NaN;
  const mode = sectionBasisMode(cfLeg && cfLeg.basis, s);
  if (mode === "rent") {
    /* im-arc T2 (memo research/im-arc-t2-sections-memo.md §1.2): an explicit
       section rent is the most specific statement and therefore precedes T1's
       global absolute controls. null means this section deliberately inherits. */
    if (cfLeg && Object.prototype.hasOwnProperty.call(cfLeg, "rentHr") && cfLeg.rentHr !== null)
      return cfLeg.rentHr;
    /* row 499: the per-leg posture rides the SAME rent branch as the global multiplier — owned-TCO
       is untouched (its per-leg channel is `cfLeg.kwhPerKwh`, below). Absent map or absent key = 1,
       so the arithmetic is bit-identical wherever no per-leg posture is declared. */
    /* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): absolute
       reader-stated prices replace the registered/custom row BEFORE the multiplier ladder;
       per-leg specificity precedes the family fallback inside the shared resolver. */
    return registryPlanningRentHr(hw, s, cfLeg);
  }
  const capexUsd = cfLeg && cfLeg.capexUsd != null ? cfLeg.capexUsd : registeredCapexFor(hw, s);
  /* im-arc T4 fold (2026-08-24), memo §2 [F5]: the overhead follows the capex SCOPE — the row's
     registered scope, or the reader's own when the reader stated the capex (round 4). */
  const clusterOh = clusterOverheadForLeg(hw, s, cfLeg);
  const lifeYears = cfLeg && cfLeg.lifeYears != null ? cfLeg.lifeYears : s.lifeYears;
  const dcPerW = cfLeg && cfLeg.dcPerW != null ? cfLeg.dcPerW : s.dcPerW;
  const dcLifeYears = s.dcLifeYears != null ? s.dcLifeYears : DEFAULTS.dcLifeYears;
  const pue = cfLeg && cfLeg.pue != null ? cfLeg.pue : s.pue;
  const opexPct = cfLeg && cfLeg.opexPct != null ? cfLeg.opexPct : s.opexPct;
  const capex = capexUsd * clusterOh;
  const capexHr = capex / (lifeYears * 8760);
  const facilityCapital = dcPerW * hw.tdp * 1000;
  /* im-arc T4 fold (2026-08-24), memo §2: the facility life that was the LITERAL 12 here is now
     the named default `dcLifeYears`. Provisioned watts, never operating draw. */
  const dcHr = facilityCapital / (dcLifeYears * 8760);
  /* im-arc T4 fold (2026-08-24), memo §2.1 [F6]: two capital-recovery increments, each its own
     disclosed line, each against ITS OWN life. Off (the canonical default) makes the rate zero
     and both increments exactly zero. */
  const recoveryRate = capitalRecoveryRate(s);
  const capitalRecoveryAccelerator = capitalRecoveryIncrementHr(recoveryRate, lifeYears, capex);
  const capitalRecoveryFacility = capitalRecoveryIncrementHr(recoveryRate, dcLifeYears, facilityCapital);
  /* b9 M4 (memo §2.8): the per-leg $/kWh override is LIVE only here — the owned-TCO
     power term. Under rent bases this function returns above and the override prices
     nothing (inert-and-explained in the UI, D-2 verbatim). */
  const kwh = cfLeg && cfLeg.kwhPerKwh != null ? cfLeg.kwhPerKwh : s.kwh;
  const powerHr = opPowerKw(hw, cfLeg) * pue * kwh;
  const opexHr = capexHr * (opexPct / 100);
  return capexHr + dcHr + powerHr + opexHr + capitalRecoveryAccelerator + capitalRecoveryFacility;
}
function hwHourParts(hw, s, cfLeg) { // for the stack chart (TCO mode)
  if (ED_FLEET.PRICE_EVIDENCE[hwKeyFor(hw)] === "unpriced")
    return { capex: NaN, power: NaN, dc: NaN, opex: NaN };
  const capexUsd = cfLeg && cfLeg.capexUsd != null ? cfLeg.capexUsd : registeredCapexFor(hw, s);
  const clusterOh = clusterOverheadForLeg(hw, s, cfLeg);
  const lifeYears = cfLeg && cfLeg.lifeYears != null ? cfLeg.lifeYears : s.lifeYears;
  const dcPerW = cfLeg && cfLeg.dcPerW != null ? cfLeg.dcPerW : s.dcPerW;
  const dcLifeYears = s.dcLifeYears != null ? s.dcLifeYears : DEFAULTS.dcLifeYears;
  const pue = cfLeg && cfLeg.pue != null ? cfLeg.pue : s.pue;
  const opexPct = cfLeg && cfLeg.opexPct != null ? cfLeg.opexPct : s.opexPct;
  const capex = capexUsd * clusterOh;
  const facilityCapital = dcPerW * hw.tdp * 1000;
  const kwh = cfLeg && cfLeg.kwhPerKwh != null ? cfLeg.kwhPerKwh : s.kwh; // b9 M4: same override as hwHourCost — the chart may never disagree with the mix
  const recoveryRate = capitalRecoveryRate(s);
  /* im-arc T4 fold (2026-08-24): the two capital-recovery increments are DISCLOSED LINES beside
     the straight-line depreciation, never folded into it — the reader can always see the
     legacy view and the economic view side by side. */
  return {
    capex: capex / (lifeYears * 8760),
    power: opPowerKw(hw, cfLeg) * pue * kwh,
    dc: facilityCapital / (dcLifeYears * 8760),
    opex: (capex / (lifeYears * 8760)) * (opexPct / 100),
    capitalRecoveryAccelerator: capitalRecoveryIncrementHr(recoveryRate, lifeYears, capex),
    capitalRecoveryFacility: capitalRecoveryIncrementHr(recoveryRate, dcLifeYears, facilityCapital),
  };
}
/* What the ADVANCED tier exposes without activating: the named basis, whether it is active,
   and the delta it WOULD make against the legacy straight-line view at the current state. */
function capitalRecoveryDisclosure(s, hwKey) {
  const state = s || DEFAULTS;
  const key = hwKey || (Object.entries(blendWeights(state))
    .sort((left, right) => right[1] - left[1])[0] || ["h100"])[0];
  const hw = hardwareRow(key);
  if (!hw) return null;
  const off = Object.assign(structuredClone(state), { capitalRecovery: "off" });
  const on = Object.assign(structuredClone(state), { capitalRecovery: "on" });
  const parts = hwHourParts(hw, on, null);
  return {
    label: "economic capital recovery (CRF)",
    basis: "analyst-set cost of capital, applied as a disclosed increment over straight-line depreciation",
    against: "the legacy straight-line depreciation view",
    active: state.capitalRecovery === "on",
    costOfCapitalPct: on.costOfCapitalPct,
    donorKey: key,
    deltaUsdPerHrIfOn: hwHourCost(hw, on, null) - hwHourCost(hw, off, null),
    lines: { accelerator: parts.capitalRecoveryAccelerator, facility: parts.capitalRecoveryFacility },
    formula: "increment = [CRF(r, L) - 1/L] x financed capital / 8760, CRF(r, L) = r(1+r)^L / ((1+r)^L - 1)",
    note: "Opening the advanced tier does not activate this basis. An `on` state is explicit in the scenario, in the share link and in the MCP argument, so the same state reproduces whatever tier renders it.",
  };
}
/* ---------- b9 M5: the two broad-unspecified levers (memo §8.2/§9.3, decision D-13) ----------
   BOTH compose as ONE multiplier on the roofline's RETURNED effective throughput — never inside
   η. Rationale (design gate round 1, P1-1): `stackMult` enters η BEFORE decode's unscaled
   collective term (tIter = tRoof + tCc), so an η-site factor is not an exact final-throughput
   multiplier under dense-TP, and η_eff > 1 hard-errors (TPU η=0.55 already fails at the allowed
   trend +12, E=3). Post-roofline multiplication is EXACT for the ratified cost-out ÷ E by
   construction (costPerMtok ∝ 1/tokPerS), never violates the η ≤ 1 guard, and leaves
   capacity/batch feasibility untouched (neither consumes tokPerS). It also moves Wh/Mtok
   coherently — a software-efficiency gain IS more tokens per joule — so the M3 $↔Wh identity
   stays green by construction rather than needing an energy carve-out. */
function trendFactor(s, ctx) {
  /* Replay lock-at-0 (D-5 verbatim): a dive/SLO/disclosure replay is an atomic PUBLISHED
     operating point — the lab's actual efficiency is already inside it, so months on top would
     double-count. Enforced in THREE places that must agree: applyPresetSettings seeds 0 here,
     the codec rejects replay tokens declaring trend ≠ 0, and the engine forces E = 1 whenever
     the resolved context names a replay. */
  if (ctx && ctx.perspKind === "replay") return 1;
  const months = Number(s && s.trendMonths);
  if (!isFinite(months) || months === 0) return 1;
  const rate = Number(s && s.trendRate);
  return Math.pow(isFinite(rate) && rate > 0 ? rate : DEFAULTS.trendRate, months / 12);
}
/* The family a row rides. A custom-fleet leg carries its own tag (donor's family, or
   "unclassified" on a renamed leg); a registry row reads HW_ROOFLINE. */
function familyOf(hw, cfLeg) {
  if (cfLeg && typeof cfLeg.family === "string" && cfLeg.family) return cfLeg.family;
  const row = engineData().HW_ROOFLINE[hwKeyFor(hw)];
  return (row && typeof row.family === "string") ? row.family : "unclassified";
}
function familyFactor(hw, s, cfLeg) {
  const key = FAMILY_STATE_KEY[familyOf(hw, cfLeg)];
  if (!key) return 1; // unclassified (or any unmapped family) is EXEMPT — disclosed on the leg
  const v = Number(s && s[key]);
  return isFinite(v) && v > 0 ? v : 1;
}
/* The ONE shared lever multiplier consumed at the tokPerS chokepoint. */
/* ================= b9 spec-decode LEVER — the mutual-exclusion gate (D-SD-7) =================
   Court: Polaris gen-24 esc-20260731T191830Z-e5b800eb. The lever may leave 1.00 ONLY when
   stackMult sits at the declared MTP-free tick. Design memo: research/b9-spec-decode-lever-memo.md
   (frozen v16); the NORMATIVE KERNEL there governs this code. */
const SPECDEC_GATE_TICK = 0.7;              // the declared MTP-free tick
const SPECDEC_BOUNDS = Object.freeze([1.00, 1.60]);

/* THE ONE PREDICATE. Epsilon, never a literal comparison: app.js snaps every slider write with
   Math.round(v/step)*step, which yields 0.7000000000000001 — so `=== 0.7` is FALSE on every drag
   path while the readout still shows "0.70". No coercion: "0.7", [0.7] and a boxed Number must
   NOT open the gate. THE BAN (memo §6.1): `=== 0.7` may appear nowhere but this declaration. */
function stackAtMtpFreeTick(v) {
  return typeof v === "number" && Number.isFinite(v)
      && Math.abs(v - SPECDEC_GATE_TICK) < 1e-9;
}
function specDecGateAllows(s) { return stackAtMtpFreeTick(s && s.stackMult); }

/* THE ONE SHARED CODEC RULE for this lever, run by the ENCODER and the DECODER against the same
   RESOLVED state (base + diff), never against the diff alone — a diff carries only what differs, so
   a token can raise `specDec` while inheriting a `stackMult` that shuts the gate.

   Both directions matter and the encoder sharing this is the M4 P0-1 lesson: an encoder that can
   mint a token its own decoder rejects produces links that copy successfully and then silently fail
   to restore. A token that trips this is rejected WHOLE — never clamped into a plausible-looking
   one, because a clamped token would publish a state its author never chose.

   `Number(v) === 1.0` is NOT the banned float comparison. THE BAN is about `stackMult`, whose
   drag-reachable value at the tick is 0.7000000000000001 and therefore never the literal. This
   lever's domain is [1.00, 1.60] step 0.01, and Math.round(v/0.01)*0.01 yields exactly 1 for every
   input that renders "1.00" — executed over the whole 61-point grid. `stackMult` is still compared
   ONLY through stackAtMtpFreeTick, here and everywhere. */
function specDecTokenConsistent(resolved, p) {
  const v = resolved && resolved.specDec;
  if (v === undefined || v === null) return true;            // absent means the default, which is 1.00
  if (typeof v !== "number" || !Number.isFinite(v)) return false;
  if (p && p.kind === "replay") return v === 1.0;            // D-SD-5: inert on a published operating point
  if (v > 1) return specDecGateAllows(resolved);             // D-SD-7: the mutual-exclusion gate
  return true;
}

/* The gate's reader-facing copy — SPECDEC_WHY_LINE, SPECDEC_RESET_LINE, SPECDEC_REPLAY_WHY_LINE —
   and the three canonical claim constants they compose from are declared ABOVE, next to TIPS,
   because TIPS.specDec composes from the same constants and a `const` cannot be read before its
   own declaration is evaluated. One copy region, one declaration each. */

/* The row's typed baseline status. `unknown` FAILS CLOSED to exempt; an UNRECOGNISED status is a
   disagreement between the registry and this function, which is a hard error, not a fail-closed
   case (memo §8.4). The registry field lands with the calibration-row commit; until then only the
   gate-open + specDec > 1 path can reach this, which the default state never does. */
function specDecBaselineStatusFor(hwKey) {
  /* ED_FLEET is the house accessor for the calibration registry — a bare `CALIBRATION` is not in
     scope here under the CommonJS branch, and reading it directly made this function throw for
     EVERY row. Mirrors the pattern at the capacity-receipt site below. */
  const row = (ED_FLEET.CALIBRATION && ED_FLEET.CALIBRATION[hwKey]) || null;
  const st = row && row.specDecBaselineStatus;
  if (st === "included" || st === "excluded" || st === "unknown") return st;
  throw new TypeError("specDec: missing or invalid specDecBaselineStatus on calibration row " + hwKey);
}

/* ---- THE RESOLUTION LADDER (memo [N-DISPOSITION]) — ORDERED, TOTAL, ONE authority ----
   v12 of the memo expressed this as a SET of independently-matching rows, and three of them matched
   the same state at once: `anth20` is a shipped replay blended 100% to an `included` leg, and
   `xaicash` is a shipped replay with no blend (so the 7-leg default fleet, carrying `unknown` gb300
   and tpu7) at stackMult 1. A matrix of overlapping predicates is not a function, and the ambiguity
   silently overrode an adjudicated copy requirement: if `replay-locked` won on gb300, the Q-G
   ruling's required `unestablished` string was lost.

   First match wins. Every ordering decision has a reason:
     1-2. Basis status outranks everything — it is a property of the EVIDENCE, not of the caller's
          state, so a caller can never override it. This is what keeps Q-G enforced everywhere.
     3.   `specDec === 1.00` outranks both locks: with no credit requested there is no refusal to
          report, and "not applied — this is a published operating point" would answer a question
          the user did not ask. (Snap-safe: the 0.01 grid yields exactly 1 for every input that
          displays "1.00" — executed over the whole 61-point grid. `stackMult` is a DIFFERENT grid
          and is still compared ONLY through stackAtMtpFreeTick.)
     4.   `replay-locked` outranks `gate-closed`: both can hold at once, and moving stackMult to the
          tick would NOT enable credit under a replay, so naming the stack setting would mislead. */
function specDecDisposition(status, perspKind, gateOpen, specDec) {
  if (status === "included")  return { reasonCode: "absorbed",              factorApplied: 1 };
  if (status === "unknown")   return { reasonCode: "unestablished",         factorApplied: 1 };
  /* The status set is CLOSED. Falling through to the `excluded` arm for an unrecognised value would
     let a garbage status be CREDITED. An unrecognised status means the registry and this function
     disagree about the type — a different thing from absent evidence, which is `unknown` and is
     already handled above — so it is a hard error, exactly as D-SD-3 requires at load. */
  if (status !== "excluded") throw new TypeError("specDec: unknown baseline status " + status);
  if (specDec === 1.00)       return { reasonCode: "eligible-not-selected", factorApplied: 1 };
  if (perspKind === "replay") return { reasonCode: "replay-locked",         factorApplied: 1 };
  if (!gateOpen)              return { reasonCode: "gate-closed",           factorApplied: 1 };
  return                             { reasonCode: "applied",   factorApplied: specDec };
}

/* Per-leg disclosure bytes. RATIFIED (Polaris esc-20260801T042349Z-20c444d8, manifest rows 9-14).
   ONE formatter owns these strings; MCP and the Worker return CODES, never prose — a machine caller
   must not receive human copy it might display untranslated. */
const SPECDEC_REASON_COPY = Object.freeze({
  absorbed: () => "· speculative-decode credit: not applied — this leg's deployed efficiency already absorbs speculation",
  unestablished: () => "· speculative-decode credit: not applied — this page cannot establish this leg's speculative status",
  "eligible-not-selected": () => "· speculative-decode credit: none selected",
  "replay-locked": () => "· speculative-decode credit: not applied — this is a published operating point and is replayed exactly as published, so any speculative-decoding effect it already carries is inside it",
  "gate-closed": () => "· speculative-decode credit: not applied — available only from the \"no MTP/disagg\" stack setting",
  applied: f => "· speculative-decode credit: applied ×" + f.toFixed(2) + " (decode only; your scenario, not this page's finding)",
});
/* Manifest row 15 — the state-level correction notice, RATIFIED. ONE engine-owned formatter, the
   same shape as SPECDEC_REASON_COPY above and for the same reason: one source of bytes for the
   page, MCP and the Worker. The manifest files this row under site/app.js because that is where it
   RENDERS; the bytes live here because that is where the suite can pin them.

   ONE STATE-LEVEL NOTICE, never one per leg: the force is a property of the state, and a per-leg
   echo would print N copies of a single event. `{from}` renders at two decimals, like `{factor}`. */
function specDecCorrectionNotice(from) {
  return "Your speculative-decode credit of ×" + Number(from).toFixed(2) + " was not applied — it is "
    + "available only from the \"no MTP/disagg\" stack setting, so it was reset to none.";
}
function specDecReasonText(reasonCode, factorApplied) {
  const f = SPECDEC_REASON_COPY[reasonCode];
  if (!f) throw new TypeError("specDec: no pinned copy for reasonCode " + reasonCode);
  return f(factorApplied);
}

/* The typed per-leg result, attached to the ONE canonical object and propagated unchanged. */
function specDecLegDisclosure(hw, s, ctx, cfLeg) {
  const status = specDecBaselineStatusFor(hwKeyFor(hw));
  const raw = s && s.specDec;
  const req = (typeof raw === "number" && Number.isFinite(raw)) ? raw : 1;
  const d = specDecDisposition(status, ctx && ctx.perspKind, specDecGateAllows(s), req);
  return { status, factorApplied: d.factorApplied, reasonCode: d.reasonCode };
}

/* THE ENGINE BACKSTOP — the enforcement that makes the invariant TOTAL. Every caller with no DOM
   (MCP run_scenario, the Worker's bundled engine, a restored im_presets_v1 row, any direct
   workload() call) passes through here, so the UI cannot be the only place the axes are exclusive.
   It resolves through the SAME ladder the disclosure uses — one authority, so the number applied and
   the reason shown can never disagree. */
function specDecFactor(hw, s, ctx, cfLeg) {
  const v = s && s.specDec;
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 1) return 1;   // default path: no credit
  /* hwKeyFor is the HOUSE accessor and the only correct one: it maps RUBIN and resolves a
     custom-fleet leg through its calibration DONOR, so a custom leg is typed by the row whose
     performance identity it borrows. An earlier draft of this function read `hw.key`, which does
     not exist on HW rows — hwKey came back undefined, a `!hwKey` guard returned 1, and the lever
     was SILENTLY INERT while every existing test still passed, because the suite only exercises
     the default path where the factor is 1 anyway. */
  return specDecDisposition(specDecBaselineStatusFor(hwKeyFor(hw)),
    ctx && ctx.perspKind, specDecGateAllows(s), v).factorApplied;
}

/* D-SD-2 / D-P24-1 (Polaris gen-24 esc-20260731T191847Z-87e9ba42): the spec-decode credit applies
   to DECODE ONLY. Prefill consumes the prompt in one compute-bound pass with nothing to speculate
   on, so crediting it would be a modelling error. Family and trend still apply to both phases. */
/* ================= d-im-h800 — the FIT-TRANSFER ASSUMPTION (owner note aca09d, 2026-08-18) =================
   THE H800/H100 DIFFERENTIAL AS A NAMED, ADJUSTABLE ASSUMPTION. Grounded (primary sources, captured
   2026-08-18): the H800 SXM differs from the H100 SXM in NVLink (400 vs 900 GB/s aggregate bidirectional)
   and FP64 (1 vs 34 TF) — nothing else that reaches an LLM-serving number. What this engine already does:
   HW_ROOFLINE carries both fabrics and the roofline consumes them (decode t_N, prefill t_fabric); at every
   shipped MoE-EP operating point t_H binds and the fabric term is slack under the frozen max() form, so
   the two rows render identical throughput — and h100/h200 wear the η FITTED on the capped part. The
   H800 is the measurement; the rows that BORROW its efficiency are the ones the assumption is about.

   THE RULE (Pro review 2026-08-18, folded — the unconditional multiplier was rejected as double
   counting): the control is the assumed MINIMUM ratio r of a borrowing row's throughput over the SAME
   row's CAPPED COUNTERFACTUAL — its own compute/HBM constants and operating point, with the anchor's
   registered 400 GB/s fabric — evaluated per phase through the same frozen form:
       T_final = max(T_raw, r × T_capped-counterfactual)   ⇒   factor = max(1, r ÷ (T_raw ÷ T_cf)).
   Where the roofline already renders the uncapped part faster (T_raw/T_cf > 1 — the fabric term binds,
   e.g. dense-TP prefill at 2.25×), that advantage counts toward r and the control adds nothing until r
   exceeds it (`already-modeled`); where the two tie (fabric slack at both 400 and 900 — every shipped
   MoE-EP point), the factor is r itself (`floor-applied`). At r = 1.00 the factor is exactly 1 on every
   path. The counterfactual is the frozen form re-evaluated with the fabric swapped: t_N' = t_N ×
   (fabric_row ÷ fabric_anchor); t_iter' = max(t_C, t_H, t_N')/η_eff + t_cc; prefill t' =
   max(t_compute, t_fabric')/η_pre,eff — every term the roofline's own return value, no new literal.
   Applied as ONE post-roofline factor at the shared chokepoint (family/trend precedent, memo D-13:
   exact for cost ∝ 1/tokPerS, never inside η, capacity untouched). */
const NVLINKCAP_BOUNDS = Object.freeze([1.00, 1.25]);
const NVLINKCAP_SLOPE_STEP = 0.05;   // the readout's neutral SLOPE unit (per +0.05 on the control) — no setting is privileged
const NVLINKCAP_ANCHOR_KEY = "h800"; // the capped anchor whose registered fabric defines the counterfactual
const NVLINKCAP_ELIGIBLE = Object.freeze(["uncapped-borrows-capped-fit", "uncapped-family-borrows-capped-fit"]);
/* The row's typed lineage. UNRECOGNISED = the registry and this function disagree about the type — a
   hard error, exactly like an invalid specDecBaselineStatus (D-SD-3 at load). */
function nvlinkCapLineageFor(hwKey) {
  const row = (ED_FLEET.CALIBRATION && ED_FLEET.CALIBRATION[hwKey]) || null;
  const v = row && row.nvlinkCapLineage;
  const set = ED_FLEET.NVLINK_CAP_LINEAGES;
  if (Array.isArray(set) && set.includes(v)) return v;
  throw new TypeError("nvlinkCapMinRatio: missing or invalid nvlinkCapLineage on calibration row " + hwKey);
}
/* The MATCHED CAPPED COUNTERFACTUAL for one leg and phase, from the roofline's own returned terms.
   Returns { raw, capped, rooflineRatio = raw/capped (≥ 1) } or null when the leg does not render.
   `rp` is the leg's rooflinePoint; `pre` the prefillRoofline result at the same operating point. */
function nvlinkCapCounterfactual(hwKey, s, rp, pre, kind) {
  const HWR = engineData().HW_ROOFLINE;
  const rowFabric = HWR[hwKey] && HWR[hwKey].fabric, anchorFabric = HWR[NVLINKCAP_ANCHOR_KEY] && HWR[NVLINKCAP_ANCHOR_KEY].fabric;
  if (!(rowFabric > 0) || !(anchorFabric > 0)) return null;
  const scale = rowFabric / anchorFabric;                          // ≥ 1 for an uncapped row (900/400)
  if (kind === "out") {
    const d = rp && rp.point && !rp.point.infeasible ? rp.point.decode : null;
    if (!d || !(rp.point.op && rp.point.op.b > 0)) return null;
    const tIterCf = Math.max(d.tC, d.tH, d.tN * scale) / d.etaEff + d.tCc;
    const capped = rp.point.op.b / tIterCf;
    return { raw: d.tokPerS, capped, rooflineRatio: d.tokPerS / capped, scale };
  }
  if (!pre || !(pre.tokPerS > 0)) return null;
  const R = rooflineCore();
  const flops = R.resolvePrecisionTuple(hwKey, s.precision).flops;
  const tCompute = pre.phiPreDev / flops, tFabric = pre.fabricBytesPerPosDev / rowFabric;
  const capped = 1 / (Math.max(tCompute, tFabric * scale) / pre.etaPreEff);
  return { raw: pre.tokPerS, capped, rooflineRatio: pre.tokPerS / capped, scale };
}
/* THE RESOLUTION LADDER — ordered, total, one authority. Lineage outranks the caller's value: a
   property of the EVIDENCE, never overridable by state. `cf` is the phase's counterfactual (or null). */
function nvlinkCapPhaseDisposition(lineage, r, cf) {
  if (lineage === "capped-anchor")  return { reasonCode: "capped-anchor",  factorApplied: 1, rooflineRatio: 1 };
  if (lineage === "not-applicable") return { reasonCode: "not-applicable", factorApplied: 1, rooflineRatio: null };
  if (!NVLINKCAP_ELIGIBLE.includes(lineage)) throw new TypeError("nvlinkCapMinRatio: unknown lineage " + lineage);
  const rr = cf && Number.isFinite(cf.rooflineRatio) && cf.rooflineRatio > 0 ? cf.rooflineRatio : 1;
  if (!(typeof r === "number" && Number.isFinite(r)) || r === 1.00) return { reasonCode: "eligible-neutral", factorApplied: 1, rooflineRatio: rr };
  const f = Math.max(1, r / rr);
  return f > 1 ? { reasonCode: "floor-applied", factorApplied: f, rooflineRatio: rr }
               : { reasonCode: "already-modeled", factorApplied: 1, rooflineRatio: rr };
}
/* Overall leg code from the two phase codes: floor-applied if either phase applies; already-modeled
   if r > 1 and neither does; else the shared code. */
function nvlinkCapLegCode(out, inn) {
  if (out.reasonCode === "floor-applied" || inn.reasonCode === "floor-applied") return "floor-applied";
  if (out.reasonCode === "already-modeled" || inn.reasonCode === "already-modeled") return "already-modeled";
  return out.reasonCode;
}
/* Per-leg disclosure bytes. ONE formatter owns them; MCP/Worker return CODES, never prose. */
const NVLINKCAP_REASON_COPY = Object.freeze({
  "capped-anchor": () => "· fit-transfer assumption: not applicable — this leg IS the export-capped anchor (measured on H800s); the assumption lives on the rows that borrow its efficiency",
  "not-applicable": () => "· fit-transfer assumption: not applicable — own anchor or a different fabric family",
  "eligible-neutral": () => "· fit-transfer assumption: neutral (1.00) — this leg wears the H800-fitted efficiency as-is; the fit may include cap-related effects that cannot be separately identified (this page's default)",
  "floor-applied": (d) => "· fit-transfer assumption: applied — decode ×" + d.decode.factorApplied.toFixed(3) + ", prefill ×" + d.prefill.factorApplied.toFixed(3)
    + " (your assumed minimum ratio ×" + d.ratio.toFixed(2) + " over this leg's capped counterfactual; the roofline already gave " + d.decode.rooflineRatio.toFixed(3) + "× / " + d.prefill.rooflineRatio.toFixed(3) + "× — your scenario, not this page's finding)",
  "already-modeled": (d) => "· fit-transfer assumption: not applied — the roofline already renders this leg " + d.decode.rooflineRatio.toFixed(3) + "× (decode) / " + d.prefill.rooflineRatio.toFixed(3) + "× (prefill) its capped counterfactual, which meets your ×" + d.ratio.toFixed(2) + " minimum; nothing is counted twice",
});
function nvlinkCapReasonText(reasonCode, dto) {
  const f = NVLINKCAP_REASON_COPY[reasonCode];
  if (!f) throw new TypeError("nvlinkCapMinRatio: no pinned copy for reasonCode " + reasonCode);
  return f(dto);
}
/* The typed per-leg result, attached to the ONE canonical object and propagated unchanged. CODES and
   numbers only — {lineage, reasonCode, ratio, decode:{factorApplied, rooflineRatio}, prefill:{…}}. */
function nvlinkCapLegDisclosure(hw, s, ctx, cfLeg, rp) {
  const hwKey = hwKeyFor(hw);
  const lineage = nvlinkCapLineageFor(hwKey);
  const raw = s && s.nvlinkCapMinRatio;
  const r = (typeof raw === "number" && Number.isFinite(raw)) ? raw : 1;
  let cfOut = null, cfIn = null;
  if (NVLINKCAP_ELIGIBLE.includes(lineage) && r !== 1) {
    const point = rp || rooflinePoint(hw, s, undefined, ctx, cfLeg ? { cfLeg } : undefined);
    cfOut = nvlinkCapCounterfactual(hwKey, s, point, null, "out");
    const pre = nvlinkCapPrefill(hw, s, ctx, point, cfLeg);
    cfIn = nvlinkCapCounterfactual(hwKey, s, point, pre, "in");
  }
  const out = nvlinkCapPhaseDisposition(lineage, r, cfOut), inn = nvlinkCapPhaseDisposition(lineage, r, cfIn);
  return { lineage, reasonCode: nvlinkCapLegCode(out, inn), ratio: r,
           decode: { factorApplied: out.factorApplied, rooflineRatio: out.rooflineRatio },
           prefill: { factorApplied: inn.factorApplied, rooflineRatio: inn.rooflineRatio } };
}
/* The prefill result at the leg's rendered operating point — the same call tokPerS makes. */
function nvlinkCapPrefill(hw, s, ctx, rp, cfLeg) {
  if (!rp || !rp.point || rp.point.infeasible || !rp.point.lengths) return null;
  try {
    return rp.R.prefillRoofline({ arch: rp.arch, activeB: s.active, hwKey: rp.hwKey, precision: s.precision,
      stackMult: s.stackMult, LIn: rp.point.lengths.LIn, declaredOperatingWidth: rp.widthRendered ?? undefined });
  } catch (e) { return null; }
}
/* THE ENGINE BACKSTOP — every DOM-less caller passes through here; the same ladder the disclosure
   uses, so the number applied and the reason shown can never disagree. `rp`/`pre` are the leg's
   own roofline results handed down from tokPerS so nothing is re-solved. */
function nvlinkCapFactor(hw, s, ctx, cfLeg, kind, rp, pre) {
  const v = s && s.nvlinkCapMinRatio;
  if (typeof v !== "number" || !Number.isFinite(v) || v === 1) return 1;   // default path: bit-identical
  const lineage = nvlinkCapLineageFor(hwKeyFor(hw));
  if (!NVLINKCAP_ELIGIBLE.includes(lineage)) return nvlinkCapPhaseDisposition(lineage, v, null).factorApplied;
  const point = rp || rooflinePoint(hw, s, undefined, ctx, cfLeg ? { cfLeg } : undefined);
  const cf = nvlinkCapCounterfactual(hwKeyFor(hw), s, point, kind === "in" ? (pre || nvlinkCapPrefill(hw, s, ctx, point, cfLeg)) : null, kind);
  return nvlinkCapPhaseDisposition(lineage, v, cf).factorApplied;
}
function leverThroughputMult(hw, s, ctx, cfLeg, kind, rp, pre) {
  return familyFactor(hw, s, cfLeg) * trendFactor(s, ctx)
       * (kind === "out" ? specDecFactor(hw, s, ctx, cfLeg) : 1)
       * nvlinkCapFactor(hw, s, ctx, cfLeg, kind, rp, pre);   // d-im-h800: per phase, against the phase's own capped counterfactual
}
/* d-im-h800 — THE SENSITIVITY READOUT: COMPUTED, never authored. ONE engine computation feeds the
   control-side readout, the note under the hardware chart and the suite, so no surface can state an
   exposure the engine does not compute. For the three Hopper rows it reports, at the CURRENT operating
   point: the decode fabric term as a share of the binding term (t_N ÷ max(t_C,t_H)), which term binds,
   the prefill fabric-to-compute ratio and which binds; each borrowing row's ROOFLINE RATIO over its own
   capped counterfactual per phase (what the frozen form already renders — 1 where the fabric is slack at
   both 400 and 900); the engine's SERIAL-EXPOSURE COUNTERFACTUAL between h800 and h100 (h100/h800
   throughput ratio if the H800's calibrated iteration hid NONE of its fabric time and the H100 paid only
   its own: t_iter,800 ÷ (t_iter,800 − t_N,800 + t_N,100) — a bracket on the model's overlap formulation,
   NOT an empirical bound); and the blend and stand-alone margins at NEUTRAL (1.00) versus the CURRENT
   setting, plus a neutral SLOPE (per +NVLINKCAP_SLOPE_STEP on the control from the current setting) so
   the sensitivity is visible at the default without privileging any setting. Everything derives from
   rooflinePoint / prefillRoofline / workload with NO new numeric literal. */
function nvlinkCapReadout(s, supplied, renderOpts) {
  const ctx = scenarioContext(s, supplied);
  const R = rooflineCore();
  const HWR = engineData().HW_ROOFLINE;
  const rowsOut = {};
  for (const k of ["h800", "h100", "h200"]) {
    const lineage = nvlinkCapLineageFor(k);
    let rp = null;
    try { rp = rooflinePoint(HW[k], s, undefined, supplied, renderOpts); } catch (e) { rp = null; }
    if (!rp || !rp.point || rp.point.infeasible || !rp.point.decode) { rowsOut[k] = { hwKey: k, lineage, renderable: false }; continue; }
    const d = rp.point.decode;
    const tup = R.resolvePrecisionTuple(k, s.precision);
    const pre = nvlinkCapPrefill(HW[k], s, ctx, rp, null);
    const tCompute = pre ? pre.phiPreDev / tup.flops : null, tFabric = pre ? pre.fabricBytesPerPosDev / HWR[k].fabric : null;
    const eligible = NVLINKCAP_ELIGIBLE.includes(lineage);
    const cfOut = eligible ? nvlinkCapCounterfactual(k, s, rp, null, "out") : null;
    const cfIn = eligible && pre ? nvlinkCapCounterfactual(k, s, rp, pre, "in") : null;
    rowsOut[k] = { hwKey: k, lineage, renderable: true, mode: d.mode, b: rp.point.op.b, fabricBps: HWR[k].fabric,
      decode: { tC: d.tC, tH: d.tH, tN: d.tN, tIter: d.tIter, bindingTerm: d.bindingTerm,
                fabricShareOfBinding: d.tN / Math.max(d.tC, d.tH), tokPerS: d.tokPerS,
                rooflineRatioOverCapped: cfOut ? cfOut.rooflineRatio : null },
      prefill: pre ? { tCompute, tFabric, bindingTerm: pre.bindingTerm, fabricOverCompute: tFabric / tCompute, tokPerS: pre.tokPerS,
                       rooflineRatioOverCapped: cfIn ? cfIn.rooflineRatio : null } : null };
  }
  const a = rowsOut.h800, c = rowsOut.h100;
  const serialExposure = (a && a.renderable && c && c.renderable && a.decode.tIter > 0)
    ? a.decode.tIter / (a.decode.tIter - a.decode.tN + c.decode.tN) : null;
  const v = (typeof s.nvlinkCapMinRatio === "number" && Number.isFinite(s.nvlinkCapMinRatio)) ? s.nvlinkCapMinRatio : 1;
  const neutralState = Object.assign({}, s, { nvlinkCapMinRatio: 1.0 });
  const slopeTo = Math.min(NVLINKCAP_BOUNDS[1], Math.round((v + NVLINKCAP_SLOPE_STEP) * 100) / 100);
  const slopeState = Object.assign({}, s, { nvlinkCapMinRatio: slopeTo });
  const marginOrNull = w => (w && typeof w.margin === "number" && isFinite(w.margin)) ? w.margin : null;
  const alone = (k, st) => { try { return marginOrNull(workloadOnHw(HW[k], st, undefined, ctx, renderOpts)); } catch (e) { return null; } };
  const blendOf = st => { try { return marginOrNull(workload(st, undefined, ctx, renderOpts)); } catch (e) { return null; } };
  const w = blendWeights(s);
  const per = k => ({ neutral: alone(k, neutralState), current: alone(k, s), atSlope: alone(k, slopeState) });
  return {
    setting: v, neutral: 1.0, slopeStep: NVLINKCAP_SLOPE_STEP, slopeTo, bounds: NVLINKCAP_BOUNDS,
    rows: rowsOut,
    serialExposureCounterfactualH100OverH800: serialExposure,
    blend: { neutral: blendOf(neutralState), current: blendOf(s), atSlope: blendOf(slopeState),
             borrowingShare: (w.h100 || 0) + (w.h200 || 0) },
    alone: { h800: per("h800"), h100: per("h100"), h200: per("h200") },
    notAResult: "computed from the registered payload, fabrics, η and operating points; the serial-exposure figure brackets the model's overlap formulation, not an empirical bound",
  };
}
function tokPerS(hw, s, kind, activeOverride, supplied, renderOpts) {
  const rp = rooflinePoint(hw, s, activeOverride, supplied, renderOpts);
  if (rp.point.infeasible) return NaN;
  /* b9 M5: applied to the RETURNED throughput of BOTH phases (decode + prefill), after
     feasibility. `rp.point.tokPerS` itself stays the RAW calibrated value — the form-correction
     debt surface reads it directly and renders unscaled, labeled as the calibration diagnostic
     it is (memo §8.2). */
  if (kind === "out") {
    const mult = leverThroughputMult(hw, s, scenarioContext(s, supplied), renderOpts && renderOpts.cfLeg, kind, rp, null);
    return rp.point.tokPerS * mult;
  }
  const lengths = rp.point.lengths;
  const pre = rp.R.prefillRoofline({ arch: rp.arch, activeB: activeOverride ?? s.active,
    hwKey: rp.hwKey, precision: s.precision, stackMult: s.stackMult, LIn: lengths.LIn,
    declaredOperatingWidth: rp.widthRendered ?? undefined }); // uniform width across roles; published role widths are annotations, while role-split solving is deferred
  /* d-im-h800: the prefill result is handed to the lever chokepoint so the fit-transfer factor is
     evaluated against THIS phase's own capped counterfactual, never re-solved. */
  const mult = leverThroughputMult(hw, s, scenarioContext(s, supplied), renderOpts && renderOpts.cfLeg, kind, rp, pre);
  return pre.tokPerS * mult;
}
/* BASIS CORRECTION (vetting round 2026-09-19, Astra pack A P0-1). `tokPerS` returns what the
   roofline returns, and for dense-TP PREFILL that is the whole N-wide replica's token rate:
   prefillRoofline divides Φ_pre by the shard width to get the per-device work for ONE token,
   so its 1/t_tok is what all N accelerators produce together. decodeRoofline is NOT on that
   basis — its dense-TP branch shares Φ and the KV sequence across N and is explicitly "paired
   with b = B_rep/N (the per-chip output share)" — and MoE-EP prefill keeps Φ_pre whole, so it
   is per-accelerator already. Both consumers below divide ONE accelerator's hourly cost/power
   by this rate, so both need the per-accelerator basis, and dense-TP prefill was being charged
   one accelerator-hour for sixteen accelerators' output. The dimensional proof: custom/llama70
   on h100/bf16 at the solved width 16 returned 17,442 tok/s, which is 281.3% of one H100's peak
   BF16 FLOPs and precisely 17.581% (= η_pre_eff) of SIXTEEN H100s' combined peak; input cost
   read $0.0764/Mtok against a true $1.2231 and the margin 96.6473% against 73.0720%.
   The frozen Φ_pre_dev = Φ_pre/N branch (memo §1a) and its guard are UNTOUCHED, and
   `tokPerS` keeps returning the raw calibrated rate so the parallel-diff prefill identity
   still means what it says. No shipped model/perspective pair renders dense-TP (0 of 288
   enumerated), so no published §10 headline, provider replay or WIDE-hash state moves; the
   path this corrects is the custom-model dense-donor scenario. Guard:
   tests/dense-tp-prefill-basis.test.mjs. */
function pricedTokPerS(hw, s, kind, activeOverride, supplied, renderOpts) {
  /* Decode is already per-chip; only the prefill phase needs the basis correction, and it needs
     the prefill point's OWN nShard to do it. Reading the width off `rp.widthRendered` instead
     (the first cut of this fold) missed the projection rows: Rubin carries neither
     `widthRendered` nor a declared operating-point width, so it fell through uncorrected while
     its prefill result said nShard 8 — 17.737187873272283 Wh/Mtok of input energy where the
     per-accelerator figure is 141.89750298617827. Resolving the point once here, rather than
     calling `tokPerS` and then resolving it again, also puts the capacity solver back to the
     call count it had before this fold: a renderable leg costs one solve per evaluation, not
     two, and the seven-leg default is 21 rather than 28. */
  if (kind !== "in") return tokPerS(hw, s, kind, activeOverride, supplied, renderOpts);
  const rp = rooflinePoint(hw, s, activeOverride, supplied, renderOpts);
  if (rp.point.infeasible) return NaN;
  const lengths = rp.point.lengths;
  const pre = rp.R.prefillRoofline({ arch: rp.arch, activeB: activeOverride ?? s.active,
    hwKey: rp.hwKey, precision: s.precision, stackMult: s.stackMult, LIn: lengths.LIn,
    declaredOperatingWidth: rp.widthRendered ?? undefined });
  const mult = leverThroughputMult(hw, s, scenarioContext(s, supplied), renderOpts && renderOpts.cfLeg, kind, rp, pre);
  const raw = pre.tokPerS * mult;
  return pre.mode === "dense-tp" && Number.isFinite(pre.nShard) && pre.nShard > 0
    ? raw / pre.nShard
    : raw;
}
function costPerMtok(hw, s, kind, activeOverride, supplied, renderOpts) {
  const hr = hwHourCost(hw, s, renderOpts && renderOpts.cfLeg);
  return hr / 3600 / pricedTokPerS(hw, s, kind, activeOverride, supplied, renderOpts) * 1e6 / (s.util / 100);
}
function blendWeights(s) {
  const total = HW_ORDER.reduce((a, k) => a + (s.blend[k] || 0), 0);
  if (!total) return { h100: 1 };
  const w = {};
  HW_ORDER.forEach(k => { if (s.blend[k] > 0) w[k] = s.blend[k] / total; });
  return w;
}
/* ---------- R3 D-10: five-status population (economics/slo/fullMemory) ----------
   Populated per-leg from TYPED existing evidence only (no new measurements); every
   populated value names its basis; UNVERIFIED stays first-class wherever evidence is
   absent. PREDECLARED total orders (best → worst) drive the fail-closed fleet
   aggregation — aggregateFleetStatusVector is the ONE aggregate over positive-weight
   legs, replacing the two pre-R3 hardcode sites (the solver's UNVERIFIED literals +
   fleetStatusFields' binary worst() for these three slots). Order rationale (memo
   D-10): a known risk finding outranks ignorance, ignorance outranks all-clear —
   the aggregate never reads all-clear when any leg lacks evidence, and a positive
   risk finding is never hidden behind an UNVERIFIED sibling. */
const SLO_STATUS_ORDER = Object.freeze(["within-published-latency-preferred-tier", "UNVERIFIED", "SLO-RISK"]);
// b9 M1 closed-set amendment (memo §5): two members added, each placed conservatively in
// this best→worst order so no aggregate can read BETTER than before. See evidence-schema.js
// FIT_CLASSES for the per-class rationale.
const THROUGHPUT_EVIDENCE_ORDER = Object.freeze(["fitted", "fitted-inherited", "family-transfer",
  "platform-native-aggregate-bridge", "joint-fit", "source-informed-neutral",
  "analyst-set-assumed-op", "projection"]);
const PRICE_EVIDENCE_ORDER = Object.freeze(["observed-source-named", "analyst-set", "unpriced"]);
const FULL_MEMORY_FIT = "weights+peak-KV+flat-10%-HBM-reserve fit at the declared operating point under the policy (runtime-specific workspace demand and fragmentation unmodeled)";
function legStatusSlots(hwKey, solved, domain) {
  const preferred = domain && domain.scaleUp && domain.scaleUp.hardwareLegalShapes
    ? domain.scaleUp.hardwareLegalShapes.latencyPreferredWidth : undefined;
  const w = solved ? solved.declaredOperatingPointWidth : null;
  const slo = (preferred == null || w == null) ? "UNVERIFIED" // never inferred from fabric class
    : w > preferred
      ? "SLO-RISK: solved width " + w + " exceeds the published latency-preferred tier (" + preferred + ") — a latency-risk note, never infeasibility"
      : "within-published-latency-preferred-tier";
  const cal = ED_FLEET.CALIBRATION[hwKey];
  const tec = cal ? cal.throughputEvidenceClass : null;
  const price = ED_FLEET.PRICE_EVIDENCE[hwKey] || null;
  return {
    slo,
    economics: (tec && price) ? "evidence-quality: " + tec + " throughput · " + price + " price" : "UNVERIFIED",
    fullMemory: (solved && solved.declaredOperatingPointSatisfiable === true) ? FULL_MEMORY_FIT : "UNVERIFIED",
    econClasses: (tec && price) ? { throughputClass: tec, priceClass: price } : null,
  };
}
// worst-of by a predeclared order; an UNKNOWN class fails closed to the worst slot.
function worstByOrder(order, values) {
  return values.reduce((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    if (ib === -1) return b; // unknown = worst (fail-closed)
    if (ia === -1) return a;
    return ib > ia ? b : a;
  }, order[0]);
}
function aggregateFleetStatusVector(legs) {
  const svs = legs.map(l => l.statusVector).filter(Boolean);
  const complete = legs.length > 0 && svs.length === legs.length;
  const worstBinary = (component, good, bad) => complete && svs.every(v => v[component] === good) ? good : bad;
  const sloClasses = legs.map(l => !l.statusVector ? "UNVERIFIED"
    : String(l.statusVector.slo).indexOf("SLO-RISK") === 0 ? "SLO-RISK"
    : l.statusVector.slo === "within-published-latency-preferred-tier" ? l.statusVector.slo
    : "UNVERIFIED");
  const econList = legs.map(l => (l.capacityReceipt && l.capacityReceipt.evidenceQuality) || null);
  return {
    weightCapacity: worstBinary("weightCapacity", "FEASIBLE-under-policy", "INFEASIBLE-in-domain"),
    fullMemory: (complete && svs.every(v => v.fullMemory === FULL_MEMORY_FIT)) ? FULL_MEMORY_FIT : "UNVERIFIED",
    topologyLegal: worstBinary("topologyLegal", "within-registered-scale-up-shapes", "UNVERIFIED"),
    slo: legs.length ? worstByOrder(SLO_STATUS_ORDER, sloClasses) : "UNVERIFIED",
    economics: (!legs.length || econList.some(e => !e)) ? "UNVERIFIED"
      : "evidence-quality: " + worstByOrder(THROUGHPUT_EVIDENCE_ORDER, econList.map(e => e.throughputClass))
        + " throughput · " + worstByOrder(PRICE_EVIDENCE_ORDER, econList.map(e => e.priceClass)) + " price",
  };
}
/* R2 (§1.9): the fleet receipt carries the EMITTED five-status vector + two-boolean
   contract + policy identity alongside the renormalization triple. Per-leg solver
   status rides each leg; the fleet aggregate is FAIL-CLOSED (memo §0-ter): fleet
   placementVerified requires EVERY positive-weight leg individually placement-verified;
   one non-renderable-under-policy leg makes allLegsRenderableUnderPolicy false.
   R3 (D-10): the three populated slots aggregate through aggregateFleetStatusVector. */
function fleetStatusFields(legs) {
  const receipt = legs.map(l => l.capacityReceipt).find(Boolean) || null;
  const failNote = (l) => l.reason || (l.capacityReceipt
    ? "capacity target" + (l.capacityReceipt.capacityTargetBatch != null ? " (b=" + l.capacityReceipt.capacityTargetBatch + ")" : "")
      + " not satisfiable within the registered domain under the policy"
      + (l.renderable ? " — rendered CAPPED at the widest legal width; never policy-clean (hero suppresses, central ineligible)" : " — no legal width fits (typed infeasible, no numbers)")
    : "no capacity solve (no registered domain)");
  return {
    allLegsRenderableUnderPolicy: legs.length > 0 && legs.every(l => l.renderableUnderPolicy === true),
    placementVerified: legs.length > 0 && legs.every(l => l.placementVerified === true),
    statusVector: aggregateFleetStatusVector(legs),
    policy: receipt ? { value: receipt.loadedByteValue, source: receipt.loadedByteSource,
      residencyBasis: receipt.residencyBasis || "uniform-policy",
      placementComponentSource: receipt.placementRegistry && receipt.placementRegistry.engaged
        ? receipt.placementRegistry.componentSource : null } : null,
    legStatuses: legs.map(l => ({ hwKey: l.k ?? l.hwKey, renderableUnderPolicy: l.renderableUnderPolicy === true,
      placementVerified: l.placementVerified === true,
      note: l.renderableUnderPolicy === true ? null : failNote(l),
      ...(l.reason ? { reason: l.reason } : {}),
      ...(l.contextWindow ? { contextWindow: l.contextWindow } : {}),
      legalSetProvenanceNote: l.capacityReceipt ? l.capacityReceipt.legalSetProvenanceNote : null,
      conservativeSubsetNote: l.capacityReceipt ? l.capacityReceipt.conservativeSubsetNote : null })),
  };
}
/* ================= b9 M2 family 9 — the FORM-CORRECTION DEBT ==================================
   Memo §3.5. Every leg still on `active-parameter-surrogate` carries an η calibrated in the legacy
   per-device traffic representation. This sizes what re-expressing that leg in the topology-aware
   representation would be worth — WITHOUT re-deriving η, which is exactly why the result is NOT a
   repaired estimate. The coefficient and the representation are a matched pair (run B §A4); moving
   one without the other is the error M1's decision M1-D1 rejected. So this number is the size of an
   OPEN CALIBRATION DEBT, and it is labeled as such at every surface.

   Why it is displayed at all (VISION §3): the un-identified part of the form correction is the most
   consequential fact this milestone learned — the headline swings 53.24% ↔ 64.17% on the N_phys
   declaration alone (memo §2.2). Burying that in a research file while shipping one number would be
   conclusion-shopping. It renders, sized, labeled, and never as a result.
   ============================================================================================== */
const FORM_DEBT_NOT_A_RESULT = "not a repaired estimate — the size of an open calibration debt";

/* The per-leg §C4 re-expression that both the debt rows and the identified span consume:
   coverage under the DISTINCT-SELECTION form (plan §0 Amendment 3 — each token selects topK
   distinct experts, p_e = k/E per token; the former with-replacement form p=1/E over B·q·k
   draws UNDERSTATES coverage, (1-1/E)^k > 1-k/E by Bernoulli, most visibly at low replica
   batch), replica traffic divided by the width CHOICE N, η held. Uniform routing is the
   coverage-MAXIMISING setting (design gate R5), so this counterfactual is an upper bound on
   modelled traffic. The expression order is the original debt row's — form-equivalence
   asserts against it, and IEEE-754 is not associative. */
function c4ReexpressedTokPerS(placement, N, b, dec, hwRow) {
  const bRep = b * N;
  const coverage = 1 - Math.pow(1 - placement.topK / placement.expertsPerLayer, bRep);
  const wDev = (placement.wSharedBytes + placement.moeLayers * placement.expertsPerLayer * placement.wExpertBytes * coverage) / N;
  const tH = (wDev + b * dec.kvSeqBytesDev) / hwRow.bwHBM;
  const tIter = Math.max(dec.tC, tH, dec.tN) / dec.etaEff + dec.tCc;
  return b / tIter;
}
/* Amendment 3 + plan §6 invariant 1 ("no hand-pinned headline numbers"): the identified span is
   COMPUTED, never pinned. It is deliberately FLAGSHIP-SCOPED (opus × median × native reference
   traffic): it states the memo §2.2 identification finding — how far the §C4 form swings on the
   N_phys declaration alone, with η held — not a property of the viewer's current scenario. Both
   endpoints run through the engine's canonical computeMix (design gate R2: the R_eff shorthand
   is a probe cross-check, not the computation); probe8 re-derives them independently. Rounded
   to the memo's presentation precision (4 dp endpoints, 2 dp span) at this boundary. */
function formCorrectionSpanComputed(DATA) {
  const R = rooflineCore();
  const fs = pinReferenceLevers(applyPresetSettings(MODELS.find(m => m.id === "opus"),
    PERSPECTIVES.find(p => p.id === "median"), { mode: "native" })); // b9 M5 §15 reference pin

  const arch = R.resolveArch("opus", undefined);
  if (arch.mode === "dense-tp") return null;
  const w = blendWeights(fs);
  const base = [];
  let unpriced = 0;
  for (const k of HW_ORDER.filter(k => (fs.blend[k] || 0) > 0)) {
    const rp = rooflinePoint(HW[k], fs);
    if (!rp || !rp.point || rp.point.infeasible || !rp.widthRendered) continue;
    /* im-arc T4 fold (2026-08-24), memo §4: a leg whose planning rent resolves as UNAVAILABLE has
       no cost, so it can carry no cost-form debt either. Before the fold every registered row had
       a planning rate and this filter was unreachable; now gb200, gb300 and trn3 have none, and
       admitting them here propagated NaN straight into the published span. The debt is computed
       over the legs that are actually priced, exactly as the renderable-leg machinery does — and
       the count of skipped legs is disclosed on the span rather than silently absorbed. */
    const legIn = costPerMtok(HW[k], fs, "in"), legOut = costPerMtok(HW[k], fs, "out");
    if (!Number.isFinite(legIn) || !Number.isFinite(legOut)) { unpriced++; continue; }
    const dec = rp.point.decode || rp.point;
    base.push({ k, wt: w[k],
      cIn: legIn, cOut: legOut,
      tps: dec.tokPerS, dec, b: rp.point.op && rp.point.op.b,
      widthRendered: rp.widthRendered, nShardDeclared: DATA.HW_ROOFLINE[k].nShard,
      placement: DATA.resolveDecodePlacement("opus", fs.total,
        R.resolvePrecisionTuple(k, fs.precision).sW, arch.topK, arch.moeLayers) });
  }
  const share = base.reduce((a, x) => a + x.wt, 0);
  if (!base.length || !(share > 0)) return null;
  const marginAt = (widthOf) => {
    let cIn = 0, cOut = 0;
    for (const x of base) {
      const tpsCf = c4ReexpressedTokPerS(x.placement, widthOf(x), x.b, x.dec, DATA.HW_ROOFLINE[x.k]);
      cIn += (x.wt / share) * x.cIn;
      cOut += (x.wt / share) * x.cOut * (x.tps / tpsCf);
    }
    return computeMix(cIn, cOut, fs).margin * 100;
  };
  const atRendered = marginAt(x => x.widthRendered);
  const atDeclared = marginAt(x => x.nShardDeclared);
  const lo = Math.min(atRendered, atDeclared), hi = Math.max(atRendered, atDeclared);
  return { lo: +lo.toFixed(4), hi: +hi.toFixed(4), spanPp: +(hi - lo).toFixed(2), unpricedLegsExcluded: unpriced,
    scope: "flagship-opus-baseline-at-public-evidence-reference",
    basis: "computed at the flagship baseline AT THE PUBLIC-EVIDENCE REFERENCE (algorithmic lead 0 months, family multipliers 1.0× — b9 M5 §15 reference pin; the calculator's ratified-prior default reads higher, and this span deliberately excludes that prior because the FORM axis and the lab-lead axis are different questions), solver-rendered vs declared-registry N_phys, distinct-selection coverage per plan §0 Amendment 3, η held — the §C4 form swings this far on the N_phys declaration ALONE, and BOTH ends fall outside the plan's 55.24–61.25 sanity tripwire. The form-corrected headline is not identified by the public evidence (run B §C4)." };
}
/* Memo §5's replication residual, stated verbatim as the typed disclosure it prescribes for any
   row rendering a topology-aware traffic member. Not sized here: sizing it requires the
   placement-faithful pairing memo §5 declines (−5.2770 pp tpu7 leg / −1.3192 pp blend if
   adopted alone — recorded in the memo and BACKLOG, not modeled). */
const C4_REPLICATION_RESIDUAL = "replicated components are charged at the replica's shared rate, per the r4 §C4 minimal form; published placement disciplines replicate attention/dense/shared per rank, which would raise this leg's traffic — an open form residual, not a modeled effect";

function formCorrectionDebt(s, supplied, renderOpts) {
  const R = rooflineCore(), ctx = scenarioContext(s, supplied);
  const ED2 = (typeof module !== "undefined" && module.exports) ? require("./engine-data-v22.js") : null;
  const DATA = ED2 || { CALIBRATION, HW_ROOFLINE, OPERATING_POINTS, WEIGHT_PLACEMENT,
    PRECISION_TIER_MAP, resolveDecodePlacement };
  const arch = R.resolveArch(ctx.modelId, ctx.customDonor);
  const legs = HW_ORDER.filter(k => (s.blend[k] || 0) > 0);
  // Dense-TP donors have no routed experts, so the MoE expert-coverage re-expression is not
  // applicable. Do not manufacture a donor placement with undefined topK and emit NaNs.
  const policyOverride = !!(renderOpts && renderOpts.loadedWeightBytesPerParam != null);
  const engagement = placementEngagement(DATA, ctx, s, policyOverride);
  let placementSummary = null;
  const rows = [];
  for (const hwKey of legs) {
    const cal = DATA.CALIBRATION[hwKey];
    // Surrogate placement is a byte geometry, so it must use this leg's live precision
    // tuple. A hardcoded 1 byte/parameter mislabeled BF16 and hardware fallbacks.
    const placement = arch.mode === "dense-tp"
      ? null
      : DATA.resolveDecodePlacement(ctx.modelId, s.total,
        R.resolvePrecisionTuple(hwKey, s.precision).sW, arch.topK, arch.moeLayers,
        { forceSurrogate: !!(engagement.prow && !engagement.engaged) });
    if (!placementSummary && placement) placementSummary = placement;
    const rp = rooflinePoint(HW[hwKey], s, undefined, supplied, renderOpts);
    if (!rp || !rp.point || rp.point.infeasible) continue;
    const dec = rp.point.decode || rp.point;
    const b = rp.point.op && rp.point.op.b;
    const opCell = DATA.OPERATING_POINTS[hwKey] && DATA.OPERATING_POINTS[hwKey][s.interact];
    const row = {
      hwKey, weightPct: s.blend[hwKey],
      representation: cal.decodeTrafficBasis,
      batchQuantity: opCell ? opCell.batchQuantity : null,
      nPhysDeclared: cal.nPhysDeclared,
      shippedTokPerS: dec.tokPerS,
      counterfactualTokPerS: null, ratio: null,
      note: null, notAResult: FORM_DEBT_NOT_A_RESULT,
    };
    if (cal.decodeTrafficBasis === "active-parameter-surrogate" && b > 0 && placement) {
      // Re-express THIS leg in the topology-aware representation at its DECLARED N_phys (never the
      // solved width — §0-bis firewall), holding η fixed. Coverage form + expression order live in
      // c4ReexpressedTokPerS (plan §0 Amendment 3).
      row.counterfactualTokPerS = c4ReexpressedTokPerS(placement, cal.nPhysDeclared, b, dec, DATA.HW_ROOFLINE[hwKey]);
      row.ratio = row.counterfactualTokPerS / dec.tokPerS;
      row.note = "η calibrated in the legacy per-device representation; re-expressed topology-aware at the declared N_phys with η held";
    } else if (cal.decodeTrafficBasis === "active-parameter-surrogate" && !placement) {
      row.note = "expert-coverage correction not applicable to a dense-TP donor (no routed experts)";
    }
    // Memo §5: any leg RENDERING a topology-aware member carries the replication-residual
    // disclosure — §C4 divides the whole of W_distinct (including W_shared) by N_phys, while
    // published placement disciplines replicate attention/dense/shared per rank.
    if (cal.decodeTrafficBasis === "replica-resident-distinct" || cal.decodeTrafficBasis === "expert-coverage") {
      row.replicationResidual = C4_REPLICATION_RESIDUAL;
    }
    // The family-3 adjudication: a cell stating a replica-global batch consumed per-chip carries its
    // own, much larger exposure, and it must be stated wherever this leg is disclosed.
    if (row.batchQuantity === "B_rep_consumed_as_B_out_per_chip") {
      const perChip = b / cal.nPhysDeclared;
      row.crossQuantityExposure = {
        readAsPerChipTokPerS: dec.tokPerS,
        readAsReplicaGlobalTokPerS: (() => {
          const g = R.decodeRoofline({ arch, activeB: s.active, totalB: s.total, hwKey, b: perChip,
            L: rp.point.lengths ? rp.point.lengths.L : 15500, precision: s.precision, stackMult: s.stackMult });
          return g.tokPerS;
        })(),
      };
      row.crossQuantityExposure.ratio = row.crossQuantityExposure.readAsPerChipTokPerS / row.crossQuantityExposure.readAsReplicaGlobalTokPerS;
      row.crossQuantityNote = "this leg's batch cell states a REPLICA-GLOBAL value that the engine consumes as PER-CHIP (run B §C1's own prescription, which §A3 contradicts). Reading it the other way would be ~" +
        row.crossQuantityExposure.ratio.toFixed(1) + "× lower — this leg may be ~" + row.crossQuantityExposure.ratio.toFixed(0) + "× wrong, and no public evidence settles which reading is right.";
    }
    /* Owner ruling q-im-fp4-gb300-batch-disclosure (2026-08-02, accepted default): "disclose the
       gb300 declared batch on the leg via the family-9 debt surface". The audit
       (reports/im-fp4-precision-audit-2026-08-01 §4) named the defect precisely: GB300's declared
       batch of 64 is the SOLE cause of a visible cross-generation inversion on the site's most
       prominent hardware chart — set it to 128 and Blackwell Ultra lands at parity with a 2022
       H100 — and the value was honestly labelled SCENARIO-ONLY in the data file and entirely
       undisclosed on the surface that renders its consequence.

       The band is REGISTRY-DECLARED (`bSensitivity` on the operating-point cell), never a number
       chosen here: a disclosure that invents its own counterfactual is a second unsourced claim,
       not a repair. Any cell that declares a sensitivity band gets this exposure, so the next
       assumed operating point discloses itself rather than waiting for another audit. */
    if (opCell && opCell.bSensitivity && b > 0) {
      const L = rp.point.lengths ? rp.point.lengths.L : 15500;
      const at = (bb) => R.decodeRoofline({ arch, activeB: s.active, totalB: s.total, hwKey,
        b: bb, L, precision: s.precision, stackMult: s.stackMult }).tokPerS;
      const lo = at(opCell.bSensitivity.lo), hi = at(opCell.bSensitivity.hi);
      row.declaredBatchExposure = {
        declaredB: b, band: { lo: opCell.bSensitivity.lo, hi: opCell.bSensitivity.hi },
        atDeclaredTokPerS: dec.tokPerS, atBandLoTokPerS: lo, atBandHiTokPerS: hi,
        spanRatio: (isFinite(lo) && lo > 0) ? hi / lo : null,
        opBasis: opCell.opBasis || null,
      };
      row.declaredBatchNote = "this leg's operating point is ASSUMED, not measured: its declared "
        + "batch of " + b + " is one point inside a registered " + opCell.bSensitivity.lo + "–"
        + opCell.bSensitivity.hi + " sensitivity, and the engine's throughput moves across that "
        + "band by "
        + ((isFinite(lo) && lo > 0) ? (hi / lo).toFixed(2) + "×" : "an unrenderable factor")
        + ". The declared point is doing the work of a measurement on every surface that renders "
        + "this leg, including the per-generation cost chart. No public evidence settles it; "
        + "resolving it needs a reconstructable serving curve at a stated batch.";
    }
    rows.push(row);
  }
  return {
    placementProvenance: arch.mode === "dense-tp"
      ? "not-applicable-dense-tp"
      : engagement.engaged ? "published-placement" : "declared-surrogate",
    surrogateNote: arch.mode !== "dense-tp"
      ? [placementSummary && placementSummary.surrogateNote, engagement.disengaged.length
          ? "published checkpoint placement disengaged: " + engagement.disengaged.join("; ") : null]
        .filter(Boolean).join("; ") || null
      : "dense-TP donor has no routed-expert placement surface",
    legs: rows,
    identifiedSpan: formCorrectionSpanComputed(DATA),
    notAResult: FORM_DEBT_NOT_A_RESULT,
  };
}

/* b9 M4 (memo §3.1–§3.2): ONE leg-list resolver feeding every computed mix.
   - Non-custom-fleet states: the identity refactor of the previous inline
     blendWeights map — byte-identical outputs (T-2 grid + the snapshot suites are the
     proof; reference blend margin must stay 0.5918058739356502 to the last bit).
   - Custom-fleet states (renderOpts.customFleet, the explicit options channel — never
     hidden module state): legs from the fleet definition; DUPLICATES of one donor at
     different overrides are first-class (the owner's per-datacenter case); weights
     normalize over sharePct exactly as blendWeights normalizes shares.
   Each custom leg yields an EFFECTIVE row: donor spread + rent/capex/label overrides
   on the row (HW fields), with power/electricity/HBM overrides riding the
   renderOpts.cfLeg options channel (memo §3.2 split), and __cfLeg routing hwKeyFor to
   the donor so every by-key registry resolves through the calibration donor. */
function cfEffectiveRow(leg) {
  const donor = HW[leg.donorKey];
  const ov = leg.overrides || {};
  return { ...donor, name: leg.label,
    rent: ov.rentPerHr != null ? sectionPoint(ov.rentPerHr) : donor.rent,
    capex: ov.capexUsd != null ? sectionPoint(ov.capexUsd) : donor.capex,
    __cfLeg: { donorKey: leg.donorKey } };
}
function customFleetSections(def) {
  if (def && Array.isArray(def.sections)) return def.sections;
  if (def && Array.isArray(def.legs)) return [{ id: "s1", label: "(whole fleet)", sharePct: 100,
    basis: "inherit", rent: null, electricity: null, pue: null, tco: null, dcRef: null,
    provenance: null, legs: def.legs }];
  return [];
}
function customFleetFlatDefinition(def) {
  const sections = customFleetSections(def).filter(section => sectionPoint(section.sharePct) > 0);
  const sectionTotal = sections.reduce((sum, section) => sum + sectionPoint(section.sharePct), 0);
  return sections.flatMap(section => {
    const legs = (section.legs || []).filter(leg => sectionPoint(leg.sharePct) > 0);
    const legTotal = legs.reduce((sum, leg) => sum + sectionPoint(leg.sharePct), 0);
    return legs.map(leg => ({ ...leg,
      sharePct: sectionTotal > 0 && legTotal > 0
        ? 100 * sectionPoint(section.sharePct) / sectionTotal * sectionPoint(leg.sharePct) / legTotal : 0,
      sectionId: section.id, sectionBasis: section.basis }));
  });
}
function dcRegistry() {
  return (typeof module !== "undefined" && module.exports)
    ? require("./engine-data-dc-v1.js") : { REGIONS, DATACENTERS, PROGRAMMES, COVERAGE_LEDGER, COVERAGE_WORDING };
}

/* im-arc T3 (plan §1 T3 / §4, owner answer d-20260822-4c26 2026-08-22):
   the UI and both MCP tools consume these pure fleet-composition functions. No
   registry value is copied here: rows, coverage and region triples stay owned by
   engine-data-dc-v1.js, and the existing custom-fleet validator remains the ONE
   section-schema authority. */
function companyForModel(modelId) {
  const model = MODELS.find(candidate => candidate.id === modelId);
  return model && model.lab ? model.lab : null;
}
function registryRows() {
  const data = dcRegistry();
  return { ...data.DATACENTERS, ...data.PROGRAMMES };
}
function registryRowClass(id) {
  const data = dcRegistry();
  if (Object.prototype.hasOwnProperty.call(data.DATACENTERS, id)) return "facility";
  if (Object.prototype.hasOwnProperty.call(data.PROGRAMMES, id)) return "programme";
  return null;
}
function coverageLedgerForModel(modelId) {
  const data = dcRegistry(), company = companyForModel(modelId);
  if (!company) return null;
  const ledger = data.COVERAGE_LEDGER || {};
  /* T4 may key rows directly by preset or nest them under a company. These
     lookups are deliberately shape-tolerant while the row-to-sentence function
     below remains strict about the numeric parts it can actually render. */
  return ledger[modelId]
    || (ledger[company] && ledger[company].presets && ledger[company].presets[modelId])
    || (ledger[company] && ledger[company][modelId])
    || ledger[company] || null;
}
/* ============================================================================
   im-arc T4 fold (2026-08-24) [F3] — THE ONE COVERAGE RESOLVER.

   The ledger stores EVIDENCE keyed {company, preset} at the hardware-key level. It stores no
   percentages, because a stored percentage drifts the moment a blend changes — which is exactly
   what the T3 fix-3 diagnostic found (a static Anthropic 33/67 was the na-blend case, while the
   gptpro-r3 blend yields a different two-row composition). Percentages are DERIVED here, once,
   by UI, engine and MCP alike.

   Precedence, set-subtractive:
     (1) exact modeled keys carrying dated NAMED-SITE serving evidence;
     (2) exact modeled keys carrying qualifying PROGRAMME / type-and-quantity evidence,
         EXCLUDING keys already counted at (1) — so one observation is never counted twice;
     (3) every remaining key is generic fill;
     (4) separately and NON-ADDITIVELY, the SKU/workload count-backed subset.
   ============================================================================ */
/* im-vet-six-repairs (2026-09-20), Astra xhigh review finding 2 — BLOCKING. This resolver
   returned `fleet.legs`, the DECLARED composition, so after the E1 Trainium withdrawal it kept
   publishing coverage of a seven-leg fleet nobody renders: 38% named-site / 33% programme / 29%
   generic, where the five-leg blend the page actually shows gives 50.7 / 33.3 / 16.0. That is
   the silent renormalization E1 exists to prevent, arriving from the other direction — not a
   number absorbing a change, but a DISCLOSURE describing a fleet that is no longer the one on
   screen. Coverage is now derived from the EFFECTIVE composition, and the withdrawn keys travel
   with it so the sentence can name them instead of the reader inferring the change from a
   percentage that moved. */
function withdrawnKeysOf(fleet) {
  return Object.keys((fleet && fleet.withdrawn) || {});
}
function coverageBlendFor(modelId, ledgerRow, override) {
  if (override && override.blend) return override.blend;
  const ref = ledgerRow && ledgerRow.blendRef;
  if (typeof ref === "string" && ref.startsWith("fleet:")) {
    const fleet = ED_FLEET.FLEETS[ref.slice(6)];
    if (fleet && fleet.legs) {
      const withdrawn = withdrawnKeysOf(fleet);
      if (!withdrawn.length) return fleet.legs;
      return Object.fromEntries(Object.entries(fleet.legs).filter(([key]) => !withdrawn.includes(key)));
    }
  }
  const model = MODELS.find(row => row.id === modelId);
  return (model && model.set && model.set.blend) || DEFAULTS.blend;
}
/* The withdrawal that coverageBlendFor just applied, in the row's own words, so the sentence
   states it rather than leaving a moved percentage to speak for itself. */
function coverageWithdrawalFor(ledgerRow) {
  const ref = ledgerRow && ledgerRow.blendRef;
  if (typeof ref !== "string" || !ref.startsWith("fleet:")) return null;
  const fleet = ED_FLEET.FLEETS[ref.slice(6)];
  const withdrawn = withdrawnKeysOf(fleet);
  if (!withdrawn.length) return null;
  const declared = Object.keys(fleet.legs || {}).length;
  return { keys: withdrawn, declaredLegCount: declared, memberLegCount: declared - withdrawn.length,
    sentence: "Coverage is of the " + (declared - withdrawn.length) + " legs this page renders, not the "
      + declared + " it declares: " + withdrawn.map(key => (HW[key] ? HW[key].name : key)).join(" and ")
      + " " + (withdrawn.length === 1 ? "is" : "are")
      + " withdrawn from the default reading and excluded here too" };
}
function coverageForPreset(modelId, override) {
  const ledgerRow = coverageLedgerForModel(modelId);
  if (!ledgerRow) return null;
  const blend = coverageBlendFor(modelId, ledgerRow, override);
  const total = Object.values(blend).reduce((sum, share) => sum + share, 0);
  const keysOf = entries => new Set((entries || []).flatMap(entry => entry.hwKeys || []));
  const named = keysOf(ledgerRow.namedSite);
  const programme = keysOf(ledgerRow.programme);
  /* (2) minus (1): the C1 facility row and the Anthropic C1 capacity programme row carry the
     SAME evidence, so the subtraction is what stops it counting twice. */
  for (const key of named) programme.delete(key);
  const countBacked = keysOf(ledgerRow.countBacked);
  const pct = keys => total > 0
    ? 100 * Object.entries(blend).filter(([key]) => keys.has(key))
      .reduce((sum, [, share]) => sum + share, 0) / total
    : 0;
  const namedPct = pct(named), programmePct = pct(programme);
  const inventory = keysOf(ledgerRow.physicalInventoryRows);
  return {
    modelId, company: (coverageLedgerForModel(modelId) || {}).company || companyForModel(modelId),
    namedSiteServingEvidencePct: namedPct,
    programmeTypeEvidencePct: programmePct,
    genericFillPct: 100 - namedPct - programmePct,
    /* NON-ADDITIVE by construction and by name: it is a property OF the evidence above, not a
       fourth slice of the same 100 (memo §1.5, review question 3). */
    skuWorkloadCountBackedPct: pct(countBacked),
    countBackedIsAdditive: false,
    evidenceKeys: { namedSite: [...named], programme: [...programme], countBacked: [...countBacked],
      physicalInventory: [...inventory] },
    physicalInventoryPct: inventory.size ? pct(inventory) : null,
    physicalInventorySentence: ledgerRow.physicalInventorySentence || null,
    notes: [...(ledgerRow.notes || [])],
    fleetWithdrawal: coverageWithdrawalFor(ledgerRow),
    receipts: [],
    asOf: ledgerRow.asOf || (dcRegistry().COVERAGE_LEDGER[companyForModel(modelId)] || {}).asOf || null,
    wording: dcRegistry().COVERAGE_WORDING,
  };
}
function coverageSentenceParts(row) {
  if (!row || typeof row !== "object") return null;
  const value = (keys, fallback = 0) => {
    for (const key of keys) if (typeof row[key] === "number" && isFinite(row[key])) return row[key];
    return fallback;
  };
  const exact = {
    named_site_serving_evidence_pct: value(["namedSiteServingEvidencePct", "namedSiteServingPct", "facilityEvidencedPct"]),
    programme_type_evidence_pct: value(["programmeTypeEvidencePct", "programmeEvidencedPct"]),
    generic_fill_pct: value(["genericFillPct"]),
  };
  const labels = [["named_site_serving_evidence_pct", "named-site serving evidence"],
    ["programme_type_evidence_pct", "programme-type evidence"],
    ["generic_fill_pct", "generic fill"]];
  const wording = String(row.wording || dcRegistry().COVERAGE_WORDING
    || "share of the MODELED fleet resting on DC-specific public evidence — not how much of the real fleet is known")
    .replace(" — ", ", ");
  /* im-arc T3 FIX-3 (2026-08-23, item C1), CORRECTED by the T4 fold (memo §6.1a): coverage
     percentages are DISPLAY numbers. One decimal is the share doctrine, so this ONE renderer
     rounds every numeric part once and prints a whole number bare — `40%`, `33.3%`, never
     `59.99999999999999%` and never `40.0%`. The parts are rounded INDEPENDENTLY and never nudged
     to force an exact 100: 99.9 or 100.1 is honest. The T3 comment here claimed to protect
     "four-part rows"; that was wrong twice over — the partition is THREE parts, and the fourth
     number is non-additive and therefore outside the sum entirely. */
  const oneDecimal = number => Number.isFinite(number) ? Math.round(number * 10) / 10 : number;
  /* im-arc T4 fold (2026-08-24), memo §6.1b (director ruling): a share that is genuinely
     non-zero but below 0.05 rounds to a bare `0` and reads as NONE. It renders `<0.1%` instead,
     and the unrounded number travels beside it as `exactPct`, so a sliver of named-site evidence
     is never reported as absent. */
  const display = number => {
    if (!Number.isFinite(number)) return String(number);
    if (number > 0 && number < 0.05) return "<0.1";
    const rounded = oneDecimal(number);
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };
  /* A consumer reading the structured number may never disagree with the sentence it read that
     number from (T3 fix-3 doctrine). So a sub-0.05 share does NOT round to a structured 0 while
     the sentence says `<0.1%`: it keeps its unrounded value, and `exactPct` carries it too. */
  const structured = number => Number.isFinite(number) && number > 0 && number < 0.05
    ? number : oneDecimal(number);
  const values = {};
  for (const key of Object.keys(exact)) values[key] = structured(exact[key]);
  const parts = labels.map(([key, label]) => ({ key, label,
    value: values[key], exactPct: exact[key], display: display(exact[key]) }));
  /* memo §6.1a: the band a consumer may assert is 0.05 x the number of ADDITIVE parts —
     computed from the row it is checking, never the literal 0.15 the T3 tests hard-coded. */
  const roundingBand = 0.05 * parts.length;
  const countBacked = typeof row.skuWorkloadCountBackedPct === "number"
    && isFinite(row.skuWorkloadCountBackedPct)
    ? { key: "sku_workload_count_backed_pct", label: "SKU/workload count-backed",
        value: structured(row.skuWorkloadCountBackedPct), exactPct: row.skuWorkloadCountBackedPct,
        display: display(row.skuWorkloadCountBackedPct), additive: false,
        sentence: "SKU/workload count-backed: " + display(row.skuWorkloadCountBackedPct)
          + "% (non-additive)" }
    : null;
  const receipts = Array.isArray(row.receipts) ? structuredClone(row.receipts) : [];
  const extraSentences = [];
  /* Astra xhigh finding 2 fold: the withdrawal clause leads the extra sentences, because a
     reader who takes the percentages at face value has to know WHICH fleet they are of before
     anything else qualifies them. */
  if (row.fleetWithdrawal && row.fleetWithdrawal.sentence) extraSentences.push(row.fleetWithdrawal.sentence);
  if (row.physicalInventorySentence) extraSentences.push(row.physicalInventorySentence);
  for (const note of (row.notes || [])) if (/not disclosed/.test(note)) extraSentences.push(note);
  return {
    mode: "three-part-plus-count-backed", values, parts, receipts,
    subordinate: countBacked, roundingBand,
    roundingBasis: "0.05 x the number of additive parts (" + parts.length + ")",
    sentence: parts.map(part => part.display + "% " + part.label).join(" · ") + " — " + wording
      + (countBacked ? " · " + countBacked.sentence : "")
      + (extraSentences.length ? " · " + extraSentences.join(" · ") : "")
      + (receipts.length ? " · Coverage fallbacks: " + receipts.map(receipt => receipt.sentence).join("; ") : ""),
  };
}
/* T3 fix-3 item C2: a registry row the reader SELECTED that received no donor allocation is not
   in `sections` at all — it composed to nothing. composeFleetFromDcRows records that drop against
   the validated sections array it produced (derived data, never caller authority and never on the
   wire), and the one coverage function surfaces it through the receipt channel. */
const NOT_COMPOSED_RECEIPTS = new WeakMap();
function compositionReceiptsFor(sections) {
  return (Array.isArray(sections) && NOT_COMPOSED_RECEIPTS.get(sections)) || [];
}
function notComposedReceipt(rowId, row, modelId, s) {
  /* im-arc T4 fold (2026-08-24): a facility whose inventory is a MIXED AGGREGATE has no per-SKU
     counts to allocate, so it composes nothing by design. The receipt says which keys are
     present at the site and why presence alone cannot become a fleet weight. */
  const hwKeys = [...new Set([...(row.accelerators || []).map(accelerator => accelerator.hwKey),
    ...((row.mixedAggregate && row.mixedAggregate.hwKeysPresent) || [])])];
  const context = s && typeof s === "object" ? SCENARIO_CONTEXT.get(s) : null;
  const perspId = (context && context.perspId) || "current";
  const model = modelId || (context && context.modelId) || "the selected model";
  const aggregate = row.mixedAggregate && !(row.accelerators || []).length;
  const reason = aggregate
    ? "the row states its inventory as one mixed aggregate with no public per-SKU split ("
      + hwKeys.join(", ") + " are present at the site), and an unsplit aggregate may not be turned "
      + "into fleet weights"
    : "none of the row's accelerators (" + hwKeys.join(", ") + ") appear in the "
      + perspId + " blend for " + model + "; add that hardware to the blend or edit the sections";
  return { rowId, classification: "not-composed", hwKeys, reason,
    sentence: "registry row " + rowId + " was selected but composed no section: " + reason };
}
/* im-arc T4 fold (2026-08-24) [F3]: a donor's class comes from the STORED EVIDENCE for this
   {company, preset}, not from the mere existence of a registry row that happens to name the key.
   That distinction is the whole xAI 95% correction: Colossus rows prove typed accelerators are
   PRESENT at a site; they do not prove a share of the modeled Grok blend is SERVED there. */
function coverageClassForDonor(modelId, rowId, donorKey) {
  const data = dcRegistry(), rows = { ...data.DATACENTERS, ...data.PROGRAMMES };
  const row = rows[rowId], kind = registryRowClass(rowId);
  if (!row || !kind) return { kind: "generic", reason: "the referenced registry row does not exist" };
  const company = modelId ? companyForModel(modelId) : row.company;
  if (!company || row.company !== company)
    return { kind: "generic", reason: "the registry row belongs to " + row.company
      + ", not the selected model company " + (company || "(none)") };
  const carriesDonor = (row.accelerators || []).some(accelerator => accelerator.hwKey === donorKey)
    || (row.mixedAggregate && (row.mixedAggregate.hwKeysPresent || []).includes(donorKey));
  if (!carriesDonor)
    return { kind: "generic", reason: "registry row " + rowId + " does not carry donor " + donorKey };
  const ledger = coverageLedgerForModel(modelId);
  if (!ledger) return { kind: "generic", reason: "no evidence is registered for " + company };
  const named = (ledger.namedSite || []).some(entry => entry.rowId === rowId
    && (entry.hwKeys || []).includes(donorKey));
  if (named) return { kind: "facility", reason: null };
  const programme = (ledger.programme || []).some(entry => entry.rowId === rowId
    && (entry.hwKeys || []).includes(donorKey));
  if (programme) return { kind: "programme", reason: null };
  const inventoryOnly = (ledger.physicalInventoryRows || []).some(entry => entry.rowId === rowId
    && (entry.hwKeys || []).includes(donorKey));
  return { kind: "generic",
    reason: inventoryOnly
      ? "registry row " + rowId + " places donor " + donorKey + " at the site as PHYSICAL INVENTORY"
        + (row.asOf ? " (row as of " + row.asOf + ")" : "")
        + ", and no dated evidence allocates a serving share of the "
        + (modelId || company) + " modeled blend to it"
      : "no dated named-site serving or programme evidence registers " + rowId + " for donor "
        + donorKey + " on " + (modelId || company)
        + (row.asOf ? " (row as of " + row.asOf + ")" : "") };
}
function coverageForFleetSections(sections, modelId) {
  const out = { namedSiteServingEvidencePct: 0, programmeTypeEvidencePct: 0, genericFillPct: 0,
    receipts: [] };
  const active = (sections || []).filter(section => sectionPoint(section.sharePct) > 0);
  const total = active.reduce((sum, section) => sum + sectionPoint(section.sharePct), 0);
  const countBackedKeys = new Set(((coverageLedgerForModel(modelId) || {}).countBacked || [])
    .flatMap(entry => entry.hwKeys || []));
  let countBackedPct = 0;
  for (const section of active) {
    const sectionShare = total > 0 ? 100 * sectionPoint(section.sharePct) / total : 0;
    const legs = (section.legs || []).filter(leg => sectionPoint(leg.sharePct) > 0);
    const legTotal = legs.reduce((sum, leg) => sum + sectionPoint(leg.sharePct), 0);
    if (!legs.length || !(legTotal > 0)) { out.genericFillPct += sectionShare; continue; }
    for (const leg of legs) {
      const share = sectionShare * sectionPoint(leg.sharePct) / legTotal;
      if (countBackedKeys.has(leg.donorKey)) countBackedPct += share;
      const classification = section.dcRef
        ? coverageClassForDonor(modelId, section.dcRef, leg.donorKey)
        : { kind: "generic", reason: null };
      if (classification.kind === "facility") out.namedSiteServingEvidencePct += share;
      else if (classification.kind === "programme") out.programmeTypeEvidencePct += share;
      else {
        out.genericFillPct += share;
        if (section.dcRef && classification.reason) out.receipts.push({ sectionId: section.id,
          rowId: section.dcRef, donorKey: leg.donorKey, classification: "generic-fill",
          reason: classification.reason,
          sentence: "section " + section.id + " donor " + leg.donorKey + " uses generic fill: "
            + classification.reason });
      }
    }
  }
  /* im-arc T3 FIX-3 (2026-08-23, item C1): the accumulator adds raw float shares, so
     0.1-scale noise (59.99999999999999) reaches every consumer. Round the three
     numeric parts ONCE, here, at the end — never in a caller. Each part is rounded
     independently; the sum is allowed to land on 99.9 or 100.1 rather than be
     silently adjusted to hit 100 exactly. */
  const oneDecimal = value => Number.isFinite(value) ? Math.round(value * 10) / 10 : value;
  out.namedSiteServingEvidencePct = oneDecimal(out.namedSiteServingEvidencePct);
  out.programmeTypeEvidencePct = oneDecimal(out.programmeTypeEvidencePct);
  out.genericFillPct = oneDecimal(out.genericFillPct);
  /* im-arc T4 fold (2026-08-24): the SKU/workload count-backed share is accumulated over the
     SAME legs and reported beside the partition, never inside it. */
  out.skuWorkloadCountBackedPct = oneDecimal(countBackedPct);
  out.countBackedIsAdditive = false;
  /* im-arc T3 FIX-3 (2026-08-23, item C2): a registry row the reader SELECTED that
     received no donor allocation is not in `sections` at all — it composed to nothing.
     composeFleetFromDcRows records that drop against the validated sections array it
     produced (derived data, never caller authority and never on the wire), and this ONE
     function surfaces it on both surfaces through the coverage receipt channel. */
  for (const receipt of compositionReceiptsFor(sections)) out.receipts.push(structuredClone(receipt));
  out.wording = dcRegistry().COVERAGE_WORDING;
  return out;
}
function fleetModeRenderOptions(mode, fleet) {
  if (mode === "generic") return undefined;
  if (mode !== "advanced") throw new TypeError("fleet mode must be 'generic' or 'advanced'");
  if (!fleet) throw new TypeError("advanced fleet mode requires a section fleet");
  return { customFleet: fleet };
}
function validateFleetSections(fleet, opts) {
  return cfValidator()(fleet, { requireId: !opts || opts.requireId !== false });
}
/* im-arc T3 (plan §1 T3 / §4, owner answer d-20260822-4c26 2026-08-22):
   discovery publishes the validator's schema rather than a second MCP-only copy.
   custom-fleets.js remains the ONE authority; this function merely serializes its
   exported closed sets for UI/MCP discovery. */
function fleetSectionsSchema() {
  const cf = (typeof module !== "undefined" && module.exports)
    ? require("./custom-fleets.js")
    : { CF_MAX_LEGS, CF_MAX_SECTIONS, CF_NAME_MAX, CF_FLEET_KEYS, CF_SECTION_KEYS,
        CF_LEG_KEYS, CF_OVERRIDE_KEYS, CF_RENT_MODES, CF_RENT_KEYS,
        CF_ELECTRICITY_KEYS, CF_TCO_KEYS, CF_TRIPLE_KEYS, CF_BOUNDS };
  return {
    fleet_keys: [...cf.CF_FLEET_KEYS], section_keys: [...cf.CF_SECTION_KEYS],
    leg_keys: [...cf.CF_LEG_KEYS], leg_override_keys: [...cf.CF_OVERRIDE_KEYS],
    procurement_bases: [...PROCUREMENT_BASES], rent_modes: [...cf.CF_RENT_MODES],
    rent_keys_by_mode: structuredClone(cf.CF_RENT_KEYS),
    electricity_keys: [...cf.CF_ELECTRICITY_KEYS], tco_keys: [...cf.CF_TCO_KEYS],
    triple_keys: [...cf.CF_TRIPLE_KEYS], bounds: structuredClone(cf.CF_BOUNDS),
    limits: { max_sections: cf.CF_MAX_SECTIONS, max_legs: cf.CF_MAX_LEGS,
      name_chars: cf.CF_NAME_MAX },
    validator: "site/custom-fleets.js validateCustomFleet (reject-whole, never clamp)",
  };
}
function bandSchema() {
  return { point: "finite number", triple: { lo: "finite number", mid: "finite number", hi: "finite number" },
    order: "lo <= mid <= hi", middle_label: "middle assumption",
    share_rule: "section and leg shares are coupled sum-to-100 polytopes, not independent box dials" };
}
function dcRegions() { return structuredClone(dcRegistry().REGIONS); }
function registryFallbackReceipts(row, s, basis, allocations, section) {
  const receipts = [];
  if (!row.procurement || row.procurement === "mixed")
    receipts.push({ field: "procurement", value: basis, source: "resolved section.basis",
      reason: "the registry row does not declare one procurement basis" });
  const usesRegisteredRent = !section || !section.rent || section.rent.mode === "registered";
  if (row.rent == null && basis !== "owned-strategic-tco" && usesRegisteredRent) {
    const values = {}, sources = [], unavailable = [];
    for (const [donorKey] of allocations) {
      const resolved = registryPlanningRentHr(HW[donorKey], s, null);
      /* im-arc T4 fold (2026-08-24), memo §4: a donor whose planning quote is unavailable has
         no number to put here. The receipt says so IN WORDS rather than carrying a NaN that
         the shared validator would (rightly) refuse — the reader is told which donors have no
         admissible public planning rate, not handed a silent hole. */
      if (Number.isFinite(resolved)) values[donorKey] = resolved;
      else { values[donorKey] = "unavailable — no admissible public planning quote"; unavailable.push(donorKey); }
      const registered = engineData().HW_ROOFLINE[donorKey];
      sources.push(donorKey + ": " + (registered && registered.rentBasis || "unregistered rent basis"));
    }
    receipts.push({ field: "rent", value: values,
      source: "registryPlanningRentHr using site/engine-data-v22.js rentBasis — " + sources.join(" | "),
      reason: "the registry row carries no DC-specific rental rate"
        + (unavailable.length ? "; no admissible public planning quote is registered for "
          + unavailable.join(", ") + ", so those legs resolve through the unavailable-row path" : "") });
  }
  if (row.pue == null && (!section || section.pue == null))
    receipts.push({ field: "pue", value: s.pue, source: "scenario.pue",
      reason: "the registry row carries no DC-specific PUE" });
  const hasNumericElectricity = section && section.electricity
    && Object.prototype.hasOwnProperty.call(section.electricity, "usdPerKwh");
  if (row.electricity == null && !hasNumericElectricity) {
    const resolved = sectionElectricity(section, s);
    receipts.push({ field: "electricity",
      value: resolved.value, source: resolved.source,
      reason: "the registry row carries no DC-specific electricity value" });
  }
  return receipts.sort((a, b) => a.field.localeCompare(b.field));
}
function largestRemainderTenths(rows, target, keyOf) {
  const total = rows.reduce((sum, row) => sum + sectionPoint(row.sharePct), 0);
  if (!(total > 0)) return { shares: rows.map(() => 0), residualKeys: [] };
  const exactTicks = rows.map(row => sectionPoint(row.sharePct) / total * target * 10);
  const ticks = exactTicks.map(value => Math.floor(value + 1e-12));
  let residual = Math.round(target * 10) - ticks.reduce((sum, value) => sum + value, 0);
  const order = rows.map((row, index) => ({ index, key: keyOf(row), remainder: exactTicks[index] - ticks[index] }))
    .sort((left, right) => right.remainder - left.remainder
      || left.key.localeCompare(right.key) || left.index - right.index);
  const residualKeys = [];
  for (let cursor = 0; cursor < residual; cursor++) {
    const chosen = order[cursor % order.length];
    ticks[chosen.index]++;
    residualKeys.push(chosen.key);
  }
  return { shares: ticks.map(value => value / 10), residualKeys };
}
function roundComposedShares(sections) {
  const sectionRounded = largestRemainderTenths(sections, 100, section => section.id);
  return sections.map((section, index) => {
    const legRounded = largestRemainderTenths(section.legs || [], 100, leg => leg.donorKey);
    const changes = [];
    const sectionDeclared = sectionPoint(section.sharePct);
    if (Math.abs(sectionRounded.shares[index] - sectionDeclared) >= 0.05 - 1e-9)
      changes.push({ scope: "section", key: section.id, declared: sectionDeclared,
        rounded: sectionRounded.shares[index] });
    const legs = (section.legs || []).map((leg, legIndex) => {
      const declared = sectionPoint(leg.sharePct), rounded = legRounded.shares[legIndex];
      if (Math.abs(rounded - declared) >= 0.05 - 1e-9)
        changes.push({ scope: "leg", key: leg.donorKey, declared, rounded });
      return { ...leg, sharePct: rounded };
    });
    const shareRounding = changes.length ? {
      basis: "largest-remainder allocation to one decimal place; section and leg shares each sum exactly to 100",
      changes,
      residualKeys: [...sectionRounded.residualKeys.map(key => "section:" + key),
        ...legRounded.residualKeys.map(key => "leg:" + key)],
    } : null;
    return { ...section, sharePct: sectionRounded.shares[index], legs,
      ...(shareRounding ? { shareRounding } : {}) };
  });
}
function registrySectionFromRow(rowId, s, allocation, index) {
  const data = dcRegistry(), row = registryRows()[rowId];
  if (!row) throw new TypeError("unknown registry row '" + rowId + "'");
  const allocations = Object.entries(allocation || {}).filter(([, share]) => share > 0);
  if (!allocations.length) return null;
  const total = allocations.reduce((sum, [, share]) => sum + share, 0);
  const owned = row.procurement === "owned" || s.hwMode === "tco";
  const basis = owned ? "owned-strategic-tco" : "committed-planning-rent";
  let electricity = null;
  if (row.electricity && row.electricity.usdPerKwh)
    electricity = { usdPerKwh: structuredClone(row.electricity.usdPerKwh),
      source: row.electricity.source, regionRef: row.regionRef };
  else if (row.electricity && row.electricity.inherit)
    electricity = { regionRef: row.electricity.inherit };
  else if (row.regionRef) electricity = { regionRef: row.regionRef };
  const label = String(row.site || row.programme || row.operator || rowId).slice(0, 60);
  const section = { id: "s" + index, label, sharePct: total, basis,
    rent: owned ? null : (row.rent ? structuredClone(row.rent) : { mode: "registered", mult: 1 }), electricity,
    pue: row.pue == null ? null : structuredClone(row.pue), tco: null,
    dcRef: rowId, provenance: row.provenance,
    legs: allocations.map(([donorKey, share]) => ({ donorKey,
      label: HW[donorKey].name, sharePct: 100 * share / total, overrides: {},
      family: familyOf(HW[donorKey], null) })) };
  section.fallbackReceipts = registryFallbackReceipts(row, s, basis, allocations, section);
  return section;
}
function composeFleetFromDcRows(s, opts) {
  if (!s || !opts || !Array.isArray(opts.dcRows))
    throw new TypeError("composeFleetFromDcRows requires state and dcRows[]");
  if (opts.fill !== "generic-us" && opts.fill !== "generic-cn")
    throw new TypeError("fill must be 'generic-us' or 'generic-cn'");
  const company = companyForModel(opts.modelId), rows = registryRows();
  if (!company) throw new TypeError("model '" + opts.modelId + "' has no provider fleet registry");
  const ids = [...new Set(opts.dcRows)];
  for (const id of ids) {
    if (!Object.prototype.hasOwnProperty.call(rows, id)) throw new TypeError("unknown registry row '" + id + "'");
    if (rows[id].company !== company)
      throw new TypeError("registry row '" + id + "' belongs to " + rows[id].company + ", not " + company);
  }
  const weights = blendWeights(s), byRow = Object.fromEntries(ids.map(id => [id, {}]));
  const uncovered = {};
  for (const [donorKey, shareFraction] of Object.entries(weights)) {
    const share = shareFraction * 100;
    const candidates = ids.map(id => {
      const acc = (rows[id].accelerators || []).find(item => item.hwKey === donorKey);
      return acc ? { id, count: sectionPoint(acc.count) } : null;
    }).filter(candidate => candidate && candidate.count > 0);
    const countTotal = candidates.reduce((sum, candidate) => sum + candidate.count, 0);
    if (!countTotal) { uncovered[donorKey] = share; continue; }
    for (const candidate of candidates)
      byRow[candidate.id][donorKey] = share * candidate.count / countTotal;
  }
  const sections = [], notComposed = [];
  for (const id of ids) {
    const section = registrySectionFromRow(id, s, byRow[id], sections.length + 1);
    /* im-arc T3 FIX-3 (2026-08-23, item C2): the count partition above stands — both
       reviewers accepted it and the plan's "counts propose shares where they exist"
       reads that way. What changes is the SILENCE: a selected row whose accelerators
       intersect no blend donor allocates nothing, registrySectionFromRow returns null,
       and the row used to vanish without a word. Disclose it instead. */
    if (section) sections.push(section);
    else notComposed.push(notComposedReceipt(id, rows[id], opts.modelId, s));
  }
  const genericShare = Object.values(uncovered).reduce((sum, share) => sum + share, 0);
  if (genericShare > 1e-12) {
    const regionRef = opts.fill === "generic-cn" ? "cn-coastal" : "us-industrial";
    const owned = s.hwMode === "tco";
    sections.push({ id: "s" + (sections.length + 1), label: opts.fill === "generic-cn"
      ? "Generic coastal-China fill" : "Generic US fill", sharePct: genericShare,
      basis: owned ? "owned-strategic-tco" : "committed-planning-rent",
      rent: owned ? null : { mode: "registered", mult: 1 }, electricity: { regionRef },
      pue: null, tco: null, dcRef: null, provenance: "generic-fill",
      legs: Object.entries(uncovered).filter(([, share]) => share > 0).map(([donorKey, share]) => ({
        donorKey, label: HW[donorKey].name, sharePct: 100 * share / genericShare,
        overrides: {}, family: familyOf(HW[donorKey], null) })) });
  }
  const candidate = { id: opts.id || "cf:dct3fleet", name: opts.name || "Data-center fleet scenario",
    epoch: DEFAULTS_EPOCH, clonedFrom: null, sections: roundComposedShares(sections) };
  const validated = validateFleetSections(candidate);
  if (!validated.ok) throw new TypeError("composed fleet failed the shared validator: " + validated.errors.join("; "));
  if (notComposed.length) NOT_COMPOSED_RECEIPTS.set(validated.fleet.sections,
    notComposed.sort((left, right) => left.rowId.localeCompare(right.rowId)));
  return validated.fleet;
}
function sectionElectricity(section, s) {
  if (section && section.electricity) {
    /* im-arc T2 fix (Sol review 2026-08-23, finding P1-5): an explicit
       numeric value is the operative override even when regionRef is retained
       as context. A region-only receipt consumes the registered triple. */
    if (Object.prototype.hasOwnProperty.call(section.electricity, "usdPerKwh"))
      return { value: sectionPoint(section.electricity.usdPerKwh), source: "override" };
    if (section.electricity.regionRef) {
      const region = dcRegistry().REGIONS[section.electricity.regionRef];
      if (region) return { value: sectionPoint(region.usdPerKwh), source: "region:" + section.electricity.regionRef };
    }
  }
  if (section && section.dcRef) {
    const dc = dcRegistry().DATACENTERS[section.dcRef];
    if (dc && dc.electricity) {
      if (dc.electricity.inherit) {
        const region = dcRegistry().REGIONS[dc.electricity.inherit];
        if (region) return { value: sectionPoint(region.usdPerKwh), source: "region:" + dc.electricity.inherit };
      } else if (dc.electricity.usdPerKwh) {
        return { value: sectionPoint(dc.electricity.usdPerKwh), source: "section:" + section.id };
      }
    }
  }
  return { value: s.kwh, source: "scenario-default" };
}
function sectionRent(section, hw, s) {
  if (!section || !section.rent) return null;
  const rent = section.rent;
  if (rent.mode === "flat")
    return { value: sectionPoint(rent.usdPerHr), source: "section-flat-rate" };
  if (rent.mode === "registered")
    return { value: registryPlanningRentHr(hw, s || DEFAULTS, null) * sectionPoint(rent.mult),
      source: "registry-planning-rate" };
  if (rent.mode === "byHw") {
    const donor = hwKeyFor(hw);
    const carriesDonor = rent.usdPerHrByHw
      && Object.prototype.hasOwnProperty.call(rent.usdPerHrByHw, donor)
      && rent.usdPerHrByHw[donor] != null;
    if (carriesDonor)
      return { value: sectionPoint(rent.usdPerHrByHw[donor]), source: "section-price-map" };
    const source = "registry-planning-rate (hypothetical donor; section price map does not carry "
      + donor + ")";
    const value = registryPlanningRentHr(hw, s || DEFAULTS, null);
    if (isFinite(value)) return { value, source };
    return { value: null, source, unavailable: true,
      reason: "No registry planning rent is available for hypothetical donor " + donor
        + " in section " + section.id + "." };
  }
  return { value: null, source: "unsupported-section-rent-mode", unavailable: true,
    reason: "Unsupported rent mode on section " + section.id + "." };
}
function cfLegChannel(leg, section, s, hw) {
  const ov = leg.overrides || {};
  /* T5 rec 4, fail-closed. The engine's override channel speaks BYTES only. A leg still carrying
     the retired `hbmGB` reached here without passing validateCustomFleet — the one place the
     legacy fold lives — and if that were tolerated the override would be silently DROPPED and the
     leg would quietly render at full donor capacity. A capacity that vanishes is the same class of
     harm as a capacity that shrinks, so this is an error, never a fallback conversion: converting
     here would put a second ×1e9 authority back in the codebase, which is what rec 4 retired. */
  if (ov.hbmGB != null) {
    throw new Error("cfLegChannel: leg carries the retired 'hbmGB' override — route the fleet "
      + "through validateCustomFleet (which folds it to typed 'hbmBytes') before rendering");
  }
  const electricity = sectionElectricity(section, s || DEFAULTS);
  const tco = section && section.tco || {};
  const key = leg.donorKey;
  const rent = sectionRent(section, hw, s || DEFAULTS);
  /* b9 M5: the leg's FAMILY travels the same options channel as its overrides. Without it the
     lever resolution falls back to the DONOR row's family, and an "unclassified" leg would
     silently ride a family multiplier it is exempt from (D-5 verbatim, memo §8.3). */
  return { boardPowerW: ov.boardPowerW != null ? sectionPoint(ov.boardPowerW) : null,
           kwhPerKwh: ov.kwhPerKwh != null ? sectionPoint(ov.kwhPerKwh) : electricity.value,
           hbmBytes: ov.hbmBytes != null ? sectionPoint(ov.hbmBytes) : null,
           capexUsd: ov.capexUsd != null ? sectionPoint(ov.capexUsd)
             : (tco.capexUsdByHw && tco.capexUsdByHw[key] != null ? sectionPoint(tco.capexUsdByHw[key]) : null),
           /* round 4: the scope travels WITH the value it describes — a leg override carries its
              own, a section-map capex carries the section's. Null when no reader capex applies. */
           capexScope: ov.capexUsd != null ? (ov.capexScope || null)
             : (tco.capexUsdByHw && tco.capexUsdByHw[key] != null ? (tco.capexScope || null) : null),
           pue: section && section.pue != null ? sectionPoint(section.pue) : (s || DEFAULTS).pue,
           lifeYears: tco.lifeYears != null ? sectionPoint(tco.lifeYears) : null,
           dcPerW: tco.dcPerW != null ? sectionPoint(tco.dcPerW) : null,
           clusterOh: tco.clusterOh != null ? sectionPoint(tco.clusterOh) : null,
           opexPct: tco.opexPct != null ? sectionPoint(tco.opexPct) : null,
           rentHr: rent && rent.unavailable ? NaN : rent && rent.value,
           /* Optional receipt extension: only byHw sections need to distinguish
              their own map from a hypothetical-donor fallback. UI and MCP both
              consume the engine DTO rather than re-deriving this provenance. */
           rent: section && section.rent && section.rent.mode === "byHw" ? rent : null,
           basis: section ? section.basis : null,
           sectionId: section ? section.id : null,
           electricitySource: section && section.basis === "owned-strategic-tco"
             ? (ov.kwhPerKwh != null ? "override" : electricity.source) : "embedded-in-rent",
           family: typeof leg.family === "string" ? leg.family : null };
}
function effectiveSectionBasis(section, s, legs) {
  if (section.basis !== "inherit") {
    if (!PROCUREMENT_BASES.includes(section.basis))
      throw new Error("unknown procurement basis '" + section.basis + "' on section " + section.id + " — fail closed");
    if (section.rent && section.rent.mode === "registered" && section.basis !== "owned-strategic-tco") {
      const rowBases = [...new Set(legs.map(leg => legProcurementBasis(leg.donorKey, s, { ...section, basis: "inherit" })))];
      if (rowBases.length !== 1 || !rowBases[0]) throw new Error("registered-rent section " + section.id + " has no uniform registered basis");
      return rowBases[0];
    }
    return section.basis;
  }
  if (s.hwMode === "tco") return "owned-strategic-tco";
  const rowBases = [...new Set(legs.map(leg => legProcurementBasis(leg.donorKey, s, null)))];
  if (rowBases.length !== 1 || !PROCUREMENT_BASES.includes(rowBases[0]))
    throw new Error("inherit section " + section.id + " cannot resolve one effective basis");
  return rowBases[0];
}
function assertSectionsTyped(sections) {
  for (const entry of sections || []) {
    const section = entry.section || entry;
    if (!section || section.basis === "inherit")
      throw new Error("section has no resolved effective basis; 'inherit' is migration-only");
    if (!PROCUREMENT_BASES.includes(section.basis))
      throw new Error("unknown procurement basis '" + section.basis + "' on resolved section");
  }
  return sections;
}
function coverageApplicableRowIds(modelId, s) {
  /* im-arc T4 fold (2026-08-24) [F3]: the ROW-ID lists live on the company entry; the preset
     entry carries the key-level evidence. Reading the preset row for `rows`/`programmes` would
     silently return an empty candidate set and compose a fleet with no registry sections at all,
     which is exactly what a stress lens must never do quietly. */
  const company = companyForModel(modelId);
  const ledger = (dcRegistry().COVERAGE_LEDGER || {})[company];
  if (!ledger) return [];
  const weights = blendWeights(s);
  return [...new Set([...(ledger.rows || []), ...(ledger.programmes || [])])].filter(rowId => {
    const row = registryRows()[rowId];
    return row && (row.accelerators || []).some(accelerator => (weights[accelerator.hwKey] || 0) > 0
      && coverageClassForDonor(modelId, rowId, accelerator.hwKey).kind !== "generic");
  });
}
function stressFleetForState(s) {
  const context = s && typeof s === "object" ? SCENARIO_CONTEXT.get(s) : null;
  if (!context || context.perspId !== "stress-public-rate") return null;
  const company = companyForModel(context.modelId);
  if (!company) return null;
  const fill = ["deepseek", "zhipu", "moonshot"].includes(company) ? "generic-cn" : "generic-us";
  return composeFleetFromDcRows(s, { modelId: context.modelId,
    dcRows: coverageApplicableRowIds(context.modelId, s), fill,
    id: "cf:stress01", name: "Public-rate registry stress fleet" });
}
function effectiveSectionFleet(s, renderOpts) {
  return renderOpts && renderOpts.customFleet ? renderOpts.customFleet : stressFleetForState(s);
}
function sectionShareNormalizationReceipt(section, declaredTotalPct, normalizedShare) {
  if (Math.abs(declaredTotalPct - 100) <= 0.05 + 1e-9) return null;
  const declaredSharePct = sectionPoint(section.sharePct);
  const normalizedSharePct = normalizedShare * 100;
  const pointBasis = section.sharePct && typeof section.sharePct === "object"
    ? "middle-assumption section share" : "point section share";
  const basis = pointBasis + " — normalized from a declared " + declaredSharePct
    + " (declared shares summed to " + declaredTotalPct + ")";
  return { declaredSharePct, declaredTotalPct, normalizedSharePct, basis,
    sentence: "normalized from a declared " + declaredSharePct
      + " (declared shares summed to " + declaredTotalPct + ")" };
}
function resolveFleetSections(s, renderOpts) {
  const cf = effectiveSectionFleet(s, renderOpts);
  if (cf) {
    const rawSections = customFleetSections(cf);
    const activeSections = rawSections.filter(section => sectionPoint(section.sharePct) > 0);
    const sectionTotal = activeSections.reduce((sum, section) => sum + sectionPoint(section.sharePct), 0);
    const resolved = activeSections.map(section => {
      const rawLegs = section.legs || [];
      const activeRawLegs = rawLegs.filter(leg => sectionPoint(leg.sharePct) > 0);
      const legTotal = activeRawLegs.reduce((sum, leg) => sum + sectionPoint(leg.sharePct), 0);
      const basis = effectiveSectionBasis(section, s, activeRawLegs);
      /* im-arc T2 fix (Sol review 2026-08-23, finding P2-1): legacy
         declarations are checked while they still exist. Only the runtime copy
         drops the migration metadata after the contradiction guard passes. */
      assertUniformProcurementBasis(rawLegs.map(leg => ({ k: leg.donorKey, leg })), s,
        { ...section, basis });
      const activeLegs = activeRawLegs.map(leg => { const copy = { ...leg }; delete copy.basisDeclared; return copy; });
      const runtimeSection = { ...section, sharePct: sectionPoint(section.sharePct), basis,
        legs: (section.legs || []).map(leg => { const copy = { ...leg }; delete copy.basisDeclared; return copy; }) };
      /* fallbackReceipts is a wire/result convenience, never caller authority. Re-derive
         it after every UI/MCP edit from the operative section and registry row. */
      delete runtimeSection.fallbackReceipts;
      const registryRow = runtimeSection.dcRef ? registryRows()[runtimeSection.dcRef] : null;
      if (registryRow) {
        const allocations = activeLegs.map(leg => [leg.donorKey, sectionPoint(leg.sharePct)]);
        const receipts = registryFallbackReceipts(registryRow, s, basis, allocations, runtimeSection);
        if (receipts.length) runtimeSection.fallbackReceipts = receipts;
      }
      const sectionShare = sectionPoint(section.sharePct) / sectionTotal;
      const shareNormalization = sectionShareNormalizationReceipt(section, sectionTotal, sectionShare);
      const legs = legTotal > 0 ? activeLegs.map(leg => {
        const hw = cfEffectiveRow(leg);
        return { k: leg.donorKey, hw, wt: sectionPoint(leg.sharePct) / legTotal,
          cfLeg: cfLegChannel(leg, runtimeSection, s, hw), leg };
      }) : [];
      assertUniformProcurementBasis(legs, s, runtimeSection);
      return { section: runtimeSection, share: sectionShare, legs,
        ...(shareNormalization ? { shareNormalization } : {}) };
    });
    return assertSectionsTyped(resolved);
  }
  const w = blendWeights(s);
  const legs = Object.entries(w).map(([k, wt]) => ({ k, hw: HW[k], wt, cfLeg: null, leg: null }));
  const migration = { id: "s1", label: "(whole fleet)", sharePct: 100, basis: "inherit",
    rent: null, electricity: null, pue: null, tco: null, dcRef: null, provenance: null };
  const basis = effectiveSectionBasis(migration, s, legs.map(row => ({ donorKey: row.k })));
  const resolved = [{ section: { ...migration, basis }, share: 1, legs }];
  return assertSectionsTyped(resolved);
}
function resolveFleetLegs(s, renderOpts) {
  return resolveFleetSections(s, renderOpts).flatMap(({ section, share, legs }) =>
    legs.map(leg => ({ ...leg, wt: share * leg.wt, section })));
}
function mixProcurementBasis(composition) {
  const shares = new Map();
  for (const row of composition) shares.set(row.basis, (shares.get(row.basis) || 0) + row.share);
  const bases = [...shares.entries()].map(([basis, share]) => ({ basis, share }));
  return { procurementBasis: bases.length > 1 ? "mixed" : (bases[0] ? bases[0].basis : null), bases };
}
function composeSections(resolvedSections) {
  const composition = resolvedSections.map(({ section, share, legs, shareNormalization }) => {
    const owned = section.basis === "owned-strategic-tco";
    const electricityReceipts = [...new Set(legs.map(leg => leg.cfLeg
      && leg.cfLeg.electricitySource + ":" + leg.cfLeg.kwhPerKwh).filter(Boolean))];
    const electricitySources = [...new Set(legs.map(leg => leg.cfLeg && leg.cfLeg.electricitySource)
      .filter(Boolean))];
    const rentReceipts = legs.map(leg => leg.cfLeg && leg.cfLeg.rent).filter(Boolean);
    const rentReceipt = rentReceipts.length === 1 ? rentReceipts[0]
      : rentReceipts.length ? { value: null, source: "mixed",
          sections: rentReceipts.map(receipt => ({ ...receipt })) } : null;
    const carriesSectionReceipt = (Array.isArray(section.fallbackReceipts)
        && section.fallbackReceipts.length > 0)
      || !!section.shareRounding || !!shareNormalization
      || section.dcRef != null || section.provenance === "generic-fill";
    const fallbackReceipts = Array.isArray(section.fallbackReceipts)
      ? structuredClone(section.fallbackReceipts) : [];
    const receiptValue = value => value && typeof value === "object"
      ? Object.entries(value).map(([key, member]) => key + "=" + member).join(",") : String(value);
    const shareRounding = section.shareRounding ? structuredClone(section.shareRounding) : null;
    const receiptParts = [];
    if (fallbackReceipts.length) receiptParts.push("fallbacks: " + fallbackReceipts.map(receipt => receipt.field + "="
      + receiptValue(receipt.value) + " from " + receipt.source + " (" + receipt.reason + ")").join("; "));
    if (shareRounding) receiptParts.push("share rounding: " + shareRounding.changes.map(change => change.scope
      + " " + change.key + " " + change.declared + "→" + change.rounded).join(", ")
      + " (" + shareRounding.basis + ")");
    if (shareNormalization) receiptParts.push("share normalization: " + shareNormalization.sentence);
    const receiptSentence = receiptParts.length ? "section " + section.id + " " + receiptParts.join("; ")
      : "section " + section.id + " uses only declared section values";
    return { sectionId: section.id, share, basis: section.basis,
      costBasisUsed: owned ? "tco" : "rent",
      electricitySource: owned
        ? (electricityReceipts.length > 1 ? "mixed"
          : electricitySources.length === 1 ? electricitySources[0] : "scenario-default")
        : "embedded-in-rent",
      hourlyCostFrom: owned ? "tco" : "rent",
      ...(carriesSectionReceipt ? { dcRef: section.dcRef ?? null,
        fallbackReceipts, shareRounding,
        shareNormalization: shareNormalization ? structuredClone(shareNormalization) : null,
        receiptSentence } : {}),
      ...(rentReceipt ? { rent: rentReceipt } : {}) };
  });
  return { composition, ...mixProcurementBasis(composition) };
}
function blendedCosts(s, activeOverride, supplied, renderOpts) {
  const effectiveFleet = effectiveSectionFleet(s, renderOpts);
  const effectiveRenderOpts = effectiveFleet ? { ...(renderOpts || {}), customFleet: effectiveFleet } : renderOpts;
  const sections = resolveFleetSections(s, effectiveRenderOpts);
  const basisContract = composeSections(sections);
  const context = supplied || (s && typeof s === "object" ? SCENARIO_CONTEXT.get(s) : null);
  const coverage = effectiveFleet && context && context.modelId
    ? coverageForFleetSections(effectiveFleet.sections, context.modelId) : null;
  const legs = sections.flatMap(({ section, share, legs: sectionLegs }) => sectionLegs.map(({ k, hw, wt, cfLeg }) => {
    const combinedWeight = share * wt;
      const legOpts = cfLeg ? { ...(effectiveRenderOpts || {}), cfLeg } : effectiveRenderOpts;
    const cIn = costPerMtok(hw, s, "in", activeOverride, supplied, legOpts);
    const cOut = costPerMtok(hw, s, "out", activeOverride, supplied, legOpts);
    const rp = rooflinePoint(hw, s, activeOverride, supplied, legOpts); // solver-status channel
    return { k, wt: combinedWeight, sectionId: section.id, cIn, cOut, renderable: isFinite(cIn) && isFinite(cOut),
      renderableUnderPolicy: rp.solved ? rp.solved.renderableUnderPolicy === true : (isFinite(cIn) && isFinite(cOut)),
      placementVerified: rp.solved ? rp.solved.placementVerified === true : false,
      statusVector: rp.solved ? rp.solved.statusVector : null,
      capacityReceipt: rp.solved ? rp.solved.receipt : null,
      widthRendered: rp.widthRendered,
      reason: rp.point.reason || null, contextWindow: rp.point.contextWindow || null };
  }));
  const renderable = legs.filter(x => x.renderable);
  const renderableWeightShare = renderable.reduce((a, x) => a + x.wt, 0);
  /* SECTION SHARE: A RENDERED-IN-FULL SECTION RENDERS ITS OWN DECLARED SHARE (bq-2194).
     A float sum of normalized weights that ought to land exactly on the section's declared share
     lands a single unit in the last place above it — `share: 1, renderableShare:
     1.0000000000000002` on sonnet|median — so a field that is a PROPORTION is published above its
     own upper bound. This is the identity, not a clamp, and the difference matters: the value is
     replaced only when every leg in the section actually rendered AND the sum already agrees with
     the declared share to within a rounding artifact. A section that genuinely renders 0.52 of its
     weight still publishes 0.52, and a sum that is genuinely 1.02 still publishes 1.02 and still
     fails the connector schema's max(1), which is what that bound is for.
     The FLEET-level renderableWeightShare beside it is deliberately NOT snapped here: it is also
     the divisor of the blend renormalization two lines below, where the exact sum of the weights
     being renormalized is what makes the result a weighted average, and it is an input to
     byte-frozen historical receipt reproductions. Its published copy is corrected at the
     publication boundary instead (mcp-server/src/shape.ts, `publishedShare`); the engine-internal
     half stays open on bq-2194 with its blast radius measured rather than guessed. */
  const declaredShare = (rows, declared) => {
    /* Sum only the rows that RENDER — that is what this field measures — and replace the sum with
       the declared share only when every row in the section rendered. Summing all the rows and then
       testing whether they all rendered publishes a fully-renderable share for a section that
       renders none of its weight, which is worse than the ulp the fix exists for.
       HOW IT WAS ACTUALLY CAUGHT, corrected 2026-09-10 after the fallback review could not
       reproduce the credit this comment first gave (F11): NOT by tests/fleets.test.mjs. That suite
       asserts only on the FLEET-level renderableWeightShare and stays green under this bug, as does
       tests/snapshots.test.mjs — both re-executed to check. What tripped was snapshots.test.mjs's
       honest-null assertion during a THROWAWAY measurement patch that applied the same helper to
       the fleet field as well. Nothing in the suite covered the SECTION identity at all, in either
       direction, which is exactly why tests/share-bound-engine.test.mjs now does — it is the only
       thing that goes red on this bug today, verified by re-introducing it. */
    const sum = rows.filter(row => row.renderable).reduce((a, row) => a + row.wt, 0);
    const all = rows.length > 0 && rows.every(row => row.renderable);
    return all && Number.isFinite(sum) && Number.isFinite(declared) && Math.abs(sum - declared) <= 1e-9
      ? declared : sum;
  };
  const fleetRenderable = { renderableLegs: renderable.length, totalLegs: legs.length, renderableWeightShare,
    sections: sections.map(({ section, share }) => ({ id: section.id, basis: section.basis, share,
      renderableShare: declaredShare(legs.filter(row => row.sectionId === section.id), share) })),
    ...fleetStatusFields(legs) };
  if (!renderable.length || renderableWeightShare <= 0)
    return { cIn: NaN, cOut: NaN, fleetRenderable,
      ...(coverage ? { coverage } : {}), ...basisContract };
  return {
    cIn: renderable.reduce((a, x) => a + (x.wt / renderableWeightShare) * x.cIn, 0),
    cOut: renderable.reduce((a, x) => a + (x.wt / renderableWeightShare) * x.cOut, 0),
    fleetRenderable, ...(coverage ? { coverage } : {}), ...basisContract,
  };
}
/* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): paired
   procurement bases are derived through the existing workload path. Context is captured from the
   caller before cloning because WeakMap scenario identity does not survive structuredClone. */
function marginOnBasis(s, basis, renderOpts) {
  if (basis !== "rent" && basis !== "tco") throw new TypeError("marginOnBasis basis must be 'rent' or 'tco'");
  const supplied = scenarioContext(s);
  const clone = structuredClone(s);
  clone.hwMode = basis;
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-1): a counterpart is
     an all-section counterfactual, not a global-lens flip. Resolve first so
     migration-only `inherit` is gone, then retain each section's own receipt
     while replacing its procurement channel on an evaluation-only copy. */
  const counterpart = counterpartFleetOnBasis(s, basis, renderOpts);
  return workload(clone, undefined, supplied,
    counterpart ? { ...(renderOpts || {}), customFleet: counterpart } : renderOpts);
}
function counterpartFleetOnBasis(s, basis, renderOpts) {
  const fleet = renderOpts && renderOpts.customFleet;
  if (!fleet) return null;
  const resolved = resolveFleetSections(s, renderOpts);
  return { id: fleet.id, name: fleet.name, epoch: fleet.epoch, clonedFrom: fleet.clonedFrom,
    sections: resolved.map(({ section }) => {
      if (basis === "tco") return { ...structuredClone(section), basis: "owned-strategic-tco" };
      if (section.basis !== "owned-strategic-tco") return structuredClone(section);
      return { ...structuredClone(section), basis: "committed-planning-rent",
        rent: section.rent ? structuredClone(section.rent) : { mode: "registered", mult: 1 } };
    }) };
}
function lessorSpread(hwKey, s, cfLeg) {
  /* A public caller may pass the raw custom-fleet leg (the resolver's `leg`) or the flattened
     options channel used internally. The raw form must carry BOTH row overrides and channels. */
  const rawLeg = cfLeg && cfLeg.donorKey && cfLeg.overrides ? cfLeg : null;
  const hw = rawLeg ? cfEffectiveRow(rawLeg) : (hwKey === "rubin" ? RUBIN : HW[hwKey]);
  const channel = rawLeg ? cfLegChannel(rawLeg) : cfLeg;
  if (!hw) return { rentHr: NaN, tcoHr: NaN, ratio: NaN, impliedShare: NaN };
  const rentHr = hwHourCost(hw, { ...s, hwMode: "rent" }, channel);
  const tcoHr = hwHourCost(hw, { ...s, hwMode: "tco" }, channel);
  if (!isFinite(rentHr) || !isFinite(tcoHr) || rentHr === 0)
    return { rentHr: NaN, tcoHr: NaN, ratio: NaN, impliedShare: NaN };
  return { rentHr, tcoHr, ratio: rentHr / tcoHr, impliedShare: 1 - tcoHr / rentHr };
}
/* im-t5 MERGE (2026-08-29), third parameter only — grafted from the `minimal` candidate.
   `ratio` and `impliedShare` are derived ENTIRELY from the two hourly() blends below. The two
   marginOnBasis() calls exist solely to fill `rentCostPerMtok` / `tcoCostPerMtok`, and each is a
   structuredClone of the state plus a complete workload() evaluation — together 204 of the 319
   workload() evaluations one adjust_rental_rate invocation performs, for two fields that caller
   never reads (it projects `.impliedShare` and nothing else).
   `opts.shareOnly === true` returns early with the same four leading fields, computed by the
   SAME expressions copied verbatim from the return statement below — including the
   `isFinite(rentHr) && isFinite(tcoHr) && rentHr !== 0` guards, so the share-only path cannot
   diverge from the full path on a degenerate rent. Every existing caller passes no third
   argument, reaches the original return statement (unchanged byte for byte) and gets the
   identical six-field record — same keys, same insertion order, same own-property descriptors.
   A third argument was chosen over a separate exported function deliberately: this changes NO
   export surface, so the sealed export-contract pin in tests/capacity-solver-r1.test.mjs is
   untouched, which is the point of that pin. The observable consequence is named honestly in the
   deploy note: a caller who passes an options bag carrying a truthy `shareOnly` now receives four
   keys where it previously received six. No such caller exists — before this change a third
   argument was inert — but it is an API EXTENSION, not a no-op.
   A lazy getter for the two cost fields was considered and rejected: it would defer marginOnBasis
   past the point where a caller may have mutated `s`, and it would turn two data properties into
   accessors, both of which are observable. */
function blendedLessorSpread(s, renderOpts, opts) {
  const supplied = scenarioContext(s);
  const effectiveFleet = effectiveSectionFleet(s, renderOpts);
  const effectiveRenderOpts = effectiveFleet
    ? { ...(renderOpts || {}), customFleet: effectiveFleet } : renderOpts;
  const hourly = basis => {
    const counterpart = counterpartFleetOnBasis(s, basis, effectiveRenderOpts);
    const basisOpts = counterpart
      ? { ...(effectiveRenderOpts || {}), customFleet: counterpart } : effectiveRenderOpts;
    const basisState = { ...s, hwMode: basis };
    const legs = resolveFleetLegs(basisState, basisOpts).map(({ hw, wt, cfLeg }) => {
      const legOpts = cfLeg ? { ...(basisOpts || {}), cfLeg } : basisOpts;
      const hr = hwHourCost(hw, basisState, cfLeg);
      const renderable = [
        costPerMtok(hw, basisState, "in", undefined, supplied, legOpts),
        costPerMtok(hw, basisState, "out", undefined, supplied, legOpts),
      ].every(isFinite);
      return { wt, hr, priced: renderable && isFinite(hr) };
    });
    const priced = legs.filter(x => x.priced);
    const total = priced.reduce((sum, row) => sum + row.wt, 0);
    return total > 0 ? priced.reduce((sum, row) => sum + row.hr * row.wt / total, 0) : NaN;
  };
  const rentHr = hourly("rent"), tcoHr = hourly("tco");
  if (opts && opts.shareOnly === true) return {
    rentHr, tcoHr,
    ratio: isFinite(rentHr) && isFinite(tcoHr) && rentHr !== 0 ? rentHr / tcoHr : NaN,
    impliedShare: isFinite(rentHr) && isFinite(tcoHr) && rentHr !== 0 ? 1 - tcoHr / rentHr : NaN,
  };
  const rent = marginOnBasis(s, "rent", effectiveRenderOpts);
  const tco = marginOnBasis(s, "tco", effectiveRenderOpts);
  return {
    rentHr, tcoHr,
    ratio: isFinite(rentHr) && isFinite(tcoHr) && rentHr !== 0 ? rentHr / tcoHr : NaN,
    impliedShare: isFinite(rentHr) && isFinite(tcoHr) && rentHr !== 0 ? 1 - tcoHr / rentHr : NaN,
    rentCostPerMtok: rent.costMix,
    tcoCostPerMtok: tco.costMix,
  };
}
/* im-arc T1 fix (Sol review 2026-08-22, finding P1-1): the chart and its accessible
   table share one pure numeric row model. The signed rent-minus-TCO column is never
   clamped, so four TCO components + that column add back to the rent-basis total. */
function stackRowsFor(s, showRent, supplied, renderOpts) {
  const context = supplied || scenarioContext(s);
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-1): the per-accelerator
     counterfactual keeps the active section mix and its receipts. Each row swaps
     only the accelerator donor, then runs through the same all-section repricer
     as the paired card and lessor-spread readout. */
  if (renderOpts && renderOpts.customFleet) return HW_ORDER.map(k => {
    const source = renderOpts.customFleet;
    const sections = customFleetSections(source).map(section => {
      const matching = (section.legs || []).find(leg => leg.donorKey === k);
      return { ...structuredClone(section), legs: [{ donorKey: k, label: HW[k].name,
        sharePct: 100, overrides: matching ? structuredClone(matching.overrides || {}) : {},
        family: matching ? matching.family : HW[k].family }] };
    });
    const fleet = { id: source.id, name: source.name, epoch: source.epoch,
      clonedFrom: source.clonedFrom, sections };
    const rowOpts = { ...renderOpts, customFleet: fleet };
    const tcoState = structuredClone(s); tcoState.hwMode = "tco";
    const tcoFleet = counterpartFleetOnBasis(tcoState, "tco", rowOpts);
    const tcoOpts = { ...rowOpts, customFleet: tcoFleet };
    const resolved = resolveFleetSections(tcoState, tcoOpts);
    const hourlyParts = { capex: 0, power: 0, dc: 0, opex: 0 };
    let totalHr = 0;
    for (const { share, legs } of resolved) for (const { hw, wt, cfLeg } of legs) {
      const parts = hwHourParts(hw, tcoState, cfLeg);
      const combined = share * wt;
      for (const key of Object.keys(hourlyParts)) hourlyParts[key] += combined * parts[key];
      totalHr += combined * (parts.capex + parts.power + parts.dc + parts.opex);
    }
    const tcoWorkload = marginOnBasis(s, "tco", rowOpts);
    const scale = isFinite(totalHr) && totalHr !== 0 ? tcoWorkload.costMix / totalHr : NaN;
    const tcoComponents = Object.fromEntries(
      Object.keys(hourlyParts).map(key => [key, hourlyParts[key] * scale]),
    );
    let total = tcoWorkload.costMix, rentWorkload = null, rentMinusTco = 0;
    if (showRent) {
      rentWorkload = marginOnBasis(s, "rent", rowOpts);
      rentMinusTco = rentWorkload.costMix - tcoWorkload.costMix;
      total = rentWorkload.costMix;
    }
    const spread = showRent ? blendedLessorSpread(s, rowOpts) : null;
    const rentReceipts = showRent && rentWorkload
      ? (rentWorkload.composition || []).map(row => row.rent).filter(Boolean) : [];
    const rentReceipt = rentReceipts.length === 1 ? rentReceipts[0]
      : rentReceipts.length ? { value: null, source: "mixed", sections: rentReceipts } : null;
    const unavailableRent = rentReceipts.find(receipt => receipt.unavailable);
    if (showRent && unavailableRent) {
      const cleanTcoComponents = Object.fromEntries(Object.entries(tcoComponents)
        .map(([key, value]) => [key, isFinite(value) ? value : null]));
      return { k, name: HW[k].name, tcoComponents: cleanTcoComponents,
        rentMinusTco: null, total: null, rentBelowTco: false,
        renderable: false, reason: unavailableRent.reason,
        result: null, rentResult: null,
        tcoResult: isFinite(tcoWorkload.costMix) ? tcoWorkload : null,
        rentHr: null, tcoHr: spread && isFinite(spread.tcoHr) ? spread.tcoHr : null,
        rent: rentReceipt };
    }
    return { k, name: HW[k].name, tcoComponents, rentMinusTco, total,
      rentBelowTco: showRent && rentMinusTco < 0,
      renderable: isFinite(tcoWorkload.costMix) && (!showRent || isFinite(rentWorkload.costMix)),
      result: showRent ? rentWorkload : tcoWorkload,
      /* im-arc T2 fix (Sol review 2026-08-23, finding P1-1): the adjacent
         rent/TCO tables consume these same recomposed row receipts. */
      rentResult: rentWorkload, tcoResult: tcoWorkload,
      rentHr: spread && spread.rentHr, tcoHr: spread && spread.tcoHr,
      ...(rentReceipt ? { rent: rentReceipt } : {}) };
  });
  const tcoState = structuredClone(s); tcoState.hwMode = "tco";
  return HW_ORDER.map(k => {
    const hw = HW[k];
    const parts = hwHourParts(hw, tcoState);
    const totalHr = parts.capex + parts.power + parts.dc + parts.opex;
    const one = structuredClone(tcoState); one.blend = { [k]: 100 };
    const tcoWorkload = workload(one, undefined, context);
    const scale = tcoWorkload.costMix / totalHr;
    const tcoComponents = Object.fromEntries(
      ["capex", "power", "dc", "opex"].map(key => [key, parts[key] * scale]),
    );
    let total = tcoWorkload.costMix;
    let rentWorkload = null;
    let rentMinusTco = 0;
    if (showRent) {
      const rentOne = structuredClone(s); rentOne.hwMode = "rent"; rentOne.blend = { [k]: 100 };
      rentWorkload = workload(rentOne, undefined, context);
      const spread = lessorSpread(k, s);
      rentMinusTco = (spread.rentHr - spread.tcoHr) * scale;
      total = rentWorkload.costMix;
    }
    return {
      k, name: hw.name, tcoComponents, rentMinusTco, total,
      rentBelowTco: showRent && rentMinusTco < 0,
      renderable: isFinite(tcoWorkload.costMix) && (!showRent || isFinite(rentWorkload.costMix)),
      result: showRent ? rentWorkload : tcoWorkload,
      rentResult: rentWorkload, tcoResult: tcoWorkload,
      rentHr: showRent ? lessorSpread(k, s).rentHr : null,
      tcoHr: showRent ? lessorSpread(k, s).tcoHr : totalHr,
    };
  });
}
/* ================= b9 M3 — energy surface + procurement-basis machinery (memo §§2-3) =========== */
/* Effective basis of one computed mix's leg: owned/strategic TCO whenever the scenario costs
   from the TCO build-up, else the ROW basis of the rent number the leg consumes. */
function legProcurementBasis(hwKey, s, section) {
  /* im-arc T2 (memo research/im-arc-t2-sections-memo.md §1.3): section basis is
     the computation contract. `inherit` is accepted only while migrating a legacy
     one-section fleet; an explicit registered-rate section still resolves through
     the hardware row because the registered rate carries that row's rent class. */
  if (section && section.basis && section.basis !== "inherit") {
    if (section.basis === "owned-strategic-tco") return section.basis;
    if (!section.rent || section.rent.mode !== "registered") return section.basis;
  }
  if ((!section || section.basis === "inherit") && s.hwMode === "tco")
    return "owned-strategic-tco";
  const row = engineData().HW_ROOFLINE[hwKey];
  return (row && row.rentBasis) || null;
}
/* Fail-closed mixing trap (memo §3.2; plan D-3 "mixing bases inside one lens is a suite-enforced
   error"): structurally unreachable while hwMode is global and the row vector uniform — it is
   load-bearing for M4's per-leg overrides, and fails closed on an unknown or missing basis. */
function assertUniformProcurementBasis(legs, s, section) {
  if (section && section.basis !== "inherit") {
    const contradiction = legs.find(l => l.leg && l.leg.basisDeclared
      && l.leg.basisDeclared !== "inherit" && l.leg.basisDeclared !== section.basis);
    if (contradiction)
      throw new Error("leg " + (contradiction.k ?? contradiction.hwKey ?? "(unknown)")
        + " basis " + contradiction.leg.basisDeclared + " contradicts section " + section.id
        + " basis " + section.basis + " — fail closed");
  }
  const bases = [...new Set(legs.map(l => legProcurementBasis(l.k ?? l.hwKey, s, section)))];
  if (bases.length > 1)
    throw new Error("procurement-basis mixing inside one computed mix: " + bases.join(" vs "));
  if (bases.length === 1 && !PROCUREMENT_BASES.includes(bases[0]))
    throw new Error("unknown procurement basis '" + bases[0] + "' on a computed mix — fail closed");
  return bases[0] || null;
}
/* LENS-basis resolution (memo §3.2 classification table): perspectives declare their basis;
   the generic §10-dive replay carries the sentinel "model-dive" and resolves through this
   registry; models without a §10 card fall back to the central scenario (the perspective's
   own documented fallback), whose basis is committed-planning-rent.
   Kept OUTSIDE the model dive objects deliberately: applyPresetSettings copies every m.dive
   key into scenario state verbatim, and a basis label must never become a scenario-state key
   (codec/bounds/dossier purity) — same typed content, side-registry container. */
const DIVE_PROCUREMENT_BASES = Object.freeze({
  gpt: "committed-planning-rent",     // blended contract rates across Microsoft/OCI/CoreWeave (0.85x)
  gemini: "owned-strategic-tco",      // derived INTERNAL cost ~$1.28/Ironwood-hr — owned/strategic in meaning, expressed as a rent scalar, not the engine's capex build-up
  grok: "owned-strategic-tco",        // full-cycle TCO lens on the owned Colossus fleet (0.62x) — same rent-scalar mechanism note
  kimi: "committed-planning-rent",    // production lease-class frame (1.0x)
  dsr1: "committed-planning-rent",    // the disclosure's ~$2/hr H800 leasing frame (1.14x)
  dsv4: "committed-planning-rent",    // ~$1.50/H800-equivalent-hr internal-EFFECTIVE rate on a leased fleet, not an ownership build-up
  glm: "committed-planning-rent",     // domestic committed/IDC-class rates (1.9x)
});
function procurementBasisFor(persp, model) {
  if (!persp) return null;
  if (persp.procurementBasis === "model-dive")
    return (model && DIVE_PROCUREMENT_BASES[model.id]) || "committed-planning-rent";
  return persp.procurementBasis || null;
}
/* M3 gate P1 fix: the basis a SURFACE should display. The LENS declaration wins; the mix's
   effective row basis is only the fallback for states with no lens declaration in play
   (modified/custom). `declaredDivergesFromMechanism` marks lenses whose declared basis is not
   the mechanism they compute through (chinacloud approximates public-capacity via a multiplier
   on the committed vector; the xaicash/gemini/grok owned-strategic replays are expressed as
   rent scalars) — the display layer words those honestly instead of mislabeling them. */
function displayedProcurementBasis(persp, model, effectiveBasis) {
  /* im-arc T2 (memo research/im-arc-t2-sections-memo.md §2.5): a mixed section
     composition is itself the effective basis. A lens declaration cannot flatten it
     back into one label; that would reproduce the hidden-fallback failure this tranche
     exists to remove. Scalar callers retain the historical lens-first contract. */
  if (effectiveBasis && typeof effectiveBasis === "object"
      && effectiveBasis.procurementBasis === "mixed") {
    const composition = Array.isArray(effectiveBasis.composition) ? effectiveBasis.composition : [];
    return { basis: "mixed", name: composition.map(row => Math.round(row.share * 100) + "% "
        + (PROCUREMENT_BASIS_NAMES[row.basis] || row.basis)).join(" + ") || "mixed section bases",
      composition, declaredDivergesFromMechanism: false };
  }
  const effective = effectiveBasis && typeof effectiveBasis === "object"
    ? effectiveBasis.procurementBasis : effectiveBasis;
  const declared = procurementBasisFor(persp, model);
  const basis = declared || effective || null;
  return { basis, name: PROCUREMENT_BASIS_NAMES[basis] || "rent",
    declaredDivergesFromMechanism: !!(declared && effective && declared !== effective) };
}
/* Physical serving-energy intensity, Wh per M tokens, at the achieved operating point
   (memo §2.1). Deliberately NO utilization divisor: the TCO dollar path allocates paid idle
   to served tokens, while this figure deliberately does not. Idle boards DO draw power; this
   page does not model that draw, so the Wh figure is an operating-point intensity and not a
   fleet-average one, and charging full-power idle hours as ENERGY would overstate it. The methods box states the divergence. Inherits the
   cost engine's exact operating point through the same tokPerS resolution (feasibility,
   declared batch, capping); an infeasible leg yields NaN, fail-closed like cost. */
function energyPerMtok(hw, s, kind, activeOverride, supplied, renderOpts) {
  const pue = renderOpts && renderOpts.cfLeg && renderOpts.cfLeg.pue != null
    ? renderOpts.cfLeg.pue : s.pue;
  return opPowerKw(hw, renderOpts && renderOpts.cfLeg) * 1000 * pue / pricedTokPerS(hw, s, kind, activeOverride, supplied, renderOpts) * 1e6 / 3600;
}
/* Traffic-mix identity for energy — mirrors computeMix's cost identity with the SAME analyst-set
   cacheCost fraction doing proxy duty for cache-read energy (bandwidth-dominated, near-zero
   compute; one more disclosed role of an already-disclosed constant — memo §7 decision 2). */
function energyMix(eIn, eOut, s) {
  const R = s.ioRatio, h = s.cacheHit / 100;
  const eCache = eIn * (s.cacheCost / 100);
  return { eIn, eOut, eCache, eMix: (eOut + R * ((1 - h) * eIn + h * eCache)) / (R + 1) };
}
/* Per-leg + blended energy for the current blend. Shares blendWeights, weight renormalization
   and the mix identity with blendedCosts/computeMix. Energy renders wherever THROUGHPUT
   renders — an unpriced-but-feasible leg would carry energy without dollars (energy is
   physical); today every HW_ORDER row is priced, so the renderable sets coincide (memo §2.1). */
function fleetEnergy(s, activeOverride, supplied, renderOpts) {
  /* b9 M4: the SAME leg resolver as blendedCosts — the energy surface and the cost mix
     may never disagree about what the fleet IS (memo §3.8; per-leg power/electricity
     overrides ride the same cfLeg channel). */
  const sections = resolveFleetSections(s, renderOpts);
  const basisReceipt = composeSections(sections);
  const legs = sections.flatMap(({ section, share, legs: sectionLegs }) => sectionLegs.map(({ k, hw, wt, cfLeg }) => {
    const legOpts = cfLeg ? { ...(renderOpts || {}), cfLeg } : renderOpts;
    const eIn = energyPerMtok(hw, s, "in", activeOverride, supplied, legOpts);
    const eOut = energyPerMtok(hw, s, "out", activeOverride, supplied, legOpts);
    return { k, wt: share * wt, sectionId: section.id, ...energyMix(eIn, eOut, s),
      renderable: isFinite(eIn) && isFinite(eOut), procurementBasis: section.basis };
  }));
  const { procurementBasis, bases, composition } = basisReceipt;
  const renderable = legs.filter(x => x.renderable);
  const share = renderable.reduce((a, x) => a + x.wt, 0);
  if (!renderable.length || share <= 0)
    return { legs, blended: { eIn: NaN, eOut: NaN, eCache: NaN, eMix: NaN },
      procurementBasis, bases, composition };
  const blend = kind => renderable.reduce((a, x) => a + (x.wt / share) * x[kind], 0);
  return { legs, blended: energyMix(blend("eIn"), blend("eOut"), s),
    procurementBasis, bases, composition };
}
/* IM3 exit-gate fix 1 (unanimous, empiricist enumeration) + fix 3 (risk-analyst correlation
   caveat) + fix 2-verification-round-2 (non-monotonicity disclosure) + fix
   B1-final-reverify-2026-07-20 (decoupled from primary): every emitter of a numeric result whose
   fleet was renormalized (renderableWeightShare < 1) must show BOTH the leg count and the
   declared-weight percentage — engine already carries the value; this is presentation-only,
   shared by app.js and the MCP server (mcp-server's `E` is this exact module) so the two never
   drift apart.
   The non-monotonicity disclosure (crossing a feasibility boundary changes which hardware the
   number describes, so the estimand can shift discontinuously — making a model harder to serve
   can raise the displayed margin when an expensive leg leaves the denominator) is a STRUCTURAL
   property of renormalization for ANY blend, not a
   flagship-only fact — the final re-verification upheld the wrapper's own suspicion that gating
   it behind `primary=true` left the most-visible number (the generic hero chip, dynamic route
   cards) silent. It is now UNCONDITIONAL whenever the fleet is renormalized, regardless of
   `primary`.
   `primary=true` still adds ONLY the fix-3 Hopper-family correlation caveat on top — that one
   remains legitimately flagship-specific (verified 2026-07-20 that the renderable subset is
   H100+H200 across every currently-defined flagship-scope perspective; a validated fact about the
   CURRENT registry, not a structural guarantee — revisit if the default blend or a route's regime
   ever changes which legs survive renormalization). Generic/dynamic emitters (the hero chip, which
   can describe any model/blend the user selects) pass primary=false — hardcoding "Hopper-family"
   there would be false for a non-default scenario; they still get the non-monotonicity clause. */
/* R3 (design memo D-3c): the ONE membership-exclusion formatter — consumed by the
   shared clause below AND the hero note (one formatter, every transport; sibling
   receipts never satisfy the weld). The canonical-anchor identity is load-bearing:
   renderableUnderPolicy is traffic-dependent (KV term) and a CLEAN default can exist
   at custom traffic, so an unanchored present-tense "cannot serve" would be false
   there (R3-review P1-1). */
/* The one reader of the exclusion ground; absence means capacity (see deriveDefaultFleetMembership). */
function exclusionGround(x) { return x && x.ground === "withdrawn" ? "withdrawn" : "capacity"; }
function membershipExclusionClause(membership) {
  if (!membership || !membership.excluded || !membership.excluded.length) return "";
  const anchor = "derived at the native " + membership.derivedAt.trafficProfileId
    + " traffic anchor, " + membership.derivedAt.ioRatio + ":1/" + membership.derivedAt.cacheHit + "%";
  /* im-vet-six-repairs (2026-09-20): a WITHDRAWN leg is not an anchor-dependent capacity
     result, so it does not get the anchor parenthetical or the "does not re-derive under
     the selected traffic" tail — both would be false of it. What it does get, and what a
     capacity exclusion also gets, is the renormalization stated out loud. */
  return "default membership: " + membership.memberLegCount + " of "
    + membership.declaredLegCount + " declared legs — "
    + membership.excluded.map(x => {
      const name = HW[x.hwKey] ? HW[x.hwKey].name : x.hwKey;
      const renorm = "declared " + x.declaredWeight + "% renormalized over the remaining "
        + membership.memberLegCount;
      if (exclusionGround(x) === "withdrawn")
        return name + " withdrawn from the default on evidence grounds: " + x.reason
          + "; the row, its rent and its scenarios are kept and selectable — " + renorm;
      return name + " excluded from the default (" + anchor + "): " + x.reason
        + "; the default's membership does not re-derive under the currently selected traffic — "
        + renorm;
    }).join("; ") + ".";
}
function fleetRenderableClause(fleetRenderable, primary, membership) {
  const f = fleetRenderable;
  if (!f) return "";
  /* The pre-R3 "all N of N declared fleet legs" form is reachable ONLY when nothing
     was excluded (declared == member set) — the P0-3 lie is structurally dead. */
  const excludedHere = membership && membership.excluded && membership.excluded.length > 0;
  const head = excludedHere ? membershipExclusionClause(membership) + " " : "";
  const noun = excludedHere ? "default member legs" : "declared fleet legs";
  // D-6(c): the non-monotonicity disclosure rides EVERY renormalized-membership
  // emission — the filtered default is one (its weights renormalize over members).
  const membNonMonotonic = " — crossing a feasibility boundary changes the default's membership, so the estimand can shift discontinuously: the displayed value is not monotonic under parameter perturbation (a harder-to-serve model can show a HIGHER margin by dropping expensive legs)";
  if (f.renderableLegs === 0) {
    const contextFailure = (f.legStatuses || []).find(l =>
      l.contextWindow && l.contextWindow.state === "exceeded-registered-limit");
    return head + (contextFailure && contextFailure.note
      ? contextFailure.note
      : "declared fleet infeasible at declared serving topology — no numeric result");
  }
  if (f.renderableLegs >= f.totalLegs)
    return head + "all " + f.renderableLegs + " of " + f.totalLegs + " " + noun + " renderable at declared serving topology" + (excludedHere ? membNonMonotonic : "");
  const pct = Math.round(f.renderableWeightShare * 100);
  const correlation = primary
    ? " — the surviving subset may share correlated errors; renormalization is not independent evidence."
    : ".";
  const nonMonotonic = " Crossing a feasibility boundary changes which hardware the number describes, so the estimand can shift discontinuously: the displayed value is not monotonic under parameter perturbation (a harder-to-serve model can show a HIGHER margin by dropping expensive legs)";
  return head + "blend renormalized: " + f.renderableLegs + " of " + f.totalLegs + " legs, " + pct + "% of " + (excludedHere ? "default member weight" : "declared fleet weight") + correlation + nonMonotonic;
}
/* R2 (memo §0 P1-7): the legacy replica-width sensitivity machinery
   (replicaWidthSensitivity + its clause + the feasibilityAtNShard/workloadAtNShard
   case channel + the B′ §1 width-case default-selection contract) is RETIRED — the
   render path consumes the capacity solver's declared-operating-point widths, and the
   width story is told by the solver receipts + the shared policy clause
   (policyCapacityClause below). The topologySensitivity registry rows survive in
   engine-data-v22.js as typed evidence annotations (provenance), never as live width
   inputs. */
/* ---------- IM4 slice B: fleet evidence profiles + gate-6/7 decisions ----------
   Design memo research/im4-fleet-design-memo.md §2.1-§2.3 (v3.1) + §7 owner ruling.
   Architecture (slice-B review P1-6): renderability COMPUTATION (feasibility-coupled)
   is separated from the PURE DECISION predicates, which accept only the closed
   evidence-profile DTO — economic fields cannot reach a decision even transitively.
   Cluster-support policy (P1-3, predeclared): a cluster counts toward the gate-7 bar
   only when its renderable legs' DECLARED weights sum to >= MIN_CLUSTER_SUPPORT_SHARE
   of total declared fleet weight. Capped legs render numbers, so they DO support
   clusters (explicit policy); infeasible legs never do. */
const MIN_CLUSTER_SUPPORT_SHARE = 0.10; // predeclared gate-7 policy floor (slice-B review P1-3)

function validateFleetShape(fleetId, fleet) {
  const weights = Object.values(fleet.legs);
  if (!weights.length || !weights.every(w => typeof w === "number" && isFinite(w) && w > 0))
    throw new Error("FLEETS." + fleetId + ": every declared leg weight must be a finite positive number");
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum !== 100) throw new Error("FLEETS." + fleetId + ": declared weights must sum to exactly 100 (got " + sum + ")");
}

// Per-fleet typed evidence profile. `s` (scenario state) is required for renderability
// aggregates; pass the evidenced-baseline state for gate-7 evaluation. Fleets are
// model-scoped (P1-4): calling for a fleet not defined for the state's model returns null.
function fleetEvidenceProfile(fleetId, s, supplied) {
  /* b9 M4 (memo §3.6): user-custom fleets get a TYPED profile with NO evidence-share
     or cluster claims — those quantities describe SOURCED constructions; claiming them
     for user input would be fabrication. Evidence fields are present-but-null with the
     reason stated, so no disclosure renderer can ever invent a number for them. Never
     central-eligible, never a default (class contract, §3.4). */
  if (isCustomFleetId(fleetId)) {
    const def = customFleetSource().resolve(fleetId);
    if (!def) return null;
    return {
      class: "user-custom", userCustom: true,
      attribution: "User composition — nothing here is sourced; each leg carries its donor calibration identity (the performance identity is the donor's, an analyst transfer).",
      representativeness: "user-composition",
      evidencedWeightShare: null, independentEvidenceClusters: null,
      renderableIndependentEvidenceClusters: null,
      evidenceFieldsNull: "user composition — evidence-share and cluster quantities describe sourced constructions only",
      legs: customFleetFlatDefinition(def).map(l => ({ donorKey: l.donorKey, label: l.label,
        sharePct: l.sharePct, sectionId: l.sectionId, sectionBasis: l.sectionBasis,
        overridden: Object.keys(l.overrides || {}), family: l.family })),
    };
  }
  const fleet = ED_FLEET.FLEETS[fleetId];
  if (!fleet) return null;
  validateFleetShape(fleetId, fleet);
  if (s) {
    const ctxModel = (supplied || scenarioContext(s)).modelId;
    if (!fleet.models.includes(ctxModel)) return null; // fail-closed: no profile outside the fleet's model scope
  }
  const legs = Object.entries(fleet.legs).map(([hw, declaredWeight]) => {
    const cal = ED_FLEET.CALIBRATION[hw] || {};
    return {
      hw, declaredWeight,
      throughputEvidenceClass: cal.throughputEvidenceClass || null,
      clusterId: cal.clusterId || null,
      priceClass: ED_FLEET.PRICE_EVIDENCE[hw] || null,
      evidenced: cal.throughputEvidenceClass === "fitted" && ED_FLEET.PRICE_EVIDENCE[hw] === "observed-source-named",
    };
  });
  const totalW = legs.reduce((a, l) => a + l.declaredWeight, 0);
  const evidencedWeightShare = legs.filter(l => l.evidenced).reduce((a, l) => a + l.declaredWeight, 0) / totalW;
  const clusterSupport = (legList) => { // declared-weight support per cluster among the given legs
    const byCluster = {};
    for (const l of legList) if (l.clusterId) byCluster[l.clusterId] = (byCluster[l.clusterId] || 0) + l.declaredWeight / totalW;
    return byCluster;
  };
  const supportedCount = (byCluster) =>
    Object.values(byCluster).filter(share => share >= MIN_CLUSTER_SUPPORT_SHARE).length;
  const independentEvidenceClusters = supportedCount(clusterSupport(legs));
  const containsChineseSilicon = legs.some(l => ED_FLEET.CHINESE_SILICON.includes(l.hw));
  let renderableWeightShare = null, renderableIndependentEvidenceClusters = null,
      allLegsRenderableUnderPolicy = null, placementVerified = null;
  if (s) {
    const ctx = supplied || scenarioContext(s); // context from the ORIGINAL state (clone loses registration)
    const st = Object.assign(structuredClone(s), { blend: Object.fromEntries(HW_ORDER.map(k => [k, fleet.legs[k] || 0])) });
    const feas = feasibility(st, ctx);
    // R2 two-boolean contract (memo §0-bis NEW-P0): renderability is
    // renderable-UNDER-POLICY (weight-capacity + declared operating point under the
    // named loaded-bytes policy); placement is the SEPARATE boolean, aggregated
    // FAIL-CLOSED (one policy-path leg poisons the fleet to policy status, §0-ter).
    const renderableKeys = new Set(feas.legs.filter(l => l.renderableUnderPolicy === true).map(l => l.hwKey));
    const renderableLegs = legs.filter(l => renderableKeys.has(l.hw));
    renderableWeightShare = renderableLegs.reduce((a, l) => a + l.declaredWeight, 0) / totalW;
    allLegsRenderableUnderPolicy = renderableLegs.length === legs.length; // boolean, not float equality (P1-5)
    placementVerified = legs.length > 0 && legs.every(l =>
      feas.legs.some(fl => fl.hwKey === l.hw && fl.placementVerified === true));
    renderableIndependentEvidenceClusters = supportedCount(clusterSupport(renderableLegs));
  }
  /* R3 (design memo D-5): the DERIVED (filtered) view — same field names the pure
     gate decisions read, computed over the derivation's MEMBERS with the RENORMALIZED
     denominator (the slice-B clusterSupport amendment: support = declared weight /
     member total, the honest default's own weights). One function, two labeled views;
     the predicate itself never branches. */
  let derivedView = null;
  if (s) {
    const derivation = deriveDefaultFleetMembership(fleetId, s, supplied || scenarioContext(s));
    if (derivation) {
      const memberKeys = new Set(derivation.members.map(l => l.hwKey));
      const memberLegs = legs.filter(l => memberKeys.has(l.hw));
      const byCluster = {};
      for (const l of memberLegs) if (l.clusterId && derivation.renormalizationBasis > 0)
        byCluster[l.clusterId] = (byCluster[l.clusterId] || 0) + l.declaredWeight / derivation.renormalizationBasis;
      derivedView = {
        id: fleetId, view: "derived", class: fleet.class, containsChineseSilicon,
        derivation,
        allLegsRenderableUnderPolicy: derivation.memberLegCount > 0, // members are RUP by construction; empty membership fails closed
        placementVerified: derivation.memberLegCount > 0
          && derivation.members.every(l => l.placementVerified === true),
        renderableIndependentEvidenceClusters:
          Object.values(byCluster).filter(share => share >= MIN_CLUSTER_SUPPORT_SHARE).length,
      };
    }
  }
  return {
    id: fleetId, name: fleet.name, class: fleet.class, models: fleet.models,
    attribution: fleet.attribution, representativeness: fleet.representativeness,
    legs, evidencedWeightShare, independentEvidenceClusters, containsChineseSilicon,
    renderableWeightShare, allLegsRenderableUnderPolicy, placementVerified,
    renderableIndependentEvidenceClusters, derivedView,
  };
}

/* PURE gate decisions over the closed profile DTO (no scenario, no engine access). */
// Gate-7: may this fleet carry a central/default numeric label at the evaluated scenario?
function centralEligibilityDecision(profile) {
  return !!profile
    && profile.class !== "counterfactual" && !profile.containsChineseSilicon // owner ruling: categorical
    && profile.allLegsRenderableUnderPolicy === true                         // 100% by leg count (P1-5)
    && profile.placementVerified === true // R2 (memo §0-bis): ANY central label requires placement — closed models stay central-ineligible on policy alone
    && profile.renderableIndependentEvidenceClusters >= 2;                    // weight-supported clusters (P1-3)
}
// Gate-6, R3 form (design memo D-3a — SUPERSEDES the R2/§0-bis IFF for the landing
// default, per the owner's Row-0 ruling): the landing default IS the FILTERED
// membership, so the pure decision consumes the DERIVATION (D-1 DTO, margin-blind),
// mode-aware:
//   "policy-labeled" (shipped default): suppress IFF the derived membership is EMPTY
//     (honest-null semantics survive; an exclusion alone no longer suppresses — it
//     DISCLOSES, welded, per D-3c).
//   "suppress" (the strict tested branch, D-4): suppress IFF the derivation EXCLUDED
//     any declared leg (Option A's conservatism carried into the filtered world).
// null derivation (wrong model scope) => suppressed, fail-closed.
function heroSuppressionDecision(derivation, mode) {
  if (!derivation) return true;
  if (mode === "suppress") return derivation.excluded.length > 0;
  return derivation.memberLegCount === 0;
}

// Gate-7 evaluation + owner-adjudicated landing selection. The landing id is the BANKED
// constant (owner-answers.jsonl im-fable-b-2026-07-21-fleet-landing-default-v2), never a
// derivation; for models outside every fleet's scope the landing is null (fail-closed,
// P1-4) and the model keeps its preset blend.
function selectDefaultFleet(s, supplied) {
  const ctxModel = s ? (supplied || scenarioContext(s)).modelId : null;
  const profiles = Object.keys(ED_FLEET.FLEETS)
    .map(id => fleetEvidenceProfile(id, s, supplied))
    .filter(Boolean);
  const landingDefined = !!s && profiles.some(p => p.id === ED_FLEET.DEFAULT_FLEET_ID);
  return {
    landing: landingDefined ? ED_FLEET.DEFAULT_FLEET_ID : null,
    modelId: ctxModel,
    // R3 (design memo D-5 view table): gate-7 evaluates the LANDING fleet on its
    // DERIVED (filtered) view; every other registry fleet keeps the declared view
    // (their point IS the declared construction; counterfactuals are categorically
    // central-barred anyway). The derived view is shaped exactly like the profile
    // fields the pure decision reads, so the predicate itself never branches.
    centralEligible: profiles.filter(p =>
      centralEligibilityDecision(p.id === ED_FLEET.DEFAULT_FLEET_ID && p.derivedView ? p.derivedView : p)
    ).map(p => p.id).sort(),
    profiles,
  };
}

/* ---------- R3 Row 0 (design memo im4-r3-design-memo v5, D-1/D-2): the ONE default-
   membership derivation. Filters the DECLARED fleet legs on renderableUnderPolicy at
   the model's CANONICAL native-traffic anchor. FAIL-CLOSED: any non-affirmative
   renderableUnderPolicy (false, null, missing solve, no registered domain) EXCLUDES
   the leg; capped and honest-null legs are excluded IDENTICALLY (owner ruling,
   BACKLOG Row 0 — "capped or infeasible"). Traffic is pinned OUT of the relativity
   set by the anchor (D-1): renderableUnderPolicy is traffic-dependent through the KV
   term (h100@5T is live-servable at 5:1/20% but not at the Reference anchor), so the
   derivation pins BOTH the evaluation state's ioRatio/cacheHit AND the solve
   context's profileId to the native profile — membership is ONE thing per (model,
   total, precision, policy), never a function of the user's current traffic.
   PURE, re-derived on demand (assembly ruling RA-2: never cached on state — clones
   lose WeakMap registration in this codebase). Excluded legs are IN the output at
   weight 0: the exclusion is DATA, consumed by the shared clause (D-3c) and every
   receipt. */
function deriveDefaultFleetMembership(fleetId, s, supplied) {
  const fleet = ED_FLEET.FLEETS[fleetId];
  if (!fleet || !s) return null;
  validateFleetShape(fleetId, fleet);
  const ctx = supplied || scenarioContext(s);
  if (!fleet.models.includes(ctx.modelId)) return null; // fail-closed model scope (P1-4 rule)
  const m = MODELS.find(x => x.id === ctx.modelId);
  const nat = ED_TRAFFIC_PROFILES.find(t => t.id === (m && m.nativeTraffic)) || ED_TRAFFIC_PROFILES[0];
  const st = Object.assign(structuredClone(s), {
    blend: Object.fromEntries(HW_ORDER.map(k => [k, fleet.legs[k] || 0])),
    ioRatio: nat.ioRatio, cacheHit: nat.cacheHit, // canonical anchor, state channel (RA-3)
  });
  const canonicalCtx = { modelId: ctx.modelId, profileId: nat.id, customDonor: ctx.customDonor }; // canonical anchor, context channel
  const feas = feasibility(st, canonicalCtx);
  const members = [], excluded = [];
  /* im-vet-six-repairs (2026-09-20), finding E1: a DECLARED EVIDENCE WITHDRAWAL excludes a
     leg ahead of the capacity read. The two grounds are kept apart on the row (`ground`)
     because they say different things to a reader: a capacity exclusion is a fact about
     this model at this anchor and moves when the model does; a withdrawal is a judgment
     about the row's own evidence and moves only when that evidence does. Both land in the
     SAME `excluded` list at weight 0, so every existing consumer — the renormalization,
     the exclusion clause, the non-monotonicity disclosure, every receipt — carries the
     withdrawal without a second code path. */
  const withdrawnHere = (fleet && fleet.withdrawn) || {};
  for (const [hw, declaredWeight] of Object.entries(fleet.legs)) {
    const leg = feas.legs.find(l => l.hwKey === hw);
    if (withdrawnHere[hw]) {
      excluded.push({ hwKey: hw, declaredWeight, ground: "withdrawn", reason: withdrawnHere[hw] });
      continue;
    }
    if (leg && leg.renderableUnderPolicy === true) {
      members.push({ hwKey: hw, declaredWeight, placementVerified: leg.placementVerified === true });
    } else {
      /* A CAPACITY exclusion carries NO `ground` key, and the omission is deliberate rather than
         sloppy: this DTO is serialized into the historical 270/273-state receipts, which must
         reproduce byte-for-byte through the pinned pre-fold bundles. Adding a field to the shape
         those receipts were minted against would make every one of them unreproducible, so the
         new field appears only on the rows that did not exist before it. Absence therefore MEANS
         capacity, and `groundOf` below is the one place that reads it. */
      excluded.push({ hwKey: hw, declaredWeight,
        reason: !leg ? "no capacity solve at the anchor (no registered domain or unregistered regime)"
          : leg.infeasible ? "no legal width fits the model under the policy at the anchor (typed infeasible)"
          : "declared operating point" + (leg.bDeclared != null ? " (b=" + leg.bDeclared + ")" : "")
            + " not satisfiable within the registered domain under the policy at the anchor"
            + " (a capacity floor renders capped only — never policy-clean)" });
    }
  }
  const memberTotal = members.reduce((a, l) => a + l.declaredWeight, 0);
  members.forEach(l => { l.defaultWeight = memberTotal > 0 ? l.declaredWeight * 100 / memberTotal : 0; });
  return {
    fleetId,
    derivedAt: { trafficProfileId: nat.id, ioRatio: nat.ioRatio, cacheHit: nat.cacheHit,
      basis: "canonical native-traffic anchor (memo D-1): membership never re-derives under the selected traffic" },
    members, excluded,
    declaredLegCount: Object.keys(fleet.legs).length, memberLegCount: members.length,
    renormalizationBasis: memberTotal,
  };
}

/* ---------- Slice C (design memo im4-sliceC-design-memo v9, C-7): the ONE shared
   fleet-conditional blend baseline — consumed by BOTH the encoder (its blend diff
   baseline) and the loader (normative restore step 4), so the wire and the app
   can never disagree about what a fleet identity implies for the blend axis.
   Returns a full HW_ORDER blend map, or null = "no override: the identity-branch
   base blend stands unchanged" (custom/preset identities; out-of-scope models;
   and the RA-4 empty-derivation default case — the D-2 chokepoint mirror, never
   an all-zero blend). The DEFAULT row derives at the state's CURRENT (model,
   total, precision, policy) — the encoder's CURRENT-state baseline and the
   loader's POST-diff seed are the same function at the same state by
   construction (the R3-round decode-order hazard, closed structurally). */
function fleetBaselineBlend(fleetId, s, supplied) {
  if (fleetId === "custom" || fleetId === "preset") return null;
  /* b9 M4 (memo §1.3/§5.5): a custom fleet's baseline blend is the per-donor AGGREGATE
     of its leg shares — the S.blend mirror seed. State-independent (a user composition
     IS its declared construction, the C-1 non-default rule) and MODEL-AGNOSTIC (custom
     fleets are hardware compositions, not model-attributed constructions — no models
     scope check, memo D-3). */
  if (isCustomFleetId(fleetId)) {
    const def = customFleetSource().resolve(fleetId);
    if (!def) return null;
    const blend = Object.fromEntries(HW_ORDER.map(k => [k, 0]));
    for (const l of customFleetFlatDefinition(def)) blend[l.donorKey] += l.sharePct;
    return blend;
  }
  const fleet = ED_FLEET.FLEETS[fleetId];
  if (!fleet || !s) return null;
  const ctx = supplied || scenarioContext(s);
  if (!fleet.models.includes(ctx.modelId)) return null; // fail-closed model scope (P1-4 rule)
  if (fleetId === ED_FLEET.DEFAULT_FLEET_ID) {
    const d = deriveDefaultFleetMembership(fleetId, s, ctx);
    if (!d || !d.memberLegCount) return null; // RA-4 mirror: the un-bound base seed stands
    const blend = Object.fromEntries(HW_ORDER.map(k => [k, 0]));
    for (const l of d.members) blend[l.hwKey] = l.declaredWeight;
    return blend;
  }
  // Non-default named fleet: the DECLARED registry weights, state-independent (C-1:
  // their point IS the declared construction — no filtering, D-5/D-7 boundary).
  return Object.fromEntries(HW_ORDER.map(k => [k, fleet.legs[k] || 0]));
}

/* ---------- R3 Row 1 (design memo D-9): THE FINAL ANSWER ----------
   The owner's standing requirement (BACKLOG Row 1, owner-verbatim 2026-07-22): an
   obvious final answer — a planning point plus labeled spans, rationale linked to
   evidence, defensible under expert scrutiny. ONE function computes the block AND
   its emitted token strings; the site block and the MCP emission BOTH consume it
   (never live user state — the thesis baseline is the clean derived flagship
   default; user edits can never move these values, D-9 binding). Honesty contract:
   every value is policy-labeled (central identity is constructor-refused for closed
   models); spans are SPANS ACROSS DECLARED ALTERNATIVES, never uncertainty
   intervals (the FA-scoped vocabulary probe enforces the grammar); the ratified
   empty comparator stands; the identity rides INSIDE each value token (D-3b crop
   bar). */
/* ================= b9 M6 (FA memo §5, D-7): the exec-summary row REGISTRY =================
   TYPED DATA, not renderer strings (memo §5.2 validation): each row declares the ONE control it
   moves from the calculator's own default state, its evidence label, its evidence href, and its
   low-evidence affordance state (§17.4). The hrefs live here so a node assertion can resolve every
   one of them — they are rendered by app.js at runtime and would otherwise never appear as literal
   attributes for `site-links` to see. Row order IS the owner's declared plausibility order and is
   deliberately NOT the margin order (T-5). */
const EXEC_SUMMARY_ROWS = Object.freeze([
  Object.freeze({ id: "util-70", order: 1, computed: true, override: Object.freeze({ util: 70 }),
    lever: "fleet utilization moved 50% → 70%",
    evidence: "a declared planning convention; no occupancy telemetry is public (r4 §C3 scenario-only ledger)",
    href: "research/final-answer-rationale.html#scenario-only-utilization",
    lowEvidence: Object.freeze({ state: "jump", param: "Fleet utilization", controlKey: "util" }) }),
  Object.freeze({ id: "util-75", order: 2, computed: true, override: Object.freeze({ util: 75 }),
    lever: "fleet utilization moved 50% → 75%",
    evidence: "the same declared planning convention, pushed further (r4 §C3 scenario-only ledger)",
    href: "research/final-answer-rationale.html#scenario-only-utilization",
    lowEvidence: Object.freeze({ state: "jump", param: "Fleet utilization", controlKey: "util" }) }),
  /* im-arc T2 (memo §6, 2026-08-22): pin this published historical reading at
     $0.07/kWh; only generic expectations adopt the new registry midpoint. */
  /* im-arc T4 fold (2026-08-24), memo §2 [F8]: the unsourced $0.07/kWh override is withdrawn.
     This reading now INHERITS the registered US industrial region BY ID — no literal triple is
     copied here, so the row can never disagree with the registry it cites. The historical pins
     keep 0.07 through the T4 declared-delta manifest, not through this row. */
  Object.freeze({ id: "owned-tco", order: 3, computed: true, override: Object.freeze({ hwMode: "tco" }),
    electricityRegionRef: "us-industrial",
    lever: "procurement basis moved from the low/committed planning rent to owned/strategic TCO",
    evidence: "a different NAMED procurement basis (D-3), not a discount on this one",
    href: "#s3", tcoVector: true, lowEvidence: null }),
  Object.freeze({ id: "specdecode", order: 4, computed: false, override: null,
    lever: "speculative decode / MTP credit",
    evidence: "vendor-official at one non-flagship lab, dated; magnitude for this fleet unpublished",
    href: "research/final-answer-rationale.html#scenario-only-mtp",
    /* b9 spec-decode LEVER — THE AFFORDANCE FLIP (memo §9.2). The M6 contract is that this row's
       `no-control` affordance flips to `jump` WHEN THE LEVER LANDS, "with no new mechanism": two
       fields on one frozen registry row and nothing else. The lever has landed, so it flips here.
       `LOW_EVIDENCE_COPY["no-control"]` is retained unedited per §9.2 — it is no longer reached, and
       deleting it would be a mechanism change rather than a field change. */
    lowEvidence: Object.freeze({ state: "jump", param: "Speculative decode / MTP credit", controlKey: "specDec" }) }),
  Object.freeze({ id: "trend-6", order: 5, computed: true, override: Object.freeze({ trendMonths: 6 }),
    lever: "algorithmic lead moved +3 → +6 months",
    evidence: "aggressive tail: every algorithmic-lead voice this page carries kept +6 OUTSIDE the default",
    href: "#s5", lowEvidence: null }),
]);
/* The §C2 verbatim (r4 run B, 2026-07-25). The ONE vocabulary-scanner exemption (memo §2.7 D-6c)
   is granted to THIS string under THIS frame and to nothing else. */
const FA_MUST_NOT_BE_CALLED_FRAME = "That adjudication also states what this reading must not be called. It must not be called: ";
const FA_MUST_NOT_BE_CALLED_VERBATIM = "verified; actual; central Anthropic margin; a confidence interval; a coherent public-market-rent result.";
/* §17.4 — the low-evidence affordance ships in two typed states, because the honest state of the
   world has two: a parameter with a control (jump to it) and a lever with no control yet (say so). */
const LOW_EVIDENCE_COPY = Object.freeze({
  jump: (param) => "Particularly low-evidence parameter — " + param
    + ". This page's value is a declared convention, not a measurement. Set your own.",
  "no-control": (param) => "Particularly low-evidence parameter — " + param
    + ". This calculator has no control for it yet, so the default holds the credit at zero rather than"
    + " assuming a positive value. Building the control is scoped work this page names openly instead of folding into another number.",
});
/* §17.2 — the re-pinned spec-decode row (owner ruling 2026-07-30 22:57Z, §16.2 A-1; evidence label
   rewritten by the sweep, §16.6). The four elements the Polaris grant requires survive in-line. */
const MTP_ROW_COPY =
  "Speculative decode / MTP credit — a lever this page deliberately leaves OUT of its default."
/* J-10 run-3 dive B (P0): MTP is NOT a second name for speculative decoding — it is a
   training/architectural choice that can supply the draft model; and the benefit is conditional,
   which the rest of this very row already says. The opening definition promised a universal
   economic effect the row then refuses to assume. */
+ " [lever] Speculative decoding and multi-token prediction: related techniques, not two names for one"
+ " thing — multi-token prediction is a training/architectural choice that can supply the draft model a"
+ " speculative-decoding implementation needs. Speculative decoding proposes candidate tokens for the"
+ " target model to verify; where accepted-token gains exceed draft and verification overhead it raises"
+ " the tokens generated per unit of compute, and therefore lowers modeled cost-out."
/* b9 spec-decode LEVER, manifest row 1 (§9.3 item 4, disposition SPLIT). The sentence that stood
   here — "The effect is conditional on acceptance, draft cost, batching and workload — which is why
   it is carried here as a lever and not as an adjustment" — conflated a DESCRIPTIVE claim about the
   mechanism with an OPERATIVE claim about why this page carries no control. The second half stopped
   being true the moment the control shipped. It is deleted rather than rewritten because the
   ratified tail below already carries both halves in their corrected form; keeping it would ship the
   same claim twice in one string, which is this arc's signature failure. */
+ " [evidence label] That the mechanism is real and material is now vendor-officially on the record and"
+ " dated: an OpenAI engineering post of 2026-07-29 credits an improved draft/speculator model with"
+ " \"more than 15%\" additional token-generation efficiency, and its pricing post of 2026-07-30 says it is"
+ " \"passing those gains on to customers\". That is a vendor claim — self-reported, single-source, not"
/* Manifest row 1, occurrence (G) — a TIGHTENING, not a correction. "Separately and independently"
   asserts independence OF THE VENDOR CLAIM (a different party, a different stack), which is true;
   it does not assert independent replication, which is not. The neighbouring "not independently
   verified" at the line above is CORRECT AS IT STANDS and is deliberately left byte-untouched:
   over-correcting accurate copy is this arc's other failure mode, and only one of the three
   "independent" occurrences was ever wrong. */
+ " independently verified — at ONE lab, and that lab is not this page's flagship. Separately, and"
+ " from a different party, published measurements on open serving stacks span about 14% at production-like batch"
+ " to about 60% at modest concurrency."
/* J-10 run-1 dive A P0-2, CORRECTED against the primary source (lmsys.org/blog/2025-07-17-mtp,
   read 2026-08-02). The old text said these two figures came from "different models, speculator
   architectures and implementations". They do not: BOTH case studies use DeepSeek V3 under SGLang
   with the same MTP technique. What differs is cluster scale (16 H200 / 2 decode nodes vs 128 H200
   / 4 prefill + 12 decode), concurrency (2 vs 128 requests per rank), sequence lengths and draft
   window. Narrowing to what the source supports, per the court's truth-restoring rule — a claim
   that is false about its own citation was never inside the ratified envelope.
   J-10 run-2 P0 — MINE, AND THE THIRD FALSE CLAIM ABOUT THIS SOURCE IN THE FOLD THAT FIXED THE
   FIRST TWO. Run 1's fold added: "measured against a baseline that also lacks overlap scheduling …
   so it is not a pure speculative-decode delta". That INVERTS the source table. Overlap scheduling
   is OFF IN BOTH the 51.0 baseline and the 82.0 MTP arm, so +60.8% is a MATCHED MTP-vs-no-MTP delta
   — the cleanest reading available, not a confounded one. 82.0/60.4 = +35.8% compares
   MTP-without-overlap against overlap-without-MTP, and that SGLang version could not run MTP and
   overlap together, so no same-overlap figure exists to compute. Both dives found it independently;
   dive B also ruled it outside the court's envelope because it changed what the number is offered
   as evidence FOR. Replacement text adopted VERBATIM from dive B per Polaris gen-25
   (esc-20260802T201114Z-0e9b3ae3). The lesson is narrower than "check sources": I checked the
   baseline's conditions and did not check that the TREATMENT ARM shared them. */
+ " Both are the SAME model on the SAME stack — DeepSeek V3 under SGLang — differing in cluster"
+ " scale, concurrency, sequence lengths and draft window, so the spread measures deployment"
+ " conditions rather than two independent results, and neither is transferable to this fleet."
+ " The larger figure is the MTP-versus-no-MTP delta with overlap scheduling absent from both arms:"
+ " 82.0 versus 51.0 tokens/s/rank (+60.8%). The post separately reports 60.4 tokens/s/rank for"
+ " overlap scheduling without MTP; because that SGLang version did not support MTP together with"
+ " overlap scheduling, it does not report MTP's incremental gain on top of overlap."
/* Court note (gen-24): these two figures trace to the design memo's own citation, NOT to a row in
   evidence-instances-v22.json — a provenance gap on a page whose thesis is that numbers carry typed
   provenance. Declared in-page as cited-not-registered per the court's second option; landing real
   registry rows is the better fix and is in BACKLOG.md. */
+ " Both figures are cited from that post and are not registered evidence rows of this page: they"
+ " label a scale, and nothing computes from them."
+ " The two classes of"
+ " evidence are reported side by side and are never added together."
/* J-10 run-3 dive A (P1): "settled" bundled mechanism-existence with frontier-lab DEPLOYMENT, and
   the deployment evidence is the self-reported vendor claim this same row labels unverified three
   sentences earlier. Splitting the three claims apart is the only way the caveat survives. */
+ " [why no number] That the MECHANISM exists is established. That it runs in production at one frontier"
+ " lab is that lab's own dated report, labeled above as the vendor claim it is — not something this page"
+ " has independently verified. Whether it is deployed on the fleet THIS page models, and with what"
+ " effect, is established by nothing this page has found. Acceptance"
+ " rates, average accepted tokens per step, and draft-model size and architecture are not publicly"
/* Manifest row 1, occurrence (H) — a LIVE HONESTY DEFECT in M6-shipped copy that survived six J-10
   dive rounds, found by round-6 Sol. "this page has found none for any lab" is FALSE against this
   page's own registry, which records an h20/Ant anchor at about 1.8-1.9 accepted tokens and an
   ascend/CloudMatrix anchor assuming 70% for one speculative token. The true claim is a
   FRONTIER-FLEET absence, not a universal one. In scope for this leg because the lever makes the
   surrounding block normative again. */
+ " disclosed for the fleet this page models."
/* J-10 run-1 dive A P0-3, CORRECTED against the primary source (lmsys.org/blog/2025-07-17-mtp,
   read 2026-08-02). "the only acceptance figures it has found anywhere" was FALSE against this
   page's OWN cited source: that same post publishes average acceptance lengths of 2.18 (3-token
   window) and 2.44 (4-token window). The exclusivity claim is now bounded to this page's cited
   evidence set and dated, and the source's own figures are named rather than omitted. Same shape as
   occurrence (H) below it — a universal that the page's own record refutes — and the second time in
   this arc that an unbounded "anywhere/any lab" claim has been the defect. */
+ " Its cited evidence set carries four non-fleet acceptance figures and no fleet-specific one: two"
/* J-10 run-4 dive A P0-1, OWNER-RULED 2026-08-02T22:47Z (card q-im-specdec-dive-gate-run4).
   "about 1.8–1.9 accepted tokens" renamed the SOURCE'S OWN metric: SGLang reports an average
   ACCEPTANCE LENGTH, which counts accepted draft tokens PLUS the bonus token produced per
   verification step. Calling the whole figure "accepted tokens" overstates the accepted-DRAFT count.
   Restated in the source's terms with the composition stated, per the ruling. Dive A rated this P1 in
   run 3 and P0 in run 4 on BYTE-IDENTICAL copy — the severity moved, not the facts, which is the
   non-reproducibility finding this fix exists to retire. */
+ " non-flagship anchors — one reporting an average acceptance length of about 1.8–1.9 (SGLang's"
+ " acceptance-length metric counts accepted draft tokens plus the bonus token produced per"
+ " verification step), one assuming 70% acceptance"
+ " for a single speculative token — and, in the open-stack post cited above, average acceptance"
+ " lengths of 2.18 and 2.44 at two draft-window settings. None is for the fleet modelled here, and"
+ " these are the figures this page has found, not a claim about every figure that exists."
/* Manifest row 1, the [why no number] tail — the ratified replacement. The old text argued
   PRESENT-TENSE against the very control this page now ships ("a fleet-wide credit would land on
   legs whose speculative status this page cannot establish"; "Making it a control you can turn is
   scoped work this page has not yet done"), so shipping the lever without this fold would leave the
   page contradicting itself in the row that points at the lever.

   The leg counts are EXECUTED against the typed statuses, not transcribed. im-vet-six-repairs
   (2026-09-20): the default fleet is FIVE legs since the two Trainium ones were withdrawn on
   evidence grounds, so h100/h200/gb200 are `excluded` and creditable and gb300/tpu7 are `unknown`
   and therefore exempt. The two withdrawn legs were creditable and are simply not in the fleet
   any more; the sentence below counts what is. */
+ " This calculator's serving form declares the speculative pair, and the roofline itself still"
+ " computes at the conservative 1/1 floor structurally — any credit is applied after that floor, to"
+ " decode only. The mechanism's benefit is conditional on acceptance, draft cost, batching and"
+ " workload; the control offered here models none of those, so it is a scenario credit you declare,"
+ " not a mechanism this page runs. Of the five legs in the default fleet exactly one documents that"
+ " its anchor carries no speculative credit — and under the typed statuses this lever acts on, three"
+ " legs are creditable and two, gb300 and tpu7, cannot be established and are exempt — so this page"
+ " applies no fleet-wide credit of its own, and the r4 review's verdict on exactly that question is"
+ " \"do not apply one universal multiplier\"."
/* The receipts element is RETAINED. Reported as a precedence call and now AFFIRMED BY COURT RECORD
   — Polaris gen-24 `esc-20260802T121708Z-66c10f00`, 2026-08-02T12:27:55Z: *"the D-7 grant's [what
   receipts] requirement outranks a ratified copy change, so the element stays. Row 1's ratified text
   is AMENDED by this affirmation to include the retained element."* The reasoning stands as the
   record of why: the D-7 amendment that authorises this refusal row at all
   (esc-20260730T220007Z-39615d5c) requires it to state "the lever, its evidence label, why no
   number, and what receipts would have to exist", and that grant sits at precedence tier 2 while the
   design memo sits at tier 7. A ratified replacement for one element cannot silently delete an
   element a higher authority requires. */
+ " [what receipts would have to exist] Per-leg workload-weighted acceptance and draft-overhead receipts."
+ " What this page ships instead is a control you turn: off by default, never applied to a leg whose"
+ " deployed efficiency already absorbs speculation or whose status this page cannot establish,"
+ " disclosed on every leg it does reach, and never used to select a reading of this page's own."
+ " The credit stays at zero in this page's default — a no-credit convention, which cannot inflate"
+ " this page's margin, and not a finding that the credit is zero.";
/* The six declared Owned-TCO inputs row 3 pulls in (D-6t). READ FROM THE LIVE STATE, never restated:
   "one control" is true of the control count and false of the parameter count, and the block says so. */
function tcoAssumptionVector(st) {
  return "cluster overhead " + st.clusterOh + "×, GPU depreciation " + st.lifeYears
    + " yr, datacenter capex $" + st.dcPerW + "/W, electricity $" + st.kwh + "/kWh, PUE " + st.pue
    + ", operations overhead " + st.opexPct + "%";
}
/* b9 M6 (FA memo §5): the exec-summary rows, RENDERED. Each computed row re-derives its own margin
   from its own one-control state and carries the fleet weld the site's ONE shared clause formatter
   produces from THAT row's own `fleetRenderable` (D-6u-bis: "the existing fleet-renderability
   clause"). The refusal row emits no value token and therefore carries no weld (§8.2). */
/* `baseOverride` exists so the SUITE can perturb an engine input and observe the RENDERED rows
   move through this exact formatter (T-4's mutation check). Comparing two `workload()` calls to
   each other would prove only that `workload()` responds to its inputs — it would say nothing about
   whether these tokens are computed or hard-coded, which is the property T-4 names. finalAnswer()
   never passes it. */
/* im-arc T4 fold (2026-08-24), memo §2 [F8]: an exec-summary row that names a region takes that
   region's registered middle BY ID. No literal triple is copied into the row, so the reading and
   the registry cannot drift apart — which is exactly how the stale {0.060, 0.0871, 0.120} got
   printed in the memo's own v1. */
function execSummaryRowElectricity(row) {
  if (!row || !row.electricityRegionRef) return {};
  const region = dcRegistry().REGIONS[row.electricityRegionRef];
  if (!region) throw new TypeError("exec-summary row " + row.id
    + " names unregistered region " + row.electricityRegionRef);
  return { kwh: region.usdPerKwh.mid };
}
function execSummaryRowState(rowId, m, median) {
  const row = EXEC_SUMMARY_ROWS.find(entry => entry.id === rowId);
  if (!row) return null;
  const model = m || MODELS.find(entry => entry.id === FLAGSHIP_SCOPE.modelId) || MODELS[0];
  const perspective = median || PERSPECTIVES.find(entry => entry.id === "median");
  return Object.assign(applyPresetSettings(model, perspective, FLAGSHIP_SCOPE.traffic),
    row.override || {}, execSummaryRowElectricity(row));
}
function execSummaryRowTokens(m, median, pct, baseOverride) {
  return EXEC_SUMMARY_ROWS.map(row => {
    if (!row.computed) return MTP_ROW_COPY + " " + LOW_EVIDENCE_COPY[row.lowEvidence.state](row.lowEvidence.param);
    const st = Object.assign(applyPresetSettings(m, median, FLAGSHIP_SCOPE.traffic), baseOverride || {},
      row.override, execSummaryRowElectricity(row));
    const wl = workload(st, undefined, scenarioContext(st));
    const weld = fleetRenderableClause(wl.fleetRenderable, false, undefined);
    return pct(wl.margin * 100) + " — " + row.lever
      + " from the calculator's own default state, policy-labeled scenario."
      + (row.tcoVector
        ? " This row moves one reader control — the procurement basis — and takes its electricity"
          + " from the registered " + row.electricityRegionRef + " region row by id ($"
          + dcRegistry().REGIONS[row.electricityRegionRef].usdPerKwh.mid + "/kWh), replacing the"
          + " unsourced $0.07/kWh override this reading carried before the im-arc T4 fold of"
          + " 2026-08-24. It changes no other scenario control — it is NOT the"
          + " multi-setting owned-TCO exploration route the justification entries discuss, which also"
          + " moves utilization, the stack multiplier, the serving regime and the billing mix and"
          + " therefore computes higher. That one control pulls in six declared inputs, shown at their"
          + " live values: "
          + tcoAssumptionVector(st) + " (the rent multiplier becomes inert under this basis)."
        : "")
      + " Fleet weld: " + weld + "."
      + " Evidence: " + row.evidence + "."
      + (row.lowEvidence ? " " + LOW_EVIDENCE_COPY[row.lowEvidence.state](row.lowEvidence.param) : "");
  });
}
function finalAnswer() {
  const m = MODELS.find(x => x.id === FLAGSHIP_SCOPE.modelId);
  const median = PERSPECTIVES.find(p => p.id === "median");
  /* b9 M5 (memo §15, D-10): the FA interim pin. Under M5 defaults the derived flagship default
     carries the ratified +3 prior; the FA surface must not ship that number UNLABELED before M6
     builds the two-reading surface. ONE constructor pins the planning state — and, below, every
     nested state the FA computation derives (lensSpan's per-lens states, trafficContributors) —
     back to the public-evidence reference at trend 0 / family 1.0. `band` and `membSens` are
     evaluated FROM this pinned `s`, so they inherit the pin. */
  const s = pinReferenceLevers(applyPresetSettings(m, median, FLAGSHIP_SCOPE.traffic));
  /* b9 M6 (memo §4.1, D-6p): the reference-pinned derivation above is RETAINED UNCHANGED — every
     field computed from `s` keeps its pre-M6 value (T-9's freeze stays load-bearing). M6 ADDS this
     sibling, computed from the UNPINNED default state, and retires the single-reading PRESENTATION.
     ONE new numeric leaf on the object (`priorReading.marginPct`) — T-9's whitelist is exactly it. */
  const sPrior = applyPresetSettings(m, median, FLAGSHIP_SCOPE.traffic);
  const wlPrior = workload(sPrior, undefined, scenarioContext(sPrior));
  /* row 499 (owner ruling: "the FINAL ANSWER BLOCK carries the hero numbers — make sure that change
     goes through"). The page opens on a named estimate preset, so the state a reader sees FIRST had
     no reading of its own in this block: they landed on a number the answer block did not name.
     Computed exactly like the two above — same model, same flagship traffic, the preset's own
     declared vector — so it is the same kind of object, not a new claim class. Its own lead
     treatment is whatever the preset seeds (zero, for the adjudicated presets), which is why it is
     NOT reference-pinned here: pinning would erase the very property the ruling is about. */
  const landing = PERSPECTIVES.find(p => p.id === LANDING_DEFAULT_PERSP_ID) || median;
  const sLanding = applyPresetSettings(m, landing, FLAGSHIP_SCOPE.traffic);
  const wlLanding = workload(sLanding, undefined, scenarioContext(sLanding));
  const ctx = scenarioContext(s);
  const wl = workload(s, undefined, ctx);
  const membership = deriveDefaultFleetMembership(ED_FLEET.DEFAULT_FLEET_ID, s, ctx);
  const band = evaluateAtPolicyBand(pt => workload(s, undefined, ctx, { loadedWeightBytesPerParam: pt }).margin * 100);
  const membSens = membershipSensitivity(ED_FLEET.DEFAULT_FLEET_ID, s, ctx);
  const lenses = lensSpan(m, FLAGSHIP_SCOPE.traffic, { referencePin: true });
  const trafficContributors = ED_TRAFFIC_PROFILES.map(t => {
    const st = pinReferenceLevers(applyPresetSettings(m, median, { mode: "explicit", profileId: t.id }));
    const w = workload(st);
    return { id: t.id, marginPct: isFinite(w.margin) ? w.margin * 100 : null };
  }).filter(c => c.marginPct != null);
  const planningPolicy = CAPACITY_BYTES_POLICY[s.precision];
  const pct = v => "≈" + Math.round(v) + "%";
  const fa = {
    subject: "serving margin — Claude Opus 4.x at the published list-price schedule under the reference cache/batch/discount mix, on the serve-feasibility-filtered evidence-informed default fleet (na-blend), Reference traffic 15:1/60%",
    /* OWNER ANNOTATION nbc7fc1 (2026-08-16, verbatim: "title is rambling, a few words max"). The
       long subject above is a SCOPE DECLARATION and is not being shortened — dropping the tariff
       basis, the cache/batch/discount mix, the fleet filter or the traffic anchor from a margin
       figure is the conclusion-shopping this page's invariants exist to prevent. What the tile
       gets instead is a title-length line above the fold with the full declaration one click
       below it, still in the same DOM, minted HERE beside the long form so the two cannot drift.
       Metric and model only: those are the two facts a title has to carry, and every remaining
       clause narrows the reading rather than identifying it. */
    subjectShort: "serving margin — Claude Opus 4.x",
    identity: "the calculator figures are policy-labeled scenarios built from public evidence plus explicit page assumptions, analyst-set inputs, transferred or fitted quantities, and inferred fleet shares — not verified or central figures (because no placement map for the closed model is public, this page does not label any calculator result verified or central); the above-80 reading is a separately labeled adopted analyst judgment, not a calculator output; this page identifies no public, verified central comparator",
    planningPoint: {
      marginPct: wl.margin * 100,
      policy: { loadedWeightBytesPerParam: planningPolicy, precision: s.precision,
        note: "the planning point's policy identity (" + s.precision + " → " + planningPolicy + " B/param loaded) is stated explicitly and is NOT one of the three sampled points below" },
      fleetRenderable: wl.fleetRenderable,
    },
    membership,
    priorReading: { marginPct: wlPrior.margin * 100 },
    /* row 499: the hero the page actually opens on. `perspId`/`leadMonths` travel with it because a
       number whose basis is invisible is exactly what this block exists to prevent. */
    landingReading: { marginPct: wlLanding.margin * 100, perspId: landing.id, leadMonths: sLanding.trendMonths },
    /* T5 rec 1 (GPT Pro 2026-07-29 §6 rank 1, BLOCKER; finding SV-1), verbatim: "Have
       `finalAnswer()` return an explicit immutable `referenceState` or reference-state
       fingerprint. Make `refreshFinalAnswerDiffers()` compare the current canonical state/claim
       identity against that fingerprint—not `isCentralClean()`."

       This IS that fingerprint, and it is derived from the readings this block actually prints
       rather than restated beside them — so a future reading added to or removed from the surface
       moves the notice's trigger with it, instead of leaving the two to drift. Drift is the whole
       defect: `refreshFinalAnswerDiffers()` consulted `isCentralClean()`, and when row 499 split
       that predicate in two (the page stopped opening on `median`), the notice was not migrated
       with the other callers. The result was the mirror image of SV-1 — on a completely untouched
       page the block announced "The scenario currently selected above DIFFERS", naming an edit the
       reader had not made. Found failing by tests/fa-dual-default-r1.test.mjs at both viewports.

       Frozen, because a fingerprint a caller can edit is not a fingerprint. */
    referenceState: (() => {
      /* The traffic identity is carried RESOLVED, never as the mode token. The block computes at
         FLAGSHIP_SCOPE.traffic — `{mode:"explicit", profileId:"reference"}` — while the clean
         page sits on `mode:"native"`, and both resolve to the same Reference 15:1/60% anchor.
         Comparing modes would therefore have declared every untouched page "differing", which is
         the very false alarm this fingerprint exists to stop; comparing the resolved anchor asks
         the question that actually matters — is the live state computing at the same traffic the
         printed readings were computed at. Ratio and cache travel too, so a reader who lands on
         the reference profile and then edits its numbers is correctly outside the fingerprint. */
      const rt = resolveTraffic(m, median, FLAGSHIP_SCOPE.traffic);
      /* NOTE ON WHAT THIS DELIBERATELY DOES NOT CARRY. An intermediate version put the three
         printed STATE OBJECTS on this fingerprint, to make the comparison a full state-vector
         match. T-9 refused it, correctly: this DTO is a CLAIM surface, and the whole scenario
         vector times three is ~200 numeric leaves that no reader reads and that would blunt the
         guard permanently. The state-vector half of the comparison belongs where the state lives
         — in app.js, which already owns S and reuses the engine's own preset machinery for it.
         What this object carries is the part the app cannot derive: which readings are printed,
         and the fleet/traffic/model scope they were computed at. */
      return Object.freeze({
        modelId: FLAGSHIP_SCOPE.modelId,
        /* Fleet identity and total case are NOT in the scenario state — custom-fleet definitions
           live in a side registry by design ("Definitions live HERE, never inside the scenario
           state S"). So a state-vector comparison alone cannot see them, and the review's
           false-negative was exactly that: a custom fleet whose blend equals the default blend
           but whose per-leg HBM override makes a leg infeasible passes every state check while
           the live margin moves. The readings above are all computed over the default fleet at
           the flagship total case, so a DIFFERENT fleet is a reading the block does not print.

           TOTAL-CASE IDENTITY travels too, and getting here took being wrong once. Round 2 of the
           independent review said the matcher ignored it; I argued the omission was correct,
           because `total` is itself a compared state key, so an identical number means an
           identical reading. Round 3 rebutted that and was right: `TOTAL_CASE_ID` is STORED, not
           inferred — it carries the CITATION for the size case, and it is serialized into
           permalinks. A clean page holds `revised-band-central-2.5` (checked live); moving the
           total control away and back leaves it `"custom"` for ever, so the citation is gone and
           a shared link propagates the loss, even though the number returned exactly. Equal
           output is not equal claim identity, and this rec is about claim identity. The lesson
           generalises: a stored provenance label that a state edit can destroy is part of the
           claim, not decoration on it. */
        fleetId: ED_FLEET.DEFAULT_FLEET_ID,
        /* The cited size case the readings are computed at — DERIVED from the flagship state's
           own total rather than named here, so it cannot drift from what was computed. Null if
           the flagship total matches no registered case, in which case the app skips the check
           rather than inventing one. */
        totalCaseId: (() => {
          const cases = (typeof module !== "undefined" && module.exports)
            ? require("./engine-data-v22.js").TOTAL_CASES : TOTAL_CASES;
          const hit = Object.entries(cases || {}).find(([, c]) => c && c.totalB === s.total);
          return hit ? hit[0] : null;
        })(),
        /* Deliberately ONE OPAQUE STRING rather than numeric ioRatio/cacheHit fields. T-9 guards
           the FA's numeric leaf surface, and it is right to: every number on this object is a
           claim a reader can read, and a fingerprint is not one — it is a comparison key that
           exists only so the divergence notice can ask "same anchor?". Carrying it as a string
           keeps the numeric surface exactly the M6 whitelist, so the guard stays sharp instead of
           being widened to admit two non-claims. The ratio and cache are still IN the key, so an
           edited traffic mix still falls outside the fingerprint. */
        trafficFingerprint: rt.profileId + "|" + rt.ioRatio + ":1|" + rt.cacheHit + "%",
        /* Every perspective identity this block renders a reading FOR. A live state sitting on
           one of these is a state the block already answers; the notice has nothing to disclose. */
        perspIds: Object.freeze([median.id, landing.id]),
      });
    })(),
    policyBand: band,
    membershipSensitivity: membSens,
    lensSpan: lenses ? { loPct: lenses.lo * 100, hiPct: lenses.hi * 100, n: lenses.n,
      label: "span across " + lenses.n + " declared scenario-preset alternatives at the flagship scope (traffic held fixed; analysts, replays and out-of-scope lenses excluded)" } : null,
    trafficSpan: trafficContributors.length >= 2 ? {
      loPct: Math.min(...trafficContributors.map(c => c.marginPct)),
      hiPct: Math.max(...trafficContributors.map(c => c.marginPct)),
      n: trafficContributors.length, contributors: trafficContributors,
      label: "span across " + trafficContributors.length + " declared traffic-mix profiles at the central lens" } : null,
    whatWouldChangeIt: "a provider disclosure of fleet composition, measured loaded checkpoint bytes, a placement map for a closed model, or billable-cache share would materially move or narrow these numbers; only a direct same-scope margin disclosure, or matched disclosures of serving cost and realized billings, could verify actual margin — expert scrutiny is invited",
    /* b9 M6 (memo §4.1, D-6p-bis): M5's interim pin (`leverReference` / `leverReferenceLine`) is
       RETIRED here — its own text promised "the ratified-prior reading arrives with the final-answer
       rework", and this is that rework. The basis it used to carry for the whole block now rides
       INSIDE each token (D-6p-ter), which is what a second visible reading requires. */
    evidenceAnnexId: "final-answer-rationale",
  };
  /* FA higher-justifications block (memo im4-fa-justifications v7, J-1..J-3/J-5):
     typed GROUP records — every quoted claim reads its registry row (single source of
     bytes); the explanation strings are the memo's pinned J-5 content (static, with a
     stale-loud fixture re-deriving every ≈ value they cite); wouldFlip is REQUIRED on
     every record (R5 N1). Groups 1–3 render full; the four remaining ≥80 rows render
     compact; the nine-id enumeration fixture closes over exactly these claims. */
  const hjc = id => {
    const c = MARGIN_CLAIMS.find(x => x.id === id);
    if (!c) throw new Error("finalAnswer: missing claim row " + id);
    return c;
  };
  const hjClaim = c => ({ id: c.id, source: c.who, verbatim: c.verbatim ?? c.reportedFigure ?? null,
    claimedFigures: c.numeric ? (c.numeric.hi == null ? ("above " + c.numeric.lo + "%")
      : c.numeric.lo === c.numeric.hi ? (c.numeric.lo + "%")
      : (c.numeric.lo + "\u2013" + c.numeric.hi + "%")) : null });
  /* OWNER ANNOTATION nd4f4c7 (2026-08-16, verbatim: "These are the analyst scenarios I'd like to
     see in the area that's missing analyst scenarios. Need to be able to load them into the
     calculator with clear indication of their publicly stated positions vs our inferences about
     their positions").

     The first half shipped on 2026-08-16 \u2014 the routes carry their claimants' names again and each
     one's typed claim pointer travels with the verbatim quote and its link. This is the second
     half: the load op itself, so an entry can be OPENED in the calculator rather than described.

     Found by TYPED ANCHOR, never by matching names in prose: a route is offered under an entry
     only when its own `claimAnchor.claimIds` intersects that entry's claims. That is what keeps
     the stated/inferred line he asked for from blurring \u2014 the claim ids are the STATED positions
     (registry rows with verbatim text and a source link), the route is OURS, and the two are
     joined by a declared reference rather than by an editor's judgment at render time.

     An entry with no authored route gets NO link and says so. Three of the seven are in that
     state, and their own bridge text already says why in the same words ("no direct bridge
     exists", "no bridge is constructed", "90 remains just beyond every authored route") \u2014 a
     "Load" button there would promise a vector this page has refused to author. */
  const hjLoadOps = claimIds => PERSPECTIVES
    .filter(p => p.claimAnchor && p.loadScope
      && (p.claimAnchor.claimIds || []).some(id => claimIds.includes(id)))
    .map(p => ({
      perspId: p.id, model: p.loadScope,
      who: p.claimAnchor.who,
      /* The label states WHOSE vector it is in the same breath as offering it. "page-authored
         route anchored to X's claim" is the honest description of every one of these: the claim
         is theirs, the dial settings are not. */
      label: p.subtitle || p.name,
      relation: p.claimAnchor.relation || "page-authored route anchored to this claim",
      /* A pre-FORMATTED string, not the lo/hi numbers, and T-9 is why: the FA numeric surface is a
         closed set that a new field may not join without a whitelist entry, and this metadata has
         no business being scanned as one of the answer's numbers. It is authorship metadata about
         which band a route was written for — the same string the route's own name already carries
         — so it is minted here as text and the gate stays exactly as strict as it was. */
      rangeLabel: p.authoredRange
        ? (isFinite(p.authoredRange.lo) && isFinite(p.authoredRange.hi)
            ? p.authoredRange.lo + "–" + p.authoredRange.hi + "%"
            : isFinite(p.authoredRange.lo) ? "≥" + p.authoredRange.lo + "%"
            : isFinite(p.authoredRange.hi) ? "<" + p.authoredRange.hi + "%" : null)
        : null,
    }));
  {
    const tt1 = hjc("teortaxes-9095-conditional"), tt2 = hjc("teortaxes-90plus-floor"),
      pat = hjc("patel-80-floor"), sa80 = hjc("semianalysis-api-80-3q26"),
      gp94 = hjc("gptpro-9296-model-generated"), bak = hjc("baker-85-clip"),
      hua = hjc("huatai-anthropic-api-80floor"), tt25 = hjc("teortaxes-80-inference-2025"),
      ald = hjc("alderson-90-unit"), infra70 = hjc("anthropic-3870-infra"), wsj = hjc("wsj-compute-71-56");
    fa.higherJustifications = [
      { groupId: "g1-teortaxes-9095", claims: [hjClaim(tt1), hjClaim(tt2)],
        whatItClaims: "The conditional post (2026-06-27, conditional transition, names no lab): \"" + tt1.verbatim + "\". The floor post (2026-06-28, possibility floor; the wrapping straight quotes are the record's own): " + tt2.verbatim,
        whatItDoesNotClaim: "the conditional post — not an unconditional Anthropic point value; not any parameter of this calculator. The floor post — not a statement of where the figure tops out; not any named lab's audited figure.",
        bridge: "Moving 90 \u2192 95 means halving all-in cost per billed unit (cost falls from 10% to 5% of billings) — if only a fraction of cost is batch-sensitive, the move shrinks proportionally. The claim also presupposes the ~90 starting point, which no public disclosure establishes. A batching/throughput lever genuinely exists in this model: applied alone to the \u224858 public-evidence reference the throughput regime is worth \u22485 points, while inside the strategic-partner ladder — where partner rates and higher utilization have already moved the result to \u224879 — it adds about 2 more, to \u224882. Within the strategic-partner ladder, partner rates and higher utilization first move the result to \u224879; list-only billing is a later step from \u224882 to \u224884, not a prerequisite for entering the 80s in that ladder. Other constructions get there differently — the owned-TCO route substitutes a procurement basis rather than adopting partner rates. At the public-evidence reference no page-authored route reaches 90: the strongest, the owned-TCO route, computes \u224889.3 there and is disclosed as landing outside the \u226590 band it was authored for. Under the calculator's own ratified-prior default that same route computes \u224891.8 and does land inside it — the prior, not the evidence, is what carries it across. Naming the most plausible closer, as this page's own inference and not the claimant's stated method: a route into the 90s most plausibly assumes serving-stack efficiency this calculator does not credit at all in this reference reading, and in every other reading this page authors — speculative decoding first among them, which a frontier lab has now confirmed it runs in production and credits with more than 15% additional token-generation efficiency (OpenAI engineering post, 2026-07-29; its pricing post of 2026-07-30 says it is passing those gains on, and never uses the term itself — the link is a first-party cross-reference across those two documents). A speculative-decode credit is available as a scenario lever a reader can turn, from the \"no MTP/disagg\" stack setting only; no reading this page selects applies it. That is a different lab and a mechanism, never an Anthropic fleet parameter here. Although the conditional post names batching for 90 \u2192 95, neither TeorTaxes post states how the presupposed ~90 starting point is reached; this page applies no speculative-decode credit in any reading it authors — a no-credit convention, not a finding about Anthropic's actual deployment or benefit. A reader may apply one as their own scenario, from the \"no MTP/disagg\" stack setting only. The two aggressive planning-vector routes now compute \u224880.6/\u224879.5: the first INSIDE the 80\u201390 band it was authored for, the second just BELOW it. Neither vector has been re-authored — what moves them is the engine underneath. They first crossed into the band when the b9 defaults were repaired (before that they read \u224879.6/\u224878.5); the vetting repairs of 2026-09-20 moved them back down, by withdrawing the two Trainium legs from the default fleet and correcting the TPU decode coefficient onto a decode-only numerator, and that carried the second route back out. Band membership is computed and disclosed here, never enforced. The strategic-partner lens computes \u224883.0. Applying the xAI cash-basis settings to the Opus flagship scope computes \u224896; applying the DeepSeek disclosure settings to that same Opus scope computes \u224886. Those are cross-model setting transfers, not actual xAI or DeepSeek operating-point replays, and they say nothing about Anthropic's own margins.",
        wouldFlip: "a disclosed Anthropic (or peer) production operating point showing sustained ~90% unit margins at published list prices — or evidence reducing the \u224883.0 construction's cost share from \u224817.0% to \u224810% of billings (roughly a further 41% cut in cost per billed unit).",
        links: [tt1.url, tt2.url], loadOps: hjLoadOps(["teortaxes-9095-conditional", "teortaxes-90plus-floor"]) },
      { groupId: "g2-patel-semianalysis-80", claims: [hjClaim(pat), hjClaim(sa80)],
        whatItClaims: "Dylan Patel, in the published Sequoia transcript (a direct source for his own statement, not Anthropic disclosure): \"" + pat.verbatim + "\" Supporting publication: a paywalled SemiAnalysis 3Q26 report is publicly described (Dealroom coverage) as estimating an " + sa80.reportedFigure + " on its bottom-up-by-SKU Tokenomics model — the load-bearing report text is not publicly available to this page. Calibration context — different accounting objects, scopes stated: the same firm's May 2026 analysis has inference-infrastructure margins rising from 38% to above 70%, and secondary coverage of a Wall Street Journal report said company compute costs were expected to decline from 71 to 56 cents per revenue dollar from Q1 into Q2 2026 (a company-level forecast, not an observed datum).",
        whatItDoesNotClaim: "not a statement of where the figure tops out — a floor compatible with 85 and with 95; not this page's parameter vector; no published fleet, rate, utilization, traffic mix, or calculation (the Tokenomics model is private).",
        bridge: "Patel's statement targets the same quantity this page models (an Opus API-token unit margin): if both refer to the same unit, period, and accounting boundary, \">80\" and \u224858 contradict each other — they are not compatible readings. The grouped SemiAnalysis API-business figure is a broader accounting product-line metric — corroborating context from the same analyst family, not a second same-estimand contradiction. Where this page's ranking of that tier is concerned, the statement lives outside this answer; what matters here is why the calculator's own case differs. SemiAnalysis models these economics bottom-up by SKU, and this page treats that work as thorough while noting that its inputs — public, inferred, or private — cannot be seen from here. What the public record does not supply is the methodology that would let a reader diagnose which assumptions differ: this calculator reproduces the floor's neighborhood under labeled constructions (the strategic-partner ladder \u224884: partner rates at 0.70\u00d7, utilization 70, throughput regime, list-only billing; the strategic-partner lens \u224883.0, which also swaps the fleet; the separate owned-TCO route \u224889.3 at the public-evidence reference), and the assumption distance between those constructions and the conservative planning case is the disagreement — \"not publicly reproducible\" is this page's finding about the public record, not a claim that the source lacks a basis.",
        wouldFlip: "publication of the underlying fleet-cost basis, utilization, and operating point would allow a direct reconciliation and could settle the disagreement if every relevant boundary matches — or a disclosure showing procurement above this page's low/committed planning rates at moderate utilization would move the above-80 hypothesis back toward this page's conservative case; either publication would close most of the diagnosis gap.",
        links: [pat.url, pat.secondaryUrl, sa80.url, sa80.secondaryUrl, infra70.url, wsj.url], loadOps: hjLoadOps(["patel-80-floor", "semianalysis-api-80-3q26"]) },
      { groupId: "g3-gptpro-9294-lens", claims: [hjClaim(gp94)],
        whatItClaims: "\"" + gp94.verbatim + "\" (model-generated scenario analysis, 2026-07-09). For the flagship comparison the relevant figure is Opus 92\u201394; the registry record splits accordingly. A page-authored strategic-rate adaptation inspired by the consult's fleet economics computes \u224883.0 at the flagship scope — the high endpoint of the scenario-preset span — and is not a faithful replay of the consult's 92\u201394 scenario: the consult's 75% occupancy central is adapted to 70 here, and its TPU-specific ~$1.60/hr estimate is generalized as a 0.70\u00d7 multiplier across the lens fleet — both page choices, labeled.",
        whatItDoesNotClaim: "human endorsement — model-generated analysis with zero claimant weight, rendered only in its own provenance-labeled group.",
        bridge: "The executed ladder from \u224858 to \u224884 (each step a calculator mutation from the conservative case, at the revised flagship size; cost shares of billings in parentheses): partner rates alone (0.70\u00d7) \u2192 \u224871 (\u224829%); utilization 70 alone \u2192 \u224870 (\u224830%); both \u2192 \u224879 (\u224821%); plus the throughput serving regime \u2192 \u224882 (\u224818%); plus list-only billing (no batch share, no discount) \u2192 \u224884 (\u224816%). The lens itself lands slightly LOWER, at \u224883.0 (cost share \u224817.0%), because it also swaps the fleet — that last difference is blend composition, not a further cost lever. The serving-stack multiplier stays at 1.0\u00d7 (no stack-efficiency step) — though the throughput-regime switch is itself an operating-point assumption, not a free lunch. The remaining distance from \u224883.0 to the consult's Opus 92\u201394 is the mature-fleet scenario the consult asserts beyond this adaptation (its own implied per-category economics combine near \u224891 at the reference mix; 92\u201394 implies an all-in cost share of 8\u20136%, so closing from \u224883.0 requires roughly a further 53% or 65% cut in cost per billed unit) — the part the public evidence does not ground. Naming the most plausible closer, as this page's own inference and not the consult's stated method: a mature-fleet scenario at that level most plausibly assumes serving-stack efficiency this calculator does not credit in this reference reading, and in every other reading this page authors, speculative decoding first among them — vendor-confirmed in production at a different frontier lab, credited with more than 15% additional token-generation efficiency (OpenAI engineering post, 2026-07-29; its pricing post of 2026-07-30 says it is passing those gains on, and never uses the term itself — the link is a first-party cross-reference across those two documents). The credit is available as a scenario lever, from the \"no MTP/disagg\" stack setting only; no reading this page selects applies it. That is a different lab and a mechanism, never an Anthropic fleet parameter here; carried at no credit in any reading this page authors — a convention, not a finding about Anthropic's actual deployment or benefit; a reader's own scenario may credit it, from the \"no MTP/disagg\" stack setting only. The conservative case answers the published-tariff, low/committed-planning-rate, reference-traffic question on the serve-feasibility-filtered evidence-informed default fleet.",
        wouldFlip: "partner-rate disclosure plus utilization evidence plus a published production operating point (throughput/latency) and billing-mix evidence — the full set the ladder shows is needed (rates and utilization alone reach only \u224879); reaching the consult's 92\u201394 additionally requires evidence supporting an all-in cost share of at most 8\u20136% of billings.",
        links: [gp94.url], loadOps: hjLoadOps(["gptpro-9296-model-generated"]) },
      { groupId: "g5-baker-85", claims: [hjClaim(bak)],
        whatItClaims: "\"" + bak.verbatim + "\" (85, Anthropic inference gross margins, All-In E278 — the show's own published clip; the speaker attributes the figure to reports).",
        whatItDoesNotClaim: "the speaker's own estimate (he attributes the figure to reports); a stated cost basis; a token-SKU operating point — the scope reads closer to an inference product-line estimate.",
        bridge: "this page's owned-TCO construction computes \u224889.3 at the public-evidence reference, so it already exceeds 85 (not an accounting reconciliation from product-line gross margin to this page's unit metric); an 85% margin would tolerate roughly a 40% increase in cost per billed unit from that construction.",
        wouldFlip: "the underlying reports or sources being published with their cost boundary stated, and shown to support the figure at a matched scope.",
        links: [bak.url, bak.secondaryUrl], loadOps: hjLoadOps(["baker-85-clip"]) },
      { groupId: "g5-huatai-80", claims: [hjClaim(hua)],
        whatItClaims: "\"" + hua.verbatim + "\" (page translation: Anthropic's current blended gross margin is around 60%, API gross margin exceeds 80%, OpenAI's gross margin is lower at around 40%; the trailing ellipsis is the relay's own) — a sell-side note relayed without the original document (above-80 floor, Anthropic API); the excerpt's own blended-vs-API split is preserved here because it demonstrates exactly why metric scope matters.",
        whatItDoesNotClaim: "an independent measurement; a point — the figure is a floor.",
        bridge: "no direct bridge exists without an accounting reconciliation from API-product-line margin to this page's unit metric; the floor's numeric neighborhood is reachable here only via the Patel-group constructions.",
        wouldFlip: "the original note and methodology being published together with a reconciliation demonstrating that its API-product-line accounting perimeter maps to this page's same-period unit metric while still supporting an above-80% result.",
        links: [hua.url], loadOps: hjLoadOps(["huatai-anthropic-api-80floor"]) },
      { groupId: "g5-teortaxes-2025", claims: [hjClaim(tt25)],
        whatItClaims: "\"" + tt25.verbatim + "\" (~80 inference-only, dated March 2025 — a dated cross-lab informal read). The staleness cuts both ways — prices fell (margin down) while fleets and software improved (margin up); this page does not claim the direction.",
        whatItDoesNotClaim: "a current-year figure; a defined accounting perimeter.",
        bridge: "within this calculator, the 2025-era operating assumptions are not encoded; no bridge is constructed.",
        wouldFlip: "a current same-scope estimate supported by disclosed cost, billing, and operating-point evidence that materially conflicts with the conservative case.",
        links: [tt25.url], loadOps: hjLoadOps(["teortaxes-80-inference-2025"]) },
      { groupId: "g5-alderson-90", claims: [hjClaim(ald)],
        whatItClaims: "\"" + ald.verbatim + "\" (90, frontier-labs class-wide; note an above-80 floor is compatible with 90 without endorsing it). The record's own annex lists public numbers clustering lower (60\u201375, enumerated with scopes in the registry annex — listed, not asserted, since those figures span different metric scopes; the cluster note predates the above-80 report rows).",
        whatItDoesNotClaim: "primary leak access; a per-lab basis.",
        bridge: "the owned-TCO route \u224889.3 at the public-evidence reference is this page's closest construction; 90 remains just beyond every authored route.",
        wouldFlip: "a per-lab basis being published and shown to support ~90 at a matched scope — from this page's owned-TCO construction (\u224889.3 at the public-evidence reference), that requires roughly a further 7.0% cut in cost per billed unit.",
        links: [ald.url], loadOps: hjLoadOps(["alderson-90-unit"]) },
    ];
    fa.decompositionLine = "At the page-adopted 2.5 T size, replacing the declared topology weights {10,15,25,15,20,5,10} with the page-adjudicated evidence-informed NA blend {8,11,19,12,25,8,17} moves the result from \u224858 (58.24) to \u224858 (58.43) — a move of under half a point, upward. The NA blend's two Trainium legs are WITHDRAWN from this default on evidence grounds and their declared weight renormalizes over the remaining five, so this is a declared seven-leg topology set against a five-leg default and the renormalization is inside the move rather than beside it; the serve-feasibility rule removes nothing further at this size. The Legacy 5 T Musk-relative size case (read as likely the prior flagship, Opus 4.6; referent unverified) now computes \u224853, and under it the feasibility rule additionally removes H100.";
    fa.mostPlausible = { valueLabel: "above 80%", tierSource: "SemiAnalysis (Dylan Patel)",
      claims: [hjClaim(pat), hjClaim(sa80)], adopted: "page adjudication of source reliability, 2026-07-24" };
  }
  // The emitted token strings — built HERE so every transport renders byte-identical
  // text (one formatter by construction). The value tokens carry the identity INSIDE
  // the token (single shareable unit).
  fa.tokens = {
    planningPoint: pct(fa.planningPoint.marginPct) + " — public-evidence reference reading, policy-labeled scenario",
    planningPointLine: "The conservative planning case, priced at low/committed planning rates: " + pct(fa.planningPoint.marginPct)
      + " at the public-evidence reference — policy-labeled scenario (unit serving, not company GM), at the "
      + s.precision + " loaded-bytes planning policy (" + planningPolicy + " B/param), at the published list-price schedule under the reference cache/batch/discount mix.",
    bandLine: "Sampled at three loaded-bytes policy points (no continuity implied), all at the public-evidence reference: "
      + band.points.map(x => x.policyPoint + " B/param → " + (typeof x.value === "number" && isFinite(x.value) ? pct(x.value) + " — policy-labeled scenario" : "no numeric result")).join(" · ")
      + (membSens && membSens.some(x => x.wouldEnter.length || x.wouldLeave.length)
        ? " · membership note: values hold the default membership FIXED at the planning-policy point; "
          + membSens.filter(x => x.wouldEnter.length || x.wouldLeave.length)
            .map(x => "at " + x.policyPoint + " B/param " + [].concat(
              x.wouldEnter.length ? [x.wouldEnter.map(k => HW[k] ? HW[k].name : k).join("/") + " would re-enter the default"] : [],
              x.wouldLeave.length ? [x.wouldLeave.map(k => HW[k] ? HW[k].name : k).join("/") + " would leave the default"] : []).join(" and ")).join("; ")
          + " — those re-derived counterfactual values are NOT the sampled points above"
        : ""),
    lensSpanLine: fa.lensSpan ? "Span across " + fa.lensSpan.n + " declared scenario-preset alternatives at the public-evidence reference: "
      + pct(fa.lensSpan.loPct) + " to " + pct(fa.lensSpan.hiPct) + " — a span across declared alternatives, not a statistical statement." : null,
    trafficSpanLine: fa.trafficSpan ? "Span across " + fa.trafficSpan.n + " declared traffic-mix profiles at the public-evidence reference; as a span across declared alternatives, not a statistical statement: "
      + pct(fa.trafficSpan.loPct) + " to " + pct(fa.trafficSpan.hiPct) + "." : null,
    identityLine: "THE ANSWER, plainly labeled: " + fa.identity + ".",

    exclusionLine: membership && membership.excluded.length ? membershipExclusionClause(membership) : null,
    invitationLine: fa.whatWouldChangeIt + "; the rationale annex links every evidence row (" + fa.evidenceAnnexId + ").",
    /* FA higher-justifications tokens (memo v7 J-2): minted HERE — site, MCP and Worker
       render these bytes; the FA vocabulary sweep and the MCP twin byte-inclusion list
       extend over exactly these keys (higherJustificationEntries is an ordered ARRAY of
       rendered strings, one per group — the sweep flattens string arrays). */
    /* T5 rec 5 (GPT Pro 2026-07-29 §6, finding SV-2). Two things were wrong with the retired
       opening and both are fixed here. (a) it asserted a posterior judgment about REALITY; the
       reviewer's bar is that such a phrase is only licensed when the source exposes the same
       estimand, accounting boundary, period, fleet and billing basis — a paywalled report and a
       transcript sentence expose none of them, so the honest claim is about the REGISTRY. The
       retired wording is deliberately NOT quoted here: engine.js is a SERVED file, and a second
       review found the phrase surviving in this very comment (line-wrapped, which is also why a
       naive grep missed it). It is recorded where a record belongs — the review itself and the
       pinned edit set in tests/fa-justifications.test.mjs. (b) it sat inside THE ANSWER, which
       put an external analyst hypothesis into the calculator's own answer hierarchy; the node
       now renders in its own #fa-analyst-hypothesis section, a SIBLING of #final-answer
       (site/index.html). An earlier cut of this comment said "#fa-higher", which was true for
       about an hour and then was not — #fa-higher is itself inside #final-answer, which is
       exactly what the first relocation got wrong. The source claim itself is preserved
       verbatim, which is the half of the rec that says "Preserve the source claim".
       The KEY is deliberately still `mostPlausibleLine`: it is an internal token id anchored
       to the byte-pinned pre-M6 fixture (tests/fixtures-fa-pre-m6.json), and renaming it
       would rewrite a historical stale-loud baseline to cosmetic effect. */
    mostPlausibleLine: "The strongest external analyst hypothesis carried by this registry: above 80% — the strongest analyst tier this page carries (SemiAnalysis: Dylan Patel's transcript statement \"north of 80 percent for the API price\" on an Opus token, a direct source for his own words; and a coverage-described above-80% API-business gross-margin estimate from its paywalled 3Q26 report), ranked strongest by this page's adjudication of source reliability — an adopted analyst judgment, not a calculator output or provider disclosure, and not this page's estimate of any actual margin; the analyst's underlying calculations are unpublished. The conservative planning case does not reach that neighborhood; separately labeled constructions that DO reach it include, among others, the strategic-partner lens (\u224883.0 at the public-evidence reference), the strategic-partner ladder (\u224882 after the throughput switch and \u224884 after list-only billing, at the public-evidence reference), the two aggressive planning-vector routes (\u224880.6/\u224879.5 at the public-evidence reference), and the separate multi-setting owned-TCO route (\u224889.3 at the public-evidence reference).",
    higherJustificationsHeader: "This page's conservative planning case — priced at low/committed planning rates, NOT at market rents — computes to " + pct(fa.planningPoint.marginPct) + " at the public-evidence reference — a policy-labeled scenario output at the page-adopted flagship size (a 2\u20133 T planning band, scalar 2.5 T; the result now VARIES monotonically across the three sampled totals 2.0/2.5/3.0 T, because total parameter count reaches decode weight traffic on the replica-resident leg — the former identical-at-all-three behaviour was a symptom of the equation omitting total/resident geometry, not evidence of size robustness). The claims examined below include an above-80% tier (SemiAnalysis — Dylan Patel's transcript statement \"north of 80 percent for the API price\" on an Opus token, and the coverage-described above-80% API-business gross-margin estimate), whose underlying calculations are unpublished. How this page RANKS that tier against the others it carries is stated separately, outside this answer, because ranking other people's claims is a statement about the evidence record rather than one of this calculator's readings. Other public claims point higher still (90\u201395); separately, a model-generated scenario — zero claimant weight, shown only as a labeled stress case — gives 92\u201394 for Opus. Most of the remaining differences come from different scopes, cost bases, commercial mixes, and operating points — the full entries below identify the calculator changes that move toward each higher claim and quantify any remaining unreproduced gap (only where the calculator actually reaches a claim's neighborhood does the entry say so), and the compact entries say honestly where no bridge is constructed. Where a claim targets the same quantity this page models, the public evidence genuinely disagrees with the conservative case, and the entry says so. This page's own inputs are as assumption-dependent as the claims it examines: the flagship's total size is a page-adopted planning band informed by community estimates (which include lower 1.5\u20132 T readings), the active size is a working estimate, four of the five member rents are analyst-set (only the fifth names a public rate, and every default rent still sits at or below its public comparator — this is a low/committed planning vector, not a purchasable market one), utilization is a declared convention, the 15:1/60% traffic anchor is a page-declared convention, several throughput legs are transferred, joint-fit or representation-bridged rather than provider-validated — the two Trainium legs in particular carry NO matched serving anchor, and their unresolved batch form is why they are WITHDRAWN from this default rather than merely caveated inside it — and the fleet shares are inferred — the same standard cuts both ways. " + pct(fa.planningPoint.marginPct) + " at the public-evidence reference is a conservative, reproducible scenario, not a verified estimate of any provider's actual margin; above-80 is an adopted analyst reading, not a disclosure.",
    higherJustificationEntries: fa.higherJustifications.map(g => {
      const full = g.groupId.startsWith("g5-") === false;
      const head = g.groupId === "g1-teortaxes-9095" ? "TeorTaxes 90\u219295 (conditional) + the 90+ floor"
        : g.groupId === "g2-patel-semianalysis-80" ? "The 80+ number — Dylan Patel / SemiAnalysis"
        : g.groupId === "g3-gptpro-9294-lens" ? "GPT Pro consult 92\u201394 for Opus (model-generated) + the \u224883.0 lens"
        : g.groupId === "g5-baker-85" ? "Gavin Baker 85 (relayed reports)"
        : g.groupId === "g5-huatai-80" ? "Huatai above-80 API floor (relayed note)"
        : g.groupId === "g5-teortaxes-2025" ? "TeorTaxes ~80 inference-only (2025, dated)"
        : "Alderson ~90 class-wide";
      return head + " \u00b7 What it claims: " + g.whatItClaims
        + (full ? " \u00b7 What it does not claim: " : " \u00b7 Not claimed: ") + g.whatItDoesNotClaim
        + " \u00b7 Why the conservative case differs: " + g.bridge
        + " \u00b7 What would flip it: " + g.wouldFlip;
    }),
    decompositionLine: fa.decompositionLine,
    /* ================= b9 M6 (FA memo §2.9 + §17): the D-6 five-part surface =================
       These bytes ARE the memo's pinned templates; `{}` holes resolve through ONE formatter each
       (`pct` for both readings, so the two can never drift into different rounding conventions).
       Minted HERE so site, MCP and Worker render byte-identical text. */
    /* row 499 (owner ruling): THE HERO THE PAGE OPENS ON, named in the answer block. It states its
       own basis inside itself — whose estimate, at what lead — for the same reason the two readings
       below do, and it says plainly that the preset does not reproduce its author's stated figure,
       because a reader comparing the two would otherwise assume this page had rounded one of them. */
    landingReadingLine: pct(fa.landingReading.marginPct)
      /* Astra round 3 F9: a reader may now open on a default of their own, so this names the page's BUILT-IN
         opening state as such rather than asserting what every visit opens on. */
      + " — the reading this page OPENS on by default, its built-in opening state (a reader can make another scenario the default in their own browser): the "
      + (landing.name || landing.id).replace(/^\[[^\]]*\]\s*/, "")
      + " preset, at an algorithmic lead of " + fa.landingReading.leadMonths + " months."
      + " It is one independent estimate's declared settings executed here, not this page's own"
      + " judgment and not that estimate's own stated figure — where the two differ, the preset's"
      + " note says so rather than moving a dial to close the gap.",
    referenceReadingLine: pct(fa.planningPoint.marginPct)
      + " — public-evidence reference reading, policy-labeled scenario. Computed at an algorithmic"
      + " lead of 0 months with family multipliers at 1.0×.",
    c2LabelLine: "Quoted from the r4 adversarial adjudication (run B §C2, 2026-07-25), which is what"
      + " this public-evidence reference reading is: \"Transitional public-evidence repair scenario:"
      + " approximately 55–61%, midpoint 59%, under 50% paid-capacity occupancy, the reference"
      + " 15:1/cache/commercial mix, declared fleet weights, low/committed planning rents, and"
      + " unresolved Trainium throughput.\" (\"Under\" there means UNDER THE"
      + " ASSUMPTION OF: the live reference holds utilization — which is what this page now calls"
      + " what the quotation above calls paid-capacity occupancy — at exactly 50%, not below it."
      /* J-10 run-3 dive A (P1): the second clarifier in the SAME ratified slot as the first. The
         quoted bytes are not edited — "midpoint 59%" is the adjudication's own wording, and it is
         not the arithmetic midpoint of either span it sits beside. Saying so here is cheaper than
         letting a reader find the discrepancy and conclude the block cannot do arithmetic. */
      + " And the quoted \"midpoint\" is that adjudication's word for the reference point it selected,"
      + " not an arithmetic centre: the rounded 55–61 span centres on 58, and the 55.2–61.3 public-only"
      + " reconstruction reported below centres on 58.25.)"
      /* im-arc T4 fold (2026-08-24), memo §4: the live reference reading had moved BELOW the zone
         this adjudication quoted. The quoted bytes are not edited — they are someone else's words
         about a dated reading — so the divergence is DISCLOSED beside them instead, with the
         reason. A page that silently let a quotation drift out of agreement with its own live
         arithmetic would be making the adjudication say something it did not say.

         im-release-edit-r2 (2026-09-10), owner ruling d-20260910-im-adopt-fleet-rents-and-correct-grok:
         and this is why the RELATION is now derived rather than asserted. The sentence said "sits
         BELOW" as a literal. Adopting planning rents for GB200, GB300 and Trainium3 moved the live
         reference from ≈51% to ≈58% — back INSIDE the quoted zone — and a hardcoded "below" would
         have shipped as a false statement about the page's own arithmetic on the very release that
         made it false. The zone endpoints are still the adjudication's own bytes and are still not
         edited; only the sentence describing where this page's live reading falls against them
         moves, and it moves because it is computed. */
      + (fa.planningPoint.marginPct < 55
          ? " Since 2026-08-24 the live reference reading sits BELOW that quoted zone, at "
            + pct(fa.planningPoint.marginPct) + ": the im-arc T4 fold found no admissible public"
            + " planning rate for GB200, GB300 or Trainium3, so those legs no longer price and the"
            + " reference is computed over the four that do."
          : fa.planningPoint.marginPct > 61
          ? " The live reference reading now sits ABOVE that quoted zone, at "
            + pct(fa.planningPoint.marginPct) + "."
          : " Between 2026-08-24 and 2026-09-10 the live reference reading sat BELOW that quoted"
            + " zone, because the im-arc T4 fold found no admissible public planning rate for"
            + " GB200, GB300 or Trainium3 and the reference was computed over the four legs that"
            + " priced. Since the owner adopted provisional planning rents for those three legs on"
            + " 2026-09-10, all seven price and the live reference reading sits INSIDE the quoted"
            + " zone again, at " + pct(fa.planningPoint.marginPct) + ". Agreement recovered by"
            + " adopting an assumption is not the same evidence as agreement that was there all"
            + " along, and this sentence is not claiming it is.")
      + " The quoted zone is left exactly as it was written.",
    /* The ONE vocabulary-scanner exemption (memo §2.7 D-6c): a byte-pinned §C2 verbatim under a
       scanner-visible negation frame. Every other token stays swept. */
    mustNotBeCalledLine: FA_MUST_NOT_BE_CALLED_FRAME + FA_MUST_NOT_BE_CALLED_VERBATIM,
    convergenceLine: "Three DIFFERENT METHODS inside one adjudication overlap on this zone. The r4"
      /* J-10 run-3 dive A (P1): "internal-documents" read as if it could mean NONPUBLIC ANTHROPIC
         documents, which would materially overstate this page's evidentiary access in the very block
         that defines the PUBLIC-evidence reading. The r4 run-B pack was this project's own registries. */
      + " adversarial review ran a public-only reconstruction, a reconstruction from this project's own"
      + " internal research record and"
      + " a physics-only bound, landing at 55.2–61.3, 58–64 and 55–70 respectively; they overlap between"
      + " 58 and 61.3. That is agreement across METHODS WITHIN ONE REVIEW — not independent"
      + " corroboration, not a statistical result, and no distribution is implied.",
    priorReadingLine: pct(fa.priorReading.marginPct)
      + " — the calculator's own default reading, policy-labeled scenario. Until 2026-08-06 this was"
      /* M8 exit-gate council F1 (2026-08-13): this clause was minted 2026-08-06 when the landing
         preset carried no lead, and went stale two days later when the opener flipped to gptpro-r3
         (+2 months) — the FA then contradicted its own landingReading in one render. DERIVED now
         from the landing's own leadMonths; T-3b asserts the two tokens agree. */
      + " also the state the calculator opened in; by default it now opens on a named estimate preset carrying "
      + (fa.landingReading.leadMonths
          ? "its author's " + (fa.landingReading.leadMonths > 0 ? "+" : "") + fa.landingReading.leadMonths + "-month algorithmic-lead assumption"
          : "no algorithmic lead")
      + ", and this reading is one selection away in the same control."
      + " It is the reference reading plus exactly one declared assumption: the"
      + " owner-ratified " + (sPrior.trendMonths >= 0 ? "+" : "") + sPrior.trendMonths
      + "-month algorithmic-lead prior for closed frontier labs, which at the ratified "
      + sPrior.trendRate + "×/yr rate divides modeled cost-out by E ≈ " + trendFactor(sPrior).toFixed(3)
      + ". It is a scenario prior, not a measurement — this page identifies no public"
      + " disclosure of any lab's private serving-stack lead, and has not measured one.",
    bridgeLine: "How the readings relate. The public-evidence reference sits numerically below the"
      + " adopted analyst reading, and is built on 50% utilization, a discounted billing"
      + " mix, no generalized speculative-decode credit, unresolved Trainium throughput and a"
      + " low/committed planning-rent perimeter. Those are what make THIS page's number what it is;"
      + " because the analyst's own calculations are unpublished, this page does not claim they"
      + " explain the gap. The calculator's own default sits above the reference by exactly one declared"
      + " assumption — the owner-ratified " + (sPrior.trendMonths >= 0 ? "+" : "") + sPrior.trendMonths
      + "-month algorithmic lead, which divides modeled cost-out by E ≈ " + trendFactor(sPrior).toFixed(3)
      + " — and by nothing else: the two readings share every other input. Neither calculator reading is"
      + " evidence that any provider's real margin is any particular number. At the public-evidence reference — algorithmic lead 0 months,"
      /* J-10 run-3 dive B (P0): this sequence IS the strategic-partner LADDER — g3 defines it and
         ends it at ≈81 — while the strategic-partner LENS computes ≈83.1 and lands LOWER because it
         also swaps the fleet. Calling the ladder "higher lenses" is the same lens/ladder category
         error C4 removed from mostPlausibleLine, and it lets a reader attach ≈81 to the lens. */
      + " family multipliers 1.0× — this page's strategic-partner ladder reaches"
      + " \u224880 after adopting partner rates and higher occupancy, \u224883 after then switching to the"
      + " throughput serving regime, and \u224885 after additionally taking a list-only billing mix"
      + " — alternative scenarios, not findings."
      /* v2.2.0 (row 441, owner ruling q-row441-ref-and-bridge, 2026-08-06): the LEGACY bridge —
         FA-arc acceptance rows G1A-1 (name the older public figure and explain how it became this
         one) and G1A-3 (separate what the size revision moved from what the margin-evidence
         adjudication moved). It lives in THIS token rather than a new node because it is the job the
         bridge block already does: relating readings to one another. The three deltas are HISTORICAL
         waypoints, each measured by executing that ref's own engine at the landing default
         (opus/median) — 4aff0a8 76.7784, 1b50cb0 35.1404, 53f9897 37.2066, a1ff40d 51.1806,
         04d92ec 68.9840 — so they are literals here, while the live reference reading stays on the
         ONE `pct` formatter and cannot drift into a second rounding convention. G1A-3 names two
         mechanisms; the measurement found a third and larger one, and naming only the two would
         misattribute the move. */
      + " How this page's earlier figure relates to these readings. Until 2026-08-06 this page"
      + " published \u224877%; this is the first version whose numbers have been through a full"
      + " adversarial review, and the earlier figure is best read as a pre-review draft rather than"
      + " a retracted claim. Nothing shared before that date silently re-renders at a new number: a"
      + " pre-v5 share link no longer resolves at all and says so, and a link carrying the figure it"
      + " was shared at renders that figure beside the current one. The distance was not one"
      + " adjustment but three, and only the last was about margins: a rebuild of how this page"
      + " models SERVING (the roofline display path, the capacity-width solver and"
      + " serve-feasibility-filtered fleet membership, 2026-07-19..23) moved it by far the most; a"
      + " model-size revision moved it slightly back; and the margin-evidence adjudication of"
      + " 2026-07-26 raised it to the " + pct(fa.planningPoint.marginPct) + " public-evidence reference reading above. The"
      + " owner-ratified algorithmic-lead prior accounts for the rest of the way to the"
      + " calculator's own default reading. All of these are differences between scenario readings"
      + " of this calculator, not measured changes in anyone's economics.",
    basisDeclarationLine: "Every calculator figure in the explanations below is the public-evidence"
      + " reference reading — an algorithmic lead of 0 months, family multipliers at 1.0× — unless that"
      + " figure names its basis otherwise where it stands. The calculator's own default reading, "
      + pct(fa.priorReading.marginPct) + ", carries the ratified prior and is shown above.",
    execSummaryFrameLine: "What would have to be true to reach the higher readings. Four of the rows"
      + " below move exactly one control from the calculator's own default state ("
      + pct(fa.priorReading.marginPct) + ") and show what the engine then computes — each is a state you"
      + " can reproduce by moving that one control. One row names a lever this page cannot price on"
      + " public evidence and says so instead of showing a number; it states what receipts would have to"
      + " exist. The rows are ordered by declared plausibility — the order this page's owner set — and"
      + " are deliberately NOT sorted by result. These are estimates of what would have to be true, not"
      + " claims that any of it is true.",
    executiveSummaryRows: execSummaryRowTokens(m, median, pct),
  };
  return fa;
}

/* R3 (design memo D-6): the TYPED membership-sensitivity record. The three-point
   policy band re-evaluates VALUES on the FIXED central-policy membership (pointwise
   algebra — comparable points); THIS record separately discloses at which sampled
   points the membership itself would differ. Contract: (i) it never alters the value
   band's points or argMin/argMax; (ii) counterfactual margins under re-derived
   membership are NOT the band points and are never mixed into them; (iii) round-trips
   on every transport. */
function membershipSensitivity(fleetId, s, supplied) {
  const central = deriveDefaultFleetMembership(fleetId, s, supplied);
  if (!central) return null;
  const fleet = ED_FLEET.FLEETS[fleetId];
  const ctx = supplied || scenarioContext(s);
  const m = MODELS.find(x => x.id === ctx.modelId);
  const nat = ED_TRAFFIC_PROFILES.find(t => t.id === (m && m.nativeTraffic)) || ED_TRAFFIC_PROFILES[0];
  const st = Object.assign(structuredClone(s), {
    blend: Object.fromEntries(HW_ORDER.map(k => [k, fleet.legs[k] || 0])),
    ioRatio: nat.ioRatio, cacheHit: nat.cacheHit,
  });
  const canonicalCtx = { modelId: ctx.modelId, profileId: nat.id, customDonor: ctx.customDonor };
  const centralMembers = new Set(central.members.map(l => l.hwKey));
  /* im-vet-six-repairs (2026-09-20), finding E1. This record answers ONE question — would the
     loaded-bytes POLICY change the default's membership — so a leg excluded on EVIDENCE grounds
     must not appear in it. A withdrawal is a judgment about the row's own evidence and does not
     move with the policy at any point, so reporting it as "would enter" at every sampled point
     would be a sensitivity claim about something that is not sensitive to this axis. The legs are
     skipped here and disclosed by the exclusion clause instead, which is where they belong. */
  const withdrawnHere = (fleet && fleet.withdrawn) || {};
  const policyScoped = Object.keys(fleet.legs).filter(k => !withdrawnHere[k]);
  return CAPACITY_POLICY_BAND.map(policyPoint => {
    const feas = feasibility(st, canonicalCtx, { loadedWeightBytesPerParam: policyPoint });
    const atPoint = new Set(feas.legs.filter(l => l.renderableUnderPolicy === true).map(l => l.hwKey));
    return { policyPoint,
      wouldEnter: policyScoped.filter(k => atPoint.has(k) && !centralMembers.has(k)).sort(),
      wouldLeave: policyScoped.filter(k => !atPoint.has(k) && centralMembers.has(k)).sort() };
  });
}

/* R1-originated feasibility redesign, LIVE since R2: claim-bearing wrappers consume
   the capacity solve through this domain-width enumeration and sealed handoff. */
function enumerateLegalWidths(shapes) {
  switch (shapes.kind) {
    case "range-step": { const out = []; for (let w = shapes.min; w <= shapes.max; w += shapes.step) out.push(w); return out; }
    case "node-multiple": { const out = []; for (let w = shapes.nodeWidth; w <= shapes.max; w += shapes.nodeWidth) out.push(w); return out; }
    case "explicit-set": return [...shapes.widths];
    case "documented-slices": { // conservative doubling enumeration; exact per-shape catalog remains unregistered (receipted)
      const out = []; for (let w = shapes.min; w <= shapes.max; w *= 2) out.push(w); return out; }
    case "multi-rack": return []; // scale-out is excluded until cross-rack fabric, latency, and exact legal shapes are modeled
    default: throw new Error("unknown hardwareLegalShapes kind '" + String(shapes.kind) + "'");
  }
}
const CAPACITY_BYTES_POLICY = Object.freeze({ // memo §0-bis: capacity-only planning defaults (dive §B); NEVER touches sW
  fp8: 1.0, fp4: 0.65, bf16: 2.0,
});
function placementEngagement(data, ctx, s, policyOverride) {
  const prow = data.WEIGHT_PLACEMENT ? data.WEIGHT_PLACEMENT[ctx.modelId] : undefined;
  const disengaged = prow ? [
    s.total !== prow.engineTotalB ? "total edited off the published value (" + prow.engineTotalB + "B)" : null,
    data.PRECISION_TIER_MAP[s.precision] !== prow.precisionTier ? "scenario precision '" + s.precision + "' does not map to the row's " + prow.precisionTier + " checkpoint" : null,
    policyOverride ? "caller policy-sensitivity point (uniform path by contract)" : null,
  ].filter(Boolean) : [];
  return { prow, disengaged, engaged: !!(prow && disengaged.length === 0) };
}
function solveCapacityWidth(hwKey, s, opts) {
  opts = opts || {};
  if (Object.prototype.hasOwnProperty.call(opts, "L"))
    throw new Error("solveCapacityWidth: L is the representative decode position; capacity requires LPeak");
  const ED2 = ED_CAPACITY; // resolved once at module parse (see ED_CAPACITY above)
  const domain = ED2.HW_DOMAINS[hwKey];
  if (!domain) return null; // rubin / undeclared rows: no domain, no solve (fail-closed)
  const R = rooflineCore();
  const ctx = opts.ctx || scenarioContext(s);
  const arch = R.resolveArch(ctx.modelId, ctx.customDonor);
  const tr = R.resolveTrafficLengths({ profileId: ctx.profileId ?? null, ioRatio: s.ioRatio });
  const contextWindow = R.contextWindowStatus(arch, tr, contextLimitSourceFor(ctx));
  if (contextWindow.state === "exceeded-registered-limit")
    throw new R.RooflineDataError("context window rejected before capacity solve: " + contextWindow.reason);
  const peakKvTokens = opts.LPeak != null ? opts.LPeak : tr.LPeak;
  const policy = opts.loadedWeightBytesPerParam != null ? opts.loadedWeightBytesPerParam
    : CAPACITY_BYTES_POLICY[s.precision];
  const widths = enumerateLegalWidths(domain.scaleUp.hardwareLegalShapes);
  if (!widths.length) return null;
  /* R2 §1.5 (placement registry; assembly-notes R-8): the ENGAGEMENT contract. A solve
     uses the published component-placement residency IFF every condition holds — model
     has a registry row; the total slider sits at the row's published value (an edited
     total is no longer the published model); the scenario precision maps to the row's
     tier (the component byte counts describe ONE published checkpoint); and no caller
     policy scalar is in play (a sensitivity point ALWAYS solves the uniform path — the
     three-point band remains the uniform-policy sensitivity). Anything else: the
     uniform+policy form, labeled, exactly as pre-R2. Donor transfer NEVER engages a row
     (keyed on the scenario's own modelId, never the donor). */
  const engagement = placementEngagement(ED2, ctx, s, opts.loadedWeightBytesPerParam != null);
  const { prow, disengaged } = engagement;
  const placementEngaged = engagement.engaged;
  // R1-impl P1-3: bDeclared derives from the operating-point registry (regime = s.interact)
  // by default; an explicit caller value is a labeled override.
  let bDeclared = opts.bDeclared;
  let capacityTargetBatchSource = opts.bDeclared != null
    ? (opts.capacityTargetBatchSource || "caller-override") : null;
  if (bDeclared == null) {
    const reg = ED2.OPERATING_POINTS && ED2.OPERATING_POINTS[hwKey];
    const regime = s.interact || "balanced";
    const cell = reg && reg[regime];
    if (cell) {
      if (typeof cell.b === "number") bDeclared = cell.b;
      else if (cell.rule && typeof cell.mult === "number" && reg.balanced && typeof reg.balanced.b === "number")
        bDeclared = cell.mult * reg.balanced.b;
      if (bDeclared != null) capacityTargetBatchSource = "OPERATING_POINTS." + hwKey + "." + regime;
    }
  }
  const solved = R.capacityWidthSolve({ arch, totalB: s.total, hwKey, precision: s.precision,
    hbmBytesOverride: opts.hbmBytesOverride, // b9 M4 (memo §2.9): joins the solve identity
    LPeak: peakKvTokens, widths, loadedWeightBytesPerParam: placementEngaged ? undefined : policy,
    bDeclared, placementModelId: placementEngaged ? ctx.modelId : undefined });
  const shapesKind = domain.scaleUp.hardwareLegalShapes.kind;
  // R3 (D-10): economics/slo/fullMemory populate HERE, at the leg, from typed existing
  // evidence (latencyPreferredWidth where published; CALIBRATION/PRICE_EVIDENCE classes;
  // the declared-operating-point satisfiability the solve just computed).
  const slots = legStatusSlots(hwKey, solved, domain);
  return Object.assign(solved, {
    // R1-impl P1-6 vector, R3-populated (weightCapacity from the solve; slots per D-10;
    // anything without evidence stays UNVERIFIED, first-class).
    statusVector: {
      weightCapacity: solved.capacityMinimumUnderUniformPolicy != null ? "FEASIBLE-under-policy" : "INFEASIBLE-in-domain",
      fullMemory: slots.fullMemory, topologyLegal: "within-registered-scale-up-shapes",
      slo: slots.slo, economics: slots.economics,
    },
    // R1-impl R2 NEW-P1 (+ R3 residual): renderable-under-policy requires the DECLARED
    // operating point to be AFFIRMATIVELY satisfiable in-domain — fail-closed positive
    // equality. null (no declared operating point derivable: unregistered regime, no
    // registry row, no caller override) is NOT renderable; a capacity floor alone must
    // never masquerade as a policy-feasible hero leg.
    renderableUnderPolicy: solved.capacityMinimumUnderUniformPolicy != null
      && solved.declaredOperatingPointSatisfiable === true,
    // R2 §1.5: TRUE iff the published component-placement residency drove THIS solve
    // (registry row engaged per the contract above). Closed models and every disengaged
    // state stay false (memo §0-ter) — the boolean is now non-vacuous for registry models.
    placementVerified: solved.placementApplied === true,
    receipt: {
      capacityMinimumUnderUniformPolicy: solved.capacityMinimumUnderUniformPolicy,
      declaredOperatingPointWidth: solved.declaredOperatingPointWidth,
      decodeRepresentativeTokens: tr.L,
      peakKvTokens,
      peakKvDefinition: "ISL + OSL (terminal live KV cache)",
      capacityTargetObjective: opts.capacityTargetObjective ||
        (opts.bDeclared != null ? "caller-supplied capacity-target fit" : "declared-operating-point fit"),
      evidenceQuality: slots.econClasses, // R3 D-10: the TYPED economics inputs (aggregation channel — never string-parsed)
      // R3 D-11: published prefill/decode role widths as EVIDENCE ANNOTATIONS —
      // fail-closed resolution against the typed provenance registry; NEVER solver
      // inputs (the solve stays uniform-width across roles; role-split solving is
      // explicitly re-scoped OUT of R3 with its own future design gate).
      roleWidthEvidence: (domain.observedWorkerCandidates || [])
        .map(c => {
          const src = ED2.WORKER_CANDIDATE_SOURCES ? ED2.WORKER_CANDIDATE_SOURCES[c.sourceCaseId] : null;
          return src && src.role ? { caseId: c.sourceCaseId, role: src.role, width: src.width,
            evidenceClass: src.evidenceClass, label: src.label } : null;
        }).filter(Boolean),
      capacityTargetBatch: bDeclared != null ? bDeclared : null,
      capacityTargetBatchSource,
      residencyBasis: placementEngaged ? "placement-registry" : "uniform-policy",
      placementRegistry: prow ? {
        id: prow.modelId, engaged: placementEngaged,
        disengagedReasons: placementEngaged ? null : disengaged,
        componentSource: prow.componentSource, placementSource: prow.placementSource,
        redundancyNote: prow.redundancyNote,
        expertParams: prow.expertParams, routedExpertsPerLayer: prow.routedExpertsPerLayer,
        moeLayers: prow.moeLayers, redundantExperts: prow.redundantExperts,
        replicatedParams: prow.replicatedParams,
        expertBytesPerParam: prow.expertBytesPerParam, replicatedBytesPerParam: prow.replicatedBytesPerParam,
        perRankRoutedExpertsAtCapacityMin: placementEngaged && solved.capacityMinimumUnderUniformPolicy != null
          ? Math.ceil((prow.routedExpertsPerLayer + prow.redundantExperts) / solved.capacityMinimumUnderUniformPolicy) : null,
      } : null,
      conservativeSubsetNote: shapesKind === "documented-slices"
        ? "legal set is the conservative common-shape subset (doubling grid); intermediate multiples-of-4 torus topologies exist and may narrow the minimum — exact per-shape catalog is unregistered"
        : null,
      // R1-impl R3 F5: candidates-vs-legal-set coincidence is a RECEIPTED evidence
      // limitation, never a silent construction (ascend: catalog UNVERIFIED).
      legalSetProvenanceNote: domain.scaleUp.hardwareLegalShapes.provenance === "observed-worker-widths-only"
        ? "legal set is seeded from observed worker widths only — the legal slice catalog within this domain is UNVERIFIED, so the legal set and the observed candidates coincide by evidence limitation, not by construction; exact legal slice catalog is unregistered"
        : null,
      objective: placementEngaged ? "capacity-min under published component placement" : "capacity-min under uniform policy",
      loadedByteValue: placementEngaged ? null : policy,
      loadedByteSource: placementEngaged
        ? "component-placement registry (published per-component loaded bytes; see placementRegistry) — the uniform policy scalar did not drive this solve"
        : opts.loadedWeightBytesPerParam != null
          ? "caller-supplied (sensitivity point)" : "CAPACITY_BYTES_POLICY (analyst planning default, dive §B; capacity-only, never sW)",
      legalShapeSet: widths, legalShapeSetVersion: "r1-domains-v1",
      domainTier: domain.scaleUp.name, bandwidthClass: domain.scaleUp.bandwidthClass,
      domainEvidenceClass: domain.scaleUp.evidenceClass,
      role: "uniform-width across roles (published role widths are evidence annotations only; role-split solving is deferred)",
      placementModelStatus: placementEngaged
        ? "component-placement registry ENGAGED (assembly-notes R-8): routed experts EP-sharded, attention/dense/shared expert/embeddings replicated per rank; placement verified from the row's published serving discipline"
        : prow
          ? "uniform-policy; placement registry row exists but is DISENGAGED (" + disengaged.join("; ") + ") — placement UNVERIFIED for this solve"
          : "uniform-policy; placement UNVERIFIED (only the live component-placement registry can verify placement; closed models stay policy-labeled)",
      modelDivisibilityStatus: "not evaluated by the current capacity solver (receipted)",
      bFeasAtCapacityMin: (() => { const row = solved.perWidth.find(p => p.width === solved.capacityMinimumUnderUniformPolicy); return row ? row.bFeas : null; })(),
      nextSmallerWidthRejectionReason: (() => {
        const cap = solved.capacityMinimumUnderUniformPolicy;
        if (cap == null) return "no legal width fits (domain-capacity infeasible)";
        const i = widths.indexOf(cap);
        return i > 0 ? ("width " + widths[i - 1] + ": bFeas < 1 under the " + (placementEngaged ? "published component placement" : "policy")) : "capacity min = smallest legal width";
      })(),
      observedVsAnalyst: "solver output — never an observed deployment (memo §0-bis naming rule)",
    },
  });
}

function landingHeroSuppressed(s, supplied, mode) {
  // R3 (D-3a): the gate-6 decision consumes the DERIVED membership, mode-aware.
  // mode defaults to the shipped "policy-labeled" semantics when omitted (MCP and
  // every mode-independent transport call it bare — MCP is mode-independent by the
  // R2 execution record).
  return heroSuppressionDecision(deriveDefaultFleetMembership(ED_FLEET.DEFAULT_FLEET_ID, s, supplied), mode);
}

/* R2 (§1.10; memo §0-ter): the shared POLICY clause — the width story every surface
   welds alongside the renormalization clause. Names the loaded-bytes policy identity,
   every leg not renderable under it (with its typed reason), and the per-leg receipt
   welds (legal-set provenance / conservative-subset limitations) where present.
   Replaces the retired legacy replica-width sensitivity clause (P1-7). */
function policyCapacityClause(fleetRenderable) {
  const f = fleetRenderable;
  if (!f || !f.policy) return "";
  const failing = (f.legStatuses || []).filter(l => !l.renderableUnderPolicy);
  // R2 §1.5: a placement-engaged fleet's width story names the published component
  // placement, not the uniform policy scalar (which did not drive the solve).
  const parts = [f.policy.residencyBasis === "placement-registry"
    ? "capacity widths solved per leg from the published component-placement registry — routed experts EP-sharded; attention/dense/shared expert/embeddings replicated per rank ("
      + f.policy.placementComponentSource + "); placement verified; solver output — never an observed deployment"
    : "capacity widths solved per leg under the declared loaded-bytes planning policy ("
      + f.policy.value + " B/param — " + f.policy.source + "); solver output — never an observed deployment"];
  if (failing.length)
    parts.push("not renderable under this policy: " + failing.map(l => l.hwKey + " — " + l.note).join("; "));
  const welds = [];
  for (const l of (f.legStatuses || [])) {
    if (l.legalSetProvenanceNote) welds.push(l.hwKey + ": " + l.legalSetProvenanceNote);
    if (l.conservativeSubsetNote) welds.push(l.hwKey + ": " + l.conservativeSubsetNote);
  }
  return parts.concat(welds).join(". ") + ".";
}
/* R3 (design memo D-11): the ONE role-width evidence formatter — tooltip + MCP text
   render published prefill/decode role widths from the receipt's typed annotations.
   Absent where nothing is published (never inferred from fabric class). */
function roleWidthEvidenceClause(roleWidthEvidence) {
  if (!roleWidthEvidence || !roleWidthEvidence.length) return "";
  return "published role widths (evidence annotations — never solver inputs; the solve is uniform-width across roles): "
    + roleWidthEvidence.map(r => r.role + " " + r.width + " [" + r.evidenceClass + "] " + r.label).join("; ");
}
function fleetRenderableDisclosure(fleetRenderable, primary, membership) {
  // R3 (family 33): pinned composition order — membership/renderability clause FIRST,
  // policy/width clause second; one ordering on every transport.
  return [fleetRenderableClause(fleetRenderable, primary, membership), policyCapacityClause(fleetRenderable)]
    .filter(Boolean).join(" ");
}
function blendedCost(s, kind, activeOverride, supplied) {
  return blendedCosts(s, activeOverride, supplied)[kind === "in" ? "cIn" : "cOut"];
}
// Canonical billed price-mix / served cost-mix math — the SINGLE source of truth for every
// surface that shows a margin (hero, per-hw margin chart, per-generation chart, normalized
// table, subscription chart). Takes already-computed per-token costs so callers can source
// them from a blend (workload) or a single accelerator (workloadOnHw) — the billing math
// itself never varies by hardware.
function computeMix(cIn, cOut, s) {
  const R = s.ioRatio, h = s.cacheHit / 100;               // serving-side prefix-reuse share (cost)
  const hb = (s.billCacheHit ?? s.cacheHit) / 100;         // billable cached-input share (revenue); null = assumed equal
  const cCache = cIn * (s.cacheCost / 100);
  const costMix = (cOut + R * ((1 - h) * cIn + h * cCache)) / (R + 1);
  const discMult = (1 - (s.batchShare / 100) * 0.5) * (1 - s.discount / 100);
  const w = (s.cacheWriteShare || 0) / 100, wm = (s.cacheWriteMult || 100) / 100;
  const freshBill = s.priceIn * ((1 - w) + w * wm); // fresh input; written share bills at the write premium
  const priceMixList = (s.priceOut + R * ((1 - hb) * freshBill + hb * s.priceIn * (s.cacheReadMult / 100))) / (R + 1);
  const priceMix = priceMixList * discMult;
  return { cIn, cOut, cCache, costMix, priceMix, priceMixList, margin: priceMix > 0 ? 1 - costMix / priceMix : NaN };
}
function workload(s, activeOverride, supplied, renderOpts) {
  const costs = blendedCosts(s, activeOverride, supplied, renderOpts);
  return { ...computeMix(costs.cIn, costs.cOut, s), fleetRenderable: costs.fleetRenderable,
    composition: costs.composition, ...(costs.coverage ? { coverage: costs.coverage } : {}),
    procurementBasis: costs.procurementBasis, bases: costs.bases };
}
/* R2 (§0-ter/§0-quater): the generic emitter-layer policy-sensitivity wrapper —
   re-computes the calling SURFACE'S OWN metric at the three SAMPLED policy points
   {0.55, 0.65, 1.05}, in that surface's own units. argMin/argMax are COMPUTED, never
   assumed; nothing may imply continuity; the policy value is an engine constant under
   ENGINE_REVISION and is NEVER encoded into links or persisted state. */
const CAPACITY_POLICY_BAND = Object.freeze([0.55, 0.65, 1.05]);
function evaluateAtPolicyBand(fn) {
  const points = CAPACITY_POLICY_BAND.map(p => ({ policyPoint: p, value: fn(p) }));
  const finite = points.filter(x => typeof x.value === "number" && isFinite(x.value));
  const label = "3-point sampled loaded-bytes policy sensitivity (no continuity implied)";
  if (!finite.length) return { sampled: true, points, argMin: null, argMax: null, label };
  let mn = finite[0], mx = finite[0];
  for (const c of finite) { if (c.value < mn.value) mn = c; if (c.value > mx.value) mx = c; }
  return { sampled: true, points, argMin: mn.policyPoint, min: mn.value,
    argMax: mx.policyPoint, max: mx.value, label };
}
// Same billing math on a SINGLE accelerator (not the blend) — used by the per-hw margin chart
// and the per-generation chart. `hw` is a hardware spec object (an HW[key] entry, or RUBIN,
// which has no HW key since it has no public serving anchor).
function workloadOnHw(hw, s, activeOverride, supplied, renderOpts) {
  const cIn = costPerMtok(hw, s, "in", activeOverride, supplied, renderOpts);
  const cOut = costPerMtok(hw, s, "out", activeOverride, supplied, renderOpts);
  const renderable = isFinite(cIn) && isFinite(cOut);
  const rp = hw === RUBIN ? null : rooflinePoint(hw, s, activeOverride, supplied, renderOpts);
  const leg = { k: hwKeyFor(hw), wt: 1, renderable,
    renderableUnderPolicy: rp && rp.solved ? rp.solved.renderableUnderPolicy === true : renderable,
    placementVerified: rp && rp.solved ? rp.solved.placementVerified === true : false,
    statusVector: rp && rp.solved ? rp.solved.statusVector : null,
    capacityReceipt: rp && rp.solved ? rp.solved.receipt : null,
    reason: rp && rp.point ? rp.point.reason || null : null,
    contextWindow: rp && rp.point ? rp.point.contextWindow || null : null };
  return { ...computeMix(cIn, cOut, s),
    fleetRenderable: { renderableLegs: renderable ? 1 : 0, totalLegs: 1,
      renderableWeightShare: renderable ? 1 : 0, ...fleetStatusFields([leg]) } };
}
function marginOnHw(hwKey, s, activeOverride, supplied, renderOpts) {
  return workloadOnHw(HW[hwKey], s, activeOverride, supplied, renderOpts);
}
function feasibility(s, supplied, renderOpts) {
  /* b9 M4 impl-gate P0-2: feasibility resolves through the SAME leg resolver as
     blendedCosts — a custom fleet's legs (and their hbm/power override channels) are
     what the tile must describe, never the bare S.blend registry rows. Identity
     refactor for non-custom states (resolver equivalence, T-2). */
  const resolved = resolveFleetLegs(s, renderOpts);
  const domKey = resolved.length ? resolved.slice().sort((a, b) => b.wt - a.wt)[0].k : "h100";
  const legs = resolved.map(({ k: hwKey, hw, wt: weight, cfLeg }) => {
    const legOpts = cfLeg ? { ...(renderOpts || {}), cfLeg } : renderOpts;
    const rp = rooflinePoint(hw, s, undefined, supplied, legOpts);
    const p = rp.point;
    return { hwKey, weight, opBasis: p.opBasis, infeasible: p.infeasible,
      capped: !p.infeasible && p.op.capped, b: p.infeasible ? null : p.op.b,
      bDeclared: p.op.bDeclared, bFeas: p.op.bFeas,
      ...(p.reason ? { reason: p.reason } : {}),
      ...(p.contextWindow ? { contextWindow: p.contextWindow } : {}),
      // R2 (§1.9): the two-boolean contract + five-status vector + solver receipt ride
      // every leg — the surfaces render FROM these, never from a side channel.
      renderableUnderPolicy: rp.solved ? rp.solved.renderableUnderPolicy === true : !p.infeasible,
      placementVerified: rp.solved ? rp.solved.placementVerified === true : false,
      statusVector: rp.solved ? rp.solved.statusVector : null,
      capacityReceipt: rp.solved ? rp.solved.receipt : null,
      /* b9 spec-decode LEVER (§8.4/§9.5): the ONE canonical per-leg DTO, attached to the ONE
         canonical object and propagated UNCHANGED to every renderer and transport. It carries
         CODES ONLY — {status, factorApplied, reasonCode} — and never prose: a machine caller must
         not receive human copy it might display untranslated, and the codes are the stable
         contract. Human copy is browser-rendered by calling specDecReasonText at the render site.
         `factorApplied` is the spec-decode factor ALONE, never the composed lever product. */
      specDec: specDecLegDisclosure(hw, s, supplied || scenarioContext(s), cfLeg),
      /* d-im-h800: the NVLink-cap lineage + disposition, CODES ONLY, same contract as specDec. */
      nvlinkCap: nvlinkCapLegDisclosure(hw, s, supplied || scenarioContext(s), cfLeg, rp),
      widthRendered: rp.widthRendered };
  });
  const renderableLegs = legs.filter(x => !x.infeasible).length;
  return { domKey, legs, renderableLegs, totalLegs: legs.length,
    renderableWeightShare: legs.filter(x => !x.infeasible).reduce((a, x) => a + x.weight, 0),
    dominant: legs.find(x => x.hwKey === domKey) };
}

/* ---------- formatting ---------- */
/* im-arc T4 fold (2026-08-24), memo §4: a value that does not exist is not a dollar amount. Three
   registered rows now carry no admissible public planning rate, and every surface that formats a
   registry value reaches this one formatter — so the absence is rendered here, once, in words,
   rather than throwing at a dozen call sites or printing a fabricated zero. */
const fmt$ = v => (v == null || !Number.isFinite(v)) ? "no registered rate"
  : v >= 100 ? "$" + Math.round(v).toLocaleString() : v >= 10 ? "$" + v.toFixed(1) : v >= 1 ? "$" + v.toFixed(2) : "$" + v.toFixed(v >= 0.1 ? 2 : 3);
const fmtPct = v => (v * 100).toFixed(v * 100 >= 99 || v * 100 < 0 ? 1 : 1) + "%";
const fmtNum = v => v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1e3 ? (v / 1e3).toFixed(1) + "k" : Math.round(v).toString();

/* ---------- preset application (v2 merge semantics) ---------- */
// Model presets own what a model IS and how it BILLS (params, precision, prices,
// cache tariff, native workload, fleet). Perspective presets own how it is
// PROCURED and RUN (cost basis, utilization, stack, latency, discounts).
// A perspective may pin a model-owned field only where the model is silent
// (e.g. the disclosure replay's H800 fleet applied to Opus). Dive replays
// deliberately override everything with the §10 dive's own assumptions.
const MODEL_OWNED_KEYS = ["active", "total", "precision", "priceIn", "priceOut", "cacheReadMult", "blend"]; // ioRatio/cacheHit moved to the TRAFFIC MIX axis (v2.1.2)
/* Traffic resolution (v2.1.2). sel = { mode: "native" | "explicit" | "custom" | "legacy-custom", profileId?, ioRatio?, cacheHit? }.
   Contract (plan-review P0, 2026-07-11):
   - replays are ATOMIC composites: their traffic is locked; selections cannot move them;
   - legacy-custom (migrated v2 links) outranks even replay locks — a shared link's numbers are its identity;
   - lenses/analysts never carry traffic; it comes from the selection (native resolves the model's profile). */
function resolveTraffic(m, p, sel = { mode: "native" }) {
  const prof = id => ED_TRAFFIC_PROFILES.find(t => t.id === id);
  if (sel && sel.mode === "legacy-custom")
    return { ioRatio: sel.ioRatio, cacheHit: sel.cacheHit, profileId: null, mode: "legacy-custom", locked: false,
             label: "legacy v2 link (reproduced under v2 semantics)", origin: "v2-migration" };
  const isRealDive = p && p.id === "dive" && m.dive; // dive on a card-less model = documented median fallback, not a replay
  if (p && p.kind === "replay" && (p.id !== "dive" || isRealDive)) {
    const own = isRealDive
      ? (m.dive.ioRatio !== undefined ? { ioRatio: m.dive.ioRatio, cacheHit: m.dive.cacheHit ?? 0 } : null)
      : (p.set.ioRatio !== undefined ? { ioRatio: p.set.ioRatio, cacheHit: p.set.cacheHit ?? 0 } : null);
    if (own) return { ...own, profileId: null, mode: "replay-locked", locked: true,
                      label: "locked by " + p.name, origin: "replay" };
    const t = prof(m.nativeTraffic) || ED_TRAFFIC_PROFILES[0];
    return { ioRatio: t.ioRatio, cacheHit: t.cacheHit, profileId: t.id, mode: "replay-locked", locked: true,
             label: t.name + " (model default — locked by replay)", origin: "replay+native" };
  }
  if (sel && sel.mode === "custom")
    return { ioRatio: sel.ioRatio, cacheHit: sel.cacheHit, profileId: null, mode: "custom", locked: false, label: "Custom", origin: "user" };
  if (sel && sel.mode === "explicit") {
    const t = prof(sel.profileId) || ED_TRAFFIC_PROFILES[0];
    return { ioRatio: t.ioRatio, cacheHit: t.cacheHit, profileId: t.id, mode: "explicit", locked: false, label: t.name, origin: "profile" };
  }
  const t = prof(m.nativeTraffic) || ED_TRAFFIC_PROFILES[0];
  return { ioRatio: t.ioRatio, cacheHit: t.cacheHit, profileId: t.id, mode: "native", locked: false,
           label: t.name + " (model default)", origin: "native" };
}
/* A preset value that is a PRIMITIVE has nothing to clone: structuredClone returns an equal
   primitive, and a primitive has no identity to detach. Everything else -- objects, and the
   function/symbol values structuredClone is REQUIRED to reject -- still goes through
   structuredClone, so a preset carrying an uncloneable value still fails exactly as loudly as it
   does today. Measured on the exact production challenge: applyPresetSettings issues 16.5
   structuredClone calls per invocation of itself, and 12.0 of them -- 80.8% -- are of a
   primitive (16,627 clones per adjust_rental_rate call, 12,060 of them primitives). One
   invocation makes 1,005 of these calls, and the live site makes one per render. */
function clonePresetValue(v) {
  switch (typeof v) {
    case "number": case "string": case "boolean": case "bigint": case "undefined": return v;
    default: return v === null ? v : structuredClone(v);
  }
}
function applyPresetSettings(m, p, sel = { mode: "native" }) {
  const s = structuredClone(DEFAULTS);
  const pset = (p.id === "dive") ? (m.dive || PERSPECTIVES.find(x => x.id === "median").set) : p.set;
  for (const [k, v] of Object.entries(pset)) if (!MODEL_OWNED_KEYS.includes(k)) s[k] = clonePresetValue(v);
  for (const [k, v] of Object.entries(m.set)) s[k] = clonePresetValue(v);
  for (const k of MODEL_OWNED_KEYS) if (pset[k] !== undefined && m.set[k] === undefined) s[k] = clonePresetValue(pset[k]);
  if (p.id === "dive" && m.dive) for (const [k, v] of Object.entries(m.dive)) s[k] = clonePresetValue(v);
  const tr = resolveTraffic(m, p, sel);
  s.ioRatio = tr.ioRatio; s.cacheHit = tr.cacheHit;
  /* b9 M5 (memo §9.2/§10.3): the trend prior is seeded from the selected model's LAB here — the
     ONE default chokepoint, exactly like the R3 fleet-membership seed above. This is a DEFAULT,
     never a user edit: the interlock machine does not transition on it (§10.3). Replays seed 0
     (§9.4). Perspective `set` blocks never carry trend/family keys, so the merges above cannot
     touch them and this assignment is the whole rule. */
  s.trendMonths = trendBaselineFor(m, p);
  /* b9 spec-decode LEVER (D-SD-5), the SECOND of the replay lock's three places — the engine
     backstop is the first and the codec is the third. No shipped perspective `set` carries
     `specDec` today, so this assignment is a no-op at this HEAD and the suite asserts that it is.
     It is written anyway, because the trend lock's history is the argument: a rule enforced in one
     place is a rule that a future preset can walk around, and this is the seed chokepoint every
     cleanliness, codec, MCP and Worker consumer flows through. */
  if (p && p.kind === "replay") s.specDec = DEFAULTS.specDec;
  SCENARIO_CONTEXT.set(s, makeScenarioContext(m, tr, s.customDonor, p && p.kind, p && p.id));
  /* R3 (design memo D-2): the ONE default-membership seed chokepoint. Every
     cleanliness/codec/MCP/worker consumer flows through this function, so binding
     here — and ONLY here — is what keeps site and MCP from ever disagreeing about
     what the default is. Binds IFF the model is in the landing fleet's scope AND
     nothing in the preset stack explicitly set `blend` (D-2e: broad inheritance is
     OWNED — every no-blend opus perspective moves to the filtered seed; explicit-
     blend presets, custom, and out-of-scope models keep their seeds, D-7).
     The state blend carries the members' DECLARED integer weights with excluded
     legs at 0 (assembly ruling RA-1 — byte-identical economics after blendWeights
     normalization; sliders/codec stay integer-stable). EMPTY derived membership
     does NOT bind (RA-4): blendWeights' zero-total fallback would silently render
     h100-only; the un-bound declared seed stays, and gate-6 suppresses the hero
     through the SAME derivation (memberLegCount === 0), so no number renders. */
  const blendExplicit = ("blend" in (m.set || {})) || ("blend" in pset)
    || (p.id === "dive" && m.dive && "blend" in m.dive);
  if (!blendExplicit) {
    const d = deriveDefaultFleetMembership(ED_FLEET.DEFAULT_FLEET_ID, s, SCENARIO_CONTEXT.get(s));
    if (d && d.memberLegCount > 0) {
      s.blend = Object.fromEntries(HW_ORDER.map(k => [k, 0]));
      for (const l of d.members) s.blend[l.hwKey] = l.declaredWeight;
    }
  }
  return s;
}

/* ---------- pairing scopes (moved from app.js in v2.1.2 so tests exercise the real logic) ---------- */
function pairingWarning(m, p) {
  const chinaModels = ["dsr1", "dsv4", "dsv4f", "glm", "glm47", "kimi"];
  if ((p.id === "xaicash" || p.id === "xaiopp") && m.id !== "grok")
    return "this valuation replay is xAI-SCOPED (it prices xAI's own fleet at the dive operating point); applying it to " + m.name + " is exploratory at best";
  if (p.id === "chinacloud" && !chinaModels.includes(m.id))
    return "China public-cloud rates applied to a non-China fleet blend — exploratory";
  if (p.id === "anth20" && !chinaModels.includes(m.id))
    return "Ant's H20 deployment replayed under a non-China model — exploratory";
  /* row 499: the three adjudicated presets are ANTHROPIC-SCOPED by construction — each is an
     external estimate of Anthropic's own serving economics (procurement posture, occupancy, fleet),
     or this page's own planning baseline for the same subject. Applying one to another lab's
     model is exactly the attribution laundering the xAI and China rules above exist to prevent, and
     it would also let a non-Anthropic model's scenario-preset span quietly widen on Anthropic-specific
     judgments. Warned, not blocked — the reader may still explore it, labeled. */
  /* row 514: the two SELF-AUTHORED round-3 presets inherit this scope for exactly the same reason,
     and the omission was caught by the browser suite rather than by inspection — a replay whose
     span should have read "only one scenario preset is compatible" silently gained two. That is the
     second clause of the note above happening in practice, so the list is the one place this scope
     is expressed and every Anthropic-scoped estimate belongs in it. */
  if (["gptpro-ctx", "fable-ctx", "stress-public-rate", "gptpro-r3", "fable-r3"].includes(p.id) && m.lab !== "anthropic")
    return "this preset is an estimate of ANTHROPIC's serving economics (or this page's floor for it); applying it to " + m.name + " is exploratory at best";
  // Western-procurement exploration configs (Q8): shipped-parity scope — exactly the four
  // vectors migrated from retired presets keep their pairing warning (identical numbers AND
  // identical warnings under migration). Whether the other explorations warn is an M3 wording call.
  const westernNarratives = ["x80-v3", "x80-v4", "x90-v1", "x60-v3"];
  if (p.id === "gptpro" && !["opus", "sonnet", "haiku"].includes(m.id))
    return "the 'GPT-5.6 Pro fleet model' describes ANTHROPIC's procurement; its multipliers may not fit " + m.name;
  if (chinaModels.includes(m.id) && westernNarratives.includes(p.id))
    return "this perspective's procurement narrative was formulated for Western fleets and is being applied to China-market rents";
  if (p.id === "deepseek" && !chinaModels.includes(m.id))
    return "the disclosure replay prices " + m.name + " as if served like DeepSeek in Feb 2025 - a thought experiment, not that provider's operating point";
  return "";
}
function pairingSeverity(m, p) {
  if ((p.id === "xaicash" || p.id === "xaiopp") && m.id !== "grok") return "hard";
  if (p.id === "anth20" && !["dsr1", "dsv4", "dsv4f", "glm", "glm47", "kimi"].includes(m.id)) return "hard";
  return pairingWarning(m, p) ? "soft" : "ok";
}

/* ---------- anti-lens-shopping span (traffic-conditional, byte-identical traffic) ---------- */
// B3 (final re-verification, P1): each contributor now carries its own fleetRenderable so the
// span's lo/hi ENDPOINTS can each be checked -- they can come from different lens perspectives
// and therefore different renormalized fleet subsets (the flagship Opus span's low endpoint is
// median @ H100+H200, 2/7 legs, 25% weight; the high endpoint is gptpro @ H200 alone, 1/5 legs,
// 5% weight -- a silently different estimand behind two endpoints presented as one interval).
/* ---------- MARGIN BANDS FROM RANGE-VALUED DIALS (row 499, owner note 507081) ----------
   The feature this serves: a slider that carries 2 or 3 points instead of 1, so that what an
   adjudicator actually stated — a RANGE — can be represented instead of flattened to a midpoint.

   HOW THE BAND PROPAGATES, and why it is not sampling. Writing [f]N for naive interval arithmetic,
   [f]M for the monotonicity-based extension and [f]opt for the true attainable range:

       [f]opt([V])  ⊆  [f]M([V])  ⊆  [f]N([V])

   - Naive interval arithmetic is wrong HERE specifically: its dependency problem treats each
     occurrence of a variable as independent, and in this engine `rentMult` appears in every leg's
     cost while `util` divides the whole fleet. The band would come out both inflated and
     UNATTAINABLE — no setting of the dials would produce the quoted edge.
   - Monte Carlo is not wrong, but it is the wrong instrument for THIS page: it requires inventing a
     distribution over each dial, and this page does not manufacture precision the evidence does not
     carry. The external reviewer spent a section of its round-2 report refusing exactly that move.
   - When f is monotone w.r.t. every dial over the box, [f]M = [f]opt: evaluating at the CORNERS
     (each dial at whichever end its partial derivative points) gives the TRUE attainable range,
     exactly, with no distributional assumption at all.

   So this function checks monotonicity per dial and evaluates corners. Monotonicity is not assumed:
   it is probed, and a dial that fails is swept densely and REPORTED as swept rather than silently
   folded in. `exact` is true only when every dial passed — a band that might be an enclosure rather
   than the attainable range must say so, because "the margin can be as high as X" and "the margin
   is somewhere in a box containing X" are different claims.

   What this deliberately does NOT return: an expected value. There is no PERT mean, no triangular
   mean and no percentile here, because nothing in the evidence base licenses a distribution shape.
   The dials carry a range and a stated centre; the centre is the reader's or the adjudicator's
   median, not a weighted average this engine invented. */
const BAND_MAX_CORNER_DIALS = 12;          // 4,096 evaluations; beyond this we refuse rather than hang
/* The legal domain of a blend SHARE, declared beside the other band constants because `dialBounds`
   reads it before `mixBand` is defined. A share is a percentage of fleet traffic: the same [0, 100]
   the share sliders already carry. */
const MIX_SHARE_BOUNDS = [0, 100];
const BAND_MONOTONE_PROBES = 5;            // per dial, including both ends
const BAND_SWEEP_STEPS = 11;               // fallback resolution for a dial that fails the probe
const BAND_EPS = 1e-9;

/* Every accelerator this engine registers that belongs to one hardware family. The band derivation
   needs this because a family-scoped range has to reach the legs, not just the family key — see
   `applyDial`. Computed from the registry rather than listed, so a new leg joins its family here
   the moment it is registered. */
function legsInFamily(fam) { return HW_ORDER.filter(k => HW[k] && familyOf(HW[k], undefined) === fam); }

/* A dial names a state key, or a leg/family entry inside the two procurement maps. Kept as data so
   the codec, the UI and this function all describe a dial the same way.

   FAMILY DIALS HAVE TWO SCOPES, and the difference is the whole reason this comment is long.
   `scope: "key"` (the default, and what the family CONTROL does) writes the family key only — and a
   per-leg value always wins over it, deliberately, because "gb300 at 0.8" is a more specific
   statement than "NVIDIA at 0.95". That resolution order is right for a control and WRONG for a
   band: on a preset that authored per-leg values, a family-key range moves nothing, and the band
   comes back zero-width. The page would then tell a reader that the dial they disagree about most
   contributes no uncertainty — the single most misleading thing this feature could do, and the
   spike caught it before any of this was built.
   `scope: "group"` therefore moves the family AND every leg in it together, which is what a
   family-scoped range MEANS: one degree of freedom, the family's procurement, applied to the legs
   that actually price. `dialsFromRanges` stamps it, so a DECLARED range always gets group scope
   while any other caller keeps the control's own semantics. */
function applyDial(state, dial, v) {
  if (dial.leg) { state.rentMultLeg = Object.assign({}, state.rentMultLeg); state.rentMultLeg[dial.leg] = v; return; }
  if (dial.family) {
    state.rentMultFam = Object.assign({}, state.rentMultFam); state.rentMultFam[dial.family] = v;
    if (dial.scope === "group") {
      state.rentMultLeg = Object.assign({}, state.rentMultLeg);
      for (const leg of legsInFamily(dial.family)) state.rentMultLeg[leg] = v;
    }
    return;
  }
  state[dial.key] = v;
}
function dialId(dial) { return dial.leg ? ("rentMultLeg." + dial.leg) : dial.family ? ("rentMultFam." + dial.family) : dial.key; }

/* Which legs a family-scoped dial actually overrode on THIS state, and only when the override
   changed something — a family range on a preset with no per-leg values needs no explanation,
   because the plain family key would have moved the same legs. Reported on the band so the readout
   can say it rather than leave the reader to discover it. */
function familyGroupOverrides(state, dials) {
  const out = [];
  for (const d of (dials || [])) {
    if (!d.family || d.scope !== "group") continue;
    const shadowed = legsInFamily(d.family).filter(leg => state && state.rentMultLeg && state.rentMultLeg[leg] != null);
    if (shadowed.length) out.push({ id: dialId(d), family: d.family, legs: shadowed });
  }
  return out;
}

/* The legal domain of a dial, by id — the ONE place that knows how a dial id maps to bounds, so the
   sanitizer, the band derivation and any future UI cannot disagree about what a dial may hold. */
function dialBounds(id) {
  if (typeof id !== "string") return null;
  if (id.startsWith("rentMultLeg.")) return HW_ORDER.includes(id.slice(12)) ? SCENARIO_BOUNDS.rentMult : null;
  if (id.startsWith("rentMultFam.")) return Object.prototype.hasOwnProperty.call(FAMILY_STATE_KEY, id.slice(12)) ? SCENARIO_BOUNDS.rentMult : null;
  /* Mix ranges live in the same `dialRanges` map and therefore through the same door: the sanitizer,
     the codec and the band all learn a blend id here or none of them does. A share is a percentage
     of traffic, so its domain is the share slider's own [0, 100] — the one place that knows it. */
  if (id.startsWith("blend.fam.")) return Object.prototype.hasOwnProperty.call(FAMILY_STATE_KEY, id.slice(10)) ? MIX_SHARE_BOUNDS : null;
  if (id.startsWith("blend.")) return HW_ORDER.includes(id.slice(6)) ? MIX_SHARE_BOUNDS : null;
  const b = SCENARIO_BOUNDS[id];
  return (Array.isArray(b) && typeof b[0] === "number" && typeof b[1] === "number") ? b : null;
}
/* A declared range is only a band input if it is REAL: a well-formed entry whose ends differ. A
   1-point dial (lo === hi) is legal state and simply contributes nothing, which is what "1 point"
   means in the toggle. */
function dialsFromRanges(ranges) {
  const out = [];
  for (const [id, r] of Object.entries(ranges || {})) {
    if (!r || !isFinite(r.lo) || !isFinite(r.hi) || r.hi <= r.lo) continue;
    /* MIX RANGES ARE NOT BOX DIALS and must never reach `marginBand`. Blend shares are coupled by
       Σ = 100; corner-enumerating them independently would band over mixes the owner's ruling
       excludes by construction. They leave through `mixRangesFromRanges` instead. */
    if (id.startsWith("blend.")) continue;
    const dial = id.startsWith("rentMultLeg.") ? { leg: id.slice(12) }
      : id.startsWith("rentMultFam.") ? { family: id.slice(12), scope: "group" }   // see `applyDial`
      : { key: id };
    out.push(Object.assign(dial, { lo: r.lo, hi: r.hi }));
  }
  return out;
}
/* WHERE THE EXTRA HANDLES APPEAR WHEN A READER CHANGES MODE (owner ruling, 2026-08-07 18:55Z).
   The rule is that a mode change must never move a handle the reader already placed:

     1 -> 2 points  the second handle appears STACKED on the first, at the same value. His words:
                    "you just get two buttons stacked on the slider instead of one button going
                    anywhere else." A mode change is not an edit, so it may not look like one.
     2 -> 3 points  the third appears at the MIDPOINT of the two bounds — the symmetric default,
                    which is what someone means before they say otherwise. Draggable afterwards,
                    which is how a skewed guess gets stated.

   It lives in the engine, and as arithmetic rather than as three lines inside a DOM builder, because
   "did a handle move when it should not have" is exactly the kind of thing that is trivial to check
   over every combination and near-impossible to eyeball once it is tangled up with input elements.
   Anything the reader HAS placed is returned unchanged — that is the ruling, and it is the first
   thing the tests assert.

   The midpoint is snapped to the control's own step so the handle sits on a value the slider can
   actually hold; without that it visibly jumps on first touch, which is the thing being prevented. */
function bandHandleDefaults(cur, point, min, max, step) {
  const snap = (v) => {
    if (!isFinite(step) || step <= 0) return v;
    const decimals = (String(step).split(".")[1] || "").length;
    return Number((min + Math.round((v - min) / step) * step).toFixed(decimals));
  };
  const clamp = (v) => Math.min(max, Math.max(min, v));
  const c = cur || {};
  /* Both bounds default to the point the reader is already looking at, which is what "stacked" is. */
  const lo = c.lo != null ? c.lo : clamp(point);
  const hi = c.hi != null ? c.hi : clamp(point);
  /* Snap, THEN clamp back between the two bounds — in that order, and the order is the bug the
     exhaustive test found. Snapping alone can push the median past a bound whenever the reader has
     bracketed something more tightly than one step of the control (span 0.025 on a 0.05 step, say),
     and a median sitting outside its own range is a claim nobody made. Landing exactly on a bound
     is the honest degenerate case there: it is the closest legal value, and the reader can see it. */
  const mid = c.mid != null ? c.mid : Math.min(hi, Math.max(lo, clamp(snap((lo + hi) / 2))));
  return { lo, hi, mid };
}

function marginBand(m, p, sel, dials, opts) {
  /* A corner can be a state this engine legitimately REFUSES — the dial bounds are per-dial, but the
     engine also enforces cross-field constraints (activeB <= totalB is the live one), so a range
     that every per-dial check accepts can still describe an impossible corner. Found in review.
     Such a corner contributes NOTHING to the band rather than crashing the caller: it is not a
     margin the scenario can reach, which is exactly what the band is about. If the POINT itself is
     unevaluable the band refuses, because then there is no scenario to speak about at all. */
  const evalAt = (assign) => {
    try {
      const s = applyPresetSettings(m, p, sel);
      if (opts && opts.base) Object.assign(s, structuredClone(opts.base));
      assign(s);
      const value = opts && typeof opts.cornerEval === "function"
        ? opts.cornerEval(s, opts.renderOpts)
        : workload(s, undefined, scenarioContext(s), opts && opts.renderOpts).margin * 100;
      return isFinite(value) ? value : NaN;
    } catch { return NaN; }
  };
  const point = evalAt(() => {});
  /* The state the point was computed on, kept so the result can say WHICH per-leg values a
     family-scoped range had to reach past. Built the same way `evalAt` builds its own. */
  const baseState = (() => {
    try {
      const s = applyPresetSettings(m, p, sel);
      if (opts && opts.base) Object.assign(s, structuredClone(opts.base));
      return s;
    } catch { return null; }
  })();
  const live = (dials || []).filter(d => isFinite(d.lo) && isFinite(d.hi) && d.hi > d.lo);
  if (!live.length) return { point, lo: point, hi: point, exact: true, nonMonotone: [], corners: 0, familyGroups: [], refused: null };
  if (!isFinite(point))
    return { point, lo: NaN, hi: NaN, exact: false, nonMonotone: [], corners: 0,
             refused: "the scenario itself does not evaluate at its own point, so there is no band to describe" };
  if (live.length > BAND_MAX_CORNER_DIALS)
    return { point, lo: NaN, hi: NaN, exact: false, nonMonotone: [], corners: 0,
             refused: "more than " + BAND_MAX_CORNER_DIALS + " range-valued dials at once — the corner evaluation is exponential and this refuses rather than pretend to a number it did not compute" };

  /* 1. Probe each dial for monotonicity over its own range, holding the others at the point. */
  const nonMonotone = [];
  const dirs = new Map();
  const probeSamples = [];   // every value the monotonicity probe already computed, kept for §3
  for (const d of live) {
    const ys = [];
    for (let i = 0; i < BAND_MONOTONE_PROBES; i++) {
      const v = d.lo + (d.hi - d.lo) * i / (BAND_MONOTONE_PROBES - 1);
      ys.push(evalAt(s => applyDial(s, d, v)));
    }
    for (const y of ys) if (isFinite(y)) probeSamples.push(y);
    let up = 0, down = 0;
    for (let i = 1; i < ys.length; i++) {
      const dy = ys[i] - ys[i - 1];
      if (Math.abs(dy) <= BAND_EPS) continue;
      if (dy > 0) up++; else down++;
    }
    if (up && down) { nonMonotone.push(dialId(d)); dirs.set(d, 0); }
    else dirs.set(d, up ? 1 : -1);
  }

  /* 2. Corners over the monotone dials; a dial that failed the probe is swept instead, so its
        extremes are found by search rather than assumed to sit at an end. */
  const monotone = live.filter(d => dirs.get(d) !== 0);
  const swept = live.filter(d => dirs.get(d) === 0);
  /* THE REAL BUDGET, and the one the guard above cannot express: total work is
     2^|monotone| x steps^|swept|, so a handful of non-monotone dials is millions of evaluations
     while the dial COUNT still looks small. Found in review — the count guard alone was a
     promise this function could not keep. Refuse on the product, and say which part blew it. */
  const workEstimate = Math.pow(2, monotone.length) * Math.pow(BAND_SWEEP_STEPS, swept.length);
  if (workEstimate > Math.pow(2, BAND_MAX_CORNER_DIALS))
    return { point, lo: NaN, hi: NaN, exact: false, nonMonotone, corners: 0,
             refused: "this box needs about " + Math.round(workEstimate).toLocaleString("en-US")
               + " evaluations (" + monotone.length + " monotone dials at their corners, "
               + swept.length + " non-monotone dials swept at " + BAND_SWEEP_STEPS
               + " steps each) — beyond the budget, and this refuses rather than hang" };
  const sweepValues = swept.map(d => Array.from({ length: BAND_SWEEP_STEPS },
    (_, i) => d.lo + (d.hi - d.lo) * i / (BAND_SWEEP_STEPS - 1)));
  let lo = Infinity, hi = -Infinity, corners = 0, unevaluable = 0;
  const walkSwept = (idx, assignSoFar) => {
    if (idx === swept.length) {
      for (let mask = 0; mask < (1 << monotone.length); mask++) {
        const m2 = evalAt(s => {
          assignSoFar(s);
          monotone.forEach((d, i) => applyDial(s, d, ((mask >> i) & 1) ? d.hi : d.lo));
        });
        corners++;
        if (isFinite(m2)) { if (m2 < lo) lo = m2; if (m2 > hi) hi = m2; }
        else unevaluable++;   // a corner this engine refuses — counted, never silently dropped
      }
      return;
    }
    for (const v of sweepValues[idx])
      walkSwept(idx + 1, s => { assignSoFar(s); applyDial(s, swept[idx], v); });
  };
  walkSwept(0, () => {});

  /* An unevaluable corner is not a free pass. Skipping it keeps the function from crashing, but a
     band computed over PART of a declared box is not the attainable range of that box — and saying
     "attainable" would be the strongest claim here resting on the weakest evidence. So: if every
     corner was refused there is no band at all, and if some were, the band reports what it covered
     and drops its exactness claim. Found in review (the crash); this is the half the crash hid. */
  if (unevaluable && !isFinite(lo))
    return { point, lo: NaN, hi: NaN, exact: false, nonMonotone, corners, unevaluable,
             refused: "every corner of this box describes a scenario the engine refuses (a cross-field constraint, not a dial bound) — there is no attainable range to report" };

  /* 3. EXHAUSTIVENESS, AND WHAT THIS BAND IS ENTITLED TO CLAIM (Polaris ruling 2026-09-19 on
        Astra pack A P0-2: change the LABEL, not the extrema search).
        The old condition was "the monotonicity probe saw no reversal and no corner was refused",
        and it set a label asserting that no setting reaches outside the band. That is a claim of
        exhaustiveness resting on five samples per axis, and it is false in the presence of a
        capacity, width or membership transition: Astra found grok/median with ioRatio in [1,100]
        reporting an "exact" -42.396…–36.972…% while the legal interior setting ioRatio = 86
        computes -42.585…%, below its own stated minimum.
        Two changes. First, the probe values this function ALREADY computed are checked for
        containment — zero extra engine calls, and a sample outside [lo, hi] is a DEMONSTRATION
        that the corner search missed part of the box, so the exactness claim is dropped. The
        same is true if the point estimate itself escapes. Second, and this is the part that
        matters: neither label claims exhaustiveness any more. Sampling a continuous axis cannot
        prove it, so the strong wording is retired and both cases say the range was SEARCHED.
        The retired phrase is pinned by tests/margin-band-searched-label.test.mjs so it cannot
        come back. Glossary: site/glossary.html#searched-range. */
  const escaped = probeSamples.filter(y => y < lo - BAND_EPS || y > hi + BAND_EPS);
  /* A point outside the band is only an INCONSISTENCY when the point's own settings lie inside
     the declared box. A reader who bounds utilization 40–90 on a replay pinned at 100 has asked
     for a range that legitimately excludes the current reading, and 66 of 288 shipped
     model/perspective pairs are exactly that case — the point being outside says something true
     about the request, not about the search. So the escape is keyed on containment of the
     SETTINGS, not of the value. */
  const dialValue = (state, d) => d.leg ? (state.rentMultLeg || {})[d.leg]
    : d.family ? (state.rentMultFam || {})[d.family] : state[d.key];
  const pointInsideBox = !!baseState && live.every(d => {
    const v = Number(dialValue(baseState, d));
    return Number.isFinite(v) && v >= d.lo - BAND_EPS && v <= d.hi + BAND_EPS;
  });
  const pointEscaped = pointInsideBox && isFinite(point)
    && (point < lo - BAND_EPS || point > hi + BAND_EPS);
  const exhaustive = nonMonotone.length === 0 && unevaluable === 0
    && escaped.length === 0 && !pointEscaped;

  return {
    point, lo, hi,
    exact: exhaustive,
    searchEscapes: escaped.length,
    pointOutsideBand: pointEscaped,
    pointInsideDeclaredBox: pointInsideBox,
    nonMonotone, corners, unevaluable, refused: null,
    /* Which family-scoped ranges had to reach past a per-leg value to price anything. Empty on a
       scenario with no per-leg posture — there is nothing to explain there. */
    familyGroups: familyGroupOverrides(baseState, live),
    /* The claim this band is entitled to make, in one string the UI can render without re-deriving
       the epistemics. It is deliberately not "confidence" or "interval" — neither is true. */
    label: exhaustive
      ? "searched range over the declared dial ranges — the extremes found by evaluating every corner of the box, with each axis sampled; a setting between samples can fall outside it where the fleet changes shape"
      : [
          escaped.length ? escaped.length + " sampled setting(s) inside the declared ranges fall"
            + " OUTSIDE this range — the box contains a discontinuity, so this is what the search"
            + " found, not the attainable range" : "",
          pointEscaped ? "the point estimate itself lies outside this range, so the two do not"
            + " describe the same feasible set" : "",
          nonMonotone.length ? "found by sweeping " + nonMonotone.join(", ")
            + " (not monotone here, so its extremes were searched rather than taken at the ends)" : "",
          unevaluable ? unevaluable + " of " + corners + " corners describe scenarios this engine refuses"
            + " (a cross-field constraint, not a dial bound), so this range covers the part of the box that computes, not all of it" : "",
        ].filter(Boolean).join("; "),
  };
}

/* PER-DIAL BANDS — and this is the presentation ruling, not an optimisation.

   The spike measured the whole-box band over the eight dials the adjudicators declared and got
   51.8 % to 94.7 %: every one of those ranges is defensible and the compounded result is 43 points
   wide. That figure is TRUE and it is a terrible headline — it invites "so the answer is anywhere
   between 52 and 95", which is the opposite of what a reader learns by bounding an assumption.
   What they actually want to know is which assumption moves the number, and by how much, and those
   are per-dial questions.

   So: per-dial bands are what the page shows, the compounded box is opt-in and labelled, and both
   come from the SAME derivation — this function calls `marginBand` with one dial live rather than
   re-implementing a cheaper approximation, so the two surfaces cannot drift apart about method.
   Each entry is the range that dial reaches ON ITS OWN with every other dial at its stated point,
   which is why the per-dial bands do not add up to the compounded one and are not meant to. */
function marginBandsPerDial(m, p, sel, dials, opts) {
  const live = (dials || []).filter(d => isFinite(d.lo) && isFinite(d.hi) && d.hi > d.lo);
  return live.map(d => Object.assign({ id: dialId(d) }, marginBand(m, p, sel, [d], opts)));
}

/* im-arc T2 (memo research/im-arc-t2-sections-memo.md §5): exact section
   assumption bands. These inputs enter the hourly-cost identity monotonically;
   evaluating every vertex therefore returns the attainable range without inventing
   a probability distribution. Section/leg share triples are deliberately excluded:
   they are coupled by sum-to-100 and travel through the mix-polytope mechanism, never
   an independent box corner. */
function sectionBand(s, renderOpts, opts) {
  const fleet = renderOpts && renderOpts.customFleet;
  if (!fleet || !Array.isArray(fleet.sections)) {
    const margin = workload(s, undefined, scenarioContext(s), renderOpts).margin;
    return { perDial: [], compounded: { lo: margin, hi: margin }, mechanism: "corner-evaluation",
      label: "selected span", mid: margin, midLabel: "middle assumption",
      lo: margin, hi: margin, exact: true, evaluatedCorners: 1,
      dials: [], compositionalRanges: [], basis: "no range-valued section inputs" };
  }
  const dials = [];
  const compositionalRanges = [];
  const walk = (value, path, id) => {
    if (value && typeof value === "object" && !Array.isArray(value)
        && Object.keys(value).sort().join(",") === "hi,lo,mid"
        && [value.lo, value.mid, value.hi].every(v => typeof v === "number" && isFinite(v))) {
      if (path[path.length - 1] === "sharePct") {
        compositionalRanges.push({ id, path, lo: value.lo, mid: value.mid, hi: value.hi }); return;
      }
      dials.push({ id, path, lo: value.lo, mid: value.mid, hi: value.hi }); return;
    }
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) value.forEach((child, index) => walk(child, path.concat(index), id + "[" + index + "]"));
    else Object.entries(value).forEach(([key, child]) => walk(child, path.concat(key), id ? id + "." + key : key));
  };
  fleet.sections.forEach((section, index) => walk(section, ["sections", index], "section:" + section.id));
  if (dials.length > BAND_MAX_CORNER_DIALS)
    return { perDial: [], compounded: { lo: null, hi: null }, mechanism: "corner-evaluation",
      label: "selected span", mid: null, midLabel: "middle assumption",
      lo: null, hi: null, exact: false, evaluatedCorners: 0, dials, compositionalRanges,
      refused: true, reason: "more than " + BAND_MAX_CORNER_DIALS + " range-valued section inputs — refusing exponential corner evaluation" };

  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-2): ranged shares are
     coupled coordinates. Build one feasible vertex set for the fleet's section
     simplex and one for each section's leg simplex, holding scalar shares fixed. */
  const shareGroups = new Map();
  for (const range of compositionalRanges) {
    let key, members;
    if (range.path.length === 3 && range.path[0] === "sections") {
      key = "sections"; members = fleet.sections;
    } else if (range.path.length === 5 && range.path[0] === "sections" && range.path[2] === "legs") {
      key = "sections:" + range.path[1] + ":legs";
      members = fleet.sections[range.path[1]].legs;
    } else {
      return { perDial: [], compounded: { lo: null, hi: null }, mechanism: "share-polytope-vertices",
        label: "selected span", mid: null, midLabel: "middle assumption", lo: null, hi: null,
        exact: false, evaluatedCorners: 0, dials, compositionalRanges, refused: true,
        reason: "unsupported compositional share path " + range.path.join(".") };
    }
    if (!shareGroups.has(key)) shareGroups.set(key, { members, ranges: [] });
    shareGroups.get(key).ranges.push(range);
  }
  const groupAssignments = [];
  for (const group of shareGroups.values()) {
    const fixed = group.members.reduce((sum, member, index) => {
      const range = group.ranges.find(candidate => candidate.path[candidate.path.length - 2] === index);
      return sum + (range ? 0 : sectionPoint(member.sharePct));
    }, 0);
    const vertices = boundedSumVertices(group.ranges.map(range => ({ lo: range.lo, hi: range.hi })), 100 - fixed);
    if (!vertices.length) return { perDial: [], compounded: { lo: null, hi: null },
      mechanism: "share-polytope-vertices", label: "selected span", mid: null,
      midLabel: "middle assumption", lo: null, hi: null, exact: false, evaluatedCorners: 0,
      dials, compositionalRanges, refused: true,
      reason: "declared share ranges have no feasible vertex summing to 100" };
    groupAssignments.push(vertices.map(values => group.ranges.map((range, index) => ({ path: range.path, value: values[index] }))));
  }
  let shareAssignments = [[]];
  for (const assignments of groupAssignments)
    shareAssignments = shareAssignments.flatMap(existing => assignments.map(next => existing.concat(next)));
  if (!shareAssignments.length) shareAssignments = [[]];

  const materialize = (values, shares) => {
    const clone = structuredClone(fleet);
    for (let i = 0; i < dials.length; i++) {
      const path = dials[i].path; let target = clone;
      for (let j = 0; j < path.length - 1; j++) target = target[path[j]];
      target[path[path.length - 1]] = values[i];
    }
    for (const assignment of shares || []) {
      const path = assignment.path; let target = clone;
      for (let j = 0; j < path.length - 1; j++) target = target[path[j]];
      target[path[path.length - 1]] = assignment.value;
    }
    return clone;
  };
  const evaluate = (values, shares) => {
    const customFleet = materialize(values, shares);
    if (opts && typeof opts.cornerEval === "function") return opts.cornerEval(s, { ...(renderOpts || {}), customFleet });
    return workload(s, undefined, scenarioContext(s), { ...(renderOpts || {}), customFleet }).margin;
  };
  const mids = dials.map(dial => dial.mid);
  const mid = evaluate(mids, []);
  const perDial = dials.map((dial, index) => {
    const at = value => { const values = mids.slice(); values[index] = value; return evaluate(values, []); };
    return { id: dial.id, lo: dial.lo, mid: dial.mid, hi: dial.hi,
      loMargin: at(dial.lo), midMargin: mid, hiMargin: at(dial.hi) };
  });
  const corners = [];
  const count = Math.pow(2, dials.length) * shareAssignments.length;
  if (count > 5120) return { perDial: [], compounded: { lo: null, hi: null },
    mechanism: "share-polytope-vertices", label: "selected span", mid, midLabel: "middle assumption",
    lo: null, hi: null, exact: false, evaluatedCorners: 0, dials, compositionalRanges,
    refused: true, reason: count + " combined box/share vertices — refusing rather than hang" };
  for (let mask = 0; mask < Math.pow(2, dials.length); mask++)
    for (const shares of shareAssignments)
      corners.push(evaluate(dials.map((dial, index) => mask & (1 << index) ? dial.hi : dial.lo), shares));
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-3): exact means every
     required evaluation exists. A NaN is a refusal, never an exact null band. */
  const required = [mid, ...corners, ...perDial.flatMap(dial => [dial.loMargin, dial.midMargin, dial.hiMargin])];
  if (!required.every(isFinite)) return { perDial: [], compounded: { lo: null, hi: null },
    mechanism: compositionalRanges.length ? "share-polytope-vertices" : "corner-evaluation",
    label: "selected span", mid: isFinite(mid) ? mid : null, midLabel: "middle assumption",
    lo: null, hi: null, exact: false, evaluatedCorners: corners.length, dials: perDial,
    compositionalRanges, refused: true,
    reason: "at least one required section-band corner is non-finite; refusing an incomplete range" };
  const lo = Math.min(...corners), hi = Math.max(...corners);
  const outputPerDial = perDial.map(dial => {
    const dialLo = Math.min(dial.loMargin, dial.hiMargin);
    const dialHi = Math.max(dial.loMargin, dial.hiMargin);
    return { id: dial.id, lo: dialLo, hi: dialHi, width: dialHi - dialLo };
  });
  /* THE MIDPOINT MUST BELONG TO THE SAME FEASIBLE SET AS THE ENDPOINTS (Polaris ruling
     2026-09-19 on Astra pack A P0-3). The endpoints are evaluated over share assignments
     constrained to sum to 100; the midpoint is evaluated from the declared `mid` values, which
     are normalised independently and therefore need not lie in that polytope. Astra built a
     validated two-section fleet whose band reported an "exact" 80.815…–82.916…% around a
     midpoint of 71.011…% — its raw 20:10 shares normalise to 66.7:33.3, outside the first
     section's declared 10–20%. A band whose own point estimate is outside it is not describing
     one feasible set, whatever the corner evaluation was worth, so it stops claiming to. */
  const midOutside = isFinite(mid) && (mid < lo - BAND_EPS || mid > hi + BAND_EPS);
  return { perDial: outputPerDial, compounded: { lo, hi },
    mechanism: compositionalRanges.length ? "share-polytope-vertices" : "corner-evaluation",
    label: "selected span", mid, midLabel: "middle assumption",
    lo, hi, exact: !midOutside, midOutsideBand: midOutside, evaluatedCorners: count,
    evaluatedShareVertices: shareAssignments.length, dials: perDial, compositionalRanges,
    basis: midOutside
      ? "the middle assumption lies OUTSIDE the searched range — its declared shares are normalised"
        + " independently and need not sit in the sum-to-100 polytope the endpoints were searched over,"
        + " so the two do not describe the same feasible set"
      : compositionalRanges.length
      ? "searched vertices of each sum-to-100 share polytope crossed with the section assumption box; no distribution implied"
      : "searched corner evaluation of the section assumption box; no distribution implied" };
}

/* ---------- THE FEASIBLE-MIX BAND: max / min / median over provider distributions that sum to 100
   (owner ruling `q-sliders-fleet-util-point`, 2026-08-09T14:57:56Z) ----------

   His words, and the whole specification is in them: "if there's a range for providers, then there
   should just be an algorithm to sample the max and min based on those ranges ... anything that
   doesn't sum to 100 is going to be not included in the calculator because you need 100% ... If
   they use three points, the median should be summing to 100%. And if it doesn't, then it'll still
   have to be calculated."

   WHY THIS IS NOT `marginBand` WITH MORE DIALS, which is the mistake this function exists to avoid.
   `marginBand` enumerates corners of a BOX of independent dials. A provider distribution is not a
   box:

       P  =  { s : lo_i <= s_i <= hi_i }  ∩  { Σ s_i = 100 }

   is a box sliced by a hyperplane — a POLYTOPE. Nearly every corner of the box violates Σ = 100, so
   corner enumeration would band over exactly the mixes the ruling excludes. Different geometry,
   different derivation.

   WHAT MAKES THE ANSWER EXACT. Margin is AFFINE in the blend shares — measured, not assumed: over
   all 272 registered (model × perspective) pairs, six chords each, the largest deviation from
   f(½A+½B) = ½f(A)+½f(B) was 6.8e-13, and doubling every share is bit-identical (shares are
   relative weights, `blendWeights` normalizes). An affine function over a polytope attains its
   extremes at VERTICES, so enumerating them is the true attainable range — no sampling, no invented
   distribution, the same standard `marginBand` holds itself to. The measurement is not trusted at
   runtime: `MIX_AFFINE_EPS` re-probes it per derivation and the claim degrades if it fails.

   A vertex of a box cut by ONE hyperplane has at most one fractional coordinate, which is what makes
   the enumeration finite and small: choose the free block, put every other block at an end, solve.

   WHAT THIS DELIBERATELY DOES NOT DO: rescale a declared range to make it fit. If no combination
   inside the declared ranges sums to 100, that is a fact about the declaration and it is reported
   as one. Renormalizing the ranges would rewrite an adjudicator's claim to make this page's
   arithmetic convenient, which is the silent renormalization this feature was commissioned to
   avoid. It is also a DIFFERENT renormalization from the fleet one at `blendedCosts` (legs that
   cannot serve the model drop out and the survivors renormalize, with its own unconditional
   disclosure) — the two are never merged into one sentence, because "your declared mix does not sum
   to 100" and "some legs of your mix cannot serve this model" are different findings. */
/* k · 2^(k-1) candidate vertices ≤ 5,120 evaluations; beyond this we refuse rather than hang.
   HONESTLY: this cannot trip today and it is not pretending to. Blocks may not overlap, so the most
   non-overlapping blocks a scenario can declare is one per registered leg — and `HW_ORDER` holds
   exactly 10. It is a FORWARD guard, live the moment an eleventh accelerator is registered, which is
   the change most likely to make this expensive without anyone thinking about it. Measured at the
   current ceiling: 10 blocks, 5,120 candidates, 10 feasible vertices, 14 ms. */
const MIX_MAX_BLOCKS = 10;
const MIX_AFFINE_EPS = 1e-6;   // margin points; above this the band stops claiming to be attainable
const MIX_EPS = 1e-9;

/* Shared exact vertex construction for a box intersected by one sum hyperplane.
   `mixBand` and the T2 section-share band intentionally use the same geometry. */
function boundedSumVertices(bounds, total) {
  const k = bounds.length;
  if (!k) return Math.abs(total) <= MIX_EPS ? [[]] : [];
  const verts = [], seen = new Set();
  for (let free = 0; free < k; free++) {
    for (let mask = 0; mask < (1 << (k - 1)); mask++) {
      const vals = new Array(k); let acc = 0, bit = 0;
      for (let i = 0; i < k; i++) {
        if (i === free) continue;
        vals[i] = ((mask >> bit) & 1) ? bounds[i].hi : bounds[i].lo; bit++;
        acc += vals[i];
      }
      const value = total - acc;
      if (value < bounds[free].lo - MIX_EPS || value > bounds[free].hi + MIX_EPS) continue;
      vals[free] = Math.min(bounds[free].hi, Math.max(bounds[free].lo, value));
      const key = vals.map(x => x.toFixed(6)).join("|");
      if (!seen.has(key)) { seen.add(key); verts.push(vals); }
    }
  }
  return verts;
}

/* A BLOCK is a set of legs whose TOTAL share carries one declared range: one leg (`blend.<hwKey>`)
   or one provider (`blend.fam.<family>`, every registered leg of that family). The provider unit is
   the one the owner named — "provider distributions" — and it is the unit the adjudicators actually
   wrote in: GPT Pro's round-2 declaration is "50-65% NVIDIA, 35-50% TPU, 0-15% Trainium".

   INSIDE a provider block the split across its generations is held at the scenario's own point
   proportions. A range on a provider is a claim about how much traffic that provider carries, not
   about how it splits across that provider's chips, and holding the split fixed asserts nothing its
   author did not. When the provider's point total is 0 there are no proportions to scale, and the
   split falls back to this page's registered default fleet — DISCLOSED on the band, because it is a
   composition no adjudicator stated. The alternative was refusing, which would delete a declared
   range (GPT Pro's Trainium 0-15 against a point of 0 is exactly this case) and deleting a declared
   range is the one thing this ruling forbids.

   THE CENTRE OF A BLOCK IS ITS DECLARED SHARE, not the middle of its range, and the distinction
   decides the headline. A blend block already HAS a stated point — the preset's own share for those
   legs — so its three points are (lo, that share, hi): the range adds bounds to a centre that
   exists, it does not invent one. Taking (lo+hi)/2 instead would have put GPT Pro's centre at
   NVIDIA 57.5 / TPU 42.5 / Trainium 7.5, asserting 5 % Trainium as this page's median after that
   author explicitly EXCLUDED Trainium from its point pending the form-correction debt. With the
   declared shares it is 60 / 40 / 0 = 100, and the owner's own fixed case lands by construction:
   three points that sum to 100 ARE the median. */
function blendBlocksFromRanges(pointBlend, ranges) {
  const blocks = [], covered = new Set(), errors = [];
  for (const [id, r] of Object.entries(ranges || {})) {
    if (!id.startsWith("blend.")) continue;
    if (!r || !isFinite(r.lo) || !isFinite(r.hi) || r.hi < r.lo) { errors.push(id + " (malformed range)"); continue; }
    const fam = id.startsWith("blend.fam.") ? id.slice(10) : null;
    const legs = fam ? legsInFamily(fam) : [id.slice(6)];
    if (!legs.length || legs.some(k => !HW_ORDER.includes(k))) { errors.push(id + " (names no registered leg)"); continue; }
    /* OVERLAPPING BLOCKS REFUSE. A provider range and a leg range inside that same provider are two
       layers describing one claim, and the round-3 procurement refactor already paid for that
       lesson: multiplying them is not a richer prior, it is the same claim counted twice. */
    for (const k of legs) if (covered.has(k)) { errors.push(id + " (overlaps a range already declared on " + k + ")"); }
    legs.forEach(k => covered.add(k));
    const pointTotal = legs.reduce((a, k) => a + (pointBlend[k] || 0), 0);
    let prop, fallbackSplit = false, declaredSplit = false;
    /* AN AUTHOR MAY DECLARE THE SPLIT (dual consult, 2026-08-10). GPT Pro's answer is the reason
       this exists: it declares Trainium 0-15 % while its point holds Trainium at zero, and it is
       explicit that any positive share goes to Trainium2 ALONE — Trainium3 stays at zero until
       there is a defensible price and throughput basis. Without this the engine would fall back to
       its own registered default proportions and put a third of that share on trn3, which is a
       composition its author refused. A declared split is the author's; the fallback is this
       page's, and only the fallback is disclosed as such. */
    const rawSplit = (r.split && typeof r.split === "object" && !Array.isArray(r.split)) ? r.split : null;
    const splitTotal = rawSplit ? legs.reduce((a, k) => a + (isFinite(rawSplit[k]) && rawSplit[k] >= 0 ? rawSplit[k] : 0), 0) : 0;
    if (rawSplit && !(splitTotal > 0)) { errors.push(id + " (declared split has no positive weight)"); continue; }
    if (rawSplit && Object.keys(rawSplit).some(k => !legs.includes(k))) { errors.push(id + " (declared split names a leg outside this block)"); continue; }
    if (rawSplit) { prop = legs.map(k => (isFinite(rawSplit[k]) && rawSplit[k] > 0 ? rawSplit[k] : 0) / splitTotal); declaredSplit = true; }
    else if (pointTotal > 0) prop = legs.map(k => (pointBlend[k] || 0) / pointTotal);
    else {
      const defTotal = legs.reduce((a, k) => a + (DEFAULTS.blend[k] || 0), 0);
      prop = defTotal > 0 ? legs.map(k => (DEFAULTS.blend[k] || 0) / defTotal) : legs.map(() => 1 / legs.length);
      fallbackSplit = legs.length > 1;
    }
    const centre = (r.mid != null && isFinite(r.mid)) ? r.mid : Math.min(r.hi, Math.max(r.lo, pointTotal));
    blocks.push({ id, family: fam, legs, prop, lo: r.lo, hi: r.hi, centre, pointTotal, fallbackSplit, declaredSplit });
  }
  return { blocks, covered, errors };
}

/* The Euclidean projection of the declared centres onto the feasible set — the median for the case
   the ruling left open ("if they just use two points or the median doesn't sum to 100%, then max,
   min and medium can be calculated based on the options that reach 100%").

   Solved exactly rather than searched: b_j(λ) = clamp(centre_j + λ, lo_j, hi_j) is non-decreasing in
   λ and continuous, so Σ b_j(λ) is monotone and one bisection lands on the λ where it equals T. The
   reading is NEAREST-FEASIBLE-TO-DECLARED: the declared centres are the author's intent, Σ = 100 is
   a correction applied to that intent, and the smallest correction preserves the most of it. It
   also degrades into the owner's fixed case by construction — when the centres already sum to T the
   projection is the identity, so the median IS the author's own point rather than something this
   page computed that happens to be close.

   The reading NOT taken, and named because it is defensible and gives a different number: the median
   of the margin distribution over the polytope. That one requires inventing a distribution over
   mixes, which is the move this page refuses everywhere else (`marginBand`: "no PERT mean, no
   triangular mean and no percentile here"), and it is the reading most likely to produce a figure no
   reader can trace back to a mix they could point at. */
function projectCentresOntoSum(blocks, T) {
  const centres = blocks.map(b => Math.min(b.hi, Math.max(b.lo, b.centre)));
  const sum = centres.reduce((a, x) => a + x, 0);
  if (Math.abs(sum - T) <= MIX_EPS) return { vals: centres, declared: true };
  const at = (lam) => blocks.reduce((a, b, i) => a + Math.min(b.hi, Math.max(b.lo, centres[i] + lam)), 0);
  let lo = -200, hi = 200;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (at(mid) < T) lo = mid; else hi = mid; }
  const lam = (lo + hi) / 2;
  return { vals: blocks.map((b, i) => Math.min(b.hi, Math.max(b.lo, centres[i] + lam))), declared: false };
}

/* ================= THE MEAN MIX: exact centroid of P = box ∩ {Σ = T} =================
   Owner MEAN ruling (2026-08-11, both notes; decision memo
   research/three-point-middle-point-decision-2026-08-11.md §2-§3). Lifted VERBATIM from the
   reviewed reference implementation tests/mix-centroid-reference.mjs (built+verified at
   6b1c71c: six cases, three hand-provable, Monte-Carlo agreement ≤ 0.0085) — the
   inclusion–exclusion route, because the two tempting shortcuts are the memo's measured trap:
   midpoint-projection agrees on the symmetric reference case and is off by 0.18–5 pp on
   Fable-r3/skewed declarations, and an unweighted vertex average is not the centroid at all.
   y_i = x_i − lo_i ∈ [0, w_i], Σy = S; the shared geometric constant cancels in the
   moment/volume ratio; only the factorial ratio (k−1) survives. k ≤ MIX_MAX_BLOCKS ⇒ ≤ 2^k
   truncation terms per coordinate — cheap. */
const mixPos = (u) => (u > 0 ? u : 0);
function mixVolPow(ws, S, p) {
  const n = ws.length;
  let acc = 0;
  for (let mask = 0; mask < (1 << n); mask++) {
    let W = 0, bits = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) { W += ws[i]; bits++; }
    const u = mixPos(S - W);
    if (u > 0) acc += (bits % 2 ? -1 : 1) * Math.pow(u, p);
  }
  return acc;
}
// ∫_0^{w} t · ((c − t)_+)^n dt, substituting u = c − t
function mixMomentTerm(w, c, n) {
  const a = mixPos(c - w), b = mixPos(c);
  if (b <= a) return 0;
  const I = (u, e) => Math.pow(u, e + 1) / (e + 1);
  return c * (I(b, n) - I(a, n)) - (I(b, n + 1) - I(a, n + 1));
}
function centroidOnSum(lo, hi, T) {
  const k0 = lo.length;
  /* centroid-gate R3 (P1 residual): the k=1 clamp was a pre-existing helper-contract defect —
     an out-of-range T returned the nearest endpoint as if it were the centroid. Every branch
     now shares one tolerance discipline: answer only when T is feasible, else null. */
  if (k0 === 1)
    return (T < lo[0] - 1e-9 || T > hi[0] + 1e-9) ? null : [Math.min(hi[0], Math.max(lo[0], T))];
  /* ZERO-WIDTH BLOCKS PIN AND REDUCE (centroid-gate R2 P1): a declared 60-60 is a legal range
     whose coordinate is fixed at its point; it leaves the variable set instead of collapsing
     the inclusion-exclusion volume to zero (a duplicated mask term cancels V even when the
     remaining slice has positive dimension). */
  const varIdx = [];
  for (let i = 0; i < k0; i++) if (hi[i] - lo[i] > 0) varIdx.push(i);
  const loSum = lo.reduce((a, b) => a + b, 0);
  if (varIdx.length === 0)
    return Math.abs(loSum - T) <= 1e-9 * Math.max(1, Math.abs(T)) ? lo.slice() : null;
  if (varIdx.length === 1) {
    const j = varIdx[0];
    const v = T - (loSum - lo[j]);
    if (v < lo[j] - 1e-9 || v > hi[j] + 1e-9) return null;
    const out = lo.slice(); out[j] = Math.min(hi[j], Math.max(lo[j], v));
    return out;
  }

  /* EXACT INTEGER CORE (centroid-gate R2 P0, superseding the R1 complement reduction): float
     inclusion-exclusion cancels catastrophically wherever the alternating terms dwarf the
     result -- R1 fixed the upper sliver, R2 exhibited the same loss at the flip boundary with
     mixed magnitudes, certified WRONG by the float postcondition because the error hides
     inside the sum tolerance. Floats ARE dyadic rationals, so the construction is computed
     EXACTLY: every input becomes numerator/denominator over a shared power-of-two D, the
     whole inclusion-exclusion runs in BigInt integers (homogeneous in D, so D factors out
     analytically), and the only roundings are terminal (the final BigInt->float division, plus the float
     input expressions and the lo_j addition — measured <= 7.2e-15 against an exact oracle).
     Cancellation is impossible by construction. y_j = accInt_j / (k * D * VInt), from
     momentTermInt = (k-1)k * momentTerm and VInt = D^(k-1) * V. */
  const dy = (x) => {   // exact dyadic decomposition of a finite float
    let d = 1n, neg = x < 0; if (neg) x = -x;
    while (!Number.isInteger(x)) { x *= 2; d <<= 1n; }
    return { n: neg ? -BigInt(x) : BigInt(x), d };
  };
  const kv = varIdx.length;
  const loR = varIdx.map(i => dy(lo[i])), hiR = varIdx.map(i => dy(hi[i]));
  const SR = dy(T - loSum);   // hi-lo and T-loSum are float ops; their RESULTS are the declared geometry
  let D = SR.d;
  for (const r of loR.concat(hiR)) if (r.d > D) D = r.d;
  const scale = (r) => r.n * (D / r.d);
  const wI = varIdx.map((_, j) => scale(hiR[j]) - scale(loR[j]));
  const SI = scale(SR);
  const sumWI = wI.reduce((a, b) => a + b, 0n);
  if (SI < 0n || SI > sumWI) return null;               // infeasible
  const out = lo.slice();
  if (SI === 0n || SI === sumWI) {                       // measure-zero slice: the corner itself
    varIdx.forEach((i, j) => { out[i] = SI === 0n ? lo[i] : hi[i]; });
    return out;
  }
  const ipow = (b, e) => { let r = 1n; for (let i = 0; i < e; i++) r *= b; return r; };
  let VInt = 0n;
  for (let mask = 0; mask < (1 << kv); mask++) {
    let W = 0n, bits = 0;
    for (let i = 0; i < kv; i++) if (mask & (1 << i)) { W += wI[i]; bits++; }
    const u = SI - W;
    if (u > 0n) VInt += (bits % 2 ? -1n : 1n) * ipow(u, kv - 1);
  }
  if (VInt <= 0n) return null;
  const n = kv - 2;
  const mtInt = (w, c) => {   // (n+1)(n+2) * integral_0^w t*((c-t)_+)^n dt, all-integer
    const a = c - w > 0n ? c - w : 0n, b = c > 0n ? c : 0n;
    if (b <= a) return 0n;
    const p1 = ipow(b, n + 1) - ipow(a, n + 1);
    const p2 = ipow(b, n + 2) - ipow(a, n + 2);
    return c * p1 * BigInt(n + 2) - p2 * BigInt(n + 1);
  };
  const toF = (num, den) => {   // one rounding: BigInt fraction -> float, scale-safe
    const neg = (num < 0n) !== (den < 0n);
    let N = num < 0n ? -num : num, Dd = den < 0n ? -den : den;
    const whole = N / Dd, frac = ((N % Dd) * 1000000000000000000n) / Dd;
    const f = Number(whole) + Number(frac) / 1e18;
    return neg ? -f : f;
  };
  for (let j = 0; j < kv; j++) {
    const rest = wI.filter((_, i) => i !== j);
    let acc = 0n;
    for (let mask = 0; mask < (1 << rest.length); mask++) {
      let W = 0n, bits = 0;
      for (let i = 0; i < rest.length; i++) if (mask & (1 << i)) { W += rest[i]; bits++; }
      acc += (bits % 2 ? -1n : 1n) * mtInt(wI[j], SI - W);
    }
    out[varIdx[j]] = lo[varIdx[j]] + toF(acc, BigInt(kv) * D * VInt);
  }
  /* Postcondition kept as a belt (in-bounds and summing to T at float tolerance); with the
     exact core its only job is catching a defect in THIS function, not float weather. */
  const EPS = 1e-6;
  for (let i = 0; i < k0; i++) if (out[i] < lo[i] - EPS || out[i] > hi[i] + EPS) return null;
  if (Math.abs(out.reduce((a, b) => a + b, 0) - T) > EPS * Math.max(1, Math.abs(T))) return null;
  return out;
}

function mixBand(m, p, sel, ranges, opts) {
  const baseState = (() => {
    try {
      const s = applyPresetSettings(m, p, sel);
      if (opts && opts.base) Object.assign(s, structuredClone(opts.base));
      return s;
    } catch { return null; }
  })();
  if (!baseState) return { refused: "the scenario itself does not evaluate, so there is no mix to speak about" };
  const pointBlend = baseState.blend || {};
  const pointMargin = (() => {
    try {
      const value = opts && typeof opts.cornerEval === "function"
        ? opts.cornerEval(baseState, opts.renderOpts)
        : workload(baseState, undefined, scenarioContext(baseState), opts && opts.renderOpts).margin * 100;
      return isFinite(value) ? value : NaN;
    }
    catch { return NaN; }
  })();

  const { blocks, covered, errors } = blendBlocksFromRanges(pointBlend, ranges);
  if (errors.length) return { point: pointMargin, refused: "declared mix ranges rejected: " + errors.join("; ") };
  if (!blocks.length) return null;                       // nothing declared — no surface, not a refusal
  if (blocks.length > MIX_MAX_BLOCKS)
    return { point: pointMargin, refused: blocks.length + " bounded providers at once — the vertex enumeration grows as k·2^(k-1) and this refuses rather than hang" };

  /* THE RANGE MUST CONTAIN THE POINT IT ANNOTATES. Mix ranges hang off a PERSPECTIVE, but a MODEL
     preset can override the blend — so GPT Pro's reading of Anthropic's fleet gets asked about
     OpenAI's, which is NVIDIA 100 / TPU 0 and outside every one of its declared ranges. Left
     un-guarded that returned a band of 89.50-90.06 around a point of 91.38: a bracket that excludes
     its own number, which is worse than showing nothing. The ranges describe a different fleet, and
     saying so is the honest output. */
  const outside = blocks.filter(b => b.pointTotal < b.lo - MIX_EPS || b.pointTotal > b.hi + MIX_EPS);
  if (outside.length)
    return { point: pointMargin, outside: outside.map(b => b.id),
      refused: "this scenario's own mix sits outside the declared ranges — "
        + outside.map(b => mixBlockName(b) + " is " + round1(b.pointTotal) + "%, declared " + b.lo + "–" + b.hi + "%").join("; ")
        + " — so these ranges describe a different fleet than the one on screen" };

  /* THE TOTAL THE BOUNDED PROVIDERS MUST KEEP. Legs outside every declared range are held at their
     point — silence is not permission to move a share — so the bounded ones must between them keep
     exactly the total they have now. On every preset this page ships the shares total 100, so this
     IS "sums to 100 %" in the owner's words; `declaredTotal` carries the scenario's own total so a
     reader who has dragged the sliders to some other total (they are relative weights, and the
     engine normalizes) gets a band on their own composition budget rather than a refusal, with the
     label saying so.

     WHY THERE IS NO "these ranges admit no legal mix" BRANCH. There cannot be one. The containment
     guard above establishes lo_j ≤ point_j ≤ hi_j for every block, and T is Σ point_j by
     construction, so Σlo ≤ T ≤ Σhi always — and a box cut by a hyperplane is non-empty exactly when
     that holds. The scenario's own mix is therefore ALWAYS a member of the feasible set, which is
     also why the band always brackets its own point. A declaration that cannot be satisfied is
     caught earlier, as the more informative "your ranges describe a different fleet", and it is
     caught by REFUSING rather than by rescaling the ranges to fit — rescaling is the silent
     renormalization this feature exists to avoid. */
  const fixedRemainder = HW_ORDER.filter(k => !covered.has(k)).reduce((a, k) => a + (pointBlend[k] || 0), 0);
  const declaredTotal = HW_ORDER.reduce((a, k) => a + (pointBlend[k] || 0), 0);
  const T = blocks.reduce((a, b) => a + b.pointTotal, 0);

  const blendFrom = (vals) => {
    const b = {};
    for (const k of HW_ORDER) b[k] = covered.has(k) ? 0 : (pointBlend[k] || 0);
    blocks.forEach((bl, i) => bl.legs.forEach((k, j) => { b[k] = (b[k] || 0) + vals[i] * bl.prop[j]; }));
    return b;
  };
  const evalMix = (vals) => {
    try {
      const s = applyPresetSettings(m, p, sel);
      if (opts && opts.base) Object.assign(s, structuredClone(opts.base));
      s.blend = blendFrom(vals);
      const value = opts && typeof opts.cornerEval === "function"
        ? opts.cornerEval(s, opts.renderOpts)
        : workload(s, undefined, scenarioContext(s), opts && opts.renderOpts).margin * 100;
      return isFinite(value) ? value : NaN;
    } catch { return NaN; }
  };

  /* VERTICES. At most one coordinate is fractional, so: pick the free block, drive every other block
     to an end, and solve the remaining one off Σ = T. Infeasible combinations simply do not produce
     a vertex. Deduped on a rounded key because two different end-assignments can land on the same
     point when a range is degenerate. */
  const verts = boundedSumVertices(blocks, T);
  const evaluated = verts.map(v => ({ v, y: evalMix(v) }));
  const live = evaluated.filter(x => isFinite(x.y));
  const unevaluable = evaluated.length - live.length;
  if (!live.length)
    return { point: pointMargin, T, vertices: 0, unevaluable,
      refused: "every mix at the edges of the declared ranges describes a scenario the engine refuses, so there is no attainable range to report" };

  const loV = live.reduce((a, b) => (b.y < a.y ? b : a));
  const hiV = live.reduce((a, b) => (b.y > a.y ? b : a));
  const med = projectCentresOntoSum(blocks, T);
  const midY = evalMix(med.vals);

  /* THE MEAN MIX (owner MEAN ruling; M8 wiring of the 6b1c71c construction). The derived-fleets
     stat is THE MARGIN AT THE MEAN MIX — the exact centroid of the feasible set under the
     non-informative uniform reading of the declared ranges, which adds no claim beyond what the
     author bounded. Exactly computable in EVERY regime. Where the survivor-set regime is constant
     across the envelope it is ALSO the expected margin (per-regime both sums are affine, so
     E[f(s)] = f(E[s]) holds there); where the regime varies, that stronger claim is NOT made — the
     regime signature gates it, never MIX_AFFINE_EPS (§2 amendment, dual consult 2026-08-10). */
  const meanVals = centroidOnSum(blocks.map(b => b.lo), blocks.map(b => b.hi), T);
  const meanY = meanVals ? evalMix(meanVals) : NaN;
  const meanMix = meanVals ? blendFrom(meanVals) : null;

  /* WHAT ACTUALLY LICENSES THE EXACTNESS CLAIM — the survivor-set regime, not affineness.
     (GPT-5.6 Pro, dual consult 2026-08-10; the argument this function was missing.)

     An adversarial review raised a real defect against the first version: the exactness claim rested
     on margin being AFFINE in the shares, and that only holds while every leg inside a varying block
     can serve the model. When one cannot, `blendedCosts` drops it and renormalizes over the
     survivors, so cost becomes

         Σ_{i ∈ R} wᵢcᵢ  /  Σ_{i ∈ R} wᵢ

     — and the denominator is no longer the constant 100. The review concluded the vertex enumeration
     could therefore mis-band, and that a single chord probe could not detect it. The first half is
     wrong and the second half is right, which is why the fix is a different check rather than a
     tighter one.

     It is wrong because BOTH sums stay affine in the shares whenever the renderable SET R is fixed:
     the objective is then linear-FRACTIONAL, a ratio of two affine functions, and a linear-fractional
     function over a polytope still attains its extrema at VERTICES (positive denominator). So
     renormalization does not cost us exactness — a CHANGE OF REGIME would.

     MEASURED, because an argument about code is a claim about the code you think you wrote: forcing
     renormalization on (a 12T model, 91 % of fleet weight pricing at one edge against 95 % at the
     centre), the vertex enumeration returns 68.400696–69.824856 and an 1,891-point dense grid over
     the same region returns 68.400696–69.824856 — identical to six decimals, extremes on swapped
     corners versus the healthy case. The old affineness probe flagged that band as an enclosure; it
     was exact all along.

     So: the regime signature is each present leg's renderable classification, compared across every
     mix this band reports. Constant ⇒ exact. Varying ⇒ the enumeration is no longer guaranteed and
     the claim degrades, naming the leg that changed. Affineness is still measured, but it is a
     DIAGNOSTIC now, not the criterion — a linear-fractional band is exact while reading non-affine. */
  const regimeAt = (blend) => {
    try {
      const s = applyPresetSettings(m, p, sel);
      if (opts && opts.base) Object.assign(s, structuredClone(opts.base));
      if (blend) s.blend = blend;
      const f = blendedCosts(s, undefined, undefined, undefined).fleetRenderable;
      if (!f || !Array.isArray(f.legStatuses)) return null;
      const out = new Map();
      for (const l of f.legStatuses) out.set(l.hwKey, l.renderableUnderPolicy === true);
      return out;
    } catch { return null; }
  };
  /* Every mix this band puts a number on, plus the point it annotates. A leg absent from a mix
     (zero share) contributes nothing to either sum, so its absence is not a regime change — only a
     leg whose CLASSIFICATION differs between two mixes is. */
  const regimeSamples = [null, blendFrom(loV.v), blendFrom(med.vals), blendFrom(hiV.v)]
    .concat(meanMix ? [meanMix] : [])   // the mean is a reported mix, so it joins the regime set (its expected-margin claim depends on this)
    .concat(live.map(x => blendFrom(x.v)))
    .map(regimeAt);
  const regimeConflicts = [];
  const regimeSeen = new Map();
  for (const r of regimeSamples) {
    if (!r) continue;
    for (const [leg, ok] of r) {
      if (!regimeSeen.has(leg)) regimeSeen.set(leg, ok);
      else if (regimeSeen.get(leg) !== ok && !regimeConflicts.includes(leg)) regimeConflicts.push(leg);
    }
  }
  const regimeConstant = regimeConflicts.length === 0 && regimeSamples.some(Boolean);

  /* WHAT LICENSES "ALSO THE EXPECTED MARGIN" (centroid-gate R1 P0-2, 2026-08-13). A constant
     survivor set is NOT enough: with renormalization live the objective is linear-fractional
     even at a fixed regime — the denominator Σ_{i∈R} wᵢ moves with the shares — and
     E[f(s)] = f(E[s]) is an affine property. Measured: on the strained fixture the expected
     margin (Gaussian quadrature) differs from the margin at the centroid by 0.0034 pp while
     the old gate said they were equal. The STRUCTURAL license is that the denominator cannot
     move: every leg whose share actually varies (a leg of a block with lo < hi) must be
     renderable under the constant regime — then non-renderable weight is constant, both sums
     are affine over P, and the claim is earned. Absent-from-samples counts as unlicensed
     (fail closed); the single-chord affineness probe remains a diagnostic, never the gate. */
  const varyingLegs = [...new Set(blocks.filter(b => b.hi - b.lo > MIX_EPS)
    .flatMap(b => b.legs.filter((_, i) => b.prop[i] > 0)))];
  const denominatorFixed = varyingLegs.length > 0
    && varyingLegs.every(l => regimeSeen.get(l) === true);

  /* Kept as a reported diagnostic: a nonzero deviation now means "renormalization is live here",
     which is worth surfacing, not "the band is untrustworthy". */
  const chord = loV.v.map((x, i) => (x + hiV.v[i]) / 2);
  const chordY = evalMix(chord);
  const affineDev = isFinite(chordY) ? Math.abs(chordY - (loV.y + hiV.y) / 2) : Infinity;
  const linearFractional = affineDev > MIX_AFFINE_EPS && regimeConstant;
  const exact = regimeConstant && unevaluable === 0;

  /* ONE BOUNDED PROVIDER CANNOT MOVE ANYTHING, and the readout has to say why rather than show a
     zero-width range. If exactly one block is free, Σ = 100 fixes it: the other shares are held at
     their declared points and the total forces the last one. That is the owner's own rule biting,
     not a defect — but a reader who bounds one provider and sees nothing happen will read it as
     broken, so the mechanism is named. Freedom needs two. */
  const singleBlockPinned = blocks.length === 1;
  const fallbacks = blocks.filter(b => b.fallbackSplit);

  /* THE OTHER RENORMALIZATION, CHECKED AT THE EDGES RATHER THAN ASSUMED AWAY.
     `blendedCosts` drops legs that cannot serve the model at the declared topology and renormalizes
     the survivors, with its own unconditional disclosure — but that disclosure describes the
     scenario ON SCREEN, which is the band's CENTRE. A band edge is a different mix, and a mix that
     moves weight onto a leg this model cannot serve is renormalized there and nowhere the reader can
     see. That is precisely the silent renormalization this feature was commissioned to avoid, so it
     is measured at every reported mix and said out loud when it differs from the centre.

     Note what is NOT reported here: the leg COUNT changing. Moving weight onto a leg that carries
     none is what a share range MEANS, and announcing it would be announcing the feature. What earns
     a sentence is weight going to legs that cannot serve — a share the reader declared that silently
     stops counting. */
  const renderShareAt = (blend) => {
    try {
      const s = applyPresetSettings(m, p, sel);
      if (opts && opts.base) Object.assign(s, structuredClone(opts.base));
      if (blend) s.blend = blend;
      const f = blendedCosts(s, undefined, undefined, undefined).fleetRenderable;
      return f && isFinite(f.renderableWeightShare) ? f.renderableWeightShare : null;
    } catch { return null; }   /* FAIL CLOSED. Returning 1 here would assert "fully renderable,
       nothing to disclose" on any exception — fail-OPEN, inside the one function whose entire job is
       catching silent renormalization, in a file where every neighbouring guard fails closed and
       names the problem (review finding, 2026-08-09). `null` means "could not measure", which the
       label reports as such rather than as an all-clear. */
  };
  const pointShare = renderShareAt(null);
  const edgeMeasures = [["lowest", blendFrom(loV.v)], ["reference", blendFrom(med.vals)], ["highest", blendFrom(hiV.v)]]
    .map(([name, blend]) => ({ name, share: renderShareAt(blend) }));
  const unmeasuredEdges = edgeMeasures.filter(x => x.share === null).map(x => x.name);
  const edgeShares = (pointShare === null) ? []
    : edgeMeasures.filter(x => x.share !== null && x.share < pointShare - 1e-9);

  return {
    point: pointMargin, lo: loV.y, mid: midY, hi: hiV.y,
    loMix: blendFrom(loV.v), midMix: blendFrom(med.vals), hiMix: blendFrom(hiV.v),
    mean: isFinite(meanY) ? meanY : null, meanMix, meanBlocks: meanVals ? meanVals.slice() : null,
    meanIsExpected: regimeConstant && denominatorFixed && isFinite(meanY),   // constant regime AND structurally fixed denominator — see the P0-2 note above
    medianIsDeclared: med.declared, medianBlocks: med.vals.slice(),
    blocks: blocks.map(b => ({ id: b.id, name: mixBlockName(b), lo: b.lo, hi: b.hi, centre: b.centre,
                               point: b.pointTotal, fallbackSplit: b.fallbackSplit })),
    vertices: live.length, unevaluable, T, fixedRemainder, declaredTotal, exact, affineDev,
    singleBlockPinned, pointRenderableShare: pointShare, renormalizedEdges: edgeShares,
    regimeConstant, regimeConflicts, linearFractional, unmeasuredEdges, refused: null,
    /* TWO STRINGS, ONE SET OF BYTES. `label` is the whole claim, for any surface that emits the band
       without re-deriving its epistemics (the MCP is the live one). `claimLabel` is the same minus
       the median sentence, because the page renders WHERE THE MEDIAN CAME FROM as its own line and a
       reader should not be told it twice. The renderer picks; it never composes. */
    label: mixLabelParts({ exact, affineDev, linearFractional, regimeConflicts, singleBlockPinned,
                           medianDeclared: med.declared, unevaluable, corners: evaluated.length,
                           fallbacks, declaredTotal, T, edgeShares, pointShare, unmeasuredEdges }).join("; "),
    claimLabel: mixLabelParts({ exact, affineDev, linearFractional, regimeConflicts, singleBlockPinned,
                                medianDeclared: null, unevaluable, corners: evaluated.length,
                                fallbacks, declaredTotal, T, edgeShares, pointShare, unmeasuredEdges }).join("; "),
  };
}

/* THE CLAIM A MIX BAND IS ENTITLED TO MAKE, as parts so one surface can drop a sentence it renders
   itself without any surface composing its own epistemics. `medianDeclared: null` omits the median
   sentence entirely — that is `claimLabel`, and the page uses it because it prints the median's
   provenance on its own line. Every other caller takes the whole thing. */
function mixLabelParts(o) {
  /* M8 exit-gate council F2 (2026-08-13): four branches hardcoded "100 %" while the band
     explicitly supports totals ≠ 100 — at T=120 one label said both "sum to 100 %" and "your
     shares total 120". Every clause now speaks the BOUNDED BLOCKS' own total (o.T); the final
     your-shares-total clause keeps whole-fleet declaredTotal, which is a different noun. */
  const tWord = Math.abs(o.T - 100) > MIX_EPS ? round1(o.T) + " (the bounded providers' own total)" : "100 %";
  return [
    o.exact
      ? "attainable over the mixes that sum to " + tWord + " inside the declared ranges — every margin between these bounds is reached by some legal mix, and none reaches outside them"
        + (o.linearFractional ? " (cost is a ratio of two straight lines here, because part of the fleet renormalizes — the ends are still exact, which is why this says attainable and not merely bounded)" : "")
      : (o.regimeConflicts && o.regimeConflicts.length)
        ? "an enclosure rather than the attainable range: " + o.regimeConflicts.join(", ")
          + " can serve the model at some mixes in this range and not at others, so the ends are no longer guaranteed to sit at the edges of the feasible set"
        : "an enclosure rather than the attainable range: this range covers the part of the feasible set that computes",
    o.singleBlockPinned
      ? "only one provider is bounded, so the total forces it: with every other share held at its declared point there is exactly one mix that sums to " + tWord + ". Bound a second provider to give the mix room to move"
      : "",
    o.medianDeclared === null ? ""
      : o.medianDeclared
        ? "the reference is the declared mix itself — its shares already sum to " + tWord
        : "the reference is DERIVED: the nearest mix to the declared shares that sums to " + tWord + ", because the declared ones do not. It is a transparent repair by this page, not a statistic",
    o.unevaluable ? o.unevaluable + " of " + o.corners + " edge mixes describe scenarios this engine refuses, so this range covers the part of the feasible set that computes" : "",
    o.fallbacks.length ? "the split inside " + o.fallbacks.map(b => mixBlockName(b)).join(" and ")
      + " follows this page's registered default fleet, because the scenario puts no traffic there to scale" : "",
    /* Shares are relative weights, so a reader can leave them totalling something other than 100 and
       the engine normalizes. The constraint still binds — the bounded providers keep the total they
       have — but calling that "sums to 100 %" would be false, so it is said in their numbers instead
       of theirs being quietly restated as his. */
    Math.abs(o.declaredTotal - 100) > MIX_EPS
      ? "your shares total " + round1(o.declaredTotal) + " rather than 100, so the bounded providers are held to the "
        + round1(o.T) + " they carry between them and the fleet is normalized as it always is" : "",
    /* The infeasible-leg renormalization, named where it bites: at a band EDGE rather than at the
       scenario on screen, which is the one place the standing disclosure cannot reach. */
    (o.edgeShares && o.edgeShares.length)
      ? "at the " + o.edgeShares.map(x => x.name).join(" and ") + " end"
        + (o.edgeShares.length > 1 ? "s" : "") + " some of the traffic you bounded lands on legs this model cannot serve"
        + " at the declared topology, so " + o.edgeShares.map(x => Math.round(x.share * 100) + "%").join(" and ")
        + " of the fleet weight prices there against " + Math.round(o.pointShare * 100) + "% at the centre"
      : "",
    /* "Could not measure" is reported, never rounded up into an all-clear. */
    (o.unmeasuredEdges && o.unmeasuredEdges.length)
      ? "the renderable fleet weight could not be measured at the " + o.unmeasuredEdges.join(" and ")
        + " end, so this range does not claim that nothing renormalizes there" : "",
  ].filter(Boolean);
}

function round1(x) { return Math.round(x * 10) / 10; }
/* Provider blocks are named by their family the way the page already names hardware families; a leg
   block borrows the accelerator's registered name so one vocabulary covers both. */
function mixBlockName(b) {
  if (b.family) return b.family === "nvidia" ? "NVIDIA" : b.family === "tpu" ? "TPU" : b.family === "trainium" ? "Trainium" : b.family === "ascend" ? "Ascend" : b.family;
  const k = b.legs[0];
  return HW[k] ? HW[k].name : k;
}

/* The declared mix ranges on a scenario, separated from the box dials. `dialsFromRanges` must never
   hand a blend id to `marginBand` — a coupled axis inside a corner enumeration would band over mixes
   the ruling excludes — so the split happens once, here and there, against the same prefix. */
function mixRangesFromRanges(ranges) {
  const out = {};
  for (const [id, r] of Object.entries(ranges || {})) if (id.startsWith("blend.")) out[id] = r;
  return Object.keys(out).length ? out : null;
}

/* THE LEAD BASIS, declared on every band. These two estimates were once compared across a MIXED
   lead treatment, and the "0.7 pp convergence" that produced was an artifact of the mix rather than
   agreement; the binding out of that finding is that no bracket is drawn without a declared common
   basis, and that the +3-month prior is never applied on top of a band that already contains one.
   A band IS a bracket, so it declares its basis.

   Lives in the engine rather than the renderer for the same reason the other claim-governing
   sentences do: it is a statement about what a number may be compared with, so it must be testable
   without a browser and emittable by any surface that emits the band.

   When the reader has bounded the lead dial ITSELF the band is not on one basis at all, and that is
   said in different words rather than folded into the same sentence — a range whose width is partly
   the lead assumption moving carries that assumption inside it, so nothing adds the prior a second
   time. The COMPARABILITY framing that once sat here is dropped (owner, 2026-08-08). */
/* The prefix is a named constant because it is claim-governing COPY, which this codebase keeps
   addressable rather than inline: a reader, a test and the MCP all have to be able to point at the
   same bytes and say "that is the basis declaration". */
const BAND_LEAD_BASIS = "Lead basis: ";
function bandLeadBasisClause(state, dials) {
  const bounded = (dials || []).find(d => d.key === "trendMonths");
  /* OWNER RULING 2026-08-08: the lead range reads the obvious way, and the framing that these
     readings "cannot be compared" is DROPPED. The headline compares the calculators' end results —
     that is the comparison the page exists to support, and telling a reader the numbers are
     incomparable was both discouraging and wrong: two calculators run to their ends ARE comparable,
     which is the whole point of running them.
     What survives is the narrower thing, which was always the real binding: the prior is already
     inside this range, so nothing adds it a second time. That is a double-count guard, not a
     comparability claim, and the two were tangled together in one sentence. */
  if (bounded)
    return BAND_LEAD_BASIS + "the algorithmic-lead prior itself is part of this range ("
      + bounded.lo + " to " + bounded.hi + " months), so its width covers that assumption moving as "
      + "well as the cost picture. The prior is already inside it \u2014 it is not applied again on top.";
  const months = Number(state && state.trendMonths) || 0;
  return BAND_LEAD_BASIS + (months === 0
    /* im-vet-six-repairs (2026-09-20), vetting finding E4: "the basis both estimate presets carry"
       stopped being true when both round-3 revisions moved their dials off zero (0/2/4 midpoint 2,
       and 0/1/2 midpoint 1). Zero is still the COMMON basis their authors declare for a cross-arm
       comparison, which is the useful thing this sentence was reaching for; what it may not say is
       that it is the basis they run at. */
    ? "no algorithmic-lead prior (0 months) \u2014 the common basis both estimate presets declare for a cross-arm comparison, though neither RUNS at it: their own dials sit at 2 and 1 months."
    : "an algorithmic-lead prior of " + months + " months, held fixed across the whole range. An estimate quoted at a different lead is not comparable with this one, and the prior is already inside it \u2014 it is not applied again on top.");
}

/* THE AUTHOR'S OWN STATED READING, as a sentence. Engine-side for the same reason the lead-basis
   clause is: it governs how a number may be read, so it must be testable without a browser.

   Everything here is QUOTED. This page computes a different number from the same author's vector —
   about four points lower for the round-2 contextual review — and that gap is not a defect to be
   closed but the finding itself: the review declined to collapse five of its dials to points, and
   asked in writing that its vector not be tuned until it reproduced its stated figure. So the
   sentence names the gap in this page's own numbers rather than leaving a reader to notice two
   percentages that disagree and guess which one the page believes.

   Returns null where a preset states nothing — the reproducibility floor is a point, not an
   estimate with a band, and inventing one for it would be the exact error this whole arc is about. */
/* WHAT THE CALCULATOR READS AT A STATED READING'S AUTHORED SCOPE (owner note note-20260912T180812Z-c9eaac;
   Astra review round 1, finding F1). The dated comparison is true only at the scope the figure was stated
   on, so it is computed THERE — the model, traffic profile and preset settings recorded in `authoredAgainst`
   — and never from whatever the reader has on screen. Switching to another model, another traffic mix or an
   edited slider changes the object being measured, not the calculator version, and a sentence attributing
   that difference to later calculator changes would be false. The sentence names its scope for that reason. */
/* Every stated reading on this page was stated for Claude Opus 4.x at the Reference traffic mix with the
   estimate's own settings (each estimate card's Estimand line says so). `authoredAgainst` restates that scope
   where a dated reading is recorded; this default carries it for the stated readings that have none. */
const STATED_READING_SCOPE = Object.freeze({ model: "opus", profileId: "reference", scopeLabel: "Claude Opus 4.x, Reference traffic mix, this estimate's own settings" });
function authoredScopeLabel(p) {
  const aa = p && p.statedReading && p.statedReading.authoredAgainst;
  return (aa && aa.scopeLabel) || STATED_READING_SCOPE.scopeLabel;
}
function authoredScopeReading(p) {
  if (!p || !p.statedReading) return NaN;
  const aa = p.statedReading.authoredAgainst || STATED_READING_SCOPE;
  const m = MODELS.find(x => x.id === aa.model);
  if (!m) return NaN;
  try { return workload(applyPresetSettings(m, p, { mode: "explicit", profileId: aa.profileId })).margin * 100; }
  catch { return NaN; }
}
function authoredScopeSentence(p) {
  const aa = p && p.statedReading && p.statedReading.authoredAgainst;
  if (!aa || !isFinite(aa.computed)) return "";
  const now = authoredScopeReading(p);
  if (!isFinite(now) || Math.abs(aa.computed - now) < 0.05) return "";
  return " At its authored settings (" + aa.scopeLabel + "), this calculator computed " + aa.computed.toFixed(2)
    + " % when the figure was stated (" + aa.date + (aa.route ? "; " + aa.route : "") + ") and computes "
    + now.toFixed(2) + " % there today. Those settings have not changed; the calculator's own later changes moved that reading "
    + (now < aa.computed ? "down" : "up") + " by " + Math.abs(aa.computed - now).toFixed(2) + " points.";
}
function statedReadingClause(p, computedPct, opts) {
  const s = p && p.statedReading;
  if (!s) return null;
  const round1 = (x) => (Math.round(x * 10) / 10).toString();
  /* F2 (Astra round 2): the caller computes on the model and traffic mix ON SCREEN, which need not be the
     estimate's own. When the caller also supplies the reading at the estimate's own settings (opts.atScope)
     and the two differ, the gap is stated at the estimate's own settings, and the caller's reading is named for
     what it is: these UNEDITED settings applied to the model and traffic mix selected now (Astra round 3 F2 — the
     caller recomputes the preset, so after a slider edit it is not the result on screen, and it never claims to
     be). Called with two arguments the clause is unchanged. */
  const atScope = opts && isFinite(opts.atScope) ? opts.atScope : NaN;
  const offScope = isFinite(atScope) && isFinite(computedPct) && Math.abs(atScope - computedPct) >= 0.005;
  const basisPct = offScope ? atScope : computedPct;
  const gap = isFinite(basisPct) ? (s.central - basisPct) : NaN;
  return {
    headline: "Author's stated reading: \u2248" + round1(s.central) + " % (" + s.lo + "\u2013" + s.hi + " %)",
    basis: "Stated by " + s.who + ", " + s.basis + " \u2014 QUOTED, not computed here."
      + (isFinite(gap)
        ? " This page computes \u2248" + round1(basisPct) + " % from their vector"
          + (offScope ? " at its own settings (" + authoredScopeLabel(p) + ")" : "") + ", "
          + round1(Math.abs(gap)) + " points " + (gap > 0 ? "below" : "above") + " what they state; "
          + s.caveat + "."
          + (offScope ? " Applied unedited to the model and traffic mix selected now, these settings read \u2248"
            + round1(computedPct) + " %; that difference is not a disagreement with this estimate." : "")
        : "")
      + authoredScopeSentence(p)
      + " Companion basis: " + s.companion + ".",
  };
}

function lensSpan(m, sel = { mode: "native" }, opts) {
  const tr = resolveTraffic(m, PERSPECTIVES.find(p => p.id === "median"), sel);
  const compat = PERSPECTIVES.filter(p => p.kind === "lens" && pairingWarning(m, p) === "");
  const contributors = compat.map(p => {
    const s = applyPresetSettings(m, p, sel);
    /* b9 M5 (memo §15): the FA computation pins its per-lens states to the trend-0 reference;
       every OTHER caller (the app's hero note, the MCP server) gets the live ratified defaults,
       which move uniformly across contributors because the prior is lab-bound, not lens-bound. */
    if (opts && opts.referencePin) pinReferenceLevers(s);
    /* row 499: byte-identical LEAD TREATMENT for every contributor, for exactly the reason the line
       below holds traffic identical. This span answers ONE question — how far does the choice of
       COST LENS move the number — so a contributor may not enter it carrying a different
       algorithmic-lead prior; that would report a lead-axis difference as a procurement-axis span,
       the axis conflation this engine's interlock exists to prevent. Before row 499 the property
       held by accident (every lens inherited the same lab-seeded prior); the typed `trendBaseline`
       that lets a preset carry its author's own lead treatment would have broken it silently —
       the stress case would have dragged the published span's low end from ~69% to ~59% on a lead
       difference alone, while its cost vector is the central lens's own. (Those two figures are
       the readings OF THAT ERA, quoted to describe a defect that was prevented; they are not a
       current published value and must not be re-derived against today's engine.) Pinned here explicitly.
       Under `referencePin` the pin above has already set trend 0 and this is a no-op by
       construction (it re-asserts the same values). */
    if (!(opts && opts.referencePin)) { s.trendMonths = trendDefaultMonths(m); s.trendRate = DEFAULTS.trendRate; }
    s.ioRatio = tr.ioRatio; s.cacheHit = tr.cacheHit; // byte-identical traffic for every contributor
    const wl = workload(s);
    return { id: p.id, ioRatio: s.ioRatio, cacheHit: s.cacheHit, margin: wl.margin, fleetRenderable: wl.fleetRenderable };
  }).filter(c => isFinite(c.margin));
  if (contributors.length < 2) return contributors.length === 1
    ? { lo: contributors[0].margin, hi: contributors[0].margin, n: 1, single: true, contributors, ioRatio: tr.ioRatio, cacheHit: tr.cacheHit, label: tr.label,
        loFleetRenderable: contributors[0].fleetRenderable, hiFleetRenderable: contributors[0].fleetRenderable }
    : null;
  const ms = contributors.map(c => c.margin);
  const loC = contributors.reduce((a, c) => c.margin < a.margin ? c : a, contributors[0]);
  const hiC = contributors.reduce((a, c) => c.margin > a.margin ? c : a, contributors[0]);
  return { lo: Math.min(...ms), hi: Math.max(...ms), n: contributors.length, single: false, contributors,
           ioRatio: tr.ioRatio, cacheHit: tr.cacheHit, label: tr.label,
           loFleetRenderable: loC.fleetRenderable, hiFleetRenderable: hiC.fleetRenderable };
}
// B3 (final re-verification, P1): the shared, byte-identical rendering for both app.js (hero
// note) and the MCP server (mcp-server's `E` is this exact module) -- always names each
// endpoint's K/M legs + declared-weight share, and appends the differs-across-endpoints warning
// only when the two endpoints' fleet memberships actually differ (verifier's exact minimal fix).
function lensSpanMembershipNote(spanRes) {
  if (!spanRes || spanRes.single) return "";
  const lo = spanRes.loFleetRenderable, hi = spanRes.hiFleetRenderable;
  if (!lo || !hi) return "";
  const legShare = f => f.renderableLegs + "/" + f.totalLegs + " legs, " + Math.round(f.renderableWeightShare * 100) + "% of declared weight";
  const differ = lo.renderableLegs !== hi.renderableLegs || Math.abs(lo.renderableWeightShare - hi.renderableWeightShare) > 1e-9;
  const base = "low endpoint " + legShare(lo) + "; high endpoint " + legShare(hi);
  return differ ? base + " — fleet membership differs across endpoints; this is not one continuous same-fleet interval" : base;
}


/* Scenario-diff sanitizer (v2.1.2 reception remediation): a shared link's overlay may only
   touch known state keys with sane numeric/string values, and may NEVER override the traffic
   of a locked replay (that was a forgery vector: a v3 link could claim the locked xAI replay
   while smuggling 300:1/95% traffic past the resolver). Returns {diff, rejected:[...]}. */
const SCENARIO_BOUNDS = { // hard schema for shared-link overlays: [min, max] or enum list
  active: [1, 5000], total: [10, 50000], ioRatio: [1, 1000], cacheHit: [0, 95], billCacheHit: [0, 95],
  cacheCost: [0, 100], rentMult: [0.02, 20], rentAbsAll: [0.05, 50], rentAbsLeg: [0.05, 50], util: [1, 100], stackMult: [0.1, 1.6],
  specDec: SPECDEC_BOUNDS, // b9 spec-decode LEVER (memo D-SD-6)
  nvlinkCapMinRatio: NVLINKCAP_BOUNDS, // d-im-h800: the H800/H100 differential lever
  // b9 M5 (memo §6.3): the lever keys. trendRate additionally carries a CLOSED numeric enum
  // (a [min,max] row alone would silently admit 4×/yr), trendMonths an integer constraint.
  trendMonths: TREND_MONTHS_BOUNDS, trendRate: [TREND_RATES[0], TREND_RATES[TREND_RATES.length - 1]],
  famNvidia: FAMILY_BOUNDS, famTpu: FAMILY_BOUNDS, famTrainium: FAMILY_BOUNDS, famAscend: FAMILY_BOUNDS,
  kwh: [0.01, 1], pue: [1, 3], dcPerW: [1, 50], lifeYears: [1, 15], clusterOh: [1, 3], opexPct: [0, 50],
  /* im-arc T4 fold (2026-08-24): the facility life becomes a bounded, shareable dial (the
     historical literal 12 sits inside these bounds so a pinned historical state still loads),
     and the capital-recovery basis travels as a closed enum plus its rate. */
  dcLifeYears: [1, 40], costOfCapitalPct: [0, 40], capitalRecovery: ["off", "on"],
  /* The two historical-pin keys. `capexAbsLeg` shares capexUsd's own CF bounds so a pinned
     historical capex is checked exactly as a reader-entered one would be. */
  capexAbsLeg: [1000, 200000], rentRegistryPin: [0.05, 50], capexScopeMode: ["scoped", "legacy-global"],
  priceIn: [0.01, 500], priceOut: [0.01, 2000], cacheReadMult: [0, 100], cacheWriteShare: [0, 100],
  cacheWriteMult: [100, 400], batchShare: [0, 100], discount: [0, 95], subPlan: [1, 10000], subUsage: [0, 1e7],
  precision: PRECISION_ENUM_KEYS, interact: INTERACT_ENUM_KEYS, hwMode: ["rent", "tco"],
  customDonor: ["dsr1", "qwen3c", "llama70"], // must match CUSTOM_DONOR_ENUM.values / CUSTOM_DONOR_BOUNDS — cross-checked by test
};
const NUMERIC_ENUMS = Object.freeze({ trendRate: TREND_RATES }); // closed numeric domains (b9 M5)
const INTEGER_STATE_KEYS = Object.freeze(["trendMonths"]);       // integer-only numeric state (b9 M5)
function sanitizeScenarioDiff(diff, traffic, base = DEFAULTS) {
  const clean = {}, rejected = [];
  for (const [k, v] of Object.entries(diff || {})) {
    if (k === "_meta") continue;
    if (!(k in DEFAULTS)) { rejected.push(k + " (unknown key)"); continue; }
    const dv = DEFAULTS[k], b = SCENARIO_BOUNDS[k];
    // Nullable-numeric fields (billCacheHit: default null = "assumed equal", numeric bounds [0,95])
    // are numbers when set. Keying the branch on typeof dv alone sent them to the object branch
    // (typeof null === "object") and rejected a valid {billCacheHit:95} as "bad object" — a valid
    // override silently dropped on share-link load, reverting the margin (fixed 2026-07-12).
    if (dv === null && v === null) {
      clean[k] = v;
      continue;
    } else if (k === "rentAbsLeg" || k === "capexAbsLeg" || k === "rentRegistryPin") {
      /* im-arc T1 (plan §1 T1, owner answer d-20260822-4c26 2026-08-22): closed
         donor-keyed absolute-rent map. One invalid member rejects the whole claim. */
      if (typeof v !== "object" || v === null || Array.isArray(v)) { rejected.push(k + " (bad object)"); continue; }
      const rbAbs = SCENARIO_BOUNDS[k];
      const okAbs = Object.entries(v).every(([hw, price]) =>
        HW_ORDER.includes(hw) && typeof price === "number" && isFinite(price) && price >= rbAbs[0] && price <= rbAbs[1]);
      if (!okAbs) { rejected.push(k + " (invalid legs/prices)"); continue; }
    } else if (typeof dv === "number" || (dv === null && Array.isArray(b) && typeof b[0] === "number")) {
      if (typeof v !== "number" || !isFinite(v)) { rejected.push(k + " (non-numeric)"); continue; }
      if (Array.isArray(b) && (v < b[0] || v > b[1])) { rejected.push(k + " (out of range " + b[0] + ".." + b[1] + ")"); continue; }
      /* b9 M5: two constraints a [min,max] row cannot express. A CLOSED numeric enum (trendRate
         ∈ {2,3,5} — an interpolated 4×/yr is not a ratified rate) and an INTEGER domain
         (trendMonths, step 1). Both fail the same way every other bad value does. */
      if (Object.prototype.hasOwnProperty.call(NUMERIC_ENUMS, k) && !NUMERIC_ENUMS[k].includes(v)) { rejected.push(k + " (invalid value)"); continue; }
      if (INTEGER_STATE_KEYS.includes(k) && !Number.isInteger(v)) { rejected.push(k + " (non-integer)"); continue; }
    } else if (typeof dv === "string") {
      if (typeof v !== "string") { rejected.push(k + " (bad string)"); continue; }
      if (Array.isArray(b) && !b.includes(v)) { rejected.push(k + " (invalid value)"); continue; }
    } else if (k === "dialRanges") {
      /* row 499: typed map of declared ranges. Every id must name a dial this engine actually has,
         every end must sit inside that dial's own legal domain, and lo <= mid <= hi. A malformed
         entry rejects the KEY whole rather than being repaired into something plausible — a range
         is a claim about how uncertain someone is, and quietly widening or narrowing one would
         misreport that. */
      if (typeof v !== "object" || v === null || Array.isArray(v)) { rejected.push("dialRanges (bad object)"); continue; }
      const okRanges = Object.entries(v).every(([id, r]) => {
        const b = dialBounds(id);
        if (!b || !r || typeof r !== "object") return false;
        const ends = [r.lo, r.hi].concat(r.mid === undefined ? [] : [r.mid]);
        if (!ends.every(x => typeof x === "number" && isFinite(x) && x >= b[0] && x <= b[1])) return false;
        if (r.lo > r.hi) return false;
        if (r.mid !== undefined && (r.mid < r.lo || r.mid > r.hi)) return false;
        /* `split` is legal ONLY on a blend range and only over that block's own legs — the
           author-declared intra-family composition (dual consult 2026-08-10). Fails closed like
           every other malformed entry: the KEY is rejected whole, never repaired. */
        if (r.split !== undefined) {
          if (!id.startsWith("blend.")) return false;
          if (typeof r.split !== "object" || r.split === null || Array.isArray(r.split)) return false;
          const legsHere = id.startsWith("blend.fam.") ? legsInFamily(id.slice(10)) : [id.slice(6)];
          const e = Object.entries(r.split);
          if (!e.length) return false;
          if (!e.every(([k, v]) => legsHere.includes(k) && typeof v === "number" && isFinite(v) && v >= 0)) return false;
          if (!(e.reduce((a, [, v]) => a + v, 0) > 0)) return false;
        }
        return Object.keys(r).every(kk => kk === "lo" || kk === "mid" || kk === "hi" || kk === "split");
      });
      if (!okRanges) { rejected.push("dialRanges (invalid ids/ends)"); continue; }
    } else if (k === "rentMultFam") {
      /* row 499: typed map over HARDWARE FAMILIES (the same closed set FAMILY_STATE_KEY names),
         values inside the global multiplier's bounds. Same fail-closed posture as rentMultLeg. */
      if (typeof v !== "object" || v === null || Array.isArray(v)) { rejected.push("rentMultFam (bad object)"); continue; }
      const rbF = SCENARIO_BOUNDS.rentMult;
      const okFam = Object.entries(v).every(([fam, mul]) =>
        Object.prototype.hasOwnProperty.call(FAMILY_STATE_KEY, fam)
        && typeof mul === "number" && isFinite(mul) && mul >= rbF[0] && mul <= rbF[1]);
      if (!okFam) { rejected.push("rentMultFam (invalid families/multipliers)"); continue; }
    } else if (k === "rentMultLeg") {
      /* row 499: typed map — known hardware ids only, values inside the same bounds as the global
         multiplier. An unknown leg id or an out-of-range value rejects the KEY whole (fail closed),
         exactly like a forged blend; a `null` (no per-leg posture) is handled by the null branch
         above. Own-property enumeration only — a leg id arriving from a URL never resolves through
         Object.prototype. */
      if (typeof v !== "object" || v === null || Array.isArray(v)) { rejected.push("rentMultLeg (bad object)"); continue; }
      const rb = SCENARIO_BOUNDS.rentMult;
      const okLeg = Object.entries(v).every(([hw, mul]) =>
        HW_ORDER.includes(hw) && typeof mul === "number" && isFinite(mul) && mul >= rb[0] && mul <= rb[1]);
      if (!okLeg) { rejected.push("rentMultLeg (invalid legs/multipliers)"); continue; }
    } else if (k === "blend") {
      if (typeof v !== "object" || v === null || Array.isArray(v)) { rejected.push("blend (bad object)"); continue; }
      const ok = Object.entries(v).every(([hw, w]) => HW_ORDER.includes(hw) && typeof w === "number" && isFinite(w) && w >= 0 && w <= 100)
        && Object.values(v).some(w => w > 0);
      if (!ok) { rejected.push("blend (invalid shape/weights)"); continue; }
    } else if (typeof dv === "object") {
      if (typeof v !== "object" || v === null) { rejected.push(k + " (bad object)"); continue; }
    }
    if ((k === "ioRatio" || k === "cacheHit") && traffic && traffic.locked) {
      rejected.push(k + " (locked by replay — overlay rejected)"); continue;
    }
    clean[k] = v;
  }
  const active = Object.prototype.hasOwnProperty.call(clean, "active") ? clean.active : base && base.active;
  const total = Object.prototype.hasOwnProperty.call(clean, "total") ? clean.total : base && base.total;
  if (typeof active === "number" && typeof total === "number" && active > total) {
    if (Object.prototype.hasOwnProperty.call(clean, "active")) delete clean.active;
    if (Object.prototype.hasOwnProperty.call(clean, "total")) delete clean.total;
    rejected.push("active/total (active exceeds total)");
  }
  /* b9 spec-decode LEVER — THE CORRECTION CHANNEL (memo [N-CORRECTION-LIFETIME]).
     A sanitize/restore/overlay path that forces `specDec` to 1.00 must SAY SO. Showing "none
     selected" after a silent force LIES ABOUT USER INTENT, and that is the defect this third
     return field exists to prevent — the function returned {diff, rejected} only, so there was no
     channel to carry it and an implementation could render nothing at all.

     Validated on the RESOLVED state (base + clean), never on the diff alone: a diff that moves only
     `stackMult` can shut the gate under a base that already carries credit, and a diff-only check
     would miss exactly that case. The force is applied to the clean diff so the state the caller
     builds carries it too. */
  const rSpecDec = Object.prototype.hasOwnProperty.call(clean, "specDec") ? clean.specDec : (base && base.specDec);
  const rStackMult = Object.prototype.hasOwnProperty.call(clean, "stackMult") ? clean.stackMult : (base && base.stackMult);
  const corrections = [];
  if (typeof rSpecDec === "number" && rSpecDec > 1 && !stackAtMtpFreeTick(rStackMult)) {
    corrections.push({ key: "specDec", from: rSpecDec, to: 1.00, reasonCode: "gate-closed" });
    clean.specDec = 1.00;
  }
  return { diff: clean, rejected, corrections };
}
/* Does a sanitized overlay change any field a replay's published operating point pins?
   Used by the loader to DOWNGRADE such loads to a modified scenario (attribution removed)
   rather than render forged numbers under a replay's name. */
function overlayDivergesFromReplay(m, p, cleanDiff) {
  if (!p || p.kind !== "replay") return false;
  const base = applyPresetSettings(m, p);
  // Any margin-affecting override diverges the replay from its published operating point. `base`
  // already carries the replay's pinned values, so a plain diff-vs-base comparison is complete.
  // Only the subscription inputs (subPlan/subUsage) are orthogonal to the serving margin. The prior
  // hardcoded whitelist omitted billCacheHit/cacheCost/cacheWriteShare/cacheWriteMult and the whole
  // owned-TCO stack, letting an economically-mutated overlay keep the clean replay identity
  // (honest-labeling bug, fixed 2026-07-12).
  return Object.keys(cleanDiff).some(k => k !== "subPlan" && k !== "subUsage" &&
    JSON.stringify(cleanDiff[k]) !== JSON.stringify(base[k]));
}

/* TRAFFIC STATE-CONSISTENCY INVARIANT (v2.1.3 M4; plan P0-B). Three traffic surfaces exist:
   (1) the identity the traffic selector DISPLAYS, (2) the values resolveTraffic() RESOLVES,
   and (3) the ioRatio/cacheHit the margin computation actually READS from the working state.
   They must ALWAYS be the same numbers — a share-link must never leave traffic values in the
   working state behind a still-displayed named profile (the hidden state≠display mismatch).
   A link's numeric diff may legitimately carry raw traffic values (the encoder stores every
   non-default state key); this pure helper decides how they may enter:
   - they AGREE with the link's declared traffic identity → ride that identity unchanged;
   - they DISAGREE (or no identity was restored) → they must flow through the traffic AXIS as
     an explicit Custom selection, so selector, resolver and computation all move together;
   - declared identity is a LOCKED replay → locked traffic wins (the sanitizer has already
     rejected the keys; nothing may route around the lock).
   Returns { action: "none" | "locked" | "consistent" | "custom", ioRatio?, cacheHit? }. */
function reconcileLinkTraffic(declared, cleanDiff) {
  const d = cleanDiff || {};
  if (!("ioRatio" in d) && !("cacheHit" in d)) return { action: "none" };
  if (declared && declared.locked) return { action: "locked" };
  const io = d.ioRatio ?? (declared ? declared.ioRatio : DEFAULTS.ioRatio);
  const ch = d.cacheHit ?? (declared ? declared.cacheHit : DEFAULTS.cacheHit);
  if (declared && io === declared.ioRatio && ch === declared.cacheHit) return { action: "consistent" };
  return { action: "custom", ioRatio: io, cacheHit: ch };
}

/* ---------- permalink codec (v4 since the v2.1.3 preset redesign; decodes v3/v2 — pure) ---------- */
const ENGINE_REVISION = "v3.0.0-2026-08-13"; // v3.0.0 — the M8 release (badge ruled v3.0 by Polaris per plan D-10, esc-20260813T014805Z-1df204c8): the unified b9 arc goes public — UX-C claim-bearing tails + M7 citation repairs (previously dev-only), the provider-range calculator (owner ruling q-sliders-fleet-util-point) with the exact mean-mix stat (owner MEAN ruling; exact BigInt centroid), three user-reachable Share-crash classes fixed (modified-blend, preset-total, scope-crossing switch), bq-290..294 hardening, FA landing-lead clause derived (was stale-hardcoded), denominator-aware mix labels, dated changelog correction on the band exactness argument. HEADLINE INVARIANT vs v2.2.0: 255/255 states byte-identical, evidence research/m8-headline-invariance-evidence.md. // v2.2.0 — PRODUCTION RELEASE of the b9 arc (owner ruling q-row441-ref-and-bridge, 2026-08-06; merge source v22-reengineer @ 5325791). First publication of the repaired defaults, the b9 M6 two-reading FINAL-ANSWER surface, the spec-decode lever and the UX-A/UX-B legs. The public landing headline moves from the previously published ≈77% to ≈69% at the landing default (opus/median), with ≈59% carried as the second, labeled public-evidence reference reading; the legacy bridge on the FINAL-ANSWER surface names the ≈77% predecessor and separates what the total-size revision moved from what the margin-evidence adjudication moved (FA-arc acceptance rows G1A-1 and G1A-3). v2.1.12's two owner-APPROVED RAISE Summit podcast claims are carried forward unchanged. // 2026-07-27 external review: live rendering now consumes the trusted capacity solve's selected residency row; placement and sampled-policy batches, receipts, and published derived values re-minted. // v2.2.0-dev: activate the reviewed IM3 roofline display path — per-regime operating points, fixed-OSL traffic lengths, per-row precision tuples and calibration, finite/capped/infeasible feasibility states, and interim structurally disclosed mixed-fleet renormalization. Billing/procurement/traffic-resolution/codec math remains unchanged. // v2.1.11: cold-review-v2110 follow-up (labeling/hygiene only, NO engine numbers changed) — Gemini "Why the interval" para dropped its 89–98% floor claim to match the "not publicly identifiable" headline (cold #3); stripped ChatGPT conversation URLs/IDs from the published annex, making §9's "removed" claim true (cold #22); footer SHA relabeled a private build commit with a public-mirror note (cold #23); README TPU/Trainium anchor status corrected (cold #24); LOAO methods note renamed a single-anchor cross-platform transfer test (cold #25); per-card "Why the interval is"→"Why the scenario range is" (cold #19); annex "complete/as-produced" language softened to "selected public artifacts" (cold #22). Verdict remains NOT SOUND-as-estimator / sound-as-scenario-workbench; structural remedies escalated. // v2.1.10: cold-review-2026-07-15 epistemics/labeling pass (adjudicated GO-WITH-FIXES) — §5 blinded run relabeled as a model-generated cross-check, not an independent replication/corroboration (P0-1); Gemini card headline reframed to "not publicly identifiable" with ~96% demoted to a labeled internal-cost scenario (P0-2 / cold B4); hero unanchored-share warning corrected (TPU/Trainium anchors exist unfitted) and the GB300 $6/hr analyst-price leg named (P1-1 / cold B3); persistent "selected scenario, not an identified estimate/interval" identity chip (P1-6); GB300 clarity, AMD unverified figures excluded + aggregate labeling, Trainium 405B precision, TPU v7 saturation, NVIDIA perimeter, FP4 upper-bound caveats (P1-2/3/7); Rubin $/margin bar suppressed to shape-only (cold #17); "reproduces"→headline-matched, "realized"→effective, "full unedited"→public+hygiene-disclosed, version identity aligned. NO preset/parameter/engine numbers changed — labeling and disclosure only
const DATA_AS_OF = "2026-07-26";
/* Defaults epoch (IM1 / v2.2). Independent of ENGINE_REVISION: it names the era of the defaults/tables
   a share-link or saved preset was minted against. The v5 encoder stamps it into every token and every
   saved preset; a decode/read under a DIFFERENT epoch is deprecated LOUDLY (never silently resolved).
   v2.2 opens epoch "v22"; pre-v5 tokens have no epoch and are deprecated wholesale. */
// R3 (design memo D-2/D-8): the epoch bumps because the DEFAULT BLEND semantics
// changed (the flagship landing seed is now the serve-feasibility-FILTERED na-blend
// derivation, not the static declared-topology DEFAULTS.blend). Pre-R3 saved presets
// and clean links deprecate/drift LOUDLY through the existing IM1 non-destructive
// machinery — a pre-R3 clean link re-evaluates to the R3 derived default with the
// standard defaults-drift note (the displayed ≈47 → re-evaluated ≈35 fixture).
/* row 499 BUMP (owner ruling on card `q-row499-epoch-deviation`, 2026-08-07 01:06Z: "Bump it,
   effectively no current users"). I had recommended NOT bumping — this implementation moves the
   page-open SELECTION rather than the `DEFAULTS` object, so no token is silently re-interpreted and
   the measured drift is zero (tests/permalink-defaults-move.test.mjs). The external reviewer
   recommended bumping anyway, and the owner ruled with it on a ground neither of us had weighed:
   with effectively no current users, the invalidation cost is ~zero NOW and never gets cheaper.

   What the bump costs, stated plainly because it is the whole cost: every scenario a reader has
   saved in their browser under `v22b9` goes INERT — kept and readable, never deleted, but no longer
   loadable — and every previously minted share link now reports that it was minted under a prior
   epoch. What it does NOT do is change any number: `DEFAULTS` did not move, so an old link that
   still resolves computes exactly what it always did.

   What the new era NAMES: the three adjudicated presets, per-accelerator procurement multipliers,
   and a page-open default that is no longer the central scenario. */
/* im-arc T4 fold (2026-08-24), memo §6: the generic defaults MOVED (dcPerW, the newly named
   dcLifeYears, four capex points, the scope-derived cluster overhead, three planning rents to
   the unavailable path, and three region endpoint sets), so the epoch bumps. A link minted under
   the T2 epoch must not silently reproduce different numbers under T4 arithmetic — that is the
   entire job of this stamp. The migration it names is enumerated, sink by sink, in
   tests/fixtures-t4-declared-delta.json. */
const DEFAULTS_EPOCH = "v25-im-arc-t4-fold-20260824";
/* ---------- TITLED SHARE LINKS (row 499, owner ruling on q-row499-titled-links-v2, option B) ----
   A reader can name a scenario and have the name travel INSIDE the link. Chosen over a server-side
   store deliberately: the store would have been this project's first collected data, requiring a
   disclaimer on save/share and a privacy posture, and the usage-data instrument it would have
   enabled is DEFERRED until the site has real traffic (revisit trigger recorded in the design doc).
   The project therefore stays stateless: a titled link uploads nothing.

   A title is ATTACKER-CONTROLLED text — anyone can craft a link — so it is treated exactly like
   every other field arriving from a URL: length-capped, type-checked, and rejected WHOLE if either
   fails. Rendering is the caller's job and must be textContent; nothing here returns markup. */
const TITLE_MAX_CHARS = 80;
function normalizeLinkTitle(t) {
  if (typeof t !== "string") return null;
  /* Control characters are stripped rather than rejected: a stray newline pasted from a document is
     a formatting accident, not a forgery, and refusing the whole link over it would be hostile. */
  /* Trim AFTER the cap, never before: trimming first can still leave a trailing space at character
     80, which made this function non-idempotent — and `decodeScenario` requires
     normalizeLinkTitle(t) === t, so `encodeScenario`'s self-decode assertion threw and the reader's
     "copy link" silently did nothing. Found in review; the falsifier is a title whose 80th
     character is a space. */
  const clean = t.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, TITLE_MAX_CHARS).trim();
  return clean || null;
}
const _toB64 = str => (typeof btoa === "function") ? btoa(unescape(encodeURIComponent(str))) : Buffer.from(str, "utf8").toString("base64");
const _fromB64 = b => (typeof atob === "function") ? decodeURIComponent(escape(atob(b))) : Buffer.from(b, "base64").toString("utf8");
/* Retired-preset id normalization (P0-6): maps a retired analyst-reconstruction id to its
   numeric-identical successor route id. MUST run BEFORE any PERSPECTIVES.find() lookup on a
   share-link or stored-preset id, so migrated links load byte-identical numbers. Own-property
   lookup only — ids arriving from a URL must never resolve through Object.prototype. */
function normalizePerspId(id) {
  return (typeof id === "string" && Object.prototype.hasOwnProperty.call(RETIRED_PERSPECTIVES, id))
    ? RETIRED_PERSPECTIVES[id] : id;
}
/* b9 M4: the ONE custom-fleet schema validator, resolved at call time (custom-fleets.js
   loads after engine in the browser; node requires lazily — same idiom as rooflineCore). */
function cfValidator() {
  if (typeof module !== "undefined" && module.exports) return require("./custom-fleets.js").validateCustomFleet;
  return validateCustomFleet;
}
/* Supported traffic-identity modes — the closed enum a link's _meta.traffic.mode must belong to.
   Anything else is a forged/garbage identity and the token is rejected whole (fail closed). */
const TRAFFIC_MODES = ["native", "explicit", "custom", "legacy-custom", "replay-locked"];
/* b9 M5 (fix-verify round): the "never mint a token this engine's own decoder rejects" invariant,
   expressed DIRECTLY instead of by duplicating the decoder's rules. The fix-verify reviewer found
   the field-by-field version was still open over the IDENTITY metadata — an unknown fleet id, an
   unknown totalCase, a forged traffic mode or a non-string modified origin all encoded fine and
   then decoded to null. Those gaps predate M5, but the claim was M5's, so it is now structural:
   the encoder round-trips its own output through decodeScenario (pure validation — no engine
   computation) and refuses to hand back a token that fails. This closes the class permanently and
   for every field added later, with no rule duplication to drift. */
function assertSelfDecodable(token) {
  if (decodeScenario(token) === null)
    throw new Error("encodeScenario: the minted token fails this engine's own decoder — refusing to "
      + "hand back a link that would silently fail to restore. Check the identities and traffic "
      + "passed to encodeScenario against the decode contract.");
  return token;
}
/* M8 exit-gate council F3 (2026-08-13): the ONE staleness rule for modified-state identity
   labels, shared by the encoder (mint-time normalization, gate-R2 fold) and the sender UI
   (refreshModifiedState — before this, the sender kept rendering a NAMED FLEET label after a
   scope-crossing model switch while the minted token honestly said "custom", so sender and
   receiver disagreed about the same state). Pure; both call sites cite it. */
function normalizeModifiedIdentities(fleet, totalCase, modelId) {
  const flDef = ED_FLEET.FLEETS[fleet];
  const flStale = !!flDef && !flDef.models.includes(modelId);
  const tcIsCase = Object.prototype.hasOwnProperty.call(ED_FLEET.TOTAL_CASES, totalCase);
  const tcInScope = ED_FLEET.TOTAL_CASE_SCOPE.includes(modelId);
  const tcStale = (tcIsCase && !tcInScope) || (totalCase === "preset" && tcInScope);
  return { fleet: flStale ? "custom" : fleet, totalCase: tcStale ? "custom" : totalCase,
           changed: flStale || tcStale };
}

/* im-arc T2 fix (Sol review 2026-08-23, finding P1-4): wire provenance is
   permission to preserve v6 only while the normalized section remains
   semantically representable by v6. Section additions or explicit receipts
   must promote to v7 rather than being truncated to the first leg list. */
function legacyCompatibleNormalizedFleet(fleet, state) {
  if (!fleet || !Array.isArray(fleet.sections) || fleet.sections.length !== 1) return false;
  const section = fleet.sections[0];
  if (!section || section.id !== "s1" || section.label !== "(whole fleet)"
      || typeof section.sharePct !== "number" || section.sharePct !== 100
      || !Array.isArray(section.legs)) return false;
  const inheritedBasis = effectiveSectionBasis({ ...section, basis: "inherit" }, state, section.legs);
  if (section.basis !== "inherit" && section.basis !== inheritedBasis) return false;
  if (fleet.wireLegacyBases !== undefined
      && (!Array.isArray(fleet.wireLegacyBases)
        || fleet.wireLegacyBases.length !== section.legs.length
        || !fleet.wireLegacyBases.every(basis => basis === "inherit" || basis === inheritedBasis)))
    return false;
  const registeredRentEquivalent = section.rent == null
    || (inheritedBasis !== "owned-strategic-tco" && section.rent.mode === "registered"
      && sectionPoint(section.rent.mult == null ? 1 : section.rent.mult) === 1
      && Object.keys(section.rent).every(key => key === "mode" || key === "mult"));
  return registeredRentEquivalent && section.electricity == null && section.pue == null
    && section.tco == null && section.dcRef == null && section.provenance == null
    && (!Array.isArray(section.fallbackReceipts) || section.fallbackReceipts.length === 0);
}

function encodeScenario(S, modelId, perspId, traffic, modifiedFrom, identities, opts) {
  /* Slice C (memo C-7/C-8): the STORED fleet/totalCase identities are REQUIRED
     call-site parameters (the slice-3 R7 authority rule extended) — encode never
     derives an identity, and a call site that cannot say what the identities are
     has no business minting a token (fail loud, never guess). */
  if (!identities || typeof identities !== "object"
      || typeof identities.fleet !== "string" || typeof identities.totalCase !== "string")
    throw new Error("encodeScenario: identities { fleet, totalCase } is a REQUIRED parameter (slice C, memo C-7/C-8)");
  /* Round-trip baseline (P0 fix, 2026-07-15): the decoder restores a CLEAN identity as
     applyPresetSettings(model, persp, declared traffic) + diff, so the encoder must diff
     against that SAME baseline. Diffing against global DEFAULTS silently dropped any field
     the user set TO a global-default value that differs from the preset's own (e.g. GPT
     active 105→300): the omitted key reverted to the preset value on load and the link
     reproduced different numbers. MODIFIED-identity links restore from global DEFAULTS
     (see the loader), so those keep the DEFAULTS baseline.  */
  const isModified = perspId === "__modified" || perspId === "__modified-exploration";
  /* Stale-label normalization at the MODIFIED mint (M8 gate-R2 fold, finding M8-R2-01,
     2026-08-12). A model switch while modified freezes S's values (refreshModifiedState /
     applyModelSwitchWhileModified — model-owned fields stay frozen) but carries FLEET_ID and
     TOTAL_CASE_ID unchanged, so the mint can receive identity LABELS that no longer apply to
     the current model: a named fleet whose models list excludes it, a total-case id outside
     TOTAL_CASE_SCOPE, or totalCase "preset" for an in-scope model (a label only an
     out-of-scope model's page state can wear). The VALUES on screen are coherent — they live
     in S and travel in the diff — but encoding the stale label minted tokens the decoder's
     scope rows rightly reject (252/2,025 cells of the R2 switch matrix, all scope-crossing;
     Share threw). The honest encoding of "a modified free-form state whose label no longer
     applies" is identity "custom": the label downgrades, the value rides the diff, and the
     decoder's citation-borrowing and scope bars stay fully strict for clean tokens. This is
     a NORMALIZATION of a caller-supplied identity, not a derivation — the call site still
     names its identities (the C-7/C-8 authority rule); the encoder refuses to write a label
     the decode contract can never accept. Clean identities are never touched. */
  if (isModified) {
    const norm = normalizeModifiedIdentities(identities.fleet, identities.totalCase, modelId);
    if (norm.changed) identities = { ...identities, fleet: norm.fleet, totalCase: norm.totalCase };
  }
  let base = DEFAULTS;
  if (!isModified) {
    const bm = MODELS.find(x => x.id === modelId), bp = PERSPECTIVES.find(x => x.id === perspId);
    if (bm && bp) {
      const tm = traffic && traffic.mode;
      const baseTraffic = (tm === "custom" || tm === "legacy-custom")
        ? { mode: "custom", ioRatio: traffic.ioRatio, cacheHit: traffic.cacheHit }
        : (tm === "explicit" ? { mode: "explicit", profileId: traffic.profileId ?? null }
                             : { mode: "native", profileId: null }); // native + replay-locked
      base = applyPresetSettings(bm, bp, baseTraffic);
    }
  }
  const diff = {};
  // customDonor is excluded from the generic per-field diff and encoded separately below: the
  // generic loop only knows "does this field differ from baseline", but the memo §3 codec contract
  // is model-CONDITIONAL ("encoded ONLY when model=custom AND value != default") — a rule the
  // generic loop cannot express. rooflineCore().encodeCustomDonor() is the slice-1b-reviewed
  // single source of truth for that condition (slice-3 review R7 P1 fix).
  /* Slice C (memo C-7): the BLEND field diffs against the fleet-conditional
     baseline (ONE shared function, also the loader's restore seed) — a pure
     named-fleet selection therefore emits NO blend key, which is what makes the
     decoder's named-id+blend contradiction row a consistency rule rather than a
     round-trip killer (the R2-round finding, closed structurally). Every OTHER
     field keeps the per-branch base computed above (DEFAULTS for modified
     identities, applyPresetSettings otherwise — unchanged). */
  const fbb = fleetBaselineBlend(identities.fleet, S, { modelId, customDonor: S.customDonor });
  const blendBase = (fbb !== null) ? fbb : base.blend;
  for (const [k, v] of Object.entries(S)) {
    if (k === "customDonor") continue;
    /* im-arc T3 FIX-2 B1 (2026-08-23): a by-value cf: definition is the
       blend authority. S.blend is only its UI mirror and never rides beside
       sections — the decoder correctly treats that pair as contradictory.
       This also makes harmless floating aggregation differences irrelevant. */
    if (k === "blend" && /^cf:[a-z0-9]{4,16}$/.test(identities.fleet)) continue;
    const cmp = (k === "blend") ? blendBase : base[k];
    if (JSON.stringify(v) !== JSON.stringify(cmp)) diff[k] = v;
  }
  const encodedDonor = rooflineCore().encodeCustomDonor(modelId, S.customDonor);
  if (encodedDonor !== undefined) diff.customDonor = encodedDonor;
  /* v5 (IM1 / v2.2): the token additionally embeds (a) the defaults-epoch it was minted under and
     (b) the headline margin the sharer actually saw, to 3 decimals. Embedding the displayed result
     means a FUTURE epoch can always show "originally shared: X%" with no frozen legacy engine — the
     preservation problem is solved once, here. The margin is the same modeled margin the hero
     renders; NaN/∞ (an infeasible scenario) embeds null.
     Slice-3 review R7 P1 fix: this function already receives the AUTHORITATIVE modelId/traffic as
     explicit parameters (the app.js call site passes the live selector state — the same values
     appEngineContext() would derive). Deriving the context from those parameters directly, rather
     than falling through to a bare workload(S) (which would silently consult the SCENARIO_CONTEXT
     WeakMap keyed on S's object identity), makes this correct regardless of whether S is the
     original applyPresetSettings() object, a structuredClone from loadSavedPreset/link-restore, or
     a same-identity object whose intended model changed underneath it (refreshModifiedState) — all
     three are exactly the cases where the WeakMap can be stale or absent. */
  const encM = MODELS.find(x => x.id === modelId);
  if (!encM) throw new Error("encodeScenario: modelId '" + modelId + "' does not resolve to a registered model");
  /* b9 M4 (memo §6.1): the live codec is v6. A cf: identity's margin computation needs
     the leg list — the encoder resolves it through the source and passes the explicit
     renderOpts.customFleet channel, exactly as the app's render path does. */
  const suppliedCf = opts && opts.customFleet;
  if (suppliedCf && suppliedCf.id !== identities.fleet)
    throw new Error("encodeScenario: opts.customFleet.id must equal identities.fleet");
  const suppliedValidation = suppliedCf ? validateFleetSections(suppliedCf) : null;
  if (suppliedValidation && !suppliedValidation.ok)
    throw new Error("encodeScenario: opts.customFleet failed the shared validator — "
      + suppliedValidation.errors.join("; "));
  const encCf = suppliedValidation ? suppliedValidation.fleet
    : (isCustomFleetId(identities.fleet) ? customFleetSource().resolve(identities.fleet) : null);
  const encPerspectiveForContext = PERSPECTIVES.find(x => x.id === normalizePerspId(perspId)) || null;
  const _wl = workload(S, undefined, makeScenarioContext(encM, traffic, S.customDonor,
                         encPerspectiveForContext && encPerspectiveForContext.kind,
                         encPerspectiveForContext && encPerspectiveForContext.id),
                       encCf ? { customFleet: encCf } : undefined);
  const displayedMargin = (_wl && isFinite(_wl.margin)) ? Math.round(_wl.margin * 100 * 1000) / 1000 : null;
  /* im-arc T2 (memo research/im-arc-t2-sections-memo.md §2): v7 carries
     sections by value. A genuinely legacy-compatible one-section definition retains
     the v6 wire shape so semantically unchanged links remain byte-stable. Explicit
     sections carry their EFFECTIVE basis — `inherit` never leaves the resolver. */
  /* im-arc T2 fix (Sol review 2026-08-23, finding P1-4): semantic identity
     wins the wire-version conflict. Validation normalizes v6 legs into the
     canonical section runtime shape but retains wireVersion; an unchanged
     legacy fleet therefore mints the same v6 bytes instead of drifting to v7. */
  const legacyWire = !!encCf && ((encCf.wireVersion === "v6"
    && legacyCompatibleNormalizedFleet(encCf, S))
    || (Array.isArray(encCf.legs) && !Array.isArray(encCf.sections)));
  const wireSchema = encCf && !legacyWire ? "v7" : "v6";
  let encFleet = { id: identities.fleet };
  if (encCf) {
    if (legacyWire) {
      const legacyLegs = Array.isArray(encCf.legs) ? encCf.legs
        : (encCf.sections && encCf.sections[0] ? encCf.sections[0].legs : []);
      const wireBases = Array.isArray(encCf.wireLegacyBases) ? encCf.wireLegacyBases : [];
      encFleet = { id: identities.fleet, custom: { name: encCf.name, clonedFrom: encCf.clonedFrom,
        legs: legacyLegs.map((l, index) => ({ donorKey: l.donorKey, label: l.label, sharePct: l.sharePct,
          overrides: { ...l.overrides }, basisDeclared: wireBases[index]
            || l.basisDeclared || "inherit", family: l.family })) } };
    } else {
      const effective = new Map(resolveFleetSections(S, { customFleet: encCf })
        .map(row => [row.section.id, row.section.basis]));
      encFleet = { id: identities.fleet, custom: { name: encCf.name, clonedFrom: encCf.clonedFrom,
        sections: encCf.sections.map(section => ({ id: section.id, label: section.label,
          sharePct: structuredClone(section.sharePct), basis: effective.get(section.id),
          rent: structuredClone(section.rent), electricity: structuredClone(section.electricity),
          pue: structuredClone(section.pue), tco: structuredClone(section.tco), dcRef: section.dcRef,
          /* fallbackReceipts/shareRounding are derived result metadata, never
             caller authority and therefore never v7 wire fields. */
          provenance: section.provenance,
          legs: section.legs.map(l => ({ donorKey: l.donorKey, label: l.label,
            sharePct: structuredClone(l.sharePct), overrides: structuredClone(l.overrides), family: l.family })) })) } };
    }
  }
  /* b9 M5 (memo §6.2/§10.4): the interlock rides EXPLICITLY because UNLOCKED is a user CHOICE,
     not derivable from values (unlock-then-hand-reset is reachable and must round-trip). The
     encoder validates its own stamp against the §6.3 consistency rule and fails LOUD rather than
     minting a token its own decoder would reject — the M4 P0-1 failure mode, closed structurally. */
  const encP = isModified ? null : (PERSPECTIVES.find(x => x.id === normalizePerspId(perspId)) || null);
  /* b9 M5 (gate round 1, P1): the outgoing lever state runs through the SAME closed-domain rules
     the decoder enforces. Without this the encoder happily minted tokens carrying rate 4, a
     fractional months or an out-of-bounds family — links that copy successfully and then silently
     fail to restore. The UI cannot produce those values; a pure-engine consumer or a future
     state-construction regression can. Fail LOUD at the mint, not silently at the load. */
  { const bad = leverDomainViolation(S);
    if (bad !== null)
      throw new Error("encodeScenario: lever field out of its closed domain — " + bad
        + " — refusing to mint a token this engine's own decoder would reject"); }
  /* b9 spec-decode LEVER (D-SD-5 / D-SD-7): the cross-field rules, through the SAME shared
     predicate the decoder runs. The encoder has the resolved state in hand, so it checks it
     directly. Same reason as the block above — fail LOUD at the mint, not silently at the load. */
  if (!specDecTokenConsistent(S, encP))
    throw new Error("encodeScenario: specDec " + S.specDec + " is not available in this state ("
      + (encP && encP.kind === "replay" ? "a published operating point is inert under D-SD-5"
         : "the mutual-exclusion gate is shut — stackMult " + S.stackMult)
      + ") — refusing to mint a token this engine's own decoder would reject");
  /* A caller that HAS a machine state must pass it — that is the UI, and validating its stamp is
     where the real risk lives. A caller that does NOT (a pure-engine consumer, a test fixture, the
     MCP server) gets the same honest reconstruction a pre-machine v5 token gets: the state the
     values represent, never an assumed FREE. Either way the stamp is validated below. */
  const encInterlock = (identities.interlock === undefined || identities.interlock === null)
    ? deriveInterlockFor(S, isModified ? Number(S.trendMonths) : trendBaselineFor(encM, encP))
    : identities.interlock;
  if (!interlockTokenConsistent(encInterlock, S, encM, encP, isModified))
    throw new Error("encodeScenario: interlock '" + encInterlock + "' contradicts the lever state (trend "
      + S.trendMonths + " @ rate " + S.trendRate + ", fams " + FAMILY_GROUP_KEYS.map(k => S[k]).join("/")
      + ") — refusing to mint a self-rejecting token");
  /* row 499: the title rides in _meta beside the other provenance fields, and only when there IS
     one — an untitled link is byte-identical to what this codec minted before the feature. */
  const encTitle = normalizeLinkTitle(opts && opts.title);
  diff._meta = { dataAsOf: DATA_AS_OF, schema: wireSchema, engine: ENGINE_REVISION, epoch: DEFAULTS_EPOCH,
                 ...(encTitle ? { title: encTitle } : {}),
                 displayedMargin, model: modelId, persp: perspId,
                 fleet: encFleet, totalCase: identities.totalCase, interlock: encInterlock,
                 traffic: { mode: traffic.mode, profileId: traffic.profileId ?? null, ioRatio: traffic.ioRatio, cacheHit: traffic.cacheHit } };
  /* Identity-integrity (copy-after-mutation fix): a synthetic "[modified …]" selector value is
     NOT a perspective id and must never be serialized as one — a decoder that skipped identity
     restoration but still applied the numeric diff would render a modified counterfactual's
     numbers under a clean default identity. A modified state travels as an EXPLICIT modified
     identity: persp = null plus a typed _meta.modified block ({ kind, from }) the decoder
     validates atomically; on load it restores as the SAME [modified scenario] /
     [modified range exploration] state, never as a clean lens. */
  if (perspId === "__modified" || perspId === "__modified-exploration") {
    diff._meta.persp = null;
    diff._meta.modified = { kind: perspId === "__modified-exploration" ? "exploration" : "scenario",
                            from: modifiedFrom ?? null };
    return assertSelfDecodable(wireSchema + "." + _toB64(JSON.stringify(diff)));
  }
  // v4: an exploration route's identity travels REDUNDANTLY — the persp id plus
  // { rangeId, configId } — so the decoder can cross-check the pair and reject any link whose
  // declared identities disagree (P0-6), instead of rendering a mislabeled state.
  const p = PERSPECTIVES.find(x => x.id === perspId);
  if (p && p.kind === "exploration") {
    const b = explorationComputedBucket(p);
    diff._meta.explore = { rangeId: b ? b.id : null, configId: p.id };
  }
  return assertSelfDecodable(wireSchema + "." + _toB64(JSON.stringify(diff)));
}
/* v5 drift note (IM1): a v5 token embeds the margin the sharer saw (_meta.displayedMargin, a %).
   When the CURRENT engine recomputes a materially different value for the restored input vector —
   because a table moved in a later epoch — the UI shows both instead of pretending continuity.
   Pure + exported so tests exercise it with no DOM. tol is in margin POINTS (percentage points);
   0.05pp absorbs float noise while surfacing any real re-derivation. */
function marginDriftNote(sharedPct, currentPct, tol = 0.05) {
  if (typeof sharedPct !== "number" || !isFinite(sharedPct)) return null;
  if (typeof currentPct !== "number" || !isFinite(currentPct)) return null;
  if (Math.abs(sharedPct - currentPct) <= tol) return null;
  // Detection uses the precise (3dp) values above; the user-facing text uses the hero's whole-percent
  // "≈NN%" convention — the sharer saw "≈77%", never "76.778%". Precise values stay on the object.
  return { sharedPct, currentPct,
           text: "originally shared: ≈" + Math.round(sharedPct) + "% — current engine: ≈" + Math.round(currentPct) + "%" };
}
function decodeScenario(str) {
  if (!str) return null;
  /* DEPRECATION (IM1 / v2.2): pre-v5 tokens (v2/v3/v4) no longer resolve — the v2.2 engine moves the
     numbers a relative codec would re-interpret, so every pre-v5 link is deprecated wholesale. They
     are recognized ONLY by prefix and routed to a LOUD notice; they are NEVER parsed, so no field of
     an old token can leak into the resolved state. The prefix is the schema authority. (The marker is
     a fresh object — the raw token is discarded here.) */
  if (str.startsWith("v4.") || str.startsWith("v3.") || str.startsWith("v2."))
    return { __epochDeprecated: true, schema: str.slice(0, 2) };
  /* b9 M4 (memo §6.1, D-4): v6 is the live codec; v5 tokens are NOT deprecated — they
     stay fully interpretable and load under the established epoch/displayed-margin
     drift machinery (plan D-8 governs over the §5 bullet's deprecation phrasing —
     plan-internal conflict resolved by §0 precedence, gate-adjudicated CORRECT). */
  if (!str.startsWith("v5.") && !str.startsWith("v6.") && !str.startsWith("v7.")) return null; // unknown/unversioned format: ignored, never guessed (default renders, no notice)
  try {
    const d = JSON.parse(_fromB64(str.slice(3)));
    d._meta = d._meta || {};
    delete d.__epochDeprecated; // a live-codec token may never masquerade as a deprecation marker (fail-safe: if it did, the loader's default+notice path is still the safe outcome)
    const prefixSchema = str.startsWith("v7.") ? "v7" : (str.startsWith("v6.") ? "v6" : "v5");
    // The TOKEN PREFIX is the schema authority. A token declaring a different inner schema was a
    // forgery vector (it routed into the lock-overriding legacy-migration path). Disagreement = reject.
    if (d._meta.schema && d._meta.schema !== prefixSchema) return null;
    d._meta.schema = prefixSchema;
    /* v5 embedded provenance fields — epoch (string) + displayedMargin (finite number, or null for an
       infeasible scenario). Both are REQUIRED on a v5 token: the shipped encoder always embeds them,
       so an absent/mistyped field is a forged/malformed token → reject whole (fail-closed, consistent
       with the identity gates). They are annotations for the drift display, NEVER applied to state. */
    if (typeof d._meta.epoch !== "string") return null;
    /* row 499: an optional title. Absent is fine; present-but-wrong is a forged token and rejects
       whole, consistent with every other identity gate here. Over-length is a rejection rather than
       a silent truncation: a link that renders something other than what it carries is the class of
       defect this codec refuses on principle. */
    if ("title" in d._meta) {
      if (typeof d._meta.title !== "string" || d._meta.title.length > TITLE_MAX_CHARS) return null;
      const norm = normalizeLinkTitle(d._meta.title);
      if (norm === null || norm !== d._meta.title) return null;
    }
    if (!(d._meta.displayedMargin === null
          || (typeof d._meta.displayedMargin === "number" && isFinite(d._meta.displayedMargin)))) return null;
    /* Declared-traffic validation (ANY schema that carries a _meta.traffic identity): the mode
       must belong to the supported enum and the values must sit inside the same SCENARIO_BOUNDS
       the overlay sanitizer enforces. A garbage mode or an out-of-range ioRatio/cacheHit is a
       forged identity — rejected whole, never clamped into a plausible-looking one and never
       applied raw. */
    const t = d._meta.traffic;
    if (t !== undefined && t !== null) {
      if (typeof t !== "object" || Array.isArray(t) || !TRAFFIC_MODES.includes(t.mode)
          || typeof t.ioRatio !== "number" || !isFinite(t.ioRatio)
          || t.ioRatio < SCENARIO_BOUNDS.ioRatio[0] || t.ioRatio > SCENARIO_BOUNDS.ioRatio[1]
          || typeof t.cacheHit !== "number" || !isFinite(t.cacheHit)
          || t.cacheHit < SCENARIO_BOUNDS.cacheHit[0] || t.cacheHit > SCENARIO_BOUNDS.cacheHit[1]) return null;
      if (t.mode === "explicit" && !ED_TRAFFIC_PROFILES.some(x => x.id === t.profileId)) return null;
    }
    if (prefixSchema === "v5" || prefixSchema === "v6" || prefixSchema === "v7") {
      // v5/v6/v7 links always carry a full traffic identity (validated above); a token without one
      // was not minted by this encoder and cannot be restored atomically — reject, never guess.
      if (t === undefined || t === null) return null;
      /* FAIL-CLOSED IDENTITY RESOLUTION (identity-integrity regression fix): a v5 link's numeric
         diff may only ever be applied under the identity it declares. The declared model must
         resolve to a real entry, and the perspective must either resolve (after retired-id
         normalization) or be an explicit, well-formed MODIFIED identity. Otherwise the token
         cannot be restored under a truthful label — reject it whole so the default state renders;
         NEVER substitute a default identity under the link's numbers. (Pre-v5 tokens never reach
         this path — they are deprecated at the prefix check above.) */
      if (!MODELS.some(x => x.id === d._meta.model)) return null;
      /* Slice C (memo C-7/C-8): the REQUIRED identity fields — fail-closed with
         the exact epoch/displayedMargin pattern above. The decode tables in the
         memo are the authority; every row below is fixtured. NOTE the loader —
         not this validator — implements the NORMATIVE restore order (identity →
         per-branch base → NON-BLEND diff → fleetBaselineBlend at the post-diff
         state); this validator guarantees a named/preset token can never carry a
         blend diff, which is what makes that order well-defined. */
      const fl = d._meta.fleet;
      if (typeof fl !== "object" || fl === null || Array.isArray(fl) || typeof fl.id !== "string") return null;
      const flNamed = Object.prototype.hasOwnProperty.call(ED_FLEET.FLEETS, fl.id);
      /* b9 M4 (memo §6.2/§6.3): v6 admits cf: identities BY VALUE, with token-level
         CLOSED key sets — _meta.fleet is exactly {id} (named/"custom"/"preset") or
         exactly {id, custom} (cf:); the custom block is exactly {name, clonedFrom,
         legs}; the assembled fleet (id from the outer field, epoch from _meta.epoch —
         one authority per field) must pass the ONE schema validator; any violation
         rejects the whole token. v5 tokens keep their shipped validation verbatim —
         a cf: id on a v5 token was never mintable and rejects as an unknown id. */
      const flCustomFleet = (prefixSchema === "v6" || prefixSchema === "v7")
        && /^cf:[a-z0-9]{4,16}$/.test(fl.id);
      if (prefixSchema === "v6" || prefixSchema === "v7") {
        const flKeys = Object.keys(fl);
        if (flCustomFleet ? (flKeys.length !== 2 || !("custom" in fl)) : flKeys.length !== 1) return null;
      }
      if (!flNamed && !flCustomFleet && fl.id !== "custom" && fl.id !== "preset") return null; // unknown id: reject whole
      if (flCustomFleet) {
        const c = fl.custom;
        if (typeof c !== "object" || c === null || Array.isArray(c)) return null;
        const expectedCustomKeys = prefixSchema === "v7" ? "clonedFrom,name,sections" : "clonedFrom,legs,name";
        if (Object.keys(c).sort().join(",") !== expectedCustomKeys) return null;
        const v = cfValidator()({ id: fl.id, name: c.name, epoch: d._meta.epoch,
          clonedFrom: c.clonedFrom,
          ...(prefixSchema === "v7" ? { sections: c.sections } : { legs: c.legs }) }, { requireId: true });
        if (!v.ok) return null;
        if (prefixSchema === "v7") {
          if (v.fleet.sections.some(section => section.basis === "inherit")) return null;
          fl.custom.sections = v.fleet.sections;
        }
        if ("blend" in d) return null; // cf-vs-blend contradiction (the blend is derivable from the legs)
      } else if (flNamed) {
        if (!ED_FLEET.FLEETS[fl.id].models.includes(d._meta.model)) return null; // out-of-scope named id
        if ("blend" in d) return null; // fleet-vs-blend contradiction (named selection's blend is derivable)
      } else if (fl.id === "preset" && "blend" in d && !d._meta.modified) return null;
      /* ^ preset + blend contradiction — CLEAN identities only (M8 reconciliation fix,
         2026-08-12). For a CLEAN token the perspective's preset fleet makes the blend
         derivable, and a user blend edit forks FLEET_ID to "custom" (app.js C-2/C-3), so
         clean preset+blend is unreachable except by tampering — reject whole. A MODIFIED
         identity restores from DEFAULTS + diff with NO perspective to derive from and
         fleetBaselineBlend("preset") === null by definition, so the diff's blend key is
         the ONLY carrier of the sharer's on-screen blend (e.g. an exploration route's
         authored blend after any dial edit). The unconditioned rule made encodeScenario
         mint tokens its own decoder refused — assertSelfDecodable threw on every
         share-link mint from a modified state whose blend differs from DEFAULTS
         (live-reproduced at ec7f360: exploration x90-v1 + one dial nudge + Share). The
         loader's modified branch already restores the blend diff verbatim
         (restoreModifiedLinkState; the named/cf-only reseed never touches "preset"). */
      if (prefixSchema === "v6" || prefixSchema === "v7") {
        /* b9 M4 (memo §6.2): _meta.interlock — closed enum, required (the encoder always stamps
           it). b9 M5 TIGHTENS it to the full memo §6.3 row, now that the lever keys exist. */
        if (!INTERLOCK_STATES.includes(d._meta.interlock)) return null;
        /* b9 M5 lever rows (§6.3), fail-closed reject-whole, through the ONE shared closed-domain
           validator the encoder also runs: a token carrying a garbage lever is forged — never
           clamped into a plausible-looking one. */
        if (leverDomainViolation(d) !== null) return null;
        /* BASELINE-AWARE interlock consistency (§6.3 + §10.2 per-state invariants) plus the
           replay lock-at-0 token rule. The resolved lever vector is the branch base overridden by
           the diff — the same shape the totalCase row uses. The clean branch's trend base is
           trendBaselineFor() BY CONSTRUCTION (applyPresetSettings assigns exactly that value, and
           no perspective `set` carries a lever key), so no preset re-derivation is needed here. */
        const ilMod = d._meta.modified !== undefined && d._meta.modified !== null;
        const ilM = MODELS.find(x => x.id === d._meta.model) || null;
        const ilP = (!ilMod && typeof d._meta.persp === "string")
          ? (PERSPECTIVES.find(x => x.id === normalizePerspId(d._meta.persp)) || null) : null;
        const ilBase = ilMod ? DEFAULTS.trendMonths : trendBaselineFor(ilM, ilP);
        const ilResolved = { trendMonths: ("trendMonths" in d) ? d.trendMonths : ilBase,
                             trendRate: ("trendRate" in d) ? d.trendRate : DEFAULTS.trendRate };
        for (const fk of FAMILY_GROUP_KEYS) ilResolved[fk] = (fk in d) ? d[fk] : DEFAULTS[fk];
        if (!interlockTokenConsistent(d._meta.interlock, ilResolved, ilM, ilP, ilMod)) return null;
        /* b9 spec-decode LEVER (D-SD-5 / D-SD-7), reject-whole through the SAME shared predicate
           the encoder runs. Unlike the trend rows above, `stackMult`'s branch base CANNOT be read
           off a constant: perspective `set` blocks DO carry it (the shipped replays sit at 0.55,
           0.6, 0.75, 0.83, 1.0, 1.05), so resolving it needs the preset. The re-derivation is
           therefore done — but only on the rare path where a token actually declares the lever, so
           an ordinary link pays nothing for it. Traffic is irrelevant to this read: applyPresetSettings
           derives only ioRatio and cacheHit from the selection, so `native` yields the same
           stackMult as any other mode. */
        if ("specDec" in d) {
          const sdBase = (!ilMod && ilM && ilP) ? applyPresetSettings(ilM, ilP, { mode: "native" }) : DEFAULTS;
          const sdResolved = { specDec: d.specDec,
            stackMult: ("stackMult" in d) ? d.stackMult : sdBase.stackMult };
          if (!specDecTokenConsistent(sdResolved, ilP)) return null;
        }
      }
      let tc = d._meta.totalCase;
      if (typeof tc !== "string") return null;
      /* J-9 epoch transition (FA memo v7, R6 P1): the page default flagship size moved
         5.0T → 2.5T on 2026-07-24 (epoch bump). A pre-bump CLEAN token — totalCase =
         the OLD default id with NO total key — is the default-following shape (a clean
         link means "the page default"); under the new default its label would fail
         value-consistency below and the link would silently drop. The ONE sanctioned
         rewrite: re-bind the identity to the new default case and mark the migration so
         the loader surfaces the size-move note. The shape is uniquely pre-bump (a
         post-bump deliberate 5T selection always embeds total: 5000 in the diff); a
         token WITH a total key is NEVER rewritten — every other inconsistent shape
         stays fail-closed exactly as before. Applies identically on the modified branch
         (same default-following semantics against DEFAULTS.total). */
      if (d._meta.epoch !== DEFAULTS_EPOCH && tc === "community-central-5.0" && !("total" in d)) {
        tc = "revised-band-central-2.5";
        d._meta.totalCase = tc;
        d._meta.sizeMoveMigrated = { from: "community-central-5.0", to: tc };
      }
      const tcCase = Object.prototype.hasOwnProperty.call(ED_FLEET.TOTAL_CASES, tc) ? ED_FLEET.TOTAL_CASES[tc] : null;
      if (!tcCase && tc !== "custom" && tc !== "preset") return null; // unknown value: reject whole
      const tcInScope = ED_FLEET.TOTAL_CASE_SCOPE.includes(d._meta.model);
      if (tcCase && !tcInScope) return null;      // citation-borrowing bar (OOS case id)
      if (tc === "preset") {
        if (tcInScope) return null;               // in-scope "preset" = unreachable second clean encoding
        if ("total" in d && !d._meta.modified) return null;
        /* ^ preset + explicit total contradiction — CLEAN identities only (M8 gate-R1 fold,
           finding M8-R1-01, 2026-08-12; same class as the preset+blend row above). For a CLEAN
           token the model's preset total is derivable from _meta.model, so preset+total is
           tampering — reject whole. A MODIFIED identity restores from DEFAULTS + diff, where
           every model outside TOTAL_CASE_SCOPE carries totalCase "preset" and a preset total
           that differs from DEFAULTS.total — the diff's total key is the ONLY carrier of the
           sharer's on-screen total, and the unconditioned row made encodeScenario refuse its
           own token (assertSelfDecodable threw on Share from ANY modified state of an
           out-of-scope model — reproduced with sonnet + one dial nudge). */
      }
      /* Case-id value consistency (the label may never disagree with the value):
         resolved total = branch-base total overridden by the diff. Checked per
         branch below (modified base = DEFAULTS; clean base = applyPresetSettings). */
      const totalCaseConsistent = (baseTotal) => {
        const resolved = ("total" in d) ? d.total : baseTotal;
        return typeof resolved === "number" && isFinite(resolved) && resolved === tcCase.totalB;
      };
      const mod = d._meta.modified;
      if (mod !== undefined && mod !== null) {
        // Modified identity: no clean persp id and no route metadata may ride along (that would
        // be a contradictory identity); kind is a closed enum; an exploration origin breadcrumb
        // must resolve to a real route so the restore path stays truthful.
        if (typeof mod !== "object" || Array.isArray(mod)) return null;
        if (d._meta.persp !== undefined && d._meta.persp !== null) return null;
        if (d._meta.explore !== undefined && d._meta.explore !== null) return null;
        if (mod.kind === "exploration") {
          const op = PERSPECTIVES.find(x => x.id === normalizePerspId(mod.from));
          if (!op || op.kind !== "exploration") return null;
        } else if (mod.kind === "scenario") {
          if (mod.from !== null && typeof mod.from !== "string") return null;
        } else return null;
        if (tcCase && !totalCaseConsistent(DEFAULTS.total)) return null; // modified branch: base = DEFAULTS
        return d;
      }
      // Internal identity consistency (P0-6): the redundant _meta.explore identity must agree
      // with _meta.persp (after retired-id normalization) AND with the computed range of that
      // route. An exploration persp without its explore block — or an explore block on a
      // non-exploration persp — is contradictory: reject, so the safe default renders rather
      // than a mislabeled state.
      const pid = normalizePerspId(d._meta.persp);
      const p = PERSPECTIVES.find(x => x.id === pid);
      if (!p) return null; // unresolvable perspective: fail closed (see identity-resolution note above)
      /* TRAFFIC-IDENTITY CONSISTENCY (contradiction fail-closed): the mode-enum + bounds checks
         above prove the traffic block is well-FORMED; these prove it is not self-CONTRADICTORY
         against the resolved perspective/model. A token that declares an identity it cannot
         actually hold is refused WHOLE (null → default renders, no "Loaded" note) — never
         rendered under a substituted native default behind a mislabeled identity. */
      {
        const m = MODELS.find(x => x.id === d._meta.model);
        const prof = ED_TRAFFIC_PROFILES.find(x => x.id === t.profileId);
        if (t.mode === "replay-locked") {
          // A locked operating point only exists on a replay; on a lens/exploration it is a forgery.
          if (p.kind !== "replay") return null;
        } else if (t.mode === "explicit") {
          // Existence was checked above; the named profile's canonical numbers must equal the
          // declared numbers (a profile id that contradicts its own values is self-contradictory).
          if (!prof || prof.ioRatio !== t.ioRatio || prof.cacheHit !== t.cacheHit) return null;
        } else if (t.mode === "native") {
          // A named profile under 'native' must agree with the declared numbers; a null-profileId
          // native token must agree with the declared model's OWN native profile. (Cross-engine
          // profile-value drift keeps the named-profile path: an old link still names its profile,
          // and the loader re-resolves native from the live model — never a mislabeled render.)
          if (t.profileId != null) {
            if (!prof || prof.ioRatio !== t.ioRatio || prof.cacheHit !== t.cacheHit) return null;
          } else {
            const nat = ED_TRAFFIC_PROFILES.find(x => x.id === (m && m.nativeTraffic));
            if (!nat || nat.ioRatio !== t.ioRatio || nat.cacheHit !== t.cacheHit) return null;
          }
        }
        // custom / legacy-custom carry their own numbers by definition — nothing to contradict.
      }
      if (tcCase) {
        // Clean branch: the base total is the identity's applyPresetSettings seed
        // (mirroring the encoder's baseline construction exactly).
        const bm = MODELS.find(x => x.id === d._meta.model);
        const baseTraffic = (t.mode === "custom" || t.mode === "legacy-custom")
          ? { mode: "custom", ioRatio: t.ioRatio, cacheHit: t.cacheHit }
          : (t.mode === "explicit" ? { mode: "explicit", profileId: t.profileId ?? null }
                                   : { mode: "native", profileId: null });
        if (!totalCaseConsistent(applyPresetSettings(bm, p, baseTraffic).total)) return null;
      }
      const isExpl = p.kind === "exploration";
      const ex = d._meta.explore;
      if (ex !== undefined && ex !== null) {
        if (typeof ex !== "object" || Array.isArray(ex) || !isExpl) return null;
        if (normalizePerspId(ex.configId) !== pid) return null;
        const b = explorationComputedBucket(p);
        if (!b || ex.rangeId !== b.id) return null;
      } else if (isExpl) return null;
    }
    return d;
  } catch { return null; }
}
/* v2 links carried no traffic identity; reproduce the OLD effective traffic so a shared link's
   numbers survive the ownership refactor. Old rule: model-owned values win; a silent model took
   the perspective's values (xAI 3/0; a real dive's own mix); else the 15/60 global default.
   Ambiguity note (documented, irrecoverable): v2 never encoded values equal to the global
   default, so an edit BACK to 15/60 on a traffic-owning model is indistinguishable from no edit
   and migrates to that model's old effective values. */
function matchTrafficProfile(ioRatio, cacheHit) {
  return ED_TRAFFIC_PROFILES.find(t => t.ioRatio === ioRatio && t.cacheHit === cacheHit) || null;
}
function migrateV2Traffic(m, p, diff) {
  const nat = ED_TRAFFIC_PROFILES.find(t => t.id === m.nativeTraffic) || ED_TRAFFIC_PROFILES[0];
  let base;
  if (m.nativeTrafficWasExplicit) base = { ioRatio: nat.ioRatio, cacheHit: nat.cacheHit };
  else {
    const pset = (p.id === "dive") ? (m.dive || {}) : p.set;
    base = { ioRatio: pset.ioRatio ?? 15, cacheHit: pset.cacheHit ?? 60 };
  }
  const io = diff.ioRatio ?? base.ioRatio, ch = diff.cacheHit ?? base.cacheHit;
  // Identity migration: exact numeric matches recover their named-profile identity;
  // only genuinely unmatched pairs land in the visibly-legacy custom state.
  const prof = matchTrafficProfile(io, ch);
  if (prof && !(p && p.kind === "replay")) return { mode: "explicit", profileId: prof.id, ioRatio: io, cacheHit: ch, migratedToProfile: true };
  return { mode: "legacy-custom", ioRatio: io, cacheHit: ch };
}

/* ---------- node export for tests / offline computation ---------- */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    HW, HW_ORDER, GEN_TIMELINE, RUBIN, PRECISION_ENUM_KEYS, INTERACT_ENUM_KEYS, DEFAULTS,
    MODELS, PERSPECTIVES, MODEL_OWNED_KEYS, TIPS, SECTIONS, TRAFFIC_PROFILES: ED_TRAFFIC_PROFILES,
    LANDING_DEFAULT_PERSP_ID, // row 499: the page-open selection (NOT a DEFAULTS move — see its declaration)
    applyPresetSettings, resolveTraffic, lensSpan, lensSpanMembershipNote, pairingWarning, pairingSeverity,
    marginBand, marginBandsPerDial, sectionBand, bandLeadBasisClause, BAND_LEAD_BASIS, bandHandleDefaults,
    statedReadingClause,
    applyDial, dialId, dialBounds, dialsFromRanges,
    legsInFamily, familyGroupOverrides, BAND_MAX_CORNER_DIALS,   // row 499: range-valued dials → attainable band
    /* owner ruling q-sliders-fleet-util-point (2026-08-09): max/min/median over the provider
       distributions that sum to 100. A polytope, not a box — see `mixBand`. */
    mixBand, mixRangesFromRanges, blendBlocksFromRanges, projectCentresOntoSum, centroidOnSum,
    normalizeModifiedIdentities,
    MIX_MAX_BLOCKS, MIX_AFFINE_EPS, MIX_SHARE_BOUNDS,

    encodeScenario, decodeScenario, migrateV2Traffic, sanitizeScenarioDiff, matchTrafficProfile, overlayDivergesFromReplay, SCENARIO_BOUNDS, TRAFFIC_MODES, ENGINE_REVISION, DATA_AS_OF,
    fleetBaselineBlend, TOTAL_CASE_SCOPE: ED_FLEET.TOTAL_CASE_SCOPE,
    DEFAULTS_EPOCH, marginDriftNote,
    normalizeLinkTitle, TITLE_MAX_CHARS,   // row 499: titled share links (stateless, title-in-token)
    normalizePerspId, reconcileLinkTraffic,
    hwHourCost, hwHourParts, tokPerS, costPerMtok,
    makeScenarioContext, scenarioContext, registerScenarioContext, restoreSavedPresetState, restoreModifiedLinkState, applyModelSwitchWhileModified, blendWeights, blendedCost, blendedCosts,
    fleetRenderableClause, policyCapacityClause, fleetRenderableDisclosure, roleWidthEvidenceClause,
    computeMix, workload, workloadOnHw, marginOnHw, marginOnBasis, registryPlanningRentReceipt,
    lessorSpread, blendedLessorSpread, stackRowsFor, feasibility,
    CAPACITY_POLICY_BAND, evaluateAtPolicyBand,
    FLEETS: ED_FLEET.FLEETS, DEFAULT_FLEET_ID: ED_FLEET.DEFAULT_FLEET_ID, MIN_CLUSTER_SUPPORT_SHARE,
    fleetEvidenceProfile, centralEligibilityDecision, heroSuppressionDecision, selectDefaultFleet, landingHeroSuppressed,
    deriveDefaultFleetMembership, membershipSensitivity, membershipExclusionClause, finalAnswer,
    legStatusSlots, aggregateFleetStatusVector, worstByOrder,
    SLO_STATUS_ORDER, THROUGHPUT_EVIDENCE_ORDER, PRICE_EVIDENCE_ORDER, FULL_MEMORY_FIT,
    TOTAL_CASES: ED_FLEET.TOTAL_CASES, PRECISION_TIER_MAP: ED_FLEET.PRECISION_TIER_MAP,
    solveCapacityWidth, enumerateLegalWidths, CAPACITY_BYTES_POLICY,
    formCorrectionDebt, FORM_DEBT_NOT_A_RESULT,
    // b9 M3 (memo §3.3): the energy surface + procurement-basis machinery. Pin re-minted in
    // capacity-solver-r1.test.mjs (both copies) under the M3 delta manifest.
    PROCUREMENT_BASES, PROCUREMENT_BASIS_NAMES, DIVE_PROCUREMENT_BASES,
    procurementBasisFor, legProcurementBasis, assertUniformProcurementBasis,
    displayedProcurementBasis, // M3 gate P1 fix-round addition (pin re-minted again)
    opPowerKw, energyPerMtok, energyMix, fleetEnergy,
    // b9 M4 (memo §3.1): the custom-fleet leg path + source registration (tests inject
    // stores through registerCustomFleetSource; the browser registration comes from
    // custom-fleets.js at load).
    resolveFleetSections, resolveFleetLegs, composeSections, mixProcurementBasis,
    assertSectionsTyped, registerCustomFleetSource, customFleetSource, isCustomFleetId,
    hardwareRow, registryPlanningRentHr, rentQuotesFor, rentQuoteByClass, registeredCapexFor,
    DC_SCHEMA: ED_DC_SCHEMA, RENT_POLICY: ED_DC_RENT_POLICY, RENT_QUOTES: ED_DC_RENT_QUOTES,
    companyForModel, registryRows, registryRowClass,
    coverageLedgerForModel, coverageSentenceParts, coverageClassForDonor, coverageForFleetSections,
    coverageForPreset,
    fleetModeRenderOptions, validateFleetSections, fleetSectionsSchema, bandSchema, dcRegions,
    registrySectionFromRow, composeFleetFromDcRows,
    /* b9 M5 (memo §§8–11, §15): the lever registries, the post-roofline multiplier, the pure
       interlock machine (walked with no DOM by tests/trendline-interlock-b9.test.mjs and by the
       gate reviewer), and the reference pin. Pin re-minted in capacity-solver-r1.test.mjs (both
       copies) under the M5 delta manifest. */
    TREND_RATES, TREND_MONTHS_BOUNDS, TREND_SOFT_WARN_MONTHS, TREND_DEFAULTS, TREND_LAB_NOTES,
    TREND_GROUP_KEYS, FAMILY_GROUP_KEYS, FAMILY_STATE_KEY, FAMILY_BOUNDS,
    INTERLOCK_STATES, INTERLOCK_WHY, INTERLOCK_UNLOCK_WARNING, SPECIFIED_LEVER_KEYS,
    trendDefaultMonths, trendLabNote, trendBaselineFor, trendFactor, familyOf, familyFactor,
    leverThroughputMult, leverOverlapWarnings,
    SPECDEC_GATE_TICK, SPECDEC_BOUNDS, stackAtMtpFreeTick, specDecGateAllows,
    specDecBaselineStatusFor, specDecFactor, specDecDisposition,
    SPECDEC_REASON_COPY, specDecReasonText, specDecLegDisclosure, specDecCorrectionNotice,
    /* d-im-h800: the NVLink-cap lever — bounds, ladder, factor, per-leg DTO, pinned copy, readout. */
    NVLINKCAP_BOUNDS, NVLINKCAP_SLOPE_STEP, NVLINKCAP_ANCHOR_KEY, NVLINKCAP_ELIGIBLE, NVLINKCAP_SECTION_TITLE, NVLINKCAP_CONTROL_LABEL,
    NVLINKCAP_TIP_HEAD, NVLINKCAP_WHAT_IT_DOES, NVLINKCAP_WHAT_THE_ENGINE_SAYS, NVLINKCAP_WHAT_IT_IS_NOT,
    NVLINKCAP_REASON_COPY, nvlinkCapLineageFor, nvlinkCapCounterfactual, nvlinkCapPhaseDisposition, nvlinkCapLegCode, nvlinkCapReasonText,
    nvlinkCapLegDisclosure, nvlinkCapFactor, nvlinkCapReadout,
    /* The canonical claim constants and the three pinned gate lines composed from them. Exported
       so the suite pins the SAME bytes the page renders — one source of bytes, which is the whole
       point of the single-source split. */
    SPECDEC_PORTABLE_TICK, SPECDEC_GATE_SEMANTICS, SPECDEC_CONSERVATISM,
    SPECDEC_WHY_LINE, SPECDEC_RESET_LINE, SPECDEC_REPLAY_WHY_LINE,
    SPECDEC_SECTION_TITLE, SPECDEC_CONTROL_LABEL, SPECDEC_TIP_HEAD,
    specDecTokenConsistent,
    interlockInvariantHolds, interlockAfterEdit, interlockAfterEditChecked, interlockGroupOf, interlockLockedGroup,
    interlockTokenConsistent, deriveInterlockFor, leverDomainViolation,
    REFERENCE_LEVER_PIN, pinReferenceLevers,
    /* b9 M6 (FA memo §5, §2.9, §17): the exec-summary registry + the pinned copy constants —
       exported so the suite pins the SAME bytes the page renders (one source of bytes). */
    EXEC_SUMMARY_ROWS, MTP_ROW_COPY, LOW_EVIDENCE_COPY, tcoAssumptionVector, execSummaryRowTokens,
    execSummaryRowState, tcoDefaultBands, pueBandForClass, clusterOverheadFor, capexProvenanceFor,
    clusterOverheadForLeg, readerCapexPreview,
    capitalRecoveryFactor, capitalRecoveryIncrementHr, capitalRecoveryDisclosure, tierRenderOptions,
    FA_MUST_NOT_BE_CALLED_FRAME, FA_MUST_NOT_BE_CALLED_VERBATIM,
  };
}

/* ---------- position dossiers ----------
   One per preset id. Values are NEVER duplicated here (they render live from the preset's
   set/dive), so dossiers cannot drift from the model — tests assert key coverage instead.
   params: key -> { src, label } annotation for each parameter the preset pins.
   Labels: DISCLOSED / CREDIBLY REPORTED / COMMUNITY ESTIMATE / SPECULATION (a parenthetical
   qualifier may refine a label, e.g. "DISCLOSED (derived)"; Custom uses structural USER-SET).
   Model dossiers annotate ioRatio/cacheHit ONLY when the model's own position includes a
   traffic mix (nativeTrafficWasExplicit) — dive-only traffic values get their provenance
   from the TRAFFIC_PROFILES entry rendered in the effective-traffic line. */
const DOSSIERS = {
  models: {
    opus: {
      attribution: "calculator-synthesis",
      who: "This page's central Anthropic flagship read — an analyst synthesis, not a leak.",
      anchor: { quote: "0.5T total. Current Grok is half the size of Sonnet and 1/10th the size of Opus.", url: "https://x.com/elonmusk/status/2042123561666855235" },
      params: { active: { src: "Page-authored 300B scenario value. TeorTaxes's cited corpus supplies only a qualitative Fable observation ('shockingly FEW active') and a relative Opus bound; GPT-5.6 Pro's independent consult also centered on 300B — neither supplies a measured count", label: "SPECULATION" }, total: { src: "Page-adopted 2–3T planning band, scalar 2.5T (adjudicated 2026-07-24), informed by newer community estimates; the Musk Apr 2026 relative post is re-read as the prior flagship, Opus 4.6 — its 5T deduction is preserved as a labeled size case (knowledge-probe methods carry ±3× bars)", label: "COMMUNITY ESTIMATE" }, precision: { src: "Assumed frontier norm; FP8 paths standard on H100+ fleets", label: "SPECULATION" }, priceIn: { src: "Anthropic price list", label: "DISCLOSED" }, priceOut: { src: "Anthropic price list", label: "DISCLOSED" } },
      assumes: ["A 12% activation ratio MoE (300B/2.5T) — the single most load-bearing guess on the page; the legacy 5T case is separate", "List API pricing; no fast-mode or enterprise-discount mix"],
      falsifiers: ["Any credible active-parameter disclosure or leak", "A serving-speed measurement incompatible with ~300B active at known hardware"],
    },
    sonnet: {
      attribution: "calculator-synthesis",
      who: "Sonnet 5 at its standing $2/$10 tariff (permanent since 2026-08-10), with architecture carried over from the 4.x-era analysis.",
      /* The anchor quote is what the cited page SAYS, checked against it on the stated date — not what it
         said once. Until 2026-09-02 this field carried "Introductory pricing: $2/$10 per MTok through
         August 31, 2026; $3/$15 thereafter" against a LIVE url that had said the opposite since
         2026-08-10: a stale quotation in a structured evidence field, with a mutable source presented
         as supporting it. That is the machine-consumer surface prose edits do not reach (GPT Pro
         pr-20260902T175643Z-034d27). The superseded wording is kept as history, dated on both ends,
         rather than deleted. */
      anchor: { quote: "The $2/$10 per million input/output token pricing for Claude Sonnet 5, announced at launch as introductory pricing through August 31, 2026, is now the standard price. The previously scheduled increase to $3/$15 per million input/output tokens on September 1, 2026 will not occur.",
                url: "https://platform.claude.com/docs/en/about-claude/pricing", observedAt: "2026-09-02",
                supersededEvidence: [{ quote: "Introductory pricing: $2/$10 per MTok through August 31, 2026; $3/$15 thereafter.",
                                       observedAt: "2026-06-30", supersededAt: "2026-08-10",
                                       supersededBy: "https://www.anthropic.com/news/claude-sonnet-5 (Edit August 10, 2026: the introductory pricing is now permanent)" }] },
      params: { active: { src: "4.x-era estimate; Sonnet 5's architecture is undisclosed", label: "SPECULATION" }, total: { src: "Musk post deduction (Grok = ½ Sonnet 4.x); carried over", label: "SPECULATION" }, precision: { src: "Assumed frontier norm", label: "SPECULATION" }, priceIn: { src: "Anthropic pricing page — $2/$10 standing rate, permanent since 2026-08-10 (the Sep-1-2026 step to $3/$15 was cancelled)", label: "DISCLOSED" }, priceOut: { src: "Anthropic pricing page — $2/$10 standing rate, permanent since 2026-08-10 (the Sep-1-2026 step to $3/$15 was cancelled)", label: "DISCLOSED" } },
      assumes: ["Sonnet 5 ≈ Sonnet 4.x economically — but its tokenizer emits ~30% more tokens per text, so per-text margins differ from per-token ones"],
      falsifiers: ["Sonnet 5 architecture disclosure", "a future Sonnet 5 tariff change (the 2026-09-01 step to $3/$15 was cancelled on 2026-08-10; $2/$10 is the standing rate)"],
    },
    haiku: {
      attribution: "calculator-synthesis",
      who: "The small-tier placeholder — least-grounded model preset on the page.",
      anchor: { quote: "No public size data exists for Haiku 4.5.", url: "https://platform.claude.com/docs/en/about-claude/pricing" },
      params: { active: { src: "Pure scenario value", label: "SPECULATION" }, total: { src: "Pure scenario value", label: "SPECULATION" }, precision: { src: "Assumed frontier norm", label: "SPECULATION" }, priceIn: { src: "Anthropic price list", label: "DISCLOSED" }, priceOut: { src: "Anthropic price list", label: "DISCLOSED" } },
      assumes: ["Everything about the architecture"],
      falsifiers: ["Any size information at all"],
    },
    gpt: {
      attribution: "reconstruction",
      who: "OpenAI's flagship as modeled in this page's GPT-5.6 Pro deep dive (§10, annex).",
      anchor: { quote: "Epoch estimated GPT-5 at ~100B active … Zephyr's claim is a defensible central prior rather than an isolated rumor.", url: "research/openai-gptpro.html" },
      params: { active: { src: "Zephyr '~100B active range' + Epoch's independent inference-economics estimate (80% range 50–220B)", label: "COMMUNITY ESTIMATE" }, total: { src: "Dive central ~5T; subjective range 1–20T — effective-capacity probes allow 3–29T", label: "SPECULATION" }, precision: { src: "MXFP4 demonstrated in gpt-oss; Sol's production layers undisclosed", label: "SPECULATION" }, priceIn: { src: "OpenAI API pricing (Standard short-context), read 2026-09-19: $4 (was $5)", label: "DISCLOSED" }, priceOut: { src: "OpenAI API pricing, read 2026-09-19: $20 (was $30)", label: "DISCLOSED" }, ioRatio: { src: "ADOPTED ASSUMPTION over a reported benchmark convention: Artificial Analysis runs a 7 cached : 2 fresh : 1 output mix (that convention is CREDIBLY REPORTED). Applying it as OpenAI's SERVED traffic is this page's assumption — no OpenAI traffic telemetry is disclosed, and a benchmark convention is not a measurement of what a provider serves", label: "SPECULATION" }, cacheHit: { src: "Same adopted assumption (7/9 of input cached). The convention is reported; the claim that OpenAI's traffic looks like it is this page's", label: "SPECULATION" }, blend: { src: "Hopper/Blackwell across Microsoft/OCI/CoreWeave (disclosed platforms; shares guessed)", label: "SPECULATION" } },
      assumes: ["Single-pass serving (Sol 'ultra' multi-agent mode not modeled)", "Short-context tariff; >272K requests reprice entirely"],
      falsifiers: ["Any Sol parameter/routing disclosure", "Aggregate tok/s/GPU telemetry from any of the three clouds"],
    },
    gemini: {
      attribution: "reconstruction",
      who: "Google's flagship as modeled in this page's Google deep dive — the weakest architecture evidence on the page, the strongest vertical-integration evidence.",
      anchor: { quote: "The honest answer is that nobody outside Google appears to know [the parameter counts].", url: "research/google-gptpro.html" },
      params: { active: { src: "Scenario midpoint (bracket 60–240B); no credible leak exists", label: "SPECULATION" }, total: { src: "Scenario midpoint (bracket 1–4T)", label: "SPECULATION" }, precision: { src: "Ironwood exposes FP8; Gemini's formats undisclosed", label: "SPECULATION" }, priceIn: { src: "Gemini API pricing, ≤200K tier", label: "DISCLOSED" }, priceOut: { src: "Gemini API pricing (output incl. thinking)", label: "DISCLOSED" }, blend: { src: "TPUs serve Gemini (disclosed); simplified to Ironwood — older TPU fleets unmodeled", label: "SPECULATION" } },
      assumes: ["Paid-API economics only — the enormous free surface (Search, app, Workspace) is excluded by design"],
      falsifiers: ["Any parameter disclosure", "A published Gemini tok/s/chip measurement", "Internal TPU transfer-price reporting"],
    },
    grok: {
      attribution: "reconstruction",
      who: "xAI's flagship: the rare disclosed total-parameter count, on the one operationally-controlled fleet.",
      anchor: { quote: "based on xAI's 1.5T V9 foundation model", url: "https://x.com/elonmusk/status/2071184354756477041" },
      params: { active: { src: "Dive central ~200B (13% activation); range 100–500B — Grok-2's lineage ran unusually dense (42.7%)", label: "SPECULATION" }, total: { src: "Musk statement, corroborated by Cursor's MoE description", label: "DISCLOSED" }, precision: { src: "Grok-2 recipe was FP8/TP8 — best public prior", label: "SPECULATION" }, priceIn: { src: "xAI API pricing (launched Jul 8, 2026)", label: "DISCLOSED" }, priceOut: { src: "xAI API pricing", label: "DISCLOSED" }, cacheReadMult: { src: "$0.30 cached / $2.00 input = 15% (docs.x.ai/developers/models/grok-4.5, read 2026-09-02; supersedes the $0.50 = 25% launch rate)", label: "DISCLOSED" }, blend: { src: "ADOPTED ASSUMPTION over a disclosure of a different quantity: the SpaceXAI prospectus discloses Colossus I/II ACCELERATOR COUNTS (that disclosure is CREDIBLY REPORTED). This field is a share of SERVED TOKENS, and accelerator counts do not establish model allocation, occupancy or delivered-token share — the 45/5/25/25 split is this page's approximation", label: "SPECULATION" } },
      assumes: ["The full-cycle-TCO scenario preset (see the xAI card: the live cash-marginal and opportunity-cost replays compute ~90.7% and ~18.7%)"],
      falsifiers: ["Active-parameter or replica-configuration disclosure", "Aggregate throughput telemetry", "Changes to the Anthropic/Google capacity contracts that re-price the opportunity cost"],
    },
    kimi: {
      attribution: "reconstruction",
      who: "Moonshot's coding flagship — open weights make the architecture the best-evidenced on the page; the fleet is the mystery.",
      anchor: { quote: "1.0T total parameters; 32B activated per token; … native selective, weight-only INT4.", url: "research/moonshot-gptpro.html" },
      params: { active: { src: "Open checkpoint config", label: "DISCLOSED" }, total: { src: "Open checkpoint (595GB)", label: "DISCLOSED" }, precision: { src: "Released weights are INT4; hosted path undisclosed — 8-bit modeled", label: "SPECULATION" }, priceIn: { src: "Moonshot platform pricing", label: "DISCLOSED" }, priceOut: { src: "Moonshot platform pricing", label: "DISCLOSED" }, cacheReadMult: { src: "$0.19/$0.95 = 20%", label: "DISCLOSED" }, blend: { src: "Historical A800/H800 production (Mooncake); current fleet undisclosed", label: "SPECULATION" } },
      assumes: ["The activated §10 replay's 85.2% headline is OUTPUT-TOKEN margin ($0.593/M output cost); the 72.4% blended figure uses a workload the dive itself declined to estimate"],
      falsifiers: ["Fleet or hosted-precision disclosure", "A production tok/s/GPU figure for K2.7"],
    },
    dsr1: {
      attribution: "quoted-position",
      who: "The calibration anchor: the only frontier model whose production serving economics were disclosed by its operator.",
      anchor: { quote: "73.7k input / 14.8k output tokens per second per node … cost-profit ratio 545%.", url: "https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md" },
      params: { active: { src: "V3 technical report", label: "DISCLOSED" }, total: { src: "V3 technical report", label: "DISCLOSED" }, precision: { src: "FP8 matmuls, BF16 attention (their disclosure)", label: "DISCLOSED" }, priceIn: { src: "R1 price list (historical)", label: "DISCLOSED" }, priceOut: { src: "R1 price list (historical)", label: "DISCLOSED" }, cacheReadMult: { src: "$0.14 hit / $0.55 miss = 25%", label: "DISCLOSED" }, ioRatio: { src: "608B in / 168B out = 3.6:1 (slider granularity: 4)", label: "DISCLOSED" }, cacheHit: { src: "Disclosed 56.3%", label: "DISCLOSED" }, blend: { src: "All service ran on 8×H800 nodes (disclosed)", label: "DISCLOSED" } },
      assumes: ["Theoretical billing: DeepSeek stated actual realized revenue was materially lower (free traffic, off-peak V3 pricing)"],
      falsifiers: ["Nothing — this is the ground truth the model is fit to. A newer disclosure would extend it"],
    },
    dsv4: {
      attribution: "reconstruction",
      who: "DeepSeek's current flagship: fully disclosed architecture, post-price-war tariff — the page's demonstration that efficiency can be spent on price instead of margin.",
      anchor: { quote: "V4-Pro: 1.6T total / 49B active … permanent 75% price reduction.", url: "research/deepseek-gptpro.html" },
      params: { active: { src: "Official release + technical report", label: "DISCLOSED" }, total: { src: "Official release", label: "DISCLOSED" }, precision: { src: "Selective FP4 (routed experts + indexer; KV BF16/FP8) — modeled as fp4 where hardware supports it", label: "DISCLOSED" }, priceIn: { src: "api-docs.deepseek.com pricing, read 2026-09-19: $0.66 off-peak / $1.32 peak (was $0.435 from the Jul 9 read)", label: "DISCLOSED" }, priceOut: { src: "api-docs.deepseek.com pricing, read 2026-09-19: $1.98 off-peak / $3.96 peak (was $0.87)", label: "DISCLOSED" }, cacheReadMult: { src: "$0.022 hit / $0.66 miss = 3.33% (read 2026-09-19; the prior 0.83% was $0.003625/$0.435 under the superseded tariff)", label: "DISCLOSED" }, ioRatio: { src: "2025 disclosed traffic shape carried forward", label: "SPECULATION" }, cacheHit: { src: "2025 disclosed 56.3% carried forward", label: "SPECULATION" }, blend: { src: "H800 stock + reported Ascend 950 involvement; split unknown", label: "SPECULATION" } },
      assumes: ["Pre-surcharge base tariff (a 2× peak-window price was announced for mid-July)", "V4 work-per-token ≈ V3 stack scaled by architecture (no V4 production throughput disclosure exists)"],
      falsifiers: ["A V4 serving disclosure like 2025's", "Fleet-split reporting", "The peak tariff going live (doubling both modeled tariffs computes ~93.2% in-window)"],
    },
    glm: {
      attribution: "reconstruction",
      who: "Zhipu's flagship: disclosed architecture, audited segment financials — and a nine-platform domestic fleet nobody can see into.",
      anchor: { quote: "FY2025 cloud/API gross margin 18.9%, after −0.4% in H1 2025.", url: "research/zhipu-gptpro.html" },
      params: { active: { src: "Open release", label: "DISCLOSED" }, total: { src: "Open release", label: "DISCLOSED" }, precision: { src: "BF16/FP8 checkpoints; first-party serving precision undisclosed (W8A8/W4A8 recipes exist)", label: "SPECULATION" }, priceIn: { src: "Z.ai international pricing", label: "DISCLOSED" }, priceOut: { src: "Z.ai international pricing", label: "DISCLOSED" }, cacheReadMult: { src: "$0.26/$1.40 = 19%", label: "DISCLOSED" }, ioRatio: { src: "Reference convention since 2026-09-19 — this row no longer opens on the ncode profile, whose site-authored 8:1 and @_xjdr's 81k average inputs put an 86,062-token decode context on every state; that profile is unchanged and still selectable", label: "SPECULATION" }, cacheHit: { src: "Reference convention 60% since 2026-09-19; @_xjdr's measured ncode-week 41% applies to the ncode profile, which is no longer this row's default", label: "SPECULATION" }, blend: { src: "Nine domestic platforms named, zero shares disclosed", label: "SPECULATION" } },
      assumes: ["Direct-API economics (the Coding Plan realizes a small fraction of list value)"],
      falsifiers: ["Platform traffic-share disclosure", "STAR-market prospectus with unit economics", "A first-party throughput figure"],
    },
    dsv4f: {
      attribution: "reconstruction",
      who: "DeepSeek's small-tier flagship — disclosed architecture at a tariff the dive showed cannot be served on the old cost structure.",
      anchor: { quote: "Current V4-Flash [would earn] −2.2% [on the 2025 cost structure] — it must benefit from its much smaller 13B-active model, better batching/hardware, strategic subsidy, or a different workload mix.", url: "research/deepseek-gptpro.html" },
      params: { active: { src: "Official release", label: "DISCLOSED" }, total: { src: "Official release", label: "DISCLOSED" }, precision: { src: "Same selective-FP4 family as V4 Pro", label: "DISCLOSED" }, priceIn: { src: "api-docs.deepseek.com pricing, read 2026-09-19: $0.15 off-peak / $0.30 peak (was $0.14)", label: "DISCLOSED" }, priceOut: { src: "api-docs.deepseek.com pricing, read 2026-09-19: $0.60 off-peak / $1.20 peak (was $0.28)", label: "DISCLOSED" }, cacheReadMult: { src: "$0.003 hit / $0.15 miss = 2% (read 2026-09-19; unchanged in ratio from the prior $0.0028/$0.14)", label: "DISCLOSED" }, ioRatio: { src: "2025 traffic shape carried forward", label: "SPECULATION" }, cacheHit: { src: "2025 disclosed 56.3% carried forward", label: "SPECULATION" }, blend: { src: "Same speculative China mix as V4 Pro", label: "SPECULATION" } },
      assumes: ["Flash traffic resembles Pro traffic (its 2,500-concurrency tier suggests it absorbs the bulk demand)"],
      falsifiers: ["Any Flash-specific serving disclosure", "Fleet-split reporting"],
    },
    glm47: {
      attribution: "reconstruction",
      who: "Zhipu's workhorse — the model its own Coding Plan routes routine work to, at a distinctly lower price floor than GLM-5.2.",
      anchor: { quote: "Z.ai's Coding Plan documentation recommends GLM-4.7 for routine work and GLM-5.2 for harder tasks.", url: "research/zhipu-gptpro.html" },
      params: { active: { src: "Open release", label: "DISCLOSED" }, total: { src: "Open release", label: "DISCLOSED" }, precision: { src: "BF16/FP8 checkpoints; first-party serving precision undisclosed", label: "SPECULATION" }, priceIn: { src: "Z.ai pricing", label: "DISCLOSED" }, priceOut: { src: "Z.ai pricing", label: "DISCLOSED" }, cacheReadMult: { src: "$0.11/$0.60 ≈ 18%", label: "DISCLOSED" }, ioRatio: { src: "Reference convention since 2026-09-19; the inherited GLM-5.2 8:1 was never supported by GLM-4.7 telemetry and is no longer this row's default", label: "SPECULATION" }, cacheHit: { src: "Reference convention 60% since 2026-09-19; the inherited ncode-week 41% has no GLM-4.7 telemetry behind it and is no longer this row's default", label: "SPECULATION" }, blend: { src: "As GLM-5.2 — nine platforms named, shares unknown", label: "SPECULATION" } },
      assumes: ["Same fleet and workload shape as 5.2 (only the model and tariff differ)"],
      falsifiers: ["Same as GLM-5.2's card"],
    },
    terra: {
      attribution: "calculator-synthesis",
      who: "A tariff scenario, not a provider estimate: Terra's price is disclosed; everything architectural is a scenario value inside the dive's wide ranges.",
      anchor: { quote: "It need not be a simple half-sized Sol.", url: "research/openai-gptpro.html" },
      params: { active: { src: "Scenario central from dive range 20–110B", label: "SPECULATION" }, total: { src: "Scenario central from dive range 0.25–5T", label: "SPECULATION" }, precision: { src: "Family assumption", label: "SPECULATION" }, priceIn: { src: "OpenAI pricing, read 2026-09-19: $2 (was $2.50)", label: "DISCLOSED" }, priceOut: { src: "OpenAI pricing, read 2026-09-19: $12 (was $15)", label: "DISCLOSED" }, cacheReadMult: { src: "90% cache discount (OpenAI standard)", label: "DISCLOSED" }, ioRatio: { src: "Same adopted assumption as Sol — a reported benchmark convention applied to served traffic by this page", label: "SPECULATION" }, cacheHit: { src: "Same adopted assumption", label: "SPECULATION" }, blend: { src: "Sol's fleet assumption", label: "SPECULATION" } },
      assumes: ["That a margin computed from scenario sizes means anything — read the range, not the point"],
      falsifiers: ["Any Terra architecture disclosure (would convert this from scenario to estimate)"],
    },
    luna: {
      attribution: "calculator-synthesis",
      who: "A tariff scenario for OpenAI's fast tier: price and user-stream speed are identified; the architecture is not.",
      anchor: { quote: "measured ~205–229 output tokens/s … It could instead be a much larger model with more aggressive distillation, routing, or speculative decoding.", url: "research/openai-gptpro.html" },
      params: { active: { src: "Scenario central from dive range 8–50B", label: "SPECULATION" }, total: { src: "Scenario central from dive range 0.05–1.5T", label: "SPECULATION" }, precision: { src: "Family assumption", label: "SPECULATION" }, priceIn: { src: "OpenAI pricing, read 2026-09-19: $0.20 (was $1 — five times the live tariff)", label: "DISCLOSED" }, priceOut: { src: "OpenAI pricing, read 2026-09-19: $1.20 (was $6)", label: "DISCLOSED" }, cacheReadMult: { src: "90% cache discount", label: "DISCLOSED" }, ioRatio: { src: "Sol's adopted assumption, carried — a reported benchmark convention applied to served traffic by this page", label: "SPECULATION" }, cacheHit: { src: "Sol's adopted assumption, carried", label: "SPECULATION" }, blend: { src: "Sol's fleet assumption", label: "SPECULATION" } },
      assumes: ["Same as Terra — scenario, not estimate"],
      falsifiers: ["Any Luna architecture disclosure"],
    },
    gemflash: {
      attribution: "calculator-synthesis",
      who: "A tariff scenario for Google's fast tier — a comparator for the price war, not a frontier estimate.",
      anchor: { quote: "a 2026 memorization-based preprint assigns the preceding Gemini 3 Flash Preview a 405B-parameter lower bound … [estimates are] very low confidence.", url: "research/google-gptpro.html" },
      params: { active: { src: "Speed-based community guesses 10–16B; scenario value", label: "SPECULATION" }, total: { src: "Bracketed 0.4–1.2T in the dive; 405B lower-bound applies to the PRIOR generation", label: "SPECULATION" }, precision: { src: "Unknown; FP8-equivalent assumed", label: "SPECULATION" }, priceIn: { src: "Gemini API pricing", label: "DISCLOSED" }, priceOut: { src: "Gemini API pricing (incl. thinking)", label: "DISCLOSED" }, cacheReadMult: { src: "$0.15/$1.50 = 10%", label: "DISCLOSED" }, ioRatio: { src: "Default reference mix", label: "SPECULATION" }, cacheHit: { src: "Default reference mix", label: "SPECULATION" }, blend: { src: "TPU (as 3.1 Pro)", label: "SPECULATION" } },
      assumes: ["Fast-tier traffic resembles the reference mix"],
      falsifiers: ["Any Flash architecture disclosure"],
    },
    custom: {
      attribution: "calculator-synthesis",
      who: "A user-defined scratch model — this page asserts nothing about it; every value is yours to set with the sliders.",
      anchor: null,
      params: { active: { src: "User input (slider)", label: "USER-SET" }, total: { src: "User input (slider)", label: "USER-SET" }, precision: { src: "User input (slider)", label: "USER-SET" }, priceIn: { src: "User input (slider)", label: "USER-SET" }, priceOut: { src: "User input (slider)", label: "USER-SET" } },
      assumes: ["Nothing — it is a blank scratch model with no provider and no sourced parameters"],
      falsifiers: ["Not applicable — a user-defined scenario makes no empirical claim to falsify"],
    },
  },
  perspectives: {
    median: {
      attribution: "calculator-synthesis",
      who: "This page's own synthesis (report §5): a heterogeneous low/committed planning-rate vector, not an observed invoice or purchasable market basket.",
      anchor: { quote: "registered low/committed planning rates, 50% fleet utilization, current open-source-level serving stack, balanced latency", url: "#s5" },
      params: { hwMode: { src: "Hourly-rate basis — a page-assembled mixture of public and analyst-set low/committed values", label: "SPECULATION" }, rentMult: { src: "Exactly 1.0× the heterogeneous registered planning vector", label: "SPECULATION" }, util: { src: "Page-set 30–60% sensitivity band, middle", label: "SPECULATION" }, stackMult: { src: "Open-source-best (SGLang-class) = 1.0 by construction", label: "COMMUNITY ESTIMATE" }, interact: { src: "Balanced latency — neither batch-farm nor premium-interactive", label: "SPECULATION" }, batchShare: { src: "Modest batch-tier adoption", label: "SPECULATION" }, discount: { src: "Light enterprise discounting", label: "SPECULATION" } },
      assumes: ["The heterogeneous per-chip rates can be blended as one planning vector", "No free traffic"],
      falsifiers: ["Evidence of Anthropic's actual blended $/chip-hour (e.g. the xAI contract at $5.27 bundled suggests the truth is messier than either pole)"],
    },
    /* Range-exploration dossiers (v2.1.3 M2; PRUNED 2026-07-11 to discourse-tied routes only).
       Attribution is calculator-synthesis on every entry: these are this page's own reconstructed
       ROUTES into a range the discourse points at — explicitly NOT the claimant's own cost model.
       P0-4: no external party's name appears in any field below — the claim records (MARGIN_CLAIMS)
       hold all names. The 60–80% bucket has no exploration dossier (no config lives there). */
    "x90-v1": {
      attribution: "calculator-synthesis",
      who: "PAGE-AUTHORED RECONSTRUCTION of one route into the ≥90% range the discourse points at (the owned-TCO story: a lab that owns/commits its fleet pays build-cost, not rental markup). This page's own route, NOT any external party's cost model — no external party selected this vector.",
      anchor: { quote: "What would have to be true for a ≥90% modeled serving margin at the flagship scope?", url: "#s5" },
      params: { hwMode: { src: "Page-chosen owned-TCO basis — hourly cost built from capex, power, datacenter and opex", label: "SPECULATION" }, kwh: { src: "Historical $0.07/kWh pin retained when the generic default moved to the EIA US-industrial midpoint on 2026-08-22", label: "SPECULATION" },       dcPerW: { src: "im-arc T4 fold historical pin: the pre-fold $12/W datacenter capex, retained so this archived reading reproduces after the generic default moved to $12.5/W on 2026-08-24", label: "SPECULATION" },
      dcLifeYears: { src: "im-arc T4 fold historical pin: the pre-fold 12-year facility life, retained after that literal became the named default dcLifeYears at 15 years on 2026-08-24", label: "SPECULATION" },
      capexScopeMode: { src: "im-arc T4 fold historical pin: the pre-fold global cluster-overhead semantics (1.30 on every row), retained after the overhead became capex-scope-derived on 2026-08-24", label: "SPECULATION" },
      capitalRecovery: { src: "im-arc T4 fold historical pin: capital recovery was absent from the engine when this reading was archived; it is stated off so the reading cannot drift if the canonical default ever moves", label: "SPECULATION" },
      capexAbsLeg: { src: "im-arc T4 fold historical pin: the pre-fold registered capex points for all ten donors, retained after four of them moved onto dated analyst spans on 2026-08-24", label: "SPECULATION" },
      rentRegistryPin: { src: "im-arc T4 fold historical pin: the pre-fold REGISTERED planning-rent vector for all ten donors — pinned below the reader controls so this route\u2019s own multipliers still apply — retained after two middles moved and three rows lost their default to the unavailable-rate path on 2026-08-24", label: "SPECULATION" },
      dcPerW: { src: "im-arc T4 fold historical pin: the pre-fold $12/W datacenter capex, retained so this archived reading reproduces after the generic default moved to $12.5/W on 2026-08-24", label: "SPECULATION" },
      dcLifeYears: { src: "im-arc T4 fold historical pin: the pre-fold 12-year facility life, retained after that literal became the named default dcLifeYears at 15 years on 2026-08-24", label: "SPECULATION" },
      capexScopeMode: { src: "im-arc T4 fold historical pin: the pre-fold global cluster-overhead semantics (1.30 on every row), retained after the overhead became capex-scope-derived on 2026-08-24", label: "SPECULATION" },
      capitalRecovery: { src: "im-arc T4 fold historical pin: capital recovery was absent from the engine when this reading was archived; it is stated off so the reading cannot drift if the canonical default ever moves", label: "SPECULATION" },
      capexAbsLeg: { src: "im-arc T4 fold historical pin: the pre-fold registered capex points for all ten donors, retained after four of them moved onto dated analyst spans on 2026-08-24", label: "SPECULATION" },
      rentRegistryPin: { src: "im-arc T4 fold historical pin: the pre-fold REGISTERED planning-rent vector for all ten donors — pinned below the reader controls so this route\u2019s own multipliers still apply — retained after two middles moved and three rows lost their default to the unavailable-rate path on 2026-08-24", label: "SPECULATION" },
util: { src: "Page-set 55% occupancy scenario value", label: "SPECULATION" }, stackMult: { src: "Page-set 1.1× serving-stack scenario value", label: "SPECULATION" }, interact: { src: "Central-scenario balanced latency", label: "SPECULATION" }, batchShare: { src: "Central-scenario 15% batch-tier share", label: "SPECULATION" }, discount: { src: "Central-scenario 5% blended discount", label: "SPECULATION" } },
      assumes: ["A lab's fleet behaves like a well-run owned estate (depreciation schedule choices dominate)"],
      falsifiers: ["Evidence of actual procurement costs far from owned-TCO equivalence"],
    },
    /* x90-v2 (2026-08-16) — the dossier for the batch route. Its `who` keeps the same
       vector-is-ours sentence every route carries; the CLAIM it answers is attributed in the
       anchor, quoted verbatim from the claims registry rather than paraphrased here. */
    "x90-v2": {
      attribution: "calculator-synthesis",
      who: "PAGE-AUTHORED RECONSTRUCTION of the MECHANISM named in the 90\u219295% claim, applied alone: the \u226590% owned-TCO route with one field changed \u2014 the serving regime moved to throughput. This page's own route, NOT any external party's cost model \u2014 no external party selected this vector; what is attributed is the claim it answers, not the parameters.",
      anchor: { quote: "No, they'll just increase the batch size, have the same speed, and drive margins from 90% to 95%. You're welcome", url: "https://x.com/teortaxesTex/status/2070786814097440805" },
      params: { hwMode: { src: "Page-chosen owned-TCO basis, inherited unchanged from the \u226590% route", label: "SPECULATION" }, kwh: { src: "Historical $0.07/kWh pin inherited from the \u226590% route when the generic default moved on 2026-08-22", label: "SPECULATION" },
        dcPerW: { src: "im-arc T4 fold historical pin inherited from the ≥90% route: the pre-fold $12/W datacenter capex", label: "SPECULATION" },
        dcLifeYears: { src: "im-arc T4 fold historical pin inherited from the ≥90% route: the pre-fold 12-year facility life", label: "SPECULATION" },
        capexScopeMode: { src: "im-arc T4 fold historical pin inherited from the ≥90% route: the pre-fold global cluster-overhead semantics (1.30 on every row)", label: "SPECULATION" },
        capitalRecovery: { src: "im-arc T4 fold historical pin inherited from the ≥90% route: capital recovery was absent when this reading was archived and is stated off", label: "SPECULATION" },
        capexAbsLeg: { src: "im-arc T4 fold historical pin inherited from the ≥90% route: the pre-fold registered capex points for all ten donors", label: "SPECULATION" },
        rentRegistryPin: { src: "im-arc T4 fold historical pin inherited from the ≥90% route: the pre-fold REGISTERED planning-rent vector for all ten donors", label: "SPECULATION" }, util: { src: "Page-set 55% occupancy, inherited unchanged \u2014 deliberately NOT raised, so the batch lever is measured alone", label: "SPECULATION" }, stackMult: { src: "Page-set 1.1\u00d7 serving-stack value, inherited unchanged", label: "SPECULATION" }, interact: { src: "THE CLAIM'S OWN LEVER: the throughput serving regime \u2014 this engine's reading of 'increase the batch size, have the same speed'", label: "SPECULATION" }, batchShare: { src: "Central-scenario 15% batch-tier share, inherited unchanged", label: "SPECULATION" }, discount: { src: "Central-scenario 5% blended discount, inherited unchanged", label: "SPECULATION" } },
      assumes: ["That raising the declared batch at held speed is what the claim's 'increase the batch size' means in this roofline", "The owned-TCO estate basis of the route it modifies"],
      falsifiers: ["A disclosed serving curve showing the batch lever is worth materially more than the ~1.2 points computed here", "Evidence that the presupposed ~90% starting point is reached by some other mechanism this route does not model"],
    },
    "x80-v3": {
      attribution: "calculator-synthesis",
      who: "PAGE-AUTHORED RECONSTRUCTION of one route into the 80–90% range the discourse points at (a floor 'north of 80%' for Opus API tokens; an earlier ~80% inference-only read — both verbatim in the claims registry): the 1.0× heterogeneous planning-rate vector, an aggressive serving stack, throughput serving. This page's own route, NOT any external party's cost model — no external party selected this vector.",
      anchor: { quote: "What would have to be true for an 80–90% modeled serving margin at the flagship scope?", url: "#s5" },
      params: { hwMode: { src: "Page-set hourly-rate basis using the heterogeneous registered vector", label: "SPECULATION" }, rentMult: { src: "Page-set 1.0× planning-vector multiplier", label: "SPECULATION" }, util: { src: "Page-set 70% fleet-utilization scenario value", label: "SPECULATION" }, stackMult: { src: "Page-set 1.25× serving-stack scenario value", label: "SPECULATION" }, interact: { src: "Page-set throughput-first serving", label: "SPECULATION" }, batchShare: { src: "Page-set 10% batch-price share", label: "SPECULATION" }, discount: { src: "Page-set 0% negotiated discount", label: "SPECULATION" } },
      assumes: ["A frontier lab out-executes the open-source serving baseline by ~25%", "Latency demands don't bind"],
      falsifiers: ["Fleet-utilization evidence below ~50%", "Evidence of hyperscaler-markup procurement rates"],
    },
    "x80-v4": {
      attribution: "calculator-synthesis",
      who: "PAGE-AUTHORED RECONSTRUCTION of a second route into the 80–90% discourse range: a 0.9× multiplier on the heterogeneous planning-rate vector with an above-baseline stack. This page's own route, NOT any external party's cost model — no external party selected this vector.",
      anchor: { quote: "What would have to be true for an 80–90% modeled serving margin at the flagship scope?", url: "#s5" },
      params: { hwMode: { src: "Page-set hourly-rate basis using the heterogeneous registered vector", label: "SPECULATION" }, rentMult: { src: "Page-set 0.90× planning-vector multiplier", label: "SPECULATION" }, util: { src: "Page-set 65% occupancy scenario value", label: "SPECULATION" }, stackMult: { src: "Page-set 1.15× serving-stack scenario value", label: "SPECULATION" }, interact: { src: "Page-set throughput-first serving", label: "SPECULATION" }, batchShare: { src: "Page-set 10% batch-price share", label: "SPECULATION" }, discount: { src: "Page-set 0% negotiated discount", label: "SPECULATION" } },
      assumes: ["Modestly privileged procurement and a better-than-OSS stack, without full strategic-partner rates"],
      falsifiers: ["Evidence of the actual blended $/chip-hour paid", "Fleet-occupancy evidence well below 65%"],
    },
    "x60-v3": {
      attribution: "calculator-synthesis",
      who: "PAGE-AUTHORED RECONSTRUCTION tied to the reported/accounting <60% discourse (reported ~40–50% frontier inference margins; a reported ~40% company gross-margin projection — records in the claims registry and §7): it stress-tests whether higher page-set direct-serving cost and a lower effective price reproduce those figures. It computes −40.3% — far below the reported 40–50% band; that is a failed unit-margin inversion, not agreement with or falsification of a reported company gross margin. This page's own diagnostic, NOT any external party's cost model; no external party selected this vector.",
      anchor: { quote: "What would have to be true for a <60% modeled serving margin at the flagship scope?", url: "#s5" },
      params: { hwMode: { src: "Page-chosen hourly-rate stress basis to test the reported figures", label: "SPECULATION" }, rentMult: { src: "Page-set 1.6× stress multiplier on the heterogeneous registered vector, inspired by public cloud-markup ranges but not a matched market basket", label: "SPECULATION" }, util: { src: "Page-set 35% (peak-provisioning story)", label: "SPECULATION" }, stackMult: { src: "Page-set 0.85× scenario value", label: "SPECULATION" }, interact: { src: "Page-set balanced mode", label: "SPECULATION" }, batchShare: { src: "Page-set 25% scenario value", label: "SPECULATION" }, discount: { src: "Page-set 20% (enterprise discounting is real, the level is page-chosen)", label: "SPECULATION" } },
      assumes: ["The calculator tests whether higher procurement cost, lower occupancy, lower stack efficiency, batch mix, and discounts can produce lower margins; no cited source asserted these mechanisms"],
      falsifiers: ["Update this scenario when any modeled parameter is measured. A failed inversion does not falsify any reported figure."],
    },
    gptpro: {
      attribution: "reconstruction",
      who: "GPT-5.6 Pro's independent Anthropic fleet model (report §6): strategic-partner procurement at scale.",
      anchor: { quote: "approximately 92–94% for Opus and 94–96% for Sonnet on a mature 2026 fleet … Is 95% an upper bound? No.", url: "research/anthropic-gptpro.html" },
      params: { hwMode: { src: "Rental frame at strategic rates", label: "SPECULATION" }, rentMult: { src: "Site applies SemiAnalysis's ~$1.60/TPU-hour estimate (Nov 2025 analysis of the 600k GCP-rented TPU tranche, inclusive of Google's margin — an estimate, not a disclosed contract price) as a 0.7x scalar across the modeled heterogeneous fleet", label: "SPECULATION derived from CREDIBLY REPORTED" }, util: { src: "Its 75% occupancy central (70 used here)", label: "SPECULATION" }, stackMult: { src: "Mature-lab stack ≈ OSS-best", label: "SPECULATION" }, interact: { src: "Throughput-oriented economic-marginal frame", label: "SPECULATION" }, batchShare: { src: "Not separately modeled by the dive", label: "SPECULATION" }, discount: { src: "List-price frame", label: "SPECULATION" }, blend: { src: "Its stated 40/25/15/15/5 TPU-heavy fleet", label: "SPECULATION" } },
      assumes: ["Anthropic pays partner rates fleet-wide (the xAI contract at $5.27 bundled is evidence the blended truth may sit higher)"],
      falsifiers: ["Disclosed Anthropic compute invoices", "TPU strategic-rate revisions"],
    },
    /* row 499: the three adjudicated presets. Every parameter carries its source and evidence
       label like any other preset — a preset that carries an outside estimate is held to the same
       provenance discipline as one built from the page's own registry, and the labels say plainly
       which values are the estimate's own and which are this page's stand-ins. */
    "gptpro-ctx": {
      attribution: "reconstruction",
      who: "GPT-5.6 Pro's contextual review of this page (2026-08-06), re-run with the findings that postdate it — the page-open default.",
      anchor: { quote: "A single naked point is not defensible. A public page should lead with two co-equal regimes and one synthesized judgment.", url: "research/anthropic-gptpro.html" },
      params: { hwMode: { src: "Rental frame at strategic/owned-opportunity rates", label: "SPECULATION" }, rentMult: { src: "1.0 global — this reading carries its posture PER FAMILY instead, so no fleet-wide scalar is asserted", label: "SPECULATION" }, rentMultLeg: { src: "Its own per-family fallback midpoints: NVIDIA 0.95x (declared range 0.90-1.00), TPU 0.50x (0.30-0.70), Trainium 0.85x (0.70-1.00) at zero headline weight. Every one is the midpoint of a range it declined to collapse, labeled by its author as a rendering convenience and explicitly not to be tuned toward a target margin", label: "SPECULATION (range midpoints, NOT pinned values)" }, util: { src: "Its stated 65% utilization midpoint over a 50-80% band — its analyst judgment, not a source", label: "SPECULATION" }, stackMult: { src: "Open-source-best baseline; no generalized speculative-decoding credit taken", label: "SPECULATION" }, interact: { src: "Balanced latency", label: "SPECULATION" }, batchShare: { src: "List-only billing — the review's explicit instruction for a published-tariff headline", label: "SPECULATION" }, discount: { src: "List-only billing — no negotiated discount", label: "SPECULATION" }, blend: { src: "Its fallback renderer midpoint (NVIDIA 60 / TPU 40 / Trainium 0) inside declared family constraints of 50-65% NVIDIA, 35-50% TPU, 0-15% Trainium; Trainium EXCLUDED from the point pending the form repair. The author labels the point itself as not publicly identified", label: "SPECULATION (family constraints, midpoint rendering)" }, dialRanges: { src: "The five dials this loadable vector declares as RANGES rather than points, in its own numbers: occupancy 50-80 (stated midpoint 65), effective compute-side cache reuse 40-80 (value 60), and procurement per family — NVIDIA 0.90-1.00, TPU 0.30-0.70 ('where the economic-regime disagreement is concentrated'), Trainium 0.70-1.00 at zero headline weight. The middle of each is its stated MEDIAN, not a computed mean, and the ends are the author's, not this page's: it wrote 'this is deliberately range-valued where the public record does not identify a point' and asked that the midpoints not be tuned until the target margin appears. Its other declared ranges are NOT carried, because this engine has no dial that means them: billable cache share (core 40-60), cost of serving a hit (2-15), cache write share (0-10) and the eligible-leg speculative-decode credit (1.00-1.10) each name a control this page either normalizes or gate-blocks, and rendering them on a neighbouring dial would misattribute the claim", label: "DECLARED RANGES (author's own, median-parameterised)" } },
      assumes: ["A strategic/owned procurement regime rather than the public rate card", "No algorithmic-lead prior — this reviewer holds a lead is not identifiable from public evidence, and an independent public-evidence sweep returned the same negative"],
      falsifiers: ["A disclosed Anthropic compute invoice or contracted rate", "A matched same-model serving receipt joining hardware, topology, precision, batch, context and measured prefill+decode", "A published utilization figure"],
    },
    "fable-ctx": {
      attribution: "reconstruction",
      who: "Fable 5's independent estimate, derived from this page's own numbers and hash-committed before any GPT-Pro output was opened (rows 494 and 499).",
      anchor: { quote: "which lets me price PER-LEG rate postures the UI's global multiplier cannot express", url: "research/anthropic-gptpro.html" },
      params: { hwMode: { src: "Rental frame at per-leg strategic rates", label: "SPECULATION" }, rentMult: { src: "1.0 global — the posture is carried per leg, not by a fleet-wide scalar", label: "SPECULATION" }, rentMultLeg: { src: "Its declared per-leg posture: TPU x0.30 (the strategic TPU rate this page already registers, applied to that leg alone), Trainium x0.70, and every NVIDIA leg left explicitly UNDISCOUNTED at 1.0 — a discount it declined to claim", label: "SPECULATION derived from CREDIBLY REPORTED" }, util: { src: "Its declared 60% utilization (band 50-70), held deliberately unmoved rather than raised to preserve altitude where the lead is withdrawn", label: "SPECULATION" }, stackMult: { src: "Open-source-best baseline; its declared efficiency credit rides beside the vector, not inside a dial", label: "SPECULATION" }, interact: { src: "Balanced latency", label: "SPECULATION" }, batchShare: { src: "This page's illustrative billing mix, kept deliberately so its number is comparable to the published reading", label: "SPECULATION" }, discount: { src: "This page's illustrative billing mix (5%)", label: "SPECULATION" }, dialRanges: { src: "The ONE axis of its band assembly its author stated in numbers: utilization 50-70 around a stated 60. Its other two band axes are deliberately NOT rendered — 'rates half-to-full-strategic' is a qualitative phrase this page will not convert into an adjudicator's numbers on their behalf, and the lead axis ('0-to-+3-not-stacked') is one this author explicitly instructs must not be switched on to reach its headline, because the serving-stack credit it took instead already covers part of the same mechanism. The band a reader sees here is therefore narrower than its author's stated 70-84, and the preset note says so rather than letting the narrower band pass as the whole claim", label: "DECLARED RANGE (one axis; the other two are stated qualitatively and left unrendered)" } },
      assumes: ["A per-leg strategic procurement regime, with the discount concentrated where the public evidence is strongest", "NO algorithmic-lead prior — withdrawn after the public-evidence sweep returned that no lead is identifiable, and replaced by a smaller, separately declared serving-stack credit that this engine has no legal control for"],
      falsifiers: ["A disclosed per-family contracted rate", "A measured serving-efficiency comparison between a closed lab and published open practice", "A control that legally expresses a bounded stack credit without double-counting the spec-decode anchors"],
    },
    "gptpro-r3": {
      attribution: "quoted-position",
      who: "GPT-5.6 Pro's contextual review, self-authored: it reviewed its own assumptions with full context and returned every one of them as numbers (row 514, 2026-08-08).",
      anchor: { quote: "I have no independent reason to select 2.6269 months; choosing it would be precisely the target tuning this commission prohibits", url: "orchestration/backlog-recovery/day-2026-07-28/row514-round3/gptpro-authored.json" },
      /* Same attribution reasoning as fable-r3: nothing here was reconstructed from prose, so no
         param is SPECULATION. Where a value is this page's framing rather than its author's number,
         the entry says which. */
      params: { hwMode: { src: "Rent — 'a strategic-contract rental lens, not an owned-TCO construction'", label: "DECLARED (author's own)" }, rentMult: { src: "1.0 global, held as a POINT on purpose: 'procurement uncertainty is carried by the leg ranges, so a global range would add a second copy of the same uncertainty'", label: "DECLARED (author's own)" }, rentMultLeg: { src: "The procurement structure: a FAMILY ranges moved onto the legs that actually price, medians unchanged (NVIDIA legs 0.95, TPU v7 0.50, Trainium 0.85), with every family multiplier pinned at 1.0 so a family discount and a leg discount can never multiply into two copies of one claim", label: "DECLARED (author's own)" }, util: { src: "65 % median — 'no representative Anthropic occupancy telemetry identifies a narrower distribution'", label: "DECLARED (author's own)" }, stackMult: { src: "1.0 — the same published-open-practice referent as trendMonths = 0, so the residual private-stack claim is carried by the lead dial ALONE", label: "DECLARED (author's own)" }, interact: { src: "Balanced — its author's stated reason for holding it as a point is that throughput-first and low-latency are discrete scenario branches, not ordered quantiles with a defensible median", label: "DECLARED (author's own)" }, batchShare: { src: "0 % — the headline is explicitly AT LIST, so no discounted batch mix is assumed", label: "DECLARED (author's own)" }, discount: { src: "0 % — at list, for the same stated reason as batchShare", label: "DECLARED (author's own)" }, blend: { src: "h100 5 / h200 10 / gb200 25 / gb300 20 / tpu7 40, held as a POINT and the uncertainty LOGGED rather than faked: its author declines to invent independent scalar bands for a compositional variable whose shares must sum to 100 %", label: "DECLARED (author's own); its uncertainty is a logged calculator gap, not a hidden assumption" }, dialRanges: { src: "FIFTEEN declared three-point ranges, all author-stated. Three of them are dials this page had never carried — billCacheHit (previously left implicitly equal to serving reuse), cacheCost (previously a point with a verbal core range), and a deliberately ONE-SIDED cacheWriteShare 0/0/10. The lead axis moves off zero to 0/2/4. The procurement widths are family widths re-expressed per leg. What is NOT here is as declared as what is: precision, interactivity and hardware basis stay points because they are categorical scenario branches, and the fleet blend stays a point because the calculator has no compositional range that preserves a 100 % simplex — both logged as gaps rather than coerced into false quantiles", label: "DECLARED RANGE (fifteen axes, all author-stated; three of them dials this page had never carried)" } },
      assumes: ["That the residual private-serving-stack claim is carried by trendMonths ALONE — stackMult and specDec both stay at 1.0, because a positive stack multiplier would use the same referent twice and a separate speculative-decoding credit would need Anthropic-specific acceptance and draft-cost receipts that are not in the record", "That family-level and leg-level procurement discounts are ONE claim, not two, and therefore must never multiply", "That the stated 68-92 % span already contained the private-stack uncertainty the lead range now makes explicit, so the span is reallocated rather than widened"],
      falsifiers: ["A matched Anthropic measurement of residual end-to-end cost efficiency against contemporaneous published open practice, after removing hardware, precision, batching, caching and procurement: E <= 1.05 would push the lead median toward zero, E = 1.20-1.30 would reaffirm it, and E >= 1.4422 demonstrated across two production snapshots would support the 4-month upper point", "Representative Anthropic occupancy telemetry, which would narrow util", "A disclosed billable cached-input share, which would collapse the newly authored billCacheHit range"],
    },
    "fable-r3": {
      attribution: "quoted-position",
      who: "Fable 5's independent estimate, self-authored: it reviewed its own assumptions with full context and returned every one of them as numbers, measuring each through the calculator before declaring it (row 514, 2026-08-08).",
      anchor: { quote: "No dial was tuned to land a target margin: every value above was authored first and then measured; the band moved where the measurements said it moved (floor down, ceiling in)", url: "orchestration/backlog-recovery/day-2026-07-28/row514-round3/fable-authored.json" },
      /* ATTRIBUTION NOTE, and it is the reason this dossier carries no SPECULATION label anywhere.
         The round-2 presets are `reconstruction`: this page read an adjudicator's prose and built a
         vector from it, so labelling those params SPECULATION was the honest thing to do. Round 3 is
         a different object. Every value below came back from its author AS A NUMBER — that is the
         whole content of the commission — so there is nothing here for this page to have guessed at,
         and `quoted-position` is the accurate attribution. The invariant that a quoted position may
         carry no speculative param is therefore satisfied for the right reason rather than by
         relabelling: where the value is the author's, it says so; where the value is this page's
         illustrative mix, it says that the author ADOPTED it and why. */
      params: { hwMode: { src: "Rental frame at per-leg strategic rates", label: "DECLARED (author's own)" }, rentMult: { src: "1.0 global — its own words: 'the posture is per leg, never a fleet-wide scalar'", label: "DECLARED (author's own)" }, rentMultLeg: { src: "Its per-leg posture, central values declared by their author: TPU x0.30 (the strategic TPU rate this page already registers, applied to that leg alone), Trainium x0.70, every NVIDIA leg UNDISCOUNTED at 1.0 — the declined NVIDIA discount stands, and it is pinned as a zero-width range rather than left in prose", label: "DECLARED (author's own); the TPU rate itself is CREDIBLY REPORTED and registered by this page" }, util: { src: "Its declared 60% utilization — its own words: 'no altitude bought back through occupancy'", label: "DECLARED (author's own)" }, stackMult: { src: "Open-source-best baseline, held at 1.0 at EVERY point of the band — the same referent as the lead slider's zero, kept there deliberately so the serving-stack mechanism is counted exactly once now that the credit lives inside the lead dial", label: "DECLARED (author's own)" }, interact: { src: "Balanced latency, declared by its author", label: "DECLARED (author's own)" }, batchShare: { src: "This page's illustrative billing mix (15%) — not the author's number but its author's explicit CHOICE to adopt it, kept so this reading stays comparable with its author's own published one", label: "DECLARED (author adopted this page's illustrative mix, and said why)" }, discount: { src: "This page's illustrative billing mix (5%) — adopted on the same stated ground as batchShare", label: "DECLARED (author adopted this page's illustrative mix, and said why)" }, dialRanges: { src: "NINE declared three-point ranges, and every one of them is its author's own number rather than this page's reading of its prose. The two axes this page previously refused to render — 'rates half-to-full-strategic' and the lead axis '0-to-+3-not-stacked' — were returned as numbers by their author: the rates axis as per-leg ranges (TPU 0.30-0.65 around a degenerate 0.30 low, because 0.30 IS its full-strategic floor and it claims nothing cheaper), and the lead axis as 0/1/2. The lead HI is anchored to the OpenAI 2026-07-29 first-party '-20% end-to-end serving costs' datapoint (2.437 months at the ratified 3x/yr) and then integer-FLOORED to 2 rather than rounded, its author's stated reason being that the evidence is OpenAI's while this page's subject is Anthropic. The four NVIDIA legs carry deliberately zero-width ranges: a pinned claim of no discount, not an absent one", label: "DECLARED RANGE (nine axes, all author-stated; the two formerly-verbal axes are now numbers)" } },
      assumes: ["A per-leg strategic procurement regime, with the discount concentrated where the public evidence is strongest, and its half-strength read priced as the band's floor rather than left unstated", "That the +2.0-point serving-stack credit and the algorithmic-lead prior are THE SAME MECHANISM, and therefore share one dial: at the median trendMonths carries the credit (0.9159 months exactly, rendered as 1 because the dial is integer-only), at the high end it carries the OpenAI-anchored lead bound INSTEAD — never both. There is no 'the lead must not be switched on' caveat to obsolete by construction here, because there is no longer a separate credit for a lead to stack on top of"],
      falsifiers: ["A disclosed per-family contracted rate", "A measured serving-efficiency comparison between a closed lab and published open practice", "A control that legally expresses a bounded stack credit without double-counting the spec-decode anchors — still missing, which is why this reading routes its credit through the lead dial", "A fractional-month lead dial, which would let the declared 0.9159-month equivalence be stated exactly instead of rounded to 1"],
    },
    "stress-public-rate": {
      attribution: "page-authored",
      who: "This page's own planning baseline: the registered planning settings with no judgment dial moved.",
      anchor: { quote: "it is wrong to let that case, or the same case plus an unmeasured three-month prior, stand as the primary answer", url: "research/anthropic-gptpro.html" },
      params: { hwMode: { src: "Rental frame on the registered heterogeneous planning vector", label: "SPECULATION" }, rentMult: { src: "1.0x — no procurement judgment applied", label: "SPECULATION" }, util: { src: "50% — the page's unmoved occupancy value", label: "SPECULATION" }, stackMult: { src: "Open-source-best = 1.0 by construction", label: "COMMUNITY ESTIMATE" }, interact: { src: "Balanced latency", label: "SPECULATION" }, batchShare: { src: "The page's illustrative billing mix (15%) — note the only public figure anyone has for batch adoption is a surveyed ~4%, which is a labeled scenario anchor and not a provider disclosure", label: "SPECULATION" }, discount: { src: "The page's illustrative billing mix (5%)", label: "SPECULATION" } },
      assumes: ["Nothing beyond the registry — that is the point: this reading is meant to be rebuildable from public rate cards", "NO algorithmic-lead prior: applying a private prior to the planning baseline would destroy the property that makes it useful"],
      falsifiers: ["A published rate card materially below the registered planning vector", "A disclosed occupancy figure far from 50%"],
    },
    deepseek: {
      attribution: "quoted-position",
      who: "A replay of the only disclosed production operating point in the field — DeepSeek, Feb 2025.",
      anchor: { quote: "$87,072/day GPU cost (at $2/H800-hr) against $562,027/day theoretical revenue", url: "https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md" },
      params: { hwMode: { src: "Their stated leasing-cost frame", label: "DISCLOSED" }, rentMult: { src: "$2/hr ÷ current IDC $1.75 = 1.14×", label: "DISCLOSED (assumption in source)" }, util: { src: "100% — disclosed throughputs are averages over deployed nodes; a divisor would double-count idle time", label: "DISCLOSED (derived)" }, stackMult: { src: "Their stack = the calibration baseline", label: "DISCLOSED" }, interact: { src: "Throughput-first production serving", label: "DISCLOSED" }, batchShare: { src: "Not applicable in their billing", label: "DISCLOSED" }, discount: { src: "Theoretical list billing (their own caveat: realized was lower)", label: "DISCLOSED" }, blend: { src: "All-H800 (disclosed)", label: "DISCLOSED" } },
      assumes: ["Their 2025 stack and traffic shape; theoretical list-price billing"],
      falsifiers: ["This is a historical record — it can be extended by newer disclosures, not falsified"],
    },
    xaicash: {
      attribution: "reconstruction",
      who: "The xAI dive's short-run cash lens: hardware is sunk; a GPU-hour costs what it burns.",
      anchor: { quote: "Strict short-run cash marginal: $0.60/GPU-hour (range $0.30–0.90) — power, cooling/fuel, maintenance, networking, and incremental operations after hardware is sunk.", url: "research/xai-gptpro.html" },
      params: { hwMode: { src: "Rental frame carrying the cash rate", label: "SPECULATION" }, rentMult: { src: "$0.60 ÷ the Colossus blend's $3.85 weighted rate = 0.156", label: "SPECULATION" }, util: { src: "Held at the dive's operating point — only the valuation changes across the three xAI lenses", label: "SPECULATION" }, stackMult: { src: "Dive operating point", label: "SPECULATION" }, interact: { src: "Dive operating point", label: "SPECULATION" }, batchShare: { src: "List-price frame", label: "SPECULATION" }, discount: { src: "List-price frame", label: "SPECULATION" }, ioRatio: { src: "The dive's 3:1 uncached workload — held fixed across all three xAI lenses", label: "SPECULATION" }, cacheHit: { src: "Dive workload (uncached)", label: "SPECULATION" } },
      assumes: ["Capital replacement, financing and obsolescence cost nothing (they don't — this is the flattering pole of the three lenses)"],
      falsifiers: ["This lens is definitionally true of spare capacity; the question is how much capacity is genuinely spare"],
    },
    xaiopp: {
      attribution: "reconstruction",
      who: "The market's own valuation of an xAI GPU-hour: the disclosed Anthropic capacity contract.",
      anchor: { quote: "approximately 325,000 GPUs … $1.25B per month — equivalent to $5.27 per GPU-hour (bundled with CPUs, storage, networking).", url: "research/xai-gptpro.html" },
      params: { hwMode: { src: "Rental frame carrying the contract rate", label: "SPECULATION" }, rentMult: { src: "$5.27 ÷ $3.85 blend rate = 1.37", label: "DISCLOSED (rate); SPECULATION (application)" }, util: { src: "Held at the dive's operating point", label: "SPECULATION" }, stackMult: { src: "Dive operating point", label: "SPECULATION" }, interact: { src: "Dive operating point", label: "SPECULATION" }, batchShare: { src: "List-price frame", label: "SPECULATION" }, discount: { src: "List-price frame", label: "SPECULATION" }, ioRatio: { src: "The dive's 3:1 uncached workload — held fixed across all three xAI lenses", label: "SPECULATION" }, cacheHit: { src: "Dive workload (uncached)", label: "SPECULATION" } },
      assumes: ["Every GPU-hour is fungible with contract capacity (it isn't fully — the contract bundles CPUs/storage/network and reserves specific clusters)"],
      falsifiers: ["Contract repricing", "Evidence the Grok fleet cannot be substituted toward contract capacity"],
    },
    chinacloud: {
      attribution: "reconstruction",
      who: "China hyperscaler rate cards, dated July 2026 — the procurement class for buyers without annual commitments.",
      anchor: { quote: "Tencent PNV6 H20 on-demand ¥30.48/card-hour ($4.48) … H800 HCC ¥71.7–72.6/hr ($10.6).", url: "research/chinese-accel-gptpro.html" },
      params: { hwMode: { src: "Rental (public rate cards)", label: "DISCLOSED" }, rentMult: { src: "Grounding-pack computation vs IDC defaults: H20 6.24×, H800 6.07×, 910C-proxy 6.15× (rate cards DISCLOSED; the blend into one multiplier is analytic)", label: "DISCLOSED (rates); SPECULATION (blend)" }, util: { src: "Enterprise on-demand occupancy per the grounding pack (~35%)", label: "SPECULATION" }, stackMult: { src: "OSS baseline", label: "SPECULATION" }, interact: { src: "Balanced", label: "SPECULATION" }, batchShare: { src: "None", label: "SPECULATION" }, discount: { src: "None", label: "SPECULATION" } },
      assumes: ["Rate-card prices are paid prices (enterprise negotiations exist)", "Bundled CPU/network/support roughly cancels across SKUs"],
      falsifiers: ["Published committed-rate cards", "Evidence labs actually procure at these rates"],
    },
    anth20: {
      attribution: "reconstruction",
      who: "A source-informed H20 scenario: the live DeepSeek R1 state computes 649.3 tok/s/GPU; Ant Group's published latency-tier points remain annotations, not reproduced SLOs.",
      anchor: { quote: "714 output tok/s/GPU (<70ms tier); 675 (<50ms); 423 (<30ms).", url: "https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/" },
      params: { hwMode: { src: "Rental at the page's H20 IDC rate", label: "SPECULATION" }, rentMult: { src: "1.0 — Ant's own cost basis is undisclosed", label: "SPECULATION" }, util: { src: "100 = per-occupied-chip convention; Ant's own utilization is undisclosed", label: "SPECULATION (convention)" }, stackMult: { src: "1.0 = the page's source-informed neutral H20 coefficient, not an anchor fit", label: "SPECULATION" }, interact: { src: "Page-authored throughput-mode batch rule; no TTFT/TPOT constraint is enforced", label: "SPECULATION" }, batchShare: { src: "Not applicable", label: "SPECULATION" }, discount: { src: "Not applicable", label: "SPECULATION" }, blend: { src: "H20-only, matching the published accelerator family", label: "DISCLOSED (family only)" } },
      assumes: ["Ant's cost basis ≈ the page's H20 IDC rate (their actual basis is undisclosed)"],
      falsifiers: ["Ant publishing cost or occupancy figures", "Newer tiers replacing these"],
    },
    dive: {
      attribution: "reconstruction",
      who: "Per-model replay of the §10 provider deep dives' central scenarios (GPT-5.6 Pro research runs, 2026-07-09).",
      anchor: { quote: "Every §10 headline regenerates from a named preset within about a point — enforced by the test suite.", url: "research/index.html" },
      params: {},
      assumes: ["Each dive's own procurement lens and workload — these are NOT comparable across providers (see §10)"],
      falsifiers: ["Anything that falsifies the underlying dive (each card lists its own)"],
    },
  },
};
/* ---------- MARGIN_CLAIMS: typed margin-claim registry (v2.1.3 preset redesign, M1) ----------
   Bins CLAIMS, not people — one person can hold several dated claims with different scopes.
   Verbatim strings are EXACT as archived (research/grok-sweep-margin-claims.md incl. its
   2026-07-11 ERRATUM, plus this page's §7 citations); numbers are never paraphrased.
   Fields: id, who, verbatim, url, date, sourceClass, metricScope, boundType, numeric{lo,hi},
   subjectScope, notClaimed, binnable, relation (+ reason on binnable:false records),
   scopeLayer, provenanceTier (+ optional tierSource/tierNote/sweep — 2026-07-12 evidence pass).
   sourceClass: primary-post | quoted-secondary | reporting | model-generated | disclosure-anchor
                | sweep-non-finding.
   boundType:   point | interval | floor | ceiling | conditional-range.
   scopeLayer (2026-07-12 evidence pass) — WHAT PERIMETER the figure describes:
     token-SKU | api-product-line | paid-user-cohort | paid-plus-free-bundle | company-GM
     | segment | analyst-assumption. Null on margin-less records (telemetry/usage/architecture/
     non-finding); "perimeter-undefined" on the Zephyr unnamed-subject row ONLY — its post defines
     no perimeter (see its ERRATUM), and forcing token-SKU or company-GM onto it would regress
     that honesty invariant. Deliberate out-of-enum value, documented here.
   provenanceTier (2026-07-12 evidence pass) — HOW the figure reached this page; drives the
     rendered honesty label via provenanceTierLabel():
     audited | reported-unverified | clip-mediated | analyst-assumption | primary-post
     | aggregator (+ "model-generated" for the zero-claimant-weight scenario row; null on the
     sweep non-finding — an absence has no provenance tier).
   sweep: "2026-07-12" marks rows surfaced by the 2026-07-12 sweeps (X + reputable non-X);
     every such row that is not audited/primary-post renders "surfaced by a 2026-07-12
     reputable-source sweep; not independently re-verified here" (spec labeling rule).
   BUCKET MEMBERSHIP IS COMPUTED — claims store NO bucket lists. claimBucketRelations() derives
   the bucket set and per-bucket relation from the ONE numeric interval + boundType (P0-7 half-
   open edges). Floors NEVER render as interval membership: they relate to every bucket at/above
   their lo as "compatible-with" (P0-2). Claims whose metricScope is not the calculator's unit
   metric carry "different-metric"/"anchor" relations and render in visibly distinct groups;
   sourceClass "model-generated" is its own group with zero claimant weight (P0-8).
   Empty buckets render EMPTY_BUCKET_STATEMENT — never "nobody".

   PROVENANCE GATING (P0-8) — deliberate exclusions from this registry:
   - TeorTaxes "They do have 90% margins" (x.com/teortaxesTex/status/2068833223228924229,
     2026-06-21): EXCLUDED — limited parent context in the sweep; parent unverified.
   - Zephyr "75%-80% GM" forecast (x.com/zephyr_z9/status/2070726279540989971, 2026-06-27):
     EXCLUDED — the sweep's own caveat ("confirm parent if using"); parent thread unconfirmed.
   - rosyprosperity ">90%" post (x.com/rosyprosperity/status/2073086578616836598): OMITTED
     entirely — deferred pending a source-faithfulness/manifest pass (open question Q5). */
const MARGIN_BUCKETS = [ // half-open [lo, hi): the single interval representation (P0-7)
  { id: "b60minus", label: "<60%",   lo: -Infinity, hi: 60 },
  { id: "b6080",    label: "60–80%", lo: 60,        hi: 80 },
  { id: "b8090",    label: "80–90%", lo: 80,        hi: 90 },
  { id: "b90plus",  label: "≥90%",   lo: 90,        hi: Infinity },
];
const EMPTY_BUCKET_STATEMENT = "no qualifying claim in this page's cited corpus lands here";

const MARGIN_CLAIMS = [
  // --- TeorTaxes (@teortaxesTex): several dated claims, binned separately ---
  { id: "teortaxes-9095-conditional", who: "TeorTaxes (@teortaxesTex)",
    verbatim: "No, they'll just increase the batch size, have the same speed, and drive margins from 90% to 95%. You're welcome",
    url: "https://x.com/teortaxesTex/status/2070786814097440805", date: "2026-06-27",
    sourceClass: "primary-post", scopeLayer: "token-SKU", provenanceTier: "primary-post",
    metricScope: "unit-serving-informal", boundType: "conditional-range",
    numeric: { lo: 90, hi: 95 },
    subjectScope: "western providers, CONDITIONAL (if batch size rises at held speed); names no lab",
    notClaimed: "an unconditional Anthropic point value; any parameter of this calculator",
    binnable: true, relation: "conditional-transition" },
  { id: "teortaxes-90plus-floor", who: "TeorTaxes (@teortaxesTex)",
    verbatim: "\"…no, they can't have 90%+ margins? Right? Right?\" THEY CAN.",
    url: "https://x.com/teortaxesTex/status/2071314837771014298", date: "2026-06-28",
    sourceClass: "primary-post", scopeLayer: "token-SKU", provenanceTier: "primary-post",
    metricScope: "unit-serving-informal", boundType: "floor",
    numeric: { lo: 90, hi: null },
    subjectScope: "frontier/western labs (reply context); names no lab",
    notClaimed: "an interval top; any named lab's audited figure",
    binnable: true, relation: "compatible-with" },
  { id: "teortaxes-80-inference-2025", who: "TeorTaxes (@teortaxesTex)",
    verbatim: "if we exclude R&D and look at inference alone, Anthropic and OpenAI are making like 80% margins.",
    url: "https://x.com/teortaxesTex/status/1906521148726100430", date: "2025-03-31",
    sourceClass: "primary-post", scopeLayer: "token-SKU", provenanceTier: "primary-post",
    metricScope: "unit-serving-informal", boundType: "point",
    numeric: { lo: 80, hi: 80 },
    subjectScope: "Anthropic + OpenAI, inference-only, DATED (Mar 2025, pre-V3-disclosure era)",
    notClaimed: "a current-year figure; a defined accounting perimeter",
    binnable: true, relation: "asserts" },
  { id: "teortaxes-4usd-ceiling", who: "TeorTaxes (@teortaxesTex)",
    verbatim: null,
    url: "https://x.com/teortaxesTex/status/2071315379004051513", date: "2026-06-28",
    sourceClass: "primary-post", scopeLayer: "token-SKU", provenanceTier: "primary-post",
    metricScope: "cost-ceiling", boundType: "ceiling",
    numeric: null, subjectScope: "Anthropic serving cost for Opus, token class unspecified",
    notClaimed: "a margin percentage; the token class of the $4 ceiling",
    binnable: false, relation: null,
    reason: "a $/Mtok serving-cost ceiling ('at most $4/1Mt … except maybe at 100% utilization', token class unspecified) — not a margin claim; cannot be placed on a margin axis. No verbatim is stored: the full post carries a slur this page elides by convention, so storing a redacted string in a field named 'verbatim' would mislabel it." },
  // --- Zephyr (@zephyr_z9): the two figures COEXIST and are different objects ---
  { id: "zephyr-9095-unnamed", who: "Zephyr (@zephyr_z9)",
    verbatim: "At least xAI isn't juicing up the gross margins to 90%-95% and scamming consumers Although the cached token could be cheaper",
    url: "https://x.com/zephyr_z9/status/2074917201589727588", date: "2026-07-08",
    sourceClass: "primary-post",
    /* scopeLayer deliberately out-of-enum (documented in the header comment): the post defines no
       perimeter, and assigning token-SKU or company-GM would regress the ERRATUM below. */
    scopeLayer: "perimeter-undefined", provenanceTier: "primary-post",
    metricScope: "ambiguous — the post does not define the margin perimeter (unit vs company)",
    boundType: "interval", numeric: { lo: 90, hi: 95 },
    subjectScope: "unnamed non-xAI providers — the post names xAI only (ERRATUM: no comparison lab is named; 'unit margin' is not the post's wording)",
    notClaimed: "that Anthropic (or any named lab) runs 90–95% unit margins",
    binnable: true, relation: "unnamed-subject" },
  { id: "zephyr-70-company-gm", who: "Zephyr (@zephyr_z9)",
    verbatim: "70% GM and 15%-20% FCF margin Damn Anthropic is printing cash now",
    url: "https://x.com/zephyr_z9/status/2069832997218722140", date: "2026-06-24",
    sourceClass: "primary-post", scopeLayer: "company-GM", provenanceTier: "primary-post",
    metricScope: "company-GM", boundType: "point",
    numeric: { lo: 70, hi: 70 },
    subjectScope: "Anthropic, company-level gross margin",
    notClaimed: "the calculator's unit direct-serving metric",
    binnable: true, relation: "different-metric" },
  // --- Dylan Patel / SemiAnalysis ---
  { id: "patel-80-floor", who: "Dylan Patel (SemiAnalysis) — first-party, via the published Sequoia transcript (formerly clip-mediated)",
    verbatim: "Their margins on an Opus token, at least Opus 4.8 token, is north of 80 percent for the API price. They've got a lot of deals where their total corporate gross margins get clawed down a little bit because of how they do Bedrock deals and Vertex deals and things like that.",
    url: "https://sequoiacap.com/podcast/dylan-patel-of-semianalysis-why-hardware-software-co-design-is-ais-real-100x/", date: "2026-07-01",
    secondaryUrl: "https://x.com/PodcastAlphaX/status/2072119494563262697",
    sourceClass: "primary-post", scopeLayer: "token-SKU", provenanceTier: "first-party-transcript",
    tierSource: "Official Sequoia transcript (fetched 2026-07-24); the earlier clip relay is retained as the secondary link. The clip's doubling-cost gloss is superseded by the transcript's own separate example: \"If I'm running 75 percent gross margin and I double the cost of the compute, it's fine. I'm still running 50 percent gross margin.\"",
    metricScope: "unit-serving-informal", boundType: "floor",
    numeric: { lo: 80, hi: null },
    subjectScope: "Anthropic, Opus 4.8 API token",
    notClaimed: "an interval top — \"north of 80 percent\" is a floor, compatible with 85 and with 95; this page's parameter vector; a published fleet, rate, utilization, traffic mix, or calculation (the Tokenomics model is private)",
    binnable: true, relation: "compatible-with" },
  { id: "semianalysis-api-80-3q26", who: "SemiAnalysis Tokenomics team — first-party 3Q26 Anthropic report (paywalled); figure via the report's public coverage layer",
    verbatim: null,
    reportedFigure: "API-business gross margin above 80% (blended company gross margin mid-60% in the same report)",
    url: "https://newsletter.semianalysis.com/p/anthropic-3q26-profit-over-1b-the", date: "2026-07-08",
    secondaryUrl: "https://app.dealroom.co/news/note/anthropic-on-track-for-1b-quarterly-operating-profit-in-q3-says-semianalysis",
    sourceClass: "quoted-secondary", scopeLayer: "api-product-line", provenanceTier: "first-party-report-paywalled",
    tierSource: "The load-bearing sentence sits behind the report paywall (fetch-verified 2026-07-24); the figure is carried via the report's public coverage layer (Dealroom: \"lifting blended gross margin into the mid-60% range and API gross margin above 80%\").",
    metricScope: "api-product-line-GM", boundType: "floor",
    numeric: { lo: 80, hi: null },
    subjectScope: "Anthropic, API business gross margin (accounting product-line; bottom-up-by-SKU Tokenomics model, private)",
    notClaimed: "a token-SKU unit margin; this page's parameter vector; published workings (the Tokenomics model is private); the blended company figure (mid-60s in the same report — the scope split the huatai row also demonstrates)",
    binnable: true, relation: "different-metric" },
  { id: "wsj-compute-71-56", who: "Wall Street Journal (2026-05-20 report) — via secondary coverage",
    verbatim: null,
    reportedFigure: "computing costs expected to decline from 71 cents to 56 cents for every dollar of revenue (Q1 → Q2 2026)",
    url: "https://www.pymnts.com/artificial-intelligence-2/2026/anthropic-on-track-for-first-operating-profit-as-revenue-surges/", date: "2026-05-20",
    sourceClass: "reporting", scopeLayer: "company-GM", provenanceTier: "aggregator",
    metricScope: "company-compute-ratio", boundType: null, numeric: null,
    subjectScope: "Anthropic, company compute-cost per revenue dollar (reported expectation)",
    notClaimed: "any margin figure at any scope — a cost-ratio calibration datum",
    binnable: false, reason: "compute-cost-per-revenue-dollar ratio (71¢ → 56¢), not a margin claim at any scope — carried as calibration context for the final-answer surface",
    relation: null },
  { id: "semianalysis-neg94-2024", who: "SemiAnalysis (@SemiAnalysis_)",
    verbatim: "Anthropic's gross margins were -94% in 2024. MiniMax was -25%.",
    url: "https://x.com/SemiAnalysis_/status/2037575752636301499", date: "2026-03-27",
    sourceClass: "primary-post", scopeLayer: "company-GM", provenanceTier: "primary-post",
    metricScope: "company-GM", boundType: "point",
    numeric: { lo: -94, hi: -94 },
    subjectScope: "Anthropic, 2024 company accounting gross margin (historical)",
    notClaimed: "anything about the current unit direct-serving metric",
    binnable: true, relation: "different-metric" },
  { id: "semianalysis-60-blend", who: "SemiAnalysis (@SemiAnalysis_)",
    verbatim: "we think Inference Provider Gross Margins should blend to ~60%.",
    url: "https://x.com/SemiAnalysis_/status/2037575752636301499", date: "2026-03-27",
    sourceClass: "primary-post", scopeLayer: "company-GM", provenanceTier: "primary-post",
    metricScope: "company-GM", boundType: "point",
    numeric: { lo: 60, hi: 60 },
    subjectScope: "industry blended inference-provider gross margin (their forecast, same thread also states labs using the interactivity lever \"operate at 60%+ margins\")",
    notClaimed: "an Anthropic-specific unit figure",
    binnable: true, relation: "different-metric" },
  // --- Reported / accounting figures (different object from the calculator metric) ---
  { id: "fleetingbits-4050-reported", who: "fleetingbits (@fleetingbits)",
    verbatim: "we know approximately what frontier lab inference margins are; it's like 40-50%; it's been reported a bunch of times. anthropic labels cloud provider commissions as a sales and marketing expense; so the gross margins are mostly inference compute costs",
    url: "https://x.com/fleetingbits/status/2073528885149679622", date: "2026-07-04",
    sourceClass: "primary-post", scopeLayer: "company-GM", provenanceTier: "primary-post",
    metricScope: "reported-accounting", boundType: "interval",
    numeric: { lo: 40, hi: 50 },
    subjectScope: "frontier labs generally — a reported/accounting frame (\"been reported\")",
    notClaimed: "a unit direct-serving measurement of his own; any procurement/utilization mechanism; this calculator's metric definition",
    binnable: true, relation: "different-metric" },
  { id: "theinformation-40-projection", who: "The Information (reporting)",
    // No verbatim exists in this page's cited corpus (the primary article is paywalled); quoting
    // the relay post under The Information's name would be a mis-attribution. Figure as reported
    // in §7: 2025 gross-margin projection lowered to 40%; inference costs 23% higher than
    // anticipated. Paraphrase is banned from the verbatim field, so it stays null.
    verbatim: null,
    reportedFigure: "2025 gross-margin projection lowered to 40% (inference costs on Google/Amazon servers ran 23% higher than anticipated)",
    url: "https://www.theinformation.com/articles/anthropic-lowers-profit-margin-projection-revenue-skyrockets", date: "2026-01",
    sourceClass: "reporting", scopeLayer: "company-GM", provenanceTier: "reported-unverified",
    tierSource: "The Information",
    metricScope: "company-GM", boundType: "point",
    numeric: { lo: 40, hi: 40 },
    subjectScope: "Anthropic, 2025 company gross-margin projection (reported from people with knowledge of its financials)",
    notClaimed: "the calculator's unit direct-serving metric",
    binnable: true, relation: "different-metric" },
  { id: "pitchbook-44-estimate", who: "PitchBook/Morningstar (estimate)",
    // Same rule as above: no in-corpus verbatim; the §7-cited figures are carried as reported.
    verbatim: null,
    reportedFigure: "gross margin ≈ 44%; compute spend $0.71 per revenue dollar in Q1 2026 (projected $0.56 in Q2)",
    url: "https://pitchbook.com/news/articles/anthropics-gross-margin-ipo", date: "2026-06",
    sourceClass: "reporting", scopeLayer: "company-GM", provenanceTier: "reported-unverified",
    tierSource: "PitchBook/Morningstar",
    metricScope: "company-GM", boundType: "point",
    numeric: { lo: 44, hi: 44 },
    subjectScope: "Anthropic, company gross-margin estimate tied to projected compute spend",
    notClaimed: "the calculator's unit direct-serving metric",
    binnable: true, relation: "different-metric" },
  // --- Disclosure anchor (a provider's own serving, not anyone's Anthropic expectation) ---
  { id: "deepseek-845-disclosure", who: "DeepSeek (@deepseek_ai) — provider disclosure",
    verbatim: "Day 6 of #OpenSourceWeek… 73.7k/14.8k input/output tokens per second per H800 node… Cost profit margin 545%",
    url: "https://x.com/deepseek_ai/status/1895688300574462431", date: "2025-03-01",
    sourceClass: "disclosure-anchor", scopeLayer: "token-SKU", provenanceTier: "primary-post",
    metricScope: "disclosure", boundType: "point",
    numeric: { lo: 84.5, hi: 84.5 },
    subjectScope: "DeepSeek's OWN 2025 V3/R1 serving, theoretical at R1 list prices — 84.5% is the margin arithmetic of the disclosed 545% cost-profit ratio",
    notClaimed: "anything about Anthropic or western providers",
    binnable: true, relation: "anchor" },
  /* ==== 2026-07-12 evidence pass: curated ADD set (owner-approved spec) ====================
     Six non-X reported figures (verbatim:null + reportedFigure — figures reported in articles/
     filings, not archived quotes) and eight X records transcribed character-for-character from
     the archived 2026-07-12 X sweep (grok-x-results2). Every row carries scopeLayer +
     provenanceTier; rows marked sweep:"2026-07-12" that are not audited/primary-post render the
     not-independently-re-verified disclaimer. Bucket membership stays COMPUTED from numeric via
     claimBucketRelations — the ~70–75% cluster below is what populates the previously
     unit-claimant-empty 60–80% range. */
  // --- Non-X reported figures (GPT Pro + council sweeps; reportedFigure, verbatim:null) ---
  { id: "zhipu-api-189-audited", who: "Zhipu / Z.ai (Knowledge Atlas Technology, HKEX-listed)",
    verbatim: null,
    reportedFigure: "Open Platform / API gross margin 18.9% (FY2025, up from 3.3% in 2024)",
    url: "audited HKEX FY2025 annual results, filed 2026-03-31", date: "2026-03-31",
    sourceClass: "disclosure-anchor", scopeLayer: "api-product-line", provenanceTier: "audited",
    sweep: "2026-07-12",
    metricScope: "api-product-line-GM (audited)", boundType: "point",
    numeric: { lo: 18.9, hi: 18.9 },
    subjectScope: "Zhipu API/Open-Platform product line (includes MaaS + programming subscriptions), FY2025",
    notClaimed: "a unit token-serving margin; this calculator's unit direct-serving metric",
    binnable: true, relation: "different-metric" },
  { id: "zhipu-group-41-audited", who: "Zhipu / Z.ai (Knowledge Atlas Technology, HKEX-listed)",
    verbatim: null,
    reportedFigure: "group gross margin 41.0% FY2025 (enterprise agents 52.3%, general-purpose 47.0%)",
    url: "audited HKEX FY2025 annual results, filed 2026-03-31", date: "2026-03-31",
    sourceClass: "disclosure-anchor", scopeLayer: "company-GM", provenanceTier: "audited",
    sweep: "2026-07-12",
    metricScope: "company-GM (audited)", boundType: "point",
    numeric: { lo: 41, hi: 41 },
    subjectScope: "Zhipu group-level gross margin FY2025 (segment splits as filed)",
    notClaimed: "anything about unit token serving",
    binnable: true, relation: "different-metric" },
  { id: "openai-70-compute-cohort", who: "OpenAI (internal figure)",
    verbatim: null,
    reportedFigure: "compute margin on paying users ~70% as of Oct 2025 (up from ~52% end-2024, ~35% Jan 2024); revenue share after cost of running models for paying corporate+consumer users, excludes free-user inference",
    url: "The Information (via Bloomberg/Fortune, 2025-12-21)", date: "2025-12-21",
    sourceClass: "reporting", scopeLayer: "paid-user-cohort", provenanceTier: "reported-unverified",
    tierSource: "The Information (via Bloomberg/Fortune)", sweep: "2026-07-12",
    metricScope: "paid-user-cohort-compute-margin", boundType: "point",
    numeric: { lo: 70, hi: 70 },
    subjectScope: "OpenAI paid-user compute margin (NOT API token margin, NOT company GM), Oct 2025",
    notClaimed: "the calculator's unit direct-serving metric; free-user inference (excluded by the reported definition)",
    binnable: true, relation: "different-metric" },
  { id: "anthropic-2944-compute-proxy", who: "Anthropic (fundraising projections)",
    verbatim: null,
    reportedFigure: "$0.71 computing-power per $1 revenue Q1 2026 (=>29%); projected $0.56 Q2 2026 (=>44%)",
    url: "WSJ, Berber Jin, 2026-05-20", date: "2026-05-20",
    sourceClass: "reporting", scopeLayer: "company-GM", provenanceTier: "reported-unverified",
    tierSource: "WSJ (Berber Jin)", sweep: "2026-07-12",
    metricScope: "company-GM (compute-cost proxy)", boundType: "point",
    numeric: { lo: 29, hi: 44 },
    subjectScope: "Anthropic company-wide compute-cost contribution proxy; 'computing power' not reconciled to inference-only COGS",
    notClaimed: "the calculator's unit direct-serving metric; an inference-only COGS split",
    binnable: true, relation: "different-metric" },
  { id: "epoch-2545-bundle", who: "Epoch AI (Sevilla, Petrovic, Ho)",
    verbatim: null,
    reportedFigure: "~30% median gross margin (90% CI 25-45%) for the GPT-5 bundle (~$6B revenue, ~$4B inference compute; all OpenAI products incl. free users, Aug-Dec 2025)",
    url: "epoch.ai, 'Can AI companies become profitable? Lessons from GPT-5's economics', 2026-01-28", date: "2026-01-28",
    sourceClass: "reporting", scopeLayer: "paid-plus-free-bundle", provenanceTier: "analyst-assumption",
    tierNote: "modeled, public", sweep: "2026-07-12",
    metricScope: "paid-plus-free-bundle-GM (modeled)", boundType: "interval",
    numeric: { lo: 25, hi: 45 },
    subjectScope: "OpenAI paid+free bundle after inference compute (modeled)",
    notClaimed: "a measured figure — a modeled median with a 90% CI (25-45%)",
    binnable: true, relation: "different-metric" },
  { id: "openai-33-company-gm", who: "OpenAI (internal)",
    verbatim: null,
    reportedFigure: "33% adjusted company gross margin FY2025 (also 42% H1 2025 per Reuters Breakingviews; 39% Q1 2026 per The Information/Erin Woo 2026-06-16)",
    url: "The Information / Reuters", date: "2026",
    sourceClass: "reporting", scopeLayer: "company-GM", provenanceTier: "reported-unverified",
    tierSource: "The Information / Reuters", sweep: "2026-07-12",
    metricScope: "company-GM", boundType: "point",
    numeric: { lo: 33, hi: 33 },
    subjectScope: "OpenAI, adjusted company gross margin FY2025 (H1-2025 and Q1-2026 variants as reported)",
    notClaimed: "the calculator's unit direct-serving metric",
    binnable: true, relation: "different-metric" },
  // --- RAISE Summit 2026 (Paris, recorded 2026-07-09, published 2026-07-16) podcast-transcript
  //     records — the first claims sourced through this project's podcast-mining pipeline.
  //     Owner ruling 2026-07-27 (q-im-podcast-candidates): APPROVED with the ANALYST-CHARACTERIZATION
  //     provenanceTier — Patel is characterizing pre-IPO/private financials he says he has reviewed,
  //     not a company disclosure or filing. ---
  { id: "patel-anthropic-first-gp-2626", who: "Dylan Patel (SemiAnalysis) — RAISE Summit 2026 stage remarks",
    verbatim: "Anthropic turned their first gross profit in Q2, in June. And then in Q3 they will be turning a billion dollars of operating profit, slightly over. This is their financials that they're going to be putting out in their IPO — this is real figures, that they've already been able to turn a profit.",
    url: "https://www.youtube.com/watch?v=DJ29xr83sKE&t=53s", date: "2026-07-09",
    sourceClass: "primary-post", scopeLayer: "company-GM", provenanceTier: "analyst-characterization",
    tierNote: "Patel characterizing pre-IPO financials he says he has seen, not a company disclosure — checkable once Anthropic's actual IPO/S-1-equivalent financials are public (owner ruling 2026-07-27, q-im-podcast-candidates)",
    tierSource: "RAISE Summit 2026 (Master Stage, Paris), recorded 2026-07-09; transcribed via this project's podcast-mining pipeline (local faster-whisper large-v3, speaker attribution verified against video framegrabs)", sweep: "2026-07-26",
    metricScope: "company-profit-milestone", boundType: null, numeric: null,
    subjectScope: "Anthropic first GROSS PROFIT in Q2/June 2026, and Q3 2026 OPERATING PROFIT of slightly over $1B — both per pre-IPO financials Patel says will appear in Anthropic's IPO filing",
    notClaimed: "a company disclosure, filing, or the calculator's own unit direct-serving metric; a percentage margin figure",
    binnable: false, relation: null,
    reason: "a profit-milestone / dollar-amount claim (first gross profit; ~$1B Q3 operating profit), not a percentage margin — cannot be placed on a margin-% axis. Upgrades the existing Anthropic reported-margin narrative (§7) from projected/estimated figures (40% projection, 44% PitchBook estimate, ~70% Zephyr read) to a claimed REALIZED-profit data point, carrying the ANALYST-CHARACTERIZATION caveat the owner ruling required." },
  { id: "patel-openai-margin-trajectory-2626", who: "Dylan Patel (SemiAnalysis) — RAISE Summit 2026 stage remarks",
    verbatim: "You look at OpenAI, late last year their margins were roughly 30% gross margin, but if you stripped away the free users they were at 50%. Now their total company gross margin is closer to 55%, and if you strip away the free users they're at about 65%.",
    url: "https://www.youtube.com/watch?v=DJ29xr83sKE&t=99s", date: "2026-07-09",
    sourceClass: "primary-post", scopeLayer: "company-GM", provenanceTier: "analyst-characterization",
    tierNote: "Patel characterizing pre-IPO/private financials he says he has seen, not a company disclosure (owner ruling 2026-07-27, q-im-podcast-candidates)",
    tierSource: "RAISE Summit 2026 (Master Stage, Paris), recorded 2026-07-09; transcribed via this project's podcast-mining pipeline (local faster-whisper large-v3, speaker attribution verified against video framegrabs)", sweep: "2026-07-26",
    metricScope: "company-GM", boundType: "point",
    numeric: { lo: 55, hi: 55 },
    subjectScope: "OpenAI company-wide gross margin trajectory: ~30% (late 2025) -> ~55% (as of this Jul 9 2026 remark); ex-free-user cut ~50% (late 2025) -> ~65% (current). numeric carries the current company-wide point (55); the ex-free-user 65% and the historical 30%/50% starting points are context in subjectScope, not separately binned.",
    notClaimed: "a company disclosure or filing; the calculator's own unit direct-serving metric; identity with the existing openai-33-company-gm record (a different, later, analyst-characterized cut, not a restatement of it)",
    binnable: true, relation: "different-metric" },
  // --- X records: verbatim + URL + date transcribed exactly from the archived 2026-07-12 sweep ---
  { id: "semianalysis-75-api-assumption", who: "SemiAnalysis (@SemiAnalysis_)",
    verbatim: "The margin on a subscription plan is a function of the average utilization. If we assume both companies have 75% API gross margins, this results in the following subscription margins.",
    url: "https://x.com/SemiAnalysis_/status/2064815045767213400", date: "2026-06-10",
    sourceClass: "primary-post", scopeLayer: "analyst-assumption", provenanceTier: "analyst-assumption",
    sweep: "2026-07-12",
    metricScope: "api-GM-assumption", boundType: "point",
    numeric: { lo: 75, hi: 75 },
    subjectScope: "OpenAI+Anthropic API GM, modeling assumption to back out subscription margins",
    notClaimed: "a measured margin — an explicit modeling input, not a leak or disclosure",
    binnable: true, relation: "different-metric" },
  { id: "alderson-90-unit", who: "Martin Alderson (@martinald)",
    verbatim: "As someone that has got so much flak off people for estimating frontier AI labs gross margin inference % at ~90% for the past ~year it is good to see @SemiAnalysis_ agreeing",
    url: "https://x.com/martinald/status/2074846343986606435", date: "2026-07-08",
    sourceClass: "primary-post", scopeLayer: "token-SKU", provenanceTier: "primary-post",
    metricScope: "unit-serving-informal", boundType: "point",
    numeric: { lo: 90, hi: 90 },
    subjectScope: "frontier labs generically, unit inference GM, claims multi-year",
    notClaimed: "primary leak access; the sweep notes SemiAnalysis's own public numbers cluster 60-75%, not 90%",
    binnable: true, relation: "asserts" },
  { id: "baker-85-clip", who: "Gavin Baker (Atreides) — via the All-In show's own published clip (E278); he attributes the figure to reports",
    verbatim: "It's probably not going to trade at 10 times that number, and it will be very profitable at that scale because it'll be inference-dominated and people are reporting they have 85% gross margins on inference.",
    url: "https://x.com/theallinpod/status/2071569672890180059", date: "2026-06-29 (All-In E278; recorded ~2026-06-27–28)",
    secondaryUrl: "https://x.com/n01man/status/2071177551729320276",
    sourceClass: "quoted-secondary", scopeLayer: "api-product-line", provenanceTier: "show-primary-clip",
    tierSource: "The All-In show's own account published the recorded clip (fetched 2026-07-24); supersedes the recap-account relay (retained as the secondary link). Scope re-labeled: the figure reads as an inference product-line estimate inside a forward-profitability argument, and the speaker RELAYS reports (\"people are reporting\"), not his own estimate.",
    sweep: "2026-07-12",
    metricScope: "api-product-line-GM (informal; relayed reports)", boundType: "point",
    numeric: { lo: 85, hi: 85 },
    subjectScope: "Anthropic inference gross margins — relayed reports inside a 2028-scale profitability argument (All-In E278)",
    notClaimed: "the speaker's own estimate (he attributes the figure to reports); a cost model behind the figure; a token-SKU operating point",
    binnable: true, relation: "asserts" },
  { id: "kimmonismus-70-relay", who: "@kimmonismus (Chubby) — relays The Information's 70% figure",
    verbatim: "OpenAI’s compute margin on paying users reportedly hit ~70% in October (up from ~52% at end-2024 and ~35% in Jan 2024), driven by cheaper rented compute, inference efficiency tweaks, and a higher-priced subscription tier.",
    url: "https://x.com/kimmonismus/status/2002804268584382720", date: "2025-12-21",
    sourceClass: "quoted-secondary", scopeLayer: "paid-user-cohort", provenanceTier: "aggregator",
    sweep: "2026-07-12",
    metricScope: "paid-user-cohort-compute-margin (relayed)", boundType: "point",
    numeric: { lo: 70, hi: 70 },
    subjectScope: "OpenAI paid-user compute margin — X-side corroboration of the companion reported row (also restated by @StockSavvyShay and by @NathanFlurry citing Fortune)",
    notClaimed: "an independent measurement — relays The Information's reported figure",
    binnable: true, relation: "different-metric" },
  { id: "anthropic-3870-infra", who: "SemiAnalysis (newsletter)",
    // PROVENANCE UPGRADED 2026-07-13: the margin sentence sits in the newsletter's FREE portion;
    // fetched directly and archived (research/semianalysis-ai-value-capture-2026-05-01.md), so the
    // former X-relay carriage (verbatim: null per the mis-attribution rule) is superseded.
    verbatim: "This year Anthropic’s ARR has exploded from $9B to over $44B today, their gross margins on their inference infrastructure have increased from 38% to over 70% over the same period.",
    url: "https://newsletter.semianalysis.com/p/ai-value-capture-the-shift-to-model", date: "2026-05-01",
    sourceClass: "primary-post", scopeLayer: "api-product-line", provenanceTier: "primary-post",
    tierSource: "SemiAnalysis newsletter, fetched directly 2026-07-13 (free portion); excerpt archived research/semianalysis-ai-value-capture-2026-05-01.md. Previously via X relays (@kimmonismus, @NathanFlurry, @crepesupreme).", sweep: "2026-07-12",
    metricScope: "api-product-line-GM (inference infrastructure)", boundType: "floor",
    numeric: { lo: 70, hi: null }, // "over 70%" is the CURRENT state = a floor; the 38% is the historical start of the transition, not a bucket bound
    subjectScope: "Anthropic inference-infrastructure GM, 38% -> >70% across 2026 YTD ('this year', same period as ARR $9B -> $44B+); same piece restates industry-wide: 'inference margins have gone up from < 40% to > 70% in the same time frame'",
    notClaimed: "an audited figure — SemiAnalysis's own estimate (Tokenomics-model basis), not a unit token-serving margin",
    binnable: true, relation: "different-metric" },
  { id: "todd-50-company-gm", who: "Benjamin Todd (80,000 Hours)",
    verbatim: "…while the gross margin is ~50%, the operating margin is likely negative.",
    url: "https://x.com/ben_j_todd/status/2016823336936902941", date: "2026-01-29",
    sourceClass: "primary-post", scopeLayer: "company-GM", provenanceTier: "primary-post",
    metricScope: "company-GM", boundType: "point",
    numeric: { lo: 50, hi: 50 },
    subjectScope: "OpenAI company gross margin ~50% (operating margin negative); separately recalls Altman ~50% inference (secondhand)",
    notClaimed: "a primary Altman source for the separate ~50% inference recall (his own caveat: memory, not a linked primary)",
    binnable: true, relation: "different-metric" },
  // The Huatai summary reports THREE distinct figures; each is a separate claim (a single numeric
  // interval would fabricate bucket membership the source never stated). Same source quote on each;
  // the explicit company-vs-API split IS the value — the conflation-discipline example.
  { id: "huatai-openai-40-company", who: "Huatai Computer research (relayed @daofoshuangxiu)",
    verbatim: "Anthropic 当前混合毛利率在 60%左右，API 毛利率超过 80%。OpenAI 毛利率更低（40%左右）…",
    url: "https://x.com/daofoshuangxiu/status/2075575618717327857", date: "2026-07-10",
    sourceClass: "quoted-secondary", scopeLayer: "company-GM", provenanceTier: "aggregator",
    sweep: "2026-07-12",
    metricScope: "company-GM", boundType: "point", numeric: { lo: 40, hi: 40 },
    subjectScope: "OpenAI company gross margin ~40% (one of three figures in the quoted Huatai summary)",
    notClaimed: "an independent measurement — a finance-account summary of Huatai Computer research",
    binnable: true, relation: "different-metric" },
  { id: "huatai-anthropic-mixed-60-company", who: "Huatai Computer research (relayed @daofoshuangxiu)",
    verbatim: "Anthropic 当前混合毛利率在 60%左右，API 毛利率超过 80%。OpenAI 毛利率更低（40%左右）…",
    url: "https://x.com/daofoshuangxiu/status/2075575618717327857", date: "2026-07-10",
    sourceClass: "quoted-secondary", scopeLayer: "company-GM", provenanceTier: "aggregator",
    sweep: "2026-07-12",
    metricScope: "company-GM (mixed/blended)", boundType: "point", numeric: { lo: 60, hi: 60 },
    subjectScope: "Anthropic mixed/blended company gross margin ~60% (Huatai summary; explicitly distinct from the API figure in the same source)",
    notClaimed: "a unit-serving margin — the blended company figure, paired here with the API >80% figure",
    binnable: true, relation: "different-metric" },
  { id: "huatai-anthropic-api-80floor", who: "Huatai Computer research (relayed @daofoshuangxiu)",
    verbatim: "Anthropic 当前混合毛利率在 60%左右，API 毛利率超过 80%。OpenAI 毛利率更低（40%左右）…",
    url: "https://x.com/daofoshuangxiu/status/2075575618717327857", date: "2026-07-10",
    sourceClass: "quoted-secondary", scopeLayer: "api-product-line", provenanceTier: "aggregator",
    sweep: "2026-07-12",
    metricScope: "api-product-line-GM", boundType: "floor", numeric: { lo: 80, hi: null },
    subjectScope: "Anthropic API gross margin >80% (Huatai summary) — a floor, paired with the mixed ~60% company figure to show the split",
    notClaimed: "an independent measurement; '>80%' is a floor (compatible with 80-90% and higher), not a point",
    binnable: true, relation: "different-metric" },
  { id: "ritulmishr-4060-token", who: "@ritulmishr (low-follower, flagged)",
    verbatim: "zai runs 40–60% gross margin on the official GLM-5.2 endpoint at token level… at ~$1.70–$2.20 blended… still net at least ~40% gross.",
    url: "https://x.com/ritulmishr/status/2076191045562544519", date: "2026-07-12",
    sourceClass: "primary-post", scopeLayer: "token-SKU", provenanceTier: "primary-post",
    tierNote: "low-follower account, flagged; not independently verified",
    metricScope: "unit-serving-informal", boundType: "interval",
    numeric: { lo: 40, hi: 60 },
    subjectScope: "Zhipu/z.ai GLM-5.2 official endpoint, unit token GM — a rare China first-party unit estimate",
    notClaimed: "independent verification; low-follower account",
    binnable: true, relation: "asserts" },
  // --- 2026-07-15 weekly update (Q-001): The Information's DeepSeek V4 API margin report ---
  { id: "theinformation-7080-deepseek-v4", who: "The Information (reporting)",
    verbatim: null,
    reportedFigure: "DeepSeek V4 API gross margin 70–80% (an update to an earlier reported '>50%' figure); annualized revenue nearing $500M, raising ~¥50B (~$7.4B) at a ~¥500B (~$74B) valuation with STAR Market IPO prep",
    url: "https://www.theinformation.com/articles/deepseeks-annualized-revenue-nears-500-million-boosting-fundraise-ipo-plans", date: "2026-07-14/15",
    sourceClass: "reporting", scopeLayer: "api-product-line", provenanceTier: "reported-unverified",
    tierSource: "The Information (relayed by @jukan05/@jingyanghk); a same-cluster GPT-5.6 Pro consult independently rates the figure 'medium-low' confidence — no accounting definition or company confirmation is public (research/gptpro-reports/recovered-deepseek-dive-2026-07-15.md, not part of the published annex)",
    metricScope: "api-product-line-GM (reported)", boundType: "interval",
    numeric: { lo: 70, hi: 80 },
    subjectScope: "DeepSeek V4 API gross margin, press-reported Jul 2026 (The Information, via relays) — the first press-reported post-V4 API-margin datapoint identified in this research (not company-confirmed, no disclosed accounting definition), upgrading the evidence quality of this range beyond community backsolves",
    notClaimed: "an audited or company-confirmed figure; this calculator's unit direct-serving contribution-margin metric; consumer-app revenue (the ARR figure and the TeorTaxes fleet backsolves it prompted are paid-API-only in scope, per TeorTaxes's own caveat)",
    binnable: true, relation: "different-metric" },
  // --- Model-generated scenario analysis: its own group, ZERO claimant weight (P0-8/Q9) ---
  { id: "gptpro-9296-model-generated", who: "GPT-5.6 Pro consult (model-generated scenario analysis — not a person's claim)",
    verbatim: "approximately 92–94% for Opus and 94–96% for Sonnet on a mature 2026 fleet.",
    url: "research/anthropic-gptpro.html", date: "2026-07-09",
    sourceClass: "model-generated", scopeLayer: "token-SKU", provenanceTier: "model-generated",
    metricScope: "unit-serving-informal", boundType: "interval",
    numeric: { lo: 92, hi: 94 },
    subjectScope: "Claude Opus (92–94) on a modeled mature 2026 fleet — the Sonnet 94–96 leg is a DIFFERENT model, split out of the flagship-binnable comparison (registry edit 2026-07-24)",
    notClaimed: "human endorsement — model-generated analysis with zero claimant weight, rendered only in its own provenance-labeled group",
    binnable: true, relation: "locates-within" },
  // --- Blinded model-generated cross-check (2026-07-15): a from-scratch bottom-up estimate built
  //     under an explicit instruction not to consult this site/repo; disclosed blind held. Its
  //     own metric definition ("unit serving margin") is deliberately the same object this
  //     calculator computes. A robustness comparison, NOT an independent empirical measurement or
  //     a matched-estimand validation (same model family, different basket/workload); zero
  //     claimant weight, rendered only in its own model-generated group. ---
  { id: "gptpro-blinded-replication-733", who: "GPT-5.6 Pro consult (blinded model-generated cross-check — not a person's claim)",
    verbatim: "about $0.73 of each list-price revenue dollar survives the steady-state marginal cost of serving frontier-model tokens",
    url: "research/dive-replication-blinded.html", date: "2026-07-15",
    sourceClass: "model-generated", scopeLayer: "token-SKU", provenanceTier: "model-generated",
    metricScope: "unit-serving-informal", boundType: "interval",
    numeric: { lo: 47, hi: 89 },
    subjectScope: "equal-dollar basket of GPT-5.5 / Gemini 3.1 Pro / DeepSeek V4 Pro on a 4M-in/1M-out workload, built bottom-up from public anchors only — central 73.3% (cross-model median 71.8%; per-model GPT-5.5 96.2%, Gemini 3.1 Pro 71.8%, DeepSeek V4 Pro 52.0%); modeled scenario range 47–89%",
    notClaimed: "human endorsement — model-generated analysis with zero claimant weight; identity with this page's own metric or numbers (independent construction, different model basket and workload; disclosed at the end that it never encountered or opened margins.ashitaorbis.com or its repository in its search results)",
    binnable: true, relation: "locates-within" },
  // --- binnable:false records: present PRECISELY so tests can assert they never render as
  //     claimants in any margin range (P0-8; recon §2). ---
  { id: "xjdr-deployment", who: "@_xjdr (ncode/Noumena)",
    verbatim: "final GLM 5.2 served stats: ~12000 unique api keys served ~300B tokens total 232 tok/s/gpu output average 431 tok/s/gpu output max sustained 2.1 sec TTFT overage [sic] (1M ctx) 61 sec p95 TTFT (1M ctx) 81k tok average input size 41% cache hit rate 0 chat logs kept (dont be evil)",
    url: "https://x.com/_xjdr/status/2071835604095300079", date: "2026-06-30",
    sourceClass: "primary-post", scopeLayer: null, provenanceTier: "primary-post",
    metricScope: "deployment-telemetry", boundType: null, numeric: null,
    subjectScope: "one GLM 5.2 deployment week", notClaimed: "any margin figure; any I/O split (the 8:1 is site-authored)",
    binnable: false, relation: null,
    reason: "deployment telemetry; no margin claim exists in the cited corpus — never binnable into any margin range. The '[sic]' after 'overage' is an editorial annotation of the source's original wording (a prior version silently normalized it to 'average'; v2.1.1 addendum-2 restored 'overage [sic]'), not an alteration of the quote." },
  { id: "ksred-usage", who: "ksred",
    verbatim: null,
    url: "https://www.ksred.com/claude-code-pricing-guide-which-plan-actually-saves-you-money/", date: null,
    sourceClass: "primary-post", scopeLayer: null, provenanceTier: "primary-post",
    metricScope: "subscription-usage", boundType: null, numeric: null,
    subjectScope: "one user's longitudinal Claude Code subscription record (~10B tokens over 8 months; ~$15,000 at API list vs ~$800 of Max fees)",
    notClaimed: "any margin figure",
    binnable: false, relation: null,
    reason: "longitudinal subscription-usage record — no margin claim; §8's own framing: tail, not distribution" },
  { id: "jukan-no-claim", who: "Jukan (@jukan05)",
    verbatim: null,
    url: "research/grok-sweep-margin-claims.html", date: "2026-07-09",
    sourceClass: "sweep-non-finding", scopeLayer: null, provenanceTier: null,
    metricScope: null, boundType: null, numeric: null,
    subjectScope: "GPU/memory/cluster economics and compute-leasing posts only",
    notClaimed: "any frontier-lab inference-margin figure",
    binnable: false, relation: null,
    reason: "NO VERBATIM SOURCE — the 2026-07-09 sweep found no @jukan05 post claiming Anthropic or frontier-lab inference margins; deliberately removed from §1 in v2.1.1 (owner call); do not bin, ever" },
  { id: "musk-sizes", who: "Elon Musk (@elonmusk)",
    verbatim: "0.5T total. Current Grok is half the size of Sonnet and 1/10th the size of Opus. Very strong model for its size.",
    url: "https://x.com/elonmusk/status/2042123561666855235", date: "2026-04-09",
    sourceClass: "primary-post", scopeLayer: null, provenanceTier: "primary-post",
    metricScope: "architecture", boundType: null, numeric: null,
    subjectScope: "model sizes (Grok vs Sonnet vs Opus)", notClaimed: "any margin figure; any cost-to-serve figure",
    binnable: false, relation: null,
    reason: "model-size statement only — never a margin claimant; read as LIKELY referring to the 4.6-era lineup (owner-adjudicated planning interpretation 2026-07-24; the referent is unverified — 4.6 is believed larger than 4.7/4.8)" },
];

/* Interval algebra (P0-7): buckets are half-open [lo, hi); a claim's numeric interval is closed
   [lo, hi] as stated by its source. Membership = nonempty intersection, EXCEPT floors (hi null /
   boundType "floor"), which relate to every bucket at/above their lo as "compatible-with" and
   NEVER as interval membership (P0-2). Returns [{ bucketId, relation }]. */
/* R3 (design memo D-2e): the ONE half-open membership algebra — extracted so the
   authored-range integrity predicate SHARES it with bucketForMargin (family 35's
   shared-predicate rule: one algebra, never a reimplementation; ±Infinity open ends
   make the single comparison correct for floor/ceiling/interval classes alike). */
function inHalfOpenRange(lo, hi, v) { return v >= lo && v < hi; }
function bucketForMargin(marginPct) {
  return MARGIN_BUCKETS.find(b => inHalfOpenRange(b.lo, b.hi, marginPct)) || null;
}
/* R3 (D-2e): authored-range integrity. `authoredRange` is FIXED metadata — what the
   exploration route was WRITTEN to demonstrate — and the integrity disclosure (the
   hero note's range NOUN and the inside/OUTSIDE boolean) anchors HERE, never to the
   computed bucket (which remains board-grouping truth only: where the route LANDS). */
function withinAuthoredRange(p, marginPct) {
  if (!p || !p.authoredRange || !isFinite(marginPct)) return null;
  return inHalfOpenRange(p.authoredRange.lo, p.authoredRange.hi, marginPct);
}
function authoredRangeLabel(p) {
  if (!p || !p.authoredRange) return null;
  const match = MARGIN_BUCKETS.find(b => b.lo === p.authoredRange.lo && b.hi === p.authoredRange.hi);
  if (match) return match.label;
  const fmtEnd = v => v === Infinity ? "∞" : v === -Infinity ? "−∞" : String(v);
  return fmtEnd(p.authoredRange.lo) + "–" + fmtEnd(p.authoredRange.hi) + "%";
}
function claimBucketRelations(claim) {
  if (!claim || !claim.binnable || !claim.numeric || typeof claim.numeric.lo !== "number") return [];
  const { lo, hi } = claim.numeric;
  if (claim.boundType === "floor" || hi === null || hi === undefined)
    return MARGIN_BUCKETS.filter(b => b.hi > lo).map(b => ({ bucketId: b.id, relation: "compatible-with" }));
  return MARGIN_BUCKETS.filter(b => lo < b.hi && hi >= b.lo).map(b => ({ bucketId: b.id, relation: claim.relation }));
}
function claimsForBucket(bucketId) {
  return MARGIN_CLAIMS
    .map(c => ({ claim: c, rel: claimBucketRelations(c).find(r => r.bucketId === bucketId) }))
    .filter(x => x.rel)
    .map(x => ({ claim: x.claim, relation: x.rel.relation }));
}

/* ---------- provenance-tier honesty labels (2026-07-12 evidence pass) ----------
   Rendered on every claim row so no reader mistakes a relayed/assumed/clip-mediated figure for a
   measured primary. Templates follow the curated-spec labeling rules verbatim; rows carrying
   sweep:"2026-07-12" that are not audited/primary-post additionally carry the
   not-independently-re-verified disclaimer. */
const SWEEP_DISCLAIMER = "surfaced by a 2026-07-12 reputable-source sweep; not independently re-verified here";
function provenanceTierLabel(c) {
  if (!c || !c.provenanceTier) return "";
  const note = c.tierNote ? " (" + c.tierNote + ")" : "";
  const sweep = c.sweep ? " — " + SWEEP_DISCLAIMER : "";
  switch (c.provenanceTier) {
    case "audited":
      return "Audited filing (" + SWEEP_DISCLAIMER + ")" + note;
    case "reported-unverified":
      return "Reported figure — " + (c.tierSource || c.who)
        + (c.sweep ? "; surfaced by a 2026-07-12 sweep, not independently re-verified here" : "") + note;
    case "clip-mediated":
      return "Quoted via a clip/recap account, not the speaker's own post" + note + sweep;
    case "analyst-assumption":
      return "Analyst modeling assumption, not a measured or disclosed figure" + note + sweep;
    case "aggregator":
      return "Relayed by an aggregator; tracks the cited primary, not an independent measurement" + note + sweep;
    case "primary-post":
      return "Primary post — the claimant's own account" + note;
    case "model-generated":
      return "Model-generated scenario analysis, not a person's claim — zero claimant weight" + note;
    default:
      return String(c.provenanceTier) + note + sweep;
  }
}

/* Negative findings (2026-07-12 evidence pass) — rendered as a statement on the evidence board,
   NOT as claim rows (an absence is not a claim record). Text per the curated spec. */
const NEGATIVE_FINDINGS_STATEMENT = "No credible public NUMERIC unit-serving margin was found for Google/Gemini, xAI/Grok, or Moonshot/Kimi in the 2026-07-12 sweeps (X + reputable non-X). This absence appears real, not a search failure — these labs disclose prices, architecture, or cost-reductions, but no realized serving margin.";

/* ---------- exploration-config ranking + flagship-scope membership (M2) ---------- */
/* row 499: `rentMultLeg` is a PROCUREMENT-POSTURE key like `rentMult`, so it belongs to
   perspective space — moving it must exit a config's identity exactly as moving the global
   multiplier does (P0-5), and a preset that carries one must declare it. */
/* im-arc T2 (memo §6, 2026-08-22): kwh joins perspective space only so an
   archived owned-TCO route can state its historical electricity pin explicitly. */
/* im-arc T4 fold (2026-08-24), memo §6 [F10]: the four keys an archived reading needs to state
   its pre-fold bundle join the space so a route can DECLARE them at all — the same reason T2 had
   to add `kwh`. They are migration metadata, and `changedFieldsFromCentral` excludes every one of
   them from the route ranking below for exactly that reason. */
const PERSPECTIVE_SPACE_KEYS = ["hwMode", "kwh", "dcPerW", "dcLifeYears", "capexScopeMode", "capexAbsLeg", "rentRegistryPin", "capitalRecovery", "rentMult", "rentMultLeg", "rentMultFam", "rentAbsAll", "rentAbsLeg", "dialRanges", "util", "stackMult", "interact", "batchShare", "discount", "blend"];
// P0-7: the ONLY sanctioned ordering label. No other basis language may describe this ranking.
const EXPLORATION_ORDER_BASIS = "fewest changed registry fields from the central configuration";
function changedFieldsFromCentral(p) {
  const central = PERSPECTIVES.find(x => x.id === "median").set;
  /* im-arc T2 (memo §6): the historical electricity pin preserves the route; it is migration
     metadata, not another authored lever in the route ranking.
     im-arc T4 fold (2026-08-24, memo §6 [F10]): the same is true of the four further pin keys the
     T4 bundle needs. A route that had to state six migration values to keep reproducing must not
     thereby rank as a six-lever route — the ranking is about what its AUTHOR changed. */
  /* Which of a route's own `set` keys are migration metadata is DECLARED BY THE ROUTE, in
     `migrationPins`, not guessed from a global key list: `rentAbsLeg` is a genuine authored lever
     for a route that states a reader price, and a global exclusion would hide it. A route that
     declares nothing here is ranked on every key it sets, exactly as before. */
  const pinned = new Set(p.migrationPins || []);
  return PERSPECTIVE_SPACE_KEYS.filter(k =>
    !pinned.has(k)
    && JSON.stringify(p.set[k] ?? DEFAULTS[k]) !== JSON.stringify(central[k] ?? DEFAULTS[k])).length;
}
function rankExplorations(list) {
  const pool = list || PERSPECTIVES.filter(p => p.kind === "exploration");
  return [...pool].sort((a, b) =>
    (changedFieldsFromCentral(a) - changedFieldsFromCentral(b)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
/* Range membership is DEFINED at the flagship scope — Claude Opus 4.x at the explicit
   Reference 15:1/60% traffic profile — and computed, never hand-set (M2). At any other
   model/traffic the UI recomputes live and shows drift; configs are never hidden on drift. */
const FLAGSHIP_SCOPE = { modelId: "opus", traffic: { mode: "explicit", profileId: "reference" } };
// IM3 exit-gate fix 1 (unanimous, empiricist enumeration): every flagship-scope numeric emitter
// needs the fleetRenderable condition welded alongside the margin, not just the margin. Exposed
// as a separate function (explorationFlagshipMargin's own signature — a bare number — stays
// unchanged; it is pinned in tests/snapshots.test.mjs and mcp-server/test/parity.test.mjs) so
// every caller that needs the weld computes the workload once and reads both off it.
function explorationFlagshipWorkload(p) {
  const m = MODELS.find(x => x.id === FLAGSHIP_SCOPE.modelId);
  /* b9 M5 (§15 reference pin, third site): a range-exploration route's AUTHORED-range membership
     is a property of its procurement/utilization/stack construction, defined at the flagship
     scope. The lab-lead prior is an orthogonal axis (plan §6.7) and would silently re-bucket every
     authored route — and these margins are quoted inside the FA's higher-justifications copy,
     which is M6's surface. Pinned at the trend-0 reference; live divergence from the authored
     range is already first-class and loud (withinAuthoredRange / authoredRangeLabel drift). */
  const st = pinReferenceLevers(applyPresetSettings(m, p, FLAGSHIP_SCOPE.traffic));
  const out = workload(st);
  /* im-vet-six-repairs (2026-09-20), Astra xhigh review finding 1 — BLOCKING. Every exploration
     route card, and the connector's route objects beside them, rendered the renderability
     disclosure with NO membership, which is the one input that makes the clause say a fleet was
     reduced. After the E1 withdrawal each card read "all 5 of 5 declared fleet legs" while seven
     were declared and two withdrawn: the margins had moved and the sentence said the fleet was
     whole. The membership is derived HERE, once, beside the workload it describes, so a caller
     cannot forget to pass it — and it is attached only when the route actually consumes the
     default fleet's baseline, because a route that authors its own blend has no default
     membership to report and must not borrow one. */
  out.membership = membershipForExploration(st, out);
  return out;
}
/* Attach membership only where it is TRUE of the rendered computation: the route's blend must be
   the default fleet's derived baseline at these settings, key for key. A route that overrides the
   blend gets null and keeps the undecorated clause. */
function membershipForExploration(st, out) {
  const ctx = SCENARIO_CONTEXT.get(st) || scenarioContext(st);
  const d = deriveDefaultFleetMembership(ED_FLEET.DEFAULT_FLEET_ID, st, ctx);
  if (!d || !d.excluded || !d.excluded.length) return null;
  const baseline = fleetBaselineBlend(ED_FLEET.DEFAULT_FLEET_ID, st, ctx);
  if (!baseline) return null;
  const same = HW_ORDER.every(k => (st.blend[k] || 0) === (baseline[k] || 0));
  return same ? d : null;
}
function explorationFlagshipMargin(p) {
  return explorationFlagshipWorkload(p).margin * 100;
}
function explorationComputedBucket(p) {
  return bucketForMargin(explorationFlagshipMargin(p));
}

/* Retired analyst-reconstruction presets (v2.1.3 preset redesign, P0-4 de-naming).
   DECISION: new ids + migration map (NOT transform-in-place). Rationale: the permalink-v4
   loader (M4) normalizes retired ids through this map BEFORE PERSPECTIVES.find() (P0-6), so
   every shipped v3 link resolves to the numeric-identical successor vector below with zero
   numeric breakage — while no person-named id remains addressable as a live config. The keys
   are permalink tokens already minted into shipped links: they must stay byte-matchable; they
   are loader DATA and are never rendered (P0-4: migration NOTE text names no one and does not
   echo the retired id). Successor set === retired set (byte-identical vectors), so every
   migrated pair reproduces its shipped margin exactly. */
const RETIRED_PERSPECTIVES = { teortaxes: "x80-v3", zephyr: "x80-v4", semi: "x90-v1", skeptic: "x60-v3" };

/* im-arc T3 (plan §4.1, owner answer d-20260822-4c26 2026-08-22): derive
   provider membership from MODELS.lab and the flagship ordering from the existing
   dossier registry. This is a projection, not a duplicate registry: adding or moving
   a preset cannot silently leave the MCP company's model list stale. */
const COMPANY_MODELS = Object.freeze(Object.fromEntries(
  [...new Set(MODELS.map(model => model.lab).filter(Boolean))].map(company => {
    const ids = MODELS.filter(model => model.lab === company).map(model => model.id);
    const flagship = ids.find(id => /\bflagship\b/i.test(DOSSIERS.models[id] && DOSSIERS.models[id].who || "")) || ids[0];
    return [company, Object.freeze([flagship, ...ids.filter(id => id !== flagship)])];
  })
));

if (typeof module !== "undefined" && module.exports) Object.assign(module.exports, {
  DOSSIERS, COMPANY_MODELS,
  MARGIN_BUCKETS, MARGIN_CLAIMS, EMPTY_BUCKET_STATEMENT,
  bucketForMargin, claimBucketRelations, claimsForBucket,
  inHalfOpenRange, withinAuthoredRange, authoredRangeLabel,
  SWEEP_DISCLAIMER, provenanceTierLabel, NEGATIVE_FINDINGS_STATEMENT,
  PERSPECTIVE_SPACE_KEYS, EXPLORATION_ORDER_BASIS, changedFieldsFromCentral, rankExplorations,
  FLAGSHIP_SCOPE, explorationFlagshipMargin, explorationFlagshipWorkload, explorationComputedBucket, RETIRED_PERSPECTIVES,
});
