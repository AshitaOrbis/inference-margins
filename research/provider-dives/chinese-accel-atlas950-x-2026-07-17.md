# Chinese accelerators — WAIC 2026 SuperPoD thread (X capture, 2026-07-17)

> Source-capture note for the inference-margins Chinese-accelerator work. Pairs with
> [`chinese-accel-gptpro.md`](chinese-accel-gptpro.md), [`chinese-accel-ascend-websweep.md`](chinese-accel-ascend-websweep.md),
> and [`chinese-accel-h800-h20-websweep.md`](chinese-accel-h800-h20-websweep.md).
> **Provenance:** primary tweet via fxtwitter API (root + quoted tweet only); full thread,
> continuations, and reply tree via Grok live-X read (2026-07-17/18). Captured because
> fxtwitter drops replies/quotes/thread — see `../methods-reading-x-links.md` *(private working note, not published)*.
> **Nothing here is verified against a datasheet.** These are WAIC-floor claims relayed by
> two accounts (one show-floor reporter, one commentator); treat as leads, not anchors.

## The link

- **Root:** `@teortaxesTex` · <https://x.com/teortaxesTex/status/2078249359968244101> · 2026-07-17 22:43 GMT
  (quote-tweeting `@tphuang`, 5 replies, 63 likes, 6.6k views at capture)
- **Quoted thread:** `@tphuang` · <https://x.com/tphuang/status/2078214742607331693> · 7 tweets ("More to follow")

`@tphuang` is a WAIC-2026 show-floor reporter cataloguing Chinese "SuperPoD / SuperNode"
systems; `@teortaxesTex` (DeepSeek-watcher) adds the scaling/economics framing. The
substance the owner flagged ("good discussion of Chinese accelerators") is mostly in the
**quoted @tphuang thread + teortaxes' own continuation replies**, none of which fxtwitter returns.

## @tphuang thread — systems shown at WAIC 2026 (verbatim-tight)

| # | System (vendor) | Claimed specs |
|---|---|---|
| 1 | **Huawei Atlas-950 SuperPoD** | First public sales unveil. Initial sales version **1024 NPUs, 1 EFLOPS, 256 TB memory, 3 μs RTT**. Smaller than last year's presented version. Liquid-cooled. |
| 2 | **Huawei Atlas-850E** | Wind-cooled, self-designed **VCE** heat dissipation (vs liquid on 950). Expandable **8 → 96 cards** for commercial use. Notes **CM384 SuperNodes >750 sales** (telecom, finance, education, medical, transport, mfg). |
| 3 | **Sugon-8000 SuperCluster** | Zhengzhou SCNet DC. **INT8 → FP64**. Science/training/inference/industrial-sim. **Hygon + other domestic chips**, **>100k** in cluster. |
| 4 | **Alibaba Zhenwu-890 / Panjiu AL128 SuperNode** | **144 GB memory, 800 GB/s interconnect, FP32 → FP4**. **128 chips/cabinet**, self-designed **ALink** → **Pb/s** bandwidth. |
| 5 | **Biren** | **1024-card** scale-up cluster. New **BR2xx** GPU (**FP8/FP4**) + **BLink2.0** SuperNode interconnect, **NPO optical**. Prior-gen **dOCS** SuperNode already in production at **2048 cards**; this is an upgrade. |
| 6 | **MetaX 曦景 S600** | **64-card** GPU high-speed interconnect/cabinet, expandable to **10k+** cluster. Deployed across industries, fully domestic supply chain. |
| 7 | Thesis | "Fully post-Nvidia world for China's AI industry" — latest LLMs shrink the software/kernel-stack moat, easing domestic adoption for both training and inference. |

## @teortaxesTex — scaling & economics framing

Main + his own continuation replies (the interesting part; all under the same conversation):

- **Root:** "All serious Chinese hardware builders converge to 'superpods/supernodes' — the value of large scale-up domains is well internalized. **A single 950 SuperPoD cabinet is not Blackwell class. The point is, you can gang up 128 of them**."
- **Continuation:** "…it's actually really good hardware. Eats a lot of power but it's well balanced (and really, who cares? This is CHYNA, they have OVERCAPACITY)."
- **Full-scale unit:** "estimate of what you can do with a single SuperPoD (**full scale, ie 8192 NPUs**): 2–3 months to a roughly K3 / 5.6-Sol-tier model. They'll be routine. Economically viable inference/RL is basically unbounded for reasonable architectures. **3T, 10T, 50T… forget about it**."
- **Training MFU:** ">50% training throughput is Huawei's own claim; they claimed it for 384 too and in reality a MoE like V4 gets **~30%**. ByteDance has a paper getting **~40%** on a **2.4T MoE**. So **~35%** is doable." Open question he raises: how far their **FP4 training** goes.
- **Production / cost (reply to @NunoSempere's "dumbed-down takeaway?"):** "Best estimate **≈400K of these NPUs by EoY** (so **<400 pods**; many product SKUs). Maybe **30–50K already delivered to DS and such**. **Per chip ~H100–H200**; cluster-scale training throughput **comparable to Blackwell at a 3–4× watt penalty**. **10T is ≈easy**."

## Replies to the root (Grok-only; fxtwitter shows none)

- **@degenpark_eth** — "the 950s still need custom nvlink extensions to hit full 128-cabinet scale. That plumbing is where most builders quietly lose weeks." *(NVIDIA-style terminology, uncorroborated in tphuang's thread; interconnect-integration-is-the-schedule-risk point is the useful signal.)*
- **@chso_z** — "我爱这些节点，真他妈的美" (enthusiast).
- **@MacVirgilim9t**, **@LettieRideqhj** — low-content / ad-account style, skip.

## Caveats & numbers that DON'T reconcile

- **"128 of them" vs "8192 NPUs" do not divide cleanly.** teortaxes says gang up "128" cabinets, and separately calls a full-scale SuperPoD "8192 NPUs." 8192 / 1024 (initial-version NPU count) = **8**, not 128; 128 × 1024 = 131,072. Grok's capture asserted "8192 = 128 × 1024," which is **arithmetically wrong** — flagged, not propagated. The likely reading: "1024 NPUs" is a cut-down *initial sales* unit, "8192 NPUs" is the *full* SuperPoD (matches Huawei's publicly announced Atlas-950 SuperPoD figure), and "128" refers to a SuperCluster-of-SuperPoDs count or a different building block. **Do not use any of these three figures as if they compose.**
- The **256 TB memory / 1 EFLOPS / 3 μs RTT** figures are pod-aggregate WAIC-floor claims with no per-NPU HBM capacity/bandwidth breakdown. `@liminalsunset_` explicitly asks in-thread whether it's still HBM — unanswered.
- No Cambricon specs in this discussion. FP4 support is *claimed* for Alibaba (FP32→FP4), Biren (FP8/4), Atlas-950 (implied via 950-series) but none benchmarked here.
- Media = show-floor cabinet/slide photos (URLs preserved below); no OCR performed, so any on-slide numbers beyond the tweet copy are not captured.

## Relevance to the calculator

- **Confirms the Ascend-950-series direction** already in `chinese-accel-gptpro.md` (native FP8/FP4, scale-up-domain strategy) with fresh WAIC framing — but adds **no datasheet-grade anchor** (no per-NPU FLOPS/HBM/price). Keep the calculator's Ascend entry on the CloudMatrix-Infer + GPT-Pro anchors; this is *context*, not a new anchor.
- Useful **forward-looking leads** to chase for future dives, if wanted: Atlas-950 full SuperPoD (8192 NPU) per-NPU specs; Biren BR2xx FP8/FP4 throughput; Alibaba Panjiu AL128 (144 GB / 800 GB/s / FP4) as a non-Huawei domestic inference part. All would need a primary datasheet before touching a preset.
- teortaxes' **"per chip ~H100–H200, cluster comparable to Blackwell at 3–4× watts"** is a plausibility-check quote for the "Ascend ≈ 60% of H100" discount already in the sweep — consistent order of magnitude, not a measurement.

## Media URLs (unverified, WAIC floor photos)

- teortaxes root: `HNdrs0gWQAAxd0X.jpg`, `HNdsHkyXAAAIo5i.png` · continuation `HNdw9YHWMAAYHAx.jpg`
- tphuang 1/7 (Atlas-950): `HNdHk3vXoAALLjb`, `HNdHm5TWAAESzr0`, `HNdHm5TXoAET4R2`, `HNdHm53XsAEAz2e`
- tphuang 2/7 (850E): `HNdJxiEWYAAwKo8`, `HNdJxh_XkAABy23`, `HNdJzAkWoAAhUD-`
- tphuang 3/7 (Sugon): `HNdKYBYXIAAGcjr`, `HNdKYBZWkAE4Y9m`, `HNdKYBcW4AA_bYp`, `HNdKYBeWcAAeULd`
- tphuang 4/7 (Alibaba): `HNdK6l4WgAAmJ4e` · 5/7 (Biren): `HNdLt5RWwAAkDa1` · 6/7 (MetaX): `HNdMYZAXsAAdEOa`

Base: `https://pbs.twimg.com/media/<id>.jpg?name=orig`
