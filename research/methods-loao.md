# Methods note: single-anchor (H800-trained) cross-platform transfer test of the effective-MFU abstraction

> **Naming note.** This was originally called "leave-one-anchor-out," which is a misnomer: the experiment fits ONE global coefficient on the H800 production anchor and predicts the other platforms — it does not iteratively leave each anchor out and refit on the rest. Read it as a **single-anchor cross-platform transfer test**; the result and its limitations below are unchanged.

> Run 2026-07-10, as prescribed by the external review (the empiricist's "load-bearing experiment").
> Code: `tests/loao.mjs` in the project tree. Predictions were fixed before comparison.

## Question

The calculator compresses each accelerator's serving behavior into one scalar — an "effective decode MFU" against dense 8-bit FLOPS. Is that a *predictive* abstraction (one coefficient transfers across hardware), or an *interpolating* one (each platform needs its own fitted coefficient)?

## Design

Fit a **single global decode MFU** using only the DeepSeek H800 production anchor (1,850 tok/s/GPU on a 37B-active model, 1.98 PF dense FP8 ⇒ **6.91%**). Predict every other platform's published decode measurement from its spec sheet and that one coefficient. Pass bar (set in advance by the review): central error ≤ ~25%.

## Result

| Held-out platform | Predicted | Measured | Error |
|---|---:|---:|---:|
| H20 (Ant/SGLang production, <50 ms tier) | 277 | 675 | **−59%** |
| GB200 (vLLM published) | 4,672 | 10,100 | **−54%** |
| Ascend 910C INT8 (CloudMatrix-Infer, optimized) | 1,405 | 1,943 | −28% |
| Ascend 910C INT8 (neutral read: DeepSeek "60% of H100") | 1,405 | 1,303 | +8% |

**Mean |error| 37%, worst 59% — the abstraction FAILS the transfer test.**

## Interpretation and consequences (adopted in methodology v2)

1. A scalar compute-MFU does not transfer across platforms, because decode is memory/interconnect-bound: the H20's tiny FLOPS denominator makes its fitted "MFU" (17%) 2.5× the H800's (7%) for the same physical workload. The coefficient absorbs bandwidth, batch regime, serving stack, and latency target — it is not a hardware constant.
2. The calculator's per-platform MFU values are therefore **anchor fits** — each reproduces its own published measurement, and the page no longer describes this as "calibration" in the predictive sense. Reproducing the datum used to select a coefficient is an identity, not a validation.
3. **Platforms without a published anchor carry materially lower confidence**: TPU v7 Ironwood, Trainium 2/3, and the Rubin projection have no public serving measurement for a frontier MoE and their MFU values are analyst estimates. This is now stated in the calculator.
4. The model's honest domain of validity: **short-to-moderate context, throughput-oriented serving, interpolation near the anchored operating points**. The published anchors are all ≤~50B-active models; the flagship scenarios assume 120–300B active — that size axis is the model's largest unanchored extrapolation. Context length, TTFT/TPOT targets, KV-cache lifecycle, and speculative-decoding acceptance are not modeled; the interactivity multipliers (1.0/0.70/0.35) are a coarse stand-in for a latency curve that published data (CloudMatrix: 1,943 → 538 tok/s from 50 ms → 15 ms TPOT) shows is steep.

## What would upgrade the model

A roofline formulation (compute + HBM + interconnect terms with per-platform physical constants) fit jointly on all anchors with one shared efficiency residual — then re-run this experiment. Until that passes, cross-platform margin comparisons inherit anchor-fit uncertainty, and the per-provider ranges in §10 should be read accordingly.


## Follow-up (2026-07-10, same day): the roofline attempt — a documented negative result

We commissioned the upgrade path named above: a decode roofline with compute, HBM and fabric terms, 1/batch weight amortization, explicit MTP handling, and **one shared** roof-utilization residual (no per-platform efficiency), fit on the H800 production anchor alone (η = 31.0%). Full derivation: [the roofline consultation](consult-roofline.html); runnable diagnostic: [/tests/roofline-diagnostic.mjs](../tests/roofline-diagnostic.mjs), deployed with the site.

**Result:** dramatically better than scalar MFU at throughput-oriented operating points — H20 −11/−16%, GB200 −2% (under an optimistic all-FP4 weight-traffic bound), Ascend@50ms −10%, and it reproduces the CloudMatrix paper's measured ~44% MTP latency increase — but it **fails the whole-platform gate**: Ascend's documented 15ms operating point misses by **−39.8%** (≈6–8pp of margin at typical operating points), and prefill transfers worse (worst −70.8%). The favorable numbers are also unstable to undisclosed metadata (H800 batch and MTP status alone swing the worst error between 31% and 57%).

**More fundamentally, the preregistered experiment could not be executed as designed on public data** (the fit is exactly-determined rather than validated): one fitted parameter against one training platform group violates the identifiability precondition (p < n_train), and no genuinely untouched platform exists — every candidate already informed the model's design. **Decision: the anchor-fit model stays; the roofline ships as an experimental diagnostic only.** A valid future test needs ≥2 independent training platform groups, a genuinely new platform held out after model freeze, frozen checkpoint/batch/MTP/precision metadata, and a max-error gate over every held-out operating point.
