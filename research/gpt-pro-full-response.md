# GPT-5.6 Pro consult — ADOPTED-FINDINGS SUMMARY (req_1783636621475_l5tccc, 54m21s, 2026-07-09)
# conversation: https://chatgpt.com/c/6a50228e-a398-83e8-8445-3c39b76730db
# PROVENANCE NOTE (corrected 2026-07-11): this page is a selected-quotes digest, not the full
# response — an earlier revision mislabeled it "verbatim". The complete original response
# (46,417 chars, recovered from the receiving session's transcript, SHA-256-stamped) is now
# published at gptpro-consult-anthropic-verbatim.html.

## Headline verdict
"As of July 9, 2026, my central estimate is that Anthropic earns roughly 91% marginal serving margin on uncached Opus input tokens and 93% on Opus output tokens at standard API list prices. On a well-optimized GB300 deployment, about 94% on both. Sonnet: ~92/94% at promo $2/$10, 94.8/96.3% at normal $3/$15."
"Standard-list-price marginal serving margin: approximately 92–94% for Opus and 94–96% for Sonnet on a mature 2026 fleet."
"Is 95% an upper bound? No." (Sonnet normal-price >95%; Opus on strategic TPU >95%; electricity-only >99.8%; Rubin cuts costs ~50%+ again.) "But not conservative for every token" — public-cloud-priced H100/H200 tokens: 55-85% margins.

## Method
Economic marginal cost (level 2 of 3): accelerator opportunity cost + 75% fleet utilization + 10% CPU/network/reliability overhead (×1.4667 on busy-chip cost). κ=2.3 FLOPs multiplier (2P + 15% attention/routing). Opus assumed 5T total / 300B active (~6% activation, cf. DeepSeek 5.5%, GLM-5.2 5.4%); Sonnet 1T/100B. NVFP4 on Blackwell, FP8 elsewhere. Fleet blend: 40% TPUv7 / 25% GB300 / 15% GB200 / 15% Trn2 / 5% H200.

## Central cost table (Opus, $/Mtok in→out, full serving cost)
H100 $1.14/$4.97 (77/80% margins) · H200 $1.27/$4.83 (75/81%) · GB200 $0.42/$2.11 (91.6/91.6%) · GB300 $0.31/$1.44 (93.8/94.2%) · TPUv7-strategic $0.24/$0.70 (95.1/97.2%) · Trn2 $1.11/$3.25 (78/87%)
Fleet blend: $0.469/$1.684 → 90.6% in / 93.3% out. Sensitivity: Opus 150B active → 95.3/96.6%; 600B active → 81.2/86.5%.

## Public-retail stress test (why both camps "prove" their number)
H100 @$5.19: 58/63% · GB200 @$10.50 (CoreWeave): 80/80% · B300 @$14.04 (AWS): 82.5/83.8% · TPUv7 @$5.40 3yr: 83.5/90.6%. "$1-3/GPU-hr concludes 90-99%; $6-14 public rates get 60-85%."

## Key hourly-cost anchors
CoreWeave spot: H100 $2.44, H200 $2.58, B300 $4.48; GB200 inference $10.50. AWS Capacity Blocks (Jul 1): H100 $5.191, H200 $5.97, B200 $12.355, B300 $14.04, Trn2 $2.235. Google TPU v7 public: $12 OD / $8.40 1yr / $5.40 3yr. SemiAnalysis estimate of Anthropic strategic TPUv7: ~$1.60/hr (newsletter.semianalysis.com/p/tpuv7-google-takes-a-swing-at-the).

## Attribution findings (differs from Grok sweep)
- GLM-5.2 = 744B total / 40B active; Baseten team (Korte, Saleh, Tri Dao, et al.) built "world's fastest API for GLM-5.2": 280+ tok/s/user on Blackwell NVFP4 (baseten.co/blog/how-we-built-the-worlds-fastest-api-for-glm-52/).
- GB300 11.2k tok/s/GPU = SGLang+NVIDIA on DeepSeek-V4 (pytorch.org/blog/serving-deepseek-v4-on-gb300-with-sglang...): 2,200 (Apr, day-0, no MTP) → 11,200 (Jun, MTP) = 5× SOFTWARE on fixed hardware.
- Could not find "Numina Code"; believes recollection conflates the two above. (Grok sweep DID find @_xjdr/ncode/Noumena with primary post URLs — both sets of results kept.)
- Musk 5T: total params, needs sparsity; cites IKP paper (arXiv 2604.24827, ±3× error bars) + LessWrong critique estimating Opus 4.7 ~1.1T total.

## Business margin
The Information Jan 2026: 2025 GM projection cut to ~40% (inference costs 23% over plan). PitchBook/Morningstar Jun 2026: ~44% GM estimate; compute spend $0.71 per revenue dollar Q1 → $0.56 projected Q2. Bridge (illustrative): 93.5% marginal → −12 price realization → −8 peak provisioning → −7.5 cloud markup/older hw → −9 free+subs → −13 CPU/net/retries/safety/internal → 44%.

## Chip trajectory (fixed model, H100=100)
H200 90-105 · GB200 30-55 · GB300 mature 25-45 · Rubin ramp 2027 10-22 · Rubin mature+software 2028 6-15. GB300 vs GB200 real gain: underwrite 10-25% $/token (favorable long-ctx up to 1.5-1.6×; InferenceX matched-interactivity 13-38%). Software > silicon: SGLang 5× on fixed GB300.

## Sonnet 5 pricing note
$2/$10 promotional through Aug 31 2026, $3/$15 from Sep 1 (platform.claude.com/docs pricing). Claude Code enterprise cost docs: ~$13/dev-day avg, $150-250/dev-month, 90% under $30/day.

## Best public analyses (its list)
1. Epoch AI inference economics 2. InferenceX dashboard 3. InferenceX v2 writeup 4. SemiAnalysis "AI Value Capture: The Shift to Model Labs" 5. MLPerf Inference Datacenter + DeepSeek disclosure as best primary source.
