# Preset grounding pack — GPT-5.6 Pro consultation, 2026-07-10

> Run 28m22s · `gpt-5-6-pro` (Pro-verified, `completion_path: api`, Ashitaorbis project) · [conversation](https://chatgpt.com/g/g-p-6a42f0b0f46081919a65018455ee56dd/c/6a516caf-49d8-83e8-b3ca-99fde11dc9ce)
> Companion design consultation: `consultation-2026-07-10-council-design.md` (4-persona council, Opus synthesis), whose ship-list adjudications governed which presets exist.
> Note: the first run of this consultation completed but expired from the MCP retention window during a usage-limit pause; this is the re-run. The full 192-row JSON/Markdown pack lives in the conversation's sandbox files (retrieve from the conversation if ever needed); the summary below carries every decision the site adopted.

## Tariff verifications (all first-party, as of 2026-07-10)
- **DeepSeek V4-Flash**: 284B total / 13B active; $0.14 uncached / $0.0028 cached / $0.28 output; 1M context; 384K max output; concurrency 2,500. → site preset CONFIRMED.
- **GLM-4.7**: 355B-A32B (BF16 + FP8 releases, MTP recipes); $0.60 / $0.11 / $2.20; cached-input storage temporarily free. → CONFIRMED.
- **GPT-5.6 Terra/Luna**: $2.50/$0.25/$15 and $1/$0.10/$6 standard short-context; cache writes 1.25× uncached; Batch/Flex = 50%; >272K whole-request repricing. → CONFIRMED.
- **Gemini 3.5 Flash**: $1.50 / $0.15 / $9 + $1/Mtok-hour cache storage; Batch $0.75/$0.075/$4.50; 1,048,576-token input / 65,536 output; no parameter disclosure. → CONFIRMED.

## Locked perspective decisions (adopted)
- **xAI cash-marginal**: $0.60/GPU-hr at the dive's operating point → ~$0.67/M output (site lands ~92% margin on Grok — matches).
- **xAI opportunity-cost**: $5.27/GPU-hr (Anthropic contract: ~325k named NVIDIA GPUs + CPUs/storage/networking at $1.25B/mo — a *bundled external opportunity value*, not pure accelerator cost) → ~$5.86/M output in its coarser replica model; the site's engine lands ~36% blended vs the dive's ~29% (model-shape divergence documented in the preset note).
- **China public-cloud on-demand**: per-SKU multipliers vs IDC-annual defaults — H20 **6.24×**, H800 **6.07×** (monthly HCC, not clean on-demand), 910C-proxy **6.15×**; scalar fallback **6.15×**; enterprise on-demand utilization **0.35**. → site ADOPTED (was 3.5×/45 pre-pack).
- **Ant H20 SLO replay**: representative tier = **Pro (675 tok/s, TPOT<50ms)** — the middle SLO and the page's neutral anchor; effective MFU 0.16875 ≈ the site's 17% fit; utilization = 1.0 as the **per-occupied-chip convention** (not a fleet-occupancy claim). → site ADOPTED (util 60→100).

## Import semantics (recorded for future preset work)
`null` = unknown-and-unset, never zero; MFU-override and interactivity-fallback are mutually exclusive; `batchShare` = published asynchronous batch tariffs only, never internal continuous batching; utilization=1.0 on measured operating points is a convention, not occupancy. Terra/Luna/Gemini-Flash are TARIFF SCENARIOS — size/topology unknown; only tariffs and endpoint metadata carry DISCLOSED.
