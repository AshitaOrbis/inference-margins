# Where the input-side cost comes from — one reconstruction, in one place

**Provenance class: RECONSTRUCTION, executed.** Every figure below is computed from the deployed
engine at the public-evidence reference reading and is reproducible with the snippet at the end.
Written 2026-09-20 by leg `im-vet-six-repairs` in answer to the expert reading of 2026-09-19
(vetting report, finding E3): *"the dominant cost is not reconstructible in one place ... and the
reconstruction boundary is unstated."* It was right. This page is the boundary, stated.

**What it is not:** a measurement. One number in the chain — the fresh-prefill throughput — is a
single reconstruction from one provider's disclosure, transferred to every accelerator the page
prices. That is the page's largest unanchored step and it is named as such below and in the
[methods note](https://margins.ashitaorbis.com/research/methods-loao.html).

## 1. The reading this page reconstructs

| setting | value | where it comes from |
|---|---|---|
| model | Claude Opus 4.x, 2.5 T total / 300 B active, FP8 | page-adopted planning band (§5); the active figure is a working estimate |
| traffic | 15 : 1 input : output, 60 % of input served from cache | the page's declared Reference convention — a convention, not a measurement |
| fleet | the default's five member legs, renormalized over basis 75 | the two Trainium legs are withdrawn on evidence grounds (2026-09-20) |
| occupancy | 50 % paid-capacity utilization | a declared convention |
| serving stack | 1.0× (open-source-level) | a declared convention |
| algorithmic lead | 0 months | the public-evidence reference basis |
| cache-read work | 5 % of a fresh-prefill token | **analyst-set and unobserved** — the load-bearing assumption of this page |

## 2. The identity, and the three components

For one million output tokens with fifteen million input tokens alongside them:

```
C_bundle = 15 × (1 − cacheHit) × C_in_fresh      ← fresh prefill
         + 15 × cacheHit       × C_in_cacheread  ← cache reads
         + C_out                                 ← decode
C_blended = C_bundle ÷ 16
```

Executed at the reading above:

| component | $ / bundle | share of modeled direct cost | label |
|---|---:|---:|---|
| Fresh input — 6 M tokens at $2.44148 / M | **14.64887** | **67.40 %** | RECONSTRUCTION (one anchor, transferred) |
| Cache reads — 9 M tokens at $0.12207 / M | **1.09867** | **5.05 %** | SPECULATION (the 5 % factor is analyst-set) |
| Decode — 1 M tokens at $5.98735 / M | **5.98735** | **27.55 %** | MIXED CALIBRATION EVIDENCE — enumerated below; **not** fitted per leg |
| **All input-side** | **15.74754** | **72.45 %** | |
| **Bundle total** | **21.73489** | 100 % | |
| **$ / million blended tokens** | **1.35843** | | this is the page's `$1.35843` |

**The decode component's evidence is mixed, and the mix matters more than the average.** This row
said "fitted per leg" until the Astra review of 2026-09-20 caught that the claim is not true of
most of the fleet behind it. Per surviving leg, at the default reading's renormalized weights:

| leg | weight | what its coefficient actually is |
|---|---:|---|
| H100 | 10.7 % | INHERITED FIT (the H800-class fit, carried) |
| H200 | 14.7 % | FAMILY TRANSFER (in-family extrapolation off that fit, tier-(b)) |
| GB200 | 25.3 % | FITTED — but on an FP4 basis, used in the FP8 render as a declared conservative transfer |
| GB300 | 16.0 % | ANALYST-SET at a declared assumed operating point; no measured observation |
| TPU v7 | 33.3 % | ANALYST-SET platform-native bridge |

**Only 25.3 % of surviving fleet weight rests on a fit of its own, and even that one is
basis-transferred.** H200, GB300 and TPU v7 — 64.0 % of the weight — are a family transfer and two
analyst-set coefficients. A reader who takes "fitted" at face value would over-read this component
by a wide margin, which is exactly the class of defect finding E5 is about, arriving inside the
repair that was supposed to fix it.

A cache-read token costs exactly 5 % of a fresh input token here, because that is what the
assumption says; one fresh input token costs about 41 % of one output token, and there are many
more of them. **That is the whole reason the input side dominates** — not a finding that prefill is
intrinsically expensive per token.

## 3. The reconstruction boundary — the part that was unstated

The fresh-prefill unit cost rides one anchor: DeepSeek's 2025 production disclosure, reconstructed
onto H800 and then transferred to every other accelerator through a single shared coefficient
(`η_pre = 0.17581`, the frozen F7 identity fit). The disclosure gives an aggregate input rate of
**9,212.5 tok/s/GPU that INCLUDES cache hits**, and 56.3 % of those inputs were hits. Two different
fresh-equivalent rates follow, depending on what you assume cache work costs:

| boundary assumption | arithmetic | fresh-equivalent rate | difference |
|---|---|---:|---:|
| **cache work is free** (the adopted one) | 9,212.5 × (1 − 0.563) | **4,025.86** tok/s/GPU | — |
| cache work costs 5 % of fresh prefill | 9,212.5 × [0.437 + 0.563 × 0.05] | 4,285.19 tok/s/GPU | **+6.4 %** |

**The page adopts the first and has not said so.** It is the conservative one — it attributes all
of the measured GPU time to the fresh tokens, so the fresh rate comes out lower and the modeled
cost comes out higher. The second is not wrong; it is a different boundary, and a reader
reconstructing the chain from the disclosure alone would have no way to know which was taken. Now
they do.

Note what this is **not**: it is not the retired error of treating all 9,212.5 tokens as fresh
prefill. The main report has said since methodology v2 that the aggregate figure is *"not used
directly"*, and it is not.

## 4. Two sensitivities that are usually collapsed into one

The methods box calls the 5 % cache factor "load-bearing" and prints it next to the input-side
share. Those are two different exposures and they are not the same size.

| what moves | range | margin | swing |
|---|---|---:|---:|
| **cache-read factor** | 0 % of fresh prefill | 60.53 % | +2.10 pp |
| | **5 % (adopted)** | **58.43 %** | — |
| | 15 % | 54.23 % | −4.20 pp |
| **all input-side unit cost** | −50 % | 73.49 % | +15.06 pp |
| | **as modeled** | **58.43 %** | — |
| | +50 % | 43.37 % | −15.06 pp |

**The dominant exposure is fresh-prefill calibration, not the cache-read factor.** The cache factor
is the more visible assumption because it is a round number a reader can argue with; the transfer
of one provider's reconstructed prefill rate to nine other accelerators is the larger one, and it
has no per-platform validation behind it at all.

## 5. Reproduce this page

```bash
node -e '
const E = require("./site/engine.js");
const opus = E.MODELS.find(m => m.id === "opus");
const med  = E.PERSPECTIVES.find(p => p.id === "median");
const s = E.pinReferenceLevers(E.applyPresetSettings(opus, med, { mode: "native" }));
s.trendMonths = 0;
const w  = E.workload(s, undefined, E.scenarioContext(s));
const io = s.ioRatio, ch = s.cacheHit / 100;
const fresh = io * (1 - ch) * w.cIn, cache = io * ch * w.cCache, dec = w.cOut;
const bundle = fresh + cache + dec;
console.log({ fresh, cache, dec, bundle, perBlended: bundle / (io + 1), costMix: w.costMix,
  inputShare: (fresh + cache) / bundle });
'
```

It prints the four component figures in §2 and the 72.45 % input share, and `perBlended` equals
`costMix` exactly — the identity is the engine's, not a restatement of it.
