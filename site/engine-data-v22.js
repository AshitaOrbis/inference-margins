/* IM3 slice-1a normative data registries — DATA ONLY (no functions beyond export plumbing).
   Authored 2026-07-18 against research/im3-integration-design.md v3.1 (the memo; DESIGN GATE CLOSED),
   research/im3-arch-constants.md (verified arch constants), and the FROZEN
   research/d2-equation-set-v2.md (equations §1, conventions §4.2, recipes §5 — read-only).
   Deployed-η arithmetic: research/im3-slice1a-derivations.md (every η shown and reproduced there).

   BINDING CONVENTIONS (memo §2, corrected per verification R2):
   - RENDER RULE: every render path uses q = 1, a = 1, for every model×hardware×regime combination.
     Spec-decode/MTP is a property of specific source OBSERVATIONS, never of hardware; where a
     calibration anchor's throughput embeds spec-decode (h20, gb300, ascend), that effect is absorbed
     INTO the deployed η exactly as it is in today's effDec scalar. Source-observation q/a values are
     recorded below as PROVENANCE ONLY and are never inputs to any render computation.
   - UNITS: fabric and bwHBM in B/s; flops in FLOP/s (absolute SI floats — not the TB/s / PFLOPS
     conventions of engine.js HW). Slice-1b dimensional tests assert this.
   - ABSENT ⇒ HARD ERROR (memo §6): a missing field is literally absent, never defaulted. Slice-1b
     code must hard-error on any render that depends on an absent field. NO placeholder numbers exist
     anywhere in this file.
   - Every value carries a provenance/status string (per-row `prov` maps; per-cell strings).
   This file is consumed by slice 1b and later; nothing in engine.js/app.js reads it yet.

   AMENDMENT (slice-1b review R5 + slice-2 family carry, 2026-07-18/19): (a) h800 nShard
   8 → 144 and h20 nShard 8 → 16 — the slice-1a declared widths carried STALE provenance;
   both deployment widths are explicitly published primary-source facts (DeepSeek Day-6
   EP144/DP144 decode unit; LMSYS/Ant 16×H20 Attention-DP16 + MoE-EP16 decode instance —
   cached under research/primary-sources/, cited per cell below). Slice 2 carries h800's sourced
   width to h100/h200 as an analyst family carry, consistent with those rows' η inheritance; the
   prior R5 text withholding that carry was a conservative absence-of-direct-receipt judgment,
   not contradictory deployment evidence. This closes memo §5's explicit slice-2-entry item.
   These amend the memo §5 cells; adjudication recorded in research/im3-slice1a-derivations.md §6.
   (b) New per-row `hbmBytes` field [B] — the slice-1b module's blanket `engine.js hbm GB × 1e9`
   conversion was ruled UNSUPPORTED (undercounts real framebuffer ~6.9% on NVIDIA parts);
   capacity is now registry data with per-cell provenance (observed framebuffer totals where
   receipts exist; labeled conventions otherwise). engine.js's `hbm` field is display-only and
   unchanged.

   AMENDMENT (NVL72 topology-sensitivity CORRECTION, 2026-07-20): the prior nShardRange shape
   (`baseline=8`, candidates 32 VERIFIED / 64 PENDING-VERIFICATION, `publishedMax=32`) is STALE.
   It wrongly treated a disaggregated 32-device decode-role world as a resident-weight shard count
   and left Kimi K3's 64+ communication-domain recommendation eligible for later promotion into
   the same scalar. The landed GPT Pro consult establishes that neither count is a model-specific
   replica-width fact for the closed Opus/5T scenario. gb200/gb300 now keep the live nShard = 8 as
   an explicitly declared analyst default and share a dimension-aware `topologySensitivity.cases`
   list. Only N_shard cases can reach a divisor; N_domain/N_world/N_role/N_replicas values are
   documentation-only and hard-rejected by the roofline path. Sources and adjudication:
   research/gptpro-reports/2026-07-20-replica-width-consult.md (sibling primary repository),
   research/primary-sources/nvl72-replica-widths-2026-07-20/capture.md, and
   research/im3-slice1a-derivations.md §6.7. */

"use strict";

/* =====================================================================================
   1. MODEL ARCHITECTURE REGISTRY (memo §3; constants from research/im3-arch-constants.md)
   Geometry only — active/total magnitudes stay on the engine's MODELS rows / sliders and
   drive the magnitude terms exactly as the frozen equations do (Φ = 2·A_m + F_attn(geom, L),
   W_iter = A_m·s_w MoE / Total·s_w/N dense, W_resident = Total·s_w/N_shard). Runtime slider
   changes to active/total rescale magnitudes, NEVER geometry (memo §3 archetype rule).
   attnClass: "mla" | "gqa" | "gqa-dense" | "out-of-model" — slice-1b branch tests assert
   out-of-model rows never enter the stated MLA/GQA branches.
   ===================================================================================== */

// Donor geometry records — the CONCRETE field sets of im3-arch-constants (memo §3 donor
// registry, verification-R2 fix: exact records, no aliases). Frozen at authoring time.
const DSR1_GEOM = Object.freeze({
  attnClass: "mla", mode: "moe-ep",
  layers: 61, hidden: 7168, qHeads: 128,
  qkDim: 192, vDim: 128, kvDim: 576, // qk = qkNope 128 + qkRope 64; kv = kvLora 512 + qkRope 64
  moeLayers: 58, topK: 8,
});
const QWEN3C_GEOM = Object.freeze({
  attnClass: "gqa", mode: "moe-ep",
  layers: 62, hidden: 6144, qHeads: 96, kvHeads: 8, headDim: 128,
  moeLayers: 62, topK: 8, // all-MoE, no shared expert
});
const LLAMA70_GEOM = Object.freeze({
  attnClass: "gqa-dense", mode: "dense-tp",
  layers: 80, hidden: 8192, qHeads: 64, kvHeads: 8, headDim: 128,
  // dense: no moeLayers/topK — absent by design (MoE fabric term inapplicable)
});

const ARCH_DONORS = {
  dsr1: { ...DSR1_GEOM, maxPos: 163840, status: "stated",
    prov: "stated — deepseek-ai/DeepSeek-R1 config.json (im3-arch-constants row 1); matches site/tests/roofline-diagnostic.mjs:6 exactly" },
  qwen3c: { ...QWEN3C_GEOM, maxPos: 262144, status: "stated",
    prov: "stated — Qwen/Qwen3-Coder-480B-A35B-Instruct config.json (im3-arch-constants; 160+0 experts, top-8)" },
  llama70: { ...LLAMA70_GEOM, maxPos: 131072, status: "stated",
    prov: "stated — unsloth mirror ⊕ arXiv:2407.21783 Table 3 (canonical repo gated; im3-arch-constants). THE dense donor is llama70, NOT llama405 (memo §3, R2 fix)" },
};

// grok row's arch record — the real grok-2 open config (NOT a donor-enum member; memo §3).
// status/prov are RECORD METADATA (named-field access only — same contract as every
// MODEL_ARCH row, which mixes geometry with status/prov/donor/maxPos); MODEL_ARCH.grok's
// own status/prov keys override these on spread.
const GROK2_GEOM = Object.freeze({
  attnClass: "gqa", mode: "moe-ep",
  layers: 64, hidden: 8192, qHeads: 64, kvHeads: 8, headDim: 128,
  moeLayers: 64, topK: 2, // moeLayers = 64 DECLARED all-layers-MoE — the config has no dense split (memo §3)
  status: "stated (xai-org/grok-2 config.json) EXCEPT moeLayers — DECLARED all-layers-MoE",
  prov: "geometry record from xai-org/grok-2 config.json (Community License; im3-arch-constants row 10); the engine grok row's USE of it is analyst-set (see MODEL_ARCH.grok)",
});

// custom-model donor enum — codec contract per memo §3 (bounded axis, default dsr1;
// encoded only when model === "custom" AND non-default; legacy tokens decode to default).
// Consumers read .values/.default by name; status/prov are record metadata.
const CUSTOM_DONOR_ENUM = Object.freeze({
  values: ["dsr1", "qwen3c", "llama70"], default: "dsr1",
  status: "analyst-set (design-fixed enum)",
  prov: "memo §3 R2 codec contract: customDonor ∈ {dsr1, qwen3c, llama70}, default dsr1; encoded only when model=custom AND non-default; tokens lacking the field decode to the default (legacy links resolve unchanged); one SCENARIO_BOUNDS entry; encoder version bump per v5 spec, NOT a new epoch",
});

// Shared provenance strings
const P_ARCHETYPE_DSR1 = "analyst-set (archetype: dsr1) — geometry COPIED FROZEN from donor dsr1 (memo §3 deterministic archetype rule); supplies ONLY F_attn, K(L) and the fabric shape (moeLayers/topK/hidden); active/total magnitudes come from the engine MODELS row / sliders and rescale magnitudes, never geometry. Per-row donor overrides are a slice-2 review item.";
const P_V4_OOM = "analyst-approx (out-of-model attention) — hybrid CSA/HCA (kvHeads=1, headDim 512, per-layer compression, sparse indexer) fits neither frozen MLA nor GQA form (im3-arch-constants flag 1). DECLARED APPROXIMATION per memo §3: F_attn = GQA formula on qHeads/headDim (UPPER BOUND at long L, ignores CSA/HCA compression — disclosed); KV bytes/token = layers × kvHeads(1) × headDim(512) × s_KV (compressed-KV reading, the CENTRAL value; kvForm 'compressed-single-head' — NOT the GQA ×2 form). Never presented as stated; never enters MLA/GQA stated branches (1b branch tests).";

const MODEL_ARCH = {
  /* ---- open models, in-model (status: stated) ---- */
  dsr1: { ...DSR1_GEOM, maxPos: 163840, status: "stated",
    prov: { all: "stated — deepseek-ai/DeepSeek-R1 config.json: 61L/7168h/128q, MLA 512/64/128/128 (qkDim 192 = 128 nope + 64 rope; kvDim 576 = 512 kvLora + 64 rope), 58 MoE layers (first 3 dense), 256+1 experts top-8, maxPos 163,840. Matches roofline-diagnostic.mjs constants exactly." } },
  kimi: { attnClass: "mla", mode: "moe-ep", layers: 61, hidden: 7168, qHeads: 64,
    qkDim: 192, vDim: 128, kvDim: 576, moeLayers: 60, topK: 8, maxPos: 262144, status: "stated",
    prov: { all: "stated — moonshotai Kimi-K2 config.json: 61L/7168h/64q, MLA 512/64/128/128, 60 MoE layers (first 1 dense), 384+1 experts top-8. VARIANT (normative, memo §3): this row tracks Kimi-K2-THINKING — maxPos 262,144 (not Instruct's 131,072), native INT4 noted; geometry shared across variants." } },
  glm: { attnClass: "mla", mode: "moe-ep", layers: 78, hidden: 6144, qHeads: 64,
    qkDim: 256, vDim: 256, kvDim: 576, moeLayers: 75, topK: 8, maxPos: 202752, status: "stated (DSA caveat)",
    prov: { all: "stated — zai-org/GLM-5 config.json: 78L/6144h/64q, MLA 512/64/192/256 (qkDim 256 = 192 nope + 64 rope; vDim 256; kvDim 576), 75 MoE layers (first 3 dense), 256+1 top-8. CAVEAT (memo §3): GLM-5 carries DSA sparse attention on top of MLA dims — the dense-MLA F_attn/K(L) reading is an UPPER BOUND at long context; near the moderate contexts the site renders, the dense reading is the declared convention." } },
  glm47: { attnClass: "gqa", mode: "moe-ep", layers: 92, hidden: 5120, qHeads: 96, kvHeads: 8, headDim: 128,
    moeLayers: 89, topK: 8, maxPos: 202752, status: "stated",
    prov: { all: "stated — zai-org/GLM-4.7 config.json: plain GQA (no MLA fields), 92L/5120h/96q/8kv/128hd, 89 MoE layers (first 3 dense), 160+1 top-8. GLM switched architecture between 4.7 and 5 — arch fields NEVER shared across the two GLM rows (im3-arch-constants flag 3)." } },

  /* ---- open models, OUT-OF-MODEL attention (V4 family; memo §3 declared convention) ---- */
  dsv4: { attnClass: "out-of-model", mode: "moe-ep", layers: 61, hidden: 7168,
    qHeads: 128, kvHeads: 1, headDim: 512, kvForm: "compressed-single-head", fAttnForm: "gqa-upper-bound",
    moeLayers: 58, topK: 6, maxPos: 1048576, status: "analyst-approx (out-of-model attention)",
    prov: {
      all: P_V4_OOM + " Source: deepseek-ai/DeepSeek-V4-Pro config.json (61L/7168h/128q, kvHeads 1, headDim 512, 384+1 experts top-6).",
      moeLayers: "analyst-approx — DECLARED convention moeLayers = num_hidden_layers − 3 = 58 (memo §3; num_hash_layers: 3 semantics unconfirmed at source — NOT equated to first_k_dense_replace; convention by analogy to family R1 first_k_dense_replace = 3). Sensitivity (verification R3 arithmetic, quoted in memo): all-layers-MoE alternative (58→61) raises fabric payload D by +5.2%; smaller still on rendered throughput (D enters only t_N).",
    } },
  dsv4f: { attnClass: "out-of-model", mode: "moe-ep", layers: 43, hidden: 4096,
    qHeads: 64, kvHeads: 1, headDim: 512, kvForm: "compressed-single-head", fAttnForm: "gqa-upper-bound",
    moeLayers: 40, topK: 6, maxPos: 1048576, status: "analyst-approx (out-of-model attention)",
    prov: {
      all: P_V4_OOM + " Source: deepseek-ai/DeepSeek-V4-Flash config.json (43L/4096h/64q, kvHeads 1, headDim 512, 256+1 experts top-6).",
      moeLayers: "analyst-approx — DECLARED convention moeLayers = 43 − 3 = 40 (same convention as dsv4). Sensitivity (R3 arithmetic): all-layers-MoE alternative (40→43) raises D by +7.5%; throughput effect smaller still (t_N-only).",
    } },

  /* ---- closed models — donor dsr1, geometry copied frozen (memo §3 assignments) ---- */
  opus: { ...DSR1_GEOM, donor: "dsr1", status: "analyst-set (archetype: dsr1)", prov: { all: P_ARCHETYPE_DSR1 } },
  sonnet: { ...DSR1_GEOM, donor: "dsr1", status: "analyst-set (archetype: dsr1)", prov: { all: P_ARCHETYPE_DSR1 } },
  haiku: { ...DSR1_GEOM, donor: "dsr1", status: "analyst-set (archetype: dsr1)", prov: { all: P_ARCHETYPE_DSR1 } },
  gpt: { ...DSR1_GEOM, donor: "dsr1", status: "analyst-set (archetype: dsr1)", prov: { all: P_ARCHETYPE_DSR1 } },
  gemini: { ...DSR1_GEOM, donor: "dsr1", status: "analyst-set (archetype: dsr1)", prov: { all: P_ARCHETYPE_DSR1 } },
  terra: { ...DSR1_GEOM, donor: "dsr1", status: "analyst-set (archetype: dsr1)", prov: { all: P_ARCHETYPE_DSR1 } },
  luna: { ...DSR1_GEOM, donor: "dsr1", status: "analyst-set (archetype: dsr1)", prov: { all: P_ARCHETYPE_DSR1 } },
  gemflash: { ...DSR1_GEOM, donor: "dsr1", status: "analyst-set (archetype: dsr1)", prov: { all: P_ARCHETYPE_DSR1 } },

  /* ---- grok — the grok-2 config record (memo §3: NOT the dsr1 archetype) ---- */
  grok: { ...GROK2_GEOM, maxPos: 131072, status: "analyst-set (grok-2 config record)",
    prov: {
      all: "analyst-set — geometry from xai-org/grok-2 config.json (Community License; im3-arch-constants row 10): 64L/8192h/64q/8kv/128hd, residual-MoE 8 local experts top-2. The row's Grok 4.5-era active/total params stay SPECULATIVE (engine MODELS row); grok-2's open config informs geometry only and does NOT upgrade the row's status (im3-arch-constants flag 4).",
      moeLayers: "DECLARED all-layers-MoE (moeLayers = 64) — the grok-2 config has no dense split (memo §3 donor registry, R2 fix).",
    } },

  /* ---- custom — bounded donor enum (memo §3, R2 codec contract) ---- */
  custom: { donorEnum: CUSTOM_DONOR_ENUM, status: "analyst-set (customDonor enum, default dsr1)",
    prov: { all: "custom resolves geometry through customDonor ∈ {dsr1, qwen3c, llama70} (default dsr1) against ARCH_DONORS — same deterministic copied-frozen convention as closed rows; active/total from the sliders. Free-form arch sliders explicitly DEFERRED (memo §3: unreviewable validity surface + codec churn). Codec: encoded only when model=custom AND non-default; tokens lacking the field decode to default (every legacy custom link resolves unchanged); one SCENARIO_BOUNDS enum entry; encoder version bump per v5 spec, NOT a new epoch (slice-1b tests)." } },
};

/* =====================================================================================
   2. HARDWARE ROOFLINE CONSTANTS (memo §6 schema + §5 N_shard table, R5-amended)
   fabric [B/s per device, scale-up domain, aggregate bidirectional vendor convention],
   bwHBM [B/s], nShard [replica width, frozen §1.3 semantics; h800/h20 R5-amended to the
   published deployment-unit widths], hbmBytes [B per device — usable framebuffer capacity,
   R5 field; feasibility consumes THIS, never a GB label × unit guess],
   flops [FLOP/s per precision].
   Known values transcribed from the FROZEN d2 §5 recipes + site/tests/roofline-diagnostic.mjs;
   completions (h100/h200 fabric, trn3, RUBIN) researched/declared per memo §6 with per-cell
   provenance. Fallback rule C10: bf16 = fp8_dense/2 where unpublished. Absent field ⇒ 1b
   hard-errors (never a silent default). cm384 SYSTEM widths (6P2D 144 / co-loc 128, frozen
   §1.3) are observation-level constants of the frozen artifact — the ascend HW ROW carries
   the co-loc 128 (memo §5); 144 is recorded in the ascend nShard provenance, not as a row.
   ===================================================================================== */

// GPT Pro §2: five different counts that must never be substituted for one another. N_world is
// the physical serving-engine/process graph; N_shard is the divisor for the relevant weight
// component; N_domain is the high-bandwidth fabric domain; N_role is one disaggregated prefill or
// decode engine; N_replicas counts independent serving copies. Only N_shard is computation-eligible.
const TOPOLOGY_DIMENSIONS = Object.freeze(["N_world", "N_shard", "N_domain", "N_role", "N_replicas"]);
const TOPOLOGY_EVIDENCE_CLASSES = Object.freeze({
  A: "creator hard minimum or explicit deployment requirement",
  B: "creator example, suggestion, or implementation sample",
  C: "inference-vendor production configuration",
  D: "framework or hardware-vendor verified/recommended recipe",
  E: "benchmark or throughput operating point",
  F: "scale-up-domain recommendation, not a replica topology",
  ANALYST: "explicit analyst transferability choice — no applicable published case exists for the target model (B\u2032 memo \u00a71 contract)",
});
const GPT_PRO_REPLICA_WIDTH_CONSULT = "research/gptpro-reports/2026-07-20-replica-width-consult.md";
const NVL72_TOPOLOGY_SENSITIVITY_CASES = Object.freeze([
  Object.freeze({
    id: "nvidia-v4-pro-nvfp4-tp4",
    value: 4,
    topologyDimension: "N_shard",
    evidenceClasses: Object.freeze(["D"]),
    precisionTier: "fp4-class",
    applicability: Object.freeze({ modelTotalB: Object.freeze([1600, 1600]), precisionTier: "fp4-class", hardware: "GB300 TP4 (NVIDIA-converted checkpoint)" }),
    label: "NVIDIA re-quantized DeepSeek-V4-Pro NVFP4 on GB300, TP4",
    precisionCondition: "NVIDIA-converted NVFP4 checkpoint on GB300; not the native checkpoint or a generic minimum",
    citation: `${GPT_PRO_REPLICA_WIDTH_CONSULT} §3, row “DeepSeek V4-Pro — NVIDIA re-quantized NVFP4” (consult cites https://huggingface.co/nvidia/DeepSeek-V4-Pro-NVFP4).`,
  }),
  Object.freeze({ // RETIRED at B′1 (memo §6): superseded by the per-source split below + the
    // explicit analyst-transfer default. Archived, never selectable (roofline input gate rejects).
    id: "analyst-default-8",
    value: 8,
    topologyDimension: "N_shard",
    evidenceClasses: Object.freeze(["C", "D", "E"]),
    superseded: "analyst-transfer-default-8",
    label: "RETIRED aggregate (pre-B′1) — see the per-source cases and analyst-transfer-default-8",
    precisionCondition: "Superseded: the aggregation of C/D/E sources into one case was the R2 R1-2 residual (a shopping channel); each source is now its own case",
    citation: `${GPT_PRO_REPLICA_WIDTH_CONSULT} §3 (aggregate citation retained for the archive); superseded per research/im4-sliceBprime-design-memo.md §6.`,
  }),
  Object.freeze({
    id: "kimi-k2-thinking-b200-prod-8",
    value: 8,
    topologyDimension: "N_shard",
    evidenceClasses: Object.freeze(["C"]),
    precisionTier: "fp4-class",
    applicability: Object.freeze({ modelTotalB: Object.freeze([1000, 1000]), precisionTier: "fp4-class", hardware: "B200 (one 8-GPU node)" }),
    label: "Kimi K2 Thinking production on one 8×B200 node (Baseten), converted NVFP4",
    precisionCondition: "1T-model NVFP4 production configuration; not evidence about Opus/5T",
    citation: `${GPT_PRO_REPLICA_WIDTH_CONSULT} §3, row “Kimi K2 Thinking — 1T, converted NVFP4” (consult cites https://www.baseten.co/blog/kimi-k2-thinking-at-140-tps-on-nvidia-blackwell/).`,
  }),
  Object.freeze({
    id: "v4-pro-vllm-dp8-8",
    value: 8,
    topologyDimension: "N_shard",
    evidenceClasses: Object.freeze(["D"]),
    precisionTier: "fp4-class",
    applicability: Object.freeze({ modelTotalB: Object.freeze([1600, 1600]), precisionTier: "fp4-class", hardware: "B300 / H200 / MI355X / 2× GB200 NVL4" }),
    label: "DeepSeek V4-Pro vLLM recommended DP8+EP deployment (native mixed FP4/FP8)",
    precisionCondition: "1.6T-model recipe; dense params replicated in hybrid DP+EP, so Total/8 is not exact per-rank weight; not evidence about Opus/5T",
    citation: `${GPT_PRO_REPLICA_WIDTH_CONSULT} §3, row “DeepSeek V4-Pro — 1.6T, native mixed FP4/FP8” (consult cites https://recipes.vllm.ai/deepseek-ai/DeepSeek-V4-Pro).`,
  }),
  Object.freeze({
    id: "deepgemm-ep8-benchmark-8",
    value: 8,
    topologyDimension: "N_shard",
    evidenceClasses: Object.freeze(["E"]),
    precisionTier: "fp8-class",
    applicability: Object.freeze({ modelTotalB: Object.freeze([1600, 1600]), precisionTier: "fp8-class", hardware: "kernel benchmark (ranks only; SKU unstated)" }),
    label: "DeepSeek DeepGEMM MegaMoE EP8 kernel benchmark",
    precisionCondition: "Kernel benchmark across eight ranks; not an end-to-end serving endpoint or width claim; not evidence about Opus/5T",
    citation: `${GPT_PRO_REPLICA_WIDTH_CONSULT} §3, row “DeepSeek V4-Pro — kernel benchmark” (consult cites https://github.com/deepseek-ai/DeepGEMM/pull/316).`,
  }),
  Object.freeze({
    id: "analyst-transfer-default-8",
    value: 8,
    topologyDimension: "N_shard",
    evidenceClasses: Object.freeze(["ANALYST"]),
    precisionTier: "unconditioned",
    applicability: Object.freeze({ modelTotalB: null, precisionTier: "unconditioned", hardware: "NVL72 rack-scale (gb200/gb300 rows)" }),
    label: "Banked analyst transferability choice: width 8 for the closed flagship scenario",
    precisionCondition: "B′ §1 contract: NO published case applies to a closed multi-trillion-parameter model at unknown precision (every source case self-declares non-transferability), so the default is an explicit analyst choice — rationale: 8 is the modal deployed low-precision width across the C/D per-source cases and the pre-existing engine value; chosen by evidence-adjacency and continuity, NEVER by feasibility outcome",
    citation: `research/im4-sliceBprime-design-memo.md §1/§6 (v3.1); per-source receipts: the kimi-k2-thinking-b200-prod-8, v4-pro-vllm-dp8-8, deepgemm-ep8-benchmark-8 cases.`,
  }),
  Object.freeze({
    id: "kimi-k2-fp8-minimum-16",
    value: 16,
    topologyDimension: "N_shard",
    evidenceClasses: Object.freeze(["A"]),
    precisionTier: "fp8-class",
    applicability: Object.freeze({ modelTotalB: Object.freeze([1000, 1000]), precisionTier: "fp8-class", hardware: "H200/H20 at 128K context" }),
    label: "Kimi K2 original FP8 at 128K context on H200/H20 — creator-stated smallest deployment unit",
    precisionCondition: "Exact-condition minimum for a different, smaller 1T model at FP8/128K; not evidence about Opus/5T",
    citation: `${GPT_PRO_REPLICA_WIDTH_CONSULT} §3, row “Kimi K2 original — 1T, FP8” (consult cites https://github.com/MoonshotAI/Kimi-K2/blob/main/docs/deploy_guidance.md).`,
  }),
  Object.freeze({
    id: "ling-2-5-bf16-example-32",
    value: 32,
    topologyDimension: "N_shard",
    evidenceClasses: Object.freeze(["B"]),
    precisionTier: "bf16-class",
    applicability: Object.freeze({ modelTotalB: Object.freeze([1000, 1000]), precisionTier: "bf16-class", hardware: "unstated SKU (creator example)" }),
    label: "Ling-2.5-1T TP8×PP4×DP1 creator example supporting BF16 (also FP8)",
    precisionCondition: "Creator says the topology is only an example; hardware SKU is omitted; not a minimum or production receipt",
    citation: `${GPT_PRO_REPLICA_WIDTH_CONSULT} §3, row “Ling-2.5-1T — 1T” (consult cites https://github.com/inclusionAI/Ling-V2.5).`,
  }),
  Object.freeze({
    id: "yuan-3-bf16-example-48",
    value: 48,
    topologyDimension: "N_shard",
    evidenceClasses: Object.freeze(["B"]),
    precisionTier: "bf16-class",
    applicability: Object.freeze({ modelTotalB: Object.freeze([1010, 1010]), precisionTier: "bf16-class", hardware: "unstated SKU (creator suggestion; 16 at INT4 pair)" }),
    label: "Yuan3.0-Ultra BF16 TP4×PP12 creator suggestion",
    precisionCondition: "Creator suggestion at BF16 versus 16 at INT4; hardware SKU unstated; a clean precision-conditioning example, not a minimum or production receipt",
    citation: `${GPT_PRO_REPLICA_WIDTH_CONSULT} §3/§4, row “Yuan3.0-Ultra — 1.01T/68.8B after pruning” (consult cites https://github.com/Yuan-lab-LLM/Yuan3.0-Ultra/blob/main/vllm/README_Yuan.md).`,
  }),
  Object.freeze({
    id: "v4-pro-inferencex-decode-role-32",
    value: 32,
    topologyDimension: "N_role",
    evidenceClasses: Object.freeze(["E"]),
    precisionTier: "fp4-class",
    applicability: Object.freeze({ modelTotalB: Object.freeze([1600, 1600]), precisionTier: "fp4-class", hardware: "GB300 disaggregated decode role" }),
    label: "DeepSeek V4-Pro GB300 disaggregated decode-role world, EP16",
    precisionCondition: "Throughput topology only; no public EP16×DP2=32 resident-weight replica is stated",
    citation: `${GPT_PRO_REPLICA_WIDTH_CONSULT} §2/§3, V4-Pro correction and performance-run row (consult cites https://newsletter.semianalysis.com/p/deepseekv4-16t-day-0-to-day-43-performance); reconcile with the separately cached InferenceX quote in research/primary-sources/nvl72-replica-widths-2026-07-20/capture.md §4.`,
  }),
  Object.freeze({
    id: "kimi-k3-domain-64-plus",
    value: 64,
    topologyDimension: "N_domain",
    evidenceClasses: Object.freeze(["F"]),
    precisionTier: "unconditioned",
    applicability: Object.freeze({ modelTotalB: Object.freeze([2800, 2800]), precisionTier: "unconditioned", hardware: "supernode domain recommendation" }),
    label: "Kimi K3 recommended high-bandwidth scale-up domain of 64 or more accelerators",
    precisionCondition: "Communication-domain efficiency recommendation; not a minimum, serving receipt, or resident-weight shard count",
    topologyRecord: Object.freeze({
      N_domain_recommended: "64+", N_shard: "unknown", N_world: "unknown",
      N_role: "unknown", N_replicas: "unknown",
    }),
    citation: `${GPT_PRO_REPLICA_WIDTH_CONSULT} §1/§3/§7, K3 verdict and Class F row (consult cites https://www.kimi.com/blog/kimi-k3); independently corroborated against the cached Moonshot HTML and SemiAnalysis LinkedIn capture in research/primary-sources/nvl72-replica-widths-2026-07-20/ (directory).`,
  }),
]);
const NVL72_TOPOLOGY_SENSITIVITY = Object.freeze({
  kind: "declared-analyst-sensitivity",
  defaultCaseId: "analyst-transfer-default-8",
  governingSource: GPT_PRO_REPLICA_WIDTH_CONSULT,
  modelingCaveat: "The uniform Total_parameters × s_w / N_shard capacity equation is an optimistic lower-bound approximation when component placement is unpublished; hybrid MoE deployments may shard routed experts while replicating or differently sharding dense and attention components (GPT Pro consult §5).",
  cases: NVL72_TOPOLOGY_SENSITIVITY_CASES,
});

const TPU7_TOPOLOGY_SENSITIVITY = Object.freeze({
  kind: "declared-analyst-sensitivity",
  defaultCaseId: "tpu7-analyst-transfer-default-4",
  governingSource: GPT_PRO_REPLICA_WIDTH_CONSULT,
  modelingCaveat: "Same uniform-equation caveat as the NVL72 registry (GPT Pro consult §5).",
  cases: Object.freeze([
    Object.freeze({
      id: "tpu7-analyst-transfer-default-4",
      value: 4,
      topologyDimension: "N_shard",
      evidenceClasses: Object.freeze(["ANALYST"]),
      precisionTier: "unconditioned",
      applicability: Object.freeze({ modelTotalB: null, precisionTier: "unconditioned", hardware: "TPU v7 (tpu7 row)" }),
      label: "Banked analyst transferability choice: the live frozen-recipe width 4, unchanged",
      precisionCondition: "B′ §1 contract: no published TPU width case applies to the closed flagship; the frozen d2 recipe-5 width 4 is retained as the explicit analyst default",
      citation: `research/im4-sliceBprime-design-memo.md §2 (v3.1 addendum: live default is 4); frozen d2 §5 recipe 5.`,
    }),
    Object.freeze({
      id: "mimo-tpu-v7x-16",
      value: 16,
      topologyDimension: "N_shard",
      evidenceClasses: Object.freeze(["D"]),
      precisionTier: "unconditioned",
      applicability: Object.freeze({ modelTotalB: Object.freeze([1020, 1020]), precisionTier: "unconditioned", hardware: "TPU v7x — 16 PHYSICAL chips (TP32 logical JAX devices; two devices per chip)" }),
      label: "SGLang MiMo-V2.5-Pro verified single-engine TPU v7x world: 16 physical chips",
      precisionCondition: "1.02T-model verified engine; chips-vs-logical-devices distinction preserved; not evidence about the closed flagship",
      citation: `${GPT_PRO_REPLICA_WIDTH_CONSULT} §3, row “MiMo-V2.5-Pro — TPU” (consult cites https://lmsysorg.mintlify.app/cookbook/autoregressive/Xiaomi/MiMo-V2.5).`,
    }),
  ]),
});
const TRAINIUM_TOPOLOGY_SENSITIVITY = Object.freeze({
  kind: "declared-analyst-sensitivity",
  defaultCaseId: "trn-analyst-transfer-default-16",
  governingSource: GPT_PRO_REPLICA_WIDTH_CONSULT,
  modelingCaveat: "Same uniform-equation caveat as the NVL72 registry (GPT Pro consult §5).",
  cases: Object.freeze([
    Object.freeze({
      id: "trn-analyst-transfer-default-16",
      value: 16,
      topologyDimension: "N_shard",
      evidenceClasses: Object.freeze(["ANALYST"]),
      precisionTier: "unconditioned",
      applicability: Object.freeze({ modelTotalB: null, precisionTier: "unconditioned", hardware: "Trainium2/3 (trn2/trn3 rows)" }),
      label: "Banked analyst transferability choice: the live width 16, unchanged — AND the documented absence finding",
      precisionCondition: "B′ §1 contract + the ABSENCE finding (memo §2): the 2026-07-20 consult's published-width table contains NO Trainium entry of any class — the absence is itself the citable evidence state for this family",
      citation: `research/im4-sliceBprime-design-memo.md §2 (v3.1); ${GPT_PRO_REPLICA_WIDTH_CONSULT} §3 (family absent from the table — negative finding).`,
    }),
  ]),
});

/* B′1 (memo §6): scalar total-parameter cases — labeled bookmarks that SET the scenario
   total; `total` remains the single scenario value. computed-intersection carries its
   derivation rule and is re-derived ONLY under a gate-10 delta manifest. */
const TOTAL_CASES = Object.freeze({
  "receipt-edge-1.6": Object.freeze({ totalB: 1600, label: "Receipt-supported region's upper edge (V4-Pro 1.6T — largest total with a comparable one-engine serving receipt)", citation: GPT_PRO_REPLICA_WIDTH_CONSULT + " §3" }),
  "revised-band-central-2.5": Object.freeze({ totalB: 2500, label: "Page-adopted current-flagship planning band central (2–3 T; scalar 2.5 T — a calculator scalar, not a measured midpoint). Owner-adopted planning band informed by community estimates (which include lower 1.5–2 T readings); the Musk-relative 5 T deduction is read as likely the prior flagship (Opus 4.6). Adjudicated 2026-07-24.", citation: "owner adjudication 2026-07-24 (answers.jsonl im-fable-b6-2026-07-24-fa-planning-point-label) + community estimates; research/im4-fa-justifications-memo.md §J-9", isDefault: true }),
  "largest-disclosed-2.8": Object.freeze({ totalB: 2800, label: "Kimi K3's disclosed total — a size disclosure, NOT a serving-width receipt (Class-F domain recommendation only)", citation: GPT_PRO_REPLICA_WIDTH_CONSULT + " §1" }),
  "community-central-5.0": Object.freeze({ totalB: 5000, label: "Legacy 5 T prior-flagship replay — the Musk-relative community deduction (Apr 2026), read as likely the prior flagship (Opus 4.6; referent unverified); not a current-Opus-4.8 size estimate; superseded as the current-flagship central (2026-07-24)", citation: "site/engine.js opus dossier (Musk-relative community deduction; re-attribution: research/im4-fa-justifications-memo.md §J-9)" }),
  "stress-10": Object.freeze({ totalB: 10000, label: "Stress case (labeled)", citation: "research/im4-sliceBprime-design-memo.md §3" }),
  "computed-intersection": Object.freeze({ totalB: 3550, label: "Largest 0.05T-grid total where every DECLARED NA-blend leg (all seven) renders at SOLVER capacity widths/default precision (h100 binds at 3.60T) — RE-DERIVED under the FA delta manifest (was 5.90T trn2-bound, derived under pre-R3 renderable semantics where a capped leg still counted as rendering)", citation: "research/im4-sliceBprime-design-memo.md §4(b) grid-max rule; FA re-derivation research/im4-faj-delta-manifest.md (declared-leg semantics resolved per memo §J-9); re-derive only under a gate-10 delta manifest", derived: true }),
});
/* Scenario precision → precisionTier mapping (exhaustive over PRECISION_ENUM_KEYS;
   "int4-class" exists only as a case condition — no scenario value maps to it, so
   int4-conditioned cases are unselectable until an int4 scenario precision exists). */
const PRECISION_TIER_MAP = Object.freeze({ fp4: "fp4-class", fp8: "fp8-class", bf16: "bf16-class" });

/* Slice C (design memo im4-sliceC-design-memo v9, C-8): the totalCase system is
   FLAGSHIP-SCOPED in v1 — every TOTAL_CASES row describes the OPUS total prior.
   A case id on an out-of-scope model would borrow the Opus case's citation for a
   differently-sourced prior (receipt forgery) and rejects fail-closed at the
   wire; "preset" is the out-of-scope clean value ONLY (the C-8 machine never
   assigns it in scope, and the decoder rejects in-scope "preset" whole — the
   unreachable-second-clean-encoding bar). */
const TOTAL_CASE_SCOPE = Object.freeze(["opus"]);

/* ============================================================================
   R1-impl R3 F5: typed provenance registry for observed worker-width candidates that
   have NO width-case registry entry (those were the sourceCaseId:null gaps). PARALLEL,
   non-shipping, NEVER selectable widths — observation provenance only. A candidate's
   sourceCaseId resolves into (this registry ∪ the topology-sensitivity case ids); the
   capacity-solver guard enforces full resolution with no bare nulls.
   ============================================================================ */
const WORKER_CANDIDATE_SOURCES = Object.freeze({
  "lmsys-gb200-decode-ep48": Object.freeze({ width: 48, role: "decode", evidenceClass: "B",
    label: "LMSYS GB200 decode worker EP48",
    citation: "research/grok-sweep-serving-topologies-2026-07-21.md §A.3 (banked Grok/X sweep)" }),
  "mlperf-v6-gb300-prefill-2": Object.freeze({ width: 2, role: "prefill", evidenceClass: "A",
    label: "MLPerf v6.0 GB300 prefill worker (audited submission config)",
    citation: "MLPerf v6.0 GB300 submission configs; research/gptpro-reports/2026-07-21-topology-dive.md §Direct verdict" }),
  "mlperf-v6-gb300-decode-16": Object.freeze({ width: 16, role: "decode", evidenceClass: "A",
    label: "MLPerf v6.0 GB300 decode worker (audited submission config)",
    citation: "MLPerf v6.0 GB300 submission configs; research/gptpro-reports/2026-07-21-topology-dive.md §Direct verdict" }),
  "deepseek-day6-h800-decode-144": Object.freeze({ width: 144, role: "decode", evidenceClass: "B",
    label: "DeepSeek Day-6 H800 production decode deployment unit (EP144/DP144)",
    citation: "DeepSeek Day-6 production disclosure; research/gptpro-reports/2026-07-21-topology-dive.md §A.1" }),
  "deepseek-day6-h800-prefill-32": Object.freeze({ width: 32, role: "prefill", evidenceClass: "B",
    label: "DeepSeek Day-6 H800 production prefill deployment unit (role width)",
    citation: "DeepSeek Day-6 production disclosure; research/gptpro-reports/2026-07-21-topology-dive.md §A.1" }),
  "h800-decode-transfer-analyst-144": Object.freeze({ width: 144, role: "decode", evidenceClass: "ANALYST",
    label: "Same-fabric-class analyst transfer of the h800 Day-6 decode unit (h100/h200; labeled)",
    citation: "Analyst transfer per memo §0-bis; source observation = deepseek-day6-h800-decode-144" }),
  "ant-h20-decode-16": Object.freeze({ width: 16, role: "decode", evidenceClass: "B",
    label: "Ant production H20 decode unit (published)",
    citation: "Ant/SGLang published production configuration (h20 domain-row citation); memo §0-bis" }),
  "cloudmatrix-frozen-coloc-128": Object.freeze({ width: 128, role: "co-located", evidenceClass: "B",
    label: "CloudMatrix 384 co-location worker width (frozen constant)",
    citation: "FlexNPU/CloudMatrix frozen §1.3 constants; redesign memo §0-bis" }),
  "cloudmatrix-frozen-6p2d-decode-144": Object.freeze({ width: 144, role: "decode", evidenceClass: "B",
    label: "CloudMatrix 384 6P2D decode worker width (frozen constant)",
    citation: "FlexNPU/CloudMatrix frozen §1.3 constants; redesign memo §0-bis" }),
});

/* ============================================================================
   R1 (feasibility-redesign memo v4.1 §0/§0-bis): per-family interconnect DOMAIN objects.
   LIVE since R2: render/capacity consume these domains through the sealed width enumerator and trusted solve.
   hardwareLegalShapes is an explicit generator spec, NEVER "all integers <= max";
   evidenceClass grades the DOMAIN claim (not any serving run). Sources: topology dive §E
   + platform docs cited per entry. Rubin: EXCLUDED (projection row; memo §0-bis).
   ============================================================================ */
const HW_DOMAINS = Object.freeze({
  gb200: Object.freeze({
    scaleUp: Object.freeze({ name: "NVL72 rack NVLink", bandwidthClass: "nvlink-rack",
      hardwareLegalShapes: Object.freeze({ kind: "range-step", min: 2, max: 72, step: 2,
        note: "even worker widths within one NVL72 rack; MLPerf v6.0 ran widths 2 and 16; Dynamo recipes 8/16" }),
      evidenceClass: "C", citation: "NVIDIA NVL72 reference architecture (72-GPU L1 NVLink domain); dive §E" }),
    scaleOut: Object.freeze({ name: "Spectrum-X/IB multi-rack", bandwidthClass: "scale-out-ethernet-ib",
      hardwareLegalShapes: Object.freeze({ kind: "multi-rack", rackWidth: 72, maxRacks: 8,
        note: "NVIDIA reference designs 144-576 GPUs; NOT NVLink-equivalent; excluded from the current solver until cross-rack fabric, latency, and exact legal shapes are modeled" }),
      evidenceClass: "C", searchedInR1: false, citation: "NVIDIA network logical architecture; dive §E" }),
    observedWorkerCandidates: Object.freeze([
      Object.freeze({ width: 8, sourceCaseId: "kimi-k2-thinking-b200-prod-8", evidenceClasses: Object.freeze(["C"]) }),
      Object.freeze({ width: 8, sourceCaseId: "v4-pro-vllm-dp8-8", evidenceClasses: Object.freeze(["D"]) }),
      Object.freeze({ width: 48, sourceCaseId: "lmsys-gb200-decode-ep48", evidenceClasses: Object.freeze(["B"]) }),
    ]),
  }),
  gb300: Object.freeze({
    scaleUp: Object.freeze({ name: "NVL72 rack NVLink", bandwidthClass: "nvlink-rack",
      hardwareLegalShapes: Object.freeze({ kind: "range-step", min: 2, max: 72, step: 2,
        note: "as gb200; MLPerf v6.0 GB300 ran prefill width 2 + decode width 16 on one rack" }),
      evidenceClass: "A", citation: "MLPerf v6.0 GB300 submission configs (audited); dive §Direct verdict" }),
    scaleOut: Object.freeze({ name: "Spectrum-X/IB multi-rack", bandwidthClass: "scale-out-ethernet-ib",
      hardwareLegalShapes: Object.freeze({ kind: "multi-rack", rackWidth: 72, maxRacks: 8,
        note: "excluded from the current solver until cross-rack fabric, latency, and exact legal shapes are modeled" }),
      evidenceClass: "C", searchedInR1: false, citation: "NVIDIA reference architecture; dive §E" }),
    observedWorkerCandidates: Object.freeze([
      Object.freeze({ width: 2, sourceCaseId: "mlperf-v6-gb300-prefill-2", evidenceClasses: Object.freeze(["A"]) }),
      Object.freeze({ width: 16, sourceCaseId: "mlperf-v6-gb300-decode-16", evidenceClasses: Object.freeze(["A"]) }),
      Object.freeze({ width: 4, sourceCaseId: "nvidia-v4-pro-nvfp4-tp4", evidenceClasses: Object.freeze(["D"]) }),
    ]),
  }),
  tpu7: Object.freeze({
    scaleUp: Object.freeze({ name: "ICI torus slices", bandwidthClass: "tpu-ici",
      hardwareLegalShapes: Object.freeze({ kind: "documented-slices", min: 4, max: 2048,
        latencyPreferredWidth: 64,
        note: "Google-documented TPU7x slice shapes 4..2048 within a 9,216-chip pod; 4 = VM granularity, not a width ceiling; 64-chip cube = latency-preferred tier" }),
      evidenceClass: "C", citation: "Google TPU7x docs (slices 4-2048); dive §A.4/§E" }),
    observedWorkerCandidates: Object.freeze([
      Object.freeze({ width: 16, sourceCaseId: "mimo-tpu-v7x-16", evidenceClasses: Object.freeze(["D"]) }),
    ]),
  }),
  trn2: Object.freeze({
    scaleUp: Object.freeze({ name: "Trn2 UltraServer NeuronLink", bandwidthClass: "neuronlink",
      hardwareLegalShapes: Object.freeze({ kind: "range-step", min: 16, max: 64, step: 16,
        note: "16-chip instances composing a 64-chip UltraServer" }),
      evidenceClass: "C", citation: "AWS Trn2 UltraServer (64 chips, 6TB HBM); dive §A.4" }),
    observedWorkerCandidates: Object.freeze([]), // NO published Trainium serving width of any class — the absence is the finding (consult §3)
  }),
  trn3: Object.freeze({
    scaleUp: Object.freeze({ name: "Trn3 UltraServer NeuronSwitch", bandwidthClass: "neuronswitch",
      hardwareLegalShapes: Object.freeze({ kind: "range-step", min: 16, max: 144, step: 16,
        note: "144-chip all-to-all UltraServer, 20.7TB HBM, native MXFP8/MXFP4" }),
      evidenceClass: "C", citation: "AWS Trn3 UltraServers announcement 2025-12-02; dive §A.4" }),
    observedWorkerCandidates: Object.freeze([]), // absence finding, as trn2
  }),
  h800: Object.freeze({
    scaleUp: Object.freeze({ name: "multi-node IB (observed production domain)", bandwidthClass: "ib-cluster",
      hardwareLegalShapes: Object.freeze({ kind: "node-multiple", nodeWidth: 8, max: 144,
        note: "DeepSeek production decode unit spans 18x8=144; an OBSERVED scale-out worker bound, not a hardware scale-up ceiling" }),
      evidenceClass: "B", citation: "DeepSeek Day-6 production disclosure (EP144/DP144); dive §A.1" }),
    observedWorkerCandidates: Object.freeze([
      Object.freeze({ width: 144, sourceCaseId: "deepseek-day6-h800-decode-144", evidenceClasses: Object.freeze(["B"]) }),
      Object.freeze({ width: 32, sourceCaseId: "deepseek-day6-h800-prefill-32", evidenceClasses: Object.freeze(["B"]) }),
    ]),
  }),
  h100: Object.freeze({
    scaleUp: Object.freeze({ name: "multi-node IB (transferred from h800 class)", bandwidthClass: "ib-cluster",
      hardwareLegalShapes: Object.freeze({ kind: "node-multiple", nodeWidth: 8, max: 144,
        note: "same-fabric-class ANALYST transfer of the h800 observed bound; labeled" }),
      evidenceClass: "ANALYST", citation: "transfer per redesign memo §0-bis (h100/h200 = labeled candidates)" }),
    observedWorkerCandidates: Object.freeze([
      Object.freeze({ width: 144, sourceCaseId: "h800-decode-transfer-analyst-144", evidenceClasses: Object.freeze(["ANALYST"]) }),
    ]),
  }),
  h200: Object.freeze({
    scaleUp: Object.freeze({ name: "multi-node IB (transferred from h800 class)", bandwidthClass: "ib-cluster",
      hardwareLegalShapes: Object.freeze({ kind: "node-multiple", nodeWidth: 8, max: 144, note: "as h100; labeled analyst transfer" }),
      evidenceClass: "ANALYST", citation: "transfer per redesign memo §0-bis" }),
    observedWorkerCandidates: Object.freeze([
      Object.freeze({ width: 144, sourceCaseId: "h800-decode-transfer-analyst-144", evidenceClasses: Object.freeze(["ANALYST"]) }),
    ]),
  }),
  h20: Object.freeze({
    scaleUp: Object.freeze({ name: "multi-node IB", bandwidthClass: "ib-cluster",
      hardwareLegalShapes: Object.freeze({ kind: "node-multiple", nodeWidth: 8, max: 144,
        note: "published production width 16 (Ant); domain membership beyond it = labeled analyst (same fabric class)" }),
      evidenceClass: "ANALYST", citation: "Ant/SGLang 16 published; extension analyst-labeled per memo §0-bis" }),
    observedWorkerCandidates: Object.freeze([
      Object.freeze({ width: 16, sourceCaseId: "ant-h20-decode-16", evidenceClasses: Object.freeze(["B"]) }),
    ]),
  }),
  ascend: Object.freeze({
    domainCardinality: Object.freeze({ dimension: "N_domain", value: 384,
      note: "supernode card count — DOMAIN cardinality, structurally distinct from any worker width (R1-impl P1-5)" }),
    scaleUp: Object.freeze({ name: "CloudMatrix 384 supernode (N_domain)", bandwidthClass: "unified-bus-supernode",
      hardwareLegalShapes: Object.freeze({ kind: "explicit-set", widths: Object.freeze([128, 144]),
        provenance: "observed-worker-widths-only", // The legal slice catalog inside the 384-card supernode is UNVERIFIED; this set is seeded from observed deployments, so legal set and candidates coincide by evidence limitation, not by construction — exact legal slice catalog remains unregistered.
        note: "observed worker widths within the 384-card supernode (co-loc 128 / 6P2D decode 144, frozen constants); the 384 is DOMAIN cardinality, never a worker width (memo §0-bis)" }),
      evidenceClass: "B", citation: "FlexNPU/CloudMatrix frozen §1.3 constants; redesign memo §0-bis" }),
    observedWorkerCandidates: Object.freeze([
      Object.freeze({ width: 128, sourceCaseId: "cloudmatrix-frozen-coloc-128", evidenceClasses: Object.freeze(["B"]) }),
      Object.freeze({ width: 144, sourceCaseId: "cloudmatrix-frozen-6p2d-decode-144", evidenceClasses: Object.freeze(["B"]) }),
    ]),
  }),
});

/* ============================================================================
   b9 M3 (energy/electricity dimension; memo research/b9-m3-energy-memo.md §3.1): every row
   below carries four typed fields.
   - family: hardware family for the M5 family sliders (closed set: nvidia | tpu | trainium |
     ascend). Vendor identity — uncontested.
   - boardPowerW: measured OPERATING power in watts, or null. ALL NULL as of b9 M3 — no
     per-accelerator operating-power measurement exists in the project source base, so the
     engine's shared operating-power resolver (engine.js opPowerKw) falls back to the analyst
     TDP proxy (engine.js HW tdp), labeled in the methods box. The field is the typed override
     hook (M4 custom legs; any future measured row). A populated value feeds BOTH the energy
     surface and the owned-TCO power term through that one resolver (memo §7 decision 3) — a
     silently populated value that moves only one of them is a defect.
   - kwhPerKwh: im-arc T2 M-D compatibility hook, null on every row. Electricity is a
     SECTION / data-center property; no pricing path reads this row field. Populate only
     alongside explicit section evidence (memo research/im-arc-t2-sections-memo.md §3).
   - rentBasis: procurement-basis class of the registered rent NUMBER (closed set,
     engine.js PROCUREMENT_BASES). Uniformly committed-planning-rent since the b9 M1 repair
     moved every row onto published/committed planning-class rates. The LENS-level basis
     (engine.js procurementBasisFor) is a separate typed concept; basis-mixing inside one
     computed mix is a suite-enforced error (engine.js assertUniformProcurementBasis).
   ============================================================================ */
const HW_ROOFLINE = {
  h100: {
    family: "nvidia", boardPowerW: null, kwhPerKwh: null, rentBasis: "committed-planning-rent",
    fabric: 900e9, bwHBM: 3.35e12, nShard: 144, nShardDimension: "N_shard", hbmBytes: 85520809984,
    flops: { bf16: 0.99e15, fp8: 1.98e15 },
    prov: {
      family: "vendor identity — NVIDIA (b9 M3; consumed by the M5 family sliders; uncontested)",
      boardPowerW: "not registered (null) — no per-accelerator OPERATING-power measurement exists in the project source base; the engine's shared operating-power resolver falls back to the analyst TDP proxy (engine.js HW tdp 0.70 kW), labeled in the methods box. Populates on a measured serving-draw disclosure for this part (b9 M3 block note above HW_ROOFLINE).",
      kwhPerKwh: "not registered (null) — electricity is a property of the SECTION / data center a row is priced in, never of the accelerator (im-arc T2, memo research/im-arc-t2-sections-memo.md §3, owner answer d-20260822-4c26; a seeded per-row value would make location a property of the accelerator). A non-null value here would be consumed only by a section that explicitly references it — no section does; see engine-data-dc-v1.js.",
      rentBasis: "committed-planning-rent — the registered $2.40/hr is a neocloud/committed planning estimate (row note: TeorTaxes H100 spot $2.40/hr Jun 2026); one member of the heterogeneous low/committed planning vector (b9 M1 repair; b9 M3 typing — memo research/b9-m3-energy-memo.md §3.1-3.2).",
      fabric: "published — NVIDIA H100 datasheet: NVLink (4th gen) 900 GB/s aggregate bidirectional per GPU (nvidia.com/en-us/data-center/h100, verified 2026-07-18). Same convention as the frozen h800 400e9 (the export-capped variant of this same fabric).",
      bwHBM: "published — H100 SXM HBM3 3.35 TB/s (NVIDIA datasheet; = engine.js bw 3.35 in SI B/s)",
      hbmBytes: "observed framebuffer — nvidia-smi total 81,559 MiB × 2^20 = 85,520,809,984 B for 'NVIDIA H100 80GB HBM3' (verified 2026-07-18 across 6+ independent pasted outputs: scaleway.com MIG guide, github.com/wilicc/gpu-burn#114, docs.databricks.com H100 starter, support.crusoecloud.com, github.com/ray-project/ray#53266). The '80 GB' label × 1e9 undercounts this by ~6.9% (R5 finding).",
      nShard: "analyst-declared strong topology carry — 144, copied from the sourced DeepSeek H800 EP144/DP144 decode deployment unit. H100 and H800 have identical registered compute, HBM bandwidth, and framebuffer capacity; their fabric difference does not enter MoE feasibility, and N_shard does not enter MoE decode throughput. No H100-specific EP144 deployment receipt exists: this is a physically coherent same-capacity deployment scenario, not an observed H100 width.",
      "flops.fp8": "published — 1,979 TF dense FP8 (NVIDIA datasheet; = engine.js flopsFp8 1.98 carried)",
      "flops.bf16": "published — 989 TF dense BF16 (NVIDIA datasheet); equals fp8/2, consistent with fallback rule C10",
    },
  },
  h200: {
    family: "nvidia", boardPowerW: null, kwhPerKwh: null, rentBasis: "committed-planning-rent",
    fabric: 900e9, bwHBM: 4.8e12, nShard: 144, nShardDimension: "N_shard", hbmBytes: 150754820096,
    flops: { bf16: 0.99e15, fp8: 1.98e15 },
    prov: {
      family: "vendor identity — NVIDIA (b9 M3; consumed by the M5 family sliders; uncontested)",
      boardPowerW: "not registered (null) — no per-accelerator OPERATING-power measurement exists in the project source base; the engine's shared operating-power resolver falls back to the analyst TDP proxy (engine.js HW tdp 0.70 kW), labeled in the methods box. Populates on a measured serving-draw disclosure for this part (b9 M3 block note above HW_ROOFLINE).",
      kwhPerKwh: "not registered (null) — electricity is a property of the SECTION / data center a row is priced in, never of the accelerator (im-arc T2, memo research/im-arc-t2-sections-memo.md §3, owner answer d-20260822-4c26; a seeded per-row value would make location a property of the accelerator). A non-null value here would be consumed only by a section that explicitly references it — no section does; see engine-data-dc-v1.js.",
      rentBasis: "committed-planning-rent — the registered $2.90/hr is the same neocloud/committed planning class as h100; one member of the heterogeneous low/committed planning vector (b9 M1 repair; b9 M3 typing — memo research/b9-m3-energy-memo.md §3.1-3.2).",
      fabric: "published — NVIDIA H200 datasheet: NVLink 900 GB/s (4th gen, SXM; PNY-hosted NVIDIA H200 NVL/SXM datasheet, verified 2026-07-18)",
      bwHBM: "published — H200 HBM3e 4.8 TB/s (NVIDIA datasheet; = engine.js bw 4.80)",
      hbmBytes: "observed framebuffer — nvidia-smi total 143,771 MiB × 2^20 = 150,754,820,096 B for 'NVIDIA H200' (verified 2026-07-18, 5+ independent pasted outputs: github.com/NVIDIA/cuda-samples#311, forums.developer.nvidia.com peermem thread, github.com/axolotl-ai-cloud/axolotl#2688, userguide.ncshare.org, github.com/NVIDIA/cccl#1672). Note the '141 GB' label reads as ~GiB: observed FB ≈ 150.75e9 B.",
      nShard: "analyst-declared weak topology transfer — 144, copied from the sourced DeepSeek H800 EP144/DP144 decode deployment unit. H200 has the same registered compute but 1.76× the framebuffer and higher HBM bandwidth; DeepSeek states large EP is chosen partly to enlarge aggregate/per-expert batch, so EP144 remains plausible, but the added memory also permits a rational narrower deployment. No H200-specific width receipt exists. This topology assumption is independent of, and stacked with, the separate H800-η family transfer; η inheritance is not evidence for N_shard.",
      "flops.fp8": "published — 1,979 TF dense FP8, same Hopper compute as H100 (= engine.js flopsFp8 1.98)",
      "flops.bf16": "published — 989 TF dense BF16 (H200 datasheet); = fp8/2 (C10-consistent)",
    },
  },
  gb200: {
    family: "nvidia", boardPowerW: null, kwhPerKwh: null, rentBasis: "committed-planning-rent",
    fabric: 1.8e12, bwHBM: 8.0e12, nShard: 8, nShardDimension: "N_shard",
    topologySensitivity: NVL72_TOPOLOGY_SENSITIVITY, hbmBytes: 198674743296,
    flops: { bf16: 2.5e15, fp8: 5.0e15, fp4: 10e15 },
    prov: {
      family: "vendor identity — NVIDIA (b9 M3; consumed by the M5 family sliders; uncontested)",
      boardPowerW: "not registered (null) — no per-accelerator OPERATING-power measurement exists in the project source base; the engine's shared operating-power resolver falls back to the analyst TDP proxy (engine.js HW tdp 1.20 kW), labeled in the methods box. Populates on a measured serving-draw disclosure for this part (b9 M3 block note above HW_ROOFLINE).",
      kwhPerKwh: "not registered (null) — electricity is a property of the SECTION / data center a row is priced in, never of the accelerator (im-arc T2, memo research/im-arc-t2-sections-memo.md §3, owner answer d-20260822-4c26; a seeded per-row value would make location a property of the accelerator). A non-null value here would be consumed only by a section that explicitly references it — no section does; see engine-data-dc-v1.js.",
      rentBasis: "committed-planning-rent — the registered $4.50/hr is a neocloud/committed planning estimate (row note: neocloud rates $3.50-6/hr Jul 2026; the AWS Capacity Block rack anchor is deliberately not fitted); one member of the heterogeneous low/committed planning vector (b9 M1 repair; b9 M3 typing — memo research/b9-m3-energy-memo.md §3.1-3.2).",
      fabric: "frozen — NVLink5 1.8 TB/s per GPU (d2 §3.1 F4 recipe / roofline-diagnostic.mjs GB200 case; memo §6 known value)",
      bwHBM: "published — 8 TB/s HBM3e per GPU (frozen F4 recipe hbmBps 8.0e12; = engine.js bw 8.00)",
      hbmBytes: "observed framebuffer — nvidia-smi total 189,471 MiB × 2^20 = 198,674,743,296 B for 'NVIDIA GB200' per GPU (verified 2026-07-18: docs.nvidia.com NIM openfold3 arm64 prerequisites, support.crusoecloud.com NVBandwidth-on-GB200 guide, github.com/sgl-project/sglang#8911 and #7504). Distinct from standalone B200 180 GB; ≈185 GiB per GPU, the 186-GB-class B200-in-GB200 part.",
      nShard: "declared analyst default (unchanged from the pre-existing engine value), precision-conditioned — multiple Class C/D anchors support 8 as a genuinely deployed low-precision replica width, but per the 2026-07-20 GPT Pro evidence consult, the public record does not establish a specific required or minimum replica width for a multi-trillion-parameter closed-weight model at unknown precision (the actual Opus/5T scenario this engine models); see the declared-sensitivity case list on this row and research/gptpro-reports/2026-07-20-replica-width-consult.md.",
      "flops.fp8": "published — 5.0 PF dense FP8 per GPU (engine.js HW note: NVIDIA sparse/dense split verified; the widely-copied 4.5 PF is B200's)",
      "flops.bf16": "C10 fallback — fp8/2 = 2.5 PF dense; consistent with NVIDIA's published precision ladder",
      "flops.fp4": "frozen — 10 PF dense NVFP4 (d2 §3.1 F4 recipe FLOPS=10e15 / roofline-diagnostic GB200 case; = 2× dense FP8 per NVIDIA ladder)",
    },
  },
  gb300: {
    family: "nvidia", boardPowerW: null, kwhPerKwh: null, rentBasis: "committed-planning-rent",
    fabric: 1.8e12, bwHBM: 8.0e12, nShard: 8, nShardDimension: "N_shard",
    topologySensitivity: NVL72_TOPOLOGY_SENSITIVITY, hbmBytes: 298013687808,
    flops: { bf16: 2.5e15, fp8: 5.0e15, fp4: 15e15 },
    prov: {
      family: "vendor identity — NVIDIA (b9 M3; consumed by the M5 family sliders; uncontested)",
      boardPowerW: "not registered (null) — no per-accelerator OPERATING-power measurement exists in the project source base; the engine's shared operating-power resolver falls back to the analyst TDP proxy (engine.js HW tdp 1.40 kW), labeled in the methods box. Populates on a measured serving-draw disclosure for this part (b9 M3 block note above HW_ROOFLINE).",
      kwhPerKwh: "not registered (null) — electricity is a property of the SECTION / data center a row is priced in, never of the accelerator (im-arc T2, memo research/im-arc-t2-sections-memo.md §3, owner answer d-20260822-4c26; a seeded per-row value would make location a property of the accelerator). A non-null value here would be consumed only by a section that explicitly references it — no section does; see engine-data-dc-v1.js.",
      rentBasis: "committed-planning-rent — the registered $6.00/hr is an analyst-set planning value — NO public GB300 rack rental exists on any major provider checked (row note, Jul 2026); one member of the heterogeneous low/committed planning vector (b9 M1 repair; b9 M3 typing — memo research/b9-m3-energy-memo.md §3.1-3.2).",
      fabric: "memo §6 known value — NVLink5 1.8 TB/s per GPU (gb300 1.8e12, same NVLink5 domain as gb200; frozen §5 recipe 1-2)",
      bwHBM: "published — 288 GB HBM3e @ 8 TB/s per GPU (frozen §5 recipe 1-2; = engine.js bw 8.00)",
      hbmBytes: "vendor-documented framebuffer — 284,208 MiB × 2^20 = 298,013,687,808 B per GPU: NVIDIA DGX GB300 NVL72 release notes (docs.nvidia.com/dgx/dgxgb300nvl72-release-notes, v1.0.0/1.0.1/1.0.6, known-issue 14) state 'NSM Type 3 (0x0C) and nvidia-smi (-q -d MEMORY) return 284,208 MiB, while Redfish TotalMemorySizeMiB returns 285,324 MiB'. The nvidia-smi value adopted (feasibility-conservative of the two); FLAGGED single-source-type — NVIDIA's own docs, no third-party pasted output found (verified 2026-07-18). ≈3.6% below the '288 GB'-as-GiB reading.",
      nShard: "declared analyst default (unchanged from the pre-existing engine value), precision-conditioned — multiple Class C/D anchors support 8 as a genuinely deployed low-precision replica width, but per the 2026-07-20 GPT Pro evidence consult, the public record does not establish a specific required or minimum replica width for a multi-trillion-parameter closed-weight model at unknown precision (the actual Opus/5T scenario this engine models); see the declared-sensitivity case list on this row and research/gptpro-reports/2026-07-20-replica-width-consult.md.",
      "flops.fp8": "carried — 5.0 PF dense FP8 (engine.js flopsFp8 5.00; Blackwell Ultra FP8 unchanged from GB200 basis in the engine row)",
      "flops.bf16": "C10 fallback — fp8/2 = 2.5 PF dense",
      "flops.fp4": "frozen — C2: NVFP4 active path FLOPS = 15e15 (d2 §4.2; Blackwell Ultra 15 PF dense FP4, 1.67× B200)",
    },
  },
  h800: {
    family: "nvidia", boardPowerW: null, kwhPerKwh: null, rentBasis: "committed-planning-rent",
    fabric: 400e9, bwHBM: 3.35e12, nShard: 144, nShardDimension: "N_shard", hbmBytes: 85520809984,
    flops: { bf16: 0.99e15, fp8: 1.98e15 },
    prov: {
      family: "vendor identity — NVIDIA (b9 M3; consumed by the M5 family sliders; uncontested)",
      boardPowerW: "not registered (null) — no per-accelerator OPERATING-power measurement exists in the project source base; the engine's shared operating-power resolver falls back to the analyst TDP proxy (engine.js HW tdp 0.70 kW), labeled in the methods box. Populates on a measured serving-draw disclosure for this part (b9 M3 block note above HW_ROOFLINE).",
      kwhPerKwh: "not registered (null) — electricity is a property of the SECTION / data center a row is priced in, never of the accelerator (im-arc T2, memo research/im-arc-t2-sections-memo.md §3, owner answer d-20260822-4c26; a seeded per-row value would make location a property of the accelerator). A non-null value here would be consumed only by a section that explicitly references it — no section does; see engine-data-dc-v1.js.",
      rentBasis: "committed-planning-rent — the registered $1.75/hr is the IDC annual-commit class ($1.47-2.06/hr mid-2026, row note); one member of the heterogeneous low/committed planning vector (b9 M1 repair; b9 M3 typing — memo research/b9-m3-energy-memo.md §3.1-3.2).",
      fabric: "frozen — NVLink export-capped 400 GB/s aggregate bidirectional per GPU (H800 SKU; roofline-diagnostic.mjs H800 case; d2 receipt pack)",
      bwHBM: "published — 3.35 TB/s HBM3 (H100-class; frozen F1 recipe hbmBps 3.35e12; = engine.js bw 3.35)",
      hbmBytes: "observed framebuffer (H100-80GB-class carry) — nvidia-smi total 81,559 MiB × 2^20 = 85,520,809,984 B, verified for 'NVIDIA H100 80GB HBM3' (see h100.prov.hbmBytes sources); H800 is the same 80 GB SXM HBM3 die/SKU class and no H800-specific pasted output was found — the carry is labeled, not observed-on-H800 (R5 verification note).",
      nShard: "PUBLISHED (R5 AMENDMENT: was analyst-declared 8, STALE — 'F1's 8-GPU node' is the anchor's per-node throughput-normalization basis, not the deployment width) — 144: DeepSeek Day-6 disclosure, verbatim: 'Decoding Phase [Routed Expert EP144, MLA/Shared Expert DP144]: Each deployment unit spans 18 nodes' (×8 GPUs = 144). Prefill unit = EP32/DP32 over 4 nodes (32 GPUs) — prefill width, NOT used by decode feasibility. Source 'deployment unit' adopted as memo §5 'replica width'. Cached: research/primary-sources/deepseek-day6-inference-2026-07-18/ (sha256 3b145f12…). Amends the memo §5 declared cell; adjudication in im3-slice1a-derivations.md §6.",
      "flops.fp8": "published — 1.98 PF dense FP8, H100-class compute (frozen F1 recipe flops 1.98e15; = engine.js flopsFp8 1.98)",
      "flops.bf16": "published — 989 TF dense BF16 (H100-class datasheet value); = fp8/2 (C10-consistent)",
    },
  },
  h20: {
    family: "nvidia", boardPowerW: null, kwhPerKwh: null, rentBasis: "committed-planning-rent",
    fabric: 900e9, bwHBM: 4.0e12, nShard: 16, nShardDimension: "N_shard", hbmBytes: 102625181696,
    flops: { bf16: 0.148e15, fp8: 0.296e15 },
    prov: {
      family: "vendor identity — NVIDIA (b9 M3; consumed by the M5 family sliders; uncontested)",
      boardPowerW: "not registered (null) — no per-accelerator OPERATING-power measurement exists in the project source base; the engine's shared operating-power resolver falls back to the analyst TDP proxy (engine.js HW tdp 0.40 kW), labeled in the methods box. Populates on a measured serving-draw disclosure for this part (b9 M3 block note above HW_ROOFLINE).",
      kwhPerKwh: "not registered (null) — electricity is a property of the SECTION / data center a row is priced in, never of the accelerator (im-arc T2, memo research/im-arc-t2-sections-memo.md §3, owner answer d-20260822-4c26; a seeded per-row value would make location a property of the accelerator). A non-null value here would be consumed only by a section that explicitly references it — no section does; see engine-data-dc-v1.js.",
      rentBasis: "committed-planning-rent — the registered $1.00/hr is the IDC annual-commit class (row note: same chip spans ~$0.76 IDC-annual to $7+ hyperscaler on-demand — the on-demand class is the chinacloud lens, not this cell); one member of the heterogeneous low/committed planning vector (b9 M1 repair; b9 M3 typing — memo research/b9-m3-energy-memo.md §3.1-3.2).",
      fabric: "frozen — 900 GB/s NVLink (H20 keeps full NVLink4; roofline-diagnostic.mjs H20 cases fabricBps 900e9)",
      bwHBM: "published — 4.0 TB/s HBM3 (frozen F2/F3 recipes hbmBps 4.0e12; = engine.js bw 4.00)",
      hbmBytes: "observed framebuffer — nvidia-smi total 97,871 MiB × 2^20 = 102,625,181,696 B for 'NVIDIA H20' (verified 2026-07-18: github.com/NVIDIA/TensorRT-LLM#8023, forums.developer.nvidia.com cudaLaunchHostFunc thread; same total documented for GH200's 96 GB HBM3 partition, docs.nvidia.com grace-perf-tuning-guide).",
      nShard: "PUBLISHED (R5 AMENDMENT: was analyst-declared 8 'deployment-family convention', STALE — the F2/F3 anchor source states the width directly) — 16: LMSYS/Ant Group post (lmsys.org/blog/2025-09-26-sglang-ant-group), verbatim: 'The Decode instance is deployed on a 2-node setup (16× H20 GPUs)' / 'All Decode instances are deployed with a dual-node setup: Attention-DP16 + MoE-EP16'; prefill = single-node TP8 (prefill width, not used by decode feasibility). The repo already carried this at research/consultation-2026-07-10-roofline-verbatim.md:154 without it reaching the normative data. Cached: research/primary-sources/sglang-ant-h20-2026-07-18/ (sha256 53c49762…). Amends the memo §5 declared cell; adjudication in im3-slice1a-derivations.md §6.",
      "flops.fp8": "published — 296 TF dense FP8 (frozen F2/F3 recipes flops 0.296e15; = engine.js flopsFp8 0.296)",
      "flops.bf16": "C10 fallback — fp8/2 = 148 TF dense; matches NVIDIA's published H20 BF16 148 TF",
    },
  },
  tpu7: {
    family: "tpu", boardPowerW: null, kwhPerKwh: null, rentBasis: "committed-planning-rent",
    fabric: 1.2e12, bwHBM: 7.37e12, nShard: 4, nShardDimension: "N_shard", hbmBytes: 206158430208,
    topologySensitivity: TPU7_TOPOLOGY_SENSITIVITY,
    flops: { bf16: 2.307e15, fp8: 4.614e15 },
    prov: {
      family: "vendor identity — Google TPU (b9 M3; consumed by the M5 family sliders; uncontested)",
      boardPowerW: "not registered (null) — no per-accelerator OPERATING-power measurement exists in the project source base; the engine's shared operating-power resolver falls back to the analyst TDP proxy (engine.js HW tdp 1.00 kW), labeled in the methods box. Populates on a measured serving-draw disclosure for this part (b9 M3 block note above HW_ROOFLINE).",
      kwhPerKwh: "not registered (null) — electricity is a property of the SECTION / data center a row is priced in, never of the accelerator (im-arc T2, memo research/im-arc-t2-sections-memo.md §3, owner answer d-20260822-4c26; a seeded per-row value would make location a property of the accelerator). A non-null value here would be consumed only by a section that explicitly references it — no section does; see engine-data-dc-v1.js.",
      rentBasis: "committed-planning-rent — the registered $5.40/chip-hr is Google's PUBLISHED 3-year committed rate (b9 M1, r4 defect D4); one member of the heterogeneous low/committed planning vector (b9 M1 repair; b9 M3 typing — memo research/b9-m3-energy-memo.md §3.1-3.2).",
      fabric: "frozen — ICI 1.2 TB/s per chip (d2 §5 recipe 5; memo §6 known value)",
      bwHBM: "published — 7.37 TB/s HBM per chip (frozen recipe 5 'HBM 192 GB @ 7.37e12'; = engine.js bw 7.37)",
      hbmBytes: "published, unit EXPLICIT at source — 192 GiB × 2^30 = 206,158,430,208 B: Google Cloud TPU docs table 'HBM capacity per chip (GiB) … 192' (docs.cloud.google.com/tpu/docs/tpu7x, also compute/docs/tpus/tpu-machines), corroborated by the Hot Chips 2025 Ironwood deck ('capacity 192 GiB, 8 stacks HBM3E') and arXiv:2606.15870 (verified 2026-07-18). No reserved-carve-out figure published; raw capacity adopted, labeled.",
      nShard: "frozen — 4 (d2 §1.3: TP8 across 8 tensorcores = the 4-chip host, one replica)",
      "flops.fp8": "published — 4,614 TF FP8 per Ironwood chip (frozen recipe 5 / C9-adjacent [RP §2b]; = engine.js flopsFp8 4.61)",
      "flops.bf16": "C10 fallback — fp8/2 = 2.307 PF dense (no published Ironwood dense-BF16 figure in the project source base; analyst-set via the C10 rule, labeled)",
    },
  },
  trn2: {
    family: "trainium", boardPowerW: null, kwhPerKwh: null, rentBasis: "committed-planning-rent",
    fabric: 1.28e12, bwHBM: 2.9e12, nShard: 16, nShardDimension: "N_shard", hbmBytes: 103079215104,
    topologySensitivity: TRAINIUM_TOPOLOGY_SENSITIVITY,
    flops: { bf16: 0.65e15, fp8: 1.30e15 },
    prov: {
      family: "vendor identity — AWS Trainium (b9 M3; consumed by the M5 family sliders; uncontested)",
      boardPowerW: "not registered (null) — no per-accelerator OPERATING-power measurement exists in the project source base; the engine's shared operating-power resolver falls back to the analyst TDP proxy (engine.js HW tdp 0.50 kW), labeled in the methods box. Populates on a measured serving-draw disclosure for this part (b9 M3 block note above HW_ROOFLINE).",
      kwhPerKwh: "not registered (null) — electricity is a property of the SECTION / data center a row is priced in, never of the accelerator (im-arc T2, memo research/im-arc-t2-sections-memo.md §3, owner answer d-20260822-4c26; a seeded per-row value would make location a property of the accelerator). A non-null value here would be consumed only by a section that explicitly references it — no section does; see engine-data-dc-v1.js.",
      rentBasis: "committed-planning-rent — the registered $2.235/chip-hr is AWS's PUBLISHED Capacity Blocks rate (b9 M1, r4 defect D4); one member of the heterogeneous low/committed planning vector (b9 M1 repair; b9 M3 typing — memo research/b9-m3-energy-memo.md §3.1-3.2).",
      fabric: "PUBLISHED (b9 M1 AMENDMENT: was frozen 1.024e12, STALE — run B §B1/§C1) — 1.28 TB/s NeuronLink per Trainium2 device (AWS specification). The frozen d2 §5 recipe 6-7 value of 1,024 GB/s materially understated the published hardware. NOTE: this term has NO effect on the displayed FP8/HBM-binding midpoint (the decode path binds on t_H, not t_N, at every default operating point) — it corrects the registry for subsequent communication-modeling scenarios (M2).",
      bwHBM: "published — 96 GiB @ 2.9 TB/s per chip (frozen recipe 6-7; = engine.js bw 2.90)",
      hbmBytes: "frozen, unit explicit — the frozen d2 §5 recipe 6-7 states '96 GiB @ 2.9e12 per chip': 96 GiB × 2^30 = 103,079,215,104 B. No AWS framebuffer receipt; the frozen source's own GiB statement adopted.",
      nShard: "frozen — 16 (d2 §1.3: TP16 = the 16-chip trn2.48xlarge instance, one replica)",
      "flops.fp8": "published — ~1.3 PF dense FP8 per chip (AWS Trainium2 spec; = engine.js flopsFp8 1.30)",
      "flops.bf16": "frozen — C10 convention value 0.65e15/chip (d2 §4.2 C10; the dossier-stated 667 TF/chip is within 3% and is reported as sensitivity in the frozen C10 note, convention retained)",
    },
  },
  trn3: {
    family: "trainium", boardPowerW: null, kwhPerKwh: null, rentBasis: "committed-planning-rent",
    fabric: 2.56e12, bwHBM: 4.9e12, nShard: 16, nShardDimension: "N_shard", hbmBytes: 154618822656,
    topologySensitivity: TRAINIUM_TOPOLOGY_SENSITIVITY,
    flops: { bf16: 0.671e15, fp8: 2.51e15, fp4: 2.51e15 }, // fp4 === fp8: AWS publishes 2.517 PF for MXFP8 AND MXFP4 (b9 M1) — native, but no compute doubling
    prov: {
      family: "vendor identity — AWS Trainium (b9 M3; consumed by the M5 family sliders; uncontested)",
      boardPowerW: "not registered (null) — no per-accelerator OPERATING-power measurement exists in the project source base; the engine's shared operating-power resolver falls back to the analyst TDP proxy (engine.js HW tdp 0.80 kW), labeled in the methods box. Populates on a measured serving-draw disclosure for this part (b9 M3 block note above HW_ROOFLINE).",
      kwhPerKwh: "not registered (null) — electricity is a property of the SECTION / data center a row is priced in, never of the accelerator (im-arc T2, memo research/im-arc-t2-sections-memo.md §3, owner answer d-20260822-4c26; a seeded per-row value would make location a property of the accelerator). A non-null value here would be consumed only by a section that explicitly references it — no section does; see engine-data-dc-v1.js.",
      rentBasis: "committed-planning-rent — the registered $2.20/hr is an analyst-set planning estimate — no public Trn3 instance/UltraServer price exists (row note); one member of the heterogeneous low/committed planning vector (b9 M1 repair; b9 M3 typing — memo research/b9-m3-energy-memo.md §3.1-3.2).",
      fabric: "PUBLISHED (post-review adjudication 2026-07-27) — the AWS Neuron architecture docs state Inter-chip Interconnect 2,560 GB/sec/chip for Trainium3, in the same table and convention as Trainium2's 1,280 (already registered as 1.28e12) (https://awsdocs-neuron.readthedocs-hosted.com/en/latest/general/arch/neuron-hardware/trainium3.html). CONFLICT NOTED: the marketing page (https://aws.amazon.com/ec2/instance-types/trn3/) says '2TB/s of bandwidth per chip' for NeuronLink-v4 — likely a different direction/aggregation convention; the engineering docs' same-convention family figure is adopted. The displayed FP8/HBM-binding midpoint does not bind on t_N.",
      bwHBM: "PUBLISHED — 144 GiB HBM3e at 4.9 TB/s per chip (AWS Neuron architecture docs; SI carry of bw 4.90).",
      hbmBytes: "PUBLISHED (post-review adjudication 2026-07-27) — the AWS Neuron architecture docs are unit-explicit: 'HBM Capacity (GiB): 96 → 144' and '144 GiB of device memory' (https://awsdocs-neuron.readthedocs-hosted.com/en/latest/general/arch/neuron-hardware/trainium3.html, retrieved 2026-07-27). 144 GiB × 2^30 = 154,618,822,656 B. This REVERSES the external review's SI re-reading (144e9), which took the marketing page's loose '144 GB' label literally against the unit-explicit engineering docs; HBM3e stack capacities are physically binary quantities, and the trn2 row's frozen source states GiB for the same family.",
      nShard: "analyst-declared — 16 (trn2 carry, memo §5)",
      "flops.fp8": "published — 362 PF FP8 per 144-chip UltraServer ⇒ 2.51 PF/chip (engine.js trn3 note, GA Dec 2025); Neuron architecture docs concur: 2,517 MXFP8/MXFP4 TFLOPS/chip",
      "flops.bf16": "PUBLISHED (post-review adjudication 2026-07-27) — the AWS Neuron architecture docs state BF16/FP16/TF32 dense = 671 TFLOPS/chip (the 2,517 figure is SPARSE) (https://awsdocs-neuron.readthedocs-hosted.com/en/latest/general/arch/neuron-hardware/trainium3.html). Replaces the C10 fp8/2 fallback of 1.255 PF, which overstated published dense BF16 by 1.87×. NOTE the same docs state Trainium2 BF16 = 667 TFLOPS; the trn2 row deliberately retains its frozen C10 convention value 0.65e15 (labeled, within 3%) — moving it is a frozen-recipe identity decision, flagged in the adjudication report.",
      "flops.fp4": "published NATIVE (b9 M1 — run B §B4/§C1) — AWS states 2.517 PF for MXFP8 AND MXFP4 per Trainium3 device, i.e. ONE figure covering both formats. Registered EQUAL to the fp8 basis: native FP4 arithmetic exists, but no FP4 compute doubling is published, so the row takes the capacity/weight-loading benefit (PRECISION_TUPLES.trn3.fp4 sW 0.5) and NO throughput credit.",
    },
  },
  ascend: {
    family: "ascend", boardPowerW: null, kwhPerKwh: null, rentBasis: "committed-planning-rent",
    fabric: 784e9, bwHBM: 3.2e12, nShard: 128, nShardDimension: "N_shard", hbmBytes: 128e9,
    flops: { bf16: 0.752e15, int8: 1.504e15 }, // NO native FP8 — 8-bit basis is INT8 (structural, memo §6)
    prov: {
      family: "vendor identity — Huawei Ascend (b9 M3; consumed by the M5 family sliders; uncontested)",
      boardPowerW: "not registered (null) — no per-accelerator OPERATING-power measurement exists in the project source base; the engine's shared operating-power resolver falls back to the analyst TDP proxy (engine.js HW tdp 0.60 kW), labeled in the methods box. Populates on a measured serving-draw disclosure for this part (b9 M3 block note above HW_ROOFLINE).",
      kwhPerKwh: "not registered (null) — electricity is a property of the SECTION / data center a row is priced in, never of the accelerator (im-arc T2, memo research/im-arc-t2-sections-memo.md §3, owner answer d-20260822-4c26; a seeded per-row value would make location a property of the accelerator). A non-null value here would be consumed only by a section that explicitly references it — no section does; see engine-data-dc-v1.js.",
      rentBasis: "committed-planning-rent — the registered $1.95/hr is the Huatai procurement-award class ($1.71-2.25/hr, row note); one member of the heterogeneous low/committed planning vector (b9 M1 repair; b9 M3 typing — memo research/b9-m3-energy-memo.md §3.1-3.2).",
      fabric: "frozen — UB (unified bus) 784 GB/s per NPU (d2 §5 recipe 3-4 / roofline-diagnostic.mjs Ascend cases)",
      bwHBM: "published — 128 GB @ 3.2 TB/s per NPU (frozen recipe 3-4; = engine.js bw 3.20)",
      hbmBytes: "ANALYST CONVENTION (labeled) — 128e9 B, the SI reading of the '128 GB' label. R5 verification (2026-07-18) found NO Huawei datasheet with unit precision and NO pasted npu-smi output; third-party sources state a round '128 GB' (one outlier claims 96 GB) with the HBM generation itself contested (HBM2e vs HBM3). The SI reading is the conservative choice and matches the frozen d2 harness's own hbmCap 128e9 for the cm384 rows. Revisit if an npu-smi receipt surfaces.",
      nShard: "declared — 128, the cm384 CO-LOCATION instance width (memo §5; frozen §1.3 co-loc 128). The 6P2D decode-pool width 144 (frozen §1.3) is an observation-level constant of the cm384-6p2d recipe, NOT this row's replica width.",
      "flops.int8": "frozen — C9: Ascend 910C 1.504e15 dense INT8 (Huawei Atlas spec; the 1,054 TF figure is a CloudMatrix-paper typo per engine.js note). NO native FP8 exists on this part — the engine's 8-bit precision selection resolves to this INT8 basis (naming now structural, memo §6).",
      "flops.bf16": "ANALYST-SET, C10-ANALOG (flagged for 1a review) — 1.504e15/2 = 0.752e15. C10 as frozen reads 'bf16 = fp8_dense/2 where unpublished'; ascend has no fp8, so the rule is applied to its INT8 8-bit dense basis. This exactly carries the current engine's PRECISION_MULT.bf16 = 0.5 rendering behavior forward. Declared convention, not a published value.",
    },
  },
  rubin: {
    family: "nvidia", boardPowerW: null, kwhPerKwh: null, rentBasis: "committed-planning-rent",
    fabric: 3.6e12, bwHBM: 22e12, nShard: 8, nShardDimension: "N_shard", hbmBytes: 309237645312,
    flops: { bf16: 4e15, fp8: 17.5e15 }, // fp4 dense ABSENT — see prov; fp4 tuple falls back to fp8 basis
    prov: {
      family: "vendor identity — NVIDIA (b9 M3; consumed by the M5 family sliders; uncontested)",
      boardPowerW: "not registered (null) — no per-accelerator OPERATING-power measurement exists in the project source base; the engine's shared operating-power resolver falls back to the analyst TDP proxy (engine.js HW tdp 1.80 kW), labeled in the methods box. Populates on a measured serving-draw disclosure for this part (b9 M3 block note above HW_ROOFLINE).",
      kwhPerKwh: "not registered (null) — electricity is a property of the SECTION / data center a row is priced in, never of the accelerator (im-arc T2, memo research/im-arc-t2-sections-memo.md §3, owner answer d-20260822-4c26; a seeded per-row value would make location a property of the accelerator). A non-null value here would be consumed only by a section that explicitly references it — no section does; see engine-data-dc-v1.js.",
      rentBasis: "committed-planning-rent — the registered $8.50/hr is a PROJECTION (PRICE_EVIDENCE 'unpriced'; the row renders shape-only and never prices a fleet leg); one member of the heterogeneous low/committed planning vector (b9 M1 repair; b9 M3 typing — memo research/b9-m3-energy-memo.md §3.1-3.2).",
      row: "PROJECTION — Vera Rubin NVL72 has no serving anchor, no MLPerf result and no public price (engine.js RUBIN note, verified Jul 2026). Hardware shape constants are now published by NVIDIA, but the serving row remains projection-labeled and renders shape-only at joint η (memo §2).",
      hbmBytes: "ANALYST UNIT CONVENTION (labeled) over a PUBLISHED hardware shape — NVIDIA now lists 288 GB HBM4, but does not state whether the label is SI GB or GiB. The registry keeps its prior GiB reading, 288 × 2^30 = 309,237,645,312 B, by NVIDIA framebuffer-labeling analogy; no device receipt resolves the unit or reserved carve-out.",
      fabric: "PUBLISHED HARDWARE SHAPE, PRELIMINARY (post-review adjudication 2026-07-27: the NVL72 spec table carries NVIDIA's footnote 'Preliminary information. All values are up to and subject to change', verified against the live page) — NVIDIA Vera Rubin NVL72 product specification lists 3.6 TB/s NVLink bandwidth per GPU (https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/). This does not supply a serving anchor.",
      bwHBM: "PUBLISHED HARDWARE SHAPE, PRELIMINARY (post-review adjudication 2026-07-27: the NVL72 spec table carries NVIDIA's footnote 'Preliminary information. All values are up to and subject to change', verified against the live page) — NVIDIA Vera Rubin NVL72 product specification lists 288 GB HBM4 at 22 TB/s per GPU (https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/; SI carry of bw 22.0).",
      nShard: "PROJECTION — 8 (memo §5, RUBIN 8)",
      "flops.fp8": "PUBLISHED HARDWARE SHAPE, PRELIMINARY (post-review adjudication 2026-07-27: the NVL72 spec table carries NVIDIA's footnote 'Preliminary information. All values are up to and subject to change', verified against the live page) — NVIDIA Vera Rubin NVL72 product specification lists 17.5 PF dense FP8/FP6 training per GPU (https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/).",
      "flops.bf16": "PUBLISHED HARDWARE SHAPE, PRELIMINARY (post-review adjudication 2026-07-27: the NVL72 spec table carries NVIDIA's footnote 'Preliminary information. All values are up to and subject to change', verified against the live page) — NVIDIA Vera Rubin NVL72 product specification lists 4 PF dense FP16/BF16 per GPU (https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/); replaces the stale fp8/2 fallback of 8.75 PF.",
      "flops.fp4": "ABSENT BY RULE — dense NVFP4 INFERENCE not published (the ~50 PF headline carries no dense marker; the page now lists NVFP4 Training dense = 35 PF, a training figure not adopted for serving); per the memo §6 hard-error rule the field is omitted rather than estimated. The fp4 precision tuple for this row falls back to the fp8 FLOPS basis (see PRECISION_TUPLES.rubin.fp4).",
    },
  },
};

/* =====================================================================================
   3. PRECISION TUPLE REGISTRY (memo §6): scenario enum {bf16, fp8, fp4} × HW row →
   { flopsBasis, sW, sKV, sAct } (bytes per element; flopsBasis names a key of the row's
   HW_ROOFLINE.flops map) — or an explicit fallback. The old PRECISION_MULT.fp4 = 1.85
   scalar is RETIRED, not translated (memo §6). KV dtype per frozen C1: FP8 (sKV 1) on
   NVIDIA/TPU/Trn rows, BF16 (sKV 2) on Ascend-family — including under the fp4 path (C2:
   KV stays FP8 on NVFP4, source-confirmed on gb300). sAct 2 on bf16/fp8 paths = the frozen
   BF16-dispatch payload convention (F1/F5 recipes, diagnostic activationBytes 2); sAct 0.5
   on the NVFP4 path = frozen C2 (equivalently the F4 case's activationBytes 2 × dispatchScale
   0.25). fp4 on a non-fp4-capable row renders on the row's 8-bit FLOPS basis (memo §6:
   today's eligibility behavior without the 1.85 scalar) with sW 0.5 — carrying today's
   feasibility fp4 = 0.5 B/param convention (weights storable in FP4; compute on the 8-bit
   basis). That sW 0.5 pairing is an ANALYST CONVENTION flagged for the 1a review.
   ===================================================================================== */

// Shared tuple shapes (each row cell below is its own reviewed entry; shapes are shorthand
// for identical reviewed values, not runtime indirection)
const T_BF16 = { flopsBasis: "bf16", sW: 2, sKV: 2, sAct: 2 }; // whole-stack BF16 scenario (see P_TUP_BF16)
const T_FP8 = { flopsBasis: "fp8", sW: 1, sKV: 1, sAct: 2 };
const T_FP4 = { flopsBasis: "fp4", sW: 0.5, sKV: 1, sAct: 0.5 }; // frozen C2 NVFP4 path
const T_FP4_FALLBACK = { flopsBasis: "fp8", sW: 0.5, sKV: 1, sAct: 2, fallback: "fp4-not-capable" };

const P_TUP_BF16 = "whole-stack BF16 scenario: sW/sKV/sAct = 2 B/elt uniformly. The frozen source's only BF16 serving points (trn2 recipes 6-7) carry s_KV = 2; a 'BF16 weights + FP8 KV' hybrid is a configuration no source states, so the uniform reading is the declared convention (C1's FP8-KV default governs the fp8 tuples' unknown-dtype closure, not this whole-stack scenario)";
const P_TUP_FP8 = "FP8 path: sW 1, KV FP8 sKV 1 (C1), dispatch payload BF16 sAct 2 (frozen F1 convention / diagnostic activationBytes 2)";
const P_TUP_FP4 = "NVFP4 path per frozen C2: FLOPS basis fp4, sW 0.5 (W_iter = A_m/2 ⇒ 18.5 GB on the 37B reference), KV stays FP8 sKV 1 (source-confirmed on gb300), sAct 0.5";
const P_TUP_FP4_FB = "fp4 selected on a non-fp4-capable row: renders on the 8-bit FLOPS basis per memo §6 (today's eligibility behavior, 1.85 scalar retired); sW 0.5 carries today's feasibility fp4 = 0.5 B/param convention — ANALYST CONVENTION flagged for 1a review; KV per C1";

const PRECISION_TUPLES = {
  h100: { bf16: { ...T_BF16, prov: P_TUP_BF16 }, fp8: { ...T_FP8, prov: P_TUP_FP8 }, fp4: { ...T_FP4_FALLBACK, prov: P_TUP_FP4_FB } },
  h200: { bf16: { ...T_BF16, prov: P_TUP_BF16 }, fp8: { ...T_FP8, prov: P_TUP_FP8 }, fp4: { ...T_FP4_FALLBACK, prov: P_TUP_FP4_FB } },
  gb200: { bf16: { ...T_BF16, prov: P_TUP_BF16 }, fp8: { ...T_FP8, prov: P_TUP_FP8 }, fp4: { ...T_FP4, prov: P_TUP_FP4 + " (F4 recipe: FLOPS 10e15, W_iter 18.5 GB, activationBytes 2 × dispatchScale 0.25 ≡ sAct 0.5)" } },
  gb300: { bf16: { ...T_BF16, prov: P_TUP_BF16 }, fp8: { ...T_FP8, prov: P_TUP_FP8 }, fp4: { ...T_FP4, prov: P_TUP_FP4 } },
  h800: { bf16: { ...T_BF16, prov: P_TUP_BF16 }, fp8: { ...T_FP8, prov: P_TUP_FP8 + " — the F1 calibration path" }, fp4: { ...T_FP4_FALLBACK, prov: P_TUP_FP4_FB } },
  h20: { bf16: { ...T_BF16, prov: P_TUP_BF16 }, fp8: { ...T_FP8, prov: P_TUP_FP8 + " — the F2/F3 calibration path" }, fp4: { ...T_FP4_FALLBACK, prov: P_TUP_FP4_FB } },
  tpu7: { bf16: { ...T_BF16, prov: P_TUP_BF16 }, fp8: { ...T_FP8, prov: P_TUP_FP8 + " — matches frozen recipe 5 (FP8 sW 1, FP8 KV sKV 1)" }, fp4: { ...T_FP4_FALLBACK, prov: P_TUP_FP4_FB } },
  trn2: { bf16: { ...T_BF16, prov: P_TUP_BF16 + " — the trn2 recipes 6-7 ARE the source basis for this convention; C10 FLOPS basis" }, fp8: { ...T_FP8, prov: P_TUP_FP8 }, fp4: { ...T_FP4_FALLBACK, prov: P_TUP_FP4_FB } },
  trn3: { bf16: { ...T_BF16, prov: P_TUP_BF16 + " — trn2-family carry (analyst-declared, labeled)" }, fp8: { ...T_FP8, prov: P_TUP_FP8 },
    // b9 M1 (run B §B4/§C1): NATIVE MXFP4 / W4A8 — no longer a "fp4-not-capable" fallback.
    // AWS publishes native MXFP4 at 2.517 PF/chip, the SAME peak as its MXFP8 — so the
    // FLOPS basis is native and the CAPACITY/weight-loading benefit is real (sW 0.5), while
    // the THROUGHPUT is deliberately UNCREDITED: run B, "native FP4 support does not
    // establish a 2× end-to-end serving gain… leave throughput uncredited until a serving
    // anchor exists". Numerically identical to the retired fallback tuple by construction —
    // this corrects a false capability label, it does not move any rendered number.
    fp4: { flopsBasis: "fp4", sW: 0.5, sKV: 1, sAct: 2, prov: "PUBLISHED NATIVE (b9 M1 AMENDMENT: was T_FP4_FALLBACK 'fp4-not-capable' on the fp8 basis, STALE) — AWS Trainium3 publishes native MXFP8/MXFP4 at 2.517 PF per chip. HW_ROOFLINE.trn3.flops.fp4 is registered at the SAME value as fp8 because AWS publishes ONE figure for both formats: there is no published FP4 compute doubling on this part, so no throughput credit is taken. W4A8 reading: weights at 0.5 B/param (the real capacity/loading effect), KV FP8 per frozen C1, dispatch payload BF16 sAct 2. Quantization quality and kernel support remain separate, unmodeled eligibility questions (run B §B4)." } },
  ascend: {
    bf16: { ...T_BF16, prov: P_TUP_BF16 + " — on Ascend additionally C1-consistent (Ascend-family KV BF16); FLOPS basis the C10-analog bf16 cell (see HW_ROOFLINE.ascend.prov)" },
    fp8: { flopsBasis: "int8", sW: 1, sKV: 2, sAct: 2, naming: "int8", prov: "the engine's 8-bit selection on Ascend resolves to INT8 W8A8 (NO native FP8 — memo §6 structural naming; frozen C9/recipe 3-4: sW 1, sKV 2 per C1 Ascend-family BF16 KV, sAct 2)" },
    fp4: { flopsBasis: "int8", sW: 0.5, sKV: 2, sAct: 2, fallback: "fp4-not-capable", prov: P_TUP_FP4_FB + "; on Ascend the 8-bit basis is INT8 and KV stays BF16 sKV 2 (C1)" },
  },
  rubin: {
    bf16: { ...T_BF16, prov: P_TUP_BF16 + " — PROJECTION row" },
    fp8: { ...T_FP8, prov: P_TUP_FP8 + " — PROJECTION row" },
    fp4: { flopsBasis: "fp8", sW: 0.5, sKV: 1, sAct: 0.5, fallback: "fp4-dense-flops-unpublished",
      prov: "RUBIN is fp4-capable but its DENSE NVFP4 FLOPS is unpublished (HW_ROOFLINE.rubin.prov['flops.fp4']) — rather than invent a peak, the tuple renders on the fp8 FLOPS basis (conservative) while keeping the C2 byte widths (sW 0.5, sAct 0.5, KV FP8). PROJECTION + ANALYST CONVENTION, flagged for 1a review." },
  },
};

/* =====================================================================================
   4. CALIBRATION & DEPLOYMENT REGISTRY (memo §2)
   Deployed η per row = the value making the frozen §1 roofline — evaluated at the row's
   calibration operating point (b, L), q = 1 / a = 1, the row's calibration precision
   tuple, active-37B reference model (dsr1 geometry), MoE-EP mode, t_cc = 0, stackMult 1 —
   reproduce the CURRENT ENGINE's deployed decode tok/s at interact "batch" (mult 1.0).
   A pure re-parametrization of the v2.1.11 deployed effDec: COMPUTED, not chosen. Full
   arithmetic + forward reproduction checks: research/im3-slice1a-derivations.md.
   Source-observation q/a recorded as UNUSED PROVENANCE (render rule is q=1/a=1, header).
   η is FIXED per row — service-regime variation comes from the roofline's batch/context
   dependence (§4 registry), never from η switching. impliedEta values are the frozen fit's
   per-observation diagnostics (memo §2) — diagnostics ONLY, never render inputs.
   ===================================================================================== */

/* Decode weight-traffic basis — CLOSED typed enum (b9 M1, decision M1-D1; memo §2).
   Which quantity a row's decode step charges as weight traffic. The basis is a MATCHED
   PAIR with the row's η (run B §A4: an aggregate-form coefficient is valid only in the
   topology-aware representation), so the two must never be edited apart.
   - "active-parameter-surrogate": the historical default and the value assumed when the
     field is absent — the full active-parameter read charged to every device,
     width-independent. Every row except tpu7 is on this basis at b9 M1.
   - "replica-resident-distinct": the replica's DISTINCT weight traffic shared across its
     DECLARED replica width (CALIBRATION.<row>.declaredReplicaWidth), paired with a
     per-chip batch b = B_rep / N_phys. `declaredReplicaWidth` is a REGISTRY constant, never
     the solved capacity width: decode throughput must stay independent of the capacity
     solver so the capacity-only loadedWeightBytesPerParam policy keeps no route into a
     throughput term (feasibility-redesign memo §0-bis firewall).
   - "expert-coverage" (b9 M2): the general run B §C4 term
     W_distinct(B) = W_shared + Σ_e W_e·[1 − (1 − p_e)^{B_rep·q}], shared across N_phys, where
     p_e is an expert's per-token inclusion probability (uniform top-k routing: p_e = k/E). A row
     may declare it only with BOTH a populated placement record for the rendered model AND an η
     calibrated in this representation. NO default fleet leg is on it at M2 — memo §2: the
     form-corrected headline is not identified by the public evidence.
   FIELD NAME (b9 M2, manifest family 1): the memo §3.1/§10.6 calls this `decodeTrafficModel`; the
   shipped identifier stays `decodeTrafficBasis` (M1's name). The rename was declined deliberately —
   it would churn every CALIBRATION row, the roofline, the MCP fixtures and the snapshots for zero
   semantic gain. Same field, same meaning.
   COVERAGE DIRECTION (b9 M2, design gate R5): uniform p_e = k/E is the coverage-MAXIMISING setting,
   not a favourable one. f(p) = 1−(1−p)^n is concave, so by Jensen Σ_e f(p_e) is maximised at uniform;
   concentrating the same mass on fewer experts LOWERS coverage (E=256, k=8, B_rep=64, q=1:
   uniform 0.86892, over 128 experts 0.49196). Computed coverage is therefore an upper bound on MODELLED traffic and NO
   bound on actual traffic — Ironwood streams the FULL footprint at B_rep=64 (coverage 1.0), above
   the model's own uniform maximum. Never label this term "favourable". */
const DECODE_TRAFFIC_BASES = Object.freeze([
  "active-parameter-surrogate", "replica-resident-distinct", "expert-coverage"]);

/* d-im-h800 (owner note aca09d, 2026-08-18): the NVLink-cap LINEAGE of each calibration row — the
   typed carrier of the H800/H100 differential. Grounded delta (NVIDIA H800 datasheet 2631447 Feb-2023
   vs the H100 SXM datasheet; Lenovo Press LP1814; Tencent Cloud HCCPNV5): the export SKU differs
   from the H100 SXM in NVLink (400 vs 900 GB/s aggregate bidirectional) and FP64 (1 vs 34 TF) ONLY —
   FP8/BF16 tensor rate, HBM capacity, HBM bandwidth and TDP are identical. In THIS engine the fabric
   term already exists (HW_ROOFLINE fabric → decode t_N, prefill t_fabric) and at every shipped
   MoE-EP operating point it is SLACK under the frozen max() form, so the two rows render identical
   throughput; and h100/h200 INHERIT the η FITTED on the capped part (F1, DeepSeek's production
   disclosure ran on H800s). The row that carries the measurement is the H800; the rows that borrow
   it are the ones an assumption is being made about. Hence three lineages:
     "capped-anchor"               — the fitted anchor IS the export-capped part; the lever never
                                     touches it, because its throughput is the measurement;
     "uncapped-borrows-capped-fit" — an uncapped-NVLink NVIDIA row with EXACTLY the anchor's
                                     compute/HBM constants wearing the H800's fitted η (h100): the
                                     `nvlinkCapMinRatio` fit-transfer assumption applies here;
     "uncapped-family-borrows-capped-fit" — an uncapped-NVLink row that family-transfers the H800
                                     fit onto ITS OWN HBM constants (h200): eligible for the same
                                     assumption, but a provenance-distinct, weaker transfer (Pro
                                     review 2026-08-18 Q4 — the two facts, where the efficiency came
                                     from and whether the row is capped, must not collapse into one
                                     value that reads as the same-quality transfer);
     "not-applicable"              — own anchor, or a different fabric family (Blackwell NVL72, H20
                                     with full NVLink4 and its own F2/F3 fit, TPU/Trainium/Ascend,
                                     the unpriced Rubin projection). Eligibility follows PROVENANCE
                                     — never the marketing family or the nominal fabric speed.
   The fit was obtained on the capped H800 system and MAY include cap-related effects that cannot be
   separately identified — that is the honest statement, not "the fit contains the cap".
   Absent ⇒ hard error at the engine (no implementer default): a row that has not declared its
   lineage cannot silently be exempt. */
const NVLINK_CAP_LINEAGES = Object.freeze([
  "capped-anchor", "uncapped-borrows-capped-fit", "uncapped-family-borrows-capped-fit", "not-applicable"]);

/* Which of run B §A1's three batch quantities an OPERATING_POINTS cell states (b9 M2, memo §6.1).
   Run B §A3: "The correct schema must retain B_rep, N_phys, attention DP, expert EP, and logical TP
   independently." An untyped `b` that silently means different quantities in different terms IS
   defect class D1. */
const BATCH_QUANTITIES = Object.freeze([
  "B_out_per_chip", "B_rep", "B_attn_local",
  /* "B_rep_consumed_as_B_out_per_chip" — a DECLARED CROSS-QUANTITY SURROGATE (Polaris adjudication
     2026-07-27, option 3). The cell states a REPLICA-GLOBAL batch, and the engine consumes it in the
     PER-CHIP slot. That is defect class D1 stated openly rather than hidden: run B prescribes both
     halves and CONTRADICTS ITSELF between them — §A3 "Run A's proposed 16-64 values correspond to
     replica-global batch, not per-chip batch", while §C1 prescribes trn2.b 4 -> 32 into the per-chip
     cell and its resulting leg margin (34.88%) is what b9 M1 reproduced and the data gate ratified.
     Measured consequence at nPhysDeclared 16: consumed per-chip gives 105.6612 tok/s; read as B_rep
     (per-chip 32/16 = 2) gives 6.9622 tok/s — 15.2x lower. Neither reading has independent ground
     truth today, so the surrogate is TYPED, not resolved: rewriting the sourced basis prose to match
     engine convenience would launder the conflation by editing evidence, and asserting §A3 over §C1
     would break the sanity tripwire and reopen an owner-ratified gate on no new evidence.
     MUST surface through the b9 M2 family-9 debt-disclosure surface carrying an explicit
     "this may be ~15x wrong" statement. A registered follow-up evidence task resolves the true
     per-chip batch from primary sources and RETIRES this member. */
  "B_rep_consumed_as_B_out_per_chip"]);

const JOINT_ETA_DEC = 0.36142; // frozen d2 §3.1-§3.2 joint fleet fit (G4-passing cross-platform model)
const ETA_PRE = 0.17581;       // frozen F7 identity fit (memo §8: universal transfer)

const CALIBRATION = {
  h800: {
    etaDec: 0.313491, etaStatus: "FITTED (deployed; computed per §2 rule — slice-1a derivation)",
    // b9 M2 (memo §3.1/§4): REQUIRED typed trio, no implementer default on any of them.
    // etaRepresentation names the traffic representation this coefficient was DERIVED in —
    // an η may never be read in any other (run B §A4, promoted from prose to a type).
    // nPhysDeclared is a REGISTRY constant, NEVER the solved capacity width (§0-bis firewall).
    decodeTrafficBasis: "active-parameter-surrogate", etaRepresentation: "active-parameter-surrogate",
    nPhysDeclared: 144,
    // declared registry replica width (= HW_ROOFLINE.h800.nShard); provenance on that row
    // b9 spec-decode LEVER (memo D-SD-3): REQUIRED typed baseline status. The credit
    // applies ONLY to "excluded"; "included" and "unknown" are exempt and say so on the leg.
    // anchor obsQ/obsA = 1/1 — no speculation in the disclosed observation
    specDecBaselineStatus: "excluded",
    // d-im-h800: typed NVLink-cap lineage (closed set NVLINK_CAP_LINEAGES above) — the F1 anchor was measured ON H800s (400 GB/s NVLink); its η is the capped part's own — the lever never applies here
    nvlinkCapLineage: "capped-anchor",
    /* THE BASIS RULE (memo §5, D-SD-3). Every entry is MECHANICALLY VERIFIABLE — a verbatim
       quotation with file:line, or a committed probe whose stdout must equal `expect` — and T-13
       EXECUTES both rather than inspecting prose. Nothing is admitted for being arithmetically
       suggestive; a row with no verifiable basis is typed `unknown`, which fails closed, so there
       is never a reason to invent one. This rule exists because two earlier drafts of the design
       memo reached for a crisp arithmetic hook and manufactured it. */
    /* excluded — the disclosed anchor observation carries no speculation */
    specDecBaselineBasis: [
      { kind: "quote", source: "site/engine-data-v22.js", line: 969, text: "obsQ: 1, obsA: 1" },
    ],
    throughputEvidenceClass: "fitted", clusterId: "c-h800-deepseek-prod", sourceRefs: ["research/evidence-instances-v22.json#h800-deepseek-prod-dec", "frozen d2 §3.1 F1 (DeepSeek Feb 2025 production disclosure)"], // typed selector inputs (IM4 slice A; etaStatus prose above is display-only)
    bindingTerm: "t_H",
    deployedBasis: "current engine deployed effDec 0.070 ⇒ 1,872.9730 tok/s (1.98e15 × 0.070 / 74e9) at the F1 operating point — the snapshot-pin ≈1,873 basis, which relates to the 1,850 source anchor through the engine's documented rounding conventions (memo §2)",
    calObs: { id: "F1 h800-prod-dec", b: 96, L: 4989, precision: "fp8", measured: 1850,
      anchorAlreadyIncludesMTP: false, // b9 M2 (run B §B10 D5 fix): F1 states q=1/a=1 — no speculative decoding in the disclosed operating point, so η carries no MTP credit. Run B: "Do not apply one universal multiplier."
      obsQ: 1, obsA: 1, // provenance only — already the render values here
      source: "DeepSeek Feb 2025 production disclosure: 14.8k out tok/s per 8×H800 node ⇒ 1,850/GPU; b=96, KV length 4,989, FP8 KV, W_iter 37 GB (frozen d2 §3.1)" },
    impliedEta: { F1: 0.3097 },
    additionalObs: "F7 prefill (identity, memo §8) — prefill leg, not decode calibration",
  },
  h100: {
    etaDec: 0.313491, etaStatus: "FITTED-inherited (h800 fit; 'H800-class compute', memo §2)",
    // b9 M2 (memo §3.1/§4): REQUIRED typed trio, no implementer default on any of them.
    // etaRepresentation names the traffic representation this coefficient was DERIVED in —
    // an η may never be read in any other (run B §A4, promoted from prose to a type).
    // nPhysDeclared is a REGISTRY constant, NEVER the solved capacity width (§0-bis firewall).
    decodeTrafficBasis: "active-parameter-surrogate", etaRepresentation: "active-parameter-surrogate",
    nPhysDeclared: 144,
    // declared registry replica width (= HW_ROOFLINE.h100.nShard); provenance on that row
    // b9 spec-decode LEVER (memo D-SD-3): REQUIRED typed baseline status. The credit
    // applies ONLY to "excluded"; "included" and "unknown" are exempt and say so on the leg.
    // typed lineage: inherits CALIBRATION.h800 (see sourceRefs on this row)
    specDecBaselineStatus: "excluded",
    // d-im-h800: typed NVLink-cap lineage (closed set NVLINK_CAP_LINEAGES above) — inherits CALIBRATION.h800's FITTED η onto a 900 GB/s NVLink part with IDENTICAL FLOPS/HBM constants; the fit-transfer assumption states the assumed minimum ratio of this row over its own capped counterfactual
    nvlinkCapLineage: "uncapped-borrows-capped-fit",
    /* THE BASIS RULE (memo §5, D-SD-3). Every entry is MECHANICALLY VERIFIABLE — a verbatim
       quotation with file:line, or a committed probe whose stdout must equal `expect` — and T-13
       EXECUTES both rather than inspecting prose. Nothing is admitted for being arithmetically
       suggestive; a row with no verifiable basis is typed `unknown`, which fails closed, so there
       is never a reason to invent one. This rule exists because two earlier drafts of the design
       memo reached for a crisp arithmetic hook and manufactured it. */
    /* excluded — inherits h800’s η through a TYPED lineage edge; numeric equality is a CONSEQUENCE of that inheritance, so it is a separate consistency probe and never the evidence for it */
    specDecBaselineBasis: [
      { kind: "quote", source: "site/engine-data-v22.js", line: 1000, text: "sourceRefs: [\"inherits CALIBRATION.h800 (FITTED-inherited; memo §2)\"]" },
      { kind: "probe", script: "tests/probes/specdec-eta-consistency.mjs", expect: "h100:0.313491;h800:0.313491;equal=true", stdout: "trim" },
    ],
    throughputEvidenceClass: "fitted-inherited", clusterId: "c-h800-deepseek-prod", sourceRefs: ["inherits CALIBRATION.h800 (FITTED-inherited; memo §2)"], // typed selector inputs (IM4 slice A; etaStatus prose above is display-only)
    bindingTerm: "t_H",
    deployedBasis: "inherits h800's deployed η; reproduces h100's current deployed 1,872.9730 tok/s exactly (identical FLOPS/HBM constants; binding t_H unaffected by the h100/h800 fabric difference — shown in the derivations file)",
    calObs: null, // no own observation — family inheritance
    impliedEta: {},
  },
  h200: {
    etaDec: 0.313491, etaStatus: "family-transfer (in-family extrapolation off the H800/H100-class fit — tier-(b), memo §1; NOT in the joint-η bucket)",
    // b9 M2 (memo §3.1/§4): REQUIRED typed trio, no implementer default on any of them.
    // etaRepresentation names the traffic representation this coefficient was DERIVED in —
    // an η may never be read in any other (run B §A4, promoted from prose to a type).
    // nPhysDeclared is a REGISTRY constant, NEVER the solved capacity width (§0-bis firewall).
    decodeTrafficBasis: "active-parameter-surrogate", etaRepresentation: "active-parameter-surrogate",
    nPhysDeclared: 144,
    // declared registry replica width (= HW_ROOFLINE.h200.nShard); provenance on that row
    // b9 spec-decode LEVER (memo D-SD-3): REQUIRED typed baseline status. The credit
    // applies ONLY to "excluded"; "included" and "unknown" are exempt and say so on the leg.
    // typed lineage: family-transfer off CALIBRATION.h800 (see sourceRefs on this row)
    specDecBaselineStatus: "excluded",
    // d-im-h800: typed NVLink-cap lineage (closed set NVLINK_CAP_LINEAGES above) — family-transfer off the H800 fit onto a 900 GB/s NVLink part with its OWN HBM constants: eligible for the fit-transfer assumption, typed as the provenance-distinct (weaker) transfer it is
    nvlinkCapLineage: "uncapped-family-borrows-capped-fit",
    /* THE BASIS RULE (memo §5, D-SD-3). Every entry is MECHANICALLY VERIFIABLE — a verbatim
       quotation with file:line, or a committed probe whose stdout must equal `expect` — and T-13
       EXECUTES both rather than inspecting prose. Nothing is admitted for being arithmetically
       suggestive; a row with no verifiable basis is typed `unknown`, which fails closed, so there
       is never a reason to invent one. This rule exists because two earlier drafts of the design
       memo reached for a crisp arithmetic hook and manufactured it. */
    /* excluded — same typed lineage, by family transfer */
    specDecBaselineBasis: [
      { kind: "quote", source: "site/engine-data-v22.js", line: 1032, text: "sourceRefs: [\"family-transfer off CALIBRATION.h800 (memo §1; derivations finding 4)\"]" },
      { kind: "probe", script: "tests/probes/specdec-eta-consistency.mjs", expect: "h200:0.313491;h800:0.313491;equal=true", stdout: "trim" },
    ],
    throughputEvidenceClass: "family-transfer", clusterId: "c-h800-deepseek-prod", sourceRefs: ["family-transfer off CALIBRATION.h800 (memo §1; derivations finding 4)"], // typed selector inputs (IM4 slice A; etaStatus prose above is display-only)
    bindingTerm: "t_H",
    deployedBasis: "h800's deployed η applied to h200 hardware constants (memo §1/§2). NOT tuned to reproduce the current hand-set effDec 0.085: at F1-op-point conditions the roofline gives ≈2,683.7 tok/s vs the current 2,274.3 (+18.0%) — an EXPECTED family-transfer movement, deltas tabulated at slice 2/3 (derivations file, finding 4)",
    calObs: null,
    impliedEta: {},
  },
  h20: {
    etaDec: 0.217022, etaStatus: "analyst-set (source-informed neutral adjustment: deployed 680 tok/s differs from the 714 tok/s observation; not a fit)",
    // b9 M2 (memo §3.1/§4): REQUIRED typed trio, no implementer default on any of them.
    // etaRepresentation names the traffic representation this coefficient was DERIVED in —
    // an η may never be read in any other (run B §A4, promoted from prose to a type).
    // nPhysDeclared is a REGISTRY constant, NEVER the solved capacity width (§0-bis firewall).
    decodeTrafficBasis: "active-parameter-surrogate", etaRepresentation: "active-parameter-surrogate",
    nPhysDeclared: 16,
    // declared registry replica width (= HW_ROOFLINE.h20.nShard); provenance on that row
    // b9 spec-decode LEVER (memo D-SD-3): REQUIRED typed baseline status. The credit
    // applies ONLY to "excluded"; "included" and "unknown" are exempt and say so on the leg.
    // IM3 §2 absorbed set — the anchor's throughput embeds spec-decode, absorbed INTO deployed η
    specDecBaselineStatus: "included",
    // d-im-h800: typed NVLink-cap lineage (closed set NVLINK_CAP_LINEAGES above) — full 900 GB/s NVLink4 (HW_ROOFLINE.h20.fabric) and its OWN F2/F3 fit measured on H20 — no borrowed capped efficiency
    nvlinkCapLineage: "not-applicable",
    /* THE BASIS RULE (memo §5, D-SD-3). Every entry is MECHANICALLY VERIFIABLE — a verbatim
       quotation with file:line, or a committed probe whose stdout must equal `expect` — and T-13
       EXECUTES both rather than inspecting prose. Nothing is admitted for being arithmetically
       suggestive; a row with no verifiable basis is typed `unknown`, which fails closed, so there
       is never a reason to invent one. This rule exists because two earlier drafts of the design
       memo reached for a crisp arithmetic hook and manufactured it. */
    /* included — IM3 §2 names this row in its absorbed set: the anchor’s throughput embeds spec-decode and that effect is absorbed INTO the deployed η */
    specDecBaselineBasis: [
      { kind: "quote", source: "research/im3-integration-design.md", line: 134, text: "Where an anchor's throughput embeds spec-decode (h20, gb300, ascend" },
    ],
    throughputEvidenceClass: "source-informed-neutral", clusterId: null, sourceRefs: ["research/evidence-instances-v22.json#h20-ant-sglang-pro (F2 input observation)", "research/evidence-instances-v22.json#h20-ant-sglang (F3 input observation)", "research/evidence-instances-v22.json#h20-neutral-live-dec (live analyst-set identity)", "frozen d2 §3.1 F2/F3"], // typed selector inputs (external-review correction: the deployed neutral does not reproduce either observation)
    bindingTerm: "t_C", // compute binds at q=1 AND at the source observation's q=3/a=1.85 (t_C 45.958 > t_H 14.431 > t_N 2.129 ms — NO binding flip; q/a changes magnitudes and η-comparability, not the binding term; derivations finding 2)
    deployedBasis: "legacy effDec 0.170 defines the neutral 680.0000 tok/s throughput target (0.296e15 × 0.170 / 74e9) at the F3 operating point; the executable roofline mapping is etaDec 0.217022. This is the hardware dive's neutral recommendation (≈680 basis), NOT the 714 anchor-reproducer (memo §2)",
    calObs: { id: "F3 h20-base", b: 48, L: 4096, precision: "fp8", measured: 714,
      anchorAlreadyIncludesMTP: true,
      obsQ: 3, obsA: 1.85,
      source: "Primary LMSYS/Ant production post: InferX Base b=48, L=4,096, one-step/two-draft-token MTP with about 1.8-1.9 accepted tokens, 714 tok/s/GPU at TPOT<70ms; the full weight precision path remains undisclosed" },
    impliedEta: { F2: 0.349, F3: 0.370 }, // F2 (b=32 Pro tier) = diagnostic only (memo §2)
    tripwire: "TRIPWIRE FLAG (memo hard rule): deployed η 0.217022 is +9.06% of 0.199 (= the tpu7-anchor-tuning coincidence value ≈ 0.361/1.82). Reported, not acted on — the value follows deterministically from the §2 rule (680 neutral basis). See derivations finding 1. Sol data-gate review 2026-07-18: ADJUDICATED CLEAR — the h20 neutral basis carries a fully independent provenance chain predating both cycles; flag retained for the record.",
  },
  gb200: {
    etaDec: 0.315997, etaStatus: "FITTED (deployed; computed per §2 rule — slice-1a derivation; b9 M1: precision double-credit REMOVED)",
    // b9 M2 (memo §3.1/§4): REQUIRED typed trio, no implementer default on any of them.
    // etaRepresentation names the traffic representation this coefficient was DERIVED in —
    // an η may never be read in any other (run B §A4, promoted from prose to a type).
    // nPhysDeclared is a REGISTRY constant, NEVER the solved capacity width (§0-bis firewall).
    decodeTrafficBasis: "active-parameter-surrogate", etaRepresentation: "active-parameter-surrogate",
    nPhysDeclared: 8,
    // declared registry replica width (= HW_ROOFLINE.gb200.nShard); provenance on that row
    // b9 spec-decode LEVER (memo D-SD-3): REQUIRED typed baseline status. The credit
    // applies ONLY to "excluded"; "included" and "unknown" are exempt and say so on the leg.
    // anchor obsQ/obsA = 1/1 — no speculation in the disclosed observation
    specDecBaselineStatus: "excluded",
    // d-im-h800: typed NVLink-cap lineage (closed set NVLINK_CAP_LINEAGES above) — own vLLM R1 anchor on an NVL72 fabric — different fabric family, nothing borrowed from the capped fit
    nvlinkCapLineage: "not-applicable",
    /* THE BASIS RULE (memo §5, D-SD-3). Every entry is MECHANICALLY VERIFIABLE — a verbatim
       quotation with file:line, or a committed probe whose stdout must equal `expect` — and T-13
       EXECUTES both rather than inspecting prose. Nothing is admitted for being arithmetically
       suggestive; a row with no verifiable basis is typed `unknown`, which fails closed, so there
       is never a reason to invent one. This rule exists because two earlier drafts of the design
       memo reached for a crisp arithmetic hook and manufactured it. */
    /* excluded — the disclosed anchor observation carries no speculation */
    specDecBaselineBasis: [
      { kind: "quote", source: "site/engine-data-v22.js", line: 1103, text: "obsQ: 1, obsA: 1" },
    ],
    throughputEvidenceClass: "fitted", clusterId: "c-gb200-vllm-r1", sourceRefs: ["research/evidence-instances-v22.json#gb200-vllm-r1", "frozen d2 §3.1 F4 (vLLM R1 decode observation)", "research/reviews/im-adv-r4-runB-internal-raw.md §B4/§C1 (the de-embedding; its 'FP8 bridge value' label is RETIRED per q-im-fp4-gb200-eta-basis — see deployedBasis)"], // typed selector inputs (IM4 slice A; etaStatus prose above is display-only)
    bindingTerm: "t_H",
    deployedBasis: "0.315997 IS THE FP4-BASIS COEFFICIENT, and its use in the FP8 default render is a DECLARED CONSERVATIVE TRANSFER, not a bridge (owner ruling q-im-fp4-gb200-eta-basis, 2026-08-02, accepted default; relabel only — no number moves). Executed through this repo's own roofline at F4's operating point, 0.315997 reproduces the 10,108 tok/s anchor to 0.06% ON THE FP4 TUPLE (10,114.4) and yields 6,408.5 on the FP8 tuple; the coefficient that reproduces the anchor in the FP8 basis is 0.498413. So at the FP8 default this row under-predicts its own best Blackwell measurement by ~1.58× — conservative, which is why every overclaim-tuned review passed it. THE RETIRED CLAIM, recorded so it cannot come back: b9 M1 (r4 defect D3, run B §B4/§C1) derived 0.315997 = 0.585795 / 1.8538 to de-embed the retired NVFP4 precision scalar, and called the result 'the FP8 bridge value', defended as equalling F4's own implied η 0.316 'an independent confirmation, not a second fit'. It is not independent: research/im3-slice1a-derivations.md:69-70 records that 0.585795 was CONSTRUCTED as 0.316 × 1.8538, so dividing it back cannot fail to return 0.316. The de-embedding correctly removed a double-counted scalar; it did not convert the basis. Slice-1a authored-decision item h (:204-207) registered the FP4 calibration basis as a choice FOR REVIEW with the FP8 alternative pre-computed (10,135.1 / 8,581.1 tok/s) — REOPENED, and the vLLM source-dtype resolution is a registered evidence task (research/update-queue.md). Three incompatible senses of 'the FP8 basis' are live in the documents (the legacy ladder rung 10,135.1, this de-embedded coefficient, and the live tuple render 6,408.5) and what ships is none of them; that is why this field no longer uses the phrase. Archived NVFP4 replay basis: engine deployed effDec 0.150 × PRECISION_MULT.fp4 1.85 ⇒ 18,750.000 tok/s (5.0e15 × 1.85 × 0.150 / 74e9) at the F4 operating point.",
    calObs: { id: "F4 gb200-vllm", b: 128, L: 3000, precision: "fp4", measured: 10108,
      anchorAlreadyIncludesMTP: false, // b9 M2 (run B §B10 D5 fix): F4 states q=1/a=1 — no speculation in the anchor. Run B: "Do not apply one universal multiplier."
      obsQ: 1, obsA: 1,
      source: "vLLM ~10,108 decode tok/s/GPU on R1; b=128, L=3,000, NVFP4 path (W 18.5 GB, FLOPS 10e15), FP8 KV, fabric 1.8e12 (frozen d2 §3.1 F4)" },
    impliedEta: { F4: 0.316 },
  },
  gb300: {
    etaDec: 0.258295, etaStatus: "analyst-set at a DECLARED assumed operating point (b9 M1 relabel — the prior FITTED label was FALSE: the calibration observation carries measured:null and an assumed batch; precision double-credit also REMOVED)",
    // b9 M2 (memo §3.1/§4): REQUIRED typed trio, no implementer default on any of them.
    // etaRepresentation names the traffic representation this coefficient was DERIVED in —
    // an η may never be read in any other (run B §A4, promoted from prose to a type).
    // nPhysDeclared is a REGISTRY constant, NEVER the solved capacity width (§0-bis firewall).
    decodeTrafficBasis: "active-parameter-surrogate", etaRepresentation: "active-parameter-surrogate",
    nPhysDeclared: 8,
    // declared registry replica width (= HW_ROOFLINE.gb300.nShard); provenance on that row
    // b9 spec-decode LEVER (memo D-SD-3): REQUIRED typed baseline status. The credit
    // applies ONLY to "excluded"; "included" and "unknown" are exempt and say so on the leg.
    // ADJUDICATED unknown (Polaris Q-G, esc-…eea22b5c) — the M1-era row provenance governs over IM3's blanket declaration
    specDecBaselineStatus: "unknown",
    // d-im-h800: typed NVLink-cap lineage (closed set NVLINK_CAP_LINEAGES above) — Blackwell family transfer off gb200, not off the H800 fit
    nvlinkCapLineage: "not-applicable",
    /* THE BASIS RULE (memo §5, D-SD-3). Every entry is MECHANICALLY VERIFIABLE — a verbatim
       quotation with file:line, or a committed probe whose stdout must equal `expect` — and T-13
       EXECUTES both rather than inspecting prose. Nothing is admitted for being arithmetically
       suggestive; a row with no verifiable basis is typed `unknown`, which fails closed, so there
       is never a reason to invent one. This rule exists because two earlier drafts of the design
       memo reached for a crisp arithmetic hook and manufactured it. */
    /* unknown — ADJUDICATED by Polaris Q-G (esc-20260731T191924Z-eea22b5c): the M1-era row provenance governs, and this page must never display "we know this is absorbed" where its own data row records that it cannot be determined */
    specDecBaselineBasis: [
      { kind: "quote", source: "site/engine-data-v22.js", line: 1136, text: "UNKNOWN — measured:null and no reconstructable q/a" },
    ],
    throughputEvidenceClass: "analyst-set-assumed-op", clusterId: null, sourceRefs: ["research/evidence-instances-v22.json#gb300-analyst-set-dec", "research/evidence-instances-v22.json#gb300-sglang-v4 (RETRO observation; excluded from fit set)", "memo §2 declared assumed operating point (source batch not reconstructable; excluded from fit set)", "research/reviews/im-adv-r4-runB-internal-raw.md §B1/§B4/§B12-2/§C1"], // typed selector inputs (IM4 slice A; etaStatus prose above is display-only)
    bindingTerm: "t_H",
    deployedBasis: "0.258295 IS AN FP4-BASIS COEFFICIENT used in the FP8 render as a DECLARED CONSERVATIVE TRANSFER, exactly as on gb200 and derived identically (owner ruling q-im-fp4-gb200-eta-basis, 2026-08-02; relabel only — no number moves). b9 M1 (r4 defects D3 + D6, run B §B4/§B12-2/§C1): 0.258295 = 0.477845 / 1.85, de-embedding the retired NVFP4 precision scalar from a value built at the NVFP4 tuple (research/im3-slice1a-derivations.md:72-78). The magnitude class matches gb200's: on the V4 Pro geometry this row renders 7,460.3 tok/s at FP4 — matching the site's own validation row — against 4,411.6 at FP8, a 1.69× gap. UNLIKE gb200 there is no measured anchor to under-predict (calObs.measured is null), so 'conservative by 1.69×' is a magnitude statement, not a demonstrated error. The row is ALSO relabelled from 'fitted' to analyst-set: measured:null and an ASSUMED batch, so no fit was ever performed here (run B: 'indefensible as fitted'). Archived NVFP4 replay basis: engine deployed effDec 0.127 × 1.85 ⇒ 15,875.000 tok/s (5.0e15 × 1.85 × 0.127 / 74e9) at the declared operating point L=2,740 (the C5 gb300 value). SCENARIO-ONLY (§C3): both the batch and the η are assumed; upgrading requires a reconstructable non-MTP serving curve — a registered evidence task (research/update-queue.md).",
    calObs: { id: "gb300-sglang-v4 (floor anchor)", b: 128, L: 2740, precision: "fp4", measured: null,
      anchorAlreadyIncludesMTP: null, anchorAlreadyIncludesMTPBasis: "UNKNOWN — measured:null and no reconstructable q/a, so whether MTP is inside this anchor cannot be determined. NULL is first-class: defaulting to false would silently license an MTP credit on top of a possibly-MTP-bearing anchor (run B §B10).",
      obsQ: null, obsA: null, // not reconstructable — the D2 fit-set exclusion reason, disclosed
      source: "SGLang >12k tok/s/GPU on V4 Pro (FP4+MTP) — floor value; batch/MTP/arch not reconstructable, hence EXCLUDED from the frozen D2 fit set (d2 §3.1/§6) and calibrated here only via the engine's existing effDec row at a declared assumed operating point (b=128/rank per attention-DP rank, L=2,740)" },
    impliedEta: {}, // no frozen per-observation diagnostic exists for this row
    additionalObs: "MLPerf v6.0 RETRO rows (Interactive/Server/Offline) = evidence annotations, never calibration (memo §2)",
  },
  ascend: {
    etaDec: 0.299324, etaStatus: "analyst-set (source-informed neutral adjustment: deployed 1,422.7 tok/s differs from the 1,943 tok/s observation; not a fit)",
    // b9 M2 (memo §3.1/§4): REQUIRED typed trio, no implementer default on any of them.
    // etaRepresentation names the traffic representation this coefficient was DERIVED in —
    // an η may never be read in any other (run B §A4, promoted from prose to a type).
    // nPhysDeclared is a REGISTRY constant, NEVER the solved capacity width (§0-bis firewall).
    decodeTrafficBasis: "active-parameter-surrogate", etaRepresentation: "active-parameter-surrogate",
    nPhysDeclared: 128,
    // declared registry replica width (= HW_ROOFLINE.ascend.nShard); provenance on that row
    // b9 spec-decode LEVER (memo D-SD-3): REQUIRED typed baseline status. The credit
    // applies ONLY to "excluded"; "included" and "unknown" are exempt and say so on the leg.
    // IM3 §2 absorbed set — the same sentence as h20
    specDecBaselineStatus: "included",
    // d-im-h800: typed NVLink-cap lineage (closed set NVLINK_CAP_LINEAGES above) — different fabric family (UB), own observation
    nvlinkCapLineage: "not-applicable",
    /* THE BASIS RULE (memo §5, D-SD-3). Every entry is MECHANICALLY VERIFIABLE — a verbatim
       quotation with file:line, or a committed probe whose stdout must equal `expect` — and T-13
       EXECUTES both rather than inspecting prose. Nothing is admitted for being arithmetically
       suggestive; a row with no verifiable basis is typed `unknown`, which fails closed, so there
       is never a reason to invent one. This rule exists because two earlier drafts of the design
       memo reached for a crisp arithmetic hook and manufactured it. */
    /* included — the same IM3 §2 absorbed-set statement */
    specDecBaselineBasis: [
      { kind: "quote", source: "research/im3-integration-design.md", line: 135, text: "absorbed INTO the deployed" },
    ],
    throughputEvidenceClass: "source-informed-neutral", clusterId: null, sourceRefs: ["research/evidence-instances-v22.json#ascend-cminfer-decode (F5 input observation)", "research/evidence-instances-v22.json#ascend-cminfer-15ms (F6 input observation)", "research/evidence-instances-v22.json#ascend-neutral-live-dec (live analyst-set identity)", "frozen d2 §3.1 F5/F6"], // typed selector inputs (external-review correction: the deployed neutral does not reproduce either observation)
    bindingTerm: "t_H",
    deployedBasis: "legacy effDec 0.070 defines the neutral 1,422.7027 tok/s throughput target (1.504e15 × 0.070 / 74e9) at the F5 operating point; the executable roofline mapping is etaDec 0.299324. This is the hardware dive's neutral recommendation, NOT the 1,943 anchor-reproducer (memo §2). 8-bit basis is INT8 (W8A8)",
    calObs: { id: "F5 ascend-50ms", b: 96, L: 4096, precision: "fp8", precisionNote: "resolves to INT8 W8A8 on this row (C9)", measured: 1943,
      anchorAlreadyIncludesMTP: true,
      obsQ: 2, obsA: 1.7,
      source: "CloudMatrix-Infer Tables 3-4: b=96, L=4,096, INT8, one speculative token at an assumed 70% acceptance (q=2/a=1.7), 1,943 tok/s/NPU at 49.4ms TPOT" },
    impliedEta: { F5: 0.343, F6: 0.514 }, // F6 (b=8, 15 ms) = diagnostic informing the fast-regime batch value (§4)
    additionalObs: "FlexNPU cm384 bases (1,646/card co-loc; 2,885.4/decode-card 6P2D) = evidence-record annotations per memo §9 — NOT calibration inputs, NOT operating points",
  },
  tpu7: {
    etaDec: 0.519, etaStatus: "analyst-set (platform-native aggregate-form bridge on ONE DECLARED TIMING CONVENTION \u2014 OUTPUT TOKENS PER SECOND PER CHIP OVER TOTAL SERVING WALL TIME at a 1K-in/8K-out workload, to which BOTH observations are NORMALIZED \u2014 the rental anchor is published that way, Google's is a COMBINED input-plus-output rate that THIS PAGE converts by \u00d7 8/9: two same-platform diagnostics 0.528/0.510, midpoint 0.519, declared band 0.510\u20130.528 \u2014 b9 M1, numerator repaired 2026-09-20 by im-vet-six-repairs and put on a consistent basis the same day, after the completion gate refused a DISCLOSED inconsistency as a repair; VALID ONLY in this row's declared decodeTrafficBasis)",
    // b9 M2 (memo §3.1/§4): REQUIRED typed trio, no implementer default on any of them.
    // etaRepresentation names the traffic representation this coefficient was DERIVED in —
    // an η may never be read in any other (run B §A4, promoted from prose to a type).
    // nPhysDeclared is a REGISTRY constant, NEVER the solved capacity width (§0-bis firewall).
    decodeTrafficBasis: "replica-resident-distinct", etaRepresentation: "replica-resident-distinct",
    nPhysDeclared: 16,
    // M1-ratified N_phys_selected (run B §B1) — DELIBERATELY differs from HW_ROOFLINE.tpu7.nShard 4 (the registered 4-chip host). §2.1 measures that difference at 3.34x on this leg, so both are kept and documented rather than silently reconciled.
    // b9 spec-decode LEVER (memo D-SD-3): REQUIRED typed baseline status. The credit
    // applies ONLY to "excluded"; "included" and "unknown" are exempt and say so on the leg.
    // the underlying evidence row declares mtpAcceptance "unknown"; unknown FAILS CLOSED to exempt
    specDecBaselineStatus: "unknown",
    // d-im-h800: typed NVLink-cap lineage (closed set NVLINK_CAP_LINEAGES above) — different fabric family (ICI), own anchor class
    nvlinkCapLineage: "not-applicable",
    /* THE BASIS RULE (memo §5, D-SD-3). Every entry is MECHANICALLY VERIFIABLE — a verbatim
       quotation with file:line, or a committed probe whose stdout must equal `expect` — and T-13
       EXECUTES both rather than inspecting prose. Nothing is admitted for being arithmetically
       suggestive; a row with no verifiable basis is typed `unknown`, which fails closed, so there
       is never a reason to invent one. This rule exists because two earlier drafts of the design
       memo reached for a crisp arithmetic hook and manufactured it. */
    /* unknown — the registry EXPLICITLY REJECTS the joint fleet fit as evidence for this row, and its own anchor records acceptance as unknown */
    specDecBaselineBasis: [
      { kind: "quote", source: "site/engine-data-v22.js", line: 1213, text: "the joint fleet fit 0.36142 is REJECTED as evidence for this row" },
      { kind: "quote", source: "research/evidence-instances-v22.json", line: 1750, text: "\"mtpAcceptance\": \"unknown\"" },  // 1244 -> 1750 (2026-09-02): bytes unchanged, the JSON grew above them under rec 8. ONE-LINE on purpose — this file cites ITSELF by line, so a multi-line note here shifts two other citations.
    ],
    throughputEvidenceClass: "platform-native-aggregate-bridge", clusterId: null, sourceRefs: ["research/reviews/im-adv-r4-runB-internal-raw.md §A2/§A4/§B1/§C1", "Google Ironwood Qwen 3.5 serving playbook 2026-07-14 (677 tok/s/chip COMBINED input-plus-output under 1K-in/8K-out — Google's own reporting convention; concurrency 64, 4 chips, 400 GB replica footprint). Its OUTPUT-ONLY equivalent on the same wall clock is 677 \u00d7 8/9 = 601.8 t/s/chip, because 8 of every 9 tokens in a 1K-in/8K-out workload are output \u2014 this is the form used in the bridge, and it is on the SAME timing convention as the rental anchor beside it. Its DECODE-STAGE equivalent is a different number, 606 output t/s/chip, from this project's own two-workload solve in research/gptpro-reports/dive-replication-blinded-2026-07-15.md (\"Google proxy\": 8000/T_i + 1000/T_o = 9000/3707 and 1000/T_i + 8000/T_o = 9000/677 give T_i = 10,279, T_o = 606), published as site/research/dive-replication-blinded.html. 606 is NOT used in the bridge, because the rental anchor has no decode-stage equivalent published and pairing one with the other is what put two clocks in one mean", "TPU v7 Qwen3-Coder-480B rental anchor (518.86 OUTPUT tok/s/chip, stated concurrency 64 over 4 chips — research/evidence-instances-v22.json anchor 16, verbatim \"518.86 output tok/s/chip (1K/8K workload)\", https://github.com/AI-Hypercomputer/tpu-recipes/tree/main/inference/ironwood/vLLM/Qwen3-Coder-480B-A35B)"], // typed selector inputs (IM4 slice A; etaStatus prose above is display-only)
    // b9 M1 decision M1-D1 (memo §2): this row's decode reads the replica's DISTINCT weight
    // traffic shared across its N devices — the local-device form of run B §A1 — paired with
    // b = B_rep/N_phys (the per-chip output share the anchors state). The registry b cell
    // stays 16 and B_rep = b × N_phys = 256 at the selected N=16 is DERIVED, so capacity,
    // feasibility and the solved width are untouched. The η below is a matched pair with
    // this basis (§A4) and MUST NOT be transplanted onto the surrogate basis.
    // (M1 shipped this row's width as `declaredReplicaWidth`; renamed `nPhysDeclared` at M2 —
    //  same value 16, same meaning, one width field per row.) N_phys_selected (run B §B1) — a DECLARED registry constant, NOT the solved capacity width. B_rep = b × 16 = 256 at the balanced cell; decode throughput is therefore capacity-solver-independent (memo §0-bis firewall) and identical to the aggregate one-chip-equivalent form, in which N cancels outright.
    bindingTerm: null, // no calibration inversion performed — η assigned, not derived
    deployedBasis: "b9 M1 (r4 defect D2, run B §A4/§B1/§C1): the joint fleet fit 0.36142 is REJECTED as evidence for this row — it is a geometric mean over six NVIDIA/Ascend observations containing ZERO TPU data, against the project's own LOAO record of 37% average / 59% worst-case cross-platform transfer error. Replaced by the mean of two SAME-PLATFORM aggregate-form diagnostics. BASIS REPAIR, im-vet-six-repairs 2026-09-20 (vetting finding E2, dive E on the served page), REVISED THE SAME DAY after the completion gate refused a disclosed inconsistency as a repair. Both endpoints now sit on ONE STATED TIMING CONVENTION, to which both observations are NORMALIZED: OUTPUT TOKENS PER SECOND PER CHIP OVER TOTAL SERVING WALL TIME, at a 1K-in/8K-out workload. ONLY THE RENTAL ANCHOR IS PUBLISHED THAT WAY. Google publishes a COMBINED input-plus-output rate, and the x 8/9 conversion to output-only is performed HERE, by this page, not by Google \u2014 stated because an earlier draft said both sources publish in this convention, which a reader could disprove at the citation. (1) \u03b7 \u2248 518.86 \u00d7 480 GB / (64 \u00d7 7.37 TB/s) = 0.528 from the rental anchor, whose source states the figure in exactly that form (\u201c518.86 output tok/s/chip (1K/8K workload)\u201d, tpu-recipes, evidence anchor 16). (2) \u03b7 \u2248 601.8 \u00d7 400 GB / (64 \u00d7 7.37 TB/s) = 0.510 from Google's July 2026 Ironwood playbook, where 601.8 = 677 \u00d7 8/9: the playbook reports 677 t/s/chip COMBINED input-plus-output under 1K-in/8K-out \u2014 this project's own published blinded replication says so in terms, \u201cGoogle reports combined input-plus-output throughput\u201d \u2014 and 8 of every 9 tokens in that workload are output. Midpoint 0.519, declared band 0.510\u20130.528. WHAT THIS ROW USED TO SAY, AND WHY IT CHANGED TWICE. Before 2026-09-20 it read midpoint 0.55 over band 0.528\u20130.574, using 677 itself as a decode numerator \u2014 a combined rate read as an output rate, overstating that endpoint by 11.7%. The first repair replaced 677 with 606, the DECODE-STAGE rate this project's blinded replication solves out of the two-workload system (8000/T_i + 1000/T_o = 9000/3707 and 1000/T_i + 8000/T_o = 9000/677 give T_i = 10,279, T_o = 606), and explicitly rejected 677 \u00d7 8/9 because generated end-to-end throughput still carries the prompt-processing burden. That objection is true of 606's partner as well: 518.86 carries the same burden, so pairing it with 606 put two different clocks in one mean. The Astra xhigh review found that; the completion gate then ruled that DISCLOSING the inconsistency is neither repairing it nor withdrawing the contribution, which the commission required. So the basis is now chosen rather than mixed, and it is chosen the conservative way: 0.519 is LOWER than either the 0.521 mixed midpoint or the 0.525 that a fully decode-stage pair would give, and a lower \u03b7 raises modeled cost, so every MARGIN this leg feeds falls or stays put \u2014 measured, not asserted: across all 288 model/perspective combinations the 0.521 \u2192 0.519 move produced 100 lower margins, 188 unchanged and zero higher. Stated precisely because the looser form was wrong: this is a claim about MARGINS, and other published quantities RISE with it, exactly as a cost increase should \u2014 the calibration-debt width 13.69 \u2192 13.74 points, reference serving energy 186.0841 \u2192 186.1590 Wh per million tokens, the rent/TCO ratio 3.5555 \u2192 3.5563, and the direct-serving dollar costs themselves. WHAT THIS BASIS IS NOT: it is not a decode-stage efficiency. Both diagnostics carry prompt-processing time in their denominator, so each understates the decode-phase rate; the coefficient is an END-TO-END PROXY at a declared workload, applied inside a decode term while prefill is charged separately, and that phase attribution is an assumption this row makes rather than a measurement it has. CORRECTED 2026-09-20 after the Astra xhigh review of this very repair: an earlier draft of this note claimed the prefill-time share was \u201cthe same on both sides\u201d and that a decode-stage pair had to wait for the rental anchor to publish a second workload row. BOTH CLAIMS WERE FALSE and a reader following the citation would have found that out in one click. The rental recipe already publishes 1K/1K, 1K/8K and 8K/1K rows, and applying the same two-workload decomposition to them gives roughly 526.98 decode t/s/chip against Google's 606.21 \u2014 implied prefill-time shares near 1.54% and 0.73%, not equal. Equal TOKEN proportions do not make equal TIME proportions. So the decomposition is available and this row declines it on a different and stateable ground: it is assumption-dependent and it does not predict out of sample \u2014 fitted on two of the rental anchor's three rows it predicts about 468 t/s/chip for the third, against a published 499. One normalization both sources can be put on by a single stated conversion beats a decomposition that misses a row either source can check. These are weight-only, representation-specific diagnostics (they ignore KV and recurrent-state traffic), so the coefficient is bound to decodeTrafficBasis 'replica-resident-distinct' and is NOT a universal platform efficiency. The retired ≈0.199 value is NOT the alternative: run B §A4 shows it is the coefficient required to reproduce the old anchor INSIDE the malformed per-device identity, absorbing the batch/weight unit mismatch rather than measuring efficiency.",
    calObs: null, // no ELIGIBLE per-row calibration observation — the RETRO anchor exists but evidence annotations are barred from calibration (memo §2)
    impliedEta: {},
    additionalObs: "RETRO anchor (518.86 tok/s/chip, b=16 stated concurrency) = evidence annotation; its operating-point METADATA is admissible in the §4 registry (anchor-stated b), its throughput is not a calibration input. b9 M1: its aggregate-form weight-only diagnostic (0.528) IS admissible as one of the two bridge endpoints above — a representation-specific efficiency reading, still not a throughput calibration input.",
  },
  trn2: {
    etaDec: JOINT_ETA_DEC, etaStatus: "analyst-set (joint fleet fit — out-of-family tier-(c)); SPECULATION on the page's evidence ladder — UNRESOLVED BATCH-FORM AMBIGUITY (the operating-point registry declares batch replica-global while this engine consumes it per chip; the alternative reading is ~15.2x lower throughput). Scenario-only: this coefficient CANNOT support a central Trainium margin, and both Trainium legs are WITHDRAWN from the default fleet's membership on that ground (FLEETS.na-blend.withdrawn, im-vet-six-repairs 2026-09-20). The row, its rent and its scenarios are kept and selectable.",
    // b9 M2 (memo §3.1/§4): REQUIRED typed trio, no implementer default on any of them.
    // etaRepresentation names the traffic representation this coefficient was DERIVED in —
    // an η may never be read in any other (run B §A4, promoted from prose to a type).
    // nPhysDeclared is a REGISTRY constant, NEVER the solved capacity width (§0-bis firewall).
    decodeTrafficBasis: "active-parameter-surrogate", etaRepresentation: "active-parameter-surrogate",
    nPhysDeclared: 16,
    // declared registry replica width (= HW_ROOFLINE.trn2.nShard); provenance on that row
    // b9 spec-decode LEVER (memo D-SD-3): REQUIRED typed baseline status. The credit
    // applies ONLY to "excluded"; "included" and "unknown" are exempt and say so on the leg.
    // rides the frozen joint fleet fit and carries NO anchor observation of its own (calObs: null)
    specDecBaselineStatus: "excluded",
    // d-im-h800: typed NVLink-cap lineage (closed set NVLINK_CAP_LINEAGES above) — different fabric family (NeuronLink), analyst-set operating point
    nvlinkCapLineage: "not-applicable",
    /* THE BASIS RULE (memo §5, D-SD-3). Every entry is MECHANICALLY VERIFIABLE — a verbatim
       quotation with file:line, or a committed probe whose stdout must equal `expect` — and T-13
       EXECUTES both rather than inspecting prose. Nothing is admitted for being arithmetically
       suggestive; a row with no verifiable basis is typed `unknown`, which fails closed, so there
       is never a reason to invent one. This rule exists because two earlier drafts of the design
       memo reached for a crisp arithmetic hook and manufactured it. */
    /* excluded — rides the frozen joint fleet fit and carries NO anchor observation that could have embedded speculation; calObs null is the positive evidence of that absence */
    specDecBaselineBasis: [
      { kind: "probe", script: "tests/probes/specdec-eta.mjs", expect: "trn2:0.36142", stdout: "trim" },
      { kind: "quote", source: "research/im3-integration-design.md", line: 57, text: "Out-of-family ANALYST_SET rows — tpu7, trn2, trn3: joint fleet fit" },
      { kind: "probe", script: "tests/probes/specdec-jointfit.mjs", expect: "trn2:etaDec=0.36142;jointEtaDec=0.36142;matchesJointFit=true;calObs=null", stdout: "trim" },
    ],
    throughputEvidenceClass: "joint-fit", clusterId: null, sourceRefs: ["frozen d2 §3.2 joint fleet fit"], // typed selector inputs (IM4 slice A; etaStatus prose above is display-only)
    bindingTerm: null,
    deployedBasis: "joint fleet fit (frozen d2 §3.2); dense-TP row — t_cc applies per TCC_CONSTANTS (frozen §1.5), outside η. SCENARIO-ONLY (r4 §C3, b9 M1): no model-, topology- and SLO-matched Trainium serving throughput observation exists in the public record, so this coefficient CANNOT support a central Trainium margin — run B §A4: 'the joint η may remain only as a visibly marked sensitivity parameter'. Upgrading it requires a named model, topology, batch, precision, SLO and achieved output throughput.",
    calObs: null, // no ELIGIBLE per-row calibration observation — the RETRO anchors exist but evidence annotations are barred from calibration (memo §2)
    impliedEta: {},
    additionalObs: "RETRO anchors (36.556/24.421 tok/s wall-clock, b=1 stated) = evidence annotations; b=1 metadata admissible as the §4 fast-regime anchor-stated value",
  },
  trn3: {
    etaDec: JOINT_ETA_DEC, etaStatus: "analyst-set (joint fleet fit — out-of-family tier-(c); trn2-carry platform constants, labeled); SPECULATION on the page's evidence ladder — inherits trn2's unresolved batch-form ambiguity (~15.2x) on trn2-carry platform constants, and adds no matched serving anchor and no public numeric price of its own. Scenario-only; WITHDRAWN from the default fleet's membership with trn2 (FLEETS.na-blend.withdrawn, im-vet-six-repairs 2026-09-20). The row and its scenarios are kept and selectable.",
    // b9 M2 (memo §3.1/§4): REQUIRED typed trio, no implementer default on any of them.
    // etaRepresentation names the traffic representation this coefficient was DERIVED in —
    // an η may never be read in any other (run B §A4, promoted from prose to a type).
    // nPhysDeclared is a REGISTRY constant, NEVER the solved capacity width (§0-bis firewall).
    decodeTrafficBasis: "active-parameter-surrogate", etaRepresentation: "active-parameter-surrogate",
    nPhysDeclared: 16,
    // declared registry replica width (= HW_ROOFLINE.trn3.nShard); provenance on that row
    // b9 spec-decode LEVER (memo D-SD-3): REQUIRED typed baseline status. The credit
    // applies ONLY to "excluded"; "included" and "unknown" are exempt and say so on the leg.
    // rides the frozen joint fleet fit and carries NO anchor observation of its own (calObs: null)
    specDecBaselineStatus: "excluded",
    // d-im-h800: typed NVLink-cap lineage (closed set NVLINK_CAP_LINEAGES above) — different fabric family, projection
    nvlinkCapLineage: "not-applicable",
    /* THE BASIS RULE (memo §5, D-SD-3). Every entry is MECHANICALLY VERIFIABLE — a verbatim
       quotation with file:line, or a committed probe whose stdout must equal `expect` — and T-13
       EXECUTES both rather than inspecting prose. Nothing is admitted for being arithmetically
       suggestive; a row with no verifiable basis is typed `unknown`, which fails closed, so there
       is never a reason to invent one. This rule exists because two earlier drafts of the design
       memo reached for a crisp arithmetic hook and manufactured it. */
    /* excluded — the same joint fit, the same absence of an anchor observation */
    specDecBaselineBasis: [
      { kind: "probe", script: "tests/probes/specdec-eta.mjs", expect: "trn3:0.36142", stdout: "trim" },
      { kind: "quote", source: "research/im3-integration-design.md", line: 57, text: "joint fleet fit" },
      { kind: "probe", script: "tests/probes/specdec-jointfit.mjs", expect: "trn3:etaDec=0.36142;jointEtaDec=0.36142;matchesJointFit=true;calObs=null", stdout: "trim" },
    ],
    throughputEvidenceClass: "joint-fit", clusterId: null, sourceRefs: ["frozen d2 §3.2 joint fleet fit (trn2-carry platform constants)"], // typed selector inputs (IM4 slice A; etaStatus prose above is display-only)
    bindingTerm: null,
    deployedBasis: "joint fleet fit; no serving anchor of any kind exists for Trn3 (engine.js note: confirmed negative). SCENARIO-ONLY (r4 §C3, b9 M1): both the coefficient and the operating point are Trn2-derived carries — run B §B1: 'no central Trainium3 throughput should be represented as observed'. The row's rent is separately scenario-only (no public instance/UltraServer rate exists).",
    calObs: null,
    impliedEta: {},
  },
  rubin: {
    etaDec: JOINT_ETA_DEC, etaStatus: "analyst-set (joint fleet fit — PROJECTION; shape-only display unchanged, memo §2)",
    // b9 M2 (memo §3.1/§4): REQUIRED typed trio, no implementer default on any of them.
    // etaRepresentation names the traffic representation this coefficient was DERIVED in —
    // an η may never be read in any other (run B §A4, promoted from prose to a type).
    // nPhysDeclared is a REGISTRY constant, NEVER the solved capacity width (§0-bis firewall).
    decodeTrafficBasis: "active-parameter-surrogate", etaRepresentation: "active-parameter-surrogate",
    nPhysDeclared: 8,
    // declared registry replica width (= HW_ROOFLINE.rubin.nShard); provenance on that row
    // b9 spec-decode LEVER (memo D-SD-3): REQUIRED typed baseline status. The credit
    // applies ONLY to "excluded"; "included" and "unknown" are exempt and say so on the leg.
    // projection row, calObs null, not in the default fleet — typed explicitly so no row is left to implementer judgement
    specDecBaselineStatus: "unknown",
    // d-im-h800: typed NVLink-cap lineage (closed set NVLINK_CAP_LINEAGES above) — unpriced projection; no NVIDIA-Hopper lineage
    nvlinkCapLineage: "not-applicable",
    /* THE BASIS RULE (memo §5, D-SD-3). Every entry is MECHANICALLY VERIFIABLE — a verbatim
       quotation with file:line, or a committed probe whose stdout must equal `expect` — and T-13
       EXECUTES both rather than inspecting prose. Nothing is admitted for being arithmetically
       suggestive; a row with no verifiable basis is typed `unknown`, which fails closed, so there
       is never a reason to invent one. This rule exists because two earlier drafts of the design
       memo reached for a crisp arithmetic hook and manufactured it. */
    /* unknown — a projection row: there is no deployed observation to have embedded anything */
    specDecBaselineBasis: [
      { kind: "quote", source: "site/engine-data-v22.js", line: 1310, text: "throughputEvidenceClass: \"projection\"" },
    ],
    throughputEvidenceClass: "projection", clusterId: null, sourceRefs: ["projection row (memo §2) — joint η on projection-labeled constants"], // typed selector inputs (IM4 slice A; etaStatus prose above is display-only)
    bindingTerm: null,
    deployedBasis: "projection row: joint η on projection-labeled constants; no anchor, no calibration",
    calObs: null,
    impliedEta: {},
  },
};

/* Typed price-evidence classes (IM4 slice A — the diagnostic's price rule, promoted from
   tests/im4-fleet-policy-harness.mjs regexes to typed data; HW.note prose is display-only).
   observed-source-named = a named public rental provenance exists (neocloud range, IDC
   annual-commit, rental-class table, procurement award); analyst-set = everything else
   (bare rent scalar, engineering $/Mtok results, "estimates" language, or an explicit
   no-public-rate negative). */
/* im-vet-six-repairs (2026-09-20), finding E5-a — the label the ADOPTED row's own source
   refutes. `gb200` read `observed-source-named` while the rent quote this engine actually
   prices with (`gb200-owner-adopted-scenario-2026-09`, isDefault) carries `basis:
   "provisional"` and says in its own words: "NOT a rate that became public: no GB200 hour of
   the low/committed planning class is published". research/im-arc-t4-fold-memo.md:77 says the
   same from the other side — "an analyst-set middle over a dated Jul-2026 neocloud range
   note". A named neocloud RANGE exists; the $4.50 point this page adopts does not come from
   it as a quote, so by this file's own rule ("analyst-set = everything else ... bare rent
   scalar") the class is analyst-set. The underlying neocloud range stays in the row's
   `rentQuotes` with its own provenance — the downgrade is of the ADOPTED value's label, not
   of the disclosure beneath it. No number moves: PRICE_EVIDENCE feeds labels and the
   `evidenced` predicate, never arithmetic. */
const PRICE_EVIDENCE = {
  h100: "analyst-set", h200: "analyst-set", gb200: "analyst-set",
  gb300: "analyst-set", h800: "observed-source-named", h20: "observed-source-named",
  // b9 M1 (r4 defect D4): tpu7 and trn2 move analyst-set → observed-source-named. Their
  // rents are no longer bare scalars but NAMED public rates — Google's published 3-year
  // committed TPU v7 rate ($5.40/chip-hr) and AWS Capacity Blocks for Trainium2
  // ($2.235/chip-hr). Neither row gains `evidenced` status: that predicate also requires
  // throughputEvidenceClass === "fitted", which neither row has (tpu7 is a
  // platform-native bridge, trn2 a joint fit with unverified throughput).
  tpu7: "observed-source-named", trn2: "observed-source-named", trn3: "analyst-set",
  ascend: "observed-source-named", rubin: "unpriced",
};

// Prefill calibration (memo §8 — universal single-anchor transfer; per-row status)
const PREFILL_CAL = {
  etaPre: ETA_PRE,
  prov: "frozen F7 identity fit: η_pre = 0.17581 (H800 fresh-prefill reconstruction ~4,026 tok/s/GPU at L_in = 4,989, FP8; d2 §3.1-§3.2). EVERY row's prefill leg computes the frozen E2 roofline with this single value (memo §8 universal-transfer rule). Prefill never carries a measured basis (IM5-5 boundary; no two-sided prefill evidence exists — BLOCK-2 item 9).",
  status: {
    h800: "FITTED (identity, F7)",
    h100: "extrapolated (single-anchor transfer)", h200: "extrapolated (single-anchor transfer)",
    gb200: "extrapolated (single-anchor transfer)", gb300: "extrapolated (single-anchor transfer)",
    h20: "extrapolated (single-anchor transfer)", tpu7: "extrapolated (single-anchor transfer)",
    trn2: "extrapolated (single-anchor transfer)", trn3: "extrapolated (single-anchor transfer)",
    ascend: "extrapolated (single-anchor transfer)", rubin: "extrapolated (single-anchor transfer; projection row)",
  },

  /* ===== b9 M2 family 6 — per-platform prefill SURFACE HOOKS (memo §8, run B §B3) =====
     Run B §B3: the universal η_pre "is indefensible as a central platform value" — one H800
     reconstruction transferred to all seven platforms. It also matters more than the rationale
     implies: at the current flagship default, input serving is 70.1% of modeled direct cost, and
     a ±50% prefill error moves the headline ±14.32 pp. Its replacement list item 3 is the instruction implemented here: "until
     then, retain existing input costs only for continuity and show a mandatory 0.5–1.5×
     prefill-cost sensitivity."
     M2 ships the SURFACE, not a re-calibration. EVERY row is `universal-transfer`, so NO prefill
     number moves. A row leaves this state only by gaining a matched anchor. */
  prefillProvenance: Object.freeze({
    h800: "universal-transfer", h100: "universal-transfer", h200: "universal-transfer",
    gb200: "universal-transfer", gb300: "universal-transfer", h20: "universal-transfer",
    tpu7: "universal-transfer", trn2: "universal-transfer", trn3: "universal-transfer",
    ascend: "universal-transfer", rubin: "universal-transfer",
  }),
  // The per-leg disclosure every universal-transfer row must carry (plan D-11 wording).
  carryDisclosure: "prefill: universal-transfer carry; the planning baseline ±50% ⇒ ±15.1pp headline",
  // The mandatory sensitivity band (run B §B3 replacement item 3). Multipliers on prefill COST;
  // engine-computed at render time, never a stored margin.
  sensitivityBand: Object.freeze({ lo: 0.5, hi: 1.5,
    basis: "run B §B3 replacement item 3: a MANDATORY 0.5–1.5× prefill-cost sensitivity while the universal transfer stands. At the current flagship default, input serving is 70.1% of modeled direct cost; ±50% ⇒ ≈±14.32 pp headline.",
    headlinePpAtHalfBand: 15.06 }),
  /* Platform-native prefill evidence that EXISTS but is NOT adopted. Recorded so the next session
     does not have to re-find it, and so the debt is visible rather than merely absent. Adopting any
     of these is a CALIBRATION change against a non-matched workload — the memo §2.4 error — and is
     therefore out of M2 by construction. */
  candidateAnchors: Object.freeze([
    { hwKey: "tpu7", value: 3707, unit: "prefill tok/s/chip",
      workload: "8K input / 1K output, concurrency 64 (Google Ironwood Qwen 3.5 playbook)",
      source: "run B §B3",
      whyNotAdopted: "run B qualifies it in the same sentence: 'it does not establish Opus traffic performance.' The workload is not matched (397B-total/17B-active hybrid, 8K input vs the reference 15K), so adopting it would re-fit a coefficient against a non-matched anchor — the pathology memo §2.4 rules out." },
  ]),
};

// t_cc declared scenario constants (frozen §1.5 via memo §1a/§7 — data for the 1b core;
// the exploratory τ band is research context ONLY and is deliberately NOT represented here:
// frozen §1.5 forbids post-scoring selection; memo §1a keeps it unreachable from runtime/UI/codec)
const TCC_CONSTANTS = {
  tauCc: 18e-6, // s per collective = 30 ring-steps × 600 ns
  collectivesPerLayer: 2, // N_coll = 2 · layers (standard TP transformer, from arch — not fitted)
  mode: "dense-tp-only", // MoE-EP ⇒ t_cc ≡ 0 (frozen §1.2)
  prov: "frozen d2 §1.5 DECLARED SCENARIO CONSTANTS: τ_cc = N_ring_steps 30 (declared flat-ring 2·(N_chips−1) = 2·(16−1) = 30 for the 16-chip torus) × τ_hop 600 ns (published NeuronCore-v3 DGE-DMA primitive, a lower-bound proxy) = 18 µs/collective; t_cc = 2·layers·τ_cc, dense-TP mode ONLY, added OUTSIDE η (latency floor, not a utilization loss — memo §7: stackMult never scales it).",
};

/* =====================================================================================
   5. RENDER OPERATING-POINT REGISTRY (memo §4 — table transcribed; three service regimes
   replacing INTERACT_MULT). b values are per-device (tpu7 per chip; gb300 per attention-DP
   rank). opBasis ∈ {anchor-stated, analyst-declared, capped} — the two-layer taxonomy:
   a render point may CITE an observation's stated metadata WITHOUT inheriting its closure
   class (frozen 5-class hierarchy lives on observation records only; platform identity
   never selects a closure class — 1b/3 tests). q=1/a=1 everywhere (§2 rule); precision via
   PRECISION_TUPLES; mode from MODEL_ARCH (MoE → EP, dense → TP at N_shard); N = nShard.
   batch-regime rule cells: b_render = min(mult × balanced.b, b_feas) with b_feas per the
   §5 feasibility constraint (computed in 1b, never here). No argmax, no ceiling inversion
   anywhere in the render path (memo §4).
   ===================================================================================== */

const OPERATING_POINTS = {
  h800: { balanced: { batchQuantity: "B_out_per_chip", b: 96, q: 1, a: 1, opBasis: "anchor-stated", basis: "F1 h800-prod-dec stated b=96 (citation on CALIBRATION.h800; closure class NOT inherited)" },
    batch: { batchQuantity: "B_out_per_chip", rule: "min(mult*balanced, b_feas)", mult: 2, opBasis: "analyst-declared", basis: "§4 batch rule min(2×balanced, b_feas)" },
    fast: { batchQuantity: "B_out_per_chip", b: 8, q: 1, a: 1, opBasis: "analyst-declared", basis: "F6-informed low-batch scale (analyst-declared, memo §4)" } },
  h20: { balanced: { batchQuantity: "B_out_per_chip", b: 48, q: 1, a: 1, opBasis: "anchor-stated", basis: "F3 h20-base stated b=48" },
    batch: { batchQuantity: "B_out_per_chip", rule: "min(mult*balanced, b_feas)", mult: 2, opBasis: "analyst-declared", basis: "§4 batch rule" },
    fast: { batchQuantity: "B_out_per_chip", b: 8, q: 1, a: 1, opBasis: "analyst-declared", basis: "F6-informed low-batch scale" } },
  gb200: { balanced: { batchQuantity: "B_out_per_chip", b: 128, q: 1, a: 1, opBasis: "anchor-stated", basis: "F4 gb200-vllm stated b=128" },
    batch: { batchQuantity: "B_out_per_chip", rule: "min(mult*balanced, b_feas)", mult: 2, opBasis: "analyst-declared", basis: "§4 batch rule" },
    fast: { batchQuantity: "B_out_per_chip", b: 8, q: 1, a: 1, opBasis: "analyst-declared", basis: "F6-informed low-batch scale" } },
  gb300: { balanced: { batchQuantity: "B_out_per_chip", b: 64, q: 1, a: 1, opBasis: "analyst-declared",
    /* q-im-fp4-gb300-batch-disclosure (2026-08-02): the band this cell's own basis names, promoted
       from prose into a typed field so the family-9 debt surface and the generation chart can
       DISCLOSE the exposure instead of each inventing a counterfactual. Declaring it changes no
       number — `b` is still 64 — it only makes the assumption visible where its consequence renders.
       Measured at the shipped default: this one value is the whole of the GB300-costs-more-than-a-
       2022-H100 inversion (1.812× H100 at b=64, 1.000× at b=128). */
    bSensitivity: { lo: 36, hi: 128 },
    basis: "b9 M1 (r4 run B §B1/§C1): 64/rank — a DECLARED workload midpoint of the 36–128 sensitivity, replacing the assumed 128. The 128 was never an anchor: the source observation's batch is not reconstructable (memo §2), so it was an assumption carrying an anchor's weight. SCENARIO-ONLY (§C3). DISCLOSED, per q-im-fp4-gb300-batch-disclosure: at the shipped default this single value produces the cross-generation inversion on the per-generation cost chart — GB300 renders 1.812× H100 cost at b=64 and 1.000× at b=128 — so it is surfaced on the leg (family-9) and on that chart, and a real GB300 operating point is a registered evidence task." },
    batch: { batchQuantity: "B_out_per_chip", rule: "min(mult*balanced, b_feas)", mult: 2, opBasis: "analyst-declared", basis: "§4 batch rule" },
    fast: { batchQuantity: "B_out_per_chip", b: 8, q: 1, a: 1, opBasis: "analyst-declared", basis: "F6-informed low-batch scale" } },
  ascend: { balanced: { batchQuantity: "B_out_per_chip", b: 96, q: 1, a: 1, opBasis: "anchor-stated", basis: "F5 ascend-50ms stated b=96" },
    batch: { batchQuantity: "B_out_per_chip", rule: "min(mult*balanced, b_feas)", mult: 2, opBasis: "analyst-declared", basis: "§4 batch rule" },
    fast: { batchQuantity: "B_out_per_chip", b: 8, q: 1, a: 1, opBasis: "anchor-stated", basis: "F6 ascend-15ms stated b=8" } },
  h100: { balanced: { batchQuantity: "B_out_per_chip", b: 96, q: 1, a: 1, opBasis: "analyst-declared", basis: "family carry from h800 (memo §4 'h100/h200 96 (family carry)')" },
    batch: { batchQuantity: "B_out_per_chip", rule: "min(mult*balanced, b_feas)", mult: 2, opBasis: "analyst-declared", basis: "§4 batch rule" },
    fast: { batchQuantity: "B_out_per_chip", b: 8, q: 1, a: 1, opBasis: "analyst-declared", basis: "F6-informed low-batch scale" } },
  h200: { balanced: { batchQuantity: "B_out_per_chip", b: 96, q: 1, a: 1, opBasis: "analyst-declared", basis: "family carry from h800" },
    batch: { batchQuantity: "B_out_per_chip", rule: "min(mult*balanced, b_feas)", mult: 2, opBasis: "analyst-declared", basis: "§4 batch rule" },
    fast: { batchQuantity: "B_out_per_chip", b: 8, q: 1, a: 1, opBasis: "analyst-declared", basis: "F6-informed low-batch scale" } },
  tpu7: { balanced: { batchQuantity: "B_out_per_chip", b: 16, q: 1, a: 1, opBasis: "analyst-declared", basis: "ANALYST-DECLARED scaling scenario informed by tpu7 RETRO metadata: stated --max-concurrency 64 / 4 chips = 16/chip. The selected 16-chip width keeps 16 output tokens/chip and therefore derives replica-global B_rep = 16 × 16 = 256; the source stated only 64 globally. Preserving the source-global concurrency instead would give 4 tokens/chip at N=16 and is equally representable. The source is admissible operating-point metadata, but this width-scaled value is not anchor-stated and inherits no closure class." },
    batch: { batchQuantity: "B_out_per_chip", rule: "min(mult*balanced, b_feas)", mult: 2, opBasis: "analyst-declared", basis: "§4 batch rule" },
    fast: { batchQuantity: "B_out_per_chip", b: 4, q: 1, a: 1, opBasis: "analyst-declared", basis: "memo §4 tpu7 fast = 4" } },
  trn2: { balanced: { batchQuantity: "B_rep_consumed_as_B_out_per_chip", b: 32, q: 1, a: 1, opBasis: "analyst-declared", basis: "b9 M1 (r4 defect D1, run B §A3/§C1): AGGREGATE-BATCH SURROGATE, midpoint of the declared 16–64 band. AWS's Qwen3-235B recipe on ONE trn2.48xlarge (16 chips, tp_degree 64, attention-DP8, MoE EP32/TP2) states replica-global batch 16 online / 64 offline; the retired b=4 coincidentally equalled the OFFLINE per-chip output share (64/16) and was mislabelled a 'balanced dense-TP low-batch platform' — an AWS tutorial demo read as a production operating point. Throughput remains UNVERIFIED and the row stays SCENARIO-ONLY (§C3): no matched serving anchor exists." },
    batch: { batchQuantity: "B_rep_consumed_as_B_out_per_chip", rule: "min(mult*balanced, b_feas)", mult: 4, opBasis: "analyst-declared", basis: "§4 trn2/trn3 batch rule min(4×balanced, b_feas)" },
    fast: { batchQuantity: "B_out_per_chip", b: 1, q: 1, a: 1, opBasis: "anchor-stated", basis: "Trn2 Neuron tutorial baselines stated b=1/conc=1 (metadata citation; closure class not inherited)" } },
  trn3: { balanced: { batchQuantity: "B_rep_consumed_as_B_out_per_chip", b: 32, q: 1, a: 1, opBasis: "analyst-declared", basis: "b9 M1 (run B §C1): the same 16–64 aggregate-batch surrogate as trn2, midpoint 32, explicitly Trn2-DERIVED — no Trn3 serving anchor of any kind exists. SCENARIO-ONLY (§C3)." },
    batch: { batchQuantity: "B_rep_consumed_as_B_out_per_chip", rule: "min(mult*balanced, b_feas)", mult: 4, opBasis: "analyst-declared", basis: "§4 trn2/trn3 batch rule" },
    fast: { batchQuantity: "B_out_per_chip", b: 1, q: 1, a: 1, opBasis: "analyst-declared", basis: "trn2 carry of the b=1 low-batch point (no Trn3 anchor exists)" } },
  rubin: { balanced: { batchQuantity: "B_out_per_chip", b: 128, q: 1, a: 1, opBasis: "analyst-declared", basis: "shape-only projection (memo §4: RUBIN has no batch/fast regimes — fields absent by design)" } },
};

/* ============================================================================
   5a-bis. FLEETS — named, source-attributed hardware fleets (IM4 slice B; design memo
   research/im4-fleet-design-memo.md v3.1 + §7 owner ruling 2026-07-21).
   Membership = pre-feasibility banked rules ONLY (gate 6: survivor subsets are derived
   presentations, never registry entries). class:"counterfactual" is MANDATORY for any
   fleet containing Chinese-silicon legs (h800/h20/ascend) — owner ruling: barred from
   defaults and all default scenarios; selectable as explicitly labeled counterfactuals.
   DEFAULT_FLEET_ID is the OWNER-ADJUDICATED landing selection (owner-answers.jsonl
   im-fable-b-2026-07-21-fleet-landing-default-v2) — a banked constant, not a derivation;
   the margin-blind evaluator in engine.js owns only gate-7 central-label eligibility.
   ============================================================================ */
const FLEETS = {
  "na-blend": {
    name: "North American blend (evidence-informed families)",
    class: "estimated-realistic",
    models: ["opus"],
    legs: { h100: 8, h200: 11, gb200: 19, gb300: 12, tpu7: 25, trn2: 8, trn3: 17 },
    familyShares: { nvidia: 50, tpu: 25, trainium: 25 },
    attribution: "TWO-LEVEL ESTIMATE (owner-ruled structure, 2026-07-21). FAMILY level, "
      + "evidence-informed: the NVIDIA 50 is a FAMILY-SHARE PRIOR, not a measured "
      + "inference-fleet share — its source is a SECONDHAND Morgan Stanley summary of an "
      + "NVIDIA NDR comment (July 2026) about an UNNAMED ASIC-heavy frontier lab whose "
      + "NVIDIA exposure 'has risen to close to 50%'; a relayer (@jukan05) identifies "
      + "that lab as Anthropic, an attribution inference this page adopts; 'compute' is "
      + "unscoped in the source (training vs inference vs blended demand not stated). "
      + "Full chain + limits: research/primary-sources/nvidia-anthropic-share-x-2026-07/. "
      + "The non-NVIDIA half splits equally between TPU (Anthropic up-to-~1M-TPU "
      + "commitment, Oct 2025) and Trainium (Project Rainier ~500k Trn2; >1M Trn2 in use "
      + "by Apr 2026) — equal residual split is THIS PAGE'S declared choice (both "
      + "commitments are ~1M-chip scale; no finer public basis exists). WITHIN-FAMILY "
      + "level, analyst-declared: shares carried proportionally from the v2.1 declared "
      + "topology (no public within-family generation split exists). No Chinese-silicon "
      + "leg by construction (owner ruling).",
    /* DECLARED EVIDENCE WITHDRAWAL (im-vet-six-repairs, 2026-09-20; vetting finding E1 —
       dive E on the served page, `pr-20260919T143649Z-9b63e7`, and the report
       orchestration/backlog-recovery/day-2026-07-28/reports/inference-margins-vetting-2026-09-19.md).
       A withdrawn leg stays DECLARED here at its evidence-informed weight — the family
       structure above is sourced and is NOT edited — and is excluded from the DEFAULT
       fleet's membership, so no preferred blended reading carries it. Its declared weight
       renormalizes over the remaining members through the SAME path a capacity exclusion
       uses, and the exclusion clause states the change rather than renormalizing silently,
       which is the specific failure the reviewer warned against ("If a Trainium-excluded
       comparison ships, declare its changed fleet and weights").
       WHY THESE TWO: the Trainium operating-point registry declares batch replica-global
       while this engine consumes it per chip, and the alternative reading is ~15.2x
       lower-throughput — and this project's own hardware ledger already states that the
       coefficient "CANNOT support a central Trainium margin". A row whose unit is open by
       a factor of fifteen cannot sit inside a preferred reading on the strength of a
       caveat. Nothing is deleted: both rows keep their rent, their dossiers, their
       scenarios and their selectability, and `declared-topology` below still carries them
       — reversing this is one sourced coefficient away. */
    withdrawn: {
      trn2: "WITHDRAWN from the default reading, not deleted: its operating point declares batch replica-global while this engine consumes it per chip, an unresolved unit ambiguity worth about 15.2x in throughput, and this page's own hardware ledger already rules that coefficient out of any headline Trainium margin",
      trn3: "WITHDRAWN from the default reading, not deleted: it inherits Trainium2's unresolved batch-form ambiguity and adds no matched serving anchor and no public numeric price of its own",
    },
    withdrawnBasis: "vetting round 2026-09-19, expert reading E1; enacted by im-vet-six-repairs 2026-09-20 under program bq-2835. Reversed by a sourced coefficient that pins the batch/replica/accelerator identity, not by a caveat.",
    representativeness: "estimated-realistic-topology",
  },
  "declared-topology": {
    name: "Declared Opus topology (analyst)",
    class: "analyst-declared",
    models: ["opus"],
    legs: { h100: 10, h200: 15, gb200: 25, gb300: 15, tpu7: 20, trn2: 5, trn3: 10 },
    attribution: "The v2.1 analyst-declared blend carried into v2.2 (DEFAULTS.blend); no "
      + "public Anthropic fleet disclosure exists. Kept as a named fleet for continuity "
      + "and comparison with the evidence-informed NA blend.",
    representativeness: "declared-topology",
  },
  "anchored-eligible-equal": {
    name: "Anchored-eligible set (equal weights) — counterfactual",
    class: "counterfactual",
    models: ["opus"],
    legs: { gb200: 50, h800: 50 },
    attribution: "Membership = the typed throughput∩price eligibility intersection "
      + "(gate-8 rule over CALIBRATION/PRICE_EVIDENCE); equal weights declared by THIS "
      + "PAGE. COUNTERFACTUAL (owner ruling 2026-07-21): contains Chinese-silicon legs no "
      + "realistic Anthropic fleet includes — answers 'what would the evidence-maximal "
      + "cross-vendor construction show', never a default. Derived feasible subsets "
      + "inherit this attribution and this class.",
    representativeness: "evidence-construction",
  },
  "h800-sole-anchor": {
    name: "H800 sole anchor — counterfactual",
    class: "counterfactual",
    models: ["opus"],
    legs: { h800: 100 },
    attribution: "Single best-anchored row (DeepSeek production disclosure fit + IDC "
      + "annual-commit rent). COUNTERFACTUAL: 'could Claude be served on the "
      + "best-evidenced Chinese-market hardware' — comparison only, never a default.",
    representativeness: "evidence-construction",
  },
  "ascend-sole-anchor": {
    name: "Ascend 910C source-informed neutral — counterfactual",
    class: "counterfactual",
    models: ["opus"],
    legs: { ascend: 100 },
    attribution: "Single source-informed-neutral domestic-China row (the deployed coefficient "
      + "does not reproduce the CloudMatrix observation; Huatai procurement rent). COUNTERFACTUAL: the explicit Chinese-accelerator scenario the "
      + "owner endorsed as a capability — comparison only, never a default.",
    representativeness: "evidence-construction",
  },
};
const FLEET_CLASSES = ["estimated-realistic", "analyst-declared", "anchored-only", "counterfactual",
  "user-custom"]; // b9 M4 (memo §3.4): builder fleets — never a default, never central-eligible
const CHINESE_SILICON = ["h800", "h20", "ascend"];
// Owner-adjudicated landing selection (banked ruling; see header note). NOT derived.
const DEFAULT_FLEET_ID = "na-blend";

/* =====================================================================================
   5a-bis. WEIGHT-PLACEMENT REGISTRY (R2 §1.5; B′2 spec, im4-sliceBprime-design-memo §5)
   Per PUBLISHED model: component loaded bytes + precisions + the recipe's sharding
   discipline, feeding M_weights,g(w) = replicatedBytes + moeLayers × nRouted(w) ×
   expertParams × expertBytesPerParam with nRouted(w) = ceil((E + redundant)/w) — the
   ceil IS the max-over-ranks capacity test, and it reproduces BOTH published DeepSeek
   deployment rows exactly (decode EP144: ceil((256+32)/144) = 2 routed experts/GPU;
   prefill EP32: ceil(288/32) = 9 — day-6 capture, primary-sources/deepseek-day6-
   inference-2026-07-18). Discipline shared by all three rows (source-cited per row):
   routed experts EP-sharded; attention + dense + shared expert + embeddings replicated
   per rank. This registry is what makes the solver's placementVerified boolean
   NON-VACUOUS: a solve that engages a row (engine.js engagement contract — model in
   registry, untouched total, matching precision tier, no policy-sensitivity override)
   carries placement-derived residency and placementVerified: true. Closed models keep
   the uniform+policy form (memo §0-ter); donor transfer NEVER carries placement
   (labeled analyst sensitivity only). Config captures with sha256 pins:
   research/primary-sources/hf-configs-placement-2026-07-22/capture.md.
   Rulings record: research/im4-r2-assembly-notes.md R-8.
   ===================================================================================== */
const WEIGHT_PLACEMENT = Object.freeze({
  dsr1: Object.freeze({
    modelId: "dsr1", engineTotalB: 671, precisionTier: "fp8-class",
    expertParams: 44040192,        // 3 × 7168 × 2048 (gate/up/down; config moe_intermediate_size 2048)
    routedExpertsPerLayer: 256, moeLayers: 58, redundantExperts: 32,
    routedTotalParams: 653908770816, // 58 × 256 × 44,040,192
    replicatedParams: 17091229184,   // disclosed 671e9 − routed; cross-checked bottom-up ≈17.0B (attn 11.4B + dense-FFN 1.19B + shared 2.55B + emb 1.85B; d2-receipt-pack §1a fields)
    expertBytesPerParam: 1.0, replicatedBytesPerParam: 1.0, // native FP8 e4m3 block-quantized checkpoint (config torch_dtype/quant; block scales + norms ≈ bf16 — approximation labeled)
    placementSource: "DeepSeek Day-6 V3/R1 inference-system disclosure: decode EP144/DP144 + prefill EP32/DP32, each with 32 redundant routed experts; 'MLA/Shared Expert DP' = attention + shared expert replicated per rank (research/primary-sources/deepseek-day6-inference-2026-07-18/)",
    componentSource: "deepseek-ai/DeepSeek-R1 config.json (d2-receipt-pack §1a; im3-arch-constants row 1)",
    redundancyNote: "nRouted(w) = ceil((256+32)/w) reproduces both published rows exactly (2 @ EP144, 9 @ EP32); applying the published 32-expert redundancy at other widths is a labeled analyst extension of the published discipline",
  }),
  kimi: Object.freeze({
    modelId: "kimi", engineTotalB: 1000, precisionTier: "fp8-class",
    expertParams: 44040192,        // 3 × 7168 × 2048 (config Kimi-K2-Thinking; geometry shared across K2 variants per MODEL_ARCH.kimi)
    routedExpertsPerLayer: 384, moeLayers: 60, redundantExperts: 0,
    routedTotalParams: 1014686023680, // 60 × 384 × 44,040,192
    replicatedParams: 11556028416,    // BOTTOM-UP from config: attn 6.168B (61 × [q_lora 11.01M + q_up 18.87M + kv_down 4.13M + kv_up 8.39M + o_proj 58.72M]) + dense-FFN 0.396B (1 × 3 × 7168 × 18432) + shared 2.642B (60 × 44.04M) + emb 2.349B (163840 × 7168 × 2, untied assumption — labeled). Top-down is impossible: routed alone exceeds the marketing-rounded '1T' (config sum ≈ 1.026T) — discrepancy disclosed here
    expertBytesPerParam: 1.0, replicatedBytesPerParam: 1.0, // the K2-ORIGINAL FP8 block-e4m3 serving class (deploy_guidance / LMSYS-EP sources); the Thinking variant's native INT4 artifact is noted but unselectable — no scenario precision maps to int4-class (B′ §6 mapping, fail-closed)
    placementSource: "LMSYS/SGLang Kimi-K2 large-scale-EP 128×H200 deployment class (provider-dives/moonshot-gptpro.md): routed experts EP-sharded, attention DP — the R1-class discipline; creator smallest-unit receipt = width-case kimi-k2-fp8-minimum-16 (deploy_guidance)",
    componentSource: "moonshotai/Kimi-K2-Thinking config.json (sha256-pinned capture, hf-configs-placement-2026-07-22)",
    redundancyNote: "expert redundancy unpublished for K2 — 0 used; EPLB-class replication exists in the serving stack but has no published count (never silently assumed)",
  }),
  dsv4: Object.freeze({
    modelId: "dsv4", engineTotalB: 1600, precisionTier: "fp4-class",
    expertParams: 66060288,        // 3 × 7168 × 3072 (config moe_intermediate_size 3072)
    routedExpertsPerLayer: 384, moeLayers: 61, redundantExperts: 0,
    routedTotalParams: 1547396186112, // 61 × 384 × 66,060,288 — PLACEMENT CONVENTION ALL-61-MoE (R-8): num_hash_layers 3 is NOT equated to dense-replace (semantics unconfirmed); the 61-MoE reading reproduces the disclosed 1.6T within rounding, and the resulting replicated residual errs CONSERVATIVE (never inflates feasibility). Deliberately differs from MODEL_ARCH.dsv4's moeLayers=58 THROUGHPUT convention, which is a fabric-payload convention and is untouched
    replicatedParams: 52603813888,    // disclosed 1600e9 − routed (top-down; out-of-model attention prevents a bottom-up cross-check — analyst-approx upper bound absorbing the disclosure rounding, labeled)
    expertBytesPerParam: 0.5, replicatedBytesPerParam: 1.0, // native mixed: expert_dtype fp4 (NVFP4-class scale overhead ignored — labeled) + fp8 e4m3 for attention/dense (config quantization_config)
    placementSource: "DeepSeek V4-Pro vLLM recommended DP8+EP recipe — 'dense params replicated in hybrid DP+EP' (width-case v4-pro-vllm-dp8-8); V4 report validates the fine-grained expert-parallel serving design (provider-dives/deepseek-gptpro.md)",
    componentSource: "deepseek-ai/DeepSeek-V4-Pro config.json (sha256-pinned capture, hf-configs-placement-2026-07-22)",
    redundancyNote: "expert redundancy unstated in the vLLM recipe — 0 used (never silently assumed)",
  }),
});

/* =====================================================================================
   5b. TRAFFIC-MIX PROFILES (v2.1.2; MOVED here from engine.js, slice-4 cleanup, memo §13 backlog)
   The TRAFFIC MIX axis owns ioRatio + cacheHit and nothing else. Names are provenance-honest (no
   generic Agentic/Chat/Coding archetypes — the numbers below are specific observations or stated
   conventions, not population claims). SLA/interactivity, service class and cache lifecycle
   remain modeled elsewhere; the full workload ontology is future work (see BACKLOG). cacheHit
   controls serving-side prefix reuse. billCacheHit is a separate nullable pricing control:
   its null default assumes equality with cacheHit, while an explicit value decouples the two
   because providers' disk-cache and billing-cache statistics are different measurements.
   Moved here (rather than staying in engine.js) so
   engine-roofline-v22.js can read it the SAME way it reads every other registry (RD_DATA.*, this
   file, loaded first) instead of reaching BACK into engine.js at its own parse time — that reverse
   dependency was the reason the script tags could not previously load as data -> roofline ->
   engine -> app (see index.html's script-tag comment).
   ===================================================================================== */

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

/* =====================================================================================
   6. TRAFFIC OSL REGISTRY (memo §3 traffic→context rule)
   Absolute OSL per traffic profile (TRAFFIC_PROFILES ids, above). Resolution (1b):
   ISL = ioRatio × OSL; representative decode L = ISL + OSL/2 (C5 form);
   peak live KV LPeak = ISL + OSL; prefill L_in = ISL. Fixed-OSL
   rule: custom/edited/legacy/replay states use the profile-family OSL — editing ioRatio
   moves ISL only. OSL is derived data, NOT encoded in the codec. Fallback (memo §3 AS
   AMENDED per slice-1a review R4, commit 7d65239): OSL = 1,000 tokens (analyst-declared)
   ONLY for profiles with no sourced absolute length on EITHER side; where a profile has a
   sourced absolute length on one side, the generic fallback is FORBIDDEN (knowingly-wrong
   placeholder) and the missing side derives through the profile's ratio, labeled
   `analyst-derived from measured ISL + authored ratio`.
   ===================================================================================== */

const TRAFFIC_OSL = {
  reference: { osl: 1000, oslBasis: "analyst-declared (fallback)",
    prov: "calculator convention profile — no source basis exists by construction; fallback 1,000 (memo §3)" },
  "openai-dive": { osl: 1000, oslBasis: "analyst-declared (fallback)",
    prov: "the dive's 7 cached : 2 fresh : 1 output mix is a RATIO convention with no absolute token lengths; fallback 1,000" },
  "deepseek-disclosure": { osl: 1109, oslBasis: "analyst-derived (from anchor-stated context)",
    prov: "DeepSeek Feb 2025 disclosure DISCLOSED mean KV/context length 4,989 tokens (provider-dives/deepseek-gptpro.md; the same stated value behind F1's L). OSL back-solved through the C5 form at the profile's own ioRatio 4 (L = 4·OSL + OSL/2): OSL = 4,989 / 4.5 = 1,108.67 → 1,109 (integer). Renders L = 4,990.5 vs the stated 4,989 (+0.03% integer-rounding residual — noted, derivations file)" },
  ncode: { osl: 10125, oslBasis: "analyst-derived from measured ISL + authored ratio",
    prov: "memo §3 AS AMENDED (slice-1a review R4, commit 7d65239): the ncode week's observed ~81,000-token mean INPUT length (@_xjdr, sourced — the same observation behind the profile's 41% cache figure) at the profile's site-authored 8:1 ratio ⇒ OSL = 81,000/8 = 10,125; renders ISL 81,000, decode L = 86,062.5. MIXED BASIS disclosed: measured ISL over an authored ratio, from one power-user week. The generic 1,000 fallback is FORBIDDEN here per the amendment — with a sourced absolute length on one side it would understate the profile's context ~10.1×, functioning as a knowingly-wrong placeholder (reviewer ruling)" },
  "kimi-dive": { osl: 1000, oslBasis: "analyst-declared (fallback)",
    prov: "Mooncake-like ratio convention the dive declined to firm up; no absolute lengths; fallback 1,000" },
  uncached: { osl: 1000, oslBasis: "analyst-declared (fallback)",
    prov: "xAI dive operating convention (3:1, no billed cache) states no absolute lengths; fallback 1,000" },
};

/* =====================================================================================
   5a-ter. DECODE PLACEMENT RESOLVER (b9 M2 family 4; memo §6.2/§6.3)
   Builds the {W_shared, W_e, p_e, E, k} record run B §C4's W_distinct(B) term consumes.
   NOTHING in the default fleet reaches this today — no CALIBRATION row declares
   `expert-coverage` — so this is a surface, not a live path. It exists so that a row becomes
   correct by GAINING EVIDENCE rather than by an engine edit.

   PROVENANCE IS TYPED AND FAIL-CLOSED. Two classes only:
   - "published-placement": the model has a sha256-pinned WEIGHT_PLACEMENT record (dsr1, kimi,
     dsv4). Component bytes and expert geometry come straight from it.
   - "declared-surrogate": the model has NO placement record. WEIGHT_PLACEMENT's own rule is
     "donor transfer NEVER carries placement (labeled analyst sensitivity only)", so a donor's
     record may not be inherited as if it were the model's own. What IS carried is the donor's
     replicated/routed SPLIT as a ratio, applied to this model's magnitudes, and the result is
     labeled a surrogate at every surface. This is the opus case (memo §6.3) and it is why the
     coverage term may not go load-bearing on a default leg (memo §2.3).
   p_e is the per-token inclusion probability and is UNIFORM (k/E) — note the direction:
   uniform is the coverage-MAXIMISING setting by
   concavity + Jensen, so it is an upper bound on MODELLED traffic and NO bound on actual traffic
   (design gate R5; Ironwood was observed ABOVE the uniform maximum). Never call it favourable.
   ===================================================================================== */
const PLACEMENT_PROVENANCES = Object.freeze(["published-placement", "declared-surrogate"]);

function resolveDecodePlacement(modelId, totalB, sW, archTopK, archMoeLayers, opts) {
  opts = opts || {};
  if (typeof modelId !== "string" || !modelId) throw new Error("resolveDecodePlacement: modelId required");
  if (!(totalB > 0) || !(sW > 0)) throw new Error("resolveDecodePlacement: finite positive totalB and sW required");
  const registered = Object.prototype.hasOwnProperty.call(WEIGHT_PLACEMENT, modelId)
    ? WEIGHT_PLACEMENT[modelId] : null;
  const pub = !opts.forceSurrogate ? registered : null;
  if (pub) {
    return Object.freeze({
      placementProvenance: "published-placement", modelId,
      wSharedBytes: pub.replicatedParams * pub.replicatedBytesPerParam,
      wExpertBytes: pub.expertParams * pub.expertBytesPerParam,
      expertsPerLayer: pub.routedExpertsPerLayer, moeLayers: pub.moeLayers,
      topK: archTopK, pUniformPerToken: archTopK / pub.routedExpertsPerLayer,
      basis: pub.placementSource, componentSource: pub.componentSource,
      surrogateNote: null,
    });
  }
  // No record for this model. Carry the dsr1 discipline's SPLIT as a ratio onto this model's own
  // magnitudes — never the donor's byte counts, and never presented as this model's placement.
  const donor = WEIGHT_PLACEMENT.dsr1;
  const donorTotal = donor.replicatedParams + donor.routedTotalParams;
  const replicatedFraction = donor.replicatedParams / donorTotal;
  const totalBytes = totalB * 1e9 * sW;
  const experts = donor.routedExpertsPerLayer;
  const moeLayers = archMoeLayers != null ? archMoeLayers : donor.moeLayers;
  return Object.freeze({
    placementProvenance: "declared-surrogate", modelId,
    wSharedBytes: totalBytes * replicatedFraction,
    wExpertBytes: (totalBytes * (1 - replicatedFraction)) / (moeLayers * experts),
    expertsPerLayer: experts, moeLayers, topK: archTopK, pUniformPerToken: archTopK / experts,
    basis: "DECLARED SURROGATE (b9 M2 memo §6.3): " +
      (registered
        ? "a WEIGHT_PLACEMENT record exists for '" + modelId +
          "' but is DISENGAGED for this edited or policy-sensitivity state; its checkpoint-specific bytes are not reused. "
        : "no WEIGHT_PLACEMENT record exists for '" + modelId + "'. ") +
      "The dsr1 published replicated/routed SPLIT (" + (replicatedFraction * 100).toFixed(3) +
      "% replicated) is carried as a RATIO onto this model's own magnitudes. WEIGHT_PLACEMENT's own rule bars inheriting a donor's placement as if it were the model's; a ratio carry is a labeled analyst sensitivity, not a measurement.",
    componentSource: null,
    surrogateNote: registered
      ? "published checkpoint placement is inapplicable to this edited or policy-sensitivity state — this replacement geometry is assumed, not measured, and must be labeled as such wherever it surfaces"
      : "expert placement for this model is UNPUBLISHED — this geometry is assumed, not measured, and must be labeled as such wherever it surfaces",
  });
}

/* ---------- export plumbing (mirrors engine.js) ---------- */
if (typeof module !== "undefined" && module.exports) {
  Object.assign(module.exports, {
    ARCH_DONORS, GROK2_GEOM, CUSTOM_DONOR_ENUM, MODEL_ARCH,
    TOPOLOGY_DIMENSIONS, TOPOLOGY_EVIDENCE_CLASSES,
    HW_ROOFLINE, PRECISION_TUPLES,
    CALIBRATION, JOINT_ETA_DEC, ETA_PRE, PREFILL_CAL, PRICE_EVIDENCE, TCC_CONSTANTS,
    DECODE_TRAFFIC_BASES, BATCH_QUANTITIES, NVLINK_CAP_LINEAGES,
    OPERATING_POINTS, TRAFFIC_OSL, TRAFFIC_PROFILES,
    FLEETS, FLEET_CLASSES, CHINESE_SILICON, DEFAULT_FLEET_ID, WEIGHT_PLACEMENT,
    PLACEMENT_PROVENANCES, resolveDecodePlacement,
    TPU7_TOPOLOGY_SENSITIVITY, TRAINIUM_TOPOLOGY_SENSITIVITY, TOTAL_CASES, PRECISION_TIER_MAP, TOTAL_CASE_SCOPE,
    NVL72_TOPOLOGY_SENSITIVITY, WORKER_CANDIDATE_SOURCES,
    HW_DOMAINS,
  });
}
