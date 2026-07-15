# Roofline consultation — VERBATIM full derivation (recovered original)

> The complete, unedited response of the roofline throughput-model consultation (58m52s, `gpt-5-6-pro`, Pro-verified, 2026-07-10; [conversation](https://chatgpt.com/g/g-p-6a42f0b0f46e81919a65018455ee56dd/c/6a516cd6-1834-83e8-a950-20302f616c6d)).
> **Provenance:** recovered 2026-07-11 from the session transcript that received it — original bytes, not a regeneration. The [adopted-verdict wrapper](consult-roofline.html) states the decision the site took (anchor fits stay); this page is the full derivation behind it. The runnable diagnostic is at [/tests/roofline-diagnostic.mjs](../tests/roofline-diagnostic.mjs).
> **SHA-256 (response body below this header):** `c3b6e650d6e80e11ff9c7c03b502563401a45fc0d99e9dbac6f2415e37ae891d`

---

I’ll derive an implementable roofline, audit current assumptions, and run platform-level holdouts with explicit batch/MTP sensitivity and downstream margin propagation.

The key transfer variable is decode reuse: weight traffic scales roughly as 1/B, while MTP alters useful tokens and work per iteration.

A critical comparability issue is that GB200’s 10.1k result appears to use NVFP4/FP8 at batch 1024, not an 8-bit-equivalent operating point.

The explicit roofline is a retrospective near-miss: worst decode error is 28.5%, rising to 50.5% with literal GB200 precision; H800-only fitting invalidates the formal gate.

## Verdict

**Do not replace the anchor-fit model with this roofline yet.**

A favorable retrospective implementation gives respectable predictions at the throughput-oriented operating points: H20 within 11–16%, GB200 within about 2% under an optimistic NVFP4 assumption, and Ascend’s 50 ms point within 10%. But the council-compliant test must hold out and score the **entire platform**. Once Ascend’s documented 15 ms operating point is included, the model predicts **324 vs 538 tokens/s/NPU, a −39.8% error**. That exceeds the existing ~25% gate.

More fundamentally, the preregistered experiment is presently **unrunnable**:

- One shared residual fitted on H800 means \(p=1\) fitted parameter and \(n_{\text{train}}=1\) independent platform group, so the hard requirement \(p<n_{\text{train}}\) is false: \(1<1\) does not hold.
- H20, GB200, and Ascend have all already been examined in the MFU falsification and in selecting this roofline’s assumptions. None is a genuinely untouched platform.
- Several supposedly “physical” inputs are missing, especially H800 batch, H800 KV precision and MTP status, exact GB200 mixed-precision weight bytes, and Ascend KV precision. Choosing those after observing throughput creates hidden effective degrees of freedom.

The existing single-MFU test failed at 59% worst error; this roofline improves the favorable retrospective result but still fails the whole-platform gate and cannot be called a preregistered validation. citeturn692601view0turn525695view0

---

# 1. Functional form

## Per-iteration decode roofline

For platform \(j\) and operating point \(o\), define:

- \(b\): decode sequences per chip
- \(q\): target-model token positions processed per iteration
- \(a\): accepted output tokens per sequence per iteration
- \(L\): current KV-cache length
- \(F_j\): applicable dense compute peak in FLOP/s
- \(B_{H,j}\): HBM bandwidth in bytes/s
- \(B_{\ell,j},B_{r,j}\): local and remote fabric bandwidth
- \(\eta\): **one shared fitted roof-utilization residual**
- \(t_0=0\): no second residual, because it cannot be identified from one H800 observation

DeepSeek-R1/V3 supplies the physical architecture constants: 37B active parameters, 61 layers, hidden size 7,168, 128 attention heads, 512-dimensional compressed KV, 64-dimensional decoupled RoPE key, 58 MoE layers, and eight routed experts per token. citeturn848796view0turn692601view9

### Compute work per target position

Including core attention work rather than only parameter FLOPs:

\[
\Phi(L)
=
2P_{\rm active}
+
2N_LN_H(d_{qk}+d_v)L
\]

Using \(P_{\rm active}=37\text{B}\), \(d_{qk}=128+64=192\), and \(d_v=128\):

\[
\Phi(L)
=
74\times10^9
+
4{,}997{,}120L
\quad\text{FLOPs.}
\]

Thus:

\[
t_C=\frac{bq\Phi(L)}{F_j}.
\]

For genuinely mixed precision, replace that with:

\[
t_C=bq\sum_r\frac{\Phi_r(L)}{F_{j,r}}.
\]

### HBM traffic

One complete scan of the latent KV cache for one sequence and one target position is:

\[
K(L)
=
N_L(512+64)s_{KV}L.
\]

Therefore:

- FP8 KV: \(35{,}136L\) bytes per sequence scan
- BF16 KV: \(70{,}272L\) bytes per sequence scan

Let \(W_{\rm iter}\) be active weight bytes fetched during one iteration. Then:

\[
t_H
=
\frac{W_{\rm iter}+bqK(L)}{B_{H,j}}.
\]

For the hand calculation, I use the favorable simplification \(W_{\rm iter}=37\) GB for the 8-bit runs: active weights are fetched once and reused across the batch.

A production MoE implementation should instead calculate expected distinct expert-weight traffic:

\[
W_{\rm iter}
=
W_{\rm always}
+
\sum_e W_e\left[1-(1-p_e)^{bqk}\right],
\]

with routing probabilities and expert placement fixed independently of end-to-end throughput. The simple 37 GB assumption is especially questionable at small batch and large expert-parallel degree.

### Fabric traffic

A gross BF16 dispatch-plus-combine payload is:

\[
D
=
2N_{\rm MoE}kHs_{\rm act}
=
2(58)(8)(7168)(2)
=
13.304\text{ MB}
\]

per target position.

With a remote-traffic fraction \(r\) and independently measured round-trip collective startup \(\alpha_j\):

\[
t_N
=
N_{\rm MoE}\alpha_j
+
bqD
\left(
\frac{1-r}{B_{\ell,j}}
+
\frac{r}{B_{r,j}}
\right).
\]

The available table does not provide consistent collective-startup measurements, so the hand calculation sets \(\alpha_j=0\) and uses scale-up bandwidth. This is a favorable lower bound. It is not innocuous: H20 EP16 spans two nodes and approximately half of its MoE traffic remains on NVLink while the rest goes inter-node. citeturn692601view2

### Roofline and output throughput

\[
t_{\rm roof}=\max(t_C,t_H,t_N)
\]

\[
t_{\rm iter}=\frac{t_{\rm roof}}{\eta}+t_0
\]

\[
\boxed{
\widehat T=\frac{ba}{t_{\rm iter}}
}
\]

and the predicted latency is:

\[
\widehat{\rm TPOT}=\frac{t_{\rm iter}}{a}=\frac{b}{\widehat T}.
\]

Do **not** put achieved TPOT into the throughput equation. Since \(T=b/\mathrm{TPOT}\), doing that would simply restate the measured result. TPOT should be an output and an SLO check.

HBM capacity is a separate feasibility condition:

\[
W_{\rm resident}
+
bL\,N_L(512+64)s_{KV}
+
W_{\rm workspace}
\leq M_{\rm HBM}.
\]

## Compact JavaScript implementation

```js
const ARCH = Object.freeze({
  active: 37e9,
  layers: 61,
  heads: 128,
  qkDim: 192,
  vDim: 128,
  kvDim: 576,
  moeLayers: 58,
  topK: 8,
  hidden: 7168,
});

export function decodeRoof(hw, op, etaRoof, t0 = 0) {
  const attnFlops =
    2 * ARCH.layers * ARCH.heads * (ARCH.qkDim + ARCH.vDim) * op.context;
  const flopsPerPos = 2 * ARCH.active + attnFlops;

  const kvPerScan =
    ARCH.layers * ARCH.kvDim * op.kvBytes * op.context;
  const fabricPerPos =
    2 * ARCH.moeLayers * ARCH.topK * ARCH.hidden *
    op.activationBytes * (op.dispatchScale ?? 1);

  const tCompute = op.batch * op.targetPositions *
    (op.computeSecondsPerPos ?? flopsPerPos / hw.flops);

  const kvScans = op.kvScans ?? op.targetPositions;
  const tHbm = (op.weightBytesIter +
    op.batch * kvScans * kvPerScan) / hw.hbmBps;

  const invFabric =
    op.localFraction / hw.localFabricBps +
    (op.remoteFraction ? op.remoteFraction / hw.remoteFabricBps : 0);
  const tFabric = ARCH.moeLayers * (op.fabricRttSec ?? 0) +
    op.batch * op.targetPositions * fabricPerPos * invFabric;

  const tRoof = Math.max(tCompute, tHbm, tFabric);
  const tIter = t0 + tRoof / etaRoof;
  const tps = op.batch * op.acceptedTokens / tIter;

  const residentKv = op.batch * op.context *
    ARCH.layers * ARCH.kvDim * op.kvBytes;
  const feasible = op.residentWeightBytes + residentKv +
    op.workspaceBytes <= hw.hbmBytes;

  return { tps, tpot: tIter / op.acceptedTokens,
           tCompute, tHbm, tFabric, feasible };
}
```

---

# 2. Exact operating-point assumptions

| Platform/row | \(b\) | \(L\) | \(q\) | \(a\) | Weight traffic | KV dtype |
|---|---:|---:|---:|---:|---:|---|
| H800 calibration | 96 | 4,989 | 1 | 1.00 | 37 GB | FP8 |
| H20 Pro | 32 | 4,096 | 3 | 1.85 | 37 GB | FP8 |
| H20 Base | 48 | 4,096 | 3 | 1.85 | 37 GB | FP8 |
| GB200 | 128 | average 3,000 | 1 | 1.00 | 18.5 GB, optimistic lower bound | FP8 |
| Ascend, 50 ms | 96 | 4,096 | 2 | 1.70 | 37 GB | BF16 assumed |
| Ascend, 15 ms | 8 | 4,096 | 2 | 1.70 | 37 GB | BF16 assumed |

Important qualifications:

- **H800:** the published production row gives batch as “N/A,” KV length 4,989 and TPOT of roughly 50 ms. I use \(b=96\), consistent with \(1{,}850\times0.05=92.5\) active sequences per chip, rounded upward. That batch is inferred from the calibration outcome, not independently disclosed. H800 MTP status is also unspecified. citeturn692601view5
- **H20:** the documented configurations are batch 32 and 48, one speculative step, two draft tokens, with acceptance length approximately 1.8–1.9. I use \(a=1.85\) and \(q=3\), interpreted as one base position plus two draft positions. The source reports 675 and 714 tokens/s/GPU at those rows. citeturn692601view1turn692601view3turn692601view4
- **GB200:** the 10,108.4 row is not merely “possibly NVFP4.” Its reproduction command loads an NVFP4 checkpoint, FP8 KV cache, and NVFP4 MoE dispatch. It runs 1,024 sequences over DP8, from which I infer \(b=128\) per GPU. The average context during a 2K-input/2K-output run is approximately 3K. citeturn692601view7turn692601view8turn530181view0turn530181view1
- The GB200 weight assumption of 18.5 GB treats the full 37B active path as 4-bit. That is an optimistic lower bound because attention and some other components remain FP8. It gives the roofline its best chance.
- **Ascend:** the paper explicitly specifies batch 96 and batch 8 for the 50 ms and 15 ms rows. It also states that MTP processes two input positions per iteration and produces 1.7 accepted tokens on average. citeturn692601view5turn848796view4

---

# 3. H800 fit by hand

At \(L=4{,}989\):

\[
\Phi(4989)
=
74\text{ GF}
+
4{,}997{,}120(4989)
=
98.931\text{ GF/position}.
\]

An FP8 KV scan is:

\[
K(4989)
=
35{,}136(4989)
=
175.294\text{ MB/sequence}.
\]

For \(b=96,q=1\):

\[
t_C
=
\frac{96(98.931\text{ GF})}{1.98\text{ PF}}
=
4.797\text{ ms}.
\]

\[
t_H
=
\frac{37\text{ GB}+96(175.294\text{ MB})}{3.35\text{ TB/s}}
=
16.068\text{ ms}.
\]

\[
t_N
=
\frac{96(13.304\text{ MB})}{400\text{ GB/s}}
=
3.193\text{ ms}.
\]

So HBM is the roof:

\[
t_{\rm roof}=16.068\text{ ms}.
\]

The observed iteration time under \(a=1\) is:

\[
t_{\rm observed}
=
\frac{96}{1850}
=
51.892\text{ ms}.
\]

Hence the one shared residual is:

\[
\boxed{
\eta
=
\frac{16.068}{51.892}
=
0.30965
}
\]

or **30.96% roof utilization**.

This is not an MFU: it multiplies the active bottleneck, whether compute, HBM, or fabric.

---

# 4. Held-out predictions by hand

## H20 Pro, batch 32

At 4K context:

\[
\Phi(4096)=94.468\text{ GF},
\qquad
K_{\rm FP8}(4096)=143.917\text{ MB}.
\]

\[
t_C
=
\frac{32(3)(94.468\text{ GF})}{0.296\text{ PF}}
=
30.638\text{ ms}.
\]

\[
t_H
=
\frac{37\text{ GB}+32(3)(143.917\text{ MB})}
     {4.0\text{ TB/s}}
=
12.704\text{ ms}.
\]

Using the supplied 900 GB/s scale-up bandwidth:

\[
t_N
=
\frac{32(3)(13.304\text{ MB})}{900\text{ GB/s}}
=
1.419\text{ ms}.
\]

Compute is the roof:

\[
\widehat T
=
\frac{0.309646(32)(1.85)}{0.030638}
=
\boxed{598\text{ tokens/s/GPU}}.
\]

Measured: 675, so error is **−11.4%**.

## H20 Base, batch 48

\[
t_C=45.958\text{ ms},\qquad
t_H=14.431\text{ ms},\qquad
t_N=2.129\text{ ms}.
\]

Because the row is compute-bound, batch cancels in \(ba/t_C\):

\[
\widehat T
=
\frac{0.309646(48)(1.85)}{0.045958}
=
\boxed{598}.
\]

Measured: 714, so error is **−16.2%**.

## GB200, source-faithful optimistic bound

For a 2K-input/2K-output run, use \(L_{\rm avg}=3{,}000\):

\[
\Phi(3000)=88.991\text{ GF},
\qquad
K_{\rm FP8}(3000)=105.408\text{ MB}.
\]

Using the favorable 18.5 GB all-active-FP4 weight lower bound and 10 PF FP4 compute:

\[
t_C
=
\frac{128(88.991\text{ GF})}{10\text{ PF}}
=
1.139\text{ ms}.
\]

\[
t_H
=
\frac{18.5\text{ GB}+128(105.408\text{ MB})}{8.0\text{ TB/s}}
=
3.999\text{ ms}.
\]

NVFP4 dispatch divides the nominal activation payload by four:

\[
t_N
=
\frac{128(13.304/4\text{ MB})}{1.8\text{ TB/s}}
=
0.237\text{ ms}.
\]

HBM is the roof:

\[
\widehat T
=
\frac{0.309646(128)}{0.003999}
=
\boxed{9{,}911}.
\]

Measured: 10,108.4, so error is **−2.0%**.

That near-match should not be overinterpreted: 18.5 GB is the minimum physically possible active-weight traffic. The actual mixed-precision checkpoint is heavier.

## Ascend 910C, 50 ms row

At 4K with BF16 KV:

\[
K_{\rm BF16}(4096)=287.834\text{ MB}.
\]

\[
t_C
=
\frac{96(2)(94.468\text{ GF})}{1.504\text{ PF}}
=
12.060\text{ ms}.
\]

\[
t_H
=
\frac{37\text{ GB}+96(2)(287.834\text{ MB})}{3.2\text{ TB/s}}
=
28.833\text{ ms}.
\]

\[
t_N
=
\frac{96(2)(13.304\text{ MB})}{784\text{ GB/s}}
=
3.258\text{ ms}.
\]

\[
\widehat T
=
\frac{0.309646(96)(1.7)}{0.028833}
=
\boxed{1{,}753}.
\]

Measured: 1,943, so error is **−9.8%**.

Notably, the HBM time increases from about 20.2 ms without MTP to 28.8 ms with two KV scans, a 43% increase. That closely matches the paper’s measured approximately 44% MTP iteration-latency increase, although it does not prove the decomposition is unique. citeturn848796view4

## Ascend 910C, 15 ms row

Use the same physical configuration but \(b=8\):

\[
t_C=1.005\text{ ms},
\qquad
t_H
=
\frac{37+8(2)(0.287834)}{3.2}
=
13.002\text{ ms},
\qquad
t_N=0.272\text{ ms}.
\]

\[
\widehat T
=
\frac{0.309646(8)(1.7)}{0.013002}
=
\boxed{324}.
\]

Measured: 538, so error is:

\[
\boxed{-39.8\%}.
\]

This is the load-bearing failure. At batch eight, the constant shared residual and simple “37 GB once per iteration” traffic assumption do not describe the platform.

---

# 5. Errors, worst-platform score, and margin error

Let:

\[
e=\frac{\widehat T}{T}-1.
\]

The calculator’s cost is inversely proportional to throughput, and its contribution margin is \(M=1-C/R\). Therefore, if \(\widehat M\) is the margin calculated from predicted throughput:

\[
M_{\rm true}
=
1-(1-\widehat M)\frac{\widehat T}{T},
\]

so:

\[
\boxed{
\widehat M-M_{\rm true}
=
(1-\widehat M)e
}.
\]

The following percentage-point values assume the throughput error applies to the entire relevant serving cost. For a blended workload where decode is only fraction \(\omega_d\) of direct cost, multiply the values by \(\omega_d\). citeturn525695view0

| Held-out row | Predicted | Measured | Throughput error | Margin error at 80% | Margin error at 90% |
|---|---:|---:|---:|---:|---:|
| H20 Pro | 598 | 675 | −11.4% | −2.27 pp | −1.14 pp |
| H20 Base | 598 | 714 | −16.2% | −3.24 pp | −1.62 pp |
| GB200, optimistic FP4 bound | 9,911 | 10,108 | −2.0% | −0.39 pp | −0.20 pp |
| Ascend, 50 ms | 1,753 | 1,943 | −9.8% | −1.96 pp | −0.98 pp |
| Ascend, 15 ms | 324 | 538 | **−39.8%** | **−7.96 pp** | **−3.98 pp** |

Define a platform-level score as:

\[
E_j=\max_{o\in j}|e_{jo}|.
\]

Then:

- H20 platform: **16.2%**
- GB200 platform: **2.0%** under the favorable FP4 lower bound
- Ascend platform: **39.8%**
- **Worst platform: 39.8%**

At an 85% nominal margin, the worst-row downstream error is approximately **5.97 percentage points**.

The tempting result is “16.2% worst” after looking only at H20, GB200, and Ascend’s throughput-oriented 50 ms row. That is not the council-compliant score: it excludes Ascend’s 15 ms observation from a held-out platform after seeing it.

The separate 1,303 tokens/s “neutral Ascend” figure should not be scored using the optimized batch-96/MTP constants. Doing so gives 1,753 vs 1,303, or **+34.5%**, but the comparison is invalid until the neutral row’s batch, context, MTP, EP placement, and precision are specified.

---

# 6. Sensitivity to the assumed batches and MTP settings

The favorable result is not stable.

### H800 calibration batch

The H800 batch is undisclosed. Holding every other assumption fixed:

| Assumed H800 batch | Fitted shared \(\eta\) | Worst error over all held-out rows |
|---:|---:|---:|
| 80 | 35.22% | 31.5% |
| **96** | **30.96%** | **39.8%** |
| 128 | 25.64% | 50.1% |

All held-out predictions scale almost linearly with \(\eta\). Even the favorable batch-80 case remains above the 25% whole-platform gate.

### H800 production MTP

The central calculation assumes no H800 MTP. DeepSeek’s model report says one additional token can have 85–90% acceptance and produce approximately a 1.8× TPS gain, but that does not establish whether the 1,850 production disclosure used it. citeturn848796view2

If H800 instead had \(q=2,a=1.85\):

\[
\eta=21.97\%
\]

rather than 30.96%, and the Ascend 15 ms prediction falls to about 230 tokens/s, a **−57.3%** error.

### H20 MTP interpretation

Central assumption:

\[
q=3,\qquad a=1.85
\]

for one base plus two drafted positions.

If the target-equivalent work is instead \(q=2\):

- H20 Pro prediction: 897, error **+33.0%**
- H20 Base prediction: 897, error **+25.7%**

With \(q=3\), changing acceptance from 1.8 to 1.9 moves the Pro prediction only from 582 to 614. The large sensitivity is to the number of expensive target positions, not to the narrow acceptance range.

### GB200 precision and context

At average context 3K:

| Assumed active weight traffic | Prediction | Error |
|---:|---:|---:|
| 18.5 GB, all active path FP4 lower bound | 9,911 | −2.0% |
| 23 GB mixed-precision approximation | 8,689 | −14.0% |
| 37 GB strict 8-bit counterfactual | 6,280 | −37.9% |

With 18.5 GB weights, changing average context from 2K to 4K moves the prediction from 11,532 to 8,690, or from +14.1% to −14.0%.

Consequently, the GB200 row cannot be a clean “8-bit held-out platform.” It is a different precision treatment that must either be modeled layer by layer or excluded from an apples-to-apples 8-bit gate.

### Ascend KV precision

At batch 96:

- BF16 KV assumption: 1,753, error −9.8%
- FP8 KV assumption: 2,502, error +28.8%

At batch eight:

- BF16 KV: 324, error −39.8%
- FP8 KV: 343, error −36.3%

The low-batch failure survives either KV assumption.

---

# 7. Verdict against each precondition

### (a) Hold out entire platforms

The retrospective calculation does this only when **all** H20 and Ascend rows are scored. On that basis, the worst platform error is 39.8%, so the approximately 25% gate fails.

Selecting only the 50 ms Ascend row would be row selection, not a whole-platform holdout.

### (b) No per-platform fitted efficiency

The proposed equation has no per-platform \(\eta\): only one shared \(\eta\).

However, this condition is satisfied only if batch, MTP work, acceptance, precision mix, KV dtype, expert occupancy, topology fractions, and collective startup are fixed from independent configuration records or microbenchmarks before throughput is revealed. In the present dataset, several are unknown. Post-hoc choices among them would function as undeclared platform-specific fits.

### (c) Parameter count strictly below independent platform groups

For decode:

\[
p=1,\qquad n_{\rm train}=1,\qquad 1<1\text{ is false}.
\]

Adding the optional shared \(t_0\) would make \(p=2\), which is even less identifiable.

The only H800-only model satisfying this condition has \(p=0\). Setting \(\eta=1\) gives an ideal H800 prediction of approximately 5,975 tokens/s versus 1,850 measured, a +223% error. So the zero-parameter alternative is formally runnable but plainly fails.

### (d) Worst platform and margin error

Reported above:

- Worst platform throughput error: **39.8%**
- Corresponding absolute margin error:
  - **7.96 pp** at 80% nominal margin
  - **5.97 pp** at 85%
  - **3.98 pp** at 90%

### (e) Genuinely untouched platform

There is none among H20, GB200, and Ascend. Their outcomes have already informed:

- rejection of scalar MFU,
- selection of compute/HBM/fabric terms,
- choice of MTP handling,
- choice of precision treatment,
- and the sensitivity analysis.

Therefore:

\[
\boxed{\text{The preregistered held-out experiment is unrunnable on the current observations.}}
\]

---

# 8. Prefill

For a 4K prompt, the average attention history during prefill is approximately \(L/2\). A favorable compute-roof approximation is therefore:

\[
\Phi_P(4096)
=
74\text{ GF}
+
4{,}997{,}120(4096/2)
=
84.234\text{ GF/input token}.
\]

A full prefill roofline would also include FlashAttention I/O, prompt-token batch size, TP collectives, EPLB, and weight traffic. Unfortunately, the H800 4,026 row has batch and input length recorded as N/A, while the comparable Ascend rows use 16,384 total tokens and 4,096-token prompts. citeturn131213view0

Using the requested H800 fresh-prefill anchor anyway:

\[
\eta_P
=
\frac{4026(84.234\text{ GF})}{1.98\text{ PF}}
=
17.13\%.
\]

At the same prompt length, the FLOPs/token cancel, so predictions reduce to peak-compute ratios:

\[
\widehat T_{H20}
=
4026\frac{0.296}{1.98}
=
\boxed{602}.
\]

H20 measured input throughput is approximately \(16.5\text{k}/8=2{,}062.5\) per GPU, giving **−70.8%** error. citeturn459091view0

\[
\widehat T_{\rm Ascend}
=
4026\frac{1.504}{1.98}
=
\boxed{3{,}058}.
\]

Against Ascend:

- Default 5,655: **−45.9%**
- Perfect-EPLB 6,688: **−54.3%**

The prefill worst-platform error is therefore **70.8%**, equivalent to approximately **14.16 pp** of margin at 80% or **7.08 pp** at 90%, under the same whole-cost convention.

Using the more comparable H800 profile result of 7,839 at 16K total tokens and 4K prompts would predict 1,172 on H20 and 5,954 on Ascend. That still misses H20 by 43%. The prefill residual also does not transfer.

Fitting separate decode and prefill residuals would mean \(p=2\) residuals from one H800 platform group, violating the parameter-count precondition even more clearly.

---

# Recommendation

**Freeze the present per-platform anchor-fit calculator.** Keep its current language that anchored rows are interpolations rather than validated physics. The roofline can be added as an experimental diagnostic or uncertainty band, but not as the production replacement.

A valid future test needs:

1. The equations, precision treatment, MoE weight-occupancy rule, and all thresholds frozen before the final observation.
2. At least two independent training platform groups for one fitted residual, or at least three for separate decode and prefill residuals.
3. A genuinely new entire platform held out after model freeze.
4. Exact checkpoint byte counts, KV dtype, batch per chip, input/output lengths, MTP \(q\) and \(a\), TP/DP/EP placement, scale-out traffic, and collective latency fixed before throughput is inspected.
5. A primary gate of maximum absolute error over **every operating point on the held-out platform**, not mean error. At a 25% throughput gate, the corresponding conservative margin gates are 5 pp at an 80% nominal margin and 2.5 pp at 90%.

The roofline is directionally better than scalar MFU because it correctly changes bottlenecks across H20, GB200, and Ascend. But with the available metadata it is still an operating-point reconstruction, not a transferable throughput law.