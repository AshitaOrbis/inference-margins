# VERDICT-FREE SUMMARY OF WHAT WAS CHECKED

The audit checked the frozen deployment’s §1, §2b, §7, §10 xAI card, interactive Zephyr perspective, expanded dossier, result tile, grounding ledger, Grok sweep, OpenAI/xAI annex dives, and the separate GPT-5.6 Pro consultation. The footer reports engine `v2.1.2-2026-07-11`.

## Stage 1: direct Zephyr claims

| Date | Exact archived wording | Scope supported by the wording |
|---|---|---|
| 2026-07-08 | “At least xAI isn't juicing up the gross margins to 90%-95% and scamming consumers / Although the cached token could be cheaper” | xAI is the only named lab. The comparison labs are unnamed. “Unit margin” is a plausible inference from the linked Grok 4.5 token-pricing context, but neither “unit” nor Anthropic appears in the post. This is Zephyr’s own allegation about pricing and margins, not Zephyr reporting another analyst’s allegation. [Direct post](https://x.com/zephyr_z9/status/2074917201589727588); [archived sweep](https://inference-margins.pages.dev/research/grok-sweep-margin-claims.html). |
| 2026-06-24 | “70% GM and 15%-20% FCF margin / Damn / Anthropic is printing cash now” | Anthropic is explicit. The FCF reference makes this a company-level economic claim, not a warm-token contribution-margin claim. The linked object is a “26H1 Update,” while the post’s “now” wording supplies only a mid-2026 temporal basis. [Direct post](https://x.com/zephyr_z9/status/2069832997218722140); [archived sweep](https://inference-margins.pages.dev/research/grok-sweep-margin-claims.html). |
| 2026-06-27 | “$50B-$60B this year / over $110B next year / 75%-80% GM” | This is a later company-margin estimate, but the visible text does not name the company. The sweep itself says the parent context needs confirmation. It cannot independently establish an Anthropic scope. [Direct post](https://x.com/zephyr_z9/status/2070727375386718259). |

Both headline numbers are attributable to the same account at different dates. The archived corpus does **not** directly establish that the 90–95% allegation concerns Anthropic, or that Zephyr explicitly called it a unit margin. It does directly establish Anthropic at approximately 70% GM and 15–20% FCF.

The corpus is circularly bounded: it consists of material selected and archived by the page’s own research process. “No contradiction found in this corpus” therefore means no contradiction within that selected archive, not an exhaustive finding about Zephyr’s full publication history.

## Claim-to-page matrix

| Page representation | Classification | Basis |
|---|---|---|
| Grok sweep verbatim July 8 quotation | directly-entailed | Exact wording appears in the direct post. |
| Grok sweep “Frontier/Anthropic-style gross margins 90–95%” | over-broad | “Anthropic-style” is supplied by the sweep, not the quotation. |
| Grok sweep quick index, “western serving margins” | over-broad | The post names xAI but no western comparison lab. |
| [§1](https://inference-margins.pages.dev/#s1), “makes the same claim” | over-broad | “Same claim” points back to an explicitly Anthropic unit-serving claim that the cited Zephyr post does not explicitly make. |
| §1, Anthropic at ~70% GM and 15–20% FCF | directly-entailed | Company and figures are explicit in the June 24 post. |
| §1, “90–95% on the unit, ~70% on the books” | compatible-unsupported | Same-account coexistence is supported; same-company and explicit unit scope are not. |
| §2b, OAI “~100B active” and Opus/Fable highest | directly-entailed | Both propositions appear in the July 9 post. |
| [§7](https://inference-margins.pages.dev/#s7), Zephyr’s mid-2026 70%/15–20% read | directly-entailed | Correct company, values, and approximate date. |
| Perspective option `[analyst] Zephyr (90–95% GM)` | over-broad | The label omits unnamed-lab scope and does not say reconstruction. |
| Expanded [position dossier](https://inference-margins.pages.dev/#dossier), parameter table | labeled-reconstruction | The expanded panel explicitly says the page chose the values and labels the rows as speculation. |
| Expanded dossier, “simultaneously holds ~90–95% unit margins and ~70% company GM” | over-broad | The first scope and target are not explicit in the cited post. |
| Result tile, “TeorTaxes/Zephyr 90–95% zone” | over-broad | The attribution is applied mechanically to any model result at or above 90%. |
| [Grounding ledger](https://inference-margins.pages.dev/research/grounding-ledger.html), Zephyr vector | labeled-reconstruction | The page-level title says reconstruction and rows say speculation, but the local heading and “source” language weaken that labeling. |
| [OpenAI dive](https://inference-margins.pages.dev/research/openai-gptpro.html), ~100B active | directly-entailed | The quoted Zephyr estimate is approximately 100B and is visibly labeled community estimate. |
| [§10 xAI card](https://inference-margins.pages.dev/#prov-xai) and [xAI dive](https://inference-margins.pages.dev/research/xai-gptpro.html) | labeled-reconstruction | The Zephyr implication is separated from the page’s three modeled cost lenses. |
| [Separate GPT-5.6 Pro consultation](https://inference-margins.pages.dev/research/gptpro-consult-anthropic-verbatim.html), “approximately 95%” | compatible-unsupported | A different June 24 post mentions “Anthropic/OAI tactics,” but public text truncates before the numerical completion; the consultation itself flags incomplete context. |

No `contradicted` representation was found. The principal failures are over-breadth, unsupported scope completion, and reconstruction labeling that disappears at the point of use.

# FINDINGS

## 1. [P0] The Grok sweep inserts an Anthropic/western scope absent from the quoted post

- **Page passage:** Under “Zephyr — direct margin / serving economics posts,” the “Numbers” cell says: “Frontier/Anthropic-style gross margins 90%–95%.” The quick index calls the same post evidence for “western serving margins.”
- **Source locator:** [July 8 direct post](https://x.com/zephyr_z9/status/2074917201589727588); [archived sweep](https://inference-margins.pages.dev/research/grok-sweep-margin-claims.html).
- **Failure class:** Misattribution through scope expansion.
- **Why it fails:** The quotation names xAI and no comparison lab. “Anthropic-style” and “western” are research-layer additions. This matters because those additions subsequently support §1’s Anthropic coexistence framing.
- **Exact replacement wording:**
  - Replace the “Numbers” cell with:  
    **“Unspecified non-xAI providers: alleged 90–95% gross margins. xAI is the explicit contrast. The post does not name Anthropic, OpenAI, or another comparison lab and does not use the term ‘unit margin.’”**
  - Replace the quick-index label with:  
    **“90–95% gross-margin allegation against unspecified non-xAI providers:”**
- **Deterministic acceptance test:** The deployed annex must contain `The post does not name Anthropic, OpenAI, or another comparison lab`; it must contain no `Frontier/Anthropic-style` string and no Zephyr citation inside a row or list item labeled `western serving margins`.

## 2. [P0] §1 turns an unnamed-lab allegation into “the same” Anthropic unit-margin claim

- **Page passage:** [§1](https://inference-margins.pages.dev/#s1): “Zephyr makes the same claim from the semis side” and “Note those two numbers coexisting in one analyst's head: 90–95% on the unit, ~70% on the books.”
- **Source locator:** [July 8 post](https://x.com/zephyr_z9/status/2074917201589727588) versus [June 24 Anthropic post](https://x.com/zephyr_z9/status/2069832997218722140).
- **Failure class:** Target and metric-scope conflation.
- **Why it fails:** The corpus supports two numbers from the same account. It does not directly support both as Anthropic numbers, and the July 8 post does not explicitly identify a unit-margin perimeter.
- **Exact replacement wording:**

  > **“Zephyr makes a related pricing allegation from the semis side: a Jul. 8, 2026 post says xAI is not ‘juicing up the gross margins to 90%–95%,’ but does not name the comparison labs or explicitly define the metric as unit serving margin. Separately, a Jun. 24 post explicitly places Anthropic at approximately 70% company gross margin and 15–20% FCF margin. The two figures therefore coexist in the same account’s posts, but this corpus does not establish that the 90–95% figure is an Anthropic-specific estimate.”**

- **Deterministic acceptance test:** At `#s1`, the strings `does not name the comparison labs` and `does not establish that the 90–95% figure is an Anthropic-specific estimate` must appear. The strings `makes the same claim` and `coexisting in one analyst's head` must not appear.

## 3. [P0] The expanded dossier falsely says both metric scopes were explicit

- **Page passage:** The [expanded dossier](https://inference-margins.pages.dev/#dossier) says:
  - “who simultaneously holds ~90–95% unit margins and ~70% company GM”
  - “Unit and company margins are different questions (he says both explicitly)”
  - “his own ~70% company-GM view sets an internal consistency bound”
- **Source locator:** [July 8 post](https://x.com/zephyr_z9/status/2074917201589727588); [June 24 post](https://x.com/zephyr_z9/status/2069832997218722140).
- **Failure class:** False explicitness and unsupported internal-consistency claim.
- **Why it fails:** Company scope is explicit for the 70% post. Unit scope and Anthropic target are not explicit for the 90–95% post. Without a shared target, the 70% figure cannot operate as an “internal consistency bound” on the 90–95% statement.
- **Exact replacement wording:**
  - Replace the dossier identity sentence with:  
    **“The semis-side position: Zephyr alleges that unspecified non-xAI providers run 90–95% gross margins and separately places Anthropic at approximately 70% company GM.”**
  - Replace the assumption with:  
    **“The page interprets the July 8 pricing post as a unit-serving-margin claim; Zephyr’s wording does not explicitly define that perimeter.”**
  - Replace the falsifier text with:  
    **“Evidence identifying the providers and accounting perimeter behind the 90–95% allegation would update this reconstruction.”**
- **Deterministic acceptance test:** After selecting the Zephyr perspective and expanding `#dossier`, none of `simultaneously holds`, `he says both explicitly`, or `internal consistency bound` may appear. The exact sentence beginning `The page interprets` must appear.

## 4. [P1] Reconstruction labeling is not visible everywhere the named vector appears

- **Page passage/UI:** The collapsed selector says `[analyst] Zephyr (90–95% GM)`. The [grounding-ledger](https://inference-margins.pages.dev/research/grounding-ledger.html) local heading repeats it above `rentMult 0.9`, `util 65`, and `stackMult 1.15`. Sources include “Slightly below neocloud (semis-market insight)” and “Implied by position.”
- **Source locator:** [Direct July 8 post](https://x.com/zephyr_z9/status/2074917201589727588), which supplies none of those parameter values; expanded [dossier](https://inference-margins.pages.dev/#dossier), which already admits that the source never chose them.
- **Failure class:** Missing caveat at point of use; source/reconstruction boundary slippage.
- **Why it fails:** The reconstruction disclosure exists only after expansion or at the top of a long ledger. The named dropdown, collapsed preset note, and local ledger heading can be captured without it. “Semis-market insight” also sounds source-derived despite having no cited Zephyr support.
- **Exact UI and wording changes:**
  - Rename the selector and ledger heading to:  
    **`[reconstruction] Zephyr — unnamed-lab 90–95% allegation`**
  - Add an always-visible badge immediately below the selector:  
    **“PAGE-AUTHORED RECONSTRUCTION — Zephyr supplied only the quoted margin allegation. The 0.90× rental multiplier, 65% utilization, 1.15× stack multiplier, batch setting, 10% batch share, and 0% discount were chosen by this page.”**
  - Replace every vector “source” cell with the corresponding form:  
    **“Page-authored reconstruction; no [parameter] value stated in the cited post.”**
- **Deterministic acceptance test:** With `persp-preset=zephyr` and the dossier collapsed, the viewport must contain `PAGE-AUTHORED RECONSTRUCTION` and all three values `0.90×`, `65%`, and `1.15×`. The ledger’s Zephyr heading must begin `[reconstruction]`. No Zephyr row may use `semis-market insight` or `Implied by position` as its source.

## 5. [P1] The result tile mechanically attributes a site-defined margin band to Zephyr

- **Page passage/UI:** The deployed result logic emits: “in the TeorTaxes/Zephyr 90–95% zone” whenever any computed margin is at least 90%.
- **Source locator:** [Deployed app.js](https://inference-margins.pages.dev/app.js); [July 8 Zephyr post](https://x.com/zephyr_z9/status/2074917201589727588).
- **Failure class:** Cross-model attribution and screenshot-unsafe framing.
- **Why it fails:** The string can appear for models, fleets, traffic profiles, or parameter combinations never discussed by Zephyr. A threshold selected by the page becomes a named analyst’s “zone.”
- **Exact replacement wording:**  
  **“Modeled serving contribution margin: 90–95% band. This band is descriptive and is not attributed to any named analyst.”**
- **Deterministic acceptance test:** Force any compatible scenario to a margin between 90.0% and 95.0%. The tile must contain `not attributed to any named analyst`. The deployed JavaScript must contain no `TeorTaxes/Zephyr 90–95% zone` string.

# QT-SCREENSHOT

- **Single worst passage:** [§1](https://inference-margins.pages.dev/#s1), beginning “Zephyr makes the same claim” and ending “90–95% on the unit, ~70% on the books.”
- **Viewport/crop:** Desktop viewport approximately 1100×700; crop the article column from the Zephyr hyperlink through the end of that paragraph, excluding §1’s preceding definition and excluding the annex.
- **Hostile quote-tweet caption:**  
  **“This report puts an Anthropic 90–95% token-margin claim into Zephyr’s position even though its cited post names no comparison lab.”**
- **Context lost:** The 90–95% post is an xAI-pricing contrast against unnamed providers; the 70%/15–20% post explicitly concerns Anthropic at company level; the unit perimeter is inferred; the two posts are fourteen days apart.
- **Required content inside the crop:**  
  **“The July 8 post does not name Anthropic or another comparison lab, and ‘unit serving margin’ is the page’s interpretation. The June 24 post separately names Anthropic at ~70% company GM and 15–20% FCF.”**

# COMPREHENSION/REPRO NOTES

- The Zephyr perspective currently resolves to `rentMult=0.9`, `util=65`, `stackMult=1.15`, `interact=batch`, `batchShare=10`, and `discount=0`.
- Under Claude Opus with the native 15:1 / 60% traffic profile, that vector produces approximately **88.709%**, not 90–95%. The perspective name therefore describes the motivating allegation rather than a deterministic replay of its headline range.
- The expanded dossier correctly contains: “Reconstruction — only the quoted claim is the source's; the parameter translation into this calculator is this page's, and the source never chose these values.” The defect is its disappearance when the dossier is collapsed and its conflict with the dossier’s stronger “both explicitly” language.
- The §2b active-parameter attribution and §7 company-margin attribution produced no contradiction in this corpus.
- Two headless live-DOM dump attempts produced no output. Runtime claims were therefore checked against the deployed HTML/JavaScript, matching git commit `9f1fd0f`, and the Node-executed engine. Exact crop geometry remains approximate; the quoted deployed strings and computed values are deterministic.

# CONFIDENCE & AMBIGUITIES

**Confidence: high** for the textual attribution and reconstruction-label findings; **medium** for exact screenshot geometry.

Unresolved ambiguities:

- The comparison labs intended by the July 8 allegation remain unidentified.
- “Gross margins” likely refers to token-pricing economics in context, but the post does not explicitly say “unit serving contribution margin.”
- A separate archived consultation points to a June 24 post involving “Anthropic/OAI tactics” and approximately 95% GM, but its public text truncates before the numerical completion and the consultation flags incomplete context. It cannot deterministically repair §1’s cited-source mismatch.
- The exact accounting period underlying the 70% GM and 15–20% FCF statement is not stated in the post itself.