## VERDICT-FREE SUMMARY OF WHAT WAS CHECKED

The deployed `index.html`, `engine.js`, and `app.js` byte-match local git `9f1fd0f`. The review covered the headline tiles and tooltips, methods box, §§5–7 and §10, calculator arithmetic, provider annexes, source sweeps, and both release suites.

The principal accounting objects examined were:

- Unit direct-serving contribution margin versus company gross margin.
- List-price revenue versus realized billings.
- Busy-accelerator cost versus utilization-allocated capacity cost.
- Sensitivity analysis versus an accounting reconciliation.
- Reported, projected, estimated, and social-media margin figures.
- Standalone screenshot safety.

No contradiction found in this corpus for two specifically requested points:

- The [xAI annex](https://inference-margins.pages.dev/research/xai-gptpro.html) labels the 44.3% figure as an AI-segment accounting margin, identifies the segment’s mixed revenue perimeter, and says it is not Grok serving margin.
- The [$5B spend → $15B ARR passage](https://inference-margins.pages.dev/#s7) is expressly labeled a spend-to-revenue multiple rather than a margin.

## FINDINGS

### 1. [P0] “List-price” contradicts the calculator’s actual denominator

- **Page passage:** Masthead and methods box: “**list-price direct-serving contribution margin**” and “1 − direct serving cost ÷ **realized billings**.”
- **Source locator:** [`workload()` in deployed engine.js](https://inference-margins.pages.dev/engine.js) calculates `priceMix = priceMixList × batch-discount factor × negotiated-discount factor`, then calculates margin using `priceMix`, not `priceMixList`.
- **Failure class:** Revenue-basis misstatement / internally contradictory metric definition.
- **Severity:** **P0 — factual error.** The frozen default has $3.71875/Mtok before batch and negotiated discounts but $3.26785156/Mtok realized. It is therefore not a list-price margin.
- **Exact replacement wording:**

  > **Metric:** modeled unit direct-serving contribution margin = 1 − modeled direct-serving cost ÷ realized billings for the selected workload. “Realized billings” reflects the selected cache pricing, batch share, and negotiated discount. It is a list-price metric only when batch share and negotiated discount are both 0%.

  Replace the masthead’s canonical name with:

  > **modeled unit direct-serving contribution margin at selected realized prices**

- **Deterministic acceptance test:** Select `Claude Opus 4.x` · `[lens] Evidence median (Claude)` · `Reference 15:1 / 60%`. The realized-price tile must show `$3.268`, and no visible label may call the resulting `76.8%` a list-price margin. Setting batch share and average discount to `0%` must change the price to `$3.719`.

### 2. [P0] Idle capacity is simultaneously included and declared excluded

- **Page passages:**
  - Methods box: “excludes support, **idle reservations**, R&D, sales, and revenue shares.”
  - Margin tooltip: “covers accelerator time, **occupancy** … NOT … **idle reservations**.”
  - Utilization tooltip: “Share of paid GPU-hours doing revenue work. Fleets are provisioned for peak; nights/weekends and failover idle the rest. **Divide all costs by this.**”
  - [§7 utilization row](https://inference-margins.pages.dev/#s7): “the unit math assumes a busy GPU.”
- **Source locator:** [`costPerMtok()` in engine.js](https://inference-margins.pages.dev/engine.js) divides hourly cost by `util / 100`. The default utilization is 50%, so paid slack is already allocated to served tokens.
- **Failure class:** Cost-perimeter contradiction.
- **Severity:** **P0 — factual error.** The default does not merely price a busy GPU; it doubles busy-hour cost to allocate 50% utilization.
- **Exact replacement wording:**

  > **Cost perimeter:** modeled direct-serving cost includes accelerator rental or modeled TCO, serving-stack throughput, and paid-capacity slack allocated through the utilization divisor. It does not separately model customer support, R&D, sales, revenue shares, free traffic, or unbilled retry and storage costs. It is neither company COGS nor company gross margin.

  Tooltip addition:

  > Cost includes paid idle, failover, and peak-provisioning capacity through the utilization divisor; no separate idle-reservation exclusion is applied.

- **Deterministic acceptance test:** Under the frozen default, changing utilization from `50%` to `25%` must change blended cost from `$0.758849` to `$1.517698`. The methods box and tooltip must contain no claim that idle reservations are excluded.

### 3. [P0] §7’s dollar bridge uses stale default values

- **Page passage:** [§7](https://inference-margins.pages.dev/#s7): “≈$3.10 realized after the batch/discount defaults,” “$0.31–0.62,” and “direct serving cost (~$0.3–0.7/Mtok at the deployed defaults).”
- **Source locator:** The frozen [`DEFAULTS`, `workload()`, and Opus preset](https://inference-margins.pages.dev/engine.js) produce:
  - List billings: `$3.71875000`
  - Realized billings: `$3.26785156`
  - Direct-serving cost: `$0.75884898`
  - Margin: `76.778352%`
- **Failure class:** Stale prose arithmetic / calculator-report drift.
- **Severity:** **P0 — factual error.**
- **Exact replacement wording:**

  > At the Opus evidence-median default—Reference 15:1/60%, 15% batch share, and 5% average discount—1M blended tokens bill $3.71875 before discounting and $3.26785 realized; modeled direct-serving cost is $0.75885. At that fixed denominator, one percentage point is $0.03268/Mtok, and a notional 10–20-point cost increase is $0.32679–$0.65357/Mtok. These are scenario conversions, not an accounting reconciliation.

- **Deterministic acceptance test:** The default tiles must show `76.8%`, `$0.759`, and `$3.268`. The §7 paragraph must contain `$3.26785`, `$0.75885`, and `$0.32679–$0.65357`; `$3.10` and `$0.31–0.62` must be absent.

### 4. [P1] The “non-additive bridge” is a sensitivity map, not a bridge

- **Page passage:** [§7](https://inference-margins.pages.dev/#s7): “The bridge from ~90% unit margins down to ~40–70% books … **Illustrative and non-additive**.”
- **Source locator:** The [archived Anthropic consultation](https://inference-margins.pages.dev/research/gptpro-consult-anthropic-verbatim.html) defines company gross margin using all realized revenue and all allocated cost of revenue. The calculator lacks those population totals and accounting policies.
- **Failure class:** Non-reconciling sensitivities presented in bridge form.
- **Severity:** **P1 — materially misleading framing.** “Non-additive” correctly warns against summing the rows, but the word “bridge,” ordered point ranges, and dollar conversion still invite exactly that use. Utilization, discounts, cache mix, and procurement cost are already represented in the headline scenario. The cloud row also combines cost-side procurement markup with revenue-side marketplace sharing.
- **Exact UI change:**
  - Rename the section:

    > **Sensitivity and perimeter map — not an accounting reconciliation**

  - Replace the introduction with:

    > The following rows identify one-at-a-time sensitivities and items outside the calculator. Several are already embedded in the selected unit result. The ranges must not be added or subtracted from the headline, and they do not reconcile unit contribution margin to company gross margin.

  - Add a column named `Already represented in calculator?`.
  - Split “Cloud markup” into:
    - `Compute procurement markup — cost-side; represented by cost lens/rent multiplier`
    - `Marketplace or channel revenue share — revenue-side; outside the calculator`
- **Deterministic acceptance test:** `#s7` must contain `Sensitivity and perimeter map — not an accounting reconciliation` and the column `Already represented in calculator?`. No row may combine procurement cost and `30–40%` channel revenue sharing.

### 5. [P1] Heterogeneous margin observations are converted into a false time series

- **Page passage:** [§7](https://inference-margins.pages.dev/#s7): “The trajectory — deeply negative (2024) → ~40% planned (2025) → ~44% estimated (mid-2026), with bulls like Zephyr already seeing 70% — is the margin ladder being climbed in public.”
- **Source locators:**
  - The [archived source sweep](https://inference-margins.pages.dev/research/grok-sweep-margin-claims.html) explicitly classifies these as different objects and says the corpus does not establish consensus.
  - The [verbatim Anthropic consultation](https://inference-margins.pages.dev/research/gptpro-consult-anthropic-verbatim.html) cautions that PitchBook’s “compute spend” may not equal accounting cost of revenue.
- **Failure class:** Cross-source/perimeter comparability error.
- **Severity:** **P1 — materially misleading framing.** The individual clauses contain some labels, but the concluding “trajectory” treats a third-party historical estimate, a reported internal projection, a compute-spend-derived estimate, and a social-media claim as one series.
- **Exact replacement wording:**

  > These observations are not a time series and should not be read as a common-perimeter “margin ladder”: −94% is SemiAnalysis’s estimate of 2024 company gross margin; 40% is a reported internal projection for 2025; 44% is a PitchBook/Morningstar estimate associated with projected Q2 compute spend of $0.56 per revenue dollar, and compute spend is not necessarily accounting cost of revenue; 70% is Zephyr’s mid-2026 social-media company-GM claim. Differences among them can reflect perimeter, source method, and forecast status as well as operating improvement.

- **Deterministic acceptance test:** `#s7` must contain `These observations are not a time series`. The phrases `margin ladder` and `trajectory — deeply negative` must be absent.

### 6. [P1] The hero and collapsed §10 cards remain unsafe as standalone business-margin claims

- **Page passages:**
  - Hero: “**Serving contribution margin**” followed by a 48px percentage.
  - Dynamic hero note: “between the bull and skeptic camps” or “in the skeptic (**reported-margin**) zone.”
  - [§10 collapsed summaries](https://inference-margins.pages.dev/#s10): provider name followed by `~94%`, `~96%`, `~67%`, etc.; the metric qualification is hidden inside the collapsed body.
  - §10 normalized table header: “Blended margin.”
- **Source locator:** [`updateTiles()` in app.js](https://inference-margins.pages.dev/app.js) generates the cross-perimeter camp classifications. The [§10 introduction](https://inference-margins.pages.dev/#s10) itself states that the cards use provider-specific workloads and lenses and are not directly rankable.
- **Failure class:** Screenshot-context failure / unit-to-business metric leakage.
- **Severity:** **P1 — materially misleading at the point of use.**
- **Exact UI change:**
  - Hero label:

    > **Unit serving CM — not company GM**

  - Hero subline:

    > Realized billings less modeled direct-serving cost for the selected workload.

  - Remove all `bull`, `skeptic`, and `reported-margin zone` classifications from `updateTiles()`.
  - Prefix every collapsed §10 number with `unit serving CM`; use `output-token CM` for Moonshot.
  - Rename the normalized-table column to:

    > **Unit serving CM — common modeled lens**

  - Replace the meta description’s “implied gross margins” with:

    > **implied unit direct-serving contribution margins—not company gross margins**
- **Deterministic acceptance test:** The default hero must visibly contain `Unit serving CM — not company GM`. Searching deployed `app.js` must return no occurrences of `reported-margin zone`, `bull and skeptic`, or `skeptic camps`. Every collapsed `.prov-margin` must visibly include either `unit serving CM` or `output-token CM`.

## QT-SCREENSHOT

- **Single worst item:** The default hero tile showing `Serving contribution margin` / `76.8%` / `between the bull and skeptic camps`.
- **Viewport and crop:** Mobile viewport `390×844`; scroll until the hero tile reaches the top, then crop approximately `350×145` around that tile alone. The subtitle, adjacent cost and realized-price tiles, and collapsed methods box fall outside the crop.
- **Hostile quote-tweet caption:**

  > “Anthropic’s margin is 76.8%—the lab is printing money while charging frontier-model prices.”

- **Context lost:** The number is a modeled per-token contribution margin, uses selected realized billings, allocates paid slack through utilization, excludes several company-level expenses, and is not an audited provider ledger or company gross margin.
- **Required content inside the crop:**

  > **UNIT SERVING CM — NOT COMPANY GM**  
  > **76.8%**  
  > `$3.268 realized billings − $0.759 modeled direct-serving cost per 1M blended tokens; includes utilization-allocated slack.`

The “not company GM” qualification and both denominator/cost values must remain inside the same tile rather than in a tooltip or collapsed methods box.

## COMPREHENSION/REPRO NOTES

- The frozen default was independently reconstructed as `76.778352%` from `$3.26785156` realized billings and `$0.75884898` modeled cost.
- `snapshots.test.mjs` and `traffic-contract.test.mjs` both pass. Neither suite validates the static §7 prose, accounting terminology, meta description, or screenshot-visible DOM labels, so the identified defects do not conflict with the green release suites.
- The deployed asset hashes match local git `9f1fd0f`.
- Headless Chrome failed twice to emit a screenshot. The QT test therefore uses deployed DOM, responsive CSS, and deterministic rendered values rather than a claimed visual capture.

## CONFIDENCE & AMBIGUITIES

**Confidence: high.** The three P0 findings are directly reproducible from frozen engine values and deployed wording.

**Unresolved ambiguities:**

- Anthropic’s detailed COGS recognition and cost-classification policies are not public.
- The intended meaning of “idle reservations” may have been capacity outside the modeled utilization pool, but the page does not define such a second pool.
- “Realized billings” models rates applied to tokens; it does not model revenue-recognition timing, credits, bad debt, commitments, or minimum-spend contracts.
- The PitchBook page blocked direct retrieval during this audit; its treatment is based on the archived verbatim consultation and linked source metadata.
- The browser-render screenshot could not be captured, leaving exact pixel wrapping unverified.