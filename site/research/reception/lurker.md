## VERDICT-FREE SUMMARY OF WHAT WAS CHECKED

The frozen live calculator was tested at 1440×900 and across 320–412 px mobile widths. The default Claude Opus 4.x scenario, hero, position dossier, methods disclosure, report §10, release footer, stylesheet, grounding ledger, and methods annex were sampled without an exhaustive first-pass reading.

The default rendered 76.8% under the Evidence-median perspective. The footer confirmed methodology v2.1.2 and engine v2.1.2-2026-07-11, but did not expose the supplied Cloudflare deployment or git identifiers.

This is an LLM information-architecture audit, not a human comprehension test; the site's 5-human-reader gate remains open.

## FINDINGS

### 1. [P0] Mobile perspective selector causes document-wide horizontal overflow

- **Exact target:** [`#persp-preset`](https://inference-margins.pages.dev/#persp-preset), displaying `[lens] Evidence median (Claude)`.
- **Source locator:** The deployed [`styles.css`](https://inference-margins.pages.dev/styles.css) gives preset selects a minimum width but supplies no mobile width constraint.
- **Failure class:** Broken responsive behavior / obstructed input affordance.
- **Objection:** At 320, 360, 390, and 412 px viewports, the selector remained 425 px wide. At 390 px, its right edge was 460 px and `document.documentElement.scrollWidth` was 460 px. The dropdown arrow and part of the control therefore sat outside the viewport and introduced unintended horizontal panning.
- **Exact UI change:**

```css
@media (max-width: 700px) {
  .preset-group {
    width: 100%;
    min-width: 0;
  }

  .preset-bar select {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
}
```

- **Deterministic acceptance test:** At viewport widths 320, 360, 390, and 412, assert both `document.documentElement.scrollWidth === window.innerWidth` and `#persp-preset.getBoundingClientRect().right <= window.innerWidth - 35`.

### 2. [P1] Standalone hero tile collapses a conditional scenario into an apparently general margin claim

- **Exact target:** The first `.tile-hero`, headed `Serving contribution margin`, with value 76.8%.
- **Source locator:** The [position dossier](https://inference-margins.pages.dev/#dossier) classifies the 300B active-parameter value as speculation and the rental basis as a community estimate. The [grounding ledger](https://inference-margins.pages.dev/research/grounding-ledger.html) records the same classifications, while [§7](https://inference-margins.pages.dev/#s7) distinguishes direct-serving contribution from business-level gross margin.
- **Failure class:** Screenshot-scope collapse / missing caveat at point of use.
- **Objection:** A tile-only crop loses the model identity, list-price scope, direct-serving perimeter, and the two dominant uncertain inputs. “Between the bull and skeptic camps” can also resemble a consensus classification rather than a comparison against selected public claims.
- **Exact UI change:** The tile’s complete in-crop text becomes:

> SCENARIO ESTIMATE · CLAUDE OPUS 4.x  
> List-price direct-serving contribution margin  
> 76.8%  
> Not audited gross margin · 300B active (SPECULATION) · neocloud GPU-hour basis (COMMUNITY ESTIMATE)

  The model name, values, and evidence classes should update dynamically with preset changes.
- **Deterministic acceptance test:** Under the frozen default, `.tile-hero` must contain the strings `SCENARIO ESTIMATE`, `CLAUDE OPUS 4.x`, `List-price direct-serving contribution margin`, `Not audited gross margin`, `300B active (SPECULATION)`, and `GPU-hour basis (COMMUNITY ESTIMATE)`.

### 3. [P1] The masthead overgeneralizes what is anchor-fitted

- **Exact passage:** `Defaults are per-platform anchor fits to public measurements`.
- **Source locator:** The [LOAO methods note](https://inference-margins.pages.dev/research/methods-loao.html) limits “anchor fits” to per-platform effective-MFU values and states that unanchored platforms remain analyst estimates. The [grounding ledger](https://inference-margins.pages.dev/research/grounding-ledger.html) labels model architecture, utilization, latency regime, discounts, and other defaults as speculation or community estimates.
- **Failure class:** Observed-versus-estimated scope ambiguity.
- **Objection:** Before opening the dossier, the sentence can be read as saying that the calculator’s defaults generally derive from measurements. Only one subset—hardware throughput-efficiency coefficients—has that status.
- **Exact replacement wording:**

> Hardware throughput-efficiency defaults are per-platform anchor fits to public measurements. Model size, fleet mix, utilization, procurement, pricing, and workload inputs have separate evidence labels and are often estimates or speculation.

- **Deterministic acceptance test:** The masthead must contain that complete replacement and must not contain `Defaults are per-platform anchor fits to public measurements`.

### 4. [P1] “Evidence median” gives an empirical information scent to a mixed-evidence analyst scenario

- **Exact target:** [`#persp-preset`](https://inference-margins.pages.dev/#persp-preset), option `[lens] Evidence median (Claude)`.
- **Source locator:** Its authoritative [grounding-ledger entry](https://inference-margins.pages.dev/research/grounding-ledger.html) labels rental basis, rental multiplier, and stack efficiency as community estimates, while utilization, interactivity, batch share, and discount are speculation.
- **Failure class:** Epistemic-label mismatch.
- **Objection:** “Evidence median” initially suggests a median computed from observed or disclosed values. The dossier instead describes an analyst synthesis containing several judgmental defaults.
- **Exact UI change:** The option label becomes:

> [scenario] Analyst synthesis (mixed evidence)

  A helper line immediately below the selectors becomes:

> Selected scenario evidence: disclosed prices; estimated architecture, procurement, utilization, serving stack, and workload. Row-level evidence labels are in the position dossier.

- **Deterministic acceptance test:** The selected option must equal `[scenario] Analyst synthesis (mixed evidence)` and the preset bar must visibly contain the complete helper sentence before the dossier is expanded.

### 5. [P0] The release footer does not identify the frozen deployment it purportedly manifests

- **Exact passage:** `Release manifest: methodology v2.1.2`.
- **Source locator:** The live [footer](https://inference-margins.pages.dev/) exposes methodology, engine, data date, and test links. The [changelog](https://inference-margins.pages.dev/research/changelog.html) says the footer carries a release manifest, but neither live artifact exposes `201b22a7` or `9f1fd0f`.
- **Failure class:** Broken provenance/reproducibility behavior.
- **Objection:** The supplied audit target identifies Cloudflare deploy 201b22a7 and git 9f1fd0f, but those identifiers cannot be independently matched to the live page. A subsequent deploy retaining the same engine string would be indistinguishable from the frozen target.
- **Exact replacement wording:**

> Release manifest: Cloudflare deploy 201b22a7 · git 9f1fd0f · methodology v2.1.2 · engine v2.1.2-2026-07-11 · data as of 2026-07-11.

- **Deterministic acceptance test:** Footer text must contain all five exact strings: `Cloudflare deploy 201b22a7`, `git 9f1fd0f`, `methodology v2.1.2`, `engine v2.1.2-2026-07-11`, and `data as of 2026-07-11`.

## QT-SCREENSHOT

- **Worst crop:** Desktop viewport 1440×900; crop the standalone hero tile at approximately `x=120, y=465, width=230, height=277`. The corresponding mobile crop is `x=20, y=1082, width=350, height=221`.
- **Hostile quote-tweet caption:** “AI labs pocket 76.8% of every token.”
- **Context lost:** Claude Opus 4.x scenario identity; list-price rather than realized company revenue; direct-serving contribution rather than audited gross margin; 300B active-parameter speculation; neocloud GPU-hour valuation; 50% utilization; excluded R&D, support, idle reservations, revenue shares, and traffic-mix uncertainty.
- **Required inside the crop:** `SCENARIO ESTIMATE · CLAUDE OPUS 4.x`, `List-price direct-serving contribution margin`, `Not audited gross margin`, `300B active (SPECULATION)`, and `neocloud GPU-hour basis (COMMUNITY ESTIMATE)`.
- **Hero-only determination:** Yes. The current standalone tile materially overstates the generality and evidentiary status of 76.8%.

## COMPREHENSION/REPRO NOTES

### Navigation path

1. Expanded the position dossier.
2. Expanded the methods box.
3. Selected `Full report ↓`.
4. Selected the §10 table-of-contents link.
5. Expanded the first §10 provider card.

No annex was read before interaction 1. The ledger and methods annex were checked only after the information-scent pass.

### Question extraction

| Question | Complete answer located after | Location | Extracted answer |
|---|---:|---|---|
| Which assumptions dominate? | 2 interactions | Dossier, then methods box | Active parameters and the procurement/GPU-hour valuation lens. The dossier identifies 300B active as the load-bearing architectural guess; the methods box ranks the cost lens above individual sliders. |
| Which parts are observed versus assumed? | 1 interaction | Position dossier | Row-level `DISCLOSED`, `COMMUNITY ESTIMATE`, and `SPECULATION` labels separate prices from estimated architecture and operating assumptions. |
| What would change the page’s mind? | 1 interaction | Position dossier | Active-parameter disclosure, incompatible serving-speed evidence, or evidence about actual blended chip-hour cost. Interaction 5 cross-checked the same structure in §10’s provider-specific update conditions. |

### First-glance misreadings

- The masthead and “Evidence median” label initially suggested that most default inputs were measurement-derived.
- The active-parameter sensitivity chart suggested that model size was the sole dominant uncertainty; procurement dominance became explicit only after the methods box was expanded.
- The hero’s “bull and skeptic camps” classification initially resembled a consensus interval.
- “Serving contribution margin” could become company gross margin when detached from the masthead.
- Before the dossier expansion, no visible hero content indicated what evidence would falsify the result.

### Mobile delta

At 390×844, the hero began at approximately `y=1082`, below the initial viewport. The dossier began at `y=839`, effectively requiring one scroll before its summary could be tapped. The complete comprehension answer therefore required two interactions on mobile rather than one, excluding the unintended horizontal pan caused by the perspective selector.

No contradiction found in this corpus between the default dossier, the authoritative grounding ledger, and the sampled §10 update conditions.

## CONFIDENCE & AMBIGUITIES

**Confidence: high.**

Unresolved ambiguities:

- The supplied Cloudflare deployment and git identifiers could not be independently verified from the live site because neither appeared in the retrieved HTML, scripts, stylesheet, annex index, or changelog.
- Exact pixel positions may shift slightly with browser font metrics, but the mobile overflow values were deterministic across four tested viewport widths.
- The protocol assessed information scent and internal evidence labeling, not the substantive truth of every underlying cost estimate or citation.
