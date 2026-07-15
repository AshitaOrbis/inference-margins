# Synthesis: inference-margins.pages.dev next revision

All four agents independently fetched the live page and its `engine.js`/`app.js`/research annex, and independently corroborated the same ground truth (10–11 model presets × 8 perspectives, the 37% mean / 59% worst LOAO failure that keeps the MFU model labeled an anchor-fit, OpenAI's 1.25× cache-write tariff, DeepSeek's disclosed 284B/13B). That cross-corroboration on the empirical base is itself a confidence signal — the disagreements below are about design, not facts.

## 1. Consensus

1. **Split the scenario ontology before adding any presets.** The current "perspectives" dropdown collapses incommensurable object types — model facts, workloads, cost-accounting lenses, procurement classes, benchmark operating points, an inverse constraint, and an alternative methodology — into one axis. All four independently reached the same fix: typed layers (model / workload+SLA / cost-lens / replay-position). This is the load-bearing move; dossiers layered on the current ontology would *document* the conceptual mixing rather than fix it. `[unanimous]`

2. **Attribution laundering is the single largest credibility risk.** A quote anchors a *claim or outcome*, not a full parameter vector. When TeorTaxes says "cost ≤ $4/Mtok," he did not choose your `util:70`, fleet cost, or `stackMult`. Every parameter must carry `support: direct | derived | assumption` and every position must carry `attributionType: quoted-position | reconstruction | calculator-synthesis`. Risk Analyst rates this Critical/High and makes it failure mode #1; the Skeptic's honest-boundary sentence ("only the quoted ceiling is his direct claim; utilization/fleet/batching are this page's translation") creates more credibility than twenty evidence badges. `[unanimous]`

3. **Dossier: one canonical value, never two copies.** Duplicating `v` in the dossier guarantees drift. `[unanimous]` (direction of derivation is disputed — see D1).

4. **Evidence label ≠ confidence, and must come from a controlled enum.** A single "DISCLOSED" badge collapses first-party marketing, regulatory filings, reproducible benchmarks, and a rival CEO's tweet. Separate `sourceClass` (provenance) from uncertainty/range (reliability). `[unanimous]`

5. **Drift tests must assert *effective/resolved* state, not just key coverage.** Structural tests prove reproducibility, not source faithfulness. Required, per convergence across all four: bidirectional coverage over `set` **and** `dive` and **nested blends**; a per-pair *effective scenario ledger* showing each value's origin (model / workload / lens / override) and every *ignored* override; source-registry integrity (URL, class, date, locator); temporal-validity gating; permalink round-trip + migration fixtures; and — critically — a **human semantic-review gate**, because no test can prove a quote entails `util:70`. `[unanimous]`

6. **Reject `reported-margin-implied` as a preset; ship it as a §7 inverse diagnostic with an explicit residual.** The 40–44% figure (which the Empiricist correctly flags is *The Information*/PitchBook reporting, not an audited Anthropic disclosure) inverts to a manifold, not a point. As a preset it "discovers" high costs because it assumes them. `[unanimous]`

7. **§7 dollars-per-Mtok bridge = highest-value C-item** — it repairs the non-additive percentage-bucket category error that triggered the last review — **but it is not an accounting reconciliation** without matching token/revenue denominators. Label it illustrative; name the residual "unreconciled accounting perimeter," not "other." `[unanimous]`

8. **Cache-write economics: real value, naive multiplier is a double-counting trap.** Unanimous, and unusually detailed agreement: partition input into `uncached + write + read` with conservation; a 1.25× write tariff is the *total* write price (not base + another 1.25×); prefill compute is charged **once** per write; Google storage is **token-hours × TTL**, a separate line item, not a per-read multiplier; hit-rate cannot infer write share (need reads-per-write / retention); zero-write must reproduce v2 exactly. If the full lifecycle can't be modeled, **keep the current explicit omission** rather than shipping `cacheWriteMult` and declaring the accounting complete. `[unanimous]`

9. **Permalinks: high value, but IDs-only silently drift.** Freeze full effective numeric state + `schemaVersion` + `engineRevision` + `dataAsOf`; typed allowlist parser, no silent clamping, migration fixtures, round-trip tests, "newer preset available" banner rather than mutating old links. `[unanimous]`

10. **Incompatibility: hard-gate impossible pairs, don't post-hoc warn.** Three states (validated / exploratory / incompatible); suppress the headline for hard-incompatible pairs; preserve an Advanced "force exploratory" escape with a persistent warning. `[unanimous]`

11. **Tornado chart = lowest-priority C-item, "chart theater" risk.** Only after ranges are dossier-sourced; use sourced low/high not slider min/max; group correlated fleet variables; show $/Mtok beside margin; label "one-way local sensitivity, not probability." `[unanimous]`

12. **Roofline: the 25%-average gate is directionally right but insufficient; do not let the rest of the revision depend on it.** Unanimous requirements: preregister formula + metrics before looking at held-out data; hold out **entire platforms/hardware families**, not random rows; no per-platform free coefficient; stratify by prefill/decode and latency regime; report worst-case not just mean; measure in throughput **and** $/Mtok (margins near 100% compress large cost errors); keep anchor-fit as the fallback; run a fresh external review before replacing the deployed engine. `[unanimous]`

13. **UI: one combined "Scenario Provenance" drawer, not a panel per dropdown.** Replace the existing long preset-note (don't add beside it); side-drawer on desktop, bottom-sheet/full-screen on mobile; §10 cards become the *destination* for provider detail ("load this scenario" / "open dossier") and stop duplicating parameter inventories; each surface owns exactly one job (tooltip=define param, dossier=why this scenario sets it, methods box=estimand/perimeter, §10=provider story). `[unanimous]`

14. **The missing axis is not more model names — it's workload/SLA, cache-lifecycle, service-class, and cost-basis selectors.** `[unanimous]`

15. **Model/perspective verdicts with strong convergence:**
    - **DeepSeek V4-Flash → SHIP** (well-grounded 284B/13B + first-party pricing; fleet/throughput labeled low-confidence). `[unanimous]`
    - **Kimi K2.6 → do NOT add separately; fold into a "Kimi 1T/32B lineage" or version subselector** (economically redundant with K2.7). `[unanimous]`
    - **GPT-5.6 Terra/Luna → not as point-estimate architecture presets;** tariff-only / family-variant / range-first (price known, dominant cost driver unidentified → circularity if size is back-inferred from price). `[unanimous]`
    - **Gemini 3.5 Flash → pricing-only / range-first,** clearly labeled fast-tier comparator, not in the normalized frontier table. `[unanimous]`
    - **Anthropic-strategic-partner → merge/rename the existing GPT-Pro/SemiAnalysis lens,** don't add a near-duplicate that manufactures disagreement. `[unanimous]`
    - **xAI cash + opportunity → ship, xAI-scoped only;** opportunity-cost's $5.27 is *bundled capacity value per nominal GPU-hour* (the Empiricist ties it to the SpaceX/xAI SEC filing: ~325k GPUs + infra at $1.25B/mo), **not** pure GPU opportunity cost and **not** production COGS. `[unanimous]`
    - **China public-cloud → dated procurement/cost-basis profile,** scoped to compatible China hardware, bundled CPU/network/support normalized; not evidence of any provider's actual cost. `[unanimous]`
    - **Ant H20 tiers → benchmark/SLO operating-point replays** (714 / 675 / 423 tok/s/GPU across tightening TPOT), not analyst perspectives; latency/SLO becomes first-class. `[unanimous]`
    - **Epoch → defer as a preset** until the roofline actually implements the paper's constraints; at most a source for specific parameter priors. `[unanimous]`

16. **The next external review's attack list is predictable** — false attribution, model/workload conflation, circular inverse, cache double-count, tornado theater, roofline overfit, versionless URLs, dossier decoration, bridge pseudo-reconciliation, coverage theater. All four produced near-identical lists. Pre-empting these *is* the spec. `[unanimous]`

## 2. Disagreements

**D1 — Which object is canonical: `set` or the dossier?**
- **Set-canonical, dossier references it** (Architect, Empiricist; Skeptic offers it as one of two acceptable options): "Keep values in `set`; dossier metadata is keyed by JSON Pointer / `valueRef: 'set.active'`; never a second copy." Rendering reads resolved state.
- **Dossier-canonical, `set` derived** (Risk Analyst): "Use the dossier as the canonical parameter source and derive `set` from it," so provenance and value can never separate at the source.
- **Adjudication — set-canonical wins, and the Risk Analyst's own second-order risk is why.** The Risk Analyst flags that single-source dossier parameters "make editorial source changes capable of changing runtime economics" and require a numerical-review gate on every metadata edit. That failure mode is *created by* dossier-canonical: a citation copy-edit could silently move a margin. Set-canonical with a `valueRef` + a drift test asserting `valueRef` deep-equals live state gets the same anti-drift guarantee without coupling prose edits to economics. Weight the Architect/Empiricist side. (If the team nonetheless prefers dossier-canonical for single-source-of-truth cleanliness, the Risk Analyst's numerical-review-on-metadata-edit gate becomes mandatory, not optional.)

**D2 — GLM-4.7: ship or hold?**
- **Ship** (Skeptic-cautiously, Risk Analyst, Empiricist): 355B/32B + FP8 checkpoint + public pricing are first-party disclosed; strong workhorse comparator at an economically interesting price.
- **Hold** (Architect): GLM-5.2 is already present; add 4.7 only if it owns a uniquely useful production anchor, else it's surface area.
- **Adjudication — ship, but only if it earns a distinct role.** 3-of-4 with the strongest evidence grounding favor shipping, and the grounding is genuinely first-party (Empiricist confirmed both architecture and pricing at source). But the Architect's redundancy point is valid *conditionally*: if 4.7 resolves to nearly the same economics as the existing GLM-5.2 entry, it's another sibling with no new identification. Resolution: ship 4.7 **only if** its tariff/architecture produces a materially different price-floor point than 5.2; otherwise make it a version variant. This is the same "distinct anchor or fold into lineage" test everyone applied to Kimi.

**D3 — Grok 4.3: ship-as-speculative or hold entirely?**
- **Ship, explicitly speculative** (Skeptic, Risk Analyst, Empiricist): price/endpoint disclosed; Musk's 0.5T is a first-party *social* claim (Empiricist: a tweet, not an architecture report); ship with active parameters prominently unidentified and a wide range.
- **Hold** (Architect): the page already carries Grok 4.5 with very weak active-param/throughput evidence; a second closed Grok adds surface, not identification.
- **Adjudication — Architect has the stronger case here, and it's the mirror image of D2.** The three "ship" votes concede everything the Architect worries about (speculative size, wide range), which means the marginal information over the *existing* Grok 4.5 entry is near-zero while the surface-area and conclusion-shopping cost is real. Unless 4.3 replaces 4.5 rather than joining it, hold it. Note the asymmetry with D2: GLM-4.7 clears the "distinct evidence-backed anchor" bar; Grok 4.3 does not.

**D4 — How strict is the roofline pass bar?**
- **Structural only** (Skeptic): no single number; regime-level + worst-case evidence.
- **≤25% median/mean** (Architect); **≤25% grouped MAPE, ≤40% worst-platform** (Empiricist); **≤15% median, ≤25% p80, ≤50% max, ≤5pp downstream margin** (Risk Analyst — the strictest).
- **Adjudication — irreducible until the bakeoff is designed, but the *shape* is settled: a mean/median threshold alone is insufficient; a worst-platform and a downstream-margin bound are mandatory.** The specific numbers can't be adjudicated from the armchair — pick them at preregistration, before anyone sees held-out results (that ordering is the actual load-bearing constraint, and it's unanimous). The Empiricist's deeper point supersedes the threshold debate: **the experiment may be unrunnable** — if H800/H20/GB200/GB300/Ascend are all already known, no genuinely untouched holdout exists, and a compute+HBM+interconnect+residual model has enough degrees of freedom to fit a handful of platform groups mechanically. Require `parameter count < number of independent platform groups` as a hard precondition.

**Skeptic ↔ Architect reconciliation (the structural one).** These two are supposed to be at odds, and the striking result is that they largely aren't: the Architect independently designed in every mitigation the Skeptic demands (ontology split, attribution honesty, single canonical value, cache conservation, versioned URLs, $/Mtok waterfall, roofline-in-parallel). **The Architect's plan survives the Skeptic's strongest critique** — "the full bundle implemented literally triggers a category-error review" (Skeptic's 80%) — precisely *because* it isn't the literal bundle; it's the bundle refactored onto typed layers first. The residual tension is **scope in round one**: the Architect's ship list is more expansive (V4-Flash + Gemini Flash + two xAI lenses + China + Ant simultaneously), while the Skeptic wants V4-Flash + GLM-4.7 *first*, everything else gated behind the ontology and range-first labeling. **Where the Architect's plan must be modified:** anything shipped with unidentified fleet/throughput (Terra, Luna, Gemini Flash, Grok) must render as a labeled *scenario*, never a provider *estimate* — a constraint the Architect states as a load-bearing assumption but is looser about in the ship list than the Skeptic tolerates. Adopt the Skeptic's sequencing (evidence-backed presets first, scenario-priors behind explicit range UI) inside the Architect's layered architecture.

## 3. Open questions

- **Do genuinely untouched, platform-level roofline holdout observations even exist?** If not, the 25%-gate experiment is unrunnable as designed and the honest move is to freeze the anchor-fit model and wait for the next *published* deployment result. (Empiricist — the sharpest open question, and it gates C-item D entirely.)
- **Is the dossier genuinely useful to a SemiAnalysis-tier reader, or decoration?** Undecided until tested. Empiricist proposes the decider: 5 technically literate readers, from a shared scenario link, must answer "which 3 assumptions dominate, which are observed vs assumed, and what would update this?" — ≥4/5 correct within 90 seconds. (Empiricist)
- **Conclusion-shopping is under-addressed by the Architect's design.** Risk Analyst flags that more lenses let a user select the most flattering margin, and prescribes *showing the range across all applicable lenses beside the selected result* — a mitigation absent from the Architect's grouping-only approach. Cross-checked against the design: **gap to close.** (Risk Analyst; synthesis-emergent as a design gap)
- **Shared-URL privacy.** A permalink that freezes full effective state may embed user-entered compute rates or negotiated discounts. Only the Risk Analyst raised it; none of the permalink schemas in the other three carry a share-time warning or a "strip private overrides" option. (Risk Analyst; synthesis-emergent gap)
- **If dossier-canonical is chosen (D1), what is the numerical-review gate on metadata edits?** Left unspecified — it becomes mandatory under that architecture. (synthesis-emergent from D1)
- **Which existing near-duplicate presets get pruned, not just supplemented?** The Architect notes TeorTaxes/Zephyr are near-neighbor bull cases and suggests one generic "throughput-optimized bull" in the primary dropdown. No one costed the churn of removing presets users may have linked to — interacts with permalink migration. (Architect; synthesis-emergent)

## 4. Final recommendation

**Proceed with the revision — but as an ontology refactor first, a feature release second, and a roofline experiment on a separate branch that the rest does not depend on.** Do *not* implement (A)+(B)+(C)+(D) as a literal bundle on the current data model.

Ordered plan (merged from four highly-aligned priority lists):

1. **Refactor presets into typed layers** — model profile / workload+SLA / cost-lens / replay-position — with resolved-provenance compilation. *Prerequisite for everything else.*
2. **Dossier schema:** set-canonical values referenced by `valueRef` (D1); `attributionType` (quoted-position vs reconstruction vs calculator-synthesis) on every position; evidence-label enum separate from uncertainty/range; scope, assumesAway, falsifiers-with-observable-thresholds, temporal validity.
3. **Drift + integrity tests:** effective-scenario ledger per model×perspective pair (value origin + ignored overrides), nested-blend coverage, source-registry integrity, expiry gating, permalink round-trip/migration fixtures — **plus a human semantic-review checklist** for every new quote/label/falsifier.
4. **Hard incompatibility gating** (validated/exploratory/incompatible) with an Advanced force-exploratory escape; **and** display the margin range across applicable lenses beside the selected result (closes the conclusion-shopping gap).
5. **Versioned, frozen permalinks** before expanding the catalog; add a share-time warning/strip for user-entered private rates.
6. **Cache lifecycle** with token-flow conservation + Google token-hours + separate customer-tariff/provider-COGS + zero-write parity — *or keep the current explicit omission if the full model can't be built.* Do not ship a bare `cacheWriteMult`.
7. **§7 dollar waterfall,** single denominator, explicit named residual; reported-margin becomes an inverse diagnostic showing the manifold.
8. **Ship models:** V4-Flash now; GLM-4.7 if it clears the distinct-anchor test (D2); Grok 4.3 held unless it replaces 4.5 (D3); Terra/Luna/Gemini-Flash as pricing-only scenario priors with prominent unknown-parameter ranges; Kimi K2.6 folded into lineage; Anthropic-strategic merged into the existing lens; xAI cash+opportunity xAI-scoped; China dated procurement; Ant SLO replays; Epoch deferred.
9. **One Scenario Provenance drawer** replacing the preset-note; §10 as the detail destination; sourced tornado replacing the active-param chart **last**, only after ranges are defensible.
10. **Roofline** on an experimental branch behind a preregistered, platform-level held-out gate with worst-case + downstream-margin bounds and `params < platform-groups`; keep anchor-fit as primary; fresh external review before any engine swap.

**Confidence.** *High* that the direction is right — four independent xhigh agents converged on the same core (mitigated proceed, ontology-first, attribution honesty, single canonical value, cache conservation, versioned URLs), and the load-bearing facts were corroborated against primary sources by the Empiricist. *Medium-low* on scope and sequencing of round-one presets (the one genuine Skeptic↔Architect residual). *Low* on the roofline timeline and on C-item (D) shipping at all — it's gated by an experiment that may be unrunnable (Empiricist) and by thresholds no one can set until preregistration (Risk Analyst).

**Conditions that would change this:**
- If no untouched platform-level holdout exists → **drop (D) from this revision**, keep anchor-fit, ship (A)/(B)/(C) only.
- If the 5-reader comprehension test fails (<4/5) → the dossier is decoration; simplify to attribution + top-3 unknowns before expanding it.
- If the ontology refactor proves larger than a moderate lift → ship *only* V4-Flash + GLM-4.7 + §7 bridge + versioned permalinks on the refactor, defer the rest, rather than bolting features onto the old model.

**Cheapest decisive next actions (both cheap, both resolve a top open question):**
1. **Preregister and run the roofline bakeoff** — but *first* audit whether any genuinely untouched platform observation exists. If it doesn't, that audit alone (an afternoon) kills (D) honestly and saves the whole build.
2. **The 5-reader dossier comprehension test** on a single shared scenario link, *before* building the full drawer. Decides whether the dossier earns its UI surface.

Both are hours, not days, and each de-risks the two most expensive and most uncertain pieces of the plan.

## 5. Attribution map

| Claim | Contributing agent(s) |
|---|---|
| Split ontology into typed layers before adding presets | Skeptic, Architect, Risk-Analyst, Empiricist |
| Attribution laundering is the #1 credibility risk; `support` + `attributionType` fields | Risk-Analyst (lead), Skeptic, Architect, Empiricist |
| One canonical value; **set-canonical beats dossier-canonical** | Architect, Empiricist (set); Risk-Analyst (dossier, dissent); Skeptic (neutral) |
| Editorial metadata edit silently moving economics (the D1 risk) | Risk-Analyst |
| Evidence label ≠ confidence; controlled enum | Skeptic, Architect, Risk-Analyst, Empiricist |
| Drift tests must assert effective/resolved state + human semantic gate | Skeptic, Empiricist (lead on `dive`/effective-state gap), Risk-Analyst, Architect |
| Reject reported-margin preset → inverse diagnostic | Skeptic, Architect, Risk-Analyst, Empiricist |
| §7 $/Mtok bridge = highest value, illustrative not reconciliation | Skeptic, Architect, Risk-Analyst, Empiricist |
| Cache token-flow conservation; 1.25× is total; Google token-hours; keep omission if unmodelable | Skeptic, Architect, Risk-Analyst, Empiricist |
| Versioned frozen permalinks; IDs-only drift | Skeptic, Architect, Risk-Analyst, Empiricist |
| Shared-URL leaks user rates → warn/strip | Risk-Analyst |
| Hard incompatibility gating + range-across-lenses display | Risk-Analyst (lead), Skeptic, Architect, Empiricist |
| Tornado last; chart-theater risk | Skeptic, Architect, Risk-Analyst, Empiricist |
| Roofline gate insufficient at 25%-mean; platform-level holdout, worst-case, keep fallback | Skeptic, Architect, Risk-Analyst, Empiricist |
| Roofline may be unrunnable (no untouched holdout; DoF > platform groups) | Empiricist |
| Strictest numeric roofline thresholds (≤15% median / ≤5pp margin) | Risk-Analyst |
| V4-Flash ship; Kimi→lineage; Terra/Luna/Gemini pricing-only; Anthropic-strategic merge; xAI xAI-scoped; China procurement; Ant SLO replays; Epoch defer | Skeptic, Architect, Risk-Analyst, Empiricist |
| GLM-4.7 ship (vs Architect hold) | Skeptic, Risk-Analyst, Empiricist (ship); Architect (hold) |
| Grok 4.3 hold unless it replaces 4.5 | Architect (lead); Skeptic/Risk-Analyst/Empiricist (ship-speculative) |
| One combined provenance drawer; §10 as destination; per-surface single job | Skeptic, Architect, Risk-Analyst, Empiricist |
| Primary-source grounding of every preset/tariff claim | Empiricist |
| 5-reader dossier comprehension test as the decoration-vs-useful decider | Empiricist |
| Next-review attack list (attribution, conflation, circular, double-count, overfit, versionless, decoration) | Skeptic, Architect, Risk-Analyst (all near-identical) |
