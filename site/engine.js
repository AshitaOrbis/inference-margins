/* Frontier Inference Margins — pure model + data (no DOM). Loaded before app.js; node-importable for tests.
   Methodology v2 (2026-07-10, post external review — see /research/):
   - Effective MFU values are PER-PLATFORM ANCHOR FITS against published measurements, not first-principles
     derivations, and do not transfer across hardware (see the LOAO methods note in the annex).
   - DeepSeek V3/R1 decode anchor: 14.8k out tok/s per 8×H800 node ⇒ 1,850/GPU ⇒ effDec ≈ 7%.
   - DeepSeek input flow (73.7k/node) INCLUDES the 56.3% disk-cache-hit share; fresh prefill is
     reconstructed net of cache ⇒ ~4,026 tok/s/GPU ⇒ effPre ≈ 15% (v1 used the contaminated 34%).
   - H20/Ascend defaults are the NEUTRAL recommendations from the hardware dive (17% / 7%); the published
     optimized anchors (714 / 1,943 tok/s) reproduce at 18% / 9.5% respectively.
   All parameters editable; tooltips carry sources. */

"use strict";

/* ---------- hardware data ---------- */
// flopsFp8: dense FP8 PFLOPS per chip. effDec/effPre: effective MFU vs dense FP8
// (captures batch, disagg, expert-parallel, MTP-class tricks at throughput settings).
const HW = {
  h100:  { name: "H100 SXM",        flopsFp8: 1.98, fp4: false, hbm: 80,  bw: 3.35, tdp: 0.70, rent: 2.40, capex: 25000, effDec: 0.070, effPre: 0.15, note: "2022. Anchor: DeepSeek served V3/R1 on H800 (H100-class compute). Prefill MFU is reconstructed FRESH-only (the disclosed 73.7k/node input flow includes the 56.3% disk-cache-hit share)." },
  h200:  { name: "H200",            flopsFp8: 1.98, fp4: false, hbm: 141, bw: 4.80, tdp: 0.70, rent: 2.90, capex: 32000, effDec: 0.085, effPre: 0.36, note: "Same compute as H100, 1.76× HBM capacity/1.4× bandwidth → better batching." },
  gb200: { name: "GB200 NVL72",     flopsFp8: 5.00, fp4: true,  hbm: 186, bw: 8.00, tdp: 1.20, rent: 4.50, capex: 45000, effDec: 0.150, effPre: 0.42, note: "72-GPU NVLink domain (~$3-3.5M/rack ⇒ ~$44-49k/GPU). Per-GPU dense FP8 = 5.0 PF (NVIDIA sparse/dense split, verified — the widely-copied 4.5 PF is B200's). Anchor: vLLM ~10.1k decode tok/s/GPU on R1 reproduces at 15% MFU; the source run's precision basis (possibly NVFP4) is not fully pinned, so treat as an upper anchor. Neocloud rates $3.50-6/hr (Jul 2026)." },
  gb300: { name: "GB300 NVL72",     flopsFp8: 5.00, fp4: true,  hbm: 288, bw: 8.00, tdp: 1.40, rent: 6.00, capex: 55000, effDec: 0.127, effPre: 0.45, note: "Blackwell Ultra: 15 PF dense FP4 (1.67× B200), 288GB HBM. Anchor: SGLang >12k tok/s/GPU on V4 Pro (FP4+MTP) reproduces at 12.7% × 1.85 FP4 using the now-DISCLOSED 49B active (v1 fit assumed ~66B); InferenceX ~17× H100 FP8. xjdr served GLM 5.2 on these ($4-7/hr early rates)." },
  tpu7:  { name: "TPU v7 Ironwood", flopsFp8: 4.61, fp4: false, hbm: 192, bw: 7.37, tdp: 1.00, rent: 4.20, capex: 35000, effDec: 0.130, effPre: 0.40, note: "Google's inference TPU (GA Mar 31, 2026): 4,614 TF FP8 ≈ B200-class, 9,216-chip pods. Anthropic committed up to ~1M TPUs (Oct 2025). Google-internal cost unknown — estimates." },
  trn2:  { name: "Trainium2",       flopsFp8: 1.30, fp4: false, hbm: 96,  bw: 2.90, tdp: 0.50, rent: 1.50, capex: 15000, effDec: 0.055, effPre: 0.30, note: "GA Dec 2024. Project Rainier launched with ~500k Trainium2 for Anthropic (activated ~Nov 2025); Anthropic reported >1M Trainium2 in use across AWS by Apr 2026. Cheap per chip, weaker software stack — estimates; NO public serving anchor." },
  trn3:  { name: "Trainium3",       flopsFp8: 2.51, fp4: false, hbm: 144, bw: 4.90, tdp: 0.80, rent: 2.20, capex: 20000, effDec: 0.080, effPre: 0.34, note: "GA Dec 2025: 144-chip UltraServers, 362 PF FP8 ⇒ 2.51 PF/chip, 144GB HBM3e. AWS's aggressive cost-per-token play — pricing estimates." },
  // China-market accelerators — what DeepSeek/GLM/Kimi actually serve on.
  // Rents = annual-commit IDC/private-cloud rates (GPT Pro China-hardware dive, Jul 2026);
  // the same chip can cost 3-10x more on hyperscaler on-demand — use the rent multiplier for that.
  h800:  { name: "H800 (China)",    flopsFp8: 1.98, fp4: false, hbm: 80,  bw: 3.35, tdp: 0.70, rent: 1.75, capex: 40000, effDec: 0.070, effPre: 0.15, note: "H100 compute with NVLink capped at 400GB/s (export SKU, finite pre-ban stock — capex carries the scarcity premium). THE DeepSeek V3/R1 workhorse. Prefill MFU = FRESH-only reconstruction (~4,026 tok/s/GPU net of the 56.3% disk-cache share; the raw 9,212 aggregate includes cache hits). Annual-commit IDC rate $1.47-2.06/hr mid-2026; DeepSeek's 2025 disclosure assumed $2/hr." },
  h20:   { name: "H20 (China)",     flopsFp8: 0.296, fp4: false, hbm: 96, bw: 4.00, tdp: 0.40, rent: 1.00, capex: 20000, effDec: 0.170, effPre: 0.50, note: "The China-legal NVIDIA SKU: only 296 TF dense FP8 but 4.0 TB/s HBM — decode is bandwidth-bound, so it serves far better than its FLOPS suggest (hence the high effective MFU vs a tiny denominator). Default 17% = the hardware dive's NEUTRAL recommendation (~680 tok/s at the tighter Ant Pro tier); the relaxed <70ms production anchor (714 tok/s) reproduces at 18%. Rental class matters: same chip spans ~$0.76 (IDC annual) to $7+ (hyperscaler on-demand)." },
  ascend:{ name: "Ascend 910C",     flopsFp8: 1.504, fp4: false, hbm: 128, bw: 3.20, tdp: 0.60, rent: 1.95, capex: 23000, effDec: 0.070, effPre: 0.28, note: "Huawei's dual-die flagship (SMIC 7nm). NO native FP8 — 8-bit here means INT8 (1.504 PF per Huawei's Atlas spec; a widely-quoted 1,054 figure is a typo in the CloudMatrix paper). Default 7% = the hardware dive's NEUTRAL recommendation (~1,420 tok/s on R1-class; range 5-10%): Huawei's own optimized 384-NPU CloudMatrix anchor (1,943 tok/s) reproduces at 9.5% (stack ≈1.36), while DeepSeek's internal '60% of H100' eval implies ~5.5-6.5%. Rent = Huatai procurement award ($1.71-2.25/hr); CloudMatrix 384 ≈ RMB 60M." },
};
const HW_ORDER = ["h100", "h200", "gb200", "gb300", "h800", "h20", "tpu7", "trn2", "trn3", "ascend"];
// generation timeline for the gen chart (adds a Rubin projection)
const GEN_TIMELINE = ["h100", "h200", "gb200", "gb300"];
const RUBIN = { name: "Vera Rubin NVL72 (proj.)", flopsFp8: 17.5, fp4: true, hbm: 288, bw: 22.0, tdp: 1.80, rent: 8.50, capex: 120000, effDec: 0.13, effPre: 0.45, note: "Preliminary NVIDIA specs (verified Jul 2026): 17.5 PF dense FP8/FP6 per GPU, 288GB HBM4 @ 22 TB/s; the headline ~50 PF figure is SPARSE NVFP4 inference. No serving anchor exists — MFU, rent and capex are projections." };

const PRECISION_MULT = { bf16: 0.5, fp8: 1.0, fp4: 1.85 }; // vs FP8 throughput; FP4 factor from InferenceX GB300 32×/17× H100
const INTERACT_MULT = { batch: 1.0, balanced: 0.70, fast: 0.35 };

/* ---------- traffic-mix profiles (v2.1.2) ----------
   The TRAFFIC MIX axis owns ioRatio + cacheHit and nothing else. Names are provenance-honest
   (no generic Agentic/Chat/Coding archetypes — the numbers below are specific observations or
   stated conventions, not population claims). SLA/interactivity, service class and cache
   lifecycle remain modeled elsewhere; the full workload ontology is future work (see BACKLOG).
   cacheHit semantics: the engine treats it as BOTH the serving-side prefix-reuse share and the
   billable cached-input share — a labeled simplification (providers' disk-cache stats and
   billing-cache stats are different measurements). */
const TRAFFIC_PROFILES = [
  { id: "reference", name: "Reference 15:1 / 60%", ioRatio: 15, cacheHit: 60,
    provenance: "Calculator convention — the held-fixed scenario the normalized table uses. Not any provider's measured operating point." },
  { id: "openai-dive", name: "OpenAI dive mix 9:1 / 78%", ioRatio: 9, cacheHit: 78,
    provenance: "The OpenAI dive's 7 cached : 2 fresh : 1 output convention — a dive assumption, not disclosed telemetry." },
  { id: "deepseek-disclosure", name: "DeepSeek disclosure (Feb 2025) 4:1 / 56%", ioRatio: 4, cacheHit: 56,
    provenance: "DeepSeek's Feb 2025 production disclosure (measured). Their 56.3% is a DISK-cache-hit share; treating it as billable cached-input share is a labeled assumption." },
  { id: "ncode", name: "ncode-informed scenario 8:1 / 41%", ioRatio: 8, cacheHit: 41,
    provenance: "The 41% cache-hit rate and 81k-token average inputs are @_xjdr's free-week observations; the 8:1 input:output ratio is a site-authored Zhipu-dive assumption (the cited posts report no output-length or I/O split). One event informing a scenario, not a generic 'coding' archetype." },
  { id: "kimi-dive", name: "Kimi dive mix 8:1 / 40%", ioRatio: 8, cacheHit: 40,
    provenance: "The Moonshot dive's Mooncake-like convention — a dive assumption the dive itself declined to firm up." },
  { id: "uncached", name: "Uncached 3:1 / 0%", ioRatio: 3, cacheHit: 0,
    provenance: "The xAI dive's operating convention: output-heavy traffic, no billed prefix cache." },
];

/* ---------- state ---------- */
const DEFAULTS = {
  active: 300, total: 5000, precision: "fp8",
  ioRatio: 15, cacheHit: 60, /* owned by the TRAFFIC MIX axis since v2.1.2 — resolveTraffic() writes these */ billCacheHit: null, /* billable cached-input share; null = assumed equal to serving reuse (labeled assumption — no provider discloses both) */ cacheCost: 5, interact: "balanced",
  hwMode: "rent", rentMult: 1.0, util: 50, stackMult: 1.0,
  kwh: 0.07, pue: 1.25, dcPerW: 12, lifeYears: 5, clusterOh: 1.30, opexPct: 8,
  priceIn: 5, priceOut: 25, cacheReadMult: 10, cacheWriteShare: 0, cacheWriteMult: 125, batchShare: 15, discount: 5,
  blend: { h100: 10, h200: 15, gb200: 25, gb300: 15, h800: 0, h20: 0, tpu7: 20, trn2: 5, trn3: 10, ascend: 0 },
  subPlan: 200, subUsage: 3200,
};

/* ---------- presets ---------- */
const MODELS = [
  { id: "opus", name: "Claude Opus 4.x", spec: false, nativeTraffic: "reference",
    set: { active: 300, total: 5000, precision: "fp8", priceIn: 5, priceOut: 25 },
    note: "Total ≈5T implied by Musk's \"Grok is 0.5T = 1/10 Opus\" (Apr 2026). Active is the open question — TeorTaxes reads serving speed as \"shockingly few active params\"; 300B is this page's working estimate, not a measured figure. List $5/$25." },
  { id: "sonnet", name: "Claude Sonnet 5", spec: true, nativeTraffic: "reference",
    tariff: { validUntil: "2026-08-31", flipTo: { priceIn: 3, priceOut: 15 }, note: "intro $2/$10 ends Aug 31, 2026; standard $3/$15 from Sep 1" },
    set: { active: 120, total: 1000, precision: "fp8", priceIn: 2, priceOut: 10 },
    note: "Sonnet 5 introductory pricing $2/$10 through Aug 31, 2026 (standard $3/$15 from Sep 1 — flip the price sliders to compare). Sizes carried over from the 4.x-era analysis (Musk post ⇒ ≈1T total; ~120B active estimated) — Sonnet 5's actual architecture is undisclosed, and its tokenizer emits ~30% more tokens for the same text, so per-text comparisons across generations need re-tokenizing." },
  { id: "haiku", name: "Claude Haiku 4.5", spec: true, nativeTraffic: "reference",
    set: { active: 40, total: 350, precision: "fp8", priceIn: 1, priceOut: 5 },
    note: "No public size data — speculative. List $1/$5." },
  { id: "gpt", name: "GPT-5.6 Sol", spec: true, nativeTraffic: "openai-dive", nativeTrafficWasExplicit: true,
    set: { active: 105, total: 5000, precision: "fp8", priceIn: 5, priceOut: 30, blend: { h100: 20, h200: 25, gb200: 45, gb300: 10 } },
    dive: { rentMult: 0.85, util: 73, stackMult: 0.75, interact: "balanced", batchShare: 0, discount: 0 },
    note: "OpenAI's flagship. Params undisclosed — ~100B active is the community/Epoch estimate the GPT Pro dive corroborated (80% range 50–220B); ~5T total central (1–20T!). List $5/$30 short-context; workload = the dive's 7 cached : 2 fresh : 1 output mix; fleet = Hopper/Blackwell across Microsoft/OCI/CoreWeave (blend speculative). Evidence audit: §10." },
  { id: "gemini", name: "Gemini 3.1 Pro", spec: true, nativeTraffic: "reference",
    set: { active: 120, total: 3000, precision: "fp8", priceIn: 2, priceOut: 12, blend: { tpu7: 100 } },
    dive: { rentMult: 0.30, util: 75, stackMult: 0.55, interact: "batch", batchShare: 0, discount: 0 },
    note: "Nobody outside Google knows the sizes — 120B active / 3T total are scenario midpoints (brackets 60–240B / 1–4T). Serves on its own TPUs (blend set to Ironwood; older TPU fleets not modeled) — the dive's derived internal cost ≈ $1.28/chip-hr is the 'dive replay' procurement. List $2/$12 ≤200K. Evidence audit: §10." },
  { id: "grok", name: "Grok 4.5 (1.5T)", spec: true, nativeTraffic: "reference",
    set: { active: 200, total: 1500, precision: "fp8", priceIn: 2, priceOut: 6, cacheReadMult: 25, blend: { h100: 45, h200: 5, gb200: 25, gb300: 25 } },
    dive: { rentMult: 0.62, util: 48, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0, ioRatio: 3, cacheHit: 0 },
    note: "Total 1.5T DISCLOSED (Musk: '1.5T V9 foundation model'); MoE per Cursor; ~200B active is speculation (range 100–500B). List $2/$6 (launched Jul 8, 2026), cache reads 25% of input. Blend mirrors the Colossus fleet — owned, which cuts both ways: cheap at cash-marginal cost, but Anthropic pays xAI ~$5.27/GPU-hr for reserved capacity, a real opportunity cost. Dive replay = full-cycle TCO lens, 3:1 uncached workload. Evidence audit: §10." },
  { id: "kimi", name: "Kimi K2.7 Code (1T/32B)", spec: false, diveMetric: "output", nativeTraffic: "reference",
    set: { active: 32, total: 1000, precision: "fp8", priceIn: 0.95, priceOut: 4.00, cacheReadMult: 20, blend: { h800: 70, h20: 30 } },
    dive: { rentMult: 1.0, util: 60, stackMult: 0.83, interact: "balanced", batchShare: 0, discount: 0, ioRatio: 8, cacheHit: 40 },
    note: "DISCLOSED: 1T total / 32B active, 384 experts, selective INT4 weights (595GB checkpoint), no MTP head. List $0.95/$4.00, cache reads 20% of input, batch tier at 60%. Production historically on A800/H800 (Mooncake: >100B tokens/day); current fleet undisclosed — blend speculative. NOTE: §10's ~81% for Kimi is an OUTPUT-TOKEN margin; the dive replay reproduces the dive's ~$0.75/M output cost, and the blended headline shown here uses a Mooncake-like mix the dive itself declined to estimate. Evidence audit: §10." },
  { id: "dsr1", name: "DeepSeek V3/R1 (671B)", spec: false, nativeTraffic: "deepseek-disclosure", nativeTrafficWasExplicit: true,
    set: { active: 37, total: 671, precision: "fp8", priceIn: 0.55, priceOut: 2.19, cacheReadMult: 25, blend: { h800: 100 } },
    dive: { rentMult: 1.14, util: 100, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0 },
    note: "The calibration anchor: open weights (37B active), official serving disclosure (Feb 2025): 73.7k/14.8k tok/s per H800 node (input flow INCLUDING 56.3% disk-cache hits), 3.6:1 I/O, theoretical 545% cost-profit ratio (=84.5% margin) at R1 prices. Blend set to the H800s it actually ran on; cache reads billed at R1's real 25% of input. Paired with the replay/dive perspective the model gives ~84% vs the disclosed 84.5% — with fresh-prefill and utilization now accounted honestly (v1's exact match was an artifact of two canceling errors)." },
  { id: "dsv4", name: "DeepSeek V4 Pro (1.6T/49B)", spec: false, nativeTraffic: "deepseek-disclosure", nativeTrafficWasExplicit: true,
    set: { active: 49, total: 1600, precision: "fp4", priceIn: 0.435, priceOut: 0.87, cacheReadMult: 1, blend: { h800: 50, h20: 20, ascend: 30 } },
    dive: { rentMult: 0.857, util: 100, stackMult: 1.05, interact: "batch", batchShare: 0, discount: 0, blend: { h800: 100 } },
    note: "DISCLOSED: 1.6T total / 49B active, selective FP4 (KV stays BF16/FP8). List $0.435/$0.87 after the permanent 75% cut (cache reads at a remarkable 0.83% of input); 2× peak surcharge announced for mid-July. Dive replay = the dive's central scenario (~$1.50/H800-equivalent-hr, their stack) → ~69%. At Western rental assumptions these prices sit near or below cost, which is the point. §10." },
  { id: "dsv4f", name: "DeepSeek V4-Flash (284B/13B)", spec: false, nativeTraffic: "deepseek-disclosure", nativeTrafficWasExplicit: true,
    set: { active: 13, total: 284, precision: "fp4", priceIn: 0.14, priceOut: 0.28, cacheReadMult: 2, blend: { h800: 50, h20: 20, ascend: 30 } },
    note: "DISCLOSED: 284B total / 13B active, same V4 family (selective FP4). List $0.14/$0.28 — the tariff the DeepSeek dive showed would be UNDERWATER on the old V3/R1 cost structure (−2.2%): Flash only works with its much smaller active set, better hardware, or strategic subsidy. Concurrency tier 2,500 (vs Pro's 500). §10." },
  { id: "glm", name: "GLM 5.2 (744B/40B)", spec: false, nativeTraffic: "ncode", nativeTrafficWasExplicit: true,
    set: { active: 40, total: 744, precision: "fp8", priceIn: 1.40, priceOut: 4.40, cacheReadMult: 19, blend: { ascend: 40, h800: 40, h20: 20 } },
    dive: { rentMult: 1.9, util: 75, stackMult: 0.60, interact: "balanced", batchShare: 0, discount: 0 },
    note: "DISCLOSED: 744B total / 40B active, BF16/FP8 open checkpoints (Baseten serves an NVFP4 variant abroad at 280+ tok/s/user). Z.ai list $1.40/$4.40, cache reads 19% of input; traffic scenario: site-assumed 8:1 I/O (the cited posts report no I/O split) + the ncode-week 41% cache observation. Zhipu's audited FY2025 cloud/API gross margin: 18.9%. Domestic blend speculative — nine platforms named. At idealized defaults the physics runs well above §10's empirically-anchored ~60% — the dive replay applies the audit-implied procurement/efficiency haircut. §10." },
  { id: "glm47", name: "GLM-4.7 (355B/32B)", spec: false, nativeTraffic: "ncode", nativeTrafficWasExplicit: true,
    set: { active: 32, total: 355, precision: "fp8", priceIn: 0.60, priceOut: 2.20, cacheReadMult: 18, blend: { ascend: 40, h800: 40, h20: 20 } },
    note: "DISCLOSED: 355B total / 32B active, BF16/FP8 open checkpoints — Z.ai's recommended workhorse (Coding Plan routes routine work here). List $0.60/$2.20: a materially different price floor than GLM-5.2's $1.40/$4.40, which is why it ships as its own preset. Blend speculative as with 5.2. §10." },
  { id: "terra", name: "GPT-5.6 Terra (tariff scenario)", spec: true, scenario: true, nativeTraffic: "openai-dive", nativeTrafficWasExplicit: true,
    set: { active: 50, total: 1000, precision: "fp8", priceIn: 2.50, priceOut: 15, cacheReadMult: 10, blend: { h100: 20, h200: 25, gb200: 45, gb300: 10 } },
    note: "TARIFF SCENARIO: the price ($2.50/$15, exactly half of Sol) is the only identified quantity. Sizes are scenario values from the OpenAI dive's ranges (~1T/50B central; 0.25–5T / 20–110B) — Terra need not be a half-sized Sol, and back-inferring size from price is circular. Excluded from the normalized table. §10." },
  { id: "luna", name: "GPT-5.6 Luna (tariff scenario)", spec: true, scenario: true, nativeTraffic: "openai-dive", nativeTrafficWasExplicit: true,
    set: { active: 20, total: 250, precision: "fp8", priceIn: 1, priceOut: 6, cacheReadMult: 10, blend: { h100: 20, h200: 25, gb200: 45, gb300: 10 } },
    note: "TARIFF SCENARIO: $1/$6 list (80% below Sol) and ~205–229 measured user-stream tok/s are the identified quantities. Sizes are scenario values (~0.25T/20B central; 0.05–1.5T / 8–50B) — Luna could equally be a large model with aggressive distillation or speculative decoding. Excluded from the normalized table. §10." },
  { id: "gemflash", name: "Gemini 3.5 Flash (tariff scenario)", spec: true, scenario: true, nativeTraffic: "reference", nativeTrafficWasExplicit: true,
    set: { active: 20, total: 600, precision: "fp8", priceIn: 1.50, priceOut: 9, cacheReadMult: 10, blend: { tpu7: 100 } },
    note: "TARIFF SCENARIO: $1.50/$9 list is the identified quantity; a memorization-based preprint puts the PRECEDING Gemini 3 Flash at a 405B-total LOWER BOUND, and speed-based guesses run 250–300B total / 10–16B active — all very low confidence. A fast-tier comparator, not a frontier estimate; excluded from the normalized table. §10." },
  // Custom (2026-07-12): a blank scratch model — no provider, nothing sourced. The user defines the
  // architecture/hardware/traffic/pricing entirely with the sliders. Neutral Reference traffic.
  { id: "custom", name: "Custom (define with sliders)", spec: false, nativeTraffic: "reference",
    set: { active: 100, total: 1000, precision: "fp8", priceIn: 3, priceOut: 15 },
    note: "A blank scratch model — no provider, nothing here is sourced. Define every architecture, hardware, traffic and pricing assumption yourself with the sliders. Starting point: 100B active / 1T total / FP8, list $3/$15, Reference 15:1/60% traffic." },
];

const PERSPECTIVES = [
  { id: "median", kind: "lens", name: "[lens] Central scenario (Claude)",
    set: { hwMode: "rent", rentMult: 1.0, util: 50, stackMult: 1.0, interact: "balanced", batchShare: 15, discount: 5 },
    note: "This page's central scenario (an analyst synthesis, not a distributional median): neocloud-level hardware cost, 50% fleet utilization, current open-source-level serving stack, balanced latency. Provider-specific pricing comes from the model preset. See report §5." },
  { id: "dive", kind: "replay", name: "[replay] §10 dive (this model)",
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
     DE-NAMED (P0-4: no external party's name appears on any config surface — names live only on
     MARGIN_CLAIMS records). kind:"exploration" composes like a lens: no traffic keys, no
     model-owned overrides (blend fills silent models only), excluded from the cost-lens span.
     Range membership is COMPUTED at the flagship scope (Opus 4.x @ explicit Reference 15:1/60%)
     via explorationComputedBucket() — never hand-set. Ordering basis (P0-7): "fewest changed
     registry fields from the central configuration", stable id tie-break.
     All four surviving vectors are byte-identical to retired analyst-reconstruction presets and
     ARE the permalink migration anchors (RETIRED_PERSPECTIVES at the bottom of this file:
     teortaxes→x80-v3, zephyr→x80-v4, semi→x90-v1, skeptic→x60-v3). Ids are permalink-load-bearing;
     do NOT renumber. Only x90-v1 is a ≥90% route: the batch/high-occupancy mechanism named in the
     discourse ("increase the batch size … drive margins from 90% to 95%") does NOT reach ≥90% at
     market rates in this engine (it tops out ~87–89%); the strategic-rent-cut configs that did
     clear 90% were procurement stories, not the batch mechanism, so they were dropped rather than
     mislabeled as the batch route. */
  { id: "x90-v1", kind: "exploration", name: "[range exploration] ≥90% · owned-TCO estate route", subtitle: "owned-TCO estate route",
    set: { hwMode: "tco", util: 55, stackMult: 1.1, interact: "balanced", batchShare: 15, discount: 5 },
    note: "PAGE-AUTHORED RECONSTRUCTION of one route to a ≥90% modeled unit margin — the ≥90% owned-TCO story in the discourse (a lab that owns/commits its fleet pays build-cost, not rental markup). The fleet is costed as a well-run owned estate (hourly cost from capex, power, datacenter, opex) at 55% occupancy with a 1.1× stack. This is this page's own route, NOT any external party's cost model; no external party selected this vector. Range membership is computed at the flagship scope, never enforced." },
  { id: "x80-v3", kind: "exploration", name: "[range exploration] 80–90% · market rents, aggressive stack, throughput", subtitle: "market rents, aggressive stack, throughput",
    set: { hwMode: "rent", rentMult: 1.0, util: 70, stackMult: 1.25, interact: "batch", batchShare: 10, discount: 0 },
    note: "PAGE-AUTHORED RECONSTRUCTION of one route into the 80–90% range the discourse points at (a floor 'north of 80%' for Opus API tokens; an earlier ~80% inference-only read — both verbatim in the claims registry): market-rate GPUs at 70% occupancy, an aggressive serving stack (a page-set 1.25× on the open-source-best baseline — no measured distribution behind it), throughput-first serving, minimal off-list billing. This is this page's own route, NOT any external party's cost model. Range membership is computed at the flagship scope, never enforced." },
  { id: "x80-v4", kind: "exploration", name: "[range exploration] 80–90% · sub-market rents, above-baseline stack", subtitle: "sub-market rents, above-baseline stack",
    set: { hwMode: "rent", rentMult: 0.9, util: 65, stackMult: 1.15, interact: "batch", batchShare: 10, discount: 0 },
    note: "PAGE-AUTHORED RECONSTRUCTION of a second route into the 80–90% discourse range: slightly sub-market rents (0.9×), 65% occupancy, an above-baseline (1.15×, page-set) stack, throughput-first serving. This is this page's own route, NOT any external party's cost model. Range membership is computed at the flagship scope, never enforced." },
  { id: "x60-v3", kind: "exploration", name: "[range exploration] <60% · reported-margin inverse diagnostic", subtitle: "reported-margin inverse diagnostic",
    set: { hwMode: "rent", rentMult: 1.6, util: 35, stackMult: 0.85, interact: "balanced", batchShare: 25, discount: 20 },
    note: "PAGE-AUTHORED RECONSTRUCTION tied to the reported/accounting <60% discourse (reported ~40–50% frontier inference margins; a reported ~40% company gross-margin projection — both verbatim/records in the claims registry and §7): it shows what UNIT direct-serving inputs would be required to back out a reported-low figure — hyperscaler list rates (1.6×), peak-provisioned occupancy (35%), a below-baseline stack (0.85×), a 25% batch mix and 20% discounting. It lands at ≈22%, WELL BELOW the reported 40–50% band: that distance is the §7 reconciliation gap between a unit direct-serving margin and a reported company gross margin, not agreement with it. A failed inversion does not falsify any reported figure. This is this page's own diagnostic, NOT any external party's cost model. Range membership is computed at the flagship scope, never enforced." },
  { id: "gptpro", kind: "lens", name: "[lens] Strategic-partner fleet (GPT-5.6 Pro)",
    set: { hwMode: "rent", rentMult: 0.70, util: 70, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0, blend: { tpu7: 40, gb300: 25, gb200: 15, trn2: 15, h200: 5 } },
    note: "Approximates GPT-5.6 Pro's independent consult (Jul 2026): Anthropic-scale strategic contracts (SemiAnalysis pegs its TPU v7 at ~$1.60/hr), 75% utilization, 40% TPU-heavy blend → Opus 90.6% in / 93.3% out at list. See report §6." },
  { id: "xaicash", kind: "replay", name: "[valuation replay] xAI cash-marginal (dive operating point)",
    set: { hwMode: "rent", rentMult: 0.156, util: 48, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0, ioRatio: 3, cacheHit: 0 },
    note: "xAI-scoped: values the GPU-hour at ~$0.60 — power, cooling, maintenance and ops AFTER the hardware is sunk. The dive's answer to 'what does the next token cost on spare capacity': Grok 4.5 ≈ 92% on this lens. Same operating point as the dive; only the valuation changes — an atomic replay: the 3:1 / 0% traffic is part of the position and stays locked." },
  { id: "xaiopp", kind: "replay", name: "[valuation replay] xAI opportunity-cost (Anthropic contract)",
    set: { hwMode: "rent", rentMult: 1.37, util: 48, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0, ioRatio: 3, cacheHit: 0 },
    note: "xAI-scoped: values the GPU-hour at the ~$5.27 bundled rate Anthropic actually pays xAI ($1.25B/mo for ~325k GPUs + CPUs/storage/network per the SpaceXAI prospectus). NOT production COGS and NOT a bare chip-hour — it is what serving Grok forgoes. Grok 4.5 ≈ 27% on this lens (the dive's replica model put it at ~29% — same story): output-heavy traffic barely beats selling the capacity." },
  { id: "chinacloud", kind: "lens", name: "[lens] China public-cloud on-demand (Jul 2026)",
    set: { hwMode: "rent", rentMult: 6.15, util: 35, stackMult: 1.0, interact: "balanced", batchShare: 0, discount: 0 },
    note: "The hyperscaler on-demand rate-card class, dated Jul 2026 (grounding pack): ≈6.1–6.2× the IDC annual-commit rates this page defaults to (Tencent H20 on-demand $4.48+, Alibaba RDS $7.40–10.62, H800 HCC ~$10.6 — note the H800 observation is monthly HCC, and bundles differ across products). Enterprise on-demand utilization ~35%. A procurement-class profile for buyers without commitments — not evidence of any lab's actual cost." },
  { id: "anth20", kind: "replay", name: "[SLO replay] Ant Group production H20 (<50ms)",
    set: { hwMode: "rent", rentMult: 1.0, util: 100, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0, blend: { h20: 100 } },
    note: "Replays Ant Group's published H20 production serving at the Pro tier (675 tok/s/GPU, TPOT <50ms) — the neutral tier this page's H20 default is fit to. Their <70ms tier reaches 714 (stack ≈1.06); the <30ms tier drops to 423 (stack ≈0.63): the published latency curve, made selectable. Utilization 100 = the measured-operating-point convention (per-occupied-chip, same as the DeepSeek replay) — Ant's fleet occupancy is undisclosed." },
  { id: "deepseek", kind: "replay", name: "[replay] DeepSeek disclosure (Feb 2025)",
    set: { hwMode: "rent", rentMult: 1.14, util: 100, stackMult: 1.0, interact: "batch", batchShare: 0, discount: 0, blend: { h800: 100 } },
    note: "Replays the Feb 2025 disclosure economics: ~$2/hr H800s (1.14× the mid-2026 IDC rate), their stack. Utilization stays at 100% because the disclosed per-node throughputs are AVERAGES over deployed nodes — they already encode idle time, so a second utilization divisor would double-count it. Pair with the DeepSeek V3/R1 model preset → ~84% vs the disclosed 84.5%." },
];

/* ---------- tooltip registry ---------- */
const TIPS = {
  margin: { t: "Modeled unit direct-serving contribution margin", b: "1 − (modeled direct serving cost ÷ realized billings) for the current traffic mix — a list-price metric only when the batch and discount sliders are 0%. Direct serving cost covers accelerator time, occupancy and the modeled serving stack — NOT support, unbilled retries, idle reservations, R&D or sales. This is not an audited accounting gross margin (see report §7 for the bridge), and 'marginal' here is an economic long-run-incremental lens, not the near-zero cash cost of one extra token on an idle server.", s: "Cited ranges (each with its own scope — see §1): TeorTaxes conditional 90→95%; Dylan Patel >80% (Opus, quoted-secondary); fleetingbits reported ~40-50% (accounting observation — the post did not define this calculator's direct-serving metric)." },
  "blended-cost": { t: "Blended serving cost", b: "Weighted cost per 1M tokens across the workload mix (fresh input via prefill, cache reads, output via decode), on the selected hardware blend, divided by fleet utilization.", s: "" },
  "blended-price": { t: "Blended realized price", b: "What 1M tokens of this mix would bill at the selected tariffs after cache-read discounts, batch-API share and negotiated discounts — not the sticker price.", s: "SemiAnalysis observed Opus effective ~$0.99/Mtok vs $5/$25 sticker on 300:1 agentic traffic with >90% cache hits." },
  "cost-out": { t: "Marginal cost of output tokens", b: "Decode cost per 1M output tokens: GPU-hour cost ÷ (3600 × tokens/s/GPU) ÷ utilization, blended across hardware.", s: "TeorTaxes stated an unclassified \"Serving Opus is at most $4/1Mt\" ceiling; token-class comparability is unresolved." },
  active: { t: "Active parameters", b: "Parameters used per token (MoE routed). Decode FLOPs/token ≈ 2 × active. This is the single most load-bearing unknown for Claude — total size is ~known from Musk's post, active is not.", s: "DeepSeek V3: 37B · Kimi K2: 32B · Zephyr on OpenAI: ~100B · TeorTaxes on Fable: \"shockingly FEW active\"" },
  total: { t: "Total parameters", b: "Full weight count — sets HBM needed to hold the model (feasibility tile), not per-token compute.", s: "Musk (Apr 2026): Grok 0.5T = ½ Sonnet = 1/10 Opus ⇒ Sonnet ≈1T, Opus ≈5T." },
  precision: { t: "Serving precision", b: "FP8 is the widely-assumed frontier serving norm (closed labs don't disclose serving precision; DeepSeek's disclosed stack runs FP8); FP4 (Blackwell+) gives ~1.85× throughput where quality holds. bf16 halves throughput vs FP8.", s: "xjdr: GLM 5.2 fp8 experts+KV ≈ zero quality loss; NVFP4 slight regression. InferenceX: GB300 FP4 = 32× H100, FP8 = 17×." },
  ioRatio: { t: "Input : output ratio", b: "Tokens read vs tokens generated. Named observations and conventions vary widely — input pricing and caching dominate real bills at the high end. These are not population ranges for 'chat' or 'agentic coding'.", s: "DeepSeek disclosure ≈4:1 · ncode deployment 8:1 (site-assumed ratio) · calculator Reference convention 15:1 · one Claude Code trace ≈300:1." },
  cacheHit: { t: "Cache hit rate", b: "Share of input tokens served from prefix cache instead of recomputed. Cached reads bill at ~10% of input price but cost far less than that to serve — caching is a margin machine.", s: "xjdr GLM week: 41% · DeepSeek: 56.3% · SemiAnalysis Claude Code: ~95% (cut their bill 84%)." },
  cacheCost: { t: "Cache-read serving cost", b: "Cost to serve a cached input token, as % of fresh prefill cost (KV storage + bandwidth, near-zero compute).", s: "" },
  billCacheHit: { t: "Billable cached-input share", b: "Share of input tokens BILLED at the cache-read tariff. This is a different observable from the serving-side reuse share above it: providers' disk-cache statistics and billing-cache statistics are separate measurements, and no provider publishes both. Default: assumed equal to the serving reuse share (a labeled assumption). Set it separately to test how sensitive the margin is to that assumption — it can move headline provider cases by tens of points.", s: "DeepSeek disclosed a 56.3% disk-cache share; its BILLED cached share is undisclosed." },
  interact: { t: "Interactivity regime", b: "Throughput-vs-latency tradeoff: bigger batches = cheaper tokens but slower per-user speed. The multipliers (1.0/0.70/0.35) apply to DECODE ONLY and are coarse uncalibrated stand-ins for hardware- and SLO-specific latency curves (see the LOAO methods note); no TTFT/TPOT target is guaranteed. 'Fast' is the premium low-latency end (cf. Anthropic fast mode, now 2× list on Opus 4.8; launched at 6×).", s: "SGLang GB300: ~11.2k tok/s/GPU at 50 tok/s/user, less at 80. CloudMatrix: 1,943 → 538 tok/s from 50ms → 15ms TPOT." },
  hwMode: { t: "Cost basis", b: "Rental: market $/GPU-hr (what a neocloud charges). Owned TCO: build the hourly cost from capex, power, datacenter and opex — closer to what a lab with its own fleet (or committed cloud deals) pays.", s: "" },
  rentMult: { t: "GPU-hour cost multiplier", b: "Scales all rental rates. >1 models hyperscaler markup (Anthropic buys via AWS/GCP); <1 models spot/committed pricing.", s: "TeorTaxes: H100 spot $2.40/hr (Jun 2026) · cloud list ≈ 1.5-1.8× neocloud." },
  util: { t: "Fleet utilization", b: "Share of paid GPU-hours doing revenue work. Fleets are provisioned for peak; nights/weekends and failover idle the rest. All costs divide by this, so paid slack is allocated to served tokens.", s: "DeepSeek avg/peak nodes ⇒ ~81% (one disclosure). No representative industry distribution is public; the 50% default is an analyst central scenario and 30-60% a speculative sensitivity band." },
  stackMult: { t: "Serving-stack efficiency", b: "Multiplier on effective MFU vs the calibrated open-source baseline (disagg + wide-EP + MTP-class). Frontier labs plausibly run better-than-OSS stacks; 1.25 is this page's assumed frontier edge, not a measured percentile.", s: "InferenceX: software alone took B300 R1 from 1k → 14k tok/s/GPU (14×). Baseline already includes most of that." },
  kwh: { t: "Electricity price", b: "Industrial $/kWh at the datacenter.", s: "US industrial ≈ $0.06-0.09; hyperscaler PPAs lower." },
  pue: { t: "PUE", b: "Power Usage Effectiveness — total facility power ÷ IT power (cooling etc.).", s: "Modern liquid-cooled: 1.1-1.3." },
  dcPerW: { t: "Datacenter capex", b: "$ per watt of IT capacity to build the shell+power+cooling, amortized over ~12 years here.", s: "SemiAnalysis-style estimates: $9-15/W." },
  lifeYears: { t: "GPU depreciation", b: "Years over which accelerator capex is written off. Shorter = more expensive tokens.", s: "Debated 3-6 years across the discourse; hyperscalers' server accounting uses 5-6. The 5-year default is a page-set scenario value." },
  clusterOh: { t: "Cluster overhead", b: "Multiplier on GPU capex for CPUs, networking, storage, integration.", s: "" },
  opexPct: { t: "Operations overhead", b: "Staff, maintenance, spares as % of hourly capex cost.", s: "" },
  priceIn: { t: "Input price", b: "List $/M input tokens.", s: "Opus $5 (fast $10) · Sonnet 5 $2 intro / $3 std · DeepSeek V4 Pro $0.435." },
  priceOut: { t: "Output price", b: "List $/M output tokens.", s: "Opus $25 (fast $50) · Sonnet 5 $10 intro / $15 std · GPT-5.6 Sol $30 · V4 Pro $0.87." },
  cacheReadMult: { t: "Cache-read price", b: "What cached input tokens bill, as % of the input price.", s: "Anthropic: 10% of base input." },
  cacheWriteShare: { t: "Cache-write share", b: "Share of FRESH input tokens billed as cache writes (at the write premium). Default 0 keeps write billing out of the mix — raise it to model providers that bill writes explicitly. Serving-cost side is unchanged: the KV is produced by prefill either way (storage is unmodeled).", s: "OpenAI bills writes at 1.25× input; Anthropic 1.25× (5-min) / 2× (1-hr) tiers." },
  cacheWriteMult: { t: "Cache-write price", b: "What written tokens bill, as % of the input price.", s: "OpenAI: 125%. Anthropic: 125% (5-min TTL) or 200% (1-hr TTL)." },
  batchShare: { t: "Batch-API share", b: "Share of traffic on the 50%-off batch tier.", s: "" },
  discount: { t: "Average discount", b: "Blended negotiated/enterprise/volume discount off list.", s: "" },
  blend: { t: "Hardware blend", b: "Traffic share by accelerator. Anthropic uniquely runs three platforms: NVIDIA GPUs, Google TPUs (up to ~1M chip deal), AWS Trainium (Rainier launched ~500k; >1M in use by Apr 2026). The China rows (H800 stock, legal H20s, Huawei Ascend 910C) are what DeepSeek/GLM/Kimi realistically serve on under export controls.", s: "" },
  feas: { t: "Serving feasibility", b: "GPUs needed just to hold the weights at the chosen precision (with 30% headroom for KV cache), on the largest-share accelerator.", s: "" },
  subPlan: { t: "Plan price", b: "Monthly subscription price.", s: "Pro $20 · Max 5× $100 · Max 20× $200." },
  subUsage: { t: "API-equivalent usage", b: "What the user's monthly consumption would cost at list API prices (what ccusage reports).", s: "melvynx: $3.2k/mo capacity on Max 20x · olofj: $3k/mo actual · Earth_1729: $8k/4wk · ksred: ~$1.9k/mo over 8 months." },
};

/* ---------- parameter definitions (sliders) ---------- */
const SECTIONS = [
  { title: "Model architecture", params: [
    { k: "active", label: "Active parameters", unit: "B", min: 15, max: 800, step: 5, log: true, tip: "active",
      ticks: [{ v: 37, l: "DeepSeek V3" }, { v: 100, l: "OAI≈100 (Zephyr)", alt: true }, { v: 300, l: "Opus est." }, { v: 800, l: "Mythos ceiling", alt: true }] },
    { k: "total", label: "Total parameters", unit: "B", min: 200, max: 6000, step: 50, log: true, tip: "total",
      ticks: [{ v: 500, l: "Grok (Musk)" }, { v: 1000, l: "Sonnet≈1T", alt: true }, { v: 1600, l: "DS V4 Pro" }, { v: 5000, l: "Opus≈5T (Musk)" }] },
    { k: "precision", label: "Serving precision", type: "select", options: [["fp8", "FP8 (assumed frontier norm)"], ["fp4", "FP4 / NVFP4 (Blackwell+)"], ["bf16", "BF16 (conservative)"]], tip: "precision" },
  ]},
  { title: "Traffic mix (I/O + cache)", params: [
    { k: "ioRatio", label: "Input : output ratio", unit: ":1", min: 1, max: 300, step: 1, log: true, tip: "ioRatio",
      ticks: [{ v: 4, l: "DeepSeek 4:1" }, { v: 15, l: "Reference convention" }, { v: 100, l: "agentic scenario", alt: true }, { v: 300, l: "Claude Code 300:1" }] },
    { k: "cacheHit", label: "Cache hit rate", unit: "%", min: 0, max: 95, step: 1, tip: "cacheHit",
      ticks: [{ v: 41, l: "xjdr 41%" }, { v: 56, l: "DeepSeek 56%", alt: true }, { v: 95, l: "Claude Code 95%" }] },
    { k: "interact", label: "Interactivity regime (decode only — prefill and TTFT are unchanged by this control)", type: "radio", options: [["batch", "Throughput (1.00× decode; no SLO guarantee)"], ["balanced", "Balanced scenario (0.70× decode; uncalibrated)"], ["fast", "Low-latency scenario (0.35× decode; uncalibrated)"]], tip: "interact" },
  ]},
  { title: "Hardware blend & cost", params: [
    { k: "blend", type: "blend", tip: "blend" },
    { k: "hwMode", label: "Cost basis", type: "radio", options: [["rent", "Rental $/hr"], ["tco", "Owned TCO"]], tip: "hwMode" },
    { k: "rentMult", label: "GPU-hour cost multiplier", unit: "×", min: 0.5, max: 2, step: 0.05, showIf: s => s.hwMode === "rent", tip: "rentMult",
      ticks: [{ v: 0.8, l: "spot" }, { v: 1.0, l: "neocloud" }, { v: 1.6, l: "hyperscaler list" }] },
    { k: "util", label: "Fleet utilization", unit: "%", min: 15, max: 95, step: 1, tip: "util",
      ticks: [{ v: 35, l: "peak-provisioned" }, { v: 50, l: "central scenario", alt: true }, { v: 81, l: "DeepSeek ~81%" }] },
    { k: "stackMult", label: "Serving-stack efficiency", unit: "×", min: 0.4, max: 1.6, step: 0.05, tip: "stackMult",
      ticks: [{ v: 0.7, l: "no MTP/disagg" }, { v: 1.0, l: "OSS best (SGLang)" }, { v: 1.25, l: "frontier lab (assumed)", alt: true }] },
  ]},
  { title: "Owned-TCO inputs", showIf: s => s.hwMode === "tco", params: [
    { k: "kwh", label: "Electricity", unit: "$/kWh", min: 0.03, max: 0.15, step: 0.005, tip: "kwh",
      ticks: [{ v: 0.05, l: "PPA" }, { v: 0.07, l: "US industrial" }, { v: 0.12, l: "constrained grid", alt: true }] },
    { k: "pue", label: "PUE (cooling overhead)", unit: "", min: 1.05, max: 1.5, step: 0.01, tip: "pue",
      ticks: [{ v: 1.1, l: "liquid-cooled" }, { v: 1.35, l: "legacy air", alt: true }] },
    { k: "dcPerW", label: "Datacenter capex", unit: "$/W", min: 5, max: 20, step: 0.5, tip: "dcPerW",
      ticks: [{ v: 12, l: "SemiAnalysis-ish" }] },
    { k: "lifeYears", label: "GPU depreciation", unit: "yr", min: 2, max: 8, step: 0.5, tip: "lifeYears",
      ticks: [{ v: 3, l: "aggressive" }, { v: 5, l: "scenario default" }, { v: 6, l: "hyperscaler", alt: true }] },
    { k: "clusterOh", label: "Cluster overhead", unit: "×", min: 1.1, max: 1.6, step: 0.05, tip: "clusterOh" },
    { k: "opexPct", label: "Operations overhead", unit: "%", min: 2, max: 20, step: 1, tip: "opexPct" },
  ]},
  { title: "Pricing & discounts", params: [
    { k: "priceIn", label: "Input price", unit: "$/Mtok", min: 0.2, max: 32, step: 0.05, log: true, tip: "priceIn",
      ticks: [{ v: 0.55, l: "R1" }, { v: 2, l: "Sonnet 5", alt: true }, { v: 5, l: "Opus" }, { v: 10, l: "Opus fast", alt: true }] },
    { k: "priceOut", label: "Output price", unit: "$/Mtok", min: 0.8, max: 160, step: 0.25, log: true, tip: "priceOut",
      ticks: [{ v: 2.19, l: "R1" }, { v: 10, l: "Sonnet 5", alt: true }, { v: 25, l: "Opus" }, { v: 50, l: "Opus fast", alt: true }] },
    { k: "cacheReadMult", label: "Cache-read price", unit: "% of input", min: 0, max: 100, step: 1, tip: "cacheReadMult",
      ticks: [{ v: 10, l: "Anthropic 10%" }] },
    { k: "cacheWriteShare", label: "Cache-write share", unit: "% of fresh input", min: 0, max: 100, step: 5, tip: "cacheWriteShare" },
    { k: "cacheWriteMult", label: "Cache-write price", unit: "% of input", min: 100, max: 200, step: 5, tip: "cacheWriteMult", showIf: s => s.cacheWriteShare > 0,
      ticks: [{ v: 125, l: "OpenAI/Anthropic 5-min" }, { v: 200, l: "Anthropic 1-hr", alt: true }] },
    { k: "cacheCost", label: "Cache-read serving cost", unit: "% of prefill", min: 0, max: 25, step: 1, tip: "cacheCost" },
    { k: "billCacheHit", label: "Billable cached-input share", unit: "%", min: 0, max: 95, step: 1, tip: "billCacheHit", nullable: "= serving reuse" },
    { k: "batchShare", label: "Batch-API share", unit: "%", min: 0, max: 60, step: 1, tip: "batchShare" },
    { k: "discount", label: "Average discount off list", unit: "%", min: 0, max: 60, step: 1, tip: "discount" },
  ]},
];

/* ---------- engine ---------- */
function hwHourCost(hw, s) {
  if (s.hwMode === "rent") return hw.rent * s.rentMult;
  const capex = hw.capex * s.clusterOh;
  const capexHr = capex / (s.lifeYears * 8760);
  const dcHr = (s.dcPerW * hw.tdp * 1000) / (12 * 8760); // DC shell amortized 12y
  const powerHr = hw.tdp * s.pue * s.kwh;
  const opexHr = capexHr * (s.opexPct / 100);
  return capexHr + dcHr + powerHr + opexHr;
}
function hwHourParts(hw, s) { // for the stack chart (TCO mode)
  const capex = hw.capex * s.clusterOh;
  return {
    capex: capex / (s.lifeYears * 8760),
    power: hw.tdp * s.pue * s.kwh,
    dc: (s.dcPerW * hw.tdp * 1000) / (12 * 8760),
    opex: (capex / (s.lifeYears * 8760)) * (s.opexPct / 100),
  };
}
function precMult(hw, s) {
  const p = (s.precision === "fp4" && !hw.fp4) ? "fp8" : s.precision; // no FP4 on Hopper/TPU/Trn2
  return PRECISION_MULT[p];
}
function tokPerS(hw, s, kind, activeOverride) {
  const active = (activeOverride ?? s.active) * 1e9;
  const eff = (kind === "out" ? hw.effDec * INTERACT_MULT[s.interact] : hw.effPre) * s.stackMult;
  return (hw.flopsFp8 * 1e15 * precMult(hw, s) * eff) / (2 * active);
}
function costPerMtok(hw, s, kind, activeOverride) {
  const hr = hwHourCost(hw, s);
  return hr / 3600 / tokPerS(hw, s, kind, activeOverride) * 1e6 / (s.util / 100);
}
function blendWeights(s) {
  const total = HW_ORDER.reduce((a, k) => a + (s.blend[k] || 0), 0);
  if (!total) return { h100: 1 };
  const w = {};
  HW_ORDER.forEach(k => { if (s.blend[k] > 0) w[k] = s.blend[k] / total; });
  return w;
}
function blendedCost(s, kind, activeOverride) {
  const w = blendWeights(s);
  return Object.entries(w).reduce((a, [k, wt]) => a + wt * costPerMtok(HW[k], s, kind, activeOverride), 0);
}
function workload(s, activeOverride) {
  const R = s.ioRatio, h = s.cacheHit / 100;               // serving-side prefix-reuse share (cost)
  const hb = (s.billCacheHit ?? s.cacheHit) / 100;         // billable cached-input share (revenue); null = assumed equal
  const cIn = blendedCost(s, "in", activeOverride);
  const cOut = blendedCost(s, "out", activeOverride);
  const cCache = cIn * (s.cacheCost / 100);
  const costMix = (cOut + R * ((1 - h) * cIn + h * cCache)) / (R + 1);
  const discMult = (1 - (s.batchShare / 100) * 0.5) * (1 - s.discount / 100);
  const w = (s.cacheWriteShare || 0) / 100, wm = (s.cacheWriteMult || 100) / 100;
  const freshBill = s.priceIn * ((1 - w) + w * wm); // fresh input; written share bills at the write premium
  const priceMixList = (s.priceOut + R * ((1 - hb) * freshBill + hb * s.priceIn * (s.cacheReadMult / 100))) / (R + 1);
  const priceMix = priceMixList * discMult;
  return { cIn, cOut, cCache, costMix, priceMix, priceMixList, margin: priceMix > 0 ? 1 - costMix / priceMix : NaN };
}
function marginOnHw(hwKey, s) {
  const one = structuredClone(s);
  one.blend = { [hwKey]: 100 };
  return workload(one);
}
function feasibility(s) {
  const w = blendWeights(s);
  const domKey = Object.entries(w).sort((a, b) => b[1] - a[1])[0][0];
  const hw = HW[domKey];
  const bytes = { bf16: 2, fp8: 1, fp4: 0.5 }[s.precision];
  const gb = s.total * bytes;
  const gpus = Math.ceil(gb / (hw.hbm * 0.7));
  return { domKey, gpus, gb, racks: Math.ceil(gpus / 72) };
}

/* ---------- formatting ---------- */
const fmt$ = v => v >= 100 ? "$" + Math.round(v).toLocaleString() : v >= 10 ? "$" + v.toFixed(1) : v >= 1 ? "$" + v.toFixed(2) : "$" + v.toFixed(v >= 0.1 ? 2 : 3);
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
  const prof = id => TRAFFIC_PROFILES.find(t => t.id === id);
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
    const t = prof(m.nativeTraffic) || TRAFFIC_PROFILES[0];
    return { ioRatio: t.ioRatio, cacheHit: t.cacheHit, profileId: t.id, mode: "replay-locked", locked: true,
             label: t.name + " (model default — locked by replay)", origin: "replay+native" };
  }
  if (sel && sel.mode === "custom")
    return { ioRatio: sel.ioRatio, cacheHit: sel.cacheHit, profileId: null, mode: "custom", locked: false, label: "Custom", origin: "user" };
  if (sel && sel.mode === "explicit") {
    const t = prof(sel.profileId) || TRAFFIC_PROFILES[0];
    return { ioRatio: t.ioRatio, cacheHit: t.cacheHit, profileId: t.id, mode: "explicit", locked: false, label: t.name, origin: "profile" };
  }
  const t = prof(m.nativeTraffic) || TRAFFIC_PROFILES[0];
  return { ioRatio: t.ioRatio, cacheHit: t.cacheHit, profileId: t.id, mode: "native", locked: false,
           label: t.name + " (model default)", origin: "native" };
}
function applyPresetSettings(m, p, sel = { mode: "native" }) {
  const s = structuredClone(DEFAULTS);
  const pset = (p.id === "dive") ? (m.dive || PERSPECTIVES.find(x => x.id === "median").set) : p.set;
  for (const [k, v] of Object.entries(pset)) if (!MODEL_OWNED_KEYS.includes(k)) s[k] = structuredClone(v);
  for (const [k, v] of Object.entries(m.set)) s[k] = structuredClone(v);
  for (const k of MODEL_OWNED_KEYS) if (pset[k] !== undefined && m.set[k] === undefined) s[k] = structuredClone(pset[k]);
  if (p.id === "dive" && m.dive) for (const [k, v] of Object.entries(m.dive)) s[k] = structuredClone(v);
  const tr = resolveTraffic(m, p, sel);
  s.ioRatio = tr.ioRatio; s.cacheHit = tr.cacheHit;
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
function lensSpan(m, sel = { mode: "native" }) {
  const tr = resolveTraffic(m, PERSPECTIVES.find(p => p.id === "median"), sel);
  const compat = PERSPECTIVES.filter(p => p.kind === "lens" && pairingWarning(m, p) === "");
  const contributors = compat.map(p => {
    const s = applyPresetSettings(m, p, sel);
    s.ioRatio = tr.ioRatio; s.cacheHit = tr.cacheHit; // byte-identical traffic for every contributor
    const margin = workload(s).margin;
    return { id: p.id, ioRatio: s.ioRatio, cacheHit: s.cacheHit, margin };
  }).filter(c => isFinite(c.margin));
  if (contributors.length < 2) return contributors.length === 1
    ? { lo: contributors[0].margin, hi: contributors[0].margin, n: 1, single: true, contributors, ioRatio: tr.ioRatio, cacheHit: tr.cacheHit, label: tr.label }
    : null;
  const ms = contributors.map(c => c.margin);
  return { lo: Math.min(...ms), hi: Math.max(...ms), n: contributors.length, single: false, contributors,
           ioRatio: tr.ioRatio, cacheHit: tr.cacheHit, label: tr.label };
}


/* Scenario-diff sanitizer (v2.1.2 reception remediation): a shared link's overlay may only
   touch known state keys with sane numeric/string values, and may NEVER override the traffic
   of a locked replay (that was a forgery vector: a v3 link could claim the locked xAI replay
   while smuggling 300:1/95% traffic past the resolver). Returns {diff, rejected:[...]}. */
const SCENARIO_BOUNDS = { // hard schema for shared-link overlays: [min, max] or enum list
  active: [1, 5000], total: [10, 50000], ioRatio: [1, 1000], cacheHit: [0, 95], billCacheHit: [0, 95],
  cacheCost: [0, 100], rentMult: [0.02, 20], util: [1, 100], stackMult: [0.1, 5],
  kwh: [0.01, 1], pue: [1, 3], dcPerW: [1, 50], lifeYears: [1, 15], clusterOh: [1, 3], opexPct: [0, 50],
  priceIn: [0.01, 500], priceOut: [0.01, 2000], cacheReadMult: [0, 100], cacheWriteShare: [0, 100],
  cacheWriteMult: [100, 400], batchShare: [0, 100], discount: [0, 95], subPlan: [1, 10000], subUsage: [0, 1e7],
  precision: Object.keys(PRECISION_MULT), interact: Object.keys(INTERACT_MULT), hwMode: ["rent", "tco"],
};
function sanitizeScenarioDiff(diff, traffic) {
  const clean = {}, rejected = [];
  for (const [k, v] of Object.entries(diff || {})) {
    if (k === "_meta") continue;
    if (!(k in DEFAULTS)) { rejected.push(k + " (unknown key)"); continue; }
    const dv = DEFAULTS[k], b = SCENARIO_BOUNDS[k];
    // Nullable-numeric fields (billCacheHit: default null = "assumed equal", numeric bounds [0,95])
    // are numbers when set. Keying the branch on typeof dv alone sent them to the object branch
    // (typeof null === "object") and rejected a valid {billCacheHit:95} as "bad object" — a valid
    // override silently dropped on share-link load, reverting the margin (fixed 2026-07-12).
    if (typeof dv === "number" || (dv === null && Array.isArray(b) && typeof b[0] === "number")) {
      if (typeof v !== "number" || !isFinite(v)) { rejected.push(k + " (non-numeric)"); continue; }
      if (Array.isArray(b) && (v < b[0] || v > b[1])) { rejected.push(k + " (out of range " + b[0] + ".." + b[1] + ")"); continue; }
    } else if (typeof dv === "string") {
      if (typeof v !== "string") { rejected.push(k + " (bad string)"); continue; }
      if (Array.isArray(b) && !b.includes(v)) { rejected.push(k + " (invalid value)"); continue; }
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
  return { diff: clean, rejected };
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
const ENGINE_REVISION = "v2.1.5-2026-07-15"; // v2.1.5: permalink round-trip baseline fix (encoder diffs against the loader's preset baseline, not global DEFAULTS) + source-currency corrections (arXiv IKP v2 figures, §4 cumulative multiplier, xAI fleet-count derivation wording) from the 2026-07-15 Sol release inspection
const DATA_AS_OF = "2026-07-15";
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
/* Supported traffic-identity modes — the closed enum a link's _meta.traffic.mode must belong to.
   Anything else is a forged/garbage identity and the token is rejected whole (fail closed). */
const TRAFFIC_MODES = ["native", "explicit", "custom", "legacy-custom", "replay-locked"];
function encodeScenario(S, modelId, perspId, traffic, modifiedFrom) {
  /* Round-trip baseline (P0 fix, 2026-07-15): the decoder restores a CLEAN identity as
     applyPresetSettings(model, persp, declared traffic) + diff, so the encoder must diff
     against that SAME baseline. Diffing against global DEFAULTS silently dropped any field
     the user set TO a global-default value that differs from the preset's own (e.g. GPT
     active 105→300): the omitted key reverted to the preset value on load and the link
     reproduced different numbers. MODIFIED-identity links restore from global DEFAULTS
     (see the loader), so those keep the DEFAULTS baseline.  */
  const isModified = perspId === "__modified" || perspId === "__modified-exploration";
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
  for (const [k, v] of Object.entries(S)) if (JSON.stringify(v) !== JSON.stringify(base[k])) diff[k] = v;
  diff._meta = { dataAsOf: DATA_AS_OF, schema: "v4", engine: ENGINE_REVISION, model: modelId, persp: perspId,
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
    return "v4." + _toB64(JSON.stringify(diff));
  }
  // v4: an exploration route's identity travels REDUNDANTLY — the persp id plus
  // { rangeId, configId } — so the decoder can cross-check the pair and reject any link whose
  // declared identities disagree (P0-6), instead of rendering a mislabeled state.
  const p = PERSPECTIVES.find(x => x.id === perspId);
  if (p && p.kind === "exploration") {
    const b = explorationComputedBucket(p);
    diff._meta.explore = { rangeId: b ? b.id : null, configId: p.id };
  }
  return "v4." + _toB64(JSON.stringify(diff));
}
function decodeScenario(str) {
  if (!str) return null;
  const v4 = str.startsWith("v4."), v3 = str.startsWith("v3."), v2 = str.startsWith("v2.");
  if (!v4 && !v3 && !v2) return null; // versioned: unknown formats are ignored, never guessed
  // (The same rule is what makes the v4 boundary safe in the OTHER direction: the shipped v3
  // decoder accepted only "v3."/"v2." prefixes, so a v4 link loaded by a stale cached engine
  // returns null — the link is disregarded whole and the default state renders. A v4 link is
  // never half-read by an older engine.)
  try {
    const d = JSON.parse(_fromB64(str.slice(3)));
    d._meta = d._meta || {};
    const prefixSchema = v4 ? "v4" : v3 ? "v3" : "v2";
    // The TOKEN PREFIX is the schema authority. A token declaring a different inner schema was a
    // forgery vector (it routed into the lock-overriding legacy-migration path). Disagreement = reject.
    if (d._meta.schema && d._meta.schema !== prefixSchema) return null;
    d._meta.schema = prefixSchema;
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
      if (t.mode === "explicit" && !TRAFFIC_PROFILES.some(x => x.id === t.profileId)) return null;
    }
    if (prefixSchema === "v4") {
      // v4 links always carry a full traffic identity (validated above); a token without one was
      // not minted by this encoder and cannot be restored atomically — reject, never guess.
      if (t === undefined || t === null) return null;
      /* FAIL-CLOSED IDENTITY RESOLUTION (identity-integrity regression fix): a v4 link's numeric
         diff may only ever be applied under the identity it declares. The declared model must
         resolve to a real entry, and the perspective must either resolve (after retired-id
         normalization) or be an explicit, well-formed MODIFIED identity. Otherwise the token
         cannot be restored under a truthful label — reject it whole so the default state renders;
         NEVER substitute a default identity under the link's numbers.
         (v3/v2 tokens carry looser metadata by history; their identity gate lives in the loader,
         which refuses the whole link before mutating any state when model/persp do not resolve.) */
      if (!MODELS.some(x => x.id === d._meta.model)) return null;
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
        const prof = TRAFFIC_PROFILES.find(x => x.id === t.profileId);
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
            const nat = TRAFFIC_PROFILES.find(x => x.id === (m && m.nativeTraffic));
            if (!nat || nat.ioRatio !== t.ioRatio || nat.cacheHit !== t.cacheHit) return null;
          }
        }
        // custom / legacy-custom carry their own numbers by definition — nothing to contradict.
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
  return TRAFFIC_PROFILES.find(t => t.ioRatio === ioRatio && t.cacheHit === cacheHit) || null;
}
function migrateV2Traffic(m, p, diff) {
  const nat = TRAFFIC_PROFILES.find(t => t.id === m.nativeTraffic) || TRAFFIC_PROFILES[0];
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
    HW, HW_ORDER, GEN_TIMELINE, RUBIN, PRECISION_MULT, INTERACT_MULT, DEFAULTS,
    MODELS, PERSPECTIVES, MODEL_OWNED_KEYS, TIPS, SECTIONS, TRAFFIC_PROFILES,
    applyPresetSettings, resolveTraffic, lensSpan, pairingWarning, pairingSeverity,
    encodeScenario, decodeScenario, migrateV2Traffic, sanitizeScenarioDiff, matchTrafficProfile, overlayDivergesFromReplay, SCENARIO_BOUNDS, TRAFFIC_MODES, ENGINE_REVISION, DATA_AS_OF,
    normalizePerspId, reconcileLinkTraffic,
    hwHourCost, hwHourParts, precMult, tokPerS, costPerMtok,
    blendWeights, blendedCost, workload, marginOnHw, feasibility,
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
      params: { active: { src: "Page-authored 300B scenario value. TeorTaxes's cited corpus supplies only a qualitative Fable observation ('shockingly FEW active') and a relative Opus bound; GPT-5.6 Pro's independent consult also centered on 300B — neither supplies a measured count", label: "SPECULATION" }, total: { src: "Deduction from Musk's Apr 2026 post (Grok 0.5T = 1/10 Opus); knowledge-probe methods carry ±3× bars", label: "COMMUNITY ESTIMATE" }, precision: { src: "Assumed frontier norm; FP8 paths standard on H100+ fleets", label: "SPECULATION" }, priceIn: { src: "Anthropic price list", label: "DISCLOSED" }, priceOut: { src: "Anthropic price list", label: "DISCLOSED" } },
      assumes: ["A 6% activation ratio MoE (300B/5T) — the single most load-bearing guess on the page", "List API pricing; no fast-mode or enterprise-discount mix"],
      falsifiers: ["Any credible active-parameter disclosure or leak", "A serving-speed measurement incompatible with ~300B active at known hardware"],
    },
    sonnet: {
      attribution: "calculator-synthesis",
      who: "Sonnet 5 at its introductory tariff, with architecture carried over from the 4.x-era analysis.",
      anchor: { quote: "Introductory pricing: $2/$10 per MTok through August 31, 2026; $3/$15 thereafter.", url: "https://platform.claude.com/docs/en/about-claude/pricing" },
      params: { active: { src: "4.x-era estimate; Sonnet 5's architecture is undisclosed", label: "SPECULATION" }, total: { src: "Musk post deduction (Grok = ½ Sonnet 4.x); carried over", label: "SPECULATION" }, precision: { src: "Assumed frontier norm", label: "SPECULATION" }, priceIn: { src: "Anthropic pricing page (intro through Aug 31, 2026)", label: "DISCLOSED" }, priceOut: { src: "Anthropic pricing page (intro through Aug 31, 2026)", label: "DISCLOSED" } },
      assumes: ["Sonnet 5 ≈ Sonnet 4.x economically — but its tokenizer emits ~30% more tokens per text, so per-text margins differ from per-token ones"],
      falsifiers: ["Sonnet 5 architecture disclosure", "Sep 1 standard tariff (flip prices to $3/$15)"],
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
      params: { active: { src: "Zephyr '~100B active range' + Epoch's independent inference-economics estimate (80% range 50–220B)", label: "COMMUNITY ESTIMATE" }, total: { src: "Dive central ~5T; subjective range 1–20T — effective-capacity probes allow 3–29T", label: "SPECULATION" }, precision: { src: "MXFP4 demonstrated in gpt-oss; Sol's production layers undisclosed", label: "SPECULATION" }, priceIn: { src: "OpenAI API pricing (Standard short-context)", label: "DISCLOSED" }, priceOut: { src: "OpenAI API pricing", label: "DISCLOSED" }, ioRatio: { src: "7 cached : 2 fresh : 1 output benchmark convention (Artificial Analysis)", label: "CREDIBLY REPORTED" }, cacheHit: { src: "Same 7:2:1 convention (7/9 of input cached)", label: "CREDIBLY REPORTED" }, blend: { src: "Hopper/Blackwell across Microsoft/OCI/CoreWeave (disclosed platforms; shares guessed)", label: "SPECULATION" } },
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
      params: { active: { src: "Dive central ~200B (13% activation); range 100–500B — Grok-2's lineage ran unusually dense (42.7%)", label: "SPECULATION" }, total: { src: "Musk statement, corroborated by Cursor's MoE description", label: "DISCLOSED" }, precision: { src: "Grok-2 recipe was FP8/TP8 — best public prior", label: "SPECULATION" }, priceIn: { src: "xAI API pricing (launched Jul 8, 2026)", label: "DISCLOSED" }, priceOut: { src: "xAI API pricing", label: "DISCLOSED" }, cacheReadMult: { src: "$0.50 cached / $2.00 input = 25%", label: "DISCLOSED" }, blend: { src: "Colossus I/II composition per SpaceXAI prospectus (shares approximated)", label: "CREDIBLY REPORTED" } },
      assumes: ["The full-cycle-TCO cost lens (see the xAI card: cash-marginal and opportunity-cost lenses give ~92% and ~29%)"],
      falsifiers: ["Active-parameter or replica-configuration disclosure", "Aggregate throughput telemetry", "Changes to the Anthropic/Google capacity contracts that re-price the opportunity cost"],
    },
    kimi: {
      attribution: "reconstruction",
      who: "Moonshot's coding flagship — open weights make the architecture the best-evidenced on the page; the fleet is the mystery.",
      anchor: { quote: "1.0T total parameters; 32B activated per token; … native selective, weight-only INT4.", url: "research/moonshot-gptpro.html" },
      params: { active: { src: "Open checkpoint config", label: "DISCLOSED" }, total: { src: "Open checkpoint (595GB)", label: "DISCLOSED" }, precision: { src: "Released weights are INT4; hosted path undisclosed — 8-bit modeled", label: "SPECULATION" }, priceIn: { src: "Moonshot platform pricing", label: "DISCLOSED" }, priceOut: { src: "Moonshot platform pricing", label: "DISCLOSED" }, cacheReadMult: { src: "$0.19/$0.95 = 20%", label: "DISCLOSED" }, blend: { src: "Historical A800/H800 production (Mooncake); current fleet undisclosed", label: "SPECULATION" } },
      assumes: ["§10's 81% headline is OUTPUT-TOKEN margin; the blended figure here uses a workload the dive itself declined to estimate"],
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
      params: { active: { src: "Official release + technical report", label: "DISCLOSED" }, total: { src: "Official release", label: "DISCLOSED" }, precision: { src: "Selective FP4 (routed experts + indexer; KV BF16/FP8) — modeled as fp4 where hardware supports it", label: "DISCLOSED" }, priceIn: { src: "api-docs.deepseek.com pricing (Jul 9)", label: "DISCLOSED" }, priceOut: { src: "api-docs.deepseek.com pricing", label: "DISCLOSED" }, cacheReadMult: { src: "$0.003625/$0.435 = 0.83% (slider granularity: 1%)", label: "DISCLOSED" }, ioRatio: { src: "2025 disclosed traffic shape carried forward", label: "SPECULATION" }, cacheHit: { src: "2025 disclosed 56.3% carried forward", label: "SPECULATION" }, blend: { src: "H800 stock + reported Ascend 950 involvement; split unknown", label: "SPECULATION" } },
      assumes: ["Pre-surcharge base tariff (a 2× peak-window price was announced for mid-July)", "V4 work-per-token ≈ V3 stack scaled by architecture (no V4 production throughput disclosure exists)"],
      falsifiers: ["A V4 serving disclosure like 2025's", "Fleet-split reporting", "The peak tariff going live (raises realized margins toward ~84% in-window)"],
    },
    glm: {
      attribution: "reconstruction",
      who: "Zhipu's flagship: disclosed architecture, audited segment financials — and a nine-platform domestic fleet nobody can see into.",
      anchor: { quote: "FY2025 cloud/API gross margin 18.9%, after −0.4% in H1 2025.", url: "research/zhipu-gptpro.html" },
      params: { active: { src: "Open release", label: "DISCLOSED" }, total: { src: "Open release", label: "DISCLOSED" }, precision: { src: "BF16/FP8 checkpoints; first-party serving precision undisclosed (W8A8/W4A8 recipes exist)", label: "SPECULATION" }, priceIn: { src: "Z.ai international pricing", label: "DISCLOSED" }, priceOut: { src: "Z.ai international pricing", label: "DISCLOSED" }, cacheReadMult: { src: "$0.26/$1.40 = 19%", label: "DISCLOSED" }, ioRatio: { src: "Site-authored Zhipu-dive assumption; @_xjdr reported 81k average inputs but no output-length or I/O split", label: "SPECULATION" }, cacheHit: { src: "@_xjdr ncode-week report (their measured cache-hit rate)", label: "CREDIBLY REPORTED" }, blend: { src: "Nine domestic platforms named, zero shares disclosed", label: "SPECULATION" } },
      assumes: ["Direct-API economics (the Coding Plan realizes a small fraction of list value)"],
      falsifiers: ["Platform traffic-share disclosure", "STAR-market prospectus with unit economics", "A first-party throughput figure"],
    },
    dsv4f: {
      attribution: "reconstruction",
      who: "DeepSeek's small-tier flagship — disclosed architecture at a tariff the dive showed cannot be served on the old cost structure.",
      anchor: { quote: "Current V4-Flash [would earn] −2.2% [on the 2025 cost structure] — it must benefit from its much smaller 13B-active model, better batching/hardware, strategic subsidy, or a different workload mix.", url: "research/deepseek-gptpro.html" },
      params: { active: { src: "Official release", label: "DISCLOSED" }, total: { src: "Official release", label: "DISCLOSED" }, precision: { src: "Same selective-FP4 family as V4 Pro", label: "DISCLOSED" }, priceIn: { src: "api-docs.deepseek.com pricing", label: "DISCLOSED" }, priceOut: { src: "api-docs.deepseek.com pricing", label: "DISCLOSED" }, cacheReadMult: { src: "$0.0028/$0.14 = 2%", label: "DISCLOSED" }, ioRatio: { src: "2025 traffic shape carried forward", label: "SPECULATION" }, cacheHit: { src: "2025 disclosed 56.3% carried forward", label: "SPECULATION" }, blend: { src: "Same speculative China mix as V4 Pro", label: "SPECULATION" } },
      assumes: ["Flash traffic resembles Pro traffic (its 2,500-concurrency tier suggests it absorbs the bulk demand)"],
      falsifiers: ["Any Flash-specific serving disclosure", "Fleet-split reporting"],
    },
    glm47: {
      attribution: "reconstruction",
      who: "Zhipu's workhorse — the model its own Coding Plan routes routine work to, at a distinctly lower price floor than GLM-5.2.",
      anchor: { quote: "Z.ai's Coding Plan documentation recommends GLM-4.7 for routine work and GLM-5.2 for harder tasks.", url: "research/zhipu-gptpro.html" },
      params: { active: { src: "Open release", label: "DISCLOSED" }, total: { src: "Open release", label: "DISCLOSED" }, precision: { src: "BF16/FP8 checkpoints; first-party serving precision undisclosed", label: "SPECULATION" }, priceIn: { src: "Z.ai pricing", label: "DISCLOSED" }, priceOut: { src: "Z.ai pricing", label: "DISCLOSED" }, cacheReadMult: { src: "$0.11/$0.60 ≈ 18%", label: "DISCLOSED" }, ioRatio: { src: "Carries over GLM-5.2's site-assumed 8:1; no GLM-4.7 traffic telemetry supports it", label: "SPECULATION" }, cacheHit: { src: "@_xjdr ncode-week 41% carried over; no GLM-4.7 telemetry", label: "SPECULATION" }, blend: { src: "As GLM-5.2 — nine platforms named, shares unknown", label: "SPECULATION" } },
      assumes: ["Same fleet and workload shape as 5.2 (only the model and tariff differ)"],
      falsifiers: ["Same as GLM-5.2's card"],
    },
    terra: {
      attribution: "calculator-synthesis",
      who: "A tariff scenario, not a provider estimate: Terra's price is disclosed; everything architectural is a scenario value inside the dive's wide ranges.",
      anchor: { quote: "It need not be a simple half-sized Sol.", url: "research/openai-gptpro.html" },
      params: { active: { src: "Scenario central from dive range 20–110B", label: "SPECULATION" }, total: { src: "Scenario central from dive range 0.25–5T", label: "SPECULATION" }, precision: { src: "Family assumption", label: "SPECULATION" }, priceIn: { src: "OpenAI pricing", label: "DISCLOSED" }, priceOut: { src: "OpenAI pricing", label: "DISCLOSED" }, cacheReadMult: { src: "90% cache discount (OpenAI standard)", label: "DISCLOSED" }, ioRatio: { src: "Same 7:2:1 convention as Sol", label: "CREDIBLY REPORTED" }, cacheHit: { src: "Same convention", label: "CREDIBLY REPORTED" }, blend: { src: "Sol's fleet assumption", label: "SPECULATION" } },
      assumes: ["That a margin computed from scenario sizes means anything — read the range, not the point"],
      falsifiers: ["Any Terra architecture disclosure (would convert this from scenario to estimate)"],
    },
    luna: {
      attribution: "calculator-synthesis",
      who: "A tariff scenario for OpenAI's fast tier: price and user-stream speed are identified; the architecture is not.",
      anchor: { quote: "measured ~205–229 output tokens/s … It could instead be a much larger model with more aggressive distillation, routing, or speculative decoding.", url: "research/openai-gptpro.html" },
      params: { active: { src: "Scenario central from dive range 8–50B", label: "SPECULATION" }, total: { src: "Scenario central from dive range 0.05–1.5T", label: "SPECULATION" }, precision: { src: "Family assumption", label: "SPECULATION" }, priceIn: { src: "OpenAI pricing", label: "DISCLOSED" }, priceOut: { src: "OpenAI pricing", label: "DISCLOSED" }, cacheReadMult: { src: "90% cache discount", label: "DISCLOSED" }, ioRatio: { src: "Sol convention", label: "CREDIBLY REPORTED" }, cacheHit: { src: "Sol convention", label: "CREDIBLY REPORTED" }, blend: { src: "Sol's fleet assumption", label: "SPECULATION" } },
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
      who: "This page's own synthesis (report §5): what a competent operator pays without hyperscaler-partner privileges.",
      anchor: { quote: "neocloud-level hardware cost, 50% fleet utilization, current open-source-level serving stack, balanced latency", url: "#s5" },
      params: { hwMode: { src: "Rental basis — market-observable, unlike internal TCO; the basis choice is the page's", label: "SPECULATION" }, rentMult: { src: "Neocloud list ≈ 1.0× the HW table's rates", label: "COMMUNITY ESTIMATE" }, util: { src: "Page-set 30–60% sensitivity band, middle", label: "SPECULATION" }, stackMult: { src: "Open-source-best (SGLang-class) = 1.0 by construction", label: "COMMUNITY ESTIMATE" }, interact: { src: "Balanced latency — neither batch-farm nor premium-interactive", label: "SPECULATION" }, batchShare: { src: "Modest batch-tier adoption", label: "SPECULATION" }, discount: { src: "Light enterprise discounting", label: "SPECULATION" } },
      assumes: ["No strategic-partner pricing", "No free traffic"],
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
      anchor: { quote: "What would have to be true for a ≥90% modeled unit direct-serving contribution margin at the flagship scope?", url: "#s5" },
      params: { hwMode: { src: "Page-chosen owned-TCO basis — hourly cost built from capex, power, datacenter and opex", label: "SPECULATION" }, util: { src: "Page-set 55% occupancy scenario value", label: "SPECULATION" }, stackMult: { src: "Page-set 1.1× serving-stack scenario value", label: "SPECULATION" }, interact: { src: "Central-scenario balanced latency", label: "SPECULATION" }, batchShare: { src: "Central-scenario 15% batch-tier share", label: "SPECULATION" }, discount: { src: "Central-scenario 5% blended discount", label: "SPECULATION" } },
      assumes: ["A lab's fleet behaves like a well-run owned estate (depreciation schedule choices dominate)"],
      falsifiers: ["Evidence of actual procurement costs far from owned-TCO equivalence"],
    },
    "x80-v3": {
      attribution: "calculator-synthesis",
      who: "PAGE-AUTHORED RECONSTRUCTION of one route into the 80–90% range the discourse points at (a floor 'north of 80%' for Opus API tokens; an earlier ~80% inference-only read — both verbatim in the claims registry): market rents, an aggressive serving stack, throughput serving. This page's own route, NOT any external party's cost model — no external party selected this vector.",
      anchor: { quote: "What would have to be true for an 80–90% modeled unit direct-serving contribution margin at the flagship scope?", url: "#s5" },
      params: { hwMode: { src: "Page-set market-rental basis", label: "SPECULATION" }, rentMult: { src: "Market spot rate = this page's base H100 rate (1.0×)", label: "COMMUNITY ESTIMATE" }, util: { src: "Page-set 70% fleet-utilization scenario value", label: "SPECULATION" }, stackMult: { src: "Page-set 1.25× serving-stack scenario value", label: "SPECULATION" }, interact: { src: "Page-set throughput-first serving", label: "SPECULATION" }, batchShare: { src: "Page-set 10% batch-price share", label: "SPECULATION" }, discount: { src: "Page-set 0% negotiated discount", label: "SPECULATION" } },
      assumes: ["A frontier lab out-executes the open-source serving baseline by ~25%", "Latency demands don't bind"],
      falsifiers: ["Fleet-utilization evidence below ~50%", "Evidence of hyperscaler-markup procurement rates"],
    },
    "x80-v4": {
      attribution: "calculator-synthesis",
      who: "PAGE-AUTHORED RECONSTRUCTION of a second route into the 80–90% discourse range: sub-market rents with an above-baseline stack. This page's own route, NOT any external party's cost model — no external party selected this vector.",
      anchor: { quote: "What would have to be true for an 80–90% modeled unit direct-serving contribution margin at the flagship scope?", url: "#s5" },
      params: { hwMode: { src: "Page-set market-rental basis", label: "SPECULATION" }, rentMult: { src: "Page-set 0.90× scenario value", label: "SPECULATION" }, util: { src: "Page-set 65% occupancy scenario value", label: "SPECULATION" }, stackMult: { src: "Page-set 1.15× serving-stack scenario value", label: "SPECULATION" }, interact: { src: "Page-set throughput-first serving", label: "SPECULATION" }, batchShare: { src: "Page-set 10% batch-price share", label: "SPECULATION" }, discount: { src: "Page-set 0% negotiated discount", label: "SPECULATION" } },
      assumes: ["Modestly privileged procurement and a better-than-OSS stack, without full strategic-partner rates"],
      falsifiers: ["Evidence of the actual blended $/chip-hour paid", "Fleet-occupancy evidence well below 65%"],
    },
    "x60-v3": {
      attribution: "calculator-synthesis",
      who: "PAGE-AUTHORED RECONSTRUCTION tied to the reported/accounting <60% discourse (reported ~40–50% frontier inference margins; a reported ~40% company gross-margin projection — records in the claims registry and §7): it shows what UNIT direct-serving inputs would be required to back out a reported-low figure. It lands at ≈22% — WELL BELOW the reported 40–50% band; that distance is the §7 reconciliation gap between a unit direct-serving margin and a reported company gross margin, not agreement with it. This page's own diagnostic, NOT any external party's cost model — a failed inversion does not falsify any reported figure.",
      anchor: { quote: "What would have to be true for a <60% modeled unit direct-serving contribution margin at the flagship scope?", url: "#s5" },
      params: { hwMode: { src: "Page-chosen hyperscaler-rental basis to test the reported figures", label: "SPECULATION" }, rentMult: { src: "Cloud list ≈1.5-1.8× neocloud (market observation, page-selected)", label: "COMMUNITY ESTIMATE" }, util: { src: "Page-set 35% (peak-provisioning story)", label: "SPECULATION" }, stackMult: { src: "Page-set 0.85× scenario value", label: "SPECULATION" }, interact: { src: "Page-set balanced mode", label: "SPECULATION" }, batchShare: { src: "Page-set 25% scenario value", label: "SPECULATION" }, discount: { src: "Page-set 20% (enterprise discounting is real, the level is page-chosen)", label: "SPECULATION" } },
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
      who: "Ant Group's published production H20 serving — the page's H20 anchor, made selectable at its middle latency tier.",
      anchor: { quote: "714 output tok/s/GPU (<70ms tier); 675 (<50ms); 423 (<30ms).", url: "https://www.lmsys.org/blog/2025-09-26-sglang-ant-group/" },
      params: { hwMode: { src: "Rental at the page's H20 IDC rate", label: "SPECULATION" }, rentMult: { src: "1.0 — Ant's own cost basis is undisclosed", label: "SPECULATION" }, util: { src: "100 = measured-operating-point convention (per-occupied-chip); Ant's fleet occupancy is undisclosed", label: "SPECULATION (convention)" }, stackMult: { src: "1.0 = the Pro tier this page's H20 MFU is fit to", label: "DISCLOSED (anchor)" }, interact: { src: "Their production batching", label: "DISCLOSED" }, batchShare: { src: "Not applicable", label: "SPECULATION" }, discount: { src: "Not applicable", label: "SPECULATION" }, blend: { src: "H20-only (their published deployment)", label: "DISCLOSED" } },
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
  { id: "patel-80-floor", who: "Dylan Patel (SemiAnalysis) — via a clip account, not his own post",
    verbatim: "Dylan Patel @dylan522p of SemiAnalysis: Anthropic's margin on an Opus 4.8 API token is north of 80%. … At 80%-plus, even doubling compute costs leaves Anthropic above 50% gross margin.",
    url: "https://x.com/PodcastAlphaX/status/2072119494563262697", date: "2026-07-01",
    sourceClass: "quoted-secondary", scopeLayer: "token-SKU", provenanceTier: "clip-mediated",
    metricScope: "unit-serving-informal", boundType: "floor",
    numeric: { lo: 80, hi: null },
    subjectScope: "Anthropic, Opus 4.8 API token",
    notClaimed: "an interval top — \"north of 80%\" is a floor, compatible with 85% and with 95%; the owned-TCO parameter vector on this page",
    binnable: true, relation: "compatible-with" },
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
  { id: "baker-85-clip", who: "Gavin Baker (Atreides) — via clip/recap accounts",
    verbatim: "I think Anthropic is worth $3 trillion today. They're going to end this year well over $100 billion in revenue, with 85% inference gross margins.",
    url: "https://x.com/n01man/status/2071177551729320276", date: "~2026-06-27–28 (All-In E278)",
    sourceClass: "quoted-secondary", scopeLayer: "token-SKU", provenanceTier: "clip-mediated",
    sweep: "2026-07-12",
    metricScope: "unit-serving-informal", boundType: "point",
    numeric: { lo: 85, hi: 85 },
    subjectScope: "Anthropic inference GM, All-In podcast, clip-mediated",
    notClaimed: "a post from the speaker's own account (the figure reaches X only via clip/recap accounts); a cost model behind the figure",
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
  // --- Model-generated scenario analysis: its own group, ZERO claimant weight (P0-8/Q9) ---
  { id: "gptpro-9296-model-generated", who: "GPT-5.6 Pro consult (model-generated scenario analysis — not a person's claim)",
    verbatim: "approximately 92–94% for Opus and 94–96% for Sonnet on a mature 2026 fleet.",
    url: "research/anthropic-gptpro.html", date: "2026-07-09",
    sourceClass: "model-generated", scopeLayer: "token-SKU", provenanceTier: "model-generated",
    metricScope: "unit-serving-informal", boundType: "interval",
    numeric: { lo: 92, hi: 96 },
    subjectScope: "Claude Opus (92–94) and Sonnet (94–96) on a modeled mature 2026 fleet",
    notClaimed: "human endorsement — model-generated analysis with zero claimant weight, rendered only in its own provenance-labeled group",
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
    reason: "model-size statement only — never a margin claimant" },
];

/* Interval algebra (P0-7): buckets are half-open [lo, hi); a claim's numeric interval is closed
   [lo, hi] as stated by its source. Membership = nonempty intersection, EXCEPT floors (hi null /
   boundType "floor"), which relate to every bucket at/above their lo as "compatible-with" and
   NEVER as interval membership (P0-2). Returns [{ bucketId, relation }]. */
function bucketForMargin(marginPct) {
  return MARGIN_BUCKETS.find(b => marginPct >= b.lo && marginPct < b.hi) || null;
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
const PERSPECTIVE_SPACE_KEYS = ["hwMode", "rentMult", "util", "stackMult", "interact", "batchShare", "discount", "blend"];
// P0-7: the ONLY sanctioned ordering label. No other basis language may describe this ranking.
const EXPLORATION_ORDER_BASIS = "fewest changed registry fields from the central configuration";
function changedFieldsFromCentral(p) {
  const central = PERSPECTIVES.find(x => x.id === "median").set;
  return PERSPECTIVE_SPACE_KEYS.filter(k =>
    JSON.stringify(p.set[k] ?? DEFAULTS[k]) !== JSON.stringify(central[k] ?? DEFAULTS[k])).length;
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
function explorationFlagshipMargin(p) {
  const m = MODELS.find(x => x.id === FLAGSHIP_SCOPE.modelId);
  return workload(applyPresetSettings(m, p, FLAGSHIP_SCOPE.traffic)).margin * 100;
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

if (typeof module !== "undefined" && module.exports) Object.assign(module.exports, {
  DOSSIERS,
  MARGIN_BUCKETS, MARGIN_CLAIMS, EMPTY_BUCKET_STATEMENT,
  bucketForMargin, claimBucketRelations, claimsForBucket,
  SWEEP_DISCLAIMER, provenanceTierLabel, NEGATIVE_FINDINGS_STATEMENT,
  PERSPECTIVE_SPACE_KEYS, EXPLORATION_ORDER_BASIS, changedFieldsFromCentral, rankExplorations,
  FLAGSHIP_SCOPE, explorationFlagshipMargin, explorationComputedBucket, RETIRED_PERSPECTIVES,
});
