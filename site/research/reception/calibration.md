## VERDICT-FREE SUMMARY OF WHAT WAS CHECKED

The live homepage, `engine.js`, `app.js`, research index, and 28 linked annex wrappers were fetched. The served assets byte-match local git `9f1fd0f`; the public footer and engine confirm methodology `v2.1.2`, engine `v2.1.2-2026-07-11`, and data date `2026-07-11`.

The audit covered §5–§6 intervals, all six §10 cards, the normalized table, hero results, cost-lens spans, traffic presets, TIPS tooltips, dossiers, and annex probability terminology.

## FINDINGS

### 1. [P0] Provider-native ranges are falsely transported to a different estimand

- **Passage/anchor:** [§10 normalized](https://inference-margins.pages.dev/#s10-normalized): “Margins are rounded to whole points; the §10 ranges still apply.”
- **Source locator:** The [§10 methodology](https://inference-margins.pages.dev/#s10) says those ranges belong to provider-native workloads, lenses, and service tiers. The normalized table changes both lens and workload.
- **Failure class:** Factual error · interval transport across incompatible estimands.
- **Objection:** DeepSeek V4 normalizes to −4.425% → `-4%`, outside its provider-native 45–83% range. GLM 5.2 normalizes to 80.247% → `80%`, outside its 35–77% range. Therefore the ranges demonstrably do not “still apply.”
- **Exact replacement:**  
  “These are deterministic outputs of one normalized scenario. Provider-native §10 ranges do not apply after changing the lens and workload; this table does not propagate input uncertainty.”
- **Deterministic acceptance test:** At `#s10-normalized`, require the replacement string; reject `the §10 ranges still apply`. Confirm the DeepSeek V4 row remains `-4%` and the GLM 5.2 row remains `80%`.

### 2. [P1] The canonical “roughly 80%” phrase still implies undefined calibration

- **Passage/anchor:** [§10](https://inference-margins.pages.dev/#s10): “judgmental uncertainty ranges intended to contain roughly 80% of plausible modeled outcomes.”
- **Source locator:** The archived [council review](https://inference-margins.pages.dev/research/review-council.html) records that no priors, probability distributions, correlation structure, sampling procedure, seed, or calibration evidence are published.
- **Failure class:** Undefined probability denominator · implied coverage calibration.
- **Objection:** “80% of plausible modeled outcomes” requires a measure over the set of “plausible” outcomes. Calling the intervals judgmental and non-statistical does not define that measure.
- **Exact replacement:**  
  “The displayed ranges are analyst-elicited scenario ranges spanning selected downside and upside cases. They have no stated coverage probability and are not statistically calibrated.”
- **Exact card UI change:** Render summaries as, for example, `~94% (scenario range 86–97%; uncalibrated)`, applying the same wording to all six cards.
- **Deterministic acceptance test:** In homepage §10, require `They have no stated coverage probability`; reject `80% of plausible modeled outcomes`, `confidence interval`, and standalone `CI`. Every `.prov-ci` element must contain `scenario range` and `uncalibrated`.

### 3. [P1] §5 uses an undefined “median” and an unlabeled sensitivity range

- **Passage/anchor:** [§5](https://inference-margins.pages.dev/#s5): “~75–88%, median ≈ 80%.” Related surfaces say “this page’s median” and name the preset “Evidence median.”
- **Source locator:** `engine.js`, perspective `median`, labels its inputs as a synthesis with several SPECULATION fields; no sample or distribution from which a median is calculated exists.
- **Failure class:** Undefined statistic · central-scenario language presented as distributional summary.
- **Objection:** The value is neither the calculator default—approximately 77%—nor a documented median of draws.
- **Exact replacements:**
  - §5: “blended across the calculator’s Reference traffic convention (15:1 I/O, 60% cache; not a measured Anthropic operating point) → sensitivity span ~75–88%; the deployed central scenario is ~77%. No coverage probability is assigned to this span.”
  - Preset name: `[lens] Central scenario`
  - §6 comparison header: `§5 central scenario`
- **Deterministic acceptance test:** Require all three replacement strings. Reject `Evidence median`, `this page’s median`, and `median ≈ 80%`; legitimate phrases concerning an unknown subscriber median may remain.

### 4. [P1] §6 elevates model-generated scenario intervals into a standalone “verdict”

- **Passage/anchor:** [§6](https://inference-margins.pages.dev/#s6): “approximately 92–94% for Opus and 94–96% for Sonnet,” followed by “public cloud rates … 55–85%.”
- **Source locator:** The section byline and [verbatim annex](https://inference-margins.pages.dev/research/gptpro-consult-anthropic-verbatim.html) identify this as a model-generated research run, while the comparison table documents materially different procurement and utilization assumptions.
- **Failure class:** Provenance-authority mismatch · unlabeled model-generated intervals.
- **Exact UI change:** Place this sentence inside the §6 verdict box, above the numbers:  
  “Model-generated scenario analysis; the spans below are uncalibrated sensitivity ranges, not confidence intervals.”
- **Deterministic acceptance test:** At `#s6`, the sentence must appear inside `.verdict` before `92–94%`.

### 5. [P1] Hero results manufacture tenths-of-a-point epistemic precision

- **Passage/anchor:** [`#out-margin`](https://inference-margins.pages.dev/#out-margin): the Grok opportunity-cost replay displays `26.9%`.
- **Source locator:** [`engine.js`](https://inference-margins.pages.dev/engine.js), `fmtPct`, always emits one decimal; [`app.js`](https://inference-margins.pages.dev/app.js), `updateTiles`, displays that value without propagating parameter uncertainty.
- **Failure class:** False precision · conditional arithmetic presented as an estimate.
- **Exact UI change:** Round preset/replay headlines to whole percentage points and prefix them with `≈`. Add:  
  “Conditional scenario output; input uncertainty is not propagated.”
- **Deterministic acceptance test:** Select `Grok 4.5` plus `xAI opportunity-cost`. The tile must show `≈27%` and the new caveat; `26.9%` must not appear. The default Opus tile must show `≈77%`.

### 6. [P1] The Reference traffic convention is called “realistic”

- **Passage/anchor:** [§5](https://inference-margins.pages.dev/#s5): “blended across a realistic traffic mix (15:1 I/O, 60% cache).”
- **Source locator:** [`engine.js`](https://inference-margins.pages.dev/engine.js), `TRAFFIC_PROFILES.reference`: “Calculator convention … Not any provider’s measured operating point.”
- **Failure class:** Provenance escalation · convention presented as population-representative.
- **Exact replacement:**  
  “blended across the calculator’s Reference traffic convention (15:1 I/O, 60% cache; not a measured Anthropic operating point)”
- **Deterministic acceptance test:** Require that exact string at `#s5`; reject `realistic traffic mix`.

### 7. [P1] Two tooltips silently introduce speculative population priors

- **Quoted passages:** TIPS `ioRatio`: “Chat ≈ 5-20:1. Agentic coding ≈ 100-300:1.” TIPS `util`: “typical industry estimates 30-60%.”
- **Source locator:** [`engine.js`](https://inference-margins.pages.dev/engine.js), `TIPS.ioRatio`, `TIPS.util`, and the dossiers’ SPECULATION classification. The [v2.1.2 consultation](https://inference-margins.pages.dev/research/plan-review-v212-gptpro.html) specifically requires provenance-honest named profiles rather than generic archetypes.
- **Failure class:** Unattributed base-rate claim · speculative interval presented as an industry prior.
- **Exact replacements:**
  - `ioRatio`: “Named observations and conventions vary: DeepSeek disclosure ≈4:1; ncode deployment 8:1; calculator Reference convention 15:1; one Claude Code trace ≈300:1. These are not population ranges for ‘chat’ or ‘agentic coding.’”
  - `util`: “No representative industry utilization distribution is public. The 50% default is an analyst central scenario; 30–60% is a speculative sensitivity band, not a calibrated interval.”
- **Deterministic acceptance test:** Focus the two corresponding ⓘ buttons and require the replacement strings in `#tooltip`. Reject `Chat ≈ 5-20:1` and `typical industry estimates 30-60%`.

### 8. [P1] A forecast appears inside a paragraph labeled “not forecast”

- **Passage/anchor:** [§5](https://inference-margins.pages.dev/#s5): “Forward (scenario, not forecast)” followed by a prediction that quoted margins stay in the high-80s/low-90s while price falls another 3–5×.
- **Source locator:** The same paragraph supplies no probability, forecast method, or uncertainty over prices, demand, token volume, or provider conduct.
- **Failure class:** Verbal probability laundering · forecast mislabeled as sensitivity analysis.
- **Exact replacement:**  
  “Forward hardware sensitivity scenario (not a forecast): holding list prices and all non-hardware assumptions fixed, the GB300→Rubin path produces 92–96% Opus-class output margins by 2027. No probability is assigned to future list prices, price cuts, token volume, or realized margins.”
- **Deterministic acceptance test:** Require the replacement paragraph and the sentence `No probability is assigned`; reject any subsequent claim about what the provider is expected to do.

### 9. [P1] Direct annex landings restore the deprecated “80% CI” terminology

- **Quoted passages:** The top verdicts of the [OpenAI](https://inference-margins.pages.dev/research/openai-gptpro.html), [Google](https://inference-margins.pages.dev/research/google-gptpro.html), [xAI](https://inference-margins.pages.dev/research/xai-gptpro.html), [DeepSeek](https://inference-margins.pages.dev/research/deepseek-gptpro.html), [Zhipu](https://inference-margins.pages.dev/research/zhipu-gptpro.html), and [Moonshot](https://inference-margins.pages.dev/research/moonshot-gptpro.html) wrappers all use `80% CI`.
- **Source locator:** Each wrapper’s generic “Research artifact” banner says corrections live in the main report, but it does not disclose that the visible CI terminology is preserved authoring-engine language. The research-index footer supplies that caveat only after navigation through the index.
- **Failure class:** Caveat separation · stale confidence terminology at point of use.
- **Exact wrapper UI change for these six pages:**  
  “This artifact preserves the authoring engine’s original probability labels. Any ‘CI’ below is verbatim model-output terminology, not a statistically calibrated interval and not the site’s current terminology; the main report treats these as uncalibrated scenario ranges.”
- **Deterministic acceptance test:** Fetch all six URLs. The banner must precede each top verdict containing `80% CI`; the archived body must remain byte-preserved beneath the wrapper.

## QT-SCREENSHOT

- **Single worst crop:** `#s10-normalized`, desktop viewport 1440×900; crop approximately 820×620 around the heading, explanatory paragraph, table header, DeepSeek V4 row, and GLM 5.2 row.
- **Hostile caption:** “Their normalized DeepSeek margin is −4%, their published range is 45–83%, and the report says both still apply.”
- **Context lost:** The card ranges describe provider-native lenses and workloads; the normalized table substitutes Western rental economics plus a fixed 15:1/60% workload.
- **Required content inside the crop:**  
  “Provider-native §10 ranges do not apply to this normalized scenario. Values are conditional calculator outputs; uncertainty is not propagated.”
- **Screenshot-safe table change:** Add a visible column or subtitle reading `Uncertainty: not propagated` and remove “the §10 ranges still apply.”

## COMPREHENSION/REPRO NOTES

- The anti-lens-shopping requirement passes for every multi-lens rendering inspected. `app.js` prints the profile, “traffic held fixed,” and “excludes traffic-mix uncertainty” inside the hero output. No contradiction found in this corpus.
- Main-page §10 contains no surviving affirmative `CI` or “confidence interval” label; those terms occur only in the explicit negation. The regression survives in direct annex artifacts.
- Dossiers generally expose SPECULATION/COMMUNITY ESTIMATE classifications. The undefined “evidence median” name and one-decimal hero output nevertheless overstate what those classifications support.
- Live normalized calculations reproduce `-4.425%` for DeepSeek V4 and `80.247%` for GLM 5.2, establishing Finding 1 independently of prose interpretation.
- The public response does not expose Cloudflare deployment ID `201b22a7`. The served homepage, engine, and app do byte-match git `9f1fd0f`, and the engine/footer revisions match the requested frozen target.

## CONFIDENCE & AMBIGUITIES

**Confidence: high.**

Unresolved ambiguities:

- §5 does not document whether its ranges were intended as 80%-coverage judgments, endpoint sensitivities, or informal brackets.
- The intended construction of each §10 “roughly 80%” range remains unpublished.
- Annex immutability may prohibit changing artifact bodies, but it does not preclude corrective wrapper banners.
- A precision policy for fully custom user scenarios is unspecified; whole-point display is clearly warranted for named estimates and replays, while an inspectable unrounded diagnostic could remain available.
