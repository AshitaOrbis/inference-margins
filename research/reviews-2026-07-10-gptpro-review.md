# GPT-5.6 Pro pre-publication review — 2026-07-10

> Run 43m49s · `gpt-5-6-pro` (Pro-verified, `completion_path: api`, Ashitaorbis project) · [conversation](https://chatgpt.com/g/g-p-6a42f0b0f46081919a65018455ee56dd/c/6a51065d-d18c-83e8-9456-850b4e0c2288)
> Verdict: **"Do not publish the page unchanged."** No transcription errors in the six §10 headline numbers — the blockers are definition errors, comparability errors, stale current facts, and caveats that became stronger claims when compressed into cards.
> Companion review: `reviews-2026-07-10-council-synthesis.md` (4-persona codex council, Opus synthesis — reached the same headline verdict independently and additionally reproduced app.js numerically, finding the preset-merge bug and calculator/§10 divergence).

The full response is preserved in the ChatGPT conversation (link above). Key structure:

## Faithfulness of §10 cards (all six numbers transferred correctly)
- OpenAI: faithful; weaken 3.2–28.7T (effective-capacity, not literal weights) and date the 70% compute margin (Oct 2025 via Dec 2025 reporting).
- Google: faithful number; card makes derived $1.28/hr sound like a known internal cost; "sub-90% only if everything is worse" too strong.
- xAI: faithful only if the cost lens (full-cycle TCO) is displayed beside the headline; $5.27 is a bundled contract allocation.
- DeepSeek: number faithful; "lowest estimated margin" is FALSE (Zhipu 60% < 69%); export-control cost effect cannot be signed; H800 rate bands inconsistent between card ($1.08–1.54) and §4 table ($1.47–2.06).
- Zhipu: number faithful; DeepInfra ceiling is conditional on its profitability; "barely owns compute" overstates filings.
- Moonshot: number faithful but it is an OUTPUT-TOKEN margin — §10's "blended" framing misclassifies it; "healthiest Chinese margin" invalid cross-metric.

## Hard factual errors found
1. **Sonnet 5 current price is $2/$10 (intro through Aug 31, 2026)**, not the modeled $3/$15 — material: 85–93% → ~78–90% at intro tariff. Tokenizer also produces ~30% more tokens than 4.6.
2. **Rubin row stale/misclassified**: current platform is Vera Rubin NVL72 — 288GB HBM4, 22 TB/s per GPU; the ~50 PF figure is SPARSE NVFP4 inference, not dense FP8/FP4.
3. **B200/GB200 conflated** in one row (4.5 vs 5 PF dense FP8; different configs) — split.
4. **Trainium generations collapsed** under one GA date; Rainier ~500k launch vs Anthropic's later >1M Trainium2 across AWS.
5. **"three best public measurements"** heading vs six table rows.
6. **H800 "prefill" anchor is cache-contaminated**: the 73.7k input tok/s includes the 56.3% on-disk KV-cache-hit share — using it as fresh-prefill MFU while separately discounting cache reads double-counts the cache benefit.
7. Validation anchors silently used as neutral defaults: H20 18% (anchor) vs 17% (neutral rec); Ascend 9.5% (optimized CloudMatrix) vs 7% (neutral rec).

## Methodology/framing
- Rename headline metric: **"list-price direct-serving contribution margin"** (not "marginal gross margin"); served vs billed tokens need an explicit overhead factor; MFU/interactivity/utilization may double-count penalties.
- "80% CI" → "judgmental uncertainty range intended to contain roughly 80% of plausible modeled outcomes."
- §10 = provider-native case studies, NOT a ranking; remove highest/lowest language; optional separate normalized-workload comparison view.
- Evidence badge → 5-dimension profile (architecture / pricing / fleet economics / production throughput / financial perimeter).
- §5 blanket verdict conflicts with the page's own market-rate Opus result (~75–88%, median ~80%): condition the verdict on procurement.
- Subscription median/decile claims unsupported (tail-selection); ownership claims ("DeepSeek owns / Anthropic doesn't") too categorical; "only primary disclosure in existence" indefensible; primary-source guarantee false as stated.
- Tone: remove the reproduced slur, "fleecing," "reply-guy," "Drag things," "famous money pit," "profitably(?)" — polemical register invites dismissal.

## Its P0 list (12 items, with exact replacement wording in the archived response)
P0.1 rename+define metric · P0.2 Sonnet 5 correction · P0.3 rewrite §10 methodology intro + Moonshot relabel · P0.4 H800 input-calibration fix · P0.5 anchors-vs-defaults separation · P0.6 hardware-table basis repair (B200/GB200 split, Rubin update, INT8 label) · P0.7 conditional Anthropic verdict · P0.8 DeepSeek comparison rewrite (3.6×/9.1×/11.4×) · P0.9 restore provider-card caveats (per-card wording supplied) · P0.10 remove subscriber/ownership conclusions · P0.11 provenance + tone · P0.12 deterministic release tests (8 canonical presets).

## Bottom line (quoted)
"An expert critic could dismiss the entire product after finding only three errors: Moonshot labeled blended, H800 cache-hit traffic labeled prefill, and sparse Rubin NVFP4 presented under dense compute. That would be an avoidable outcome for research whose underlying annexes are substantially better than the current summary page makes them look."
