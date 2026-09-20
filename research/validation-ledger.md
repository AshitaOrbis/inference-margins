# Validation Ledger — anchors as predictions first, fits second

**Governing protocol:** `research/d2-validation-protocol.md` (three-status scheme §3; reporting
invariants §8). **Status: IM2.5 pre-freeze (2026-07-16)** — FITTED census COMPLETE (the closed
calibration enumeration F1–F7 lives in `research/d2-equation-set.md` §3 and is hash-pinned at that
file's freeze; this registry is provenance/status bookkeeping, not the freeze boundary); RETRO
primary-source verification complete (receipt pack, 2026-07-16); no scores exist yet (scoring
begins under three-hash enforcement: frozen protocol + frozen equation set + frozen E3 evaluator
`research/e3-evaluator-v2111/engine-v2111-frozen.js`).

Statuses: **FITTED** (calibrates parameters; reproduction is an identity, not evidence) ·
**RETRO** (retrospective pseudo-holdout — post-fit arrival, known to designers; supports
retrospective-only claims) · **PROSPECTIVE** (post-freeze arrival, scored before any refit decision;
the only status that can validate).

## Anchor registry

| id | status | platform | anchor (model, source, date) | primary-source verification | notes |
|---|---|---|---|---|---|
| h800-deepseek-prod-dec | FITTED | H800 (+H100 inherits) | DeepSeek V3/R1 production disclosure (Feb 2025): 14.8k out tok/s per 8×H800 node ⇒ 1,850/GPU, 37B active, FP8 ⇒ effDec ≈7% — THE primary anchor (`engine.js:5,28`; `index.html:312`) | inherited (grounding ledger) | h100 row shares this fit ("H100-class compute"); h200 is analyst-extrapolated from it (no anchor of its own) |
| h800-deepseek-prod-pre | FITTED | H800 | Same disclosure, prefill fresh-only reconstruction ~4,026 tok/s/GPU ⇒ effPre 15% (raw 9,212 aggregate incl. 56.3% disk-cache share) (`index.html:313`) | inherited (grounding ledger) | the ONLY prefill fit in the engine — every other row's effPre is analyst-set (B2's root) |
| gb200-vllm-r1 | FITTED | GB200 NVL72 | vLLM R1 decode ~10,100 tok/s/GPU ⇒ effDec 15% (precision basis possibly NVFP4 — decomposition receipt needed) (`index.html:314`) | inherited (grounding ledger) | rent $4.50 neocloud estimate; AWS $761.904/rack-hr Capacity-Block bridge documented but not fitted |
| gb300-sglang-v4 | RETRO | GB300 NVL72 | SGLang V4 Pro (1.6T FP4+MTP, 49B active disclosed) >12,000 tok/s/GPU (`index.html:315`) | inherited (grounding ledger) | observation only; batch and MTP acceptance are not reconstructable, so it is excluded from the fit set |
| h20-ant-sglang-pro / h20-ant-sglang | FITTED inputs F2/F3 | H20 | Ant/SGLang production R1 decode: 675 tok/s at batch 32 / TPOT <50ms and 714 tok/s at batch 48 / TPOT <70ms | **VERIFIED 2026-07-27** at the primary LMSYS/Ant production post | both observations contributed to the frozen joint η fit; neither is the live row identity. The separate `h20-neutral-live-dec` analyst record carries the deployed 680 tok/s neutral coefficient |
| ascend-cminfer-decode / ascend-cminfer-15ms | FITTED inputs F5/F6 | Ascend 910C | CloudMatrix-Infer R1 INT8 isolated decode: 1,943 tok/s/NPU at batch 96 / 49.4ms and 538 tok/s/NPU at batch 8 / 14.9ms | **VERIFIED 2026-07-27** at arXiv:2506.12708 Tables 3–4 | both observations contributed to the frozen joint η fit; neither is the live row identity. The separate `ascend-neutral-live-dec` analyst record carries the deployed 1,422.7 tok/s neutral coefficient |
| `*-neutral-live-dec` / gb300-analyst-set-dec / — | ANALYST-SET (no identified per-row fit) | H20, Ascend, GB300, H200, TPU v7, Trn2, Trn3 | H20/Ascend select source-informed neutral coefficients that do not reproduce their observations; GB300 uses an assumed operating point informed by the separate SGLang observation; the other rows are transfers or analyst estimates | n/a | live analyst identities are separate from their measured FITTED/RETRO records and carry component-scoped stress envelopes |
| — | PROJECTION (chart-only) | Rubin | `const RUBIN` not in HW_ORDER; all parameters projections; NVIDIA claim is relative-only | n/a | ineligible for any fit; already shape-only in the UI |
| gb300-mlperf-v6 | RETRO | GB300 NVL72 | MLPerf Inference v6.0 audited, DeepSeek-R1 (671B), system `GB300-NVL72_GB300-288GB_aarch64x72_TRT` (single 72-GPU rack): Interactive 250,633.67 (TTFT 1500ms/TPOT 15ms) / Server 400,436.77 (TTFT≤2s/TPOT≤80ms, v6.0 def) / Offline 647,076 tok/s — all `Result is: VALID` (arrived 2026-07-15, additive, never fitted). Dataset mean ISL 800 / OSL 3,880 (receipt pack 2026-07-16) | **VERIFIED 2026-07-16** at raw MLCommons submission logs: `raw.githubusercontent.com/mlcommons/inference_results_v6.0/main/closed/NVIDIA/results/GB300-NVL72_GB300-288GB_aarch64x72_TRT/deepseek-r1/{Interactive,Server,Offline}/performance/run_1/mlperf_log_summary.txt`; Interactive additionally on NVIDIA's results page | price leg analyst-set ($6/GPU-hr) — throughput anchor only. Site's rounded 250,634/400,437/647,076 are exact roundings of the log values. **E1-scoring eligibility ruling (pre-freeze, 2026-07-16, equation-set C7-parity):** v6.0 MANDATES EAGLE spec-decode (R1 MTP head, spec-num-steps=3) in Interactive with the achieved acceptance rate unpublished ⇒ the Interactive observation is ineligible for E1 scoring (same rule as the Trn2 spec rows); Server/Offline scoreable (no spec mandate; usage UNKNOWN, direction disclosed) |
| cm384-flexnpu | RETRO | Ascend CM384/910C | FlexNPU full-system SLO-constrained: ≈633,000 gen tok/s system / ≈1,646 per card at TTFT≤1s, TPOT≤50ms (arrived 2026-07-15, additive). **Provenance refined 2026-07-16 (receipt pack D7, full PDF read):** this is the DYNAMIC CO-LOCATION config — 3 instances × 128 = all 384 cards, no fixed pool; 618.18 req/s × 1,024 OSL ÷ 384 = 632,976 ⇒ 1,648/card reproduces the ledger magnitude exactly; workload 1K/1K (1K/4K reading also reconciles: 1,645/card). **Second operating point registered pre-freeze (value corrected round-2, still pre-freeze/pre-scoring):** the paper's STATIC 6P2D baseline (96 prefill + 288 decode cards) gives a pure-decode-pool observation: the decode pool's STANDALONE throughput 811.52 req/s @1K/1K × 1,024 ÷ 288 = **2,885.4 tok/s/decode-card** (the 489.84 req/s figure first registered here is the prefill-BOTTLENECKED system rate — wrong target for a decode observation; caught by the round-2 review before any score existed) | confirmed at primaries (council empiricist, 2026-07-16); config/pool provenance from arxiv.org/pdf/2606.04415 §4.1/§4.3 Tables 2–3 (receipt pack, 2026-07-16) | different measurement basis from the FITTED isolated-decode point — the CM384-REFIT question. W8A8; decode-pool batch UNKNOWN (only DP288-EP288 stated) |
| tpu7-ironwood-qwen3 | RETRO | TPU v7 Ironwood | Qwen3-Coder-480B-A35B FP8 on 4 chips → 518.86 out tok/s/chip; $6.42/M on-demand, $2.89/M 3-yr (arrived 2026-07-15, additive) | confirmed at primaries (council empiricist, 2026-07-16) | first usable TPU $/token anchors; unfitted |
| trn2-neuron-llama | RETRO | Trainium2 | AWS Neuron tutorials, trn2.48xlarge (16 chips, batch=1, concurrency=1, 10K in / 1.5K out, Llama-3.2-1B-Instruct draft, speculation length 7): Llama 3.3 70B spec-decode 144.171 agg out tok/s → $68.90/M; Llama 3.1 405B FP8+spec 100.700 agg out tok/s → $98.65/M at $35.7608/instance-hr Capacity Blocks US-East-Ohio ($2.235/chip-hr). **Same tutorial pages also publish NO-SPEC baselines: 70B 36.55568 tok/s; 405B bf16 24.42101 tok/s** (registered 2026-07-16, pre-freeze, as additional operating points of this family) | **VERIFIED 2026-07-16** at AWS Neuron tutorial pages (verbatim "Overall Output Throughput" values) + aws.amazon.com/ec2/capacityblocks/pricing; arithmetic re-derived exactly; throughputs are per-instance, price÷throughput pairing correct; baselines re-verified on the same pages (receipt pack 2026-07-16) | engineering reference (batch=1), NOT production TCO. **E1-scoring eligibility ruling (pre-freeze, 2026-07-16, equation-set C7):** the two SPEC rows' draft-acceptance rate is UNKNOWN at source — the dominant unmeasured determinant of their throughput — so they are ineligible for E1 scoring under protocol §2 ("stated or reconstructable" operating point); the receipt-complete no-spec baselines are the family's score-set observations. Spec rows remain the $-leg carriers. Citation nuances: 405B results table also shows a per-request P50 metric 102.41 next to the 100.70 aggregate — cite the aggregate; Capacity Blocks pricing is demand-variable, value is as-published 2026-07-16 |
| amd-mi355x-prod-* | PROSPECTIVE (reserved) | AMD MI355X | first public production-interactive anchor capable of a $/token leg — does not exist yet | n/a | reserved untouched 2026-07-16 (protocol §3); off-limits to D2 design sessions |
| gb300-rack-rate-* | PROSPECTIVE (reserved) | GB300 NVL72 | first observed rack rental rate | n/a | reserved untouched 2026-07-16 |
| trn3-any-* / rubin-any-* | PROSPECTIVE (reserved) | Trainium3 / Rubin | any future serving anchor | n/a | reserved untouched 2026-07-16 |

## Baseline record — the single-scalar transfer test (historical context, NOT the G4 comparator)

From `research/methods-loao.md` (pre-registered, failed, published): fit on the H800 anchor only
(global decode MFU 6.91%), predict held-out platforms — H20 −59% (pred 277 vs meas 675), GB200 −54%
(4,672 vs 10,100), Ascend-optimized −28% (1,405 vs 1,943), Ascend-neutral +8% (1,405 vs 1,303).
**Mean |error| 37%, worst 59% → FAILED its ≤~25% bar.** Roofline follow-up: better decode points
(H20 −11/−16%, GB200 −2%) but whole-platform FAIL (Ascend-15ms −39.8%, prefill worst −70.8%) and
formally unrunnable (p < n_train) — ships as diagnostic only.

**G4 comparator (IM0 gate P0-3):** the numbers above were measured on a different anchor set and are
context only. Before D2 is scored, the same frozen single-scalar model (6.91% H800 fit) must be
freshly scored on the four RETRO anchors of the registry (`gb300-mlperf-v6`, `cm384-flexnpu`,
`tpu7-ironwood-qwen3`, `trn2-neuron-llama`), per-phase/per-operating-point with E3 translation, and
those rows recorded below in the score log. G4 compares D2 against THAT record — same anchors, same
metrics.

## Score log

### FREEZE BLOCK — IM2.5 pre-registration freeze (2026-07-17, ~02:45 UTC)

**This entry's existence IS the freeze** (protocol Status rule). The three frozen artifacts, under
the protocol §7 three-hash enforcement (every scoring harness recomputes and hard-fails on any
mismatch; runs without the check are void):

| artifact | sha256 |
|---|---|
| `research/d2-validation-protocol.md` (v1.0) | `2ec72aa70a3b16ef2faa71f715a917b4ec49f72ecb4f7eadbf3c9da8232b5f64` |
| `research/d2-equation-set.md` (v1.0) | `77ddeccc1bf4fa3fa476e096023c3be9de100939dac64e73cc5cb06678fb1aad` |
| `research/e3-evaluator-v2111/engine-v2111-frozen.js` | `71ab5752f7a9d6977bf72e13d6b6ef1fef9ce3c66cf1ac7f924c509aa86cf202` |

**Signatures (§7(3)):**
- Orchestrator: Fable v2.2-program orchestrator (session of 2026-07-16/17), signed at this entry.
- Fresh Sol instance: GPT-5.6 Sol (CC-harness dispatch, signing attempt 3, completed 2026-07-17
  ~02:44 UTC): *"I sign the freeze of these two documents as the §7(3) fresh Sol instance"* — with
  the protocol and equation-set hashes above attested verbatim in its report, both empirical checks
  passed (Appendix A reproduction incl. the −6.470pp gate-compliant corner; evaluator byte-copy
  identity). Working-tree hashes re-verified equal to the attested hashes immediately before this
  entry was written.

**Review chain (full audit trail: protocol §7a):** round 1 — Claude-native fallback
(FINDINGS-BLOCK-FREEZE, 3 findings fixed) + delayed true-Sol pre-fix pass (concurring; 5 further
findings, all remediated) → fresh-instance fix-verification CLEAR-TO-HASH. Round 2 — Claude-native
fallback after two mechanically failed Sol dispatches (6P2D target CONFIRMED and corrected to
2,885.4; 405B precision claim REFUTED at the primary source). Round 3 — fresh-instance verification
CLEAR-TO-HASH (9/9). Rounds 4–5 — true-Sol signing reviews (13→3 findings, all adjudicated and
fixed, incl. the dense-TP Φ/N equation correction and the RETRO-prefill loophole strike). Signing
attempt 3 — dual SIGN-OFF, "nothing substantive blocking the freeze."

Scoring may now begin, in protocol §6 order: single-scalar G4 baseline rows FIRST, then the
zero-tuning D2 spike. Score rows append below this block.

### IM2.5 scoring run — 2026-07-17 (harness `tests/d2-spike-harness.mjs`; three-hash check PASSED; harness fidelity verified FAITHFUL by fresh instance incl. three hand-recomputations and the published-η sanity anchor)

**η calibration (FITTED only, recorded before any RETRO number):** η_dec = **0.36142**
(geometric-mean, F1–F6; the F1 implied-η reproduces the published H800-only 0.3096 exactly);
η_pre = **0.17581** (identity fit, F7). Fit residuals at joint η: F1 +16.7 / F2 +3.5 / F3 −2.2 /
F4 +14.4 / F5 +5.3 / F6 −29.7 %.

**G4 baseline rows (frozen single-scalar, 6.91% H800 fit; engine precision conventions):**
gb300-server +55.3% / gb300-offline −3.9% / cm384-coloc −14.7% / cm384-6p2d −51.3% /
tpu7 +777.8% / trn2-70b +13,941.9% / trn2-405b +3,533.0% → **median 55.3%, worst 13,941.9%**.
Baseline E3_joint (exhaustive) = +2.539 pp.

**D2 candidate rows (zero tuning, frozen recipes):** gb300-server +396.8% (b* = 2,210, HBM roof) /
gb300-offline +233.8% (b* = 190,364) / cm384-coloc +243.7% (b* = 281, compute roof) /
cm384-6p2d +96.1% / tpu7 +495.4% (b* = 154) / trn2-70b +219.6% (b = 1 stated) /
**trn2-405b −15.8%** (b = 1 stated; the only row inside bounds) → **median 233.8%, worst 495.4%**.
Per-anchor E3 (reporting): all ≤ 1.06 pp; **E3_joint (exhaustive, decode-only) = +2.750 pp**.

**Gates (§5 three-state, harness-computed):**
- **G1 FAIL** — median 233.8% (bar ≤25%), worst 495.4% (bar ≤40%).
- **G2 UNSCOREABLE** (as pre-stated at freeze).
- G3 PASS (|2.75| ≤ 5 pp; decode-only — does not rescue a G1 FAIL, §5(4)).
- **G4 FAIL** — D2 median 233.8% is not strictly better than the baseline's 55.3% (D2's worst IS
  better: 495.4% vs 13,941.9%). The dumb scalar beats D2 on median because it lands near the
  gb300-offline/cm384 points by luck of the 6.91% constant, while D2 over-predicts uniformly.
- G5 PASS (7 obs / 2 params = 3.5).

**VERDICT: FAIL → KILL/redesign (cycle 1 of the 2-cycle cap). Scope: decode-scope at best; no
prefill or blended-margin claim was ever available (G2 unscoreable). Published either way, per the
pre-registered commitment — this is the program's second pre-registered negative result (after the
2026-07 single-scalar transfer test).**

**Mechanism analysis (§5 requirement; accompanies, never converts):** the failure concentrates in
OPERATING-POINT CLOSURE, not raw roofline physics. (1) SLO-batch inversion predicts platform
CAPACITY under the frozen feasibility convention, not the DELIVERED operating point: gb300-server's
inversion chose b = 2,210/GPU where the measurement implies ~445 concurrent streams/GPU
(400,437 tok/s × 80 ms); cm384's chose b = 281 where the same platform's FITTED isolated-decode
point ran b = 96 at the same TPOT bound. (2) The frozen feasibility convention (KV ÷ N_shard) is in
tension with the device-equivalent scan term (K_dev = K(L) unsharded), inflating admissible batch —
an internal inconsistency of the frozen text, implemented literally per the zero-tuning rule and
named here rather than patched mid-run. (3) The two stated-batch rows split diagnostically:
405B −15.8% (physics transfers acceptably when the operating point is pinned, HBM-bound b=1) vs
70B +219.6% (the pre-registered low-batch TP16-overhead risk, exactly as the frozen risk statement
predicted). (4) tpu7 +495.4% compounds closure optimism with the C4 convention (no stated SLO at
source). Residual-freedom disclosure from the fidelity verification: s_act for TPU7/Trn2 was
inferred from precision rather than explicitly pinned — immaterial here (no score row is
fabric-bound). **Redesign direction (cycle 2 must be a NEW pre-registered equation-set version +
fresh review + re-scoring from scratch):** model DELIVERED operating points (anchor
batch/concurrency to stated or reconstructable utilization evidence instead of feasibility-capped
argmax); fix the feasibility/scan sharding inconsistency; add the low-batch overhead mechanism the
FITTED set's own b=8 point already signals (implied-η 0.514 vs joint 0.361).

## Provenance

- Seeded 2026-07-16 (IM0) from update-queue Q-AUTO entries of 2026-07-15 and the council empiricist's
  primary-source checks (`reports/codex-council/2026-07-16-im-reengineer-plan-20260716T141016Z/persona-empiricist.md`).
- Trn2/GB300 verification and the FITTED census run as dedicated passes 2026-07-16; their results
  replace the PENDING/census-pending rows above.

### AMENDMENT BLOCK — owner-recorded pre-cycle-2 amendments (2026-07-17)

**Authority:** owner rulings of 2026-07-17 (AskUserQuestion; the second gated on and adopting the
GPT-Pro consultation `research/consultation-2026-07-17-cycle2-decision-gptpro.md`, banked at
9165569). Per the consultation's requirement, these are RECORDED amendments — the frozen protocol
FILE is not edited; this block governs cycle-2 scoring semantics alongside it, and the cycle-2
freeze review must verify the cycle-2 equation set conforms to it. Nothing here alters cycle-1's
published scores.

1. **Source-agnostic closure/eligibility hierarchy adopted** (applies to every observation, decode
   and prefill, by observable source class — never by platform name or model residual):
   (1) stated delivered batch/concurrency → two-sided point target;
   (2) independently established binding constraint → two-sided point target;
   (3) known offered workload without established saturation → DEMAND-CENSORED: one-sided
       feasibility evidence, prediction form min(capacity, offered load); NOT in any two-sided
       error distribution;
   (4) ceiling-only bound → two-sided ONLY under an explicitly declared universal ceiling-equality
       closure HYPOTHESIS (scores test roofline ∧ hypothesis jointly);
   (5) otherwise closure-ineligible.
   The closure class is reported with every row.
2. **gb300-mlperf-v6 SERVER is class 3 (demand-censored)** — delivered throughput is 93.7% of the
   stated offered-token rate (110 req/s × dataset OSL); capacity is not point-identified. It LEAVES
   the two-sided G1 error set. **G1's gating population is therefore the 6 remaining decode
   observations** (gb300-offline, cm384 ×2, tpu7, trn2 ×2). Mandatory disclosures at scoring:
   6/7 point-score coverage stated prominently; the Server feasibility result reported; the 7-row
   ceiling-closure result published as a NON-GATING sensitivity; the inability to predict its
   delivered operating point named as a closure-coverage limitation.
3. **G2 annex (gb300-interactive disaggregated prefill) — activation formally recorded** (owner
   ruling earlier same day): enters as class 3 DEMAND-CENSORED (offered 6,800 prefill tok/s/GPU
   from stated target-QPS × stated ISL ÷ 8 GPUs; TTFT p99 492 ms vs 1,500 ms bound is evidence
   AGAINST saturation). G2 therefore scores as one-sided feasibility (adverse iff predicted
   prefill capacity < offered load); claims are retrospective-only; G3's binding interpretation is
   limited to DELIVERED-UNDER-THE-STATED-WORKLOAD (not raw capacity margin). Activation is
   IRREVOCABLE post-scoring: the annex may not be deactivated or reinterpreted after scores exist.
4. **Median implementation for the 6-row G1 set:** the protocol's existing even-n convention (mean
   of the two middle values, IM0 gate P2-3) applies unchanged; the count of rows ≤ each threshold
   is additionally reported.
5. **Conformance items the cycle-2 equation set revision must carry** (from the consultation, all
   pre-freeze): τ_cc sensitivity band strictly non-gating with the disclosure that the band
   contains the holdout-implied value (no post-scoring selection from it); CM384 at-ceiling
   labeled the ceiling-equality closure hypothesis (class 4), never "source-pinned"; Trn2 frozen
   wall-clock aggregates remain the SOLE gating targets with the outlier gap counted as model
   error ("unmodeled wall-clock component", not "irreducible"), 1/TPOT diagnostic-only; binding
   status never conditioned on measured latency outcomes; G5 reported as an
   observation-to-parameter RATIO (not "identifiability") with structural closure degrees of
   freedom disclosed; exact relative-error formula, threshold precision, and missing-row policy
   frozen in the equation set; interpretation rules pre-registered (which failure pattern
   falsifies the closure vs the single-η roofline).

Signed into the ledger by the v2.2-program orchestrator on the owner's ruling, 2026-07-17.

### FREEZE BLOCK — cycle-2 equation-set freeze (2026-07-18 ~01:45 UTC / 2026-07-17 evening MST)

**This entry's existence IS the cycle-2 freeze** (protocol Status rule). The frozen artifact set for
cycle-2 scoring, under the protocol §7 three-hash enforcement (every scoring harness recomputes and
hard-fails on any mismatch; runs without the check are void):

| artifact | sha256 |
|---|---|
| `research/d2-validation-protocol.md` (v1.0, unchanged from cycle 1) | `2ec72aa70a3b16ef2faa71f715a917b4ec49f72ecb4f7eadbf3c9da8232b5f64` |
| `research/d2-equation-set-v2.md` (v2.2, NEW — cycle-2 candidate) | `66ed0df09597cc96bea348d495b6e1ed83362aa00ae5a664a38739512c152db1` |
| `research/e3-evaluator-v2111/engine-v2111-frozen.js` (unchanged) | `71ab5752f7a9d6977bf72e13d6b6ef1fef9ce3c66cf1ac7f924c509aa86cf202` |

The equation-set hash was attested by the §7(3) Sol signing instance on the byte-identical
pre-mint path `d2-equation-set-v2-DRAFT.md` (`reviews-2026-07-17-sol-v22-signing.md`); the DRAFT
file is retained for provenance and is superseded by the frozen path above.

**Governing context frozen WITH the equation set:** the 2026-07-17 AMENDMENT BLOCK above (owner-
recorded; 5-class closure hierarchy; gb300-server class-3 demand-censored; G1 gates on 6 two-sided
decode observations; activated demand-censored G2 annex; G3 scope delivered-under-stated-workload).

**Signatures (§7(3)):**
- Orchestrator: Fable v2.2-program orchestrator (session of 2026-07-17/18), signed at this entry.
- Fresh Sol instance: GPT-5.6 Sol, 2026-07-18 ~01:40 UTC: *"I sign the cycle-2 freeze of this
  equation set as the §7(3) fresh Sol instance"* — hash attested verbatim, two empirical checks
  reproduced (six-row baseline median 414.55%; offered load 426,800), three prior blocking concerns
  assessed CLOSED (`reviews-2026-07-17-sol-v22-signing.md`).
- Owner: sign-off recorded 2026-07-17 evening (AskUserQuestion): **mint and score.**

**Review chain (audit trail):** GPT-Pro modify-first consultation (adopted in full) →
v2.1 conformance revision (4b4a12b) → true-Sol freeze review FINDINGS-BLOCK-FREEZE (e5701ee) →
v2.2 remediation (adeff82) → fresh-instance fix-verification ALL-VERIFIED (1c70378) → Sol signing
(32b9f5b). Honest pre-scoring expectation, frozen in the artifact (§0.2): G1 FAIL expected; a pass
requires multiple disclosed residuals wrong in the favorable direction; interpretation rules §12
pre-registered.

Scoring may now begin, in §11 order: G4 single-scalar baseline rows on the 6 gating observations
FIRST, then the zero-tuning D2 spike (6 two-sided + 2 one-sided class-3 rows). Score rows append
below this block.

### Cycle-2 scoring run — 2026-07-18 (harness `tests/d2-spike-harness-v2.mjs`; three-hash check PASSED first-action; byte-stable across runs; fidelity-verified FAITHFUL by a fresh instance — three rows hand-recomputed from the frozen text, all six confirmed, constants provenance traced)

**η calibration (FITTED only, §3):** η_dec = **0.36142**, η_pre = **0.17581** — both reproduce the
cycle-1 published values to 5 dp (F1 implied-η 0.3096 reproduces the published H800-only fit).
τ_cc = 18 µs (30 ring-steps × 600 ns declared scenario constants, §1.5).

**G4 baseline rows (frozen single-scalar, recomputed on the 6 gating observations per §5.1):**
ordered |rel| 3.9 / 14.7 / 51.3 / 777.8 / 3,533.0 / 13,941.9 → **median 414.55%, worst 13,941.9%**.

**D2 candidate rows (zero tuning, frozen recipes; 6 two-sided):** gb300-offline **+197.0%** (class 4,
pinned b=1,536/rank, HBM-bound; feasible at N_shard=8) · cm384-6p2d **+96.1%** (class 4, b*=282,
compute-bound) · cm384-coloc **+243.7%** (class 4, WORST) · tpu7 **+81.9%** (class 1, b=16 stated,
HBM-bound) · trn2-70b **+128.0%** (class 1, b=1, §7.2 wall-clock mapping, TPOT_pred 11.438 ms =
t_roof 8.558 + t_cc 2.880) · trn2-405b **−27.2%** (class 1). Ordered |rel|:
27.2 / 81.9 / 96.1 / 128.0 / 197.0 / 243.7.

**One-sided class-3 rows:** gb300-server Ĉ_model = 1.99M tok/s ≥ offered 426,800 → **non-adverse
PASS** (feasibility only; capacity not validated). §10 annex Ĉ_pre(800) = 34,700 ≥ offered 6,800 →
**G2 PASS (one-sided, feasibility-only — the program's first prefill gate outcome; excess capacity
not identified)**.

**Gates (§11, harness-computed, fidelity-verified):**
- **G1 FAIL** — median **112.05%** (bar ≤25), worst **243.7%** (bar ≤40); counts ≤25% = 0/6,
  ≤40% = 1/6. Coverage disclosure: 6/7 decode observations point-scored (gb300-server demand-
  censored per the AMENDMENT BLOCK; its non-gating 7-row ceiling sensitivity is in cycle2-scores.json).
- **G2 PASS (one-sided)** — feasibility only; no capacity-margin claim (AMENDMENT item 3).
- **G3 PASS** — |E3_joint| = 1.97 pp ≤ 5 (frozen evaluator; decode-scope; does not rescue G1).
- **G4 PASS** — D2 112.05%/243.7% strictly beats the recomputed 6-row baseline 414.55%/13,941.9%
  on median AND worst. (First G4 pass of the program; the §5.1 disclosure applies: the 6-row rebase
  is "procedurally required, not evidence of model improvement" — but the per-row collapse below is.)
- **G5** — 6/3 = 2.0 (two-sided gating set); 8/3 = 2.67 disclosed with one-sided rows.

**VERDICT: FAIL → KILL (cycle 2 of the 2-cycle cap — THE CAP IS NOW EXHAUSTED for this RETRO set).**
Scope: decode-scope; no prefill or blended-margin estimator claim. Published as the program's third
pre-registered negative result, per commitment. Any third attempt requires an EXPANDED/REFRESHED
holdout set AND an owner/council check-in with full disclosure of all prior attempts' per-anchor
errors (protocol §Redesign iteration cap).

**Mechanism read (per the PRE-REGISTERED §12 interpretation rules — stated before scoring):**
1. **The closure layer is vindicated as cycle 1's dominant failure.** Every cycle-1 catastrophic row
   collapsed under source-pinned/declared closures: tpu7 +495.4% → +81.9% (5.9×), trn2-70b +219.6%
   → +128.0%, gb300-offline +233.8% → +197.0%, gb300-server +396.8% → one-sided non-adverse.
2. **The residual failure indicts the single-η cross-platform roofline itself.** tpu7 — the sole
   clean class-1 MoE probe — over-predicts +81.9% with batch pinned to stated concurrency: implied
   delivered efficiency ≈ 0.361/1.819 ≈ **0.199 vs the FITTED joint 0.361**, measuring §0.2's
   forecast ~1.5–1.8× optimism at 1.82× on the clean probe. The class-4 rows over-predict in the
   same direction (roofline ∧ hypothesis jointly; C11 caveats CM384). Per §12: this pattern is
   evidence against the single-η roofline, NOT against the closure layer.
3. **trn2-70b decomposes at the frozen §7.3 boundary:** +40.0 pp attributed to the unmodeled
   wall-clock component; the residual over-prediction is decode-side — the §1.5-disclosed t_cc
   under-correction (18 µs proxy vs the ~104 µs/collective the delivered TPOT implies), direction
   exactly as pre-stated. trn2-405b at −27.2% (vs cycle-1's −15.8% on the raw-decode basis) shows
   pinned-batch dense-TP physics transfers tolerably; the shift reflects the wall-clock mapping +
   t_cc addition, disclosed.
4. **Disclosures carried:** §7.3 negative-E attribution has two readings for the 405B row — both
   published in cycle2-scores.json, gates untouched (spec ambiguity, report-only). §7.2's prose
   aside ("~+35–40%" for 70B) implicitly used observed TPOT — a non-normative documentation wart;
   the frozen boxed equation governs and was followed.

**Program consequence:** with the cap exhausted and no retro pass, v2.2's §6 D2 acceptance cannot be
met on this RETRO set. The path forward is the owner/council check-in the protocol requires — now
armed with a measured residual vector (a 1.82× clean-probe efficiency gap; a t_cc floor bracketed
between 18 µs and ~104 µs/collective; closure-layer fixes validated) instead of forecasts.

### AMENDMENT BLOCK 2 — owner-recorded cycle-3 governance (2026-07-18, post-KILL)

**Authority:** owner rulings 2026-07-18 (AskUserQuestion) on the protocol-required post-cap
check-in, adopting the council synthesis (`research/consultation-2026-07-18-cycle3-council.md`,
banked 2608ccd) with the STRICTEST entry variants. Frozen artifacts and both prior cycles'
records are untouched; this block governs everything after the cycle-2 KILL.

1. **HOLD reaffirmed (§6a):** v2.2 does not ship in any form; production stays v2.1.x. No
   estimator/ranking language anywhere (plan §6 estimator-claim rule reaffirmed). The G4 pass is a
   comparative research result, not a release basis. D2's cycle-2 outcome publishes as the
   program's third pre-registered negative result.
2. **No cycle-3 candidate may be minted** until the entry bar (item 6) is met. η≈0.199 and
   τ_cc≈104 µs are ILLEGAL as coefficients (inverse-derived from failed holdout targets); they may
   select mechanism classes only. **Tripwires:** any proposed coefficient landing within 5–10% of
   0.199, 0.361/1.82, or 104 µs without a fully independent derivation HALTS the cycle.
3. **Quarantine intake (armed with this block):** every post-cycle-2-freeze arrival is intake-
   stamped (date, sha256 of source capture, eligibility + closure classification from source
   metadata only) in `research/prospective-quarantine/` BEFORE any design-team access. Verified
   2026-07-18: NO auto-scoring machinery exists in the cron — no prospective worst-cap breaches
   have been recorded against the dead candidate; the poisoning risk was latent, not active.
4. **Cohort re-basing on KILL (closes the §6a mitigation gap, synthesis-emergent):** arrivals
   during a KILL interval are sealed and may be scored against the dead candidate as NON-GATING
   diagnostic records only; on the next candidate freeze, sealed arrivals retain PROSPECTIVE
   standing with respect to the NEW candidate and the prospective-gate accumulation cohort
   re-bases to that freeze. Exposure to designers forfeits PROSPECTIVE standing permanently
   (→ RETRO or calibration-FITTED at intake, recorded).
5. **Permanent classifications:** MLPerf v6.0 4-rack rows and the CM384 1K/4K observations are
   RETRO permanently (correlated siblings of scored families; the CM384 Table-2-vs-Table-3
   contradiction — 53 vs 146.63 req/s — must be resolved before any use). The 2026-07-14 Ironwood
   Qwen3.5-397B disclosure was exposed to the council → its PROSPECTIVE standing is spent; it is
   sealed as **calibration-FITTED at intake** (the use the council prescribed for it).
6. **Cycle-3 entry bar (STRICTEST variant, owner-selected):** cycle 3 may open only when ALL hold:
   (a) ≥2 genuinely NEW independent platform×stack×model clusters exist BEYOND the present score
   set, reserved untouched for scoring; (b) ≥1 new two-sided class-1/2 delivered-MoE decode
   observation among them; (c) ≥1 independently calibrated collective-sensitive observation;
   (d) if v2.2 remains a blended product, ≥1 eligible two-sided prefill observation;
   (e) no evidence cluster supplies >25% of the primary two-sided rows — the composition cap
   applies at ENTRY **and** in the GATE population (owner-selected strict form);
   (f) full source-level enumeration before any prediction.
7. **Cycle-3 gates:** dual G1 (observation-level, thresholds unchanged — commensurable with
   cycles 1–2) AND G1-F (family-balanced: each correlation cluster contributes its WORST |rel|;
   same 25/40 bars). Both must pass. Amendments may strengthen partitioning only; any clause
   relaxing a threshold is rejected on sight as reframe-by-amendment.
8. **Evidence partitions:** legacy audit panel (all banked rows — mechanism analysis only) /
   calibration (FITTED at intake; anything used to fit cannot vote) / confirmation cohort (first
   eligible independent post-freeze families, arrival order) / quarantine. Status is locked at
   intake, never relabeled.
9. **Standing scope limit:** no plausible source of a two-sided prefill capacity anchor is
   currently known → the blended-margin flagship claim has NO identified path even if cycle 3
   passes decode-scope. Stated now so cycle 3 is not designed around an undeliverable claim.
10. **Calibration budget posture (owner-ruled):** free sources first — the Ironwood disclosure
    η-vs-concurrency audit and MLCommons raw submissions. NO paid accelerator time authorized;
    revisit only if free evidence leaves τ_cc as the binding unknown at the entry gate.

Signed into the ledger by the v2.2-program orchestrator on the owner's rulings, 2026-07-18.

### AMENDMENT BLOCK 3 — owner-recorded program reframing (2026-07-18): SHIP v2.2, best-public-info model

**Authority:** owner ruling 2026-07-18 (direct statement): *"We want to just supersede 2.1, and
what we're aiming for is the best possible model based on publicly available free information —
that's the guiding principle. We won't have exact figures because no one has exact figures;
everything is estimated."*

1. **Supersedes §6a's HOLD:** v2.2 SHIPS, superseding v2.1.x, on the normal IM6→IM7 path (owner
   sign-off at IM7 unchanged). Supersedes the estimator-claim rule AS A RELEASE BLOCKER: claims
   language is governed by measured-error disclosure, not gate passage.
2. **What survives on its own merits (not gate-worship):** no "validated" claims anywhere (that
   upgrade still requires the prospective gate, unchanged); the three-status ledger; per-row
   uncertainty labeling; publish-either-way. The workbench framing stays dead — the headline
   remains quantitative best-estimates (band + central scenario, per the standing shape ruling).
3. **The cycle-1/2 error vector becomes the product's empirical uncertainty model** (the plan
   already contemplated this for the transfer test): uncertainty bands calibrated per closure
   class from the published pre-registered measurements — the site ships the only public margin
   model with a measured error distribution on its own model class.
4. **The v2.2 engine ships the best current model:** the cycle-2 structure's independently
   justified improvements (closure conventions, sharding fixes, t_cc as declared scenario term,
   the G4-passing model) integrate per IM3–IM5; D2-gate machinery (AMENDMENT BLOCK 2, quarantine,
   entry bar, prospective gate) continues as the ongoing measurement/validation track — informing
   labels and future claim upgrades, no longer blocking releases.
5. IM sequencing resumes: IM3 (model integration) → IM4 (anchored-only defaults + coverage) →
   IM5 (band+central headline with measured-error envelopes) → IM6 (shadow compare + cold review,
   corroborating not gating) → IM7 (owner-signed release superseding v2.1).

Signed into the ledger by the v2.2-program orchestrator on the owner's ruling, 2026-07-18.
