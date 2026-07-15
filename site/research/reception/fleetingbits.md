## VERDICT-FREE SUMMARY OF WHAT WAS CHECKED

The attribution corpus contains exactly one post. That is a thin basis for characterizing either the author’s complete position or a broader “camp”; the audit scope is therefore limited to faithfulness to that post.

Stage 1 extracted three claims from the [post archived in the annex](https://inference-margins.pages.dev/research/grok-sweep-margin-claims):

- The reported frontier-lab inference-margin figure is approximately 40–50%; the post asserts that this range has been reported repeatedly.
- Anthropic classifies cloud-provider commissions under sales and marketing.
- Consequently, its reported gross-margin cost base is described as being mostly inference compute.

The post does **not** specify `rentMult`, utilization, stack efficiency, batching, discounts, traffic mix, hardware, model architecture, or a unit-margin formula. It does not invert a reported margin into those parameters, endorse the calculator’s inversion, select a 21.6% scenario, or establish that every reported-margin skeptic shares one parameterized position.

Classification matrix:

| Classification | Audited representation |
|---|---|
| **Directly-entailed** | [§1](https://inference-margins.pages.dev/#s1) reproduces the post’s figure and accounting observation. [§7’s accounting-perimeter row](https://inference-margins.pages.dev/#s7) correctly explains that excluding commissions from COGS flatters reported gross margin. |
| **Compatible-unsupported** | The dossier’s characterization, “trust the income statement, not the token math,” is directionally compatible but not stated in the single-post corpus. |
| **Contradicted** | No contradiction found in this corpus. |
| **Over-broad** | “The counter-camp,” “reported-margin camp,” the hero’s “skeptic … zone,” and the margin tooltip turn one accounting-oriented post into a generalized unit-margin position. |
| **Labeled-reconstruction** | §7 and the expanded interactive dossier explicitly call the vector a reconstruction. The disclosure is not consistently adjacent to the selector, collapsed preset note, hero result, or individual grounding-ledger section. |

The [§10 normalized table](https://inference-margins.pages.dev/#s10-normalized) does not apply the Skeptic vector: it uses the evidence-median lens and contains no analyst-perspective row. No source-attribution objection arises there.

## FINDINGS

### 1. [P1] A one-post source is promoted into a named “camp”

- **Exact page passages:** [§1](https://inference-margins.pages.dev/#s1), “The counter-camp: @fleetingbits”; [§7](https://inference-margins.pages.dev/#s7), “the reported-margin camp appears here”; selector and [grounding ledger](https://inference-margins.pages.dev/research/grounding-ledger), `[analyst] Skeptic (reported-margin camp)`.
- **Source locator:** [The sole post](https://x.com/fleetingbits/status/2073528885149679622), preserved in the [annex row](https://inference-margins.pages.dev/research/grok-sweep-margin-claims).
- **Failure class:** **over-broad**.
- **Objection:** One observation can anchor a diagnostic, but it cannot establish a homogeneous camp or make its author the representative of a synthesized persona.
- **Exact replacement wording:**
  - §1: `One reported-margin objection: @fleetingbits —`
  - §7: `This page therefore includes a reported-margin diagnostic rather than treating any reported figure as a unique parameter set.`
  - Selector and ledger heading: `[reconstruction] Reported-margin diagnostic (single-post anchor)`
- **Deterministic acceptance test:**
  1. `#s1` contains `One reported-margin objection:`.
  2. The document contains neither `The counter-camp` nor `reported-margin camp appears here`.
  3. `#persp-preset option[value="skeptic"]` equals `[reconstruction] Reported-margin diagnostic (single-post anchor)`.
  4. The grounding ledger contains that same heading and no `[analyst] Skeptic (reported-margin camp)`.

### 2. [P1] The hero converts the reconstruction into a source-associated result outside the source’s range

- **Exact page passage/UI:** With Model `Claude Opus 4.x`, Perspective `[analyst] Skeptic (reported-margin camp)`, and Model-default traffic `Reference 15:1 / 60%`, the hero displays `21.6%` and `in the skeptic (reported-margin) zone`. The rendering logic appears in the deployed [app.js](https://inference-margins.pages.dev/app.js).
- **Source locator:** [The sole post](https://x.com/fleetingbits/status/2073528885149679622) supplies approximately 40–50%, not 21.6%, and supplies none of the selected parameters.
- **Failure class:** **over-broad**.
- **Objection:** The hero does not explicitly claim that the source calculated 21.6%, but the selected perspective and zone label create that practical implication. The expanded reconstruction disclaimer is outside the tile and can disappear from a screenshot.
- **Exact UI change:** When `perspective === "skeptic"`, place this text directly inside the hero tile beneath the value:

  `Site-authored scenario result — not a source estimate. Source claim: reported frontier-lab inference margins ≈40–50%; this value comes from the calculator’s reconstructed parameters.`

  Replace `in the skeptic (reported-margin) zone` with:

  `below 50% under this site-authored scenario`
- **Deterministic acceptance test:**
  1. Select `opus`, `skeptic`, and Model-default traffic.
  2. `#out-margin` remains `21.6%`.
  3. `#out-margin-note` contains the complete replacement disclaimer.
  4. `#out-margin-note` does not contain `skeptic (reported-margin) zone`.

### 3. [P1] Reconstruction labeling is strong when expanded but weak at the parameter point of use

- **Exact page passages:** The expanded dossier correctly says, `Reconstruction — only the quoted claim is the source's; the parameter translation into this calculator is this page's, and the source never chose these values.` By contrast, the visible preset note says, `fleetingbits: "frontier lab inference margins… ~40-50%"` immediately before `Hyperscaler-marked-up compute, low utilization, real discounting.` The [grounding ledger](https://inference-margins.pages.dev/research/grounding-ledger) lists `rentMult 1.6`, `util 35`, `stackMult 0.85`, `batchShare 25`, and `discount 20` under an `[analyst]` heading without an adjacent attribution boundary.
- **Source locator:** [The sole post and archived text](https://inference-margins.pages.dev/research/grok-sweep-margin-claims) contain none of those parameters or mechanisms.
- **Failure class:** **labeled-reconstruction, inconsistently surfaced**.
- **Objection:** The expanded dossier is sufficiently explicit; the collapsed/default presentation is not. Per-row `SPECULATION` and `COMMUNITY ESTIMATE` labels describe evidence quality but do not state that the named source never supplied the values.
- **Exact replacement wording**, placed at the start of the collapsed note and directly below the ledger heading:

  `ATTRIBUTION BOUNDARY — @fleetingbits supplied only the reported 40–50% figure and the cloud-commission accounting observation. Every parameter below is a calculator reconstruction; the source did not choose or endorse these values.`
- **Deterministic acceptance test:**
  1. Selecting `skeptic` makes `#preset-note` begin with the exact attribution-boundary string.
  2. In the grounding ledger, the first element following the diagnostic heading is a paragraph containing the exact string.
  3. That paragraph precedes the parameter table rather than following it.

### 4. [P1] The tooltip and dossier imply a unit-margin interpretation and inversion not supplied by the post

- **Exact page passages:** The margin tooltip defines `List-price direct-serving contribution margin` and then cites `fleetingbits: 40-50%`. The expanded dossier says `trust the income statement, not the token math`, assumes `The gap between unit math and books is mostly real cost`, and proposes falsification by `an audited COGS decomposition showing serving-only margins far above 50%`. These strings are in the deployed [engine.js](https://inference-margins.pages.dev/engine.js).
- **Source locator:** [The sole post](https://x.com/fleetingbits/status/2073528885149679622) gives an approximate reported figure and accounting-perimeter observation. It never defines “serving-only margin,” accepts the calculator’s formula, or states a parameter inversion.
- **Failure class:** **over-broad**.
- **Objection:** No sentence explicitly says the source endorses the unit-margin calculation. The tooltip nevertheless presents the source’s number as a comparator for that calculation, while the falsifier turns the reconstruction into an attributed serving-only hypothesis.
- **Exact replacement wording:**
  - Tooltip source line:

    `Reported-margin comparator: @fleetingbits gave an approximate 40–50% figure and noted Anthropic’s S&M treatment of cloud commissions; the post did not define this calculator’s direct-serving metric.`

  - Dossier identity:

    `Reported-margin diagnostic anchored to one @fleetingbits report/accounting observation; the parameter vector is the calculator’s reconstruction.`

  - Assumption:

    `The calculator tests whether higher procurement cost, lower occupancy, lower stack efficiency, batch mix, and discounts can produce lower margins; the source did not assert these mechanisms.`

  - Update condition:

    `Update this scenario when any modeled parameter is measured. Do not treat a failed inversion as falsification of the source post.`
- **Deterministic acceptance test:**
  1. The margin tooltip contains the exact replacement source line.
  2. The skeptic dossier contains the three replacement strings.
  3. The rendered page contains none of `trust the income statement, not the token math`, `mostly real cost, not accounting choice`, or `serving-only margins far above 50%`.

## QT-SCREENSHOT

- **Worst standalone crop:** A 480×260 crop of the first hero tile after selecting the Skeptic perspective, containing `Serving contribution margin`, `21.6%`, and `in the skeptic (reported-margin) zone`, while excluding the collapsed note and expanded dossier.
- **Hostile quote-tweet caption:** “The calculator turns a reported 40–50% observation into 21.6% and labels the result the skeptic position.”
- **Context lost:** The page-wide distinction between accounting gross margin and direct-serving contribution margin; the expanded reconstruction disclosure; the fact that the source supplied no parameters; and the source’s actual approximate range.
- **Required content inside the crop:** A persistent badge directly beneath the value:

  `SITE-AUTHORED RECONSTRUCTION · not source parameters · source report: ≈40–50%`

  The tile must also replace the zone label with `below 50% under this site-authored scenario`.

## COMPREHENSION/REPRO NOTES

- The fetched deployed `index.html`, `app.js`, and `engine.js` were byte-identical to local git `9f1fd0f`; the footer reports engine `v2.1.2-2026-07-11`.
- The deterministic Opus/Skeptic calculation is 21.6% at `rentMult=1.6`, `util=35`, `stackMult=0.85`, `batchShare=25`, `discount=20`, and Reference traffic `15:1 / 60%`.
- The same reconstruction produces 47.7% for Haiku. Therefore, the preset is not calibrated to reproduce the source’s 40–50% figure consistently across models; it is a scenario vector whose result depends on the selected model.
- §1’s verbatim attribution and §7’s accounting-perimeter explanation are source-faithful.
- §10’s normalized table uses the evidence-median lens, not the Skeptic reconstruction. Its omission of analyst perspectives is consistent with §7’s diagnostic-only framing.

## CONFIDENCE & AMBIGUITIES

**Confidence: high** on the quoted-page, parameter, rendered-value, and labeling findings; **medium** on the source’s intended technical perimeter.

Unresolved ambiguities:

- The single post does not formally define “inference margins” as accounting gross margin, unit token margin, or another contribution-margin perimeter. Its commission-classification sentence makes an accounting interpretation likely but not conclusive.
- The corpus contains no surrounding thread or follow-up from the source, so it cannot establish whether any parameterized unit-economics view exists elsewhere.
- The commission statement is not independently audited here; source-faithfulness requires preserving it as the post’s claim, not validating Anthropic’s accounting treatment.