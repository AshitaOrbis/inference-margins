I'll search X extensively across all three topics in parallel, then pull threads for the strongest hits.
Identified match: **ncode** (not Numina) by **@_xjdr** — pulling his GB300 posts and Claude tokenomics threads.# X/Twitter research report — 2026-07-09

---

## 1. GLM 5.2 on GB300 / “Numina Code” person

### Identity match

You almost certainly mean **ncode** (Noumena Code), not “Numina Code.”

| Field | Finding |
|---|---|
| **Handle** | [@_xjdr](https://x.com/_xjdr) (display name: **xjdr**) |
| **Platform** | **Noumena** — `https://code.noumena.com/` |
| **Product / CLI** | **ncode** (“noumena code”) — coding agent/harness |
| **Hardware partner** | [@PrimeIntellect](https://x.com/PrimeIntellect) GB300 NVL72 racks |

I did **not** find a well-known researcher product literally named “Numina Code” optimizing GLM 5.2 on GB300. Project Numina is math/Lean; this person’s stack is **ncode + noumena**.

---

### Finding 1.1 — Free GLM 5.2 week + final throughput stats

| Field | Value |
|---|---|
| **URL** | https://x.com/_xjdr/status/2071835604095300079 |
| **Author** | @_xjdr |
| **Date** | 2026-06-30 |
| **Verbatim quote** | `final GLM 5.2 served stats: ~12000 unique api keys served ~300B tokens total 232 tok/s/gpu output average 431 tok/s/gpu output max sustained 2.1 sec TTFT overage (1M ctx) 61 sec p95 TTFT (1M ctx) 81k tok average input size 41% cache hit rate 0 chat logs kept (dont be evil)` |
| **Numbers claimed** | **~12,000** API keys; **~300B** tokens total; **232 tok/s/gpu** output average; **431 tok/s/gpu** max sustained; **2.1 s** avg TTFT (1M ctx); **61 s** p95 TTFT; **81k** avg input tokens; **41%** cache hit rate |

Related end-of-promo post:

| Field | Value |
|---|---|
| **URL** | https://x.com/_xjdr/status/2071677153285210283 |
| **Author** | @_xjdr |
| **Date** | 2026-06-29 |
| **Verbatim quote** | `Today marks the end of the free GLM 5.2 with ncode. i hope y'all enjoyed the tokens and found some of our tools useful.` |
| **Numbers claimed** | (none beyond “free GLM 5.2 with ncode”) |

---

### Finding 1.2 — Hardware: GB300 NVL72, 60× B300

| Field | Value |
|---|---|
| **URL** | https://x.com/_xjdr/status/2067742918455279934 |
| **Author** | @_xjdr |
| **Date** | 2026-06-18 |
| **Verbatim quote** | `Special shout out to our hardware provider @PrimeIntellect . this model is running on gb300NVL72s and the have been absolutely amazing. could not recommend getting your large scale hardware from them highly enough` |
| **Numbers claimed** | Running on **gb300NVL72s** (Prime Intellect) |

Thread clarification on the stats post:

| Field | Value |
|---|---|
| **URL** | https://x.com/_xjdr/status/2071846027917943274 |
| **Author** | @_xjdr |
| **Date** | 2026-06-30 |
| **Verbatim quote** | `yes, 15 trays specifically or 60xB300s` |
| **Numbers claimed** | **15 trays** / **60× B300s** (reply to “this was on nvl72?”) |

| Field | Value |
|---|---|
| **URL** | https://x.com/_xjdr/status/2072059152873210101 |
| **Author** | @_xjdr |
| **Date** | 2026-06-30 |
| **Verbatim quote** | `no mtp and no eagle just optimized inference and disagg` |
| **Numbers claimed** | **No MTP, no Eagle** — optimized inference + disaggregation only |

| Field | Value |
|---|---|
| **URL** | https://x.com/_xjdr/status/2072058942025601533 |
| **Author** | @_xjdr |
| **Date** | 2026-06-30 |
| **Verbatim quote** | `this was our in house, nmoe based serving stack (mostly rust)` |
| **Numbers claimed** | In-house **nmoe** stack, mostly **Rust** |

---

### Finding 1.3 — Precision (bf16 / FP8 / NVFP4)

| Field | Value |
|---|---|
| **URL** | https://x.com/_xjdr/status/2070947967574663249 |
| **Author** | @_xjdr |
| **Date** | 2026-06-27 |
| **Verbatim quote** | `we've been running GLM 5.2 in bf16 and in fp8 (experts and kvcache only, attention is always bf16) and have recorded virtually 0 measurable quality difference in our A/B tests and audits (very surprisingly) NVFP4 has shown a slight performance regression but could probably be fixed with proper L/DoRA and might also totally be worth it given your hardware and serving constraints.` |
| **Numbers claimed** | **bf16** full; **fp8** for experts + KV cache only; attention always **bf16**; **~0** measurable quality delta bf16 vs that fp8; **NVFP4** slight regression (not quantified further by him) |

---

### Finding 1.4 — Product name & onboarding (ncode / noumena)

| Field | Value |
|---|---|
| **URL** | https://x.com/_xjdr/status/2067741647941832818 |
| **Author** | @_xjdr |
| **Date** | 2026-06-18 |
| **Verbatim quote** | `Today marks the beginning of our launch calendar and to celebrate i am making ncode and our flagship kimi k2.7 model free to use for the next week ... 1) sign up for a noumena account at https://code.noumena.com/ 2) go to ... and clone and build noumena code (ncode) 3) login to the platform with \`ncode auth login\` ... 4) enjoy blazing fast tokens on the noumena platform with ncode` |
| **Numbers claimed** | Free for **next week** (or until traffic knocks them out) |

| Field | Value |
|---|---|
| **URL** | https://x.com/_xjdr/status/2069038936362803544 |
| **Author** | @_xjdr |
| **Date** | 2026-06-22 |
| **Verbatim quote** | `What all is involved with onboarding a new model to noumena and ncode? I added GLM support over the weekend ... Luckily GLM5.2 is close enough to DeepSeek ... Hopefully you found that interesting and you continue to use and enjoy GLM 5.2 on noumena with ncode` |
| **Numbers claimed** | GLM onboarded “over the weekend” (no tok/s here) |

---

### Finding 1.5 — GB300 vs earlier Blackwell (not a full tok/s bake-off)

| Field | Value |
|---|---|
| **URL** | https://x.com/_xjdr/status/2022517795733541146 |
| **Author** | @_xjdr |
| **Date** | 2026-02-14 |
| **Verbatim quote** | `i dont have gb200s anymore, i was comparing blackwell to grace blackwell here. as for the GB300 specifically, sm103 has some nice scheduling bits and the extra HBM and nvlink speed is nice` |
| **Numbers claimed** | No numeric tok/s vs GB200/H100 in this post; qualitative **extra HBM** + **NVLink** on GB300 |

| Field | Value |
|---|---|
| **URL** | https://x.com/_xjdr/status/2047587676602425625 |
| **Author** | @_xjdr |
| **Date** | 2026-04-24 |
| **Verbatim quote** | `finally got v4 up on some GB300 nodes. took a min to do correctly. luckily it was pretty similar to the architecture i was already using (mHC, mxfp4 experts, NSA ish, etc)` |
| **Numbers claimed** | (DeepSeek) V4 on GB300 nodes; no tok/s |

| Field | Value |
|---|---|
| **URL** | https://x.com/_xjdr/status/2069917609278218601 |
| **Author** | @_xjdr |
| **Date** | 2026-06-24 |
| **Verbatim quote** | `I have not rebooted my racks in months (well past 66 days). I did however have this problem with my first set of B200 racks` |
| **Numbers claimed** | **>66 days** uptime; prior **B200** racks |

---

### Cost-per-million: what he published vs what others inferred

**Not found from @_xjdr:** an explicit self-authored $/M tokens cost for GLM 5.2 on GB300.

A **third-party reply** on his stats thread (not confirmed by him in the results I retrieved):

| Field | Value |
|---|---|
| **URL** | https://x.com/paxaral/status/2071995188302557585 |
| **Author** | @paxaral |
| **Date** | 2026-06-30 |
| **Verbatim quote** | `Assuming $6 per gpu, gpt 5.5 seems to think this implies about a $0.35 mTok in / $1.50 out cost-to-serve` |
| **Numbers claimed** | Assumed **$6/GPU**; inferred **$0.35 / MTok in**, **$1.50 / MTok out** |

**Also not found from him:** a published head-to-head GLM 5.2 tok/s table of **GB300 vs GB200 vs H100/H200** with batch size and precision on the same workload. Closest are the qualitative GB300 notes above and the absolute **232 / 431 tok/s/gpu** numbers on **60× B300 / NVL72**.

---

### Nearby but different people (for disambiguation)

| Who | Why not the match |
|---|---|
| **@thejackobrien** / Subconscious | GLM 5.2 “3.5× faster / ½ compute” marketing; **no GB300 rack numbers** found |
| **@m_sirovatka** | Cited as self-hosting GLM-5.2 on NVL72 GB300; **HR at Prime Intellect**, not the ncode product author |
| **@mgoin_** (vLLM) | GB300 NVL72 for **DSpark training** on GLM 5.2, not “Numina/ncode” product |

---

## 2. Claude subscription tokenomics (Pro / Max 5× / Max 20×)

Anthropic plans commonly discussed: **Pro $20**, **Max 5× $100**, **Max 20× $200**, with **5-hour** session windows and **weekly** caps. Below are practitioner / investigation posts. Numbers are **quoted as published** (API-list equivalent, not Anthropic COGS).

---

### Finding 2.1 — Most cited “math on the $200 plan” (weekly → monthly API equiv)

| Field | Value |
|---|---|
| **URL** | https://x.com/melvynx/status/2012326484300677454 |
| **Author** | @melvynx |
| **Date** | 2026-01-17 |
| **Verbatim quote** | `just did the math on Claude Code $200 plan and i'm shocked spent ~$50 = 6% weekly usage that means i can burn through ~$800 EACH WEEK → $3,200/month if you were on API pricing → $200/month with the Max plan the $200 plan literally saves you $3k/month if you actually use it hard` |
| **Numbers claimed** | **~$50** ≈ **6%** of weekly usage ⇒ **~$800/week** full weekly ⇒ **~$3,200/month** API-equivalent vs **$200/mo** Max |

---

### Finding 2.2 — Multi-month ccusage (strong longitudinal claim)

| Field | Value |
|---|---|
| **URL** | https://x.com/olofj/status/2037703420724019285 |
| **Author** | @olofj |
| **Date** | 2026-03-28 |
| **Verbatim quote** | `Seems like I've been getting my money's worth out of Claude Max 20x so far. 2.5 months into it, 14+B tokens. Per-token charges would have been $7k5 according to ccusage.` |
| **Numbers claimed** | **Max 20×**; **2.5 months**; **14+B tokens**; **$7.5k** API-equivalent (ccusage) |

---

### Finding 2.3 — $100 Max plan monthly range

| Field | Value |
|---|---|
| **URL** | https://x.com/xtophr/status/1970836340234461548 |
| **Author** | @xtophr |
| **Date** | 2025-09-24 |
| **Verbatim quote** | `$100 Claude Max Plan. generally get $1500-$2000/mo token equivalent when I run ccusage. git worktrees and Sonnet subagents use a lot of tokens.` |
| **Numbers claimed** | **$100** Max; **$1,500–$2,000/mo** API-equivalent |

---

### Finding 2.4 — Extreme short-window usage (viral-scale)

| Field | Value |
|---|---|
| **URL** | https://x.com/bridgemindai/status/2060693626712141885 |
| **Author** | @bridgemindai |
| **Date** | 2026-05-30 |
| **Verbatim quote** | `In the last 2 days I've run over 1.6 BILLION tokens through Claude Code. 1,628,985,347 to be exact. ... The wild part: that's ~$1,500 in API-equivalent usage. I ran it on Max plans for a flat fee.` |
| **Numbers claimed** | **1,628,985,347** tokens in **2 days**; **~$1,500** API-equivalent on Max flat fee |

| Field | Value |
|---|---|
| **URL** | https://x.com/Earth_1729/status/2073245916497428689 |
| **Author** | @Earth_1729 |
| **Date** | 2026-07-04 |
| **Verbatim quote** | `Someone got $8,030 in raw API-equivalent spend over the past 4 weeks on claude max 20x plan which costs $200.` |
| **Numbers claimed** | **$8,030** API-equivalent / **4 weeks** on **Max 20× $200** |

| Field | Value |
|---|---|
| **URL** | https://x.com/_davejh/status/2073349348524425683 |
| **Author** | @_davejh |
| **Date** | 2026-07-04 |
| **Verbatim quote** | `LOLLLLL, Claude Max (5x) plan, one session on a simple dumbass app with a few /compacts = $4,243 at token rate. $12.40 worth of usage out of a $100 plan. 34,118% subsidy.` |
| **Numbers claimed** | **Max 5× $100**; one session **$4,243** at token rate; **$12.40** of plan; **34,118%** subsidy (as stated) |

| Field | Value |
|---|---|
| **URL** | https://x.com/btcbigd/status/2075147528358822331 |
| **Author** | @btcbigd |
| **Date** | 2026-07-09 |
| **Verbatim quote** | `过去 60 天（自 5/11）跑了 86 亿 tokens。按 API 计价约 $8,531（ccusage），但我实付只是 Max 订阅 $200/月——等于用订阅撬了约 21× 的用量。` |
| **Numbers claimed** | **60 days**; **8.6B tokens**; **~$8,531** API (ccusage); paid **Max $200/mo** ⇒ **~21×** leverage |

---

### Finding 2.5 — Limit structure (5-hour + weekly), official + user math

| Field | Value |
|---|---|
| **URL** | https://x.com/claudeai/status/2052060693269008586 |
| **Author** | @claudeai |
| **Date** | 2026-05-06 |
| **Verbatim quote** | `Effective today, we are: 1) Doubling Claude Code’s 5-hour rate limits for Pro, Max, and Team plans; 2) Removing the peak hours limit reduction on Claude Code for Pro and Max plans; and 3) Substantially raising our API rate limits for Opus models.` |
| **Numbers claimed** | **2×** Claude Code **5-hour** limits (Pro/Max/Team); peak-hour reduction **removed** |

| Field | Value |
|---|---|
| **URL** | https://x.com/BTA_labs/status/2073422107380264966 |
| **Author** | @BTA_labs |
| **Date** | 2026-07-04 |
| **Verbatim quote** | `Just hit 100% on my current session again after maybe 20 minutes of serious coding. Look at the weekly limit: 6% used. That means one solid session burned through 12% of the weekly limit of Fable 5. ... With medium thinking effort, you might squeeze out ~35 minutes of productive coding. Switch to high effort and it drops to roughly 12-15 minutes. Go max / ultracode? Those 5-hour limits disappear in under 8 minutes.` |
| **Numbers claimed** | Session **100%** in ~**20 min**; weekly **6%** used ⇒ one session ≈ **12%** weekly (Fable 5); medium ~**35 min**; high **12–15 min**; max/ultracode **&lt;8 min** of the 5-hour window |

| Field | Value |
|---|---|
| **URL** | https://x.com/tkinfinance/status/2075292575737520577 |
| **Author** | @tkinfinance |
| **Date** | 2026-07-09 |
| **Verbatim quote** | `So with the Claude Pro plan I only have 9, 5 hour sessions This one sprint used 11% of my weekly limit Thats less than 2 days per week I can push it` |
| **Numbers claimed** | Pro: **9** five-hour sessions; one sprint **11%** weekly ⇒ **&lt;2 days/week** at that intensity |

---

### Finding 2.6 — SemiAnalysis internal token economics (lab/org, not consumer plan alone)

| Field | Value |
|---|---|
| **URL** | https://x.com/SemiAnalysis_/status/2070915303500849289 |
| **Author** | @SemiAnalysis_ |
| **Date** | 2026-06-27 |
| **Verbatim quote** | `The blended Opus 4.7 cost we observe is about $0.99 per million against $5/$25 sticker, mostly because agentic workloads run 300:1 input-to-output ratios and cache hit rates above 90% pull the effective price down.` |
| **Numbers claimed** | Blended **~$0.99 / million** vs sticker **$5/$25**; **300:1** I/O; cache **&gt;90%** |

| Field | Value |
|---|---|
| **URL** | https://x.com/SemiAnalysis_/status/2074908975196221654 |
| **Author** | @SemiAnalysis_ |
| **Date** | 2026-07-08 |
| **Verbatim quote** | `We analyzed 1.5M+ of our Claude Code requests (mostly Opus). ~95% of all tokens spent by us are cache hits, which cut our token bill by ~84%.` |
| **Numbers claimed** | **1.5M+** requests; **~95%** cache hits; **~84%** bill cut |

---

### Finding 2.7 — Peter Steinberger

**Explicit result:** In this search pass I **did not find** a comprehensive Steinberger (@steipete) investigation post that quantifies Max $20/$100/$200 → API-dollar extract with ccusage-style tables. His recent posts are about OpenClaw, Codex, hardware, etc., not a tokenomics deep-dive. If such a post exists older/off-X (blog), it was **not surfaced** in the X results used here.

---

### Single most comprehensive investigation (URL)

On **written depth + longitudinal sample**, the best single investigation found (off-X, widely referenced) is:

**https://www.ksred.com/claude-code-pricing-guide-which-plan-actually-saves-you-money/**  
(author site; claims tracking **10 billion tokens / 8 months** → **~$15,000** API vs **~$800** paid on Max)

On **X alone**, the single most reusable “primary calculation” post is still:

**https://x.com/melvynx/status/2012326484300677454** — **$50 ≈ 6% weekly ⇒ ~$800/week ⇒ ~$3,200/month** on **$200 Max**.

**Effective $/M paid vs list:** user posts typically report **API list equivalent** (often Opus $5/$25 sticker, cache-adjusted) vs **flat subscription**. True all-in $/M paid = `$subscription / tokens_used` and varies wildly; examples above imply heavy Max 20× users often sitting at **well under list**, sometimes **tens of dollars of API value per $1 of subscription** when fully maxing weekly caps.

---

## 3. GB300 (Blackwell Ultra) real-world MoE inference (practitioners / engines)

Focus: tokens/sec and vs GB200/H100/H200 from practitioners and engine maintainers — not pure NVIDIA keynote marketing (some posts still relay SemiAnalysis InferenceX, which is industry-standard third-party bench).

---

### Finding 3.1 — SemiAnalysis InferenceX: GB300 NVL72 vs H100 (multipliers)

| Field | Value |
|---|---|
| **URL** | https://x.com/firstadopter/status/2023489524735574481 |
| **Author** | @firstadopter (quoting SemiAnalysis InferenceX v2) |
| **Date** | 2026-02-16 |
| **Verbatim quote** | `"Nvidia’s GB300 NVL72 doesn’t disappoint. It achieves up to 100x on FP8 vs FP4 compared to even a strong H100 disagg+wideEP+MTP baseline and 65x on FP8 vs FP8."` … `"Nvidia absolutely frame mogs with the B200, B300 and ASU frat leader, rack scale GB200/GB300 NVL72 across both SGLang and TRTLLM."` |
| **Numbers claimed** | **Up to 100×** (H100 baseline FP8 vs GB300 FP4); **65×** (H100 FP8 vs GB300 FP8); engines **SGLang** + **TRTLLM** |

Source report link in SemiAnalysis post:  
https://x.com/SemiAnalysis_/status/2023447723085885576  
(`InferenceX v2: NVIDIA Blackwell Vs AMD vs Hopper ... GB300 NVL72, MI355X, B200, H100 ... SGLang, vLLM, TRTLLM`)

| Field | Value |
|---|---|
| **URL** | https://x.com/SemiAnalysis_/status/2029693660686680529 |
| **Author** | @SemiAnalysis_ |
| **Date** | 2026-03-05 |
| **Verbatim quote** | `For frontier MoE inferencing, GB300 NVL72 FP4 framemogs h100 even when both blackwell ultra & hopper have all the optimizations including disagg & wide expert parallelism enabled. We see similar trends when comparing GB300 FP8 to H100 FP8. For pretraining, blackwell & rack scale only offers 2-4x performance uplifts while inference is where blackwell shines.` |
| **Numbers claimed** | Pretrain uplift **2–4×**; inference much larger (qualitative “framemogs”; no single tok/s in this post) |

| Field | Value |
|---|---|
| **URL** | https://x.com/SemiAnalysis_/status/2070915304629129460 |
| **Author** | @SemiAnalysis_ |
| **Date** | 2026-06-27 |
| **Verbatim quote** | `On the same B300 running DeepSeek R1, baseline FP8 sits near 1,000 tokens/sec/GPU, adding wideEP plus disagg gets you to roughly 8,000, and layering MTP on top pushes it to about 14,000, a 14x gain from software alone. Factor in hardware too and the most optimized GB300 NVL72 hits about 17x the best H100 config in FP8, 32x in FP4.` |
| **Numbers claimed** | **B300 / DeepSeek R1:** ~**1,000** → ~**8,000** → ~**14,000** tok/s/GPU (FP8 → +wideEP+disagg → +MTP); **~14×** software; optimized **GB300 NVL72** ~**17×** best H100 FP8, **~32×** in FP4 |

---

### Finding 3.2 — LMSYS / SGLang maintainers (DeepSeek-V4 on GB300)

| Field | Value |
|---|---|
| **URL** | https://x.com/lmsysorg/status/2065513735213773021 |
| **Author** | @lmsysorg |
| **Date** | 2026-06-12 |
| **Verbatim quote** | `New record on GB300 NVL72: SGLang exceeds 12K tok/s per GPU on DeepSeek V4 Pro 1.6T (FP4, 8K/1K), orchestrated with NVIDIA Dynamo (SGLang) and MTP.` |
| **Numbers claimed** | **&gt;12K tok/s per GPU**; model **DeepSeek V4 Pro 1.6T**; **FP4**; **8K/1K**; **GB300 NVL72**; **MTP** + Dynamo |

| Field | Value |
|---|---|
| **URL** | https://x.com/lmsysorg/status/2069454066376487031 |
| **Author** | @lmsysorg |
| **Date** | 2026-06-23 |
| **Verbatim quote** | `New blog: Serving DeepSeek-V4 on GB300 with SGLang: 5x Higher Throughput at the Same Interactivity Since Day-0 ... 5X throughput on GB300 disaggregated: ~2,200 → ~11,200 tok/s/GPU at ~50 tok/s/user ... 2.6X more throughput at 80 tok/s/user with MTP ... 2.91X on Blackwell Ultra aggregated at 30 tok/s/user` |
| **Numbers claimed** | Disagg: **~2,200 → ~11,200 tok/s/GPU** at **~50 tok/s/user** (**5×**); **2.6×** at **80 tok/s/user** with MTP; aggregated **2.91×** at **30 tok/s/user** |

| Field | Value |
|---|---|
| **URL** | https://x.com/lmsysorg/status/2049769087610572823 |
| **Author** | @lmsysorg (quoting SemiAnalysis) |
| **Date** | 2026-04-30 |
| **Verbatim quote** | `By leveraging @NVIDIAAI Dynamo + SGLang disaggregation on the GB300 NVL72 (powered by @CoreWeave), we're seeing a massive 6.5x performance leap over B200 for DeepSeek-v4 Pro 1.6T` |
| **Numbers claimed** | **6.5×** vs **B200** (DeepSeek-v4 Pro 1.6T; Dynamo + SGLang disagg; CoreWeave GB300 NVL72) |

Quoted SemiAnalysis wording (same thread parent):  
`GB300 NVL72 Rack Scale Dynamo SGLang disaggregation has up to 6.5x better performance than B200 on DeepSeekv4 Pro 1.6T`

---

### Finding 3.3 — vLLM maintainer on GB300 (GLM 5.2 training/serving hybrid, not pure InferenceX)

| Field | Value |
|---|---|
| **URL** | https://x.com/mgoin_/status/2072785822231728363 |
| **Author** | @mgoin_ (vLLM maintainer) |
| **Date** | 2026-07-02 |
| **Verbatim quote** | `DSpark update: Turns out with a little Speculators+Mooncake, I'm able to scale training on GB300 NVL72! 9 vLLM nodes serve the full GLM 5.2 FP8 verifier -> Mooncake RDMA store -> 6 nodes train the DSpark with FSDP (DP=24). 125k prefill tok/s, 1.5 steps/s, full online training :)` |
| **Numbers claimed** | **GB300 NVL72**; **9** vLLM nodes (GLM 5.2 **FP8** verifier); **6** train nodes; **125k prefill tok/s**; **1.5 steps/s**; **DP=24** |

| Field | Value |
|---|---|
| **URL** | https://x.com/vllm_project/status/2019105689403334825 |
| **Author** | @vllm_project |
| **Date** | 2026-02-04 |
| **Verbatim quote** | `vLLM on NVIDIA GB200: 26.2K prefill TPGS, 10.1K decode TPGS for DeepSeek R1/V3. 3-5x throughput vs H200 - with half the GPUs!` |
| **Numbers claimed** | **GB200** (not GB300): **26.2K** prefill TPGS, **10.1K** decode TPGS; **3–5×** vs **H200** with **½ GPUs** |

---

### Finding 3.4 — Practitioner rack-level throughput comparison

| Field | Value |
|---|---|
| **URL** | https://x.com/The_Analyst_Lab/status/2074768377105498428 |
| **Author** | @The_Analyst_Lab |
| **Date** | 2026-07-08 |
| **Verbatim quote** | `At the rack level, an H100 rack 2 years ago with 4 HGX had 2.6TB of HBM and did 8,830 tok/s. Today a GB300 with 72 GPUs has 20.7TB of HBM and does 370k tok/s. HBM content at rack level has grown 8x in 2 years while token throuput is 42x.` |
| **Numbers claimed** | H100 rack: **2.6 TB** HBM, **8,830 tok/s**; GB300 **72** GPUs: **20.7 TB** HBM, **370k tok/s**; HBM **8×**, throughput **42×** |

---

### Finding 3.5 — AMD MI355X vs NVIDIA (context for MoE GLM 5.2, not GB300 win)

| Field | Value |
|---|---|
| **URL** | https://x.com/loretoparisi/status/2073319812952953234 |
| **Author** | @loretoparisi |
| **Date** | 2026-07-04 |
| **Verbatim quote** | `@Zai_org GLM 5.2 inferencing with SGLang on the @AMD MI355X at 2626 tok/s/node and 213 tok/s single node at > 2.7x lower cost per GPU than Blackwell B300.` |
| **Numbers claimed** | GLM 5.2 / SGLang / **MI355X**: **2626 tok/s/node**, **213 tok/s** single-stream; **&gt;2.7×** lower cost/GPU than **B300** |

(Useful as cross-vendor MoE number; **not** a GB300 primary result.)

---

### Finding 3.6 — @_xjdr GLM 5.2 absolute GB300-class numbers (link to §1)

| Field | Value |
|---|---|
| **URL** | https://x.com/_xjdr/status/2071835604095300079 |
| **Author** | @_xjdr |
| **Date** | 2026-06-30 |
| **Verbatim quote** | (same as §1) `232 tok/s/gpu output average` / `431 tok/s/gpu output max sustained` on `60xB300s` / NVL72, no MTP |
| **Numbers claimed** | **232 / 431** output **tok/s/gpu**; **60× B300**; **no MTP** |

These are **lower per-GPU than InferenceX DeepSeek “12K–14K tok/s/GPU”** headlines — different model, batch/interactivity regime, and no MTP. That gap is itself useful practitioner context.

---

## Gaps (explicit)

1. **“Numina Code”** as a product name: **not found**. Closest real match is **ncode / Noumena** by **@_xjdr**.
2. **@_xjdr** did **not** (in retrieved posts) publish a full **GB300 vs GB200 vs H100/H200** GLM 5.2 tok/s table, nor an authoritative **$/M** cost-to-serve for his free week.
3. **Peter Steinberger** comprehensive Max-plan API-dollar investigation: **not found on X** in this pass.
4. **TensorRT-LLM maintainer personal posts** with GB300 MoE numbers: **not found** beyond SemiAnalysis citing TRTLLM in InferenceX results.
5. Batch sizes for @_xjdr’s **232 / 431** figures: **not published** in the posts retrieved (only “tok/s/gpu output average/max sustained”).

---

### Quick index of highest-signal posts

| Topic | Best primary post |
|---|---|
| ncode + GLM 5.2 + GB300 hardware | https://x.com/_xjdr/status/2067742918455279934 |
| GLM 5.2 tok/s/gpu on 60× B300 | https://x.com/_xjdr/status/2071835604095300079 |
| Claude $200 → ~$3.2k/mo API math | https://x.com/melvynx/status/2012326484300677454 |
| Claude multi-month ccusage | https://x.com/olofj/status/2037703420724019285 |
| Long-form Claude pricing investigation | https://www.ksred.com/claude-code-pricing-guide-which-plan-actually-saves-you-money/ |
| GB300 vs H100 multipliers (InferenceX) | https://x.com/SemiAnalysis_/status/2070915304629129460 |
| SGLang &gt;12K tok/s/GPU GB300 | https://x.com/lmsysorg/status/2065513735213773021 |
