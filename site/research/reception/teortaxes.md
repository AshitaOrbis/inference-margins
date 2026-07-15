## VERDICT-FREE SUMMARY OF WHAT WAS CHECKED

The audit followed the frozen corpus manifest: material selected by the page’s own research, not a completeness review of the account’s full timeline. Accordingly, null classifications are limited to “no contradiction found in this corpus.”

The deployed footer confirms methodology `v2.1.2`, engine `v2.1.2-2026-07-11`, and data as of `2026-07-11`. The audit covered the [verbatim X sweep](https://inference-margins.pages.dev/research/grok-sweep-margin-claims), the additional [verbatim consult fragment](https://inference-margins.pages.dev/research/gptpro-consult-anthropic-verbatim.html), the [main report](https://inference-margins.pages.dev/), the deployed [engine](https://inference-margins.pages.dev/engine.js), the interactive dossier, and the [grounding ledger](https://inference-margins.pages.dev/research/grounding-ledger).

### Stage 1 — corpus extraction

| Date (UTC) | Locator | Exact archived wording | Claim or qualifier |
|---|---|---|---|
| 2025-03-01 | [1895876331495477615](https://x.com/teortaxesTex/status/1895876331495477615) | “nice lesson in arithmetic Adam, but could you tell us your profit margin?” | Challenges the comparison with OpenAI; supplies no OpenAI margin value. |
| 2025-03-01 | [1895876441117769922](https://x.com/teortaxesTex/status/1895876441117769922) | “Thanks. What is OpenAI's profit margin?” | Same non-numeric challenge. |
| 2025-03-01 | [1895889315970044153](https://x.com/teortaxesTex/status/1895889315970044153) | “very embarrassing error for o3-mini-high, it's larping hard here” | Reaction to the 545%-versus-84% calculation; wording alone does not state the corrected formula. |
| 2025-03-02 | [1896141536884396528](https://x.com/teortaxesTex/status/1896141536884396528) | “What they technically mean is that they have a markup of 545%” | Directly classifies 545% as markup, not margin. |
| 2025-03-17 | [1901766584974155784](https://x.com/teortaxesTex/status/1901766584974155784) | “DeepSeek has provided their inference figures. > Each H800 node delivers an average throughput of ~73.7k tokens/s input … or ~14.8k tokens/s output … That's at 20ish t/s though” | Repeats DeepSeek’s disclosed throughput with a roughly 20 tok/s qualifier. |
| 2025-03-31 | [1906521148726100430](https://x.com/teortaxesTex/status/1906521148726100430) | “if we exclude R&D and look at inference alone, Anthropic and OpenAI are making like 80% margins.” | Approximately 80%; inference-only; excludes R&D; names Anthropic and OpenAI. |
| 2025-05-25 | [1926656992082337950](https://x.com/teortaxesTex/status/1926656992082337950) | “They can go for 99% margins …” | Only an indexed fragment survives in the annex. Subject, perimeter, conditions, and complete sentence are unavailable. Date is derived from the X snowflake identifier. |
| 2026-06-21 | [2068833223228924229](https://x.com/teortaxesTex/status/2068833223228924229) | “They do have 90% margins” | Direct 90% statement, but the archived sweep warns that parent context is limited. |
| 2026-06-22 | [2068980091724419280](https://x.com/teortaxesTex/status/2068980091724419280) | “Seeing as Fable was served at like 90 t/s… it seems Fable had shockingly FEW active parameters for what it was.” | Qualitative Fable active-parameter inference from serving speed; no absolute parameter count. |
| 2026-06-27 | [2070786814097440805](https://x.com/teortaxesTex/status/2070786814097440805) | “No, they'll just increase the batch size, have the same speed, and drive margins from 90% to 95%. You're welcome” | Conditional 90→95% claim tied to increased batch size while retaining speed; sweep context identifies western providers. |
| 2026-06-27 | [2070832301005537627](https://x.com/teortaxesTex/status/2070832301005537627) | “DeepSeek has disclosed their inference economics – for the first time since Open Source Week. Then, they were doing 14.8K generation on 8xH800 node (1,85K/GPU) at 20-22 tps. Whatever these GPUs are now, V4-Pro is *at least 3x cheaper to serve*. 2K/GPU needs >60 tps.” | DeepSeek-specific throughput and ≥3× cheaper-to-serve claim. |
| 2026-06-27 | [2070833810145415518](https://x.com/teortaxesTex/status/2070833810145415518) | “I see 70-90 tps right now, so let's say they're doing 1.4K t/s/gpu. That's 5M tokens/hour, or ≈$4,4 at $0.87/Mt. H100 *spot prices* are now $2.4/hr. DS has at least 50% margin.” | DeepSeek calculation; H100 spot `$2.40/hr`; DeepSeek margin ≥50%. |
| 2026-06-28 | [2071314837771014298](https://x.com/teortaxesTex/status/2071314837771014298) | ““…no, they can't have 90%+ margins? Right? Right?” THEY CAN.” | 90%+ claim in western/frontier-lab context. |
| 2026-06-28 | [2071315379004051513](https://x.com/teortaxesTex/status/2071315379004051513) | “math for DeepSeek Serving Opus is at most $4/1Mt. Anthropic is not retarded They are fleecing you even on subscriptions, except maybe at 100% utilization” | Opus serving-cost ceiling ≤`$4/1Mt`; subscription qualifier at approximately 100% utilization. Token class is not stated. |
| 2026-06-28 | [2071325290819641620](https://x.com/teortaxesTex/status/2071325290819641620) | “Opus has at most 2-4x active params do some actual quantitative math for once, germoid” | Relative ≤2–4× active-parameter claim against an unspecified interlocutor baseline; no absolute Opus count. |

The selected corpus does **not** support attributing any of the following to the source:

- `rentMult 0.85`, fleet utilization `70%`, stack multiplier `1.25`, batch-traffic share `10%`, enterprise discount `0%`, or the `15:1 / 60%` traffic mix.
- An absolute `300B` active-parameter estimate for Opus.
- A fixed, audited Anthropic margin of exactly 92%, or an unqualified exact 90–95% Anthropic accounting margin.
- An Anthropic procurement price of `$2.04/H100-hour`.
- Classification of the `$4/1Mt` ceiling as output-only, input-only, or blended.
- Any approval or endorsement of the calculator’s reconstruction or resulting 90.9% value.

### Claim-to-page matrix

| Page representation | Classification |
|---|---|
| `#s1`: Anthropic 90–95% headline followed by “The loudest and most quantitative proponent…” | **Over-broad**: the record supports an Anthropic-specific ≤`$4/Mtok` ceiling and earlier ~80% inference-only claim, but the 90→95 language is conditional and broader than Anthropic. |
| `#s1`: ≤`$4/Mtok`, subscription “fleecing,” 100%-utilization qualifier | **Directly entailed**, except that the page does not preserve the unresolved token-class ambiguity. |
| `#s1`: batch size drives 90→95% | **Directly entailed**. |
| `#s1`: March 2025 ~80% inference-only excluding R&D | **Directly entailed**. |
| `#s2`: “545% … is a markup; as a margin it is 84.5%,” credited to TeorTaxes | **Directly entailed**; `545% / 645% = 84.5%`. |
| `#s2`: Fable had “shockingly FEW active parameters” | **Directly entailed**. |
| `#s2` and `#s5`: 300B Opus default and a 5–10-point margin change | **Page-authored reconstruction correctly described in prose**, but the dossier/ledger source row overstates the source’s contribution to the numeric value. |
| `#s5`: “TeorTaxes's ‘$4/Mt ceiling’ is inside” an output-token cost range | **Compatible but not source-supported** because the post does not identify token class. |
| `[analyst] TeorTaxes (bull)` expanded dossier | **Page-authored reconstruction correctly labeled**, subject to the numerical and source-row defects below. |
| Collapsed preset selector, preset note, and hero result | **Compatible but not source-supported at point of use**; the reconstruction disclosure is hidden inside the closed dossier. |
| Hero text “in the TeorTaxes/Zephyr 90–95% zone” | **Over-broad** because it labels arbitrary user-generated states with real-source names. |
| `#s9`: TeorTaxes’s DeepSeek commentary as part of the live debate | **Directly entailed**. |
| “fleecing” quotation | **Directly entailed** and accurately credited. No contradiction found in this corpus. |

## FINDINGS

### 1. [P0] The preset converts the cited `$2.40/hr` H100 spot price into `$2.04/hr`

- **Exact page anchor/passage:** `[analyst] TeorTaxes (bull)` dossier and grounding-ledger rows: ``rentMult | 0.85 | H100 spot ~$2.40 → below-neocloud``. The deployed engine defines `HW.h100.rent: 2.40` and then applies `rentMult: 0.85`.
- **Source locator:** [June 27 post stating “H100 spot prices are now $2.4/hr”](https://x.com/teortaxesTex/status/2070833810145415518); deployed [engine.js](https://inference-margins.pages.dev/engine.js); report [§4 hardware table](https://inference-margins.pages.dev/#s4).
- **Failure class:** Numerical contradiction inside a named reconstruction.
- **Severity:** **P0 — factual/model attribution error.** The effective H100 rate is `2.40 × 0.85 = $2.04/hr`, 15% below the cited observation.
- **Exact replacement/UI change:** Change the perspective setting to `rentMult: 1.0`. Replace the source cell with:  
  **“H100 spot $2.40/hr, matching the calculator’s H100 base rate; the post used this rate in a DeepSeek calculation, not as an Anthropic fleet disclosure.”**
- **Deterministic acceptance test:** Select `Claude Opus 4.x` + `[analyst reconstruction] TeorTaxes bull case`; assert `HW.h100.rent === 2.40`, `rentMult === 1.00`, and effective H100 rent equals `$2.40/hr`. With all other frozen settings unchanged, the displayed margin should round to `89.3%` and output cost to `$2.05/Mtok`, rather than `90.9%` and `$1.75/Mtok`.

### 2. [P1] The reconstruction boundary is hidden when the named result is visible

- **Exact page anchor/passage:** [`#dossier`](https://inference-margins.pages.dev/#dossier) is closed by default. The visible selector says `[analyst] TeorTaxes (bull)` and the hero can show `90.9% · in the TeorTaxes/Zephyr 90–95% zone`; only the expanded panel says: “Reconstruction — only the quoted claim is the source's; the parameter translation into this calculator is this page's, and the source never chose these values.”
- **Source locator:** The [archived sweep](https://inference-margins.pages.dev/research/grok-sweep-margin-claims) contains the quotations but none of the parameter vector; the [design consultation](https://inference-margins.pages.dev/research/consult-council-design.html) explicitly records that utilization, fleet, and batching translation belong to the page.
- **Failure class:** Point-of-use attribution-boundary omission.
- **Severity:** **P1 — materially misleading framing.**
- **Exact replacement/UI change:** Rename the option to **`[analyst reconstruction] TeorTaxes bull case`** and render this always-visible line immediately under the preset bar:  
  **“RECONSTRUCTION — TeorTaxes supplied only the quoted ≤$4/Mtok and conditional 90→95% claims. The rent multiplier, 70% utilization, 1.25× stack multiplier, batch mode, 10% batch share, 0% discount, traffic mix, and resulting margin are this page’s assumptions.”**
- **Deterministic acceptance test:** After selecting the preset with the dossier still collapsed, the exact string beginning `RECONSTRUCTION — TeorTaxes supplied only` must be visible in the DOM and viewport. No click on `#dossier` may be required.

### 3. [P0] Several parameter “Source” cells convert non-claims into source-attributed assumptions

- **Exact page anchor/passage:** [`[analyst] TeorTaxes (bull)` ledger table](https://inference-margins.pages.dev/research/grounding-ledger): “Top-decile serving software (his read of frontier labs),” “Position implies throughput-first traffic,” and “List-price argument — no discounting.”
- **Source locator:** The batch claim is [status 2070786814097440805](https://x.com/teortaxesTex/status/2070786814097440805); the spot-rate claim is DeepSeek-specific [status 2070833810145415518](https://x.com/teortaxesTex/status/2070833810145415518); the Opus ceiling is [status 2071315379004051513](https://x.com/teortaxesTex/status/2071315379004051513). None supplies a 70% fleet-utilization value, 1.25× stack multiplier, 10% batch share, or discount distribution.
- **Failure class:** Unsupported parameter attribution.
- **Severity:** **P0 — misattribution in the row-level provenance record.**
- **Exact replacement wording:**

  - `util`: **“Page-set 70% fleet-utilization assumption; no fleet-utilization value appears in the cited corpus.”**
  - `stackMult`: **“Page-set 1.25× serving-stack assumption; no numeric stack multiplier or ‘top-decile’ estimate appears in the cited corpus.”**
  - `interact`: **“Page mapping of the direct batch-size claim into the calculator’s batch-optimized mode.”**
  - `batchShare`: **“Page-set 10% batch-price share; no traffic-share percentage appears in the cited corpus.”**
  - `discount`: **“Page-set 0% negotiated discount; the cited corpus does not disclose Anthropic’s realized discount distribution.”**
- **Deterministic acceptance test:** The dossier and grounding ledger must contain all five exact replacement strings. The strings `his read of frontier labs` and `Position implies throughput-first traffic` must not occur in the TeorTaxes parameter section.

### 4. [P1] The page treats an unclassified `$4/1Mt` ceiling as an output-token ceiling

- **Exact page anchor/passage:** [`#s5`](https://inference-margins.pages.dev/#s5): “output tokens cost ≈ $2.50–5.50/Mtok … TeorTaxes's ‘$4/Mt ceiling’ is inside my range.” The `cost-out` tooltip likewise says: “Compare TeorTaxes's ceiling: ‘Serving Opus is at most $4/1Mt.’”
- **Source locator:** [Status 2071315379004051513](https://x.com/teortaxesTex/status/2071315379004051513) says `$4/1Mt` but does not specify fresh input, cached input, output, or blended tokens.
- **Failure class:** Metric/token-class conflation.
- **Severity:** **P1 — missing material caveat at the comparison point.**
- **Exact replacement wording:** Replace the §5 comparison with:  
  **“The cited post’s unclassified ≤$4/Mtok serving-cost ceiling overlaps this output-cost range numerically, but the post does not identify whether it means input, output, or blended tokens; it is therefore not an output-token validation target.”**  
  Replace the tooltip source line with:  
  **“TeorTaxes stated an unclassified ‘Serving Opus is at most $4/1Mt’ ceiling; token-class comparability is unresolved.”**
- **Deterministic acceptance test:** `#s5` must contain the exact string `it is therefore not an output-token validation target`, and the `cost-out` tooltip must contain `token-class comparability is unresolved`.

### 5. [P1] Section 1 compresses distinct Anthropic-specific and western-provider claims into one exact 90–95% attribution

- **Exact page anchor/passage:** [`#s1`](https://inference-margins.pages.dev/#s1): “Anthropic's … gross margin on serving is 90–95%” followed immediately by “The loudest and most quantitative proponent is @teortaxesTex.”
- **Source locator:** Anthropic-specific posts support [approximately 80% inference-only](https://x.com/teortaxesTex/status/1906521148726100430) and [Opus serving ≤$4/Mtok](https://x.com/teortaxesTex/status/2071315379004051513). The [90→95% post](https://x.com/teortaxesTex/status/2070786814097440805) is conditional on increasing batch size and is classified by the archived sweep as western-provider context.
- **Failure class:** Scope compression / over-broad attribution.
- **Severity:** **P1 — materially misleading claimant framing.**
- **Exact replacement wording:** Replace the claimant introduction with:  
  **“Within the cited record, @teortaxesTex makes an Anthropic-specific serving-cost claim—Opus at no more than $4/Mtok—and an earlier approximate 80% inference-only estimate for Anthropic and OpenAI. His cited 90→95% statement is a conditional western-provider claim: margins move from 90% to 95% if batch size rises while speed is maintained. The corpus does not contain an audited or unqualified claim that Anthropic’s exact margin is 90–95%.”**
- **Deterministic acceptance test:** `#s1` must include the exact string `The corpus does not contain an audited or unqualified claim that Anthropic’s exact margin is 90–95%.`

### 6. [P1] The 300B Opus value is described as a median partly sourced from a qualitative Fable observation

- **Exact page anchor/passage:** Grounding-ledger `Claude Opus 4.x` row: `active | 300 | Median of TeorTaxes's serving-speed reading ('shockingly few active') and GPT-5.6 Pro's independent 300B convergence`.
- **Source locator:** [Status 2068980091724419280](https://x.com/teortaxesTex/status/2068980091724419280) concerns Fable and gives no absolute count. [Status 2071325290819641620](https://x.com/teortaxesTex/status/2071325290819641620) gives only a relative Opus bound of `2–4×` an unspecified baseline.
- **Failure class:** Cross-model qualitative-to-numeric extrapolation.
- **Severity:** **P1 — materially misleading provenance description.**
- **Exact replacement wording:**  
  **“Page-authored 300B Opus scenario value. TeorTaxes’s cited corpus supplies only a qualitative Fable observation (‘shockingly FEW active parameters’) and a relative Opus bound (‘at most 2–4x’ an unspecified baseline); neither supplies an absolute Opus count.”**
- **Deterministic acceptance test:** The exact replacement must appear in the Opus `active` source cell. The string `Median of TeorTaxes's serving-speed reading` must be absent from the deployed engine and grounding ledger.

### 7. [P1] The dynamic hero assigns real-source names to arbitrary calculator states

- **Exact page anchor/passage:** [`#out-margin-note`](https://inference-margins.pages.dev/#out-margin-note): `in the TeorTaxes/Zephyr 90–95% zone`. The application emits this whenever `wl.margin >= 0.9`, regardless of which slider edits produced the value.
- **Source locator:** The source supports a cited numerical range, not ownership of every calculator state that falls within it: [90→95% batch claim](https://x.com/teortaxesTex/status/2070786814097440805).
- **Failure class:** Dynamic named-attribution leakage.
- **Severity:** **P1 — screenshot-prone misleading framing.**
- **Exact replacement wording:**  
  - For `margin >= 0.9`: **“within the cited 90–95% unit-serving claim range; this value is calculator-generated”**
  - For `margin >= 0.8`: **“within the cited >80% unit-serving claim range; this value is calculator-generated”**
- **Deterministic acceptance test:** Move sliders to any state at or above 90%. `#out-margin-note` must equal the first replacement before any lens-span suffix is appended, and it must not contain `TeorTaxes`, `Zephyr`, `Dylan Patel`, or `fleetingbits`.

## QT-SCREENSHOT

- **Single worst tile:** The 90.9% hero result paired with the perspective selector `[analyst] TeorTaxes (bull)` and the caption `in the TeorTaxes/Zephyr 90–95% zone`.
- **Viewport/crop:** Mobile viewport `390×600`, starting at the preset selectors and ending below the hero margin tile, with `#dossier` left collapsed. This crop retains the named selector and 90.9% result while excluding the hidden reconstruction sentence and most methodology context.
- **Hostile quote-tweet caption:**  
  **“They named a 91% result after an analyst, then hid that 70% utilization, 1.25× software efficiency, and a $2.04 H100-hour were invented by the calculator.”**
- **Context lost:** The expanded dossier’s reconstruction classification; evidence labels; the model-default `15:1 / 60%` traffic mix; the distinction between direct serving contribution margin and accounting gross margin; the fact that most parameter values are page-authored.
- **Required content inside the crop:**  
  **“RECONSTRUCTION — only the quoted ≤$4/Mtok and conditional 90→95% claims are TeorTaxes’s. All parameter values and the displayed margin are calculator-authored; H100 spot `$2.40/hr` is the cited rate.”**

## COMPREHENSION/REPRO NOTES

- The frozen TeorTaxes/Opus preset deterministically produces:

  - Margin: `90.890128877%`
  - Output cost: `$1.745300729/Mtok`
  - Blended cost: `$0.321834666/Mtok`
  - Blended realized price: `$3.5328125/Mtok`
  - Traffic: `15:1`, `60%` cache
  - `rentMult 0.85`, `util 70`, `stackMult 1.25`, `interact batch`

- The current result is numerically below the unclassified `$4/Mtok` ceiling and within 90–95%. No contradiction was found between those output values and the cited ceiling/range, apart from the token-class ambiguity.
- The March 2025 “like 80%” claim does not contradict the later 90%+/90→95% statements in this corpus: it is earlier, approximate, and explicitly inference-only.
- The “fleecing” quotation is accurately credited and preserves the subscription-utilization qualifier in the main report.
- The 545%-markup correction is accurately credited. A 545% markup corresponds to an 84.5% margin.
- The actual screenshot capture path timed out twice in headless Chrome. The screenshot-risk test therefore uses the deployed DOM order, default collapsed state, exact application strings, and deterministic engine replay rather than a captured bitmap.

## CONFIDENCE & AMBIGUITIES

**Confidence: high** for deployed text, code behavior, arithmetic, preset provenance, and corpus-to-page comparison.

Unresolved ambiguities:

- The `$4/1Mt` post does not identify token class.
- “Except maybe at 100% utilization” may refer to subscription-allowance consumption rather than fleet utilization; the corpus fragment does not settle the operational denominator.
- The archived “They can go for 99% margins …” item is incomplete and cannot establish subject or perimeter.
- Several short replies have limited parent-thread context in the archived sweep.
- The audit is bounded to the page-selected corpus and does not establish completeness against the account’s full timeline.